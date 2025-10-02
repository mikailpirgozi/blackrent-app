import jsPDF from 'jspdf';

import type { ProcessedImage } from './imageProcessor';

export interface ProtocolData {
  id: string;
  type: 'handover' | 'return';
  rental: Record<string, unknown>;
  location: string;
  vehicleCondition: Record<string, unknown>;
  vehicleImages: ProcessedImage[];
  documentImages: ProcessedImage[];
  damageImages: ProcessedImage[];
  damages: unknown[];
  signatures: unknown[];
  notes: string;
  createdAt: Date;
  completedAt: Date;
}

export class EnhancedPDFGenerator {
  private doc: jsPDF;
  private currentY: number = 20;
  private pageWidth: number;
  private pageHeight: number;
  private margin: number = 20;
  private primaryColor: [number, number, number] = [25, 118, 210]; // Blue
  private secondaryColor: [number, number, number] = [66, 66, 66]; // Dark gray

  constructor() {
    this.doc = new jsPDF();
    this.pageWidth = this.doc.internal.pageSize.getWidth();
    this.pageHeight = this.doc.internal.pageSize.getHeight();
  }

  /**
   * Generovanie PDF s vloženými obrázkami (800px)
   */
  async generateCustomerProtocol(protocol: ProtocolData): Promise<Blob> {
    // Reset pozície
    this.currentY = 20;

    // 1. Záhlavie
    this.addHeader(protocol);

    // 2. Základné informácie
    this.addBasicInfo(protocol);

    // 3. Stav vozidla
    this.addVehicleCondition(protocol);

    // 4. Obrázky vozidla vložené priamo do PDF
    await this.embedImages(protocol.vehicleImages, 'FOTKY VOZIDLA', 120, 80);

    // 5. Dokumenty vložené priamo do PDF
    await this.embedImages(protocol.documentImages, 'DOKUMENTY', 100, 60);

    // 6. Škody
    this.addDamages(protocol.damages);

    // 7. Podpisy vložené priamo do PDF
    await this.embedSignatures(protocol.signatures);

    // 8. Poznámky
    this.addNotes(protocol.notes);

    // 9. Päta
    this.addFooter(protocol);

    return this.doc.output('blob');
  }

  /**
   * Pridanie záhlavia
   */
  private addHeader(protocol: ProtocolData) {
    this.doc.setFillColor(...this.primaryColor);
    this.doc.rect(0, 0, this.pageWidth, 30, 'F');

    this.doc.setFontSize(18);
    this.doc.setFont('helvetica', 'bold');
    this.doc.setTextColor(255, 255, 255);
    this.doc.text('BLACKRENT', this.margin, 20);

    this.doc.setFontSize(12);
    this.doc.text(
      `${protocol.type === 'handover' ? 'PREBERACÍ' : 'VRATNÝ'} PROTOKOL`,
      this.pageWidth - 80,
      20
    );

    this.currentY = 40;
  }

  /**
   * Pridanie základných informácií
   */
  private addBasicInfo(protocol: ProtocolData) {
    this.addSectionTitle('ZÁKLADNÉ INFORMÁCIE');

    this.doc.setFontSize(10);
    this.doc.setFont('helvetica', 'normal');
    this.doc.setTextColor(...this.secondaryColor);

    const rental = protocol.rental;
    const vehicle = rental?.vehicle;
    const customer = rental?.customer;

    this.doc.text(
      `ID Prenájmu: ${rental?.id || 'N/A'}`,
      this.margin,
      this.currentY
    );
    this.currentY += 6;
    this.doc.text(
      `Vozidlo: ${(vehicle as { brand?: string })?.brand} ${(vehicle as { model?: string })?.model} (${(vehicle as { licensePlate?: string })?.licensePlate})`,
      this.margin,
      this.currentY
    );
    this.currentY += 6;
    this.doc.text(
      `Zákazník: ${(customer as { name?: string })?.name || 'N/A'}`,
      this.margin,
      this.currentY
    );
    this.currentY += 6;
    this.doc.text(
      `Dátum: ${new Date(protocol.createdAt).toLocaleDateString('sk-SK')}`,
      this.margin,
      this.currentY
    );
    this.currentY += 6;
    this.doc.text(
      `Miesto: ${protocol.location || 'N/A'}`,
      this.margin,
      this.currentY
    );
    this.currentY += 10;
  }

  /**
   * Pridanie stavu vozidla
   */
  private addVehicleCondition(protocol: ProtocolData) {
    this.addSectionTitle('STAV VOZIDLA');

    this.doc.setFontSize(10);
    this.doc.setFont('helvetica', 'normal');
    this.doc.setTextColor(...this.secondaryColor);

    const condition = protocol.vehicleCondition;

    this.doc.text(
      `Počítadlo km: ${condition?.odometer || 0} km`,
      this.margin,
      this.currentY
    );
    this.currentY += 6;
    this.doc.text(
      `Úroveň paliva: ${condition?.fuelLevel || 100}%`,
      this.margin,
      this.currentY
    );
    this.currentY += 6;
    this.doc.text(
      `Typ paliva: ${condition?.fuelType || 'N/A'}`,
      this.margin,
      this.currentY
    );
    this.currentY += 6;
    this.doc.text(
      `Stav: ${condition?.condition || 'Výborný'}`,
      this.margin,
      this.currentY
    );
    this.currentY += 10;
  }

