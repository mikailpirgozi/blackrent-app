# 🧪 AKO TESTOVAŤ V2 PROTOKOLY V PRODUKCII

## 📋 KROK 1: Deploy na Railway

### Pridajte Redis Service:
```bash
1. Railway Dashboard → Your Project
2. + New → Database → Redis
3. Deploy (Railway automaticky pridá REDIS_URL)
```

### Nastavte Feature Flags:
```bash
# V Railway Environment Variables pridajte:
PROTOCOL_V2_ENABLED=true
PROTOCOL_V2_PERCENTAGE=0  # Začnite s 0%
PROTOCOL_V2_USER_IDS=your-user-id  # Len pre vás!
```

## 🎯 KROK 2: Testovanie Len Pre Vás

### V aplikácii:
1. **Prihláste sa** ako admin
2. **Vytvorte nový protokol** - automaticky použije V2
3. **Overte funkcie:**
   - ✅ Fotenie (SerialPhotoCaptureV2)
   - ✅ PDF generovanie (PDF/A štandard)
   - ✅ Ukladanie do R2
   - ✅ Queue spracovanie

### Kontrola v konzole:
```javascript
// Browser Console (F12)
localStorage.getItem('protocolVersion')
// Mali by ste vidieť: "v2"
```

## 📊 KROK 3: Postupný Rollout

### Týždeň 1: Interné testovanie
```bash
PROTOCOL_V2_PERCENTAGE=0
PROTOCOL_V2_USER_IDS=admin1,admin2,admin3
```

### Týždeň 2: 5% používateľov
```bash
PROTOCOL_V2_PERCENTAGE=5
PROTOCOL_V2_USER_IDS=  # Už nepotrebné
```

### Týždeň 3: 25% používateľov
```bash
PROTOCOL_V2_PERCENTAGE=25
```

### Týždeň 4: 50% používateľov
```bash
PROTOCOL_V2_PERCENTAGE=50
```

### Týždeň 5: 100% - Kompletné spustenie!
```bash
PROTOCOL_V2_PERCENTAGE=100
```

## 🔍 KROK 4: Monitoring

### Čo sledovať:
```sql
-- Koľko V2 protokolov sa vytvorilo
SELECT COUNT(*) FROM protocols_v2 WHERE created_at > NOW() - INTERVAL '1 day';

-- Úspešnosť spracovania
SELECT status, COUNT(*) FROM protocol_queue_jobs GROUP BY status;

-- Porovnanie V1 vs V2
SELECT 
  'V1' as version, COUNT(*) as count FROM protocols
UNION ALL
SELECT 
  'V2' as version, COUNT(*) as count FROM protocols_v2;
```

### Chybové logy:
```bash
# Railway Logs
railway logs | grep "ERROR\|V2"
```

## 🚨 KROK 5: Rollback Plan

### Ak niečo nefunguje:
```bash
# Okamžite vypnúť V2
PROTOCOL_V2_ENABLED=false

# Alebo znížiť percentage
PROTOCOL_V2_PERCENTAGE=0
```

### V kóde máme fallback:
```typescript
// Automaticky použije V1 ak V2 zlyhá
if (!featureManager.isEnabled('PROTOCOL_V2', userId)) {
  return <HandoverProtocolForm />; // V1
}
return <HandoverProtocolFormV2 />; // V2
```

## ✅ VÝHODY V2 SYSTÉMU

### Pre Vás:
- 📸 **Rýchlejšie fotenie** - Queue spracovanie
- 📄 **Kvalitnejšie PDF** - PDF/A štandard
- 🔒 **SHA-256 hashing** - Integrita dát
- 📊 **Manifest systém** - Tracking súborov
- ⚡ **Lepší výkon** - Optimalizované queries

### Pre Používateľov:
- Rýchlejšia odozva
- Menšie súbory (WebP)
- Offline podpora
- Lepšia UX

## 📞 PODPORA

### Ak potrebujete pomoc:
1. **Logy:** `railway logs`
2. **Metriky:** Railway Dashboard
3. **Rollback:** `PROTOCOL_V2_ENABLED=false`
4. **Debug:** Browser Console → Network tab

---

**PRIPRAVENÉ NA TESTOVANIE! 🚀**
