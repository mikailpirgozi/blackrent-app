"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const http_1 = require("http");
const cors_1 = __importDefault(require("cors"));
const compression_1 = __importDefault(require("compression")); // 🚀 FÁZA 2.4: Response compression
const dotenv_1 = __importDefault(require("dotenv"));
// Načítaj environment variables
dotenv_1.default.config();
const logger_1 = require("./utils/logger");
// Sentry removed - not needed for internal application
// WebSocket service
const websocket_service_1 = require("./services/websocket-service");
const app = (0, express_1.default)();
const port = Number(process.env.PORT) || 3001;
// Sentry removed - not needed for internal application
// 🚀 FÁZA 2.4: RESPONSE COMPRESSION - gzip compression pre všetky responses
app.use((0, compression_1.default)({
    filter: (req, res) => {
        // Kompresuj všetko okrem už kompresovaných súborov
        if (req.headers['x-no-compression']) {
            return false;
        }
        return compression_1.default.filter(req, res);
    },
    threshold: 1024, // Kompresuj len súbory väčšie ako 1KB
    level: 6, // Compression level (1=najrýchlejšie, 9=najlepšie compression)
    chunkSize: 16 * 1024, // 16KB chunks
    windowBits: 15,
    memLevel: 8
}));
// CORS middleware s podporou pre všetky Vercel domény
app.use((0, cors_1.default)({
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
        logger_1.logger.info('🌐 CORS request from:', origin);
        // Ak nie je origin (napr. direct request, Postman, lokálne HTML súbory)
        if (!origin || origin === 'null') {
            logger_1.logger.info('✅ No origin or null origin (local HTML files via file://) - allowing request');
            return callback(null, true);
        }
        // Skontroluj základné allowed origins
        if (allowedOrigins.includes(origin)) {
            logger_1.logger.info('✅ Origin in allowed list');
            return callback(null, true);
        }
        // ✅ KĽÚČOVÁ OPRAVA: Povolím všetky Vercel domény
        if (origin.endsWith('.vercel.app')) {
            logger_1.logger.info('✅ Vercel domain detected - allowing:', origin);
            return callback(null, true);
        }
        // Povolím file:// protokol pre lokálne súbory
        if (origin.startsWith('file://')) {
            logger_1.logger.info('✅ Local file protocol detected - allowing:', origin);
            return callback(null, true);
        }
        // ✅ NOVÉ: Povolím lokálne IP adresy (pre development na sieti)
        const ipPattern = /^https?:\/\/(192\.168\.\d+\.\d+|10\.\d+\.\d+\.\d+|172\.(1[6-9]|2[0-9]|3[0-1])\.\d+\.\d+|127\.0\.0\.1|localhost)(:\d+)?$/;
        if (ipPattern.test(origin)) {
            logger_1.logger.info('✅ Local IP address detected - allowing:', origin);
            return callback(null, true);
        }
        // Inak zamietni
        logger_1.logger.info('❌ Origin not allowed:', origin);
        callback(new Error(`Origin ${origin} not allowed by CORS`));
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));
// Body parsing middleware
app.use(express_1.default.json({ limit: '10mb' }));
app.use(express_1.default.urlencoded({ extended: true, limit: '10mb' }));
// Static file serving pre lokálne storage
app.use('/local-storage', express_1.default.static('local-storage'));
// Import routes
const auth_1 = __importDefault(require("./routes/auth"));
const vehicles_1 = __importDefault(require("./routes/vehicles"));
const customers_1 = __importDefault(require("./routes/customers"));
const rentals_1 = __importDefault(require("./routes/rentals"));
const expenses_1 = __importDefault(require("./routes/expenses"));
const expense_categories_1 = __importDefault(require("./routes/expense-categories"));
const recurring_expenses_1 = __importDefault(require("./routes/recurring-expenses"));
const insurances_1 = __importDefault(require("./routes/insurances"));
const companies_1 = __importDefault(require("./routes/companies"));
const company_investors_1 = __importDefault(require("./routes/company-investors"));
const insurers_1 = __importDefault(require("./routes/insurers"));
const protocols_1 = __importDefault(require("./routes/protocols"));
const files_1 = __importDefault(require("./routes/files"));
const settlements_1 = __importDefault(require("./routes/settlements"));
const migration_1 = __importDefault(require("./routes/migration"));
const availability_1 = __importDefault(require("./routes/availability"));
const vehicle_unavailability_1 = __importDefault(require("./routes/vehicle-unavailability"));
const vehicle_documents_1 = __importDefault(require("./routes/vehicle-documents"));
const insurance_claims_1 = __importDefault(require("./routes/insurance-claims"));
const permissions_1 = __importDefault(require("./routes/permissions"));
const admin_1 = __importDefault(require("./routes/admin"));
const bulk_1 = __importDefault(require("./routes/bulk"));
const cleanup_1 = __importDefault(require("./routes/cleanup"));
const email_webhook_1 = __importDefault(require("./routes/email-webhook"));
const email_imap_1 = __importDefault(require("./routes/email-imap"));
const email_management_1 = __importDefault(require("./routes/email-management"));
const cache_1 = __importDefault(require("./routes/cache"));
const push_1 = __importDefault(require("./routes/push"));
const company_documents_1 = __importDefault(require("./routes/company-documents"));
// API routes
app.use('/api/auth', auth_1.default);
app.use('/api/vehicles', vehicles_1.default);
app.use('/api/customers', customers_1.default);
app.use('/api/rentals', rentals_1.default);
app.use('/api/expenses', expenses_1.default);
app.use('/api/expense-categories', expense_categories_1.default);
app.use('/api/recurring-expenses', recurring_expenses_1.default);
app.use('/api/insurances', insurances_1.default);
app.use('/api/companies', companies_1.default);
app.use('/api/company-investors', company_investors_1.default);
app.use('/api/insurers', insurers_1.default);
app.use('/api/protocols', protocols_1.default);
app.use('/api/files', files_1.default);
app.use('/api/settlements', settlements_1.default);
app.use('/api/migrations', migration_1.default);
app.use('/api/availability', availability_1.default);
app.use('/api/vehicle-unavailability', vehicle_unavailability_1.default);
app.use('/api/vehicle-documents', vehicle_documents_1.default);
app.use('/api/insurance-claims', insurance_claims_1.default);
app.use('/api/permissions', permissions_1.default);
app.use('/api/admin', admin_1.default);
app.use('/api/bulk', bulk_1.default);
app.use('/api/cleanup', cleanup_1.default);
app.use('/api/email-webhook', email_webhook_1.default);
app.use('/api/email-imap', email_imap_1.default);
app.use('/api/email-management', email_management_1.default);
app.use('/api/cache', cache_1.default);
app.use('/api/push', push_1.default);
app.use('/api/company-documents', company_documents_1.default);
// SIMPLE TEST ENDPOINT - bez middleware
app.get('/api/test-simple', (req, res) => {
    logger_1.logger.info('🧪 Simple test endpoint called');
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
        sentry: false // Sentry removed
    });
});
// Removed: Catch-all route - frontend is on Vercel
// Railway backend is API-only, no frontend serving
// Sentry removed - using standard error handling
// Error handling middleware
app.use((err, req, res, next) => {
    console.error('💥 Unexpected error:', err);
    // Sentry removed - using console.error for development
    res.status(500).json({
        success: false,
        error: 'Internal Server Error',
        message: process.env.NODE_ENV === 'development' ? err.message : 'Something went wrong',
        timestamp: new Date().toISOString()
    });
});
// Import IMAP service for auto-start
const imap_email_service_1 = __importDefault(require("./services/imap-email-service"));
// Global IMAP service instance
let globalImapService = null;
// Auto-start IMAP monitoring function
async function autoStartImapMonitoring() {
    try {
        const isEnabled = process.env.IMAP_ENABLED !== 'false' && !!process.env.IMAP_PASSWORD;
        const autoStart = process.env.IMAP_AUTO_START !== 'false'; // Default: true
        if (!isEnabled) {
            logger_1.logger.info('📧 IMAP: Auto-start preskočený - služba je vypnutá');
            return;
        }
        if (!autoStart) {
            logger_1.logger.info('📧 IMAP: Auto-start vypnutý (IMAP_AUTO_START=false)');
            return;
        }
        logger_1.logger.info('🚀 IMAP: Auto-start monitoring...');
        globalImapService = new imap_email_service_1.default();
        // Start monitoring in background (každých 30 sekúnd)
        await globalImapService.startMonitoring(0.5);
        // Set environment flag for status tracking
        process.env.IMAP_AUTO_STARTED = 'true';
        logger_1.logger.info('✅ IMAP: Auto-start úspešný - monitoring beží automaticky');
        logger_1.logger.info('📧 IMAP: Nové emaily sa budú automaticky pridávať do Email Management Dashboard');
    }
    catch (error) {
        console.error('❌ IMAP: Auto-start chyba:', error);
        logger_1.logger.info('⚠️ IMAP: Môžete ho manuálne spustiť cez Email Management Dashboard');
    }
}
// 🔴 Create HTTP server with WebSocket support
const httpServer = (0, http_1.createServer)(app);
// Initialize WebSocket service
const websocketService = (0, websocket_service_1.initializeWebSocketService)(httpServer);
// Start server with WebSocket support
httpServer.listen(Number(port), '0.0.0.0', async () => {
    logger_1.logger.info(`🚀 BlackRent server beží na porte ${port}`);
    logger_1.logger.info(`🌐 Environment: ${process.env.NODE_ENV || 'development'}`);
    logger_1.logger.info(`🗄️  Database: PostgreSQL`);
    logger_1.logger.info(`🔴 WebSocket: Real-time updates aktívne`);
    logger_1.logger.info(`📊 Sentry: ❌ Backend vypnutý (removed), Frontend aktívny`);
    // Initialize cache warming
    try {
        const { warmCache } = await Promise.resolve().then(() => __importStar(require('./middleware/cache-middleware')));
        setTimeout(warmCache, 3000); // 3 second delay for DB to be ready
    }
    catch (error) {
        console.warn('Cache warming initialization failed:', error);
    }
    // Auto-start IMAP monitoring after server starts (2 second delay)
    setTimeout(autoStartImapMonitoring, 2000);
    // Start recurring expense scheduler after server starts (5 second delay)
    setTimeout(async () => {
        try {
            const { recurringExpenseScheduler } = await Promise.resolve().then(() => __importStar(require('./utils/recurring-expense-scheduler')));
            recurringExpenseScheduler.startScheduler();
            logger_1.logger.info('🔄 Recurring expense scheduler štartovaný');
        }
        catch (error) {
            console.warn('Recurring expense scheduler initialization failed:', error);
        }
    }, 5000);
});
// Graceful shutdown
process.on('SIGTERM', () => {
    logger_1.logger.info('SIGTERM received, shutting down gracefully');
    process.exit(0);
});
process.on('SIGINT', () => {
    logger_1.logger.info('SIGINT received, shutting down gracefully');
    process.exit(0);
});
//# sourceMappingURL=index.js.map