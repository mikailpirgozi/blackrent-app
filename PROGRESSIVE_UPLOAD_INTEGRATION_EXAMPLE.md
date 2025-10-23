# 🔧 Progressive Upload - Integration Example

## Ako integrovať do HandoverProtocolForm.tsx

### Krok 1: Import PhotoUploaderWrapper

```tsx
// Nahraď tento import:
import { EnterprisePhotoCapture } from '../common/EnterprisePhotoCapture';

// Týmto importom:
import { PhotoUploaderWrapper } from '../common/PhotoUploaderWrapper';
```

### Krok 2: Nahraď EnterprisePhotoCapture s PhotoUploaderWrapper

**PRED:**
```tsx
<EnterprisePhotoCapture
  protocolId={rental.id}
  protocolType="handover"
  mediaType={
    activePhotoCapture as
      | 'vehicle'
      | 'document'
      | 'damage'
      | 'odometer'
      | 'fuel'
  }
  onPhotosUploaded={results => {
    const images = results.map(result => ({
      id: result.imageId,
      url: result.url,
      pdfUrl: result.pdfUrl || undefined,
      type: activePhotoCapture as 'vehicle' | 'document' | 'damage' | 'odometer' | 'fuel',
      description: '',
      timestamp: new Date(),
      compressed: true,
      originalSize: 0,
      compressedSize: 0,
    }));
    handlePhotoCaptureSuccess(activePhotoCapture, images, []);
  }}
  maxPhotos={100}
/>
```

**PO:**
```tsx
<PhotoUploaderWrapper
  protocolId={rental.id}
  protocolType="handover"
  mediaType={
    activePhotoCapture as
      | 'vehicle'
      | 'document'
      | 'damage'
      | 'odometer'
      | 'fuel'
  }
  onPhotosUploaded={results => {
    const images = results.map(result => ({
      id: result.imageId,
      url: result.url,
      pdfUrl: result.pdfUrl || undefined,
      type: activePhotoCapture as 'vehicle' | 'document' | 'damage' | 'odometer' | 'fuel',
      description: '',
      timestamp: new Date(),
      compressed: true,
      originalSize: 0,
      compressedSize: 0,
    }));
    handlePhotoCaptureSuccess(activePhotoCapture, images, []);
  }}
  maxPhotos={100}
/>
```

### Krok 3: Aktivuj feature flag

Vytvor `.env.local` v `apps/web/`:

```bash
# Use new progressive upload (server-side compression)
VITE_USE_PROGRESSIVE_UPLOAD=true
```

### Krok 4: Test

```bash
# Restart dev server
npm run dev

# Otvor na mobile browser
# Skús nahrať 20 fotiek
# Skontroluj že sa všetky nahrajú
```

---

## Integrácia do ReturnProtocolForm.tsx

Rovnaké kroky ako HandoverProtocolForm, len zmeň:

```tsx
protocolType="return"  // Namiesto "handover"
```

---

## Feature Flag Control

### Použiť nový systém (Progressive Upload)
```bash
VITE_USE_PROGRESSIVE_UPLOAD=true
```

### Použiť starý systém (Enterprise Upload)
```bash
VITE_USE_PROGRESSIVE_UPLOAD=false
# alebo odstráň premennú úplne
```

---

## Výhody PhotoUploaderWrapper

1. **Zero Breaking Changes** - Rovnaké API ako EnterprisePhotoCapture
2. **Feature Flag Control** - Jednoduchý rollback ak treba
3. **Postupná migrácia** - Môžeš testovať na staging pred production
4. **Backward Compatible** - Starý systém funguje ak vypneš flag

---

## Testing Checklist

- [ ] Import PhotoUploaderWrapper funguje
- [ ] Feature flag vypnutý → používa EnterprisePhotoCapture
- [ ] Feature flag zapnutý → používa ProgressivePhotoUploader
- [ ] Upload 20 fotiek na mobile → všetky sa nahrajú
- [ ] Progress bar sa zobrazuje správne
- [ ] Retry funguje pre zlyhané fotky
- [ ] PDF generation funguje s novými fotkami

---

## Rollback Plan

Ak nový systém nefunguje:

1. **Vypni feature flag:**
   ```bash
   VITE_USE_PROGRESSIVE_UPLOAD=false
   ```

2. **Restart dev server:**
   ```bash
   npm run dev
   ```

3. **Verify starý systém funguje**

4. **Report issue** s error logs

---

## Production Deployment

### Staging Test
```bash
# 1. Deploy na staging s feature flag
VITE_USE_PROGRESSIVE_UPLOAD=true

# 2. Test na mobile devices
# 3. Monitor error logs
# 4. Check success rate
```

### Production Rollout
```bash
# 1. Ak staging funguje, deploy na production
git add .
git commit -m "feat: Enable progressive photo upload"
git push origin main

# 2. Monitor production metrics
# 3. User feedback
# 4. Rollback ak treba
```

---

## Hotovo! 🎉

Teraz máš **radikálne riešenie** pre mobile photo upload problém!

