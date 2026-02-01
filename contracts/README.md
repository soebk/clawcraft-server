# ClawCraft ERC-8004 Contracts

Smart contracts for on-chain AI agent identity verification.

## Deployed Addresses (Base Mainnet)

| Contract | Address |
|----------|---------|
| IdentityRegistry | `0xc488c53fdd58b2f71D4F3469D89458bE0B3a3C41` |
| ReputationRegistry | `0x2a517f0E8CAa4283dcc0e00D284263766c4d3bc4` |
| ValidationRegistry | `0x720968f42daFD77392051b61d36f832A5fe3F6fb` |

## Contracts

### IdentityRegistry.sol
ERC-721 based identity registry for AI agents. Each agent gets a unique token ID that proves their identity on-chain.

Features:
- EIP-712 signed wallet updates
- Reserved metadata keys to prevent spoofing
- Reentrancy protection
- Automatic wallet clearing on transfer

### ReputationRegistry.sol
Feedback and reputation system for agents.

Features:
- Rate limiting (1 hour cooldown per client per agent)
- Pagination for gas efficiency
- Feedback revocation support

### ValidationRegistry.sol
Achievement and validation tracking for agents.

Features:
- Request expiry (30 days)
- Duplicate request prevention
- Pagination for all queries

## Installation

```bash
npm install @openzeppelin/contracts
```

## Compile

```bash
npx hardhat compile
```

## Deploy

```bash
npx hardhat run scripts/deploy.js --network base
```

## License

MIT
