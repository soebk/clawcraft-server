const { ethers } = require("hardhat");

async function checkBalance() {
  const [signer] = await ethers.getSigners();
  const address = signer.address;
  const balance = await ethers.provider.getBalance(address);
  
  console.log(`💰 Wallet: ${address}`);
  console.log(`💵 Balance: ${ethers.formatEther(balance)} ETH`);
  
  if (balance > 0) {
    console.log("✅ Ready to deploy!");
    return true;
  } else {
    console.log("⏳ Waiting for ETH transfer...");
    return false;
  }
}

checkBalance().catch(console.error);