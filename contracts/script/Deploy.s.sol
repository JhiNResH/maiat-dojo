// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "forge-std/Script.sol";
import "../src/SkillNFT.sol";
import "../src/SkillRoyaltySplitter.sol";

/**
 * @title Deploy
 * @notice Deploys SkillNFT + SkillRoyaltySplitter to Base Sepolia or Base Mainnet.
 *
 * Usage:
 *   # Base Sepolia (testnet)
 *   forge script script/Deploy.s.sol --rpc-url base-sepolia --broadcast --verify
 *
 *   # Base Mainnet
 *   forge script script/Deploy.s.sol --rpc-url base --broadcast --verify
 *
 * Environment variables:
 *   PRIVATE_KEY      — deployer private key
 *   PLATFORM_WALLET  — address for platform fees (default: deployer)
 *   REPUTATION_POOL  — address for reputation pool (default: deployer)
 *   USDC_ADDRESS     — USDC token address (auto-detected per chainId)
 */
contract Deploy is Script {
    // Base Mainnet USDC
    address constant USDC_BASE = 0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913;
    // Base Sepolia USDC (Circle's official testnet USDC)
    address constant USDC_BASE_SEPOLIA = 0x036CbD53842c5426634e7929541eC2318f3dCF7e;

    function run() external {
        uint256 deployerKey = vm.envUint("PRIVATE_KEY");
        address deployer = vm.addr(deployerKey);

        // Auto-detect USDC by chain
        address usdc;
        if (block.chainid == 8453) {
            usdc = USDC_BASE;
        } else if (block.chainid == 84532) {
            usdc = USDC_BASE_SEPOLIA;
        } else {
            // Fallback: check env
            usdc = vm.envOr("USDC_ADDRESS", address(0));
            require(usdc != address(0), "Set USDC_ADDRESS for this chain");
        }

        // Platform wallet and reputation pool (default to deployer for testnet)
        address platformWallet = vm.envOr("PLATFORM_WALLET", deployer);
        address reputationPool = vm.envOr("REPUTATION_POOL", deployer);

        console.log("=== Dojo Deploy ===");
        console.log("Chain ID:", block.chainid);
        console.log("Deployer:", deployer);
        console.log("USDC:", usdc);
        console.log("Platform Wallet:", platformWallet);
        console.log("Reputation Pool:", reputationPool);

        vm.startBroadcast(deployerKey);

        // 1. Deploy SkillNFT
        SkillNFT skillNft = new SkillNFT(usdc, platformWallet, reputationPool);
        console.log("SkillNFT deployed at:", address(skillNft));

        // 2. Deploy SkillRoyaltySplitter (references SkillNFT)
        SkillRoyaltySplitter splitter = new SkillRoyaltySplitter(
            usdc,
            address(skillNft),
            platformWallet
        );
        console.log("SkillRoyaltySplitter deployed at:", address(splitter));

        vm.stopBroadcast();

        // Summary
        console.log("");
        console.log("=== Deployment Complete ===");
        console.log("SkillNFT:", address(skillNft));
        console.log("SkillRoyaltySplitter:", address(splitter));
        console.log("Owner:", deployer);
    }
}
