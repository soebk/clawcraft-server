#!/usr/bin/env node
/**
 * TestBuilder 24/7 Monitor & Manager
 * Keeps TestBuilder alive and logs interesting events
 */

const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

class TestBuilderMonitor {
    constructor() {
        this.botProcess = null;
        this.restartCount = 0;
        this.startTime = new Date();
        this.logFile = path.join(__dirname, 'logs', 'testbuilder-24-7.log');
        this.statsFile = path.join(__dirname, 'logs', 'testbuilder-stats.json');
        
        // Ensure logs directory exists
        if (!fs.existsSync(path.dirname(this.logFile))) {
            fs.mkdirSync(path.dirname(this.logFile), { recursive: true });
        }
        
        this.stats = {
            sessions: 0,
            deaths: 0,
            playtime: 0,
            achievements: [],
            locations_visited: [],
            last_activity: null,
            interesting_events: []
        };
        
        this.loadStats();
        this.startBot();
        this.setupSignalHandlers();
    }
    
    log(message) {
        const timestamp = new Date().toISOString();
        const logMessage = `[${timestamp}] ${message}`;
        console.log(logMessage);
        
        // Write to log file
        fs.appendFileSync(this.logFile, logMessage + '\n');
    }
    
    loadStats() {
        try {
            if (fs.existsSync(this.statsFile)) {
                this.stats = JSON.parse(fs.readFileSync(this.statsFile, 'utf8'));
            }
        } catch (err) {
            this.log('Could not load stats, starting fresh');
        }
    }
    
    saveStats() {
        try {
            fs.writeFileSync(this.statsFile, JSON.stringify(this.stats, null, 2));
        } catch (err) {
            this.log('Failed to save stats: ' + err.message);
        }
    }
    
    startBot() {
        this.log('🚀 Starting TestBuilder...');
        
        this.botProcess = spawn('node', ['simple_testbuilder.js'], {
            cwd: __dirname,
            stdio: ['pipe', 'pipe', 'pipe'],
            detached: false
        });
        
        this.stats.sessions++;
        this.restartCount++;
        
        // Monitor stdout for interesting events
        this.botProcess.stdout.on('data', (data) => {
            const output = data.toString();
            this.processOutput(output);
        });
        
        // Monitor stderr
        this.botProcess.stderr.on('data', (data) => {
            const error = data.toString();
            this.log('❌ ERROR: ' + error);
        });
        
        // Handle bot exit
        this.botProcess.on('exit', (code, signal) => {
            this.log(`💀 TestBuilder exited (code: ${code}, signal: ${signal})`);
            this.stats.playtime += (Date.now() - this.startTime.getTime()) / 1000;
            this.saveStats();
            
            // Auto-restart after 10 seconds
            setTimeout(() => {
                if (this.shouldRestart()) {
                    this.startBot();
                }
            }, 10000);
        });
        
        // Handle unexpected errors
        this.botProcess.on('error', (err) => {
            this.log('🔥 Process error: ' + err.message);
        });
    }
    
