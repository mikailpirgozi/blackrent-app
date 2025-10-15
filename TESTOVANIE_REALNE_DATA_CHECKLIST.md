# ✅ Checklist: Reálne Dáta z Railway

## 🎯 Čo potrebuješ urobiť:

### **KROK 1: Commit & Push Backend Changes** 🚀
```bash
cd backend

# Add new API routes
git add src/routes/public-api.ts
git add src/routes/customer-auth.ts
git add src/routes/payments.ts
git add src/models/postgres-database.ts
git add src/index.ts

# Commit
git commit -m "feat: Add mobile app API endpoints (public API, customer auth, payments)"

# Push to Railway
git push origin main
```

### **KROK 2: Počkaj na Railway Deploy** ⏳
- Railway automaticky detekuje push
- Build trvá ~2-3 minúty
- Sleduj na: https://railway.app/project/blackrent-app
- Počkaj na "✅ Deployed"

### **KROK 3: Over že API funguje** 🌐
```bash
# Test public vehicles endpoint
curl "https://blackrent-app-production-4d6f.up.railway.app/api/public/vehicles?limit=3"

# Mali by si vidieť vozidlá alebo prázdny array
```

### **KROK 4: Pridaj Test Vozidlá do Databázy** 🚗

**Option A: Cez Web Admin Panel**
1. Otvor: https://blackrent-app.vercel.app
2. Prihlás sa ako admin
3. Choď do "Vozidlá" → "Pridať vozidlo"
4. Pridaj aspoň 3-5 vozidiel

**Option B: Cez SQL Script** (rýchlejšie)
```bash
# Spusti script na pridanie test vozidiel
cd backend
node scripts/seed-vehicles.js
```

### **KROK 5: Vypni Mock Data v Mobile App** 📱
```bash
cd apps/mobile

# Edit .env
# Zmeň: EXPO_PUBLIC_USE_MOCK_DATA=true
# Na:    EXPO_PUBLIC_USE_MOCK_DATA=false
```

### **KROK 6: Restart Mobile App** 🔄
```bash
# V Expo terminali stlač 'r' (reload)
# Alebo zatvori a spusti znova:
pnpm start
```

---

## 🔍 **Debugging Ak Niečo Nefunguje:**

### **Problém: API vracia 404**
```bash
# Check Railway logs
railway logs

# Over že backend beží
curl https://blackrent-app-production-4d6f.up.railway.app/api/test
```

### **Problém: Databáza je prázdna**
```bash
# Connect to Railway PostgreSQL
railway connect postgres

# Check vehicles table
SELECT COUNT(*) FROM vehicles;
```

### **Problém: Mobile app stále zobrazuje mock data**
```bash
# Clear cache
cd apps/mobile
rm -rf .expo
pnpm start --clear
```

---

## ✅ **Keď Všetko Funguje:**

Mal by si vidieť:
- ✅ Reálne vozidlá z databázy
- ✅ Správne ceny a detaily
- ✅ Fotky vozidiel (ak si ich nahral)
- ✅ Funkčný booking flow
- ✅ Žiadne "📦 Using mock data" logy

---

## 🚀 **Quick Commands:**

```bash
# 1. Commit backend
cd backend
git add src/routes/{public-api,customer-auth,payments}.ts src/models/postgres-database.ts src/index.ts
git commit -m "feat: Mobile app API endpoints"
git push

# 2. Wait for deploy (2-3 min)

# 3. Test API
curl "https://blackrent-app-production-4d6f.up.railway.app/api/public/vehicles?limit=3"

# 4. Switch to real data
cd ../apps/mobile
echo 'EXPO_PUBLIC_USE_MOCK_DATA=false' >> .env

# 5. Restart app
pnpm start
```

---

**Chceš aby som ti to spustil automaticky? (commit + push + config)** 🎯
