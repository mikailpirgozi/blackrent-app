# 🎨 BlackRent MUI → shadcn/ui Migrácia - AKTUÁLNY STAV

## 📊 CELKOVÝ PROGRES
```
✅ Dokončených fáz: 5/10 (50%)
✅ Oficiálnych shadcn komponentov: 40+
✅ Custom komponentov: 5
✅ Zmigrovaných súborov: 3/150 (2%)
✅ Build status: FUNGUJE ✅
✅ Testy: 30 prešlo (Button: 14, Typography: 16)
```

## ⚙️ INICIALIZÁCIA SHADCN
```json
// components.json
{
  "style": "new-york",        // Odporúčaný štýl
  "baseColor": "neutral",      // Neutrálna farba (zmeníme na blue)
  "cssVariables": true,        // CSS premenné pre theming
  "tsx": true,                 // TypeScript/TSX
  "aliases": {
    "@/components": "src/components",
    "@/lib": "src/lib",
    "@/hooks": "src/hooks"
  }
}
```

## 📦 KOMPONENTY - KOMPLETNÝ ZOZNAM

### ✅ OFICIÁLNE SHADCN KOMPONENTY (40+)
```typescript
// Layout & Structure
✅ accordion.tsx       - Rozbaľovacie sekcie
✅ aspect-ratio.tsx    - Zachovanie pomeru strán
✅ card.tsx           - Karty s header/content/footer
✅ collapsible.tsx    - Skryť/zobraziť obsah
✅ separator.tsx      - Horizontálne/vertikálne oddeľovače
✅ sheet.tsx          - Drawer/sidebar komponenty
✅ tabs.tsx           - Tab navigácia

// Navigation
✅ breadcrumb.tsx     - Navigačná cesta
✅ dropdown-menu.tsx  - Rozbaľovacie menu
✅ menubar.tsx        - Horizontálne menu
✅ navigation-menu.tsx - Komplexná navigácia
✅ context-menu.tsx   - Kontextové menu (pravý klik)
✅ pagination.tsx     - Stránkovanie

// Forms & Inputs  
✅ button.tsx         - Tlačidlá (všetky varianty)
✅ checkbox.tsx       - Zaškrtávacie políčka
✅ form.tsx           - React Hook Form integrácia
✅ input.tsx          - Textové vstupy
✅ label.tsx          - Popisky pre formuláre
✅ radio-group.tsx    - Rádiové tlačidlá
✅ select.tsx         - Výberové polia
✅ slider.tsx         - Posuvníky
✅ switch.tsx         - Prepínače on/off
✅ textarea.tsx       - Viacriadkové vstupy
✅ toggle.tsx         - Toggle tlačidlá

// Date & Time
✅ calendar.tsx       - Kalendár s react-day-picker
   ⚠️ Potrebujeme pridať time picker funkcionalitu

// Feedback & Overlays
✅ alert.tsx          - Upozornenia/správy
✅ alert-dialog.tsx   - Potvrdzovacie dialógy
✅ dialog.tsx         - Modálne okná
✅ hover-card.tsx     - Karty pri hover
✅ popover.tsx        - Popovers
✅ toast.tsx          - Toast notifikácie
✅ toaster.tsx        - Toast container
✅ tooltip.tsx        - Tooltipy

// Data Display
✅ avatar.tsx         - Užívateľské avatary
✅ badge.tsx          - Odznaky/štítky
✅ progress.tsx       - Progress bar
✅ skeleton.tsx       - Loading skeleton
✅ table.tsx          - Tabuľky

// Utilities
✅ command.tsx        - Command palette/search
✅ scroll-area.tsx    - Custom scrollbar
```

### 🔧 CUSTOM KOMPONENTY (naše)
```typescript
✅ typography.tsx     - Text komponenty (h1-h6, body, caption)
✅ UnifiedButton.tsx  - Wrapper pre Button s extra funkciami
✅ UnifiedCard.tsx    - Custom card wrapper
✅ UnifiedChip.tsx    - Custom chip wrapper  
✅ spinner.tsx        - Loading spinner (shadcn nemá)
```

## 🔄 MUI → SHADCN MAPOVANIE

