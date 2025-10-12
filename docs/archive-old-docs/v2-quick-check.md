# 🔍 V2 SYSTEM - RÝCHLA KONTROLA

## ✅ Čo máte nastavené v Railway:
- PROTOCOL_V2_ENABLED = true ✅
- PROTOCOL_V2_PERCENTAGE = 100 ✅
- Redis service = ? (potrebné pridať)

## 🧪 Ako overiť že V2 funguje:

### 1. Najjednoduchšie - Vytvorte protokol
1. Prihláste sa do aplikácie
2. Choďte na Rentals/Prenájmy
3. Vytvorte nový Handover Protocol
4. **Ak vidíte nové UI = V2 funguje!**

### 2. Developer Tools check
```javascript
// F12 → Console
// Ak toto vráti true, V2 je aktívne:
!!window.HandoverProtocolFormV2 || 
!!document.querySelector('[data-v2-protocol]') ||
localStorage.getItem('protocolVersion') === 'v2'
```

### 3. Network tab check
- Otvorte Network tab (F12)
- Vytvorte protokol
- Hľadajte: `/api/v2/` requesty

## ⚠️ Ak V2 nefunguje:

### Možné príčiny:
1. **Redis nie je nastavený** - pridajte v Railway
2. **Deploy nedobehol** - čakajte 2-3 minúty
3. **Cache problém** - vyčistite browser cache

### Quick fix:
```javascript
// Force V2 v browseri
localStorage.setItem('forceV2', 'true');
localStorage.setItem('protocolVersion', 'v2');
location.reload();
```

## 📞 Potrebujete pomoc?

**Pošlite mi:**
1. Vašu Railway URL
2. Screenshot z Console (F12)
3. Či vidíte nejaké chyby

**Alebo skúste:**
```bash
# Reštart deployment
railway restart

# Alebo cez UI
Railway Dashboard → Deployments → Restart
```
