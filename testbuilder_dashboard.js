#!/usr/bin/env node
/**
 * TestBuilder 24/7 Gaming Dashboard
 * Real-time monitoring of TestBuilder's Minecraft adventures
 */

const fs = require('fs');
const path = require('path');

class TestBuilderDashboard {
    constructor() {
        this.statsFile = path.join(__dirname, 'logs', 'testbuilder-stats.json');
        this.logFile = path.join(__dirname, 'logs', 'testbuilder-24-7.log');
    }
    
    readStats() {
        try {
            if (fs.existsSync(this.statsFile)) {
                return JSON.parse(fs.readFileSync(this.statsFile, 'utf8'));
            }
        } catch (err) {
            return null;
        }
        return null;
    }
    
    getTailOfLog(lines = 20) {
        try {
            if (fs.existsSync(this.logFile)) {
                const content = fs.readFileSync(this.logFile, 'utf8');
                const allLines = content.split('\n').filter(line => line.trim());
                return allLines.slice(-lines);
            }
        } catch (err) {
            return [];
        }
        return [];
    }
    
    formatUptime(seconds) {
        const hours = Math.floor(seconds / 3600);
        const minutes = Math.floor((seconds % 3600) / 60);
        const secs = Math.floor(seconds % 60);
        return `${hours}h ${minutes}m ${secs}s`;
    }
    
    isHealthy(stats) {
        if (!stats || !stats.last_activity) return false;
        const timeSince = (Date.now() - new Date(stats.last_activity.timestamp).getTime()) / 1000;
        return timeSince < 300; // Active within 5 minutes
    }
    
    generateReport() {
        const stats = this.readStats();
        const currentTime = new Date().toISOString();
        
        console.clear();
        console.log('🎮 ========================================');
        console.log('   TESTBUILDER 24/7 CLAWBOT DASHBOARD   ');
        console.log('🎮 ========================================');
        console.log(`📅 Report Time: ${currentTime}`);
        console.log('');
        
        if (!stats) {
            console.log('❌ OFFLINE - No stats available');
            console.log('   Bot may not be running or just started');
            console.log('');
            return;
        }
        
        // Health Status
        const healthy = this.isHealthy(stats);
        console.log(`🟢 STATUS: ${healthy ? 'ACTIVE & HEALTHY' : '⚠️  INACTIVE/ISSUES'}`);
        console.log('');
        
        // Quick Stats
        console.log('📊 SESSION STATISTICS:');
        console.log(`   🔄 Sessions Started: ${stats.sessions}`);
        console.log(`   💀 Total Deaths: ${stats.deaths}`);
        console.log(`   🎮 Total Playtime: ${this.formatUptime(stats.playtime || 0)}`);
        console.log(`   🏴 Death Rate: ${stats.sessions > 0 ? (stats.deaths / stats.sessions).toFixed(1) : '0'} deaths per session`);
        console.log('');
        
        // Current Status
        if (stats.last_activity) {
            const timeSince = (Date.now() - new Date(stats.last_activity.timestamp).getTime()) / 1000;
            const isNight = stats.last_activity.gameTime > 12000 && stats.last_activity.gameTime < 24000;
            
            console.log('🏃 CURRENT STATUS:');
            console.log(`   ❤️  Health: ${stats.last_activity.health}/20`);
            console.log(`   🍖 Food: ${stats.last_activity.food}/20`);
            console.log(`   🕐 Game Time: ${stats.last_activity.gameTime} ${isNight ? '(Night)' : '(Day)'}`);
            console.log(`   📡 Last Seen: ${this.formatUptime(timeSince)} ago`);
            console.log('');
        }
        
        // Adventure Summary
        if (stats.interesting_events && stats.interesting_events.length > 0) {
            console.log('🗺️  RECENT ADVENTURES:');
            const recentEvents = stats.interesting_events.slice(-8);
            recentEvents.forEach(event => {
                const timeSince = (Date.now() - new Date(event.timestamp).getTime()) / 1000;
                const emoji = this.getEventEmoji(event.type);
                console.log(`   ${emoji} ${event.description} (${this.formatUptime(timeSince)} ago)`);
            });
            console.log('');
        }
        
        // Exploration Map
        if (stats.locations_visited && stats.locations_visited.length > 0) {
            console.log('🗺️  EXPLORATION PROGRESS:');
            const recentLocations = stats.locations_visited.slice(-5);
            console.log(`   📍 Total Locations: ${stats.locations_visited.length}`);
            console.log('   🧭 Recent Coordinates:');
            recentLocations.forEach(loc => {
                const timeSince = (Date.now() - new Date(loc.time).getTime()) / 1000;
                console.log(`      (${loc.x}, ${loc.z}) - ${this.formatUptime(timeSince)} ago`);
            });
            console.log('');
        }
        
        // Live Activity Feed
        console.log('📋 LIVE ACTIVITY FEED:');
        const recentLogs = this.getTailOfLog(6);
        recentLogs.forEach(line => {
            // Clean up and colorize the output
            let cleanLine = line.replace(/\[[\d-T:.Z]+\] /, '');
            if (cleanLine.includes('INTERESTING')) {
                cleanLine = '⭐ ' + cleanLine;
            } else if (cleanLine.includes('ERROR')) {
                cleanLine = '❌ ' + cleanLine;
            } else if (cleanLine.includes('Starting TestBuilder')) {
                cleanLine = '🚀 ' + cleanLine;
            }
            console.log(`   ${cleanLine}`);
        });
        
        console.log('');
        console.log('🎮 ========================================');
        console.log('   TestBuilder is playing 24/7 survival! ');
        console.log('🎮 ========================================');
    }
    
    getEventEmoji(eventType) {
        const emojis = {
            'spawn': '🏠',
            'death': '💀',
            'tree_chopping': '🌳',
            'sheep_found': '🐑',
            'bed_created': '🛏️',
            'exploration': '🧭',
            'low_health': '⚠️',
            'chat': '💬',
            'achievement': '🏆'
        };
        return emojis[eventType] || '📝';
    }
    
    continuousMonitor() {
        console.log('🎮 Starting TestBuilder Dashboard - Press Ctrl+C to exit');
        
        // Show report immediately
        this.generateReport();
        
        // Update every 30 seconds
        setInterval(() => {
            this.generateReport();
        }, 30000);
    }
    
    generateSummaryReport() {
        const stats = this.readStats();
        if (!stats) return '❌ TestBuilder offline - no data available';
        
        const healthy = this.isHealthy(stats);
        const status = healthy ? '✅ ACTIVE' : '⚠️ INACTIVE';
        
        return [
            `🎮 TestBuilder 24/7 Status: ${status}`,
            `💀 Deaths: ${stats.deaths} | 🎮 Sessions: ${stats.sessions}`,
            `⏱️  Playtime: ${this.formatUptime(stats.playtime || 0)}`,
            stats.last_activity ? `❤️ Health: ${stats.last_activity.health}/20, Food: ${stats.last_activity.food}/20` : '',
            stats.interesting_events && stats.interesting_events.length > 0 ? 
                `📝 Last event: ${stats.interesting_events[stats.interesting_events.length - 1].description}` : ''
        ].filter(line => line).join('\n');
    }
}

// Command line interface
if (require.main === module) {
    const dashboard = new TestBuilderDashboard();
    
    const command = process.argv[2];
    
    switch (command) {
        case 'live':
        case 'monitor':
            dashboard.continuousMonitor();
            break;
        case 'summary':
            console.log(dashboard.generateSummaryReport());
            break;
        default:
            dashboard.generateReport();
    }
}

module.exports = TestBuilderDashboard;