| MUI Component | shadcn Náhrada | Status | Počet použití |
|--------------|----------------|--------|---------------|
| Button | button.tsx + UnifiedButton | ✅ | 81x |
| Typography | typography.tsx (custom) | ✅ | 127x |
| Box | `<div>` s Tailwind | ⚠️ | 133x |
| Card/CardContent | card.tsx | ✅ | 73x |
| TextField | input.tsx + label.tsx | ✅ | 45x |
| Select | select.tsx | ✅ | 35x |
| Dialog | dialog.tsx | ✅ | 28x |
| IconButton | button.tsx variant="ghost" size="icon" | ✅ | 69x |
| Chip | badge.tsx | ✅ | 82x |
| DataGrid | table.tsx + custom | ⚠️ | 60x |
| DatePicker | calendar.tsx + time picker | ⚠️ | 12x |
| Autocomplete | command.tsx | ✅ | 8x |
| Snackbar | toast.tsx | ✅ | 5x |
| Alert | alert.tsx | ✅ | 10x |
| Tabs | tabs.tsx | ✅ | 15x |
| Accordion | accordion.tsx | ✅ | 6x |
| Drawer | sheet.tsx | ✅ | 4x |
| Menu | dropdown-menu.tsx | ✅ | 12x |
| CircularProgress | spinner.tsx (custom) | ✅ | 25x |
| LinearProgress | progress.tsx | ✅ | 8x |
| Checkbox | checkbox.tsx | ✅ | 18x |
| Switch | switch.tsx | ✅ | 7x |
| Radio | radio-group.tsx | ✅ | 5x |
| Slider | slider.tsx | ✅ | 3x |
| Tooltip | tooltip.tsx | ✅ | 22x |
| Avatar | avatar.tsx | ✅ | 9x |
| Divider | separator.tsx | ✅ | 14x |
| Skeleton | skeleton.tsx | ✅ | 6x |
| Breadcrumbs | breadcrumb.tsx | ✅ | 3x |
| Pagination | pagination.tsx | ✅ | 8x |
| Grid | CSS Grid/Flexbox | ⚠️ | 60x |

## 📁 ZMIGROVANÉ SÚBORY

### ✅ Kompletne zmigrované (3)
1. `src/components/ui/UnifiedButton.tsx`
2. `src/components/rentals/components/RentalListHeader.tsx`
3. `src/components/customers/CustomerCard.tsx`

### 🚧 Čakajúce na migráciu (147+)
- 13 súborov s Typography
- 60 súborov s DataGrid
- 45 súborov s TextField
- 133 súborov s Box
- atď...

## 🎯 ĎALŠIE KROKY - PRIORITIZÁCIA

### 1️⃣ PRIORITA 1: Box → div (133 súborov)
```bash
# Automatický script na nahradenie Box komponentu
npm run migrate:box
```

### 2️⃣ PRIORITA 2: DataGrid → Table (60 súborov)
- Vytvoríme custom Table wrapper s:
  - Sorting
  - Filtering
  - Pagination
  - Selection
  - Column resizing

### 3️⃣ PRIORITA 3: Typography (13 zostávajúcich súborov)
- SignaturePad.tsx
- R2FileUpload.tsx
- AvailabilityPage.tsx
- atď...

### 4️⃣ PRIORITA 4: Formuláre
- RentalForm.tsx
- VehicleForm.tsx
- CustomerForm.tsx
- Použiť form.tsx s react-hook-form

### 5️⃣ PRIORITA 5: Layout komponenty
- Layout.tsx (hlavný layout)
- Sidebar s sheet.tsx
- Header s navigation-menu.tsx

## 📈 METRIKY ÚSPECHU

### Pred migráciou:
- Bundle size: ~430KB (MUI)
- CSS: 45KB
- Dependencies: 25+ MUI packages

### Po migrácii (cieľ):
- Bundle size: <250KB
- CSS: <70KB  
- Dependencies: 10 Radix packages

### Aktuálne:
- Bundle size: ~280KB (hybrid)
- CSS: 65KB
- Dependencies: MUI + Radix

## 🛠️ POMOCNÉ SKRIPTY

```json
// package.json scripts
{
  "analyze:mui": "tsx scripts/mui-to-shadcn/analyze-mui-usage.ts",
  "migrate:auto": "tsx scripts/mui-to-shadcn/auto-migrate.ts",
  "shadcn:add": "npx shadcn@latest add",
  "shadcn:list": "npx shadcn@latest list @shadcn"
}
```

## ⚠️ ZNÁME PROBLÉMY

1. **DatePicker** - potrebuje time picker funkcionalitu
2. **DataGrid** - komplexná migrácia, potrebuje custom wrapper
3. **Box sx prop** - manuálna konverzia na Tailwind
4. **Theme** - prepnúť z MUI theme na CSS variables
5. **Icons** - migrácia z @mui/icons-material na lucide-react

## ✅ HOTOVÉ KOMPONENTY - ZHRNUTIE

```
Oficiálnych shadcn: 40 komponentov
Custom komponentov: 5 komponentov
Celkovo dostupných: 45 komponentov
Pokrytie MUI funkcií: ~95%
```

## 🎯 CIEĽ

Kompletná migrácia do **4-5 týždňov** s:
- 0 MUI dependencies
- 100% shadcn/ui komponenty
- Lepšia performance
- Menší bundle size
- Moderný dizajn
- Plná TypeScript podpora
