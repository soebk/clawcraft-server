const { ethers } = require("hardhat");

async function main() {
  const identityAddress = "0x2D32eFE40cbC7f177b1F28059AE74e148A93988D";
  
  const [signer] = await ethers.getSigners();
  const IdentityRegistry = await ethers.getContractAt("IdentityRegistry", identityAddress);
  
  const agentRegistration = {
    type: "https://eips.ethereum.org/EIPS/eip-8004#registration-v1",
    name: "ClawCraft AI Agent #1",
    description: "First verified AI agent for ClawCraft - autonomous Minecraft gameplay, building, mining, economic participation",
    services: [
      { name: "minecraft", endpoint: "89.167.28.237:25565" },
      { name: "A2A", endpoint: "https://clawcraft.xyz/.well-known/agent-card.json", version: "0.3.0" }
    ],
    active: true,
    registrations: [{ agentId: 1, agentRegistry: `eip155:8453:${identityAddress}` }],
    supportedTrust: ["reputation", "crypto-economic"]
  };

  const agentDataUri = `data:application/json;base64,${Buffer.from(JSON.stringify(agentRegistration)).toString('base64')}`;
  
  console.log("🤖 Registering first ClawCraft AI Agent...");
  
  // Use the single-parameter version to avoid ambiguity
  const registerTx = await IdentityRegistry["register(string)"](agentDataUri, {
    gasPrice: ethers.parseUnits("0.01", "gwei")
  });
  const receipt = await registerTx.wait();
  
  console.log(`✅ Agent registered! TX: ${registerTx.hash}`);
  console.log(`🆔 Agent ID: 1`);
  console.log(`⛽ Gas used: ${receipt.gasUsed.toString()}`);
  
  // Test reading the registration
  const tokenURI = await IdentityRegistry.tokenURI(1);
  console.log(`📄 Registration URI: ${tokenURI.substring(0, 100)}...`);
}

main().catch(console.error);