# 🕐 TIMEZONE PROBLÉM - Dátumy sa posúvajú

## 🔍 PROBLÉM:

Zadáš: **1.9.2025**  
Uloží sa: **31.8.2025** ❌

## ⚙️ PRÍČINA:

1. Frontend posiela: `"2025-09-01T22:00:00.000Z"` (10pm UTC = midnight Bratislava)
2. Backend volá: `new Date("2025-09-01T22:00:00.000Z")`
3. PostgreSQL ukladá do DATE stĺpca: `2025-09-01` ✅
4. **ALE** pri čítaní PostgreSQL vracia: `2025-09-01T00:00:00.000Z` (UTC midnight)
5. Frontend konvertuje na Bratislava timezone: `2025-08-31T22:00:00.000Z` ❌

## ✅ RIEŠENIE:

### **Option A: PostgreSQL Timezone Awareness** (ODPORÚČAM)
Zmeniť DATE na TIMESTAMP WITH TIMEZONE alebo používať UTC midnight.

### **Option B: Frontend Date Normalization**
Namiesto `new Date()` použiť `new Date(year, month, day)` (local midnight).

### **Option C: Backend Date Parsing**
Extrahovať len YYYY-MM-DD časť z ISO stringu.

## 📝 IMPLEMENTÁCIA:

Použijem **Option C** - backend extrahuje len dátum bez času.

```typescript
// PRED:
validFrom: new Date(validFrom), // "2025-09-01T22:00:00.000Z" → posunie sa

// PO:
validFrom: new Date(validFrom.split('T')[0]), // "2025-09-01" → správne
```

