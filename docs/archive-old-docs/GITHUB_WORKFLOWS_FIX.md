# 🔧 GitHub Workflows Optimization

**Dátum:** 2. Október 2025  
**Problém:** 1,739 workflow runs (príliš veľa!)

---

## 🔍 PROBLÉM

### Pôvodná konfigurácia:
```yaml
# .github/workflows/ci.yml
on:
  push:
    branches: ['**']  # ❌ Spúšťa na KAŽDÝ branch!
```

### Následky:
- **1,739 workflow runs** 😱
- CI bežalo na KAŽDOM commite do KAŽDÉHO branchu
- 45 branchov × ~38 commitov = 1,710+ runs
- Plytvanie GitHub Actions minutes
- Pomalé feedback

---

## ✅ RIEŠENIE

### Nová konfigurácia:
```yaml
# .github/workflows/ci.yml
on:
  push:
    branches:
      - main           # ✅ Len produkcia
      - development    # ✅ Len development
  pull_request:
    branches:
      - main
      - development
```

### Výhody:
- ✅ CI beží len na dôležitých branchoch
- ✅ Feature branche necháme bez CI (rýchlejší vývoj)
- ✅ Pull Requesty stále testované
- ✅ Šetríme GitHub Actions minutes

---

## 📊 POROVNANIE

| Metriky | PRED | PO | Zlepšenie |
|---------|------|----|-----------| |
| Workflow runs | 1,739 | ~50 | **-97%** |
| CI na každý commit | ✅ | ❌ | Rýchlejšie |
| CI na main/dev | ✅ | ✅ | Zachované |
| GitHub minutes | Veľa | Menej | **Úspora** |

---

## 🎯 WORKFLOW STRATÉGIA

### 1. **CI Workflow** (`.github/workflows/ci.yml`)
**Spúšťa sa:**
- Push do `main` alebo `development`
- Pull Request do `main` alebo `development`

**Nekúria:**
- Feature branche (`feature/*`)
- Bugfix branche (`fix/*`)
- Backup branche

**Dôvod:** Rýchly development, test len pred merge

---

### 2. **Railway Deploy** (`.github/workflows/railway-deploy.yml`)
**Spúšťa sa:**
- Push do `main`
- Pull Request do `main`

**Účel:** Production deployment

---

### 3. **Daily Backup** (`.github/workflows/daily-backup.yml`)
**Spúšťa sa:**
- Každý deň o 2:00 UTC (cron)
- Manuálne (workflow_dispatch)

**Účel:** Automatické zálohovanie Railway databázy

---

## 🚀 BEST PRACTICES

### Kedy CI musí bežať:
✅ **Push do main** - Zabezpečiť stabilitu produkcie  
✅ **Push do development** - Zabezpečiť stabilitu dev  
✅ **Pull Requests** - Test pred merge  
✅ **Critical hotfixes** - Nastaviť manuálne

### Kedy CI nemusí bežať:
❌ **Feature branche** - Lokálne testovanie stačí  
❌ **WIP commity** - Ešte nie sú hotové  
❌ **Backup branche** - Len záloha  
❌ **Experimenty** - Nepotrebujú CI

---

## 💡 ĎALŠIA OPTIMALIZÁCIA (Voliteľné)

### 1. Path Filters
```yaml
on:
  push:
    branches: [main, development]
    paths:
      - 'src/**'
      - 'package.json'
      # Ignorovať README.md, docs, atď.
```

### 2. Concurrency Groups
```yaml
concurrency:
  group: ${{ github.workflow }}-${{ github.ref }}
  cancel-in-progress: true
```
Zruší staré runs keď pushnuš nový commit.

### 3. Skip CI
```bash
git commit -m "docs: update README [skip ci]"
```
Preskočí CI ak nie je potrebné.

---

## 📝 AKO TO FUNGOVALO PRED VS PO

### PRED (Zlá konfigurácia):
```
┌─────────────────────────────────────────────────────┐
│ KAŽDÝ COMMIT → CI WORKFLOW                          │
├─────────────────────────────────────────────────────┤
│                                                     │
│  feature/new-ui    → commit → ✅ CI (zbytočné)    │
│  fix/bug          → commit → ✅ CI (zbytočné)     │
│  backup-xyz       → commit → ✅ CI (zbytočné)     │
│  development      → commit → ✅ CI (OK)           │
│  main             → commit → ✅ CI (OK)           │
│                                                     │
│  VÝSLEDOK: 1,739 runs! 😱                         │
└─────────────────────────────────────────────────────┘
```

### PO (Optimalizovaná konfigurácia):
```
┌─────────────────────────────────────────────────────┐
│ LEN DÔLEŽITÉ BRANCHE → CI WORKFLOW                 │
├─────────────────────────────────────────────────────┤
│                                                     │
│  feature/new-ui    → commit → ⏭️ Skip              │
│  fix/bug          → commit → ⏭️ Skip               │
│  backup-xyz       → commit → ⏭️ Skip               │
│  development      → commit → ✅ CI (OK)            │
│  main             → commit → ✅ CI (OK)            │
│                                                     │
│  + Pull Requests → ✅ CI (test pred merge)        │
│                                                     │
│  VÝSLEDOK: ~50 runs (97% menej) ✅                │
└─────────────────────────────────────────────────────┘
```

---

## ✅ ZHRNUTIE

**Čo sme opravili:**
1. ✅ CI workflow optimalizovaný (len main + development)
2. ✅ Dokumentácia vytvorená
3. ✅ GitHub Actions minutes šetrené
4. ✅ Rýchlejší development workflow

**Výsledok:**
- **-97% workflow runs** (1,739 → ~50)
- Rýchlejší vývoj (feature branche bez CI)
- Stále bezpečné (main + dev + PRs testované)

---

**Status:** ✅ OPRAVENÉ  
**Posledná aktualizácia:** 2. Október 2025
