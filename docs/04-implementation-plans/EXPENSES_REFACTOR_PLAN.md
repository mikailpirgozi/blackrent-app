# 🎯 EXPENSES SEKCIA - KOMPLETNÝ REFACTORING PLÁN

**Dátum:** 2025-01-04  
**Stav:** PLÁNOVANÝ  
**Odhadovaný čas:** 12-16 hodín  

---

## 🐛 KRITICKÝ BUG - ZMENA DÁTUMOV

### **ROOT CAUSE: Timezone Conversion**

```typescript
// ❌ PROBLÉM v ExpenseForm.tsx:142-147
<DatePicker
  value={formData.date ? new Date(formData.date) : null}  // Konverzia!
  onChange={(date) => handleInputChange('date', date || undefined)}
/>
```

**Sekvencia:**
1. Uložíš: `15.01.2025 00:00` → Backend: `2025-01-15T00:00:00.000Z`
2. Otvoríš form → `new Date("2025-01-15T00:00:00.000Z")` v UTC+1
3. Browser konvertuje → `14.01.2025 23:00` 
4. DatePicker zobrazí `14.01.2025` ❌
5. Uložíš → dátum sa zmení!

### **RIEŠENIE:**
```typescript
// ✅ Použiť parseDate z dateUtils.ts
import { parseDate, formatDateToString } from '@/utils/dateUtils';

<DatePicker
  value={parseDate(formData.date)}  // Bez timezone konverzie
  onChange={(date) => handleInputChange('date', date)}
/>
```

---

## 📋 FÁZA 1: KRITICKÉ OPRAVY (4 hodiny)

### ✅ 1.1 Timezone Fix (1h)
**Priorita:** 🔥 URGENTNÉ  
**Súbory:**
- `ExpenseForm.tsx`
- `RecurringExpenseManager.tsx`
- `backend/src/routes/expenses.ts`

**Kroky:**
```bash
# 1. Expense Form
- Import parseDate, formatDateToString z dateUtils.ts
- Nahradiť new Date() pri date parsing
- Testovať: vytvoriť náklad, editovať, kontrola dátumu

# 2. Recurring Expenses
- Opraviť startDate/endDate parsing (riadky 191-216)
- Testovať pravidelné náklady

# 3. Backend
- Zabezpečiť že API vracia dates konzistentne
- Pridať date validation middleware
```

**Test:**
```typescript
// Create expense with date 15.01.2025
// Edit expense
// Verify date is still 15.01.2025 (not 14.01.2025!)
```

---

### ✅ 1.2 Databázové Indexy (30min)
**Priorita:** 🔥 URGENTNÉ  

**Migration Script:**
```sql
-- migrations/add_expense_indexes.sql

-- Základné indexy
CREATE INDEX IF NOT EXISTS idx_expenses_company 
  ON expenses(company);
  
CREATE INDEX IF NOT EXISTS idx_expenses_category 
  ON expenses(category);
  
CREATE INDEX IF NOT EXISTS idx_expenses_vehicle_id 
  ON expenses("vehicleId");
  
CREATE INDEX IF NOT EXISTS idx_expenses_date 
  ON expenses(date DESC);

-- Composite index pre najčastejšie dotazy
CREATE INDEX IF NOT EXISTS idx_expenses_company_category_date 
  ON expenses(company, category, date DESC);

-- Partial index pre aktívne recurring expenses
CREATE INDEX IF NOT EXISTS idx_recurring_expenses_active 
  ON recurring_expenses("isActive", "nextGenerationDate")
  WHERE "isActive" = true;

-- Analyze pre query optimizer
ANALYZE expenses;
ANALYZE recurring_expenses;
```

**Spustenie:**
```bash
cd backend
node -e "
const { pool } = require('./src/models/postgres-database');
const fs = require('fs');
const sql = fs.readFileSync('./migrations/add_expense_indexes.sql', 'utf8');
pool.query(sql).then(() => console.log('✅ Indexy vytvorené'));
"
```

---

