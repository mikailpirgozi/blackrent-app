/**
 * 📄 PDF Generator Service
 * Puppeteer-based PDF generation for contracts and documents
 */

import { Platform } from 'react-native';

export interface PDFTemplate {
  id: string;
  name: string;
  type: 'contract' | 'invoice' | 'receipt' | 'confirmation';
  language: 'sk' | 'en' | 'de' | 'hu';
  version: string;
  htmlTemplate: string;
  cssStyles: string;
}

export interface BookingData {
  id: string;
  vehicleName: string;
  vehicleImage?: string;
  startDate: Date;
  endDate: Date;
  totalPrice: number;
  days: number;
  pickupLocation: string;
  dropoffLocation: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  customerAddress: string;
  driverLicense: string;
  companyName: string;
  companyAddress: string;
  companyPhone: string;
  companyEmail: string;
  confirmationCode: string;
  termsAndConditions: string;
  insuranceDetails: {
    level: 'basic' | 'premium' | 'full';
    coverage: string;
    excess: number;
  };
  paymentMethod: {
    type: 'card' | 'bank_transfer' | 'cash';
    lastFour: string;
    transactionId?: string;
  };
}

export interface PDFGenerationOptions {
  template: PDFTemplate;
  data: BookingData;
  includeSignature?: boolean;
  includeQRCode?: boolean;
  watermark?: string;
  pageSize?: 'A4' | 'Letter';
  orientation?: 'portrait' | 'landscape';
}

export interface PDFGenerationResult {
  success: boolean;
  pdfUrl?: string;
  pdfBase64?: string;
  error?: string;
  fileSize?: number;
  generationTime?: number;
}

class PDFGeneratorService {
  private templates: Map<string, PDFTemplate> = new Map();
  private isInitialized = false;

  constructor() {
    this.initializeTemplates();
  }

  private initializeTemplates() {
    // Contract template for Slovakia
    this.templates.set('contract_sk', {
      id: 'contract_sk',
      name: 'Zmluva o prenájme vozidla - Slovensko',
      type: 'contract',
      language: 'sk',
      version: '1.0',
      htmlTemplate: this.getContractTemplate('sk'),
      cssStyles: this.getContractStyles(),
    });

    // Invoice template
    this.templates.set('invoice_sk', {
      id: 'invoice_sk',
      name: 'Faktúra - Slovensko',
      type: 'invoice',
      language: 'sk',
      version: '1.0',
      htmlTemplate: this.getInvoiceTemplate('sk'),
      cssStyles: this.getInvoiceStyles(),
    });

    // Receipt template
    this.templates.set('receipt_sk', {
      id: 'receipt_sk',
      name: 'Potvrdenie o platbe - Slovensko',
      type: 'receipt',
      language: 'sk',
      version: '1.0',
      htmlTemplate: this.getReceiptTemplate('sk'),
      cssStyles: this.getReceiptStyles(),
    });

    this.isInitialized = true;
  }

