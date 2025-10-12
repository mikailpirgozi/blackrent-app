# Platform Statistics UUID Type Casting Fix

## Problém
```
error: operator does not exist: uuid = integer
```

Backend crashoval pri `getPlatformStats()` kvôli type mismatch pri porovnávaní UUID s integer parametrom.

## Riešenie
Pridané explicitné `::uuid` type castingy do všetkých SQL queries v `getPlatformStats`:

```typescript
async getPlatformStats(platformId: string): Promise<{
  totalCompanies: number;
  totalUsers: number;
  totalVehicles: number;
  totalRentals: number;
}> {
  try {
    // 🏢 Počet firiem na platforme
    const companies = await this.pool.query(
      'SELECT COUNT(*) as count FROM companies WHERE platform_id = $1::uuid',
      [platformId]
    );
    
    // 👥 Počet používateľov - JOINnutých cez company_id
    const users = await this.pool.query(
      `SELECT COUNT(DISTINCT u.id) as count 
       FROM users u 
       INNER JOIN companies c ON u.company_id = c.id 
       WHERE c.platform_id = $1::uuid`,
      [platformId]
    );
    
    // 🚗 Počet vozidiel - JOINnutých cez owner_company_id
    const vehicles = await this.pool.query(
      `SELECT COUNT(DISTINCT v.id) as count 
       FROM vehicles v 
       INNER JOIN companies c ON v.owner_company_id = c.id 
       WHERE c.platform_id = $1::uuid`,
      [platformId]
    );
    
    // 📋 Počet prenájmov - JOINnutých cez vehicle -> company
    const rentals = await this.pool.query(
      `SELECT COUNT(DISTINCT r.id) as count 
       FROM rentals r 
       INNER JOIN vehicles v ON r.vehicle_id = v.id 
       INNER JOIN companies c ON v.owner_company_id = c.id 
       WHERE c.platform_id = $1::uuid`,
      [platformId]
    );
    
    return {
      totalCompanies: parseInt(companies.rows[0]?.count || '0'),
      totalUsers: parseInt(users.rows[0]?.count || '0'),
      totalVehicles: parseInt(vehicles.rows[0]?.count || '0'),
      totalRentals: parseInt(rentals.rows[0]?.count || '0'),
    };
  } catch (error) {
    logger.error('❌ getPlatformStats error:', error);
    throw error;
  }
}
```

## Dôležité kroky
1. ✅ Pridané `::uuid` casting do všetkých 4 queries
2. ✅ Vyčistený TypeScript build cache (`rm -rf dist tsconfig.tsbuildinfo node_modules/.cache`)
3. ✅ Hard restart backendu s vyčisteným cache
4. ⏳ **Frontend hard refresh potrebný** (Cmd+Shift+R) - frontend ešte stále servuje starú JS verziu

## Prečo cache clear?
TypeScript kompilované súbory v `dist/` neobsahovali nové zmeny. Nodemon reštartoval server, ale používal starý kompilovaný kód. Cache clear + restart vyriešil problém.

## Next Step
**Používateľ musí spraviť hard refresh frontendu** (Cmd+Shift+R alebo Ctrl+Shift+R) aby načítal novú verziu JS kódu.

