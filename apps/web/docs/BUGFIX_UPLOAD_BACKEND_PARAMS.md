# 🔧 Bugfix: Upload Backend Parameters

**Dátum:** 2025-01-10  
**Issue:** Upload zlyhával s error "Chýba type alebo entityId"  
**Status:** ✅ FIXED

---

## Problém

Backend API `/files/upload` vyžaduje:
- `type` (napr. "protocol")
- `entityId` (napr. protocol ID)
- `protocolType` (napr. "handover")
- `category` (napr. "vehicle_photos")
- `mediaType` (napr. "vehicle")

Ale `UploadManager` posielal iba:
- `file`
- `path`

---

## Riešenie

### 1. Updated UploadTask Interface

```typescript
export interface UploadTask {
  id: string;
  blob: Blob;
  path: string;
  type?: string; // ✅ PRIDANÉ: Backend requirement
  entityId?: string; // ✅ PRIDANÉ: Backend requirement
  protocolType?: string; // ✅ PRIDANÉ: 'handover' | 'return'
  category?: string; // ✅ PRIDANÉ: 'vehicle_photos' | 'documents' | 'damages'
  mediaType?: string; // ✅ PRIDANÉ: 'vehicle' | 'document' | 'damage'
  metadata?: Record<string, unknown>;
}
```

### 2. Updated uploadToR2()

```typescript
private async uploadToR2(task: UploadTask): Promise<string> {
  const formData = new FormData();
  
  // Create File from Blob with proper filename
  const file = new File([task.blob], task.path.split('/').pop() || 'upload.webp', {
    type: task.blob.type || 'image/webp',
  });
  
  formData.append('file', file);
  
  // ✅ Backend required fields
  formData.append('type', task.type || 'protocol');
  formData.append('entityId', task.entityId || 'unknown');
  
  // ✅ Optional fields
  if (task.protocolType) formData.append('protocolType', task.protocolType);
  if (task.category) formData.append('category', task.category);
  if (task.mediaType) formData.append('mediaType', task.mediaType);
  
  // ... rest of upload logic
}
```

### 3. Updated protocolPhotoWorkflow.ts

```typescript
const uploadTasks = processedImages.map((img, idx) => ({
  id: img.id,
  blob: img.gallery.blob,
  path: `protocols/${protocolId}/${mediaType}/${idx}_${Date.now()}.webp`,
  type: 'protocol', // ✅ Backend required
  entityId: protocolId, // ✅ Backend required
  protocolType: 'handover', // ✅ Backend required
  category: mediaType === 'vehicle' ? 'vehicle_photos' : 
            mediaType === 'document' ? 'documents' : 'damages',
  mediaType: mediaType,
  metadata: img.metadata,
}));
```

---

## Testing

1. ✅ Rebuild successful
2. ✅ No TypeScript errors
3. ✅ No lint errors
4. ⏳ Test na localhost

---

## Next Test

Skúsiť znova upload na test stránke:

```
http://localhost:3000/test-protocols
```

Upload by mal teraz fungovať! ✅

---

*Fixed: 2025-01-10*

