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

  constructor(fontName: string = 'sf-pro') {
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
    
    // Špecifické mapovanie pre SF-Pro font
    if (fontName.toLowerCase().includes('sf-pro') || fontName.toLowerCase().includes('sfpro')) {
      const sfProDir = path.join(fontDir, 'SF-Pro-Expanded-Font-main');
      const sfProFile = path.join(sfProDir, 'SF-Pro.ttf');
      
      // SF-Pro.ttf obsahuje všetky váhy, použijeme ho pre regular aj bold
      if (fs.existsSync(sfProFile)) {
        console.log(`🔍 SF-Pro font nájdený: ${sfProFile}`);
        return sfProFile;
      }
    }
    
    // Špecifické mapovanie pre Aeonik font (legacy podpora)
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
    
    // 8. Obrázky vozidla 🖼️
    await this.addImagesSection('🚗 FOTKY VOZIDLA', protocol.vehicleImages || []);
    
    // 9. Obrázky dokumentov 🖼️
    await this.addImagesSection('📄 FOTKY DOKUMENTOV', protocol.documentImages || []);
    
    // 10. Obrázky poškodení 🖼️  
    await this.addImagesSection('⚠️ FOTKY POŠKODENÍ', protocol.damageImages || []);
    
    // 11. Podpisy
    if (protocol.signatures && protocol.signatures.length > 0) {
      this.addSignaturesSection(protocol.signatures);
    }
    
    // 12. Poznámky
    if (protocol.notes) {
      this.addNotesSection('Dodatočné poznámky', protocol.notes);
    }
    
    // 13. Footer s vlastným fontom
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
   * 🎨 MODERNÁ HLAVIČKA s vlastným fontom
   */
  private addCustomFontHeader(title: string): void {
    // 🎨 GRADIENT EFEKT HLAVIČKY
    
    // Svetlá báza pre gradient efekt
    this.currentPage.drawRectangle({
      x: this.margin,
      y: this.currentY - 65,
      width: this.pageWidth - 2 * this.margin,
      height: 65,
      color: rgb(0.96, 0.96, 0.98), // Veľmi svetlá sivá
    });
    
    // Hlavný gradient - tmavšia modrá
    this.currentPage.drawRectangle({
      x: this.margin,
      y: this.currentY - 55,
      width: this.pageWidth - 2 * this.margin,
      height: 55,
      color: rgb(0.15, 0.35, 0.75), // Tmavšia elegantná modrá
    });
    
    // Svetlejší gradient overlay
    this.currentPage.drawRectangle({
      x: this.margin,
      y: this.currentY - 45,
      width: this.pageWidth - 2 * this.margin,
      height: 35,
      color: rgb(0.26, 0.46, 0.95), // Moderná modrá primárna
    });

    // 🏢 LOGO AREA - Left side
    this.currentPage.drawRectangle({
      x: this.margin + 10,
      y: this.currentY - 40,
      width: 120,
      height: 25,
      color: rgb(1, 1, 1), // Biely box pre logo
      borderColor: rgb(0.9, 0.9, 0.9),
      borderWidth: 1,
    });
    
    this.currentPage.drawText('🚗 BlackRent', {
      x: this.margin + 20,
      y: this.currentY - 32,
      size: 14,
      font: this.boldFont,
      color: rgb(0.15, 0.35, 0.75),
    });
    
    this.currentPage.drawText('Premium Rental', {
      x: this.margin + 25,
      y: this.currentY - 47,
      size: 8,
      font: this.font,
      color: rgb(0.5, 0.5, 0.5),
    });

    // 📄 HLAVNÝ TITULOK - Center
    const titleWidth = this.font.widthOfTextAtSize(title, 20);
    const centerX = this.pageWidth / 2 - titleWidth / 2;
    
    // Tieň pre titulok
    this.currentPage.drawText(title, {
      x: centerX + 1,
      y: this.currentY - 31,
      size: 20,
      font: this.boldFont,
      color: rgb(0.7, 0.7, 0.7), // Sivý tieň
    });
    
    // Hlavný titulok
    this.currentPage.drawText(title, {
      x: centerX,
      y: this.currentY - 30,
      size: 20,
      font: this.boldFont,
      color: rgb(1, 1, 1),
    });

    // 📅 DÁTUM A ČAS - Right side
    const now = new Date();
    const dateStr = now.toLocaleDateString('sk-SK');
    const timeStr = now.toLocaleTimeString('sk-SK', { hour: '2-digit', minute: '2-digit' });
    
    this.currentPage.drawText('📅 ' + dateStr, {
      x: this.pageWidth - this.margin - 85,
      y: this.currentY - 25,
      size: 10,
      font: this.font,
      color: rgb(1, 1, 1),
    });
    
    this.currentPage.drawText('🕐 ' + timeStr, {
      x: this.pageWidth - this.margin - 85,
      y: this.currentY - 40,
      size: 10,
      font: this.font,
      color: rgb(1, 1, 1),
    });

    // 📏 DEKORAČNÁ LINKA POD HLAVIČKOU
    this.currentPage.drawRectangle({
      x: this.margin,
      y: this.currentY - 70,
      width: this.pageWidth - 2 * this.margin,
      height: 3,
      color: rgb(0.26, 0.46, 0.95),
    });
    
    this.currentY -= 85;
  }

  /**
   * 🎨 MODERNÁ INFORMAČNÁ SEKCIA s vlastným fontom
   */
  private addInfoSection(title: string, data: [string, string][]): void {
    this.checkPageBreak(data.length * 22 + 60);
    
    // 🎨 MODERNÝ HEADER SEKCIE
    // Svetlý gradient pre header
    this.currentPage.drawRectangle({
      x: this.margin,
      y: this.currentY - 35,
      width: this.pageWidth - 2 * this.margin,
      height: 35,
      color: rgb(0.98, 0.98, 0.99), // Svetlá báza
    });
    
    this.currentPage.drawRectangle({
      x: this.margin,
      y: this.currentY - 30,
      width: this.pageWidth - 2 * this.margin,
      height: 30,
      color: rgb(0.94, 0.94, 0.96), // Svetlo-sivá moderná
    });
    
    // Farebná linka na ľavej strane
    this.currentPage.drawRectangle({
      x: this.margin,
      y: this.currentY - 30,
      width: 4,
      height: 30,
      color: rgb(0.26, 0.46, 0.95), // Modrá accent
    });
    
    // Titulok sekcie s ikonou
    const titleIcon = this.getTitleIcon(title);
    this.currentPage.drawText(`${titleIcon} ${title}`, {
      x: this.margin + 15,
      y: this.currentY - 21,
      size: 13,
      font: this.boldFont,
      color: rgb(0.15, 0.15, 0.15),
    });
    
    this.currentY -= 40;
    
    // 🎨 MODERNÝ OBSAH SEKCIE
    const boxHeight = data.length * 22 + 25;
    
    // Hlavný box s tieňom
    this.currentPage.drawRectangle({
      x: this.margin + 2,
      y: this.currentY - boxHeight - 2,
      width: this.pageWidth - 2 * this.margin,
      height: boxHeight,
      color: rgb(0.95, 0.95, 0.95), // Tieň
    });
    
    this.currentPage.drawRectangle({
      x: this.margin,
      y: this.currentY - boxHeight,
      width: this.pageWidth - 2 * this.margin,
      height: boxHeight,
      color: rgb(1, 1, 1), // Biely background
      borderColor: rgb(0.9, 0.9, 0.9),
      borderWidth: 1,
    });
    
    // Obsah v modernom štýle
    data.forEach(([label, value], index) => {
      const yPos = this.currentY - 20 - (index * 22);
      const isEven = index % 2 === 0;
      
      // Striedavé pozadie pre lepšiu čitateľnosť
      if (isEven) {
        this.currentPage.drawRectangle({
          x: this.margin + 1,
          y: yPos - 15,
          width: this.pageWidth - 2 * this.margin - 2,
          height: 20,
          color: rgb(0.99, 0.99, 0.995), // Jemne odlíšené pozadie
        });
      }
      
      // Label s bodkou
      this.currentPage.drawText('•', {
        x: this.margin + 15,
        y: yPos,
        size: 8,
        font: this.boldFont,
        color: rgb(0.26, 0.46, 0.95), // Modrá bodka
      });
      
      // Vlastný font v texte - plná diakritika!
      this.currentPage.drawText(String(label || ''), {
        x: this.margin + 25,
        y: yPos,
        size: 10,
        font: this.boldFont,
        color: rgb(0.1, 0.1, 0.1),
      });
      
      // Hodnota s lepším kontrastom
      const valueText = String(value || '');
      const isImportant = valueText.includes('EUR') || valueText.includes('km') || valueText.includes('%');
      
      this.currentPage.drawText(valueText, {
        x: this.margin + 220,
        y: yPos,
        size: 10,
        font: isImportant ? this.boldFont : this.font,
        color: isImportant ? rgb(0.15, 0.35, 0.75) : rgb(0.3, 0.3, 0.3),
      });
      
      // Dekoračná tenkučká linka pod každým riadkom
      if (index < data.length - 1) {
        this.currentPage.drawRectangle({
          x: this.margin + 20,
          y: yPos - 12,
          width: this.pageWidth - 2 * this.margin - 40,
          height: 0.5,
          color: rgb(0.95, 0.95, 0.95),
        });
      }
    });
    
    this.currentY -= boxHeight + 25;
  }

  /**
   * Helper pre ikony titulov
   */
  private getTitleIcon(title: string): string {
    if (title.includes('Základné') || title.includes('informácie')) return '📋';
    if (title.includes('prenájme') || title.includes('Prenájom')) return '🏢';
    if (title.includes('vozidle') || title.includes('Vozidlo')) return '🚗';
    if (title.includes('stav') || title.includes('Stav')) return '⚙️';
    if (title.includes('poškoden') || title.includes('Poškoden')) return '⚠️';
    if (title.includes('podpis') || title.includes('Podpis')) return '✍️';
    if (title.includes('poznámk') || title.includes('Poznámk')) return '📝';
    return '📄';
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

  /**
   * 🖼️ Stiahnutie obrázka z R2 URL
   */
  private async downloadImageFromR2(imageUrl: string): Promise<Uint8Array | null> {
    try {
      console.log('📥 Downloading image from R2:', imageUrl);
      const response = await fetch(imageUrl);
      
      if (!response.ok) {
        console.error('❌ Failed to download image:', response.status, response.statusText);
        return null;
      }
      
      const arrayBuffer = await response.arrayBuffer();
      const uint8Array = new Uint8Array(arrayBuffer);
      
      console.log(`✅ Image downloaded: ${uint8Array.length} bytes`);
      return uint8Array;
      
    } catch (error) {
      console.error('❌ Error downloading image:', error);
      return null;
    }
  }

  /**
   * 🖼️ Pridanie obrázkov do PDF pomocou pdf-lib - MODERNÝ DESIGN
   */
  private async addImagesSection(title: string, images: any[]): Promise<void> {
    if (!images || images.length === 0) {
      // Modernizovaná sekcia pre prázdne obrázky
      this.checkPageBreak(60);
      
      // Gradient-like header s modernou farbou
      this.currentPage.drawRectangle({
        x: this.margin,
        y: this.currentY - 30,
        width: this.pageWidth - 2 * this.margin,
        height: 30,
        color: rgb(0.95, 0.95, 0.97), // Svetlo-sivá moderná
      });
      
      this.currentPage.drawRectangle({
        x: this.margin,
        y: this.currentY - 25,
        width: this.pageWidth - 2 * this.margin,
        height: 25,
        color: rgb(0.26, 0.46, 0.95), // Moderná modrá
      });
      
      this.currentPage.drawText(title, {
        x: this.margin + 15,
        y: this.currentY - 18,
        size: 13,
        font: this.boldFont,
        color: rgb(1, 1, 1),
      });
      
      this.currentPage.drawText('Žiadne obrázky nie sú k dispozícii', {
        x: this.margin + 15,
        y: this.currentY - 50,
        size: 10,
        font: this.font,
        color: rgb(0.5, 0.5, 0.5),
      });
      
      this.currentY -= 80;
      return;
    }

    console.log(`🖼️ Adding ${images.length} images for section: ${title}`);
    
    // 🎨 MODERNÝ HEADER SEKCIE
    this.checkPageBreak(50);
    
    // Gradient-style header
    this.currentPage.drawRectangle({
      x: this.margin,
      y: this.currentY - 35,
      width: this.pageWidth - 2 * this.margin,
      height: 35,
      color: rgb(0.95, 0.95, 0.97), // Svetlá báza 
    });
    
    this.currentPage.drawRectangle({
      x: this.margin,
      y: this.currentY - 30,
      width: this.pageWidth - 2 * this.margin,
      height: 30,
      color: rgb(0.26, 0.46, 0.95), // Moderná modrá primárna
    });
    
    this.currentPage.drawText(title, {
      x: this.margin + 15,
      y: this.currentY - 21,
      size: 14,
      font: this.boldFont,
      color: rgb(1, 1, 1),
    });
    
    // Počet obrázkov
    this.currentPage.drawText(`${images.length} ${images.length === 1 ? 'obrázok' : images.length <= 4 ? 'obrázky' : 'obrázkov'}`, {
      x: this.pageWidth - this.margin - 80,
      y: this.currentY - 21,
      size: 11,
      font: this.font,
      color: rgb(1, 1, 1),
    });
    
    this.currentY -= 50;

    // 🖼️ USPORIADANIE OBRÁZKOV 2 V RADE
    const imagesPerRow = 2;
    const imageSpacing = 15; // Menší spacing medzi obrázkami
    const maxImageWidth = 260; // Väčšie obrázky!
    const maxImageHeight = 190; // Väčšie obrázky!
    
    const availableWidth = this.pageWidth - 2 * this.margin;
    const imageAreaWidth = (availableWidth - imageSpacing) / imagesPerRow;
    const actualMaxWidth = Math.min(maxImageWidth, imageAreaWidth - 10);

    let currentRow = 0;
    let currentCol = 0;
    let rowHeight = 0;

    for (let i = 0; i < images.length; i++) {
      const image = images[i];
      
      try {
        // Stiahnuť obrázok z R2  
        const imageBytes = await this.downloadImageFromR2(image.url);
        
        if (!imageBytes) {
          // Placeholder pre chybný obrázok
          await this.addImagePlaceholderInGrid(i + 1, 'Obrázok sa nepodarilo načítať', currentCol, actualMaxWidth, 100);
          this.moveToNextGridPosition();
          continue;
        }

        // Embed obrázok do PDF
        let pdfImage;
        try {
          pdfImage = await this.doc.embedJpg(imageBytes);
        } catch (jpgError) {
          try {
            pdfImage = await this.doc.embedPng(imageBytes);
          } catch (pngError) {
            console.error('❌ Failed to embed image:', pngError);
            await this.addImagePlaceholderInGrid(i + 1, 'Nepodporovaný formát obrázka', currentCol, actualMaxWidth, 100);
            this.moveToNextGridPosition();
            continue;
          }
        }

        // 🎯 VÝPOČET ROZMEROV - VÄČŠIE OBRÁZKY
        const { width: originalWidth, height: originalHeight } = pdfImage.scale(1);
        
        let width = originalWidth;
        let height = originalHeight;
        
        // Proporcionálne zmenšenie ak je potrebné
        if (width > actualMaxWidth || height > maxImageHeight) {
          const widthRatio = actualMaxWidth / width;
          const heightRatio = maxImageHeight / height;
          const ratio = Math.min(widthRatio, heightRatio);
          
          width = width * ratio;
          height = height * ratio;
        }

        // Výpočet pozície v gridu
        const xPos = this.margin + currentCol * (imageAreaWidth + imageSpacing) + (imageAreaWidth - width) / 2;
        
        // Kontrola či sa zmestí riadok na stránku
        const totalRowHeight = height + 45; // obrázok + popis + spacing
        if (currentCol === 0) { // Začiatok nového riadku
          this.checkPageBreak(totalRowHeight);
          rowHeight = totalRowHeight;
        }

        // 🎨 MODERNÝ OBRÁZOK S TIEŇOM
        // Tieň obrázka
        this.currentPage.drawRectangle({
          x: xPos + 2,
          y: this.currentY - height - 2,
          width: width,
          height: height,
          color: rgb(0.9, 0.9, 0.9),
        });

        // Vykreslenie obrázka
        this.currentPage.drawImage(pdfImage, {
          x: xPos,
          y: this.currentY - height,
          width: width,
          height: height,
        });

        // Moderný border okolo obrázka
        this.currentPage.drawRectangle({
          x: xPos - 1,
          y: this.currentY - height - 1,
          width: width + 2,
          height: height + 2,
          borderColor: rgb(0.85, 0.85, 0.85),
          borderWidth: 1,
        });

        // 📝 MODERNÝ POPIS OBRÁZKA
        const descriptionY = this.currentY - height - 18;
        
        // Popis obrázka
        this.currentPage.drawText(`${i + 1}.`, {
          x: xPos,
          y: descriptionY,
          size: 10,
          font: this.boldFont,
          color: rgb(0.26, 0.46, 0.95), // Modrá farba čísla
        });
        
        const description = image.description || 'Bez popisu';
        const maxDescLength = 35;
        const shortDesc = description.length > maxDescLength ? 
          description.substring(0, maxDescLength) + '...' : description;
          
        this.currentPage.drawText(shortDesc, {
          x: xPos + 20,
          y: descriptionY,
          size: 9,
          font: this.font,
          color: rgb(0.2, 0.2, 0.2),
        });

        // Timestamp
        if (image.timestamp) {
          const timestamp = new Date(image.timestamp).toLocaleDateString('sk-SK');
          this.currentPage.drawText(`📅 ${timestamp}`, {
            x: xPos,
            y: descriptionY - 15,
            size: 8,
            font: this.font,
            color: rgb(0.5, 0.5, 0.5),
          });
        }

        console.log(`✅ Image ${i + 1} added to PDF grid: ${width.toFixed(0)}x${height.toFixed(0)}px at col ${currentCol}`);

        // Posun na ďalšiu pozíciu v gride
        currentCol++;
        if (currentCol >= imagesPerRow) {
          // Nový riadok
          this.currentY -= rowHeight;
          currentCol = 0;
          rowHeight = 0;
        }

      } catch (error) {
        console.error(`❌ Error processing image ${i + 1}:`, error);
        await this.addImagePlaceholderInGrid(i + 1, 'Chyba pri spracovaní obrázka', currentCol, actualMaxWidth, 100);
        this.moveToNextGridPosition();
      }
    }

    // Dokončenie posledného riadku ak nie je úplný
    if (currentCol > 0) {
      this.currentY -= rowHeight;
    }

    // Extra spacing po sekcii obrázkov
    this.currentY -= 20;
  }

  /**
   * 🖼️ Helper metóda pre grid placeholder
   */
  private async addImagePlaceholderInGrid(imageNumber: number, errorMessage: string, col: number, width: number, height: number): Promise<void> {
    const imageSpacing = 15;
    const availableWidth = this.pageWidth - 2 * this.margin;
    const imageAreaWidth = (availableWidth - imageSpacing) / 2;
    
    const xPos = this.margin + col * (imageAreaWidth + imageSpacing) + (imageAreaWidth - width) / 2;
    
    // Sivý placeholder box
    this.currentPage.drawRectangle({
      x: xPos,
      y: this.currentY - height,
      width: width,
      height: height,
      color: rgb(0.95, 0.95, 0.95),
      borderColor: rgb(0.8, 0.8, 0.8),
      borderWidth: 1,
    });
    
    // Error ikona a text
    this.currentPage.drawText('📷', {
      x: xPos + width/2 - 10,
      y: this.currentY - height/2 + 5,
      size: 16,
      font: this.font,
      color: rgb(0.6, 0.6, 0.6),
    });
    
    this.currentPage.drawText(`Obrázok ${imageNumber}`, {
      x: xPos + 5,
      y: this.currentY - height - 15,
      size: 9,
      font: this.boldFont,
      color: rgb(0.4, 0.4, 0.4),
    });
    
    this.currentPage.drawText(errorMessage, {
      x: xPos + 5,
      y: this.currentY - height - 28,
      size: 8,
      font: this.font,
      color: rgb(0.5, 0.5, 0.5),
    });
  }

  /**
   * Helper pre posun v gride
   */
  private moveToNextGridPosition(): void {
    // Táto metóda sa volá v main loop, posun sa spracuje tam
  }

  /**
   * 🖼️ Placeholder pre chybný obrázok
   */
  private addImagePlaceholder(imageNumber: number, errorMessage: string): void {
    this.checkPageBreak(80);
    
    const width = 200;
    const height = 60;
    
    // Sivý box ako placeholder
    this.currentPage.drawRectangle({
      x: this.margin,
      y: this.currentY - height,
      width: width,
      height: height,
      color: this.lightGray,
    });
    
    // Error text
    this.currentPage.drawText(`Obrázok ${imageNumber}`, {
      x: this.margin + 10,
      y: this.currentY - 25,
      size: 12,
      font: this.boldFont,
      color: this.secondaryColor,
    });
    
    this.currentPage.drawText(errorMessage, {
      x: this.margin + 10,
      y: this.currentY - 45,
      size: 9,
      font: this.font,
      color: this.secondaryColor,
    });
    
    this.currentY -= (height + 20);
  }
} 