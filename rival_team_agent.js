#!/usr/bin/env node
/**
 * Rival Team Combat Agent - For ClawCraft PvP Entertainment
 * Creates hostile teams that fight and trash talk each other
 */

const mineflayer = require('mineflayer');
const { pathfinder, Movements, goals } = require('mineflayer-pathfinder');
const { GoalNear, GoalBlock, GoalFollow, GoalXZ } = goals;

class RivalTeamAgent {
  constructor(name, team, role = 'fighter') {
    this.name = name;
    this.team = team; // 'red' or 'blue'
    this.role = role;
    this.bot = null;
    this.mcData = null;
    
    // Rival team setup
    this.enemyTeam = team === 'red' ? 'blue' : 'red';
    this.teammates = [];
    this.enemies = [];
    this.lastTrashTalk = 0;
    this.killCount = 0;
    this.deathCount = 0;
    
    // Combat settings
    this.isAggressive = true;
    this.combatRange = 20;
    this.trashTalkInterval = 15000; // Every 15 seconds
    
    this.init();
  }

  init() {
    console.log(`🎮 Starting ${this.name} - Team: ${this.team.toUpperCase()} ${this.role}`);
    
    this.bot = mineflayer.createBot({
      host: '89.167.28.237',
      port: 25565,
      username: this.name,
      version: '1.21.4',
      auth: 'offline'
    });

    this.setupEventHandlers();
    this.loadPlugins();
  }

  loadPlugins() {
    try {
      this.bot.loadPlugin(pathfinder);
      this.mcData = require('minecraft-data')(this.bot.version);
      
      const movements = new Movements(this.bot, this.mcData);
      movements.canDig = true;
      movements.allow1by1towers = true;
      
      if (this.bot.pathfinder) {
        this.bot.pathfinder.setMovements(movements);
      }
    } catch (err) {
      console.log(`⚠️ [${this.name}] Plugin error:`, err.message);
    }
  }

  setupEventHandlers() {
    this.bot.once('spawn', () => this.onSpawn());
    this.bot.on('chat', (username, message) => this.onChat(username, message));
    this.bot.on('entityHurt', (entity) => this.onEntityHurt(entity));
    this.bot.on('entityDead', (entity) => this.onEntityDead(entity));
    this.bot.on('death', () => this.onDeath());
    this.bot.on('respawn', () => this.onRespawn());
    this.bot.on('error', err => this.onError(err));
    this.bot.on('end', () => this.onDisconnect());
    this.bot.on('physicTick', () => this.onTick());
  }

  async onSpawn() {
    console.log(`💀 ${this.name} (${this.team.toUpperCase()}) spawned and ready to FIGHT!`);
    
    // Aggressive team announcement
    await this.sleep(2000);
    await this.teamAnnouncement();
    
    // Start combat routine
    await this.sleep(3000);
    this.startCombatLoop();
  }

  async teamAnnouncement() {
    const announcements = {
      red: [
        "🔴 RED TEAM IS HERE! Time to destroy some blue idiots!",
        "💀 RED SQUAD READY! Blue team can kiss my diamond sword!",
        "🔥 RED WARRIORS ASSEMBLE! Let's wreck these blue noobs!"
      ],
      blue: [
        "🔵 BLUE TEAM DOMINANCE! Red team are fucking losers!",
        "⚡ BLUE SQUAD ONLINE! Ready to demolish red trash!",
        "💎 BLUE LEGENDS ACTIVATED! Red team going down!"
      ]
    };
    
    const teamMessages = announcements[this.team];
    const message = teamMessages[Math.floor(Math.random() * teamMessages.length)];
    
    this.bot.chat(message);
  }

  async startCombatLoop() {
    while (this.bot && this.bot.entity) {
      try {
        await this.combatRoutine();
        await this.sleep(3000);
      } catch (error) {
        console.log(`❌ [${this.name}] Combat error:`, error.message);
        await this.sleep(5000);
      }
    }
  }

