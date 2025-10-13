# 🔧 FASTIFY MIGRATION - FIX PLAN

## 📅 Dátum: 2025-10-13

---

## 🎯 CIEĽ

Dokončiť migráciu z Express na Fastify a opraviť všetky identifikované problémy.

---

## 📊 PRIORITY MATRIX

### 🔴 TIER 1 - CRITICAL (Must Fix Now)

#### 1. **Auth Decorator - Database User Lookup**
**Problém:** Fastify auth decorator nekontroluje aktuálny stav usera v databáze  
**Riešenie:** Pridať database lookup do `authenticateFastify()`

```typescript
// backend/src/fastify/decorators/auth.ts
export async function authenticateFastify(
  request: FastifyRequest,
  reply: FastifyReply
): Promise<void> {
  try {
    const authHeader = request.headers.authorization;
    const queryToken = (request.query as { token?: string }).token;
    
    let token: string | undefined;
    if (authHeader?.startsWith('Bearer ')) {
      token = authHeader.substring(7);
    } else if (queryToken) {
      token = queryToken;
    }
    
    if (!token) {
      return reply.status(401).send({ 
        success: false,
        error: 'No token provided' 
      });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as {
      userId: string;
      username: string;
      role: string;
      platformId?: string;
      email?: string;
      companyId?: string;
    };
    
    // ✅ ADD DATABASE LOOKUP (missing in current version)
    const user = await postgresDatabase.getUserById(decoded.userId);
    
    if (!user) {
      return reply.status(401).send({ 
        success: false,
        error: 'User not found' 
      });
    }
    
    // Map full user data
    request.user = {
      id: user.id,
      username: user.username,
      role: user.role,
      platformId: user.platformId,
      email: user.email,
      companyId: user.companyId,
      linkedInvestorId: user.linkedInvestorId,
      permissions: user.permissions,
      isActive: user.isActive
    };
  } catch (error) {
    request.log.error(error, 'Authentication failed');
    return reply.status(401).send({ 
      success: false,
      error: 'Invalid token',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}
```

**Estimate:** 30 min  
**Priority:** 🔴 P0

---

#### 2. **Migruj `/api/bulk/*` Routes**
**Problém:** Frontend používa `/api/bulk/data` na načítanie všetkých dát naraz  
**Riešenie:** Portuj `backend/src/routes/bulk.ts` → `backend/src/fastify/routes/bulk.ts`

**Kľúčové endpointy:**
- `GET /api/bulk/data` - Load all data in parallel (vehicles, rentals, customers, companies, etc.)

**Estimate:** 2 hours  
**Priority:** 🔴 P0

---

#### 3. **Migruj `/api/admin/*` Routes**
**Problém:** Admin panel nefunguje  
**Riešenie:** Portuj `backend/src/routes/admin.ts` → `backend/src/fastify/routes/admin.ts`

**Kľúčové endpointy:**
- `POST /api/admin/get-token` - Admin token generation
- `POST /api/admin/reset-database` - Database reset
- `GET /api/admin/stats` - Admin statistics

**Estimate:** 2 hours  
**Priority:** 🔴 P0

---

#### 4. **Migruj `/api/permissions/*` Routes**
**Problém:** User management permissions nefungujú  
**Riešenie:** Portuj `backend/src/routes/permissions.ts` → `backend/src/fastify/routes/permissions.ts`

**Estimate:** 1.5 hours  
**Priority:** 🔴 P0

---

#### 5. **Migruj `/api/vehicle-documents/*` Routes**
**Problém:** Document upload a management nefunguje  
**Riešenie:** Portuj `backend/src/routes/vehicle-documents.ts` → `backend/src/fastify/routes/vehicle-documents.ts`

**Special note:** Musí sa upraviť file upload syntax pre Fastify multipart!

**Estimate:** 2 hours  
**Priority:** 🔴 P0

---

### 🟡 TIER 2 - HIGH (Fix Soon)

#### 6. **Migruj Email Routes**
**Routes:**
- `/api/email-imap/*` - IMAP monitoring
- `/api/email-management/*` - Email dashboard
- `/api/email-webhook/*` - Email webhooks

**Estimate:** 3 hours  
**Priority:** 🟡 P1

---

#### 7. **Migruj Document & Storage Routes**
**Routes:**
- `/api/company-documents/*` - Company file management
- `/api/r2-files/*` - R2 cloud storage