### ✅ 1.3 N+1 Query Fix (1h)
**Priorita:** 🔥 URGENTNÉ  

**Backend - postgres-database.ts:**
```typescript
// ✅ Pridať novú metódu
async getExpenseById(id: string): Promise<Expense | null> {
  const query = `
    SELECT * FROM expenses 
    WHERE id = $1
    LIMIT 1
  `;
  const result = await this.pool.query(query, [id]);
  return result.rows[0] || null;
}
```

**Backend - expenses.ts:**
```typescript
// ❌ PRED:
const getExpenseContext = async (req: Request) => {
  const expenses = await postgresDatabase.getExpenses(); // N+1!
  const expense = expenses.find(e => e.id === expenseId);
  // ...
};

// ✅ PO:
const getExpenseContext = async (req: Request) => {
  const expenseId = req.params.id;
  if (!expenseId) return {};
  
  const expense = await postgresDatabase.getExpenseById(expenseId); // ✅
  if (!expense || !expense.vehicleId) return {};
  
  const vehicle = await postgresDatabase.getVehicle(expense.vehicleId);
  return {
    resourceCompanyId: vehicle?.ownerCompanyId,
    amount: expense.amount
  };
};
```

---

### ✅ 1.4 Toast Notifications (1h)
**Priorita:** 🔥 URGENTNÉ  

**Vytvoriť hook:**
```typescript
// hooks/useExpenseToast.ts
import { useToast } from '@/components/ui/use-toast';

export function useExpenseToast() {
  const { toast } = useToast();

  return {
    success: (message: string) => {
      toast({
        title: "Úspech",
        description: message,
        variant: "default",
      });
    },
    error: (message: string) => {
      toast({
        title: "Chyba",
        description: message,
        variant: "destructive",
      });
    },
    info: (message: string) => {
      toast({
        title: "Informácia",
        description: message,
      });
    },
  };
}
```

**Nahradiť všade:**
```typescript
// ❌ PRED:
window.alert('Chyba pri vytváraní firmy');
window.confirm('Naozaj chcete zmazať?');

// ✅ PO:
const toast = useExpenseToast();
toast.error('Chyba pri vytváraní firmy');

// Pre confirm použiť AlertDialog
<AlertDialog>
  <AlertDialogTrigger>Zmazať</AlertDialogTrigger>
  <AlertDialogContent>
    <AlertDialogTitle>Naozaj chcete zmazať?</AlertDialogTitle>
    <AlertDialogAction onClick={handleDelete}>Áno</AlertDialogAction>
  </AlertDialogContent>
</AlertDialog>
```

**Súbory na úpravu:**
- `ExpenseForm.tsx` (3 miesta)
- `ExpenseListNew.tsx` (5 miest)
- `ExpenseCategoryManager.tsx` (4 miesta)
- `RecurringExpenseManager.tsx` (6 miest)

---

### ✅ 1.5 CSV Web Worker (30min)
**Priorita:** 🔥 URGENTNÉ  

**ExpenseListNew.tsx:**
```typescript
// ✅ Jednoduchá zmena
Papa.parse(file, {
  worker: true,  // ✅ Parsuje v Web Worker!
  complete: async (results) => {
    // ... zvyšok logiky
  },
  header: false,
  skipEmptyLines: true,
});
```

---

## 📋 FÁZA 2: OPTIMALIZÁCIE (4 hodiny)

### ✅ 2.1 React Query Cache Fix (30min)

**useExpenses.ts:**
```typescript
// ❌ PRED:
staleTime: 0,
gcTime: 0,
refetchOnMount: 'always'

// ✅ PO:
staleTime: 30000,        // 30s - rozumný balance
gcTime: 300000,          // 5 min
refetchOnMount: true,    // Len ak sú staré
refetchOnWindowFocus: false, // Nerefetchuj pri každom focus
```

---

### ✅ 2.2 Shared Expense Categories Hook (1h)

