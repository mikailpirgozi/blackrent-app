# 📸 WebP Quality Optimization - Implementačný Plán

## 🎯 **Cieľ**
Optimalizovať upload obrázkov aby sa zachovala plná kvalita v galérii a kompresia sa použila len pre PDF protokoly.

## 🔍 **Aktuálny problém**
- File upload znižuje kvalitu cez image linting (963KB → 253KB)
- Native camera zachováva kvalitu ale používa JPG formát
- Nekonzistentné formáty (JPG vs WebP)

## ✅ **Požadovaný výsledok**
```
📸 ORIGINÁL (WebP, plná kvalita 95%) → Galéria + zobrazovanie
🗜️ KOMPRIMOVANÝ (JPEG, PDF kvalita 80%) → Len pre PDF protokoly
```

---

## 📋 **FÁZA 1: Analýza aktuálneho stavu**

### 1.1 Identifikovať kde sa stráca kvalita
- [ ] **Súbor:** `src/utils/image-processing.ts` - imageLint funkcia
- [ ] **Súbor:** `src/components/common/SerialPhotoCapture.tsx` - handleFileSelect
- [ ] **Súbor:** `src/components/common/NativeCamera.tsx` - capture process

### 1.2 Zmapovať flow spracovania obrázkov
```
File Upload: File → imageLint → WebP (strata kvality) → R2 upload
Native Camera: Blob → JPG File → R2 upload (plná kvalita)
```

---

## 📋 **FÁZA 2: Optimalizácia image processing**

### 2.1 Upraviť imageLint funkciu
**Súbor:** `src/utils/image-processing.ts`

```typescript
// PRED (aktuálne - znižuje kvalitu)
export async function imageLint(file: File): Promise<ProcessedImage> {
  // Komprimuje na 60-80% kvalitu
}

// PO (nové - zachová kvalitu)
export async function imageLint(file: File, options?: {
  preserveQuality?: boolean;
  targetFormat?: 'webp' | 'jpeg';
  quality?: number;
}): Promise<ProcessedImage> {
  const preserveQuality = options?.preserveQuality ?? true;
  const targetFormat = options?.targetFormat ?? 'webp';
  const quality = options?.quality ?? 0.95; // 95% kvalita pre originál
  
  // Len konverzia formátu, zachová kvalitu
}
```

### 2.2 Vytvoriť novú funkciu pre PDF kompresia
**Súbor:** `src/utils/image-processing.ts`

```typescript
export async function compressForPDF(file: File): Promise<File> {
  return await imageLint(file, {
    preserveQuality: false,
    targetFormat: 'jpeg',
    quality: 0.8,
    maxWidth: 1200,
    maxHeight: 900,
    maxSize: 300 // KB
  });
}
```

---

## 📋 **FÁZA 3: Aktualizácia SerialPhotoCapture**

### 3.1 Upraviť handleFileSelect
**Súbor:** `src/components/common/SerialPhotoCapture.tsx`

```typescript
// PRED (aktuálne)
const processedFile = await imageLint(file);

// PO (nové)
const processedFile = await imageLint(file, {
  preserveQuality: true,  // ✅ Zachová kvalitu
  targetFormat: 'webp',   // ✅ Jednotný formát
  quality: 0.95           // ✅ 95% kvalita
});
```

### 3.2 Aktualizovať dual upload systém
```typescript
// 1. ORIGINÁL - plná kvalita WebP
originalUrl = await uploadToR2(processedFile); // Už WebP, plná kvalita

// 2. KOMPRIMOVANÁ VERZIA - pre PDF
const compressedFile = await compressForPDF(processedFile);
compressedUrl = await uploadToR2(compressedFile, '_compressed');
```

---

## 📋 **FÁZA 4: Optimalizácia Native Camera**

### 4.1 Zmeniť výstupný formát na WebP
**Súbor:** `src/components/common/NativeCamera.tsx`

```typescript
// PRED (aktuálne - JPG)
const file = new File([imageBlob], `photo_${Date.now()}.jpg`, {
  type: 'image/jpeg',
});

// PO (nové - WebP)
const webpBlob = await convertToWebP(imageBlob, { quality: 0.95 });
const file = new File([webpBlob], `photo_${Date.now()}.webp`, {
  type: 'image/webp',
});
```

