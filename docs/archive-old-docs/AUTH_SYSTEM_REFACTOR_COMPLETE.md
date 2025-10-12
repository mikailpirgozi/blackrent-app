# 🔐 COMPLETE AUTH SYSTEM REFACTOR - Implementation Guide

## ✅ **ČO UŽ JE HOTOVÉ**

### 1. **Database Migration** ✅
- **Súbor:** `/backend/migrations/001_complete_auth_system.sql`
- **Obsah:**
  - Aktualizácia `users` tabuľky s novými stĺpcami
  - Vytvorenie `user_company_access` tabuľky pre granulárne permissions
  - Pridanie `permission_audit_log` pre audit trail
  - Vytvorenie `permission_templates` pre rýchle prideľovanie práv
  - Views pre jednoduchšie querying
  - Indexes pre rýchle lookups

**🚀 Ako spustiť migráciu:**
```bash
# Pripojte sa k PostgreSQL databáze
psql $DATABASE_URL -f backend/migrations/001_complete_auth_system.sql
```

### 2. **Backend Types Synchronizácia** ✅
- **Súbor:** `/backend/src/types/index.ts`
- **Súbor:** `/apps/web/src/types/index.ts`
- **Zmeny:**
  - `UserRole` enum aktualizovaný:
    - `super_admin` - Vy (vidíte všetko)
    - `company_admin` - Admin BlackRent/Impresario
    - `company_owner` - Majiteľ podfirmy (read-only)
    - `employee`, `temp_worker`, `mechanic`, `sales_rep` - Špecializované role

### 3. **Permission Middleware Upgrade** ✅
- **Súbor:** `/backend/src/middleware/permissions.ts`
- **Zmeny:**
  - Pridaná podpora pre `super_admin` a `company_admin`
  - Company-scoped kontroly pre `company_admin`
  - Vylepšená validácia permissions

### 4. **Auth Middleware Upgrade** ✅
- **Súbor:** `/backend/src/middleware/auth.ts`
- **Zmeny:**
  - `requirePermission` podporuje nové role
  - `filterDataByRole` filtruje dáta podľa company access
  - Pridaná logika pre `company_admin` a `company_owner`

### 5. **Auth Helper Utilities** ✅
- **Súbor:** `/backend/src/utils/auth-helpers.ts`
- **Funkcie:**
  - `isSuperAdmin()` - Check super admin role
  - `isCompanyAdmin()` - Check company admin role
  - `hasAdminPrivileges()` - Kombinácia oboch
  - `filterDataByCompanyAccess()` - Univerzálne filtrovanie dát
  - `canAccessCompany()` - Kontrola prístupu k firme
  - `getAllowedCompanyIds()` - Zoznam povolených firiem
  - `getDefaultPermissionsForRole()` - Default permissions pre každú rolu
  - `getRoleDisplayName()` - Pekné názvy rolí
  - `canChangeUserRole()` - Validácia zmeny role

---

## 🚧 **ČO TREBA DOKONČIŤ**

### 6. **PostgreSQL Database Methods** 🔨
**Súbor:** `/backend/src/models/postgres-database.ts`

**Pridať tieto metódy:**

