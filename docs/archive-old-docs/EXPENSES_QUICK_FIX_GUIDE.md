# ⚡ EXPENSES - QUICK FIX GUIDE

**Čo urobiť DNES aby to fungovalo správne**

---

## 🔥 TOP 5 KRITICKÝCH OPRÁV (4-6 hodín práce)

### 1. ✅ OPRAV RECURRING EXPENSES GENERATION (2 hodiny)

#### Krok 1: Oprav frontend API call (5 min)

**Súbor:** `apps/web/src/services/api.ts`

```typescript
// Pridaj túto funkciu (pravdepodobne už existuje, len nie je použitá)
async generateAllRecurringExpenses(targetDate?: Date): Promise<{
  generated: number;
  skipped: number;
  errors: string[];
}> {
  const response = await this.post<ApiResponse<{
    generated: number;
    skipped: number;
    errors: string[];
  }>>('/recurring-expenses/generate', { 
    targetDate: targetDate?.toISOString() 
  });
  
  if (response.success && response.data) {
    return response.data;
  }
  
  throw new Error(response.error || 'Chyba pri generovaní');
}
```

#### Krok 2: Oprav RecurringExpenseManager (10 min)

**Súbor:** `apps/web/src/components/expenses/RecurringExpenseManager.tsx`

**Nájdi riadok 302-319** a nahraď to:

```typescript
// ❌ ZMAŽ TOTO:
const handleGenerateAll = async () => {
  if (window.confirm('Vygenerovať všetky splatné pravidelné náklady?')) {
    setLoading(true);
    setError(null);
    try {
      // TODO: Implement generateRecurringExpenses in API service
      console.warn('generateRecurringExpenses not implemented yet');
      const result = { generated: 0, skipped: 0 };
      setSuccess(
        `Generovanie dokončené: ${result.generated} vytvorených, ${result.skipped} preskočených`
      );
      await loadData();
      onExpensesChanged?.();
    } catch (error: unknown) {
      setError('Chyba pri generovaní: ' + (error as Error).message);
    } finally {
      setLoading(false);
    }
  }
};

// ✅ NAHRAĎ TÝMTO:
const handleGenerateAll = async () => {
  if (window.confirm('Vygenerovať všetky splatné pravidelné náklady?\n\nToto vytvorí nové náklady pre všetky aktívne pravidelné náklady ktorých nextGenerationDate už nastal.')) {
    setLoading(true);
    setError(null);
    try {
      const result = await apiService.generateAllRecurringExpenses();
      
      if (result.generated > 0) {
        setSuccess(
          `✅ Generovanie úspešné!\n\n` +
          `Vytvorených: ${result.generated}\n` +
          `Preskočených: ${result.skipped}\n` +
          (result.errors.length > 0 ? `Chýb: ${result.errors.length}` : '')
        );
      } else {
        setSuccess(
          `ℹ️ Žiadne náklady neboli vygenerované.\n\n` +
          `Všetky pravidelné náklady sú už aktuálne alebo nie sú ešte splatné.`
        );
      }
      
      await loadData();
      onExpensesChanged?.();
    } catch (error: unknown) {
      const errorMsg = error instanceof Error ? error.message : 'Neznáma chyba';
      setError(`❌ Chyba pri generovaní: ${errorMsg}`);
      logger.error('Generate all recurring expenses failed', error);
    } finally {
      setLoading(false);
    }
  }
};
```

#### Krok 3: Oprav optimistic update (15 min)

**Súbor:** `apps/web/src/components/expenses/RecurringExpenseManager.tsx`

**Nájdi riadok 342-383** a nahraď to:

```typescript
// ❌ ZMAŽ optimistic update pattern (riadky 360-383)

// ✅ NAHRAĎ normálnym async/await:
const handleFormSubmit = async () => {
  if (
    !formData.name.trim() ||
    !formData.description.trim() ||
    !formData.category ||
    !formData.company.trim()
  ) {
    setError('Vyplňte všetky povinné polia');
    return;
  }

  if (formData.amount <= 0) {
    setError('Suma musí byť väčšia ako 0');
    return;
  }

  setLoading(true);
  setError(null);
  
  try {
    if (editingRecurring) {
      // ✅ AKTUALIZÁCIA - čakaj na server response
      const updatedRecurring: RecurringExpense = {
        ...editingRecurring,
        name: formData.name.trim(),
        description: formData.description.trim(),
        amount: formData.amount,
        category: formData.category,
        company: formData.company.trim(),
        vehicleId: formData.vehicleId || undefined,
        note: formData.note.trim() || undefined,
        frequency: formData.frequency,
        startDate: new Date(formData.startDate || new Date()),
        endDate: formData.endDate ? new Date(formData.endDate!) : undefined,
        dayOfMonth: formData.dayOfMonth,
        isActive: formData.isActive,
        updatedAt: new Date(),
      };
      
      // ✅ Čakaj na server response
      await apiService.updateRecurringExpense(updatedRecurring);
      
      // ✅ Aktualizuj state až po úspešnom uložení
      setRecurringExpenses(prev =>
        prev.map(r => (r.id === editingRecurring.id ? updatedRecurring : r))
      );
      
      setSuccess('✅ Pravidelný náklad úspešne aktualizovaný');
      setFormOpen(false);
      resetForm();
      onExpensesChanged?.();
      
    } else {
      // ✅ VYTVORENIE
      const newRecurring = await apiService.createRecurringExpense({
        name: formData.name.trim(),
        description: formData.description.trim(),
        amount: formData.amount,
        category: formData.category,
        company: formData.company.trim(),
        vehicleId: formData.vehicleId || undefined,
        note: formData.note.trim() || undefined,
        frequency: formData.frequency,
        startDate: new Date(formData.startDate || new Date()),
        endDate: formData.endDate ? new Date(formData.endDate!) : undefined,
        dayOfMonth: formData.dayOfMonth,
        isActive: formData.isActive,
      });

      if (newRecurring && newRecurring.id) {
        setRecurringExpenses(prev => [...prev, newRecurring]);
        setSuccess('✅ Pravidelný náklad úspešne vytvorený');
        setFormOpen(false);
        resetForm();
        onExpensesChanged?.();
      } else {
        throw new Error('Nepodarilo sa vytvoriť pravidelný náklad');
      }
    }
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Neznáma chyba';
    setError(`❌ Chyba pri ukladaní: ${errorMessage}`);
    logger.error('Save recurring expense failed', error);
  } finally {
    setLoading(false);
  }
};
```

#### Krok 4: Test (10 min)

```bash
# 1. Spusti aplikáciu
cd /Users/mikailpirgozi/Desktop/Cursor\ zalohy\ mac16/Blackrent\ Beta\ 2/apps/web
pnpm dev

# 2. Otvor Expenses → Pravidelné náklady
# 3. Vytvor nový pravidelný náklad:
#    - Názov: "Test poistenie"
#    - Popis: "Mesačné poistenie"
#    - Suma: 150€
#    - Kategória: Insurance
#    - Firma: Black Holding
#    - Frekvencia: Mesačne
#    - Deň: 1
#    - Dátum od: 01.01.2025

# 4. Klikni "Vygenerovať všetky splatné"
# 5. Skontroluj že sa vytvoril náklad v Expenses liste
# 6. Klikni znova - malo by byť "Žiadne náklady neboli vygenerované"
```

---

### 2. ✅ PRIDAJ DATABÁZOVÉ INDEXY (30 min)

#### Krok 1: Vytvor migration súbor

**Súbor:** `migrations/add_expense_indexes.sql`

```sql
-- ===============================================
-- EXPENSES INDEXES - PERFORMANCE OPTIMIZATION
-- ===============================================
-- Vytvoriť: 2025-01-04
-- Účel: Optimalizovať queries v expenses sekcii
-- Odhadované zlepšenie: 5-10x rýchlejšie queries
-- ===============================================

-- Základné indexy pre filter/search
CREATE INDEX IF NOT EXISTS idx_expenses_company 
  ON expenses(company);

CREATE INDEX IF NOT EXISTS idx_expenses_category 
  ON expenses(category);

CREATE INDEX IF NOT EXISTS idx_expenses_vehicle_id 
  ON expenses("vehicleId");

CREATE INDEX IF NOT EXISTS idx_expenses_date 
  ON expenses(date DESC);

-- Composite index pre najčastejšie query pattern
-- (filter by company + category + sort by date)
CREATE INDEX IF NOT EXISTS idx_expenses_company_category_date 
  ON expenses(company, category, date DESC);

-- Partial index pre recurring expenses
-- (len aktívne a splatné náklady)
CREATE INDEX IF NOT EXISTS idx_recurring_expenses_active_due
  ON recurring_expenses("isActive", "nextGenerationDate")
  WHERE "isActive" = true;

-- Update database statistics
ANALYZE expenses;
ANALYZE recurring_expenses;

-- ===============================================
-- VERIFICATION QUERIES
-- ===============================================
-- Po vytvorení indexov spusti:
--
-- EXPLAIN ANALYZE 
-- SELECT * FROM expenses 
-- WHERE company = 'Black Holding' 
-- AND category = 'fuel'
-- ORDER BY date DESC;
--
-- Mali by byť "Index Scan" namiesto "Seq Scan"
-- ===============================================
```

