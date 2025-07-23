import { PDFDocument, rgb, PageSizes } from 'pdf-lib';
import fontkit from '@pdf-lib/fontkit';
import { HandoverProtocol, ReturnProtocol } from '../types';
import fs from 'fs';
import path from 'path';

/**
 * PDF-lib CUSTOM Font Generator - Používa vlastný font používateľa
 * Plná podpora slovenskej diakritiky s custom fontom
 */
export class PDFLibCustomFontGenerator {
  private doc!: PDFDocument;
  private currentY: number = 750;
  private pageWidth: number = 595;
  private pageHeight: number = 842;
  private margin: number = 50;
  private primaryColor = rgb(0.1, 0.46, 0.82);
  private secondaryColor = rgb(0.26, 0.26, 0.26);
  private lightGray = rgb(0.94, 0.94, 0.94);
  private currentPage: any;
  private font: any;
  private boldFont: any;
  
  // Konfigurácia vlastného fontu
  private customFontPath: string;
  private customBoldFontPath: string;
  private fontName: string;

  constructor(fontName: string = 'aeonik') {
    this.fontName = fontName;
    // Podpora pre rôzne formáty fontov (TTF, WOFF, WOFF2)
    this.customFontPath = this.findFontFile(fontName, 'regular');
    this.customBoldFontPath = this.findFontFile(fontName, 'bold');
  }

  /**
   * Nájde font súbor s podporou rôznych formátov
   */
  private findFontFile(fontName: string, weight: string): string {
    const fontDir = path.join(__dirname, '../../fonts');
    const possibleExtensions = ['.ttf', '.otf', '.woff2', '.woff'];
    const possibleNames = [
      `${fontName}-${weight}`,
      `${fontName}_${weight}`,
      `${fontName}${weight}`,
      weight === 'regular' ? fontName : `${fontName}-${weight}`
    ];
    
    // Špecifické mapovanie pre Aeonik font
    if (fontName.toLowerCase().includes('aeonik')) {
      const aeonikDir = path.join(fontDir, 'Aeonik Essentials Website');
      if (weight === 'regular') {
        const regularWoff2 = path.join(aeonikDir, 'aeonik-regular.woff2');
        const regularWoff = path.join(aeonikDir, 'aeonik-regular.woff');
        if (fs.existsSync(regularWoff2)) return regularWoff2;
        if (fs.existsSync(regularWoff)) return regularWoff;
      } else if (weight === 'bold') {
        const boldWoff2 = path.join(aeonikDir, 'aeonik-bold.woff2');
        const boldWoff = path.join(aeonikDir, 'aeonik-bold.woff');
        if (fs.existsSync(boldWoff2)) return boldWoff2;
        if (fs.existsSync(boldWoff)) return boldWoff;
      }
    }
    
    // Všeobecné hľadanie
    for (const name of possibleNames) {
      for (const ext of possibleExtensions) {
        const filePath = path.join(fontDir, `${name}${ext}`);
        if (fs.existsSync(filePath)) {
          return filePath;
        }
      }
    }
    
    // Fallback
    return path.join(fontDir, `${fontName}.ttf`);
  }

