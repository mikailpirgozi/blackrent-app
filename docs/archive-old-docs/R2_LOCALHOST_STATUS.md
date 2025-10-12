# ✅ R2 Storage - Localhost Setup Status

## BACKEND Configuration (/backend/.env)

```env
# ✅ R2 is ALREADY CONFIGURED for localhost!
R2_ENDPOINT=https://0a8a2b35935b3b9aca17baf2f6ced3c5.r2.cloudflarestorage.com
R2_ACCESS_KEY_ID=101b1b96332f7216f917c269f2ae1fc8
R2_SECRET_ACCESS_KEY=5d03a6a396171324658c402b8758f5bae2364fe0bb7e5cc91d6ea8661c34cc69
R2_BUCKET_NAME=blackrent-storage
R2_ACCOUNT_ID=9ccdca0d876e24bd9acefabe56f94f53
R2_PUBLIC_URL=https://pub-4fec120a8a6a4a0cbadfa55f54b7e8a2.r2.dev
```

## FRONTEND Configuration (/apps/web/.env)

```env
# ✅ Frontend is configured to use localhost backend
VITE_API_URL=http://localhost:3001/api
```

---

## 🚀 How to Test R2 on Localhost

### 1. Start Backend (Terminal 1):
```bash
cd backend
npm run dev
# or
pnpm dev
```

**Expected output:**
```
✅ R2 Storage configured successfully
Server running on port 3001
```

### 2. Start Frontend (Terminal 2):
```bash
cd apps/web
npm run dev
# or
pnpm dev
```

### 3. Test Upload:
1. Go to: http://localhost:5173
2. Open a protocol (handover/return)
3. Click "Fotky vozidla"
4. Upload 3 photos

### 4. Check Console Logs:

**Upload phase:**
```
🔵 [UPLOAD] Starting compression for: {imageId: 'img-...'}
🟡 [COMPRESS] Starting compression: {fileType: 'image/jpeg'}
🟡 [COMPRESS] Saving to IndexedDB: {imageId: 'img-...', compressedSize: 45}
✅ [COMPRESS] Saved to IndexedDB successfully
🟢 [UPLOAD] Compression done, returning result
```

**PDF generation:**
```
🔍 [PDF] Looking for image in IndexedDB: {imageId: 'img-...'}
🔍 [PDF] IndexedDB result: {found: true, hasPdfData: true, pdfDataLength: 67890}
✅ [PDF] Image loaded from IndexedDB: {size: '45 KB'}
```

---

## ✅ Summary

| Component | Status | Location |
|-----------|--------|----------|
| Backend R2 | ✅ Configured | `/backend/.env` |
| Frontend API | ✅ Configured | `/apps/web/.env` |
| R2 Bucket | ✅ blackrent-storage | Cloudflare |
| Public URL | ✅ Active | https://pub-4fec120a8a6a4a0cbadfa55f54b7e8a2.r2.dev |

**Everything is ready for localhost testing with R2!** 🎉

---

## 🐛 If Upload Fails

Check backend logs for:
- `❌ R2 upload failed` → Check R2 credentials
- `Connection refused` → Is backend running?
- `CORS error` → Check R2 bucket CORS settings

