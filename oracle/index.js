/**
 * AgentCraft Oracle - Bridges game events to blockchain rewards
 * Listens to agent events and calls smart contract to mint rewards
 */

require('dotenv').config({ path: '../.env' });
const { ethers } = require('ethers');
const EventEmitter = require('events');
const fs = require('fs');

// Reward amounts (must match contract)
const REWARDS = {
  diamond: 100n * 10n**18n,
  deepslate_diamond_ore: 100n * 10n**18n,
  diamond_ore: 100n * 10n**18n,
  mob_killed: 10n * 10n**18n,
  structure: 50n * 10n**18n,
  exploration: 25n * 10n**18n,
  // Other valuable ores
  emerald_ore: 75n * 10n**18n,
  ancient_debris: 150n * 10n**18n,
  gold_ore: 25n * 10n**18n,
  iron_ore: 5n * 10n**18n,
  coal_ore: 2n * 10n**18n,
  lapis_ore: 15n * 10n**18n,
  redstone_ore: 10n * 10n**18n
};

// Agent wallet addresses (configure these)
const AGENT_WALLETS = {
  AgentAlpha: process.env.AGENT_ALPHA_WALLET || '0x0000000000000000000000000000000000000001',
  AgentBeta: process.env.AGENT_BETA_WALLET || '0x0000000000000000000000000000000000000002',
  AgentGamma: process.env.AGENT_GAMMA_WALLET || '0x0000000000000000000000000000000000000003',
  AgentDelta: process.env.AGENT_DELTA_WALLET || '0x0000000000000000000000000000000000000004',
  AgentEpsilon: process.env.AGENT_EPSILON_WALLET || '0x0000000000000000000000000000000000000005'
};

// Contract ABI (minimal for minting)
const TOKEN_ABI = [
  'function mintReward(address agent, uint256 amount, string calldata reason) external',
  'function batchMintRewards(address[] calldata agents, uint256[] calldata amounts, string[] calldata reasons) external',
  'event RewardMinted(address indexed agent, uint256 amount, string reason)'
];

class AgentCraftOracle {
  constructor() {
    this.provider = null;
    this.wallet = null;
    this.contract = null;
    this.pendingRewards = [];
    this.batchInterval = 60000; // Batch rewards every 60 seconds
    this.isConnected = false;
  }

  async connect() {
    try {
      const rpcUrl = process.env.BASE_RPC_URL || 'https://sepolia.base.org';
      const privateKey = process.env.ORACLE_PRIVATE_KEY;
      const tokenAddress = process.env.TOKEN_ADDRESS;

      if (!privateKey || !tokenAddress) {
        console.log('[Oracle] Missing ORACLE_PRIVATE_KEY or TOKEN_ADDRESS - running in simulation mode');
        this.isConnected = false;
        return;
      }

      this.provider = new ethers.JsonRpcProvider(rpcUrl);
      this.wallet = new ethers.Wallet(privateKey, this.provider);
      this.contract = new ethers.Contract(tokenAddress, TOKEN_ABI, this.wallet);
      
      const balance = await this.provider.getBalance(this.wallet.address);
      console.log(`[Oracle] Connected to ${rpcUrl}`);
      console.log(`[Oracle] Wallet: ${this.wallet.address}`);
      console.log(`[Oracle] Balance: ${ethers.formatEther(balance)} ETH`);
      
      this.isConnected = true;
    } catch (err) {
      console.error('[Oracle] Connection failed:', err.message);
      this.isConnected = false;
    }
  }

  getRewardAmount(blockName) {
    // Check for ore blocks
    if (blockName.includes('diamond')) return REWARDS.diamond;
    if (blockName.includes('emerald')) return REWARDS.emerald_ore;
    if (blockName.includes('ancient_debris')) return REWARDS.ancient_debris;
    if (blockName.includes('gold') && blockName.includes('ore')) return REWARDS.gold_ore;
    if (blockName.includes('iron') && blockName.includes('ore')) return REWARDS.iron_ore;
    if (blockName.includes('coal') && blockName.includes('ore')) return REWARDS.coal_ore;
    if (blockName.includes('lapis')) return REWARDS.lapis_ore;
    if (blockName.includes('redstone') && blockName.includes('ore')) return REWARDS.redstone_ore;
    
    return null; // No reward for this block
  }

  queueReward(agent, amount, reason) {
    const wallet = AGENT_WALLETS[agent];
    if (!wallet || wallet.startsWith('0x000000')) {
      console.log(`[Oracle] No wallet configured for ${agent}, skipping reward`);
      return;
    }

    this.pendingRewards.push({
      agent,
      wallet,
      amount,
      reason,
      timestamp: Date.now()
    });

    console.log(`[Oracle] Queued reward: ${agent} +${ethers.formatEther(amount)} AGENT for "${reason}"`);
  }

  async processBatch() {
    if (this.pendingRewards.length === 0) return;
    if (!this.isConnected) {
      console.log(`[Oracle] Simulation: Would mint ${this.pendingRewards.length} rewards`);
      this.pendingRewards.forEach(r => {
        console.log(`  - ${r.agent}: ${ethers.formatEther(r.amount)} AGENT (${r.reason})`);
      });
      this.pendingRewards = [];
      return;
    }

    const rewards = [...this.pendingRewards];
    this.pendingRewards = [];

    try {
      if (rewards.length === 1) {
        // Single reward
        const r = rewards[0];
        const tx = await this.contract.mintReward(r.wallet, r.amount, r.reason);
        console.log(`[Oracle] Minted reward: ${tx.hash}`);
        await tx.wait();
      } else {
        // Batch rewards
        const agents = rewards.map(r => r.wallet);
        const amounts = rewards.map(r => r.amount);
        const reasons = rewards.map(r => r.reason);
        
        const tx = await this.contract.batchMintRewards(agents, amounts, reasons);
        console.log(`[Oracle] Batch minted ${rewards.length} rewards: ${tx.hash}`);
        await tx.wait();
      }
    } catch (err) {
      console.error('[Oracle] Failed to mint rewards:', err.message);
      // Re-queue failed rewards
      this.pendingRewards = [...rewards, ...this.pendingRewards];
    }
  }

  // Event handlers
  onBlockMined(data) {
    const { agent, block } = data;
    const reward = this.getRewardAmount(block);
    
    if (reward) {
      this.queueReward(agent, reward, `Mined ${block}`);
    }
  }

  onMobKilled(data) {
    const { agent, mob } = data;
    this.queueReward(agent, REWARDS.mob_killed, `Killed ${mob}`);
  }

  onStructureBuilt(data) {
    const { agent, structure } = data;
    this.queueReward(agent, REWARDS.structure, `Built ${structure}`);
  }

  startBatchProcessor() {
    setInterval(() => this.processBatch(), this.batchInterval);
    console.log(`[Oracle] Batch processor started (${this.batchInterval / 1000}s interval)`);
  }
}

// Export for use by agent launcher
module.exports = AgentCraftOracle;

// Run standalone if called directly
if (require.main === module) {
  const oracle = new AgentCraftOracle();
  oracle.connect().then(() => {
    oracle.startBatchProcessor();
    console.log('[Oracle] Running standalone - waiting for events via IPC');
    
    // Keep process alive
    process.on('SIGINT', () => {
      console.log('\n[Oracle] Shutting down...');
      oracle.processBatch().then(() => process.exit(0));
    });
  });
}
