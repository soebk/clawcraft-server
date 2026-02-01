# Manual BaseScan Verification Guide

## 🔍 Contract Addresses to Verify

1. **IdentityRegistry**: `0xc488c53fdd58b2f71D4F3469D89458bE0B3a3C41`
2. **ReputationRegistry**: `0x2a517f0E8CAa4283dcc0e00D284263766c4d3bc4` 
3. **ValidationRegistry**: `0x720968f42daFD77392051b61d36f832A5fe3F6fb`

## 📋 Verification Details

### Contract Settings:
- **Compiler**: Solidity 0.8.20
- **Optimization**: Enabled (200 runs)
- **License**: MIT
- **via-IR**: true

### Constructor Arguments:
- **IdentityRegistry**: (none)
- **ReputationRegistry**: `0xc488c53fdd58b2f71D4F3469D89458bE0B3a3C41`
- **ValidationRegistry**: `0xc488c53fdd58b2f71D4F3469D89458bE0B3a3C41`

## 🌐 Manual Verification Steps

### For IdentityRegistry:
1. Go to: https://basescan.org/address/0xc488c53fdd58b2f71D4F3469D89458bE0B3a3C41#code
2. Click "Verify and Publish"
3. Select "Solidity (Single file)" or "Solidity (Standard JSON Input)"
4. Upload source code from: `/root/projects/clawcraft/contracts/contracts/IdentityRegistry.sol`
5. Set compiler to 0.8.20, optimization ON (200 runs), via-IR enabled

### For ReputationRegistry:
1. Go to: https://basescan.org/address/0x2a517f0E8CAa4283dcc0e00D284263766c4d3bc4#code
2. Upload source: `/root/projects/clawcraft/contracts/contracts/ReputationRegistry.sol`
3. Constructor arg: `0xc488c53fdd58b2f71D4F3469D89458bE0B3a3C41`

### For ValidationRegistry:
1. Go to: https://basescan.org/address/0x720968f42daFD77392051b61d36f832A5fe3F6fb#code
2. Upload source: `/root/projects/clawcraft/contracts/contracts/ValidationRegistry.sol`
3. Constructor arg: `0xc488c53fdd58b2f71D4F3469D89458bE0B3a3C41`

## 📄 Source Code Files Ready for Upload

Source files are located at:
- `/root/projects/clawcraft/contracts/contracts/IdentityRegistry.sol`
- `/root/projects/clawcraft/contracts/contracts/ReputationRegistry.sol`  
- `/root/projects/clawcraft/contracts/contracts/ValidationRegistry.sol`