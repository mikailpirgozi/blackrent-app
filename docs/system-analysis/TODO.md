# TODO LIST - BLACKRENT APLIKÁCIA

## 🚀 AKTUÁLNE ÚLOHY

### ✅ DOKONČENÉ
- [x] Implementácia protokolov prevzatia a vrátenia
- [x] Elektronický podpis s canvas
- [x] Fotky tachometra a paliva
- [x] Automatické číslo objednávky
- [x] Časová pečiatka podpisu
- [x] Možnosť vymazať protokol pre admina
- [x] Auto-save konceptov
- [x] Voľná navigácia medzi krokmi

### 🔧 AKTUÁLNE ÚLOHY

#### 1. 📸 OPRAVA ZOBRAZENIA FOTIEK V PDF
- [ ] Pridať zobrazenie fotiek do PDF protokolu
- [ ] Implementovať vloženie obrázkov do PDF
- [ ] Pridať thumbnail fotiek do PDF
- [ ] Zobraziť fotky tachometra a paliva v PDF

#### 2. ✍️ OPRAVA ZOBRAZENIA PODPISOV V PDF
- [ ] Pridať zobrazenie elektronických podpisov do PDF
- [ ] Implementovať vloženie base64 obrázkov podpisov
- [ ] Pridať časovú pečiatku podpisu do PDF
- [ ] Zobraziť informácie o podpisujúcom

#### 3. 🗑️ BACKEND API PRE VYMAZANIE PROTOKOLOV
- [ ] Implementovať DELETE endpoint pre protokoly
- [ ] Pridať autorizáciu (len admin)
- [ ] Pridať soft delete vs hard delete
- [ ] Implementovať audit log

#### 4. 📊 VYLEPŠENIA PDF GENERÁCIE
- [ ] Pridať logo firmy do PDF
- [ ] Vylepšiť layout a dizajn
- [ ] Pridať QR kód pre digitálnu verifikáciu
- [ ] Implementovať watermark

#### 5. 🔄 WORKFLOW VYLEPŠENIA
- [ ] Email notifikácie pri vytvorení protokolu
- [ ] Automatické odoslanie PDF zákazníkovi
- [ ] Push notifikácie pre mobilné zariadenia
- [ ] Integrácia s SMS službami

#### 6. 📱 MOBILNÁ OPTIMALIZÁCIA
- [ ] Vylepšiť touch podporu pre podpisy
- [ ] Optimalizovať fotenie pre mobilné zariadenia
- [ ] Pridať offline podporu
- [ ] Implementovať PWA funkcionality

#### 7. 🔍 DIAGNOSTIKA A MONITORING
- [ ] Pridať detailné logy pre debugovanie
- [ ] Implementovať error tracking
- [ ] Pridať performance monitoring
- [ ] Vytvoriť admin dashboard

#### 8. 🗄️ DATABÁZOVÉ VYLEPŠENIA
- [ ] Pridať indexy pre lepší výkon
- [ ] Implementovať databázové migrácie
- [ ] Pridať automatické zálohovanie
- [ ] Optimalizovať queries

## 🎯 PRIORITY

### VYSOKÁ PRIORITA
1. **Oprava zobrazenia fotiek v PDF** - kritické pre funkčnosť
2. **Oprava zobrazenia podpisov v PDF** - kritické pre funkčnosť
3. **Backend API pre vymazanie protokolov** - požadované používateľom

### STREDNÁ PRIORITA
4. Vylepšenia PDF generácie
5. Workflow vylepšenia
6. Mobilná optimalizácia

### NÍZKA PRIORITA
7. Diagnostika a monitoring
8. Databázové vylepšenia

## 📝 POZNÁMKY

- Všetky zmeny sa automaticky deployujú cez GitHub
- Backend je na Railway, frontend na Vercel
- Používateľ preferuje automatické deployy
- Aplikácia používa PostgreSQL na Railway
- Fotky sa ukladajú ako base64 dataURL
- Podpisy sa ukladajú ako base64 PNG obrázky 