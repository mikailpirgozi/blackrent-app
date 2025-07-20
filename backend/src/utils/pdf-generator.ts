import PDFDocument from 'pdfkit';
import { HandoverProtocol, ReturnProtocol } from '../types';

export class ProtocolPDFGenerator {
  private doc: InstanceType<typeof PDFDocument>;

  constructor() {
    this.doc = new PDFDocument({
      size: 'A4',
      margin: 50,
      info: {
        Title: 'BlackRent - Protokol',
        Author: 'BlackRent System',
        Subject: 'Protokol prevzatia/vrátenia vozidla',
        Keywords: 'protokol, vozidlo, prenájom',
        CreationDate: new Date(),
      }
    });
  }

  // Generovanie handover protokolu
  generateHandoverProtocol(protocol: HandoverProtocol): InstanceType<typeof PDFDocument> {
    this.setupHeader('PROTOKOL PREVZATIA VOZIDLA');
    
    // Základné informácie
    this.addSection('Základné informácie');
    this.addInfoRow('Číslo protokolu:', protocol.id.slice(-8).toUpperCase());
    this.addInfoRow('Dátum vytvorenia:', new Date(protocol.createdAt).toLocaleDateString('sk-SK'));
    this.addInfoRow('Miesto prevzatia:', protocol.location);
    this.addInfoRow('Stav protokolu:', this.getStatusText(protocol.status));
    
    // Informácie o prenájme
    if (protocol.rentalData) {
      this.addSection('Informácie o prenájme');
      this.addInfoRow('Číslo objednávky:', protocol.rentalData.orderNumber || 'N/A');
      this.addInfoRow('Zákazník:', protocol.rentalData.customer?.name || 'N/A');
      this.addInfoRow('Dátum od:', new Date(protocol.rentalData.startDate).toLocaleDateString('sk-SK'));
      this.addInfoRow('Dátum do:', new Date(protocol.rentalData.endDate).toLocaleDateString('sk-SK'));
      this.addInfoRow('Celková cena:', `${protocol.rentalData.totalPrice} ${protocol.rentalData.currency}`);
      this.addInfoRow('Záloha:', `${protocol.rentalData.deposit} ${protocol.rentalData.currency}`);
    }
    
    // Informácie o vozidle
    if (protocol.rentalData?.vehicle) {
      this.addSection('Informácie o vozidle');
      this.addInfoRow('Značka:', protocol.rentalData.vehicle.brand || 'N/A');
      this.addInfoRow('Model:', protocol.rentalData.vehicle.model || 'N/A');
      this.addInfoRow('ŠPZ:', protocol.rentalData.vehicle.licensePlate || 'N/A');
    }
    
    // Stav vozidla
    this.addSection('Stav vozidla pri prevzatí');
    this.addInfoRow('Stav tachometra:', `${protocol.vehicleCondition.odometer} km`);
    this.addInfoRow('Úroveň paliva:', `${protocol.vehicleCondition.fuelLevel}%`);
    this.addInfoRow('Typ paliva:', protocol.vehicleCondition.fuelType);
    this.addInfoRow('Exteriér:', protocol.vehicleCondition.exteriorCondition);
    this.addInfoRow('Interiér:', protocol.vehicleCondition.interiorCondition);
    
    if (protocol.vehicleCondition.notes) {
      this.addInfoRow('Poznámky:', protocol.vehicleCondition.notes);
    }
    
    // Poškodenia
    if (protocol.damages && protocol.damages.length > 0) {
      this.addSection('Zaznamenané poškodenia');
      protocol.damages.forEach((damage, index) => {
        this.addInfoRow(`Poškodenie ${index + 1}:`, `${damage.description} (${damage.severity})`);
      });
    }
    
    // Media súbory
    this.addSection('Priložené súbory');
    const totalImages = (protocol.vehicleImages?.length || 0) + 
                       (protocol.documentImages?.length || 0) + 
                       (protocol.damageImages?.length || 0);
    const totalVideos = protocol.vehicleVideos?.length || 0;
    
    this.addInfoRow('Počet fotiek:', totalImages.toString());
    this.addInfoRow('Počet videí:', totalVideos.toString());
    
    // Zobrazenie fotiek
    if (totalImages > 0) {
      this.addSection('Fotodokumentácia');
      
      // Vozidlo fotky
      if (protocol.vehicleImages && protocol.vehicleImages.length > 0) {
        this.doc.fontSize(12).font('Helvetica-Bold').text('Fotky vozidla:', { continued: true });
        this.doc.fontSize(10).font('Helvetica').text(` ${protocol.vehicleImages.length} fotiek`);
        this.doc.moveDown(0.5);
        
        // Zobrazenie prvých 3 fotiek ako thumbnail
        const imagesToShow = protocol.vehicleImages.slice(0, 3);
        for (let i = 0; i < imagesToShow.length; i++) {
          const image = imagesToShow[i];
          try {
            // Konvertuj base64 na buffer
            const imageBuffer = Buffer.from(image.url.split(',')[1], 'base64');
            
            // Pridaj obrázok do PDF
            this.doc.image(imageBuffer, {
              fit: [150, 100]
            });
            
            this.doc.fontSize(8).text(`${image.type || 'Vozidlo'} - ${new Date(image.timestamp).toLocaleString('sk-SK')}`, {
              align: 'center'
            });
            
            if (i < imagesToShow.length - 1) {
              this.doc.moveDown(0.5);
            }
          } catch (error) {
            console.error('Chyba pri vkladaní obrázka do PDF:', error);
            this.doc.fontSize(8).text(`Chyba pri načítaní obrázka ${i + 1}`, { align: 'center' });
          }
        }
        
        if (protocol.vehicleImages.length > 3) {
          this.doc.fontSize(8).text(`... a ďalších ${protocol.vehicleImages.length - 3} fotiek`, { align: 'center' });
        }
        this.doc.moveDown(1);
      }
      
      // Doklady fotky
      if (protocol.documentImages && protocol.documentImages.length > 0) {
        this.doc.fontSize(12).font('Helvetica-Bold').text('Fotky dokladov:', { continued: true });
        this.doc.fontSize(10).font('Helvetica').text(` ${protocol.documentImages.length} fotiek`);
        this.doc.moveDown(0.5);
      }
      
      // Poškodenia fotky
      if (protocol.damageImages && protocol.damageImages.length > 0) {
        this.doc.fontSize(12).font('Helvetica-Bold').text('Fotky poškodení:', { continued: true });
        this.doc.fontSize(10).font('Helvetica').text(` ${protocol.damageImages.length} fotiek`);
        this.doc.moveDown(0.5);
      }
    }
    
    // Podpisy
    if (protocol.signatures && protocol.signatures.length > 0) {
      this.addSection('Podpisy');
      protocol.signatures.forEach((signature, index) => {
        this.addInfoRow(`Podpis ${index + 1}:`, `${signature.signerName} (${signature.signerRole})`);
        this.addInfoRow(`Časová pečiatka:`, new Date(signature.timestamp).toLocaleString('sk-SK'));
        this.addInfoRow(`Miesto:`, signature.location);
        
                  // Pridaj obrázok podpisu
          try {
            const signatureBuffer = Buffer.from(signature.signature.split(',')[1], 'base64');
            this.doc.image(signatureBuffer, {
              fit: [200, 80]
            });
            this.doc.moveDown(0.5);
          } catch (error) {
            console.error('Chyba pri vkladaní podpisu do PDF:', error);
            this.doc.fontSize(8).text('Chyba pri načítaní podpisu', { align: 'center' });
          }
      });
    }
    
    // Poznámky
    if (protocol.notes) {
      this.addSection('Poznámky');
      this.doc.text(protocol.notes, { width: 500 });
    }
    
    this.addFooter();
    return this.doc;
  }

