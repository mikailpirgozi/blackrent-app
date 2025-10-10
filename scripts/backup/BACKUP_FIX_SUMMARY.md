# ✅ GitHub Actions Backup Fix - Summary

## 🐛 Problém

GitHub Actions workflow pre denný backup zlyhal s chybou:
```
error: unexpected argument '38dbf675-5b8e-489d-b1e0-e727883208ce' found
Usage: railway link [OPTIONS]
```

## 🔍 Príčina

Workflow používal nesprávny príkaz:
```bash
railway link 38dbf675-5b8e-489d-b1e0-e727883208ce
railway run node railway-cron-backup.js
```

Railway CLI vyžaduje interaktívne použitie alebo špeciálne flagy. V GitHub Actions to nefunguje.

## ✅ Riešenie

### 1. Odstránenie Railway CLI dependency
- Už nepotrebujeme inštalovať Railway CLI
- Backup script beží priamo cez Node.js s environment premennými

### 2. Pridanie Node.js setup
```yaml
- name: Setup Node.js
  uses: actions/setup-node@v4
  with:
    node-version: '20'
```

### 3. Priame spustenie backup scriptu
```yaml
- name: Run Railway Backup
  env:
    PGHOST: ${{ secrets.PGHOST }}
    PGUSER: ${{ secrets.PGUSER }}
    PGPORT: ${{ secrets.PGPORT }}
    PGDATABASE: ${{ secrets.PGDATABASE }}
    PGPASSWORD: ${{ secrets.PGPASSWORD }}
    R2_ENDPOINT: ${{ secrets.R2_ENDPOINT }}
    R2_BUCKET_NAME: ${{ secrets.R2_BUCKET_NAME }}
    R2_ACCESS_KEY_ID: ${{ secrets.R2_ACCESS_KEY_ID }}
    R2_SECRET_ACCESS_KEY: ${{ secrets.R2_SECRET_ACCESS_KEY }}
  run: |
    cd scripts/backup
    npm ci --production
    node railway-cron-backup.js
```

### 4. Pridanie error handling
```yaml
- name: Backup Status
  if: success()
  run: echo "✅ Daily backup completed successfully!"

- name: Backup Failed
  if: failure()
  run: echo "❌ Daily backup failed!"
```

## 📋 Ďalšie kroky

### MUSÍŠ nastaviť GitHub Secrets

V GitHub repository settings pridaj tieto secrets:

**Database:**
- `PGHOST` = `trolley.proxy.rlwy.net`
- `PGUSER` = `postgres`
- `PGPORT` = `13400`
- `PGDATABASE` = `railway`
- `PGPASSWORD` = `nfwrpKxILRUMqunYTZJEhjudEstqLRGv`

**R2 Storage:**
- `R2_ENDPOINT` = `https://<account-id>.r2.cloudflarestorage.com`
- `R2_BUCKET_NAME` = `blackrent-storage`
- `R2_ACCESS_KEY_ID` = `<tvoj-key>`
- `R2_SECRET_ACCESS_KEY` = `<tvoj-secret>`

Detaily v: `scripts/backup/GITHUB_SECRETS_SETUP.md`

## 🧪 Testovanie

### Manuálne spustenie v GitHub Actions
1. Choď do **Actions** tab
2. Vyber **Daily Railway Backup**
3. Klikni **Run workflow**
4. Sleduj output

### Lokálne testovanie
```bash
cd scripts/backup
npm install
node railway-cron-backup.js
```

## ⏰ Automatické spustenie

Backup sa spustí automaticky každý deň o **2:00 UTC** (3:00 CET).

## 📁 Zmenené súbory

- ✅ `.github/workflows/daily-backup.yml` - opravený workflow
- ✅ `scripts/backup/GITHUB_SECRETS_SETUP.md` - nová dokumentácia
- ✅ `scripts/backup/BACKUP_FIX_SUMMARY.md` - tento súbor

## ✨ Výsledok

Po nastavení GitHub Secrets bude backup fungovať:
- ✅ Žiadne Railway CLI errors
- ✅ Direct Node.js execution
- ✅ Všetky credentials z GitHub Secrets
- ✅ Proper error handling
- ✅ Denné automatické spustenie o 2:00 UTC