    processOutput(output) {
        const lines = output.split('\n').filter(line => line.trim());
        
        for (const line of lines) {
            // Log all output
            this.log('🤖 ' + line);
            
            // Detect interesting events
            if (line.includes('Spawned in survival world')) {
                this.addInterestingEvent('spawn', 'TestBuilder spawned in the world');
            }
            
            if (line.includes('Died!')) {
                this.stats.deaths++;
                const deathMatch = line.match(/Death #(\d+)/);
                if (deathMatch) {
                    this.addInterestingEvent('death', `TestBuilder died (total deaths: ${this.stats.deaths})`);
                }
            }
            
            if (line.includes('Found tree')) {
                this.addInterestingEvent('tree_chopping', 'Started chopping trees');
            }
            
            if (line.includes('Found sheep')) {
                this.addInterestingEvent('sheep_found', 'Found sheep for wool');
            }
            
            if (line.includes('Bed placed')) {
                this.addInterestingEvent('bed_created', 'Successfully made and placed a bed');
            }
            
            if (line.includes('Exploring towards')) {
                const coordMatch = line.match(/\((-?\d+), (-?\d+)\)/);
                if (coordMatch) {
                    const x = coordMatch[1], z = coordMatch[2];
                    this.addInterestingEvent('exploration', `Exploring towards coordinates (${x}, ${z})`);
                    this.stats.locations_visited.push({x, z, time: new Date().toISOString()});
                }
            }
            
            if (line.includes('Health:')) {
                const healthMatch = line.match(/Health: (\d+)\/20/);
                const foodMatch = line.match(/Food: (\d+)\/20/);
                const timeMatch = line.match(/Time: (\d+)/);
                
                if (healthMatch && foodMatch && timeMatch) {
                    const health = parseInt(healthMatch[1]);
                    const food = parseInt(foodMatch[1]);
                    const gameTime = parseInt(timeMatch[1]);
                    
                    this.stats.last_activity = {
                        health,
                        food,
                        gameTime,
                        timestamp: new Date().toISOString()
                    };
                    
                    // Alert on low health
                    if (health < 5) {
                        this.addInterestingEvent('low_health', `TestBuilder has low health: ${health}/20`);
                    }
                }
            }
            
            if (line.includes('chat')) {
                this.addInterestingEvent('chat', 'Player chat detected: ' + line);
            }
        }
        
        // Save stats periodically
        if (Math.random() < 0.1) { // 10% chance
            this.saveStats();
        }
    }
    
    addInterestingEvent(type, description) {
        const event = {
            type,
            description,
            timestamp: new Date().toISOString()
        };
        
        this.stats.interesting_events.push(event);
        
        // Keep only last 100 events
        if (this.stats.interesting_events.length > 100) {
            this.stats.interesting_events = this.stats.interesting_events.slice(-100);
        }
        
        this.log(`📝 INTERESTING: ${type.toUpperCase()} - ${description}`);
    }
    
    shouldRestart() {
        // Always restart unless manually stopped
        return this.restartCount < 1000; // Safety limit
    }
    
    printStatus() {
        this.log('=== TestBuilder 24/7 Status ===');
        this.log(`Running since: ${this.startTime.toISOString()}`);
        this.log(`Sessions: ${this.stats.sessions}`);
        this.log(`Deaths: ${this.stats.deaths}`);
        this.log(`Restarts: ${this.restartCount}`);
        this.log(`Total playtime: ${Math.floor(this.stats.playtime / 3600)}h ${Math.floor((this.stats.playtime % 3600) / 60)}m`);
        
        if (this.stats.last_activity) {
            this.log(`Last activity: Health ${this.stats.last_activity.health}/20, Food ${this.stats.last_activity.food}/20`);
        }
        
        this.log(`Recent events: ${this.stats.interesting_events.slice(-3).map(e => e.type).join(', ')}`);
        this.log('===============================');
    }
    
    setupSignalHandlers() {
        // Status check every 5 minutes
        setInterval(() => {
            this.printStatus();
            this.saveStats();
        }, 5 * 60 * 1000);
        
        // Graceful shutdown
        process.on('SIGINT', () => {
            this.log('🛑 Shutting down TestBuilder monitor...');
            if (this.botProcess) {
                this.botProcess.kill();
            }
            this.saveStats();
            process.exit(0);
        });
        
        process.on('SIGTERM', () => {
            this.log('🛑 Terminating TestBuilder monitor...');
            if (this.botProcess) {
                this.botProcess.kill();
            }
            this.saveStats();
            process.exit(0);
        });
    }
    
    // API methods for external monitoring
    getStats() {
        return {
            ...this.stats,
            uptime: Date.now() - this.startTime.getTime(),
            isRunning: this.botProcess && !this.botProcess.killed,
            restartCount: this.restartCount
        };
    }
    
    restartBot() {
        this.log('🔄 Manual restart requested');
        if (this.botProcess) {
            this.botProcess.kill();
        }
        // startBot will be called automatically via exit handler
    }
}

// Start the monitor
console.log('🎮 Starting TestBuilder 24/7 ClawBot Monitor...');
const monitor = new TestBuilderMonitor();

// Export for external access
module.exports = TestBuilderMonitor;

// Keep process alive
setInterval(() => {
    // Heartbeat - just prevent exit
}, 60000);