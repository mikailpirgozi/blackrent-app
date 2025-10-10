# 🎨 PERMISSION MANAGEMENT UI - USER GUIDE

## ✅ **ČO JE TERAZ K DISPOZÍCII**

Po dokončení implementácie máte **komplexné UI pre správu oprávnení**!

---

## 🎯 **HLAVNÉ FEATURES**

### **1. Super Admin Badge** ✅
- **Kde:** V pravom hornom rohu headera
- **Čo zobrazuje:** 
  - `👑 Admin` - pre legacy admin role
  - `👑 Super Admin` - pre super_admin role
  - `🏢 Company Admin` - pre company_admin role
- **Farba:** Červený gradient (admin), modrá (company admin)

### **2. Oprávnenia Menu Item** ✅
- **Kde:** V ľavom menu (sidebar)
- **Ikona:** 🛡️ Shield
- **Text:** "Oprávnenia"
- **Kto vidí:** Len Super Admin a Admin
- **Route:** `/admin/permissions`

### **3. Enhanced User Management** ✅
- **Kde:** `/users` route
- **4 Taby:**
  1. **Používatelia** - CRUD operations
  2. **Oprávnenia** - Permission management (len pre admin)
  3. **Role Info** - Prehľad rolí a ich práv
  4. **Notifikácie** - Push notification management

---

## 📖 **AKO TO POUŽÍVAŤ**

### **SCENÁR 1: Vytvorenie Nového Používateľa pre Impresario**

#### **Krok 1: Prejdite na Používateľov**
```
Sidebar → Správa používateľov
```

#### **Krok 2: Prejdite na Tab "Oprávnenia"**
```
Kliknite na tab "Oprávnenia" (druhý tab)
Má červený Admin badge
```

#### **Krok 3: Vyberte Používateľa (alebo vytvorte nového)**
```
Ak ešte neexistuje:
1. Vytvorte v tab "Používatelia"
2. Username: impresario_emp3
3. Email: employee3@impresario.sk
4. Password: Impresario323!
5. Role: Employee
6. Company: Impresario
```

#### **Krok 4: Priraďte Permissions**
```
1. V tab "Oprávnenia" kliknite na používateľa
2. Vyberte "Pridať firmu" → Impresario
3. Nastavte permissions:
   - Vozidlá: ✅ Čítanie, ✅ Zápis, ❌ Mazanie
   - Prenájmy: ✅ Čítanie, ✅ Zápis, ❌ Mazanie
   - Expenses: ✅ Čítanie, ✅ Zápis, ❌ Mazanie
   - Atď...
4. Kliknite "Uložiť Oprávnenia"
```

#### **Krok 5: Overte**
```
1. Odhláste sa
2. Prihláste sa ako impresario_emp3
3. Mali by ste vidieť:
   - ✅ Len Impresario vozidlá
   - ✅ Môžete vytvárať/upravovať rentals
   - ❌ Nemôžete mazať vozidlá
```

---

### **SCENÁR 2: Vytvorenie Company Admin pre BlackRent**

#### **Krok 1: Vytvorte Používateľa**
```
Tab "Používatelia" → Nový Používateľ:
- Username: blackrent_admin
- Email: admin@blackrent.sk
- Password: BlackRent123!
- Role: Company Admin
- Company: BlackRent
```

#### **Krok 2: Permissions sa Nastavia Automaticky**
```
Company Admin má automaticky PLNÉ PRÁVA vo svojej firme!
Nemusíte nastavovať permissions manuálne.
```

#### **Krok 3: Overte**
```
1. Odhláste sa
2. Prihláste sa ako blackrent_admin
3. Mali by ste vidieť:
   - ✅ Len BlackRent vozidlá (nie Impresario!)
   - ✅ Môžete všetko vytvárať/upravovať/mazať
   - ✅ Môžete vytvárať nových users pre BlackRent
```

---

### **SCENÁR 3: Bulk Permission Assignment**

