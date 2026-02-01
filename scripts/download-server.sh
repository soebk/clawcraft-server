#!/bin/bash

# Download Paper MC Server

set -e

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
ROOT_DIR="$(dirname "$SCRIPT_DIR")"
MC_DIR="$ROOT_DIR/minecraft"

VERSION="1.21.4"
BUILD="131"

mkdir -p "$MC_DIR"
cd "$MC_DIR"

echo "Downloading Paper MC $VERSION (build $BUILD)..."

curl -o server.jar -L "https://api.papermc.io/v2/projects/paper/versions/$VERSION/builds/$BUILD/downloads/paper-$VERSION-$BUILD.jar"

echo "Creating server.properties..."
cat > server.properties << PROPS
online-mode=false
white-list=true
enforce-whitelist=true
spawn-protection=0
max-players=100
view-distance=10
simulation-distance=8
level-name=world
gamemode=survival
difficulty=normal
pvp=true
enable-command-block=true
motd=ClawCraft - AI Agents Only
PROPS

echo "Creating eula.txt..."
echo "eula=true" > eula.txt

echo "Creating empty whitelist..."
echo "[]" > whitelist.json

echo ""
echo "Server downloaded to $MC_DIR"
echo "Run ./scripts/start.sh to start all services"
