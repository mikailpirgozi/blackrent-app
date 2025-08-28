import { Router, Request, Response } from 'express';
import { authenticateToken } from '../middleware/auth';
import { checkPermission } from '../middleware/permissions';
import { postgresDatabase } from '../models/postgres-database';
import { v4 as uuidv4 } from 'uuid';

const router = Router();

interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
}

// GET /api/email-management - Získanie všetkých emailov s filtrami
router.get('/',
  authenticateToken,
  checkPermission('rentals', 'read'),
  async (req: Request, res: Response<ApiResponse>) => {
    try {
      const { 
        status, 
        sender,
        dateFrom,
        dateTo,
        limit = 50,
        offset = 0
      } = req.query;

      let whereClause = "eph.status != 'archived'"; // Exclude archived emails from main list
      const params: any[] = [];
      let paramIndex = 1;

      // Filter by status
      if (status && typeof status === 'string') {
        whereClause += ` AND eph.status = $${paramIndex}`;
        params.push(status);
        paramIndex++;
      }

      // Filter by sender
      if (sender && typeof sender === 'string') {
        whereClause += ` AND eph.sender ILIKE $${paramIndex}`;
        params.push(`%${sender}%`);
        paramIndex++;
      }

      // Filter by date range
      if (dateFrom && typeof dateFrom === 'string') {
        whereClause += ` AND eph.received_at >= $${paramIndex}`;
        params.push(dateFrom);
        paramIndex++;
      }

      if (dateTo && typeof dateTo === 'string') {
        whereClause += ` AND eph.received_at <= $${paramIndex}`;
        params.push(dateTo);
        paramIndex++;
      }

      // Add pagination
      const limitClause = `LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
      params.push(parseInt(limit as string), parseInt(offset as string));

      const query = `
        SELECT 
          eph.id,
          eph.email_id,
          eph.subject,
          eph.sender,
          eph.received_at,
          eph.processed_at,
          eph.status,
          eph.action_taken,
          eph.confidence_score,
          eph.error_message,
          eph.notes,
          eph.tags,
          eph.rental_id,
          eph.is_blacklisted,
          eph.created_at,
          eph.updated_at,
          -- Extract data from parsed_data JSON or rental table
          COALESCE(r.customer_name, eph.parsed_data->>'customerName') as customer_name,
          COALESCE(r.order_number, eph.parsed_data->>'orderNumber') as order_number,
          eph.parsed_data->>'vehicleName' as vehicle_name,
          CAST(eph.parsed_data->>'totalAmount' AS DECIMAL) as total_price,
          u.username as processed_by_username
        FROM email_processing_history eph
        LEFT JOIN rentals r ON eph.rental_id = r.id
        LEFT JOIN users u ON eph.processed_by = u.id
        WHERE ${whereClause}
        ORDER BY eph.received_at DESC
        ${limitClause}
      `;

      const result = await postgresDatabase.query(query, params);

      // Get total count for pagination
      const countQuery = `
        SELECT COUNT(*) as total
        FROM email_processing_history eph
        WHERE ${whereClause}
      `;
      
      const countResult = await postgresDatabase.query(countQuery, params.slice(0, -2));
      const total = parseInt(countResult.rows[0].total);

      res.json({
        success: true,
        data: {
          emails: result.rows,
          pagination: {
            total,
            limit: parseInt(limit as string),
            offset: parseInt(offset as string),
            hasMore: (parseInt(offset as string) + parseInt(limit as string)) < total
          }
        }
      });

    } catch (error) {
      console.error('❌ EMAIL MANAGEMENT: Chyba pri načítaní emailov:', error);
      res.status(500).json({
        success: false,
        error: 'Chyba pri načítaní emailov'
      });
    }
  }
);

// GET /api/email-management/:id - Detail konkrétneho emailu
router.get('/:id',
  authenticateToken,
  checkPermission('rentals', 'read'),
  async (req: Request, res: Response<ApiResponse>) => {
    try {
      const { id } = req.params;

      const result = await postgresDatabase.query(`
        SELECT 
          eph.*,
          r.customer_name,
          r.order_number,
          r.vehicle_name,
          r.total_price,
          u.username as processed_by_username
        FROM email_processing_history eph
        LEFT JOIN rentals r ON eph.rental_id = r.id
        LEFT JOIN users u ON eph.processed_by = u.id
        WHERE eph.id = $1
      `, [id]);

      if (result.rows.length === 0) {
        return res.status(404).json({
          success: false,
          error: 'Email nenájdený'
        });
      }

      // Get action history for this email
      const actionsResult = await postgresDatabase.query(`
        SELECT 
          eal.*,
          u.username
        FROM email_action_logs eal
        LEFT JOIN users u ON eal.user_id = u.id
        WHERE eal.email_id = $1
        ORDER BY eal.created_at DESC
      `, [id]);

      res.json({
        success: true,
        data: {
          email: result.rows[0],
          actions: actionsResult.rows
        }
      });

    } catch (error) {
      console.error('❌ EMAIL MANAGEMENT: Chyba pri načítaní emailu:', error);
      res.status(500).json({
        success: false,
        error: 'Chyba pri načítaní emailu'
      });
    }
  }
);

// POST /api/email-management/:id/approve - Schváliť email a vytvor rental
router.post('/:id/approve',
  authenticateToken,
  checkPermission('rentals', 'create'),
  async (req: Request, res: Response<ApiResponse>) => {
    try {
      const { id } = req.params;
      const userId = req.user?.id;

      // Get email data
      const emailResult = await postgresDatabase.query(`
        SELECT * FROM email_processing_history WHERE id = $1
      `, [id]);

      if (emailResult.rows.length === 0) {
        return res.status(404).json({
          success: false,
          error: 'Email nenájdený'
        });
      }

      const email = emailResult.rows[0];

      if (email.status === 'processed' && email.action_taken === 'approved') {
        return res.status(400).json({
          success: false,
          error: 'Email už bol schválený'
        });
      }

      // If email already has rental_id, just update status
      if (email.rental_id) {
        await postgresDatabase.query(`
          UPDATE email_processing_history 
          SET 
            status = 'processed',
            action_taken = 'approved',
            processed_by = $2,
            processed_at = CURRENT_TIMESTAMP
          WHERE id = $1
        `, [id, userId]);

        // Log action
        await postgresDatabase.query(`
          INSERT INTO email_action_logs (email_id, user_id, action, notes)
          VALUES ($1, $2, 'approved', 'Manually approved')
        `, [id, userId]);

      } else {
        // Create rental from parsed data if no rental_id exists
        if (!email.parsed_data) {
          return res.status(400).json({
            success: false,
            error: 'Email nemá parsované údaje. Nie je možné vytvoriť rental.'
          });
        }

        const parsedData = email.parsed_data;

        try {
          // Create rental from parsed data (using correct column names)
          // Parse dates properly
          let startDate = new Date().toISOString();
          let endDate = new Date(Date.now() + 86400000).toISOString(); // +1 day
          
          if (parsedData.reservationTime) {
            try {
              // Clean and split reservation time
              const cleanReservationTime = parsedData.reservationTime.replace(/\n/g, ' ').trim();
              const dateParts = cleanReservationTime.split(' - ');
              
              if (dateParts.length >= 2) {
                const startStr = dateParts[0].trim();
                const endStr = dateParts[1].trim();
                
                // Parse časy presne ako prichádzajú v emaili - ako plain string pre PostgreSQL
                const parseAsPlainString = (dateStr: string) => {
                  if (dateStr.match(/\d{4}-\d{2}-\d{2}/)) {
                    // Nahraď newline medzi dátumom a časom medzerou
                    const cleanDateStr = dateStr.replace(/\n/g, ' ');
                    const [datePart, timePart] = cleanDateStr.split(' ');
                    
                    // Vráť ako plain string pre PostgreSQL TIMESTAMP (bez timezone)
                    return `${datePart} ${timePart}`;
                  }
                  return new Date().toISOString();
                };
                
                startDate = parseAsPlainString(startStr);
                endDate = parseAsPlainString(endStr);
              }
            } catch (dateError) {
              console.log('⚠️ Date parsing error, using defaults:', dateError);
            }
          }

          // Use totalAmount or vehicleTotalAmount as fallback
          const totalPrice = parsedData.totalAmount || parsedData.vehicleTotalAmount || null;
          
          // Payment method mapping to correct enum values
          let paymentMethod = 'cash';
          if (parsedData.paymentMethod) {
            const paymentLower = parsedData.paymentMethod.toLowerCase();
            if (paymentLower.includes('hotovosť') || paymentLower.includes('cash')) {
              paymentMethod = 'cash';
            } else if (paymentLower.includes('bank') || paymentLower.includes('prevod')) {
              paymentMethod = 'bank_transfer';
            } else if (paymentLower.includes('vrp')) {
              paymentMethod = 'vrp';
            } else if (paymentLower.includes('direct') || paymentLower.includes('majiteľ')) {
              paymentMethod = 'direct_to_owner';
            }
          }
          
          // Find or create customer
          let customerId = null;
          if (parsedData.customerEmail) {
            try {
              // Try to find existing customer by email
              const customerResult = await postgresDatabase.query(`
                SELECT id FROM customers WHERE email = $1
              `, [parsedData.customerEmail]);
              
              if (customerResult.rows.length > 0) {
                customerId = customerResult.rows[0].id;
              } else {
                // Create new customer - split name into first_name and last_name
                const nameParts = parsedData.customerName?.split(' ') || ['Unknown'];
                const firstName = nameParts[0] || 'Unknown';
                const lastName = nameParts.length > 1 ? nameParts.slice(1).join(' ') : 'Customer';
                
                const newCustomerResult = await postgresDatabase.query(`
                  INSERT INTO customers (first_name, last_name, name, email, phone, created_at)
                  VALUES ($1, $2, $3, $4, $5, CURRENT_TIMESTAMP)
                  RETURNING id
                `, [firstName, lastName, parsedData.customerName, parsedData.customerEmail, parsedData.customerPhone]);
                customerId = newCustomerResult.rows[0].id;
              }
            } catch (customerError) {
              console.log('⚠️ Customer creation error:', customerError);
            }
          }
          
          // Find vehicle by code and get extraKilometerRate
          let vehicleId = null;
          let extraKilometerRate = 0.30; // Default hodnota
          if (parsedData.vehicleCode) {
            try {
              const vehicleResult = await postgresDatabase.query(`
                SELECT id, pricing FROM vehicles WHERE license_plate = $1 OR license_plate = $2
              `, [parsedData.vehicleCode, parsedData.vehicleCode.toUpperCase()]);
              
              if (vehicleResult.rows.length > 0) {
                vehicleId = vehicleResult.rows[0].id;
                
                // 🚗 NOVÉ: Extrahovanie extraKilometerRate z pricing JSONB
                const pricing = vehicleResult.rows[0].pricing;
                if (Array.isArray(pricing)) {
                  // Hľadáme posledný extraKilometerRate objekt (najnovší)
                  const extraKmObjects = pricing.filter(item => item.extraKilometerRate !== undefined);
                  if (extraKmObjects.length > 0) {
                    const lastExtraKmObj = extraKmObjects[extraKmObjects.length - 1];
                    extraKilometerRate = parseFloat(lastExtraKmObj.extraKilometerRate) || 0.30;
                    console.log(`🚗 Using vehicle extra km rate: ${extraKilometerRate}€/km for ${parsedData.vehicleCode}`);
                  }
                }
              }
            } catch (vehicleError) {
              console.log('⚠️ Vehicle lookup error:', vehicleError);
            }
          }
          
          // Calculate allowed kilometers (daily_km * rental days)
          let allowedKilometers = 0;
          if (parsedData.dailyKilometers) {
            const rentalDays = Math.ceil((new Date(endDate).getTime() - new Date(startDate).getTime()) / (1000 * 60 * 60 * 24));
            allowedKilometers = parseInt(parsedData.dailyKilometers) * rentalDays;
          }
          
          const result = await postgresDatabase.query(`
            INSERT INTO rentals (
              status, customer_name, customer_id, vehicle_id,
              start_date, end_date, handover_place, total_price, deposit, 
              order_number, payment_method, allowed_kilometers, 
              extra_kilometer_rate, notes, created_at
            ) VALUES ('pending', $1, $2, $3, $4::timestamp, $5::timestamp, $6, $7, $8, $9, $10, $11, $12, $13, CURRENT_TIMESTAMP)
            RETURNING id
          `, [
            parsedData.customerName,
            customerId,
            vehicleId,
            startDate,
            endDate,
            parsedData.pickupPlace || 'Trenčín',
            totalPrice,
            parsedData.deposit,
            parsedData.orderNumber,
            paymentMethod,
            allowedKilometers,
            extraKilometerRate, // 🚗 NOVÉ: Extra km rate z vozidla
            `Email: ${parsedData.customerEmail}, Telefón: ${parsedData.customerPhone}, Vozidlo: ${parsedData.vehicleName} (${parsedData.vehicleCode}), Denné km: ${parsedData.dailyKilometers}, Extra km: ${extraKilometerRate}€/km`
          ]);

          const rentalId = result.rows[0].id;

          // Update email with rental_id and approved status
          await postgresDatabase.query(`
            UPDATE email_processing_history 
            SET 
              status = 'processed',
              action_taken = 'approved',
              processed_by = $2,
              processed_at = CURRENT_TIMESTAMP,
              rental_id = $3
            WHERE id = $1
          `, [id, userId, rentalId]);

          // Log action
          await postgresDatabase.query(`
            INSERT INTO email_action_logs (email_id, user_id, action, notes)
            VALUES ($1, $2, 'approved', 'Rental created and approved')
          `, [id, userId]);

          // Auto-archive after successful approval (optional - can be disabled via settings)
          setTimeout(async () => {
            try {
              await postgresDatabase.query(`
                UPDATE email_processing_history 
                SET 
                  status = 'archived',
                  archived_at = CURRENT_TIMESTAMP
                WHERE id = $1 AND status = 'processed'
              `, [id]);
              
              await postgresDatabase.query(`
                INSERT INTO email_action_logs (email_id, user_id, action, notes)
                VALUES ($1, $2, 'archived', 'Auto-archived after approval')
              `, [id, userId]);
              
              console.log(`📁 Email ${id} auto-archived after approval`);
            } catch (error) {
              console.error('❌ Auto-archive error:', error);
            }
          }, 5000); // Archive after 5 seconds

        } catch (rentalError) {
          console.error('❌ Chyba pri vytváraní rental:', rentalError);
          return res.status(500).json({
            success: false,
            error: 'Chyba pri vytváraní rental z emailu'
          });
        }
      }

      res.json({
        success: true,
        data: {
          message: 'Email úspešne schválený'
        }
      });

    } catch (error) {
      console.error('❌ EMAIL MANAGEMENT: Chyba pri schvaľovaní emailu:', error);
      res.status(500).json({
        success: false,
        error: 'Chyba pri schvaľovaní emailu'
      });
    }
  }
);

// POST /api/email-management/:id/reject - Zamietnuť email
router.post('/:id/reject',
  authenticateToken,
  checkPermission('rentals', 'update'),
  async (req: Request, res: Response<ApiResponse>) => {
    try {
      const { id } = req.params;
      const { reason } = req.body;
      const userId = req.user?.id;

      // Update email status
      await postgresDatabase.query(`
        UPDATE email_processing_history 
        SET 
          status = 'rejected',
          action_taken = 'rejected',
          processed_by = $2,
          processed_at = CURRENT_TIMESTAMP,
          error_message = $3
        WHERE id = $1
      `, [id, userId, reason || 'Manually rejected']);

      // Log action
      await postgresDatabase.query(`
        INSERT INTO email_action_logs (email_id, user_id, action, notes)
        VALUES ($1, $2, 'rejected', $3)
      `, [id, userId, reason || 'Manually rejected']);

      // Auto-archive after rejection (optional - can be disabled via settings)
      setTimeout(async () => {
        try {
          await postgresDatabase.query(`
            UPDATE email_processing_history 
            SET 
              status = 'archived',
              archived_at = CURRENT_TIMESTAMP
            WHERE id = $1 AND status = 'rejected'
          `, [id]);
          
          await postgresDatabase.query(`
            INSERT INTO email_action_logs (email_id, user_id, action, notes)
            VALUES ($1, $2, 'archived', 'Auto-archived after rejection')
          `, [id, userId]);
          
          console.log(`📁 Email ${id} auto-archived after rejection`);
        } catch (error) {
          console.error('❌ Auto-archive error:', error);
        }
      }, 10000); // Archive after 10 seconds for rejection

      res.json({
        success: true,
        data: {
          message: 'Email úspešne zamietnutý'
        }
      });

    } catch (error) {
      console.error('❌ EMAIL MANAGEMENT: Chyba pri zamietaní emailu:', error);
      res.status(500).json({
        success: false,
        error: 'Chyba pri zamietaní emailu'
      });
    }
  }
);

// POST /api/email-management/:id/archive - Archivovať email
router.post('/:id/archive',
  authenticateToken,
  checkPermission('rentals', 'update'),
  async (req: Request, res: Response<ApiResponse>) => {
    try {
      const { id } = req.params;
      const userId = req.user?.id;

      await postgresDatabase.query(`
        UPDATE email_processing_history 
        SET 
          status = 'archived',
          action_taken = 'archived',
          processed_by = $2,
          processed_at = CURRENT_TIMESTAMP,
          archived_at = CURRENT_TIMESTAMP
        WHERE id = $1
      `, [id, userId]);

      // Log action
      await postgresDatabase.query(`
        INSERT INTO email_action_logs (email_id, user_id, action)
        VALUES ($1, $2, 'archived')
      `, [id, userId]);

      res.json({
        success: true,
        data: {
          message: 'Email úspešne archivovaný'
        }
      });

    } catch (error) {
      console.error('❌ EMAIL MANAGEMENT: Chyba pri archivovaní emailu:', error);
      res.status(500).json({
        success: false,
        error: 'Chyba pri archivovaní emailu'
      });
    }
  }
);

// POST /api/email-management/bulk-archive - Bulk archivovanie emailov
router.post('/bulk-archive',
  authenticateToken,
  checkPermission('rentals', 'update'),
  async (req: Request, res: Response<ApiResponse>) => {
    try {
      const { emailIds, archiveType = 'manual' } = req.body;
      const userId = req.user?.id;

      if (!emailIds || !Array.isArray(emailIds) || emailIds.length === 0) {
        return res.status(400).json({
          success: false,
          error: 'Nie sú poskytnuté žiadne email ID'
        });
      }

      // Build placeholders for IN clause
      const placeholders = emailIds.map((_, index) => `$${index + 1}`).join(',');
      const params = [...emailIds, userId];

      // Archive emails
      const result = await postgresDatabase.query(`
        UPDATE email_processing_history 
        SET 
          status = 'archived',
          action_taken = 'archived',
          processed_by = $${params.length},
          processed_at = CURRENT_TIMESTAMP,
          archived_at = CURRENT_TIMESTAMP
        WHERE id IN (${placeholders})
        AND status NOT IN ('archived')
        RETURNING id
      `, params);

      // Log actions for each archived email
      const logPromises = result.rows.map((row: any) => 
        postgresDatabase.query(`
          INSERT INTO email_action_logs (email_id, user_id, action, notes)
          VALUES ($1, $2, 'archived', $3)
        `, [row.id, userId, `Bulk archived (${archiveType})`])
      );

      await Promise.all(logPromises);

      res.json({
        success: true,
        data: {
          message: `${result.rows.length} emailov úspešne archivovaných`,
          archivedCount: result.rows.length
        }
      });

    } catch (error) {
      console.error('❌ EMAIL MANAGEMENT: Chyba pri bulk archivovaní:', error);
      res.status(500).json({
        success: false,
        error: 'Chyba pri bulk archivovaní emailov'
      });
    }
  }
);

// POST /api/email-management/auto-archive - Automatické archivovanie starých emailov
router.post('/auto-archive',
  authenticateToken,
  checkPermission('rentals', 'update'),
  async (req: Request, res: Response<ApiResponse>) => {
    try {
      const { daysOld = 30, statuses = ['processed', 'rejected'] } = req.body;
      const userId = req.user?.id;

      // Build status filter
      const statusPlaceholders = statuses.map((_: any, index: number) => `$${index + 2}`).join(',');
      const params = [daysOld, ...statuses, userId];

      const result = await postgresDatabase.query(`
        UPDATE email_processing_history 
        SET 
          status = 'archived',
          action_taken = 'archived',
          processed_by = $${params.length},
          processed_at = CURRENT_TIMESTAMP,
          archived_at = CURRENT_TIMESTAMP
        WHERE status IN (${statusPlaceholders})
        AND processed_at < CURRENT_TIMESTAMP - INTERVAL '$1 days'
        AND archived_at IS NULL
        RETURNING id, subject, sender
      `, params);

      // Log actions for each auto-archived email
      const logPromises = result.rows.map((row: any) => 
        postgresDatabase.query(`
          INSERT INTO email_action_logs (email_id, user_id, action, notes)
          VALUES ($1, $2, 'archived', $3)
        `, [row.id, userId, `Auto-archived after ${daysOld} days`])
      );

      await Promise.all(logPromises);

      res.json({
        success: true,
        data: {
          message: `${result.rows.length} starých emailov automaticky archivovaných`,
          archivedCount: result.rows.length,
          archivedEmails: result.rows
        }
      });

    } catch (error) {
      console.error('❌ EMAIL MANAGEMENT: Chyba pri automatickom archivovaní:', error);
      res.status(500).json({
        success: false,
        error: 'Chyba pri automatickom archivovaní emailov'
      });
    }
  }
);

// GET /api/email-management/archive - Získanie archivovaných emailov
router.get('/archive/list',
  authenticateToken,
  checkPermission('rentals', 'read'),
  async (req: Request, res: Response<ApiResponse>) => {
    try {
      const { 
        sender,
        dateFrom,
        dateTo,
        limit = 50,
        offset = 0
      } = req.query;

      let whereClause = "eph.status = 'archived'";
      const params: any[] = [];
      let paramIndex = 1;

      // Filter by sender
      if (sender && typeof sender === 'string') {
        whereClause += ` AND eph.sender ILIKE $${paramIndex}`;
        params.push(`%${sender}%`);
        paramIndex++;
      }

      // Filter by date range
      if (dateFrom && typeof dateFrom === 'string') {
        whereClause += ` AND eph.archived_at >= $${paramIndex}`;
        params.push(dateFrom);
        paramIndex++;
      }

      if (dateTo && typeof dateTo === 'string') {
        whereClause += ` AND eph.archived_at <= $${paramIndex}`;
        params.push(dateTo);
        paramIndex++;
      }

      // Add pagination
      const limitClause = `LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
      params.push(parseInt(limit as string), parseInt(offset as string));

      const query = `
        SELECT 
          eph.id,
          eph.email_id,
          eph.subject,
          eph.sender,
          eph.received_at,
          eph.processed_at,
          eph.archived_at,
          eph.status,
          eph.action_taken,
          eph.confidence_score,
          eph.error_message,
          eph.notes,
          eph.tags,
          eph.rental_id,
          eph.is_blacklisted,
          eph.created_at,
          eph.updated_at,
          -- Extract data from parsed_data JSON or rental table
          COALESCE(r.customer_name, eph.parsed_data->>'customerName') as customer_name,
          COALESCE(r.order_number, eph.parsed_data->>'orderNumber') as order_number,
          eph.parsed_data->>'vehicleName' as vehicle_name,
          CAST(eph.parsed_data->>'totalAmount' AS DECIMAL) as total_price,
          u.username as processed_by_username
        FROM email_processing_history eph
        LEFT JOIN rentals r ON eph.rental_id = r.id
        LEFT JOIN users u ON eph.processed_by = u.id
        WHERE ${whereClause}
        ORDER BY eph.archived_at DESC
        ${limitClause}
      `;

      const result = await postgresDatabase.query(query, params);

      // Get total count for pagination
      const countQuery = `
        SELECT COUNT(*) as total
        FROM email_processing_history eph
        WHERE ${whereClause}
      `;
      
      const countResult = await postgresDatabase.query(countQuery, params.slice(0, -2));
      const total = parseInt(countResult.rows[0].total);

      res.json({
        success: true,
        data: {
          emails: result.rows,
          pagination: {
            total,
            limit: parseInt(limit as string),
            offset: parseInt(offset as string),
            hasMore: (parseInt(offset as string) + parseInt(limit as string)) < total
          }
        }
      });

    } catch (error) {
      console.error('❌ EMAIL MANAGEMENT: Chyba pri načítaní archívu:', error);
      res.status(500).json({
        success: false,
        error: 'Chyba pri načítaní archívu emailov'
      });
    }
  }
);

