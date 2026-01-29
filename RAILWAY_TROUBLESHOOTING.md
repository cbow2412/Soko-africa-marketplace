# 🔧 Railway 404 Error - Quick Fix Guide

**Current Issue:** Your Railway deployment shows "404 Not Found"  
**URL:** https://soko-africa-marketplace-production.up.railway.app/

---

## 🚨 Immediate Actions Required

### 1. Check Railway Dashboard

Go to your Railway dashboard and verify:

**A. Service Status**
- [ ] Is the service running? (Green indicator)
- [ ] Is there an active deployment?
- [ ] Did the last deployment succeed?

**B. Build Logs**
1. Click on your service
2. Go to "Deployments" tab
3. Click on the latest deployment
4. Check if build completed successfully
5. Look for errors in the logs

**C. Application Logs**
1. In the same deployment view
2. Check "Deploy Logs" for runtime errors
3. Look for messages like:
   - ✅ "Server running on port 3000"
   - ❌ "Cannot find module"
   - ❌ "Database connection failed"

---

## 🔐 2. Verify Environment Variables

**Critical Variables That MUST Be Set:**

Go to Railway → Your Service → Variables tab

Check these are present:

```bash
✅ NODE_ENV=production
✅ PORT=3000
✅ DATABASE_URL=mysql://...
✅ MILVUS_ADDRESS=...
✅ MILVUS_USERNAME=...
✅ MILVUS_PASSWORD=...
✅ OAUTH_SERVER_URL=https://oauth.soko-africa.com
```

**If any are missing:**
1. Click "+ New Variable"
2. Add the missing variables
3. Railway will automatically redeploy

---

## 🏗️ 3. Check Build Configuration

In Railway → Settings:

**Build Settings:**
- Builder: `Docker` ✅
- Dockerfile Path: `Dockerfile` ✅

**Deploy Settings:**
- Start Command: (leave empty - Dockerfile handles this)
- Health Check Path: `/health` (optional)

**Networking:**
- Public Domain: Should be generated
- Port: Railway auto-detects from Dockerfile EXPOSE

---

## 🔄 4. Force Redeploy

If everything looks correct but still 404:

**Option A: Via Railway Dashboard**
1. Go to Deployments tab
2. Click "Deploy" button (top right)
3. Select "Redeploy" from latest commit

**Option B: Via Git Push**
```bash
# In your local repository
cd /path/to/Soko-africa-marketplace

# Make a trivial change to force rebuild
echo "# Force redeploy" >> README.md

# Commit and push
git add .
git commit -m "force: trigger railway redeploy"
git push origin main
```

---

## 🧪 5. Test Build Locally

Before Railway, verify the build works locally:

```bash
# Clone the repo if needed
git clone https://github.com/cbow2412/Soko-africa-marketplace.git
cd Soko-africa-marketplace

# Install dependencies
pnpm install

# Build the project
pnpm run build

# Check if dist folder was created
ls -la dist/

# Expected output:
# dist/
#   ├── client/
#   └── server/
#       └── index.js

# Try running locally
export NODE_ENV=production
export PORT=3001
export OAUTH_SERVER_URL=https://oauth.soko-africa.com
node dist/server/index.js

# Should see:
# 🚀 Server running on port 3001
```

If this works locally but not on Railway, the issue is Railway-specific.

---

## 🐛 6. Common Issues & Fixes

### Issue A: Build Fails Due to TypeScript Errors

**Check:** Build logs show TypeScript compilation errors

**Fix:** The "unbreakable build" config should prevent this, but verify:

```bash
# Check tsconfig.json has:
{
  "compilerOptions": {
    "skipLibCheck": true,
    "noEmit": false
  }
}

# Check package.json build script:
"build": "vite build && tsx server/build.ts"
```

### Issue B: Missing Dependencies in Production

**Check:** Logs show "Cannot find module 'xyz'"

**Fix:** Ensure the module is in `dependencies` (not `devDependencies`):

```bash
# Move from devDependencies to dependencies
pnpm add <package-name>
git add package.json pnpm-lock.yaml
git commit -m "fix: move package to dependencies"
git push
```

### Issue C: Port Mismatch

**Check:** Railway expects a different port

**Fix:** Railway sets `$PORT` environment variable automatically. Our Dockerfile uses:
```dockerfile
ENV PORT=3000
EXPOSE 3000
```

Railway should respect this. If not, remove `PORT=3000` from Railway variables and let Railway auto-assign.

### Issue D: Static Files Not Found

**Check:** Logs show "Cannot find static files"

**Fix:** Verify `dist/client` exists after build:

```bash
# In Railway build logs, look for:
COPY --from=builder /app/dist ./dist

# This should copy both:
# - dist/server/index.js
# - dist/client/* (HTML, CSS, JS)
```

---

## 📋 7. Checklist Before Asking for Help

Before seeking support, ensure:

- [ ] All environment variables are set in Railway
- [ ] Build logs show successful completion
- [ ] Deploy logs show "Server running on port 3000"
- [ ] No error messages in application logs
- [ ] Service status is "Active" (green)
- [ ] Domain is properly generated
- [ ] Local build works: `pnpm run build && pnpm start`

---

## 🆘 8. Get Detailed Logs

If still stuck, get detailed logs:

**In Railway Dashboard:**
1. Go to your service
2. Click "Deployments"
3. Click latest deployment
4. Copy full build logs
5. Copy full deploy logs
6. Look for any ERROR or WARN messages

**Key things to check:**
```bash
# Build phase
✅ "pnpm install --frozen-lockfile" succeeded
✅ "pnpm run build" succeeded
✅ "COPY --from=builder /app/dist ./dist" succeeded

# Deploy phase
✅ "node dist/server/index.js" started
✅ "Server running on port 3000" appears
✅ No "ECONNREFUSED" or "ENOTFOUND" errors
```

---

## 🎯 Most Likely Cause

Based on the 404 error, the most likely issues are:

1. **Environment variables not set** (90% of cases)
   - Missing `DATABASE_URL`, `MILVUS_*`, or other required vars
   - App crashes on startup due to missing config

2. **Build failed silently** (5% of cases)
   - TypeScript errors despite "unbreakable build"
   - Check build logs carefully

3. **Service not started** (5% of cases)
   - Railway deployment succeeded but service didn't start
   - Check deploy logs for startup errors

---

## ✅ Quick Win: Start Fresh

If all else fails, create a new Railway service:

1. Delete the current Railway service
2. Create a new one from scratch
3. Connect to GitHub repo
4. Add ALL environment variables (use the list above)
5. Let Railway auto-deploy
6. Monitor logs carefully

---

**Need more help?** Check the full [RAILWAY_DEPLOYMENT_GUIDE.md](./RAILWAY_DEPLOYMENT_GUIDE.md)
