# BlackRent – Kľúčové rozhodnutia

## 🔧 Tech Stack rozhodnutia

### Frontend: Vite + React (nie CRA)
**Rozhodnutie:** Vite namiesto Create React App
**Dôvody:**
- Rýchlejší dev server (HMR)
- Lepší build performance
- Modern ES modules
- Tree shaking out-of-the-box

**Konfigurácia:** `vite.config.ts`
- Proxy `/api -> localhost:3001`
- Alias `@ -> src/`
- Manual chunks (vendor, mui, utils)

### Testing: Vitest (nie Jest)
**Rozhodnutie:** Vitest framework
**Dôvody:**
- Rýchlejší než Jest
- Native Vite integrácia
- Lepšia ESM podpora

**Konfigurácia:** `vitest.config.ts`
- Environment: jsdom
- Exclude: customer-website, Figma-Context-MCP

### Database: PostgreSQL (Railway)
**Rozhodnutie:** PostgreSQL namiesto SQLite
**Dôvody:**
- Production škálovateľnosť
- Advanced constraints
- JSON/JSONB podpora
- Multi-tenant support

**Connection:** trolley.proxy.rlwy.net:13400
**Aktuálny stav:** 34 companies, 111 vehicles, 13 rentals

## 🏗️ Architektúrne patterns

### API Design: REST + Zod validation
**Pattern:** RESTful endpoints s Zod schemas
**Validácia:** Input/output na "hraniciach"
**Error handling:** Centralized middleware
**Error model (štandard):**
```json
{ "code": "VALIDATION_ERROR", "message": "pricePerKm must be >= 0", "details": {...}, "requestId": "…" }
```
- 4xx: chyba klienta; 5xx: chyba servera; vždy vráť `requestId`.

### State Management: React Context (nie Redux)
**Rozhodnutie:** Vanilla React Context
**Dôvody:**
- Jednoduchšie pre malé/stredné app
- Menej boilerplate
- Lepšia TypeScript integrácia

### File Storage: Cloudflare R2 (nie AWS S3)
**Rozhodnutie:** R2 namiesto S3
**Dôvody:**
- Nižšie náklady
- Lepšia performance v EU
- S3-compatible API

**Upload pattern:** Presigned URLs (15 min expiry)

### PDF Generation: PDF-lib + Puppeteer fallback
**Primary:** PDF-lib (lightweight, fast)
**Fallback:** Puppeteer (complex layouts)
**Storage:** Generated PDFs → R2 storage

## 📁 Naming konvencie

### Súbory a priečinky
- **Komponenty:** PascalCase (`RentalForm.tsx`)
- **Utilities:** camelCase (`apiPath.ts`)
- **Folders:** kebab-case (cieľový stav; zavádzame postupne)
- **Migrations plán:**
  - fáza 1: nové priečinky už len kebab-case
  - fáza 2: presun legacy priečinkov + aliasy v `tsconfig`/`vite.config`
  - fáza 3: odstrániť aliasy po stabilizácii

### Database
- **Tables:** snake_case (`rental_status`)
- **Columns:** snake_case (`owner_company_id`)
- **Foreign keys:** `table_id` pattern

### API
- **Endpoints:** RESTful + camelCase JSON
- **Routes:** `/api/vehicles/:id`
- **Response:** Consistent JSON structure

## 🎛️ Feature Flags systém

### Implementácia
**Súbor:** `src/lib/flags.ts`
**Pattern:** `VITE_FLAG_*` environment premenné
**Helper:** `flag(name, fallback)` funkcia (pozor na string→boolean)
```ts
export function flag(name: string, fallback=false) {
  const v = (import.meta.env as any)[`VITE_FLAG_${name}`]
  if (v === '1' || v === 'true') return true
  if (v === '0' || v === 'false') return false
  return fallback
}
```

### Použitie
```typescript
// .env.local
VITE_FLAG_EXTRA_KM=true

// Kód
if (flag('EXTRA_KM')) {
  // Nova funkcionalita
}
```

### Debug
- Development: Auto-log active flags
- getAllFlags() pre debugging

## 🔒 Security rozhodnutia

### Authentication
**Pattern:** JWT tokens + Role-based access
**Roles:** admin, employee, temp_worker, mechanic, sales_rep, company_owner
**Session:** Memory-based (nie localStorage). Ak treba persistenciu, používaj httpOnly cookies.

### Environment
**Rozhodnutie:** Strict environment separation
- **Secrets:** Nie v Git, iba ENV variables
- **API keys:** Railway environment
- **Local:** `.env.local` súbor

### File Upload
**Security:** Presigned URLs namiesto direct upload
**Expiry:** 15 minút maximum
**Validation:** File type + size limits

## 📊 Performance rozhodnutia

### Frontend optimalizácie
- **Lazy loading:** Route-based code splitting
- **Image optimization:** WebP + lazy loading
- **Bundle splitting:** Manual chunks (vendor, mui, utils)
- **Lint/format:** ESLint + Prettier mandatory (CI step).

### Backend optimalizácie  
- **Database indexy:** Pre frequent queries
- **Caching:** API response caching
- **Compression:** Gzip middleware

### Progressive loading
**Availability calendar:** 271 dní v 3 fázach
- Fáza 1: Current month (31 dní)
- Fáza 2: Past data (82 dní)
- Fáza 3: Future data (158 dní)

## 🚀 Deployment rozhodnutia

### Hosting
- **Backend + DB:** Railway
- **Customer website:** Vercel
- **File storage:** Cloudflare R2

### CI/CD
**Pipeline:** GitHub push → Railway auto-deploy
**Build validation:** Frontend + backend builds musia prejsť
**Testing:** Manual testing pred push

### Environment strategy
- **Development:** localhost:3000/3001/3002
- **Staging:** Railway preview
- **Production:** Railway production + custom domains

## 📱 Mobile & PWA

### Responzivita
**Interná app:** Material-UI breakpoints
**Customer website:** Custom breakpoints (1728/1440/744/360px)

### PWA features
- **Service Worker:** Offline support
- **Install prompt:** Available ale nie auto-popup
- **Caching:** Static assets + API responses
- **Dátum/čas (štandard):** všetko ukladáme v UTC na backend; FE zobrazuje v lokále používateľa.
- **Meny (štandard):** ceny držíme v **cents** (integery), formátovanie cez `Intl.NumberFormat`.

## 🔄 Real-time updates

### WebSocket
**Library:** Socket.io v4.7.5
**Use cases:**
- Availability updates
- Email parsing notifications
- Protocol completion alerts

### Email integration
**IMAP:** Real-time email monitoring
**SMTP:** Protocol delivery, notifications
**Parsing:** Automatic rental creation

## 🧪 Testing strategy

### Unit testing
**Framework:** Vitest + Testing Library
**Coverage:** Business logic functions
**Mocking:** API calls, file operations

### Integration testing
**Scope:** API endpoints
**Database:** Staging environment
**TODO:** Overiť či existujú integration testy

### E2E testing
**Status:** Nie implementované
**TODO:** Cypress alebo Playwright pre critical flows

## 🔮 Architectural debt

### Známe problémy
1. **Folder naming:** Nekonzistentné kebab-case
2. **Console logs:** 50+ debug riadkov pri štarte
3. **Memory usage:** Progressive loading impact
4. **Migration speed:** 30-60s backend startup

### Plánované refaktoring
1. **Snapshot pattern:** Pre historical data integrity
2. **API caching:** Redis alebo in-memory cache
3. **Database optimization:** Query performance tuning
4. **Bundle optimization:** Further code splitting

**TODO:** Prioritizovať architectural debt items.