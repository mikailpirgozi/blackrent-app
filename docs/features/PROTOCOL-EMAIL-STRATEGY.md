# 📧 EMAIL STRATÉGIA PRE PROTOKOLY - Odporúčania

## 🎯 Otázka: Kedy posielať email s protokolom?

### ✅ **ODPORÚČANÁ STRATÉGIA: Email AŽ PO R2 upload**

```
1. Generuj PDF protokol
2. Upload PDF na R2 storage  
3. Ulož do databázy
4. Odošli email s R2 link (nie attachment)
```

## 🔍 **Prečo táto stratégia?**

### ✅ **Výhody:**
1. **Garantovaná dostupnosť** - PDF je už na R2 pred odoslaním emailu
2. **Menšie emaily** - link namiesto veľkého PDF attachment
3. **Lepšie tracking** - vieš kto klikol na link
4. **Žiadne email limity** - PDF môže byť ľubovoľne veľký
5. **Backup riešenie** - ak email zlyhá, PDF je stále dostupný
6. **Rýchlejšie doručenie** - email sa odošle rýchlejšie

### ❌ **Nevýhody posielania pred R2:**
1. **Riziko nekonzistencie** - email odošlený ale PDF nie je na R2
2. **Väčšie emaily** - PDF attachment spomaľuje doručenie
3. **Email server limity** - veľké PDF môžu byť odmietnuté
4. **Duplicitné storage** - PDF v emaile + na R2

## 🛠️ **Implementácia:**

### **1. Aktuálny workflow (SPRÁVNY):**
```javascript
// 1. Generuj PDF
const pdfBuffer = await generateHandoverPDF(protocolData);

// 2. Upload na R2
const r2Url = await r2Storage.uploadFile(filename, pdfBuffer, 'application/pdf');

// 3. Ulož do DB
await postgresDatabase.updateHandoverProtocol(protocol.id, { pdfUrl: r2Url });

// 4. Odošli email s R2 link (background)
setImmediate(async () => {
  const emailData = {
    customer: protocolData.rentalData.customer,
    pdfDownloadUrl: r2Url, // ✅ R2 URL
    protocolId: protocol.id
  };
  
  await emailService.sendHandoverProtocolEmailWithR2Link(emailData);
});
```

### **2. Email template s R2 link:**
```html
<h2>📄 Odovzdávací protokol</h2>
<p>Vážený/á {{customerName}},</p>
<p>Váš odovzdávací protokol je pripravený na stiahnutie:</p>

<a href="{{r2DownloadUrl}}" style="background: #1976d2; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px;">
  📥 Stiahnuť protokol (PDF)
</a>

<p><strong>Detaily prenájmu:</strong></p>
<ul>
  <li>Vozidlo: {{vehicleBrand}} {{vehicleModel}} ({{licensePlate}})</li>
  <li>Dátum: {{startDate}} - {{endDate}}</li>
  <li>Protokol ID: {{protocolId}}</li>
</ul>
```

## 🔧 **Technické detaily:**

### **Email service rozšírenie:**
```typescript
// Nová metóda pre email s R2 link
async sendHandoverProtocolEmailWithR2Link(emailData: {
  customer: Customer;
  pdfDownloadUrl: string;
  protocolId: string;
  vehicleInfo?: Vehicle;
  rentalInfo?: Rental;
}): Promise<boolean> {
  
  const emailTemplate = this.generateProtocolEmailTemplate(emailData);
  
  return await this.sendEmail({
    to: emailData.customer.email,
    subject: `📄 Odovzdávací protokol - ${emailData.vehicleInfo?.brand} ${emailData.vehicleInfo?.model}`,
    html: emailTemplate,
    // Žiadne PDF attachment - len R2 link
  });
}
```

### **Databáza tracking:**
```sql
ALTER TABLE handover_protocols ADD COLUMN pdf_email_url TEXT;
ALTER TABLE handover_protocols ADD COLUMN email_sent_at TIMESTAMP;
```

## 🚀 **Alternatívne stratégie:**

### **Stratégia A: Hybrid (súčasná)**
- PDF attachment + R2 backup link
- Väčšie emaily ale okamžitý prístup

### **Stratégia B: Pure R2 (odporúčaná)**  
- Len R2 link v emaile
- Menšie emaily, rýchlejšie doručenie

### **Stratégia C: Dual delivery**
- Malé PDF (bez obrázkov) ako attachment
- Plný PDF s obrázkami na R2 link

## 🎯 **Moje odporúčanie:**

**Použi Stratégiu B (Pure R2)** pretože:

1. **Konzistentnosť** - všetko je na R2 storage
2. **Škálovateľnosť** - funguje aj pre veľké PDF
3. **Spoľahlivosť** - email sa odošle až keď je PDF garantovane dostupný
4. **Performance** - rýchlejšie emaily
5. **Tracking** - môžeš sledovať downloads

**Workflow:**
```
PDF Generation → R2 Upload → DB Update → Email s R2 link
```

**Ak R2 upload zlyhá** → email sa neodošle (čo je správne)
**Ak email zlyhá** → PDF je stále dostupný na R2

**Toto je najrobustnejšie riešenie!** 🚀
