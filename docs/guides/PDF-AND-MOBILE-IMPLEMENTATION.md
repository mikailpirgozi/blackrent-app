# 📄 PDF Protokoly s Fotkami + 📱 Mobilné Uploady

## 🎯 Implementované Funkcie

### ✅ 1. PDF Generovanie s R2 Fotkami

#### **PDFGenerator Class**
- **Lokalizácia:** `src/utils/pdfGenerator.ts`
- **Funkcie:**
  - Generovanie PDF protokolov s vloženými fotkami z R2
  - Podpora pre obrázky, dokumenty a podpisy
  - Automatické rozloženie stránok
  - Kvalita a veľkosti obrázkov nastaviteľné
  - Slovenská lokalizácia

#### **PDF Obsah:**
- 📋 Základné informácie o prenájme
- 🚗 Stav vozidla (kilometre, palivo, stav)
- 📸 Fotodokumentácia vozidla (2 obrázky na riadok)
- 📄 Dokumenty (2 obrázky na riadok)
- ⚠️ Škody a poškodenia
- 📝 Poznámky
- ✍️ Podpisy
- 📅 Časová pečiatka

#### **Integrácia do Protokolov:**
- **Tlačidlo:** "Generovať PDF" v HandoverProtocolForm
- **Automatický download** s názvom: `protokol_prevzatie_{ID}_{DÁTUM}.pdf`
- **R2 fotky** sa načítavajú priamo z Cloudflare URL

### ✅ 2. Mobilné Uploady

#### **MobileFileUpload Component**
- **Lokalizácia:** `src/components/common/MobileFileUpload.tsx`
- **Funkcie:**
  - 📱 Detekcia mobilného zariadenia
  - 📷 Kamera s prednou/zadnou kamerou
  - ⚡ Flash ovládanie
  - 🎥 Video nahrávanie (5s)
  - 📁 Galéria výber
  - 🖼️ Preview zachytených súborov
  - ☁️ Priamy upload do R2

#### **Mobilné Funkcie:**
- **Kamera:** Fullscreen kamera s ovládacími tlačidlami
- **Galéria:** Výber z existujúcich súborov
- **Capture:** `capture="environment"` pre zadnú kameru
- **Preview:** Grid zobrazenie s možnosťou mazania
- **Upload:** Batch upload všetkých zachytených súborov

#### **Integrácia do Protokolov:**
- **Sekcia:** "📱 Mobilný Upload (Kamera + Galéria)"
- **Dva uploady:** Vozidlo + Dokumenty
- **Automatické pridanie** do protokolu po úspešnom uploadu

## 🚀 Použitie

### PDF Generovanie
```typescript
// V HandoverProtocolForm
const handleGeneratePDF = async () => {
  const pdfGenerator = new PDFGenerator();
  const pdfBlob = await pdfGenerator.generateProtocolPDF(protocolData, {
    includeImages: true,
    includeSignatures: true,
    imageQuality: 0.8,
    maxImageWidth: 80,
    maxImageHeight: 60
  });
  
  // Automatický download
  const url = URL.createObjectURL(pdfBlob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `protokol_prevzatie_${protocol.id}_${date}.pdf`;
  link.click();
};
```

### Mobilný Upload
```typescript
// V HandoverProtocolForm
<MobileFileUpload
  type="protocol"
  entityId={rental.id}
  onUploadSuccess={(fileData) => {
    setProtocol(prev => ({
      ...prev,
      vehicleImages: [...prev.vehicleImages, {
        id: uuidv4(),
        url: fileData.url,
        type: 'vehicle',
        filename: fileData.filename,
        timestamp: new Date(),
        uploadedAt: new Date()
      }]
    }));
  }}
  acceptedTypes={['image/jpeg', 'image/png', 'image/webp']}
  maxSize={10}
  multiple={true}
/>
```

## 📱 Mobilné Funkcie

