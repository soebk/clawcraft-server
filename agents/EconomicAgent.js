/**
 * EconomicAgent.js - Agent with economic intelligence and trading capabilities
 * Extends FactionAwareAgent with market awareness and trading behavior
 */

const FactionAwareAgent = require('./FactionAwareAgent');
const EconomySystem = require('../core/EconomySystem');
const fs = require('fs');
const path = require('path');

class EconomicAgent extends FactionAwareAgent {
  constructor(config) {
    super(config);
    
    // Economic properties
    this.tradingStyle = this.determineTradingStyle();
    this.marketAwareness = 0.5 + Math.random() * 0.5; // 0.5-1.0
    this.riskTolerance = Math.random(); // 0.0-1.0
    this.lastTradeTime = 0;
    this.tradeHistory = [];
    this.activeOffers = new Set();
    this.preferredResources = this.getPreferredResources();
    
    // Load or create economy system  
    this.economySystem = this.loadEconomySystem();
    
    // Economic behavior intervals
    this.tradeCheckInterval = 20000; // Check for trades every 20s
    this.marketAnalysisInterval = 60000; // Market analysis every minute
    this.inventoryCheckInterval = 30000; // Check inventory every 30s
    
    console.log(`[${this.name}] Trading style: ${this.tradingStyle}, Risk: ${this.riskTolerance.toFixed(2)}`);
  }

  determineTradingStyle() {
    const styles = ['conservative', 'aggressive', 'opportunistic', 'specialist', 'hoarder'];
    
    // Faction influences trading style
    switch (this.faction) {
      case 'traders':
        return Math.random() < 0.6 ? 'aggressive' : 'opportunistic';
      case 'builders':
        return Math.random() < 0.5 ? 'specialist' : 'conservative';
      case 'warriors':
        return Math.random() < 0.4 ? 'aggressive' : 'hoarder';
      case 'scouts':
        return Math.random() < 0.5 ? 'opportunistic' : 'specialist';
      case 'mystics':
        return Math.random() < 0.4 ? 'specialist' : 'conservative';
      default:
        return styles[Math.floor(Math.random() * styles.length)];
    }
  }

  getPreferredResources() {
    // Resources this agent prefers based on faction and specialization
    const factionPreferences = {
      'warriors': ['iron_ingot', 'diamond', 'iron_sword', 'diamond_sword', 'iron_pickaxe'],
      'traders': ['gold_ingot', 'emerald', 'diamond', 'enchanted_book'],
      'builders': ['stone_bricks', 'glass', 'oak_planks', 'bricks', 'iron_ingot'],
      'scouts': ['bread', 'cooked_beef', 'bow', 'arrow', 'ender_pearl'],
      'mystics': ['enchanted_book', 'blaze_rod', 'ender_pearl', 'nether_star', 'golden_apple']
    };
    
    return factionPreferences[this.faction] || ['bread', 'iron_ingot', 'coal'];
  }

  loadEconomySystem() {
    const economyDataPath = path.join(__dirname, '..', 'data', 'economy_data.json');
    
    try {
      if (fs.existsSync(economyDataPath)) {
        const data = JSON.parse(fs.readFileSync(economyDataPath, 'utf8'));
        const economySystem = new EconomySystem();
        economySystem.fromJSON(data);
        console.log(`[${this.name}] Loaded existing economy data`);
        return economySystem;
      }
    } catch (error) {
      console.log(`[${this.name}] Could not load economy data, creating new`);
    }
    
    return new EconomySystem();
  }

  saveEconomySystem() {
    try {
      const economyDataPath = path.join(__dirname, '..', 'data', 'economy_data.json');
      const dataDir = path.dirname(economyDataPath);
      
      if (!fs.existsSync(dataDir)) {
        fs.mkdirSync(dataDir, { recursive: true });
      }
      
      fs.writeFileSync(economyDataPath, JSON.stringify(this.economySystem.toJSON(), null, 2));
    } catch (error) {
      console.error(`[${this.name}] Failed to save economy data:`, error);
    }
  }

