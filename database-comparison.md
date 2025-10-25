# 🔍 Porovnanie Railway (Produkcia) vs Localhost (Lokálna) Databáza

**Dátum:** 24. október 2025, 23:19

---

## 📊 Štatistiky

| Databáza | Počet tabuliek |
|----------|----------------|
| **Railway (Produkcia)** | 53 tabuliek |
| **Localhost (Lokálna)** | 36 tabuliek |
| **Rozdiel** | ⚠️ **17 tabuliek chýba v lokálnej DB** |

---

## ❌ Tabuľky ktoré CHÝBAJÚ v lokálnej databáze (17)

Tieto tabuľky sú v Railway, ale **NIE SÚ** v localhost:

1. `bank_accounts` ⚠️
2. `blacklist` ⚠️
3. `departments` ⚠️
4. `email_action_logs` ⚠️
5. `email_processing_history` ⚠️
6. `expense_audit` ⚠️
7. `organizations` ⚠️
8. `payment_orders` ⚠️
9. `protocol_photos` ⚠️
10. `protocol_signatures` ⚠️
11. `rental_backups` ⚠️
12. `roles` ⚠️
13. `team_members` ⚠️
14. `teams` ⚠️
15. `user_notification_preferences` ⚠️
16. `user_permissions_cache` ⚠️
17. `user_sessions` ⚠️

---

## ➕ Tabuľky ktoré sú LEN v lokálnej databáze (2)

Tieto tabuľky sú v localhost, ale **NIE SÚ** v Railway:

1. `favorites` 🆕
2. `search_history` 🆕

---

## ✅ Spoločné tabuľky (34)

Tieto tabuľky sú v **OBOCH** databázach:

1. `companies`
2. `company_documents`
3. `company_investor_shares`
4. `company_investors`
5. `customers`
6. `email_blacklist`
7. `expense_categories`
8. `expenses`
9. `feature_flags`
10. `handover_protocols`
11. `insurance_claims`
12. `insurances`
13. `insurers`
14. `leasing_documents`
15. `leasings`
16. `migration_history`
17. `payment_schedule`
18. `pdf_protocols`
19. `photo_derivatives`
20. `photo_metadata_v2`
21. `platforms`
22. `protocol_processing_jobs`
23. `protocol_versions`
24. `protocols`
25. `recurring_expense_generations`
26. `recurring_expenses`
27. `rentals`
28. `return_protocols`
29. `settlements`
30. `user_permissions`
31. `users`
32. `vehicle_documents`
33. `vehicle_unavailability`
34. `vehicles`

---

## 🚨 KRITICKÉ ZISTENIA

### 1. **Lokálna databáza je ZASTARANÁ**
Chýba 17 dôležitých tabuliek ktoré sú v produkcii:
- `bank_accounts` - bankové účty
- `departments` - oddelenia
- `roles` - používateľské roly
- `teams` - tímy
- `team_members` - členovia tímov
- `user_sessions` - používateľské sessions
- `protocol_photos` - fotky protokolov
- `protocol_signatures` - podpisy protokolov
- `rental_backups` - zálohy prenájmov
- `email_action_logs` - email akcie
- `email_processing_history` - história emailov
- `expense_audit` - audit výdavkov
- `organizations` - organizácie
- `payment_orders` - platobné príkazy
- `user_notification_preferences` - notifikačné preferencie
- `user_permissions_cache` - cache permissions
- `blacklist` - blacklist

### 2. **Lokálna databáza má 2 NAVYŠE tabuľky**
- `favorites` - obľúbené (možno development feature?)
- `search_history` - história vyhľadávania (možno development feature?)

---

## 🔧 ODPORÚČANIA

### ✅ Možnosť 1: Spustiť migrácie na localhost
```bash
cd backend
RUN_MIGRATIONS=true pnpm run dev
```

### ✅ Možnosť 2: Stiahnuť Railway dump a importovať
```bash
# Export z Railway
PGPASSWORD=nfwrpKxILRUMqunYTZJEhjudEstqLRGv pg_dump -h trolley.proxy.rlwy.net -U postgres -p 13400 -d railway --schema-only > railway-schema.sql

# Import do localhost
psql -U postgres -d blackrent < railway-schema.sql
```

### ✅ Možnosť 3: Používať Railway databázu aj pre localhost development
Nastaviť v `backend/.env`:
```env
DATABASE_URL=postgresql://postgres:nfwrpKxILRUMqunYTZJEhjudEstqLRGv@trolley.proxy.rlwy.net:13400/railway
```

---

## 📝 POZNÁMKY

- Railway databáza je **aktuálna produkčná verzia**
- Localhost databáza je **zastaraná** - chýbajú nové features
- Potrebuješ rozhodnúť či:
  1. Aktualizovať localhost na najnovšiu verziu
  2. Alebo používať Railway databázu aj pre development

---

**Vygenerované:** 24.10.2025 23:19

