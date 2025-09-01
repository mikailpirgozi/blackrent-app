# Playbook: Pridaj nové pole end-to-end (DB → API → UI → výpočet)

## 📋 Mini špecifikácia (5 min pred kódom)

### 1. Cieľ
**Jedna veta:** Pridať [POLE_NÁZOV], nech sa [ÚČEL/FUNKCIONALITA].

**Príklad:** *Pridať vehicle.current_mileage, nech sa sleduje aktuálny stav kilometrov pre každé vozidlo.*

### 2. Kde sa ukladá
- **Tabuľka:** `[tabuľka_názov]`
- **Stĺpec:** `[stĺpec_názov]`
- **Typ:** `VARCHAR(255)` | `INTEGER` | `DECIMAL(10,2)` | `BOOLEAN` | `TIMESTAMP` | `UUID`
- **Default:** `NULL` | `0` | `''` | `NOW()` | `gen_random_uuid()`
- **Constraint:** `NOT NULL` | `UNIQUE` | `CHECK (value > 0)` | `REFERENCES table(id)`

**Príklad:**
```sql
-- Tabuľka: vehicles
-- Stĺpec: current_mileage  
-- Typ: INTEGER
-- Default: 0
-- Constraint: CHECK (current_mileage >= 0)
```

### 3. Ako tečie
- **Odkiaľ sa preberá:** 
  - ✅ Copy (duplikuje sa hodnota)
  - ✅ Referenčne viazané (foreign key)
  - ✅ Vypočítané (derived from other fields)
- **Kedy sa kopíruje:** Pri vytvorení | Pri update | Scheduled job | Manual trigger

**Príklad:** *current_mileage sa kopíruje z handover protokolu do vehicle tabuľky pri každom return protokole.*

### 4. Editácia a autorita
- **Autoritatívny zdroj:** Ktorá tabuľka/entita je "single source of truth"
- **Kto môže meniť:** Admin only | Company owner | System auto-update | Customer input
- **Konflikt handling:** Čo sa stane ak sa pokúsi zmeniť z viacerých miest

**Príklad:** *Autoritatívny zdroj: protocols tabuľka. Môže meniť: len admin pri vytváraní protokolu. Vehicle.current_mileage sa auto-updatuje z najnovšieho protokolu.*

### 5. Akceptačné podmienky (4-6 bodov)

**Hotovo keď:**
- [ ] Migrácia pridá stĺpec bez chýb
- [ ] Backend API endpoint vracia nové pole v response
- [ ] Frontend zobrazuje pole v relevantných komponentoch  
- [ ] Validácia funguje (frontend + backend)
- [ ] Testy prechádzajú (unit + integration)
- [ ] Existing functionality zostáva nezmenená

---

## 🛠 Implementačný checklist

### Phase 1: Database
- [ ] Vytvor migration súbor `database/migrations/XXX_add_[pole]_to_[tabuľka].sql`
- [ ] Spusti migration: `npm run migrate`
- [ ] Verify: `psql` query na staging DB

### Phase 2: Backend API
- [ ] Updatni TypeScript typy v `backend/src/types/`
- [ ] Pridaj validáciu do relevantných endpointov
- [ ] Updatni database queries (SELECT, INSERT, UPDATE)
- [ ] Pridaj/updatni unit testy
- [ ] Test: `cd backend && npm run test`

### Phase 3: Frontend
- [ ] Updatni TypeScript interfaces v `src/types/`
- [ ] Pridaj pole do relevantných komponentov
- [ ] Updatni forms a validation (Zod schemas)
- [ ] Pridaj UI testy
- [ ] Test: `npm run test`

### Phase 4: Integration
- [ ] End-to-end test celého flow
- [ ] Test na staging prostredí
- [ ] Performance check (ak potrebné)
- [ ] Build test: `npm run build && cd backend && npm run build`

---

## 📚 BlackRent-specific examples

### Example 1: Vehicle mileage tracking
```markdown
**Cieľ:** Pridať vehicle.current_mileage, nech sa sleduje aktuálny stav kilometrov.

**Kde:** vehicles tabuľka, current_mileage INTEGER DEFAULT 0 CHECK (current_mileage >= 0)

**Ako tečie:** Kopíruje sa z return_protocols.ending_mileage pri ukončení prenájmu

**Autorita:** protocols tabuľka je source of truth, vehicle.current_mileage je cache

**Hotovo keď:**
- [ ] Vehicle detail zobrazuje current mileage
- [ ] Return protocol updatuje vehicle mileage  
- [ ] Vehicle list má sorting by mileage
- [ ] Validation: ending_mileage >= starting_mileage
```

### Example 2: Company-specific pricing
```markdown
**Cieľ:** Pridať vehicles.company_price_override, nech majitelia môžu nastaviť vlastné ceny.

**Kde:** vehicles tabuľka, company_price_override DECIMAL(10,2) NULL

**Ako tečie:** Nastavuje company owner, fallback na vehicles.base_price

**Autorita:** Company owner môže meniť, admin môže override

**Hotovo keď:**
- [ ] Company dashboard má price management
- [ ] Booking kalkulácia používa override ak existuje
- [ ] Admin môže vidieť/editovať všetky prices
- [ ] History tracking pre price changes
```

### Example 3: Protocol attachments
```markdown
**Cieľ:** Pridať protocol_attachments tabuľka, nech sa môžu prikladať extra súbory.

**Kde:** Nová tabuľka protocol_attachments (protocol_id UUID, file_path VARCHAR, uploaded_at TIMESTAMP)

**Jak tečie:** Upload → R2 storage → DB record → zobrazenie v UI

**Autorita:** Len creator protokolu môže pridávať, admin môže mazať

**Hotovo keď:**
- [ ] Upload funguje v handover/return forms
- [ ] Súbory sa zobrazujú v protocol detail
- [ ] R2 cleanup job maže orphaned files  
- [ ] File size/type validation
```

---

## ⚠️ BlackRent-specific gotchas

### Database
- **Railway PostgreSQL** - nie lokálna DB
- Migrácie cez `database/migrations/` - nie cez ORM
- Vždy test na staging pred production

### API
- Používaj `apiPath('/endpoint')` helper
- Zod validácia pre všetky inputs/outputs
- Error handling s structured logging

### Frontend  
- Vite env: `import.meta.env.VITE_*`
- Feature flags: `flag('FEATURE_NAME')`
- UI komponenty: zachovaj existing design system

### Testing
- Vitest (nie Jest)
- Test DB connection pred API tests
- Mock external services (email, R2)

---

## 🚀 Quick start template

```markdown
## Mini špecifikácia: [FEATURE_NAME]

**Cieľ:** Pridať __________, nech sa __________.

**Kde sa ukladá:**
- Tabuľka: 
- Stĺpec: 
- Typ: 
- Default: 
- Constraint: 

**Ako tečie:**
- Odkiaľ: 
- Kedy: 
- Copy vs Reference: 

**Editácia:**
- Autorita: 
- Kto môže meniť: 
- Konflikt handling: 

**Hotovo keď:**
- [ ] 
- [ ] 
- [ ] 
- [ ] 
- [ ] 
- [ ] 

---
*Implementácia začína až po schválení tejto špecifikácie.*
```

Použiť pred každým novým poľom/feature v BlackRent! 🎯