**Vytvoriť:**
```typescript
// lib/react-query/hooks/useExpenseCategories.ts
export function useExpenseCategories() {
  return useQuery({
    queryKey: queryKeys.expenses.categories,
    queryFn: () => apiService.getExpenseCategories(),
    staleTime: 300000, // 5 min - kategórie sa často nemenia
  });
}
```

**Zmazať duplicity:**
- `ExpenseCategoryManager.tsx` - zmazať loadCategories()
- `ExpenseListNew.tsx` - zmazať loadCategories()
- Použiť `useExpenseCategories()` namiesto toho

---

### ✅ 2.3 Optimalizovať Companies Select (1h)

**ExpenseForm.tsx:**
```typescript
// ❌ PRED:
options={Array.from(
  new Set([
    ...companies.map(c => c.name),
    ...vehicles.map(v => v.company),
    ...expenses.map(e => e.company), // ❌ 5000+ iterácií!
  ])
)}

// ✅ PO:
const uniqueCompanies = useMemo(() => {
  const companySet = new Set<string>();
  
  // Prioritizuj companies (najmenej záznamov)
  companies.forEach(c => companySet.add(c.name));
  
  // Pridaj len unikátne z vehicles (ak treba)
  vehicles.forEach(v => {
    if (v.company && !companySet.has(v.company)) {
      companySet.add(v.company);
    }
  });
  
  return Array.from(companySet).sort();
}, [companies, vehicles]); // ✅ Expenses vôbec nepotrebujeme!
```

---

### ✅ 2.4 Batch Import Progress (1h)

**Backend - expenses.ts:**
```typescript
// ✅ Streamovať progress cez Server-Sent Events
router.post('/batch-import-stream',
  authenticateToken,
  async (req: Request, res: Response) => {
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');

    const { expenses } = req.body;
    let processed = 0;

    for (const expenseData of expenses) {
      try {
        await postgresDatabase.createExpense(expenseData);
        processed++;
        
        // Stream progress
        res.write(`data: ${JSON.stringify({ 
          processed, 
          total: expenses.length,
          percent: Math.round((processed / expenses.length) * 100)
        })}\n\n`);
      } catch (error) {
        // Stream error
      }
    }

    res.write('data: [DONE]\n\n');
    res.end();
  }
);
```

**Frontend:**
```typescript
// ExpenseListNew.tsx
const handleBatchImport = async (expenses: Expense[]) => {
  const eventSource = new EventSource('/api/expenses/batch-import-stream');
  
  eventSource.onmessage = (e) => {
    const data = JSON.parse(e.data);
    setProgress(data.percent); // ✅ Real-time progress!
  };
};
```

---

### ✅ 2.5 Decimal.js Pre Amounts (30min)

**Install:**
```bash
pnpm add decimal.js
pnpm add -D @types/decimal.js
```

**Vytvoriť utility:**
```typescript
// utils/money.ts
import Decimal from 'decimal.js';

export function parseAmount(value: string | number): Decimal {
  return new Decimal(value || 0);
}

export function formatAmount(value: Decimal | number): string {
  return new Decimal(value).toFixed(2);
}

export function addAmounts(...amounts: (Decimal | number)[]): Decimal {
  return amounts.reduce(
    (sum, amount) => sum.plus(amount),
    new Decimal(0)
  );
}
```

**Použitie:**
```typescript
// ExpenseListNew.tsx
const totalAmount = useMemo(() => {
  return addAmounts(
    ...finalFilteredExpenses.map(e => e.amount)
  );
}, [finalFilteredExpenses]);

// Display
<h4>{formatAmount(totalAmount)}€</h4>
```

---

## 📋 FÁZA 3: REFACTORING (4 hodiny)

### ✅ 3.1 Rozdeliť ExpenseListNew (2h)

