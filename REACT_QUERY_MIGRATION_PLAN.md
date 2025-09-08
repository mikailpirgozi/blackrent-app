# 🚀 KOMPLETNÝ MIGRAČNÝ PLÁN - AppContext → React Query

## 📋 PREHĽAD CIEĽA

**Transformácia:** Zmiešaný systém (AppContext + React Query + UnifiedCache) → Čistý React Query systém

**Výsledok:** 
- React Query = server state (dáta zo siete)
- AppContext = UI state (modaly, filtre, výber)
- Žiadne duplikácie, konflikty, zbytočné cache

---

## 🎯 FÁZA 1: ANALÝZA A PRÍPRAVA (15 min)

### 1.1 Identifikácia súčasného stavu
- [ ] Zmapovať všetky komponenty používajúce AppContext
- [ ] Zmapovať všetky React Query hooks
- [ ] Identifikovať duplicitné API volania
- [ ] Zistiť TypeScript chyby

### 1.2 Backup a bezpečnosť
- [ ] Git commit pred zmenami
- [ ] Backup súčasných súborov
- [ ] Testovanie build procesu

---

## 🧹 FÁZA 2: VYČISTENIE CACHE SYSTÉMOV (20 min)

### 2.1 Odstránenie UnifiedCache
```typescript
// ❌ ODSTRÁNIŤ
// src/utils/unifiedCacheSystem.ts
// import { unifiedCache } from '../utils/unifiedCacheSystem';

// ❌ ODSTRÁNIŤ zo všetkých súborov
unifiedCache.invalidateEntity('vehicle');
unifiedCache.clear();
```

### 2.2 Vyčistenie AppContext
```typescript
// src/context/AppContext.tsx
// ❌ ODSTRÁNIŤ server state
interface AppState {
  // vehicles: Vehicle[]; ❌
  // rentals: Rental[]; ❌
  // insurances: Insurance[]; ❌
  
  // ✅ ZACHOVAŤ len UI state
  selectedVehicleIds: string[];
  openModals: Record<string, boolean>;
  filterState: FilterState;
  tableLayout: TableLayout;
}
```

---

## 🔄 FÁZA 3: BULK API → PER-ID NORMALIZÁCIA (30 min)

### 3.1 Vytvorenie Bulk Data Loader
```typescript
// src/lib/react-query/hooks/useBulkDataLoader.ts
export function useBulkDataLoader() {
  const qc = useQueryClient();
  
  return useQuery({
    queryKey: ['bulk-data'],
    queryFn: async () => {
      const bulkData = await apiService.getBulkData();
      
      // Normalizácia do per-ID cache
      bulkData.vehicles.forEach(vehicle => {
        qc.setQueryData(['vehicle', vehicle.id], vehicle);
      });
      bulkData.rentals.forEach(rental => {
        qc.setQueryData(['rental', rental.id], rental);
      });
      
      return bulkData;
    },
    staleTime: 5 * 60 * 1000,
  });
}
```

### 3.2 Per-ID Hooks
```typescript
// src/lib/react-query/hooks/useVehicles.ts
export function useVehicle(id: string) {
  return useQuery({
    queryKey: ['vehicle', id],
    queryFn: () => apiService.getVehicle(id),
    staleTime: 60_000,
  });
}

export function useVehicles(filters?: VehicleFilters) {
  return useQuery({
    queryKey: ['vehicles', filters],
    queryFn: () => apiService.getVehicles(filters),
    staleTime: 60_000,
  });
}
```

---

## 🎨 FÁZA 4: MIGRÁCIA KOMPONENTOV (60 min)

### 4.1 Priority komponentov
1. **Statistics.tsx** - najkritickejší
2. **VehicleCentricInsuranceList.tsx** - už částečne migrovaný
3. **VehicleListNew.tsx** - veľký komponent
4. **RentalList.tsx** - často používaný
5. **Ostatné komponenty** - postupne

### 4.2 Migračný pattern pre každý komponent
```typescript
// ❌ PRED migráciou
const { state } = useApp();
const vehicles = state.vehicles;

// ✅ PO migrácii
const { data: vehicles } = useVehicles();
```

