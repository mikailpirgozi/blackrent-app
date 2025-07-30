# 🔧 FILTER ARCHITECTURE REDESIGN

## 🎯 **CIEĽ**: Jednotná, škálovateľná filter architektúra

## 🔄 **PÔVODNÝ PROBLÉM**

```typescript
// ❌ SÚČASNÝ STAV: 3 úrovne filtrovania
AppContext.getFilteredVehicles()     // Permission only
Component.filteredVehicles           // UI filters  
Component.categoryFilteredVehicles   // Additional filters

// PROBLÉM: Inconsistent data sources!
```

---

## ✅ **NOVÝ DESIGN: COMPOSABLE FILTER CHAIN**

### **1. AppContext - Enhanced Filter System**

```typescript
interface FilterOptions {
  // Permission filters (always applied)
  permissions?: {
    userRole: string;
    companyAccess: string[];
  };
  
  // UI filters (optional)
  search?: string;
  category?: VehicleCategory | 'all';
  brand?: string;
  model?: string;  
  company?: string;
  status?: VehicleStatus | 'all';
  
  // Advanced filters
  dateRange?: { start: Date; end: Date };
  priceRange?: { min: number; max: number };
  
  // Meta options
  includeAll?: boolean; // For admin override
}

// 🚀 NOVÝ: Unified filter function
const getFilteredVehicles = (options: FilterOptions = {}): Vehicle[] => {
  let vehicles = state.vehicles || [];
  
  // 1️⃣ PERMISSION LAYER (always applied unless admin override)
  if (!options.includeAll && authState.user?.role !== 'admin') {
    const accessibleCompanyNames = getAccessibleCompanyNames();
    vehicles = vehicles.filter(vehicle => 
      vehicle.company && accessibleCompanyNames.includes(vehicle.company)
    );
  }
  
  // 2️⃣ SEARCH LAYER
  if (options.search) {
    const query = options.search.toLowerCase();
    vehicles = vehicles.filter(vehicle =>
      vehicle.brand.toLowerCase().includes(query) ||
      vehicle.model.toLowerCase().includes(query) ||
      vehicle.licensePlate.toLowerCase().includes(query) ||
      vehicle.company?.toLowerCase().includes(query)
    );
  }
  
  // 3️⃣ CATEGORY LAYER  
  if (options.category && options.category !== 'all') {
    vehicles = vehicles.filter(vehicle => vehicle.category === options.category);
  }
  
  // 4️⃣ BRAND LAYER
  if (options.brand) {
    vehicles = vehicles.filter(vehicle => 
      vehicle.brand.toLowerCase().includes(options.brand!.toLowerCase())
    );
  }
  
  // 5️⃣ STATUS LAYER
  if (options.status && options.status !== 'all') {
    vehicles = vehicles.filter(vehicle => vehicle.status === options.status);
  }
  
  // 6️⃣ COMPANY LAYER
  if (options.company) {
    vehicles = vehicles.filter(vehicle => vehicle.company === options.company);
  }
  
  return vehicles;
};

// 🎯 HELPER: Pre backwards compatibility
const getPermissionFilteredVehicles = (): Vehicle[] => {
  return getFilteredVehicles(); // Default behavior - permission only
};

// 🎯 HELPER: Pre plne filtrované dáta
const getFullyFilteredVehicles = (uiFilters: Omit<FilterOptions, 'permissions'>): Vehicle[] => {
  return getFilteredVehicles({
    ...uiFilters,
    permissions: {
      userRole: authState.user?.role || 'user',
      companyAccess: getAccessibleCompanyNames()
    }
  });
};
```

### **2. Component Usage - Simplified**

```typescript
// 🔄 PRED: VehicleListNew.tsx
const filteredVehicles = useMemo(() => {
  return state.vehicles.filter(vehicle => {
    // 50 lines of filter logic...
  });
}, [state.vehicles, searchQuery, filterBrand, filterModel, filterCompany, filterStatus, filterCategory, showAvailable, showRented, showMaintenance, showOther]);

// ✅ PO: VehicleListNew.tsx  
const filteredVehicles = useMemo(() => {
  return getFilteredVehicles({
    search: searchQuery,
    brand: filterBrand,
    model: filterModel,
    company: filterCompany,
    status: filterStatus,
    category: filterCategory,
    // Advanced status filtering handled internally
  });
}, [searchQuery, filterBrand, filterModel, filterCompany, filterStatus, filterCategory]);
```

```typescript
// 🔄 PRED: AvailabilityCalendar.tsx
const filteredVehicles = useContext(AppContext).getFilteredVehicles();
const categoryFilteredVehicles = useMemo(() => {
  if (!propCategoryFilter) return filteredVehicles;
  // Complex filter logic...
}, [filteredVehicles, propCategoryFilter]);

// ✅ PO: AvailabilityCalendar.tsx
const filteredVehicles = useMemo(() => {
  return getFilteredVehicles({
    category: propCategoryFilter || 'all',
    // Any other calendar-specific filters
  });
}, [propCategoryFilter]);

// 🎯 NO MORE categoryFilteredVehicles - all in one!
```

---

## 🚀 **VÝHODY NOVÉHO SYSTÉMU**