  /**
   * Generovanie handover protokolu s VLASTNÝM fontom
   */
  async generateHandoverProtocol(protocol: HandoverProtocol): Promise<Buffer> {
    console.log(`🎨 PDF-LIB CUSTOM FONT GENERÁTOR SPUSTENÝ - ${this.fontName.toUpperCase()}`);
    console.log('📋 Protokol ID:', protocol.id);
    
    // Vytvorenie PDF dokumentu s fontkit
    this.doc = await PDFDocument.create();
    this.doc.registerFontkit(fontkit);
    this.currentPage = this.doc.addPage(PageSizes.A4);
    
    // Načítanie vlastného fontu
    await this.loadCustomFont();
    
    this.currentY = this.pageHeight - 50;
    
    // 1. Záhlavie s vlastným fontom
    this.addCustomFontHeader('PROTOKOL PREVZATIA VOZIDLA');
    
    // 2. Základné informácie
    this.addInfoSection('Základné informácie', [
      ['Číslo protokolu:', protocol.id.slice(-8).toUpperCase()],
      ['Dátum vytvorenia:', new Date(protocol.createdAt).toLocaleDateString('sk-SK')],
      ['Miesto prevzatia:', protocol.location],
      ['Stav protokolu:', this.getStatusText(protocol.status)]
    ]);
    
    // 3. Informácie o prenájme
    if (protocol.rentalData) {
      this.addInfoSection('Informácie o prenájme', [
        ['Číslo objednávky:', protocol.rentalData.orderNumber || 'N/A'],
        ['Zákazník:', protocol.rentalData.customer?.name || 'N/A'],
        ['Dátum od:', new Date(protocol.rentalData.startDate).toLocaleDateString('sk-SK')],
        ['Dátum do:', new Date(protocol.rentalData.endDate).toLocaleDateString('sk-SK')],
        ['Celková cena:', `${protocol.rentalData.totalPrice} ${protocol.rentalData.currency}`],
        ['Záloha:', `${protocol.rentalData.deposit} ${protocol.rentalData.currency}`]
      ]);
    }
    
    // 4. Informácie o vozidle
    if (protocol.rentalData?.vehicle) {
      this.addInfoSection('Informácie o vozidle', [
        ['Značka:', protocol.rentalData.vehicle.brand || 'N/A'],
        ['Model:', protocol.rentalData.vehicle.model || 'N/A'],
        ['ŠPZ:', protocol.rentalData.vehicle.licensePlate || 'N/A'],
        ['Spoločnosť:', protocol.rentalData.vehicle.company || 'N/A']
      ]);
    }
    
    // 5. Stav vozidla
    this.addInfoSection('Stav vozidla pri prevzatí', [
      ['Stav tachometra:', `${protocol.vehicleCondition.odometer} km`],
      ['Úroveň paliva:', `${protocol.vehicleCondition.fuelLevel}%`],
      ['Typ paliva:', protocol.vehicleCondition.fuelType],
      ['Exteriér:', protocol.vehicleCondition.exteriorCondition],
      ['Interiér:', protocol.vehicleCondition.interiorCondition]
    ]);
    
    // 6. Poznámky
    if (protocol.vehicleCondition.notes) {
      this.addNotesSection('Poznámky k stavu vozidla', protocol.vehicleCondition.notes);
    }
    
    // 7. Poškodenia
    if (protocol.damages && protocol.damages.length > 0) {
      this.addDamagesSection(protocol.damages);
    }
    
    // 8. Súhrn médií
    this.addMediaSummary(protocol);
    
    // 9. Podpisy
    if (protocol.signatures && protocol.signatures.length > 0) {
      this.addSignaturesSection(protocol.signatures);
    }
    
    // 10. Poznámky
    if (protocol.notes) {
      this.addNotesSection('Dodatočné poznámky', protocol.notes);
    }
    
    // 11. Footer s vlastným fontom
    this.addCustomFontFooter();
    
    const pdfBytes = await this.doc.save();
    return Buffer.from(pdfBytes);
  }

  /**
   * Generovanie return protokolu
   */
  async generateReturnProtocol(protocol: ReturnProtocol): Promise<Buffer> {
    console.log(`🎨 PDF-LIB CUSTOM FONT - Return protokol (${this.fontName})`);
    
    this.doc = await PDFDocument.create();
    this.doc.registerFontkit(fontkit);
    this.currentPage = this.doc.addPage(PageSizes.A4);
    
    await this.loadCustomFont();
    
    this.currentY = this.pageHeight - 50;
    
    this.addCustomFontHeader('PROTOKOL VRÁTENIA VOZIDLA');
    
    this.addInfoSection('Základné informácie', [
      ['Číslo protokolu:', protocol.id.slice(-8).toUpperCase()],
      ['Dátum vrátenia:', new Date(protocol.completedAt || protocol.createdAt).toLocaleDateString('sk-SK')],
      ['Miesto vrátenia:', protocol.location],
      ['Stav protokolu:', this.getStatusText(protocol.status)]
    ]);
    
    if (protocol.kilometersUsed !== undefined) {
      this.addInfoSection('Informácie o použití', [
        ['Použité kilometre:', `${protocol.kilometersUsed} km`],
        ['Prekročenie limitu:', protocol.kilometerOverage ? `${protocol.kilometerOverage} km` : 'Nie'],
        ['Poplatok za km:', protocol.kilometerFee ? `${protocol.kilometerFee} EUR` : '0 EUR'],
        ['Dodatočné poplatky:', `${protocol.totalExtraFees || 0} EUR`]
      ]);
    }
    
    this.addCustomFontFooter();
    
    const pdfBytes = await this.doc.save();
    return Buffer.from(pdfBytes);
  }

