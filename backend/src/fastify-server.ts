import dotenv from 'dotenv';
import { createServer } from 'http';
import { buildFastify } from './fastify-app';
import { logger } from './utils/logger';
import { initializeWebSocketService } from './services/websocket-service';
import type ImapEmailService from './services/imap-email-service';

// Load environment variables
dotenv.config();

// Global IMAP service instance
let globalImapService: ImapEmailService | null = null;

async function start() {
  try {
    const fastify = await buildFastify();
    
    // Use PORT if set (Railway), otherwise FASTIFY_PORT, default 3002
    const PORT = Number(process.env.PORT) || Number(process.env.FASTIFY_PORT) || 3002;
    
    // Create HTTP server for WebSocket support
    const httpServer = createServer(async (req, res) => {
      await fastify.ready();
      fastify.server.emit('request', req, res);
    });

    // Initialize WebSocket service
    initializeWebSocketService(httpServer);
    
    // Inject HTTP server to Fastify
    await fastify.ready();
    fastify.server = httpServer;

    // Start listening on HTTP server
    await new Promise<void>((resolve, reject) => {
      httpServer.listen(PORT, '0.0.0.0', (err?: Error) => {
        if (err) reject(err);
        else resolve();
      });
    });
    
    logger.info('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    logger.info(`🚀 Fastify server running on port ${PORT}`);
    logger.info(`📍 Health check: http://localhost:${PORT}/health`);
    logger.info(`🧪 Test endpoint: http://localhost:${PORT}/api/test`);
    logger.info(`🌐 Environment: ${process.env.NODE_ENV || 'development'}`);
    logger.info(`🗄️  Database: PostgreSQL`);
    logger.info(`🔴 WebSocket: Real-time updates aktívne`);
    logger.info('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

    // Auto-start IMAP monitoring after server starts (2 second delay)
    setTimeout(autoStartImapMonitoring, 2000);

    // Start recurring expense scheduler after server starts (5 second delay)
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
    logger.error('❌ Failed to start Fastify server:', err);
    process.exit(1);
  }
}

// Auto-start IMAP monitoring function
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

    const ImapEmailServiceModule = await import('./services/imap-email-service');
    const ImapEmailServiceClass = ImapEmailServiceModule.default;
    globalImapService = new ImapEmailServiceClass();

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

start();

