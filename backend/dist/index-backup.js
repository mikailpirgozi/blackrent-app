"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const dotenv_1 = __importDefault(require("dotenv"));
// Načítaj environment variables
dotenv_1.default.config();
// Sentry backend error tracking
const sentry_1 = require("./utils/sentry");
const app = (0, express_1.default)();
const port = Number(process.env.PORT) || 3001;
// Sentry setup - vylepšená verzia
const sentry = (0, sentry_1.initSentry)(app);
if (sentry) {
    app.use(sentry.requestHandler);
    app.use(sentry.tracingHandler);
}
// CORS middleware s podporou pre všetky Vercel domény
app.use((0, cors_1.default)({
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
app.use(express_1.default.json({ limit: '10mb' }));
app.use(express_1.default.urlencoded({ extended: true, limit: '10mb' }));
// Import routes
const auth_1 = __importDefault(require("./routes/auth"));
const vehicles_1 = __importDefault(require("./routes/vehicles"));
const customers_1 = __importDefault(require("./routes/customers"));
const rentals_1 = __importDefault(require("./routes/rentals"));
const expenses_1 = __importDefault(require("./routes/expenses"));
const insurances_1 = __importDefault(require("./routes/insurances"));
const companies_1 = __importDefault(require("./routes/companies"));
const insurers_1 = __importDefault(require("./routes/insurers"));
const protocols_1 = __importDefault(require("./routes/protocols"));
const files_1 = __importDefault(require("./routes/files"));
const settlements_1 = __importDefault(require("./routes/settlements"));
const migration_1 = __importDefault(require("./routes/migration"));
// API routes
app.use('/api/auth', auth_1.default);
app.use('/api/vehicles', vehicles_1.default);
app.use('/api/customers', customers_1.default);
app.use('/api/rentals', rentals_1.default);
app.use('/api/expenses', expenses_1.default);
app.use('/api/insurances', insurances_1.default);
app.use('/api/companies', companies_1.default);
app.use('/api/insurers', insurers_1.default);
app.use('/api/protocols', protocols_1.default);
app.use('/api/files', files_1.default);
app.use('/api/settlements', settlements_1.default);
app.use('/api/migration', migration_1.default);
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
// API Health endpoint for frontend compatibility
app.get('/api/health', (req, res) => {
    res.json({
        success: true,
        message: 'Blackrent API je funkčné',
        status: 'OK',
        timestamp: new Date().toISOString(),
        database: 'PostgreSQL',
        environment: process.env.NODE_ENV || 'development',
        sentry: !!sentry // True ak je Sentry aktívny
    });
});
// Removed: Catch-all route - frontend is on Vercel
// Railway backend is API-only, no frontend serving
// Sentry error handler - musí byť pred ostatnými error handlermi
if (sentry) {
    app.use(sentry.errorHandler);
}
// Error handling middleware
app.use((err, req, res, next) => {
    console.error('💥 Unexpected error:', err);
    // Report to Sentry if available
    if (sentry && process.env.SENTRY_DSN_BACKEND) {
        (0, sentry_1.reportError)(err, {
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
//# sourceMappingURL=index-backup.js.map