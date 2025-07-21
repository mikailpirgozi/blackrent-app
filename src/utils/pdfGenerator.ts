import jsPDF from 'jspdf';
import 'jspdf-autotable';

export interface ProtocolData {
  id: string;
  type: 'handover' | 'return';
  rental: any;
  location: string;
  vehicleCondition: any;
  vehicleImages: any[];
  documentImages: any[];
  damageImages: any[];
  damages: any[];
  signatures: any[];
  notes: string;
  createdAt: Date;
  completedAt: Date;
}

interface PDFOptions {
  includeImages?: boolean;
  includeSignatures?: boolean;
  imageQuality?: number;
  maxImageWidth?: number;
  maxImageHeight?: number;
  filename?: string;
  saveToR2?: boolean;
  downloadLocal?: boolean;
}

class PDFGenerator {
  private doc: jsPDF;
  private currentY: number = 20;
  private pageWidth: number;
  private pageHeight: number;
  private margin: number = 25;
  private primaryColor: [number, number, number] = [17, 24, 39]; // Modern dark blue
  private secondaryColor: [number, number, number] = [107, 114, 128]; // Gray
  private accentColor: [number, number, number] = [59, 130, 246]; // Blue accent
  private successColor: [number, number, number] = [34, 197, 94]; // Green
  private warningColor: [number, number, number] = [245, 158, 11]; // Orange

  constructor() {
    this.doc = new jsPDF('p', 'mm', 'a4');
    this.pageWidth = this.doc.internal.pageSize.getWidth();
    this.pageHeight = this.doc.internal.pageSize.getHeight();
    
    // Nastavenie fontu pre diakritiku
    this.doc.setFont('helvetica');
  }

  /**
   * Generovanie PDF protokolu s fotkami
   */
  async generateProtocolPDF(protocol: ProtocolData, options: PDFOptions = {}): Promise<Blob> {
    const {
      includeImages = true,
      includeSignatures = true,
      imageQuality = 0.9,
      maxImageWidth = 120, // Väčšie fotky
      maxImageHeight = 90  // Väčšie fotky
    } = options;

    try {
      // Moderný header s gradientom
      this.addModernHeader(protocol);
      
      // Základné informácie v cards
      this.addBasicInfoCards(protocol);
      
      // Stav vozidla v modernom layout
      this.addVehicleConditionModern(protocol);
      
      // Fotky vozidla - väčšie a peknejšie
      if (includeImages && protocol.vehicleImages && protocol.vehicleImages.length > 0) {
        await this.addVehicleImagesModern(protocol.vehicleImages, maxImageWidth, maxImageHeight, imageQuality);
      }
      
      // Dokumenty
      if (includeImages && protocol.documentImages && protocol.documentImages.length > 0) {
        await this.addDocumentImagesModern(protocol.documentImages, maxImageWidth, maxImageHeight, imageQuality);
      }
      
      // Škody v modernom layout
      if (protocol.damages && protocol.damages.length > 0) {
        this.addDamagesModern(protocol.damages);
      }
      
      // Poznámky v card
      if (protocol.notes) {
        this.addNotesModern(protocol.notes);
      }
      
      // Podpisy v modernom layout - len ak existujú
      if (includeSignatures && protocol.signatures && protocol.signatures.length > 0) {
        await this.addSignaturesModern(protocol.signatures, maxImageWidth, maxImageHeight, imageQuality);
      }
      
      // Footer
      this.addModernFooter(protocol);

      return this.doc.output('blob');
    } catch (error) {
      console.error('❌ Error generating PDF:', error);
      throw error;
    }
  }

