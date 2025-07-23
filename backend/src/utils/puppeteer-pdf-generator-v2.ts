import puppeteer from 'puppeteer';
import { HandoverProtocol, ReturnProtocol } from '../types';

/**
 * 🎭 PUPPETEER PDF GENERÁTOR V2
 * 
 * Najmodernejší PDF generátor používajúci:
 * - Puppeteer headless Chrome
 * - HTML/CSS templaty
 * - Plnú podporu diakritiky
 * - Profesionálny dizajn
 * - Responzívny layout
 */
export class PuppeteerPDFGeneratorV2 {
  
  /**
   * 🎨 Generuje HTML template pre handover protokol
   */
  private generateHandoverHTML(protocol: HandoverProtocol): string {
    const { rentalData, vehicleCondition, signatures, vehicleImages, location, notes } = protocol;
    const vehicle = rentalData.vehicle;
    const customer = rentalData.customer;
    
    return `
<!DOCTYPE html>
<html lang="sk">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Protokol prevzatia vozidla</title>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        
        body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            font-size: 12px;
            line-height: 1.4;
            color: #333;
            background: #fff;
        }
        
        .container {
            max-width: 800px;
            margin: 0 auto;
            padding: 20px;
        }
        
        .header {
            text-align: center;
            margin-bottom: 30px;
            padding: 20px;
            background: linear-gradient(135deg, #1e3c72 0%, #2a5298 100%);
            color: white;
            border-radius: 10px;
            box-shadow: 0 4px 15px rgba(0,0,0,0.1);
        }
        
        .header h1 {
            font-size: 24px;
            font-weight: bold;
            margin-bottom: 10px;
            text-shadow: 2px 2px 4px rgba(0,0,0,0.3);
        }
        
        .header .subtitle {
            font-size: 14px;
            opacity: 0.9;
        }
        
        .info-grid {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 20px;
            margin-bottom: 25px;
        }
        
        .info-box {
            background: #f8f9fa;
            border: 2px solid #e9ecef;
            border-radius: 8px;
            padding: 15px;
            box-shadow: 0 2px 8px rgba(0,0,0,0.05);
        }
        
        .info-box h3 {
            color: #2a5298;
            font-size: 14px;
            font-weight: bold;
            margin-bottom: 10px;
            padding-bottom: 5px;
            border-bottom: 2px solid #2a5298;
        }
        
        .info-row {
            display: flex;
            justify-content: space-between;
            padding: 3px 0;
            border-bottom: 1px solid #dee2e6;
        }
        
        .info-row:last-child {
            border-bottom: none;
        }
        
        .info-label {
            font-weight: 600;
            color: #495057;
        }
        
        .info-value {
            color: #212529;
        }
        
        .section {
            margin-bottom: 25px;
            background: white;
            border: 1px solid #dee2e6;
            border-radius: 8px;
            overflow: hidden;
            box-shadow: 0 2px 8px rgba(0,0,0,0.05);
        }
        
        .section-header {
            background: linear-gradient(135deg, #28a745 0%, #20c997 100%);
            color: white;
            padding: 12px 15px;
            font-weight: bold;
            font-size: 14px;
        }
        
        .section-content {
            padding: 15px;
        }
        
        .vehicle-condition {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
            gap: 15px;
        }
        
        .condition-item {
            background: #f8f9fa;
            padding: 10px;
            border-radius: 6px;
            border-left: 4px solid #28a745;
        }
        
        .images-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
            gap: 15px;
            margin-top: 15px;
        }
        
        .image-item {
            text-align: center;
            background: #f8f9fa;
            padding: 10px;
            border-radius: 6px;
            border: 1px solid #dee2e6;
        }
        
        .image-item img {
            max-width: 100%;
            max-height: 120px;
            border-radius: 4px;
            box-shadow: 0 2px 8px rgba(0,0,0,0.1);
        }
        
        .signature-section {
            margin-top: 30px;
            padding: 20px;
            background: #f8f9fa;
            border-radius: 8px;
            border: 2px solid #dee2e6;
        }
        
        .signature-grid {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 30px;
        }
        
        .signature-box {
            text-align: center;
            padding: 15px;
            background: white;
            border: 2px solid #2a5298;
            border-radius: 8px;
        }
        
        .signature-image {
            max-width: 200px;
            max-height: 80px;
            margin: 10px 0;
            border: 1px solid #dee2e6;
        }
        
        .footer {
            margin-top: 30px;
            padding: 15px;
            background: #e9ecef;
            border-radius: 8px;
            text-align: center;
            font-size: 11px;
            color: #6c757d;
        }
        
        .protocol-id {
            position: absolute;
            top: 20px;
            right: 20px;
            background: #ffc107;
            color: #212529;
            padding: 5px 10px;
            border-radius: 4px;
            font-weight: bold;
            font-size: 11px;
        }
        
        @media print {
            body { margin: 0; }
            .container { max-width: none; padding: 10px; }
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="protocol-id">ID: ${protocol.id ? protocol.id.slice(-8).toUpperCase() : 'TEST-' + Date.now().toString().slice(-6)}</div>
        
        <div class="header">
            <h1>🚗 PROTOKOL PREVZATIA VOZIDLA</h1>
            <div class="subtitle">Oficiálny dokument o prevzatí vozidla</div>
        </div>
        
        <div class="info-grid">
            <div class="info-box">
                <h3>📋 Základné informácie</h3>
                <div class="info-row">
                    <span class="info-label">Dátum:</span>
                    <span class="info-value">${new Date().toLocaleDateString('sk-SK')}</span>
                </div>
                <div class="info-row">
                    <span class="info-label">Miesto:</span>
                    <span class="info-value">${location}</span>
                </div>
                <div class="info-row">
                    <span class="info-label">Číslo objednávky:</span>
                    <span class="info-value">${rentalData.orderNumber || 'N/A'}</span>
                </div>
            </div>
            
            <div class="info-box">
                <h3>🚙 Informácie o vozidle</h3>
                <div class="info-row">
                    <span class="info-label">Značka/Model:</span>
                    <span class="info-value">${vehicle.brand} ${vehicle.model}</span>
                </div>
                <div class="info-row">
                    <span class="info-label">ŠPZ:</span>
                    <span class="info-value">${vehicle.licensePlate}</span>
                </div>
                <div class="info-row">
                    <span class="info-label">Spoločnosť:</span>
                    <span class="info-value">${vehicle.company}</span>
                </div>
            </div>
        </div>
        
        ${customer.name ? `
        <div class="section">
            <div class="section-header">👤 Informácie o zákazníkovi</div>
            <div class="section-content">
                <div class="info-row">
                    <span class="info-label">Meno:</span>
                    <span class="info-value">${customer.name}</span>
                </div>
                ${customer.email ? `
                <div class="info-row">
                    <span class="info-label">Email:</span>
                    <span class="info-value">${customer.email}</span>
                </div>
                ` : ''}
                ${customer.phone ? `
                <div class="info-row">
                    <span class="info-label">Telefón:</span>
                    <span class="info-value">${customer.phone}</span>
                </div>
                ` : ''}
            </div>
        </div>
        ` : ''}
        
        <div class="section">
            <div class="section-header">🔧 Stav vozidla pri prevzatí</div>
            <div class="section-content">
                <div class="vehicle-condition">
                    <div class="condition-item">
                        <div class="info-label">Stav km:</div>
                        <div class="info-value">${vehicleCondition.odometer} km</div>
                    </div>
                    <div class="condition-item">
                        <div class="info-label">Hladina paliva:</div>
                        <div class="info-value">${vehicleCondition.fuelLevel}%</div>
                    </div>
                    <div class="condition-item">
                        <div class="info-label">Typ paliva:</div>
                        <div class="info-value">${vehicleCondition.fuelType === 'gasoline' ? 'Benzín' : vehicleCondition.fuelType === 'diesel' ? 'Diesel' : vehicleCondition.fuelType}</div>
                    </div>
                    <div class="condition-item">
                        <div class="info-label">Exteriér:</div>
                        <div class="info-value">${vehicleCondition.exteriorCondition}</div>
                    </div>
                    <div class="condition-item">
                        <div class="info-label">Interiér:</div>
                        <div class="info-value">${vehicleCondition.interiorCondition}</div>
                    </div>
                </div>
                ${vehicleCondition.notes ? `
                <div style="margin-top: 15px; padding: 10px; background: #fff3cd; border-radius: 6px; border-left: 4px solid #ffc107;">
                    <strong>Poznámky:</strong> ${vehicleCondition.notes}
                </div>
                ` : ''}
            </div>
        </div>
        
        ${vehicleImages && vehicleImages.length > 0 ? `
        <div class="section">
            <div class="section-header">📸 Fotografie vozidla</div>
            <div class="section-content">
                <div class="images-grid">
                    ${vehicleImages.map((image, index) => `
                        <div class="image-item">
                            <img src="${image.url}" alt="Vozidlo ${index + 1}" />
                            <div style="margin-top: 5px; font-size: 11px; color: #6c757d;">
                                Foto ${index + 1}
                            </div>
                        </div>
                    `).join('')}
                </div>
            </div>
        </div>
        ` : ''}
        
        ${notes ? `
        <div class="section">
            <div class="section-header">📝 Dodatočné poznámky</div>
            <div class="section-content">
                <div style="background: #f8f9fa; padding: 15px; border-radius: 6px; border-left: 4px solid #17a2b8;">
                    ${notes}
                </div>
            </div>
        </div>
        ` : ''}
        
        ${signatures && signatures.length > 0 ? `
        <div class="signature-section">
            <h3 style="text-align: center; margin-bottom: 20px; color: #2a5298;">✍️ Podpisy</h3>
            <div class="signature-grid">
                ${signatures.map(sig => `
                    <div class="signature-box">
                        <div style="font-weight: bold; margin-bottom: 10px;">${sig.signerName}</div>
                        <div style="font-size: 11px; color: #6c757d; margin-bottom: 10px;">${sig.signerRole === 'employee' ? 'Zamestnanec' : 'Zákazník'}</div>
                        ${sig.signature ? `<img src="${sig.signature}" alt="Podpis" class="signature-image" />` : '<div style="height: 60px; border: 1px dashed #ccc; display: flex; align-items: center; justify-content: center; color: #6c757d;">Bez podpisu</div>'}
                        <div style="font-size: 10px; color: #6c757d; margin-top: 10px;">
                            ${new Date(sig.timestamp).toLocaleString('sk-SK')}
                        </div>
                    </div>
                `).join('')}
            </div>
        </div>
        ` : ''}
        
        <div class="footer">
            <div>Protokol vygenerovaný automaticky systémom BlackRent</div>
            <div style="margin-top: 5px;">
                ${new Date().toLocaleString('sk-SK')} | ID: ${protocol.id || 'TEST-PROTOCOL'}
            </div>
        </div>
    </div>
</body>
</html>`;
  }
  
