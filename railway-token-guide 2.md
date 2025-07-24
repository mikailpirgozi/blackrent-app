# 🚂 Railway API Token - Detailný Guide

## 📋 **Krok za krokom:**

### **KROK 1: Otvor Railway Dashboard**
1. Choď na **https://railway.app**
2. Prihlás sa do svojho Railway účtu

### **KROK 2: Account Settings**
1. Klikni na svoj **avatar/profil** (pravý horný roh)
2. V dropdown menu klikni na **"Account Settings"**

### **KROK 3: Tokens Section**
1. V ľavom menu klikni na **"Tokens"**
2. Uvidíš zoznam existujúcich tokenov (ak nejaké máš)

### **KROK 4: Create New Token**
1. Klikni na **"Create new token"** tlačidlo
2. Otvorí sa formulár pre vytvorenie tokenu

### **KROK 5: Nastavenie Token-u**

#### **Name (názov tokenu):**
```
AI Assistant - BlackRent Automation
```

#### **Permissions (oprávnenia):**
- ✅ **Project Access** - vyber svoj blackrent-app projekt
- ✅ **Read** - pre monitoring a analytics
- ✅ **Write** - pre deployment a environment variables

### **KROK 6: Generate Token**
1. Klikni **"Create Token"**
2. **DÔLEŽITÉ:** Token sa zobrazí len raz!
3. **Skopíruj token** (obvykle začína písmenom alebo číslom)

### **KROK 7: Pošli mi token**
Token vyzerá asi takto:
```
xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx
```

## 🔒 **Bezpečnosť:**
- Token je ako heslo - chráň ho
- Nikdy ho nezdieľaj verejne
- Môžeš ho kedykoľvek revoke (zrušiť)
- Uložím ho bezpečne do `.env.ai` súboru

## 🎯 **Po vytvorení token-u:**
Jednoducho mi napíš:
```
Railway token: tvoj_token_tu
```

## ✅ **Po nastavení budem môcť:**

### **Monitoring:**
- 📊 Real-time deployment status
- 📈 Performance metriky (CPU, memory)
- 🔍 Live application logs
- 💾 Database connection monitoring

### **Management:**
- 🔧 Environment variables management
- 🚀 Trigger deployments
- 🔄 Service restarts
- 📋 Build logs analysis

### **Automatizácie:**
- 🚨 Automated alerts pri problémoch
- 📊 Performance reporting každých 5 minút
- 🔍 Health checks každú minútu
- 📈 Usage analytics denné reporty

## 🧪 **Testovanie po nastavení:**
```bash
# Test Railway API prístupu
./ai-automation.sh monitor

# Test deployment status
./ai-automation.sh health

# Full system status
./ai-automation.sh status
```

## 🚨 **Troubleshooting:**

### **Ak nevidíš "Tokens" sekciu:**
- Skontroluj, či si prihlásený
- Refresh stránky
- Skús iný prehliadač

### **Ak nemáš dostatočné permissions:**
- Skontroluj, či si vlastník blackrent-app projektu
- Skús osobný účet namiesto organization

### **Ak token nefunguje:**
- Skontroluj, či má správne permissions na blackrent-app
- Skontroluj, či nie je expired
- Vytvor nový token

## 📱 **URL pre rýchly prístup:**
```
1. Railway Dashboard: https://railway.app
2. Account Settings: https://railway.app/account
3. Tokens: https://railway.app/account/tokens
```

---

**Po vytvorení tokenu mi ho pošli a pokračujeme na databázu! 🗄️** 