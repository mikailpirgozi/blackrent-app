# 🛡️ CACHE MIGRATION SAFETY CHECKLIST

## PRE KAŽDOU ZMENOU:
- [ ] `git add . && git commit -m "BACKUP: Working state"`
- [ ] `./scripts/cache-migration-check.sh` (všetky checks musia byť ✅)
- [ ] Otestuj v prehliadači: http://localhost:3000

## PO KAŽDEJ ZMENE:
- [ ] `npm run build` (musí prejsť bez errors)
- [ ] `cd backend && npm run build` (musí prejsť bez errors)  
- [ ] `./scripts/cache-migration-check.sh` (všetky checks musia byť ✅)
- [ ] Manuálne testy (pozri nižšie)

## MANUÁLNE TESTY:

### 1. 🚗 VEHICLES PAGE
- [ ] Načíta sa za menej ako 3 sekundy
- [ ] Zobrazuje všetky vozidlá
- [ ] Filter funguje správne
- [ ] Search funguje správne

### 2. 🏠 RENTALS PAGE  
- [ ] Načíta sa za menej ako 3 sekundy
- [ ] Zobrazuje všetky prenájmy
- [ ] Pagination funguje
- [ ] Nový prenájom sa dá vytvoriť

### 3. 👥 CUSTOMERS PAGE
- [ ] Načíta sa za menej jak 3 sekundy
- [ ] Zobrazuje všetkých zákazníkov
- [ ] Nový zákazník sa dá vytvoriť

### 4. 📊 CACHE MONITORING
- [ ] Admin → Cache Monitoring funguje
- [ ] Zobrazuje cache stats
- [ ] Clear cache funguje

## AK NIEČO ZLYHÁ:

### IMMEDIATE ROLLBACK:
```bash
git checkout main
git reset --hard HEAD~1  # Vráti posledný commit
npm run dev:restart
```

### EMERGENCY RESTORE:
```bash
git checkout cache-migration-backup
npm run dev:restart
```

## PERFORMANCE BENCHMARKS:

### PRED MIGRÁCIOU:
- Vehicles load: ~2s
- Rentals load: ~3s  
- Cache hit rate: ~60%

### PO MIGRÁCII (TARGET):
- Vehicles load: ~1s
- Rentals load: ~2s
- Cache hit rate: ~80%

## RED FLAGS 🚨:

- **Build errors** → STOP, rollback
- **Server crash** → STOP, rollback  
- **API errors** → STOP, rollback
- **Load time > 5s** → STOP, rollback
- **Cache hit rate < 40%** → STOP, rollback
