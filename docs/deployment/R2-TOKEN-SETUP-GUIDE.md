# 🔑 CLOUDFLARE R2 API TOKEN SETUP

## ❌ Aktuálny problém:
```
R2 upload failed: Unauthorized
```

## 🎯 Riešenie - Vytvorenie nového R2 API token:

### 1. Choď na Cloudflare Dashboard
```
URL: https://dash.cloudflare.com
```

### 2. R2 Object Storage
1. Klikni na **R2 Object Storage**
2. Klikni na **Manage API Tokens**

### 3. Vytvor nový token
1. Klikni **Create Token**
2. **Token name**: `blackrent-storage-token`
3. **Permissions**:
   - ✅ **Object:Read**
   - ✅ **Object:Write** 
   - ✅ **Object:Delete**
4. **Resources**:
   - **Account**: All accounts
   - **Zone**: All zones  
   - **Bucket**: `blackrent-storage`

### 4. Skopíruj credentials
Po vytvorení token-u dostaneš:
- **Access Key ID**: `xxxxx`
- **Secret Access Key**: `xxxxx`

### 5. Aktualizuj backend/.env
```bash
R2_ACCESS_KEY_ID=new-access-key-id
R2_SECRET_ACCESS_KEY=new-secret-access-key
```

### 6. Reštartuj backend
```bash
cd backend && npm start
```

## 🧪 Testovanie:
```bash
curl -X POST -F "file=@test.pdf" -F "type=company-document" -F "entityId=29" "http://localhost:3001/api/files/upload"
```

**Očakávaný výsledok:**
```json
{
  "success": true,
  "url": "https://pub-xxx.r2.dev/companies/documents/29/2025-08-19/test.pdf"
}
```

## 🚨 Dôležité:
- **Žiadny fallback** na local storage
- Ak R2 zlyhá, upload zlyhá
- Nutné mať správne R2 credentials
