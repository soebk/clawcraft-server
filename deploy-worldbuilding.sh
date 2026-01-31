#!/bin/bash
# ClawCraft Worldbuilding Deployment Script
# Comprehensive world transformation system

set -e  # Exit on any error

echo "🌍 CLAWCRAFT WORLDBUILDING DEPLOYMENT"
echo "===================================="
echo "Transforming ClawCraft into an AI-built civilization!"
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

log() {
    echo -e "${GREEN}[$(date +'%Y-%m-%d %H:%M:%S')]${NC} $1"
}

warn() {
    echo -e "${YELLOW}[$(date +'%Y-%m-%d %H:%M:%S')] WARNING:${NC} $1"
}

error() {
    echo -e "${RED}[$(date +'%Y-%m-%d %H:%M:%S')] ERROR:${NC} $1"
}

# Check if we're in the right directory
if [ ! -f "package.json" ] || [ ! -d "agents" ]; then
    error "Please run this script from the ClawCraft project root directory"
    exit 1
fi

# Ensure node modules are installed
if [ ! -d "node_modules" ]; then
    log "Installing dependencies..."
    npm install
fi

# Create data directory if it doesn't exist
mkdir -p data logs

log "📋 Pre-deployment checklist:"
echo "   ✓ Minecraft server running at 89.167.28.237:25565"
echo "   ✓ OpenAI API key configured"
echo "   ✓ Node.js dependencies installed"
echo ""

# Phase 1: Upgrade existing agents
log "🔧 PHASE 1: Upgrading existing agents..."
echo "   - Switching to creative mode"
echo "   - Fixing starter kits"
echo "   - Upgrading to Claude Haiku intelligence"
echo "   - Distributing spawn points"
echo ""

node scripts/upgrade-existing-agents.js
if [ $? -eq 0 ]; then
    log "✅ Phase 1 completed successfully"
else
    error "Phase 1 failed - check logs"
    exit 1
fi

echo ""
read -p "🤔 Phase 1 complete. Continue to worldbuilding deployment? (y/N): " -n 1 -r
echo ""
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    warn "Deployment paused. Run this script again to continue."
    exit 0
fi

# Phase 2: Deploy worldbuilding agents
log "🏗️ PHASE 2: Deploying worldbuilding agents..."
echo "   - 12 specialized worldbuilder agents"
echo "   - Marketplace system initialization"
echo "   - 3-hour worldbuilding phase"
echo "   - Enhanced agent deployment after building"
echo ""

# Run worldbuilding deployment in background
nohup node scripts/deploy-worldbuilders.js > logs/worldbuilding.log 2>&1 &
WORLDBUILDING_PID=$!

log "🚀 Worldbuilding deployment started (PID: $WORLDBUILDING_PID)"
echo "   📝 Logs: logs/worldbuilding.log"
echo "   ⏰ Duration: ~3 hours of intensive building"
echo ""

# Monitor initial deployment
log "📊 Monitoring initial deployment (60 seconds)..."
sleep 10

if ps -p $WORLDBUILDING_PID > /dev/null; then
    log "✅ Worldbuilding agents are deploying successfully"
else
    error "Worldbuilding deployment failed to start"
    exit 1
fi

# Show real-time log preview
log "📺 Live deployment preview (30 seconds)..."
timeout 30s tail -f logs/worldbuilding.log || true

echo ""
log "🎯 DEPLOYMENT STATUS:"
echo "   🤖 Current agents: Switched to creative mode"
echo "   🏗️  Worldbuilders: Deploying 12 specialized agents"
echo "   🏪 Marketplace: Setting up economic system"
echo "   ⏰ Timeline: 3 hours of active worldbuilding"
echo ""

# Phase 3: Setup monitoring and controls
log "🔍 PHASE 3: Setting up monitoring..."

# Create monitoring script
cat > monitor-worldbuilding.sh << 'EOF'
#!/bin/bash
# ClawCraft Worldbuilding Monitor

echo "🔍 ClawCraft Worldbuilding Monitor"
echo "================================="
echo ""

check_status() {
    if pgrep -f "deploy-worldbuilders.js" > /dev/null; then
        echo "✅ Worldbuilding system: RUNNING"
    else
        echo "❌ Worldbuilding system: STOPPED"
    fi
    
    if [ -f "data/deployment-summary.json" ]; then
        echo "📊 Latest stats:"
        cat data/deployment-summary.json | jq -r '"   Builders: " + (.worldbuilders|tostring) + ", Enhanced: " + (.enhanced_agents|tostring) + ", Phase: " + .phase'
    fi
    
    echo ""
    echo "📝 Recent log entries:"
    tail -n 5 logs/worldbuilding.log | sed 's/^/   /'
}

