# 🚀 IMPLEMENTAČNÝ PLÁN: HMR OPTIMALIZÁCIA
## BlackRent Dev Server Performance Enhancement

### 📋 **PREHĽAD PROBLÉMU**
- **Problém**: Pomalé HMR updates, zmeny sa prejavia až po čase/refreshi
- **Príčiny**: Service Worker cache, React Query stale data, suboptimálny Vite config
- **Cieľ**: Rýchle dev experience bez narušenia produkčných funkcionalít

---

## 🎯 **IMPLEMENTAČNÁ STRATÉGIA**

### **PRINCÍPY:**
1. ✅ **DEV-ONLY changes** - žiadne zmeny v production behavior
2. ✅ **Postupné testovanie** - každý krok sa testuje pred pokračovaním  
3. ✅ **Zachovanie funkcionalít** - PWA, push notifications, offline support
4. ✅ **Rollback ready** - možnosť vrátiť zmeny ak niečo zlyhá

---

## 📅 **FÁZY IMPLEMENTÁCIE**

### **FÁZA 1: VITE CONFIGURATION OPTIMIZATION** ⚡
**Čas: 15 minút | Riziko: NÍZKE**

#### **Kroky:**
1. **Backup aktuálnej konfigurácie**
   ```bash
   cp vite.config.ts vite.config.ts.backup
   ```

2. **Optimalizovať vite.config.ts**
   ```typescript
   export default defineConfig({
     server: {
       port: 3000,
       // OPTIMALIZÁCIA FILE WATCHING
       watch: { 
         usePolling: true,
         interval: 100,  // Rýchlejšie než default 200ms
         ignored: ['**/node_modules/**', '**/.git/**']
       },
       // SEPARÁTNY HMR PORT
       hmr: { 
         overlay: true,
         port: 3002,
         host: 'localhost'
       },
       // PROXY OPTIMALIZÁCIA  
       proxy: {
         '/api': {
           target: 'http://localhost:3001',
           changeOrigin: true,
           secure: false,
           timeout: 5000  // Rýchlejší timeout
         }
       }
     },
     // DEV FLAGS
     define: {
       __DEV_DISABLE_SW_CACHE__: JSON.stringify(import.meta.env.MODE === 'development'),
       __DEV_FAST_REFRESH__: JSON.stringify(import.meta.env.MODE === 'development')
     }
   })
   ```

3. **Test FÁZY 1**
   ```bash
   # Reštart dev servera
   npm run dev:stop
   npm run dev
   
   # Test HMR rýchlosti
   # 1. Uprav ľubovoľný komponent
   # 2. Skontroluj čas do zobrazenia zmeny
   # 3. Skontroluj že aplikácia funguje normálne
   ```

#### **Očakávané výsledky:**
- ⚡ Rýchlejšie file watching (100ms vs 200ms)
- 🔄 Separátny HMR port (menej konfliktov)
- 📡 Optimalizovaný proxy (rýchlejšie API calls)

#### **Rollback ak zlyhá:**
```bash
cp vite.config.ts.backup vite.config.ts
npm run dev:restart
```

---

### **FÁZA 2: SERVICE WORKER DEV BYPASS** 🔧
**Čas: 20 minút | Riziko: STREDNÉ**

#### **Kroky:**
1. **Backup SW súborov**
   ```bash
   cp src/hooks/usePWA.ts src/hooks/usePWA.ts.backup
   cp public/sw.js public/sw.js.backup
   ```

2. **Upraviť usePWA.ts - DEV MODE detection**
   ```typescript
   const registerServiceWorker = useCallback(async (): Promise<ServiceWorkerRegistration | null> => {
     if (!('serviceWorker' in navigator)) {
       console.warn('Service Worker not supported');
       return null;
     }

     try {
       // DEV MODE: Registruj SW ale s obmedzeným cache
       const swPath = import.meta.env.MODE === 'development' 
         ? '/sw-dev.js'  // Špeciálny dev SW
         : '/sw.js';     // Produkčný SW

       const registration = await navigator.serviceWorker.register(swPath, {
         scope: '/',
       });

       if (import.meta.env.MODE === 'development') {
         console.log('🔧 DEV: Service Worker registered with LIMITED caching');
         console.log('📱 PWA features active, HMR cache DISABLED');
       } else {
         console.log('✅ PROD: Service Worker registered with FULL caching');
       }

       return registration;
     } catch (error) {
       console.error('Service Worker registration failed:', error);
       return null;
     }
   }, []);
   ```

