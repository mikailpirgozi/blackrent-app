# 🚀 KOMPLETNÝ FINALIZAČNÝ PLÁN - React Query Migrácia

## 🚨 **KRITICKÉ UPOZORNENIE - PUSHOVANIE**

### ⚠️ **ABSOLÚTNY ZÁKAZ PUSHOVANIA DO GITHUBU!**

**DÔVODY:**
- Migrácia je v priebehu a môže spôsobiť breaking changes
- Hybrid stav (AppContext + React Query) môže spôsobiť konflikty
- Duplicitný kód môže spôsobiť nekonzistentné správanie
- TypeScript chyby sa môžu objaviť počas migrácie

**KEDY PUSHOVAŤ:**
- ✅ **LEN** keď bude VŠETKY FÁZY 100% dokončené
- ✅ **LEN** keď budú všetky buildy prechádzať (frontend + backend)
- ✅ **LEN** keď bude 0 TypeScript errors a 0 warnings
- ✅ **LEN** keď bude všetka funkcionalita otestovaná lokálne
- ✅ **LEN** keď bude performance lepšia alebo rovnaká

**AKTUÁLNY STAV:**
- 🔄 **MIGRÁCIA V PRÍPRAVE** - NEPUSHOVAŤ!
- 📝 **Lokálne testovanie** - OK
- 🧪 **Development testing** - OK
- 🚫 **Production push** - ZAKÁZANÉ

---

## 📋 PREHĽAD CIEĽA

**Transformácia:** Hybrid systém (AppContext + React Query + duplicitný kód) → Čistý React Query systém

**Výsledok:** 
- React Query = server state (dáta zo siete)
- AppContext = UI state (modaly, filtre, výber)
- Shared utilities = eliminácia duplicitného kódu
- Žiadne duplikácie, konflikty, zbytočné cache

---

## 🎯 FÁZA 1: DOKONČENIE MIGRÁCIE (20 min)

### 1.1 Identifikácia neúplných migrácií

**Problémové súbory:**
- `src/components/expenses/ExpenseListNew.tsx` - compatibility layer
- `src/components/customers/CustomerListNew.tsx` - TODO implementácie
- `src/components/settlements/SettlementListNew.tsx` - chýbajúce hooks
- `src/components/insurances/InsuranceForm.tsx` - neúplné mutácie

### 1.2 Implementácia chýbajúcich React Query hooks

**Expense hooks:**
```typescript
// src/lib/react-query/hooks/useExpenses.ts
export function useUpdateExpense() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (expense: Expense) => apiService.updateExpense(expense),
    onMutate: async (updatedExpense) => {
      await queryClient.cancelQueries(['expense', updatedExpense.id]);
      const previousExpense = queryClient.getQueryData(['expense', updatedExpense.id]);
      queryClient.setQueryData(['expense', updatedExpense.id], updatedExpense);
      return { previousExpense };
    },
    onError: (err, updatedExpense, context) => {
      if (context?.previousExpense) {
        queryClient.setQueryData(['expense', updatedExpense.id], context.previousExpense);
      }
    },
    onSettled: (data, error, variables) => {
      queryClient.invalidateQueries(['expense', variables.id]);
      queryClient.invalidateQueries(['expenses']);
    },
  });
}

export function useDeleteExpense() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (id: string) => apiService.deleteExpense(id),
    onSuccess: (data, id) => {
      queryClient.removeQueries(['expense', id]);
      queryClient.invalidateQueries(['expenses']);
    },
  });
}
```