### 4.2 Implementovať WebP konverziu
```typescript
async function convertToWebP(blob: Blob, options: { quality: number }): Promise<Blob> {
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  const img = new Image();
  
  return new Promise((resolve) => {
    img.onload = () => {
      canvas.width = img.width;
      canvas.height = img.height;
      ctx?.drawImage(img, 0, 0);
      
      canvas.toBlob(
        (blob) => resolve(blob!),
        'image/webp',
        options.quality
      );
    };
    img.src = URL.createObjectURL(blob);
  });
}
```

---

## 📋 **FÁZA 5: Backend optimalizácia**

### 5.1 Aktualizovať R2 storage pre WebP
**Súbor:** `backend/src/utils/r2-storage.ts`

```typescript
// Pridať WebP do povolených typov
validateFileType(mimetype: string): boolean {
  const allowedTypes = [
    'image/jpeg',
    'image/png', 
    'image/webp', // ✅ Pridané
    'video/mp4',
    'video/webm'
  ];
  return allowedTypes.includes(mimetype);
}
```

### 5.2 Optimalizovať file key generovanie
```typescript
// Zachovať WebP extension v názvoch súborov
generateMeaningfulFilename(protocolInfo, mediaType, category, originalFilename, timestamp) {
  // Zachovať .webp extension namiesto konverzie na .jpg
}
```

---

## 📋 **FÁZA 6: Testovanie a validácia**

### 6.1 Testovať kvalitu obrázkov
- [ ] Upload cez drag&drop → WebP plná kvalita
- [ ] Native camera → WebP plná kvalita  
- [ ] PDF kompresia → JPEG optimalizované pre PDF
- [ ] Galéria zobrazuje vysokú kvalitu

### 6.2 Testovať veľkosti súborov
```
Očakávané výsledky:
📸 Originál WebP: ~80% veľkosti JPG pri rovnakej kvalite
🗜️ PDF JPEG: ~300KB max (ako teraz)
```

### 6.3 Testovať kompatibilitu
- [ ] WebP podpora v prehliadačoch
- [ ] R2 storage handling
- [ ] PDF generovanie s JPEG komprimovanými obrázkami

---

## 📋 **FÁZA 7: Deployment**

### 7.1 Postupné nasadenie
1. **Testovanie** - lokálne testy
2. **Staging** - test na staging prostredí  
3. **Production** - postupné nasadenie

### 7.2 Monitoring
- [ ] Sledovať veľkosti uploadovaných súborov
- [ ] Monitorovať kvalitu obrázkov v galérii
- [ ] Kontrolovať PDF generovanie

---

## 🎯 **Očakávané výhody**

### Kvalita
- ✅ **Plná kvalita v galérii** - žiadna strata kvality
- ✅ **Lepšia kompresia** - WebP vs JPG pri rovnakej kvalite

### Performance  
- ✅ **Menšie súbory** - WebP je 25-35% menší
- ✅ **Rýchlejšie načítanie** galérie
- ✅ **Optimalizované PDF** - komprimované len pre PDF

### Konzistencia
- ✅ **Jednotný formát** - všetko WebP
- ✅ **Predvídateľné správanie** - rovnaký proces pre všetky uploady

---

## ⚠️ **Riziká a mitigácia**

### Kompatibilita
- **Riziko:** Staršie prehliadače nepodporujú WebP
- **Mitigácia:** Fallback na JPG pre staré prehliadače

### Veľkosť súborov
- **Riziko:** WebP môže byť väčší pre jednoduché obrázky
- **Mitigácia:** Inteligentný výber formátu podľa obsahu

### PDF generovanie
- **Riziko:** Problémy s WebP v PDF
- **Mitigácia:** Používať JPEG pre PDF (ako teraz)

---

## 📅 **Timeline**

| Fáza | Čas | Popis |
|------|-----|-------|
| 1-2 | 2h | Analýza + optimalizácia image processing |
| 3 | 1h | SerialPhotoCapture úpravy |
| 4 | 1h | Native Camera WebP konverzia |
| 5 | 0.5h | Backend optimalizácia |
| 6 | 1h | Testovanie |
| 7 | 0.5h | Deployment |
| **Celkom** | **6h** | **Kompletná implementácia** |

---

## 🚀 **Začiatok implementácie**

**Prvý krok:** Upraviť `imageLint` funkciu aby zachovala kvalitu a konvertovala na WebP.

**Príkaz na spustenie:**
```bash
# Začať s FÁZA 1 - analýza
find src -name "*.ts" -o -name "*.tsx" | xargs grep -l "imageLint\|image.*processing"
```