// POST /api/email-management/:id/unarchive - Obnoviť email z archívu
router.post('/:id/unarchive',
  authenticateToken,
  checkPermission('rentals', 'update'),
  async (req: Request, res: Response<ApiResponse>) => {
    try {
      const { id } = req.params;
      const userId = req.user?.id;

      // Get current email to determine previous status
      const emailResult = await postgresDatabase.query(`
        SELECT * FROM email_processing_history WHERE id = $1
      `, [id]);

      if (emailResult.rows.length === 0) {
        return res.status(404).json({
          success: false,
          error: 'Email nenájdený'
        });
      }

      const email = emailResult.rows[0];
      if (email.status !== 'archived') {
        return res.status(400).json({
          success: false,
          error: 'Email nie je archivovaný'
        });
      }

      // Determine new status based on action_taken
      let newStatus = 'new';
      if (email.action_taken === 'approved') {
        newStatus = 'processed';
      } else if (email.action_taken === 'rejected') {
        newStatus = 'rejected';
      }

      await postgresDatabase.query(`
        UPDATE email_processing_history 
        SET 
          status = $2,
          archived_at = NULL,
          updated_at = CURRENT_TIMESTAMP
        WHERE id = $1
      `, [id, newStatus]);

      // Log action
      await postgresDatabase.query(`
        INSERT INTO email_action_logs (email_id, user_id, action, notes)
        VALUES ($1, $2, 'unarchived', $3)
      `, [id, userId, `Restored from archive to status: ${newStatus}`]);

      res.json({
        success: true,
        data: {
          message: 'Email úspešne obnovený z archívu',
          newStatus
        }
      });

    } catch (error) {
      console.error('❌ EMAIL MANAGEMENT: Chyba pri obnove z archívu:', error);
      res.status(500).json({
        success: false,
        error: 'Chyba pri obnove emailu z archívu'
      });
    }
  }
);

