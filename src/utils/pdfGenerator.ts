import jsPDF from 'jspdf';
import 'jspdf-autotable';

interface ProtocolData {
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
}

class PDFGenerator {
  private doc: jsPDF;
  private currentY: number = 20;
  private pageWidth: number;
  private pageHeight: number;
  private margin: number = 20;

  constructor() {
    this.doc = new jsPDF('p', 'mm', 'a4');
    this.pageWidth = this.doc.internal.pageSize.getWidth();
    this.pageHeight = this.doc.internal.pageSize.getHeight();
  }

  /**
   * Generovanie PDF protokolu s fotkami
   */
  async generateProtocolPDF(protocol: ProtocolData, options: PDFOptions = {}): Promise<Blob> {
    const {
      includeImages = true,
      includeSignatures = true,
      imageQuality = 0.8,
      maxImageWidth = 80,
      maxImageHeight = 60
    } = options;

    try {
      // Header
      this.addHeader(protocol);
      
      // Základné informácie
      this.addBasicInfo(protocol);
      
      // Stav vozidla
      this.addVehicleCondition(protocol);
      
      // Fotky vozidla
      if (includeImages && protocol.vehicleImages && protocol.vehicleImages.length > 0) {
        await this.addVehicleImages(protocol.vehicleImages, maxImageWidth, maxImageHeight, imageQuality);
      }
      
      // Dokumenty
      if (includeImages && protocol.documentImages && protocol.documentImages.length > 0) {
        await this.addDocumentImages(protocol.documentImages, maxImageWidth, maxImageHeight, imageQuality);
      }
      
      // Škody
      if (protocol.damages && protocol.damages.length > 0) {
        this.addDamages(protocol.damages);
      }
      
      // Poznámky
      if (protocol.notes) {
        this.addNotes(protocol.notes);
      }
      
      // Podpisy
      if (includeSignatures && protocol.signatures && protocol.signatures.length > 0) {
        await this.addSignatures(protocol.signatures, maxImageWidth, maxImageHeight, imageQuality);
      }
      
      // Footer
      this.addFooter(protocol);

      return this.doc.output('blob');
    } catch (error) {
      console.error('❌ Error generating PDF:', error);
      throw new Error('Chyba pri generovaní PDF');
    }
  }

  /**
   * Pridanie hlavičky
   */
  private addHeader(protocol: ProtocolData) {
    this.doc.setFontSize(20);
    this.doc.setFont('helvetica', 'bold');
    this.doc.text('PROTOKOL O PREVZATÍ VOZIDLA', this.pageWidth / 2, this.currentY, { align: 'center' });
    this.currentY += 15;

    this.doc.setFontSize(12);
    this.doc.setFont('helvetica', 'normal');
    this.doc.text(`Číslo protokolu: ${protocol.id}`, this.margin, this.currentY);
    this.currentY += 8;
    
    this.doc.text(`Dátum: ${new Date(protocol.completedAt).toLocaleDateString('sk-SK')}`, this.margin, this.currentY);
    this.currentY += 8;
    
    this.doc.text(`Miesto: ${protocol.location}`, this.margin, this.currentY);
    this.currentY += 15;
  }