### 4.3 Mutácie s Optimistic Updates
```typescript
export function useUpdateVehicle() {
  const qc = useQueryClient();
  
  return useMutation({
    mutationFn: (vehicle: Vehicle) => apiService.updateVehicle(vehicle),
    onMutate: async (updatedVehicle) => {
      // Optimistic update
      qc.setQueryData(['vehicle', updatedVehicle.id], updatedVehicle);
    },
    onSettled: (data, error, variables) => {
      // Cielená invalidácia
      qc.invalidateQueries(['vehicle', variables.id]);
      qc.invalidateQueries(['vehicles']);
    },
  });
}
```

---

## 🔧 FÁZA 5: OPRAVA TYPESCRIPT CHÝB (30 min)

### 5.1 Identifikácia chýb
```bash
npm run build
npx tsc --noEmit
```

### 5.2 Oprava typov
- [ ] Opraviť importy
- [ ] Opraviť type definitions
- [ ] Opraviť generics
- [ ] Opraviť null/undefined checks

---

## 🧪 FÁZA 6: TESTOVANIE A VALIDÁCIA (20 min)

### 6.1 Funkčné testy
- [ ] Načítanie dát
- [ ] Filtrovanie
- [ ] Mutácie (create, update, delete)
- [ ] Cache invalidácia
- [ ] Optimistic updates

### 6.2 Performance testy
- [ ] Rýchlosť načítania
- [ ] Memory usage
- [ ] Network requests
- [ ] Cache hit rate

---

## 📊 FÁZA 7: MONITORING A OPTIMALIZÁCIA (15 min)

### 7.1 React Query DevTools
```typescript
// src/App.tsx
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';

function App() {
  return (
    <QueryClient>
      {/* App content */}
      <ReactQueryDevtools initialIsOpen={false} />
    </QueryClient>
  );
}
```

### 7.2 Cache monitoring
- [ ] Sledovanie query keys
- [ ] Sledovanie invalidácií
- [ ] Sledovanie staleTime
- [ ] Sledovanie memory usage

---

## 🧹 FÁZA 8: FINÁLNE VYČISTENIE (10 min)

### 8.1 Odstránenie nepotrebných súborov
- [ ] `src/utils/unifiedCacheSystem.ts`
- [ ] Staré cache utilities
- [ ] Nepoužívané importy

### 8.2 Dokumentácia
- [ ] Aktualizovať README
- [ ] Dokumentovať nové patterns
- [ ] Vytvoriť migration guide

---

## ⏱️ ČASOVÝ HARMONOGRAM

| Fáza | Čas | Priorita | Závislosti |
|------|-----|----------|------------|
| 1. Analýza | 15 min | Vysoká | - |
| 2. Vyčistenie cache | 20 min | Vysoká | Fáza 1 |
| 3. Bulk → Per-ID | 30 min | Vysoká | Fáza 2 |
| 4. Migrácia komponentov | 60 min | Vysoká | Fáza 3 |
| 5. TypeScript opravy | 30 min | Stredná | Fáza 4 |
| 6. Testovanie | 20 min | Vysoká | Fáza 5 |
| 7. Monitoring | 15 min | Nízka | Fáza 6 |
| 8. Vyčistenie | 10 min | Nízka | Fáza 7 |

**CELKOVÝ ČAS: ~3 hodiny**

---

## ⚠️ RIZIKÁ A MITIGÁCIA

### Riziká
1. **Breaking changes** - komponenty prestanú fungovať
2. **Performance regresia** - pomalšie načítanie
3. **TypeScript chyby** - build zlyhá
4. **Cache konflikty** - nekonzistentné dáta

### Mitigácia
1. **Postupná migrácia** - jeden komponent po druhom
2. **Testovanie po každej fáze** - rýchle opravy
3. **Backup pred zmenami** - možnosť rollbacku
4. **Monitoring** - sledovanie performance

---

## ✅ KRITÉRIÁ ÚSPECHU

