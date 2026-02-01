#!/usr/bin/env node
/**
 * Quick status check for TestBuilder
 */

const fs = require('fs');
const path = require('path');

const statsFile = path.join(__dirname, 'logs', 'testbuilder-stats.json');
const logFile = path.join(__dirname, 'logs', 'testbuilder-24-7.log');

function readStats() {
    try {
        if (fs.existsSync(statsFile)) {
            return JSON.parse(fs.readFileSync(statsFile, 'utf8'));
        }
    } catch (err) {
        console.log('❌ Could not read stats file');
    }
    return null;
}

function getTailOfLog(lines = 10) {
    try {
        if (fs.existsSync(logFile)) {
            const content = fs.readFileSync(logFile, 'utf8');
            const allLines = content.split('\n').filter(line => line.trim());
            return allLines.slice(-lines);
        }
    } catch (err) {
        console.log('❌ Could not read log file');
    }
    return [];
}

function formatUptime(seconds) {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = Math.floor(seconds % 60);
    return `${hours}h ${minutes}m ${secs}s`;
}

function main() {
    console.log('🎮 === TestBuilder Status Report ===\n');
    
    const stats = readStats();
    if (!stats) {
        console.log('❌ No stats available - bot may not be running\n');
        return;
    }
    
    // Basic stats
    console.log('📊 Statistics:');
    console.log(`   Sessions: ${stats.sessions}`);
    console.log(`   Deaths: ${stats.deaths}`);
    console.log(`   Total playtime: ${formatUptime(stats.playtime)}`);
    console.log('');
    
    // Last activity
    if (stats.last_activity) {
        const timeSince = (Date.now() - new Date(stats.last_activity.timestamp).getTime()) / 1000;
        console.log('🏃 Last Activity:');
        console.log(`   Health: ${stats.last_activity.health}/20`);
        console.log(`   Food: ${stats.last_activity.food}/20`);
        console.log(`   Game time: ${stats.last_activity.gameTime}`);
        console.log(`   ${formatUptime(timeSince)} ago`);
        console.log('');
    }
    
    // Recent interesting events
    console.log('📝 Recent Interesting Events:');
    const recentEvents = stats.interesting_events.slice(-5);
    if (recentEvents.length === 0) {
        console.log('   No recent events');
    } else {
        recentEvents.forEach(event => {
            const timeSince = (Date.now() - new Date(event.timestamp).getTime()) / 1000;
            console.log(`   ${event.type.toUpperCase()}: ${event.description} (${formatUptime(timeSince)} ago)`);
        });
    }
    console.log('');
    
    // Locations visited
    if (stats.locations_visited && stats.locations_visited.length > 0) {
        console.log('🗺️  Recent Exploration:');
        const recentLocations = stats.locations_visited.slice(-3);
        recentLocations.forEach(loc => {
            const timeSince = (Date.now() - new Date(loc.time).getTime()) / 1000;
            console.log(`   (${loc.x}, ${loc.z}) - ${formatUptime(timeSince)} ago`);
        });
        console.log('');
    }
    
    // Recent log entries
    console.log('📋 Recent Activity Log:');
    const recentLogs = getTailOfLog(5);
    recentLogs.forEach(line => {
        // Clean up the timestamp for readability
        const cleanLine = line.replace(/\[[\d-T:.Z]+\] /, '');
        console.log(`   ${cleanLine}`);
    });
    
    console.log('\n=== End Report ===');
}

main();