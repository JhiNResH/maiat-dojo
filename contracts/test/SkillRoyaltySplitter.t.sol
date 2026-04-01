// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "forge-std/Test.sol";
import "../src/SkillNFT.sol";
import "../src/SkillRoyaltySplitter.sol";
import "./mocks/MockUSDC.sol";

contract SkillRoyaltySplitterTest is Test {
    SkillNFT public nft;
    SkillRoyaltySplitter public splitter;
    MockUSDC public usdc;

    address owner    = address(this);
    address creator  = makeAddr("creator");
    address operator = makeAddr("operator");
    address buyer    = makeAddr("buyer");
    address platform = makeAddr("platform");
    address repPool  = makeAddr("repPool");

    uint256 constant AMOUNT = 1e6; // 1 USDC per service call

    function setUp() public {
        usdc = new MockUSDC();
        nft = new SkillNFT(address(usdc), platform, repPool);
        splitter = new SkillRoyaltySplitter(address(usdc), address(nft), platform);

        // Create a skill (id = 1, nextSkillId starts at 1)
        nft.createSkill(10e6, creator, 1500, "uri");

        usdc.mint(buyer, 1000e6);
        vm.prank(buyer);
        usdc.approve(address(splitter), type(uint256).max);
    }

    // ── pay ────────────────────────────────────────────────

    function test_pay_splits() public {
        uint256 operatorBefore = usdc.balanceOf(operator);
        uint256 creatorBefore  = usdc.balanceOf(creator);
        uint256 platformBefore = usdc.balanceOf(platform);

        vm.prank(buyer);
        splitter.pay(1, operator, AMOUNT);

        // 80% operator, 15% creator, 5% platform
        assertEq(usdc.balanceOf(operator) - operatorBefore, 0.8e6);
        assertEq(usdc.balanceOf(creator) - creatorBefore, 0.15e6);
        assertEq(usdc.balanceOf(platform) - platformBefore, 0.05e6);
    }

    function test_pay_largeAmount() public {
        uint256 amount = 100e6; // 100 USDC

        vm.prank(buyer);
        splitter.pay(1, operator, amount);

        assertEq(usdc.balanceOf(operator), 80e6);
        assertEq(usdc.balanceOf(creator), 15e6);
        assertEq(usdc.balanceOf(platform), 5e6);
    }

    function test_pay_revert_zeroOperator() public {
        vm.prank(buyer);
        vm.expectRevert(SkillRoyaltySplitter.InvalidAddress.selector);
        splitter.pay(1, address(0), AMOUNT);
    }

    function test_pay_revert_zeroAmount() public {
        vm.prank(buyer);
        vm.expectRevert(SkillRoyaltySplitter.ZeroAmount.selector);
        splitter.pay(1, operator, 0);
    }

    function test_pay_revert_nonexistentSkill() public {
        vm.prank(buyer);
        vm.expectRevert(); // getCreator reverts with InvalidSkillId
        splitter.pay(99, operator, AMOUNT);
    }

    function test_pay_revert_insufficientBalance() public {
        address poorBuyer = makeAddr("poor");
        usdc.mint(poorBuyer, 0.1e6);
        vm.prank(poorBuyer);
        usdc.approve(address(splitter), type(uint256).max);

        vm.prank(poorBuyer);
        vm.expectRevert();
        splitter.pay(1, operator, AMOUNT);
    }

    // ── setFeeSplit ────────────────────────────────────────

    function test_setFeeSplit() public {
        splitter.setFeeSplit(7000, 2000, 1000);
        assertEq(splitter.operatorBps(), 7000);
        assertEq(splitter.creatorBps(), 2000);
        assertEq(splitter.platformBps(), 1000);
    }

    function test_setFeeSplit_revert_notSum10000() public {
        vm.expectRevert(SkillRoyaltySplitter.InvalidFeeSplit.selector);
        splitter.setFeeSplit(7000, 2000, 500);
    }

    function test_setFeeSplit_revert_operatorTooLow() public {
        vm.expectRevert(SkillRoyaltySplitter.OperatorBpsTooLow.selector);
        splitter.setFeeSplit(4000, 4000, 2000);
    }

    // ── L-02: events ───────────────────────────────────────

    function test_setFeeSplit_emitsEvent() public {
        vm.expectEmit(false, false, false, true);
        emit SkillRoyaltySplitter.FeeSplitUpdated(7000, 2000, 1000);
        splitter.setFeeSplit(7000, 2000, 1000);
    }

    function test_setPlatformWallet_emitsEvent() public {
        address newWallet = makeAddr("newPlatform");
        vm.expectEmit(false, false, false, true);
        emit SkillRoyaltySplitter.PlatformWalletUpdated(newWallet);
        splitter.setPlatformWallet(newWallet);
    }
}
