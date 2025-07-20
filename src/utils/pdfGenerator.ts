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
  private margin: number = 20;
  private primaryColor: [number, number, number] = [25, 118, 210]; // Blue
  private secondaryColor: [number, number, number] = [66, 66, 66]; // Dark gray

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
      // Header s logom a názvom
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
   * Pridanie hlavičky s moderným dizajnom
   */
  private addHeader(protocol: ProtocolData) {
    // Pozadie pre header
    this.doc.setFillColor(...this.primaryColor);
    this.doc.rect(0, 0, this.pageWidth, 40, 'F');
    
    // Logo placeholder (môžete pridať vlastné logo)
    this.doc.setFillColor(255, 255, 255);
    this.doc.circle(30, 20, 8, 'F');
    this.doc.setFontSize(12);
    this.doc.setTextColor(255, 255, 255);
    this.doc.text('BR', 30, 24, { align: 'center' });
    
    // Názov protokolu
    this.doc.setFontSize(18);
    this.doc.setFont('helvetica', 'bold');
    this.doc.setTextColor(255, 255, 255);
    const title = protocol.type === 'handover' ? 'PROTOKOL O PREVZATÍ VOZIDLA' : 'PROTOKOL O VRÁTENÍ VOZIDLA';
    this.doc.text(title, this.pageWidth / 2, 25, { align: 'center' });
    
    // Reset pozície
    this.currentY = 50;
    
    // Informácie o protokole
    this.doc.setFontSize(10);
    this.doc.setTextColor(...this.secondaryColor);
    this.doc.text(`Číslo protokolu: ${protocol.id}`, this.margin, this.currentY);
    this.currentY += 6;
    
    this.doc.text(`Dátum: ${new Date(protocol.completedAt).toLocaleDateString('sk-SK')}`, this.margin, this.currentY);
    this.currentY += 6;
    
    this.doc.text(`Miesto: ${protocol.location}`, this.margin, this.currentY);
    this.currentY += 15;
  }

  /**
   * Pridanie základných informácií s tabuľkou
   */
  private addBasicInfo(protocol: ProtocolData) {
    this.addSectionTitle('ZÁKLADNÉ INFORMÁCIE');
    
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

    // Vytvorenie tabuľky
    const tableData = basicInfo.map(([label, value]) => [label, value]);
    
    (this.doc as any).autoTable({
      startY: this.currentY,
      head: [['Položka', 'Hodnota']],
      body: tableData,
      theme: 'grid',
      headStyles: {
        fillColor: this.primaryColor,
        textColor: [255, 255, 255],
        fontStyle: 'bold'
      },
      styles: {
        fontSize: 9,
        cellPadding: 3
      },
      columnStyles: {
        0: { fontStyle: 'bold', cellWidth: 50 },
        1: { cellWidth: 100 }
      }
    });

    this.currentY = (this.doc as any).lastAutoTable.finalY + 10;
  }

  /**
   * Pridanie stavu vozidla
   */
  private addVehicleCondition(protocol: ProtocolData) {
    this.addSectionTitle('STAV VOZIDLA');
    
    const condition = protocol.vehicleCondition;
    const vehicleInfo = [
      ['Počet kilometrov:', `${condition.odometer?.toLocaleString() || 0} km`],
      ['Úroveň paliva:', `${condition.fuelLevel || 0}%`],
      ['Typ paliva:', condition.fuelType || 'N/A'],
      ['Exteriér:', condition.exteriorCondition || 'N/A'],
      ['Interiér:', condition.interiorCondition || 'N/A'],
    ];

    const tableData = vehicleInfo.map(([label, value]) => [label, value]);
    
    (this.doc as any).autoTable({
      startY: this.currentY,
      head: [['Parameter', 'Hodnota']],
      body: tableData,
      theme: 'grid',
      headStyles: {
        fillColor: this.primaryColor,
        textColor: [255, 255, 255],
        fontStyle: 'bold'
      },
      styles: {
        fontSize: 9,
        cellPadding: 3
      },
      columnStyles: {
        0: { fontStyle: 'bold', cellWidth: 50 },
        1: { cellWidth: 100 }
      }
    });

    this.currentY = (this.doc as any).lastAutoTable.finalY + 10;

    if (condition.notes) {
      this.doc.setFontSize(10);
      this.doc.setFont('helvetica', 'bold');
      this.doc.text('Poznámky k stavu:', this.margin, this.currentY);
      this.currentY += 5;
      
      this.doc.setFont('helvetica', 'normal');
      this.doc.text(condition.notes, this.margin + 10, this.currentY);
      this.currentY += 10;
    }
  }

  /**
   * Pridanie fotiek vozidla s lepším layoutom
   */
  private async addVehicleImages(images: any[], maxWidth: number, maxHeight: number, quality: number) {
    this.addSectionTitle('FOTODOKUMENTÁCIA VOZIDLA');
    
    if (images.length === 0) {
      this.doc.setFontSize(10);
      this.doc.setTextColor(128, 128, 128);
      this.doc.text('Žiadne fotky nie sú k dispozícii', this.margin, this.currentY);
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
         if (this.currentY + height > this.pageHeight - 30) {
          this.doc.addPage();
          this.currentY = 20;
          currentX = this.margin;
          rowHeight = 0;
          imagesInRow = 0;
        }

        // Pridanie obrázka
        this.doc.addImage(imgData, 'JPEG', currentX, this.currentY, width, height);
        
        // Popis obrázka
        this.doc.setFontSize(8);
        this.doc.setTextColor(...this.secondaryColor);
        this.doc.text(`Fotka ${i + 1}`, currentX, this.currentY + height + 3);
        
        currentX += width + 10;
        rowHeight = Math.max(rowHeight, height + 15);
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
        currentX += maxWidth + 10;
      }
    }

    if (imagesInRow > 0) {
      this.currentY += rowHeight;
    }

    this.currentY += 10;
  }

  /**
   * Pridanie dokumentov
   */
  private async addDocumentImages(images: any[], maxWidth: number, maxHeight: number, quality: number) {
    this.addSectionTitle('DOKUMENTY');
    
    if (images.length === 0) {
      this.doc.setFontSize(10);
      this.doc.setTextColor(128, 128, 128);
      this.doc.text('Žiadne dokumenty nie sú k dispozícii', this.margin, this.currentY);
      this.currentY += 10;
      return;
    }

    // Podobne ako addVehicleImages, ale s menšími obrázkami
    const imagesPerRow = 3;
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
          imgData = this.createImagePlaceholder(maxWidth * 0.7, maxHeight * 0.7, `Dokument ${i + 1}`);
        }

                 const { width, height } = await this.calculateImageDimensions(imgData, maxWidth * 0.7, maxHeight * 0.7);
         
         if (this.currentY + height > this.pageHeight - 30) {
          this.doc.addPage();
          this.currentY = 20;
          currentX = this.margin;
          rowHeight = 0;
          imagesInRow = 0;
        }

        this.doc.addImage(imgData, 'JPEG', currentX, this.currentY, width, height);
        
        this.doc.setFontSize(7);
        this.doc.setTextColor(...this.secondaryColor);
        this.doc.text(`Dokument ${i + 1}`, currentX, this.currentY + height + 2);
        
        currentX += width + 5;
        rowHeight = Math.max(rowHeight, height + 10);
        imagesInRow++;

        if (imagesInRow >= imagesPerRow) {
          this.currentY += rowHeight;
          currentX = this.margin;
          rowHeight = 0;
          imagesInRow = 0;
        }
      } catch (error) {
        console.error('❌ Error loading document:', image.url, error);
        const placeholder = this.createImagePlaceholder(maxWidth * 0.7, maxHeight * 0.7, `Chyba ${i + 1}`);
        this.doc.addImage(placeholder, 'JPEG', currentX, this.currentY, maxWidth * 0.7, maxHeight * 0.7);
        currentX += maxWidth * 0.7 + 5;
      }
    }

    if (imagesInRow > 0) {
      this.currentY += rowHeight;
    }

    this.currentY += 10;
  }

  /**
   * Pridanie škôd s lepším formátovaním
   */
  private addDamages(damages: any[]) {
    this.addSectionTitle('ŠKODY A POŠKODENIA');
    
    if (damages.length === 0) {
      this.doc.setFontSize(10);
      this.doc.setTextColor(0, 128, 0);
      this.doc.text('✅ Žiadne škody neboli zaznamenané', this.margin, this.currentY);
      this.currentY += 10;
      return;
    }

    damages.forEach((damage, index) => {
      // Box pre škodu
      this.doc.setDrawColor(...this.primaryColor);
      this.doc.setFillColor(255, 248, 220);
      this.doc.roundedRect(this.margin, this.currentY, this.pageWidth - 2 * this.margin, 25, 3, 3, 'FD');
      
      this.doc.setFontSize(10);
      this.doc.setFont('helvetica', 'bold');
      this.doc.setTextColor(...this.primaryColor);
      this.doc.text(`Škoda ${index + 1}:`, this.margin + 5, this.currentY + 8);
      
      this.doc.setFont('helvetica', 'normal');
      this.doc.setTextColor(...this.secondaryColor);
      this.doc.text(`Popis: ${damage.description || 'N/A'}`, this.margin + 5, this.currentY + 15);
      
      if (damage.location) {
        this.doc.text(`Lokalizácia: ${damage.location}`, this.margin + 5, this.currentY + 22);
      }
      
      this.currentY += 30;
    });
  }

  /**
   * Pridanie poznámok
   */
  private addNotes(notes: string) {
    this.addSectionTitle('POZNÁMKY');
    
    this.doc.setFontSize(10);
    this.doc.setFont('helvetica', 'normal');
    this.doc.setTextColor(...this.secondaryColor);
    
    // Box pre poznámky
    this.doc.setDrawColor(...this.primaryColor);
    this.doc.setFillColor(248, 249, 250);
    this.doc.roundedRect(this.margin, this.currentY, this.pageWidth - 2 * this.margin, 20, 3, 3, 'FD');
    
    this.doc.text(notes, this.margin + 5, this.currentY + 8);
    this.currentY += 25;
  }

  /**
   * Pridanie podpisov
   */
  private async addSignatures(signatures: any[], maxWidth: number, maxHeight: number, quality: number) {
    this.addSectionTitle('PODPISY');
    
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

    for (let i = 0; i < signatures.length; i++) {
      const signature = signatures[i];
      
      if (!signature.url) {
        console.warn('⚠️ Signature without URL:', signature);
        continue;
      }
      
      try {
        let imgData: string;
        try {
          imgData = await this.loadImageFromUrl(signature.url);
        } catch (error) {
          imgData = this.createImagePlaceholder(maxWidth, maxHeight, 'Podpis');
        }

                 const { width, height } = await this.calculateImageDimensions(imgData, maxWidth, maxHeight);
         
         if (this.currentY + height > this.pageHeight - 30) {
          this.doc.addPage();
          this.currentY = 20;
          currentX = this.margin;
        }

        // Box pre podpis
        this.doc.setDrawColor(...this.primaryColor);
        this.doc.setFillColor(255, 255, 255);
        this.doc.roundedRect(currentX - 2, this.currentY - 2, width + 4, height + 15, 3, 3, 'FD');

        this.doc.addImage(imgData, 'JPEG', currentX, this.currentY, width, height);
        
        this.doc.setFontSize(8);
        this.doc.setTextColor(...this.secondaryColor);
        this.doc.text(signature.signerName || `Podpis ${i + 1}`, currentX, this.currentY + height + 8);
        
        currentX += width + 20;
        rowHeight = Math.max(rowHeight, height + 20);

        if ((i + 1) % signaturesPerRow === 0) {
          this.currentY += rowHeight;
          currentX = this.margin;
          rowHeight = 0;
        }
      } catch (error) {
        console.error('❌ Error loading signature:', signature.url, error);
        this.doc.setFontSize(10);
        this.doc.setTextColor(255, 0, 0);
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
    
    // Čiara
    this.doc.setDrawColor(...this.primaryColor);
    this.doc.line(this.margin, this.currentY, this.pageWidth - this.margin, this.currentY);
    this.currentY += 5;
    
    this.doc.setFontSize(8);
    this.doc.setFont('helvetica', 'normal');
    this.doc.setTextColor(...this.secondaryColor);
    this.doc.text(`Protokol vygenerovaný: ${new Date().toLocaleString('sk-SK')}`, this.margin, this.currentY);
    this.currentY += 4;
    this.doc.text(`ID protokolu: ${protocol.id}`, this.margin, this.currentY);
    this.currentY += 4;
    this.doc.text('BlackRent - Profesionálne riešenia pre autopožičovne', this.margin, this.currentY);
  }

  /**
   * Pridanie názvu sekcie
   */
  private addSectionTitle(title: string) {
    this.doc.setFontSize(14);
    this.doc.setFont('helvetica', 'bold');
    this.doc.setTextColor(...this.primaryColor);
    this.doc.text(title, this.margin, this.currentY);
    this.currentY += 8;
    
    // Čiara pod názvom
    this.doc.setDrawColor(...this.primaryColor);
    this.doc.line(this.margin, this.currentY, this.pageWidth - this.margin, this.currentY);
    this.currentY += 8;
  }

  /**
   * Načítanie obrázka z URL s CORS handling
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