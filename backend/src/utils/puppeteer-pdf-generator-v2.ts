import puppeteer, { Browser, Page } from 'puppeteer';
import { HandoverProtocol, ReturnProtocol } from '../types';

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
            <span>BlackRent - Protokol prevzatia | ${new Date().toLocaleDateString('sk-SK')}</span>
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
            <span>BlackRent - Protokol vrátenia | ${new Date().toLocaleDateString('sk-SK')}</span>
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
    <title>Protokol prevzatia - ${protocol.id}</title>
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
        <h2>PROTOKOL PREVZATIA VOZIDLA</h2>
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
    <title>Protokol vrátenia - ${protocol.id}</title>
    <!-- Same CSS as handover -->
</head>
<body>
    <div class="header">
        <h1>BLACKRENT</h1>
        <h2>PROTOKOL VRÁTENIA VOZIDLA</h2>
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

  // Cleanup method
  async cleanup(): Promise<void> {
    await this.closeBrowser();
  }
} 