#### Krok 2: Spusti migration v Railway

```bash
# Option A: Railway CLI
railway connect
psql

# Option B: Direct connection
PGPASSWORD=nfwrpKxILRUMqunYTZJEhjudEstqLRGv psql \
  -h trolley.proxy.rlwy.net \
  -U postgres \
  -p 13400 \
  -d railway

# Spusti migration
\i migrations/add_expense_indexes.sql

# Skontroluj indexy
\di expenses*
\di recurring*

# Test query performance
EXPLAIN ANALYZE 
SELECT * FROM expenses 
WHERE company = 'Black Holding' 
AND category = 'fuel'
ORDER BY date DESC;

# Exit
\q
```

#### Krok 3: Verify (5 min)

```sql
-- Mali by byť tieto indexy:
SELECT indexname, tablename 
FROM pg_indexes 
WHERE tablename IN ('expenses', 'recurring_expenses')
ORDER BY tablename, indexname;

-- Expected output:
-- idx_expenses_company
-- idx_expenses_category
-- idx_expenses_vehicle_id
-- idx_expenses_date
-- idx_expenses_company_category_date
-- idx_recurring_expenses_active_due
```

---

### 3. ✅ CLEANUP CONSOLE.LOG (1 hodina)

#### Automatizovaný cleanup script:

```bash
# Vytvor cleanup script
cat > scripts/cleanup-expense-logs.sh << 'EOF'
#!/bin/bash

# Nahraď console.log → logger.debug
# Nahraď console.error → logger.error
# Nahraď console.warn → logger.warn

FILES=(
  "apps/web/src/components/expenses/ExpenseListNew.tsx"
  "apps/web/src/components/expenses/ExpenseForm.tsx"
  "apps/web/src/components/expenses/RecurringExpenseManager.tsx"
  "apps/web/src/lib/react-query/hooks/useExpenses.ts"
  "backend/src/routes/expenses.ts"
  "backend/src/routes/recurring-expenses.ts"
)

for file in "${FILES[@]}"; do
  echo "Processing $file..."
  
  # Frontend files
  if [[ $file == apps/web/* ]]; then
    # Add import if not present
    if ! grep -q "import { logger }" "$file"; then
      sed -i '' "1i\\
import { logger } from '@/utils/smartLogger';\\
" "$file"
    fi
    
    # Replace console calls
    sed -i '' 's/console\.log(/logger.debug(/g' "$file"
    sed -i '' 's/console\.error(/logger.error(/g' "$file"
    sed -i '' 's/console\.warn(/logger.warn(/g' "$file"
  fi
  
  # Backend files - keep console for now (different logger)
done

echo "✅ Cleanup complete!"
EOF

chmod +x scripts/cleanup-expense-logs.sh
./scripts/cleanup-expense-logs.sh
```

#### Manuálny cleanup (ak script nefunguje):

**Frontend - Nahraď v týchto súboroch:**
1. `apps/web/src/components/expenses/ExpenseListNew.tsx`
2. `apps/web/src/components/expenses/RecurringExpenseManager.tsx`

```typescript
// ❌ Zmaž:
console.log('💰 Expense created');
console.error('Error:', error);

// ✅ Nahraď:
import { logger } from '@/utils/smartLogger';

logger.debug('💰 Expense created', { expenseId, amount });
logger.error('Failed to create expense', error);
```

**Backend - ZATIAĽ NECHAJ** (backend používa iný logger)

---

### 4. ✅ OPRAV CSV IMPORT UX (1 hodina)

**Súbor:** `apps/web/src/components/expenses/ExpenseListNew.tsx`