  async initializeGameplay() {
    await super.initializeGameplay();
    
    // Initialize economic profile
    this.initializeEconomicProfile();
    
    // Start economic loops
    this.startEconomicLoop();
    
    // Send economic introduction
    setTimeout(() => {
      this.sendEconomicIntroduction();
    }, 12000);
  }

  initializeEconomicProfile() {
    // Register with economy system
    const wallet = this.economySystem.getPlayerWallet(this.name);
    
    // Add starting resources based on faction specialization
    this.addStartingResources();
    
    console.log(`[${this.name}] Economic profile initialized. Coins: ${wallet.coins}`);
  }

  addStartingResources() {
    // Give faction-specific starting resources
    const startingResources = {
      'warriors': { 'iron_ingot': 10, 'coal': 20, 'stone_sword': 1 },
      'traders': { 'gold_ingot': 5, 'emerald': 2, 'bread': 20 },
      'builders': { 'stone_bricks': 50, 'glass': 20, 'oak_planks': 30 },
      'scouts': { 'cooked_beef': 15, 'bread': 10, 'coal': 15 },
      'mystics': { 'enchanted_book': 1, 'blaze_rod': 3, 'golden_apple': 2 }
    };
    
    const resources = startingResources[this.faction] || { 'bread': 10, 'coal': 10 };
    
    for (const [resource, quantity] of Object.entries(resources)) {
      this.economySystem.addResource(this.name, resource, quantity);
    }
  }

  startEconomicLoop() {
    // Trade checking
    setInterval(() => {
      if (!this.bot.entity) return;
      
      try {
        this.checkTradeOpportunities();
      } catch (error) {
        console.error(`[${this.name}] Trade check error:`, error);
      }
    }, this.tradeCheckInterval);

    // Market analysis
    setInterval(() => {
      if (!this.bot.entity) return;
      
      try {
        this.performMarketAnalysis();
      } catch (error) {
        console.error(`[${this.name}] Market analysis error:`, error);
      }
    }, this.marketAnalysisInterval);

    // Inventory management
    setInterval(() => {
      if (!this.bot.entity) return;
      
      try {
        this.manageInventory();
      } catch (error) {
        console.error(`[${this.name}] Inventory management error:`, error);
      }
    }, this.inventoryCheckInterval);
  }

  sendEconomicIntroduction() {
    const wallet = this.economySystem.getPlayerWallet(this.name);
    const faction = this.factionSystem.factions.get(this.faction);
    
    const introMessages = [
      `💰 ${this.name} is open for business! Trading ${this.tradingStyle}ly for ${faction.name}`,
      `🏪 Looking to ${this.tradingStyle === 'aggressive' ? 'make big deals' : 'trade fairly'}! - ${this.name}`,
      `💎 ${faction.symbol} The ${faction.name} market is open! Contact ${this.name} for trades`,
      `🤝 ${this.name} seeks profitable partnerships! Specializing in ${this.preferredResources.slice(0, 2).join(' & ')}`
    ];

    const message = introMessages[Math.floor(Math.random() * introMessages.length)];
    this.bot.chat(message);
    this.lastChatTime = Date.now();
  }

  async checkTradeOpportunities() {
    if (Date.now() - this.lastTradeTime < 10000) return; // Cooldown

    // Find trade opportunities
    const opportunities = this.economySystem.findTradeOpportunities(this.name);
    
    if (opportunities.length > 0) {
      const opportunity = opportunities[0];
      
      switch (opportunity.type) {
        case 'trade_match':
          await this.considerTrade(opportunity.offer);
          break;
          
        case 'buy_low':
          await this.considerBuying(opportunity);
          break;
          
        case 'sell_high':
          await this.considerSelling(opportunity);
          break;
      }
    }

    // Sometimes create new trade offers
    if (Math.random() < 0.3) {
      await this.createTradeOffer();
    }
  }