- [ ] Všetky komponenty fungujú bez chýb
- [ ] TypeScript build prechádza (0 errors, 0 warnings)
- [ ] Performance je lepšia alebo rovnaká
- [ ] Cache hit rate > 80%
- [ ] Žiadne duplicitné API volania
- [ ] Optimistic updates fungujú
- [ ] Memory usage je stabilné

---

## 🎯 DETAILNÉ IMPLEMENTAČNÉ KROKY

### Krok 1: Vyčistenie AppContext
```typescript
// src/context/AppContext.tsx
interface AppState {
  // UI STATE ONLY
  selectedVehicleIds: string[];
  openModals: Record<string, boolean>;
  filterState: {
    search: string;
    category: string;
    company: string;
    status: string;
  };
  tableLayout: {
    sortBy: string;
    sortOrder: 'asc' | 'desc';
    pageSize: number;
  };
  
  // REMOVE ALL SERVER STATE
  // vehicles: Vehicle[]; ❌
  // rentals: Rental[]; ❌
  // insurances: Insurance[]; ❌
  // expenses: Expense[]; ❌
  // customers: Customer[]; ❌
  // companies: Company[]; ❌
  // insurers: Insurer[]; ❌
  // settlements: Settlement[]; ❌
  // vehicleDocuments: VehicleDocument[]; ❌
  // insuranceClaims: InsuranceClaim[]; ❌
  // protocols: Protocol[]; ❌
}
```

### Krok 2: Bulk Data Loader Implementation
```typescript
// src/lib/react-query/hooks/useBulkDataLoader.ts
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { apiService } from '@/services/api';

export function useBulkDataLoader() {
  const queryClient = useQueryClient();

  return useQuery({
    queryKey: ['bulk-data'],
    queryFn: async () => {
      console.log('🚀 Loading BULK data and normalizing to per-ID cache...');
      const startTime = Date.now();

      const bulkData = await apiService.getBulkData();

      // Normalize vehicles
      bulkData.vehicles?.forEach(vehicle => {
        queryClient.setQueryData(['vehicle', vehicle.id], vehicle);
      });
      queryClient.setQueryData(['vehicles'], bulkData.vehicles || []);

      // Normalize rentals
      bulkData.rentals?.forEach(rental => {
        queryClient.setQueryData(['rental', rental.id], rental);
      });
      queryClient.setQueryData(['rentals'], bulkData.rentals || []);

      // Normalize customers
      bulkData.customers?.forEach(customer => {
        queryClient.setQueryData(['customer', customer.id], customer);
      });
      queryClient.setQueryData(['customers'], bulkData.customers || []);

      // Normalize companies
      bulkData.companies?.forEach(company => {
        queryClient.setQueryData(['company', company.id], company);
      });
      queryClient.setQueryData(['companies'], bulkData.companies || []);

      // Normalize insurers
      bulkData.insurers?.forEach(insurer => {
        queryClient.setQueryData(['insurer', insurer.id], insurer);
      });
      queryClient.setQueryData(['insurers'], bulkData.insurers || []);

      // Normalize expenses
      bulkData.expenses?.forEach(expense => {
        queryClient.setQueryData(['expense', expense.id], expense);
      });
      queryClient.setQueryData(['expenses'], bulkData.expenses || []);

      // Normalize insurances
      bulkData.insurances?.forEach(insurance => {
        queryClient.setQueryData(['insurance', insurance.id], insurance);
      });
      queryClient.setQueryData(['insurances'], bulkData.insurances || []);

      // Normalize settlements
      bulkData.settlements?.forEach(settlement => {
        queryClient.setQueryData(['settlement', settlement.id], settlement);
      });
      queryClient.setQueryData(['settlements'], bulkData.settlements || []);

      // Normalize insurance claims
      bulkData.insuranceClaims?.forEach(claim => {
        queryClient.setQueryData(['insurance-claim', claim.id], claim);
      });
      queryClient.setQueryData(['insurance-claims'], bulkData.insuranceClaims || []);

      const endTime = Date.now();
      console.log(`✅ BULK data normalized in ${endTime - startTime}ms`);

      return bulkData;
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000,   // 10 minutes
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
  });
}
```

