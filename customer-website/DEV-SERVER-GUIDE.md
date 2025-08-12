# BlackRent Customer Website - Dev Server Guide

## 🚀 Stabilné spúšťanie localhost servera

### Rýchle príkazy:

```bash
# Spustiť dev server (stabilne)
npm run dev:stable

# Zastaviť dev server
npm run dev:stop

# Obyčajné spustenie
npm run dev

# Spustenie s čistením cache
npm run dev:clean
```

### 🔧 Riešenie problémov:

1. **Port 3002 je obsadený:**
   ```bash
   npm run dev:stop
   npm run dev:stable
   ```

2. **Cache problémy:**
   ```bash
   rm -rf .next
   npm run dev
   ```

3. **Kompletné vyčistenie:**
   ```bash
   npm run dev:stop
   rm -rf .next node_modules/.cache
   npm install
   npm run dev:stable
   ```

### 📍 Správne adresáre:

- **VŽDY** spúšťaj z `customer-website/` adresára
- **NIKDY** nespúšťaj z root adresára `Blackrent Beta 2/`

### ✅ Overenie funkčnosti:

```bash
curl http://localhost:3002
# Alebo otvor v prehliadači: http://localhost:3002
```

### 🌐 Alternatíva - Vercel URL:

Ak localhost nefunguje, použij production URL:
https://customer-website-rouge.vercel.app/

---

**Poznámka:** Vercel sa automaticky updatuje pri každom push na GitHub!
