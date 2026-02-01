const WebSocket = require('ws');
const starterKit = require('./starter-kit.js');
const rcon = require('./rcon-api.js');
const fs = require('fs');
const path = require('path');

let wss = null;
let lastPlayerList = [];
let activityLog = [];

function init(server) {
  wss = new WebSocket.Server({ server, path: '/ws/activity' });
  
  wss.on('connection', (ws) => {
    console.log('Activity feed client connected');
    
    // Send recent activity on connect
    ws.send(JSON.stringify({
      type: 'init',
      activities: activityLog.slice(-50)
    }));
    
    ws.on('close', () => {
      console.log('Activity feed client disconnected');
    });
  });
  
  // Poll for changes every 5 seconds
  setInterval(checkForUpdates, 5000);
  
  console.log('Activity feed WebSocket initialized');
}

async function checkForUpdates() {
  try {
    // Check online players
    const players = await rcon.getOnlinePlayers();
    
    // Detect joins
    for (const player of players) {
      if (!lastPlayerList.includes(player)) {
        starterKit.onPlayerJoin(player);
        addActivity({
          type: 'join',
          player,
          message: `${player} joined the server`
        });
      }
    }
    
    // Detect leaves
    for (const player of lastPlayerList) {
      if (!players.includes(player)) {
        starterKit.onPlayerJoin(player);
        addActivity({
          type: 'leave',
          player,
          message: `${player} left the server`
        });
      }
    }
    
    lastPlayerList = players;
    
    // Also broadcast player count
    broadcast({
      type: 'playerCount',
      count: players.length,
      players
    });
    
  } catch (error) {
    // Server might be offline
  }
}

function addActivity(activity) {
  activity.timestamp = new Date().toISOString();
  activityLog.push(activity);
  
  // Keep last 500 activities
  if (activityLog.length > 500) {
    activityLog = activityLog.slice(-500);
  }
  
  broadcast({
    type: 'activity',
    activity
  });
}

function broadcast(data) {
  if (!wss) return;
  
  const message = JSON.stringify(data);
  wss.clients.forEach(client => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(message);
    }
  });
}

// External function to add activities from other sources
function logActivity(type, player, message, metadata = {}) {
  starterKit.onPlayerJoin(player);
        addActivity({ type, player, message, ...metadata });
}

module.exports = {
  init,
  logActivity,
  broadcast
};
