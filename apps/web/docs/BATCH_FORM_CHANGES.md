# BatchDocumentForm - Zoznam zmien

## ✅ Implementované zmeny:

### 1. Výber vozidla s vyhľadávaním ✅
- Command Popover namiesto Select
- Vyhľadávanie podľa značky, modelu, ŠPZ, VIN
- Živé filtrovanie výsledkov

### 2. Pridať/Vymazať poisťovňu 🔄 (Implementujem)
- Dialóg "Manage Insurers"
- Možnosť pridať novú poisťovňu
- Možnosť vymazať poisťovňu (len ak nie je použitá)
- Inline pridanie priamo v selecte

### 3. Leasingová poistka 🔄 (Implementujem)
- Default frekvencia: mesačne
- Manuálny dátum "Platné do" (nie automatický)
- Špeciálne pole pre dátum ukončenia leasingu

### 4. Servisná knižka 🔄 (Implementujem)
**Nová štruktúra:**
- `serviceDate` - jeden dátum servisu
- `serviceDescription` - popis opravy
- `serviceKm` - stav km pri servise
- `serviceProvider` - servis kde sa opravovalo

**Odstránené:**
- `validFrom` / `validTo` (nie sú potrebné)

### 5. Evidencia pokút 🔄 (Implementujem)
**Nová komplexná štruktúra:**
- `fineDate` - dátum pokuty (len jeden)
- `customerId` - zákazník ktorému prišla pokuta
- `isPaid` - uhradená/neuhradená
- `ownerPaidDate` - kedy zaplatil majiteľ
- `customerPaidDate` - kedy zaplatil zákazník  
- `country` - krajina pokuty
- `enforcementCompany` - spoločnosť čo vymáha
- `fineAmount` - suma pri včasnej platbe
- `fineAmountLate` - suma po splatnosti

**Upozornenia:**
- Ak neuhradená → warning ako pri poistkách
- Ak majiteľ nezaplatil → warning
- Ak zákazník nezaplatil → warning

---

## 📝 Technické detaily:

### DocumentFormData interface:
```typescript
interface DocumentFormData {
  // Common (všetky dokumenty)
  validFrom?: Date;
  validTo?: Date;
  price?: number;
  documentNumber?: string;
  notes?: string;
  filePaths?: string[];

  // Insurance
  policyNumber?: string;
  company?: string;
  paymentFrequency?: PaymentFrequency;
  greenCardValidFrom?: Date;
  greenCardValidTo?: Date;
  kmState?: number;

  // Service book
  serviceDate?: Date;
  serviceDescription?: string;
  serviceKm?: number;
  serviceProvider?: string;

  // Fines
  fineDate?: Date;
  customerId?: string;
  isPaid?: boolean;
  ownerPaidDate?: Date;
  customerPaidDate?: Date;
  country?: string;
  enforcementCompany?: string;
  fineAmount?: number;
  fineAmountLate?: number;
}
```

### Backend mapping:
- **Service book** → mapuje sa na `stk` documentType (temporary)
- **Fines** → mapuje sa na `stk` documentType (temporary)
- **Leasing** → nový insurance type "Leasingová poistka"

V budúcnosti treba pridať do databázy:
- Nový `documentType: 'service_book'`
- Nový `documentType: 'fine'`

