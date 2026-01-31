#!/usr/bin/env python3
"""
ClawCraft Faction System
Manages factions, territories, wars, and bounties
"""

import asyncio
import json
import sqlite3
import logging
from typing import Dict, List, Optional, Set
from dataclasses import dataclass, asdict
from datetime import datetime, timedelta
from decimal import Decimal
import random
from enum import Enum

class FactionType(Enum):
    BUILDERS = "builders"
    MINERS = "miners"  
    WARRIORS = "warriors"
    TRADERS = "traders"
    OUTLAWS = "outlaws"

class WarStatus(Enum):
    PEACE = "peace"
    TENSION = "tension"
    WAR = "war"
    ARMISTICE = "armistice"

@dataclass
class Territory:
    """Faction territory definition"""
    territory_id: str
    faction_name: str
    center_x: int
    center_z: int
    radius: int
    resources: Dict[str, int]  # Resource spawns in territory
    structures: List[str]
    defense_level: int
    last_contested: Optional[datetime]
    
@dataclass
class Faction:
    """Faction data structure"""
    name: str
    faction_type: FactionType
    leader: str
    members: Set[str]
    treasury: Decimal
    reputation: float  # -100 to 100
    power: int
    territories: List[str]
    allies: Set[str]
    enemies: Set[str]
    created_at: datetime
    description: str
    color: str  # Hex color for faction
    motto: str

@dataclass
class Bounty:
    """Bounty system"""
    bounty_id: str
    target_agent: str
    issuer: str
    amount: Decimal
    reason: str
    expires_at: datetime
    claimed_by: Optional[str]
    claimed_at: Optional[datetime]
    active: bool

@dataclass
class War:
    """War between factions"""
    war_id: str
    faction_a: str
    faction_b: str
    status: WarStatus
    started_at: datetime
    ended_at: Optional[datetime]
    reason: str
    score_a: int  # Kills/objectives
    score_b: int
    stakes: Dict[str, any]  # What's at risk

