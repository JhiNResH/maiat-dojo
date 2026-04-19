// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {ITrustOracle} from "../../src/interfaces/ITrustOracle.sol";

/// @dev Testing-only oracle with settable scores per user.
contract MockTrustOracle is ITrustOracle {
    mapping(address => uint256) public score;

    function setScore(address user, uint256 value) external {
        score[user] = value;
    }

    function getTrustScore(address user) external view returns (uint256) {
        return score[user];
    }
}
