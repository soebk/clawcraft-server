#!/usr/bin/env node
/**
 * Generate a new wallet for ClawCraft deployment
 * WARNING: Save the private key securely!
 */

const { ethers } = require('ethers');

const wallet = ethers.Wallet.createRandom();

console.log('🔑 New Wallet Generated');
console.log('========================');
console.log('');
console.log('Address:', wallet.address);
console.log('Private Key:', wallet.privateKey);
console.log('');
console.log('⚠️  SAVE THE PRIVATE KEY SECURELY!');
console.log('');
console.log('Next steps:');
console.log('1. Get Base Sepolia ETH: https://www.alchemy.com/faucets/base-sepolia');
console.log('2. Export for deployment:');
console.log('');
console.log(`   export DEPLOYER_PRIVATE_KEY=${wallet.privateKey}`);
console.log(`   export TREASURY_ADDRESS=${wallet.address}`);
console.log(`   export ORACLE_ADDRESS=${wallet.address}`);
console.log('');
console.log('3. Run: cd /root/projects/clawcraft/scripts && ./deploy-base-sepolia.sh');
