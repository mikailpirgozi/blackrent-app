# R2 CLI Quick Reference

## 🚀 Fastest Way to Use R2

```bash
# From project root
./scripts/r2-cli.sh [command]
```

---

## 📋 Common Commands

### View Files
```bash
# List root
./scripts/r2-cli.sh ls

# List specific folder
./scripts/r2-cli.sh ls protocols/handover/

# Show all files (tree view)
./scripts/r2-cli.sh tree
```

### Upload & Download
```bash
# Upload file
./scripts/r2-cli.sh upload ./myfile.pdf documents/myfile.pdf

# Download file
./scripts/r2-cli.sh download protocols/handover/2025-10-12/abc.pdf ./abc.pdf
```

### Temporary URL (for sharing)
```bash
# Generate URL valid for 1 hour
./scripts/r2-cli.sh presign documents/report.pdf 3600

# Generate URL valid for 24 hours
./scripts/r2-cli.sh presign documents/report.pdf 86400
```

### Bucket Info
```bash
# Show stats
./scripts/r2-cli.sh info
```

---

## 🎯 Use Cases

### Backup Database Dump
```bash
pg_dump $DATABASE_URL | gzip > backup.sql.gz
./scripts/r2-cli.sh upload backup.sql.gz backups/$(date +%Y-%m-%d).sql.gz
```

### Download Latest Protocol
```bash
# Find latest
./scripts/r2-cli.sh ls protocols/handover/ | tail -1

# Download specific
./scripts/r2-cli.sh download protocols/handover/2025-10-12/protocol.pdf ./protocol.pdf
```

### Share Document Temporarily
```bash
# Generate 2-hour temporary link
./scripts/r2-cli.sh presign documents/contract.pdf 7200

# Share the URL with client
```

### Sync Local Folder to R2
```bash
./scripts/r2-cli.sh sync ./exports/ backups/exports-$(date +%Y%m%d)/
```

---

## 📁 Bucket Structure Reference

```
blackrent-storage/
├── protocols/
│   ├── handover/         # Handover protocols by date
│   ├── return/           # Return protocols
│   ├── damage/           # Damage reports
│   └── fuel/             # Fuel records
├── documents/            # General documents
├── vehicles/             # Vehicle images
├── backups/              # Database backups
└── test/                 # Test files
```

---

## 🔗 Public URLs

Files are accessible via:
```
https://pub-4fec120a8a6a4a0cbadfa55f54b7e8a2.r2.dev/[path]
```

---

## ⚡ Optional: Shell Aliases

Add to `~/.zshrc`:
```bash
source "/Users/mikailpirgozi/Desktop/Aplikacie Cursor/Blackrent Beta 2/.r2rc"
```

Then use shortcuts:
```bash
r2ls                      # List bucket
r2protocols               # List protocols
r2upload file.pdf docs/   # Quick upload
r2download path/file.pdf  # Quick download
r2url path/file.pdf       # Generate presigned URL
```

---

## 📚 Full Documentation

See: [docs/R2_CLI_SETUP.md](../docs/R2_CLI_SETUP.md)

