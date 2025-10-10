# 🔄 Frontend Hard Refresh - Potrebné kroky

## ⚠️ Problém: Frontend používa CACHED starú verziu

Backend je reštartovaný s novou verziou, ale **frontend má stále cached starú verziu JavaScriptu** ktorá volá staré (chybné) API queries.

---

## ✅ RIEŠENIE - Hard Refresh Frontendu

### **Option 1: Hard Refresh v prehliadači** ⚡ (ODPORÚČAM)

#### **Chrome/Edge:**
```
Ctrl + Shift + R  (Windows/Linux)
Cmd + Shift + R   (Mac)
```

#### **Firefox:**
```
Ctrl + F5         (Windows/Linux)
Cmd + Shift + R   (Mac)
```

#### **Safari:**
```
Cmd + Option + R
```

**Alebo:**
1. Otvor **Developer Tools** (F12)
2. **Klikni pravým** na refresh button 🔄
3. Vyber **"Empty Cache and Hard Reload"**

---

### **Option 2: Vymaž cache manuálne** 🧹

#### **Chrome:**
1. Otvor DevTools (F12)
2. Prejdi na **Application** tab
3. **Storage** → **Clear site data**
4. Refresh stránku (F5)

#### **Firefox:**
1. Otvor DevTools (F12)
2. **Storage** tab
3. Pravý klik na **Cache Storage** → **Clear All**
4. Refresh (F5)

---

### **Option 3: Reštartuj Vite Dev Server** 🔄

```bash
# V terminály kde beží frontend (apps/web):
# Zastav server: Ctrl+C

# Vymaž Vite cache:
rm -rf node_modules/.vite
rm -rf dist

# Reštartuj:
npm run dev
```

---

### **Option 4: Inkognito/Private Window** 🕵️

1. Otvor **nové Inkognito/Private okno**
2. Prihlás sa znovu
3. Skús Platform Management

Toto ti povie či je problém v cache alebo nie.

---

## 🧪 Ako overiť že máš NOVÚ verziu?

### **1. Skontroluj Network tab:**
```
1. Otvor DevTools (F12)
2. Prejdi na Network tab
3. Refresh stránku (Ctrl+R)
4. Hľadaj: index-Cn8SwfjO.js alebo podobný
5. Mal by mať nový hash (napr. index-ABC123XY.js)
```

### **2. Skontroluj či backend dostáva requesty:**
```bash
# V terminály:
cd backend
tail -f backend.log | grep "platforms"
```

Potom v browseri otvor Platform Management a mali by sa zobraziť requesty v logu.

---

## 🎯 Čo by sa malo stať po refresh:

### ✅ **Správne chovanie:**
1. Platform Management sa otvorí
2. Platform cards sa načítajú
3. **Štatistiky sa zobrazia:**
   ```
   🏢 BlackRent Platform
   ├─ Firmy:     X
   ├─ Users:     Y
   ├─ Vozidlá:   Z
   └─ Prenájmy:  W
   ```
4. **Žiadne errory v console!**

### ❌ **Ak stále vidíš error:**
```
API chyba: Error: Chyba pri získavaní štatistík platformy
```

Znamená to že:
1. Frontend stále používa starú cache ➜ **Skús Inkognito**
2. Backend má problém s SQL ➜ **Pošli backend log**
3. Network issue ➜ **Skontroluj Network tab v DevTools**

---

## 🔍 Debug Checklist

Ak Hard Refresh nefunguje, skontroluj:

- [ ] Backend beží? `lsof -i:3001`
- [ ] Frontend beží? `lsof -i:3000`
- [ ] Network tab - API volá správny endpoint?
- [ ] Console tab - aké presné errory?
- [ ] Backend log - dostáva requesty?

---

## 💡 Pre budúcnosť

Aby si predišiel cache issues:

1. **Disable cache počas vývoja:**
   - DevTools (F12) → Network tab
   - ✅ Zaškrtni "Disable cache"
   - Nechaj DevTools otvorené

2. **Vite HMR niekedy zlyhá:**
   - Pri veľkých zmenách restart Vite server
   - `Ctrl+C` → `npm run dev`

3. **Service Worker môže cachovať:**
   - Skontroluj Application → Service Workers
   - Unregister ak existuje

---

**Skús teraz Hard Refresh (Ctrl+Shift+R) a daj mi vedieť či to funguje!** 🚀