**Customer hooks:**
```typescript
// src/lib/react-query/hooks/useCustomers.ts
export function useUpdateCustomer() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (customer: Customer) => apiService.updateCustomer(customer),
    onMutate: async (updatedCustomer) => {
      await queryClient.cancelQueries(['customer', updatedCustomer.id]);
      const previousCustomer = queryClient.getQueryData(['customer', updatedCustomer.id]);
      queryClient.setQueryData(['customer', updatedCustomer.id], updatedCustomer);
      return { previousCustomer };
    },
    onError: (err, updatedCustomer, context) => {
      if (context?.previousCustomer) {
        queryClient.setQueryData(['customer', updatedCustomer.id], context.previousCustomer);
      }
    },
    onSettled: (data, error, variables) => {
      queryClient.invalidateQueries(['customer', variables.id]);
      queryClient.invalidateQueries(['customers']);
    },
  });
}
```

**Settlement hooks:**
```typescript
// src/lib/react-query/hooks/useSettlements.ts
export function useCreateSettlement() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (settlement: Settlement) => apiService.createSettlement(settlement),
    onSuccess: (newSettlement) => {
      queryClient.setQueryData(['settlement', newSettlement.id], newSettlement);
      queryClient.invalidateQueries(['settlements']);
    },
  });
}

export function useUpdateSettlement() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (settlement: Settlement) => apiService.updateSettlement(settlement),
    onMutate: async (updatedSettlement) => {
      await queryClient.cancelQueries(['settlement', updatedSettlement.id]);
      const previousSettlement = queryClient.getQueryData(['settlement', updatedSettlement.id]);
      queryClient.setQueryData(['settlement', updatedSettlement.id], updatedSettlement);
      return { previousSettlement };
    },
    onError: (err, updatedSettlement, context) => {
      if (context?.previousSettlement) {
        queryClient.setQueryData(['settlement', updatedSettlement.id], context.previousSettlement);
      }
    },
    onSettled: (data, error, variables) => {
      queryClient.invalidateQueries(['settlement', variables.id]);
      queryClient.invalidateQueries(['settlements']);
    },
  });
}
```

### 1.3 Odstránenie compatibility layers

**ExpenseListNew.tsx:**
```typescript
// ❌ ODSTRÁNIŤ
const getFilteredExpenses = () => expenses;
const getFilteredVehicles = () => vehiclesData;
const createExpense = async (expense: Expense) => { ... };
const updateExpense = async (expense: Expense) => { ... };
const deleteExpense = async (id: string) => { ... };

// ✅ POUŽIŤ priamo
const { data: expenses = [] } = useExpenses();
const createExpenseMutation = useCreateExpense();
const updateExpenseMutation = useUpdateExpense();
const deleteExpenseMutation = useDeleteExpense();
```

**CustomerListNew.tsx:**
```typescript
// ❌ ODSTRÁNIŤ
const updateRental = async (rental: Rental) => {
  // TODO: Implement updateRental in React Query hooks
  console.warn('updateRental not yet implemented in React Query hooks', rental);
};

// ✅ POUŽIŤ priamo
const updateRentalMutation = useUpdateRental();
```

---

## 🧹 FÁZA 2: VYTVORENIE SHARED UTILITIES (25 min)

### 2.1 Shared filtering hook

