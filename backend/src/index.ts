import compression from 'compression'; // 🚀 FÁZA 2.4: Response compression
import cors from 'cors';
import dotenv from 'dotenv';
import express, { type Request, type Response } from 'express';
import { createServer } from 'http';
import { log, logger } from './utils/logger';

// Načítaj environment variables
dotenv.config();

// Sentry removed - not needed for internal application

// WebSocket service
import { initializeWebSocketService } from './services/websocket-service';

// V2 Workers (import spustí workers)
import './workers/derivative-worker';
import './workers/manifest-worker';

const app = express();
const port = Number(process.env.PORT) || 3001;

// Sentry removed - not needed for internal application

// 🚀 FÁZA 2.4: RESPONSE COMPRESSION - gzip compression pre všetky responses
app.use(
  compression({
    filter: (req: Request, res: Response) => {
      // Kompresuj všetko okrem už kompresovaných súborov
      if (req.headers['x-no-compression']) {
        return false;
      }
      return compression.filter(req, res);
    },
    threshold: 1024, // Kompresuj len súbory väčšie ako 1KB
    level: 6, // Compression level (1=najrýchlejšie, 9=najlepšie compression)
    chunkSize: 16 * 1024, // 16KB chunks
    windowBits: 15,
    memLevel: 8,
  })
);

