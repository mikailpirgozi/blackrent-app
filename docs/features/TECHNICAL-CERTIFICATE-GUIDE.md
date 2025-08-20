# 🚗 TECHNICKÝ PREUKAZ VOZIDIEL - Nahrávanie súborov

## 🎯 Prehľad funkcionality

Nová funkcionalita umožňuje nahrávať technické preukazy vozidiel priamo v BlackRent aplikácii s ukladaním na Cloudflare R2 storage.

## 📍 Prístup k funkcionalite

1. **Choď na**: `/vehicles` (Evidencia vozidiel)
2. **Klikni na**: "Upraviť" pri konkrétnom vozidle (ikona ceruzky)
3. **Nájdi sekciu**: "📄 Technický preukaz" (na spodku formulára)
4. **Klikni**: "Nahrať TP"

## 📂 R2 Storage organizácia

Technické preukazy sa ukladajú v Cloudflare R2 storage:

```
vehicles/documents/technical-certificates/{vehicle_id}/{YYYY-MM-DD}/{filename}
```

**Príklad:**
```
vehicles/documents/technical-certificates/48/2025-08-19/technicky_preukaz_ford_mustang.pdf
```

## 🔧 Backend API

### Nahrávanie súboru
```http
POST /api/files/upload
Content-Type: multipart/form-data

file: File
type: "vehicle"
entityId: string (vehicle ID)
mediaType: "technical-certificate"
```

### Uloženie do databázy
```http
POST /api/vehicle-documents
Content-Type: application/json

{
  "vehicleId": "48",
  "documentType": "technical_certificate",
  "validTo": "2034-08-19",
  "documentNumber": "Technický preukaz 2024",
  "notes": "Oficiálny technický preukaz",
  "filePath": "https://pub-xxx.r2.dev/vehicles/documents/..."
}
```

### Získanie dokumentov vozidla
```http
GET /api/vehicle-documents?vehicleId=48
```

## 📊 Databázová štruktúra

### Tabuľka `vehicle_documents`
- **vehicle_id**: `INTEGER` (odkazuje na `vehicles.id`)
- **document_type**: `VARCHAR(30)` (podporuje `technical_certificate`)
- **file_path**: `TEXT` (R2 storage URL)
- **valid_to**: `DATE` (platnosť - nastavené na 10 rokov)

### Migrácie
- `fix-vehicle-documents-vehicle-id-type.sql` - oprava typu vehicle_id
- Rozšírenie document_type z VARCHAR(20) na VARCHAR(30)

## 🎨 Frontend komponenty

### `TechnicalCertificateUpload`
- Načítanie existujúcich technických preukazov
- Upload nových súborov cez R2FileUpload
- Zobrazenie a mazanie dokumentov
- Integrácia do VehicleForm

### Rozšírený `R2FileUpload`
- Nový parameter `mediaType` pre špecializované organizovanie
- Podpora pre `technical-certificate` mediaType

## 📱 Používateľské rozhranie

### Nahrávanie technického preukazu
1. **Upraviť vozidlo** → nájdi sekciu "📄 Technický preukaz"
2. **Klikni "Nahrať TP"**
3. **Zadaj názov** (napr. "Technický preukaz 2024")
4. **Pridaj poznámky** (nepovinné)
5. **Nahraj súbor** (PDF alebo obrázok)
6. **Klikni "Uložiť technický preukaz"**

### Prezeranie dokumentov
- **Zoznam** všetkých nahraných technických preukazov
- **Klik na oko** pre zobrazenie súboru
- **Klik na kôš** pre zmazanie

## 🔐 Permissions

Používa existujúci permission systém:
- `vehicles.read` - prezeranie dokumentov
- `vehicles.update` - nahrávanie nových dokumentov
- `vehicles.delete` - mazanie dokumentov

## 🚀 Technické detaily

### Podporované formáty
- **PDF dokumenty** (odporúčané)
- **Obrázky** (JPEG, PNG, WebP)
- **Maximálna veľkosť**: 50MB

### R2 Storage
- **Automatická organizácia** podľa vehicle_id a dátumu
- **Žiadny fallback** na local storage
- **Jasné error messages** ak R2 zlyhá

### Platnosť
- **Automaticky nastavená** na 10 rokov od nahratia
- **Editovateľná** cez štandardný vehicle documents systém

## 🧪 Testovanie

### Manuálne testovanie
1. Spusti aplikáciu: `npm run dev:start`
2. Prihlás sa ako admin
3. Choď na `/vehicles` → upraviť vozidlo
4. Otestuj nahrávanie technického preukazu

### API testovanie
```bash
# Upload súboru
curl -X POST -F "file=@test.pdf" -F "type=vehicle" -F "entityId=48" -F "mediaType=technical-certificate" "http://localhost:3001/api/files/upload"

# Uloženie do databázy
curl -X POST "http://localhost:3001/api/vehicle-documents" -H "Authorization: Bearer $TOKEN" -H "Content-Type: application/json" -d '{"vehicleId":"48","documentType":"technical_certificate","validTo":"2034-08-19","documentNumber":"Test TP","filePath":"R2_URL"}'
```

## ✅ Výsledok

Technické preukazy sa teraz ukladajú:
- **R2 Storage**: `vehicles/documents/technical-certificates/{vehicle_id}/{date}/`
- **Databáza**: `vehicle_documents` tabuľka s type `technical_certificate`
- **UI**: Integrované do vehicle edit formulára

**Funkcionalita je pripravená na používanie!** 🚀
