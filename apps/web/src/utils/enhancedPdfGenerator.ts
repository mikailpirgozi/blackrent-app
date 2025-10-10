import jsPDF from 'jspdf';
import { SessionStorageManager } from './sessionStorageManager';
import { logger } from './logger';
import type { HandoverProtocol, ReturnProtocol, ProtocolImage } from '../types';

export interface ProtocolData {
  id: string;
  type: 'handover' | 'return';
  rental: Record<string, unknown>;
  location: string;
  vehicleCondition: Record<string, unknown>;
  vehicleImages: unknown[];
  documentImages: unknown[];
  damageImages: unknown[];
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
    images: unknown[],
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
        const imgObj = image as { thumbnail?: string; filename?: string };

        // Načítanie thumbnailu (800px) priamo do PDF
        if (!imgObj.thumbnail) {
          console.warn('⚠️ Image thumbnail is missing, skipping image');
          continue;
        }
        const imageData = await this.loadImageData(imgObj.thumbnail);

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
        const imgObj = image as { filename?: string };
        console.error(
          '❌ Error processing image:',
          imgObj.filename || 'unknown',
          error
        );
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

  /**
   * ✨ NOVÁ METÓDA: Generovanie PDF s použitím SessionStorage
   *
   * Namiesto sťahovania fotiek z R2, používa komprimované JPEG verzie
   * uložené v SessionStorage počas uploadu.
   */
  async generateProtocolPDF(
    protocol: HandoverProtocol | ReturnProtocol
  ): Promise<Blob> {
    this.doc = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4',
    });

    // 1. Header
    this.addProtocolHeader(protocol);

    // 2. Basic info
    this.addProtocolBasicInfo(protocol);

    // 3. Vehicle images - POUŽIŤ PDF verzie z SessionStorage
    if (protocol.vehicleImages && protocol.vehicleImages.length > 0) {
      await this.addImagesFromSession(
        'Fotografie vozidla',
        protocol.vehicleImages
      );
    }

    // 4. Document images
    if (protocol.documentImages && protocol.documentImages.length > 0) {
      await this.addImagesFromSession(
        'Fotografie dokladov',
        protocol.documentImages
      );
    }

    // 5. Damage images
    if (protocol.damageImages && protocol.damageImages.length > 0) {
      await this.addImagesFromSession(
        'Fotografie poškodení',
        protocol.damageImages
      );
    }

    // 6. Signatures
    await this.addProtocolSignatures(protocol.signatures);

    // 7. Footer
    this.addProtocolFooter(protocol);

    return this.doc.output('blob');
  }

  /**
   * Pridanie fotiek z SessionStorage
   */
  private async addImagesFromSession(
    title: string,
    images: ProtocolImage[]
  ): Promise<void> {
    this.doc.addPage();
    this.doc.setFontSize(16);
    this.doc.setFont('helvetica', 'bold');
    this.doc.setTextColor(0, 0, 0);
    this.doc.text(title, 20, 20);

    let y = 30;
    let x = 20;
    const imgWidth = 80;
    const imgHeight = 60;
    const margin = 10;

    for (const image of images) {
      // Načítaj PDF verziu z SessionStorage
      const base64 = SessionStorageManager.getPDFImage(image.id);

      if (!base64) {
        logger.warn('PDF image not found in SessionStorage', {
          imageId: image.id,
        });
        continue;
      }

      // Check page break
      if (y + imgHeight > 270) {
        this.doc.addPage();
        y = 20;
        x = 20;
      }

      // Add image
      try {
        this.doc.addImage(base64, 'JPEG', x, y, imgWidth, imgHeight);

        // Add description if exists
        if (image.description) {
          this.doc.setFontSize(8);
          this.doc.setFont('helvetica', 'normal');
          this.doc.text(
            image.description.substring(0, 50),
            x,
            y + imgHeight + 5,
            { maxWidth: imgWidth }
          );
        }

        // Move to next position
        x += imgWidth + margin;
        if (x + imgWidth > 200) {
          x = 20;
          y += imgHeight + margin + 10;
        }
      } catch (error) {
        logger.error('Failed to add image to PDF', {
          imageId: image.id,
          error,
        });
      }
    }
  }

  /**
   * Header pre nový systém
   */
  private addProtocolHeader(protocol: HandoverProtocol | ReturnProtocol): void {
    this.doc.setFillColor(41, 128, 185);
    this.doc.rect(0, 0, 210, 30, 'F');

    this.doc.setTextColor(255, 255, 255);
    this.doc.setFontSize(24);
    this.doc.setFont('helvetica', 'bold');
    this.doc.text(
      protocol.type === 'handover'
        ? 'ODOVZDÁVACÍ PROTOKOL'
        : 'PREBERACÍ PROTOKOL',
      105,
      15,
      { align: 'center' }
    );

    this.doc.setFontSize(12);
    this.doc.setFont('helvetica', 'normal');
    this.doc.text(
      `Číslo: ${protocol.id.substring(0, 8).toUpperCase()}`,
      105,
      23,
      { align: 'center' }
    );

    this.doc.setTextColor(0, 0, 0);
  }

  /**
   * Basic info pre nový systém
   */
  private addProtocolBasicInfo(
    protocol: HandoverProtocol | ReturnProtocol
  ): void {
    let y = 40;

    // Základné informácie
    this.doc.setFontSize(14);
    this.doc.setFont('helvetica', 'bold');
    this.doc.text('Základné informácie', 20, y);
    y += 10;

    this.doc.setFontSize(10);
    this.doc.setFont('helvetica', 'normal');

    // Protocol info
    this.doc.text(
      `Číslo protokolu: ${protocol.id.substring(0, 8).toUpperCase()}`,
      20,
      y
    );
    y += 6;
    this.doc.text(
      `Dátum vytvorenia: ${new Date(protocol.createdAt).toLocaleString('sk-SK')}`,
      20,
      y
    );
    y += 6;
    this.doc.text(`Miesto: ${protocol.location || 'Neuvedené'}`, 20, y);
    y += 6;
    this.doc.text(
      `Stav: ${protocol.status === 'completed' ? 'Dokončený' : 'Rozpracovaný'}`,
      20,
      y
    );
    y += 10;

    // Informácie o prenájme
    this.doc.setFontSize(14);
    this.doc.setFont('helvetica', 'bold');
    this.doc.text('Informácie o prenájme', 20, y);
    y += 10;

    this.doc.setFontSize(10);
    this.doc.setFont('helvetica', 'normal');

    const rental = protocol.rentalData;
    if (rental) {
      this.doc.text(`Číslo objednávky: ${rental.orderNumber || 'N/A'}`, 20, y);
      y += 6;
      this.doc.text(
        `Dátum od: ${new Date(rental.startDate).toLocaleDateString('sk-SK')}`,
        20,
        y
      );
      y += 6;
      this.doc.text(
        `Dátum do: ${new Date(rental.endDate).toLocaleDateString('sk-SK')}`,
        20,
        y
      );
      y += 6;
      this.doc.text(
        `Celková cena: ${rental.totalPrice?.toFixed(2) || '0.00'} ${rental.currency || 'EUR'}`,
        20,
        y
      );
      y += 6;
      this.doc.text(
        `Depozit: ${rental.deposit?.toFixed(2) || '0.00'} ${rental.currency || 'EUR'}`,
        20,
        y
      );
      y += 10;
    }

    // Informácie o vozidle
    this.doc.setFontSize(14);
    this.doc.setFont('helvetica', 'bold');
    this.doc.text('Informácie o vozidle', 20, y);
    y += 10;

    this.doc.setFontSize(10);
    this.doc.setFont('helvetica', 'normal');

    const vehicle = protocol.rentalData?.vehicle;
    if (vehicle) {
      this.doc.text(
        `Vozidlo: ${vehicle.brand || 'N/A'} ${vehicle.model || ''}`,
        20,
        y
      );
      y += 6;
      this.doc.text(`ŠPZ: ${vehicle.licensePlate || 'N/A'}`, 20, y);
      y += 6;
      if (protocol.rentalData?.vehicleVin) {
        this.doc.text(`VIN: ${protocol.rentalData.vehicleVin}`, 20, y);
        y += 6;
      }
    }

    y += 4;

    // Informácie o zákazníkovi
    this.doc.setFontSize(14);
    this.doc.setFont('helvetica', 'bold');
    this.doc.text('Informácie o zákazníkovi', 20, y);
    y += 10;

    this.doc.setFontSize(10);
    this.doc.setFont('helvetica', 'normal');

    const customer = protocol.rentalData?.customer;
    if (customer) {
      this.doc.text(`Meno: ${customer.name || 'N/A'}`, 20, y);
      y += 6;
      if (customer.email) {
        this.doc.text(`Email: ${customer.email}`, 20, y);
        y += 6;
      }
      if (customer.phone) {
        this.doc.text(`Telefón: ${customer.phone}`, 20, y);
        y += 6;
      }
    }

    y += 4;

    // Vehicle condition
    this.doc.setFontSize(14);
    this.doc.setFont('helvetica', 'bold');
    this.doc.text('Stav vozidla pri prevzatí', 20, y);
    y += 10;

    this.doc.setFontSize(10);
    this.doc.setFont('helvetica', 'normal');
    this.doc.text(
      `Stav tachometra: ${protocol.vehicleCondition.odometer || 0} km`,
      20,
      y
    );
    y += 6;
    this.doc.text(
      `Úroveň paliva: ${protocol.vehicleCondition.fuelLevel || 0}%`,
      20,
      y
    );
    y += 6;
    this.doc.text(
      `Exterier: ${protocol.vehicleCondition.exteriorCondition || 'Neuvedené'}`,
      20,
      y
    );
    y += 6;
    this.doc.text(
      `Interier: ${protocol.vehicleCondition.interiorCondition || 'Neuvedené'}`,
      20,
      y
    );

    if (protocol.notes) {
      y += 10;
      this.doc.setFontSize(12);
      this.doc.setFont('helvetica', 'bold');
      this.doc.text('Poznámky', 20, y);
      y += 8;

      this.doc.setFontSize(10);
      this.doc.setFont('helvetica', 'normal');
      const lines = this.doc.splitTextToSize(protocol.notes, 170);
      this.doc.text(lines, 20, y);
    }
  }

  /**
   * Signatures pre nový systém
   */
  private async addProtocolSignatures(signatures: unknown[]): Promise<void> {
    if (!signatures || signatures.length === 0) return;

    this.doc.addPage();
    this.doc.setFontSize(16);
    this.doc.setFont('helvetica', 'bold');
    this.doc.text('Podpisy', 20, 20);

    let y = 40;

    for (const sig of signatures) {
      const signature = sig as {
        signature: string;
        signerName: string;
        signerRole: string;
        timestamp: Date;
        location: string;
      };

      try {
        // Add signature image
        this.doc.addImage(signature.signature, 'PNG', 20, y, 60, 30);

        // Add signature info
        this.doc.setFontSize(10);
        this.doc.setFont('helvetica', 'normal');
        this.doc.text(`${signature.signerName}`, 90, y + 10);
        this.doc.text(
          `${signature.signerRole === 'customer' ? 'Zákazník' : 'Zamestnanec'}`,
          90,
          y + 16
        );
        this.doc.text(
          new Date(signature.timestamp).toLocaleString('sk-SK'),
          90,
          y + 22
        );

        y += 45;

        if (y > 250) {
          this.doc.addPage();
          y = 20;
        }
      } catch (error) {
        logger.error('Failed to add signature to PDF', { error });
      }
    }
  }

  /**
   * Footer pre nový systém
   */
  private addProtocolFooter(
    _protocol: HandoverProtocol | ReturnProtocol
  ): void {
    const pageCount = this.doc.getNumberOfPages();

    for (let i = 1; i <= pageCount; i++) {
      this.doc.setPage(i);
      this.doc.setFontSize(8);
      this.doc.setFont('helvetica', 'normal');
      this.doc.setTextColor(128, 128, 128);

      // Page number
      this.doc.text(`Strana ${i} z ${pageCount}`, 105, 285, {
        align: 'center',
      });

      // Generated info
      this.doc.text(
        `Vygenerované: ${new Date().toLocaleString('sk-SK')}`,
        20,
        290
      );
    }
  }
}

export default EnhancedPDFGenerator;
