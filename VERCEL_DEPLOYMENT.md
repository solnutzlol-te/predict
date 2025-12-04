# 🚀 Vercel Deployment Guide for monfutures

Complete step-by-step guide to deploy your crypto prediction platform to Vercel with persistent PostgreSQL storage.

---

## 📋 Prerequisites

1. **Vercel Account** - Sign up at https://vercel.com (free tier available)
2. **Neon Account** - Sign up at https://neon.tech (free tier available)
3. **GitHub Account** - Your code should be in a GitHub repository

---

## Phase 1: Set Up Neon PostgreSQL Database

### Step 1.1: Create Neon Account
1. Go to https://neon.tech
2. Click **"Sign Up"** (use GitHub or email)
3. Complete registration

### Step 1.2: Create Database Project
1. Click **"Create a project"**
2. Name it: `monfutures-db` (or any name you prefer)
3. Select region closest to your users (e.g., US East for North America)
4. Click **"Create Project"**

### Step 1.3: Get Connection String
1. In your Neon dashboard, find **"Connection Details"**
2. Copy the **PostgreSQL connection string** (looks like this):
   ```
   postgresql://user:password@ep-example-123.us-east-1.aws.neon.tech/neondb?sslmode=require
   ```
3. **Save this string** - you'll need it in Step 2.4!

### Step 1.4: Create Database Tables
1. In Neon dashboard, click **"SQL Editor"** (left sidebar)
2. Copy and paste this SQL schema:

```sql
-- Predictions table
CREATE TABLE predictions (
  id TEXT PRIMARY KEY,
  coin_id TEXT NOT NULL,
  coin_name TEXT NOT NULL,
  coin_symbol TEXT NOT NULL,
  prediction TEXT NOT NULL CHECK (prediction IN ('LONG', 'SHORT', 'NEUTRAL')),
  sentiment TEXT NOT NULL,
  confidence INTEGER NOT NULL CHECK (confidence >= 0 AND confidence <= 100),
  predicted_price REAL NOT NULL,
  target_price REAL NOT NULL,
  stop_loss REAL NOT NULL,
  leverage INTEGER NOT NULL,
  risk_level TEXT NOT NULL CHECK (risk_level IN ('Low', 'Medium', 'High', 'Extreme')),
  timeframe TEXT NOT NULL,
  analysis TEXT NOT NULL,
  reasons TEXT NOT NULL,
  indicators TEXT NOT NULL,
  created_at BIGINT NOT NULL
);

-- Prediction history table
CREATE TABLE prediction_history (
  id TEXT PRIMARY KEY,
  prediction_id TEXT NOT NULL,
  coin_id TEXT NOT NULL,
  coin_name TEXT NOT NULL,
  coin_symbol TEXT NOT NULL,
  prediction TEXT NOT NULL,
  confidence INTEGER NOT NULL,
  predicted_price REAL NOT NULL,
  target_price REAL NOT NULL,
  stop_loss REAL NOT NULL,
  actual_price REAL,
  timestamp BIGINT NOT NULL,
  evaluated_at BIGINT,
  outcome TEXT NOT NULL DEFAULT 'pending' CHECK (outcome IN ('pending', 'win', 'loss', 'neutral')),
  profit_loss REAL,
  FOREIGN KEY (prediction_id) REFERENCES predictions(id)
);

-- Indexes for performance
CREATE INDEX idx_predictions_coin ON predictions(coin_id);
CREATE INDEX idx_predictions_created ON predictions(created_at DESC);
CREATE INDEX idx_history_timestamp ON prediction_history(timestamp DESC);
CREATE INDEX idx_history_outcome ON prediction_history(outcome);
CREATE INDEX idx_history_coin ON prediction_history(coin_id);
```

3. Click **"Run"** to execute the SQL
4. You should see: ✅ **"Query executed successfully"**

---

## Phase 2: Deploy to Vercel

### Step 2.1: Push Code to GitHub
1. Make sure your project is in a GitHub repository
2. Commit all changes:
   ```bash
   git add .
   git commit -m "Add Vercel deployment configuration"
   git push origin main
   ```

### Step 2.2: Import Project to Vercel
1. Go to https://vercel.com/dashboard
2. Click **"Add New..."** → **"Project"**
3. Click **"Import"** next to your GitHub repository
4. Vercel will detect your project automatically

### Step 2.3: Configure Project Settings

In the Vercel import screen, configure these settings:

#### **Framework Preset**
- Select: **Other** (leave as default)

#### **Root Directory**
- Leave as: `./` (root of project)

#### **Build Command**
```bash
npm run vercel-build
```

#### **Output Directory**
```
dist/web
```

#### **Install Command**
- Leave as default (Vercel auto-detects `npm install`)

