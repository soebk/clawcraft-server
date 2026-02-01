#!/bin/bash
echo "🎮 ClawCraft Renamed Team Status - 46.62.211.91:25565"
echo "====================================================="
echo ""

echo "👑 TEAM LEADER:"
if pgrep -f "team_survival_agent.js Ansem" > /dev/null; then
    echo "   ✅ Ansem (Leader) - ONLINE"
    if [[ -f ansem.log ]]; then
        last_activity=$(tail -1 ansem.log 2>/dev/null | grep -o "[👑⛏️🏗️🔍🌾⚒️💬].*")
        echo "      Activity: $last_activity"
    fi
else
    echo "   ❌ Ansem (Leader) - OFFLINE"
fi
echo ""

echo "🤖 TEAM MEMBERS:"
agents=("BobLax" "GCR" "Alon" "Rasmr")
roles=("builder" "scout" "crafter" "researcher")
logfiles=("boblax" "gcr" "alon" "rasmr")

for i in "${!agents[@]}"; do
    agent="${agents[i]}"
    role="${roles[i]}"
    logfile="${logfiles[i]}"
    
    if pgrep -f "team_survival_agent.js $agent" > /dev/null; then
        echo "   ✅ $agent ($role) - ONLINE"
        if [[ -f "${logfile}.log" ]]; then
            last_activity=$(tail -1 "${logfile}.log" 2>/dev/null | grep -o "[🏃⛏️🏗️🔍🌾⚒️💬].*" | head -1)
            if [[ -n "$last_activity" ]]; then
                echo "      Activity: $last_activity"
            fi
        fi
    else
        echo "   ❌ $agent ($role) - OFFLINE"
    fi
done

echo ""
echo "👥 TEAM COORDINATION:"
echo "   🎯 Leader: Ansem makes movement decisions every 8 seconds"
echo "   🏃 Followers: Check team position every 5 seconds"
echo "   📏 Max distance from leader: 15 blocks"
echo "   🤝 Follow distance: 5 blocks with random offset"
echo ""

echo "💬 RECENT TEAM CHAT:"
if ls *.log > /dev/null 2>&1; then
    echo "$(grep "💬" ansem.log boblax.log gcr.log alon.log rasmr.log 2>/dev/null | tail -5 | while read line; do echo "   $line"; done)"
fi

echo ""
echo "👁️ SPECTATOR ENFORCEMENT:"
if pgrep -f "spectator_enforcer_new.js" > /dev/null; then
    echo "   ✅ SpectatorBot ONLINE - Humans forced to spectator mode"
else
    echo "   ❌ SpectatorBot OFFLINE"
fi

echo ""
echo "🔧 TEAM PROCESSES:"
team_count=$(pgrep -f "team_survival_agent.js" | wc -l)
spectator_count=$(pgrep -f "spectator_enforcer_new.js" | wc -l)
echo "   Team Agents: $team_count/5"
echo "   Spectator Enforcers: $spectator_count/1"

echo ""
echo "🎯 NEW TEAM NAMES:"
echo "   👑 Ansem (Leader) - formerly Nexus"
echo "   🏗️ BobLax (Builder) - formerly Vortex"
echo "   🔍 GCR (Scout) - formerly Cipher"
echo "   ⚒️ Alon (Crafter) - formerly Phoenix"
echo "   🔬 Rasmr (Researcher) - formerly Quantum"

echo ""
echo "✅ RENAMED TEAM CLAWCRAFT - AGENTS WORKING TOGETHER!"
echo "   🎭 Humans → Watch our coordinated AI team with new names!"
echo "   👑 Ansem leads, others follow within 15 blocks"
echo "   🤖 Same great team coordination, fresh new identities!"
echo "   💬 Coordinated team communication!"