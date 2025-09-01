# 🚨 V2 PROTOKOL SYSTÉM - KRITICKÉ PROBLÉMY

## 📊 **STAV:** V2 je čiastočne funkčný, ale má vážne nedostatky

---

## 🔥 **KRITICKÉ PROBLÉMY:**

### **1. 🎨 DESIGN NESEDÍ S V1**
- **Problém:** V2 formulár nemá rovnaký design ako V1
- **Chýba:** Material-UI komponenty, správne štýlovanie, layout
- **Dôsledok:** Používateľ vidí rozdiel medzi V1 a V2
- **Priorita:** VYSOKÁ

### **2. 📋 CHÝBAJÚ FUNKCIE Z V1**
- **Problém:** V2 nemá všetky funkcie ktoré má V1
- **Chýba:** 
  - Všetky input polia z V1
  - Dropdown menu a selecty
  - Správne validácie
  - Kompletný workflow
- **Priorita:** KRITICKÁ

### **3. ⚙️ NASTAVENIA A KONFIGURÁCIA**
- **Problém:** V2 nemá rovnaké nastavenia ako V1
- **Chýba:**
  - Predvolené hodnoty
  - Lokalizácia
  - Správne mapovanie dát
- **Priorita:** VYSOKÁ

### **4. 🔧 GIT COMMIT PROBLÉMY**
- **Problém:** Git commit otvára vim editor namiesto jednoduchého commitu
- **Riešenie:** Použiť `git commit -m "message"` alebo nastaviť iný editor
- **Priorita:** NÍZKA (technický problém)

---

## 🎯 **RIEŠENIE - KOMPLETNÁ REKONŠTRUKCIA V2:**

### **FÁZA 1: ANALÝZA V1 FORMULÁRA**
1. **Preskúmať HandoverProtocolForm.tsx** - všetky komponenty
2. **Identifikovať všetky input polia** - názvy, typy, validácie
3. **Zmapovať štruktúru dát** - ako sa dáta spracúvajú
4. **Analyzovať styling** - Material-UI komponenty a layout

### **FÁZA 2: PREPÍSAŤ V2 FORMULÁR**
1. **Skopirovať kompletný layout** z V1
2. **Pridať V2 funkcionalitu** (queue, photo capture V2)
3. **Zachovať všetky V1 funkcie** - žiadne odstránenie
4. **Testovať každú sekciu** postupne

### **FÁZA 3: INTEGRÁCIA A TESTOVANIE**
1. **Otestovať všetky funkcie** V2 vs V1
2. **Porovnať výsledné protokoly** - musia byť identické
3. **Performance testy** - V2 má byť rýchlejší
4. **User experience test** - používateľ nevidí rozdiel

---

## 📝 **KONKRÉTNE ÚKOLY PRE NOVÉ OKNO:**

### **1. PRESKÚMAJ V1 FORMULÁR:**
```bash
# Otvor V1 formulár a analyzuj:
src/components/protocols/HandoverProtocolForm.tsx

# Hľadaj:
- Všetky TextField komponenty
- Select/MenuItem komponenty  
- Validation logiku
- Data mapping
- Event handlery
```

### **2. POROVNAJ S V2:**
```bash
# Otvor V2 formulár:
src/components/protocols/v2/HandoverProtocolFormV2.tsx

# Identifikuj čo chýba:
- Ktoré polia nie sú implementované
- Ktoré funkcie chýbajú
- Aký je rozdiel v štruktúre
```

### **3. VYTVOR MAPPING TABUĽKU:**
```
V1 POLE → V2 POLE → STATUS
vehicleInfo.brand → vehicle.brand → ✅ OK
vehicleInfo.model → vehicle.model → ✅ OK  
customerInfo.name → customer.firstName → ❌ CHÝBA lastName
... atď
```

### **4. IMPLEMENTUJ CHÝBAJÚCE ČASTI:**
- Postupne pridávaj chýbajúce komponenty
- Testuj každú zmenu
- Zachovaj V2 výhody (queue, performance)

---

## 🚀 **OČAKÁVANÝ VÝSLEDOK:**

### **V2 MUSÍ BYŤ:**
- ✅ **Vizuálne identický** s V1
- ✅ **Funkčne identický** s V1  
- ✅ **Plus V2 výhody:** queue, performance, SHA-256
- ✅ **Bezproblémový prechod** pre používateľov

### **POUŽÍVATEĽ NESMIE VIDIEŤ ROZDIEL** okrem:
- "V2 Queue Enabled" chip
- Rýchlejšie spracovanie
- Lepšiu stabilitu

---

## 📞 **KONTAKT PRE POKRAČOVANIE:**

Keď otvoríš nové okno, povedz:
> "Pokračujem v oprave V2 protokol systému podľa dokumentu V2_PROTOKOL_PROBLEMY_ZOZNAM.md"

A začni **FÁZOU 1: ANALÝZA V1 FORMULÁRA**.

---

## 🔍 **DEBUG INFO:**

- **V2 Status:** Čiastočne funkčný
- **Feature Flag:** localStorage.setItem('PROTOCOL_V2_ENABLED', 'true')
- **Hlavný problém:** Neúplná implementácia V1 funkcií
- **Git problém:** Vim editor namiesto direct commit

**DÔLEŽITÉ:** V2 nie je pripravený na produkciu! Potrebuje kompletné prepracovanie.
