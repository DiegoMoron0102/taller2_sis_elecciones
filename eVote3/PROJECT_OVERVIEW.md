# eVote3 - Blockchain Voting System

```
╔═══════════════════════════════════════════════════════════════╗
║                                                               ║
║   🗳️  eVote3 - Decentralized Anonymous Voting System        ║
║                                                               ║
║   ✓ Anonymous voting with nullifiers                         ║
║   ✓ Double-vote prevention on-chain                          ║
║   ✓ Verifiable counting                                      ║
║   ✓ Ready for Sepolia / Base Sepolia testnet                ║
║                                                               ║
╚═══════════════════════════════════════════════════════════════╝
```

## 📁 Project Structure

```
eVote3/
│
├── 📄 README.md              ← Complete documentation
├── 🚀 QUICKSTART.md          ← 5-minute guide
│
├── 📜 contracts/
│   └── DemoVoteNullifier.sol ← Main smart contract
│
├── 🛠️ scripts/
│   ├── generateNullifiers.js  ← CLI tool (Node.js)
│   └── generateNullifiers.html ← Web tool (browser)
│
├── 📚 docs/
│   ├── PRESENTATION.md       ← Presentation guide for tribunal
│   ├── EXAMPLES.md           ← Usage examples
│   └── DEPLOYMENT.md         ← Deployment guide
│
├── 📦 package.json           ← npm configuration
└── 📜 LICENSE                ← MIT License
```

---

## 🎯 What is This?

A **demonstration prototype** of a blockchain-based voting system that proves three key concepts:

1. **Anonymous Eligibility**: Voters use cryptographic nullifiers (hashes) instead of identities
2. **Double-Vote Prevention**: Smart contract ensures each nullifier can only vote once
3. **Verifiable Counting**: Anyone can audit results on the public blockchain

---

## ⚡ Quick Start

### 1. Generate Nullifiers
```bash
# Option A: Browser
Open scripts/generateNullifiers.html

# Option B: Terminal
node scripts/generateNullifiers.js 5
```

### 2. Deploy Contract
```
1. Open https://remix.ethereum.org
2. Copy contracts/DemoVoteNullifier.sol
3. Compile with Solidity 0.8.20+
4. Deploy with MetaMask on Sepolia
```

### 3. Run Election
```javascript
registerNullifiers([...])  // Register voter hashes
openElection()             // Open voting window
castVote(nullifier, index) // Vote anonymously
getCandidate(index)        // Check results
closeElection()            // Finalize
```

---

## 📖 Documentation

- **New to this?** → Start with `QUICKSTART.md`
- **Want full details?** → Read `README.md`
- **Preparing a demo?** → Check `docs/PRESENTATION.md`
- **Need examples?** → See `docs/EXAMPLES.md`
- **Deploying?** → Follow `docs/DEPLOYMENT.md`

---

## 🏗️ How It Works

```
OFF-CHAIN                         ON-CHAIN
┌──────────────┐                 ┌──────────────────┐
│ Voter 1      │                 │                  │
│ Token: abc123│─────┐           │  Smart Contract  │
└──────────────┘     │           │                  │
                     ├─ hash ──→ │  Nullifier Set   │
┌──────────────┐     │           │  [0x1a2b, 0x2b3c]│
│ Voter 2      │     │           │                  │
│ Token: xyz789│─────┘           │  Vote Count      │
└──────────────┘                 │  Candidate A: 2  │
                                 │  Candidate B: 1  │
                                 └──────────────────┘
```

**Key Insight**: 
- Blockchain sees only hashes (0x1a2b...), never identities
- Voters keep their tokens secret (like a password)
- One token = One hash = One vote

---

## 🎓 For Academic Demos

**Perfect for demonstrating:**
- Blockchain fundamentals
- Smart contract security
- Cryptographic primitives
- Decentralized systems
- Zero-trust architectures

**Timeline for demo:**
- **2 min**: Explain concept
- **3 min**: Show live deployment
- **2 min**: Demonstrate voting + double-vote prevention
- **2 min**: Show results on blockchain explorer
- **1 min**: Q&A

Total: **10 minutes** with buffer

---

## 🔐 Security Status

✅ **Implemented:**
- Nullifier-based anonymity
- Double-vote prevention
- State machine for election phases
- Event logging for auditability

⚠️ **Demo Simplifications (NOT production-ready):**
- No ZK-SNARK proofs (use hash instead)
- Single admin wallet (should be multisig/DAO)
- No rate limiting
- Testnet only (not audited)

---

## 🌐 Supported Networks

| Network | Chain ID | RPC | Faucet |
|---------|----------|-----|--------|
| **Sepolia** | 11155111 | https://rpc.sepolia.org | [Link](https://sepoliafaucet.com) |
| **Base Sepolia** | 84532 | https://sepolia.base.org | [Link](https://docs.base.org/tools/faucets/) |

