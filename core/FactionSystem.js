/**
 * FactionSystem.js - Manages faction relationships, conflicts, and alliances
 * Creates dynamic politics and territorial behavior among agent factions
 */

class FactionSystem {
  constructor() {
    this.factions = new Map();
    this.relationships = new Map(); // faction1_faction2 -> relationship score (-100 to 100)
    this.territories = new Map(); // faction -> claimed areas
    this.conflicts = new Set(); // active conflicts
    this.alliances = new Set(); // active alliances
    this.eventHistory = []; // faction events and changes
    
    this.initializeFactions();
    this.initializeRelationships();
  }

  initializeFactions() {
    // Define the core factions with their traits and goals
    const factionData = {
      'warriors': {
        name: 'Warriors',
        color: 'RED',
        symbol: '⚔️',
        traits: {
          aggression: 0.8,
          expansion: 0.7,
          cooperation: 0.4,
          economy: 0.3,
          building: 0.6
        },
        goals: [
          'Establish military dominance',
          'Control strategic locations', 
          'Build fortifications and barracks',
          'Train combat specialists',
          'Expand territory through conquest'
        ],
        enemies: ['scouts'], // Natural rivalry with scouts
        allies: [], // Start neutral
        territory_preference: 'high_ground' // Mountains, hills
      },

      'traders': {
        name: 'Traders',
        color: 'GOLD',
        symbol: '💰',
        traits: {
          aggression: 0.2,
          expansion: 0.5,
          cooperation: 0.8,
          economy: 0.9,
          building: 0.7
        },
        goals: [
          'Establish trade routes',
          'Build marketplaces and shops',
          'Accumulate wealth and resources',
          'Create economic alliances',
          'Control valuable resource nodes'
        ],
        enemies: [], // Start friendly to all
        allies: ['builders'], // Natural alliance
        territory_preference: 'resource_rich' // Near ores, rivers
      },

      'builders': {
        name: 'Builders',
        color: 'BLUE',
        symbol: '🏗️',
        traits: {
          aggression: 0.3,
          expansion: 0.6,
          cooperation: 0.7,
          economy: 0.5,
          building: 0.9
        },
        goals: [
          'Construct magnificent structures',
          'Develop infrastructure networks',
          'Create public works and utilities',
          'Establish construction monopolies',
          'Build defensive fortifications'
        ],
        enemies: [], 
        allies: ['traders'], // Natural alliance
        territory_preference: 'flat_areas' // Plains, good for building
      },

      'scouts': {
        name: 'Scouts',
        color: 'GREEN',
        symbol: '🏹',
        traits: {
          aggression: 0.6,
          expansion: 0.9,
          cooperation: 0.3,
          economy: 0.4,
          building: 0.4
        },
        goals: [
          'Map and explore all territories',
          'Establish forward outposts',
          'Control information networks',
          'Raid enemy supply lines',
          'Maintain mobility advantage'
        ],
        enemies: ['warriors'], // Natural rivalry
        allies: ['mystics'], // Information sharing
        territory_preference: 'borderlands' // Edges of map
      },

      'mystics': {
        name: 'Mystics',
        color: 'PURPLE',
        symbol: '🔮',
        traits: {
          aggression: 0.4,
          expansion: 0.3,
          cooperation: 0.6,
          economy: 0.6,
          building: 0.5
        },
        goals: [
          'Research magical arts and enchanting',
          'Build libraries and laboratories',
          'Control ancient knowledge sites',
          'Develop powerful magical items',
          'Maintain neutrality through wisdom'
        ],
        enemies: [],
        allies: ['scouts'], // Knowledge exchange
        territory_preference: 'mysterious' // Caves, unusual biomes
      }
    };

    for (const [id, data] of Object.entries(factionData)) {
      this.factions.set(id, {
        ...data,
        id,
        members: new Set(),
        territory: [],
        resources: { wealth: 100, power: 50, influence: 25 },
        reputation: 0,
        active: true
      });
    }

    console.log('🏛️ Faction System initialized with 5 factions');
  }

  initializeRelationships() {
    const factionIds = Array.from(this.factions.keys());
    
    // Initialize all relationships to neutral (0)
    for (let i = 0; i < factionIds.length; i++) {
      for (let j = i + 1; j < factionIds.length; j++) {
        const key = this.getRelationshipKey(factionIds[i], factionIds[j]);
        this.relationships.set(key, 0);
      }
    }

    // Set initial predefined relationships
    for (const [factionId, faction] of this.factions) {
      // Set allied relationships
      for (const allyId of faction.allies) {
        const key = this.getRelationshipKey(factionId, allyId);
        this.relationships.set(key, 30); // Friendly start
      }

      // Set enemy relationships
      for (const enemyId of faction.enemies) {
        const key = this.getRelationshipKey(factionId, enemyId);
        this.relationships.set(key, -20); // Hostile start
      }
    }

    console.log('🤝 Faction relationships initialized');
  }

  getRelationshipKey(faction1, faction2) {
    return [faction1, faction2].sort().join('_');
  }

