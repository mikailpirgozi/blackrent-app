# 📊 V1 → V2 MAPPING TABUĽKA

## 🎯 **POLE MAPPING:**

| V1 POLE | V2 POLE | STATUS | POZNÁMKA |
|---------|---------|---------|----------|
| **INFORMÁCIE O OBJEDNÁVKE** | | |
| `rental.orderNumber` | ❌ CHÝBA | 🚨 KRITICKÉ | Musí byť pridané |
| `rental.startDate` | `rental.startDate` | ✅ OK | Rovnaké |
| `rental.endDate` | `rental.endDate` | ✅ OK | Rovnaké |
| `rental.totalPrice` | ❌ CHÝBA | 🚨 KRITICKÉ | Musí byť pridané |
| `rental.deposit` | ❌ CHÝBA | 🚨 KRITICKÉ | Musí byť pridané |
| `rental.allowedKilometers` | ❌ CHÝBA | 🚨 KRITICKÉ | Musí byť pridané |
| `rental.extraKilometerRate` | ❌ CHÝBA | 🚨 KRITICKÉ | Musí byť pridané |
| `rental.pickupLocation` | `rental.location` | ✅ OK | Mapované |
| `rental.returnLocation` | ❌ CHÝBA | ⚠️ STREDNÉ | Musí byť pridané |
| **INFORMÁCIE O ZÁKAZNÍKOVI** | | |
| `customer.name` | `customer.firstName + lastName` | ⚠️ ROZDIEL | Musí byť zjednotené |
| `customer.email` | `customer.email` | ✅ OK | Rovnaké |
| `customer.phone` | `customer.phone` | ✅ OK | Rovnaké |
| `customerAddress` | ❌ CHÝBA | ⚠️ STREDNÉ | Musí byť pridané |
| **INFORMÁCIE O VOZIDLE** | | |
| `vehicle.brand` | `vehicle.brand` | ✅ OK | Rovnaké |
| `vehicle.model` | `vehicle.model` | ✅ OK | Rovnaké |
| `vehicle.licensePlate` | `vehicle.licensePlate` | ✅ OK | Rovnaké |
| `vehicle.vin` | `vehicle.vin` | ✅ OK | Ale nie je zobrazené |
| `vehicle.status` | ❌ CHÝBA | ⚠️ STREDNÉ | Musí byť pridané |
| `vehicle.year` | `vehicle.year` | ✅ OK | V2 má navyše |
| **ÚDAJE PROTOKOLU** | | |
| `formData.location` | `rental.location` | ✅ OK | Mapované |
| `formData.notes` | `protocolData.notes` | ✅ OK | Rovnaké |
| **STAV VOZIDLA** | | |
| `formData.odometer` | ❌ CHÝBA | 🚨 KRITICKÉ | V2 má len startKm |
| `formData.fuelLevel` | `protocolData.fuelLevel` | ✅ OK | Rovnaké |
| `formData.depositPaymentMethod` | ❌ CHÝBA | 🚨 KRITICKÉ | Musí byť pridané |
| ❌ CHÝBA | `protocolData.condition` | ➕ NOVÉ | V2 má navyše |
| ❌ CHÝBA | `protocolData.damages[]` | ➕ NOVÉ | V2 má navyše |
| **FOTODOKUMENTÁCIA** | | |
| `vehicleImages[]` | ❌ CHÝBA | 🚨 KRITICKÉ | V2 má len photos[] |
| `documentImages[]` | ❌ CHÝBA | 🚨 KRITICKÉ | V2 má len photos[] |
| `damageImages[]` | ❌ CHÝBA | 🚨 KRITICKÉ | V2 má len photos[] |
| `odometerImages[]` | ❌ CHÝBA | 🚨 KRITICKÉ | V2 má len photos[] |
| `fuelImages[]` | ❌ CHÝBA | 🚨 KRITICKÉ | V2 má len photos[] |
| ❌ CHÝBA | `photos[]` | ➕ NOVÉ | V2 má zjednodušené |
| **PODPISY** | | |
| `signatures[]` (customer + employee) | `signature` (len customer) | 🚨 KRITICKÉ | V2 chýba employee |