**Nová štruktúra:**
```
expenses/
  ├── components/
  │   ├── ExpenseList.tsx          (hlavný kontajner - 200 LOC)
  │   ├── ExpenseFilters.tsx       (search + filtre - 150 LOC)
  │   ├── ExpenseStats.tsx         (štatistiky - 100 LOC)
  │   ├── ExpenseTable.tsx         (tabuľka - 200 LOC)
  │   ├── ExpenseGrid.tsx          (grid view - 100 LOC)
  │   └── ExpenseImport.tsx        (CSV import - 300 LOC)
  ├── hooks/
  │   ├── useExpenseFilters.ts
  │   ├── useExpenseStats.ts
  │   └── useExpenseImport.ts
  └── utils/
      ├── csvParser.ts
      ├── expenseValidation.ts
      └── categoryMapping.ts
```

**Príklad - ExpenseFilters.tsx:**
```typescript
interface ExpenseFiltersProps {
  onFilterChange: (filters: ExpenseFilters) => void;
}

export function ExpenseFilters({ onFilterChange }: ExpenseFiltersProps) {
  // Len filter UI logika
  return (
    <Card>
      <SearchInput />
      <CategorySelect />
      <CompanySelect />
      <VehicleSelect />
    </Card>
  );
}
```

---

### ✅ 3.2 Utility Funkcie (1h)

**expenses/utils/categoryMapping.ts:**
```typescript
import type { ExpenseCategory } from '@/types';
import { Receipt, Fuel, Wrench, Shield, Tag } from 'lucide-react';

const ICON_MAP = {
  local_gas_station: Fuel,
  build: Wrench,
  security: Shield,
  category: Tag,
  receipt: Receipt,
} as const;

export function getCategoryIcon(
  categoryName: string,
  categories: ExpenseCategory[]
) {
  const category = categories.find(c => c.name === categoryName);
  if (!category) return Receipt;
  
  const IconComponent = ICON_MAP[category.icon as keyof typeof ICON_MAP];
  return IconComponent || Receipt;
}

export function getCategoryText(
  categoryName: string,
  categories: ExpenseCategory[]
) {
  const category = categories.find(c => c.name === categoryName);
  return category?.displayName || categoryName;
}
```

**expenses/utils/csvParser.ts:**
```typescript
export function parseExpenseCSVDate(dateStr: string): Date {
  // MM/YYYY → 01.MM.YYYY
  if (/^\d{1,2}\/\d{4}$/.test(dateStr)) {
    const [month, year] = dateStr.split('/');
    return new Date(parseInt(year!), parseInt(month!) - 1, 1);
  }
  
  // DD.MM.YYYY
  if (/^\d{1,2}\.\d{1,2}\.\d{4}$/.test(dateStr)) {
    const [day, month, year] = dateStr.split('.');
    return new Date(parseInt(year!), parseInt(month!) - 1, parseInt(day!));
  }
  
  // ISO YYYY-MM-DD
  return new Date(dateStr);
}

export function mapExpenseCategory(categoryStr: string): string {
  const map: Record<string, string> = {
    fuel: 'fuel',
    palivo: 'fuel',
    service: 'service',
    servis: 'service',
    insurance: 'insurance',
    poistenie: 'insurance',
  };
  return map[categoryStr.toLowerCase()] || 'other';
}
```

---

### ✅ 3.3 Unified Error Handling (1h)

**Vytvoriť:**
```typescript
// context/ExpenseErrorBoundary.tsx
export class ExpenseErrorBoundary extends Component<Props, State> {
  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Expense Error:', error, errorInfo);
    // Log to Sentry/monitoring service
  }

  render() {
    if (this.state.hasError) {
      return (
        <Card>
          <CardHeader>
            <AlertCircle className="h-8 w-8 text-red-500" />
            <h3>Nastala chyba pri načítaní nákladov</h3>
          </CardHeader>
          <CardContent>
            <Button onClick={() => window.location.reload()}>
              Obnoviť stránku
            </Button>
          </CardContent>
        </Card>
      );
    }

    return this.props.children;
  }
}
```

**Backend - error middleware:**
```typescript
// middleware/error-handler.ts
export function expenseErrorHandler(
  error: Error, 
  req: Request, 
  res: Response, 
  next: NextFunction
) {
  console.error('Expense API Error:', {
    error: error.message,
    stack: error.stack,
    user: req.user?.username,
    endpoint: req.path,
  });

  if (error.name === 'ValidationError') {
    return res.status(400).json({
      success: false,
      error: error.message,
      type: 'validation',
    });
  }

  res.status(500).json({
    success: false,
    error: 'Interná chyba servera',
    type: 'server',
  });
}
```