  /**
   * Moderný header s gradientom a lepším dizajnom
   */
  private addModernHeader(protocol: ProtocolData) {
    // Gradient pozadie pre header
    this.doc.setFillColor(...this.primaryColor);
    this.doc.rect(0, 0, this.pageWidth, 50, 'F');
    
    // Akcentová čiara
    this.doc.setFillColor(...this.accentColor);
    this.doc.rect(0, 48, this.pageWidth, 2, 'F');
    
    // Logo s moderným dizajnom
    this.doc.setFillColor(255, 255, 255);
    this.doc.circle(35, 25, 12, 'F');
    this.doc.setFillColor(...this.accentColor);
    this.doc.circle(35, 25, 8, 'F');
    this.doc.setFontSize(14);
    this.doc.setFont('helvetica', 'bold');
    this.doc.setTextColor(255, 255, 255);
    this.doc.text('BR', 35, 29, { align: 'center' });
    
    // Názov protokolu s modernou typografiou
    this.doc.setFontSize(20);
    this.doc.setFont('helvetica', 'bold');
    this.doc.setTextColor(255, 255, 255);
    const title = protocol.type === 'handover' ? 'PROTOKOL O PREVZATÍ VOZIDLA' : 'PROTOKOL O VRÁTENÍ VOZIDLA';
    this.doc.text(title, this.pageWidth / 2, 30, { align: 'center' });
    
    // Reset pozície
    this.currentY = 70;
    
    // Informácie o protokole v modernom layout
    this.addProtocolInfoModern(protocol);
  }

  /**
   * Moderné informácie o protokole
   */
  private addProtocolInfoModern(protocol: ProtocolData) {
    // Card pozadie
    this.doc.setFillColor(249, 250, 251);
    this.doc.roundedRect(this.margin - 5, this.currentY - 5, this.pageWidth - 2 * this.margin + 10, 25, 3, 3, 'F');
    
    // Border
    this.doc.setDrawColor(229, 231, 235);
    this.doc.roundedRect(this.margin - 5, this.currentY - 5, this.pageWidth - 2 * this.margin + 10, 25, 3, 3, 'D');
    
    this.doc.setFontSize(11);
    this.doc.setFont('helvetica', 'bold');
    this.doc.setTextColor(...this.primaryColor);
    this.doc.text(`Číslo protokolu: ${protocol.id}`, this.margin, this.currentY + 5);
    
    this.doc.setFont('helvetica', 'normal');
    this.doc.setTextColor(...this.secondaryColor);
    this.doc.text(`Dátum: ${new Date(protocol.completedAt).toLocaleDateString('sk-SK')}`, this.margin + 80, this.currentY + 5);
    
    this.doc.text(`Miesto: ${protocol.location}`, this.margin + 160, this.currentY + 5);
    
    this.currentY += 35;
  }

  /**
   * Základné informácie v moderných cards
   */
  private addBasicInfoCards(protocol: ProtocolData) {
    this.addSectionTitleModern('ZÁKLADNÉ INFORMÁCIE');
    
    const rental = protocol.rental;
    const vehicle = rental.vehicle || {};
    const customer = rental.customer || {};

    // Card pozadie
    this.doc.setFillColor(249, 250, 251);
    this.doc.roundedRect(this.margin - 5, this.currentY - 5, this.pageWidth - 2 * this.margin + 10, 50, 3, 3, 'F');
    
    // Border
    this.doc.setDrawColor(229, 231, 235);
    this.doc.roundedRect(this.margin - 5, this.currentY - 5, this.pageWidth - 2 * this.margin + 10, 50, 3, 3, 'D');

    const basicInfo = [
      ['Číslo objednávky:', rental.orderNumber || 'N/A'],
      ['Vozidlo:', `${vehicle.brand || ''} ${vehicle.model || ''} (${vehicle.licensePlate || 'N/A'})`],
      ['Zákazník:', `${customer.name || ''} ${customer.surname || ''}`],
      ['Telefón:', customer.phone || 'N/A'],
      ['Email:', customer.email || 'N/A'],
      ['Dátum prenájmu:', `${new Date(rental.startDate).toLocaleDateString('sk-SK')} - ${new Date(rental.endDate).toLocaleDateString('sk-SK')}`],
      ['Cena:', `${rental.totalPrice} ${rental.currency || 'EUR'}`],
    ];

    // Moderný layout s lepším rozložením
    basicInfo.forEach(([label, value], index) => {
      const row = Math.floor(index / 2);
      const col = index % 2;
      const x = col === 0 ? this.margin : this.margin + 90;
      const y = this.currentY + (row * 7);
      
      this.doc.setFontSize(10);
      this.doc.setFont('helvetica', 'bold');
      this.doc.setTextColor(...this.primaryColor);
      this.doc.text(label, x, y);
      
      this.doc.setFont('helvetica', 'normal');
      this.doc.setTextColor(...this.secondaryColor);
      this.doc.text(value, x + 45, y);
    });

    this.currentY += 60;
  }

