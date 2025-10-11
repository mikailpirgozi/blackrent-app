# Railway R2 Storage Setup Guide

## 🚨 CRITICAL: R2 Must Be Configured on Railway

BlackRent app **requires** Cloudflare R2 storage in production. Local-storage fallback is **disabled** to prevent server disk overflow.

---

## ⚡ Quick Setup (5 minutes)

### Step 1: Get R2 Credentials from Cloudflare

1. Go to [Cloudflare Dashboard](https://dash.cloudflare.com/)
2. Navigate to **R2 Object Storage**
3. Click **"Manage R2 API Tokens"**
4. Click **"Create API Token"**
5. Select **"Admin Read & Write"** permissions
6. Copy these values:
   - `Access Key ID`
   - `Secret Access Key`
   - `Account ID`
7. Go to your bucket → **Settings** → Copy:
   - `Bucket Name` (e.g., `blackrent-storage`)
   - `Public URL` (e.g., `https://pub-xxxx.r2.dev`)
   - `Endpoint` (e.g., `https://xxxx.r2.cloudflarestorage.com`)

---

### Step 2: Add to Railway Environment Variables

1. Open your Railway project: https://railway.app/dashboard
2. Select **Backend** service
3. Go to **Variables** tab
4. Add these **6 variables**:

```bash
R2_ENDPOINT=https://0a8a2b35935b3b9aca17baf2f6ced3c5.r2.cloudflarestorage.com
R2_ACCESS_KEY_ID=your-access-key-id-here
R2_SECRET_ACCESS_KEY=your-secret-access-key-here
R2_BUCKET_NAME=blackrent-storage
R2_ACCOUNT_ID=your-account-id-here
R2_PUBLIC_URL=https://pub-4fec120a8a6a4a0cbadfa55f54b7e8a2.r2.dev
```

5. Click **"Deploy"** to restart with new variables

---

### Step 3: Verify Configuration

After Railway redeploys (2-3 minutes):

1. Check logs for:
   ```
   ✅ R2 Storage configured successfully
   ```

2. Test upload:
   - Go to Protocol form
   - Upload 1 test photo
   - Check logs for:
     ```
     ☁️ Uploading to R2: { bucket: 'blackrent-storage', key: '...' }
     ✅ R2 upload successful: https://pub-xxxx.r2.dev/...
     ```

3. **Success!** Photos now upload directly to R2 (no local-storage!)

---

## 🎯 Benefits After Setup

| Before (local-storage) | After (R2) |
|------------------------|------------|
| ❌ Server disk fills up | ✅ Unlimited cloud storage |
| ❌ Slow uploads (2× write) | ✅ Fast (1× write) |
| ❌ Files lost on redeploy | ✅ Persistent storage |
| ❌ Manual cleanup needed | ✅ Automatic management |

---

## 🐛 Troubleshooting

### Error: "R2 storage is not configured"

**Cause:** Missing R2 environment variables

**Fix:**
1. Check Railway Variables tab
2. Verify all 6 `R2_*` variables are set
3. Redeploy

---

### Error: "R2 API TOKEN IS INVALID"

**Cause:** Token expired or wrong permissions

**Fix:**
1. Create new R2 API token in Cloudflare
2. Use **"Admin Read & Write"** permissions
3. Update `R2_ACCESS_KEY_ID` and `R2_SECRET_ACCESS_KEY` in Railway
4. Redeploy

---

### Error: "Failed to upload to R2"

**Cause:** CORS or network issue

**Fix:**
1. Check R2 bucket CORS settings:
   ```json
   [
     {
       "AllowedOrigins": ["*"],
       "AllowedMethods": ["GET", "PUT", "POST", "DELETE"],
       "AllowedHeaders": ["*"],
       "MaxAgeSeconds": 3600
     }
   ]
   ```
2. Verify bucket is **public** (if using public URLs)
3. Check Railway logs for detailed error

---

## 📋 Checklist

Before deploying:

- [ ] R2 bucket created in Cloudflare
- [ ] R2 API token created with Admin permissions
- [ ] All 6 `R2_*` variables set in Railway
- [ ] Bucket CORS configured
- [ ] Bucket set to public (if using `R2_PUBLIC_URL`)
- [ ] Railway redeployed with new variables

---

## 🔗 Useful Links

- [Cloudflare R2 Docs](https://developers.cloudflare.com/r2/)
- [Railway Docs](https://docs.railway.app/)
- [BlackRent R2 Setup](../docs/R2-STORAGE-SETUP.md)

---

## 💡 Alternative: Use Development Mode

If you want to test locally without R2:

```bash
# In backend/.env
NODE_ENV=development
# R2 variables can be empty - will use local-storage fallback
```

⚠️ **WARNING:** This is for development only! Production MUST use R2!