```typescript
// src/lib/react-query/hooks/useFilteredData.ts
import { useMemo } from 'react';

export interface FilterOptions {
  search?: string;
  category?: string;
  company?: string;
  status?: string;
  dateRange?: { start: Date; end: Date };
  priceRange?: { min: number; max: number };
  showAvailable?: boolean;
  showRented?: boolean;
  showMaintenance?: boolean;
  showOther?: boolean;
  showRemoved?: boolean;
  showTempRemoved?: boolean;
  showPrivate?: boolean;
}

export function useFilteredData<T>(
  data: T[],
  filters: FilterOptions,
  searchFields: (keyof T)[],
  customFilters?: (item: T, filters: FilterOptions) => boolean
) {
  return useMemo(() => {
    if (!data || data.length === 0) return [];

    return data.filter(item => {
      // Search filter
      if (filters.search) {
        const searchLower = filters.search.toLowerCase();
        const matchesSearch = searchFields.some(field => {
          const value = item[field];
          return value && String(value).toLowerCase().includes(searchLower);
        });
        if (!matchesSearch) return false;
      }

      // Category filter
      if (filters.category && filters.category !== 'all') {
        const itemCategory = (item as any).category;
        if (itemCategory !== filters.category) return false;
      }

      // Company filter
      if (filters.company && filters.company !== 'all') {
        const itemCompany = (item as any).company;
        if (itemCompany !== filters.company) return false;
      }

      // Status filter
      if (filters.status && filters.status !== 'all') {
        const itemStatus = (item as any).status;
        if (itemStatus !== filters.status) return false;
      }

      // Date range filter
      if (filters.dateRange) {
        const itemDate = (item as any).date || (item as any).startDate;
        if (itemDate) {
          const date = new Date(itemDate);
          if (date < filters.dateRange.start || date > filters.dateRange.end) {
            return false;
          }
        }
      }

      // Price range filter
      if (filters.priceRange) {
        const itemPrice = (item as any).price || (item as any).totalPrice;
        if (itemPrice) {
          if (itemPrice < filters.priceRange.min || itemPrice > filters.priceRange.max) {
            return false;
          }
        }
      }

      // Custom filters
      if (customFilters && !customFilters(item, filters)) {
        return false;
      }

      return true;
    });
  }, [data, filters, searchFields, customFilters]);
}
```

### 2.2 Shared mobile detection hook

```typescript
// src/hooks/useMobile.ts
import { useMediaQuery, useTheme } from '@mui/material';

export function useMobile() {
  const theme = useTheme();
  return useMediaQuery(theme.breakpoints.down('md'), { noSsr: true });
}

export function useTablet() {
  const theme = useTheme();
  return useMediaQuery(theme.breakpoints.between('md', 'lg'), { noSsr: true });
}

export function useDesktop() {
  const theme = useTheme();
  return useMediaQuery(theme.breakpoints.up('lg'), { noSsr: true });
}
```

### 2.3 Shared loading states component

```typescript
// src/components/common/LoadingStates.tsx
import React from 'react';
import { Box, CircularProgress, Typography, Alert } from '@mui/material';

interface LoadingStatesProps {
  isLoading: boolean;
  error: Error | null;
  loadingText?: string;
  children: React.ReactNode;
}

export function DataLoadingState({ 
  isLoading, 
  error, 
  loadingText = 'Načítavam dáta...', 
  children 
}: LoadingStatesProps) {
  if (isLoading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="200px">
        <Box textAlign="center">
          <CircularProgress />
          <Typography variant="body2" sx={{ mt: 2 }}>
            {loadingText}
          </Typography>
        </Box>
      </Box>
    );
  }

  if (error) {
    return (
      <Alert severity="error" sx={{ m: 2 }}>
        <Typography variant="h6">Chyba pri načítavaní dát</Typography>
        <Typography variant="body2">{error.message}</Typography>
      </Alert>
    );
  }

  return <>{children}</>;
}

export function EmptyState({ 
  title = 'Žiadne dáta', 
  description = 'Neboli nájdené žiadne záznamy.',
  action 
}: {
  title?: string;
  description?: string;
  action?: React.ReactNode;
}) {
  return (
    <Box textAlign="center" py={4}>
      <Typography variant="h6" color="text.secondary" gutterBottom>
        {title}
      </Typography>
      <Typography variant="body2" color="text.secondary" paragraph>
        {description}
      </Typography>
      {action}
    </Box>
  );
}
```

### 2.4 Shared search hook

