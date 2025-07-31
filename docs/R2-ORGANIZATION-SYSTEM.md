# 🗂️ BlackRent R2 Organization System v2.0

## 📋 Prehľad

Pokročilý systém organizácie súborov na Cloudflare R2 s hierarchickou štruktúrou, kategorizáciou a automatickým manažmentom.

---

## 🏗️ Štruktúra Priečinkov

### **Nová Organizovaná Štruktúra:**
```
{year}/{month}/{company}/{vehicle}/{protocolType}/{protocolId}/{category}/{filename}
```

### **Príklad:**
```
2025/
├── 01/                                    # Mesiac
│   ├── Marko_Rental/                      # Firma (sanitizované)
│   │   └── BMW_X5_BA123AB/                # Vozidlo
│   │       ├── handover/
│   │       │   └── abc-123-uuid/
│   │       │       ├── vehicle_photos/    # Fotky vozidla
│   │       │       │   ├── exterior_01.jpg
│   │       │       │   └── interior_01.jpg
│   │       │       ├── documents/         # Doklady
│   │       │       │   ├── tp_scan.jpg
│   │       │       │   └── stk_scan.jpg
│   │       │       ├── damages/           # Škody
│   │       │       │   └── scratch_door.jpg
│   │       │       └── pdf/               # Protokol PDF
│   │       │           └── handover_protocol.pdf
│   │       └── return/
│   │           └── def-456-uuid/
│   │               ├── vehicle_photos/
│   │               ├── damages/
│   │               └── pdf/
│   └── BlackRent_Official/
│       └── Audi_Q7_BA456CD/
└── 02/
```

---

## 📁 Kategórie Súborov

| **Kategória** | **Popis** | **Použitie** |
|---------------|-----------|--------------|
| `vehicle_photos` | Fotky vozidla (exteriér, interiér, palivomer, tachometer) | Základné fotky vozidla |
| `documents` | Doklady (TP, STK, vodičský preukaz) | Skenované dokumenty |
| `damages` | Škody, defekty, poškodenia | Dokumentácia poškodení |
| `signatures` | Podpisy účastníkov | Digitálne podpisy |
| `pdf` | Finálne PDF protokoly | Vygenerované protokoly |
| `videos` | Video súbory | Video dokumentácia |
| `other` | Ostatné súbory | Fallback kategória |

---

## ⚙️ Konfigurácia

### **Konfiguračný Súbor:** `backend/src/config/r2-organization.ts`

```typescript
export const R2_ORGANIZATION_CONFIG: R2OrganizationConfig = {
  pathTemplate: '{year}/{month}/{company}/{vehicle}/{protocolType}/{protocolId}/{category}/{filename}',
  
  categories: {
    vehicle_photos: 'vehicle_photos',
    documents: 'documents',
    damages: 'damages',
    signatures: 'signatures',
    pdf: 'pdf',
    videos: 'videos',
    other: 'other'
  },
  
  companyMapping: {
    'default': 'BlackRent',
    'BlackRent': 'BlackRent_Official',
    'Marko Rental': 'Marko_Rental',
    // Automaticky sa pridajú ďalšie firmy
  },
  
  vehicleNaming: {
    format: '{brand}_{model}_{licensePlate}',
    separator: '_'
  },
  
  dateFormat: 'YYYY/MM',
  maxPathLength: 1024
};
```

---

## 🚀 API Endpoints

### **1. Presigned Upload (Enhanced)**
```http
POST /api/files/presigned-upload
Authorization: Bearer {token}
Content-Type: application/json

{
  "protocolId": "abc-123-uuid",
  "protocolType": "handover",
  "mediaType": "vehicle",
  "filename": "exterior_01.jpg",
  "contentType": "image/jpeg",
  "category": "vehicle_photos"  // Optional - auto-detected
}
```

**Response:**
```json
{
  "success": true,
  "presignedUrl": "https://...",
  "publicUrl": "https://pub-xyz.r2.dev/2025/01/Marko_Rental/BMW_X5_BA123AB/handover/abc-123-uuid/vehicle_photos/exterior_01.jpg",
  "fileKey": "2025/01/Marko_Rental/BMW_X5_BA123AB/handover/abc-123-uuid/vehicle_photos/exterior_01.jpg",
  "expiresIn": 600,
  "organization": {
    "company": "Marko_Rental",
    "vehicle": "BMW_X5_BA123AB",
    "category": "vehicle_photos",
    "path": "2025/01/Marko_Rental/BMW_X5_BA123AB/handover/abc-123-uuid/vehicle_photos/exterior_01.jpg"
  }
}
```

### **2. R2 Analýza**
```bash
GET /api/cleanup/r2-analyze
Authorization: Bearer {token}
```

