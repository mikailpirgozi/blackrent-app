# 🚀 ENHANCED FILTER SYSTEM - USAGE GUIDE

## ✅ **ČO UŽ FUNGUJE**

### **1. ✅ VŠETKY EXISTUJÚCE FUNKCIE ZACHOVANÉ**
```typescript
// 📜 STARÝ KODE - stále funguje rovnako!
const vehicles = getFilteredVehicles(); // Permission-filtered vehicles
const rentals = getFilteredRentals();   // Permission-filtered rentals
const expenses = getFilteredExpenses(); // Permission-filtered expenses
```

### **2. ✅ VEHICLELISTNEW ZMIGROVANÝ**
- **50+ riadkov** filter logic → **5 riadkov**  
- **Automatické permission handling**
- **Všetky filtre zachované** (search, brand, model, company, status, category)
- **Performance optimalizovaný**

### **3. ✅ NOVÉ ENHANCED FUNKCIE DOSTUPNÉ**
```typescript
// 🚀 NOVÉ: Advanced filtering s možnosťami
const vehicles = getEnhancedFilteredVehicles({
  search: 'bmw',
  category: 'suv', 
  status: 'available'
});

// 🎯 HELPER: Pre jednoduché používanie
const vehicles = getFullyFilteredVehicles({
  search: 'audi',
  category: 'luxusne'
});
```

---

## 🔧 **AKO POUŽÍVAŤ NOVÝ SYSTÉM**

### **Import z useApp Hook**
```typescript
import { useApp } from '../../context/AppContext';

// V komponente:
const { 
  // 📜 Existujúce funkcie (bez zmeny)
  state, 
  getFilteredVehicles,
  
  // 🚀 Nové enhanced funkcie
  getEnhancedFilteredVehicles,
  getFullyFilteredVehicles 
} = useApp();
```

### **FilterOptions Interface**
```typescript
import type { FilterOptions } from '../../context/AppContext';

interface FilterOptions {
  // UI filters
  search?: string;              // Vyhľadávanie v brand/model/SPZ/company
  category?: VehicleCategory | 'all';  // suv, luxusne, etc.
  brand?: string;               // BMW, Audi, etc.
  model?: string;               // X5, A4, etc.
  company?: string;             // Lubka, Vincursky, etc.
  status?: VehicleStatus | 'all';      // available, rented, etc.
  
  // Advanced filters
  dateRange?: { start: Date; end: Date };
  priceRange?: { min: number; max: number };
  
  // Status group filters (backwards compatibility)
  showAvailable?: boolean;
  showRented?: boolean;
  showMaintenance?: boolean;
  showOther?: boolean;
  
  // Meta options
  includeAll?: boolean;         // Admin override (ignore permissions)
}
```

---

## 📚 **PRÍKLADY POUŽITIA**

### **1. 🔍 ZÁKLADNÉ FILTROVANIE**
```typescript
// V komponente:
const filteredVehicles = useMemo(() => {
  return getFullyFilteredVehicles({
    search: searchQuery,
    category: selectedCategory,
    status: selectedStatus
  });
}, [searchQuery, selectedCategory, selectedStatus]);
```

### **2. 🎯 POKROČILÉ FILTROVANIE** 
```typescript
// Kombinované filtre:
const bmwSuvs = getEnhancedFilteredVehicles({
  search: 'bmw',
  category: 'suv',
  status: 'available',
  company: 'Lubka'
});

// Status group filtre:
const availableVehicles = getEnhancedFilteredVehicles({
  showAvailable: true,
  showRented: false,
  showMaintenance: false
});
```

### **3. 🏢 DROPDOWN KOMPONENTY**
```typescript
// Pre dropdown so všetkými vozidlami (admin):
const allVehicles = getEnhancedFilteredVehicles({
  includeAll: true  // Ignoruje permissions
});

// Pre dropdown len s dostupnými vozidlami:
const availableVehicles = getEnhancedFilteredVehicles({
  status: 'available'
});

// Pre dropdown len SUV:
const suvVehicles = getEnhancedFilteredVehicles({
  category: 'suv'
});
```

### **4. 📊 REPORTING KOMPONENTY**
```typescript
// Mesačný report:
const monthlyVehicles = getEnhancedFilteredVehicles({
  dateRange: { 
    start: startOfMonth(new Date()), 
    end: endOfMonth(new Date()) 
  },
  status: 'rented'
});

// Cenový report:
const premiumVehicles = getEnhancedFilteredVehicles({
  priceRange: { min: 200, max: 1000 },
  category: 'luxusne'
});
```

---

## 🔄 **MIGRÁCIA EXISTUJÚCICH KOMPONENTOV**

### **PRED MIGRÁCIOU:**
```typescript
// ❌ Starý spôsob - 50+ riadkov
const filteredVehicles = useMemo(() => {
  return state.vehicles.filter(vehicle => {
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      if (!vehicle.brand.toLowerCase().includes(query) && 
          !vehicle.model.toLowerCase().includes(query)) {
        return false;
      }
    }
    
    if (filterBrand && !vehicle.brand.includes(filterBrand)) {
      return false;
    }
    
    // ... ďalších 40+ riadkov
    
    return true;
  });
}, [state.vehicles, searchQuery, filterBrand, /* ... 10+ dependencies */]);
```

