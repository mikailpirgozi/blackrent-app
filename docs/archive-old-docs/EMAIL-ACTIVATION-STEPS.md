# 📧 AKTIVÁCIA EMAILOVÉHO POSIELANIA PROTOKOLOV

## ✅ **Už nastavené:**
```bash
EMAIL_SEND_PROTOCOLS=true
SMTP_HOST=smtp.m1.websupport.sk
SMTP_PORT=465
SMTP_SECURE=true
SMTP_USER=info@blackrent.sk
SMTP_FROM_NAME=BlackRent System
PDF_GENERATOR_TYPE=pdf-lib
```

## 🔑 **Chýba len heslo:**

### **Krok 1: Pridaj SMTP heslo**
```bash
cd backend
echo 'SMTP_PASS=your-actual-email-password' >> .env
```

### **Krok 2: Reštartuj aplikáciu**
```bash
cd ..
npm run dev:restart
```

### **Krok 3: Otestuj email službu**
```bash
curl "http://localhost:3001/api/protocols/debug/test-email"
```

## 📧 **Ako bude fungovať:**

### **Automatické posielanie:**
1. **Vytvoríš protokol** → uloží sa do databázy
2. **PDF sa vygeneruje** → nahrá sa na R2 storage  
3. **Email sa odošle** → zákazník dostane PDF ako prílohu
4. **Protokol sa označí** → `emailSent: true`

### **Email obsahuje:**
- **Predmet:** `📄 Odovzdávací protokol - Ford Mustang AA399KY`
- **Obsah:** Detaily prenájmu a vozidla
- **Príloha:** PDF protokol
- **Od:** `BlackRent System <info@blackrent.sk>`

### **Logy:**
```
📧 Standard: Sending handover protocol email...
✅ Standard: Email sent successfully
```

## 🚨 **Dôležité:**

1. **Heslo musí byť správne** - inak email nebude fungovať
2. **Zákazník musí mať email** - inak sa email neodošle
3. **Email sa posiela na pozadí** - neblokuje vytvorenie protokolu
4. **Ak email zlyhá** - PDF je stále dostupný na R2

## 🔍 **Diagnostika:**

### **Skontroluj konfiguráciu:**
```bash
curl "http://localhost:3001/api/protocols/debug/test-email"
```

### **Sleduj email logy:**
```bash
tail -f logs/backend.log | grep EMAIL
```

### **Ak email nefunguje:**
1. Skontroluj heslo v `.env`
2. Skontroluj či Websupport povoľuje SMTP
3. Skontroluj firewall nastavenia
4. Otestuj cez `debug/test-email` endpoint

**Po pridaní hesla bude email automaticky fungovať! 📧✅**
