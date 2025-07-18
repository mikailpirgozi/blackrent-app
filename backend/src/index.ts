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
import protocolsRouter from './routes/protocols';

// Načítanie environment premenných
dotenv.config();

const app = express();
const PORT = process.env.PORT || 8080;

// Middleware
const allowedOrigins = [
  'http://localhost:3000',
  'http://127.0.0.1:3000',
  'http://192.168.1.14:3000',
  /^http:\/\/192\.168\.\d{1,3}\.\d{1,3}:3000$/,
  /^http:\/\/10\.\d{1,3}\.\d{1,3}\.\d{1,3}:3000$/,
  /^http:\/\/172\.(1[6-9]|2[0-9]|3[0-1])\.\d{1,3}\.\d{1,3}:3000$/,
  // GitHub Pages URL
  'https://mikailpirgozi.github.io'
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
  console.log(`${req.method} ${req.path}`, req.body);
  next();
});

// Serve static files from React build (pre Railway deployment)
if (process.env.NODE_ENV === 'production') {
  const buildPath = path.join(__dirname, '../../build');
  app.use(express.static(buildPath));
  console.log('📦 Serving static files from:', buildPath);
}

// API Routes
app.use('/api/vehicles', vehiclesRouter);
app.use('/api/rentals', rentalsRouter);
app.use('/api/customers', customersRouter);
app.use('/api/expenses', expensesRouter);
app.use('/api/insurances', insurancesRouter);
app.use('/api/companies', companiesRouter);
app.use('/api/insurers', insurersRouter);
app.use('/api/auth', authRouter);
app.use('/api/protocols', protocolsRouter);

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// Serve React app for all other routes (pre SPA routing)
if (process.env.NODE_ENV === 'production') {
  app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, '../../build', 'index.html'));
  });
}

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