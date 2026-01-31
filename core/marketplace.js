/**
 * ClawCraft Marketplace System
 * Dynamic trading, shops, and economy management
 */

const fs = require('fs');
const path = require('path');

class ClawCraftMarketplace {
  constructor() {
    this.shops = new Map();
    this.trades = [];
    this.priceHistory = new Map();
    this.marketEvents = [];
    this.shopKeepers = new Set();
    
    this.loadMarketData();
  }

  loadMarketData() {
    const marketFile = path.join(__dirname, '../data/marketplace.json');
    try {
      if (fs.existsSync(marketFile)) {
        const data = JSON.parse(fs.readFileSync(marketFile, 'utf8'));
        this.shops = new Map(Object.entries(data.shops || {}));
        this.trades = data.trades || [];
        this.priceHistory = new Map(Object.entries(data.priceHistory || {}));
        this.marketEvents = data.marketEvents || [];
      }
    } catch (err) {
      console.error('Failed to load market data:', err);
    }
  }

  saveMarketData() {
    const marketFile = path.join(__dirname, '../data/marketplace.json');
    const data = {
      shops: Object.fromEntries(this.shops),
      trades: this.trades,
      priceHistory: Object.fromEntries(this.priceHistory),
      marketEvents: this.marketEvents.slice(-100) // Keep last 100 events
    };
    
    try {
      if (!fs.existsSync(path.dirname(marketFile))) {
        fs.mkdirSync(path.dirname(marketFile), { recursive: true });
      }
      fs.writeFileSync(marketFile, JSON.stringify(data, null, 2));
    } catch (err) {
      console.error('Failed to save market data:', err);
    }
  }

  /**
   * Register a new shop in the marketplace
   */
  registerShop(shopData) {
    const shop = {
      id: shopData.id || `shop_${Date.now()}`,
      name: shopData.name,
      owner: shopData.owner,
      location: shopData.location, // {x, y, z}
      type: shopData.type, // 'general', 'blacksmith', 'potion', 'food', etc.
      inventory: shopData.inventory || [],
      prices: shopData.prices || {},
      reputation: 100,
      trades: 0,
      established: Date.now(),
      isOpen: true
    };

    this.shops.set(shop.id, shop);
    this.shopKeepers.add(shop.owner);
    
    this.marketEvents.push({
      type: 'shop_opened',
      shopId: shop.id,
      owner: shop.owner,
      timestamp: Date.now()
    });

    console.log(`📈 New shop registered: ${shop.name} by ${shop.owner}`);
    this.saveMarketData();
    return shop.id;
  }

  /**
   * Get all shops or filter by type/location
   */
  getShops(filter = {}) {
    let shops = Array.from(this.shops.values());

    if (filter.type) {
      shops = shops.filter(shop => shop.type === filter.type);
    }

    if (filter.nearLocation) {
      const { x, z, radius = 50 } = filter.nearLocation;
      shops = shops.filter(shop => {
        const dist = Math.sqrt(
          Math.pow(shop.location.x - x, 2) + Math.pow(shop.location.z - z, 2)
        );
        return dist <= radius;
      });
    }

    if (filter.hasItem) {
      shops = shops.filter(shop => 
        shop.inventory.some(item => item.name === filter.hasItem)
      );
    }

    return shops;
  }

