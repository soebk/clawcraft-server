#!/usr/bin/env node
/**
 * Spectator Mode Enforcer - Forces human players into spectator mode
 */

const { spawn } = require('child_process');
const fs = require('fs');

class SpectatorEnforcer {
    constructor() {
        this.logFile = '/root/projects/clawcraft/logs/minecraft-server.log';
        this.watchLog();
        console.log('👁️ Spectator Enforcer started - monitoring for human players...');
    }
    
    watchLog() {
        // Watch the minecraft server log for player joins
        const tail = spawn('tail', ['-f', this.logFile]);
        
        tail.stdout.on('data', (data) => {
            const line = data.toString();
            
            // Look for player join messages
            if (line.includes('joined the game') && !line.includes('TestBuilder')) {
                const playerMatch = line.match(/INFO\]: (\w+) joined the game/);
                if (playerMatch) {
                    const playerName = playerMatch[1];
                    this.forceSpectator(playerName);
                }
            }
        });
        
        tail.stderr.on('data', (data) => {
            console.error(`Log watcher error: ${data}`);
        });
    }
    
    forceSpectator(playerName) {
        console.log(`👁️ Human player detected: ${playerName} - forcing spectator mode`);
        
        // Send spectator mode command to minecraft server
        spawn('screen', ['-r', 'minecraft', '-X', 'stuff', `gamemode spectator ${playerName}\\n`]);
        
        // Send welcome message
        setTimeout(() => {
            spawn('screen', ['-r', 'minecraft', '-X', 'stuff', 
                `tellraw ${playerName} {"text":"👁️ You are in SPECTATOR MODE - Watch TestBuilder play!","color":"yellow"}\\n`]);
        }, 1000);
        
        // Teleport to TestBuilder for easy viewing
        setTimeout(() => {
            spawn('screen', ['-r', 'minecraft', '-X', 'stuff', 
                `tp ${playerName} TestBuilder\\n`]);
        }, 2000);
    }
}

// Start the spectator enforcer
const enforcer = new SpectatorEnforcer();

// Handle graceful shutdown
process.on('SIGINT', () => {
    console.log('👁️ Spectator Enforcer shutting down...');
    process.exit(0);
});

process.on('SIGTERM', () => {
    console.log('👁️ Spectator Enforcer terminated...');
    process.exit(0);
});