---

## 📋 FÁZA 4: DATABÁZA (2 hodiny)

### ✅ 4.1 Foreign Keys (30min)

```sql
-- migrations/add_expense_constraints.sql

-- Vehicle FK (SET NULL ak sa vehicle zmaže)
ALTER TABLE expenses 
  ADD CONSTRAINT fk_expenses_vehicle 
  FOREIGN KEY ("vehicleId") 
  REFERENCES vehicles(id) 
  ON DELETE SET NULL;

-- Category FK (RESTRICT - nemožno zmazať použitú kategóriu)
ALTER TABLE expenses
  ADD CONSTRAINT fk_expenses_category
  FOREIGN KEY (category) 
  REFERENCES expense_categories(name) 
  ON DELETE RESTRICT
  ON UPDATE CASCADE;
```

---

### ✅ 4.2 Soft Deletes (1h)

```sql
-- Migration
ALTER TABLE expenses ADD COLUMN deleted_at TIMESTAMP;
CREATE INDEX idx_expenses_deleted_at ON expenses(deleted_at);

ALTER TABLE recurring_expenses ADD COLUMN deleted_at TIMESTAMP;
CREATE INDEX idx_recurring_expenses_deleted_at ON recurring_expenses(deleted_at);
```

**Backend:**
```typescript
// postgres-database.ts
async deleteExpense(id: string): Promise<void> {
  // ✅ Soft delete
  const query = `
    UPDATE expenses 
    SET deleted_at = NOW()
    WHERE id = $1
  `;
  await this.pool.query(query, [id]);
}

async getExpenses(): Promise<Expense[]> {
  const query = `
    SELECT * FROM expenses 
    WHERE deleted_at IS NULL  -- ✅ Filter soft deleted
    ORDER BY date DESC
  `;
  const result = await this.pool.query(query);
  return result.rows;
}
```

---

### ✅ 4.3 Audit Trail (30min)

```sql
-- Audit table
CREATE TABLE expense_audit (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  expense_id UUID NOT NULL,
  action VARCHAR(20) NOT NULL, -- CREATE, UPDATE, DELETE
  user_id UUID,
  changes JSONB, -- Zmeny v JSON formáte
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_expense_audit_expense_id ON expense_audit(expense_id);
CREATE INDEX idx_expense_audit_created_at ON expense_audit(created_at DESC);
```

**Backend trigger:**
```typescript
// Po každom update
async updateExpense(expense: Expense, userId: string) {
  const oldExpense = await this.getExpenseById(expense.id);
  
  // Update expense
  await this.pool.query(updateQuery, [expense]);
  
  // Log audit
  await this.pool.query(`
    INSERT INTO expense_audit (expense_id, action, user_id, changes)
    VALUES ($1, 'UPDATE', $2, $3)
  `, [
    expense.id,
    userId,
    JSON.stringify({
      old: oldExpense,
      new: expense,
    }),
  ]);
}
```

---

## 📋 FÁZA 5: UX VYLEPŠENIA (2 hodiny)

### ✅ 5.1 LocalStorage ViewMode (15min)

```typescript
// ExpenseListNew.tsx
const [viewMode, setViewMode] = useLocalStorage<'grid' | 'list'>(
  'expense-view-mode',
  'grid'
);
```

---

### ✅ 5.2 CSV Template Download (30min)

```typescript
const handleDownloadTemplate = () => {
  const template = [
    ['Popis', 'Suma', 'Dátum', 'Kategória', 'Firma', 'Poznámka'],
    ['Servis BMW', '150.50', '15.01.2025', 'service', 'Black Holding', 'Výmena oleja'],
    ['Tankovanie', '80.00', '16.01.2025', 'fuel', 'Black Holding', ''],
  ];
  
  const csv = template.map(row => row.join(',')).join('\n');
  const blob = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8;' });
  saveAs(blob, 'naklady-vzor.csv');
};
```

