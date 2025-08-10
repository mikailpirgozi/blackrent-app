# 🚗 BlackRent - Komplexný Audit Report pre Verejný Web
**Dátum:** December 2024  
**Verzia:** 1.0  
**Účel:** Transformácia internej aplikácie na verejný zákaznícky web (blackrent.sk)

---

## 1. Súhrn Projektu

### Tech Stack
- **Frontend:** React 18.2 + TypeScript + Material-UI 5.14
- **Backend:** Node.js 18 + Express + TypeScript 
- **Databáza:** PostgreSQL (Railway) / SQLite (local)
- **Hosting:** Frontend - Vercel, Backend - Railway.app
- **Storage:** R2 (Cloudflare) pre súbory a protokoly
- **Runtime:** Node.js 18-slim (Docker)

### Štruktúra Projektu
```
/workspace
├── src/                 # React frontend
├── backend/            # Express API server  
├── database/           # Migrácie a skripty
├── protocols/          # PDF protokoly
├── public/            # Statické súbory
└── scripts/           # Pomocné skripty
```

### Súčasné Funkcie
- ✅ Správa vozidiel s kategóriami a cenníkmi
- ✅ Správa prenájmov (štandardné a flexibilné)
- ✅ Správa zákazníkov a firiem
- ✅ Generovanie protokolov (PDF)
- ✅ Email monitoring (IMAP) a automatické spracovanie
- ✅ Vyúčtovania a štatistiky
- ✅ Multi-tenancy (viacero firiem)
- ✅ RBAC (role-based access control)
- ✅ Real-time WebSocket notifikácie
- ✅ PWA podpora (offline režim)

---

## 2. Mapa Závislostí a Konfigurácií

### Top 30 NPM Dependencies

#### Frontend
| Balík | Verzia | Účel |
|-------|--------|------|
| react | 18.2.0 | UI framework |
| @mui/material | 5.14.20 | Komponenty a dizajn |
| @mui/x-data-grid | 6.18.2 | Tabuľky s pokročilými funkciami |
| @tanstack/react-query | 5.84.2 | Server state management |
| react-router-dom | 6.20.1 | Routing |
| date-fns | 2.30.0 | Práca s dátumami |
| pdf-lib | 1.17.1 | PDF generovanie |
| socket.io-client | 4.8.1 | Real-time komunikácia |
| recharts | 3.1.2 | Grafy a štatistiky |
| react-window | 1.8.11 | Virtualizácia pre performance |

#### Backend  
| Balík | Verzia | Účel |
|-------|--------|------|
| express | 4.19.2 | Web server framework |
| pg | 8.12.0 | PostgreSQL client |
| jsonwebtoken | 9.0.2 | JWT autentifikácia |
| bcryptjs | 2.4.3 | Hashovanie hesiel |
| @aws-sdk/client-s3 | 3.451.0 | R2/S3 storage |
| puppeteer | 23.9.0 | PDF generovanie (produkcia) |
| socket.io | 4.7.5 | WebSocket server |
| multer | 1.4.5 | File upload |
| compression | 1.8.1 | Gzip kompresie |
| @sentry/node | 7.88.0 | Error tracking |

### Kľúčové Konfigurácie

#### Environment Variables
```env
# Database
DATABASE_URL=postgresql://user:pass@host/db
DB_HOST=localhost
DB_PORT=5432
DB_NAME=blackrent
DB_USER=postgres
DB_PASSWORD=password

# Auth
JWT_SECRET=blackrent-secret-key-2024

# Server
PORT=3001
NODE_ENV=production
FRONTEND_URL=https://blackrent.vercel.app

# Email (IMAP/SMTP)
IMAP_HOST=imap.m1.websupport.sk
IMAP_USER=info@blackrent.sk
IMAP_PASSWORD=***
SMTP_HOST=smtp.m1.websupport.sk
SMTP_USER=info@blackrent.sk
SMTP_PASS=***
EMAIL_SEND_PROTOCOLS=true

# Storage (R2)
R2_ENDPOINT=https://***
R2_ACCESS_KEY_ID=***
R2_SECRET_ACCESS_KEY=***
R2_BUCKET_NAME=blackrent-storage
R2_PUBLIC_URL=https://***

# Monitoring
SENTRY_DSN_BACKEND=https://***
```

