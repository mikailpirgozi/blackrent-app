# BlackRent Customer Website - Server Management

## 🚀 Rýchly štart

```bash
# Spustenie servera (odporúčané)
npm run dev:stable

# Alternatívne spustenie
npm run dev
```

Server bude dostupný na: **http://localhost:3002**

## 📋 Dostupné príkazy

### Základné spúšťanie
```bash
npm run dev                 # Štandardné spustenie Next.js servera
npm run dev:stable          # Stabilné spustenie s automatickými opravami
npm run dev:stable-clean    # Stabilné spustenie s vyčistením cache
```

### Monitoring a diagnostika
```bash
npm run health-check        # Rýchla diagnostika stavu
npm run server-status       # Detailný stav servera
npm run monitor            # Kontinuálne sledovanie servera
```

### Správa servera
```bash
npm run server-restart     # Reštart servera
npm run server-stop        # Ukončenie servera
```

### Build a testovanie
```bash
npm run build              # Produkčný build
npm run build:clean        # Build s vyčistením cache
npm run type-check         # TypeScript kontrola
npm run lint               # ESLint kontrola
```

## 🔧 Riešenie problémov

### Server sa nespúšťa
```bash
# 1. Skontrolujte stav
npm run health-check

# 2. Vyčistite porty a cache
npm run dev:stable-clean

# 3. Ak stále nefunguje, reštartujte
npm run server-restart
```

### Chýbajúce assets (404 chyby)
```bash
# Automaticky sa opravia pri spustení dev:stable
npm run dev:stable
```

### TypeScript chyby
```bash
# Kontrola chýb
npm run type-check

# Lint kontrola
npm run lint
```

## 📊 Monitoring

### Automatické sledovanie
```bash
# Spustí kontinuálne sledovanie servera
npm run monitor
```

Monitoring automaticky:
- ✅ Kontroluje HTTP odpovede každých 30 sekúnd
- ✅ Meria response time
- ✅ Reštartuje server pri 3 zlyhaných pokusoch
- ✅ Loguje všetky aktivity

### Manuálna kontrola
```bash
# Rýchly prehľad
npm run health-check

# Detailný stav
npm run server-status
```

## 🛠️ Technické detaily

### Porty
- **3002** - Customer website (Next.js)
- **3001** - Backend API (ak beží)
- **3000** - Hlavná BlackRent aplikácia (ak beží)

### Kritické súbory
- `package.json` - Dependencies a scripty
- `next.config.js` - Next.js konfigurácia
- `.env.local` - Environment premenné
- `public/figma-assets/` - SVG ikony a obrázky

### Automatické opravy
Stabilný server automaticky:
- ✅ Vyčistí obsadené porty
- ✅ Vytvorí chýbajúce SVG súbory
- ✅ Kontroluje dependencies
- ✅ Opravuje asset loading problémy

## 🚨 Časté problémy

### 1. "Port 3002 is already in use"
```bash
npm run server-stop
npm run dev:stable
```

### 2. "MODULE_NOT_FOUND" chyby
```bash
npm install
npm run dev:stable-clean
```

### 3. "404 Not Found" pre SVG súbory
```bash
npm run dev:stable  # Automaticky vytvorí chýbajúce súbory
```

### 4. Server sa zasekne
```bash
# V novom termináli
npm run server-restart
```

## 📈 Performance

### Optimálne nastavenia
- Response time: < 50ms
- Memory usage: < 200MB
- Build time: < 60s

### Sledovanie výkonu
```bash
npm run monitor  # Zobrazuje response time v reálnom čase
```

## 🔄 Automatizácia

### Pre vývoj
```bash
# Ráno - spustenie s kontrolou
npm run health-check && npm run dev:stable

# Počas práce - monitoring v pozadí
npm run monitor &

# Večer - ukončenie
npm run server-stop
```

### Pre produkciu
```bash
# Test pred deploymentom
npm run build
npm run health-check
```

## 📞 Podpora

Ak máte problémy:
1. Spustite `npm run health-check`
2. Skontrolujte výstup pre chyby
3. Použite `npm run dev:stable-clean` pre kompletný reset
4. Pri pretrvávajúcich problémoch reštartujte terminál

---

**Tip:** Pre najstabilnejšie fungovanie vždy používajte `npm run dev:stable` namiesto `npm run dev`.
