# 🔄 Pravidelné mesačné náklady - Používateľská príručka

## 📋 Prehľad

Systém pravidelných nákladov umožňuje automatické generovanie opakujúcich sa nákladov ako sú poistenie, leasing, servisné zmluvy a podobne. Náklady sa automaticky vytvoria každý mesiac na začiatku mesiaca.

## 🎯 Funkcie

### ✅ Čo môžete robiť:
- **Vytvárať pravidelné náklady** s vlastnými kategóriami
- **Nastaviť frekvenciu**: mesačne, štvrťročne, ročne  
- **Určiť deň v mesiaci** kedy sa má náklad vygenerovať (1-28)
- **Pripojiť k vozidlu** alebo nechať všeobecné
- **Automatické generovanie** každý 1. deň v mesiaci o 6:00
- **Manuálne generovanie** kedykoľvek cez UI
- **Sledovať históriu** vygenerovaných nákladov

### 🛡️ Bezpečnostné funkcie:
- Ochrana pred duplikátmi (nemôže sa vygenerovať 2x pre rovnaký mesiac)
- Validácia všetkých dát
- Audit log všetkých operácií

## 🚀 Ako používať

### 1. Prístup k správe
1. Ísť na `http://localhost:3000/expenses`
2. Kliknúť na **"Pravidelné náklady"** (zelené tlačidlo)

### 2. Vytvorenie pravidelného nákladu
1. Kliknúť **"Pridať pravidelný náklad"**
2. Vyplniť formulár:
   - **Názov**: identifikácia (napr. "Poistenie BMW X5")
   - **Popis**: text pre generované náklady
   - **Suma**: mesačná suma v €
   - **Kategória**: z vlastných kategórií
   - **Firma**: názov firmy
   - **Vozidlo**: voliteľné priradenie
   - **Frekvencia**: mesačne/štvrťročne/ročne
   - **Začiatok**: od kedy generovať
   - **Koniec**: voliteľné ukončenie
   - **Deň v mesiaci**: 1-28 (kedy generovať)

### 3. Správa existujúcich
- **Upraviť**: tlačidlo ceruzka
- **Zmazať**: tlačidlo kôš
- **Vygenerovať teraz**: zelené tlačidlo play
- **Aktivovať/deaktivovať**: prepínač

### 4. Automatické generovanie
- **Automaticky**: každý 1. deň v mesiaci o 6:00
- **Manuálne všetky**: tlačidlo "Vygenerovať všetky splatné"
- **Manuálne jeden**: tlačidlo pri konkrétnom nákladu

## 📊 Príklady použitia

### Mesačné poistenie
```
Názov: Poistenie BMW X5
Popis: Mesačné havarijné poistenie BMW X5
Suma: 150€
Kategória: Poistenie  
Firma: Allianz
Frekvencia: Mesačne
Deň: 1. deň v mesiaci
```

### Štvrťročný servis
```
Názov: Servis flotily
Popis: Štvrťročná údržba vozového parku
Suma: 800€
Kategória: Servis
Firma: AutoServis SK
Frekvencia: Štvrťročne
Deň: 15. deň v mesiaci
```

### Ročné poplatky
```
Názov: Diaľničné známky
Popis: Ročné diaľničné známky pre flotilu
Suma: 500€
Kategória: Mýtne
Firma: BlackRent
Frekvencia: Ročne
Deň: 1. deň v mesiaci
```

## ⚙️ Technické detaily

### Databázové tabuľky
- `recurring_expenses` - definície pravidelných nákladov
- `recurring_expense_generations` - log vygenerovaných nákladov
- `expense_categories` - vlastné kategórie

### API Endpointy
- `GET /api/recurring-expenses` - zoznam
- `POST /api/recurring-expenses` - vytvorenie
- `PUT /api/recurring-expenses/:id` - úprava  
- `DELETE /api/recurring-expenses/:id` - zmazanie
- `POST /api/recurring-expenses/generate` - generovanie všetkých
- `POST /api/recurring-expenses/:id/generate` - generovanie konkrétneho

### Cron Job
```
Čas: Každý 1. deň v mesiaci o 6:00 ráno
Timezone: Europe/Bratislava
Pattern: '0 6 1 * *'
```

## 🔧 Riešenie problémov

### Náklad sa nevygeneroval
1. Skontrolovať či je **aktívny**
2. Skontrolovať **dátum splatnosti**
3. Skontrolovať či už nebol **vygenerovaný pre daný mesiac**
4. Použiť **manuálne generovanie**

### Duplicitné náklady
- Systém automaticky **bráni duplikátom**
- Jeden náklad sa môže vygenerovať **len raz pre jeden mesiac**

### Chyby pri generovaní
- Skontrolovať **kategórie** (musia existovať)
- Skontrolovať **firmy** (automaticky sa vytvoria)
- Skontrolovať **vozidlá** (musia existovať ak sú priradené)

## 🎉 Výhody systému

1. **Automatizácia** - žiadne zabúdanie na pravidelné náklady
2. **Flexibilita** - vlastné kategórie, frekvencie, dátumy
3. **Kontrola** - kompletný audit trail
4. **Bezpečnosť** - ochrana pred chybami a duplikátmi
5. **Jednoduchost** - intuitívne UI pre správu

---

**Systém je pripravený na produkčné použitie!** 🚀