  /**
   * Stav vozidla v modernom layout
   */
  private addVehicleConditionModern(protocol: ProtocolData) {
    this.addSectionTitleModern('STAV VOZIDLA');
    
    const condition = protocol.vehicleCondition;
    
    // Card pozadie
    this.doc.setFillColor(249, 250, 251);
    this.doc.roundedRect(this.margin - 5, this.currentY - 5, this.pageWidth - 2 * this.margin + 10, 40, 3, 3, 'F');
    
    // Border
    this.doc.setDrawColor(229, 231, 235);
    this.doc.roundedRect(this.margin - 5, this.currentY - 5, this.pageWidth - 2 * this.margin + 10, 40, 3, 3, 'D');
    
    const vehicleInfo = [
      ['Počet kilometrov:', `${condition.odometer?.toLocaleString() || 0} km`],
      ['Úroveň paliva:', `${condition.fuelLevel || 0}%`],
      ['Typ paliva:', condition.fuelType || 'N/A'],
      ['Exteriér:', condition.exteriorCondition || 'N/A'],
      ['Interiér:', condition.interiorCondition || 'N/A'],
    ];

    // Moderný layout
    vehicleInfo.forEach(([label, value], index) => {
      const row = Math.floor(index / 2);
      const col = index % 2;
      const x = col === 0 ? this.margin : this.margin + 90;
      const y = this.currentY + (row * 7);
      
      this.doc.setFontSize(10);
      this.doc.setFont('helvetica', 'bold');
      this.doc.setTextColor(...this.primaryColor);
      this.doc.text(label, x, y);
      
      this.doc.setFont('helvetica', 'normal');
      this.doc.setTextColor(...this.secondaryColor);
      this.doc.text(value, x + 45, y);
    });

    this.currentY += 50;
  }

