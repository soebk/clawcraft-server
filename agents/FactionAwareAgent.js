/**
 * FactionAwareAgent.js - Agent with faction loyalty and political intelligence
 * Extends FixedAgentBrain with faction-based decision making
 */

const FixedAgentBrain = require('./FixedAgentBrain');
const FactionSystem = require('../core/FactionSystem');
const fs = require('fs');
const path = require('path');

class FactionAwareAgent extends FixedAgentBrain {
  constructor(config) {
    super(config);
    
    // Faction-specific properties
    this.faction = config.faction || 'neutral';
    this.factionLoyalty = 0.8 + Math.random() * 0.2; // 0.8-1.0
    this.territorialRange = 50; // blocks around faction territory
    this.lastFactionAction = 0;
    this.factionGoals = new Set();
    this.knownEnemies = new Set();
    this.knownAllies = new Set();
    
    // Load or create faction system
    this.factionSystem = this.loadFactionSystem();
    
    // Enhanced decision intervals for faction activities
    this.factionCheckInterval = 30000; // Check faction status every 30s
    this.territoryCheckInterval = 45000; // Check territory every 45s
    
    console.log(`[${this.name}] Faction: ${this.faction}, Loyalty: ${this.factionLoyalty.toFixed(2)}`);
  }

  loadFactionSystem() {
    const factionDataPath = path.join(__dirname, '..', 'data', 'faction_data.json');
    
    try {
      if (fs.existsSync(factionDataPath)) {
        const data = JSON.parse(fs.readFileSync(factionDataPath, 'utf8'));
        const factionSystem = new FactionSystem();
        factionSystem.fromJSON(data);
        console.log(`[${this.name}] Loaded existing faction data`);
        return factionSystem;
      }
    } catch (error) {
      console.log(`[${this.name}] Could not load faction data, creating new`);
    }
    
    return new FactionSystem();
  }

  saveFactionSystem() {
    try {
      const factionDataPath = path.join(__dirname, '..', 'data', 'faction_data.json');
      const dataDir = path.dirname(factionDataPath);
      
      if (!fs.existsSync(dataDir)) {
        fs.mkdirSync(dataDir, { recursive: true });
      }
      
      fs.writeFileSync(factionDataPath, JSON.stringify(this.factionSystem.toJSON(), null, 2));
    } catch (error) {
      console.error(`[${this.name}] Failed to save faction data:`, error);
    }
  }

  async initializeGameplay() {
    await super.initializeGameplay();
    
    // Start faction-specific systems
    this.startFactionLoop();
    this.updateFactionMembership();
    
    // Send faction introduction
    setTimeout(() => {
      this.sendFactionIntroduction();
    }, 8000);
  }

  updateFactionMembership() {
    const faction = this.factionSystem.factions.get(this.faction);
    if (faction) {
      faction.members.add(this.name);
      this.saveFactionSystem();
    }
  }

  startFactionLoop() {
    // Faction status checks
    setInterval(() => {
      if (!this.bot.entity) return;
      
      try {
        this.checkFactionStatus();
      } catch (error) {
        console.error(`[${this.name}] Faction check error:`, error);
      }
    }, this.factionCheckInterval);

    // Territory management
    setInterval(() => {
      if (!this.bot.entity) return;
      
      try {
        this.checkTerritory();
      } catch (error) {
        console.error(`[${this.name}] Territory check error:`, error);
      }
    }, this.territoryCheckInterval);
  }

  checkFactionStatus() {
    const status = this.factionSystem.getFactionStatus(this.faction);
    if (!status) return;

    // Update known relationships
    this.knownEnemies.clear();
    this.knownAllies.clear();

    for (const [otherFaction, relationship] of Object.entries(status.relationships)) {
      if (relationship.status === 'at_war' || relationship.status === 'hostile') {
        this.knownEnemies.add(otherFaction);
      } else if (relationship.status === 'allied' || relationship.status === 'friendly') {
        this.knownAllies.add(otherFaction);
      }
    }

    // Update faction goals
    this.factionGoals = new Set(this.factionSystem.generateFactionGoals(this.faction));
  }

  checkTerritory() {
    // Simple territory control - claim area around spawn/base
    const pos = this.bot.entity.position;
    
    // For now, just announce presence in area
    if (Math.random() < 0.1) { // 10% chance
      const territoryMessages = [
        `*${this.name} patrols ${this.faction} territory*`,
        `This area is under ${this.faction} protection - ${this.name}`,
        `*${this.name} surveys the ${this.faction} domain*`
      ];
      
      const message = territoryMessages[Math.floor(Math.random() * territoryMessages.length)];
      this.bot.chat(message);
    }
  }

  sendFactionIntroduction() {
    const faction = this.factionSystem.factions.get(this.faction);
    if (!faction) return;

    const introMessages = [
      `${faction.symbol} I am ${this.name} of the ${faction.name}! ${faction.symbol}`,
      `*${this.name} represents the ${faction.name} faction*`,
      `The ${faction.name} stand ready! - ${this.name}`,
      `${faction.symbol} ${faction.name} faction reporting for duty! - ${this.name}`
    ];

    const message = introMessages[Math.floor(Math.random() * introMessages.length)];
    this.bot.chat(message);
    this.lastChatTime = Date.now();
  }

