# 📄 COMPANY DOCUMENTS - Správa dokumentov majiteľov vozidiel

## 🎯 Prehľad funkcionality

Nová funkcionalita umožňuje majiteľom vozidiel nahrávať a spravovať dokumenty priamo v BlackRent aplikácii:
- **Zmluvy o spolupráci** - základné zmluvy medzi BlackRent a majiteľom
- **Faktúry** - organizované po mesiacoch a rokoch pre lepšie sledovanie

## 📊 Databázová štruktúra

### Tabuľka `company_documents`
```sql
CREATE TABLE company_documents (
  id UUID PRIMARY KEY,
  company_id UUID REFERENCES companies(id),
  document_type VARCHAR(20) CHECK (document_type IN ('contract', 'invoice')),
  document_month INTEGER (1-12), -- len pre faktúry
  document_year INTEGER (2020-2099), -- len pre faktúry
  document_name VARCHAR(255) NOT NULL,
  description TEXT,
  file_path TEXT NOT NULL, -- R2 storage URL
  file_size BIGINT,
  file_type VARCHAR(100),
  original_filename VARCHAR(255),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  created_by UUID REFERENCES users(id)
);
```

## 🗂️ R2 Storage organizácia

Súbory sú organizované v Cloudflare R2 storage:

### Zmluvy o spolupráci
```
companies/contracts/{company_id}/{YYYY-MM-DD}/{filename}
```

### Faktúry (organizované po mesiacoch)
```
companies/invoices/{company_id}/{YYYY}/{MM}/{filename}
```

## 🔧 Backend API endpointy

### Upload dokumentu
```http
POST /api/company-documents/upload
Content-Type: multipart/form-data

file: File
companyId: string
documentType: 'contract' | 'invoice'
documentName: string
description?: string
documentMonth?: number (1-12, povinné pre faktúry)
documentYear?: number (povinné pre faktúry)
```

### Uloženie metadata
```http
POST /api/company-documents/save-metadata
Content-Type: application/json

{
  "companyId": "uuid",
  "documentType": "contract|invoice",
  "documentName": "string",
  "description": "string",
  "filePath": "string",
  "documentMonth": number, // len pre faktúry
  "documentYear": number   // len pre faktúry
}
```

### Získanie dokumentov
```http
GET /api/company-documents/{companyId}
Query params:
  - documentType?: 'contract' | 'invoice'
  - year?: number
  - month?: number
```

### Zmazanie dokumentu
```http
DELETE /api/company-documents/{documentId}
```

## 🎨 Frontend komponenty

### `CompanyDocumentManager`
Hlavný komponent pre správu dokumentov majiteľa:
- Upload nových dokumentov
- Zobrazenie existujúcich dokumentov
- Organizácia faktúr po mesiacoch
- Možnosť mazania a prezerania dokumentov

### Integrácia do `OwnerCard`
Komponent je integrovaný do existujúceho `OwnerCard` komponentu v sekcii "Správa majiteľov vozidiel".

## 📱 Používateľské rozhranie

### Prístup k funkcionalite
1. Choď na `/vehicles` 
2. Klikni na tab "Majitelia"
3. Rozbaľ kartu konkrétneho majiteľa
4. Nájdi sekciu "📄 Dokumenty majiteľa"

### Upload dokumentu
1. Klikni "Pridať dokument"
2. Vyber typ dokumentu (Zmluva/Faktúra)
3. Zadaj názov dokumentu
4. Pre faktúry vyber mesiac a rok
5. Nahraj súbor (PDF, obrázky)
6. Klikni "Uložiť dokument"

### Prezeranie dokumentov
- **Zmluvy** - zoznam všetkých zmlúv s možnosťou prezerania a mazania
- **Faktúry** - organizované podľa rokov a mesiacov pre lepšiu orientáciu

## 🔐 Permissions

Funkcionalita využíva existujúci permission systém:
- `companies.read` - prezeranie dokumentov
- `companies.update` - nahrávanie nových dokumentov  
- `companies.delete` - mazanie dokumentov

## 🚀 Technické detaily

### File types podporované
- PDF dokumenty (`application/pdf`)
- Obrázky (`image/jpeg`, `image/png`, `image/webp`)
- Maximálna veľkosť: 50MB

### R2 Storage konfigurácia
Používa existujúcu R2 konfiguráciu z `backend/src/utils/r2-storage.ts`:
- Automatický fallback na lokálne storage pre development
- Kompresiu obrázkov
- Validáciu typov súborov

### Bezpečnosť
- Autentifikácia cez JWT tokeny
- Permission checking pre všetky operácie
- Validácia súborov na backend strane
- Cascade delete pri zmazaní firmy

## 🧪 Testovanie

### Manuálne testovanie
1. Spusti aplikáciu: `npm run dev:full`
2. Prihlás sa ako admin
3. Choď na `/vehicles` → tab "Majitelia"
4. Vyber majiteľa a otestuj upload dokumentov

### Automatické testy
```bash
# Backend build test
cd backend && npm run build

# Frontend build test  
npm run build
```

## 🔄 Migrácia

Databázová migrácia sa aplikuje automaticky pri štarte backendu.
Migračný súbor: `database/migrations/create-company-documents-table.sql`

## 📋 Ďalšie možnosti rozšírenia

1. **Bulk upload** - nahrávanie viacerých súborov naraz
2. **Document templates** - šablóny pre zmluvy
3. **Expiration tracking** - sledovanie platnosti dokumentov
4. **Document versioning** - verzie dokumentov
5. **Digital signatures** - elektronické podpisy
6. **Audit trail** - detailné sledovanie zmien
