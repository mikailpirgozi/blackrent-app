import { PDFDocument, rgb, StandardFonts, PageSizes } from 'pdf-lib';
import { HandoverProtocol, ReturnProtocol, Settlement } from '../types';

/**
 * PDF-lib Generator - Vysoká kvalita PDF bez system dependencies
 * Produkuje profesionálne PDF dokumenty s lepšou typografiou
 */
export class PDFLibGenerator {
  private doc!: PDFDocument; // Definite assignment assertion - inicializuje sa v generate metódach
  private currentY: number = 750; // PDF súradnice začínajú zdola
  private pageWidth: number = 595; // A4 width
  private pageHeight: number = 842; // A4 height
  private margin: number = 50;
  private primaryColor = rgb(0.1, 0.46, 0.82); // Blue
  private secondaryColor = rgb(0.26, 0.26, 0.26); // Dark gray
  private lightGray = rgb(0.94, 0.94, 0.94);
  private currentPage: any;
  private font: any;
  private boldFont: any;

  constructor() {
    // Inicializácia sa vykoná v generate metódach
  }

  /**
   * Generovanie handover protokolu s pdf-lib
   */
  async generateHandoverProtocol(protocol: HandoverProtocol): Promise<Buffer> {
    console.log('🎨 PDF-LIB GENERÁTOR SPUSTENÝ - Handover protokol');
    console.log('📋 Protokol ID:', protocol.id);
    
    // Vytvorenie nového PDF dokumentu
    this.doc = await PDFDocument.create();
    this.currentPage = this.doc.addPage(PageSizes.A4);
    
    // Nahranie fontov
    this.font = await this.doc.embedFont(StandardFonts.Helvetica);
    this.boldFont = await this.doc.embedFont(StandardFonts.HelveticaBold);
    
    // Reset pozície (PDF súradnice začínajú zdola)
    this.currentY = this.pageHeight - 50;
    
    // 1. Záhlavie s moderným dizajnom
    this.addModernHeader('ODOVZDÁVACÍ PROTOKOL');
    
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
    
    // 6. Poznámky k stavu vozidla
    if (protocol.vehicleCondition.notes) {
      this.addNotesSection('Poznámky k stavu vozidla', protocol.vehicleCondition.notes);
    }
    
    // 7. Poškodenia
    if (protocol.damages && protocol.damages.length > 0) {
      this.addDamagesSection(protocol.damages);
    }
    
    // 8. NOVÉ: Pridanie obrázkov do PDF
    await this.addImagesSection(protocol);
    
    // 9. Súhrn médií
    this.addMediaSummary(protocol);
    
    // 10. Podpisy
    if (protocol.signatures && protocol.signatures.length > 0) {
      await this.addSignaturesSection(protocol.signatures);
    }
    
    // 11. Footer
    this.addModernFooter();
    
    // Konverzia do Buffer
    const pdfBytes = await this.doc.save();
    console.log(`✅ PDF-lib Handover protokol dokončený! Veľkosť: ${(pdfBytes.length / 1024).toFixed(1)} KB`);
    
    return Buffer.from(pdfBytes);
  }

