# 🛡️ Prevencia problémov s Next.js serverom

## 📋 Problém ktorý bol vyriešený

**MODULE_NOT_FOUND errors** spôsobené komplexnými SVG filtrami v React komponentoch. Server sa spúšťal, ale crashol pri načítaní stránky s chybami typu `Cannot find module './819.js'`.

## 🔧 Implementované riešenia

### 1. **SVG Validátor** 
```bash
npm run validate-svg
```
- Kontroluje komplexné SVG filtre
- Blokuje problémové `<filter>`, `<foreignObject>`, `<clipPath>` elementy
- Limituje počet filter elementov (max 3)

### 2. **Bezpečné spúšťanie servera**
```bash
npm run dev:safe      # Úplná validácia + čistý štart
npm run dev:clean     # Len vyčistí cache + štart
```

### 3. **Build checky**
```bash
npm run health-check  # Kompletná kontrola zdravia
npm run pre-check     # SVG + lint + types
```

### 4. **Monitoring (voliteľný)**
```bash
node scripts/health-monitor.js
```
- Sleduje server každých 30 sekúnd
- Automaticky reštartuje pri problémoch
- Čistí cache pri crashoch

## ⚠️ Pravidlá pre SVG komponenty

### ❌ ZAKÁZANÉ (spôsobujú crashe):
```tsx
// Komplexné filtre
<filter id="complex">
  <feFlood floodOpacity="0"/>
  <feColorMatrix in="SourceAlpha" type="matrix" values="..."/>
  <feOffset dy="4"/>
  <feGaussianBlur stdDeviation="4"/>
  <feComposite in2="hardAlpha" operator="arithmetic"/>
  // ... 20+ riadkov filtrov
</filter>

// foreignObject elementy
<foreignObject>
  <div xmlns="http://www.w3.org/1999/xhtml">...</div>
</foreignObject>

// Komplexné clipPath
<clipPath id="complex">
  <path d="M0 0L100 0L100 100L0 100Z"/>
</clipPath>
```

### ✅ POVOLENÉ (bezpečné):
```tsx
// Jednoduché tvary
<circle cx="30" cy="30" r="15" fill="url(#gradient)" />
<rect x="0" y="0" width="100" height="50" fill="#fff" />

// Jednoduché gradienty
<linearGradient id="gradient">
  <stop offset="0%" stopColor="#fff" />
  <stop offset="100%" stopColor="#000" />
</linearGradient>

// Maximum 2 jednoduché filtre
<filter id="simple">
  <feGaussianBlur stdDeviation="2"/>
</filter>
```

## 🚀 Workflow pre nové komponenty

1. **Pred pridaním SVG komponenty:**
   ```bash
   npm run validate-svg
   ```

2. **Pred commitom:**
   ```bash
   npm run health-check
   ```

3. **Spúšťanie servera:**
   ```bash
   npm run dev:safe  # Prvý štart dňa
   npm run dev       # Bežné spúšťanie
   ```

## 🆘 Ak sa problém vráti

1. **Okamžité riešenie:**
   ```bash
   pkill -f "next dev"
   rm -rf .next
   npm run validate-svg
   npm run dev
   ```

2. **Identifikácia problému:**
   ```bash
   npm run validate-svg  # Ukáže problémové súbory
   ```

3. **Monitoring problémov:**
   ```bash
   node scripts/health-monitor.js &  # Spustí na pozadí
   ```

## 📊 Automatické kontroly

Validátor kontroluje:
- ✅ Max 2 komplexné filtre na súbor
- ✅ Max 3 filter elementy (`<fe*>`)
- ✅ Žiadne `foreignObject` elementy  
- ✅ Max 5 gradient stops
- ✅ Žiadne problémové `clipPath`

## 💡 Tipy

- **Vždy** používajte `npm run dev:safe` po dlhšej prestávke
- **Nikdy** nekopírujte SVG z Figmy bez úprav
- **Pravidelne** spúšťajte `npm run health-check`
- **Pri chybách** najprv `npm run validate-svg`

---

**Tento systém zabráni opakovaniu MODULE_NOT_FOUND problémov!** 🎉
