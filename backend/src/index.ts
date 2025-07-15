import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import vehiclesRouter from './routes/vehicles';
import rentalsRouter from './routes/rentals';
import authRouter from './routes/auth';
import expensesRouter from './routes/expenses';
import insurancesRouter from './routes/insurances';
import customersRouter from './routes/customers';
import companiesRouter from './routes/companies';
import insurersRouter from './routes/insurers';

// Načítanie environment premenných
dotenv.config();

const app = express();
const PORT = process.env.PORT || 5001;

// Middleware
const allowedOrigins = [
  'http://localhost:3000',
  'http://127.0.0.1:3000',
  'http://192.168.1.14:3000',
  /^http:\/\/192\.168\.\d{1,3}\.\d{1,3}:3000$/,
  /^http:\/\/10\.\d{1,3}\.\d{1,3}\.\d{1,3}:3000$/,
  /^http:\/\/172\.(1[6-9]|2[0-9]|3[0-1])\.\d{1,3}\.\d{1,3}:3000$/
];

// Add production domains from environment
if (process.env.FRONTEND_URL) {
  allowedOrigins.push(process.env.FRONTEND_URL);
}

// Railway.app domain
if (process.env.RAILWAY_STATIC_URL) {
  allowedOrigins.push(process.env.RAILWAY_STATIC_URL);
  allowedOrigins.push(`https://${process.env.RAILWAY_STATIC_URL}`);
}

app.use(cors({
  origin: allowedOrigins,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json());

// Logging middleware
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
  next();
});

// API routes
app.use('/api/auth', authRouter);
app.use('/api/vehicles', vehiclesRouter);
app.use('/api/rentals', rentalsRouter);
app.use('/api/expenses', expensesRouter);
app.use('/api/insurances', insurancesRouter);
app.use('/api/customers', customersRouter);
app.use('/api/companies', companiesRouter);
app.use('/api/insurers', insurersRouter);

// Serve static files in production
if (process.env.NODE_ENV === 'production') {
  // Serve static files from React build
  app.use(express.static(path.join(__dirname, '../build')));
  
  // Handle React routing, return all requests to React app
  app.get('*', (req, res) => {
    // Skip API routes
    if (req.path.startsWith('/api') || req.path.startsWith('/health')) {
      return res.status(404).json({
        success: false,
        error: 'API endpoint nenájdený'
      });
    }
    
    res.sendFile(path.join(__dirname, '../build', 'index.html'));
  });
}

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    success: true,
    message: 'Blackrent API je funkčné',
    database: 'PostgreSQL',
    timestamp: new Date().toISOString()
  });
});

// API Health check endpoint (pre deployment monitoring)
app.get('/api/health', (req, res) => {
  res.json({
    success: true,
    message: 'Blackrent API je funkčné',
    database: 'PostgreSQL',
    version: '1.0.0',
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

// Error handling middleware
app.use((err: any, req: any, res: any, next: any) => {
  console.error('Error:', err);
  res.status(500).json({
    success: false,
    error: 'Interná chyba servera'
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    error: 'Endpoint nenájdený'
  });
});

// Spustenie servera
app.listen(PORT, () => {
  console.log(`🚀 Blackrent API server beží na porte ${PORT}`);
  console.log(`📊 Health check: http://localhost:${PORT}/health`);
  console.log(`🔐 Auth API: http://localhost:${PORT}/api/auth`);
  console.log(`🚗 Vozidlá API: http://localhost:${PORT}/api/vehicles`);
  console.log(`📋 Prenájmy API: http://localhost:${PORT}/api/rentals`);
  console.log(`🗄️ Databáza: PostgreSQL`);
  console.log(`🔑 Admin prihlásenie: admin / admin123`);
});

// Graceful shutdown
process.on('SIGINT', () => {
  console.log('\n🛑 Zastavujem server...');
  process.exit(0);
});

process.on('SIGTERM', () => {
  console.log('\n🛑 Zastavujem server...');
  process.exit(0);
}); 