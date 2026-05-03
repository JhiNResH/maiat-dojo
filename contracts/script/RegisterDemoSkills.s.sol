// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "forge-std/Script.sol";
import {SkillRegistry} from "../src/SkillRegistry.sol";

/**
 * @title RegisterDemoSkills
 * @notice Registers the one live Dojo demo workflow on the deployed SkillRegistry.
 *
 * Env:
 *   BSC_SKILL_REGISTRY (default: current Phase 2 testnet registry)
 *   CREATOR_ADDRESS    (default: deployer)
 */
contract RegisterDemoSkills is Script {
    address constant DEFAULT_SKILL_REGISTRY = 0x104579420Ab86579631E8452EE553A75Fc257690;
    string constant SLUG = "agent-repo-analyst";

    function run() external {
        address registryAddr = vm.envOr("BSC_SKILL_REGISTRY", DEFAULT_SKILL_REGISTRY);
        address creator      = vm.envOr("CREATOR_ADDRESS", msg.sender);

        SkillRegistry registry = SkillRegistry(registryAddr);
        bytes32 expectedId = keccak256(bytes(SLUG));

        console.log("Registering Dojo workflow to:", registryAddr);
        console.log("Creator:", creator);

        try registry.getSkill(expectedId) returns (SkillRegistry.Skill memory existing) {
            console.log("agent-repo-analyst already registered.");
            console.log("skillId:", vm.toString(expectedId));
            console.log("runToken:", existing.runToken);
            console.log("active:", existing.active);
            return;
        } catch {
            console.log("agent-repo-analyst not registered; broadcasting registration.");
        }

        vm.startBroadcast();

        // agent-repo-analyst — public GitHub repo analysis workflow.
        (bytes32 id1, address tok1) = registry.register(
            SLUG,
            3_000,                       // 0.003 USDC per execution
            creator,
            "ipfs://QmDojoAgentRepoAnalyst",
            bytes32("agent-repo-analyst.v1"),
            0,                           // category: skill
            0                            // minReputation: open
        );
        console.log("agent-repo-analyst skillId:", vm.toString(id1));
        console.log("agent-repo-analyst runToken:", tok1);

        vm.stopBroadcast();

        console.log("");
        console.log("=== Dojo Workflow Registered ===");
    }
}
