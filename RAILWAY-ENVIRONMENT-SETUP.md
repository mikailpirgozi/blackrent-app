# 🚂 Railway Environment Variables Setup - Hybrid Architecture

## 🎯 **Cieľ:**
Nastaviť všetky potrebné environment variables v Railway pre hybridnú architektúru (Railway Backend + Vercel Frontend + Cloudflare R2).

## 📋 **KROK ZA KROKOM:**

### **1. Otvor Railway Dashboard**
```
URL: https://railway.app
```

### **2. Nájdi blackrent-app projekt**
- Klikni na projekt **"blackrent-app"**
- Choď na **"Variables"** tab

### **3. Pridaj tieto Environment Variables:**

#### **🔧 Základné nastavenia:**
```bash
NODE_ENV=production
PORT=5001
JWT_SECRET=your-super-secret-jwt-key-2024
```

#### **🗄️ PostgreSQL (automaticky nastavené Railway):**
```bash
DATABASE_URL=(automaticky nastavené Railway)
```

#### **🌐 CORS a Frontend:**
```bash
FRONTEND_URL=https://blackrent-app.vercel.app
RAILWAY_STATIC_URL=https://blackrent-app-production-4d6f.up.railway.app
```

#### **☁️ Cloudflare R2 Storage (KRITICKÉ!):**
```bash
R2_ENDPOINT=https://your-account-id.r2.cloudflarestorage.com
R2_ACCESS_KEY_ID=your-access-key-id
R2_SECRET_ACCESS_KEY=your-secret-access-key
R2_BUCKET_NAME=blackrent-storage
R2_ACCOUNT_ID=your-cloudflare-account-id
R2_PUBLIC_URL=https://pub-xyz.r2.dev
```

#### **🔔 Monitoring (voliteľné):**
```bash
SENTRY_DSN_BACKEND=your-sentry-dsn
ENABLE_MONITORING=true
```

## 🚨 **KRITICKÉ PROBLÉMY KTORÉ TOTO RIEŠI:**

### **1. R2 Storage chyby:**
- ❌ **"R2 Storage not configured"** chyby
- ❌ **Upload fotiek nefunguje**
- ❌ **Protocol PDF generovanie zlyháva**

### **2. CORS chyby:**
- ❌ **"Origin not allowed by CORS"** pre Vercel
- ❌ **Frontend nemôže volať API**

### **3. Protocol chyby:**
- ❌ **"Unexpected end of JSON input"**
- ❌ **500 Internal Server Error**

## ✅ **PO NASTAVENÍ BUDÚ FUNGOVAŤ:**

### **✅ Protokoly:**
- Handover protokoly - bez chýb
- Return protokoly - bez chýb
- Upload fotiek - R2 storage
- PDF generovanie - R2 storage

### **✅ Hybridná architektúra:**
- Vercel frontend → Railway backend
- CORS správne nakonfigurované
- R2 storage pre súbory

### **✅ Monitoring:**
- Health checks
- Error tracking
- Performance monitoring

## 🔧 **Ako pridať Variables v Railway:**

### **Metóda 1: Railway Dashboard**
1. **Variables** tab
2. **"New Variable"**
3. **Name:** `R2_ENDPOINT`
4. **Value:** `https://your-account-id.r2.cloudflarestorage.com`
5. **Add**

### **Metóda 2: Railway CLI**
```bash
railway variables set R2_ENDPOINT=https://your-account-id.r2.cloudflarestorage.com
railway variables set R2_ACCESS_KEY_ID=your-access-key-id
railway variables set R2_SECRET_ACCESS_KEY=your-secret-access-key
railway variables set R2_BUCKET_NAME=blackrent-storage
railway variables set R2_ACCOUNT_ID=your-cloudflare-account-id
railway variables set R2_PUBLIC_URL=https://pub-xyz.r2.dev
```

## 🧪 **Testovanie po nastavení:**

### **1. Health Check:**
```bash
curl https://blackrent-app-production-4d6f.up.railway.app/api/health
```

### **2. R2 Storage Test:**
```bash
curl -X POST https://blackrent-app-production-4d6f.up.railway.app/api/protocols/handover \
  -H "Content-Type: application/json" \
  -d '{"rentalId":"550e8400-e29b-41d4-a716-446655440001","location":"Test"}'
```

### **3. Frontend Test:**
- Otvor https://blackrent-app.vercel.app
- Skús vytvoriť handover protokol
- Skontroluj či sa fotky uploadujú

## 🚨 **DÔLEŽITÉ POZNÁMKY:**

### **R2 Storage Setup:**
1. **Vytvor Cloudflare R2 bucket**
2. **Získaj API credentials**
3. **Nastav public access**
4. **Skopíruj endpoint URL**

### **CORS Setup:**
- Railway automaticky povolí Vercel domény
- Ak máš custom doménu, pridaj ju do CORS

### **Security:**
- **Nikdy nezdieľaj** R2 credentials
- **Používaj silné** JWT_SECRET
- **Pravidelne rotuj** API keys

## 📊 **Očakávané výsledky:**

### **✅ Všetky protokoly fungujú:**
- Handover protokoly ✅
- Return protokoly ✅
- Upload fotiek ✅
- PDF generovanie ✅

### **✅ Hybridná architektúra:**
- Vercel frontend ✅
- Railway backend ✅
- R2 storage ✅
- CORS ✅

### **✅ Monitoring:**
- Health checks ✅
- Error tracking ✅
- Performance ✅

---

**🎯 Po nastavení týchto environment variables budú všetky problémy vyriešené!** 