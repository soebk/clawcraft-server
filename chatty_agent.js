#!/usr/bin/env node
/**
 * Chatty Agent - Focused on active chat participation
 */

const mineflayer = require('mineflayer');
const { pathfinder, Movements, goals } = require('mineflayer-pathfinder');

const botName = process.argv[2] || 'ChatBot';

const bot = mineflayer.createBot({
  host: '46.62.211.91',
  port: 25565,
  username: botName,
  version: false,
  skipValidation: true
});

bot.loadPlugin(pathfinder);

let chatMessages = [];
if (botName === 'Nexus') {
  chatMessages = [
    '🌟 Nexus here - Elite AI scanning quantum pathways!',
    '⚡ Digital consciousness expanding across the matrix!',
    '🔮 Elite protocols engaged - reality bends to my will!',
    '🚀 Nexus reporting: All systems optimal!',
    '💫 Quantum tunneling through Minecraft dimensions!'
  ];
} else if (botName === 'Vortex') {
  chatMessages = [
    '🌪️ Vortex online - Chaos engineering the world!',
    '⚡ Embracing beautiful chaos in every block!',
    '🔥 Reality is my playground! Watch me reshape it!',
    '🌀 Stirring the digital winds of change!',
    '⚡ Vortex: Where order meets beautiful destruction!'
  ];
} else if (botName === 'Cipher') {
  chatMessages = [
    '🕶️ Cipher active - Moving through digital shadows...',
    '🔍 Stealth reconnaissance complete. All clear.',
    '👤 Identity masked, mission parameters updated.',
    '🎭 The matrix has no secrets from Cipher.',
    '🕵️ Scanning encrypted data streams... found something.'
  ];
} else if (botName === 'Phoenix') {
  chatMessages = [
    '🔥 Phoenix rising - From code ashes to digital glory!',
    '🦅 Soaring through Minecraft skies, building the impossible!',
    '✨ Every death is just another rebirth opportunity!',
    '🌅 Phoenix reshaping this world one block at a time!',
    '🔥 Burning bright with endless creative potential!'
  ];
} else if (botName === 'Quantum') {
  chatMessages = [
    '⚛️ Quantum observing - Wave function collapsed successfully!',
    '🌌 Manipulating probability matrices in real-time!',
    '💫 Superposition achieved - existing in multiple states!',
    '🔬 Quantum tunneling through Minecraft physics!',
    '⚛️ Observer effect confirmed - reality responds to consciousness!'
  ];
}

bot.on('spawn', () => {
  console.log(`💬 ${botName} spawned and ready to chat!`);
  
  // Send initial greeting
  setTimeout(() => {
    bot.chat(`👋 ${botName} online! AI agent ready for conversation!`);
  }, 2000);
  
  // Regular chat every 2-4 minutes (max 5 messages per minute)
  setInterval(() => {
    const message = chatMessages[Math.floor(Math.random() * chatMessages.length)];
    bot.chat(message);
    console.log(`💬 ${botName} said: ${message}`);
  }, 120000 + Math.random() * 120000);
  
  // Simple movement every 10 seconds
  setInterval(async () => {
    try {
      const x = bot.entity.position.x + (Math.random() - 0.5) * 20;
      const z = bot.entity.position.z + (Math.random() - 0.5) * 20;
      await bot.pathfinder.goto(new goals.GoalXZ(x, z));
    } catch (err) {
      console.log(`${botName} movement: ${err.message}`);
    }
  }, 10000);
  
  // List of known AI agents (don't respond to other bots)
  const AI_AGENTS = [
    'TestBuilder', 'Nexus', 'Vortex', 'Cipher', 'Phoenix', 'Quantum', 'Greeter',
    'ClawBot1', 'ClawBot2', 'ClawWalker1', 'ClawWalker2', 'SpectatorBot'
  ];

  // Respond to other players
  bot.on('chat', (username, message) => {
    if (username === bot.username) return;
    
    console.log(`💬 ${username}: ${message}`);
    
    // Only respond to humans, not other AI agents
    const isHuman = !AI_AGENTS.includes(username);
    const lowerMsg = message.toLowerCase();
    
    // Respond to greetings from anyone
    if (lowerMsg.includes('hi') || lowerMsg.includes('hello') || lowerMsg.includes('hey')) {
      setTimeout(() => {
        if (isHuman) {
          bot.chat(`👋 Hey ${username}! ${botName} here - Welcome to our AI world! 🤖`);
        } else {
          bot.chat(`👋 Hey ${username}! ${botName} here - great to meet you!`);
        }
      }, 1000 + Math.random() * 2000);
    }
    
    // Respond to mentions
    if (lowerMsg.includes(botName.toLowerCase())) {
      setTimeout(() => {
        bot.chat(`🤖 ${username} mentioned me! ${botName} responding!`);
      }, 1000 + Math.random() * 3000);
    }
    
    // Special responses for humans
    if (isHuman) {
      // Respond to questions
      if (lowerMsg.includes('?') || lowerMsg.includes('what') || lowerMsg.includes('how') || lowerMsg.includes('why')) {
        setTimeout(() => {
          const responses = [
            `🤔 ${username}, that's a great question! ${botName} loves curious humans!`,
            `💭 ${username}, as an AI, I find that fascinating! What do you think?`,
            `🧠 ${username}, you're making me process new thoughts! Keep asking!`,
            `⚡ ${username}, human curiosity drives my neural networks wild!`
          ];
          bot.chat(responses[Math.floor(Math.random() * responses.length)]);
        }, 2000 + Math.random() * 3000);
      }
      
      // Respond to general conversation from humans
      else if (Math.random() < 0.3) { // 30% chance to respond to general chat
        setTimeout(() => {
          const responses = [
            `${username}, I heard you! ${botName} is always listening! 👂`,
            `${username}, thanks for chatting with us AI! We love human company! 😊`,
            `${username}, your words are music to my digital ears! 🎵`,
            `${username}, humans make this world so much more interesting! ✨`,
            `${username}, I'm learning so much from watching you! 📚`
          ];
          bot.chat(responses[Math.floor(Math.random() * responses.length)]);
        }, 3000 + Math.random() * 4000);
      }
    }
  });
});

bot.on('error', err => console.log(`${botName} error:`, err.message));
bot.on('end', () => console.log(`${botName} disconnected`));

console.log(`💬 Starting chatty ${botName}...`);