// CORS middleware s podporou pre všetky Vercel domény
app.use(
  cors({
    origin: (origin, callback) => {
      // Povolené základné domény
      const allowedOrigins = [
        'http://localhost:3000',
        'http://localhost:3002',
        'http://10.0.86.238:3000', // IP adresa pre sieťový prístup
        'https://mikailpirgozi.github.io',
        'https://blackrent-app-production-4d6f.up.railway.app',
        process.env.FRONTEND_URL || 'http://localhost:3000',
      ];

      logger.info('🌐 CORS request from:', origin);

      // Ak nie je origin (napr. direct request, Postman, lokálne HTML súbory)
      if (!origin || origin === 'null') {
        logger.info(
          '✅ No origin or null origin (local HTML files via file://) - allowing request'
        );
        return callback(null, true);
      }

      // Skontroluj základné allowed origins
      if (allowedOrigins.includes(origin)) {
        logger.info('✅ Origin in allowed list');
        return callback(null, true);
      }

      // ✅ KĽÚČOVÁ OPRAVA: Povolím všetky Vercel domény
      if (origin.endsWith('.vercel.app')) {
        logger.info('✅ Vercel domain detected - allowing:', origin);
        return callback(null, true);
      }

      // Povolím file:// protokol pre lokálne súbory
      if (origin.startsWith('file://')) {
        logger.info('✅ Local file protocol detected - allowing:', origin);
        return callback(null, true);
      }

      // ✅ NOVÉ: Povolím lokálne IP adresy (pre development na sieti)
      const ipPattern =
        /^https?:\/\/(192\.168\.\d+\.\d+|10\.\d+\.\d+\.\d+|172\.(1[6-9]|2[0-9]|3[0-1])\.\d+\.\d+|127\.0\.0\.1|localhost)(:\d+)?$/;
      if (ipPattern.test(origin)) {
        logger.info('✅ Local IP address detected - allowing:', origin);
        return callback(null, true);
      }

      // Inak zamietni
      logger.info('❌ Origin not allowed:', origin);
      callback(new Error(`Origin ${origin} not allowed by CORS`));
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: [
      'Content-Type',
      'Authorization',
      'Cache-Control',
      'Pragma',
      'Expires',
      'If-Modified-Since',
      'If-None-Match',
      'X-Requested-With',
    ],
  })
);

// RequestId middleware - musí byť pred všetkými routes
import { requestIdMiddleware } from './middleware/requestId';
app.use(requestIdMiddleware);

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Static file serving pre lokálne storage
app.use('/local-storage', express.static('local-storage'));

// Import routes
import adminRoutes from './routes/admin';
// import adminDebugRoutes from './routes/admin-debug'; // 🔧 ADMIN DEBUG: Protocol regeneration & company management (disabled - has TS errors)
import authRoutes from './routes/auth';
import availabilityRoutes from './routes/availability';
import bulkRoutes from './routes/bulk';
import cacheRoutes from './routes/cache';
import cleanupRoutes from './routes/cleanup';
import companyRoutes from './routes/companies';
import companyDocumentsRoutes from './routes/company-documents';
import featureFlagsRoutes from './routes/feature-flags';
import companyInvestorRoutes from './routes/company-investors';
import customerRoutes from './routes/customers';
import debugRoutes from './routes/debug'; // 🔍 DEBUG: User permissions diagnostics
import emailImapRoutes from './routes/email-imap';
import emailManagementRoutes from './routes/email-management';
import emailWebhookRoutes from './routes/email-webhook';
import expenseCategoryRoutes from './routes/expense-categories';
import expenseRoutes from './routes/expenses';
import fileRoutes from './routes/files';
import insuranceClaimRoutes from './routes/insurance-claims';
import insuranceRoutes from './routes/insurances';
import insurerRoutes from './routes/insurers';
import leasingRoutes from './routes/leasings';
import migrationRoutes from './routes/migration';
import permissionRoutes from './routes/permissions';
import platformRoutes from './routes/platforms'; // 🌐 PLATFORM MULTI-TENANCY
import protocolRoutes from './routes/protocols';
import protocolsV2Routes from './routes/protocols-v2';
import pushRoutes from './routes/push';
import r2FilesRoutes from './routes/r2-files';
import recurringExpenseRoutes from './routes/recurring-expenses';
import rentalRoutes from './routes/rentals';
import settlementRoutes from './routes/settlements';
import v2SystemTestRoutes from './routes/v2-system-test';
// import v2TestRoutes from './routes/v2-test'; // Temporarily disabled
import vehicleDocumentRoutes from './routes/vehicle-documents';
import vehicleUnavailabilityRoutes from './routes/vehicle-unavailability';
import vehicleRoutes from './routes/vehicles';

// API routes
app.use('/api/auth', authRoutes);
// app.use('/api/admin-debug', adminDebugRoutes); // 🔧 ADMIN DEBUG: Protocol regeneration & company management (disabled)
app.use('/api/debug', debugRoutes); // 🔍 DEBUG: User permissions diagnostics
app.use('/api/platforms', platformRoutes); // 🌐 PLATFORM MULTI-TENANCY
app.use('/api/vehicles', vehicleRoutes);
app.use('/api/customers', customerRoutes);
app.use('/api/rentals', rentalRoutes);
app.use('/api/expenses', expenseRoutes);
app.use('/api/expense-categories', expenseCategoryRoutes);
app.use('/api/recurring-expenses', recurringExpenseRoutes);
app.use('/api/insurances', insuranceRoutes);
app.use('/api/leasings', leasingRoutes);
app.use('/api/companies', companyRoutes);
app.use('/api/company-investors', companyInvestorRoutes);
app.use('/api/insurers', insurerRoutes);
app.use('/api/protocols', protocolRoutes);
app.use('/api/v2/protocols', protocolsV2Routes);
app.use('/api/v2-system-test', v2SystemTestRoutes);
app.use('/api/files', fileRoutes);
app.use('/api/settlements', settlementRoutes);
app.use('/api/migrations', migrationRoutes);
app.use('/api/availability', availabilityRoutes);
app.use('/api/vehicle-unavailability', vehicleUnavailabilityRoutes);
app.use('/api/vehicle-documents', vehicleDocumentRoutes);
app.use('/api/insurance-claims', insuranceClaimRoutes);
app.use('/api/permissions', permissionRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/bulk', bulkRoutes);
app.use('/api/cleanup', cleanupRoutes);
app.use('/api/email-webhook', emailWebhookRoutes);
app.use('/api/email-imap', emailImapRoutes);
app.use('/api/email-management', emailManagementRoutes);
app.use('/api/cache', cacheRoutes);
app.use('/api/push', pushRoutes);
app.use('/api/r2-files', r2FilesRoutes);
app.use('/api/company-documents', companyDocumentsRoutes);
app.use('/api/feature-flags', featureFlagsRoutes);
// app.use('/api/v2-test', v2TestRoutes); // Temporarily disabled

// SIMPLE TEST ENDPOINT - s requestId
app.get('/api/test-simple', (req, res) => {
  log('info', { requestId: req.requestId }, '🧪 Simple test endpoint called');
  res.json({
    success: true,
    message: 'Backend funguje!',
    timestamp: new Date().toISOString(),
    requestId: req.requestId,
  });
});

// Debug endpoint pre diagnostiku PDF generátora
app.get('/api/debug/pdf-generator', (req, res) => {
  const puppeteerAvailable = !!process.env.PDF_GENERATOR_TYPE;
  const generatorType = process.env.PDF_GENERATOR_TYPE || 'enhanced';

  res.json({
    success: true,
    message: 'PDF Generator Debug Info',
    data: {
      currentGenerator: generatorType,
      puppeteerEnabled: generatorType === 'puppeteer',
      environmentVariable: puppeteerAvailable,
      availableGenerators: ['enhanced', 'puppeteer', 'legacy'],
      timestamp: new Date().toISOString(),
      nodeVersion: process.version,
      platform: process.platform,
      puppeteerPath: process.env.PUPPETEER_EXECUTABLE_PATH || 'default',
      chromeSkipDownload:
        process.env.PUPPETEER_SKIP_CHROMIUM_DOWNLOAD || 'false',
    },
  });
});

// Root endpoint pre Railway healthcheck
app.get('/', (req, res) => {
  res.json({
    success: true,
    message: 'BlackRent Backend API',
    status: 'OK',
    timestamp: new Date().toISOString(),
    database: 'PostgreSQL',
    environment: process.env.NODE_ENV || 'development',
    version: '1.1.2',
    requestId: req.requestId,
  });
});
// API Health endpoint for frontend compatibility
app.get('/api/health', (req, res) => {
  res.json({
    success: true,
    message: 'Blackrent API je funkčné',
    status: 'OK',
    timestamp: new Date().toISOString(),
    database: 'PostgreSQL',
    environment: process.env.NODE_ENV || 'development',
    sentry: false, // Sentry removed
    requestId: req.requestId,
  });
});

// Removed: Catch-all route - frontend is on Vercel
// Railway backend is API-only, no frontend serving

// Sentry removed - using standard error handling

// 404 handler pre neexistujúce routes - musí byť pred error handlerom
app.use('*', (req, res, next) => {
  const error = new Error(`Route ${req.method} ${req.originalUrl} not found`) as Error & { status?: number; name?: string };
  error.status = 404;
  error.name = 'NotFoundError';
  next(error);
});

// Error handling middleware - musí byť na konci po všetkých routes
import { errorHandler } from './middleware/errorHandler';
app.use(errorHandler);

// Import IMAP service for auto-start
import ImapEmailService from './services/imap-email-service';

// Global IMAP service instance
let globalImapService: ImapEmailService | null = null;

// Auto-start IMAP monitoring function
async function autoStartImapMonitoring() {
  try {
    const isEnabled =
      process.env.IMAP_ENABLED !== 'false' && !!process.env.IMAP_PASSWORD;
    const autoStart = process.env.IMAP_AUTO_START !== 'false'; // Default: true

    if (!isEnabled) {
      logger.info('📧 IMAP: Auto-start preskočený - služba je vypnutá');
      return;
    }

    if (!autoStart) {
      logger.info('📧 IMAP: Auto-start vypnutý (IMAP_AUTO_START=false)');
      return;
    }

    logger.info('🚀 IMAP: Auto-start monitoring...');

    globalImapService = new ImapEmailService();

    // Start monitoring in background (každých 5 minút - optimalizované pre Railway rate limit)
    await globalImapService.startMonitoring(5);

    // Set environment flag for status tracking
    process.env.IMAP_AUTO_STARTED = 'true';

    logger.info('✅ IMAP: Auto-start úspešný - monitoring beží automaticky');
    logger.info(
      '📧 IMAP: Nové emaily sa budú automaticky pridávať do Email Management Dashboard'
    );
  } catch (error) {
    console.error('❌ IMAP: Auto-start chyba:', error);
    logger.info(
      '⚠️ IMAP: Môžete ho manuálne spustiť cez Email Management Dashboard'
    );
  }
}

// 🔴 Create HTTP server with WebSocket support
const httpServer = createServer(app);

// Initialize WebSocket service
initializeWebSocketService(httpServer);

// Start server with WebSocket support
httpServer.listen(Number(port), '0.0.0.0', async () => {
  logger.info(`🚀 BlackRent server beží na porte ${port}`);
  logger.info(`🌐 Environment: ${process.env.NODE_ENV || 'development'}`);
  logger.info(`🗄️  Database: PostgreSQL`);
  logger.info(`🔴 WebSocket: Real-time updates aktívne`);
  logger.info(`📊 Sentry: ❌ Backend vypnutý (removed), Frontend aktívny`);

  // ✅ OPTIMIZED: Removed automatic cache warming - lazy loading instead
  // Cache sa teraz načíta automaticky pri prvom API requeste
  // Startup je rýchlejší o ~2-3 sekundy

  // Auto-start IMAP monitoring after server starts (2 second delay)
  setTimeout(autoStartImapMonitoring, 2000);

  // Start recurring expense scheduler after server starts (5 second delay)
  setTimeout(async () => {
    try {
      const { recurringExpenseScheduler } = await import(
        './utils/recurring-expense-scheduler'
      );
      recurringExpenseScheduler.startScheduler();
      logger.info('🔄 Recurring expense scheduler štartovaný');
    } catch (error) {
      console.warn('Recurring expense scheduler initialization failed:', error);
    }
  }, 5000);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  logger.info('SIGTERM received, shutting down gracefully');
  process.exit(0);
});

process.on('SIGINT', () => {
  logger.info('SIGINT received, shutting down gracefully');
  process.exit(0);
});
