# 🔄 **CLONE & CONTINUE PRENÁJMOV - IMPLEMENTAČNÝ DOKUMENT**

## 📋 **PREHĽAD PROJEKTU**

### **Cieľ**
Implementovať "Clone & Continue" funkcionalitu pre prenájmy, ktorá umožní jednoducho vytvoriť kópiu existujúceho prenájmu na nasledujúce obdobie s automatickým výpočtom dátumov a zachovaním všetkých údajov.

### **Business Case**
- **Problém**: Zákazníci často predlžujú prenájmy (napr. 12-mesačný prenájom po mesiacoch)
- **Súčasné riešenie**: Manuálne vytváranie každého prenájmu osobne
- **Nové riešenie**: Jedno kliknutie → automatická kópia s nasledujúcimi dátumami

### **Príklad použitia**
```
Originál: 5.1.2025 - 5.2.2025 (mesačný prenájom)
Clone:    6.2.2025 - 5.3.2025 (automaticky vypočítané)
```

---

## 🎯 **FUNKCIONÁLNE POŽIADAVKY**

### **FR-01: Základná Clone Funkcionalita**
- **Popis**: Tlačidlo "📋 Kopírovať" v každom riadku prenájmu
- **Správanie**: Otvorí formulár s predvyplnenými údajmi pre nový prenájom
- **Priorita**: HIGH

### **FR-02: Inteligentný Výpočet Dátumov**
- **Mesačné prenájmy** (28-31 dní): Posun o celý mesiac
- **Týždenné prenájmy** (7 dní): Posun o týždeň  
- **Denné prenájmy** (1 deň): Posun o deň
- **Vlastné dĺžky**: Zachovanie pôvodnej dĺžky
- **Priorita**: HIGH

### **FR-03: Zachovanie Údajov**
**Zachovať:**
- Zákazník (meno, email, telefón)
- Vozidlo a všetky jeho nastavenia
- Ceny (totalPrice, commission, discount)
- Podmienky (deposit, allowedKilometers, dailyKilometers)
- Flexibilné nastavenia (isFlexible)
- Firma (company)

**Resetovať:**
- Status → 'pending'
- Paid → false
- Confirmed → false
- Protokoly (handoverProtocolId, returnProtocolId)

### **FR-04: Konflikt Management**
- Kontrola dostupnosti vozidla v novom období
- Zobrazenie konfliktov s existujúcimi prenájmami
- Možnosť pokračovať s manuálnou úpravou dátumov
- **Priorita**: MEDIUM

---

## 🛠️ **TECHNICKÁ ARCHITEKTÚRA**

### **Komponenty**
```
src/
├── utils/
│   └── rentalCloneUtils.ts          # Utility funkcie
├── components/rentals/
│   ├── components/
│   │   └── RentalTable.tsx          # Pridané clone tlačidlo
│   └── RentalList.tsx               # Hlavná clone logika
└── backend/src/routes/
    └── rentals.ts                   # API endpoint (voliteľný)
```

### **Data Flow**
```
1. User klikne "📋" tlačidlo
2. calculateNextRentalPeriod() → vypočíta nové dátumy
3. createClonedRental() → vytvorí kópiu údajov
4. Kontrola dostupnosti (voliteľné)
5. Otvorenie formulára s predvyplnenými údajmi
6. User upraví/potvrdí → štandardný save proces
```

---

## 📝 **IMPLEMENTAČNÝ PLÁN**

### **FÁZA 1: Utility Funkcie (15 min)**
**Súbor**: `src/utils/rentalCloneUtils.ts`

**Funkcie:**
- `calculateNextRentalPeriod()` - výpočet nasledujúceho obdobia
- `createClonedRental()` - vytvorenie kópie prenájmu
- `formatPeriodType()` - formátovanie typu obdobia

**Výstup**: Kompletné utility funkcie s TypeScript typmi

### **FÁZA 2: RentalTable Úpravy (20 min)**
**Súbor**: `src/components/rentals/components/RentalTable.tsx`

**Zmeny:**
- Import `ContentCopyIcon`
- Rozšírenie `RentalTableProps` interface
- Úprava šírky akcií z 80px na 120px
- Pridanie clone tlačidla do desktop aj mobile view

**Výstup**: Funkčné clone tlačidlo v tabuľke