### Build & Deploy
```bash
# Frontend (Vercel)
npm run build
# Auto-deploy cez GitHub

# Backend (Railway)
docker build -f Dockerfile.railway -t blackrent-backend .
docker run -p 3001:3001 blackrent-backend

# Lokálny development
npm run dev:start  # Spustí frontend + backend
```

---

## 3. Frontend Architektúra

### Routing Tabuľka

| Cesta | Komponent | Auth | Popis |
|-------|-----------|------|-------|
| `/login` | LoginForm | ❌ | Prihlásenie |
| `/vehicles` | VehicleListNew | ✅ | Zoznam vozidiel |
| `/rentals` | RentalListNew | ✅ | Zoznam prenájmov |
| `/customers` | CustomerListNew | ✅ | Správa zákazníkov |
| `/expenses` | ExpenseListNew | ✅ | Náklady |
| `/insurances` | InsuranceList | ✅ | Poistky |
| `/settlements` | SettlementListNew | ✅ | Vyúčtovania |
| `/statistics` | Statistics | ✅ | Štatistiky a grafy |
| `/availability` | SmartAvailabilityPage | ✅ | Kalendár dostupnosti |
| `/users` | IntegratedUserManagement | ✅ admin | Správa používateľov |
| `/email-monitoring` | EmailManagementDashboard | ✅ | Email monitoring |

### Komponenty (Reusable)
```
components/
├── common/           # LoadingSpinner, ErrorBoundary, Dialog
├── vehicles/         # VehicleCard, VehicleForm, PricingEditor
├── rentals/          # RentalForm, PaymentDialog, StatusChip
├── availability/     # CalendarView, VehicleAvailability
├── protocols/        # ProtocolViewer, SignatureCanvas
└── auth/            # LoginForm, ProtectedRoute
```

### State Management
- **Context API:** AuthContext, AppContext, PermissionsContext, ThemeContext
- **React Query:** Server state caching a synchronizácia
- **Local State:** useState pre formuláre
- **WebSocket:** Real-time updates

### Styling
- **Material-UI:** Hlavný design system
- **Custom CSS:** Aeonik font, custom-font.css
- **Responsive:** Breakpoints pre mobile/tablet/desktop
- **Dark Mode:** Podporovaný cez ThemeContext

### Performance Optimalizácie
1. **Code Splitting:** Lazy loading všetkých routes
2. **React.memo:** Optimalizované re-rendery
3. **Virtual Scrolling:** react-window pre veľké zoznamy
4. **Image Optimization:** Lazy loading obrázkov
5. **Bundle Size:** Tree shaking, compression

---

## 4. Backend API Architektúra

### Server Stack
- **Framework:** Express.js s TypeScript
- **Middleware:** CORS, compression, body-parser, auth
- **WebSocket:** Socket.io pre real-time
- **Error Handling:** Sentry integrácia

### Autentifikácia
- **Stratégia:** JWT Bearer tokens
- **Roles:** admin, owner, mechanic, user
- **Permissions:** Granulárne per-resource permissions
- **Multi-tenancy:** Company-based isolation

### API Endpoint Mapa

#### Vozidlá
| Method | Path | Auth | Popis |
|--------|------|------|-------|
| GET | `/api/vehicles` | ✅ | Zoznam vozidiel |
| GET | `/api/vehicles/:id` | ✅ | Detail vozidla |
| POST | `/api/vehicles` | ✅ admin | Vytvorenie vozidla |
| PUT | `/api/vehicles/:id` | ✅ owner | Update vozidla |
| DELETE | `/api/vehicles/:id` | ✅ admin | Zmazanie vozidla |
| GET | `/api/vehicles/bulk-ownership-history` | ✅ admin | História vlastníctva |

#### Prenájmy
| Method | Path | Auth | Popis |
|--------|------|------|-------|
| GET | `/api/rentals` | ✅ | Zoznam prenájmov |
| GET | `/api/rentals/:id` | ✅ | Detail prenájmu |
| POST | `/api/rentals` | ✅ | Vytvorenie prenájmu |
| PUT | `/api/rentals/:id` | ✅ | Update prenájmu |
| DELETE | `/api/rentals/:id` | ✅ admin | Zmazanie prenájmu |
| POST | `/api/rentals/:id/confirm` | ✅ | Potvrdenie prenájmu |
| POST | `/api/rentals/:id/payment` | ✅ | Zaznamenanie platby |

