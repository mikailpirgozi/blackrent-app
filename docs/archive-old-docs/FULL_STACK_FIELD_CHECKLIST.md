# ✅ CHECKLIST - Pridanie nového DB poľa (Full-Stack)

**Použiť pri:** Leasingy, Poistky, Vozidlá, Prenájmy, atď.

---

## 📋 KROKY (v tomto poradí!):

### **1️⃣ DATABASE (PRVÉ!)**
```sql
-- Railway PostgreSQL
ALTER TABLE table_name ADD COLUMN field_name TYPE;
CREATE INDEX IF NOT EXISTS idx_table_field ON table_name(field_name);
```
✅ Test: `SELECT field_name FROM table_name LIMIT 1;`

---

### **2️⃣ BACKEND TYPES**
📁 `backend/src/types/index.ts`

```typescript
export interface ModelName {
  // ... existing
  fieldName?: Type; // 🆕 Description
}
```

---

### **3️⃣ BACKEND DATABASE - 3 METÓDY! (KRITICKÉ)**

📁 `backend/src/models/postgres-database.ts`

#### **A) getXs() - SELECT query**
```typescript
async getXs(): Promise<X[]> {
  const result = await client.query(`SELECT * FROM table`);
  return result.rows.map(row => ({
    // ... existing fields
    fieldName: row.field_name || undefined, // 🆕 PRIDAJ!
  }));
}
```

#### **B) createX() - INSERT query**
```typescript
async createX(data: X): Promise<X> {
  const result = await client.query(
    `INSERT INTO table (..., field_name) 
     VALUES (..., $N) 
     RETURNING *, field_name`, // 🆕 PRIDAJ DO RETURNING!
    [..., data.fieldName]
  );
  return {
    // ... existing
    fieldName: row.field_name || undefined, // 🆕 PRIDAJ!
  };
}
```

#### **C) updateX() - UPDATE query**
```typescript
async updateX(id: string, data: X): Promise<X> {
  const result = await client.query(
    `UPDATE table 
     SET ..., field_name = $N 
     WHERE id = $M
     RETURNING *, field_name`, // 🆕 PRIDAJ DO RETURNING!
    [..., data.fieldName, id]
  );
  return {
    // ... existing
    fieldName: row.field_name || undefined, // 🆕 PRIDAJ!
  };
}
```

---

### **4️⃣ BACKEND ROUTES**

📁 `backend/src/routes/model-name.ts`

```typescript
// POST endpoint
router.post('/', async (req, res) => {
  const { ..., fieldName } = req.body; // 🆕 EXTRACT
  await postgresDatabase.createX({
    ...,
    fieldName, // 🆕 PASS
  });
});

// PUT endpoint  
router.put('/:id', async (req, res) => {
  const { ..., fieldName } = req.body; // 🆕 EXTRACT
  await postgresDatabase.updateX(id, {
    ...,
    fieldName, // 🆕 PASS
  });
});
```

---

### **5️⃣ FRONTEND TYPES**

📁 `apps/web/src/types/index.ts`

```typescript
export interface ModelName {
  // ... existing
  fieldName?: Type; // 🆕 Same as backend
}
```

---

### **6️⃣ FRONTEND FORMS - VŠETKY! (KRITICKÉ)**

**Nájdi VŠETKY formuláre:**
```bash
grep -r "ModelNameForm\|BatchModelForm" apps/web/src/components
```

**V KAŽDOM formulári:**

#### **A) FormData interface**
```typescript
interface FormData {
  // ... existing
  fieldName?: Type; // 🆕 PRIDAJ
}
```

#### **B) useState initial state**
```typescript
const [formData, setFormData] = useState({
  // ... existing
  fieldName: document?.fieldName || defaultValue, // 🆕 PRIDAJ
});
```

#### **C) UI Input pole**
```tsx
<Input
  value={formData.fieldName || ''}
  onChange={e => setFormData(prev => ({
    ...prev,
    fieldName: e.target.value
  }))}
/>
```

---

### **7️⃣ FRONTEND DATA MAPPING**

📁 Všetky `handleSave` / `handleCreate` funkcie

```typescript
const handleSave = (data) => {
  const payload = {
    // ... existing
    fieldName: data.fieldName, // 🆕 ENSURE IT'S PASSED!
  };
  await api.updateX(payload);
};
```

---

### **8️⃣ FRONTEND DISPLAY**

📁 Table/List components

```typescript
// V tabuľke / zozname
{item.fieldName && (
  <span>{item.fieldName}</span>
)}
```

---

## 🧪 TESTING CHECKLIST:

```
□ CREATE test
  □ Vyplň formulár s novým polom
  □ Uložiť
  □ Console: over že API request obsahuje fieldName
  □ Console: over že API response obsahuje fieldName
  □ Database: SELECT field_name WHERE id = 'test-id'
  
□ UPDATE test
  □ Uprav existujúci záznam
  □ Zmeň nové pole
  □ Uložiť
  □ Console: over že fieldName sa poslalo
  □ Database: over že sa aktualizovalo

□ DISPLAY test
  □ Refresh stránku
  □ Over že nové pole sa zobrazuje
  □ Console: over že GET API vracia fieldName
```

---

## 🚨 ČASTÝ PROBLÉM:

**Backend UPDATE/CREATE funguje, ale GET NEVRACIA pole!**

**Fix:** Updatuj `getXs()` metódu v `postgres-database.ts`:
```typescript
return result.rows.map(row => ({
  // ... existing
  fieldName: row.field_name || undefined, // ← TOTO ČASTO CHÝBA!
}));
```

---

## 📊 DEBUG WORKFLOW:

```bash
# 1. Over databázu
psql ... -c "SELECT field_name FROM table LIMIT 1;"

# 2. Over backend response
tail -f /tmp/backend.log | grep "fieldName"

# 3. Over frontend request
# Console → Network → Payload

# 4. Over frontend response  
# Console → Network → Response
```

---

**Použi tento checklist pre KAŽDÉ nové pole! Vyhnúť sa problémom.** 🎯

