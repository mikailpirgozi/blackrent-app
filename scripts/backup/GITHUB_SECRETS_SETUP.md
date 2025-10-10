# 🔐 GitHub Secrets Setup pre Automated Backup

## Potrebné Secrets

Pre správne fungovanie automatických denných záloh musíš nastaviť tieto GitHub Secrets v repository settings:

### Railway Database Credentials
```
PGHOST=trolley.proxy.rlwy.net
PGUSER=postgres
PGPORT=13400
PGDATABASE=railway
PGPASSWORD=nfwrpKxILRUMqunYTZJEhjudEstqLRGv
```

### Cloudflare R2 Storage Credentials
```
R2_ENDPOINT=https://<account-id>.r2.cloudflarestorage.com
R2_BUCKET_NAME=blackrent-storage
R2_ACCESS_KEY_ID=<tvoj-r2-access-key>
R2_SECRET_ACCESS_KEY=<tvoj-r2-secret-key>
```

### Railway Token (voliteľné - zatiaľ nepoužívané)
```
RAILWAY_TOKEN=<tvoj-railway-token>
```

## Ako nastaviť GitHub Secrets

1. Otvor repository na GitHub
2. Choď do **Settings** → **Secrets and variables** → **Actions**
3. Klikni na **New repository secret**
4. Pridaj každý secret osobne:
   - Name: `PGHOST`
   - Value: `trolley.proxy.rlwy.net`
   - Klikni **Add secret**
5. Opakuj pre všetky ostatné secrets

## Testovanie Backupu

### Manuálne spustenie
Môžeš spustiť backup manuálne bez čakania na cron:

1. Choď do **Actions** v GitHub repository
2. Vyber workflow **Daily Railway Backup**
3. Klikni **Run workflow** → **Run workflow**
4. Sleduj výstup v reálnom čase

### Automatické spustenie
Backup sa spustí automaticky každý deň o **2:00 UTC** (3:00 CET).

## Čo backup robí

1. ✅ Načíta všetky tabuľky z Railway PostgreSQL databázy
2. ✅ Vytvorí SQL dump so štruktúrou tabuliek
3. ✅ Skomprimuje zálohu pomocou gzip
4. ✅ Nahrá zálohu do Cloudflare R2 Storage
5. ✅ Vyčistí staré zálohy (ponechá 7 najnovších)
6. ✅ Zapíše logy o priebehu

## Riešenie problémov

### Backup zlyhá
- Skontroluj či sú všetky secrets správne nastavené
- Ovér že Railway databáza je dostupná
- Skontroluj R2 credentials

### R2 upload zlyhá
- Backup sa lokálne vytvorí aj tak
- Skontroluj R2 endpoint URL a credentials
- Ovér že bucket `blackrent-storage` existuje

## Lokálne testovanie

Pred pushom na GitHub môžeš otestovať lokálne:

```bash
cd scripts/backup
npm install
node railway-cron-backup.js
```

Uisti sa že máš environment premenné nastavené v `.env` alebo ich exportuj:

```bash
export PGHOST=trolley.proxy.rlwy.net
export PGUSER=postgres
export PGPORT=13400
export PGDATABASE=railway
export PGPASSWORD=nfwrpKxILRUMqunYTZJEhjudEstqLRGv
# ... atď
```