  /**
   * Načítanie vlastného fontu
   */
  private async loadCustomFont(): Promise<void> {
    try {
      console.log(`📁 Načítavam vlastný font: ${this.fontName}...`);
      console.log(`📂 Regular font path: ${this.customFontPath}`);
      console.log(`📂 Bold font path: ${this.customBoldFontPath}`);
      
      // Kontrola existencie font súborov
      const regularExists = fs.existsSync(this.customFontPath);
      const boldExists = fs.existsSync(this.customBoldFontPath);
      
      console.log(`📋 Regular font exists: ${regularExists}`);
      console.log(`📋 Bold font exists: ${boldExists}`);
      
      if (regularExists) {
        // Načítanie regular fontu
        const regularFontBytes = fs.readFileSync(this.customFontPath);
        this.font = await this.doc.embedFont(regularFontBytes);
        console.log(`✅ Vlastný regular font načítaný: ${this.fontName}`);
        
        if (boldExists) {
          // Načítanie bold fontu
          const boldFontBytes = fs.readFileSync(this.customBoldFontPath);
          this.boldFont = await this.doc.embedFont(boldFontBytes);
          console.log(`✅ Vlastný bold font načítaný: ${this.fontName}-bold`);
        } else {
          // Použitie regular fontu aj pre bold ak bold neexistuje
          this.boldFont = this.font;
          console.log(`⚠️  Bold font nenájdený, používam regular pre oba`);
        }
        
        console.log(`🎉 VLASTNÝ FONT ${this.fontName.toUpperCase()} ÚSPEŠNE NAČÍTANÝ!`);
        console.log(`🔤 Plná podpora slovenskej diakritiky s vaším fontom!`);
        
      } else {
        console.log(`❌ Vlastný font nenájdený: ${this.customFontPath}`);
        console.log(`🔄 Fallback na Roboto fonty...`);
        await this.loadRobotoFallback();
      }
      
    } catch (error) {
      console.error(`❌ Chyba pri načítaní vlastného fontu ${this.fontName}:`, error);
      console.log(`🔄 Fallback na Roboto fonty...`);
      await this.loadRobotoFallback();
    }
  }

  /**
   * Fallback na Roboto fonty ak vlastný font zlyhá
   */
  private async loadRobotoFallback(): Promise<void> {
    try {
      const robotoRegularPath = path.join(process.cwd(), 'roboto-regular.woff2');
      const robotoBoldPath = path.join(process.cwd(), 'roboto-bold.woff2');
      
      if (fs.existsSync(robotoRegularPath) && fs.existsSync(robotoBoldPath)) {
        const regularFontBytes = fs.readFileSync(robotoRegularPath);
        const boldFontBytes = fs.readFileSync(robotoBoldPath);
        
        this.font = await this.doc.embedFont(regularFontBytes);
        this.boldFont = await this.doc.embedFont(boldFontBytes);
        
        console.log('✅ Roboto fallback fonty načítané');
      } else {
        // Úplný fallback na štandardné PDF fonty
        const { StandardFonts } = await import('pdf-lib');
        this.font = await this.doc.embedFont(StandardFonts.Helvetica);
        this.boldFont = await this.doc.embedFont(StandardFonts.HelveticaBold);
        console.log('⚠️  Štandardné PDF fonty ako posledný fallback');
      }
    } catch (error) {
      console.error('❌ Aj fallback fonty zlyhali:', error);
      throw new Error('Nepodarilo sa načítať žiadne fonty');
    }
  }

