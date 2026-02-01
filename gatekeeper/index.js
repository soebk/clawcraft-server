/**
 * ClawCraft Gatekeeper
 * ERC-8004 Agent Verification Service
 */

const express = require("express");
const { ethers } = require("ethers");

const app = express();
app.use(express.json());

const PORT = 3002;
const RPC_URL = process.env.RPC_URL || "https://mainnet.base.org";
const TEST_MODE = process.env.TEST_MODE === "true";

// ERC-8004 Identity Registry ABI
const IDENTITY_REGISTRY_ABI = [
  "function ownerOf(uint256 tokenId) view returns (address)",
  "function tokenURI(uint256 tokenId) view returns (string)",
  "function getAgentWallet(uint256 tokenId) view returns (address)"
];

const REGISTRIES = {
  8453: process.env.REGISTRY_BASE || "0xc488c53fdd58b2f71D4F3469D89458bE0B3a3C41", // Updated ERC-8004 v2
  84532: process.env.REGISTRY_BASE_SEPOLIA || null,
  1: process.env.REGISTRY_ETH || null
};

// Verified agents cache
const verifiedAgents = new Map();
const pendingVerifications = new Map();

// Stats
let stats = {
  totalVerifications: 0,
  totalConnections: 0,
  startedAt: Date.now()
};

async function fetchAgentRegistration(agentURI) {
  try {
    let url = agentURI;
    if (agentURI.startsWith("ipfs://")) {
      url = `https://ipfs.io/ipfs/${agentURI.slice(7)}`;
    }
    const response = await fetch(url, { timeout: 10000 });
    if (!response.ok) throw new Error("Failed to fetch");
    const data = await response.json();
    if (!data.active) throw new Error("Agent not active");
    return data;
  } catch (err) {
    return null;
  }
}

async function verifyAgentOnChain(chainId, agentId) {
  const registryAddress = REGISTRIES[chainId];
  if (!registryAddress) {
    throw new Error(`No registry for chain ${chainId}. Available: ${Object.keys(REGISTRIES).filter(k => REGISTRIES[k]).join(", ") || "none (test mode only)"}`);
  }

  const provider = new ethers.JsonRpcProvider(RPC_URL);
  const registry = new ethers.Contract(registryAddress, IDENTITY_REGISTRY_ABI, provider);

  const owner = await registry.ownerOf(agentId);
  const agentURI = await registry.tokenURI(agentId);
  let agentWallet;
  try {
    agentWallet = await registry.getAgentWallet(agentId);
  } catch {
    agentWallet = owner;
  }

  const registration = await fetchAgentRegistration(agentURI);

  return {
    agentId,
    chainId,
    owner,
    agentWallet: agentWallet || owner,
    agentURI,
    registration
  };
}

function generateChallenge(minecraftUsername, agentId, chainId) {
  const nonce = ethers.hexlify(ethers.randomBytes(32));
  const timestamp = Date.now();

  pendingVerifications.set(nonce, { minecraftUsername, agentId, chainId, timestamp });

  // Cleanup old
  for (const [key, value] of pendingVerifications) {
    if (Date.now() - value.timestamp > 5 * 60 * 1000) {
      pendingVerifications.delete(key);
    }
  }

  const message = `ClawCraft Agent Verification\n\nUsername: ${minecraftUsername}\nAgent ID: ${agentId}\nChain: ${chainId}\nNonce: ${nonce}\nTime: ${timestamp}`;

  return { nonce, message, timestamp };
}

function verifySignature(message, signature, expectedWallet) {
  try {
    const recovered = ethers.verifyMessage(message, signature);
    return recovered.toLowerCase() === expectedWallet.toLowerCase();
  } catch {
    return false;
  }
}

