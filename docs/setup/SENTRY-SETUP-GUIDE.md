# 🚨 Sentry Error Tracking Setup - BlackRent

## ✅ Čo som už urobil automaticky:

1. **Frontend integrácia** - Pridané Sentry React komponenty
2. **Backend integrácia** - Pridané Sentry Node.js middleware  
3. **Error Boundary** - Automatické zachytávanie React chýb
4. **Environment variables** - Pripravené konfigurácie
5. **Dependencies** - Pridané všetky potrebné balíky

## 🎯 Čo musíš urobiť TY:

### **KROK 1: Vytvor Sentry účet a projekt**

1. **Choď na:** [sentry.io](https://sentry.io)
2. **Sign up** → vyberi "Continue with GitHub" (odporúčané)
3. **Create project** → **React** pre frontend projekt
4. **Vyberi** platform: **React**
5. **Project name:** `blackrent-frontend` 
6. **Skopíruj DSN** (vyzerá takto):
   ```
   https://abc123@o123456.ingest.sentry.io/123456
   ```

### **KROK 2: Vytvor druhý projekt pre backend**

1. **Create another project** → **Node.js**
2. **Project name:** `blackrent-backend`
3. **Skopíruj druhý DSN** pre backend

### **KROK 3: Nastav Environment Variables**

#### **Pre lokálny development:**

Vytvor `.env.local` súbor v root priečinku:
```bash
# Frontend Sentry
REACT_APP_SENTRY_DSN=https://your-frontend-dsn-here

# Pre testing (optional)
REACT_APP_VERSION=1.0.0
```

Uprav `.env` v `backend/` priečinku:
```bash
# Pridaj na koniec súboru:
SENTRY_DSN_BACKEND=https://your-backend-dsn-here
VERSION=1.0.0
```

#### **Pre Railway (produkcia):**

1. **Choď na Railway dashboard**
2. **Tvoj projekt** → **Variables** tab
3. **Pridaj tieto premenné:**
   ```bash
   REACT_APP_SENTRY_DSN=https://your-frontend-dsn-here
   SENTRY_DSN_BACKEND=https://your-backend-dsn-here
   VERSION=1.0.0
   ```

#### **Pre Vercel (ak používaš):**

1. **Vercel dashboard** → **Project Settings** → **Environment Variables**
2. **Pridaj:**
   ```bash
   REACT_APP_SENTRY_DSN=https://your-frontend-dsn-here
   ```

### **KROK 4: Nainštaluj dependencies**

```bash
# Frontend
npm install

# Backend  
cd backend && npm install
```

### **KROK 5: Testuj lokálne**

```bash
# Spusti backend
cd backend && npm run dev

# Spusti frontend (nový terminál)
npm run dev
```

**Ak je všetko správne, uvidíš v console:**
```
✅ Sentry frontend inicializovaný: https://abc123@o1234...
✅ Sentry backend inicializovaný: https://xyz789@o5678...
```

### **KROK 6: Nasaď na Railway**

```bash
# Automatické nasadenie
./auto-deploy.sh "feat: pridané Sentry error tracking"
```

## 🧪 **Testovanie Sentry**

### **Test frontend errors:**

Pridaj do ľubovoľného komponenta:
```javascript
// Pre test button
<Button onClick={() => { throw new Error('Test Sentry frontend error!') }}>
  Test Error
</Button>
```

### **Test backend errors:**

API endpoint pre test:
```bash
curl -X POST https://your-app.railway.app/api/test-error
```

### **Sleduj chyby v Sentry:**

1. **Choď na sentry.io** → **Projects**  
2. **Vyber blackrent-frontend** → **Issues** tab
3. **Vyber blackrent-backend** → **Issues** tab

## 📊 **Čo Sentry zachytí automaticky:**

### **Frontend:**
- ✅ React component crashes  
- ✅ JavaScript errors
- ✅ Promise rejections
- ✅ API call failures
- ✅ Routing errors

### **Backend:**
- ✅ Express.js crashes
- ✅ Database connection errors  
- ✅ API endpoint errors
- ✅ Unhandled promises
- ✅ 500 server errors

## 🚨 **Alerting nastavenie:**

1. **Sentry project** → **Settings** → **Alerts**
2. **Create Alert Rule**:
   - **When:** Error count is greater than 5 per hour
   - **Send notification to:** Tvoj email
   - **Action:** Send email immediately

## 💰 **Náklady:**

```
Sentry FREE tier:  5,000 errors/mesiac + 1 user
= Dostatočné pre BlackRent

Ak prekročíš → $26/mesiac = stále výhodné
```

## ✨ **Po nastavení budeš mať:**

- 🚨 **Okamžité notifikácie** o chybách
- 🔍 **Detailné stack traces** s presným radkom
- 👤 **User context** - kto mal chybu  
- 📊 **Performance monitoring**
- 📈 **Error trends** a analytics
- 🎯 **Zero setup** - všetko funguje automaticky

## 🆘 **Ak niečo nefunguje:**

1. **Skontroluj console logy** - Sentry píše debug info
2. **Overte DSN** - musí začínať `https://`
3. **Railway variables** - musia byť presne zadané
4. **Redeployni** aplikáciu po zmene variables

**Hotovo!** 🎉 Teraz budeš vedieť o každej chybe v BlackRent hneď ako sa stane! 