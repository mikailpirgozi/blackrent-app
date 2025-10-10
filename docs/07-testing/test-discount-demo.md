# 🧪 DEMO: Testovanie systému zliav

## ✅ Opravené komponenty:
- **RentalTableRow** - Desktop tabuľka prenájmov
- **RentalMobileCard** - Mobile karty  
- **MobileRentalRow** - Mobile riadky

## 🎯 Ako otestovať:

### 1. Otvor aplikáciu
```
http://localhost:3000/rentals
```

### 2. Vytvor nový prenájom so zľavou
1. Klikni na "Nový prenájom"
2. Vyplň základné údaje (zákazník, vozidlo, dátumy)
3. V sekcii "Zľava / Provízia" nastav:
   - **Percentuálna zľava**: napr. 15%
   - **Fixná zľava**: napr. 50€

### 3. Čo by si mal vidieť:

#### V zozname prenájmov:
- ~~Prečiarknutá originálna cena~~
- **Zvýraznená zľavnená cena**
- 🏷️ **Chip s indikátorom zľavy** (-15% alebo -50€)

#### V detaile prenájmu:
- Originálna cena (prečiarknutá)
- Zľavnená cena
- Detailný rozpis zľavy
- Extra km poplatky (ak sú)

## 🔍 Príklad výsledku:

```
Prenájom: BMW X5
~~150.00€~~ → 127.50€ 🏷️ -15%
+ Extra km: 25.00€
= Celkom: 152.50€
```

## 📱 Testované views:
- ✅ Desktop tabuľka
- ✅ Mobile karty
- ✅ Mobile riadky
- ✅ Formulár pre vytvorenie/úpravu

## 🎉 Výsledok:
Systém zliav je teraz plne funkčný a zobrazuje sa vo všetkých častiach aplikácie!
