# Return Protocol Upload Fix - 2025-10-13

## 🚨 Problém

Pri vytváraní return protokolu dochádzalo k chybám:
1. **500 Error pri uploade fotiek** - Backend očakával multipart form data, ale frontend posielal JSON s base64
2. **500 Error pri vytváraní protokolu** - Backend ignoroval všetky údaje protokolu (signatures, damages, vehicleCondition)

## 📊 Error Logy

```
Upload failed: 500
    at uploadSingle (useStreamUpload.ts:3...)

API chyba: Error: Chyba pri vytváraní protokolu
    at ApiService.request (api.ts:163:15)
```

## ✅ Riešenie

### 1. Opravený `/api/files/upload` endpoint

**Súbor:** `backend/src/fastify/routes/files.ts`

**Zmeny:**
- Pridaná podpora pre JSON body s base64 dátami
- Endpoint teraz prijíma:
  ```typescript
  {
    file: string;      // base64 data (s alebo bez data:image/... prefix)
    filename: string;
    mimetype: string;
    protocolId: string;
    category: string;   // napr. 'vehicle', 'damage', 'document'
  }
  ```
- Organizované uloženie do R2: `protocols/{protocolId}/{category}/{timestamp}-{filename}`
- Fallback na multipart form pre spätnú kompatibilitu

**Kód:**
```typescript
// Check if JSON body with base64 data
if (body && body.file && body.filename) {
  const base64Data = body.file.includes(',') ? body.file.split(',')[1] : body.file;
  const buffer = Buffer.from(base64Data, 'base64');
  const key = `protocols/${protocolId}/${category}/${Date.now()}-${filename}`;
  await r2Storage.uploadFile(key, buffer, mimetype);
  const url = r2Storage.getPublicUrl(key);
  return { success: true, data: { key, url, filename, size: buffer.length, mimetype } };
}
```

### 2. Opravený `/api/protocols/return` endpoint

**Súbor:** `backend/src/fastify/routes/protocols.ts`

**Zmeny:**
- Endpoint teraz prijíma a ukladá všetky údaje z protokolu:
  ```typescript
  {
    id: string;
    rentalId: string;
    handoverProtocolId: string;
    vehicleCondition: VehicleCondition;
    signatures: Signature[];
    damages: Damage[];
    vehicleImages: string[];
    documentImages: string[];
    damageImages: string[];
    vehicleVideos: string[];
    documentVideos: string[];
    damageVideos: string[];
    location: string;
    status: 'draft' | 'completed';
    completedAt: string | null;
  }
  ```
- Pridané detailné loggovanie pre debugging

**Kód:**
```typescript
const newProtocol = await postgresDatabase.createReturnProtocol({
  id: protocolData.id,
  rentalId: protocolData.rentalId,
  handoverProtocolId: protocolData.handoverProtocolId,
  vehicleCondition: protocolData.vehicleCondition as unknown as Record<string, unknown>,
  vehicleImages: protocolData.vehicleImages || [],
  vehicleVideos: protocolData.vehicleVideos || [],
  documentImages: protocolData.documentImages || [],
  documentVideos: protocolData.documentVideos || [],
  damageImages: protocolData.damageImages || [],
  damageVideos: protocolData.damageVideos || [],
  damages: protocolData.damages || [],
  signatures: protocolData.signatures || [],
  location: protocolData.location || '',
  status: protocolData.status || 'draft',
  completedAt: protocolData.completedAt || null
});
```

## 🧪 Testovanie

### 1. Test upload fotiek

```bash
# Test JSON upload s base64
curl -X POST http://localhost:3001/api/files/upload \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "file": "data:image/jpeg;base64,/9j/4AAQ...",
    "filename": "test.jpg",
    "mimetype": "image/jpeg",
    "protocolId": "764",
    "category": "vehicle"
  }'
```

**Očakávaný výsledok:**
```json
{
  "success": true,
  "data": {
    "key": "protocols/764/vehicle/1234567890-test.jpg",
    "url": "https://r2.blackrent.sk/protocols/764/vehicle/1234567890-test.jpg",
    "filename": "test.jpg",
    "size": 12345,
    "mimetype": "image/jpeg"
  }
}
```

### 2. Test vytvorenia protokolu

```bash
# Test vytvorenia return protokolu
curl -X POST http://localhost:3001/api/protocols/return \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "id": "test-protocol-id",
    "rentalId": "764",
    "handoverProtocolId": "handover-id",
    "vehicleCondition": {
      "odometer": 100,
      "fuelLevel": 50,
      "fuelType": "gasoline",
      "exteriorCondition": "Dobrý",
      "interiorCondition": "Dobrý"
    },
    "signatures": [{
      "id": "sig-1",
      "signerName": "Test User",
      "signerRole": "employee",
      "signature": "data:image/png;base64,...",
      "timestamp": "2025-10-13T12:00:00Z"
    }],
    "damages": [],
    "vehicleImages": [],
    "location": "Trenčín",
    "status": "completed",
    "completedAt": "2025-10-13T12:00:00Z"
  }'
```

**Očakávaný výsledok:**
```json
{
  "success": true,
  "data": {
    "id": "test-protocol-id",
    "rentalId": "764",
    "status": "completed",
    "pdfUrl": "https://r2.blackrent.sk/protocols/..."
  }
}
```

## 📝 Zmeny v súboroch

1. **backend/src/fastify/routes/files.ts** - Upravený `/api/files/upload` endpoint
2. **backend/src/fastify/routes/protocols.ts** - Upravený `/api/protocols/return` endpoint

## 🔍 Backend Logy

Pri vytváraní protokolu teraz vidíš:
```
📝 Creating return protocol { rentalId: '764', protocolId: 'xxx' }
🔍 Return protocol data { data: '{ ... complete JSON ... }' }
📦 JSON file received { filename: 'photo.jpg', mimetype: 'image/jpeg', size: 12345, protocolId: '764', category: 'vehicle' }
✅ File uploaded to R2 (JSON) { key: 'protocols/764/vehicle/...', url: '...' }
```

## ✅ Výsledok

- ✅ Upload fotiek funguje (JSON + base64)
- ✅ Vytvorenie return protokolu funguje
- ✅ Všetky údaje (signatures, damages, vehicleCondition) sa ukladajú
- ✅ Organizovaná štruktúra v R2 storage
- ✅ Detailné loggovanie pre debugging

## 🚀 Nasadenie

```bash
# Backend
cd backend
pnpm run dev  # Development
pnpm run build && pnpm start  # Production

# Frontend
cd ..
pnpm run dev  # Development
pnpm run build  # Production
```

## 📌 Poznámky

- Upload endpoint podporuje **oba** formáty (JSON + multipart) pre kompatibilitu
- Frontend posielá base64 data v JSON body (jednoduchšie než multipart)
- R2 organizácia: `protocols/{protocolId}/{category}/{timestamp}-{filename}`
- Všetky zmeny sú backward-compatible s Express backendom