---

## 🎨 **UI KOMPONENTY MAPPING:**

| V1 KOMPONENT | V2 KOMPONENT | STATUS | POZNÁMKA |
|--------------|--------------|---------|----------|
| `Card` (MUI) | `div className="bg-gray-50"` | ⚠️ ROZDIEL | Iný štýl |
| `TextField` (MUI) | `input className="w-full"` | ⚠️ ROZDIEL | Iný štýl |
| `Select` (MUI) | `select className="w-full"` | ⚠️ ROZDIEL | Iný štýl |
| `Button` (MUI) | `button className="bg-blue-500"` | ⚠️ ROZDIEL | Iný štýl |
| `Chip` (MUI) | ❌ CHÝBA | 🚨 KRITICKÉ | Musí byť pridané |
| `LinearProgress` (MUI) | ❌ CHÝBA | 🚨 KRITICKÉ | Musí byť pridané |
| `Alert` (MUI) | `div className="bg-red-50"` | ⚠️ ROZDIEL | Iný štýl |
| `Grid` (MUI) | `div className="grid"` | ✅ OK | Mapované |
| `Typography` (MUI) | `h1,h2,p` | ✅ OK | Mapované |
| `Box` (MUI) | `div` | ✅ OK | Mapované |

---

## 🔧 **FUNKCIONALITA MAPPING:**

| V1 FUNKCIA | V2 FUNKCIA | STATUS | POZNÁMKA |
|------------|------------|---------|----------|
| `SerialPhotoCapture` | `SerialPhotoCaptureV2` | ✅ OK | Vylepšené |
| `SignaturePad` (2 podpisy) | `SignaturePad` (1 podpis) | 🚨 KRITICKÉ | Chýba employee |
| Smart caching | ❌ CHÝBA | ⚠️ STREDNÉ | Musí byť pridané |
| Email status | ❌ CHÝBA | ⚠️ STREDNÉ | Musí byť pridané |
| Loading states | Čiastočne | ⚠️ STREDNÉ | Musí byť vylepšené |
| Mobile optimizations | ❌ CHÝBA | ⚠️ STREDNÉ | Musí byť pridané |
| Error handling | Základné | ⚠️ STREDNÉ | Musí byť vylepšené |
| Form validation | Základné | ⚠️ STREDNÉ | Musí byť vylepšené |

---

## 📊 **ŠTATISTIKY:**

- **✅ OK:** 12 polí
- **⚠️ ROZDIEL:** 8 polí  
- **🚨 KRITICKÉ:** 15 polí
- **➕ NOVÉ:** 3 polia

**CELKOVO:** V2 má **15 kritických chýb** a **8 rozdielov** oproti V1!

---

## 🎯 **PRIORITA OPRÁV:**

### **1. 🚨 KRITICKÉ (MUSÍ BYŤ OPRAVENÉ):**
1. Pridať informácie o objednávke
2. Pridať stav tachometra (odometer)
3. Pridať spôsob úhrady depozitu
4. Pridať podpis zamestnanca
5. Pridať 5 kategórií fotiek
6. Pridať Material-UI komponenty

### **2. ⚠️ STREDNÉ (MALO BY BYŤ OPRAVENÉ):**
1. Zjednotiť customer.name handling
2. Pridať smart caching
3. Pridať email status
4. Vylepšiť loading states

### **3. ➕ NOVÉ (ZACHOVAŤ Z V2):**
1. Damages array
2. Condition select
3. Vehicle year

---

## 🚀 **ZÁVER:**

V2 formulár je **NEÚPLNÝ** a **NEKOMPATIBILNÝ** s V1. Potrebuje **kompletné prepracovanie** aby bol funkčne identický s V1 plus V2 výhody.
