# 🏢 Platform Management

Multi-tenancy platform management systém pre BlackRent.

## 📂 Obsah

### Implementation & Deployment
- **[PLATFORM_IMPLEMENTATION_COMPLETE.md](./PLATFORM_IMPLEMENTATION_COMPLETE.md)** - Kompletná implementácia
- **[PLATFORM_IMPLEMENTATION_FINAL_SUMMARY.md](./PLATFORM_IMPLEMENTATION_FINAL_SUMMARY.md)** - Finálne zhrnutie implementácie
- **[PLATFORM_DEPLOYMENT_GUIDE.md](./PLATFORM_DEPLOYMENT_GUIDE.md)** - Deployment guide
- **[PLATFORM_MULTI_TENANCY_IMPLEMENTATION_COMPLETE.md](./PLATFORM_MULTI_TENANCY_IMPLEMENTATION_COMPLETE.md)** - Multi-tenancy implementácia

### Fixes & Updates
- **[PLATFORM_MANAGEMENT_FIX.md](./PLATFORM_MANAGEMENT_FIX.md)** - Platform management opravy
- **[PLATFORM_STATS_FINAL_FIX.md](./PLATFORM_STATS_FINAL_FIX.md)** - Finálny fix štatistík
- **[PLATFORM_STATS_FIX.md](./PLATFORM_STATS_FIX.md)** - Štatistiky fix
- **[PLATFORM_STATS_UUID_FIX.md](./PLATFORM_STATS_UUID_FIX.md)** - UUID fix pre štatistiky

---

## 🎯 Platform System Overview

BlackRent platform systém umožňuje multi-tenancy pre rôzne autopožičovne (companies).

### Kľúčové Features
- **Multi-Company Support** - Podpora viacerých firiem v jednom systéme
- **Company Isolation** - Každá firma vidí len svoje dáta
- **Unified Dashboard** - Centrálny dashboard pre správu všetkých platforiem
- **Platform Statistics** - Detailné štatistiky pre každú platformu
- **User Assignment** - Priradenie používateľov k platformám
- **Permission Management** - Granulárne permissions per platform

---

## 🏗️ Architecture

### Database Schema
```sql
-- Companies (Platforms)
companies
  - id (UUID)
  - name (TEXT)
  - created_at (TIMESTAMP)
  - updated_at (TIMESTAMP)

-- Platform Users
users
  - id (UUID)
  - company_id (UUID) → companies.id
  - email (TEXT)
  - role (TEXT)

-- Platform Vehicles
vehicles
  - id (UUID)
  - company_id (UUID) → companies.id
  - ...

-- Platform Rentals
rentals
  - id (UUID)
  - company_id (UUID) → companies.id
  - ...
```

### Isolation Strategy
- **Row Level Security (RLS)** - Každý query automaticky filtruje podľa `company_id`
- **Context Isolation** - User context obsahuje `company_id`
- **API Guards** - Middleware overuje prístup k company dátam

---

## 🚀 Quick Start

### 1. Vytvorenie Novej Platformy (Company)
```typescript
import { useCreateCompany } from '@/lib/react-query/hooks/useCompanies';

const { mutate: createCompany } = useCreateCompany();

createCompany({
  name: 'Nova Autopozicovna s.r.o.',
  address: 'Bratislava, Slovakia',
  ico: '12345678',
  // ... ďalšie company info
});
```

### 2. Priradenie Používateľa k Platforme
```typescript
import { useAssignUserToCompany } from '@/lib/react-query/hooks/useUsers';

const { mutate: assignUser } = useAssignUserToCompany();

assignUser({
  userId: 'user-uuid',
  companyId: 'company-uuid',
  role: 'manager'
});
```

### 3. Získanie Platform Statistics
```typescript
import { usePlatformStats } from '@/lib/react-query/hooks/usePlatforms';

const { data: stats } = usePlatformStats(companyId);

console.log(stats);
// {
//   totalVehicles: 25,
//   activeRentals: 8,
//   totalRevenue: 125000,
//   ...
// }
```

---

## 📊 Platform Statistics

### Available Metrics
- **Vehicles:**
  - Total vehicles
  - Available vehicles
  - Rented vehicles
  - Vehicles in maintenance

- **Rentals:**
  - Active rentals
  - Completed rentals
  - Upcoming rentals
  - Cancelled rentals