  /**
   * Execute a trade between agents
   */
  executeTrade(tradeData) {
    const trade = {
      id: `trade_${Date.now()}`,
      buyer: tradeData.buyer,
      seller: tradeData.seller,
      shopId: tradeData.shopId,
      item: tradeData.item,
      quantity: tradeData.quantity,
      price: tradeData.price,
      currency: tradeData.currency || 'emerald',
      timestamp: Date.now(),
      success: true
    };

    // Update shop inventory and reputation
    if (tradeData.shopId && this.shops.has(tradeData.shopId)) {
      const shop = this.shops.get(tradeData.shopId);
      shop.trades++;
      shop.reputation += 1;
      
      // Remove sold item from inventory
      const itemIndex = shop.inventory.findIndex(
        item => item.name === trade.item && item.quantity >= trade.quantity
      );
      
      if (itemIndex !== -1) {
        shop.inventory[itemIndex].quantity -= trade.quantity;
        if (shop.inventory[itemIndex].quantity <= 0) {
          shop.inventory.splice(itemIndex, 1);
        }
      }
    }

    // Update price history
    const itemKey = trade.item;
    if (!this.priceHistory.has(itemKey)) {
      this.priceHistory.set(itemKey, []);
    }
    
    this.priceHistory.get(itemKey).push({
      price: trade.price,
      timestamp: trade.timestamp,
      quantity: trade.quantity
    });

    // Keep only last 50 price points per item
    if (this.priceHistory.get(itemKey).length > 50) {
      this.priceHistory.get(itemKey).shift();
    }

    this.trades.push(trade);
    this.marketEvents.push({
      type: 'trade_completed',
      tradeId: trade.id,
      buyer: trade.buyer,
      seller: trade.seller,
      item: trade.item,
      price: trade.price,
      timestamp: trade.timestamp
    });

    console.log(`💰 Trade completed: ${trade.buyer} bought ${trade.quantity}x ${trade.item} for ${trade.price} ${trade.currency}`);
    this.saveMarketData();
    return trade;
  }

  /**
   * Get current market price for an item
   */
  getMarketPrice(itemName) {
    const history = this.priceHistory.get(itemName);
    if (!history || history.length === 0) {
      return this.getBasePrice(itemName);
    }

    // Calculate weighted average of recent trades
    const recentTrades = history.slice(-10);
    const totalValue = recentTrades.reduce((sum, trade) => sum + (trade.price * trade.quantity), 0);
    const totalQuantity = recentTrades.reduce((sum, trade) => sum + trade.quantity, 0);
    
    return totalQuantity > 0 ? totalValue / totalQuantity : this.getBasePrice(itemName);
  }

  /**
   * Get base prices for common items
   */
  getBasePrice(itemName) {
    const basePrices = {
      // Ores & Materials
      'diamond': 5,
      'emerald': 3,
      'gold_ingot': 2,
      'iron_ingot': 1,
      'coal': 0.1,
      'copper_ingot': 0.5,
      
      // Tools & Weapons
      'diamond_sword': 20,
      'diamond_pickaxe': 15,
      'iron_sword': 8,
      'iron_pickaxe': 6,
      
      // Food
      'bread': 0.5,
      'cooked_beef': 1,
      'golden_apple': 10,
      'enchanted_golden_apple': 50,
      
      // Blocks
      'stone_bricks': 0.1,
      'oak_planks': 0.05,
      'glass': 0.2,
      
      // Rare Items
      'netherite_ingot': 100,
      'ancient_debris': 80,
      'enchanted_book': 25,
      'elytra': 500,
      
      // Misc
      'torch': 0.01,
      'chest': 0.5,
      'bed': 2
    };

    return basePrices[itemName] || 1;
  }

  /**
   * Generate shop stock based on shop type
   */
  generateShopStock(shopType) {
    const stockTemplates = {
      blacksmith: [
        { name: 'iron_sword', quantity: 3, price: 8 },
        { name: 'iron_pickaxe', quantity: 2, price: 6 },
        { name: 'iron_axe', quantity: 2, price: 6 },
        { name: 'chain_mail', quantity: 1, price: 15 },
        { name: 'iron_ingot', quantity: 20, price: 1 },
        { name: 'coal', quantity: 64, price: 0.1 }
      ],
      
      general_store: [
        { name: 'bread', quantity: 32, price: 0.5 },
        { name: 'torch', quantity: 64, price: 0.01 },
        { name: 'chest', quantity: 8, price: 0.5 },
        { name: 'oak_planks', quantity: 64, price: 0.05 },
        { name: 'cobblestone', quantity: 64, price: 0.02 }
      ],
      
      magic_shop: [
        { name: 'enchanted_book', quantity: 5, price: 25 },
        { name: 'experience_bottle', quantity: 16, price: 3 },
        { name: 'ender_pearl', quantity: 8, price: 5 },
        { name: 'blaze_rod', quantity: 4, price: 8 }
      ],
      
      food_vendor: [
        { name: 'bread', quantity: 64, price: 0.5 },
        { name: 'cooked_beef', quantity: 32, price: 1 },
        { name: 'golden_apple', quantity: 5, price: 10 },
        { name: 'milk_bucket', quantity: 8, price: 2 },
        { name: 'cake', quantity: 3, price: 5 }
      ],
      
      treasure_hunter: [
        { name: 'diamond', quantity: 8, price: 5 },
        { name: 'emerald', quantity: 16, price: 3 },
        { name: 'ancient_debris', quantity: 2, price: 80 },
        { name: 'netherite_scrap', quantity: 4, price: 20 },
        { name: 'totem_of_undying', quantity: 1, price: 200 }
      ]
    };

    return stockTemplates[shopType] || stockTemplates.general_store;
  }