  private getContractTemplate(language: string): string {
    return `
      <!DOCTYPE html>
      <html lang="${language}">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Zmluva o prenájme vozidla</title>
      </head>
      <body>
        <div class="contract-container">
          <header class="contract-header">
            <div class="company-info">
              <h1>BlackRent s.r.o.</h1>
              <p>Hlavná 123, 811 01 Bratislava</p>
              <p>IČO: 12345678, DIČ: SK1234567890</p>
              <p>Tel: +421 2 1234 5678, Email: info@blackrent.sk</p>
            </div>
            <div class="contract-info">
              <h2>ZMLUVA O PRENÁJME VOZIDLA</h2>
              <p>Číslo zmluvy: {{confirmationCode}}</p>
              <p>Dátum: {{currentDate}}</p>
            </div>
          </header>

          <main class="contract-content">
            <section class="parties">
              <h3>Zmluvné strany</h3>
              <div class="party">
                <h4>Prenajímateľ:</h4>
                <p><strong>{{companyName}}</strong></p>
                <p>{{companyAddress}}</p>
                <p>Tel: {{companyPhone}}, Email: {{companyEmail}}</p>
              </div>
              <div class="party">
                <h4>Prenajímatel:</h4>
                <p><strong>{{customerName}}</strong></p>
                <p>{{customerAddress}}</p>
                <p>Tel: {{customerPhone}}, Email: {{customerEmail}}</p>
                <p>Vodičský preukaz: {{driverLicense}}</p>
              </div>
            </section>

            <section class="vehicle-info">
              <h3>Informácie o vozidle</h3>
              <div class="vehicle-details">
                <p><strong>Vozidlo:</strong> {{vehicleName}}</p>
                <p><strong>Obdobie prenájmu:</strong> {{startDate}} - {{endDate}}</p>
                <p><strong>Počet dní:</strong> {{days}} dní</p>
                <p><strong>Miesto vyzdvihnutia:</strong> {{pickupLocation}}</p>
                <p><strong>Miesto vrátenia:</strong> {{dropoffLocation}}</p>
              </div>
            </section>

            <section class="financial-info">
              <h3>Finančné podmienky</h3>
              <div class="price-breakdown">
                <div class="price-row">
                  <span>Základná cena ({{days}} dní × €{{dailyPrice}})</span>
                  <span>€{{basePrice}}</span>
                </div>
                <div class="price-row">
                  <span>Poistenie ({{insuranceLevel}})</span>
                  <span>€{{insurancePrice}}</span>
                </div>
                <div class="price-row total">
                  <span><strong>Celková suma</strong></span>
                  <span><strong>€{{totalPrice}}</strong></span>
                </div>
              </div>
              <div class="payment-info">
                <p><strong>Platobná metóda:</strong> {{paymentMethod}}</p>
                <p><strong>Transakcia:</strong> {{transactionId}}</p>
              </div>
            </section>

            <section class="terms">
              <h3>Všeobecné podmienky</h3>
              <div class="terms-content">
                <p>1. Prenajímatel sa zaväzuje vrátiť vozidlo v rovnakom stave, v akom ho prevzal.</p>
                <p>2. Vozidlo je poistené proti škodám na majetku a osobe.</p>
                <p>3. Prenajímatel je zodpovedný za všetky pokuty a sankcie vzniknuté počas prenájmu.</p>
                <p>4. V prípade poruchy vozidla je prenajímatel povinný okamžite kontaktovať prenajímateľa.</p>
                <p>5. Prenajímatel nesmie vozidlo používať na komerčné účely bez písomného súhlasu prenajímateľa.</p>
              </div>
            </section>

            <section class="signatures">
              <h3>Podpisy</h3>
              <div class="signature-section">
                <div class="signature-box">
                  <p>Prenajímateľ:</p>
                  <div class="signature-line"></div>
                  <p class="signature-date">Dátum: _______________</p>
                </div>
                <div class="signature-box">
                  <p>Prenajímatel:</p>
                  <div class="signature-line"></div>
                  <p class="signature-date">Dátum: _______________</p>
                </div>
              </div>
            </section>
          </main>

          <footer class="contract-footer">
            <p>Zmluva bola vytvorená elektronicky a má rovnakú platnosť ako písomná zmluva.</p>
            <p>BlackRent s.r.o. - {{currentDate}}</p>
          </footer>
        </div>
      </body>
      </html>
    `;
  }

