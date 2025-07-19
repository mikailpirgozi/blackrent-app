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
import filesRouter from './routes/files';

// Načítanie environment premenných
dotenv.config();

const app = express();
const PORT = process.env.PORT || 5001;

// CORS konfigurácia
app.use(cors({
  origin: true, // Allow all origins in production
  credentials: true
}));

// Middleware pre parsovanie JSON
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Serve static files z React buildu (PRODUCTION)
if (process.env.NODE_ENV === 'production') {
  const buildPath = path.join(__dirname, 'public');
  console.log('📦 Serving static files from:', buildPath);
  app.use(express.static(buildPath));
}

// API Routes
app.use('/api/auth', authRouter);
app.use('/api/vehicles', vehiclesRouter);
app.use('/api/rentals', rentalsRouter);
app.use('/api/customers', customersRouter);
app.use('/api/expenses', expensesRouter);
app.use('/api/insurances', insurancesRouter);
app.use('/api/companies', companiesRouter);
app.use('/api/insurers', insurersRouter);
app.use('/api/protocols', protocolsRouter);
app.use('/api/files', filesRouter);

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    database: 'PostgreSQL',
    environment: process.env.NODE_ENV || 'development'
  });
});

// Serve React app pre všetky ostatné routes (SPA)
if (process.env.NODE_ENV === 'production') {
  app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
  });
}

// Error handling middleware
app.use((error: any, req: any, res: any, next: any) => {
  console.error('❌ Server Error:', error);
  res.status(500).json({
    success: false,
    error: process.env.NODE_ENV === 'production' ? 'Internal server error' : error.message
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
  console.log(`🔑 Admin prihlásenie: admin / Black123.`);
  console.log(`📱 Frontend: ${process.env.NODE_ENV === 'production' ? 'Served from /public' : 'Development mode'}`);
});

export default app; 