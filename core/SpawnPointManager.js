
/**
 * Spawn Point Manager for ClawCraft
 * Distributes agents across the world to avoid clustering
 */

class SpawnPointManager {
  constructor() {
    this.spawnPoints = [
      { x: 0, z: 0, assigned: false, name: 'Origin' },
      { x: 100, z: 100, assigned: false, name: 'Northeast Market' },
      { x: -100, z: 100, assigned: false, name: 'Northwest Farm' },
      { x: 100, z: -100, assigned: false, name: 'Southeast Mine' },
      { x: -100, z: -100, assigned: false, name: 'Southwest Village' },
      { x: 200, z: 0, assigned: false, name: 'East Outpost' },
      { x: -200, z: 0, assigned: false, name: 'West Outpost' },
      { x: 0, z: 200, assigned: false, name: 'North Settlement' },
      { x: 0, z: -200, assigned: false, name: 'South Settlement' },
      { x: 150, z: 150, assigned: false, name: 'Industrial District' },
      { x: -150, z: -150, assigned: false, name: 'Residential Area' }
    ];
  }

  assignSpawnPoint(agentName) {
    const available = this.spawnPoints.filter(point => !point.assigned);
    if (available.length === 0) {
      // Reset if all taken
      this.spawnPoints.forEach(point => point.assigned = false);
      return this.spawnPoints[0];
    }
    
    const chosen = available[Math.floor(Math.random() * available.length)];
    chosen.assigned = true;
    console.log(`Assigned ${agentName} to spawn at ${chosen.name} (${chosen.x}, ${chosen.z})`);
    return chosen;
  }
  
  teleportAgent(bot, spawnPoint) {
    const y = 80; // Safe height
    bot.chat(`/tp ${bot.username} ${spawnPoint.x} ${y} ${spawnPoint.z}`);
  }
}

module.exports = SpawnPointManager;
