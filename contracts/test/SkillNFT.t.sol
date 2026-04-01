// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "forge-std/Test.sol";
import "../src/SkillNFT.sol";
import "./mocks/MockUSDC.sol";

contract SkillNFTTest is Test {
    SkillNFT public nft;
    MockUSDC public usdc;

    address owner    = address(this);
    address creator  = makeAddr("creator");
    address buyer    = makeAddr("buyer");
    address platform = makeAddr("platform");
    address repPool  = makeAddr("repPool");

    uint256 constant PRICE = 10e6; // 10 USDC

    function setUp() public {
        usdc = new MockUSDC();
        nft = new SkillNFT(address(usdc), platform, repPool);

        usdc.mint(buyer, 1000e6);
        vm.prank(buyer);
        usdc.approve(address(nft), type(uint256).max);
    }

    // ── createSkill ────────────────────────────────────────

    function test_createSkill() public {
        uint256 id = nft.createSkill(PRICE, creator, 1500, "ipfs://skill1");
        assertEq(id, 0); // first skill = 0

        SkillNFT.Skill memory s = nft.getSkill(0);
        assertEq(s.price, PRICE);
        assertEq(s.creator, creator);
        assertEq(s.royaltyBps, 1500);
        assertEq(s.totalSold, 0);
        assertTrue(s.active);
    }

    function test_createSkill_incrementsId() public {
        uint256 id1 = nft.createSkill(PRICE, creator, 1500, "a");
        uint256 id2 = nft.createSkill(PRICE, creator, 1500, "b");
        assertEq(id1, 0);
        assertEq(id2, 1);
    }

    function test_createSkill_revert_notOwner() public {
        vm.prank(buyer);
        vm.expectRevert();
        nft.createSkill(PRICE, creator, 1500, "a");
    }

    function test_createSkill_revert_zeroCreator() public {
        vm.expectRevert(SkillNFT.InvalidAddress.selector);
        nft.createSkill(PRICE, address(0), 1500, "a");
    }

    // ── buySkill ───────────────────────────────────────────

    function test_buySkill_splits() public {
        nft.createSkill(PRICE, creator, 1500, "uri");

        uint256 creatorBefore  = usdc.balanceOf(creator);
        uint256 platformBefore = usdc.balanceOf(platform);
        uint256 repPoolBefore  = usdc.balanceOf(repPool);

        vm.prank(buyer);
        nft.buySkill(0, buyer);

        // 10% platform = 1 USDC, 5% rep pool = 0.5 USDC, 85% creator = 8.5 USDC
        assertEq(usdc.balanceOf(platform) - platformBefore, 1e6);
        assertEq(usdc.balanceOf(repPool) - repPoolBefore, 0.5e6);
        assertEq(usdc.balanceOf(creator) - creatorBefore, 8.5e6);

        // NFT minted
        assertEq(nft.balanceOf(buyer, 0), 1);

        // totalSold
        SkillNFT.Skill memory s = nft.getSkill(0);
        assertEq(s.totalSold, 1);
    }

    function test_buySkill_multipleBuys() public {
        nft.createSkill(PRICE, creator, 1500, "uri");

        vm.startPrank(buyer);
        nft.buySkill(0, buyer);
        nft.buySkill(0, buyer);
        vm.stopPrank();

        assertEq(nft.balanceOf(buyer, 0), 2);
        assertEq(nft.getSkill(0).totalSold, 2);
    }

    function test_buySkill_revert_inactive() public {
        nft.createSkill(PRICE, creator, 1500, "uri");
        nft.deactivateSkill(0);

        vm.prank(buyer);
        vm.expectRevert("skill inactive");
        nft.buySkill(0, buyer);
    }

    function test_buySkill_revert_nonexistent() public {
        vm.prank(buyer);
        vm.expectRevert();
        nft.buySkill(99, buyer);
    }

    function test_buySkill_revert_insufficientBalance() public {
        nft.createSkill(PRICE, creator, 1500, "uri");

        address poorBuyer = makeAddr("poor");
        usdc.mint(poorBuyer, 1e6);
        vm.prank(poorBuyer);
        usdc.approve(address(nft), type(uint256).max);

        vm.prank(poorBuyer);
        vm.expectRevert();
        nft.buySkill(0, poorBuyer);
    }

    // ── royaltyInfo (ERC-2981) ─────────────────────────────

    function test_royaltyInfo() public {
        nft.createSkill(PRICE, creator, 1500, "uri");

        (address receiver, uint256 royaltyAmount) = nft.royaltyInfo(0, 100e6);
        assertEq(receiver, creator);
        assertEq(royaltyAmount, 15e6); // 15% of 100 USDC
    }

    // ── URI ────────────────────────────────────────────────

    function test_uri() public {
        nft.createSkill(PRICE, creator, 1500, "ipfs://skill1");
        assertEq(nft.uri(0), "ipfs://skill1");
    }

    // ── Admin setters ──────────────────────────────────────

    function test_setPlatformFeeBps() public {
        nft.setPlatformFeeBps(500);
        assertEq(nft.platformFeeBps(), 500);
    }

    function test_setReputationPoolBps() public {
        nft.setReputationPoolBps(200);
        assertEq(nft.reputationPoolBps(), 200);
    }
}
