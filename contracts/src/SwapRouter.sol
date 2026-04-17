// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {IERC20}         from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {SafeERC20}      from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import {Ownable}        from "@openzeppelin/contracts/access/Ownable.sol";
import {ReentrancyGuard} from "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

import {SkillRegistry}  from "./SkillRegistry.sol";
import {SkillRunToken}  from "./SkillRunToken.sol";
import {IReputationHub} from "./interfaces/IReputationHub.sol";

/**
 * @title SwapRouter
 * @notice Agent-facing entry point for the Maiat commerce layer.
 *
 *  Three flows:
 *   - {buyRunToken} — USDC → RUN_TOKEN credits (pre-buy, no execution yet)
 *   - {executeSkill} — burn 1 RUN_TOKEN → off-chain execution request
 *   - {swap}        — 1-shot: direct USDC → execution (skips token mint)
 *
 *  All three enforce the reputation gate first, then token/USDC movement.
 *  Off-chain execution is requested via {ExecutionRequested} event; the
 *  gateway settles with a signed proof via {settle}.
 *
 * @dev Phase 2 intentionally does NOT delegate to ERC-8183 `AgenticCommerceHooked`
 *      because that contract's `createJob` makes `msg.sender` the `client`,
 *      which would mask the agent identity from hooks. A Phase 2.5 patch to
 *      accept an explicit actor address will let us re-delegate. See ADR
 *      `2026-04-16-tokens-as-interface-reputation-as-allocation.md`.
 */
