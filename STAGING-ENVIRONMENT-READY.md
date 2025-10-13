# ✅ STAGING ENVIRONMENT - READY FOR SETUP

**Dátum:** 2025-10-13  
**Status:** 🟡 PRIPRAVENÉ - Čaká na Railway konfigu ráciu  
**Branch:** `staging` (pushed to GitHub)

---

## 🎯 ČO SME DOKONČILI

### **1. ✅ Staging Branch**
- Vytvorený `staging` branch
- Pushed na GitHub: `origin/staging`
- Automaticky oddelený od `main` (production)

### **2. ✅ Dokumentácia**
- **STAGING-SETUP.md** - Kompletný workflow (development → staging → production)
- **STAGING-RAILWAY-SETUP-INSTRUCTIONS.md** - Krok-za-krokom Railway setup
- **FASTIFY-MIGRATION-ISSUES.md** - Testovacia checklist (159 endpointov)

### **3. ✅ Konfigurácia**
- **railway.staging.json** - Railway staging konfigurácia
- Dockerfile.railway ready
- Environment variables documented

---

## 🚀 ČO MUSÍŠ UROBIŤ TERAZ

### **KROK 1: Vytvor Staging Railway Projekt (10 minút)**

Otvor a postupuj podľa:
```
docs/deployment/STAGING-RAILWAY-SETUP-INSTRUCTIONS.md
```

**Stručne:**
1. Railway Dashboard → New Project
2. Deploy from GitHub → blackrent repository
3. Rename na: `blackrent-staging`
4. Settings → Source → Branch: **`staging`**
5. Variables → Pridaj DATABASE_URL, JWT_SECRET, R2_*, atď.
6. Deploy Settings → Dockerfile: `Dockerfile.railway`
7. Generate Domain → Získaj staging URL

---

### **KROK 2: Test Staging Environment (30 minút)**

```bash
# Get staging URL from Railway
STAGING_URL="https://blackrent-staging-production.up.railway.app"

# Test health check
curl $STAGING_URL/health

# Expected response:
# {
#   "status": "ok",
#   "framework": "fastify",
#   "database": "connected",
#   "environment": "staging"
# }
```

**Kompletná test checklist:**
```
docs/deployment/FASTIFY-MIGRATION-ISSUES.md
```

---

### **KROK 3: Fix Issues (podľa potreby)**

**Ak niečo nefunguje na stagingu:**

```bash
# 1. Oprav lokálne
cd backend
npm run dev

# 2. Commit & push na staging
git add .
git commit -m "fix: problem X on staging"
git push origin staging

# 3. Railway auto-deploy
# 4. Test znova
# 5. Opakuj kým nie je 100% OK
```

---

### **KROK 4: Production Deploy (len keď staging OK)**

```bash
# Keď je staging 100% funkčný:
git checkout main
git merge staging
git push origin main

# Railway PRODUCTION automaticky deployuje
```

---

## 📊 CURRENT STATUS

### **✅ HOTOVO:**
- ✅ Staging branch vytvorený a pushed
- ✅ Dokumentácia kompletná
- ✅ Railway konfigurácia pripravená
- ✅ Testing checklist pripravený

### **⏳ ČAKÁ NA TEBA:**
- ⏳ Vytvor staging Railway projekt (Railway Dashboard)
- ⏳ Nastav environment variables
- ⏳ Deploy a test staging environment
- ⏳ Fix všetky problémy
- ⏳ Production deployment

---

## 🎯 PREČO TO ROBÍME

### **Tvoj problém:**
> "Po migrácii mi veľa vecí nefunguje a nemôžem riskovať že sa zmeny prejavia na produkčnej stránke a nebude mi nič fungovať."

### **Naše riešenie:**
```
Development (localhost) → Staging (Railway) → Production (Railway)
      ✅ Safe              ✅ Safe              ✅ Safe
```

**Benefits:**
- ✅ **Zero risk** pre produkciu
- ✅ Môžeš **rozbíjať čo chceš** na stagingu
- ✅ **Reálne cloud testing** (nie len localhost)
- ✅ **DEV databáza** (nie production dáta)
- ✅ **Automatic deploys** z staging branchu
- ✅ **Production deploy** len keď staging OK

---

## 📋 QUICK REFERENCE

### **Git Workflow:**
```bash
# Development
git checkout staging
git add .
git commit -m "feat: new feature"
git push origin staging

# Production (len keď staging OK)
git checkout main
git merge staging
git push origin main
```

### **Railway Projects:**
```
🟡 blackrent-staging
   Branch: staging
   Database: DEV (switchyard:41478)
   URL: https://blackrent-staging-production.up.railway.app
   
🔴 blackrent-production
   Branch: main
   Database: PROD (trolley:13400)
   URL: https://blackrent-app-production-4d6f.up.railway.app
```

### **Testing Workflow:**
```
1. Develop lokálne (localhost:3001)
2. Push na staging branch
3. Test na Railway Staging
4. Fix problems
5. Opakuj 1-4 kým nie je 100% OK
6. Merge do main → Production deploy
```

---

## 🚨 DÔLEŽITÉ UPOZORNENIA

### **✅ VŽDY:**
- ✅ Testuj najskôr **lokálne**
- ✅ Potom testuj na **stagingu**
- ✅ **LEN** po úspešnom staging teste deployuj na **production**
- ✅ Staging používa **DEV databázu** (nie production)

### **❌ NIKDY:**
- ❌ Nepushuj na **main** branch kým staging nefunguje 100%
- ❌ Nepoužívaj **PROD databázu** na stagingu
- ❌ Neskáč staging testing pre "malé" zmeny
- ❌ Netestuj rizikovejšie zmeny priamo na production

---

## 📖 DOKUMENTY

### **Setup:**
- `docs/deployment/STAGING-RAILWAY-SETUP-INSTRUCTIONS.md` - Krok-za-krokom Railway setup
- `docs/deployment/STAGING-SETUP.md` - Kompletný workflow
- `railway.staging.json` - Railway konfigurácia

### **Testing:**
- `docs/deployment/FASTIFY-MIGRATION-ISSUES.md` - Testovacia checklist (159 endpointov)
- Known issues a priority
- Performance testing

### **Migrations:**
- `FASTIFY_MIGRATION_COMPLETE.md` - Migračný report (159/159 endpointov)
- `MIGRATION_COMPLETE_NEXT_STEPS.md` - Deployment kroky

---

## ✅ NEXT STEPS

1. **Otvor Railway Dashboard:** https://railway.app
2. **Postupuj podľa:** `docs/deployment/STAGING-RAILWAY-SETUP-INSTRUCTIONS.md`
3. **Test staging environment**
4. **Fix issues** (ak sú)
5. **Production deploy** (keď staging OK)

---

## 🎉 VÝSLEDOK

**Po dokončení budeš mať:**
- ✅ Bezpečný staging environment
- ✅ Fastify migráciu plne otestovanú
- ✅ Zero risk pre produkciu
- ✅ Automatické deploys z Git
- ✅ Separation of concerns (dev/staging/prod)

**Môžeš pokojne testovať Fastify bez strachu že niečo rozbiješ v produkcii!** 🚀

---

**Pripravený? Choď na Railway Dashboard a začni setup! 💪**

