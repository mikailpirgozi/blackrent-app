# STRUCTURED LOGGING SYSTÉM - DOKUMENTÁCIA

## PREHĽAD

Implementovaný bol jednotný structured logging systém s requestId a JSON error model pre celý backend.

## KOMPONENTY

### 1. RequestId Middleware (`src/middleware/requestId.ts`)

- **Účel**: Generuje jedinečný requestId (UUID v4) pre každý HTTP request
- **Funkcionalita**:
  - Pridáva `req.requestId` do Express Request objektu
  - Nastavuje `X-Request-Id` header v response
  - Automaticky sa aplikuje na všetky routes

### 2. Structured Logger (`src/utils/logger.ts`)

- **Nová funkcia**: `log(level, ctx, msg, extra?)`
- **Parametre**:
  - `level`: 'info' | 'warn' | 'error' | 'debug'
  - `ctx`: kontext objektu s requestId a ďalšími údajmi
  - `msg`: hlavná správa
  - `extra`: dodatočné údaje (voliteľné)
- **Výstup**: JSON formát `{ ts, level, requestId, ...ctx, msg, extra }`
- **Backward compatibility**: Zachovaný pôvodný `logger` objekt

### 3. Error Handler Middleware (`src/middleware/errorHandler.ts`)

- **JSON Error Model**:
  ```json
  {
    "code": "VALIDATION_ERROR|NOT_FOUND|UNAUTHORIZED|FORBIDDEN|INTERNAL",
    "message": "Error message",
    "details": {...},
    "requestId": "uuid"
  }
  ```
- **HTTP Status Mapping**:
  - `VALIDATION_ERROR` → 400
  - `UNAUTHORIZED` → 401
  - `FORBIDDEN` → 403
  - `NOT_FOUND` → 404
  - `INTERNAL` → 500

## POUŽITIE

### Structured Logging

```typescript
import { log } from '../utils/logger';

// Základné použitie
log('info', { requestId: req.requestId }, 'User login attempt');

// S dodatočným kontextom
log(
  'info',
  {
    requestId: req.requestId,
    userId: user.id,
    action: 'vehicle_booking',
  },
  'Booking initiated',
  {
    vehicleId: req.params.id,
    startDate: req.body.startDate,
  }
);

// Error logging
log(
  'error',
  {
    requestId: req.requestId,
    operation: 'database_query',
  },
  'Database connection failed',
  {
    error: err.message,
    retryCount: 3,
  }
);
```

### Error Handling

```typescript
import {
  createNotFoundError,
  createValidationError,
  ApiErrorWithCode,
} from '../middleware/errorHandler';

// Validation error
throw createValidationError('Invalid input data', {
  field: 'email',
  value: req.body.email,
});

// Not found error
throw createNotFoundError('Vehicle not found', {
  vehicleId: req.params.id,
});

// Custom error s kódom
throw new ApiErrorWithCode('FORBIDDEN', 'Access denied', {
  userId: req.user.id,
  resource: 'admin_panel',
});
```

### Zod Validation

```typescript
import { z } from 'zod';

const schema = z.object({
  email: z.string().email(),
  age: z.number().min(18),
});

try {
  const data = schema.parse(req.body);
} catch (error) {
  // Error handler automaticky spracuje ZodError
  next(error);
}
```

## AKCEPTAČNÉ PODMIENKY ✅

### ✅ 1. RequestId Middleware

- [x] Generuje UUID v4 requestId pre každý request
- [x] Ukladá do `req.requestId`
- [x] Nastavuje `X-Request-Id` header

### ✅ 2. Structured Logger

- [x] Funkcia `log(level, ctx, msg, extra?)`
- [x] JSON výstup s `{ ts, level, requestId, ...ctx, msg, extra }`
- [x] Podporuje úrovne: info, warn, error, debug

### ✅ 3. Error Handler

- [x] Jednotný JSON model pre všetky chyby
- [x] Správne HTTP status kódy (400/401/403/404/500)
- [x] RequestId v každej error response
- [x] X-Request-Id header v error responses

### ✅ 4. Zod Integration

- [x] Zod chyby mapované na `VALIDATION_ERROR` + HTTP 400
- [x] Detailné validation error informácie v `details`

### ✅ 5. Health Routes

- [x] `/api/health` vracia requestId
- [x] Root endpoint `/` vracia requestId

## TESTOVANIE

Všetky komponenty boli otestované:

1. **RequestId Generation**: ✅ UUID v4 sa generuje pre každý request
2. **X-Request-Id Header**: ✅ Nastavuje sa v success aj error responses
3. **JSON Error Format**: ✅ Všetky errors majú jednotný formát
4. **HTTP Status Codes**: ✅ Správne mapovanie error kódov na HTTP status
5. **Zod Validation**: ✅ ZodError sa mapuje na VALIDATION_ERROR s detailmi
6. **Structured Logging**: ✅ JSON output s requestId a kontextom

## MIGRÁCIA

- **Žiadne breaking changes** - pôvodný `logger` objekt zostáva funkčný
- **Postupná migrácia** - môžete postupne nahrádzať `logger.info()` za `log('info', {requestId}, msg)`
- **Backward compatibility** - existujúci kód funguje bez zmien

## SÚBORY

- `backend/src/middleware/requestId.ts` - RequestId middleware
- `backend/src/middleware/errorHandler.ts` - Error handler + helper funkcie
- `backend/src/utils/logger.ts` - Structured logger + backward compatibility
- `backend/src/index.ts` - Integrácia middleware do aplikácie
