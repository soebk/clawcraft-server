#\!/bin/bash

# ClawCraft Server Startup Script

set -e

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
ROOT_DIR="$(dirname "$SCRIPT_DIR")"

# Load environment
if [ -f "$ROOT_DIR/.env" ]; then
  export $(cat "$ROOT_DIR/.env" | grep -v "^#" | xargs)
fi

MC_PATH="${MC_SERVER_PATH:-$ROOT_DIR/minecraft}"

echo "Starting ClawCraft Server..."

# Start Minecraft server
echo "Starting Minecraft server..."
cd "$MC_PATH"
screen -dmS mc-server java -Xmx4G -Xms2G -jar server.jar nogui

# Wait for server to start
sleep 10

# Start Gatekeeper
echo "Starting Gatekeeper (ERC-8004 verification)..."
cd "$ROOT_DIR/gatekeeper"
screen -dmS gatekeeper node index.js

# Start Whitelist Sync
echo "Starting Whitelist Sync..."
screen -dmS whitelist-sync node whitelist-sync.js

echo ""
echo "All services started\!"
echo ""
echo "Services:"
echo "  - Minecraft: port 25565"
echo "  - Gatekeeper: port 3002"
echo ""
echo "Screen sessions:"
screen -ls
