# 🧪 Testing Guide - Perfect Protocols V1

**Ako otestovať nový ultra-rýchly photo systém**

---

## ✅ KROK 1: Spusti Development Server

```bash
cd /Users/mikailpirgozi/Desktop/Aplikacie\ Cursor/Blackrent\ Beta\ 2/apps/web
pnpm run dev
```

Server bude bežať na: **http://localhost:3000**

---

## ✅ KROK 2: Prihlás sa

1. Otvor **http://localhost:3000**
2. Prihlás sa s admin účtom

---

## ✅ KROK 3: Otvor Test Stránku

Naviguj na: **http://localhost:3000/test-protocols**

alebo priamo v browseri zadaj URL:
```
http://localhost:3000/test-protocols
```

---

## 🎯 KROK 4: Základný Test (1 fotka)

### A. Otvor Photo Capture

1. Klikni **"Pridať fotky"**
2. Vyber **1 fotku** z galérie
3. Sleduj progress bar:
   - "Spracovávam 1/1 fotiek..."
   - "Uploadujem 1/1 fotiek..."
   - "Hotovo 1/1"

**Expected time:** < 3s

### B. Skontroluj Stats

Po uploade sa zobrazí:
- ✅ **Nahraté fotky:** 1
- ✅ **SessionStorage:** ~30 KB (1 JPEG fotka)
- ✅ **PDF Status:** Not generated

### C. Vygeneruj PDF

1. Klikni **"Generovať PDF"**
2. Sleduj alert: "✅ PDF vygenerované úspešne! Čas: X.XXs"

**Expected time:** < 2s

### D. Stiahnuť PDF

1. Klikni **"📥 Stiahnuť PDF"**
2. Otvor PDF
3. **Skontroluj:** PDF obsahuje 1 fotku embedded (nie link!)

### E. Zobraziť Galériu

1. Klikni **"Zobraziť galériu (1)"**
2. Full-screen lightbox sa otvorí
3. **Test:**
   - Zoom In/Out buttons
   - Stlač **Esc** = zatvorí galériu
   - Download button

---

## 🔥 KROK 5: Medium Test (10 fotiek)

1. Klikni **"Vyčistiť všetko"**
2. Klikni **"Pridať fotky"**
3. Vyber **10 fotiek** naraz
4. Sleduj progress

**Expected time:** < 15s

**Skontroluj:**
- SessionStorage: ~300 KB
- PDF generation: < 2s
- PDF obsahuje všetkých 10 fotiek

---

## 🚀 KROK 6: Stress Test (30 fotiek)

1. Klikni **"Vyčistiť všetko"**
2. Klikni **"Pridať fotky"**
3. Vyber **30 fotiek** naraz
4. Sleduj progress + ETA

**Expected time:** 35-45s

**Breakdown:**
- Processing: 5-10s
- Upload: 25-35s
- PDF: 1-2s

**Skontroluj:**
- SessionStorage: ~900 KB
- PDF generation: < 2s
- PDF obsahuje všetkých 30 fotiek
- Galéria funguje smooth

---

## 📊 KROK 7: Performance Metrics

Klikni **"📊 Zobraziť Debug Info v konzole"**

**Console output:**
```
=== PERFORMANCE METRICS ===
Performance Metrics:
  photo-processing: { avg: 8500ms, min: 7200ms, max: 9800ms, count: 1 }
  photo-upload: { avg: 32000ms, min: 28000ms, max: 35000ms, count: 1 }
  pdf-generation: { avg: 1500ms, min: 1200ms, max: 1800ms, count: 1 }

=== SESSION STORAGE ===
{
  imageCount: 30,
  used: 943104,
  usedFormatted: '920.03 KB',
  max: 52428800,
  maxFormatted: '50.00 MB',
  percentUsed: 1.8,
  ...
}

=== IMAGES ===
[
  {
    id: 'abc-123',
    originalUrl: 'https://r2.../img1.webp',
    type: 'vehicle',
    ...
  },
  // ... 29 more
]
```

---

## ✅ Checklist - Čo Testovať

### Základné Funkcie
- [ ] Upload 1 fotky - funguje? < 3s?
- [ ] Upload 10 fotiek - funguje? < 15s?
- [ ] Upload 30 fotiek - funguje? < 45s?
- [ ] Progress bar zobrazuje správny progress?
- [ ] ETA je realistické?

### PDF Generation
- [ ] PDF sa generuje < 2s?
- [ ] PDF obsahuje embedded fotky?
- [ ] PDF sa dá stiahnuť?
- [ ] PDF sa dá otvoriť?
- [ ] Fotky v PDF sú viditeľné?

### Gallery
- [ ] Galéria sa otvorí?
- [ ] Fotky sú v high quality (WebP)?
- [ ] Zoom In/Out funguje?
- [ ] Swipe medzi fotkami (←/→) funguje?
- [ ] Esc zatvára galériu?
- [ ] Download funguje?
- [ ] Thumbnails sú viditeľné?

