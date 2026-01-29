# 🚂 Railway Deployment Guide - Soko Africa Marketplace

**Status:** Complete step-by-step guide for deploying to Railway  
**Date:** January 29, 2026  
**Author:** Manus AI

---

## 📋 Prerequisites

Before deploying to Railway, ensure you have:

1. ✅ A Railway account (https://railway.app)
2. ✅ GitHub repository connected to Railway
3. ✅ All required environment variables (see below)
4. ✅ TiDB Cloud database provisioned
5. ✅ Zilliz Cloud (Milvus) instance provisioned

---

## 🔐 Required Environment Variables

You **MUST** configure these environment variables in your Railway project settings:

### Database & Vector Store
```bash
DATABASE_URL=mysql://user:password@host:4000/database?ssl={"rejectUnauthorized":false}
MILVUS_ADDRESS=your-zilliz-endpoint.zillizcloud.com:19530
MILVUS_USERNAME=db_admin
MILVUS_PASSWORD=your_zilliz_password
```

### AI Services
```bash
GEMINI_API_KEY=your_google_gemini_api_key
HF_TOKEN=your_huggingface_token
```

### Application Settings
```bash
NODE_ENV=production
PORT=3000
OAUTH_SERVER_URL=https://oauth.soko-africa.com
```

### Optional (for OAuth/Auth features)
```bash
GITHUB_PAT=your_github_personal_access_token
VERCEL_TOKEN=your_vercel_token
```

---

## 🚀 Step-by-Step Deployment

### Step 1: Create a New Railway Project

1. Go to https://railway.app
2. Click **"New Project"**
3. Select **"Deploy from GitHub repo"**
4. Choose your `Soko-africa-marketplace` repository
5. Railway will automatically detect the Dockerfile

### Step 2: Configure Environment Variables

1. In your Railway project dashboard, click on your service
2. Go to the **"Variables"** tab
3. Click **"+ New Variable"**
4. Add **ALL** the environment variables listed above
5. **Important:** Make sure to add them one by one or use the "Raw Editor" to paste them all

**Quick Add via Raw Editor:**
```
DATABASE_URL=mysql://user:password@host:4000/database?ssl={"rejectUnauthorized":false}
MILVUS_ADDRESS=your-zilliz-endpoint.zillizcloud.com:19530
MILVUS_USERNAME=db_admin
MILVUS_PASSWORD=your_zilliz_password
GEMINI_API_KEY=your_google_gemini_api_key
HF_TOKEN=your_huggingface_token
NODE_ENV=production
PORT=3000
OAUTH_SERVER_URL=https://oauth.soko-africa.com
```

### Step 3: Configure Build Settings

Railway should automatically detect your Dockerfile. Verify:

1. Go to **"Settings"** tab
2. Under **"Build"**, ensure:
   - **Builder:** Docker
   - **Dockerfile Path:** `Dockerfile` (default)
3. Under **"Deploy"**, ensure:
   - **Start Command:** (leave empty, Dockerfile CMD will be used)
   - **Health Check Path:** `/health` (optional but recommended)

### Step 4: Configure Networking

1. In the **"Settings"** tab, scroll to **"Networking"**
2. Click **"Generate Domain"** to get a public URL
3. Note your Railway domain (e.g., `your-service.up.railway.app`)

### Step 5: Deploy

1. Railway will automatically trigger a deployment when you push to GitHub
2. Or, manually trigger a deployment:
   - Go to **"Deployments"** tab
   - Click **"Deploy"** button
3. Monitor the build logs in real-time

### Step 6: Verify Deployment

Once deployed, verify your site is working:

1. **Health Check:**
   ```bash
   curl https://your-service.up.railway.app/health
   ```
   Expected response:
   ```json
   {"status":"ok","uptime":123.45,"version":"1.0.4-production"}
   ```

2. **Homepage:**
   Visit `https://your-service.up.railway.app/` in your browser
   - Should see the Soko Africa marketplace homepage

3. **Admin Panel:**
   Visit `https://your-service.up.railway.app/admin`
   - Should see the Admin Command Center

---

## 🔧 Troubleshooting

### Issue 1: "404 Not Found" Error

**Symptoms:** Railway shows "The train has not arrived at the station"

**Causes & Solutions:**
1. **Service not running:**
   - Check deployment logs for errors
   - Verify all environment variables are set
   - Ensure the build completed successfully

2. **Port mismatch:**
   - Verify `PORT=3000` is set in environment variables
   - Railway automatically sets `$PORT`, but our Dockerfile uses 3000

3. **Build failed:**
   - Check build logs for TypeScript errors
   - The "unbreakable build" config should bypass most errors
   - If build fails, check `pnpm run build` output

### Issue 2: "Cannot connect to database"

**Solution:**
1. Verify `DATABASE_URL` is correct
2. Ensure TiDB Cloud allows connections from Railway IPs
3. Check that SSL configuration is correct: `?ssl={"rejectUnauthorized":false}`

### Issue 3: "Milvus connection failed"

**Solution:**
1. Verify `MILVUS_ADDRESS`, `MILVUS_USERNAME`, and `MILVUS_PASSWORD`
2. Ensure Zilliz Cloud allows connections from Railway
3. Check that the address includes the port (`:19530`)

### Issue 4: Build takes too long or times out

**Solution:**
1. Railway has a 10-minute build timeout
2. The multi-stage Dockerfile should build in ~3-5 minutes
3. If timeout occurs, check for:
   - Network issues downloading dependencies
   - Excessive TypeScript compilation errors

### Issue 5: Application crashes after deployment

**Solution:**
1. Check application logs in Railway dashboard
2. Common causes:
   - Missing environment variables
   - Database connection issues
   - AI model initialization failures (Gemini/HuggingFace)
3. The app is designed to start even if AI services fail (graceful degradation)

---

## 📊 Monitoring & Logs

### View Logs
1. Go to Railway dashboard
2. Click on your service
3. Go to **"Deployments"** tab
4. Click on the active deployment
5. View real-time logs

### Key Log Messages to Look For

**✅ Success:**
```
🚀 Server running on port 3000
✅ Database connected successfully
✅ Milvus vector store initialized
🎯 Production server ready
```

**❌ Errors:**
```
❌ Database connection failed
❌ Milvus initialization failed
⚠️ Missing environment variable: GEMINI_API_KEY
```

---

## 🔄 Continuous Deployment

Railway automatically deploys when you push to your GitHub repository's main branch.

**To trigger a manual deployment:**
```bash
# Make a change and push
git add .
git commit -m "trigger deployment"
git push origin main
```

Railway will:
1. Pull the latest code
2. Build the Docker image
3. Deploy the new version
4. Zero-downtime deployment (new version replaces old)

---

## 🎯 Post-Deployment Checklist

After successful deployment, verify:

- [ ] Homepage loads correctly
- [ ] Product images are displayed
- [ ] Search functionality works
- [ ] Admin panel is accessible
- [ ] Database queries are working
- [ ] Vector search (if enabled) is functional
- [ ] Health check endpoint returns 200 OK

---

## 🆘 Getting Help

If you encounter issues:

1. **Check Railway Logs:** Most issues are logged
2. **Review Environment Variables:** Ensure all required vars are set
3. **Test Locally:** Run `pnpm run build && pnpm start` locally first
4. **Check External Services:** Verify TiDB and Zilliz are accessible

---

## 📝 Notes

- **Build Time:** ~3-5 minutes
- **Cold Start:** ~10-15 seconds (Docker container start)
- **Memory Usage:** ~512MB-1GB recommended
- **Scaling:** Railway can auto-scale based on traffic

---

**🎓 Your "Jumia Killer" is now ready for production on Railway!**

For technical details, see [TECHNICAL_HANDOFF.md](./TECHNICAL_HANDOFF.md)