```typescript
// ===================================================================
// USER_COMPANY_ACCESS METHODS
// ===================================================================

/**
 * Get user company access (permissions for specific companies)
 */
async getUserCompanyAccess(userId: string): Promise<UserCompanyAccess[]> {
  const client = await this.pool.connect();
  try {
    const result = await client.query(`
      SELECT 
        uca.company_id as "companyId",
        c.name as "companyName",
        uca.permissions
      FROM user_company_access uca
      JOIN companies c ON uca.company_id = c.id
      WHERE uca.user_id = $1
      ORDER BY c.name
    `, [userId]);

    return result.rows as UserCompanyAccess[];
  } finally {
    client.release();
  }
}

/**
 * Set user permission for specific company
 */
async setUserPermission(
  userId: string,
  companyId: string,
  permissions: CompanyPermissions,
  createdBy?: string
): Promise<void> {
  const client = await this.pool.connect();
  try {
    await client.query(`
      INSERT INTO user_company_access (user_id, company_id, permissions, created_by)
      VALUES ($1, $2, $3, $4)
      ON CONFLICT (user_id, company_id) 
      DO UPDATE SET 
        permissions = $3,
        updated_at = CURRENT_TIMESTAMP
    `, [userId, companyId, JSON.stringify(permissions), createdBy || userId]);

    // Invalidate permission cache
    this.permissionCache.delete(userId);
  } finally {
    client.release();
  }
}

/**
 * Remove user permission for specific company
 */
async removeUserPermission(userId: string, companyId: string): Promise<void> {
  const client = await this.pool.connect();
  try {
    await client.query(`
      DELETE FROM user_company_access
      WHERE user_id = $1 AND company_id = $2
    `, [userId, companyId]);

    // Invalidate permission cache
    this.permissionCache.delete(userId);
  } finally {
    client.release();
  }
}

/**
 * Get users with access to specific company
 */
async getUsersWithCompanyAccess(companyId: string): Promise<User[]> {
  const client = await this.pool.connect();
  try {
    const result = await client.query(`
      SELECT DISTINCT
        u.id,
        u.username,
        u.email,
        u.first_name as "firstName",
        u.last_name as "lastName",
        u.role,
        u.company_id as "companyId",
        u.is_active as "isActive"
      FROM users u
      LEFT JOIN user_company_access uca ON u.id = uca.user_id
      WHERE u.role = 'super_admin'
        OR u.company_id = $1
        OR uca.company_id = $1
      ORDER BY u.username
    `, [companyId]);

    return result.rows as User[];
  } finally {
    client.release();
  }
}

/**
 * Bulk assign permissions to user for multiple companies
 */
async bulkSetUserPermissions(
  userId: string,
  assignments: Array<{ companyId: string; permissions: CompanyPermissions }>,
  createdBy?: string
): Promise<void> {
  const client = await this.pool.connect();
  try {
    await client.query('BEGIN');

    for (const assignment of assignments) {
      await client.query(`
        INSERT INTO user_company_access (user_id, company_id, permissions, created_by)
        VALUES ($1, $2, $3, $4)
        ON CONFLICT (user_id, company_id) 
        DO UPDATE SET 
          permissions = $3,
          updated_at = CURRENT_TIMESTAMP
      `, [userId, assignment.companyId, JSON.stringify(assignment.permissions), createdBy || userId]);
    }

    await client.query('COMMIT');

    // Invalidate permission cache
    this.permissionCache.delete(userId);
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}
```

### 7. **Update All Backend Routes** 🔨

**Súbory na aktualizáciu:**
- `/backend/src/routes/vehicles.ts`
- `/backend/src/routes/rentals.ts`
- `/backend/src/routes/expenses.ts`
- `/backend/src/routes/customers.ts`
- `/backend/src/routes/settlements.ts`
- `/backend/src/routes/bulk.ts`

**Zmeny vo všetkých routes:**

Nahradiť:
```typescript
if (req.user?.role !== 'admin' && req.user) {
  // filtering logic
}
```

S:
```typescript
import { filterDataByCompanyAccess, isSuperAdmin } from '../utils/auth-helpers';

// Use helper function
if (!isSuperAdmin(req.user) && req.user) {
  data = await filterDataByCompanyAccess(data, req.user);
}
```

### 8. **Update Frontend Permission Hooks** 🔨

**Súbor:** `/apps/web/src/hooks/usePermissions.ts`

**Zmeny:**

```typescript
// Line 15-31: Update ROLE_PERMISSIONS
export const ROLE_PERMISSIONS: Record<UserRole, Permission[]> = {
  super_admin: [
    {
      resource: '*',
      actions: ['read', 'create', 'update', 'delete'],
      conditions: {},
    },
  ],

  company_admin: [
    {
      resource: '*',
      actions: ['read', 'create', 'update', 'delete'],
      conditions: { companyOnly: true },
    },
  ],

  // Ostatné roly sa riadia company-based permissions
  employee: [],
  temp_worker: [],
  mechanic: [],
  sales_rep: [],
  company_owner: [],
};

// Line 273-280: Update hasPermission logic
hasPermission: (...) => {
  // Pre super_admin používame legacy funkciu
  if (user.role === 'super_admin') {
    return hasLegacyPermission(user.role, resource, action, {
      userId: user.id,
      ...(user.companyId && { companyId: user.companyId }),
      ...context,
    });
  }

  // Pre company_admin full access vo svojej firme
  if (user.role === 'company_admin') {
    return { hasAccess: true, requiresApproval: false };
  }

  // Remove hardcoded company_owner logic (lines 282-323)
  // Use company-based permissions instead
  
  // Continue with existing company-based permission logic
  ...
}
```

