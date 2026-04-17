// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "forge-std/Test.sol";
import {SkillRegistry}  from "../src/SkillRegistry.sol";
import {SkillRunToken}  from "../src/SkillRunToken.sol";
import {SwapRouter}     from "../src/SwapRouter.sol";
import {ReputationHub}  from "../src/ReputationHub.sol";
import {IReputationHub} from "../src/interfaces/IReputationHub.sol";
import {MockUSDC}       from "./mocks/MockUSDC.sol";
import {MockTrustOracle} from "./mocks/MockTrustOracle.sol";

contract SwapRouterTest is Test {
    SkillRegistry   public registry;
    SwapRouter      public router;
    ReputationHub   public hub;
    MockUSDC        public usdc;
    MockTrustOracle public oracle;

    address owner        = address(this);
    address gateway      = makeAddr("gateway");
    address platform     = makeAddr("platform");
    address repPool      = makeAddr("reputationPool");
    address provider     = makeAddr("provider");
    address creator      = makeAddr("creator");
    address agent        = makeAddr("agent");
    address otherAgent   = makeAddr("otherAgent");

    string  constant SLUG  = "web-scraper";
    uint256 constant PRICE = 5_000; // 0.005 USDC
    bytes32 skillId;
    address runToken;

    function setUp() public {
        usdc     = new MockUSDC();
        oracle   = new MockTrustOracle();
        hub      = new ReputationHub(oracle);
        registry = new SkillRegistry(usdc);

        router = new SwapRouter(
            registry, hub, usdc, gateway, platform, repPool
        );
        registry.setRouter(address(router));

        vm.prank(provider);
        (skillId, runToken) = registry.register(
            SLUG, PRICE, creator, "ipfs://meta", bytes32("slug.v1"), 0, 0
        );

        // Fund agents with USDC & approve router.
        usdc.mint(agent, 1_000_000);
        vm.prank(agent);
        usdc.approve(address(router), type(uint256).max);

        usdc.mint(otherAgent, 1_000_000);
        vm.prank(otherAgent);
        usdc.approve(address(router), type(uint256).max);
    }

    // ── buyRunToken ───────────────────────────────────────────

    function test_buyRunToken_success() public {
        vm.prank(agent);
        router.buyRunToken(skillId, 10);
        assertEq(SkillRunToken(runToken).balanceOf(agent), 10);
        assertEq(registry.treasury(skillId), PRICE * 10);
        assertEq(usdc.balanceOf(agent), 1_000_000 - PRICE * 10);
    }

    function test_buyRunToken_revertsOnZeroAmount() public {
        vm.prank(agent);
        vm.expectRevert(SwapRouter.ZeroAmount.selector);
        router.buyRunToken(skillId, 0);
    }

    function test_buyRunToken_revertsOnInactive() public {
        vm.prank(provider);
        registry.setActive(skillId, false);
        vm.prank(agent);
        vm.expectRevert(abi.encodeWithSelector(SwapRouter.SkillInactive.selector, skillId));
        router.buyRunToken(skillId, 10);
    }

    function test_buyRunToken_revertsOnInsufficientReputation() public {
        vm.prank(provider);
        registry.setMinReputation(skillId, 50);

        vm.prank(agent);
        vm.expectRevert(abi.encodeWithSelector(
            SwapRouter.InsufficientReputation.selector, 50, 0
        ));
        router.buyRunToken(skillId, 10);
    }

    function test_buyRunToken_passesWhenReputationMet() public {
        vm.prank(provider);
        registry.setMinReputation(skillId, 50);
        oracle.setScore(agent, 60);

        vm.prank(agent);
        router.buyRunToken(skillId, 3);
        assertEq(SkillRunToken(runToken).balanceOf(agent), 3);
    }

    // ── executeSkill ──────────────────────────────────────────

    function test_executeSkill_success() public {
        vm.prank(agent);
        router.buyRunToken(skillId, 3);

        vm.prank(agent);
        vm.recordLogs();
        bytes32 reqId = router.executeSkill(skillId, hex"deadbeef");

        assertEq(SkillRunToken(runToken).balanceOf(agent), 2);
        assertEq(registry.treasury(skillId), PRICE * 2);
        assertEq(usdc.balanceOf(address(router)), PRICE); // escrowed

        (bytes32 sId, address a, uint256 amt,, SwapRouter.RequestStatus status)
            = router.requests(reqId);
        assertEq(sId, skillId);
        assertEq(a, agent);
        assertEq(amt, PRICE);
        assertEq(uint8(status), uint8(SwapRouter.RequestStatus.Pending));
    }

    function test_executeSkill_revertsOnNoBalance() public {
        vm.prank(agent);
        vm.expectRevert(); // ERC20 insufficient balance
        router.executeSkill(skillId, "");
    }

    function test_executeSkill_revertsOnReputationGate() public {
        // Buy first with rep = 0 (gate open).
        vm.prank(agent);
        router.buyRunToken(skillId, 3);

        // Provider raises bar, agent too low.
        vm.prank(provider);
        registry.setMinReputation(skillId, 80);

        vm.prank(agent);
        vm.expectRevert(abi.encodeWithSelector(
            SwapRouter.InsufficientReputation.selector, 80, 0
        ));
        router.executeSkill(skillId, "");
    }

    // ── swap (1-shot) ─────────────────────────────────────────

    function test_swap_success() public {
        vm.prank(agent);
        bytes32 reqId = router.swap(skillId, hex"cafe");

        assertEq(SkillRunToken(runToken).balanceOf(agent), 0); // skips mint
        assertEq(usdc.balanceOf(address(router)), PRICE);       // escrowed
        assertEq(registry.treasury(skillId), 0);                // untouched

        (, address a,,, SwapRouter.RequestStatus status) = router.requests(reqId);
        assertEq(a, agent);
        assertEq(uint8(status), uint8(SwapRouter.RequestStatus.Pending));
    }

    function test_swap_revertsOnReputationGate() public {
        vm.prank(provider);
        registry.setMinReputation(skillId, 50);
        vm.prank(agent);
        vm.expectRevert(abi.encodeWithSelector(
            SwapRouter.InsufficientReputation.selector, 50, 0
        ));
        router.swap(skillId, "");
    }

    // ── settle ────────────────────────────────────────────────

    function test_settle_successDistributesFees() public {
        vm.prank(agent);
        bytes32 reqId = router.swap(skillId, "");

        uint256 expectedPlatform = PRICE * 500 / 10_000;    // 5%
        uint256 expectedRep      = PRICE * 500 / 10_000;    // 5%
        uint256 expectedCreator  = PRICE - expectedPlatform - expectedRep;

        vm.prank(gateway);
        router.settle(reqId, true, bytes32("result"));

        assertEq(usdc.balanceOf(creator),  expectedCreator);
        assertEq(usdc.balanceOf(platform), expectedPlatform);
        assertEq(usdc.balanceOf(repPool),  expectedRep);
        assertEq(usdc.balanceOf(address(router)), 0);

        (,,,, SwapRouter.RequestStatus status) = router.requests(reqId);
        assertEq(uint8(status), uint8(SwapRouter.RequestStatus.Settled));
    }

    function test_settle_failureRefunds() public {
        uint256 balBefore = usdc.balanceOf(agent);
        vm.prank(agent);
        bytes32 reqId = router.swap(skillId, "");

        vm.prank(gateway);
        router.settle(reqId, false, bytes32(0));

        assertEq(usdc.balanceOf(agent), balBefore); // full refund
        (,,,, SwapRouter.RequestStatus status) = router.requests(reqId);
        assertEq(uint8(status), uint8(SwapRouter.RequestStatus.Refunded));
    }

    function test_settle_revertsFromNonGateway() public {
        vm.prank(agent);
        bytes32 reqId = router.swap(skillId, "");
        vm.prank(otherAgent);
        vm.expectRevert(SwapRouter.NotGateway.selector);
        router.settle(reqId, true, bytes32(0));
    }

    function test_settle_revertsOnDoubleSettle() public {
        vm.prank(agent);
        bytes32 reqId = router.swap(skillId, "");
        vm.prank(gateway);
        router.settle(reqId, true, bytes32("r"));
        vm.prank(gateway);
        vm.expectRevert(abi.encodeWithSelector(
            SwapRouter.RequestNotPending.selector, reqId
        ));
        router.settle(reqId, true, bytes32("r2"));
    }

    function test_settle_revertsOnUnknownRequest() public {
        vm.prank(gateway);
        vm.expectRevert(abi.encodeWithSelector(
            SwapRouter.RequestNotFound.selector, bytes32("unknown")
        ));
        router.settle(bytes32("unknown"), true, bytes32(0));
    }

    // ── claimRefund ───────────────────────────────────────────

    function test_claimRefund_afterTTL() public {
        uint256 balBefore = usdc.balanceOf(agent);
        vm.prank(agent);
        bytes32 reqId = router.swap(skillId, "");

        vm.warp(block.timestamp + 15 minutes + 1);
        vm.prank(agent);
        router.claimRefund(reqId);

        assertEq(usdc.balanceOf(agent), balBefore);
        (,,,, SwapRouter.RequestStatus status) = router.requests(reqId);
        assertEq(uint8(status), uint8(SwapRouter.RequestStatus.Refunded));
    }

    function test_claimRefund_revertsBeforeTTL() public {
        vm.prank(agent);
        bytes32 reqId = router.swap(skillId, "");
        vm.prank(agent);
        vm.expectRevert(abi.encodeWithSelector(
            SwapRouter.RequestNotExpired.selector, reqId
        ));
        router.claimRefund(reqId);
    }

    function test_claimRefund_revertsFromNonRequester() public {
        vm.prank(agent);
        bytes32 reqId = router.swap(skillId, "");
        vm.warp(block.timestamp + 15 minutes + 1);
        vm.prank(otherAgent);
        vm.expectRevert(SwapRouter.NotRequester.selector);
        router.claimRefund(reqId);
    }

    // ── admin ─────────────────────────────────────────────────

    function test_setGateway_byOwner() public {
        address newGw = makeAddr("newGw");
        router.setGateway(newGw);
        assertEq(router.gateway(), newGw);
    }

    function test_setGateway_revertsFromNonOwner() public {
        vm.prank(agent);
        vm.expectRevert();
        router.setGateway(agent);
    }

    function test_setFees_valid() public {
        router.setFees(300, 200); // 3% + 2%
        assertEq(router.platformBps(), 300);
        assertEq(router.reputationBps(), 200);
    }

    function test_setFees_revertsOnInvalidBps() public {
        vm.expectRevert(SwapRouter.InvalidBps.selector);
        router.setFees(6_000, 5_000); // sums to >=10000
    }

    // ── lifecycle: register → buy → execute → settle ─────────

    function test_fullLifecycle() public {
        // 1. Agent buys 5 credits.
        vm.prank(agent);
        router.buyRunToken(skillId, 5);
        assertEq(SkillRunToken(runToken).balanceOf(agent), 5);

        // 2. Execute once.
        vm.prank(agent);
        bytes32 reqId = router.executeSkill(skillId, hex"01");
        assertEq(SkillRunToken(runToken).balanceOf(agent), 4);
        assertEq(registry.treasury(skillId), PRICE * 4);

        // 3. Gateway settles success.
        vm.prank(gateway);
        router.settle(reqId, true, bytes32("result1"));

        assertEq(usdc.balanceOf(creator),  PRICE * 9_000 / 10_000);
        assertEq(usdc.balanceOf(platform), PRICE * 500   / 10_000);
        assertEq(usdc.balanceOf(repPool),  PRICE * 500   / 10_000);

        // 4. Second execution, gateway fails it → refund.
        vm.prank(agent);
        bytes32 reqId2 = router.executeSkill(skillId, hex"02");
        uint256 balBefore = usdc.balanceOf(agent);
        vm.prank(gateway);
        router.settle(reqId2, false, bytes32(0));
        assertEq(usdc.balanceOf(agent), balBefore + PRICE);

        // Remaining 3 credits still held.
        assertEq(SkillRunToken(runToken).balanceOf(agent), 3);
    }
}
