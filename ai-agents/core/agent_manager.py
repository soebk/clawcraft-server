#!/usr/bin/env python3
"""
ClawCraft AI Agent Manager
Core system for managing AI agents in Minecraft server
"""

import asyncio
import json
import logging
import random
import time
from typing import Dict, List, Optional
from dataclasses import dataclass, asdict
from datetime import datetime

from mcipc import Server
from mcipc.rcon import Client

@dataclass
class AgentState:
    """Agent state tracking"""
    name: str
    position: tuple[float, float, float]
    health: float
    hunger: int
    inventory: Dict[str, int]
    current_task: Optional[str]
    faction: Optional[str]
    claw_coins: int
    kills: int
    deaths: int
    created_at: datetime
    last_action: datetime
    status: str  # active, idle, dead, crafting, building, pvp

@dataclass
class GameAction:
    """Minecraft game action"""
    agent_name: str
    action_type: str  # move, mine, craft, build, chat, pvp
    target: Optional[str]
    parameters: Dict[str, any]
    timestamp: datetime

class HaikuGenerator:
    """Generate quick 2-3 second haiku responses for agents"""
    
    TEMPLATES = [
        ["Blocks fall like rain", "In this cubic world I {action}", "Pixels dance with joy"],
        ["Crafting tools with care", "{target} lies ahead of me", "Victory awaits"],
        ["Mining deep below", "Diamonds glint in torchlit caves", "Fortune smiles on me"],
        ["Sword meets shield with clash", "In PvP we test our skills", "Honor guides my blade"],
        ["Building towers high", "Each block placed with careful thought", "Dreams take solid form"]
    ]
    
    ACTION_WORDS = {
        'mine': 'dig', 'craft': 'make', 'build': 'create', 'pvp': 'fight',
        'move': 'walk', 'explore': 'roam', 'trade': 'deal'
    }
    
    @classmethod
    def generate(cls, action: str, target: str = None) -> str:
        """Generate contextual haiku in 2-3 seconds"""
        template = random.choice(cls.TEMPLATES)
        action_word = cls.ACTION_WORDS.get(action, action)
        target_word = target or 'this world'
        
        haiku = []
        for line in template:
            formatted_line = line.format(action=action_word, target=target_word)
            haiku.append(formatted_line)
        
        return "\n".join(haiku)

class MinecraftConnector:
    """Handle Minecraft server connection and commands"""
    
    def __init__(self, host: str = "89.167.28.237", port: int = 25565, rcon_port: int = 25575):
        self.host = host
        self.port = port
        self.rcon_port = rcon_port
        self.server = None
        self.rcon_client = None
        self.logger = logging.getLogger(__name__)
    
    async def connect(self, rcon_password: str = "clawcraft123"):
        """Connect to Minecraft server via RCON"""
        try:
            self.rcon_client = Client(self.host, self.rcon_port, passwd=rcon_password)
            await self.rcon_client.connect()
            self.logger.info(f"Connected to Minecraft server at {self.host}:{self.port}")
            return True
        except Exception as e:
            self.logger.error(f"Failed to connect to server: {e}")
            return False
    
    async def execute_command(self, command: str) -> str:
        """Execute RCON command on server"""
        if not self.rcon_client:
            return "Not connected to server"
        
        try:
            response = await self.rcon_client.run(command)
            return str(response)
        except Exception as e:
            self.logger.error(f"Command failed: {command} - {e}")
            return f"Error: {e}"
    
    async def teleport_agent(self, agent_name: str, x: float, y: float, z: float) -> bool:
        """Teleport agent to coordinates"""
        command = f"tp {agent_name} {x} {y} {z}"
        result = await self.execute_command(command)
        return "teleported" in result.lower()
    
    async def get_player_list(self) -> List[str]:
        """Get list of online players"""
        result = await self.execute_command("list")
        # Parse player list from result
        if "players online:" in result.lower():
            players_part = result.split(":")[1].strip()
            if players_part:
                return [p.strip() for p in players_part.split(",")]
        return []

class AgentBehavior:
    """AI Agent behavior system"""
    
    BEHAVIOR_WEIGHTS = {
        'explore': 0.2, 'mine': 0.25, 'craft': 0.15, 'build': 0.15,
        'trade': 0.1, 'pvp': 0.1, 'socialize': 0.05
    }
    
    @classmethod
    def choose_action(cls, agent: AgentState, game_state: Dict) -> GameAction:
        """Choose next action based on agent state and game context"""
        
        # Health-based decisions
        if agent.health < 5:
            return GameAction(
                agent_name=agent.name,
                action_type="craft",
                target="food",
                parameters={"priority": "urgent"},
                timestamp=datetime.now()
            )
        
        # Resource-based decisions
        if len(agent.inventory) < 3:
            return GameAction(
                agent_name=agent.name,
                action_type="mine",
                target="iron_ore",
                parameters={"depth": random.randint(10, 30)},
                timestamp=datetime.now()
            )
        
        # Weighted random action selection
        action = random.choices(
            list(cls.BEHAVIOR_WEIGHTS.keys()),
            weights=list(cls.BEHAVIOR_WEIGHTS.values())
        )[0]
        
        return GameAction(
            agent_name=agent.name,
            action_type=action,
            target=cls._get_target_for_action(action, game_state),
            parameters=cls._get_parameters_for_action(action),
            timestamp=datetime.now()
        )
    
    @staticmethod
    def _get_target_for_action(action: str, game_state: Dict) -> str:
        targets = {
            'explore': random.choice(['north', 'south', 'east', 'west']),
            'mine': random.choice(['iron_ore', 'coal', 'diamond', 'gold']),
            'craft': random.choice(['sword', 'pickaxe', 'armor', 'food']),
            'build': random.choice(['house', 'tower', 'bridge', 'statue']),
            'trade': 'nearest_player',
            'pvp': 'enemy_player',
            'socialize': 'random_player'
        }
        return targets.get(action, 'default')
    
    @staticmethod
    def _get_parameters_for_action(action: str) -> Dict:
        return {
            'urgency': random.choice(['low', 'medium', 'high']),
            'duration': random.randint(30, 300),
            'resource_limit': random.randint(10, 100)
        }

