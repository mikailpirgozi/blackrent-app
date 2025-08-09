"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.postgresDatabase = exports.PostgresDatabase = void 0;
const pg_1 = require("pg");
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const r2_storage_1 = require("../utils/r2-storage");
class PostgresDatabase {
    // Public getter for cleanup operations
    get dbPool() {
        return this.pool;
    }
    constructor() {
        // ⚡ PERFORMANCE CACHE: Permission caching pre getUserCompanyAccess
        this.permissionCache = new Map();
        this.PERMISSION_CACHE_TTL = 5 * 60 * 1000; // 5 minút
        // 🚀 FÁZA 1.3: VEHICLE CACHING - vozidlá sa menia zriedka, môžeme cachovať
        this.vehicleCache = null;
        this.VEHICLE_CACHE_TTL = 10 * 60 * 1000; // 10 minút
        // 🚀 FÁZA 2.2: CONNECTION REUSE pre calendar API
        this.calendarConnection = null;
        this.calendarConnectionLastUsed = 0;
        this.CONNECTION_REUSE_TIMEOUT = 60000; // 1 minúta
        // 🚀 FÁZA 2.3: SMART CACHING LAYER - hierarchical cache system
        this.calendarCache = new Map();
        this.CALENDAR_CACHE_TTL = 5 * 60 * 1000; // 5 minút
        this.unavailabilityCache = new Map();
        this.UNAVAILABILITY_CACHE_TTL = 3 * 60 * 1000; // 3 minúty
        // 🚀 FÁZA 2.2: OPTIMALIZED CONNECTION POOL pre produkčné škálovanie
        const poolConfig = {
            // Railway optimalizácie
            max: 15, // Znížené z 25 - Railway má connection limity 
            min: 2, // Minimálne 2 connections ready
            idleTimeoutMillis: 30000, // 30s - rýchlejšie cleanup
            connectionTimeoutMillis: 2000, // 2s - rýchly timeout
            acquireTimeoutMillis: 3000, // 3s pre získanie connection
            allowExitOnIdle: true,
            // Keepalive pre produkciu
            keepAlive: true,
            keepAliveInitialDelayMillis: 0,
            // Performance tuning
            statement_timeout: 30000, // 30s statement timeout
            query_timeout: 15000, // 15s query timeout
        };
        // Railway.app provides DATABASE_URL
        if (process.env.DATABASE_URL) {
            this.pool = new pg_1.Pool({
                connectionString: process.env.DATABASE_URL,
                ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
                ...poolConfig
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
                ...poolConfig
            });
        }
        this.initTables().catch(console.error); // Spustenie pre aktualizáciu schémy
        // 🚀 FÁZA 2.2: Connection cleanup job (každých 2 minúty)
        setInterval(() => {
            const now = Date.now();
            if (this.calendarConnection &&
                (now - this.calendarConnectionLastUsed) > this.CONNECTION_REUSE_TIMEOUT) {
                console.log('🧹 CLEANUP: Releasing unused calendar connection');
                this.releaseReusableConnection(true);
            }
        }, 2 * 60 * 1000); // Každé 2 minúty
        // 🚀 FÁZA 2.3: Smart cache cleanup job (každých 5 minút)
        setInterval(() => {
            this.cleanupExpiredCache();
        }, 5 * 60 * 1000); // Každých 5 minút
    }
    // 📧 HELPER: Public query method pre webhook funcionalitu
    async query(sql, params = []) {
        const client = await this.pool.connect();
        try {
            return await client.query(sql, params);
        }
        finally {
            client.release();
        }
    }
    async initTables() {
        const client = await this.pool.connect();
        try {
            // FÁZA 1: ROLE-BASED PERMISSIONS - Vytvorenie companies tabuľky
            await client.query(`
        CREATE TABLE IF NOT EXISTS companies (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          name VARCHAR(255) NOT NULL,
          business_id VARCHAR(50),
          tax_id VARCHAR(50),
          address TEXT,
          contact_person VARCHAR(255),
          email VARCHAR(255),
          phone VARCHAR(50),
          contract_start_date DATE,
          contract_end_date DATE,
          commission_rate DECIMAL(5,2) DEFAULT 20.00,
          is_active BOOLEAN DEFAULT true,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
      `);
            // Tabuľka používateľov s hashovanými heslami
            await client.query(`
        CREATE TABLE IF NOT EXISTS users (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          username VARCHAR(50) UNIQUE NOT NULL,
          email VARCHAR(100) UNIQUE NOT NULL,
          password_hash VARCHAR(255) NOT NULL,
          role VARCHAR(30) DEFAULT 'admin',
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
      `);
            // FÁZA 1: Rozšírenie users tabuľky o nové stĺpce (bez company_id foreign key kvôli type mismatch)
            try {
                await client.query(`
          ALTER TABLE users 
          ADD COLUMN IF NOT EXISTS company_id INTEGER,
          ADD COLUMN IF NOT EXISTS employee_number VARCHAR(20),
          ADD COLUMN IF NOT EXISTS hire_date DATE,
          ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true,
          ADD COLUMN IF NOT EXISTS last_login TIMESTAMP,
          ADD COLUMN IF NOT EXISTS first_name VARCHAR(100),
          ADD COLUMN IF NOT EXISTS last_name VARCHAR(100),
          ADD COLUMN IF NOT EXISTS signature_template TEXT
        `);
            }
            catch (error) {
                console.log('ℹ️ Users table columns already exist or error occurred:', error);
            }
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
            // FÁZA 1: Rozšírenie vehicles tabuľky o company ownership a mechanic assignment
            // Poznámka: Skipped - vehicles už má company_id (integer) foreign key na companies(id)
            console.log('ℹ️ Vehicles table - using existing company_id column (integer type)');
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
          vehicle_id UUID,
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
          -- Rozšírené polia pre kompletný rental systém
          deposit DECIMAL(10,2),
          allowed_kilometers INTEGER,
          daily_kilometers INTEGER, -- NEW: Denné km pre automatický prepočet
          extra_kilometer_rate DECIMAL(10,2),
          return_conditions TEXT,
          fuel_level INTEGER,
          odometer INTEGER,
          return_fuel_level INTEGER,
          return_odometer INTEGER,
          actual_kilometers INTEGER,
          fuel_refill_cost DECIMAL(10,2),
          -- Protokoly
          handover_protocol_id UUID,
          return_protocol_id UUID,
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
          vehicle_id UUID,
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
          vehicle_id UUID NOT NULL,
          type VARCHAR(50) NOT NULL,
          policy_number VARCHAR(100) NOT NULL DEFAULT '',
          valid_from TIMESTAMP NOT NULL,
          valid_to TIMESTAMP NOT NULL,
          price DECIMAL(10,2) NOT NULL,
          company VARCHAR(100) NOT NULL,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
      `);
            // Pridáme stĺpec policy_number ak neexistuje (migrácia existujúcich tabuliek)
            try {
                await client.query(`
          ALTER TABLE insurances ADD COLUMN IF NOT EXISTS policy_number VARCHAR(100) NOT NULL DEFAULT ''
        `);
            }
            catch (error) {
                console.log('ℹ️ Policy number column already exists or error occurred:', error);
            }
            // Pridáme stĺpec payment_frequency ak neexistuje (migrácia existujúcich tabuliek)
            try {
                await client.query(`
          ALTER TABLE insurances ADD COLUMN IF NOT EXISTS payment_frequency VARCHAR(20) NOT NULL DEFAULT 'yearly'
        `);
            }
            catch (error) {
                console.log('ℹ️ Payment frequency column already exists or error occurred:', error);
            }
            // Pridáme stĺpec file_path ak neexistuje (migrácia pre file uploads)
            try {
                await client.query(`
          ALTER TABLE insurances ADD COLUMN IF NOT EXISTS file_path TEXT
        `);
            }
            catch (error) {
                console.log('ℹ️ Insurance file_path column already exists or error occurred:', error);
            }
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
            // Tabuľka evidencie platnosti vozidiel (STK, EK, dialničné známky)
            await client.query(`
        CREATE TABLE IF NOT EXISTS vehicle_documents (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          vehicle_id UUID NOT NULL,
          document_type VARCHAR(20) NOT NULL,
          valid_from DATE,
          valid_to DATE NOT NULL,
          document_number VARCHAR(100),
          price DECIMAL(10,2),
          notes TEXT,
          file_path TEXT,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
      `);
            // Tabuľka poistných udalostí
            await client.query(`
        CREATE TABLE IF NOT EXISTS insurance_claims (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          vehicle_id UUID NOT NULL,
          insurance_id UUID,
          
          -- Základné info o udalosti
          incident_date TIMESTAMP NOT NULL,
          reported_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          claim_number VARCHAR(100),
          
          -- Popis udalosti
          description TEXT NOT NULL,
          location VARCHAR(255),
          incident_type VARCHAR(50) NOT NULL DEFAULT 'other',
          
          -- Finančné údaje
          estimated_damage DECIMAL(10,2),
          deductible DECIMAL(10,2),
          payout_amount DECIMAL(10,2),
          
          -- Stav
          status VARCHAR(50) NOT NULL DEFAULT 'reported',
          
          -- Súbory a dokumenty
          file_paths TEXT[],
          
          -- Dodatočné info
          police_report_number VARCHAR(100),
          other_party_info TEXT,
          notes TEXT,
          
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
      `);
            // Pridáme stĺpec file_path ak neexistuje (migrácia existujúcich tabuliek)
            try {
                await client.query(`
          ALTER TABLE vehicle_documents ADD COLUMN IF NOT EXISTS file_path TEXT
        `);
            }
            catch (error) {
                console.log('ℹ️ Vehicle documents file_path column already exists or error occurred:', error);
            }
            // Tabuľka nedostupností vozidiel (servis, údržba, blokovanie)
            await client.query(`
        CREATE TABLE IF NOT EXISTS vehicle_unavailability (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          vehicle_id UUID NOT NULL,
          start_date DATE NOT NULL,
          end_date DATE NOT NULL,
          reason TEXT NOT NULL,
          type VARCHAR(50) NOT NULL DEFAULT 'maintenance',
          notes TEXT,
          priority INTEGER DEFAULT 2,
          recurring BOOLEAN DEFAULT FALSE,
          recurring_config JSONB,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          created_by VARCHAR(100) DEFAULT 'system',
          CONSTRAINT unique_vehicle_period UNIQUE (vehicle_id, start_date, end_date, type),
          CONSTRAINT valid_date_range CHECK (end_date >= start_date)
        )
      `);
            // Indexy pre optimálny výkon vehicle_unavailability tabuľky
            await client.query(`CREATE INDEX IF NOT EXISTS idx_vehicle_unavailability_vehicle_id ON vehicle_unavailability(vehicle_id)`);
            await client.query(`CREATE INDEX IF NOT EXISTS idx_vehicle_unavailability_dates ON vehicle_unavailability(start_date, end_date)`);
            await client.query(`CREATE INDEX IF NOT EXISTS idx_vehicle_unavailability_type ON vehicle_unavailability(type)`);
            // Tabuľka pre práva používateľov na firmy
            await client.query(`
        CREATE TABLE IF NOT EXISTS user_permissions (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          user_id UUID NOT NULL,
          company_id INTEGER NOT NULL,
          permissions JSONB NOT NULL DEFAULT '{}',
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          UNIQUE(user_id, company_id)
        )
      `);
            // Indexy pre user_permissions
            await client.query(`CREATE INDEX IF NOT EXISTS idx_user_permissions_user_id ON user_permissions(user_id)`);
            await client.query(`CREATE INDEX IF NOT EXISTS idx_user_permissions_company_id ON user_permissions(company_id)`);
            // Vytvorenie admin používateľa ak neexistuje
            await this.createDefaultAdmin(client);
            // Migrácie pre existujúce databázy - aktualizácia varchar limitov
            await this.runMigrations(client);
            // Vytvorenie testovacích dát ak databáza je prázdna
            await this.createSampleDataIfEmpty(client);
            // DATA INTEGRITY VALIDATION - Kompletná kontrola dát
            await this.validateDataIntegrity(client);
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
            // Migrácia 1: Pridanie chýbajúcich stĺpcov do vehicles (bez NOT NULL)
            try {
                console.log('📋 Migrácia 1: Pridávanie stĺpcov do vehicles...');
                await client.query(`
          ALTER TABLE vehicles 
          ADD COLUMN IF NOT EXISTS company VARCHAR(100) DEFAULT 'Default Company',
          ADD COLUMN IF NOT EXISTS pricing JSONB DEFAULT '[]',
          ADD COLUMN IF NOT EXISTS commission JSONB DEFAULT '{"type": "percentage", "value": 20}',
          ADD COLUMN IF NOT EXISTS status VARCHAR(30) DEFAULT 'available';
        `);
                console.log('✅ Migrácia 1: Stĺpce do vehicles pridané');
            }
            catch (error) {
                console.log('⚠️ Migrácia 1 chyba:', error.message);
            }
            // Migrácia 2: Pridanie základných polí do rentals tabuľky
            try {
                console.log('📋 Migrácia 2: Pridávanie stĺpcov do rentals...');
                await client.query(`
          ALTER TABLE rentals 
          ADD COLUMN IF NOT EXISTS commission DECIMAL(10,2) DEFAULT 0,
          ADD COLUMN IF NOT EXISTS discount TEXT,
          ADD COLUMN IF NOT EXISTS custom_commission TEXT,
          ADD COLUMN IF NOT EXISTS extra_km_charge DECIMAL(10,2),
          ADD COLUMN IF NOT EXISTS payments JSONB,
          ADD COLUMN IF NOT EXISTS history JSONB,
          ADD COLUMN IF NOT EXISTS order_number VARCHAR(50),
          ADD COLUMN IF NOT EXISTS status VARCHAR(30) DEFAULT 'pending',
          ADD COLUMN IF NOT EXISTS confirmed BOOLEAN DEFAULT false,
          ADD COLUMN IF NOT EXISTS paid BOOLEAN DEFAULT false,
          ADD COLUMN IF NOT EXISTS handover_place TEXT;
        `);
                console.log('✅ Migrácia 2: Stĺpce do rentals pridané');
            }
            catch (error) {
                console.log('⚠️ Migrácia 2 chyba:', error.message);
            }
            // Migrácia 2b: Pridanie chýbajúcich stĺpcov do customers
            try {
                console.log('📋 Migrácia 2b: Pridávanie stĺpcov do customers...');
                await client.query(`
          ALTER TABLE customers 
          ADD COLUMN IF NOT EXISTS name VARCHAR(100) DEFAULT 'Unknown',
          ADD COLUMN IF NOT EXISTS email VARCHAR(100),
          ADD COLUMN IF NOT EXISTS phone VARCHAR(30);
        `);
                console.log('✅ Migrácia 2b: Stĺpce do customers pridané');
            }
            catch (error) {
                console.log('⚠️ Migrácia 2b chyba:', error.message);
            }
            // Migrácia 3: Zvýšenie limitov varchar polí
            try {
                console.log('📋 Migrácia 3: Zvyšovanie varchar limitov...');
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
                console.log('✅ Migrácia 3: VARCHAR limity aktualizované');
            }
            catch (error) {
                console.log('⚠️ Migrácia 3 chyba:', error.message);
            }
            // Migrácia 4: Nastavenie NOT NULL pre dôležité polia
            try {
                console.log('📋 Migrácia 4: Nastavovanie NOT NULL constraints...');
                await client.query(`
          UPDATE vehicles SET company = 'Default Company' WHERE company IS NULL;
        `);
                await client.query(`
          ALTER TABLE vehicles ALTER COLUMN company SET NOT NULL;
        `);
                console.log('✅ Migrácia 4: NOT NULL constraints nastavené');
            }
            catch (error) {
                console.log('⚠️ Migrácia 4 chyba:', error.message);
            }
            // Migrácia 5: Pridanie signature_template a user info stĺpcov do users tabuľky
            try {
                console.log('📋 Migrácia 5: Pridávanie signature_template a user info stĺpcov do users...');
                await client.query(`
          ALTER TABLE users 
          ADD COLUMN IF NOT EXISTS signature_template TEXT,
          ADD COLUMN IF NOT EXISTS first_name VARCHAR(100),
          ADD COLUMN IF NOT EXISTS last_name VARCHAR(100);
        `);
                console.log('✅ Migrácia 5: signature_template, first_name, last_name stĺpce pridané do users');
            }
            catch (error) {
                console.log('⚠️ Migrácia 5 chyba:', error.message);
            }
            // Migrácia 6: Pridanie rozšírených polí do rentals tabuľky
            try {
                console.log('📋 Migrácia 6: Pridávanie rozšírených polí do rentals...');
                await client.query(`
          ALTER TABLE rentals 
          ADD COLUMN IF NOT EXISTS deposit DECIMAL(10,2),
          ADD COLUMN IF NOT EXISTS allowed_kilometers INTEGER,
          ADD COLUMN IF NOT EXISTS daily_kilometers INTEGER,
          ADD COLUMN IF NOT EXISTS extra_kilometer_rate DECIMAL(10,2),
          ADD COLUMN IF NOT EXISTS return_conditions TEXT,
          ADD COLUMN IF NOT EXISTS fuel_level INTEGER,
          ADD COLUMN IF NOT EXISTS odometer INTEGER,
          ADD COLUMN IF NOT EXISTS return_fuel_level INTEGER,
          ADD COLUMN IF NOT EXISTS return_odometer INTEGER,
          ADD COLUMN IF NOT EXISTS actual_kilometers INTEGER,
          ADD COLUMN IF NOT EXISTS fuel_refill_cost DECIMAL(10,2),
          ADD COLUMN IF NOT EXISTS handover_protocol_id UUID,
          ADD COLUMN IF NOT EXISTS return_protocol_id UUID;
        `);
                console.log('✅ Migrácia 5: Rozšírené polia do rentals pridané');
            }
            catch (error) {
                console.log('⚠️ Migrácia 5 chyba:', error.message);
            }
            // Migrácia 6: Aktualizácia pricing tiers pre všetky existujúce vozidlá
            try {
                console.log('📋 Migrácia 6: Aktualizácia pricing tiers pre vozidlá...');
                // Kompletné pricing tiers pre všetky vozidlá
                const fullPricingTiers = [
                    { id: '1', minDays: 0, maxDays: 1, pricePerDay: 80 }, // 0-1 dní
                    { id: '2', minDays: 2, maxDays: 3, pricePerDay: 75 }, // 2-3 dni  
                    { id: '3', minDays: 4, maxDays: 7, pricePerDay: 70 }, // 4-7 dní
                    { id: '4', minDays: 8, maxDays: 14, pricePerDay: 60 }, // 8-14 dní
                    { id: '5', minDays: 15, maxDays: 22, pricePerDay: 55 }, // 15-22 dní
                    { id: '6', minDays: 23, maxDays: 30, pricePerDay: 50 }, // 23-30 dní  
                    { id: '7', minDays: 31, maxDays: 365, pricePerDay: 45 } // 31+ dní
                ];
                // Update všetkých vozidiel ktoré nemajú kompletné pricing (menej ako 7 tiers)
                const vehiclesResult = await client.query(`
          SELECT id, brand, model, pricing FROM vehicles 
          WHERE pricing IS NULL OR jsonb_array_length(pricing) < 7
        `);
                for (const vehicle of vehiclesResult.rows) {
                    // Prispôsobiť ceny podľa typu vozidla
                    let adjustedPricing = [...fullPricingTiers];
                    // Premium vozidlá (BMW, Mercedes, Audi Q/X série) - vyššie ceny
                    if (vehicle.brand === 'BMW' ||
                        vehicle.brand === 'Mercedes' ||
                        (vehicle.brand === 'Audi' && vehicle.model?.includes('Q'))) {
                        adjustedPricing = adjustedPricing.map(tier => ({
                            ...tier,
                            pricePerDay: Math.round(tier.pricePerDay * 1.3) // +30%
                        }));
                    }
                    // Luxury vozidlá (Porsche, Bentley, atď) - najvyššie ceny  
                    else if (['Porsche', 'Bentley', 'Ferrari', 'Lamborghini'].includes(vehicle.brand)) {
                        adjustedPricing = adjustedPricing.map(tier => ({
                            ...tier,
                            pricePerDay: Math.round(tier.pricePerDay * 1.8) // +80%
                        }));
                    }
                    // Standard vozidlá - základné ceny zostanú
                    await client.query('UPDATE vehicles SET pricing = $1 WHERE id = $2', [JSON.stringify(adjustedPricing), vehicle.id]);
                }
                console.log(`✅ Migrácia 6: Pricing aktualizované pre ${vehiclesResult.rows.length} vozidiel`);
            }
            catch (error) {
                console.log('⚠️ Migrácia 6 chyba:', error.message);
            }
            // Migrácia 7: Aktualizácia commission na 20% pre všetky vozidlá
            try {
                console.log('📋 Migrácia 7: Aktualizácia commission na 20%...');
                const commissionResult = await client.query(`
          UPDATE vehicles 
          SET commission = '{"type": "percentage", "value": 20}'::jsonb
          WHERE commission->>'value' != '20'
        `);
                console.log(`✅ Migrácia 7: Commission aktualizovaná na 20% pre všetky vozidlá`);
            }
            catch (error) {
                console.log('⚠️ Migrácia 7 chyba:', error.message);
            }
            // Migrácia 8: Pridanie owner_name stĺpca do vehicles tabuľky
            try {
                console.log('📋 Migrácia 8: Pridávanie owner_name stĺpca do vehicles...');
                await client.query(`
          ALTER TABLE vehicles 
          ADD COLUMN IF NOT EXISTS owner_name VARCHAR(255);
        `);
                console.log('✅ Migrácia 8: owner_name stĺpec pridaný do vehicles tabuľky');
            }
            catch (error) {
                console.log('⚠️ Migrácia 8 chyba:', error.message);
            }
            // Migrácia 9: Pridanie company_id stĺpca do vehicles tabuľky
            try {
                console.log('📋 Migrácia 9: Pridávanie company_id stĺpca do vehicles...');
                await client.query(`
          ALTER TABLE vehicles
          ADD COLUMN IF NOT EXISTS company_id INTEGER REFERENCES companies(id);
        `);
                console.log('✅ Migrácia 9: company_id stĺpec pridaný do vehicles tabuľky');
            }
            catch (error) {
                console.log('⚠️ Migrácia 9 chyba:', error.message);
            }
            // Migrácia 10: Oprava company_id typu v users tabuľke z INTEGER na UUID
            try {
                console.log('📋 Migrácia 10: Opravujem company_id typ v users tabuľke...');
                // Najprv odstráň foreign key constraint ak existuje
                await client.query(`
          ALTER TABLE users DROP CONSTRAINT IF EXISTS users_company_id_fkey;
        `);
                // Zmeň typ stĺpca z INTEGER na UUID
                await client.query(`
          ALTER TABLE users ALTER COLUMN company_id TYPE UUID USING company_id::text::uuid;
        `);
                // Pridaj nový foreign key constraint
                await client.query(`
          ALTER TABLE users ADD CONSTRAINT users_company_id_fkey 
          FOREIGN KEY (company_id) REFERENCES companies(id);
        `);
                console.log('✅ Migrácia 10: company_id typ opravený na UUID');
            }
            catch (error) {
                console.log('⚠️ Migrácia 10 chyba:', error.message);
                // Ak zlyhá konverzia, skús pridať stĺpec nanovo
                try {
                    await client.query(`
            ALTER TABLE users DROP COLUMN IF EXISTS company_id;
            ALTER TABLE users ADD COLUMN company_id UUID REFERENCES companies(id);
          `);
                    console.log('✅ Migrácia 10: company_id stĺpec znovu vytvorený ako UUID');
                }
                catch (retryError) {
                    console.log('⚠️ Migrácia 10 retry chyba:', retryError.message);
                }
            }
            // Migrácia 11: Oprava vehicles.id typu z INTEGER na UUID
            try {
                console.log('📋 Migrácia 11: Opravujem vehicles.id typ z INTEGER na UUID...');
                // Najprv odstráň všetky foreign key constraints
                await client.query(`
          ALTER TABLE rentals DROP CONSTRAINT IF EXISTS rentals_vehicle_id_fkey;
          ALTER TABLE expenses DROP CONSTRAINT IF EXISTS expenses_vehicle_id_fkey;
          ALTER TABLE insurances DROP CONSTRAINT IF EXISTS insurances_vehicle_id_fkey;
          ALTER TABLE vehicle_documents DROP CONSTRAINT IF EXISTS vehicle_documents_vehicle_id_fkey;
          ALTER TABLE insurance_claims DROP CONSTRAINT IF EXISTS insurance_claims_vehicle_id_fkey;
          ALTER TABLE vehicle_unavailability DROP CONSTRAINT IF EXISTS vehicle_unavailability_vehicle_id_fkey;
        `);
                // Zmeň typ stĺpca z INTEGER na UUID
                await client.query(`
          ALTER TABLE vehicles ALTER COLUMN id TYPE UUID USING id::text::uuid;
        `);
                // Pridaj späť všetky foreign key constraints
                await client.query(`
          ALTER TABLE rentals ADD CONSTRAINT rentals_vehicle_id_fkey 
          FOREIGN KEY (vehicle_id) REFERENCES vehicles(id) ON DELETE SET NULL;
          
          ALTER TABLE expenses ADD CONSTRAINT expenses_vehicle_id_fkey 
          FOREIGN KEY (vehicle_id) REFERENCES vehicles(id) ON DELETE SET NULL;
          
          ALTER TABLE insurances ADD CONSTRAINT insurances_vehicle_id_fkey 
          FOREIGN KEY (vehicle_id) REFERENCES vehicles(id) ON DELETE CASCADE;
          
          ALTER TABLE vehicle_documents ADD CONSTRAINT vehicle_documents_vehicle_id_fkey 
          FOREIGN KEY (vehicle_id) REFERENCES vehicles(id) ON DELETE CASCADE;
          
          ALTER TABLE insurance_claims ADD CONSTRAINT insurance_claims_vehicle_id_fkey 
          FOREIGN KEY (vehicle_id) REFERENCES vehicles(id) ON DELETE CASCADE;
          
          ALTER TABLE vehicle_unavailability ADD CONSTRAINT vehicle_unavailability_vehicle_id_fkey 
          FOREIGN KEY (vehicle_id) REFERENCES vehicles(id) ON DELETE CASCADE;
        `);
                console.log('✅ Migrácia 11: vehicles.id typ opravený na UUID');
            }
            catch (error) {
                console.log('⚠️ Migrácia 11 chyba:', error.message);
                // Ak zlyhá konverzia, skús pridať stĺpec nanovo
                try {
                    await client.query(`
            ALTER TABLE vehicles DROP COLUMN IF EXISTS id;
            ALTER TABLE vehicles ADD COLUMN id UUID PRIMARY KEY DEFAULT gen_random_uuid();
          `);
                    console.log('✅ Migrácia 11: vehicles.id stĺpec znovu vytvorený ako UUID');
                }
                catch (retryError) {
                    console.log('⚠️ Migrácia 11 retry chyba:', retryError.message);
                }
            }
            // Migrácia 12: Oprava users.id typu z INTEGER na UUID
            try {
                console.log('📋 Migrácia 12: Opravujem users.id typ z INTEGER na UUID...');
                // Zmeň typ stĺpca z INTEGER na UUID
                await client.query(`
          ALTER TABLE users ALTER COLUMN id TYPE UUID USING id::text::uuid;
        `);
                console.log('✅ Migrácia 12: users.id typ opravený na UUID');
            }
            catch (error) {
                console.log('⚠️ Migrácia 12 chyba:', error.message);
                // Ak zlyhá konverzia, skús pridať stĺpec nanovo
                try {
                    await client.query(`
            ALTER TABLE users DROP COLUMN IF EXISTS id;
            ALTER TABLE users ADD COLUMN id UUID PRIMARY KEY DEFAULT gen_random_uuid();
          `);
                    console.log('✅ Migrácia 12: users.id stĺpec znovu vytvorený ako UUID');
                }
                catch (retryError) {
                    console.log('⚠️ Migrácia 12 retry chyba:', retryError.message);
                }
            }
            // Migrácia 27: Rozšírenie VARCHAR stĺpcov pre email parsing
            try {
                console.log('📋 Migrácia 27: Rozširujem VARCHAR stĺpce pre email parsing...');
                const fieldsToExpand = [
                    'customer_phone', 'order_number', 'vehicle_name',
                    'vehicle_code', 'handover_place', 'payment_method', 'customer_name'
                ];
                for (const field of fieldsToExpand) {
                    await this.pool.query(`
              ALTER TABLE rentals 
              ALTER COLUMN ${field} TYPE VARCHAR(500)
            `);
                    console.log(`✅ ${field} rozšírený na VARCHAR(500)`);
                }
            }
            catch (error) {
                console.log('⚠️ Migrácia 27 chyba:', error);
            }
            // Migrácia 28: Blacklist zamietnutých objednávok
            try {
                console.log('📋 Migrácia 28: Vytváram blacklist pre zamietnuté objednávky...');
                await this.pool.query(`
            CREATE TABLE IF NOT EXISTS email_blacklist (
              id SERIAL PRIMARY KEY,
              order_number VARCHAR(500) NOT NULL UNIQUE,
              reason VARCHAR(500) DEFAULT 'rejected',
              created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
              created_by VARCHAR(255),
              notes TEXT
            )
          `);
                // Index pre rýchle vyhľadávanie
                await this.pool.query(`
            CREATE INDEX IF NOT EXISTS idx_email_blacklist_order_number 
            ON email_blacklist(order_number)
          `);
                console.log('✅ Blacklist tabuľka vytvorená');
            }
            catch (error) {
                console.log('⚠️ Migrácia 28 chyba:', error);
            }
            console.log('✅ Databázové migrácie úspešne dokončené');
            // MIGRATION TRACKING SYSTEM - Vytvor tabuľku pre tracking migrácií
            await client.query(`
        CREATE TABLE IF NOT EXISTS migration_history (
          id SERIAL PRIMARY KEY,
          migration_name VARCHAR(255) UNIQUE NOT NULL,
          executed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          success BOOLEAN DEFAULT true
        )
      `);
            // ❌ MIGRÁCIA 13 ZMAZANÁ - Spôsobovala chaos s UUID regeneráciou ❌
            // Migrácia 14: FINAL COMPANY CLEANUP - Odstránenie owner_name a priradenie company všetkým
            try {
                console.log('📋 Migrácia 14: Final Company Cleanup...');
                // 14.1: Odstráň owner_name z vehicles (nie je potrebné)
                console.log('📋 14.1: Odstraňujem owner_name z vehicles...');
                try {
                    await client.query('ALTER TABLE vehicles DROP COLUMN IF EXISTS owner_name');
                    console.log('   ✅ vehicles.owner_name odstránené');
                }
                catch (e) {
                    console.log('   ⚠️ vehicles.owner_name už neexistuje');
                }
                // 14.2: Priradenie company všetkým používateľom (Lubka ako default)
                console.log('📋 14.2: Priradenie company všetkým používateľom...');
                const lubkaId = await this.getCompanyIdByName('Lubka');
                if (lubkaId) {
                    const result = await client.query(`
            UPDATE users 
            SET company_id = $1 
            WHERE company_id IS NULL
          `, [lubkaId]);
                    console.log(`   ✅ ${result.rowCount} používateľov priradených k Lubka company`);
                }
                else {
                    console.log('   ⚠️ Lubka company nenájdená');
                }
                // 14.3: Skontroluj že všetko má company assignment
                console.log('📋 14.3: Kontrola company assignments...');
                const usersWithoutCompany = await client.query('SELECT COUNT(*) FROM users WHERE company_id IS NULL');
                console.log(`   Users bez company: ${usersWithoutCompany.rows[0].count}`);
                const vehiclesWithCompany = await client.query('SELECT COUNT(*) FROM vehicles WHERE company IS NOT NULL');
                console.log(`   Vehicles s company: ${vehiclesWithCompany.rows[0].count}`);
                console.log('✅ Migrácia 14: Final Company Cleanup dokončená');
            }
            catch (error) {
                console.log('⚠️ Migrácia 14 chyba:', error.message);
            }
            // ❌ MIGRÁCIA 15 ZMAZANÁ - Spôsobovala chaos s vehicle_id remappingom ❌
            // Migrácia 16: Pridanie STK stĺpca do vehicles
            try {
                console.log('📋 Migrácia 16: Pridávanie STK stĺpca do vehicles...');
                // Skontroluj či stĺpec už existuje
                const columnExists = await client.query(`
          SELECT column_name 
          FROM information_schema.columns 
          WHERE table_name = 'vehicles' AND column_name = 'stk'
        `);
                if (columnExists.rows.length === 0) {
                    // Pridaj STK stĺpec
                    await client.query(`
            ALTER TABLE vehicles 
            ADD COLUMN stk DATE
          `);
                    console.log('   ✅ STK stĺpec pridaný do vehicles tabuľky');
                }
                else {
                    console.log('   ℹ️ STK stĺpec už existuje');
                }
                console.log('✅ Migrácia 16: STK stĺpec úspešne pridaný');
            }
            catch (error) {
                console.log('⚠️ Migrácia 16 chyba:', error.message);
            }
            // Migrácia 17: Pridanie Foreign Key constraint pre rentals.vehicle_id
            try {
                console.log('📋 Migrácia 17: Pridávanie FK constraint pre rentals.vehicle_id...');
                // Skontroluj či constraint už existuje
                const constraintExists = await client.query(`
          SELECT constraint_name
          FROM information_schema.table_constraints
          WHERE table_name = 'rentals' AND constraint_name = 'rentals_vehicle_id_fkey'
        `);
                if (constraintExists.rows.length === 0) {
                    // Najprv oprav všetky neplatné vehicle_id na NULL
                    await client.query(`
            UPDATE rentals 
            SET vehicle_id = NULL 
            WHERE vehicle_id IS NOT NULL 
            AND vehicle_id NOT IN (SELECT id FROM vehicles)
          `);
                    console.log('   🔧 Neplatné vehicle_id nastavené na NULL');
                    // Pridaj FK constraint
                    await client.query(`
            ALTER TABLE rentals 
            ADD CONSTRAINT rentals_vehicle_id_fkey 
            FOREIGN KEY (vehicle_id) REFERENCES vehicles(id) ON DELETE SET NULL
          `);
                    console.log('   ✅ FK constraint pridaný pre rentals.vehicle_id');
                }
                else {
                    console.log('   ℹ️ FK constraint už existuje');
                }
                console.log('✅ Migrácia 17: FK constraint úspešne pridaný');
            }
            catch (error) {
                console.log('⚠️ Migrácia 17 chyba:', error.message);
            }
            // Migrácia 18: Vehicle Ownership History - Pre tracking zmien vlastníctva vozidiel
            try {
                console.log('📋 Migrácia 18: Vytváram vehicle ownership history tabuľku...');
                // Skontroluj či tabuľka už existuje
                const tableExists = await client.query(`
          SELECT table_name 
          FROM information_schema.tables 
          WHERE table_name = 'vehicle_ownership_history'
        `);
                if (tableExists.rows.length === 0) {
                    // Vytvor vehicle ownership history tabuľku
                    await client.query(`
            CREATE TABLE vehicle_ownership_history (
              id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
              vehicle_id UUID NOT NULL REFERENCES vehicles(id) ON DELETE CASCADE,
              owner_company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
              owner_company_name VARCHAR(255) NOT NULL, -- cached pre performance
              valid_from TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
              valid_to TIMESTAMP, -- NULL = aktívny vlastník
              transfer_reason VARCHAR(255) DEFAULT 'initial_setup', -- 'sale', 'acquisition', 'lease_end', etc.
              transfer_notes TEXT,
              created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
              updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
          `);
                    console.log('   ✅ vehicle_ownership_history tabuľka vytvorená');
                    // Vytvor indexy pre performance
                    await client.query(`
            CREATE INDEX idx_vehicle_ownership_history_vehicle_id 
            ON vehicle_ownership_history(vehicle_id)
          `);
                    await client.query(`
            CREATE INDEX idx_vehicle_ownership_history_owner_company_id 
            ON vehicle_ownership_history(owner_company_id)
          `);
                    await client.query(`
            CREATE INDEX idx_vehicle_ownership_history_valid_period 
            ON vehicle_ownership_history(valid_from, valid_to)
          `);
                    await client.query(`
            CREATE UNIQUE INDEX idx_vehicle_ownership_one_active 
            ON vehicle_ownership_history(vehicle_id) 
            WHERE valid_to IS NULL
          `);
                    console.log('   ✅ Indexy pre ownership history vytvorené');
                    // Migrácia existujúcich dát - vytvor historický záznam pre každé vozidlo
                    const migratedRows = await client.query(`
            INSERT INTO vehicle_ownership_history (
              vehicle_id, 
              owner_company_id, 
              owner_company_name, 
              valid_from, 
              transfer_reason
            )
            SELECT 
              v.id as vehicle_id,
              v.owner_company_id,
              c.name as owner_company_name,
              COALESCE(v.created_at, CURRENT_TIMESTAMP - INTERVAL '1 year') as valid_from,
              'initial_setup' as transfer_reason
            FROM vehicles v
            JOIN companies c ON v.owner_company_id = c.id
            WHERE v.owner_company_id IS NOT NULL
            AND NOT EXISTS (
              SELECT 1 FROM vehicle_ownership_history voh 
              WHERE voh.vehicle_id = v.id
            )
            RETURNING id
          `);
                    console.log(`   ✅ ${migratedRows.rowCount} existujúcich vozidiel migrovanych do ownership history`);
                }
                else {
                    console.log('   ℹ️ vehicle_ownership_history tabuľka už existuje');
                }
                console.log('✅ Migrácia 18: Vehicle Ownership History úspešne vytvorená');
            }
            catch (error) {
                console.log('⚠️ Migrácia 18 chyba:', error.message);
            }
            // Migrácia 19: Vehicle Company Snapshot - Zamrazenie historických prenájmov 🎯
            try {
                console.log('📋 Migrácia 19: Pridávanie vehicle_company_snapshot do rentals...');
                // Pridaj stĺpec pre snapshot company name
                await client.query(`
          ALTER TABLE rentals 
          ADD COLUMN IF NOT EXISTS vehicle_company_snapshot VARCHAR(255)
        `);
                console.log('   ✅ vehicle_company_snapshot stĺpec pridaný');
                // Migrácia existujúcich prenájmov - nastav historical ownership
                console.log('   🔄 Nastavujem historical ownership pre existujúce prenájmy...');
                const existingRentals = await client.query(`
          SELECT r.id, r.vehicle_id, r.start_date, r.vehicle_company_snapshot
          FROM rentals r 
          WHERE r.vehicle_company_snapshot IS NULL
        `);
                console.log(`   📊 Našiel som ${existingRentals.rows.length} prenájmov na migráciu`);
                let migratedCount = 0;
                for (const rental of existingRentals.rows) {
                    // Skús najsť historical owner z ownership history
                    const historicalOwner = await client.query(`
            SELECT owner_company_name
            FROM vehicle_ownership_history
            WHERE vehicle_id = $1
              AND valid_from <= $2
              AND (valid_to IS NULL OR valid_to > $2)
            ORDER BY valid_from DESC
            LIMIT 1
          `, [rental.vehicle_id, rental.start_date]);
                    let companyName = null;
                    if (historicalOwner.rows.length > 0) {
                        companyName = historicalOwner.rows[0].owner_company_name;
                    }
                    else {
                        // Fallback - aktuálny owner z vehicles
                        const currentOwner = await client.query(`
              SELECT company FROM vehicles WHERE id = $1
            `, [rental.vehicle_id]);
                        if (currentOwner.rows.length > 0) {
                            companyName = currentOwner.rows[0].company;
                        }
                    }
                    if (companyName) {
                        await client.query(`
              UPDATE rentals 
              SET vehicle_company_snapshot = $1 
              WHERE id = $2
            `, [companyName, rental.id]);
                        migratedCount++;
                    }
                }
                console.log(`   ✅ Migrácia dokončená pre ${migratedCount} prenájmov`);
                console.log('✅ Migrácia 19: Vehicle Company Snapshot úspešne vytvorená');
            }
            catch (error) {
                console.log('⚠️ Migrácia 19 chyba:', error.message);
            }
            // Migrácia 20: CLEAN SOLUTION - Nahradiť komplikovaný snapshot jednoduchým company field 🎯
            try {
                console.log('📋 Migrácia 20: CLEAN SOLUTION - Jednoduchý company field...');
                // Pridaj jednoduchý company stĺpec
                await client.query(`
          ALTER TABLE rentals 
          ADD COLUMN IF NOT EXISTS company VARCHAR(255)
        `);
                console.log('   ✅ company stĺpec pridaný');
                // Migrácia dát z vehicle_company_snapshot do company
                console.log('   🔄 Kopírujem dáta z vehicle_company_snapshot do company...');
                const migrateResult = await client.query(`
          UPDATE rentals 
          SET company = COALESCE(vehicle_company_snapshot, (
            SELECT v.company 
            FROM vehicles v 
            WHERE v.id = rentals.vehicle_id
          ))
          WHERE company IS NULL
        `);
                console.log(`   📊 Migrovaných ${migrateResult.rowCount} prenájmov`);
                // Po úspešnej migrácii môžeme odstrániť starý komplikovaný stĺpec
                console.log('   🧹 Odstraňujem starý vehicle_company_snapshot stĺpec...');
                try {
                    await client.query(`ALTER TABLE rentals DROP COLUMN IF EXISTS vehicle_company_snapshot`);
                    console.log('   ✅ vehicle_company_snapshot stĺpec odstránený');
                }
                catch (dropError) {
                    console.log('   ⚠️ Nemožno odstrániť vehicle_company_snapshot:', dropError.message);
                }
                console.log('✅ Migrácia 20: CLEAN SOLUTION úspešne dokončená');
            }
            catch (error) {
                console.log('⚠️ Migrácia 20 chyba:', error.message);
            }
            // Migrácia 21: 🛡️ BULLETPROOF - Historický backfill company (NIKDY sa nezmení!) ✅
            try {
                console.log('📋 Migrácia 21: 🛡️ BULLETPROOF - Historické company pre prenájmy...');
                // Reset všetkých company na NULL pre rebackfill
                console.log('   🧹 Resetujem company stĺpce pre rebackfill...');
                await client.query(`UPDATE rentals SET company = NULL`);
                // Backfill pomocou HISTORICKEJ ownership na základe rental.startDate
                console.log('   📅 Backfillujem historické company na základe startDate...');
                const backfillResult = await client.query(`
          UPDATE rentals 
          SET company = (
            SELECT voh.owner_company_name
            FROM vehicle_ownership_history voh
            WHERE voh.vehicle_id = rentals.vehicle_id
              AND voh.valid_from <= rentals.start_date
              AND (voh.valid_to IS NULL OR voh.valid_to > rentals.start_date)
            LIMIT 1
          )
          WHERE company IS NULL
        `);
                console.log(`   📊 Backfillované ${backfillResult.rowCount} prenájmov s historickou company`);
                // Fallback pre prenájmy bez ownership history - použij aktuálnu company
                console.log('   🔄 Fallback pre prenájmy bez ownership history...');
                const fallbackResult = await client.query(`
          UPDATE rentals 
          SET company = (
            SELECT v.company 
            FROM vehicles v 
            WHERE v.id = rentals.vehicle_id
          )
          WHERE company IS NULL
        `);
                console.log(`   📊 Fallback ${fallbackResult.rowCount} prenájmov s aktuálnou company`);
                // Overenie výsledku
                const nullCompanyCount = await client.query(`
          SELECT COUNT(*) as count FROM rentals WHERE company IS NULL
        `);
                console.log(`   ✅ Zostáva ${nullCompanyCount.rows[0].count} prenájmov bez company`);
                console.log('✅ Migrácia 21: 🛡️ BULLETPROOF historické company FIX dokončený');
            }
            catch (error) {
                console.log('⚠️ Migrácia 21 chyba:', error.message);
            }
            // Migrácia 22: ⚡ PERFORMANCE INDEXY - Optimalizácia rýchlosti načítavania dát
            try {
                console.log('📋 Migrácia 22: ⚡ Pridávanie performance indexov pre rýchlejšie načítanie...');
                // 🚀 INDEX 1: rentals.vehicle_id - Pre rýchlejší JOIN v getRentals()
                await client.query(`
          CREATE INDEX IF NOT EXISTS idx_rentals_vehicle_id ON rentals(vehicle_id)
        `);
                console.log('   ✅ Index idx_rentals_vehicle_id pridaný');
                // 🚀 INDEX 2: vehicles.owner_company_id - Pre rýchlejšie permission filtering
                await client.query(`
          CREATE INDEX IF NOT EXISTS idx_vehicles_owner_company_id ON vehicles(owner_company_id)
        `);
                console.log('   ✅ Index idx_vehicles_owner_company_id pridaný');
                // 🚀 INDEX 3: rentals.created_at DESC - Pre rýchlejšie ORDER BY v getRentals()
                await client.query(`
          CREATE INDEX IF NOT EXISTS idx_rentals_created_at_desc ON rentals(created_at DESC)
        `);
                console.log('   ✅ Index idx_rentals_created_at_desc pridaný');
                // 🚀 INDEX 4: vehicles.created_at DESC - Pre rýchlejšie ORDER BY v getVehicles()
                await client.query(`
          CREATE INDEX IF NOT EXISTS idx_vehicles_created_at_desc ON vehicles(created_at DESC)
        `);
                console.log('   ✅ Index idx_vehicles_created_at_desc pridaný');
                // 🚀 INDEX 5: expenses.vehicle_id - Pre rýchlejšie queries v expense API
                await client.query(`
          CREATE INDEX IF NOT EXISTS idx_expenses_vehicle_id ON expenses(vehicle_id)
        `);
                console.log('   ✅ Index idx_expenses_vehicle_id pridaný');
                // 🚀 INDEX 6: expenses.date DESC - Pre rýchlejšie date filtering
                await client.query(`
          CREATE INDEX IF NOT EXISTS idx_expenses_date_desc ON expenses(date DESC)
        `);
                console.log('   ✅ Index idx_expenses_date_desc pridaný');
                console.log('✅ Migrácia 22: ⚡ Performance indexy úspešne pridané (očakávaná úspora: 30-50% rýchlosť)');
            }
            catch (error) {
                console.log('⚠️ Migrácia 22 chyba:', error.message);
            }
            // Migrácia 23: 🔄 FLEXIBILNÉ PRENÁJMY - Pridanie stĺpcov pre hybridný prístup
            try {
                console.log('📋 Migrácia 23: 🔄 Pridávanie stĺpcov pre flexibilné prenájmy...');
                await client.query(`
          ALTER TABLE rentals 
          ADD COLUMN IF NOT EXISTS rental_type VARCHAR(20) DEFAULT 'standard',
          ADD COLUMN IF NOT EXISTS is_flexible BOOLEAN DEFAULT false,
          ADD COLUMN IF NOT EXISTS flexible_end_date DATE,
          ADD COLUMN IF NOT EXISTS can_be_overridden BOOLEAN DEFAULT false,
          ADD COLUMN IF NOT EXISTS override_priority INTEGER DEFAULT 5,
          ADD COLUMN IF NOT EXISTS notification_threshold INTEGER DEFAULT 3,
          ADD COLUMN IF NOT EXISTS auto_extend BOOLEAN DEFAULT false,
          ADD COLUMN IF NOT EXISTS override_history JSONB DEFAULT '[]'::jsonb;
        `);
                console.log('   ✅ Flexibilné prenájmy stĺpce pridané do rentals tabuľky');
                // Vytvorenie indexu pre rýchlejšie vyhľadávanie flexibilných prenájmov
                await client.query(`
          CREATE INDEX IF NOT EXISTS idx_rentals_flexible ON rentals(is_flexible, rental_type) 
          WHERE is_flexible = true;
        `);
                console.log('   ✅ Index pre flexibilné prenájmy vytvorený');
                // Vytvorenie indexu pre override priority
                await client.query(`
          CREATE INDEX IF NOT EXISTS idx_rentals_override_priority ON rentals(override_priority, can_be_overridden) 
          WHERE can_be_overridden = true;
        `);
                console.log('   ✅ Index pre override priority vytvorený');
                console.log('✅ Migrácia 23: 🔄 Flexibilné prenájmy úspešne implementované!');
                console.log('   📝 Nové funkcie:');
                console.log('   • rental_type: standard | flexible | priority');
                console.log('   • is_flexible: true/false flag');
                console.log('   • flexible_end_date: odhadovaný koniec');
                console.log('   • can_be_overridden: možnosť prepísania');
                console.log('   • override_priority: priorita (1-10)');
                console.log('   • notification_threshold: dni vopred na upozornenie');
                console.log('   • auto_extend: automatické predĺženie');
                console.log('   • override_history: história zmien');
            }
            catch (error) {
                console.log('⚠️ Migrácia 23 chyba:', error.message);
            }
            // Migrácia 24: 🚗 VEHICLE CATEGORIES - Pridanie kategórií vozidiel pre lepšie filtrovanie
            try {
                console.log('📋 Migrácia 24: 🚗 Pridávanie kategórií vozidiel...');
                // Skontroluj či category stĺpec už existuje
                const columnExists = await client.query(`
          SELECT column_name 
          FROM information_schema.columns 
          WHERE table_name = 'vehicles' AND column_name = 'category'
        `);
                if (columnExists.rows.length === 0) {
                    // Vytvor ENUM pre kategórie vozidiel
                    await client.query(`
            DO $$ BEGIN
              CREATE TYPE vehicle_category AS ENUM (
                'nizka-trieda',    -- 🚗 Nízka trieda (Škoda Fabia, Hyundai i20)
                'stredna-trieda',  -- 🚙 Stredná trieda (VW Golf, Opel Astra)
                'vyssia-stredna',  -- 🚘 Vyššia stredná (BMW 3, Audi A4)
                'luxusne',         -- 💎 Luxusné (BMW 7, Mercedes S)
                'sportove',        -- 🏎️ Športové (BMW M, AMG)
                'suv',             -- 🚜 SUV (BMW X5, Audi Q7)
                'viacmiestne',     -- 👨‍👩‍👧‍👦 Viacmiestne (VW Sharan, 7+ sedadiel)
                'dodavky'          -- 📦 Dodávky (Sprinter, Transit)
              );
            EXCEPTION
              WHEN duplicate_object THEN null;
            END $$;
          `);
                    // Pridaj category stĺpec do vehicles tabuľky
                    await client.query(`
            ALTER TABLE vehicles 
            ADD COLUMN category vehicle_category DEFAULT 'stredna-trieda'
          `);
                    console.log('   ✅ ENUM vehicle_category vytvorený');
                    console.log('   ✅ category stĺpec pridaný do vehicles tabuľky');
                    console.log('   📋 8 kategórií dostupných: nizka-trieda, stredna-trieda, vyssia-stredna, luxusne, sportove, suv, viacmiestne, dodavky');
                }
                else {
                    console.log('   ℹ️ category stĺpec už existuje');
                }
                console.log('✅ Migrácia 24: 🚗 Vehicle Categories úspešne implementované!');
                console.log('   🎯 Vozidlá teraz môžu byť kategorizované pre lepšie filtrovanie');
                console.log('   🔍 Frontend môže používať multi-select category filter');
            }
            catch (error) {
                console.log('⚠️ Migrácia 24 chyba:', error.message);
            }
            // Migrácia 25: 🗑️ AUDIT LOGGING REMOVAL - Odstraňujeme audit logs systém
            try {
                console.log('📋 Migrácia 25: 🗑️ Odstraňujem audit_logs tabuľku...');
                // Odstránenie audit_logs tabuľky a všetkých indexov
                await client.query(`DROP TABLE IF EXISTS audit_logs CASCADE;`);
                console.log('✅ Migrácia 25: 🗑️ Audit Logs systém úspešne odstránený!');
                console.log('   🧹 Tabuľka audit_logs a všetky indexy odstránené');
                console.log('   ⚡ Znížená záťaž na databázu a lepšie performance');
            }
            catch (error) {
                console.log('⚠️ Migrácia 25 chyba:', error.message);
            }
            // Migrácia 26: 📧 IMAP EMAIL SUPPORT - Pridanie customer email stĺpcov do rentals
            try {
                console.log('📋 Migrácia 26: 📧 Pridávanie IMAP email support stĺpcov do rentals...');
                // Skontroluj či stĺpce už existujú
                const columnCheck = await client.query(`
          SELECT column_name 
          FROM information_schema.columns 
          WHERE table_name = 'rentals' AND column_name IN ('customer_email', 'customer_phone', 'order_number', 'vehicle_name', 'vehicle_code', 'handover_place', 'daily_kilometers', 'approval_status', 'auto_processed_at', 'email_content')
        `);
                const existingColumns = columnCheck.rows.map((row) => row.column_name);
                const neededColumns = [
                    'customer_email', 'customer_phone', 'order_number', 'vehicle_name',
                    'vehicle_code', 'handover_place', 'daily_kilometers', 'approval_status',
                    'auto_processed_at', 'email_content'
                ];
                const missingColumns = neededColumns.filter(col => !existingColumns.includes(col));
                if (missingColumns.length > 0) {
                    console.log(`   📧 Pridávam ${missingColumns.length} chýbajúcich stĺpcov:`, missingColumns);
                    await client.query(`
            ALTER TABLE rentals 
            ADD COLUMN IF NOT EXISTS customer_email VARCHAR(255),
            ADD COLUMN IF NOT EXISTS customer_phone VARCHAR(30),
            ADD COLUMN IF NOT EXISTS order_number VARCHAR(100),
            ADD COLUMN IF NOT EXISTS vehicle_name VARCHAR(255),
            ADD COLUMN IF NOT EXISTS vehicle_code VARCHAR(100),
            ADD COLUMN IF NOT EXISTS handover_place VARCHAR(255),
            ADD COLUMN IF NOT EXISTS daily_kilometers INTEGER,
            ADD COLUMN IF NOT EXISTS approval_status VARCHAR(30) DEFAULT 'pending',
            ADD COLUMN IF NOT EXISTS auto_processed_at TIMESTAMP,
            ADD COLUMN IF NOT EXISTS email_content TEXT
          `);
                    console.log('   ✅ IMAP stĺpce pridané do rentals tabuľky');
                }
                else {
                    console.log('   ℹ️ Všetky IMAP stĺpce už existujú');
                }
                // Pridaj indexy pre lepšiu performance pri vyhľadávaní emailových objednávok
                await client.query(`
          CREATE INDEX IF NOT EXISTS idx_rentals_order_number ON rentals(order_number);
          CREATE INDEX IF NOT EXISTS idx_rentals_customer_email ON rentals(customer_email);
          CREATE INDEX IF NOT EXISTS idx_rentals_approval_status ON rentals(approval_status);
          CREATE INDEX IF NOT EXISTS idx_rentals_auto_processed_at ON rentals(auto_processed_at DESC);
        `);
                console.log('✅ Migrácia 26: 📧 IMAP Email Support úspešne implementovaný!');
                console.log('   📧 Customer email, phone, order number support');
                console.log('   🚗 Vehicle name a code pre email parsing');
                console.log('   📍 Handover place a daily kilometers');
                console.log('   ⚖️ Approval status workflow pre email objednávky');
                console.log('   🔍 Optimalizované indexy pre email vyhľadávanie');
            }
            catch (error) {
                console.log('⚠️ Migrácia 26 chyba:', error.message);
            }
            // Migrácia 27: 📧 EMAIL MANAGEMENT DASHBOARD - Email History & Tracking
            try {
                console.log('📋 Migrácia 27: 📧 Vytváram Email Management Dashboard štruktúru...');
                // Vytvorenie tabuľky pre email históriu a tracking
                await client.query(`
          CREATE TABLE IF NOT EXISTS email_processing_history (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            email_id TEXT UNIQUE NOT NULL,
            message_id TEXT,
            subject TEXT NOT NULL,
            sender TEXT NOT NULL,
            recipient TEXT DEFAULT 'info@blackrent.sk',
            email_content TEXT,
            email_html TEXT,
            received_at TIMESTAMP NOT NULL,
            processed_at TIMESTAMP,
            status TEXT NOT NULL DEFAULT 'new' CHECK (status IN ('new', 'processing', 'processed', 'rejected', 'archived', 'duplicate')),
            action_taken TEXT CHECK (action_taken IN ('approved', 'rejected', 'edited', 'deleted', 'archived', 'duplicate')),
            processed_by UUID REFERENCES users(id),
            parsed_data JSONB,
            confidence_score DECIMAL(3,2) DEFAULT 0.0,
            error_message TEXT,
            notes TEXT,
            tags TEXT[],
            rental_id UUID REFERENCES rentals(id),
            is_blacklisted BOOLEAN DEFAULT FALSE,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
          );
        `);
                // Vytvorenie indexov pre optimálnu performance
                await client.query(`
          CREATE INDEX IF NOT EXISTS idx_email_history_email_id ON email_processing_history(email_id);
          CREATE INDEX IF NOT EXISTS idx_email_history_status ON email_processing_history(status);
          CREATE INDEX IF NOT EXISTS idx_email_history_sender ON email_processing_history(sender);
          CREATE INDEX IF NOT EXISTS idx_email_history_received_at ON email_processing_history(received_at DESC);
          CREATE INDEX IF NOT EXISTS idx_email_history_processed_by ON email_processing_history(processed_by);
          CREATE INDEX IF NOT EXISTS idx_email_history_rental_id ON email_processing_history(rental_id);
          CREATE INDEX IF NOT EXISTS idx_email_history_search ON email_processing_history USING gin(to_tsvector('english', subject || ' ' || COALESCE(email_content, '')));
        `);
                // Vytvorenie tabuľky pre email actions log
                await client.query(`
          CREATE TABLE IF NOT EXISTS email_action_logs (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            email_id UUID REFERENCES email_processing_history(id),
            user_id UUID REFERENCES users(id),
            action TEXT NOT NULL,
            old_values JSONB,
            new_values JSONB,
            notes TEXT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
          );
        `);
                await client.query(`
          CREATE INDEX IF NOT EXISTS idx_email_action_logs_email_id ON email_action_logs(email_id);
          CREATE INDEX IF NOT EXISTS idx_email_action_logs_user_id ON email_action_logs(user_id);
          CREATE INDEX IF NOT EXISTS idx_email_action_logs_created_at ON email_action_logs(created_at DESC);
        `);
                // Trigger na automatické updatovanie updated_at stĺpca
                await client.query(`
          CREATE OR REPLACE FUNCTION update_email_history_updated_at()
          RETURNS TRIGGER AS $$
          BEGIN
            NEW.updated_at = CURRENT_TIMESTAMP;
            RETURN NEW;
          END;
          $$ LANGUAGE plpgsql;

          DROP TRIGGER IF EXISTS trigger_email_history_updated_at ON email_processing_history;
          CREATE TRIGGER trigger_email_history_updated_at
            BEFORE UPDATE ON email_processing_history
            FOR EACH ROW
            EXECUTE FUNCTION update_email_history_updated_at();
        `);
                console.log('✅ Migrácia 27: 📧 Email Management Dashboard úspešne vytvorený!');
                console.log('   📧 Email processing history tabuľka');
                console.log('   📊 Email action logs pre audit trail');
                console.log('   🔍 Optimalizované indexy pre search & filtering');
                console.log('   ⚡ Auto-update triggers pre timestamp tracking');
            }
            catch (error) {
                console.log('⚠️ Migrácia 27 chyba:', error.message);
            }
        }
        catch (error) {
            console.log('⚠️ Migrácie celkovo preskočené:', error.message);
        }
    }
    // DATA INTEGRITY VALIDATION
    async validateDataIntegrity(client) {
        console.log('🔍 Spúšťam data integrity validation...');
        try {
            // 1. Kontrola orphaned rentals (rentals bez platných vehicles)
            const orphanedRentals = await client.query(`
        SELECT r.id, r.customer_name, r.vehicle_id 
        FROM rentals r 
        LEFT JOIN vehicles v ON r.vehicle_id = v.id 
        WHERE r.vehicle_id IS NOT NULL AND v.id IS NULL
      `);
            if (orphanedRentals.rows.length > 0) {
                console.log(`⚠️ PROBLÉM: ${orphanedRentals.rows.length} rentals má neplatné vehicle_id`);
                for (const rental of orphanedRentals.rows) {
                    console.log(`   ❌ Rental ${rental.id} (${rental.customer_name}) -> neexistujúce vehicle_id: ${rental.vehicle_id}`);
                }
            }
            else {
                console.log('✅ Všetky rentals majú platné vehicle_id');
            }
            // 2. Kontrola vehicles bez owner_company_id
            const vehiclesWithoutCompany = await client.query(`
        SELECT id, brand, model, license_plate, company 
        FROM vehicles 
        WHERE owner_company_id IS NULL
      `);
            if (vehiclesWithoutCompany.rows.length > 0) {
                console.log(`⚠️ PROBLÉM: ${vehiclesWithoutCompany.rows.length} vozidiel nemá owner_company_id`);
            }
            else {
                console.log('✅ Všetky vozidlá majú owner_company_id');
            }
            // 3. Kontrola users bez company_id
            const usersWithoutCompany = await client.query(`
        SELECT id, username, role 
        FROM users 
        WHERE company_id IS NULL AND role = 'company_owner'
      `);
            if (usersWithoutCompany.rows.length > 0) {
                console.log(`⚠️ PROBLÉM: ${usersWithoutCompany.rows.length} company_owner users nemá company_id`);
            }
            else {
                console.log('✅ Všetci company_owner users majú company_id');
            }
            // 4. Kontrola UUID konzistentnosti
            const uuidConsistency = await client.query(`
        SELECT 
          (SELECT COUNT(*) FROM vehicles WHERE id ~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$') as valid_vehicle_uuids,
          (SELECT COUNT(*) FROM vehicles) as total_vehicles,
          (SELECT COUNT(*) FROM users WHERE id ~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$') as valid_user_uuids,
          (SELECT COUNT(*) FROM users) as total_users
      `);
            const uuidData = uuidConsistency.rows[0];
            if (uuidData.valid_vehicle_uuids == uuidData.total_vehicles && uuidData.valid_user_uuids == uuidData.total_users) {
                console.log('✅ UUID formát je konzistentný');
            }
            else {
                console.log(`⚠️ PROBLÉM: UUID formát nie je konzistentný - Vehicles: ${uuidData.valid_vehicle_uuids}/${uuidData.total_vehicles}, Users: ${uuidData.valid_user_uuids}/${uuidData.total_users}`);
            }
            console.log('✅ Data integrity validation dokončená');
        }
        catch (error) {
            console.log('⚠️ Data integrity validation chyba:', error.message);
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
    async createSampleDataIfEmpty(client) {
        try {
            // Skontroluj či existujú nejaké dáta
            const vehicleCount = await client.query('SELECT COUNT(*) FROM vehicles');
            const customerCount = await client.query('SELECT COUNT(*) FROM customers');
            const rentalCount = await client.query('SELECT COUNT(*) FROM rentals');
            console.log('📊 Počet záznamov: vehicles:', vehicleCount.rows[0].count, 'customers:', customerCount.rows[0].count, 'rentals:', rentalCount.rows[0].count);
            // VYPNUTÉ: Automatické vytváranie testových dát
            if (false && rentalCount.rows[0].count === '0' && vehicleCount.rows[0].count === '0') {
                console.log('📋 Vytváranie testovacích dát...');
                // Vytvorenie firiem - jednoducho bez duplicitov
                try {
                    // Skontroluj existujúce firmy
                    const existingCompanies = await client.query('SELECT name FROM companies WHERE name IN ($1, $2, $3)', ['ABC Rent', 'Premium Cars', 'City Rent']);
                    const existingNames = existingCompanies.rows.map(row => row.name);
                    const companiesToInsert = ['ABC Rent', 'Premium Cars', 'City Rent'].filter(name => !existingNames.includes(name));
                    if (companiesToInsert.length > 0) {
                        const values = companiesToInsert.map((name, index) => `($${index + 1})`).join(', ');
                        await client.query(`INSERT INTO companies (name) VALUES ${values}`, companiesToInsert);
                        console.log('✅ Firmy vytvorené:', companiesToInsert);
                    }
                }
                catch (error) {
                    console.log('⚠️ Chyba pri vytváraní firiem:', error.message);
                }
                // Vytvorenie poisťovní
                try {
                    // Skontroluj existujúce poisťovne
                    const existingInsurers = await client.query('SELECT name FROM insurers WHERE name IN ($1, $2)', ['Allianz', 'Generali']);
                    const existingInsurerNames = existingInsurers.rows.map(row => row.name);
                    const insurersToInsert = ['Allianz', 'Generali'].filter(name => !existingInsurerNames.includes(name));
                    if (insurersToInsert.length > 0) {
                        const values = insurersToInsert.map((name, index) => `($${index + 1})`).join(', ');
                        await client.query(`INSERT INTO insurers (name) VALUES ${values}`, insurersToInsert);
                        console.log('✅ Poisťovne vytvorené:', insurersToInsert);
                    }
                }
                catch (error) {
                    console.log('⚠️ Chyba pri vytváraní poisťovní:', error.message);
                }
                // Vytvorenie vozidiel - len ak neexistujú
                try {
                    const existingVehicles = await client.query('SELECT COUNT(*) FROM vehicles WHERE license_plate IN ($1, $2, $3, $4, $5)', ['BA123AB', 'BA456CD', 'BA789EF', 'BA111XY', 'BA222XZ']);
                    if (existingVehicles.rows[0].count === '0') {
                        const vehicleResult = await client.query(`
              INSERT INTO vehicles (brand, model, license_plate, company, pricing, commission, status) VALUES 
              ('BMW', 'X5', 'BA123AB', 'ABC Rent', $1, $2, 'available'),
              ('Mercedes', 'E-Class', 'BA456CD', 'Premium Cars', $3, $4, 'available'),
              ('Audi', 'A4', 'BA789EF', 'City Rent', $5, $6, 'available'),
              ('Skoda', 'Octavia', 'BA111XY', 'City Rent', $7, $8, 'available'),
              ('Volkswagen', 'Passat', 'BA222XZ', 'ABC Rent', $9, $10, 'available')
              RETURNING id, brand, model
            `, [
                            // BMW X5 - Premium SUV pricing
                            JSON.stringify([
                                { id: '1', minDays: 0, maxDays: 1, pricePerDay: 120 }, // 0-1 dní
                                { id: '2', minDays: 2, maxDays: 3, pricePerDay: 110 }, // 2-3 dni
                                { id: '3', minDays: 4, maxDays: 7, pricePerDay: 100 }, // 4-7 dní
                                { id: '4', minDays: 8, maxDays: 14, pricePerDay: 90 }, // 8-14 dní
                                { id: '5', minDays: 15, maxDays: 22, pricePerDay: 85 }, // 15-22 dní
                                { id: '6', minDays: 23, maxDays: 30, pricePerDay: 80 }, // 23-30 dní
                                { id: '7', minDays: 31, maxDays: 365, pricePerDay: 75 } // 31+ dní
                            ]),
                            JSON.stringify({ type: 'percentage', value: 20 }),
                            // Mercedes E-Class - Business class pricing
                            JSON.stringify([
                                { id: '1', minDays: 0, maxDays: 1, pricePerDay: 100 }, // 0-1 dní
                                { id: '2', minDays: 2, maxDays: 3, pricePerDay: 95 }, // 2-3 dni
                                { id: '3', minDays: 4, maxDays: 7, pricePerDay: 85 }, // 4-7 dní
                                { id: '4', minDays: 8, maxDays: 14, pricePerDay: 75 }, // 8-14 dní
                                { id: '5', minDays: 15, maxDays: 22, pricePerDay: 70 }, // 15-22 dní
                                { id: '6', minDays: 23, maxDays: 30, pricePerDay: 65 }, // 23-30 dní
                                { id: '7', minDays: 31, maxDays: 365, pricePerDay: 60 } // 31+ dní
                            ]),
                            JSON.stringify({ type: 'percentage', value: 20 }),
                            // Audi A4 - Standard sedan pricing
                            JSON.stringify([
                                { id: '1', minDays: 0, maxDays: 1, pricePerDay: 80 }, // 0-1 dní
                                { id: '2', minDays: 2, maxDays: 3, pricePerDay: 75 }, // 2-3 dni
                                { id: '3', minDays: 4, maxDays: 7, pricePerDay: 70 }, // 4-7 dní
                                { id: '4', minDays: 8, maxDays: 14, pricePerDay: 60 }, // 8-14 dní
                                { id: '5', minDays: 15, maxDays: 22, pricePerDay: 55 }, // 15-22 dní
                                { id: '6', minDays: 23, maxDays: 30, pricePerDay: 50 }, // 23-30 dní
                                { id: '7', minDays: 31, maxDays: 365, pricePerDay: 45 } // 31+ dní
                            ]),
                            JSON.stringify({ type: 'percentage', value: 20 }),
                            // Skoda Octavia - Budget friendly pricing
                            JSON.stringify([
                                { id: '1', minDays: 0, maxDays: 1, pricePerDay: 60 }, // 0-1 dní
                                { id: '2', minDays: 2, maxDays: 3, pricePerDay: 55 }, // 2-3 dni
                                { id: '3', minDays: 4, maxDays: 7, pricePerDay: 50 }, // 4-7 dní
                                { id: '4', minDays: 8, maxDays: 14, pricePerDay: 45 }, // 8-14 dní
                                { id: '5', minDays: 15, maxDays: 22, pricePerDay: 40 }, // 15-22 dní
                                { id: '6', minDays: 23, maxDays: 30, pricePerDay: 35 }, // 23-30 dní
                                { id: '7', minDays: 31, maxDays: 365, pricePerDay: 30 } // 31+ dní
                            ]),
                            JSON.stringify({ type: 'percentage', value: 20 }),
                            // Volkswagen Passat - Mid-range pricing
                            JSON.stringify([
                                { id: '1', minDays: 0, maxDays: 1, pricePerDay: 70 }, // 0-1 dní
                                { id: '2', minDays: 2, maxDays: 3, pricePerDay: 65 }, // 2-3 dni
                                { id: '3', minDays: 4, maxDays: 7, pricePerDay: 60 }, // 4-7 dní
                                { id: '4', minDays: 8, maxDays: 14, pricePerDay: 55 }, // 8-14 dní
                                { id: '5', minDays: 15, maxDays: 22, pricePerDay: 50 }, // 15-22 dní
                                { id: '6', minDays: 23, maxDays: 30, pricePerDay: 45 }, // 23-30 dní
                                { id: '7', minDays: 31, maxDays: 365, pricePerDay: 40 } // 31+ dní
                            ]),
                            JSON.stringify({ type: 'percentage', value: 20 })
                        ]);
                        const vehicles = vehicleResult.rows;
                        console.log('✅ Vozidlá vytvorené:', vehicles.length);
                        // Vytvorenie zákazníkov
                        const customerResult = await client.query(`
              INSERT INTO customers (name, email, phone) VALUES 
              ('Ján Novák', 'jan.novak@email.com', '+421901234567'),
              ('Mária Svobodová', 'maria.svobodova@email.com', '+421907654321'),
              ('Peter Horváth', 'peter.horvath@email.com', '+421905111222')
              RETURNING id, name
            `);
                        const customers = customerResult.rows;
                        console.log('✅ Zákazníci vytvorení:', customers.length);
                        // Vytvorenie prenájmov s reálnymi ID
                        if (vehicles.length > 0 && customers.length > 0) {
                            await client.query(`
                INSERT INTO rentals (vehicle_id, customer_id, customer_name, start_date, end_date, total_price, commission, payment_method, paid, confirmed, handover_place) VALUES 
                ($1, $2, $3, '2025-01-20', '2025-01-23', 240.00, 36.00, 'bank_transfer', true, true, 'Bratislava - Hlavná stanica'),
                ($4, $5, $6, '2025-01-25', '2025-01-30', 400.00, 72.00, 'cash', false, true, 'Bratislava - Letisko'),
                ($7, $8, $9, '2025-01-28', '2025-02-02', 275.00, 33.00, 'bank_transfer', true, false, 'Košice - Centrum')
              `, [
                                vehicles[0]?.id, customers[0]?.id, customers[0]?.name,
                                vehicles[1]?.id, customers[1]?.id, customers[1]?.name,
                                vehicles[2]?.id, customers[2]?.id, customers[2]?.name
                            ]);
                            console.log('✅ Prenájmy vytvorené: 3');
                        }
                        console.log('🎉 Testové dáta úspešne vytvorené!');
                        console.log('📊 Vytvorené:');
                        console.log('   - 3 vozidlá (BMW X5, Mercedes E-Class, Audi A4)');
                        console.log('   - 3 zákazníkov (Ján Novák, Mária Svobodová, Peter Horváth)');
                        console.log('   - 3 prenájmy s rôznymi stavmi');
                        console.log('   - 3 firmy (ABC Rent, Premium Cars, City Rent)');
                        console.log('   - 2 poisťovne (Allianz, Generali)');
                    }
                    else {
                        console.log('ℹ️ Vozidlá už existujú, preskakujem vytváranie testovacích dát');
                    }
                }
                catch (vehicleError) {
                    console.log('⚠️ Chyba pri vytváraní vozidiel:', vehicleError.message);
                }
            }
            else {
                console.log('ℹ️ Databáza už obsahuje dáta, preskakujem vytváranie testovacích dát');
            }
        }
        catch (error) {
            console.error('⚠️ Chyba pri vytváraní testovacích dát:', error);
        }
    }
    // Metódy pre používateľov
    async getUserByUsername(username) {
        try {
            // Najprv skús v hlavnej users tabuľke
            const result = await this.pool.query('SELECT id, username, email, password_hash as password, role, company_id, employee_number, hire_date, is_active, last_login, first_name, last_name, signature_template, created_at, updated_at FROM users WHERE username = $1', [username]);
            if (result.rows.length > 0) {
                const row = result.rows[0];
                return {
                    id: row.id,
                    username: row.username,
                    email: row.email,
                    password: row.password,
                    firstName: row.first_name,
                    lastName: row.last_name,
                    role: row.role,
                    companyId: row.company_id,
                    employeeNumber: row.employee_number,
                    hireDate: row.hire_date ? new Date(row.hire_date) : undefined,
                    isActive: row.is_active ?? true,
                    lastLogin: row.last_login ? new Date(row.last_login) : undefined,
                    signatureTemplate: row.signature_template,
                    createdAt: new Date(row.created_at),
                    updatedAt: row.updated_at ? new Date(row.updated_at) : undefined
                };
            }
            return null;
        }
        catch (error) {
            console.error('❌ Chyba pri získavaní používateľa podľa username:', error);
            return null;
        }
    }
    async getUserById(id) {
        try {
            const result = await this.pool.query('SELECT id, username, email, password_hash as password, role, company_id, employee_number, hire_date, is_active, last_login, first_name, last_name, signature_template, created_at, updated_at FROM users WHERE id = $1', [id]);
            if (result.rows.length > 0) {
                const row = result.rows[0];
                return {
                    id: row.id,
                    username: row.username,
                    email: row.email,
                    password: row.password,
                    firstName: row.first_name,
                    lastName: row.last_name,
                    role: row.role,
                    companyId: row.company_id,
                    employeeNumber: row.employee_number,
                    hireDate: row.hire_date ? new Date(row.hire_date) : undefined,
                    isActive: row.is_active ?? true,
                    lastLogin: row.last_login ? new Date(row.last_login) : undefined,
                    signatureTemplate: row.signature_template,
                    createdAt: new Date(row.created_at),
                    updatedAt: row.updated_at ? new Date(row.updated_at) : undefined
                };
            }
            return null;
        }
        catch (error) {
            console.error('❌ Chyba pri získavaní používateľa podľa ID:', error);
            return null;
        }
    }
    async createUser(userData) {
        const client = await this.pool.connect();
        try {
            console.log('🗄️ Database createUser - userData:', userData);
            const hashedPassword = await bcryptjs_1.default.hash(userData.password, 12);
            const result = await client.query(`INSERT INTO users (
          username, email, password_hash, role, first_name, last_name, 
          company_id, employee_number, hire_date, is_active, signature_template
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11) 
        RETURNING id, username, email, password_hash, role, first_name, last_name,
                  company_id, employee_number, hire_date, is_active, last_login,
                  signature_template, created_at, updated_at`, [
                userData.username,
                userData.email,
                hashedPassword,
                userData.role,
                userData.firstName,
                userData.lastName,
                userData.companyId || null, // UUID string, no conversion needed
                userData.employeeNumber,
                userData.hireDate,
                userData.isActive ?? true,
                userData.signatureTemplate
            ]);
            const row = result.rows[0];
            console.log('🗄️ Database createUser - result row:', row);
            return {
                id: row.id.toString(),
                username: row.username,
                email: row.email,
                password: row.password_hash,
                role: row.role,
                firstName: row.first_name,
                lastName: row.last_name,
                companyId: row.company_id, // UUID string, no conversion needed
                employeeNumber: row.employee_number,
                hireDate: row.hire_date ? new Date(row.hire_date) : undefined,
                isActive: row.is_active ?? true,
                lastLogin: row.last_login ? new Date(row.last_login) : undefined,
                permissions: [], // Default empty permissions
                signatureTemplate: row.signature_template,
                createdAt: new Date(row.created_at),
                updatedAt: row.updated_at ? new Date(row.updated_at) : undefined
            };
        }
        catch (error) {
            console.error('❌ Database createUser error:', error);
            throw error;
        }
        finally {
            client.release();
        }
    }
    async updateUser(user) {
        const client = await this.pool.connect();
        try {
            const hashedPassword = await bcryptjs_1.default.hash(user.password, 12);
            await client.query('UPDATE users SET username = $1, email = $2, password_hash = $3, role = $4, company_id = $5, employee_number = $6, hire_date = $7, is_active = $8, first_name = $9, last_name = $10, signature_template = $11, updated_at = CURRENT_TIMESTAMP WHERE id = $12', [
                user.username,
                user.email,
                hashedPassword,
                user.role,
                user.companyId || null, // UUID string, no conversion needed
                user.employeeNumber,
                user.hireDate,
                user.isActive,
                user.firstName,
                user.lastName,
                user.signatureTemplate,
                user.id
            ]);
        }
        finally {
            client.release();
        }
    }
    async deleteUser(id) {
        const client = await this.pool.connect();
        try {
            await client.query('DELETE FROM users WHERE id = $1', [id]); // Removed parseInt for UUID
        }
        finally {
            client.release();
        }
    }
    async getUsers() {
        const client = await this.pool.connect();
        try {
            const result = await client.query('SELECT id, username, email, password_hash as password, role, company_id, employee_number, hire_date, is_active, last_login, first_name, last_name, signature_template, created_at, updated_at FROM users ORDER BY created_at DESC');
            return result.rows.map(row => ({
                id: row.id?.toString(),
                username: row.username,
                email: row.email,
                password: row.password, // using alias from SELECT
                firstName: row.first_name,
                lastName: row.last_name,
                role: row.role,
                companyId: row.company_id,
                employeeNumber: row.employee_number,
                hireDate: row.hire_date ? new Date(row.hire_date) : undefined,
                isActive: row.is_active ?? true,
                lastLogin: row.last_login ? new Date(row.last_login) : undefined,
                permissions: [], // Default empty permissions
                signatureTemplate: row.signature_template,
                createdAt: new Date(row.created_at),
                updatedAt: row.updated_at ? new Date(row.updated_at) : undefined
            }));
        }
        finally {
            client.release();
        }
    }
    // 🚀 FÁZA 1.3: CACHED VEHICLES - drastické zrýchlenie kalendára
    async getVehicles() {
        // Skontroluj cache
        const now = Date.now();
        if (this.vehicleCache && (now - this.vehicleCache.timestamp) < this.VEHICLE_CACHE_TTL) {
            console.log('⚡ VEHICLE CACHE HIT - using cached vehicles');
            return this.vehicleCache.data;
        }
        console.log('🔄 VEHICLE CACHE MISS - loading fresh vehicles from DB');
        const vehicles = await this.getVehiclesFresh();
        // Uložiť do cache
        this.vehicleCache = {
            data: vehicles,
            timestamp: now
        };
        console.log(`✅ VEHICLE CACHE UPDATED - cached ${vehicles.length} vehicles for 10min`);
        return vehicles;
    }
    // Cache invalidation helper
    invalidateVehicleCache() {
        if (this.vehicleCache) {
            console.log('🗑️ VEHICLE CACHE INVALIDATED - will reload on next request');
            this.vehicleCache = null;
        }
    }
    // 🚀 FÁZA 2.2: CONNECTION REUSE helpers pre calendar API
    async getReusableConnection() {
        const now = Date.now();
        // Skontroluj, či máme aktívne connection čo môžeme reusovať
        if (this.calendarConnection &&
            (now - this.calendarConnectionLastUsed) < this.CONNECTION_REUSE_TIMEOUT) {
            console.log('⚡ REUSING calendar connection (connection reuse)');
            this.calendarConnectionLastUsed = now;
            return this.calendarConnection;
        }
        // Získaj nové connection a ulož ho pre reuse
        console.log('🔄 ACQUIRING new calendar connection');
        if (this.calendarConnection) {
            try {
                this.calendarConnection.release();
            }
            catch (e) { }
        }
        this.calendarConnection = await this.pool.connect();
        this.calendarConnectionLastUsed = now;
        return this.calendarConnection;
    }
    releaseReusableConnection(forceRelease = false) {
        if (forceRelease && this.calendarConnection) {
            console.log('🗑️ FORCE RELEASING calendar connection');
            this.calendarConnection.release();
            this.calendarConnection = null;
            this.calendarConnectionLastUsed = 0;
        }
        // Inak necháme connection alive pre reuse
    }
    // 🚀 FÁZA 2.3: SMART CACHE HELPERS
    generateCacheKey(prefix, startDate, endDate) {
        const start = startDate.toISOString().split('T')[0];
        const end = endDate.toISOString().split('T')[0];
        return `${prefix}:${start}:${end}`;
    }
    isValidCacheEntry(entry, ttl) {
        return (Date.now() - entry.timestamp) < ttl;
    }
    invalidateCalendarCache() {
        const beforeSize = this.calendarCache.size;
        this.calendarCache.clear();
        console.log(`🗑️ CALENDAR CACHE INVALIDATED - cleared ${beforeSize} entries`);
    }
    invalidateUnavailabilityCache() {
        const beforeSize = this.unavailabilityCache.size;
        this.unavailabilityCache.clear();
        console.log(`🗑️ UNAVAILABILITY CACHE INVALIDATED - cleared ${beforeSize} entries`);
    }
    cleanupExpiredCache() {
        const now = Date.now();
        // Cleanup calendar cache
        const calendarBefore = this.calendarCache.size;
        for (const [key, entry] of this.calendarCache.entries()) {
            if (!this.isValidCacheEntry(entry, this.CALENDAR_CACHE_TTL)) {
                this.calendarCache.delete(key);
            }
        }
        // Cleanup unavailability cache
        const unavailabilityBefore = this.unavailabilityCache.size;
        for (const [key, entry] of this.unavailabilityCache.entries()) {
            if (!this.isValidCacheEntry(entry, this.UNAVAILABILITY_CACHE_TTL)) {
                this.unavailabilityCache.delete(key);
            }
        }
        const calendarCleaned = calendarBefore - this.calendarCache.size;
        const unavailabilityCleaned = unavailabilityBefore - this.unavailabilityCache.size;
        if (calendarCleaned > 0 || unavailabilityCleaned > 0) {
            console.log(`🧹 CACHE CLEANUP: Removed ${calendarCleaned} calendar + ${unavailabilityCleaned} unavailability entries`);
        }
    }
    // 🚀 FÁZA 2.4: DATA STRUCTURE OPTIMIZATION
    optimizeCalendarDataStructure(data) {
        const startTime = Date.now();
        // Create vehicle lookup map (deduplication)
        const vehicleMap = new Map();
        data.vehicles.forEach((vehicle, index) => {
            vehicleMap.set(vehicle.id, {
                i: index, // Vehicle index instead of full object
                brand: vehicle.brand,
                model: vehicle.model,
                licensePlate: vehicle.licensePlate,
                status: vehicle.status
            });
        });
        // Optimize calendar structure - replace duplicate vehicle data with references
        const optimizedCalendar = data.calendar.map((day) => {
            return {
                date: day.date,
                vehicles: day.vehicles.map((vehicle) => {
                    const vehicleRef = vehicleMap.get(vehicle.vehicleId);
                    return {
                        vi: vehicleRef?.i, // Vehicle index reference
                        s: vehicle.status, // Status
                        ...(vehicle.rentalId && { ri: vehicle.rentalId }), // Rental ID only if exists
                        ...(vehicle.customerName && { cn: vehicle.customerName }), // Customer name only if exists
                        ...(vehicle.isFlexible !== undefined && { f: vehicle.isFlexible }), // Flexible flag
                        ...(vehicle.rentalType !== 'standard' && { rt: vehicle.rentalType }), // Rental type only if not standard
                        ...(vehicle.unavailabilityType && { ut: vehicle.unavailabilityType }) // Unavailability type
                    };
                })
            };
        });
        const optimizedTime = Date.now() - startTime;
        const originalSize = JSON.stringify(data).length;
        const optimizedSize = JSON.stringify({
            calendar: optimizedCalendar,
            vehicles: Array.from(vehicleMap.values()),
            rentals: data.rentals,
            unavailabilities: data.unavailabilities
        }).length;
        const sizeSaved = originalSize - optimizedSize;
        const percentSaved = ((sizeSaved / originalSize) * 100).toFixed(1);
        console.log(`🎯 DATA STRUCTURE OPTIMIZED: ${originalSize} → ${optimizedSize} bytes (${percentSaved}% smaller) in ${optimizedTime}ms`);
        return {
            calendar: optimizedCalendar,
            vehicles: Array.from(vehicleMap.values()),
            vehicleMap: Object.fromEntries(vehicleMap), // For frontend reconstruction
            rentals: data.rentals,
            unavailabilities: data.unavailabilities,
            _optimization: {
                originalSize,
                optimizedSize,
                compressionRatio: percentSaved + '%',
                processingTime: optimizedTime + 'ms'
            }
        };
    }
    // Originálna metóda pre fresh loading
    async getVehiclesFresh() {
        const client = await this.pool.connect();
        try {
            const result = await client.query('SELECT * FROM vehicles ORDER BY created_at DESC');
            const vehicles = result.rows.map(row => ({
                ...row,
                id: row.id?.toString() || '',
                licensePlate: row.license_plate, // Mapovanie column názvu
                category: row.category || null, // 🚗 Mapovanie category
                ownerCompanyId: row.owner_company_id?.toString(), // Mapovanie owner_company_id na ownerCompanyId
                pricing: typeof row.pricing === 'string' ? JSON.parse(row.pricing) : row.pricing, // Parsovanie JSON
                commission: typeof row.commission === 'string' ? JSON.parse(row.commission) : row.commission, // Parsovanie JSON
                stk: row.stk ? new Date(row.stk) : undefined, // 📋 STK date mapping
                createdAt: new Date(row.created_at)
            }));
            // 🔧 AUTO-FIX: Automaticky oprav ownerCompanyId pre vozidlá ktoré ho nemajú
            const vehiclesToFix = vehicles.filter(v => !v.ownerCompanyId && v.company?.trim());
            if (vehiclesToFix.length > 0) {
                console.log(`🔧 AUTO-FIX: Found ${vehiclesToFix.length} vehicles without ownerCompanyId, fixing...`);
                // Získaj všetky firmy pre mapovanie
                const companiesResult = await client.query('SELECT id, name FROM companies');
                const companyMap = new Map();
                companiesResult.rows.forEach(company => {
                    companyMap.set(company.name.toLowerCase().trim(), company.id);
                });
                // Oprav vozidlá
                for (const vehicle of vehiclesToFix) {
                    try {
                        const companyName = vehicle.company.trim();
                        const companyNameLower = companyName.toLowerCase();
                        let companyId = companyMap.get(companyNameLower);
                        // Vytvor firmu ak neexistuje
                        if (!companyId) {
                            const newCompanyResult = await client.query('INSERT INTO companies (name) VALUES ($1) RETURNING id', [companyName]);
                            companyId = newCompanyResult.rows[0].id;
                            companyMap.set(companyNameLower, companyId);
                            console.log(`🆕 AUTO-FIX: Created company "${companyName}" with ID ${companyId}`);
                        }
                        // Aktualizuj vozidlo
                        await client.query('UPDATE vehicles SET company_id = $1 WHERE id = $2', [companyId, vehicle.id]);
                        // Aktualizuj vozidlo v pamäti
                        vehicle.ownerCompanyId = companyId.toString();
                        console.log(`✅ AUTO-FIX: ${vehicle.brand} ${vehicle.model} → ${companyName} (${companyId})`);
                    }
                    catch (fixError) {
                        console.error(`❌ AUTO-FIX error for vehicle ${vehicle.id}:`, fixError);
                    }
                }
            }
            return vehicles;
        }
        finally {
            client.release();
        }
    }
    async getVehicle(id) {
        const client = await this.pool.connect();
        try {
            const result = await client.query('SELECT * FROM vehicles WHERE id = $1', [id]); // Removed parseInt for UUID
            if (result.rows.length === 0)
                return null;
            const row = result.rows[0];
            return {
                ...row,
                id: row.id.toString(),
                licensePlate: row.license_plate, // Mapovanie column názvu
                category: row.category || null, // 🚗 Mapovanie category
                ownerCompanyId: row.owner_company_id?.toString(), // Mapovanie owner_company_id na ownerCompanyId
                pricing: typeof row.pricing === 'string' ? JSON.parse(row.pricing) : row.pricing, // Parsovanie JSON
                commission: typeof row.commission === 'string' ? JSON.parse(row.commission) : row.commission, // Parsovanie JSON
                stk: row.stk ? new Date(row.stk) : undefined, // 📋 STK date mapping
                createdAt: new Date(row.created_at)
            };
        }
        finally {
            client.release();
        }
    }
    async createVehicle(vehicleData) {
        const client = await this.pool.connect();
        try {
            // Kontrola duplicít - skontroluj či už existuje vozidlo s touto ŠPZ
            if (vehicleData.licensePlate && vehicleData.licensePlate.trim()) {
                const existingVehicle = await client.query('SELECT id, brand, model FROM vehicles WHERE LOWER(license_plate) = LOWER($1)', [vehicleData.licensePlate.trim()]);
                if (existingVehicle.rows.length > 0) {
                    const existing = existingVehicle.rows[0];
                    console.log(`⚠️ Vozidlo s ŠPZ ${vehicleData.licensePlate} už existuje: ${existing.brand} ${existing.model}`);
                    throw new Error(`Vozidlo s ŠPZ ${vehicleData.licensePlate} už existuje v databáze`);
                }
            }
            // Nájdi alebo vytvor company UUID
            let ownerCompanyId = null;
            if (vehicleData.company && vehicleData.company.trim()) {
                const companies = await this.getCompanies();
                const existingCompany = companies.find(c => c.name === vehicleData.company.trim());
                if (existingCompany) {
                    ownerCompanyId = existingCompany.id;
                }
                else {
                    // Vytvor novú firmu
                    const newCompany = await this.createCompany({ name: vehicleData.company.trim() });
                    ownerCompanyId = newCompany.id;
                }
            }
            // ✅ OPRAVENÉ: Používame owner_company_id (UUID) konzistentne
            const result = await client.query('INSERT INTO vehicles (brand, model, year, license_plate, company, owner_company_id, pricing, commission, status) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) RETURNING id, brand, model, year, license_plate, company, owner_company_id, pricing, commission, status, created_at', [
                vehicleData.brand,
                vehicleData.model,
                vehicleData.year || 2024, // Default rok ak nie je zadaný
                vehicleData.licensePlate,
                vehicleData.company,
                ownerCompanyId, // 🆕 Správne owner_company_id (UUID)
                JSON.stringify(vehicleData.pricing),
                JSON.stringify(vehicleData.commission),
                vehicleData.status
            ]);
            const row = result.rows[0];
            // 🚀 FÁZA 1.3: Cache invalidation po vytvorení vozidla
            this.invalidateVehicleCache();
            // 🚀 FÁZA 2.3: Calendar cache invalidation po vytvorení vozidla
            this.invalidateCalendarCache();
            return {
                id: row.id.toString(),
                brand: row.brand,
                model: row.model,
                year: row.year,
                licensePlate: row.license_plate,
                company: row.company,
                ownerCompanyId: row.owner_company_id?.toString(), // ✅ OPRAVENÉ: Používame owner_company_id konzistentne
                pricing: typeof row.pricing === 'string' ? JSON.parse(row.pricing) : row.pricing,
                commission: typeof row.commission === 'string' ? JSON.parse(row.commission) : row.commission,
                status: row.status,
                createdAt: new Date(row.created_at)
            };
        }
        catch (error) {
            console.error('❌ Detailed createVehicle error:', error);
            throw error;
        }
        finally {
            client.release();
        }
    }
    async updateVehicle(vehicle) {
        const client = await this.pool.connect();
        try {
            // Automaticky vytvoriť company záznam ak neexistuje - bez ON CONFLICT
            if (vehicle.company && vehicle.company.trim()) {
                try {
                    const existingCompany = await client.query('SELECT name FROM companies WHERE name = $1', [vehicle.company.trim()]);
                    if (existingCompany.rows.length === 0) {
                        await client.query('INSERT INTO companies (name) VALUES ($1)', [vehicle.company.trim()]);
                    }
                }
                catch (companyError) {
                    console.log('⚠️ Company update error:', companyError.message);
                }
            }
            await client.query('UPDATE vehicles SET brand = $1, model = $2, license_plate = $3, company = $4, category = $5, owner_company_id = $6, pricing = $7, commission = $8, status = $9, year = $10, stk = $11, updated_at = CURRENT_TIMESTAMP WHERE id = $12', [
                vehicle.brand,
                vehicle.model,
                vehicle.licensePlate,
                vehicle.company,
                vehicle.category || null,
                vehicle.ownerCompanyId || null,
                JSON.stringify(vehicle.pricing),
                JSON.stringify(vehicle.commission),
                vehicle.status,
                vehicle.year || null,
                vehicle.stk || null,
                vehicle.id
            ]);
            // 🚀 FÁZA 1.3: Cache invalidation po aktualizácii vozidla
            this.invalidateVehicleCache();
            // 🚀 FÁZA 2.3: Calendar cache invalidation po aktualizácii vozidla
            this.invalidateCalendarCache();
        }
        finally {
            client.release();
        }
    }
    async deleteVehicle(id) {
        const client = await this.pool.connect();
        try {
            await client.query('DELETE FROM vehicles WHERE id = $1', [id]); // Removed parseInt for UUID
            // 🚀 FÁZA 1.3: Cache invalidation po zmazaní vozidla
            this.invalidateVehicleCache();
            // 🚀 FÁZA 2.3: Calendar cache invalidation po zmazaní vozidla
            this.invalidateCalendarCache();
        }
        finally {
            client.release();
        }
    }
    // Metódy pre prenájmy
    // OPTIMALIZÁCIA: Nová metóda pre načítanie len prenájmov v danom období
    async getRentalsForDateRange(startDate, endDate) {
        const client = await this.pool.connect();
        try {
            // Načítaj len prenájmy ktoré sa prekrývajú s daným obdobím
            const result = await client.query(`
        SELECT id, vehicle_id, start_date, end_date, 
               total_price, commission, payment_method, paid, status, 
               customer_name, created_at, order_number, deposit, 
               allowed_kilometers, daily_kilometers, handover_place,
               rental_type, is_flexible, flexible_end_date, can_be_overridden,
               override_priority, notification_threshold, auto_extend, override_history,
               company
        FROM rentals 
        WHERE (start_date <= $2 AND end_date >= $1)
        ORDER BY start_date ASC
      `, [startDate, endDate]);
            if (result.rows.length === 0) {
                return [];
            }
            return result.rows.map((row) => {
                try {
                    return {
                        id: row.id?.toString() || '',
                        vehicleId: row.vehicle_id?.toString(),
                        customerId: undefined, // customer_id stĺpec neexistuje v rentals tabuľke
                        customerName: row.customer_name || 'Neznámy zákazník',
                        startDate: new Date(row.start_date),
                        endDate: new Date(row.end_date),
                        totalPrice: parseFloat(row.total_price) || 0,
                        commission: parseFloat(row.commission) || 0,
                        paymentMethod: row.payment_method || 'cash',
                        paid: Boolean(row.paid),
                        status: row.status || 'active',
                        createdAt: row.created_at ? new Date(row.created_at) : new Date(),
                        orderNumber: row.order_number || undefined,
                        deposit: row.deposit ? parseFloat(row.deposit) : undefined,
                        allowedKilometers: row.allowed_kilometers || undefined,
                        dailyKilometers: row.daily_kilometers || undefined,
                        handoverPlace: row.handover_place || undefined,
                        // 🏢 COMPANY SNAPSHOT: Historical company field
                        company: row.company || 'Neznáma firma',
                        // 🔄 NOVÉ: Flexibilné prenájmy polia
                        rentalType: row.rental_type || 'standard',
                        isFlexible: Boolean(row.is_flexible),
                        flexibleEndDate: row.flexible_end_date ? new Date(row.flexible_end_date) : undefined,
                    };
                }
                catch (error) {
                    console.error('❌ Chyba pri spracovaní rental:', error);
                    throw error;
                }
            });
        }
        finally {
            client.release();
        }
    }
    // 🚀 NOVÁ METÓDA: Paginated rentals s filtrami
    async getRentalsPaginated(params) {
        const client = await this.pool.connect();
        try {
            console.log('🚀 Loading paginated rentals with filters:', params);
            // Základný WHERE clause
            let whereConditions = ['1=1'];
            const queryParams = [];
            let paramIndex = 1;
            // 🔍 SEARCH filter - live vyhľadávanie
            if (params.search && params.search.trim()) {
                whereConditions.push(`(
          r.customer_name ILIKE $${paramIndex} OR 
          r.order_number ILIKE $${paramIndex} OR 
          v.license_plate ILIKE $${paramIndex} OR
          v.brand ILIKE $${paramIndex} OR
          v.model ILIKE $${paramIndex}
        )`);
                queryParams.push(`%${params.search.trim()}%`);
                paramIndex++;
            }
            // 📅 DATE filter
            if (params.dateFilter && params.dateFilter !== 'all') {
                const today = new Date();
                let startDate, endDate;
                switch (params.dateFilter) {
                    case 'today':
                        startDate = new Date(today.setHours(0, 0, 0, 0));
                        endDate = new Date(today.setHours(23, 59, 59, 999));
                        break;
                    case 'week':
                        const weekStart = new Date(today);
                        weekStart.setDate(today.getDate() - today.getDay());
                        weekStart.setHours(0, 0, 0, 0);
                        const weekEnd = new Date(weekStart);
                        weekEnd.setDate(weekStart.getDate() + 6);
                        weekEnd.setHours(23, 59, 59, 999);
                        startDate = weekStart;
                        endDate = weekEnd;
                        break;
                    case 'month':
                        startDate = new Date(today.getFullYear(), today.getMonth(), 1);
                        endDate = new Date(today.getFullYear(), today.getMonth() + 1, 0, 23, 59, 59, 999);
                        break;
                    case 'custom':
                        if (params.dateFrom)
                            startDate = new Date(params.dateFrom);
                        if (params.dateTo)
                            endDate = new Date(params.dateTo);
                        break;
                }
                if (startDate) {
                    whereConditions.push(`r.start_date >= $${paramIndex}`);
                    queryParams.push(startDate);
                    paramIndex++;
                }
                if (endDate) {
                    whereConditions.push(`r.start_date <= $${paramIndex}`);
                    queryParams.push(endDate);
                    paramIndex++;
                }
            }
            // 🏢 COMPANY filter
            if (params.company && params.company !== 'all') {
                whereConditions.push(`(r.company = $${paramIndex} OR c.name = $${paramIndex})`);
                queryParams.push(params.company);
                paramIndex++;
            }
            // ⚡ STATUS filter
            if (params.status && params.status !== 'all') {
                if (params.status === 'active') {
                    whereConditions.push(`r.status IN ('confirmed', 'ongoing')`);
                }
                else if (params.status === 'completed') {
                    whereConditions.push(`r.status = 'completed'`);
                }
                else {
                    whereConditions.push(`r.status = $${paramIndex}`);
                    queryParams.push(params.status);
                    paramIndex++;
                }
            }
            // 💳 PAYMENT METHOD filter
            if (params.paymentMethod && params.paymentMethod !== 'all') {
                whereConditions.push(`r.payment_method = $${paramIndex}`);
                queryParams.push(params.paymentMethod);
                paramIndex++;
            }
            // 💰 PAYMENT STATUS filter
            if (params.paymentStatus && params.paymentStatus !== 'all') {
                if (params.paymentStatus === 'paid') {
                    whereConditions.push(`r.paid = true`);
                }
                else if (params.paymentStatus === 'unpaid') {
                    whereConditions.push(`r.paid = false`);
                }
            }
            // 🚗 VEHICLE BRAND filter
            if (params.vehicleBrand && params.vehicleBrand !== 'all') {
                whereConditions.push(`v.brand = $${paramIndex}`);
                queryParams.push(params.vehicleBrand);
                paramIndex++;
            }
            // 💵 PRICE RANGE filter
            if (params.priceMin && !isNaN(parseFloat(params.priceMin))) {
                whereConditions.push(`r.total_price >= $${paramIndex}`);
                queryParams.push(parseFloat(params.priceMin));
                paramIndex++;
            }
            if (params.priceMax && !isNaN(parseFloat(params.priceMax))) {
                whereConditions.push(`r.total_price <= $${paramIndex}`);
                queryParams.push(parseFloat(params.priceMax));
                paramIndex++;
            }
            const whereClause = whereConditions.join(' AND ');
            // Count query pre pagination
            const countQuery = `
        SELECT COUNT(*) as total
        FROM rentals r
        LEFT JOIN vehicles v ON r.vehicle_id = v.id
        LEFT JOIN companies c ON v.company_id = c.id
        WHERE ${whereClause}
      `;
            const countResult = await client.query(countQuery, queryParams);
            const total = parseInt(countResult.rows[0].total);
            // Main query s LIMIT a OFFSET
            const mainQuery = `
        SELECT 
          r.id, r.vehicle_id, r.start_date, r.end_date, 
          r.total_price, r.commission, r.payment_method, r.paid, r.status, 
          r.customer_name, r.created_at, r.order_number, r.deposit, 
          r.allowed_kilometers, r.daily_kilometers, r.handover_place, r.company,
          r.rental_type, r.is_flexible, r.flexible_end_date, r.can_be_overridden,
          r.override_priority, r.notification_threshold, r.auto_extend, r.override_history,
          v.brand, v.model, v.license_plate, v.pricing, v.commission as v_commission, v.status as v_status,
          c.name as company_name, v.company as vehicle_company
        FROM rentals r
        LEFT JOIN vehicles v ON r.vehicle_id = v.id
        LEFT JOIN companies c ON v.company_id = c.id
        WHERE ${whereClause}
        ORDER BY r.created_at DESC
        LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
      `;
            queryParams.push(params.limit, params.offset);
            const result = await client.query(mainQuery, queryParams);
            console.log(`📊 Paginated query: ${result.rows.length}/${total} rentals (limit: ${params.limit}, offset: ${params.offset})`);
            // Transform data to Rental objects
            const rentals = result.rows.map((row) => this.transformRowToRental(row));
            // Apply permission filtering for non-admin users
            let filteredRentals = rentals;
            if (params.userRole !== 'admin' && params.userId) {
                const userCompanyAccess = await this.getUserCompanyAccess(params.userId);
                const allowedCompanyIds = userCompanyAccess.map(access => access.companyId);
                const allowedCompanyNames = await Promise.all(allowedCompanyIds.map(async (companyId) => {
                    try {
                        return await this.getCompanyNameById(companyId);
                    }
                    catch (error) {
                        return null;
                    }
                }));
                const validCompanyNames = allowedCompanyNames.filter(name => name !== null);
                filteredRentals = rentals.filter(rental => {
                    if (rental.vehicle && rental.vehicle.ownerCompanyId) {
                        return allowedCompanyIds.includes(rental.vehicle.ownerCompanyId);
                    }
                    else if (rental.vehicle && rental.vehicle.company) {
                        return validCompanyNames.includes(rental.vehicle.company);
                    }
                    return false;
                });
                console.log('🔐 Permission filtering applied:', {
                    originalCount: rentals.length,
                    filteredCount: filteredRentals.length
                });
            }
            return {
                rentals: filteredRentals,
                total: filteredRentals.length // Adjust total if filtered
            };
        }
        catch (error) {
            console.error('Error in getRentalsPaginated:', error);
            throw error;
        }
        finally {
            client.release();
        }
    }
    // 🔧 HELPER: Transform database row to Rental object
    transformRowToRental(row) {
        return {
            id: row.id?.toString() || '',
            vehicleId: row.vehicle_id?.toString(),
            customerId: row.customer_id?.toString(),
            customerName: row.customer_name || 'Neznámy zákazník',
            startDate: new Date(row.start_date),
            endDate: new Date(row.end_date),
            totalPrice: parseFloat(row.total_price) || 0,
            commission: parseFloat(row.commission) || 0,
            paymentMethod: row.payment_method || 'cash',
            paid: Boolean(row.paid),
            status: row.status || 'active',
            createdAt: row.created_at ? new Date(row.created_at) : new Date(),
            orderNumber: row.order_number || undefined,
            deposit: row.deposit ? parseFloat(row.deposit) : undefined,
            allowedKilometers: row.allowed_kilometers || undefined,
            dailyKilometers: row.daily_kilometers || undefined,
            handoverPlace: row.handover_place || undefined,
            company: row.company || undefined,
            // Flexibilné prenájmy polia
            rentalType: row.rental_type || 'standard',
            isFlexible: Boolean(row.is_flexible),
            flexibleEndDate: row.flexible_end_date ? new Date(row.flexible_end_date) : undefined,
            // Vehicle information from JOIN
            vehicle: row.brand ? {
                id: row.vehicle_id?.toString() || '',
                brand: row.brand,
                model: row.model,
                licensePlate: row.license_plate,
                company: row.vehicle_company || row.company_name || 'N/A',
                pricing: row.pricing ? (typeof row.pricing === 'string' ? JSON.parse(row.pricing) : row.pricing) : [],
                commission: row.v_commission ? (typeof row.v_commission === 'string' ? JSON.parse(row.v_commission) : row.v_commission) : { type: 'percentage', value: 0 },
                status: row.v_status || 'available',
                ownerCompanyId: row.company_id || undefined
            } : undefined
        };
    }
    async getRentals() {
        const client = await this.pool.connect();
        try {
            // 🚀 NOVÝ PRÍSTUP: Priamy JOIN ako getVehicles() - STABILNÝ ✅
            console.log('🔍 Loading rentals with direct JOIN...');
            // 🐛 DEBUG: Check vehicle_id types in rentals before JOIN
            console.log('🔍 DEBUG: Checking vehicle_id types in rentals...');
            const typeCheck = await client.query(`
        SELECT 
          id, 
          vehicle_id, 
          pg_typeof(vehicle_id) as vehicle_id_type,
          customer_name
        FROM rentals 
        LIMIT 3
      `);
            console.log('🔍 DEBUG: Sample rentals data:', typeCheck.rows);
            // 🔧 FIX: Remove ::uuid cast - if vehicle_id is already uuid, casting is unnecessary
            const result = await client.query(`
        SELECT 
          r.id, r.vehicle_id, r.start_date, r.end_date, 
          r.total_price, r.commission, r.payment_method, r.paid, r.status, 
          r.customer_name, r.created_at, r.order_number, r.deposit, 
          r.allowed_kilometers, r.daily_kilometers, r.handover_place, r.company,
          -- 🔄 NOVÉ: Flexibilné prenájmy polia
          r.rental_type, r.is_flexible, r.flexible_end_date, r.can_be_overridden,
          r.override_priority, r.notification_threshold, r.auto_extend, r.override_history,
          v.brand, v.model, v.license_plate, v.pricing, v.commission as v_commission, v.status as v_status,
          -- 🏢 COMPANY INFO: Pridané pre štatistiky Top firiem
          c.name as company_name, v.company as vehicle_company
        FROM rentals r
        LEFT JOIN vehicles v ON r.vehicle_id = v.id
        LEFT JOIN companies c ON v.company_id = c.id
        ORDER BY r.created_at DESC
      `);
            console.log(`📊 Found ${result.rows.length} rentals`);
            // 🔧 DEBUG: Log first 2 raw SQL results
            console.log('🔍 RAW SQL RESULTS (first 2 rows):');
            result.rows.slice(0, 2).forEach((row, i) => {
                console.log(`  Row ${i}:`, {
                    customer_name: row.customer_name,
                    vehicle_id: row.vehicle_id,
                    brand: row.brand,
                    model: row.model,
                    license_plate: row.license_plate,
                    company: row.company,
                    company_name: row.company_name,
                    vehicle_company: row.vehicle_company,
                    has_brand: !!row.brand
                });
            });
            // 🔧 DIAGNOSTIC: Check for missing vehicle data in JOIN
            const missingVehicleData = result.rows.filter(row => row.vehicle_id && !row.brand);
            if (missingVehicleData.length > 0) {
                console.error(`🚨 CRITICAL: ${missingVehicleData.length} rentals have vehicle_id but no vehicle data from JOIN!`);
                console.error('🔍 Missing vehicle IDs:', missingVehicleData.map(r => r.vehicle_id).slice(0, 3));
                // Check if these vehicle_ids exist in vehicles table
                for (const rental of missingVehicleData.slice(0, 2)) { // Check first 2
                    const vehicleCheck = await client.query('SELECT id, brand, model FROM vehicles WHERE id = $1', [rental.vehicle_id]);
                    console.error(`🔍 Vehicle ${rental.vehicle_id} exists in vehicles:`, vehicleCheck.rows.length > 0 ? vehicleCheck.rows[0] : 'NOT FOUND');
                }
            }
            const rentals = result.rows.map(row => ({
                id: row.id?.toString() || '',
                vehicleId: row.vehicle_id?.toString(),
                customerId: undefined, // customer_id stĺpec neexistuje v rentals tabuľke
                customerName: row.customer_name || 'Neznámy zákazník',
                startDate: new Date(row.start_date),
                endDate: new Date(row.end_date),
                totalPrice: parseFloat(row.total_price) || 0,
                commission: parseFloat(row.commission) || 0,
                paymentMethod: row.payment_method || 'cash',
                paid: Boolean(row.paid),
                status: row.status || 'active',
                createdAt: row.created_at ? new Date(row.created_at) : new Date(),
                orderNumber: row.order_number || undefined,
                deposit: row.deposit ? parseFloat(row.deposit) : undefined,
                allowedKilometers: row.allowed_kilometers || undefined,
                dailyKilometers: row.daily_kilometers || undefined,
                handoverPlace: row.handover_place || undefined,
                company: row.company || undefined, // 🎯 CLEAN SOLUTION field
                // 🔄 NOVÉ: Flexibilné prenájmy polia
                rentalType: row.rental_type || 'standard',
                isFlexible: Boolean(row.is_flexible),
                flexibleEndDate: row.flexible_end_date ? new Date(row.flexible_end_date) : undefined,
                // 🚗 PRIAMO MAPOVANÉ VEHICLE DATA (ako getVehicles) ✅
                vehicle: row.brand ? {
                    id: row.vehicle_id,
                    brand: row.brand,
                    model: row.model,
                    licensePlate: row.license_plate,
                    // 🏢 COMPANY INFO: Pridané pre štatistiky - použije company_name z companies tabuľky alebo fallback na vehicle_company
                    company: row.company_name || row.vehicle_company || 'Bez firmy',
                    pricing: typeof row.pricing === 'string' ? JSON.parse(row.pricing) : row.pricing || [],
                    commission: typeof row.v_commission === 'string' ? JSON.parse(row.v_commission) : row.v_commission || { type: 'percentage', value: 0 },
                    status: row.v_status || 'available'
                } : undefined
            }));
            // ⚠️ AUTO-FIX DISABLED - Nebezpečné, menilo vehicle_id v databáze!
            // Namiesto toho len logujeme problém
            const rentalsWithMissingVehicle = rentals.filter(r => r.vehicleId && !r.vehicle);
            if (rentalsWithMissingVehicle.length > 0) {
                console.warn(`⚠️ Found ${rentalsWithMissingVehicle.length} rentals with missing vehicle data (not auto-fixing):`);
                rentalsWithMissingVehicle.forEach(rental => {
                    console.warn(`  - Rental ${rental.id} (${rental.customerName}) has vehicle_id ${rental.vehicleId} but no vehicle data`);
                });
            }
            // 🔧 DEBUG: Log mapped rentals (first 2)
            console.log('🔍 MAPPED RENTALS (first 2):');
            rentals.slice(0, 2).forEach((rental, i) => {
                console.log(`  Mapped ${i}:`, {
                    customer: rental.customerName,
                    company: rental.company,
                    vehicleId: rental.vehicleId,
                    vehicle_exists: !!rental.vehicle,
                    vehicle_brand: rental.vehicle?.brand || 'NULL',
                    vehicle_model: rental.vehicle?.model || 'NULL',
                    vehicle_licensePlate: rental.vehicle?.licensePlate || 'NULL'
                });
            });
            // 🛡️ BULLETPROOF VALIDÁCIA: Kontrola že všetky rentals majú company
            const rentalsWithoutCompany = rentals.filter(r => !r.company);
            if (rentalsWithoutCompany.length > 0) {
                console.error(`🚨 CRITICAL: ${rentalsWithoutCompany.length} rentals BEZ company - BULLETPROOF NARUŠENÉ!`);
                rentalsWithoutCompany.forEach(rental => {
                    console.error(`  ❌ Rental ${rental.id} (${rental.customerName}) - ŽIADNA company! StartDate: ${rental.startDate.toISOString()}`);
                });
            }
            else {
                console.log(`✅ BULLETPROOF VALIDÁCIA: Všetkých ${rentals.length} prenájmov má company`);
            }
            return rentals;
        }
        catch (error) {
            console.error('❌ getRentals() chyba:', error);
            throw error;
        }
        finally {
            client.release();
        }
    }
    // Bezpečné parsovanie JSON polí
    safeJsonParse(value, fallback = undefined) {
        if (!value)
            return fallback;
        if (typeof value === 'object')
            return value;
        if (typeof value === 'string') {
            try {
                return JSON.parse(value);
            }
            catch (e) {
                console.warn('⚠️ JSON parse chyba:', e, 'value:', value);
                return fallback;
            }
        }
        return fallback;
    }
    async createRental(rentalData) {
        const client = await this.pool.connect();
        try {
            // 🎯 CLEAN SOLUTION: Rental vlastní svoj company field - JEDNODUCHO!
            let company = null;
            if (rentalData.vehicleId) {
                const vehicleResult = await client.query(`
          SELECT company FROM vehicles WHERE id = $1
        `, [rentalData.vehicleId]);
                if (vehicleResult.rows.length > 0) {
                    company = vehicleResult.rows[0].company;
                }
            }
            const result = await client.query(`
        INSERT INTO rentals (
          vehicle_id, customer_name, start_date, end_date, 
          total_price, commission, payment_method, discount, custom_commission, 
          extra_km_charge, paid, status, handover_place, confirmed, payments, history, order_number,
          deposit, allowed_kilometers, daily_kilometers, extra_kilometer_rate, return_conditions, 
          fuel_level, odometer, return_fuel_level, return_odometer, actual_kilometers, fuel_refill_cost,
          handover_protocol_id, return_protocol_id, company,
          rental_type, is_flexible, flexible_end_date, can_be_overridden, override_priority, 
          notification_threshold, auto_extend, override_history,
          approval_status, email_content, auto_processed_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22, $23, $24, $25, $26, $27, $28, $29, $30, $31, $32, $33, $34, $35, $36, $37, $38, $39, $40, $41, $42)
        RETURNING id, vehicle_id, customer_name, start_date, end_date, total_price, commission, payment_method, 
          discount, custom_commission, extra_km_charge, paid, status, handover_place, confirmed, payments, history, order_number,
          deposit, allowed_kilometers, daily_kilometers, extra_kilometer_rate, return_conditions, 
          fuel_level, odometer, return_fuel_level, return_odometer, actual_kilometers, fuel_refill_cost,
          handover_protocol_id, return_protocol_id, company, created_at,
          rental_type, is_flexible, flexible_end_date, can_be_overridden, override_priority, 
          notification_threshold, auto_extend, override_history,
          approval_status, email_content, auto_processed_at
      `, [
                rentalData.vehicleId || null,
                rentalData.customerName,
                rentalData.startDate,
                rentalData.endDate,
                rentalData.totalPrice,
                rentalData.commission,
                rentalData.paymentMethod,
                rentalData.discount ? JSON.stringify(rentalData.discount) : null,
                rentalData.customCommission ? JSON.stringify(rentalData.customCommission) : null,
                rentalData.extraKmCharge || null,
                rentalData.paid || false,
                rentalData.status || 'pending',
                rentalData.handoverPlace || null,
                rentalData.confirmed || false,
                rentalData.payments ? JSON.stringify(rentalData.payments) : null,
                rentalData.history ? JSON.stringify(rentalData.history) : null,
                rentalData.orderNumber || null,
                rentalData.deposit || null,
                rentalData.allowedKilometers || null,
                rentalData.dailyKilometers || null,
                rentalData.extraKilometerRate || null,
                rentalData.returnConditions || null,
                rentalData.fuelLevel || null,
                rentalData.odometer || null,
                rentalData.returnFuelLevel || null,
                rentalData.returnOdometer || null,
                rentalData.actualKilometers || null,
                rentalData.fuelRefillCost || null,
                rentalData.handoverProtocolId || null,
                rentalData.returnProtocolId || null,
                company, // 🎯 CLEAN SOLUTION hodnota
                // 🔄 OPTIMALIZOVANÉ: Flexibilné prenájmy parametre (zjednodušené)
                rentalData.rentalType || 'standard',
                rentalData.isFlexible || false,
                rentalData.flexibleEndDate || null,
                // 📧 NOVÉ: Automatické spracovanie emailov hodnoty (len existujúce stĺpce)
                rentalData.approvalStatus || 'approved',
                rentalData.emailContent || null,
                rentalData.autoProcessedAt || null
            ]);
            const row = result.rows[0];
            return {
                id: row.id.toString(),
                vehicleId: row.vehicle_id?.toString(),
                customerId: undefined, // customer_id stĺpec neexistuje v rentals tabuľke
                customerName: row.customer_name,
                startDate: new Date(row.start_date),
                endDate: new Date(row.end_date),
                totalPrice: parseFloat(row.total_price) || 0,
                commission: parseFloat(row.commission) || 0,
                paymentMethod: row.payment_method,
                discount: this.safeJsonParse(row.discount),
                customCommission: this.safeJsonParse(row.custom_commission),
                extraKmCharge: row.extra_km_charge ? parseFloat(row.extra_km_charge) : undefined,
                paid: Boolean(row.paid),
                status: row.status || 'pending',
                handoverPlace: row.handover_place,
                confirmed: Boolean(row.confirmed),
                payments: this.safeJsonParse(row.payments),
                history: this.safeJsonParse(row.history),
                orderNumber: row.order_number,
                deposit: row.deposit ? parseFloat(row.deposit) : undefined,
                allowedKilometers: row.allowed_kilometers || undefined,
                dailyKilometers: row.daily_kilometers || undefined,
                extraKilometerRate: row.extra_kilometer_rate ? parseFloat(row.extra_kilometer_rate) : undefined,
                returnConditions: row.return_conditions || undefined,
                fuelLevel: row.fuel_level || undefined,
                odometer: row.odometer || undefined,
                returnFuelLevel: row.return_fuel_level || undefined,
                returnOdometer: row.return_odometer || undefined,
                actualKilometers: row.actual_kilometers || undefined,
                fuelRefillCost: row.fuel_refill_cost ? parseFloat(row.fuel_refill_cost) : undefined,
                handoverProtocolId: row.handover_protocol_id || undefined,
                returnProtocolId: row.return_protocol_id || undefined,
                company: row.company || undefined, // 🎯 CLEAN SOLUTION field
                createdAt: new Date(row.created_at),
                // 🔄 OPTIMALIZOVANÉ: Flexibilné prenájmy (zjednodušené)
                rentalType: row.rental_type || 'standard',
                isFlexible: Boolean(row.is_flexible),
                flexibleEndDate: row.flexible_end_date ? new Date(row.flexible_end_date) : undefined,
                // 📧 NOVÉ: Automatické spracovanie emailov polia (len existujúce stĺpce)
                approvalStatus: row.approval_status || 'approved',
                emailContent: row.email_content || undefined,
                autoProcessedAt: row.auto_processed_at ? new Date(row.auto_processed_at) : undefined
            };
            // 🚀 FÁZA 2.3: Calendar cache invalidation po vytvorení prenájmu
            this.invalidateCalendarCache();
            this.invalidateUnavailabilityCache();
        }
        finally {
            client.release();
        }
    }
    async getRental(id) {
        const client = await this.pool.connect();
        try {
            console.log('🔍 getRental called for ID:', id);
            const result = await client.query(`
        SELECT r.*, v.brand, v.model, v.license_plate, v.company as vehicle_company 
        FROM rentals r 
        LEFT JOIN vehicles v ON r.vehicle_id = v.id 
        WHERE r.id = $1
      `, [parseInt(id)]);
            console.log('📊 getRental result:', {
                found: result.rows.length > 0,
                vehicleId: result.rows[0]?.vehicle_id,
                vehicleBrand: result.rows[0]?.brand,
                vehicleModel: result.rows[0]?.model
            });
            if (result.rows.length === 0)
                return null;
            const row = result.rows[0];
            return {
                id: row.id,
                vehicleId: row.vehicle_id,
                customerId: undefined, // customer_id stĺpec neexistuje v rentals tabuľke
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
                // 🏢 COMPANY SNAPSHOT: Historical company field  
                company: row.company || 'Neznáma firma',
                // Rozšírené polia
                deposit: row.deposit ? parseFloat(row.deposit) : undefined,
                allowedKilometers: row.allowed_kilometers || undefined,
                extraKilometerRate: row.extra_kilometer_rate ? parseFloat(row.extra_kilometer_rate) : undefined,
                returnConditions: row.return_conditions || undefined,
                fuelLevel: row.fuel_level || undefined,
                odometer: row.odometer || undefined,
                returnFuelLevel: row.return_fuel_level || undefined,
                returnOdometer: row.return_odometer || undefined,
                actualKilometers: row.actual_kilometers || undefined,
                fuelRefillCost: row.fuel_refill_cost ? parseFloat(row.fuel_refill_cost) : undefined,
                // Protokoly
                handoverProtocolId: row.handover_protocol_id || undefined,
                returnProtocolId: row.return_protocol_id || undefined,
                vehicle: {
                    id: row.vehicle_id,
                    brand: row.brand,
                    model: row.model,
                    licensePlate: row.license_plate,
                    company: row.vehicle_company || 'N/A',
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
    // 🛡️ FIXED UPDATE with proper field mapping
    async updateRental(rental) {
        const client = await this.pool.connect();
        try {
            console.log(`🔧 RENTAL UPDATE: ${rental.id}`, {
                customer: rental.customerName,
                vehicle: rental.vehicleId,
                price: rental.totalPrice,
                paid: rental.paid,
                status: rental.status
            });
            // UPDATE with proper field mapping
            const result = await client.query(`
        UPDATE rentals SET 
          vehicle_id = $1, 
          customer_name = $2, 
          start_date = $3, 
          end_date = $4,
          total_price = $5, 
          paid = $6, 
          status = $7,
          payment_method = $8,
          handover_place = $9,
          order_number = $10,
          deposit = $11,
          allowed_kilometers = $12,
          extra_kilometer_rate = $13
        WHERE id = $14
        `, [
                rental.vehicleId || null, // UUID as string, not parseInt
                rental.customerName,
                rental.startDate,
                rental.endDate,
                rental.totalPrice || 0,
                rental.paid || false,
                rental.status || 'pending',
                rental.paymentMethod || null,
                rental.handoverPlace || null,
                rental.orderNumber || null,
                rental.deposit || null,
                rental.allowedKilometers || null,
                rental.extraKilometerRate || null,
                rental.id // UUID as string, not parseInt
            ]);
            console.log(`✅ RENTAL UPDATE SUCCESS: ${rental.id} (${result.rowCount} row updated)`);
        }
        catch (error) {
            console.error(`❌ RENTAL UPDATE ERROR: ${rental.id}`, error);
            throw error;
        }
        finally {
            client.release();
        }
    }
    // 🛡️ PROTECTED DELETE with safety checks
    async deleteRental(id) {
        const client = await this.pool.connect();
        try {
            // 🛡️ OCHRANA LEVEL 1: Verificaj že prenájom existuje
            const existing = await this.getRental(id);
            if (!existing) {
                throw new Error(`RENTAL DELETE BLOCKED: Rental ${id} does not exist`);
            }
            // 🛡️ OCHRANA LEVEL 2: Backup pred vymazaním
            await this.createRentalBackup(id);
            // 🛡️ OCHRANA LEVEL 3: Transaction protection
            await client.query('BEGIN');
            try {
                // 🛡️ OCHRANA LEVEL 4: Log delete pokus
                console.log(`🛡️ RENTAL DELETE START: ${id}`, {
                    customer: existing.customerName,
                    vehicle: existing.vehicleId,
                    totalPrice: existing.totalPrice,
                    dateRange: `${existing.startDate} - ${existing.endDate}`
                });
                // 🛡️ OCHRANA LEVEL 5: Controlled DELETE s row counting
                const result = await client.query('DELETE FROM rentals WHERE id = $1', [id]);
                // 🛡️ OCHRANA LEVEL 6: Verify delete success
                if (result.rowCount === null || result.rowCount === 0) {
                    throw new Error(`RENTAL DELETE FAILED: No rows affected for ID ${id}`);
                }
                if (result.rowCount > 1) {
                    throw new Error(`RENTAL DELETE ERROR: Multiple rows affected (${result.rowCount}) for ID ${id}`);
                }
                await client.query('COMMIT');
                console.log(`✅ RENTAL DELETE SUCCESS: ${id} (${result.rowCount} row deleted)`);
            }
            catch (deleteError) {
                await client.query('ROLLBACK');
                console.error(`❌ RENTAL DELETE FAILED, ROLLED BACK:`, deleteError);
                throw deleteError;
            }
            // 🚀 FÁZA 2.3: Calendar cache invalidation po zmazaní prenájmu
            this.invalidateCalendarCache();
            this.invalidateUnavailabilityCache();
        }
        finally {
            client.release();
        }
    }
    // Metódy pre zákazníkov
    async getCustomers() {
        const client = await this.pool.connect();
        try {
            const result = await client.query('SELECT id, name, email, phone, created_at FROM customers ORDER BY created_at DESC');
            return result.rows.map((row) => ({
                id: row.id.toString(),
                name: row.name,
                email: row.email,
                phone: row.phone,
                createdAt: new Date(row.created_at)
            }));
        }
        finally {
            client.release();
        }
    }
    async createCustomer(customerData) {
        const client = await this.pool.connect();
        try {
            console.log('📝 Creating customer with data:', customerData);
            // Rozdelenie mena na first_name a last_name
            const nameParts = customerData.name.trim().split(/\s+/);
            const firstName = nameParts[0] || customerData.name.trim();
            const lastName = nameParts.length > 1 ? nameParts.slice(1).join(' ') : '';
            console.log('📝 Name parsing:', {
                originalName: customerData.name,
                firstName,
                lastName
            });
            const result = await client.query('INSERT INTO customers (first_name, last_name, name, email, phone) VALUES ($1, $2, $3, $4, $5) RETURNING id, first_name, last_name, name, email, phone, created_at', [firstName, lastName, customerData.name, customerData.email, customerData.phone]);
            const row = result.rows[0];
            console.log('✅ Customer created with ID:', row.id);
            return {
                id: row.id.toString(),
                name: row.name || `${row.first_name} ${row.last_name}`.trim(),
                email: row.email,
                phone: row.phone,
                createdAt: new Date(row.created_at)
            };
        }
        catch (error) {
            console.error('❌ Detailed createCustomer error:', error);
            throw error;
        }
        finally {
            client.release();
        }
    }
    async updateCustomer(customer) {
        const client = await this.pool.connect();
        try {
            // Parse name into first_name and last_name
            const nameParts = customer.name.split(' ');
            const firstName = nameParts[0] || '';
            const lastName = nameParts.slice(1).join(' ') || '';
            await client.query('UPDATE customers SET name = $1, first_name = $2, last_name = $3, email = $4, phone = $5 WHERE id = $6', [customer.name, firstName, lastName, customer.email, customer.phone, customer.id]);
        }
        finally {
            client.release();
        }
    }
    async deleteCustomer(id) {
        const client = await this.pool.connect();
        try {
            await client.query('DELETE FROM customers WHERE id = $1', [id]); // Removed parseInt for UUID
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
                id: row.id?.toString() || '',
                description: row.description,
                amount: parseFloat(row.amount) || 0,
                date: new Date(row.date),
                vehicleId: row.vehicle_id?.toString(),
                company: row.company,
                category: row.category,
                note: row.note || undefined
            }));
        }
        finally {
            client.release();
        }
    }
    async createExpense(expenseData) {
        const client = await this.pool.connect();
        try {
            // Automaticky vytvoriť company záznam ak neexistuje - bez ON CONFLICT
            if (expenseData.company && expenseData.company.trim()) {
                try {
                    const existingCompany = await client.query('SELECT name FROM companies WHERE name = $1', [expenseData.company.trim()]);
                    if (existingCompany.rows.length === 0) {
                        await client.query('INSERT INTO companies (name) VALUES ($1)', [expenseData.company.trim()]);
                        console.log('✅ Company vytvorená pre expense:', expenseData.company.trim());
                    }
                }
                catch (companyError) {
                    console.log('⚠️ Company pre expense už existuje:', companyError.message);
                }
            }
            const result = await client.query('INSERT INTO expenses (description, amount, date, vehicle_id, company, category, note) VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING id, description, amount, date, vehicle_id, company, category, note, created_at', [
                expenseData.description,
                expenseData.amount,
                expenseData.date,
                expenseData.vehicleId || null,
                expenseData.company,
                expenseData.category,
                expenseData.note || null
            ]);
            const row = result.rows[0];
            return {
                id: row.id.toString(),
                description: row.description,
                amount: parseFloat(row.amount) || 0,
                date: new Date(row.date),
                vehicleId: row.vehicle_id?.toString(),
                company: row.company,
                category: row.category,
                note: row.note || undefined
            };
        }
        catch (error) {
            console.error('❌ Detailed createExpense error:', error);
            throw error;
        }
        finally {
            client.release();
        }
    }
    async updateExpense(expense) {
        const client = await this.pool.connect();
        try {
            // Automaticky vytvoriť company záznam ak neexistuje - bez ON CONFLICT
            if (expense.company && expense.company.trim()) {
                try {
                    const existingCompany = await client.query('SELECT name FROM companies WHERE name = $1', [expense.company.trim()]);
                    if (existingCompany.rows.length === 0) {
                        await client.query('INSERT INTO companies (name) VALUES ($1)', [expense.company.trim()]);
                    }
                }
                catch (companyError) {
                    console.log('⚠️ Company update pre expense error:', companyError.message);
                }
            }
            await client.query('UPDATE expenses SET description = $1, amount = $2, date = $3, vehicle_id = $4, company = $5, category = $6, note = $7 WHERE id = $8', [
                expense.description,
                expense.amount,
                expense.date,
                expense.vehicleId || null, // UUID as string, not parseInt
                expense.company,
                expense.category,
                expense.note,
                expense.id // UUID as string, not parseInt
            ]);
        }
        finally {
            client.release();
        }
    }
    async deleteExpense(id) {
        const client = await this.pool.connect();
        try {
            await client.query('DELETE FROM expenses WHERE id = $1', [id]); // Removed parseInt for UUID
        }
        finally {
            client.release();
        }
    }
    // Metódy pre poistky
    async getInsurances() {
        const client = await this.pool.connect();
        try {
            // JOIN s insurers tabuľkou pre načítanie názvu poistovne
            const result = await client.query(`
        SELECT i.*, ins.name as insurer_name 
        FROM insurances i 
        LEFT JOIN insurers ins ON i.insurer_id = ins.id 
        ORDER BY i.created_at DESC
      `);
            return result.rows.map(row => ({
                id: row.id?.toString() || '',
                vehicleId: row.rental_id?.toString() || '', // Mapovanie rental_id na vehicleId pre kompatibilitu
                type: row.type,
                policyNumber: row.policy_number || '',
                validFrom: row.start_date ? new Date(row.start_date) : new Date(),
                validTo: row.end_date ? new Date(row.end_date) : new Date(),
                price: parseFloat(row.premium) || 0,
                company: row.insurer_name || '', // Načítaný názov poistovne z JOIN
                paymentFrequency: row.payment_frequency || 'yearly',
                filePath: row.file_path || undefined
            }));
        }
        finally {
            client.release();
        }
    }
    async createInsurance(insuranceData) {
        const client = await this.pool.connect();
        try {
            // ✅ OPRAVENÉ: Mapovanie API parametrov na databázové stĺpce
            const result = await client.query('INSERT INTO insurances (rental_id, insurer_id, policy_number, type, coverage_amount, premium, start_date, end_date, payment_frequency, file_path) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10) RETURNING id, rental_id, insurer_id, policy_number, type, coverage_amount, premium, start_date, end_date, payment_frequency, file_path, created_at', [
                insuranceData.rentalId || null,
                insuranceData.insurerId || null,
                insuranceData.policyNumber,
                insuranceData.type,
                insuranceData.coverageAmount || insuranceData.price, // coverage_amount = price ako fallback
                insuranceData.price, // premium = price
                insuranceData.validFrom, // start_date = validFrom
                insuranceData.validTo, // end_date = validTo
                insuranceData.paymentFrequency || 'yearly',
                insuranceData.filePath || null
            ]);
            const row = result.rows[0];
            return {
                id: row.id.toString(),
                vehicleId: insuranceData.vehicleId || '', // Zachovávame pre kompatibilitu API
                rentalId: row.rental_id,
                insurerId: row.insurer_id,
                type: row.type,
                policyNumber: row.policy_number || '',
                validFrom: new Date(row.start_date),
                validTo: new Date(row.end_date),
                price: parseFloat(row.premium) || 0,
                company: insuranceData.company || '',
                paymentFrequency: row.payment_frequency || 'yearly',
                filePath: row.file_path || undefined,
                coverageAmount: parseFloat(row.coverage_amount) || 0
            };
        }
        finally {
            client.release();
        }
    }
    async updateInsurance(id, insuranceData) {
        const client = await this.pool.connect();
        try {
            // UPDATE s JOIN pre získanie názvu poistovne
            const result = await client.query(`
        UPDATE insurances 
        SET rental_id = $1, insurer_id = $2, type = $3, policy_number = $4, start_date = $5, end_date = $6, premium = $7, coverage_amount = $8, payment_frequency = $9, file_path = $10 
        WHERE id = $11 
        RETURNING id, rental_id, insurer_id, policy_number, type, coverage_amount, premium, start_date, end_date, payment_frequency, file_path
      `, [insuranceData.vehicleId || null, insuranceData.insurerId || null, insuranceData.type, insuranceData.policyNumber, insuranceData.validFrom, insuranceData.validTo, insuranceData.price, insuranceData.price, insuranceData.paymentFrequency || 'yearly', insuranceData.filePath || null, id]);
            if (result.rows.length === 0) {
                throw new Error('Poistka nebola nájdená');
            }
            // Načítam názov poistovne ak existuje insurer_id
            let insurerName = '';
            if (result.rows[0].insurer_id) {
                const insurerResult = await client.query('SELECT name FROM insurers WHERE id = $1', [result.rows[0].insurer_id]);
                insurerName = insurerResult.rows[0]?.name || '';
            }
            const row = result.rows[0];
            return {
                id: row.id.toString(),
                vehicleId: insuranceData.vehicleId || '', // Zachovávame pre kompatibilitu API
                type: row.type,
                policyNumber: row.policy_number || '',
                validFrom: new Date(row.start_date),
                validTo: new Date(row.end_date),
                price: parseFloat(row.premium) || 0,
                company: insurerName || insuranceData.company || '', // Použijem načítaný názov poistovne
                paymentFrequency: row.payment_frequency || 'yearly',
                filePath: row.file_path || undefined
            };
        }
        finally {
            client.release();
        }
    }
    async deleteInsurance(id) {
        const client = await this.pool.connect();
        try {
            await client.query('DELETE FROM insurances WHERE id = $1', [id]);
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
                id: row.id?.toString() || '',
                createdAt: new Date(row.created_at)
            }));
        }
        finally {
            client.release();
        }
    }
    async createCompany(companyData) {
        const client = await this.pool.connect();
        try {
            console.log('🏢 Creating company:', companyData.name);
            // ✅ OPRAVENÉ: Používame len stĺpce ktoré existujú v databáze
            const result = await client.query('INSERT INTO companies (name) VALUES ($1) RETURNING id, name, address, phone, email, ic, dic, created_at', [companyData.name]);
            console.log('🏢 Company created successfully:', result.rows[0]);
            const row = result.rows[0];
            return {
                id: row.id.toString(),
                name: row.name,
                businessId: row.ic, // ✅ ic -> businessId mapovanie
                taxId: row.dic, // ✅ dic -> taxId mapovanie
                address: row.address || '',
                contactPerson: '', // Nemáme v databáze, prazdné
                email: row.email || '',
                phone: row.phone || '',
                contractStartDate: undefined, // Nemáme v databáze
                contractEndDate: undefined, // Nemáme v databáze
                commissionRate: 20.00, // Default hodnota
                isActive: true, // Default hodnota
                createdAt: new Date(row.created_at),
                updatedAt: undefined // Nemáme v databáze
            };
        }
        catch (error) {
            console.error('❌ Error creating company:', error);
            throw error;
        }
        finally {
            client.release();
        }
    }
    async deleteCompany(id) {
        const client = await this.pool.connect();
        try {
            await client.query('DELETE FROM companies WHERE id = $1', [id]); // Removed parseInt for UUID
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
                id: row.id?.toString() || '',
                createdAt: new Date(row.created_at)
            }));
        }
        finally {
            client.release();
        }
    }
    async createInsurer(insurerData) {
        const client = await this.pool.connect();
        try {
            const result = await client.query('INSERT INTO insurers (name) VALUES ($1) RETURNING id, name, created_at', [insurerData.name]);
            const row = result.rows[0];
            return {
                id: row.id.toString(),
                name: row.name,
                createdAt: new Date(row.created_at)
            };
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
    // Metódy pre vyúčtovania (settlements)
    async getSettlements() {
        const client = await this.pool.connect();
        try {
            console.log('🔍 Starting getSettlements - checking/creating table...');
            // Ensure settlements table exists with correct schema
            await client.query(`
        CREATE TABLE IF NOT EXISTS settlements (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          company VARCHAR(100) DEFAULT 'Default Company',
          period VARCHAR(50) DEFAULT 'Current Period',
          from_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          to_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          total_income DECIMAL(10,2) DEFAULT 0,
          total_expenses DECIMAL(10,2) DEFAULT 0,
          commission DECIMAL(10,2) DEFAULT 0,
          profit DECIMAL(10,2) DEFAULT 0,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
      `);
            console.log('✅ Settlements table ensured');
            console.log('✅ Settlements table ready');
            // Simple query without JOINs that can cause issues
            const result = await client.query(`
        SELECT 
          id,
          company,
          period,
          from_date,
          to_date,
          total_income,
          total_expenses, 
          commission,
          profit,
          created_at
        FROM settlements
        ORDER BY created_at DESC
      `);
            console.log(`📊 Found ${result.rows.length} settlements`);
            // Load rentals and expenses for filtering
            const allRentals = await this.getRentals();
            const allExpenses = await this.getExpenses();
            // Map to Settlement interface format
            return result.rows.map((row) => {
                const fromDate = new Date(row.from_date || new Date());
                const toDate = new Date(row.to_date || new Date());
                const company = row.company || 'Default Company';
                // Filter rentals for this settlement
                const filteredRentals = allRentals.filter(rental => {
                    const rentalStart = new Date(rental.startDate);
                    const rentalEnd = new Date(rental.endDate);
                    const isInPeriod = (rentalStart >= fromDate && rentalStart <= toDate) ||
                        (rentalEnd >= fromDate && rentalEnd <= toDate) ||
                        (rentalStart <= fromDate && rentalEnd >= toDate);
                    // 🔧 FIXED: Use vehicle.company (from corrected getRentals) or fallback to rental.company
                    const vehicleCompany = rental.vehicle?.company;
                    const rentalCompany = rental.company; // Historical snapshot
                    const hasMatchingCompany = vehicleCompany === company || rentalCompany === company;
                    if (row.id && (isInPeriod || hasMatchingCompany)) {
                        console.log(`🏠 Settlement ${row.id} - Rental ${rental.id}: Vehicle company: "${vehicleCompany}", Historical company: "${rentalCompany}", Settlement company: "${company}", Match: ${hasMatchingCompany}, Period: ${isInPeriod}`);
                    }
                    return isInPeriod && hasMatchingCompany;
                });
                // Filter expenses for this settlement
                const filteredExpenses = allExpenses.filter(expense => {
                    const expenseDate = new Date(expense.date);
                    const isInPeriod = expenseDate >= fromDate && expenseDate <= toDate;
                    return isInPeriod && expense.company === company;
                });
                return {
                    id: row.id?.toString() || '',
                    period: {
                        from: fromDate,
                        to: toDate
                    },
                    rentals: filteredRentals,
                    expenses: filteredExpenses,
                    totalIncome: parseFloat(row.total_income) || 0,
                    totalExpenses: parseFloat(row.total_expenses) || 0,
                    totalCommission: parseFloat(row.commission) || 0,
                    profit: parseFloat(row.profit) || 0,
                    company: company,
                    vehicleId: undefined
                };
            });
        }
        catch (error) {
            console.error('❌ getSettlements error:', error);
            // Return empty array instead of throwing - graceful fallback
            return [];
        }
        finally {
            client.release();
        }
    }
    async getSettlement(id) {
        const client = await this.pool.connect();
        try {
            const result = await client.query(`
        SELECT * FROM settlements WHERE id = $1
      `, [id]);
            if (result.rows.length === 0)
                return null;
            const row = result.rows[0];
            // Načítaj súvisiace prenájmy a náklady a filtruj ich
            const allRentals = await this.getRentals();
            const allExpenses = await this.getExpenses();
            const fromDate = new Date(row.from_date);
            const toDate = new Date(row.to_date);
            const company = row.company;
            // Filter rentals for this settlement
            const filteredRentals = allRentals.filter(rental => {
                const rentalStart = new Date(rental.startDate);
                const rentalEnd = new Date(rental.endDate);
                const isInPeriod = (rentalStart >= fromDate && rentalStart <= toDate) ||
                    (rentalEnd >= fromDate && rentalEnd <= toDate) ||
                    (rentalStart <= fromDate && rentalEnd >= toDate);
                // Use vehicle.company (from corrected getRentals) or fallback to rental.company
                const vehicleCompany = rental.vehicle?.company;
                const rentalCompany = rental.company;
                const hasMatchingCompany = vehicleCompany === company || rentalCompany === company;
                return isInPeriod && hasMatchingCompany;
            });
            // Filter expenses for this settlement
            const filteredExpenses = allExpenses.filter(expense => {
                const expenseDate = new Date(expense.date);
                const isInPeriod = expenseDate >= fromDate && expenseDate <= toDate;
                return isInPeriod && expense.company === company;
            });
            return {
                id: row.id?.toString() || '',
                period: {
                    from: fromDate,
                    to: toDate
                },
                rentals: filteredRentals || [],
                expenses: filteredExpenses || [],
                totalIncome: parseFloat(row.total_income) || 0,
                totalExpenses: parseFloat(row.total_expenses) || 0,
                totalCommission: parseFloat(row.total_commission) || 0,
                profit: parseFloat(row.profit) || 0,
                company: row.company || undefined,
                vehicleId: row.vehicle_id || undefined
            };
        }
        finally {
            client.release();
        }
    }
    async createSettlement(settlementData) {
        const client = await this.pool.connect();
        try {
            console.log('🔍 Creating settlement with data:', settlementData);
            // Ensure settlements table exists with correct schema
            await client.query(`
        CREATE TABLE IF NOT EXISTS settlements (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          company VARCHAR(100) DEFAULT 'Default Company',
          period VARCHAR(50) DEFAULT 'Current Period',
          from_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          to_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          total_income DECIMAL(10,2) DEFAULT 0,
          total_expenses DECIMAL(10,2) DEFAULT 0,
          commission DECIMAL(10,2) DEFAULT 0,
          profit DECIMAL(10,2) DEFAULT 0,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
      `);
            console.log('✅ Settlements table ensured for create operation');
            const result = await client.query(`
        INSERT INTO settlements (
          company, period, from_date, to_date, total_income, total_expenses, 
          commission, profit
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
        RETURNING id, company, period, from_date, to_date, total_income, total_expenses, 
                  commission, profit, created_at
      `, [
                settlementData.company || 'Default Company',
                settlementData.period || 'Current Period',
                settlementData.fromDate || new Date(),
                settlementData.toDate || new Date(),
                settlementData.totalIncome || 0,
                settlementData.totalExpenses || 0,
                settlementData.commission || 0,
                settlementData.profit || 0
            ]);
            const row = result.rows[0];
            console.log('✅ Settlement created successfully:', row.id);
            return {
                id: row.id?.toString() || '',
                period: {
                    from: new Date(row.from_date),
                    to: new Date(row.to_date)
                },
                rentals: settlementData.rentals || [],
                expenses: settlementData.expenses || [],
                totalIncome: parseFloat(row.total_income) || 0,
                totalExpenses: parseFloat(row.total_expenses) || 0,
                totalCommission: parseFloat(row.commission) || 0,
                profit: parseFloat(row.profit) || 0,
                company: row.company || 'Default Company',
                vehicleId: undefined
            };
        }
        finally {
            client.release();
        }
    }
    async updateSettlement(id, updateData) {
        const client = await this.pool.connect();
        try {
            const result = await client.query(`
        UPDATE settlements 
        SET total_income = COALESCE($2, total_income),
            total_expenses = COALESCE($3, total_expenses),
            total_commission = COALESCE($4, total_commission),
            profit = COALESCE($5, profit),
            summary = COALESCE($6, summary),
            updated_at = CURRENT_TIMESTAMP
        WHERE id = $1
        RETURNING id, company, period_from, period_to, total_income, total_expenses, 
                  total_commission, profit, summary
      `, [
                id,
                updateData.totalIncome,
                updateData.totalExpenses,
                updateData.totalCommission,
                updateData.profit,
                updateData.summary
            ]);
            const row = result.rows[0];
            return {
                id: row.id?.toString() || '',
                period: {
                    from: new Date(row.period_from),
                    to: new Date(row.period_to)
                },
                rentals: [],
                expenses: [],
                totalIncome: parseFloat(row.total_income) || 0,
                totalExpenses: parseFloat(row.total_expenses) || 0,
                totalCommission: parseFloat(row.total_commission) || 0,
                profit: parseFloat(row.profit) || 0,
                company: row.company || undefined,
                vehicleId: undefined
            };
        }
        finally {
            client.release();
        }
    }
    async deleteSettlement(id) {
        const client = await this.pool.connect();
        try {
            await client.query('DELETE FROM settlements WHERE id = $1', [id]);
        }
        finally {
            client.release();
        }
    }
    // PROTOCOLS HELPER METHODS
    extractMediaData(mediaArray) {
        try {
            if (!Array.isArray(mediaArray)) {
                console.log('⚠️ extractMediaData: mediaArray is not an array, returning empty array');
                return [];
            }
            if (mediaArray.length === 0) {
                console.log('🔍 extractMediaData: Empty mediaArray, returning empty array');
                return [];
            }
            console.log('🔍 extractMediaData: Processing mediaArray with', mediaArray.length, 'items');
            const mediaData = mediaArray
                .filter(item => item !== null && item !== undefined)
                .map(item => {
                try {
                    // Ak je item string (base64 URL), vytvor objekt
                    if (typeof item === 'string') {
                        console.log('🔍 extractMediaData: Found string item (base64 URL)');
                        return {
                            id: `${Date.now()}_${Math.random()}`,
                            url: item,
                            type: 'vehicle',
                            timestamp: new Date(),
                            compressed: false
                        };
                    }
                    // Ak je item objekt, použij ho ako je
                    if (item && typeof item === 'object') {
                        console.log('🔍 extractMediaData: Found object item:', item.id || 'no id');
                        return item;
                    }
                    console.log('⚠️ extractMediaData: Ignoring invalid item:', item);
                    return null;
                }
                catch (error) {
                    console.error('❌ extractMediaData: Error processing item:', error);
                    return null;
                }
            })
                .filter(item => item !== null);
            console.log('✅ extractMediaData: Successfully extracted', mediaData.length, 'media items');
            return mediaData;
        }
        catch (error) {
            console.error('❌ extractMediaData: Critical error:', error);
            return [];
        }
    }
    mapMediaObjectsFromDB(mediaData) {
        if (!Array.isArray(mediaData)) {
            console.log('⚠️ mapMediaObjectsFromDB: mediaData is not an array, returning empty array');
            return [];
        }
        return mediaData
            .filter(item => item !== null && typeof item === 'object')
            .map(item => ({
            id: item.id || `${Date.now()}_${Math.random()}`,
            url: item.url || item,
            type: item.type || this.getMediaTypeFromUrl(item.url || ''),
            description: item.description || '',
            timestamp: item.timestamp ? new Date(item.timestamp) : new Date(),
            compressed: item.compressed || false,
            originalSize: item.originalSize,
            compressedSize: item.compressedSize
        }));
    }
    getMediaTypeFromUrl(url) {
        if (url.includes('/vehicle/'))
            return 'vehicle';
        if (url.includes('/damage/'))
            return 'damage';
        if (url.includes('/document/'))
            return 'document';
        if (url.includes('/fuel/'))
            return 'fuel';
        if (url.includes('/odometer/'))
            return 'odometer';
        return 'vehicle'; // default
    }
    // R2 Storage integration
    async uploadProtocolFile(protocolId, file, filename, contentType, mediaType = 'vehicle-images') {
        try {
            // ✅ POUŽIJ NOVÉ R2 METÓDY S LEPŠOU ORGANIZÁCIOU
            const fileKey = r2_storage_1.r2Storage.generateProtocolMediaKey(protocolId, mediaType, filename);
            const url = await r2_storage_1.r2Storage.uploadFile(fileKey, file, contentType, {
                protocol_id: protocolId,
                media_type: mediaType,
                uploaded_at: new Date().toISOString()
            });
            console.log(`✅ Protocol ${mediaType} uploaded to R2:`, url);
            return url;
        }
        catch (error) {
            console.error(`❌ Error uploading protocol ${mediaType} to R2:`, error);
            throw error;
        }
    }
    async uploadProtocolPDF(protocolId, pdfBuffer, protocolType = 'handover') {
        try {
            // ✅ POUŽIJ NOVÉ R2 METÓDY PRE PDF
            const fileKey = r2_storage_1.r2Storage.generateProtocolPDFKey(protocolId, protocolType);
            const url = await r2_storage_1.r2Storage.uploadFile(fileKey, pdfBuffer, 'application/pdf', {
                protocol_id: protocolId,
                protocol_type: protocolType,
                file_type: 'pdf',
                uploaded_at: new Date().toISOString()
            });
            console.log(`✅ Protocol PDF (${protocolType}) uploaded to R2:`, url);
            return url;
        }
        catch (error) {
            console.error(`❌ Error uploading protocol PDF (${protocolType}) to R2:`, error);
            throw error;
        }
    }
    // PROTOCOLS METHODS
    async initProtocolTables() {
        const client = await this.pool.connect();
        try {
            console.log('🔧 Initializing protocol tables...');
            // Handover Protocols table
            await client.query(`
        CREATE TABLE IF NOT EXISTS handover_protocols (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          rental_id UUID NOT NULL,
          type VARCHAR(20) DEFAULT 'handover',
          status VARCHAR(20) DEFAULT 'completed',
          location VARCHAR(255),
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          completed_at TIMESTAMP,
          
          -- Vehicle condition
          odometer INTEGER DEFAULT 0,
          fuel_level INTEGER DEFAULT 100,
          fuel_type VARCHAR(50) DEFAULT 'Benzín',
          exterior_condition VARCHAR(100) DEFAULT 'Dobrý',
          interior_condition VARCHAR(100) DEFAULT 'Dobrý',
          condition_notes TEXT,
          
          -- Media storage (JSONB for full objects with base64 data)
          vehicle_images_urls JSONB DEFAULT '[]', -- Full media objects with base64 data
          vehicle_videos_urls JSONB DEFAULT '[]', -- Full media objects with base64 data
          document_images_urls JSONB DEFAULT '[]', -- Full media objects with base64 data
          damage_images_urls JSONB DEFAULT '[]', -- Full media objects with base64 data
          
          -- Damages and signatures
          damages JSONB DEFAULT '[]',
          signatures JSONB DEFAULT '[]',
          
          -- Additional data
          rental_data JSONB,
          pdf_url VARCHAR(500),
          email_sent BOOLEAN DEFAULT FALSE,
          notes TEXT,
          created_by VARCHAR(100)
        );
      `);
            // Return Protocols table  
            await client.query(`
        CREATE TABLE IF NOT EXISTS return_protocols (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          rental_id UUID NOT NULL,
          handover_protocol_id UUID,
          type VARCHAR(20) DEFAULT 'return',
          status VARCHAR(20) DEFAULT 'draft',
          location VARCHAR(255),
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          completed_at TIMESTAMP,
          
          -- Vehicle condition
          odometer INTEGER DEFAULT 0,
          fuel_level INTEGER DEFAULT 100,
          fuel_type VARCHAR(50) DEFAULT 'Benzín',
          exterior_condition VARCHAR(100) DEFAULT 'Dobrý',
          interior_condition VARCHAR(100) DEFAULT 'Dobrý',
          condition_notes TEXT,
          
          -- Media storage (JSONB for full objects with base64 data)
          vehicle_images_urls JSONB DEFAULT '[]', -- Full media objects with base64 data
          vehicle_videos_urls JSONB DEFAULT '[]', -- Full media objects with base64 data
          document_images_urls JSONB DEFAULT '[]', -- Full media objects with base64 data
          damage_images_urls JSONB DEFAULT '[]', -- Full media objects with base64 data
          
          -- Damages and signatures
          damages JSONB DEFAULT '[]',
          new_damages JSONB DEFAULT '[]',
          signatures JSONB DEFAULT '[]',
          
          -- Calculations
          kilometers_used INTEGER DEFAULT 0,
          kilometer_overage INTEGER DEFAULT 0,
          kilometer_fee DECIMAL(10,2) DEFAULT 0,
          fuel_used INTEGER DEFAULT 0,
          fuel_fee DECIMAL(10,2) DEFAULT 0,
          total_extra_fees DECIMAL(10,2) DEFAULT 0,
          deposit_refund DECIMAL(10,2) DEFAULT 0,
          additional_charges DECIMAL(10,2) DEFAULT 0,
          final_refund DECIMAL(10,2) DEFAULT 0,
          
          -- Additional data
          rental_data JSONB,
          pdf_url VARCHAR(500),
          email_sent BOOLEAN DEFAULT FALSE,
          email_sent_at TIMESTAMP,
          notes TEXT,
          created_by VARCHAR(100)
        );
      `);
            // Migrácia existujúcich tabuliek na JSONB
            try {
                console.log('🔄 Running protocol tables migration...');
                // Migrácia handover_protocols
                await client.query(`
          ALTER TABLE handover_protocols 
          ALTER COLUMN vehicle_images_urls TYPE JSONB USING 
            CASE 
              WHEN vehicle_images_urls IS NULL THEN '[]'::jsonb
              WHEN jsonb_typeof(vehicle_images_urls::jsonb) = 'array' THEN vehicle_images_urls::jsonb
              ELSE '[]'::jsonb
            END;
        `);
                await client.query(`
          ALTER TABLE handover_protocols 
          ALTER COLUMN vehicle_videos_urls TYPE JSONB USING 
            CASE 
              WHEN vehicle_videos_urls IS NULL THEN '[]'::jsonb
              WHEN jsonb_typeof(vehicle_videos_urls::jsonb) = 'array' THEN vehicle_videos_urls::jsonb
              ELSE '[]'::jsonb
            END;
        `);
                await client.query(`
          ALTER TABLE handover_protocols 
          ALTER COLUMN document_images_urls TYPE JSONB USING 
            CASE 
              WHEN document_images_urls IS NULL THEN '[]'::jsonb
              WHEN jsonb_typeof(document_images_urls::jsonb) = 'array' THEN document_images_urls::jsonb
              ELSE '[]'::jsonb
            END;
        `);
                await client.query(`
          ALTER TABLE handover_protocols 
          ALTER COLUMN damage_images_urls TYPE JSONB USING 
            CASE 
              WHEN damage_images_urls IS NULL THEN '[]'::jsonb
              WHEN jsonb_typeof(damage_images_urls::jsonb) = 'array' THEN damage_images_urls::jsonb
              ELSE '[]'::jsonb
            END;
        `);
                // Migrácia return_protocols
                await client.query(`
          ALTER TABLE return_protocols 
          ALTER COLUMN vehicle_images_urls TYPE JSONB USING 
            CASE 
              WHEN vehicle_images_urls IS NULL THEN '[]'::jsonb
              WHEN jsonb_typeof(vehicle_images_urls::jsonb) = 'array' THEN vehicle_images_urls::jsonb
              ELSE '[]'::jsonb
            END;
        `);
                await client.query(`
          ALTER TABLE return_protocols 
          ALTER COLUMN vehicle_videos_urls TYPE JSONB USING 
            CASE 
              WHEN vehicle_videos_urls IS NULL THEN '[]'::jsonb
              WHEN jsonb_typeof(vehicle_videos_urls::jsonb) = 'array' THEN vehicle_videos_urls::jsonb
              ELSE '[]'::jsonb
            END;
        `);
                await client.query(`
          ALTER TABLE return_protocols 
          ALTER COLUMN document_images_urls TYPE JSONB USING 
            CASE 
              WHEN document_images_urls IS NULL THEN '[]'::jsonb
              WHEN jsonb_typeof(document_images_urls::jsonb) = 'array' THEN document_images_urls::jsonb
              ELSE '[]'::jsonb
            END;
        `);
                await client.query(`
          ALTER TABLE return_protocols 
          ALTER COLUMN damage_images_urls TYPE JSONB USING 
            CASE 
              WHEN damage_images_urls IS NULL THEN '[]'::jsonb
              WHEN jsonb_typeof(damage_images_urls::jsonb) = 'array' THEN damage_images_urls::jsonb
              ELSE '[]'::jsonb
            END;
        `);
                // Pridanie chýbajúcich stĺpcov pre handover_protocols
                try {
                    await client.query(`
            ALTER TABLE handover_protocols 
            ADD COLUMN IF NOT EXISTS pdf_url VARCHAR(500);
          `);
                    await client.query(`
            ALTER TABLE handover_protocols 
            ADD COLUMN IF NOT EXISTS email_sent BOOLEAN DEFAULT FALSE;
          `);
                    console.log('✅ Added missing columns to handover_protocols');
                }
                catch (columnError) {
                    console.log('⚠️ Column migration failed (columns might already exist):', columnError);
                }
                console.log('✅ Protocol tables migration completed');
            }
            catch (migrationError) {
                console.log('⚠️ Protocol tables migration failed (tables might already be migrated):', migrationError);
            }
            console.log('✅ Protocol tables initialized successfully');
        }
        catch (error) {
            console.error('❌ Error initializing protocol tables:', error);
            throw error;
        }
        finally {
            client.release();
        }
    }
    // HANDOVER PROTOCOLS
    async createHandoverProtocol(protocolData) {
        const client = await this.pool.connect();
        try {
            console.log('🔄 [DB] createHandoverProtocol - input:', JSON.stringify(protocolData, null, 2));
            await this.initProtocolTables();
            console.log('🔄 Creating handover protocol:', protocolData.id);
            console.log('🔄 Protocol data:', JSON.stringify(protocolData, null, 2));
            console.log('🔄 PDF URL from input:', protocolData.pdfUrl);
            // Validácia dát
            if (!protocolData.rentalId) {
                throw new Error('Rental ID is required');
            }
            // MÉDIA: Použij priamo médiá z frontendu - už sú v správnom formáte
            console.log('🔄 [DB] Media before DB insert:', {
                vehicleImages: protocolData.vehicleImages?.length || 0,
                vehicleVideos: protocolData.vehicleVideos?.length || 0,
                documentImages: protocolData.documentImages?.length || 0,
                damageImages: protocolData.damageImages?.length || 0
            });
            console.log('🔄 PDF URL before DB insert:', protocolData.pdfUrl);
            const result = await client.query(`
        INSERT INTO handover_protocols (
          rental_id, location, odometer, fuel_level, fuel_type,
          exterior_condition, interior_condition, condition_notes,
          vehicle_images_urls, vehicle_videos_urls, document_images_urls, damage_images_urls,
          damages, signatures, rental_data, pdf_url, email_sent, notes, created_by
        ) VALUES (
          $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19
        ) RETURNING *
      `, [
                protocolData.rentalId, // UUID as string, not parseInt
                protocolData.location || '',
                protocolData.vehicleCondition?.odometer || 0,
                protocolData.vehicleCondition?.fuelLevel || 100,
                protocolData.vehicleCondition?.fuelType || 'Benzín',
                protocolData.vehicleCondition?.exteriorCondition || 'Dobrý',
                protocolData.vehicleCondition?.interiorCondition || 'Dobrý',
                protocolData.vehicleCondition?.notes || '',
                JSON.stringify(protocolData.vehicleImages || []), // ✅ OPRAVENÉ: JSON.stringify pre JSONB
                JSON.stringify(protocolData.vehicleVideos || []), // ✅ OPRAVENÉ: JSON.stringify pre JSONB
                JSON.stringify(protocolData.documentImages || []), // ✅ OPRAVENÉ: JSON.stringify pre JSONB
                JSON.stringify(protocolData.damageImages || []), // ✅ OPRAVENÉ: JSON.stringify pre JSONB
                JSON.stringify(protocolData.damages || []),
                JSON.stringify(protocolData.signatures || []),
                JSON.stringify(protocolData.rentalData || {}),
                protocolData.pdfUrl || null,
                protocolData.emailSent || false,
                protocolData.notes || '',
                protocolData.createdBy || ''
            ]);
            const row = result.rows[0];
            console.log('✅ Handover protocol created:', row.id);
            console.log('✅ PDF URL in database:', row.pdf_url);
            console.log('✅ Media in database:', {
                vehicleImages: row.vehicle_images_urls?.length || 0,
                vehicleVideos: row.vehicle_videos_urls?.length || 0,
                documentImages: row.document_images_urls?.length || 0,
                damageImages: row.damage_images_urls?.length || 0
            });
            // ✅ UPDATE RENTAL with protocol ID
            await client.query(`
        UPDATE rentals 
        SET handover_protocol_id = $1 
        WHERE id = $2
      `, [row.id, protocolData.rentalId]);
            console.log('✅ Updated rental', protocolData.rentalId, 'with handover protocol ID:', row.id);
            const mappedProtocol = this.mapHandoverProtocolFromDB(row);
            console.log('✅ Mapped protocol pdfUrl:', mappedProtocol.pdfUrl);
            console.log('✅ Mapped protocol media:', {
                vehicleImages: mappedProtocol.vehicleImages?.length || 0,
                vehicleVideos: mappedProtocol.vehicleVideos?.length || 0,
                documentImages: mappedProtocol.documentImages?.length || 0,
                damageImages: mappedProtocol.damageImages?.length || 0
            });
            return mappedProtocol;
        }
        catch (error) {
            console.error('❌ Error creating handover protocol:', error);
            console.error('❌ Error details:', error instanceof Error ? error.message : 'Unknown error');
            console.error('❌ Error stack:', error instanceof Error ? error.stack : 'No stack trace');
            throw error;
        }
        finally {
            client.release();
        }
    }
    async getHandoverProtocolsByRental(rentalId) {
        const client = await this.pool.connect();
        try {
            await this.initProtocolTables();
            const result = await client.query(`
        SELECT * FROM handover_protocols 
        WHERE rental_id = $1 
        ORDER BY created_at DESC
      `, [rentalId]);
            return result.rows.map(row => this.mapHandoverProtocolFromDB(row));
        }
        catch (error) {
            console.error('❌ Error fetching handover protocols:', error);
            return [];
        }
        finally {
            client.release();
        }
    }
    async getHandoverProtocolById(id) {
        const client = await this.pool.connect();
        try {
            await this.initProtocolTables();
            const result = await client.query(`
        SELECT * FROM handover_protocols WHERE id = $1::uuid
      `, [id]);
            if (result.rows.length === 0)
                return null;
            return this.mapHandoverProtocolFromDB(result.rows[0]);
        }
        catch (error) {
            console.error('❌ Error fetching handover protocol:', error);
            return null;
        }
        finally {
            client.release();
        }
    }
    // RETURN PROTOCOLS
    async createReturnProtocol(protocolData) {
        const client = await this.pool.connect();
        try {
            await this.initProtocolTables();
            console.log('🔄 Creating return protocol:', protocolData.id);
            const result = await client.query(`
        INSERT INTO return_protocols (
          id, rental_id, handover_protocol_id, location, status, completed_at,
          odometer, fuel_level, fuel_type, exterior_condition, interior_condition, condition_notes,
          vehicle_images_urls, vehicle_videos_urls, document_images_urls, damage_images_urls,
          damages, new_damages, signatures,
          kilometers_used, kilometer_overage, kilometer_fee,
          fuel_used, fuel_fee, total_extra_fees,
          deposit_refund, additional_charges, final_refund,
          rental_data, pdf_url, email_sent, notes, created_by
        ) VALUES (
          $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, 
          $17, $18, $19, $20, $21, $22, $23, $24, $25, $26, $27, $28, $29, $30, $31, $32, $33
        ) RETURNING *
      `, [
                protocolData.id,
                protocolData.rentalId,
                protocolData.handoverProtocolId || null,
                protocolData.location || '',
                protocolData.status || 'draft',
                protocolData.completedAt || null,
                protocolData.vehicleCondition?.odometer || 0,
                protocolData.vehicleCondition?.fuelLevel || 100,
                protocolData.vehicleCondition?.fuelType || 'Benzín',
                protocolData.vehicleCondition?.exteriorCondition || 'Dobrý',
                protocolData.vehicleCondition?.interiorCondition || 'Dobrý',
                protocolData.vehicleCondition?.notes || '',
                JSON.stringify(protocolData.vehicleImages || []), // ✅ OPRAVENÉ: JSON.stringify pre JSONB
                JSON.stringify(protocolData.vehicleVideos || []), // ✅ OPRAVENÉ: JSON.stringify pre JSONB
                JSON.stringify(protocolData.documentImages || []), // ✅ OPRAVENÉ: JSON.stringify pre JSONB
                JSON.stringify(protocolData.damageImages || []), // ✅ OPRAVENÉ: JSON.stringify pre JSONB
                JSON.stringify(protocolData.damages || []),
                JSON.stringify(protocolData.newDamages || []),
                JSON.stringify(protocolData.signatures || []),
                protocolData.kilometersUsed || 0,
                protocolData.kilometerOverage || 0,
                protocolData.kilometerFee || 0,
                protocolData.fuelUsed || 0,
                protocolData.fuelFee || 0,
                protocolData.totalExtraFees || 0,
                protocolData.depositRefund || 0,
                protocolData.additionalCharges || 0,
                protocolData.finalRefund || 0,
                JSON.stringify(protocolData.rentalData || {}),
                protocolData.pdfUrl || null,
                protocolData.emailSent || false,
                protocolData.notes || '',
                protocolData.createdBy || ''
            ]);
            const row = result.rows[0];
            console.log('✅ Return protocol created:', row.id);
            // ✅ UPDATE RENTAL with protocol ID
            await client.query(`
        UPDATE rentals 
        SET return_protocol_id = $1 
        WHERE id = $2
      `, [row.id, protocolData.rentalId]);
            console.log('✅ Updated rental', protocolData.rentalId, 'with return protocol ID:', row.id);
            return this.mapReturnProtocolFromDB(row);
        }
        catch (error) {
            console.error('❌ Error creating return protocol:', error);
            throw error;
        }
        finally {
            client.release();
        }
    }
    async getReturnProtocolsByRental(rentalId) {
        const client = await this.pool.connect();
        try {
            await this.initProtocolTables();
            const result = await client.query(`
        SELECT * FROM return_protocols 
        WHERE rental_id = $1 
        ORDER BY created_at DESC
      `, [rentalId]);
            return result.rows.map(row => this.mapReturnProtocolFromDB(row));
        }
        catch (error) {
            console.error('❌ Error fetching return protocols:', error);
            return [];
        }
        finally {
            client.release();
        }
    }
    async getReturnProtocolById(id) {
        const client = await this.pool.connect();
        try {
            await this.initProtocolTables();
            const result = await client.query(`
        SELECT * FROM return_protocols WHERE id = $1::uuid
      `, [id]);
            if (result.rows.length === 0)
                return null;
            return this.mapReturnProtocolFromDB(result.rows[0]);
        }
        catch (error) {
            console.error('❌ Error fetching return protocol:', error);
            return null;
        }
        finally {
            client.release();
        }
    }
    async updateReturnProtocol(id, updateData) {
        const client = await this.pool.connect();
        try {
            await this.initProtocolTables();
            const result = await client.query(`
        UPDATE return_protocols SET
          status = COALESCE($2, status),
          completed_at = COALESCE($3, completed_at),
          pdf_url = COALESCE($4, pdf_url),
          email_sent = COALESCE($5, email_sent),
          email_sent_at = COALESCE($6, email_sent_at),
          notes = COALESCE($7, notes)
        WHERE id = $1::uuid
        RETURNING *
      `, [
                id,
                updateData.status,
                updateData.completedAt,
                updateData.pdfUrl,
                updateData.emailSent,
                updateData.emailSentAt,
                updateData.notes
            ]);
            if (result.rows.length === 0)
                return null;
            return this.mapReturnProtocolFromDB(result.rows[0]);
        }
        catch (error) {
            console.error('❌ Error updating return protocol:', error);
            throw error;
        }
        finally {
            client.release();
        }
    }
    // Mapping methods
    mapHandoverProtocolFromDB(row) {
        // Safe JSON parsing function for JSONB fields
        const safeJsonParse = (value, fallback = []) => {
            console.log('🔍 [DB] safeJsonParse input:', {
                value: value,
                type: typeof value,
                isArray: Array.isArray(value),
                isNull: value === null,
                isUndefined: value === undefined,
                stringLength: typeof value === 'string' ? value.length : 'N/A'
            });
            if (!value || value === 'null' || value === 'undefined') {
                console.log('🔍 [DB] safeJsonParse: returning fallback (null/undefined)');
                return fallback;
            }
            // JSONB sa automaticky parsuje PostgreSQL, takže ak je to už objekt, vráť ho
            if (typeof value === 'object' && value !== null) {
                // ✅ NOVÁ LOGIKA: Ak je to pole stringov, parsuj každý string
                if (Array.isArray(value) && value.length > 0 && typeof value[0] === 'string') {
                    console.log('🔍 [DB] safeJsonParse: parsing array of JSON strings');
                    try {
                        const parsed = value.map(item => {
                            if (typeof item === 'string') {
                                return JSON.parse(item);
                            }
                            return item;
                        });
                        console.log('🔍 [DB] safeJsonParse: successfully parsed array of strings:', parsed);
                        return parsed;
                    }
                    catch (error) {
                        console.log('⚠️ Error parsing array of JSON strings:', error);
                        return fallback;
                    }
                }
                console.log('🔍 [DB] safeJsonParse: value is already object, returning as is');
                return value;
            }
            // Ak je to string, skús ho parsovať
            if (typeof value === 'string') {
                try {
                    const parsed = JSON.parse(value);
                    console.log('🔍 [DB] safeJsonParse: successfully parsed string to:', parsed);
                    return parsed;
                }
                catch (error) {
                    console.log('⚠️ JSON parse error in mapHandoverProtocolFromDB:', error);
                    return fallback;
                }
            }
            console.log('🔍 [DB] safeJsonParse: returning fallback (unknown type)');
            return fallback;
        };
        console.log('🔄 [DB] Mapping handover protocol from DB row:', {
            id: row.id,
            pdf_url: row.pdf_url,
            pdf_url_type: typeof row.pdf_url,
            vehicle_images_type: typeof row.vehicle_images_urls,
            vehicle_images_length: Array.isArray(row.vehicle_images_urls) ? row.vehicle_images_urls.length : 'not array',
            vehicle_images_raw: row.vehicle_images_urls
        });
        const mappedProtocol = {
            id: row.id,
            rentalId: row.rental_id,
            type: 'handover',
            status: row.status || 'completed',
            location: row.location,
            createdAt: new Date(row.created_at),
            completedAt: row.completed_at ? new Date(row.completed_at) : new Date(row.created_at),
            vehicleCondition: {
                odometer: row.odometer || 0,
                fuelLevel: row.fuel_level || 100,
                fuelType: row.fuel_type || 'Benzín',
                exteriorCondition: row.exterior_condition || 'Dobrý',
                interiorCondition: row.interior_condition || 'Dobrý',
                notes: row.condition_notes || ''
            },
            vehicleImages: safeJsonParse(row.vehicle_images_urls, []), // ✅ JSONB - automaticky parsované
            vehicleVideos: safeJsonParse(row.vehicle_videos_urls, []), // ✅ JSONB - automaticky parsované
            documentImages: safeJsonParse(row.document_images_urls, []), // ✅ JSONB - automaticky parsované
            damageImages: safeJsonParse(row.damage_images_urls, []), // ✅ JSONB - automaticky parsované
            damages: safeJsonParse(row.damages, []),
            signatures: safeJsonParse(row.signatures, []),
            rentalData: safeJsonParse(row.rental_data, {}),
            pdfUrl: row.pdf_url,
            emailSent: row.email_sent || false,
            emailSentAt: row.email_sent_at ? new Date(row.email_sent_at) : undefined,
            notes: row.notes,
            createdBy: row.created_by
        };
        console.log('🔄 [DB] Mapped protocol media:', {
            vehicleImages: mappedProtocol.vehicleImages?.length || 0,
            vehicleVideos: mappedProtocol.vehicleVideos?.length || 0,
            documentImages: mappedProtocol.documentImages?.length || 0,
            damageImages: mappedProtocol.damageImages?.length || 0,
            vehicleImagesSample: mappedProtocol.vehicleImages?.slice(0, 2) || []
        });
        return mappedProtocol;
    }
    mapReturnProtocolFromDB(row) {
        // Safe JSON parsing function for JSONB fields
        const safeJsonParse = (value, fallback = []) => {
            if (!value || value === 'null' || value === 'undefined') {
                return fallback;
            }
            // JSONB sa automaticky parsuje PostgreSQL, takže ak je to už objekt, vráť ho
            if (typeof value === 'object' && value !== null) {
                return value;
            }
            // Ak je to string, skús ho parsovať
            if (typeof value === 'string') {
                try {
                    return JSON.parse(value);
                }
                catch (error) {
                    console.log('⚠️ JSON parse error in mapReturnProtocolFromDB:', error);
                    return fallback;
                }
            }
            return fallback;
        };
        return {
            id: row.id,
            rentalId: row.rental_id,
            handoverProtocolId: row.handover_protocol_id,
            type: 'return',
            status: row.status || 'draft',
            location: row.location,
            createdAt: new Date(row.created_at),
            completedAt: row.completed_at ? new Date(row.completed_at) : undefined,
            vehicleCondition: {
                odometer: row.odometer || 0,
                fuelLevel: row.fuel_level || 100,
                fuelType: row.fuel_type || 'Benzín',
                exteriorCondition: row.exterior_condition || 'Dobrý',
                interiorCondition: row.interior_condition || 'Dobrý',
                notes: row.condition_notes || ''
            },
            vehicleImages: safeJsonParse(row.vehicle_images_urls, []), // ✅ PRIAMO - bez mapMediaObjectsFromDB
            vehicleVideos: safeJsonParse(row.vehicle_videos_urls, []), // ✅ PRIAMO - bez mapMediaObjectsFromDB
            documentImages: safeJsonParse(row.document_images_urls, []), // ✅ PRIAMO - bez mapMediaObjectsFromDB
            damageImages: safeJsonParse(row.damage_images_urls, []), // ✅ PRIAMO - bez mapMediaObjectsFromDB
            damages: safeJsonParse(row.damages, []),
            newDamages: safeJsonParse(row.new_damages, []),
            signatures: safeJsonParse(row.signatures, []),
            kilometersUsed: row.kilometers_used || 0,
            kilometerOverage: row.kilometer_overage || 0,
            kilometerFee: parseFloat(row.kilometer_fee) || 0,
            fuelUsed: row.fuel_used || 0,
            fuelFee: parseFloat(row.fuel_fee) || 0,
            totalExtraFees: parseFloat(row.total_extra_fees) || 0,
            depositRefund: parseFloat(row.deposit_refund) || 0,
            additionalCharges: parseFloat(row.additional_charges) || 0,
            finalRefund: parseFloat(row.final_refund) || 0,
            rentalData: safeJsonParse(row.rental_data, {}),
            pdfUrl: row.pdf_url,
            emailSent: row.email_sent || false,
            emailSentAt: row.email_sent_at ? new Date(row.email_sent_at) : undefined,
            notes: row.notes,
            createdBy: row.created_by
        };
    }
    // Zatvorenie spojenia
    async deleteHandoverProtocol(id) {
        const client = await this.pool.connect();
        try {
            console.log(`🗑️ Deleting handover protocol: ${id}`);
            // Najprv získaj protokol aby sme vedeli vymazať súbory
            const protocol = await this.getHandoverProtocolById(id);
            if (!protocol) {
                console.log(`⚠️ Protocol ${id} not found`);
                return false;
            }
            // Vymazanie z databázy
            const result = await client.query(`
        DELETE FROM handover_protocols WHERE id = $1::uuid
      `, [id]);
            if (result.rowCount === 0) {
                console.log(`⚠️ No protocol deleted from database: ${id}`);
                return false;
            }
            // ✅ MAZANIE SÚBOROV Z R2
            try {
                await r2_storage_1.r2Storage.deleteProtocolFiles(id);
                console.log(`✅ Protocol files deleted from R2: ${id}`);
            }
            catch (error) {
                console.error(`❌ Error deleting protocol files from R2: ${error}`);
                // Pokračujeme aj keď sa súbory nevymazali
            }
            console.log(`✅ Handover protocol deleted successfully: ${id}`);
            return true;
        }
        catch (error) {
            console.error('❌ Error deleting handover protocol:', error);
            return false;
        }
        finally {
            client.release();
        }
    }
    async deleteReturnProtocol(id) {
        const client = await this.pool.connect();
        try {
            console.log(`🗑️ Deleting return protocol: ${id}`);
            // Najprv získaj protokol aby sme vedeli vymazať súbory
            const protocol = await this.getReturnProtocolById(id);
            if (!protocol) {
                console.log(`⚠️ Protocol ${id} not found`);
                return false;
            }
            // Vymazanie z databázy
            const result = await client.query(`
        DELETE FROM return_protocols WHERE id = $1::uuid
      `, [id]);
            if (result.rowCount === 0) {
                console.log(`⚠️ No protocol deleted from database: ${id}`);
                return false;
            }
            // ✅ MAZANIE SÚBOROV Z R2
            try {
                await r2_storage_1.r2Storage.deleteProtocolFiles(id);
                console.log(`✅ Protocol files deleted from R2: ${id}`);
            }
            catch (error) {
                console.error(`❌ Error deleting protocol files from R2: ${error}`);
                // Pokračujeme aj keď sa súbory nevymazali
            }
            console.log(`✅ Return protocol deleted successfully: ${id}`);
            return true;
        }
        catch (error) {
            console.error('❌ Error deleting return protocol:', error);
            return false;
        }
        finally {
            client.release();
        }
    }
    async getClient() {
        return await this.pool.connect();
    }
    async close() {
        await this.pool.end();
    }
    // 🚀 NOVÁ METÓDA: Aktualizácia handover protokolu
    async updateHandoverProtocol(id, updateData) {
        const client = await this.pool.connect();
        try {
            console.log('🔄 Updating handover protocol:', id);
            console.log('🔄 Update data:', JSON.stringify(updateData, null, 2));
            // Dynamické vytvorenie SET klauzuly
            const setFields = [];
            const values = [];
            let paramIndex = 1;
            // Mapovanie polí
            const fieldMappings = {
                vehicleImages: 'vehicle_images_urls',
                vehicleVideos: 'vehicle_videos_urls',
                documentImages: 'document_images_urls',
                documentVideos: 'document_videos_urls',
                damageImages: 'damage_images_urls',
                damageVideos: 'damage_videos_urls',
                damages: 'damages',
                signatures: 'signatures',
                rentalData: 'rental_data',
                pdfUrl: 'pdf_url',
                emailSent: 'email_sent',
                notes: 'notes',
                location: 'location',
                status: 'status',
                completedAt: 'completed_at'
            };
            for (const [key, value] of Object.entries(updateData)) {
                if (fieldMappings[key]) {
                    setFields.push(`${fieldMappings[key]} = $${paramIndex}`);
                    // Špeciálne spracovanie pre JSON polia
                    if (['vehicleImages', 'vehicleVideos', 'documentImages', 'documentVideos', 'damageImages', 'damageVideos', 'damages', 'signatures', 'rentalData'].includes(key)) {
                        values.push(JSON.stringify(value));
                    }
                    else if (key === 'completedAt' && value) {
                        values.push(new Date(value));
                    }
                    else {
                        values.push(value);
                    }
                    paramIndex++;
                }
            }
            if (setFields.length === 0) {
                throw new Error('Žiadne platné polia na aktualizáciu');
            }
            // Pridanie updated_at
            setFields.push('updated_at = CURRENT_TIMESTAMP');
            const query = `
        UPDATE handover_protocols 
        SET ${setFields.join(', ')}
        WHERE id = $${paramIndex}::uuid
        RETURNING *
      `;
            values.push(id);
            console.log('🔄 Update query:', query);
            console.log('🔄 Update values:', values);
            const result = await client.query(query, values);
            if (result.rows.length === 0) {
                throw new Error('Protokol nebol nájdený');
            }
            const updatedProtocol = this.mapHandoverProtocolFromDB(result.rows[0]);
            console.log('✅ Handover protocol updated successfully');
            return updatedProtocol;
        }
        catch (error) {
            console.error('❌ Error updating handover protocol:', error);
            throw error;
        }
        finally {
            client.release();
        }
    }
    // ========================================
    // VEHICLE UNAVAILABILITY CRUD METHODS
    // ========================================
    async getVehicleUnavailabilities(vehicleId, startDate, endDate) {
        const client = await this.pool.connect();
        try {
            let query = `
        SELECT vu.*, v.brand, v.model, v.license_plate 
        FROM vehicle_unavailability vu
        LEFT JOIN vehicles v ON vu.vehicle_id = v.id
        WHERE 1=1
      `;
            const params = [];
            let paramIndex = 1;
            // Filter by vehicle ID
            if (vehicleId) {
                query += ` AND vu.vehicle_id = $${paramIndex}`;
                params.push(vehicleId);
                paramIndex++;
            }
            // Filter by date range
            if (startDate && endDate) {
                query += ` AND vu.start_date <= $${paramIndex} AND vu.end_date >= $${paramIndex + 1}`;
                params.push(endDate, startDate);
                paramIndex += 2;
            }
            query += ` ORDER BY vu.start_date ASC, vu.priority ASC`;
            const result = await client.query(query, params);
            return result.rows.map(row => ({
                id: row.id,
                vehicleId: row.vehicle_id,
                vehicle: row.brand ? {
                    brand: row.brand,
                    model: row.model,
                    licensePlate: row.license_plate
                } : undefined,
                startDate: new Date(row.start_date),
                endDate: new Date(row.end_date),
                reason: row.reason,
                type: row.type,
                notes: row.notes,
                priority: row.priority,
                recurring: row.recurring,
                recurringConfig: row.recurring_config ? JSON.parse(row.recurring_config) : undefined,
                createdAt: new Date(row.created_at),
                updatedAt: new Date(row.updated_at),
                createdBy: row.created_by
            }));
        }
        finally {
            client.release();
        }
    }
    async getVehicleUnavailability(id) {
        const client = await this.pool.connect();
        try {
            const result = await client.query(`
        SELECT vu.*, v.brand, v.model, v.license_plate 
        FROM vehicle_unavailability vu
        LEFT JOIN vehicles v ON vu.vehicle_id = v.id
        WHERE vu.id = $1
      `, [id]);
            if (result.rows.length === 0)
                return null;
            const row = result.rows[0];
            return {
                id: row.id,
                vehicleId: row.vehicle_id,
                vehicle: row.brand ? {
                    brand: row.brand,
                    model: row.model,
                    licensePlate: row.license_plate
                } : undefined,
                startDate: new Date(row.start_date),
                endDate: new Date(row.end_date),
                reason: row.reason,
                type: row.type,
                notes: row.notes,
                priority: row.priority,
                recurring: row.recurring,
                recurringConfig: row.recurring_config ? JSON.parse(row.recurring_config) : undefined,
                createdAt: new Date(row.created_at),
                updatedAt: new Date(row.updated_at),
                createdBy: row.created_by
            };
        }
        finally {
            client.release();
        }
    }
    async createVehicleUnavailability(data) {
        const client = await this.pool.connect();
        try {
            // Validate dates
            if (data.endDate < data.startDate) {
                throw new Error('Dátum ukončenia nemôže byť skorší ako dátum začiatku');
            }
            // Check for conflicts
            const conflictCheck = await client.query(`
        SELECT id, reason, type FROM vehicle_unavailability 
        WHERE vehicle_id = $1 
        AND start_date < $3 
        AND end_date > $2
      `, [data.vehicleId, data.startDate, data.endDate]);
            if (conflictCheck.rows.length > 0) {
                const conflict = conflictCheck.rows[0];
                console.warn(`⚠️ Prekrývanie s existujúcou nedostupnosťou: ${conflict.reason} (${conflict.type})`);
                // Len warning, nie error - môžu sa prekrývať
            }
            const result = await client.query(`
        INSERT INTO vehicle_unavailability (
          vehicle_id, start_date, end_date, reason, type, notes, 
          priority, recurring, recurring_config, created_by
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10) 
        RETURNING *
      `, [
                data.vehicleId,
                data.startDate,
                data.endDate,
                data.reason,
                data.type || 'maintenance',
                data.notes,
                data.priority || 2,
                data.recurring || false,
                data.recurringConfig ? JSON.stringify(data.recurringConfig) : null,
                data.createdBy || 'system'
            ]);
            const row = result.rows[0];
            return {
                id: row.id,
                vehicleId: row.vehicle_id,
                startDate: new Date(row.start_date),
                endDate: new Date(row.end_date),
                reason: row.reason,
                type: row.type,
                notes: row.notes,
                priority: row.priority,
                recurring: row.recurring,
                recurringConfig: row.recurring_config ? JSON.parse(row.recurring_config) : undefined,
                createdAt: new Date(row.created_at),
                updatedAt: new Date(row.updated_at),
                createdBy: row.created_by
            };
        }
        finally {
            client.release();
        }
    }
    async updateVehicleUnavailability(id, data) {
        const client = await this.pool.connect();
        try {
            // Build dynamic update query
            const setFields = [];
            const values = [];
            let paramIndex = 1;
            for (const [key, value] of Object.entries(data)) {
                if (value !== undefined) {
                    const dbField = key === 'startDate' ? 'start_date' :
                        key === 'endDate' ? 'end_date' :
                            key === 'recurringConfig' ? 'recurring_config' :
                                key.replace(/([A-Z])/g, '_$1').toLowerCase();
                    setFields.push(`${dbField} = $${paramIndex}`);
                    if (key === 'recurringConfig') {
                        values.push(JSON.stringify(value));
                    }
                    else {
                        values.push(value);
                    }
                    paramIndex++;
                }
            }
            if (setFields.length === 0) {
                throw new Error('Žiadne polia na aktualizáciu');
            }
            setFields.push('updated_at = CURRENT_TIMESTAMP');
            const query = `
        UPDATE vehicle_unavailability 
        SET ${setFields.join(', ')}
        WHERE id = $${paramIndex}
        RETURNING *
      `;
            const result = await client.query(query, [...values, id]);
            if (result.rows.length === 0) {
                throw new Error('Nedostupnosť vozidla nenájdená');
            }
            const row = result.rows[0];
            return {
                id: row.id,
                vehicleId: row.vehicle_id,
                startDate: new Date(row.start_date),
                endDate: new Date(row.end_date),
                reason: row.reason,
                type: row.type,
                notes: row.notes,
                priority: row.priority,
                recurring: row.recurring,
                recurringConfig: row.recurring_config ? JSON.parse(row.recurring_config) : undefined,
                createdAt: new Date(row.created_at),
                updatedAt: new Date(row.updated_at),
                createdBy: row.created_by
            };
        }
        finally {
            client.release();
        }
    }
    async deleteVehicleUnavailability(id) {
        const client = await this.pool.connect();
        try {
            const result = await client.query('DELETE FROM vehicle_unavailability WHERE id = $1', [id]);
            return (result.rowCount || 0) > 0;
        }
        finally {
            client.release();
        }
    }
    // 🚀 FÁZA 2.1 + 2.2 + 2.3: HYBRID OPTIMIZED - smart cache + pre-filtered CTE + connection reuse  
    async getCalendarDataUnified(startDate, endDate) {
        // 🚀 FÁZA 2.3: SMART CACHE CHECK - skús nájsť v cache
        const cacheKey = this.generateCacheKey('calendar', startDate, endDate);
        const cachedEntry = this.calendarCache.get(cacheKey);
        if (cachedEntry && this.isValidCacheEntry(cachedEntry, this.CALENDAR_CACHE_TTL)) {
            console.log(`⚡ CALENDAR CACHE HIT - using cached data for ${cacheKey}`);
            return cachedEntry.data;
        }
        console.log(`🔄 CALENDAR CACHE MISS - generating fresh data for ${cacheKey}`);
        // 🚀 FÁZA 2.2: CONNECTION REUSE - reusovanie connection pre calendar queries
        const client = await this.getReusableConnection();
        try {
            console.log('🚀 PHASE 2.3 OPTIMIZED: Smart cached calendar data + connection reuse + pre-filtered CTE');
            // 🚀 FÁZA 2.1: OPTIMALIZED CTE - 31% rýchlejšie, 94% menej filtrovaných riadkov
            const result = await client.query(`
        WITH active_rentals AS (
          -- Pre-filter rentals PRED CROSS JOIN (94% redukcia filtrovaných riadkov)
          SELECT r.*
          FROM rentals r
          WHERE r.start_date <= $2 
          AND r.end_date >= $1
        ),
        active_unavailabilities AS (
          -- Pre-filter unavailabilities PRED CROSS JOIN
          SELECT u.*  
          FROM vehicle_unavailability u
          WHERE u.start_date <= $2
          AND u.end_date >= $1
        ),
        calendar_dates AS (
          SELECT generate_series($1::date, $2::date, '1 day'::interval)::date as date
        ),
        optimized_calendar AS (
          SELECT
            cd.date,
            v.id as vehicle_id,
            v.brand || ' ' || v.model as vehicle_name,
            v.license_plate,
            -- RENTALS JOIN (už pre-filtrované)
            ar.id as rental_id,
            ar.customer_name,
            ar.is_flexible,
            ar.rental_type,
            CASE
              WHEN ar.id IS NOT NULL THEN
                CASE WHEN ar.is_flexible = true THEN 'flexible' ELSE 'rented' END
              ELSE NULL
            END as rental_status,
            -- UNAVAILABILITIES JOIN (už pre-filtrované)  
            au.id as unavailability_id,
            au.reason as unavailability_reason,
            au.type as unavailability_type,
            au.priority as unavailability_priority,
            -- FINAL STATUS
            CASE
              WHEN ar.id IS NOT NULL THEN
                CASE WHEN ar.is_flexible = true THEN 'flexible' ELSE 'rented' END
              WHEN au.type IS NOT NULL THEN au.type
              ELSE 'available'
            END as final_status
          FROM calendar_dates cd
          CROSS JOIN vehicles v
          LEFT JOIN active_rentals ar ON (
            ar.vehicle_id = v.id 
            AND cd.date BETWEEN ar.start_date AND ar.end_date
          )
          LEFT JOIN active_unavailabilities au ON (
            au.vehicle_id = v.id
            AND cd.date BETWEEN au.start_date AND au.end_date
          )
        )
        SELECT
          date,
          vehicle_id,
          vehicle_name,
          license_plate,
          final_status as status,
          rental_id,
          customer_name,
          is_flexible,
          rental_type,
          unavailability_id,
          unavailability_reason,
          unavailability_type,
          unavailability_priority
        FROM optimized_calendar
        ORDER BY date, vehicle_id
      `, [startDate, endDate]);
            console.log('✅ UNIFIED QUERY: Retrieved', result.rows.length, 'calendar records');
            // 🚀 FÁZA 1.2: Pôvodná logika grupovanie podľa dátumu (funguje správne)
            const groupedByDate = result.rows.reduce((acc, row) => {
                const dateStr = row.date.toISOString().split('T')[0];
                if (!acc[dateStr]) {
                    acc[dateStr] = {
                        date: dateStr,
                        vehicles: []
                    };
                }
                acc[dateStr].vehicles.push({
                    vehicleId: row.vehicle_id,
                    vehicleName: row.vehicle_name,
                    licensePlate: row.license_plate,
                    status: row.status,
                    rentalId: row.rental_id,
                    customerName: row.customer_name,
                    isFlexible: row.is_flexible,
                    rentalType: row.rental_type || 'standard',
                    unavailabilityId: row.unavailability_id,
                    unavailabilityReason: row.unavailability_reason,
                    unavailabilityType: row.unavailability_type,
                    unavailabilityPriority: row.unavailability_priority
                });
                return acc;
            }, {});
            // Konvertovanie na array
            const calendarData = Object.values(groupedByDate);
            // 🚀 FÁZA 1.2: Pôvodná extrakcia vehicles z SQL result (FUNKČNÁ VERZIA)
            const vehicles = [...new Map(result.rows.map((row) => [
                    row.vehicle_id,
                    {
                        id: row.vehicle_id,
                        brand: row.vehicle_name.split(' ')[0],
                        model: row.vehicle_name.split(' ').slice(1).join(' '),
                        licensePlate: row.license_plate,
                        status: 'available' // Default status
                    }
                ])).values()];
            // Extrakcia nedostupností pre backward compatibility
            const unavailabilities = result.rows
                .filter((row) => row.unavailability_id)
                .map((row) => ({
                id: row.unavailability_id,
                vehicleId: row.vehicle_id,
                startDate: startDate,
                endDate: endDate,
                reason: row.unavailability_reason,
                type: row.unavailability_type,
                priority: row.unavailability_priority
            }));
            console.log('🎯 PHASE 2.3 OPTIMIZED RESULT:', {
                calendarDays: calendarData.length,
                vehiclesCount: vehicles.length,
                unavailabilitiesCount: unavailabilities.length,
                performanceGain: 'Smart cache + 31% faster CTE'
            });
            const calendarResult = {
                calendar: calendarData,
                vehicles: vehicles, // 🚀 FÁZA 1.2: Vehicles z SQL (FUNKČNÉ)
                rentals: [], // Už sú v kalendári
                unavailabilities: unavailabilities
            };
            // 🚀 FÁZA 2.3: SAVE TO CACHE - uložiť fresh data do cache
            this.calendarCache.set(cacheKey, {
                data: calendarResult,
                timestamp: Date.now(),
                dateRange: { start: startDate, end: endDate }
            });
            console.log(`✅ CALENDAR CACHED - saved ${cacheKey} to cache (TTL: 5min)`);
            return calendarResult;
        }
        catch (error) {
            // Pri chybe force release connection
            console.error('❌ Calendar query error:', error);
            this.releaseReusableConnection(true);
            throw error;
        }
        // 🚀 FÁZA 2.2: Nerelease-uj connection - ponechaj pre reuse
    }
    // Get unavailabilities for specific date range (for calendar)
    async getUnavailabilitiesForDateRange(startDate, endDate) {
        const client = await this.pool.connect();
        try {
            const result = await client.query(`
        SELECT vu.*, v.brand, v.model, v.license_plate 
        FROM vehicle_unavailability vu
        LEFT JOIN vehicles v ON vu.vehicle_id = v.id
        WHERE vu.start_date <= $2 AND vu.end_date >= $1
        ORDER BY vu.start_date ASC, v.brand ASC, v.model ASC
      `, [startDate, endDate]);
            return result.rows.map(row => ({
                id: row.id,
                vehicleId: row.vehicle_id,
                vehicle: row.brand ? {
                    brand: row.brand,
                    model: row.model,
                    licensePlate: row.license_plate
                } : undefined,
                startDate: new Date(row.start_date),
                endDate: new Date(row.end_date),
                reason: row.reason,
                type: row.type,
                notes: row.notes,
                priority: row.priority,
                recurring: row.recurring,
                recurringConfig: row.recurring_config ? JSON.parse(row.recurring_config) : undefined,
                createdAt: new Date(row.created_at),
                updatedAt: new Date(row.updated_at),
                createdBy: row.created_by
            }));
        }
        finally {
            client.release();
        }
    }
    // Metódy pre evidenciu platnosti vozidiel
    async getVehicleDocuments(vehicleId) {
        const client = await this.pool.connect();
        try {
            let query = 'SELECT * FROM vehicle_documents';
            let params = [];
            if (vehicleId) {
                query += ' WHERE vehicle_id = $1';
                params.push(vehicleId);
            }
            query += ' ORDER BY valid_to ASC';
            const result = await client.query(query, params);
            return result.rows.map(row => ({
                id: row.id?.toString() || '',
                vehicleId: row.vehicle_id?.toString() || '',
                documentType: row.document_type,
                validFrom: row.valid_from ? new Date(row.valid_from) : undefined,
                validTo: new Date(row.valid_to),
                documentNumber: row.document_number || undefined,
                price: row.price ? parseFloat(row.price) : undefined,
                notes: row.notes || undefined,
                filePath: row.file_path || undefined,
                createdAt: new Date(row.created_at),
                updatedAt: row.updated_at ? new Date(row.updated_at) : undefined
            }));
        }
        finally {
            client.release();
        }
    }
    async createVehicleDocument(documentData) {
        const client = await this.pool.connect();
        try {
            const result = await client.query(`INSERT INTO vehicle_documents (vehicle_id, document_type, valid_from, valid_to, document_number, price, notes, file_path) 
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8) 
         RETURNING id, vehicle_id, document_type, valid_from, valid_to, document_number, price, notes, file_path, created_at`, [documentData.vehicleId, documentData.documentType, documentData.validFrom, documentData.validTo, documentData.documentNumber, documentData.price, documentData.notes, documentData.filePath || null]);
            const row = result.rows[0];
            return {
                id: row.id.toString(),
                vehicleId: row.vehicle_id,
                documentType: row.document_type,
                validFrom: row.valid_from ? new Date(row.valid_from) : undefined,
                validTo: new Date(row.valid_to),
                documentNumber: row.document_number || undefined,
                price: row.price ? parseFloat(row.price) : undefined,
                notes: row.notes || undefined,
                filePath: row.file_path || undefined,
                createdAt: new Date(row.created_at),
                updatedAt: undefined
            };
        }
        finally {
            client.release();
        }
    }
    async updateVehicleDocument(id, documentData) {
        const client = await this.pool.connect();
        try {
            const result = await client.query(`UPDATE vehicle_documents 
         SET vehicle_id = $1, document_type = $2, valid_from = $3, valid_to = $4, document_number = $5, price = $6, notes = $7, file_path = $8, updated_at = CURRENT_TIMESTAMP 
         WHERE id = $9 
         RETURNING id, vehicle_id, document_type, valid_from, valid_to, document_number, price, notes, file_path, created_at, updated_at`, [documentData.vehicleId, documentData.documentType, documentData.validFrom, documentData.validTo, documentData.documentNumber, documentData.price, documentData.notes, documentData.filePath || null, id]);
            if (result.rows.length === 0) {
                throw new Error('Dokument nebol nájdený');
            }
            const row = result.rows[0];
            return {
                id: row.id.toString(),
                vehicleId: row.vehicle_id,
                documentType: row.document_type,
                validFrom: row.valid_from ? new Date(row.valid_from) : undefined,
                validTo: new Date(row.valid_to),
                documentNumber: row.document_number || undefined,
                price: row.price ? parseFloat(row.price) : undefined,
                notes: row.notes || undefined,
                filePath: row.file_path || undefined,
                createdAt: new Date(row.created_at),
                updatedAt: row.updated_at ? new Date(row.updated_at) : undefined
            };
        }
        finally {
            client.release();
        }
    }
    async deleteVehicleDocument(id) {
        const client = await this.pool.connect();
        try {
            await client.query('DELETE FROM vehicle_documents WHERE id = $1', [id]);
        }
        finally {
            client.release();
        }
    }
    // Metódy pre poistné udalosti
    async getInsuranceClaims(vehicleId) {
        const client = await this.pool.connect();
        try {
            let query = 'SELECT * FROM insurance_claims';
            let params = [];
            if (vehicleId) {
                query += ' WHERE vehicle_id = $1';
                params.push(vehicleId);
            }
            query += ' ORDER BY incident_date DESC';
            const result = await client.query(query, params);
            return result.rows.map(row => ({
                id: row.id?.toString() || '',
                vehicleId: row.vehicle_id?.toString() || '',
                insuranceId: row.insurance_id?.toString() || undefined,
                incidentDate: new Date(row.incident_date),
                reportedDate: new Date(row.reported_date),
                claimNumber: row.claim_number || undefined,
                description: row.description,
                location: row.location || undefined,
                incidentType: row.incident_type,
                estimatedDamage: row.estimated_damage ? parseFloat(row.estimated_damage) : undefined,
                deductible: row.deductible ? parseFloat(row.deductible) : undefined,
                payoutAmount: row.payout_amount ? parseFloat(row.payout_amount) : undefined,
                status: row.status,
                filePaths: row.file_paths || [],
                policeReportNumber: row.police_report_number || undefined,
                otherPartyInfo: row.other_party_info || undefined,
                notes: row.notes || undefined,
                createdAt: new Date(row.created_at),
                updatedAt: row.updated_at ? new Date(row.updated_at) : undefined
            }));
        }
        finally {
            client.release();
        }
    }
    async createInsuranceClaim(claimData) {
        const client = await this.pool.connect();
        try {
            const result = await client.query(`INSERT INTO insurance_claims (vehicle_id, insurance_id, incident_date, description, location, incident_type, estimated_damage, deductible, payout_amount, status, claim_number, file_paths, police_report_number, other_party_info, notes) 
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15) 
         RETURNING id, vehicle_id, insurance_id, incident_date, reported_date, claim_number, description, location, incident_type, estimated_damage, deductible, payout_amount, status, file_paths, police_report_number, other_party_info, notes, created_at`, [
                claimData.vehicleId,
                claimData.insuranceId || null,
                claimData.incidentDate,
                claimData.description,
                claimData.location || null,
                claimData.incidentType,
                claimData.estimatedDamage || null,
                claimData.deductible || null,
                claimData.payoutAmount || null,
                claimData.status || 'reported',
                claimData.claimNumber || null,
                claimData.filePaths || [],
                claimData.policeReportNumber || null,
                claimData.otherPartyInfo || null,
                claimData.notes || null
            ]);
            const row = result.rows[0];
            return {
                id: row.id.toString(),
                vehicleId: row.vehicle_id,
                insuranceId: row.insurance_id?.toString() || undefined,
                incidentDate: new Date(row.incident_date),
                reportedDate: new Date(row.reported_date),
                claimNumber: row.claim_number || undefined,
                description: row.description,
                location: row.location || undefined,
                incidentType: row.incident_type,
                estimatedDamage: row.estimated_damage ? parseFloat(row.estimated_damage) : undefined,
                deductible: row.deductible ? parseFloat(row.deductible) : undefined,
                payoutAmount: row.payout_amount ? parseFloat(row.payout_amount) : undefined,
                status: row.status,
                filePaths: row.file_paths || [],
                policeReportNumber: row.police_report_number || undefined,
                otherPartyInfo: row.other_party_info || undefined,
                notes: row.notes || undefined,
                createdAt: new Date(row.created_at),
                updatedAt: undefined
            };
        }
        finally {
            client.release();
        }
    }
    async updateInsuranceClaim(id, claimData) {
        const client = await this.pool.connect();
        try {
            const result = await client.query(`UPDATE insurance_claims 
         SET vehicle_id = $1, insurance_id = $2, incident_date = $3, description = $4, location = $5, incident_type = $6, estimated_damage = $7, deductible = $8, payout_amount = $9, status = $10, claim_number = $11, file_paths = $12, police_report_number = $13, other_party_info = $14, notes = $15, updated_at = CURRENT_TIMESTAMP 
         WHERE id = $16 
         RETURNING id, vehicle_id, insurance_id, incident_date, reported_date, claim_number, description, location, incident_type, estimated_damage, deductible, payout_amount, status, file_paths, police_report_number, other_party_info, notes, created_at, updated_at`, [
                claimData.vehicleId,
                claimData.insuranceId || null,
                claimData.incidentDate,
                claimData.description,
                claimData.location || null,
                claimData.incidentType,
                claimData.estimatedDamage || null,
                claimData.deductible || null,
                claimData.payoutAmount || null,
                claimData.status || 'reported',
                claimData.claimNumber || null,
                claimData.filePaths || [],
                claimData.policeReportNumber || null,
                claimData.otherPartyInfo || null,
                claimData.notes || null,
                id
            ]);
            if (result.rows.length === 0) {
                throw new Error('Poistná udalosť nebola nájdená');
            }
            const row = result.rows[0];
            return {
                id: row.id.toString(),
                vehicleId: row.vehicle_id,
                insuranceId: row.insurance_id?.toString() || undefined,
                incidentDate: new Date(row.incident_date),
                reportedDate: new Date(row.reported_date),
                claimNumber: row.claim_number || undefined,
                description: row.description,
                location: row.location || undefined,
                incidentType: row.incident_type,
                estimatedDamage: row.estimated_damage ? parseFloat(row.estimated_damage) : undefined,
                deductible: row.deductible ? parseFloat(row.deductible) : undefined,
                payoutAmount: row.payout_amount ? parseFloat(row.payout_amount) : undefined,
                status: row.status,
                filePaths: row.file_paths || [],
                policeReportNumber: row.police_report_number || undefined,
                otherPartyInfo: row.other_party_info || undefined,
                notes: row.notes || undefined,
                createdAt: new Date(row.created_at),
                updatedAt: row.updated_at ? new Date(row.updated_at) : undefined
            };
        }
        finally {
            client.release();
        }
    }
    async deleteInsuranceClaim(id) {
        const client = await this.pool.connect();
        try {
            await client.query('DELETE FROM insurance_claims WHERE id = $1', [id]);
        }
        finally {
            client.release();
        }
    }
    // 🔧 ADMIN UTILITY - Assign vehicles to company
    async assignVehiclesToCompany(vehicleIds, companyId) {
        const client = await this.pool.connect();
        try {
            for (const vehicleId of vehicleIds) {
                await client.query('UPDATE vehicles SET owner_company_id = $1 WHERE id = $2', [companyId, vehicleId]);
            }
        }
        finally {
            client.release();
        }
    }
    // Nové metódy pre správu práv používateľov
    async getUserPermissions(userId) {
        const client = await this.pool.connect();
        try {
            const result = await client.query(`
        SELECT up.*, c.name as company_name
        FROM user_permissions up
        JOIN companies c ON up.company_id = c.id
        WHERE up.user_id = $1
        ORDER BY c.name
      `, [userId]);
            return result.rows.map(row => ({
                id: row.id,
                userId: row.user_id,
                companyId: row.company_id,
                permissions: row.permissions,
                createdAt: new Date(row.created_at),
                updatedAt: row.updated_at ? new Date(row.updated_at) : undefined
            }));
        }
        finally {
            client.release();
        }
    }
    async getUserCompanyAccess(userId) {
        // ⚡ CACHE CHECK: Skontroluj cache najprv
        const cacheKey = `permissions:${userId}`;
        const cached = this.permissionCache.get(cacheKey);
        if (cached) {
            const now = Date.now();
            const isValid = (now - cached.timestamp) < this.PERMISSION_CACHE_TTL;
            if (isValid) {
                console.log('⚡ getUserCompanyAccess CACHE HIT for userId:', userId, '(saved SQL query)');
                return cached.data;
            }
            else {
                // Cache expired, remove it
                this.permissionCache.delete(cacheKey);
                console.log('🕒 getUserCompanyAccess cache EXPIRED for userId:', userId);
            }
        }
        // ⚡ CACHE MISS: Load from database
        const client = await this.pool.connect();
        try {
            console.log('🔍 getUserCompanyAccess CACHE MISS - loading from DB for userId:', userId);
            const result = await client.query(`
        SELECT up.company_id, c.name as company_name, up.permissions
        FROM user_permissions up
        JOIN companies c ON up.company_id = c.id
        WHERE up.user_id = $1
        ORDER BY c.name
        `, [userId]);
            const data = result.rows.map(row => ({
                companyId: row.company_id,
                companyName: row.company_name,
                permissions: row.permissions
            }));
            // ⚡ CACHE STORE: Ulož do cache
            this.permissionCache.set(cacheKey, {
                data: data,
                timestamp: Date.now()
            });
            console.log('⚡ getUserCompanyAccess CACHED for userId:', userId, {
                rowCount: result.rows.length,
                companies: result.rows.map(r => ({ companyId: r.company_id, companyName: r.company_name }))
            });
            return data;
        }
        finally {
            client.release();
        }
    }
    async setUserPermission(userId, companyId, permissions) {
        const client = await this.pool.connect();
        try {
            await client.query(`
        INSERT INTO user_permissions (user_id, company_id, permissions)
        VALUES ($1, $2, $3)
        ON CONFLICT (user_id, company_id)
        DO UPDATE SET 
          permissions = $3,
          updated_at = CURRENT_TIMESTAMP
      `, [userId, companyId, JSON.stringify(permissions)]);
            // ⚡ CACHE INVALIDATION: Vymaž cache pre tohoto používateľa
            const cacheKey = `permissions:${userId}`;
            this.permissionCache.delete(cacheKey);
            console.log('🧹 Permission cache INVALIDATED for userId:', userId);
        }
        finally {
            client.release();
        }
    }
    async removeUserPermission(userId, companyId) {
        const client = await this.pool.connect();
        try {
            await client.query(`
        DELETE FROM user_permissions 
        WHERE user_id = $1 AND company_id = $2
      `, [userId, companyId]);
            // ⚡ CACHE INVALIDATION: Vymaž cache pre tohoto používateľa
            this.clearPermissionCache(userId);
        }
        finally {
            client.release();
        }
    }
    async hasPermission(userId, companyId, resource, action) {
        const client = await this.pool.connect();
        try {
            const result = await client.query(`
        SELECT permissions->$3->$4 as permission
        FROM user_permissions
        WHERE user_id = $1 AND company_id = $2
      `, [userId, companyId, resource, action]);
            if (result.rows.length === 0)
                return false;
            const permission = result.rows[0].permission;
            return permission === true;
        }
        finally {
            client.release();
        }
    }
    async getUsersWithCompanyAccess(companyId) {
        const client = await this.pool.connect();
        try {
            const result = await client.query(`
        SELECT up.user_id, u.username, up.permissions
        FROM user_permissions up
        JOIN users u ON up.user_id = u.id
        WHERE up.company_id = $1
        ORDER BY u.username
      `, [companyId]);
            return result.rows.map(row => ({
                userId: row.user_id,
                username: row.username,
                permissions: row.permissions
            }));
        }
        finally {
            client.release();
        }
    }
    // 🗑️ ADMIN FUNCTIONS
    async resetDatabase() {
        const client = await this.pool.connect();
        try {
            // Vypnúť foreign key constraints
            await client.query('SET session_replication_role = replica');
            // Zmazať všetky tabuľky
            const tables = [
                'settlements',
                'user_permissions',
                'insurance_claims',
                'insurances',
                'expenses',
                'rentals',
                'customers',
                'vehicles',
                'users',
                'companies',
                'insurers'
            ];
            for (const table of tables) {
                await client.query(`DROP TABLE IF EXISTS ${table} CASCADE`);
                console.log(`🗑️ Dropped table: ${table}`);
            }
            // Zapnúť foreign key constraints
            await client.query('SET session_replication_role = DEFAULT');
            return tables.length;
        }
        finally {
            client.release();
        }
    }
    // 🔄 COMPANY MAPPING FUNCTIONS
    async getCompanyIdByName(companyName) {
        const client = await this.pool.connect();
        try {
            // 1. Skús najprv presný názov
            const exactResult = await client.query('SELECT id FROM companies WHERE name = $1', [companyName]);
            if (exactResult.rows.length > 0) {
                const companyId = exactResult.rows[0].id; // UUID as string, not parseInt
                console.log(`✅ Company found (exact): "${companyName}" ID: ${companyId}`);
                return companyId;
            }
            // 2. Ak nenájdem presný názov, vytvor novú firmu
            console.log(`⚠️ Company "${companyName}" not found, creating new one...`);
            const insertResult = await client.query('INSERT INTO companies (name) VALUES ($1) RETURNING id', [companyName]);
            const newCompanyId = insertResult.rows[0].id; // UUID as string, not parseInt
            console.log(`✅ Company created: "${companyName}" ID: ${newCompanyId}`);
            return newCompanyId;
        }
        catch (error) {
            console.error(`❌ Error getting/creating company "${companyName}":`, error);
            return null;
        }
        finally {
            client.release();
        }
    }
    async getCompanyNameById(companyId) {
        const client = await this.pool.connect();
        try {
            const result = await client.query('SELECT name FROM companies WHERE id = $1', [companyId]);
            return result.rows.length > 0 ? result.rows[0].name : null;
        }
        finally {
            client.release();
        }
    }
    async getAllCompanies() {
        const client = await this.pool.connect();
        try {
            const result = await client.query('SELECT id, name FROM companies ORDER BY name');
            return result.rows.map(row => ({
                id: row.id,
                name: row.name
            }));
        }
        finally {
            client.release();
        }
    }
    // 🏗️ VEHICLE OWNERSHIP HISTORY FUNCTIONS
    // Získanie aktuálneho vlastníka vozidla
    async getCurrentVehicleOwner(vehicleId) {
        const client = await this.pool.connect();
        try {
            const result = await client.query(`
        SELECT owner_company_id, owner_company_name
        FROM vehicle_ownership_history
        WHERE vehicle_id = $1 AND valid_to IS NULL
        ORDER BY valid_from DESC
        LIMIT 1
      `, [vehicleId]);
            if (result.rows.length === 0) {
                return null;
            }
            return {
                ownerCompanyId: result.rows[0].owner_company_id,
                ownerCompanyName: result.rows[0].owner_company_name
            };
        }
        finally {
            client.release();
        }
    }
    // Získanie vlastníka vozidla v konkrétnom čase
    async getVehicleOwnerAtTime(vehicleId, timestamp) {
        const client = await this.pool.connect();
        try {
            const result = await client.query(`
        SELECT owner_company_id, owner_company_name
        FROM vehicle_ownership_history
        WHERE vehicle_id = $1 
          AND valid_from <= $2
          AND (valid_to IS NULL OR valid_to > $2)
        ORDER BY valid_from DESC
        LIMIT 1
      `, [vehicleId, timestamp]);
            if (result.rows.length === 0) {
                return null;
            }
            return {
                ownerCompanyId: result.rows[0].owner_company_id,
                ownerCompanyName: result.rows[0].owner_company_name
            };
        }
        finally {
            client.release();
        }
    }
    // Získanie histórie vlastníctva vozidla
    async getVehicleOwnershipHistory(vehicleId) {
        const client = await this.pool.connect();
        try {
            const result = await client.query(`
        SELECT 
          id,
          owner_company_id,
          owner_company_name,
          valid_from,
          valid_to,
          transfer_reason,
          transfer_notes
        FROM vehicle_ownership_history
        WHERE vehicle_id = $1
        ORDER BY valid_from DESC
      `, [vehicleId]);
            return result.rows.map(row => ({
                id: row.id,
                ownerCompanyId: row.owner_company_id,
                ownerCompanyName: row.owner_company_name,
                validFrom: row.valid_from,
                validTo: row.valid_to,
                transferReason: row.transfer_reason,
                transferNotes: row.transfer_notes
            }));
        }
        finally {
            client.release();
        }
    }
    // Transfer vlastníctva vozidla
    async transferVehicleOwnership(vehicleId, newOwnerCompanyId, transferReason = 'manual_transfer', transferNotes = null, transferDate = new Date()) {
        const client = await this.pool.connect();
        try {
            await client.query('BEGIN');
            // 1. Získaj názov novej firmy
            const companyResult = await client.query(`
        SELECT name FROM companies WHERE id = $1
      `, [newOwnerCompanyId]);
            if (companyResult.rows.length === 0) {
                throw new Error(`Company with ID ${newOwnerCompanyId} not found`);
            }
            const newOwnerCompanyName = companyResult.rows[0].name;
            // 2. OPRAVA: Skontroluj či existuje ownership historia pre toto vozidlo
            const existingHistoryResult = await client.query(`
        SELECT COUNT(*) as count FROM vehicle_ownership_history WHERE vehicle_id = $1
      `, [vehicleId]);
            const hasHistory = parseInt(existingHistoryResult.rows[0].count) > 0;
            // 3. OPRAVA: Ak neexistuje historia, vytvor počiatočný záznam pre aktuálneho majiteľa
            if (!hasHistory) {
                console.log(`🔄 Creating initial ownership record for vehicle ${vehicleId}`);
                // Získaj aktuálneho majiteľa z vehicles tabuľky
                const vehicleResult = await client.query(`
          SELECT owner_company_id, company, created_at FROM vehicles WHERE id = $1
        `, [vehicleId]);
                if (vehicleResult.rows.length === 0) {
                    throw new Error(`Vehicle with ID ${vehicleId} not found`);
                }
                const currentOwner = vehicleResult.rows[0];
                const currentOwnerCompanyId = currentOwner.owner_company_id;
                const currentOwnerCompanyName = currentOwner.company;
                // OPRAVA: Použij veľmi starý dátum pre initial ownership, nie created_at
                const vehicleCreatedAt = new Date('2024-01-01'); // Safe past date for initial ownership
                // Vytvor počiatočný ownership záznam pre súčasného majiteľa
                await client.query(`
          INSERT INTO vehicle_ownership_history (
            vehicle_id, 
            owner_company_id, 
            owner_company_name,
            valid_from, 
            transfer_reason, 
            transfer_notes
          ) VALUES ($1, $2, $3, $4, $5, $6)
        `, [vehicleId, currentOwnerCompanyId, currentOwnerCompanyName, vehicleCreatedAt, 'initial_setup', 'Initial ownership record created during transfer']);
                console.log(`✅ Created initial ownership record for ${currentOwnerCompanyName} from ${vehicleCreatedAt.toISOString()}`);
            }
            // 4. Ukončí súčasné vlastníctvo (teraz určite existuje záznam)
            const updateResult = await client.query(`
        UPDATE vehicle_ownership_history 
        SET valid_to = $1, updated_at = CURRENT_TIMESTAMP
        WHERE vehicle_id = $2 AND valid_to IS NULL
      `, [transferDate, vehicleId]);
            console.log(`🔄 Ended current ownership for vehicle ${vehicleId}, affected rows: ${updateResult.rowCount}`);
            // 5. Vytvor nový ownership záznam
            await client.query(`
        INSERT INTO vehicle_ownership_history (
          vehicle_id, 
          owner_company_id, 
          owner_company_name,
          valid_from, 
          transfer_reason, 
          transfer_notes
        ) VALUES ($1, $2, $3, $4, $5, $6)
      `, [vehicleId, newOwnerCompanyId, newOwnerCompanyName, transferDate, transferReason, transferNotes]);
            console.log(`✅ Created new ownership record for ${newOwnerCompanyName} from ${transferDate.toISOString()}`);
            // 6. Aktualizuj vehicles tabuľku pre súčasný stav (oba stĺpce!)
            await client.query(`
        UPDATE vehicles 
        SET owner_company_id = $1, company = $2, updated_at = CURRENT_TIMESTAMP
        WHERE id = $3
      `, [newOwnerCompanyId, newOwnerCompanyName, vehicleId]);
            await client.query('COMMIT');
            return true;
        }
        catch (error) {
            await client.query('ROLLBACK');
            console.error('Transfer ownership error:', error);
            throw error;
        }
        finally {
            client.release();
        }
    }
    // Získanie vozidiel firmy v konkrétnom čase
    async getCompanyVehiclesAtTime(companyId, timestamp) {
        const client = await this.pool.connect();
        try {
            const result = await client.query(`
        SELECT DISTINCT v.*
        FROM vehicles v
        JOIN vehicle_ownership_history voh ON v.id = voh.vehicle_id
        WHERE voh.owner_company_id = $1
          AND voh.valid_from <= $2
          AND (voh.valid_to IS NULL OR voh.valid_to > $2)
        ORDER BY v.brand, v.model, v.license_plate
      `, [companyId, timestamp]);
            return result.rows.map(row => ({
                id: row.id,
                brand: row.brand,
                model: row.model,
                year: row.year,
                licensePlate: row.license_plate,
                company: row.company,
                ownerCompanyId: row.owner_company_id?.toString(),
                pricing: row.pricing,
                commission: row.commission,
                status: row.status,
                stk: row.stk,
                createdAt: row.created_at,
                updatedAt: row.updated_at
            }));
        }
        finally {
            client.release();
        }
    }
    // ====================================
    // 🛡️ RENTAL DATA PROTECTION SYSTEM 🛡️
    // ====================================
    // Ochrana Level 1: Validácia pred UPDATE
    async validateRentalUpdate(id, newData) {
        const errors = [];
        // Skontroluj či prenájom existuje
        const existing = await this.getRental(id);
        if (!existing) {
            errors.push(`Rental ${id} does not exist`);
            return { valid: false, errors };
        }
        // Ochrana critical fields
        const criticalFields = ['customerName', 'startDate', 'endDate'];
        for (const field of criticalFields) {
            if (field in newData && !newData[field]) {
                errors.push(`Critical field ${field} cannot be empty`);
            }
        }
        // Validácia dátumov
        if (newData.startDate && newData.endDate) {
            if (new Date(newData.startDate) >= new Date(newData.endDate)) {
                errors.push('Start date must be before end date');
            }
        }
        // Log každý update pokus
        console.log(`🛡️ RENTAL UPDATE VALIDATION: ${id}`, {
            existingCustomer: existing.customerName,
            newCustomer: newData.customerName,
            vehicleId: newData.vehicleId,
            validationErrors: errors.length
        });
        return { valid: errors.length === 0, errors };
    }
    // Ochrana Level 2: Backup before UPDATE
    async createRentalBackup(id) {
        const client = await this.pool.connect();
        try {
            // Create backup table if not exists
            await client.query(`
        CREATE TABLE IF NOT EXISTS rental_backups (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          original_rental_id UUID NOT NULL,
          backup_data JSONB NOT NULL,
          backup_timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          backup_reason VARCHAR(100) DEFAULT 'pre_update'
        )
      `);
            // Get current rental data
            const rental = await this.getRental(id);
            if (rental) {
                await client.query(`
          INSERT INTO rental_backups (original_rental_id, backup_data, backup_reason)
          VALUES ($1, $2, $3)
        `, [id, JSON.stringify(rental), 'pre_update']);
                console.log(`✅ RENTAL BACKUP created for ${id}`);
            }
        }
        catch (error) {
            console.error(`❌ RENTAL BACKUP failed for ${id}:`, error);
        }
        finally {
            client.release();
        }
    }
    // 🛡️ OCHRANA LEVEL 7: Recovery function pre obnovenie dát
    async recoverRentalFromBackup(rentalId, backupId) {
        const client = await this.pool.connect();
        try {
            // Nájdi najnovší backup alebo konkrétny backup
            const backupQuery = backupId
                ? 'SELECT * FROM rental_backups WHERE id = $1'
                : 'SELECT * FROM rental_backups WHERE original_rental_id = $1 ORDER BY backup_timestamp DESC LIMIT 1';
            const backupResult = await client.query(backupQuery, [backupId || rentalId]);
            if (backupResult.rows.length === 0) {
                console.error(`❌ No backup found for rental ${rentalId}`);
                return null;
            }
            const backup = backupResult.rows[0];
            const rentalData = backup.backup_data;
            console.log(`🔄 RECOVERING RENTAL: ${rentalId} from backup ${backup.id}`);
            console.log(`   Backup timestamp: ${backup.backup_timestamp}`);
            console.log(`   Customer: ${rentalData.customerName}`);
            // Restore rental from backup
            await this.updateRental(rentalData);
            console.log(`✅ RENTAL RECOVERED: ${rentalId}`);
            return rentalData;
        }
        catch (error) {
            console.error(`❌ RENTAL RECOVERY FAILED for ${rentalId}:`, error);
            throw error;
        }
        finally {
            client.release();
        }
    }
    // 🛡️ OCHRANA LEVEL 8: Monitoring rental integrity  
    async checkRentalIntegrity() {
        const client = await this.pool.connect();
        try {
            const issues = [];
            // Count total rentals
            const totalResult = await client.query('SELECT COUNT(*) as count FROM rentals');
            const totalRentals = parseInt(totalResult.rows[0].count);
            // Count rentals with missing vehicles
            const missingVehiclesResult = await client.query(`
        SELECT COUNT(*) as count FROM rentals r 
        WHERE r.vehicle_id IS NOT NULL 
        AND r.vehicle_id NOT IN (SELECT id FROM vehicles)
      `);
            const missingVehicles = parseInt(missingVehiclesResult.rows[0].count);
            // Count rentals with missing customers (using customer_name since customer_id doesn't exist)
            const missingCustomersResult = await client.query(`
        SELECT COUNT(*) as count FROM rentals r
        WHERE r.customer_name IS NULL OR r.customer_name = ''
      `);
            const missingCustomers = parseInt(missingCustomersResult.rows[0].count);
            // Count rentals with invalid dates
            const invalidDatesResult = await client.query(`
        SELECT COUNT(*) as count FROM rentals 
        WHERE start_date >= end_date OR start_date IS NULL OR end_date IS NULL
      `);
            const invalidDates = parseInt(invalidDatesResult.rows[0].count);
            // Count available backups
            const backupsResult = await client.query('SELECT COUNT(*) as count FROM rental_backups');
            const backupsAvailable = parseInt(backupsResult.rows[0].count);
            // Identify issues
            if (missingVehicles > 0)
                issues.push(`${missingVehicles} rentals have invalid vehicle_id`);
            if (missingCustomers > 0)
                issues.push(`${missingCustomers} rentals have invalid customer_id`);
            if (invalidDates > 0)
                issues.push(`${invalidDates} rentals have invalid dates`);
            const report = {
                totalRentals,
                missingVehicles,
                missingCustomers,
                invalidDates,
                backupsAvailable,
                issues
            };
            console.log('🛡️ RENTAL INTEGRITY CHECK:', report);
            return report;
        }
        finally {
            client.release();
        }
    }
    // Získanie majiteľa vozidla k určitému dátumu
    async getVehicleOwnerAtDate(vehicleId, date) {
        const client = await this.pool.connect();
        try {
            const result = await client.query(`
        SELECT 
          owner_company_id,
          owner_company_name
        FROM vehicle_ownership_history
        WHERE vehicle_id = $1
          AND valid_from <= $2
          AND (valid_to IS NULL OR valid_to > $2)
        ORDER BY valid_from DESC
        LIMIT 1
      `, [vehicleId, date]);
            if (result.rows.length === 0) {
                return null;
            }
            const row = result.rows[0];
            return {
                ownerCompanyId: row.owner_company_id,
                ownerCompanyName: row.owner_company_name
            };
        }
        finally {
            client.release();
        }
    }
    // 📝 Úprava transferu vlastníctva
    async updateVehicleOwnershipHistory(historyId, updates) {
        const client = await this.pool.connect();
        try {
            // Najprv získaj informácie o firme
            const companyResult = await client.query('SELECT name FROM companies WHERE id = $1', [updates.ownerCompanyId]);
            if (companyResult.rows.length === 0) {
                throw new Error(`Company with ID ${updates.ownerCompanyId} not found`);
            }
            const companyName = companyResult.rows[0].name;
            // Aktualizuj ownership history
            const result = await client.query(`
        UPDATE vehicle_ownership_history 
        SET 
          owner_company_id = $1,
          owner_company_name = $2,
          transfer_reason = $3,
          transfer_notes = $4,
          valid_from = $5,
          updated_at = CURRENT_TIMESTAMP
        WHERE id = $6
      `, [
                updates.ownerCompanyId,
                companyName,
                updates.transferReason,
                updates.transferNotes || null,
                updates.validFrom,
                historyId
            ]);
            if (result.rowCount === 0) {
                throw new Error(`Ownership history record ${historyId} not found`);
            }
            console.log(`✅ Updated ownership history ${historyId}`);
        }
        finally {
            client.release();
        }
    }
    // 🔍 Overenie existencie ownership history záznamu
    async checkOwnershipHistoryExists(historyId) {
        const client = await this.pool.connect();
        try {
            const result = await client.query('SELECT 1 FROM vehicle_ownership_history WHERE id = $1', [historyId]);
            return result.rows.length > 0;
        }
        finally {
            client.release();
        }
    }
    // 🗑️ Vymazanie transferu vlastníctva
    async deleteVehicleOwnershipHistory(historyId) {
        const client = await this.pool.connect();
        try {
            const result = await client.query('DELETE FROM vehicle_ownership_history WHERE id = $1', [historyId]);
            if (result.rowCount === 0) {
                throw new Error(`Ownership history record ${historyId} not found`);
            }
            console.log(`✅ Deleted ownership history ${historyId}`);
        }
        finally {
            client.release();
        }
    }
    // ⚡ BULK OWNERSHIP CHECKING - pre rýchle filtrovanie rentals/settlements
    async getBulkVehicleOwnersAtTime(vehicleTimeChecks) {
        const client = await this.pool.connect();
        try {
            console.log(`🚀 BULK: Checking ownership for ${vehicleTimeChecks.length} vehicle-time pairs...`);
            const startTime = Date.now();
            // Build complex query for all checks at once
            const queries = vehicleTimeChecks.map((check, index) => `
        (
          SELECT 
            '${check.vehicleId}' as vehicle_id,
            '${check.timestamp.toISOString()}' as check_timestamp,
            owner_company_id,
            owner_company_name
          FROM vehicle_ownership_history
          WHERE vehicle_id = $${index * 2 + 1}
            AND valid_from <= $${index * 2 + 2}
            AND (valid_to IS NULL OR valid_to > $${index * 2 + 2})
          ORDER BY valid_from DESC
          LIMIT 1
        )`).join(' UNION ALL ');
            // Flatten parameters
            const params = vehicleTimeChecks.flatMap(check => [check.vehicleId, check.timestamp]);
            const result = await client.query(queries, params);
            // Process results back to original format
            const ownershipMap = new Map();
            result.rows.forEach(row => {
                const key = `${row.vehicle_id}-${row.check_timestamp}`;
                ownershipMap.set(key, {
                    ownerCompanyId: row.owner_company_id,
                    ownerCompanyName: row.owner_company_name
                });
            });
            const results = vehicleTimeChecks.map(check => {
                const key = `${check.vehicleId}-${check.timestamp.toISOString()}`;
                return {
                    vehicleId: check.vehicleId,
                    timestamp: check.timestamp,
                    owner: ownershipMap.get(key) || null
                };
            });
            const loadTime = Date.now() - startTime;
            console.log(`✅ BULK: Checked ${vehicleTimeChecks.length} ownership records in ${loadTime}ms`);
            return results;
        }
        finally {
            client.release();
        }
    }
    // ⚡ BULK CURRENT OWNERSHIP - pre rýchle získanie súčasných vlastníkov
    async getBulkCurrentVehicleOwners(vehicleIds) {
        const client = await this.pool.connect();
        try {
            console.log(`🚀 BULK: Getting current owners for ${vehicleIds.length} vehicles...`);
            const startTime = Date.now();
            if (vehicleIds.length === 0)
                return [];
            // Single query to get all current owners
            const result = await client.query(`
        SELECT DISTINCT ON (vehicle_id) 
          vehicle_id,
          owner_company_id,
          owner_company_name
        FROM vehicle_ownership_history
        WHERE vehicle_id = ANY($1)
          AND valid_to IS NULL
        ORDER BY vehicle_id, valid_from DESC
      `, [vehicleIds]);
            // Map results
            const ownershipMap = new Map();
            result.rows.forEach(row => {
                ownershipMap.set(row.vehicle_id, {
                    ownerCompanyId: row.owner_company_id,
                    ownerCompanyName: row.owner_company_name
                });
            });
            const results = vehicleIds.map(vehicleId => ({
                vehicleId,
                owner: ownershipMap.get(vehicleId) || null
            }));
            const loadTime = Date.now() - startTime;
            console.log(`✅ BULK: Got current owners for ${vehicleIds.length} vehicles in ${loadTime}ms`);
            return results;
        }
        finally {
            client.release();
        }
    }
    // ⚡ CACHE HELPER METHODS
    clearPermissionCache(userId) {
        const cacheKey = `permissions:${userId}`;
        this.permissionCache.delete(cacheKey);
        console.log('🧹 Permission cache CLEARED for userId:', userId);
    }
    clearAllPermissionCache() {
        this.permissionCache.clear();
        console.log('🧹 ALL permission cache CLEARED');
    }
    // ⚡ BULK PROTOCOL STATUS - Získa protocol status pre všetky rentals naraz
    async getBulkProtocolStatus() {
        const client = await this.pool.connect();
        try {
            console.log('🚀 BULK: Loading protocol status for all rentals...');
            const startTime = Date.now();
            // Ensure protocol tables exist
            await this.initProtocolTables();
            // Direct query using protocol IDs from rentals table (more efficient)
            const result = await client.query(`
        SELECT 
          r.id as rental_id,
          r.handover_protocol_id,
          r.return_protocol_id,
          hp.created_at as handover_created_at,
          rp.created_at as return_created_at
        FROM rentals r
        LEFT JOIN handover_protocols hp ON r.handover_protocol_id = hp.id
        LEFT JOIN return_protocols rp ON r.return_protocol_id = rp.id
        ORDER BY r.created_at DESC
      `);
            const protocolStatus = result.rows.map(row => ({
                rentalId: row.rental_id,
                hasHandoverProtocol: !!row.handover_protocol_id,
                hasReturnProtocol: !!row.return_protocol_id,
                handoverProtocolId: row.handover_protocol_id || undefined,
                returnProtocolId: row.return_protocol_id || undefined,
                handoverCreatedAt: row.handover_created_at ? new Date(row.handover_created_at) : undefined,
                returnCreatedAt: row.return_created_at ? new Date(row.return_created_at) : undefined
            }));
            const loadTime = Date.now() - startTime;
            console.log(`✅ BULK: Protocol status loaded for ${protocolStatus.length} rentals in ${loadTime}ms`);
            return protocolStatus;
        }
        catch (error) {
            console.error('❌ Error fetching bulk protocol status:', error);
            throw error;
        }
        finally {
            client.release();
        }
    }
}
exports.PostgresDatabase = PostgresDatabase;
exports.postgresDatabase = new PostgresDatabase();
//# sourceMappingURL=postgres-database.js.map