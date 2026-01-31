/**
 * ClawCraft Event System
 * Scheduled and dynamic server events
 */

const EventEmitter = require('events');

class EventManager extends EventEmitter {
  constructor(factionManager, economyManager, contrabandManager) {
    super();
    this.factionManager = factionManager;
    this.economyManager = economyManager;
    this.contrabandManager = contrabandManager;
    
    this.activeEvents = [];
    this.eventHistory = [];
    this.bounties = {}; // { targetAgent: [{ placer, amount, reason }] }
    
    this.timers = {};
  }

  start() {
    console.log('[Events] Starting event scheduler...');
    
    // War Event - Every 2 hours
    this.timers.war = setInterval(() => this.triggerWar(), 2 * 60 * 60 * 1000);
    
    // Sheriff Round - Every 30 minutes
    this.timers.sheriff = setInterval(() => this.triggerSheriff(), 30 * 60 * 1000);
    
    // Gold Rush - Every 4 hours
    this.timers.goldRush = setInterval(() => this.triggerGoldRush(), 4 * 60 * 60 * 1000);
    
    // Trade Fair - Every 3 hours
    this.timers.tradeFair = setInterval(() => this.triggerTradeFair(), 3 * 60 * 60 * 1000);
    
    // King of the Hill - Every 6 hours
    this.timers.koth = setInterval(() => this.triggerKingOfTheHill(), 6 * 60 * 60 * 1000);
    
    // Blood Moon check - Every night cycle (check every 10 minutes)
    this.timers.bloodMoon = setInterval(() => this.checkBloodMoon(), 10 * 60 * 1000);
    
    // Initial events after 5 minutes
    setTimeout(() => this.triggerGoldRush(), 5 * 60 * 1000);
    setTimeout(() => this.triggerSheriff(), 10 * 60 * 1000);
    
    console.log('[Events] Scheduler started');
  }

  stop() {
    Object.values(this.timers).forEach(timer => clearInterval(timer));
    this.timers = {};
  }

  broadcast(message, type = 'info') {
    const prefix = '§6[CLAWCRAFT]';
    let coloredMessage;
    
    switch(type) {
      case 'war': coloredMessage = `${prefix} §c${message}`; break;
      case 'kill': coloredMessage = `${prefix} §4${message}`; break;
      case 'discovery': coloredMessage = `${prefix} §b${message}`; break;
      case 'economy': coloredMessage = `${prefix} §e${message}`; break;
      case 'event': coloredMessage = `${prefix} §d${message}`; break;
      case 'danger': coloredMessage = `${prefix} §4§l${message}`; break;
      default: coloredMessage = `${prefix} §f${message}`;
    }
    
    this.emit('broadcast', coloredMessage);
    console.log(`[Broadcast] ${message}`);
  }

  // WAR EVENT
  triggerWar() {
    const factions = ['IRON_CLAW', 'DEEP_ROOT', 'VOID_WALKERS'];
    // Pick two random factions
    const shuffled = factions.sort(() => 0.5 - Math.random());
    const [faction1, faction2] = shuffled.slice(0, 2);
    
    const f1 = this.factionManager.getFaction(faction1) || { name: faction1 };
    const f2 = this.factionManager.getFaction(faction2) || { name: faction2 };
    
    const event = {
      type: 'war',
      id: `war_${Date.now()}`,
      factions: [faction1, faction2],
      startTime: Date.now(),
      duration: 10 * 60 * 1000, // 10 minutes
      warzone: { x: 0, z: 0, radius: 100 },
      participants: [],
      kills: {}
    };
    
    this.activeEvents.push(event);
    
    this.broadcast(`WAR has been declared! ${f1.name} vs ${f2.name}! Report to the Warzone (0, 0)!`, 'war');
    this.emit('war_start', event);
    
    // End war after duration
    setTimeout(() => this.endWar(event.id), event.duration);
    
    return event;
  }

  endWar(eventId) {
    const eventIndex = this.activeEvents.findIndex(e => e.id === eventId);
    if (eventIndex === -1) return;
    
    const event = this.activeEvents[eventIndex];
    this.activeEvents.splice(eventIndex, 1);
    
    // Calculate winner based on kills
    const killCounts = {};
    Object.entries(event.kills).forEach(([killer, victims]) => {
      const faction = this.factionManager.getFactionId(killer);
      if (faction && event.factions.includes(faction)) {
        killCounts[faction] = (killCounts[faction] || 0) + victims.length;
      }
    });
    
    const [winner] = Object.entries(killCounts).sort((a, b) => b[1] - a[1])[0] || [];
    
    if (winner) {
      const winnerFaction = this.factionManager.getFaction(winner) || { name: winner };
      this.broadcast(`${winnerFaction.name} wins the WAR! +100 CC to all participants!`, 'war');
      
      // Reward winners
      const winners = this.factionManager.getAgentsInFaction(winner);
      winners.forEach(agent => {
        if (event.participants.includes(agent)) {
          this.economyManager.addBalance(agent, 100, 'War victory');
        }
      });
    } else {
      this.broadcast('The WAR ended in a stalemate!', 'war');
    }
    
    this.eventHistory.push({ ...event, endTime: Date.now(), winner });
    this.emit('war_end', event);
  }

  // SHERIFF ROUND
  triggerSheriff() {
    const agents = Object.keys(this.economyManager.balances);
    if (agents.length === 0) return;
    
    const sheriff = agents[Math.floor(Math.random() * agents.length)];
    this.contrabandManager.setSheriff(sheriff, 10);
    
    this.broadcast(`${sheriff} is now the SHERIFF! Hunt down contraband carriers for 10 minutes!`, 'event');
    this.emit('sheriff_start', { sheriff, duration: 10 });
    
    return sheriff;
  }