### **FÁZA 3: RentalList Logika (25 min)**
**Súbor**: `src/components/rentals/RentalList.tsx`

**Zmeny:**
- Import utility funkcií
- Pridanie `handleCloneRental` callback
- State pre clone dialog (voliteľný)
- Prepojenie s RentalTable

**Výstup**: Funkčná clone logika s otvorením formulára

### **FÁZA 4: Backend API (voliteľné, 20 min)**
**Súbor**: `backend/src/routes/rentals.ts`

**Endpoint**: `POST /api/rentals/:id/clone`
- Validácia originálneho prenájmu
- Kontrola dostupnosti vozidla
- Vytvorenie novej kópie v databáze

**Výstup**: API endpoint pre server-side clone

### **FÁZA 5: Konflikt Management (30 min)**
**Komponenty**: Dialog pre riešenie konfliktov

**Funkcie:**
- Detekcia prekrývajúcich sa prenájmov
- Zobrazenie konfliktov používateľovi
- Možnosti riešenia (iné dátumy, iné vozidlo)

**Výstup**: Kompletný konflikt management systém

---

## 🧪 **TESTOVACÍ PLÁN**

### **Test Case 1: Mesačný Prenájom**
```
Input:  1.1.2025 - 31.1.2025 (31 dní)
Output: 1.2.2025 - 28.2.2025 (mesačný posun)
```

### **Test Case 2: Týždenný Prenájom**
```
Input:  1.1.2025 - 7.1.2025 (7 dní)
Output: 8.1.2025 - 14.1.2025 (týždenný posun)
```

### **Test Case 3: Custom Dĺžka**
```
Input:  1.1.2025 - 10.1.2025 (10 dní)
Output: 11.1.2025 - 20.1.2025 (rovnaká dĺžka)
```

### **Test Case 4: Zachovanie Údajov**
- Všetky polia okrem dátumov a statusu zostanú nezmenené
- Protokoly sa resetujú
- Ceny sa zachovajú

### **Test Case 5: Konflikt Scenár**
- Vozidlo už rezervované v novom období
- Zobrazenie konfliktu používateľovi
- Možnosť pokračovania s úpravou

---

## 🎨 **UI/UX ŠPECIFIKÁCIA**

### **Clone Tlačidlo**
```css
Farba: #4caf50 (zelená)
Ikona: ContentCopyIcon
Veľkosť: 32x32px
Hover: Zväčšenie + tieň
Tooltip: "Kopírovať prenájom na ďalšie obdobie"
```

### **Akcie Sekcia Layout**
```
Šírka: 120px (rozšírené z 80px)
Tlačidlá: Edit | Clone | Delete
Layout: Horizontálne, flex-wrap
Gap: 0.5rem
```

### **Konflikt Dialog**
```
Typ: Material-UI Dialog
Šírka: maxWidth="md"
Obsah: Zoznam konfliktov + možnosti riešenia
Akcie: Zrušiť | Pokračovať aj tak
```

---

## 🔧 **KONFIGURÁCIA A NASTAVENIA**

### **Environment Variables**
```bash
# Voliteľné - pre backend API
ENABLE_RENTAL_CLONE_API=true
CLONE_AVAILABILITY_CHECK=true
```

### **Feature Flags**
```typescript
// src/lib/flags.ts
export const RENTAL_CLONE_ENABLED = flag('RENTAL_CLONE');
export const CLONE_CONFLICT_CHECK = flag('CLONE_CONFLICT_CHECK');
```

### **Permissions**
```typescript
// Používa existujúce permissions
- rentals:create (pre vytvorenie kópie)
- rentals:read (pre čítanie originálneho prenájmu)
```

---

## 📊 **METRIKY A MONITORING**

### **Úspešnosť Funkcie**
- Počet použití clone funkcie za deň/týždeň
- Úspešnosť rate (koľko klonov sa skutočne uloží)
- Najčastejšie typy prenájmov (mesačné/týždenné/custom)

### **Performance Metriky**
- Čas výpočtu nasledujúceho obdobia (<100ms)
- Čas otvorenia formulára (<500ms)
- Úspešnosť API volaní (ak implementované)

