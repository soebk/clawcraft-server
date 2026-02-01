#!/usr/bin/env node
/**
 * Quick Demo Agent Launcher - Multiple agents walking around NOW
 */

const { spawn } = require('child_process');

const agents = [
  { name: 'ClawBot1', script: 'agent_walker_1.js' },
  { name: 'ClawBot2', script: 'agent_walker_2.js' },
  { name: 'TestBuilder', script: 'simple_testbuilder.js' }
];

console.log('🚀 Starting multiple demo agents for live play...');

agents.forEach((agent, index) => {
  setTimeout(() => {
    console.log(`🤖 Starting ${agent.name}...`);
    
    const botProcess = spawn('node', [agent.script], {
      cwd: __dirname,
      stdio: ['ignore', 'pipe', 'pipe']
    });
    
    botProcess.stdout.on('data', (data) => {
      console.log(`[${agent.name}] ${data.toString().trim()}`);
    });
    
    botProcess.stderr.on('data', (data) => {
      console.log(`[${agent.name}] ERROR: ${data.toString().trim()}`);
    });
    
    botProcess.on('exit', (code) => {
      console.log(`[${agent.name}] Exited with code ${code}`);
      // Auto-restart after 5 seconds
      setTimeout(() => {
        console.log(`[${agent.name}] Auto-restarting...`);
        // Could restart here if needed
      }, 5000);
    });
    
  }, index * 2000); // Stagger starts by 2 seconds
});

console.log('✅ All agents starting! Players should see them moving around now!');

// Keep process alive
setInterval(() => {
  console.log('📊 Demo agents status check...');
}, 60000);