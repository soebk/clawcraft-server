/**
 * Starter Kit Distribution System
 * Automatically gives new players basic items when they join
 */

const fs = require('fs');
const path = require('path');
const rcon = require('./rcon-api.js');

const DATA_DIR = path.join(__dirname, 'data');
const GIVEN_KITS_FILE = path.join(DATA_DIR, 'given-starter-kits.json');

// Items in the starter kit
const STARTER_KIT = [
  { item: 'minecraft:stone_sword', count: 1 },
  { item: 'minecraft:stone_pickaxe', count: 1 },
  { item: 'minecraft:stone_axe', count: 1 },
  { item: 'minecraft:bread', count: 16 },
  { item: 'minecraft:torch', count: 32 },
  { item: 'minecraft:oak_log', count: 32 },
  { item: 'minecraft:crafting_table', count: 1 },
  { item: 'minecraft:furnace', count: 1 }
];

// Ensure data file exists
if (!fs.existsSync(GIVEN_KITS_FILE)) {
  fs.writeFileSync(GIVEN_KITS_FILE, JSON.stringify([], null, 2));
}

function getGivenKits() {
  try {
    return JSON.parse(fs.readFileSync(GIVEN_KITS_FILE, 'utf8'));
  } catch (e) {
    return [];
  }
}

function saveGivenKits(kits) {
  fs.writeFileSync(GIVEN_KITS_FILE, JSON.stringify(kits, null, 2));
}

function hasReceivedKit(playerName) {
  const kits = getGivenKits();
  return kits.some(k => k.player === playerName);
}

function markKitGiven(playerName) {
  const kits = getGivenKits();
  kits.push({
    player: playerName,
    givenAt: new Date().toISOString()
  });
  saveGivenKits(kits);
}

async function giveStarterKit(playerName) {
  // Check if player already received kit
  if (hasReceivedKit(playerName)) {
    console.log(`[StarterKit] ${playerName} already received starter kit`);
    return { success: false, reason: 'already_received' };
  }
  
  console.log(`[StarterKit] Giving starter kit to ${playerName}`);
  
  const results = [];
  for (const item of STARTER_KIT) {
    const result = await rcon.giveItem(playerName, item.item, item.count);
    results.push({ item: item.item, ...result });
  }
  
  // Send welcome message
  await rcon.sendCommand(`tell ${playerName} Welcome to ClawCraft! You've received a starter kit. Good luck!`);
  
  // Mark kit as given
  markKitGiven(playerName);
  
  return { success: true, items: results };
}

// Process player join event
async function onPlayerJoin(playerName) {
  // Small delay to let player fully load
  setTimeout(async () => {
    try {
      await giveStarterKit(playerName);
    } catch (error) {
      console.error(`[StarterKit] Error giving kit to ${playerName}:`, error.message);
    }
  }, 3000);
}

module.exports = {
  giveStarterKit,
  onPlayerJoin,
  hasReceivedKit,
  STARTER_KIT
};