#### Protokoly
| Method | Path | Auth | Popis |
|--------|------|------|-------|
| GET | `/api/protocols/rental/:rentalId` | ✅ | Protokoly prenájmu |
| POST | `/api/protocols/handover` | ✅ | Odovzdávací protokol |
| POST | `/api/protocols/return` | ✅ | Preberací protokol |
| GET | `/api/protocols/pdf/:protocolId` | ✅ | Stiahnutie PDF |

#### Dostupnosť
| Method | Path | Auth | Popis |
|--------|------|------|-------|
| GET | `/api/availability/calendar` | ✅ | Kalendár dostupnosti |
| GET | `/api/availability/vehicle/:id` | ✅ | Dostupnosť vozidla |
| POST | `/api/vehicle-unavailability` | ✅ | Pridanie nedostupnosti |

#### Email Management
| Method | Path | Auth | Popis |
|--------|------|------|-------|
| GET | `/api/email-management/inbox` | ✅ | Email inbox |
| POST | `/api/email-management/process` | ✅ | Spracovanie emailu |
| POST | `/api/email-webhook` | ❌ | Webhook pre prichádzajúce emaily |

### OpenAPI 3.1 Špecifikácia

```yaml
openapi: 3.1.0
info:
  title: BlackRent API
  version: 1.1.2
  description: API pre správu prenájmov vozidiel
servers:
  - url: https://blackrent-app-production-4d6f.up.railway.app
    description: Production server
  - url: http://localhost:3001
    description: Development server

components:
  securitySchemes:
    bearerAuth:
      type: http
      scheme: bearer
      bearerFormat: JWT
      
  schemas:
    Vehicle:
      type: object
      required: [id, brand, model, licensePlate, status]
      properties:
        id:
          type: string
          format: uuid
        brand:
          type: string
        model:
          type: string
        year:
          type: integer
        licensePlate:
          type: string
        category:
          type: string
          enum: [nizka-trieda, stredna-trieda, vyssia-stredna, luxusne, sportove, suv, viacmiestne, dodavky]
        status:
          type: string
          enum: [available, rented, maintenance, removed]
        pricing:
          type: array
          items:
            $ref: '#/components/schemas/PricingTier'
            
    PricingTier:
      type: object
      properties:
        minDays:
          type: integer
        maxDays:
          type: integer
        pricePerDay:
          type: number
          
    Rental:
      type: object
      required: [id, vehicleId, customerId, startDate, endDate, totalPrice]
      properties:
        id:
          type: string
          format: uuid
        vehicleId:
          type: string
        customerId:
          type: string
        startDate:
          type: string
          format: date-time
        endDate:
          type: string
          format: date-time
        totalPrice:
          type: number
        status:
          type: string
          enum: [pending, active, finished]
        rentalType:
          type: string
          enum: [standard, flexible]
          
paths:
  /api/vehicles:
    get:
      summary: Získať zoznam vozidiel
      security:
        - bearerAuth: []
      parameters:
        - name: status
          in: query
          schema:
            type: string
        - name: category
          in: query
          schema:
            type: string
      responses:
        200:
          description: Zoznam vozidiel
          content:
            application/json:
              schema:
                type: object
                properties:
                  success:
                    type: boolean
                  data:
                    type: array
                    items:
                      $ref: '#/components/schemas/Vehicle'
                      
    post:
      summary: Vytvoriť nové vozidlo
      security:
        - bearerAuth: []
      requestBody:
        required: true
        content:
          application/json:
            schema:
              $ref: '#/components/schemas/Vehicle'
      responses:
        201:
          description: Vozidlo vytvorené
          
  /api/rentals:
    get:
      summary: Získať zoznam prenájmov
      security:
        - bearerAuth: []
      parameters:
        - name: status
          in: query
          schema:
            type: string
        - name: vehicleId
          in: query
          schema:
            type: string
        - name: startDate
          in: query
          schema:
            type: string
            format: date
        - name: endDate
          in: query
          schema:
            type: string
            format: date
      responses:
        200:
          description: Zoznam prenájmov
          
  /api/availability/calendar:
    get:
      summary: Získať kalendár dostupnosti
      security:
        - bearerAuth: []
      parameters:
        - name: year
          in: query
          schema:
            type: integer
        - name: month
          in: query
          schema:
            type: integer
        - name: phase
          in: query
          schema:
            type: string
            enum: [current, past, future]
      responses:
        200:
          description: Kalendárne dáta
```