---

## 🚀 Roadmap

### Phase 1: Demo (Current)
- [x] Core smart contract
- [x] Nullifier generation tools
- [x] Deployment guides
- [x] Documentation

### Phase 2: Enhanced Security
- [ ] ZK-SNARK integration (Circom)
- [ ] Multisig admin
- [ ] Rate limiting
- [ ] Professional audit

### Phase 3: Production
- [ ] Web frontend (React)
- [ ] Mobile app (React Native)
- [ ] Layer 2 mainnet deployment
- [ ] Identity integration (eID/DID)

### Phase 4: Scale
- [ ] Multi-election support
- [ ] Delegation features
- [ ] Advanced analytics
- [ ] Government partnerships

---

## 📊 Comparison

| Feature | Paper Voting | E-Voting (Centralized) | eVote3 (Blockchain) |
|---------|--------------|------------------------|---------------------|
| Anonymity | ✅ Good | ⚠️ Trusted | ✅ Cryptographic |
| Fraud Prevention | ⚠️ Limited | ⚠️ Single point | ✅ Distributed |
| Auditability | ❌ Hard | ❌ Black box | ✅ Public |
| Speed | ❌ Slow | ✅ Fast | ✅ Fast |
| Cost | ❌ High | ⚠️ Medium | ✅ Low (L2) |

---

## 🛠️ Tech Stack

- **Smart Contracts**: Solidity 0.8.20+
- **Blockchain**: Ethereum (Sepolia testnet)
- **Tools**: Remix IDE, MetaMask
- **Hashing**: Keccak256
- **Frontend**: HTML/JavaScript (vanilla)

**Future additions:**
- ZK-SNARKs: Circom + SnarkJS
- Frontend: React + ethers.js
- Backend: Node.js + PostgreSQL
- L2: Base / Optimism / Arbitrum

---

## 🤝 Contributing

This is a demonstration project. To contribute:

1. Fork the repo
2. Create a feature branch
3. Add tests if applicable
4. Submit pull request

**Areas needing help:**
- ZK-SNARK integration
- Frontend development
- Security auditing
- Documentation translation

---

## 📜 License

MIT License - See `LICENSE` file

**Disclaimer**: This is a prototype for educational purposes. Not audited. Do not use for real elections without professional security review.

---

## 📞 Support

- **Issues**: [GitHub Issues](https://github.com/tu-usuario/eVote3/issues)
- **Docs**: All guides in `/docs` folder
- **Examples**: See `docs/EXAMPLES.md`

---

## 🎉 Acknowledgments

- **Ethereum Foundation**: For Sepolia testnet
- **Base Team**: For Base Sepolia infrastructure
- **Remix Team**: For the excellent web IDE
- **OpenZeppelin**: For Solidity best practices

---

## 📈 Stats

- **Lines of Code**: ~300 (Solidity)
- **Functions**: 10 public functions
- **Events**: 5 event types
- **Gas per vote**: ~80,000 gas (~$0.01 on L2)
- **TPS**: Limited by L1 (~15), unlimited on L2 rollups

---

## 🔬 Research

This project is inspired by:

- **Helios Voting**: Web-based cryptographic voting
- **Vocdoni**: Blockchain voting infrastructure
- **Horizon**: Ethereum-based liquid democracy
- **Academic research**: ZK-SNARKs for anonymous credentials

**Key papers:**
- Ben-Sasson et al. (2014): "Zerocash"
- Buterin (2014): "Ethereum Whitepaper"
- Kosba et al. (2016): "Hawk: Privacy-preserving smart contracts"

---

## 🎯 Use Cases

### ✅ Appropriate for Demo
- University student elections
- Small organization voting
- Community decisions
- Proof-of-concept demonstrations
- Academic research

### ⚠️ Needs Enhancement
- Municipal elections (add ZK-SNARKs)
- Corporate shareholder voting (add weighted votes)
- National referendums (add L2 + audit)

### ❌ Not Suitable (Yet)
- Government elections (requires full production stack)
- High-stakes voting (needs security audit)

---

```
╔═══════════════════════════════════════════════════════════════╗
║                                                               ║
║  Ready to revolutionize democracy with blockchain?           ║
║                                                               ║
║  Start with: QUICKSTART.md                                   ║
║  Questions?: docs/EXAMPLES.md                                ║
║  Deploy now: docs/DEPLOYMENT.md                              ║
║                                                               ║
║  🗳️ Let's make voting transparent, secure, and auditable.   ║
║                                                               ║
╚═══════════════════════════════════════════════════════════════╝
```

---

**Made with 💜 for decentralized democracy**

**Version**: 1.0.0  
**Status**: Demo Ready ✓  
**Last Updated**: December 2025
