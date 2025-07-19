# 🚀 Cloudflare R2 - 5 Minútový Setup Guide

## 📋 KROKY (postupne jeden za druhým):

### **KROK 1: Otvor Cloudflare Dashboard**
```
🌐 URL: https://dash.cloudflare.com
👤 Prihlás sa (alebo vytvor účet ak ho nemáš)
```

### **KROK 2: Aktivuj R2**
```
1. Klikni na "R2 Object Storage" v ľavom menu
2. Klikni "Overview"
3. Ak vidíš "Purchase R2", klikni a aktivuj (FREE 10GB)
```

### **KROK 3: Získaj Account ID**
```
🆔 Možnosť A: V R2 → API → "Use R2 with APIs" → Skopíruj Account ID
🆔 Možnosť B: Z URL: https://dash.cloudflare.com/[ACCOUNT_ID]/r2
```

### **KROK 4: Vytvor Bucket**  
```
1. V R2 dashboard klikni "Create bucket"
2. Bucket name: "blackrent-storage"
3. Location: "Automatic"  
4. Klikni "Create bucket"
```

### **KROK 5: Povolenie Public Access**
```
1. Otvor bucket "blackrent-storage" 
2. Choď na "Settings" tab
3. Nájdi "R2.dev subdomain"
4. Klikni "Allow Access"
5. Napíš "allow" a potvrď
6. Skopíruj Public URL (https://pub-xyz.r2.dev)
```

### **KROK 6: Vytvor API Token**
```
1. Späť do R2 dashboard
2. Klikni "API" → "Manage R2 API Tokens"  
3. "Create API Token"
4. Nastavenia:
   • Name: "BlackRent Storage"
   • Permissions: "Object Read & Write" 
   • Bucket scope: "Apply to specific buckets"
   • Select: "blackrent-storage"
5. Klikni "Create API Token"
6. ⚠️ SKOPÍRUJ Access Key ID + Secret Access Key (len raz!)
```

### **KROK 7: Railway Environment Variables**
```
1. Otvor Railway: https://railway.app
2. Projekt "blackrent-app" → "Variables" tab
3. Pridaj tieto 6 premenných:

R2_ENDPOINT=https://[ACCOUNT_ID].r2.cloudflarestorage.com
R2_BUCKET_NAME=blackrent-storage
R2_ACCESS_KEY_ID=[tvoj_access_key]
R2_SECRET_ACCESS_KEY=[tvoj_secret_key]  
R2_ACCOUNT_ID=[tvoj_account_id]
R2_PUBLIC_URL=[tvoja_public_url]

4. Klikni "Save" - Railway automaticky redeploy
```

### **KROK 8: Test**
```
✅ Otvor BlackRent aplikáciu
✅ Skús upload fotky alebo súboru
✅ Skontroluj R2 dashboard - mali by byť súbory
✅ Railway logs - hľadaj "R2 storage initialized"
```

## 🎉 **HOTOVO!**

**Čo teraz funguje:**
- 📸 Upload fotiek vozidiel  
- 📄 PDF protokoly 
- 🗂️ Dokumenty
- 🌐 CDN súbory z celého sveta
- 💾 Automatické zálohovanie

**Náklady:** 
- 10GB FREE každý mesiac
- $0.015/GB nad limit (90% lacnejší ako AWS)
- $0 za traffic/download

---

## 🆘 **Problém?**

### **Ak API token nefunguje:**
- Skontroluj permissions (Object Read & Write)  
- Skontroluj bucket scope (blackrent-storage)
- Vytvor nový token

### **Ak upload nefunguje:**
- Skontroluj Railway environment variables
- Skontroluj Railway deployment logs
- Skontroluj public access na bucket

### **Ak súbory nie sú dostupné:**
- Skontroluj Public URL
- Skontroluj R2.dev subdomain access

---

**🚀 Tvoj BlackRent má teraz enterprise-grade cloud storage!** ☁️
