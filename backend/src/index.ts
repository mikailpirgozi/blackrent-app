import express, { Request, Response } from 'express';
import { createServer } from 'http';
import cors from 'cors';
import compression from 'compression'; // 🚀 FÁZA 2.4: Response compression
import path from 'path';
import dotenv from 'dotenv';

// Načítaj environment variables
dotenv.config();

// Sentry backend error tracking
import { initSentry, reportError } from './utils/sentry';

// WebSocket service
import { initializeWebSocketService } from './services/websocket-service';

const app = express();
const port = Number(process.env.PORT) || 3001;

// Sentry setup - vylepšená verzia
const sentry = initSentry(app);
if (sentry) {
  app.use(sentry.requestHandler);
  app.use(sentry.tracingHandler);
}

// 🚀 FÁZA 2.4: RESPONSE COMPRESSION - gzip compression pre všetky responses
app.use(compression({
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
  memLevel: 8
}));

// CORS middleware s podporou pre všetky Vercel domény
app.use(cors({
  origin: (origin, callback) => {
    // Povolené základné domény
    const allowedOrigins = [
      'http://localhost:3000',
      'http://localhost:3002',
      'http://10.0.86.238:3000', // IP adresa pre sieťový prístup
      'https://mikailpirgozi.github.io', 
      'https://blackrent-app-production-4d6f.up.railway.app',
      process.env.FRONTEND_URL || 'http://localhost:3000'
    ];
    
    console.log('🌐 CORS request from:', origin);
    
    // Ak nie je origin (napr. direct request, Postman, lokálne HTML súbory)
    if (!origin || origin === 'null') {
      console.log('✅ No origin or null origin (local HTML files via file://) - allowing request');
      return callback(null, true);
    }
    
    // Skontroluj základné allowed origins
    if (allowedOrigins.includes(origin)) {
      console.log('✅ Origin in allowed list');
      return callback(null, true);
    }
    
    // ✅ KĽÚČOVÁ OPRAVA: Povolím všetky Vercel domény
    if (origin.endsWith('.vercel.app')) {
      console.log('✅ Vercel domain detected - allowing:', origin);
      return callback(null, true);
    }
    
    // Povolím file:// protokol pre lokálne súbory
    if (origin.startsWith('file://')) {
      console.log('✅ Local file protocol detected - allowing:', origin);
      return callback(null, true);
    }
    
    // ✅ NOVÉ: Povolím lokálne IP adresy (pre development na sieti)
    const ipPattern = /^https?:\/\/(192\.168\.\d+\.\d+|10\.\d+\.\d+\.\d+|172\.(1[6-9]|2[0-9]|3[0-1])\.\d+\.\d+|127\.0\.0\.1|localhost)(:\d+)?$/;
    if (ipPattern.test(origin)) {
      console.log('✅ Local IP address detected - allowing:', origin);
      return callback(null, true);
    }
    
    // Inak zamietni
    console.log('❌ Origin not allowed:', origin);
    callback(new Error(`Origin ${origin} not allowed by CORS`));
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Static file serving pre lokálne storage
app.use('/local-storage', express.static('local-storage'));

// Import routes
import authRoutes from './routes/auth';
import vehicleRoutes from './routes/vehicles';
import customerRoutes from './routes/customers';
import rentalRoutes from './routes/rentals';
import expenseRoutes from './routes/expenses';
import insuranceRoutes from './routes/insurances';
import companyRoutes from './routes/companies';
import insurerRoutes from './routes/insurers';
import protocolRoutes from './routes/protocols';
import fileRoutes from './routes/files';
import settlementRoutes from './routes/settlements';
import migrationRoutes from './routes/migration';
import availabilityRoutes from './routes/availability';
import vehicleUnavailabilityRoutes from './routes/vehicle-unavailability';
import vehicleDocumentRoutes from './routes/vehicle-documents';
import insuranceClaimRoutes from './routes/insurance-claims';
import permissionRoutes from './routes/permissions';
import adminRoutes from './routes/admin';
import bulkRoutes from './routes/bulk';
import cleanupRoutes from './routes/cleanup';
import emailWebhookRoutes from './routes/email-webhook';
import emailImapRoutes from './routes/email-imap';
import emailManagementRoutes from './routes/email-management';
import cacheRoutes from './routes/cache';
import pushRoutes from './routes/push';
import advancedUsersRoutes from './routes/advanced-users';

// API routes
app.use('/api/auth', authRoutes);
app.use('/api/vehicles', vehicleRoutes);
app.use('/api/customers', customerRoutes);
app.use('/api/rentals', rentalRoutes);
app.use('/api/expenses', expenseRoutes);
app.use('/api/insurances', insuranceRoutes);
app.use('/api/companies', companyRoutes);
app.use('/api/insurers', insurerRoutes);
app.use('/api/protocols', protocolRoutes);
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
app.use('/api/advanced-users', advancedUsersRoutes);

// SIMPLE TEST ENDPOINT - bez middleware
app.get('/api/test-simple', (req, res) => {
  console.log('🧪 Simple test endpoint called');
  res.json({ success: true, message: 'Backend funguje!', timestamp: new Date().toISOString() });
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
      chromeSkipDownload: process.env.PUPPETEER_SKIP_CHROMIUM_DOWNLOAD || 'false'
    }
  });
});

// Root endpoint pre Railway healthcheck
app.get("/", (req, res) => {
  res.json({ 
    success: true,
    message: "BlackRent Backend API",
    status: "OK", 
    timestamp: new Date().toISOString(),
    database: "PostgreSQL",
    environment: process.env.NODE_ENV || "development",
    version: "1.1.2"
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
    sentry: !!sentry  // True ak je Sentry aktívny
  });
});

// Removed: Catch-all route - frontend is on Vercel
// Railway backend is API-only, no frontend serving

// Sentry error handler - musí byť pred ostatnými error handlermi
if (sentry) {
  app.use(sentry.errorHandler);
}

// Error handling middleware
app.use((err: any, req: any, res: any, next: any) => {
  console.error('💥 Unexpected error:', err);
  
  // Report to Sentry if available
  if (sentry && process.env.SENTRY_DSN_BACKEND) {
    reportError(err, {
      url: req.url,
      method: req.method,
      user: req.user?.id,
    });
  }
  
  res.status(500).json({
    success: false,
    error: 'Internal Server Error',
    message: process.env.NODE_ENV === 'development' ? err.message : 'Something went wrong',
    timestamp: new Date().toISOString()
  });
});

// Import IMAP service for auto-start
import ImapEmailService from './services/imap-email-service';

// Global IMAP service instance
let globalImapService: ImapEmailService | null = null;

// Auto-start IMAP monitoring function
async function autoStartImapMonitoring() {
  try {
    const isEnabled = process.env.IMAP_ENABLED !== 'false' && !!process.env.IMAP_PASSWORD;
    const autoStart = process.env.IMAP_AUTO_START !== 'false'; // Default: true
    
    if (!isEnabled) {
      console.log('📧 IMAP: Auto-start preskočený - služba je vypnutá');
      return;
    }
    
    if (!autoStart) {
      console.log('📧 IMAP: Auto-start vypnutý (IMAP_AUTO_START=false)');
      return;
    }
    
    console.log('🚀 IMAP: Auto-start monitoring...');
    
    globalImapService = new ImapEmailService();
    
    // Start monitoring in background (každých 30 sekúnd)
    await globalImapService.startMonitoring(0.5);
    
    // Set environment flag for status tracking
    process.env.IMAP_AUTO_STARTED = 'true';
    
    console.log('✅ IMAP: Auto-start úspešný - monitoring beží automaticky');
    console.log('📧 IMAP: Nové emaily sa budú automaticky pridávať do Email Management Dashboard');
  } catch (error) {
    console.error('❌ IMAP: Auto-start chyba:', error);
    console.log('⚠️ IMAP: Môžete ho manuálne spustiť cez Email Management Dashboard');
  }
}

// 🔴 Create HTTP server with WebSocket support
const httpServer = createServer(app);

// Initialize WebSocket service
const websocketService = initializeWebSocketService(httpServer);

// Start server with WebSocket support
httpServer.listen(Number(port), '0.0.0.0', async () => {
  console.log(`🚀 BlackRent server beží na porte ${port}`);
  console.log(`🌐 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`🗄️  Database: PostgreSQL`);
  console.log(`🔴 WebSocket: Real-time updates aktívne`);
  console.log(`📊 Sentry: ${sentry ? '✅ Backend aktívny' : '❌ Backend vypnutý'}, Frontend aktívny`);
  
  // Initialize cache warming
  try {
    const { warmCache } = await import('./middleware/cache-middleware');
    setTimeout(warmCache, 3000); // 3 second delay for DB to be ready
  } catch (error) {
    console.warn('Cache warming initialization failed:', error);
  }
  
  // Auto-start IMAP monitoring after server starts (2 second delay)
  setTimeout(autoStartImapMonitoring, 2000);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received, shutting down gracefully');
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('SIGINT received, shutting down gracefully');
  process.exit(0);
}); 