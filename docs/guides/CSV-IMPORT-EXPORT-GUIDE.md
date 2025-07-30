# 📊 CSV Import/Export Guide - Prenájmy

## 🎯 Prehľad

BlackRent aplikácia podporuje import a export prenájmov cez CSV súbory. Táto funkcionalita umožňuje:

- ✅ **Export** všetkých prenájmov do CSV súboru
- ✅ **Import** prenájmov z CSV súboru
- ✅ **Automatické vytváranie** chýbajúcich zákazníkov, firiem a vozidiel
- ✅ **Validácia dát** pri importe
- ✅ **Podpora pre mobile** aj desktop

## 🚀 Ako používať

### **Desktop verzia:**
1. Otvor sekciu **Prenájmy**
2. Klikni **"Export CSV"** pre stiahnutie súboru
3. Klikni **"Import CSV"** pre nahranie súboru

### **Mobile verzia:**
- CSV funkcionalita je dostupná len na desktop verzii
- Na mobile používaj desktop verziu pre import/export

## 📋 Formát CSV súboru

### **Stĺpce v CSV súbori:**

| Stĺpec | Popis | Povinný | Príklad |
|--------|-------|---------|---------|
| `id` | Unikátne ID prenájmu | Áno | `rental-123` |
| `licensePlate` | ŠPZ vozidla | Áno | `AB123CD` |
| `company` | Názov firmy vozidla | Áno | `AutoPožičovňa XYZ` |
| `brand` | Značka vozidla | Áno | `BMW` |
| `model` | Model vozidla | Áno | `X5` |
| `customerName` | Meno zákazníka | Áno | `Ján Novák` |
| `customerEmail` | Email zákazníka | Nie | `jan.novak@email.com` |
| `startDate` | Dátum začiatku | Áno | `27.1.2025` alebo `2025-01-27` |
| `endDate` | Dátum konca | Áno | `29.1.2025` alebo `2025-01-29` |
| `totalPrice` | Celková cena v € | Áno | `150.00` |
| `commission` | Provízia v € | Áno | `30.00` |
| `paymentMethod` | Spôsob platby | Áno | `cash` |
| `discountType` | Typ zľavy | Nie | `percentage` |
| `discountValue` | Hodnota zľavy | Nie | `10` |
| `customCommissionType` | Typ vlastnej provízie | Nie | `fixed` |
| `customCommissionValue` | Hodnota vlastnej provízie | Nie | `25` |
| `extraKmCharge` | Doplatok za km v € | Nie | `0.50` |
| `paid` | Či je uhradené | Áno | `1` (áno) / `0` (nie) |
| `handoverPlace` | Miesto prevzatia | Nie | `Bratislava` |
| `confirmed` | Či je potvrdené | Áno | `1` (áno) / `0` (nie) |

### **Spôsoby platby:**
- `cash` - Hotovosť
- `bank_transfer` - Bankový prevod
- `vrp` - VRP
- `direct_to_owner` - Priamo majiteľovi

### **Typy zľav/provízií:**
- `percentage` - Percentuálne
- `fixed` - Fixná suma

## 📤 Export CSV

### **Ako exportovať:**
1. Klikni **"Export CSV"** tlačidlo
2. Súbor sa automaticky stiahne ako `prenajmy.csv`
3. Obsahuje všetky aktuálne filtrované prenájmy

### **Čo sa exportuje:**
- ✅ Všetky polia prenájmu
- ✅ Údaje o vozidle (ŠPZ, značka, model, firma)
- ✅ Údaje o zákazníkovi (meno, email)
- ✅ Cenové informácie (cena, provízia, zľavy)
- ✅ Dátumy a stav (začiatok, koniec, uhradené, potvrdené)

## 📥 Import CSV

### **Ako importovať:**
1. Klikni **"Import CSV"** tlačidlo
2. Vyber CSV súbor
3. Systém automaticky spracuje dáta

### **Čo sa deje pri importe:**

#### **1. Vytvorenie zákazníkov:**
- Ak zákazník neexistuje, vytvorí sa automaticky
- Hľadá sa podľa mena a emailu
- Ak sa nenájde, vytvorí sa nový zákazník

