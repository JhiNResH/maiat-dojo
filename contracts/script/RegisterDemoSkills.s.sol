// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "forge-std/Script.sol";
import {SkillRegistry} from "../src/SkillRegistry.sol";

/**
 * @title RegisterDemoSkills
 * @notice Registers the demo skill set on the deployed SkillRegistry.
 *
 * Env:
 *   BSC_SKILL_REGISTRY (required)
 *   CREATOR_ADDRESS    (default: deployer)
 */
contract RegisterDemoSkills is Script {
    function run() external {
        address registryAddr = vm.envAddress("BSC_SKILL_REGISTRY");
        address creator      = vm.envOr("CREATOR_ADDRESS", msg.sender);

        SkillRegistry registry = SkillRegistry(registryAddr);

        console.log("Registering demo skills to:", registryAddr);
        console.log("Creator:", creator);

        vm.startBroadcast();

        // echo-test — cheapest, no external calls, demo-friendly
        (bytes32 id1, address tok1) = registry.register(
            "echo-test",
            1_000,                       // 0.001 USDC per execution
            creator,
            "ipfs://QmDemoEchoTest",
            bytes32("echo-test.v1"),
            0,                           // category: skill
            0                            // minReputation: open
        );
        console.log("echo-test skillId:", vm.toString(id1));
        console.log("echo-test runToken:", tok1);

        // web-scraper — Jina Reader wrapper
        (bytes32 id2, address tok2) = registry.register(
            "web-scraper",
            5_000,                       // 0.005 USDC
            creator,
            "ipfs://QmDemoWebScraper",
            bytes32("web-scraper.v1"),
            0,
            0
        );
        console.log("web-scraper skillId:", vm.toString(id2));
        console.log("web-scraper runToken:", tok2);

        // price-oracle — token price lookup via Binance public API
        (bytes32 id3, address tok3) = registry.register(
            "price-oracle",
            2_000,                       // 0.002 USDC
            creator,
            "ipfs://QmDemoPriceOracle",
            bytes32("price-oracle.v1"),
            0,
            0
        );
        console.log("price-oracle skillId:", vm.toString(id3));
        console.log("price-oracle runToken:", tok3);

        vm.stopBroadcast();

        console.log("");
        console.log("=== Demo Skills Registered ===");
    }
}
