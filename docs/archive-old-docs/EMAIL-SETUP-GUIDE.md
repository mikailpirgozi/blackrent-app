# 📧 **EMAIL AUTOMATIZÁCIA - SETUP GUIDE**

Implementácia automatického odosielania PDF protokolov zákazníkom emailom.

## 🚀 **ČO BOLO IMPLEMENTOVANÉ**

### ✅ **1. Email Service (`backend/src/services/email-service.ts`)**
- **SMTP konfigurácia** pre Websupport server
- **HTML šablóny** pre odovzdávacie a preberacie protokoly
- **PDF prílohy** s automatickým názvom súboru
- **Error handling** a retry logika
- **Connection testing** funkcionalita

### ✅ **2. Protocol Routes integrácia (`backend/src/routes/protocols.ts`)**
- **Handover protocols** - automatický email po PDF generovaní
- **Return protocols** - automatický email s finančným zúčtovaním
- **Background processing** - neblokuje UI
- **Quick mode support** - email sa odošle na pozadí
- **Database updates** - `emailSent` a `emailSentAt` polia

### ✅ **3. Environment konfigurácia (`backend/env.example`)**
- **SMTP nastavenia** pre Websupport
- **Email feature flags** pre zapnutie/vypnutie
- **Používa existujúci účet** `info@blackrent.sk`

---

## ⚙️ **SETUP INŠTRUKCIE**

### **KROK 1: Environment Variables**
Pridaj do `backend/.env` súboru:

```bash
# SMTP Email Sending Configuration (uses same Websupport account)
SMTP_HOST=smtp.websupport.sk
SMTP_PORT=587
SMTP_USER=info@blackrent.sk
SMTP_PASS=your-email-password-here  # Ten istý ako IMAP_PASSWORD
SMTP_FROM_NAME=BlackRent System
EMAIL_SEND_PROTOCOLS=true
```

### **KROK 2: Reštart aplikácie**
```bash
cd backend
npm run build
npm run dev  # alebo npm start pre produkciu
```

### **KROK 3: Test pripojenia**
Otvor v prehliadači:
```
http://localhost:3001/api/protocols/debug/test-email
```

Očakávaná odpoveď:
```json
{
  "success": true,
  "message": "Email service connection successful",
  "config": {
    "host": "smtp.websupport.sk",
    "port": "587",
    "user": "info@blackrent.sk",
    "enabled": true
  }
}
```

---

## 🎯 **AKO TO FUNGUJE**

### **1. Odovzdávací protokol workflow:**
```
Vytvorenie protokolu → PDF generovanie → PDF upload do R2 → 📧 Email na pozadí → Database update
```

### **2. Preberací protokol workflow:**
```
Vytvorenie protokolu → PDF generovanie → PDF upload do R2 → 📧 Email s finančným zúčtovaním → Database update
```

### **3. Email obsahuje:**
- ✅ **Profesionálne HTML šablóny** s BlackRent brandingom
- ✅ **PDF protokol v prílohe** s popisným názvom
- ✅ **Detaily prenájmu** (objednávka, vozidlo, dátumy, ceny)
- ✅ **Kontaktné informácie** BlackRent
- ✅ **Finančné zúčtovanie** (len pre preberací protokol)

---

## 🔧 **TECHNICKÉ DETAILY**

### **Background Processing**
- Emaily sa odosielajú **na pozadí** pomocou `setImmediate()`
- **Neblokuje UI** - používateľ dostane okamžitú odpoveď
- **Error handling** - email chyba neblokuje protokol

### **Database Fields**
Protokoly majú nové polia:
- `emailSent: boolean` - či bol email odoslaný
- `emailSentAt: Date` - kedy bol email odoslaný

### **Email Templates**
- **Handover**: Zelená farba, informácie o prevzatí
- **Return**: Modrá farba, finančné zúčtovanie
- **Responsive design** - funguje na mobile aj desktop
- **Professional styling** s BlackRent brandingom

---

## 🧪 **TESTOVANIE**

### **1. Test SMTP pripojenia:**
```bash
curl http://localhost:3001/api/protocols/debug/test-email
```

### **2. Test protokolu s emailom:**
1. Vytvor protokol cez UI
2. Uisti sa že zákazník má email adresu
3. Skontroluj logy:
   ```
   ✅ Background: Email sent successfully
   ```

### **3. Debugging:**
Logy na sledovanie:
```
📧 Background: Sending handover protocol email...
✅ Background: Email sent successfully
❌ Background: Email sending failed: [error]
⚠️ Background: No customer email found, skipping email sending
```

---

## 🚨 **TROUBLESHOOTING**

### **Problem: Email sa neodošle**
**Riešenie:**
1. Skontroluj `EMAIL_SEND_PROTOCOLS=true` v `.env`
2. Skontroluj `SMTP_PASS` - musí byť správne heslo
3. Test pripojenia: `/api/protocols/debug/test-email`

### **Problem: SMTP connection failed**
**Riešenie:**
1. Skontroluj Websupport SMTP nastavenia
2. Možno treba povoliť SMTP v Websupport paneli
3. Skús port 465 s `secure: true`

### **Problem: Zákazník nedostane email**
**Riešenie:**
1. Skontroluj či má zákazník email adresu v databáze
2. Skontroluj spam folder
3. Skontroluj backend logy pre chyby

---

## 📊 **MONITORING**

### **Database Query - Email Status:**
```sql
SELECT 
  id, 
  email_sent, 
  email_sent_at,
  created_at
FROM handover_protocols 
WHERE email_sent = true 
ORDER BY created_at DESC;
```

### **Successful Email Count:**
```sql
SELECT 
  COUNT(*) as total_emails_sent,
  COUNT(*) FILTER (WHERE email_sent_at > NOW() - INTERVAL '24 hours') as today_count
FROM handover_protocols 
WHERE email_sent = true;
```

---

## 🎉 **VÝSLEDOK**

Po implementácii:
- ✅ **Automatické emaily** po vytvorení protokolov
- ✅ **Profesionálne HTML šablóny** 
- ✅ **PDF prílohy** s popisnými názvami
- ✅ **Background processing** - rýchle UI
- ✅ **Kompletné loggovanie** pre debugging
- ✅ **Využíva existujúci email** `info@blackrent.sk`
- ✅ **Žiadne dodatočné náklady**

**Zákazníci teraz automaticky dostanú protokoly emailom hneď po ich vytvorení!** 🎯
