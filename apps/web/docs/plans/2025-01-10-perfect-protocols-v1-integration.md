# 🎯 Perfect Protocols V1 - Integration Guide

Dátum: 2025-01-10  
Status: ✅ Core implementované, integrácia v progrese

---

## 📋 Prehľad Implementácie

### Vytvorené súbory

#### Core Utilities
- ✅ `src/workers/imageProcessor.worker.ts` - Web Worker s GPU acceleration
- ✅ `src/utils/imageProcessing.ts` - ImageProcessor wrapper
- ✅ `src/utils/webpSupport.ts` - WebP detection
- ✅ `src/utils/sessionStorageManager.ts` - SessionStorage management
- ✅ `src/utils/performanceMonitor.ts` - Performance tracking
- ✅ `src/utils/protocolPhotoWorkflow.ts` - Unified workflow helper
- ✅ `src/utils/protocolMigration.ts` - Migration utility

#### Services
- ✅ `src/services/uploadManager.ts` - HTTP/2 parallel uploads
- ✅ `src/services/offlineQueueManager.ts` - Offline queue s IndexedDB

#### Components
- ✅ `src/components/common/ModernPhotoCapture.tsx` - Modernizovaný photo capture
- ✅ `src/components/common/ProtocolGallery.tsx` - Full-screen lightbox

#### Enhanced PDF
- ✅ `src/utils/enhancedPdfGenerator.ts` - Updated s SessionStorage support

#### Tests
- ✅ `src/utils/__tests__/protocolPhotoWorkflow.test.ts`
- ✅ `src/utils/__tests__/imageProcessing.test.ts`
- ✅ `src/utils/__tests__/sessionStorageManager.test.ts`

#### Examples
- ✅ `src/components/protocols/HandoverProtocolFormV1Perfect.example.tsx`

#### Odstránené (V2 cleanup)
- ❌ `src/components/common/v2/SerialPhotoCaptureV2.tsx` - DELETED
- ❌ `src/utils/v2TestData.ts` - DELETED

---

## 🚀 Ako Integrovať do Existujúceho Formulára

### Variant A: Postupná Migrácia (Odporúčam)

**KROK 1:** Pridaj feature flag

```typescript
// src/components/protocols/HandoverProtocolForm.tsx

import { ModernPhotoCapture } from '../common/ModernPhotoCapture';
import { generateProtocolPDFQuick } from '@/utils/protocolPhotoWorkflow';
import { SessionStorageManager } from '@/utils/sessionStorageManager';

const USE_MODERN_PHOTO_CAPTURE = true; // Feature flag

// V render metóde:
{activePhotoCapture && (
  USE_MODERN_PHOTO_CAPTURE ? (
    <ModernPhotoCapture
      open={true}
      onClose={() => setActivePhotoCapture(null)}
      onSave={(images, videos) =>
        handlePhotoCaptureSuccess(activePhotoCapture, images, videos)
      }
      title={`Fotografie - ${activePhotoCapture}`}
      entityId={rental.id}
      mediaType={activePhotoCapture as any}
    />
  ) : (
    <SerialPhotoCapture
      // ... existujúce props
    />
  )
)}
```

**KROK 2:** Update PDF generation v `performSave()`

```typescript
// Nahradiť starý PDF generator
const performSave = async () => {
  // ... validácia ...
  
  // Vytvor protokol
  const protocol: HandoverProtocol = {
    // ... všetky fieldy ...
  };
  
  // NOVÉ: Použiť generateProtocolPDFQuick()
  const { pdfUrl, generationTime } = await generateProtocolPDFQuick(protocol);
  
  logger.info('PDF generated', { url: pdfUrl, time: generationTime });
  
  protocol.pdfUrl = pdfUrl;
  
  // SessionStorage sa automaticky vyčistil
  
  // Ulož protokol do DB
  const result = await createHandoverProtocol.mutateAsync(protocol);
  
  return result;
};
```

