// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "forge-std/Script.sol";
import "../src/SkillNFT.sol";

contract SeedRemaining is Script {
    SkillNFT constant SKILL_NFT = SkillNFT(0x52635F45b087c1059B3a997fb089bae5Db095B74);

    function run() external {
        uint256 deployerKey = vm.envUint("PRIVATE_KEY");
        address deployer = vm.addr(deployerKey);

        console.log("Starting nextSkillId:", SKILL_NFT.nextSkillId());
        vm.startBroadcast(deployerKey);

        // 5. Gas Fee Predictor — $0.01 (min price)
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
        console.log("=== Done. All 8 skills on-chain ===");
    }
}
