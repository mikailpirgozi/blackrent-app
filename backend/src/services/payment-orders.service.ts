import type { Pool } from 'pg';
import type {
  BankAccount,
  CreatePaymentOrderDto,
  PaymentOrder,
  UpdatePaymentStatusDto,
} from '../types/payment-order.types';
import { PaymentPDFService } from './payment-pdf.service';
import { PaymentQRService } from './payment-qr.service';
import { emailService } from './email-service';

interface RentalData {
  id: string;
  orderNumber: string | null;
  totalPrice: number;
  deposit: number;
  customerName: string | null;
  customerEmail: string | null;
  vehicle: {
    brand: string | null;
    model: string | null;
    licensePlate: string | null;
  } | null;
  customer: {
    name: string | null;
    email: string | null;
  } | null;
}

/**
 * 💳 Payment Orders Service
 * 
 * Hlavná služba pre správu platobných príkazov
 */
export class PaymentOrdersService {
  private qrService: PaymentQRService;
  private pdfService: PaymentPDFService;

  constructor(private db: Pool) {
    this.qrService = new PaymentQRService();
    this.pdfService = new PaymentPDFService();
  }

  /**
   * Vytvorí nový platobný príkaz
   */
  async create(dto: CreatePaymentOrderDto, userId?: string): Promise<PaymentOrder> {
    try {
      // 1. Načítaj rental
      const rental = await this.getRental(dto.rentalId);
      if (!rental) {
        throw new Error(`Rental not found: ${dto.rentalId}`);
      }

      // 2. Načítaj bank account
      const bankAccount = await this.getBankAccount(dto.bankAccountId);
      if (!bankAccount) {
        throw new Error(`Bank account not found: ${dto.bankAccountId}`);
      }

      if (!bankAccount.isActive) {
        throw new Error('Bank account is not active');
      }

      // 3. Validuj amount podľa typu
      const expectedAmount = dto.type === 'rental' ? rental.totalPrice : rental.deposit;
      if (!expectedAmount || expectedAmount <= 0) {
        throw new Error(`Invalid amount for type ${dto.type}`);
      }

      if (Math.abs(dto.amount - expectedAmount) > 0.01) {
        throw new Error(
          `Amount mismatch: expected ${expectedAmount}, got ${dto.amount}`
        );
      }

      // 4. Skontroluj či už neexistuje príkaz pre tento rental a typ
      const existing = await this.findExisting(dto.rentalId, dto.type);
      if (existing) {
        throw new Error(
          `Payment order already exists for rental ${dto.rentalId} and type ${dto.type}`
        );
      }

      // 5. Generuj QR kód
      const qrData = await this.qrService.generateBySquareData({
        iban: bankAccount.iban,
        amount: dto.amount,
        currency: 'EUR',
        variableSymbol: dto.variableSymbol,
        specificSymbol: dto.specificSymbol,
        constantSymbol: dto.constantSymbol,
        message: dto.message,
      });

      const qrImage = await this.qrService.generateQRCodeImage(qrData);

      // 6. Generuj PDF
      const vehicleName = rental.vehicle
        ? `${rental.vehicle.brand || ''} ${rental.vehicle.model || ''}`.trim()
        : 'N/A';

      const pdfBuffer = await this.pdfService.generatePaymentOrderPDF({
        orderNumber: rental.orderNumber || 'N/A',
        customerName: rental.customerName || rental.customer?.name || 'N/A',
        vehicleName,
        amount: dto.amount,
        type: dto.type,
        iban: bankAccount.iban,
        variableSymbol: dto.variableSymbol,
        qrCodeImage: qrImage,
        bankName: bankAccount.bankName || 'N/A',
        message: dto.message,
      });

      // 7. Upload PDF na R2 (TODO: implementovať neskôr)
      const pdfUrl = ''; // await this.uploadPDF(pdfBuffer, dto.rentalId, dto.type);

      // 8. Ulož do DB
      const paymentOrder = await this.saveToDatabase({
        rentalId: dto.rentalId,
        bankAccountId: dto.bankAccountId,
        type: dto.type,
        amount: dto.amount,
        variableSymbol: dto.variableSymbol,
        specificSymbol: dto.specificSymbol,
        constantSymbol: dto.constantSymbol,
        qrCodeData: qrData,
        qrCodeImage: qrImage,
        message: dto.message,
        pdfUrl,
        createdBy: userId,
      });

      console.log('✅ Payment order created:', paymentOrder.id);

      // 9. Pošli email (ak je požadované)
      if (dto.sendEmail && rental.customerEmail) {
        try {
          const customerName = rental.customerName || rental.customer?.name || 'Zákazník';
          const orderNumber = rental.orderNumber || 'N/A';
          
          await emailService.sendPaymentOrderEmail(
            rental.customerEmail,
            customerName,
            orderNumber,
            dto.amount,
            dto.type,
            bankAccount.iban,
            dto.variableSymbol,
            dto.message,
            pdfBuffer,
            qrImage
          );
          
          console.log('✅ Payment order email sent to:', rental.customerEmail);
        } catch (emailError) {
          console.error('❌ Failed to send payment order email:', emailError);
          // Neprerušujeme proces, email je optional
        }
      }

      return paymentOrder;
    } catch (error) {
      console.error('Error creating payment order:', error);
      throw error;
    }
  }

