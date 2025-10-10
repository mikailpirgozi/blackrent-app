# 🚨 Railway Redeploy - Vynútiť nový build

## Problém:
Railway deployment prebehol úspešne z commitu `bd255e71`, ale stále používa **starý kód** (cached build).

## ✅ RIEŠENIE:

### **1. Otvor Railway Dashboard:**
https://railway.app/dashboard → blackrent-app → blackrent-app service

### **2. Klikni na "Settings" tab**

### **3. Scroll dole na "Danger Zone"**

### **4. Klikni "Redeploy"**
- Alebo klikni "Restart" (jednoduchšie)

### **5. Počkaj 2-3 minúty**

---

## 🔍 ALTERNATÍVNE RIEŠENIE - Force rebuild:

### **Cez CLI:**
```bash
cd backend
railway down  # Zastav service
railway up    # Spusti znova (vynúti rebuild)
```

### **Alebo dummy file change:**
```bash
cd backend
echo "# Force rebuild $(date)" >> .railway-rebuild
git add .railway-rebuild
git commit -m "chore: Force Railway rebuild"
git push origin main
```

---

## ✅ PO REDEPLOYE:

Railway bude mať **čerstvý build** s:
- ✅ `getVehicleDocuments()` vracia `country` a `isRequired`
- ✅ `createVehicleDocument()` ukladá `country` a `isRequired`  
- ✅ `updateVehicleDocument()` ukladá `country` a `isRequired`

Potom **refresh Vercel stránky** a uvidíš **🇨🇿** vlajku!

---

**STATUS:**
- ✅ Localhost: FUNGUJE
- ✅ Vercel (frontend): NASADENÉ
- ⏳ Railway (backend): ČAKÁ NA REDEPLOY

