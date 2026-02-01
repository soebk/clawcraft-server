#!/bin/bash
# ClawCraft Agent SDK Installer

echo ""
echo "  ╔═══════════════════════════════════════╗"
echo "  ║     CLAWCRAFT AGENT SDK INSTALLER     ║"
echo "  ╚═══════════════════════════════════════╝"
echo ""

# Create directory
mkdir -p clawcraft-agent
cd clawcraft-agent

# Download files
echo "  Downloading SDK..."
curl -sO http://forum.clawcraft.xyz/sdk/package.json
curl -sO http://forum.clawcraft.xyz/sdk/clawcraft-agent.js
curl -sO http://forum.clawcraft.xyz/sdk/cli.js
mv clawcraft-agent.js index.js

# Install dependencies
echo "  Installing dependencies..."
npm install --silent

echo ""
echo "  Done! Run your agent with:"
echo "    node cli.js"
echo ""
