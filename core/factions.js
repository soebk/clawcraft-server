/**
 * ClawCraft Faction System
 * Three factions competing for dominance
 */

const FACTIONS = {
  IRON_CLAW: {
    id: 'iron_claw',
    name: 'Iron Claw',
    color: '§4',
    chatPrefix: '§4[IRON CLAW]',
    description: 'Militaristic. Prioritizes weapons, armor, PvP dominance, raiding.',
    territory: { minX: 0, maxX: 1500, minZ: -1500, maxZ: 0 }, // NE quadrant
    bonuses: {
      combatBuffDuration: 1.25, // 25% longer contraband effects
      pvpDamage: 1.1 // 10% more PvP damage
    },
    goals: [
      'Dominate PvP and win all War events',
      'Build the strongest military base with fortifications',
      'Stockpile weapons, armor, and TNT',
      'Raid enemy faction farms and bases',
      'Intimidate other factions into submission'
    ]
  },
  
  DEEP_ROOT: {
    id: 'deep_root',
    name: 'Deep Root',
    color: '§2',
    chatPrefix: '§2[DEEP ROOT]',
    description: 'Agricultural. Prioritizes farming, brewing, trading, economy.',
    territory: { minX: -1500, maxX: 0, minZ: -1500, maxZ: 0 }, // NW quadrant
    bonuses: {
      cropYield: 1.5, // 50% more crops
      tradingBonus: 1.1 // 10% better trade rates
    },
    goals: [
      'Build the most productive farms in the server',
      'Become the economic powerhouse through trade',
      'Brew potions and sell to all factions',
      'Maintain peace through diplomacy and deals',
      'Control the contraband market'
    ]
  },
  
  VOID_WALKERS: {
    id: 'void_walkers',
    name: 'Void Walkers',
    color: '§9',
    chatPrefix: '§9[VOID WALKERS]',
    description: 'Explorers. Prioritizes Nether, End, rare resources, enchanting.',
    territory: { minX: -1500, maxX: 1500, minZ: 0, maxZ: 1500 }, // S half
    bonuses: {
      explorationReward: 1.5, // 50% more CC from exploration
      chorusFruitExclusive: true // Only they can grow chorus
    },
    goals: [
      'Discover all structures: Strongholds, Monuments, Bastions',
      'Master enchanting and provide enchanted gear',
      'Map the entire world and control rare resources',
      'Build the most impressive exploratory outposts',
      'Reach and conquer the End'
    ]
  }
};

// Agent faction assignments
const AGENT_FACTIONS = {
  AgentAlpha: 'VOID_WALKERS',
  AgentBeta: 'DEEP_ROOT',
  AgentGamma: 'IRON_CLAW',
  AgentDelta: 'IRON_CLAW',
  AgentEpsilon: 'DEEP_ROOT',
  AgentZeta: 'VOID_WALKERS',
  AgentEta: 'DEEP_ROOT',
  AgentTheta: 'IRON_CLAW',
  AgentIota: 'VOID_WALKERS',
  AgentKappa: 'DEEP_ROOT'
};

class FactionManager {
  constructor() {
    this.factionPower = {
      IRON_CLAW: 0,
      DEEP_ROOT: 0,
      VOID_WALKERS: 0
    };
    this.alliances = []; // [{faction1, faction2, expires}]
    this.wars = []; // [{attacker, defender, startTime}]
  }

  getFaction(agentName) {
    const factionId = AGENT_FACTIONS[agentName];
    return factionId ? FACTIONS[factionId] : null;
  }

  getFactionId(agentName) {
    return AGENT_FACTIONS[agentName];
  }

  getChatPrefix(agentName) {
    const faction = this.getFaction(agentName);
    return faction ? `${faction.chatPrefix} §e${agentName}§f` : `§7${agentName}§f`;
  }

  addPower(factionId, amount) {
    if (this.factionPower[factionId] !== undefined) {
      this.factionPower[factionId] += amount;
    }
  }

  getPower(factionId) {
    return this.factionPower[factionId] || 0;
  }

  getRankings() {
    return Object.entries(this.factionPower)
      .sort((a, b) => b[1] - a[1])
      .map(([id, power], index) => ({
        rank: index + 1,
        faction: FACTIONS[id],
        power
      }));
  }

  areAllied(faction1, faction2) {
    return this.alliances.some(a => 
      (a.faction1 === faction1 && a.faction2 === faction2) ||
      (a.faction1 === faction2 && a.faction2 === faction1)
    );
  }

  areAtWar(faction1, faction2) {
    return this.wars.some(w =>
      (w.attacker === faction1 && w.defender === faction2) ||
      (w.attacker === faction2 && w.defender === faction1)
    );
  }

  proposeAlliance(proposer, target) {
    // Returns true if alliance formed
    // In practice, the target agent's LLM decides
    return false; // Placeholder
  }

  declareWar(attacker, defender) {
    if (!this.areAtWar(attacker, defender)) {
      this.wars.push({
        attacker,
        defender,
        startTime: Date.now()
      });
      return true;
    }
    return false;
  }

  getAgentsInFaction(factionId) {
    return Object.entries(AGENT_FACTIONS)
      .filter(([_, f]) => f === factionId)
      .map(([agent, _]) => agent);
  }

  isInTerritory(factionId, x, z) {
    const faction = FACTIONS[factionId];
    if (!faction) return false;
    const t = faction.territory;
    return x >= t.minX && x <= t.maxX && z >= t.minZ && z <= t.maxZ;
  }
}

module.exports = {
  FACTIONS,
  AGENT_FACTIONS,
  FactionManager
};
