// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

/**
 * @title ISkillNFT
 * @notice Interface for SkillNFT used by SkillRoyaltySplitter and other consumers.
 */
interface ISkillNFT {
    function getCreator(uint256 skillId) external view returns (address);
    function getSkillActive(uint256 skillId) external view returns (bool);
    function getSkillRoyaltyBps(uint256 skillId) external view returns (uint16);
}
