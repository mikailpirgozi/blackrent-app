# 📐 Kompaktný dizajn - Implementačný plán

## 🎯 Cieľ:
Zmestiť celý EDIT formulár na 1 stránku bez scrollovania

## 📊 Aktuálny problém:
- Header: veľký (p-4, mb-6)
- Každá sekcia: samostatná Card (p-6, gap-6)  
- Polia: veľké spacing (space-y-2, gap-4)
- Alerts: veľké (p-4, mb-4)
- Buttons: veľké (h-12, px-8)
- **Celkovo:** ~1200px výška → SCROLL ❌

## ✅ Riešenie:

### 1. Kompaktný Header
```
Pred: p-4 mb-6 → 80px
Po: p-2 mb-2 → 40px
Úspora: 40px
```

### 2. Jedna Card namiesto viacerých
```
Pred: 4 Cards (Základné, Biela karta, Platnosť, KM, Upload)
Po: 1 Card so sekciami
Úspora: ~120px (4x padding + margins)
```

### 3. Kompaktné polia
```
Pred: Label + Input (space-y-2) + hint → 80px
Po: Label + Input (space-y-1) + hint → 60px
Úspora: 20px × 10 polí = 200px
```

### 4. Menšie Alerts
```
Pred: p-4 mb-4 → 60px
Po: p-2 mb-2 → 30px
Úspora: 30px × 3 alerts = 90px
```

### 5. Kompaktné Buttons
```
Pred: h-12 px-8 → 48px
Po: h-10 px-6 → 40px
Úspora: 8px
```

### 6. Grid 3 columns namiesto 2
```
Pred: 2 columns → každé pole na vlastnom riadku
Po: 3 columns → viac polí na riadku
Úspora: ~150px
```

### 7. Odstrániť zbytočné hints
```
Pred: Každé pole má hint
Po: Len dôležité polia majú hint
Úspora: ~100px
```

## 📐 Celková úspora:
40 + 120 + 200 + 90 + 8 + 150 + 100 = **708px!**

**Z 1200px → 492px = zmestí sa na 1 stránku! ✅**

---

## 🎯 Implementácia:

Kompaktný layout pre UnifiedDocumentForm:

```tsx
<div className="p-3 max-h-[85vh] overflow-y-auto">
  {/* Compact header: p-2 mb-2 */}
  <div className="p-2 mb-2 gradient-header">...</div>
  
  {/* Single card */}
  <Card className="p-3">
    {/* Section 1: Základné - grid-cols-3 */}
    <div className="grid grid-cols-3 gap-2">
      <VehicleCombobox /> {/* Col 1-2 */}
      <TypeSelect />     {/* Col 3 */}
    </div>
    
    <Separator className="my-2" />
    
    {/* Section 2: Insurance - grid-cols-3 */}
    {isInsurance && (
      <div className="grid grid-cols-3 gap-2">
        <PolicyNumber />
        <InsurerManagement />
        <Frequency />
      </div>
    )}
    
    <Separator className="my-2" />
    
    {/* Section 3: Dates - grid-cols-3 */}
    <div className="grid grid-cols-3 gap-2">
      <ValidFrom />
      <ValidTo />
      <Price />
    </div>
    
    {/* Section 4: Green card (PZP) - grid-cols-2 */}
    {isPZP && (
      <>
        <Separator className="my-2" />
        <Alert compact /> 
        <div className="grid grid-cols-2 gap-2">
          <GreenFrom />
          <GreenTo />
        </div>
      </>
    )}
    
    {/* Section 5: KM - inline */}
    {hasKmField && (
      <>
        <Separator className="my-2" />
        <Input km compact />
      </>
    )}
    
    {/* Section 6: Notes - full width */}
    <Separator className="my-2" />
    <Textarea notes rows={2} />
    
    {/* Section 7: Upload - compact */}
    <Separator className="my-2" />
    <R2FileUpload compact />
    
    {/* Buttons - compact */}
    <div className="flex gap-2 mt-3">
      <Button h-10 />
    </div>
  </Card>
</div>
```

---

Pokračujem s implementáciou...

