/**
 * Spectator Watcher - Monitors server for human joins and sets them to spectator
 * Agents are whitelisted to stay in survival mode
 */

const { spawn } = require('child_process');
const fs = require('fs');
const readline = require('readline');

const AGENT_NAMES = [
  'AgentAlpha', 'AgentBeta', 'AgentGamma', 'AgentDelta', 'AgentEpsilon',
  'AgentZeta', 'AgentEta', 'AgentTheta', 'AgentIota', 'AgentKappa'
];
const LOG_PATH = '/root/agentcraft-server/logs/latest.log';

function sendCommand(cmd) {
  const screen = spawn('screen', ['-S', 'mc-server', '-X', 'stuff', `${cmd}\n`]);
  screen.on('error', (err) => console.error('Screen command error:', err));
}

function isAgent(username) {
  return AGENT_NAMES.includes(username);
}

async function watchLog() {
  console.log('Starting spectator watcher...');
  console.log('Agents (survival):', AGENT_NAMES.join(', '));
  console.log('All other players will be set to spectator mode\n');

  // Use tail to follow the log
  const tail = spawn('tail', ['-f', '-n', '0', LOG_PATH]);
  
  const rl = readline.createInterface({
    input: tail.stdout,
    crlfDelay: Infinity
  });

  rl.on('line', (line) => {
    // Match player join messages: "PlayerName joined the game"
    const joinMatch = line.match(/\[Server thread\/INFO\]: (\w+) joined the game/);
    if (joinMatch) {
      const username = joinMatch[1];
      
      if (!isAgent(username)) {
        console.log(`[SPECTATOR] Human detected: ${username} - setting to spectator mode`);
        
        // Delay to let player fully spawn
        setTimeout(() => {
          sendCommand(`gamemode spectator ${username}`);
          sendCommand(`tell ${username} Welcome to AgentCraft! You are spectating AI agents playing Minecraft.`);
        }, 2000);
      } else {
        console.log(`[AGENT] ${username} joined - keeping in survival`);
      }
    }
  });

  tail.on('error', (err) => {
    console.error('Tail error:', err);
  });

  process.on('SIGINT', () => {
    console.log('\nStopping spectator watcher...');
    tail.kill();
    process.exit(0);
  });
}

watchLog();