#### **2. Vytvorenie firiem:**
- Ak firma neexistuje, vytvorí sa automaticky
- Hľadá sa podľa názvu firmy
- Ak sa nenájde, vytvorí sa nová firma

#### **3. Vytvorenie vozidiel:**
- Ak vozidlo neexistuje, vytvorí sa automaticky
- Hľadá sa podľa ŠPZ
- Vytvorí sa s defaultnými cenami a províziami

#### **4. Vytvorenie prenájmov:**
- Vytvorí sa nový prenájom s importovanými údajmi
- Validuje sa formát dát
- Spracuje sa dátum a čas

### **Validácia pri importe:**
- ✅ Kontrola povinných polí
- ✅ Validácia formátu dátumu
- ✅ Kontrola existencie vozidiel
- ✅ Validácia email adresy
- ✅ Kontrola číselných hodnôt

## 🛠️ Príklad CSV súboru

```csv
id,licensePlate,company,brand,model,customerName,customerEmail,startDate,endDate,totalPrice,commission,paymentMethod,discountType,discountValue,customCommissionType,customCommissionValue,extraKmCharge,paid,handoverPlace,confirmed
rental-001,AB123CD,AutoPožičovňa XYZ,BMW,X5,Ján Novák,jan.novak@email.com,27.1.2025,29.1.2025,150.00,30.00,cash,percentage,10,fixed,25,0.50,1,Bratislava,1
rental-002,XY789AB,AutoPožičovňa ABC,Audi,A4,Mária Kováčová,maria.kovacova@email.com,28.1.2025,30.1.2025,120.00,24.00,bank_transfer,,,percentage,20,,0,Košice,1
```

## ⚠️ Dôležité poznámky

### **Bezpečnosť:**
- Import prepíše existujúce dáta ak sa ID zhoduje
- Vždy si zálohuj dáta pred importom
- Skontroluj CSV súbor pred importom

### **Formát dátumu:**
Systém podporuje viacero formátov dátumov pri importe:

#### **Podporované formáty:**
- **Slovenský formát:** `27.1.2025` (deň.mesiac.rok)
- **Slovenský formát (krátky):** `27.1.` (automaticky pridá rok 2025)
- **ISO formát:** `2025-01-27` (rok-mesiac-deň)
- **ISO s časom:** `2025-01-27T00:00:00.000Z`

#### **Príklady:**
- `27.1.2025` ✅
- `27.1.` ✅ (automaticky 2025)
- `2025-01-27` ✅
- `27/1/2025` ❌ (používaj bodky)
- `1/27/2025` ❌ (nesprávny formát)

### **Kódovanie:**
- CSV súbor musí byť v UTF-8 kódovaní
- Používaj Excel alebo Google Sheets pre vytvorenie

### **Veľkosť súboru:**
- Odporúčaná veľkosť: do 10MB
- Maximálna veľkosť: 50MB
- Počet riadkov: do 10,000

## 🔧 Riešenie problémov

### **Import zlyhal:**
1. Skontroluj formát CSV súboru
2. Over či sú všetky povinné stĺpce prítomné
3. Skontroluj kódovanie súboru (UTF-8)
4. Over formát dátumu

### **Chyby pri validácii:**
1. Skontroluj či sú číselné hodnoty správne
2. Over formát email adresy
3. Skontroluj či ŠPZ nie je prázdne

### **Chýbajúce dáta:**
1. Systém automaticky vytvorí chýbajúce záznamy
2. Skontroluj logy pre detaily
3. Over či sa vytvorili správne

## 📱 Mobile podpora

### **Poznámka:**
- CSV funkcionalita je dostupná len na desktop verzii
- Na mobile používaj desktop verziu pre import/export
- Toto je z dôvodu lepšieho UX a bezpečnosti

## 🎉 Výhody

- ✅ **Rýchly export** všetkých dát
- ✅ **Automatický import** s validáciou
- ✅ **Backup a restore** funkcionalita
- ✅ **Migrácia dát** medzi systémami
- ✅ **Hromadné operácie** s prenájmi
- ✅ **Podpora pre mobile** aj desktop

---

**CSV import/export je teraz plne funkčný pre všetky prenájmy!** 🚀 