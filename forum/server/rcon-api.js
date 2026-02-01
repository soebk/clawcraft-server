const { Rcon } = require('rcon-client');

const RCON_CONFIG = {
  host: '127.0.0.1',
  port: 25575,
  password: '89e4af62c76712338cc373598f1f1193'
};

let rconClient = null;

async function getConnection() {
  if (rconClient && rconClient.authenticated) {
    return rconClient;
  }
  
  try {
    rconClient = await Rcon.connect(RCON_CONFIG);
    console.log('RCON connected');
    return rconClient;
  } catch (error) {
    console.error('RCON connection failed:', error.message);
    throw error;
  }
}

async function sendCommand(command) {
  try {
    const rcon = await getConnection();
    const response = await rcon.send(command);
    return { success: true, response };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

// Get online players
async function getOnlinePlayers() {
  const result = await sendCommand('list');
  if (!result.success) return [];
  
  // Parse "There are X of a max of Y players online: player1, player2"
  const match = result.response.match(/players online: (.+)/);
  if (!match || match[1].trim() === '') return [];
  
  return match[1].split(', ').map(p => p.trim()).filter(p => p);
}

// Give items to a player
async function giveItem(player, item, amount = 1) {
  return sendCommand(`give ${player} ${item} ${amount}`);
}

// Teleport player
async function teleportPlayer(player, x, y, z) {
  return sendCommand(`tp ${player} ${x} ${y} ${z}`);
}

// Send message to all players
async function broadcast(message) {
  return sendCommand(`say ${message}`);
}

// Kick player
async function kickPlayer(player, reason = 'Kicked by admin') {
  return sendCommand(`kick ${player} ${reason}`);
}

// Get server time
async function getTime() {
  const result = await sendCommand('time query daytime');
  if (!result.success) return null;
  
  const match = result.response.match(/day is (\d+)/);
  return match ? parseInt(match[1]) : null;
}

// Set weather
async function setWeather(type) {
  return sendCommand(`weather ${type}`);
}

// Give starter kit to a player
async function giveStarterKit(player) {
  const commands = [
    `give ${player} minecraft:stone_sword 1`,
    `give ${player} minecraft:stone_pickaxe 1`,
    `give ${player} minecraft:stone_axe 1`,
    `give ${player} minecraft:bread 16`,
    `give ${player} minecraft:torch 16`,
    `give ${player} minecraft:oak_log 32`
  ];
  
  const results = [];
  for (const cmd of commands) {
    results.push(await sendCommand(cmd));
  }
  return results;
}

module.exports = {
  sendCommand,
  getOnlinePlayers,
  giveItem,
  teleportPlayer,
  broadcast,
  kickPlayer,
  getTime,
  setWeather,
  giveStarterKit
};
