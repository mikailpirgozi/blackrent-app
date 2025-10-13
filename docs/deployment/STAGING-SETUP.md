# 🎯 Staging Environment Setup

## Problém
- **Localhost**: Nefunguje R2, email, real data
- **Production**: Riskantné testovanie, firma prestane fungovať

## ✅ Riešenie: Railway Staging Service

### 1. Railway Dashboard Setup

```bash
# V Railway.app:
1. Go to your BlackRent project
2. Click "New Service"
3. Select "Deploy from GitHub repo"
4. Choose branch: "staging" (vytvor ho ak neexistuje)
5. Service name: "blackrent-staging"
```

### 2. Staging Database

**Option A: Separate Staging DB (ODPORÚČAM)**
```bash
# V Railway:
1. Add new "PostgreSQL" plugin
2. Name: "blackrent-staging-db"
3. Copy DATABASE_URL
4. Set v staging service env vars
```

**Option B: Same DB, Different Schema**
```sql
-- Nižšie náklady, ale môžeš crashnúť prod DB
CREATE SCHEMA staging;
-- DATABASE_URL s ?schema=staging
```

### 3. Environment Variables (Staging Service)

```env
# Database
DATABASE_URL=postgresql://...railway-staging-db...

# R2 Storage - STAGING PREFIX
R2_ENDPOINT=https://your-account-id.r2.cloudflarestorage.com
R2_ACCESS_KEY_ID=same-as-prod
R2_SECRET_ACCESS_KEY=same-as-prod
R2_BUCKET_NAME=blackrent-storage
R2_STAGING_PREFIX=staging/  # ← FILES DO staging/ folder
R2_PUBLIC_URL=https://storage.blackrent.sk

# Email - STAGING (real emails, labeled)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
EMAIL_FROM=staging@blackrent.sk
STAGING_EMAIL_PREFIX=[STAGING TEST]  # ← PREFIX V SUBJECT

# Environment
NODE_ENV=staging
RAILWAY_ENVIRONMENT=staging
FRONTEND_URL=https://blackrent-staging.up.railway.app
BACKEND_URL=https://blackrent-staging-api.up.railway.app

# JWT (môžeš použiť iný secret pre staging)
JWT_SECRET=staging-different-secret-key-for-security

# Optional: Test mode features
ENABLE_DEBUG_ENDPOINTS=true
SKIP_EMAIL_VERIFICATION=true  # Rýchlejšie testovanie
```

### 4. Git Workflow

```bash
# Vytvor staging branch
git checkout -b staging
git push -u origin staging

# Development workflow:
git checkout staging
git merge main  # Merge latest changes
# ... make changes ...
git add .
git commit -m "test: protokoly photo upload"
git push origin staging  # Auto-deploys to Railway staging

# Keď všetko funguje:
git checkout main
git merge staging
git push origin main  # Deploy to production
```

### 5. Railway Branch Deploy Settings

V Railway staging service:
```yaml
# Settings → Service Settings → Branch
Branch: staging
Auto-deploy: ON
Watch Paths: backend/*, apps/*, package.json
```

### 6. Testing Workflow

```bash
# 1. LOCALHOST (quick iteration)
npm run dev  # Obmedzené features, ale rýchle

# 2. STAGING (full features testing)
git push origin staging
# Test na: https://blackrent-staging.up.railway.app
# ✅ Funguje: R2, emails, real DB, protocols

# 3. PRODUCTION (stable release)
git push origin main
# Deploy na: https://blackrent.sk
```

### 7. Cost Optimization

```bash
# Staging service môžeš vypnúť keď netestuješ:
Railway Dashboard → staging service → Settings → Sleep

# Alebo nastav auto-sleep:
Settings → Sleep after 1 hour of inactivity
```

## 🎯 Benefits

| Feature | Localhost | Staging | Production |
|---------|-----------|---------|------------|
| R2 Upload | ❌ | ✅ | ✅ |
| Email Send | ❌ | ✅ | ✅ |
| Real Data | ❌ | ✅ (copy) | ✅ |
| Safe Testing | ✅ | ✅ | ❌ |
| Speed | ⚡ Fast | 🚀 Real | 🚀 Real |

## 🚀 Quick Commands

```bash
# Deploy to staging
git push origin staging

# Copy production data to staging
npm run db:copy-to-staging

# Test staging
curl https://blackrent-staging.up.railway.app/health

# Deploy to production
git push origin main
```

## 📊 File Organization

```
R2 Bucket (blackrent-storage):
├── production/
│   ├── protocols/
│   ├── vehicles/
│   └── documents/
└── staging/
    ├── protocols/
    ├── vehicles/
    └── documents/

Emails:
├── Production: "Nový protokol vytvorený"
└── Staging: "[STAGING TEST] Nový protokol vytvorený"
```

## ✅ Verification

Po setup overte že funguje:

```bash
# 1. Health check
curl https://blackrent-staging.up.railway.app/health

# 2. Test R2 upload
curl -X POST https://blackrent-staging.up.railway.app/api/files/upload \
  -H "Authorization: Bearer $TOKEN" \
  -F "file=@test.jpg"

# 3. Check file path contains "staging/"
# Response: https://storage.blackrent.sk/staging/protocols/test.jpg

# 4. Test email
curl -X POST https://blackrent-staging.up.railway.app/api/test/email \
  -H "Authorization: Bearer $TOKEN"

# 5. Check email subject contains "[STAGING TEST]"
```

## 🔒 Security

```env
# Staging používa:
✅ Separate database (no risk to prod data)
✅ Same R2 bucket, different prefix (cost-effective)
✅ Real emails, but labeled [STAGING]
✅ Different JWT secret (no token sharing)
✅ Debug endpoints enabled (for testing)
```

## 🎯 Result

```
❌ BEFORE:
localhost (broken) → production (risky)

✅ AFTER:
localhost (quick) → STAGING (full test) → production (safe)
```

**Staging = Production-like environment pre bezpečné testovanie!** 🚀