  /**
   * 🎭 Generuje handover protokol cez Puppeteer
   */
  async generateHandoverProtocol(protocol: HandoverProtocol): Promise<Buffer> {
    console.log('🎭 PUPPETEER V2: Generujem handover protokol');
    
    let browser = null;
    
    try {
      console.log('🚀 Spúšťam Puppeteer browser s produkčnými nastaveniami...');
      
      browser = await puppeteer.launch({
        executablePath: process.env.PUPPETEER_EXECUTABLE_PATH || '/usr/bin/google-chrome-stable',
        headless: true,
        args: [
          '--no-sandbox',
          '--disable-setuid-sandbox',
          '--disable-dev-shm-usage',
          '--disable-accelerated-2d-canvas',
          '--no-first-run',
          '--no-zygote',
          '--disable-gpu',
          '--disable-background-timer-throttling',
          '--disable-backgrounding-occluded-windows',
          '--disable-renderer-backgrounding',
          '--disable-features=TranslateUI',
          '--disable-ipc-flooding-protection',
          '--single-process', // Dôležité pre Railway kontajner
          '--no-default-browser-check',
          '--disable-extensions',
          '--disable-plugins',
          '--disable-background-networking',
          '--disable-default-apps',
          '--disable-sync'
        ],
        // Railway kontajner nastavenia
        userDataDir: '/tmp/puppeteer-data',
        timeout: 60000 // 60 sekúnd timeout
      });
      
      const page = await browser.newPage();
      
      // Nastavenie viewport pre A4 formát
      await page.setViewport({
        width: 794,
        height: 1123,
        deviceScaleFactor: 2
      });
      
      // Generovanie HTML obsahu
      const htmlContent = this.generateHandoverHTML(protocol);
      console.log('📄 HTML template vygenerovaný');
      
      // Načítanie HTML do stránky
      await page.setContent(htmlContent, {
        waitUntil: 'networkidle0',
        timeout: 30000
      });
      
      console.log('🖨️ Generujem PDF...');
      
      // Generovanie PDF
      const pdfBuffer = await page.pdf({
        format: 'A4',
        printBackground: true,
        margin: {
          top: '20mm',
          right: '15mm',
          bottom: '20mm',
          left: '15mm'
        },
        preferCSSPageSize: true
      });
      
      console.log('✅ PUPPETEER V2: PDF úspešne vygenerované');
      console.log('📊 Veľkosť PDF:', pdfBuffer.length, 'bytes');
      
      return Buffer.from(pdfBuffer);
      
    } catch (error) {
      console.error('❌ PUPPETEER V2: Chyba pri generovaní PDF:', error);
      throw error;
    } finally {
      if (browser) {
        await browser.close();
        console.log('🔒 Puppeteer browser zatvorený');
      }
    }
  }
  
  /**
   * 🎭 Generuje return protokol (podobne ako handover)
   */
  async generateReturnProtocol(protocol: ReturnProtocol): Promise<Buffer> {
    console.log('🎭 PUPPETEER V2: Return protokol - zatiaľ používam handover template');
    // Pre teraz použijeme handover template, neskôr vytvoríme špecifický pre return
    return this.generateHandoverProtocol(protocol as any);
  }
}

export default PuppeteerPDFGeneratorV2; 