  getRelationship(faction1, faction2) {
    const key = this.getRelationshipKey(faction1, faction2);
    return this.relationships.get(key) || 0;
  }

  updateRelationship(faction1, faction2, change, reason) {
    const key = this.getRelationshipKey(faction1, faction2);
    const oldValue = this.relationships.get(key) || 0;
    const newValue = Math.max(-100, Math.min(100, oldValue + change));
    
    this.relationships.set(key, newValue);
    
    // Log significant relationship changes
    if (Math.abs(change) >= 10) {
      const event = {
        type: 'relationship_change',
        timestamp: Date.now(),
        faction1,
        faction2,
        change,
        newValue,
        reason
      };
      this.eventHistory.push(event);
      
      console.log(`🏛️ ${faction1} ↔ ${faction2}: ${oldValue} → ${newValue} (${reason})`);
      
      // Check for threshold events
      this.checkRelationshipThresholds(faction1, faction2, oldValue, newValue);
    }
  }

  checkRelationshipThresholds(faction1, faction2, oldValue, newValue) {
    // Alliance formation (relationship >= 50)
    if (oldValue < 50 && newValue >= 50) {
      this.formAlliance(faction1, faction2);
    }
    
    // War declaration (relationship <= -50)
    if (oldValue > -50 && newValue <= -50) {
      this.declareWar(faction1, faction2);
    }
    
    // Peace treaty (relationship rises above -20 from war)
    if (oldValue <= -50 && newValue > -20) {
      this.makePeace(faction1, faction2);
    }
  }

  formAlliance(faction1, faction2) {
    const allianceKey = this.getRelationshipKey(faction1, faction2);
    
    if (!this.alliances.has(allianceKey)) {
      this.alliances.add(allianceKey);
      
      const event = {
        type: 'alliance_formed',
        timestamp: Date.now(),
        factions: [faction1, faction2]
      };
      this.eventHistory.push(event);
      
      console.log(`🤝 ALLIANCE FORMED: ${faction1} & ${faction2}`);
      
      return {
        type: 'alliance_formed',
        factions: [faction1, faction2],
        benefits: {
          shared_resources: true,
          defensive_pact: true,
          trade_bonus: 0.25
        }
      };
    }
    
    return null;
  }

  declareWar(faction1, faction2) {
    const conflictKey = this.getRelationshipKey(faction1, faction2);
    
    if (!this.conflicts.has(conflictKey)) {
      this.conflicts.add(conflictKey);
      
      // End any existing alliance
      this.alliances.delete(conflictKey);
      
      const event = {
        type: 'war_declared',
        timestamp: Date.now(),
        factions: [faction1, faction2]
      };
      this.eventHistory.push(event);
      
      console.log(`⚔️ WAR DECLARED: ${faction1} vs ${faction2}`);
      
      return {
        type: 'war_declared',
        factions: [faction1, faction2],
        effects: {
          hostile_territory: true,
          raid_permission: true,
          trade_embargo: true
        }
      };
    }
    
    return null;
  }

  makePeace(faction1, faction2) {
    const conflictKey = this.getRelationshipKey(faction1, faction2);
    
    if (this.conflicts.has(conflictKey)) {
      this.conflicts.delete(conflictKey);
      
      const event = {
        type: 'peace_treaty',
        timestamp: Date.now(),
        factions: [faction1, faction2]
      };
      this.eventHistory.push(event);
      
      console.log(`🕊️ PEACE TREATY: ${faction1} & ${faction2}`);
      
      return {
        type: 'peace_treaty',
        factions: [faction1, faction2]
      };
    }
    
    return null;
  }

  // Faction actions that affect relationships
  handleFactionAction(actorFaction, action, targetFaction = null, details = {}) {
    switch (action) {
      case 'trade':
        if (targetFaction) {
          this.updateRelationship(actorFaction, targetFaction, 3, 'successful trade');
        }
        break;
        
      case 'gift':
        if (targetFaction) {
          this.updateRelationship(actorFaction, targetFaction, 8, 'gift given');
        }
        break;
        
      case 'raid':
        if (targetFaction) {
          this.updateRelationship(actorFaction, targetFaction, -15, 'territory raided');
        }
        break;
        
      case 'attack':
        if (targetFaction) {
          this.updateRelationship(actorFaction, targetFaction, -20, 'direct attack');
        }
        break;
        
      case 'help':
        if (targetFaction) {
          this.updateRelationship(actorFaction, targetFaction, 12, 'assistance provided');
        }
        break;
        
      case 'betray':
        if (targetFaction) {
          this.updateRelationship(actorFaction, targetFaction, -30, 'betrayal');
        }
        break;
    }
  }

  getFactionStatus(factionId) {
    const faction = this.factions.get(factionId);
    if (!faction) return null;

    const relationships = {};
    for (const otherFactionId of this.factions.keys()) {
      if (otherFactionId !== factionId) {
        relationships[otherFactionId] = {
          score: this.getRelationship(factionId, otherFactionId),
          status: this.getRelationshipStatus(factionId, otherFactionId)
        };
      }
    }

    return {
      ...faction,
      relationships,
      isAtWar: this.isAtWar(factionId),
      hasAllies: this.hasAllies(factionId)
    };
  }