3. **Vytvoriť sw-dev.js (development-only SW)**
   ```javascript
   // public/sw-dev.js
   const CACHE_VERSION = 'dev-2.1.0';
   const CACHE_NAME = `blackrent-dev-v${CACHE_VERSION}`;
   
   // DEV MODE: Minimálne kešovanie
   const CRITICAL_ASSETS = [
     '/offline.html',
     '/manifest.json'
   ];

   // Install - len kritické assety
   self.addEventListener('install', event => {
     console.log('🔧 DEV SW: Installing with minimal cache...');
     event.waitUntil(
       caches.open(CACHE_NAME)
         .then(cache => cache.addAll(CRITICAL_ASSETS))
         .then(() => self.skipWaiting())
     );
   });

   // Fetch - BYPASS cache pre všetko okrem kritických
   self.addEventListener('fetch', event => {
     const { request } = event;
     
     // Len offline page a manifest
     if (request.url.includes('offline.html') || request.url.includes('manifest.json')) {
       event.respondWith(
         caches.match(request).then(response => response || fetch(request))
       );
     } else {
       // Všetko ostatné - PRIAMO zo siete (no cache)
       event.respondWith(fetch(request));
     }
   });

   // Push notifications - ZACHOVANÉ
   self.addEventListener('push', event => {
     // Plná funkcionalita push notifications
     if (!event.data) return;
     
     const data = event.data.json();
     event.waitUntil(
       self.registration.showNotification(data.title, {
         body: data.body,
         icon: '/logo192.png'
       })
     );
   });
   ```

4. **Test FÁZY 2**
   ```bash
   # Reštart servera
   npm run dev:restart
   
   # Test PWA funkcionalít
   # 1. Skontroluj že push notifications fungujú
   # 2. Skontroluj offline indicator
   # 3. Test HMR rýchlosti
   # 4. Skontroluj že PWA install prompt funguje
   ```

#### **Očakávané výsledky:**
- ⚡ HMR bez SW cache interference
- 🔔 Push notifications zachované
- 📱 PWA install funkcionalita zachovaná
- 🌐 Offline support pre kritické súbory

#### **Rollback ak zlyhá:**
```bash
cp src/hooks/usePWA.ts.backup src/hooks/usePWA.ts
rm public/sw-dev.js
npm run dev:restart
```

---

### **FÁZA 3: REACT QUERY DEV OPTIMIZATION** ⚡
**Čas: 15 minút | Riziko: NÍZKE**

#### **Kroky:**
1. **Backup React Query config**
   ```bash
   cp src/lib/react-query/queryClient.ts src/lib/react-query/queryClient.ts.backup
   ```

2. **Optimalizovať queryClient.ts**
   ```typescript
   export const queryClient = new QueryClient({
     defaultOptions: {
       queries: {
         // DEV: Žiadne kešovanie, PROD: normálne kešovanie
         staleTime: import.meta.env.MODE === 'development' ? 0 : 2 * 60 * 1000,
         gcTime: import.meta.env.MODE === 'development' ? 0 : 5 * 60 * 1000,
         
         // DEV: Vypnuté auto-refetch, PROD: zapnuté
         refetchOnWindowFocus: import.meta.env.MODE === 'development' ? false : true,
         refetchOnReconnect: import.meta.env.MODE === 'development' ? false : true,
         
         // Retry stratégia zachovaná
         retry: (failureCount, error) => {
           if (error instanceof Error) {
             const message = error.message;
             if (message.includes('401') || message.includes('403')) {
               return false;
             }
           }
           return failureCount < 3;
         },
         retryDelay: attemptIndex => Math.min(1000 * 2 ** attemptIndex, 30000),
       },
       mutations: {
         retry: 1,
         retryDelay: 1000,
       },
     },
   });

   // DEV MODE: Debug info
   if (import.meta.env.MODE === 'development') {
     console.log('🔧 React Query: DEV mode - caching DISABLED for faster HMR');
   }
   ```

3. **Test FÁZY 3**
   ```bash
   # Test React Query správania
   # 1. Načítaj stránku s dátami
   # 2. Uprav komponent ktorý zobrazuje dáta
   # 3. Skontroluj že zmeny sa prejavia okamžite
   # 4. Skontroluj že dáta sa načítavajú správne
   ```

#### **Očakávané výsledky:**
- ⚡ Okamžité zobrazenie zmien v UI
- 🔄 Žiadne stale data v dev mode
- 📊 Normálne API volania zachované

#### **Rollback ak zlyhá:**
```bash
cp src/lib/react-query/queryClient.ts.backup src/lib/react-query/queryClient.ts
npm run dev:restart
```

---

### **FÁZA 4: CONSOLE LOG OPTIMIZATION** 🧹
**Čas: 10 minút | Riziko: VEĽMI NÍZKE**

