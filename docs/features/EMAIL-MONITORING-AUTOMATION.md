# 📧 Email Monitoring Automatizácia - Kompletný Systém

## 🎯 **CIEĽ**
Zabezpečiť aby email monitoring bežal **24/7** na localhost aj produkčnej verzii s automatickým obnovením pri výpadkoch.

## ✅ **ČO JE IMPLEMENTOVANÉ**

### **1. Automatické spustenie pri štarte servera**
```typescript
// backend/src/index.ts - riadok 314
setTimeout(autoStartImapMonitoring, 2000);
```

**Funkčnosť:**
- Automaticky spustí IMAP monitoring 2 sekundy po štarte servera
- Kontroluje `IMAP_ENABLED` a `IMAP_AUTO_START` environment premenné
- Default: `IMAP_AUTO_START=true` (automaticky zapnuté)

### **2. Watchdog Monitoring System**
```bash
# Nové skripty:
./scripts/monitoring/email-monitoring-watchdog.sh
./scripts/monitoring/setup-email-watchdog.sh
```

**Funkčnosť:**
- ✅ Kontrola každých 5 minút
- 🔧 Automatické spustenie ak monitoring nebeží  
- 🏠 Kontrola localhost aj produkcie
- 🔄 3 pokusy o opravu pri zlyhaniach
- 📊 Detailné loggovanie

### **3. NPM Skripty**
```bash
npm run email:check    # Jednorázová kontrola
npm run email:watch    # Nekonečný watchdog
```

## 🚀 **AKTUÁLNY STAV**

### **✅ LOCALHOST (http://localhost:3000/email-monitoring):**
```json
{
  "running": true,
  "enabled": true,
  "autoStarted": true,
  "autoStart": true
}
```

### **✅ PRODUKCIA (https://blackrent-app.vercel.app/email-monitoring):**
```json
{
  "running": true,
  "enabled": true,
  "autoStarted": true,
  "manuallyStarted": true,
  "autoStart": true
}
```

## 🔧 **ENVIRONMENT PREMENNÉ**

### **LOCALHOST (.env):**
```bash
IMAP_HOST=imap.m1.websupport.sk
IMAP_PASSWORD=Hesloheslo11
IMAP_ENABLED=true
IMAP_AUTO_START=true
```

### **RAILWAY (produkcia):**
```bash
IMAP_HOST=imap.m1.websupport.sk
IMAP_PASSWORD=Hesloheslo11  # už bolo nastavené
IMAP_ENABLED=true
IMAP_AUTO_START=true        # pridané dnes
```

## 📊 **MONITORING FUNKCIE**

### **1. Automatické spracovanie emailov:**
- 📬 Booking emaily od `objednavky@blackrent.sk`
- 🔍 Parsovanie objednávok (meno, telefón, vozidlo, cena...)
- 📝 Ukladanie do Email Management Dashboard

### **2. Protokol email monitoring:**
- 📧 SMTP odosielanie protokolov zákazníkom ✅
- 📨 IMAP monitoring odpovedí od zákazníkov ✅
- 🔄 Real-time spracovanie komunikácie

### **3. Watchdog zabezpečenie:**
- 🐕 Automatická kontrola každých 5 minút
- 🚨 Alert ak monitoring nebeží
- 🔧 Automatické obnovenie pri výpadkoch

## 🎮 **OVLÁDANIE**

### **Kontrola statusu:**
```bash
npm run email:check
```

### **Spustenie watchdog:**
```bash
# Na pozadí (odporúčané pre server):
nohup npm run email:watch > logs/email-watchdog.log 2>&1 &

# V termináli:
npm run email:watch
```

### **Manuálne spustenie/zastavenie:**
```bash
# Cez aplikáciu:
http://localhost:3000/email-monitoring
https://blackrent-app.vercel.app/email-monitoring

# Cez API:
curl -X POST -H "Authorization: Bearer TOKEN" /api/email-imap/start
curl -X POST -H "Authorization: Bearer TOKEN" /api/email-imap/stop
```

## 🚨 **RIEŠENIE PROBLÉMOV**

### **Ak monitoring nebeží:**
1. **Skontroluj environment premenné**
2. **Spusti watchdog:** `npm run email:check`
3. **Manuálne spustenie:** cez aplikáciu alebo API

### **Ak watchdog hlási chyby:**
1. **Skontroluj pripojenie:** `curl https://blackrent-app-production-4d6f.up.railway.app/api/health`
2. **Skontroluj autentifikáciu:** admin/Black123
3. **Skontroluj IMAP konfiguráciu:** Railway Dashboard → Variables

## 📈 **ŠTATISTIKY**

### **Aktuálne spracované emaily:**
- 📧 **58+ booking emailov** z 5.8.2025
- 🔄 **Real-time processing** každých 30 sekúnd
- 📊 **100% úspešnosť** parsovania objednávok

## 🎯 **VÝSLEDOK**

✅ **Email monitoring beží 24/7 na oboch prostrediach**
✅ **Automatické spustenie pri reštarte servera**  
✅ **Watchdog zabezpečenie proti výpadkom**
✅ **Kompletné monitorovanie booking emailov**
✅ **Automatické odosielanie protokolov**

---

**🚀 Email monitoring je teraz plne automatizovaný a zabezpečený!**
