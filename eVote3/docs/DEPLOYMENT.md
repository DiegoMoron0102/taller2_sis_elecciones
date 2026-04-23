# Deployment Guide - eVote3

## Quick Deployment to Sepolia/Base Sepolia

### Prerequisites
- MetaMask installed and configured
- Test ETH from a faucet (0.01+ ETH)
- Remix IDE open: https://remix.ethereum.org

---

## Step-by-Step Deployment

### 1. Prepare the Contract

1. Open Remix: https://remix.ethereum.org
2. Create new file: `DemoVoteNullifier.sol`
3. Copy the contract code from `contracts/DemoVoteNullifier.sol`

### 2. Compile

1. Go to "Solidity Compiler" tab
2. Select compiler version: **0.8.20+**
3. Click "Compile DemoVoteNullifier.sol"
4. Wait for green checkmark ✓

### 3. Configure MetaMask

**For Sepolia:**
- Network name: `Sepolia`
- RPC URL: `https://rpc.sepolia.org`
- Chain ID: `11155111`
- Currency: `ETH`
- Block explorer: `https://sepolia.etherscan.io`

**For Base Sepolia:**
- Network name: `Base Sepolia`
- RPC URL: `https://sepolia.base.org`
- Chain ID: `84532`
- Currency: `ETH`
- Block explorer: `https://sepolia.basescan.org`

### 4. Deploy

1. Go to "Deploy & Run Transactions" tab
2. Environment: **Injected Provider - MetaMask**
3. Verify MetaMask shows correct network
4. In constructor field, enter candidates:
   ```
   ["Candidate A", "Candidate B", "Blank Vote"]
   ```
5. Click **"Deploy"**
6. Confirm transaction in MetaMask
7. Wait for confirmation
8. Copy contract address (show in "Deployed Contracts")

### 5. Verify Deployment

Check your contract on block explorer:
- **Sepolia**: `https://sepolia.etherscan.io/address/YOUR_ADDRESS`
- **Base Sepolia**: `https://sepolia.basescan.org/address/YOUR_ADDRESS`

---

## Configuration Checklist

After deployment, execute these functions in order:

### Phase 1: Setup (State = 0)

- [ ] Generate nullifiers using `scripts/generateNullifiers.html`
- [ ] Call `registerNullifiers([...])` with generated hashes
- [ ] Verify event `NullifiersRegistered` in Remix console
- [ ] (Optional) Call `addCandidate("New Candidate")` if needed

### Phase 2: Open Election (State = 1)

- [ ] Call `openElection()`
- [ ] Verify `state()` returns `1`
- [ ] Ready to accept votes!

### Phase 3: Voting

- [ ] Users call `castVote(nullifier, candidateIndex)`
- [ ] Verify `VoteCast` events in Remix console
- [ ] Check results with `getCandidate(index)`

### Phase 4: Close Election (State = 2)

- [ ] Call `closeElection()`
- [ ] Verify `state()` returns `2`
- [ ] Votes are now finalized

---

## Gas Costs Estimates

### Ethereum Sepolia (testnet, free ETH from faucet)

| Action | Gas (approx) | Cost (at 20 gwei) |
|--------|--------------|-------------------|
| Deploy contract | ~1,500,000 | ~0.03 ETH |
| Register 10 nullifiers | ~250,000 | ~0.005 ETH |
| Open election | ~50,000 | ~0.001 ETH |
| Cast vote | ~80,000 | ~0.0016 ETH |
| Close election | ~30,000 | ~0.0006 ETH |

### Base Sepolia (testnet, free ETH from faucet)

Gas costs are typically 50-90% lower than Ethereum.

---

## Troubleshooting

### Issue: "Insufficient funds"
**Solution**: Get more test ETH from a faucet

### Issue: "Transaction failed: out of gas"
**Solution**: Increase gas limit in MetaMask

### Issue: "Contract not showing in Remix"
**Solution**: Copy contract address, go to "At Address" button

### Issue: "MetaMask not connecting"
**Solution**: 
1. Refresh Remix page
2. Disconnect and reconnect MetaMask
3. Try different browser

### Issue: "Cannot call functions"
**Solution**: Make sure you're using the wallet that deployed the contract (admin)

---

## Post-Deployment

### Verify Contract on Etherscan (Optional)

1. Go to your contract on Etherscan
2. Click "Contract" tab → "Verify and Publish"
3. Select compiler version (0.8.20)
4. Paste contract code
5. Submit for verification

Benefits:
- Users can read contract directly on Etherscan
- Increased transparency and trust

### Share Contract Details

Create a document with:
- Contract address
- Network (Sepolia/Base Sepolia)
- Etherscan link
- Candidate list
- Deployment date/time

---

## Deployment Script (Advanced)

If you prefer using Hardhat or Foundry:

### Hardhat

```javascript
// scripts/deploy.js
const hre = require("hardhat");

async function main() {
  const DemoVoteNullifier = await hre.ethers.getContractFactory("DemoVoteNullifier");
  const contract = await DemoVoteNullifier.deploy([
    "Candidate A",
    "Candidate B", 
    "Blank Vote"
  ]);

  await contract.deployed();
  console.log("Contract deployed to:", contract.address);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
```

Run:
```bash
npx hardhat run scripts/deploy.js --network sepolia
```

### Foundry

```bash
forge create DemoVoteNullifier \
  --rpc-url https://rpc.sepolia.org \
  --private-key YOUR_PRIVATE_KEY \
  --constructor-args '["Candidate A","Candidate B","Blank Vote"]'
```

---

## Security Checklist

Before deploying to production:

- [ ] Code audited by professional security firm
- [ ] ZK-SNARK integration implemented
- [ ] Admin role transferred to multisig wallet or DAO
- [ ] Deployed to mainnet Layer 2 (not testnet)
- [ ] Emergency pause mechanism added
- [ ] Rate limiting implemented
- [ ] Monitoring and alerting set up

---

## Next Steps

After successful deployment:

1. Generate nullifiers for your voters
2. Register nullifiers in the contract
3. Open the election
4. Distribute tokens to voters securely
5. Monitor voting in real-time
6. Close election and publish results
7. Archive data for future reference

---

## Support

If you encounter issues:

1. Check Remix console for error messages
2. Verify MetaMask is on correct network
3. Check Etherscan for transaction details
4. Review `docs/EXAMPLES.md` for common scenarios
5. Open GitHub issue with details

---

**Deployment complete! Ready to demonstrate democratic voting on blockchain. 🗳️**
