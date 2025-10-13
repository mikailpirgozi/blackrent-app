import type { FastifyInstance } from 'fastify';
import { authenticateFastify } from '../decorators/auth';
import { checkPermissionFastifyFull } from '../hooks/permissions';
import ImapEmailService from '../../services/imap-email-service';
import { postgresDatabase } from '../../models/postgres-database';

/**
 * All Email Routes - IMAP, Management, Webhook
 * Combined from:
 * - backend/src/routes/email-imap.ts
 * - backend/src/routes/email-management.ts  
 * - backend/src/routes/email-webhook.ts
 */

let imapService: ImapEmailService | null = null;

export default async function emailRoutes(fastify: FastifyInstance) {

  // ============================================
  // EMAIL IMAP ROUTES
  // ============================================

  // GET /api/email-imap/test - Test IMAP connection
  fastify.get('/api/email-imap/test', {
    preHandler: [authenticateFastify, checkPermissionFastifyFull('rentals', 'read')]
  }, async (request, reply) => {
    try {
      const isEnabled = process.env.IMAP_ENABLED !== 'false' && !!process.env.IMAP_PASSWORD;

      if (!isEnabled) {
        return reply.send({
          success: true,
          data: {
            connected: false,
            enabled: false,
            message: 'IMAP služba je vypnutá',
            timestamp: new Date().toISOString()
          }
        });
      }

      request.log.info('🧪 IMAP: Testing connection...');

      const testService = new ImapEmailService();
      const isConnected = await testService.testConnection();

      return reply.send({
        success: true,
        data: {
          connected: isConnected,
          enabled: true,
          timestamp: new Date().toISOString()
        }
      });
    } catch (error) {
      request.log.error(error, '❌ IMAP Test error');
      return reply.status(500).send({
        success: false,
        error: 'Chyba pri testovaní IMAP pripojenia'
      });
    }
  });

  // POST /api/email-imap/start - Start IMAP monitoring
  fastify.post('/api/email-imap/start', {
    preHandler: [authenticateFastify, checkPermissionFastifyFull('rentals', 'update')]
  }, async (request, reply) => {
    try {
      if (imapService) {
        return reply.status(400).send({
          success: false,
          error: 'IMAP monitoring už beží'
        });
      }

      request.log.info('🚀 IMAP: Starting monitoring...');

      imapService = new ImapEmailService();
      imapService.startMonitoring(0.5).catch(error => {
        request.log.error(error, '❌ IMAP Monitoring error');
      });

      return reply.send({
        success: true,
        message: 'IMAP monitoring spustený',
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      request.log.error(error, '❌ IMAP Start error');
      return reply.status(500).send({
        success: false,
        error: 'Chyba pri spúšťaní IMAP monitoringu'
      });
    }
  });

  // POST /api/email-imap/stop - Stop IMAP monitoring
  fastify.post('/api/email-imap/stop', {
    preHandler: [authenticateFastify, checkPermissionFastifyFull('rentals', 'update')]
  }, async (request, reply) => {
    try {
      if (!imapService) {
        return reply.status(400).send({
          success: false,
          error: 'IMAP monitoring nebeží'
        });
      }

      request.log.info('🛑 IMAP: Stopping monitoring...');

      await imapService.disconnect();
      imapService = null;

      return reply.send({
        success: true,
        message: 'IMAP monitoring zastavený',
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      request.log.error(error, '❌ IMAP Stop error');
      return reply.status(500).send({
        success: false,
        error: 'Chyba pri zastavovaní IMAP monitoringu'
      });
    }
  });

  // GET /api/email-imap/status - Get IMAP status
  fastify.get('/api/email-imap/status', {
    preHandler: [authenticateFastify, checkPermissionFastifyFull('rentals', 'read')]
  }, async (request, reply) => {
    try {
      const isRunning = imapService !== null;
      const isAutoStarted = process.env.IMAP_AUTO_STARTED === 'true';

      return reply.send({
        success: true,
        data: {
          running: isRunning,
          autoStarted: isAutoStarted,
          enabled: process.env.IMAP_ENABLED !== 'false',
          timestamp: new Date().toISOString()
        }
      });
    } catch (error) {
      request.log.error(error, '❌ IMAP Status error');
      return reply.status(500).send({
        success: false,
        error: 'Chyba pri získavaní IMAP statusu'
      });
    }
  });

  // ============================================
  // EMAIL MANAGEMENT ROUTES
  // ============================================

  // GET /api/email-management - Get all emails with filters
  fastify.get<{
    Querystring: {
      status?: string;
      sender?: string;
      dateFrom?: string;
      dateTo?: string;
      limit?: string;
      offset?: string;
    };
  }>('/api/email-management', {
    preHandler: [authenticateFastify, checkPermissionFastifyFull('rentals', 'read')]
  }, async (request, reply) => {
    try {
      const {
        status,
        sender,
        dateFrom,
        dateTo,
        limit = '50',
        offset = '0'
      } = request.query;

      let whereClause = "eph.status != 'archived'";
      const params: unknown[] = [];
      let paramIndex = 1;

      if (status) {
        whereClause += ` AND eph.status = $${paramIndex}`;
        params.push(status);
        paramIndex++;
      }

      if (sender) {
        whereClause += ` AND eph.sender ILIKE $${paramIndex}`;
        params.push(`%${sender}%`);
        paramIndex++;
      }

      if (dateFrom) {
        whereClause += ` AND eph.received_at >= $${paramIndex}`;
        params.push(dateFrom);
        paramIndex++;
      }

      if (dateTo) {
        whereClause += ` AND eph.received_at <= $${paramIndex}`;
        params.push(dateTo);
        paramIndex++;
      }

      const limitClause = `LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
      params.push(parseInt(limit), parseInt(offset));

      const query = `
        SELECT * FROM email_processing_history AS eph
        WHERE ${whereClause}
        ORDER BY eph.received_at DESC
        ${limitClause}
      `;

      const client = await (postgresDatabase as any).pool.connect();
      try {
        const result = await client.query(query, params);
        return reply.send({
          success: true,
          data: result.rows
        });
      } finally {
        client.release();
      }
    } catch (error) {
      request.log.error(error, '❌ Get emails error');
      return reply.status(500).send({
        success: false,
        error: 'Chyba pri získavaní emailov'
      });
    }
  });

  // GET /api/email-management/:id - Get email detail
  fastify.get<{
    Params: { id: string };
  }>('/api/email-management/:id', {
    preHandler: [authenticateFastify, checkPermissionFastifyFull('rentals', 'read')]
  }, async (request, reply) => {
    try {
      const { id } = request.params;

      const client = await (postgresDatabase as any).pool.connect();
      try {
        const result = await client.query(
          'SELECT * FROM email_processing_history WHERE id = $1',
          [id]
        );

        if (result.rows.length === 0) {
          return reply.status(404).send({
            success: false,
            error: 'Email nenájdený'
          });
        }

        return reply.send({
          success: true,
          data: result.rows[0]
        });
      } finally {
        client.release();
      }
    } catch (error) {
      request.log.error(error, '❌ Get email detail error');
      return reply.status(500).send({
        success: false,
        error: 'Chyba pri získavaní detailu emailu'
      });
    }
  });

  // DELETE /api/email-management/:id - Delete email
  fastify.delete<{
    Params: { id: string };
  }>('/api/email-management/:id', {
    preHandler: [authenticateFastify, checkPermissionFastifyFull('rentals', 'delete')]
  }, async (request, reply) => {
    try {
      const { id } = request.params;

      const client = await (postgresDatabase as any).pool.connect();
      try {
        await client.query(
          'DELETE FROM email_processing_history WHERE id = $1',
          [id]
        );

        return reply.send({
          success: true,
          message: 'Email vymazaný'
        });
      } finally {
        client.release();
      }
    } catch (error) {
      request.log.error(error, '❌ Delete email error');
      return reply.status(500).send({
        success: false,
        error: 'Chyba pri mazaní emailu'
      });
    }
  });

  // ============================================
  // EMAIL WEBHOOK ROUTES
  // ============================================

  // POST /api/email-webhook/incoming - Webhook handler for incoming emails
  fastify.post<{
    Body: {
      from: string;
      to: string;
      subject: string;
      body: string;
      html?: string;
      timestamp?: string;
    };
  }>('/api/email-webhook/incoming', async (request, reply) => {
    try {
      const { from, to, subject, body, html, timestamp } = request.body;

      request.log.info({
        from,
        to,
        subject
      }, '📧 EMAIL WEBHOOK: Incoming email');

      // Store in database
      const client = await (postgresDatabase as any).pool.connect();
      try {
        await client.query(
          `INSERT INTO email_processing_history 
           (email_id, sender, subject, body, html_body, received_at, status) 
           VALUES ($1, $2, $3, $4, $5, $6, $7)`,
          [
            `webhook-${Date.now()}`,
            from,
            subject,
            body,
            html || null,
            timestamp || new Date().toISOString(),
            'pending'
          ]
        );

        return reply.send({
          success: true,
          message: 'Email prijatý a spracovávaný'
        });
      } finally {
        client.release();
      }
    } catch (error) {
      request.log.error(error, '❌ Email webhook error');
      return reply.status(500).send({
        success: false,
        error: 'Chyba pri spracovaní emailu'
      });
    }
  });

  fastify.log.info('✅ Email routes registered (IMAP + Management + Webhook)');
}