### SessionStorage
- [ ] Po uploade: SessionStorage obsahuje JPEG data?
- [ ] Po PDF generovaní: SessionStorage je vyčistený?
- [ ] Stats zobrazujú správnu veľkosť?
- [ ] Warning ak approaching limit?

### Performance
- [ ] 1 fotka: < 3s total?
- [ ] 10 fotiek: < 15s total?
- [ ] 30 fotiek: < 45s total?
- [ ] PDF: < 2s každý krát?
- [ ] Console metrics sú správne?

### Error Handling
- [ ] Retry funguje pri zlyhaní upload?
- [ ] Error messages sú jasné?
- [ ] Worker initialization error handling?
- [ ] SessionStorage full handling?

---

## 🐛 Troubleshooting

### Problem: "Worker not initialized"

**Riešenie:**
```javascript
// V Chrome DevTools Console:
typeof Worker !== 'undefined'
// Malo by vrátiť: true
```

Ak je `false`: Web Workers nie sú podporované (unlikely na modernom browseri)

### Problem: "SessionStorage full"

**Riešenie:**
```javascript
// V Console:
SessionStorageManager.clearPDFImages();
```

### Problem: "Upload failed"

**Skontroluj:**
1. Backend server beží? (http://localhost:3001)
2. R2 credentials sú nastavené?
3. Auth token je platný?

**Debug:**
```javascript
// V Console:
localStorage.getItem('blackrent_token')
// Malo by vrátiť token
```

### Problem: "PDF nemá fotky"

**Skontroluj:**
```javascript
// PRED generovaním PDF:
SessionStorageManager.getStats()
// imageCount malo by byť > 0

// Ak je 0, SessionStorage bol vyčistený príliš skoro
```

---

## 📸 Test Scenáre

### Scenár 1: Rýchly Test (1 min)
```
1. Upload 1 fotky
2. Vygeneruj PDF
3. Stiahni PDF
4. Skontroluj PDF obsahuje fotku
✅ PASS ak < 5s celkovo
```

### Scenár 2: Medium Test (5 min)
```
1. Upload 10 fotiek
2. Test galériu (zoom, swipe)
3. Vygeneruj PDF
4. Skontroluj PDF obsahuje 10 fotiek
✅ PASS ak < 20s upload + PDF
```

### Scenár 3: Stress Test (10 min)
```
1. Upload 30 fotiek
2. Skontroluj SessionStorage (~900 KB)
3. Test galériu (smooth?)
4. Vygeneruj PDF (< 2s?)
5. Skontroluj PDF obsahuje 30 fotiek
6. Stiahni PDF (veľkosť ~5-10 MB)
✅ PASS ak < 50s total
```

### Scenár 4: Multiple Runs
```
1. Upload 10 fotiek → PDF → Clear
2. Upload 20 fotiek → PDF → Clear
3. Upload 30 fotiek → PDF → Clear
4. Skontroluj performance consistency
✅ PASS ak časy sú stabilné (±10%)
```

---

## 📊 Performance Targets

### Musí splniť:

| Test | Target | Critical? |
|------|--------|-----------|
| 1 fotka | < 3s | ✅ Yes |
| 10 fotiek | < 15s | ✅ Yes |
| 30 fotiek | < 45s | ✅ Yes |
| PDF generation | < 2s | ✅ Yes |
| SessionStorage cleanup | Automatic | ✅ Yes |

### Nice to have:

| Test | Target |
|------|--------|
| 50 fotiek | < 70s |
| Gallery smooth | 60 FPS |
| Retry < 3× | 100% success |
| Offline queue | Works |

---

## 🎬 Video Test (odporúčam)

1. **Nahraj screen recording** počas testu
2. **Upload 30 fotiek** a sleduj celý proces
3. **Stopwatch** pre presné meranie času
4. **Share** video ak niečo nefunguje

---

## ✅ Ak Všetko Funguje

Po úspešnom testovaní:

1. ✅ **Mark as verified**
2. ✅ **Integrovať do HandoverProtocolForm**
3. ✅ **Integrovať do ReturnProtocolForm**
4. ✅ **Deploy na staging**
5. ✅ **User acceptance testing**
6. ✅ **Production rollout**

---

## 🚨 Ak Niečo Nefunguje

**Pošli mi:**
1. Console logs (F12 → Console tab)
2. Network tab (F12 → Network tab)
3. Screenshot/video problému
4. Performance metrics output
5. SessionStorage stats

**Debug commands:**
```javascript
// V Console:
perfMonitor.logMetrics();
SessionStorageManager.getStats();
console.log('Images:', images);
```

---

## 📞 Ready to Test!

**Spusti server a naviguj na:**
```
http://localhost:3000/test-protocols
```

**Začni s 1 fotkou, potom postupne pridávaj viac!** 🚀

---

*Testing Guide - 2025-01-10*