  // Generovanie return protokolu
  generateReturnProtocol(protocol: ReturnProtocol): InstanceType<typeof PDFDocument> {
    this.setupHeader('PROTOKOL VRÁTENIA VOZIDLA');
    
    // Základné informácie
    this.addSection('Základné informácie');
    this.addInfoRow('Číslo protokolu:', protocol.id.slice(-8).toUpperCase());
    this.addInfoRow('Dátum vytvorenia:', new Date(protocol.createdAt).toLocaleDateString('sk-SK'));
    this.addInfoRow('Miesto vrátenia:', protocol.location);
    this.addInfoRow('Stav protokolu:', this.getStatusText(protocol.status));
    
    // Informácie o prenájme
    if (protocol.rentalData) {
      this.addSection('Informácie o prenájme');
      this.addInfoRow('Číslo objednávky:', protocol.rentalData.orderNumber || 'N/A');
      this.addInfoRow('Zákazník:', protocol.rentalData.customer?.name || 'N/A');
      this.addInfoRow('Dátum od:', new Date(protocol.rentalData.startDate).toLocaleDateString('sk-SK'));
      this.addInfoRow('Dátum do:', new Date(protocol.rentalData.endDate).toLocaleDateString('sk-SK'));
      this.addInfoRow('Celková cena:', `${protocol.rentalData.totalPrice} ${protocol.rentalData.currency}`);
      this.addInfoRow('Záloha:', `${protocol.rentalData.deposit} ${protocol.rentalData.currency}`);
    }
    
    // Informácie o vozidle
    if (protocol.rentalData?.vehicle) {
      this.addSection('Informácie o vozidle');
      this.addInfoRow('Značka:', protocol.rentalData.vehicle.brand || 'N/A');
      this.addInfoRow('Model:', protocol.rentalData.vehicle.model || 'N/A');
      this.addInfoRow('ŠPZ:', protocol.rentalData.vehicle.licensePlate || 'N/A');
    }
    
    // Stav vozidla pri vrátení
    this.addSection('Stav vozidla pri vrátení');
    this.addInfoRow('Stav tachometra:', `${protocol.vehicleCondition.odometer} km`);
    this.addInfoRow('Úroveň paliva:', `${protocol.vehicleCondition.fuelLevel}%`);
    this.addInfoRow('Typ paliva:', protocol.vehicleCondition.fuelType);
    this.addInfoRow('Exteriér:', protocol.vehicleCondition.exteriorCondition);
    this.addInfoRow('Interiér:', protocol.vehicleCondition.interiorCondition);
    
    // Výpočty
    this.addSection('Výpočty a poplatky');
    this.addInfoRow('Najazdené km:', `${protocol.kilometersUsed} km`);
    this.addInfoRow('Prekročenie km:', `${protocol.kilometerOverage} km`);
    this.addInfoRow('Poplatok za km:', `${protocol.kilometerFee.toFixed(2)} EUR`);
    this.addInfoRow('Spotrebované palivo:', `${protocol.fuelUsed}%`);
    this.addInfoRow('Poplatok za palivo:', `${protocol.fuelFee.toFixed(2)} EUR`);
    this.addInfoRow('Celkové poplatky:', `${protocol.totalExtraFees.toFixed(2)} EUR`);
    this.addInfoRow('Vrátenie zálohy:', `${protocol.depositRefund.toFixed(2)} EUR`);
    this.addInfoRow('Dodatočné poplatky:', `${protocol.additionalCharges.toFixed(2)} EUR`);
    this.addInfoRow('Finálny refund:', `${protocol.finalRefund.toFixed(2)} EUR`);
    
    // Nové poškodenia
    if (protocol.newDamages && protocol.newDamages.length > 0) {
      this.addSection('Nové poškodenia zistené pri vrátení');
      protocol.newDamages.forEach((damage, index) => {
        this.addInfoRow(`Poškodenie ${index + 1}:`, `${damage.description} (${damage.severity})`);
      });
    }
    
    // Media súbory
    this.addSection('Priložené súbory');
    const totalImages = (protocol.vehicleImages?.length || 0) + 
                       (protocol.documentImages?.length || 0) + 
                       (protocol.damageImages?.length || 0);
    const totalVideos = protocol.vehicleVideos?.length || 0;
    
    this.addInfoRow('Počet fotiek:', totalImages.toString());
    this.addInfoRow('Počet videí:', totalVideos.toString());
    
    // Zobrazenie fotiek
    if (totalImages > 0) {
      this.addSection('Fotodokumentácia');
      
      // Vozidlo fotky
      if (protocol.vehicleImages && protocol.vehicleImages.length > 0) {
        this.doc.fontSize(12).font('Helvetica-Bold').text('Fotky vozidla:', { continued: true });
        this.doc.fontSize(10).font('Helvetica').text(` ${protocol.vehicleImages.length} fotiek`);
        this.doc.moveDown(0.5);
        
        // Zobrazenie prvých 3 fotiek ako thumbnail
        const imagesToShow = protocol.vehicleImages.slice(0, 3);
        for (let i = 0; i < imagesToShow.length; i++) {
          const image = imagesToShow[i];
          try {
            // Konvertuj base64 na buffer
            const imageBuffer = Buffer.from(image.url.split(',')[1], 'base64');
            
            // Pridaj obrázok do PDF
            this.doc.image(imageBuffer, {
              fit: [150, 100]
            });
            
            this.doc.fontSize(8).text(`${image.type || 'Vozidlo'} - ${new Date(image.timestamp).toLocaleString('sk-SK')}`, {
              align: 'center'
            });
            
            if (i < imagesToShow.length - 1) {
              this.doc.moveDown(0.5);
            }
          } catch (error) {
            console.error('Chyba pri vkladaní obrázka do PDF:', error);
            this.doc.fontSize(8).text(`Chyba pri načítaní obrázka ${i + 1}`, { align: 'center' });
          }
        }
        
        if (protocol.vehicleImages.length > 3) {
          this.doc.fontSize(8).text(`... a ďalších ${protocol.vehicleImages.length - 3} fotiek`, { align: 'center' });
        }
        this.doc.moveDown(1);
      }
      
      // Doklady fotky
      if (protocol.documentImages && protocol.documentImages.length > 0) {
        this.doc.fontSize(12).font('Helvetica-Bold').text('Fotky dokladov:', { continued: true });
        this.doc.fontSize(10).font('Helvetica').text(` ${protocol.documentImages.length} fotiek`);
        this.doc.moveDown(0.5);
      }
      
      // Poškodenia fotky
      if (protocol.damageImages && protocol.damageImages.length > 0) {
        this.doc.fontSize(12).font('Helvetica-Bold').text('Fotky poškodení:', { continued: true });
        this.doc.fontSize(10).font('Helvetica').text(` ${protocol.damageImages.length} fotiek`);
        this.doc.moveDown(0.5);
      }
    }
    
    // Podpisy
    if (protocol.signatures && protocol.signatures.length > 0) {
      this.addSection('Podpisy');
      protocol.signatures.forEach((signature, index) => {
        this.addInfoRow(`Podpis ${index + 1}:`, `${signature.signerName} (${signature.signerRole})`);
        this.addInfoRow(`Časová pečiatka:`, new Date(signature.timestamp).toLocaleString('sk-SK'));
        this.addInfoRow(`Miesto:`, signature.location);
        
        // Pridaj obrázok podpisu
        try {
          const signatureBuffer = Buffer.from(signature.signature.split(',')[1], 'base64');
          this.doc.image(signatureBuffer, {
            fit: [200, 80]
          });
          this.doc.moveDown(0.5);
        } catch (error) {
          console.error('Chyba pri vkladaní podpisu do PDF:', error);
          this.doc.fontSize(8).text('Chyba pri načítaní podpisu', { align: 'center' });
        }
      });
    }
    
    // Poznámky
    if (protocol.notes) {
      this.addSection('Poznámky');
      this.doc.text(protocol.notes, { width: 500 });
    }
    
    this.addFooter();
    return this.doc;
  }