### Detekcia Zariadenia
```typescript
const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
const hasCamera = !!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia);
```

### Kamera Ovládanie
- **Spustenie:** `navigator.mediaDevices.getUserMedia()`
- **Fotografovanie:** Canvas capture z video stream
- **Zmena kamery:** `facingMode: 'user' | 'environment'`
- **Flash:** `torch` constraint (ak podporované)

### Upload Flow
1. **Zachytanie** → Canvas/File API
2. **Preview** → URL.createObjectURL()
3. **Upload** → FormData do R2
4. **Callback** → Pridanie do protokolu
5. **Cleanup** → URL.revokeObjectURL()

## 🎨 UI/UX Funkcie

### PDF Tlačidlo
- **Pozícia:** Posledný krok protokolu
- **Ikonka:** `<PdfIcon />`
- **Štýl:** Outlined button
- **Loading:** CircularProgress počas generovania

### Mobilný Upload UI
- **Tlačidlá:** Kamera + Galéria (Grid layout)
- **Preview:** Card grid s obrázkami
- **Ovládanie:** Delete tlačidlá
- **Upload:** Batch upload tlačidlo

### Kamera Dialog
- **Fullscreen:** Čierne pozadie
- **Video:** Centrované, responsive
- **Ovládanie:** FAB tlačidlá (fotografovať, zmeniť kameru, flash)
- **Zatvorenie:** X tlačidlo v header

## 🔧 Technické Detaily

### PDF Generovanie
- **Knižnica:** jsPDF + jspdf-autotable
- **Obrázky:** Canvas konverzia z R2 URL
- **Rozloženie:** 2 obrázky na riadok, automatické stránky
- **Kvalita:** JPEG 0.8, max 80x60mm

### Mobilné Upload
- **API:** MediaDevices API
- **Formát:** JPEG pre fotky, WebM pre video
- **Veľkosť:** 1920x1080 ideal
- **Kompresia:** 0.8 kvalita

### R2 Integrácia
- **Upload:** Priamy upload do R2 bucket
- **URL:** Public R2 URL pre PDF obrázky
- **Metadata:** Filename, timestamp, type

## 📊 Výhody

### PDF s Fotkami
- ✅ **Profesionálne protokoly** s fotkami
- ✅ **Právna platnosť** - fotky sú súčasťou PDF
- ✅ **Offline dostupné** - všetko v jednom súbore
- ✅ **Tlačiteľné** - pripravené na tlač
- ✅ **Archivovanie** - kompletné záznamy

### Mobilné Uploady
- ✅ **Rýchle fotenie** - priamo v aplikácii
- ✅ **Kvalitné fotky** - 1920x1080 rozlíšenie
- ✅ **Offline podpora** - galéria výber
- ✅ **Batch upload** - viacero súborov naraz
- ✅ **Preview** - kontrola pred uploadom

## 🎯 Ďalšie Kroky

### Možné Rozšírenia
1. **Video nahrávanie** - dlhšie videá
2. **GPS lokácia** - automatické pridanie súradníc
3. **OCR** - čítanie textu z fotiek
4. **Filtre** - úprava fotiek pred uploadom
5. **Offline queue** - upload po obnovení internetu

### Optimalizácie
1. **Lazy loading** - načítanie obrázkov na požiadanie
2. **WebP konverzia** - menšie súbory
3. **Progressive upload** - upload počas fotografovania
4. **Cache** - lokálne ukladanie preview

## 🚀 Deployment

### Railway
- ✅ **Automatický deploy** cez GitHub
- ✅ **Environment variables** pre R2
- ✅ **HTTPS** pre kamera API

### Vercel
- ✅ **Frontend deploy** s novými komponentmi
- ✅ **API routes** pre R2 upload
- ✅ **CORS** nastavené pre kamera

---

**🎉 PDF protokoly s fotkami a mobilné uploady sú plne implementované a pripravené na používanie!** 