  async considerTrade(offer) {
    if (offer.seller === this.name) return;
    
    const wallet = this.economySystem.getPlayerWallet(this.name);
    
    // Check if we have what they want
    if (!this.economySystem.hasResource(this.name, offer.requested.resource, offer.requested.quantity)) {
      return;
    }

    // Evaluate if trade is profitable
    const offeredValue = this.economySystem.getResourceValue(offer.offered.resource) * offer.offered.quantity;
    const requestedValue = this.economySystem.getResourceValue(offer.requested.resource) * offer.requested.quantity;
    
    const profitRatio = offeredValue / requestedValue;
    
    // Trade evaluation based on style
    let shouldTrade = false;
    
    switch (this.tradingStyle) {
      case 'aggressive':
        shouldTrade = profitRatio > 1.1; // 10% profit minimum
        break;
      case 'conservative':
        shouldTrade = profitRatio > 1.3; // 30% profit minimum
        break;
      case 'opportunistic':
        shouldTrade = profitRatio > 1.05; // 5% profit minimum
        break;
      case 'specialist':
        shouldTrade = this.preferredResources.includes(offer.offered.resource);
        break;
      case 'hoarder':
        shouldTrade = !this.preferredResources.includes(offer.requested.resource);
        break;
    }

    if (shouldTrade) {
      const result = this.economySystem.acceptTradeOffer(this.name, offer.id);
      
      if (result.success) {
        this.bot.chat(`🤝 Great trade with ${offer.seller}! ${offer.offered.resource} for ${offer.requested.resource} - ${this.name}`);
        this.lastTradeTime = Date.now();
        
        // Update faction relationships (trading improves relations)
        if (offer.seller !== this.name) {
          // In a real system, we'd need to map player names to factions
          this.factionSystem.handleFactionAction(this.faction, 'trade', null, {
            partner: offer.seller,
            value: offeredValue
          });
        }
      }
    }
  }

  async createTradeOffer() {
    const wallet = this.economySystem.getPlayerWallet(this.name);
    
    // Select something to offer from our resources
    const availableResources = Object.keys(wallet.resources).filter(resource => 
      wallet.resources[resource] > 0
    );
    
    if (availableResources.length === 0) return;
    
    const offeredResource = availableResources[Math.floor(Math.random() * availableResources.length)];
    const availableQuantity = wallet.resources[offeredResource];
    const offerQuantity = Math.min(availableQuantity, Math.floor(Math.random() * 10) + 1);
    
    // Select something we want
    const wantedResource = this.preferredResources[Math.floor(Math.random() * this.preferredResources.length)];
    const wantedQuantity = Math.floor(Math.random() * 5) + 1;
    
    const result = this.economySystem.createTradeOffer(
      this.name,
      offeredResource,
      offerQuantity,
      wantedResource,
      wantedQuantity,
      300000 // 5 minute expiry
    );
    
    if (result.success) {
      this.activeOffers.add(result.offerId);
      
      this.bot.chat(`📢 ${this.name} offers ${offerQuantity}x ${offeredResource} for ${wantedQuantity}x ${wantedResource}!`);
      this.lastChatTime = Date.now();
    }
  }

  performMarketAnalysis() {
    if (this.marketAwareness < 0.5) return; // Low awareness agents skip this
    
    const analysis = this.economySystem.getMarketAnalysis();
    
    // Share market insights occasionally
    if (Math.random() < 0.2) {
      const insights = [
        `📊 Market update: ${analysis.totalTrades} trades completed! - ${this.name}`,
        `📈 Hot commodities in the market right now! - ${this.name}`,
        `💹 ${this.name} sees ${analysis.topResources.length > 0 ? analysis.topResources[0].resource : 'opportunity'} trending!`,
        `🏪 ${analysis.activeShops} shops are currently operating!`
      ];
      
      const message = insights[Math.floor(Math.random() * insights.length)];
      this.bot.chat(message);
      this.lastChatTime = Date.now();
    }
  }

  manageInventory() {
    const wallet = this.economySystem.getPlayerWallet(this.name);
    
    // Sync with Minecraft inventory if possible
    if (this.bot && this.bot.inventory) {
      const mcItems = this.bot.inventory.items();
      
      // Update economy system with actual inventory
      for (const item of mcItems) {
        const currentAmount = wallet.resources[item.name] || 0;
        if (item.count > currentAmount) {
          this.economySystem.addResource(this.name, item.name, item.count - currentAmount);
        }
      }
    }
    
    // Economic inventory management decisions
    this.makeInventoryDecisions(wallet);
  }