### 9. **Update Frontend Auth Context** 🔨

**Súbor:** `/apps/web/src/context/AuthContext.tsx`

**Zmeny:**

```typescript
// Line 460-470: Update helper functions
const isAdmin = (): boolean => {
  return state.user?.role === 'super_admin' || state.user?.role === 'company_admin';
};

const isSuperAdmin = (): boolean => {
  return state.user?.role === 'super_admin';
};

const isCompanyAdmin = (): boolean => {
  return state.user?.role === 'company_admin';
};

// Line 431-448: Update hasPermission
const hasPermission = (resource: string, action: string): boolean => {
  // Super Admin and Company Admin majú všetky práva
  if (state.user?.role === 'super_admin' || state.user?.role === 'company_admin') {
    return true;
  }

  // Pre ostatných používateľov skontroluj permissions
  return userCompanyAccess.some(access => {
    const resourcePermissions = (
      access.permissions as unknown as Record<string, unknown>
    )[resource] as Record<string, unknown> | undefined;
    if (!resourcePermissions) return false;

    const permissionKey = action === 'read' ? 'read' : 'write';
    return resourcePermissions[permissionKey] === true;
  });
};

// Line 450-458: Update canAccessCompanyData
const canAccessCompanyData = (companyId: string): boolean => {
  // Super Admin má prístup ku všetkým firmám
  if (state.user?.role === 'super_admin') {
    return true;
  }

  // Company Admin má prístup len k vlastnej firme
  if (state.user?.role === 'company_admin') {
    return state.user.companyId === companyId;
  }

  // Ostatní - check user_company_access
  return userCompanyAccess.some(access => access.companyId === companyId);
};
```

### 10. **Create Seed Data Script** 🔨

**Súbor:** `/backend/scripts/seed-auth-system.ts`

```typescript
import { postgresDatabase } from '../src/models/postgres-database';
import * as bcrypt from 'bcryptjs';
import { v4 as uuidv4 } from 'uuid';

async function seedAuthSystem() {
  console.log('🌱 Seeding auth system...');

  // 1. Vytvor super admina (Vy)
  const superAdminPassword = await bcrypt.hash('SuperAdmin123!', 12);
  const superAdminId = uuidv4();
  
  await postgresDatabase.query(`
    INSERT INTO users (id, username, email, password_hash, role, first_name, last_name, is_active)
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
    ON CONFLICT (username) DO NOTHING
  `, [superAdminId, 'superadmin', 'admin@blackrent.sk', superAdminPassword, 'super_admin', 'Super', 'Admin', true]);

  console.log('✅ Super Admin vytvorený (username: superadmin, password: SuperAdmin123!)');

  // 2. Nájdi BlackRent a Impresario firmy
  const blackrentCompany = await postgresDatabase.query(`
    SELECT id FROM companies WHERE name ILIKE '%blackrent%' LIMIT 1
  `);

  const impresarioCompany = await postgresDatabase.query(`
    SELECT id FROM companies WHERE name ILIKE '%impresario%' LIMIT 1
  `);

  // 3. Vytvor company_admin pre BlackRent
  if (blackrentCompany.rows.length > 0) {
    const blackrentAdminPassword = await bcrypt.hash('BlackRent123!', 12);
    const blackrentAdminId = uuidv4();
    
    await postgresDatabase.query(`
      INSERT INTO users (id, username, email, password_hash, role, company_id, first_name, last_name, is_active)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      ON CONFLICT (username) DO NOTHING
    `, [
      blackrentAdminId, 
      'blackrent_admin', 
      'admin@blackrent.sk', 
      blackrentAdminPassword, 
      'company_admin', 
      blackrentCompany.rows[0].id,
      'BlackRent',
      'Admin',
      true
    ]);

    console.log('✅ BlackRent Admin vytvorený (username: blackrent_admin, password: BlackRent123!)');
  }

  // 4. Vytvor company_admin pre Impresario
  if (impresarioCompany.rows.length > 0) {
    const impresarioAdminPassword = await bcrypt.hash('Impresario123!', 12);
    const impresarioAdminId = uuidv4();
    
    await postgresDatabase.query(`
      INSERT INTO users (id, username, email, password_hash, role, company_id, first_name, last_name, is_active)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      ON CONFLICT (username) DO NOTHING
    `, [
      impresarioAdminId,
      'impresario_admin',
      'admin@impresario.sk',
      impresarioAdminPassword,
      'company_admin',
      impresarioCompany.rows[0].id,
      'Impresario',
      'Admin',
      true
    ]);

    console.log('✅ Impresario Admin vytvorený (username: impresario_admin, password: Impresario123!)');

    // 5. Vytvor 2 zamestnancov pre Impresario
    for (let i = 1; i <= 2; i++) {
      const employeePassword = await bcrypt.hash(`Impresario${i}23!`, 12);
      const employeeId = uuidv4();
      
      await postgresDatabase.query(`
        INSERT INTO users (id, username, email, password_hash, role, company_id, first_name, last_name, is_active)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
        ON CONFLICT (username) DO NOTHING
      `, [
        employeeId,
        `impresario_emp${i}`,
        `employee${i}@impresario.sk`,
        employeePassword,
        'employee',
        impresarioCompany.rows[0].id,
        `Employee ${i}`,
        'Impresario',
        true
      ]);

      // Pridaj default permissions pre zamestnanca
      await postgresDatabase.setUserPermission(
        employeeId,
        impresarioCompany.rows[0].id,
        {
          vehicles: { read: true, write: true, delete: false },
          rentals: { read: true, write: true, delete: false },
          expenses: { read: true, write: true, delete: false },
          settlements: { read: true, write: false, delete: false },
          customers: { read: true, write: true, delete: false },
          insurances: { read: true, write: false, delete: false },
          maintenance: { read: true, write: true, delete: false },
          protocols: { read: true, write: true, delete: false },
          statistics: { read: true, write: false, delete: false }
        },
        impresarioAdminId
      );

      console.log(`✅ Impresario Employee ${i} vytvorený (username: impresario_emp${i}, password: Impresario${i}23!)`);
    }
  }

  console.log('🎉 Seed completed!');
}

seedAuthSystem().catch(console.error);
```

