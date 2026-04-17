// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

/// @title IReputationHub
/// @notice Unified reputation query interface for the Maiat protocol.
/// @dev Wraps one or more upstream oracles (e.g. DojoTrustScore). Callers use
///      this interface so the reputation source can be swapped without touching
///      consumers (SwapRouter, hooks, etc.).
interface IReputationHub {
    /// @notice Return a composite reputation score for an agent.
    /// @dev Phase 2: single-dimension. Phase 2.5 will add dimension-specific views
    ///      via an overload; existing callers remain compatible.
    /// @param agent Address to query.
    /// @return score Reputation score (implementation-defined range; Day 1 bound to
    ///         ITrustOracle's [0,100] range via DojoTrustScore wrapper).
    function scoreOf(address agent) external view returns (uint256 score);
}
