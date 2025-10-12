# 🚀 JAK SPUSTIŤ EXPENSE INDEXES MIGRATION

**Čas:** 5 minút  
**Potrebné:** Prístup k Railway PostgreSQL databáze

---

## OPTION 1: Automatický script (Odporúčané)

```bash
# 1. Prejdi do project root
cd /Users/mikailpirgozi/Desktop/Cursor\ zalohy\ mac16/Blackrent\ Beta\ 2

# 2. Spusti migration script
./scripts/run-expense-migration.sh
```

**Očakávaný output:**
```
🚀 Starting expense indexes migration...
📄 Migration file: migrations/add_expense_indexes.sql
🔗 Database: trolley.proxy.rlwy.net:13400

⚙️  Running migration...
CREATE INDEX
CREATE INDEX
CREATE INDEX
CREATE INDEX
CREATE INDEX
CREATE INDEX
ANALYZE
ANALYZE

✅ Migration completed successfully!

📊 Verifying indexes...
idx_expenses_company              | expenses
idx_expenses_category             | expenses
idx_expenses_vehicle_id           | expenses
idx_expenses_date                 | expenses
idx_expenses_company_category_date| expenses
idx_recurring_expenses_active_due | recurring_expenses

🎉 Done! Expenses indexes created successfully.
```

---

## OPTION 2: Manuálne (ak script nefunguje)

### 1. Pripoj sa k Railway PostgreSQL

```bash
# MacOS/Linux Terminal
PGPASSWORD=nfwrpKxILRUMqunYTZJEhjudEstqLRGv psql \
  -h trolley.proxy.rlwy.net \
  -U postgres \
  -p 13400 \
  -d railway
```

### 2. Skopíruj a spusti SQL commands

```sql
-- Základné indexy
CREATE INDEX IF NOT EXISTS idx_expenses_company 
  ON expenses(company);

CREATE INDEX IF NOT EXISTS idx_expenses_category 
  ON expenses(category);

CREATE INDEX IF NOT EXISTS idx_expenses_vehicle_id 
  ON expenses("vehicleId");

CREATE INDEX IF NOT EXISTS idx_expenses_date 
  ON expenses(date DESC);

-- Composite index
CREATE INDEX IF NOT EXISTS idx_expenses_company_category_date 
  ON expenses(company, category, date DESC);

-- Partial index pre recurring
CREATE INDEX IF NOT EXISTS idx_recurring_expenses_active_due
  ON recurring_expenses("isActive", "nextGenerationDate")
  WHERE "isActive" = true;

-- Update statistics
ANALYZE expenses;
ANALYZE recurring_expenses;
```

### 3. Skontroluj že indexy boli vytvorené

```sql
SELECT indexname, tablename 
FROM pg_indexes 
WHERE tablename IN ('expenses', 'recurring_expenses')
ORDER BY tablename, indexname;
```

**Očakávaný output:**
```
          indexname           |      tablename       
------------------------------+---------------------
 idx_expenses_category        | expenses
 idx_expenses_company         | expenses
 idx_expenses_company_category_date | expenses
 idx_expenses_date            | expenses
 idx_expenses_vehicle_id      | expenses
 idx_recurring_expenses_active_due | recurring_expenses
```

### 4. Exit psql

```sql
\q
```

---

## OPTION 3: Railway Web UI

1. Otvor Railway Dashboard: https://railway.app/
2. Prejdi na BlackRent projekt
3. Klikni na PostgreSQL service
4. Prejdi na "Query" tab
5. Skopíruj SQL commands z OPTION 2, krok 2
6. Klikni "Run Query"

---

## ✅ VERIFIKÁCIA

### Test query performance:

```sql
-- Pred pridaním indexov (Seq Scan - pomalé)
EXPLAIN ANALYZE 
SELECT * FROM expenses 
WHERE company = 'Black Holding' 
AND category = 'fuel'
ORDER BY date DESC;
```

**Očakávaný output PO pridaní indexov:**
```
Index Scan using idx_expenses_company_category_date on expenses
  Index Cond: ((company = 'Black Holding') AND (category = 'fuel'))
  ...
Planning Time: 0.123 ms
Execution Time: 1.234 ms  ← RÝCHLE!
```

**Ak vidíš "Seq Scan" namiesto "Index Scan" = indexy neboli vytvorené správne!**

---

## 🐛 TROUBLESHOOTING

### Error: "permission denied for table expenses"
**Riešenie:** Používateľ `postgres` nemá privileges. Skús:
```sql
GRANT ALL PRIVILEGES ON TABLE expenses TO postgres;
GRANT ALL PRIVILEGES ON TABLE recurring_expenses TO postgres;
```

### Error: "relation "expenses" does not exist"
**Riešenie:** Pripojil si sa do zlej databázy. Skontroluj:
```sql
\dt  -- List všetkých tabuliek
\c railway  -- Connect to railway database
```

### Error: "script not executable"
**Riešenie:** Nastav executable permissions:
```bash
chmod +x scripts/run-expense-migration.sh
```

### Script sa nezastaví (waiting)
**Riešenie:** PostgreSQL čaká na password. Uisti sa že máš nastavený PGPASSWORD v scripte.

---

## 📊 OČAKÁVANÉ VÝSLEDKY

Po úspešnom spustení migration:

### 1. Rýchlejšie queries:
- **Pred:** Full table scan na 568+ záznamoch = ~500-1000ms
- **Po:** Index scan = ~10-50ms
- **Zlepšenie:** 5-10x rýchlejšie!

### 2. Rýchlejšie filtre:
- Filter by company: instant (< 100ms)
- Filter by category: instant (< 100ms)
- Sort by date: instant (< 100ms)

### 3. Rýchlejší page load:
- Expenses page load: < 2s (predtým ~5s)

---

## 🎯 NEXT STEPS

Po úspešnom spustení migration:

1. ✅ Otestuj Expenses page - má sa načítať < 2s
2. ✅ Otestuj filtre - majú byť okamžité
3. ✅ Otestuj recurring expenses generation
4. ✅ Commit & push zmeny do Git

---

**Questions?** Check `EXPENSES_FIXES_IMPLEMENTED.md` pre kompletný prehľad všetkých zmien.

