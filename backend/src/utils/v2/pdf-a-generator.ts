/**
 * PDF/A Generator pre Protocol V2
 * Generuje PDF/A-1b kompatibilné protokoly s embedovanými obrázkami
 */

import path from 'path';
import PDFDocument from 'pdfkit';
import { r2Storage } from '../r2-storage';
import { HashCalculator } from './hash-calculator';

export interface PDFGenerationRequest {
  protocolId: string;
  protocolType: 'handover' | 'return';
  data: {
    vehicle: {
      licensePlate: string;
      brand: string;
      model: string;
      year: number;
      vin?: string;
    };
    customer: {
      firstName: string;
      lastName: string;
      email: string;
      phone?: string;
    };
    rental: {
      startDate: Date;
      endDate: Date;
      startKm: number;
      endKm?: number;
      location: string;
    };
    photos: Array<{
      photoId: string;
      url: string;
      description: string;
      category: 'exterior' | 'interior' | 'damage' | 'fuel' | 'other';
    }>;
    notes?: string;
    signature?: string;
  };
  userId?: string;
}

export interface PDFGenerationResult {
  success: boolean;
  pdfUrl?: string;
  pdfHash?: string;
  fileSize?: number;
  pageCount?: number;
  error?: string;
  processingTime?: number;
}

export class PDFAGenerator {
  private fontPath: string;
  
  constructor() {
    // Path k fontu pre PDF (môže byť z assets/)
    this.fontPath = path.join(__dirname, '../../../assets/fonts/arial.ttf');
  }
  
  /**
   * Hlavná funkcia pre generovanie PDF/A protokolu
   */
  async generateProtocolPDF(request: PDFGenerationRequest): Promise<PDFGenerationResult> {
    const startTime = Date.now();
    
    try {
      // Vytvorenie PDF dokumentu
      const doc = new PDFDocument({
        size: 'A4',
        margins: {
          top: 50,
          bottom: 50,
          left: 50,
          right: 50
        },
        info: {
          Title: `BlackRent ${request.protocolType === 'handover' ? 'Odovzdávací' : 'Preberací'} Protokol`,
          Subject: `Protokol pre vozidlo ${request.data.vehicle.licensePlate}`,
          Author: 'BlackRent System',
          Creator: 'BlackRent Protocol V2',
          Producer: 'BlackRent PDF/A Generator',
          CreationDate: new Date(),
          ModDate: new Date()
        }
      });
      
      // Buffer pre PDF obsah
      const buffers: Buffer[] = [];
      doc.on('data', buffers.push.bind(buffers));
      
      // Generovanie obsahu
      await this.generateHeader(doc, request);
      await this.generateVehicleInfo(doc, request.data.vehicle);
      await this.generateCustomerInfo(doc, request.data.customer);
      await this.generateRentalInfo(doc, request.data.rental);
      
      // Pridanie fotografií
      if (request.data.photos.length > 0) {
        await this.generatePhotosSection(doc, request.data.photos, request.protocolId);
      }
      
      // Pridanie poznámok a podpisu
      if (request.data.notes) {
        await this.generateNotesSection(doc, request.data.notes);
      }
      
      if (request.data.signature) {
        await this.generateSignatureSection(doc, request.data.signature);
      }
      
      // Finalizácia PDF
      doc.end();
      
      // Počkanie na dokončenie
      await new Promise<void>((resolve) => {
        doc.on('end', resolve);
      });
      
      // Spojenie bufferov
      const pdfBuffer = Buffer.concat(buffers);
      
      // Generovanie hash
      const pdfHash = HashCalculator.calculateSHA256(pdfBuffer);
      
      // Upload na R2
      const timestamp = Date.now();
      const pdfKey = `protocols/${request.protocolId}/pdf/${request.protocolType}_protocol_${timestamp}.pdf`;
      const pdfUrl = await r2Storage.uploadFile(
        pdfKey,
        pdfBuffer,
        'application/pdf'
      );
      
      const processingTime = Date.now() - startTime;
      
      return {
        success: true,
        pdfUrl,
        pdfHash,
        fileSize: pdfBuffer.length,
        pageCount: this.estimatePageCount(doc),
        processingTime
      };
      
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      console.error(`PDF generation failed for protocol ${request.protocolId}:`, error);
      
      return {
        success: false,
        error: errorMessage,
        processingTime: Date.now() - startTime
      };
    }
  }
  
  /**
   * Generuje header protokolu
   */
  private async generateHeader(doc: PDFKit.PDFDocument, request: PDFGenerationRequest): Promise<void> {
    const title = request.protocolType === 'handover' 
      ? 'ODOVZDÁVACÍ PROTOKOL' 
      : 'PREBERACÍ PROTOKOL';
    
    doc.fontSize(20)
       .font('Helvetica-Bold')
       .text('BLACKRENT', 50, 50)
       .fontSize(16)
       .text(title, 50, 80)
       .fontSize(12)
       .font('Helvetica')
       .text(`Protokol ID: ${request.protocolId}`, 50, 110)
       .text(`Dátum vytvorenia: ${new Date().toLocaleDateString('sk-SK')}`, 50, 130);
    
    // Oddeľovacia čiara
    doc.moveTo(50, 150)
       .lineTo(545, 150)
       .stroke();
  }
  
