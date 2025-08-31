# 🔧 AKO POUŽÍVAŤ V2 PROTOKOLY V KÓDE

## 📌 Príklad implementácie

### 1️⃣ **Import oboch verzií:**
```tsx
// RentalProtocols.tsx alebo iný komponent
import HandoverProtocolForm from '../../protocols/HandoverProtocolForm';
import HandoverProtocolFormV2 from '../../protocols/v2/HandoverProtocolFormV2';
import { featureManager } from '../../../config/featureFlags';
```

### 2️⃣ **Podmienené renderovanie podľa Feature Flag:**
```tsx
const RentalProtocols = ({ rental, userId }) => {
  // Získať aktuálneho používateľa
  const currentUserId = userId || localStorage.getItem('userId');
  
  // Skontrolovať či má V2 povolené
  const useV2 = featureManager.isEnabled('PROTOCOL_V2', currentUserId);
  
  return (
    <div>
      {/* Handover Protocol */}
      {useV2 ? (
        <HandoverProtocolFormV2 
          rental={rental}
          onComplete={handleComplete}
        />
      ) : (
        <HandoverProtocolForm 
          rental={rental}
          onComplete={handleComplete}
        />
      )}
      
      {/* Return Protocol */}
      {useV2 ? (
        <ReturnProtocolFormV2 
          rental={rental}
          onComplete={handleComplete}
        />
      ) : (
        <ReturnProtocolForm 
          rental={rental}
          onComplete={handleComplete}
        />
      )}
    </div>
  );
};
```

## 🎯 Testovanie Feature Flags

### V Browser Console (F12):
```javascript
// Skontrolovať či máte V2 povolené
const fm = await import('/src/config/featureFlags.js');
const isEnabled = fm.featureManager.isEnabled('PROTOCOL_V2', 'your-user-id');
console.log('V2 Enabled:', isEnabled);

// Manuálne zapnúť V2 pre testovanie (len lokálne!)
localStorage.setItem('forceProtocolV2', 'true');
```

### V Railway Environment:
```bash
# Pre konkrétnych používateľov
PROTOCOL_V2_USER_IDS=user123,user456,admin

# Pre percentuálny rollout
PROTOCOL_V2_PERCENTAGE=10

# Úplné zapnutie
PROTOCOL_V2_ENABLED=true
PROTOCOL_V2_PERCENTAGE=100
```

## 🔍 Debugging

### Kontrola v Network tabe:
```
1. Otvorte DevTools (F12)
2. Network tab
3. Hľadajte requesty:
   - /api/v2/protocols (V2)
   - /api/protocols (V1)
```

### Kontrola v databáze:
```sql
-- Ktorá verzia sa používa
SELECT 
  DATE(created_at) as date,
  COUNT(CASE WHEN version = 'v2' THEN 1 END) as v2_count,
  COUNT(CASE WHEN version = 'v1' OR version IS NULL THEN 1 END) as v1_count
FROM protocols
WHERE created_at > NOW() - INTERVAL '7 days'
GROUP BY DATE(created_at)
ORDER BY date DESC;
```

## ⚡ Quick Toggle (pre development)

### Pridajte debug tlačidlo:
```tsx
// V admin paneli alebo settings
{process.env.NODE_ENV === 'development' && (
  <button onClick={() => {
    const current = localStorage.getItem('forceProtocolV2') === 'true';
    localStorage.setItem('forceProtocolV2', (!current).toString());
    window.location.reload();
  }}>
    Toggle V2 Protocol (Current: {localStorage.getItem('forceProtocolV2')})
  </button>
)}
```

## 📊 Monitoring úspešnosti

### Frontend metriky:
```javascript
// Tracking použitia
if (useV2) {
  console.log('[V2] Protocol created successfully');
  // Alebo pošlite na analytics
  analytics.track('protocol_v2_used', { 
    type: 'handover',
    userId: currentUserId 
  });
}
```

### Backend metriky:
```typescript
// V API endpointe
app.post('/api/v2/protocols', async (req, res) => {
  console.log('[V2] Creating protocol for user:', req.user.id);
  // ... vytvorenie protokolu
  
  // Log úspešnosti
  logger.info('V2_PROTOCOL_CREATED', {
    userId: req.user.id,
    protocolId: protocol.id,
    processingTime: Date.now() - startTime
  });
});
```

## ✅ Výhody V2

### Pre vývojárov:
- Čistejší kód
- Lepšie error handling
- Queue processing
- Automatické testy

### Pre používateľov:
- Rýchlejšie spracovanie
- Menšie súbory
- Offline support
- Lepšia UX

---

**READY TO USE! 🚀**
