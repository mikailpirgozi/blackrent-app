# 🔍 Kompletná analýza: Nahrávanie technického preukazu

## 📋 Obsah
1. [Identifikované problémy](#identifikované-problémy)
2. [Detailná analýza flow](#detailná-analýza-flow)
3. [Všetky možné príčiny zlyhania](#všetky-možné-príčiny-zlyhania)
4. [Implementované opravy](#implementované-opravy)
5. [Testovací checklist](#testovací-checklist)
6. [Debug guide](#debug-guide)

---

## 🚨 Identifikované problémy

### Primárny problém
**Chyba:** `🛡️ Authentication failed, redirecting to login`

**Pôvod:** `apps/web/src/components/auth/ProtectedRoute.tsx:76`

**Význam:** Používateľ NIE JE autentifikovaný v AuthContext, nie je to chyba backendu!

---

## 🔄 Detailná analýza flow

### 1. Session Restore Flow (Pri načítaní stránky)

```
1. App.tsx načíta stránku
   ↓
2. AuthProvider.restoreSession() sa spustí
   ↓
3. StorageManager.getAuthData() načíta token a user
   - Primárne: localStorage.getItem('blackrent_token')
   - Fallback 1: cookies (blackrent_token)
   - Fallback 2: sessionStorage.getItem('blackrent_token')
   ↓
4. Ak token existuje → OPTIMISTIC RESTORE
   - dispatch({ type: 'RESTORE_SESSION' })
   - isAuthenticated = true
   - isLoading = false
   ↓
5. Background validation (validateToken)
   - fetch('/api/auth/me', { Authorization: Bearer ${token} })
   - Ak zlyhá → LOGOUT a redirect na /login
```

### 2. Technical Certificate Upload Flow

```
1. Používateľ klikne "Nahrať TP"
   ↓
2. R2FileUpload komponent
   - Používateľ vyberie súbor(y)
   - handleFileSelect() → compressImage() (ak je obrázok)
   - fetch('/api/r2/upload', { multipart/form-data })
   - Backend uloží do R2 storage
   - Vráti { url, key, filename }
   ↓
3. handleFileUploadSuccess()
   - setUploadedFiles([{ url, key, filename }])
   ↓
4. Používateľ klikne "Uložiť"
   ↓
5. handleSaveTechnicalCertificates()
   - Získa token z localStorage/sessionStorage
   - Pre každý súbor:
     * fetch('/api/vehicle-documents', {
         method: 'POST',
         Authorization: Bearer ${token},
         body: {
           vehicleId,
           documentType: 'technical_certificate',
           validTo: Date + 10 rokov,
           documentNumber,
           notes,
           filePath: file.url
         }
       })
   ↓
6. Backend: /api/vehicle-documents POST
   - authenticateToken middleware
   - checkPermission('vehicles', 'update')
   - Validácia: vehicleId, documentType, validTo
   - postgresDatabase.createVehicleDocument()
   - Vráti { success: true, data: document }
```

---

## 🔍 Všetky možné príčiny zlyhania

### A. AUTENTIFIKÁCIA (Najčastejšie)

#### A1. Token neexistuje v storage
**Príčina:**
- Používateľ sa nikdy neprihlásil
- Token bol vymazaný (logout, clear cache)
- Storage je disabled (private browsing)

**Symptómy:**
```
🔍 Auth data check: { hasToken: false, hasUser: false }
❌ No auth data found
🛡️ Authentication failed, redirecting to login
```

**Riešenie:**
- Používateľ sa musí prihlásiť znova
- Skontrolovať localStorage/sessionStorage v DevTools

#### A2. Token je neplatný (expired/invalid)
**Príčina:**
- JWT token expiroval (default 24h)
- Token bol vytvorený s iným JWT_SECRET
- Token bol manuálne zmenený

**Symptómy:**
```
✅ Session data found for user: admin
🚀 Optimistic session restore - obnovujem okamžite
❌ Background validation: Token is invalid, clearing auth data
🛡️ Authentication failed, redirecting to login
```

**Riešenie:**
- Logout a login znova
- Backend: Skontrolovať JWT_SECRET v .env
- Backend: Skontrolovať token expiration time

#### A3. Backend nie je dostupný
**Príčina:**
- Backend server nie je spustený
- CORS chyba
- Network error

**Symptómy:**
```
⚠️ Background validation error: TypeError: Failed to fetch
```

**Riešenie:**
- Spustiť backend: `cd backend && npm run dev`
- Skontrolovať API URL v .env
- Skontrolovať CORS nastavenia

### B. PERMISSIONS (Menej časté)

#### B1. Používateľ nemá práva na 'vehicles:update'
**Príčina:**
- Používateľ má rolu 'employee' s obmedzenými právami
- Permissions nie sú správne nastavené

**Symptómy:**
```
🔐 Permission check: { resource: 'vehicles', action: 'update', user: { role: 'employee' } }
❌ Permission denied: No user
```

**Riešenie:**
- Skontrolovať user.role v localStorage
- Admin/super_admin má vždy práva
- Employee potrebuje explicitné permissions

### C. VALIDÁCIA (Backend)

#### C1. Chýbajúce povinné polia
**Príčina:**
- vehicleId je undefined/null
- documentType nie je 'technical_certificate'
- validTo je undefined/null

**Symptómy:**
```
❌ Failed to save technical certificate: { status: 400, error: 'vehicleId, documentType a validTo sú povinné polia' }
```

**Riešenie:**
- Skontrolovať že vehicleId je správne nastavené
- Skontrolovať že validTo je Date objekt

#### C2. Neplatný documentType
**Príčina:**
- documentType nie je v type DocumentType = 'stk' | 'ek' | 'vignette' | 'technical_certificate'

**Symptómy:**
```
❌ Database error: invalid input value for enum document_type
```

**Riešenie:**
- Použiť presne 'technical_certificate' (nie 'technical-certificate' alebo 'TP')

### D. R2 FILE UPLOAD (Upload súborov)

#### D1. R2 upload zlyhal
**Príčina:**
- R2 credentials nie sú nastavené
- Network error
- File size limit exceeded

**Symptómy:**
```
🔍 R2 UPLOAD ERROR: Upload zlyhal
❌ No authentication token found (v R2 upload)
```

**Riešenie:**
- Skontrolovať R2 credentials v backend/.env:
  * R2_ACCOUNT_ID
  * R2_ACCESS_KEY_ID
  * R2_SECRET_ACCESS_KEY
  * R2_BUCKET_NAME
- Skontrolovať file size (max 50MB)

#### D2. File URL nie je vrátená
**Príčina:**
- R2 upload vrátil success: false
- onUploadSuccess callback nebol zavolaný

**Symptómy:**
```
📄 Sending request for file: { fileUrl: undefined }
❌ Failed to save technical certificate: { error: 'filePath is required' }
```

**Riešenie:**
- Skontrolovať R2FileUpload console logy
- Overiť že onUploadSuccess je správne implementovaný

### E. DATABASE (PostgreSQL)

#### E1. Vehicle neexistuje
**Príčina:**
- vehicleId odkazuje na neexistujúce vozidlo
- Foreign key constraint violation

**Symptómy:**
```
❌ Database error: insert or update on table "vehicle_documents" violates foreign key constraint
```

**Riešenie:**
- Skontrolovať že vozidlo existuje v databáze
- Skontrolovať že vehicleId je správne UUID

#### E2. Database connection error
**Príčina:**
- PostgreSQL nie je spustený
- DATABASE_URL je nesprávna
- Connection pool je vyčerpaný

**Symptómy:**
```
❌ Create vehicle document error: connection refused
```

**Riešenie:**
- Skontrolovať DATABASE_URL v backend/.env
- Reštartovať PostgreSQL
- Skontrolovať connection pool settings

### F. CORS & NETWORK

#### F1. CORS error
**Príčina:**
- Frontend a backend sú na rôznych doménach
- CORS nie je správne nastavený

**Symptómy:**
```
Access to fetch at 'http://localhost:3000/api/vehicle-documents' from origin 'http://localhost:5173' has been blocked by CORS policy
```

**Riešenie:**
- Backend: Skontrolovať CORS middleware v index.ts
- Povoliť origin: http://localhost:5173

#### F2. API URL je nesprávna
**Príčina:**
- VITE_API_URL nie je nastavená
- getApiBaseUrl() vracia nesprávnu URL

**Symptómy:**
```
TypeError: Failed to fetch
```

**Riešenie:**
- Skontrolovať .env:
  * VITE_API_URL=http://localhost:3000/api
- Reštartovať Vite dev server

---

## ✅ Implementované opravy

### 1. Lepšia validácia tokenu (TechnicalCertificateUpload.tsx)
```typescript
const token = localStorage.getItem('blackrent_token') || sessionStorage.getItem('blackrent_token');

if (!token) {
  logger.error('❌ No authentication token found');
  alert('Nie ste prihlásený. Prosím prihláste sa znova.');
  return;
}
```

### 2. Detailné error logging
```typescript
logger.debug('📄 Saving technical certificates:', {
  vehicleId,
  documentName,
  fileCount: uploadedFiles.length,
  hasToken: !!token,
  tokenLength: token.length,
});

logger.debug('📄 Response from server:', {
  index,
  status: response.status,
  ok: response.ok,
  success: result.success,
  error: result.error,
});
```

### 3. Lepšie error messages pre používateľa
```typescript
alert(
  `Uložených ${successfulSaves.length}/${uploadedFiles.length} súborov.\n\nChyby:\n${failedSaves.map(r => r.error).join('\n')}`
);
```

### 4. Odstránená podmienená autorizácia
```typescript
// PRED:
...(token && { Authorization: `Bearer ${token}` })

// PO:
Authorization: `Bearer ${token}`
```

---

## 🧪 Testovací checklist

### Pre-test setup
- [ ] Backend je spustený (`cd backend && npm run dev`)
- [ ] Frontend je spustený (`npm run dev`)
- [ ] PostgreSQL je spustený
- [ ] R2 credentials sú nastavené v backend/.env
- [ ] Používateľ je prihlásený (admin/Black123)

### Test 1: Základný upload
1. [ ] Otvor aplikáciu v prehliadači
2. [ ] Prihlás sa ako admin
3. [ ] Otvor DevTools Console (F12)
4. [ ] Prejdi na Vozidlá
5. [ ] Vyber vozidlo
6. [ ] Klikni "Nahrať TP"
7. [ ] Vyber PDF alebo obrázok
8. [ ] Zadaj názov dokumentu
9. [ ] Klikni "Uložiť"
10. [ ] Skontroluj console logy

**Očakávaný výsledok:**
```
📄 Saving technical certificates: { vehicleId: '...', fileCount: 1, hasToken: true }
📄 Sending request for file: { index: 0, documentName: '...', fileUrl: 'https://...' }
📄 Response from server: { status: 201, ok: true, success: true }
✅ All technical certificates saved successfully
```

### Test 2: Multiple files
1. [ ] Klikni "Nahrať TP"
2. [ ] Vyber viacero súborov (PDF + obrázky)
3. [ ] Zadaj názov dokumentu
4. [ ] Klikni "Uložiť"
5. [ ] Skontroluj že všetky súbory boli uložené

### Test 3: Error handling
1. [ ] Odhlás sa (logout)
2. [ ] Skús nahrať TP
3. [ ] Skontroluj že sa zobrazí "Nie ste prihlásený"

### Test 4: Token expiration
1. [ ] Prihlás sa
2. [ ] V DevTools Application → Local Storage → vymaž `blackrent_token`
3. [ ] Skús nahrať TP
4. [ ] Skontroluj že sa zobrazí "Nie ste prihlásený"

---

## 🐛 Debug guide

### Krok 1: Skontroluj autentifikáciu
```javascript
// V browser console:
console.log('Token:', localStorage.getItem('blackrent_token'));
console.log('User:', JSON.parse(localStorage.getItem('blackrent_user')));
```

**Ak token neexistuje:**
- Prihlás sa znova
- Skontroluj že login funguje

**Ak token existuje:**
- Pokračuj na Krok 2

### Krok 2: Testuj token validation
```javascript
// V browser console:
const token = localStorage.getItem('blackrent_token');
fetch('http://localhost:3000/api/auth/me', {
  headers: { Authorization: `Bearer ${token}` }
})
.then(r => r.json())
.then(d => console.log('Token validation:', d));
```

**Ak vracia 401/403:**
- Token je neplatný
- Prihlás sa znova

**Ak vracia 200:**
- Token je platný
- Pokračuj na Krok 3

### Krok 3: Testuj vehicle-documents endpoint
```javascript
// V browser console:
const token = localStorage.getItem('blackrent_token');
const vehicleId = 'PASTE_VEHICLE_ID_HERE'; // Získaj z vozidiel

fetch('http://localhost:3000/api/vehicle-documents', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${token}`
  },
  body: JSON.stringify({
    vehicleId,
    documentType: 'technical_certificate',
    validTo: new Date(Date.now() + 10 * 365 * 24 * 60 * 60 * 1000).toISOString(),
    documentNumber: 'TEST TP',
    notes: 'Test',
    filePath: 'https://example.com/test.pdf'
  })
})
.then(r => r.json())
.then(d => console.log('Create document:', d));
```

**Ak vracia 401/403:**
- Permission error
- Skontroluj user role

**Ak vracia 400:**
- Validation error
- Skontroluj request body

**Ak vracia 201:**
- Success! Problém je v UI komponente
- Pokračuj na Krok 4

### Krok 4: Debug R2 upload
```javascript
// V browser console:
// Pozri R2FileUpload console logy:
// 🔍 R2 UPLOAD START
// 🔍 R2 UPLOAD - Response status
// 🔍 R2 UPLOAD - Response data
// 🔍 R2 CALLBACK - Calling onUploadSuccess
```

**Ak R2 upload zlyhá:**
- Skontroluj R2 credentials
- Skontroluj network tab

### Krok 5: Debug TechnicalCertificateUpload
```javascript
// V browser console:
// Pozri TechnicalCertificateUpload logy:
// 📄 Saving technical certificates
// 📄 Sending request for file
// 📄 Response from server
```

**Ak vidíš chyby:**
- Skontroluj error message
- Použi tento dokument na identifikáciu príčiny

---

## 🎯 Najčastejšie riešenia

### 1. "Authentication failed"
**Riešenie:** Prihlás sa znova (admin/Black123)

### 2. "Some technical certificates failed to save"
**Riešenie:** Pozri console logy pre konkrétne chyby

### 3. "Upload zlyhal"
**Riešenie:** Skontroluj R2 credentials v backend/.env

### 4. "vehicleId, documentType a validTo sú povinné polia"
**Riešenie:** Skontroluj že vozidlo je vybrané

### 5. "Permission denied"
**Riešenie:** Prihlás sa ako admin alebo super_admin

---

## 📊 Monitoring & Logging

### Frontend logs (Browser Console)
```
📄 Saving technical certificates: { ... }
📄 Sending request for file: { ... }
📄 Response from server: { ... }
✅ All technical certificates saved successfully
```

### Backend logs (Terminal)
```
🔍 AUTH MIDDLEWARE - Starting auth check
✅ AUTH MIDDLEWARE - Authentication successful
🔐 Permission check: { resource: 'vehicles', action: 'update' }
✅ Admin access granted
📄 Technical certificate upload request: { ... }
✅ Technical certificate saved to database: { id: '...' }
```

---

## 🚀 Production deployment checklist

- [ ] R2 credentials sú nastavené v Railway
- [ ] DATABASE_URL je správna
- [ ] JWT_SECRET je nastavený (nie default)
- [ ] CORS je nastavený pre production domain
- [ ] API_URL je nastavená na production URL
- [ ] Logs sú monitorované (Railway dashboard)
- [ ] Error tracking je aktívny (Sentry)

---

## 📝 Poznámky

### Token expiration
- Default: 24 hodín
- Nastavené v: `backend/src/routes/auth.ts`
- Zmeniť: `expiresIn: '24h'` → `expiresIn: '7d'`

### R2 storage limits
- Max file size: 50MB
- Supported types: PDF, JPEG, PNG, WEBP
- Compression: Obrázky sú automaticky komprimované na 80% kvality

### Database schema
```sql
CREATE TABLE vehicle_documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  vehicle_id UUID NOT NULL REFERENCES vehicles(id),
  document_type VARCHAR(50) NOT NULL, -- 'technical_certificate'
  valid_from DATE,
  valid_to DATE NOT NULL,
  document_number VARCHAR(100),
  price DECIMAL(10,2),
  notes TEXT,
  file_path VARCHAR(500),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

---

**Vytvorené:** 2025-01-25  
**Autor:** Cursor AI Assistant  
**Verzia:** 1.0  
**Status:** ✅ Kompletné

