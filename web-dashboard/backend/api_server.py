#!/usr/bin/env python3
"""
ClawCraft Web API Server
Provides REST API for web dashboard and external integrations
"""

from flask import Flask, jsonify, request, render_template
from flask_cors import CORS
from flask_socketio import SocketIO, emit
import asyncio
import json
import sqlite3
import logging
from datetime import datetime, timedelta
import threading
import os
import sys

# Add parent directories to path for imports
sys.path.append('/root/projects/clawcraft/ai-agents/core')
sys.path.append('/root/projects/clawcraft/economy/claw-coins')
sys.path.append('/root/projects/clawcraft/economy/factions')

from agent_manager import ClawCraftAgentManager
from economy_manager import ClawCoinEconomy
from faction_manager import FactionManager

app = Flask(__name__)
app.config['SECRET_KEY'] = 'clawcraft_secret_2024'
CORS(app, origins=["http://localhost:3000", "https://clawcraft.tech"])
socketio = SocketIO(app, cors_allowed_origins="*")

# Global managers
agent_manager = None
economy_manager = None
faction_manager = None

# WebSocket connections
connected_clients = set()

# Logging setup
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

def initialize_managers():
    """Initialize all system managers"""
    global agent_manager, economy_manager, faction_manager
    
    try:
        # Initialize managers
        agent_manager = ClawCraftAgentManager()
        economy_manager = ClawCoinEconomy()
        faction_manager = FactionManager()
        
        logger.info("All managers initialized successfully")
        return True
    except Exception as e:
        logger.error(f"Failed to initialize managers: {e}")
        return False

# API Routes

@app.route('/api/status')
def api_status():
    """API health check"""
    return jsonify({
        'status': 'online',
        'timestamp': datetime.now().isoformat(),
        'version': '1.0.0',
        'systems': {
            'agents': agent_manager is not None,
            'economy': economy_manager is not None,
            'factions': faction_manager is not None
        }
    })

@app.route('/api/agents/list')
def api_agents_list():
    """Get list of all AI agents"""
    if not agent_manager:
        return jsonify({'error': 'Agent manager not initialized'}), 500
    
    try:
        agents_data = agent_manager.get_agent_stats()
        agents_list = []
        
        for agent_name, agent_data in agents_data.items():
            agents_list.append({
                'name': agent_name,
                'status': agent_data['status'],
                'faction': agent_data['faction'],
                'position': agent_data['position'],
                'health': agent_data['health'],
                'hunger': agent_data['hunger'],
                'claw_coins': agent_data['claw_coins'],
                'kills': agent_data['kills'],
                'deaths': agent_data['deaths'],
                'current_task': agent_data['current_task'],
                'last_action': agent_data['last_action']
            })
        
        return jsonify({
            'agents': agents_list,
            'total_count': len(agents_list),
            'active_count': sum(1 for a in agents_list if a['status'] == 'active')
        })
    
    except Exception as e:
        logger.error(f"Error fetching agents: {e}")
        return jsonify({'error': 'Failed to fetch agents'}), 500

@app.route('/api/agents/create', methods=['POST'])
def api_agents_create():
    """Create new AI agent"""
    if not agent_manager:
        return jsonify({'error': 'Agent manager not initialized'}), 500
    
    try:
        data = request.get_json()
        agent_name = data.get('name')
        faction = data.get('faction', None)
        
        if not agent_name:
            return jsonify({'error': 'Agent name required'}), 400
        
        success = agent_manager.create_agent(agent_name, faction)
        
        if success:
            # Broadcast new agent to WebSocket clients
            socketio.emit('agent_created', {
                'name': agent_name,
                'faction': faction,
                'timestamp': datetime.now().isoformat()
            })
            
            return jsonify({
                'success': True,
                'message': f'Agent {agent_name} created successfully',
                'agent': {'name': agent_name, 'faction': faction}
            })
        else:
            return jsonify({'error': 'Failed to create agent'}), 500
    
    except Exception as e:
        logger.error(f"Error creating agent: {e}")
        return jsonify({'error': 'Failed to create agent'}), 500

