# BlackRent – Architektúra (Overview)

## 1. Ciele
- Rýchla interná appka pre operátorov (Vite, SPA).
- Stabilná správa protokolov (fotky, videá, PDF, podpisy).
- Jednoduché nasadenie (Railway backend + Cloudflare R2 storage).
- Bezbolestné zmeny (feature flags, malé kroky, testy).

## 2. Štruktúra systému
```
[UI - Vite/React] --fetch--> [Backend API] --SQL--> [PostgreSQL (Railway)]
        |                         |
        |                         +--S3 API--> [Cloudflare R2]
        |                                     (media: photos/video/pdf)
        |
        +--download/view--> [R2 public/CDN presigned]
```

## 3. Frontend (Vite/React/TS)
- **Bundler/dev:** Vite, HMR, alias `@ -> src/`.
- **Testy:** Vitest + Testing Library (jsdom).
- **Validácia:** Zod na „hraniciach" (API vstupy/výstupy).
- **Feature flags:** `import.meta.env.VITE_FLAG_*` + helper `flag(name)`.
- **Env:** `src/lib/env.ts` (centrálne čítanie `VITE_*`).
- **API helper:** `apiPath('/endpoint')` z `src/utils/apiPath.ts`.
- **Dev server:** `npm run dev` (Vite na :3000, proxy `/api -> :3001`).
  - Ak používaš paralelne backend: `npm run dev:start` spúšťa FE+BE naraz (ak existuje).

### Komponenty štruktúra
```
src/components/
├── auth/           # LoginForm, ProtectedRoute
├── rentals/        # 33 súborov - hlavná funkcionalita
├── vehicles/       # 15 súborov - správa vozidiel  
├── customers/      # CustomerListNew, forms
├── protocols/      # HandoverProtocol, ReturnProtocol
├── common/         # ErrorBoundary, Loading, Image galleries
├── statistics/     # Charts, analytics komponenty
└── email-management/ # IMAP monitoring, parsing
```

## 4. Backend (Railway)
- **Framework:** Express + TypeScript, port 3001.
- **Build:** `cd backend && npm run build` → `dist/`.
- **API vrstvy:** REST (GET/POST/PUT), Zod validácia.
- **Zodpovednosť:** autentifikácia, biznis logika, presigned URLs pre R2, generovanie PDF.
- **DB:** PostgreSQL (migrácie v `/migrations`).
- **Logovanie:** requestId v každom async kroku (structured JSON log).
- **Chybové kódy:** jednotne používaj HTTP status + `code` v tele (viď Decisions).

### Kľúčové dependencies
```json
"pdf-lib": "^1.17.1",           // PDF generovanie
"puppeteer": "^23.9.0",         // PDF fallback
"@aws-sdk/client-s3": "^3.451.0", // R2 storage
"sharp": "^0.34.3",             // Image processing
"socket.io": "^4.7.5",          // Real-time updates
"imap": "^0.8.19",              // Email monitoring
"pg": "^8.12.0"                 // PostgreSQL
```

## 5. Média & PDF
- **Upload:** FE → presigned URL → R2 (originály sa zachovávajú).
- **Formáty:** WebP pre optimalizáciu, originály JPEG/PNG.
- **PDF generator:** PDF-lib (primary) + Puppeteer (fallback pre zložité layouty).
- **PDF štruktúra:** max 4 fotky/strana, popisky, podpisy, raz vyrobené PDF uložené v R2.
- **Storage organizácia:** 
  ```
  blackrent-storage/
  ├── protocols/handover/<car-type>_<customer>_<date>/
  ├── protocols/return/<car-type>_<customer>_<date>/
  └── vehicles/<vehicle-id>/photos/
  ```

## 6. Dôležité adresáre
- `src/components/**` - UI komponenty (interná app).
- `src/lib/**` - env, flags, guards (Zod), apiPath helper.
- `backend/src/routes/**` - API endpoints.
- `backend/src/utils/**` - R2 storage, PDF generation.
- `scripts/**` - 91 súborov (68 shell scripts).
- `docs/architecture/**` - dokumentácia (tento priečinok).

## 7. Deploy & prostredia
- **Dev:** `npm run dev:start` (spustí frontend + backend).
- **Build:** `npm run build` (frontend) + `cd backend && npm run build`.
- **Test:** `npm run test` (watch), `npm run test:run` (single), `npm run test:ui` (GUI).
- **Prod:** Railway auto-deploy z GitHub push (build FE + build BE).
- **Customer website:** `cd customer-website && npm run dev` (port 3002).

### Environment premenné
```bash
# Frontend (.env.local)
VITE_API_URL=http://localhost:3001/api
VITE_FLAG_EXTRA_KM=true
VITE_DEBUG=false  # pozor: string; na booleans používaj helper (viď Decisions)

# Backend (Railway ENV)
DATABASE_URL=postgresql://…  # udržiavaj len formu, nie konkrétne hosty
R2_ACCESS_KEY_ID=...
R2_SECRET_ACCESS_KEY=...
R2_BUCKET_NAME=blackrent-storage
```

## 8. Bezpečnosť
- Žiadne tajomstvá v repozitári ani v .cursorrules.
- Presigned URL s krátkou platnosťou (15 min).
- DB prístup iba cez env a staging pri testoch.
- **TODO:** Overiť či sú všetky R2 credentials v Railway ENV.

## 9. Monitoring & Diagnostika
- **Health system:** `npm run health` (10s diagnostika).
- **Auto-fix:** `npm run fix` (30s automatické riešenie).
- **Live monitoring:** `npm run monitor`.
- **Cleanup:** `npm run cleanup` (porty, cache).
- **Debug:** `npm run debug` (rozšírené info).
- Logy so `requestId` (FE aj BE).
- Základný health endpoint `/api/health`.
- **SLO:** p95 server response < 400 ms, dostupnosť 99.9% (cieľ)
- **Error budget:** 0.1% mesačne

### Diagnostické skripty (scripts/diagnostics/)
```bash
health-check.sh      # Kompletná 10s diagnostika
auto-fix.sh          # 30s automatické riešenie
cleanup-ports.sh     # Čistenie portov 3000/3001
start-monitoring.sh  # Live monitoring
debug-mode.sh        # Debug režim
```

## 10. Databáza – zásady
- **Nikdy** nepublikuj konkrétny host/počty v README – rýchlo zastarávajú.
- Runtime metriky ukazuj v admin dashboarde (Statistics) alebo Grafana.

## 11. Roadmap (skrátene)
- [ ] Automatický image lint (EXIF orientácia, veľkosť).
- [ ] E2E testy kľúčových flow (odovzdanie auta).
- [ ] Sledovanie storage kvót (štatistiky/alerty).
- [ ] Customer website: booking systém (synchro s internou app cez API).
- [ ] **TODO:** Spoluinvestorský systém (settlements, revenue sharing).

## 12. Customer Website (separátny projekt)
- **Framework:** Next.js + TailwindCSS (port 3002) *(ak je iné, uprav sem – TODO)*.
- **Dizajn:** Figma → Anima export (presné štýly).
- **Assets:** Výlučne `/public/assets/` (nie externé URL).
- **Breakpoints:** 1728px, 1440px, 744px, 360px.
- **Deploy:** Vercel auto-deploy.
- **TODO:** Overiť či je Next.js alebo iný framework v customer-website/.