# 🔧 LEASING SYSTEM REFACTOR - Kompletná oprava

## 📋 CIEĽ
Refaktorovať leasing systém aby fungoval PRESNE ako rentals/insurances - s plnou podporou optimistic updates, WebSocket real-time synchronizácie a smart refresh mechanizmom.

---

## 🎯 FÁZY IMPLEMENTÁCIE

### **FÁZA 1: WebSocket Integration** ⚡
**Súbory:**
- `backend/src/services/websocket-service.ts` - pridať leasing events
- `src/lib/react-query/websocket-integration.ts` - pridať leasing listeners
- `src/hooks/useWebSocket.ts` - pridať useLeasingUpdates hook

**Čo spraviť:**
1. ✅ Backend už má WebSocket broadcast v `leasings.ts` routes
2. ❌ Frontend NEMÁ leasing event listeners v websocket-integration.ts
3. ❌ Frontend NEMÁ useLeasingUpdates hook

**Akcie:**
- [ ] Pridať `handleLeasingCreated` do websocket-integration.ts
- [ ] Pridať `handleLeasingUpdated` do websocket-integration.ts  
- [ ] Pridať `handleLeasingDeleted` do websocket-integration.ts
- [ ] Vytvoriť `useLeasingUpdates` hook v useWebSocket.ts

---

### **FÁZA 2: Infinite Scroll Hook** 📜
**Súbory:**
- `src/hooks/useInfiniteLeasings.ts` - NOVÝ súbor (kópia useInfiniteRentals pattern)

**Čo spraviť:**
1. Vytvoriť `useInfiniteLeasings` hook s:
   - Smart loading (pagination)
   - Optimistic updates listeners
   - Smart refresh (update len konkrétny leasing)
   - WebSocket event handling
   - Filter support

**Pattern z useInfiniteRentals:**
```typescript
export function useInfiniteLeasings(initialFilters) {
  // State management
  // Load function with pagination
  // Smart refresh
  // Optimistic update listeners
  // WebSocket integration
}
```

---

### **FÁZA 3: Optimistic Updates - Complete** ✨
**Súbory:**
- `src/lib/react-query/hooks/useLeasings.ts` - už má partial, dokončiť

**Čo spraviť:**
1. ✅ useCreateLeasing - už má optimistic update
2. ✅ useUpdateLeasing - už má optimistic update
3. ✅ useDeleteLeasing - už má optimistic update (práve pridané)
4. ❌ Chýba WebSocket event dispatch
5. ❌ Chýba 'leasing-optimistic-update' events

**Akcie:**
- [ ] Pridať WebSocket event dispatch do všetkých mutations
- [ ] Pridať 'leasing-optimistic-update' custom events
- [ ] Synchronizovať s useInfiniteLeasings

---

### **FÁZA 4: LeasingList Component Refactor** 🎨
**Súbory:**
- `src/components/leasings/LeasingList.tsx` - refactor na useInfiniteLeasings

**Čo spraviť:**
1. Nahradiť `useLeasings()` za `useInfiniteLeasings()`
2. Pridať infinite scroll UI
3. Pridať WebSocket listeners
4. Smart refresh pre real-time updates
5. Optimistic update handling

**Pattern z RentalList:**
```typescript
const {
  leasings,
  loading,
  hasMore,
  loadMore,
  refresh,
  updateLeasingInList,
} = useInfiniteLeasings(filters);

// WebSocket handling
useEffect(() => {
  const handleOptimisticUpdate = (event) => {
    const { leasing, action } = event.detail;
    if (action === 'update') updateLeasingInList(leasing);
    // ...
  };
  window.addEventListener('leasing-optimistic-update', handleOptimisticUpdate);
  return () => window.removeEventListener(...);
}, []);
```

---

### **FÁZA 5: Backend Cache Fix Verification** ✅
**Súbory:**
- `backend/src/routes/leasings.ts` - už opravené

**Status:**
- ✅ Cache invalidation opravená ('expenses' namiesto 'expense')
- ✅ WebSocket broadcasts fungujú
- ✅ API endpoints majú správne cache TTL

---

### **FÁZA 6: Testing & Verification** 🧪
**Testy:**
1. [ ] Create leasing - okamžite sa zobrazí
2. [ ] Update leasing - okamžite sa aktualizuje
3. [ ] Delete leasing - okamžite zmizne
4. [ ] Payment marking - okamžitá aktualizácia
5. [ ] Multi-tab sync - zmeny v jednom tabe = update v druhom
6. [ ] Error handling - rollback pri API chybe
7. [ ] Localhost ↔️ Production sync - zmeny sa prejavia všade

---

## 📊 PROGRESS TRACKING

| Fáza | Status | Čas | Poznámky |
|------|--------|-----|----------|
| FÁZA 1: WebSocket Integration | 🔄 IN PROGRESS | 20 min | |
| FÁZA 2: useInfiniteLeasings | ⏳ TODO | 30 min | |
| FÁZA 3: Optimistic Updates | ⏳ TODO | 15 min | |
| FÁZA 4: LeasingList Refactor | ⏳ TODO | 30 min | |
| FÁZA 5: Backend Verification | ✅ DONE | - | Already fixed |
| FÁZA 6: Testing | ⏳ TODO | 30 min | |
| **TOTAL** | | **~2h 5min** | |

---

## 🎯 EXPECTED RESULT

Po dokončení bude leasing systém fungovať IDENTICKY ako rentals:
- ⚡ Instant updates (optimistic)
- 🔄 Real-time sync (WebSocket)
- 📱 Multi-tab support
- 🚀 Fast performance (infinite scroll)
- 🛡️ Error resilient (rollback)
- 🎨 Unified code patterns

---

## 🚀 ZAČÍNAME!

