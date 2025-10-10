# 🔧 R2 Configuration Pre Localhost

**Problem:** Backend na localhoste nemá nakonfigurované R2 credentials  
**Error:** `"R2 Storage nie je nakonfigurované"`

---

## ✅ KROK 1: Vytvor .env súbor v backend/

```bash
cd /Users/mikailpirgozi/Desktop/Aplikacie\ Cursor/Blackrent\ Beta\ 2/backend
touch .env
```

---

## ✅ KROK 2: Skopíruj obsah do .env

**Otvor súbor v editore a vlož:**

```env
# PostgreSQL Database Configuration
DB_HOST=localhost
DB_PORT=5432
DB_NAME=blackrent
DB_USER=postgres
DB_PASSWORD=password

# JWT Secret
JWT_SECRET=blackrent-super-secret-jwt-key-2024

# Server Configuration
PORT=3001
NODE_ENV=development

# Sentry Error Tracking (optional)
SENTRY_DSN_BACKEND=
VERSION=1.0.0

# IMAP Email Monitoring Configuration
IMAP_HOST=imap.m1.websupport.sk
IMAP_PORT=993
IMAP_USER=info@blackrent.sk
IMAP_PASSWORD=
IMAP_ENABLED=false
IMAP_AUTO_START=false

# SMTP Email Sending Configuration
SMTP_HOST=smtp.m1.websupport.sk
SMTP_PORT=465
SMTP_SECURE=true
SMTP_USER=info@blackrent.sk
SMTP_PASS=
SMTP_FROM_NAME=BlackRent System
EMAIL_SEND_PROTOCOLS=false

# 🔥 CLOUDFLARE R2 STORAGE CONFIGURATION
# Použiť ROVNAKÉ credentials ako na Railway/Vercel
R2_ENDPOINT=https://0a8a2b35935b3b9aca17baf2f6ced3c5.r2.cloudflarestorage.com
R2_ACCESS_KEY_ID=YOUR_REAL_R2_ACCESS_KEY_ID_HERE
R2_SECRET_ACCESS_KEY=YOUR_REAL_R2_SECRET_ACCESS_KEY_HERE
R2_BUCKET_NAME=blackrent-storage
R2_ACCOUNT_ID=YOUR_R2_ACCOUNT_ID_HERE
R2_PUBLIC_URL=https://pub-4fec120a8a6a4a0cbadfa55f54b7e8a2.r2.dev

# Optional
RUN_MIGRATIONS=false
```

---

## ✅ KROK 3: Nahraď placeholders reálnymi credentials

Potrebuješ nahradiť tieto hodnoty:

### 1. `R2_ACCESS_KEY_ID`
Kde nájsť:
- Cloudflare Dashboard → R2 → Manage R2 API Tokens
- Alebo Railway/Vercel environment variables

### 2. `R2_SECRET_ACCESS_KEY`  
Kde nájsť:
- Rovnaké miesto ako Access Key ID
- Alebo Railway/Vercel environment variables

### 3. `R2_ACCOUNT_ID`
Kde nájsť:
- Cloudflare Dashboard → R2 → Overview (Account ID)
- Alebo z Railway/Vercel env vars

---

## ✅ KROK 4: Skontroluj Railway/Vercel Credentials

### Option A: Railway Dashboard

```bash
# 1. Otvor Railway dashboard
# 2. Vyber backend service
# 3. Variables tab
# 4. Skopíruj:
#    - R2_ACCESS_KEY_ID
#    - R2_SECRET_ACCESS_KEY
#    - R2_ACCOUNT_ID
```

### Option B: Railway CLI

```bash
# Ak máš railway CLI
railway variables

# Output:
# R2_ACCESS_KEY_ID=xxx
# R2_SECRET_ACCESS_KEY=xxx
# R2_ACCOUNT_ID=xxx
```

### Option C: Vercel CLI

```bash
# Ak máš vercel CLI
vercel env ls

# Alebo pull env vars
vercel env pull
```

---

## ✅ KROK 5: Restart Backend Server

Po vytvorení .env súboru:

```bash
cd /Users/mikailpirgozi/Desktop/Aplikacie\ Cursor/Blackrent\ Beta\ 2/backend
npm run dev
# alebo
pnpm run dev
```

**Backend by mal načítať .env a inicializovať R2!**

---

## ✅ KROK 6: Verify R2 Configuration

V backend console by si mal vidieť:

```
✅ R2 Storage initialized successfully
✅ Bucket: blackrent-storage
✅ Endpoint: https://0a8a2b35935b3b9aca17baf2f6ced3c5.r2.cloudflarestorage.com
```

Ak vidíš:
```
❌ R2 Storage nie je nakonfigurované
```

Znamená to že credentials sú nesprávne alebo .env sa nenačítal.

---

## 🔍 Troubleshooting

### Problem: .env sa nenačítal

```bash
# Check či backend číta .env
cd backend
cat .env | grep R2

# Output by mal ukazovať R2 variables
```

### Problem: Invalid credentials

```bash
# Test R2 connection
# V backend console by mal byť error log s detailami
```

### Problem: Bucket not found

```bash
# Skontroluj R2_BUCKET_NAME
# Malo by byť: blackrent-storage
```

---

## 📝 Kde nájsť R2 Credentials?

### Cloudflare Dashboard

1. Prihlás sa na **Cloudflare Dashboard**
2. **R2** v ľavom menu
3. **Manage R2 API Tokens**
4. Vytvor token alebo použi existujúci
5. Skopíruj:
   - Access Key ID
   - Secret Access Key
   - Account ID (v R2 Overview)

### Railway Dashboard

1. Prihlás sa na **Railway**
2. Vyber **BlackRent Backend** service
3. **Variables** tab
4. Find:
   - `R2_ACCESS_KEY_ID`
   - `R2_SECRET_ACCESS_KEY`
   - `R2_ACCOUNT_ID`
5. **Copy** values

---

## ⚡ Quick Copy Template

**Po nájdení credentials, skopíruj do .env:**

```env
R2_ENDPOINT=https://0a8a2b35935b3b9aca17baf2f6ced3c5.r2.cloudflarestorage.com
R2_ACCESS_KEY_ID=<COPY_FROM_RAILWAY>
R2_SECRET_ACCESS_KEY=<COPY_FROM_RAILWAY>
R2_BUCKET_NAME=blackrent-storage
R2_ACCOUNT_ID=<COPY_FROM_RAILWAY>
R2_PUBLIC_URL=https://pub-4fec120a8a6a4a0cbadfa55f54b7e8a2.r2.dev
```

---

## ✅ After Setup

1. ✅ Backend restart
2. ✅ Test upload na **http://localhost:3000/test-protocols**
3. ✅ Upload by mal fungovať!

---

*Setup Guide - 2025-01-10*

