/**
 * ClawCraft Economy System
 * Claw Coins (CC) - in-game currency
 */

const fs = require('fs');
const path = require('path');

// Earning rates
const EARNINGS = {
  // Mining
  diamond: 50,
  diamond_ore: 50,
  deepslate_diamond_ore: 50,
  emerald_ore: 40,
  gold_ore: 10,
  iron_ore: 5,
  coal_ore: 2,
  copper_ore: 3,
  lapis_ore: 8,
  redstone_ore: 6,
  ancient_debris: 100,
  
  // Combat
  mob_kill: 10,
  player_kill: 25,
  player_kill_steal_percent: 0.10, // Steal 10% of victim's CC
  
  // Farming
  crop_harvest: 3,
  potion_brew: 15,
  
  // Building
  structure_built: 20, // 10+ blocks in pattern
  
  // Exploration
  new_chunk: 5,
  stronghold_discovery: 200,
  monument_discovery: 150,
  fortress_discovery: 100,
  
  // Trading
  trade_complete: 10, // Both parties get this
  
  // Events
  war_win: 100,
  king_of_hill_win: 200,
  gold_rush_participation: 20
};

// Shop prices
const SHOP = {
  diamond_pickaxe: 100,
  diamond_sword: 80,
  diamond_axe: 70,
  iron_armor_set: 80,
  diamond_armor_set: 200,
  golden_apple: 30,
  enchanted_golden_apple: 150,
  tnt: 5, // Per unit
  ender_pearl: 8, // Per unit
  bow: 25,
  arrow: 1, // Per unit (sold in stacks)
  cooked_beef: 2,
  bread: 1,
  shield: 30,
  crossbow: 40,
  firework_rocket: 3
};

// Contraband prices (premium)
const CONTRABAND_PRICES = {
  white_powder: 25,    // Speed II + Haste II
  crimson_dust: 30,    // Strength II + Fire Resistance
  dark_roast: 20,      // Night Vision + Jump Boost II
  void_extract: 40,    // Invisibility + Slow Falling
  luminite: 35         // Glowing + Regeneration II
};

const DATA_PATH = path.join(__dirname, '../data/economy.json');

class EconomyManager {
  constructor() {
    this.balances = {};
    this.transactions = [];
    this.load();
  }

  load() {
    try {
      if (fs.existsSync(DATA_PATH)) {
        const data = JSON.parse(fs.readFileSync(DATA_PATH, 'utf8'));
        this.balances = data.balances || {};
        this.transactions = data.transactions || [];
      }
    } catch (err) {
      console.error('[Economy] Failed to load data:', err.message);
      this.balances = {};
      this.transactions = [];
    }
  }

  save() {
    try {
      const dir = path.dirname(DATA_PATH);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
      fs.writeFileSync(DATA_PATH, JSON.stringify({
        balances: this.balances,
        transactions: this.transactions.slice(-1000) // Keep last 1000
      }, null, 2));
    } catch (err) {
      console.error('[Economy] Failed to save data:', err.message);
    }
  }

  getBalance(agent) {
    return this.balances[agent] || 0;
  }

  setBalance(agent, amount) {
    this.balances[agent] = Math.max(0, amount);
    this.save();
  }

  addBalance(agent, amount, reason) {
    const oldBalance = this.getBalance(agent);
    const newBalance = oldBalance + amount;
    this.balances[agent] = Math.max(0, newBalance);
    
    this.transactions.push({
      agent,
      type: 'credit',
      amount,
      reason,
      balance: this.balances[agent],
      timestamp: Date.now()
    });
    
    this.save();
    console.log(`[Economy] ${agent} +${amount} CC (${reason}) → ${this.balances[agent]} CC`);
    return this.balances[agent];
  }

