"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const postgres_database_1 = require("../models/postgres-database");
const auth_1 = require("../middleware/auth");
const uuid_1 = require("uuid");
const router = (0, express_1.Router)();
// GET /api/customers - Získanie všetkých zákazníkov
router.get('/', auth_1.authenticateToken, async (req, res) => {
    try {
        const customers = await postgres_database_1.postgresDatabase.getCustomers();
        res.json({
            success: true,
            data: customers
        });
    }
    catch (error) {
        console.error('Get customers error:', error);
        res.status(500).json({
            success: false,
            error: 'Chyba pri získavaní zákazníkov'
        });
    }
});
// POST /api/customers - Vytvorenie nového zákazníka
router.post('/', auth_1.authenticateToken, async (req, res) => {
    try {
        const { name, email, phone } = req.body;
        if (!name) {
            return res.status(400).json({
                success: false,
                error: 'Meno zákazníka je povinné'
            });
        }
        const newCustomer = {
            id: (0, uuid_1.v4)(),
            name,
            email: email || '',
            phone: phone || '',
            createdAt: new Date()
        };
        await postgres_database_1.postgresDatabase.createCustomer(newCustomer);
        res.status(201).json({
            success: true,
            message: 'Zákazník úspešne vytvorený',
            data: newCustomer
        });
    }
    catch (error) {
        console.error('Create customer error:', error);
        res.status(500).json({
            success: false,
            error: 'Chyba pri vytváraní zákazníka'
        });
    }
});
// PUT /api/customers/:id - Aktualizácia zákazníka
router.put('/:id', auth_1.authenticateToken, async (req, res) => {
    try {
        const { id } = req.params;
        const { name, email, phone } = req.body;
        if (!name) {
            return res.status(400).json({
                success: false,
                error: 'Meno zákazníka je povinné'
            });
        }
        const updatedCustomer = {
            id,
            name,
            email: email || '',
            phone: phone || '',
            createdAt: new Date()
        };
        await postgres_database_1.postgresDatabase.updateCustomer(updatedCustomer);
        res.json({
            success: true,
            message: 'Zákazník úspešne aktualizovaný',
            data: updatedCustomer
        });
    }
    catch (error) {
        console.error('Update customer error:', error);
        res.status(500).json({
            success: false,
            error: 'Chyba pri aktualizácii zákazníka'
        });
    }
});
// DELETE /api/customers/:id - Vymazanie zákazníka
router.delete('/:id', auth_1.authenticateToken, async (req, res) => {
    try {
        const { id } = req.params;
        await postgres_database_1.postgresDatabase.deleteCustomer(id);
        res.json({
            success: true,
            message: 'Zákazník úspešne vymazaný'
        });
    }
    catch (error) {
        console.error('Delete customer error:', error);
        res.status(500).json({
            success: false,
            error: 'Chyba pri vymazávaní zákazníka'
        });
    }
});
exports.default = router;
//# sourceMappingURL=customers.js.map