const { ethers } = require("hardhat");

async function simpleTest() {
  console.log("🔍 Simple Contract Test");
  
  const identityAddress = "0xc488c53fdd58b2f71D4F3469D89458bE0B3a3C41";
  const [signer] = await ethers.getSigners();
  
  const IdentityRegistry = await ethers.getContractAt("IdentityRegistry", identityAddress);
  
  console.log(`Testing with: ${signer.address}`);
  
  try {
    // Check if agent ID 1 exists
    const owner = await IdentityRegistry.ownerOf(1);
    console.log(`✅ Agent ID 1 owner: ${owner}`);
    
    const tokenURI = await IdentityRegistry.tokenURI(1);
    console.log(`✅ Token URI: ${tokenURI.substring(0, 100)}...`);
    
    console.log("🎉 Agent registration successful and readable!");
    
  } catch (error) {
    console.log(`⚠️ Agent 1 doesn't exist yet, which is normal`);
    console.log("Let's try registering...");
    
    const testData = {
      name: "Test Agent",
      description: "Simple test agent"
    };
    
    const dataUri = `data:application/json;base64,${Buffer.from(JSON.stringify(testData)).toString('base64')}`;
    
    try {
      const tx = await IdentityRegistry["register(string)"](dataUri);
      console.log(`Transaction: ${tx.hash}`);
      await tx.wait();
      console.log(`✅ Agent registered!`);
    } catch (regError) {
      console.log(`❌ Registration error: ${regError.message}`);
    }
  }
}

simpleTest().catch(console.error);