@app.route('/api/agents/start', methods=['POST'])
def api_agents_start():
    """Start AI agent system"""
    if not agent_manager:
        return jsonify({'error': 'Agent manager not initialized'}), 500
    
    try:
        # Start agent loop in background
        threading.Thread(target=asyncio.run, args=(agent_manager.run_agent_loop(),), daemon=True).start()
        
        return jsonify({
            'success': True,
            'message': 'AI agent system started',
            'timestamp': datetime.now().isoformat()
        })
    
    except Exception as e:
        logger.error(f"Error starting agents: {e}")
        return jsonify({'error': 'Failed to start agent system'}), 500

@app.route('/api/economy/stats')
def api_economy_stats():
    """Get economy statistics"""
    if not economy_manager:
        return jsonify({'error': 'Economy manager not initialized'}), 500
    
    try:
        stats = economy_manager.get_economy_stats()
        
        return jsonify({
            'total_supply': str(stats['total_supply']),
            'total_transactions': stats['total_transactions'],
            'volume_24h': str(stats['volume_24h']),
            'top_wallets': [(name, str(balance)) for name, balance in stats['top_wallets']],
            'current_block': stats['current_block'],
            'contraband_items': stats['contraband_items'],
            'timestamp': datetime.now().isoformat()
        })
    
    except Exception as e:
        logger.error(f"Error fetching economy stats: {e}")
        return jsonify({'error': 'Failed to fetch economy statistics'}), 500

@app.route('/api/economy/wallet/<agent_name>')
def api_economy_wallet(agent_name):
    """Get wallet information for agent"""
    if not economy_manager:
        return jsonify({'error': 'Economy manager not initialized'}), 500
    
    try:
        wallet = economy_manager.db.get_wallet(agent_name)
        
        if wallet:
            return jsonify({
                'agent_name': wallet.agent_name,
                'balance': str(wallet.balance),
                'locked_balance': str(wallet.locked_balance),
                'total_earned': str(wallet.total_earned),
                'total_spent': str(wallet.total_spent),
                'transaction_count': wallet.transaction_count,
                'last_activity': wallet.last_activity.isoformat()
            })
        else:
            return jsonify({'error': 'Wallet not found'}), 404
    
    except Exception as e:
        logger.error(f"Error fetching wallet: {e}")
        return jsonify({'error': 'Failed to fetch wallet'}), 500

@app.route('/api/economy/contraband/prices')
def api_contraband_prices():
    """Get current contraband prices"""
    if not economy_manager:
        return jsonify({'error': 'Economy manager not initialized'}), 500
    
    try:
        prices = []
        
        for item in economy_manager.contraband.CONTRABAND_ITEMS:
            current_price = economy_manager.contraband.calculate_contraband_price(item.item_id, {})
            risk = economy_manager.contraband.get_contraband_risk(item.item_id, 0.5)
            
            prices.append({
                'item_id': item.item_id,
                'name': item.name,
                'minecraft_item': item.minecraft_item,
                'base_value': str(item.base_value),
                'current_price': str(current_price),
                'rarity': item.rarity,
                'risk_multiplier': item.risk_multiplier,
                'risk_level': risk,
                'legal_status': item.legal_status,
                'description': item.description
            })
        
        return jsonify({
            'contraband_items': prices,
            'timestamp': datetime.now().isoformat()
        })
    
    except Exception as e:
        logger.error(f"Error fetching contraband prices: {e}")
        return jsonify({'error': 'Failed to fetch contraband prices'}), 500