### Step 2.4: Add Environment Variables

**This is the most important step!**

1. In the Vercel import screen, scroll down to **"Environment Variables"**
2. Click **"Add Variable"**
3. Add your Neon database URL:
   - **Name**: `DATABASE_URL`
   - **Value**: Paste your Neon connection string from Step 1.3
   - **Environment**: Select **All** (Production, Preview, Development)

4. Click **"Add"**

### Step 2.5: Deploy!
1. Click **"Deploy"** button
2. Wait 2-3 minutes for build to complete
3. You should see: 🎉 **"Congratulations! Your project has been deployed!"**

---

## Phase 3: Verify Everything Works

### Step 3.1: Test Your Deployment
1. Click **"Visit"** to open your deployed app
2. Wait for predictions to load (may take 10-15 seconds on first load)
3. You should see crypto predictions appearing!

### Step 3.2: Verify Database Connection
1. Open browser console (F12 → Console tab)
2. Look for this message:
   ```
   [Database] ✅ Connected to PostgreSQL database
   ```
3. If you see this, database is working! ✅

### Step 3.3: Test Persistence
1. Open your app in **Browser 1** (e.g., Chrome)
2. Open your app in **Browser 2** (e.g., Firefox or incognito mode)
3. Wait for predictions to load in both
4. **Both browsers should show the SAME predictions!** ✅
5. This confirms database is working globally!

---

## 🎉 Success!

Your app is now live on Vercel with persistent database storage!

**What you have now:**
- ✅ **Live URL** - Your app is accessible worldwide
- ✅ **Persistent Data** - Predictions survive server restarts
- ✅ **Global Sync** - All users see the same predictions
- ✅ **Auto-Deploy** - Every git push auto-deploys
- ✅ **Free Hosting** - Both Vercel and Neon have free tiers

---

## 📊 Vercel Settings Summary

For easy copy-paste:

```
Framework Preset: Other
Root Directory: ./
Build Command: npm run vercel-build
Output Directory: dist/web
Install Command: (leave default)
```

**Environment Variables:**
```
DATABASE_URL=postgresql://user:password@ep-example-123.us-east-1.aws.neon.tech/neondb?sslmode=require
```

---

## 🔧 Troubleshooting

### Build Fails with "Cannot find module 'pg'"
**Solution**: Make sure you ran `npm install` locally after adding `pg` to package.json:
```bash
npm install
git add package.json package-lock.json
git commit -m "Add pg dependency"
git push
```
Then redeploy on Vercel.

### "Database connection failed" in logs
**Solution**: Check environment variable:
1. Go to Vercel dashboard → Your project → Settings → Environment Variables
2. Verify `DATABASE_URL` is set correctly
3. Redeploy (Deployments tab → Click "..." → Redeploy)

### Predictions not syncing between browsers
**Solution**: 
1. Check browser console for `[Database] ✅ Connected to PostgreSQL`
2. If you see `💾 Using in-memory storage`, database isn't connected
3. Verify DATABASE_URL is set in Vercel
4. Check Neon database is not paused (free tier pauses after inactivity)

### API routes return 404
**Solution**: 
1. Verify `api/index.js` exists in your repository
2. Check `vercel.json` is in project root
3. Redeploy from Vercel dashboard

---

## 🚀 Next Steps

### Monitor Your Deployment
1. **Vercel Dashboard**: View deployment logs and analytics
2. **Neon Dashboard**: Monitor database queries and storage

### Custom Domain (Optional)
1. Go to Vercel → Your project → Settings → Domains
2. Add your custom domain (e.g., `monfutures.com`)
3. Follow Vercel's DNS setup instructions

### Enable Auto-Deploy
- Already enabled by default!
- Every `git push` to `main` branch auto-deploys to Vercel
- You'll get deployment notifications via email

---

## 📚 Additional Resources

- **Vercel Docs**: https://vercel.com/docs
- **Neon Docs**: https://neon.tech/docs
- **Project Documentation**: See `docs/` folder
- **Database Setup**: See `docs/DATABASE_SETUP.md`

---

## ✅ Deployment Checklist

Before deploying, ensure:

- [ ] Code pushed to GitHub
- [ ] Neon database created
- [ ] SQL schema executed in Neon
- [ ] DATABASE_URL copied from Neon
- [ ] Vercel project imported
- [ ] Build command set to `npm run vercel-build`
- [ ] Output directory set to `dist/web`
- [ ] DATABASE_URL added to Vercel environment variables
- [ ] Deployment completed successfully
- [ ] App opens in browser
- [ ] Predictions load correctly
- [ ] Database connection confirmed in console

---

**Happy Deploying! 🎉**

If you encounter any issues not covered here, check the Vercel deployment logs for detailed error messages.
