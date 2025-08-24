# 🎯 BLACKRENT BACKUP SYSTEM

Komplexný systém denných záloh pre BlackRent aplikáciu.

## 📋 PREHĽAD

Tento backup systém zabezpečuje automatické denné zálohovanie všetkých kritických komponentov BlackRent aplikácie:

- 🗄️ **Railway PostgreSQL databáza** (produkčná)
- 🗄️ **Lokálna PostgreSQL databáza** (development)
- 📁 **Kritické súbory a konfigurácie**
- 📄 **Protokoly a dokumenty**
- 🌐 **R2 Storage súbory**

---

## 🚀 RÝCHLY ŠTART

### 1. **Lokálna záloha na PC (ODPORÚČANÉ):**
```bash
./backup-now.sh
```

### 2. Nastavenie automatických cloud záloh:
```bash
./scripts/backup/setup-automated-backups.sh
```

### 3. Manuálne spustenie zálohy:
```bash
./scripts/backup/daily-backup-master.sh
```

### 4. Monitoring záloh:
```bash
./scripts/backup/backup-monitor.sh
```

---

## 📁 ŠTRUKTÚRA SÚBOROV

```
scripts/backup/
├── simple-local-backup.sh      # 💻 Lokálna záloha na PC
├── daily-backup-master.sh      # 🎯 Hlavný backup skript
├── r2-backup-sync.sh           # 🌐 R2 Storage zálohy
├── setup-automated-backups.sh  # 🤖 Nastavenie automatizácie
├── backup-monitor.sh           # 📊 Monitoring systém
├── railway-cron-backup.js      # 🚀 Railway cloud backup
├── cron-backup-wrapper.sh      # 🕐 Cron wrapper (auto-generovaný)
└── README.md                   # 📖 Táto dokumentácia

backup-now.sh                   # 🚀 Rýchla lokálna záloha (root)
```

---

## 🗂️ ŠTRUKTÚRA ZÁLOH

```
# LOKÁLNE ZÁLOHY (na vašom PC)
local-backups/
├── blackrent-local-backup-2025-08-24_22-14-06.sql.gz  # Rýchle zálohy
├── blackrent-local-backup-2025-08-24_22-13-50.sql.gz
└── logs/

# CLOUD ZÁLOHY (Railway + R2)
backups/
├── database/
│   └── 2025-01-15/
│       ├── railway-blackrent-2025-01-15_02-00-01.sql.gz
│       └── local-blackrent-2025-01-15_02-00-01.sql.gz
├── files/
│   └── 2025-01-15/
│       └── protocols-documents-2025-01-15_02-00-01.tar.gz
├── config/
│   └── 2025-01-15/
│       └── critical-files-2025-01-15_02-00-01.tar.gz
├── r2-storage/
│   └── 2025-01-15/
│       ├── r2-files-2025-01-15_02-00-01.tar.gz
│       ├── r2-file-list-2025-01-15_02-00-01.txt
│       └── r2-analysis-2025-01-15_02-00-01.txt
└── logs/
    ├── backup-report-2025-01-15.log
    ├── cron-backup-2025-01-15.log
    └── backup-monitoring-2025-01-15_14-30-15.txt
```

---

## ⏰ AUTOMATIZÁCIA

### Cron Job (Denné zálohy o 2:00 ráno):
```bash
0 2 * * * /path/to/scripts/backup/cron-backup-wrapper.sh
```

### Nastavenie:
1. Spustite setup skript: `./scripts/backup/setup-automated-backups.sh`
2. Skript automaticky:
   - Vytvorí cron job
   - Nastaví wrapper skript
   - Nakonfiguruje logy
   - Otestuje systém

---

## 🔧 KONFIGURÁCIA

### Railway PostgreSQL:
```bash
RAILWAY_HOST="trolley.proxy.rlwy.net"
RAILWAY_USER="postgres"
RAILWAY_PORT="13400"
RAILWAY_DB="railway"
RAILWAY_PASSWORD="nfwrpKxILRUMqunYTZJEhjudEstqLRGv"
```

### R2 Storage:
```bash
R2_ENDPOINT="https://9ccdca0d876e24bd9acefabe56f94f53.r2.cloudflarestorage.com"
R2_BUCKET_NAME="blackrent-storage"
R2_ACCESS_KEY_ID="101b1b96332f7216f917c269f2ae1fc8"
R2_SECRET_ACCESS_KEY="5d03a6a396171324658c402b8758f5bae2364fe0bb7e5cc91d6ea8661c34cc69"
```

---