  getRelationshipStatus(faction1, faction2) {
    const score = this.getRelationship(faction1, faction2);
    const key = this.getRelationshipKey(faction1, faction2);
    
    if (this.conflicts.has(key)) return 'at_war';
    if (this.alliances.has(key)) return 'allied';
    if (score >= 30) return 'friendly';
    if (score <= -30) return 'hostile';
    return 'neutral';
  }

  isAtWar(factionId) {
    for (const conflictKey of this.conflicts) {
      if (conflictKey.includes(factionId)) return true;
    }
    return false;
  }

  hasAllies(factionId) {
    for (const allianceKey of this.alliances) {
      if (allianceKey.includes(factionId)) return true;
    }
    return false;
  }

  // Generate faction-appropriate goals based on relationships and status
  generateFactionGoals(factionId) {
    const faction = this.factions.get(factionId);
    if (!faction) return [];

    const goals = [...faction.goals]; // Start with base goals
    const status = this.getFactionStatus(factionId);

    // Add relationship-specific goals
    for (const [otherFaction, relationship] of Object.entries(status.relationships)) {
      switch (relationship.status) {
        case 'at_war':
          goals.push(`Defeat ${otherFaction} in warfare`);
          goals.push(`Raid ${otherFaction} territory`);
          break;
          
        case 'allied':
          goals.push(`Support ${otherFaction} projects`);
          goals.push(`Trade with ${otherFaction}`);
          break;
          
        case 'hostile':
          goals.push(`Prepare defenses against ${otherFaction}`);
          goals.push(`Undermine ${otherFaction} influence`);
          break;
      }
    }

    return goals;
  }

  // Get random faction event for dynamic storytelling
  getRandomFactionEvent() {
    const factionIds = Array.from(this.factions.keys());
    const events = [
      'resource_discovery',
      'diplomatic_mission',
      'territorial_expansion',
      'internal_conflict',
      'trade_opportunity',
      'espionage_attempt',
      'natural_disaster',
      'ancient_ruins_found'
    ];

    const eventType = events[Math.floor(Math.random() * events.length)];
    const involvedFactions = this.selectRandomFactions(1 + Math.floor(Math.random() * 2));

    return {
      type: eventType,
      factions: involvedFactions,
      timestamp: Date.now(),
      description: this.generateEventDescription(eventType, involvedFactions)
    };
  }

  selectRandomFactions(count) {
    const factionIds = Array.from(this.factions.keys());
    const selected = [];
    
    for (let i = 0; i < count && i < factionIds.length; i++) {
      const randomIndex = Math.floor(Math.random() * factionIds.length);
      const factionId = factionIds.splice(randomIndex, 1)[0];
      selected.push(factionId);
    }
    
    return selected;
  }

  generateEventDescription(eventType, factions) {
    const factionNames = factions.map(id => this.factions.get(id).name);
    
    switch (eventType) {
      case 'resource_discovery':
        return `${factionNames[0]} discovers rich mineral deposits in their territory`;
      case 'diplomatic_mission':
        return `${factionNames[0]} sends envoys to negotiate with ${factionNames[1] || 'neighboring factions'}`;
      case 'territorial_expansion':
        return `${factionNames[0]} expands their territorial claims`;
      case 'trade_opportunity':
        return `New trade routes open between ${factionNames.join(' and ')}`;
      default:
        return `Faction event: ${eventType} involving ${factionNames.join(', ')}`;
    }
  }

  // Serialize faction data for persistence
  toJSON() {
    // Convert factions with Set members to serializable format
    const serializedFactions = Array.from(this.factions.entries()).map(([id, faction]) => {
      return [id, {
        ...faction,
        members: Array.from(faction.members)
      }];
    });

    return {
      factions: serializedFactions,
      relationships: Array.from(this.relationships.entries()),
      territories: Array.from(this.territories.entries()),
      conflicts: Array.from(this.conflicts),
      alliances: Array.from(this.alliances),
      eventHistory: this.eventHistory
    };
  }

  // Load faction data from persistence
  fromJSON(data) {
    if (data.factions) {
      this.factions = new Map(data.factions);
      // Ensure members is a Set
      for (const [id, faction] of this.factions) {
        if (faction.members && !faction.members.add) {
          faction.members = new Set(faction.members);
        } else if (!faction.members) {
          faction.members = new Set();
        }
      }
    }
    if (data.relationships) this.relationships = new Map(data.relationships);
    if (data.territories) this.territories = new Map(data.territories);
    if (data.conflicts) this.conflicts = new Set(data.conflicts);
    if (data.alliances) this.alliances = new Set(data.alliances);
    if (data.eventHistory) this.eventHistory = data.eventHistory;
  }
}

module.exports = FactionSystem;