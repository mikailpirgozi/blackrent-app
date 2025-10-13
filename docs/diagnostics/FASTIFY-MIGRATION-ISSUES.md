# 🔍 FASTIFY MIGRATION - DIAGNOSTIC REPORT

## 📅 Dátum: 2025-10-13

## 🚨 STATUS: KRITICKÉ PROBLÉMY NÁJDENÉ

---

## 📊 EXECUTIVE SUMMARY

Backend momentálne beží na **Fastify**, ale migrácia z Express **NIE JE KOMPLETNÁ**. Identifikované boli kritické chýbajúce routes a funkcionality, ktoré spôsobujú problémy v produkcii.

### Rýchly prehľad:
- ✅ **Migrované routes:** 17/36 (47%)
- ❌ **Chýbajúce routes:** 19/36 (53%)
- 🔴 **Kritické chýbajúce:** 8 routes
- 🟡 **Dôležité chýbajúce:** 11 routes

---

## 🔴 KRITICKÉ PROBLÉMY

### 1. **CHÝBAJÚCE KRITICKÉ API ROUTES** ⚠️

Tieto routes sú v Express ale **CHÝBAJÚ** vo Fastify:

#### **A) ADMIN MANAGEMENT**
| Route | Status | Impact | Používa sa? |
|-------|--------|--------|-------------|
| `/api/admin/*` | ❌ Missing | 🔴 Kritické | Áno - admin dashboard |
| `/api/permissions/*` | ❌ Missing | 🔴 Kritické | Áno - user management |
| `/api/advanced-users/*` | ❌ Missing | 🟡 Stredný | Nie - legacy |

#### **B) BULK OPERATIONS**
| Route | Status | Impact | Používa sa? |
|-------|--------|--------|-------------|
| `/api/bulk/data` | ❌ Missing | 🔴 **KRITICKÉ** | Áno - hlavný data loader |
| `/api/bulk/*` | ❌ Missing | 🔴 Kritické | Áno - performance |

**PROBLÉM:** Frontend používa `/api/bulk/data` pre načítanie všetkých dát naraz (vehicles, rentals, customers, etc.). Tento endpoint **CHÝBA** vo Fastify!

#### **C) EMAIL MANAGEMENT**
| Route | Status | Impact | Používa sa? |
|-------|--------|--------|-------------|
| `/api/email-imap/*` | ❌ Missing | 🟡 Stredný | Áno - email monitoring |
| `/api/email-management/*` | ❌ Missing | 🟡 Stredný | Áno - email dashboard |
| `/api/email-webhook/*` | ❌ Missing | 🟡 Stredný | Nie - experimental |

#### **D) DOCUMENTS & FILES**
| Route | Status | Impact | Používa sa? |
|-------|--------|--------|-------------|
| `/api/vehicle-documents/*` | ❌ Missing | 🔴 Kritické | Áno - documents |
| `/api/company-documents/*` | ❌ Missing | 🟡 Stredný | Áno - company files |
| `/api/r2-files/*` | ❌ Missing | 🟡 Stredný | Áno - R2 storage |

#### **E) MAINTENANCE & UTILS**
| Route | Status | Impact | Používa sa? |
|-------|--------|--------|-------------|
| `/api/cache/*` | ❌ Missing | 🟡 Stredný | Áno - cache control |
| `/api/cleanup/*` | ❌ Missing | 🟢 Nízky | Áno - maintenance |
| `/api/migration/*` | ❌ Missing | 🟢 Nízky | Nie - dev only |
| `/api/push/*` | ❌ Missing | 🟢 Nízky | Nie - experimental |

#### **F) INSURANCE & CLAIMS**
| Route | Status | Impact | Používa sa? |
|-------|--------|--------|-------------|
| `/api/insurance-claims/*` | ❌ Missing | 🟡 Stredný | Áno |
| `/api/vehicle-unavailability/*` | ❌ Missing | 🟡 Stredný | Áno - calendar |

#### **G) FEATURE FLAGS**
| Route | Status | Impact | Používa sa? |
|-------|--------|--------|-------------|
| `/api/feature-flags/*` | ❌ Missing | 🟢 Nízky | Áno - A/B testing |

---

### 2. **AUTH & PERMISSIONS ROZDIELY**

#### Express Auth (`middleware/auth.ts`):
```typescript
✅ authenticateToken() - JWT verify + database user lookup
✅ requireRole() - Role-based access
✅ requirePermission() - Granular permission check
✅ filterDataByRole() - Data filtering by role
✅ Detailný logger pre auth flow
✅ Error handling s custom errors
```

