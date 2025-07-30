# 🔧 Development Workflow

## Riešenie problémov s persistenciou a stratou zmien

### Problém
- Zmeny sa strácajú po reštarte
- Lokálny vývoj vs. Railway produkcia
- Neautomatické nasadenie

### Riešenie

## 1. 🔄 Jednotný Workflow

### Lokálny vývoj
```bash
# Spustite backend
cd backend
npm run dev

# Spustite frontend (nový terminál)
npm start
```

### Synchronizácia s produkciou
```bash
# Po každej zmene spustite:
./sync-railway.sh

# Alebo manuálne:
cp -r src/ railway-blackrent/src/
```

## 2. 📋 Denný workflow

### Začiatok práce
```bash
# 1. Stiahnite najnovšie zmeny
git pull origin main

# 2. Spustite lokálny vývoj
npm start
```

### Počas vývoja
```bash
# 1. Robte zmeny v src/
# 2. Testujte lokálne
# 3. Synchronizujte s Railway
./sync-railway.sh
```

### Koniec práce
```bash
# 1. Commitnite zmeny
git add .
git commit -m "Popis zmien"

# 2. Push do GitHub
git push origin main

# 3. Automatické nasadenie cez GitHub Actions
```

## 3. 🚀 Automatizované nasadenie

### Nastavenie (jednorazovo)
1. Postupujte podľa `AUTO-DEPLOY-SETUP.md`
2. Nastavte GitHub Actions
3. Každý push automaticky nasadí zmeny

### Výhody
- ✅ Žiadne manuálne nasadenie
- ✅ Vždy aktuálna produkcia
- ✅ História všetkých zmien
- ✅ Možnosť rollback

## 4. 🔍 Diagnostika problémov

### Zmeny sa stratili
```bash
# Synchronizujte znovu
./sync-railway.sh

# Commitnite do Git
git add .
git commit -m "Synchronizácia zmien"
git push origin main
```

### Aplikácia nefunguje po reštarte
```bash
# Spustite lokálny development server
npm start

# Skontrolujte Railway produkciu
railway logs
```

### Chyby pri nasadení
```bash
# Pozrite GitHub Actions logy
# GitHub → Actions tab

# Pozrite Railway logy
railway logs
```

## 5. 📁 Štruktúra projektu

```
blackrent-new/
├── src/                    # 🔧 Lokálny vývoj (tu robíte zmeny)
├── railway-blackrent/      # 🚀 Railway produkcia (kopíruje sa)
├── backend/               # 🔧 Backend vývoj
├── .github/workflows/     # 🤖 GitHub Actions
├── sync-railway.sh        # 🔄 Synchronizácia script
└── package.json          # 📦 Dependencies
```

## 6. 🎯 Best Practices

### Vždy
- ✅ Robte zmeny v `src/`
- ✅ Testujte lokálne
- ✅ Synchronizujte s Railway
- ✅ Commitujte do Git

### Nikdy
- ❌ Nemeňte súbory v `railway-blackrent/` manuálne
- ❌ Nezabudnite na commit + push
- ❌ Nerobte zmeny priamo na Railway

### Zálohovanie
```bash
# Pravidelne zálohujte databázu
cd backend
node backup.js

# Commitujte zálohy
git add backups/
git commit -m "Database backup"
```

## 7. 🆘 Núdzové postupy

### Stratili sa všetky zmeny
```bash
# Obnovte z najnovšieho commit
git reset --hard HEAD

# Alebo z konkrétneho commit
git reset --hard COMMIT_HASH
```

### Aplikácia nefunguje na produkcii
```bash
# Pozrite Railway logy
railway logs

# Rollback na predchádzajúce nasadenie
# Railway Dashboard → Deployments → Rollback
```

### Databáza sa vymazala
```bash
# Obnovte z backup
cd backend
node restore.js backups/najnovsia-zaloha.db
```

## 8. 💡 Tipy pre efektívny vývoj

### Rýchle testovanie
```bash
# Lokálne testovanie
npm start

# Produkčné testovanie
./sync-railway.sh
```

### Rýchle nasadenie
```bash
# Automatické (odporúčané)
git add . && git commit -m "Quick fix" && git push

# Manuálne (núdzové)
cd railway-blackrent && railway up
```

### Debugging
```bash
# Lokálne logy
npm start

# Produkčné logy
railway logs

# GitHub Actions logy
# GitHub → Actions tab
```

---

## 🎉 Výsledok

Po nastavení tohto workflow:
- 🔄 Automatická synchronizácia
- 🚀 Automatické nasadenie
- 💾 Žiadna strata zmien
- 📱 Vždy aktuálna aplikácia
- 🔍 Jednoduché debugovanie

**Nikdy viac strácanie zmien!** 🎯 