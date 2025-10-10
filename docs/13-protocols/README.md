# 📄 Protocols Documentation

Dokumentácia pre Protocol V1 a V2 systém - handover a return protokoly.

## 📂 Obsah

### Protocol V2 Documentation
- **[HOW_TO_USE_V2_IN_CODE.md](./HOW_TO_USE_V2_IN_CODE.md)** - Ako používať V2 v kóde
- **[KOMPLETNY_V2_IMPLEMENTACNY_PLAN.md](./KOMPLETNY_V2_IMPLEMENTACNY_PLAN.md)** - Kompletný V2 implementačný plán
- **[V2_MAPPING_TABLE.md](./V2_MAPPING_TABLE.md)** - V2 mapping tabuľka
- **[TESTING_V2_IN_PRODUCTION.md](./TESTING_V2_IN_PRODUCTION.md)** - Testovanie V2 v produkcii

### Protocol Analysis
- **[PROTOKOLY_DETAILNA_ANALYZA.md](./PROTOKOLY_DETAILNA_ANALYZA.md)** - Detailná analýza protokolov
- **[PROTOKOLY_EFEKTIVNE_RIESENIE.md](./PROTOKOLY_EFEKTIVNE_RIESENIE.md)** - Efektívne riešenie protokolov
- **[V2_PROTOKOL_PROBLEMY_ZOZNAM.md](./V2_PROTOKOL_PROBLEMY_ZOZNAM.md)** - V2 protokol problémy

---

## 🎯 Protocol System Overview

BlackRent používa pokročilý protocol systém pre dokumentáciu odovzdania a vrátenia vozidiel.

### Protocol V1 (Legacy)
- Základná funkcionalita
- Jednoduché foto upload
- Manuálne generovanie PDF

### Protocol V2 (Current)
- **5 kategórií fotiek:**
  - Vehicle (exteriér)
  - Document (doklady)
  - Damage (poškodenia)
  - Odometer (tachometer)
  - Fuel (palivo)
- **Digitálne podpisy:** Employee + Customer
- **Automatické PDF generovanie** s watermark
- **Real-time progress tracking**
- **Enhanced error handling** s retry mechanizmom
- **Bulk retry funkcionalita**

---

## 🚀 Quick Start - Protocol V2

### 1. Vytvorenie Handover Protocol
```typescript
import { HandoverProtocolFormV2 } from '@/components/protocols';

// V rental detail page
<HandoverProtocolFormV2
  rentalId={rental.id}
  vehicleId={rental.vehicle_id}
  customerId={rental.customer_id}
  onSuccess={() => {
    // Refresh rental data
    queryClient.invalidateQueries(['rental', rentalId]);
  }}
/>
```

### 2. Vytvorenie Return Protocol
```typescript
import { ReturnProtocolFormV2 } from '@/components/protocols';

<ReturnProtocolFormV2
  rentalId={rental.id}
  vehicleId={rental.vehicle_id}
  customerId={rental.customer_id}
  handoverProtocolId={rental.handover_protocol_id}
  onSuccess={() => {
    // Refresh rental data
    queryClient.invalidateQueries(['rental', rentalId]);
  }}
/>
```

---

## 📸 Photo Categories

### Vehicle Photos
- Celkový pohľad na vozidlo
- Všetky strany (predok, zadok, ľavá, pravá)
- Interiér

### Document Photos
- Technický preukaz
- Zelená karta
- Ďalšie relevantné doklady

### Damage Photos
- Existujúce poškodenia
- Škrabance, promáčkliny
- Detailné zábery

### Odometer Photos
- Aktuálny stav kilometrov
- Jasne čitateľný

### Fuel Photos
- Úroveň paliva pri prevzatí/vrátení

---

## 🔄 Protocol Workflow

### Handover (Odovzdanie)
1. **Open Form** → Otvorenie handover formuláru
2. **Capture Photos** → Zachytenie fotiek vo všetkých kategóriách
3. **Review Photos** → Kontrola fotiek
4. **Add Signatures** → Pridanie podpisov (zamestnanec + zákazník)
5. **Generate PDF** → Automatické generovanie PDF protokolu
6. **Upload to R2** → Upload fotiek a PDF do Cloudflare R2
7. **Complete** → Uzavretie protokolu

