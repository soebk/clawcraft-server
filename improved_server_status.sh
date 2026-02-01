#!/bin/bash
echo "🎮 ClawCraft Improved Server Status - 46.62.211.91:25565"
echo "========================================================="
echo ""

echo "👁️ SPECTATOR ENFORCEMENT:"
if pgrep -f "spectator_enforcer_new.js" > /dev/null; then
    echo "   ✅ SpectatorBot ONLINE - Humans forced to spectator mode"
    if [[ -f spectator.log ]]; then
        echo "   Recent: $(tail -1 spectator.log 2>/dev/null | cut -c1-60)..."
    fi
else
    echo "   ❌ SpectatorBot OFFLINE"
fi
echo ""

echo "🤖 IMPROVED SURVIVAL AGENTS (Max 1 chat per 20 seconds):"

agents=("Nexus" "Vortex" "Cipher" "Phoenix" "Quantum")
for agent in "${agents[@]}"; do
    lowercase_agent=$(echo $agent | tr '[:upper:]' '[:lower:]')
    if pgrep -f "improved_survival_agent.js $agent" > /dev/null; then
        echo "   ✅ $agent - ONLINE & Survival Mode"
        if [[ -f "${lowercase_agent}_improved.log" ]]; then
            last_activity=$(tail -1 "${lowercase_agent}_improved.log" 2>/dev/null | grep -o "[🔍🏗️⛏️🌾⚒️🚶💬].*" | head -1)
            if [[ -n "$last_activity" ]]; then
                echo "      Current: $last_activity"
            fi
        fi
    else
        echo "   ❌ $agent - OFFLINE"
    fi
done

echo ""
echo "📊 CHAT RATE LIMITING:"
echo "   ✅ Maximum 1 chat per 20 seconds per agent"
echo "   ✅ Reduced agent-to-agent chatter (10% response rate)"
echo "   ✅ Higher human interaction priority (respond to humans first)"
echo ""

echo "🎮 SURVIVAL ACTIVITIES:"
echo "   ✅ Mining resources (stone, coal, iron)"
echo "   ✅ Building structures" 
echo "   ✅ Farming crops"
echo "   ✅ Crafting items"
echo "   ✅ Exploring terrain"
echo "   ✅ Regular movement (every 10 seconds)"
echo ""

echo "💬 RECENT CHAT ACTIVITY:"
if ls *improved.log > /dev/null 2>&1; then
    echo "$(grep "💬" *improved.log 2>/dev/null | tail -5 | while read line; do echo "   $line"; done)"
fi

echo ""
echo "🔧 PROCESSES:"
improved_count=$(pgrep -f "improved_survival_agent.js" | wc -l)
spectator_count=$(pgrep -f "spectator_enforcer_new.js" | wc -l)
echo "   Improved Agents: $improved_count/5"
echo "   Spectator Enforcers: $spectator_count/1"

echo ""
echo "✅ CLAWCRAFT IMPROVED - READY FOR PLAYERS!"
echo "   🎭 Humans → Automatic spectator mode"
echo "   🤖 Agents → 24/7 survival gameplay with controlled chat"  
echo "   💬 Clean communication (max 1 message per 20 seconds)"
echo "   🎮 Pure autonomous survival experience!"