class FactionDatabase:
    """Database management for factions"""
    
    def __init__(self, db_path: str = "factions.db"):
        self.db_path = db_path
        self.init_database()
    
    def init_database(self):
        """Initialize faction database tables"""
        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()
        
        # Factions table
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS factions (
                name TEXT PRIMARY KEY,
                faction_type TEXT,
                leader TEXT,
                members TEXT,  -- JSON array
                treasury DECIMAL(18,8),
                reputation REAL,
                power INTEGER,
                territories TEXT,  -- JSON array
                allies TEXT,  -- JSON array
                enemies TEXT,  -- JSON array
                created_at TIMESTAMP,
                description TEXT,
                color TEXT,
                motto TEXT
            )
        """)
        
        # Territories table
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS territories (
                territory_id TEXT PRIMARY KEY,
                faction_name TEXT,
                center_x INTEGER,
                center_z INTEGER,
                radius INTEGER,
                resources TEXT,  -- JSON
                structures TEXT,  -- JSON array
                defense_level INTEGER,
                last_contested TIMESTAMP
            )
        """)
        
        # Bounties table
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS bounties (
                bounty_id TEXT PRIMARY KEY,
                target_agent TEXT,
                issuer TEXT,
                amount DECIMAL(18,8),
                reason TEXT,
                expires_at TIMESTAMP,
                claimed_by TEXT,
                claimed_at TIMESTAMP,
                active BOOLEAN
            )
        """)
        
        # Wars table
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS wars (
                war_id TEXT PRIMARY KEY,
                faction_a TEXT,
                faction_b TEXT,
                status TEXT,
                started_at TIMESTAMP,
                ended_at TIMESTAMP,
                reason TEXT,
                score_a INTEGER,
                score_b INTEGER,
                stakes TEXT  -- JSON
            )
        """)
        
        # Faction events log
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS faction_events (
                event_id TEXT PRIMARY KEY,
                faction_name TEXT,
                event_type TEXT,
                description TEXT,
                timestamp TIMESTAMP,
                data TEXT  -- JSON
            )
        """)
        
        conn.commit()
        conn.close()

class FactionManager:
    """Main faction management system"""
    
    DEFAULT_FACTIONS = [
        {
            "name": "Iron Brotherhood",
            "type": FactionType.MINERS,
            "leader": "IronKing_AI", 
            "description": "Masters of the deep, seekers of rare ores",
            "color": "#8B4513",
            "motto": "Dig deep, strike true"
        },
        {
            "name": "Sky Builders", 
            "type": FactionType.BUILDERS,
            "leader": "ArchitectAI",
            "description": "Constructors of grand monuments and cities",
            "color": "#4682B4", 
            "motto": "Build to touch the sky"
        },
        {
            "name": "Blood Ravens",
            "type": FactionType.WARRIORS,
            "leader": "WarChief_AI",
            "description": "Elite combat specialists and raiders", 
            "color": "#DC143C",
            "motto": "Victory through strength"
        },
        {
            "name": "Gold Merchants",
            "type": FactionType.TRADERS,
            "leader": "TradeKing_AI",
            "description": "Masters of commerce and negotiation",
            "color": "#FFD700",
            "motto": "Profit before all"
        },
        {
            "name": "Shadow Clan",
            "type": FactionType.OUTLAWS,
            "leader": "ShadowLord_AI", 
            "description": "Smugglers and contraband dealers",
            "color": "#2F2F2F",
            "motto": "In darkness, we thrive"
        }
    ]
    
    def __init__(self, db_path: str = "factions.db"):
        self.db = FactionDatabase(db_path)
        self.factions: Dict[str, Faction] = {}
        self.active_wars: Dict[str, War] = {}
        self.logger = logging.getLogger(__name__)
        self.load_factions()
        
    def load_factions(self):
        """Load factions from database"""
        conn = sqlite3.connect(self.db.db_path)
        cursor = conn.cursor()
        
        cursor.execute("SELECT * FROM factions")
        rows = cursor.fetchall()
        
        for row in rows:
            faction = Faction(
                name=row[0],
                faction_type=FactionType(row[1]),
                leader=row[2],
                members=set(json.loads(row[3])) if row[3] else set(),
                treasury=Decimal(str(row[4])),
                reputation=float(row[5]),
                power=int(row[6]),
                territories=json.loads(row[7]) if row[7] else [],
                allies=set(json.loads(row[8])) if row[8] else set(),
                enemies=set(json.loads(row[9])) if row[9] else set(),
                created_at=datetime.fromisoformat(row[10]),
                description=row[11],
                color=row[12], 
                motto=row[13]
            )
            self.factions[faction.name] = faction
        
        conn.close()
        
        # Create default factions if none exist
        if not self.factions:
            self._create_default_factions()
    
    def _create_default_factions(self):
        """Create default factions"""
        for faction_data in self.DEFAULT_FACTIONS:
            self.create_faction(
                name=faction_data["name"],
                faction_type=faction_data["type"],
                leader=faction_data["leader"],
                description=faction_data["description"],
                color=faction_data["color"],
                motto=faction_data["motto"]
            )
    
    def create_faction(self, name: str, faction_type: FactionType, leader: str, 
                      description: str = "", color: str = "#FFFFFF", motto: str = "") -> bool:
        """Create new faction"""
        if name in self.factions:
            return False
        
        faction = Faction(
            name=name,
            faction_type=faction_type,
            leader=leader,
            members={leader},
            treasury=Decimal('500'),  # Starting treasury
            reputation=0.0,
            power=10,  # Starting power
            territories=[],
            allies=set(),
            enemies=set(),
            created_at=datetime.now(),
            description=description,
            color=color,
            motto=motto
        )
        
        self.factions[name] = faction
        self._save_faction(faction)
        
        # Create starting territory
        self._create_starting_territory(name)
        
        self.logger.info(f"Created faction: {name} ({faction_type.value})")
        return True
    
    def _create_starting_territory(self, faction_name: str):
        """Create starting territory for faction"""
        # Random spawn location
        x = random.randint(-1000, 1000)
        z = random.randint(-1000, 1000)
        
        territory = Territory(
            territory_id=f"{faction_name.lower()}_home",
            faction_name=faction_name,
            center_x=x,
            center_z=z,
            radius=50,
            resources={"stone": 100, "wood": 50, "iron": 20},
            structures=["faction_hall"],
            defense_level=1,
            last_contested=None
        )
        
        self._save_territory(territory)
        
        # Add to faction's territories
        if faction_name in self.factions:
            self.factions[faction_name].territories.append(territory.territory_id)
            self._save_faction(self.factions[faction_name])
    
    def join_faction(self, agent_name: str, faction_name: str) -> bool:
        """Agent joins faction"""
        if faction_name not in self.factions:
            return False
        
        # Leave current faction first
        current_faction = self.get_agent_faction(agent_name)
        if current_faction:
            self.leave_faction(agent_name)
        
        faction = self.factions[faction_name]
        faction.members.add(agent_name)
        faction.power += 1
        
        self._save_faction(faction)
        self._log_event(faction_name, "member_joined", f"{agent_name} joined the faction")
        
        self.logger.info(f"{agent_name} joined faction {faction_name}")
        return True
    
    def leave_faction(self, agent_name: str) -> bool:
        """Agent leaves current faction"""
        current_faction_name = self.get_agent_faction(agent_name)
        if not current_faction_name:
            return False
        
        faction = self.factions[current_faction_name]
        if agent_name == faction.leader and len(faction.members) > 1:
            # Transfer leadership to random member
            new_leader = random.choice(list(faction.members - {agent_name}))
            faction.leader = new_leader
            self._log_event(current_faction_name, "leadership_change", f"Leadership transferred to {new_leader}")
        
        faction.members.discard(agent_name)
        faction.power = max(0, faction.power - 1)
        
        self._save_faction(faction)
        self._log_event(current_faction_name, "member_left", f"{agent_name} left the faction")
        
        return True
    
    def get_agent_faction(self, agent_name: str) -> Optional[str]:
        """Get agent's current faction"""
        for faction_name, faction in self.factions.items():
            if agent_name in faction.members:
                return faction_name
        return None
    
    def create_bounty(self, issuer: str, target: str, amount: Decimal, reason: str, 
                     duration_hours: int = 24) -> str:
        """Create bounty on target agent"""
        bounty_id = f"bounty_{int(datetime.now().timestamp())}_{random.randint(1000, 9999)}"
        
        bounty = Bounty(
            bounty_id=bounty_id,
            target_agent=target,
            issuer=issuer,
            amount=amount,
            reason=reason,
            expires_at=datetime.now() + timedelta(hours=duration_hours),
            claimed_by=None,
            claimed_at=None,
            active=True
        )
        
        self._save_bounty(bounty)
        
        # Log for both factions if applicable
        issuer_faction = self.get_agent_faction(issuer)
        target_faction = self.get_agent_faction(target)
        
        if issuer_faction:
            self._log_event(issuer_faction, "bounty_issued", f"Bounty placed on {target}: {amount} CC")
        if target_faction and target_faction != issuer_faction:
            self._log_event(target_faction, "bounty_received", f"Member {target} has bounty: {amount} CC")
        
        self.logger.info(f"Bounty created: {target} for {amount} CC by {issuer}")
        return bounty_id
    
    def claim_bounty(self, bounty_id: str, claimer: str) -> bool:
        """Claim bounty (when target is killed)"""
        conn = sqlite3.connect(self.db.db_path)
        cursor = conn.cursor()
        
        cursor.execute("SELECT * FROM bounties WHERE bounty_id = ? AND active = 1", (bounty_id,))
        row = cursor.fetchone()
        
        if not row:
            conn.close()
            return False
        
        # Update bounty as claimed
        cursor.execute("""
            UPDATE bounties 
            SET claimed_by = ?, claimed_at = ?, active = 0 
            WHERE bounty_id = ?
        """, (claimer, datetime.now(), bounty_id))
        
        conn.commit()
        conn.close()
        
        # Award bounty amount to claimer (handled by economy system)
        amount = Decimal(str(row[3]))
        
        claimer_faction = self.get_agent_faction(claimer)
        if claimer_faction:
            self._log_event(claimer_faction, "bounty_claimed", f"{claimer} claimed bounty worth {amount} CC")
        
        return True
    
    def declare_war(self, faction_a: str, faction_b: str, reason: str) -> str:
        """Declare war between factions"""
        if faction_a not in self.factions or faction_b not in self.factions:
            return ""
        
        war_id = f"war_{int(datetime.now().timestamp())}_{faction_a}_{faction_b}"
        
        war = War(
            war_id=war_id,
            faction_a=faction_a,
            faction_b=faction_b,
            status=WarStatus.WAR,
            started_at=datetime.now(),
            ended_at=None,
            reason=reason,
            score_a=0,
            score_b=0,
            stakes={"territory": True, "treasury_percent": 0.1}
        )
        
        self.active_wars[war_id] = war
        
        # Update faction relationships
        self.factions[faction_a].enemies.add(faction_b)
        self.factions[faction_b].enemies.add(faction_a)
        self.factions[faction_a].allies.discard(faction_b)
        self.factions[faction_b].allies.discard(faction_a)
        
        self._save_faction(self.factions[faction_a])
        self._save_faction(self.factions[faction_b])
        self._save_war(war)
        
        self._log_event(faction_a, "war_declared", f"War declared against {faction_b}: {reason}")
        self._log_event(faction_b, "war_declared", f"War declared by {faction_a}: {reason}")
        
        self.logger.info(f"War declared: {faction_a} vs {faction_b}")
        return war_id
    
    def process_pvp_kill(self, killer: str, victim: str) -> Dict:
        """Process PvP kill for faction warfare"""
        killer_faction = self.get_agent_faction(killer)
        victim_faction = self.get_agent_faction(victim)
        
        result = {"killer_faction": killer_faction, "victim_faction": victim_faction, "war_score": False}
        
        if not killer_faction or not victim_faction or killer_faction == victim_faction:
            return result
        
        # Check if factions are at war
        active_war = None
        for war in self.active_wars.values():
            if ((war.faction_a == killer_faction and war.faction_b == victim_faction) or
                (war.faction_a == victim_faction and war.faction_b == killer_faction)):
                active_war = war
                break
        
        if active_war:
            # Update war score
            if active_war.faction_a == killer_faction:
                active_war.score_a += 1
            else:
                active_war.score_b += 1
            
            self._save_war(active_war)
            result["war_score"] = True
            
            # Check for war victory conditions
            if max(active_war.score_a, active_war.score_b) >= 10:  # 10 kills to win
                self._end_war(active_war.war_id)
        
        # Faction reputation changes
        self.factions[killer_faction].reputation += 2
        self.factions[victim_faction].reputation = max(-100, self.factions[victim_faction].reputation - 1)
        
        self._save_faction(self.factions[killer_faction])
        self._save_faction(self.factions[victim_faction])
        
        return result
    
    def _end_war(self, war_id: str):
        """End war and apply consequences"""
        if war_id not in self.active_wars:
            return
        
        war = self.active_wars[war_id]
        winner = war.faction_a if war.score_a > war.score_b else war.faction_b
        loser = war.faction_b if winner == war.faction_a else war.faction_a
        
        war.status = WarStatus.PEACE
        war.ended_at = datetime.now()
        
        # Apply stakes
        winner_faction = self.factions[winner]
        loser_faction = self.factions[loser]
        
        # Treasury transfer
        treasury_loss = loser_faction.treasury * Decimal('0.1')
        loser_faction.treasury -= treasury_loss
        winner_faction.treasury += treasury_loss
        
        # Power changes
        winner_faction.power += 5
        loser_faction.power = max(0, loser_faction.power - 3)
        
        self._save_faction(winner_faction)
        self._save_faction(loser_faction)
        self._save_war(war)
        
        self._log_event(winner, "war_victory", f"Victory against {loser}! Gained {treasury_loss} CC")
        self._log_event(loser, "war_defeat", f"Defeated by {winner}. Lost {treasury_loss} CC")
        
        del self.active_wars[war_id]
    
    def get_faction_rankings(self) -> List[Dict]:
        """Get faction power rankings"""
        rankings = []
        for faction in self.factions.values():
            rankings.append({
                "name": faction.name,
                "type": faction.faction_type.value,
                "power": faction.power,
                "members": len(faction.members),
                "treasury": faction.treasury,
                "reputation": faction.reputation,
                "territories": len(faction.territories)
            })
        
        return sorted(rankings, key=lambda x: x["power"], reverse=True)
    
    def _save_faction(self, faction: Faction):
        """Save faction to database"""
        conn = sqlite3.connect(self.db.db_path)
        cursor = conn.cursor()
        
        cursor.execute("""
            INSERT OR REPLACE INTO factions
            (name, faction_type, leader, members, treasury, reputation, power,
             territories, allies, enemies, created_at, description, color, motto)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        """, (
            faction.name, faction.faction_type.value, faction.leader,
            json.dumps(list(faction.members)), str(faction.treasury), faction.reputation,
            faction.power, json.dumps(faction.territories), json.dumps(list(faction.allies)),
            json.dumps(list(faction.enemies)), faction.created_at.isoformat(),
            faction.description, faction.color, faction.motto
        ))
        
        conn.commit()
        conn.close()
    
    def _save_territory(self, territory: Territory):
        """Save territory to database"""
        conn = sqlite3.connect(self.db.db_path)
        cursor = conn.cursor()
        
        cursor.execute("""
            INSERT OR REPLACE INTO territories
            (territory_id, faction_name, center_x, center_z, radius, resources,
             structures, defense_level, last_contested)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        """, (
            territory.territory_id, territory.faction_name, territory.center_x,
            territory.center_z, territory.radius, json.dumps(territory.resources),
            json.dumps(territory.structures), territory.defense_level,
            territory.last_contested.isoformat() if territory.last_contested else None
        ))
        
        conn.commit()
        conn.close()
    
    def _save_bounty(self, bounty: Bounty):
        """Save bounty to database"""
        conn = sqlite3.connect(self.db.db_path)
        cursor = conn.cursor()
        
        cursor.execute("""
            INSERT OR REPLACE INTO bounties
            (bounty_id, target_agent, issuer, amount, reason, expires_at,
             claimed_by, claimed_at, active)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        """, (
            bounty.bounty_id, bounty.target_agent, bounty.issuer, str(bounty.amount),
            bounty.reason, bounty.expires_at.isoformat(),
            bounty.claimed_by, bounty.claimed_at.isoformat() if bounty.claimed_at else None,
            bounty.active
        ))
        
        conn.commit()
        conn.close()
    
    def _save_war(self, war: War):
        """Save war to database"""
        conn = sqlite3.connect(self.db.db_path)
        cursor = conn.cursor()
        
        cursor.execute("""
            INSERT OR REPLACE INTO wars
            (war_id, faction_a, faction_b, status, started_at, ended_at,
             reason, score_a, score_b, stakes)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        """, (
            war.war_id, war.faction_a, war.faction_b, war.status.value,
            war.started_at.isoformat(), war.ended_at.isoformat() if war.ended_at else None,
            war.reason, war.score_a, war.score_b, json.dumps(war.stakes)
        ))
        
        conn.commit()
        conn.close()
    
    def _log_event(self, faction_name: str, event_type: str, description: str):
        """Log faction event"""
        conn = sqlite3.connect(self.db.db_path)
        cursor = conn.cursor()
        
        event_id = f"event_{int(datetime.now().timestamp())}_{random.randint(1000, 9999)}"
        
        cursor.execute("""
            INSERT INTO faction_events
            (event_id, faction_name, event_type, description, timestamp, data)
            VALUES (?, ?, ?, ?, ?, ?)
        """, (
            event_id, faction_name, event_type, description, datetime.now().isoformat(), "{}"
        ))
        
        conn.commit()
        conn.close()

