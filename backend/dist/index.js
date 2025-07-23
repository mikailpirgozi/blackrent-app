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
    const puppeteerEnabled = process.env.PDF_GENERATOR_TYPE === 'puppeteer';
    res.json({
        success: true,
        data: {
            puppeteerEnabled,
            generatorType: process.env.PDF_GENERATOR_TYPE || 'enhanced',
            nodeEnv: process.env.NODE_ENV,
            timestamp: new Date().toISOString(),
            version: '1.0'
        }
    });
});
// 🎭 PUPPETEER Configuration Debug Endpoint
app.get('/api/debug/puppeteer-config', (req, res) => {
    const config = {
        puppeteerEnabled: process.env.PDF_GENERATOR_TYPE === 'puppeteer',
        generatorType: process.env.PDF_GENERATOR_TYPE || 'enhanced',
        chromiumPath: process.env.PUPPETEER_EXECUTABLE_PATH || 'not set',
        skipDownload: process.env.PUPPETEER_SKIP_CHROMIUM_DOWNLOAD === 'true',
        nodeEnv: process.env.NODE_ENV,
        timestamp: new Date().toISOString(),
        version: '2.0'
    };
    console.log('🔍 Railway Puppeteer Config Debug:', config);
    res.json({
        success: true,
        config
    });
});
// 🧪 PUPPETEER PDF Test Endpoint
app.post('/api/debug/test-puppeteer-pdf', async (req, res) => {
    try {
        console.log('🧪 Testing Puppeteer PDF generation on Railway...');
        // Import Puppeteer PDF generátora
        const { PuppeteerPDFGeneratorV2 } = await Promise.resolve().then(() => __importStar(require('./utils/puppeteer-pdf-generator-v2')));
        const generator = new PuppeteerPDFGeneratorV2();
        // Dummy test data
        const testProtocol = {
            id: 'test-' + Date.now(),
            rentalId: 'rental-test',
            type: 'handover',
            location: 'Railway Test Location',
            vehicleCondition: { fuel: 100, kilometers: 0, damages: [] },
            signatures: [],
            vehicleImages: [],
            vehicleVideos: [],
            documentImages: [],
            documentVideos: [],
            damageImages: [],
            damageVideos: [],
            damages: [],
            rentalData: {
                orderNumber: 'TEST-' + Date.now(),
                vehicle: {
                    brand: 'Test',
                    model: 'Vehicle',
                    licensePlate: 'TEST-123',
                    company: 'Test Company'
                },
                customer: {
                    name: 'Test Customer',
                    email: 'test@test.com',
                    phone: '+421900000000'
                },
                startDate: new Date(),
                endDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
                totalPrice: 100,
                deposit: 50,
                currency: 'EUR'
            },
            createdAt: new Date(),
            status: 'completed',
            createdBy: 'test-user'
        };
        // Generate PDF
        const pdfBuffer = await generator.generateHandoverPDF(testProtocol);
        console.log('✅ Puppeteer PDF generated successfully on Railway!');
        console.log(`📊 PDF Size: ${pdfBuffer.length} bytes`);
        res.json({
            success: true,
            message: 'Puppeteer PDF generated successfully on Railway',
            size: pdfBuffer.length,
            sizeKB: Math.round(pdfBuffer.length / 1024),
            generator: 'PuppeteerPDFGeneratorV2',
            timestamp: new Date().toISOString()
        });
    }
    catch (error) {
        console.error('❌ Puppeteer PDF test failed:', error);
        res.status(500).json({
            success: false,
            error: 'Puppeteer PDF generation failed',
            message: error?.message || 'Unknown error',
            stack: process.env.NODE_ENV === 'development' ? error?.stack : undefined
        });
    }
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
//# sourceMappingURL=index.js.map