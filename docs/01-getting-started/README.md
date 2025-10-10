# 🚀 Getting Started

Vitajte v BlackRent projekte! Táto sekcia obsahuje všetko potrebné pre rýchly štart.

## 📋 Obsah

### Quick Start Guides
- **[QUICK-START.md](./QUICK-START.md)** - Najrýchlejší spôsob ako začať
- **[QUICK_START_GUIDE.md](./QUICK_START_GUIDE.md)** - Detailný quick start
- **[PROJECT_SETUP_GUIDE.md](./PROJECT_SETUP_GUIDE.md)** - Kompletný project setup

### Workspace & Deployment
- **[WORKSPACE-GUIDE.md](./WORKSPACE-GUIDE.md)** - Práca s workspace
- **[DEPLOYMENT_GUIDE.md](./DEPLOYMENT_GUIDE.md)** - Deployment príručka
- **[FINAL_DEPLOYMENT_AND_TESTING.md](./FINAL_DEPLOYMENT_AND_TESTING.md)** - Finálny deployment

### Auth & Permissions
- **[COMPLETE_AUTH_FINAL.md](./COMPLETE_AUTH_FINAL.md)** - Kompletná auth dokumentácia
- **[PERMISSION_UI_GUIDE.md](./PERMISSION_UI_GUIDE.md)** - Permission systém UI

### Implementation
- **[UI_IMPLEMENTATION_COMPLETE.md](./UI_IMPLEMENTATION_COMPLETE.md)** - UI implementácia
- **[FINAL_SUMMARY.md](./FINAL_SUMMARY.md)** - Finálne zhrnutie

---

## 🎯 Prvé Kroky

### 1. Základný Setup
```bash
# Clone repository
git clone <repository-url>
cd blackrent

# Install dependencies
pnpm install

# Setup environment
cp .env.example .env
# Vyplň .env premenné
```

### 2. Spustenie Aplikácie
```bash
# Development mode
npm run dev:start

# Ak máš problémy
npm run dev:stop
npm run dev:restart
```

### 3. Prvá Kontrola
```bash
# Health check
npm run health

# Diagnostics
npm run diagnose
```

---

## 🔑 Potrebné Prístupy

Pre plnú funkcionalitu potrebuješ:

1. **Railway Database** - Production PostgreSQL
2. **Cloudflare R2** - File storage
3. **Email Credentials** - Pre email funkcionalitu
4. **GitHub Access** - Pre deployment

Viac info v [Setup Guides](../setup/)

---

## 📚 Ďalšie Kroky

Po základnom setup odporúčame:

1. Prečítaj [Architecture Overview](../architecture/overview.md)
2. Pozri [Development Workflow](../setup/DEVELOPMENT-WORKFLOW.md)
3. Skontroluj [Features](../features/) ktoré chceš používať

---

## ⚠️ Časté Problémy

### Port už používaný
```bash
npm run dev:stop
npm run dev:start
```

### Database connection failed
- Skontroluj Railway credentials v `.env`
- Overeň že Railway database beží

### Build errors
```bash
npm run fix
npm run build
```

---

## 🆘 Potrebuješ Pomoc?

1. Skontroluj [Diagnostics Guide](../diagnostics/DIAGNOSTICS-GUIDE.md)
2. Spusti `npm run diagnose`
3. Pozri [Fixes & Bugs](../08-fixes-and-bugs/)

---

**Tip:** Odporúčame začať s [QUICK-START.md](./QUICK-START.md) pre najrýchlejší setup.

