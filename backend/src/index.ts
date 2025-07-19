import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
// Removed: import path from 'path'; - not needed for API-only backend
import vehiclesRouter from './routes/vehicles';
import rentalsRouter from './routes/rentals';
import authRouter from './routes/auth';
import expensesRouter from './routes/expenses';
import insurancesRouter from './routes/insurances';
import customersRouter from './routes/customers';
import companiesRouter from './routes/companies';
import insurersRouter from './routes/insurers';
import protocolsRouter from './routes/protocols';
// import filesRouter from './routes/files'; // Dočasne vypnuté kvôli multer types

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

// Removed: Static file serving - frontend is on Vercel
// Railway backend serves ONLY API endpoints

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
// app.use('/api/files', filesRouter); // Dočasne vypnuté kvôli multer types

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    database: 'PostgreSQL',
    environment: process.env.NODE_ENV || 'development'
  });
});

// Removed: Catch-all route - frontend is on Vercel
// Railway backend is API-only, no frontend serving

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
  console.log(`🚀 BlackRent API Backend beží na porte ${PORT}`);
  console.log(`📊 Health check: http://localhost:${PORT}/health`);
  console.log(`🔐 Auth API: http://localhost:${PORT}/api/auth`);
  console.log(`🚗 Vozidlá API: http://localhost:${PORT}/api/vehicles`);
  console.log(`📋 Prenájmy API: http://localhost:${PORT}/api/rentals`);
  console.log(`🗄️ Databáza: PostgreSQL`);
  console.log(`☁️ R2 Storage: Cloudflare`);
  console.log(`🌐 Frontend: Vercel (https://blackrent-app.vercel.app)`);
  console.log(`🔑 Admin API: /api/auth/create-admin`);
});

export default app; 