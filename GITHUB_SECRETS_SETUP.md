# 🔐 GitHub Secrets Setup pre Database Backup

## Potrebné secrets v GitHub repository

Choď na GitHub → Settings → Secrets and variables → Actions → New repository secret

### 1. R2_ENDPOINT
```
Názov: R2_ENDPOINT
Hodnota: https://[account-id].r2.cloudflarestorage.com
```

### 2. R2_ACCESS_KEY_ID
```
Názov: R2_ACCESS_KEY_ID
Hodnota: [tvoj R2 access key]
```

### 3. R2_SECRET_ACCESS_KEY
```
Názov: R2_SECRET_ACCESS_KEY
Hodnota: [tvoj R2 secret key]
```

**Ako získať R2 credentials:**
1. Choď na Cloudflare Dashboard → R2 Object Storage
2. Manage R2 API tokens
3. Create API token
4. Permissions: Object Read and Write
5. Skopíruj Access Key ID a Secret Access Key

## ✅ Overenie nastavenia

Po nastavení secrets:

1. Choď na GitHub → Actions → Daily Railway Backup
2. Klikni "Run workflow" pre manuálne testovanie
3. Skontroluj logy či backup prebehol úspešne

## 📅 Automatické spúšťanie

Backup sa spúšťa automaticky každý deň o 2:00 UTC (3:00 CET).