  /**
   * Načíta rental z databázy
   */
  private async getRental(rentalId: string): Promise<RentalData> {
    const result = await this.db.query(
      `
      SELECT 
        r.*,
        v.brand as vehicle_brand,
        v.model as vehicle_model,
        v.license_plate as vehicle_license_plate,
        c.name as customer_name,
        c.email as customer_email
      FROM rentals r
      LEFT JOIN vehicles v ON r.vehicle_id = v.id
      LEFT JOIN customers c ON r.customer_id = c.id
      WHERE r.id = $1
      `,
      [rentalId]
    );

    if (result.rows.length === 0) {
      throw new Error(`Rental not found: ${rentalId}`);
    }

    const row = result.rows[0];

    return {
      id: row.id,
      orderNumber: row.order_number,
      totalPrice: parseFloat(row.total_price || '0'),
      deposit: parseFloat(row.deposit || '0'),
      customerName: row.customer_name,
      customerEmail: row.customer_email,
      vehicle: {
        brand: row.vehicle_brand,
        model: row.vehicle_model,
        licensePlate: row.vehicle_license_plate,
      },
      customer: {
        name: row.customer_name,
        email: row.customer_email,
      },
    };
  }

  /**
   * Načíta bankový účet z databázy
   */
  private async getBankAccount(bankAccountId: string): Promise<BankAccount | null> {
    const result = await this.db.query(
      'SELECT * FROM bank_accounts WHERE id = $1',
      [bankAccountId]
    );

    if (result.rows.length === 0) {
      return null;
    }

    const row = result.rows[0];

    return {
      id: row.id,
      name: row.name,
      iban: row.iban,
      swiftBic: row.swift_bic,
      bankName: row.bank_name,
      isActive: row.is_active,
      isDefault: row.is_default,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    };
  }

  /**
   * Skontroluje či už existuje platobný príkaz
   */
  private async findExisting(
    rentalId: string,
    type: string
  ): Promise<PaymentOrder | null> {
    const result = await this.db.query(
      'SELECT * FROM payment_orders WHERE rental_id = $1 AND type = $2',
      [rentalId, type]
    );

    if (result.rows.length === 0) {
      return null;
    }

    return this.mapRowToPaymentOrder(result.rows[0]);
  }

  /**
   * Uloží platobný príkaz do databázy
   */
  private async saveToDatabase(data: {
    rentalId: string;
    bankAccountId: string;
    type: string;
    amount: number;
    variableSymbol: string;
    specificSymbol?: string;
    constantSymbol?: string;
    qrCodeData: string;
    qrCodeImage: string;
    message?: string;
    pdfUrl: string;
    createdBy?: string;
  }): Promise<PaymentOrder> {
    const result = await this.db.query(
      `
      INSERT INTO payment_orders (
        rental_id,
        bank_account_id,
        type,
        amount,
        currency,
        variable_symbol,
        specific_symbol,
        constant_symbol,
        qr_code_data,
        qr_code_image,
        message,
        pdf_url,
        pdf_generated_at,
        created_by
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, NOW(), $13)
      RETURNING *
      `,
      [
        data.rentalId,
        data.bankAccountId,
        data.type,
        data.amount,
        'EUR',
        data.variableSymbol,
        data.specificSymbol || null,
        data.constantSymbol || null,
        data.qrCodeData,
        data.qrCodeImage,
        data.message || null,
        data.pdfUrl || null,
        data.createdBy || null,
      ]
    );

    return this.mapRowToPaymentOrder(result.rows[0]);
  }

