import express from 'express';
import cors from 'cors';
import path from 'path';
import dotenv from 'dotenv';

// Načítaj environment variables
dotenv.config();

// Sentry backend error tracking
import { initSentry, reportError } from './utils/sentry';

const app = express();
const port = Number(process.env.PORT) || 3001;

// Sentry setup - vylepšená verzia
const sentry = initSentry(app);
if (sentry) {
  app.use(sentry.requestHandler);
  app.use(sentry.tracingHandler);
}

// CORS middleware s podporou pre všetky Vercel domény
app.use(cors({
  origin: (origin, callback) => {
    // Povolené základné domény
    const allowedOrigins = [
      'http://localhost:3000',
      'https://mikailpirgozi.github.io', 
      'https://blackrent-app-production-4d6f.up.railway.app',
      process.env.FRONTEND_URL || 'http://localhost:3000'
    ];
    
    console.log('🌐 CORS request from:', origin);
    
    // Ak nie je origin (napr. direct request, Postman)
    if (!origin) {
      console.log('✅ No origin - allowing request');
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
app.use('/api/migration', migrationRoutes);
app.use('/api/availability', availabilityRoutes);
app.use('/api/vehicle-unavailability', vehicleUnavailabilityRoutes);
app.use('/api/vehicle-documents', vehicleDocumentRoutes);
app.use('/api/insurance-claims', insuranceClaimRoutes);

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

// Start server
app.listen(Number(port), '0.0.0.0', () => {
  console.log(`🚀 BlackRent server beží na porte ${port}`);
  console.log(`🌐 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`🗄️  Database: PostgreSQL`);
  console.log(`📊 Sentry: ${sentry ? '✅ Backend aktívny' : '❌ Backend vypnutý'}, Frontend aktívny`);
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