**Estimate:** 2 hours  
**Priority:** 🟡 P1

---

#### 8. **Migruj Utility Routes**
**Routes:**
- `/api/cache/*` - Cache control
- `/api/insurance-claims/*` - Insurance claims
- `/api/vehicle-unavailability/*` - Vehicle calendar unavailability

**Estimate:** 2.5 hours  
**Priority:** 🟡 P1

---

#### 9. **Implementuj RequestId Middleware**
**Problém:** Fastify nemá unique request tracking  
**Riešenie:** Vytvor Fastify plugin pre requestId

```typescript
// backend/src/fastify/plugins/request-id.ts
import fp from 'fastify-plugin';
import type { FastifyPluginAsync } from 'fastify';
import { randomUUID } from 'crypto';

const requestIdPlugin: FastifyPluginAsync = async (fastify) => {
  fastify.decorateRequest('requestId', '');

  fastify.addHook('onRequest', async (request) => {
    request.requestId = randomUUID();
    request.log = request.log.child({ requestId: request.requestId });
  });
};

export default fp(requestIdPlugin);

declare module 'fastify' {
  interface FastifyRequest {
    requestId: string;
  }
}
```

**Estimate:** 1 hour  
**Priority:** 🟡 P1

---

#### 10. **Zjednoť Error Handling**
**Problém:** Fastify error handling je nekonzistentný  
**Riešenie:** Vytvor Fastify error handler plugin

```typescript
// backend/src/fastify/plugins/error-handler.ts
import fp from 'fastify-plugin';
import type { FastifyPluginAsync, FastifyError } from 'fastify';

const errorHandlerPlugin: FastifyPluginAsync = async (fastify) => {
  fastify.setErrorHandler((error: FastifyError, request, reply) => {
    const statusCode = error.statusCode || 500;
    
    request.log.error({
      error: error.message,
      stack: error.stack,
      requestId: request.requestId
    });

    reply.status(statusCode).send({
      success: false,
      error: error.message || 'Internal server error',
      requestId: request.requestId,
      timestamp: new Date().toISOString()
    });
  });
};

export default fp(errorHandlerPlugin);
```

**Estimate:** 1.5 hours  
**Priority:** 🟡 P1

---

### 🟢 TIER 3 - MEDIUM (Lower Priority)

#### 11. **Migruj Maintenance Routes**
**Routes:**
- `/api/cleanup/*` - Database cleanup
- `/api/migration/*` - Data migrations (dev only)
- `/api/push/*` - Push notifications (experimental)
- `/api/feature-flags/*` - Feature flags

**Estimate:** 2 hours  
**Priority:** 🟢 P2

---

#### 12. **Odstráň/Archivuj Legacy Routes**
**Routes:**
- `/api/advanced-users/*` - Legacy user system

**Estimate:** 30 min  
**Priority:** 🟢 P3

---

## 📋 IMPLEMENTATION CHECKLIST

### Phase 1: Critical Fixes (Day 1)
- [ ] Fix auth decorator with database lookup
- [ ] Migrate `/api/bulk/*` routes
- [ ] Migrate `/api/admin/*` routes
- [ ] Migrate `/api/permissions/*` routes
- [ ] Migrate `/api/vehicle-documents/*` routes

**Estimate:** 8 hours

---

### Phase 2: High Priority (Day 2-3)
- [ ] Migrate email routes (imap, management, webhook)
- [ ] Migrate document routes (company-documents, r2-files)
- [ ] Migrate utility routes (cache, insurance-claims, vehicle-unavailability)
- [ ] Implement requestId middleware
- [ ] Unified error handling

**Estimate:** 10 hours

---

### Phase 3: Medium Priority (Day 4)
- [ ] Migrate maintenance routes
- [ ] Remove legacy routes
- [ ] Code cleanup
- [ ] Documentation update

**Estimate:** 3 hours

---

### Phase 4: Testing & QA (Day 5)
- [ ] Unit tests for migrated routes
- [ ] Integration tests
- [ ] E2E tests
- [ ] Performance testing
- [ ] Security audit

**Estimate:** 6 hours

---

## 🔄 MIGRATION PROCESS (Per Route)

### Step 1: Copy & Convert
```bash
# Copy Express route to Fastify
cp backend/src/routes/[route].ts backend/src/fastify/routes/[route].ts
```

