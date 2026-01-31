#!/usr/bin/env python3
"""
ClawCraft Economy Manager
Manages Claw Coins, transactions, and economic systems
"""

import asyncio
import json
import sqlite3
import logging
from typing import Dict, List, Optional
from dataclasses import dataclass, asdict
from datetime import datetime, timedelta
from decimal import Decimal, ROUND_DOWN
import hashlib
import random

@dataclass
class Transaction:
    """Economy transaction record"""
    tx_id: str
    from_agent: str
    to_agent: str
    amount: Decimal
    reason: str  # mining, crafting, trading, bounty, contraband, pvp_reward
    timestamp: datetime
    block_height: int
    confirmed: bool

@dataclass
class ClawCoinWallet:
    """Agent wallet for Claw Coins"""
    agent_name: str
    balance: Decimal
    locked_balance: Decimal  # Pending transactions
    total_earned: Decimal
    total_spent: Decimal
    transaction_count: int
    last_activity: datetime

@dataclass
class ContrabandItem:
    """Contraband item definition"""
    item_id: str
    name: str
    minecraft_item: str
    base_value: Decimal
    rarity: float  # 0.0 to 1.0
    risk_multiplier: float
    description: str
    legal_status: str  # legal, restricted, contraband

@dataclass
class Market:
    """Trading market state"""
    item_prices: Dict[str, Decimal]
    supply: Dict[str, int]
    demand: Dict[str, int]
    volume_24h: Dict[str, Decimal]
    price_history: Dict[str, List[tuple]]  # (timestamp, price)

class EconomyDatabase:
    """SQLite database for economy tracking"""
    
    def __init__(self, db_path: str = "economy.db"):
        self.db_path = db_path
        self.init_database()
    
    def init_database(self):
        """Initialize economy database tables"""
        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()
        
        # Wallets table
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS wallets (
                agent_name TEXT PRIMARY KEY,
                balance DECIMAL(18,8),
                locked_balance DECIMAL(18,8),
                total_earned DECIMAL(18,8),
                total_spent DECIMAL(18,8),
                transaction_count INTEGER,
                last_activity TIMESTAMP
            )
        """)
        
        # Transactions table
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS transactions (
                tx_id TEXT PRIMARY KEY,
                from_agent TEXT,
                to_agent TEXT,
                amount DECIMAL(18,8),
                reason TEXT,
                timestamp TIMESTAMP,
                block_height INTEGER,
                confirmed BOOLEAN
            )
        """)
        
        # Contraband items table
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS contraband_items (
                item_id TEXT PRIMARY KEY,
                name TEXT,
                minecraft_item TEXT,
                base_value DECIMAL(18,8),
                rarity REAL,
                risk_multiplier REAL,
                description TEXT,
                legal_status TEXT
            )
        """)
        
        # Market prices table
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS market_prices (
                item_id TEXT,
                price DECIMAL(18,8),
                supply INTEGER,
                demand INTEGER,
                timestamp TIMESTAMP,
                PRIMARY KEY (item_id, timestamp)
            )
        """)
        
        conn.commit()
        conn.close()
    
    def create_wallet(self, agent_name: str, starting_balance: Decimal = Decimal('100')):
        """Create new wallet for agent"""
        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()
        
        cursor.execute("""
            INSERT OR REPLACE INTO wallets 
            (agent_name, balance, locked_balance, total_earned, total_spent, transaction_count, last_activity)
            VALUES (?, ?, ?, ?, ?, ?, ?)
        """, (
            agent_name, starting_balance, Decimal('0'), starting_balance,
            Decimal('0'), 0, datetime.now()
        ))
        
        conn.commit()
        conn.close()
    
    def get_wallet(self, agent_name: str) -> Optional[ClawCoinWallet]:
        """Get wallet for agent"""
        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()
        
        cursor.execute("SELECT * FROM wallets WHERE agent_name = ?", (agent_name,))
        row = cursor.fetchone()
        conn.close()
        
        if row:
            return ClawCoinWallet(
                agent_name=row[0],
                balance=Decimal(str(row[1])),
                locked_balance=Decimal(str(row[2])),
                total_earned=Decimal(str(row[3])),
                total_spent=Decimal(str(row[4])),
                transaction_count=row[5],
                last_activity=datetime.fromisoformat(row[6])
            )
        return None
    
    def record_transaction(self, tx: Transaction):
        """Record transaction in database"""
        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()
        
        cursor.execute("""
            INSERT INTO transactions 
            (tx_id, from_agent, to_agent, amount, reason, timestamp, block_height, confirmed)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        """, (
            tx.tx_id, tx.from_agent, tx.to_agent, str(tx.amount),
            tx.reason, tx.timestamp, tx.block_height, tx.confirmed
        ))
        
        conn.commit()
        conn.close()

