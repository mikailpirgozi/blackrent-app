# 🚀 Manual Railway Redeploy Instructions

## Problem
Railway GitHub integration might not be picking up the latest commits automatically.

## Solution - Manual Redeploy via Dashboard

### Option 1: Dashboard Redeploy (FASTEST - 30 seconds)

1. **Open Railway Dashboard:**
   ```
   https://railway.app/project/c4bd4f5f-b6ce-48fa-a518-f6708b325def
   ```

2. **Click on `blackrent-app` service**

3. **Go to "Deployments" tab**

4. **Click "Deploy" button** (top right)
   - Or click the **three dots** on latest deployment → **"Redeploy"**

5. **Wait 3-5 minutes** for build to complete

---

### Option 2: Trigger via GitHub Commit (if webhook works)

Railway should auto-deploy when you push to `main` branch.

**Check if webhook is configured:**
1. Go to GitHub repo settings
2. **Webhooks** section
3. Look for Railway webhook URL
4. Should be: `https://backboard.railway.app/...`

If missing → Set up in Railway: **Settings → Source → Reconnect GitHub**

---

### Option 3: Railway CLI (if local link works)

```bash
cd "/Users/mikailpirgozi/Desktop/Cursor zalohy mac16/Blackrent Beta 2"

# Try to trigger deployment
railway up --detach

# Or redeploy last deployment
railway redeploy
```

---

## Latest Changes to Deploy

✅ **Commit ad1aa562** - Leasing form validation fix
✅ **Commit 54b4bec3** - .railwayignore fix
✅ **Commit 987e5442** - Complete cache system fix

All changes are on GitHub `main` branch.

---

## Verify Deployment

After redeployment, check:

```bash
# API health check
curl https://blackrent-app-production-4d6f.up.railway.app/api/health

# Should show current timestamp
```

Then test creating a new leasing - it should appear IMMEDIATELY! 🎉