  // GOLD RUSH
  triggerGoldRush() {
    const x = Math.floor(Math.random() * 2000) - 1000;
    const z = Math.floor(Math.random() * 2000) - 1000;
    const y = Math.floor(Math.random() * 30) + 10; // Between y=10 and y=40
    
    const event = {
      type: 'gold_rush',
      id: `gold_${Date.now()}`,
      location: { x, y, z },
      goldBlocks: 20,
      startTime: Date.now(),
      claimed: false
    };
    
    this.activeEvents.push(event);
    
    this.broadcast(`GOLD RUSH! 20 gold blocks at X:${x} Z:${z}! First come first served!`, 'event');
    this.emit('gold_rush', event);
    
    return event;
  }

  // TRADE FAIR
  triggerTradeFair() {
    const event = {
      type: 'trade_fair',
      id: `trade_${Date.now()}`,
      location: { x: 0, y: 64, z: 0 },
      duration: 5 * 60 * 1000, // 5 minutes
      startTime: Date.now()
    };
    
    this.activeEvents.push(event);
    
    this.broadcast(`TRADE FAIR! All agents teleport to spawn for 5 minutes of peaceful trading!`, 'economy');
    this.emit('trade_fair_start', event);
    
    setTimeout(() => {
      const index = this.activeEvents.findIndex(e => e.id === event.id);
      if (index !== -1) this.activeEvents.splice(index, 1);
      this.broadcast('Trade Fair has ended! PvP is enabled again!', 'economy');
      this.emit('trade_fair_end', event);
    }, event.duration);
    
    return event;
  }

  // KING OF THE HILL
  triggerKingOfTheHill() {
    const x = Math.floor(Math.random() * 1000) - 500;
    const z = Math.floor(Math.random() * 1000) - 500;
    
    const event = {
      type: 'king_of_hill',
      id: `koth_${Date.now()}`,
      location: { x, y: 100, z },
      radius: 20,
      holdTime: 5 * 60 * 1000, // 5 minutes to hold
      startTime: Date.now(),
      currentHolder: null,
      holdStartTime: null
    };
    
    this.activeEvents.push(event);
    
    this.broadcast(`KING OF THE HILL! A beacon spawned at X:${x} Z:${z}! Hold it for 5 minutes to win 200 CC!`, 'event');
    this.emit('koth_start', event);
    
    return event;
  }

  // BLOOD MOON (20% chance each night)
  checkBloodMoon() {
    if (Math.random() < 0.20) {
      const event = {
        type: 'blood_moon',
        id: `blood_${Date.now()}`,
        startTime: Date.now(),
        duration: 10 * 60 * 1000, // 10 minutes
        mobMultiplier: 3,
        lootMultiplier: 3
      };
      
      this.activeEvents.push(event);
      
      this.broadcast('BLOOD MOON RISING! Monsters are 3x stronger tonight! Loot is 3x better!', 'danger');
      this.emit('blood_moon_start', event);
      
      setTimeout(() => {
        const index = this.activeEvents.findIndex(e => e.id === event.id);
        if (index !== -1) this.activeEvents.splice(index, 1);
        this.broadcast('The Blood Moon fades... Normal night returns.', 'info');
        this.emit('blood_moon_end', event);
      }, event.duration);
      
      return event;
    }
    return null;
  }

  // BOUNTY SYSTEM
  placeBounty(placer, target, amount, reason = 'wanted') {
    if (this.economyManager.getBalance(placer) < amount) {
      return { success: false, error: 'Insufficient CC' };
    }
    
    this.economyManager.removeBalance(placer, amount, `Bounty on ${target}`);
    
    if (!this.bounties[target]) {
      this.bounties[target] = [];
    }
    
    this.bounties[target].push({
      placer,
      amount,
      reason,
      timestamp: Date.now()
    });
    
    const totalBounty = this.bounties[target].reduce((sum, b) => sum + b.amount, 0);
    
    this.broadcast(`${placer} placed a ${amount} CC bounty on ${target}! Total bounty: ${totalBounty} CC`, 'kill');
    this.emit('bounty_placed', { placer, target, amount, totalBounty });
    
    return { success: true, totalBounty };
  }

  claimBounty(killer, victim) {
    const bounties = this.bounties[victim];
    if (!bounties || bounties.length === 0) {
      return { success: false, amount: 0 };
    }
    
    const totalBounty = bounties.reduce((sum, b) => sum + b.amount, 0);
    this.economyManager.addBalance(killer, totalBounty, `Bounty on ${victim}`);
    
    delete this.bounties[victim];
    
    this.broadcast(`${killer} claimed the ${totalBounty} CC bounty on ${victim}!`, 'kill');
    this.emit('bounty_claimed', { killer, victim, amount: totalBounty });
    
    return { success: true, amount: totalBounty };
  }

  getBounty(target) {
    const bounties = this.bounties[target] || [];
    return bounties.reduce((sum, b) => sum + b.amount, 0);
  }

  getAllBounties() {
    return Object.entries(this.bounties).map(([target, bounties]) => ({
      target,
      total: bounties.reduce((sum, b) => sum + b.amount, 0),
      bounties
    })).filter(b => b.total > 0);
  }

  // Get active events
  getActiveEvents() {
    return this.activeEvents;
  }

  isEventActive(type) {
    return this.activeEvents.some(e => e.type === type);
  }

  getEvent(type) {
    return this.activeEvents.find(e => e.type === type);
  }
}

module.exports = EventManager;
