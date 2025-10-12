# ⚡ R2 Localhost - Quick Start (2 minúty)

**Problem:** Backend na localhoste nemá R2 credentials  
**Solution:** 2 možnosti - automatická alebo manuálna

---

## 🚀 Option A: Automatická (Railway CLI) - 1 minúta

### 1. Check Railway CLI

```bash
railway --version
```

**Ak nie je nainštalované:**
```bash
npm install -g @railway/cli
# alebo
brew install railway
```

### 2. Login do Railway

```bash
railway login
```

### 3. Spusti Setup Script

```bash
cd /Users/mikailpirgozi/Desktop/Aplikacie\ Cursor/Blackrent\ Beta\ 2/backend
./setup-r2-localhost.sh
```

**Script automaticky:**
- ✅ Stiahne R2 credentials z Railway
- ✅ Vytvorí .env súbor
- ✅ Nakonfiguruje všetko

### 4. Restart Backend

```bash
npm run dev
```

✅ **HOTOVO!**

---

## 🔧 Option B: Manuálna (Railway Dashboard) - 2 minúty

### 1. Otvor Railway Dashboard

URL: **https://railway.app**

### 2. Skopíruj R2 Variables

1. Vyber **BlackRent Backend** service
2. Klikni **Variables** tab
3. Find a skopíruj:
   - `R2_ENDPOINT`
   - `R2_ACCESS_KEY_ID`
   - `R2_SECRET_ACCESS_KEY`
   - `R2_BUCKET_NAME`
   - `R2_ACCOUNT_ID`
   - `R2_PUBLIC_URL`

### 3. Vytvor .env Súbor

```bash
cd /Users/mikailpirgozi/Desktop/Aplikacie\ Cursor/Blackrent\ Beta\ 2/backend
nano .env
```

**Vlož:**
```env
DB_HOST=localhost
DB_PORT=5432
DB_NAME=blackrent
DB_USER=postgres
DB_PASSWORD=password

JWT_SECRET=blackrent-super-secret-jwt-key-2024

PORT=3001
NODE_ENV=development

R2_ENDPOINT=<PASTE_YOUR_VALUE>
R2_ACCESS_KEY_ID=<PASTE_YOUR_VALUE>
R2_SECRET_ACCESS_KEY=<PASTE_YOUR_VALUE>
R2_BUCKET_NAME=<PASTE_YOUR_VALUE>
R2_ACCOUNT_ID=<PASTE_YOUR_VALUE>
R2_PUBLIC_URL=<PASTE_YOUR_VALUE>

RUN_MIGRATIONS=false
IMAP_ENABLED=false
EMAIL_SEND_PROTOCOLS=false
```

**Nahraď `<PASTE_YOUR_VALUE>` hodnotami z Railway!**

Ulož: `Ctrl+X`, `Y`, `Enter`

### 4. Restart Backend

```bash
npm run dev
```

✅ **HOTOVO!**

---

## 🎯 Verify

Backend console by mal ukázať:

```
✅ R2 Storage initialized successfully
✅ Bucket: blackrent-storage
✅ Endpoint: https://...r2.cloudflarestorage.com
```

---

## 🧪 Test Upload

1. Otvor **http://localhost:3000/test-protocols**
2. Klikni **"Pridať fotky"**
3. Vyber 1-2 fotky

**Expected:**
```
✅ Image processing complete
✅ Upload complete
```

---

## ❌ Troubleshooting

### "R2 Storage nie je nakonfigurované"

**Check:**
```bash
cat backend/.env | grep R2
```

**Malo by ukázať reálne hodnoty, NIE placeholders!**

### "Invalid credentials"

**Double-check:** Values z Railway dashboard sú správne skopírované

### ".env súbor neexistuje"

```bash
ls -la backend/.env
```

Ak neexistuje, vytvor ho (Krok 3).

---

## 📝 Detailné Návody

- **Automatický setup:** `backend/LOCALHOST_R2_SETUP.md`
- **Manuálny setup:** `backend/MANUAL_R2_SETUP.md`

---

*Quick Start - 2025-01-10*

