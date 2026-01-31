// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "forge-std/Script.sol";
import "../src/AgentCraftToken.sol";

contract DeployScript is Script {
    function run() external {
        // Load private key from environment
        uint256 deployerPrivateKey = vm.envUint("DEPLOYER_PRIVATE_KEY");
        address treasury = vm.envAddress("TREASURY_ADDRESS");
        address oracle = vm.envAddress("ORACLE_ADDRESS");
        
        vm.startBroadcast(deployerPrivateKey);
        
        AgentCraftToken token = new AgentCraftToken(treasury, oracle);
        
        console.log("AgentCraftToken deployed at:", address(token));
        console.log("Treasury:", treasury);
        console.log("Oracle:", oracle);
        console.log("Initial treasury balance:", token.balanceOf(treasury));
        
        vm.stopBroadcast();
    }
}
