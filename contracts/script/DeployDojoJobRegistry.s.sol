// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {Script, console} from "forge-std/Script.sol";
import {DojoJobRegistry} from "../src/DojoJobRegistry.sol";

/**
 * @title DeployDojoJobRegistry
 * @notice Foundry deploy script for DojoJobRegistry
 *
 * Usage:
 *   # X Layer Testnet (chain ID 195)
 *   forge script script/DeployDojoJobRegistry.s.sol:DeployDojoJobRegistry \
 *     --rpc-url $XLAYER_RPC_URL \
 *     --private-key $XLAYER_PRIVATE_KEY \
 *     --broadcast
 *
 *   # X Layer Mainnet (chain ID 196)
 *   forge script script/DeployDojoJobRegistry.s.sol:DeployDojoJobRegistry \
 *     --rpc-url https://rpc.xlayer.tech \
 *     --private-key $XLAYER_PRIVATE_KEY \
 *     --broadcast \
 *     --verify
 *
 * Environment variables:
 *   - XLAYER_PRIVATE_KEY: Deployer private key
 *   - XLAYER_RPC_URL: RPC endpoint (testnet: https://testrpc.xlayer.tech)
 */
contract DeployDojoJobRegistry is Script {
    function run() external returns (DojoJobRegistry registry) {
        uint256 deployerPrivateKey = vm.envUint("XLAYER_PRIVATE_KEY");

        console.log("Deploying DojoJobRegistry...");
        console.log("Chain ID:", block.chainid);

        vm.startBroadcast(deployerPrivateKey);

        registry = new DojoJobRegistry();

        vm.stopBroadcast();

        console.log("DojoJobRegistry deployed at:", address(registry));
        console.log("Owner:", registry.owner());
    }
}
