# 🧪 Testing Instructions - Progressive Photo Upload

## 📋 Pre-requisites

1. **Backend server running**
   ```bash
   cd backend
   npm run dev
   ```

2. **Frontend server running**
   ```bash
   cd apps/web
   npm run dev
   ```

3. **Auth token** (získaj z browser DevTools → Application → Local Storage → `blackrent_token`)

---

## 🖥️ Backend Endpoint Test

### Krok 1: Priprav test image

```bash
# Skopíruj existujúcu fotku alebo stiahni test image
cp vehicle-1.jpg test-image.jpg

# Alebo vytvor test image online:
# https://via.placeholder.com/1920x1080.jpg
```

### Krok 2: Nastav environment variables

```bash
export AUTH_TOKEN="your-token-here"
export API_BASE_URL="http://localhost:3000"
export TEST_IMAGE_PATH="./test-image.jpg"
```

### Krok 3: Spusti test script

```bash
node test-progressive-upload.js
```

### Očakávaný output

```
🧪 Testing Progressive Photo Upload Endpoint

Configuration:
  API Base URL: http://localhost:3000
  Test Image: ./test-image.jpg
  Protocol ID: test-protocol-1234567890
  Protocol Type: handover
  Media Type: vehicle

📤 Test 1: Upload single photo...
✅ Test 1 PASSED
   Photo ID: 1234567890_abc123
   WebP URL: https://...
   JPEG URL: https://...
   Original Size: 2500.00 KB
   WebP Size: 450.00 KB
   JPEG Size: 320.00 KB
   Compression Time: 250 ms
   Upload Time: 150 ms
   Total Time: 400 ms

📤 Test 2: Upload 3 photos progressively...
   Uploading photo 1/3...
   ✅ Photo 1 uploaded (400ms)
   Uploading photo 2/3...
   ✅ Photo 2 uploaded (380ms)
   Uploading photo 3/3...
   ✅ Photo 3 uploaded (390ms)
✅ Test 2 PASSED
   All photos uploaded successfully
   Average time per photo: 390 ms

📤 Test 3: Test error handling...
✅ Test 3 PASSED: Error handling works correctly
   Error: Invalid mediaType: invalid_media_type

🎉 All tests PASSED!

✅ Progressive upload endpoint is working correctly
✅ Server-side compression is working
✅ Error handling is working
```

---

## 📱 Frontend Component Test (Desktop)

### Krok 1: Aktivuj feature flag

```bash
# apps/web/.env.local
VITE_USE_PROGRESSIVE_UPLOAD=true
```

### Krok 2: Restart frontend server

```bash
cd apps/web
npm run dev
```

### Krok 3: Otvor aplikáciu

```
http://localhost:5173
```

### Krok 4: Test upload

1. Prihlás sa do aplikácie
2. Choď na **Protokoly** → **Nový handover protokol**
3. Vyber vozidlo a zákazníka
4. Klikni na **"Vybrať fotky"** (Vehicle photos)
5. Vyber 10 fotiek
6. Klikni na **"Nahrať"**
7. Sleduj progress bar

### Očakávané správanie

- ✅ Progress bar sa zobrazuje pre každú fotku
- ✅ Status sa mení: pending → uploading → success
- ✅ Štatistiky sa aktualizujú (celkom/úspešné/zlyhané)
- ✅ Všetky fotky sa nahrajú (100% success rate)
- ✅ Success alert sa zobrazí po dokončení

---

## 📱 Frontend Component Test (Mobile)

### Krok 1: Získaj local IP address

```bash
# macOS/Linux
ifconfig | grep "inet " | grep -v 127.0.0.1

# Windows
ipconfig | findstr IPv4
```

### Krok 2: Nastav Vite server pre network access

```bash
# apps/web/package.json
"dev": "vite --host 0.0.0.0"
```

### Krok 3: Restart frontend server

```bash
cd apps/web
npm run dev
```

### Krok 4: Otvor na mobile

```
http://YOUR_LOCAL_IP:5173
```

Príklad: `http://192.168.1.100:5173`

### Krok 5: Test upload na mobile

1. Prihlás sa do aplikácie
2. Choď na **Protokoly** → **Nový handover protokol**
3. Vyber vozidlo a zákazníka
4. Klikni na **"Vybrať fotky"** (Vehicle photos)
5. Vyber 20 fotiek z galérie
6. Klikni na **"Nahrať"**
7. Sleduj progress

