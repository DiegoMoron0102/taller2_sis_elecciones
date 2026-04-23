# 🚀 Quick Start - eVote3

## 5 Minutes to Your First Blockchain Vote

### ⚡ Super Fast Setup

1. **Open Remix**: https://remix.ethereum.org
2. **Copy contract**: Paste `contracts/DemoVoteNullifier.sol`
3. **Compile**: Version 0.8.20, click compile
4. **Deploy**: Use MetaMask on Sepolia with candidates: `["A", "B", "C"]`
5. **Done!** ✓

---

## 🎯 The 3 Core Commands

### 1️⃣ Register Voters (Admin Only)
```javascript
registerNullifiers([
  "0x1a2b3c...",
  "0x2b3c4d...",
  "0x3c4d5e..."
])
```

### 2️⃣ Open Election (Admin Only)
```javascript
openElection()
```

### 3️⃣ Vote (Anyone with Nullifier)
```javascript
castVote("0x1a2b3c...", 0)  // Vote for candidate 0
```

---

## 📊 Check Results
```javascript
getCandidate(0)  // → ("Candidate A", 5 votes)
getCandidate(1)  // → ("Candidate B", 3 votes)
```

---

## 🛠️ Generate Nullifiers

**Option A**: Open `scripts/generateNullifiers.html` in browser

**Option B**: Run in terminal:
```bash
node scripts/generateNullifiers.js 5
```

---

## ⚠️ Common Mistakes

❌ Voting before calling `openElection()`
✅ Call `openElection()` first

❌ Using same nullifier twice
✅ Each nullifier can only vote once (that's the point!)

❌ Wrong candidate index
✅ Use 0, 1, 2... (not 1, 2, 3...)

---

## 🔥 Demo Script (2 Minutes)

```javascript
// 1. Register 3 nullifiers (copy from generator)
registerNullifiers(["0x111...", "0x222...", "0x333..."])

// 2. Open
openElection()

// 3. Vote
castVote("0x111...", 0)
castVote("0x222...", 1)
castVote("0x333...", 0)

// 4. Results
getCandidate(0)  // → 2 votes
getCandidate(1)  // → 1 vote

// 5. Try double vote (will fail)
castVote("0x111...", 1)  // ❌ Error!
```

---

## 📱 For the Presentation

**Show this sequence:**

1. Contract address on Etherscan
2. Call `castVote` in Remix
3. Transaction confirmed on blockchain
4. Results updated instantly
5. Try double vote → fails ✓
6. Open Etherscan → show transparent history

**Message**: 
> "Anyone can verify these results. No trust required. Just math."

---

## 🎓 Key Talking Points

- **Nullifiers = Anonymous ID** (hash, not name)
- **Blockchain = Permanent Record** (can't delete/edit votes)
- **Smart Contract = Rules Enforced** (no human can override)
- **Public = Auditable** (anyone can check, no permission needed)

---

## 📚 Full Docs

- **Complete Guide**: `README.md`
- **Presentation Script**: `docs/PRESENTATION.md`
- **Examples**: `docs/EXAMPLES.md`
- **Deployment**: `docs/DEPLOYMENT.md`

---

## 🆘 Help

**Contract not working?**
→ Check `state()` equals `1` (Open)

**Can't vote?**
→ Verify nullifier with `getNullifierStatus(hash)`

**Out of gas?**
→ Get test ETH from faucet

**Still stuck?**
→ See `docs/EXAMPLES.md` section "Error Handling"

---

**Ready? Let's vote on the blockchain! 🗳️**
