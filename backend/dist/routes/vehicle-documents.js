"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const postgres_database_1 = require("../models/postgres-database");
const auth_1 = require("../middleware/auth");
const router = (0, express_1.Router)();
// GET /api/vehicle-documents - Získanie všetkých dokumentov vozidiel alebo pre konkrétne vozidlo
router.get('/', auth_1.authenticateToken, async (req, res) => {
    try {
        const { vehicleId } = req.query;
        const documents = await postgres_database_1.postgresDatabase.getVehicleDocuments(vehicleId);
        res.json({
            success: true,
            data: documents
        });
    }
    catch (error) {
        console.error('Get vehicle documents error:', error);
        res.status(500).json({
            success: false,
            error: 'Chyba pri získavaní dokumentov vozidiel'
        });
    }
});
// POST /api/vehicle-documents - Vytvorenie nového dokumentu vozidla
router.post('/', auth_1.authenticateToken, async (req, res) => {
    try {
        const { vehicleId, documentType, validFrom, validTo, documentNumber, price, notes, filePath } = req.body;
        if (!vehicleId || !documentType || !validTo) {
            return res.status(400).json({
                success: false,
                error: 'vehicleId, documentType a validTo sú povinné polia'
            });
        }
        const createdDocument = await postgres_database_1.postgresDatabase.createVehicleDocument({
            vehicleId,
            documentType,
            validFrom: validFrom ? new Date(validFrom) : undefined,
            validTo: new Date(validTo),
            documentNumber,
            price,
            notes,
            filePath
        });
        res.status(201).json({
            success: true,
            message: 'Dokument vozidla úspešne vytvorený',
            data: createdDocument
        });
    }
    catch (error) {
        console.error('Create vehicle document error:', error);
        res.status(500).json({
            success: false,
            error: 'Chyba pri vytváraní dokumentu vozidla'
        });
    }
});
// PUT /api/vehicle-documents/:id - Aktualizácia dokumentu vozidla
router.put('/:id', auth_1.authenticateToken, async (req, res) => {
    try {
        const { id } = req.params;
        const { vehicleId, documentType, validFrom, validTo, documentNumber, price, notes, filePath } = req.body;
        if (!vehicleId || !documentType || !validTo) {
            return res.status(400).json({
                success: false,
                error: 'vehicleId, documentType a validTo sú povinné polia'
            });
        }
        const updatedDocument = await postgres_database_1.postgresDatabase.updateVehicleDocument(id, {
            vehicleId,
            documentType,
            validFrom: validFrom ? new Date(validFrom) : undefined,
            validTo: new Date(validTo),
            documentNumber,
            price,
            notes,
            filePath
        });
        res.json({
            success: true,
            message: 'Dokument vozidla úspešne aktualizovaný',
            data: updatedDocument
        });
    }
    catch (error) {
        console.error('Update vehicle document error:', error);
        res.status(500).json({
            success: false,
            error: 'Chyba pri aktualizácii dokumentu vozidla'
        });
    }
});
// DELETE /api/vehicle-documents/:id - Vymazanie dokumentu vozidla
router.delete('/:id', auth_1.authenticateToken, async (req, res) => {
    try {
        const { id } = req.params;
        await postgres_database_1.postgresDatabase.deleteVehicleDocument(id);
        res.json({
            success: true,
            message: 'Dokument vozidla úspešne vymazaný'
        });
    }
    catch (error) {
        console.error('Delete vehicle document error:', error);
        res.status(500).json({
            success: false,
            error: 'Chyba pri vymazávaní dokumentu vozidla'
        });
    }
});
exports.default = router;
//# sourceMappingURL=vehicle-documents.js.map