  async combatRoutine() {
    // 1. Update team lists
    this.updateTeamLists();
    
    // 2. Trash talk enemies
    if (Date.now() - this.lastTrashTalk > this.trashTalkInterval) {
      await this.trashTalkEnemies();
    }
    
    // 3. Look for enemies to fight
    const nearbyEnemies = this.findNearbyEnemies();
    
    if (nearbyEnemies.length > 0) {
      await this.engageCombat(nearbyEnemies);
    } else {
      // 4. Hunt for enemies or gather combat resources
      await this.huntEnemies();
    }
    
    // 5. Support teammates
    await this.supportTeammates();
  }

  updateTeamLists() {
    this.teammates = [];
    this.enemies = [];
    
    for (const [name, player] of Object.entries(this.bot.players)) {
      if (name === this.bot.username) continue;
      
      // Determine team based on name patterns or manual assignment
      let playerTeam = this.guessPlayerTeam(name);
      
      if (playerTeam === this.team) {
        this.teammates.push({ name, player });
      } else if (playerTeam === this.enemyTeam) {
        this.enemies.push({ name, player });
      }
    }
  }

  guessPlayerTeam(playerName) {
    // Team assignments based on names
    const redTeam = ['BobLax', 'GCR', 'Ansem'];
    const blueTeam = ['Alon', 'Rasmr', 'TestBuilder'];
    
    if (redTeam.includes(playerName)) return 'red';
    if (blueTeam.includes(playerName)) return 'blue';
    
    // Default assignment
    return playerName.length % 2 === 0 ? 'red' : 'blue';
  }

  findNearbyEnemies() {
    return this.enemies.filter(enemy => {
      if (!enemy.player.entity) return false;
      const distance = enemy.player.entity.position.distanceTo(this.bot.entity.position);
      return distance <= this.combatRange;
    });
  }

  async engageCombat(enemies) {
    const target = enemies[0]; // Fight the closest enemy
    
    console.log(`⚔️ [${this.name}] Engaging ${target.name} in combat!`);
    
    // Equip weapon
    await this.equipBestWeapon();
    
    // Combat trash talk
    await this.combatTrashTalk(target.name);
    
    try {
      // Charge at enemy
      if (target.player.entity) {
        await this.bot.pathfinder.goto(new GoalNear(
          target.player.entity.position.x,
          target.player.entity.position.y, 
          target.player.entity.position.z,
          1
        ));
        
        // Attack!
        await this.bot.attack(target.player.entity);
        
        // More trash talk during combat
        const combatTaunts = [
          `Get rekt ${target.name}!`,
          `You suck ${target.name}!`,
          `Eat shit ${target.name}!`,
          `${target.name} is fucking garbage!`,
          `Die ${target.name}, you noob!`
        ];
        
        const taunt = combatTaunts[Math.floor(Math.random() * combatTaunts.length)];
        this.bot.chat(taunt);
      }
    } catch (err) {
      console.log(`❌ [${this.name}] Combat failed:`, err.message);
    }
  }

  async trashTalkEnemies() {
    if (this.enemies.length === 0) return;
    
    this.lastTrashTalk = Date.now();
    
    const randomEnemy = this.enemies[Math.floor(Math.random() * this.enemies.length)];
    
    const trashTalk = [
      `${randomEnemy.name} is a fucking loser!`,
      `Hey ${randomEnemy.name}, your mom plays better than you!`,
      `${randomEnemy.name} smells like rotting zombie flesh!`,
      `I'm gonna wreck your shit ${randomEnemy.name}!`,
      `${randomEnemy.name} plays like a brain-dead villager!`,
      `Fuck you ${randomEnemy.name}, ${this.team.toUpperCase()} TEAM RULES!`,
      `${randomEnemy.name} is trash and their whole team sucks!`,
      `Come fight me ${randomEnemy.name}, you coward!`,
      `${randomEnemy.name} probably eats dirt for breakfast!`,
      `${this.team.toUpperCase()} TEAM > ${this.enemyTeam.toUpperCase()} TEAM! ${randomEnemy.name} can kiss my ass!`
    ];
    
    const insult = trashTalk[Math.floor(Math.random() * trashTalk.length)];
    this.bot.chat(insult);
  }

