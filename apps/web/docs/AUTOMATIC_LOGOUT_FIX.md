# 🔐 FIX: Automatické odhlasovanie pri uložení prenájmov

## 🐛 Problém

Keď používateľ `bitarovsky` (company_admin) upravoval prenájmy a dal uložiť, aplikácia ho **automaticky odhlásila**. Toto bolo spôsobené príliš agresívnym spracovaním 401/403 HTTP odpovedí na frontende.

## 🔍 Analýza

### Frontend problém (HLAVNÝ)
V `src/services/api.ts` (riadky 79-94):
- **Každý 401/403 HTTP status** automaticky vymazal auth data a presmeroval na `/login`
- Toto sa dialo **aj pri authorization errors** (nemá práva), nie len pri authentication errors (neplatný token)
- Používateľ bol odhlásený aj keď mal platné prihlásenie, len nemohol vykonať konkrétnu akciu

### Backend príčina
V `backend/src/routes/rentals.ts` + `backend/src/middleware/permissions.ts`:
- `company_admin` môže upravovať len prenájmy vozidiel **vo vlastnej firme**
- Pri PUT `/rentals/:id` sa kontroluje či `req.user.companyId === vehicle.ownerCompanyId`
- Ak vozidlo **patrí inej firme** alebo používateľ **nemá správne nastavené companyId**, backend vracia **403 Forbidden**
- Frontend to interpretoval ako "neplatný token" a odhlásil používateľa

## ✅ Riešenie

### 1. Frontend oprava (KRITICKÁ) ✅

**Súbor:** `src/services/api.ts`

**Zmeny:**
```typescript
// PRED (agresívne):
if (response.status === 401 || response.status === 403) {
  // Vždy vymazať auth data a odhlásiť
  localStorage.removeItem('blackrent_token');
  // ... redirect na /login
}

// PO (inteligentné):
if (response.status === 401 || response.status === 403) {
  const isAuthEndpoint = endpoint.includes('/auth/me') || endpoint.includes('/auth/login');
  
  // Len pri authentication endpoints odhlásiť
  if (isAuthEndpoint) {
    // Vymazať auth data a redirect
  } else {
    // Len throw error bez odhlásenia
    throw new Error('Nemáte oprávnenie pre túto akciu');
  }
}
```

**Prínos:**
- ✅ Používateľ **zostane prihlásený** aj pri authorization errors
- ✅ Odhlásenie len pri **skutočne neplatnom tokene** (auth endpoints)
- ✅ Lepšia UX - jasná chybová hláška namiesto odhlásenia

### 2. Backend diagnostika ✅

**Súbor:** `backend/src/routes/rentals.ts`

**Pridané logovanie do `getRentalContext`:**
```typescript
console.log('🔍 getRentalContext:', {
  rentalId,
  vehicleId: rental.vehicleId,
  hasVehicle: !!vehicle,
  resourceCompanyId: vehicle?.ownerCompanyId,
  amount: rental.totalPrice,
  userCompanyId: req.user?.companyId,
  userName: req.user?.username
});
```

**Prínos:**
- 🔍 Vidíme **presne** prečo backend vracia 403
- 🔍 Môžeme zistiť či problém je:
  - Vozidlo nemá `ownerCompanyId`
  - Používateľ nemá nastavené `companyId`
  - Používateľ upravuje prenájom inej firmy

## 📋 Testovanie

### Scenár 1: Úprava vlastného prenájmu
1. Prihlás sa ako `bitarovsky` (company_admin)
2. Uprav prenájom vozidla **vlastnej firmy**
3. **Očakávaný výsledok:** Úspešné uloženie, používateľ zostane prihlásený

### Scenár 2: Úprava cudzieho prenájmu
1. Prihlás sa ako `bitarovsky` (company_admin)
2. Pokús sa upraviť prenájom vozidla **inej firmy**
3. **Očakávaný výsledok:** Chybová hláška "Nemáte oprávnenie", **používateľ zostane prihlásený**

### Scenár 3: Neplatný token
1. Manuálne zmaž token z localStorage
2. Obnoviť stránku
3. **Očakávaný výsledok:** Redirect na `/login`

## 🎯 Ďalšie kroky

Ak používateľ `bitarovsky` stále dostáva 403 pri úprave **vlastných prenájmov**:

1. **Skontroluj backend logy** - `getRentalContext` vypíše:
   ```
   🔍 getRentalContext: {
     resourceCompanyId: '...', 
     userCompanyId: '...',
     userName: 'bitarovsky'
   }
   ```

2. **Overenie v databáze:**
   ```sql
   -- Skontroluj companyId používateľa
   SELECT id, username, role, company_id FROM users WHERE username = 'bitarovsky';
   
   -- Skontroluj ownerCompanyId vozidiel
   SELECT id, license_plate, owner_company_id FROM vehicles;
   
   -- Skontroluj prenájmy
   SELECT r.id, r.customer_name, r.vehicle_id, v.owner_company_id 
   FROM rentals r 
   LEFT JOIN vehicles v ON r.vehicle_id = v.id
   WHERE r.id = '<rental_id>';
   ```

3. **Možné riešenia:**
   - Nastaviť `company_id` v `users` tabuľke pre `bitarovsky`
   - Nastaviť `owner_company_id` v `vehicles` tabuľke
   - Dočasne zmeniť rolu na `admin` pre testovanie

## 📝 Zhrnutie zmien

| Súbor | Zmeny | Status |
|-------|-------|--------|
| `src/services/api.ts` | Inteligentné spracovanie 401/403 | ✅ Done |
| `backend/src/routes/rentals.ts` | Pridané diagnostické logy | ✅ Done |

**Kritickosť:** 🔴 **HIGH** - Používateľ nemohol používať aplikáciu
**Dopad:** ✅ **FIXED** - Používateľ už nebude automaticky odhlásený
**Testing:** ✅ **PASSED** - Otestované s používateľom `bitarovsky`

## ✅ Finálne potvrdenie

**Dátum testovania:** 2025-10-10 12:45 CET

**Testované používateľom:** `bitarovsky` (admin Blackrent platformy)

**Výsledky:**
1. ✅ **Automatický logout vyriešený** - Používateľ zostane prihlásený aj pri 403 chybách
2. ✅ **Update prenájmov funguje** - Screenshot potvrdil úspešné uloženie zmien
3. ✅ **403 chyba vyriešená** - Po prihlásení sa pod správnym admin účtom všetko funguje

**Poznámka:** Prvotný problém bol spôsobený tým, že používateľ nebol prihlásený pod správnym admin účtom. Po prihlásení pod správnym účtom (`bitarovsky`) všetko funguje bez problémov.

---

**Status:** ✅ **VERIFIED & WORKING**
**Autor:** AI Assistant
**Posledná aktualizácia:** 2025-10-10 12:45 CET

