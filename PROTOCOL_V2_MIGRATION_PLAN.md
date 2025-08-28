# 📋 MASTER PLÁN: MIGRÁCIA PROTOKOLOV NA V2 SYSTÉM

## 📌 ZÁKLADNÉ INFORMÁCIE
- **Projekt**: BlackRent Protocol System V2
- **Začiatok**: 16.1.2025
- **Predpokladané dokončenie**: 8-10 týždňov
- **Stratégia**: Paralelný vývoj s postupným nasadením
- **Priorita**: Zero-downtime, 100% spätná kompatibilita

---

## ✅ HLAVNÝ CHECKLIST PROGRESS

### **FÁZA 1: PRÍPRAVA** [0/8] ⏳
- [ ] Backup súčasného systému
- [ ] Vytvorenie Git branch `feature/protocols-v2`
- [ ] Setup lokálneho Docker prostedia
- [ ] Inštalácia BullMQ/Redis
- [ ] Setup Minio (lokálny R2)
- [ ] Vytvorenie paralelnej štruktúry súborov
- [ ] Implementácia Feature Flags
- [ ] Databázové migrácie (non-breaking)

### **FÁZA 2: CORE DEVELOPMENT** [0/12] 🔧
- [ ] Queue system implementácia
- [ ] Photo processor worker
- [ ] Derivative generator (Sharp)
- [ ] Manifest system
- [ ] SHA-256 hashing
- [ ] PDF/A generator
- [ ] SerialPhotoCaptureV2 komponent
- [ ] HandoverProtocolFormV2 komponent
- [ ] ReturnProtocolFormV2 komponent
- [ ] V2 API endpoints
- [ ] Migračný script
- [ ] Unit testy

### **FÁZA 3: TESTOVANIE** [0/8] 🧪
- [ ] Lokálne testy všetkých features
- [ ] Kompatibilita V1 ↔ V2
- [ ] Performance benchmarky
- [ ] Load testing
- [ ] Staging deployment
- [ ] User Acceptance Testing
- [ ] Rollback test
- [ ] Monitoring setup

### **FÁZA 4: PRODUKCIA** [0/6] 🚀
- [ ] 5% rollout (1 týždeň)
- [ ] 25% rollout (1 týždeň)
- [ ] 50% rollout (1 týždeň)
- [ ] 100% rollout (2 týždne)
- [ ] Stabilizácia (2 týždne)
- [ ] V1 removal (po 1 mesiaci)

---

## 📁 ŠTRUKTÚRA SÚBOROV V2

```bash
# BACKEND - Nové súbory (nevytvárať zatiaľ, len plán)
/backend/src/
├── services/
│   ├── photo-service-v2.ts         # ✅ Týždeň 1
│   └── pdf-service-v2.ts           # ✅ Týždeň 2
├── queues/
│   ├── setup.ts                    # ✅ Týždeň 1
│   ├── photo-processor.ts          # ✅ Týždeň 1
│   └── pdf-builder.ts              # ✅ Týždeň 2
├── workers/
│   ├── derivative-worker.ts        # ✅ Týždeň 1
│   └── manifest-worker.ts          # ✅ Týždeň 2
└── utils/
    ├── sharp-processor.ts          # ✅ Týždeň 1
    ├── hash-calculator.ts          # ✅ Týždeň 2
    └── pdf-a-generator.ts          # ✅ Týždeň 2

# FRONTEND - Nové komponenty
/src/
├── components/
│   ├── protocols/
│   │   ├── v2/
│   │   │   ├── HandoverProtocolFormV2.tsx  # ✅ Týždeň 3
│   │   │   └── ReturnProtocolFormV2.tsx    # ✅ Týždeň 3
│   └── common/
│       └── v2/
│           └── SerialPhotoCaptureV2.tsx    # ✅ Týždeň 2
└── config/
    └── featureFlags.ts                     # ✅ Týždeň 1
```

---

## 🛠️ DETAILNÝ IMPLEMENTAČNÝ PLÁN

### **TÝŽDEŇ 1: Infraštruktúra** (16.1. - 22.1.)

