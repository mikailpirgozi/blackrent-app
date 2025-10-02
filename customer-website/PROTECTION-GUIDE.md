# 🛡️ BlackRent Protection System

Tento systém zabezpečuje, že sa nevrátia nežiaduce komponenty (Tesla banner, chat button, duplicitné logá).

## 🚀 Rýchly Štart

```bash
# Kontrola štruktúry
npm run protect

# Bezpečný štart servera
npm run safe-start

# Záloha pred zmenami
npm run backup

# Kontrola pred commitom
npm run commit-check
```

## 📋 Dostupné Príkazy

### Ochrana
- `npm run protect` - Kontroluje štruktúru súborov
- `npm run safe-start` - Kontrola + spustenie servera
- `npm run commit-check` - Kontrola + linting pred commitom

### Zálohy
- `npm run backup` - Vytvorí zálohu kritických súborov
- `npm run restore-help` - Ukáže ako obnoviť zo zálohy

### Vývoj
- `npm run dev` - Štandardný development server
- `npm run dev:safe` - Bezpečný development server
- `npm run build` - Production build

## 🔍 Čo Sa Kontroluje

### ❌ Zakázané Komponenty v `src/app/page.tsx`:
- `HeroSection` (Tesla banner)
- `BrandLogosSection` (duplicitné logá)
- `ChatButton` (chat tlačidlo)

### ✅ Povolené Komponenty:
- `HeaderSection` (hlavička)
- `FeaturedItemsSection` (hero, filter, vehicle cards)
- `ContactSection` (FAQ, contact, footer)

## 🔧 Riešenie Problémov

### Ak protection script hlási chyby:

1. **Otvorte `src/app/page.tsx`**
2. **Odstráňte nežiaduce importy:**
   ```typescript
   // ODSTRÁŇTE:
   import { HeroSection } from "...";
   import { BrandLogosSection } from "...";
   import { ChatButton } from "...";
   ```

3. **Odstráňte nežiaduce komponenty z JSX:**
   ```typescript
   // ODSTRÁŇTE:
   <HeroSection />
   <BrandLogosSection />
   <ChatButton />
   ```

4. **Spustite znovu kontrolu:**
   ```bash
   npm run protect
   ```

## 🔄 Automatické Kontroly

### Git Pre-commit Hook
- Automaticky sa spúšťa pred každým commitom
- Zabráni commitu ak sú nájdené chyby
- Umiestnený v `.git/hooks/pre-commit`

### Backup System
- Zálohy sa ukladajú do `backups/YYYYMMDD_HHMMSS/`
- Obsahuje kritické súbory + info súbor
- Pre obnovenie: `cp backups/20241214_143022/page.tsx src/app/`

## 📁 Štruktúra Súborov

```
customer-website/
├── scripts/
│   ├── protect-structure.sh    # Kontrola štruktúry
│   └── backup-critical.sh      # Zálohovanie
├── backups/                    # Automatické zálohy
├── src/app/page.tsx           # HLAVNÝ SÚBOR (kontrolovaný)
└── PROTECTION-GUIDE.md       # Táto dokumentácia
```

## 🚨 Núdzové Riešenie

Ak sa niečo pokazí:

1. **Obnovenie zo zálohy:**
   ```bash
   npm run backup
   # Pozrite si dostupné zálohy
   ls backups/
   # Obnovte najnovšiu
   cp backups/20241214_143022/page.tsx src/app/
   ```

2. **Manuálna oprava:**
   ```bash
   # Skontrolujte Git status
   git status
   # Obnovte súbor z Git
   git restore src/app/page.tsx
   ```

3. **Kontakt na pomoc:**
   - Spustite `npm run protect` pre diagnostiku
   - Skontrolujte chybové hlásenia
   - Postupujte podľa inštrukcií

## ✅ Najlepšie Praktiky

1. **Pred veľkými zmenami:**
   ```bash
   npm run backup
   ```

2. **Pred spustením servera:**
   ```bash
   npm run safe-start
   ```

3. **Pred commitom:**
   ```bash
   npm run commit-check
   ```

4. **Pravidelná kontrola:**
   ```bash
   npm run protect
   ```

---

**🎯 Cieľ:** Zabezpečiť, že sa nikdy nevrátia Tesla banner, chat button ani duplicitné logá!
