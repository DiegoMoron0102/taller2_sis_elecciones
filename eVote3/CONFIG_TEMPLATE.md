# Configuration Template

## Deployment Configuration

When deploying to testnet/mainnet, copy this file to `.env` and fill in your values:

```bash
# Network Configuration
NETWORK=sepolia  # or base-sepolia, mainnet, etc.

# RPC URLs
SEPOLIA_RPC_URL=https://rpc.sepolia.org
BASE_SEPOLIA_RPC_URL=https://sepolia.base.org

# Private Key (NEVER COMMIT THIS!)
DEPLOYER_PRIVATE_KEY=your_private_key_here

# Etherscan API Key (for contract verification)
ETHERSCAN_API_KEY=your_api_key_here
BASESCAN_API_KEY=your_api_key_here

# Contract Parameters
CANDIDATE_NAMES=["Candidate A", "Candidate B", "Blank Vote"]
INITIAL_NULLIFIERS_COUNT=100

# Admin Configuration
ADMIN_ADDRESS=0x...
MULTISIG_ADDRESS=0x...  # For production

# Frontend Configuration
REACT_APP_CONTRACT_ADDRESS=0x...
REACT_APP_NETWORK=sepolia
REACT_APP_INFURA_ID=your_infura_id
```

---

## Hardhat Configuration (Optional)

If using Hardhat instead of Remix:

```javascript
// hardhat.config.js
require("@nomicfoundation/hardhat-toolbox");
require("dotenv").config();

module.exports = {
  solidity: "0.8.20",
  networks: {
    sepolia: {
      url: process.env.SEPOLIA_RPC_URL,
      accounts: [process.env.DEPLOYER_PRIVATE_KEY],
      chainId: 11155111
    },
    baseSepolia: {
      url: process.env.BASE_SEPOLIA_RPC_URL,
      accounts: [process.env.DEPLOYER_PRIVATE_KEY],
      chainId: 84532
    }
  },
  etherscan: {
    apiKey: {
      sepolia: process.env.ETHERSCAN_API_KEY,
      baseSepolia: process.env.BASESCAN_API_KEY
    }
  }
};
```

---

## Deployment Addresses

Keep track of deployed contracts:

```json
{
  "sepolia": {
    "DemoVoteNullifier": {
      "address": "0x...",
      "deploymentBlock": 12345678,
      "deployer": "0x...",
      "timestamp": "2025-12-07T10:00:00Z",
      "txHash": "0x..."
    }
  },
  "baseSepolia": {
    "DemoVoteNullifier": {
      "address": "0x...",
      "deploymentBlock": 87654321,
      "deployer": "0x...",
      "timestamp": "2025-12-07T11:00:00Z",
      "txHash": "0x..."
    }
  }
}
```

---

## Election Configuration Template

```json
{
  "election": {
    "id": "election-2025-001",
    "name": "Student Council Election 2025",
    "description": "Annual student council representative election",
    "startDate": "2025-12-10T09:00:00Z",
    "endDate": "2025-12-12T18:00:00Z",
    "candidates": [
      {
        "index": 0,
        "name": "Maria Garcia",
        "party": "Progressive Students",
        "description": "Focus on sustainability initiatives"
      },
      {
        "index": 1,
        "name": "John Smith",
        "party": "Tech Innovation Group",
        "description": "Improve digital infrastructure"
      },
      {
        "index": 2,
        "name": "Blank Vote",
        "party": null,
        "description": "Abstention option"
      }
    ],
    "eligibleVoters": 500,
    "nullifiersGenerated": 500,
    "contractAddress": "0x...",
    "network": "sepolia"
  }
}
```

---

## Nullifier Distribution Template

For organizing how to distribute tokens to voters:

```csv
VoterID,Email,TokenDeliveryMethod,TokenHash,Status
V001,voter1@example.com,email,0x1a2b3c...,sent
V002,voter2@example.com,sms,0x2b3c4d...,sent
V003,voter3@example.com,app,0x3c4d5e...,pending
```

**Security Note**: This file contains sensitive data. Store securely and delete after election.

---

## Testing Configuration

```json
{
  "testVoters": 5,
  "testCandidates": ["Test A", "Test B", "Test C"],
  "autoVoteDistribution": {
    "0": 2,
    "1": 2,
    "2": 1
  },
  "testNetwork": "sepolia",
  "gasLimit": 500000,
  "gasPrice": "auto"
}
```

---

## Monitoring Configuration

For production deployments:

```json
{
  "monitoring": {
    "enabled": true,
    "alertEmail": "admin@example.com",
    "alertWebhook": "https://hooks.slack.com/...",
    "checkInterval": 60,
    "alerts": {
      "electionOpened": true,
      "electionClosed": true,
      "voteThreshold": 100,
      "errorRate": 0.01,
      "gasPrice": 100
    }
  },
  "analytics": {
    "trackVotes": true,
    "trackGas": true,
    "trackErrors": true,
    "dashboard": "https://dashboard.example.com"
  }
}
```

---

## Security Checklist

Before production deployment:

- [ ] Private keys stored in secure vault (not .env file)
- [ ] Contract audited by professional firm
- [ ] Admin transferred to multisig wallet
- [ ] Emergency pause mechanism tested
- [ ] Rate limiting implemented
- [ ] Monitoring and alerting active
- [ ] Backup and recovery plan documented
- [ ] Legal compliance verified
- [ ] Privacy policy published
- [ ] Terms of service accepted by voters

---

## Backup Configuration

```bash
# Backup script
#!/bin/bash

# Backup contract events
cast logs \
  --address 0x... \
  --from-block 12345678 \
  --to-block latest \
  --rpc-url $SEPOLIA_RPC_URL \
  > backup-events-$(date +%Y%m%d).json

# Backup contract state
cast storage \
  0x... \
  --rpc-url $SEPOLIA_RPC_URL \
  > backup-state-$(date +%Y%m%d).json

echo "Backup completed: $(date)"
```

---

## Support Contacts

```yaml
support:
  technical:
    name: "Technical Team"
    email: "tech@example.com"
    phone: "+1-xxx-xxx-xxxx"
  
  administrative:
    name: "Election Committee"
    email: "election@example.com"
    hours: "9am-5pm UTC"
  
  emergency:
    name: "Security Team"
    email: "security@example.com"
    phone: "+1-xxx-xxx-xxxx"
    available: "24/7"
```

---

**Note**: Never commit sensitive configuration files (`.env`, private keys, voter data) to version control!
