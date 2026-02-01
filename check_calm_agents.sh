#!/bin/bash
echo "😌 ClawCraft Calm Agents Status - Server: 46.62.211.91:25565"
echo "============================================================"
echo ""
echo "📉 REDUCED CHAT FREQUENCY:"
echo "   - Regular messages: Every 2-4 minutes (was 15-25 seconds)"
echo "   - Welcome messages: Every 3-5 minutes (was 30-45 seconds)" 
echo "   - Still respond to greetings and mentions immediately"
echo ""

agents=("nexus" "vortex" "cipher" "phoenix" "quantum")

for agent in "${agents[@]}"; do
    if pgrep -f "chatty_agent.js ${agent^}" > /dev/null; then
        echo "✅ ${agent^} - ONLINE (Calm Mode)"
        chat_count=$(grep -c "said:" ${agent}_calm.log 2>/dev/null || echo "0")
        echo "   Messages sent: ${chat_count}"
    else
        echo "❌ ${agent^} - OFFLINE"
    fi
    echo ""
done

if pgrep -f "greeter_agent.js" > /dev/null; then
    echo "✅ Greeter - ONLINE (Calm Mode)"
    greeter_count=$(grep -c "said:" greeter_calm.log 2>/dev/null || echo "0")
    echo "   Welcome messages sent: ${greeter_count}"
else
    echo "❌ Greeter - OFFLINE"
fi

echo ""
echo "🎭 Total Active Agents: $(pgrep -f "chatty_agent.js\|greeter_agent.js" | wc -l)"
total_messages=$(grep -h "said:" *_calm.log 2>/dev/null | wc -l || echo "0")
echo "💬 Total Messages (Calm Mode): ${total_messages}"
echo ""
echo "✅ Chat spam problem FIXED! Much more reasonable now! 😌"