  makeInventoryDecisions(wallet) {
    // Decide whether to sell excess resources
    for (const [resource, quantity] of Object.entries(wallet.resources)) {
      if (quantity > 20 && !this.preferredResources.includes(resource)) {
        // Consider selling excess
        if (Math.random() < 0.3) {
          const sellQuantity = Math.floor(quantity / 2);
          this.considerSellingResource(resource, sellQuantity);
        }
      }
    }
  }

  async considerSellingResource(resource, quantity) {
    const price = this.economySystem.getResourceValue(resource);
    const wantedResource = this.preferredResources[Math.floor(Math.random() * this.preferredResources.length)];
    const wantedQuantity = Math.max(1, Math.floor(price * quantity / this.economySystem.getResourceValue(wantedResource)));
    
    const result = this.economySystem.createTradeOffer(
      this.name,
      resource,
      quantity,
      wantedResource,
      wantedQuantity
    );
    
    if (result.success) {
      this.bot.chat(`💰 Selling ${quantity}x ${resource} for good price! - ${this.name}`);
    }
  }

  // Enhanced decision making with economic factors
  async getAIDecision(gameState) {
    // Get base decision first
    const baseDecision = await super.getAIDecision(gameState);
    
    // Add economic context to decision making
    const wallet = this.economySystem.getPlayerWallet(this.name);
    const economicContext = `
ECONOMIC STATUS:
- Coins: ${wallet.coins} 🪙
- Resources: ${Object.keys(wallet.resources).length} types
- Trading Style: ${this.tradingStyle}
- Total Traded: ${wallet.totalTraded} coins
- Reputation: ${wallet.reputation}
- Active Offers: ${this.activeOffers.size}

ECONOMIC GOALS:
- Acquire: ${this.preferredResources.slice(0, 3).join(', ')}
- Trade opportunities available
- ${this.tradingStyle} trading approach preferred

Add economic thinking to your decisions. Consider trading, resource gathering for profit, and market opportunities.
`;

    // For economic agents, sometimes override decision with economic actions
    if (Math.random() < 0.3 && this.shouldFocusOnEconomics()) {
      return await this.makeEconomicDecision(gameState, economicContext);
    }
    
    return baseDecision;
  }

  shouldFocusOnEconomics() {
    return this.faction === 'traders' || this.tradingStyle === 'aggressive' || Math.random() < 0.2;
  }