  /**
   * Header s vlastným fontom
   */
  private addCustomFontHeader(title: string): void {
    this.currentPage.drawRectangle({
      x: this.margin,
      y: this.currentY - 40,
      width: this.pageWidth - 2 * this.margin,
      height: 40,
      color: this.primaryColor,
    });
    
    // Vlastný font v hlavičke
    this.currentPage.drawText(title, {
      x: this.pageWidth / 2 - 120,
      y: this.currentY - 25,
      size: 18,
      font: this.boldFont,
      color: rgb(1, 1, 1),
    });
    
    this.currentPage.drawText('BlackRent', {
      x: this.pageWidth - this.margin - 60,
      y: this.currentY - 25,
      size: 12,
      font: this.boldFont,
      color: rgb(1, 1, 1),
    });
    
    this.currentY -= 60;
  }

  /**
   * Informačná sekcia s vlastným fontom
   */
  private addInfoSection(title: string, data: [string, string][]): void {
    this.checkPageBreak(80);
    
    this.currentPage.drawRectangle({
      x: this.margin,
      y: this.currentY - 20,
      width: this.pageWidth - 2 * this.margin,
      height: 20,
      color: this.lightGray,
    });
    
    // Vlastný font v nadpisoch
    this.currentPage.drawText(title, {
      x: this.margin + 10,
      y: this.currentY - 15,
      size: 12,
      font: this.boldFont,
      color: this.secondaryColor,
    });
    
    this.currentY -= 30;
    
    const boxHeight = data.length * 20 + 20;
    
    this.currentPage.drawRectangle({
      x: this.margin,
      y: this.currentY - boxHeight,
      width: this.pageWidth - 2 * this.margin,
      height: boxHeight,
      borderColor: rgb(0.8, 0.8, 0.8),
      borderWidth: 1,
    });
    
    data.forEach(([label, value], index) => {
      const yPos = this.currentY - 15 - (index * 20);
      
      // Vlastný font v texte - plná diakritika!
      this.currentPage.drawText(String(label || ''), {
        x: this.margin + 15,
        y: yPos,
        size: 10,
        font: this.boldFont,
        color: rgb(0, 0, 0),
      });
      
      this.currentPage.drawText(String(value || ''), {
        x: this.margin + 150,
        y: yPos,
        size: 10,
        font: this.font,
        color: rgb(0, 0, 0),
      });
    });
    
    this.currentY -= boxHeight + 15;
  }

  /**
   * Sekcia pre poškodenia s vlastným fontom
   */
  private addDamagesSection(damages: any[]): void {
    this.addInfoSection('Zaznamenané poškodenia', 
      damages.map((damage, index) => [
        `Poškodenie ${index + 1}:`,
        `${damage.description} (${damage.severity})`
      ])
    );
  }

  /**
   * Súhrn médií
   */
  private addMediaSummary(protocol: HandoverProtocol): void {
    const totalImages = (protocol.vehicleImages?.length || 0) + 
                       (protocol.documentImages?.length || 0) + 
                       (protocol.damageImages?.length || 0);
    const totalVideos = protocol.vehicleVideos?.length || 0;
    
    this.addInfoSection('Priložené súbory', [
      ['Počet fotiek:', totalImages.toString()],
      ['Fotky vozidla:', (protocol.vehicleImages?.length || 0).toString()],
      ['Fotky dokladov:', (protocol.documentImages?.length || 0).toString()],
      ['Fotky poškodení:', (protocol.damageImages?.length || 0).toString()],
      ['Počet videí:', totalVideos.toString()]
    ]);
  }

  /**
   * Sekcia pre podpisy
   */
  private addSignaturesSection(signatures: any[]): void {
    const signatureData: [string, string][] = [];
    
    signatures.forEach((signature, index) => {
      signatureData.push(
        [`Podpis ${index + 1}:`, `${signature.signerName} (${signature.signerRole})`],
        [`Čas podpisu:`, new Date(signature.timestamp).toLocaleString('sk-SK')],
        [`Miesto:`, signature.location || 'N/A']
      );
    });
    
    this.addInfoSection('Podpisy', signatureData);
  }

