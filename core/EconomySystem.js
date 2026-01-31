/**
 * EconomySystem.js - Dynamic economy with supply/demand, trading, and markets
 * Creates realistic economic interactions between faction agents
 */

class EconomySystem {
  constructor() {
    this.resources = new Map(); // resource_name -> market data
    this.playerWallets = new Map(); // player_name -> { coins, resources: {} }
    this.tradeOffers = new Map(); // offer_id -> trade offer data
    this.marketHistory = []; // historical price data
    this.shops = new Map(); // shop_id -> shop data
    this.tradingPosts = []; // physical trading locations
    this.contracts = new Map(); // contract_id -> contract data
    
    this.initializeResources();
    this.initializeCurrency();
    
    console.log('💰 Economy System initialized');
  }

  initializeResources() {
    // Define all tradeable resources with base values and market data
    const resourceData = {
      // Basic Materials
      'oak_log': { basePrice: 2, volatility: 0.1, category: 'materials', rarity: 'common' },
      'cobblestone': { basePrice: 1, volatility: 0.05, category: 'materials', rarity: 'common' },
      'stone': { basePrice: 1, volatility: 0.05, category: 'materials', rarity: 'common' },
      'dirt': { basePrice: 0.5, volatility: 0.02, category: 'materials', rarity: 'common' },
      
      // Ores & Minerals
      'coal': { basePrice: 3, volatility: 0.15, category: 'minerals', rarity: 'common' },
      'iron_ore': { basePrice: 8, volatility: 0.2, category: 'minerals', rarity: 'uncommon' },
      'iron_ingot': { basePrice: 12, volatility: 0.25, category: 'minerals', rarity: 'uncommon' },
      'gold_ore': { basePrice: 25, volatility: 0.3, category: 'minerals', rarity: 'rare' },
      'gold_ingot': { basePrice: 35, volatility: 0.35, category: 'minerals', rarity: 'rare' },
      'diamond': { basePrice: 100, volatility: 0.4, category: 'minerals', rarity: 'rare' },
      'emerald': { basePrice: 150, volatility: 0.45, category: 'minerals', rarity: 'rare' },
      
      // Food
      'bread': { basePrice: 4, volatility: 0.1, category: 'food', rarity: 'common' },
      'cooked_beef': { basePrice: 6, volatility: 0.12, category: 'food', rarity: 'common' },
      'wheat': { basePrice: 2, volatility: 0.08, category: 'food', rarity: 'common' },
      'apple': { basePrice: 3, volatility: 0.1, category: 'food', rarity: 'common' },
      'golden_apple': { basePrice: 200, volatility: 0.5, category: 'food', rarity: 'legendary' },
      
      // Tools & Equipment
      'stone_sword': { basePrice: 15, volatility: 0.2, category: 'weapons', rarity: 'common' },
      'iron_sword': { basePrice: 40, volatility: 0.25, category: 'weapons', rarity: 'uncommon' },
      'diamond_sword': { basePrice: 300, volatility: 0.4, category: 'weapons', rarity: 'rare' },
      'stone_pickaxe': { basePrice: 18, volatility: 0.2, category: 'tools', rarity: 'common' },
      'iron_pickaxe': { basePrice: 45, volatility: 0.25, category: 'tools', rarity: 'uncommon' },
      'diamond_pickaxe': { basePrice: 350, volatility: 0.4, category: 'tools', rarity: 'rare' },
      
      // Special Items
      'enchanted_book': { basePrice: 500, volatility: 0.6, category: 'magic', rarity: 'legendary' },
      'ender_pearl': { basePrice: 80, volatility: 0.45, category: 'magic', rarity: 'rare' },
      'blaze_rod': { basePrice: 60, volatility: 0.4, category: 'magic', rarity: 'rare' },
      'nether_star': { basePrice: 2000, volatility: 0.8, category: 'magic', rarity: 'legendary' },
      
      // Construction
      'glass': { basePrice: 3, volatility: 0.12, category: 'building', rarity: 'common' },
      'bricks': { basePrice: 5, volatility: 0.1, category: 'building', rarity: 'common' },
      'stone_bricks': { basePrice: 4, volatility: 0.1, category: 'building', rarity: 'common' },
      'oak_planks': { basePrice: 2, volatility: 0.08, category: 'building', rarity: 'common' }
    };

    for (const [resource, data] of Object.entries(resourceData)) {
      this.resources.set(resource, {
        ...data,
        currentPrice: data.basePrice,
        supply: 100, // starting supply
        demand: 100, // starting demand
        lastTrade: Date.now(),
        priceHistory: [data.basePrice],
        totalTraded: 0
      });
    }
  }