  /**
   * Vloženie obrázkov priamo do PDF
   */
  private async embedImages(
    images: ProcessedImage[],
    title: string,
    maxWidth: number,
    maxHeight: number
  ) {
    this.addSectionTitle(title);

    if (images.length === 0) {
      this.doc.setFontSize(10);
      this.doc.setTextColor(128, 128, 128);
      this.doc.text(
        'Žiadne obrázky nie sú k dispozícii',
        this.margin,
        this.currentY
      );
      this.currentY += 10;
      return;
    }

    const imagesPerRow = 2;
    let currentX = this.margin;
    let rowHeight = 0;
    let imagesInRow = 0;

    for (let i = 0; i < images.length; i++) {
      const image = images[i];
      
      if (!image) {
        console.warn('⚠️ Image is undefined, skipping');
        continue;
      }

      try {
        // Načítanie thumbnailu (800px) priamo do PDF
        if (!image.thumbnail) {
          console.warn('⚠️ Image thumbnail is missing, skipping image');
          continue;
        }
        const imageData = await this.loadImageData(image.thumbnail);

        // Výpočet rozmerov
        const { width, height } = await this.calculateImageDimensions(
          imageData,
          maxWidth,
          maxHeight
        );

        // Kontrola či sa zmestí na stránku
        if (this.currentY + height > this.pageHeight - 30) {
          this.doc.addPage();
          this.currentY = 20;
          currentX = this.margin;
          rowHeight = 0;
          imagesInRow = 0;
        }

        // Vloženie obrázka priamo do PDF
        this.doc.addImage(
          imageData,
          'JPEG',
          currentX,
          this.currentY,
          width,
          height
        );

        // Popis obrázka
        this.doc.setFontSize(8);
        this.doc.setTextColor(...this.secondaryColor);
        this.doc.text(`Obrázok ${i + 1}`, currentX, this.currentY + height + 3);

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
        console.error('❌ Error processing image:', image.filename || 'unknown', error);
        // Pridaj placeholder pre chybný obrázok
        const placeholder = this.createImagePlaceholder(
          maxWidth,
          maxHeight,
          `Chyba ${i + 1}`
        );
        this.doc.addImage(
          placeholder,
          'JPEG',
          currentX,
          this.currentY,
          maxWidth,
          maxHeight
        );
        currentX += maxWidth + 10;
      }
    }

    if (imagesInRow > 0) {
      this.currentY += rowHeight;
    }

    this.currentY += 10;
  }

  /**
   * Vloženie podpisov priamo do PDF
   */
  private async embedSignatures(signatures: unknown[]) {
    this.addSectionTitle('PODPISY');

    if (signatures.length === 0) {
      this.doc.setFontSize(10);
      this.doc.setTextColor(128, 128, 128);
      this.doc.text(
        'Žiadne podpisy nie sú k dispozícii',
        this.margin,
        this.currentY
      );
      this.currentY += 10;
      return;
    }

    const signaturesPerRow = 2;
    let currentX = this.margin;
    let rowHeight = 0;

    for (let i = 0; i < signatures.length; i++) {
      const signature = signatures[i];

      try {
        // Načítanie podpisu (base64 alebo URL)
        const signatureData =
          (signature as { signature?: string }).signature ||
          (signature as { url?: string }).url;

        if (!signatureData) {
          throw new Error('Signature data is missing');
        }
        const imageData = await this.loadImageData(signatureData);

        const { width, height } = await this.calculateImageDimensions(
          imageData,
          80,
          40
        );

        if (this.currentY + height > this.pageHeight - 30) {
          this.doc.addPage();
          this.currentY = 20;
          currentX = this.margin;
          rowHeight = 0;
        }

        // Biele pozadie pre podpis
        this.doc.setFillColor(255, 255, 255);
        this.doc.roundedRect(
          currentX - 2,
          this.currentY - 2,
          width + 4,
          height + 15,
          3,
          3,
          'FD'
        );

        // Vloženie podpisu priamo do PDF
        this.doc.addImage(
          imageData,
          'JPEG',
          currentX,
          this.currentY,
          width,
          height
        );

        this.doc.setFontSize(8);
        this.doc.setTextColor(...this.secondaryColor);
        this.doc.text(
          (signature as { signerName?: string }).signerName ||
            `Podpis ${i + 1}`,
          currentX,
          this.currentY + height + 8
        );

        currentX += width + 20;
        rowHeight = Math.max(rowHeight, height + 20);

        if ((i + 1) % signaturesPerRow === 0) {
          this.currentY += rowHeight;
          currentX = this.margin;
          rowHeight = 0;
        }
      } catch (error) {
        console.error(
          '❌ Error loading signature:',
          (signature as { signerName?: string }).signerName,
          error
        );
        this.doc.setFontSize(10);
        this.doc.setTextColor(255, 0, 0);
        this.doc.text(
          `Chyba načítania podpisu: ${(signature as { signerName?: string }).signerName || 'Podpis'}`,
          currentX,
          this.currentY
        );
        currentX += 100;
      }
    }

    if (signatures.length % signaturesPerRow !== 0) {
      this.currentY += rowHeight;
    }

    this.currentY += 10;
  }