### Return (Vrátenie)
1. **Open Form** → Otvorenie return formuláru
2. **Load Handover Data** → Načítanie dát z handover protokolu
3. **Capture Return Photos** → Zachytenie fotiek pri vrátení
4. **Compare Changes** → Porovnanie zmien oproti handover
5. **Add Signatures** → Pridanie podpisov
6. **Generate PDF** → Generovanie PDF protokolu
7. **Upload to R2** → Upload fotiek a PDF
8. **Calculate Damages** → Výpočet prípadných škôd
9. **Complete** → Uzavretie return protokolu

---

## 🛠️ API Endpoints

### Protocol V2 Endpoints
```
POST   /api/protocols/v2/handover/init         # Inicializácia handover
POST   /api/protocols/v2/handover/photo        # Upload handover fotky
POST   /api/protocols/v2/handover/complete     # Dokončenie handover
POST   /api/protocols/v2/handover/retry        # Retry failed operations

POST   /api/protocols/v2/return/init           # Inicializácia return
POST   /api/protocols/v2/return/photo          # Upload return fotky
POST   /api/protocols/v2/return/complete       # Dokončenie return
POST   /api/protocols/v2/return/retry          # Retry failed operations

GET    /api/protocols/v2/:protocolId           # Získanie protokolu
GET    /api/protocols/v2/:protocolId/pdf       # Download PDF
```

---

## ✅ Testing Protocol V2

### Pre-Deployment Checklist
- [ ] Všetky 5 kategórií fotiek fungujú
- [ ] Podpisy sa správne ukladajú
- [ ] PDF sa generuje s vodoznakom
- [ ] Upload do R2 funguje
- [ ] Progress tracking funguje
- [ ] Error handling funguje
- [ ] Retry mechanizmus funguje
- [ ] Bulk retry funguje

### Test Cases
```bash
# 1. Complete happy path
- Vytvor handover protocol
- Pridaj fotky vo všetkých kategóriách
- Pridaj podpisy
- Vygeneruj PDF
- Overeň upload do R2

# 2. Error handling
- Simuluj network error
- Overeť retry mechanizmus
- Test bulk retry

# 3. Return protocol
- Vytvor return protocol
- Načítaj handover data
- Pridaj return fotky
- Porovnaj zmeny
- Vygeneruj PDF
```

---

## 🐛 Common Issues & Solutions

### Issue: PDF generovanie zlyhá
**Solution:**
1. Skontroluj Puppeteer setup
2. Overeď Chromium dependencies
3. Check logs: `npm run monitor`

### Issue: Upload do R2 zlyhá
**Solution:**
1. Skontroluj R2 credentials v `.env`
2. Overeť R2 bucket permissions
3. Test R2 connection: `npm run test:r2`

### Issue: Fotky sa nezobrazia v PDF
**Solution:**
1. Overeť base64 encoding
2. Skontroluj image size limits
3. Check watermark rendering

---

## 📊 Protocol Statistics

Štatistiky protokolov sú dostupné v:
- **Dashboard** → Protocol Analytics
- **Rentals** → Individual rental stats
- **Reports** → Monthly protocol reports

---

## 🔗 Súvisiace Dokumenty

- [Protocol V2 Migration Plan](../04-implementation-plans/PROTOCOL_V2_MIGRATION_PLAN.md)
- [V1 Protocol Improvements](../04-implementation-plans/V1_PROTOCOL_MINIMAL_IMPROVEMENT_PLAN.md)
- [Email Protocol Strategy](../features/PROTOCOL-EMAIL-STRATEGY.md)
- [PDF Implementation](../guides/PDF-AND-MOBILE-IMPLEMENTATION.md)

---

## 📝 Migration Notes

### V1 → V2 Migration
Protocol V1 je stále podporovaný pre legacy rentals. V2 je default pre nové rentals.

**Migration Path:**
1. V1 protocols ostávajú dostupné read-only
2. Nové protocols používajú V2
3. V1 sa postupne phase-out po migrácii všetkých starých protocols

---

**Tip:** Pre production použitie vždy testuj na staging prostredí najprv!

