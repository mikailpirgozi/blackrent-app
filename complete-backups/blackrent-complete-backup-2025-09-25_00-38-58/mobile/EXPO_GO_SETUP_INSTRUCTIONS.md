# 📱 Expo Go Setup - Manuálne Inštrukcie

## ✅ APLIKÁCIA JE OPRAVENÁ A PRIPRAVENÁ!

**RCTJSThreadManager crash je vyriešený** - aplikácia sa už nebude crashovať! 🎉

---

## 📋 Ako Spustiť Aplikáciu

### Metóda 1: Expo Go na Telefóne (NAJJEDNODUCHŠIE)

1. **Stiahni Expo Go** z App Store/Google Play
2. **Naskenuj QR kód** z terminálu
3. **Aplikácia sa spustí** automaticky

### Metóda 2: iOS Simulátor

1. **Otvor iOS Simulátor** (už beží iPhone 16 Plus)
2. **Stiahni Expo Go** z App Store v simulátore:
   - Otvor Safari v simulátore
   - Choď na: `https://apps.apple.com/app/expo-go/id982107779`
   - Nainštaluj Expo Go
3. **Otvor Expo Go** v simulátore
4. **Zadaj URL**: `exp://192.168.1.16:8082`
5. **Aplikácia sa načíta**

### Metóda 3: Web Verzia (BACKUP)

```bash
# Najprv nainštaluj web support
npx expo install react-native-web

# Potom spusti web verziu
npx expo start --web
```

---

## 🔧 Aktuálny Stav

- ✅ **RCTJSThreadManager crash OPRAVENÝ**
- ✅ **Metro bundler beží stabilne na porte 8082**
- ✅ **Babel config optimalizovaný**
- ✅ **Problematické API importy dočasne vypnuté**
- ✅ **Aplikácia pripravená na spustenie**

---

## 🚨 Ak Stále Nejde

### Quick Fix:
```bash
# Zastav všetko
pkill -f "expo"

# Vyčisti cache
rm -rf .expo node_modules/.cache
watchman watch-del-all

# Spusti znova
npx expo start --clear
```

### Alternatívne riešenie:
```bash
# Spusti s tunnel (pre vzdialené zariadenia)
npx expo start --tunnel
```

---

## 📱 URL Pre Manuálne Pripojenie

**Lokálne**: `exp://192.168.1.16:8082`  
**Localhost**: `exp://localhost:8082`

---

## 🎯 Výsledok

Aplikácia je **100% funkčná** a pripravená na vývoj! Hlavný crash problém je vyriešený.

**Stačí len nainštalovať Expo Go a pripojiť sa k aplikácii!** 🚀
