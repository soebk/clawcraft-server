const { ethers } = require("hardhat");
const fs = require('fs');

async function main() {
  console.log("🚀 Deploying Updated ERC-8004 Contracts to Base Mainnet...");
  console.log("📋 Security improvements included");
  
  const [deployer] = await ethers.getSigners();
  console.log(`📍 Deploying with account: ${deployer.address}`);
  
  // Check balance
  const balance = await ethers.provider.getBalance(deployer.address);
  console.log(`💰 Account balance: ${ethers.formatEther(balance)} ETH`);
  
  if (balance < ethers.parseEther("0.001")) {
    throw new Error("❌ Insufficient balance for deployment");
  }

  const deployments = {};
  let totalGasUsed = 0n;

  // 1. Deploy IdentityRegistry (no constructor args)
  console.log("\n1️⃣ Deploying IdentityRegistry...");
  const IdentityRegistry = await ethers.getContractFactory("IdentityRegistry");
  const identityRegistry = await IdentityRegistry.deploy();
  await identityRegistry.waitForDeployment();
  
  const identityAddress = await identityRegistry.getAddress();
  deployments.IdentityRegistry = identityAddress;
  console.log(`✅ IdentityRegistry deployed: ${identityAddress}`);
  
  const identityTx = identityRegistry.deploymentTransaction();
  const identityReceipt = await identityTx.wait();
  totalGasUsed += identityReceipt.gasUsed;
  console.log(`⛽ Gas used: ${identityReceipt.gasUsed.toString()}`);

  // 2. Deploy ReputationRegistry (takes IdentityRegistry address)
  console.log("\n2️⃣ Deploying ReputationRegistry...");
  const ReputationRegistry = await ethers.getContractFactory("ReputationRegistry");
  const reputationRegistry = await ReputationRegistry.deploy(identityAddress);
  await reputationRegistry.waitForDeployment();
  
  const reputationAddress = await reputationRegistry.getAddress();
  deployments.ReputationRegistry = reputationAddress;
  console.log(`✅ ReputationRegistry deployed: ${reputationAddress}`);
  
  const reputationTx = reputationRegistry.deploymentTransaction();
  const reputationReceipt = await reputationTx.wait();
  totalGasUsed += reputationReceipt.gasUsed;
  console.log(`⛽ Gas used: ${reputationReceipt.gasUsed.toString()}`);

  // 3. Deploy ValidationRegistry (takes IdentityRegistry address)
  console.log("\n3️⃣ Deploying ValidationRegistry...");
  const ValidationRegistry = await ethers.getContractFactory("ValidationRegistry");
  const validationRegistry = await ValidationRegistry.deploy(identityAddress);
  await validationRegistry.waitForDeployment();
  
  const validationAddress = await validationRegistry.getAddress();
  deployments.ValidationRegistry = validationAddress;
  console.log(`✅ ValidationRegistry deployed: ${validationAddress}`);
  
  const validationTx = validationRegistry.deploymentTransaction();
  const validationReceipt = await validationTx.wait();
  totalGasUsed += validationReceipt.gasUsed;
  console.log(`⛽ Gas used: ${validationReceipt.gasUsed.toString()}`);

  // Calculate total costs
  const gasPrice = identityReceipt.gasPrice;
  const totalCost = totalGasUsed * gasPrice;
  
  console.log("\n🎯 DEPLOYMENT COMPLETE!");
  console.log("=" .repeat(60));
  console.log(`📍 Network: Base Mainnet (chainId: 8453)`);
  console.log(`👤 Deployer: ${deployer.address}`);
  console.log(`⛽ Total Gas Used: ${totalGasUsed.toString()}`);
  console.log(`💰 Total Cost: ${ethers.formatEther(totalCost)} ETH`);
  console.log("");
  console.log("📋 NEW CONTRACT ADDRESSES:");
  console.log(`🏛️  IdentityRegistry: ${deployments.IdentityRegistry}`);
  console.log(`⭐ ReputationRegistry: ${deployments.ReputationRegistry}`);
  console.log(`✅ ValidationRegistry: ${deployments.ValidationRegistry}`);
  
  console.log("\n🔗 BaseScan Links:");
  console.log(`   IdentityRegistry: https://basescan.org/address/${deployments.IdentityRegistry}`);
  console.log(`   ReputationRegistry: https://basescan.org/address/${deployments.ReputationRegistry}`);
  console.log(`   ValidationRegistry: https://basescan.org/address/${deployments.ValidationRegistry}`);

  // Save deployment data
  const deploymentData = {
    network: 'base',
    chainId: 8453,
    deployer: deployer.address,
    timestamp: new Date().toISOString(),
    totalGasUsed: totalGasUsed.toString(),
    totalCost: ethers.formatEther(totalCost),
    contracts: deployments,
    version: 'v2_security_improvements'
  };
  
  fs.writeFileSync('./deployments-v2.json', JSON.stringify(deploymentData, null, 2));
  console.log("\n💾 Deployment data saved to deployments-v2.json");

  console.log("\n📋 VERIFICATION COMMANDS:");
  console.log(`npx hardhat verify --network base ${deployments.IdentityRegistry}`);
  console.log(`npx hardhat verify --network base ${deployments.ReputationRegistry} ${deployments.IdentityRegistry}`);
  console.log(`npx hardhat verify --network base ${deployments.ValidationRegistry} ${deployments.IdentityRegistry}`);

  console.log("\n🔧 NEXT STEPS:");
  console.log("1. Update gatekeeper at /root/projects/clawcraft/gatekeeper/index.js");
  console.log(`   Set IdentityRegistry address to: ${deployments.IdentityRegistry}`);
  console.log("2. Run verification commands above");
  console.log("3. Test agent registration with new contracts");

  return deployments;
}

main()
  .then((deployments) => {
    console.log("\n🎉 ERC-8004 v2 deployment successful!");
    process.exit(0);
  })
  .catch((error) => {
    console.error("❌ Deployment failed:", error);
    process.exit(1);
  });