```typescript
// src/hooks/useSearch.ts
import { useState, useMemo, useCallback } from 'react';
import { useDebounce } from './useDebounce';

export function useSearch<T>(
  data: T[],
  searchFields: (keyof T)[],
  debounceMs: number = 300
) {
  const [searchQuery, setSearchQuery] = useState('');
  const debouncedSearchQuery = useDebounce(searchQuery, debounceMs);

  const filteredData = useMemo(() => {
    if (!debouncedSearchQuery) return data;

    const searchLower = debouncedSearchQuery.toLowerCase();
    return data.filter(item =>
      searchFields.some(field => {
        const value = item[field];
        return value && String(value).toLowerCase().includes(searchLower);
      })
    );
  }, [data, debouncedSearchQuery, searchFields]);

  const clearSearch = useCallback(() => {
    setSearchQuery('');
  }, []);

  return {
    searchQuery,
    setSearchQuery,
    debouncedSearchQuery,
    filteredData,
    clearSearch,
  };
}
```

### 2.5 Shared debounce hook

```typescript
// src/hooks/useDebounce.ts
import { useState, useEffect } from 'react';

export function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
}
```

---

## 🔄 FÁZA 3: REFAKTORING KOMPONENTOV (30 min)

### 3.1 ExpenseListNew.tsx refaktoring

```typescript
// src/components/expenses/ExpenseListNew.tsx
import React, { useState, useMemo } from 'react';
import { useExpenses, useCreateExpense, useUpdateExpense, useDeleteExpense } from '@/lib/react-query/hooks/useExpenses';
import { useVehicles } from '@/lib/react-query/hooks/useVehicles';
import { useFilteredData } from '@/lib/react-query/hooks/useFilteredData';
import { useMobile } from '@/hooks/useMobile';
import { useSearch } from '@/hooks/useSearch';
import { DataLoadingState, EmptyState } from '@/components/common/LoadingStates';
import type { Expense, ExpenseFilters } from '@/types';

const ExpenseListNew: React.FC = () => {
  // React Query hooks
  const { data: expenses = [], isLoading, error } = useExpenses();
  const { data: vehicles = [] } = useVehicles();
  const createExpenseMutation = useCreateExpense();
  const updateExpenseMutation = useUpdateExpense();
  const deleteExpenseMutation = useDeleteExpense();

  // UI state
  const isMobile = useMobile();
  const [filters, setFilters] = useState<ExpenseFilters>({});
  const [showFilters, setShowFilters] = useState(false);

  // Search functionality
  const {
    searchQuery,
    setSearchQuery,
    filteredData: searchFilteredExpenses,
  } = useSearch(expenses, ['description', 'category', 'amount']);

  // Combined filtering
  const filteredExpenses = useFilteredData(
    searchFilteredExpenses,
    { ...filters, search: searchQuery },
    ['description', 'category'],
    (expense, filters) => {
      // Custom filtering logic
      if (filters.showAvailable !== undefined) {
        // Custom logic based on expense properties
      }
      return true;
    }
  );

  // Unique values for filter dropdowns
  const uniqueCategories = useMemo(() => {
    const categories = new Set(expenses.map(e => e.category).filter(Boolean));
    return Array.from(categories).sort();
  }, [expenses]);

  const uniqueCompanies = useMemo(() => {
    const companies = new Set(vehicles.map(v => v.company).filter(Boolean));
    return Array.from(companies).sort();
  }, [vehicles]);

  // Event handlers
  const handleCreateExpense = async (expense: Expense) => {
    try {
      await createExpenseMutation.mutateAsync(expense);
    } catch (error) {
      console.error('Error creating expense:', error);
    }
  };

  const handleUpdateExpense = async (expense: Expense) => {
    try {
      await updateExpenseMutation.mutateAsync(expense);
    } catch (error) {
      console.error('Error updating expense:', error);
    }
  };

  const handleDeleteExpense = async (id: string) => {
    try {
      await deleteExpenseMutation.mutateAsync(id);
    } catch (error) {
      console.error('Error deleting expense:', error);
    }
  };

  return (
    <DataLoadingState isLoading={isLoading} error={error}>
      {filteredExpenses.length === 0 ? (
        <EmptyState
          title="Žiadne výdavky"
          description="Neboli nájdené žiadne výdavky pre zadané filtre."
        />
      ) : (
        // Component content with filtered data
        <div>
          {/* Search and filters */}
          {/* Expense list */}
        </div>
      )}
    </DataLoadingState>
  );
};

export default ExpenseListNew;
```