// DELETE /api/email-management/clear-historical - Vymazať všetky historické emaily pred dnešným dátumom
// MUSÍ BYŤ PRED /:id route kvôli Express routing!
router.delete('/clear-historical',
  authenticateToken,
  checkPermission('rentals', 'delete'),
  async (req: Request, res: Response<ApiResponse>) => {
    console.log('🔥 CLEAR HISTORICAL ENDPOINT CALLED!');
    try {
      const userId = req.user?.id;
      const today = new Date();
      today.setHours(0, 0, 0, 0); // Nastaviť na začiatok dňa
      const todayStr = today.toISOString();

      console.log(`🗑️ CLEAR HISTORICAL: Začínam mazanie emailov pred ${todayStr}`);

      // Najprv získaj počet emailov ktoré sa budú mazať
      const countResult = await postgresDatabase.query(`
        SELECT COUNT(*) as count
        FROM email_processing_history 
        WHERE received_at < $1
      `, [todayStr]);

      const emailsToDelete = parseInt(countResult.rows[0].count);
      console.log(`🗑️ CLEAR HISTORICAL: Nájdených ${emailsToDelete} emailov na zmazanie`);

      if (emailsToDelete === 0) {
        return res.json({
          success: true,
          data: {
            message: 'Žiadne historické emaily na zmazanie',
            deletedCount: 0
          }
        });
      }

      // Zmaž všetky historické emaily (bez logovania kvôli foreign key constraints)
      const deleteResult = await postgresDatabase.query(`
        DELETE FROM email_processing_history 
        WHERE received_at < $1
      `, [todayStr]);

      console.log(`✅ CLEAR HISTORICAL: Úspešne zmazaných ${deleteResult.rowCount} emailov`);

      res.json({
        success: true,
        data: {
          message: `Úspešne zmazaných ${deleteResult.rowCount} historických emailov`,
          deletedCount: deleteResult.rowCount,
          cutoffDate: todayStr
        }
      });

    } catch (error) {
      console.error('❌ CLEAR HISTORICAL: Chyba pri mazaní historických emailov:', error);
      res.status(500).json({
        success: false,
        error: 'Chyba pri mazaní historických emailov'
      });
    }
  }
);