  /**
   * Pridanie škôd
   */
  private addDamages(damages: unknown[]) {
    this.addSectionTitle('ŠKODY A POŠKODENIA');

    if (damages.length === 0) {
      this.doc.setFontSize(10);
      this.doc.setTextColor(0, 128, 0);
      this.doc.text(
        '✅ Žiadne škody neboli zaznamenané',
        this.margin,
        this.currentY
      );
      this.currentY += 10;
      return;
    }

    damages.forEach((damage, index) => {
      this.doc.setDrawColor(...this.primaryColor);
      this.doc.setFillColor(255, 248, 220);
      this.doc.roundedRect(
        this.margin,
        this.currentY,
        this.pageWidth - 2 * this.margin,
        25,
        3,
        3,
        'FD'
      );

      this.doc.setFontSize(10);
      this.doc.setFont('helvetica', 'bold');
      this.doc.setTextColor(...this.primaryColor);
      this.doc.text(`Škoda ${index + 1}:`, this.margin + 5, this.currentY + 8);

      this.doc.setFont('helvetica', 'normal');
      this.doc.setTextColor(...this.secondaryColor);
      this.doc.text(
        `Popis: ${(damage as { description?: string }).description || 'N/A'}`,
        this.margin + 5,
        this.currentY + 15
      );

      if ((damage as { location?: string }).location) {
        this.doc.text(
          `Lokalizácia: ${(damage as { location?: string }).location}`,
          this.margin + 5,
          this.currentY + 22
        );
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

    this.doc.setDrawColor(...this.primaryColor);
    this.doc.setFillColor(248, 249, 250);
    this.doc.roundedRect(
      this.margin,
      this.currentY,
      this.pageWidth - 2 * this.margin,
      20,
      3,
      3,
      'FD'
    );

    this.doc.text(notes, this.margin + 5, this.currentY + 8);
    this.currentY += 25;
  }

  /**
   * Pridanie päty
   */
  private addFooter(protocol: ProtocolData) {
    this.currentY = this.pageHeight - 30;

    this.doc.setDrawColor(...this.primaryColor);
    this.doc.line(
      this.margin,
      this.currentY,
      this.pageWidth - this.margin,
      this.currentY
    );
    this.currentY += 5;

    this.doc.setFontSize(8);
    this.doc.setFont('helvetica', 'normal');
    this.doc.setTextColor(...this.secondaryColor);
    this.doc.text(
      `Protokol vygenerovaný: ${new Date().toLocaleString('sk-SK')}`,
      this.margin,
      this.currentY
    );
    this.currentY += 4;
    this.doc.text(`ID protokolu: ${protocol.id}`, this.margin, this.currentY);
    this.currentY += 4;
    this.doc.text(
      'BlackRent - Profesionálne riešenia pre autopožičovne',
      this.margin,
      this.currentY
    );
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

    this.doc.setDrawColor(...this.primaryColor);
    this.doc.line(
      this.margin,
      this.currentY,
      this.pageWidth - this.margin,
      this.currentY
    );
    this.currentY += 8;
  }

  /**
   * Načítanie obrázka z URL alebo base64
   */
  private async loadImageData(url: string): Promise<string> {
    return new Promise((resolve, reject) => {
      // Ak je to base64, použij priamo
      if (url.startsWith('data:image')) {
        resolve(url);
        return;
      }

      // Inak načítaj z URL
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
    });
  }

  /**
   * Vytvorenie placeholder obrázka
   */
  private createImagePlaceholder(
    width: number,
    height: number,
    text: string
  ): string {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');

    if (!ctx) {
      return '';
    }

    canvas.width = width;
    canvas.height = height;

    ctx.fillStyle = '#f0f0f0';
    ctx.fillRect(0, 0, width, height);

    ctx.strokeStyle = '#cccccc';
    ctx.lineWidth = 1;
    ctx.strokeRect(0, 0, width, height);

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
  private calculateImageDimensions(
    imgData: string,
    maxWidth: number,
    maxHeight: number
  ) {
    return new Promise<{ width: number; height: number }>(resolve => {
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

export default EnhancedPDFGenerator;
