# ☁️ Cloudflare R2 Storage Setup - BlackRent

## 🎯 Prečo Cloudflare R2?

- ✅ **90% lacnejší** než AWS S3
- ✅ **Žiadne egress poplatky** - download zdarma
- ✅ **Globálny CDN** zadarmo
- ✅ **S3-kompatibilné API**
- ✅ **Ultra-rýchle** načítavanie fotiek

## 💰 Cena porovnanie:

```
Cloudflare R2:     $0.015/GB/mesiac + $0 egress
AWS S3:           $0.023/GB/mesiac + $0.09/GB egress  
= R2 je 6x lacnejší
```

## 📋 Nastavenie krok za krokom

### 1. Registrácia Cloudflare

1. Choď na [cloudflare.com](https://cloudflare.com)
2. **Sign up** / **Log in**
3. Dashboard → **R2 Object Storage**
4. **Purchase R2** (má FREE tier)

### 2. Vytvorenie Bucket

1. **Create bucket**
2. **Bucket name:** `blackrent-storage`
3. **Location:** Automatic (global)
4. **Create bucket**

### 3. API Token vytvorenie

1. **R2 → Manage API Tokens**
2. **Create Token**
3. **Permissions:**
   - ✅ Object:Edit
   - ✅ Object:Read
4. **Bucket:** blackrent-storage
5. **Create Token** → **Skopíruj token**

### 4. Connection Details

Po vytvorení bucket-u:
1. **Settings** tab
2. Skopíruj:
   - **Endpoint URL**: `https://xxx.r2.cloudflarestorage.com`
   - **Bucket name**: `blackrent-storage`
   - **Account ID**: `your-account-id`

## 🔧 Backend integrácia

### Environment Variables (Railway):

```bash
# Cloudflare R2 Storage
R2_ENDPOINT=https://xxx.r2.cloudflarestorage.com
R2_BUCKET_NAME=blackrent-storage
R2_ACCESS_KEY_ID=your-access-key
R2_SECRET_ACCESS_KEY=your-secret-key
R2_ACCOUNT_ID=your-account-id
R2_PUBLIC_URL=https://blackrent-storage.xxx.r2.dev
```

### Postup nastavenia v Railway:

1. **Railway project** → **Variables**
2. Pridaj všetky premenné vyššie
3. **Redeploy** backend

## 📁 Štruktúra súborov v R2:

```
blackrent-storage/
├── vehicles/
│   ├── photos/
│   │   ├── {vehicle_id}/
│   │   │   ├── main.jpg
│   │   │   ├── interior-1.jpg
│   │   │   └── exterior-1.jpg
├── protocols/
│   ├── handover/
│   │   └── {protocol_id}/
│   │       ├── signature.png
│   │       ├── vehicle-photos/
│   │       └── damage-photos/
│   ├── return/
├── documents/
│   ├── rentals/
│   │   └── {rental_id}/
│   │       ├── contract.pdf
│   │       └── invoice.pdf
└── temp/
    └── uploads/
```

## 🚀 API Endpoints (automaticky sa vytvoria):

```bash
# Upload vehicle photo
POST /api/vehicles/{id}/photos

# Upload protocol signature  
POST /api/protocols/{id}/signature

# Upload rental document
POST /api/rentals/{id}/documents

# Get file URL
GET /api/files/{fileId}/url
```

## 🌍 Public URL nastavenie:

1. **R2 bucket** → **Settings**
2. **Custom domain** → **Connect domain**
3. **Domain:** `files.blackrent.sk` (voliteľné)
4. **Enable** public access pre bucket

## 🧪 Testovanie:

```bash
# Test upload
curl -X POST https://your-railway-backend/api/test-upload \
  -F "file=@test-image.jpg"

# Test download
curl https://blackrent-storage.xxx.r2.dev/vehicles/photos/1/main.jpg
```

## 📊 Monitoring a správa:

### Cloudflare Dashboard:
- **Usage analytics** - koľko dát používate
- **Request analytics** - počet API volań
- **Cost tracking** - mesačné náklady

### Súbory management:
- **Automatic cleanup** - staré temp súbory
- **Image optimization** - automatická kompresia
- **Access controls** - kto má prístup

## 🔒 Bezpečnosť:

### Povolené súbory:
```javascript
const allowedTypes = [
  'image/jpeg',
  'image/png', 
  'image/webp',
  'application/pdf',
  'image/svg+xml'
];
```

### Max veľkosť:
- **Images**: 10MB
- **Documents**: 50MB
- **Total per rental**: 200MB

## 💡 Výhody po nastavení:

- 🖼️ **Rýchle** načítanie fotiek vozidiel
- ✍️ **Digitálne podpisy** v protokoloch
- 📄 **PDF dokumenty** (zmluvy, faktúry)  
- 📱 **Mobile upload** - fotky z telefónu
- 🔄 **Automatické zálohovanie**
- 🌍 **CDN** - rýchle z celého sveta

---

**🎯 Po nastavení R2 budú všetky fotky a dokumenty uložené profesionálne v cloude!** 