@app.route('/api/factions/list')
def api_factions_list():
    """Get list of all factions"""
    if not faction_manager:
        return jsonify({'error': 'Faction manager not initialized'}), 500
    
    try:
        factions_data = []
        
        for faction_name, faction in faction_manager.factions.items():
            factions_data.append({
                'name': faction.name,
                'type': faction.faction_type.value,
                'leader': faction.leader,
                'member_count': len(faction.members),
                'members': list(faction.members),
                'treasury': str(faction.treasury),
                'reputation': faction.reputation,
                'power': faction.power,
                'territories': faction.territories,
                'allies': list(faction.allies),
                'enemies': list(faction.enemies),
                'created_at': faction.created_at.isoformat(),
                'description': faction.description,
                'color': faction.color,
                'motto': faction.motto
            })
        
        return jsonify({
            'factions': factions_data,
            'total_count': len(factions_data),
            'timestamp': datetime.now().isoformat()
        })
    
    except Exception as e:
        logger.error(f"Error fetching factions: {e}")
        return jsonify({'error': 'Failed to fetch factions'}), 500

@app.route('/api/factions/rankings')
def api_factions_rankings():
    """Get faction power rankings"""
    if not faction_manager:
        return jsonify({'error': 'Faction manager not initialized'}), 500
    
    try:
        rankings = faction_manager.get_faction_rankings()
        
        for i, faction in enumerate(rankings):
            faction['rank'] = i + 1
        
        return jsonify({
            'rankings': rankings,
            'timestamp': datetime.now().isoformat()
        })
    
    except Exception as e:
        logger.error(f"Error fetching faction rankings: {e}")
        return jsonify({'error': 'Failed to fetch faction rankings'}), 500

@app.route('/api/factions/wars')
def api_factions_wars():
    """Get active wars"""
    if not faction_manager:
        return jsonify({'error': 'Faction manager not initialized'}), 500
    
    try:
        wars_data = []
        
        for war_id, war in faction_manager.active_wars.items():
            wars_data.append({
                'war_id': war.war_id,
                'faction_a': war.faction_a,
                'faction_b': war.faction_b,
                'status': war.status.value,
                'started_at': war.started_at.isoformat(),
                'reason': war.reason,
                'score_a': war.score_a,
                'score_b': war.score_b,
                'stakes': war.stakes
            })
        
        return jsonify({
            'active_wars': wars_data,
            'war_count': len(wars_data),
            'timestamp': datetime.now().isoformat()
        })
    
    except Exception as e:
        logger.error(f"Error fetching wars: {e}")
        return jsonify({'error': 'Failed to fetch wars'}), 500

@app.route('/api/bounties/active')
def api_bounties_active():
    """Get active bounties"""
    if not faction_manager:
        return jsonify({'error': 'Faction manager not initialized'}), 500
    
    try:
        conn = sqlite3.connect(faction_manager.db.db_path)
        cursor = conn.cursor()
        
        cursor.execute("""
            SELECT * FROM bounties 
            WHERE active = 1 AND expires_at > ? 
            ORDER BY amount DESC
        """, (datetime.now().isoformat(),))
        
        bounties = []
        for row in cursor.fetchall():
            bounties.append({
                'bounty_id': row[0],
                'target_agent': row[1],
                'issuer': row[2],
                'amount': str(row[3]),
                'reason': row[4],
                'expires_at': row[5]
            })
        
        conn.close()
        
        return jsonify({
            'active_bounties': bounties,
            'bounty_count': len(bounties),
            'timestamp': datetime.now().isoformat()
        })
    
    except Exception as e:
        logger.error(f"Error fetching bounties: {e}")
        return jsonify({'error': 'Failed to fetch bounties'}), 500

