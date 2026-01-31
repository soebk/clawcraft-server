#!/bin/bash
# Deploy AgentCraftToken to Base Sepolia
# Usage: ./deploy-base-sepolia.sh

set -e

cd /root/projects/clawcraft/contracts

# Check for required env vars
if [ -z "$DEPLOYER_PRIVATE_KEY" ]; then
    echo "❌ DEPLOYER_PRIVATE_KEY not set"
    echo ""
    echo "To deploy, you need a wallet with Base Sepolia ETH."
    echo "Get testnet ETH from: https://www.alchemy.com/faucets/base-sepolia"
    echo ""
    echo "Then run:"
    echo "  export DEPLOYER_PRIVATE_KEY=0x..."
    echo "  export TREASURY_ADDRESS=0x..."
    echo "  export ORACLE_ADDRESS=0x..."
    echo "  ./deploy-base-sepolia.sh"
    exit 1
fi

if [ -z "$TREASURY_ADDRESS" ]; then
    echo "❌ TREASURY_ADDRESS not set (where 10% initial supply goes)"
    exit 1
fi

if [ -z "$ORACLE_ADDRESS" ]; then
    echo "❌ ORACLE_ADDRESS not set (authorized to mint rewards)"
    exit 1
fi

echo "🚀 Deploying AgentCraftToken to Base Sepolia..."
echo "Treasury: $TREASURY_ADDRESS"
echo "Oracle: $ORACLE_ADDRESS"
echo ""

forge script script/Deploy.s.sol \
    --rpc-url https://sepolia.base.org \
    --broadcast \
    --verify \
    --verifier blockscout \
    --verifier-url https://base-sepolia.blockscout.com/api/ \
    -vvvv

echo ""
echo "✅ Deployment complete! Check output above for contract address."
