# 🚀 Railway Deployment - Dialničné známky s krajinami

## 📋 KROKY PRE NASADENIE

### **1️⃣ DATABÁZOVÁ MIGRÁCIA (POVINNÉ)**

Spusti tieto SQL príkazy v Railway PostgreSQL databáze:

```sql
-- Pridaj country a is_required stĺpce
ALTER TABLE vehicle_documents
ADD COLUMN IF NOT EXISTS country VARCHAR(2),
ADD COLUMN IF NOT EXISTS is_required BOOLEAN DEFAULT false;

-- Pridaj komentáre pre dokumentáciu
COMMENT ON COLUMN vehicle_documents.country IS 'Country code for vignette (SK, CZ, AT, HU, SI)';
COMMENT ON COLUMN vehicle_documents.is_required IS 'Whether the vignette is required (true) or optional (false)';

-- Vytvor index pre rýchlejšie filtrovanie podľa krajiny
CREATE INDEX IF NOT EXISTS idx_vehicle_documents_country ON vehicle_documents(country);

-- Skontroluj že zmeny sú správne
SELECT 
    column_name, 
    data_type, 
    is_nullable, 
    column_default
FROM 
    information_schema.columns 
WHERE 
    table_name = 'vehicle_documents' 
    AND column_name IN ('country', 'is_required');
```

### **2️⃣ RAILWAY BACKEND ÚPRAVA (ak potrebné)**

Backend by mal **automaticky akceptovať** nové polia `country` a `is_required` lebo používa `VehicleDocument` typ z frontendu.

**Skontroluj:**
```typescript
// V backend API endpoint /vehicle-documents
// Musí akceptovať:
interface VehicleDocument {
  country?: string; // SK, CZ, AT, HU, SI
  isRequired?: boolean; // true/false
}
```

### **3️⃣ FRONTEND DEPLOY**

```bash
cd /Users/mikailpirgozi/Desktop/Cursor\ zalohy\ mac16/Blackrent\ Beta\ 2/apps/web
npm run build
```

**Výsledok:** ✅ Build úspešný (už sme testovali)

### **4️⃣ GIT COMMIT & PUSH**

```bash
git add .
git commit -m "feat: Add country selection and required flag for vignettes

- Added VignetteCountry type (SK, CZ, AT, HU, SI)
- Added country and isRequired fields to VehicleDocument
- Updated UnifiedDocumentForm with country dropdown and required checkbox
- Updated BatchDocumentFormNew with vignette country fields
- Updated VehicleCentricInsuranceList to display flag emoji and required badge
- Added vignetteHelpers utility functions
- Added database migration script
- Frontend build: ✅ PASSED"

git push origin main
```

### **5️⃣ RAILWAY AUTO-DEPLOY**

Railway automaticky detekuje push na `main` branch a:
- ✅ Stiahne nový kód
- ✅ Spustí `npm run build`
- ✅ Restartuje službu
- ✅ Nasadí novú verziu

**Sleduj deployment:**
- Railway Dashboard → Deployments
- Očakávaný čas: 2-3 minúty

---

## ✅ OVERENIE FUNKČNOSTI

### **Po deploye:**

1. **Otvor aplikáciu na Railway URL**
2. **Choď do Poistky sekcie**
3. **Klikni na vozidlo → Pridať dokument**
4. **Vyber "Dialničná známka"**
5. **OVER ČI SA ZOBRAZUJÚ:**
   - ✅ Dropdown "Krajina dialničnej známky" s flag emoji
   - ✅ Checkbox "Povinná dialničná známka"
   - ✅ Validácia (nemôžeš uložiť bez výberu krajiny)

6. **Vytvor testovaciu dialničnú známku:**
   - Krajina: 🇸🇰 Slovensko
   - Povinná: ✅ Áno
   - Platné do: 31.12.2025
   - Cena: 50€

7. **OVER v tabuľke:**
   - ✅ Vidíš "Dialničná známka 🇸🇰"
   - ✅ Vidíš badge "⚠️ Povinná"

---

## 🔧 AK SA NIEČO POKAZILO

### **Problém: Dropdown krajín sa nezobrazuje**
```bash
# Skontroluj console v prehliadači (F12)
# Hľadaj chyby typu "VignetteCountry is not defined"
```

### **Problém: Backend neakceptuje country/isRequired**
```sql
-- Skontroluj že migrácia prebehla
SELECT column_name FROM information_schema.columns 
WHERE table_name = 'vehicle_documents' 
AND column_name IN ('country', 'is_required');
```

### **Problém: Dáta sa neukladajú**
```bash
# Skontroluj Railway logs
railway logs --service backend
```

---

## 📊 FINÁLNY STAV

**Frontend:**
- ✅ TypeScript typy rozšírené
- ✅ UI formulár s dropdown a checkbox
- ✅ Validácia krajiny
- ✅ Tabuľka zobrazuje flag emoji + badge
- ✅ Build prešiel úspešne

**Backend:**
- ⚠️ **MUSÍŠ SPUSTIŤ DB MIGRÁCIU** (SQL script vyššie)
- ⚠️ Backend by mal automaticky akceptovať nové polia

**Databáza:**
- ⚠️ **ČAKÁ NA MIGRÁCIU** (2 nové stĺpce)

---

## 🎉 PO DOKONČENÍ

Budete mať **plne funkčný systém** s:
- 🇸🇰 🇨🇿 🇦🇹 🇭🇺 🇸🇮 Výber 5 krajín
- ⚠️ Označenie povinných známok
- 📊 História všetkých dialničných známok per auto
- 🎨 Flag emoji v tabuľke
- ✅ Validácia vstupu

---

**Dôležité:** MUSÍŠ najprv spustiť DB migráciu predtým než pushneš kód na Railway!

