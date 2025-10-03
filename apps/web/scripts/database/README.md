# BlackRent Database Backup & Restore

Kompletný systém pre zálohovanie a obnovu Railway PostgreSQL databázy.

## 📋 Obsah

- [Rýchly štart](#rýchly-štart)
- [Backup databázy](#backup-databázy)
- [Restore databázy](#restore-databázy)
- [Formáty backupov](#formáty-backupov)
- [Troubleshooting](#troubleshooting)

---

## 🚀 Rýchly štart

### Vytvorenie backupu (jednorazovo)

```bash
cd /Users/mikailpirgozi/Desktop/Cursor\ zalohy\ mac16/Blackrent\ Beta\ 2/apps/web
pnpm backup:db
```

Backup sa automaticky uloží na Desktop do priečinka `blackrent-backups/`

### Obnova z backupu

```bash
pnpm restore:db -- ~/Desktop/blackrent-backups/blackrent_backup_2025-10-03_14-30-00.sql
```

---

## 💾 Backup databázy

### Základné použitie

```bash
pnpm backup:db
```

### Čo sa stane?

1. ✅ Overí pripojenie k Railway PostgreSQL databáze
2. 📊 Získa štatistiky databázy (počet tabuliek, vozidiel, firiem)
3. 💾 Vytvorí **2 formáty backupu**:
   - `blackrent_backup_YYYY-MM-DD_HH-MM-SS.sql` - SQL textový formát
   - `blackrent_backup_YYYY-MM-DD_HH-MM-SS.dump` - PostgreSQL custom komprimovaný formát
4. 📝 Vytvorí metadata súbor s informáciami o backupe
5. 📂 Automaticky otvorí Finder s backup priečinkom

### Výstup

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
         BlackRent Database Backup Tool
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

📁 Vytváram backup adresár...
✓ Adresár vytvorený: /Users/mikailpirgozi/Desktop/blackrent-backups

🔄 Pripájam sa k Railway PostgreSQL databáze...
   Host: trolley.proxy.rlwy.net
   Port: 13400
   Database: railway
   User: postgres

✓ Pripojenie úspešné!

📊 Získavam informácie o databáze...
   Počet tabuliek: 25
   Počet vozidiel: 111
   Počet firiem: 9

💾 Vytváram SQL backup (textový formát)...
✓ SQL backup vytvorený: blackrent_backup_2025-10-03_14-30-00.sql
   Veľkosť: 2.5M

💾 Vytváram Custom backup (komprimovaný formát)...
✓ Custom backup vytvorený: blackrent_backup_2025-10-03_14-30-00.dump
   Veľkosť: 890K

📝 Vytváram metadata súbor...
✓ Metadata vytvorené: blackrent_backup_2025-10-03_14-30-00_metadata.txt

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
✅ Backup úspešne dokončený!
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

📁 Backup lokácia:
   /Users/mikailpirgozi/Desktop/blackrent-backups/

📦 Vytvorené súbory:
   1. blackrent_backup_2025-10-03_14-30-00.sql (2.5M) - SQL textový formát
   2. blackrent_backup_2025-10-03_14-30-00.dump (890K) - PostgreSQL custom formát
   3. blackrent_backup_2025-10-03_14-30-00_metadata.txt - Informácie o backupe

💡 Tip: Pre restore použij návod v metadata súbore

✓ Hotovo!
```

---

## 🔄 Restore databázy

### ⚠️ VAROVANIE

**Restore operácia PREPÍŠE všetky dáta v cieľovej databáze!**

Pred restore vždy:
1. ✅ Urob backup aktuálneho stavu
2. ✅ Skontroluj že restore súbor je správny
3. ✅ Uisti sa že restore ide do správnej databázy

### Základné použitie

#### Restore z SQL súboru

```bash
pnpm restore:db -- ~/Desktop/blackrent-backups/blackrent_backup_2025-10-03_14-30-00.sql
```

#### Restore z Custom súboru

```bash
pnpm restore:db -- ~/Desktop/blackrent-backups/blackrent_backup_2025-10-03_14-30-00.dump
```

### Čo sa stane?

1. ✅ Overí že backup súbor existuje
2. 🔍 Detekuje formát súboru (.sql alebo .dump)
3. ⚠️  Zobrazí varovanie a požiada o potvrdenie (musíš napísať "YES")
4. 🔄 Overí pripojenie k databáze
5. 🗑️  Vyčistí existujúce tabuľky (--clean --if-exists)
6. 📥 Naimportuje dáta z backupu
7. ✅ Overí že restore prebehol úspešne

### Výstup

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
         BlackRent Database Restore Tool
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

📋 Restore informácie:
   Súbor: /Users/mikailpirgozi/Desktop/blackrent-backups/backup.sql
   Formát: SQL
   Nástroj: psql
   Veľkosť: 2.5M

⚠️  VAROVANIE: Táto operácia PREPÍŠE všetky dáta v databáze!
   Cieľová databáza: trolley.proxy.rlwy.net:13400/railway

Naozaj chceš pokračovať? (napíš 'YES' pre potvrdenie): YES

🔄 Testujem pripojenie k databáze...
✓ Pripojenie úspešné!

🔄 Spúšťam SQL restore...
[progress output...]

✅ Restore úspešne dokončený!

📊 Overujem databázu...
   Počet tabuliek: 25
   Počet vozidiel: 111

✓ Hotovo!
```

---

## 📦 Formáty backupov

### 1. SQL formát (.sql)

**Charakteristika:**
- ✅ Textový súbor, ľahko čitateľný v editore
- ✅ Vhodný pre version control (Git)
- ✅ Ľahko editovateľný (môžeš manuálne upraviť príkazy)
- ✅ Univerzálny, funguje s rôznymi verzami PostgreSQL
- ⚠️  Väčší súbor (nekomprimovaný)
- ⚠️  Pomalší restore pri veľkých databázach

**Kedy použiť:**
- Potrebuješ skontrolovať obsah backupu
- Chceš manuálne upraviť niektoré príkazy
- Chceš backup verziovať v Git
- Migrujete medzi rôznymi PostgreSQL verziami

**Restore:**
```bash
psql -h HOST -p PORT -U USER -d DATABASE < backup.sql
```

### 2. Custom formát (.dump)

**Charakteristika:**
- ✅ Komprimovaný (až 70% menší ako SQL)
- ✅ Rýchlejší restore
- ✅ Podporuje paralelný restore (pre veľké DB)
- ✅ Umožňuje selektívny restore (len určité tabuľky)
- ⚠️  Binárny formát, nie je čitateľný
- ⚠️  Potrebuješ pg_restore nástroj

**Kedy použiť:**
- Backup veľkej databázy (>100 MB)
- Potrebuješ rýchly restore
- Chceš ušetriť miesto na disku
- Pravidelné automatické backupy

**Restore:**
```bash
pg_restore -h HOST -p PORT -U USER -d DATABASE --clean --if-exists backup.dump
```

### Porovnanie

| Vlastnosť | SQL (.sql) | Custom (.dump) |
|-----------|------------|----------------|
| Veľkosť | 2.5 MB | 890 KB (64% menší) |
| Čitateľnosť | ✅ Áno | ❌ Nie |
| Rýchlosť restore | Pomalšie | ✅ Rýchlejšie |
| Editovateľnosť | ✅ Áno | ❌ Nie |
| Version control | ✅ Vhodné | ❌ Nevhodné |
| Selektívny restore | ❌ Nie | ✅ Áno |

**Odporúčanie:** Vždy vytváraj **oba formáty** (čo náš script robí automaticky):
- SQL pre bezpečnosť a čitateľnosť
- Custom pre rýchly restore

---

## 🔧 Troubleshooting

### Problém: "pg_dump nie je nainštalovaný"

**Riešenie:**

```bash
# macOS
brew install postgresql

# Ubuntu/Debian
sudo apt-get install postgresql-client

# Overenie
pg_dump --version
psql --version
```

### Problém: "Nepodarilo sa pripojiť k databáze"

**Možné príčiny:**
1. ❌ Railway credentials sa zmenili
2. ❌ Firewall blokuje pripojenie
3. ❌ Railway databáza nie je dostupná

**Riešenie:**

```bash
# 1. Overiť Railway credentials (Railway dashboard → Database → Connection)
# 2. Test pripojenia
PGPASSWORD=YOUR_PASSWORD psql -h trolley.proxy.rlwy.net -p 13400 -U postgres -d railway -c "SELECT 1;"

# 3. Aktualizovať credentials v skriptoch
# Upraviť: scripts/database/backup-db.sh
# Upraviť: scripts/database/restore-db.sh
```

### Problém: "Backup súbor je príliš veľký"

**Riešenie:**

```bash
# Komprimovať SQL súbor
gzip blackrent_backup_2025-10-03_14-30-00.sql
# Vytvorí: blackrent_backup_2025-10-03_14-30-00.sql.gz

# Restore z komprimovaného súboru
gunzip -c backup.sql.gz | psql -h HOST -p PORT -U USER -d DATABASE
```

**Alebo použiť Custom formát** (už komprimovaný)

### Problém: "Restore zlyhal - objekt už existuje"

**Riešenie:**

Náš script už používa `--clean --if-exists` flags, ktoré odstránia existujúce objekty pred restore.

Ak stále máš problémy:

```bash
# Manuálne vyčistenie databázy
psql -h HOST -p PORT -U USER -d DATABASE -c "DROP SCHEMA public CASCADE; CREATE SCHEMA public;"

# Potom spusti restore
pnpm restore:db -- backup.sql
```

### Problém: "Permission denied"

**Riešenie:**

```bash
# Daj execute práva skriptom
chmod +x scripts/database/backup-db.sh
chmod +x scripts/database/restore-db.sh
```

### Problém: "Out of memory počas restore"

**Riešenie pre veľké databázy:**

```bash
# Použiť Custom formát s parallel workers
pg_restore \
  -h trolley.proxy.rlwy.net \
  -p 13400 \
  -U postgres \
  -d railway \
  --clean \
  --if-exists \
  --jobs=4 \
  backup.dump
```

---

## 📅 Best Practices

### 1. Pravidelné backupy

```bash
# Pred každým dôležitým deployom
pnpm backup:db

# Pred veľkými zmenami v databáze
pnpm backup:db
```

### 2. Organizácia backupov

```
~/Desktop/blackrent-backups/
├── 2025-10-03/
│   ├── blackrent_backup_2025-10-03_09-00-00.sql
│   ├── blackrent_backup_2025-10-03_09-00-00.dump
│   └── blackrent_backup_2025-10-03_09-00-00_metadata.txt
├── 2025-10-04/
│   ├── ...
└── important/
    ├── before_migration.sql
    └── production_stable.dump
```

### 3. Testovanie restore

```bash
# Vždy testuj restore na lokálnej/test databáze pred produkciou
# 1. Vytvor test databázu
createdb blackrent_test

# 2. Test restore
PGPASSWORD=password pg_restore -h localhost -U postgres -d blackrent_test backup.dump

# 3. Overiť
psql -h localhost -U postgres -d blackrent_test -c "SELECT COUNT(*) FROM vehicles;"
```

### 4. Uchovávanie backupov

- **Denne:** 7 posledných dní
- **Týždenne:** 4 posledné týždne  
- **Mesačne:** 12 posledných mesiacov
- **Pred deployom:** vždy

### 5. Bezpečnosť

⚠️ **DÔLEŽITÉ:**
- Backupy obsahujú citlivé dáta
- NIKDY nepushuj backupy na GitHub
- Desktop priečinok nie je bezpečný pre long-term storage
- Zvážiť šifrované cloud storage (iCloud, Google Drive, Dropbox)

```bash
# Šifrovanie backupu
openssl enc -aes-256-cbc -salt -in backup.sql -out backup.sql.enc

# Dešifrovanie
openssl enc -d -aes-256-cbc -in backup.sql.enc -out backup.sql
```

---

## 🔗 Súvisiace príkazy

### Railway CLI (alternatíva)

```bash
# Nainštalovať Railway CLI
npm install -g @railway/cli

# Login
railway login

# Backup cez Railway
railway run pg_dump > backup.sql

# Restore cez Railway
railway run psql < backup.sql
```

### Priame pripojenie

```bash
# Export premenných
export PGHOST=trolley.proxy.rlwy.net
export PGPORT=13400
export PGUSER=postgres
export PGPASSWORD=nfwrpKxILRUMqunYTZJEhjudEstqLRGv
export PGDATABASE=railway

# Backup
pg_dump > backup.sql

# Restore
psql < backup.sql
```

---

## 📚 Dodatočné zdroje

- [PostgreSQL pg_dump dokumentácia](https://www.postgresql.org/docs/current/app-pgdump.html)
- [PostgreSQL pg_restore dokumentácia](https://www.postgresql.org/docs/current/app-pgrestore.html)
- [Railway PostgreSQL docs](https://docs.railway.app/databases/postgresql)

---

## 🆘 Podpora

Ak máš problémy s backupom/restore:

1. Skontroluj tento README
2. Pozri metadata súbor v backupe
3. Skontroluj Railway dashboard → Database → Logs
4. Kontaktuj tím

---

**Vytvorené:** 2025-10-03  
**Verzia:** 1.0.0  
**Projekt:** BlackRent Beta 2