### 3.2 CustomerListNew.tsx refaktoring

```typescript
// src/components/customers/CustomerListNew.tsx
import React, { useState, useMemo } from 'react';
import { useCustomers, useCreateCustomer, useUpdateCustomer, useDeleteCustomer } from '@/lib/react-query/hooks/useCustomers';
import { useRentals, useUpdateRental } from '@/lib/react-query/hooks/useRentals';
import { useFilteredData } from '@/lib/react-query/hooks/useFilteredData';
import { useMobile } from '@/hooks/useMobile';
import { useSearch } from '@/hooks/useSearch';
import { DataLoadingState, EmptyState } from '@/components/common/LoadingStates';
import type { Customer, CustomerFilters } from '@/types';

const CustomerListNew: React.FC = () => {
  // React Query hooks
  const { data: customers = [], isLoading, error } = useCustomers();
  const { data: rentals = [] } = useRentals();
  const createCustomerMutation = useCreateCustomer();
  const updateCustomerMutation = useUpdateCustomer();
  const deleteCustomerMutation = useDeleteCustomer();
  const updateRentalMutation = useUpdateRental();

  // UI state
  const isMobile = useMobile();
  const [filters, setFilters] = useState<CustomerFilters>({});
  const [showFilters, setShowFilters] = useState(false);

  // Search functionality
  const {
    searchQuery,
    setSearchQuery,
    filteredData: searchFilteredCustomers,
  } = useSearch(customers, ['name', 'email', 'phone']);

  // Combined filtering
  const filteredCustomers = useFilteredData(
    searchFilteredCustomers,
    { ...filters, search: searchQuery },
    ['name', 'email', 'phone']
  );

  // Event handlers
  const handleUpdateRental = async (rental: Rental) => {
    try {
      await updateRentalMutation.mutateAsync(rental);
    } catch (error) {
      console.error('Error updating rental:', error);
    }
  };

  return (
    <DataLoadingState isLoading={isLoading} error={error}>
      {filteredCustomers.length === 0 ? (
        <EmptyState
          title="Žiadni zákazníci"
          description="Neboli nájdení žiadni zákazníci pre zadané filtre."
        />
      ) : (
        // Component content with filtered data
        <div>
          {/* Search and filters */}
          {/* Customer list */}
        </div>
      )}
    </DataLoadingState>
  );
};

export default CustomerListNew;
```

### 3.3 SettlementListNew.tsx refaktoring

```typescript
// src/components/settlements/SettlementListNew.tsx
import React, { useState, useMemo } from 'react';
import { useSettlements, useCreateSettlement, useUpdateSettlement, useDeleteSettlement } from '@/lib/react-query/hooks/useSettlements';
import { useFilteredData } from '@/lib/react-query/hooks/useFilteredData';
import { useMobile } from '@/hooks/useMobile';
import { useSearch } from '@/hooks/useSearch';
import { DataLoadingState, EmptyState } from '@/components/common/LoadingStates';
import type { Settlement, SettlementFilters } from '@/types';

const SettlementListNew: React.FC = () => {
  // React Query hooks
  const { data: settlements = [], isLoading, error } = useSettlements();
  const createSettlementMutation = useCreateSettlement();
  const updateSettlementMutation = useUpdateSettlement();
  const deleteSettlementMutation = useDeleteSettlement();

  // UI state
  const isMobile = useMobile();
  const [filters, setFilters] = useState<SettlementFilters>({});
  const [showFilters, setShowFilters] = useState(false);

  // Search functionality
  const {
    searchQuery,
    setSearchQuery,
    filteredData: searchFilteredSettlements,
  } = useSearch(settlements, ['description', 'amount']);

  // Combined filtering
  const filteredSettlements = useFilteredData(
    searchFilteredSettlements,
    { ...filters, search: searchQuery },
    ['description', 'amount']
  );

  return (
    <DataLoadingState isLoading={isLoading} error={error}>
      {filteredSettlements.length === 0 ? (
        <EmptyState
          title="Žiadne vyrovnania"
          description="Neboli nájdené žiadne vyrovnania pre zadané filtre."
        />
      ) : (
        // Component content with filtered data
        <div>
          {/* Search and filters */}
          {/* Settlement list */}
        </div>
      )}
    </DataLoadingState>
  );
};

export default SettlementListNew;
```

