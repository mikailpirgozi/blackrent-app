# 📊 STATISTICS.TSX REFACTORING GUIDE

## 🎯 ÚLOHA PRE ĎALŠÍ CHAT

Refaktorovať `src/components/Statistics.tsx` (2477 riadkov) na modulárnu architektúru podobne ako sme úspešne refaktorovali `VehicleListNew.tsx`.

## 📋 AKTUÁLNY STAV

**Súbor:** `src/components/Statistics.tsx`
**Veľkosť:** 2477 riadkov
**Komplexnosť:** Veľmi vysoká - obsahuje grafy, tabuľky, filtre, výpočty, KPI karty

## 🏗️ NAVRHOVANÁ ARCHITEKTÚRA

### 📁 NOVÁ ŠTRUKTÚRA SÚBOROV:

```
src/
├── components/statistics/
│   ├── Statistics.tsx (400-600 riadkov) - HLAVNÝ ORCHESTRÁTOR
│   └── components/
│       ├── StatisticsFilters.tsx (~200 riadkov)
│       ├── StatisticsCharts.tsx (~400 riadkov)  
│       ├── StatisticsCards.tsx (~300 riadkov)
│       ├── StatisticsTable.tsx (~250 riadkov)
│       ├── TopStatsSection.tsx (~350 riadkov)
│       ├── MonthlyBreakdown.tsx (~300 riadkov)
│       └── StatisticsTabs.tsx (~200 riadkov)
├── utils/statistics/
│   ├── statisticsHelpers.ts (~150 riadkov)
│   └── chartHelpers.ts (~100 riadkov)
└── types/
    └── statistics-types.ts (~100 riadkov)
```

## 🔍 ANALÝZA PÔVODNÉHO SÚBORU

### HLAVNÉ SEKCIE V STATISTICS.TSX:

1. **IMPORTS & INTERFACES** (riadky 1-110)
   - Material-UI komponenty
   - Recharts grafy
   - Icons
   - Date-fns utilities
   - Custom interfaces

2. **STATE MANAGEMENT** (riadky 117-134)
   - Filtre (rok, mesiac, časový rozsah)
   - Tab navigation
   - Pagination states
   - Expanded states

3. **VÝPOČTOVÉ LOGIKY** (riadky 136-583)
   - Komplexné useMemo s výpočtami
   - Štatistiky vozidiel
   - Štatistiky zákazníkov
   - Revenue calculations
   - Utilization metrics

4. **HELPER KOMPONENTY** (riadky 672-755)
   - TopStatCard komponent
   - Inline komponenty

5. **RENDER LOGIKA** (riadky 584-2475)
   - Mobile/Desktop rozdelenie
   - Tab panels
   - Charts (Bar, Line, Pie, Area)
   - Tables
   - KPI Cards

## 🎯 REFAKTORINGOVÝ PLÁN

### FÁZA 1: PRÍPRAVA
1. Vytvoriť backup súboru
2. Vytvoriť type definície
3. Vytvoriť helper funkcie

### FÁZA 2: EXTRAKCIA KOMPONENTOV
1. **StatisticsFilters.tsx** - filtre a časové rozsahy
2. **StatisticsCards.tsx** - KPI karty a metriky  
3. **StatisticsCharts.tsx** - všetky grafy
4. **StatisticsTable.tsx** - tabuľky s dátami
5. **TopStatsSection.tsx** - top vozidlá/zákazníci
6. **MonthlyBreakdown.tsx** - mesačné rozdelenie
7. **StatisticsTabs.tsx** - tab navigation

### FÁZA 3: UTILITY SÚBORY
1. **statisticsHelpers.ts** - výpočtové funkcie
2. **chartHelpers.ts** - chart utilities

### FÁZA 4: INTEGRÁCIA
1. Aktualizovať hlavný Statistics.tsx
2. Importovať všetky komponenty
3. Predať props

## 📊 KĽÚČOVÉ KOMPONENTY PRE EXTRAKCIU

