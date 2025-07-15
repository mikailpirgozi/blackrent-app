# 📊 Ukladanie dát v Blackrent aplikácii

## 🔄 Rozdiel medzi SQLite a PostgreSQL

### 📦 **SQLite** (predchádzajúce)
```
📁 Umiestnenie dát:
   backend/blackrent.db                    (hlavný súbor databázy)
   
📁 Automatické zálohy:
   backend/backups/
   ├── blackrent-startup-*.db             (zálohy pri spustení)
   ├── blackrent-backup-*.db              (manuálne zálohy)
   ├── blackrent-daily-*.db               (denné zálohy)
   └── blackrent-before-delete-*.db       (zálohy pred mazaním)

✅ Výhody:
   - Jeden súbor = ľahko zálohovateľné
   - Automatické zálohy každých 24 hodín
   - Zálohy pred kritickými operáciami
   - Rýchle pre malé aplikácie

❌ Nevýhody:
   - Nezvláda veľa súčasných používateľov
   - Nie je vhodné pre hosting
   - Obmedzené možnosti škálovania
```

### 🐘 **PostgreSQL** (aktuálne)
```
📁 Umiestnenie dát:
   /opt/homebrew/var/postgresql@14/        (systémové súbory)
   ├── base/                              (databázové súbory)
   ├── pg_wal/                            (transaction logy)
   └── postgresql.conf                     (konfigurácia)

📁 Naše zálohy:
   backend/postgres-backups/
   ├── blackrent-backup-*.sql             (manuálne zálohy)
   ├── blackrent-auto-*.sql               (automatické zálohy)
   └── auto-backup.log                    (log automatických záloh)

✅ Výhody:
   - Enterprise-grade databáza
   - Zvláda veľa súčasných používateľov
   - Ideálne pre hosting a produkciu
   - Pokročilé funkcie (indexy, views, triggers)
   - ACID compliance

❌ Nevýhody:
   - Složitejšie nastavenie
   - Vyžaduje PostgreSQL server
   - Väčšie nároky na systém
```

## 🛠️ Aktuálny stav vašich dát

### SQLite databáza:
- **Vozidlá:** 56 záznamov
- **Prenájmy:** 0 záznamov  
- **Zákazníci:** 0 záznamov
- **Zálohy:** 15 súborov v `backend/backups/`

### PostgreSQL databáza:
- **Vozidlá:** 0 záznamov (nová databáza)
- **Prenájmy:** 0 záznamov
- **Zákazníci:** 0 záznamov
- **Zálohy:** 1 súbor v `backend/postgres-backups/`

## 📋 Ako používať zálohy

### SQLite zálohy (staré dáta):
```bash
# Pozrieť zálohy
ls -la backend/backups/

# Obnoviť najnovšiu zálohu
cp backend/backups/blackrent-startup-2025-07-13T20-03-31-830Z.db backend/blackrent.db
```

### PostgreSQL zálohy (nové):
```bash
# Vytvoriť zálohu
./backend/postgres-backup.sh backup

# Zobraziť zálohy  
./backend/postgres-backup.sh list

# Obnoviť zálohu
./backend/postgres-backup.sh restore <backup-file>

# Porovnať SQLite vs PostgreSQL
./backend/postgres-backup.sh compare

# Vymazať staré zálohy
./backend/postgres-backup.sh cleanup 7
```

### Automatické PostgreSQL zálohy:
```bash
# Pridať do crontab pre automatické zálohy o 2:00 ráno
crontab -e

# Pridať riadok:
0 2 * * * cd /path/to/blackrent-new && ./backend/postgres-backup.sh auto-backup
```

## 🔄 Migrácia dát z SQLite do PostgreSQL

Ak chcete preniesť dáta z SQLite do PostgreSQL:

### 1. Export SQLite dát:
```bash
# Všetky dáta
sqlite3 backend/blackrent.db ".dump" > sqlite-export.sql

# Len špecifické tabuľky
sqlite3 backend/blackrent.db ".dump vehicles" > vehicles.sql
sqlite3 backend/blackrent.db ".dump rentals" > rentals.sql
```

### 2. Úprava pre PostgreSQL:
```bash
# Konverzia SQLite -> PostgreSQL formát
sed -i '' 's/INTEGER PRIMARY KEY/SERIAL PRIMARY KEY/g' sqlite-export.sql
sed -i '' 's/DATETIME/TIMESTAMP/g' sqlite-export.sql
```

### 3. Import do PostgreSQL:
```bash
# Import upravených dát
psql -d blackrent < sqlite-export.sql
```

## 📊 Monitoring a údržba

### Veľkosť databáz:
```bash
# SQLite
du -h backend/blackrent.db

# PostgreSQL
psql -d blackrent -c "SELECT pg_size_pretty(pg_database_size('blackrent'));"
```

### Počet záznamov:
```bash
# Porovnanie SQLite vs PostgreSQL
./backend/postgres-backup.sh compare
```

### Kontrola integrity:
```bash
# SQLite
sqlite3 backend/blackrent.db "PRAGMA integrity_check;"

# PostgreSQL  
psql -d blackrent -c "SELECT * FROM pg_stat_activity WHERE datname = 'blackrent';"
```

## 🚀 Odporúčania pre hosting

### Pre produkčné nasadenie:
1. **Používajte PostgreSQL** (nie SQLite)
2. **Nastavte automatické zálohy** (cron job)
3. **Monitorujte veľkosť databázy**
4. **Pravidelne testujte obnovu zo záloh**
5. **Používajte external backup storage** (AWS S3, Google Cloud)

### Backup stratégia:
- **Denné zálohy:** Automaticky o 2:00 ráno
- **Zálohy pred aktualizáciami:** Manuálne
- **Ponechávanie:** 30 denných záloh, 12 mesačných
- **External storage:** Týždenné uploady na cloud

## 🆘 Riešenie problémov

### PostgreSQL nefunguje:
```bash
# Reštart PostgreSQL
brew services restart postgresql@14

# Kontrola stavu
pg_isready

# Kontrola logov
tail -f /opt/homebrew/var/log/postgresql@14.log
```

### Stratené dáta:
```bash
# Obnoviť najnovšiu zálohu
./backend/postgres-backup.sh list
./backend/postgres-backup.sh restore <najnovšia-záloha>
```

### Plný disk:
```bash
# Vymazať staré zálohy
./backend/postgres-backup.sh cleanup 3

# Skontrolovať veľkosť
du -sh backend/postgres-backups/
```

---

**💡 Tip:** Pre hosting vždy používajte PostgreSQL s automatickými zálohami a external storage! 