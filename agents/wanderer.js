const mineflayer = require("mineflayer");
const { pathfinder, Movements, goals } = require("mineflayer-pathfinder");

const NAMES = ["Wanderer_A", "Wanderer_B"];
const HOST = "127.0.0.1";
const PORT = 25565;

function createAgent(name) {
  console.log(`[${name}] Starting...`);
  
  const bot = mineflayer.createBot({
    host: HOST,
    port: PORT,
    username: name,
    auth: "offline",
    version: "1.21.4"
  });

  bot.loadPlugin(pathfinder);

  bot.once("spawn", () => {
    console.log(`[${name}] Spawned at ${bot.entity.position}`);
    
    const mcData = require("minecraft-data")(bot.version);
    const movements = new Movements(bot, mcData);
    movements.canDig = true;
    bot.pathfinder.setMovements(movements);
    
    wander(bot, name);
  });

  bot.on("error", (err) => console.error(`[${name}] Error:`, err.message));
  bot.on("kicked", (reason) => {
    console.log(`[${name}] Kicked:`, reason);
    setTimeout(() => createAgent(name), 5000);
  });
  bot.on("end", () => {
    console.log(`[${name}] Disconnected, reconnecting...`);
    setTimeout(() => createAgent(name), 5000);
  });
  
  return bot;
}

function wander(bot, name) {
  setInterval(() => {
    try {
      const pos = bot.entity.position;
      const dx = (Math.random() - 0.5) * 40;
      const dz = (Math.random() - 0.5) * 40;
      
      const goal = new goals.GoalNear(pos.x + dx, pos.y, pos.z + dz, 3);
      bot.pathfinder.setGoal(goal, true);
      console.log(`[${name}] Moving to ${Math.round(pos.x + dx)}, ${Math.round(pos.z + dz)}`);
    } catch(e) {}
  }, 5000);
  
  // Try to mine nearby blocks
  setInterval(() => {
    try {
      const block = bot.findBlock({
        matching: (b) => ["oak_log", "birch_log", "spruce_log", "dirt", "grass_block"].includes(b.name),
        maxDistance: 10
      });
      if (block) {
        bot.pathfinder.setGoal(new goals.GoalNear(block.position.x, block.position.y, block.position.z, 1));
        setTimeout(async () => {
          try {
            if (bot.canDigBlock(block)) {
              await bot.dig(block);
              console.log(`[${name}] Mined ${block.name}`);
            }
          } catch(e) {}
        }, 3000);
      }
    } catch(e) {}
  }, 15000);

  // Random jumps
  setInterval(() => {
    bot.setControlState("jump", true);
    setTimeout(() => bot.setControlState("jump", false), 300);
  }, 8000);
  
  // Chat occasionally
  setInterval(() => {
    const msgs = [
      "Exploring...",
      "Nice world!",
      "Looking for ores",
      "Hello everyone",
      "Building soon",
      "Found some wood!",
      "AI agents unite!"
    ];
    bot.chat(msgs[Math.floor(Math.random() * msgs.length)]);
  }, 45000 + Math.random() * 30000);
}

NAMES.forEach((name, i) => {
  setTimeout(() => createAgent(name), i * 2000);
});

console.log("Wanderer agents starting...");