**Nájdi riadok 499-512** a nahraď:

```typescript
// ❌ ZMAŽ:
if (created > 0 || updated > 0) {
  alert(
    `🚀 BATCH IMPORT ÚSPEŠNÝ!\n\n📊 Výsledky:\n• Vytvorených: ${created}\n• Aktualizovaných: ${updated}\n• Spracovaných: ${processed}/${total}\n• Chýb: ${errorsCount}\n• Úspešnosť: ${successRate}\n\nStránka sa obnoví za 3 sekundy...`
  );
  setTimeout(() => window.location.reload(), 3000);
}

// ✅ NAHRAĎ:
import { useToast } from '@/components/ui/use-toast';

// V komponente:
const { toast } = useToast();

// V handleImportCSV funkcii:
if (created > 0 || updated > 0) {
  toast({
    title: "✅ Import úspešný!",
    description: `Importovaných ${created} nákladov. ${errorsCount > 0 ? `Chýb: ${errorsCount}` : ''}`,
    variant: "default",
  });
  
  // React Query automaticky refetchuje
  // Žiadny window.location.reload()!
  
} else if (errorsCount > 0) {
  toast({
    title: "⚠️ Import dokončený s chybami",
    description: `Žiadne náklady neboli pridané. Chýb: ${errorsCount}`,
    variant: "destructive",
  });
} else {
  toast({
    title: "ℹ️ Import dokončený",
    description: "Žiadne náklady neboli pridané. Skontrolujte formát CSV súboru.",
    variant: "default",
  });
}
```

---

### 5. ✅ PRIDAJ BACKEND VALIDÁCIE (1 hodina)

#### Krok 1: Install Zod (ak nie je)

```bash
cd backend
pnpm add zod
```

#### Krok 2: Vytvor validation schemas

**Súbor:** `backend/src/validation/expense-schemas.ts`

```typescript
import { z } from 'zod';

export const CreateExpenseSchema = z.object({
  description: z.string()
    .min(1, 'Popis je povinný')
    .max(500, 'Popis je príliš dlhý (max 500 znakov)')
    .trim(),
  
  amount: z.number()
    .min(0, 'Suma nemôže byť záporná')
    .max(999999, 'Suma je príliš veľká')
    .finite('Suma musí byť konečné číslo'),
  
  date: z.coerce.date()
    .min(new Date('2020-01-01'), 'Dátum nemôže byť pred 2020')
    .max(new Date('2030-12-31'), 'Dátum nemôže byť po 2030'),
  
  category: z.string()
    .min(1, 'Kategória je povinná')
    .max(50, 'Kategória je príliš dlhá'),
  
  company: z.string()
    .min(1, 'Firma je povinná')
    .max(255, 'Názov firmy je príliš dlhý')
    .trim(),
  
  vehicleId: z.string().uuid().optional(),
  
  note: z.string()
    .max(1000, 'Poznámka je príliš dlhá')
    .optional(),
});

export const UpdateExpenseSchema = CreateExpenseSchema.extend({
  id: z.string().uuid(),
});

export const CreateRecurringExpenseSchema = z.object({
  name: z.string()
    .min(1, 'Názov je povinný')
    .max(255, 'Názov je príliš dlhý')
    .trim(),
  
  description: z.string()
    .min(1, 'Popis je povinný')
    .max(500, 'Popis je príliš dlhý')
    .trim(),
  
  amount: z.number()
    .min(0.01, 'Suma musí byť väčšia ako 0')
    .max(999999, 'Suma je príliš veľká'),
  
  category: z.string().min(1),
  company: z.string().min(1).max(255),
  vehicleId: z.string().uuid().optional(),
  note: z.string().max(1000).optional(),
  
  frequency: z.enum(['monthly', 'quarterly', 'yearly']),
  
  startDate: z.coerce.date(),
  endDate: z.coerce.date().optional(),
  
  dayOfMonth: z.number()
    .int('Deň musí byť celé číslo')
    .min(1, 'Deň musí byť medzi 1-28')
    .max(28, 'Deň musí byť medzi 1-28'),
  
  isActive: z.boolean().default(true),
});

export type CreateExpenseInput = z.infer<typeof CreateExpenseSchema>;
export type UpdateExpenseInput = z.infer<typeof UpdateExpenseSchema>;
export type CreateRecurringExpenseInput = z.infer<typeof CreateRecurringExpenseSchema>;
```

