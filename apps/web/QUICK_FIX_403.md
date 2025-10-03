# 🔧 QUICK FIX - 403 FORBIDDEN

## Problém
Backend hovorí "Neplatný token" napriek tomu že token existuje.

## Príčina
Backend sa reštartoval a JWT secret/session sa zmenila.

## ✅ RIEŠENIE (30 sekúnd)

### V aplikácii:
1. **Klikni na ikonu používateľa** (vpravo hore)
2. **Klikni "Odhlásiť sa"**
3. **Prihlás sa znova:**
   - Username: `admin`
   - Password: `Black123`
4. **Prejdi na "Leasingy"**
5. **Vytvor leasing**

## ✅ To vygeneruje nový platný token pre aktuálnu backend session!

---

**ALEBO:**

V Console napíš:
```javascript
localStorage.clear();
location.reload();
```

Potom sa prihlás znova.

---

**Po novom prihlásení bude všetko fungovať!** 🚀

