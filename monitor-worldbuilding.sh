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