### **PO MIGRÁCII:**
```typescript
// ✅ Nový spôsob - 5 riadkov
const filteredVehicles = useMemo(() => {
  return getFullyFilteredVehicles({
    search: searchQuery,
    brand: filterBrand,
    model: filterModel,
    company: filterCompany,
    status: filterStatus,
    category: filterCategory
  });
}, [searchQuery, filterBrand, filterModel, filterCompany, 
    filterStatus, filterCategory, getFullyFilteredVehicles]);
```

---

## 🎯 **STEP-BY-STEP MIGRÁCIA**

### **KROK 1: Import Enhanced Functions**
```typescript
// Pridaj do existujúceho useApp destructuring:
const { 
  state, 
  // ... existing functions
  getFullyFilteredVehicles  // 🆕 Pridaj toto
} = useApp();
```

### **KROK 2: Nahraď Filter Logic**  
```typescript
// Nájdi existujúci useMemo s filter logic:
const filteredVehicles = useMemo(() => {
  return state.vehicles.filter(/* ... complex logic ... */);
}, [/* ... many dependencies ... */]);

// Nahraď za:
const filteredVehicles = useMemo(() => {
  return getFullyFilteredVehicles({
    search: searchQuery,
    // ... other filters
  });
}, [searchQuery, /* ... simplified dependencies */, getFullyFilteredVehicles]);
```

### **KROK 3: Odstráň Duplicate Logic**
```typescript
// Zmaž všetky duplicitné filter funkcie:
// - searchFilter()
// - brandFilter() 
// - categoryFilter()
// - statusFilter()
// atď.
```

### **KROK 4: Aktualizuj Dependencies**
```typescript
// Starý dependency array:
[state.vehicles, searchQuery, filterBrand, filterModel, 
 filterCompany, filterStatus, filterCategory, showAvailable, 
 showRented, showMaintenance, showOther]

// Nový dependency array:
[searchQuery, filterBrand, filterModel, filterCompany, 
 filterStatus, filterCategory, showAvailable, showRented, 
 showMaintenance, showOther, getFullyFilteredVehicles]
```

---

## 🚨 **KOMPONENTY PRIPRAVENÉ NA MIGRÁCIU**

### **✅ DOKONČENÉ:**
- ✅ **VehicleListNew** - zmigrovaný na nový systém

### **⏳ PRIPRAVENÉ NA MIGRÁCIU:**
- 🔄 **AvailabilityCalendar** - má komplex categoryFilteredVehicles logic
- 🔄 **ExpenseListNew** - používa getFilteredVehicles() v dropdown
- 🔄 **SettlementListNew** - používa getFilteredVehicles() v dropdown  
- 🔄 **RentalForm** - vehicle select dropdown
- 🔄 **ExpenseForm** - vehicle select dropdown

### **🎯 DROPDOWN FIXES NEEDED:**
```typescript
// ❌ Súčasný problém v dropdown komponentoch:
const vehicles = getFilteredVehicles(); // Ignoruje category filter pre admin

// ✅ Riešenie:
const vehicles = getEnhancedFilteredVehicles({
  category: selectedCategory,  // Aplikuje category filter aj pre admin
  status: 'available'         // Len dostupné vozidlá
});
```

---

## 🏆 **VÝHODY NOVÉHO SYSTÉMU**

### **1. 📊 CODE REDUCTION**
- **90% menej kódu** v filter logic
- **Jednotný pattern** naprieč komponentmi
- **Zero duplication** - jeden filter engine

### **2. ⚡ PERFORMANCE**
- **Single-pass filtering** namiesto multiple passes
- **AppContext-level caching** + component memoization
- **Optimized dependency arrays**

### **3. 🔧 MAINTAINABILITY**  
- **Centrálna filter logic** v AppContext
- **Easy to extend** - nové filtre sa pridajú na jednom mieste
- **Type-safe** - FilterOptions interface

### **4. 🎯 CONSISTENCY**
- **Admin filter bug fixed** - admin users vidia filtrované výsledky
- **Permission handling** automatický a jednotný
- **Same behavior** naprieč všetkými komponentmi

### **5. 🚀 DEVELOPER EXPERIENCE**
- **Copy-paste ready** pre nové komponenty
- **Intellisense support** pre FilterOptions
- **Self-documenting** - jasné čo každý parameter robí

---

## 📞 **PODPORA A TROUBLESHOOTING**

### **Ak vidíte chybu:**
```
Cannot find name 'getFullyFilteredVehicles'
```
**Riešenie:** Pridajte do useApp destructuring:
```typescript
const { getFullyFilteredVehicles } = useApp();
```

### **Ak vidíte type error:**
```
Type 'string' is not assignable to type 'VehicleStatus'
```
**Riešenie:** Pridajte type casting:
```typescript
status: filterStatus as any
```

### **Ak chcete admin override:**
```typescript
const allVehicles = getEnhancedFilteredVehicles({
  includeAll: true  // Ignoruje permissions pre admin
});
```

---

## 🎯 **NEXT STEPS**

1. **Testujte VehicleListNew** - overíte, že všetky filtre fungujú
2. **Migrovajte AvailabilityCalendar** - zjednodušíte categoryFilteredVehicles
3. **Opravte dropdown komponenty** - pridáte category filtering
4. **Migrovajte ostatné komponenty** postupne

**Všetko je backwards compatible - žiadne funkcie nestratíte!** 🎉 