#### Deň 1-2: Setup
```bash
# 1. Vytvor branch
git checkout -b feature/protocols-v2

# 2. Inštaluj dependencies
npm install bull bullmq ioredis sharp
npm install --save-dev @types/sharp

# 3. Docker compose
cat > docker-compose.dev.yml << EOF
version: '3.8'
services:
  redis:
    image: redis:alpine
    ports: ["6379:6379"]
  minio:
    image: minio/minio
    ports: ["9000:9000", "9001:9001"]
    environment:
      MINIO_ROOT_USER: minioadmin
      MINIO_ROOT_PASSWORD: minioadmin
    command: server /data --console-address ":9001"
EOF

# 4. Spusti
docker-compose -f docker-compose.dev.yml up -d
```

#### Deň 3-4: Feature Flags
```typescript
// /src/config/featureFlags.ts
export interface FeatureFlag {
  enabled: boolean;
  users: string[];
  percentage: number;
  startDate?: Date;
  endDate?: Date;
}

export class FeatureManager {
  private static instance: FeatureManager;
  
  private flags: Record<string, FeatureFlag> = {
    PROTOCOL_V2: {
      enabled: false,
      users: [],
      percentage: 0
    }
  };
  
  static getInstance(): FeatureManager {
    if (!this.instance) {
      this.instance = new FeatureManager();
    }
    return this.instance;
  }
  
  isEnabled(feature: string, userId?: string): boolean {
    const flag = this.flags[feature];
    if (!flag || !flag.enabled) return false;
    
    // Check specific users
    if (userId && flag.users.includes(userId)) return true;
    
    // Check percentage rollout
    if (flag.percentage > 0) {
      const hash = this.hashUserId(userId || 'anonymous');
      return (hash % 100) < flag.percentage;
    }
    
    return false;
  }
  
  private hashUserId(userId: string): number {
    let hash = 0;
    for (let i = 0; i < userId.length; i++) {
      hash = ((hash << 5) - hash) + userId.charCodeAt(i);
      hash = hash & hash;
    }
    return Math.abs(hash);
  }
}
```

#### Deň 5: Queue Setup
```typescript
// /backend/src/queues/setup.ts
import Queue from 'bull';
import Redis from 'ioredis';

const redis = new Redis({
  host: process.env.REDIS_HOST || 'localhost',
  port: parseInt(process.env.REDIS_PORT || '6379'),
  maxRetriesPerRequest: null
});

export const photoQueue = new Queue('photo-processing', { redis });
export const pdfQueue = new Queue('pdf-generation', { redis });

// Health check
export async function checkQueues(): Promise<boolean> {
  try {
    await photoQueue.isReady();
    await pdfQueue.isReady();
    return true;
  } catch (error) {
    console.error('Queue health check failed:', error);
    return false;
  }
}
```

### **TÝŽDEŇ 2: Photo Processing** (23.1. - 29.1.)

#### Deň 1-2: Sharp Processor
```typescript
// /backend/src/utils/sharp-processor.ts
import sharp from 'sharp';
import crypto from 'crypto';

export interface DerivativeConfig {
  thumb: { width: 150, height: 150, quality: 60 };
  gallery: { width: 1280, quality: 80 };
  pdf: { width: 960, quality: 75 };
}

export class ImageProcessor {
  async generateDerivatives(
    inputBuffer: Buffer,
    config = DerivativeConfig
  ): Promise<{
    thumb: Buffer;
    gallery: Buffer;
    pdf: Buffer;
    hash: string;
    metadata: sharp.Metadata;
  }> {
    const metadata = await sharp(inputBuffer).metadata();
    const hash = crypto.createHash('sha256')
      .update(inputBuffer)
      .digest('hex');
    
    const [thumb, gallery, pdf] = await Promise.all([
      sharp(inputBuffer)
        .resize(config.thumb.width, config.thumb.height, {
          fit: 'cover',
          position: 'center'
        })
        .webp({ quality: config.thumb.quality })
        .toBuffer(),
        
      sharp(inputBuffer)
        .resize(config.gallery.width, null, {
          withoutEnlargement: true
        })
        .jpeg({ quality: config.gallery.quality })
        .toBuffer(),
        
      sharp(inputBuffer)
        .resize(config.pdf.width, null, {
          withoutEnlargement: true
        })
        .jpeg({ quality: config.pdf.quality })
        .toBuffer()
    ]);
    
    return { thumb, gallery, pdf, hash, metadata };
  }
}
```

