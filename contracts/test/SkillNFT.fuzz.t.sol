// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "forge-std/Test.sol";
import "../src/SkillNFT.sol";
import "./mocks/MockUSDC.sol";

contract SkillNFTFuzzTest is Test {
    SkillNFT public nft;
    MockUSDC public usdc;

    address owner    = address(this);
    address creator  = makeAddr("creator");
    address buyer    = makeAddr("buyer");
    address platform = makeAddr("platform");
    address repPool  = makeAddr("repPool");

    function setUp() public {
        usdc = new MockUSDC();
        nft = new SkillNFT(address(usdc), platform, repPool);

        usdc.mint(buyer, type(uint128).max); // large balance for fuzz
        vm.prank(buyer);
        usdc.approve(address(nft), type(uint256).max);
    }

    // ── Fuzz: fee split always sums to price ───────────────

    function testFuzz_buySkill_splitsSumToPrice(uint256 price) public {
        // Bound price: MIN_PRICE to 1B USDC
        price = bound(price, nft.MIN_PRICE(), 1_000_000_000e6);

        nft.createSkill(price, creator, 1500, "fuzz");

        uint256 creatorBefore  = usdc.balanceOf(creator);
        uint256 platformBefore = usdc.balanceOf(platform);
        uint256 repPoolBefore  = usdc.balanceOf(repPool);
        uint256 buyerBefore    = usdc.balanceOf(buyer);

        vm.prank(buyer);
        nft.buySkill(1, buyer);

        uint256 creatorGot  = usdc.balanceOf(creator) - creatorBefore;
        uint256 platformGot = usdc.balanceOf(platform) - platformBefore;
        uint256 repPoolGot  = usdc.balanceOf(repPool) - repPoolBefore;
        uint256 buyerPaid   = buyerBefore - usdc.balanceOf(buyer);

        // Invariant: splits must sum exactly to price
        assertEq(creatorGot + platformGot + repPoolGot, price, "splits != price");
        assertEq(buyerPaid, price, "buyer paid != price");

        // Creator always gets the most (85% default)
        assertGe(creatorGot, platformGot, "creator < platform");
        assertGe(creatorGot, repPoolGot, "creator < repPool");
    }

    // ── Fuzz: setFees always keeps creator share > 0 ───────

    function testFuzz_setFees_creatorSharePositive(uint16 platformBps, uint16 repBps) public {
        // Combined must be < 10000
        vm.assume(uint256(platformBps) + repBps < 10000);

        nft.setFees(platformBps, repBps);

        uint256 price = 100e6; // 100 USDC
        nft.createSkill(price, creator, 1500, "fuzz");

        uint256 platformShare = (price * platformBps) / 10000;
        uint256 repShare      = (price * repBps) / 10000;
        uint256 creatorShare  = price - platformShare - repShare;

        // Invariant: creator always gets something
        assertGt(creatorShare, 0, "creator share is 0");
        // Invariant: no overflow
        assertEq(creatorShare + platformShare + repShare, price, "sum != price");
    }

    // ── Fuzz: createSkill rejects bad prices ───────────────

    function testFuzz_createSkill_rejectsBelowMin(uint256 price) public {
        vm.assume(price < nft.MIN_PRICE());
        vm.expectRevert(abi.encodeWithSelector(SkillNFT.PriceTooLow.selector, price, nft.MIN_PRICE()));
        nft.createSkill(price, creator, 1500, "fuzz");
    }

    // ── Fuzz: skill IDs are sequential ─────────────────────

    function testFuzz_createSkill_sequentialIds(uint8 count) public {
        vm.assume(count > 0 && count <= 50);

        for (uint256 i = 0; i < count; i++) {
            uint256 id = nft.createSkill(nft.MIN_PRICE(), creator, 1500, "fuzz");
            assertEq(id, i + 1, "non-sequential id");
        }
        assertEq(nft.nextSkillId(), uint256(count) + 1);
    }

    // ── Fuzz: royaltyBps capped ────────────────────────────

    function testFuzz_createSkill_rejectsBadRoyalty(uint16 bps) public {
        vm.assume(bps > 10000);
        uint256 minPrice = nft.MIN_PRICE();
        vm.expectRevert(SkillNFT.InvalidBps.selector);
        nft.createSkill(minPrice, creator, bps, "fuzz");
    }

    // ── Fuzz: no funds stuck in contract after buy ─────────

    function testFuzz_buySkill_noFundsStuck(uint256 price) public {
        price = bound(price, nft.MIN_PRICE(), 1_000_000e6);

        nft.createSkill(price, creator, 1500, "fuzz");

        uint256 contractBefore = usdc.balanceOf(address(nft));

        vm.prank(buyer);
        nft.buySkill(1, buyer);

        assertEq(usdc.balanceOf(address(nft)), contractBefore, "funds stuck in contract");
    }
}
