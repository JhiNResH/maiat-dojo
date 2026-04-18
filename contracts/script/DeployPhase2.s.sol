// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "forge-std/Script.sol";
import {IERC20}         from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {ITrustOracle}   from "../src/interfaces/ITrustOracle.sol";
import {SkillRegistry}  from "../src/SkillRegistry.sol";
import {SkillRunToken}  from "../src/SkillRunToken.sol";
import {SwapRouter}     from "../src/SwapRouter.sol";
import {ReputationHub}  from "../src/ReputationHub.sol";

/**
 * @title DeployPhase2
 * @notice Deploys Tokenized Commerce + Reputation-Gated Allocation stack to BSC.
 *
 *  Contracts:
 *   1. ReputationHub (wraps existing DojoTrustScore)
 *   2. SkillRegistry
 *   3. SwapRouter (wires registry + hub + USDC + gateway + platform + rep pool)
 *   4. registry.setRouter(swapRouter)
 *
 * Usage:
 *   forge script script/DeployPhase2.s.sol \
 *     --rpc-url $BSC_RPC_URL \
 *     --private-key $DOJO_RELAYER_PRIVATE_KEY \
 *     --broadcast
 *
 * Env:
 *   BSC_USDC              (default: BSC testnet USDC)
 *   BSC_TRUST_ORACLE      (default: existing DojoTrustScore on BSC testnet)
 *   PLATFORM_WALLET       (default: deployer)
 *   REPUTATION_POOL       (default: deployer)
 *   GATEWAY_ADDRESS       (default: deployer)
 */
contract DeployPhase2 is Script {
    // BSC testnet (chain 97) — see brain/dashboard-active.md
    address constant USDC_BSC_TESTNET   = 0x2F808cc071D7B54d23a7647d79d7EF6E2C830d31;
    address constant ORACLE_BSC_TESTNET = 0xC6cF2d59fF2e4EE64bbfcEaad8Dcb9aA3F13c6dA;

    function run() external {
        address deployer = msg.sender;

        address usdc    = vm.envOr("BSC_USDC",          USDC_BSC_TESTNET);
        address oracle  = vm.envOr("BSC_TRUST_ORACLE",  ORACLE_BSC_TESTNET);
        address platform = vm.envOr("PLATFORM_WALLET",  deployer);
        address repPool  = vm.envOr("REPUTATION_POOL",  deployer);
        address gateway  = vm.envOr("GATEWAY_ADDRESS",  deployer);

        console.log("=== Phase 2 Deploy ===");
        console.log("Chain ID:        ", block.chainid);
        console.log("Deployer:        ", deployer);
        console.log("USDC:            ", usdc);
        console.log("TrustOracle:     ", oracle);
        console.log("PlatformTreasury:", platform);
        console.log("ReputationPool:  ", repPool);
        console.log("Gateway:         ", gateway);

        vm.startBroadcast();

        // 1. ReputationHub wraps DojoTrustScore.
        ReputationHub hub = new ReputationHub(ITrustOracle(oracle));
        console.log("ReputationHub:   ", address(hub));

        // 2. SkillRegistry — router will be set after SwapRouter deploy.
        SkillRegistry registry = new SkillRegistry(IERC20(usdc));
        console.log("SkillRegistry:   ", address(registry));

        // 3. SwapRouter binds all dependencies.
        SwapRouter router = new SwapRouter(
            registry,
            hub,
            IERC20(usdc),
            gateway,
            platform,
            repPool
        );
        console.log("SwapRouter:      ", address(router));

        // 4. Wire the router into registry.
        registry.setRouter(address(router));

        vm.stopBroadcast();

        console.log("");
        console.log("=== Phase 2 Deploy Complete ===");
        console.log("Env updates:");
        console.log("  BSC_REPUTATION_HUB=", address(hub));
        console.log("  BSC_SKILL_REGISTRY=", address(registry));
        console.log("  BSC_SWAP_ROUTER=  ", address(router));
    }
}