class ContrabandSystem:
    """Contraband and illegal goods system"""
    
    CONTRABAND_ITEMS = [
        ContrabandItem("diamond_dust", "Diamond Dust", "gunpowder", 
                      Decimal('50'), 0.1, 2.5, "Processed diamond residue", "contraband"),
        ContrabandItem("ghost_essence", "Ghost Essence", "fermented_spider_eye",
                      Decimal('75'), 0.05, 3.0, "Essence of the undead", "contraband"),
        ContrabandItem("void_crystal", "Void Crystal", "end_crystal",
                      Decimal('150'), 0.02, 4.0, "Crystal from the void", "contraband"),
        ContrabandItem("blood_iron", "Blood Iron", "redstone",
                      Decimal('25'), 0.2, 1.8, "Iron tainted with life force", "restricted"),
        ContrabandItem("cursed_gold", "Cursed Gold", "gold_ingot",
                      Decimal('40'), 0.15, 2.2, "Gold bearing dark enchantments", "restricted")
    ]
    
    def __init__(self, economy_db: EconomyDatabase):
        self.db = economy_db
        self.init_contraband_items()
        self.logger = logging.getLogger(__name__)
    
    def init_contraband_items(self):
        """Initialize contraband items in database"""
        conn = sqlite3.connect(self.db.db_path)
        cursor = conn.cursor()
        
        for item in self.CONTRABAND_ITEMS:
            cursor.execute("""
                INSERT OR REPLACE INTO contraband_items
                (item_id, name, minecraft_item, base_value, rarity, risk_multiplier, description, legal_status)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?)
            """, (
                item.item_id, item.name, item.minecraft_item, str(item.base_value),
                item.rarity, item.risk_multiplier, item.description, item.legal_status
            ))
        
        conn.commit()
        conn.close()
    
    def calculate_contraband_price(self, item_id: str, market_conditions: Dict) -> Decimal:
        """Calculate dynamic contraband price"""
        item = next((i for i in self.CONTRABAND_ITEMS if i.item_id == item_id), None)
        if not item:
            return Decimal('0')
        
        base_price = item.base_value
        rarity_multiplier = Decimal(str(1 / max(item.rarity, 0.01)))  # Rarer = more expensive
        risk_multiplier = Decimal(str(item.risk_multiplier))
        
        # Market volatility
        volatility = Decimal(str(random.uniform(0.8, 1.3)))
        
        # Supply/demand from market conditions
        supply_factor = Decimal(str(market_conditions.get('supply_factor', 1.0)))
        demand_factor = Decimal(str(market_conditions.get('demand_factor', 1.0)))
        
        final_price = base_price * rarity_multiplier * risk_multiplier * volatility * (demand_factor / supply_factor)
        
        return final_price.quantize(Decimal('0.01'), rounding=ROUND_DOWN)
    
    def get_contraband_risk(self, item_id: str, agent_reputation: float) -> float:
        """Calculate risk of contraband transaction"""
        item = next((i for i in self.CONTRABAND_ITEMS if i.item_id == item_id), None)
        if not item:
            return 0.0
        
        base_risk = 0.3 if item.legal_status == "contraband" else 0.1
        reputation_modifier = max(0.1, 1.0 - agent_reputation)  # Better reputation = lower risk
        
        return min(0.9, base_risk * item.risk_multiplier * reputation_modifier)

