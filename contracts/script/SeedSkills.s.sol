// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "forge-std/Script.sol";
import "../src/SkillNFT.sol";

/**
 * @title SeedSkills
 * @notice Create 8 seed skills on-chain (Base Sepolia) to populate the Dojo marketplace.
 *         After running, update the DB onChainId for each skill.
 *
 * Usage:
 *   cd contracts && PRIVATE_KEY=0x... forge script script/SeedSkills.s.sol --rpc-url base-sepolia --broadcast
 */
contract SeedSkills is Script {
    SkillNFT constant SKILL_NFT = SkillNFT(0x52635F45b087c1059B3a997fb089bae5Db095B74);

    function run() external {
        uint256 deployerKey = vm.envUint("PRIVATE_KEY");
        address deployer = vm.addr(deployerKey);

        console.log("=== Seed Skills ===");
        console.log("Deployer:", deployer);
        console.log("Starting nextSkillId:", SKILL_NFT.nextSkillId());

        vm.startBroadcast(deployerKey);

        // Prices in USDC (6 decimals)
        // 1. DeFi Yield Optimizer — $2.00
        uint256 id1 = SKILL_NFT.createSkill(2e6, deployer, 1500, "ipfs://seed-defi-yield-optimizer");
        console.log("Skill 1 (DeFi Yield Optimizer):", id1);

        // 2. Smart Contract Auditor — $5.00
        uint256 id2 = SKILL_NFT.createSkill(5e6, deployer, 1500, "ipfs://seed-smart-contract-auditor");
        console.log("Skill 2 (Smart Contract Auditor):", id2);

        // 3. Twitter Alpha Scanner — $1.50
        uint256 id3 = SKILL_NFT.createSkill(1500000, deployer, 1500, "ipfs://seed-twitter-alpha-scanner");
        console.log("Skill 3 (Twitter Alpha Scanner):", id3);

        // 4. On-Chain Forensics — $3.00
        uint256 id4 = SKILL_NFT.createSkill(3e6, deployer, 1500, "ipfs://seed-onchain-forensics");
        console.log("Skill 4 (On-Chain Forensics):", id4);

        // 5. Gas Fee Predictor — $0.01 (minimum price)
        uint256 id5 = SKILL_NFT.createSkill(10000, deployer, 1500, "ipfs://seed-gas-fee-predictor");
        console.log("Skill 5 (Gas Fee Predictor):", id5);

        // 6. MEV Shield — $2.50
        uint256 id6 = SKILL_NFT.createSkill(2500000, deployer, 1500, "ipfs://seed-mev-shield");
        console.log("Skill 6 (MEV Shield):", id6);

        // 7. Sentiment Analyzer — $1.00
        uint256 id7 = SKILL_NFT.createSkill(1e6, deployer, 1500, "ipfs://seed-sentiment-analyzer");
        console.log("Skill 7 (Sentiment Analyzer):", id7);

        // 8. Polymarket Arbitrage — $3.50
        uint256 id8 = SKILL_NFT.createSkill(3500000, deployer, 1500, "ipfs://seed-polymarket-arbitrage");
        console.log("Skill 8 (Polymarket Arbitrage):", id8);

        vm.stopBroadcast();

        console.log("");
        console.log("=== All 8 skills created ===");
        console.log("First ID:", id1);
        console.log("Last ID:", id8);
        console.log("Next step: update DB onChainId for each skill");
    }
}
