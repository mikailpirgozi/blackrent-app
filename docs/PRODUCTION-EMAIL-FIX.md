# 📧 Riešenie problému s emailami v produkcii

## 🔍 **PROBLÉM:**
V produkčnej aplikácii (https://blackrent-app.vercel.app/rentals) sa pri vytváraní protokolu zobrazí správa "protokol bol uložený", ale email sa neodošle zákazníkovi. Frontend hlási timeout po 60 sekundách.

## 🎯 **PRÍČINA:**
1. **Chýbajúce SMTP environment variables** v Railway produkčnom prostredí
2. **Krátky timeout** (60s) pre produkčné prostredie kde processing trvá dlhšie
3. **Railway + R2 + SMTP** processing je pomalší ako localhost

## ✅ **RIEŠENIE IMPLEMENTOVANÉ:**

### 1. **Optimalizované timeout nastavenia:**
- **Localhost:** 15s mobile, 20s desktop  
- **Produkcia:** 20s (ak trvá dlhšie, chýbajú SMTP nastavenia)
- Automatická detekcia produkčného prostredia

### 2. **Lepšie error handling:**
- Špecifické chybové hlášky pre produkciu
- Informácie o možných príčinách timeout-u
- Upozornenie že protokol sa možno uložil aj pri timeout-e

### 3. **Railway environment variables check script:**
```bash
./scripts/check-railway-env.sh
```

## 🔧 **POTREBNÉ KROKY PRE OPRAVU:**

### 1. **Nastavenie SMTP variables v Railway:**
```bash
railway variables set EMAIL_SEND_PROTOCOLS=true
railway variables set SMTP_HOST=smtp.m1.websupport.sk
railway variables set SMTP_PORT=465
railway variables set SMTP_SECURE=true
railway variables set SMTP_USER=info@blackrent.sk
railway variables set SMTP_PASS=your-websupport-password
railway variables set SMTP_FROM_NAME="BlackRent System"
```

### 2. **Deploy aktualizovaného kódu:**
```bash
npm run build
cd backend && npm run build
git add .
git commit -m "fix: optimalizované timeout a error handling pre produkčné emaily"
git push
```

### 3. **Overenie v Railway logs:**
Po deploy-i skontrolujte Railway logs pre:
- `📧 EMAIL: Service inicializovaný pre info@blackrent.sk`
- `✅ Background email sent to customer@email.com`

## 🚨 **KRITICKÉ ENVIRONMENT VARIABLES:**

**Potrebné pre email funkcionalitu:**
- `EMAIL_SEND_PROTOCOLS=true`
- `SMTP_HOST=smtp.m1.websupport.sk`
- `SMTP_PORT=465`
- `SMTP_SECURE=true`
- `SMTP_USER=info@blackrent.sk`
- `SMTP_PASS=your-websupport-password`
- `SMTP_FROM_NAME=BlackRent System`

**Potrebné pre R2 storage:**
- `R2_ENDPOINT`
- `R2_ACCESS_KEY_ID`
- `R2_SECRET_ACCESS_KEY`
- `R2_BUCKET_NAME`

## 📊 **TESTOVANIE:**

### 1. **Pred opravou:**
- Timeout po 60s
- Chyba: "AbortError: signal is aborted without reason"
- Email sa neodošle

### 2. **Po oprave:**
- Timeout po 20s (ak trvá dlhšie, problém je v SMTP nastaveniach)
- Jasné chybové hlášky o chýbajúcich SMTP variables
- Email sa odošle za pár sekúnd ak sú nastavené SMTP variables

## 🔍 **DIAGNOSTIKA:**

### Kontrola Railway environment:
```bash
./scripts/check-railway-env.sh
```

### Kontrola Railway logs:
```bash
railway logs
```

### Test lokálne:
```bash
npm run dev:start
# Protokol sa uloží a email odošle za pár sekúnd
```

## 📝 **POZNÁMKY:**
- Localhost funguje správne (email za pár sekúnd)
- Produkcia potrebuje dlhší timeout kvôli Railway infraštruktúre
- Backend má Quick Mode pre background processing
- Frontend musí čakať na dokončenie celého procesu