  /**
   * Pridanie základných informácií
   */
  private addBasicInfo(protocol: ProtocolData) {
    this.doc.setFontSize(14);
    this.doc.setFont('helvetica', 'bold');
    this.doc.text('ZÁKLADNÉ INFORMÁCIE', this.margin, this.currentY);
    this.currentY += 10;

    this.doc.setFontSize(10);
    this.doc.setFont('helvetica', 'normal');
    
    const rental = protocol.rental;
    const vehicle = rental.vehicle || {};
    const customer = rental.customer || {};

    const basicInfo = [
      ['Číslo objednávky:', rental.orderNumber || 'N/A'],
      ['Vozidlo:', `${vehicle.brand || ''} ${vehicle.model || ''} (${vehicle.licensePlate || 'N/A'})`],
      ['Zákazník:', `${customer.name || ''} ${customer.surname || ''}`],
      ['Telefón:', customer.phone || 'N/A'],
      ['Email:', customer.email || 'N/A'],
      ['Dátum prenájmu:', `${new Date(rental.startDate).toLocaleDateString('sk-SK')} - ${new Date(rental.endDate).toLocaleDateString('sk-SK')}`],
      ['Cena:', `${rental.totalPrice} ${rental.currency || 'EUR'}`],
    ];

    basicInfo.forEach(([label, value]) => {
      this.doc.text(label, this.margin, this.currentY);
      this.doc.text(value, this.margin + 60, this.currentY);
      this.currentY += 6;
    });

    this.currentY += 10;
  }

  /**
   * Pridanie stavu vozidla
   */
  private addVehicleCondition(protocol: ProtocolData) {
    this.doc.setFontSize(14);
    this.doc.setFont('helvetica', 'bold');
    this.doc.text('STAV VOZIDLA', this.margin, this.currentY);
    this.currentY += 10;

    this.doc.setFontSize(10);
    this.doc.setFont('helvetica', 'normal');
    
    const condition = protocol.vehicleCondition;
    const vehicleInfo = [
      ['Počet kilometrov:', `${condition.odometer?.toLocaleString() || 0} km`],
      ['Úroveň paliva:', `${condition.fuelLevel || 0}%`],
      ['Typ paliva:', condition.fuelType || 'N/A'],
      ['Exteriér:', condition.exteriorCondition || 'N/A'],
      ['Interiér:', condition.interiorCondition || 'N/A'],
    ];

    vehicleInfo.forEach(([label, value]) => {
      this.doc.text(label, this.margin, this.currentY);
      this.doc.text(value, this.margin + 60, this.currentY);
      this.currentY += 6;
    });

    if (condition.notes) {
      this.currentY += 5;
      this.doc.text('Poznámky:', this.margin, this.currentY);
      this.currentY += 5;
      this.doc.text(condition.notes, this.margin + 10, this.currentY);
      this.currentY += 10;
    } else {
      this.currentY += 10;
    }
  }

  /**
   * Pridanie fotiek vozidla
   */
  private async addVehicleImages(images: any[], maxWidth: number, maxHeight: number, quality: number) {
    this.doc.setFontSize(14);
    this.doc.setFont('helvetica', 'bold');
    this.doc.text('FOTODOKUMENTÁCIA VOZIDLA', this.margin, this.currentY);
    this.currentY += 10;

    const imagesPerRow = 2;
    let currentX = this.margin;
    let rowHeight = 0;

    for (let i = 0; i < images.length; i++) {
      const image = images[i];
      
      try {
        // Načítanie obrázka z R2 URL
        const imgData = await this.loadImageFromUrl(image.url);
        
        // Výpočet rozmerov
        const { width, height } = this.calculateImageDimensions(imgData, maxWidth, maxHeight);
        
        // Kontrola či sa obrázok zmestí na stránku
        if (this.currentY + height > this.pageHeight - 30) {
          this.doc.addPage();
          this.currentY = 20;
          currentX = this.margin;
        }

        // Pridanie obrázka
        this.doc.addImage(imgData, 'JPEG', currentX, this.currentY, width, height);
        
        // Pridanie popisu
        this.doc.setFontSize(8);
        this.doc.text(image.filename || `Fotka ${i + 1}`, currentX, this.currentY + height + 5);
        
        currentX += width + 10;
        rowHeight = Math.max(rowHeight, height + 15);

        // Nový riadok ak je potrebný
        if ((i + 1) % imagesPerRow === 0) {
          this.currentY += rowHeight;
          currentX = this.margin;
          rowHeight = 0;
        }
      } catch (error) {
        console.error('❌ Error loading image:', image.url, error);
        // Pridanie placeholder textu
        this.doc.setFontSize(10);
        this.doc.text(`Chyba načítania: ${image.filename || 'Fotka'}`, currentX, this.currentY);
        currentX += 100;
      }
    }

    // Posun na ďalší riadok ak zostali obrázky
    if (images.length % imagesPerRow !== 0) {
      this.currentY += rowHeight;
    }

    this.currentY += 10;
  }

