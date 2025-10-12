# R2 CLI Setup & Usage

## ✅ Konfigurácia

### R2 Credentials (Railway)
```bash
R2_ACCESS_KEY_ID: 101b1b96332f7216f917c269f2ae1fc8
R2_SECRET_ACCESS_KEY: 5d03a6a396171324658c402b8758f5bae2364fe0bb7e5cc91d6ea8661c34cc69
R2_BUCKET_NAME: blackrent-storage
R2_ENDPOINT: https://9ccdca0d876e24bd9acefabe56f94f53.r2.cloudflarestorage.com
R2_ACCOUNT_ID: 9ccdca0d876e24bd9acefabe56f94f53
```

### AWS CLI Profile
R2 je nakonfigurované cez AWS CLI profile `r2`:
```bash
aws configure list --profile r2
```

---

## 🚀 Quick Start

### Pomocou Helper Scriptu (Odporúčané)
```bash
# Zobraziť help
./scripts/r2-cli.sh help

# Listovať obsah bucketu
./scripts/r2-cli.sh ls protocols/

# Zobraziť všetky súbory
./scripts/r2-cli.sh tree

# Upload súboru
./scripts/r2-cli.sh upload ./file.pdf documents/file.pdf

# Download súboru
./scripts/r2-cli.sh download protocols/abc.pdf ./download.pdf

# Sync adresára
./scripts/r2-cli.sh sync ./local-dir/ documents/backup/

# Delete súboru
./scripts/r2-cli.sh delete test/old-file.pdf

# Vygenerovať presigned URL (platnosť 1 hodina)
./scripts/r2-cli.sh presign documents/report.pdf 3600

# Info o buckete
./scripts/r2-cli.sh info
```

---

## 📋 Priame AWS CLI príkazy

### List Files
```bash
aws s3 ls s3://blackrent-storage/protocols/ \
  --profile r2 \
  --endpoint-url https://9ccdca0d876e24bd9acefabe56f94f53.r2.cloudflarestorage.com
```

### Upload File
```bash
aws s3 cp ./local-file.pdf s3://blackrent-storage/documents/file.pdf \
  --profile r2 \
  --endpoint-url https://9ccdca0d876e24bd9acefabe56f94f53.r2.cloudflarestorage.com
```

### Download File
```bash
aws s3 cp s3://blackrent-storage/documents/file.pdf ./local-file.pdf \
  --profile r2 \
  --endpoint-url https://9ccdca0d876e24bd9acefabe56f94f53.r2.cloudflarestorage.com
```

### Sync Directory
```bash
aws s3 sync ./local-dir/ s3://blackrent-storage/backup/ \
  --profile r2 \
  --endpoint-url https://9ccdca0d876e24bd9acefabe56f94f53.r2.cloudflarestorage.com
```

### Delete File
```bash
aws s3 rm s3://blackrent-storage/test/file.pdf \
  --profile r2 \
  --endpoint-url https://9ccdca0d876e24bd9acefabe56f94f53.r2.cloudflarestorage.com
```

### Recursive Delete (dangerous!)
```bash
aws s3 rm s3://blackrent-storage/test/ --recursive \
  --profile r2 \
  --endpoint-url https://9ccdca0d876e24bd9acefabe56f94f53.r2.cloudflarestorage.com
```

### Presigned URL (temporary access)
```bash
# Platnosť 1 hodina (3600s)
aws s3 presign s3://blackrent-storage/documents/report.pdf \
  --profile r2 \
  --endpoint-url https://9ccdca0d876e24bd9acefabe56f94f53.r2.cloudflarestorage.com \
  --expires-in 3600
```

---

## 📁 Bucket Structure

```
blackrent-storage/
├── 2025/                    # Yearly organization
├── 2026/
├── backups/                 # Database backups
├── blackrent-storage/       # Legacy storage
├── documents/               # Document uploads
├── protocols/
│   ├── damage/             # Damage reports
│   ├── damage_pdf/         # Damage PDFs
│   ├── document/           # Protocol documents
│   ├── fuel/               # Fuel records
│   ├── handover/           # Handover protocols
│   ├── odometer/           # Odometer readings
│   ├── return/             # Return protocols
│   ├── vehicle/            # Vehicle data
│   └── vehicle_pdf/        # Vehicle PDFs
├── test/                    # Test files
└── vehicles/                # Vehicle images
```

---

## 📊 Bucket Stats

```bash
Total Objects: 5,520
Total Size: 10.6 GB
```

---

## 🔗 Public URL

Súbory sú dostupné cez public URL:
```
https://pub-4fec120a8a6a4a0cbadfa55f54b7e8a2.r2.dev/[path]
```

Príklad:
```
https://pub-4fec120a8a6a4a0cbadfa55f54b7e8a2.r2.dev/protocols/handover/2025/file.pdf
```

---

## 🛠️ Troubleshooting

### Access Denied
Ak dostaneš `Access Denied`, over:
1. Správnosť credentials v AWS CLI profile
2. Používaš správny endpoint URL
3. Bucket path existuje

### Slow Uploads/Downloads
R2 je globálne distribuované, ale Cloudflare má best performance v EU.

### Public Access
Pre verejný prístup k súborom musí byť nastavené:
1. R2 bucket má public URL domain
2. Súbory musia mať správne ACL (default je private)

---

## 🔐 Security Notes

1. **Never commit credentials** - sú už v Railway env vars
2. **Presigned URLs** - používaj pre temporary access
3. **Bucket policies** - nastav v Cloudflare dashboard
4. **Access logs** - enable v Cloudflare pre audit trail

---

## 📚 Ďalšie Zdroje

- [Cloudflare R2 Docs](https://developers.cloudflare.com/r2/)
- [AWS S3 CLI Reference](https://docs.aws.amazon.com/cli/latest/reference/s3/)
- [R2 S3 Compatibility](https://developers.cloudflare.com/r2/api/s3/api/)