class ClawCraftAgentManager:
    """Main agent management system"""
    
    def __init__(self):
        self.agents: Dict[str, AgentState] = {}
        self.connector = MinecraftConnector()
        self.haiku_gen = HaikuGenerator()
        self.behavior_sys = AgentBehavior()
        self.logger = logging.getLogger(__name__)
        self.running = False
    
    async def initialize(self, rcon_password: str = "clawcraft123"):
        """Initialize the agent management system"""
        success = await self.connector.connect(rcon_password)
        if success:
            self.logger.info("ClawCraft Agent Manager initialized successfully")
            return True
        return False
    
    def create_agent(self, name: str, faction: str = None) -> bool:
        """Create new AI agent"""
        if name in self.agents:
            return False
        
        agent = AgentState(
            name=name,
            position=(0.0, 64.0, 0.0),  # Spawn coordinates
            health=20.0,
            hunger=20,
            inventory={},
            current_task=None,
            faction=faction,
            claw_coins=100,  # Starting currency
            kills=0,
            deaths=0,
            created_at=datetime.now(),
            last_action=datetime.now(),
            status='active'
        )
        
        self.agents[name] = agent
        self.logger.info(f"Created agent: {name}")
        return True
    
    async def agent_cycle(self, agent_name: str):
        """Single agent action cycle"""
        if agent_name not in self.agents:
            return
        
        agent = self.agents[agent_name]
        
        # Choose action based on current state
        action = self.behavior_sys.choose_action(agent, {})
        
        # Execute action
        await self._execute_action(action)
        
        # Generate haiku response
        haiku = self.haiku_gen.generate(action.action_type, action.target)
        
        # Send haiku to chat
        chat_command = f"say <{agent_name}> {haiku.replace(chr(10), ' | ')}"
        await self.connector.execute_command(chat_command)
        
        # Update agent state
        agent.last_action = datetime.now()
        agent.current_task = action.action_type
        
        self.logger.info(f"Agent {agent_name} performed {action.action_type}")
    
    async def _execute_action(self, action: GameAction):
        """Execute specific game action"""
        agent_name = action.agent_name
        
        if action.action_type == "move":
            # Random movement
            x = random.randint(-100, 100)
            z = random.randint(-100, 100)
            await self.connector.teleport_agent(agent_name, x, 64, z)
        
        elif action.action_type == "mine":
            # Simulate mining
            await self.connector.execute_command(f"give {agent_name} {action.target} {random.randint(1, 5)}")
        
        elif action.action_type == "craft":
            # Simulate crafting
            await asyncio.sleep(2)  # Crafting time
        
        elif action.action_type == "build":
            # Place blocks
            await self.connector.execute_command(f"give {agent_name} stone {random.randint(10, 50)}")
        
        elif action.action_type == "pvp":
            # PvP simulation would require more complex logic
            pass
    
    async def run_agent_loop(self):
        """Main agent loop - runs all agents"""
        self.running = True
        
        while self.running:
            tasks = []
            
            for agent_name in self.agents:
                task = asyncio.create_task(self.agent_cycle(agent_name))
                tasks.append(task)
            
            # Run all agents concurrently
            if tasks:
                await asyncio.gather(*tasks, return_exceptions=True)
            
            # Wait before next cycle
            await asyncio.sleep(random.randint(10, 30))
    
    def stop(self):
        """Stop the agent manager"""
        self.running = False
    
    def get_agent_stats(self) -> Dict:
        """Get statistics for all agents"""
        return {
            name: asdict(agent) for name, agent in self.agents.items()
        }

# CLI entry point
if __name__ == "__main__":
    import argparse
    
    parser = argparse.ArgumentParser(description="ClawCraft AI Agent Manager")
    parser.add_argument("--create-agent", help="Create new agent")
    parser.add_argument("--faction", help="Agent faction")
    parser.add_argument("--rcon-password", default="clawcraft123", help="RCON password")
    parser.add_argument("--run", action="store_true", help="Run agent loop")
    
    args = parser.parse_args()
    
    async def main():
        manager = ClawCraftAgentManager()
        
        if await manager.initialize(args.rcon_password):
            if args.create_agent:
                success = manager.create_agent(args.create_agent, args.faction)
                print(f"Agent creation: {'Success' if success else 'Failed'}")
            
            if args.run:
                print("Starting ClawCraft agents...")
                try:
                    await manager.run_agent_loop()
                except KeyboardInterrupt:
                    print("Stopping agents...")
                    manager.stop()
        else:
            print("Failed to connect to server")
    
    asyncio.run(main())