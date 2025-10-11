# 🚀 **BLACKRENT MOBILE - DEPLOYMENT QUICK START**

## ⚡ **RÝCHLY ŠTART PRE DEPLOYMENT**

### **1️⃣ PRVÉ SPUSTENIE (One-time setup)**

```bash
# Naviguj do mobilnej aplikácie
cd apps/mobile

# Nastav production environment
npm run setup:production

# Skontroluj konfiguráciu
cat app.json | grep -A 10 "extra"
cat eas.json | grep -A 10 "submit"
```

### **2️⃣ DEVELOPMENT BUILD (Testovanie)**

```bash
# Spusti development build
npm run build:dev

# Alebo pre konkrétnu platformu
npm run build:dev ios
npm run build:dev android
```

### **3️⃣ PREVIEW BUILD (Internal testing)**

```bash
# Spusti preview build pre testovanie
npm run build:preview

# Testuj na reálnych zariadeniach
# Stiahni z EAS Dashboard a nainštaluj
```

### **4️⃣ PRODUCTION BUILD & DEPLOYMENT**

```bash
# Spusti production build
npm run build:prod

# Otestuj production build
# Potom submitni do app stores
npm run submit

# Alebo všetko naraz
npm run deploy
```

---

## 🔧 **DOSTUPNÉ PRÍKAZY**

### **Build Commands:**
```bash
npm run build:dev          # Development build (all platforms)
npm run build:preview      # Preview build (all platforms)  
npm run build:prod         # Production build (all platforms)
npm run build:ios          # Production build (iOS only)
npm run build:android      # Production build (Android only)
```

### **Submission Commands:**
```bash
npm run submit             # Submit to both stores
npm run submit:ios         # Submit to App Store only
npm run submit:android     # Submit to Google Play only
```

### **Utility Commands:**
```bash
npm run setup:production   # Configure production environment
npm run type-check         # TypeScript validation
npm run lint               # ESLint check
npm run clean              # Clear Expo cache
npm run doctor             # Expo diagnostics
```

---

## 📱 **TESTING WORKFLOW**

### **Lokálne testovanie:**
```bash
# Spusti development server
npm start

# Otestuj v simulátore
npm run ios     # iOS Simulator
npm run android # Android Emulator
```

### **Real device testing:**
```bash
# 1. Build preview version
npm run build:preview

# 2. Stiahni z EAS Dashboard
# 3. Nainštaluj na test devices
# 4. Otestuj všetky funkcie
```

### **Production testing:**
```bash
# 1. Build production version
npm run build:prod

# 2. Stiahni a otestuj
# 3. Ak všetko OK, submitni
npm run submit
```

---

## 🔐 **POTREBNÉ CREDENTIALS**

### **Pre EAS Build:**
- Expo account a login token
- Apple Developer account (iOS)
- Google Play Developer account (Android)

### **Pre automatické submission:**
- Apple ID, Team ID, ASC App ID
- Google Service Account JSON file

### **API Keys:**
- Stripe publishable keys (test + live)
- Backend API endpoints

---

## 📊 **MONITORING & DEBUGGING**

### **EAS Dashboard:**
```bash
# Zobraz build history
eas build:list

# Zobraz konkrétny build
eas build:view [build-id]

# Zobraz submission status
eas submit:list
```

### **Logs & Debugging:**
```bash
# Expo logs
expo logs

# Build logs v EAS Dashboard
# Crash reports v Sentry (ak nakonfigurované)
```

---

## 🚨 **TROUBLESHOOTING**

### **Build fails:**
```bash
# Clear cache a retry
npm run clean
npm run reset

# Check pre-build requirements
npm run doctor
npm run type-check
npm run lint
```

### **Submission fails:**
- Skontroluj credentials v `eas.json`
- Skontroluj app metadata v App Store Connect/Google Play
- Skontroluj že build je production profile

### **App crashes:**
- Skontroluj production API endpoints
- Skontroluj že všetky assets existujú
- Otestuj na reálnych zariadeniach

---

## 🎯 **BEST PRACTICES**

### **Pred každým build:**
1. ✅ Spusti `npm run lint`
2. ✅ Spusti `npm run type-check`  
3. ✅ Otestuj lokálne
4. ✅ Skontroluj že API funguje

### **Pred production submission:**
1. ✅ Otestuj preview build na reálnych zariadeniach
2. ✅ Skontroluj všetky credentials
3. ✅ Skontroluj app store metadata
4. ✅ Priprav marketing materials

### **Po submission:**
1. 📊 Monitoruj app store review process
2. 📊 Priprav sa na user feedback
3. 📊 Monitoruj crash reports
4. 📊 Plánuj updates a hotfixes

---

## 🔗 **UŽITOČNÉ LINKY**

- **EAS Dashboard:** https://expo.dev/accounts/[your-account]/projects/blackrent-mobile
- **App Store Connect:** https://appstoreconnect.apple.com
- **Google Play Console:** https://play.google.com/console
- **Expo Documentation:** https://docs.expo.dev/build/introduction/

---

## 🎉 **QUICK DEPLOYMENT CHECKLIST**

```bash
# ✅ 1. Setup (first time only)
npm run setup:production

# ✅ 2. Quality checks
npm run lint && npm run type-check

# ✅ 3. Preview build & test
npm run build:preview
# Test on real devices

# ✅ 4. Production build & submit
npm run build:prod
# Test production build
npm run submit

# ✅ 5. Monitor & celebrate! 🎉
```

**🚀 Ready to deploy BlackRent Mobile!**
