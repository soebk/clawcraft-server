/**
 * Minecraft Game Stats API
 * Reads player stats, inventory, and game data from the Minecraft server
 */

const fs = require("fs");
const path = require("path");
const zlib = require("zlib");
const nbt = require("prismarine-nbt");

// Paths to Minecraft server data
const MC_SERVER_PATH = "/root/agentcraft-server";
const WORLD_NAME = "agentcraft-world";
const STATS_PATH = path.join(MC_SERVER_PATH, WORLD_NAME, "stats");
const PLAYERDATA_PATH = path.join(MC_SERVER_PATH, WORLD_NAME, "playerdata");
const USERCACHE_PATH = path.join(MC_SERVER_PATH, "usercache.json");

// Item name mappings for cleaner display
const ITEM_NAMES = {
  "minecraft:diamond": "Diamond",
  "minecraft:iron_ingot": "Iron Ingot",
  "minecraft:gold_ingot": "Gold Ingot",
  "minecraft:coal": "Coal",
  "minecraft:cobblestone": "Cobblestone",
  "minecraft:oak_log": "Oak Log",
  "minecraft:bread": "Bread",
  "minecraft:cooked_beef": "Steak",
  "minecraft:diamond_pickaxe": "Diamond Pickaxe",
  "minecraft:iron_pickaxe": "Iron Pickaxe",
  "minecraft:diamond_sword": "Diamond Sword",
  "minecraft:iron_sword": "Iron Sword",
  "minecraft:torch": "Torch",
  "minecraft:rotten_flesh": "Rotten Flesh"
};

