import express from 'express';
import cors from 'cors';
import path from 'path';
import dotenv from 'dotenv';

// Načítaj environment variables
dotenv.config();

// Sentry backend error tracking
import { initSentry, reportError } from './utils/sentry';

const app = express();
const port = process.env.PORT || 5001;

// Sentry setup - vylepšená verzia
const sentry = initSentry(app);
if (sentry) {
  app.use(sentry.requestHandler);
  app.use(sentry.tracingHandler);
}

// CORS middleware
app.use(cors({
  origin: [
    'http://localhost:3000',
    'https://mikailpirgozi.github.io',
    'https://blackrent-app-production-4d6f.up.railway.app',
    process.env.FRONTEND_URL || 'http://localhost:3000'
  ],
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
app.listen(port, () => {
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