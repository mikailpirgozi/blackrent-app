"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const multer_1 = __importDefault(require("multer"));
const postgres_database_1 = require("../models/postgres-database");
const pdf_generator_1 = require("../utils/pdf-generator");
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
// Create handover protocol
router.post('/handover', async (req, res) => {
    try {
        console.log('📝 Received handover protocol request');
        console.log('📝 Request body (raw):', req.body);
        console.log('📝 Request body (stringified):', JSON.stringify(req.body, null, 2));
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
        const protocol = await postgres_database_1.postgresDatabase.createHandoverProtocol(protocolData);
        console.log('✅ Handover protocol created successfully:', protocol.id);
        res.status(201).json({
            message: 'Handover protocol created successfully',
            protocol
        });
    }
    catch (error) {
        console.error('❌ Error creating handover protocol:', error);
        console.error('❌ Error details:', error instanceof Error ? error.message : 'Unknown error');
        console.error('❌ Error stack:', error instanceof Error ? error.stack : 'No stack trace');
        res.status(500).json({
            error: 'Internal server error',
            details: error instanceof Error ? error.message : 'Unknown error'
        });
    }
});
// Create return protocol
router.post('/return', async (req, res) => {
    try {
        const protocolData = req.body;
        console.log('📝 Creating return protocol:', protocolData.id);
        const protocol = await postgres_database_1.postgresDatabase.createReturnProtocol(protocolData);
        res.status(201).json({
            message: 'Return protocol created successfully',
            protocol
        });
    }
    catch (error) {
        console.error('❌ Error creating return protocol:', error);
        res.status(500).json({ error: 'Internal server error' });
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
// Get return protocol by ID
router.get('/return/:id', async (req, res) => {
    try {
        const { id } = req.params;
        console.log('🔍 Fetching return protocol:', id);
        const protocol = await postgres_database_1.postgresDatabase.getReturnProtocolById(id);
        if (!protocol) {
            return res.status(404).json({ error: 'Return protocol not found' });
        }
        res.json(protocol);
    }
    catch (error) {
        console.error('❌ Error fetching return protocol:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});
// Update handover protocol
router.put('/handover/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const updates = req.body;
        console.log('✏️ Updating handover protocol:', id);
        // For now, we don't have a specific update method for handover protocols
        // This could be implemented if needed
        res.status(501).json({ error: 'Update handover protocol not implemented yet' });
    }
    catch (error) {
        console.error('❌ Error updating handover protocol:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});
// Update return protocol
router.put('/return/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const updates = req.body;
        console.log('✏️ Updating return protocol:', id);
        const protocol = await postgres_database_1.postgresDatabase.updateReturnProtocol(id, updates);
        if (!protocol) {
            return res.status(404).json({ error: 'Return protocol not found' });
        }
        res.json({
            message: 'Return protocol updated successfully',
            protocol
        });
    }
    catch (error) {
        console.error('❌ Error updating return protocol:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});
// Delete handover protocol
router.delete('/handover/:id', async (req, res) => {
    try {
        const { id } = req.params;
        console.log('🗑️ Deleting handover protocol:', id);
        // For now, deletion is not implemented for safety
        // Could be implemented with proper authorization checks
        res.status(501).json({ error: 'Delete handover protocol not implemented for safety' });
    }
    catch (error) {
        console.error('❌ Error deleting handover protocol:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});
// Delete return protocol
router.delete('/return/:id', async (req, res) => {
    try {
        const { id } = req.params;
        console.log('🗑️ Deleting return protocol:', id);
        // For now, deletion is not implemented for safety
        // Could be implemented with proper authorization checks
        res.status(501).json({ error: 'Delete return protocol not implemented for safety' });
    }
    catch (error) {
        console.error('❌ Error deleting return protocol:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});
// Upload PDF to R2
router.post('/upload-pdf', upload.single('pdf'), async (req, res) => {
    try {
        const { protocolId } = req.body;
        if (!req.file) {
            return res.status(400).json({ error: 'No PDF file provided' });
        }
        if (!protocolId) {
            return res.status(400).json({ error: 'Protocol ID is required' });
        }
        console.log('📤 Uploading PDF to R2 for protocol:', protocolId);
        const url = await postgres_database_1.postgresDatabase.uploadProtocolPDF(protocolId, req.file.buffer);
        // Update protocol with PDF URL
        await postgres_database_1.postgresDatabase.updateReturnProtocol(protocolId, { pdfUrl: url });
        res.json({
            success: true,
            url: url,
            message: 'PDF uploaded successfully'
        });
    }
    catch (error) {
        console.error('❌ Error uploading PDF:', error);
        res.status(500).json({ error: 'Failed to upload PDF' });
    }
});
// Generate PDF for handover protocol
router.get('/handover/:id/pdf', async (req, res) => {
    try {
        const { id } = req.params;
        console.log('📄 Generating PDF for handover protocol:', id);
        const protocol = await postgres_database_1.postgresDatabase.getHandoverProtocolById(id);
        if (!protocol) {
            return res.status(404).json({ error: 'Handover protocol not found' });
        }
        // Generovanie PDF
        const pdfBuffer = await (0, pdf_generator_1.generateHandoverPDF)(protocol);
        // Nastavenie headers pre PDF download
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `inline; filename="handover_protocol_${id.slice(-8)}.pdf"`);
        res.setHeader('Content-Length', pdfBuffer.length);
        // Odoslanie PDF
        res.send(pdfBuffer);
        console.log('✅ PDF generated and sent for handover protocol:', id);
    }
    catch (error) {
        console.error('❌ Error generating PDF for handover protocol:', error);
        res.status(500).json({ error: 'Failed to generate PDF' });
    }
});
// Generate PDF for return protocol
router.get('/return/:id/pdf', async (req, res) => {
    try {
        const { id } = req.params;
        console.log('📄 Generating PDF for return protocol:', id);
        const protocol = await postgres_database_1.postgresDatabase.getReturnProtocolById(id);
        if (!protocol) {
            return res.status(404).json({ error: 'Return protocol not found' });
        }
        // Generovanie PDF
        const pdfBuffer = await (0, pdf_generator_1.generateReturnPDF)(protocol);
        // Nastavenie headers pre PDF download
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `inline; filename="return_protocol_${id.slice(-8)}.pdf"`);
        res.setHeader('Content-Length', pdfBuffer.length);
        // Odoslanie PDF
        res.send(pdfBuffer);
        console.log('✅ PDF generated and sent for return protocol:', id);
    }
    catch (error) {
        console.error('❌ Error generating PDF for return protocol:', error);
        res.status(500).json({ error: 'Failed to generate PDF' });
    }
});
// Download PDF as file
router.get('/handover/:id/download', async (req, res) => {
    try {
        const { id } = req.params;
        console.log('📥 Downloading PDF for handover protocol:', id);
        const protocol = await postgres_database_1.postgresDatabase.getHandoverProtocolById(id);
        if (!protocol) {
            return res.status(404).json({ error: 'Handover protocol not found' });
        }
        // Generovanie PDF
        const pdfBuffer = await (0, pdf_generator_1.generateHandoverPDF)(protocol);
        // Nastavenie headers pre PDF download
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename="handover_protocol_${id.slice(-8)}_${new Date().toISOString().split('T')[0]}.pdf"`);
        res.setHeader('Content-Length', pdfBuffer.length);
        // Odoslanie PDF
        res.send(pdfBuffer);
        console.log('✅ PDF downloaded for handover protocol:', id);
    }
    catch (error) {
        console.error('❌ Error downloading PDF for handover protocol:', error);
        res.status(500).json({ error: 'Failed to download PDF' });
    }
});
// Download PDF as file
router.get('/return/:id/download', async (req, res) => {
    try {
        const { id } = req.params;
        console.log('📥 Downloading PDF for return protocol:', id);
        const protocol = await postgres_database_1.postgresDatabase.getReturnProtocolById(id);
        if (!protocol) {
            return res.status(404).json({ error: 'Return protocol not found' });
        }
        // Generovanie PDF
        const pdfBuffer = await (0, pdf_generator_1.generateReturnPDF)(protocol);
        // Nastavenie headers pre PDF download
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename="return_protocol_${id.slice(-8)}_${new Date().toISOString().split('T')[0]}.pdf"`);
        res.setHeader('Content-Length', pdfBuffer.length);
        // Odoslanie PDF
        res.send(pdfBuffer);
        console.log('✅ PDF downloaded for return protocol:', id);
    }
    catch (error) {
        console.error('❌ Error downloading PDF for return protocol:', error);
        res.status(500).json({ error: 'Failed to download PDF' });
    }
});
exports.default = router;
//# sourceMappingURL=protocols.js.map