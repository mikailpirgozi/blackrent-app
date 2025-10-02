# 🔧 R2 SSL Problém - Oprava

## 🎯 **Problém:**
```
net::ERR_SSL_VERSION_OR_CIPHER_MISMATCH
```

R2 public URL má SSL konfiguračný problém.

## ✅ **Dočasné riešenie:**

### **1. Použiť backend proxy namiesto R2 public URL:**
- Súbory existujú v R2 ✅
- Backend proxy funguje ✅
- Problém je len s R2 public URL SSL

### **2. Opraviť R2 bucket SSL:**
1. **Choď na Cloudflare Dashboard**
2. **R2 Object Storage** → **blackrent-storage**
3. **Settings** → **Public URL**
4. **Skontroluj SSL/TLS nastavenia**

### **3. Alternatívne riešenie:**
Použiť backend proxy URL namiesto R2 public URL:

```
# Namiesto:
https://blackrent-storage.9ccdca0d876e24bd9acefabe56f94f53.r2.dev/...

# Použiť:
https://blackrent-app-production-4d6f.up.railway.app/api/files/proxy/...
```

## 🚀 **Rýchle riešenie:**

### **Opraviť Worker aby vracal backend proxy URL:**
V `cloudflare-worker.js` zmeniť:
```javascript
// Namiesto R2 public URL
const publicUrl = `${env.R2_PUBLIC_URL}/${fileKey}`;

// Použiť backend proxy URL
const publicUrl = `https://blackrent-app-production-4d6f.up.railway.app/api/files/proxy/${encodeURIComponent(fileKey)}`;
```

## 📋 **Kroky na opravu:**

1. **Opraviť Worker** (rýchle riešenie)
2. **Skontrolovať R2 SSL** (dlhodobé riešenie)
3. **Testovať upload a galériu**

## 🧪 **Testovanie:**
- Upload fotiek cez Worker ✅ (funguje)
- Zobrazenie v galérii cez backend proxy ✅ (funguje)
- R2 public URL ❌ (SSL problém) 