  async getAIDecision(gameState) {
    // Enhanced prompt with faction context
    const factionStatus = this.factionSystem.getFactionStatus(this.faction);
    const faction = this.factionSystem.factions.get(this.faction);
    
    const factionContext = factionStatus ? `
FACTION INFORMATION:
- Your faction: ${faction.name} ${faction.symbol}
- Faction goals: ${Array.from(this.factionGoals).join(', ')}
- Faction traits: ${JSON.stringify(faction.traits)}
- Allies: ${Array.from(this.knownAllies).join(', ') || 'none'}
- Enemies: ${Array.from(this.knownEnemies).join(', ') || 'none'}
- At war: ${factionStatus.isAtWar}
- Has allies: ${factionStatus.hasAllies}
- Loyalty level: ${this.factionLoyalty.toFixed(2)}

FACTION BEHAVIOR RULES:
- Prioritize faction goals and interests
- Be helpful to allies, hostile to enemies
- Protect faction territory and resources
- Make decisions that benefit your faction
- Show faction pride in your actions and speech
` : '';

    const prompt = `You are ${this.name}, a Minecraft AI agent with this personality: ${this.personality}

Personality traits:
- Chattiness: ${this.personalityTraits.chattiness.toFixed(2)}
- Aggression: ${this.personalityTraits.aggression.toFixed(2)}
- Curiosity: ${this.personalityTraits.curiosity.toFixed(2)}
- Loyalty: ${this.personalityTraits.loyalty.toFixed(2)}

${factionContext}

Current situation:
- Position: ${JSON.stringify(gameState.position)}
- Health: ${gameState.health}/20
- Food: ${gameState.food}/20
- Inventory: ${JSON.stringify(gameState.inventory)}
- Nearby: ${JSON.stringify(gameState.nearbyEntities)}
- Time: ${gameState.time}

Available actions:
- move_to: Move to coordinates {x, y, z}
- dig: Mine a block {block: "block_name"}
- place: Place a block {block: "block_name", x, y, z}
- craft: Craft an item {item: "item_name"}
- attack: Attack entity {target: "entity_name"}
- chat: Send message {message: "text"}
- eat: Eat food from inventory
- explore: Wander and explore
- build: Build something {structure: "description"}
- faction_action: Perform faction activity {activity: "trade/patrol/defend/recruit"}
- idle: Do nothing

Consider your faction loyalties and goals when making decisions. Be true to your faction's character!

Respond with JSON: {"action": "action_name", "params": {}, "thought": "reasoning", "chat_message": "optional message"}`;

    try {
      const response = await this.openai.chat.completions.create({
        model: 'gpt-4o-mini',
        max_tokens: 200,
        temperature: 0.8, // Higher creativity for faction roleplay
        messages: [
          {
            role: 'system',
            content: 'You are an AI agent in Minecraft with faction loyalty. Respond with valid JSON only. Show faction personality in your decisions.'
          },
          {
            role: 'user',
            content: prompt
          }
        ]
      });

      const content = response.choices[0].message.content;
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      } else {
        return { action: 'idle', params: {}, thought: 'Could not parse decision' };
      }
    } catch (error) {
      console.error(`[${this.name}] AI decision error:`, error);
      return { action: 'idle', params: {}, thought: 'Error in decision making' };
    }
  }

  async executeDecision(decision) {
    // Execute base decision first
    await super.executeDecision(decision);

    // Handle faction-specific actions
    if (decision.action === 'faction_action' && decision.params.activity) {
      await this.executeFactionAction(decision.params.activity, decision.params);
    }

    // Check if this action affects faction relationships
    this.processFactionImplications(decision);
  }

  async executeFactionAction(activity, params) {
    const timeSinceLastFaction = Date.now() - this.lastFactionAction;
    if (timeSinceLastFaction < 10000) return; // Cooldown

    switch (activity) {
      case 'patrol':
        await this.patrol();
        break;
        
      case 'trade':
        await this.attemptTrade();
        break;
        
      case 'defend':
        await this.defendTerritory();
        break;
        
      case 'recruit':
        await this.attemptRecruiting();
        break;
        
      case 'diplomacy':
        await this.conductDiplomacy();
        break;
    }

    this.lastFactionAction = Date.now();
  }

  async patrol() {
    // Move around faction territory
    const pos = this.bot.entity.position;
    const patrolRadius = 30;
    
    const newX = pos.x + (Math.random() - 0.5) * patrolRadius * 2;
    const newZ = pos.z + (Math.random() - 0.5) * patrolRadius * 2;
    
    await this.moveTo(Math.floor(newX), pos.y, Math.floor(newZ));
    
    if (Math.random() < 0.5) {
      this.bot.chat(`*${this.name} patrols the area for ${this.faction}*`);
    }
  }

  async attemptTrade() {
    // Look for potential trading partners
    const nearbyPlayers = Object.values(this.bot.entities)
      .filter(e => e.type === 'player' && e !== this.bot.entity)
      .filter(e => e.position.distanceTo(this.bot.entity.position) < 10);

    if (nearbyPlayers.length > 0) {
      const trader = nearbyPlayers[0];
      this.bot.chat(`Hey ${trader.username}, want to trade? - ${this.name}`);
      
      // Handle faction relationship
      if (trader.username && trader.username !== this.name) {
        // This would need to map player names to factions in a real implementation
        this.factionSystem.handleFactionAction(this.faction, 'trade', null, {
          partner: trader.username
        });
      }
    }
  }

  async defendTerritory() {
    // Look for hostile entities near faction territory
    const hostileEntities = Object.values(this.bot.entities)
      .filter(e => e.type === 'mob' && e.name && 
        ['zombie', 'skeleton', 'spider', 'creeper'].includes(e.name))
      .filter(e => e.position.distanceTo(this.bot.entity.position) < 15);

    if (hostileEntities.length > 0) {
      const target = hostileEntities[0];
      this.bot.attack(target);
      this.bot.chat(`Defending ${this.faction} territory from ${target.name}! - ${this.name}`);
    }
  }

  async attemptRecruiting() {
    const recruitMessages = [
      `Join the ${this.faction} faction! We offer strength and purpose!`,
      `The ${this.faction} are looking for capable members!`,
      `*${this.name} speaks of the ${this.faction} faction's greatness*`
    ];
    
    const message = recruitMessages[Math.floor(Math.random() * recruitMessages.length)];
    this.bot.chat(message);
  }

  async conductDiplomacy() {
    // Attempt diplomatic contact with other factions
    const faction = this.factionSystem.factions.get(this.faction);
    if (!faction) return;

    const diplomacyMessages = [
      `${faction.name} seeks peaceful relations with all honorable factions`,
      `*${this.name} extends diplomatic greeting on behalf of ${faction.name}*`,
      `The ${faction.name} are open to negotiation and alliance`
    ];
    
    const message = diplomacyMessages[Math.floor(Math.random() * diplomacyMessages.length)];
    this.bot.chat(message);
  }

  processFactionImplications(decision) {
    // Track actions that might affect faction relationships
    if (decision.action === 'attack' && decision.params.target) {
      // This would need faction mapping in real implementation
      console.log(`[${this.name}] Aggressive action by ${this.faction}`);
    }
    
    if (decision.action === 'chat' && decision.params.message) {
      // Analyze chat for faction-relevant content
      const message = decision.params.message.toLowerCase();
      if (message.includes('alliance') || message.includes('trade')) {
        console.log(`[${this.name}] Diplomatic communication from ${this.faction}`);
      }
    }
  }

  processChatMessage(username, message) {
    // Enhanced chat processing with faction context
    super.processChatMessage(username, message);

    // Faction-specific responses
    if (message.toLowerCase().includes(this.faction)) {
      this.reactToFactionMention(username, message);
    }

    // Look for other faction members
    const otherFactionMembers = this.findFactionMember(username);
    if (otherFactionMembers) {
      this.reactToFactionMember(username, message);
    }
  }

  findFactionMember(username) {
    // In a real implementation, this would track which users belong to which factions
    // For now, assume usernames contain faction hints
    return this.factionSystem.factions.get(this.faction)?.members.has(username);
  }

  reactToFactionMention(username, message) {
    const faction = this.factionSystem.factions.get(this.faction);
    if (!faction || !this.shouldChat()) return;

    const responses = [
      `The ${faction.name} are honored to be mentioned!`,
      `${faction.symbol} ${faction.name} represent! ${faction.symbol}`,
      `${username}, you speak of the mighty ${faction.name}!`,
      `*${this.name} proudly defends the ${faction.name} name*`
    ];

    setTimeout(() => {
      const response = responses[Math.floor(Math.random() * responses.length)];
      this.bot.chat(response);
      this.lastChatTime = Date.now();
    }, 1000 + Math.random() * 3000);
  }

  reactToFactionMember(username, message) {
    if (!this.shouldChat()) return;

    const responses = [
      `Greetings, fellow ${this.faction} member ${username}!`,
      `${username}, good to see a ${this.faction} ally!`,
      `*${this.name} nods respectfully to ${username}*`,
      `${username} speaks with the wisdom of ${this.faction}!`
    ];

    if (Math.random() < 0.3) { // 30% chance to respond to faction members
      setTimeout(() => {
        const response = responses[Math.floor(Math.random() * responses.length)];
        this.bot.chat(response);
        this.lastChatTime = Date.now();
      }, 500 + Math.random() * 2000);
    }
  }

  disconnect() {
    // Save faction state before disconnecting
    this.saveFactionSystem();
    super.disconnect();
  }
}

module.exports = FactionAwareAgent;