  /**
   * Načíta všetky platobné príkazy pre rental
   */
  async findByRental(rentalId: string): Promise<PaymentOrder[]> {
    const result = await this.db.query(
      `
      SELECT * FROM payment_orders 
      WHERE rental_id = $1 
      ORDER BY created_at DESC
      `,
      [rentalId]
    );

    return result.rows.map((row) => this.mapRowToPaymentOrder(row));
  }

  /**
   * Načíta platobný príkaz podľa ID
   */
  async findById(id: string): Promise<PaymentOrder | null> {
    const result = await this.db.query(
      'SELECT * FROM payment_orders WHERE id = $1',
      [id]
    );

    if (result.rows.length === 0) {
      return null;
    }

    return this.mapRowToPaymentOrder(result.rows[0]);
  }

  /**
   * Aktualizuje status platby
   */
  async updatePaymentStatus(
    id: string,
    dto: UpdatePaymentStatusDto
  ): Promise<PaymentOrder> {
    const result = await this.db.query(
      `
      UPDATE payment_orders 
      SET 
        payment_status = $1,
        paid_at = $2,
        updated_at = NOW()
      WHERE id = $3
      RETURNING *
      `,
      [dto.paymentStatus, dto.paidAt || null, id]
    );

    if (result.rows.length === 0) {
      throw new Error(`Payment order not found: ${id}`);
    }

    return this.mapRowToPaymentOrder(result.rows[0]);
  }

  /**
   * Získa PDF buffer (pre stiahnutie)
   */
  async getPDFBuffer(id: string): Promise<Buffer> {
    const paymentOrder = await this.findById(id);
    if (!paymentOrder) {
      throw new Error(`Payment order not found: ${id}`);
    }

    // Ak máme PDF URL, stiahni z R2
    if (paymentOrder.pdfUrl) {
      // TODO: Implementovať stiahnutie z R2
      throw new Error('PDF download from R2 not implemented yet');
    }

    // Inak regeneruj PDF
    const rental = await this.getRental(paymentOrder.rentalId);
    const bankAccount = await this.getBankAccount(paymentOrder.bankAccountId);

    if (!bankAccount) {
      throw new Error('Bank account not found');
    }

    const vehicleName = rental.vehicle
      ? `${rental.vehicle.brand || ''} ${rental.vehicle.model || ''}`.trim()
      : 'N/A';

    return await this.pdfService.generatePaymentOrderPDF({
      orderNumber: rental.orderNumber as string || 'N/A',
      customerName: rental.customerName as string || 'N/A',
      vehicleName,
      amount: paymentOrder.amount,
      type: paymentOrder.type,
      iban: bankAccount.iban,
      variableSymbol: paymentOrder.variableSymbol,
      qrCodeImage: paymentOrder.qrCodeImage || '',
      bankName: bankAccount.bankName || 'N/A',
      message: paymentOrder.message,
    });
  }

  /**
   * Mapuje DB row na PaymentOrder objekt
   */
  private mapRowToPaymentOrder(row: Record<string, unknown>): PaymentOrder {
    return {
      id: row.id as string,
      rentalId: row.rental_id as string,
      bankAccountId: row.bank_account_id as string,
      type: row.type as 'rental' | 'deposit',
      amount: parseFloat(row.amount as string),
      currency: row.currency as string,
      variableSymbol: row.variable_symbol as string,
      specificSymbol: row.specific_symbol as string | undefined,
      constantSymbol: row.constant_symbol as string | undefined,
      qrCodeData: row.qr_code_data as string,
      qrCodeImage: row.qr_code_image as string | undefined,
      message: row.message as string | undefined,
      pdfUrl: row.pdf_url as string | undefined,
      pdfGeneratedAt: row.pdf_generated_at as Date | undefined,
      emailSent: row.email_sent as boolean,
      emailSentAt: row.email_sent_at as Date | undefined,
      emailRecipient: row.email_recipient as string | undefined,
      paymentStatus: row.payment_status as 'pending' | 'paid' | 'cancelled',
      paidAt: row.paid_at as Date | undefined,
      createdBy: row.created_by as string | undefined,
      createdAt: row.created_at as Date,
      updatedAt: row.updated_at as Date,
    };
  }
}

