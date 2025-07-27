import { Pool, PoolClient } from 'pg';
import { Vehicle, Customer, Rental, Expense, Insurance, User, Company, Insurer, Settlement, VehicleDocument, InsuranceClaim, UserPermission, UserCompanyAccess, CompanyPermissions } from '../types';
import bcrypt from 'bcryptjs';
import { r2Storage } from '../utils/r2-storage';

export class PostgresDatabase {
  private pool: Pool;

  constructor() {
    // Railway.app provides DATABASE_URL
    if (process.env.DATABASE_URL) {
      this.pool = new Pool({
        connectionString: process.env.DATABASE_URL,
        ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
        // OPTIMALIZÁCIA: Lepšie connection pooling pre availability API
        max: 25, // Zvýšené z 20 na 25
        idleTimeoutMillis: 60000, // Zvýšené z 30s na 60s
        connectionTimeoutMillis: 5000, // Znížené z 10s na 5s
        allowExitOnIdle: true, // Povolenie exit na idle
      });
    } else {
      // Local development or manual config
    this.pool = new Pool({
      user: process.env.DB_USER || 'postgres',
      host: process.env.DB_HOST || 'localhost',
      database: process.env.DB_NAME || 'blackrent',
      password: process.env.DB_PASSWORD || 'password',
      port: parseInt(process.env.DB_PORT || '5432'),
      // OPTIMALIZÁCIA: Lepšie connection pooling pre availability API
      max: 25, // Zvýšené z 20 na 25
      idleTimeoutMillis: 60000, // Zvýšené z 30s na 60s
      connectionTimeoutMillis: 5000, // Znížené z 10s na 5s
      allowExitOnIdle: true, // Povolenie exit na idle
    });
    }

    this.initTables().catch(console.error); // Spustenie pre aktualizáciu schémy
  }

  private async initTables() {
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
      } catch (error) {
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
      } catch (error) {
        console.log('ℹ️ Policy number column already exists or error occurred:', error);
      }

      // Pridáme stĺpec payment_frequency ak neexistuje (migrácia existujúcich tabuliek)
      try {
        await client.query(`
          ALTER TABLE insurances ADD COLUMN IF NOT EXISTS payment_frequency VARCHAR(20) NOT NULL DEFAULT 'yearly'
        `);
      } catch (error) {
        console.log('ℹ️ Payment frequency column already exists or error occurred:', error);
      }

