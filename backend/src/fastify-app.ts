import Fastify from 'fastify';
import cors from '@fastify/cors';
import helmet from '@fastify/helmet';
import compress from '@fastify/compress';
import rateLimit from '@fastify/rate-limit';
import { DatabaseConnection } from './models/base/DatabaseConnection';
import { logger } from './utils/logger';

export async function buildFastify() {
  const fastify = Fastify({
    logger: {
      level: process.env.LOG_LEVEL || 'info',
      transport: {
        target: 'pino-pretty',
        options: { 
          translateTime: 'HH:MM:ss Z', 
          ignore: 'pid,hostname',
          colorize: true
        }
      }
    },
    bodyLimit: 10485760, // 10MB (match Express multer)
    trustProxy: true,
    disableRequestLogging: false
  });

  // Security & compression
  await fastify.register(helmet, {
    contentSecurityPolicy: false // Disable for development
  });
  
  await fastify.register(compress, {
    threshold: 1024,
    encodings: ['gzip', 'deflate']
  });

  // CORS (match Express config from index.ts)
  await fastify.register(cors, {
    origin: (origin, callback) => {
      const allowedOrigins = [
        'http://localhost:3000',
        'http://localhost:3002',
        'http://10.0.86.238:3000',
        'https://mikailpirgozi.github.io',
        'https://blackrent-app-production-4d6f.up.railway.app',
        process.env.FRONTEND_URL || 'http://localhost:3000'
      ];

      logger.info('🌐 CORS request from:', origin);

      // No origin (Postman, direct request, local files)
      if (!origin || origin === 'null') {
        logger.info('✅ No origin or null origin - allowing request');
        return callback(null, true);
      }

      // Check allowed origins
      if (allowedOrigins.includes(origin)) {
        logger.info('✅ Origin in allowed list');
        return callback(null, true);
      }

      // Allow all Vercel domains
      if (origin.endsWith('.vercel.app')) {
        logger.info('✅ Vercel domain detected - allowing:', origin);
        return callback(null, true);
      }

      // Allow file:// protocol
      if (origin.startsWith('file://')) {
        logger.info('✅ Local file protocol detected - allowing:', origin);
        return callback(null, true);
      }

      // Allow local IP addresses
      const ipPattern = /^https?:\/\/(192\.168\.\d+\.\d+|10\.\d+\.\d+\.\d+|172\.(1[6-9]|2[0-9]|3[0-1])\.\d+\.\d+|127\.0\.0\.1|localhost)(:\d+)?$/;
      if (ipPattern.test(origin)) {
        logger.info('✅ Local IP address detected - allowing:', origin);
        return callback(null, true);
      }

      // Reject
      logger.info('❌ Origin not allowed:', origin);
      callback(new Error(`Origin ${origin} not allowed by CORS`), false);
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
    allowedHeaders: [
      'Content-Type',
      'Authorization',
      'X-Requested-With',
      'Accept',
      'Origin',
      'Access-Control-Request-Method',
      'Access-Control-Request-Headers'
    ],
    exposedHeaders: ['Content-Range', 'X-Content-Range']
  });

  // Rate limiting
  await fastify.register(rateLimit, {
    max: 100,
    timeWindow: '1 minute',
    hook: 'onRequest',
    cache: 10000,
    allowList: ['127.0.0.1'],
    redis: undefined, // Can add Redis later
    skipOnError: true
  });

  // Socket.IO support (will be initialized after server starts)
  // const socketIoPlugin = await import('./fastify/plugins/socket-io');
  // await fastify.register(socketIoPlugin.default);

  // Database connection
  const db = DatabaseConnection.getInstance();
  fastify.decorate('db', db);

  // Health check
  fastify.get('/health', async () => ({
    status: 'ok',
    framework: 'fastify',
    timestamp: new Date().toISOString(),
    database: 'connected',
    environment: process.env.NODE_ENV || 'development'
  }));

  // Test endpoint
  fastify.get('/api/test', async () => ({
    message: 'Fastify is working!',
    timestamp: new Date().toISOString()
  }));

  // Register routes (core routes)
  const authRoutes = await import('./fastify/routes/auth');
  await fastify.register(authRoutes.default);
  
  const usersRoutes = await import('./fastify/routes/users');
  await fastify.register(usersRoutes.default);
  
  const companiesRoutes = await import('./fastify/routes/companies');
  await fastify.register(companiesRoutes.default);
  
  const customersRoutes = await import('./fastify/routes/customers');
  await fastify.register(customersRoutes.default);
  
  const vehiclesRoutes = await import('./fastify/routes/vehicles');
  await fastify.register(vehiclesRoutes.default);
  
  const rentalsRoutes = await import('./fastify/routes/rentals');
  await fastify.register(rentalsRoutes.default);
  
  const protocolsRoutes = await import('./fastify/routes/protocols');
  await fastify.register(protocolsRoutes.default);
  
  const expensesRoutes = await import('./fastify/routes/expenses');
  await fastify.register(expensesRoutes.default);
  
  const settlementsRoutes = await import('./fastify/routes/settlements');
  await fastify.register(settlementsRoutes.default);
  
  const statsRoutes = await import('./fastify/routes/stats');
  await fastify.register(statsRoutes.default);

  // Register newly migrated routes
  const debugRoutes = await import('./fastify/routes/debug');
  await fastify.register(debugRoutes.default);
  
  const platformsRoutes = await import('./fastify/routes/platforms');
  await fastify.register(platformsRoutes.default);
  
  const expenseCategoriesRoutes = await import('./fastify/routes/expense-categories');
  await fastify.register(expenseCategoriesRoutes.default);
  
  const recurringExpensesRoutes = await import('./fastify/routes/recurring-expenses');
  await fastify.register(recurringExpensesRoutes.default);
  
  const insurancesRoutes = await import('./fastify/routes/insurances');
  await fastify.register(insurancesRoutes.default);
  
  const insurersRoutes = await import('./fastify/routes/insurers');
  await fastify.register(insurersRoutes.default);

  fastify.log.info('✅ All Fastify routes registered successfully');

  return fastify;
}