  private getInvoiceTemplate(language: string): string {
    return `
      <!DOCTYPE html>
      <html lang="${language}">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Faktúra</title>
      </head>
      <body>
        <div class="invoice-container">
          <header class="invoice-header">
            <div class="company-info">
              <h1>BlackRent s.r.o.</h1>
              <p>Hlavná 123, 811 01 Bratislava</p>
              <p>IČO: 12345678, DIČ: SK1234567890</p>
            </div>
            <div class="invoice-info">
              <h2>FAKTÚRA</h2>
              <p>Číslo: {{confirmationCode}}</p>
              <p>Dátum vystavenia: {{currentDate}}</p>
              <p>Dátum splatnosti: {{dueDate}}</p>
            </div>
          </header>

          <main class="invoice-content">
            <section class="customer-info">
              <h3>Odberateľ:</h3>
              <p><strong>{{customerName}}</strong></p>
              <p>{{customerAddress}}</p>
              <p>Tel: {{customerPhone}}, Email: {{customerEmail}}</p>
            </section>

            <section class="invoice-items">
              <h3>Položky faktúry</h3>
              <table class="items-table">
                <thead>
                  <tr>
                    <th>Popis</th>
                    <th>Množstvo</th>
                    <th>Jednotková cena</th>
                    <th>Celkom</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td>Prenájom vozidla {{vehicleName}}</td>
                    <td>{{days}} dní</td>
                    <td>€{{dailyPrice}}</td>
                    <td>€{{basePrice}}</td>
                  </tr>
                  <tr>
                    <td>Poistenie ({{insuranceLevel}})</td>
                    <td>{{days}} dní</td>
                    <td>€{{insuranceDailyPrice}}</td>
                    <td>€{{insurancePrice}}</td>
                  </tr>
                </tbody>
                <tfoot>
                  <tr class="total-row">
                    <td colspan="3"><strong>Celkom bez DPH</strong></td>
                    <td><strong>€{{totalWithoutVAT}}</strong></td>
                  </tr>
                  <tr class="vat-row">
                    <td colspan="3">DPH 20%</td>
                    <td>€{{vatAmount}}</td>
                  </tr>
                  <tr class="final-total-row">
                    <td colspan="3"><strong>Celkom s DPH</strong></td>
                    <td><strong>€{{totalPrice}}</strong></td>
                  </tr>
                </tfoot>
              </table>
            </section>

            <section class="payment-info">
              <h3>Platobné údaje</h3>
              <p><strong>Spôsob úhrady:</strong> {{paymentMethod}}</p>
              <p><strong>Bankové spojenie:</strong> SK89 1200 0000 1987 4263 7541</p>
              <p><strong>Variabilný symbol:</strong> {{confirmationCode}}</p>
            </section>
          </main>

          <footer class="invoice-footer">
            <p>Ďakujeme za vašu dôveru!</p>
            <p>BlackRent s.r.o. - {{currentDate}}</p>
          </footer>
        </div>
      </body>
      </html>
    `;
  }

  private getReceiptTemplate(language: string): string {
    return `
      <!DOCTYPE html>
      <html lang="${language}">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Potvrdenie o platbe</title>
      </head>
      <body>
        <div class="receipt-container">
          <header class="receipt-header">
            <h1>BlackRent s.r.o.</h1>
            <p>Potvrdenie o platbe</p>
            <p>Číslo: {{confirmationCode}}</p>
            <p>Dátum: {{currentDate}}</p>
          </header>

          <main class="receipt-content">
            <section class="payment-details">
              <h3>Detaily platby</h3>
              <p><strong>Suma:</strong> €{{totalPrice}}</p>
              <p><strong>Spôsob platby:</strong> {{paymentMethod}}</p>
              <p><strong>Transakcia:</strong> {{transactionId}}</p>
              <p><strong>Stav:</strong> Úspešne zaplatené</p>
            </section>

            <section class="booking-details">
              <h3>Detaily rezervácie</h3>
              <p><strong>Vozidlo:</strong> {{vehicleName}}</p>
              <p><strong>Obdobie:</strong> {{startDate}} - {{endDate}}</p>
              <p><strong>Zákazník:</strong> {{customerName}}</p>
            </section>
          </main>

          <footer class="receipt-footer">
            <p>Potvrdenie bolo vygenerované automaticky.</p>
            <p>BlackRent s.r.o. - {{currentDate}}</p>
          </footer>
        </div>
      </body>
      </html>
    `;
  }

  private getContractStyles(): string {
    return `
      <style>
        body {
          font-family: 'Arial', sans-serif;
          line-height: 1.6;
          color: #333;
          margin: 0;
          padding: 20px;
          background: white;
        }
        .contract-container {
          max-width: 800px;
          margin: 0 auto;
          background: white;
          box-shadow: 0 0 10px rgba(0,0,0,0.1);
          padding: 40px;
        }
        .contract-header {
          border-bottom: 3px solid #007AFF;
          padding-bottom: 20px;
          margin-bottom: 30px;
        }
        .company-info h1 {
          color: #007AFF;
          margin: 0 0 10px 0;
          font-size: 24px;
        }
        .contract-info h2 {
          color: #333;
          text-align: center;
          margin: 20px 0 10px 0;
          font-size: 20px;
        }
        .contract-content section {
          margin-bottom: 30px;
        }
        .contract-content h3 {
          color: #007AFF;
          border-bottom: 1px solid #eee;
          padding-bottom: 5px;
          margin-bottom: 15px;
        }
        .parties {
          display: flex;
          justify-content: space-between;
        }
        .party {
          flex: 1;
          margin-right: 20px;
        }
        .party:last-child {
          margin-right: 0;
        }
        .price-breakdown {
          background: #f8f9fa;
          padding: 20px;
          border-radius: 8px;
        }
        .price-row {
          display: flex;
          justify-content: space-between;
          margin-bottom: 10px;
        }
        .price-row.total {
          border-top: 2px solid #007AFF;
          padding-top: 10px;
          font-weight: bold;
          font-size: 18px;
        }
        .signature-section {
          display: flex;
          justify-content: space-between;
          margin-top: 40px;
        }
        .signature-box {
          flex: 1;
          margin-right: 40px;
        }
        .signature-box:last-child {
          margin-right: 0;
        }
        .signature-line {
          border-bottom: 1px solid #333;
          height: 40px;
          margin: 20px 0 10px 0;
        }
        .contract-footer {
          margin-top: 40px;
          padding-top: 20px;
          border-top: 1px solid #eee;
          text-align: center;
          color: #666;
          font-size: 12px;
        }
      </style>
    `;
  }