- **Financial:**
  - Total revenue
  - Monthly revenue
  - Average rental price
  - Outstanding payments

- **Customers:**
  - Total customers
  - Active customers
  - Customer retention rate

### API Endpoints
```
GET    /api/platforms/:companyId/stats              # Kompletné štatistiky
GET    /api/platforms/:companyId/stats/vehicles     # Štatistiky vozidiel
GET    /api/platforms/:companyId/stats/rentals      # Štatistiky prenájmov
GET    /api/platforms/:companyId/stats/financial    # Finančné štatistiky
GET    /api/platforms/:companyId/stats/customers    # Štatistiky zákazníkov
```

---

## 🛠️ Platform Management Dashboard

Dashboard je dostupný v:
**Admin Panel → Platform Management**

### Features
1. **Platform List** - Zoznam všetkých platforiem
2. **Platform Detail** - Detailné info o platforme
3. **Statistics Overview** - Prehľad štatistík
4. **User Management** - Správa používateľov platformy
5. **Company Assignment** - Priradenie companies k platformám

### Permissions
- **Super Admin** - Prístup ku všetkým platformám
- **Platform Admin** - Správa vlastnej platformy
- **Manager** - Read-only prístup k platforme
- **Employee** - Obmedzený prístup

---

## 🔐 Security & Permissions

### Company Isolation
```typescript
// Každý query automaticky filtruje podľa company_id
const vehicles = await db.query(`
  SELECT * FROM vehicles 
  WHERE company_id = $1
`, [userCompanyId]);
```

### Permission Checks
```typescript
import { checkPlatformAccess } from '@/utils/permissions';

// Check if user has access to platform
const hasAccess = checkPlatformAccess(
  userId,
  companyId,
  'read'
);

if (!hasAccess) {
  throw new Error('Unauthorized');
}
```

### API Middleware
```typescript
// Platform access middleware
router.use('/api/platforms/:companyId', async (req, res, next) => {
  const { companyId } = req.params;
  const userId = req.user.id;
  
  const hasAccess = await checkPlatformAccess(userId, companyId);
  
  if (!hasAccess) {
    return res.status(403).json({ error: 'Forbidden' });
  }
  
  next();
});
```

---

## ⚙️ Configuration

### Environment Variables
```env
# Platform Configuration
ENABLE_MULTI_TENANCY=true
DEFAULT_COMPANY_ID=your-default-company-uuid

# Platform Stats Cache
PLATFORM_STATS_CACHE_TTL=300  # 5 minutes
```

### Feature Flags
```typescript
// featureFlags.ts
export const FEATURE_FLAGS = {
  multiTenancy: true,
  platformStats: true,
  companyIsolation: true,
  crossPlatformReports: false,  // Future feature
};
```

---

## 🧪 Testing

### Test Platform Creation
```bash
# Create test platform
npm run test:platform:create

# Test platform isolation
npm run test:platform:isolation

# Test platform statistics
npm run test:platform:stats
```

### Manual Testing Checklist
- [ ] Create new platform
- [ ] Assign users to platform
- [ ] Create vehicles for platform
- [ ] Create rentals for platform
- [ ] Verify platform statistics
- [ ] Test company isolation (user A cannot see company B data)
- [ ] Test permission checks
- [ ] Test cross-platform reports (if enabled)

---

## 🐛 Common Issues

### Issue: Platform stats showing wrong data
**Solution:** Check [PLATFORM_STATS_FINAL_FIX.md](./PLATFORM_STATS_FINAL_FIX.md)

### Issue: UUID type mismatch errors
**Solution:** Check [PLATFORM_STATS_UUID_FIX.md](./PLATFORM_STATS_UUID_FIX.md)

### Issue: User can see other company's data
**Solution:**
1. Verify RLS policies in database
2. Check `company_id` in user context
3. Verify API middleware

---

## 📈 Future Enhancements

### Planned Features
- [ ] Cross-platform analytics
- [ ] Platform-to-platform vehicle transfer
- [ ] Centralized booking system
- [ ] Platform marketplace
- [ ] White-label solutions

---

## 🔗 Súvisiace Dokumenty

- [Architecture Overview](../architecture/ARCHITECTURE.md)
- [Permission Management](../01-getting-started/PERMISSION_UI_GUIDE.md)
- [Database Schema](../database/)
- [User Management](../01-getting-started/)

---

**Tip:** Vždy testuj platform isolation na staging prostredí pred production deployment!

