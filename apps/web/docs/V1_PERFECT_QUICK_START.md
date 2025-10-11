# 🚀 V1 Perfect - Quick Start Guide

**Pre vývojárov:** Ako používať nový protokolový systém

---

## ✅ TL;DR

**Všetko je už hotové a aktívne!** Systém automaticky používa V1 Perfect.

---

## 🎯 Ako to funguje

### 1. Photo Capture

```typescript
// User klikne "Pridať fotky vozidla"
// ↓ ModernPhotoCapture sa otvorí automaticky
// ↓ User vyberie 30 fotiek
// ↓ Web Worker ich spracuje (5-10s)
// ↓ HTTP/2 uploadne na R2 (25-35s)
// ↓ JPEG verzie do SessionStorage
// ↓ Hotovo! ✅
```

**Kód je už v HandoverProtocolForm.tsx:**
```typescript
{activePhotoCapture && (
  <ModernPhotoCapture
    open={true}
    onClose={() => setActivePhotoCapture(null)}
    onSave={(images, videos) =>
      handlePhotoCaptureSuccess(activePhotoCapture, images, videos)
    }
    entityId={rental.id}
    protocolType="handover"
    mediaType={activePhotoCapture as 'vehicle' | 'document' | 'damage'}
  />
)}
```

---

### 2. PDF Generation

```typescript
// User klikne "Uložiť protokol"
// ↓ generateProtocolPDFQuick() sa zavolá
// ↓ Try: SessionStorage (1-2s) ✅
// ↓ Fallback: DB pdfData (5-10s) 🟡
// ↓ Last resort: R2 download (30-60s) 🔴
// ↓ PDF hotové! ✅
```

**Kód je už v HandoverProtocolForm.tsx:**
```typescript
const { pdfUrl } = await generateProtocolPDFQuick(protocol);
protocol.pdfUrl = pdfUrl;
```

---

## 🔧 Monitoring

### Check performance:
```typescript
import { perfMonitor } from '@/utils/performanceMonitor';

// Po dokončení protokolu
perfMonitor.logMetrics();
```

### Check SessionStorage:
```typescript
import { SessionStorageManager } from '@/utils/sessionStorageManager';

// Kedykoľvek
const stats = SessionStorageManager.getStats();
console.log(`Used: ${stats.usedFormatted} / ${stats.maxFormatted}`);
console.log(`Images: ${stats.imageCount}`);
```

---

## 🐛 Troubleshooting

### SessionStorage Full
```typescript
// Clear manually
SessionStorageManager.clearPDFImages();

// Or check stats first
const stats = SessionStorageManager.getStats();
if (stats.percentUsed > 90) {
  SessionStorageManager.clearPDFImages();
}
```

### Slow PDF Generation
```typescript
// Check logs for fallback type
logger.info('📊 PDF Image Loading Statistics', {
  sessionStorageHits: 28,  // ✅ Good!
  dbFallbacks: 2,          // 🟡 OK
  r2Fallbacks: 0,          // ✅ Excellent!
});

// If r2Fallbacks > 10%, investigate why SessionStorage is empty
```

---

## 🎛️ Feature Flag Control

### Enable/Disable V1 Perfect:
```typescript
import { featureManager } from '@/config/featureFlags';

// Check if enabled
const isEnabled = await featureManager.isEnabled('USE_V1_PERFECT_PROTOCOLS');

// Disable (rollback to legacy)
featureManager.updateFlag('USE_V1_PERFECT_PROTOCOLS', {
  enabled: false,
  percentage: 0,
});
```

---

## 📊 Expected Performance

| Operation | Time | Notes |
|-----------|------|-------|
| Photo processing (30×) | 5-10s | Web Worker parallel |
| Upload to R2 (30×) | 25-35s | HTTP/2 batch |
| PDF generation | 1-2s | SessionStorage hit |
| **Total** | **35-45s** | ✅ Target achieved |

---

## ✅ Success Checklist

- [x] ModernPhotoCapture integrovaný
- [x] generateProtocolPDFQuick() používaný
- [x] Smart fallback implementovaný
- [x] Progress indicators aktívne
- [x] Feature flag enabled (100%)
- [x] Monitoring ready
- [x] Dokumentácia complete

---

## 🚀 Next Steps

1. **Monitor** performance v produkcii
2. **Optimize** based on metrics
3. **Cleanup** legacy kód (optional)

---

*Quick Start Guide - V1 Perfect - 2025-01-11*