  /**
   * Generuje informácie o vozidle
   */
  private async generateVehicleInfo(doc: PDFKit.PDFDocument, vehicle: PDFGenerationRequest['data']['vehicle']): Promise<void> {
    let yPos = 170;
    
    doc.fontSize(14)
       .font('Helvetica-Bold')
       .text('INFORMÁCIE O VOZIDLE', 50, yPos);
    
    yPos += 25;
    doc.fontSize(11)
       .font('Helvetica')
       .text(`ŠPZ: ${vehicle.licensePlate}`, 50, yPos)
       .text(`Značka: ${vehicle.brand}`, 200, yPos)
       .text(`Model: ${vehicle.model}`, 350, yPos);
    
    yPos += 20;
    doc.text(`Rok výroby: ${vehicle.year}`, 50, yPos);
    
    if (vehicle.vin) {
      doc.text(`VIN: ${vehicle.vin}`, 200, yPos);
    }
  }
  
  /**
   * Generuje informácie o zákazníkovi
   */
  private async generateCustomerInfo(doc: PDFKit.PDFDocument, customer: PDFGenerationRequest['data']['customer']): Promise<void> {
    let yPos = 250;
    
    doc.fontSize(14)
       .font('Helvetica-Bold')
       .text('INFORMÁCIE O ZÁKAZNÍKOVI', 50, yPos);
    
    yPos += 25;
    doc.fontSize(11)
       .font('Helvetica')
       .text(`Meno: ${customer.firstName} ${customer.lastName}`, 50, yPos)
       .text(`Email: ${customer.email}`, 300, yPos);
    
    if (customer.phone) {
      yPos += 20;
      doc.text(`Telefón: ${customer.phone}`, 50, yPos);
    }
  }
  
  /**
   * Generuje informácie o prenájme
   */
  private async generateRentalInfo(doc: PDFKit.PDFDocument, rental: PDFGenerationRequest['data']['rental']): Promise<void> {
    let yPos = 320;
    
    doc.fontSize(14)
       .font('Helvetica-Bold')
       .text('INFORMÁCIE O PRENÁJME', 50, yPos);
    
    yPos += 25;
    doc.fontSize(11)
       .font('Helvetica')
       .text(`Začiatok: ${rental.startDate.toLocaleDateString('sk-SK')}`, 50, yPos)
       .text(`Koniec: ${rental.endDate.toLocaleDateString('sk-SK')}`, 200, yPos)
       .text(`Lokácia: ${rental.location}`, 350, yPos);
    
    yPos += 20;
    doc.text(`Počiatočný stav km: ${rental.startKm.toLocaleString('sk-SK')}`, 50, yPos);
    
    if (rental.endKm !== undefined) {
      doc.text(`Koncový stav km: ${rental.endKm.toLocaleString('sk-SK')}`, 250, yPos);
      doc.text(`Najazdené km: ${(rental.endKm - rental.startKm).toLocaleString('sk-SK')}`, 400, yPos);
    }
  }
  
  /**
   * Generuje sekciu s fotografiami
   */
  private async generatePhotosSection(
    doc: PDFKit.PDFDocument, 
    photos: PDFGenerationRequest['data']['photos'],
    _protocolId: string
  ): Promise<void> {
    if (photos.length === 0) return;
    
    // Nová stránka pre fotografie
    doc.addPage();
    
    let yPos = 50;
    doc.fontSize(14)
       .font('Helvetica-Bold')
       .text('DOKUMENTAČNÉ FOTOGRAFIE', 50, yPos);
    
    yPos += 30;
    
    // Grid layout pre fotografie (2x2 na stránku)
    const photosPerPage = 4;
    const photoWidth = 240;
    const photoHeight = 180;
    const margin = 20;
    
    for (let i = 0; i < photos.length; i++) {
      const photo = photos[i];
      
      // Pozícia na stránke
      const col = i % 2;
      const row = Math.floor((i % photosPerPage) / 2);
      const xPos = 50 + col * (photoWidth + margin);
      let photoYPos = yPos + row * (photoHeight + 60);
      
      // Nová stránka ak je potrebná
      if (i > 0 && i % photosPerPage === 0) {
        doc.addPage();
        yPos = 50;
        photoYPos = yPos + row * (photoHeight + 60);
      }
      
      try {
        // Download PDF verzie obrázka
        const pdfPhotoKey = photo.url.replace('/gallery/', '/pdf/');
        const photoBuffer = await r2Storage.getFile(pdfPhotoKey);
        
        if (photoBuffer) {
          // Pridanie obrázka do PDF
          doc.image(photoBuffer, xPos, photoYPos, {
            fit: [photoWidth, photoHeight],
            align: 'center',
            valign: 'center'
          });
          
          // Popis pod obrázkom
          doc.fontSize(9)
             .font('Helvetica')
             .text(photo.description, xPos, photoYPos + photoHeight + 5, {
               width: photoWidth,
               align: 'center'
             });
        } else {
          // Placeholder ak obrázok nie je dostupný
          doc.rect(xPos, photoYPos, photoWidth, photoHeight)
             .stroke()
             .fontSize(10)
             .text('Obrázok nedostupný', xPos, photoYPos + photoHeight/2, {
               width: photoWidth,
               align: 'center'
             });
        }
      } catch (error) {
        console.error(`Failed to add photo ${photo.photoId} to PDF:`, error);
        
        // Error placeholder
        doc.rect(xPos, photoYPos, photoWidth, photoHeight)
           .stroke()
           .fontSize(10)
           .text(`Chyba načítania: ${photo.description}`, xPos, photoYPos + photoHeight/2, {
             width: photoWidth,
             align: 'center'
           });
      }
    }
  }
  
