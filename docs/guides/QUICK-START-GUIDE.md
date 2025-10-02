# 🚀 BlackRent - Rýchly štart

## ⚡ **Jednoduché spustenie (odporúčané)**

```bash
# Spustenie celej aplikácie
npm run dev:full

# Ukončenie aplikácie  
npm run dev:stop

# Reštart aplikácie
npm run dev:restart

# Kontrola stavu
npm run dev:status
```

## 🔧 **Manuálne spustenie**

Ak preferujete manuálne spúšťanie:

```bash
# Terminal 1 - Backend
cd backend
npm run dev

# Terminal 2 - Frontend (počkajte kým backend dokončí migrácie)
npm start
```

## 📊 **Prihlasovacie údaje**

- **Username:** `admin`
- **Password:** `Black123`

## 🌐 **URL adresy**

- **Frontend:** http://localhost:3000
- **Backend API:** http://localhost:3001

## ❗ **Riešenie problémov**

### Aplikácia nenačíta dáta
```bash
npm run dev:restart
```

### Port je obsadený
```bash
npm run dev:stop
sleep 5
npm run dev:full
```

### Migrácie trvajú dlho
Backend spúšťa databázové migrácie pri každom štarte. To je normálne a trvá 30-60 sekúnd.

## 🔍 **Prečo sa problémy vyskytujú?**

1. **Databázové migrácie** - Backend kontroluje a aktualizuje databázu pri každom štarte
2. **Nesprávne poradie** - Frontend sa niekdy spustí skôr ako backend dokončí inicializáciu  
3. **Viaceré procesy** - Ak sa aplikácia nespustí správne, môžu zostať "zombie" procesy
4. **Port konflikty** - Porty 3000/3001 môžu byť obsadené inými aplikáciami

## ✅ **Preventívne opatrenia**

- Vždy používajte `npm run dev:full` namiesto manuálneho spúšťania
- Pred spustením ukončite predchádzajúce procesy pomocou `npm run dev:stop`
- Nechajte backend dokončiť migrácie pred použitím aplikácie
- Pri problémoch používajte `npm run dev:restart`

## 📋 **Sledovanie logov**

```bash
# Backend logy
tail -f logs/backend.log

# Frontend logy  
tail -f logs/frontend.log

# Oba súčasne
tail -f logs/backend.log logs/frontend.log
``` 