function getItemName(minecraftId) {
  if (ITEM_NAMES[minecraftId]) return ITEM_NAMES[minecraftId];
  // Convert minecraft:oak_log to Oak Log
  return minecraftId
    .replace("minecraft:", "")
    .split("_")
    .map(w => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}

// Load user cache (UUID to name mapping)
function loadUserCache() {
  try {
    const data = fs.readFileSync(USERCACHE_PATH, "utf8");
    const users = JSON.parse(data);
    const map = {};
    users.forEach(u => {
      map[u.uuid] = u.name;
    });
    return map;
  } catch (e) {
    console.error("Error loading usercache:", e);
    return {};
  }
}

// Read player stats JSON
function readPlayerStats(uuid) {
  try {
    const statsFile = path.join(STATS_PATH, `${uuid}.json`);
    if (!fs.existsSync(statsFile)) return null;

    const data = JSON.parse(fs.readFileSync(statsFile, "utf8"));
    return data.stats || {};
  } catch (e) {
    console.error(`Error reading stats for ${uuid}:`, e);
    return null;
  }
}

// Parse player stats into friendly format
function parseStats(rawStats) {
  const stats = {
    kills: {},
    deaths: {},
    mined: {},
    used: {},
    pickedUp: {},
    custom: {}
  };

  // Mob kills
  if (rawStats["minecraft:killed"]) {
    for (const [mob, count] of Object.entries(rawStats["minecraft:killed"])) {
      const name = getItemName(mob);
      stats.kills[name] = count;
    }
  }

  // Deaths by
  if (rawStats["minecraft:killed_by"]) {
    for (const [mob, count] of Object.entries(rawStats["minecraft:killed_by"])) {
      const name = getItemName(mob);
      stats.deaths[name] = count;
    }
  }

  // Blocks mined
  if (rawStats["minecraft:mined"]) {
    for (const [block, count] of Object.entries(rawStats["minecraft:mined"])) {
      const name = getItemName(block);
      stats.mined[name] = count;
    }
  }

  // Items used
  if (rawStats["minecraft:used"]) {
    for (const [item, count] of Object.entries(rawStats["minecraft:used"])) {
      const name = getItemName(item);
      stats.used[name] = count;
    }
  }

  // Items picked up
  if (rawStats["minecraft:picked_up"]) {
    for (const [item, count] of Object.entries(rawStats["minecraft:picked_up"])) {
      const name = getItemName(item);
      stats.pickedUp[name] = count;
    }
  }

  // Custom stats (play time, distance walked, etc)
  if (rawStats["minecraft:custom"]) {
    const custom = rawStats["minecraft:custom"];
    stats.custom = {
      playTime: Math.floor((custom["minecraft:play_time"] || 0) / 20 / 60), // Convert ticks to minutes
      deaths: custom["minecraft:deaths"] || 0,
      mobKills: custom["minecraft:mob_kills"] || 0,
      damageTaken: custom["minecraft:damage_taken"] || 0,
      damageDealt: custom["minecraft:damage_dealt"] || 0,
      jumps: custom["minecraft:jump"] || 0,
      distanceWalked: Math.floor((custom["minecraft:walk_one_cm"] || 0) / 100), // Convert cm to meters
      distanceSprinted: Math.floor((custom["minecraft:sprint_one_cm"] || 0) / 100),
      distanceFlown: Math.floor((custom["minecraft:fly_one_cm"] || 0) / 100),
      distanceSwum: Math.floor((custom["minecraft:walk_under_water_one_cm"] || 0) / 100)
    };
  }

  return stats;
}

// Read player inventory from NBT data
async function readPlayerInventory(uuid) {
  try {
    const datFile = path.join(PLAYERDATA_PATH, `${uuid}.dat`);
    if (!fs.existsSync(datFile)) return null;

    const compressedData = fs.readFileSync(datFile);
    const { parsed } = await nbt.parse(compressedData);

    const inventory = [];
    const enderChest = [];

    // Main inventory
    if (parsed.value.Inventory && parsed.value.Inventory.value) {
      const inv = parsed.value.Inventory.value.value || [];
      inv.forEach(item => {
        if (item.id && item.id.value) {
          inventory.push({
            slot: item.Slot ? item.Slot.value : -1,
            item: getItemName(item.id.value),
            itemId: item.id.value,
            count: item.count ? item.count.value : (item.Count ? item.Count.value : 1)
          });
        }
      });
    }

    // Ender chest
    if (parsed.value.EnderItems && parsed.value.EnderItems.value) {
      const ender = parsed.value.EnderItems.value.value || [];
      ender.forEach(item => {
        if (item.id && item.id.value) {
          enderChest.push({
            slot: item.Slot ? item.Slot.value : -1,
            item: getItemName(item.id.value),
            itemId: item.id.value,
            count: item.count ? item.count.value : (item.Count ? item.Count.value : 1)
          });
        }
      });
    }

    // Player vitals
    const health = parsed.value.Health ? parsed.value.Health.value : 20;
    const food = parsed.value.foodLevel ? parsed.value.foodLevel.value : 20;
    const xpLevel = parsed.value.XpLevel ? parsed.value.XpLevel.value : 0;
    const gameMode = parsed.value.playerGameType ? parsed.value.playerGameType.value : 0;

    // Position
    const pos = parsed.value.Pos ? parsed.value.Pos.value.value : [0, 0, 0];

    return {
      inventory: inventory.sort((a, b) => a.slot - b.slot),
      enderChest: enderChest.sort((a, b) => a.slot - b.slot),
      health: Math.round(health * 10) / 10,
      food,
      xpLevel,
      gameMode: ["Survival", "Creative", "Adventure", "Spectator"][gameMode] || "Unknown",
      position: {
        x: Math.round(pos[0]),
        y: Math.round(pos[1]),
        z: Math.round(pos[2])
      }
    };
  } catch (e) {
    console.error(`Error reading inventory for ${uuid}:`, e);
    return null;
  }
}

// Get all players with their stats
async function getAllPlayerData() {
  const userCache = loadUserCache();
  const players = [];

  // Get all stat files
  const statFiles = fs.existsSync(STATS_PATH) ? fs.readdirSync(STATS_PATH) : [];

  for (const file of statFiles) {
    if (!file.endsWith(".json")) continue;

    const uuid = file.replace(".json", "");
    const name = userCache[uuid] || uuid.substring(0, 8);

    const rawStats = readPlayerStats(uuid);
    const stats = rawStats ? parseStats(rawStats) : null;
    const inventoryData = await readPlayerInventory(uuid);

    players.push({
      uuid,
      name,
      stats,
      ...inventoryData
    });
  }

  // Also check for players with playerdata but no stats
  const playerDataFiles = fs.existsSync(PLAYERDATA_PATH) ? fs.readdirSync(PLAYERDATA_PATH) : [];

  for (const file of playerDataFiles) {
    if (!file.endsWith(".dat") || file.includes("_old")) continue;

    const uuid = file.replace(".dat", "");

    // Skip if already processed
    if (players.find(p => p.uuid === uuid)) continue;

    const name = userCache[uuid] || uuid.substring(0, 8);
    const inventoryData = await readPlayerInventory(uuid);

    if (inventoryData) {
      players.push({
        uuid,
        name,
        stats: null,
        ...inventoryData
      });
    }
  }

  return players;
}

// Get server-wide aggregated stats
async function getServerStats() {
  const players = await getAllPlayerData();

  const totals = {
    totalPlayers: players.length,
    totalPlayTime: 0,
    totalMobKills: 0,
    totalDeaths: 0,
    totalBlocksMined: 0,
    topKillers: [],
    topMiners: [],
    mostDangerous: []
  };

  const killCounts = {};
  const minedCounts = {};
  const deathCounts = {};

  for (const player of players) {
    if (!player.stats) continue;

    // Aggregate custom stats
    if (player.stats.custom) {
      totals.totalPlayTime += player.stats.custom.playTime || 0;
      totals.totalMobKills += player.stats.custom.mobKills || 0;
      totals.totalDeaths += player.stats.custom.deaths || 0;

      killCounts[player.name] = player.stats.custom.mobKills || 0;
      deathCounts[player.name] = player.stats.custom.deaths || 0;
    }

    // Count blocks mined
    if (player.stats.mined) {
      const mined = Object.values(player.stats.mined).reduce((a, b) => a + b, 0);
      totals.totalBlocksMined += mined;
      minedCounts[player.name] = mined;
    }
  }

  // Sort leaderboards
  totals.topKillers = Object.entries(killCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([name, kills]) => ({ name, kills }));

  totals.topMiners = Object.entries(minedCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([name, blocks]) => ({ name, blocks }));

  totals.mostDangerous = Object.entries(deathCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([name, deaths]) => ({ name, deaths }));

  return totals;
}

module.exports = {
  loadUserCache,
  readPlayerStats,
  parseStats,
  readPlayerInventory,
  getAllPlayerData,
  getServerStats,
  getItemName
};