---

## 5. Databáza a Dátová Vrstva

### Databázový Systém
- **Produkcia:** PostgreSQL 15 (Railway)
- **Development:** SQLite / PostgreSQL local
- **ORM:** Natívne SQL queries s pg klientom
- **Migrácie:** SQL skripty v `database/migrations/`

### ERD Diagram (Mermaid)

```mermaid
erDiagram
    companies ||--o{ users : has
    companies ||--o{ vehicles : owns
    users ||--o{ rentals : creates
    vehicles ||--o{ rentals : rented_in
    vehicles ||--o{ expenses : has
    vehicles ||--o{ insurances : has
    vehicles ||--o{ vehicle_documents : has
    vehicles ||--o{ insurance_claims : has
    customers ||--o{ rentals : books
    rentals ||--o{ rental_payments : has
    rentals ||--o{ protocols : generates
    
    companies {
        uuid id PK
        string name
        string address
        string ico
        string dic
        string bank_account
        timestamp created_at
    }
    
    users {
        uuid id PK
        string username UK
        string email UK
        string password_hash
        string first_name
        string last_name
        string role
        uuid company_id FK
        boolean is_active
        timestamp last_login
        timestamp created_at
    }
    
    vehicles {
        uuid id PK
        string brand
        string model
        integer year
        string license_plate UK
        uuid owner_company_id FK
        string category
        string status
        jsonb pricing_tiers
        jsonb commission
        date stk
        timestamp created_at
    }
    
    customers {
        uuid id PK
        string name
        string first_name
        string last_name
        string email
        string phone
        string address
        timestamp created_at
    }
    
    rentals {
        uuid id PK
        uuid vehicle_id FK
        uuid customer_id FK
        string customer_name
        timestamp start_date
        timestamp end_date
        decimal total_price
        decimal commission
        string payment_method
        string status
        boolean confirmed
        boolean paid
        string rental_type
        boolean is_flexible
        string company
        jsonb discount
        jsonb custom_commission
        decimal deposit
        integer allowed_kilometers
        uuid handover_protocol_id FK
        uuid return_protocol_id FK
        timestamp created_at
    }
    
    rental_payments {
        uuid id PK
        uuid rental_id FK
        timestamp date
        decimal amount
        boolean is_paid
        string payment_method
        string invoice_number
        text note
    }
    
    protocols {
        uuid id PK
        uuid rental_id FK
        string protocol_type
        jsonb vehicle_condition
        integer odometer_start
        integer odometer_end
        integer fuel_level
        text notes
        text customer_signature
        text owner_signature
        string pdf_url
        timestamp created_at
    }
    
    expenses {
        uuid id PK
        uuid vehicle_id FK
        string description
        decimal amount
        date date
        string category
        string company
        text note
        timestamp created_at
    }
    
    insurances {
        uuid id PK
        uuid vehicle_id FK
        uuid insurer_id FK
        string policy_number
        date valid_from
        date valid_to
        decimal monthly_payment
        string payment_frequency
        timestamp created_at
    }
    
    vehicle_unavailability {
        uuid id PK
        uuid vehicle_id FK
        date start_date
        date end_date
        string reason
        text notes
        timestamp created_at
    }
```

### Multi-tenancy Model
- **Izolácia:** Company-based (owner_company_id)
- **RLS:** Nie je implementované (aplikačná logika)
- **Permissions:** user_company_access tabuľka

### Databázové Indexy
```sql
-- Performance indexy
idx_rentals_dates (start_date, end_date)
idx_rentals_vehicle_status (vehicle_id, status)
idx_vehicles_company (owner_company_id)
idx_vehicles_status (status)
idx_users_company (company_id)
idx_protocols_rental (rental_id)
```

---

## 6. Doménová Logika