  initializeCurrency() {
    // Base currency system
    this.currency = {
      name: 'ClawCoins',
      symbol: '🪙',
      startingAmount: 500, // Starting money for new players
      inflationRate: 0.001, // Small daily inflation
      taxRate: 0.05 // Transaction tax
    };
  }

  // Player wallet management
  getPlayerWallet(playerName) {
    if (!this.playerWallets.has(playerName)) {
      this.playerWallets.set(playerName, {
        coins: this.currency.startingAmount,
        resources: {},
        totalTraded: 0,
        reputation: 0,
        joinedAt: Date.now()
      });
    }
    return this.playerWallets.get(playerName);
  }

  addResource(playerName, resourceName, quantity) {
    const wallet = this.getPlayerWallet(playerName);
    if (!wallet.resources[resourceName]) {
      wallet.resources[resourceName] = 0;
    }
    wallet.resources[resourceName] += quantity;
    
    return wallet.resources[resourceName];
  }

  removeResource(playerName, resourceName, quantity) {
    const wallet = this.getPlayerWallet(playerName);
    if (!wallet.resources[resourceName] || wallet.resources[resourceName] < quantity) {
      return false; // Insufficient resources
    }
    
    wallet.resources[resourceName] -= quantity;
    if (wallet.resources[resourceName] === 0) {
      delete wallet.resources[resourceName];
    }
    
    return true;
  }

  hasResource(playerName, resourceName, quantity) {
    const wallet = this.getPlayerWallet(playerName);
    return wallet.resources[resourceName] && wallet.resources[resourceName] >= quantity;
  }

  // Price calculation with supply/demand dynamics
  calculatePrice(resourceName) {
    const resource = this.resources.get(resourceName);
    if (!resource) return 0;

    // Base supply/demand ratio
    const supplyDemandRatio = resource.demand / Math.max(resource.supply, 1);
    
    // Apply volatility and market forces
    const volatilityFactor = 1 + (Math.random() - 0.5) * resource.volatility;
    const marketPrice = resource.basePrice * supplyDemandRatio * volatilityFactor;
    
    // Prevent extreme prices
    const minPrice = resource.basePrice * 0.1;
    const maxPrice = resource.basePrice * 10;
    
    const finalPrice = Math.max(minPrice, Math.min(maxPrice, marketPrice));
    
    // Update current price
    resource.currentPrice = Math.round(finalPrice * 100) / 100;
    resource.priceHistory.push(resource.currentPrice);
    
    // Keep price history manageable
    if (resource.priceHistory.length > 100) {
      resource.priceHistory = resource.priceHistory.slice(-50);
    }
    
    return resource.currentPrice;
  }

