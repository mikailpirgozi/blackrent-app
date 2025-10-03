# ✅ Modulárna implementácia BatchDocumentForm - DOKONČENÉ

## 📦 Vytvorené modulárne komponenty:

### 1. `/batch-components/VehicleCombobox.tsx` ✅
**Funkcie:**
- Command Popover s vyhľadávaním
- Živé filtrovanie podľa značky, modelu, ŠPZ, VIN
- Pekný UI s gradientom

**Props:**
```typescript
interface VehicleComboboxProps {
  vehicles: Vehicle[];
  value: string;
  onChange: (vehicleId: string) => void;
}
```

---

### 2. `/batch-components/InsurerManagement.tsx` ✅
**Funkcie:**
- Select pre výber poisťovne
- Inline pridanie novej poisťovne (+ tlačidlo v selecte)
- "Spravovať" tlačidlo → Dialóg so zoznamom poisťovní
- Možnosť vymazať poisťovňu
- Validácia duplicít

**Props:**
```typescript
interface InsurerManagementProps {
  insurers: Array<{ id: string; name: string }>;
  value: string;
  onChange: (company: string) => void;
  label?: string;
}
```

---

### 3. `/batch-components/ServiceBookFields.tsx` ✅
**Funkcie:**
- `serviceDate` - dátum servisu (len jeden!)
- `serviceKm` - stav km pri servise
- `serviceProvider` - kde sa servisovalo
- `serviceDescription` - popis vykonaných prác (textarea)

**Props:**
```typescript
interface ServiceBookFieldsProps {
  data: {
    serviceDate?: Date;
    serviceDescription?: string;
    serviceKm?: number;
    serviceProvider?: string;
  };
  onChange: (field, value) => void;
}
```

---

### 4. `/batch-components/FinesFields.tsx` ✅
**Funkcie:**
- `fineDate` - dátum pokuty (len jeden!)
- `customerId` - select zákazníka
- `country` - krajina pokuty
- `enforcementCompany` - kto vymáha
- `fineAmount` - suma pri včasnej platbe
- `fineAmountLate` - suma po splatnosti
- `ownerPaidDate` - kedy zaplatil majiteľ
- `customerPaidDate` - kedy zaplatil zákazník
- **2 Warnings** - ak majiteľ/zákazník nezaplatil
- **Success alert** - ak obaja zaplatili

**Props:**
```typescript
interface FinesFieldsProps {
  data: {
    fineDate?: Date;
    customerId?: string;
    isPaid?: boolean;
    ownerPaidDate?: Date;
    customerPaidDate?: Date;
    country?: string;
    enforcementCompany?: string;
    fineAmount?: number;
    fineAmountLate?: number;
  };
  onChange: (field, value) => void;
}
```

---

### 5. `/batch-components/DocumentTypeSelector.tsx` ✅
**Funkcie:**
- Grid s všetkými typmi dokumentov
- Checkbox výber
- Farebné gradienty pre každý typ
- Exportuje `DOCUMENT_TYPES` array

**Props:**
```typescript
interface DocumentTypeSelectorProps {
  selectedTypes: Set<DocumentTypeKey>;
  onToggle: (type: DocumentTypeKey) => void;
}
```

---

## 🎯 ČO ĎALEJ:

### Zostáva spraviť:

#### A) Optimalizovať BatchDocumentForm.tsx
Nahradiť existujúci kód použitím nových komponentov:

```typescript
// Namiesto vlastného Select pre vozidlo:
<VehicleCombobox
  vehicles={vehicles}
  value={vehicleId}
  onChange={setVehicleId}
/>

// Namiesto vlastného Select pre poisťovňu:
<InsurerManagement
  insurers={insurers}
  value={section.data.company || ''}
  onChange={val => onUpdateData('company', val)}
/>

// Pre service book:
{section.key === 'service_book' && (
  <ServiceBookFields
    data={section.data}
    onChange={(field, value) => onUpdateData(field, value)}
  />
)}

// Pre fines:
{section.key === 'fines_record' && (
  <FinesFields
    data={section.data}
    onChange={(field, value) => onUpdateData(field, value)}
  />
)}
```

