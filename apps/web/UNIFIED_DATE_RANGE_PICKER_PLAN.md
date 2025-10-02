# Implementačný plán: Unified Date Range Picker pre Prenájmy

## Cieľ
Nahradiť 2 samostatné kalendáre v RentalForm jedným moderným date range pickerom s integrovaným časovým výberom.

## Požiadavky

### Funkcionalita
- ✅ Jeden kalendár pre výber dátumového rozsahu (od-do)
- ✅ Vizuálne zvýraznenie vybraného rozsahu (farebne, ladí so shadcn designom)
- ✅ Jeden spoločný časový picker pre oba časy
- ✅ Preddefinovaný čas: 08:00 pre OBE polia (od aj do)
- ✅ Formát času: 08:00 (24-hodinový s leading zero)
- ✅ Workflow: Vyber oba dátumy → potom nastav časy
- ✅ Žiadny preddefinovaný dátum pri otvorení

### UX Požiadavky
- Pekná interakcia - vidieť odkiaľ pokiaľ je rozsah vybraný
- Moderný shadcn design
- Responzívne
- Jasné vizuálne feedback

## Technické riešenie

### Stack
- **shadcn/ui Calendar** komponent (už máme v projekte)
- **date-fns** pre date manipulation (už v projekte)
- **Tailwind CSS** pre styling
- **Custom TimeInput** komponent

### Architektúra

```
<UnifiedDateRangePicker>
  ├── <Calendar mode="range">         // shadcn calendar v range mode
  ├── <TimeInputGroup>                // Vlastný komponent
  │   ├── <TimeInput label="Od">     // Čas "od" (default 08:00)
  │   └── <TimeInput label="Do">     // Čas "do" (default 08:00)
  └── <SelectedRangeDisplay>          // Zobrazenie vybraného rozsahu
</UnifiedDateRangePicker>
```

## Implementačné kroky

### FÁZA 1: Vytvorenie TimeInput komponentu
**Súbor:** `src/components/ui/time-input.tsx`

**Funkcionalita:**
- Input pole pre čas vo formáte HH:MM
- Validácia času (00:00 - 23:59)
- Automatické formátovanie (pridávanie leading zeros)
- Keyboard support (šípky hore/dole pre zmenu)
- Label support

**Estimát:** 15 min

### FÁZA 2: Vytvorenie UnifiedDateRangePicker komponentu
**Súbor:** `src/components/ui/unified-date-range-picker.tsx`

**Funkcionalita:**
- Wrapper pre shadcn Calendar v range mode
- State management pre date range a časy
- Integrácia TimeInput komponentov
- Props interface:
  ```typescript
  interface UnifiedDateRangePickerProps {
    value?: {
      from: Date;
      to: Date;
    };
    onChange: (value: { from: Date; to: Date }) => void;
    defaultTime?: string; // default "08:00"
  }
  ```

**Vizuálne vylepšenia:**
- Range highlight v kalendári (gradient alebo solid color)
- Hover efekty
- Smooth transitions
- Selected range display text

**Estimát:** 30 min

### FÁZA 3: Custom styling pre range selection
**Súbor:** `src/styles/date-range-picker.css` alebo inline v komponentu

**Styling:**
- `.day-range-start` - prvý deň (zaoblené ľavé okraje)
- `.day-range-middle` - dni medzi (background farba)
- `.day-range-end` - posledný deň (zaoblené pravé okraje)
- Hover states pre lepší UX
- Farby z shadcn témy (primary/accent)

**Estimát:** 15 min

### FÁZA 4: Integrácia do RentalForm
**Súbor:** `src/components/rentals/RentalForm.tsx`

**Zmeny:**
1. Nahradiť existujúce 2 DatePicker komponenty
2. Integrovať UnifiedDateRangePicker
3. Update form state handling
4. Update validačnej logiky
5. Zachovať existujúcu funkcionalitu (validácia, error handling)

**Estimát:** 20 min

### FÁZA 5: Testovanie
**Testy:**
1. ✅ Výber range funguje správne
2. ✅ Čas je defaultne 08:00 pre obe polia
3. ✅ Žiadny preddefinovaný dátum pri otvorení
4. ✅ Validácia funguje (od < do)
5. ✅ Responzivita na mobile/desktop
6. ✅ Form submission funguje správne
7. ✅ Existujúce prenájmy sa načítajú správne

**Estimát:** 15 min

### FÁZA 6: TypeScript + Linting
- Všetky typy definované
- Zero errors
- Zero warnings
- ESLint passed

**Estimát:** 10 min

## Celkový čas: ~105 minút (1.75 hodiny)

## Checklist pred začatím implementácie

- [ ] Overiť že shadcn Calendar je nainštalovaný
- [ ] Overiť že date-fns je v dependencies
- [ ] Backup súčasnej RentalForm (git commit)
- [ ] Vytvoriť development branch

## Checklist po implementácii

- [ ] Všetky TypeScript errors opravené
- [ ] Všetky ESLint warnings opravené
- [ ] Manuálne testovanie vytvorenia prenájmu
- [ ] Responzivita otestovaná
- [ ] Frontend build úspešný (`pnpm run build`)

## Rollback plán

Ak by niečo nefungovalo:
```bash
git restore src/components/rentals/RentalForm.tsx
```

## Design referencie

**Farby pre range selection (z shadcn témy):**
- Start/End day: `bg-primary text-primary-foreground`
- Middle days: `bg-primary/20`
- Hover: `hover:bg-primary/30`

**Transitions:**
- `transition-colors duration-200`

## Poznámky

- Komponent bude reusable pre budúce použitie
- Zachováme všetku existujúcu validačnú logiku
- Backwards compatible s existujúcimi dátami
- Zero breaking changes pre ostatné časti aplikácie

---

**Status:** ⏳ Čaká na schválenie a začatie implementácie
**Autor:** AI Assistant
**Dátum:** 2025-10-02

