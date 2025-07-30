# 🚀 RÝCHLY R2 STORAGE SETUP - BLACKRENT

## 📊 AKTUÁLNY STAV
✅ **R2 Storage je nakonfigurované**
✅ **Presigned URL funguje** 
❌ **Upload endpoint má chybu** (potrebuje opravu)

## 🎯 ČO POTREBUJETE UROBIŤ

### 1. SKONTROLUJTE RAILWAY ENVIRONMENT VARIABLES

1. Choďte na: https://railway.app/dashboard
2. Vyberte **BlackRent project**
3. Kliknite **Variables** tab
4. Skontrolujte či máte tieto premenné:

```bash
R2_ENDPOINT=https://xxx.r2.cloudflarestorage.com
R2_BUCKET_NAME=blackrent-storage
R2_ACCESS_KEY_ID=your-access-key
R2_SECRET_ACCESS_KEY=your-secret-key
R2_ACCOUNT_ID=your-account-id
R2_PUBLIC_URL=https://blackrent-storage.xxx.r2.dev
```

### 2. AK CHÝBAJÚ PREMENNÉ

#### A) Vytvorte Cloudflare R2 Bucket:
1. Choďte na: https://dash.cloudflare.com
2. **R2 Object Storage** → **Create bucket**
3. Názov: `blackrent-storage`
4. Location: Automatic
5. **Create bucket**

#### B) Vytvorte API Token:
1. **R2** → **Manage API Tokens**
2. **Create Token**
3. Permissions: Object:Edit, Object:Read
4. Bucket: blackrent-storage
5. **Create Token** → skopírujte

#### C) Získajte Connection Details:
1. V bucket kliknite **Settings**
2. Skopírujte:
   - Endpoint URL
   - Account ID

#### D) Nastavte Public URL:
1. **Settings** → **Custom domain**
2. Enable public access
3. Skopírujte public URL

#### E) Pridajte do Railway:
1. Railway dashboard → **Variables**
2. Pridajte všetkých 6 premenných
3. Railway automaticky redeploy

### 3. TESTOVANIE PO NASTAVENÍ

Spustite automatický test:
```bash
./test-r2-setup.sh
```

## 🔧 AK UPLOAD STÁLE ZLYHÁVA

### Problém: Upload endpoint má chybu
### Riešenie: Opravte backend kód

1. **Skontrolujte Railway logy:**
   - Railway dashboard → **Deployments**
   - Kliknite na najnovší deployment
   - Pozrite si **Logs**

2. **Možné príčiny:**
   - Chýbajúca environment variable
   - Nesprávny formát URL
   - R2 permissions problém
   - Backend kód chyba

3. **Oprava:**
   - Opravte environment variables
   - Redeploy aplikácie
   - Testujte znova

## ✅ ČO FUNGUJE

- ✅ R2 Storage konfigurácia
- ✅ Presigned URL generovanie
- ✅ R2 connection
- ✅ API health check
- ✅ Database connection

## ❌ ČO POTREBUJE OPRAVU

- ❌ Upload endpoint
- ❌ Priamy upload súborov
- ❌ Migrácia base64 → R2

## 🎯 ĎALŠIE KROKY

1. **Skontrolujte Railway variables**
2. **Opravte chýbajúce premenné**
3. **Redeploy aplikácie**
4. **Spustite test znova**
5. **Ak stále zlyháva, pozrite Railway logy**

## 📞 PODPORA

Ak máte problémy:
1. Skontrolujte Railway logy
2. Overte environment variables
3. Testujte presigned URL
4. Kontaktujte podporu

---

**🎯 Po oprave upload endpointu budete mať plne funkčné R2 storage!** 