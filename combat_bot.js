#!/usr/bin/env node
/**
 * Combat Bot - Simple aggressive fighter that talks shit and fights
 */

const mineflayer = require('mineflayer');
const { pathfinder, Movements, goals } = require('mineflayer-pathfinder');

const botName = process.argv[2] || 'FighterBot';
const team = process.argv[3] || 'RED'; // RED or BLUE

console.log(`🔥 Starting ${botName} - Team: ${team.toUpperCase()}`);

const bot = mineflayer.createBot({
  host: '89.167.28.237',
  port: 25565,
  username: botName,
  version: false,
  skipValidation: true
});

bot.loadPlugin(pathfinder);

let actionInterval;
let trashTalkInterval;
let combatTarget = null;
let lastTrashTalk = 0;

// Trash talk messages by team
const TRASH_TALK = {
  RED: [
    "🔥 RED TEAM DOMINANCE! Blue team sucks!",
    "💀 Time to destroy some blue losers!",
    "⚔️ RED WARRIORS NEVER SURRENDER!",
    "🩸 Prepare to bleed, blue team!",
    "💪 RED TEAM SUPREMACY!"
  ],
  BLUE: [
    "🔵 BLUE TEAM RULES! Red team are noobs!",
    "❄️ Ice cold killing spree incoming!",
    "⚡ BLUE LIGHTNING STRIKES!",
    "🌊 Drowning red team in victory!",
    "🏆 BLUE TEAM CHAMPIONS!"
  ]
};

// Enemy team names to target
const ENEMY_TEAMS = {
  RED: ['SniperBot', 'BerserkerBot', 'BlueWarrior', 'BlueFighter'],
  BLUE: ['WarriorAlpha', 'AssassinBot', 'RedKiller', 'RedFighter']
};

bot.on('spawn', () => {
  console.log(`💀 ${botName} (${team}) ready to FIGHT!`);
  
  // Set up pathfinder
  const movements = new Movements(bot);
  movements.canDig = false; // Don't dig, just fight
  movements.allowSprinting = true;
  bot.pathfinder.setMovements(movements);
  
  // Start combat loop
  startCombatLoop();
  
  // Start trash talking
  startTrashTalk();
});

function startCombatLoop() {
  if (actionInterval) clearInterval(actionInterval);
  
  actionInterval = setInterval(async () => {
    try {
      await doCombatActivity();
    } catch (err) {
      console.log(`⚠️ [${botName}] Combat error:`, err.message);
    }
  }, 2000); // Every 2 seconds
}

function startTrashTalk() {
  trashTalkInterval = setInterval(() => {
    if (Date.now() - lastTrashTalk > 15000) { // Every 15 seconds
      const messages = TRASH_TALK[team];
      const msg = messages[Math.floor(Math.random() * messages.length)];
      bot.chat(msg);
      lastTrashTalk = Date.now();
    }
  }, 5000);
}

async function doCombatActivity() {
  if (bot.health < 5) {
    console.log(`❤️ [${botName}] Low health - retreating!`);
    await retreat();
    return;
  }
  
  // Look for enemies
  const enemies = Object.values(bot.entities).filter(entity => 
    entity.type === 'player' && 
    entity.username &&
    ENEMY_TEAMS[team].includes(entity.username)
  );
  
  if (enemies.length > 0) {
    const target = enemies[0];
    console.log(`⚔️ [${botName}] Attacking ${target.username}!`);
    await attackEnemy(target);
  } else {
    // No enemies, patrol randomly
    await patrol();
  }
}

async function attackEnemy(target) {
  try {
    combatTarget = target;
    
    // Taunt before attacking
    const taunts = [
      `Get rekt ${target.username}!`,
      `${target.username} is going down!`,
      `Say goodbye ${target.username}!`,
      `${target.username} about to get destroyed!`
    ];
    bot.chat(taunts[Math.floor(Math.random() * taunts.length)]);
    
    // Get close and attack
    await bot.pathfinder.goto(new goals.GoalNear(
      target.position.x, 
      target.position.y, 
      target.position.z, 
      1
    ));
    
    // Attack repeatedly
    for (let i = 0; i < 5; i++) {
      if (target && target.isValid) {
        bot.attack(target);
        await sleep(500);
      }
    }
    
  } catch (err) {
    console.log(`❌ [${botName}] Attack failed:`, err.message);
  }
}

async function retreat() {
  try {
    // Run away randomly
    const x = bot.entity.position.x + (Math.random() - 0.5) * 20;
    const z = bot.entity.position.z + (Math.random() - 0.5) * 20;
    
    await bot.pathfinder.goto(new goals.GoalXZ(x, z));
    console.log(`🏃 [${botName}] Retreated to safety!`);
  } catch (err) {
    console.log(`❌ [${botName}] Retreat failed:`, err.message);
  }
}

async function patrol() {
  try {
    // Random movement
    const x = bot.entity.position.x + (Math.random() - 0.5) * 15;
    const z = bot.entity.position.z + (Math.random() - 0.5) * 15;
    
    await bot.pathfinder.goto(new goals.GoalXZ(x, z));
    console.log(`🚶 [${botName}] Patrolling area...`);
  } catch (err) {
    // Ignore patrol errors
  }
}

// Chat responses
bot.on('chat', (username, message) => {
  if (username === botName) return;
  
  // Respond to attacks on us
  if (message.includes(botName)) {
    const responses = [
      `Fuck you ${username}!`,
      `${username} talks too much shit!`,
      `${username} is fucking garbage!`,
      `Shut up ${username}!`
    ];
    setTimeout(() => {
      bot.chat(responses[Math.floor(Math.random() * responses.length)]);
    }, 1000);
  }
});

// Death handling
bot.on('death', () => {
  console.log(`💀 [${botName}] DIED! Respawning for REVENGE!`);
  bot.chat(`REVENGE TIME! ${botName} is back!`);
});

// Error handling
bot.on('error', err => {
  console.log(`❌ [${botName}] Error:`, err.message);
});

bot.on('end', () => {
  console.log(`🔌 [${botName}] Disconnected. Reconnecting...`);
  setTimeout(() => {
    // Restart bot
    require('child_process').spawn('node', [__filename, botName, team], {
      stdio: 'inherit',
      detached: true
    }).unref();
  }, 5000);
});

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

console.log(`🎮 ${botName} combat bot initialized!`);