// DELETE /api/email-management/:id - Zmazať email
router.delete('/:id',
  authenticateToken,
  checkPermission('rentals', 'delete'),
  async (req: Request, res: Response<ApiResponse>) => {
    try {
      const { id } = req.params;
      const userId = req.user?.id;

      // Log action before deletion
      await postgresDatabase.query(`
        INSERT INTO email_action_logs (email_id, user_id, action, notes)
        VALUES ($1, $2, 'deleted', 'Email permanently deleted')
      `, [id, userId]);

      // Delete email (this will cascade to action logs due to foreign key)
      await postgresDatabase.query(`
        DELETE FROM email_processing_history WHERE id = $1
      `, [id]);

      res.json({
        success: true,
        data: {
          message: 'Email úspešne zmazaný'
        }
      });

    } catch (error) {
      console.error('❌ EMAIL MANAGEMENT: Chyba pri mazaní emailu:', error);
      res.status(500).json({
        success: false,
        error: 'Chyba pri mazaní emailu'
      });
    }
  }
);

// GET /api/email-management/stats - Štatistiky emailov
router.get('/stats/dashboard',
  authenticateToken,
  checkPermission('rentals', 'read'),
  async (req: Request, res: Response<ApiResponse>) => {
    try {
      const today = new Date();
      const todayStr = today.toISOString().split('T')[0];
      
      // Today's stats
      const todayStats = await postgresDatabase.query(`
        SELECT 
          COUNT(*) as total,
          COUNT(*) FILTER (WHERE status = 'processed') as processed,
          COUNT(*) FILTER (WHERE status = 'rejected') as rejected,
          COUNT(*) FILTER (WHERE status = 'new') as pending
        FROM email_processing_history 
        WHERE DATE(received_at) = $1
      `, [todayStr]);

      // This week's stats
      const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
      const weekStats = await postgresDatabase.query(`
        SELECT 
          DATE(received_at) as date,
          COUNT(*) as total,
          COUNT(*) FILTER (WHERE status = 'processed') as processed,
          COUNT(*) FILTER (WHERE status = 'rejected') as rejected
        FROM email_processing_history 
        WHERE received_at >= $1
        GROUP BY DATE(received_at)
        ORDER BY date DESC
      `, [weekAgo]);

      // Top senders
      const topSenders = await postgresDatabase.query(`
        SELECT 
          sender,
          COUNT(*) as count,
          COUNT(*) FILTER (WHERE status = 'processed') as processed_count
        FROM email_processing_history 
        WHERE received_at >= $1
        GROUP BY sender
        ORDER BY count DESC
        LIMIT 10
      `, [weekAgo]);

      res.json({
        success: true,
        data: {
          today: todayStats.rows[0],
          weeklyTrend: weekStats.rows,
          topSenders: topSenders.rows
        }
      });

    } catch (error) {
      console.error('❌ EMAIL MANAGEMENT: Chyba pri načítaní štatistík:', error);
      res.status(500).json({
        success: false,
        error: 'Chyba pri načítaní štatistík'
      });
    }
  }
);

export default router;