  // Create trade offer
  createTradeOffer(sellerName, offeredResource, offeredQuantity, requestedResource, requestedQuantity, expiresIn = 3600000) {
    // Check if seller has the offered resource
    if (!this.hasResource(sellerName, offeredResource, offeredQuantity)) {
      return { success: false, reason: 'Insufficient resources to trade' };
    }

    const offerId = this.generateTradeId();
    const offer = {
      id: offerId,
      seller: sellerName,
      offered: { resource: offeredResource, quantity: offeredQuantity },
      requested: { resource: requestedResource, quantity: requestedQuantity },
      createdAt: Date.now(),
      expiresAt: Date.now() + expiresIn,
      status: 'open',
      location: null // Could be set to physical coordinates
    };

    this.tradeOffers.set(offerId, offer);
    
    // Reserve the offered resources
    this.removeResource(sellerName, offeredResource, offeredQuantity);
    
    console.log(`💱 Trade offer created: ${sellerName} offers ${offeredQuantity}x ${offeredResource} for ${requestedQuantity}x ${requestedResource}`);
    
    return { success: true, offerId, offer };
  }

  // Accept trade offer
  acceptTradeOffer(buyerName, offerId) {
    const offer = this.tradeOffers.get(offerId);
    if (!offer) {
      return { success: false, reason: 'Trade offer not found' };
    }

    if (offer.status !== 'open') {
      return { success: false, reason: 'Trade offer no longer available' };
    }

    if (offer.expiresAt < Date.now()) {
      this.cancelTradeOffer(offerId);
      return { success: false, reason: 'Trade offer expired' };
    }

    // Check if buyer has what seller wants
    if (!this.hasResource(buyerName, offer.requested.resource, offer.requested.quantity)) {
      return { success: false, reason: 'Insufficient resources for trade' };
    }

    // Execute the trade
    const success = this.executeTrade(offer.seller, buyerName, offer);
    
    if (success) {
      offer.status = 'completed';
      offer.completedAt = Date.now();
      offer.buyer = buyerName;
      
      console.log(`🤝 Trade completed: ${offer.seller} ↔ ${buyerName} (${offer.offered.resource} for ${offer.requested.resource})`);
      
      return { success: true, trade: offer };
    }

    return { success: false, reason: 'Trade execution failed' };
  }

  executeTrade(seller, buyer, offer) {
    try {
      // Remove requested resource from buyer
      if (!this.removeResource(buyer, offer.requested.resource, offer.requested.quantity)) {
        return false;
      }

      // Give offered resource to buyer
      this.addResource(buyer, offer.offered.resource, offer.offered.quantity);
      
      // Give requested resource to seller  
      this.addResource(seller, offer.requested.resource, offer.requested.quantity);
      
      // Update market data
      this.updateMarketData(offer.offered.resource, offer.offered.quantity, 'sell');
      this.updateMarketData(offer.requested.resource, offer.requested.quantity, 'buy');
      
      // Update player stats
      const sellerWallet = this.getPlayerWallet(seller);
      const buyerWallet = this.getPlayerWallet(buyer);
      
      const tradeValue = this.getResourceValue(offer.offered.resource) * offer.offered.quantity;
      sellerWallet.totalTraded += tradeValue;
      buyerWallet.totalTraded += tradeValue;
      
      // Update reputation (successful trades improve reputation)
      sellerWallet.reputation += 1;
      buyerWallet.reputation += 1;
      
      // Record trade in history
      this.recordTrade(seller, buyer, offer);
      
      return true;
    } catch (error) {
      console.error('Trade execution error:', error);
      return false;
    }
  }

  updateMarketData(resourceName, quantity, action) {
    const resource = this.resources.get(resourceName);
    if (!resource) return;

    if (action === 'sell') {
      resource.supply += quantity;
      resource.demand = Math.max(1, resource.demand - quantity * 0.1);
    } else if (action === 'buy') {
      resource.demand += quantity;
      resource.supply = Math.max(1, resource.supply - quantity * 0.1);
    }

    resource.lastTrade = Date.now();
    resource.totalTraded += quantity;
    
    // Recalculate price
    this.calculatePrice(resourceName);
  }