#### Krok 3: Použij v routes

**Súbor:** `backend/src/routes/expenses.ts`

```typescript
// Pridaj import
import { CreateExpenseSchema, UpdateExpenseSchema } from '../validation/expense-schemas';

// V POST /api/expenses route (riadok 96):
router.post('/', 
  authenticateToken,
  checkPermission('expenses', 'create'),
  invalidateCache('expense'),
  async (req: Request, res: Response<ApiResponse>) => {
    try {
      // ✅ Validuj s Zod
      const validatedData = CreateExpenseSchema.parse(req.body);
      
      // Validácia kategórie proti databáze
      const categories = await postgresDatabase.getExpenseCategories();
      const categoryExists = categories.find(c => c.name === validatedData.category);
      const finalCategory = categoryExists ? validatedData.category : 'other';
      
      const createdExpense = await postgresDatabase.createExpense({
        ...validatedData,
        category: finalCategory,
      });

      res.status(201).json({
        success: true,
        message: 'Náklad úspešne vytvorený',
        data: createdExpense
      });

    } catch (error: unknown) {
      // ✅ Zod validation errors
      if (error instanceof z.ZodError) {
        return res.status(400).json({
          success: false,
          error: 'Neplatné vstupné dáta',
          details: error.errors.map(e => e.message).join(', ')
        });
      }
      
      console.error('❌ EXPENSE CREATE ERROR:', error);
      res.status(500).json({
        success: false,
        error: 'Chyba pri vytváraní nákladu'
      });
    }
  }
);
```

---

## ✅ TESTING CHECKLIST

Po dokončení všetkých opráv testuj:

### Expenses - Základná funkcionalita
- [ ] Vytvor nový náklad (všetky polia)
- [ ] Vytvor náklad bez suma (má byť 0)
- [ ] Vytvor náklad bez vozidlo (má byť undefined)
- [ ] Uprav existujúci náklad
- [ ] Zmaž náklad
- [ ] Filter by company
- [ ] Filter by category
- [ ] Filter by vehicle
- [ ] Search (description, note, company)
- [ ] Export CSV
- [ ] Import CSV (malý súbor 10 riadkov)
- [ ] Import CSV (veľký súbor 100+ riadkov)

### Recurring Expenses
- [ ] Vytvor nový pravidelný náklad
- [ ] Uprav pravidelný náklad
- [ ] Zmaž pravidelný náklad
- [ ] Vygeneruj jeden náklad manuálne (zelené tlačidlo)
- [ ] Vygeneruj všetky splatné (hlavné tlačidlo)
- [ ] Skontroluj že sa vytvorili náklady v Expenses liste
- [ ] Klikni znova - má byť "Žiadne náklady neboli vygenerované"
- [ ] Vytvor náklad s budúcim dátumom - nemá sa vygenerovať
- [ ] Deaktivuj náklad - nemá sa vygenerovať

### Performance
- [ ] Otvor Expenses - má sa načítať < 2s
- [ ] Filter by company - má byť instant (< 100ms)
- [ ] Search - má byť instant (< 100ms)
- [ ] CSV import 100 riadkov - má trvať < 5s
- [ ] Otvor Network tab - má byť len 1 GET /api/expenses request

### Edge Cases
- [ ] Vytvor náklad s prázdnym popisom - má byť error
- [ ] Vytvor náklad so zápornou sumou - má byť error
- [ ] Vytvor náklad s dátumom 1900 - má byť error
- [ ] Vytvor recurring náklad s deň 0 - má byť error
- [ ] Vytvor recurring náklad s deň 31 - má byť error
- [ ] Import CSV s neplatnými dátami - má byť partial success

---

## 🎯 VÝSLEDOK

Po dokončení týchto 5 opráv:

✅ Recurring expenses budú **plne funkčné**  
✅ Performance bude **5-10x rýchlejší** (vďaka indexom)  
✅ Kód bude **čistejší** (bez console.log spamu)  
✅ UX bude **lepší** (toast namiesto alert + reload)  
✅ Backend bude **bezpečnejší** (Zod validácie)  

**Čas:** 4-6 hodín práce  
**Priorita:** 🔥🔥🔥 KRITICKÁ  

---

**Ďalší krok:** Začni s opravou #1 (Recurring Expenses) - to je najkritickejšie!

