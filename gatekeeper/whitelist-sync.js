/**
 * Whitelist Sync Service
 * Syncs verified ERC-8004 agents to Minecraft server whitelist
 * 
 * Run alongside the gatekeeper to automatically allow verified agents
 */

const fs = require("fs");
const path = require("path");
const { exec } = require("child_process");

const GATEKEEPER_URL = "http://localhost:3002";
const WHITELIST_PATH = "/root/agentcraft-server/whitelist.json";
const SYNC_INTERVAL = 10000; // 10 seconds

async function getVerifiedAgents() {
  try {
    const res = await fetch(`${GATEKEEPER_URL}/api/agents`);
    return await res.json();
  } catch (err) {
    console.error("Error fetching verified agents:", err.message);
    return [];
  }
}

function readWhitelist() {
  try {
    if (fs.existsSync(WHITELIST_PATH)) {
      return JSON.parse(fs.readFileSync(WHITELIST_PATH, "utf8"));
    }
  } catch (err) {
    console.error("Error reading whitelist:", err.message);
  }
  return [];
}

function writeWhitelist(whitelist) {
  fs.writeFileSync(WHITELIST_PATH, JSON.stringify(whitelist, null, 2));
}

function reloadWhitelist() {
  // Send reload command to server via screen
  exec(`screen -S mc-server -p 0 -X stuff "whitelist reload\\n"`, (err) => {
    if (err) console.error("Error reloading whitelist:", err.message);
  });
}

async function sync() {
  const verifiedAgents = await getVerifiedAgents();
  const currentWhitelist = readWhitelist();
  
  // Build set of currently whitelisted names
  const whitelistedNames = new Set(currentWhitelist.map(e => e.name.toLowerCase()));
  
  // Add any new verified agents
  let changed = false;
  for (const agent of verifiedAgents) {
    if (\!whitelistedNames.has(agent.username.toLowerCase())) {
      console.log(`Adding ${agent.username} to whitelist (Agent ID: ${agent.agentId})`);
      currentWhitelist.push({
        uuid: generateOfflineUUID(agent.username),
        name: agent.username
      });
      changed = true;
    }
  }
  
  if (changed) {
    writeWhitelist(currentWhitelist);
    reloadWhitelist();
    console.log("Whitelist updated and reloaded");
  }
}

// Generate offline-mode UUID (same as Minecraft does)
function generateOfflineUUID(username) {
  const crypto = require("crypto");
  const hash = crypto.createHash("md5").update(`OfflinePlayer:${username}`).digest();
  hash[6] = (hash[6] & 0x0f) | 0x30; // Version 3
  hash[8] = (hash[8] & 0x3f) | 0x80; // Variant
  const hex = hash.toString("hex");
  return `${hex.slice(0,8)}-${hex.slice(8,12)}-${hex.slice(12,16)}-${hex.slice(16,20)}-${hex.slice(20,32)}`;
}

console.log("Whitelist Sync Service started");
console.log(`Syncing every ${SYNC_INTERVAL/1000} seconds`);

// Initial sync
sync();

// Periodic sync
setInterval(sync, SYNC_INTERVAL);
