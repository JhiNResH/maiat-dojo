// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "forge-std/Test.sol";
import "../src/SkillNFT.sol";
import "../src/SkillRoyaltySplitter.sol";
import "./mocks/MockUSDC.sol";

contract SkillRoyaltySplitterFuzzTest is Test {
    SkillNFT public nft;
    SkillRoyaltySplitter public splitter;
    MockUSDC public usdc;

    address owner    = address(this);
    address creator  = makeAddr("creator");
    address operator = makeAddr("operator");
    address buyer    = makeAddr("buyer");
    address platform = makeAddr("platform");
    address repPool  = makeAddr("repPool");

    function setUp() public {
        usdc = new MockUSDC();
        nft = new SkillNFT(address(usdc), platform, repPool);
        splitter = new SkillRoyaltySplitter(address(usdc), address(nft), platform);

        // Create skill + operator buys it (holds NFT)
        nft.createSkill(10e6, creator, 1500, "uri");
        usdc.mint(operator, 100e6);
        vm.prank(operator);
        usdc.approve(address(nft), type(uint256).max);
        vm.prank(operator);
        nft.buySkill(1, operator);

        // Buyer funds
        usdc.mint(buyer, type(uint128).max);
        vm.prank(buyer);
        usdc.approve(address(splitter), type(uint256).max);
    }

    // ── Helpers ────────────────────────────────────────────

    /// @dev F3 fix: after pay() funds sit in pendingWithdrawals; recipients must pull.
    function _withdrawAll() internal {
        vm.prank(operator); splitter.withdraw();
        vm.prank(creator);  splitter.withdraw();
        vm.prank(platform); splitter.withdraw();
    }

    // ── Fuzz: splits always sum to amount ──────────────────

    function testFuzz_pay_splitsSumToAmount(uint256 amount) public {
        amount = bound(amount, splitter.MIN_AMOUNT(), 1_000_000_000e6);

        uint256 operatorBefore = usdc.balanceOf(operator);
        uint256 creatorBefore  = usdc.balanceOf(creator);
        uint256 platformBefore = usdc.balanceOf(platform);
        uint256 buyerBefore    = usdc.balanceOf(buyer);

        vm.prank(buyer);
        splitter.pay(1, operator, amount);
        _withdrawAll();

        uint256 operatorGot = usdc.balanceOf(operator) - operatorBefore;
        uint256 creatorGot  = usdc.balanceOf(creator) - creatorBefore;
        uint256 platformGot = usdc.balanceOf(platform) - platformBefore;
        uint256 buyerPaid   = buyerBefore - usdc.balanceOf(buyer);

        // Invariant: splits sum to amount
        assertEq(operatorGot + creatorGot + platformGot, amount, "splits != amount");
        assertEq(buyerPaid, amount, "buyer paid != amount");
    }

    // ── Fuzz: no funds stuck in splitter after all withdraw ──

    function testFuzz_pay_noFundsStuck(uint256 amount) public {
        amount = bound(amount, splitter.MIN_AMOUNT(), 1_000_000e6);

        uint256 contractBefore = usdc.balanceOf(address(splitter));

        vm.prank(buyer);
        splitter.pay(1, operator, amount);
        _withdrawAll();

        assertEq(usdc.balanceOf(address(splitter)), contractBefore, "funds stuck");
    }

    // ── Fuzz: operator always gets the most ────────────────

    function testFuzz_pay_operatorGetsLargestShare(uint256 amount) public {
        // Need large enough amount for meaningful split
        amount = bound(amount, 1e6, 1_000_000e6);

        uint256 operatorBefore = usdc.balanceOf(operator);
        uint256 creatorBefore  = usdc.balanceOf(creator);
        uint256 platformBefore = usdc.balanceOf(platform);

        vm.prank(buyer);
        splitter.pay(1, operator, amount);
        _withdrawAll();

        uint256 operatorGot = usdc.balanceOf(operator) - operatorBefore;
        uint256 creatorGot  = usdc.balanceOf(creator) - creatorBefore;
        uint256 platformGot = usdc.balanceOf(platform) - platformBefore;

        // Operator (80%) > Creator (15%) > Platform (5%)
        assertGe(operatorGot, creatorGot, "operator < creator");
        assertGe(creatorGot, platformGot, "creator < platform");
    }

    // ── Fuzz: setFeeSplit validation ───────────────────────

    function testFuzz_setFeeSplit_rejectsInvalidSum(uint16 a, uint16 b, uint16 c) public {
        vm.assume(uint256(a) + b + c != 10000);
        vm.expectRevert(SkillRoyaltySplitter.InvalidFeeSplit.selector);
        splitter.setFeeSplit(a, b, c);
    }

    function testFuzz_setFeeSplit_rejectsLowOperator(uint16 opBps, uint16 crBps) public {
        vm.assume(opBps < 5000);
        vm.assume(uint256(opBps) + crBps <= 10000);
        uint16 plBps = uint16(10000 - uint256(opBps) - uint256(crBps));
        vm.expectRevert(); // either InvalidFeeSplit or OperatorBpsTooLow
        splitter.setFeeSplit(opBps, crBps, plBps);
    }

    // ── Fuzz: rejects below MIN_AMOUNT ─────────────────────

    function testFuzz_pay_rejectsBelowMin(uint256 amount) public {
        vm.assume(amount > 0 && amount < splitter.MIN_AMOUNT());
        vm.prank(buyer);
        vm.expectRevert(
            abi.encodeWithSelector(SkillRoyaltySplitter.AmountTooLow.selector, amount, splitter.MIN_AMOUNT())
        );
        splitter.pay(1, operator, amount);
    }

    // ── Fuzz: unauthorized operator always reverts ─────────

    function testFuzz_pay_rejectsUnauthorizedOperator(address fakeOp) public {
        vm.assume(fakeOp != address(0));
        vm.assume(fakeOp != operator); // operator actually holds the NFT
        vm.assume(fakeOp != buyer);    // buyer might have bought too

        vm.prank(buyer);
        vm.expectRevert(
            abi.encodeWithSelector(SkillRoyaltySplitter.UnauthorizedOperator.selector, fakeOp, 1)
        );
        splitter.pay(1, fakeOp, 1e6);
    }
}
