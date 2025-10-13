# 🚀 Staging Environment - Quick Setup (5 minút)

Máš vytvorený `blackrent-staging` service na Railway. Teraz ho nastav:

## 📋 Step 1: Database Setup

**Railway Dashboard → blackrent-app project:**

1. Klikni **"New Service"** → **"Add PostgreSQL"**
2. Pomenuj: `blackrent-staging-db`
3. Po vytvorení klikni na databázu → **"Variables"** → Skopíruj `DATABASE_URL`

## 📋 Step 2: Environment Variables

**Railway Dashboard → blackrent-staging service → Variables:**

Klikni **"New Variable"** a pridaj tieto (copy-paste):

### 🔧 Core Settings
```
NODE_ENV=staging
RAILWAY_ENVIRONMENT=staging
PORT=8080
VERSION=1.0.0-staging
REACT_APP_VERSION=1.0.0-staging
```

### 🗄️ Database
```
DATABASE_URL=<VLOŽ URL Z KROKU 1>
```
*(Skopíruj z blackrent-staging-db PostgreSQL service)*

### 🔐 JWT
```
JWT_SECRET=blackrent-super-secret-jwt-key-2024
```

### ☁️ R2 Storage (STAGING PREFIX!)
```
R2_ENDPOINT=https://9ccdca0d876e24bd9acefabe56f94f53.r2.cloudflarestorage.com
R2_ACCESS_KEY_ID=101b1b96332f7216f917c269f2ae1fc8
R2_SECRET_ACCESS_KEY=5d03a6a396171324658c402b8758f5bae2364fe0bb7e5cc91d6ea8661c34cc69
R2_ACCOUNT_ID=9ccdca0d876e24bd9acefabe56f94f53
R2_BUCKET_NAME=blackrent-storage
R2_PUBLIC_URL=https://pub-4fec120a8a6a4a0cbadfa55f54b7e8a2.r2.dev
R2_STAGING_PREFIX=staging/
FORCE_LOCAL_STORAGE=false
```
**⚠️ DÔLEŽITÉ: `R2_STAGING_PREFIX=staging/` = files pôjdu do staging/ foldra!**

### 📧 Email (Real Emails, Staging Labeled)
```
SMTP_HOST=smtp.m1.websupport.sk
SMTP_PORT=465
SMTP_SECURE=true
SMTP_USER=info@blackrent.sk
SMTP_PASS=Hesloheslo11
SMTP_FROM_NAME=BlackRent Staging
EMAIL_FROM=info@blackrent.sk
EMAIL_SEND_PROTOCOLS=true
STAGING_EMAIL_PREFIX=[STAGING TEST]
```

### 📧 IMAP (Disabled for Staging)
```
IMAP_ENABLED=false
IMAP_AUTO_START=false
IMAP_HOST=imap.m1.websupport.sk
IMAP_PORT=993
IMAP_USER=info@blackrent.sk
IMAP_PASSWORD=Hesloheslo11
```

### 📄 PDF Generation
```
PDF_GENERATOR_TYPE=custom-font
CUSTOM_FONT_NAME=aeonik
PROTOCOL_V2_ENABLED=false
PROTOCOL_V2_PERCENTAGE=0
```

### 🔗 Frontend URL
```
FRONTEND_URL=https://blackrent-staging.vercel.app
```
*(Alebo použij Railway domain ak nemáš staging na Vercel)*

### 📊 Sentry (Optional)
```
SENTRY_DSN_BACKEND=https://e662e41f89d59c7fbc21af1b941fef51@o4509695990431744.ingest.de.sentry.io/4509696032309328
```

## 📋 Step 3: Deploy Settings

**Railway Dashboard → blackrent-staging → Settings:**

1. **Root Directory:** (nechaj prázdne alebo `./`)
2. **Build Command:** `cd backend && npm ci && npm run build`
3. **Start Command:** `node backend/dist/fastify-server.js`
4. **Dockerfile Path:** `Dockerfile.railway` (ak používaš Docker)
5. **Branch:** `main` (alebo vytvor `staging` branch)
6. **Auto-Deploy:** ✅ ON

## 📋 Step 4: GitHub Branch (Optional)

Ak chceš mať separátnu `staging` branch:

```bash
# Lokálne:
git checkout -b staging
git push -u origin staging

# Railway Dashboard → blackrent-staging → Settings → Branch:
# Zmeň na: "staging"
```

## 🚀 Step 5: Deploy!

```bash
# Commit a push zmeny
git add .
git commit -m "feat: staging environment setup"
git push origin main  # alebo staging ak si vytvoril branch

# Railway automaticky deployne blackrent-staging service
```

## ✅ Step 6: Verification

### Test Health Endpoint
```bash
curl https://blackrent-staging.up.railway.app/health
```

Očakávaná odpoveď:
```json
{
  "status": "ok",
  "environment": "staging",
  "timestamp": "2024-01-27T12:00:00Z"
}
```

### Test R2 Upload
1. Prihlás sa na staging: `https://blackrent-staging.up.railway.app`
2. Vytvor test protokol
3. Nahraj fotky
4. Skontroluj že URL obsahuje `staging/`:
   ```
   ✅ https://pub-4fec120a8a6a4a0cbadfa55f54b7e8a2.r2.dev/staging/protocols/test.jpg
   ❌ https://pub-4fec120a8a6a4a0cbadfa55f54b7e8a2.r2.dev/protocols/test.jpg
   ```

### Test Email
1. Odošli test email zo staging
2. Skontroluj subject:
   ```
   ✅ [STAGING TEST] Nový protokol vytvorený
   ❌ Nový protokol vytvorený
   ```

## 🎯 Workflow po Setup

```bash
# DEVELOPMENT (localhost)
npm run dev
# ➜ http://localhost:3000
# ✅ Rýchle testovanie
# ❌ Nefunguje R2, email

# STAGING (Railway)
git push origin staging  # alebo main
# ➜ https://blackrent-staging.up.railway.app
# ✅ Všetky features fungujú (R2, email, DB)
# ✅ Bezpečné testovanie (staging DB, staging/ files)

# PRODUCTION (Railway)
git checkout main
git merge staging  # Po úspešnom teste
git push origin main
# ➜ https://blackrent-app-production-4d6f.up.railway.app
# ✅ Stable release
```

## 📊 File Organization

```
R2 Bucket: blackrent-storage
├── protocols/           ← PRODUCTION files
├── vehicles/            ← PRODUCTION files
├── documents/           ← PRODUCTION files
└── staging/
    ├── protocols/       ← STAGING files
    ├── vehicles/        ← STAGING files
    └── documents/       ← STAGING files
```

## 🎯 Benefits

| Feature | Localhost | Staging | Production |
|---------|-----------|---------|------------|
| R2 Upload | ❌ | ✅ | ✅ |
| Email Send | ❌ | ✅ | ✅ |
| Real Database | ❌ | ✅ (separate) | ✅ |
| Protokoly | ⚠️ Limited | ✅ Full | ✅ Full |
| Photo Gallery | ❌ | ✅ | ✅ |
| Safe Testing | ✅ | ✅ | ❌ |

## 🔧 Troubleshooting

### Problem: R2 files go to production folder
```bash
# Check staging env vars:
railway variables --service blackrent-staging

# Should contain:
R2_STAGING_PREFIX=staging/
NODE_ENV=staging
```

### Problem: Database connection error
```bash
# Check DATABASE_URL points to staging DB:
railway variables --service blackrent-staging | grep DATABASE_URL

# Should be different from production DB
```

### Problem: Emails without [STAGING TEST] prefix
```bash
# Check env var:
railway variables --service blackrent-staging | grep STAGING_EMAIL_PREFIX

# Should be:
STAGING_EMAIL_PREFIX=[STAGING TEST]
```

## ✅ Final Checklist

- [ ] PostgreSQL staging DB created
- [ ] DATABASE_URL set
- [ ] R2_STAGING_PREFIX=staging/ set
- [ ] All env variables copied
- [ ] Deploy settings configured
- [ ] First deploy successful
- [ ] Health endpoint working
- [ ] R2 upload test passed (files go to staging/)
- [ ] Email test passed (subject has [STAGING TEST])
- [ ] Protokoly working
- [ ] Photo gallery working

**Po dokončení máš plne funkčný staging environment! 🚀**

---

**Need help?** Check logs:
```bash
# Railway Dashboard → blackrent-staging → Deployments → Click latest → View Logs
```