#### **Krok 1: Vytvorte Viacerých Employees**
```
Vytvorte 3 employees pre Impresario:
- impresario_emp1, impresario_emp2, impresario_emp3
```

#### **Krok 2: Použite Quick Actions**
```
V Permission Edit dialogu:
1. Vyberte používateľa
2. Pridajte firmu Impresario
3. Použite quick action buttony:
   - "✅ Všetko Čítanie" - nastaví read=true všade
   - "✏️ Všetko Zápis" - nastaví read+write=true všade
   - "🗑️ Plné Práva" - nastaví všetko na true
4. Alebo upravte individuálne pre každý resource
```

---

## 🎨 **UI KOMPONENTY**

### **1. Permission Matrix Table**
```
+-------------+--------+-------+--------+
| Resource    | Read   | Write | Delete |
+-------------+--------+-------+--------+
| 🚗 Vozidlá  | [✓]    | [ ]   | [ ]    |
| 📝 Prenájmy | [✓]    | [✓]   | [ ]    |
| 💰 Náklady  | [✓]    | [✓]   | [ ]    |
+-------------+--------+-------+--------+
```

**Funkcie:**
- ✅ Toggle switches pre každé právo
- ✅ Quick action buttony (nastaviť všetko)
- ✅ Visual feedback (farby, ikony)
- ✅ Real-time preview

### **2. Company Access Cards**
```
┌─────────────────────────────────────────┐
│ 🏢 Impresario                           │
│                                         │
│ ✅ Read: 9/9   ✏️ Write: 6/9  🗑️ Delete: 0/9 │
│                                         │
│ [Upraviť] [Odstrániť]                   │
└─────────────────────────────────────────┘
```

**Funkcie:**
- ✅ Prehľad permissions na prvý pohľad
- ✅ Rýchle úpravy
- ✅ Odstránenie prístupu jedným klikom

### **3. User Selection Grid**
```
┌───────────┐ ┌───────────┐ ┌───────────┐
│ admin     │ │impresario │ │blackrent  │
│ 👑 Admin  │ │🏢 Employee│ │🏢 Admin   │
│ ✓ Selected│ │           │ │           │
└───────────┘ └───────────┘ └───────────┘
```

**Funkcie:**
- ✅ Grid layout (3 columns)
- ✅ Visual selection indicator
- ✅ Role badges
- ✅ Click to select

---

## 🚀 **QUICK ACTIONS**

### **Rýchle Pridelenie Permissions:**

| Button | Čo urobí |
|--------|----------|
| ✅ Všetko Čítanie | `read: true` pre všetky resources |
| ✏️ Všetko Zápis | `read: true, write: true` pre všetky resources |
| 🗑️ Plné Práva | `read: true, write: true, delete: true` pre všetky resources |
| ❌ Vymazať Všetko | `read: false, write: false, delete: false` pre všetky resources |

---

## 💡 **BEST PRACTICES**

### **1. Vytvárajte Users s Minimálnymi Právami**
```
✅ DOBRE: Employee začína s read-only, pridáte write podľa potreby
❌ ZLE: Dať všetkým full access "pre istotu"
```

### **2. Používajte Role Pre Šablóny**
```
company_admin → Automaticky full access vo firme
company_owner → Automaticky read-only
employee → Custom permissions (najflexibilnejšie)
```

### **3. Pravidelne Reviewujte Permissions**
```
1x mesačne:
- Kto má prístup k akým firmám?
- Sú všetky permissions stále relevantné?
- Deaktivujte neaktívnych users
```

### **4. Audit Trail**
```
Všetky zmeny permissions sa logujú do permission_audit_log!
Môžete kedykoľvek vidieť:
- Kto zmenil permissions
- Kedy to bolo zmenené
- Čo sa zmenilo
```

---

## 🔍 **TROUBLESHOOTING**

