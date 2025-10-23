import QRCode from 'qrcode';
import type { GenerateQRParams } from '../types/payment-order.types';

/**
 * 💳 Payment QR Service
 * 
 * Služba pre generovanie Pay by square QR kódov
 * - Slovenský/Český štandard pre platby
 * - Kompatibilné so všetkými bankami v SK/CZ
 */
export class PaymentQRService {
  /**
   * Generuje Pay by square string
   * 
   * @param params - Parametre platby
   * @returns Pay by square encoded string
   */
  async generateBySquareData(params: GenerateQRParams): Promise<string> {
    try {
      // ✅ Dynamic import for ES module
      // @ts-expect-error - bysquare is an ES module without proper type declarations
      const { default: BySquare } = await import('bysquare');
      
      const bySquare = new BySquare();

      // Nastav základné údaje
      bySquare.setInvoiceId(params.variableSymbol);
      
      // Pridaj platbu
      bySquare.addPayment({
        type: 1, // Platba
        amount: params.amount,
        currencyCode: params.currency,
        variableSymbol: params.variableSymbol,
        specificSymbol: params.specificSymbol || '',
        constantSymbol: params.constantSymbol || '',
        iban: params.iban,
        swift: '', // Voliteľné
        date: params.dueDate ? this.formatDate(params.dueDate) : undefined,
        note: params.message || '',
      });

      // Vygeneruj Pay by square string
      const bySquareString = bySquare.generate();
      
      return bySquareString;
    } catch (error) {
      console.error('Error generating Pay by square data:', error);
      throw new Error(`Failed to generate Pay by square data: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Generuje QR kód ako PNG base64
   * 
   * @param data - Pay by square string
   * @returns Base64 encoded PNG image (data:image/png;base64,...)
   */
  async generateQRCodeImage(data: string): Promise<string> {
    try {
      const qrCodeDataUrl = await QRCode.toDataURL(data, {
        errorCorrectionLevel: 'M',
        type: 'image/png',
        width: 512,
        margin: 2,
        color: {
          dark: '#000000',
          light: '#FFFFFF',
        },
      });

      return qrCodeDataUrl;
    } catch (error) {
      console.error('Error generating QR code image:', error);
      throw new Error(`Failed to generate QR code image: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Generuje QR kód ako Buffer (pre PDF embedding)
   * 
   * @param data - Pay by square string
   * @returns PNG buffer
   */
  async generateQRCodeBuffer(data: string): Promise<Buffer> {
    try {
      const buffer = await QRCode.toBuffer(data, {
        errorCorrectionLevel: 'M',
        type: 'png',
        width: 512,
        margin: 2,
        color: {
          dark: '#000000',
          light: '#FFFFFF',
        },
      });

      return buffer;
    } catch (error) {
      console.error('Error generating QR code buffer:', error);
      throw new Error(`Failed to generate QR code buffer: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Formátuje dátum pre Pay by square (YYYYMMDD)
   */
  private formatDate(date: Date): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}${month}${day}`;
  }

  /**
   * Validuje IBAN formát
   */
  validateIBAN(iban: string): boolean {
    const ibanRegex = /^[A-Z]{2}[0-9]{2}[A-Z0-9]+$/;
    return ibanRegex.test(iban);
  }

  /**
   * Formátuje IBAN pre zobrazenie (SK12 3456 7890 1234 5678 9012)
   */
  formatIBAN(iban: string): string {
    return iban.replace(/(.{4})/g, '$1 ').trim();
  }
}

  