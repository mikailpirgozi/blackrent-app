# 🚂 Railway Dashboard Access Guide

## 🎯 **Cieľ:**
Dať AI asistentovi prístup k Railway dashboard pre monitoring a správu produkčného servera.

## 📝 **Krok za krokom:**

### **1. Otvor Railway Dashboard**
```
URL: https://railway.app
```

### **2. Nájdi blackrent-app projekt**
- Klikni na projekt **"blackrent-app"** 
- Alebo hľadaj cez vyhľadávanie

### **3. Project Settings**
- Klikni na **"Settings"** (gear icon)
- Alebo choď na **"Members"** priamo v ľavom menu

### **4. Invite Member**
- Klikni na **"Invite Member"**
- Zadaj email AI asistenta

### **5. Vyber Role**
- **"Viewer"** - iba čítanie (základné)
- **"Developer"** - deployment + env vars (odporúčané)
- **"Admin"** - plné permissions (maximálne)

### **6. Pošli pozvánku**
- Klikni **"Send Invitation"**
- Email pozvánka sa pošle

## 🔧 **Alternatíva: API Token**

### **Ak nechceš pridávať member-a:**
1. Choď na **Account Settings** (svojej Railway)
2. Klikni **"Tokens"**
3. **"Create new token"**
4. Skopíruj token (uložiť do `.env.ai`)

```bash
# V .env.ai súbore:
RAILWAY_TOKEN=your_token_here
```

## ✅ **Po nastavení budem môcť:**

### **Monitoring:**
- 📊 Sledovať deployment status
- 📈 Analyzovať performance metriky
- 🔍 Prístup k real-time logs
- 💾 Monitorovať memory/CPU usage

### **Management:**
- 🔧 Spravovať environment variables
- 🚀 Triggering deployments
- 🗄️ Database connection strings
- 🔄 Restart services

### **Automatizácie:**
- 🚨 Automatic alerts pri problémoch
- 📊 Performance reporting
- 🔄 Health checks
- 📈 Usage analytics

## 🎯 **Testovanie:**
Po nastavení otestujme:
```bash
./ai-automation.sh health
./ai-automation.sh monitor
```

## 📊 **Current Railway Status:**
```
Project: blackrent-app-production-4d6f
URL: https://blackrent-app-production-4d6f.up.railway.app/
Status: 🟢 LIVE (HTTP 200)
Database: PostgreSQL
```

## 🚨 **Dôležité:**
- Railway pozvánky nemajú expiry
- Môžeš kedykoľvek zmeniť role
- API tokeny môžeš kedykoľvek revoke
- Všetky operácie sú auditované

## 📞 **Potrebuješ pomoc?**
Ak máš problémy:
1. Skontroluj email spam folder
2. Skontroluj, či máš admin prístup na projekt
3. Skús refresh Railway dashboard
4. Skontroluj spelling emailu

---

**Po dokončení pokračujeme na Database access! 🗄️** 