### Cenový Engine
```typescript
// Vstupné parametre
interface PricingInput {
  vehicleId: string
  startDate: Date
  endDate: Date
  dailyKm?: number
  extras?: string[]
}

// Výpočet ceny
1. Základná cena = počet dní × cena za deň (podľa tier)
2. Víkendový príplatok = +20% za piatok-nedeľa
3. Sezónny príplatok = +30% júl-august
4. Dlhodobá zľava = -10% nad 7 dní, -15% nad 14 dní
5. Extra km = prekročenie × 0.20€/km
6. Depozit = 30% z celkovej ceny (min 200€)
```

### Algoritmus Dostupnosti
```typescript
// Zdroje dostupnosti
1. Kalendár prenájmov (rentals tabuľka)
2. Manuálne nedostupnosti (vehicle_unavailability)
3. Flexibilné prenájmy (is_flexible flag)
4. Údržba vozidiel (status = 'maintenance')

// Prioritizácia
1. Potvrdené prenájmy (confirmed = true)
2. Štandardné prenájmy
3. Flexibilné prenájmy (môžu byť presunuté)
```

### Protokoly (Handover/Return)
```
Workflow:
1. Vytvorenie protokolu → generovanie PDF
2. Podpis zákazníka (canvas)
3. Podpis majiteľa
4. Upload do R2 storage
5. Email s PDF zákazníkovi
```

### Email Parsing Pipeline
```
1. IMAP monitoring (polling každých 5 min)
2. Parse email (mailparser)
3. Extrakcia dát (regex patterns)
4. Vytvorenie draft prenájmu
5. Manuálne schválenie
6. Auto-odpoveď zákazníkovi
```

### Vyúčtovania Majiteľov
```
Mesačné vyúčtovanie:
1. Súčet prenájmov za mesiac
2. Odpočet provízií (20% alebo fixná)
3. Odpočet nákladov
4. Generovanie PDF reportu
5. Platobný príkaz
```

---

## 7. Integrácie

### Email Providers
- **IMAP:** Websupport (imap.m1.websupport.sk)
- **SMTP:** Websupport (smtp.m1.websupport.sk)
- **Účet:** info@blackrent.sk

### Storage
- **Provider:** Cloudflare R2 (S3 compatible)
- **Bucket:** blackrent-storage
- **Typy:** PDF protokoly, fotky vozidiel, dokumenty

### Platby
- ❌ **Stripe:** Nie je implementované
- ✅ **Manuálne:** Cash, bank transfer, VRP

### Monitoring
- **Sentry:** Error tracking
- **WebSocket:** Real-time notifikácie

---

## 8. Background Jobs

### Cron Jobs
| Job | Frekvencia | Účel |
|-----|------------|------|
| IMAP Email Check | 5 min | Kontrola nových emailov |
| Calendar Cache Cleanup | 5 min | Čistenie cache |
| Connection Pool Cleanup | 2 min | DB connection management |
| Rental Status Update | Daily | Update statusov prenájmov |

### Queues
- Nie sú implementované (všetko synchronné)

---

## 9. Bezpečnosť a Compliance

### Autentifikácia
- ✅ JWT tokens (24h expirácia)
- ✅ Bcrypt hashovanie hesiel
- ❌ 2FA nie je implementované
- ❌ OAuth nie je implementované

### Autorizácia
- ✅ RBAC (role-based)
- ✅ Resource-level permissions
- ✅ Company-based isolation

### Bezpečnostné Medzery
1. **Rate Limiting:** Nie je implementované
2. **Input Validation:** Základná, nie všade
3. **SQL Injection:** Chránené (parameterized queries)
4. **XSS:** React automaticky escapuje
5. **CSRF:** Nie je potrebné (JWT)
6. **File Upload:** Základná validácia

### GDPR Compliance
- ❌ Data export endpoint chýba
- ❌ Right to deletion nie je implementované
- ❌ Audit trail čiastočný
- ✅ Šifrovanie hesiel

---

## 10. Test Coverage

### Súčasný Stav
- **Unit testy:** 0% coverage
- **Integration testy:** 0% coverage
- **E2E testy:** Nie sú
- **Lint:** ESLint základná konfigurácia

