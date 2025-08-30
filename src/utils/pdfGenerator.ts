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
  private currentY: number = 30;
  private pageWidth: number;
  private pageHeight: number;
  private margin: number = 20;
  private primaryColor: [number, number, number] = [25, 118, 210]; // Modrá
  private secondaryColor: [number, number, number] = [75, 85, 99]; // Sivá
  private accentColor: [number, number, number] = [59, 130, 246]; // Modrá akcent
  private successColor: [number, number, number] = [34, 197, 94]; // Zelená
  private warningColor: [number, number, number] = [245, 158, 11]; // Oranžová

  /**
   * Bezpečné nastavenie fontu s fallback
   */
  private setFontSafely(font: string, style: string = 'normal') {
    try {
      this.doc.setFont(font, style);
    } catch (error) {
      console.warn(
        `⚠️ Warning: Could not set font ${font} ${style}, using helvetica:`,
        error
      );
      try {
        this.doc.setFont('helvetica', style);
      } catch (fallbackError) {
        console.warn('⚠️ Warning: Could not set fallback font, using default');
      }
    }
  }

  constructor() {
    this.doc = new jsPDF('p', 'mm', 'a4');
    this.pageWidth = this.doc.internal.pageSize.getWidth();
    this.pageHeight = this.doc.internal.pageSize.getHeight();

    // Nastavenie Unicode podpory pre diakritiku
    // jsPDF podporuje tieto fonty: 'helvetica', 'courier', 'times', 'symbol', 'zapfdingbats'
    // Používame 'helvetica' ako štandardný font
    this.setFontSafely('helvetica');
  }

  /**
   * Generovanie PDF protokolu s fotkami
   */
  async generateProtocolPDF(
    protocol: ProtocolData,
    options: PDFOptions = {}
  ): Promise<Blob> {
    const {
      includeImages = true,
      includeSignatures = true,
      imageQuality = 0.9,
      maxImageWidth = 80,
      maxImageHeight = 60,
    } = options;

    try {
      // Header
      this.addHeader(protocol);

      // Základné informácie
      this.addBasicInfo(protocol);

      // Stav vozidla
      this.addVehicleCondition(protocol);

      // Fotky vozidla
      if (
        includeImages &&
        protocol.vehicleImages &&
        protocol.vehicleImages.length > 0
      ) {
        await this.addVehicleImages(
          protocol.vehicleImages,
          maxImageWidth,
          maxImageHeight,
          imageQuality
        );
      }

      // Dokumenty
      if (
        includeImages &&
        protocol.documentImages &&
        protocol.documentImages.length > 0
      ) {
        await this.addDocumentImages(
          protocol.documentImages,
          maxImageWidth,
          maxImageHeight,
          imageQuality
        );
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
      if (
        includeSignatures &&
        protocol.signatures &&
        protocol.signatures.length > 0
      ) {
        await this.addSignatures(
          protocol.signatures,
          maxImageWidth,
          maxImageHeight,
          imageQuality
        );
      }

      // Footer
      this.addFooter(protocol);

      return this.doc.output('blob');
    } catch (error) {
      console.error('❌ Error generating PDF:', error);
      throw error;
    }
  }

  /**
   * Header s logom a názvom
   */
  private addHeader(protocol: ProtocolData) {
    // Pozadie pre header
    this.doc.setFillColor(...this.primaryColor);
    this.doc.rect(0, 0, this.pageWidth, 35, 'F');

    // Logo
    this.doc.setFillColor(255, 255, 255);
    this.doc.circle(25, 17.5, 8, 'F');
    this.doc.setFontSize(12);
    this.setFontSafely('helvetica', 'bold');
    this.doc.setTextColor(255, 255, 255);
    this.doc.text('BR', 25, 21, { align: 'center' });

    // Názov protokolu
    this.doc.setFontSize(16);
    this.setFontSafely('helvetica', 'bold');
    this.doc.setTextColor(255, 255, 255);
    const title =
      protocol.type === 'handover'
        ? 'PROTOKOL O PREVZATÍ VOZIDLA'
        : 'PROTOKOL O VRÁTENÍ VOZIDLA';
    this.doc.text(title, this.pageWidth / 2, 22, { align: 'center' });

    // Reset pozície
    this.currentY = 45;

    // Informácie o protokole
    this.doc.setFontSize(10);
    this.setFontSafely('helvetica', 'normal');
    this.doc.setTextColor(...this.secondaryColor);
    this.doc.text(
      `Číslo protokolu: ${protocol.id}`,
      this.margin,
      this.currentY
    );
    this.currentY += 6;

    this.doc.text(
      `Dátum: ${new Date(protocol.completedAt).toLocaleDateString('sk-SK')}`,
      this.margin,
      this.currentY
    );
    this.currentY += 6;

    this.doc.text(`Miesto: ${protocol.location}`, this.margin, this.currentY);
    this.currentY += 15;
  }

  /**
   * Základné informácie
   */
  private addBasicInfo(protocol: ProtocolData) {
    this.addSectionTitle('ZÁKLADNÉ INFORMÁCIE');

    const rental = protocol.rental;
    const vehicle = rental.vehicle || {};
    const customer = rental.customer || {};

    const basicInfo = [
      ['Číslo objednávky:', rental.orderNumber || 'N/A'],
      [
        'Vozidlo:',
        `${vehicle.brand || ''} ${vehicle.model || ''} (${vehicle.licensePlate || 'N/A'})`,
      ],
      ['Zákazník:', `${customer.name || ''} ${customer.surname || ''}`],
      ['Telefón:', customer.phone || 'N/A'],
      ['Email:', customer.email || 'N/A'],
      [
        'Dátum prenájmu:',
        `${new Date(rental.startDate).toLocaleDateString('sk-SK')} - ${new Date(rental.endDate).toLocaleDateString('sk-SK')}`,
      ],
      ['Cena:', `${rental.totalPrice} ${rental.currency || 'EUR'}`],
    ];

    // Layout s lepším rozložením
    basicInfo.forEach(([label, value], index) => {
      const row = Math.floor(index / 2);
      const col = index % 2;
      const x = col === 0 ? this.margin : this.margin + 85;
      const y = this.currentY + row * 7;

      this.doc.setFontSize(10);
      this.setFontSafely('helvetica', 'bold');
      this.doc.setTextColor(...this.primaryColor);
      this.doc.text(label, x, y);

      this.setFontSafely('helvetica', 'normal');
      this.doc.setTextColor(...this.secondaryColor);
      this.doc.text(value, x + 50, y);
    });

    this.currentY += Math.ceil(basicInfo.length / 2) * 7 + 10;
  }

  /**
   * Stav vozidla
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

    // Layout s lepším rozložením
    vehicleInfo.forEach(([label, value], index) => {
      const row = Math.floor(index / 2);
      const col = index % 2;
      const x = col === 0 ? this.margin : this.margin + 85;
      const y = this.currentY + row * 7;

      this.doc.setFontSize(10);
      this.setFontSafely('helvetica', 'bold');
      this.doc.setTextColor(...this.primaryColor);
      this.doc.text(label, x, y);

      this.setFontSafely('helvetica', 'normal');
      this.doc.setTextColor(...this.secondaryColor);
      this.doc.text(value, x + 50, y);
    });

    this.currentY += Math.ceil(vehicleInfo.length / 2) * 7 + 10;
  }

  /**
   * Pridanie fotiek vozidla
   */
  private async addVehicleImages(
    images: any[],
    maxWidth: number,
    maxHeight: number,
    quality: number
  ) {
    this.addSectionTitle('FOTODOKUMENTÁCIA VOZIDLA');

    if (images.length === 0) {
      this.doc.setFontSize(10);
      this.doc.setTextColor(128, 128, 128);
      this.doc.text(
        'Žiadne fotky nie sú k dispozícii',
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

      try {
        let imgData: string;
        try {
          imgData = await this.loadImageFromUrl(image.url);
        } catch (error) {
          console.warn('⚠️ CORS error, trying proxy approach:', image.url);
          imgData = this.createImagePlaceholder(
            maxWidth,
            maxHeight,
            `Fotka ${i + 1}`
          );
        }

        const { width, height } = await this.calculateImageDimensions(
          imgData,
          maxWidth,
          maxHeight
        );

        // Kontrola či sa zmestí na stránku
        if (this.currentY + height + 15 > this.pageHeight - 30) {
          this.doc.addPage();
          this.currentY = 30;
          currentX = this.margin;
          rowHeight = 0;
          imagesInRow = 0;
        }

        // Pridanie obrázka
        this.doc.addImage(
          imgData,
          'JPEG',
          currentX,
          this.currentY,
          width,
          height
        );

        // Popis obrázka
        this.doc.setFontSize(8);
        this.setFontSafely('helvetica', 'bold');
        this.doc.setTextColor(...this.primaryColor);
        this.doc.text(`Fotka ${i + 1}`, currentX, this.currentY + height + 3);

        // URL link pod obrázkom (kratší)
        if (image.url) {
          const urlText = image.url;
          const encodedUrl = urlText.replace(/\s/g, '%20');

          this.doc.setFontSize(4);
          this.setFontSafely('helvetica', 'normal');
          this.doc.setTextColor(...this.accentColor);

          // Skrátený URL pre zobrazenie pod fotkou
          const shortUrl =
            encodedUrl.length > 50
              ? encodedUrl.substring(0, 50) + '...'
              : encodedUrl;

          if (this.doc.getTextWidth(shortUrl) > width) {
            this.doc.setFontSize(3);
          }

          this.doc.text(shortUrl, currentX, this.currentY + height + 6);
        }

        currentX += width + 15; // Zväčšený spacing medzi obrázkami
        rowHeight = Math.max(rowHeight, height + 20); // Zväčšený row height pre URL
        imagesInRow++;

        if (imagesInRow >= imagesPerRow) {
          this.currentY += rowHeight;
          currentX = this.margin;
          rowHeight = 0;
          imagesInRow = 0;
        }
      } catch (error) {
        console.error('❌ Error processing image:', image.url, error);
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

    // Pridanie URL na novú stranu
    if (images.length > 0) {
      this.addImageUrlsPage(images);
    }
  }

  /**
   * Pridanie dokumentov
   */
  private async addDocumentImages(
    images: any[],
    maxWidth: number,
    maxHeight: number,
    quality: number
  ) {
    this.addSectionTitle('DOKUMENTY');

    if (images.length === 0) {
      this.doc.setFontSize(10);
      this.doc.setTextColor(128, 128, 128);
      this.doc.text(
        'Žiadne dokumenty nie sú k dispozícii',
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

      try {
        let imgData: string;
        try {
          imgData = await this.loadImageFromUrl(image.url);
        } catch (error) {
          console.warn('⚠️ CORS error, trying proxy approach:', image.url);
          imgData = this.createImagePlaceholder(
            maxWidth,
            maxHeight,
            `Dokument ${i + 1}`
          );
        }

        const { width, height } = await this.calculateImageDimensions(
          imgData,
          maxWidth,
          maxHeight
        );

        if (this.currentY + height + 15 > this.pageHeight - 30) {
          this.doc.addPage();
          this.currentY = 30;
          currentX = this.margin;
          rowHeight = 0;
          imagesInRow = 0;
        }

        this.doc.addImage(
          imgData,
          'JPEG',
          currentX,
          this.currentY,
          width,
          height
        );

        this.doc.setFontSize(8);
        this.setFontSafely('helvetica', 'bold');
        this.doc.setTextColor(...this.primaryColor);
        this.doc.text(
          `Dokument ${i + 1}`,
          currentX,
          this.currentY + height + 3
        );

        if (image.url) {
          const urlText = image.url;
          const encodedUrl = urlText.replace(/\s/g, '%20');

          this.doc.setFontSize(4);
          this.setFontSafely('helvetica', 'normal');
          this.doc.setTextColor(...this.accentColor);

          if (this.doc.getTextWidth(encodedUrl) > width) {
            this.doc.setFontSize(3);
          }

          this.doc.text(encodedUrl, currentX, this.currentY + height + 6);
        }

        currentX += width + 15; // Zväčšený spacing medzi obrázkami
        rowHeight = Math.max(rowHeight, height + 20); // Zväčšený row height pre URL
        imagesInRow++;

        if (imagesInRow >= imagesPerRow) {
          this.currentY += rowHeight;
          currentX = this.margin;
          rowHeight = 0;
          imagesInRow = 0;
        }
      } catch (error) {
        console.error('❌ Error processing document:', image.url, error);
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
   * Pridanie škôd
   */
  private addDamages(damages: any[]) {
    this.addSectionTitle('ŠKODY A POŠKODENIA');

    if (damages.length === 0) {
      this.doc.setFontSize(10);
      this.doc.setTextColor(128, 128, 128);
      this.doc.text(
        'Žiadne škody nie sú zaznamenané',
        this.margin,
        this.currentY
      );
      this.currentY += 10;
      return;
    }

    damages.forEach((damage, index) => {
      this.doc.setFontSize(10);
      this.setFontSafely('helvetica', 'bold');
      this.doc.setTextColor(...this.warningColor);
      this.doc.text(`${index + 1}.`, this.margin, this.currentY);

      this.setFontSafely('helvetica', 'normal');
      this.doc.setTextColor(...this.secondaryColor);
      this.doc.text(
        damage.description || 'N/A',
        this.margin + 15,
        this.currentY
      );

      if (damage.location) {
        this.doc.setFontSize(8);
        this.doc.setTextColor(128, 128, 128);
        this.doc.text(
          `Lokácia: ${damage.location}`,
          this.margin + 15,
          this.currentY + 4
        );
        this.currentY += 8;
      } else {
        this.currentY += 6;
      }
    });

    this.currentY += 5;
  }

  /**
   * Pridanie poznámok
   */
  private addNotes(notes: string) {
    this.addSectionTitle('POZNÁMKY');

    this.doc.setFontSize(10);
    this.setFontSafely('helvetica', 'normal');
    this.doc.setTextColor(...this.secondaryColor);
    this.doc.text(notes, this.margin, this.currentY);

    this.currentY += 15;
  }

  /**
   * Pridanie podpisov
   */
  private async addSignatures(
    signatures: any[],
    maxWidth: number,
    maxHeight: number,
    quality: number
  ) {
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
    let signaturesInRow = 0;

    for (let i = 0; i < signatures.length; i++) {
      const signature = signatures[i];

      if (!signature.url && !signature.signature) {
        console.warn('⚠️ Signature without URL or base64 data:', signature);
        continue;
      }

      try {
        let imgData: string;

        if (signature.url) {
          try {
            imgData = await this.loadImageFromUrl(signature.url);
          } catch (error) {
            console.warn(
              '⚠️ CORS error, trying proxy approach:',
              signature.url
            );
            imgData = this.createImagePlaceholder(
              maxWidth,
              maxHeight,
              `Podpis ${i + 1}`
            );
          }
        } else if (
          signature.signature &&
          signature.signature.startsWith('data:image/')
        ) {
          imgData = signature.signature;
        } else {
          imgData = this.createImagePlaceholder(
            maxWidth,
            maxHeight,
            `Podpis ${i + 1}`
          );
        }

        const { width, height } = await this.calculateImageDimensions(
          imgData,
          maxWidth,
          maxHeight
        );

        if (this.currentY + height + 15 > this.pageHeight - 30) {
          this.doc.addPage();
          this.currentY = 30;
          currentX = this.margin;
          rowHeight = 0;
          signaturesInRow = 0;
        }

        this.doc.addImage(
          imgData,
          'JPEG',
          currentX,
          this.currentY,
          width,
          height
        );

        this.doc.setFontSize(8);
        this.setFontSafely('helvetica', 'bold');
        this.doc.setTextColor(...this.primaryColor);
        this.doc.text(`Podpis ${i + 1}`, currentX, this.currentY + height + 3);

        if (signature.url) {
          const urlText = signature.url;
          const encodedUrl = urlText.replace(/\s/g, '%20');

          this.doc.setFontSize(4);
          this.setFontSafely('helvetica', 'normal');
          this.doc.setTextColor(...this.accentColor);

          if (this.doc.getTextWidth(encodedUrl) > width) {
            this.doc.setFontSize(3);
          }

          this.doc.text(encodedUrl, currentX, this.currentY + height + 6);
        }

        currentX += width + 15; // Zväčšený spacing medzi podpismi
        rowHeight = Math.max(rowHeight, height + 20); // Zväčšený row height pre URL
        signaturesInRow++;

        if (signaturesInRow >= signaturesPerRow) {
          this.currentY += rowHeight;
          currentX = this.margin;
          rowHeight = 0;
          signaturesInRow = 0;
        }
      } catch (error) {
        console.error(
          '❌ Error processing signature:',
          signature.url || signature.signature,
          error
        );
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

    if (signaturesInRow > 0) {
      this.currentY += rowHeight;
    }

    this.currentY += 10;
  }

  /**
   * Footer
   */
  private addFooter(protocol: ProtocolData) {
    this.currentY = this.pageHeight - 25;

    // Čiara
    this.doc.setDrawColor(...this.primaryColor);
    this.doc.line(
      this.margin,
      this.currentY,
      this.pageWidth - this.margin,
      this.currentY
    );
    this.currentY += 5;

    this.doc.setFontSize(8);
    this.setFontSafely('helvetica', 'normal');
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
   * Názov sekcie
   */
  private addSectionTitle(title: string) {
    this.doc.setFontSize(12);
    this.setFontSafely('helvetica', 'bold');
    this.doc.setTextColor(...this.primaryColor);
    this.doc.text(title, this.margin, this.currentY);
    this.currentY += 8;

    // Čiara pod názvom
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
          const proxyUrl = `${import.meta.env.VITE_API_URL || 'https://blackrent-app-production-4d6f.up.railway.app/api'}/files/proxy/${encodeURIComponent(key)}`;

          console.log('🔄 Loading R2 image via proxy:', proxyUrl);

          fetch(proxyUrl)
            .then(response => {
              if (!response.ok) {
                throw new Error(
                  `HTTP ${response.status}: ${response.statusText}`
                );
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

    // Nastavenie veľkosti canvas
    canvas.width = width * 3.779527559; // Konverzia mm na px
    canvas.height = height * 3.779527559;

    // Pozadie
    ctx.fillStyle = '#f3f4f6';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Border
    ctx.strokeStyle = '#d1d5db';
    ctx.lineWidth = 2;
    ctx.strokeRect(1, 1, canvas.width - 2, canvas.height - 2);

    // Text
    ctx.fillStyle = '#6b7280';
    ctx.font = '14px Arial';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(text, canvas.width / 2, canvas.height / 2);

    return canvas.toDataURL('image/jpeg', 0.8);
  }

  /**
   * Výpočet rozmerov obrázka
   */
  private async calculateImageDimensions(
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

      img.onerror = () => {
        resolve({ width: maxWidth, height: maxHeight });
      };

      img.src = imgData;
    });
  }

  /**
   * Pridanie URL na novú stranu
   */
  private addImageUrlsPage(images: any[]) {
    this.doc.addPage();
    this.currentY = 30;

    this.addSectionTitle('LINKY NA FOTKY');

    this.doc.setFontSize(10);
    this.setFontSafely('helvetica', 'normal');
    this.doc.setTextColor(...this.secondaryColor);

    images.forEach((image, index) => {
      if (image.url) {
        const urlText = image.url;
        const encodedUrl = urlText.replace(/\s/g, '%20');

        // Číslo fotky
        this.doc.setFontSize(10);
        this.setFontSafely('helvetica', 'bold');
        this.doc.setTextColor(...this.primaryColor);
        this.doc.text(`${index + 1}.`, this.margin, this.currentY);

        // URL
        this.setFontSafely('helvetica', 'normal');
        this.doc.setTextColor(...this.accentColor);
        this.doc.setFontSize(8);

        // Kontrola či sa zmestí na stránku
        if (this.currentY > this.pageHeight - 30) {
          this.doc.addPage();
          this.currentY = 30;
        }

        // Rozdelenie dlhého URL na viac riadkov
        const maxWidth = this.pageWidth - this.margin * 2 - 20; // 20mm pre číslo
        const words = encodedUrl.split('/');
        let currentLine = '';
        let lineY = this.currentY;

        for (const word of words) {
          const testLine = currentLine + (currentLine ? '/' : '') + word;
          if (this.doc.getTextWidth(testLine) > maxWidth) {
            if (currentLine) {
              this.doc.text(currentLine, this.margin + 20, lineY);
              lineY += 4;
              currentLine = word;
            } else {
              this.doc.text(word, this.margin + 20, lineY);
              lineY += 4;
            }
          } else {
            currentLine = testLine;
          }
        }

        if (currentLine) {
          this.doc.text(currentLine, this.margin + 20, lineY);
        }

        this.currentY = lineY + 8;
      }
    });
  }
}

export const generateProtocolPDF = async (
  protocol: ProtocolData,
  options: PDFOptions = {}
): Promise<Blob> => {
  const generator = new PDFGenerator();
  return await generator.generateProtocolPDF(protocol, options);
};

export default PDFGenerator;