---

### ✅ 5.3 Virtualizovaný Grid (45min)

```bash
pnpm add react-window react-window-infinite-loader
```

```typescript
import { FixedSizeGrid } from 'react-window';

<FixedSizeGrid
  columnCount={3}
  columnWidth={400}
  height={800}
  rowCount={Math.ceil(expenses.length / 3)}
  rowHeight={300}
  width={1200}
>
  {({ columnIndex, rowIndex, style }) => {
    const index = rowIndex * 3 + columnIndex;
    const expense = expenses[index];
    if (!expense) return null;
    
    return (
      <div style={style}>
        <PremiumExpenseCard expense={expense} />
      </div>
    );
  }}
</FixedSizeGrid>
```

---

### ✅ 5.4 Enhanced Recurring UI (30min)

**Features:**
- Drag & Drop pre zmenu priority
- Inline edit (double-click)
- Bulk actions (pause multiple)

---

## 🧪 TESTOVANIE

### Test Cases:

```typescript
// expenses.test.ts
describe('Expense Date Handling', () => {
  it('should not change date when editing expense', async () => {
    // 1. Create expense with date 15.01.2025
    const expense = await createExpense({
      description: 'Test',
      amount: 100,
      date: new Date('2025-01-15'),
    });

    // 2. Edit expense
    await updateExpense({
      ...expense,
      amount: 150,
    });

    // 3. Verify date stayed same
    const updated = await getExpense(expense.id);
    expect(updated.date).toBe('2025-01-15');
  });
});
```

---

## 📊 PROGRESS TRACKING

```markdown
### FÁZA 1: KRITICKÉ ✅ (4h)
- [x] 1.1 Timezone Fix
- [x] 1.2 Databázové indexy
- [x] 1.3 N+1 Query fix
- [x] 1.4 Toast notifications
- [x] 1.5 CSV Web Worker

### FÁZA 2: OPTIMALIZÁCIE ⏳ (4h)
- [ ] 2.1 React Query cache
- [ ] 2.2 Shared categories hook
- [ ] 2.3 Companies select optimalizácia
- [ ] 2.4 Batch import progress
- [ ] 2.5 Decimal.js

### FÁZA 3: REFACTORING ⏳ (4h)
- [ ] 3.1 Rozdeliť ExpenseListNew
- [ ] 3.2 Utility funkcie
- [ ] 3.3 Unified error handling

### FÁZA 4: DATABÁZA ⏳ (2h)
- [ ] 4.1 Foreign keys
- [ ] 4.2 Soft deletes
- [ ] 4.3 Audit trail

### FÁZA 5: UX ⏳ (2h)
- [ ] 5.1 LocalStorage viewMode
- [ ] 5.2 CSV template download
- [ ] 5.3 Virtualizácia
- [ ] 5.4 Recurring UI
```

---

## 🚀 SPUSTENIE

```bash
# 1. Backup databázy
pg_dump blackrent > backup_$(date +%Y%m%d).sql

# 2. Začni s FÁZOU 1
git checkout -b feature/expenses-refactor
git push -u origin feature/expenses-refactor

# 3. Po každej fáze
git add .
git commit -m "feat(expenses): FÁZA X dokončená"
git push

# 4. Testovanie
pnpm test
pnpm build  # Frontend
cd backend && pnpm build  # Backend

# 5. Deploy
# NAJPRV staging, potom production!
```

---

## ⚠️ DÔLEŽITÉ POZNÁMKY

1. **NIKDY nespusť všetko naraz!** Postupuj fáza po fáze.
2. **Testuj po každej zmene** - najmä timezone fix!
3. **Backup pred databázovými migráciami**
4. **Komunikuj s tímom** pred breaking changes
5. **Dokumentuj všetky API zmeny**

---

**Autor:** AI Assistant  
**Reviewer:** _Tvoje meno_  
**Schválil:** _Tvoje meno_

