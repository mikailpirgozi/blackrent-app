# 🚀 Cloudflare Worker Setup - R2 Upload Proxy

## 🎯 Prečo Cloudflare Worker?

**Problém:** Cloudflare R2 blokuje CORS pri PUT upload cez Signed URL
```
Access to fetch at 'https://blackrent-storage.xxx.r2.cloudflarestorage.com/...' 
has been blocked by CORS policy: No 'Access-Control-Allow-Origin' header is present
```

**Riešenie:** Cloudflare Worker ako proxy
```
Frontend → Cloudflare Worker → R2 → ✅ Funguje + Bezpečné
```

## 📋 Nastavenie krok za krokom

### 1. Inštalácia Wrangler CLI

```bash
npm install -g wrangler
```

### 2. Prihlásenie do Cloudflare

```bash
wrangler login
```

### 3. Konfigurácia Worker

Súbory už sú vytvorené:
- `cloudflare-worker.js` - Worker kód
- `wrangler.toml` - Konfigurácia

### 4. Nastavenie R2 Bucket Binding

V `wrangler.toml` uprav:
```toml
[[r2_buckets]]
binding = "R2_BUCKET"
bucket_name = "blackrent-storage"  # Tvoj bucket name
```

### 5. Nastavenie Environment Variables

```bash
# V Cloudflare Dashboard alebo cez wrangler
wrangler secret put R2_PUBLIC_URL
# Hodnota: https://blackrent-storage.xxx.r2.dev
```

### 6. Deploy Worker

```bash
# Test deploy
wrangler dev

# Production deploy
wrangler deploy
```

### 7. Frontend Environment Variables

Pridaj do `.env`:
```bash
REACT_APP_USE_WORKER_PROXY=true
REACT_APP_WORKER_URL=https://blackrent-upload-worker.your-subdomain.workers.dev
```

## 🔧 Worker Funkcionalita

### ✅ Validácia:
- Typ súboru (len obrázky)
- Veľkosť (max 10MB)
- Povinné polia

### ✅ Bezpečnosť:
- CORS headers
- Rate limiting (môžeš pridať)
- Validácia origin (môžeš pridať)

### ✅ Upload:
- Priamy upload do R2
- Metadata uloženie
- Photo objekt generovanie

## 🧪 Testovanie

### 1. Test Worker lokálne:
```bash
wrangler dev
```

### 2. Test upload:
```bash
curl -X POST http://localhost:8787 \
  -F "file=@test-image.jpg" \
  -F "protocolId=test-123" \
  -F "protocolType=handover" \
  -F "mediaType=vehicle" \
  -F "label=Test Image"
```

### 3. Test v aplikácii:
- Nastav `REACT_APP_USE_WORKER_PROXY=true`
- Skús upload fotky
- Skontroluj logy

## 📊 Monitoring

### Cloudflare Dashboard:
- **Workers** → **Analytics**
- **Requests** - počet uploadov
- **Errors** - chyby
- **Performance** - rýchlosť

### Logs:
```bash
wrangler tail
```

## 🔄 Fallback Systém

Ak Worker zlyhá, aplikácia automaticky použije:
1. **Signed URL** (ak povolené)
2. **Direct upload** cez backend

## 💰 Cena

**Cloudflare Workers:**
- **FREE tier:** 100,000 requests/deň
- **Paid:** $5/mesiac za 10M requests

**Pre BlackRent:** FREE tier je dostačujúci

## 🚀 Výhody

✅ **Bezpečné** - Worker kontroluje všetky uploady  
✅ **Rýchle** - Cloudflare edge network  
✅ **Spoľahlivé** - Žiadne CORS problémy  
✅ **Flexibilné** - Môžeš pridávať validáciu  
✅ **Lacné** - FREE tier pre malé projekty  

## 🔧 Pokročilé Nastavenia

### Rate Limiting:
```javascript
// V worker.js
const rateLimit = {
  maxRequests: 100,
  windowMs: 15 * 60 * 1000, // 15 minút
};
```

### Origin Validation:
```javascript
const allowedOrigins = [
  'https://blackrent-app.vercel.app',
  'https://blackrent-app-production-4d6f.up.railway.app'
];
```

### Custom Domain:
```bash
# Nastav custom domain pre Worker
wrangler domain add blackrent-upload-worker.your-domain.com
``` 