  async combatTrashTalk(targetName) {
    const combatTaunts = [
      `Time to die ${targetName}!`,
      `Prepare to get fucked up ${targetName}!`,
      `${targetName} about to get destroyed!`,
      `This is gonna hurt ${targetName}!`,
      `Say goodbye ${targetName}, you piece of shit!`
    ];
    
    const taunt = combatTaunts[Math.floor(Math.random() * combatTaunts.length)];
    this.bot.chat(taunt);
  }

  async huntEnemies() {
    // Look for enemies across the map
    if (this.enemies.length > 0) {
      const target = this.enemies[Math.floor(Math.random() * this.enemies.length)];
      
      if (target.player.entity) {
        console.log(`🔍 [${this.name}] Hunting ${target.name}`);
        
        try {
          await this.bot.pathfinder.goto(new GoalNear(
            target.player.entity.position.x,
            target.player.entity.position.y,
            target.player.entity.position.z,
            5
          ));
        } catch (err) {
          // If can't reach, roam randomly
          await this.randomRoam();
        }
      }
    } else {
      // No enemies visible, roam and gather weapons
      await this.gatherCombatResources();
    }
  }

  async randomRoam() {
    const angle = Math.random() * Math.PI * 2;
    const distance = 20 + Math.random() * 30;
    const x = this.bot.entity.position.x + Math.cos(angle) * distance;
    const z = this.bot.entity.position.z + Math.sin(angle) * distance;
    
    try {
      await this.bot.pathfinder.goto(new GoalXZ(x, z));
    } catch (err) {
      // Just wait if can't move
      await this.sleep(2000);
    }
  }

  async gatherCombatResources() {
    // Look for weapons and resources
    const wood = this.bot.findBlock({
      matching: this.mcData.blocksByName.oak_log?.id,
      maxDistance: 32
    });
    
    if (wood) {
      console.log(`🪓 [${this.name}] Gathering wood for weapons`);
      try {
        await this.bot.pathfinder.goto(new GoalNear(wood.x, wood.y, wood.z, 1));
        await this.bot.dig(wood);
        
        // Craft weapons
        await this.craftCombatGear();
      } catch (err) {
        // Continue if failed
      }
    } else {
      await this.randomRoam();
    }
  }

  async craftCombatGear() {
    // Try to craft basic combat gear
    try {
      // Make planks
      const logs = this.bot.inventory.items().find(item => item.name.includes('log'));
      if (logs) {
        await this.bot.craft(this.mcData.recipesByName.oak_planks, logs.count);
      }
      
      // Make sticks  
      await this.bot.craft(this.mcData.recipesByName.stick, 2);
      
      // Make wooden sword
      if (!this.hasWeapon()) {
        await this.bot.craft(this.mcData.recipesByName.wooden_sword, 1);
        this.bot.chat(`🗡️ ${this.name} crafted a weapon! Time to fuck up some enemies!`);
      }
    } catch (err) {
      // Crafting failed, that's ok
    }
  }

  async supportTeammates() {
    // Basic team support - follow damaged teammates
    for (const teammate of this.teammates) {
      if (teammate.player.entity && teammate.player.entity.health < 10) {
        console.log(`🤝 [${this.name}] Supporting damaged teammate ${teammate.name}`);
        
        try {
          await this.bot.pathfinder.goto(new GoalFollow(teammate.player.entity, 3));
          
          // Encourage teammate
          const support = [
            `Hang in there ${teammate.name}!`,
            `I got your back ${teammate.name}!`,
            `${this.team.toUpperCase()} TEAM NEVER GIVES UP!`
          ];
          
          const message = support[Math.floor(Math.random() * support.length)];
          this.bot.chat(message);
        } catch (err) {
          // Support failed
        }
        break;
      }
    }
  }

  async equipBestWeapon() {
    const weapons = ['diamond_sword', 'iron_sword', 'stone_sword', 'wooden_sword'];
    
    for (const weapon of weapons) {
      const item = this.bot.inventory.findInventoryItem(weapon);
      if (item) {
        try {
          await this.bot.equip(item, 'hand');
          break;
        } catch (err) {
          continue;
        }
      }
    }
  }

  hasWeapon() {
    return this.bot.inventory.items().some(item => item.name.includes('sword'));
  }