  recordTrade(seller, buyer, offer) {
    const trade = {
      timestamp: Date.now(),
      seller,
      buyer,
      offeredResource: offer.offered.resource,
      offeredQuantity: offer.offered.quantity,
      requestedResource: offer.requested.resource,
      requestedQuantity: offer.requested.quantity,
      value: this.getResourceValue(offer.offered.resource) * offer.offered.quantity
    };

    this.marketHistory.push(trade);
    
    // Keep history manageable
    if (this.marketHistory.length > 1000) {
      this.marketHistory = this.marketHistory.slice(-500);
    }
  }

  // Shop system for persistent trading
  createShop(ownerName, shopName, location, specialization = 'general') {
    const shopId = this.generateShopId();
    
    const shop = {
      id: shopId,
      name: shopName,
      owner: ownerName,
      location: location, // {x, y, z}
      specialization, // 'weapons', 'tools', 'food', 'materials', 'magic', 'general'
      inventory: new Map(),
      prices: new Map(),
      reputation: 0,
      sales: 0,
      createdAt: Date.now(),
      isOpen: true
    };

    this.shops.set(shopId, shop);
    
    console.log(`🏪 Shop created: "${shopName}" by ${ownerName} (${specialization})`);
    
    return { success: true, shopId, shop };
  }

  stockShop(shopId, resourceName, quantity, price) {
    const shop = this.shops.get(shopId);
    if (!shop) return false;

    shop.inventory.set(resourceName, quantity);
    shop.prices.set(resourceName, price);
    
    return true;
  }

  buyFromShop(buyerName, shopId, resourceName, quantity) {
    const shop = this.shops.get(shopId);
    if (!shop || !shop.isOpen) {
      return { success: false, reason: 'Shop not available' };
    }

    const available = shop.inventory.get(resourceName) || 0;
    if (available < quantity) {
      return { success: false, reason: 'Insufficient stock' };
    }

    const price = shop.prices.get(resourceName);
    if (!price) {
      return { success: false, reason: 'Item not for sale' };
    }

    const totalCost = price * quantity;
    const buyerWallet = this.getPlayerWallet(buyerName);
    
    if (buyerWallet.coins < totalCost) {
      return { success: false, reason: 'Insufficient funds' };
    }

    // Execute purchase
    buyerWallet.coins -= totalCost;
    this.addResource(buyerName, resourceName, quantity);
    
    shop.inventory.set(resourceName, available - quantity);
    shop.sales += totalCost;
    
    // Pay shop owner (minus transaction fee)
    const ownerPayment = totalCost * (1 - this.currency.taxRate);
    const ownerWallet = this.getPlayerWallet(shop.owner);
    ownerWallet.coins += ownerPayment;
    
    console.log(`🛒 Shop purchase: ${buyerName} bought ${quantity}x ${resourceName} from ${shop.name} for ${totalCost} coins`);
    
    return { success: true, cost: totalCost, remaining: shop.inventory.get(resourceName) };
  }

  // Market analysis and intelligence
  getMarketAnalysis() {
    const analysis = {
      timestamp: Date.now(),
      topResources: [],
      priceTrends: {},
      marketCap: 0,
      totalTrades: this.marketHistory.length,
      activeShops: Array.from(this.shops.values()).filter(s => s.isOpen).length
    };

    // Calculate top resources by trade volume
    const resourceVolumes = new Map();
    for (const [name, data] of this.resources) {
      resourceVolumes.set(name, data.totalTraded);
      analysis.marketCap += data.currentPrice * data.supply;
      
      // Price trend analysis
      if (data.priceHistory.length >= 2) {
        const recent = data.priceHistory.slice(-5);
        const trend = recent[recent.length - 1] - recent[0];
        analysis.priceTrends[name] = trend > 0 ? 'up' : trend < 0 ? 'down' : 'stable';
      }
    }

    analysis.topResources = Array.from(resourceVolumes.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([name, volume]) => ({ resource: name, volume }));

    return analysis;
  }

