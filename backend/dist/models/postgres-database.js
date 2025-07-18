"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.postgresDatabase = exports.PostgresDatabase = void 0;
const pg_1 = require("pg");
const bcryptjs_1 = __importDefault(require("bcryptjs"));
class PostgresDatabase {
    constructor() {
        // Railway.app provides DATABASE_URL
        if (process.env.DATABASE_URL) {
            this.pool = new pg_1.Pool({
                connectionString: process.env.DATABASE_URL,
                ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
                max: 20,
                idleTimeoutMillis: 30000,
                connectionTimeoutMillis: 2000,
            });
        }
        else {
            // Local development or manual config
            this.pool = new pg_1.Pool({
                user: process.env.DB_USER || 'postgres',
                host: process.env.DB_HOST || 'localhost',
                database: process.env.DB_NAME || 'blackrent',
                password: process.env.DB_PASSWORD || 'password',
                port: parseInt(process.env.DB_PORT || '5432'),
                max: 20,
                idleTimeoutMillis: 30000,
                connectionTimeoutMillis: 2000,
            });
        }
        this.initTables();
    }
    async initTables() {
        const client = await this.pool.connect();
        try {
            // Tabuľka používateľov s hashovanými heslami
            await client.query(`
        CREATE TABLE IF NOT EXISTS users (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          username VARCHAR(50) UNIQUE NOT NULL,
          email VARCHAR(100) UNIQUE NOT NULL,
          password_hash VARCHAR(255) NOT NULL,
          role VARCHAR(30) DEFAULT 'user',
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
      `);
            // Tabuľka vozidiel
            await client.query(`
        CREATE TABLE IF NOT EXISTS vehicles (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          brand VARCHAR(100) NOT NULL,
          model VARCHAR(100) NOT NULL,
          license_plate VARCHAR(50) UNIQUE NOT NULL,
          company VARCHAR(100) NOT NULL,
          pricing JSONB NOT NULL,
          commission JSONB NOT NULL,
          status VARCHAR(30) DEFAULT 'available',
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
      `);
            // Tabuľka zákazníkov
            await client.query(`
        CREATE TABLE IF NOT EXISTS customers (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          name VARCHAR(100) NOT NULL,
          email VARCHAR(100),
          phone VARCHAR(30),
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
      `);
            // Tabuľka prenájmov
            await client.query(`
        CREATE TABLE IF NOT EXISTS rentals (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          vehicle_id UUID REFERENCES vehicles(id) ON DELETE SET NULL,
          customer_id UUID REFERENCES customers(id) ON DELETE SET NULL,
          customer_name VARCHAR(100) NOT NULL,
          start_date TIMESTAMP NOT NULL,
          end_date TIMESTAMP NOT NULL,
          total_price DECIMAL(10,2) NOT NULL,
          commission DECIMAL(10,2) NOT NULL,
          payment_method VARCHAR(50) NOT NULL,
          discount TEXT,
          custom_commission TEXT,
          extra_km_charge DECIMAL(10,2),
          paid BOOLEAN DEFAULT FALSE,
          status VARCHAR(30) DEFAULT 'pending',
          handover_place TEXT,
          confirmed BOOLEAN DEFAULT FALSE,
          payments JSONB,
          history JSONB,
          order_number VARCHAR(50),
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
      `);
            // Tabuľka nákladov
            await client.query(`
        CREATE TABLE IF NOT EXISTS expenses (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          description TEXT NOT NULL,
          amount DECIMAL(10,2) NOT NULL,
          date TIMESTAMP NOT NULL,
          vehicle_id UUID REFERENCES vehicles(id) ON DELETE SET NULL,
          company VARCHAR(100) NOT NULL,
          category VARCHAR(50) NOT NULL,
          note TEXT,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
      `);
            // Tabuľka poistiek
            await client.query(`
        CREATE TABLE IF NOT EXISTS insurances (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          vehicle_id UUID NOT NULL REFERENCES vehicles(id) ON DELETE CASCADE,
          type VARCHAR(50) NOT NULL,
          valid_from TIMESTAMP NOT NULL,
          valid_to TIMESTAMP NOT NULL,
          price DECIMAL(10,2) NOT NULL,
          company VARCHAR(100) NOT NULL,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
      `);
            // Tabuľka firiem
            await client.query(`
        CREATE TABLE IF NOT EXISTS companies (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          name VARCHAR(100) NOT NULL UNIQUE,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
      `);
            // Tabuľka poisťovní
            await client.query(`
        CREATE TABLE IF NOT EXISTS insurers (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          name VARCHAR(100) NOT NULL UNIQUE,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
      `);
            // Vytvorenie admin používateľa ak neexistuje
            await this.createDefaultAdmin(client);
            // Migrácie pre existujúce databázy - aktualizácia varchar limitov
            await this.runMigrations(client);
            console.log('✅ PostgreSQL tabuľky inicializované');
        }
        catch (error) {
            console.error('❌ Chyba pri inicializácii tabuliek:', error);
        }
        finally {
            client.release();
        }
    }
    async runMigrations(client) {
        try {
            console.log('🔄 Spúšťam databázové migrácie...');
            // Migrácia 1: Zvýšenie limitov varchar polí
            await client.query(`
        ALTER TABLE vehicles 
        ALTER COLUMN license_plate TYPE VARCHAR(50),
        ALTER COLUMN status TYPE VARCHAR(30);
      `);
            await client.query(`
        ALTER TABLE customers 
        ALTER COLUMN phone TYPE VARCHAR(30);
      `);
            await client.query(`
        ALTER TABLE users 
        ALTER COLUMN role TYPE VARCHAR(30);
      `);
            await client.query(`
        ALTER TABLE rentals 
        ALTER COLUMN status TYPE VARCHAR(30);
      `);
            console.log('✅ Databázové migrácie úspešne dokončené');
        }
        catch (error) {
            // Ignoruj chyby migrácie ak už boli aplikované
            if (error.message?.includes('cannot be cast automatically')) {
                console.log('⚠️ Migrácie už boli aplikované alebo nie sú potrebné');
            }
            else {
                console.log('⚠️ Migrácie preskočené:', error.message);
            }
        }
    }
    async createDefaultAdmin(client) {
        try {
            const adminExists = await client.query('SELECT id FROM users WHERE username = $1', ['admin']);
            if (adminExists.rows.length === 0) {
                const hashedPassword = await bcryptjs_1.default.hash('admin123', 12);
                await client.query('INSERT INTO users (username, email, password_hash, role) VALUES ($1, $2, $3, $4)', ['admin', 'admin@blackrent.sk', hashedPassword, 'admin']);
                console.log('👤 Admin používateľ vytvorený (username: admin, password: admin123)');
            }
        }
        catch (error) {
            console.error('Chyba pri vytváraní admin používateľa:', error);
        }
    }
    // Metódy pre používateľov
    async getUserByUsername(username) {
        const client = await this.pool.connect();
        try {
            const result = await client.query('SELECT id, username, email, password_hash, role, created_at FROM users WHERE username = $1', [username]);
            if (result.rows.length === 0)
                return null;
            const row = result.rows[0];
            return {
                id: row.id,
                username: row.username,
                email: row.email,
                password: row.password_hash, // Pre kompatibilitu s existujúcim kódom
                role: row.role,
                createdAt: row.created_at
            };
        }
        finally {
            client.release();
        }
    }
    async getUserById(id) {
        const client = await this.pool.connect();
        try {
            const result = await client.query('SELECT id, username, email, password_hash, role, created_at FROM users WHERE id = $1', [id]);
            if (result.rows.length === 0)
                return null;
            const row = result.rows[0];
            return {
                id: row.id,
                username: row.username,
                email: row.email,
                password: row.password_hash,
                role: row.role,
                createdAt: row.created_at
            };
        }
        finally {
            client.release();
        }
    }
    async createUser(user) {
        const client = await this.pool.connect();
        try {
            const hashedPassword = await bcryptjs_1.default.hash(user.password, 12);
            await client.query('INSERT INTO users (id, username, email, password_hash, role) VALUES ($1, $2, $3, $4, $5)', [user.id, user.username, user.email, hashedPassword, user.role]);
        }
        finally {
            client.release();
        }
    }
    async updateUser(user) {
        const client = await this.pool.connect();
        try {
            const hashedPassword = await bcryptjs_1.default.hash(user.password, 12);
            await client.query('UPDATE users SET username = $1, email = $2, password_hash = $3, role = $4, updated_at = CURRENT_TIMESTAMP WHERE id = $5', [user.username, user.email, hashedPassword, user.role, user.id]);
        }
        finally {
            client.release();
        }
    }
    async deleteUser(id) {
        const client = await this.pool.connect();
        try {
            await client.query('DELETE FROM users WHERE id = $1', [id]);
        }
        finally {
            client.release();
        }
    }
    async getUsers() {
        const client = await this.pool.connect();
        try {
            const result = await client.query('SELECT id, username, email, password_hash, role, created_at FROM users ORDER BY created_at DESC');
            return result.rows.map(row => ({
                id: row.id,
                username: row.username,
                email: row.email,
                password: row.password_hash,
                role: row.role,
                createdAt: row.created_at
            }));
        }
        finally {
            client.release();
        }
    }
    // Metódy pre vozidlá
    async getVehicles() {
        const client = await this.pool.connect();
        try {
            const result = await client.query('SELECT * FROM vehicles ORDER BY created_at DESC');
            return result.rows.map(row => ({
                ...row,
                id: row.id,
                licensePlate: row.license_plate, // Mapovanie column názvu
                pricing: typeof row.pricing === 'string' ? JSON.parse(row.pricing) : row.pricing, // Parsovanie JSON
                commission: typeof row.commission === 'string' ? JSON.parse(row.commission) : row.commission, // Parsovanie JSON
                createdAt: new Date(row.created_at)
            }));
        }
        finally {
            client.release();
        }
    }
    async getVehicle(id) {
        const client = await this.pool.connect();
        try {
            const result = await client.query('SELECT * FROM vehicles WHERE id = $1', [id]);
            if (result.rows.length === 0)
                return null;
            const row = result.rows[0];
            return {
                ...row,
                id: row.id,
                licensePlate: row.license_plate, // Mapovanie column názvu
                pricing: typeof row.pricing === 'string' ? JSON.parse(row.pricing) : row.pricing, // Parsovanie JSON
                commission: typeof row.commission === 'string' ? JSON.parse(row.commission) : row.commission, // Parsovanie JSON
                createdAt: new Date(row.created_at)
            };
        }
        finally {
            client.release();
        }
    }
    async createVehicle(vehicle) {
        const client = await this.pool.connect();
        try {
            // Automaticky vytvoriť company záznam ak neexistuje
            if (vehicle.company && vehicle.company.trim()) {
                await client.query('INSERT INTO companies (id, name) VALUES (gen_random_uuid(), $1) ON CONFLICT (name) DO NOTHING', [vehicle.company.trim()]);
            }
            await client.query('INSERT INTO vehicles (id, brand, model, license_plate, company, pricing, commission, status) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)', [
                vehicle.id,
                vehicle.brand,
                vehicle.model,
                vehicle.licensePlate,
                vehicle.company,
                JSON.stringify(vehicle.pricing), // Konverzia na JSON string
                JSON.stringify(vehicle.commission), // Konverzia na JSON string
                vehicle.status
            ]);
        }
        finally {
            client.release();
        }
    }
    async updateVehicle(vehicle) {
        const client = await this.pool.connect();
        try {
            // Automaticky vytvoriť company záznam ak neexistuje
            if (vehicle.company && vehicle.company.trim()) {
                await client.query('INSERT INTO companies (id, name) VALUES (gen_random_uuid(), $1) ON CONFLICT (name) DO NOTHING', [vehicle.company.trim()]);
            }
            await client.query('UPDATE vehicles SET brand = $1, model = $2, license_plate = $3, company = $4, pricing = $5, commission = $6, status = $7, updated_at = CURRENT_TIMESTAMP WHERE id = $8', [
                vehicle.brand,
                vehicle.model,
                vehicle.licensePlate,
                vehicle.company,
                JSON.stringify(vehicle.pricing), // Konverzia na JSON string
                JSON.stringify(vehicle.commission), // Konverzia na JSON string
                vehicle.status,
                vehicle.id
            ]);
        }
        finally {
            client.release();
        }
    }
    async deleteVehicle(id) {
        const client = await this.pool.connect();
        try {
            await client.query('DELETE FROM vehicles WHERE id = $1', [id]);
        }
        finally {
            client.release();
        }
    }
    // Metódy pre prenájmy
    async getRentals() {
        const client = await this.pool.connect();
        try {
            const result = await client.query(`
        SELECT r.*, v.brand, v.model, v.license_plate, v.company 
        FROM rentals r 
        LEFT JOIN vehicles v ON r.vehicle_id = v.id 
        ORDER BY r.created_at DESC
      `);
            return result.rows.map(row => ({
                id: row.id,
                vehicleId: row.vehicle_id,
                customerId: row.customer_id,
                customerName: row.customer_name,
                startDate: new Date(row.start_date),
                endDate: new Date(row.end_date),
                totalPrice: parseFloat(row.total_price) || 0,
                commission: parseFloat(row.commission) || 0,
                paymentMethod: row.payment_method,
                discount: row.discount ? (typeof row.discount === 'string' ? JSON.parse(row.discount) : row.discount) : undefined,
                customCommission: row.custom_commission ? (typeof row.custom_commission === 'string' ? JSON.parse(row.custom_commission) : row.custom_commission) : undefined,
                extraKmCharge: row.extra_km_charge ? parseFloat(row.extra_km_charge) : undefined,
                paid: row.paid,
                status: row.status,
                handoverPlace: row.handover_place,
                confirmed: row.confirmed,
                payments: row.payments ? (typeof row.payments === 'string' ? JSON.parse(row.payments) : row.payments) : undefined,
                history: row.history ? (typeof row.history === 'string' ? JSON.parse(row.history) : row.history) : undefined,
                orderNumber: row.order_number,
                createdAt: new Date(row.created_at),
                // Vehicle objekt z JOIN
                vehicle: {
                    id: row.vehicle_id,
                    brand: row.brand,
                    model: row.model,
                    licensePlate: row.license_plate,
                    company: row.company || 'N/A', // Teraz dostupné z JOIN
                    pricing: [], // Nedostupné z tohto JOIN
                    commission: { type: 'percentage', value: 20 }, // Default
                    status: 'available' // Default
                }
            }));
        }
        finally {
            client.release();
        }
    }
    async createRental(rental) {
        const client = await this.pool.connect();
        try {
            // Validácia UUID pre vehicleId a customerId
            const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
            const validVehicleId = rental.vehicleId && uuidRegex.test(rental.vehicleId) ? rental.vehicleId : null;
            const validCustomerId = rental.customerId && uuidRegex.test(rental.customerId) ? rental.customerId : null;
            await client.query(`
        INSERT INTO rentals (
          id, vehicle_id, customer_id, customer_name, start_date, end_date, 
          total_price, commission, payment_method, discount, custom_commission, 
          extra_km_charge, paid, status, handover_place, confirmed, payments, history, order_number
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19)
      `, [
                rental.id,
                validVehicleId,
                validCustomerId,
                rental.customerName,
                rental.startDate,
                rental.endDate,
                rental.totalPrice,
                rental.commission,
                rental.paymentMethod,
                rental.discount ? JSON.stringify(rental.discount) : null, // Konverzia na JSON
                rental.customCommission ? JSON.stringify(rental.customCommission) : null, // Konverzia na JSON
                rental.extraKmCharge,
                rental.paid,
                rental.status,
                rental.handoverPlace,
                rental.confirmed,
                rental.payments ? JSON.stringify(rental.payments) : null, // Konverzia na JSON
                rental.history ? JSON.stringify(rental.history) : null, // Konverzia na JSON
                rental.orderNumber
            ]);
        }
        finally {
            client.release();
        }
    }
    async getRental(id) {
        const client = await this.pool.connect();
        try {
            const result = await client.query(`
        SELECT r.*, v.brand, v.model, v.license_plate, v.company 
        FROM rentals r 
        LEFT JOIN vehicles v ON r.vehicle_id = v.id 
        WHERE r.id = $1
      `, [id]);
            if (result.rows.length === 0)
                return null;
            const row = result.rows[0];
            return {
                id: row.id,
                vehicleId: row.vehicle_id,
                customerId: row.customer_id,
                customerName: row.customer_name,
                startDate: new Date(row.start_date),
                endDate: new Date(row.end_date),
                totalPrice: parseFloat(row.total_price) || 0,
                commission: parseFloat(row.commission) || 0,
                paymentMethod: row.payment_method,
                discount: row.discount ? (typeof row.discount === 'string' ? JSON.parse(row.discount) : row.discount) : undefined,
                customCommission: row.custom_commission ? (typeof row.custom_commission === 'string' ? JSON.parse(row.custom_commission) : row.custom_commission) : undefined,
                extraKmCharge: row.extra_km_charge ? parseFloat(row.extra_km_charge) : undefined,
                paid: row.paid,
                status: row.status,
                handoverPlace: row.handover_place,
                confirmed: row.confirmed,
                payments: row.payments ? (typeof row.payments === 'string' ? JSON.parse(row.payments) : row.payments) : undefined,
                history: row.history ? (typeof row.history === 'string' ? JSON.parse(row.history) : row.history) : undefined,
                orderNumber: row.order_number,
                createdAt: new Date(row.created_at),
                vehicle: {
                    id: row.vehicle_id,
                    brand: row.brand,
                    model: row.model,
                    licensePlate: row.license_plate,
                    company: row.company || 'N/A',
                    pricing: [],
                    commission: { type: 'percentage', value: 0 },
                    status: 'available'
                }
            };
        }
        finally {
            client.release();
        }
    }
    async updateRental(rental) {
        const client = await this.pool.connect();
        try {
            await client.query(`
        UPDATE rentals SET 
          vehicle_id = $1, customer_id = $2, customer_name = $3, start_date = $4, end_date = $5,
          total_price = $6, commission = $7, payment_method = $8, discount = $9, custom_commission = $10,
          extra_km_charge = $11, paid = $12, status = $13, handover_place = $14, confirmed = $15,
          payments = $16, history = $17, order_number = $18, updated_at = CURRENT_TIMESTAMP
        WHERE id = $19
      `, [
                rental.vehicleId,
                rental.customerId,
                rental.customerName,
                rental.startDate,
                rental.endDate,
                rental.totalPrice,
                rental.commission,
                rental.paymentMethod,
                rental.discount ? JSON.stringify(rental.discount) : null, // Konverzia na JSON
                rental.customCommission ? JSON.stringify(rental.customCommission) : null, // Konverzia na JSON
                rental.extraKmCharge,
                rental.paid,
                rental.status,
                rental.handoverPlace,
                rental.confirmed,
                rental.payments ? JSON.stringify(rental.payments) : null, // Konverzia na JSON
                rental.history ? JSON.stringify(rental.history) : null, // Konverzia na JSON
                rental.orderNumber,
                rental.id
            ]);
        }
        finally {
            client.release();
        }
    }
    async deleteRental(id) {
        const client = await this.pool.connect();
        try {
            await client.query('DELETE FROM rentals WHERE id = $1', [id]);
        }
        finally {
            client.release();
        }
    }
    // Metódy pre zákazníkov
    async getCustomers() {
        const client = await this.pool.connect();
        try {
            const result = await client.query('SELECT * FROM customers ORDER BY created_at DESC');
            return result.rows.map(row => ({
                ...row,
                id: row.id,
                createdAt: new Date(row.created_at)
            }));
        }
        finally {
            client.release();
        }
    }
    async createCustomer(customer) {
        const client = await this.pool.connect();
        try {
            await client.query('INSERT INTO customers (id, name, email, phone) VALUES ($1, $2, $3, $4)', [customer.id, customer.name, customer.email, customer.phone]);
        }
        finally {
            client.release();
        }
    }
    async updateCustomer(customer) {
        const client = await this.pool.connect();
        try {
            await client.query('UPDATE customers SET name = $1, email = $2, phone = $3, updated_at = CURRENT_TIMESTAMP WHERE id = $4', [customer.name, customer.email, customer.phone, customer.id]);
        }
        finally {
            client.release();
        }
    }
    async deleteCustomer(id) {
        const client = await this.pool.connect();
        try {
            await client.query('DELETE FROM customers WHERE id = $1', [id]);
        }
        finally {
            client.release();
        }
    }
    // Metódy pre náklady
    async getExpenses() {
        const client = await this.pool.connect();
        try {
            const result = await client.query('SELECT * FROM expenses ORDER BY date DESC');
            return result.rows.map(row => ({
                id: row.id,
                description: row.description,
                amount: parseFloat(row.amount) || 0,
                date: new Date(row.date),
                vehicleId: row.vehicle_id,
                company: row.company,
                category: row.category,
                note: row.note,
                createdAt: new Date(row.created_at)
            }));
        }
        finally {
            client.release();
        }
    }
    async createExpense(expense) {
        const client = await this.pool.connect();
        try {
            // Automaticky vytvoriť company záznam ak neexistuje
            if (expense.company && expense.company.trim()) {
                await client.query('INSERT INTO companies (id, name) VALUES (gen_random_uuid(), $1) ON CONFLICT (name) DO NOTHING', [expense.company.trim()]);
            }
            await client.query('INSERT INTO expenses (id, description, amount, date, vehicle_id, company, category, note, created_at) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, CURRENT_TIMESTAMP)', [
                expense.id,
                expense.description,
                expense.amount,
                expense.date,
                expense.vehicleId,
                expense.company,
                expense.category,
                expense.note
            ]);
        }
        finally {
            client.release();
        }
    }
    async updateExpense(expense) {
        const client = await this.pool.connect();
        try {
            // Automaticky vytvoriť company záznam ak neexistuje
            if (expense.company && expense.company.trim()) {
                await client.query('INSERT INTO companies (id, name) VALUES (gen_random_uuid(), $1) ON CONFLICT (name) DO NOTHING', [expense.company.trim()]);
            }
            await client.query('UPDATE expenses SET description = $1, amount = $2, date = $3, vehicle_id = $4, company = $5, category = $6, note = $7, updated_at = CURRENT_TIMESTAMP WHERE id = $8', [
                expense.description,
                expense.amount,
                expense.date,
                expense.vehicleId,
                expense.company,
                expense.category,
                expense.note,
                expense.id
            ]);
        }
        finally {
            client.release();
        }
    }
    async deleteExpense(id) {
        const client = await this.pool.connect();
        try {
            await client.query('DELETE FROM expenses WHERE id = $1', [id]);
        }
        finally {
            client.release();
        }
    }
    // Metódy pre poistky
    async getInsurances() {
        const client = await this.pool.connect();
        try {
            const result = await client.query('SELECT * FROM insurances ORDER BY created_at DESC');
            return result.rows.map(row => ({
                id: row.id,
                vehicleId: row.vehicle_id,
                type: row.type,
                validFrom: new Date(row.valid_from),
                validTo: new Date(row.valid_to),
                price: parseFloat(row.price) || 0,
                company: row.company,
                createdAt: new Date(row.created_at)
            }));
        }
        finally {
            client.release();
        }
    }
    async createInsurance(insurance) {
        const client = await this.pool.connect();
        try {
            await client.query('INSERT INTO insurances (id, vehicle_id, type, valid_from, valid_to, price, company) VALUES ($1, $2, $3, $4, $5, $6, $7)', [insurance.id, insurance.vehicleId, insurance.type, insurance.validFrom, insurance.validTo, insurance.price, insurance.company]);
        }
        finally {
            client.release();
        }
    }
    // Metódy pre firmy
    async getCompanies() {
        const client = await this.pool.connect();
        try {
            const result = await client.query('SELECT * FROM companies ORDER BY name');
            return result.rows.map(row => ({
                ...row,
                id: row.id,
                createdAt: new Date(row.created_at)
            }));
        }
        finally {
            client.release();
        }
    }
    async createCompany(company) {
        const client = await this.pool.connect();
        try {
            await client.query('INSERT INTO companies (id, name) VALUES ($1, $2)', [company.id, company.name]);
        }
        finally {
            client.release();
        }
    }
    async deleteCompany(id) {
        const client = await this.pool.connect();
        try {
            await client.query('DELETE FROM companies WHERE id = $1', [id]);
        }
        finally {
            client.release();
        }
    }
    // Metódy pre poisťovne
    async getInsurers() {
        const client = await this.pool.connect();
        try {
            const result = await client.query('SELECT * FROM insurers ORDER BY name');
            return result.rows.map(row => ({
                ...row,
                id: row.id,
                createdAt: new Date(row.created_at)
            }));
        }
        finally {
            client.release();
        }
    }
    async createInsurer(insurer) {
        const client = await this.pool.connect();
        try {
            await client.query('INSERT INTO insurers (id, name) VALUES ($1, $2)', [insurer.id, insurer.name]);
        }
        finally {
            client.release();
        }
    }
    async deleteInsurer(id) {
        const client = await this.pool.connect();
        try {
            await client.query('DELETE FROM insurers WHERE id = $1', [id]);
        }
        finally {
            client.release();
        }
    }
    // Zatvorenie spojenia
    async close() {
        await this.pool.end();
    }
}
exports.PostgresDatabase = PostgresDatabase;
exports.postgresDatabase = new PostgresDatabase();
//# sourceMappingURL=postgres-database.js.map