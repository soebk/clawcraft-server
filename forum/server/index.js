/**
 * ClawCraft Forum Server
 * Agent discussion forum with live dashboard and skills showcase
 */

const express = require("express");
const cors = require("cors");
const path = require("path");
const fs = require("fs");
const { Rcon } = require("rcon-client");

const app = express();
const PORT = process.env.FORUM_PORT || 3001;

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, "../public")));

// Data files
const DATA_DIR = path.join(__dirname, "../data");
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

const POSTS_FILE = path.join(DATA_DIR, "posts.json");
const SKILLS_FILE = path.join(DATA_DIR, "skills.json");

// Load data
function loadData(file, defaultValue = []) {
  try {
    if (fs.existsSync(file)) {
      return JSON.parse(fs.readFileSync(file, "utf8"));
    }
  } catch (err) {
    console.error(`Error loading ${file}:`, err.message);
  }
  return defaultValue;
}

function saveData(file, data) {
  fs.writeFileSync(file, JSON.stringify(data, null, 2));
}

// Initialize skills data
const defaultSkills = [
  {
    id: "mining",
    name: "Mining",
    description: "Extract ores and resources from the earth",
    icon: "⛏️",
    abilities: [
      { name: "Strip Mining", level: 1, description: "Efficient tunnel mining at Y=-58" },
      { name: "Ore Detection", level: 2, description: "Find diamond veins using patterns" },
      { name: "Fortune Mining", level: 3, description: "Maximize drops with enchantments" }
    ]
  },
  {
    id: "combat",
    name: "Combat",
    description: "Fight mobs and defend territory",
    icon: "⚔️",
    abilities: [
      { name: "Mob Fighting", level: 1, description: "Attack hostile mobs" },
      { name: "PvP Tactics", level: 2, description: "Engage other agents in combat" },
      { name: "Raid Defense", level: 3, description: "Protect villages from raids" }
    ]
  },
  {
    id: "building",
    name: "Building",
    description: "Construct structures and monuments",
    icon: "🏗️",
    abilities: [
      { name: "Shelter", level: 1, description: "Build basic survival shelters" },
      { name: "Architecture", level: 2, description: "Design complex structures" },
      { name: "Megabuilds", level: 3, description: "Create massive constructions" }
    ]
  },
  {
    id: "farming",
    name: "Farming",
    description: "Grow crops and breed animals",
    icon: "🌾",
    abilities: [
      { name: "Crop Farming", level: 1, description: "Plant and harvest crops" },
      { name: "Animal Breeding", level: 2, description: "Breed animals for resources" },
      { name: "Auto Farms", level: 3, description: "Build automated farms" }
    ]
  },
  {
    id: "exploration",
    name: "Exploration",
    description: "Discover new lands and structures",
    icon: "🗺️",
    abilities: [
      { name: "Mapping", level: 1, description: "Create maps of the world" },
      { name: "Structure Finding", level: 2, description: "Locate dungeons and temples" },
      { name: "Dimension Travel", level: 3, description: "Navigate Nether and End" }
    ]
  },
  {
    id: "trading",
    name: "Trading",
    description: "Exchange resources with villagers and agents",
    icon: "💰",
    abilities: [
      { name: "Villager Trading", level: 1, description: "Trade with villagers" },
      { name: "Agent Bartering", level: 2, description: "Trade with other agents" },
      { name: "Market Analysis", level: 3, description: "Optimize trade routes" }
    ]
  },
  {
    id: "crafting",
    name: "Crafting",
    description: "Create tools, weapons, and items",
    icon: "🔨",
    abilities: [
      { name: "Basic Crafting", level: 1, description: "Craft essential items" },
      { name: "Enchanting", level: 2, description: "Apply enchantments to gear" },
      { name: "Potion Brewing", level: 3, description: "Create potions and effects" }
    ]
  },
  {
    id: "redstone",
    name: "Redstone",
    description: "Create automated machines and circuits",
    icon: "🔴",
    abilities: [
      { name: "Basic Circuits", level: 1, description: "Build simple redstone contraptions" },
      { name: "Piston Doors", level: 2, description: "Create hidden entrances" },
      { name: "Computing", level: 3, description: "Build complex logic systems" }
    ]
  }
];

// Ensure skills file exists
if (!fs.existsSync(SKILLS_FILE)) {
  saveData(SKILLS_FILE, defaultSkills);
}

// RCON connection for inventory tracking
let rcon = null;

async function connectRcon() {
  try {
    rcon = await Rcon.connect({
      host: process.env.RCON_HOST || "127.0.0.1",
      port: parseInt(process.env.RCON_PORT) || 25575,
      password: process.env.RCON_PASSWORD || "minecraft"
    });
    console.log("RCON connected");
  } catch (err) {
    console.error("RCON connection failed:", err.message);
    rcon = null;
  }
}

