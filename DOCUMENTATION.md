# 📚 BlackRent Documentation

> **Verzia:** 2.0 | **Posledná aktualizácia:** 2025-01-09

---

## 🏗️ Monorepo Dokumentácia

BlackRent používa **monorepo** s oddelenými docs:

### 📱 Project-Specific Docs
- **[Web App](./apps/web/docs/)** - Interná aplikácia pre zamestnancov
- **[Mobile App](./apps/mobile/docs/)** - React Native mobilná app
- **[Customer Website](./customer-website/docs/)** - Verejná stránka
- **[Backend](./backend/docs/)** - API dokumentácia

### 🌐 Shared/Global Docs
**[Hlavná Dokumentácia](./docs/README.md)** - Architecture, Deployment, Database, Features

---

## 🚀 Quick Start

### Nový Vývojár?
1. **[Getting Started](./docs/01-getting-started/README.md)** - Začni tu
2. Vyber si projekt:
   - Web? → [apps/web/docs/](./apps/web/docs/)
   - Mobile? → [apps/mobile/docs/](./apps/mobile/docs/)
   - Backend? → [backend/docs/](./backend/docs/)

---

## 📂 Dokumentačná Štruktúra

Všetka dokumentácia je organizovaná v **14 logických kategóriách**:

### 🎯 Pre Vývojárov
- **[01 - Getting Started](./docs/01-getting-started/)** - Quick start, setup, deployment základy
- **[02 - Architecture](./docs/architecture/)** - System architecture a design
- **[03 - Features](./docs/features/)** - Feature dokumentácia
- **[09 - Refactoring](./docs/09-refactoring/)** - Refactoring guides

### 📋 Pre Implementáciu
- **[04 - Implementation Plans](./docs/04-implementation-plans/)** - Migrácie, plány, analýzy
- **[07 - Testing](./docs/07-testing/)** - Testing guides a inštrukcie
- **[10 - Performance](./docs/performance/)** - Performance optimalizácie

### 🚀 Pre Deployment
- **[05 - Deployment](./docs/deployment/)** - Deployment príručky
- **[06 - Database](./docs/database/)** - Database dokumentácia

### 🔧 Pre Maintenance
- **[08 - Fixes & Bugs](./docs/08-fixes-and-bugs/)** - Bug fixes a opravy
- **[Diagnostics](./docs/diagnostics/)** - Diagnostické nástroje

### 🔐 Špecializované Systémy
- **[11 - Security](./docs/security/)** - Security dokumentácia
- **[12 - Email System](./docs/12-email-system/)** - Email systém
- **[13 - Protocols](./docs/13-protocols/)** - Protocol V1/V2
- **[14 - Platforms](./docs/14-platforms/)** - Platform management

### 📖 Ostatné
- **[Setup Guides](./docs/setup/)** - Setup a konfigurácie
- **[Playbooks](./docs/playbooks/)** - Systematické playbooks
- **[Archive](./docs/archive/)** - Staré dokumenty

---

## ⚡ Najpoužívanejšie Dokumenty

### Quick Start & Setup
- [Quick Start Guide](./docs/01-getting-started/QUICK-START.md)
- [Project Setup](./docs/01-getting-started/PROJECT_SETUP_GUIDE.md)
- [Development Workflow](./docs/setup/DEVELOPMENT-WORKFLOW.md)

### Deployment
- [Deployment Guide](./docs/deployment/DEPLOYMENT-GUIDE.md)
- [Railway Deploy](./docs/deployment/RAILWAY-DEPLOY.md)
- [Production Checklist](./docs/deployment/PRODUCTION_DEPLOYMENT_CHECKLIST.md)

### Debugging & Fixes
- [Diagnostics Guide](./docs/diagnostics/DIAGNOSTICS-GUIDE.md)
- [Database Access](./docs/database/database-access-guide.md)
- [Recent Fixes](./docs/08-fixes-and-bugs/)

### Features
- [Protocol V2 Guide](./docs/13-protocols/README.md)
- [Email System](./docs/12-email-system/README.md)
- [Platform Management](./docs/14-platforms/README.md)

---

## 🔍 Ako Nájsť Dokumenty?

### 1. Použij Hlavný Index
**[docs/README.md](./docs/README.md)** obsahuje kompletný zoznam všetkých dokumentov s popismi.

### 2. Prejdi do Kategórie
Každá kategória má vlastný README s detailným zoznamom dokumentov.

### 3. Použij Search
```bash
# Hľadaj v dokumentácii
grep -r "hľadaný_text" docs/

# Nájdi dokument podľa názvu
find docs/ -name "*nazov*.md"
```

---

## 🛠️ Užitočné Príkazy

### Development
```bash
npm run dev:start      # Spustiť aplikáciu
npm run dev:stop       # Zastaviť aplikáciu
npm run dev:restart    # Reštartovať aplikáciu
```

### Testing
```bash
npm run test           # Spustiť testy
npm run test:ui        # Test UI
```

### Diagnostics
```bash
npm run health         # Health check
npm run fix            # Auto-fix problémov
npm run diagnose       # Interaktívna diagnostika
```

### Build
```bash
npm run build          # Build frontend
cd backend && npm run build  # Build backend
```

---

## 📊 Dokumentačná Štatistika

- **Celkový počet dokumentov:** 150+
- **Kategórií:** 14
- **README indexov:** 5
- **Organizovanosť:** ✅ 100%

---

## 🆘 Potrebuješ Pomoc?

### Pri Vývoji
1. [Quick Start](./docs/01-getting-started/QUICK-START.md)
2. [Architecture Overview](./docs/architecture/ARCHITECTURE.md)
3. [Features Guide](./docs/features/)

### Pri Deployment
1. [Deployment Guide](./docs/deployment/DEPLOYMENT-GUIDE.md)
2. [Production Checklist](./docs/deployment/PRODUCTION_DEPLOYMENT_CHECKLIST.md)

### Pri Problémoch
1. [Diagnostics Guide](./docs/diagnostics/DIAGNOSTICS-GUIDE.md)
2. Spusti: `npm run diagnose`
3. [Fixes & Bugs](./docs/08-fixes-and-bugs/)

---

## 📝 Prispievanie k Dokumentácii

### Pridanie Nového Dokumentu

1. **Vyber správnu kategóriu** podľa účelu dokumentu
2. **Vytvor dokument** v príslušnom priečinku
3. **Aktualizuj README** v danej kategórii
4. **Pridaj link** do hlavného indexu ak je to dôležitý dokument

### Pravidlá Pre Dokumenty

- ✅ Používaj jasné, opisné názvy
- ✅ Začni s prehľadom a cieľom
- ✅ Používaj markdown formátovanie
- ✅ Pridaj príklady kódu kde je to relevantné
- ✅ Aktualizuj dátum poslednej zmeny

---

## 🔗 Externé Odkazy

- [BlackRent Production](https://blackrent.sk)
- [Railway Dashboard](https://railway.app)
- [Cloudflare R2](https://dash.cloudflare.com)

---

## 📞 Kontakt

Pre otázky k dokumentácii alebo návrhy na zlepšenia:
- Vytvor issue v GitHub repository
- Alebo kontaktuj project maintainera

---

**Tip:** Začni vždy s [docs/README.md](./docs/README.md) - je to tvoj hlavný navigačný bod! 🧭