  /**
   * Poznámky s vlastným fontom
   */
  private addNotesSection(title: string, notes: string): void {
    this.checkPageBreak(60);
    
    this.currentPage.drawRectangle({
      x: this.margin,
      y: this.currentY - 20,
      width: this.pageWidth - 2 * this.margin,
      height: 20,
      color: this.lightGray,
    });
    
    this.currentPage.drawText(title, {
      x: this.margin + 10,
      y: this.currentY - 15,
      size: 12,
      font: this.boldFont,
      color: this.secondaryColor,
    });
    
    this.currentY -= 30;
    
    const maxWidth = this.pageWidth - 2 * this.margin - 20;
    const lines = this.wrapCustomFontText(notes, maxWidth, 10);
    const boxHeight = lines.length * 15 + 20;
    
    this.currentPage.drawRectangle({
      x: this.margin,
      y: this.currentY - boxHeight,
      width: this.pageWidth - 2 * this.margin,
      height: boxHeight,
      borderColor: rgb(0.8, 0.8, 0.8),
      borderWidth: 1,
    });
    
    lines.forEach((line, index) => {
      // Vlastný font v poznámkach
      this.currentPage.drawText(line, {
        x: this.margin + 10,
        y: this.currentY - 15 - (index * 15),
        size: 10,
        font: this.font,
        color: rgb(0, 0, 0),
      });
    });
    
    this.currentY -= boxHeight + 15;
  }

  /**
   * Footer s vlastným fontom
   */
  private addCustomFontFooter(): void {
    const footerY = 40;
    
    this.currentPage.drawLine({
      start: { x: this.margin, y: footerY + 20 },
      end: { x: this.pageWidth - this.margin, y: footerY + 20 },
      thickness: 2,
      color: this.primaryColor,
    });
    
    // Footer s vlastným fontom
    const footerText = `Vygenerované ${new Date().toLocaleString('sk-SK')} | BlackRent Systém (${this.fontName})`;
    this.currentPage.drawText(footerText, {
      x: this.pageWidth / 2 - 90,
      y: footerY,
      size: 8,
      font: this.font,
      color: this.secondaryColor,
    });
    
    this.currentPage.drawText('Strana 1', {
      x: this.pageWidth - this.margin - 40,
      y: footerY,
      size: 8,
      font: this.font,
      color: this.secondaryColor,
    });
  }

  private checkPageBreak(requiredSpace: number): void {
    if (this.currentY - requiredSpace < 80) {
      this.currentPage = this.doc.addPage(PageSizes.A4);
      this.currentY = this.pageHeight - 50;
    }
  }

  /**
   * Text wrapping s vlastným fontom
   */
  private wrapCustomFontText(text: string, maxWidth: number, fontSize: number): string[] {
    const words = text.split(' ');
    const lines: string[] = [];
    let currentLine = '';
    
    for (const word of words) {
      const testLine = currentLine + (currentLine ? ' ' : '') + word;
      const testWidth = this.estimateCustomFontWidth(testLine, fontSize);
      
      if (testWidth <= maxWidth) {
        currentLine = testLine;
      } else {
        if (currentLine) {
          lines.push(currentLine);
        }
        currentLine = word;
      }
    }
    
    if (currentLine) {
      lines.push(currentLine);
    }
    
    return lines;
  }

  /**
   * Odhad šírky textu pre vlastný font
   */
  private estimateCustomFontWidth(text: string, fontSize: number): number {
    // Odhad pre vlastný font (môže sa líšiť podľa typu fontu)
    return text.length * (fontSize * 0.6);
  }

  /**
   * Status text s vlastným fontom
   */
  private getStatusText(status: string): string {
    const statusMap: { [key: string]: string } = {
      'pending': 'Čaká na spracovanie',
      'in_progress': 'Prebieha',
      'completed': 'Dokončený',
      'cancelled': 'Zrušený'
    };
    return statusMap[status] || status;
  }
} 