### **Error Tracking**
```typescript
// Logger events
logger.info('🔄 Rental clone started', { rentalId, periodType });
logger.debug('📅 Clone period calculated', { originalPeriod, newPeriod });
logger.error('❌ Clone failed', { error, rentalId });
```

---

## 🚀 **DEPLOYMENT CHECKLIST**

### **Pre-deployment**
- [ ] Unit testy pre utility funkcie
- [ ] Integration testy pre UI komponenty
- [ ] Manuálne testovanie všetkých scenárov
- [ ] Code review
- [ ] TypeScript build bez chýb

### **Deployment**
- [ ] Frontend build a deploy
- [ ] Backend API deploy (ak implementované)
- [ ] Database migrácie (ak potrebné)
- [ ] Feature flag aktivácia

### **Post-deployment**
- [ ] Smoke testy v produkcii
- [ ] Monitoring dashboards
- [ ] User feedback collection
- [ ] Performance monitoring

---

## 🔮 **BUDÚCE VYLEPŠENIA**

### **V2.0 Features**
- **Bulk Clone**: Kopírovanie viacerých prenájmov naraz
- **Smart Scheduling**: AI návrhy optimálnych dátumov
- **Template System**: Uložené šablóny pre rôzne typy prenájmov
- **Auto-Clone**: Automatické vytváranie nasledujúcich prenájmov

### **V2.1 Features**
- **Calendar Integration**: Vizuálny kalendár pre výber dátumov
- **Price Optimization**: Automatické úpravy cien podľa sezóny
- **Customer Notifications**: Email notifikácie o nových prenájmoch
- **Analytics Dashboard**: Štatistiky clone usage

---

## 📚 **DOKUMENTÁCIA PRE VÝVOJÁROV**

### **API Reference**
```typescript
// Utility Functions
calculateNextRentalPeriod(startDate: Date, endDate: Date): CloneResult
createClonedRental(original: Rental, cloneResult: CloneResult): Partial<Rental>
formatPeriodType(periodType: PeriodType): string

// React Hooks
const handleCloneRental = useCallback((rental: Rental) => void, []);

// Props Interface
interface RentalTableProps {
  handleCloneRental: (rental: Rental) => void;
  // ... other props
}
```

### **Type Definitions**
```typescript
interface CloneResult {
  newStartDate: Date;
  newEndDate: Date;
  periodType: 'daily' | 'weekly' | 'monthly' | 'custom';
  originalDuration: number;
}

type PeriodType = 'daily' | 'weekly' | 'monthly' | 'custom';
```

### **Error Handling**
```typescript
try {
  const cloneResult = calculateNextRentalPeriod(startDate, endDate);
  // ... clone logic
} catch (error) {
  logger.error('Clone failed:', error);
  showErrorNotification('Chyba pri kopírovaní prenájmu');
}
```

---

## 🎯 **SUCCESS CRITERIA**

### **Funkčné Kritériá**
- ✅ Clone tlačidlo je viditeľné v každom riadku
- ✅ Automatický výpočet dátumov funguje správne
- ✅ Všetky údaje sa zachovávajú okrem resetovaných
- ✅ Formulár sa otvorí s predvyplnenými údajmi
- ✅ Uloženie funguje cez existujúci save proces

### **Performance Kritériá**
- ✅ Clone operácia < 1 sekunda
- ✅ UI responsiveness zachovaný
- ✅ Žiadne memory leaks
- ✅ Smooth user experience

### **Business Kritériá**
- ✅ 50%+ zníženie času na vytvorenie pokračujúceho prenájmu
- ✅ Pozitívny user feedback
- ✅ Zvýšenie produktivity zamestnancov
- ✅ Zníženie chybovosti pri manuálnom zadávaní

---

## 📞 **KONTAKT A PODPORA**

### **Development Team**
- **Lead Developer**: [Meno]
- **UI/UX Designer**: [Meno]  
- **QA Engineer**: [Meno]

### **Stakeholders**
- **Product Owner**: [Meno]
- **Business Analyst**: [Meno]
- **End Users**: BlackRent zamestnanci

---

**Dokument vytvorený**: ${new Date().toLocaleDateString('sk-SK')}  
**Verzia**: 1.0  
**Status**: Ready for Implementation  
**Odhadovaný čas implementácie**: 2-3 hodiny  
**Priorita**: HIGH