### 1. StatisticsFilters.tsx
```typescript
interface StatisticsFiltersProps {
  timeRange: 'month' | 'year' | 'all';
  setTimeRange: (range: 'month' | 'year' | 'all') => void;
  filterYear: number;
  setFilterYear: (year: number) => void;
  filterMonth: number;
  setFilterMonth: (month: number) => void;
  selectedYear: number;
  setSelectedYear: (year: number) => void;
  selectedMonth: number;
  setSelectedMonth: (month: number) => void;
}
```

### 2. StatisticsCharts.tsx
```typescript
interface StatisticsChartsProps {
  monthlyData: any[];
  vehicleStats: any[];
  customerStats: any[];
  colors: string[];
  isMobile: boolean;
}
```

### 3. StatisticsCards.tsx
```typescript
interface StatisticsCardsProps {
  stats: {
    totalRevenuePeriod: number;
    totalCommissionPeriod: number;
    filteredRentals: any[];
    filteredExpenses: any[];
    // ... ďalšie stats
  };
  timeRange: string;
  isMobile: boolean;
}
```

## 🔧 TECHNICKÉ POŽIADAVKY

### ZACHOVAŤ:
- ✅ Všetky 2477 riadkov kódu (len presunúť)
- ✅ Všetky výpočtové logiky
- ✅ Všetky grafy (Bar, Line, Pie, Area)
- ✅ Všetky filtre a state management
- ✅ Mobile/Desktop responzivitu
- ✅ Tab navigation
- ✅ Všetky KPI metriky
- ✅ Top štatistiky (vozidlá, zákazníci)
- ✅ Mesačné rozdelenie
- ✅ Export funkcionalitu

### ZLEPŠIŤ:
- 🚀 Modulárnosť komponentov
- 🚀 Znovupoužiteľnosť
- 🚀 Testovateľnosť
- 🚀 Výkon (lazy loading grafov)
- 🚀 Udržiavateľnosť

## ⚠️ KRITICKÉ UPOZORNENIA

1. **ŽIADNE STRATY KÓDU** - každý riadok musí byť zachovaný
2. **ZACHOVAŤ VŠETKY VÝPOČTY** - komplexné useMemo logiky
3. **ZACHOVAŤ STATE** - všetky useState hooks
4. **ZACHOVAŤ PROPS** - všetky predávané dáta
5. **TESTOVAŤ BUILD** - po každej extrakcii

## 🚀 POSTUP IMPLEMENTÁCIE

### KROK 1: Backup a analýza
```bash
cp src/components/Statistics.tsx src/components/Statistics.backup.tsx
wc -l src/components/Statistics.tsx
```

### KROK 2: Vytvorenie adresárov
```bash
mkdir -p src/components/statistics/components
mkdir -p src/utils/statistics
```

### KROK 3: Postupná extrakcia
- Začať s najjednoduchšími komponentmi (StatisticsFilters)
- Pokračovať s komplexnejšími (StatisticsCharts)
- Skončiť s najkomplexnejšími (výpočtové logiky)

### KROK 4: Testovanie po každom kroku
```bash
npm run build
read_lints
```

## 📈 OČAKÁVANÉ VÝSLEDKY

**PRED REFAKTORINGOM:**
- Statistics.tsx: 2477 riadkov

**PO REFAKTORINGU:**
- Statistics.tsx: ~500 riadkov (orchestrátor)
- 7 nových komponentov: ~2000 riadkov
- 2 utility súbory: ~250 riadkov
- 1 type súbor: ~100 riadkov
- **CELKOVO:** ~2850 riadkov (zachované + pridané typy)

## 🎯 FINÁLNY CIEĽ

Vytvoriť modulárnu architektúru pre Statistics dashboard s:
- Čistým hlavným komponentom (orchestrátor)
- Špecializovanými sub-komponentmi
- Znovupoužiteľnými utility funkciami
- Type-safe interface
- Zachovanou 100% funkcionalitou

---

**ZAČNI REFAKTORINGOM POSTUPNE, KROK ZA KROKOM!**
**VŽDY TESTUJ BUILD PO KAŽDEJ EXTRAKCII!**
**ZACHOVAJ VŠETKY 2477 RIADKOV KÓDU!**
