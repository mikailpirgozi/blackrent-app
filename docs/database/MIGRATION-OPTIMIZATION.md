# 🔧 Optimalizácia databázových migrácií

## ❗ **Hlavný problém**

Backend spúšťa všetky databázové migrácie pri **každom štarte**, čo spomaľuje spúšťanie o 30-60 sekúnd.

## 🔍 **Aktuálne chovanie**

V súbore `backend/src/models/postgres-database.ts` sa na riadku 44 spúšťa:
```typescript
this.initTables().catch(console.error); // Spustenie pre aktualizáciu schémy
```

Táto metóda vykonáva **14+ databázových migrácií** pri každom štarte servera.

## ✅ **Riešenia**

### 1. **Okamžité riešenie - Podmienkové migrácie**

Pridať kontrolu či migrácie už boli spustené:

```typescript
// Pridať do PostgresDatabase
private migrationTable = 'schema_migrations';

private async checkMigrationStatus(): Promise<boolean> {
  try {
    const result = await this.pool.query(
      `SELECT COUNT(*) FROM information_schema.tables 
       WHERE table_name = $1`, 
      [this.migrationTable]
    );
    return result.rows[0].count > 0;
  } catch {
    return false;
  }
}
```

### 2. **Preferované riešenie - Environment variable**

Pridať do `backend/.env`:
```bash
# Migrácie - nastavte na false po prvom spustení
RUN_MIGRATIONS=true
```

Upraviť `initTables()`:
```typescript
if (process.env.RUN_MIGRATIONS === 'true') {
  await this.runMigrations();
} else {
  console.log('ℹ️ Migrácie preskočené - RUN_MIGRATIONS=false');
}
```

### 3. **Produkčné riešenie - Samostatný migračný skript**

Vytvoriť `backend/migrate.js`:
```javascript
const { PostgresDatabase } = require('./dist/models/postgres-database');

async function runMigrations() {
  console.log('🔄 Spúšťam databázové migrácie...');
  const db = new PostgresDatabase();
  await db.runMigrations();
  console.log('✅ Migrácie dokončené');
  process.exit(0);
}

runMigrations().catch(console.error);
```

## 🚀 **Odporúčané kroky**

1. **Krátkodobé riešenie:**
   ```bash
   # Pridajte do backend/.env
   echo "RUN_MIGRATIONS=false" >> backend/.env
   ```

2. **Ak potrebujete migrácie:**
   ```bash
   # Dočasne povoliť
   RUN_MIGRATIONS=true npm run dev
   
   # Potom vrátiť
   RUN_MIGRATIONS=false
   ```

3. **Dlhodobé riešenie:**
   - Vytvoriť samostatný migračný skript
   - Spúšťať migrácie len pri nasadzovaní nových verzií
   - Použiť migračné nástroje ako Prisma/TypeORM

## ⏱️ **Očakávané zlepšenie**

- **Pred optimalizáciou:** 30-60 sekúnd štart
- **Po optimalizácii:** 3-5 sekúnd štart

## 🔄 **Implementácia**

Chcete implementovať optimalizáciu? Použite príkaz:
```bash
npm run optimize:migrations
``` 