  /**
   * Generovanie return protokolu
   */
  async generateReturnProtocol(protocol: ReturnProtocol): Promise<Buffer> {
    console.log('🎨 PDF-LIB GENERÁTOR - Return protokol');
    
    this.doc = await PDFDocument.create();
    this.currentPage = this.doc.addPage(PageSizes.A4);
    
    this.font = await this.doc.embedFont(StandardFonts.Helvetica);
    this.boldFont = await this.doc.embedFont(StandardFonts.HelveticaBold);
    
    this.currentY = this.pageHeight - 50;
    
    this.addModernHeader('PREBERACÍ PROTOKOL');
    
    // Základné informácie
    this.addInfoSection('Základné informácie', [
      ['Číslo protokolu:', protocol.id.slice(-8).toUpperCase()],
      ['Dátum vrátenia:', new Date(protocol.completedAt || protocol.createdAt).toLocaleDateString('sk-SK')],
      ['Miesto vrátenia:', protocol.location],
      ['Stav protokolu:', this.getStatusText(protocol.status)]
    ]);
    
    // 3. Informácie o prenájme (rovnaké ako handover)
    if (protocol.rentalData) {
      this.addInfoSection('Informácie o prenájme', [
        ['Číslo objednávky:', protocol.rentalData.orderNumber || 'N/A'],
        ['Zákazník:', protocol.rentalData.customer?.name || 'N/A'],
        ['Dátum od:', new Date(protocol.rentalData.startDate).toLocaleDateString('sk-SK')],
        ['Dátum do:', new Date(protocol.rentalData.endDate).toLocaleDateString('sk-SK')],
        ['Celková cena:', `${protocol.rentalData.totalPrice} ${protocol.rentalData.currency || 'EUR'}`],
        ['Záloha:', `${protocol.rentalData.deposit || 0} ${protocol.rentalData.currency || 'EUR'}`]
      ]);
    }
    
    // 4. Informácie o vozidle (rovnaké ako handover)
    if (protocol.rentalData?.vehicle) {
      this.addInfoSection('Informácie o vozidle', [
        ['Značka:', protocol.rentalData.vehicle.brand || 'N/A'],
        ['Model:', protocol.rentalData.vehicle.model || 'N/A'],
        ['ŠPZ:', protocol.rentalData.vehicle.licensePlate || 'N/A'],
        ['Spoločnosť:', protocol.rentalData.vehicle.company || 'N/A']
      ]);
    }
    
    // 5. Stav vozidla pri vrátení (rozšírené)
    this.addInfoSection('Stav vozidla pri vrátení', [
      ['Stav tachometra:', `${protocol.vehicleCondition.odometer} km`],
      ['Úroveň paliva:', `${protocol.vehicleCondition.fuelLevel}%`],
      ['Typ paliva:', protocol.vehicleCondition.fuelType],
      ['Exteriér:', protocol.vehicleCondition.exteriorCondition],
      ['Interiér:', protocol.vehicleCondition.interiorCondition]
    ]);
    
    // 6. Return-specific informácie o použití
    if (protocol.kilometersUsed !== undefined) {
      this.addInfoSection('Informácie o použití', [
        ['Použité kilometre:', `${protocol.kilometersUsed} km`],
        ['Prekročenie limitu:', protocol.kilometerOverage ? `${protocol.kilometerOverage} km` : 'Nie'],
        ['Poplatok za km:', protocol.kilometerFee ? `${protocol.kilometerFee} EUR` : '0 EUR'],
        ['Poplatok za palivo:', protocol.fuelFee ? `${protocol.fuelFee} EUR` : '0 EUR'],
        ['Dodatočné poplatky:', `${protocol.totalExtraFees || 0} EUR`],
        ['Vrátenie zálohy:', `${protocol.depositRefund || 0} EUR`],
        ['Konečné vrátenie:', `${protocol.finalRefund || 0} EUR`]
      ]);
    }
    
    // 7. Poznámky k stavu vozidla
    if (protocol.vehicleCondition.notes) {
      this.addNotesSection('Poznámky k stavu vozidla', protocol.vehicleCondition.notes);
    }
    
    // 8. Poškodenia (ak sú)
    if (protocol.damages && protocol.damages.length > 0) {
      this.addDamagesSection(protocol.damages);
    }
    
    // 9. Nové poškodenia (špecifické pre return)
    if (protocol.newDamages && protocol.newDamages.length > 0) {
      this.addDamagesSection(protocol.newDamages, 'Nové poškodenia zistené pri vrátení');
    }
    
    // 10. ✅ PRIDANÉ: Fotodokumentácia v Return protokole
    await this.addImagesSection(protocol);
    
    // 11. Súhrn médií
    this.addMediaSummary(protocol);
    
    // 12. Podpisy (ak sú)
    if (protocol.signatures && protocol.signatures.length > 0) {
      await this.addSignaturesSection(protocol.signatures);
    }
    
    // 13. Footer
    this.addModernFooter();
    
    const pdfBytes = await this.doc.save();
    return Buffer.from(pdfBytes);
  }