### Kritické Oblasti bez Testov
1. Cenový kalkulátor
2. Dostupnosť vozidiel
3. Email parsing
4. PDF generovanie
5. Autentifikácia flow

---

## 11. GAP Analýza pre Verejný Web (blackrent.sk)

### ✅ Čo Môžeme POUŽIŤ Priamo

#### Backend API
- Vehicles endpoints (read-only pre public)
- Availability calendar API
- Pricing calculation logic
- PDF generation (protokoly)

#### Frontend Komponenty
- CalendarView (dostupnosť)
- VehicleCard komponenty
- Material-UI design system
- Loading/Error komponenty

#### Infraštruktúra
- PostgreSQL databáza
- R2 storage
- Railway/Vercel hosting

### ❌ Čo MUSÍME VYBUDOVAŤ

#### 1. Verejný Katalóg (PRIORITA: Vysoká)
- [ ] SEO-friendly URL štruktúra (/vozidla/bmw-x5-2023)
- [ ] Server-side rendering (Next.js)
- [ ] Filtrovanie (kategória, cena, dostupnosť)
- [ ] Vyhľadávanie (full-text)
- [ ] Fotogaléria vozidiel
- [ ] 360° view (optional)

#### 2. Detail Vozidla (PRIORITA: Vysoká)
- [ ] Špecifikácie a vybavenie
- [ ] Fotogaléria s lightbox
- [ ] Cenník (responsive tabuľka)
- [ ] Live dostupnosť kalendár
- [ ] "Podobné vozidlá" sekcia
- [ ] Hodnotenia a recenzie

#### 3. Cenová Kalkulačka (PRIORITA: Vysoká)
- [ ] Interaktívny date picker
- [ ] Real-time prepočet
- [ ] Extras a príplatky
- [ ] Porovnanie vozidiel
- [ ] Uloženie kalkulácie

#### 4. Rezervačný Systém (PRIORITA: Kritická)
- [ ] Multi-step booking wizard
- [ ] Validácia dostupnosti
- [ ] Zákaznícke údaje formulár
- [ ] Súhlas s podmienkami
- [ ] Email potvrdenie

#### 5. Platobná Brána (PRIORITA: Kritická)
- [ ] Stripe integrácia
- [ ] Authorize & Capture flow
- [ ] Depozit hold
- [ ] Refund handling
- [ ] PCI compliance
- [ ] 3D Secure

#### 6. Zákaznícky Účet (PRIORITA: Stredná)
- [ ] Registrácia/Login
- [ ] "Moje rezervácie"
- [ ] História prenájmov
- [ ] Stiahnutie protokolov
- [ ] Úprava profilu
- [ ] Newsletter preferences

#### 7. Lokalizácia (PRIORITA: Vysoká)
- [ ] SK/EN/DE jazyky
- [ ] Preklad všetkých textov
- [ ] Lokalizované ceny (EUR)
- [ ] Dátumové formáty

#### 8. SEO Optimalizácia (PRIORITA: Vysoká)
- [ ] Meta tagy (title, description)
- [ ] OpenGraph pre social media
- [ ] Schema.org markup
- [ ] XML sitemap
- [ ] Robots.txt
- [ ] Canonical URLs

#### 9. Performance (PRIORITA: Vysoká)
- [ ] Next.js SSG/SSR
- [ ] Image optimization (WebP)
- [ ] CDN (Cloudflare)
- [ ] Bundle splitting
- [ ] Lighthouse score > 90

#### 10. Analytics (PRIORITA: Stredná)
- [ ] Google Analytics 4
- [ ] Conversion tracking
- [ ] Heatmapy (Hotjar)
- [ ] A/B testing

### 🔧 Potrebné API Endpointy

```typescript
// Nové public endpointy
GET /api/public/vehicles
GET /api/public/vehicles/:slug
GET /api/public/availability/:vehicleId
POST /api/public/calculate-price
POST /api/public/booking/create
POST /api/public/booking/confirm
GET /api/public/booking/:id

// Customer account
POST /api/auth/register
POST /api/auth/login
POST /api/auth/forgot-password
GET /api/customer/bookings
GET /api/customer/profile
PUT /api/customer/profile

// Stripe webhooks
POST /api/stripe/webhook
POST /api/stripe/create-payment-intent
POST /api/stripe/capture-payment
POST /api/stripe/refund
```

