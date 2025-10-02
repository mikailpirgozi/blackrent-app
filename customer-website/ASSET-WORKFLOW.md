# 🎨 ASSET WORKFLOW - BlackRent Customer Website

## 📋 PRAVIDLÁ PRE OBRÁZKY A IKONY

### ❌ NIKDY NEROBTE:
- Nepoužívajte Anima CDN URL (`https://c.animaapp.com/...`)
- Nepoužívajte externé CDN bez backup plánu
- Nevkladajte obrázky priamo do `src/` priečinka

### ✅ VŽDY ROBTE:
- Všetky obrázky uložte do `public/` priečinka
- Používajte lokálne cesty (`/figma-assets/...`)
- Optimalizujte obrázky (WebP formát)

## 🔄 WORKFLOW PRE NOVÉ OBRÁZKY:

### 1. Export z Figmy:
```bash
# Stiahnite obrázky z Figmy
# Uložte do správneho priečinka:
public/
├── figma-assets/    # Figma exporty
├── brands/         # Logá
├── images/         # Fotografie
└── icons/          # Ikony
```

### 2. Optimalizácia:
```bash
# Spustite optimalizáciu
npm run images:optimize
```

### 3. Použitie v kóde:
```tsx
// ✅ SPRÁVNE
<img src="/figma-assets/icon.svg" alt="Icon" />
<img src="/brands/blackrent-logo.svg" alt="BlackRent" />
<img src="/images/vehicle.webp" alt="Vehicle" />

// ❌ NESPRÁVNE
<img src="https://c.animaapp.com/..." alt="Icon" />
```

## 🚀 DEPLOYMENT:

### Lokálny vývoj:
- Všetky súbory sú v `public/`
- Server: `npm run dev`
- URL: `http://localhost:3002`

### Production (Vercel):
- Automaticky deployuje `public/` súbory
- CDN optimalizácia
- Všetky cesty fungujú rovnako

### Railway (Backend):
- Nepotrebuje frontend assets
- Len API endpointy

## 🛡️ OCHRANA PRED PROBLÉMAMI:

### 1. Git hooks:
- Pre-commit kontrola externých URL
- Automatická validácia assets

### 2. Build proces:
- Kontrola chýbajúcich súborov
- Optimalizácia obrázkov

### 3. Monitoring:
- Kontrola 404 errors na obrázky
- Performance monitoring

## 📝 CHECKLIST PRE NOVÉ STRÁNKY:

- [ ] Všetky obrázky sú v `public/`
- [ ] Žiadne externé CDN URL
- [ ] Optimalizované formáty (WebP)
- [ ] Správne alt texty
- [ ] Responsive obrázky
- [ ] Testované lokálne
- [ ] Testované na production

## 🔧 UŽITOČNÉ PRÍKAZY:

```bash
# Optimalizácia obrázkov
npm run images:optimize

# Kontrola chýbajúcich assets
npm run validate-assets

# Build test
npm run build

# Lokálny server
npm run dev
```
