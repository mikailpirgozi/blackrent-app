# ⚡ BlackRent - Rýchla Diagnostika

> **Riešenie problémov za 30 sekúnd**

## 🚨 Ak niečo nefunguje

```bash
# 1. RÝCHLA DIAGNOSTIKA (10s)
npm run health

# 2. AUTOMATICKÉ RIEŠENIE (20s)
npm run fix

# 3. KOMPLETNÝ REŠTART
npm run dev:restart
```

## 📋 Rýchle príkazy

| Problém | Príkaz | Čas |
|---------|--------|-----|
| 🔍 **Diagnostika** | `npm run health` | 10s |
| 🔧 **Auto-fix** | `npm run fix` | 30s |
| 🧹 **Vyčistiť porty** | `npm run cleanup` | 5s |
| 📊 **Monitoring** | `npm run monitor` | ∞ |
| 🐛 **Debug režim** | `npm run debug` | 60s |
| ⚡ **Menu** | `npm run diagnose` | - |

## 🎯 Najčastejšie problémy

### ❌ Backend nebeží
```bash
npm run fix  # Automatické riešenie
# ALEBO
npm run dev:restart
```

### ❌ Frontend nebeží
```bash
npm run cleanup && npm run dev:restart
```

### ⚰️ Zombie procesy
```bash
npm run cleanup
```

### 🐌 Pomalá aplikácia
```bash
npm run monitor  # Sleduj zdroje
npm run dev:restart  # Reštart ak treba
```

### 🔍 Neznámy problém
```bash
npm run diagnose  # Interaktívne menu
```

## 🚀 Workflow pre efektívnu prácu

### 🌅 **Ráno (štart práce)**
```bash
npm run health     # Skontroluj stav
npm run dev:restart # Čerstvý štart
```

### 💼 **Počas práce**
```bash
# V novom termináli (na pozadí)
npm run monitor
```

### 🔧 **Pri problémoch**
```bash
npm run fix  # Automatické riešenie
```

### 🌙 **Večer (koniec práce)**
```bash
npm run dev:stop  # Ukončenie
```

## 🆘 Emergency (núdzové riešenie)

```bash
# Ak nič nepomáha
sudo pkill -f "node\|npm"
npm run cleanup
npm run dev:restart

# Factory reset (extrémny prípad)
rm -rf node_modules backend/node_modules
npm install && cd backend && npm install && cd ..
npm run dev:restart
```

## 📊 Monitoring & Logy

```bash
# Live monitoring
npm run monitor

# Posledné logy
tail -f logs/backend.log
tail -f logs/frontend.log

# Debug logy
npm run debug  # Spustí s rozšíreným logovaním
tail -f logs/debug/*.log
```

## 💡 Tipy pre rýchlu prácu

1. **Vždy začni s `npm run health`** - diagnostika za 10 sekúnd
2. **Používaj `npm run fix`** - automatické riešenie väčšiny problémov
3. **Maj spustený `npm run monitor`** - vidíš problémy okamžite
4. **Pri väčších zmenách `npm run dev:restart`** - čistý štart
5. **Pre debugging `npm run debug`** - rozšírené logovanie

## 🔗 Užitočné odkazy

- 📖 [Úplná dokumentácia](docs/diagnostics/DIAGNOSTICS-GUIDE.md)
- 🏥 [Health Check](scripts/diagnostics/health-check.sh)
- 🔧 [Auto-Fix](scripts/diagnostics/auto-fix.sh)
- 📊 [Monitoring](scripts/diagnostics/start-monitoring.sh)

---

**💡 Pamätaj:** Väčšinu problémov vyrieši `npm run fix` za 30 sekúnd!
