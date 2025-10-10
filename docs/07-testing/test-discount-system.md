# 🧪 TEST SCENÁRE PRE SYSTÉM ZLIAV

## 📋 Testovanie zobrazenia zliav v prenájmoch

### Test 1: Prenájom bez zľavy
- **Očakávaný výsledok**: Zobrazí sa len finálna cena bez prečiarknutej ceny
- **Lokácia**: http://localhost:3000/rentals
- **Kontrola**: Cena sa zobrazuje normálne bez indikátorov zľavy

### Test 2: Prenájom s percentuálnou zľavou (napr. 15%)
- **Očakávaný výsledok**: 
  - Prečiarknutá originálna cena
  - Zľavnená cena zvýraznená
  - Chip s "-15%" indikátorom
- **Lokácia**: Vytvorenie nového prenájmu s 15% zľavou

### Test 3: Prenájom s fixnou zľavou (napr. 50€)
- **Očakávaný výsledok**:
  - Prečiarknutá originálna cena  
  - Zľavnená cena zvýraznená
  - Chip s "-50€" indikátorom

### Test 4: Prenájom s extra km poplatkami + zľava
- **Očakávaný výsledok**:
  - Zobrazenie originálnej ceny (prečiarknutá)
  - Zobrazenie zľavnenej ceny
  - Zobrazenie extra km poplatkov
  - Správny súčet finálnej ceny

### Test 5: Formulár pre vytvorenie prenájmu
- **Očakávaný výsledok**:
  - V cenové sekcii sa zobrazuje originálna cena ak je zľava
  - PriceSummary komponent zobrazuje všetky detaily
  - Správne počítanie cien v reálnom čase

## 🔧 Manuálne testovanie

1. **Otvor aplikáciu**: http://localhost:3000
2. **Prihlás sa** ako admin (admin/Black123)
3. **Choď na prenájmy**: http://localhost:3000/rentals
4. **Vytvor nový prenájom** s rôznymi typmi zliav
5. **Skontroluj zobrazenie** v zozname prenájmov

## ✅ Kontrolný zoznam

- [ ] Compact view zobrazuje zľavy správne
- [ ] Detailed view zobrazuje všetky cenové detaily
- [ ] RentalForm zobrazuje originálnu a zľavnenú cenu
- [ ] Extra km poplatky sa zobrazujú správne
- [ ] Percentuálne zľavy sa počítajú správne
- [ ] Fixné zľavy sa počítajú správne
- [ ] Backend správne ukladá zľavy
- [ ] Aktualizácia prenájmov zachováva zľavy

## 🐛 Známe problémy
(Budú doplnené počas testovania)

## 📊 Výsledky testov
(Budú doplnené po testovaní)
