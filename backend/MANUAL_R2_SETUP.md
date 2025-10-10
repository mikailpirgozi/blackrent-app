# 🔧 Manual R2 Setup Pre Localhost (Bez Railway CLI)

**Ak nemáš Railway CLI, použi tento manuálny návod.**

---

## ✅ KROK 1: Získaj R2 Credentials z Railway Dashboard

### A. Prihlás sa na Railway

1. Otvor **https://railway.app**
2. Prihlás sa
3. Vyber **BlackRent Backend** projekt

### B. Otvor Variables Tab

1. Klikni na **backend service**
2. Klikni na **Variables** tab
3. Find tieto variables:

```
R2_ENDPOINT
R2_ACCESS_KEY_ID
R2_SECRET_ACCESS_KEY
R2_BUCKET_NAME
R2_ACCOUNT_ID
R2_PUBLIC_URL
```

### C. Skopíruj Values

**DÔLEŽITÉ:** Skopíruj **PRESNÉ hodnoty** (žiadne medzery, žiadne úvodzovky)

---

## ✅ KROK 2: Vytvor .env Súbor

### A. Otvor Terminal

```bash
cd /Users/mikailpirgozi/Desktop/Aplikacie\ Cursor/Blackrent\ Beta\ 2/backend
```

### B. Vytvor .env súbor

```bash
nano .env
```

**Alebo otvor v editore:**
- VS Code: `code .env`
- Cursor: `cursor .env`
- Textový editor

### C. Vlož Tento Obsah

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

# Cloudflare R2 Storage Configuration
R2_ENDPOINT=<PASTE_FROM_RAILWAY>
R2_ACCESS_KEY_ID=<PASTE_FROM_RAILWAY>
R2_SECRET_ACCESS_KEY=<PASTE_FROM_RAILWAY>
R2_BUCKET_NAME=<PASTE_FROM_RAILWAY>
R2_ACCOUNT_ID=<PASTE_FROM_RAILWAY>
R2_PUBLIC_URL=<PASTE_FROM_RAILWAY>

# Optional
RUN_MIGRATIONS=false
IMAP_ENABLED=false
EMAIL_SEND_PROTOCOLS=false
```

### D. Nahraď Placeholders

Nahraď `<PASTE_FROM_RAILWAY>` reálnymi hodnotami z Railway dashboard.

**Príklad:**

```env
R2_ENDPOINT=https://0a8a2b35935b3b9aca17baf2f6ced3c5.r2.cloudflarestorage.com
R2_ACCESS_KEY_ID=a1b2c3d4e5f6g7h8i9j0
R2_SECRET_ACCESS_KEY=xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
R2_BUCKET_NAME=blackrent-storage
R2_ACCOUNT_ID=abc123def456
R2_PUBLIC_URL=https://pub-4fec120a8a6a4a0cbadfa55f54b7e8a2.r2.dev
```

### E. Ulož Súbor

- Nano: `Ctrl+X`, potom `Y`, potom `Enter`
- VS Code/Cursor: `Cmd+S`

---

## ✅ KROK 3: Verify .env Súbor

```bash
cd /Users/mikailpirgozi/Desktop/Aplikacie\ Cursor/Blackrent\ Beta\ 2/backend
cat .env | grep R2
```

**Output by mal vyzerať:**
```
R2_ENDPOINT=https://0a8a2b35935b3b9aca17baf2f6ced3c5.r2.cloudflarestorage.com
R2_ACCESS_KEY_ID=a1b2c3d4e5f6g7h8i9j0
R2_SECRET_ACCESS_KEY=xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
R2_BUCKET_NAME=blackrent-storage
R2_ACCOUNT_ID=abc123def456
R2_PUBLIC_URL=https://pub-4fec120a8a6a4a0cbadfa55f54b7e8a2.r2.dev
```

✅ **Žiadne placeholders!**  
✅ **Žiadne `<PASTE_FROM_RAILWAY>`!**  
✅ **Reálne hodnoty!**

---

## ✅ KROK 4: Restart Backend

```bash
# Stop backend (Ctrl+C)

# Start znova
cd /Users/mikailpirgozi/Desktop/Aplikacie\ Cursor/Blackrent\ Beta\ 2/backend
npm run dev
```

**Sleduj console output:**

```
✅ R2 Storage initialized successfully
✅ Bucket: blackrent-storage
```

Ak vidíš toto, R2 je nakonfigurované! 🎉

---

## ✅ KROK 5: Test Upload

1. Otvor **http://localhost:3000/test-protocols**
2. Klikni **"Pridať fotky"**
3. Vyber 1-2 fotky
4. **Sleduj console**

**Expected:**
```
✅ Upload successful
✅ Batch upload complete
```

**Nie:**
```
❌ R2 Storage nie je nakonfigurované
```

---

## 🎯 Checklist

- [ ] Railway dashboard otvorený
- [ ] R2 variables skopírované
- [ ] .env súbor vytvorený
- [ ] Placeholders nahradené reálnymi hodnotami
- [ ] Súbor uložený
- [ ] Backend reštartovaný
- [ ] Console ukazuje "R2 Storage initialized"
- [ ] Test upload funguje

---

## 🆘 Stále Nefunguje?

### Debug Steps

1. **Check .env existuje:**
   ```bash
   ls -la backend/.env
   ```

2. **Check obsah:**
   ```bash
   cat backend/.env | grep R2
   ```

3. **Check backend console:**
   ```
   # Look for R2 initialization messages
   ```

4. **Test connection:**
   ```bash
   # V backend console by mali byť error messages
   ```

---

## 📞 Alternative: Copy .env z Produkcie

Ak máš SSH prístup na Railway:

```bash
# SSH do Railway
railway shell

# Print env vars
env | grep R2

# Copy values manually
```

---

*Manual Setup Guide - 2025-01-10*