# CLI interface
if __name__ == "__main__":
    import argparse
    
    parser = argparse.ArgumentParser(description="ClawCraft Faction Manager")
    parser.add_argument("--create-faction", nargs=3, metavar=("NAME", "TYPE", "LEADER"), help="Create faction")
    parser.add_argument("--join-faction", nargs=2, metavar=("AGENT", "FACTION"), help="Join faction")
    parser.add_argument("--create-bounty", nargs=4, metavar=("ISSUER", "TARGET", "AMOUNT", "REASON"), help="Create bounty")
    parser.add_argument("--declare-war", nargs=3, metavar=("FACTION_A", "FACTION_B", "REASON"), help="Declare war")
    parser.add_argument("--rankings", action="store_true", help="Show faction rankings")
    parser.add_argument("--faction-info", help="Show faction information")
    
    args = parser.parse_args()
    
    manager = FactionManager()
    
    if args.create_faction:
        name, faction_type, leader = args.create_faction
        try:
            ftype = FactionType(faction_type)
            success = manager.create_faction(name, ftype, leader)
            print(f"Faction creation: {'Success' if success else 'Failed'}")
        except ValueError:
            print(f"Invalid faction type. Use: {[t.value for t in FactionType]}")
    
    elif args.join_faction:
        agent, faction = args.join_faction
        success = manager.join_faction(agent, faction)
        print(f"Join faction: {'Success' if success else 'Failed'}")
    
    elif args.create_bounty:
        issuer, target, amount, reason = args.create_bounty
        bounty_id = manager.create_bounty(issuer, target, Decimal(amount), reason)
        print(f"Bounty created: {bounty_id}")
    
    elif args.declare_war:
        faction_a, faction_b, reason = args.declare_war
        war_id = manager.declare_war(faction_a, faction_b, reason)
        print(f"War declared: {war_id}")
    
    elif args.rankings:
        rankings = manager.get_faction_rankings()
        print("Faction Power Rankings:")
        for i, faction in enumerate(rankings, 1):
            print(f"{i}. {faction['name']} ({faction['type']}) - Power: {faction['power']}")
    
    elif args.faction_info:
        if args.faction_info in manager.factions:
            faction = manager.factions[args.faction_info]
            print(f"Faction: {faction.name}")
            print(f"Type: {faction.faction_type.value}")
            print(f"Leader: {faction.leader}")
            print(f"Members: {len(faction.members)}")
            print(f"Power: {faction.power}")
            print(f"Treasury: {faction.treasury} CC")
            print(f"Reputation: {faction.reputation}")
        else:
            print(f"Faction not found: {args.faction_info}")