---

## 🧪 FÁZA 4: TESTOVANIE A VALIDÁCIA (15 min)

### 4.1 Build testy

```bash
# Frontend build test
npm run build

# Backend build test
cd backend && npm run build

# TypeScript check
npx tsc --noEmit

# ESLint check
npx eslint src --ext .ts,.tsx --max-warnings=0
```

### 4.2 Funkčné testy

**Testovanie CRUD operácií:**
- ✅ Vytvorenie nového záznamu
- ✅ Úprava existujúceho záznamu
- ✅ Zmazanie záznamu
- ✅ Optimistic updates
- ✅ Error handling a rollback

**Testovanie filtrovania:**
- ✅ Search functionality
- ✅ Category filters
- ✅ Company filters
- ✅ Status filters
- ✅ Date range filters
- ✅ Price range filters

**Testovanie performance:**
- ✅ Rýchlosť načítania
- ✅ Memory usage
- ✅ Network requests
- ✅ Cache hit rate

### 4.3 Mobile/Desktop testy

- ✅ Responsive design
- ✅ Touch interactions
- ✅ Keyboard navigation
- ✅ Screen reader compatibility

---

## 📊 FÁZA 5: MONITORING A OPTIMALIZÁCIA (10 min)

### 5.1 React Query DevTools

```typescript
// src/App.tsx
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';

function App() {
  return (
    <QueryClient>
      <AppProvider>
        {/* Your app content */}
      </AppProvider>
      {process.env.NODE_ENV === 'development' && (
        <ReactQueryDevtools initialIsOpen={false} />
      )}
    </QueryClient>
  );
}
```

### 5.2 Performance monitoring

```typescript
// src/utils/performanceMonitor.ts
export function logPerformanceMetrics() {
  if (process.env.NODE_ENV === 'development') {
    console.log('📊 Performance Metrics:', {
      memoryUsage: performance.memory ? {
        used: Math.round(performance.memory.usedJSHeapSize / 1024 / 1024),
        total: Math.round(performance.memory.totalJSHeapSize / 1024 / 1024),
        limit: Math.round(performance.memory.jsHeapSizeLimit / 1024 / 1024),
      } : 'N/A',
      timing: performance.timing ? {
        loadTime: performance.timing.loadEventEnd - performance.timing.navigationStart,
        domReady: performance.timing.domContentLoadedEventEnd - performance.timing.navigationStart,
      } : 'N/A',
    });
  }
}
```

---

## 🧹 FÁZA 6: FINÁLNE VYČISTENIE (10 min)

### 6.1 Odstránenie nepotrebných súborov

```bash
# Odstránenie backup súborov
rm src/components/rentals/RentalListNew.tsx.backup
rm src/components/Statistics.tsx.backup

# Odstránenie nepotrebných utility súborov
rm src/utils/unifiedCacheSystem.ts
```

### 6.2 Vyčistenie importov

```typescript
// Vyčistiť všetky nepoužívané importy
// Odstrániť zakomentované kódy
// Odstrániť TODO komentáre ktoré boli vyriešené
```

### 6.3 Dokumentácia

```typescript
// Pridať JSDoc komentáre k novým hooks
// Aktualizovať README
// Vytvoriť migration guide
```