## 📊 MONITORING

### Kontrola stavu záloh:
```bash
./scripts/backup/backup-monitor.sh status
```

### Analýza logov:
```bash
./scripts/backup/backup-monitor.sh logs
```

### Kontrola veľkostí:
```bash
./scripts/backup/backup-monitor.sh sizes
```

### Kontrola integrity:
```bash
./scripts/backup/backup-monitor.sh integrity
```

### Kompletný monitoring:
```bash
./scripts/backup/backup-monitor.sh
```

---

## 🛠️ MANUÁLNE PRÍKAZY

### Databázové zálohy:
```bash
# Railway databáza
PGPASSWORD=nfwrpKxILRUMqunYTZJEhjudEstqLRGv pg_dump -h trolley.proxy.rlwy.net -U postgres -p 13400 -d railway > backup.sql

# Lokálna databáza
pg_dump -d blackrent > local-backup.sql
```

### R2 Storage zálohy:
```bash
# Zoznam súborov
./scripts/backup/r2-backup-sync.sh list-only

# Len stiahnutie súborov
./scripts/backup/r2-backup-sync.sh download-only

# Kompletný sync
./scripts/backup/r2-backup-sync.sh
```

---

## 🧹 ÚDRŽBA

### Automatické čistenie:
- Staré zálohy sa automaticky mažú po 7 dňoch
- Prázdne adresáre sa odstraňujú
- Log súbory sa rotujú

### Manuálne čistenie:
```bash
# Vymazanie záloh starších ako 3 dni
find backups/ -type f -mtime +3 -delete

# Vymazanie prázdnych adresárov
find backups/ -type d -empty -delete
```

---

## 🚨 RIEŠENIE PROBLÉMOV

### Chyba: "pg_dump: command not found"
```bash
# macOS
brew install postgresql

# Alebo pridajte do PATH
export PATH="/opt/homebrew/bin:$PATH"
```

### Chyba: "aws: command not found"
```bash
# Inštalácia AWS CLI pre R2
brew install awscli
```

### Chyba: "Permission denied"
```bash
# Nastavenie permissions
chmod +x scripts/backup/*.sh
```

### Chyba pripojenia k Railway:
```bash
# Test pripojenia
PGPASSWORD=nfwrpKxILRUMqunYTZJEhjudEstqLRGv psql -h trolley.proxy.rlwy.net -U postgres -p 13400 -d railway -c "SELECT version();"
```

---

## 📧 NOTIFIKÁCIE

### Email notifikácie (voliteľné):
1. Spustite setup: `./scripts/backup/setup-automated-backups.sh`
2. Vyberte "y" pre email notifikácie
3. Zadajte email adresu
4. Systém bude posielať notifikácie o stave záloh

---

## 📈 ŠTATISTIKY

### Typické veľkosti záloh:
- **Railway DB**: 5-50 MB (komprimované)
- **Lokálna DB**: 1-10 MB (komprimované)
- **Kritické súbory**: 1-5 MB
- **Protokoly/Dokumenty**: 10-100 MB
- **R2 Storage**: 50-500 MB

### Čas vykonania:
- **Databázové zálohy**: 30-120 sekúnd
- **Súborové zálohy**: 60-300 sekúnd
- **R2 sync**: 120-600 sekúnd
- **Celkový čas**: 3-15 minút

---

## 🔐 BEZPEČNOSŤ

### Ochrana citlivých údajov:
- Heslá sú v environment variables
- Zálohy sú lokálne (nie v cloude)
- Automatické mazanie starých záloh
- Kontrola integrity súborov

### Prístupové práva:
```bash
# Backup súbory - len owner
chmod 600 backups/**/*.sql.gz
chmod 600 backups/**/*.tar.gz

# Backup skripty - executable
chmod 755 scripts/backup/*.sh
```

---

## 📞 PODPORA

Pri problémech skontrolujte:
1. **Logy**: `backups/logs/`
2. **Monitoring**: `./scripts/backup/backup-monitor.sh`
3. **Cron status**: `crontab -l`
4. **Permissions**: `ls -la scripts/backup/`

---

## 🎉 ZÁVER

Tento backup systém poskytuje:
- ✅ **Automatické denné zálohy**
- ✅ **Kompletné pokrytie všetkých dát**
- ✅ **Monitoring a alerting**
- ✅ **Jednoduché obnovenie**
- ✅ **Automatické čistenie**
- ✅ **Bezpečné ukladanie**

**Odporúčanie**: Spustite setup raz týždenne pre kontrolu a aktualizáciu systému.
