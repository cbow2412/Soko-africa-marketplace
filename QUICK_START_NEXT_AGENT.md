# ⚡ QUICK START FOR NEXT AGENT

**Read this first.** Then read `AGENT_HANDOFF.md` for full context.

---

## 🎯 YOUR FIRST TASK (5 minutes)

### Step 1: Clone & Setup
```bash
cd /home/ubuntu
gh repo clone cbow2412/Soko-africa-marketplace
cd soko
npm install
```

### Step 2: Start Frontend
```bash
npm run dev
# Opens on http://localhost:5173
```

### Step 3: Verify Backend
```bash
curl http://3.121.29.56/health
# Should return: {"status":"ok","timestamp":"..."}
```

### Step 4: Read the Handoff Document
```bash
cat AGENT_HANDOFF.md
# Read the "EXACT PROMPTS FOR NEXT AGENT" section
```

---

## 📂 Critical Files (Bookmark These)

| File | Purpose | Status |
|------|---------|--------|
| `AGENT_HANDOFF.md` | Complete state + prompts | ✅ COMPLETE |
| `MISSION_CONTROL.md` | Strategic vision | ✅ COMPLETE |
| `ARCH_MAP.md` | Technical architecture | ✅ COMPLETE |
| `server/routers-minimal.ts` | tRPC endpoints | ✅ COMPLETE |
| `server/db.ts` | Similarity search logic | ✅ COMPLETE |
| `client/src/components/VisualDiscoveryChain.tsx` | AI chaining component | ✅ COMPLETE |
| `client/src/pages/ProductDetail.tsx` | **NEEDS INTEGRATION** | ⏳ IN PROGRESS |

---

## 🚀 Your First 3 Prompts (In Order)

### Prompt 1: Visual Discovery Integration (30 mins)
```
Integrate VisualDiscoveryChain into ProductDetail.tsx.

File: client/src/pages/ProductDetail.tsx

Changes needed:
1. Import VisualDiscoveryChain (already done)
2. Replace "Similar Products" section with VisualDiscoveryChain
3. Change query from search to getSimilar
4. Test: Click product → verify discovery chain loads

Commit: "feat: Integrate Visual Discovery Chain into ProductDetail"
```

### Prompt 2: Verify Embeddings (20 mins)
```
Verify SigLIP embeddings are populated.

Check:
1. server/services/siglip-real.ts - detects Meta CDN?
2. server/db-init.ts - calls vectorization on startup?
3. server/workers/heartbeat-sync.ts - running?

If embeddings empty:
- Add console.logs to track progress
- Check if SigLIP service is accessible
- Verify Meta CDN links are valid

Test: Click product → similarity scores should be 0-100%

Commit: "fix: Ensure SigLIP embeddings populated on startup"
```

### Prompt 3: Test End-to-End (15 mins)
```
Test the complete visual discovery flow.

Steps:
1. Start frontend: npm run dev
2. Go to http://localhost:5173
3. Click any product
4. Verify ProductDetail loads
5. Verify VisualDiscoveryChain appears in sidebar
6. Verify similarity scores show
7. Click "Next" button → should load similar product
8. Repeat 3-4 times → chain should flow smoothly

If broken:
- Check browser console for errors
- Check backend logs: ssh ubuntu@3.121.29.56 "pm2 logs"
- Check tRPC query: curl http://3.121.29.56/trpc/products.getSimilar

Commit: "test: Verify end-to-end visual discovery flow"
```

---

## 🔑 Key Concepts (Understand These)

### Visual Similarity Search
When user clicks product A, the system:
1. Fetches product A's SigLIP embedding (vector)
2. Calculates cosine similarity with all other products
3. Returns top N products sorted by similarity score
4. Displays in VisualDiscoveryChain component

### Cosine Similarity
- Measures angle between two vectors
- 1.0 = identical (same direction)
- 0.0 = orthogonal (perpendicular)
- Used to find "visually similar" products

### Meta CDN Links
- Images stored on Meta's infrastructure (not S3)
- Format: `https://scontent-xxx.cdninstagram.com/...`
- Detected by checking for "scontent", "fbcdn", or "instagram"
- Updated in real-time (no local storage needed)

---

## 🐛 Common Issues & Fixes

| Issue | Cause | Fix |
|-------|-------|-----|
| VisualDiscoveryChain not showing | Not integrated into ProductDetail | Add component to sidebar |
| Similarity scores all 0% | Embeddings not populated | Check SigLIP service |
| "Next" button disabled | Only 1 product in chain | Need more similar products |
| Backend 500 error | tRPC endpoint broken | Check routers-minimal.ts |
| Images not loading | Meta CDN link dead | Verify link is valid |

---

## 📊 Current Metrics

- **Products:** 100 (Meta CDN links)
- **Categories:** 5 (Shoes, Dresses, Accessories, Jewelry, Furniture)
- **Frontend Components:** 8 (Layout, Cards, Grid, Chain, Pages)
- **Backend Endpoints:** 12 (products, categories, discovery, health)
- **Embeddings:** ⏳ Pending verification

---

## 🔐 Access & Credentials

### AWS Server
```bash
# SSH Access
ssh -i ~/.ssh/manus_key ubuntu@3.121.29.56

# Check Backend Status
pm2 status

# View Logs
pm2 logs

# Restart Backend
pm2 restart all
```

### GitHub
```bash
# Clone repo
gh repo clone cbow2412/Soko-africa-marketplace

# Push changes
git add .
git commit -m "your message"
git push origin main
```

### Environment Variables
- `OPENAI_API_KEY` - Available in sandbox
- `DATABASE_URL` - MySQL connection (if needed)
- `MILVUS_URL` - Vector DB connection

---

## 📞 When You Get Stuck

1. **Check the logs:** `pm2 logs` on server
2. **Check the browser console:** F12 → Console tab
3. **Read AGENT_HANDOFF.md:** Full context there
4. **Check GitHub:** Recent commits show what was done
5. **Test the endpoint:** `curl http://3.121.29.56/trpc/products.getSimilar`

---

## ✅ Checklist Before Handing Off Again

- [ ] Visual Discovery Chain integrated
- [ ] All 100 products have embeddings
- [ ] Similarity search returns correct results
- [ ] End-to-end flow tested
- [ ] No console errors
- [ ] Changes committed to GitHub
- [ ] AGENT_HANDOFF.md updated with your progress
- [ ] Next agent's first 3 prompts documented

---

**You've got this, Chief. Go build something legendary.** 🚀

*Questions? Check AGENT_HANDOFF.md or MISSION_CONTROL.md*