---

## ⏱️ ČASOVÝ HARMONOGRAM

| Fáza | Čas | Priorita | Status |
|------|-----|----------|--------|
| 1. Dokončenie migrácie | 20 min | 🔴 VYSOKÁ | ⏳ ČAKÁ |
| 2. Shared utilities | 25 min | 🟡 STREDNÁ | ⏳ ČAKÁ |
| 3. Refaktoring komponentov | 30 min | 🟡 STREDNÁ | ⏳ ČAKÁ |
| 4. Testovanie | 15 min | 🔴 VYSOKÁ | ⏳ ČAKÁ |
| 5. Monitoring | 10 min | 🟢 NÍZKA | ⏳ ČAKÁ |
| 6. Vyčistenie | 10 min | 🟢 NÍZKA | ⏳ ČAKÁ |

**CELKOVÝ ČAS: ~110 minút**

---

## ⚠️ RIZIKÁ A MITIGÁCIA

### Riziká
1. **Breaking changes** - komponenty prestanú fungovať
2. **Performance regresia** - pomalšie načítanie
3. **TypeScript chyby** - build zlyhá
4. **Cache konflikty** - nekonzistentné dáta
5. **Mobile compatibility** - problémy na mobilných zariadeniach

### Mitigácia
1. **Postupná migrácia** - jeden komponent po druhom
2. **Testovanie po každej fáze** - rýchle opravy
3. **Backup pred zmenami** - možnosť rollbacku
4. **Monitoring** - sledovanie performance
5. **Mobile testing** - testovanie na rôznych zariadeniach

---

## ✅ KRITÉRIÁ ÚSPECHU

- [ ] Všetky komponenty fungujú bez chýb
- [ ] TypeScript build prechádza (0 errors, 0 warnings)
- [ ] Performance je lepšia alebo rovnaká
- [ ] Cache hit rate > 80%
- [ ] Žiadne duplicitné API volania
- [ ] Optimistic updates fungujú
- [ ] Memory usage je stabilné
- [ ] Mobile/desktop compatibility
- [ ] Všetky nepotrebné súbory sú odstránené
- [ ] Dokumentácia je aktualizovaná

---

## 🚨 **FINALIZAČNÝ CHECKLIST**

### Pred začiatkom
- [ ] Git commit aktuálneho stavu
- [ ] Backup súborov
- [ ] Test build
- [ ] Dokumentácia súčasného stavu

### Po každej fáze
- [ ] Test build
- [ ] Test funkcionality
- [ ] Git commit
- [ ] Dokumentácia zmien

### Na konci
- [ ] Všetky testy prechádzajú
- [ ] Build bez chýb
- [ ] Performance testy
- [ ] Mobile/desktop testy
- [ ] Dokumentácia dokončená
- [ ] **NEPUSHOVAŤ** - len lokálne testovanie

---

## 🎯 **OČAKÁVANÉ VÝSLEDKY**

Po dokončení:
- ✅ **0% hybrid state** - len React Query + AppContext (UI state)
- ✅ **-70% duplicitný kód** - shared utilities
- ✅ **Lepšia maintainability** - centralizované patterns
- ✅ **Rýchlejšie development** - reusable components
- ✅ **Lepšia performance** - optimalizované cache
- ✅ **Lepšia UX** - konzistentné loading states
- ✅ **Lepšia accessibility** - shared components

---

## 🚀 **IMPLEMENTAČNÝ WORKFLOW**

1. **Začni s FÁZOU 1** - dokončenie migrácie
2. **Testuj po každej fáze** - build + funkcionalita
3. **Commituj po každej fáze** - pre možnosť rollbacku
4. **NEPUSHUJ** - len lokálne testovanie
5. **Pushuj len na konci** - keď je všetko 100% funkčné

**PAMÄTAJ: Kvalita kódu je priorita #1. Radšej menej funkcionalít ale perfektný kód!**