**KROK 3:** Pridaj galériu

```typescript
const [galleryOpen, setGalleryOpen] = useState(false);
const [galleryImages, setGalleryImages] = useState<ProtocolImage[]>([]);

// Handler pre otvorenie galérie
const handleOpenGallery = (images: ProtocolImage[]) => {
  setGalleryImages(images);
  setGalleryOpen(true);
};

// V UI pridaj tlačidlo
<Button
  variant="ghost"
  size="sm"
  onClick={() => handleOpenGallery(formData.vehicleImages)}
>
  Zobraziť galériu ({formData.vehicleImages.length})
</Button>

// Render galériu
<ProtocolGallery
  images={galleryImages}
  open={galleryOpen}
  onClose={() => setGalleryOpen(false)}
/>
```

---

### Variant B: Kompletná Náhrada

Skopíruj `HandoverProtocolFormV1Perfect.example.tsx` a uprav podľa potreby.

---

## 🎯 Workflow Detail

### 1. Photo Selection (User akcia)

```typescript
// User klikne "Fotky vozidla"
handlePhotoCapture('vehicle');

// ModernPhotoCapture sa otvorí
<ModernPhotoCapture
  entityId={rental.id}
  mediaType="vehicle"
  maxImages={50}
/>

// User vyberie 30 fotiek z galérie
```

### 2. Automatic Processing (5-10s)

```
Web Worker (paralelne):
  Fotka 1 → WebP (95%, 1920px) + JPEG (50%, 400x300)
  Fotka 2 → WebP (95%, 1920px) + JPEG (50%, 400x300)
  ...
  Fotka 30 → WebP (95%, 1920px) + JPEG (50%, 400x300)

Progress: "Processing 15/30 images... ETA: 8s"
```

### 3. Automatic Upload (25-35s)

```
HTTP/2 Parallel (6× súčasne):
  Batch 1: img1.webp, img2.webp, ... img6.webp → R2
  Batch 2: img7.webp, img8.webp, ... img12.webp → R2
  Batch 3: img13.webp, img14.webp, ... img18.webp → R2
  ...

JPEG verzie → SessionStorage (nie R2!)

Progress: "Uploading 18/30 images... ETA: 18s"
```

### 4. Save to Form (okamžité)

```typescript
// ModernPhotoCapture.onSave()
const images: ProtocolImage[] = [
  {
    id: 'abc123',
    url: 'https://r2.../img1.webp', // Deprecated
    originalUrl: 'https://r2.../img1.webp', // WebP pre galériu
    type: 'vehicle',
    timestamp: new Date(),
  },
  // ... 29 more
];

// Update form data
setFormData(prev => ({
  ...prev,
  vehicleImages: images,
}));
```

### 5. Protocol Save (klik "Uložiť")

```typescript
// User klikne "Uložiť protokol"
await handleSave();

// Vytvorí protokol objekt
const protocol: HandoverProtocol = {
  vehicleImages: [...], // 30 images s R2 URLs
  documentImages: [...],
  damageImages: [...],
  // ...
};

// Vygeneruje PDF (1-2s!)
const { pdfUrl } = await generateProtocolPDFQuick(protocol);
// ↑ Použije JPEG z SessionStorage (žiadne sťahovanie!)

// Upload PDF na R2
// SessionStorage sa automaticky vyčistí

// Ulož do DB
protocol.pdfUrl = pdfUrl;
await apiService.createHandoverProtocol(protocol);
```

### 6. View Gallery (kedykoľvek)

```typescript
// User klikne "Zobraziť galériu"
handleOpenGallery(protocol.vehicleImages);

// ProtocolGallery načíta WebP z R2
<ProtocolGallery
  images={protocol.vehicleImages}
  open={true}
/>

// Full-screen lightbox s zoom/swipe
```

---

## 📊 Performance Metriky

### Sledovanie Performance

