# 🐛 Debug Guide: Technical Certificate Upload

## 🚀 Rýchly start

Ak máte problém s nahrávaním technického preukazu, postupujte takto:

### 1. Spustite automatický debug script

1. Otvorte aplikáciu v prehliadači
2. Stlačte **F12** (otvorí DevTools)
3. Prejdite na záložku **Console**
4. Skopírujte celý obsah súboru `debug-technical-certificate.js`
5. Vložte do console a stlačte Enter

Script automaticky otestuje všetky kroky a identifikuje problém.

### 2. Prečítajte si výsledky

Script zobrazí výsledky pre každý krok:

```
✅ - Všetko OK
⚠️  - Varovanie (nie kritické)
❌ - Chyba (musí byť opravená)
⏭️ - Preskočené (kvôli predchádzajúcej chybe)
```

### 3. Opravte identifikované problémy

Podľa výsledkov postupujte podľa návodu nižšie.

---

## 📋 Najčastejšie problémy a riešenia

### ❌ "Token not found in localStorage"

**Problém:** Nie ste prihlásený alebo token bol vymazaný.

**Riešenie:**
1. Odhlás sa (ak si prihlásený)
2. Prihlás sa znova s credentials:
   - Username: `admin`
   - Password: `Black123`

---

### ❌ "Token is EXPIRED"

**Problém:** Token expiroval (default 24 hodín).

**Riešenie:**
1. Logout
2. Login znova

---

### ❌ "Token validation failed: 401 Unauthorized"

**Problém:** Token je neplatný alebo backend ho nerozpoznáva.

**Možné príčiny:**
- JWT_SECRET sa zmenil na backende
- Token bol vytvorený na inom serveri
- Token bol manuálne zmenený

**Riešenie:**
1. Logout
2. Login znova
3. Ak problém pretrváva, skontrolujte backend JWT_SECRET

---

### ❌ "API connection error: Failed to fetch"

**Problém:** Backend server nie je dostupný.

**Riešenie:**

**Pre lokálny development:**
```bash
cd backend
npm run dev
```

**Pre production:**
- Skontrolujte Railway dashboard
- Skontrolujte že aplikácia beží
- Skontrolujte logy

---

### ❌ "User does NOT have vehicle:update permission"

**Problém:** Používateľ nemá práva na úpravu vozidiel.

**Riešenie:**
1. Prihlás sa ako `admin` alebo `super_admin`
2. Alebo kontaktuj administrátora pre pridanie práv

---

### ❌ "No vehicles found in database"

**Problém:** V databáze nie sú žiadne vozidlá.

**Riešenie:**
1. Prejdi na stránku Vozidlá
2. Vytvor aspoň jedno vozidlo
3. Skús znova nahrať technický preukaz

---

### ❌ "Failed to create test document: 400"

**Problém:** Validačná chyba na backende.

**Možné príčiny:**
- `vehicleId` je neplatné
- `documentType` nie je 'technical_certificate'
- `validTo` nie je Date

**Riešenie:**
1. Skontroluj console logy pre detaily
2. Skontroluj že vozidlo existuje
3. Skontroluj request body v Network tab

---

## 🔍 Manuálny debug

Ak automatický script nepomôže, môžete debugovať manuálne:

### Krok 1: Skontroluj token

```javascript
// V browser console:
const token = localStorage.getItem('blackrent_token');
console.log('Token:', token);

// Decode JWT
const payload = JSON.parse(atob(token.split('.')[1]));
console.log('Payload:', payload);
console.log('Expires:', new Date(payload.exp * 1000));
```

### Krok 2: Testuj /auth/me endpoint

```javascript
const token = localStorage.getItem('blackrent_token');
fetch('http://localhost:3000/api/auth/me', {
  headers: { Authorization: `Bearer ${token}` }
})
.then(r => r.json())
.then(d => console.log('Auth me:', d));
```

### Krok 3: Testuj /vehicles endpoint

```javascript
const token = localStorage.getItem('blackrent_token');
fetch('http://localhost:3000/api/vehicles', {
  headers: { Authorization: `Bearer ${token}` }
})
.then(r => r.json())
.then(d => console.log('Vehicles:', d));
```