case "${1:-status}" in
    "status")
        check_status
        ;;
    "logs")
        echo "📝 Live worldbuilding logs (Ctrl+C to exit):"
        tail -f logs/worldbuilding.log
        ;;
    "stop")
        echo "🛑 Stopping worldbuilding deployment..."
        pkill -f "deploy-worldbuilders.js"
        echo "✅ Stopped"
        ;;
    "restart")
        echo "🔄 Restarting worldbuilding deployment..."
        pkill -f "deploy-worldbuilders.js" || true
        sleep 2
        nohup node scripts/deploy-worldbuilders.js > logs/worldbuilding.log 2>&1 &
        echo "✅ Restarted"
        ;;
    *)
        echo "Usage: ./monitor-worldbuilding.sh [status|logs|stop|restart]"
        ;;
esac
EOF

chmod +x monitor-worldbuilding.sh

# Create quick status checker
cat > status.sh << 'EOF'
#!/bin/bash
# Quick ClawCraft status check

echo "🎮 ClawCraft Status Dashboard"
echo "============================"
echo ""

# Server status
if timeout 5s nc -z 89.167.28.237 25565 2>/dev/null; then
    echo "🟢 Minecraft Server: ONLINE (89.167.28.237:25565)"
else
    echo "🔴 Minecraft Server: OFFLINE or UNREACHABLE"
fi

# Worldbuilding status
if pgrep -f "deploy-worldbuilders.js" > /dev/null; then
    echo "🟢 Worldbuilding System: RUNNING"
    
    if [ -f "data/deployment-summary.json" ]; then
        echo "📈 Progress:"
        cat data/deployment-summary.json | jq -r '"   Phase: " + .phase + " | Builders: " + (.worldbuilders|tostring) + " | Enhanced: " + (.enhanced_agents|tostring)'
        
        if [ -f "data/marketplace.json" ]; then
            SHOPS=$(cat data/marketplace.json | jq '.shops | length')
            TRADES=$(cat data/marketplace.json | jq '.trades | length')
            echo "🏪 Economy: $SHOPS shops, $TRADES trades"
        fi
    fi
else
    echo "🟡 Worldbuilding System: STOPPED"
fi

echo ""
echo "📝 Latest activity:"
if [ -f "logs/worldbuilding.log" ]; then
    tail -n 3 logs/worldbuilding.log | sed 's/^/   /'
else
    echo "   No activity logs found"
fi

echo ""
echo "🛠️  Commands:"
echo "   ./monitor-worldbuilding.sh status  - Detailed status"
echo "   ./monitor-worldbuilding.sh logs    - Live logs"
echo "   ./status.sh                       - This status check"
EOF

chmod +x status.sh

log "✅ Monitoring tools created:"
echo "   📊 ./status.sh - Quick status dashboard"
echo "   🔍 ./monitor-worldbuilding.sh - Detailed monitoring"
echo ""

# Final instructions
echo ""
echo "🎉 CLAWCRAFT WORLDBUILDING DEPLOYMENT COMPLETE!"
echo "==============================================="
echo ""
echo "🚀 What's happening now:"
echo "   🤖 12 worldbuilder agents are creating the world"
echo "   🏗️  Building: Markets, inns, forges, libraries, towers"
echo "   📜 Placing: Lore, treasure chests, hidden secrets"
echo "   ⏰ Duration: ~3 hours of intensive construction"
echo ""
echo "🛠️  Monitoring commands:"
echo "   ./status.sh                       # Quick status check"
echo "   ./monitor-worldbuilding.sh logs   # Live activity logs"
echo "   ./monitor-worldbuilding.sh stop   # Emergency stop"
echo ""
echo "📁 Important files:"
echo "   logs/worldbuilding.log           # Full deployment log"
echo "   data/deployment-summary.json     # Progress summary"
echo "   data/marketplace.json           # Economic activity"
echo ""
echo "🎯 Next phase (automatic after 3 hours):"
echo "   🧠 Enhanced intelligent agents will join"
echo "   🎮 Transition from creative building to survival gameplay"  
echo "   💰 Full economic system with trading and progression"
echo ""
echo "🌟 Your AI civilization is being born! Check back in a few hours to see the world they've created!"

log "🎪 Deployment complete! The AI architects are at work..."