### Očakávané správanie (Mobile)

- ✅ Žiadne browser crashes
- ✅ Všetky fotky sa nahrajú (100% success rate)
- ✅ Progress bar funguje správne
- ✅ Retry funguje pre zlyhané fotky
- ✅ Memory usage < 100 MB

---

## 🔄 Retry Mechanism Test

### Krok 1: Simuluj network error

1. Otvor DevTools → Network tab
2. Nastav throttling na "Offline"
3. Vyber fotky a klikni "Nahrať"
4. Počkaj kým zlyhajú
5. Nastav throttling na "Online"
6. Klikni "Retry"

### Očakávané správanie

- ✅ Fotky zlyhaú s error status
- ✅ Retry button sa zobrazí
- ✅ Po kliknutí na Retry sa fotky nahrajú úspešne
- ✅ Max 3 retry attempts pre každú fotku

---

## 📊 Performance Test

### Test 1: Upload 50 fotiek (Desktop)

```
Očakávaný čas: 3-5 minút
Očakávaná success rate: 99-100%
Očakávaný memory usage: < 200 MB
```

### Test 2: Upload 20 fotiek (Mobile)

```
Očakávaný čas: 2-4 minúty
Očakávaná success rate: 99-100%
Očakávaný memory usage: < 100 MB
```

### Test 3: Pomalé pripojenie (3G)

```
DevTools → Network → Throttling → Slow 3G
Očakávaný čas: 5-10 minút (20 fotiek)
Očakávaná success rate: 95-100%
```

---

## 🐛 Troubleshooting

### Backend endpoint nefunguje

```bash
# Skontroluj backend logy
tail -f backend/logs/app.log

# Skontroluj že Sharp je nainštalovaný
cd backend
npm list sharp

# Reinstall ak treba
npm install sharp
```

### Frontend komponent sa nezobrazuje

```bash
# Skontroluj že feature flag je zapnutý
cat apps/web/.env.local | grep VITE_USE_PROGRESSIVE_UPLOAD

# Skontroluj browser console
# Malo by byť: "✅ Using NEW ProgressivePhotoUploader"
```

### Fotky sa nenahráva

```bash
# Skontroluj network tab v DevTools
# Malo by byť: POST /api/files/progressive-upload

# Skontroluj auth token
# Malo by byť v Authorization header

# Skontroluj backend logy
tail -f backend/logs/app.log
```

---

## ✅ Test Checklist

### Backend
- [ ] Test script passes all tests
- [ ] Compression works (WebP + JPEG)
- [ ] Upload to R2 works
- [ ] Error handling works

### Frontend (Desktop)
- [ ] Component renders correctly
- [ ] File selection works
- [ ] Upload progress shows correctly
- [ ] Success rate 99-100%
- [ ] Retry works for failed uploads

### Frontend (Mobile)
- [ ] No browser crashes
- [ ] All photos upload successfully
- [ ] Progress tracking works
- [ ] Memory usage < 100 MB
- [ ] Works on iOS Safari
- [ ] Works on Android Chrome

### Integration
- [ ] Photos appear in protocol form
- [ ] PDF generation works with new photos
- [ ] Photos appear in gallery
- [ ] Database saves correctly

---

## 🎉 Success Criteria

- ✅ Backend test script passes
- ✅ Desktop upload: 50 fotiek, 100% success
- ✅ Mobile upload: 20 fotiek, 100% success, no crashes
- ✅ Retry mechanism works
- ✅ PDF generation works
- ✅ User feedback positive

---

## 📝 Report Results

Po testovaní vyplň:

```
✅ Backend Tests: PASS / FAIL
✅ Desktop Tests: PASS / FAIL  
✅ Mobile Tests (iOS): PASS / FAIL
✅ Mobile Tests (Android): PASS / FAIL
✅ Retry Tests: PASS / FAIL
✅ Performance Tests: PASS / FAIL

Notes:
- 
-
-

Issues Found:
-
-
-

Recommendation: DEPLOY / FIX ISSUES / ROLLBACK
```

---

## 🚀 Ready to Deploy?

Ak všetky testy prejdú:

1. ✅ Commit changes
2. ✅ Push to staging
3. ✅ Test on staging
4. ✅ Deploy to production
5. ✅ Monitor metrics
6. ✅ Collect user feedback

**Hotovo!** 🎉