#### Deň 3-4: Worker Implementation
```typescript
// /backend/src/workers/derivative-worker.ts
import { photoQueue } from '../queues/setup';
import { ImageProcessor } from '../utils/sharp-processor';
import { r2Storage } from '../utils/r2-storage';

const processor = new ImageProcessor();

photoQueue.process('generate-derivatives', async (job) => {
  const { originalKey, protocolId, photoId } = job.data;
  
  try {
    // Download original
    const originalBuffer = await r2Storage.getFile(originalKey);
    if (!originalBuffer) {
      throw new Error(`Original file not found: ${originalKey}`);
    }
    
    // Generate derivatives
    const derivatives = await processor.generateDerivatives(originalBuffer);
    
    // Upload derivatives
    const basePath = originalKey.replace(/\/[^\/]+$/, '');
    const uploadPromises = [
      r2Storage.uploadFile(
        `${basePath}/thumb/${photoId}.webp`,
        derivatives.thumb,
        'image/webp'
      ),
      r2Storage.uploadFile(
        `${basePath}/gallery/${photoId}.jpg`,
        derivatives.gallery,
        'image/jpeg'
      ),
      r2Storage.uploadFile(
        `${basePath}/pdf/${photoId}.jpg`,
        derivatives.pdf,
        'image/jpeg'
      )
    ];
    
    const [thumbUrl, galleryUrl, pdfUrl] = await Promise.all(uploadPromises);
    
    // Update database
    await updatePhotoRecord(photoId, {
      thumbUrl,
      galleryUrl,
      pdfUrl,
      hash: derivatives.hash,
      metadata: derivatives.metadata,
      processedAt: new Date()
    });
    
    return { success: true, photoId };
  } catch (error) {
    console.error(`Failed to process photo ${photoId}:`, error);
    throw error;
  }
});
```

### **TÝŽDEŇ 3: Frontend V2 Components** (30.1. - 5.2.)

#### SerialPhotoCaptureV2
```typescript
// /src/components/common/v2/SerialPhotoCaptureV2.tsx
import { useState, useCallback } from 'react';
import { useFeatureFlag } from '../../../hooks/useFeatureFlag';

export const SerialPhotoCaptureV2: React.FC<Props> = (props) => {
  const [uploadQueue, setUploadQueue] = useState<QueueItem[]>([]);
  const [previews, setPreviews] = useState<Preview[]>([]);
  
  const handleCapture = useCallback(async (file: File) => {
    // 1. Generate instant preview
    const preview = await generateLocalPreview(file);
    setPreviews(prev => [...prev, preview]);
    
    // 2. Add to upload queue
    const queueItem: QueueItem = {
      id: uuidv4(),
      file,
      status: 'pending',
      progress: 0,
      retries: 0
    };
    
    setUploadQueue(prev => [...prev, queueItem]);
    
    // 3. Start background upload
    processQueueItem(queueItem);
  }, []);
  
  const processQueueItem = async (item: QueueItem) => {
    try {
      // Get presigned URL
      const { uploadUrl, finalUrl } = await getPresignedUrl(item.file);
      
      // Upload with progress
      await uploadWithProgress(item.file, uploadUrl, (progress) => {
        updateQueueItemProgress(item.id, progress);
      });
      
      // Trigger derivative generation
      await triggerDerivativeGeneration(finalUrl);
      
      // Mark as complete
      updateQueueItemStatus(item.id, 'completed');
    } catch (error) {
      handleUploadError(item, error);
    }
  };
  
  // ... rest of component
};
```

### **TÝŽDEŇ 4-5: Testing & Migration** (6.2. - 19.2.)