  /**
   * Pridanie dokumentov
   */
  private async addDocumentImages(images: any[], maxWidth: number, maxHeight: number, quality: number) {
    this.doc.setFontSize(14);
    this.doc.setFont('helvetica', 'bold');
    this.doc.text('DOKUMENTY', this.margin, this.currentY);
    this.currentY += 10;

    const imagesPerRow = 2;
    let currentX = this.margin;
    let rowHeight = 0;

    for (let i = 0; i < images.length; i++) {
      const image = images[i];
      
      try {
        const imgData = await this.loadImageFromUrl(image.url);
        const { width, height } = this.calculateImageDimensions(imgData, maxWidth, maxHeight);
        
        if (this.currentY + height > this.pageHeight - 30) {
          this.doc.addPage();
          this.currentY = 20;
          currentX = this.margin;
        }

        this.doc.addImage(imgData, 'JPEG', currentX, this.currentY, width, height);
        
        this.doc.setFontSize(8);
        this.doc.text(image.filename || `Dokument ${i + 1}`, currentX, this.currentY + height + 5);
        
        currentX += width + 10;
        rowHeight = Math.max(rowHeight, height + 15);

        if ((i + 1) % imagesPerRow === 0) {
          this.currentY += rowHeight;
          currentX = this.margin;
          rowHeight = 0;
        }
      } catch (error) {
        console.error('❌ Error loading document:', image.url, error);
        this.doc.setFontSize(10);
        this.doc.text(`Chyba načítania: ${image.filename || 'Dokument'}`, currentX, this.currentY);
        currentX += 100;
      }
    }

    if (images.length % imagesPerRow !== 0) {
      this.currentY += rowHeight;
    }

    this.currentY += 10;
  }

  /**
   * Pridanie škôd
   */
  private addDamages(damages: any[]) {
    this.doc.setFontSize(14);
    this.doc.setFont('helvetica', 'bold');
    this.doc.text('ŠKODY A POŠKODENIA', this.margin, this.currentY);
    this.currentY += 10;

    if (damages.length === 0) {
      this.doc.setFontSize(10);
      this.doc.text('Žiadne škody neboli zaznamenané', this.margin, this.currentY);
      this.currentY += 10;
      return;
    }

    damages.forEach((damage, index) => {
      this.doc.setFontSize(10);
      this.doc.setFont('helvetica', 'bold');
      this.doc.text(`Škoda ${index + 1}:`, this.margin, this.currentY);
      this.currentY += 5;
      
      this.doc.setFont('helvetica', 'normal');
      this.doc.text(`Popis: ${damage.description || 'N/A'}`, this.margin + 10, this.currentY);
      this.currentY += 5;
      
      if (damage.location) {
        this.doc.text(`Lokalizácia: ${damage.location}`, this.margin + 10, this.currentY);
        this.currentY += 5;
      }
      
      if (damage.severity) {
        this.doc.text(`Závažnosť: ${damage.severity}`, this.margin + 10, this.currentY);
        this.currentY += 5;
      }
      
      this.currentY += 5;
    });
  }

