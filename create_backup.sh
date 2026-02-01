#!/bin/bash
# ClawCraft Migration Backup Script

echo "🚀 Creating ClawCraft migration backup..."

# Stop agents temporarily to ensure clean backup
echo "⏸️ Temporarily stopping AI agents..."
killall -TERM node 2>/dev/null || true
sleep 3

# Create backup directory with timestamp
BACKUP_NAME="clawcraft-backup-$(date +%Y%m%d-%H%M%S)"
BACKUP_DIR="/root/$BACKUP_NAME"
mkdir -p "$BACKUP_DIR"

echo "📦 Backing up ClawCraft project..."
cp -r /root/projects/clawcraft/ "$BACKUP_DIR/"

echo "🌍 Backing up Minecraft world..."  
cp -r /root/agentcraft-server/ "$BACKUP_DIR/"

echo "🤖 Backing up OpenClaw workspace..."
if [ -d "/root/.openclaw/workspace/" ]; then
    cp -r /root/.openclaw/workspace/ "$BACKUP_DIR/"
fi

echo "📝 Creating migration info..."
cat > "$BACKUP_DIR/MIGRATION_INFO.txt" << EOF
ClawCraft Migration Backup
Created: $(date)
Server: $(hostname -I | tr -d ' ')

Contents:
- clawcraft/         : AI agent system
- agentcraft-server/ : Minecraft server + world
- workspace/         : OpenClaw assistant config

Migration Command for New Server:
tar -xzf $BACKUP_NAME.tar.gz -C /root/

Then follow MIGRATION_GUIDE.md
EOF

# Create compressed archive
echo "🗜️ Compressing backup..."
cd /root
tar -czf "$BACKUP_NAME.tar.gz" "$BACKUP_NAME/"
rm -rf "$BACKUP_DIR"

# Show results
BACKUP_SIZE=$(ls -lh "$BACKUP_NAME.tar.gz" | awk '{print $5}')
echo ""
echo "✅ Backup completed!"
echo "📁 File: /root/$BACKUP_NAME.tar.gz"  
echo "📏 Size: $BACKUP_SIZE"
echo ""
echo "🚚 Transfer to new server:"
echo "scp $BACKUP_NAME.tar.gz root@NEW_SERVER_IP:/root/"
echo ""

# Restart agents
echo "▶️ Restarting AI agents..."
cd /root/projects/clawcraft
nohup node testbuilder_monitor.js > testbuilder_monitor.log 2>&1 &
sleep 2
nohup node quick_walker.js ClawBot1 > clawbot1.log 2>&1 &
nohup node quick_walker.js ClawBot2 > clawbot2.log 2>&1 &

echo "🎮 AI agents restarted - ready for migration!"
echo "📖 See /root/projects/clawcraft/MIGRATION_GUIDE.md for next steps"