  private getInvoiceStyles(): string {
    return `
      <style>
        body {
          font-family: 'Arial', sans-serif;
          line-height: 1.6;
          color: #333;
          margin: 0;
          padding: 20px;
          background: white;
        }
        .invoice-container {
          max-width: 800px;
          margin: 0 auto;
          background: white;
          box-shadow: 0 0 10px rgba(0,0,0,0.1);
          padding: 40px;
        }
        .invoice-header {
          border-bottom: 3px solid #007AFF;
          padding-bottom: 20px;
          margin-bottom: 30px;
          display: flex;
          justify-content: space-between;
        }
        .company-info h1 {
          color: #007AFF;
          margin: 0 0 10px 0;
          font-size: 24px;
        }
        .invoice-info h2 {
          color: #333;
          margin: 0 0 10px 0;
          font-size: 20px;
        }
        .items-table {
          width: 100%;
          border-collapse: collapse;
          margin: 20px 0;
        }
        .items-table th,
        .items-table td {
          border: 1px solid #ddd;
          padding: 12px;
          text-align: left;
        }
        .items-table th {
          background-color: #f8f9fa;
          font-weight: bold;
        }
        .total-row,
        .vat-row,
        .final-total-row {
          font-weight: bold;
        }
        .final-total-row {
          background-color: #007AFF;
          color: white;
        }
        .invoice-footer {
          margin-top: 40px;
          padding-top: 20px;
          border-top: 1px solid #eee;
          text-align: center;
          color: #666;
        }
      </style>
    `;
  }

  private getReceiptStyles(): string {
    return `
      <style>
        body {
          font-family: 'Arial', sans-serif;
          line-height: 1.6;
          color: #333;
          margin: 0;
          padding: 20px;
          background: white;
        }
        .receipt-container {
          max-width: 600px;
          margin: 0 auto;
          background: white;
          box-shadow: 0 0 10px rgba(0,0,0,0.1);
          padding: 30px;
        }
        .receipt-header {
          text-align: center;
          border-bottom: 2px solid #007AFF;
          padding-bottom: 20px;
          margin-bottom: 30px;
        }
        .receipt-header h1 {
          color: #007AFF;
          margin: 0 0 10px 0;
          font-size: 24px;
        }
        .receipt-content section {
          margin-bottom: 25px;
        }
        .receipt-content h3 {
          color: #007AFF;
          border-bottom: 1px solid #eee;
          padding-bottom: 5px;
          margin-bottom: 15px;
        }
        .receipt-footer {
          margin-top: 30px;
          padding-top: 20px;
          border-top: 1px solid #eee;
          text-align: center;
          color: #666;
          font-size: 12px;
        }
      </style>
    `;
  }

