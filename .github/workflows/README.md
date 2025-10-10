# GitHub Actions Workflows

## Známe Linter Warnings (False Positives)

Actionlint nástroj generuje warnings o "Context access might be invalid" pre všetky `secrets.*` premenné v workflow súboroch:

```
Line X: Context access might be invalid: RAILWAY_TOKEN, severity: warning
```

### Prečo sa tieto warnings objavujú?

Actionlint nemá prístup k GitHub repository secrets počas statickej analýzy kódu, preto nemôže overiť či secrets existujú alebo nie. To znamená že **vždy** vypíše warning pre každý prístup k `secrets` kontextu, aj keď sú secrets správne nakonfigurované.

###  Riešenie

Tieto warnings sú **OČAKÁVANÉ** a **MÔŽU BYŤ BEZPEČNE IGNOROVANÉ**. Všetky potrebné secrets sú správne nakonfigurované v GitHub repository settings a workflows fungujú bezchybne.

### Potrebné Secrets

#### daily-backup.yml
- `RAILWAY_TOKEN`
- `PGHOST`
- `PGUSER`
- `PGPORT`
- `PGDATABASE`
- `PGPASSWORD`
- `R2_ENDPOINT`
- `R2_BUCKET_NAME`
- `R2_ACCESS_KEY_ID`
- `R2_SECRET_ACCESS_KEY`

## Overenie Funkčnosti

Všetky workflow súbory boli testované a fungujú správne v GitHub Actions environment. Warnings sa objavujú len v lokálnom lintingu, nie v skutočnom vykonávaní workflows.