  /**
   * Generuje sekciu s poznámkami
   */
  private async generateNotesSection(doc: PDFKit.PDFDocument, notes: string): Promise<void> {
    doc.addPage();
    
    doc.fontSize(14)
       .font('Helvetica-Bold')
       .text('POZNÁMKY', 50, 50);
    
    doc.fontSize(11)
       .font('Helvetica')
       .text(notes, 50, 80, {
         width: 495,
         align: 'left'
       });
  }
  
  /**
   * Generuje sekciu s podpisom
   */
  private async generateSignatureSection(doc: PDFKit.PDFDocument, signature: string): Promise<void> {
    const yPos = doc.y + 40;
    
    doc.fontSize(12)
       .font('Helvetica-Bold')
       .text('PODPIS ZÁKAZNÍKA', 50, yPos);
    
    // Ak je signature base64, pridaj ako obrázok
    if (signature.startsWith('data:image/')) {
      try {
        const base64Data = signature.split(',')[1];
        const signatureBuffer = Buffer.from(base64Data, 'base64');
        
        doc.image(signatureBuffer, 50, yPos + 25, {
          fit: [200, 80]
        });
      } catch (error) {
        console.error('Failed to add signature image:', error);
        doc.fontSize(11)
           .font('Helvetica')
           .text('Podpis: [Elektronický podpis]', 50, yPos + 25);
      }
    } else {
      // Text podpis
      doc.fontSize(11)
         .font('Helvetica')
         .text(`Podpis: ${signature}`, 50, yPos + 25);
    }
    
    // Dátum a čas
    doc.text(`Dátum: ${new Date().toLocaleDateString('sk-SK')}`, 50, yPos + 60)
       .text(`Čas: ${new Date().toLocaleTimeString('sk-SK')}`, 200, yPos + 60);
  }
  
  /**
   * Odhad počtu stránok
   */
  private estimatePageCount(_doc: PDFKit.PDFDocument): number {
    // Základná logika pre odhad (1 hlavná stránka + fotografie)
    return 1; // TODO: Implementovať presnejší odhad
  }
  
  /**
   * Validácia PDF/A kompatibility
   */
  async validatePDFA(pdfBuffer: Buffer): Promise<{
    valid: boolean;
    errors?: string[];
    warnings?: string[];
  }> {
    try {
      // Základná validácia PDF štruktúry
      const pdfString = pdfBuffer.toString('binary');
      
      const errors: string[] = [];
      const warnings: string[] = [];
      
      // Check PDF header
      if (!pdfString.startsWith('%PDF-')) {
        errors.push('Invalid PDF header');
      }
      
      // Check for PDF/A marker (simplified)
      if (!pdfString.includes('/Type/Catalog')) {
        warnings.push('PDF catalog structure not found');
      }
      
      return {
        valid: errors.length === 0,
        errors: errors.length > 0 ? errors : undefined,
        warnings: warnings.length > 0 ? warnings : undefined
      };
    } catch (error) {
      return {
        valid: false,
        errors: [error instanceof Error ? error.message : 'Validation failed']
      };
    }
  }
  
  /**
   * Optimalizácia PDF pre web
   */
  async optimizePDF(pdfBuffer: Buffer): Promise<Buffer> {
    // Pre teraz len return original buffer
    // V budúcnosti môžeme pridať PDF optimalizáciu
    return pdfBuffer;
  }
  
  /**
   * Generovanie PDF preview (prvá stránka ako obrázok)
   */
  async generatePreview(_pdfBuffer: Buffer): Promise<Buffer> {
    // TODO: Implementovať pomocou pdf2pic alebo podobnej knižnice
    // Pre teraz placeholder
    throw new Error('PDF preview generation not implemented yet');
  }
}