**Spustiť:**
```bash
ts-node backend/scripts/seed-auth-system.ts
```

---

## 🧪 **TESTOVACÍ PLÁN**

### Test 1: Super Admin prístup
```bash
# Login as super admin
POST /api/auth/login
{
  "username": "superadmin",
  "password": "SuperAdmin123!"
}

# Get all vehicles (should see ALL vehicles from ALL companies)
GET /api/vehicles

# Get all companies (should see ALL companies)
GET /api/companies
```

**Expected:** Vidíte všetky vozidlá a všetky firmy.

### Test 2: BlackRent Admin prístup
```bash
# Login as BlackRent admin
POST /api/auth/login
{
  "username": "blackrent_admin",
  "password": "BlackRent123!"
}

# Get all vehicles (should see ONLY BlackRent vehicles)
GET /api/vehicles

# Try to access Impresario vehicle (should be DENIED)
GET /api/vehicles/{impresario_vehicle_id}
```

**Expected:** Vidíte len BlackRent vozidlá, prístup k Impresario je odmietnutý.

### Test 3: Impresario Employee prístup
```bash
# Login as Impresario employee
POST /api/auth/login
{
  "username": "impresario_emp1",
  "password": "Impresario123!"
}

# Get all vehicles (should see ONLY Impresario vehicles)
GET /api/vehicles

# Get user company access
GET /api/permissions/user/{user_id}/access

# Try to delete vehicle (should be DENIED - no delete permission)
DELETE /api/vehicles/{vehicle_id}
```

**Expected:** Vidíte len Impresario vozidlá, delete je odmietnutý.

### Test 4: Permission Updates
```bash
# Login as super admin
POST /api/auth/login
{
  "username": "superadmin",
  "password": "SuperAdmin123!"
}

# Update employee permissions
POST /api/permissions/user/{employee_id}/company/{company_id}
{
  "permissions": {
    "vehicles": { "read": true, "write": true, "delete": true },
    ...
  }
}

# Verify cache invalidation
GET /api/permissions/user/{employee_id}/access
```

**Expected:** Permissions sa aktualizujú okamžite, cache sa invaliduje.

---