  private processTemplate(template: string, data: BookingData): string {
    const currentDate = new Date().toLocaleDateString('sk-SK');
    const dueDate = new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toLocaleDateString('sk-SK');
    const dailyPrice = (data.totalPrice / data.days).toFixed(2);
    const basePrice = (data.totalPrice * 0.8).toFixed(2);
    const insurancePrice = (data.totalPrice * 0.2).toFixed(2);
    const totalWithoutVAT = (data.totalPrice / 1.2).toFixed(2);
    const vatAmount = (data.totalPrice - parseFloat(totalWithoutVAT)).toFixed(2);

    return template
      .replace(/\{\{confirmationCode\}\}/g, data.confirmationCode)
      .replace(/\{\{currentDate\}\}/g, currentDate)
      .replace(/\{\{dueDate\}\}/g, dueDate)
      .replace(/\{\{companyName\}\}/g, data.companyName)
      .replace(/\{\{companyAddress\}\}/g, data.companyAddress)
      .replace(/\{\{companyPhone\}\}/g, data.companyPhone)
      .replace(/\{\{companyEmail\}\}/g, data.companyEmail)
      .replace(/\{\{customerName\}\}/g, data.customerName)
      .replace(/\{\{customerAddress\}\}/g, data.customerAddress)
      .replace(/\{\{customerPhone\}\}/g, data.customerPhone)
      .replace(/\{\{customerEmail\}\}/g, data.customerEmail)
      .replace(/\{\{driverLicense\}\}/g, data.driverLicense)
      .replace(/\{\{vehicleName\}\}/g, data.vehicleName)
      .replace(/\{\{startDate\}\}/g, data.startDate.toLocaleDateString('sk-SK'))
      .replace(/\{\{endDate\}\}/g, data.endDate.toLocaleDateString('sk-SK'))
      .replace(/\{\{days\}\}/g, data.days.toString())
      .replace(/\{\{pickupLocation\}\}/g, data.pickupLocation)
      .replace(/\{\{dropoffLocation\}\}/g, data.dropoffLocation)
      .replace(/\{\{totalPrice\}\}/g, data.totalPrice.toFixed(2))
      .replace(/\{\{dailyPrice\}\}/g, dailyPrice)
      .replace(/\{\{basePrice\}\}/g, basePrice)
      .replace(/\{\{insurancePrice\}\}/g, insurancePrice)
      .replace(/\{\{insuranceLevel\}\}/g, data.insuranceDetails.level)
      .replace(/\{\{paymentMethod\}\}/g, data.paymentMethod.type)
      .replace(/\{\{transactionId\}\}/g, data.paymentMethod.transactionId || 'N/A')
      .replace(/\{\{totalWithoutVAT\}\}/g, totalWithoutVAT)
      .replace(/\{\{vatAmount\}\}/g, vatAmount);
  }

  async generatePDF(options: PDFGenerationOptions): Promise<PDFGenerationResult> {
    const startTime = Date.now();

    try {
      if (!this.isInitialized) {
        throw new Error('PDF Generator not initialized');
      }

      const template = this.templates.get(options.template.id);
      if (!template) {
        throw new Error(`Template ${options.template.id} not found`);
      }

      // Process template with data
      const processedHTML = this.processTemplate(template.htmlTemplate, options.data);
      const fullHTML = processedHTML.replace('</head>', `${template.cssStyles}</head>`);

      // In React Native, we would use a different approach for PDF generation
      // For now, we'll simulate the process
      const result = await this.simulatePDFGeneration(fullHTML, options);

      const generationTime = Date.now() - startTime;

      return {
        success: true,
        pdfUrl: result.pdfUrl,
        pdfBase64: result.pdfBase64,
        fileSize: result.fileSize,
        generationTime,
      };

    } catch (error) {
            return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        generationTime: Date.now() - startTime,
      };
    }
  }

  private async simulatePDFGeneration(html: string, options: PDFGenerationOptions): Promise<{
    pdfUrl?: string;
    pdfBase64?: string;
    fileSize: number;
  }> {
    // Simulate PDF generation delay
    await new Promise(resolve => setTimeout(resolve, 2000));

    // In a real implementation, this would use Puppeteer or similar
    // For now, we'll return mock data
    const mockFileSize = Math.floor(Math.random() * 500000) + 100000; // 100KB - 600KB

    if (Platform.OS === 'web') {
      return {
        pdfUrl: `data:application/pdf;base64,${btoa('Mock PDF content')}`,
        fileSize: mockFileSize,
      };
    } else {
      return {
        pdfBase64: btoa('Mock PDF content'),
        fileSize: mockFileSize,
      };
    }
  }

  getAvailableTemplates(): PDFTemplate[] {
    return Array.from(this.templates.values());
  }

  getTemplate(id: string): PDFTemplate | undefined {
    return this.templates.get(id);
  }
}

export const pdfGenerator = new PDFGeneratorService();
