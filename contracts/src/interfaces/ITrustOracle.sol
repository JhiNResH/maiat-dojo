// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

/// @title ITrustOracle
/// @notice Vendor-neutral trust oracle interface for ERC-8183 hooks and evaluators.
/// @dev Mirror of the canonical interface in maiat-protocol. Importing as a local
///      type so dojo contracts don't take a hard dependency on the sibling repo.
interface ITrustOracle {
    /// @notice Trust score for a user in range [0, 100]. Returns 0 for unknowns.
    function getTrustScore(address user) external view returns (uint256 score);
}
