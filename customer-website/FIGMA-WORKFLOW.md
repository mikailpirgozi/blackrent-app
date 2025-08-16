# 🎨 FIGMA → LOKÁLNE SÚBORY WORKFLOW

## 🚀 POSTUP PRE NOVÉ FIGMA KOMPONENTY

### **KROK 1: Export z Figmy**
1. Otvorte Figma design
2. Exportujte komponent cez **Anima plugin**
3. Stiahnite `.zip` súbor
4. Rozbaľte do `customer-website/src/components/anima/`

### **KROK 2: Automatická konverzia (NOVÝ!)**
```bash
# Jeden príkaz opraví všetko:
npm run fix-images
```

**Čo sa stane:**
- ✅ Automaticky stiahne všetky obrázky z Anima CDN
- ✅ Uloží ich do `public/figma-assets/`
- ✅ Nahradí všetky URL v kóde za lokálne cesty
- ✅ Validuje, že všetko funguje

### **KROK 3: Testovanie**
```bash
# Spustite server a otestujte
npm run dev
```

### **KROK 4: Commit**
```bash
# Uložte zmeny do Git
git add .
git commit -m "Add new Figma component with local assets"
```

## 🛡️ OCHRANA PRED PROBLÉMAMI

### **Automatické kontroly:**
- 🔍 **Pre-commit hook** - kontroluje externé URL
- 🔍 **Validácia** - overuje existenciu súborov
- 🔍 **Build test** - testuje pred deploymentom

### **Záložné riešenia:**
- 📦 **Automatické zálohy** - každý deň
- 🔄 **Git tracking** - všetky zmeny sledované
- 🛠️ **Recovery skripty** - obnovenie pri problémoch

## ❌ ČO UŽ NEMUSÍTE ROBIŤ

### **Staré problémy (VYRIEŠENÉ):**
- ❌ Manuálne sťahovanie obrázkov
- ❌ Ručné nahrádzanie URL
- ❌ Hľadanie chýbajúcich súborov
- ❌ Riešenie externých závislostí

### **Nový workflow je:**
- ✅ **Automatický** - jeden príkaz
- ✅ **Bezpečný** - žiadne externé závislosti
- ✅ **Rýchly** - okamžité výsledky
- ✅ **Spoľahlivý** - funguje vždy rovnako

## 🎯 PRÍKLAD POUŽITIA

```bash
# 1. Pridáte nový komponent z Figmy
# 2. Spustíte automatickú konverziu:
npm run fix-images

# Výstup:
# 🔄 Processing Anima export...
# ✅ Downloaded: new-icon.svg
# ✅ Downloaded: new-image.png
# ✅ Fixed 5 URLs in NewComponent.tsx
# 🎉 Processing completed!
# 📊 Total URLs processed: 5

# 3. Testujete:
npm run dev

# 4. Commitujete:
git add . && git commit -m "Add new component"
```

## 🚨 DÔLEŽITÉ PRAVIDLÁ

### **VŽDY:**
- ✅ Spustite `npm run fix-images` po pridaní Figma komponentu
- ✅ Testujte lokálne pred commitom
- ✅ Validujte assets: `npm run validate-assets`

### **NIKDY:**
- ❌ Nenechávajte Anima CDN URL v kóde
- ❌ Necommitujte bez testovania
- ❌ Nepoužívajte externé obrázky bez zálohy

## 🎉 VÝSLEDOK

**Máte teraz plne automatizovaný workflow pre Figma komponenty!**
- 🛡️ Žiadne externé závislosti
- ⚡ Rýchly vývoj
- 🔒 Bezpečné uloženie
- 🚀 Profesionálny prístup
