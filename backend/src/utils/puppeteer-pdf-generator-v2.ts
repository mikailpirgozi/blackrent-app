import puppeteer, { Browser, Page } from 'puppeteer';
import { HandoverProtocol, ReturnProtocol, Settlement } from '../types';

export class PuppeteerPDFGeneratorV2 {
  private browser: Browser | null = null;

  constructor() {
    console.log('🎭 PuppeteerPDFGeneratorV2 initialized');
  }

  private async getBrowser(): Promise<Browser> {
    if (!this.browser) {
      console.log('🚀 Launching Puppeteer browser...');
      
      const isProduction = process.env.NODE_ENV === 'production';
      const executablePath = process.env.PUPPETEER_EXECUTABLE_PATH || '/usr/bin/google-chrome-stable';
      
      // 🎯 RAILWAY-OPTIMIZED LAUNCH OPTIONS
      const launchOptions = {
        executablePath: isProduction ? executablePath : undefined,
        headless: true,
        args: [
          // Basic security and sandbox
          '--no-sandbox',
          '--disable-setuid-sandbox',
          '--disable-dev-shm-usage',
          '--disable-gpu',
          '--disable-software-rasterizer',
          
          // Memory and performance
          '--memory-pressure-off',
          '--max_old_space_size=4096',
          '--single-process',
          '--no-zygote',
          
          // File system restrictions - FIX pre Railway
          '--homedir=/tmp',
          '--user-data-dir=/tmp/chrome-user-data',
          '--data-path=/tmp/chrome-data',
          '--disk-cache-dir=/tmp/chrome-cache',
          '--crash-dumps-dir=/tmp/chrome-crashes',
          '--temp-dir=/tmp',
          
          // Disable problematic features
          '--disable-background-timer-throttling',
          '--disable-backgrounding-occluded-windows',
          '--disable-renderer-backgrounding',
          '--disable-extensions',
          '--disable-plugins',
          '--disable-default-apps',
          '--disable-background-networking',
          '--disable-sync',
          '--disable-translate',
          '--disable-ipc-flooding-protection',
          
          // Security restrictions for Railway
          '--disable-web-security',
          '--disable-features=TranslateUI',
          '--disable-component-extensions-with-background-pages',
          '--disable-blink-features=AutomationControlled',
          
          // Prevent file access issues
          '--no-first-run',
          '--no-default-browser-check',
          '--disable-default-apps',
          '--disable-popup-blocking',
          '--disable-prompt-on-repost',
          '--disable-hang-monitor',
          '--disable-client-side-phishing-detection',
          
          // Railway container specific
          '--virtual-time-budget=25000',
          '--run-all-compositor-stages-before-draw',
          '--disable-partial-raster',
          '--disable-skia-runtime-opts',
          '--disable-system-font-check',
          '--disable-font-subpixel-positioning',
        ],
        timeout: 30000,
        ignoreDefaultArgs: ['--enable-automation'],
        ignoreHTTPSErrors: true,
      };

      console.log('🔧 Puppeteer launch options:', {
        executablePath: launchOptions.executablePath,
        argsCount: launchOptions.args?.length,
        isProduction,
        userDataDir: '/tmp/chrome-user-data'
      });

      try {
        this.browser = await puppeteer.launch(launchOptions);
        console.log('✅ Puppeteer browser launched successfully');
        
        // Test connection
        const version = await this.browser.version();
        console.log('🔍 Chrome version:', version);
        
      } catch (error) {
        console.error('❌ Puppeteer launch failed:', error);
        throw new Error(`Puppeteer launch failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    }
    
    return this.browser;
  }

  private async closeBrowser(): Promise<void> {
    if (this.browser) {
      await this.browser.close();
      this.browser = null;
      console.log('🔒 Puppeteer browser closed');
    }
  }

  // Generate handover protocol PDF
  async generateHandoverProtocol(protocol: HandoverProtocol): Promise<Buffer> {
    console.log('🎭 Generating handover protocol PDF with Puppeteer...');
    console.log('📋 Protocol ID:', protocol.id);
    
    let page: Page | null = null;
    
    try {
      const browser = await this.getBrowser();
      page = await browser.newPage();
      
      // Set viewport and emulate media
      await page.setViewport({ width: 1200, height: 1600 });
      await page.emulateMediaType('print');
      
      // Generate HTML content
      const htmlContent = this.generateHandoverHTML(protocol);
      
      // Set content and wait for load
      await page.setContent(htmlContent, { 
        waitUntil: 'networkidle0',
        timeout: 30000 
      });
      
      // Generate PDF
      const pdfBuffer = await page.pdf({
        format: 'A4',
        printBackground: true,
        margin: {
          top: '1cm',
          bottom: '1cm',
          left: '1cm',
          right: '1cm'
        },
        displayHeaderFooter: true,
        headerTemplate: '<span></span>',
        footerTemplate: `
          <div style="font-size: 10px; text-align: center; width: 100%; color: #666;">
            <span>BlackRent - Odovzdávací protokol | ${new Date().toLocaleDateString('sk-SK')}</span>
          </div>
        `,
      });
      
      console.log(`✅ Puppeteer handover PDF generated: ${(pdfBuffer.length / 1024).toFixed(1)}KB`);
      return Buffer.from(pdfBuffer);
      
    } catch (error) {
      console.error('❌ Puppeteer handover PDF generation failed:', error);
      throw error;
    } finally {
      if (page) {
        await page.close();
      }
    }
  }

  // Generate return protocol PDF
  async generateReturnProtocol(protocol: ReturnProtocol): Promise<Buffer> {
    console.log('🎭 Generating return protocol PDF with Puppeteer...');
    console.log('📋 Protocol ID:', protocol.id);
    
    let page: Page | null = null;
    
    try {
      const browser = await this.getBrowser();
      page = await browser.newPage();
      
      // Set viewport and emulate media
      await page.setViewport({ width: 1200, height: 1600 });
      await page.emulateMediaType('print');
      
      // Generate HTML content
      const htmlContent = this.generateReturnHTML(protocol);
      
      // Set content and wait for load
      await page.setContent(htmlContent, { 
        waitUntil: 'networkidle0',
        timeout: 30000 
      });
      
      // Generate PDF
      const pdfBuffer = await page.pdf({
        format: 'A4',
        printBackground: true,
        margin: {
          top: '1cm',
          bottom: '1cm',
          left: '1cm',
          right: '1cm'
        },
        displayHeaderFooter: true,
        headerTemplate: '<span></span>',
        footerTemplate: `
          <div style="font-size: 10px; text-align: center; width: 100%; color: #666;">
            <span>BlackRent - Preberací protokol | ${new Date().toLocaleDateString('sk-SK')}</span>
          </div>
        `,
      });
      
      console.log(`✅ Puppeteer return PDF generated: ${(pdfBuffer.length / 1024).toFixed(1)}KB`);
      return Buffer.from(pdfBuffer);
      
    } catch (error) {
      console.error('❌ Puppeteer return PDF generation failed:', error);
      throw error;
    } finally {
      if (page) {
        await page.close();
      }
    }
  }

  private generateHandoverHTML(protocol: HandoverProtocol): string {
    return `
<!DOCTYPE html>
<html lang="sk">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Odovzdávací protokol - ${protocol.id}</title>
    <style>
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');
        
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        
        body {
            font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
            font-size: 11px;
            line-height: 1.4;
            color: #1a1a1a;
            background: white;
        }
        
        .header {
            text-align: center;
            margin-bottom: 30px;
            border-bottom: 3px solid #2563eb;
            padding-bottom: 20px;
        }
        
        .header h1 {
            font-size: 24px;
            font-weight: 700;
            color: #2563eb;
            margin-bottom: 5px;
        }
        
        .header h2 {
            font-size: 18px;
            font-weight: 600;
            color: #374151;
        }
        
        .section {
            margin-bottom: 25px;
            page-break-inside: avoid;
        }
        
        .section-title {
            font-size: 14px;
            font-weight: 600;
            color: #1f2937;
            background: #f3f4f6;
            padding: 8px 12px;
            border-left: 4px solid #2563eb;
            margin-bottom: 12px;
        }
        
        .info-grid {
            display: grid;
            grid-template-columns: repeat(2, 1fr);
            gap: 8px;
            margin-bottom: 15px;
        }
        
        .info-item {
            display: flex;
            align-items: flex-start;
            padding: 6px 0;
            border-bottom: 1px solid #e5e7eb;
        }
        
        .info-label {
            font-weight: 500;
            color: #374151;
            min-width: 140px;
            flex-shrink: 0;
        }
        
        .info-value {
            font-weight: 400;
            color: #1f2937;
            flex: 1;
        }
        
        .media-grid {
            display: grid;
            grid-template-columns: repeat(3, 1fr);
            gap: 10px;
            margin-top: 15px;
        }
        
        .media-item {
            text-align: center;
            padding: 10px;
            border: 1px solid #e5e7eb;
            border-radius: 6px;
        }
        
        .media-item img {
            max-width: 100%;
            max-height: 120px;
            object-fit: cover;
            border-radius: 4px;
        }
        
        .media-caption {
            font-size: 9px;
            color: #6b7280;
            margin-top: 5px;
        }
        
        .damages-list {
            background: #fef2f2;
            border: 1px solid #fecaca;
            border-radius: 6px;
            padding: 12px;
        }
        
        .damage-item {
            margin-bottom: 8px;
            padding: 6px;
            background: white;
            border-radius: 4px;
            border-left: 3px solid #ef4444;
        }
        
        .signatures {
            display: grid;
            grid-template-columns: repeat(2, 1fr);
            gap: 20px;
            margin-top: 20px;
        }
        
        .signature-box {
            border: 1px solid #d1d5db;
            border-radius: 6px;
            padding: 15px;
            text-align: center;
        }
        
        .signature-img {
            max-width: 200px;
            max-height: 80px;
            margin: 10px 0;
        }
        
        .footer {
            margin-top: 40px;
            padding-top: 20px;
            border-top: 1px solid #e5e7eb;
            text-align: center;
            font-size: 9px;
            color: #6b7280;
        }
        
        @media print {
            body { margin: 0; }
            .page-break { page-break-before: always; }
        }
    </style>
</head>
<body>
    <div class="header">
        <h1>BLACKRENT</h1>
        <h2>ODOVZDÁVACÍ PROTOKOL</h2>
    </div>

    <div class="section">
        <div class="section-title">Základné informácie</div>
        <div class="info-grid">
            <div class="info-item">
                <span class="info-label">Číslo protokolu:</span>
                <span class="info-value">${protocol.id.slice(-8).toUpperCase()}</span>
            </div>
            <div class="info-item">
                <span class="info-label">Dátum vytvorenia:</span>
                <span class="info-value">${new Date(protocol.createdAt).toLocaleDateString('sk-SK')}</span>
            </div>
            <div class="info-item">
                <span class="info-label">Miesto prevzatia:</span>
                <span class="info-value">${protocol.location || 'Neuvedené'}</span>
            </div>
            <div class="info-item">
                <span class="info-label">Stav protokolu:</span>
                <span class="info-value">${this.getStatusText(protocol.status)}</span>
            </div>
        </div>
    </div>

    ${protocol.rentalData ? `
    <div class="section">
        <div class="section-title">Informácie o prenájme</div>
        <div class="info-grid">
            <div class="info-item">
                <span class="info-label">Číslo objednávky:</span>
                <span class="info-value">${protocol.rentalData.orderNumber || 'N/A'}</span>
            </div>
            <div class="info-item">
                <span class="info-label">Zákazník:</span>
                <span class="info-value">${protocol.rentalData.customer?.name || 'N/A'}</span>
            </div>
            <div class="info-item">
                <span class="info-label">Dátum od:</span>
                <span class="info-value">${new Date(protocol.rentalData.startDate).toLocaleDateString('sk-SK')}</span>
            </div>
            <div class="info-item">
                <span class="info-label">Dátum do:</span>
                <span class="info-value">${new Date(protocol.rentalData.endDate).toLocaleDateString('sk-SK')}</span>
            </div>
            <div class="info-item">
                <span class="info-label">Celková cena:</span>
                <span class="info-value">${protocol.rentalData.totalPrice} ${protocol.rentalData.currency}</span>
            </div>
            <div class="info-item">
                <span class="info-label">Záloha:</span>
                <span class="info-value">${protocol.rentalData.deposit} ${protocol.rentalData.currency}</span>
            </div>
        </div>
    </div>
    ` : ''}

    ${protocol.rentalData?.vehicle ? `
    <div class="section">
        <div class="section-title">Informácie o vozidle</div>
        <div class="info-grid">
            <div class="info-item">
                <span class="info-label">Značka:</span>
                <span class="info-value">${protocol.rentalData.vehicle.brand || 'N/A'}</span>
            </div>
            <div class="info-item">
                <span class="info-label">Model:</span>
                <span class="info-value">${protocol.rentalData.vehicle.model || 'N/A'}</span>
            </div>
            <div class="info-item">
                <span class="info-label">ŠPZ:</span>
                <span class="info-value">${protocol.rentalData.vehicle.licensePlate || 'N/A'}</span>
            </div>
        </div>
    </div>
    ` : ''}

    <div class="section">
        <div class="section-title">Stav vozidla pri prevzatí</div>
        <div class="info-grid">
            <div class="info-item">
                <span class="info-label">Stav tachometra:</span>
                <span class="info-value">${protocol.vehicleCondition.odometer} km</span>
            </div>
            <div class="info-item">
                <span class="info-label">Úroveň paliva:</span>
                <span class="info-value">${protocol.vehicleCondition.fuelLevel}%</span>
            </div>
            <div class="info-item">
                <span class="info-label">Typ paliva:</span>
                <span class="info-value">${protocol.vehicleCondition.fuelType}</span>
            </div>
            <div class="info-item">
                <span class="info-label">Exteriér:</span>
                <span class="info-value">${protocol.vehicleCondition.exteriorCondition}</span>
            </div>
            <div class="info-item">
                <span class="info-label">Interiér:</span>
                <span class="info-value">${protocol.vehicleCondition.interiorCondition}</span>
            </div>
            ${protocol.vehicleCondition.notes ? `
            <div class="info-item" style="grid-column: 1 / -1;">
                <span class="info-label">Poznámky:</span>
                <span class="info-value">${protocol.vehicleCondition.notes}</span>
            </div>
            ` : ''}
        </div>
    </div>

    ${protocol.damages && protocol.damages.length > 0 ? `
    <div class="section">
        <div class="section-title">Zaznamenané poškodenia</div>
        <div class="damages-list">
            ${protocol.damages.map((damage, index) => `
                <div class="damage-item">
                    <strong>Poškodenie ${index + 1}:</strong> ${damage.description} 
                    <em>(${damage.severity})</em>
                </div>
            `).join('')}
        </div>
    </div>
    ` : ''}

    <div class="section">
        <div class="section-title">Priložené súbory</div>
        <div class="info-grid">
            <div class="info-item">
                <span class="info-label">Počet fotiek:</span>
                <span class="info-value">${(protocol.vehicleImages?.length || 0) + (protocol.documentImages?.length || 0) + (protocol.damageImages?.length || 0)}</span>
            </div>
            <div class="info-item">
                <span class="info-label">Počet videí:</span>
                <span class="info-value">${protocol.vehicleVideos?.length || 0}</span>
            </div>
        </div>
    </div>

    ${protocol.notes ? `
    <div class="section">
        <div class="section-title">Poznámky</div>
        <div style="padding: 12px; background: #f9fafb; border-radius: 6px;">
            ${protocol.notes}
        </div>
    </div>
    ` : ''}

    <div class="footer">
        <p>Dokument vygenerovaný automaticky systémom BlackRent</p>
        <p>Vygenerované: ${new Date().toLocaleString('sk-SK')}</p>
    </div>
</body>
</html>
    `;
  }

  private generateReturnHTML(protocol: ReturnProtocol): string {
    // Similar structure for return protocol
    return `
<!DOCTYPE html>
<html lang="sk">
<head>
    <meta charset="UTF-8">
    <title>Preberací protokol - ${protocol.id}</title>
    <!-- Same CSS as handover -->
</head>
<body>
    <div class="header">
        <h1>BLACKRENT</h1>
        <h2>PREBERACÍ PROTOKOL</h2>
    </div>
    <!-- Return-specific content here -->
    <div class="footer">
        <p>Dokument vygenerovaný automaticky systémom BlackRent</p>
        <p>Vygenerované: ${new Date().toLocaleString('sk-SK')}</p>
    </div>
</body>
</html>
    `;
  }

  private getStatusText(status: string): string {
    switch (status) {
      case 'draft': return 'Koncept';
      case 'completed': return 'Dokončený';
      case 'cancelled': return 'Zrušený';
      default: return status;
    }
  }

  /**
   * Generovanie PDF vyúčtovania
   */
  async generateSettlementPDF(settlement: Settlement): Promise<Buffer> {
    console.log('🎭 Puppeteer settlement PDF generation started');
    console.log('📋 Settlement ID:', settlement.id);
    
    let page: Page | null = null;
    
    try {
      const browser = await this.getBrowser();
      page = await browser.newPage();
      
      // Set viewport and emulate media
      await page.setViewport({ width: 1200, height: 1600 });
      await page.emulateMediaType('print');
      
      // Generate HTML content
      const htmlContent = this.generateSettlementHTML(settlement);
      
      // Set content and wait for load
      await page.setContent(htmlContent, { 
        waitUntil: 'networkidle0',
        timeout: 30000 
      });
      
      // Generate PDF
      const pdfBuffer = await page.pdf({
        format: 'A4',
        printBackground: true,
        margin: {
          top: '1cm',
          bottom: '1cm',
          left: '1cm',  
          right: '1cm'
        },
        displayHeaderFooter: true,
        headerTemplate: '<span></span>',
        footerTemplate: `
          <div style="font-size: 10px; text-align: center; width: 100%; color: #666;">
            <span>BlackRent - Vyúčtovanie | ${new Date().toLocaleDateString('sk-SK')}</span>
          </div>
        `,
      });
      
      console.log(`✅ Puppeteer settlement PDF generated: ${(pdfBuffer.length / 1024).toFixed(1)}KB`);
      return Buffer.from(pdfBuffer);
      
    } catch (error) {
      console.error('❌ Puppeteer settlement PDF generation failed:', error);
      throw error;
    } finally {
      if (page) {
        await page.close();
      }
    }
  }

  private generateSettlementHTML(settlement: Settlement): string {
    const rentalsByPaymentMethod = {
      cash: settlement.rentals.filter(r => r.paymentMethod === 'cash'),
      bank_transfer: settlement.rentals.filter(r => r.paymentMethod === 'bank_transfer'),
      vrp: settlement.rentals.filter(r => r.paymentMethod === 'vrp'),
      direct_to_owner: settlement.rentals.filter(r => r.paymentMethod === 'direct_to_owner'),
    };

    const paymentMethodStats = {
      cash: {
        count: rentalsByPaymentMethod.cash.length,
        totalPrice: rentalsByPaymentMethod.cash.reduce((sum, r) => sum + r.totalPrice, 0),
        totalCommission: rentalsByPaymentMethod.cash.reduce((sum, r) => sum + r.commission, 0),
        netAmount: rentalsByPaymentMethod.cash.reduce((sum, r) => sum + r.totalPrice - r.commission, 0),
      },
      bank_transfer: {
        count: rentalsByPaymentMethod.bank_transfer.length,
        totalPrice: rentalsByPaymentMethod.bank_transfer.reduce((sum, r) => sum + r.totalPrice, 0),
        totalCommission: rentalsByPaymentMethod.bank_transfer.reduce((sum, r) => sum + r.commission, 0),
        netAmount: rentalsByPaymentMethod.bank_transfer.reduce((sum, r) => sum + r.totalPrice - r.commission, 0),
      },
      vrp: {
        count: rentalsByPaymentMethod.vrp.length,
        totalPrice: rentalsByPaymentMethod.vrp.reduce((sum, r) => sum + r.totalPrice, 0),
        totalCommission: rentalsByPaymentMethod.vrp.reduce((sum, r) => sum + r.commission, 0),
        netAmount: rentalsByPaymentMethod.vrp.reduce((sum, r) => sum + r.totalPrice - r.commission, 0),
      },
      direct_to_owner: {
        count: rentalsByPaymentMethod.direct_to_owner.length,
        totalPrice: rentalsByPaymentMethod.direct_to_owner.reduce((sum, r) => sum + r.totalPrice, 0),
        totalCommission: rentalsByPaymentMethod.direct_to_owner.reduce((sum, r) => sum + r.commission, 0),
        netAmount: rentalsByPaymentMethod.direct_to_owner.reduce((sum, r) => sum + r.totalPrice - r.commission, 0),
      },
    };

    const getPaymentMethodLabel = (method: string) => {
      switch (method) {
        case 'cash': return 'Hotovosť';
        case 'bank_transfer': return 'FA (Faktúra)';
        case 'vrp': return 'VRP';
        case 'direct_to_owner': return 'Majiteľ';
        default: return method;
      }
    };

    const formatDate = (date: Date | string) => {
      try {
        const d = typeof date === 'string' ? new Date(date) : date;
        return d.toLocaleDateString('sk-SK');
      } catch {
        return 'N/A';
      }
    };

    return `
<!DOCTYPE html>
<html lang="sk">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Vyúčtovanie - ${settlement.company || 'N/A'}</title>
    <style>
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');
        
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        
        body {
            font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
            font-size: 12px;
            line-height: 1.4;
            color: #1a1a1a;
            background: white;
        }
        
        .header {
            background: linear-gradient(135deg, #1976d2 0%, #1565c0 100%);
            color: white;
            padding: 30px;
            text-align: center;
            margin-bottom: 30px;
        }
        
        .header h1 {
            font-size: 28px;
            font-weight: 700;
            margin-bottom: 10px;
        }
        
        .header h2 {
            font-size: 20px;
            font-weight: 600;
            margin-bottom: 15px;
        }
        
        .header .period {
            font-size: 16px;
            background: rgba(255,255,255,0.1);
            padding: 8px 16px;
            border-radius: 20px;
            display: inline-block;
        }

        .financial-summary {
            display: grid;
            grid-template-columns: repeat(4, 1fr);
            gap: 20px;
            margin-bottom: 30px;
        }

        .summary-card {
            background: white;
            border-radius: 8px;
            padding: 20px;
            border-left: 4px solid;
            box-shadow: 0 2px 8px rgba(0,0,0,0.1);
        }

        .summary-card.income { border-left-color: #4facfe; }
        .summary-card.expenses { border-left-color: #f093fb; }
        .summary-card.commission { border-left-color: #ffeaa7; }
        .summary-card.profit { border-left-color: #a8edea; }
        .summary-card.loss { border-left-color: #ff9a9e; }

        .summary-card h3 {
            font-size: 14px;
            font-weight: 600;
            margin-bottom: 8px;
            text-transform: uppercase;
            color: #666;
        }

        .summary-card .amount {
            font-size: 24px;
            font-weight: 700;
            color: #1a1a1a;
        }
        
        .section {
            margin-bottom: 30px;
            page-break-inside: avoid;
        }
        
        .section-title {
            font-size: 16px;
            font-weight: 600;
            color: #1f2937;
            background: #f8f9fa;
            padding: 12px 16px;
            border-left: 4px solid #1976d2;
            margin-bottom: 15px;
        }
        
        table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 20px;
            background: white;
            border-radius: 8px;
            overflow: hidden;
            box-shadow: 0 2px 8px rgba(0,0,0,0.1);
        }
        
        th {
            background: #1976d2;
            color: white;
            padding: 12px;
            text-align: left;
            font-weight: 600;
            font-size: 11px;
        }
        
        td {
            padding: 10px 12px;
            border-bottom: 1px solid #e5e7eb;
            font-size: 11px;
        }
        
        tr:nth-child(even) {
            background: #f9fafb;
        }

        tr:hover {
            background: #f3f4f6;
        }

        .total-row {
            background: #e3f2fd !important;
            font-weight: 700;
            border-top: 2px solid #1976d2;
        }

        .payment-method-indicator {
            display: inline-block;
            width: 12px;
            height: 12px;
            border-radius: 50%;
            margin-right: 8px;
        }

        .payment-cash { background: #4caf50; }
        .payment-bank { background: #2196f3; }
        .payment-vrp { background: #ff9800; }
        .payment-owner { background: #9e9e9e; }

        .text-right {
            text-align: right;
        }

        .text-center {
            text-align: center;
        }

        .font-bold {
            font-weight: 600;
        }

        .chip {
            background: #e3f2fd;
            color: #1976d2;
            padding: 4px 8px;
            border-radius: 12px;
            font-size: 10px;
            font-weight: 600;
        }

        .two-column {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 30px;
        }

        @media print {
            .header {
                -webkit-print-color-adjust: exact;
                color-adjust: exact;
            }
            
            .summary-card {
                -webkit-print-color-adjust: exact;
                color-adjust: exact;
            }
        }
    </style>
</head>
<body>
    <div class="header">
        <h1>VYÚČTOVANIE</h1>
        <h2>${settlement.company || 'N/A'}</h2>
        <div class="period">
            Obdobie: ${formatDate(settlement.period.from)} - ${formatDate(settlement.period.to)}
        </div>
    </div>

    <div class="financial-summary">
        <div class="summary-card income">
            <h3>Celkové príjmy</h3>
            <div class="amount">${settlement.totalIncome.toFixed(2)}€</div>
        </div>
        <div class="summary-card expenses">
            <h3>Celkové náklady</h3>
            <div class="amount">${settlement.totalExpenses.toFixed(2)}€</div>
        </div>
        <div class="summary-card commission">
            <h3>Celkové provízie</h3>
            <div class="amount">${settlement.totalCommission.toFixed(2)}€</div>
        </div>
        <div class="summary-card ${settlement.profit >= 0 ? 'profit' : 'loss'}">
            <h3>${settlement.profit >= 0 ? 'Celkový zisk' : 'Celková strata'}</h3>
            <div class="amount">${settlement.profit.toFixed(2)}€</div>
        </div>
    </div>

    <div class="section">
        <h2 class="section-title">Prehľad podľa spôsobov platby</h2>
        
        <table>
            <thead>
                <tr>
                    <th>Spôsob platby</th>
                    <th class="text-center">Počet prenájmov</th>
                    <th class="text-right">Celková cena (€)</th>
                    <th class="text-right">Provízie (€)</th>
                    <th class="text-right">Po odpočítaní provízií (€)</th>
                </tr>
            </thead>
            <tbody>
                ${Object.entries(paymentMethodStats).map(([method, stats]) => `
                    <tr>
                        <td>
                            <span class="payment-method-indicator payment-${method === 'cash' ? 'cash' : method === 'bank_transfer' ? 'bank' : method === 'vrp' ? 'vrp' : 'owner'}"></span>
                            ${getPaymentMethodLabel(method)}
                        </td>
                        <td class="text-center">
                            <span class="chip">${stats.count}</span>
                        </td>
                        <td class="text-right font-bold">${stats.totalPrice.toFixed(2)}</td>
                        <td class="text-right font-bold">${stats.totalCommission.toFixed(2)}</td>
                        <td class="text-right font-bold">${stats.netAmount.toFixed(2)}</td>
                    </tr>
                `).join('')}
                <tr class="total-row">
                    <td class="font-bold">SPOLU</td>
                    <td class="text-center font-bold">${settlement.rentals?.length || 0}</td>
                    <td class="text-right font-bold">${settlement.totalIncome.toFixed(2)}</td>
                    <td class="text-right font-bold">${settlement.totalCommission.toFixed(2)}</td>
                    <td class="text-right font-bold">${(settlement.totalIncome - settlement.totalCommission).toFixed(2)}</td>
                </tr>
            </tbody>
        </table>
    </div>

    <div class="two-column">
        <div class="section">
            <h2 class="section-title">Prenájmy (${settlement.rentals?.length || 0})</h2>
            
            <table>
                <thead>
                    <tr>
                        <th>Vozidlo</th>
                        <th>Zákazník</th> 
                        <th>Platba</th>
                        <th class="text-right">Cena (€)</th>
                        <th class="text-right">Provízia (€)</th>
                    </tr>
                </thead>
                <tbody>
                    ${settlement.rentals.map(rental => `
                        <tr>
                            <td>
                                <div class="font-bold">${rental.vehicle?.brand || ''} ${rental.vehicle?.model || ''}</div>
                                <div style="font-size: 10px; color: #666;">${rental.vehicle?.licensePlate || ''}</div>
                            </td>
                            <td>${rental.customerName}</td>
                            <td>
                                <span class="payment-method-indicator payment-${rental.paymentMethod === 'cash' ? 'cash' : rental.paymentMethod === 'bank_transfer' ? 'bank' : rental.paymentMethod === 'vrp' ? 'vrp' : 'owner'}"></span>
                                ${getPaymentMethodLabel(rental.paymentMethod)}
                            </td>
                            <td class="text-right font-bold">${rental.totalPrice.toFixed(2)}</td>
                            <td class="text-right font-bold">${rental.commission.toFixed(2)}</td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
        </div>

        <div class="section">
            <h2 class="section-title">Náklady ${settlement.company || 'N/A'} (${settlement.expenses?.length || 0})</h2>
            
            <table>
                <thead>
                    <tr>
                        <th>Popis</th>
                        <th>Kategória</th>
                        <th class="text-right">Suma (€)</th>
                    </tr>
                </thead>
                <tbody>
                    ${settlement.expenses.map(expense => `
                        <tr>
                            <td class="font-bold">${expense.description}</td>
                            <td><span class="chip">${expense.category}</span></td>
                            <td class="text-right font-bold">${expense.amount.toFixed(2)}</td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
        </div>
    </div>

    <div style="margin-top: 40px; text-align: center; color: #666; font-size: 11px;">
        <p>ID vyúčtovania: ${settlement.id.slice(-8).toUpperCase()}</p>
        <p>Dokument automaticky vygenerovaný systémom BlackRent dňa ${new Date().toLocaleDateString('sk-SK')}</p>
    </div>
</body>
</html>
    `;
  }

  // Cleanup method
  async cleanup(): Promise<void> {
    await this.closeBrowser();
  }
} 