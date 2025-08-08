# 🏥 BlackRent Diagnostics System

Komplexný systém pre diagnostiku a riešenie problémov v BlackRent aplikácii.

## 🚀 Rýchly štart

```bash
# Hlavné diagnostické menu
./diagnose.sh

# Alebo priamo konkrétny nástroj
./scripts/diagnostics/health-check.sh    # Úplná diagnostika
./scripts/diagnostics/auto-fix.sh        # Automatické riešenie
./scripts/diagnostics/cleanup-ports.sh   # Vyčistenie portov
./scripts/diagnostics/start-monitoring.sh # Live monitoring
```

## 📊 Dostupné nástroje

### 1. 🔍 Health Check (`health-check.sh`)
Komplexná diagnostika aplikácie:
- ✅ Kontrola portov (3000, 3001)
- ✅ Kontrola procesov (Node.js, NPM)
- ✅ Detekcia zombie procesov
- ✅ Monitoring systémových zdrojov (CPU, RAM)
- ✅ Test databázového pripojenia
- ✅ Analýza chýb v logoch
- ✅ Automatické odporúčania

### 2. 🔧 Auto-Fix (`auto-fix.sh`)
Automatické riešenie najčastejších problémov:
- 🧹 Čistenie zombie procesov
- 🗑️ Odstránenie starých PID súborov
- 📦 Inštalácia chýbajúcích závislostí
- 🚀 Automatické spustenie služieb
- ✅ Verifikácia opráv

### 3. 🧹 Port Cleanup (`cleanup-ports.sh`)
Vyčistenie portov a procesov:
- 🔌 Uvoľnenie portov 3000 a 3001
- ⚰️ Odstránenie zombie procesov
- 🗑️ Vyčistenie PID súborov
- ✅ Verifikácia stavu

### 4. 📊 Live Monitoring (`start-monitoring.sh`)
Real-time monitoring aplikácie:
- 🔄 Kontinuálny monitoring každých 5 sekúnd
- 📊 Sledovanie portov, API, zdrojov
- 🚨 Automatické upozornenia
- 📝 Logovanie do súboru

## 🚨 Najčastejšie problémy a riešenia

### Backend nebeží
```bash
# Diagnostika
./scripts/diagnostics/health-check.sh

# Automatické riešenie
./scripts/diagnostics/auto-fix.sh

# Manuálne riešenie
npm run dev:stop
./scripts/diagnostics/cleanup-ports.sh
npm run dev:restart
```

### Frontend nebeží
```bash
# Skontroluj port 3000
lsof -i :3000

# Vyčisti a reštartuj
./scripts/diagnostics/cleanup-ports.sh
npm run dev:restart
```

### Zombie procesy
```bash
# Automatické čistenie
./scripts/diagnostics/cleanup-ports.sh

# Manuálne čistenie
ps aux | grep node
kill -9 [PID]
```

### Vysoké využitie zdrojov
```bash
# Monitoring
./scripts/diagnostics/start-monitoring.sh

# Reštart pri vysokom využití
npm run dev:restart
```

### API nereaguje
```bash
# Test API
curl http://localhost:3001/api/test-simple

# Diagnostika a riešenie
./scripts/diagnostics/auto-fix.sh
```

## 📁 Štruktúra logov

```
logs/
├── backend.log          # Backend aplikačné logy
├── frontend.log         # Frontend build a runtime logy
├── diagnostics.log      # Diagnostické záznamy
├── monitoring.log       # Live monitoring záznamy
└── *.pid               # Process ID súbory
```

## 🔧 Konfigurácia

### Porty
- **Frontend**: 3000
- **Backend**: 3001

### Log súbory
- **Backend**: `logs/backend.log`
- **Frontend**: `logs/frontend.log`
- **Diagnostics**: `logs/diagnostics.log`

### Monitoring intervaly
- **Health check**: Na vyžiadanie
- **Live monitoring**: 5 sekúnd
- **Auto-cleanup**: Pri detekovaní problémov

## 💡 Tipy pre efektívnu prácu

### 1. Preventívne kontroly
```bash
# Pred začiatkom práce
./scripts/diagnostics/health-check.sh
```

### 2. Kontinuálny monitoring
```bash
# Počas vývoja (v novom termináli)
./scripts/diagnostics/start-monitoring.sh
```

### 3. Rýchle riešenie problémov
```bash
# Pri akýchkoľvek problémoch
./scripts/diagnostics/auto-fix.sh
```

### 4. Čistý štart
```bash
# Pre čistý štart bez starých procesov
./scripts/diagnostics/cleanup-ports.sh
npm run dev:restart
```

## 🚀 Integrácia s workflow

### Pred commiteom
```bash
# Uisti sa, že všetko funguje
./scripts/diagnostics/health-check.sh
npm run build  # Frontend
cd backend && npm run build  # Backend
```

### Pri problémoch s deploymentom
```bash
# Diagnostika lokálne
./scripts/diagnostics/health-check.sh

# Auto-fix lokálnych problémov
./scripts/diagnostics/auto-fix.sh
```

### Denný workflow
1. **Ráno**: `./scripts/diagnostics/health-check.sh`
2. **Počas práce**: `./scripts/diagnostics/start-monitoring.sh` (v pozadí)
3. **Pri problémoch**: `./scripts/diagnostics/auto-fix.sh`
4. **Pred ukončením**: `npm run dev:stop`

## 🆘 Emergency commands

```bash
# Núdzové ukončenie všetkého
sudo pkill -f "node\|npm"
sudo lsof -ti:3000,3001 | xargs sudo kill -9

# Núdzový reštart
./scripts/diagnostics/cleanup-ports.sh
sleep 5
npm run dev:restart

# Factory reset (opatrne!)
npm run dev:stop
rm -rf node_modules backend/node_modules
npm install && cd backend && npm install && cd ..
npm run dev:restart
```

## 📞 Podpora

Pre technickú podporu alebo problémy s diagnostickým systémom:
1. Skontrolujte logy v `logs/diagnostics.log`
2. Spustite `./scripts/diagnostics/health-check.sh`
3. Priložte výstup diagnostiky k reportu problému
