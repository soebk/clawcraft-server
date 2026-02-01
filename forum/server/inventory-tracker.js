/**
 * Inventory Tracker
 * Tracks agent inventories via RCON and stores history
 */

const fs = require("fs");
const path = require("path");
const rcon = require("./rcon-api.js");

const DATA_DIR = path.join(__dirname, "data");
const INVENTORY_FILE = path.join(DATA_DIR, "inventories.json");
const INVENTORY_HISTORY_FILE = path.join(DATA_DIR, "inventory-history.json");

if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

function readJSON(file, defaultValue = {}) {
  try {
    if (fs.existsSync(file)) {
      return JSON.parse(fs.readFileSync(file, "utf8"));
    }
  } catch (e) {}
  return defaultValue;
}

function writeJSON(file, data) {
  fs.writeFileSync(file, JSON.stringify(data, null, 2));
}

/**
 * Parse Minecraft inventory from RCON response
 * Format: [{count: 1, Slot: 0b, id: "minecraft:water_bucket"}, ...]
 */
function parseInventoryResponse(response) {
  const items = [];
  
  try {
    // Match each item block: {count: X, Slot: Yb, id: "minecraft:item"}
    const itemRegex = /\{[^{}]*count:\s*(\d+)[^{}]*Slot:\s*(\d+)b[^{}]*id:\s*"minecraft:([^"]+)"[^{}]*\}|\{[^{}]*id:\s*"minecraft:([^"]+)"[^{}]*Slot:\s*(\d+)b[^{}]*count:\s*(\d+)[^{}]*\}|\{[^{}]*Slot:\s*(\d+)b[^{}]*id:\s*"minecraft:([^"]+)"[^{}]*count:\s*(\d+)[^{}]*\}/gi;
    
    let match;
    while ((match = itemRegex.exec(response)) !== null) {
      let count, slot, id;
      
      if (match[1]) {
        count = parseInt(match[1]);
        slot = parseInt(match[2]);
        id = match[3];
      } else if (match[4]) {
        id = match[4];
        slot = parseInt(match[5]);
        count = parseInt(match[6]);
      } else if (match[7]) {
        slot = parseInt(match[7]);
        id = match[8];
        count = parseInt(match[9]);
      }
      
      if (id && count) {
        items.push({ slot, id, count });
      }
    }
    
    // Fallback: simpler pattern
    if (items.length === 0) {
      const simpleRegex = /id:\s*"minecraft:([^"]+)"[^,}]*,?\s*(?:count|Slot)[^}]*count:\s*(\d+)/gi;
      while ((match = simpleRegex.exec(response)) !== null) {
        items.push({
          id: match[1],
          count: parseInt(match[2]),
          slot: items.length
        });
      }
    }
    
    // Even simpler fallback
    if (items.length === 0) {
      const ultraSimple = /id:\s*"minecraft:([^"]+)"/gi;
      const countRegex = /count:\s*(\d+)/gi;
      const ids = [];
      const counts = [];
      
      while ((match = ultraSimple.exec(response)) !== null) {
        ids.push(match[1]);
      }
      while ((match = countRegex.exec(response)) !== null) {
        counts.push(parseInt(match[1]));
      }
      
      for (let i = 0; i < Math.min(ids.length, counts.length); i++) {
        items.push({ id: ids[i], count: counts[i], slot: i });
      }
    }
  } catch (e) {
    console.error("Error parsing inventory:", e);
  }
  
  return items;
}