### Krok 4: Testuj /vehicle-documents POST

```javascript
const token = localStorage.getItem('blackrent_token');
const vehicleId = 'PASTE_VEHICLE_ID_HERE';

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

---

## 📊 Monitoring console logs

Pri nahrávaní technického preukazu sledujte tieto logy:

### Frontend logs (Browser Console)

**R2 Upload:**
```
🔍 R2 UPLOAD START: { file: '...', size: ..., type: '...' }
🔍 R2 UPLOAD - Response status: 200
🔍 R2 UPLOAD - Response data: { success: true, url: '...', key: '...', filename: '...' }
🔍 R2 CALLBACK - Calling onUploadSuccess with single file: { url: '...', key: '...', filename: '...' }
```

**Technical Certificate Save:**
```
📄 Saving technical certificates: { vehicleId: '...', documentName: '...', fileCount: 1, hasToken: true, tokenLength: 123 }
📄 Sending request for file: { index: 0, documentName: '...', fileUrl: 'https://...' }
📄 Response from server: { index: 0, status: 201, ok: true, success: true, error: undefined }
✅ All technical certificates saved successfully
```

### Backend logs (Terminal)

**Authentication:**
```
🔍 AUTH MIDDLEWARE - Starting auth check
🔍 AUTH MIDDLEWARE - Auth header exists: true
🔍 AUTH MIDDLEWARE - Token extracted: true
🔍 AUTH MIDDLEWARE - JWT decoded successfully: { userId: '...', username: 'admin', role: 'admin' }
🔍 AUTH MIDDLEWARE - Getting user from database...
🔍 AUTH MIDDLEWARE - Database user result: { found: true, id: '...', username: 'admin', role: 'admin' }
✅ AUTH MIDDLEWARE - Authentication successful
```

**Permissions:**
```
🔐 Permission check: { resource: 'vehicles', action: 'update', user: { id: '...', username: 'admin', role: 'admin' } }
🔥 MIDDLEWARE: Admin access granted { username: 'admin', role: 'admin' }
✅ Admin access granted
```

**Vehicle Document Creation:**
```
📄 Technical certificate upload request: { hasFile: false, body: { vehicleId: '...', documentType: 'technical_certificate', ... } }
✅ Technical certificate saved to database: { id: '...' }
```

---

## 🛠️ Advanced debugging

### Enable verbose logging

V `apps/web/src/utils/smartLogger.ts` zmeň:

```typescript
const LOG_LEVEL = 'debug'; // Zobrazí všetky logy
```

### Check Network tab

1. Otvor DevTools (F12)
2. Prejdi na záložku **Network**
3. Filter: **Fetch/XHR**
4. Skús nahrať technický preukaz
5. Pozri všetky requesty:
   - `/api/r2/upload` - Upload súboru
   - `/api/vehicle-documents` - Vytvorenie dokumentu

### Check Application tab

1. Otvor DevTools (F12)
2. Prejdi na záložku **Application**
3. V ľavom menu:
   - **Local Storage** → Skontroluj `blackrent_token` a `blackrent_user`
   - **Session Storage** → Skontroluj fallback storage
   - **Cookies** → Skontroluj `blackrent_token` cookie

---

## 📞 Kontakt

Ak problém pretrváva aj po vykonaní všetkých krokov:

1. Skopíruj výstup z debug scriptu
2. Skopíruj console logy (všetky červené chyby)
3. Urob screenshot Network tabu
4. Kontaktuj support s týmito informáciami

---

## 📚 Ďalšie zdroje

- [Kompletná analýza](./TECHNICAL_CERTIFICATE_UPLOAD_COMPLETE_ANALYSIS.md) - Detailný popis všetkých možných príčin
- [Backend API dokumentácia](../backend/README.md) - API endpoints
- [Frontend architektúra](./FRONTEND_ARCHITECTURE.md) - Štruktúra aplikácie

---

**Vytvorené:** 2025-01-25  
**Verzia:** 1.0  
**Status:** ✅ Kompletné

