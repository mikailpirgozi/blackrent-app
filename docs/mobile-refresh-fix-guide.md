# 📱 Mobile Refresh Fix Guide

## Problém
Na mobilných zariadeniach sa náhodne refreshovala stránka počas vytvárania protokolov a používateľ sa vraciala na hlavnú stránku. Tento problém sa opakoval niekoľkokrát po sebe a potom prestal.

## Príčiny
1. **Service Worker lifecycle** - aj s vypnutými auto-updatemi
2. **Memory pressure** na mobile zariadeniach  
3. **Browser lifecycle management** (pagehide/pageshow events)
4. **PWA cache invalidation**
5. **Neočakávané navigation events**

## Riešenie

### 1. Mobile Stabilizer (`src/utils/mobileStabilizer.ts`)
Komplexný systém na predchádzanie neočakávaným refreshom:

- **Unload Prevention**: Zabráni refreshu počas kritických operácií
- **Memory Monitoring**: Sleduje využitie pamäte a spúšťa cleanup
- **Visibility Handling**: Spracováva page visibility changes
- **Form Data Persistence**: Auto-save formulárových dát

```typescript
// Globálna inicializácia v App.tsx
initializeMobileStabilizer({
  enablePreventUnload: true,
  enableMemoryMonitoring: true,
  enableVisibilityHandling: true,
  enableFormDataPersistence: true,
  debugMode: process.env.NODE_ENV === 'development'
});
```

### 2. Mobile Recovery Hook (`src/hooks/useMobileRecovery.ts`)
Emergency recovery systém pre prípad neočakávaných refreshov:

- **Automatic Detection**: Detekuje neočakávané refreshy
- **State Recovery**: Obnovuje formulárové dáta
- **Path Tracking**: Sleduje navigáciu používateľa
- **Recovery Notifications**: Informuje používateľa o dostupných recovery možnostiach

```typescript
// Použitie v HandoverProtocolForm
const { recoveryState, clearRecoveryData, restoreFormData, hasRecoveredData } = useMobileRecovery({
  enableAutoRecovery: true,
  debugMode: true
});
```

### 3. Service Worker Optimizations (`public/sw.js`)
Vylepšenia pre lepšie mobile správanie:

- **Immediate Skip Waiting**: Predchádza refresh loops
- **Immediate Client Claiming**: Rýchlejšie prevzatie kontroly
- **Enhanced Mobile Logging**: Lepšie diagnostikovanie problémov

### 4. HandoverProtocolForm Enhancements
Špecifické vylepšenia pre protokoly:

- **Mobile Stabilizer Integration**: Aktivácia počas kritických operácií
- **Recovery Data Handling**: Automatické obnovenie dát
- **Error State Management**: Lepšie spracovanie chýb na mobile

## Implementované Funkcie

### 🛡️ Protection Features
- Prevent unload during form filling
- Memory usage monitoring
- Auto-save form data every 10 seconds
- Page visibility change handling
- Emergency state preservation

### 🚑 Recovery Features  
- Automatic refresh detection
- Form data recovery
- Path restoration
- User notification system
- Recovery timeout handling

### 📱 Mobile Optimizations
- Mobile device detection
- Viewport-based behavior
- Touch device handling
- Memory cleanup triggers
- Service Worker stability

## Debugging

### Enable Debug Mode
```typescript
// V App.tsx alebo komponente
initializeMobileStabilizer({
  debugMode: true
});

// V recovery hook
useMobileRecovery({
  debugMode: true
});
```

### Console Logs
Hľadajte tieto logy v console:
- `📱 MobileStabilizer:` - Stabilizer aktivity
- `🚑 MobileRecovery:` - Recovery operácie  
- `🛡️ Mobile stabilizer activated` - Ochrana aktivovaná
- `🚨 Save error occurred` - Chyby pri ukladaní

### Session Storage Keys
- `mobileStabilizer_state` - Uložený stav
- `mobileStabilizer_unexpectedRefresh` - Marker refreshu
- `mobileRecovery_lastPath` - Posledná známa cesta
- `mobileRecovery_currentState` - Aktuálny stav

## Testing

### Manual Testing
1. Otvorte protokol na mobile
2. Začnite vyplňovať dáta
3. Simulujte refresh (pull-to-refresh)
4. Skontrolujte recovery notification
5. Overte obnovenie dát

### Automated Testing
```bash
# Spustite aplikáciu v debug móde
npm run dev

# Sledujte console logy
# Testujte na rôznych mobile zariadeniach
```

## Monitoring

### Performance Metrics
- Memory usage tracking
- Refresh count monitoring  
- Recovery success rate
- Form completion rate

### Error Tracking
- Unexpected refresh events
- Recovery failures
- Memory pressure warnings
- Service Worker errors

## Best Practices

### For Developers
1. Vždy používajte mobile stabilizer v kritických formulároch
2. Implementujte recovery hook v komplexných komponentoch
3. Testujte na reálnych mobile zariadeniach
4. Monitorujte memory usage v production

### For Users
1. Ak sa stránka refreshne, počkajte na recovery notification
2. Ak sa ponúka obnovenie dát, potvrďte ho
3. Pri opakovaných problémoch restartujte browser
4. Skontrolujte dostupnú pamäť na zariadení

## Troubleshooting

### Ak sa stále vyskytujú refreshy
1. Skontrolujte console logy
2. Overte memory usage
3. Skontrolujte Service Worker stav
4. Reštartujte aplikáciu

### Ak recovery nefunguje
1. Skontrolujte session storage
2. Overte debug logy
3. Skontrolujte timeout nastavenia
4. Vyčistite browser cache

## Configuration

### Mobile Stabilizer Config
```typescript
interface MobileStabilizerConfig {
  enablePreventUnload: boolean;      // Predchádza unload eventom
  enableMemoryMonitoring: boolean;   // Sleduje memory usage
  enableVisibilityHandling: boolean; // Spracováva visibility changes
  enableFormDataPersistence: boolean; // Auto-save formulárov
  debugMode: boolean;                // Debug výstup
}
```

### Recovery Hook Config  
```typescript
interface UseMobileRecoveryOptions {
  enableAutoRecovery: boolean;  // Automatické recovery
  maxRefreshCount: number;      // Max počet refreshov
  recoveryTimeout: number;      // Timeout pre recovery
  debugMode: boolean;          // Debug výstup
}
```

## Záver

Toto riešenie poskytuje komplexnú ochranu pred neočakávanými refreshmi na mobile zariadeniach a automatické recovery mechanizmy. Kombinácia prevencie, detekcie a recovery zabezpečuje, že používatelia nestratia svoju prácu aj v prípade technických problémov.

Riešenie je navrhnuté tak, aby bolo:
- **Neobmedzujúce**: Nezasahuje do normálnej funkcionalite
- **Transparentné**: Funguje na pozadí bez rušenia UX
- **Robustné**: Zvláda rôzne scenáre a edge cases
- **Diagnostikovateľné**: Poskytuje detailné logy pre debugging

Pre ďalšie otázky alebo problémy, skontrolujte debug logy alebo kontaktujte vývojový tím.