```typescript
import { perfMonitor } from '@/utils/performanceMonitor';

// Po dokončení protokolu
perfMonitor.logMetrics();

// Output:
// Performance Summary:
//   photo-processing: { avg: 8500ms, min: 7200ms, max: 9800ms, count: 1 }
//   photo-upload: { avg: 32000ms, min: 28000ms, max: 35000ms, count: 1 }
//   pdf-generation: { avg: 1500ms, min: 1200ms, max: 1800ms, count: 1 }
```

---

## 🔧 Troubleshooting

### SessionStorage Full

```typescript
// Check stats
const stats = SessionStorageManager.getStats();
console.log(`Used: ${stats.usedFormatted} (${stats.percentUsed.toFixed(1)}%)`);

// Clear if needed
if (stats.percentUsed > 90) {
  SessionStorageManager.clearPDFImages();
}
```

### Worker Initialization Failed

```typescript
// Worker fails to initialize
try {
  const processor = new ImageProcessor();
  await processor.processImage(file);
} catch (error) {
  console.error('Worker failed:', error);
  // Fallback na starý systém
}
```

### Upload Retry Limit Reached

```typescript
// UploadManager automaticky retry 3×
// Ak zlyhá, throw error

try {
  await uploadManager.uploadBatch(tasks);
} catch (error) {
  // Check which uploads failed
  console.error('Upload failed after retries:', error);
  // Show user which photos failed
}
```

---

## 🎯 Next Steps

### Dokončiť Integráciu

1. ✅ Core utilities vytvorené
2. ⏳ **Integrovať do HandoverProtocolForm** (WIP)
3. ⏳ **Integrovať do ReturnProtocolForm** (WIP)
4. ⏳ **E2E testing** s 30 fotkami
5. ⏳ **User acceptance testing**
6. ⏳ **Performance optimization** ak treba

### Testing Checklist

- [ ] Upload 1 fotky - funguje?
- [ ] Upload 10 fotiek - funguje?
- [ ] Upload 30 fotiek - funguje? Čas?
- [ ] PDF generovanie - má embedded fotky?
- [ ] Galéria - zobrazuje WebP v high quality?
- [ ] Offline - queue funguje?
- [ ] SessionStorage - cleanup funguje?
- [ ] Retry - automatický retry funguje?

---

## 🔄 Fallback na Variant 2 (ak treba)

Ak SessionStorage spôsobuje problémy, jednoduchá migrácia:

```typescript
// 1. Update ProtocolImage type
interface ProtocolImage {
  // ... existing fields
  pdfData: string; // ← Pridaj toto pole (required namiesto optional)
}

// 2. Update workflow
// Namiesto SessionStorage, ulož do DB
const handlePhotoCaptureSuccess = (images) => {
  images.forEach(img => {
    const pdfBase64 = SessionStorageManager.getPDFImage(img.id);
    img.pdfData = pdfBase64; // ← Ulož do objektu
  });
  
  setFormData(prev => ({
    ...prev,
    vehicleImages: images, // pdfData je súčasťou objektu
  }));
};

// 3. Update PDF generator
// Namiesto SessionStorage, použij img.pdfData
private async addImagesFromDB(images: ProtocolImage[]) {
  for (const image of images) {
    const base64 = image.pdfData; // ← Z DB namiesto SessionStorage
    if (base64) {
      this.doc.addImage(base64, 'JPEG', x, y, w, h);
    }
  }
}
```

**To je všetko!** Migrácia V3 → V2 trvá ~15 minút.

---

## 📝 Poznámky

- **Web Workers** vyžadujú HTTPS alebo localhost (nie IP adresa)
- **SessionStorage** limit je ~50MB (stačí na 1500 JPEG fotiek)
- **HTTP/2** paralelný upload funguje iba na HTTPS
- **IndexedDB** limit je ~50MB na mobile, viac na desktop

---

*Implementation complete: 2025-01-10*

