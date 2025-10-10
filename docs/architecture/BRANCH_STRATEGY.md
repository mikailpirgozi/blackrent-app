# 🌳 Branch Strategy - BlackRent Monorepo

## 📋 Branch Typy

### 1. **main** (Produkčný)
- **Účel:** Produkčná verzia aplikácie
- **Deploy:** Automaticky na Railway/Vercel
- **Pravidlá:**
  - ⛔ Žiadne direct commits
  - ✅ Len cez Pull Request z development
  - ✅ Musí prejsť CI/CD tests
  - ✅ Code review povinný

### 2. **development** (Development)
- **Účel:** Development/staging verzia
- **Deploy:** Dev server
- **Pravidlá:**
  - ✅ Merge z feature branchov
  - ✅ Testovanie pred merge do main
  - ✅ Môžeš commitovať priamo (menšie zmeny)

### 3. **feature/*** (Features)
- **Účel:** Nové funkcionality
- **Pravidlá:**
  - ✅ Vytvor z development
  - ✅ Merge späť do development
  - ✅ Zmaž po merge
- **Príklady:**
  - `feature/shadcn-migration`
  - `feature/new-dashboard`
  - `feature/payment-integration`

### 4. **fix/*** (Bugfixy)
- **Účel:** Oprava chýb
- **Pravidlá:**
  - ✅ Vytvor z development (alebo main ak hotfix)
  - ✅ Rýchle merge
  - ✅ Zmaž po merge
- **Príklady:**
  - `fix/login-validation`
  - `fix/date-format`

### 5. **hotfix/*** (Urgentné opravy)
- **Účel:** Kritické bugfixy v produkcii
- **Pravidlá:**
  - ⚡ Vytvor z main
  - ⚡ Merge do main A development
  - ⚡ Immediate deploy
- **Príklady:**
  - `hotfix/security-vulnerability`
  - `hotfix/critical-bug`

---

## 🔄 Workflow

### Nová feature:
```bash
# 1. Vytvor branch z development
git checkout development
git pull origin development
git checkout -b feature/moja-nova-feature

# 2. Pracuj na feature
git add .
git commit -m "feat: pridaná nová feature"

# 3. Push na GitHub
git push -u origin feature/moja-nova-feature

# 4. Vytvor Pull Request na GitHub (development ← feature)
# 5. Po review a merge, zmaž branch
git branch -D feature/moja-nova-feature
git push origin --delete feature/moja-nova-feature
```

### Bugfix:
```bash
# 1. Vytvor branch z development
git checkout development
git checkout -b fix/nazov-bugu

# 2. Oprav bug
git add .
git commit -m "fix: oprava bugu"

# 3. Push a PR
git push -u origin fix/nazov-bugu
# (Vytvor PR na GitHube)
```

### Deploy do produkcie:
```bash
# 1. Merge development → main (cez PR)
# 2. Automatický deploy na Railway/Vercel
# 3. Testuj produkciu
# 4. Ak OK → hotovo! Ak nie → hotfix
```

---

## 📊 Aktuálny Stav

### Existujúce branche:
- ✅ **development** - Aktuálna development verzia (ex shadcn-clean)
- ⏸️ **main** - Starší stav (bude aktualizovaný neskôr)
- 💾 **backup-shadcn-clean-20251002** - Bezpečnostný backup

### Najbližšie kroky:
1. Pracuj na development branchi
2. Vytváraj feature branche podľa potreby
3. Keď je všetko stable → merge do main
4. Zmaž backup branch (už nie je potrebný)

---

## 💡 Best Practices

1. **Commit messages:**
   - `feat:` - Nová feature
   - `fix:` - Bugfix
   - `docs:` - Dokumentácia
   - `style:` - Styling
   - `refactor:` - Refaktoring
   - `test:` - Testy
   - `chore:` - Maintenance

2. **Pull Requests:**
   - Vždy pridaj popisný title
   - Vysvetli čo sa zmenilo a prečo
   - Pridaj screenshots ak je UI zmena
   - Požiadaj o review

3. **Branch naming:**
   - Lowercase
   - Použiť pomlčky (nie podčiarkovníky)
   - Descriptive names
   - Príklady: `feature/user-dashboard`, `fix/login-error`

---

**Vytvorené:** 2. Október 2025  
**Posledná aktualizácia:** 2. Október 2025