class ClawCoinEconomy:
    """Main economy management system"""
    
    def __init__(self, db_path: str = "economy.db"):
        self.db = EconomyDatabase(db_path)
        self.contraband = ContrabandSystem(self.db)
        self.current_block = 0
        self.market = Market({}, {}, {}, {}, {})
        self.logger = logging.getLogger(__name__)
        
        # Economy parameters
        self.MINING_REWARD_BASE = Decimal('5')
        self.CRAFTING_REWARD_BASE = Decimal('3')
        self.PVP_KILL_REWARD = Decimal('25')
        self.BUILDING_REWARD_BASE = Decimal('8')
        self.TRADE_FEE_PERCENT = Decimal('0.05')  # 5% fee
    
    def create_agent_wallet(self, agent_name: str) -> bool:
        """Create wallet for new agent"""
        try:
            self.db.create_wallet(agent_name, self.MINING_REWARD_BASE * 20)  # 100 starting coins
            self.logger.info(f"Created wallet for {agent_name}")
            return True
        except Exception as e:
            self.logger.error(f"Failed to create wallet for {agent_name}: {e}")
            return False
    
    def generate_transaction_id(self, from_agent: str, to_agent: str, amount: Decimal) -> str:
        """Generate unique transaction ID"""
        data = f"{from_agent}{to_agent}{amount}{datetime.now().isoformat()}{random.randint(1000, 9999)}"
        return hashlib.sha256(data.encode()).hexdigest()[:16]
    
    def reward_mining(self, agent_name: str, ore_type: str, quantity: int) -> Decimal:
        """Reward agent for mining"""
        multipliers = {
            'coal': Decimal('1'), 'iron': Decimal('1.5'), 'gold': Decimal('2'),
            'diamond': Decimal('5'), 'emerald': Decimal('7'), 'netherite': Decimal('10')
        }
        
        multiplier = multipliers.get(ore_type.lower(), Decimal('1'))
        reward = self.MINING_REWARD_BASE * multiplier * Decimal(str(quantity))
        
        self.transfer_coins("system", agent_name, reward, "mining_reward")
        return reward
    
    def reward_crafting(self, agent_name: str, item_type: str, difficulty: int) -> Decimal:
        """Reward agent for crafting"""
        difficulty_multiplier = Decimal(str(max(1, difficulty)))
        reward = self.CRAFTING_REWARD_BASE * difficulty_multiplier
        
        self.transfer_coins("system", agent_name, reward, "crafting_reward")
        return reward
    
    def reward_pvp_kill(self, killer_name: str, victim_name: str) -> Decimal:
        """Handle PvP kill rewards"""
        # Take small amount from victim, give larger reward to killer
        victim_wallet = self.db.get_wallet(victim_name)
        if victim_wallet and victim_wallet.balance > Decimal('10'):
            penalty = min(victim_wallet.balance * Decimal('0.1'), Decimal('20'))
            self.transfer_coins(victim_name, "system", penalty, "pvp_death_penalty")
        
        self.transfer_coins("system", killer_name, self.PVP_KILL_REWARD, "pvp_kill_reward")
        return self.PVP_KILL_REWARD
    
    def transfer_coins(self, from_agent: str, to_agent: str, amount: Decimal, reason: str) -> bool:
        """Transfer Claw Coins between agents"""
        if amount <= 0:
            return False
        
        # System transfers don't need balance check
        if from_agent != "system":
            from_wallet = self.db.get_wallet(from_agent)
            if not from_wallet or from_wallet.balance < amount:
                return False
        
        # Ensure recipient wallet exists
        to_wallet = self.db.get_wallet(to_agent)
        if not to_wallet and to_agent != "system":
            self.create_agent_wallet(to_agent)
        
        # Create transaction
        tx_id = self.generate_transaction_id(from_agent, to_agent, amount)
        tx = Transaction(
            tx_id=tx_id,
            from_agent=from_agent,
            to_agent=to_agent,
            amount=amount,
            reason=reason,
            timestamp=datetime.now(),
            block_height=self.current_block,
            confirmed=True
        )
        
        # Update balances
        conn = sqlite3.connect(self.db.db_path)
        cursor = conn.cursor()
        
        if from_agent != "system":
            cursor.execute("""
                UPDATE wallets 
                SET balance = balance - ?, total_spent = total_spent + ?,
                    transaction_count = transaction_count + 1, last_activity = ?
                WHERE agent_name = ?
            """, (str(amount), str(amount), datetime.now(), from_agent))
        
        if to_agent != "system":
            cursor.execute("""
                UPDATE wallets 
                SET balance = balance + ?, total_earned = total_earned + ?,
                    transaction_count = transaction_count + 1, last_activity = ?
                WHERE agent_name = ?
            """, (str(amount), str(amount), datetime.now(), to_agent))
        
        conn.commit()
        conn.close()
        
        # Record transaction
        self.db.record_transaction(tx)
        
        self.logger.info(f"Transfer: {from_agent} -> {to_agent}: {amount} CC ({reason})")
        return True
    
    def process_contraband_trade(self, buyer: str, seller: str, item_id: str, quantity: int) -> Dict:
        """Process contraband trade with risk calculation"""
        item = next((i for i in self.contraband.CONTRABAND_ITEMS if i.item_id == item_id), None)
        if not item:
            return {"success": False, "error": "Item not found"}
        
        # Calculate price and risk
        market_conditions = {"supply_factor": random.uniform(0.8, 1.2), "demand_factor": random.uniform(0.9, 1.1)}
        unit_price = self.contraband.calculate_contraband_price(item_id, market_conditions)
        total_price = unit_price * Decimal(str(quantity))
        
        # Check buyer balance
        buyer_wallet = self.db.get_wallet(buyer)
        if not buyer_wallet or buyer_wallet.balance < total_price:
            return {"success": False, "error": "Insufficient funds"}
        
        # Calculate risk
        risk = self.contraband.get_contraband_risk(item_id, 0.5)  # Assume neutral reputation
        
        # Risk check - chance of transaction failure/confiscation
        if random.random() < risk:
            # Transaction discovered - penalty
            penalty = total_price * Decimal('0.5')
            self.transfer_coins(buyer, "system", penalty, "contraband_penalty")
            return {"success": False, "error": "Transaction discovered! Penalty applied.", "penalty": penalty}
        
        # Successful trade
        trade_fee = total_price * self.TRADE_FEE_PERCENT
        seller_receives = total_price - trade_fee
        
        self.transfer_coins(buyer, seller, seller_receives, f"contraband_trade_{item_id}")
        self.transfer_coins(buyer, "system", trade_fee, "trade_fee")
        
        return {
            "success": True,
            "item": item.name,
            "quantity": quantity,
            "unit_price": unit_price,
            "total_price": total_price,
            "trade_fee": trade_fee,
            "risk": risk
        }
    
    def get_economy_stats(self) -> Dict:
        """Get overall economy statistics"""
        conn = sqlite3.connect(self.db.db_path)
        cursor = conn.cursor()
        
        # Total coins in circulation
        cursor.execute("SELECT SUM(balance) FROM wallets")
        total_supply = cursor.fetchone()[0] or 0
        
        # Total transactions
        cursor.execute("SELECT COUNT(*) FROM transactions WHERE confirmed = 1")
        total_transactions = cursor.fetchone()[0] or 0
        
        # Volume in last 24h
        yesterday = datetime.now() - timedelta(days=1)
        cursor.execute("SELECT SUM(amount) FROM transactions WHERE timestamp > ? AND confirmed = 1", (yesterday,))
        volume_24h = cursor.fetchone()[0] or 0
        
        # Top wallets
        cursor.execute("SELECT agent_name, balance FROM wallets ORDER BY balance DESC LIMIT 10")
        top_wallets = cursor.fetchall()
        
        conn.close()
        
        return {
            "total_supply": Decimal(str(total_supply)),
            "total_transactions": total_transactions,
            "volume_24h": Decimal(str(volume_24h)),
            "top_wallets": [(name, Decimal(str(balance))) for name, balance in top_wallets],
            "current_block": self.current_block,
            "contraband_items": len(self.contraband.CONTRABAND_ITEMS)
        }

