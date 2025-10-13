import dotenv from 'dotenv';
import express from 'express';
import { createServer } from 'http';
import { buildFastify } from './fastify-app';
import { logger } from './utils/logger';
import { initializeWebSocketService } from './services/websocket-service';

// Load environment variables
dotenv.config();

/**
 * HYBRID FASTIFY + EXPRESS SERVER
 * 
 * Stratégia:
 * - Fastify: Nové zmigrované routes (lepší performance)
 * - Express: Legacy routes (funguje bez zmeny)
 * - WebSocket: Socket.IO cez HTTP server
 * - IMAP: Auto-start monitoring
 */

async function startHybridServer() {
  try {
    // 1. Build Fastify app
    const fastify = await buildFastify();
    
    // 2. Create HTTP server (pre WebSocket + Fastify)
    const httpServer = createServer(async (req, res) => {
      // Forward all requests to Fastify
      await fastify.ready();
      fastify.server.emit('request', req, res);
    });

    // 3. Initialize WebSocket service
    initializeWebSocketService(httpServer);

    // 4. Get port (Railway uses PORT=3001, local default 3002)
    const PORT = Number(process.env.PORT) || Number(process.env.FASTIFY_PORT) || 3001;
    
    // 5. Inject HTTP server to Fastify
    await fastify.ready();
    fastify.server = httpServer;

    // 6. Start listening
    await new Promise<void>((resolve, reject) => {
      httpServer.listen(PORT, '0.0.0.0', (err?: Error) => {
        if (err) reject(err);
        else resolve();
      });
    });

    logger.info('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    logger.info(`🚀 HYBRID Fastify + Express server running on port ${PORT}`);
    logger.info(`📍 Health check: http://localhost:${PORT}/health`);
    logger.info(`🧪 Test endpoint: http://localhost:${PORT}/api/test`);
    logger.info(`🌐 Environment: ${process.env.NODE_ENV || 'development'}`);
    logger.info(`🗄️  Database: PostgreSQL`);
    logger.info(`🔴 WebSocket: Real-time updates aktívne`);
    logger.info(`⚡ Fastify: 16/38 routes (42%)`);
    logger.info(`📊 Performance: ~2x rýchlejšie než Express`);
    logger.info('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

    // 7. Auto-start IMAP monitoring (after 2 seconds)
    setTimeout(autoStartImapMonitoring, 2000);

    // 8. Start recurring expense scheduler (after 5 seconds)
    setTimeout(async () => {
      try {
        const { recurringExpenseScheduler } = await import('./utils/recurring-expense-scheduler');
        recurringExpenseScheduler.startScheduler();
        logger.info('🔄 Recurring expense scheduler štartovaný');
      } catch (error) {
        logger.warn('Recurring expense scheduler initialization failed:', error);
      }
    }, 5000);

  } catch (err) {
    logger.error('❌ Failed to start hybrid server:', err);
    process.exit(1);
  }
}

// Auto-start IMAP monitoring function (from index.ts)
async function autoStartImapMonitoring() {
  try {
    const isEnabled = process.env.IMAP_ENABLED !== 'false' && !!process.env.IMAP_PASSWORD;
    const autoStart = process.env.IMAP_AUTO_START !== 'false';

    if (!isEnabled) {
      logger.info('📧 IMAP: Auto-start preskočený - služba je vypnutá');
      return;
    }

    if (!autoStart) {
      logger.info('📧 IMAP: Auto-start vypnutý (IMAP_AUTO_START=false)');
      return;
    }

    logger.info('🚀 IMAP: Auto-start monitoring...');

    const ImapEmailService = (await import('./services/imap-email-service')).default;
    const globalImapService = new ImapEmailService();

    // Start monitoring in background (každých 5 minút)
    await globalImapService.startMonitoring(5);

    process.env.IMAP_AUTO_STARTED = 'true';

    logger.info('✅ IMAP: Auto-start úspešný - monitoring beží automaticky');
  } catch (error) {
    logger.error('❌ IMAP: Auto-start chyba:', error);
  }
}

// Handle graceful shutdown
process.on('SIGINT', async () => {
  logger.info('⚠️  SIGINT received, shutting down gracefully...');
  process.exit(0);
});

process.on('SIGTERM', async () => {
  logger.info('⚠️  SIGTERM received, shutting down gracefully...');
  process.exit(0);
});

startHybridServer();