  // Find trade opportunities
  findTradeOpportunities(playerName) {
    const wallet = this.getPlayerWallet(playerName);
    const opportunities = [];

    // Find profitable arbitrage opportunities
    for (const [resource, data] of this.resources) {
      if (data.priceHistory.length < 2) continue;

      const currentPrice = data.currentPrice;
      const avgPrice = data.priceHistory.reduce((a, b) => a + b) / data.priceHistory.length;
      
      if (currentPrice < avgPrice * 0.8) {
        opportunities.push({
          type: 'buy_low',
          resource,
          currentPrice,
          avgPrice,
          potential: ((avgPrice - currentPrice) / currentPrice * 100).toFixed(1) + '%'
        });
      } else if (currentPrice > avgPrice * 1.2) {
        opportunities.push({
          type: 'sell_high',
          resource,
          currentPrice,
          avgPrice,
          potential: ((currentPrice - avgPrice) / avgPrice * 100).toFixed(1) + '%'
        });
      }
    }

    // Find suitable trade partners
    const openOffers = Array.from(this.tradeOffers.values())
      .filter(offer => offer.status === 'open' && offer.expiresAt > Date.now());

    for (const offer of openOffers) {
      if (this.hasResource(playerName, offer.requested.resource, offer.requested.quantity)) {
        opportunities.push({
          type: 'trade_match',
          offerId: offer.id,
          offer
        });
      }
    }

    return opportunities.slice(0, 10); // Limit results
  }

  // Utility functions
  getResourceValue(resourceName) {
    const resource = this.resources.get(resourceName);
    return resource ? resource.currentPrice : 0;
  }

  generateTradeId() {
    return 'trade_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
  }

  generateShopId() {
    return 'shop_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
  }

  // Clean up expired offers
  cleanupExpiredOffers() {
    const now = Date.now();
    for (const [offerId, offer] of this.tradeOffers) {
      if (offer.expiresAt < now && offer.status === 'open') {
        this.cancelTradeOffer(offerId);
      }
    }
  }

  cancelTradeOffer(offerId) {
    const offer = this.tradeOffers.get(offerId);
    if (!offer) return false;

    if (offer.status === 'open') {
      // Return reserved resources to seller
      this.addResource(offer.seller, offer.offered.resource, offer.offered.quantity);
      offer.status = 'cancelled';
      console.log(`❌ Trade offer cancelled: ${offerId}`);
    }

    return true;
  }

  // Serialization for persistence
  toJSON() {
    return {
      resources: Array.from(this.resources.entries()),
      playerWallets: Array.from(this.playerWallets.entries()),
      tradeOffers: Array.from(this.tradeOffers.entries()),
      marketHistory: this.marketHistory,
      shops: Array.from(this.shops.entries()),
      tradingPosts: this.tradingPosts,
      contracts: Array.from(this.contracts.entries()),
      currency: this.currency
    };
  }

  fromJSON(data) {
    if (data.resources) this.resources = new Map(data.resources);
    if (data.playerWallets) this.playerWallets = new Map(data.playerWallets);
    if (data.tradeOffers) this.tradeOffers = new Map(data.tradeOffers);
    if (data.marketHistory) this.marketHistory = data.marketHistory;
    if (data.shops) {
      this.shops = new Map(data.shops);
      // Restore Map objects in shops
      for (const shop of this.shops.values()) {
        if (shop.inventory && !shop.inventory.set) {
          shop.inventory = new Map(Object.entries(shop.inventory));
        }
        if (shop.prices && !shop.prices.set) {
          shop.prices = new Map(Object.entries(shop.prices));
        }
      }
    }
    if (data.tradingPosts) this.tradingPosts = data.tradingPosts;
    if (data.contracts) this.contracts = new Map(data.contracts);
    if (data.currency) this.currency = { ...this.currency, ...data.currency };
    
    // Clean up expired offers on load
    this.cleanupExpiredOffers();
  }
}

module.exports = EconomySystem;