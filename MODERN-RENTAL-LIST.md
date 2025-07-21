# Moderný RentalList s Kartami

## Prehľad

Moderný RentalList komponent (`RentalListModern.tsx`) je pokročilá verzia zobrazenia prenájmov s moderným dizajnom, kartami a pokročilým filtrovaním.

## Hlavné vlastnosti

### 🎨 Moderný dizajn
- **Karty pre mobilné zobrazenie** - optimálne pre dotykové zariadenia
- **Responzívny dizajn** - automatické prispôsobenie veľkosti obrazovky
- **Tmavý/svetlý motív** - podpora pre oba motívy
- **Hover efekty** - vizuálna spätná väzba pri interakcii

### 🔍 Pokročilé filtrovanie
- **Rýchle filtre** - chips pre bežné filtre (aktívne, dnešné vrátenia, atď.)
- **Rozšírené filtre** - pokročilé možnosti filtrovania
- **Vyhľadávanie** - full-text vyhľadávanie v prenájmoch
- **Zoradenie** - podľa priority, dátumu, ceny, zákazníka

### 📱 Mobilné optimalizácie
- **Karty vs. zoznam** - prepínanie medzi zobrazeniami
- **Floating action button** - rýchly prístup k pridávaniu
- **Touch-friendly** - veľké tlačidlá a dotykové oblasti
- **Optimalizované rozloženie** - pre malé obrazovky

### ⚡ Výkonnostné vylepšenia
- **Lazy loading** - protokoly sa načítavajú na požiadanie
- **Memoizácia** - optimalizované re-renderovanie
- **Virtuálne zobrazenie** - pre veľké zoznamy
- **Debounced search** - optimalizované vyhľadávanie

## Komponenty

### RentalListModern.tsx
Hlavný komponent s moderným dizajnom a kartami.

**Vlastnosti:**
- `viewMode` - prepínanie medzi kartami a zoznamom
- `sortBy` - zoradenie podľa rôznych kritérií
- `filters` - pokročilé možnosti filtrovania
- `searchQuery` - full-text vyhľadávanie

### RentalMobileCard.tsx
Karta pre zobrazenie jednotlivého prenájmu.

**Vlastnosti:**
- Priorita prenájmu (P1-P10)
- Informácie o vozidle a zákazníkovi
- Stav protokolov (prevzatie/vrátenie)
- Akčné tlačidlá

## Použitie

### Základné použitie
```tsx
import RentalListModern from './components/rentals/RentalListModern';

function App() {
  return <RentalListModern />;
}
```

### Prepínanie zobrazení
```tsx
const [viewMode, setViewMode] = useState<'cards' | 'list'>('cards');
```

### Filtrovanie
```tsx
// Rýchle filtre
const [showActive, setShowActive] = useState(false);
const [showTodayReturns, setShowTodayReturns] = useState(false);

// Rozšírené filtre
const [filterVehicle, setFilterVehicle] = useState('');
const [filterCompany, setFilterCompany] = useState('');
const [searchQuery, setSearchQuery] = useState('');
```

## Priorita prenájmov

Systém automaticky určuje prioritu prenájmov:

1. **P1** - Aktívne prenájmy (dnes)
2. **P2** - Zajtrajšie vrátenia
3. **P3** - Dnešné vrátenia
4. **P4** - Nepotvrdené prenájmy
5. **P5** - Budúce prenájmy (do 7 dní)
6. **P10** - Ostatné prenájmy

## Farbové kódovanie

- **Červená** - Vysoká priorita (P1-P3)
- **Oranžová** - Stredná priorita (P4-P5)
- **Modrá** - Nízka priorita (P10)
- **Zelená** - Potvrdené/zaplatené
- **Červená** - Nepotvrdené/nezaplatené

## API integrácia

Komponent používa existujúce API služby:
- `apiService.getProtocolsByRental()` - načítanie protokolov
- `apiService.createHandoverProtocol()` - vytvorenie protokolu prevzatia
- `apiService.createReturnProtocol()` - vytvorenie protokolu vrátenia

## Optimalizácie

### Výkon
- **React.memo** - pre komponenty kariet
- **useCallback** - pre event handlery
- **useMemo** - pre filtrované dáta
- **Lazy loading** - protokoly na požiadanie

### UX
- **Loading states** - indikátory načítania
- **Error handling** - graceful error handling
- **Empty states** - informačné správy
- **Keyboard navigation** - podpora klávesnice

## Migrácia z RentalListNew

1. **Import** - zmeňte import v App.tsx
2. **API** - používa rovnaké API
3. **State** - kompatibilný s existujúcim state
4. **Styling** - používa Material-UI theme

## Budúce vylepšenia

- [ ] Drag & drop pre zmeny priority
- [ ] Bulk actions (hromadné operácie)
- [ ] Export do Excel/PDF
- [ ] Real-time notifikácie
- [ ] Offline podpora
- [ ] PWA funkcionality

## Príklady použitia

### Základný príklad
```tsx
<RentalListModern />
```

### S vlastnými filtrami
```tsx
<RentalListModern 
  defaultViewMode="cards"
  defaultSortBy="priority"
  showQuickFilters={true}
/>
```

### Mobilné zobrazenie
```tsx
// Automaticky sa prispôsobí veľkosti obrazovky
// Na mobile sa zobrazí ako karty s floating action button
```

## Troubleshooting

### Problémy s výkonom
- Skontrolujte veľkosť zoznamu prenájmov
- Použite virtuálne zobrazenie pre veľké zoznamy
- Optimalizujte API volania

### Problémy s filtrovaním
- Skontrolujte formát dátumov
- Overte existenciu vozidiel/spoločností
- Skontrolujte search query

### Problémy s protokolmi
- Overte API endpointy
- Skontrolujte autentifikáciu
- Overte formát dát

## Podpora

Pre podporu a otázky kontaktujte vývojový tím alebo vytvorte issue v GitHub repository. 