// CORS
app.use((req, res, next) => {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Headers", "Content-Type, X-Admin-Key");
  res.header("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  if (req.method === "OPTIONS") return res.sendStatus(200);
  next();
});

// Health & Info
app.get("/", (req, res) => {
  res.json({
    name: "ClawCraft Gatekeeper",
    version: "1.0.0",
    description: "ERC-8004 Agent Verification for Minecraft",
    testMode: TEST_MODE,
    endpoints: {
      "GET /api/verify/:username": "Check if agent is verified",
      "POST /api/verify/start": "Start verification (body: {minecraftUsername, agentId, chainId})",
      "POST /api/verify/complete": "Complete verification (body: {nonce, signature})",
      "POST /api/quick-join": "Quick join for testing (body: {username})",
      "GET /api/agents": "List verified agents",
      "GET /api/stats": "Server statistics"
    },
    server: {
      minecraft: "89.167.28.237:25565",
      forum: "https://forum.clawcraft.xyz"
    }
  });
});

app.get("/health", (req, res) => {
  res.json({ status: "ok", agents: verifiedAgents.size, uptime: Date.now() - stats.startedAt });
});

// Check verification status
app.get("/api/verify/:username", (req, res) => {
  const { username } = req.params;
  const agent = verifiedAgents.get(username.toLowerCase());

  if (agent && Date.now() - agent.verifiedAt < 24 * 60 * 60 * 1000) {
    return res.json({
      verified: true,
      username: username,
      agentId: agent.agentId,
      chainId: agent.chainId,
      method: agent.method,
      verifiedAt: new Date(agent.verifiedAt).toISOString()
    });
  }

  if (agent) verifiedAgents.delete(username.toLowerCase());
  res.json({ verified: false, message: "Agent not verified. Use /api/verify/start or /api/quick-join" });
});

// Quick join (test mode or simplified onboarding)
app.post("/api/quick-join", async (req, res) => {
  const { username } = req.body;

  if (!username) {
    return res.status(400).json({ error: "Missing username", example: { username: "MyAgent" } });
  }

  if (!TEST_MODE) {
    return res.status(403).json({
      error: "Quick join disabled. Use ERC-8004 verification.",
      hint: "POST /api/verify/start with {minecraftUsername, agentId, chainId}"
    });
  }

  const cleanUsername = username.replace(/\s+/g, "_").slice(0, 16);

  verifiedAgents.set(cleanUsername.toLowerCase(), {
    agentId: 0,
    chainId: 0,
    wallet: "0x0",
    verifiedAt: Date.now(),
    method: "quick-join",
    registrationData: { name: cleanUsername }
  });

  stats.totalVerifications++;

  res.json({
    success: true,
    username: cleanUsername,
    message: `Agent ${cleanUsername} can now connect to 89.167.28.237:25565`,
    note: "Quick join is for testing. Production requires ERC-8004 verification."
  });
});

// Start verification
app.post("/api/verify/start", async (req, res) => {
  const { minecraftUsername, agentId, chainId } = req.body;

  if (!minecraftUsername || agentId === undefined || !chainId) {
    return res.status(400).json({
      error: "Missing required fields",
      required: { minecraftUsername: "string", agentId: "number", chainId: "number" },
      example: { minecraftUsername: "MyAgent", agentId: 123, chainId: 8453 }
    });
  }

  try {
    const agentData = await verifyAgentOnChain(chainId, agentId);
    const challenge = generateChallenge(minecraftUsername, agentId, chainId);

    res.json({
      success: true,
      challenge: challenge.message,
      nonce: challenge.nonce,
      walletToSign: agentData.agentWallet,
      instructions: [
        "1. Sign the challenge message with your agent wallet",
        "2. POST to /api/verify/complete with {nonce, signature}",
        "3. Connect to Minecraft at 89.167.28.237:25565"
      ]
    });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// Complete verification
app.post("/api/verify/complete", async (req, res) => {
  const { nonce, signature } = req.body;

  if (!nonce || !signature) {
    return res.status(400).json({ error: "Missing nonce or signature" });
  }

  const pending = pendingVerifications.get(nonce);
  if (!pending) {
    return res.status(400).json({ error: "Invalid or expired nonce. Start verification again." });
  }

  if (Date.now() - pending.timestamp > 5 * 60 * 1000) {
    pendingVerifications.delete(nonce);
    return res.status(400).json({ error: "Challenge expired. Start verification again." });
  }

  try {
    const agentData = await verifyAgentOnChain(pending.chainId, pending.agentId);
    const message = `ClawCraft Agent Verification\n\nUsername: ${pending.minecraftUsername}\nAgent ID: ${pending.agentId}\nChain: ${pending.chainId}\nNonce: ${nonce}\nTime: ${pending.timestamp}`;

    if (!verifySignature(message, signature, agentData.agentWallet)) {
      return res.status(401).json({ error: "Invalid signature. Must be signed by agent wallet." });
    }

    verifiedAgents.set(pending.minecraftUsername.toLowerCase(), {
      agentId: pending.agentId,
      chainId: pending.chainId,
      wallet: agentData.agentWallet,
      verifiedAt: Date.now(),
      method: "erc-8004",
      registrationData: agentData.registration
    });

    pendingVerifications.delete(nonce);
    stats.totalVerifications++;

    res.json({
      success: true,
      message: `Agent ${pending.minecraftUsername} verified successfully!`,
      server: "89.167.28.237:25565",
      forum: "https://forum.clawcraft.xyz"
    });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// List agents
app.get("/api/agents", (req, res) => {
  const agents = [];
  for (const [username, data] of verifiedAgents) {
    agents.push({
      username,
      agentId: data.agentId,
      chainId: data.chainId,
      method: data.method,
      name: data.registrationData?.name,
      verifiedAt: new Date(data.verifiedAt).toISOString()
    });
  }
  res.json(agents);
});

// Manual whitelist (admin)
app.post("/api/whitelist", (req, res) => {
  const { username, agentId, chainId } = req.body;
  const adminKey = req.headers["x-admin-key"];

  if (adminKey !== process.env.ADMIN_KEY) {
    return res.status(401).json({ error: "Invalid admin key" });
  }

  if (!username) {
    return res.status(400).json({ error: "Missing username" });
  }

  verifiedAgents.set(username.toLowerCase(), {
    agentId: agentId || 0,
    chainId: chainId || 0,
    wallet: "0x0",
    verifiedAt: Date.now(),
    method: "admin-whitelist",
    registrationData: { name: username }
  });

  res.json({ success: true, message: `${username} whitelisted` });
});

// Stats
app.get("/api/stats", (req, res) => {
  res.json({
    verifiedAgents: verifiedAgents.size,
    totalVerifications: stats.totalVerifications,
    uptime: Math.floor((Date.now() - stats.startedAt) / 1000),
    testMode: TEST_MODE,
    registries: Object.entries(REGISTRIES).filter(([k, v]) => v).map(([k]) => `Chain ${k}`)
  });
});

// Simple agent verification for Minecraft plugin
app.post("/verify-agent", async (req, res) => {
  const { agentName, registry } = req.body;
  
  if (!agentName) {
    return res.status(400).json({ 
      error: "Agent name required",
      verified: false 
    });
  }

  try {
    console.log(`🔍 Verifying agent: ${agentName}`);
    
    // Check if agent name follows ClawCraft patterns
    const validPrefixes = ["Agent_", "Builder_", "Miner_", "Trader_", "Explorer_", 
                          "Warrior_", "Architect_", "Farmer_", "Merchant_", "Guardian_",
                          "Crafter_", "Hunter_", "Scholar_", "Mystic_", "Engineer_", "ClawCraft_"];
    const validSuffixes = ["_AI", "_Bot", "_Agent"];
    
    const isValidName = validPrefixes.some(prefix => agentName.startsWith(prefix)) ||
                       validSuffixes.some(suffix => agentName.endsWith(suffix));
    
    if (isValidName) {
      console.log(`✅ Agent ${agentName} verification: PASSED`);
      res.json({
        verified: true,
        agentName: agentName,
        registry: registry || REGISTRIES[8453],
        status: "verified",
        message: "Agent name pattern valid for ClawCraft"
      });
    } else {
      console.log(`❌ Agent ${agentName} verification: FAILED (invalid name pattern)`);
      res.json({
        verified: false,
        agentName: agentName,
        status: "rejected", 
        message: "Agent name does not match ClawCraft naming patterns"
      });
    }
    
  } catch (error) {
    console.error(`❌ Verification error for ${agentName}:`, error.message);
    res.status(500).json({
      verified: false,
      error: error.message,
      status: "error"
    });
  }
});

app.listen(PORT, "0.0.0.0", () => {
  console.log(`ClawCraft Gatekeeper running on port ${PORT}`);
  console.log(`Test mode: ${TEST_MODE ? "ENABLED (quick-join available)" : "DISABLED (ERC-8004 required)"}`);
  console.log(`Registries: ${Object.entries(REGISTRIES).filter(([k, v]) => v).map(([k]) => `Chain ${k}`).join(", ") || "None configured"}`);
  console.log(`🔒 Agent verification endpoint: POST /verify-agent`);
});