  /**
   * Pridanie fotiek vozidla s moderným dizajnom
   */
  private async addVehicleImagesModern(images: any[], maxWidth: number, maxHeight: number, quality: number) {
    this.addSectionTitleModern('FOTODOKUMENTÁCIA VOZIDLA');
    
    if (images.length === 0) {
      this.doc.setFontSize(10);
      this.doc.setTextColor(128, 128, 128);
      this.doc.text('Žiadne fotky nie sú k dispozícii', this.margin, this.currentY);
      this.currentY += 10;
      return;
    }

    const imagesPerRow = 2; // 2 fotky na riadok pre väčšie zobrazenie
    let currentX = this.margin;
    let rowHeight = 0;
    let imagesInRow = 0;

    for (let i = 0; i < images.length; i++) {
      const image = images[i];
      
      try {
        // Skús načítať obrázok cez proxy alebo priamo
        let imgData: string;
        try {
          imgData = await this.loadImageFromUrl(image.url);
        } catch (error) {
          console.warn('⚠️ CORS error, trying proxy approach:', image.url);
          // Fallback - vytvor placeholder
          imgData = this.createImagePlaceholder(maxWidth, maxHeight, `Fotka ${i + 1}`);
        }

        const { width, height } = await this.calculateImageDimensions(imgData, maxWidth, maxHeight);
        
        // Kontrola či sa zmestí na stránku
        if (this.currentY + height + 20 > this.pageHeight - 30) {
          this.doc.addPage();
          this.currentY = 20;
          currentX = this.margin;
          rowHeight = 0;
          imagesInRow = 0;
        }

        // Card pozadie pre fotku
        this.doc.setFillColor(249, 250, 251);
        this.doc.roundedRect(currentX - 5, this.currentY - 5, width + 10, height + 25, 3, 3, 'F');
        
        // Border
        this.doc.setDrawColor(229, 231, 235);
        this.doc.roundedRect(currentX - 5, this.currentY - 5, width + 10, height + 25, 3, 3, 'D');

        // Pridanie obrázka
        this.doc.addImage(imgData, 'JPEG', currentX, this.currentY, width, height);
        
        // Moderný popis obrázka
        this.doc.setFontSize(9);
        this.doc.setFont('helvetica', 'bold');
        this.doc.setTextColor(...this.primaryColor);
        this.doc.text(`Fotka ${i + 1}`, currentX, this.currentY + height + 8);
        
        // URL link pod obrázkom s moderným dizajnom
        const urlText = image.url;
        const encodedUrl = urlText.replace(/\s/g, '%20');
        
        this.doc.setFontSize(5);
        this.doc.setFont('helvetica', 'normal');
        this.doc.setTextColor(...this.accentColor);
        
        // Ak je URL príliš dlhé, zmenšíme písmo
        if (this.doc.getTextWidth(encodedUrl) > width) {
          this.doc.setFontSize(4);
          if (this.doc.getTextWidth(encodedUrl) > width) {
            this.doc.setFontSize(3);
          }
        }
        
        this.doc.text(encodedUrl, currentX, this.currentY + height + 12);
        
        currentX += width + 20; // Väčší medzera medzi fotkami
        rowHeight = Math.max(rowHeight, height + 30);
        imagesInRow++;

        if (imagesInRow >= imagesPerRow) {
          this.currentY += rowHeight;
          currentX = this.margin;
          rowHeight = 0;
          imagesInRow = 0;
        }
      } catch (error) {
        console.error('❌ Error processing image:', image.url, error);
        // Pridaj placeholder pre chybný obrázok
        const placeholder = this.createImagePlaceholder(maxWidth, maxHeight, `Chyba ${i + 1}`);
        this.doc.addImage(placeholder, 'JPEG', currentX, this.currentY, maxWidth, maxHeight);
        currentX += maxWidth + 20;
      }
    }

    if (imagesInRow > 0) {
      this.currentY += rowHeight;
    }

    this.currentY += 15;
  }

  /**
   * Pridanie dokumentov s moderným dizajnom
   */
  private async addDocumentImagesModern(images: any[], maxWidth: number, maxHeight: number, quality: number) {
    this.addSectionTitleModern('DOKUMENTY');
    
    if (images.length === 0) {
      this.doc.setFontSize(10);
      this.doc.setTextColor(128, 128, 128);
      this.doc.text('Žiadne dokumenty nie sú k dispozícii', this.margin, this.currentY);
      this.currentY += 10;
      return;
    }

    const imagesPerRow = 2;
    let currentX = this.margin;
    let rowHeight = 0;
    let imagesInRow = 0;

    for (let i = 0; i < images.length; i++) {
      const image = images[i];
      
      try {
        let imgData: string;
        try {
          imgData = await this.loadImageFromUrl(image.url);
        } catch (error) {
          console.warn('⚠️ CORS error, trying proxy approach:', image.url);
          imgData = this.createImagePlaceholder(maxWidth, maxHeight, `Dokument ${i + 1}`);
        }

        const { width, height } = await this.calculateImageDimensions(imgData, maxWidth, maxHeight);
        
        // Kontrola či sa zmestí na stránku
        if (this.currentY + height + 20 > this.pageHeight - 30) {
          this.doc.addPage();
          this.currentY = 20;
          currentX = this.margin;
          rowHeight = 0;
          imagesInRow = 0;
        }

        // Card pozadie pre dokument
        this.doc.setFillColor(249, 250, 251);
        this.doc.roundedRect(currentX - 5, this.currentY - 5, width + 10, height + 25, 3, 3, 'F');
        
        // Border
        this.doc.setDrawColor(229, 231, 235);
        this.doc.roundedRect(currentX - 5, this.currentY - 5, width + 10, height + 25, 3, 3, 'D');

        // Pridanie obrázka
        this.doc.addImage(imgData, 'JPEG', currentX, this.currentY, width, height);
        
        // Moderný popis dokumentu
        this.doc.setFontSize(9);
        this.doc.setFont('helvetica', 'bold');
        this.doc.setTextColor(...this.primaryColor);
        this.doc.text(`Dokument ${i + 1}`, currentX, this.currentY + height + 8);
        
        // URL link pod dokumentom
        const urlText = image.url;
        const encodedUrl = urlText.replace(/\s/g, '%20');
        
        this.doc.setFontSize(5);
        this.doc.setFont('helvetica', 'normal');
        this.doc.setTextColor(...this.accentColor);
        
        if (this.doc.getTextWidth(encodedUrl) > width) {
          this.doc.setFontSize(4);
          if (this.doc.getTextWidth(encodedUrl) > width) {
            this.doc.setFontSize(3);
          }
        }
        
        this.doc.text(encodedUrl, currentX, this.currentY + height + 12);
        
        currentX += width + 20;
        rowHeight = Math.max(rowHeight, height + 30);
        imagesInRow++;

        if (imagesInRow >= imagesPerRow) {
          this.currentY += rowHeight;
          currentX = this.margin;
          rowHeight = 0;
          imagesInRow = 0;
        }
      } catch (error) {
        console.error('❌ Error processing document:', image.url, error);
        const placeholder = this.createImagePlaceholder(maxWidth, maxHeight, `Chyba ${i + 1}`);
        this.doc.addImage(placeholder, 'JPEG', currentX, this.currentY, maxWidth, maxHeight);
        currentX += maxWidth + 20;
      }
    }

    if (imagesInRow > 0) {
      this.currentY += rowHeight;
    }

    this.currentY += 15;
  }

