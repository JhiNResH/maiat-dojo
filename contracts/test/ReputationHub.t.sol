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

    // ── 2-step oracle update (F6 fix) ──────────────────────

    function test_proposeOracle_byOwner() public {
        MockTrustOracle newOracle = new MockTrustOracle();
        hub.proposeOracle(newOracle);
        assertEq(address(hub.pendingOracle()), address(newOracle));
        assertEq(hub.oracleAcceptableAt(), block.timestamp + hub.ORACLE_DELAY());
    }

    function test_acceptOracle_afterDelay() public {
        MockTrustOracle newOracle = new MockTrustOracle();
        newOracle.setScore(agent, 42);

        hub.proposeOracle(newOracle);
        vm.warp(block.timestamp + hub.ORACLE_DELAY());
        hub.acceptOracle();

        assertEq(address(hub.oracle()), address(newOracle));
        assertEq(hub.scoreOf(agent), 42);
        // pending cleared
        assertEq(address(hub.pendingOracle()), address(0));
    }

    function test_acceptOracle_revertsBeforeDelay() public {
        MockTrustOracle newOracle = new MockTrustOracle();
        hub.proposeOracle(newOracle);

        // 1 second before delay elapses
        vm.warp(block.timestamp + hub.ORACLE_DELAY() - 1);
        vm.expectRevert(
            abi.encodeWithSelector(
                ReputationHub.OracleDelayNotElapsed.selector,
                hub.oracleAcceptableAt()
            )
        );
        hub.acceptOracle();
    }

    function test_acceptOracle_revertsWithNoPending() public {
        vm.expectRevert(ReputationHub.NoOraclePending.selector);
        hub.acceptOracle();
    }

    function test_cancelOracleProposal() public {
        MockTrustOracle newOracle = new MockTrustOracle();
        hub.proposeOracle(newOracle);
        hub.cancelOracleProposal();
        assertEq(address(hub.pendingOracle()), address(0));
        assertEq(hub.oracleAcceptableAt(), 0);
    }

    function test_proposeOracle_revertsFromNonOwner() public {
        MockTrustOracle newOracle = new MockTrustOracle();
        vm.prank(bob);
        vm.expectRevert();
        hub.proposeOracle(newOracle);
    }

    function test_proposeOracle_revertsOnZero() public {
        vm.expectRevert(ReputationHub.ZeroAddress.selector);
        hub.proposeOracle(ITrustOracle(address(0)));
    }

    function test_constructor_revertsOnZero() public {
        vm.expectRevert(ReputationHub.ZeroAddress.selector);
        new ReputationHub(ITrustOracle(address(0)));
    }
}