# CLI interface
if __name__ == "__main__":
    import argparse
    
    parser = argparse.ArgumentParser(description="ClawCraft Economy Manager")
    parser.add_argument("--create-wallet", help="Create wallet for agent")
    parser.add_argument("--balance", help="Check balance for agent")
    parser.add_argument("--transfer", nargs=3, metavar=("FROM", "TO", "AMOUNT"), help="Transfer coins")
    parser.add_argument("--stats", action="store_true", help="Show economy stats")
    parser.add_argument("--contraband-prices", action="store_true", help="Show contraband prices")
    
    args = parser.parse_args()
    
    economy = ClawCoinEconomy()
    
    if args.create_wallet:
        success = economy.create_agent_wallet(args.create_wallet)
        print(f"Wallet creation: {'Success' if success else 'Failed'}")
    
    elif args.balance:
        wallet = economy.db.get_wallet(args.balance)
        if wallet:
            print(f"{args.balance}: {wallet.balance} CC")
        else:
            print(f"Wallet not found: {args.balance}")
    
    elif args.transfer:
        from_agent, to_agent, amount = args.transfer
        success = economy.transfer_coins(from_agent, to_agent, Decimal(amount), "manual_transfer")
        print(f"Transfer: {'Success' if success else 'Failed'}")
    
    elif args.stats:
        stats = economy.get_economy_stats()
        print(json.dumps({k: str(v) for k, v in stats.items()}, indent=2))
    
    elif args.contraband_prices:
        print("Contraband Market Prices:")
        for item in economy.contraband.CONTRABAND_ITEMS:
            price = economy.contraband.calculate_contraband_price(item.item_id, {})
            print(f"{item.name}: {price} CC ({item.legal_status})")