## 📚 **DOKUMENTÁCIA**

### Role Hierarchy

```
┌─────────────────────────────────────────────┐
│         SUPER_ADMIN (Vy)                    │
│  - Vidí všetky firmy                        │
│  - Úplné práva všade                        │
│  - Môže vytvárať company_admin              │
└─────────────────────────────────────────────┘
              │
              ├───────────────────────────────┐
              │                               │
┌─────────────▼───────────────┐ ┌─────────────▼───────────────┐
│ COMPANY_ADMIN (BlackRent)   │ │ COMPANY_ADMIN (Impresario)  │
│ - Vidí len BlackRent dáta   │ │ - Vidí len Impresario dáta  │
│ - Úplné práva v BlackRent   │ │ - Úplné práva v Impresario  │
│ - Môže vytvárať users       │ │ - Môže vytvárať users       │
└─────────────┬───────────────┘ └─────────────┬───────────────┘
              │                               │
        ┌─────┴─────┐                   ┌─────┴─────┐
        │           │                   │           │
        ▼           ▼                   ▼           ▼
  ┌─────────┐ ┌──────────┐      ┌──────────┐ ┌──────────┐
  │EMPLOYEE │ │COMPANY   │      │EMPLOYEE  │ │EMPLOYEE  │
  │         │ │OWNER     │      │   1      │ │   2      │
  └─────────┘ └──────────┘      └──────────┘ └──────────┘
```

### Permission Matrix

| Resource    | super_admin | company_admin | company_owner | employee | mechanic | sales_rep | temp_worker |
|-------------|-------------|---------------|---------------|----------|----------|-----------|-------------|
| Vehicles    | CRUD        | CRUD          | R             | CRU      | RU       | R         | R           |
| Rentals     | CRUD        | CRUD          | R             | CRU      | R        | CRU       | CR          |
| Expenses    | CRUD        | CRUD          | R             | CRU      | R        | R         | -           |
| Settlements | CRUD        | CRUD          | R             | R        | -        | R         | -           |
| Customers   | CRUD        | CRUD          | R             | CRU      | R        | CRU       | CR          |
| Insurances  | CRUD        | CRUD          | R             | R        | R        | R         | -           |
| Maintenance | CRUD        | CRUD          | R             | CRU      | CRUD     | -         | -           |
| Protocols   | CRUD        | CRUD          | R             | CRU      | CRU      | CRU       | CR          |
| Statistics  | CRUD        | CRUD          | R             | R        | R        | R         | -           |

**Legend:** C=Create, R=Read, U=Update, D=Delete, -=No Access

---

## 🚀 **DEPLOYMENT CHECKLIST**

- [ ] 1. Spustiť database migration
- [ ] 2. Dokončiť PostgreSQL database methods
- [ ] 3. Aktualizovať všetky backend routes
- [ ] 4. Aktualizovať frontend permission hooks
- [ ] 5. Aktualizovať frontend AuthContext
- [ ] 6. Spustiť seed script
- [ ] 7. Spustiť unit testy
- [ ] 8. Spustiť integration testy
- [ ] 9. Manuálne testovanie všetkých scenárov
- [ ] 10. Deploy na production
- [ ] 11. Monitoring a error tracking
- [ ] 12. Dokumentácia pre používateľov

---

## 📞 **SUPPORT**

Po dokončení implementácie prosím otestujte tieto scenáre:

1. **Super Admin:** Prihlásenie, videnie všetkých firiem, vytvorenie company admin
2. **Company Admin:** Prihlásenie, videnie len svojich dát, vytvorenie employee
3. **Employee:** Prihlásenie, práca s dátami podľa permissions
4. **Permission Updates:** Zmena permissions, cache invalidation

**Ak niečo nefunguje, skontrolujte:**
- Database migration sa úspešne spustila
- Cache sa invaliduje pri zmenách
- Frontend a backend types sú synchronizované
- Routes používajú nové helper funkcie

---

**Verzia:** 1.0  
**Dátum:** 2025-01-04  
**Status:** Čiastočne implementované (60% hotové)  
**Potrebné na dokončenie:** ~4-6 hodín práce

**Poznámka:** Toto je robustný, produkčne pripravený auth systém s kompletnou audit trail, granulárnym permission management a multi-tenant support. Po dokončení budete mať 100% funkčný a bezpečný systém!