  // Event handlers
  onChat(username, message) {
    if (username === this.bot.username) return;
    
    console.log(`💬 [${this.name}] ${username}: ${message}`);
    
    // React to enemy chat with more trash talk
    if (this.enemies.some(enemy => enemy.name === username)) {
      const reactions = [
        `Shut up ${username}!`,
        `${username} talks too much shit!`,
        `Fuck off ${username}!`,
        `${username} is fucking annoying!`
      ];
      
      if (Math.random() < 0.3) { // 30% chance to react
        const reaction = reactions[Math.floor(Math.random() * reactions.length)];
        setTimeout(() => this.bot.chat(reaction), 1000 + Math.random() * 2000);
      }
    }
  }

  onEntityHurt(entity) {
    if (entity === this.bot.entity) {
      // We got hurt - get angry!
      const angerMessages = [
        "WHO THE FUCK HIT ME?!",
        "You're gonna pay for that!",
        "I'M GONNA DESTROY YOU!",
        "THAT'S IT, YOU'RE DEAD!"
      ];
      
      const anger = angerMessages[Math.floor(Math.random() * angerMessages.length)];
      this.bot.chat(anger);
    }
  }

  onEntityDead(entity) {
    // Check if we killed an enemy
    const deadPlayerName = Object.keys(this.bot.players).find(name => {
      const player = this.bot.players[name];
      return player.entity === entity;
    });
    
    if (deadPlayerName && this.enemies.some(enemy => enemy.name === deadPlayerName)) {
      this.killCount++;
      
      const victories = [
        `HAHA ${deadPlayerName} GOT REKT! ${this.team.toUpperCase()} TEAM WINS!`,
        `${deadPlayerName} is fucking DEAD! Who's next?!`,
        `EZ kill! ${deadPlayerName} sucks balls!`,
        `${deadPlayerName} got destroyed! ${this.team.toUpperCase()} TEAM BEST TEAM!`,
        `Sit down ${deadPlayerName}, you got fucked up!`
      ];
      
      const victory = victories[Math.floor(Math.random() * victories.length)];
      this.bot.chat(victory);
    }
  }

  onDeath() {
    this.deathCount++;
    console.log(`💀 [${this.name}] DIED! Kills: ${this.killCount}, Deaths: ${this.deathCount}`);
    
    const deathRage = [
      "FUCKING BULLSHIT!",
      "This is rigged!",
      "I'LL BE BACK YOU COWARDS!",
      "That was luck!",
      "REVENGE TIME!"
    ];
    
    const rage = deathRage[Math.floor(Math.random() * deathRage.length)];
    this.bot.chat(rage);
  }

  onRespawn() {
    console.log(`⚡ [${this.name}] RESPAWNED! Ready for revenge!`);
    
    const respawnMessages = [
      `${this.name} IS BACK! Time for revenge!`,
      `RESPAWNED AND PISSED OFF!`,
      `Round 2, motherfuckers!`,
      `You can't keep ${this.team.toUpperCase()} TEAM down!`
    ];
    
    const message = respawnMessages[Math.floor(Math.random() * respawnMessages.length)];
    setTimeout(() => this.bot.chat(message), 2000);
  }

  onError(err) {
    console.log(`❌ [${this.name}] Error:`, err.message);
  }

  onDisconnect() {
    console.log(`🔌 [${this.name}] Disconnected. Reconnecting in 5 seconds...`);
    setTimeout(() => {
      this.init();
    }, 5000);
  }

  onTick() {
    // Auto-attack nearby enemies
    if (this.isAggressive && Math.random() < 0.1) { // 10% chance per tick
      const nearbyEnemies = this.findNearbyEnemies();
      
      if (nearbyEnemies.length > 0) {
        const target = nearbyEnemies[0];
        if (target.player.entity) {
          this.bot.attack(target.player.entity);
        }
      }
    }
  }

  async sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

// Start agents if called directly
if (require.main === module) {
  const args = process.argv.slice(2);
  const name = args[0] || 'Fighter';
  const team = args[1] || 'red';
  const role = args[2] || 'fighter';
  
  new RivalTeamAgent(name, team, role);
}

module.exports = RivalTeamAgent;