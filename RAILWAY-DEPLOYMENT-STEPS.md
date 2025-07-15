# 🚀 BlackRent - Railway Deployment Guide

## Opravy ktoré som urobil:

✅ **Backend package.json** - zmenený start script na `node src/index.js`
✅ **Railway.json** - health check path zmenený na `/health`
✅ **Backend aplikácia** - pridaná podpora pre static súbory
✅ **Dockerfile** - optimalizovaný pre Railway deployment
✅ **Frontend build** - úspešne vytvorený

## Nasadenie na Railway:

### 1. Prihláste sa do Railway
```bash
railway login
```

### 2. Pripojte projekt k existujúcemu Railway projektu
```bash
railway link
```
- Vyberte váš existujúci BlackRent projekt
- Alebo vytvorte nový: `railway init`

### 3. Nasadenie aplikácie
```bash
railway up
```

### 4. Skontrolujte deployment
```bash
railway status
```

## Alternatívne nasadenie:

Ak nechcete používať Railway CLI, môžete:

1. **GitHub Integration**: Pushvať do GitHub repository a pripojiť ho k Railway
2. **Direct Upload**: Uploadovať projekt priamo cez Railway dashboard

## Očakávané výsledky:

- ✅ Health check na `/health` bude fungovať
- ✅ Frontend bude dostupný na root URL
- ✅ API endpoints budú dostupné na `/api/*`
- ✅ SQLite databáza sa vytvorí automaticky

## Testovanie po nasadení:

```bash
# Testovanie health check
curl https://your-app.railway.app/health

# Testovanie API
curl https://your-app.railway.app/api/vehicles
```

## Riešenie problémov:

Ak stále vidíte healthcheck chyby:
1. Skontrolujte Railway logs: `railway logs`
2. Overte že port 5001 je správne nastavený
3. Skontrolujte či sa databáza správne vytvorila

## Dôležité poznámky:

- Databáza sa vytvorí automaticky pri prvom spustení
- Demo údaje sa nahrajú automaticky
- Aplikácia beží na porte 5001 (definovaný v railway.json)

Ak máte problémy, spustite: `railway logs` pre debugging informácie. 