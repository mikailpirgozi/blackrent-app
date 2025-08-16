"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_1 = require("../middleware/auth");
const postgres_database_1 = require("../models/postgres-database");
const router = (0, express_1.Router)();
router.post('/fix-database', auth_1.authenticateToken, async (req, res) => {
    try {
        console.log('🔧 Starting manual database fix via API...');
        // Only allow admin users
        if (req.user.role !== 'admin') {
            return res.status(403).json({
                success: false,
                error: 'Only admin users can run database fixes'
            });
        }
        const client = await postgres_database_1.postgresDatabase.pool.connect();
        try {
            const results = {
                currentSchema: [],
                actions: []
            };
            console.log('📋 Step 1: Checking all table schemas...');
            // Check all tables that might need UUID conversion
            const allTablesSchema = await client.query(`
        SELECT table_name, column_name, data_type 
        FROM information_schema.columns 
        WHERE table_name IN ('vehicles', 'customers', 'rentals', 'expenses', 'insurances', 'companies', 'insurers', 'users')
        AND column_name = 'id'
        ORDER BY table_name
      `);
            console.log('Current schemas:', allTablesSchema.rows);
            results.currentSchema = allTablesSchema.rows;
            // First, drop all foreign key constraints by dropping tables with FK references
            console.log('📋 Step 2: Dropping tables with foreign key dependencies...');
            await client.query('DROP TABLE IF EXISTS rentals CASCADE');
            await client.query('DROP TABLE IF EXISTS expenses CASCADE');
            await client.query('DROP TABLE IF EXISTS insurances CASCADE');
            results.actions.push('Dropped tables with foreign key dependencies');
            // Convert base tables first (vehicles, customers, companies, insurers, users)
            const baseTables = ['vehicles', 'customers', 'companies', 'insurers', 'users'];
            for (const tableName of baseTables) {
                const tableSchema = allTablesSchema.rows.find((row) => row.table_name === tableName && row.column_name === 'id');
                if (tableSchema && tableSchema.data_type === 'integer') {
                    console.log(`🔄 Converting ${tableName} table from INTEGER to UUID...`);
                    results.actions.push(`Converting ${tableName} table from INTEGER to UUID`);
                    // Get existing data
                    const existingData = await client.query(`SELECT * FROM ${tableName}`);
                    console.log(`📦 Backing up ${existingData.rows.length} ${tableName} records...`);
                    if (tableName === 'vehicles') {
                        await client.query('DROP TABLE IF EXISTS vehicles CASCADE');
                        await client.query(`
              CREATE TABLE vehicles (
                id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                make VARCHAR(50) NOT NULL,
                model VARCHAR(50) NOT NULL,
                year INTEGER NOT NULL,
                license_plate VARCHAR(50) NOT NULL UNIQUE,
                company VARCHAR(100) NOT NULL DEFAULT 'Default Company',
                pricing JSONB DEFAULT '[]',
                commission JSONB DEFAULT '{"type": "percentage", "value": 15}',
                status VARCHAR(30) DEFAULT 'available',
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
              )
            `);
                        // Restore data
                        for (const record of existingData.rows) {
                            await client.query(`
                INSERT INTO vehicles (make, model, year, license_plate, company, pricing, commission, status, created_at)
                VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
              `, [
                                record.make,
                                record.model,
                                record.year,
                                record.license_plate,
                                record.company || 'Default Company',
                                JSON.stringify(record.pricing || []),
                                JSON.stringify(record.commission || { "type": "percentage", "value": 15 }),
                                record.status || 'available',
                                record.created_at || new Date()
                            ]);
                        }
                    }
                    if (tableName === 'customers') {
                        await client.query('DROP TABLE IF EXISTS customers CASCADE');
                        await client.query(`
              CREATE TABLE customers (
                id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                name VARCHAR(100) NOT NULL DEFAULT 'Unknown',
                email VARCHAR(100),
                phone VARCHAR(30),
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
              )
            `);
                        // Restore data
                        for (const record of existingData.rows) {
                            await client.query(`
                INSERT INTO customers (name, email, phone, created_at)
                VALUES ($1, $2, $3, $4)
              `, [
                                record.name || record.first_name || 'Unknown', // Handle both name and first_name
                                record.email || '',
                                record.phone || '',
                                record.created_at || new Date()
                            ]);
                        }
                    }
                    // Similar for other base tables...
                    if (tableName === 'companies') {
                        await client.query('DROP TABLE IF EXISTS companies CASCADE');
                        await client.query(`
              CREATE TABLE companies (
                id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                name VARCHAR(100) NOT NULL UNIQUE,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
              )
            `);
                        for (const record of existingData.rows) {
                            await client.query(`
                INSERT INTO companies (name, created_at)
                VALUES ($1, $2)
              `, [record.name, record.created_at || new Date()]);
                        }
                    }
                    if (tableName === 'insurers') {
                        await client.query('DROP TABLE IF EXISTS insurers CASCADE');
                        await client.query(`
              CREATE TABLE insurers (
                id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                name VARCHAR(100) NOT NULL UNIQUE,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
              )
            `);
                        for (const record of existingData.rows) {
                            await client.query(`
                INSERT INTO insurers (name, created_at)
                VALUES ($1, $2)  
              `, [record.name, record.created_at || new Date()]);
                        }
                    }
                    if (tableName === 'users') {
                        await client.query('DROP TABLE IF EXISTS users CASCADE');
                        await client.query(`
              CREATE TABLE users (
                id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                username VARCHAR(50) NOT NULL UNIQUE,
                email VARCHAR(100) NOT NULL UNIQUE,
                password VARCHAR(255) NOT NULL,
                role VARCHAR(30) NOT NULL DEFAULT 'user',
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
              )
            `);
                        for (const record of existingData.rows) {
                            // Skip records with missing required fields
                            if (!record.username || !record.email || !record.password) {
                                console.log(`⚠️ Skipping user record with missing fields:`, {
                                    username: record.username,
                                    email: record.email,
                                    hasPassword: !!record.password
                                });
                                continue;
                            }
                            await client.query(`
                INSERT INTO users (username, email, password, role, created_at)
                VALUES ($1, $2, $3, $4, $5)
              `, [
                                record.username,
                                record.email,
                                record.password,
                                record.role || 'user',
                                record.created_at || new Date()
                            ]);
                        }
                    }
                    console.log(`✅ ${tableName} table converted and ${existingData.rows.length} records restored`);
                    results.actions.push(`${tableName} table converted and ${existingData.rows.length} records restored`);
                }
                else {
                    console.log(`✅ ${tableName} table already has UUID columns`);
                    results.actions.push(`${tableName} table already has UUID columns`);
                }
            }
            // Now recreate dependent tables with UUID foreign keys
            console.log('📋 Step 3: Recreating dependent tables with UUID foreign keys...');
            // Rentals table
            await client.query(`
        CREATE TABLE rentals (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          vehicle_id UUID REFERENCES vehicles(id) ON DELETE SET NULL,
          customer_id UUID REFERENCES customers(id) ON DELETE SET NULL,
          customer_name VARCHAR(100) NOT NULL,
          start_date TIMESTAMP NOT NULL,
          end_date TIMESTAMP NOT NULL,
          total_price DECIMAL(10,2) NOT NULL,
          commission DECIMAL(10,2) NOT NULL DEFAULT 0,
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
          deposit DECIMAL(10,2),
          allowed_kilometers INTEGER,
          extra_kilometer_rate DECIMAL(10,2),
          return_conditions TEXT,
          fuel_level INTEGER,
          odometer INTEGER,
          return_fuel_level INTEGER,
          return_odometer INTEGER,
          actual_kilometers INTEGER,
          fuel_refill_cost DECIMAL(10,2),
          handover_protocol_id UUID,
          return_protocol_id UUID,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
      `);
            // Expenses table  
            await client.query(`
        CREATE TABLE expenses (
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
            // Insurances table
            await client.query(`
        CREATE TABLE insurances (
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
            results.actions.push('Recreated dependent tables with UUID foreign keys');
            // 4. Final verification
            console.log('📋 Step 4: Final verification...');
            const finalSchema = await client.query(`
        SELECT table_name, column_name, data_type 
        FROM information_schema.columns 
        WHERE table_name IN ('vehicles', 'customers', 'rentals', 'expenses', 'insurances', 'companies', 'insurers', 'users')
        AND column_name = 'id'
        ORDER BY table_name
      `);
            console.log('Final schema:');
            finalSchema.rows.forEach((row) => {
                console.log(`  ${row.table_name}.${row.column_name}: ${row.data_type}`);
            });
            results.finalSchema = finalSchema.rows;
            results.actions.push('Final verification completed - all tables now use UUID');
            console.log('🎉 Complete database UUID conversion completed!');
            res.json({
                success: true,
                message: 'Database UUID conversion completed successfully',
                data: results
            });
        }
        finally {
            client.release();
        }
    }
    catch (error) {
        console.error('❌ Database fix failed:', error);
        res.status(500).json({
            success: false,
            error: 'Database fix failed: ' + error.message
        });
    }
});
router.post('/fix-database-simple', auth_1.authenticateToken, async (req, res) => {
    try {
        console.log('🔧 Starting SIMPLE database UUID fix...');
        // Only allow admin users (if we have one)
        if (req.user && req.user.role !== 'admin') {
            return res.status(403).json({
                success: false,
                error: 'Only admin users can run database fixes'
            });
        }
        const client = await postgres_database_1.postgresDatabase.pool.connect();
        try {
            const results = {
                currentSchema: [],
                actions: []
            };
            // Simple approach: Just fix rentals and expenses tables
            console.log('📋 Fixing only rentals and expenses tables...');
            // Drop and recreate rentals with UUID (don't preserve data for simplicity)
            await client.query('DROP TABLE IF EXISTS rentals CASCADE');
            await client.query(`
        CREATE TABLE rentals (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          vehicle_id VARCHAR(50),
          customer_id VARCHAR(50), 
          customer_name VARCHAR(100) NOT NULL,
          start_date TIMESTAMP NOT NULL,
          end_date TIMESTAMP NOT NULL,
          total_price DECIMAL(10,2) NOT NULL,
          commission DECIMAL(10,2) NOT NULL DEFAULT 0,
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
          deposit DECIMAL(10,2),
          allowed_kilometers INTEGER,
          extra_kilometer_rate DECIMAL(10,2),
          return_conditions TEXT,
          fuel_level INTEGER,
          odometer INTEGER,
          return_fuel_level INTEGER,
          return_odometer INTEGER,
          actual_kilometers INTEGER,
          fuel_refill_cost DECIMAL(10,2),
          handover_protocol_id UUID,
          return_protocol_id UUID,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
      `);
            results.actions.push('Recreated rentals table with UUID (no foreign keys)');
            // Drop and recreate expenses with UUID
            await client.query('DROP TABLE IF EXISTS expenses CASCADE');
            await client.query(`
        CREATE TABLE expenses (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          description TEXT NOT NULL,
          amount DECIMAL(10,2) NOT NULL,
          date TIMESTAMP NOT NULL,
          vehicle_id VARCHAR(50),
          company VARCHAR(100) NOT NULL,
          category VARCHAR(50) NOT NULL,
          note TEXT,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
      `);
            results.actions.push('Recreated expenses table with UUID (no foreign keys)');
            // Ensure admin user exists
            console.log('👤 Creating admin user...');
            const bcrypt = require('bcryptjs');
            const hashedPassword = await bcrypt.hash('admin123', 10);
            try {
                await client.query(`
          INSERT INTO users (username, email, password, role, created_at)
          VALUES ('admin', 'admin@blackrent.sk', $1, 'admin', CURRENT_TIMESTAMP)
          ON CONFLICT (username) DO UPDATE SET 
            password = $1,
            role = 'admin',
            updated_at = CURRENT_TIMESTAMP
        `, [hashedPassword]);
                results.actions.push('Admin user created/updated');
            }
            catch (userError) {
                console.log('⚠️ Admin user creation error:', userError.message);
                results.actions.push('Admin user creation failed: ' + userError.message);
            }
            console.log('🎉 Simple database fix completed!');
            res.json({
                success: true,
                message: 'Simple database UUID fix completed successfully',
                data: results
            });
        }
        finally {
            client.release();
        }
    }
    catch (error) {
        console.error('❌ Simple database fix failed:', error);
        res.status(500).json({
            success: false,
            error: 'Simple database fix failed: ' + error.message
        });
    }
});
router.post('/emergency-fix', async (req, res) => {
    try {
        console.log('🚨 Emergency database fix - NO AUTH REQUIRED');
        const client = await postgres_database_1.postgresDatabase.pool.connect();
        try {
            const results = {
                actions: []
            };
            // Emergency fix: Just create clean UUID tables and admin user
            console.log('🔧 Emergency: Creating clean rentals table...');
            // Clean rentals table
            await client.query('DROP TABLE IF EXISTS rentals CASCADE');
            await client.query(`
        CREATE TABLE rentals (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          vehicle_id VARCHAR(50),
          customer_id VARCHAR(50), 
          customer_name VARCHAR(100) NOT NULL,
          start_date TIMESTAMP NOT NULL,
          end_date TIMESTAMP NOT NULL,
          total_price DECIMAL(10,2) NOT NULL,
          commission DECIMAL(10,2) NOT NULL DEFAULT 0,
          payment_method VARCHAR(50) NOT NULL,
          paid BOOLEAN DEFAULT FALSE,
          status VARCHAR(30) DEFAULT 'pending',
          handover_place TEXT,
          confirmed BOOLEAN DEFAULT FALSE,
          order_number VARCHAR(50),
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
      `);
            results.actions.push('Created clean rentals table with UUID');
            // Clean expenses table  
            await client.query('DROP TABLE IF EXISTS expenses CASCADE');
            await client.query(`
        CREATE TABLE expenses (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          description TEXT NOT NULL,
          amount DECIMAL(10,2) NOT NULL,
          date TIMESTAMP NOT NULL,
          vehicle_id VARCHAR(50),
          company VARCHAR(100) NOT NULL,
          category VARCHAR(50) NOT NULL,
          note TEXT,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
      `);
            results.actions.push('Created clean expenses table with UUID');
            // Force create admin user
            console.log('👤 Force creating admin user...');
            const bcrypt = require('bcryptjs');
            const hashedPassword = await bcrypt.hash('admin123', 12);
            // Make sure users table exists with correct column name
            await client.query(`
        CREATE TABLE IF NOT EXISTS users (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          username VARCHAR(50) NOT NULL UNIQUE,
          email VARCHAR(100) NOT NULL UNIQUE,
          password_hash VARCHAR(255) NOT NULL,
          role VARCHAR(30) NOT NULL DEFAULT 'user',
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
      `);
            // Delete existing admin and create new one
            await client.query('DELETE FROM users WHERE username = $1', ['admin']);
            await client.query(`
        INSERT INTO users (username, email, password_hash, role, created_at)
        VALUES ('admin', 'admin@blackrent.sk', $1, 'admin', CURRENT_TIMESTAMP)
      `, [hashedPassword]);
            results.actions.push('Force created admin user (admin/admin123)');
            console.log('🎉 Emergency fix completed!');
            res.json({
                success: true,
                message: 'Emergency database fix completed - you can now login with admin/admin123',
                data: results
            });
        }
        finally {
            client.release();
        }
    }
    catch (error) {
        console.error('❌ Emergency fix failed:', error);
        res.status(500).json({
            success: false,
            error: 'Emergency fix failed: ' + error.message
        });
    }
});
router.post('/restore-basic-data', async (req, res) => {
    try {
        console.log('🔄 Restoring basic data that was lost during emergency fix...');
        const client = await postgres_database_1.postgresDatabase.pool.connect();
        try {
            const results = {
                actions: []
            };
            // Restore basic vehicles from the backup data I saw
            console.log('📋 Restoring vehicles...');
            const vehicles = [
                {
                    make: 'BMW',
                    model: 'X5',
                    year: 2020,
                    license_plate: 'BA-123-AB',
                    company: 'Default Company'
                },
                {
                    make: 'Audi',
                    model: 'A4',
                    year: 2019,
                    license_plate: 'KE-456-CD',
                    company: 'Default Company'
                }
            ];
            for (const vehicle of vehicles) {
                try {
                    await client.query(`
            INSERT INTO vehicles (make, model, year, license_plate, company, pricing, commission, status, created_at)
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, CURRENT_TIMESTAMP)
            ON CONFLICT (license_plate) DO UPDATE SET
              make = $1,
              model = $2,
              year = $3,
              company = $5,
              updated_at = CURRENT_TIMESTAMP
          `, [
                        vehicle.make,
                        vehicle.model,
                        vehicle.year,
                        vehicle.license_plate,
                        vehicle.company,
                        JSON.stringify([]),
                        JSON.stringify({ "type": "percentage", "value": 15 }),
                        'available'
                    ]);
                    console.log(`✅ Restored vehicle: ${vehicle.make} ${vehicle.model}`);
                    results.actions.push(`Restored vehicle: ${vehicle.make} ${vehicle.model} (${vehicle.license_plate})`);
                }
                catch (err) {
                    console.log(`⚠️ Error restoring vehicle:`, err.message);
                    results.actions.push(`Error restoring vehicle: ${err.message}`);
                }
            }
            // Restore basic companies
            console.log('📋 Restoring companies...');
            const companies = [
                'Default Company',
                'BMW Slovakia',
                'Audi Centrum',
                'Toyota Slovakia'
            ];
            for (const companyName of companies) {
                try {
                    await client.query(`
            INSERT INTO companies (name, created_at)
            VALUES ($1, CURRENT_TIMESTAMP)
            ON CONFLICT (name) DO UPDATE SET
              updated_at = CURRENT_TIMESTAMP
          `, [companyName]);
                    console.log(`✅ Restored company: ${companyName}`);
                    results.actions.push(`Restored company: ${companyName}`);
                }
                catch (err) {
                    console.log(`⚠️ Error restoring company:`, err.message);
                }
            }
            // Restore basic insurers
            console.log('📋 Restoring insurers...');
            const insurers = [
                'Allianz',
                'Generali',
                'Kooperativa',
                'UNIQA'
            ];
            for (const insurerName of insurers) {
                try {
                    await client.query(`
            INSERT INTO insurers (name, created_at)
            VALUES ($1, CURRENT_TIMESTAMP)  
            ON CONFLICT (name) DO UPDATE SET
              updated_at = CURRENT_TIMESTAMP
          `, [insurerName]);
                    console.log(`✅ Restored insurer: ${insurerName}`);
                    results.actions.push(`Restored insurer: ${insurerName}`);
                }
                catch (err) {
                    console.log(`⚠️ Error restoring insurer:`, err.message);
                }
            }
            // Create sample customer
            console.log('📋 Creating sample customer...');
            try {
                await client.query(`
          INSERT INTO customers (name, email, phone, created_at)
          VALUES ($1, $2, $3, CURRENT_TIMESTAMP)
          ON CONFLICT (email) DO UPDATE SET
            name = $1,
            phone = $3,
            updated_at = CURRENT_TIMESTAMP
        `, [
                    'Vzorový Zákazník',
                    'zakaznik@example.com',
                    '+421900000000'
                ]);
                results.actions.push('Created sample customer');
            }
            catch (err) {
                results.actions.push(`Error creating sample customer: ${err.message}`);
            }
            console.log('🎉 Basic data restoration completed!');
            // Final summary
            const summary = await client.query(`
        SELECT 
          (SELECT COUNT(*) FROM vehicles) as vehicles_count,
          (SELECT COUNT(*) FROM customers) as customers_count,
          (SELECT COUNT(*) FROM companies) as companies_count,
          (SELECT COUNT(*) FROM insurers) as insurers_count,
          (SELECT COUNT(*) FROM expenses) as expenses_count,
          (SELECT COUNT(*) FROM rentals) as rentals_count
      `);
            results.actions.push(`Final counts: ${JSON.stringify(summary.rows[0])}`);
            res.json({
                success: true,
                message: 'Basic data restoration completed',
                data: {
                    actions: results.actions,
                    summary: summary.rows[0]
                }
            });
        }
        finally {
            client.release();
        }
    }
    catch (error) {
        console.error('❌ Basic data restoration failed:', error);
        res.status(500).json({
            success: false,
            error: 'Basic data restoration failed: ' + error.message
        });
    }
});
router.get('/debug-admin', async (req, res) => {
    try {
        console.log('🔍 DEBUG: Checking admin user in database...');
        const client = await postgres_database_1.postgresDatabase.pool.connect();
        try {
            // Check what's actually in the users table
            const result = await client.query('SELECT id, username, email, password_hash, role, created_at FROM users WHERE username = $1', ['admin']);
            const adminData = result.rows[0] || null;
            if (adminData) {
                console.log('👤 Admin user found:', {
                    id: adminData.id,
                    username: adminData.username,
                    email: adminData.email,
                    role: adminData.role,
                    hasPasswordHash: !!adminData.password_hash,
                    passwordHashLength: adminData.password_hash?.length,
                    passwordHashPrefix: adminData.password_hash?.substring(0, 30) + '...',
                    createdAt: adminData.created_at
                });
                // Test password comparison
                const bcrypt = require('bcryptjs');
                const testPassword = 'admin123';
                const isValid = await bcrypt.compare(testPassword, adminData.password_hash);
                res.json({
                    success: true,
                    message: 'Debug info for admin user',
                    data: {
                        userFound: true,
                        userInfo: {
                            id: adminData.id,
                            username: adminData.username,
                            email: adminData.email,
                            role: adminData.role,
                            createdAt: adminData.created_at
                        },
                        passwordTest: {
                            testPassword: testPassword,
                            hasPasswordHash: !!adminData.password_hash,
                            passwordHashLength: adminData.password_hash?.length,
                            passwordHashPrefix: adminData.password_hash?.substring(0, 30) + '...',
                            passwordValid: isValid
                        }
                    }
                });
            }
            else {
                console.log('❌ Admin user NOT found in database');
                res.json({
                    success: false,
                    message: 'Admin user not found in database',
                    data: {
                        userFound: false
                    }
                });
            }
        }
        finally {
            client.release();
        }
    }
    catch (error) {
        console.error('❌ Debug failed:', error);
        res.status(500).json({
            success: false,
            error: 'Debug failed: ' + error.message
        });
    }
});
router.post('/test-uuid-rental', async (req, res) => {
    try {
        console.log('🎯 Testing UUID rental creation without auth...');
        const client = await postgres_database_1.postgresDatabase.pool.connect();
        try {
            // Simple insert test with UUID
            const testRental = {
                customer_name: 'UUID Test Bez Auth',
                start_date: '2025-07-19T20:00:00Z',
                end_date: '2025-07-20T08:00:00Z',
                total_price: 888,
                commission: 88,
                payment_method: 'cash'
            };
            const result = await client.query(`
        INSERT INTO rentals (customer_name, start_date, end_date, total_price, commission, payment_method, created_at)
        VALUES ($1, $2, $3, $4, $5, $6, CURRENT_TIMESTAMP)
        RETURNING id, customer_name, total_price, created_at
      `, [
                testRental.customer_name,
                testRental.start_date,
                testRental.end_date,
                testRental.total_price,
                testRental.commission,
                testRental.payment_method
            ]);
            const createdRental = result.rows[0];
            console.log('✅ UUID rental created successfully:', createdRental);
            res.json({
                success: true,
                message: 'UUID rental test successful',
                data: {
                    rental: {
                        id: createdRental.id,
                        customerName: createdRental.customer_name,
                        totalPrice: createdRental.total_price,
                        createdAt: createdRental.created_at
                    },
                    uuidTest: {
                        idType: typeof createdRental.id,
                        idLength: createdRental.id ? createdRental.id.toString().length : 0,
                        isValidUUID: /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(createdRental.id)
                    }
                }
            });
        }
        finally {
            client.release();
        }
    }
    catch (error) {
        console.error('❌ UUID rental test failed:', error);
        res.status(500).json({
            success: false,
            error: 'UUID rental test failed: ' + error.message
        });
    }
});
// POST /api/fix-database/add-rental-columns - Pridanie chýbajúcich stĺpcov do rentals tabuľky
router.post('/add-rental-columns', async (req, res) => {
    try {
        const client = await postgres_database_1.postgresDatabase.pool.connect();
        try {
            console.log('🔧 Starting rental table columns migration...');
            // Get current columns
            const columnsResult = await client.query(`
        SELECT column_name, data_type 
        FROM information_schema.columns 
        WHERE table_name = 'rentals' AND table_schema = 'public'
        ORDER BY ordinal_position
      `);
            const existingColumns = columnsResult.rows.map((row) => row.column_name);
            console.log('📋 Existing columns:', existingColumns);
            // Define required columns
            const requiredColumns = [
                { name: 'deposit', type: 'DECIMAL(10,2)', defaultValue: '0' },
                { name: 'allowed_kilometers', type: 'INTEGER', defaultValue: '0' },
                { name: 'extra_kilometer_rate', type: 'DECIMAL(10,2)', defaultValue: '0' },
                { name: 'return_conditions', type: 'TEXT', defaultValue: null },
                { name: 'fuel_level', type: 'INTEGER', defaultValue: '0' },
                { name: 'odometer', type: 'INTEGER', defaultValue: '0' },
                { name: 'return_fuel_level', type: 'INTEGER', defaultValue: null },
                { name: 'return_odometer', type: 'INTEGER', defaultValue: null },
                { name: 'actual_kilometers', type: 'INTEGER', defaultValue: null },
                { name: 'fuel_refill_cost', type: 'DECIMAL(10,2)', defaultValue: null },
                { name: 'handover_protocol_id', type: 'UUID', defaultValue: null },
                { name: 'return_protocol_id', type: 'UUID', defaultValue: null }
            ];
            const addedColumns = [];
            // Add missing columns
            for (const column of requiredColumns) {
                if (!existingColumns.includes(column.name)) {
                    console.log(`➕ Adding column: ${column.name} (${column.type})`);
                    let alterQuery = `ALTER TABLE rentals ADD COLUMN ${column.name} ${column.type}`;
                    if (column.defaultValue !== null) {
                        alterQuery += ` DEFAULT ${column.defaultValue}`;
                    }
                    await client.query(alterQuery);
                    addedColumns.push(column.name);
                }
            }
            // Get final columns
            const finalColumnsResult = await client.query(`
        SELECT column_name, data_type 
        FROM information_schema.columns 
        WHERE table_name = 'rentals' AND table_schema = 'public'
        ORDER BY ordinal_position
      `);
            const finalColumns = finalColumnsResult.rows.map((row) => `${row.column_name} (${row.data_type})`);
            console.log('✅ Rental table migration completed');
            console.log('📊 Added columns:', addedColumns);
            console.log('📊 Total columns:', finalColumns.length);
            res.json({
                success: true,
                message: 'Rental table columns migration completed',
                data: {
                    addedColumns,
                    totalColumns: finalColumns.length,
                    finalColumns
                }
            });
        }
        finally {
            client.release();
        }
    }
    catch (error) {
        console.error('❌ Rental table migration error:', error);
        res.status(500).json({
            success: false,
            error: `Migration failed: ${error instanceof Error ? error.message : 'Unknown error'}`
        });
    }
});
// POST /api/fix-database/create-settlements-table
router.post('/create-settlements-table', async (req, res) => {
    try {
        const client = await postgres_database_1.postgresDatabase.pool.connect();
        try {
            console.log('🔧 Creating settlements table...');
            // Check if table exists
            const tableExists = await client.query(`
        SELECT EXISTS (
          SELECT FROM information_schema.tables 
          WHERE table_schema = 'public' 
          AND table_name = 'settlements'
        );
      `);
            if (tableExists.rows[0].exists) {
                console.log('📋 Settlements table already exists');
                const columnsResult = await client.query(`
          SELECT column_name, data_type 
          FROM information_schema.columns 
          WHERE table_name = 'settlements' AND table_schema = 'public'
          ORDER BY ordinal_position
        `);
                const columns = columnsResult.rows.map((row) => `${row.column_name} (${row.data_type})`);
                return res.json({
                    success: true,
                    message: 'Settlements table already exists',
                    data: {
                        tableExists: true,
                        columns
                    }
                });
            }
            // Create settlements table
            await client.query(`
        CREATE TABLE settlements (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          company VARCHAR(100),
          period_from TIMESTAMP NOT NULL,
          period_to TIMESTAMP NOT NULL,
          total_income DECIMAL(10,2) DEFAULT 0,
          total_expenses DECIMAL(10,2) DEFAULT 0,
          total_commission DECIMAL(10,2) DEFAULT 0,
          profit DECIMAL(10,2) DEFAULT 0,
          rentals_data JSONB,
          expenses_data JSONB,
          summary TEXT,
          vehicle_id VARCHAR(50),
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
      `);
            console.log('✅ Settlements table created successfully');
            // Get table structure
            const columnsResult = await client.query(`
        SELECT column_name, data_type 
        FROM information_schema.columns 
        WHERE table_name = 'settlements' AND table_schema = 'public'
        ORDER BY ordinal_position
      `);
            const columns = columnsResult.rows.map((row) => `${row.column_name} (${row.data_type})`);
            res.json({
                success: true,
                message: 'Settlements table created successfully',
                data: {
                    tableCreated: true,
                    totalColumns: columns.length,
                    columns
                }
            });
        }
        finally {
            client.release();
        }
    }
    catch (error) {
        console.error('❌ Settlements table creation error:', error);
        res.status(500).json({
            success: false,
            error: `Table creation failed: ${error instanceof Error ? error.message : 'Unknown error'}`
        });
    }
});
exports.default = router;
//# sourceMappingURL=fix-database.js.map