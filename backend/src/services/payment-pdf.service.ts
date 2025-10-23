import PDFDocument from 'pdfkit';
import type { GeneratePDFParams } from '../types/payment-order.types';

/**
 * 📄 Payment PDF Service
 * 
 * Služba pre generovanie PDF platobných príkazov
 */
export class PaymentPDFService {
  /**
   * Generuje PDF platobný príkaz
   * 
   * @param params - Parametre pre PDF
   * @returns PDF ako Buffer
   */
  async generatePaymentOrderPDF(params: GeneratePDFParams): Promise<Buffer> {
    return new Promise((resolve, reject) => {
      try {
        const doc = new PDFDocument({
          size: 'A4',
          margin: 50,
          info: {
            Title: `Platobný príkaz - ${params.orderNumber}`,
            Author: 'BlackRent s.r.o.',
            Subject: `Platobný príkaz na úhradu ${params.type === 'rental' ? 'prenájmu' : 'depozitu'}`,
            Creator: 'BlackRent Payment System',
          },
        });

        const chunks: Buffer[] = [];

        doc.on('data', (chunk) => chunks.push(chunk));
        doc.on('end', () => resolve(Buffer.concat(chunks)));
        doc.on('error', reject);

        // ====================================================================
        // HEADER
        // ====================================================================
        
        doc
          .fontSize(24)
          .font('Helvetica-Bold')
          .fillColor('#1e40af')
          .text('Platobný príkaz', { align: 'center' });

        doc.moveDown(0.5);

        // Typ platby
        const typeLabel = params.type === 'rental' ? 'Úhrada prenájmu' : 'Úhrada depozitu';
        doc
          .fontSize(16)
          .fillColor('#6b7280')
          .text(typeLabel, { align: 'center' });

        doc.moveDown(2);

        // ====================================================================
        // ÚDAJE O PRENÁJME
        // ====================================================================

        doc
          .fontSize(14)
          .fillColor('#000000')
          .font('Helvetica-Bold')
          .text('Údaje o prenájme', { underline: true });

        doc.moveDown(0.5);

        doc.fontSize(12).font('Helvetica');

        const rentalInfo = [
          { label: 'Objednávka:', value: params.orderNumber },
          { label: 'Zákazník:', value: params.customerName },
          { label: 'Vozidlo:', value: params.vehicleName },
        ];

        rentalInfo.forEach((info) => {
          doc
            .fillColor('#6b7280')
            .text(info.label, { continued: true })
            .fillColor('#000000')
            .text(` ${info.value}`);
        });

        doc.moveDown(2);

        // ====================================================================
        // PLATOBNÉ ÚDAJE
        // ====================================================================

        doc
          .fontSize(14)
          .fillColor('#000000')
          .font('Helvetica-Bold')
          .text('Platobné údaje', { underline: true });

        doc.moveDown(0.5);

        // Suma - zvýraznená
        doc
          .fontSize(20)
          .fillColor('#16a34a')
          .font('Helvetica-Bold')
          .text(`${params.amount.toFixed(2)} EUR`);

        doc.moveDown(1);

        doc.fontSize(12).font('Helvetica');

        const paymentInfo = [
          { label: 'IBAN:', value: this.formatIBAN(params.iban) },
          { label: 'Banka:', value: params.bankName },
          { label: 'Variabilný symbol:', value: params.variableSymbol },
        ];

        if (params.message) {
          paymentInfo.push({ label: 'Správa:', value: params.message });
        }

        paymentInfo.forEach((info) => {
          doc
            .fillColor('#6b7280')
            .text(info.label, { continued: true })
            .fillColor('#000000')
            .text(` ${info.value}`);
        });

        doc.moveDown(2);

        // ====================================================================
        // QR KÓD
        // ====================================================================

        doc
          .fontSize(14)
          .fillColor('#000000')
          .font('Helvetica-Bold')
          .text('QR kód pre platbu', { underline: true });

        doc.moveDown(1);

        // Pridaj QR kód obrázok
        try {
          const base64Data = params.qrCodeImage.replace(/^data:image\/png;base64,/, '');
          const qrBuffer = Buffer.from(base64Data, 'base64');

          const pageWidth = doc.page.width;
          const qrSize = 200;
          const xPosition = (pageWidth - qrSize) / 2;

          doc.image(qrBuffer, xPosition, doc.y, {
            width: qrSize,
            height: qrSize,
          });

          doc.moveDown(12); // Posun pod QR kód
        } catch (error) {
          console.error('Error embedding QR code:', error);
          doc
            .fontSize(10)
            .fillColor('#ef4444')
            .text('Chyba pri načítaní QR kódu', { align: 'center' });
        }

        doc
          .fontSize(10)
          .fillColor('#6b7280')
          .text('Naskenujte QR kód v mobilnej bankovej aplikácii', { align: 'center' });

        doc.moveDown(3);

        // ====================================================================
        // FOOTER
        // ====================================================================

        // Horizontálna čiara
        doc
          .moveTo(50, doc.y)
          .lineTo(doc.page.width - 50, doc.y)
          .strokeColor('#e5e7eb')
          .stroke();

        doc.moveDown(1);

        doc
          .fontSize(8)
          .fillColor('#6b7280')
          .text('BlackRent s.r.o.', { align: 'center' })
          .text('www.blackrent.sk', { align: 'center' })
          .text(`Vygenerované: ${new Date().toLocaleString('sk-SK')}`, { align: 'center' });

        // Dokončenie PDF
        doc.end();
      } catch (error) {
        reject(error);
      }
    });
  }

  /**
   * Formátuje IBAN pre zobrazenie
   */
  private formatIBAN(iban: string): string {
    return iban.replace(/(.{4})/g, '$1 ').trim();
  }

  /**
   * Formátuje sumu s menou
   */
  private formatAmount(amount: number, currency: string = 'EUR'): string {
    return new Intl.NumberFormat('sk-SK', {
      style: 'currency',
      currency,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount);
  }
}