  /**
   * Moderné záhlavie s profesionálnym dizajnom
   */
  private addModernHeader(title: string): void {
    // Hlavný header box s gradientom (simulovaným cez farbu)
    this.currentPage.drawRectangle({
      x: this.margin,
      y: this.currentY - 40,
      width: this.pageWidth - 2 * this.margin,
      height: 40,
      color: this.primaryColor,
    });
    
    // Hlavný nadpis - biely text na modrom pozadí
    this.currentPage.drawText(this.toAsciiText(title), {
      x: this.pageWidth / 2 - 120, // Približne na stred
      y: this.currentY - 25,
      size: 18,
      font: this.boldFont,
      color: rgb(1, 1, 1),
    });
    
    // BlackRent branding v pravom rohu
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
   * Informačná sekcia s moderným boxom
   */
  private addInfoSection(title: string, data: [string, string][]): void {
    this.checkPageBreak(80);
    
    // Nadpis sekcie s šedým pozadím
    this.currentPage.drawRectangle({
      x: this.margin,
      y: this.currentY - 20,
      width: this.pageWidth - 2 * this.margin,
      height: 20,
      color: this.lightGray,
    });
    
    this.currentPage.drawText(this.toAsciiText(title), {
      x: this.margin + 10,
      y: this.currentY - 15,
      size: 12,
      font: this.boldFont,
      color: this.secondaryColor,
    });
    
    this.currentY -= 30;
    
    // Obsah sekcie s rámčekom
    const boxHeight = data.length * 20 + 20;
    
    this.currentPage.drawRectangle({
      x: this.margin,
      y: this.currentY - boxHeight,
      width: this.pageWidth - 2 * this.margin,
      height: boxHeight,
      borderColor: rgb(0.8, 0.8, 0.8),
      borderWidth: 1,
    });
    
    // Dáta v tabuľkovom formáte
    data.forEach(([label, value], index) => {
      const yPos = this.currentY - 15 - (index * 20);
      
      // Label (tučné)
      this.currentPage.drawText(this.toAsciiText(String(label || '')), {
        x: this.margin + 15,
        y: yPos,
        size: 10,
        font: this.boldFont,
        color: rgb(0, 0, 0),
      });
      
      // Value (normálne)
      this.currentPage.drawText(this.toAsciiText(String(value || '')), {
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
   * Sekcia pre poškodenia
   */
  private addDamagesSection(damages: any[], title: string = 'Zaznamenané poškodenia'): void {
    this.addInfoSection(title, 
      damages.map((damage, index) => [
        `Poškodenie ${index + 1}:`,
        `${damage.description} (${damage.severity})`
      ])
    );
  }

  /**
   * Súhrn médií
   */
  private addMediaSummary(protocol: HandoverProtocol | ReturnProtocol): void {
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
   * Sekcia pre podpisy s obrázkami
   */
  private async addSignaturesSection(signatures: any[]): Promise<void> {
    if (!signatures || signatures.length === 0) {
      console.log('⚠️ Žiadne podpisy na vloženie do PDF');
      return;
    }

    console.log('🖊️ Pridávam podpisy do PDF:', signatures.length);
    
    this.checkPageBreak(200); // Priestor pre podpisy
    
    // Nadpis sekcie
    this.currentPage.drawRectangle({
      x: this.margin,
      y: this.currentY - 20,
      width: this.pageWidth - 2 * this.margin,
      height: 20,
      color: this.lightGray,
    });
    
    this.currentPage.drawText(this.toAsciiText('Elektronické podpisy'), {
      x: this.margin + 10,
      y: this.currentY - 15,
      size: 12,
      font: this.boldFont,
      color: this.secondaryColor,
    });
    
    this.currentY -= 40;
    
    // Pridanie každého podpisu
    for (let i = 0; i < signatures.length; i++) {
      const signature = signatures[i];
      
      try {
        // Vloženie obrázka podpisu
        if (signature.signature && signature.signature.startsWith('data:image')) {
          const imageBytes = this.base64ToUint8Array(signature.signature);
          const image = await this.doc.embedPng(imageBytes);
          
          // Výpočet veľkosti obrázka (max 200x100)
          const maxWidth = 200;
          const maxHeight = 100;
          const scale = Math.min(maxWidth / image.width, maxHeight / image.height);
          const scaledWidth = image.width * scale;
          const scaledHeight = image.height * scale;
          
          // Vloženie obrázka
          this.currentPage.drawImage(image, {
            x: this.margin + 10,
            y: this.currentY - scaledHeight,
            width: scaledWidth,
            height: scaledHeight,
          });
          
          // Informácie o podpise
          const infoText = `${signature.signerName} (${signature.signerRole}) - ${new Date(signature.timestamp).toLocaleString('sk-SK')}`;
          this.currentPage.drawText(this.toAsciiText(infoText), {
            x: this.margin + scaledWidth + 20,
            y: this.currentY - 15,
            size: 10,
            font: this.font,
            color: this.secondaryColor,
          });
          
          this.currentY -= scaledHeight + 30;
          
          console.log(`✅ Podpis ${i + 1} vložený: ${signature.signerName}`);
        } else {
          console.log(`⚠️ Podpis ${i + 1} nemá validný obrázok:`, signature.signerName);
        }
      } catch (error) {
        console.error(`❌ Chyba pri vkladaní podpisu ${i + 1}:`, error);
      }
    }
  }

  /**
   * Konverzia base64 na Uint8Array pre PDF-lib
   */
  private base64ToUint8Array(base64String: string): Uint8Array {
    const base64Data = base64String.replace(/^data:image\/[a-z]+;base64,/, '');
    const binaryString = atob(base64Data);
    const bytes = new Uint8Array(binaryString.length);
    for (let i = 0; i < binaryString.length; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }
    return bytes;
  }

  /**
   * Sekcia pre poznámky s lepším text wrappingom
   */
  private addNotesSection(title: string, notes: string): void {
    this.checkPageBreak(60);
    
    // Nadpis
    this.currentPage.drawRectangle({
      x: this.margin,
      y: this.currentY - 20,
      width: this.pageWidth - 2 * this.margin,
      height: 20,
      color: this.lightGray,
    });
    
    this.currentPage.drawText(this.toAsciiText(title), {
      x: this.margin + 10,
      y: this.currentY - 15,
      size: 12,
      font: this.boldFont,
      color: this.secondaryColor,
    });
    
    this.currentY -= 30;
    
    // Poznámky box
    const maxWidth = this.pageWidth - 2 * this.margin - 20;
    const lines = this.wrapText(notes, maxWidth, 10);
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
   * Moderná pätka s dizajnom
   */
  private addModernFooter(): void {
    const footerY = 40;
    
    // Farebná čiara
    this.currentPage.drawLine({
      start: { x: this.margin, y: footerY + 20 },
      end: { x: this.pageWidth - this.margin, y: footerY + 20 },
      thickness: 2,
      color: this.primaryColor,
    });
    
    // Footer text
    const footerText = `Vygenerovane ${new Date().toLocaleString('sk-SK')} | BlackRent System`;
    this.currentPage.drawText(this.toAsciiText(footerText), {
      x: this.pageWidth / 2 - 80,
      y: footerY,
      size: 8,
      font: this.font,
      color: this.secondaryColor,
    });
    
    // Strana číslo
    this.currentPage.drawText(this.toAsciiText('Strana 1'), {
      x: this.pageWidth - this.margin - 40,
      y: footerY,
      size: 8,
      font: this.font,
      color: this.secondaryColor,
    });
  }

  /**
   * Kontrola prelomenia stránky
   */
  private checkPageBreak(requiredSpace: number): void {
    if (this.currentY - requiredSpace < 80) {
      this.currentPage = this.doc.addPage(PageSizes.A4);
      this.currentY = this.pageHeight - 50;
    }
  }

  /**
   * Wrappovanie textu pre lepší layout
   */
  private wrapText(text: string, maxWidth: number, fontSize: number): string[] {
    // Konvertujeme text na ASCII pred wrappingom
    const asciiText = this.toAsciiText(text);
    const words = asciiText.split(' ');
    const lines: string[] = [];
    let currentLine = '';
    
    for (const word of words) {
      const testLine = currentLine + (currentLine ? ' ' : '') + word;
      const testWidth = testLine.length * (fontSize * 0.6); // Aproximácia
      
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
   * Získanie textu stavu
   */
  private getStatusText(status: string): string {
    const statusMap: { [key: string]: string } = {
      'pending': 'Caka na spracovanie',
      'in_progress': 'Prebieha',
      'completed': 'Dokonceny',
      'cancelled': 'Zruseny'
    };
    return statusMap[status] || status;
  }

  /**
   * Konvertuje slovenský text na ASCII (fallback pre PDF-lib font compatibility)
   */
  private toAsciiText(text: string): string {
    const diacriticsMap: { [key: string]: string } = {
      'á': 'a', 'à': 'a', 'â': 'a', 'ä': 'a', 'ã': 'a', 'å': 'a', 'ā': 'a',
      'é': 'e', 'è': 'e', 'ê': 'e', 'ë': 'e', 'ē': 'e', 'ė': 'e', 'ę': 'e',
      'í': 'i', 'ì': 'i', 'î': 'i', 'ï': 'i', 'ī': 'i', 'į': 'i',
      'ó': 'o', 'ò': 'o', 'ô': 'o', 'ö': 'o', 'õ': 'o', 'ø': 'o', 'ō': 'o',
      'ú': 'u', 'ù': 'u', 'û': 'u', 'ü': 'u', 'ū': 'u', 'ų': 'u',
      'ý': 'y', 'ÿ': 'y',
      'č': 'c', 'ć': 'c', 'ç': 'c',
      'ď': 'd', 'đ': 'd',
      'ľ': 'l', 'ĺ': 'l', 'ł': 'l',
      'ň': 'n', 'ń': 'n', 'ñ': 'n',
      'ř': 'r', 'ŕ': 'r',
      'š': 's', 'ś': 's', 'ş': 's',
      'ť': 't', 'ţ': 't',
      'ž': 'z', 'ź': 'z', 'ż': 'z',
      // Veľké písmená
      'Á': 'A', 'À': 'A', 'Â': 'A', 'Ä': 'A', 'Ã': 'A', 'Å': 'A', 'Ā': 'A',
      'É': 'E', 'È': 'E', 'Ê': 'E', 'Ë': 'E', 'Ē': 'E', 'Ė': 'E', 'Ę': 'E',
      'Í': 'I', 'Ì': 'I', 'Î': 'I', 'Ï': 'I', 'Ī': 'I', 'Į': 'I',
      'Ó': 'O', 'Ò': 'O', 'Ô': 'O', 'Ö': 'O', 'Õ': 'O', 'Ø': 'O', 'Ō': 'O',
      'Ú': 'U', 'Ù': 'U', 'Û': 'U', 'Ü': 'U', 'Ū': 'U', 'Ų': 'U',
      'Ý': 'Y', 'Ÿ': 'Y',
      'Č': 'C', 'Ć': 'C', 'Ç': 'C',
      'Ď': 'D', 'Đ': 'D',
      'Ľ': 'L', 'Ĺ': 'L', 'Ł': 'L',
      'Ň': 'N', 'Ń': 'N', 'Ñ': 'N',
      'Ř': 'R', 'Ŕ': 'R',
      'Š': 'S', 'Ś': 'S', 'Ş': 'S',
      'Ť': 'T', 'Ţ': 'T',
      'Ž': 'Z', 'Ź': 'Z', 'Ż': 'Z'
    };

    return text.replace(/[^\u0000-\u007F]/g, (char) => diacriticsMap[char] || char);
  }

  /**
   * NOVÉ: Sekcia pre zobrazenie obrázkov v PDF protokole
   */
  private async addImagesSection(protocol: HandoverProtocol | ReturnProtocol): Promise<void> {
    console.log('🖼️ Pridávam obrázky do PDF protokolu...');
    
    try {
      // Zoznam všetkých obrázkov
      const allImages = [
        ...(protocol.vehicleImages || []),
        ...(protocol.documentImages || []),
        ...(protocol.damageImages || [])
      ];
      
      if (allImages.length === 0) {
        console.log('⚠️ Žiadne obrázky na pridanie do PDF');
        return;
      }
      
      // Nadpis sekcie
      this.checkPageBreak(100);
      this.currentPage.drawRectangle({
        x: this.margin,
        y: this.currentY - 20,
        width: this.pageWidth - 2 * this.margin,
        height: 20,
        color: this.lightGray,
      });
      
      this.currentPage.drawText(this.toAsciiText('FOTODOKUMENTACIA'), {
        x: this.margin + 10,
        y: this.currentY - 15,
        size: 12,
        font: this.boldFont,
        color: this.secondaryColor,
      });
      
      this.currentY -= 30;
      
      let processedImages = 0;
      const maxImagesPerPage = 6; // Maximum 6 obrázkov na stránku
      
      for (const image of allImages) {
        if (!image.url || typeof image.url !== 'string') {
          console.log('⚠️ Preskačujem obrázok bez URL');
          continue;
        }
        
        try {
          // Spracovanie base64 obrázkov
          let imageData: Uint8Array;
          
          if (image.url.startsWith('data:image/')) {
            // Base64 obrázok
            const base64Data = image.url.split(',')[1];
            if (!base64Data) {
              console.log('⚠️ Nevalidný base64 obrázok');
              continue;
            }
            imageData = Uint8Array.from(atob(base64Data), c => c.charCodeAt(0));
          } else {
            // HTTP URL obrázok (ak by bolo potrebné v budúcnosti)
            console.log('⚠️ Preskačujem HTTP URL obrázok - nie je podporovaný');
            continue;
          }
          
          // Embed obrázka do PDF
          let embeddedImage;
          if (image.url.includes('image/jpeg') || image.url.includes('image/jpg')) {
            embeddedImage = await this.doc.embedJpg(imageData);
          } else if (image.url.includes('image/png')) {
            embeddedImage = await this.doc.embedPng(imageData);
          } else {
            console.log('⚠️ Nepodarený formát obrázka, skúšam ako JPEG');
            embeddedImage = await this.doc.embedJpg(imageData);
          }
          
          // Výpočet veľkosti obrázka (max šírka 200px, max výška 150px pre landscape)
          const maxImageWidth = 200;
          const maxImageHeight = 150;
          
          // Zachovaj aspect ratio ale urob obrázky širšie
          let imageWidth = embeddedImage.width;
          let imageHeight = embeddedImage.height;
          
          if (imageWidth > maxImageWidth || imageHeight > maxImageHeight) {
            const ratio = Math.min(maxImageWidth / imageWidth, maxImageHeight / imageHeight);
            imageWidth *= ratio;
            imageHeight *= ratio;
          }
          
          // Pozícia obrázka (2 obrázky na riadok s väčším spacing)
          const imagesPerRow = 2;
          const rowIndex = Math.floor(processedImages / imagesPerRow);
          const colIndex = processedImages % imagesPerRow;
          
          // Širší spacing pre väčšie obrázky
          const imageX = this.margin + (colIndex * (maxImageWidth + 30));
          const imageY = this.currentY - (rowIndex * (maxImageHeight + 50)) - imageHeight;
          
          // Kontrola stránky
          if (imageY < 100) {
            this.currentPage = this.doc.addPage(PageSizes.A4);
            this.currentY = this.pageHeight - 50;
          }
          
          // Pridanie obrázka do PDF
          this.currentPage.drawImage(embeddedImage, {
            x: imageX,
            y: imageY,
            width: imageWidth,
            height: imageHeight,
          });
          
          // Popis obrázka
          const description = image.description || image.type || `Obrázok ${processedImages + 1}`;
          this.currentPage.drawText(this.toAsciiText(description.substring(0, 15)), {
            x: imageX,
            y: imageY - 15,
            size: 8,
            font: this.font,
            color: this.secondaryColor,
          });
          
          processedImages++;
          
          // Limit pre performance (max 10 obrázkov)
          if (processedImages >= 10) {
            console.log('⚠️ Dosiahnutý limit 10 obrázkov v PDF');
            break;
          }
          
        } catch (imageError) {
          console.error('❌ Chyba pri spracovaní obrázka:', imageError);
          continue; // Pokračuj s ďalším obrázkom
        }
      }
      
      if (processedImages > 0) {
        // Posun Y pozíciu pod obrázky (adjustované pre väčšie obrázky)
        const rowsUsed = Math.ceil(processedImages / 2);
        this.currentY -= (rowsUsed * 200) + 30; // Väčší spacing pre 200px vysoké obrázky
        console.log(`✅ Pridaných ${processedImages} obrázkov do PDF`);
      } else {
        console.log('⚠️ Žiadne obrázky sa nepodarilo spracovať');
      }
      
    } catch (error) {
      console.error('❌ Chyba pri pridávaní obrázkov do PDF:', error);
      // Pridaj aspoň informáciu o obrábkach ako text
      this.addInfoSection('Fotodokumentácia', [
        ['Status:', 'Obrázky nebolo možné načítať do PDF'],
        ['Počet fotiek:', `${(protocol.vehicleImages?.length || 0)} vozidlo`],
        ['Počet dokument fotiek:', `${(protocol.documentImages?.length || 0)} dokumenty`],
        ['Počet fotiek poškodení:', `${(protocol.damageImages?.length || 0)} poškodenia`]
      ]);
    }
  }

  /**
   * Generovanie vyúčtovania PDF s pdf-lib (rovnaký štýl ako protokoly)
   */
  async generateSettlement(settlement: Settlement): Promise<Buffer> {
    console.log('🎨 PDF-LIB GENERÁTOR SPUSTENÝ - Vyúčtovanie');
    console.log('📋 Settlement ID:', settlement.id);
    
    // Vytvorenie nového PDF dokumentu
    this.doc = await PDFDocument.create();
    this.currentPage = this.doc.addPage(PageSizes.A4);
    
    // Nahranie fontov
    this.font = await this.doc.embedFont(StandardFonts.Helvetica);
    this.boldFont = await this.doc.embedFont(StandardFonts.HelveticaBold);
    
    // Reset pozície
    this.currentY = this.pageHeight - 50;
    
    // 1. Záhlavie
    this.addModernHeader('VYÚČTOVANIE');
    
    // 2. Základné informácie o vyúčtovaní
    const formatDate = (date: Date | string) => {
      try {
        const d = typeof date === 'string' ? new Date(date) : date;
        return d.toLocaleDateString('sk-SK');
      } catch {
        return 'N/A';
      }
    };

    this.addInfoSection('Základné informácie', [
      ['Číslo vyúčtovania:', settlement.id.slice(-8).toUpperCase()],
      ['Firma:', settlement.company || 'N/A'],
      ['Obdobie od:', formatDate(settlement.period.from)],
      ['Obdobie do:', formatDate(settlement.period.to)],
      ['Dátum vytvorenia:', new Date().toLocaleDateString('sk-SK')],
    ]);

    // 3. Finančný súhrn
    this.addInfoSection('Finančný súhrn', [
      ['Celkové príjmy:', `${settlement.totalIncome.toFixed(2)} €`],
      ['Celkové náklady:', `${settlement.totalExpenses.toFixed(2)} €`],
      ['Celkové provízie:', `${settlement.totalCommission.toFixed(2)} €`],
      ['Celkový zisk/strata:', `${settlement.profit.toFixed(2)} €`],
    ]);

         // 4. Prehľad podľa spôsobov platby
     const rentalsByPaymentMethod = {
       cash: settlement.rentals.filter(r => r.paymentMethod === 'cash'),
       bank_transfer: settlement.rentals.filter(r => r.paymentMethod === 'bank_transfer'),
       vrp: settlement.rentals.filter(r => r.paymentMethod === 'vrp'),
       direct_to_owner: settlement.rentals.filter(r => r.paymentMethod === 'direct_to_owner'),
     };

     const getPaymentMethodLabel = (method: string) => {
       switch (method) {
         case 'cash': return 'Hotovost';
         case 'bank_transfer': return 'FA (Faktura)';
         case 'vrp': return 'VRP';
         case 'direct_to_owner': return 'Majitel';
         default: return method;
       }
     };

     // Zobrazenie platobných metód ako info sekcie
     if (rentalsByPaymentMethod.cash.length > 0) {
       const cashStats = rentalsByPaymentMethod.cash.reduce((acc, r) => ({
         count: acc.count + 1,
         totalPrice: acc.totalPrice + r.totalPrice,
         commission: acc.commission + r.commission
       }), { count: 0, totalPrice: 0, commission: 0 });

       this.addInfoSection('Platby - Hotovost', [
         ['Pocet prenajmov:', cashStats.count.toString()],
         ['Celkova cena:', `${cashStats.totalPrice.toFixed(2)} EUR`],
         ['Providzie:', `${cashStats.commission.toFixed(2)} EUR`],
         ['Cista suma:', `${(cashStats.totalPrice - cashStats.commission).toFixed(2)} EUR`],
       ]);
     }

     if (rentalsByPaymentMethod.bank_transfer.length > 0) {
       const bankStats = rentalsByPaymentMethod.bank_transfer.reduce((acc, r) => ({
         count: acc.count + 1,
         totalPrice: acc.totalPrice + r.totalPrice,
         commission: acc.commission + r.commission
       }), { count: 0, totalPrice: 0, commission: 0 });

       this.addInfoSection('Platby - FA (Faktura)', [
         ['Pocet prenajmov:', bankStats.count.toString()],
         ['Celkova cena:', `${bankStats.totalPrice.toFixed(2)} EUR`],
         ['Providzie:', `${bankStats.commission.toFixed(2)} EUR`],
         ['Cista suma:', `${(bankStats.totalPrice - bankStats.commission).toFixed(2)} EUR`],
       ]);
     }

     if (rentalsByPaymentMethod.vrp.length > 0) {
       const vrpStats = rentalsByPaymentMethod.vrp.reduce((acc, r) => ({
         count: acc.count + 1,
         totalPrice: acc.totalPrice + r.totalPrice,
         commission: acc.commission + r.commission
       }), { count: 0, totalPrice: 0, commission: 0 });

       this.addInfoSection('Platby - VRP', [
         ['Pocet prenajmov:', vrpStats.count.toString()],
         ['Celkova cena:', `${vrpStats.totalPrice.toFixed(2)} EUR`],
         ['Providzie:', `${vrpStats.commission.toFixed(2)} EUR`],
         ['Cista suma:', `${(vrpStats.totalPrice - vrpStats.commission).toFixed(2)} EUR`],
       ]);
     }

     if (rentalsByPaymentMethod.direct_to_owner.length > 0) {
       const ownerStats = rentalsByPaymentMethod.direct_to_owner.reduce((acc, r) => ({
         count: acc.count + 1,
         totalPrice: acc.totalPrice + r.totalPrice,
         commission: acc.commission + r.commission
       }), { count: 0, totalPrice: 0, commission: 0 });

       this.addInfoSection('Platby - Majitel', [
         ['Pocet prenajmov:', ownerStats.count.toString()],
         ['Celkova cena:', `${ownerStats.totalPrice.toFixed(2)} EUR`],
         ['Providzie:', `${ownerStats.commission.toFixed(2)} EUR`],
         ['Cista suma:', `${(ownerStats.totalPrice - ownerStats.commission).toFixed(2)} EUR`],
       ]);
     }

     // 5. Súhrn prenájmov - prvých 10 položiek
     if (settlement.rentals && settlement.rentals.length > 0) {
       const displayRentals = settlement.rentals.slice(0, 10); // Prvých 10
       const rentalSummary: [string, string][] = displayRentals.map((rental, index) => [
         `${index + 1}. ${rental.vehicle?.brand || ''} ${rental.vehicle?.model || ''}`,
         `${rental.customerName} - ${getPaymentMethodLabel(rental.paymentMethod)} - ${rental.totalPrice.toFixed(2)} EUR`
       ]);

       if (settlement.rentals.length > 10) {
         rentalSummary.push([`... a dalsich ${settlement.rentals.length - 10} prenajmov`, '']);
       }

       this.addInfoSection(`Prenajmy (${settlement.rentals.length})`, rentalSummary);
     }

     // 6. Súhrn nákladov - prvých 10 položiek
     if (settlement.expenses && settlement.expenses.length > 0) {
       const displayExpenses = settlement.expenses.slice(0, 10);
       const expenseSummary: [string, string][] = displayExpenses.map((expense, index) => [
         `${index + 1}. ${expense.description}`,
         `${expense.category} - ${expense.amount.toFixed(2)} EUR`
       ]);

       if (settlement.expenses.length > 10) {
         expenseSummary.push([`... a dalsich ${settlement.expenses.length - 10} nakladov`, '']);
       }

       this.addInfoSection(`Naklady ${settlement.company || 'N/A'} (${settlement.expenses.length})`, expenseSummary);
     }

    // 7. Pätička
    this.currentY -= 40;
    this.currentPage.drawText('Dokument automaticky vygenerovany systemom BlackRent', {
      x: this.margin,
      y: this.currentY,
      size: 10,
      font: this.font,
      color: this.secondaryColor,
    });

    // 8. Vygeneruj a vráť PDF buffer
    const pdfBytes = await this.doc.save();
    console.log(`✅ PDF-lib vyúčtovanie vygenerované, veľkosť: ${(pdfBytes.length / 1024).toFixed(1)}KB`);
    
    return Buffer.from(pdfBytes);
  }
} 