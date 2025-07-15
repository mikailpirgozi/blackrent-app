"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const postgres_database_1 = require("../models/postgres-database");
const auth_1 = require("../middleware/auth");
const uuid_1 = require("uuid");
const router = (0, express_1.Router)();
const JWT_SECRET = process.env.JWT_SECRET || 'blackrent-secret-key-2024';
// POST /api/auth/login - Prihlásenie
router.post('/login', async (req, res) => {
    try {
        const { username, password } = req.body;
        if (!username || !password) {
            return res.status(400).json({
                success: false,
                error: 'Používateľské meno a heslo sú povinné'
            });
        }
        // Nájdi používateľa
        const user = await postgres_database_1.postgresDatabase.getUserByUsername(username);
        if (!user) {
            return res.status(401).json({
                success: false,
                error: 'Nesprávne prihlasovacie údaje'
            });
        }
        // Overenie hesla pomocou bcrypt
        const isPasswordValid = await bcryptjs_1.default.compare(password, user.password);
        if (!isPasswordValid) {
            return res.status(401).json({
                success: false,
                error: 'Nesprávne prihlasovacie údaje'
            });
        }
        // Vytvorenie JWT tokenu
        const token = jsonwebtoken_1.default.sign({
            userId: user.id,
            username: user.username,
            role: user.role
        }, JWT_SECRET, { expiresIn: '30d' });
        // Odpoveď bez hesla
        const userWithoutPassword = {
            id: user.id,
            username: user.username,
            email: user.email,
            role: user.role,
            createdAt: user.createdAt
        };
        res.json({
            success: true,
            user: userWithoutPassword,
            token,
            message: 'Úspešné prihlásenie'
        });
    }
    catch (error) {
        console.error('Login error:', error);
        res.status(500).json({
            success: false,
            error: 'Chyba pri prihlásení'
        });
    }
});
// POST /api/auth/logout - Odhlásenie
router.post('/logout', auth_1.authenticateToken, (req, res) => {
    // V JWT systéme sa token neodstraňuje zo servera
    // Klient musí odstrániť token zo svojho úložiska
    res.json({
        success: true,
        message: 'Úspešné odhlásenie'
    });
});
// GET /api/auth/me - Získanie informácií o aktuálnom používateľovi
router.get('/me', auth_1.authenticateToken, (req, res) => {
    res.json({
        success: true,
        data: req.user
    });
});
// GET /api/auth/users - Získanie všetkých používateľov (len admin)
router.get('/users', auth_1.authenticateToken, (0, auth_1.requireRole)(['admin']), async (req, res) => {
    try {
        const users = await postgres_database_1.postgresDatabase.getUsers();
        const usersWithoutPasswords = users.map(user => ({
            id: user.id,
            username: user.username,
            email: user.email,
            role: user.role,
            createdAt: user.createdAt
        }));
        res.json({
            success: true,
            data: usersWithoutPasswords
        });
    }
    catch (error) {
        console.error('Get users error:', error);
        res.status(500).json({
            success: false,
            error: 'Chyba pri získavaní používateľov'
        });
    }
});
// POST /api/auth/users - Vytvorenie nového používateľa (len admin)
router.post('/users', auth_1.authenticateToken, (0, auth_1.requireRole)(['admin']), async (req, res) => {
    try {
        const { username, email, password, role } = req.body;
        if (!username || !email || !password || !role) {
            return res.status(400).json({
                success: false,
                error: 'Všetky povinné polia musia byť vyplnené'
            });
        }
        // Skontroluj, či používateľ už existuje
        const existingUser = await postgres_database_1.postgresDatabase.getUserByUsername(username);
        if (existingUser) {
            return res.status(409).json({
                success: false,
                error: 'Používateľ s týmto menom už existuje'
            });
        }
        const newUser = {
            id: (0, uuid_1.v4)(),
            username,
            email,
            password, // Bude zahashované v databáze
            role,
            createdAt: new Date()
        };
        await postgres_database_1.postgresDatabase.createUser(newUser);
        res.status(201).json({
            success: true,
            message: 'Používateľ úspešne vytvorený'
        });
    }
    catch (error) {
        console.error('Create user error:', error);
        res.status(500).json({
            success: false,
            error: 'Chyba pri vytváraní používateľa'
        });
    }
});
// PUT /api/auth/users/:id - Aktualizácia používateľa (len admin)
router.put('/users/:id', auth_1.authenticateToken, (0, auth_1.requireRole)(['admin']), async (req, res) => {
    try {
        const { id } = req.params;
        const { username, email, password, role } = req.body;
        // Nájdi existujúceho používateľa
        const existingUser = await postgres_database_1.postgresDatabase.getUserById(id);
        if (!existingUser) {
            return res.status(404).json({
                success: false,
                error: 'Používateľ nenájdený'
            });
        }
        const updatedUser = {
            id,
            username: username || existingUser.username,
            email: email || existingUser.email,
            password: password || existingUser.password,
            role: role || existingUser.role,
            createdAt: existingUser.createdAt
        };
        await postgres_database_1.postgresDatabase.updateUser(updatedUser);
        res.json({
            success: true,
            message: 'Používateľ úspešne aktualizovaný'
        });
    }
    catch (error) {
        console.error('Update user error:', error);
        res.status(500).json({
            success: false,
            error: 'Chyba pri aktualizácii používateľa'
        });
    }
});
// DELETE /api/auth/users/:id - Vymazanie používateľa (len admin)
router.delete('/users/:id', auth_1.authenticateToken, (0, auth_1.requireRole)(['admin']), async (req, res) => {
    try {
        const { id } = req.params;
        // Skontroluj, či používateľ existuje
        const existingUser = await postgres_database_1.postgresDatabase.getUserById(id);
        if (!existingUser) {
            return res.status(404).json({
                success: false,
                error: 'Používateľ nenájdený'
            });
        }
        await postgres_database_1.postgresDatabase.deleteUser(id);
        res.json({
            success: true,
            message: 'Používateľ úspešne vymazaný'
        });
    }
    catch (error) {
        console.error('Delete user error:', error);
        res.status(500).json({
            success: false,
            error: 'Chyba pri vymazávaní používateľa'
        });
    }
});
// POST /api/auth/change-password - Zmena hesla
router.post('/change-password', auth_1.authenticateToken, async (req, res) => {
    try {
        const { currentPassword, newPassword } = req.body;
        const userId = req.user.id;
        if (!currentPassword || !newPassword) {
            return res.status(400).json({
                success: false,
                error: 'Súčasné heslo a nové heslo sú povinné'
            });
        }
        if (newPassword.length < 6) {
            return res.status(400).json({
                success: false,
                error: 'Nové heslo musí mať aspoň 6 znakov'
            });
        }
        // Získaj aktuálneho používateľa
        const user = await postgres_database_1.postgresDatabase.getUserById(userId);
        if (!user) {
            return res.status(404).json({
                success: false,
                error: 'Používateľ nenájdený'
            });
        }
        // Over súčasné heslo
        const isCurrentPasswordValid = await bcryptjs_1.default.compare(currentPassword, user.password);
        if (!isCurrentPasswordValid) {
            return res.status(400).json({
                success: false,
                error: 'Súčasné heslo je nesprávne'
            });
        }
        // Aktualizuj heslo
        const updatedUser = {
            ...user,
            password: newPassword // Bude zahashované v databáze
        };
        await postgres_database_1.postgresDatabase.updateUser(updatedUser);
        res.json({
            success: true,
            message: 'Heslo úspešne zmenené'
        });
    }
    catch (error) {
        console.error('Change password error:', error);
        res.status(500).json({
            success: false,
            error: 'Chyba pri zmene hesla'
        });
    }
});
exports.default = router;
//# sourceMappingURL=auth.js.map