  private setupHeader(title: string) {
    // Logo a názov
    this.doc
      .fontSize(24)
      .font('Helvetica-Bold')
      .text('BLACKRENT', { align: 'center' })
      .moveDown(0.5);
    
    this.doc
      .fontSize(18)
      .font('Helvetica-Bold')
      .text(title, { align: 'center' })
      .moveDown(2);
  }

  private addSection(title: string) {
    this.doc
      .fontSize(14)
      .font('Helvetica-Bold')
      .text(title)
      .moveDown(0.5);
  }

  private addInfoRow(label: string, value: string) {
    this.doc
      .fontSize(10)
      .font('Helvetica-Bold')
      .text(label, { continued: true })
      .font('Helvetica')
      .text(`: ${value}`)
      .moveDown(0.3);
  }

  private getStatusText(status: string): string {
    switch (status) {
      case 'draft': return 'Koncept';
      case 'completed': return 'Dokončený';
      case 'cancelled': return 'Zrušený';
      default: return status;
    }
  }

  private addFooter() {
    this.doc
      .moveDown(2)
      .fontSize(8)
      .font('Helvetica')
      .text('Dokument vygenerovaný automaticky systémom BlackRent', { align: 'center' })
      .text(`Vygenerované: ${new Date().toLocaleString('sk-SK')}`, { align: 'center' });
  }

  // Získanie PDF ako buffer
  getBuffer(): Promise<Buffer> {
    return new Promise((resolve, reject) => {
      const chunks: Buffer[] = [];
      
      this.doc.on('data', (chunk: Buffer) => chunks.push(chunk));
      this.doc.on('end', () => resolve(Buffer.concat(chunks)));
      this.doc.on('error', reject);
      
      this.doc.end();
    });
  }
}

// Export funkcie pre jednoduché použitie
export const generateHandoverPDF = async (protocol: HandoverProtocol): Promise<Buffer> => {
  const generator = new ProtocolPDFGenerator();
  generator.generateHandoverProtocol(protocol);
  return generator.getBuffer();
};

export const generateReturnPDF = async (protocol: ReturnProtocol): Promise<Buffer> => {
  const generator = new ProtocolPDFGenerator();
  generator.generateReturnProtocol(protocol);
  return generator.getBuffer();
}; 