#### B) Upraviť Leasingová poistka logiku
V DocumentSectionForm pridať condition:

```typescript
// Leasingová poistka - mesačná frekvencia default + manual validTo
{section.key === 'insurance_leasing' && (
  <>
    <Alert className="border-purple-200 bg-purple-50">
      <AlertDescription>
        💡 Leasingové poistky majú štandardne mesačnú frekvenciu platenia.
        Platnosť poistky je do ukončenia leasingu - zadaj manuálne.
      </AlertDescription>
    </Alert>
    
    {/* Override paymentFrequency to monthly */}
    {/* validTo is NOT automatic - user enters manually */}
  </>
)}
```

#### C) Update handleBatchSave v VehicleCentricInsuranceList.tsx
Pridať podporu pre nové dáta:

```typescript
// Service book mapping
if (type === 'service_book') {
  const vehicleDocData = {
    id: uuidv4(),
    vehicleId: data.vehicleId,
    documentType: 'stk', // temporary mapping
    validFrom: data.serviceDate || new Date(),
    validTo: data.serviceDate || new Date(), // same as validFrom
    documentNumber: '',
    price: 0,
    notes: `Servis: ${data.serviceProvider}\n\nPopis: ${data.serviceDescription}\n\nKm: ${data.serviceKm}`,
    filePath: data.filePaths?.[0] || '',
    kmState: data.serviceKm || 0,
  };
  await createVehicleDocumentMutation.mutateAsync(vehicleDocData);
}

// Fines mapping
if (type === 'fines_record') {
  // Similar mapping with all fine fields in notes
  const fineNotes = `
Pokuta - ${data.country || 'Neznáma krajina'}
Vymáha: ${data.enforcementCompany || 'N/A'}
Zákazník: ${customerName}
Suma včas: ${data.fineAmount}€
Suma neskoro: ${data.fineAmountLate}€
Majiteľ zaplatil: ${data.ownerPaidDate ? 'Áno' : 'Nie'}
Zákazník zaplatil: ${data.customerPaidDate ? 'Áno' : 'Nie'}
  `.trim();
  
  const vehicleDocData = {
    // ... map to temporary stk type
    notes: fineNotes,
  };
  await createVehicleDocumentMutation.mutateAsync(vehicleDocData);
}
```

---

## 📊 Štatistiky:

### Pred moduláciou:
- **1 súbor:** BatchDocumentForm.tsx (1114 riadkov)
- Ťažko udržiavateľný, všetko v jednom súbore

### Po modulácii:
- **6 súborov** v `/batch-components/`:
  1. VehicleCombobox.tsx (~130 riadkov)
  2. InsurerManagement.tsx (~260 riadkov)
  3. ServiceBookFields.tsx (~100 riadkov)
  4. FinesFields.tsx (~280 riadkov)
  5. DocumentTypeSelector.tsx (~150 riadkov)
- **Hlavný súbor** BatchDocumentForm.tsx (~400 riadkov po optimalizácii)

### Výhody:
✅ Každý komponent má jednu zodpovednosť
✅ Ľahko testovateľné
✅ Znovupoužiteľné (môžeš použiť aj v iných formulároch)
✅ Čistý, čitateľný kód
✅ TypeScript type-safe

---

## 🚀 Ďalší krok:

**Chceš aby som:**

**A)** Vytvoril nový optimalizovaný BatchDocumentForm.tsx ktorý používa tieto komponenty? (15 min)

**B)** Dal ti presné inštrukcie ako to spojiť dokopy manuálne? (5 min)

**C)** Pokračoval ďalej a dokončil aj backend mapping + testing? (25 min)

---

Napíš prosím len písmeno (A, B alebo C)!