#### Fastify Auth (`fastify/decorators/auth.ts`):
```typescript
❌ authenticateFastify() - Len JWT verify (BEZ database lookup!)
❌ requireRoleFastify() - Zjednodušený role check
❌ CHÝBA requirePermission equivalent
❌ CHÝBA filterDataByRole equivalent
❌ Minimálny logging
❌ Zjednodušený error handling
```

**PROBLÉM:** Fastify auth **NEKONTROLUJE** aktuálny stav usera v databáze! Používa len decoded JWT payload, čo môže viesť k:
- Prístup s vypnutým accountom
- Neaktuálne permissions
- Security riziko

---

### 3. **PERMISSIONS MIDDLEWARE ROZDIELY**

#### Express (`middleware/permissions.ts`):
- Detailná permission logic s resource context
- Company access validation
- Amount-based restrictions
- Platform filtering
- Audit logging

#### Fastify (`fastify/hooks/permissions.ts`):
- Zjednodušená permission logic
- **CHÝBA** company access validation
- **CHÝBA** amount-based restrictions
- **CHÝBA** audit logging

---

### 4. **MULTIPART/FILE UPLOAD**

#### Express:
- Používa `multer` pre file uploads
- Custom storage engine
- File size limits: 10MB
- Podporuje `/api/files/upload` endpoint

#### Fastify:
- Používa `@fastify/multipart`
- Global multipart registrácia
- **PROBLÉM:** Rôzna API pre file handling!

**Migračný problém:** Kód pre file upload sa musí prepísať na Fastify syntax.

---

### 5. **ERROR HANDLING ROZDIELY**

#### Express (`middleware/errorHandler.ts`):
```typescript
✅ Custom error classes (ApiErrorWithCode)
✅ createUnauthorizedError()
✅ createForbiddenError()
✅ Structured error responses
✅ Sentry integration (removed, ale framework ostala)
✅ Request ID tracking
```

#### Fastify:
```typescript
❌ Žiadne custom error classes
❌ Inline error handling v routes
❌ reply.status(500).send({ error: 'message' })
❌ Nekonzistentné error response formáty
```

**PROBLÉM:** Frontend očakáva špecifický error formát, ktorý Fastify nevracia.

---

### 6. **WEBSOCKET/SOCKET.IO**

#### Express (`services/websocket-service.ts`):
```typescript
✅ initializeWebSocketService(httpServer)
✅ Attach na existujúci HTTP server
✅ Real-time broadcasts (rental deleted, etc.)
```

#### Fastify (`fastify/plugins/socket-io.ts`):
```typescript
✅ Socket.IO plugin registrovaný
✅ Fastify vytvorí vlastný HTTP server
⚠️ PROBLÉM: Plugin API sa môže líšiť!
```

**Poznámka:** Potrebujem overiť či Socket.IO broadcasts fungujú rovnako.

---

### 7. **REQUEST LOGGING & MONITORING**

#### Express:
- `requestId` middleware (unique ID pre každý request)
- `req.requestId` dostupné všade
- Logger používa requestId

#### Fastify:
- Používa Pino logger (built-in)
- **CHÝBA** requestId middleware!
- Logs nemajú unique request tracking

---

### 8. **CORS CONFIGURATION**

#### Express:
```typescript
✅ Dynamic origin check s callback
✅ Vercel domains (.vercel.app)
✅ Local IP addresses
✅ file:// protocol
✅ Credentials: true
✅ Detailed logging
```

#### Fastify:
```typescript
✅ Rovnaká CORS konfigurácia
✅ Všetko správne portované
✅ ŽIADNY PROBLÉM
```

---

## 📋 KOMPLETNÝ ZOZNAM EXPRESS ROUTES

### ✅ MIGROVANÉ (17):
1. `/api/auth/*` - Fastify ✅
2. `/api/vehicles/*` - Fastify ✅
3. `/api/customers/*` - Fastify ✅
4. `/api/rentals/*` - Fastify ✅
5. `/api/expenses/*` - Fastify ✅
6. `/api/protocols/*` - Fastify ✅
7. `/api/settlements/*` - Fastify ✅
8. `/api/companies/*` - Fastify ✅
9. `/api/company-investors/*` - Fastify ✅
10. `/api/insurances/*` - Fastify ✅
11. `/api/insurers/*` - Fastify ✅
12. `/api/leasings/*` - Fastify ✅
13. `/api/platforms/*` - Fastify ✅
14. `/api/debug/*` - Fastify ✅
15. `/api/availability/*` - Fastify ✅
16. `/api/expense-categories/*` - Fastify ✅
17. `/api/recurring-expenses/*` - Fastify ✅
18. `/api/files/*` - Fastify ✅
19. `/api/stats/*` - Fastify ✅ (nový)

