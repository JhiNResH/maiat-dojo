// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/token/ERC1155/ERC1155.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/interfaces/IERC2981.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/introspection/ERC165.sol";

/**
 * @title SkillNFT
 * @notice ERC-1155 contract for agent skills in the Maiat ecosystem.
 *         Skills can be created by the owner and purchased with USDC.
 *         Payments are auto-split between creator, platform wallet, and reputation pool.
 *         Each skill stores royaltyBps for use by SkillRoyaltySplitter in Agent Services.
 */
contract SkillNFT is ERC1155, IERC2981, Ownable {
    using SafeERC20 for IERC20;

    // ─────────────────────────────────────────────
    //  Types
    // ─────────────────────────────────────────────

    struct Skill {
        uint256 price;       // USDC price (6 decimals)
        address creator;     // Skill creator address
        uint16  royaltyBps;  // Royalty in basis points (for Agent Services, see SkillRoyaltySplitter)
        string  uri;         // Metadata URI
        uint256 totalSold;   // Total units sold
        bool    active;      // Can be purchased
    }

    // ─────────────────────────────────────────────
    //  State
    // ─────────────────────────────────────────────

    /// @notice USDC token used for all payments
    IERC20 public immutable usdc;

    /// @notice Platform fee in basis points (default 10% = 1000)
    uint16 public platformFeeBps;

    /// @notice Reputation pool fee in basis points (default 5% = 500)
    uint16 public reputationPoolBps;

    /// @notice Address that receives platform fees
    address public platformWallet;

    /// @notice Address that receives reputation pool fees
    address public reputationPool;

    /// @notice Auto-incrementing skill ID counter
    uint256 public nextSkillId;

    /// @notice skillId → Skill data
    mapping(uint256 => Skill) public skills;

    // ─────────────────────────────────────────────
    //  Events
    // ─────────────────────────────────────────────

    event SkillCreated(
        uint256 indexed skillId,
        address indexed creator,
        uint256 price,
        uint16 royaltyBps,
        string uri
    );

    event SkillPurchased(
        uint256 indexed skillId,
        address indexed buyer,
        address indexed recipient,
        uint256 price,
        uint256 creatorShare,
        uint256 platformShare,
        uint256 reputationShare
    );

    event PlatformFeeUpdated(uint16 newBps);
    event ReputationPoolFeeUpdated(uint16 newBps);
    event PlatformWalletUpdated(address newWallet);
    event ReputationPoolUpdated(address newPool);

    // ─────────────────────────────────────────────
    //  Errors
    // ─────────────────────────────────────────────

    error InvalidSkillId(uint256 skillId);
    error InvalidAddress();
    error InvalidBps();
    error InsufficientBalance();

    // ─────────────────────────────────────────────
    //  Constructor
    // ─────────────────────────────────────────────

    /**
     * @param _usdc           USDC token address (Base mainnet: 0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913)
     * @param _platformWallet Address to receive platform fees
     * @param _reputationPool Address to receive reputation pool fees
     */
    constructor(
        address _usdc,
        address _platformWallet,
        address _reputationPool
    ) ERC1155("") Ownable(msg.sender) {
        if (_usdc == address(0) || _platformWallet == address(0) || _reputationPool == address(0)) {
            revert InvalidAddress();
        }
        usdc = IERC20(_usdc);
        platformWallet = _platformWallet;
        reputationPool = _reputationPool;
        platformFeeBps = 1000;     // 10%
        reputationPoolBps = 500;   // 5%
    }

    // ─────────────────────────────────────────────
    //  Admin: Skill Management
    // ─────────────────────────────────────────────

    /**
     * @notice Create a new skill type. Only callable by owner.
     * @param price       USDC price in 6-decimal units
     * @param creator     Address that receives creator share of sales
     * @param royaltyBps  Royalty in basis points (stored for SkillRoyaltySplitter)
     * @param uri_        Metadata URI for this skill token
     * @return skillId    The newly created skill's ID
     */
    function createSkill(
        uint256 price,
        address creator,
        uint16 royaltyBps,
        string calldata uri_
    ) external onlyOwner returns (uint256 skillId) {
        if (creator == address(0)) revert InvalidAddress();
        if (royaltyBps > 10000) revert InvalidBps();

        skillId = nextSkillId++;
        skills[skillId] = Skill({
            price: price,
            creator: creator,
            royaltyBps: royaltyBps,
            uri: uri_,
            totalSold: 0,
            active: true
        });

        emit SkillCreated(skillId, creator, price, royaltyBps, uri_);
    }

    // ─────────────────────────────────────────────
    //  Public: Purchase
    // ─────────────────────────────────────────────

    /**
     * @notice Buy a skill. Caller pays USDC; payment is auto-split.
     *         Split: creator = 100% - platformFeeBps - reputationPoolBps
     *                platform = platformFeeBps
     *                reputation pool = reputationPoolBps
     * @param skillId   The skill to purchase
     * @param recipient Address that receives the NFT
     */
    function buySkill(uint256 skillId, address recipient) external {
        if (skillId >= nextSkillId) revert InvalidSkillId(skillId);
        if (recipient == address(0)) revert InvalidAddress();

        Skill storage skill = skills[skillId];
        require(skill.active, "skill inactive");
        uint256 price = skill.price;

        // Check buyer has enough balance (nice error message)
        if (usdc.balanceOf(msg.sender) < price) revert InsufficientBalance();

        // Calculate splits
        uint256 platformShare    = (price * platformFeeBps) / 10000;
        uint256 reputationShare  = (price * reputationPoolBps) / 10000;
        uint256 creatorShare     = price - platformShare - reputationShare;

        // Pull full amount from buyer first
        usdc.safeTransferFrom(msg.sender, address(this), price);

        // Distribute
        if (creatorShare > 0) {
            usdc.safeTransfer(skill.creator, creatorShare);
        }
        if (platformShare > 0) {
            usdc.safeTransfer(platformWallet, platformShare);
        }
        if (reputationShare > 0) {
            usdc.safeTransfer(reputationPool, reputationShare);
        }

        // Mint the skill token
        skill.totalSold++;
        _mint(recipient, skillId, 1, "");

        emit SkillPurchased(
            skillId,
            msg.sender,
            recipient,
            price,
            creatorShare,
            platformShare,
            reputationShare
        );
    }

    // ─────────────────────────────────────────────
    //  ERC-1155 URI
    // ─────────────────────────────────────────────

    /**
     * @notice Deactivate a skill (no more purchases).
     */
    function deactivateSkill(uint256 skillId) external onlyOwner {
        if (skillId >= nextSkillId) revert InvalidSkillId(skillId);
        skills[skillId].active = false;
    }

    /**
     * @notice Get full skill info.
     */
    function getSkill(uint256 skillId) external view returns (Skill memory) {
        return skills[skillId];
    }

    /**
     * @notice Get creator address for a skill.
     */
    function getCreator(uint256 skillId) external view returns (address) {
        return skills[skillId].creator;
    }

    /**
     * @notice Returns the metadata URI for a given skill token.
     */
    function uri(uint256 skillId) public view override returns (string memory) {
        if (skillId >= nextSkillId) revert InvalidSkillId(skillId);
        return skills[skillId].uri;
    }

    // ─────────────────────────────────────────────
    //  ERC-2981 Royalty Info
    // ─────────────────────────────────────────────

    /**
     * @notice Returns royalty info for a skill token per ERC-2981.
     * @param skillId    Token ID
     * @param salePrice  Sale price in any currency
     * @return receiver  The creator address
     * @return royaltyAmount  The royalty amount based on royaltyBps
     */
    function royaltyInfo(uint256 skillId, uint256 salePrice)
        external
        view
        override
        returns (address receiver, uint256 royaltyAmount)
    {
        if (skillId >= nextSkillId) revert InvalidSkillId(skillId);
        Skill storage skill = skills[skillId];
        receiver = skill.creator;
        royaltyAmount = (salePrice * skill.royaltyBps) / 10000;
    }

    // ─────────────────────────────────────────────
    //  Admin: Fee & Address Updates
    // ─────────────────────────────────────────────

    /// @notice Update platform fee (in bps). Max combined fees must be < 10000.
    function setPlatformFeeBps(uint16 newBps) external onlyOwner {
        if (newBps + reputationPoolBps >= 10000) revert InvalidBps();
        platformFeeBps = newBps;
        emit PlatformFeeUpdated(newBps);
    }

    /// @notice Update reputation pool fee (in bps).
    function setReputationPoolBps(uint16 newBps) external onlyOwner {
        if (platformFeeBps + newBps >= 10000) revert InvalidBps();
        reputationPoolBps = newBps;
        emit ReputationPoolFeeUpdated(newBps);
    }

    /// @notice Update platform wallet address.
    function setPlatformWallet(address newWallet) external onlyOwner {
        if (newWallet == address(0)) revert InvalidAddress();
        platformWallet = newWallet;
        emit PlatformWalletUpdated(newWallet);
    }

    /// @notice Update reputation pool address.
    function setReputationPool(address newPool) external onlyOwner {
        if (newPool == address(0)) revert InvalidAddress();
        reputationPool = newPool;
        emit ReputationPoolUpdated(newPool);
    }

    // ─────────────────────────────────────────────
    //  ERC-165 Introspection
    // ─────────────────────────────────────────────

    function supportsInterface(bytes4 interfaceId)
        public
        view
        override(ERC1155, IERC165)
        returns (bool)
    {
        return
            interfaceId == type(IERC2981).interfaceId ||
            super.supportsInterface(interfaceId);
    }
}