#### Test Suite
```typescript
// /tests/v2/integration.test.ts
describe('Protocol V2 Integration Tests', () => {
  beforeAll(async () => {
    await setupTestEnvironment();
  });
  
  describe('Photo Processing', () => {
    it('should generate all derivatives', async () => {
      const testPhoto = await loadTestPhoto();
      const result = await processPhoto(testPhoto);
      
      expect(result).toHaveProperty('thumb');
      expect(result).toHaveProperty('gallery');
      expect(result).toHaveProperty('pdf');
      expect(result.hash).toMatch(/^[a-f0-9]{64}$/);
    });
    
    it('should handle network failures gracefully', async () => {
      mockNetworkFailure();
      const result = await processPhotoWithRetry(testPhoto);
      expect(result.attempts).toBeGreaterThan(1);
      expect(result.success).toBe(true);
    });
  });
  
  describe('V1 Compatibility', () => {
    it('should read V1 protocols in V2 system', async () => {
      const v1Protocol = await createV1Protocol();
      const loaded = await loadInV2System(v1Protocol.id);
      expect(loaded).toBeDefined();
    });
  });
});
```

---

## 📊 MONITORING & METRIKY

### Kľúčové metriky na sledovanie:
```typescript
// /src/monitoring/metrics.ts
export const METRICS = {
  // Performance
  'protocol.pdf.generation.time': { unit: 'ms', alert: '>5000' },
  'protocol.photo.upload.time': { unit: 'ms', alert: '>3000' },
  'protocol.derivative.generation.time': { unit: 'ms', alert: '>2000' },
  
  // Reliability
  'protocol.creation.success.rate': { unit: '%', alert: '<95' },
  'protocol.queue.failure.rate': { unit: '%', alert: '>5' },
  
  // Usage
  'protocol.version.distribution': { unit: 'count' },
  'protocol.photos.per.protocol': { unit: 'avg' },
  
  // Storage
  'storage.usage.total': { unit: 'GB' },
  'storage.savings.percentage': { unit: '%' }
};
```

---

## 🚨 ROLLBACK PLÁN

### Okamžitý rollback (< 1 minúta):
```bash
# 1. Environment variable
kubectl set env deployment/backend FORCE_PROTOCOL_V1=true

# 2. Restart pods
kubectl rollout restart deployment/backend
```

### Postupný rollback:
```typescript
// Zníženie percentage
await updateFeatureFlag('PROTOCOL_V2', {
  percentage: 0,
  users: [] // Len internal testing
});
```

---

## 📝 DENNÝ PROGRESS LOG

### Template pre denný záznam:
```markdown
## Dátum: [DÁTUM]
### Dokončené: ✅
- [ ] Task 1
- [ ] Task 2

### V progrese: 🔧
- [ ] Task 3

### Blokery: 🚫
- Issue 1: Popis + riešenie

### Zajtra:
- [ ] Task 4
- [ ] Task 5

### Poznámky:
- ...
```

---

## 🎯 DEFINITION OF DONE

Pre každú feature:
1. ✅ Kód napísaný a otestovaný lokálne
2. ✅ Unit testy (coverage > 80%)
3. ✅ Integration testy
4. ✅ Code review
5. ✅ Dokumentácia aktualizovaná
6. ✅ Performance test (nie horšie ako V1)
7. ✅ Staging test (min 3 dni)
8. ✅ Rollback test vykonaný

---

## 📞 KOMUNIKAČNÝ PLÁN

### Interná komunikácia:
- **Daily standup**: 9:00 (15 min)
- **Weekly review**: Piatok 14:00
- **Slack channel**: #protocol-v2-migration

### Užívateľská komunikácia:
- **2 týždne pred**: Announcement o vylepšeniach
- **1 týždeň pred**: Tutorial/video
- **D-Day**: Email early adopters
- **Po nasadení**: Feedback survey

---

## 🔗 UŽITOČNÉ LINKY

- [Sharp Documentation](https://sharp.pixelplumbing.com/)
- [BullMQ Guide](https://docs.bullmq.io/)
- [PDF/A Specification](https://www.pdfa.org/)
- [Feature Flags Best Practices](https://martinfowler.com/articles/feature-toggles.html)

---

## 💾 ZÁLOHOVANIE

Tento plán je uložený ako:
- `/workspace/PROTOCOL_V2_MIGRATION_PLAN.md`
- Git commit s tagom: `protocol-v2-plan-v1.0`
- Backup v Google Docs (zdieľaný)

---

**REMEMBER**: 
- Vždy robiť malé, incrementálne zmeny
- Testovať každý krok
- Mať rollback plán
- Komunikovať progress

**Začíname zajtra 16.1.2025! 🚀**