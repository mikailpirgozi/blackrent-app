import nodemailer from 'nodemailer';
import type { Customer, HandoverProtocol, ReturnProtocol } from '../types';

interface EmailTemplate {
  subject: string;
  html: string;
  text: string;
}

interface ProtocolEmailData {
  customer: Customer;
  protocol: HandoverProtocol | ReturnProtocol;
  vehicleInfo: {
    brand?: string;
    model?: string;
    licensePlate?: string;
  };
  rentalInfo: {
    orderNumber?: string;
    startDate?: Date;
    endDate?: Date;
    location?: string;
    totalPrice?: number;
    deposit?: number;
  };
}

class EmailService {
  private transporter: nodemailer.Transporter | null = null;
  private isEnabled: boolean;

  constructor() {
    // Kontrola či je email odosielanie povolené
    this.isEnabled = process.env.EMAIL_SEND_PROTOCOLS === 'true' && !!process.env.SMTP_PASS;
    
    if (!this.isEnabled) {
      console.log('📧 EMAIL: Služba je vypnutá (EMAIL_SEND_PROTOCOLS=false alebo chýba SMTP_PASS)');
      return;
    }

    // Vytvorenie SMTP transportera pre Websupport
    const smtpPort = parseInt(process.env.SMTP_PORT || '465');
    const isSecure = process.env.SMTP_SECURE === 'true' || smtpPort === 465;
    
    this.transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST || 'smtp.m1.websupport.sk',
      port: smtpPort,
      secure: isSecure, // true for 465, false for other ports
      auth: {
        user: process.env.SMTP_USER || 'info@blackrent.sk',
        pass: process.env.SMTP_PASS
      },
      tls: {
        rejectUnauthorized: false // Websupport sometimes has certificate issues
      }
    });

    console.log('📧 EMAIL: Service inicializovaný pre', process.env.SMTP_USER || 'info@blackrent.sk');
  }

  /**
   * Test SMTP pripojenia
   */
  async testConnection(): Promise<boolean> {
    if (!this.isEnabled || !this.transporter) {
      console.log('📧 EMAIL: Služba je vypnutá, test pripojenia preskočený');
      return false;
    }

    try {
      await this.transporter.verify();
      console.log('✅ EMAIL: SMTP pripojenie úspešné');
      return true;
    } catch (error) {
      console.error('❌ EMAIL: SMTP pripojenie neúspešné:', error);
      return false;
    }
  }

  /**
   * Odoslanie odovzdávacieho protokolu emailom
   */
  async sendHandoverProtocolEmail(
    customer: Customer, 
    pdfBuffer: Buffer, 
    protocolData: HandoverProtocol
  ): Promise<boolean> {
    if (!this.isEnabled || !this.transporter) {
      console.log('📧 EMAIL: Služba je vypnutá, email sa neodošle');
      return false;
    }

    if (!customer.email || !customer.email.trim()) {
      console.log('⚠️ EMAIL: Zákazník nemá email adresu, preskakujem odosielanie');
      return false;
    }

    try {
      const emailData: ProtocolEmailData = {
        customer,
        protocol: protocolData,
        vehicleInfo: {
          brand: protocolData.rentalData?.vehicle?.brand,
          model: protocolData.rentalData?.vehicle?.model,
          licensePlate: protocolData.rentalData?.vehicle?.licensePlate
        },
        rentalInfo: {
          orderNumber: protocolData.rentalData?.orderNumber,
          startDate: protocolData.rentalData?.startDate,
          endDate: protocolData.rentalData?.endDate,
          location: protocolData.location,
          totalPrice: protocolData.rentalData?.totalPrice,
          deposit: protocolData.rentalData?.deposit
        }
      };

      const template = this.generateHandoverEmailTemplate(emailData);
      
      // Vytvorenie PDF filename
      const pdfFilename = this.generatePDFFilename('handover', emailData);

      const mailOptions = {
        from: {
          name: process.env.SMTP_FROM_NAME || 'BlackRent System',
          address: process.env.SMTP_USER || 'info@blackrent.sk'
        },
        to: customer.email,
        cc: 'objednavky@blackrent.sk', // ✅ Automatická kópia pre BlackRent
        subject: template.subject,
        text: template.text,
        html: template.html,
        attachments: [
          {
            filename: pdfFilename,
            content: pdfBuffer,
            contentType: 'application/pdf'
          }
        ]
      };

      console.log(`📧 EMAIL: Odosielam odovzdávací protokol pre ${customer.name} na ${customer.email}`);
      
      const result = await this.transporter.sendMail(mailOptions);
      
      console.log('✅ EMAIL: Odovzdávací protokol úspešne odoslaný:', result.messageId);
      return true;

    } catch (error) {
      console.error('❌ EMAIL: Chyba pri odosielaní odovzdávacieho protokolu:', error);
      return false;
    }
  }

  /**
   * Odoslanie preberacieho protokolu emailom
   */
  async sendReturnProtocolEmail(
    customer: Customer, 
    pdfBuffer: Buffer, 
    protocolData: ReturnProtocol
  ): Promise<boolean> {
    if (!this.isEnabled || !this.transporter) {
      console.log('📧 EMAIL: Služba je vypnutá, email sa neodošle');
      return false;
    }

    if (!customer.email || !customer.email.trim()) {
      console.log('⚠️ EMAIL: Zákazník nemá email adresu, preskakujem odosielanie');
      return false;
    }

    try {
      const emailData: ProtocolEmailData = {
        customer,
        protocol: protocolData,
        vehicleInfo: {
          brand: protocolData.rentalData?.vehicle?.brand,
          model: protocolData.rentalData?.vehicle?.model,
          licensePlate: protocolData.rentalData?.vehicle?.licensePlate
        },
        rentalInfo: {
          orderNumber: protocolData.rentalData?.orderNumber,
          startDate: protocolData.rentalData?.startDate,
          endDate: protocolData.rentalData?.endDate,
          location: protocolData.location,
          totalPrice: protocolData.rentalData?.totalPrice,
          deposit: protocolData.rentalData?.deposit
        }
      };

      const template = this.generateReturnEmailTemplate(emailData);
      
      // Vytvorenie PDF filename
      const pdfFilename = this.generatePDFFilename('return', emailData);

      const mailOptions = {
        from: {
          name: process.env.SMTP_FROM_NAME || 'BlackRent System',
          address: process.env.SMTP_USER || 'info@blackrent.sk'
        },
        to: customer.email,
        cc: 'objednavky@blackrent.sk', // ✅ Automatická kópia pre BlackRent
        subject: template.subject,
        text: template.text,
        html: template.html,
        attachments: [
          {
            filename: pdfFilename,
            content: pdfBuffer,
            contentType: 'application/pdf'
          }
        ]
      };

      console.log(`📧 EMAIL: Odosielam preberací protokol pre ${customer.name} na ${customer.email}`);
      
      const result = await this.transporter.sendMail(mailOptions);
      
      console.log('✅ EMAIL: Preberací protokol úspešne odoslaný:', result.messageId);
      return true;

    } catch (error) {
      console.error('❌ EMAIL: Chyba pri odosielaní preberacieho protokolu:', error);
      return false;
    }
  }

  /**
   * Generovanie HTML šablóny pre odovzdávací protokol
   */
  private generateHandoverEmailTemplate(data: ProtocolEmailData): EmailTemplate {
    const { customer, vehicleInfo, rentalInfo } = data;
    const vehicleName = `${vehicleInfo.brand || 'Vozidlo'} ${vehicleInfo.model || ''}`.trim();
    const formattedDate = rentalInfo.startDate ? new Date(rentalInfo.startDate).toLocaleDateString('sk-SK') : 'neuvedený';
    const formattedPrice = rentalInfo.totalPrice ? `${rentalInfo.totalPrice.toFixed(2)} €` : 'neuvedená';
    const formattedDeposit = rentalInfo.deposit ? `${rentalInfo.deposit.toFixed(2)} €` : 'neuvedený';

    const subject = `🚗 Odovzdávací protokol - ${vehicleInfo.licensePlate || vehicleName}`;

    const html = `
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>Odovzdávací protokol</title>
    <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background-color: #2c5aa0; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
        .content { background-color: #f9f9f9; padding: 20px; border: 1px solid #ddd; }
        .footer { background-color: #333; color: white; padding: 15px; text-align: center; border-radius: 0 0 8px 8px; font-size: 12px; }
        .detail-row { margin: 10px 0; padding: 8px; background-color: white; border-radius: 4px; }
        .label { font-weight: bold; color: #2c5aa0; }
        .highlight { background-color: #e8f4fd; padding: 15px; border-radius: 6px; margin: 15px 0; }
        .icon { font-size: 18px; margin-right: 8px; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1><span class="icon">🚗</span>Odovzdávací protokol</h1>
            <p>BlackRent - Prenájom vozidiel</p>
        </div>
        
        <div class="content">
            <p>Vážený/á <strong>${customer.name}</strong>,</p>
            
            <p>v prílohe nájdete odovzdávací protokol pre vozidlo <strong>${vehicleName}</strong>.</p>
            
            <div class="highlight">
                <h3><span class="icon">📋</span>Detaily prenájmu:</h3>
                
                <div class="detail-row">
                    <span class="label">Číslo objednávky:</span> ${rentalInfo.orderNumber || 'neuvedené'}
                </div>
                
                <div class="detail-row">
                    <span class="label">Vozidlo:</span> ${vehicleName} (${vehicleInfo.licensePlate || 'neuvedená ŠPZ'})
                </div>
                
                <div class="detail-row">
                    <span class="label">Dátum prevzatia:</span> ${formattedDate}
                </div>
                
                <div class="detail-row">
                    <span class="label">Miesto prevzatia:</span> ${rentalInfo.location || 'neuvedené'}
                </div>
                
                <div class="detail-row">
                    <span class="label">Celková cena:</span> ${formattedPrice}
                </div>
                
                <div class="detail-row">
                    <span class="label">Depozit:</span> ${formattedDeposit}
                </div>
            </div>
            
            <p><strong>📎 Príloha:</strong> Odovzdávací protokol v PDF formáte</p>
            
            <p>Protokol obsahuje všetky dôležité informácie o stave vozidla pri prevzatí, fotodokumentáciu a podpisy oboch strán.</p>
            
            <p><strong>Dôležité upozornenie:</strong><br>
            Uschovajte si tento protokol až do vrátenia vozidla. Bude potrebný pri vytváraní preberacieho protokolu.</p>
            
            <p>V prípade akýchkoľvek otázok nás neváhajte kontaktovať.</p>
            
            <p>S pozdravom,<br>
            <strong>BlackRent Team</strong></p>
        </div>
        
        <div class="footer">
            <p>BlackRent - Prenájom vozidiel</p>
            <p>📧 info@blackrent.sk | 📱 +421 xxx xxx xxx</p>
            <p>Tento email bol odoslaný automaticky systémom BlackRent.</p>
        </div>
    </div>
</body>
</html>`;

    const text = `
Odovzdávací protokol - ${vehicleInfo.licensePlate || vehicleName}

Vážený/á ${customer.name},

v prílohe nájdete odovzdávací protokol pre vozidlo ${vehicleName}.

Detaily prenájmu:
- Číslo objednávky: ${rentalInfo.orderNumber || 'neuvedené'}
- Vozidlo: ${vehicleName} (${vehicleInfo.licensePlate || 'neuvedená ŠPZ'})
- Dátum prevzatia: ${formattedDate}
- Miesto prevzatia: ${rentalInfo.location || 'neuvedené'}
- Celková cena: ${formattedPrice}
- Depozit: ${formattedDeposit}

Protokol obsahuje všetky dôležité informácie o stave vozidla pri prevzatí, fotodokumentáciu a podpisy oboch strán.

Dôležité: Uschovajte si tento protokol až do vrátenia vozidla. Bude potrebný pri vytváraní preberacieho protokolu.

V prípade akýchkoľvek otázok nás neváhajte kontaktovať.

S pozdravom,
BlackRent Team

---
BlackRent - Prenájom vozidiel
info@blackrent.sk | +421 xxx xxx xxx
`;

    return { subject, html, text };
  }

  /**
   * Generovanie HTML šablóny pre preberací protokol
   */
  private generateReturnEmailTemplate(data: ProtocolEmailData): EmailTemplate {
    const { customer, vehicleInfo, rentalInfo, protocol } = data;
    const vehicleName = `${vehicleInfo.brand || 'Vozidlo'} ${vehicleInfo.model || ''}`.trim();
    const formattedDate = rentalInfo.endDate ? new Date(rentalInfo.endDate).toLocaleDateString('sk-SK') : 'neuvedený';
    const formattedPrice = rentalInfo.totalPrice ? `${rentalInfo.totalPrice.toFixed(2)} €` : 'neuvedená';
    
    // Pre return protokol môžeme zobraziť aj finančné zúčtovanie
    const returnProtocol = protocol as ReturnProtocol;
    const hasFinancialInfo = returnProtocol.finalRefund !== undefined;
    const finalRefund = hasFinancialInfo ? `${returnProtocol.finalRefund.toFixed(2)} €` : 'neuvedený';
    const extraFees = hasFinancialInfo ? `${returnProtocol.totalExtraFees.toFixed(2)} €` : 'neuvedené';

    const subject = `✅ Preberací protokol - ${vehicleInfo.licensePlate || vehicleName}`;

    const html = `
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>Preberací protokol</title>
    <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background-color: #28a745; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
        .content { background-color: #f9f9f9; padding: 20px; border: 1px solid #ddd; }
        .footer { background-color: #333; color: white; padding: 15px; text-align: center; border-radius: 0 0 8px 8px; font-size: 12px; }
        .detail-row { margin: 10px 0; padding: 8px; background-color: white; border-radius: 4px; }
        .label { font-weight: bold; color: #28a745; }
        .highlight { background-color: #e8f5e8; padding: 15px; border-radius: 6px; margin: 15px 0; }
        .financial { background-color: #fff3cd; padding: 15px; border-radius: 6px; margin: 15px 0; border-left: 4px solid #ffc107; }
        .icon { font-size: 18px; margin-right: 8px; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1><span class="icon">✅</span>Preberací protokol</h1>
            <p>BlackRent - Prenájom vozidiel</p>
        </div>
        
        <div class="content">
            <p>Vážený/á <strong>${customer.name}</strong>,</p>
            
            <p>v prílohe nájdete preberací protokol pre vozidlo <strong>${vehicleName}</strong>.</p>
            
            <div class="highlight">
                <h3><span class="icon">📋</span>Detaily prenájmu:</h3>
                
                <div class="detail-row">
                    <span class="label">Číslo objednávky:</span> ${rentalInfo.orderNumber || 'neuvedené'}
                </div>
                
                <div class="detail-row">
                    <span class="label">Vozidlo:</span> ${vehicleName} (${vehicleInfo.licensePlate || 'neuvedená ŠPZ'})
                </div>
                
                <div class="detail-row">
                    <span class="label">Dátum vrátenia:</span> ${formattedDate}
                </div>
                
                <div class="detail-row">
                    <span class="label">Miesto vrátenia:</span> ${rentalInfo.location || 'neuvedené'}
                </div>
            </div>
            
            ${hasFinancialInfo ? `
            <div class="financial">
                <h3><span class="icon">💰</span>Finančné zúčtovanie:</h3>
                
                <div class="detail-row">
                    <span class="label">Dodatočné poplatky:</span> ${extraFees}
                </div>
                
                <div class="detail-row">
                    <span class="label">Finálny refund:</span> <strong>${finalRefund}</strong>
                </div>
            </div>
            ` : ''}
            
            <p><strong>📎 Príloha:</strong> Preberací protokol v PDF formáte</p>
            
            <p>Protokol obsahuje všetky dôležité informácie o stave vozidla pri vrátení, fotodokumentáciu, finančné zúčtovanie a podpisy oboch strán.</p>
            
            <p><strong>Ďakujeme za využitie našich služieb!</strong><br>
            Tešíme sa na Vašu ďalšiu návštevu.</p>
            
            <p>V prípade akýchkoľvek otázok nás neváhajte kontaktovať.</p>
            
            <p>S pozdravom,<br>
            <strong>BlackRent Team</strong></p>
        </div>
        
        <div class="footer">
            <p>BlackRent - Prenájom vozidiel</p>
            <p>📧 info@blackrent.sk | 📱 +421 xxx xxx xxx</p>
            <p>Tento email bol odoslaný automaticky systémom BlackRent.</p>
        </div>
    </div>
</body>
</html>`;

    const text = `
Preberací protokol - ${vehicleInfo.licensePlate || vehicleName}

Vážený/á ${customer.name},

v prílohe nájdete preberací protokol pre vozidlo ${vehicleName}.

Detaily prenájmu:
- Číslo objednávky: ${rentalInfo.orderNumber || 'neuvedené'}
- Vozidlo: ${vehicleName} (${vehicleInfo.licensePlate || 'neuvedená ŠPZ'})
- Dátum vrátenia: ${formattedDate}
- Miesto vrátenia: ${rentalInfo.location || 'neuvedené'}

${hasFinancialInfo ? `
Finančné zúčtovanie:
- Dodatočné poplatky: ${extraFees}
- Finálny refund: ${finalRefund}
` : ''}

Protokol obsahuje všetky dôležité informácie o stave vozidla pri vrátení, fotodokumentáciu, finančné zúčtovanie a podpisy oboch strán.

Ďakujeme za využitie našich služieb! Tešíme sa na Vašu ďalšiu návštevu.

V prípade akýchkoľvek otázok nás neváhajte kontaktovať.

S pozdravom,
BlackRent Team

---
BlackRent - Prenájom vozidiel
info@blackrent.sk | +421 xxx xxx xxx
`;

    return { subject, html, text };
  }

  /**
   * Generovanie názvu PDF súboru
   */
  private generatePDFFilename(protocolType: 'handover' | 'return', data: ProtocolEmailData): string {
    const { vehicleInfo, rentalInfo } = data;
    const typeText = protocolType === 'handover' ? 'Odovzdavaci' : 'Preberaci';
    const licensePlate = vehicleInfo.licensePlate?.replace(/\s+/g, '') || 'Vozidlo';
    const orderNumber = rentalInfo.orderNumber?.replace(/\s+/g, '') || 'Objednavka';
    const date = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
    
    return `${typeText}_protokol_${licensePlate}_${orderNumber}_${date}.pdf`;
  }

  /**
   * 🧪 TEST: Odoslanie testovacieho protokolu bez CC
   */
  async sendTestProtocolEmail(
    customer: Customer, 
    pdfBuffer: Buffer, 
    protocolData: HandoverProtocol
  ): Promise<boolean> {
    if (!this.isEnabled || !this.transporter) {
      console.log('📧 EMAIL: Služba je vypnutá, email sa neodošle');
      return false;
    }

    if (!customer.email || !customer.email.trim()) {
      console.log('⚠️ EMAIL: Zákazník nemá email adresu, preskakujem odosielanie');
      return false;
    }

    try {
      const emailData: ProtocolEmailData = {
        customer,
        protocol: protocolData,
        vehicleInfo: {
          brand: protocolData.rentalData?.vehicle?.brand,
          model: protocolData.rentalData?.vehicle?.model,
          licensePlate: protocolData.rentalData?.vehicle?.licensePlate
        },
        rentalInfo: {
          orderNumber: protocolData.rentalData?.orderNumber,
          startDate: protocolData.rentalData?.startDate,
          endDate: protocolData.rentalData?.endDate,
          location: protocolData.location,
          totalPrice: protocolData.rentalData?.totalPrice,
          deposit: protocolData.rentalData?.deposit
        }
      };

      const template = this.generateHandoverEmailTemplate(emailData);
      
      // Vytvorenie PDF filename
      const pdfFilename = this.generatePDFFilename('handover', emailData);

      const mailOptions = {
        from: {
          name: process.env.SMTP_FROM_NAME || 'BlackRent System',
          address: process.env.SMTP_USER || 'info@blackrent.sk'
        },
        to: customer.email,
        // BEZ CC pre test
        subject: `🧪 TEST - ${template.subject}`,
        text: `🧪 TESTOVACÍ EMAIL\n\n${template.text}`,
        html: `<div style="background: #fff3cd; padding: 10px; border: 1px solid #ffeaa7; margin-bottom: 20px;">
          <strong>🧪 TESTOVACÍ EMAIL</strong><br>
          Toto je test email funkcionalite BlackRent systému.
        </div>${template.html}`,
        attachments: [
          {
            filename: `TEST-${pdfFilename}`,
            content: pdfBuffer,
            contentType: 'application/pdf'
          }
        ]
      };

      console.log(`📧 TEST EMAIL: Odosielam testovací protokol pre ${customer.name} na ${customer.email}`);
      
      const result = await this.transporter.sendMail(mailOptions);
      console.log('✅ TEST EMAIL: Úspešne odoslaný:', result.messageId);
      return true;
      
    } catch (error) {
      console.error('❌ TEST EMAIL: Chyba pri odosielaní:', error);
      return false;
    }
  }
}

// Singleton instance
export const emailService = new EmailService();
export default EmailService;

