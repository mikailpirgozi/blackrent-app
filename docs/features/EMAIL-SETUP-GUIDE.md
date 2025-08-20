# 📧 EMAIL SETUP GUIDE - Nastavenie emailového posielania protokolov

## 🎯 Potrebné environment premenné v `backend/.env`:

```bash
# ✅ POVINNÉ: Aktivácia email služby
EMAIL_SEND_PROTOCOLS=true

# ✅ SMTP konfigurácia (Websupport)
SMTP_HOST=smtp.m1.websupport.sk
SMTP_PORT=465
SMTP_SECURE=true
SMTP_USER=info@blackrent.sk
SMTP_PASS=your-actual-email-password
SMTP_FROM_NAME=BlackRent System

# ✅ PDF generátor (už nastavené)
PDF_GENERATOR_TYPE=pdf-lib
```

## 🔧 **Kroky pre aktiváciu:**

### 1. **Nastavenie SMTP údajov:**
```bash
cd backend
echo 'EMAIL_SEND_PROTOCOLS=true' >> .env
echo 'SMTP_HOST=smtp.m1.websupport.sk' >> .env
echo 'SMTP_PORT=465' >> .env
echo 'SMTP_SECURE=true' >> .env
echo 'SMTP_USER=info@blackrent.sk' >> .env
echo 'SMTP_PASS=your-actual-password' >> .env
echo 'SMTP_FROM_NAME=BlackRent System' >> .env
```

### 2. **Reštart aplikácie:**
```bash
npm run dev:restart
```

### 3. **Test email služby:**
```bash
curl "http://localhost:3001/api/protocols/debug/test-email"
```

## 📧 **Ako funguje email posielanie:**

### **Workflow protokolov:**
```
1. Vytvor protokol → databáza
2. Vygeneruj PDF → R2 upload  
3. Aktualizuj protokol s R2 URL
4. Odošli email s PDF attachment (background)
```

### **Email template obsahuje:**
- **Predmet:** `📄 Odovzdávací protokol - [Vozidlo]`
- **Obsah:** Detaily prenájmu, vozidla, zákazníka
- **Príloha:** PDF protokol
- **Odosielateľ:** `BlackRent System <info@blackrent.sk>`

### **Automatické posielanie:**
- ✅ **Handover protokoly** - po vytvorení a R2 upload
- ✅ **Return protokoly** - po vytvorení a R2 upload
- ✅ **Background processing** - neblokuje UI
- ✅ **Error handling** - ak email zlyhá, PDF je stále dostupný

## 🔍 **Diagnostika:**

### **Kontrola konfigurácie:**
```bash
curl "http://localhost:3001/api/protocols/debug/pdf-config"
curl "http://localhost:3001/api/protocols/debug/test-email"
```

### **Logy email služby:**
```bash
tail -f logs/backend.log | grep EMAIL
```

### **Možné problémy:**
1. **`EMAIL_SEND_PROTOCOLS=false`** → nastaviť na `true`
2. **Chýba `SMTP_PASS`** → pridať heslo
3. **Neplatné SMTP údaje** → skontrolovať Websupport nastavenia
4. **Firewall blokuje port 465** → skontrolovať sieťové nastavenia

## 🎯 **Výsledok:**
Po správnej konfigurácii sa budú protokoly automaticky posielať emailom zákazníkom s PDF prílohou hneď po vytvorení a uložení na R2 storage.

**Workflow bude:**
```
Vytvor protokol → PDF na R2 → Email s PDF → Zákazník dostane protokol
```
