# BlackRent – Sekcie aplikácie

## Interná aplikácia (admin.blackrent.sk)

### 🚗 Rentals (`/rentals`)
**Komponent:** `RentalListNew.tsx` (33 súborov v priečinku)
**Vstupy:**
- Email parsing (IMAP) → automatické prenájmy
- Manuálne vytvorenie cez formulár
- CSV import (bulk operations)

**Výstupy:**
- PDF protokoly (prevzatie/vrátenie)
- Foto galérie (R2 storage)
- CSV export
- Email notifikácie

**Kľúčové funkcie:**
- Kartový/tabuľkový pohľad
- Pokročilé filtre (status, dátumy, firmy)
- Flexibilné prenájmy (predĺženie/skrátenie)
- Automatické kalkulácie (DPH, poplatky)

**Critical paths (monitorovať):**
- Vytvorenie prenájmu → upload médií → generovanie PDF → odoslanie mailu
- Ukončenie prenájmu → výpočet doplatkov → podpis → PDF archivácia

### 🚙 Vehicles (`/vehicles`)
**Komponent:** `VehicleListNew.tsx` (15 súborov)
**Vstupy:**
- Manuálne pridanie vozidiel
- CSV import
- Company ownership assignment

**Výstupy:**
- Dostupnosť kalendár
- Maintenance tracking
- Photo galleries
- CSV export

**Metriky (runtime):** počet aktívnych vozidiel, využitie flotily %, priem. dĺžka prenájmu

### 📅 Availability (`/availability`)
**Komponent:** `SmartAvailabilityPage.tsx`
**Vstupy:**
- Rental dáta (active/pending)
- Vehicle status
- Company filters

**Výstupy:**
- 271-dňový kalendár (progressive loading)
- Real-time dostupnosť
- Booking conflicts detection

**Performance:** 3-fázové načítanie (current/past/future)

### 👥 Customers (`/customers`)
**Komponent:** `CustomerListNew.tsx`
**Vstupy:**
- Manuálne pridanie
- CSV import
- Email parsing extraction

**Výstupy:**
- História prenájmov
- Kontaktné informácie
- CSV export

### 💰 Expenses (`/expenses`)
**Komponent:** `ExpenseListNew.tsx`
**Vstupy:**
- Manuálne pridanie nákladov
- Kategorizácia (palivo, údržba, poistenie)
- Vehicle assignment

**Výstupy:**
- Mesačné/ročné reporty
- CSV export
- Cost analytics

### 🛡️ Insurances (`/insurances`)
**Komponent:** `InsuranceList.tsx`
**Vstupy:**
- Insurance policies
- Vehicle assignments
- Expiration dates

**Výstupy:**
- Expiration tracking
- Cost reports
- CSV export

### 💸 Settlements (`/settlements`)
**Komponent:** `SettlementListNew.tsx`
**Vstupy:**
- Monthly rental data
- Company commission rates
- Expense deductions

**Výstupy:**
- PDF settlements
- Email delivery
- Financial reports

### 📊 Statistics (`/statistics`)
**Komponent:** `Statistics.tsx` (14 podporných komponentov)
**Vstupy:**
- All system data (rentals, vehicles, expenses)
- Date ranges
- Company filters

**Výstupy:**
- KPI dashboard
- Charts (Recharts)
- PDF/Excel reports

### 👤 Users (`/users`)
**Komponent:** `IntegratedUserManagement.tsx`
**Vstupy:**
- User creation/editing
- Role assignments (6 typov)
- Company assignments

**Výstupy:**
- Permission matrix
- Activity tracking
- Account activation emails

**Metriky (runtime):** aktívni používatelia / posledných 30 dní

### 📧 Email Management (`/email-management`)
**Komponent:** `EmailManagementLayout.tsx` (15 súborov)
**Vstupy:**
- IMAP email monitoring
- SMTP configuration
- Manual email parsing

**Výstupy:**
- Parsed rentals
- Email analytics
- Protocol delivery
- Real-time notifications

## Customer Website (blackrent.sk)

### 🏠 Homepage
**Vstup:** Figma dizajn → Anima export
**Výstup:** Landing page s vehicle showcase

### 🚗 Vehicle Catalog (plánované)
**Vstup:** Vehicle data z internej app
**Výstup:** Public catalog s booking

### 🏢 Owner Portal (plánované)
**Vstup:** Company owner accounts
**Výstup:** Vehicle management dashboard

**TODO:** Overiť aktuálny stav customer-website implementácie.

## Podporné systémy

### 🔧 Diagnostics
**Skripty:** 91 súborov (68 shell scripts)
**Kľúčové príkazy:**
- `npm run health` - 10s diagnostika
- `npm run fix` - 30s auto-fix
- `npm run monitor` - live monitoring
- `npm run cleanup` - port cleanup

### 🎛️ Feature Flags
**Implementácia:** `src/lib/flags.ts`
**Pattern:** `VITE_FLAG_*` environment premenné
**Použitie:** `flag('EXTRA_KM')` helper funkcia

### 📁 File Storage
**Provider:** Cloudflare R2
**Organization:** Hierarchická štruktúra
**Optimalizácia:** WebP conversion, CDN cache
**Upload:** Presigned URLs (15 min expiry)

### 🧪 Testing
**Framework:** Vitest (nie Jest)
**Environment:** jsdom
**Commands:** 
- `npm run test` (watch)
- `npm run test:run` (single)
- `npm run test:ui` (GUI)

**TODO:** Overiť E2E testy (Playwright/Cypress); prioritizovať flow „handover → PDF".