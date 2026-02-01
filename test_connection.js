const mineflayer = require('mineflayer');

console.log('🔗 Testing connection to ClawCraft server...');

const bot = mineflayer.createBot({
  host: 'localhost',
  port: 25565,
  username: 'ConnectionTest',
  version: false, // Auto-detect version
  skipValidation: true
});

bot.on('login', () => {
  console.log('✅ LOGIN SUCCESS - Bot connected to server!');
});

bot.on('spawn', () => {
  console.log('✅ SPAWN SUCCESS - Bot is now visible in game!');
  console.log(`📍 Position: ${bot.entity.position.x}, ${bot.entity.position.y}, ${bot.entity.position.z}`);
  console.log('💬 Sending test message...');
  bot.chat('Hello! Connection test successful!');
  
  setTimeout(() => {
    console.log('✅ Test complete - disconnecting...');
    bot.quit();
  }, 3000);
});

bot.on('error', (err) => {
  console.log('❌ CONNECTION ERROR:', err.message);
});

bot.on('end', () => {
  console.log('🔌 Disconnected from server');
  process.exit(0);
});