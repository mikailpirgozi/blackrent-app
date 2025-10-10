# 🔴 DÔLEŽITÉ: Musíš Reštartovať Backend!

## Problém

Backend stále hlási: `"R2 Storage nie je nakonfigurované"`

**Dôvod:** .env súbor bol vytvorený, ale backend ho ešte nenačítal!

---

## ✅ Riešenie (1 minúta)

### 1. Nájdi Backend Terminal

Kde beží backend server (port 3001)

### 2. Zastav Backend

Stlač: **Ctrl+C**

```
^C
Server stopped
```

### 3. Overiť .env Súbor

```bash
cd /Users/mikailpirgozi/Desktop/Aplikacie\ Cursor/Blackrent\ Beta\ 2/backend
cat .env | grep R2
```

**Expected output:**
```
R2_ENDPOINT=https://0a8a2b35935b3b9aca17baf2f6ced3c5.r2.cloudflarestorage.com
R2_ACCESS_KEY_ID=101b1b96332f7216f917c269f2ae1fc8
R2_SECRET_ACCESS_KEY=5d03a6a396171324658c402b8758f5bae2364fe0bb7e5cc91d6ea8661c34cc69
R2_BUCKET_NAME=blackrent-storage
R2_ACCOUNT_ID=9ccdca0d876e24bd9acefabe56f94f53
R2_PUBLIC_URL=https://pub-4fec120a8a6a4a0cbadfa55f54b7e8a2.r2.dev
```

✅ Ak vidíš toto, .env je OK!

### 4. Spusti Backend Znova

```bash
npm run dev
```

**Sleduj console output - MUSÍŠ vidieť:**

```
✅ R2 Storage initialized successfully
✅ Bucket: blackrent-storage
✅ Endpoint: https://...r2.cloudflarestorage.com
```

**Ak NEVIDÍŠ toto, backend .env nie je správny!**

---

## 🎯 Po Reštarte

1. ✅ Backend console ukazuje "R2 initialized"
2. ✅ Refresh browser: **http://localhost:3000/test-protocols** (Ctrl+Shift+R)
3. ✅ Klikni "Pridať fotky"
4. ✅ Upload by mal fungovať!

---

## 🐛 Ak Stále Nefunguje

### Check 1: .env existuje?

```bash
ls -la /Users/mikailpirgozi/Desktop/Aplikacie\ Cursor/Blackrent\ Beta\ 2/backend/.env
```

Should show: `-rw-r--r--  1 ... .env`

### Check 2: .env má správny obsah?

```bash
cat /Users/mikailpirgozi/Desktop/Aplikacie\ Cursor/Blackrent\ Beta\ 2/backend/.env
```

Should contain R2_* variables with REAL values (nie placeholders)

### Check 3: Backend číta .env?

V backend console by mal byť log:
```
Loading environment variables from .env
```

Ak NIE, backend možno používa iný .env súbor alebo ho nečíta.

---

## 🚨 Kritické

**MUSÍŠ REŠTARTOVAŤ BACKEND!**

.env súbor bol vytvorený **PO** spustení backendu, takže backend ho ešte nevidel.

**Stop backend (Ctrl+C) → Start znova (npm run dev)**

---

*Restart Guide - 2025-01-10*