### Step 2: Update Syntax
```typescript
// Express
const router = Router();
router.get('/endpoint', authenticateToken, async (req, res) => {
  // ...
});
export default router;

// Fastify
export default async function routePlugin(fastify: FastifyInstance) {
  fastify.get('/api/endpoint', {
    preHandler: [authenticateFastify]
  }, async (request, reply) => {
    // ...
  });
}
```

### Step 3: Update Auth & Permissions
```typescript
// Express
authenticateToken, checkPermission('resource', 'action')

// Fastify
preHandler: [authenticateFastify, checkPermissionFastify('resource', 'action')]
```

### Step 4: Update Request/Response
```typescript
// Express
req.user, req.body, req.params, req.query
res.json({ success: true, data })

// Fastify
request.user, request.body, request.params, request.query
return { success: true, data } // or reply.send()
```

### Step 5: Update Error Handling
```typescript
// Express
throw createUnauthorizedError('message')
next(error)

// Fastify
return reply.status(401).send({ success: false, error: 'message' })
```

### Step 6: Update File Uploads (if applicable)
```typescript
// Express (multer)
const upload = multer({ dest: 'uploads/' });
router.post('/upload', upload.single('file'), async (req, res) => {
  const file = req.file;
});

// Fastify (@fastify/multipart)
fastify.post('/api/upload', async (request, reply) => {
  const data = await request.file();
  const buffer = await data.toBuffer();
});
```

### Step 7: Register Route
```typescript
// backend/src/fastify-app.ts
const newRoute = await import('./fastify/routes/[route]');
await fastify.register(newRoute.default);
```

### Step 8: Test
```bash
# Start Fastify server
pnpm run dev:fastify

# Test endpoint
curl -X GET http://localhost:3001/api/[endpoint] \
  -H "Authorization: Bearer [token]"
```

---

## 🧪 TESTING STRATEGY

### Unit Tests
- Test každú route individually
- Mock database calls
- Test auth & permissions
- Test error cases

### Integration Tests
- Test full API flow
- Real database
- Test cross-route dependencies

### E2E Tests
- Test frontend integration
- Test all user flows
- Test production-like environment

---

## 📊 SUCCESS METRICS

### Code Quality
- ✅ 0 TypeScript errors
- ✅ 0 ESLint warnings
- ✅ 100% routes migrated
- ✅ All tests passing

### Performance
- ✅ Response time < 200ms (avg)
- ✅ Throughput >= Express baseline
- ✅ Memory usage < Express

### Functionality
- ✅ All frontend features working
- ✅ No 404 errors in production
- ✅ Auth & permissions working correctly
- ✅ File uploads working
- ✅ WebSocket real-time updates working

---

## 🚀 DEPLOYMENT PLAN

### Option 1: Feature Flag Rollout
```typescript
// Use environment variable to switch
const USE_FASTIFY = process.env.USE_FASTIFY === 'true';

if (USE_FASTIFY) {
  // Start Fastify
} else {
  // Start Express
}
```

### Option 2: Staged Rollout
1. Deploy Fastify to staging
2. Test 24-48 hours
3. Deploy to production
4. Monitor for issues
5. Rollback plan ready

### Option 3: Complete & Deploy
1. Finish all migrations
2. Test thoroughly
3. Deploy all at once

**Recommended:** Option 2 (Staged Rollout)

---

## 🔙 ROLLBACK PLAN

### If Fastify fails in production:

```bash
# 1. Revert railway.json
git revert [commit-hash]

# 2. Or manual fix
# Edit railway.json
{
  "deploy": {
    "startCommand": "node dist/index.js"  // Back to Express
  }
}

# 3. Push
git commit -m "fix: rollback to express"
git push

# 4. Railway auto-deploys
```

**Rollback time:** ~5 minutes

---

## 📝 NOTES

- Keep Express code intact during migration (for rollback)
- Test each route after migration
- Use feature flags for gradual rollout
- Monitor logs and errors closely
- Keep documentation updated

---

**Total Estimate:** 27 hours (3-4 days)  
**Recommended Timeline:** 1 week (with testing & buffer)

---

**Autor:** Cursor AI  
**Dátum:** 2025-10-13  
**Status:** 📋 READY FOR IMPLEMENTATION


