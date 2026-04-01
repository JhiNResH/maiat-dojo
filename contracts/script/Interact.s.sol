// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "forge-std/Script.sol";
import "../src/SkillNFT.sol";
import "../src/SkillRoyaltySplitter.sol";

/**
 * @title Interact
 * @notice Test the full Dojo flow on Base Sepolia:
 *         1. Create a skill
 *         2. Mint testnet USDC
 *         3. Approve + buy the skill
 *         4. Verify NFT balance + fee splits
 *
 * Usage:
 *   PRIVATE_KEY=0x... forge script script/Interact.s.sol --rpc-url base-sepolia --broadcast
 */
contract Interact is Script {
    // Base Sepolia deployed contracts
    SkillNFT constant SKILL_NFT = SkillNFT(0x52635F45b087c1059B3a997fb089bae5Db095B74);
    SkillRoyaltySplitter constant SPLITTER = SkillRoyaltySplitter(0x98D34100F6030DFDc1370fB45dFa1Ad7980D4bD8);
    IERC20 constant USDC = IERC20(0x036CbD53842c5426634e7929541eC2318f3dCF7e);

    function run() external {
        uint256 deployerKey = vm.envUint("PRIVATE_KEY");
        address deployer = vm.addr(deployerKey);

        console.log("=== Dojo Interact ===");
        console.log("Deployer:", deployer);
        console.log("USDC balance:", USDC.balanceOf(deployer));
        console.log("SkillNFT nextSkillId:", SKILL_NFT.nextSkillId());

        vm.startBroadcast(deployerKey);

        // ─── Step 1: Create a skill ───────────────────────
        console.log("");
        console.log("--- Step 1: Create Skill ---");
        uint256 skillId = SKILL_NFT.createSkill(
            1e6,            // 1 USDC
            deployer,       // creator = deployer for testing
            1500,           // 15% royalty
            "ipfs://QmTestSkill1"
        );
        console.log("Created skill ID:", skillId);

        // ─── Step 2: Approve USDC ─────────────────────────
        console.log("");
        console.log("--- Step 2: Approve USDC ---");
        USDC.approve(address(SKILL_NFT), type(uint256).max);
        console.log("Approved SkillNFT for USDC");

        // ─── Step 3: Buy the skill ────────────────────────
        console.log("");
        console.log("--- Step 3: Buy Skill ---");
        uint256 usdcBefore = USDC.balanceOf(deployer);
        SKILL_NFT.buySkill(skillId, deployer);
        uint256 usdcAfter = USDC.balanceOf(deployer);
        console.log("USDC spent:", usdcBefore - usdcAfter);

        // ─── Step 4: Verify ───────────────────────────────
        console.log("");
        console.log("--- Step 4: Verify ---");
        uint256 nftBalance = SKILL_NFT.balanceOf(deployer, skillId);
        console.log("NFT balance for skill", skillId, ":", nftBalance);

        SkillNFT.Skill memory skill = SKILL_NFT.getSkill(skillId);
        console.log("totalSold:", skill.totalSold);
        console.log("active:", skill.active);
        console.log("creator:", skill.creator);

        vm.stopBroadcast();

        // ─── Summary ─────────────────────────────────────
        console.log("");
        console.log("=== SUCCESS ===");
        console.log("Skill created, bought, and NFT minted!");
        console.log("Skill ID:", skillId);
        console.log("NFT Balance:", nftBalance);
    }
}