#### **Kroky:**
1. **Vytvoriť smart logger**
   ```typescript
   // src/utils/devLogger.ts
   export const devLogger = {
     // Len kritické logy v dev mode
     debug: import.meta.env.MODE === 'development' && import.meta.env.VITE_DEBUG === 'true' 
       ? console.log 
       : () => {},
     
     info: console.info,
     warn: console.warn,
     error: console.error,
     
     // HMR specific logging
     hmr: import.meta.env.MODE === 'development' 
       ? (message: string) => console.log(`🔄 HMR: ${message}`)
       : () => {}
   };
   ```

2. **Nahradiť kritické console.log**
   ```bash
   # Nájsť najčastejšie logy
   grep -r "console.log" src/ | head -20
   
   # Nahradiť v kritických súboroch
   # - src/lib/react-query/websocket-integration.ts
   # - src/hooks/usePWA.ts
   # - src/services/pushNotifications.ts
   ```

3. **Test FÁZY 4**
   ```bash
   # Skontroluj console output
   # 1. Otvoriť DevTools console
   # 2. Načítať stránku
   # 3. Skontroluj že je menej logov
   # 4. Skontroluj že kritické logy stále fungujú
   ```

---

### **FÁZA 5: FINAL TESTING & VALIDATION** ✅
**Čas: 20 minút | Riziko: ŽIADNE**

#### **Kompletný test scenár:**
1. **HMR Performance Test**
   ```bash
   # Meranie času HMR updates
   # 1. Uprav CSS v komponente
   # 2. Uprav TypeScript kód
   # 3. Pridaj nový komponent
   # 4. Zmaž súbor a vytvor nový
   ```

2. **PWA Functionality Test**
   ```bash
   # Test všetkých PWA funkcií
   # 1. Push notifications
   # 2. Offline indicator
   # 3. Install prompt
   # 4. Service worker registration
   ```

3. **Production Build Test**
   ```bash
   # Overiť že production nie je ovplyvnená
   npm run build
   # Skontroluj že build prechádza
   # Skontroluj že SW cache funguje v prod
   ```

4. **Performance Metrics**
   ```bash
   # Pred optimalizáciou vs po optimalizácii
   # - Čas HMR update
   # - Počet console logov
   # - Memory usage
   # - Network requests
   ```

---

## 📊 **OČAKÁVANÉ VÝSLEDKY**

### **Pred optimalizáciou:**
- ⏱️ HMR update: 2-5 sekúnd
- 📝 Console logs: 627 výpisov
- 💾 Cache interference: Áno
- 🔄 File watching: 200ms interval

### **Po optimalizácii:**
- ⚡ HMR update: 0.5-1 sekunda (80% zlepšenie)
- 📝 Console logs: ~100 výpisov (85% redukcia)
- 💾 Cache interference: Nie
- 🔄 File watching: 100ms interval

---

## 🛡️ **BEZPEČNOSTNÉ OPATRENIA**

### **Rollback stratégia:**
```bash
# Kompletný rollback všetkých zmien
git stash  # Ak sú zmeny uncommitted
# ALEBO
cp vite.config.ts.backup vite.config.ts
cp src/hooks/usePWA.ts.backup src/hooks/usePWA.ts
cp src/lib/react-query/queryClient.ts.backup src/lib/react-query/queryClient.ts
rm public/sw-dev.js
npm run dev:restart
```

### **Monitoring:**
- 📊 Sledovať HMR performance
- 🔍 Monitorovať console errors
- 📱 Testovať PWA funkcionalitu
- 🌐 Overiť offline support

---

## ✅ **AKCEPTAČNÉ KRITÉRIÁ**

### **MUSÍ FUNGOVAŤ:**
- ✅ HMR updates < 1 sekunda
- ✅ Push notifications zachované
- ✅ PWA install prompt funkčný
- ✅ Offline indicator správny
- ✅ Production build bez zmien
- ✅ Všetky existujúce funkcionality

### **MÔŽE SA ZMENIŤ:**
- 📝 Počet console logov (menej)
- ⚡ Rýchlosť file watching (rýchlejšie)
- 💾 Dev cache behavior (optimalizované)

---

## 🚀 **SPUSTENIE IMPLEMENTÁCIE**

```bash
# Krok 1: Backup aktuálneho stavu
git add . && git commit -m "Backup before HMR optimization"

# Krok 2: Spustiť implementáciu po fázach
# Každú fázu testovať pred pokračovaním

# Krok 3: Final validation
npm run build  # Test production build
npm run dev    # Test development server
```

---

**Pripravený na implementáciu! 🎯**