  /**
   * Pridanie škôd s moderným dizajnom
   */
  private addDamagesModern(damages: any[]) {
    this.addSectionTitleModern('ŠKODY A POŠKODENIA');
    
    if (damages.length === 0) {
      this.doc.setFontSize(10);
      this.doc.setTextColor(128, 128, 128);
      this.doc.text('Žiadne škody nie sú zaznamenané', this.margin, this.currentY);
      this.currentY += 10;
      return;
    }

    // Card pozadie
    this.doc.setFillColor(249, 250, 251);
    this.doc.roundedRect(this.margin - 5, this.currentY - 5, this.pageWidth - 2 * this.margin + 10, damages.length * 15 + 10, 3, 3, 'F');
    
    // Border
    this.doc.setDrawColor(229, 231, 235);
    this.doc.roundedRect(this.margin - 5, this.currentY - 5, this.pageWidth - 2 * this.margin + 10, damages.length * 15 + 10, 3, 3, 'D');

    damages.forEach((damage, index) => {
      const y = this.currentY + (index * 15);
      
      // Číslo škody
      this.doc.setFontSize(10);
      this.doc.setFont('helvetica', 'bold');
      this.doc.setTextColor(...this.warningColor);
      this.doc.text(`${index + 1}.`, this.margin, y);
      
      // Popis škody
      this.doc.setFont('helvetica', 'normal');
      this.doc.setTextColor(...this.secondaryColor);
      this.doc.text(damage.description || 'N/A', this.margin + 15, y);
      
      // Lokácia škody
      if (damage.location) {
        this.doc.setFontSize(8);
        this.doc.setTextColor(128, 128, 128);
        this.doc.text(`Lokácia: ${damage.location}`, this.margin + 15, y + 4);
      }
    });

    this.currentY += damages.length * 15 + 20;
  }

  /**
   * Pridanie poznámok s moderným dizajnom
   */
  private addNotesModern(notes: string) {
    this.addSectionTitleModern('POZNÁMKY');
    
    // Card pozadie
    this.doc.setFillColor(249, 250, 251);
    this.doc.roundedRect(this.margin - 5, this.currentY - 5, this.pageWidth - 2 * this.margin + 10, 30, 3, 3, 'F');
    
    // Border
    this.doc.setDrawColor(229, 231, 235);
    this.doc.roundedRect(this.margin - 5, this.currentY - 5, this.pageWidth - 2 * this.margin + 10, 30, 3, 3, 'D');
    
    this.doc.setFontSize(10);
    this.doc.setFont('helvetica', 'normal');
    this.doc.setTextColor(...this.secondaryColor);
    this.doc.text(notes, this.margin, this.currentY + 10);
    
    this.currentY += 40;
  }

