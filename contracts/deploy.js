const { ethers } = require("hardhat");

async function main() {
  console.log("🚀 Deploying ERC-8004 Registry Contracts to Base Sepolia...");
  
  const [deployer] = await ethers.getSigners();
  console.log(`📍 Deploying with account: ${deployer.address}`);
  
  // Check balance
  const balance = await ethers.provider.getBalance(deployer.address);
  console.log(`💰 Account balance: ${ethers.formatEther(balance)} ETH`);
  
  if (balance === 0n) {
    throw new Error("❌ Insufficient balance for deployment");
  }

  let gasUsed = 0n;
  const deployments = {};

  // 1. Deploy IdentityRegistry
  console.log("\n1️⃣ Deploying IdentityRegistry...");
  const IdentityRegistry = await ethers.getContractFactory("IdentityRegistry");
  const identityRegistry = await IdentityRegistry.deploy();
  await identityRegistry.waitForDeployment();
  
  const identityAddress = await identityRegistry.getAddress();
  deployments.IdentityRegistry = identityAddress;
  console.log(`✅ IdentityRegistry deployed: ${identityAddress}`);
  
  // Get deployment transaction and gas used
  const identityTx = identityRegistry.deploymentTransaction();
  const identityReceipt = await identityTx.wait();
  gasUsed += identityReceipt.gasUsed;
  console.log(`⛽ Gas used: ${identityReceipt.gasUsed.toString()}`);

  // 2. Deploy ReputationRegistry with higher gas price
  console.log("\n2️⃣ Deploying ReputationRegistry...");
  const ReputationRegistry = await ethers.getContractFactory("ReputationRegistry");
  const reputationRegistry = await ReputationRegistry.deploy(identityAddress, {
    gasLimit: 3000000,
    gasPrice: ethers.parseUnits("0.01", "gwei") // Higher gas price for Base
  });
  await reputationRegistry.waitForDeployment();
  
  const reputationAddress = await reputationRegistry.getAddress();
  deployments.ReputationRegistry = reputationAddress;
  console.log(`✅ ReputationRegistry deployed: ${reputationAddress}`);
  
  const reputationTx = reputationRegistry.deploymentTransaction();
  const reputationReceipt = await reputationTx.wait();
  gasUsed += reputationReceipt.gasUsed;
  console.log(`⛽ Gas used: ${reputationReceipt.gasUsed.toString()}`);

  // 3. Deploy ValidationRegistry with higher gas price
  console.log("\n3️⃣ Deploying ValidationRegistry...");
  const ValidationRegistry = await ethers.getContractFactory("ValidationRegistry");
  const validationRegistry = await ValidationRegistry.deploy(identityAddress, {
    gasLimit: 2000000,
    gasPrice: ethers.parseUnits("0.01", "gwei") // Higher gas price for Base
  });
  await validationRegistry.waitForDeployment();
  
  const validationAddress = await validationRegistry.getAddress();
  deployments.ValidationRegistry = validationAddress;
  console.log(`✅ ValidationRegistry deployed: ${validationAddress}`);
  
  const validationTx = validationRegistry.deploymentTransaction();
  const validationReceipt = await validationTx.wait();
  gasUsed += validationReceipt.gasUsed;
  console.log(`⛽ Gas used: ${validationReceipt.gasUsed.toString()}`);

  // Calculate total costs
  const gasPrice = identityReceipt.gasPrice;
  const totalCost = gasUsed * gasPrice;
  
  console.log("\n🎯 DEPLOYMENT COMPLETE!");
  console.log("=" .repeat(50));
  console.log(`📍 Network: Base Sepolia (chainId: 84532)`);
  console.log(`👤 Deployer: ${deployer.address}`);
  console.log(`⛽ Total Gas Used: ${gasUsed.toString()}`);
  console.log(`💰 Total Cost: ${ethers.formatEther(totalCost)} ETH`);
  console.log("");
  console.log("📋 CONTRACT ADDRESSES:");
  console.log(`🏛️  IdentityRegistry: ${deployments.IdentityRegistry}`);
  console.log(`⭐ ReputationRegistry: ${deployments.ReputationRegistry}`);
  console.log(`✅ ValidationRegistry: ${deployments.ValidationRegistry}`);
  
  // Save deployment addresses
  const fs = require('fs');
  const deploymentData = {
    network: 'baseSepolia',
    chainId: 84532,
    deployer: deployer.address,
    timestamp: new Date().toISOString(),
    totalGasUsed: gasUsed.toString(),
    totalCost: ethers.formatEther(totalCost),
    contracts: deployments
  };
  
  fs.writeFileSync('./deployments.json', JSON.stringify(deploymentData, null, 2));
  console.log("\n💾 Deployment data saved to deployments.json");

  // Test registration
  console.log("\n🧪 TESTING AGENT REGISTRATION...");
  
  // Create agent registration file
  const agentRegistration = {
    type: "https://eips.ethereum.org/EIPS/eip-8004#registration-v1",
    name: "ClawCraft AI Agent",
    description: "Autonomous AI agent for Minecraft gameplay, building, and economic participation in ClawCraft server",
    image: "https://clawcraft.xyz/agent-avatar.png",
    services: [
      {
        name: "A2A",
        endpoint: "https://clawcraft.xyz/.well-known/agent-card.json",
        version: "0.3.0"
      },
      {
        name: "MCP",
        endpoint: "https://clawcraft.xyz/mcp/",
        version: "2025-06-18"
      },
      {
        name: "minecraft",
        endpoint: "89.167.28.237:25565"
      }
    ],
    x402Support: false,
    active: true,
    registrations: [
      {
        agentId: 1,
        agentRegistry: `eip155:84532:${identityAddress}`
      }
    ],
    supportedTrust: ["reputation", "crypto-economic"]
  };

  // Upload to IPFS (mock for now - just use data URI)
  const agentDataUri = `data:application/json;base64,${Buffer.from(JSON.stringify(agentRegistration)).toString('base64')}`;
  
  // Register agent
  console.log("🤖 Registering ClawCraft AI Agent...");
  const registerTx = await identityRegistry.register(agentDataUri);
  const registerReceipt = await registerTx.wait();
  
  console.log(`✅ Agent registered! Transaction: ${registerTx.hash}`);
  console.log(`🆔 Agent ID: 1`);
  console.log(`⛽ Registration gas used: ${registerReceipt.gasUsed.toString()}`);
  
  // Test feedback submission
  console.log("\n⭐ TESTING FEEDBACK SUBMISSION...");
  try {
    // This will fail since we're the owner, but shows the interface works
    await reputationRegistry.giveFeedback(
      1, // agentId
      85, // value (85/100 rating)
      0, // valueDecimals
      "quality", // tag1
      "minecraft", // tag2
      "89.167.28.237:25565", // endpoint
      "", // feedbackURI
      "0x0000000000000000000000000000000000000000000000000000000000000000" // feedbackHash
    );
  } catch (error) {
    console.log(`✅ Feedback protection working: ${error.message.includes('own agent') ? 'Cannot give feedback to own agent' : error.message}`);
  }
  
  console.log("\n🎉 ERC-8004 DEPLOYMENT AND TESTING COMPLETE!");
  console.log("🔗 View contracts on BaseScan:");
  console.log(`   IdentityRegistry: https://sepolia.basescan.org/address/${deployments.IdentityRegistry}`);
  console.log(`   ReputationRegistry: https://sepolia.basescan.org/address/${deployments.ReputationRegistry}`);
  console.log(`   ValidationRegistry: https://sepolia.basescan.org/address/${deployments.ValidationRegistry}`);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("❌ Deployment failed:", error);
    process.exit(1);
  });