# ⚠️ NEBEZPEČNÉ SKRIPTY - ARCHÍV

## 🚨 POZOR!

Tieto skripty sú **EXTRÉMNE NEBEZPEČNÉ** a môžu **VYMAZAŤ CELÚ DATABÁZU**!

### 📋 Archivované súbory:

- `easy-reset.js` - **VYMAŽE všetky tabuľky** + má hardcoded admin credentials
- `reset-database.js` - **VYMAŽE všetky tabuľky** cez API endpoint  
- `reset-database.sql` - **DROP TABLE príkazy** pre všetky tabuľky

### 🎯 Prečo boli odstránené?

**5. august 2025** - Tieto skripty spôsobili **ÚPLNÉ VYMAZANIE** produkčnej databázy!
- Všetky vozidlá: **VYMAZANÉ** ❌
- Všetky prenájmy: **VYMAZANÉ** ❌  
- Všetky firmy: **VYMAZANÉ** ❌
- Všetci zákazníci: **VYMAZANÉ** ❌

### 🛡️ Bezpečnostné opatrenia:

1. **API Endpoint `/api/admin/reset-database`** - **ODSTRÁNENÝ**
2. **Reset skripty** - **ARCHIVOVANÉ** (tu)
3. **Cleanup skripty** - **ZABEZPEČENÉ** dodatočnými kontrolami

### 🔥 Ak NAOZAJ potrebujete reset databázy:

1. **VYTVORTE ÚPLNÝ BACKUP** najprv!
2. **ZASTAVTE aplikáciu** 
3. **Použite psql priamo** na databáze
4. **NIKDY nerobte reset cez API** v produkcii!

```bash
# SPRÁVNY spôsob (ak naozaj potrebný):
PGPASSWORD=xxx pg_dump -h host -U user -d db > backup-$(date +%Y%m%d).sql
psql -h host -U user -d db -c "DROP SCHEMA public CASCADE; CREATE SCHEMA public;"
```

---
**💡 Tieto súbory zostávajú tu len ako reminder čo sa nesmie opakovať!**