### **1. ✅ CONSISTENCY**
```typescript
// Všetky komponenty používajú TEN ISTÝ filter engine
VehicleListNew → getFilteredVehicles(uiOptions)
AvailabilityCalendar → getFilteredVehicles(calendarOptions)  
ExpenseForm.dropdown → getFilteredVehicles(dropdownOptions)
```

### **2. ✅ REUSABILITY**
```typescript
// Jednoduché znovu použitie pre nové komponenty
const NewReportComponent = () => {
  const vehicles = getFilteredVehicles({
    dateRange: { start: lastMonth, end: today },
    category: 'suv',
    status: 'available'
  });
  
  return <Report vehicles={vehicles} />;
};
```

### **3. ✅ TESTABILITY**
```typescript
// Ľahké testovanie všetkých filter kombinácií
test('filter by category and search', () => {
  const result = getFilteredVehicles({
    category: 'suv', 
    search: 'bmw'
  });
  expect(result).toHaveLength(expectedCount);
});
```

### **4. ✅ PERFORMANCE**
```typescript
// Memoization na AppContext úrovni
const getFilteredVehicles = useMemo(() => {
  return (options: FilterOptions) => {
    // Filter logic with caching
  };
}, [state.vehicles, authState.user]);
```

---

## 🔧 **MIGRATION PLAN**

### **PHASE 1: AppContext Enhancement**
1. ✅ Pridať nový `getFilteredVehicles(options)` do AppContext
2. ✅ Zachovať starý `getFilteredVehicles()` pre backwards compatibility  
3. ✅ Pridať helper functions pre common use cases

### **PHASE 2: Component Migration**
1. ✅ VehicleListNew - nahradiť filter logic
2. ✅ AvailabilityCalendar - zjednodušiť data flow
3. ✅ ExpenseListNew/SettlementListNew - fix dropdown filtering  
4. ✅ Ostatné komponenty postupne

### **PHASE 3: Cleanup**
1. ✅ Odstrániť starý `getFilteredVehicles()` 
2. ✅ Odstrániť redundantné filter logic z komponentov
3. ✅ Optimize performance s memoization

---

## 🎯 **ROZŠÍRENIA PRE BUDÚCNOSŤ**

### **1. RENTAL FILTERING**
```typescript
const getFilteredRentals = (options: RentalFilterOptions): Rental[] => {
  // Same pattern for rentals
};
```

### **2. MULTI-ENTITY FILTERING**  
```typescript
const getFilteredData = (entity: 'vehicles' | 'rentals' | 'expenses', options: FilterOptions): any[] => {
  // Universal filter engine
};
```

### **3. REAL-TIME FILTERS**
```typescript
const useRealtimeFilteredVehicles = (options: FilterOptions): Vehicle[] => {
  // WebSocket-based live filtering
};
```

### **4. PERSISTENT FILTERS**
```typescript
const getFilteredVehicles = (options: FilterOptions & { saveAs?: string }): Vehicle[] => {
  // Save filter preferences to localStorage
};
```

---

## 📊 **EXPECTED OUTCOMES**

### **IMMEDIATE BENEFITS**
- ✅ **Admin filter bug fixed** - admin users will see filtered results
- ✅ **Consistent data across components** - no more mismatched counts
- ✅ **Easier debugging** - single source of truth for filtering

### **LONG-TERM BENEFITS**  
- ✅ **Faster development** - new filters take minutes, not hours
- ✅ **Better performance** - optimized filtering with proper memoization
- ✅ **Easier testing** - centralized logic = easier test coverage
- ✅ **Better UX** - consistent behavior across all screens

---

## 🚨 **BREAKING CHANGES**

### **NONE! Backwards Compatible**
```typescript
// 📜 OLD CODE continues to work
const vehicles = getFilteredVehicles(); // Still works

// 🚀 NEW CODE can use enhanced version  
const vehicles = getFilteredVehicles({ category: 'suv' }); // New features
```

### **MIGRATION COMPLEXITY: LOW**
- No database changes needed
- No API changes needed  
- Components migrate one by one
- Instant rollback possible

---

## 🏁 **IMPLEMENTATION TIMELINE**

### **Week 1**: AppContext Enhancement (2-3 hours)
- Implement new `getFilteredVehicles(options)`
- Add helper functions
- Maintain backwards compatibility

### **Week 2**: Critical Components (4-5 hours)
- Fix VehicleListNew 
- Fix AvailabilityCalendar
- Fix dropdown components

### **Week 3**: Remaining Components (2-3 hours)
- Migrate remaining components
- Performance optimizations
- Testing

### **Week 4**: Cleanup & Documentation (1-2 hours)
- Remove deprecated code
- Update documentation
- Create best practices guide

**TOTAL EFFORT: ~10-15 hours spread over 4 weeks**

---

## 💡 **RECOMMENDATION**

**START IMMEDIATELY** with Phase 1 - AppContext enhancement.

This provides **immediate value** with **minimal risk** while setting foundation for **long-term scalability**.

**Next Steps**:
1. Implement new filter system in AppContext
2. Test with VehicleListNew component  
3. Roll out to other components gradually 