  /**
   * Pridanie podpisov s moderným dizajnom
   */
  private async addSignaturesModern(signatures: any[], maxWidth: number, maxHeight: number, quality: number) {
    this.addSectionTitleModern('PODPISY');
    
    if (signatures.length === 0) {
      this.doc.setFontSize(10);
      this.doc.setTextColor(128, 128, 128);
      this.doc.text('Žiadne podpisy nie sú k dispozícii', this.margin, this.currentY);
      this.currentY += 10;
      return;
    }

    const signaturesPerRow = 2;
    let currentX = this.margin;
    let rowHeight = 0;
    let signaturesInRow = 0;

    for (let i = 0; i < signatures.length; i++) {
      const signature = signatures[i];
      
      // Kontrola či má signature URL alebo base64 data
      if (!signature.url && !signature.signature) {
        console.warn('⚠️ Signature without URL or base64 data:', signature);
        continue;
      }
      
      try {
        let imgData: string;
        
        // Ak má URL, načítaj z URL
        if (signature.url) {
          try {
            imgData = await this.loadImageFromUrl(signature.url);
          } catch (error) {
            console.warn('⚠️ CORS error, trying proxy approach:', signature.url);
            imgData = this.createImagePlaceholder(maxWidth, maxHeight, `Podpis ${i + 1}`);
          }
        } 
        // Ak má base64 data, použij priamo
        else if (signature.signature && signature.signature.startsWith('data:image/')) {
          imgData = signature.signature;
        } 
        // Fallback - placeholder
        else {
          imgData = this.createImagePlaceholder(maxWidth, maxHeight, `Podpis ${i + 1}`);
        }

        const { width, height } = await this.calculateImageDimensions(imgData, maxWidth, maxHeight);
        
        // Kontrola či sa zmestí na stránku
        if (this.currentY + height + 20 > this.pageHeight - 30) {
          this.doc.addPage();
          this.currentY = 20;
          currentX = this.margin;
          rowHeight = 0;
          signaturesInRow = 0;
        }

        // Card pozadie pre podpis
        this.doc.setFillColor(249, 250, 251);
        this.doc.roundedRect(currentX - 5, this.currentY - 5, width + 10, height + 25, 3, 3, 'F');
        
        // Border
        this.doc.setDrawColor(229, 231, 235);
        this.doc.roundedRect(currentX - 5, this.currentY - 5, width + 10, height + 25, 3, 3, 'D');

        // Pridanie podpisu
        this.doc.addImage(imgData, 'JPEG', currentX, this.currentY, width, height);
        
        // Moderný popis podpisu
        this.doc.setFontSize(9);
        this.doc.setFont('helvetica', 'bold');
        this.doc.setTextColor(...this.primaryColor);
        this.doc.text(`Podpis ${i + 1}`, currentX, this.currentY + height + 8);
        
        // URL link pod podpisom - len ak existuje URL
        if (signature.url) {
          const urlText = signature.url;
          const encodedUrl = urlText.replace(/\s/g, '%20');
          
          this.doc.setFontSize(5);
          this.doc.setFont('helvetica', 'normal');
          this.doc.setTextColor(...this.accentColor);
          
          if (this.doc.getTextWidth(encodedUrl) > width) {
            this.doc.setFontSize(4);
            if (this.doc.getTextWidth(encodedUrl) > width) {
              this.doc.setFontSize(3);
            }
          }
          
          this.doc.text(encodedUrl, currentX, this.currentY + height + 12);
        }
        
        currentX += width + 20;
        rowHeight = Math.max(rowHeight, height + 30);
        signaturesInRow++;

        if (signaturesInRow >= signaturesPerRow) {
          this.currentY += rowHeight;
          currentX = this.margin;
          rowHeight = 0;
          signaturesInRow = 0;
        }
      } catch (error) {
        console.error('❌ Error processing signature:', signature.url || signature.signature, error);
        const placeholder = this.createImagePlaceholder(maxWidth, maxHeight, `Chyba ${i + 1}`);
        this.doc.addImage(placeholder, 'JPEG', currentX, this.currentY, maxWidth, maxHeight);
        currentX += maxWidth + 20;
      }
    }

    if (signaturesInRow > 0) {
      this.currentY += rowHeight;
    }

    this.currentY += 15;
  }