### 📊 Databázové Zmeny

```sql
-- Nové tabuľky
CREATE TABLE customer_accounts (
  id UUID PRIMARY KEY,
  email VARCHAR(255) UNIQUE,
  password_hash VARCHAR(255),
  first_name VARCHAR(100),
  last_name VARCHAR(100),
  phone VARCHAR(50),
  email_verified BOOLEAN DEFAULT false,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE bookings (
  id UUID PRIMARY KEY,
  vehicle_id UUID REFERENCES vehicles(id),
  customer_account_id UUID REFERENCES customer_accounts(id),
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  total_price DECIMAL(10,2),
  deposit_amount DECIMAL(10,2),
  status VARCHAR(50), -- draft, confirmed, paid, cancelled
  stripe_payment_intent_id VARCHAR(255),
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE vehicle_images (
  id UUID PRIMARY KEY,
  vehicle_id UUID REFERENCES vehicles(id),
  image_url VARCHAR(500),
  image_type VARCHAR(50), -- main, gallery, 360
  sort_order INTEGER,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE reviews (
  id UUID PRIMARY KEY,
  booking_id UUID REFERENCES bookings(id),
  customer_account_id UUID REFERENCES customer_accounts(id),
  vehicle_id UUID REFERENCES vehicles(id),
  rating INTEGER CHECK (rating >= 1 AND rating <= 5),
  comment TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Indexy pre performance
CREATE INDEX idx_bookings_dates ON bookings(start_date, end_date);
CREATE INDEX idx_bookings_customer ON bookings(customer_account_id);
CREATE INDEX idx_reviews_vehicle ON reviews(vehicle_id);
CREATE INDEX idx_vehicle_images_vehicle ON vehicle_images(vehicle_id);

-- Rozšírenie vehicles tabuľky
ALTER TABLE vehicles ADD COLUMN slug VARCHAR(255) UNIQUE;
ALTER TABLE vehicles ADD COLUMN description TEXT;
ALTER TABLE vehicles ADD COLUMN features JSONB;
ALTER TABLE vehicles ADD COLUMN seo_title VARCHAR(255);
ALTER TABLE vehicles ADD COLUMN seo_description TEXT;
ALTER TABLE vehicles ADD COLUMN is_featured BOOLEAN DEFAULT false;
ALTER TABLE vehicles ADD COLUMN view_count INTEGER DEFAULT 0;
```

---

## 12. Prioritizovaný Roadmap

### 🚀 Fáza 1: MVP (2-3 týždne)
**Cieľ:** Základný verejný web s katalógom a rezerváciami

| Úloha | Effort | Impact | Závislosti |
|-------|--------|--------|------------|
| Next.js setup a migrácia | L | High | - |
| Verejný katalóg vozidiel | M | High | API endpointy |
| Detail vozidla s galériou | M | High | Vehicle images |
| Cenová kalkulačka | S | High | Existing logic |
| Základný booking flow | L | Critical | Database schema |
| Email potvrdenia | S | High | SMTP setup |
| Responsive design | M | High | - |
| Základné SEO | S | High | - |

**Acceptance Criteria:**
- Užívateľ vidí katalóg vozidiel
- Môže si vypočítať cenu
- Môže vytvoriť rezerváciu
- Dostane email potvrdenie

### 📈 Fáza 2: Rozšírenie (3-5 týždňov)
**Cieľ:** Platby, zákaznícke účty, pokročilé funkcie

| Úloha | Effort | Impact | Závislosti |
|-------|--------|--------|------------|
| Stripe integrácia | L | Critical | Stripe account |
| Zákaznícke účty | L | High | Auth system |
| "Moje rezervácie" | M | High | Customer accounts |
| Hodnotenia a recenzie | M | Medium | Bookings |
| Lokalizácia (SK/EN) | M | High | i18n setup |
| Advanced filtering | M | Medium | - |
| Performance optimalizácie | M | High | - |
| Google Analytics | S | Medium | - |

**Acceptance Criteria:**
- Platby cez Stripe fungujú
- Zákazníci majú účty
- Web je v SK a EN
- PageSpeed > 90

### 🎯 Fáza 3: Premium Features (nice-to-have)

