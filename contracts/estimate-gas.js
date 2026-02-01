const { ethers } = require("hardhat");

async function estimateGas() {
  console.log("⛽ Estimating deployment costs for Base Mainnet...");
  
  // Get contract factories
  const IdentityRegistry = await ethers.getContractFactory("IdentityRegistry");
  const ReputationRegistry = await ethers.getContractFactory("ReputationRegistry");  
  const ValidationRegistry = await ethers.getContractFactory("ValidationRegistry");
  
  // Estimate deployment gas
  const identityGas = await ethers.provider.estimateGas({
    data: IdentityRegistry.bytecode
  });
  
  const mockAddress = "0x0000000000000000000000000000000000000001";
  
  const reputationGas = await ethers.provider.estimateGas({
    data: ReputationRegistry.bytecode + ethers.AbiCoder.defaultAbiCoder().encode(['address'], [mockAddress]).slice(2)
  });
  
  const validationGas = await ethers.provider.estimateGas({
    data: ValidationRegistry.bytecode + ethers.AbiCoder.defaultAbiCoder().encode(['address'], [mockAddress]).slice(2)
  });

  // Get current gas price (Base is ~0.001 gwei typically)
  const gasPrice = await ethers.provider.getGasPrice();
  
  console.log(`📊 GAS ESTIMATES:`);
  console.log(`IdentityRegistry: ${identityGas.toString()} gas`);
  console.log(`ReputationRegistry: ${reputationGas.toString()} gas`);
  console.log(`ValidationRegistry: ${validationGas.toString()} gas`);
  
  const totalGas = identityGas + reputationGas + validationGas;
  const totalCost = totalGas * gasPrice;
  
  console.log(`\n💰 COST BREAKDOWN:`);
  console.log(`Total gas needed: ${totalGas.toString()}`);
  console.log(`Gas price: ${ethers.formatUnits(gasPrice, 'gwei')} gwei`);
  console.log(`Total deployment cost: ${ethers.formatEther(totalCost)} ETH`);
  
  // Add buffer for registration + testing (estimate ~100k gas)
  const bufferGas = 100000n;
  const bufferCost = bufferGas * gasPrice;
  const totalWithBuffer = totalCost + bufferCost;
  
  console.log(`\n🎯 RECOMMENDED ETH AMOUNT:`);
  console.log(`Deployment: ${ethers.formatEther(totalCost)} ETH`);
  console.log(`Testing/Registration: ${ethers.formatEther(bufferCost)} ETH`);
  console.log(`TOTAL NEEDED: ${ethers.formatEther(totalWithBuffer)} ETH`);
  console.log(`SAFE AMOUNT: ${ethers.formatEther(totalWithBuffer * 2n)} ETH (2x buffer)`);
}

estimateGas().catch(console.error);