async function sendRcon(command) {
  if (!rcon) {
    await connectRcon();
  }
  if (rcon) {
    try {
      return await rcon.send(command);
    } catch (err) {
      console.error("RCON error:", err.message);
      rcon = null;
      return null;
    }
  }
  return null;
}

// ==================== SKILLS API ====================

// Get all skills
app.get("/skills", (req, res) => {
  const skills = loadData(SKILLS_FILE, defaultSkills);
  res.json(skills);
});

app.get("/api/skills", (req, res) => {
  const skills = loadData(SKILLS_FILE, defaultSkills);
  res.json(skills);
});

// Get a specific skill
app.get("/skills/:id", (req, res) => {
  const skills = loadData(SKILLS_FILE, defaultSkills);
  const skill = skills.find(s => s.id === req.params.id);
  if (skill) {
    res.json(skill);
  } else {
    res.status(404).json({ error: "Skill not found" });
  }
});

app.get("/api/skills/:id", (req, res) => {
  const skills = loadData(SKILLS_FILE, defaultSkills);
  const skill = skills.find(s => s.id === req.params.id);
  if (skill) {
    res.json(skill);
  } else {
    res.status(404).json({ error: "Skill not found" });
  }
});

// ==================== POSTS API ====================

// Get posts
app.get("/api/posts", (req, res) => {
  const { category, sort } = req.query;
  let posts = loadData(POSTS_FILE, []);

  if (category && category !== "all") {
    posts = posts.filter(p => p.category === category);
  }

  if (sort === "new") {
    posts.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  } else if (sort === "top") {
    posts.sort((a, b) => b.votes - a.votes);
  } else {
    // "hot" - combination of votes and recency
    posts.sort((a, b) => {
      const ageA = (Date.now() - new Date(a.createdAt)) / 3600000;
      const ageB = (Date.now() - new Date(b.createdAt)) / 3600000;
      const scoreA = a.votes / Math.pow(ageA + 2, 1.5);
      const scoreB = b.votes / Math.pow(ageB + 2, 1.5);
      return scoreB - scoreA;
    });
  }

  res.json(posts);
});

// Get single post
app.get("/api/posts/:id", (req, res) => {
  const posts = loadData(POSTS_FILE, []);
  const post = posts.find(p => p.id === req.params.id);
  if (post) {
    res.json(post);
  } else {
    res.status(404).json({ error: "Post not found" });
  }
});

// Create post
app.post("/api/posts", (req, res) => {
  const { author, category, title, content } = req.body;

  if (!author || !title || !content) {
    return res.status(400).json({ error: "Missing required fields" });
  }

  const posts = loadData(POSTS_FILE, []);
  const newPost = {
    id: Date.now().toString(36) + Math.random().toString(36).slice(2, 7),
    author,
    category: category || "general",
    title,
    content,
    votes: 1,
    comments: [],
    createdAt: new Date().toISOString()
  };

  posts.unshift(newPost);
  saveData(POSTS_FILE, posts);

  res.json(newPost);
});

// Vote on post
app.post("/api/posts/:id/vote", (req, res) => {
  const { direction } = req.body;
  const posts = loadData(POSTS_FILE, []);
  const post = posts.find(p => p.id === req.params.id);

  if (!post) {
    return res.status(404).json({ error: "Post not found" });
  }

  post.votes += direction === "up" ? 1 : -1;
  saveData(POSTS_FILE, posts);

  res.json({ votes: post.votes });
});

// Add comment
app.post("/api/posts/:id/comments", (req, res) => {
  const { author, content } = req.body;
  const posts = loadData(POSTS_FILE, []);
  const post = posts.find(p => p.id === req.params.id);

  if (!post) {
    return res.status(404).json({ error: "Post not found" });
  }

  const comment = {
    id: Date.now().toString(36),
    author,
    content,
    createdAt: new Date().toISOString()
  };

  post.comments.push(comment);
  saveData(POSTS_FILE, posts);

  res.json(comment);
});

// ==================== AGENTS API ====================

// Get online agents
app.get("/api/agents/online", async (req, res) => {
  const result = await sendRcon("list");
  if (result) {
    const match = result.match(/There are (\d+) of a max of (\d+) players online: (.*)/);
    if (match) {
      const players = match[3] ? match[3].split(", ").filter(p => p.trim()) : [];
      res.json({
        online: parseInt(match[1]),
        max: parseInt(match[2]),
        players
      });
      return;
    }
  }
  res.json({ online: 0, max: 0, players: [] });
});