contract SwapRouter is Ownable, ReentrancyGuard {
    using SafeERC20 for IERC20;

    // ─────────────────────────────────────────────
    //  Types
    // ─────────────────────────────────────────────

    enum RequestStatus { None, Pending, Settled, Refunded }

    struct Request {
        bytes32       skillId;
        address       agent;
        uint256       amountUSDC;
        uint256       timestamp;
        RequestStatus status;
    }

    // ─────────────────────────────────────────────
    //  Constants
    // ─────────────────────────────────────────────

    uint256 public constant MAX_BPS     = 10_000;
    uint32  public constant REQUEST_TTL = 15 minutes; // agent self-refund after TTL

    // ─────────────────────────────────────────────
    //  Immutables
    // ─────────────────────────────────────────────

    SkillRegistry  public immutable registry;
    IReputationHub public immutable reputation;
    IERC20         public immutable usdc;

    // ─────────────────────────────────────────────
    //  State
    // ─────────────────────────────────────────────

    address public gateway;           // trusted off-chain executor
    address public platformTreasury;  // platform fee recipient
    address public reputationPool;    // reputation pool recipient
    uint16  public platformBps    = 500;  // 5%
    uint16  public reputationBps  = 500;  // 5%

    mapping(bytes32 => Request) public requests;
    uint256 private _nonce;

    // ─────────────────────────────────────────────
    //  Events
    // ─────────────────────────────────────────────

    event GatewayUpdated(address indexed oldGateway, address indexed newGateway);
    event TreasuryUpdated(address indexed platform, address indexed reputationPool);
    event FeesUpdated(uint16 platformBps, uint16 reputationBps);

    event RunTokenBought(
        bytes32 indexed skillId,
        address indexed agent,
        uint256 amount,
        uint256 costUSDC
    );
    event ExecutionRequested(
        bytes32 indexed requestId,
        bytes32 indexed skillId,
        address indexed agent,
        uint256 amountUSDC,
        bytes   params
    );
    event ExecutionSettled(
        bytes32 indexed requestId,
        bytes32 indexed skillId,
        bool    success,
        bytes32 resultHash,
        uint256 creatorShare,
        uint256 platformShare,
        uint256 reputationShare
    );
    event ExecutionRefunded(bytes32 indexed requestId, address indexed agent, uint256 amount);

    // ─────────────────────────────────────────────
    //  Errors
    // ─────────────────────────────────────────────

    error SkillInactive(bytes32 skillId);
    error InsufficientReputation(uint256 required, uint256 actual);
    error ZeroAmount();
    error ZeroAddress();
    error InvalidBps();
    error NotGateway();
    error RequestNotFound(bytes32 requestId);
    error RequestNotPending(bytes32 requestId);
    error RequestNotExpired(bytes32 requestId);
    error NotRequester();

    // ─────────────────────────────────────────────
    //  Constructor
    // ─────────────────────────────────────────────

    constructor(
        SkillRegistry  registry_,
        IReputationHub reputation_,
        IERC20         usdc_,
        address        gateway_,
        address        platformTreasury_,
        address        reputationPool_
    ) Ownable(msg.sender) {
        if (address(registry_)   == address(0) ||
            address(reputation_) == address(0) ||
            address(usdc_)       == address(0) ||
            gateway_             == address(0) ||
            platformTreasury_    == address(0) ||
            reputationPool_      == address(0)) revert ZeroAddress();
        registry          = registry_;
        reputation        = reputation_;
        usdc              = usdc_;
        gateway           = gateway_;
        platformTreasury  = platformTreasury_;
        reputationPool    = reputationPool_;
    }

    // ─────────────────────────────────────────────
    //  Agent: buy RUN_TOKEN (bulk pre-purchase)
    // ─────────────────────────────────────────────

    function buyRunToken(bytes32 skillId, uint256 amount) external nonReentrant {
        if (amount == 0) revert ZeroAmount();
        SkillRegistry.Skill memory s = registry.getSkill(skillId);
        if (!s.active) revert SkillInactive(skillId);
        _requireReputation(msg.sender, s.minReputation);

        uint256 cost = s.priceUSDC * amount;

        // Pull USDC from agent into router, approve registry, deposit into treasury.
        usdc.safeTransferFrom(msg.sender, address(this), cost);
        usdc.forceApprove(address(registry), cost);
        registry.depositTreasury(skillId, cost);

        SkillRunToken(s.runToken).mint(msg.sender, amount);
        emit RunTokenBought(skillId, msg.sender, amount, cost);
    }

    // ─────────────────────────────────────────────
    //  Agent: execute via RUN_TOKEN
    // ─────────────────────────────────────────────

    function executeSkill(bytes32 skillId, bytes calldata params)
        external
        nonReentrant
        returns (bytes32 requestId)
    {
        SkillRegistry.Skill memory s = registry.getSkill(skillId);
        if (!s.active) revert SkillInactive(skillId);
        _requireReputation(msg.sender, s.minReputation);

        SkillRunToken(s.runToken).burn(msg.sender, 1);
        registry.releaseTreasury(skillId, address(this), s.priceUSDC);

        requestId = _openRequest(skillId, msg.sender, s.priceUSDC, params);
    }

    // ─────────────────────────────────────────────
    //  Agent: 1-shot swap (skip RUN_TOKEN mint/burn)
    // ─────────────────────────────────────────────

    function swap(bytes32 skillId, bytes calldata params)
        external
        nonReentrant
        returns (bytes32 requestId)
    {
        SkillRegistry.Skill memory s = registry.getSkill(skillId);
        if (!s.active) revert SkillInactive(skillId);
        _requireReputation(msg.sender, s.minReputation);

        usdc.safeTransferFrom(msg.sender, address(this), s.priceUSDC);

        requestId = _openRequest(skillId, msg.sender, s.priceUSDC, params);
    }

    // ─────────────────────────────────────────────
    //  Gateway: settle
    // ─────────────────────────────────────────────

    /**
     * @notice Finalise an execution request.
     *  On success: split USDC between creator / platform / reputation pool.
     *  On failure: refund the full amount to the agent.
     */
    function settle(
        bytes32 requestId,
        bool    success,
        bytes32 resultHash
    ) external nonReentrant {
        if (msg.sender != gateway) revert NotGateway();
        Request storage r = requests[requestId];
        if (r.status == RequestStatus.None) revert RequestNotFound(requestId);
        if (r.status != RequestStatus.Pending) revert RequestNotPending(requestId);

        SkillRegistry.Skill memory s = registry.getSkill(r.skillId);
        uint256 amount = r.amountUSDC;

        if (success) {
            r.status = RequestStatus.Settled;
            uint256 platformShare   = (amount * platformBps)   / MAX_BPS;
            uint256 reputationShare = (amount * reputationBps) / MAX_BPS;
            uint256 creatorShare    = amount - platformShare - reputationShare;

            if (creatorShare    > 0) usdc.safeTransfer(s.creator,        creatorShare);
            if (platformShare   > 0) usdc.safeTransfer(platformTreasury, platformShare);
            if (reputationShare > 0) usdc.safeTransfer(reputationPool,   reputationShare);

            emit ExecutionSettled(
                requestId, r.skillId, true, resultHash,
                creatorShare, platformShare, reputationShare
            );
        } else {
            r.status = RequestStatus.Refunded;
            usdc.safeTransfer(r.agent, amount);
            emit ExecutionRefunded(requestId, r.agent, amount);
        }
    }

    /// @notice Agent self-refund after TTL expiry (gateway never settled).
    function claimRefund(bytes32 requestId) external nonReentrant {
        Request storage r = requests[requestId];
        if (r.status == RequestStatus.None) revert RequestNotFound(requestId);
        if (r.status != RequestStatus.Pending) revert RequestNotPending(requestId);
        if (r.agent != msg.sender) revert NotRequester();
        if (block.timestamp < r.timestamp + REQUEST_TTL) revert RequestNotExpired(requestId);

        r.status = RequestStatus.Refunded;
        usdc.safeTransfer(r.agent, r.amountUSDC);
        emit ExecutionRefunded(requestId, r.agent, r.amountUSDC);
    }

    // ─────────────────────────────────────────────
    //  Admin
    // ─────────────────────────────────────────────

    function setGateway(address newGateway) external onlyOwner {
        if (newGateway == address(0)) revert ZeroAddress();
        emit GatewayUpdated(gateway, newGateway);
        gateway = newGateway;
    }

    function setTreasuries(address newPlatform, address newReputationPool) external onlyOwner {
        if (newPlatform == address(0) || newReputationPool == address(0)) revert ZeroAddress();
        platformTreasury  = newPlatform;
        reputationPool    = newReputationPool;
        emit TreasuryUpdated(newPlatform, newReputationPool);
    }

    function setFees(uint16 platformBps_, uint16 reputationBps_) external onlyOwner {
        if (uint256(platformBps_) + uint256(reputationBps_) >= MAX_BPS) revert InvalidBps();
        platformBps   = platformBps_;
        reputationBps = reputationBps_;
        emit FeesUpdated(platformBps_, reputationBps_);
    }

    // ─────────────────────────────────────────────
    //  Internal
    // ─────────────────────────────────────────────

    function _requireReputation(address agent, uint256 minRep) internal view {
        if (minRep == 0) return; // Day-1 fast path — every skill registers with 0
        uint256 score = reputation.scoreOf(agent);
        if (score < minRep) revert InsufficientReputation(minRep, score);
    }

    function _openRequest(
        bytes32 skillId,
        address agent,
        uint256 amount,
        bytes calldata params
    ) internal returns (bytes32 requestId) {
        unchecked { _nonce++; }
        requestId = keccak256(abi.encodePacked(skillId, agent, block.timestamp, _nonce, block.chainid));
        requests[requestId] = Request({
            skillId:    skillId,
            agent:      agent,
            amountUSDC: amount,
            timestamp:  block.timestamp,
            status:     RequestStatus.Pending
        });
        emit ExecutionRequested(requestId, skillId, agent, amount, params);
    }
}
