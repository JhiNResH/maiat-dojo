// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {IReputationHub} from "./interfaces/IReputationHub.sol";
import {ITrustOracle}   from "./interfaces/ITrustOracle.sol";
import {Ownable}        from "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title ReputationHub
 * @notice Thin wrapper around an ITrustOracle implementation (e.g. DojoTrustScore).
 *
 * @dev Phase 2 of the Maiat commerce stack reads reputation exclusively through
 *      this hub. Swapping the oracle later (multi-dim, on-chain aggregator, off-
 *      chain attestation merge) is an owner action — no consumer redeploy needed.
 *
 * @dev See ADR `2026-04-16-tokens-as-interface-reputation-as-allocation.md`.
 */
contract ReputationHub is IReputationHub, Ownable {
    /// @notice Current active trust oracle source.
    ITrustOracle public oracle;

    /// @notice F6: pending oracle proposed by owner; must be accepted after delay.
    ITrustOracle public pendingOracle;

    /// @notice Earliest timestamp at which pendingOracle can be accepted (48-hour delay).
    uint256 public oracleAcceptableAt;

    uint256 public constant ORACLE_DELAY = 48 hours;

    event OracleProposed(address indexed proposed, uint256 acceptableAt);
    event OracleUpdated(address indexed oldOracle, address indexed newOracle);
    event OracleProposalCancelled();

    error ZeroAddress();
    error NoOraclePending();
    error OracleDelayNotElapsed(uint256 acceptableAt);

    constructor(ITrustOracle oracle_) Ownable(msg.sender) {
        if (address(oracle_) == address(0)) revert ZeroAddress();
        oracle = oracle_;
    }

    /// @notice Propose a new oracle. Takes effect only after ORACLE_DELAY.
    /// @dev F6: immediate oracle swap with no delay is an instant reputation-gate bypass.
    function proposeOracle(ITrustOracle newOracle) external onlyOwner {
        if (address(newOracle) == address(0)) revert ZeroAddress();
        pendingOracle      = newOracle;
        oracleAcceptableAt = block.timestamp + ORACLE_DELAY;
        emit OracleProposed(address(newOracle), oracleAcceptableAt);
    }

    /// @notice Accept the pending oracle after the delay has elapsed.
    function acceptOracle() external onlyOwner {
        if (address(pendingOracle) == address(0)) revert NoOraclePending();
        if (block.timestamp < oracleAcceptableAt) revert OracleDelayNotElapsed(oracleAcceptableAt);
        emit OracleUpdated(address(oracle), address(pendingOracle));
        oracle        = pendingOracle;
        pendingOracle = ITrustOracle(address(0));
        oracleAcceptableAt = 0;
    }

    /// @notice Cancel a pending oracle proposal.
    function cancelOracleProposal() external onlyOwner {
        pendingOracle      = ITrustOracle(address(0));
        oracleAcceptableAt = 0;
        emit OracleProposalCancelled();
    }

    /// @inheritdoc IReputationHub
    function scoreOf(address agent) external view returns (uint256) {
        return oracle.getTrustScore(agent);
    }
}
