# 🚀 BlackRent Staging Environment - Kompletný Setup Guide

## ✅ Čo Je Hotové

- ✅ GitHub `staging` branch vytvorený a sync s `main`
- ✅ Railway `blackrent-staging` service vytvorený
- ✅ R2 staging prefix support implementovaný
- ✅ Backend staging environment variables pripravené

## 📋 KROK 1: Railway Backend Setup

### 1.1 Railway Dashboard → blackrent-staging

**Settings → Source:**
```
Repository: mikailpirgozi/blackrent-app
Branch: staging  ← DÔLEŽITÉ!
Auto-deploy: ON
```

### 1.2 Railway PostgreSQL Database

**Vytvor novú databázu:**
1. Railway Dashboard → blackrent-app project
2. **"New Service"** → **"Add PostgreSQL"**
3. Name: `blackrent-staging-db`
4. Po vytvorení: Variables → Copy `DATABASE_URL`

### 1.3 Railway Environment Variables

**blackrent-staging service → Variables → Raw Editor:**

```env
# Environment
NODE_ENV=staging
RAILWAY_ENVIRONMENT=staging
PORT=8080
VERSION=1.0.0-staging
REACT_APP_VERSION=1.0.0-staging

# Database (VLOŽ URL Z KROKU 1.2)
DATABASE_URL=postgresql://postgres:...@...railway.internal:5432/railway

# JWT (same as production)
JWT_SECRET=blackrent-super-secret-jwt-key-2024

# R2 Storage - STAGING PREFIX!
R2_ENDPOINT=https://9ccdca0d876e24bd9acefabe56f94f53.r2.cloudflarestorage.com
R2_ACCESS_KEY_ID=101b1b96332f7216f917c269f2ae1fc8
R2_SECRET_ACCESS_KEY=5d03a6a396171324658c402b8758f5bae2364fe0bb7e5cc91d6ea8661c34cc69
R2_ACCOUNT_ID=9ccdca0d876e24bd9acefabe56f94f53
R2_BUCKET_NAME=blackrent-storage
R2_PUBLIC_URL=https://pub-4fec120a8a6a4a0cbadfa55f54b7e8a2.r2.dev
R2_STAGING_PREFIX=staging/
FORCE_LOCAL_STORAGE=false

# Email - Real Emails with Staging Prefix
SMTP_HOST=smtp.m1.websupport.sk
SMTP_PORT=465
SMTP_SECURE=true
SMTP_USER=info@blackrent.sk
SMTP_PASS=Hesloheslo11
SMTP_FROM_NAME=BlackRent Staging
EMAIL_FROM=info@blackrent.sk
EMAIL_SEND_PROTOCOLS=true
STAGING_EMAIL_PREFIX=[STAGING TEST]

# IMAP (Disabled for staging)
IMAP_ENABLED=false
IMAP_AUTO_START=false
IMAP_HOST=imap.m1.websupport.sk
IMAP_PORT=993
IMAP_USER=info@blackrent.sk
IMAP_PASSWORD=Hesloheslo11

# PDF Generation
PDF_GENERATOR_TYPE=custom-font
CUSTOM_FONT_NAME=aeonik
PROTOCOL_V2_ENABLED=false
PROTOCOL_V2_PERCENTAGE=0

# Sentry (Optional)
SENTRY_DSN_BACKEND=https://e662e41f89d59c7fbc21af1b941fef51@o4509695990431744.ingest.de.sentry.io/4509696032309328
```

### 1.4 Deploy Backend

Railway automaticky deployne po nastavení variables. Počkaj ~2 minúty.

**Check:** https://blackrent-staging.up.railway.app/health

## 📋 KROK 2: Vercel Frontend Setup (ODPORÚČAM)

### Option A: Separátny Staging Frontend ⭐

**2.1 Vercel Dashboard**
1. **"Add New Project"**
2. Import: `mikailpirgozi/blackrent-app`
3. **Branch: `staging`** ← DÔLEŽITÉ!
4. Project Name: `blackrent-staging`
5. Framework: Vite
6. Root Directory: `apps/web` (ak máš monorepo)

**2.2 Vercel Environment Variables**
```env
VITE_API_URL=https://blackrent-staging.up.railway.app
VITE_ENVIRONMENT=staging
```

**2.3 Deploy**
- Klikni **"Deploy"**
- Po deployi: https://blackrent-staging.vercel.app

### Option B: Localhost Frontend + Staging Backend

**2.1 Local .env**
```bash
# apps/web/.env.local
VITE_API_URL=https://blackrent-staging.up.railway.app
VITE_ENVIRONMENT=staging
```

**2.2 Run Dev**
```bash
npm run dev
# → http://localhost:3000 s staging backendom
```

## 🎯 Workflow Po Setup

### Development Workflow

