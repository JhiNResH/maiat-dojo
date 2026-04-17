// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {IERC20}         from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {SafeERC20}      from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import {Ownable}        from "@openzeppelin/contracts/access/Ownable.sol";
import {ReentrancyGuard} from "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import {Create2}        from "@openzeppelin/contracts/utils/Create2.sol";

import {SkillRunToken}  from "./SkillRunToken.sol";

/**
 * @title SkillRegistry
 * @notice Permissionless registry of skills. Each registration:
 *         - Assigns a unique skillId (keccak256 of slug)
 *         - Deploys a dedicated SkillRunToken (ERC-20 per skill) via CREATE2
 *         - Records provider, creator, price, metadata, reputation floor
 *         - Opens a per-skill USDC treasury for pre-paid executions
 *
 * @dev Part of the Phase 2 Tokenized Agent Commerce architecture. See
 *      `specs/2026-04-16-agent-commerce-protocol.md` and ADR
 *      `2026-04-16-tokens-as-interface-reputation-as-allocation.md`.
 *
 * @dev The SwapRouter is the sole caller of {depositTreasury}/{releaseTreasury}.
 *      Providers set price, active, metadata, and reputation floor.
 */
contract SkillRegistry is Ownable, ReentrancyGuard {
    using SafeERC20 for IERC20;

    // ─────────────────────────────────────────────
    //  Types
    // ─────────────────────────────────────────────

    struct Skill {
        address provider;       // registrar (msg.sender at register time)
        address creator;        // payment recipient — may differ from provider
        address runToken;       // CREATE2-deployed ERC-20
        uint256 priceUSDC;      // 6 decimals
        uint256 minReputation;  // gate floor (0 = open)
        string  metadataURI;    // IPFS: name, description, schema
        bytes32 gatewaySlug;    // off-chain routing key
        uint8   category;       // 0 = skill, 1 = item (Phase 4), 2 = service (Phase 4)
        bool    active;
        uint64  registeredAt;
    }

    // ─────────────────────────────────────────────
    //  Constants
    // ─────────────────────────────────────────────

    uint256 public constant MIN_PRICE = 1_000; // 0.001 USDC

    // ─────────────────────────────────────────────
    //  State
    // ─────────────────────────────────────────────

    /// @notice Payment token (USDC, 6 decimals on BSC; 18 on mainnet — see deploy script).
    IERC20 public immutable usdc;

    /// @notice Authorised router — sole caller of treasury ops.
    address public router;

    /// @notice skillId => Skill
    mapping(bytes32 => Skill) public skills;

    /// @notice skillId => USDC held against unexecuted RUN_TOKENs
    mapping(bytes32 => uint256) public treasury;

    // ─────────────────────────────────────────────
    //  Events
    // ─────────────────────────────────────────────

    event RouterUpdated(address indexed oldRouter, address indexed newRouter);

    event SkillRegistered(
        bytes32 indexed skillId,
        address indexed provider,
        address indexed creator,
        address runToken,
        uint256 priceUSDC,
        uint256 minReputation,
        uint8   category,
        bytes32 gatewaySlug
    );

    event SkillPriceUpdated(bytes32 indexed skillId, uint256 oldPrice, uint256 newPrice);
    event SkillActiveChanged(bytes32 indexed skillId, bool active);
    event SkillMetadataUpdated(bytes32 indexed skillId, string uri);
    event SkillMinReputationUpdated(bytes32 indexed skillId, uint256 oldFloor, uint256 newFloor);

    event TreasuryDeposited(bytes32 indexed skillId, uint256 amount, uint256 newBalance);
    event TreasuryReleased(bytes32 indexed skillId, address indexed to, uint256 amount, uint256 newBalance);

    // ─────────────────────────────────────────────
    //  Errors
    // ─────────────────────────────────────────────

    error SkillAlreadyRegistered(bytes32 skillId);
    error SkillNotFound(bytes32 skillId);
    error NotSkillProvider(bytes32 skillId);
    error NotRouter();
    error RouterNotSet();
    error ZeroAddress();
    error EmptySlug();
    error PriceTooLow(uint256 price, uint256 minPrice);
    error InsufficientTreasury(uint256 requested, uint256 available);

    // ─────────────────────────────────────────────
    //  Modifiers
    // ─────────────────────────────────────────────

    modifier onlyRouter() {
        if (msg.sender != router) revert NotRouter();
        _;
    }

    // ─────────────────────────────────────────────
    //  Constructor
    // ─────────────────────────────────────────────

    constructor(IERC20 usdc_) Ownable(msg.sender) {
        if (address(usdc_) == address(0)) revert ZeroAddress();
        usdc = usdc_;
    }

    /// @notice Wire the SwapRouter post-deploy (circular constructor avoided).
    function setRouter(address router_) external onlyOwner {
        if (router_ == address(0)) revert ZeroAddress();
        emit RouterUpdated(router, router_);
        router = router_;
    }

    // ─────────────────────────────────────────────
    //  Provider: register + maintain
    // ─────────────────────────────────────────────

    /**
     * @notice Register a new skill (permissionless). Deploys a SkillRunToken
     *         at the CREATE2 address derived from the skillId.
     * @param slug           Human-readable slug (used for skillId and token name).
     * @param priceUSDC      Per-execution cost (6 decimals, >= MIN_PRICE).
     * @param creator        Payment recipient. May equal provider.
     * @param metadataURI    IPFS / arweave URI with full skill metadata.
     * @param gatewaySlug    Off-chain routing key (keccak256 of backend slug).
     * @param category       0 = skill, 1 = item, 2 = service.
     * @param minReputation  Reputation gate floor for this skill. 0 = open.
     * @return skillId       keccak256(bytes(slug)).
     * @return runToken      Deployed SkillRunToken address.
     */
    function register(
        string calldata slug,
        uint256 priceUSDC,
        address creator,
        string calldata metadataURI,
        bytes32 gatewaySlug,
        uint8 category,
        uint256 minReputation
    ) external nonReentrant returns (bytes32 skillId, address runToken) {
        if (router == address(0)) revert RouterNotSet();
        if (bytes(slug).length == 0) revert EmptySlug();
        if (creator == address(0)) revert ZeroAddress();
        if (priceUSDC < MIN_PRICE) revert PriceTooLow(priceUSDC, MIN_PRICE);

        skillId = keccak256(bytes(slug));
        if (skills[skillId].provider != address(0)) revert SkillAlreadyRegistered(skillId);

        runToken = _deployRunToken(skillId, slug);

        skills[skillId] = Skill({
            provider:       msg.sender,
            creator:        creator,
            runToken:       runToken,
            priceUSDC:      priceUSDC,
            minReputation:  minReputation,
            metadataURI:    metadataURI,
            gatewaySlug:    gatewaySlug,
            category:       category,
            active:         true,
            registeredAt:   uint64(block.timestamp)
        });

        emit SkillRegistered(
            skillId, msg.sender, creator, runToken,
            priceUSDC, minReputation, category, gatewaySlug
        );
    }

    function setPrice(bytes32 skillId, uint256 newPrice) external {
        Skill storage s = _mutableSkill(skillId, msg.sender);
        if (newPrice < MIN_PRICE) revert PriceTooLow(newPrice, MIN_PRICE);
        emit SkillPriceUpdated(skillId, s.priceUSDC, newPrice);
        s.priceUSDC = newPrice;
    }

    function setActive(bytes32 skillId, bool active) external {
        Skill storage s = skills[skillId];
        if (s.provider == address(0)) revert SkillNotFound(skillId);
        // Provider OR protocol owner may deactivate (safety valve).
        if (msg.sender != s.provider && msg.sender != owner()) {
            revert NotSkillProvider(skillId);
        }
        s.active = active;
        emit SkillActiveChanged(skillId, active);
    }

    function setMetadata(bytes32 skillId, string calldata uri) external {
        Skill storage s = _mutableSkill(skillId, msg.sender);
        s.metadataURI = uri;
        emit SkillMetadataUpdated(skillId, uri);
    }

    function setMinReputation(bytes32 skillId, uint256 newFloor) external {
        Skill storage s = _mutableSkill(skillId, msg.sender);
        emit SkillMinReputationUpdated(skillId, s.minReputation, newFloor);
        s.minReputation = newFloor;
    }

    // ─────────────────────────────────────────────
    //  Router: treasury ops
    // ─────────────────────────────────────────────

    /// @notice Called by SwapRouter on buy. Pulls USDC from caller.
    function depositTreasury(bytes32 skillId, uint256 amount) external onlyRouter nonReentrant {
        if (skills[skillId].provider == address(0)) revert SkillNotFound(skillId);
        usdc.safeTransferFrom(msg.sender, address(this), amount);
        treasury[skillId] += amount;
        emit TreasuryDeposited(skillId, amount, treasury[skillId]);
    }

    /// @notice Called by SwapRouter on execute. Releases USDC to destination.
    function releaseTreasury(bytes32 skillId, address to, uint256 amount)
        external
        onlyRouter
        nonReentrant
    {
        if (skills[skillId].provider == address(0)) revert SkillNotFound(skillId);
        if (to == address(0)) revert ZeroAddress();
        uint256 bal = treasury[skillId];
        if (amount > bal) revert InsufficientTreasury(amount, bal);
        unchecked { treasury[skillId] = bal - amount; }
        usdc.safeTransfer(to, amount);
        emit TreasuryReleased(skillId, to, amount, treasury[skillId]);
    }

    // ─────────────────────────────────────────────
    //  Views
    // ─────────────────────────────────────────────

    function getSkill(bytes32 skillId) external view returns (Skill memory) {
        Skill memory s = skills[skillId];
        if (s.provider == address(0)) revert SkillNotFound(skillId);
        return s;
    }

    /// @notice CREATE2 address predicted for a skillId. View-safe (no deploy).
    function computeRunTokenAddress(bytes32 skillId, string calldata slug)
        external
        view
        returns (address predicted)
    {
        bytes memory bytecode = abi.encodePacked(
            type(SkillRunToken).creationCode,
            abi.encode(
                skillId,
                address(this),
                router,
                _runTokenName(slug),
                _runTokenSymbol(skillId)
            )
        );
        predicted = Create2.computeAddress(skillId, keccak256(bytecode));
    }

    // ─────────────────────────────────────────────
    //  Internal
    // ─────────────────────────────────────────────

    function _mutableSkill(bytes32 skillId, address caller) internal view returns (Skill storage s) {
        s = skills[skillId];
        if (s.provider == address(0)) revert SkillNotFound(skillId);
        if (caller != s.provider) revert NotSkillProvider(skillId);
    }

    function _deployRunToken(bytes32 skillId, string calldata slug) internal returns (address) {
        bytes memory bytecode = abi.encodePacked(
            type(SkillRunToken).creationCode,
            abi.encode(
                skillId,
                address(this),
                router,
                _runTokenName(slug),
                _runTokenSymbol(skillId)
            )
        );
        return Create2.deploy(0, skillId, bytecode);
    }

    function _runTokenName(string calldata slug) internal pure returns (string memory) {
        return string(abi.encodePacked("Maiat Skill: ", slug));
    }

    function _runTokenSymbol(bytes32 skillId) internal pure returns (string memory) {
        // MSK-<first 8 hex of skillId>
        bytes memory hexChars = "0123456789abcdef";
        bytes memory out = new bytes(12); // "MSK-" + 8 chars
        out[0] = "M"; out[1] = "S"; out[2] = "K"; out[3] = "-";
        uint256 v = uint256(skillId);
        // Write top 32 bits as 8 hex chars.
        for (uint256 i = 0; i < 8; i++) {
            uint256 shift = (7 - i) * 4 + 224; // 224..252 stepping by -4
            out[4 + i] = hexChars[(v >> shift) & 0xf];
        }
        return string(out);
    }
}
