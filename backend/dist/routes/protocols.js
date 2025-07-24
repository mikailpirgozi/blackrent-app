"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const multer_1 = __importDefault(require("multer"));
const postgres_database_1 = require("../models/postgres-database");
const pdf_generator_1 = require("../utils/pdf-generator");
const auth_1 = require("../middleware/auth");
const r2_storage_1 = require("../utils/r2-storage");
const router = express_1.default.Router();
// UUID validation function
const isValidUUID = (uuid) => {
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    return uuidRegex.test(uuid);
};
// Multer config for file uploads
const upload = (0, multer_1.default)({
    storage: multer_1.default.memoryStorage(),
    limits: { fileSize: 10 * 1024 * 1024 } // 10MB limit
});
// Get all protocols for a rental
router.get('/rental/:rentalId', async (req, res) => {
    try {
        const { rentalId } = req.params;
        console.log('📋 Fetching protocols for rental:', rentalId);
        const [rentalHandoverProtocols, rentalReturnProtocols] = await Promise.all([
            postgres_database_1.postgresDatabase.getHandoverProtocolsByRental(rentalId),
            postgres_database_1.postgresDatabase.getReturnProtocolsByRental(rentalId)
        ]);
        res.json({
            handoverProtocols: rentalHandoverProtocols,
            returnProtocols: rentalReturnProtocols
        });
    }
    catch (error) {
        console.error('❌ Error fetching protocols:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});
// 🎯 PDF PROXY ENDPOINT - Obídenie CORS problému
router.get('/pdf/:protocolId', async (req, res) => {
    try {
        const { protocolId } = req.params;
        console.log('📄 PDF proxy request for protocol:', protocolId);
        // Načítanie protokolu z databázy
        const protocol = await postgres_database_1.postgresDatabase.getHandoverProtocolById(protocolId);
        if (!protocol || !protocol.pdfUrl) {
            return res.status(404).json({ error: 'PDF not found' });
        }
        // 🔄 Stiahnutie PDF z R2 a forward do frontendu
        const response = await fetch(protocol.pdfUrl);
        if (!response.ok) {
            throw new Error(`R2 fetch failed: ${response.status}`);
        }
        const pdfBuffer = await response.arrayBuffer();
        // Nastavenie headers pre PDF
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `inline; filename="protocol_${protocolId}.pdf"`);
        res.setHeader('Access-Control-Allow-Origin', '*'); // 🎯 CORS fix
        res.setHeader('Content-Length', pdfBuffer.byteLength);
        // Odoslanie PDF
        res.send(Buffer.from(pdfBuffer));
        console.log('✅ PDF proxy successful:', protocolId);
    }
    catch (error) {
        console.error('❌ PDF proxy error:', error);
        res.status(500).json({ error: 'Failed to fetch PDF' });
    }
});
// Create handover protocol
router.post('/handover', auth_1.authenticateToken, async (req, res) => {
    try {
        console.log('📝 Received handover protocol request');
        const protocolData = req.body;
        console.log('📝 Creating handover protocol with data:', JSON.stringify(protocolData, null, 2));
        // Validácia povinných polí
        if (!protocolData.rentalId) {
            console.error('❌ Missing rental ID');
            return res.status(400).json({ error: 'Rental ID is required' });
        }
        // UUID validácia pre rental ID
        if (!isValidUUID(protocolData.rentalId)) {
            console.error('❌ Invalid rental ID format:', protocolData.rentalId);
            return res.status(400).json({ error: 'Invalid rental ID format. Must be valid UUID.' });
        }
        // 1. Uloženie protokolu do databázy
        const protocol = await postgres_database_1.postgresDatabase.createHandoverProtocol(protocolData);
        console.log('✅ Handover protocol created in DB:', protocol.id);
        // 2. 🎭 PDF generovanie + upload do R2
        let pdfUrl = null;
        try {
            console.log('🎭 Generating PDF for protocol:', protocol.id);
            const pdfBuffer = await (0, pdf_generator_1.generateHandoverPDF)(protocolData);
            // 3. Uloženie PDF do R2 storage
            const filename = `protocols/handover/${protocol.id}_${Date.now()}.pdf`;
            pdfUrl = await r2_storage_1.r2Storage.uploadFile(filename, pdfBuffer, 'application/pdf');
            console.log('✅ PDF generated and uploaded to R2:', pdfUrl);
            // 4. Aktualizácia protokolu s PDF URL
            await postgres_database_1.postgresDatabase.updateHandoverProtocol(protocol.id, { pdfUrl });
        }
        catch (pdfError) {
            console.error('❌ Error generating PDF, but protocol saved:', pdfError);
            // Protokol je uložený, ale PDF sa nepodarilo vytvoriť
        }
        console.log('✅ Handover protocol created successfully:', protocol.id);
        res.status(201).json({
            success: true,
            message: 'Odovzdávací protokol úspešne vytvorený',
            protocol: {
                ...protocol,
                pdfUrl,
                // 🎯 FRONTEND proxy URL namiesto priameho R2 URL (bez /api prefix)
                pdfProxyUrl: pdfUrl ? `/protocols/pdf/${protocol.id}` : null
            }
        });
    }
    catch (error) {
        console.error('❌ Error creating handover protocol:', error);
        res.status(500).json({
            error: 'Internal server error',
            details: error instanceof Error ? error.message : 'Unknown error'
        });
    }
});
// Get handover protocol by ID
router.get('/handover/:id', async (req, res) => {
    try {
        const { id } = req.params;
        console.log('🔍 Fetching handover protocol:', id);
        const protocol = await postgres_database_1.postgresDatabase.getHandoverProtocolById(id);
        if (!protocol) {
            return res.status(404).json({ error: 'Handover protocol not found' });
        }
        res.json(protocol);
    }
    catch (error) {
        console.error('❌ Error fetching handover protocol:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});
// Delete handover protocol
router.delete('/handover/:id', async (req, res) => {
    try {
        const { id } = req.params;
        console.log('🗑️ Deleting handover protocol:', id);
        const deleted = await postgres_database_1.postgresDatabase.deleteHandoverProtocol(id);
        if (!deleted) {
            return res.status(404).json({ error: 'Handover protocol not found' });
        }
        res.json({
            success: true,
            message: 'Protokol úspešne vymazaný'
        });
    }
    catch (error) {
        console.error('❌ Error deleting handover protocol:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});
// Create return protocol
router.post('/return', async (req, res) => {
    try {
        const protocolData = req.body;
        console.log('📝 Creating return protocol:', protocolData.id);
        const protocol = await postgres_database_1.postgresDatabase.createReturnProtocol(protocolData);
        res.status(201).json({
            success: true,
            message: 'Preberací protokol úspešne vytvorený',
            protocol: protocol
        });
    }
    catch (error) {
        console.error('❌ Error creating return protocol:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});
// DEBUG: Endpoint pre overenie Puppeteer konfigurácie
router.get('/debug/pdf-config', (req, res) => {
    const config = {
        puppeteerEnabled: process.env.PDF_GENERATOR_TYPE === 'puppeteer',
        generatorType: process.env.PDF_GENERATOR_TYPE || 'enhanced',
        customFontName: process.env.CUSTOM_FONT_NAME || 'not_set',
        customFontEnabled: process.env.PDF_GENERATOR_TYPE === 'custom-font',
        chromiumPath: process.env.PUPPETEER_EXECUTABLE_PATH || 'not set',
        skipDownload: process.env.PUPPETEER_SKIP_CHROMIUM_DOWNLOAD === 'true',
        nodeEnv: process.env.NODE_ENV,
        timestamp: new Date().toISOString(),
        version: '2.0'
    };
    console.log('🔍 PDF Config Debug:', config);
    res.json({
        success: true,
        config
    });
});
// 🧪 TEST: Endpoint pre testovanie PDF generátora bez autentifikácie
router.get('/debug/test-pdf', async (req, res) => {
    try {
        console.log('🧪 Test PDF generovanie začína...');
        // Test data pre handover protokol s Aeonik fontom (as any aby sme obišli TypeScript chyby)
        const testData = {
            id: 'test-debug-' + Date.now(),
            rentalId: 'test-rental-debug',
            type: 'handover',
            status: 'completed',
            createdAt: new Date(),
            completedAt: new Date(),
            customerName: 'Ján Testovací Čáčo',
            customerEmail: 'test@aeonik.sk',
            customerPhone: '+421 901 123 456',
            customerLicenseNumber: 'SK987654321',
            customerAddress: 'Testovacia 123, 010 01 Žilina',
            vehicleBrand: 'Škoda',
            vehicleModel: 'Octavia',
            vehicleYear: 2023,
            vehicleLicensePlate: 'ZA 999 XY',
            vehicleVin: 'TEST1234567890123',
            vehicleCondition: {
                odometer: 15000,
                fuelLevel: 80,
                fuelType: 'gasoline',
                exteriorCondition: 'Výborný stav bez škrabancov a poškodení',
                interiorCondition: 'Čistý, voňavý interiér bez opotrebovania'
            },
            vehicleColor: 'Červená metalíza',
            rentalStartDate: new Date().toISOString(),
            rentalEndDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
            rentalTotalPrice: 300.00,
            rentalDeposit: 400.00,
            rentalDailyRate: 45.00,
            rentalNotes: 'Test prenájom pre Aeonik font - obsahuje slovenské diakritiky: čšťžýáíéúňôľ',
            companyName: 'AutoRent Test s.r.o.',
            companyAddress: 'Hlavná 999, 811 01 Bratislava',
            companyPhone: '+421 2 999 888 777',
            companyEmail: 'test@autorent.sk',
            companyIco: '99999999',
            exteriorCondition: 'Výborný stav bez škrabancov a poškodení',
            interiorCondition: 'Čistý, voňavý interiér bez opotrebovania',
            documentsComplete: true,
            keysCount: 2,
            fuelCardIncluded: true,
            additionalEquipment: ['GPS navigácia', 'Zimné pneumatiky', 'Detská autosedačka'],
            location: 'Bratislava - testovacie centrum',
            vehicleImages: [],
            vehicleVideos: [],
            documentImages: [],
            documentVideos: [],
            damageImages: [],
            damageVideos: [],
            signatures: [],
            createdBy: 'test-system',
            damages: [
                {
                    id: 'damage-1',
                    description: 'Test škrabance na pravom boku',
                    severity: 'low',
                    location: 'Pravý bok vozidla',
                    images: [],
                    timestamp: new Date()
                }
            ]
        };
        console.log('🎨 Generujem PDF s Aeonik fontom...');
        // Vygeneruj PDF
        const pdfBuffer = await (0, pdf_generator_1.generateHandoverPDF)(testData);
        console.log(`✅ PDF vygenerované! Veľkosť: ${(pdfBuffer.length / 1024).toFixed(1)} KB`);
        // Nastavenie správnych headers
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', 'attachment; filename="aeonik-test-' + Date.now() + '.pdf"');
        res.setHeader('Content-Length', pdfBuffer.length);
        // Pošli PDF
        res.send(pdfBuffer);
    }
    catch (error) {
        console.error('❌ Chyba pri test PDF generovaní:', error);
        res.status(500).json({
            error: 'Test PDF generation failed',
            details: error instanceof Error ? error.message : 'Unknown error',
            generatorType: process.env.PDF_GENERATOR_TYPE,
            customFontName: process.env.CUSTOM_FONT_NAME
        });
    }
});
exports.default = router;
//# sourceMappingURL=protocols.js.map