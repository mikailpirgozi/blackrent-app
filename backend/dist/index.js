"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const dotenv_1 = __importDefault(require("dotenv"));
const path_1 = __importDefault(require("path"));
const vehicles_1 = __importDefault(require("./routes/vehicles"));
const rentals_1 = __importDefault(require("./routes/rentals"));
const auth_1 = __importDefault(require("./routes/auth"));
const expenses_1 = __importDefault(require("./routes/expenses"));
const insurances_1 = __importDefault(require("./routes/insurances"));
const customers_1 = __importDefault(require("./routes/customers"));
const companies_1 = __importDefault(require("./routes/companies"));
const insurers_1 = __importDefault(require("./routes/insurers"));
// Načítanie environment premenných
dotenv_1.default.config();
const app = (0, express_1.default)();
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
app.use((0, cors_1.default)({
    origin: allowedOrigins,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express_1.default.json());
// Logging middleware
app.use((req, res, next) => {
    console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
    next();
});
// API routes
app.use('/api/auth', auth_1.default);
app.use('/api/vehicles', vehicles_1.default);
app.use('/api/rentals', rentals_1.default);
app.use('/api/expenses', expenses_1.default);
app.use('/api/insurances', insurances_1.default);
app.use('/api/customers', customers_1.default);
app.use('/api/companies', companies_1.default);
app.use('/api/insurers', insurers_1.default);
// Serve static files in production
if (process.env.NODE_ENV === 'production') {
    // Serve static files from React build
    app.use(express_1.default.static(path_1.default.join(__dirname, '../public')));
    // Handle React routing, return all requests to React app
    app.get('*', (req, res) => {
        // Skip API routes
        if (req.path.startsWith('/api') || req.path.startsWith('/health')) {
            return res.status(404).json({
                success: false,
                error: 'API endpoint nenájdený'
            });
        }
        res.sendFile(path_1.default.join(__dirname, '../public', 'index.html'));
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
app.use((err, req, res, next) => {
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
//# sourceMappingURL=index.js.map