import { PDFDocument, rgb, PageSizes } from 'pdf-lib';
import fontkit from '@pdf-lib/fontkit';
import { HandoverProtocol, ReturnProtocol } from '../types';
import { getProtocolCompanyDisplay, getRepresentativeSection } from './protocol-helpers';
import fs from 'fs';
import path from 'path';

/**
 * PDF-lib TRUE Unicode Generator - Skutočná plná podpora slovenskej diakritiky
 * Používa embeddované Roboto fonty pre perfektný Slovak text rendering
 */
export class PDFLibTrueUnicodeGenerator {
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

  constructor() {
    // Inicializácia sa vykoná v generate metódach
  }

  /**
   * Generovanie handover protokolu s TRUE Unicode podporou
   */
  async generateHandoverProtocol(protocol: HandoverProtocol): Promise<Buffer> {
    console.log('🎨 PDF-LIB TRUE UNICODE GENERÁTOR SPUSTENÝ - Handover protokol');
    console.log('📋 Protokol ID:', protocol.id);
    
    // Vytvorenie PDF dokumentu s fontkit
    this.doc = await PDFDocument.create();
    this.doc.registerFontkit(fontkit);
    this.currentPage = this.doc.addPage(PageSizes.A4);
    
    // Načítanie embeddovaných Unicode fontov
    await this.loadEmbeddedUnicodeFonts();
    
    this.currentY = this.pageHeight - 50;
    
    // 1. Záhlavie s plnou diakritiku
    this.addTrueUnicodeHeader('ODOVZDÁVACÍ PROTOKOL');
    
    // 2. Základné informácie s diakritiku
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
          ['Spoločnosť:', getProtocolCompanyDisplay(protocol.rentalData.vehicle.company)],
          ...getRepresentativeSection()
        ]);
    }
    
    // 5. Stav vozidla s plnou diakritiku  
    this.addInfoSection('Stav vozidla pri prevzatí', [
      ['Stav tachometra:', `${protocol.vehicleCondition.odometer} km`],
      ['Úroveň paliva:', `${protocol.vehicleCondition.fuelLevel}%`],
      ['Typ paliva:', protocol.vehicleCondition.fuelType],
      ['Exteriér:', protocol.vehicleCondition.exteriorCondition],
      ['Interiér:', protocol.vehicleCondition.interiorCondition]
    ]);
    
    // 6. Poznámky s diakritiku
    if (protocol.vehicleCondition.notes) {
      this.addNotesSection('Poznámky k stavu vozidla', protocol.vehicleCondition.notes);
    }
    
    // 7. Poškodenia s plnou podporou
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
    
    // 11. Footer s diakritiku
    this.addTrueUnicodeFooter();
    
    const pdfBytes = await this.doc.save();
    return Buffer.from(pdfBytes);
  }

  /**
   * Generovanie return protokolu
   */
  async generateReturnProtocol(protocol: ReturnProtocol): Promise<Buffer> {
    console.log('🎨 PDF-LIB TRUE UNICODE - Return protokol');
    
    this.doc = await PDFDocument.create();
    this.doc.registerFontkit(fontkit);
    this.currentPage = this.doc.addPage(PageSizes.A4);
    
    await this.loadEmbeddedUnicodeFonts();
    
    this.currentY = this.pageHeight - 50;
    
    this.addTrueUnicodeHeader('PREBERACÍ PROTOKOL');
    
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
    
    this.addTrueUnicodeFooter();
    
    const pdfBytes = await this.doc.save();
    return Buffer.from(pdfBytes);
  }

  /**
   * Načítanie embeddovaných Unicode fontov (Roboto)
   */
  private async loadEmbeddedUnicodeFonts(): Promise<void> {
    try {
      console.log('📁 Načítavam embeddované Unicode fonty (Roboto)...');
      
      // Načítanie font súborov z disku
      const robotoRegularPath = path.join(process.cwd(), 'roboto-regular.woff2');
      const robotoBoldPath = path.join(process.cwd(), 'roboto-bold.woff2');
      
      if (fs.existsSync(robotoRegularPath) && fs.existsSync(robotoBoldPath)) {
        console.log('✅ Našiel som lokálne Roboto fonty, načítavam...');
        
        const regularFontBytes = fs.readFileSync(robotoRegularPath);
        const boldFontBytes = fs.readFileSync(robotoBoldPath);
        
        this.font = await this.doc.embedFont(regularFontBytes);
        this.boldFont = await this.doc.embedFont(boldFontBytes);
        
        console.log('✅ Roboto fonty úspešne načítané! Plná Unicode podpora aktívna.');
      } else {
        console.log('⚠️  Roboto fonty nenájdené, používam fallback...');
        await this.loadFallbackFonts();
      }
      
    } catch (error) {
      console.error('❌ Chyba pri načítaní embeddovaných fontov:', error);
      console.log('🔄 Skúšam fallback fonty...');
      await this.loadFallbackFonts();
    }
  }

  /**
   * Fallback fonty ak embeddované nefungujú
   */
  private async loadFallbackFonts(): Promise<void> {
    const { StandardFonts } = await import('pdf-lib');
    
    // Fallback na najlepšie dostupné PDF fonty
    this.font = await this.doc.embedFont(StandardFonts.Helvetica);
    this.boldFont = await this.doc.embedFont(StandardFonts.HelveticaBold);
    
    console.log('⚠️  Používam fallback fonty - diakritika môže byť problematická');
  }

  /**
   * Header s TRUE Unicode podporou
   */
  private addTrueUnicodeHeader(title: string): void {
    this.currentPage.drawRectangle({
      x: this.margin,
      y: this.currentY - 40,
      width: this.pageWidth - 2 * this.margin,
      height: 40,
      color: this.primaryColor,
    });
    
    // Použitie TRUE Unicode textu (žiadna konverzia!)
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
   * Informačná sekcia s TRUE Unicode
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
    
    // Plná diakritika v nadpisoch - žiadna konverzia!
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
      
      // TRUE Unicode text - Č, Š, Ž, Ľ, Ť, Ň zostávajú zachované!
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
   * Sekcia pre poškodenia s plnou diakritiku
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
   * Poznámky s TRUE Unicode wrappingom
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
    
    // Plná diakritika v nadpise
    this.currentPage.drawText(title, {
      x: this.margin + 10,
      y: this.currentY - 15,
      size: 12,
      font: this.boldFont,
      color: this.secondaryColor,
    });
    
    this.currentY -= 30;
    
    const maxWidth = this.pageWidth - 2 * this.margin - 20;
    const lines = this.wrapTrueUnicodeText(notes, maxWidth, 10);
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
      // TRUE Unicode text v poznámkach - bez konverzie!
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
   * Footer s plnou diakritiku
   */
  private addTrueUnicodeFooter(): void {
    const footerY = 40;
    
    this.currentPage.drawLine({
      start: { x: this.margin, y: footerY + 20 },
      end: { x: this.pageWidth - this.margin, y: footerY + 20 },
      thickness: 2,
      color: this.primaryColor,
    });
    
    // TRUE Unicode footer text
    const footerText = `Vygenerované ${new Date().toLocaleString('sk-SK')} | BlackRent Systém`;
    this.currentPage.drawText(footerText, {
      x: this.pageWidth / 2 - 80,
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
   * TRUE Unicode text wrapping (zachováva všetku diakritiku)
   */
  private wrapTrueUnicodeText(text: string, maxWidth: number, fontSize: number): string[] {
    // Žiadna konverzia - zachováva Č, Š, Ž, Ľ, Ť, Ň, atď.
    const words = text.split(' ');
    const lines: string[] = [];
    let currentLine = '';
    
    for (const word of words) {
      const testLine = currentLine + (currentLine ? ' ' : '') + word;
      const testWidth = this.estimateUnicodeTextWidth(testLine, fontSize);
      
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
   * Odhad šírky TRUE Unicode textu
   */
  private estimateUnicodeTextWidth(text: string, fontSize: number): number {
    // Lepší odhad pre Unicode znaky vrátane slovenskej diakritiky
    return text.length * (fontSize * 0.55); // Mierne užší pre Roboto font
  }

  /**
   * Status text s plnou diakritiku
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