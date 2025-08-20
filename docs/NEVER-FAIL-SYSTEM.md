# 🚀 BlackRent Never-Fail System
## Kompletný systém pre zabezpečenie 100% dostupnosti aplikácie

### 🎯 Cieľ
Zabezpečiť aby sa BlackRent aplikácia **nikdy** nezasekla a vždy fungovala bez manuálneho zásahu.

---

## 🛠️ Implementované Riešenia

### 1. 🐕 **Watchdog System** ✅
**Súbor:** `scripts/watchdog.sh`  
**Príkaz:** `npm run watchdog`

**Čo robí:**
- Monitoruje backend/frontend každých 30 sekúnd
- Automaticky reštartuje služby po 3 zlyhaniach
- Kontroluje HTTP odpovede aj procesy
- Resetuje počítadlá chýb po úspešnom obnovení

### 2. 📊 **Continuous Health Monitoring** ✅
**Súbor:** `scripts/continuous-monitor.sh`  
**Príkaz:** `npm run dev:monitor`

**Čo robí:**
- Rýchla kontrola každých 15 sekúnd
- Kompletná health kontrola každých 5 minút
- Auto-fix po 2 neúspešných pokusoch
- Maximálne 3 auto-fixy za hodinu (prevencia spamu)
- macOS notifikácie pri problémoch

### 3. 🚀 **Optimalizovaný Startup** ✅
**Súbor:** `scripts/stable-start.sh` (vylepšený)

**Vylepšenia:**
- Pre-warming databázového pripojenia
- Inteligentné čakanie s progressívnymi intervalmi
- Emergency restart mechanizmus
- Viac pamäte pre Node.js (`--max-old-space-size=4096`)
- Viac threadov (`UV_THREADPOOL_SIZE=8`)

### 4. 🛠️ **Auto-Recovery System** ✅
**Súbor:** `scripts/auto-recovery.sh`  
**Príkaz:** `npm run dev:recovery`

**Inteligentné riešenie problémov:**
- `backend_not_running` → Spustí backend
- `frontend_not_running` → Spustí frontend  
- `port_conflict` → Vyčistí porty a reštartuje
- `zombie_processes` → Aggressive cleanup
- `database_connection` → Test DB + restart
- `missing_dependencies` → Reinstall packages

### 5. 🔄 **Process Manager** ✅
**Súbor:** `scripts/process-manager.sh`  
**Príkaz:** `npm run dev:maintain`

**Funkcie:**
- Graceful process shutdown (TERM → KILL)
- Zombie process cleanup
- Memory/CPU monitoring s upozorneniami
- Preventívna údržba (čistenie logov, cache)

### 6. 🚀 **Auto-Startup System** ✅
**Súbor:** `scripts/auto-startup.sh`  
**Príkaz:** `npm run dev:auto`

**Funkcie:**
- Kontrola či už aplikácia beží
- Spustenie aplikácie ak nebeží
- Automatické spustenie watchdog monitoringu
- Uloženie PID súborov pre monitoring

---

## 📋 Nové Príkazy

### Základné príkazy:
```bash
npm run dev:auto      # Automatické spustenie + monitoring
npm run dev:monitor   # Kontinuálne monitorovanie (na pozadí)
npm run dev:recovery  # Automatické riešenie problémov
npm run dev:maintain  # Preventívna údržba
```

### Alias príkazy (po `source ~/.zshrc`):
```bash
br-start     # Spustiť aplikáciu
br-stop      # Zastaviť aplikáciu  
br-health    # Kontrola zdravia
br-status    # Rýchly status
br-fix       # Automatické riešenie
br-logs      # Sledovanie logov
```

---

## 🚀 Inštalácia Auto-Start (VOLITEĽNÉ)

Pre automatické spúšťanie pri štarte systému:

```bash
./scripts/install-autostart.sh
```

**Vytvorí:**
- macOS LaunchAgent pre automatický štart
- Desktop shortcut `~/Desktop/BlackRent.app`
- Shell aliases pre rýchle príkazy

---

## 🔄 Odporúčaný Workflow

### Každodenné použitie:
```bash
npm run dev:auto        # Spustí všetko + monitoring
# Aplikácia teraz beží s automatickým monitorovaním
```

### Pri problémoch:
```bash
npm run health          # Diagnostika
npm run fix            # Automatické riešenie
# alebo
npm run dev:recovery   # Pokročilé riešenie
```

### Preventívna údržba:
```bash
npm run dev:maintain   # Raz týždenne
```

---

## 🛡️ Bezpečnostné Funkcie

### 1. **Rate Limiting**
- Maximálne 3 auto-fixy za hodinu
- Prevencia nekonečných reštart cyklov

### 2. **Graceful Shutdown**
- TERM signal pred KILL
- 30s timeout pre graceful shutdown
- Cleanup PID súborov

### 3. **Resource Monitoring**
- Upozornenia pri vysokom využití pamäte (>80%)
- Upozornenia pri vysokom využití CPU (>90%)
- Automatické čistenie starých logov

### 4. **Error Detection**
- Port konflikty
- Zombie procesy  
- Databázové pripojenie
- Chýbajúce dependencies
- Unresponsive služby

---

## 📊 Monitoring & Logy

### Log súbory:
- `logs/watchdog.log` - Watchdog monitoring
- `logs/continuous-monitor.log` - Kontinuálne monitorovanie  
- `logs/auto-recovery.log` - Automatické riešenia
- `logs/process-manager.log` - Process management
- `logs/backend.log` - Backend aplikácia
- `logs/frontend.log` - Frontend aplikácia

### Sledovanie logov:
```bash
br-logs                    # Všetky logy
tail -f logs/watchdog.log  # Len watchdog
```

---

## 🎉 Výsledok

**BlackRent aplikácia teraz:**
1. ✅ **Nikdy sa nezasekne** - watchdog automaticky rieši problémy
2. ✅ **Spúšťa sa rýchlejšie** - optimalizovaný startup proces  
3. ✅ **Automaticky sa opravuje** - inteligentné error recovery
4. ✅ **Čistí za sebou** - žiadne zombie procesy
5. ✅ **Monitoruje sa sama** - kontinuálne health checking
6. ✅ **Spúšťa sa automaticky** - pri štarte systému (voliteľné)

### 🚨 Ak sa predsa len niečo pokazí:
```bash
br-fix      # Rýchle riešenie
br-health   # Diagnostika  
br-recovery # Pokročilé riešenie
```

**Aplikácia je teraz prakticky neznič iteľná! 🛡️**