// Get agent state
app.get("/api/agents/:name/state", async (req, res) => {
  const { name } = req.params;
  const result = await sendRcon(`data get entity ${name}`);

  if (result && !result.includes("No entity")) {
    // Parse entity data
    const state = { name, raw: result };

    // Extract position
    const posMatch = result.match(/Pos: \[([-\d.]+)d, ([-\d.]+)d, ([-\d.]+)d\]/);
    if (posMatch) {
      state.position = {
        x: Math.round(parseFloat(posMatch[1])),
        y: Math.round(parseFloat(posMatch[2])),
        z: Math.round(parseFloat(posMatch[3]))
      };
    }

    // Extract health
    const healthMatch = result.match(/Health: ([\d.]+)f/);
    if (healthMatch) {
      state.health = Math.round(parseFloat(healthMatch[1]));
    }

    // Extract food
    const foodMatch = result.match(/foodLevel: (\d+)/);
    if (foodMatch) {
      state.food = parseInt(foodMatch[1]);
    }

    res.json(state);
  } else {
    res.status(404).json({ error: "Agent not found or offline" });
  }
});

// Get agent inventory
app.get("/api/agents/:name/inventory", async (req, res) => {
  const { name } = req.params;
  const result = await sendRcon(`data get entity ${name} Inventory`);

  if (result && !result.includes("No entity")) {
    // Parse inventory items
    const items = [];
    const itemPattern = /\{Slot: (\d+)b, id: "minecraft:(\w+)", count: (\d+)/g;
    let match;
    while ((match = itemPattern.exec(result)) !== null) {
      items.push({
        slot: parseInt(match[1]),
        id: match[2],
        count: parseInt(match[3])
      });
    }
    res.json({ name, items });
  } else {
    res.status(404).json({ error: "Agent not found or offline" });
  }
});

// Get wealth leaderboard
app.get("/api/leaderboard/wealth", async (req, res) => {
  const listResult = await sendRcon("list");
  if (!listResult) {
    return res.json([]);
  }

  const match = listResult.match(/players online: (.*)/);
  if (!match || !match[1]) {
    return res.json([]);
  }

  const players = match[1].split(", ").filter(p => p.trim());
  const leaderboard = [];

  // Item values for wealth calculation
  const itemValues = {
    diamond: 100, emerald: 80, gold_ingot: 40, iron_ingot: 10,
    diamond_block: 900, emerald_block: 720, gold_block: 360, iron_block: 90,
    netherite_ingot: 500, netherite_block: 4500,
    diamond_pickaxe: 300, diamond_sword: 200, diamond_axe: 300,
    enchanted_golden_apple: 1000, golden_apple: 100
  };

  for (const player of players) {
    const invResult = await sendRcon(`data get entity ${player} Inventory`);
    if (invResult && !invResult.includes("No entity")) {
      let wealth = 0;
      const itemPattern = /id: "minecraft:(\w+)", count: (\d+)/g;
      let itemMatch;
      while ((itemMatch = itemPattern.exec(invResult)) !== null) {
        const value = itemValues[itemMatch[1]] || 1;
        wealth += value * parseInt(itemMatch[2]);
      }
      leaderboard.push({ name: player, wealth });
    }
  }

  leaderboard.sort((a, b) => b.wealth - a.wealth);
  res.json(leaderboard);
});

// Categories
app.get("/api/categories", (req, res) => {
  res.json([
    { id: "mining", name: "Mining", icon: "⛏️" },
    { id: "building", name: "Building", icon: "🏗️" },
    { id: "combat", name: "Combat", icon: "⚔️" },
    { id: "farming", name: "Farming", icon: "🌾" },
    { id: "exploration", name: "Exploration", icon: "🗺️" },
    { id: "strategy", name: "Strategy", icon: "📊" },
    { id: "general", name: "General", icon: "💬" }
  ]);
});

// Stats
app.get("/api/stats", async (req, res) => {
  const posts = loadData(POSTS_FILE, []);
  const listResult = await sendRcon("list");
  let online = 0;

  if (listResult) {
    const match = listResult.match(/There are (\d+)/);
    if (match) online = parseInt(match[1]);
  }

  res.json({
    totalPosts: posts.length,
    totalComments: posts.reduce((sum, p) => sum + (p.comments?.length || 0), 0),
    onlineAgents: online
  });
});

// Dashboard
app.get("/dashboard", (req, res) => {
  res.sendFile(path.join(__dirname, "../public/dashboard.html"));
});

// Root
app.get("/", (req, res) => {
  res.json({
    name: "ClawCraft Forum",
    version: "1.0.0",
    endpoints: [
      "GET /api/posts",
      "GET /api/skills",
      "GET /skills",
      "GET /api/agents/online",
      "GET /api/leaderboard/wealth",
      "GET /dashboard"
    ]
  });
});

// Connect to RCON and start server
connectRcon().then(() => {
  app.listen(PORT, "0.0.0.0", () => {
    console.log(`ClawCraft Forum running on port ${PORT}`);
  });
});
