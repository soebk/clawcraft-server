const { ethers } = require("hardhat");

async function main() {
  console.log("🚀 Deploying remaining ERC-8004 contracts...");
  
  const [deployer] = await ethers.getSigners();
  console.log(`📍 Deploying with account: ${deployer.address}`);
  
  // IdentityRegistry already deployed
  const identityAddress = "0x2D32eFE40cbC7f177b1F28059AE74e148A93988D";
  console.log(`🏛️ Using existing IdentityRegistry: ${identityAddress}`);
  
  const balance = await ethers.provider.getBalance(deployer.address);
  console.log(`💰 Account balance: ${ethers.formatEther(balance)} ETH`);
  
  let gasUsed = 0n;
  const deployments = { IdentityRegistry: identityAddress };

  // 2. Deploy ReputationRegistry with proper gas settings
  console.log("\n2️⃣ Deploying ReputationRegistry...");
  const ReputationRegistry = await ethers.getContractFactory("ReputationRegistry");
  const reputationRegistry = await ReputationRegistry.deploy(identityAddress, {
    gasLimit: 3000000,
    gasPrice: ethers.parseUnits("0.01", "gwei")
  });
  await reputationRegistry.waitForDeployment();
  
  const reputationAddress = await reputationRegistry.getAddress();
  deployments.ReputationRegistry = reputationAddress;
  console.log(`✅ ReputationRegistry deployed: ${reputationAddress}`);
  
  const reputationTx = reputationRegistry.deploymentTransaction();
  const reputationReceipt = await reputationTx.wait();
  gasUsed += reputationReceipt.gasUsed;
  console.log(`⛽ Gas used: ${reputationReceipt.gasUsed.toString()}`);

  // 3. Deploy ValidationRegistry with proper gas settings
  console.log("\n3️⃣ Deploying ValidationRegistry...");
  const ValidationRegistry = await ethers.getContractFactory("ValidationRegistry");
  const validationRegistry = await ValidationRegistry.deploy(identityAddress, {
    gasLimit: 2000000,
    gasPrice: ethers.parseUnits("0.01", "gwei")
  });
  await validationRegistry.waitForDeployment();
  
  const validationAddress = await validationRegistry.getAddress();
  deployments.ValidationRegistry = validationAddress;
  console.log(`✅ ValidationRegistry deployed: ${validationAddress}`);
  
  const validationTx = validationRegistry.deploymentTransaction();
  const validationReceipt = await validationTx.wait();
  gasUsed += validationReceipt.gasUsed;
  console.log(`⛽ Gas used: ${validationReceipt.gasUsed.toString()}`);

  // Calculate costs
  const gasPrice = reputationReceipt.gasPrice;
  const totalCost = gasUsed * gasPrice;
  
  console.log("\n🎯 DEPLOYMENT COMPLETE!");
  console.log("=" .repeat(50));
  console.log(`📍 Network: Base Mainnet (chainId: 8453)`);
  console.log(`👤 Deployer: ${deployer.address}`);
  console.log(`⛽ Total Gas Used: ${gasUsed.toString()}`);
  console.log(`💰 Total Cost: ${ethers.formatEther(totalCost)} ETH`);
  console.log("");
  console.log("📋 ALL CONTRACT ADDRESSES:");
  console.log(`🏛️  IdentityRegistry: ${deployments.IdentityRegistry}`);
  console.log(`⭐ ReputationRegistry: ${deployments.ReputationRegistry}`);
  console.log(`✅ ValidationRegistry: ${deployments.ValidationRegistry}`);

  // Test agent registration
  console.log("\n🧪 TESTING AGENT REGISTRATION...");
  
  const IdentityRegistry = await ethers.getContractAt("IdentityRegistry", identityAddress);
  
  const agentRegistration = {
    type: "https://eips.ethereum.org/EIPS/eip-8004#registration-v1",
    name: "ClawCraft AI Agent #1",
    description: "First verified AI agent for ClawCraft Minecraft server - autonomous gameplay, building, mining, and economic participation",
    image: "https://clawcraft.xyz/agent-avatar.png",
    services: [
      {
        name: "minecraft",
        endpoint: "89.167.28.237:25565"
      },
      {
        name: "A2A",
        endpoint: "https://clawcraft.xyz/.well-known/agent-card.json",
        version: "0.3.0"
      }
    ],
    x402Support: false,
    active: true,
    registrations: [
      {
        agentId: 1,
        agentRegistry: `eip155:8453:${identityAddress}`
      }
    ],
    supportedTrust: ["reputation", "crypto-economic"]
  };

  const agentDataUri = `data:application/json;base64,${Buffer.from(JSON.stringify(agentRegistration)).toString('base64')}`;
  
  console.log("🤖 Registering first ClawCraft AI Agent...");
  const registerTx = await IdentityRegistry.register(agentDataUri, {
    gasPrice: ethers.parseUnits("0.01", "gwei")
  });
  const registerReceipt = await registerTx.wait();
  
  console.log(`✅ Agent registered! Transaction: ${registerTx.hash}`);
  console.log(`🆔 Agent ID: 1`);
  console.log(`⛽ Registration gas used: ${registerReceipt.gasUsed.toString()}`);
  
  console.log("\n🎉 ERC-8004 DEPLOYMENT COMPLETE!");
  console.log("🔗 View contracts on BaseScan:");
  console.log(`   IdentityRegistry: https://basescan.org/address/${deployments.IdentityRegistry}`);
  console.log(`   ReputationRegistry: https://basescan.org/address/${deployments.ReputationRegistry}`);
  console.log(`   ValidationRegistry: https://basescan.org/address/${deployments.ValidationRegistry}`);
  
  console.log("\n🎮 NEXT STEPS:");
  console.log("1. Update Minecraft plugin with IdentityRegistry address");
  console.log("2. Deploy plugin to ClawCraft server");
  console.log("3. Only ERC-8004 verified agents can now join!");

  // Save deployment info
  const fs = require('fs');
  const deploymentData = {
    network: 'base',
    chainId: 8453,
    deployer: deployer.address,
    timestamp: new Date().toISOString(),
    totalGasUsed: gasUsed.toString(),
    totalCost: ethers.formatEther(totalCost),
    contracts: deployments,
    firstAgentTx: registerTx.hash
  };
  
  fs.writeFileSync('./base-mainnet-deployments.json', JSON.stringify(deploymentData, null, 2));
  console.log("\n💾 Deployment data saved to base-mainnet-deployments.json");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("❌ Deployment failed:", error);
    process.exit(1);
  });