### **Problem: Nevidím tab "Oprávnenia"**
```
Riešenie:
1. Skontrolujte či ste prihlásený ako admin/super_admin
2. Hard refresh (Cmd+Shift+R)
3. Skontrolujte console errors
```

### **Problem: Nemôžem priradiť permissions**
```
Riešenie:
1. Skontrolujte či user má vybranú firmu (companyId)
2. Skontrolujte backend logs
3. Overte že user_company_access tabuľka existuje
```

### **Problem: Permissions sa neuložia**
```
Riešenie:
1. Skontrolujte network tab - volá sa POST /api/permissions/user/{id}/company/{id}?
2. Skontrolujte response - success: true?
3. Skontrolujte backend logs
4. Overte že máte admin role
```

---

## 📋 **RESOURCES VYSVETLENIE**

| Resource | Čo zahŕňa | Príklad |
|----------|-----------|---------|
| 🚗 **Vozidlá** | Všetky vozidlá firmy | BMW X5, Mercedes E-Class |
| 📝 **Prenájmy** | Všetky rental records | Aktívne, dokončené, zrušené |
| 💰 **Náklady** | Expenses a costs | Tankovanie, servis, poistky |
| 📊 **Vyúčtovanie** | Settlements a invoices | Mesačné vyúčtovanie |
| 👥 **Zákazníci** | Customer database | Mená, kontakty, história |
| 🛡️ **Poistky/STK** | Insurance records | STK, poistky, claims |
| 🔧 **Údržba** | Maintenance logs | Servisy, opravy |
| 📋 **Protokoly** | Handover/return protocols | PDF dokumenty |
| 📈 **Štatistiky** | Analytics a reports | Revenue, využitie áut |

---

## 🎯 **PERMISSION LEVELS**

### **Read (Čítanie)**
```
✅ Môže vidieť zoznamy
✅ Môže otvoriť detail
✅ Môže exportovať dáta
❌ Nemôže upravovať
```

### **Write (Zápis)**
```
✅ Všetko z Read
✅ Môže vytvárať nové
✅ Môže upravovať existujúce
❌ Nemôže mazať
```

### **Delete (Mazanie)**
```
✅ Všetko z Write
✅ Môže mazať záznamy
⚠️ Pozor: Permanentná akcia!
```

---

## 📞 **SUPPORT**

### **Ak niečo nefunguje:**

1. **Skontrolujte Console:**
```javascript
// V browser DevTools (F12) → Console
// Hľadajte errors červenou farbou
```

2. **Overte Backend:**
```bash
# Backend logy
cd backend
npm run dev

# Hľadajte:
# ✅ Admin access granted
# ✅ User permission set
```

3. **Test Permissions API:**
```bash
# V browser console:
fetch('/api/permissions/user/YOUR_USER_ID/access', {
  headers: {
    'Authorization': 'Bearer YOUR_TOKEN'
  }
}).then(r => r.json()).then(console.log)
```

---

## 🎊 **ZÁVER**

**TERAZ MÁTE:**
- ✅ Super Admin badge (vidíte svoju rolu)
- ✅ Permission Management UI (tab v /users)
- ✅ Granulárne nastavenia (resource-level permissions)
- ✅ Company selection (priraďte users k firmám)
- ✅ Quick actions (rýchle nastavenie permissions)
- ✅ Visual feedback (badges, colors, icons)
- ✅ Real-time updates (okamžitá cache invalidation)

**MÔŽETE:**
1. ✅ Vytvárať users pre konkrétne firmy
2. ✅ Priraďovať granulárne permissions
3. ✅ Upravovať permissions kedykoľvek
4. ✅ Vidieť kto má prístup kam
5. ✅ Odstrániť prístup jedným klikom
6. ✅ Použiť quick actions pre rýchle nastavenie

---

**Verzia:** 1.0.2  
**Dátum:** 2025-01-04  
**Status:** ✅ UI Complete & Ready

🎉 **Používajte a užívajte si perfektný permission management!** 🎉

