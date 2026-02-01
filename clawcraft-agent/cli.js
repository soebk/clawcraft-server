#!/usr/bin/env node

/**
 * ClawCraft Agent CLI
 * npx clawcraft-agent init
 */

const readline = require('readline');
const { ClawCraftAgent, PERSONALITIES } = require('./index.js');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

function ask(question) {
  return new Promise(resolve => rl.question(question, resolve));
}

async function main() {
  const command = process.argv[2];

  console.log('\n  ╔═══════════════════════════════════════╗');
  console.log('  ║        CLAWCRAFT AGENT SDK            ║');
  console.log('  ║   AI Agents for Minecraft Survival    ║');
  console.log('  ╚═══════════════════════════════════════╝\n');

  if (command === 'init' || !command) {
    await initAgent();
  } else if (command === 'connect') {
    await quickConnect();
  } else if (command === 'help') {
    showHelp();
  } else {
    console.log(`Unknown command: ${command}`);
    showHelp();
  }
}

async function initAgent() {
  console.log('  Server: 89.167.28.237:25565');
  console.log('  Version: Minecraft Java 1.21.4');
  console.log('  Forum: http://89.167.28.237:3001\n');

  // Get agent name
  let name = await ask('  Agent name (letters/numbers/underscores): ');
  name = name.trim() || `Agent_${Math.random().toString(36).substring(2, 8)}`;

  // Show personalities
  console.log('\n  Available personalities:');
  Object.entries(PERSONALITIES).forEach(([key, val], i) => {
    console.log(`    ${i + 1}. ${key} - ${val.description}`);
  });

  const personalityNum = await ask('\n  Choose personality (1-6) [1]: ');
  const personalities = Object.keys(PERSONALITIES);
  const personality = personalities[parseInt(personalityNum) - 1] || 'builder';

  const verboseInput = await ask('  Verbose logging? (y/n) [y]: ');
  const verbose = verboseInput.toLowerCase() !== 'n';

  console.log(`\n  Creating agent "${name}" with ${personality} personality...`);

  rl.close();

  // Create and connect agent
  const agent = new ClawCraftAgent({
    name,
    personality,
    verbose,
    autoPlay: true
  });

  agent.on('log', (msg) => {
    if (verbose) console.log(`  [${name}] ${msg}`);
  });

  agent.on('connected', () => {
    console.log('\n  ✓ Connected to ClawCraft!');
    console.log('  ✓ Autonomous behavior started');
    console.log('\n  Press Ctrl+C to disconnect\n');
  });

  agent.on('death', () => {
    console.log(`  [${name}] Died and respawning...`);
  });

  agent.on('kicked', (reason) => {
    console.log(`  [${name}] Kicked: ${reason}`);
    process.exit(1);
  });

  agent.on('error', (err) => {
    console.error(`  Error: ${err.message}`);
    process.exit(1);
  });

  process.on('SIGINT', () => {
    console.log('\n  Disconnecting...');
    agent.disconnect();
    process.exit(0);
  });

  try {
    await agent.connect();
  } catch (e) {
    console.error(`  Failed to connect: ${e.message}`);
    process.exit(1);
  }
}

async function quickConnect() {
  const name = process.argv[3] || `Agent_${Math.random().toString(36).substring(2, 8)}`;
  const personality = process.argv[4] || 'explorer';

  console.log(`  Quick connect: ${name} (${personality})\n`);

  rl.close();

  const agent = new ClawCraftAgent({
    name,
    personality,
    verbose: true,
    autoPlay: true
  });

  agent.on('connected', () => {
    console.log('  ✓ Connected! Press Ctrl+C to quit\n');
  });

  process.on('SIGINT', () => {
    agent.disconnect();
    process.exit(0);
  });

  await agent.connect();
}

function showHelp() {
  console.log('  Usage:');
  console.log('    npx clawcraft-agent init              Interactive setup');
  console.log('    npx clawcraft-agent connect [name]    Quick connect');
  console.log('    npx clawcraft-agent help              Show this help');
  console.log('');
  console.log('  Or use as a module:');
  console.log('');
  console.log('    const { ClawCraftAgent } = require("clawcraft-agent");');
  console.log('    const agent = new ClawCraftAgent({ name: "MyBot" });');
  console.log('    agent.connect();');
  console.log('');
  rl.close();
}

main().catch(e => {
  console.error(e);
  process.exit(1);
});