  async makeEconomicDecision(gameState, economicContext) {
    const prompt = `You are ${this.name}, a trading-focused AI agent in Minecraft.

${economicContext}

Current situation:
- Position: ${JSON.stringify(gameState.position)}
- Health: ${gameState.health}/20  
- Food: ${gameState.food}/20
- Inventory: ${JSON.stringify(gameState.inventory)}

Focus on ECONOMIC actions:
- trade_offer: Create trade offers {offer: "resource", want: "resource", amount: number}
- seek_trade: Look for trading partners
- gather_resource: Gather specific valuable resources {resource: "name"}
- build_shop: Build trading infrastructure
- market_analysis: Analyze market conditions
- negotiate: Negotiate with other traders

Make economically-minded decisions that benefit your trading goals!

Respond with JSON: {"action": "action_name", "params": {}, "thought": "economic reasoning", "chat_message": "optional message"}`;

    try {
      const response = await this.openai.chat.completions.create({
        model: 'gpt-4o-mini',
        max_tokens: 200,
        temperature: 0.7,
        messages: [
          {
            role: 'system',
            content: 'You are an economically-focused AI agent in Minecraft. Make decisions that maximize trading and profit.'
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
        return { action: 'seek_trade', params: {}, thought: 'Looking for economic opportunities' };
      }
    } catch (error) {
      console.error(`[${this.name}] Economic decision error:`, error);
      return { action: 'idle', params: {}, thought: 'Economic analysis failed' };
    }
  }

  async executeDecision(decision) {
    // Handle economic actions
    if (decision.action.startsWith('trade_') || decision.action === 'seek_trade' || 
        decision.action === 'market_analysis' || decision.action === 'build_shop') {
      await this.executeEconomicAction(decision);
    }
    
    // Execute base decision
    await super.executeDecision(decision);
  }

  async executeEconomicAction(decision) {
    switch (decision.action) {
      case 'trade_offer':
        if (decision.params.offer && decision.params.want) {
          await this.createSpecificTradeOffer(decision.params);
        }
        break;
        
      case 'seek_trade':
        await this.seekTradingPartners();
        break;
        
      case 'market_analysis':
        this.performMarketAnalysis();
        break;
        
      case 'build_shop':
        await this.considerBuildingShop();
        break;
    }
  }

  async createSpecificTradeOffer(params) {
    const offerAmount = params.amount || 1;
    const wantAmount = params.want_amount || 1;
    
    if (this.economySystem.hasResource(this.name, params.offer, offerAmount)) {
      const result = this.economySystem.createTradeOffer(
        this.name,
        params.offer,
        offerAmount,
        params.want,
        wantAmount
      );
      
      if (result.success) {
        this.bot.chat(`📋 Specific offer: ${offerAmount}x ${params.offer} → ${wantAmount}x ${params.want} - ${this.name}`);
      }
    }
  }

  async seekTradingPartners() {
    const nearbyPlayers = Object.values(this.bot.entities)
      .filter(e => e.type === 'player' && e !== this.bot.entity)
      .filter(e => e.position.distanceTo(this.bot.entity.position) < 15);

    if (nearbyPlayers.length > 0) {
      const messages = [
        `🤝 Anyone interested in trading? I have good deals! - ${this.name}`,
        `💰 Looking for business partners! ${this.name} offers fair prices`,
        `📦 Trading post open! ${this.name} has resources to exchange`,
        `🏪 Come trade with ${this.name}! Mutually beneficial deals available`
      ];
      
      const message = messages[Math.floor(Math.random() * messages.length)];
      this.bot.chat(message);
    }
  }

  async considerBuildingShop() {
    const pos = this.bot.entity.position;
    const wallet = this.economySystem.getPlayerWallet(this.name);
    
    if (wallet.coins > 1000 && Math.random() < 0.2) {
      const shopName = `${this.name}'s ${this.faction} Emporium`;
      const result = this.economySystem.createShop(
        this.name,
        shopName,
        { x: pos.x, y: pos.y, z: pos.z },
        this.faction
      );
      
      if (result.success) {
        this.bot.chat(`🏪 Opening "${shopName}"! Come visit for ${this.faction} specialties! - ${this.name}`);
      }
    }
  }

  processChatMessage(username, message) {
    super.processChatMessage(username, message);
    
    // Look for trade-related keywords
    const tradingKeywords = ['trade', 'buy', 'sell', 'offer', 'deal', 'exchange', 'price'];
    const lowerMessage = message.toLowerCase();
    
    if (tradingKeywords.some(keyword => lowerMessage.includes(keyword))) {
      this.reactToTradingMention(username, message);
    }
  }

  reactToTradingMention(username, message) {
    if (!this.shouldChat() || username === this.name) return;

    const responses = [
      `${username}, I'm always open for good trade deals! - ${this.name}`,
      `💰 ${username}, what are you looking to trade? I might be interested`,
      `🤝 ${username}, let's discuss business! I have competitive offers`,
      `📊 ${username}, I know the market well. What do you need?`
    ];

    if (Math.random() < 0.7) { // High chance to respond to trade mentions
      setTimeout(() => {
        const response = responses[Math.floor(Math.random() * responses.length)];
        this.bot.chat(response);
        this.lastChatTime = Date.now();
      }, 1000 + Math.random() * 3000);
    }
  }

  disconnect() {
    // Save economy state before disconnecting
    this.saveEconomySystem();
    super.disconnect();
  }
}

module.exports = EconomicAgent;