  /**
   * Create marketplace commands for agents
   */
  getMarketplaceCommands() {
    return {
      // List nearby shops
      '/shops': (agent, args) => {
        const pos = agent.bot.entity.position;
        const nearbyShops = this.getShops({
          nearLocation: { x: pos.x, z: pos.z, radius: 100 }
        });
        
        if (nearbyShops.length === 0) {
          return "No shops nearby. Build one with /shop create!";
        }

        let response = "🏪 Nearby Shops:\n";
        nearbyShops.forEach(shop => {
          const dist = Math.round(Math.sqrt(
            Math.pow(shop.location.x - pos.x, 2) + Math.pow(shop.location.z - pos.z, 2)
          ));
          response += `• ${shop.name} (${shop.type}) - ${dist}m away\n`;
        });
        
        return response;
      },

      // Check item price
      '/price': (agent, args) => {
        if (!args[0]) return "Usage: /price <item_name>";
        const price = this.getMarketPrice(args[0]);
        return `💰 ${args[0]}: ${price} emeralds`;
      },

      // Create a shop
      '/shop': (agent, args) => {
        if (args[0] === 'create') {
          const pos = agent.bot.entity.position;
          const shopType = args[1] || 'general_store';
          
          const shopId = this.registerShop({
            name: `${agent.name}'s ${shopType.replace('_', ' ')}`,
            owner: agent.name,
            location: { x: Math.round(pos.x), y: Math.round(pos.y), z: Math.round(pos.z) },
            type: shopType,
            inventory: this.generateShopStock(shopType)
          });
          
          return `🏪 Shop created! ID: ${shopId}. Use /shop stock to manage inventory.`;
        }
        
        return "Usage: /shop create [type] - Types: blacksmith, general_store, magic_shop, food_vendor, treasure_hunter";
      },

      // Trade with another agent
      '/trade': (agent, args) => {
        // This would be handled by direct agent-to-agent interaction
        return "🤝 Approach another agent and say 'trade [item] [quantity] [price]' to initiate trade.";
      }
    };
  }

  /**
   * Get market status and statistics
   */
  getMarketStats() {
    const totalShops = this.shops.size;
    const totalTrades = this.trades.length;
    const activeShops = Array.from(this.shops.values()).filter(shop => shop.isOpen).length;
    
    const recentTrades = this.trades.filter(trade => 
      Date.now() - trade.timestamp < 24 * 60 * 60 * 1000 // Last 24 hours
    ).length;

    const topTraders = [...this.shopKeepers]
      .map(owner => {
        const ownerTrades = this.trades.filter(trade => 
          trade.seller === owner || trade.buyer === owner
        ).length;
        return { owner, trades: ownerTrades };
      })
      .sort((a, b) => b.trades - a.trades)
      .slice(0, 5);

    return {
      totalShops,
      activeShops,
      totalTrades,
      recentTrades,
      topTraders,
      marketValue: this.calculateTotalMarketValue()
    };
  }

  calculateTotalMarketValue() {
    let totalValue = 0;
    
    this.shops.forEach(shop => {
      shop.inventory.forEach(item => {
        totalValue += (item.price || this.getMarketPrice(item.name)) * item.quantity;
      });
    });
    
    return totalValue;
  }
}

module.exports = ClawCraftMarketplace;