| Úloha | Effort | Impact | Závislosti |
|-------|--------|--------|------------|
| Mobile app (React Native) | XL | Medium | API |
| 360° vehicle view | L | Low | Photography |
| Live chat support | M | Medium | Support team |
| Loyalty program | L | Medium | CRM |
| API pre partnerov | L | Low | Documentation |
| A/B testing | M | Low | Analytics |
| PWA enhancements | M | Medium | - |

---

## 13. Register Rizík a Mitigácie

### 🔴 Kritické Riziká

| Riziko | Pravdepodobnosť | Dopad | Mitigácia |
|--------|-----------------|-------|-----------|
| **Stripe odmietnutie** | Nízka | Kritický | Alternatíva: PayPal, Comgate |
| **GDPR porušenie** | Stredná | Vysoký | Privacy audit, DPO konzultácia |
| **SQL injection** | Nízka | Kritický | Parameterized queries, WAF |
| **DDoS útok** | Stredná | Vysoký | Cloudflare, rate limiting |

### 🟡 Stredné Riziká

| Riziko | Pravdepodobnosť | Dopad | Mitigácia |
|--------|-----------------|-------|-----------|
| **Pomalý web** | Stredná | Stredný | CDN, caching, monitoring |
| **Dvojité bookings** | Nízka | Stredný | DB transactions, locks |
| **Email spam filter** | Stredná | Nízky | SPF, DKIM, dedicated IP |
| **Mobilná UX** | Vysoká | Stredný | Mobile-first design |

### 🟢 Nízke Riziká

| Riziko | Pravdepodobnosť | Dopad | Mitigácia |
|--------|-----------------|-------|-----------|
| **Browser kompatibilita** | Nízka | Nízky | Babel, polyfills |
| **SEO penalizácia** | Nízka | Stredný | White-hat SEO only |
| **Sociálne siete ban** | Nízka | Nízky | Organic content |

---

## 14. Technické Odporúčania

### Immediate Actions
1. **Vytvorte .env.example** s placeholder hodnotami
2. **Dokumentujte API** cez Swagger/OpenAPI
3. **Implementujte rate limiting** (express-rate-limit)
4. **Pridajte health checks** pre monitoring
5. **Nastavte CI/CD** pipeline (GitHub Actions)

### Architecture Improvements
1. **Migrácia na Next.js** pre SSR/SSG
2. **Redis cache** pre sessions a cache
3. **Queue system** (Bull) pre background jobs
4. **Microservices** rozdelenie (optional)
5. **GraphQL** API (optional)

### Security Hardening
1. **Helmet.js** pre security headers
2. **Input sanitization** (validator.js)
3. **SQL injection** prevention audit
4. **Dependency scanning** (Snyk)
5. **Penetration testing** pred launch

### Performance Optimization
1. **Database indexing** review
2. **Query optimization** (EXPLAIN ANALYZE)
3. **Image CDN** (Cloudinary)
4. **Bundle analysis** (webpack-bundle-analyzer)
5. **Lighthouse CI** automation

---

## 15. Záver

### ✅ Silné Stránky
- Funkčná interná aplikácia
- Robustné API
- Dobrá databázová štruktúra
- Material-UI komponenty
- Multi-tenancy podpora

### ⚠️ Výzvy
- Chýba platobná integrácia
- Žiadne testy
- SEO nie je riešené
- Performance optimalizácie potrebné
- GDPR compliance nekompletné

### 🎯 Odporúčaný Postup
1. **Týždeň 1-2:** Next.js setup, verejný katalóg
2. **Týždeň 3-4:** Booking flow, základné platby
3. **Týždeň 5-6:** Zákaznícke účty, lokalizácia
4. **Týždeň 7-8:** Testing, optimalizácie, launch

### 📊 Odhad Nákladov
- **Development:** 6-8 týždňov × 2 developers
- **Stripe fees:** 1.4% + 0.25€ per transaction
- **Hosting:** ~$50/mesiac (Vercel + Railway)
- **Domain + SSL:** ~$30/rok
- **Marketing:** Podľa stratégie

---

**Dokument pripravil:** AI Assistant  
**Dátum:** December 2024  
**Verzia:** 1.0  
**Status:** Kompletný audit pre transformáciu na verejný web