### Krok 3: Per-Entity Hooks
```typescript
// src/lib/react-query/hooks/useVehicles.ts
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiService } from '@/services/api';
import type { Vehicle } from '@/types';

export function useVehicle(id: string) {
  return useQuery({
    queryKey: ['vehicle', id],
    queryFn: () => apiService.getVehicle(id),
    enabled: !!id,
    staleTime: 60_000, // 1 minute
  });
}

export function useVehicles(filters?: VehicleFilters) {
  return useQuery({
    queryKey: ['vehicles', filters],
    queryFn: () => apiService.getVehicles(filters),
    staleTime: 60_000,
  });
}

export function useUpdateVehicle() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (vehicle: Vehicle) => apiService.updateVehicle(vehicle),
    onMutate: async (updatedVehicle) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries(['vehicle', updatedVehicle.id]);

      // Snapshot previous value
      const previousVehicle = queryClient.getQueryData(['vehicle', updatedVehicle.id]);

      // Optimistically update
      queryClient.setQueryData(['vehicle', updatedVehicle.id], updatedVehicle);
      queryClient.setQueryData(['vehicles'], (old: Vehicle[] = []) =>
        old.map(v => v.id === updatedVehicle.id ? updatedVehicle : v)
      );

      return { previousVehicle };
    },
    onError: (err, updatedVehicle, context) => {
      // Rollback on error
      if (context?.previousVehicle) {
        queryClient.setQueryData(['vehicle', updatedVehicle.id], context.previousVehicle);
      }
    },
    onSettled: (data, error, variables) => {
      // Always refetch after error or success
      queryClient.invalidateQueries(['vehicle', variables.id]);
      queryClient.invalidateQueries(['vehicles']);
    },
  });
}
```

### Krok 4: Component Migration Pattern
```typescript
// BEFORE: Using AppContext
import { useApp } from '@/context/AppContext';

function VehicleList() {
  const { state } = useApp();
  const vehicles = state.vehicles;
  
  return (
    <div>
      {vehicles.map(vehicle => (
        <VehicleCard key={vehicle.id} vehicle={vehicle} />
      ))}
    </div>
  );
}

// AFTER: Using React Query
import { useVehicles } from '@/lib/react-query/hooks/useVehicles';

function VehicleList() {
  const { data: vehicles, isLoading, error } = useVehicles();
  
  if (isLoading) return <div>Loading...</div>;
  if (error) return <div>Error: {error.message}</div>;
  
  return (
    <div>
      {vehicles?.map(vehicle => (
        <VehicleCard key={vehicle.id} vehicle={vehicle} />
      ))}
    </div>
  );
}
```

---

## 🔍 DEBUGGING A MONITORING

### React Query DevTools Setup
```typescript
// src/App.tsx
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';

function App() {
  return (
    <QueryClient>
      <AppProvider>
        {/* Your app content */}
      </AppProvider>
      <ReactQueryDevtools initialIsOpen={false} />
    </QueryClient>
  );
}
```

### Cache Monitoring
```typescript
// src/utils/cacheMonitor.ts
export function logCacheStats(queryClient: QueryClient) {
  const cache = queryClient.getQueryCache();
  const queries = cache.getAll();
  
  console.log('📊 Cache Stats:', {
    totalQueries: queries.length,
    staleQueries: queries.filter(q => q.isStale()).length,
    fetchingQueries: queries.filter(q => q.state.fetchStatus === 'fetching').length,
    errorQueries: queries.filter(q => q.state.status === 'error').length,
  });
}
```

---

## 🚨 ROLLBACK PLAN

Ak sa niečo pokazí:

1. **Git rollback:**
   ```bash
   git reset --hard HEAD~1
   git clean -fd
   ```

2. **Restore backup files:**
   ```bash
   cp -r backup/* src/
   ```

3. **Reinstall dependencies:**
   ```bash
   npm install
   ```

4. **Test build:**
   ```bash
   npm run build
   ```

---

## 📝 CHECKLIST PRE IMPLEMENTÁCIU

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
- [ ] Dokumentácia dokončená

---

**Tento plán je pripravený na implementáciu. Chceš začať s ktorou fázou?**