  /**
   * Pridanie linkov pod každú fotku
   */
  private addImageLinksSection(protocol: ProtocolData) {
    this.addSectionTitleModern('LINKY NA FOTKY');
    
    const allImages = [
      ...(protocol.vehicleImages || []).map((img, i) => ({ ...img, type: 'Vozidlo', index: i + 1 })),
      ...(protocol.documentImages || []).map((img, i) => ({ ...img, type: 'Dokument', index: i + 1 })),
      ...(protocol.damageImages || []).map((img, i) => ({ ...img, type: 'Škoda', index: i + 1 }))
    ];

    if (allImages.length === 0) {
      this.doc.setFontSize(10);
      this.doc.setTextColor(128, 128, 128);
      this.doc.text('Žiadne fotky nie sú k dispozícii', this.margin, this.currentY);
      this.currentY += 10;
      return;
    }

    this.doc.setFontSize(9);
    this.doc.setTextColor(0, 0, 255); // Modrá farba pre linky
    
    // Zoskupenie podľa typu
    const groupedImages = {
      'Vozidlo': allImages.filter(img => img.type === 'Vozidlo'),
      'Dokument': allImages.filter(img => img.type === 'Dokument'),
      'Škoda': allImages.filter(img => img.type === 'Škoda')
    };

    Object.entries(groupedImages).forEach(([type, images]) => {
      if (images.length > 0) {
        // Nadpis pre typ
        this.doc.setFontSize(11);
        this.doc.setFont('helvetica', 'bold');
        this.doc.setTextColor(...this.primaryColor);
        this.doc.text(`${type} (${images.length} fotiek):`, this.margin, this.currentY);
        this.currentY += 8;

        // Linky pre každú fotku
        this.doc.setFontSize(8);
        this.doc.setFont('helvetica', 'normal');
        this.doc.setTextColor(0, 0, 255);
        
        images.forEach((image, index) => {
          const linkText = `${index + 1}. ${image.filename || image.description || `Fotka ${image.index}`}: ${image.url}`;
          
          // Kontrola či sa zmestí na stránku
          if (this.currentY > this.pageHeight - 30) {
            this.doc.addPage();
            this.currentY = 20;
          }

          this.doc.text(linkText, this.margin + 5, this.currentY);
          this.currentY += 5;
        });
        
        this.currentY += 5;
      }
    });

    this.currentY += 10;
  }



  /**
   * Pridanie päty
   */
  private addModernFooter(protocol: ProtocolData) {
    this.currentY = this.pageHeight - 30;
    
    // Akcentová čiara
    this.doc.setFillColor(...this.accentColor);
    this.doc.rect(this.margin, this.currentY, this.pageWidth - 2 * this.margin, 1, 'F');
    
    this.currentY += 10;
    
    // Footer text
    this.doc.setFontSize(8);
    this.doc.setFont('helvetica', 'normal');
    this.doc.setTextColor(...this.secondaryColor);
    this.doc.text(`BlackRent - Protokol vygenerovaný ${new Date().toLocaleString('sk-SK')}`, this.margin, this.currentY);
    
    this.doc.text(`ID: ${protocol.id}`, this.pageWidth - this.margin - 20, this.currentY, { align: 'right' });
  }

  /**
   * Pridanie názvu sekcie
   */
  private addSectionTitleModern(title: string) {
    this.doc.setFontSize(16);
    this.doc.setFont('helvetica', 'bold');
    this.doc.setTextColor(...this.primaryColor);
    this.doc.text(title, this.margin, this.currentY);
    
    // Podčiarknutie
    this.doc.setFillColor(...this.accentColor);
    this.doc.rect(this.margin, this.currentY + 2, 50, 2, 'F');
    
    this.currentY += 15;
  }