```bash
# 1. VÝVOJ (Localhost)
git checkout -b feature/my-feature
# ... úpravy kódu ...
npm run dev  # Test lokálne

# 2. PUSH TO STAGING (Full Test)
git checkout staging
git merge feature/my-feature
git push origin staging

# → Railway automaticky deployne backend
# → Vercel automaticky deployne frontend (ak máš)
# → Test na: https://blackrent-staging.vercel.app

# 3. PRODUCTION DEPLOY (Po úspešnom teste)
git checkout main
git merge staging
git push origin main

# → Production deploy
```

## 🧪 Ako Testovať?

### Scenario 1: Test Protokolov a R2 Upload

**Staging:**
1. Otvor https://blackrent-staging.vercel.app
2. Vytvor nový prenájom
3. Vytvor handover protokol
4. Nahraj fotky
5. **Skontroluj URL fotiek:**
   ```
   ✅ https://pub-...r2.dev/staging/protocols/photo.jpg
   ❌ https://pub-...r2.dev/protocols/photo.jpg (production)
   ```

**Production:**
- Files zostávajú v root foldri (bez staging/ prefixu)

### Scenario 2: Test Emailov

**Staging:**
- Email subject: `[STAGING TEST] Nový protokol vytvorený`

**Production:**
- Email subject: `Nový protokol vytvorený`

### Scenario 3: Test Databázy

**Staging:**
- Má vlastnú PostgreSQL databázu
- Môžeš vymazať/testovať čokoľvek
- ❌ NEOVPLYVNÍ production dáta

**Production:**
- Produkčná databáza ostane netnutá

## 📊 Architektúra Po Setup

```
┌────────────────────────────────────────────────────┐
│                  DEVELOPMENT                       │
├────────────────────────────────────────────────────┤
│ localhost:3000 → localhost:3001 → local mock       │
│ Rýchle iterácie, UI development                    │
└────────────────────────────────────────────────────┘
                        ↓
┌────────────────────────────────────────────────────┐
│                    STAGING                         │
├────────────────────────────────────────────────────┤
│ blackrent-staging.vercel.app                       │
│    ↓                                               │
│ blackrent-staging.up.railway.app                   │
│    ↓                                               │
│ Railway Staging PostgreSQL                         │
│    ↓                                               │
│ R2: staging/ folder                                │
│                                                    │
│ ✅ Full features: R2, email, protocols             │
│ ✅ Real testing environment                        │
│ ✅ Safe - no production impact                     │
└────────────────────────────────────────────────────┘
                        ↓
┌────────────────────────────────────────────────────┐
│                   PRODUCTION                       │
├────────────────────────────────────────────────────┤
│ blackrent-app.vercel.app                           │
│    ↓                                               │
│ blackrent-app-production.up.railway.app            │
│    ↓                                               │
│ Railway Production PostgreSQL                      │
│    ↓                                               │
│ R2: root folder                                    │
│                                                    │
│ ✅ Stable, tested code only                        │
│ ✅ Zákazníci                                       │
└────────────────────────────────────────────────────┘
```

## ✅ Checklist

### Railway Backend
- [ ] blackrent-staging service created
- [ ] Branch set to `staging`
- [ ] PostgreSQL staging DB created
- [ ] DATABASE_URL set
- [ ] R2_STAGING_PREFIX=staging/ set
- [ ] All environment variables copied
- [ ] First deploy successful
- [ ] Health check working: https://blackrent-staging.up.railway.app/health

### Vercel Frontend (Optional)
- [ ] blackrent-staging project created
- [ ] Branch set to `staging`
- [ ] VITE_API_URL pointing to staging backend
- [ ] First deploy successful
- [ ] Can access: https://blackrent-staging.vercel.app

### Testing
- [ ] Can create rental in staging
- [ ] Can create handover protocol
- [ ] Photos upload to staging/ folder
- [ ] Emails have [STAGING TEST] prefix
- [ ] Production unaffected

## 🔧 Troubleshooting

### Problem: Railway deploy fails
```bash
# Check logs:
Railway Dashboard → blackrent-staging → Deployments → Latest → View Logs
```

### Problem: R2 files go to production folder
```bash
# Check env var:
Railway → blackrent-staging → Variables
# Should have: R2_STAGING_PREFIX=staging/
```

### Problem: Frontend can't connect to backend
```bash
# Check CORS in backend:
backend/src/fastify-app.ts → fastify-cors settings

# Check frontend API URL:
apps/web/.env.local → VITE_API_URL
```

## 🎉 Hotovo!

Po dokončení setup máš:
- ✅ **3 environments**: localhost → staging → production
- ✅ **Bezpečné testovanie**: staging DB + staging R2 folder
- ✅ **Full features**: R2, email, protocols na staging
- ✅ **Zero risk**: production ostáva stable

**Môžeš teraz testovať protokoly a fotky bez strachu že ti firma prestane fungovať!** 🚀

