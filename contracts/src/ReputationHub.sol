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
    /// @notice Current trust oracle source.
    ITrustOracle public oracle;

    event OracleUpdated(address indexed oldOracle, address indexed newOracle);

    error ZeroAddress();

    constructor(ITrustOracle oracle_) Ownable(msg.sender) {
        if (address(oracle_) == address(0)) revert ZeroAddress();
        oracle = oracle_;
    }

    /// @notice Replace the trust oracle (e.g. to swap in a multi-dim source).
    function setOracle(ITrustOracle newOracle) external onlyOwner {
        if (address(newOracle) == address(0)) revert ZeroAddress();
        emit OracleUpdated(address(oracle), address(newOracle));
        oracle = newOracle;
    }

    /// @inheritdoc IReputationHub
    function scoreOf(address agent) external view returns (uint256) {
        return oracle.getTrustScore(agent);
    }
}
