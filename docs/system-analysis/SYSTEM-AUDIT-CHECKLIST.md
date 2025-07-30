# 🔍 **BLACKRENT SYSTEM AUDIT CHECKLIST**

## 📋 **AKTUÁLNY STAV DATABÁZY** ✅
- **111 vozidiel**, **34 firiem** 
- **Statusy prenájmov**: 10 finished, 2 active, 1 pending ✅
- **8 používateľov**: 6 admin, 2 company_owner ✅
- **Transfer vlastníctva** deaktivovaný ✅
- **Duplicitné stĺpce zmazané**: customer_id, company, rental_type ✅

## 🎯 **FRONTEND FUNKCIE - TESTOVACIA MATICA**

### **A. AUTENTIFIKÁCIA & PRÍSTUP**
- [ ] **Login form** - admin/employee/company accounts
- [ ] **Protected routes** - permission checking
- [ ] **Role-based access** - admin vs company_owner permissions
- [ ] **Session persistence** - remember me functionality

### **B. HLAVNÉ MODULY**

#### **1. 🚗 VOZIDLÁ (/vehicles)**
- [ ] **Zoznam vozidiel** - loading, filtering, sorting
- [ ] **Pridanie vozidla** - all fields working
- [ ] **Úprava vozidla** - edit form functionality
- [ ] **Vymazanie vozidla** - delete confirmation
- [ ] **Kategórie** - SUV, dodávky, osobné, viacmiestne
- [ ] **Company ownership** - correct owner display

#### **2. 📅 DOSTUPNOSŤ (/availability)**
- [ ] **Kalendár zobrazenie** - month/range view
- [ ] **Obsadené vozidlá** - correct rental status display
- [ ] **Flexibilné prenájmy** - flexible vs standard display
- [ ] **Filtrovanie** - company filter working
- [ ] **Hard refresh fix** - no missing cars on F5

#### **3. 📝 PRENÁJMY (/rentals)**
- [ ] **Zoznam prenájmov** - all rentals displaying
- [ ] **Statusy** - pending/active/finished/completed correct
- [ ] **Nový prenájom** - form submission working
- [ ] **Úprava prenájmu** - edit existing rental
- [ ] **Flexibilné prenájmy** - is_flexible field working
- [ ] **Email parser** - parsing rental emails
- [ ] **Protokoly** - handover/return protocol integration

#### **4. 👥 ZÁKAZNÍCI (/customers)**
- [ ] **Zoznam zákazníkov** - display and search
- [ ] **Pridanie zákazníka** - new customer creation
- [ ] **História prenájmov** - customer rental history
- [ ] **Customer linking** - connecting to rentals

#### **5. 💰 NÁKLADY (/expenses)**
- [ ] **Zoznam nákladov** - expense listing
- [ ] **Pridanie nákladu** - new expense form
- [ ] **Kategórie nákladov** - expense categories

#### **6. 📊 VYÚČTOVANIE (/settlements)**
- [ ] **Zoznam vyúčtovaní** - settlement listing
- [ ] **Nové vyúčtovanie** - settlement creation

#### **7. 🛡️ POISTKY/STK (/insurances)**
- [ ] **Zoznam poistiek** - insurance documents
- [ ] **Upload dokumentov** - file upload functionality
- [ ] **Expiration tracking** - insurance expiry dates

#### **8. 👤 POUŽÍVATELIA (/users)**
- [ ] **Správa používateľov** - user management
- [ ] **Role assignment** - admin/company_owner roles
- [ ] **Company permissions** - company-specific access

#### **9. 📈 ŠTATISTIKY (/statistics)**
- [ ] **Dashboard** - overall statistics
- [ ] **Revenue charts** - financial overview
- [ ] **Vehicle utilization** - usage statistics

### **C. PROTOKOLY**
- [ ] **Odovzdávacie protokoly** - handover protocols
- [ ] **Preberá protokoly** - return protocols
- [ ] **PDF generation** - protocol PDF export
- [ ] **Media upload** - photos in protocols

### **D. SYSTÉMOVÉ FUNKCIE**
- [ ] **Permissions system** - role-based access control
- [ ] **Company filtering** - multi-company support
- [ ] **Dark/Light mode** - theme switching
- [ ] **Mobile responsiveness** - mobile UI
- [ ] **Error handling** - error boundaries and toasts
- [ ] **Loading states** - loading indicators

## 🚨 **PRIORITY TESTING ORDER**

### **LEVEL 1: KRITICKÉ** 🔴
1. **Login & Authentication**
2. **Kalendár dostupnosti** (main business function)
3. **Prenájmy - zoznam a statusy**
4. **Vozidlá - zobrazenie a company ownership**

### **LEVEL 2: DÔLEŽITÉ** 🟡
5. **Nový prenájom creation**
6. **Email parser**
7. **Permissions system**
8. **Protokoly**

### **LEVEL 3: NICE-TO-HAVE** 🟢
9. **Štatistiky**
10. **Expenses & Settlements**
11. **Theme switching**
12. **Mobile UI**

## 📝 **TESTING NOTES**

### **Testovacie účty:**
- **admin/admin123** - plný prístup
- **employee/employee123** - obmedzený prístup  
- **company1/company123** - len vlastné dáta

### **Test scenarios:**
- ✅ **Happy path** - všetko funguje správne
- ⚠️ **Edge cases** - chybové stavy, prázdne dáta
- 🚨 **Error handling** - network errors, API failures

## 🎯 **NEXT STEPS**

Akonáhle identifikujeme problematické funkcie, vytvoríme:
1. **Bug fix priority list**
2. **Missing features list** 
3. **Performance optimization plan**
4. **UI/UX improvement plan**

---

**STATUS**: 🚀 Ready for systematic testing 