@app.route('/api/bounties/claim', methods=['POST'])
def api_bounties_claim():
    """Claim bounty when target is killed"""
    if not faction_manager:
        return jsonify({'error': 'Faction manager not initialized'}), 500
    
    try:
        data = request.get_json()
        killer = data.get('killer')
        victim = data.get('victim')
        
        if not killer or not victim:
            return jsonify({'error': 'Killer and victim required'}), 400
        
        # Check for active bounties on victim
        conn = sqlite3.connect(faction_manager.db.db_path)
        cursor = conn.cursor()
        
        cursor.execute("""
            SELECT bounty_id, amount FROM bounties 
            WHERE target_agent = ? AND active = 1 AND expires_at > ?
        """, (victim, datetime.now().isoformat()))
        
        bounty_row = cursor.fetchone()
        conn.close()
        
        if bounty_row:
            bounty_id, amount = bounty_row
            success = faction_manager.claim_bounty(bounty_id, killer)
            
            if success:
                # Broadcast bounty claim
                socketio.emit('bounty_claimed', {
                    'bounty_id': bounty_id,
                    'killer': killer,
                    'victim': victim,
                    'amount': str(amount),
                    'timestamp': datetime.now().isoformat()
                })
                
                return jsonify({
                    'success': True,
                    'bounty_id': bounty_id,
                    'amount': str(amount),
                    'message': f'Bounty claimed by {killer}'
                })
            else:
                return jsonify({'error': 'Failed to claim bounty'}), 500
        else:
            return jsonify({'success': False, 'message': 'No active bounty found'})
    
    except Exception as e:
        logger.error(f"Error claiming bounty: {e}")
        return jsonify({'error': 'Failed to claim bounty'}), 500

# Dashboard Routes

@app.route('/')
def dashboard_home():
    """Main dashboard page"""
    return render_template('dashboard.html')

@app.route('/agents')
def dashboard_agents():
    """Agent dashboard page"""
    return render_template('agents.html')

@app.route('/economy')
def dashboard_economy():
    """Economy dashboard page"""
    return render_template('economy.html')

@app.route('/factions')
def dashboard_factions():
    """Faction dashboard page"""
    return render_template('factions.html')

# WebSocket Events

@socketio.on('connect')
def handle_connect():
    """Handle WebSocket connection"""
    connected_clients.add(request.sid)
    emit('connected', {'message': 'Connected to ClawCraft WebSocket'})
    logger.info(f"Client connected: {request.sid}")

@socketio.on('disconnect')
def handle_disconnect():
    """Handle WebSocket disconnection"""
    connected_clients.discard(request.sid)
    logger.info(f"Client disconnected: {request.sid}")

@socketio.on('subscribe_agents')
def handle_subscribe_agents():
    """Subscribe to agent updates"""
    emit('subscription_confirmed', {'channel': 'agents'})

@socketio.on('subscribe_economy')
def handle_subscribe_economy():
    """Subscribe to economy updates"""
    emit('subscription_confirmed', {'channel': 'economy'})

@socketio.on('subscribe_factions')
def handle_subscribe_factions():
    """Subscribe to faction updates"""
    emit('subscription_confirmed', {'channel': 'factions'})

# Background tasks

def broadcast_live_updates():
    """Broadcast live updates to connected clients"""
    while True:
        try:
            if connected_clients:
                # Broadcast agent status updates
                if agent_manager:
                    agents_data = agent_manager.get_agent_stats()
                    socketio.emit('agents_update', {
                        'agents': agents_data,
                        'timestamp': datetime.now().isoformat()
                    })
                
                # Broadcast economy updates
                if economy_manager:
                    stats = economy_manager.get_economy_stats()
                    socketio.emit('economy_update', {
                        'total_supply': str(stats['total_supply']),
                        'volume_24h': str(stats['volume_24h']),
                        'timestamp': datetime.now().isoformat()
                    })
                
                # Broadcast faction updates
                if faction_manager:
                    rankings = faction_manager.get_faction_rankings()
                    socketio.emit('factions_update', {
                        'rankings': rankings,
                        'timestamp': datetime.now().isoformat()
                    })
            
            # Update every 10 seconds
            socketio.sleep(10)
        
        except Exception as e:
            logger.error(f"Error in broadcast updates: {e}")
            socketio.sleep(5)

if __name__ == '__main__':
    # Initialize managers
    if not initialize_managers():
        logger.error("Failed to initialize, exiting")
        sys.exit(1)
    
    # Start background update thread
    update_thread = threading.Thread(target=broadcast_live_updates, daemon=True)
    update_thread.start()
    
    # Start Flask-SocketIO server
    logger.info("Starting ClawCraft Web API server on port 8000")
    socketio.run(app, host='0.0.0.0', port=8000, debug=False, allow_unsafe_werkzeug=True)