  /**
   * Pridanie poznámok
   */
  private addNotes(notes: string) {
    this.doc.setFontSize(14);
    this.doc.setFont('helvetica', 'bold');
    this.doc.text('POZNÁMKY', this.margin, this.currentY);
    this.currentY += 10;

    this.doc.setFontSize(10);
    this.doc.setFont('helvetica', 'normal');
    
    // Rozdelenie textu na riadky
    const words = notes.split(' ');
    let line = '';
    const maxWidth = this.pageWidth - 2 * this.margin;
    
    words.forEach(word => {
      const testLine = line + word + ' ';
      const testWidth = this.doc.getTextWidth(testLine);
      
      if (testWidth > maxWidth && line !== '') {
        this.doc.text(line, this.margin, this.currentY);
        this.currentY += 5;
        line = word + ' ';
      } else {
        line = testLine;
      }
    });
    
    if (line) {
      this.doc.text(line, this.margin, this.currentY);
      this.currentY += 10;
    }
  }

  /**
   * Pridanie podpisov
   */
  private async addSignatures(signatures: any[], maxWidth: number, maxHeight: number, quality: number) {
    this.doc.setFontSize(14);
    this.doc.setFont('helvetica', 'bold');
    this.doc.text('PODPISY', this.margin, this.currentY);
    this.currentY += 10;

    const signaturesPerRow = 2;
    let currentX = this.margin;
    let rowHeight = 0;

    for (let i = 0; i < signatures.length; i++) {
      const signature = signatures[i];
      
      try {
        const imgData = await this.loadImageFromUrl(signature.url);
        const { width, height } = this.calculateImageDimensions(imgData, maxWidth, maxHeight);
        
        if (this.currentY + height > this.pageHeight - 30) {
          this.doc.addPage();
          this.currentY = 20;
          currentX = this.margin;
        }

        this.doc.addImage(imgData, 'JPEG', currentX, this.currentY, width, height);
        
        this.doc.setFontSize(8);
        this.doc.text(signature.signerName || `Podpis ${i + 1}`, currentX, this.currentY + height + 5);
        
        currentX += width + 10;
        rowHeight = Math.max(rowHeight, height + 15);

        if ((i + 1) % signaturesPerRow === 0) {
          this.currentY += rowHeight;
          currentX = this.margin;
          rowHeight = 0;
        }
      } catch (error) {
        console.error('❌ Error loading signature:', signature.url, error);
        this.doc.setFontSize(10);
        this.doc.text(`Chyba načítania podpisu: ${signature.signerName || 'Podpis'}`, currentX, this.currentY);
        currentX += 100;
      }
    }

    if (signatures.length % signaturesPerRow !== 0) {
      this.currentY += rowHeight;
    }

    this.currentY += 10;
  }

  /**
   * Pridanie päty
   */
  private addFooter(protocol: ProtocolData) {
    this.currentY = this.pageHeight - 30;
    
    this.doc.setFontSize(8);
    this.doc.setFont('helvetica', 'normal');
    this.doc.text(`Protokol vygenerovaný: ${new Date().toLocaleString('sk-SK')}`, this.margin, this.currentY);
    this.currentY += 5;
    this.doc.text(`ID protokolu: ${protocol.id}`, this.margin, this.currentY);
  }

  /**
   * Načítanie obrázka z URL
   */
  private async loadImageFromUrl(url: string): Promise<string> {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        
        if (!ctx) {
          reject(new Error('Canvas context not available'));
          return;
        }
        
        canvas.width = img.width;
        canvas.height = img.height;
        ctx.drawImage(img, 0, 0);
        
        const dataUrl = canvas.toDataURL('image/jpeg', 0.8);
        resolve(dataUrl);
      };
      
      img.onerror = () => {
        reject(new Error(`Failed to load image: ${url}`));
      };
      
      img.src = url;
    });
  }

  /**
   * Výpočet rozmerov obrázka
   */
  private calculateImageDimensions(imgData: string, maxWidth: number, maxHeight: number) {
    const img = new Image();
    img.src = imgData;
    
    const aspectRatio = img.width / img.height;
    let width = maxWidth;
    let height = width / aspectRatio;
    
    if (height > maxHeight) {
      height = maxHeight;
      width = height * aspectRatio;
    }
    
    return { width, height };
  }
}

export default PDFGenerator; 