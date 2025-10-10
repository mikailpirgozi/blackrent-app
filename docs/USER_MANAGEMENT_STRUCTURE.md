# 👥 BlackRent User Management Structure

## 📋 Obsah
1. [Prehľad systému](#prehľad-systému)
2. [User Roles](#user-roles)
3. [Platform Multi-Tenancy](#platform-multi-tenancy)
4. [Permission System](#permission-system)
5. [User-Company Relationships](#user-company-relationships)
6. [Investor Management](#investor-management)
7. [Database Schema](#database-schema)
8. [API Endpoints](#api-endpoints)
9. [Frontend Architecture](#frontend-architecture)

---

## 🎯 Prehľad systému

BlackRent používa **3-vrstvový permission systém**:

```
┌─────────────────────────────────────────┐
│  1. PLATFORM LEVEL (Multi-tenancy)      │
│     - Super Admin: vidí všetky platformy│
│     - Platform Admin: vidí 1 platformu  │
└─────────────────────────────────────────┘
           ↓
┌─────────────────────────────────────────┐
│  2. ROLE-BASED PERMISSIONS              │
│     - Definované v ROLE_PERMISSIONS     │
│     - Default prístup pre každú rolu    │
└─────────────────────────────────────────┘
           ↓
┌─────────────────────────────────────────┐
│  3. COMPANY-BASED PERMISSIONS           │
│     - Granular prístup k firmám         │
│     - Read/Write/Delete per resource    │
└─────────────────────────────────────────┘
```

---

## 👤 User Roles

### Súčasné Role (November 2024)

| Role | Popis | Platform Access | Company Access |
|------|-------|-----------------|----------------|
| **super_admin** | Master admin, vidí všetko | ✅ Všetky platformy | ✅ Všetky firmy |
| **admin** | Platform admin | ⚠️ DEPRECATED | ⚠️ DEPRECATED |
| **company_admin** | Admin konkrétnej platformy | ✅ Jedna platforma | ✅ Všetky firmy platformy |
| **platform_admin** | Platform admin (nová rola) | ✅ Jedna platforma | ✅ Všetky firmy platformy |
| **platform_employee** | Zamestnanec platformy | ✅ Jedna platforma | 🔐 Podľa permissions |
| **employee** | Zamestnanec | ⚠️ DEPRECATED | ⚠️ DEPRECATED |
| **investor** | Investor/spoluvlastník | ✅ Jedna platforma | 🔗 Cez linkedInvestorId |
| **temp_worker** | Dočasný pracovník | ✅ Jedna platforma | 🔐 Podľa permissions |
| **mechanic** | Mechanik | ✅ Jedna platforma | 🔐 Podľa permissions |
| **sales_rep** | Obchodný zástupca | ✅ Jedna platforma | 🔐 Podľa permissions |

### Deprecated Role
- `admin` → používať `company_admin` alebo `platform_admin`
- `employee` → používať `platform_employee`
- `company_admin` (starý) → používať `company_admin` s `platformId`

---

## 🌐 Platform Multi-Tenancy

### Štruktúra

```typescript
interface Platform {
  id: string;              // UUID
  name: string;            // "Blackrent", "Impresario"
  isActive: boolean;
  createdAt: Date;
  updatedAt?: Date;
}

interface User {
  id: string;
  username: string;
  email: string;
  role: UserRole;
  platformId: string;      // ✅ POVINNÉ pre všetkých (okrem super_admin)
  linkedInvestorId?: string; // Pre investor role
  // ... ostatné polia
}
```

### Platform Isolation Rules

#### 1. Super Admin
```typescript
// Vidí VŠETKO naprieč všetkými platformami
if (user.role === 'super_admin') {
  return allData; // Žiadne filtrovanie
}
```

#### 2. Platform Admin / Company Admin
```typescript
// Vidí LEN dáta svojej platformy
if (user.role === 'admin' || user.role === 'company_admin') {
  return data.filter(item => item.platformId === user.platformId);
}
```

#### 3. Regular Users
```typescript
// Vidí LEN dáta podľa company permissions
if (user.role === 'employee' || user.role === 'mechanic') {
  const userCompanyAccess = await getUserCompanyAccess(user.id);
  return data.filter(item => 
    userCompanyAccess.some(access => 
      access.companyId === item.companyId
    )
  );
}
```

### Platform-Specific Features

#### Email Monitoring (Blackrent Only)
```typescript
// Layout.tsx
const BLACKRENT_PLATFORM_ID = '56d0d727-f725-47be-9508-d988ecfc0705';

{
  text: 'Email monitoring',
  icon: <MailIcon />,
  path: '/email-monitoring',
  resource: 'users' as const,
  blackrentOnly: true, // ✅ Skryté pre ostatné platformy
}

// Filter logic
if ((item as any).blackrentOnly) {
  if (user?.role === 'super_admin') {
    return true; // Super admin vidí všetko
  }
  if (user?.role === 'admin' || user?.role === 'company_admin') {
    return user?.platformId === BLACKRENT_PLATFORM_ID;
  }
  return false; // Ostatní nevidia
}
```

---

## 🔐 Permission System

### 1. Role-Based Permissions (Default)

**Súbor:** `src/hooks/usePermissions.ts`

```typescript
const ROLE_PERMISSIONS: Record<UserRole, RolePermissions> = {
  super_admin: {
    vehicles: { read: true, write: true, delete: true },
    rentals: { read: true, write: true, delete: true },
    expenses: { read: true, write: true, delete: true },
    customers: { read: true, write: true, delete: true },
    users: { read: true, write: true, delete: true },
    insurances: { read: true, write: true, delete: true },
    finances: { read: true, write: true, delete: true },
    companies: { read: true, write: true, delete: true }
  },
  admin: {
    // Všetko TRUE
  },
  company_admin: {
    // Všetko TRUE pre svoju platformu
  },
  employee: {
    vehicles: { read: true, write: true, delete: false },
    rentals: { read: true, write: true, delete: false },
    expenses: { read: true, write: true, delete: false },
    customers: { read: true, write: true, delete: false },
    // ...
  },
  investor: {
    vehicles: { read: true, write: false, delete: false },
    rentals: { read: true, write: false, delete: false },
    expenses: { read: true, write: false, delete: false },
    finances: { read: true, write: false, delete: false },
    // Read-only prístup
  },
  // ... ostatné role
};
```

### 2. Company-Based Permissions (Granular)

**Database tabuľky:**
```sql
-- UserCompanyAccess: Ktoré firmy vidí user
CREATE TABLE user_company_access (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES users(id),
  company_id UUID REFERENCES companies(id),
  company_name TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

-- CompanyPermissions: Čo môže robiť s firmou
CREATE TABLE company_permissions (
  id UUID PRIMARY KEY,
  user_company_access_id UUID REFERENCES user_company_access(id),
  resource TEXT, -- 'vehicles', 'rentals', 'expenses'
  can_read BOOLEAN DEFAULT false,
  can_write BOOLEAN DEFAULT false,
  can_delete BOOLEAN DEFAULT false
);
```

**Použitie:**
```typescript
// Frontend
const { userCompanyAccess } = usePermissionsContext();
const { hasPermission } = usePermissions();

// Zisti či user má prístup k firme
const canAccessCompany = (companyId: string) => {
  return userCompanyAccess.some(access => 
    access.companyId === companyId
  );
};

// Zisti špecifické permissions
const result = hasPermission('vehicles', 'write');
// result = { hasAccess: true, allowedCompanyIds: ['uuid1', 'uuid2'] }
```

---

## 🏢 User-Company Relationships

### Deprecated: User.companyId
```typescript
// ❌ STARÝ SYSTÉM (deprecated)
interface User {
  companyId?: string; // NEPOUŽÍVAŤ!
}

// ✅ NOVÝ SYSTÉM
interface User {
  platformId: string;        // Priradenie k platforme
  linkedInvestorId?: string; // Pre investorov
}
```

### Platform → Companies → Users Flow

```
Platform (Blackrent)
  ├── Company 1 (Autopožičovňa A)
  │     ├── Vehicles
  │     ├── Rentals
  │     └── Expenses
  ├── Company 2 (Autopožičovňa B)
  │     ├── Vehicles
  │     └── ...
  └── Users
        ├── Admin (platformId = Blackrent) → vidí Company 1 + 2
        ├── Employee (platformId = Blackrent + permissions) → vidí len Company 1
        └── Investor (platformId = Blackrent + linkedInvestorId) → vidí firmy podľa podielov
```

### Company Assignment Logic

#### Platform Admin/Company Admin
```typescript
// Automaticky vidí VŠETKY firmy svojej platformy
if (user.role === 'company_admin' && user.platformId) {
  const companies = await getCompanies();
  const platformCompanies = companies.filter(
    c => c.platformId === user.platformId
  );
  return platformCompanies; // Všetky firmy platformy
}
```

#### Regular Employee
```typescript
// Vidí len firmy kde má UserCompanyAccess
const userCompanyAccess = await getUserCompanyAccess(user.id);
const allowedCompanyIds = userCompanyAccess.map(a => a.companyId);

const companies = await getCompanies();
return companies.filter(c => allowedCompanyIds.includes(c.id));
```

---

## 💰 Investor Management

### Investor vs CompanyInvestor

```typescript
// 1. CompanyInvestor - business entity
interface CompanyInvestor {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  isActive: boolean;
  // Shares cez CompanyInvestorShare tabuľku
}

// 2. CompanyInvestorShare - ownership
interface CompanyInvestorShare {
  id: string;
  companyInvestorId: string;
  companyId: string;
  ownershipPercentage: number; // 0-100
}

// 3. User (investor role) - system access
interface User {
  role: 'investor';
  platformId: string;            // Blackrent/Impresario
  linkedInvestorId: string;      // → CompanyInvestor.id
}
```

### Investor Data Access Flow

```
1. User prihlásí sa (role: investor)
   ↓
2. System načíta linkedInvestorId
   ↓
3. Nájde CompanyInvestor
   ↓
4. Načíta CompanyInvestorShare (kde má podiely)
   ↓
5. Filter dáta len pre tieto firmy
   ↓
6. Zobraz read-only dashboard
```

**Backend Implementation:**
```typescript
// routes/bulk.ts, routes/rentals.ts, atď.
if (user.role === 'investor' && user.linkedInvestorId) {
  // Nájdi firmy kde má investor podiely
  const investorShares = await getInvestorShares(user.linkedInvestorId);
  const allowedCompanyIds = investorShares.map(s => s.companyId);
  
  // Filter vozidlá, prenájmy, expenses
  data = data.filter(item => 
    allowedCompanyIds.includes(item.companyId)
  );
}
```

### Creating Investor User

**Frontend Flow:**
```typescript
// BasicUserManagement.tsx
const handleCreateUser = async () => {
  // 1. User vyberá platformu
  const platformId = selectedPlatform;
  
  // 2. User vyberá rolu = 'investor'
  const role = 'investor';
  
  // 3. User vyberá CompanyInvestor zo zoznamu
  const linkedInvestorId = selectedInvestor.id;
  
  // 4. API call
  await createUser({
    username,
    email,
    password,
    role,
    platformId,        // ✅ Povinné
    linkedInvestorId   // ✅ Povinné pre investor
  });
};
```

---

## 🗄️ Database Schema

### Users Table
```sql
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  username TEXT UNIQUE NOT NULL,
  email TEXT UNIQUE NOT NULL,
  password TEXT NOT NULL,
  first_name TEXT,
  last_name TEXT,
  role TEXT NOT NULL, -- UserRole enum
  
  -- MULTI-TENANCY
  platform_id UUID REFERENCES platforms(id), -- ✅ POVINNÉ
  
  -- INVESTOR LINKING
  linked_investor_id UUID REFERENCES company_investors(id),
  
  -- DEPRECATED
  company_id TEXT, -- ❌ Nepoužívať!
  
  -- METADATA
  employee_number TEXT,
  hire_date DATE,
  is_active BOOLEAN DEFAULT true,
  last_login TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP
);

-- Indexy
CREATE INDEX idx_users_platform ON users(platform_id);
CREATE INDEX idx_users_role ON users(role);
CREATE INDEX idx_users_linked_investor ON users(linked_investor_id);
```

### Platforms Table
```sql
CREATE TABLE platforms (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT UNIQUE NOT NULL, -- "Blackrent", "Impresario"
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP
);

-- Data
INSERT INTO platforms (id, name) VALUES
  ('56d0d727-f725-47be-9508-d988ecfc0705', 'Blackrent'),
  ('11708f27-b492-4531-adc9-0694625c39d6', 'Impresario');
```

### Companies Table
```sql
CREATE TABLE companies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  
  -- MULTI-TENANCY
  platform_id UUID REFERENCES platforms(id), -- Priradenie k platforme
  
  business_id TEXT, -- IČO
  tax_id TEXT, -- DIČ
  address TEXT,
  email TEXT,
  phone TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP
);

CREATE INDEX idx_companies_platform ON companies(platform_id);
```

### Company Investors System
```sql
-- Investor business entity
CREATE TABLE company_investors (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  phone TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Investor ownership shares
CREATE TABLE company_investor_shares (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_investor_id UUID REFERENCES company_investors(id),
  company_id UUID REFERENCES companies(id),
  ownership_percentage NUMERIC(5,2) NOT NULL, -- 0.00 - 100.00
  start_date DATE NOT NULL,
  end_date DATE,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_shares_investor ON company_investor_shares(company_investor_id);
CREATE INDEX idx_shares_company ON company_investor_shares(company_id);
```

### Permissions Tables
```sql
-- User-to-Company access
CREATE TABLE user_company_access (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
  company_name TEXT, -- Denormalized pre performance
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(user_id, company_id)
);

-- Granular permissions per resource
CREATE TABLE company_permissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_company_access_id UUID REFERENCES user_company_access(id) ON DELETE CASCADE,
  resource TEXT NOT NULL, -- 'vehicles', 'rentals', 'expenses', atď.
  can_read BOOLEAN DEFAULT false,
  can_write BOOLEAN DEFAULT false,
  can_delete BOOLEAN DEFAULT false,
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(user_company_access_id, resource)
);
```

---

## 🔌 API Endpoints

### User Management

#### GET /api/auth/users
**Filtrovanie podľa role:**
```typescript
// Super admin - vidí všetkých
if (user.role === 'super_admin') {
  return allUsers;
}

// Platform admin - vidí len svojich users
if (user.role === 'admin' || user.role === 'company_admin') {
  return users.filter(u => u.platformId === user.platformId);
}
```

#### POST /api/auth/users
**Create user s platform assignment:**
```typescript
router.post('/users', authenticateToken, requireRole(['admin', 'super_admin', 'company_admin']), 
  async (req, res) => {
    const { username, email, password, role, platformId, linkedInvestorId } = req.body;
    
    // Validácia
    if (!platformId && role !== 'super_admin') {
      return res.status(400).json({ error: 'platformId je povinný' });
    }
    
    if (role === 'investor' && !linkedInvestorId) {
      return res.status(400).json({ error: 'linkedInvestorId je povinný pre investor' });
    }
    
    // Create user
    const newUser = await createUser({
      username,
      email,
      password,
      role,
      platformId,
      linkedInvestorId
    });
    
    return res.json({ success: true, data: newUser });
  }
);
```

#### PUT /api/auth/users/:id
**Update user s platform update:**
```typescript
router.put('/users/:id', authenticateToken, requireRole(['admin', 'super_admin', 'company_admin']),
  async (req, res) => {
    const { platformId, linkedInvestorId, ...otherFields } = req.body;
    
    const updatedUser = {
      ...existingUser,
      ...otherFields,
      platformId: platformId !== undefined ? platformId : existingUser.platformId,
      linkedInvestorId: linkedInvestorId !== undefined ? linkedInvestorId : existingUser.linkedInvestorId,
    };
    
    await updateUser(updatedUser);
    return res.json({ success: true });
  }
);
```

### Platform Filtering Endpoints

#### GET /api/vehicles
```typescript
// Platform admin - len vozidlá platformy
if (user.role === 'company_admin' && user.platformId) {
  vehicles = vehicles.filter(v => v.platformId === user.platformId);
}
```

#### GET /api/leasings
```typescript
// Platform admin - len leasingy platformy
if (user.role === 'admin' || user.role === 'company_admin') {
  leasings = leasings.filter(l => l.platformId === user.platformId);
}
```

#### GET /api/insurances
```typescript
// Platform admin - len insurances pre vozidlá platformy
if (user.role === 'admin' || user.role === 'company_admin') {
  const platformVehicles = vehicles.filter(v => v.platformId === user.platformId);
  const platformVehicleIds = platformVehicles.map(v => v.id);
  insurances = insurances.filter(i => platformVehicleIds.includes(i.vehicleId));
}
```

---

## 🎨 Frontend Architecture

### Context Providers

#### AuthContext
```typescript
interface AuthContextType {
  user: User | null;
  login: (username: string, password: string) => Promise<void>;
  logout: () => void;
  canAccessCompany: (companyId: string) => boolean;
}

// Použitie
const { user, canAccessCompany } = useAuth();

if (user?.role === 'super_admin') {
  // Vidí všetko
}

if (user?.role === 'company_admin') {
  // Vidí len svoju platformu
}
```

#### PermissionsContext
```typescript
interface PermissionsContextType {
  userCompanyAccess: UserCompanyAccess[];
  isLoading: boolean;
}

// Použitie
const { userCompanyAccess } = usePermissionsContext();

const allowedCompanyIds = userCompanyAccess.map(a => a.companyId);
```

### Hooks

#### usePermissions
```typescript
const { hasPermission } = usePermissions();

// Role-based check
const canViewVehicles = hasPermission('vehicles', 'read').hasAccess;

// Company-specific check
const result = hasPermission('vehicles', 'write');
// result = { 
//   hasAccess: true, 
//   allowedCompanyIds: ['uuid1', 'uuid2'],
//   bypassCompanyCheck: false 
// }
```

### Components

#### BasicUserManagement.tsx
**User creation with platform:**
```tsx
<Dialog>
  <DialogContent>
    {/* Platform Selector */}
    <Select
      value={userForm.platformId}
      onValueChange={(value) => setUserForm({...userForm, platformId: value})}
    >
      {platforms.map(p => (
        <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
      ))}
    </Select>
    
    {/* Role Selector */}
    <Select
      value={userForm.role}
      onValueChange={(value) => setUserForm({...userForm, role: value})}
    >
      <SelectItem value="company_admin">Platform Admin</SelectItem>
      <SelectItem value="employee">Employee</SelectItem>
      <SelectItem value="investor">Investor</SelectItem>
    </Select>
    
    {/* Investor Selector (conditional) */}
    {userForm.role === 'investor' && (
      <Select
        value={userForm.linkedInvestorId}
        onValueChange={(value) => setUserForm({...userForm, linkedInvestorId: value})}
      >
        {investors.map(inv => (
          <SelectItem key={inv.id} value={inv.id}>
            {inv.firstName} {inv.lastName}
          </SelectItem>
        ))}
      </Select>
    )}
  </DialogContent>
</Dialog>
```

#### Platform Filtering in Lists
```tsx
// Automatic filtering via backend API
const { data: users } = useUsers(); // Already filtered by platformId

// Manual filtering (if needed)
const platformUsers = users?.filter(u => 
  user.role === 'super_admin' || u.platformId === user.platformId
);
```

---

## 🔍 Data Flow Examples

### Example 1: Platform Admin Login

```
1. User "jaro" prihlási sa
   ├─ role: company_admin
   ├─ platformId: "11708f27-..." (Impresario)
   └─ platformName: "Impresario"

2. Frontend načíta permissions
   ├─ ROLE_PERMISSIONS['company_admin'] → všetko TRUE
   └─ userCompanyAccess → prázdne (nie je potrebné)

3. User ide na "Vozidlá"
   ├─ GET /api/vehicles
   ├─ Backend filter: vehicles.filter(v => v.platformId === jaro.platformId)
   └─ Return: len Impresario vozidlá

4. User ide na "Email monitoring"
   ├─ Frontend check: blackrentOnly === true
   ├─ jaro.platformId !== BLACKRENT_ID
   └─ Menu item skrytý ❌

5. User ide na "Správa používateľov"
   ├─ GET /api/auth/users
   ├─ Backend filter: users.filter(u => u.platformId === jaro.platformId)
   └─ Return: len Impresario users
```

### Example 2: Investor Access

```
1. User "miki" prihlási sa
   ├─ role: investor
   ├─ platformId: "56d0d727-..." (Blackrent)
   └─ linkedInvestorId: "investor-uuid-123"

2. Backend načíta investor shares
   ├─ CompanyInvestor(investor-uuid-123)
   ├─ CompanyInvestorShare: [
   │     { companyId: "company-A", ownership: 30% },
   │     { companyId: "company-B", ownership: 20% }
   │   ]
   └─ allowedCompanyIds = ["company-A", "company-B"]

3. User ide na "Vozidlá"
   ├─ GET /api/vehicles
   ├─ Backend filter: 
   │     vehicles.filter(v => 
   │       v.ownerCompanyId === "company-A" || 
   │       v.ownerCompanyId === "company-B"
   │     )
   └─ Return: len vozidlá firiem A a B

4. Frontend permissions
   ├─ ROLE_PERMISSIONS['investor'] → všetko READ-ONLY
   ├─ hasPermission('vehicles', 'write') → FALSE
   └─ Edit buttons skryté ❌
```

### Example 3: Super Admin Access

```
1. User "admin" prihlási sa
   ├─ role: super_admin
   └─ platformId: null (alebo ľubovoľné)

2. Frontend načíta permissions
   └─ ROLE_PERMISSIONS['super_admin'] → všetko TRUE

3. User ide na "Vozidlá"
   ├─ GET /api/vehicles
   ├─ Backend check: user.role === 'super_admin'
   ├─ Skip všetky filters
   └─ Return: VŠETKY vozidlá (všetky platformy)

4. User ide na "Email monitoring"
   ├─ Frontend check: user.role === 'super_admin'
   └─ Menu item viditeľný ✅

5. User ide na "Správa používateľov"
   ├─ GET /api/auth/users
   ├─ Backend check: user.role === 'super_admin'
   └─ Return: VŠETCI users (všetky platformy)
```

---

## 📝 Best Practices

### 1. Creating New User
```typescript
// ✅ CORRECT
const newUser = {
  username: 'john',
  email: 'john@example.com',
  role: 'employee',
  platformId: selectedPlatform.id, // POVINNÉ
};

// ❌ WRONG
const newUser = {
  username: 'john',
  companyId: 'some-company-id', // DEPRECATED!
};
```

### 2. Checking Permissions
```typescript
// ✅ CORRECT - Use hook
const { hasPermission } = usePermissions();
if (hasPermission('vehicles', 'write').hasAccess) {
  // Show edit button
}

// ❌ WRONG - Direct check
if (user.role === 'admin') { // Príliš broad
  // Show edit button
}
```

### 3. Filtering Data
```typescript
// ✅ CORRECT - Backend filtering
const vehicles = await getVehicles(); // Already filtered by backend

// ❌ WRONG - Client-side filtering
const allVehicles = await getAllVehicles();
const filtered = allVehicles.filter(...); // Performance issue
```

### 4. Platform-Specific Features
```typescript
// ✅ CORRECT - Check platformId
if (user.platformId === BLACKRENT_PLATFORM_ID) {
  return <EmailMonitoring />;
}

// ❌ WRONG - Check role only
if (user.role === 'admin') { // Príliš broad
  return <EmailMonitoring />;
}
```

---

## 🐛 Troubleshooting

### Problem: User nevidí žiadne dáta
```typescript
// Check 1: Má user platformId?
console.log('User platformId:', user.platformId);

// Check 2: Majú dáta platformId?
console.log('Vehicle platformId:', vehicle.platformId);

// Check 3: Zhoda?
console.log('Match:', user.platformId === vehicle.platformId);

// Fix: Update user platformId
UPDATE users SET platform_id = 'correct-platform-id' WHERE id = 'user-id';
```

### Problem: User vidí dáta inej platformy
```typescript
// Check: Backend filtering
// Backend route (vehicles.ts, leasings.ts, atď.)
if (req.user?.role === 'company_admin' && req.user.platformId) {
  data = data.filter(item => item.platformId === req.user.platformId);
}
```

### Problem: Investor nevidí firmy
```typescript
// Check 1: Má linkedInvestorId?
console.log('linkedInvestorId:', user.linkedInvestorId);

// Check 2: Má CompanyInvestor shares?
SELECT * FROM company_investor_shares 
WHERE company_investor_id = 'linkedInvestorId';

// Fix: Create share
INSERT INTO company_investor_shares (
  company_investor_id, company_id, ownership_percentage
) VALUES ('investor-id', 'company-id', 30.00);
```

---

## 📚 Related Documentation

- `PLATFORM_MULTI_TENANCY_IMPLEMENTATION_COMPLETE.md` - Implementation details
- `backend/migrations/001_add_platform_multi_tenancy.sql` - Database migration
- `backend/migrations/002_add_linked_investor_id.sql` - Investor linking
- `backend/migrations/003_add_platform_to_leasings.sql` - Leasings platform
- `src/hooks/usePermissions.ts` - Permission logic
- `src/context/PermissionsContext.tsx` - Permission context

---

**Vytvorené:** 10. októbra 2025  
**Posledná aktualizácia:** 10. októbra 2025  
**Autor:** BlackRent Development Team  
**Verzia:** 2.0 (Multi-Tenancy Implementation)