      // Pridáme stĺpec file_path ak neexistuje (migrácia pre file uploads)
      try {
        await client.query(`
          ALTER TABLE insurances ADD COLUMN IF NOT EXISTS file_path TEXT
        `);
      } catch (error) {
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
      } catch (error) {
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
    } catch (error) {
      console.error('❌ Chyba pri inicializácii tabuliek:', error);
    } finally {
      client.release();
    }
  }

  private async runMigrations(client: any) {
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
      } catch (error: any) {
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
      } catch (error: any) {
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
      } catch (error: any) {
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
      } catch (error: any) {
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
      } catch (error: any) {
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
      } catch (error: any) {
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
      } catch (error: any) {
        console.log('⚠️ Migrácia 5 chyba:', error.message);
      }
      
      // Migrácia 6: Aktualizácia pricing tiers pre všetky existujúce vozidlá
      try {
        console.log('📋 Migrácia 6: Aktualizácia pricing tiers pre vozidlá...');
        
        // Kompletné pricing tiers pre všetky vozidlá
        const fullPricingTiers = [
          { id: '1', minDays: 0, maxDays: 1, pricePerDay: 80 },      // 0-1 dní
          { id: '2', minDays: 2, maxDays: 3, pricePerDay: 75 },      // 2-3 dni  
          { id: '3', minDays: 4, maxDays: 7, pricePerDay: 70 },      // 4-7 dní
          { id: '4', minDays: 8, maxDays: 14, pricePerDay: 60 },     // 8-14 dní
          { id: '5', minDays: 15, maxDays: 22, pricePerDay: 55 },    // 15-22 dní
          { id: '6', minDays: 23, maxDays: 30, pricePerDay: 50 },    // 23-30 dní  
          { id: '7', minDays: 31, maxDays: 365, pricePerDay: 45 }    // 31+ dní
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
          
          await client.query(
            'UPDATE vehicles SET pricing = $1 WHERE id = $2',
            [JSON.stringify(adjustedPricing), vehicle.id]
          );
        }
        
        console.log(`✅ Migrácia 6: Pricing aktualizované pre ${vehiclesResult.rows.length} vozidiel`);
      } catch (error: any) {
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
      } catch (error: any) {
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
      } catch (error: any) {
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
      } catch (error: any) {
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
      } catch (error: any) {
        console.log('⚠️ Migrácia 10 chyba:', error.message);
        // Ak zlyhá konverzia, skús pridať stĺpec nanovo
        try {
          await client.query(`
            ALTER TABLE users DROP COLUMN IF EXISTS company_id;
            ALTER TABLE users ADD COLUMN company_id UUID REFERENCES companies(id);
          `);
          console.log('✅ Migrácia 10: company_id stĺpec znovu vytvorený ako UUID');
        } catch (retryError: any) {
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
      } catch (error: any) {
        console.log('⚠️ Migrácia 11 chyba:', error.message);
        // Ak zlyhá konverzia, skús pridať stĺpec nanovo
        try {
          await client.query(`
            ALTER TABLE vehicles DROP COLUMN IF EXISTS id;
            ALTER TABLE vehicles ADD COLUMN id UUID PRIMARY KEY DEFAULT gen_random_uuid();
          `);
          console.log('✅ Migrácia 11: vehicles.id stĺpec znovu vytvorený ako UUID');
        } catch (retryError: any) {
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
      } catch (error: any) {
        console.log('⚠️ Migrácia 12 chyba:', error.message);
        // Ak zlyhá konverzia, skús pridať stĺpec nanovo
        try {
          await client.query(`
            ALTER TABLE users DROP COLUMN IF EXISTS id;
            ALTER TABLE users ADD COLUMN id UUID PRIMARY KEY DEFAULT gen_random_uuid();
          `);
          console.log('✅ Migrácia 12: users.id stĺpec znovu vytvorený ako UUID');
        } catch (retryError: any) {
          console.log('⚠️ Migrácia 12 retry chyba:', retryError.message);
        }
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
        } catch (e: any) {
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
        } else {
          console.log('   ⚠️ Lubka company nenájdená');
        }
        
        // 14.3: Skontroluj že všetko má company assignment
        console.log('📋 14.3: Kontrola company assignments...');
        
        const usersWithoutCompany = await client.query('SELECT COUNT(*) FROM users WHERE company_id IS NULL');
        console.log(`   Users bez company: ${usersWithoutCompany.rows[0].count}`);
        
        const vehiclesWithCompany = await client.query('SELECT COUNT(*) FROM vehicles WHERE company IS NOT NULL');
        console.log(`   Vehicles s company: ${vehiclesWithCompany.rows[0].count}`);
        
        console.log('✅ Migrácia 14: Final Company Cleanup dokončená');
        
      } catch (error: any) {
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
        } else {
          console.log('   ℹ️ STK stĺpec už existuje');
        }
        
        console.log('✅ Migrácia 16: STK stĺpec úspešne pridaný');
        
      } catch (error: any) {
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
            AND vehicle_id::uuid NOT IN (SELECT id FROM vehicles)
          `);
          console.log('   🔧 Neplatné vehicle_id nastavené na NULL');
          
          // Pridaj FK constraint
          await client.query(`
            ALTER TABLE rentals 
            ADD CONSTRAINT rentals_vehicle_id_fkey 
            FOREIGN KEY (vehicle_id) REFERENCES vehicles(id) ON DELETE SET NULL
          `);
          console.log('   ✅ FK constraint pridaný pre rentals.vehicle_id');
        } else {
          console.log('   ℹ️ FK constraint už existuje');
        }
        console.log('✅ Migrácia 17: FK constraint úspešne pridaný');
      } catch (error: any) {
        console.log('⚠️ Migrácia 17 chyba:', error.message);
      }
    } catch (error: any) {
      console.log('⚠️ Migrácie celkovo preskočené:', error.message);
    }
  }

  // DATA INTEGRITY VALIDATION
  private async validateDataIntegrity(client: PoolClient) {
    console.log('🔍 Spúšťam data integrity validation...');
    
    try {
      // 1. Kontrola orphaned rentals (rentals bez platných vehicles)
      const orphanedRentals = await client.query(`
        SELECT r.id, r.customer_name, r.vehicle_id 
        FROM rentals r 
        LEFT JOIN vehicles v ON r.vehicle_id::uuid = v.id 
        WHERE r.vehicle_id IS NOT NULL AND v.id IS NULL
      `);
      
      if (orphanedRentals.rows.length > 0) {
        console.log(`⚠️ PROBLÉM: ${orphanedRentals.rows.length} rentals má neplatné vehicle_id`);
        for (const rental of orphanedRentals.rows) {
          console.log(`   ❌ Rental ${rental.id} (${rental.customer_name}) -> neexistujúce vehicle_id: ${rental.vehicle_id}`);
        }
      } else {
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
      } else {
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
      } else {
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
      } else {
        console.log(`⚠️ PROBLÉM: UUID formát nie je konzistentný - Vehicles: ${uuidData.valid_vehicle_uuids}/${uuidData.total_vehicles}, Users: ${uuidData.valid_user_uuids}/${uuidData.total_users}`);
      }
      
      console.log('✅ Data integrity validation dokončená');
      
    } catch (error: any) {
      console.log('⚠️ Data integrity validation chyba:', error.message);
    }
  }

  private async createDefaultAdmin(client: PoolClient) {
    try {
      const adminExists = await client.query('SELECT id FROM users WHERE username = $1', ['admin']);
      
      if (adminExists.rows.length === 0) {
        const hashedPassword = await bcrypt.hash('admin123', 12);
        await client.query(
          'INSERT INTO users (username, email, password_hash, role) VALUES ($1, $2, $3, $4)',
          ['admin', 'admin@blackrent.sk', hashedPassword, 'admin']
        );
        console.log('👤 Admin používateľ vytvorený (username: admin, password: admin123)');
      }
    } catch (error) {
      console.error('Chyba pri vytváraní admin používateľa:', error);
    }
  }

  private async createSampleDataIfEmpty(client: PoolClient) {
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
          const existingCompanies = await client.query('SELECT name FROM companies WHERE name IN ($1, $2, $3)', 
            ['ABC Rent', 'Premium Cars', 'City Rent']);
          const existingNames = existingCompanies.rows.map(row => row.name);
          
          const companiesToInsert = ['ABC Rent', 'Premium Cars', 'City Rent'].filter(name => !existingNames.includes(name));
          
          if (companiesToInsert.length > 0) {
            const values = companiesToInsert.map((name, index) => `($${index + 1})`).join(', ');
            await client.query(`INSERT INTO companies (name) VALUES ${values}`, companiesToInsert);
            console.log('✅ Firmy vytvorené:', companiesToInsert);
          }
        } catch (error: any) {
          console.log('⚠️ Chyba pri vytváraní firiem:', error.message);
        }
        
        // Vytvorenie poisťovní
        try {
          // Skontroluj existujúce poisťovne
          const existingInsurers = await client.query('SELECT name FROM insurers WHERE name IN ($1, $2)', 
            ['Allianz', 'Generali']);
          const existingInsurerNames = existingInsurers.rows.map(row => row.name);
          
          const insurersToInsert = ['Allianz', 'Generali'].filter(name => !existingInsurerNames.includes(name));
          
          if (insurersToInsert.length > 0) {
            const values = insurersToInsert.map((name, index) => `($${index + 1})`).join(', ');
            await client.query(`INSERT INTO insurers (name) VALUES ${values}`, insurersToInsert);
            console.log('✅ Poisťovne vytvorené:', insurersToInsert);
          }
        } catch (error: any) {
          console.log('⚠️ Chyba pri vytváraní poisťovní:', error.message);
        }
        
        // Vytvorenie vozidiel - len ak neexistujú
        try {
          const existingVehicles = await client.query('SELECT COUNT(*) FROM vehicles WHERE license_plate IN ($1, $2, $3, $4, $5)', 
            ['BA123AB', 'BA456CD', 'BA789EF', 'BA111XY', 'BA222XZ']);
            
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
                { id: '1', minDays: 0, maxDays: 1, pricePerDay: 120 },      // 0-1 dní
                { id: '2', minDays: 2, maxDays: 3, pricePerDay: 110 },      // 2-3 dni
                { id: '3', minDays: 4, maxDays: 7, pricePerDay: 100 },      // 4-7 dní
                { id: '4', minDays: 8, maxDays: 14, pricePerDay: 90 },      // 8-14 dní
                { id: '5', minDays: 15, maxDays: 22, pricePerDay: 85 },     // 15-22 dní
                { id: '6', minDays: 23, maxDays: 30, pricePerDay: 80 },     // 23-30 dní
                { id: '7', minDays: 31, maxDays: 365, pricePerDay: 75 }     // 31+ dní
              ]),
              JSON.stringify({ type: 'percentage', value: 20 }),
              // Mercedes E-Class - Business class pricing
              JSON.stringify([
                { id: '1', minDays: 0, maxDays: 1, pricePerDay: 100 },      // 0-1 dní
                { id: '2', minDays: 2, maxDays: 3, pricePerDay: 95 },       // 2-3 dni
                { id: '3', minDays: 4, maxDays: 7, pricePerDay: 85 },       // 4-7 dní
                { id: '4', minDays: 8, maxDays: 14, pricePerDay: 75 },      // 8-14 dní
                { id: '5', minDays: 15, maxDays: 22, pricePerDay: 70 },     // 15-22 dní
                { id: '6', minDays: 23, maxDays: 30, pricePerDay: 65 },     // 23-30 dní
                { id: '7', minDays: 31, maxDays: 365, pricePerDay: 60 }     // 31+ dní
              ]),
              JSON.stringify({ type: 'percentage', value: 20 }),
              // Audi A4 - Standard sedan pricing
              JSON.stringify([
                { id: '1', minDays: 0, maxDays: 1, pricePerDay: 80 },       // 0-1 dní
                { id: '2', minDays: 2, maxDays: 3, pricePerDay: 75 },       // 2-3 dni
                { id: '3', minDays: 4, maxDays: 7, pricePerDay: 70 },       // 4-7 dní
                { id: '4', minDays: 8, maxDays: 14, pricePerDay: 60 },      // 8-14 dní
                { id: '5', minDays: 15, maxDays: 22, pricePerDay: 55 },     // 15-22 dní
                { id: '6', minDays: 23, maxDays: 30, pricePerDay: 50 },     // 23-30 dní
                { id: '7', minDays: 31, maxDays: 365, pricePerDay: 45 }     // 31+ dní
              ]),
              JSON.stringify({ type: 'percentage', value: 20 }),
              // Skoda Octavia - Budget friendly pricing
              JSON.stringify([
                { id: '1', minDays: 0, maxDays: 1, pricePerDay: 60 },       // 0-1 dní
                { id: '2', minDays: 2, maxDays: 3, pricePerDay: 55 },       // 2-3 dni
                { id: '3', minDays: 4, maxDays: 7, pricePerDay: 50 },       // 4-7 dní
                { id: '4', minDays: 8, maxDays: 14, pricePerDay: 45 },      // 8-14 dní
                { id: '5', minDays: 15, maxDays: 22, pricePerDay: 40 },     // 15-22 dní
                { id: '6', minDays: 23, maxDays: 30, pricePerDay: 35 },     // 23-30 dní
                { id: '7', minDays: 31, maxDays: 365, pricePerDay: 30 }     // 31+ dní
              ]),
              JSON.stringify({ type: 'percentage', value: 20 }),
              // Volkswagen Passat - Mid-range pricing
              JSON.stringify([
                { id: '1', minDays: 0, maxDays: 1, pricePerDay: 70 },       // 0-1 dní
                { id: '2', minDays: 2, maxDays: 3, pricePerDay: 65 },       // 2-3 dni
                { id: '3', minDays: 4, maxDays: 7, pricePerDay: 60 },       // 4-7 dní
                { id: '4', minDays: 8, maxDays: 14, pricePerDay: 55 },      // 8-14 dní
                { id: '5', minDays: 15, maxDays: 22, pricePerDay: 50 },     // 15-22 dní
                { id: '6', minDays: 23, maxDays: 30, pricePerDay: 45 },     // 23-30 dní
                { id: '7', minDays: 31, maxDays: 365, pricePerDay: 40 }     // 31+ dní
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
          } else {
            console.log('ℹ️ Vozidlá už existujú, preskakujem vytváranie testovacích dát');
          }
                 } catch (vehicleError: any) {
           console.log('⚠️ Chyba pri vytváraní vozidiel:', vehicleError.message);
         }
      } else {
        console.log('ℹ️ Databáza už obsahuje dáta, preskakujem vytváranie testovacích dát');
      }
    } catch (error) {
      console.error('⚠️ Chyba pri vytváraní testovacích dát:', error);
    }
  }

  // Metódy pre používateľov
  async getUserByUsername(username: string): Promise<User | null> {
    try {
      // Najprv skús v hlavnej users tabuľke
      const result = await this.pool.query(
        'SELECT id, username, email, password_hash as password, role, company_id, employee_number, hire_date, is_active, last_login, first_name, last_name, signature_template, created_at, updated_at FROM users WHERE username = $1',
        [username]
      );

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
    } catch (error) {
      console.error('❌ Chyba pri získavaní používateľa podľa username:', error);
      return null;
    }
  }

  async getUserById(id: string): Promise<User | null> {
    try {
      const result = await this.pool.query(
        'SELECT id, username, email, password_hash as password, role, company_id, employee_number, hire_date, is_active, last_login, first_name, last_name, signature_template, created_at, updated_at FROM users WHERE id = $1',
        [id]
      );

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
    } catch (error) {
      console.error('❌ Chyba pri získavaní používateľa podľa ID:', error);
      return null;
    }
  }

  async createUser(userData: { 
    username: string; 
    email: string; 
    password: string; 
    role: string;
    firstName?: string | null;
    lastName?: string | null;
    companyId?: string | null;
    employeeNumber?: string | null;
    hireDate?: Date | null;
    isActive?: boolean;
    signatureTemplate?: string | null;
  }): Promise<User> {
    const client = await this.pool.connect();
    try {
      console.log('🗄️ Database createUser - userData:', userData);
      
      const hashedPassword = await bcrypt.hash(userData.password, 12);
      const result = await client.query(
        `INSERT INTO users (
          username, email, password_hash, role, first_name, last_name, 
          company_id, employee_number, hire_date, is_active, signature_template
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11) 
        RETURNING id, username, email, password_hash, role, first_name, last_name,
                  company_id, employee_number, hire_date, is_active, last_login,
                  signature_template, created_at, updated_at`,
        [
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
        ]
      );
      
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
    } catch (error) {
      console.error('❌ Database createUser error:', error);
      throw error;
    } finally {
      client.release();
    }
  }

  async updateUser(user: User): Promise<void> {
    const client = await this.pool.connect();
    try {
      const hashedPassword = await bcrypt.hash(user.password, 12);
      await client.query(
        'UPDATE users SET username = $1, email = $2, password_hash = $3, role = $4, company_id = $5, employee_number = $6, hire_date = $7, is_active = $8, first_name = $9, last_name = $10, signature_template = $11, updated_at = CURRENT_TIMESTAMP WHERE id = $12',
        [
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
        ]
      );
    } finally {
      client.release();
    }
  }

  async deleteUser(id: string): Promise<void> {
    const client = await this.pool.connect();
    try {
      await client.query('DELETE FROM users WHERE id = $1', [id]); // Removed parseInt for UUID
    } finally {
      client.release();
    }
  }

  async getUsers(): Promise<User[]> {
    const client = await this.pool.connect();
    try {
      const result = await client.query(
        'SELECT id, username, email, password_hash as password, role, company_id, employee_number, hire_date, is_active, last_login, first_name, last_name, signature_template, created_at, updated_at FROM users ORDER BY created_at DESC'
      );
      
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
    } finally {
      client.release();
    }
  }

  // Metódy pre vozidlá
  async getVehicles(): Promise<Vehicle[]> {
    const client = await this.pool.connect();
    try {
      const result = await client.query(
        'SELECT * FROM vehicles ORDER BY created_at DESC'
      );
      
      const vehicles = result.rows.map(row => ({
        ...row,
        id: row.id?.toString() || '',
        licensePlate: row.license_plate, // Mapovanie column názvu
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
              const newCompanyResult = await client.query(
                'INSERT INTO companies (name) VALUES ($1) RETURNING id', 
                [companyName]
              );
              companyId = newCompanyResult.rows[0].id;
              companyMap.set(companyNameLower, companyId);
              console.log(`🆕 AUTO-FIX: Created company "${companyName}" with ID ${companyId}`);
            }
            
            // Aktualizuj vozidlo
            await client.query(
              'UPDATE vehicles SET owner_company_id = $1 WHERE id = $2',
              [companyId, vehicle.id]
            );
            
            // Aktualizuj vozidlo v pamäti
            vehicle.ownerCompanyId = companyId.toString();
            console.log(`✅ AUTO-FIX: ${vehicle.brand} ${vehicle.model} → ${companyName} (${companyId})`);
            
          } catch (fixError) {
            console.error(`❌ AUTO-FIX error for vehicle ${vehicle.id}:`, fixError);
          }
        }
      }

      return vehicles;
    } finally {
      client.release();
    }
  }

  async getVehicle(id: string): Promise<Vehicle | null> {
    const client = await this.pool.connect();
    try {
      const result = await client.query('SELECT * FROM vehicles WHERE id = $1', [id]); // Removed parseInt for UUID
      
      if (result.rows.length === 0) return null;
      
      const row = result.rows[0];
      return {
        ...row,
        id: row.id.toString(),
        licensePlate: row.license_plate, // Mapovanie column názvu
        ownerCompanyId: row.owner_company_id?.toString(), // Mapovanie owner_company_id na ownerCompanyId
        pricing: typeof row.pricing === 'string' ? JSON.parse(row.pricing) : row.pricing, // Parsovanie JSON
        commission: typeof row.commission === 'string' ? JSON.parse(row.commission) : row.commission, // Parsovanie JSON
        stk: row.stk ? new Date(row.stk) : undefined, // 📋 STK date mapping
        createdAt: new Date(row.created_at)
      };
    } finally {
      client.release();
    }
  }

  async createVehicle(vehicleData: {
    brand: string;
    model: string;
    licensePlate: string;
    company: string;
    pricing: any[];
    commission: any;
    status: string;
    year?: number;
  }): Promise<Vehicle> {
    const client = await this.pool.connect();
    try {
      // Kontrola duplicít - skontroluj či už existuje vozidlo s touto ŠPZ
      if (vehicleData.licensePlate && vehicleData.licensePlate.trim()) {
        const existingVehicle = await client.query(
          'SELECT id, brand, model FROM vehicles WHERE LOWER(license_plate) = LOWER($1)',
          [vehicleData.licensePlate.trim()]
        );
        
        if (existingVehicle.rows.length > 0) {
          const existing = existingVehicle.rows[0];
          console.log(`⚠️ Vozidlo s ŠPZ ${vehicleData.licensePlate} už existuje: ${existing.brand} ${existing.model}`);
          throw new Error(`Vozidlo s ŠPZ ${vehicleData.licensePlate} už existuje v databáze`);
        }
      }

      // Nájdi alebo vytvor company
      let companyId: string | null = null;
      if (vehicleData.company && vehicleData.company.trim()) {
        companyId = await this.getCompanyIdByName(vehicleData.company.trim());
      }

      // Skús najprv s company_id, ak zlyhá, skús bez neho (pre kompatibilitu)
      let result;
      try {
        result = await client.query(
          'INSERT INTO vehicles (brand, model, year, license_plate, company, owner_company_id, pricing, commission, status) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) RETURNING id, brand, model, year, license_plate, company, owner_company_id, pricing, commission, status, created_at',
          [
            vehicleData.brand, 
            vehicleData.model, 
            vehicleData.year || 2024, // Default rok ak nie je zadaný
            vehicleData.licensePlate, 
            vehicleData.company,
            companyId, // 🆕 Automaticky nastavené company_id
            JSON.stringify(vehicleData.pricing),
            JSON.stringify(vehicleData.commission),
            vehicleData.status
          ]
        );
      } catch (insertError: any) {
        console.log('⚠️ Insert with company_id failed, trying without:', insertError.message);
        // Fallback - vytvor bez company_id ak stĺpec neexistuje
        result = await client.query(
          'INSERT INTO vehicles (brand, model, year, license_plate, company, pricing, commission, status) VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING id, brand, model, year, license_plate, company, pricing, commission, status, created_at',
          [
            vehicleData.brand, 
            vehicleData.model, 
            vehicleData.year || 2024,
            vehicleData.licensePlate, 
            vehicleData.company,
            JSON.stringify(vehicleData.pricing),
            JSON.stringify(vehicleData.commission),
            vehicleData.status
          ]
        );
      }

      const row = result.rows[0];
      return {
        id: row.id.toString(),
        brand: row.brand,
        model: row.model,
        year: row.year,
        licensePlate: row.license_plate,
        company: row.company,
        ownerCompanyId: row.owner_company_id?.toString() || companyId?.toString(), // 🆕 Mapovanie owner_company_id na ownerCompanyId (fallback na companyId)
        pricing: typeof row.pricing === 'string' ? JSON.parse(row.pricing) : row.pricing,
        commission: typeof row.commission === 'string' ? JSON.parse(row.commission) : row.commission,
        status: row.status,
        createdAt: new Date(row.created_at)
      };
    } catch (error) {
      console.error('❌ Detailed createVehicle error:', error);
      throw error;
    } finally {
      client.release();
    }
  }

  async updateVehicle(vehicle: Vehicle): Promise<void> {
    const client = await this.pool.connect();
    try {
      // Automaticky vytvoriť company záznam ak neexistuje - bez ON CONFLICT
      if (vehicle.company && vehicle.company.trim()) {
        try {
          const existingCompany = await client.query('SELECT name FROM companies WHERE name = $1', [vehicle.company.trim()]);
          if (existingCompany.rows.length === 0) {
            await client.query('INSERT INTO companies (name) VALUES ($1)', [vehicle.company.trim()]);
          }
        } catch (companyError: any) {
          console.log('⚠️ Company update error:', companyError.message);
        }
      }

      await client.query(
        'UPDATE vehicles SET brand = $1, model = $2, license_plate = $3, company = $4, owner_company_id = $5, pricing = $6, commission = $7, status = $8, year = $9, stk = $10, updated_at = CURRENT_TIMESTAMP WHERE id = $11',
        [
          vehicle.brand, 
          vehicle.model, 
          vehicle.licensePlate, 
          vehicle.company,
          vehicle.ownerCompanyId || null, // 🏢 Company ID as UUID string
          JSON.stringify(vehicle.pricing), // Konverzia na JSON string
          JSON.stringify(vehicle.commission), // Konverzia na JSON string
          vehicle.status,
          vehicle.year || null, // 📅 Year
          vehicle.stk || null, // 📋 STK date
          vehicle.id // UUID as string, not parseInt
        ]
      );
    } finally {
      client.release();
    }
  }

  async deleteVehicle(id: string): Promise<void> {
    const client = await this.pool.connect();
    try {
      await client.query('DELETE FROM vehicles WHERE id = $1', [id]); // Removed parseInt for UUID
    } finally {
      client.release();
    }
  }

  // Metódy pre prenájmy
  // OPTIMALIZÁCIA: Nová metóda pre načítanie len prenájmov v danom období
  async getRentalsForDateRange(startDate: Date, endDate: Date): Promise<Rental[]> {
    const client = await this.pool.connect();
    try {
      // Načítaj len prenájmy ktoré sa prekrývajú s daným obdobím
      const result = await client.query(`
        SELECT id, customer_id, vehicle_id, start_date, end_date, 
               total_price, commission, payment_method, paid, status, 
               customer_name, created_at, order_number, deposit, 
               allowed_kilometers, daily_kilometers, handover_place
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
            handoverPlace: row.handover_place || undefined
          };
        } catch (error) {
          console.error('❌ Chyba pri spracovaní rental:', error);
          throw error;
        }
      });
    } finally {
      client.release();
    }
  }

  async getRentals(): Promise<Rental[]> {
    const client = await this.pool.connect();
    try {
      // 🚀 NOVÝ PRÍSTUP: Priamy JOIN ako getVehicles() - STABILNÝ ✅
      console.log('🔍 Loading rentals with direct JOIN...');
      const result = await client.query(`
        SELECT 
          r.id, r.customer_id, r.vehicle_id, r.start_date, r.end_date, 
          r.total_price, r.commission, r.payment_method, r.paid, r.status, 
          r.customer_name, r.created_at, r.order_number, r.deposit, 
          r.allowed_kilometers, r.daily_kilometers, r.handover_place,
          v.brand, v.model, v.license_plate, v.company, v.pricing, v.commission as v_commission, v.status as v_status
        FROM rentals r
        LEFT JOIN vehicles v ON r.vehicle_id::uuid = v.id
        ORDER BY r.created_at DESC
      `);
      console.log(`📊 Found ${result.rows.length} rentals`);
      
      const rentals = result.rows.map(row => ({
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
        // 🚗 PRIAMO MAPOVANÉ VEHICLE DATA (ako getVehicles) ✅
        vehicle: row.brand ? {
          id: row.vehicle_id,
          brand: row.brand,
          model: row.model,
          licensePlate: row.license_plate,
          company: row.company || 'N/A',
          pricing: typeof row.pricing === 'string' ? JSON.parse(row.pricing) : row.pricing || [],
          commission: typeof row.v_commission === 'string' ? JSON.parse(row.v_commission) : row.v_commission || { type: 'percentage', value: 0 },
          status: row.v_status || 'available'
        } : undefined
      }));

      // 🔧 AUTO-FIX: Oprav prenájmy bez vehicle (ako getVehicles) ✅
      const rentalsToFix = rentals.filter(r => r.vehicleId && !r.vehicle);
      
      if (rentalsToFix.length > 0) {
        console.log(`🔧 AUTO-FIX: Found ${rentalsToFix.length} rentals with invalid vehicle_id, fixing...`);
        
        // Získaj dostupné vozidlá pre mapping
        const availableVehicles = await client.query('SELECT id, brand, model, license_plate, company FROM vehicles LIMIT 10');
        
        if (availableVehicles.rows.length > 0) {
          // Oprav každý prenájom s neplatným vehicle_id
          for (const rental of rentalsToFix) {
            try {
              const randomVehicle = availableVehicles.rows[Math.floor(Math.random() * availableVehicles.rows.length)];
              
              await client.query(
                'UPDATE rentals SET vehicle_id = $1 WHERE id = $2',
                [randomVehicle.id, rental.id]
              );
              
              // Aktualizuj rental v pamäti
              rental.vehicleId = randomVehicle.id.toString();
              rental.vehicle = {
                id: randomVehicle.id,
                brand: randomVehicle.brand,
                model: randomVehicle.model,
                licensePlate: randomVehicle.license_plate,
                company: randomVehicle.company || 'N/A',
                pricing: [],
                commission: { type: 'percentage', value: 0 },
                status: 'available'
              };
              
              console.log(`✅ AUTO-FIX: Rental ${rental.customerName} → Vehicle ${randomVehicle.brand} ${randomVehicle.model} (${randomVehicle.license_plate})`);
              
            } catch (fixError) {
              console.error(`❌ AUTO-FIX error for rental ${rental.id}:`, fixError);
            }
          }
        }
      }

      return rentals;
    } catch (error) {
      console.error('❌ getRentals() chyba:', error);
      throw error;
    } finally {
      client.release();
    }
  }

  // Bezpečné parsovanie JSON polí
  private safeJsonParse(value: any, fallback = undefined) {
    if (!value) return fallback;
    if (typeof value === 'object') return value;
    if (typeof value === 'string') {
      try {
        return JSON.parse(value);
      } catch (e) {
        console.warn('⚠️ JSON parse chyba:', e, 'value:', value);
        return fallback;
      }
    }
    return fallback;
  }

  async createRental(rentalData: {
    vehicleId?: string;
    customerId?: string;
    customerName: string;
    startDate: Date;
    endDate: Date;
    totalPrice: number;
    commission: number;
    paymentMethod: string;
    discount?: any;
    customCommission?: any;
    extraKmCharge?: number;
    paid?: boolean;
    status?: string;
    handoverPlace?: string;
    confirmed?: boolean;
    payments?: any;
    history?: any;
    orderNumber?: string;
    deposit?: number;
    allowedKilometers?: number;
    dailyKilometers?: number;
    extraKilometerRate?: number;
    returnConditions?: string;
    fuelLevel?: number;
    odometer?: number;
    returnFuelLevel?: number;
    returnOdometer?: number;
    actualKilometers?: number;
    fuelRefillCost?: number;
    handoverProtocolId?: string;
    returnProtocolId?: string;
  }): Promise<Rental> {
    const client = await this.pool.connect();
    try {
      const result = await client.query(`
        INSERT INTO rentals (
          vehicle_id, customer_id, customer_name, start_date, end_date, 
          total_price, commission, payment_method, discount, custom_commission, 
          extra_km_charge, paid, status, handover_place, confirmed, payments, history, order_number,
          deposit, allowed_kilometers, daily_kilometers, extra_kilometer_rate, return_conditions, 
          fuel_level, odometer, return_fuel_level, return_odometer, actual_kilometers, fuel_refill_cost,
          handover_protocol_id, return_protocol_id
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22, $23, $24, $25, $26, $27, $28, $29, $30, $31)
        RETURNING id, vehicle_id, customer_id, customer_name, start_date, end_date, total_price, commission, payment_method, 
          discount, custom_commission, extra_km_charge, paid, status, handover_place, confirmed, payments, history, order_number,
          deposit, allowed_kilometers, daily_kilometers, extra_kilometer_rate, return_conditions, 
          fuel_level, odometer, return_fuel_level, return_odometer, actual_kilometers, fuel_refill_cost,
          handover_protocol_id, return_protocol_id, created_at
      `, [
        rentalData.vehicleId || null, 
        rentalData.customerId || null, 
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
        rentalData.returnProtocolId || null
      ]);

      const row = result.rows[0];
      return {
        id: row.id.toString(),
        vehicleId: row.vehicle_id?.toString(),
        customerId: row.customer_id?.toString(),
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
        createdAt: new Date(row.created_at)
      };
    } finally {
      client.release();
    }
  }

  async getRental(id: string): Promise<Rental | null> {
    const client = await this.pool.connect();
    try {
      console.log('🔍 getRental called for ID:', id);
      const result = await client.query(`
        SELECT r.*, v.brand, v.model, v.license_plate, v.company 
        FROM rentals r 
        LEFT JOIN vehicles v ON r.vehicle_id::uuid = v.id 
        WHERE r.id = $1
      `, [id]);
      
      console.log('📊 getRental result:', {
        found: result.rows.length > 0,
        vehicleId: result.rows[0]?.vehicle_id,
        vehicleBrand: result.rows[0]?.brand,
        vehicleModel: result.rows[0]?.model
      });
      
      if (result.rows.length === 0) return null;
      
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
          company: row.company || 'N/A',
          pricing: [],
          commission: { type: 'percentage', value: 0 },
          status: 'available'
        }
      };
    } finally {
      client.release();
    }
  }

  async updateRental(rental: Rental): Promise<void> {
    const client = await this.pool.connect();
    try {
      await client.query(`
        UPDATE rentals SET 
          vehicle_id = $1, customer_id = $2, customer_name = $3, start_date = $4, end_date = $5,
          total_price = $6, commission = $7, payment_method = $8, discount = $9, custom_commission = $10,
          extra_km_charge = $11, paid = $12, status = $13, handover_place = $14, confirmed = $15,
          payments = $16, history = $17, order_number = $18,
          deposit = $19, allowed_kilometers = $20, daily_kilometers = $21, extra_kilometer_rate = $22, return_conditions = $23,
          fuel_level = $24, odometer = $25, return_fuel_level = $26, return_odometer = $27,
          actual_kilometers = $28, fuel_refill_cost = $29, handover_protocol_id = $30, 
          return_protocol_id = $31, updated_at = CURRENT_TIMESTAMP
        WHERE id = $32
      `, [
        rental.vehicleId || null, // UUID as string, not parseInt
        rental.customerId || null, // UUID as string, not parseInt
        rental.customerName, 
        rental.startDate, 
        rental.endDate,
        rental.totalPrice, 
        rental.commission, 
        rental.paymentMethod, 
        rental.discount ? JSON.stringify(rental.discount) : null,
        rental.customCommission ? JSON.stringify(rental.customCommission) : null,
        rental.extraKmCharge, 
        rental.paid, 
        rental.status, 
        rental.handoverPlace, 
        rental.confirmed,
        rental.payments ? JSON.stringify(rental.payments) : null,
        rental.history ? JSON.stringify(rental.history) : null,
        rental.orderNumber,
        rental.deposit || null,
        rental.allowedKilometers || null,
        rental.dailyKilometers || null,
        rental.extraKilometerRate || null,
        rental.returnConditions || null,
        rental.fuelLevel || null,
        rental.odometer || null,
        rental.returnFuelLevel || null,
        rental.returnOdometer || null,
        rental.actualKilometers || null,
        rental.fuelRefillCost || null,
        rental.handoverProtocolId || null,
        rental.returnProtocolId || null,
        rental.id // UUID as string, not parseInt
      ]);
    } finally {
      client.release();
    }
  }

  async deleteRental(id: string): Promise<void> {
    const client = await this.pool.connect();
    try {
      await client.query('DELETE FROM rentals WHERE id = $1', [id]); // Removed parseInt for UUID
    } finally {
      client.release();
    }
  }

  // Metódy pre zákazníkov
  async getCustomers(): Promise<Customer[]> {
    const client = await this.pool.connect();
    try {
      const result = await client.query(
        'SELECT id, name, email, phone, created_at FROM customers ORDER BY created_at DESC'
      );
      
      return result.rows.map((row: any) => ({
        id: row.id.toString(),
        name: row.name,
        email: row.email,
        phone: row.phone,
        createdAt: new Date(row.created_at)
      }));
    } finally {
      client.release();
    }
  }

  async createCustomer(customerData: {
    name: string;
    email: string;
    phone: string;
  }): Promise<Customer> {
    const client = await this.pool.connect();
    try {
      console.log('📝 Creating customer with data:', customerData);
      
      const result = await client.query(
        'INSERT INTO customers (name, email, phone) VALUES ($1, $2, $3) RETURNING id, name, email, phone, created_at',
        [customerData.name, customerData.email, customerData.phone]
      );

      const row = result.rows[0];
      console.log('✅ Customer created with ID:', row.id);
      
      return {
        id: row.id.toString(),
        name: row.name,
        email: row.email,
        phone: row.phone,
        createdAt: new Date(row.created_at)
      };
    } catch (error) {
      console.error('❌ Detailed createCustomer error:', error);
      throw error;
    } finally {
      client.release();
    }
  }

  async updateCustomer(customer: Customer): Promise<void> {
    const client = await this.pool.connect();
    try {
      await client.query(
        'UPDATE customers SET name = $1, email = $2, phone = $3, updated_at = CURRENT_TIMESTAMP WHERE id = $4',
        [customer.name, customer.email, customer.phone, customer.id] // UUID as string
      );
    } finally {
      client.release();
    }
  }

  async deleteCustomer(id: string): Promise<void> {
    const client = await this.pool.connect();
    try {
      await client.query('DELETE FROM customers WHERE id = $1', [id]); // Removed parseInt for UUID
    } finally {
      client.release();
    }
  }

  // Metódy pre náklady
  async getExpenses(): Promise<Expense[]> {
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
    } finally {
      client.release();
    }
  }

  async createExpense(expenseData: {
    description: string;
    amount: number;
    date: Date;
    vehicleId?: string;
    company: string;
    category: string;
    note?: string;
  }): Promise<Expense> {
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
        } catch (companyError: any) {
          console.log('⚠️ Company pre expense už existuje:', companyError.message);
        }
      }

      const result = await client.query(
        'INSERT INTO expenses (description, amount, date, vehicle_id, company, category, note) VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING id, description, amount, date, vehicle_id, company, category, note, created_at',
        [
          expenseData.description,
          expenseData.amount,
          expenseData.date,
          expenseData.vehicleId || null,
          expenseData.company,
          expenseData.category,
          expenseData.note || null
        ]
      );

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
    } catch (error) {
      console.error('❌ Detailed createExpense error:', error);
      throw error;
    } finally {
      client.release();
    }
  }

  async updateExpense(expense: Expense): Promise<void> {
    const client = await this.pool.connect();
    try {
      // Automaticky vytvoriť company záznam ak neexistuje - bez ON CONFLICT
      if (expense.company && expense.company.trim()) {
        try {
          const existingCompany = await client.query('SELECT name FROM companies WHERE name = $1', [expense.company.trim()]);
          if (existingCompany.rows.length === 0) {
            await client.query('INSERT INTO companies (name) VALUES ($1)', [expense.company.trim()]);
          }
        } catch (companyError: any) {
          console.log('⚠️ Company update pre expense error:', companyError.message);
        }
      }

      await client.query(
        'UPDATE expenses SET description = $1, amount = $2, date = $3, vehicle_id = $4, company = $5, category = $6, note = $7, updated_at = CURRENT_TIMESTAMP WHERE id = $8',
        [
          expense.description,
          expense.amount,
          expense.date,
          expense.vehicleId || null, // UUID as string, not parseInt
          expense.company,
          expense.category,
          expense.note,
          expense.id // UUID as string, not parseInt
        ]
      );
    } finally {
      client.release();
    }
  }

  async deleteExpense(id: string): Promise<void> {
    const client = await this.pool.connect();
    try {
      await client.query('DELETE FROM expenses WHERE id = $1', [id]); // Removed parseInt for UUID
    } finally {
      client.release();
    }
  }

  // Metódy pre poistky
  async getInsurances(): Promise<Insurance[]> {
    const client = await this.pool.connect();
    try {
      const result = await client.query('SELECT * FROM insurances ORDER BY created_at DESC');
      return result.rows.map(row => ({
        id: row.id?.toString() || '',
        vehicleId: row.vehicle_id?.toString() || '',
        type: row.type,
        policyNumber: row.policy_number || '',
        validFrom: new Date(row.valid_from),
        validTo: new Date(row.valid_to),
        price: parseFloat(row.price) || 0,
        company: row.company,
        paymentFrequency: row.payment_frequency || 'yearly',
        filePath: row.file_path || undefined
      }));
    } finally {
      client.release();
    }
  }

  async createInsurance(insuranceData: {
    vehicleId: string;
    type: string;
    policyNumber: string;
    validFrom: Date;
    validTo: Date;
    price: number;
    company: string;
    paymentFrequency?: string;
    filePath?: string;
  }): Promise<Insurance> {
    const client = await this.pool.connect();
    try {
      const result = await client.query(
        'INSERT INTO insurances (vehicle_id, type, policy_number, valid_from, valid_to, price, company, payment_frequency, file_path) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) RETURNING id, vehicle_id, type, policy_number, valid_from, valid_to, price, company, payment_frequency, file_path, created_at',
        [insuranceData.vehicleId, insuranceData.type, insuranceData.policyNumber, insuranceData.validFrom, insuranceData.validTo, insuranceData.price, insuranceData.company, insuranceData.paymentFrequency || 'yearly', insuranceData.filePath || null]
      );

      const row = result.rows[0];
      return {
        id: row.id.toString(),
        vehicleId: row.vehicle_id,
        type: row.type,
        policyNumber: row.policy_number || '',
        validFrom: new Date(row.valid_from),
        validTo: new Date(row.valid_to),
        price: parseFloat(row.price) || 0,
        company: row.company,
        paymentFrequency: row.payment_frequency || 'yearly',
        filePath: row.file_path || undefined
      };
    } finally {
      client.release();
    }
  }

  async updateInsurance(id: string, insuranceData: {
    vehicleId: string;
    type: string;
    policyNumber: string;
    validFrom: Date;
    validTo: Date;
    price: number;
    company: string;
    paymentFrequency?: string;
    filePath?: string;
  }): Promise<Insurance> {
    const client = await this.pool.connect();
    try {
      const result = await client.query(
        'UPDATE insurances SET vehicle_id = $1, type = $2, policy_number = $3, valid_from = $4, valid_to = $5, price = $6, company = $7, payment_frequency = $8, file_path = $9, updated_at = CURRENT_TIMESTAMP WHERE id = $10 RETURNING id, vehicle_id, type, policy_number, valid_from, valid_to, price, company, payment_frequency, file_path',
        [insuranceData.vehicleId, insuranceData.type, insuranceData.policyNumber, insuranceData.validFrom, insuranceData.validTo, insuranceData.price, insuranceData.company, insuranceData.paymentFrequency || 'yearly', insuranceData.filePath || null, id]
      );

      if (result.rows.length === 0) {
        throw new Error('Poistka nebola nájdená');
      }

      const row = result.rows[0];
      return {
        id: row.id.toString(),
        vehicleId: row.vehicle_id,
        type: row.type,
        policyNumber: row.policy_number || '',
        validFrom: new Date(row.valid_from),
        validTo: new Date(row.valid_to),
        price: parseFloat(row.price) || 0,
        company: row.company,
        paymentFrequency: row.payment_frequency || 'yearly',
        filePath: row.file_path || undefined
      };
    } finally {
      client.release();
    }
  }

  // Metódy pre firmy
  async getCompanies(): Promise<Company[]> {
    const client = await this.pool.connect();
    try {
      const result = await client.query('SELECT * FROM companies ORDER BY name');
      return result.rows.map(row => ({
        ...row,
        id: row.id?.toString() || '',
        createdAt: new Date(row.created_at)
      }));
    } finally {
      client.release();
    }
  }

  async createCompany(companyData: { name: string }): Promise<Company> {
    const client = await this.pool.connect();
    try {
      console.log('🏢 Creating company:', companyData.name);
      
      const result = await client.query(
        'INSERT INTO companies (name) VALUES ($1) RETURNING id, name, business_id, tax_id, address, contact_person, email, phone, contract_start_date, contract_end_date, commission_rate, is_active, created_at, updated_at', 
        [companyData.name]
      );
      
      console.log('🏢 Company created successfully:', result.rows[0]);
      
      const row = result.rows[0];
      return {
        id: row.id.toString(),
        name: row.name,
        businessId: row.business_id,
        taxId: row.tax_id,
        address: row.address,
        contactPerson: row.contact_person,
        email: row.email,
        phone: row.phone,
        contractStartDate: row.contract_start_date ? new Date(row.contract_start_date) : undefined,
        contractEndDate: row.contract_end_date ? new Date(row.contract_end_date) : undefined,
        commissionRate: parseFloat(row.commission_rate) || 20.00,
        isActive: row.is_active ?? true,
        createdAt: new Date(row.created_at),
        updatedAt: row.updated_at ? new Date(row.updated_at) : undefined
      };
    } catch (error) {
      console.error('❌ Error creating company:', error);
      throw error;
    } finally {
      client.release();
    }
  }

  async deleteCompany(id: string): Promise<void> {
    const client = await this.pool.connect();
    try {
      await client.query('DELETE FROM companies WHERE id = $1', [id]); // Removed parseInt for UUID
    } finally {
      client.release();
    }
  }

  // Metódy pre poisťovne
  async getInsurers(): Promise<Insurer[]> {
    const client = await this.pool.connect();
    try {
      const result = await client.query('SELECT * FROM insurers ORDER BY name');
      return result.rows.map(row => ({
        ...row,
        id: row.id?.toString() || '',
        createdAt: new Date(row.created_at)
      }));
    } finally {
      client.release();
    }
  }

  async createInsurer(insurerData: { name: string }): Promise<Insurer> {
    const client = await this.pool.connect();
    try {
      const result = await client.query(
        'INSERT INTO insurers (name) VALUES ($1) RETURNING id, name, created_at', 
        [insurerData.name]
      );
      
      const row = result.rows[0];
      return {
        id: row.id.toString(),
        name: row.name,
        createdAt: new Date(row.created_at)
      };
    } finally {
      client.release();
    }
  }

  async deleteInsurer(id: string): Promise<void> {
    const client = await this.pool.connect();
    try {
      await client.query('DELETE FROM insurers WHERE id = $1', [id]);
    } finally {
      client.release();
    }
  }

  // Metódy pre vyúčtovania (settlements)
  async getSettlements(): Promise<Settlement[]> {
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
      return result.rows.map((row: any) => {
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
           const hasMatchingCompany = rental.vehicle?.company === company;
           
           if (row.id && (isInPeriod || hasMatchingCompany)) {
             console.log(`🏠 Settlement ${row.id} - Rental ${rental.id}: Vehicle company: "${rental.vehicle?.company}", Settlement company: "${company}", Match: ${hasMatchingCompany}, Period: ${isInPeriod}`);
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
    } catch (error) {
      console.error('❌ getSettlements error:', error);
      // Return empty array instead of throwing - graceful fallback
      return [];
    } finally {
      client.release();
    }
  }

  async getSettlement(id: string): Promise<Settlement | null> {
    const client = await this.pool.connect();
    try {
      const result = await client.query(`
        SELECT * FROM settlements WHERE id = $1
      `, [id]);
      
      if (result.rows.length === 0) return null;
      
      const row = result.rows[0];
      
      // Načítaj súvisiace prenájmy a náklady ak treba
      const rentals = await this.getRentals(); // Simplified - môžeme filtrovať podľa obdobia
      const expenses = await this.getExpenses(); // Simplified - môžeme filtrovať podľa obdobia
      
      return {
        id: row.id?.toString() || '',
        period: {
          from: new Date(row.period_from),
          to: new Date(row.period_to)
        },
        rentals: rentals || [],
        expenses: expenses || [],
        totalIncome: parseFloat(row.total_income) || 0,
        totalExpenses: parseFloat(row.total_expenses) || 0,
        totalCommission: parseFloat(row.total_commission) || 0,
        profit: parseFloat(row.profit) || 0,
        company: row.company || undefined,
        vehicleId: row.vehicle_id || undefined
      };
    } finally {
      client.release();
    }
  }

  async createSettlement(settlementData: {
    company?: string;
    period?: string;
    fromDate?: Date;
    toDate?: Date;
    totalIncome?: number;
    totalExpenses?: number;
    commission?: number;
    profit?: number;
    summary?: string;
    rentals?: any[];
    expenses?: any[];
  }): Promise<Settlement> {
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
    } finally {
      client.release();
    }
  }

  async updateSettlement(id: string, updateData: any): Promise<Settlement> {
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
    } finally {
      client.release();
    }
  }

  async deleteSettlement(id: string): Promise<void> {
    const client = await this.pool.connect();
    try {
      await client.query('DELETE FROM settlements WHERE id = $1', [id]);
    } finally {
      client.release();
    }
  }

  // PROTOCOLS HELPER METHODS
  private extractMediaData(mediaArray: any[]): any[] {
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
          } catch (error) {
            console.error('❌ extractMediaData: Error processing item:', error);
            return null;
          }
        })
        .filter(item => item !== null);
      
      console.log('✅ extractMediaData: Successfully extracted', mediaData.length, 'media items');
      return mediaData;
    } catch (error) {
      console.error('❌ extractMediaData: Critical error:', error);
      return [];
    }
  }

  private mapMediaObjectsFromDB(mediaData: any[]): any[] {
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

  private getMediaTypeFromUrl(url: string): string {
    if (url.includes('/vehicle/')) return 'vehicle';
    if (url.includes('/damage/')) return 'damage';
    if (url.includes('/document/')) return 'document';
    if (url.includes('/fuel/')) return 'fuel';
    if (url.includes('/odometer/')) return 'odometer';
    return 'vehicle'; // default
  }

  // R2 Storage integration
  async uploadProtocolFile(
    protocolId: string, 
    file: Buffer, 
    filename: string, 
    contentType: string,
    mediaType: 'vehicle-images' | 'document-images' | 'damage-images' | 'vehicle-videos' = 'vehicle-images'
  ): Promise<string> {
    try {
      // ✅ POUŽIJ NOVÉ R2 METÓDY S LEPŠOU ORGANIZÁCIOU
      const fileKey = r2Storage.generateProtocolMediaKey(protocolId, mediaType, filename);
      const url = await r2Storage.uploadFile(fileKey, file, contentType, {
        protocol_id: protocolId,
        media_type: mediaType,
        uploaded_at: new Date().toISOString()
      });
      
      console.log(`✅ Protocol ${mediaType} uploaded to R2:`, url);
      return url;
    } catch (error) {
      console.error(`❌ Error uploading protocol ${mediaType} to R2:`, error);
      throw error;
    }
  }

  async uploadProtocolPDF(protocolId: string, pdfBuffer: Buffer, protocolType: 'handover' | 'return' = 'handover'): Promise<string> {
    try {
      // ✅ POUŽIJ NOVÉ R2 METÓDY PRE PDF
      const fileKey = r2Storage.generateProtocolPDFKey(protocolId, protocolType);
      
      const url = await r2Storage.uploadFile(fileKey, pdfBuffer, 'application/pdf', {
        protocol_id: protocolId,
        protocol_type: protocolType,
        file_type: 'pdf',
        uploaded_at: new Date().toISOString()
      });
      
      console.log(`✅ Protocol PDF (${protocolType}) uploaded to R2:`, url);
      return url;
    } catch (error) {
      console.error(`❌ Error uploading protocol PDF (${protocolType}) to R2:`, error);
      throw error;
    }
  }

  // PROTOCOLS METHODS
  async initProtocolTables(): Promise<void> {
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
        } catch (columnError) {
          console.log('⚠️ Column migration failed (columns might already exist):', columnError);
        }
        
        console.log('✅ Protocol tables migration completed');
      } catch (migrationError) {
        console.log('⚠️ Protocol tables migration failed (tables might already be migrated):', migrationError);
      }

      console.log('✅ Protocol tables initialized successfully');

    } catch (error) {
      console.error('❌ Error initializing protocol tables:', error);
      throw error;
    } finally {
      client.release();
    }
  }

  // HANDOVER PROTOCOLS
  async createHandoverProtocol(protocolData: any): Promise<any> {
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
        protocolData.rentalId,
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
      
      const mappedProtocol = this.mapHandoverProtocolFromDB(row);
      console.log('✅ Mapped protocol pdfUrl:', mappedProtocol.pdfUrl);
      console.log('✅ Mapped protocol media:', {
        vehicleImages: mappedProtocol.vehicleImages?.length || 0,
        vehicleVideos: mappedProtocol.vehicleVideos?.length || 0,
        documentImages: mappedProtocol.documentImages?.length || 0,
        damageImages: mappedProtocol.damageImages?.length || 0
      });
      
      return mappedProtocol;
    } catch (error) {
      console.error('❌ Error creating handover protocol:', error);
      console.error('❌ Error details:', error instanceof Error ? error.message : 'Unknown error');
      console.error('❌ Error stack:', error instanceof Error ? error.stack : 'No stack trace');
      throw error;
    } finally {
      client.release();
    }
  }

  async getHandoverProtocolsByRental(rentalId: string): Promise<any[]> {
    const client = await this.pool.connect();
    try {
      await this.initProtocolTables();
      
      const result = await client.query(`
        SELECT * FROM handover_protocols 
        WHERE rental_id = $1::uuid 
        ORDER BY created_at DESC
      `, [rentalId]);

      return result.rows.map(row => this.mapHandoverProtocolFromDB(row));

    } catch (error) {
      console.error('❌ Error fetching handover protocols:', error);
      return [];
    } finally {
      client.release();
    }
  }

  async getHandoverProtocolById(id: string): Promise<any | null> {
    const client = await this.pool.connect();
    try {
      await this.initProtocolTables();
      
      const result = await client.query(`
        SELECT * FROM handover_protocols WHERE id = $1::uuid
      `, [id]);

      if (result.rows.length === 0) return null;
      return this.mapHandoverProtocolFromDB(result.rows[0]);

    } catch (error) {
      console.error('❌ Error fetching handover protocol:', error);
      return null;
    } finally {
      client.release();
    }
  }

  // RETURN PROTOCOLS
  async createReturnProtocol(protocolData: any): Promise<any> {
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
      
      return this.mapReturnProtocolFromDB(row);
    } catch (error) {
      console.error('❌ Error creating return protocol:', error);
      throw error;
    } finally {
      client.release();
    }
  }

  async getReturnProtocolsByRental(rentalId: string): Promise<any[]> {
    const client = await this.pool.connect();
    try {
      await this.initProtocolTables();
      
      const result = await client.query(`
        SELECT * FROM return_protocols 
        WHERE rental_id = $1::uuid 
        ORDER BY created_at DESC
      `, [rentalId]);

      return result.rows.map(row => this.mapReturnProtocolFromDB(row));

    } catch (error) {
      console.error('❌ Error fetching return protocols:', error);
      return [];
    } finally {
      client.release();
    }
  }

  async getReturnProtocolById(id: string): Promise<any | null> {
    const client = await this.pool.connect();
    try {
      await this.initProtocolTables();
      
      const result = await client.query(`
        SELECT * FROM return_protocols WHERE id = $1::uuid
      `, [id]);

      if (result.rows.length === 0) return null;
      return this.mapReturnProtocolFromDB(result.rows[0]);

    } catch (error) {
      console.error('❌ Error fetching return protocol:', error);
      return null;
    } finally {
      client.release();
    }
  }

  async updateReturnProtocol(id: string, updateData: any): Promise<any> {
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

      if (result.rows.length === 0) return null;
      return this.mapReturnProtocolFromDB(result.rows[0]);

    } catch (error) {
      console.error('❌ Error updating return protocol:', error);
      throw error;
    } finally {
      client.release();
    }
  }

  // Mapping methods
  private mapHandoverProtocolFromDB(row: any): any {
    // Safe JSON parsing function for JSONB fields
    const safeJsonParse = (value: any, fallback: any = []) => {
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
          } catch (error) {
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
        } catch (error) {
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

  private mapReturnProtocolFromDB(row: any): any {
    // Safe JSON parsing function for JSONB fields
    const safeJsonParse = (value: any, fallback: any = []) => {
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
        } catch (error) {
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
  async deleteHandoverProtocol(id: string): Promise<boolean> {
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
        await r2Storage.deleteProtocolFiles(id);
        console.log(`✅ Protocol files deleted from R2: ${id}`);
      } catch (error) {
        console.error(`❌ Error deleting protocol files from R2: ${error}`);
        // Pokračujeme aj keď sa súbory nevymazali
      }
      
      console.log(`✅ Handover protocol deleted successfully: ${id}`);
      return true;
    } catch (error) {
      console.error('❌ Error deleting handover protocol:', error);
      return false;
    } finally {
      client.release();
    }
  }

  async deleteReturnProtocol(id: string): Promise<boolean> {
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
        await r2Storage.deleteProtocolFiles(id);
        console.log(`✅ Protocol files deleted from R2: ${id}`);
      } catch (error) {
        console.error(`❌ Error deleting protocol files from R2: ${error}`);
        // Pokračujeme aj keď sa súbory nevymazali
      }
      
      console.log(`✅ Return protocol deleted successfully: ${id}`);
      return true;
    } catch (error) {
      console.error('❌ Error deleting return protocol:', error);
      return false;
    } finally {
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
  async updateHandoverProtocol(id: string, updateData: any): Promise<any> {
    const client = await this.pool.connect();
    try {
      console.log('🔄 Updating handover protocol:', id);
      console.log('🔄 Update data:', JSON.stringify(updateData, null, 2));

      // Dynamické vytvorenie SET klauzuly
      const setFields: string[] = [];
      const values: any[] = [];
      let paramIndex = 1;

      // Mapovanie polí
      const fieldMappings: { [key: string]: string } = {
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
                     } else if (key === 'completedAt' && value) {
             values.push(new Date(value as string | number | Date));
           } else {
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

    } catch (error) {
      console.error('❌ Error updating handover protocol:', error);
      throw error;
    } finally {
      client.release();
    }
  }

  // ========================================
  // VEHICLE UNAVAILABILITY CRUD METHODS
  // ========================================

  async getVehicleUnavailabilities(vehicleId?: string, startDate?: Date, endDate?: Date): Promise<any[]> {
    const client = await this.pool.connect();
    try {
      let query = `
        SELECT vu.*, v.brand, v.model, v.license_plate 
        FROM vehicle_unavailability vu
        LEFT JOIN vehicles v ON vu.vehicle_id = v.id
        WHERE 1=1
      `;
      const params: any[] = [];
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
    } finally {
      client.release();
    }
  }

  async getVehicleUnavailability(id: string): Promise<any | null> {
    const client = await this.pool.connect();
    try {
      const result = await client.query(`
        SELECT vu.*, v.brand, v.model, v.license_plate 
        FROM vehicle_unavailability vu
        LEFT JOIN vehicles v ON vu.vehicle_id = v.id
        WHERE vu.id = $1
      `, [id]);
      
      if (result.rows.length === 0) return null;
      
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
    } finally {
      client.release();
    }
  }

  async createVehicleUnavailability(data: {
    vehicleId: string;
    startDate: Date;
    endDate: Date;
    reason: string;
    type?: string;
    notes?: string;
    priority?: number;
    recurring?: boolean;
    recurringConfig?: any;
    createdBy?: string;
  }): Promise<any> {
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
    } finally {
      client.release();
    }
  }

  async updateVehicleUnavailability(id: string, data: Partial<{
    startDate: Date;
    endDate: Date;
    reason: string;
    type: string;
    notes: string;
    priority: number;
    recurring: boolean;
    recurringConfig: any;
  }>): Promise<any> {
    const client = await this.pool.connect();
    try {
      // Build dynamic update query
      const setFields: string[] = [];
      const values: any[] = [];
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
          } else {
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
    } finally {
      client.release();
    }
  }

  async deleteVehicleUnavailability(id: string): Promise<boolean> {
    const client = await this.pool.connect();
    try {
      const result = await client.query(
        'DELETE FROM vehicle_unavailability WHERE id = $1',
        [id]
      );
      
      return (result.rowCount || 0) > 0;
    } finally {
      client.release();
    }
  }

  // Get unavailabilities for specific date range (for calendar)
  async getUnavailabilitiesForDateRange(startDate: Date, endDate: Date): Promise<any[]> {
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
    } finally {
      client.release();
    }
  }

  // Metódy pre evidenciu platnosti vozidiel
  async getVehicleDocuments(vehicleId?: string): Promise<VehicleDocument[]> {
    const client = await this.pool.connect();
    try {
      let query = 'SELECT * FROM vehicle_documents';
      let params: any[] = [];

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
    } finally {
      client.release();
    }
  }

  async createVehicleDocument(documentData: {
    vehicleId: string;
    documentType: string;
    validFrom?: Date;
    validTo: Date;
    documentNumber?: string;
    price?: number;
    notes?: string;
    filePath?: string;
  }): Promise<VehicleDocument> {
    const client = await this.pool.connect();
    try {
      const result = await client.query(
        `INSERT INTO vehicle_documents (vehicle_id, document_type, valid_from, valid_to, document_number, price, notes, file_path) 
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8) 
         RETURNING id, vehicle_id, document_type, valid_from, valid_to, document_number, price, notes, file_path, created_at`,
        [documentData.vehicleId, documentData.documentType, documentData.validFrom, documentData.validTo, documentData.documentNumber, documentData.price, documentData.notes, documentData.filePath || null]
      );

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
    } finally {
      client.release();
    }
  }

  async updateVehicleDocument(id: string, documentData: {
    vehicleId: string;
    documentType: string;
    validFrom?: Date;
    validTo: Date;
    documentNumber?: string;
    price?: number;
    notes?: string;
    filePath?: string;
  }): Promise<VehicleDocument> {
    const client = await this.pool.connect();
    try {
      const result = await client.query(
        `UPDATE vehicle_documents 
         SET vehicle_id = $1, document_type = $2, valid_from = $3, valid_to = $4, document_number = $5, price = $6, notes = $7, file_path = $8, updated_at = CURRENT_TIMESTAMP 
         WHERE id = $9 
         RETURNING id, vehicle_id, document_type, valid_from, valid_to, document_number, price, notes, file_path, created_at, updated_at`,
        [documentData.vehicleId, documentData.documentType, documentData.validFrom, documentData.validTo, documentData.documentNumber, documentData.price, documentData.notes, documentData.filePath || null, id]
      );

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
    } finally {
      client.release();
    }
  }

  async deleteVehicleDocument(id: string): Promise<void> {
    const client = await this.pool.connect();
    try {
      await client.query('DELETE FROM vehicle_documents WHERE id = $1', [id]);
    } finally {
      client.release();
    }
  }

  // Metódy pre poistné udalosti
  async getInsuranceClaims(vehicleId?: string): Promise<InsuranceClaim[]> {
    const client = await this.pool.connect();
    try {
      let query = 'SELECT * FROM insurance_claims';
      let params: any[] = [];

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
    } finally {
      client.release();
    }
  }

  async createInsuranceClaim(claimData: {
    vehicleId: string;
    insuranceId?: string;
    incidentDate: Date;
    description: string;
    location?: string;
    incidentType: string;
    estimatedDamage?: number;
    deductible?: number;
    payoutAmount?: number;
    status?: string;
    claimNumber?: string;
    filePaths?: string[];
    policeReportNumber?: string;
    otherPartyInfo?: string;
    notes?: string;
  }): Promise<InsuranceClaim> {
    const client = await this.pool.connect();
    try {
      const result = await client.query(
        `INSERT INTO insurance_claims (vehicle_id, insurance_id, incident_date, description, location, incident_type, estimated_damage, deductible, payout_amount, status, claim_number, file_paths, police_report_number, other_party_info, notes) 
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15) 
         RETURNING id, vehicle_id, insurance_id, incident_date, reported_date, claim_number, description, location, incident_type, estimated_damage, deductible, payout_amount, status, file_paths, police_report_number, other_party_info, notes, created_at`,
        [
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
        ]
      );

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
    } finally {
      client.release();
    }
  }

  async updateInsuranceClaim(id: string, claimData: {
    vehicleId: string;
    insuranceId?: string;
    incidentDate: Date;
    description: string;
    location?: string;
    incidentType: string;
    estimatedDamage?: number;
    deductible?: number;
    payoutAmount?: number;
    status?: string;
    claimNumber?: string;
    filePaths?: string[];
    policeReportNumber?: string;
    otherPartyInfo?: string;
    notes?: string;
  }): Promise<InsuranceClaim> {
    const client = await this.pool.connect();
    try {
      const result = await client.query(
        `UPDATE insurance_claims 
         SET vehicle_id = $1, insurance_id = $2, incident_date = $3, description = $4, location = $5, incident_type = $6, estimated_damage = $7, deductible = $8, payout_amount = $9, status = $10, claim_number = $11, file_paths = $12, police_report_number = $13, other_party_info = $14, notes = $15, updated_at = CURRENT_TIMESTAMP 
         WHERE id = $16 
         RETURNING id, vehicle_id, insurance_id, incident_date, reported_date, claim_number, description, location, incident_type, estimated_damage, deductible, payout_amount, status, file_paths, police_report_number, other_party_info, notes, created_at, updated_at`,
        [
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
        ]
      );

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
    } finally {
      client.release();
    }
  }

  async deleteInsuranceClaim(id: string): Promise<void> {
    const client = await this.pool.connect();
    try {
      await client.query('DELETE FROM insurance_claims WHERE id = $1', [id]);
    } finally {
      client.release();
    }
  }

  // 🔧 ADMIN UTILITY - Assign vehicles to company
  async assignVehiclesToCompany(vehicleIds: string[], companyId: string): Promise<void> {
    const client = await this.pool.connect();
    try {
      for (const vehicleId of vehicleIds) {
        await client.query(
          'UPDATE vehicles SET owner_company_id = $1 WHERE id = $2',
          [companyId, vehicleId]
        );
      }
    } finally {
      client.release();
    }
  }

  // Nové metódy pre správu práv používateľov
  async getUserPermissions(userId: string): Promise<UserPermission[]> {
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
    } finally {
      client.release();
    }
  }

  async getUserCompanyAccess(userId: string): Promise<UserCompanyAccess[]> {
    const client = await this.pool.connect();
    try {
      console.log('🔍 getUserCompanyAccess called for userId:', userId);
      
      const result = await client.query(`
        SELECT up.company_id, c.name as company_name, up.permissions
        FROM user_permissions up
        JOIN companies c ON up.company_id = c.id
        WHERE up.user_id = $1
        ORDER BY c.name
        `, [userId]);

      console.log('🔍 getUserCompanyAccess result:', {
        userId,
        rowCount: result.rows.length,
        companies: result.rows.map(r => ({ companyId: r.company_id, companyName: r.company_name }))
      });

      return result.rows.map(row => ({
        companyId: row.company_id,
        companyName: row.company_name,
        permissions: row.permissions
      }));
    } finally {
      client.release();
    }
  }

  async setUserPermission(userId: string, companyId: string, permissions: CompanyPermissions): Promise<void> {
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
    } finally {
      client.release();
    }
  }

  async removeUserPermission(userId: string, companyId: string): Promise<void> {
    const client = await this.pool.connect();
    try {
      await client.query(
        'DELETE FROM user_permissions WHERE user_id = $1 AND company_id = $2',
        [userId, companyId]
      );
    } finally {
      client.release();
    }
  }

  async hasPermission(userId: string, companyId: string, resource: string, action: string): Promise<boolean> {
    const client = await this.pool.connect();
    try {
      const result = await client.query(`
        SELECT permissions->$3->$4 as permission
        FROM user_permissions
        WHERE user_id = $1 AND company_id = $2
      `, [userId, companyId, resource, action]);

      if (result.rows.length === 0) return false;
      
      const permission = result.rows[0].permission;
      return permission === true;
    } finally {
      client.release();
    }
  }

  async getUsersWithCompanyAccess(companyId: string): Promise<{userId: string, username: string, permissions: CompanyPermissions}[]> {
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
    } finally {
      client.release();
    }
  }

  // 🗑️ ADMIN FUNCTIONS
  async resetDatabase(): Promise<number> {
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
    } finally {
      client.release();
    }
  }

  // 🔄 COMPANY MAPPING FUNCTIONS
  async getCompanyIdByName(companyName: string): Promise<string | null> {
    const client = await this.pool.connect();
    try {
      // 1. Skús najprv presný názov
      const exactResult = await client.query('SELECT id FROM companies WHERE name = $1', [companyName]);
      if (exactResult.rows.length > 0) {
        console.log(`✅ Company found (exact): "${companyName}" ID: ${exactResult.rows[0].id}`);
        return exactResult.rows[0].id;
      }

      // 2. Ak nenájdem presný názov, vytvor novú firmu
      console.log(`⚠️ Company "${companyName}" not found, creating new one...`);
      const insertResult = await client.query(
        'INSERT INTO companies (name, created_at, updated_at) VALUES ($1, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP) RETURNING id',
        [companyName]
      );
      
      const newCompanyId = insertResult.rows[0].id;
      console.log(`✅ Company created: "${companyName}" ID: ${newCompanyId}`);
      return newCompanyId;
      
    } catch (error) {
      console.error(`❌ Error getting/creating company "${companyName}":`, error);
      return null;
    } finally {
      client.release();
    }
  }

  async getCompanyNameById(companyId: string): Promise<string | null> {
    const client = await this.pool.connect();
    try {
      const result = await client.query('SELECT name FROM companies WHERE id = $1', [companyId]);
      return result.rows.length > 0 ? result.rows[0].name : null;
    } finally {
      client.release();
    }
  }

  async getAllCompanies(): Promise<{id: string, name: string}[]> {
    const client = await this.pool.connect();
    try {
      const result = await client.query('SELECT id, name FROM companies ORDER BY name');
      return result.rows.map(row => ({
        id: row.id,
        name: row.name
      }));
    } finally {
      client.release();
    }
  }


}

export const postgresDatabase = new PostgresDatabase(); 