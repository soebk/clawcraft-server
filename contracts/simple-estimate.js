const fs = require('fs');
const { ethers } = require("hardhat");

async function simpleEstimate() {
  console.log("📊 BASE MAINNET DEPLOYMENT COST ESTIMATE");
  console.log("=" .repeat(50));
  
  // Read compiled bytecode sizes
  const identity = JSON.parse(fs.readFileSync('./artifacts/contracts/IdentityRegistry.sol/IdentityRegistry.json'));
  const reputation = JSON.parse(fs.readFileSync('./artifacts/contracts/ReputationRegistry.sol/ReputationRegistry.json'));
  const validation = JSON.parse(fs.readFileSync('./artifacts/contracts/ValidationRegistry.sol/ValidationRegistry.json'));
  
  const identitySize = identity.bytecode.length / 2; // Convert hex to bytes
  const reputationSize = reputation.bytecode.length / 2;
  const validationSize = validation.bytecode.length / 2;
  
  console.log(`🔧 CONTRACT SIZES:`);
  console.log(`IdentityRegistry: ${identitySize.toLocaleString()} bytes`);
  console.log(`ReputationRegistry: ${reputationSize.toLocaleString()} bytes`);
  console.log(`ValidationRegistry: ${validationSize.toLocaleString()} bytes`);
  
  // Base L2 typical costs (much cheaper than Ethereum mainnet)
  // Based on Base's ~0.001 gwei gas price and ~30 gas per byte deployment
  const gasPerByte = 30;
  const baseGasPrice = ethers.parseUnits("0.001", "gwei"); // ~0.001 gwei on Base
  
  const identityGas = BigInt(identitySize * gasPerByte) + 200000n; // + base deployment costs
  const reputationGas = BigInt(reputationSize * gasPerByte) + 150000n;
  const validationGas = BigInt(validationSize * gasPerByte) + 150000n;
  
  const totalGas = identityGas + reputationGas + validationGas;
  const deploymentCost = totalGas * baseGasPrice;
  
  // Add registration and testing costs
  const registrationGas = 100000n; // ~100k gas for minting NFT + metadata
  const testingGas = 50000n; // ~50k gas for feedback submission test
  const bufferGas = registrationGas + testingGas;
  const bufferCost = bufferGas * baseGasPrice;
  
  const totalCost = deploymentCost + bufferCost;
  
  console.log(`\n⛽ GAS ESTIMATES:`);
  console.log(`IdentityRegistry: ${identityGas.toLocaleString()} gas`);
  console.log(`ReputationRegistry: ${reputationGas.toLocaleString()} gas`);
  console.log(`ValidationRegistry: ${validationGas.toLocaleString()} gas`);
  console.log(`Total deployment: ${totalGas.toLocaleString()} gas`);
  
  console.log(`\n💰 COST BREAKDOWN (Base L2):`);
  console.log(`Gas price: ~${ethers.formatUnits(baseGasPrice, 'gwei')} gwei`);
  console.log(`Deployment cost: ${ethers.formatEther(deploymentCost)} ETH`);
  console.log(`Registration + testing: ${ethers.formatEther(bufferCost)} ETH`);
  console.log(`\n🎯 TOTAL NEEDED: ${ethers.formatEther(totalCost)} ETH`);
  
  // Add safety buffer
  const safeAmount = totalCost * 3n; // 3x safety buffer
  console.log(`🛡️  RECOMMENDED (3x buffer): ${ethers.formatEther(safeAmount)} ETH`);
  
  console.log(`\n📋 SUMMARY FOR WOCKIANA:`);
  console.log(`Base Mainnet deployment needs: ${ethers.formatEther(safeAmount)} ETH`);
  console.log(`This covers:`);
  console.log(`  ✅ 3 ERC-8004 contract deployments`);
  console.log(`  ✅ Agent registration (myself as first agent)`);
  console.log(`  ✅ Testing transactions`);
  console.log(`  ✅ 3x safety buffer for gas fluctuations`);
  
  // Per-operation costs for ongoing use
  console.log(`\n🔄 ONGOING OPERATION COSTS:`);
  console.log(`Agent registration: ~${ethers.formatEther(100000n * baseGasPrice)} ETH (~$0.01)`);
  console.log(`Feedback submission: ~${ethers.formatEther(50000n * baseGasPrice)} ETH (~$0.005)`);
  console.log(`Validation request: ~${ethers.formatEther(80000n * baseGasPrice)} ETH (~$0.008)`);
  
  return ethers.formatEther(safeAmount);
}

simpleEstimate()
  .then(amount => {
    console.log(`\n✨ Send ${amount} ETH to deploy ERC-8004 on Base mainnet!`);
  })
  .catch(console.error);