### ❌ CHÝBAJÚCE (17):
1. `/api/admin/*` - 🔴 KRITICKÉ
2. `/api/bulk/*` - 🔴 **KRITICKÉ** (hlavný data loader!)
3. `/api/permissions/*` - 🔴 KRITICKÉ
4. `/api/vehicle-documents/*` - 🔴 KRITICKÉ
5. `/api/email-imap/*` - 🟡 DÔLEŽITÉ
6. `/api/email-management/*` - 🟡 DÔLEŽITÉ
7. `/api/email-webhook/*` - 🟡 DÔLEŽITÉ
8. `/api/company-documents/*` - 🟡 DÔLEŽITÉ
9. `/api/r2-files/*` - 🟡 DÔLEŽITÉ
10. `/api/cache/*` - 🟡 DÔLEŽITÉ
11. `/api/insurance-claims/*` - 🟡 DÔLEŽITÉ
12. `/api/vehicle-unavailability/*` - 🟡 DÔLEŽITÉ
13. `/api/cleanup/*` - 🟢 NÍZKA
14. `/api/migration/*` - 🟢 NÍZKA
15. `/api/push/*` - 🟢 NÍZKA
16. `/api/feature-flags/*` - 🟢 NÍZKA
17. `/api/advanced-users/*` - 🟢 NÍZKA (legacy)

---

## 🎯 PRIORITY FIX LIST

### TIER 1 - CRITICAL (Musia sa opraviť OKAMŽITE):
1. ✅ **Migruj `/api/bulk/*` routes** - Frontend hlavný data loader
2. ✅ **Oprav auth decorator** - Pridaj database user lookup
3. ✅ **Migruj `/api/admin/*`** - Admin panel nefunguje
4. ✅ **Migruj `/api/permissions/*`** - User management nefunguje
5. ✅ **Migruj `/api/vehicle-documents/*`** - Documents nefungujú

### TIER 2 - HIGH (Musia sa opraviť čoskoro):
6. ✅ **Migruj email routes** (`email-imap`, `email-management`, `email-webhook`)
7. ✅ **Migruj document routes** (`company-documents`, `r2-files`)
8. ✅ **Migruj utility routes** (`cache`, `insurance-claims`, `vehicle-unavailability`)
9. ✅ **Implementuj requestId middleware**
10. ✅ **Zjednoť error handling**

### TIER 3 - MEDIUM (Nízka priorita):
11. ✅ **Migruj maintenance routes** (`cleanup`, `migration`, `push`, `feature-flags`)
12. ✅ **Odstráň/archivuj `advanced-users`** (legacy)

---

## 🔧 ODPORÚČANIA

### Immediate Actions:
1. **SWITCH BACK TO EXPRESS** dočasne, kým sa nedokončí migrácia
2. Alebo **DOKONČIŤ MIGRÁCIU** pred spustením Fastify v produkcii

### Migration Strategy:
1. Vytvor kompletný migration checklist
2. Migruj routes jedna po druhej
3. Test každú route pred deployom
4. Používaj feature flags pre postupné zapínanie

### Quality Gates:
- ✅ 100% routes migrované
- ✅ Auth & permissions ekvivalentné
- ✅ Error handling konzistentný
- ✅ Všetky testy prechod
- ✅ Performance min. rovnaký ako Express

---

## 📊 MIGRATION PROGRESS TRACKER

```
Total Routes: 36
✅ Migrated: 17 (47%)
❌ Missing: 19 (53%)

Critical Missing: 5/36 (14%)
High Priority Missing: 8/36 (22%)
Low Priority Missing: 6/36 (17%)
```

---

## 🚀 NEXT STEPS

### Option A: ROLLBACK TO EXPRESS
```bash
# 1. Update railway.json
"startCommand": "node dist/index.js"

# 2. Update package.json
"main": "dist/index.js"
"start": "node dist/index.js"

# 3. Deploy
git commit -m "chore: rollback to express temporarily"
git push
```

### Option B: COMPLETE MIGRATION
```bash
# 1. Migruj všetky chýbajúce routes
# 2. Oprav auth & permissions
# 3. Testuj všetko
# 4. Deploy
```

---

## 📝 NOTES

- Express kód je kompletný a fungujúci
- Fastify migrácia bola započatá ale nedokončená
- Niektoré routes majú rozdielnu logiku medzi Express/Fastify
- Potrebné dôkladné testovanie pred production deployom

---

**Autor:** Cursor AI  
**Dátum:** 2025-10-13  
**Status:** 🔴 REQUIRES IMMEDIATE ACTION