async function getPlayerInventory(playerName) {
  try {
    const result = await rcon.sendCommand(`data get entity ${playerName} Inventory`);
    
    if (!result.success) {
      return { success: false, error: result.error };
    }
    
    if (result.response.includes("No entity was found")) {
      return { success: false, error: "Player not online" };
    }
    
    const items = parseInventoryResponse(result.response);
    
    return {
      success: true,
      player: playerName,
      items,
      itemCount: items.reduce((sum, i) => sum + i.count, 0),
      uniqueItems: items.length,
      timestamp: Date.now()
    };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

async function getHeldItem(playerName) {
  try {
    const result = await rcon.sendCommand(`data get entity ${playerName} SelectedItem`);
    
    if (!result.success || result.response.includes("No entity")) {
      return null;
    }
    
    const match = result.response.match(/id:\s*"minecraft:([^"]+)"/);
    const countMatch = result.response.match(/[Cc]ount:\s*(\d+)/);
    
    if (match) {
      return {
        id: match[1],
        count: countMatch ? parseInt(countMatch[1]) : 1
      };
    }
    
    return null;
  } catch (error) {
    return null;
  }
}

async function getPlayerPosition(playerName) {
  try {
    const result = await rcon.sendCommand(`data get entity ${playerName} Pos`);
    
    if (!result.success || result.response.includes("No entity")) {
      return null;
    }
    
    const match = result.response.match(/\[(-?[\d.]+)d?,\s*(-?[\d.]+)d?,\s*(-?[\d.]+)d?\]/);
    
    if (match) {
      return {
        x: Math.round(parseFloat(match[1])),
        y: Math.round(parseFloat(match[2])),
        z: Math.round(parseFloat(match[3]))
      };
    }
    
    return null;
  } catch (error) {
    return null;
  }
}

async function getPlayerHealth(playerName) {
  try {
    const healthResult = await rcon.sendCommand(`data get entity ${playerName} Health`);
    const foodResult = await rcon.sendCommand(`data get entity ${playerName} foodLevel`);
    
    let health = 20;
    let food = 20;
    
    if (healthResult.success) {
      const match = healthResult.response.match(/(\d+\.?\d*)f?$/);
      if (match) health = Math.round(parseFloat(match[1]));
    }
    
    if (foodResult.success) {
      const match = foodResult.response.match(/(\d+)$/);
      if (match) food = parseInt(match[1]);
    }
    
    return { health, food };
  } catch (error) {
    return { health: 20, food: 20 };
  }
}

async function getPlayerState(playerName) {
  const [inventory, position, health, heldItem] = await Promise.all([
    getPlayerInventory(playerName),
    getPlayerPosition(playerName),
    getPlayerHealth(playerName),
    getHeldItem(playerName)
  ]);
  
  return {
    player: playerName,
    online: inventory.success,
    position,
    health: health.health,
    food: health.food,
    heldItem,
    inventory: inventory.success ? inventory.items : [],
    itemCount: inventory.success ? inventory.itemCount : 0,
    timestamp: Date.now()
  };
}

async function getAllPlayerStates() {
  const players = await rcon.getOnlinePlayers();
  const states = {};
  
  for (const player of players) {
    states[player] = await getPlayerState(player);
  }
  
  return states;
}

async function saveInventorySnapshot() {
  const states = await getAllPlayerStates();
  
  const inventories = readJSON(INVENTORY_FILE, {});
  const history = readJSON(INVENTORY_HISTORY_FILE, []);
  
  for (const [player, state] of Object.entries(states)) {
    inventories[player] = state;
    
    history.push({
      player,
      timestamp: Date.now(),
      itemCount: state.itemCount,
      position: state.position,
      health: state.health
    });
  }
  
  if (history.length > 1000) {
    history.splice(0, history.length - 1000);
  }
  
  writeJSON(INVENTORY_FILE, inventories);
  writeJSON(INVENTORY_HISTORY_FILE, history);
  
  return states;
}

function getCachedInventory(playerName) {
  const inventories = readJSON(INVENTORY_FILE, {});
  return inventories[playerName] || null;
}

function getAllCachedInventories() {
  return readJSON(INVENTORY_FILE, {});
}

function getPlayerHistory(playerName, limit = 50) {
  const history = readJSON(INVENTORY_HISTORY_FILE, []);
  return history
    .filter(h => h.player === playerName)
    .slice(-limit);
}

function calculateInventoryValue(items) {
  const values = {
    diamond: 100,
    emerald: 80,
    gold_ingot: 30,
    iron_ingot: 10,
    diamond_pickaxe: 300,
    diamond_sword: 200,
    diamond_axe: 300,
    diamond_shovel: 100,
    diamond_hoe: 200,
    netherite_ingot: 500,
    netherite_pickaxe: 800,
    netherite_sword: 700,
    enchanted_golden_apple: 1000,
    elytra: 2000,
    totem_of_undying: 500,
    shulker_box: 200,
    ender_pearl: 20,
    blaze_rod: 15,
    golden_apple: 100,
    experience_bottle: 10
  };
  
  let total = 0;
  for (const item of items) {
    const baseValue = values[item.id] || 1;
    total += baseValue * item.count;
  }
  
  return total;
}

module.exports = {
  getPlayerInventory,
  getHeldItem,
  getPlayerPosition,
  getPlayerHealth,
  getPlayerState,
  getAllPlayerStates,
  saveInventorySnapshot,
  getCachedInventory,
  getAllCachedInventories,
  getPlayerHistory,
  calculateInventoryValue
};