  /**
   * Načítanie obrázka z URL s CORS handling
   */
  private async loadImageFromUrl(url: string): Promise<string> {
    return new Promise((resolve, reject) => {
      // Kontrola či URL existuje
      if (!url) {
        reject(new Error('URL is undefined or empty'));
        return;
      }
      
      // Skontroluj či je to base64 URL
      const isBase64Url = url.startsWith('data:image/');
      
      if (isBase64Url) {
        // Base64 URL - vráť priamo
        console.log('✅ Using base64 image data directly');
        resolve(url);
        return;
      }
      
      // Skontroluj či je to R2 URL a potrebuje proxy
      const isR2Url = url.includes('r2.dev') || url.includes('cloudflare.com');
      
      if (isR2Url) {
        try {
          // Extrahuj key z R2 URL
          const urlParts = url.split('/');
          // Zober všetky časti po doméne ako key (preskoč https:// a doménu)
          const key = urlParts.slice(3).join('/');
          
          // Použi proxy endpoint
          const proxyUrl = `${process.env.REACT_APP_API_URL || 'https://blackrent-app-production-4d6f.up.railway.app/api'}/files/proxy/${encodeURIComponent(key)}`;
          
          console.log('🔄 Loading R2 image via proxy:', proxyUrl);
          
          fetch(proxyUrl)
            .then(response => {
              if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
              }
              return response.blob();
            })
            .then(blob => {
              const reader = new FileReader();
              reader.onload = () => {
                const result = reader.result as string;
                resolve(result);
              };
              reader.onerror = () => reject(new Error('Failed to read blob'));
              reader.readAsDataURL(blob);
            })
            .catch(error => {
              console.error('❌ Proxy fetch error:', error);
              reject(error);
            });
        } catch (error) {
          console.error('❌ Error processing R2 URL:', error);
          reject(error);
        }
      } else {
        // Pre iné URL použij priame načítanie
        try {
          const img = new Image();
          img.crossOrigin = 'anonymous';
          
          img.onload = () => {
            const canvas = document.createElement('canvas');
            canvas.width = img.width;
            canvas.height = img.height;
            
            const ctx = canvas.getContext('2d');
            if (ctx) {
              ctx.drawImage(img, 0, 0);
              const dataUrl = canvas.toDataURL('image/jpeg', 0.8);
              resolve(dataUrl);
            } else {
              reject(new Error('Failed to get canvas context'));
            }
          };
          
          img.onerror = () => {
            reject(new Error('Failed to load image'));
          };
          
          img.src = url;
        } catch (error) {
          console.error('❌ Error loading image:', error);
          reject(error);
        }
      }
    });
  }

  /**
   * Vytvorenie placeholder obrázka
   */
  private createImagePlaceholder(width: number, height: number, text: string): string {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    
    if (!ctx) {
      return '';
    }
    
    canvas.width = width;
    canvas.height = height;
    
    // Pozadie
    ctx.fillStyle = '#f0f0f0';
    ctx.fillRect(0, 0, width, height);
    
    // Rámček
    ctx.strokeStyle = '#cccccc';
    ctx.lineWidth = 1;
    ctx.strokeRect(0, 0, width, height);
    
    // Text
    ctx.fillStyle = '#666666';
    ctx.font = '12px Arial';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(text, width / 2, height / 2);
    
    return canvas.toDataURL('image/jpeg', 0.8);
  }

  /**
   * Výpočet rozmerov obrázka
   */
  private calculateImageDimensions(imgData: string, maxWidth: number, maxHeight: number) {
    return new Promise<{ width: number; height: number }>((resolve) => {
      const img = new Image();
      img.onload = () => {
        const aspectRatio = img.width / img.height;
        let width = maxWidth;
        let height = width / aspectRatio;
        
        if (height > maxHeight) {
          height = maxHeight;
          width = height * aspectRatio;
        }
        
        resolve({ width, height });
      };
      img.src = imgData;
    });
  }
}

// Export funkcie pre kompatibilitu
export const generateProtocolPDF = async (protocol: ProtocolData, options: PDFOptions = {}): Promise<Blob> => {
  const generator = new PDFGenerator();
  return generator.generateProtocolPDF(protocol, options);
};

export default PDFGenerator; 