### **3. R2 Bulk Delete**
```bash
DELETE /api/cleanup/r2-clear-all
Authorization: Bearer {token}
Content-Type: application/json

{
  "confirm": "DELETE_ALL_R2_FILES"
}
```

### **4. Database Reset**
```bash
DELETE /api/cleanup/reset-protocols
Authorization: Bearer {token}
Content-Type: application/json

{
  "confirm": "DELETE_ALL_PROTOCOLS",
  "includeRentals": false
}
```

---

## 🛠️ Používanie Helper Script

### **Inštalácia:**
```bash
chmod +x scripts/cleanup-r2.sh
```

### **Príklady použitia:**

#### **1. Získanie JWT tokenu:**
```bash
TOKEN=$(curl -s -X POST "https://blackrent-app-production-4d6f.up.railway.app/api/auth/login" \
  -H "Content-Type: application/json" \
  -d '{"username": "admin", "password": "Black123"}' | jq -r '.token')
```

#### **2. Analýza R2 súborov:**
```bash
./scripts/cleanup-r2.sh analyze $TOKEN
```

#### **3. Vymazanie všetkých R2 súborov:**
```bash
./scripts/cleanup-r2.sh clear-r2 $TOKEN
```

#### **4. Reset databázy protokolov:**
```bash
./scripts/cleanup-r2.sh reset-db $TOKEN
```

#### **5. Úplný reset (R2 + DB):**
```bash
./scripts/cleanup-r2.sh full-reset $TOKEN
```

---

## 🎯 Výhody Novej Organizácie

### **✅ Pre Administrátorov:**
- **Prehľadná navigácia** na R2 dashboarde
- **Jednoduchý backup** po mesiacach/firmách
- **Lepšie performance** (menšie priečinky)
- **Automatická kategorizácia**

### **✅ Pre Vývoj:**
- **Konfigurovateľná štruktúra**
- **Rozšíriteľné kategórie**
- **Sanitizácia názvov**
- **Path length protection**

### **✅ Pre Užívateľov:**
- **Rýchlejšie načítanie** (lepšia CDN cache)
- **Správne URL štruktúry**
- **Automatické detekcie typov**

---

## 🔄 Migrácia zo Starej Štruktúry

### **Stará štruktúra:**
```
protocols/{protocolType}/{date}/{protocolId}/{filename}
```

### **Nová štruktúra:**
```
{year}/{month}/{company}/{vehicle}/{protocolType}/{protocolId}/{category}/{filename}
```

### **Migračný proces:**
1. **Analýza starých súborov** - `./scripts/cleanup-r2.sh analyze $TOKEN`
2. **Backup (optional)** - manuálne z R2 dashboardu
3. **Vymazanie starých súborov** - `./scripts/cleanup-r2.sh clear-r2 $TOKEN`
4. **Reset databázy** - `./scripts/cleanup-r2.sh reset-db $TOKEN`
5. **Vytvorenie nových protokolov** s novou organizáciou

---

## 🧪 Testovanie

### **1. Lokálne testovanie:**
```bash
npm run dev:full
# Vytvoriť nový protokol
# Nahrať fotky
# Skontrolovať local-storage/ priečinok
```

### **2. Production test:**
```bash
# Po deploy na Railway
# Vytvoriť test protokol
# Skontrolovať R2 dashboard na správnu štruktúru
```

---

## 📊 Monitoring

### **R2 Dashboard metriky:**
- Počet súborov v starých vs nových priečinkoch
- Veľkosť storage využitia
- CDN hit rate pre organizované súbory

### **Application logs:**
```bash
# Backend logs - R2 upload info
🗂️ Generated organized path: 2025/01/Marko_Rental/BMW_X5_BA123AB/handover/abc-123-uuid/vehicle_photos/exterior_01.jpg

# Frontend logs - category detection
🔍 R2 UPLOAD CHECK: category=vehicle_photos, willUploadToR2=true
```

---

## 🔮 Budúce Vylepšenia (v5.0)

- **Admin UI** pre live konfiguráciu organizácie
- **Batch migration tool** pre existujúce súbory
- **Custom naming templates** per company
- **Automatic archiving** starých protokolov
- **Advanced analytics** R2 usage
- **Duplicate detection** a deduplication

---

## 📞 Support

**V prípade problémov:**
1. Skontroluj R2 konfiguráciu v `backend/.env`
2. Overr Railway deployment logs
3. Použij `./scripts/cleanup-r2.sh analyze` pre diagnostiku
4. Kontaktuj vývojára s logmi

**Common issues:**
- `pdf_data column does not exist` → Fixed in v2.0
- `R2 not configured` → Skontroluj .env súbor
- `Path too long` → Automaticky skrátené v kóde