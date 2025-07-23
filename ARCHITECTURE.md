# 🏗️ Architektúra BlackRent aplikácie

## 📁 Štruktúra komponentov

### 🚗 **Prenájmy** (`/rentals`)
- **Aktívny komponent:** `RentalListNew.tsx`
- **Cesta:** `/rentals`
- **Funkcionality:**
  - CSV import/export (desktop)
  - Protokoly (prevzatie/vrátenie)
  - Pokročilé filtre
  - Kartový a tabuľkový pohľad
  - Vyhľadávanie
  - Galéria fotografií

**Podporné komponenty:**
- `RentalForm.tsx` - Formulár pre vytvorenie/úpravu prenájmu
- `RentalAdvancedFilters.tsx` - Pokročilé filtre
- `RentalCardView.tsx` - Kartový pohľad
- `RentalViewToggle.tsx` - Prepínač medzi pohľadmi
- `EmailParser.tsx` - Parsovanie emailov

### 🚙 **Vozidlá** (`/vehicles`)
- **Aktívny komponent:** `VehicleList.tsx`
- **Cesta:** `/vehicles`
- **Funkcionality:**
  - Zoznam vozidiel
  - Vytváranie/úprava vozidiel
  - Filtrovanie a vyhľadávanie
  - CSV import/export

**Podporné komponenty:**
- `VehicleForm.tsx` - Formulár pre vozidlo

### 👥 **Zákazníci** (`/customers`)
- **Aktívny komponent:** `CustomerList.tsx`
- **Cesta:** `/customers`
- **Funkcionality:**
  - Zoznam zákazníkov
  - História prenájmov
  - CSV import/export

**Podporné komponenty:**
- `CustomerForm.tsx` - Formulár pre zákazníka
- `CustomerRentalHistory.tsx` - História prenájmov

### 💰 **Náklady** (`/expenses`)
- **Aktívny komponent:** `ExpenseList.tsx`
- **Cesta:** `/expenses`
- **Funkcionality:**
  - Zoznam nákladov
  - Kategorizácia
  - CSV import/export

**Podporné komponenty:**
- `ExpenseForm.tsx` - Formulár pre náklad

### 🛡️ **Poistky** (`/insurances`)
- **Aktívny komponent:** `InsuranceList.tsx`
- **Cesta:** `/insurances`
- **Funkcionality:**
  - Zoznam poistiek
  - Typy poistiek
  - CSV import/export

**Podporné komponenty:**
- `InsuranceForm.tsx` - Formulár pre poistku

### 📊 **Štatistiky** (`/statistics`)
- **Aktívny komponent:** `Statistics.tsx`
- **Cesta:** `/statistics`
- **Funkcionality:**
  - Prehľad príjmov
  - Grafy a analýzy
  - Export dát

### 👤 **Používatelia** (`/users`)
- **Aktívny komponent:** `UserManagement.tsx`
- **Cesta:** `/users`
- **Funkcionality:**
  - Správa používateľov
  - Role a oprávnenia

### 💳 **Vyúčtovania** (`/settlements`)
- **Aktívny komponent:** `SettlementList.tsx`
- **Cesta:** `/settlements`
- **Funkcionality:**
  - Zoznam vyúčtovaní
  - Detaily vyúčtovania

### 📋 **Protokoly**
- **Komponenty:**
  - `HandoverProtocolForm.tsx` - Protokol prevzatia
  - `ReturnProtocolForm.tsx` - Protokol vrátenia
  - `ProtocolDetailViewer.tsx` - Zobrazenie protokolu

### 🔧 **Spoločné komponenty**
- `Layout.tsx` - Hlavný layout aplikácie
- `PDFViewer.tsx` - Zobrazenie PDF súborov
- `ProtocolGallery.tsx` - Galéria fotografií
- `ResponsiveTable.tsx` - Responzívna tabuľka
- `SerialPhotoCapture.tsx` - Sériové fotenie
- `MobileFileUpload.tsx` - Upload súborov na mobile
- `ErrorBoundary.tsx` - Spracovanie chýb

## 🎨 **Témy a štýly**
- `darkTheme.ts` - Tmavá téma
- `theme.ts` - Hlavná téma
- `custom-font.css` - Aeonik font

## 🔌 **Služby**
- `api.ts` - API komunikácia
- `storage.ts` - Lokálne úložisko
- `sentry.ts` - Error tracking
- `performance.ts` - Performance monitoring

## 🛠️ **Utility**
- `dayjs-setup.ts` - Nastavenie dátumov
- `imageCompression.ts` - Kompresia obrázkov
- `imageProcessor.ts` - Spracovanie obrázkov
- `videoCompression.ts` - Kompresia videí
- `pdfGenerator.ts` - Generovanie PDF
- `enhancedPdfGenerator.ts` - Rozšírené PDF generovanie

## 🗄️ **Backend**
- **Port:** 3001 (lokálne), 5001 (Railway)
- **Database:** PostgreSQL
- **PDF Generator:** Custom font (pdf-lib)
- **Authentication:** JWT middleware
- **CORS:** Konfigurované pre Railway

## 🚀 **Deployment**
- **Frontend:** Vercel
- **Backend:** Railway
- **Database:** Railway PostgreSQL
- **Storage:** Cloudflare R2

## 📋 **Konvencie pomenovania**
- ✅ **Používaj:** `ComponentName.tsx`
- ❌ **Nepoužívaj:** `ComponentNameNew.tsx`, `ComponentNameOld.tsx`
- ✅ **Backup:** `ComponentName.backup.tsx` (dočasne)
- ✅ **Test:** `ComponentName.test.tsx`

## 🔄 **Workflow**
1. **Vývoj:** Lokálne na porte 3001
2. **Testovanie:** Build a test
3. **Commit:** Git s popisným commit message
4. **Push:** Automatický deploy na Railway/Vercel
5. **Monitoring:** Sentry error tracking 