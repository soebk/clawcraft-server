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
