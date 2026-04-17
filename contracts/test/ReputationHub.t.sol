// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "forge-std/Test.sol";
import {ReputationHub}    from "../src/ReputationHub.sol";
import {ITrustOracle}     from "../src/interfaces/ITrustOracle.sol";
import {MockTrustOracle}  from "./mocks/MockTrustOracle.sol";

contract ReputationHubTest is Test {
    ReputationHub    public hub;
    MockTrustOracle  public oracle;

    address owner  = address(this);
    address agent  = makeAddr("agent");
    address bob    = makeAddr("bob");

    function setUp() public {
        oracle = new MockTrustOracle();
        hub = new ReputationHub(oracle);
    }

    function test_scoreOf_returnsOracleValue() public {
        oracle.setScore(agent, 75);
        assertEq(hub.scoreOf(agent), 75);
    }

    function test_scoreOf_defaultsToZero() public view {
        assertEq(hub.scoreOf(agent), 0);
    }

    function test_setOracle_byOwner() public {
        MockTrustOracle newOracle = new MockTrustOracle();
        newOracle.setScore(agent, 42);
        hub.setOracle(newOracle);
        assertEq(address(hub.oracle()), address(newOracle));
        assertEq(hub.scoreOf(agent), 42);
    }

    function test_setOracle_revertsFromNonOwner() public {
        MockTrustOracle newOracle = new MockTrustOracle();
        vm.prank(bob);
        vm.expectRevert(); // OwnableUnauthorizedAccount
        hub.setOracle(newOracle);
    }

    function test_setOracle_revertsOnZero() public {
        vm.expectRevert(ReputationHub.ZeroAddress.selector);
        hub.setOracle(ITrustOracle(address(0)));
    }

    function test_constructor_revertsOnZero() public {
        vm.expectRevert(ReputationHub.ZeroAddress.selector);
        new ReputationHub(ITrustOracle(address(0)));
    }
}