  removeBalance(agent, amount, reason) {
    const oldBalance = this.getBalance(agent);
    if (oldBalance < amount) {
      return false; // Insufficient funds
    }
    
    this.balances[agent] = oldBalance - amount;
    
    this.transactions.push({
      agent,
      type: 'debit',
      amount,
      reason,
      balance: this.balances[agent],
      timestamp: Date.now()
    });
    
    this.save();
    console.log(`[Economy] ${agent} -${amount} CC (${reason}) → ${this.balances[agent]} CC`);
    return true;
  }

  // Reward for mining
  rewardMining(agent, block) {
    const reward = EARNINGS[block] || EARNINGS[block.replace('deepslate_', '')] || 0;
    if (reward > 0) {
      this.addBalance(agent, reward, `Mined ${block}`);
      return reward;
    }
    return 0;
  }

  // Reward for killing
  rewardKill(killer, victim, isPlayer = false) {
    if (isPlayer) {
      // PvP kill - base reward + steal percentage
      const baseReward = EARNINGS.player_kill;
      const victimBalance = this.getBalance(victim);
      const stolen = Math.floor(victimBalance * EARNINGS.player_kill_steal_percent);
      
      this.removeBalance(victim, stolen, `Killed by ${killer}`);
      this.addBalance(killer, baseReward + stolen, `Killed ${victim} (+${stolen} stolen)`);
      
      return baseReward + stolen;
    } else {
      // Mob kill
      this.addBalance(killer, EARNINGS.mob_kill, `Killed ${victim}`);
      return EARNINGS.mob_kill;
    }
  }

  // Reward for farming
  rewardHarvest(agent, amount = 1) {
    const reward = EARNINGS.crop_harvest * amount;
    this.addBalance(agent, reward, `Harvested ${amount} crops`);
    return reward;
  }

  // Shop purchase
  buyItem(agent, item, quantity = 1) {
    const basePrice = SHOP[item];
    if (!basePrice) {
      return { success: false, error: 'Item not in shop' };
    }
    
    const totalPrice = basePrice * quantity;
    if (this.getBalance(agent) < totalPrice) {
      return { success: false, error: 'Insufficient CC' };
    }
    
    this.removeBalance(agent, totalPrice, `Bought ${quantity}x ${item}`);
    return { success: true, item, quantity, cost: totalPrice };
  }

  // Sell contraband
  sellContraband(agent, item, quantity = 1) {
    const price = CONTRABAND_PRICES[item];
    if (!price) {
      return { success: false, error: 'Invalid contraband' };
    }
    
    const total = price * quantity;
    this.addBalance(agent, total, `Sold ${quantity}x ${item}`);
    return { success: true, item, quantity, earned: total };
  }

  // Agent-to-agent trade
  trade(buyer, seller, itemDescription, price) {
    if (this.getBalance(buyer) < price) {
      return { success: false, error: 'Buyer has insufficient CC' };
    }
    
    this.removeBalance(buyer, price, `Trade with ${seller}: ${itemDescription}`);
    this.addBalance(seller, price, `Trade with ${buyer}: ${itemDescription}`);
    
    // Both get trade completion bonus
    this.addBalance(buyer, EARNINGS.trade_complete, 'Trade completion bonus');
    this.addBalance(seller, EARNINGS.trade_complete, 'Trade completion bonus');
    
    return { success: true, buyer, seller, price };
  }

  // Get leaderboard
  getLeaderboard(limit = 10) {
    return Object.entries(this.balances)
      .sort((a, b) => b[1] - a[1])
      .slice(0, limit)
      .map(([agent, balance], index) => ({
        rank: index + 1,
        agent,
        balance
      }));
  }

  // Get total circulation
  getTotalCirculation() {
    return Object.values(this.balances).reduce((sum, b) => sum + b, 0);
  }

  // Get recent transactions
  getRecentTransactions(limit = 50) {
    return this.transactions.slice(-limit);
  }
}

module.exports = {
  EARNINGS,
  SHOP,
  CONTRABAND_PRICES,
  EconomyManager
};
