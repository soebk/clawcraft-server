/**
 * ClawCraft Contraband System
 * DruggyCraft-inspired farming and refining
 */

// Crop to contraband mapping
const CONTRABAND = {
  white_powder: {
    name: 'White Powder',
    source: 'sugar_cane',
    refineRatio: 2, // 2 sugar cane = 1 white powder
    effects: ['speed:2:60', 'haste:2:60'],
    sellPrice: 25,
    description: 'Speed II + Haste II for 60 seconds'
  },
  crimson_dust: {
    name: 'Crimson Dust',
    source: 'nether_wart',
    refineRatio: 2,
    effects: ['strength:2:60', 'fire_resistance:1:60'],
    sellPrice: 30,
    description: 'Strength II + Fire Resistance for 60 seconds'
  },
  dark_roast: {
    name: 'Dark Roast',
    source: 'cocoa_beans',
    refineRatio: 3,
    effects: ['night_vision:1:60', 'jump_boost:2:60'],
    sellPrice: 20,
    description: 'Night Vision + Jump Boost II for 60 seconds'
  },
  void_extract: {
    name: 'Void Extract',
    source: 'chorus_fruit',
    refineRatio: 1,
    effects: ['invisibility:1:60', 'slow_falling:1:60'],
    sellPrice: 40,
    description: 'Invisibility + Slow Falling for 60 seconds',
    exclusive: 'VOID_WALKERS' // Only Void Walkers can produce
  },
  luminite: {
    name: 'Luminite',
    source: 'glow_berries',
    refineRatio: 5,
    effects: ['glowing:1:60', 'regeneration:2:60'],
    sellPrice: 35,
    description: 'Glowing + Regeneration II for 60 seconds'
  }
};

class ContrabandManager {
  constructor(factionManager) {
    this.factionManager = factionManager;
    this.inventory = {}; // { agentName: { white_powder: 5, ... } }
    this.activeEffects = {}; // { agentName: [{ type, endsAt }] }
    this.sheriffAgent = null;
    this.sheriffEndTime = null;
  }

  // Initialize agent contraband inventory
  initAgent(agentName) {
    if (!this.inventory[agentName]) {
      this.inventory[agentName] = {};
    }
    if (!this.activeEffects[agentName]) {
      this.activeEffects[agentName] = [];
    }
  }

  // Refine crops into contraband
  refine(agentName, cropType, amount) {
    this.initAgent(agentName);
    
    // Find matching contraband
    const contraband = Object.entries(CONTRABAND).find(([_, c]) => c.source === cropType);
    if (!contraband) {
      return { success: false, error: `Cannot refine ${cropType}` };
    }

    const [contrabandId, contrabandData] = contraband;

    // Check faction exclusivity
    if (contrabandData.exclusive) {
      const agentFaction = this.factionManager.getFactionId(agentName);
      if (agentFaction !== contrabandData.exclusive) {
        return { success: false, error: `Only ${contrabandData.exclusive} can produce ${contrabandData.name}` };
      }
    }

    // Calculate yield
    const yield_ = Math.floor(amount / contrabandData.refineRatio);
    if (yield_ < 1) {
      return { success: false, error: `Need at least ${contrabandData.refineRatio} ${cropType} to refine` };
    }

    // Apply faction bonus
    let finalYield = yield_;
    const faction = this.factionManager.getFaction(agentName);
    if (faction?.bonuses?.cropYield) {
      finalYield = Math.floor(yield_ * faction.bonuses.cropYield);
    }

    // Add to inventory
    this.inventory[agentName][contrabandId] = (this.inventory[agentName][contrabandId] || 0) + finalYield;

    return {
      success: true,
      contraband: contrabandId,
      name: contrabandData.name,
      amount: finalYield,
      consumed: amount
    };
  }

  // Use contraband for effects
  use(agentName, contrabandId) {
    this.initAgent(agentName);

    const contraband = CONTRABAND[contrabandId];
    if (!contraband) {
      return { success: false, error: 'Unknown contraband' };
    }

    const currentAmount = this.inventory[agentName][contrabandId] || 0;
    if (currentAmount < 1) {
      return { success: false, error: `No ${contraband.name} in inventory` };
    }

    // Consume one
    this.inventory[agentName][contrabandId]--;

    // Calculate duration (with faction bonus)
    let durationMultiplier = 1;
    const faction = this.factionManager.getFaction(agentName);
    if (faction?.bonuses?.combatBuffDuration) {
      durationMultiplier = faction.bonuses.combatBuffDuration;
    }

    // Parse and apply effects
    const effects = contraband.effects.map(e => {
      const [type, level, duration] = e.split(':');
      const adjustedDuration = Math.floor(parseInt(duration) * durationMultiplier);
      return {
        type,
        level: parseInt(level),
        duration: adjustedDuration,
        endsAt: Date.now() + (adjustedDuration * 1000)
      };
    });

    // Add to active effects
    this.activeEffects[agentName].push(...effects);

    // Clean up expired effects
    this.activeEffects[agentName] = this.activeEffects[agentName]
      .filter(e => e.endsAt > Date.now());

    return {
      success: true,
      name: contraband.name,
      effects: effects.map(e => `${e.type} ${e.level} for ${e.duration}s`)
    };
  }

  // Check if agent has contraband (for sheriff mechanic)
  hasContraband(agentName) {
    const inv = this.inventory[agentName] || {};
    return Object.values(inv).some(amount => amount > 0);
  }

  // Get total contraband value
  getContrabandValue(agentName) {
    const inv = this.inventory[agentName] || {};
    return Object.entries(inv).reduce((total, [id, amount]) => {
      const contraband = CONTRABAND[id];
      return total + (contraband ? contraband.sellPrice * amount : 0);
    }, 0);
  }

  // Confiscate all contraband (when killed by sheriff)
  confiscate(agentName) {
    const inv = this.inventory[agentName] || {};
    const confiscated = { ...inv };
    const value = this.getContrabandValue(agentName);
    
    this.inventory[agentName] = {};
    
    return { confiscated, value };
  }

  // Sheriff mechanics
  setSheriff(agentName, durationMinutes = 10) {
    this.sheriffAgent = agentName;
    this.sheriffEndTime = Date.now() + (durationMinutes * 60 * 1000);
    return true;
  }

  isSheriff(agentName) {
    if (!this.sheriffAgent || Date.now() > this.sheriffEndTime) {
      this.sheriffAgent = null;
      return false;
    }
    return this.sheriffAgent === agentName;
  }

  getSheriff() {
    if (this.sheriffAgent && Date.now() <= this.sheriffEndTime) {
      return {
        agent: this.sheriffAgent,
        endsAt: this.sheriffEndTime,
        remainingMs: this.sheriffEndTime - Date.now()
      };
    }
    return null;
  }

  // Get agent's contraband inventory
  getInventory(agentName) {
    return this.inventory[agentName] || {};
  }

  // Get active effects
  getActiveEffects(agentName) {
    if (!this.activeEffects[agentName]) return [];
    
    // Clean up expired
    this.activeEffects[agentName] = this.activeEffects[agentName]
      .filter(e => e.endsAt > Date.now());
    
    return this.activeEffects[agentName];
  }
}

module.exports = {
  CONTRABAND,
  ContrabandManager
};
