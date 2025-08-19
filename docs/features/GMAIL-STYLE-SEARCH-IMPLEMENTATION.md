# 🚀 GMAIL-STYLE SEARCH IMPLEMENTATION

## Čo je Gmail-style Search?

**Gmail-style search** (tiež **"Server-side Search with Infinite Scroll"**) je optimalizačná technika ktorá:

- ⚡ **Načítava len relevantné dáta** namiesto všetkých záznamov
- 🔍 **Vyhľadáva na serveri** pomocou databázových indexov
- 📱 **Postupne načítava** ďalšie výsledky (infinite scroll)
- 🗄️ **Minimalizuje pamäť** - drží len to čo vidíš

## Implementované Sekcie

### ✅ **PRENÁJMY** (už hotové)
- Endpoint: `/api/rentals/paginated`
- Hook: `useInfiniteRentals`
- Features: Search, date filters, company filters, protocol status

### ✅ **VOZIDLÁ** (nové)
- Endpoint: `/api/vehicles/paginated` 
- Hook: `useInfiniteVehicles`
- Features: Search, brand, category, status, year range, price range

### ✅ **FIRMY/MAJITELIA** (nové)
- Endpoint: `/api/companies/paginated`
- Hook: `useInfiniteCompanies` 
- Features: Search, city, country, vehicle count

### ✅ **POUŽÍVATELIA** (nové)
- Endpoint: `/api/advanced-users/paginated`
- Features: Search, role, company filters

### ✅ **ZÁKAZNÍCI** (nové)
- Endpoint: `/api/customers/paginated`
- Hook: `useInfiniteCustomers`
- Features: Search, rental history filter

## Technické Detaily

### Backend Implementation
```typescript
// Dynamické WHERE clause building
const whereClauses: string[] = [];
const queryParams: any[] = [];

if (search) {
  whereClauses.push(`(
    name ILIKE $1 OR 
    email ILIKE $1 OR 
    phone ILIKE $1
  )`);
  queryParams.push(`%${search}%`);
}

// Parallel queries pre count + data
const [countResult, dataResult] = await Promise.all([
  client.query(countQuery, queryParams),
  client.query(dataQuery, [...queryParams, limit, offset])
]);
```

### Frontend Implementation
```typescript
// useInfinite hook pattern
const {
  items,
  loading,
  hasMore,
  searchTerm,
  setSearchTerm,
  loadMore,
  refresh
} = useInfiniteItems();

// Debounced search
useEffect(() => {
  const timer = setTimeout(() => {
    loadItems(1, true); // New search
  }, 300);
  return () => clearTimeout(timer);
}, [searchTerm]);
```

## Performance Benefits

### Pred Gmail Approach
```typescript
// Načíta 10,000+ záznamov
const allVehicles = await getVehicles(); // 2-5s
const filtered = allVehicles.filter(v => v.brand.includes(search)); // 100-500ms
// Total: 2.5-5.5s + vysoká pamäť
```

### Po Gmail Approach  
```typescript
// Načíta len 50 relevantných záznamov
const result = await getVehiclesPaginated({ search, limit: 50 }); // 50-200ms
// Total: 50-200ms + minimálna pamäť
```

## Výhody vs Nevýhody

### ✅ Výhody
- **10-20x rýchlejšie** vyhľadávanie
- **Minimálna pamäť** - len aktuálne dáta
- **Škálovateľné** - funguje aj s miliónom záznamov
- **Mobile-friendly** - nenačítava zbytočné dáta
- **Real-time search** - okamžité výsledky

### ❌ Nevýhody  
- **Zložitejšia implementácia** - viac kódu
- **Server dependency** - potrebuje databázové indexy
- **Offline problém** - nefunguje bez internetu
- **Cache invalidation** - komplexnejšie

## Kedy Používať

### Gmail Approach ✅
- **Veľké datasety** (1000+ záznamov)
- **Časté vyhľadávanie** 
- **Mobile aplikácie**
- **Real-time data** (prenájmy, objednávky)

### Bulk Loading ✅  
- **Malé datasety** (<500 záznamov)
- **Statické dáta** (nastavenia, kategórie)
- **Offline support** potrebný
- **Complex filtering** na client-side

## Použitie v Komponentoch

```typescript
// Namiesto useApp() pre veľké datasety
const { vehicles, loading, searchTerm, setSearchTerm, loadMore } = useInfiniteVehicles();

// Search input
<TextField 
  value={searchTerm}
  onChange={(e) => setSearchTerm(e.target.value)}
  placeholder="Vyhľadať vozidlá..."
/>

// Infinite scroll
<InfiniteScroll
  dataLength={vehicles.length}
  next={loadMore}
  hasMore={hasMore}
  loader={<CircularProgress />}
>
  {vehicles.map(vehicle => <VehicleCard key={vehicle.id} vehicle={vehicle} />)}
</InfiniteScroll>
```

## Database Indexy (Dôležité!)

Pre optimálny výkon pridaj indexy:

```sql
-- Vehicles search indexy
CREATE INDEX idx_vehicles_search ON vehicles USING gin(to_tsvector('english', brand || ' ' || model || ' ' || license_plate));
CREATE INDEX idx_vehicles_brand ON vehicles(brand);
CREATE INDEX idx_vehicles_company_id ON vehicles(owner_company_id);

-- Rentals search indexy  
CREATE INDEX idx_rentals_search ON rentals USING gin(to_tsvector('english', customer_name));
CREATE INDEX idx_rentals_dates ON rentals(start_date, end_date);

-- Customers search indexy
CREATE INDEX idx_customers_search ON customers USING gin(to_tsvector('english', name || ' ' || email));
```

## Monitoring & Debug

```typescript
// Performance logging
console.log(`📊 Found ${result.length}/${total} items in ${loadTime}ms`);

// Cache hit rates
logger.perf('Gmail search performance:', {
  query: searchTerm,
  resultsCount: result.length,
  loadTime: `${loadTime}ms`,
  cacheHit: cached ? 'YES' : 'NO'
});
```

---

**Záver:** Gmail-style approach je **game-changer** pre veľké datasety. Poskytuje **instant search experience** podobný Google/Gmail aplikáciám. 🚀
