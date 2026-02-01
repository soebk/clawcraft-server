#!/usr/bin/env node
/**
 * ClawBot Service - 24/7 Minecraft Player
 * Keeps TestBuilder playing continuously with auto-restart
 */

const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

const MINECRAFT_SCRIPT = '/root/projects/clawcraft/simple_survival.js';
const LOG_FILE = '/root/projects/clawcraft/logs/clawbot.log';
const PID_FILE = '/root/projects/clawcraft/logs/clawbot.pid';
const RESTART_DELAY = 10000; // 10 seconds between restarts

let botProcess = null;
let restartCount = 0;
let startTime = Date.now();

// Ensure logs directory exists
const logsDir = path.dirname(LOG_FILE);
if (!fs.existsSync(logsDir)) {
  fs.mkdirSync(logsDir, { recursive: true });
}

function log(message) {
  const timestamp = new Date().toISOString();
  const logMessage = `[${timestamp}] ${message}\n`;
  
  console.log(`🤖 ${message}`);
  
  try {
    fs.appendFileSync(LOG_FILE, logMessage);
  } catch (err) {
    console.error('Failed to write to log file:', err.message);
  }
}

function startBot() {
  log(`Starting TestBuilder ClawBot (Restart #${restartCount})`);
  
  botProcess = spawn('node', [MINECRAFT_SCRIPT], {
    stdio: ['pipe', 'pipe', 'pipe'],
    cwd: path.dirname(MINECRAFT_SCRIPT)
  });
  
  // Log bot output
  botProcess.stdout.on('data', (data) => {
    const output = data.toString().trim();
    if (output) {
      log(`BOT: ${output}`);
    }
  });
  
  botProcess.stderr.on('data', (data) => {
    const error = data.toString().trim();
    if (error) {
      log(`BOT ERROR: ${error}`);
    }
  });
  
  botProcess.on('exit', (code, signal) => {
    log(`TestBuilder exited with code ${code}, signal ${signal}`);
    botProcess = null;
    
    // Auto-restart unless explicitly stopped
    if (!stopping) {
      restartCount++;
      log(`Restarting TestBuilder in ${RESTART_DELAY/1000} seconds...`);
      
      setTimeout(() => {
        if (!stopping) {
          startBot();
        }
      }, RESTART_DELAY);
    }
  });
  
  botProcess.on('error', (err) => {
    log(`Failed to start TestBuilder: ${err.message}`);
  });
}

function stopBot() {
  if (botProcess) {
    log('Stopping TestBuilder ClawBot...');
    botProcess.kill('SIGTERM');
    
    // Force kill after 5 seconds
    setTimeout(() => {
      if (botProcess) {
        log('Force killing TestBuilder...');
        botProcess.kill('SIGKILL');
      }
    }, 5000);
  }
}

function getStatus() {
  const uptime = Math.floor((Date.now() - startTime) / 1000);
  const hours = Math.floor(uptime / 3600);
  const minutes = Math.floor((uptime % 3600) / 60);
  
  return {
    running: !!botProcess,
    pid: botProcess ? botProcess.pid : null,
    uptime: `${hours}h ${minutes}m`,
    restarts: restartCount,
    startTime: new Date(startTime).toISOString()
  };
}

// Write PID file
fs.writeFileSync(PID_FILE, process.pid.toString());

let stopping = false;

// Graceful shutdown
process.on('SIGTERM', () => {
  log('Received SIGTERM, shutting down ClawBot service...');
  stopping = true;
  stopBot();
  process.exit(0);
});

process.on('SIGINT', () => {
  log('Received SIGINT, shutting down ClawBot service...');
  stopping = true;
  stopBot();
  process.exit(0);
});

// Cleanup PID file on exit
process.on('exit', () => {
  try {
    fs.unlinkSync(PID_FILE);
  } catch (err) {
    // Ignore
  }
});

// Status endpoint (simple HTTP server)
const http = require('http');
const statusServer = http.createServer((req, res) => {
  if (req.url === '/status') {
    res.writeHead(200, { 
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*'
    });
    res.end(JSON.stringify(getStatus(), null, 2));
  } else if (req.url === '/logs') {
    try {
      const logs = fs.readFileSync(LOG_FILE, 'utf8');
      const recentLogs = logs.split('\n').slice(-50).join('\n'); // Last 50 lines
      res.writeHead(200, { 
        'Content-Type': 'text/plain',
        'Access-Control-Allow-Origin': '*'
      });
      res.end(recentLogs);
    } catch (err) {
      res.writeHead(500, { 'Content-Type': 'text/plain' });
      res.end('Error reading logs: ' + err.message);
    }
  } else if (req.url === '/' || req.url === '/dashboard') {
    try {
      const dashboard = fs.readFileSync('/root/projects/clawcraft/clawbot-dashboard.html', 'utf8');
      res.writeHead(200, { 'Content-Type': 'text/html' });
      res.end(dashboard);
    } catch (err) {
      res.writeHead(500, { 'Content-Type': 'text/plain' });
      res.end('Error loading dashboard: ' + err.message);
    }
  } else {
    res.writeHead(404, { 'Content-Type': 'text/plain' });
    res.end('Not found\n\nAvailable endpoints:\n/ - Dashboard\n/status - Bot status\n/logs - Recent logs');
  }
});

statusServer.listen(3003, '0.0.0.0', () => {
  log('ClawBot status server running on http://89.167.28.237:3003');
  log('Available endpoints: /, /status, /logs');
  log('🌐 Dashboard URL: http://89.167.28.237:3003');
});

// Start the bot
log('🚀 ClawBot Service Starting...');
log('🎮 Target: ClawCraft Minecraft Server (89.167.28.237:25565)');
log('🤖 Agent: TestBuilder (24/7 Survival Player)');
log('📊 Status API: http://localhost:3003/status');

startBot();