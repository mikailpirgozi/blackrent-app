import bcrypt from 'bcryptjs';
import type { PoolClient } from 'pg';
import { Pool } from 'pg';
import type { Company, CompanyDocument, CompanyInvestor, CompanyInvestorShare, CompanyPermissions, Customer, Expense, ExpenseCategory, HandoverProtocol, Insurance, InsuranceClaim, Insurer, RecurringExpense, Rental, ReturnProtocol, Settlement, User, UserCompanyAccess, UserPermission, Vehicle, VehicleDocument, VehicleUnavailability } from '../types';
import { logger } from '../utils/logger';
import { r2Storage } from '../utils/r2-storage';

// Helper function to convert unknown error to typed error
function toError(error: unknown): Error & { code?: string } {
  if (error instanceof Error) {
    return error as Error & { code?: string };
  }
  return new Error(String(error)) as Error & { code?: string };
}

// Helper function to safely convert unknown to string
function toString(value: unknown): string {
  if (value === null || value === undefined) return '';
  return String(value);
}

// Helper function to safely convert unknown to number
function toNumber(value: unknown): number {
  if (value === null || value === undefined) return 0;
  const num = Number(value);
  return isNaN(num) ? 0 : num;
}


export class PostgresDatabase {
  private pool: Pool;
  private protocolTablesInitialized: boolean = false;
  
  // Public getter for cleanup operations
  get dbPool(): Pool {
    return this.pool;
  }

  // ⚡ PERFORMANCE CACHE: Permission caching pre getUserCompanyAccess
  private permissionCache = new Map<string, {
    data: UserCompanyAccess[];
    timestamp: number;
  }>();
  private readonly PERMISSION_CACHE_TTL = 5 * 60 * 1000; // 5 minút

  // 🚀 FÁZA 1.3: VEHICLE CACHING - vozidlá sa menia zriedka, môžeme cachovať
  private vehicleCache: {
    data: Vehicle[];
    timestamp: number;
  } | null = null;
  private readonly VEHICLE_CACHE_TTL = 10 * 60 * 1000; // 10 minút

  // 🚀 FÁZA 2.2: CONNECTION REUSE pre calendar API
  private calendarConnection: PoolClient | null = null;
  private calendarConnectionLastUsed: number = 0;
  private readonly CONNECTION_REUSE_TIMEOUT = 60000; // 1 minúta

  // 🚀 FÁZA 2.3: SMART CACHING LAYER - hierarchical cache system
  private calendarCache = new Map<string, {
    data: Record<string, unknown>;
    timestamp: number;
    dateRange: { start: Date; end: Date };
  }>();
  private readonly CALENDAR_CACHE_TTL = 5 * 60 * 1000; // 5 minút

  private unavailabilityCache = new Map<string, {
    data: Record<string, unknown>[];
    timestamp: number;
  }>();
  private readonly UNAVAILABILITY_CACHE_TTL = 3 * 60 * 1000; // 3 minúty

  constructor() {
    // 🚀 FÁZA 2.2: OPTIMALIZED CONNECTION POOL pre produkčné škálovanie
    const poolConfig = {
      // Railway optimalizácie - zvýšené timeouty pre stabilitu
      max: 10, // Ešte viac znížené pre Railway stability 
      min: 1,  // Minimálne 1 connection ready
      idleTimeoutMillis: 120000, // 120s - ešte dlhšie pre stabilitu
      connectionTimeoutMillis: 15000, // 15s - ešte dlhší timeout pre Railway
      acquireTimeoutMillis: 12000, // 12s pre získanie connection
      allowExitOnIdle: false, // Zakázané pre stabilitu
      // Keepalive pre produkciu - agresívnejšie
      keepAlive: true,
      keepAliveInitialDelayMillis: 10000, // 10s delay
      // Performance tuning - maximálne zvýšené pre Railway stabilitu
      statement_timeout: 180000, // 180s statement timeout  
      query_timeout: 150000, // 150s query timeout (enough for IMAP operations)
    };

    // Railway.app provides DATABASE_URL
    if (process.env.DATABASE_URL) {
      this.pool = new Pool({
        connectionString: process.env.DATABASE_URL,
        ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
        ...poolConfig
      });
    } else {
      // Local development or manual config
    this.pool = new Pool({
      user: process.env.DB_USER || 'postgres',
      host: process.env.DB_HOST || 'localhost',
      database: process.env.DB_NAME || 'blackrent',
      password: process.env.DB_PASSWORD || 'password',
      port: parseInt(process.env.DB_PORT || '5432'),
      // 🕐 TIMEZONE FIX: Nastavenie timezone na UTC pre konzistentné zobrazenie času
      options: '-c timezone=UTC',
      ...poolConfig
    });
    }

    // 🔄 CONNECTION ERROR HANDLING - automatické reconnection
    this.pool.on('error', (err) => {
      logger.error('🚨 DATABASE POOL ERROR:', err);
      logger.info('🔄 Attempting to reconnect to database...');
      
      // Restart pool po chybe
      setTimeout(() => {
        logger.info('🔄 Reinitializing database connection...');
        this.initTables().catch(console.error);
      }, 5000);
    });

    this.pool.on('connect', () => {
      logger.info('✅ Database connection established');
    });

    this.pool.on('remove', () => {
      logger.info('🔌 Database connection removed from pool');
    });

    this.initTables().catch(console.error); // Spustenie pre aktualizáciu schémy
    
    // 🚀 FÁZA 2.2: Connection cleanup job (každých 2 minúty)
    setInterval(() => {
      const now = Date.now();
      if (this.calendarConnection && 
          (now - this.calendarConnectionLastUsed) > this.CONNECTION_REUSE_TIMEOUT) {
        logger.db('🧹 CLEANUP: Releasing unused calendar connection');
        this.releaseReusableConnection(true);
      }
    }, 2 * 60 * 1000); // Každé 2 minúty

    // 🚀 FÁZA 2.3: Smart cache cleanup job (každých 5 minút)
    setInterval(() => {
      this.cleanupExpiredCache();
    }, 5 * 60 * 1000); // Každých 5 minút
  }

  // 🔄 ENHANCED RETRY MECHANISM pre Railway PostgreSQL stability
  private async executeWithEnhancedRetry<T>(
    operation: (client: PoolClient) => Promise<T>,
    maxRetries: number = 3,
    baseDelay: number = 1000
  ): Promise<T> {
    let lastError: Error = new Error('Unknown database error');
    
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      let client: PoolClient | null = null;
      
      try {
        client = await this.pool.connect();
        const result = await operation(client);
        return result;
      } catch (error: unknown) {
        const errorObj = toError(error);
        lastError = errorObj;
        
        // Log error details
        logger.error(`🚨 Database operation failed (attempt ${attempt}/${maxRetries}):`, {
          error: errorObj.message,
          code: errorObj.code,
          attempt,
          maxRetries
        });
        
        // Check if it's a connection error
        const isConnectionError = errorObj.message?.includes('Connection terminated') ||
                                 errorObj.message?.includes('connection') ||
                                 errorObj.code === 'ECONNRESET' ||
                                 errorObj.code === 'ENOTFOUND' ||
                                 errorObj.code === 'ETIMEDOUT';
        
        if (isConnectionError && attempt < maxRetries) {
          const delay = baseDelay * Math.pow(2, attempt - 1); // Exponential backoff
          logger.info(`🔄 Retrying in ${delay}ms... (${attempt}/${maxRetries})`);
          await new Promise(resolve => setTimeout(resolve, delay));
        } else if (!isConnectionError) {
          // Non-connection errors should not be retried
          throw error;
        }
      } finally {
        if (client) {
          try {
            client.release();
          } catch (releaseError) {
            logger.error('🚨 Error releasing client:', releaseError);
          }
        }
      }
    }
    
    // All retries failed
    logger.error('🚨 All database retry attempts failed');
    throw lastError;
  }

  // 📧 HELPER: Public query method pre webhook funcionalitu
  async query(sql: string, params: unknown[] = []): Promise<unknown> {
    return this.executeWithEnhancedRetry(async (client) => {
      return await client.query(sql, params);
    });
  }

  // 🛡️ RETRY MECHANISM: Automatický retry pre databázové operácie
  private async executeWithRetry<T>(
    operation: (client: PoolClient) => Promise<T>,
    maxRetries: number = 3,
    retryDelay: number = 1000
  ): Promise<T> {
    let lastError: Error | undefined;
    
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      let client: PoolClient | null = null;
      
      try {
        client = await this.pool.connect();
        const result = await operation(client);
        return result;
      } catch (error: unknown) {
        lastError = error instanceof Error ? error : new Error(String(error));
        
        // Check if it's a connection error that we should retry
        const errorObj = toError(error);
        const isConnectionError = 
          errorObj?.message?.includes('Connection terminated') ||
          errorObj?.message?.includes('ECONNRESET') ||
          errorObj?.message?.includes('connection closed') ||
          errorObj?.code === 'ECONNRESET' ||
          errorObj?.code === '57P01'; // PostgreSQL connection error
        
        if (isConnectionError && attempt < maxRetries) {
          logger.error(`🔄 Database connection error (attempt ${attempt}/${maxRetries}):`, errorObj?.message || 'Unknown error');
          
          // Wait before retry with exponential backoff
          const delay = retryDelay * Math.pow(2, attempt - 1);
          await new Promise(resolve => setTimeout(resolve, delay));
          continue;
        }
        
        // If it's not a connection error or we've exhausted retries, throw
        throw error;
      } finally {
        if (client) {
          try {
            client.release();
          } catch (releaseError) {
            logger.error('Error releasing database client:', releaseError);
          }
        }
      }
    }
    
    throw lastError || new Error('Unknown database error');
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
        logger.db('ℹ️ Users table columns already exist or error occurred:', error);
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
      logger.db('ℹ️ Vehicles table - using existing company_id column (integer type)');

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
        logger.db('ℹ️ Policy number column already exists or error occurred:', error);
      }

      // Pridáme stĺpec payment_frequency ak neexistuje (migrácia existujúcich tabuliek)
      try {
        await client.query(`
          ALTER TABLE insurances ADD COLUMN IF NOT EXISTS payment_frequency VARCHAR(20) NOT NULL DEFAULT 'yearly'
        `);
      } catch (error) {
        logger.db('ℹ️ Payment frequency column already exists or error occurred:', error);
      }

      // Pridáme stĺpec file_path ak neexistuje (migrácia pre file uploads)
      try {
        await client.query(`
          ALTER TABLE insurances ADD COLUMN IF NOT EXISTS file_path TEXT
        `);
      } catch (error) {
        logger.db('ℹ️ Insurance file_path column already exists or error occurred:', error);
      }

      // Migrácia na viacero súborov - pridáme file_paths array
      try {
        await client.query(`
          ALTER TABLE insurances ADD COLUMN IF NOT EXISTS file_paths TEXT[]
        `);
        
        // Migrácia existujúcich file_path do file_paths array
        await client.query(`
          UPDATE insurances 
          SET file_paths = ARRAY[file_path] 
          WHERE file_path IS NOT NULL AND file_path != '' AND file_paths IS NULL
        `);
      } catch (error) {
        logger.db('ℹ️ Insurance file_paths column migration error:', error);
      }

      // Pridáme stĺpec km_state ak neexistuje (migrácia pre Kasko poistenie)
      try {
        await client.query(`
          ALTER TABLE insurances ADD COLUMN IF NOT EXISTS km_state INTEGER
        `);
        logger.db('✅ Insurance km_state column migration completed');
      } catch (error) {
        logger.db('ℹ️ Insurance km_state column already exists or error occurred:', error);
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

      // Tabuľka dokumentov firiem (zmluvy, faktúry)
      await client.query(`
        CREATE TABLE IF NOT EXISTS company_documents (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          company_id INTEGER NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
          
          -- Typ dokumentu
          document_type VARCHAR(20) NOT NULL CHECK (document_type IN ('contract', 'invoice')),
          
          -- Kategorizácia faktúr po mesiacoch
          document_month INTEGER CHECK (document_month >= 1 AND document_month <= 12),
          document_year INTEGER CHECK (document_year >= 2020 AND document_year <= 2099),
          
          -- Základné info
          document_name VARCHAR(255) NOT NULL,
          description TEXT,
          
          -- File storage
          file_path TEXT NOT NULL,
          file_size BIGINT,
          file_type VARCHAR(100),
          original_filename VARCHAR(255),
          
          -- Audit
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          created_by UUID REFERENCES users(id)
        )
      `);

      // Indexy pre company_documents
      await client.query(`
        CREATE INDEX IF NOT EXISTS idx_company_documents_company_id ON company_documents(company_id)
      `);
      await client.query(`
        CREATE INDEX IF NOT EXISTS idx_company_documents_type ON company_documents(document_type)
      `);
      await client.query(`
        CREATE INDEX IF NOT EXISTS idx_company_documents_date ON company_documents(document_year, document_month)
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
        logger.db('ℹ️ Vehicle documents file_path column already exists or error occurred:', error);
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
      
      logger.info('✅ PostgreSQL tabuľky inicializované');
    } catch (error) {
      console.error('❌ Chyba pri inicializácii tabuliek:', error);
    } finally {
      client.release();
    }
  }

  private async runMigrations(client: PoolClient) {
    try {
      logger.migration('🔄 Spúšťam databázové migrácie...');
      
      // Migrácia 1: Pridanie chýbajúcich stĺpcov do vehicles (bez NOT NULL)
      try {
        logger.migration('📋 Migrácia 1: Pridávanie stĺpcov do vehicles...');
        await client.query(`
          ALTER TABLE vehicles 
          ADD COLUMN IF NOT EXISTS company VARCHAR(100) DEFAULT 'Default Company',
          ADD COLUMN IF NOT EXISTS pricing JSONB DEFAULT '[]',
          ADD COLUMN IF NOT EXISTS commission JSONB DEFAULT '{"type": "percentage", "value": 20}',
          ADD COLUMN IF NOT EXISTS status VARCHAR(30) DEFAULT 'available';
        `);
        logger.migration('✅ Migrácia 1: Stĺpce do vehicles pridané');
      } catch (error: unknown) {
        const errorObj = toError(error);
        logger.migration('⚠️ Migrácia 1 chyba:', errorObj.message);
      }
      
      // Migrácia 2: Pridanie základných polí do rentals tabuľky
      try {
        logger.migration('📋 Migrácia 2: Pridávanie stĺpcov do rentals...');
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
        logger.migration('✅ Migrácia 2: Stĺpce do rentals pridané');
      } catch (error: unknown) {
        const errorObj = toError(error);
        logger.migration('⚠️ Migrácia 2 chyba:', errorObj.message);
      }
      
      // Migrácia 2b: Pridanie chýbajúcich stĺpcov do customers
      try {
        logger.migration('📋 Migrácia 2b: Pridávanie stĺpcov do customers...');
        await client.query(`
          ALTER TABLE customers 
          ADD COLUMN IF NOT EXISTS name VARCHAR(100) DEFAULT 'Unknown',
          ADD COLUMN IF NOT EXISTS email VARCHAR(100),
          ADD COLUMN IF NOT EXISTS phone VARCHAR(30);
        `);
        logger.migration('✅ Migrácia 2b: Stĺpce do customers pridané');
      } catch (error: unknown) {
        const errorObj = toError(error);
        logger.migration('⚠️ Migrácia 2b chyba:', errorObj.message);
      }
      
      // Migrácia 3: Zvýšenie limitov varchar polí
      try {
        logger.migration('📋 Migrácia 3: Zvyšovanie varchar limitov...');
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
        logger.migration('✅ Migrácia 3: VARCHAR limity aktualizované');
      } catch (error: unknown) {
        const errorObj = toError(error);
        logger.migration('⚠️ Migrácia 3 chyba:', errorObj.message);
      }
      
      // Migrácia 4: Nastavenie NOT NULL pre dôležité polia
      try {
        logger.migration('📋 Migrácia 4: Nastavovanie NOT NULL constraints...');
        await client.query(`
          UPDATE vehicles SET company = 'Default Company' WHERE company IS NULL;
        `);
        await client.query(`
          ALTER TABLE vehicles ALTER COLUMN company SET NOT NULL;
        `);
        logger.migration('✅ Migrácia 4: NOT NULL constraints nastavené');
      } catch (error: unknown) {
        const errorObj = toError(error);
        logger.migration('⚠️ Migrácia 4 chyba:', errorObj.message);
      }
      
      // Migrácia 5: Pridanie signature_template a user info stĺpcov do users tabuľky
      try {
        logger.migration('📋 Migrácia 5: Pridávanie signature_template a user info stĺpcov do users...');
        await client.query(`
          ALTER TABLE users 
          ADD COLUMN IF NOT EXISTS signature_template TEXT,
          ADD COLUMN IF NOT EXISTS first_name VARCHAR(100),
          ADD COLUMN IF NOT EXISTS last_name VARCHAR(100);
        `);
        logger.migration('✅ Migrácia 5: signature_template, first_name, last_name stĺpce pridané do users');
      } catch (error: unknown) {
        const errorObj = toError(error);
        logger.migration('⚠️ Migrácia 5 chyba:', errorObj.message);
      }
      
      // Migrácia 6: Pridanie rozšírených polí do rentals tabuľky
      try {
        logger.migration('📋 Migrácia 6: Pridávanie rozšírených polí do rentals...');
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
        logger.migration('✅ Migrácia 5: Rozšírené polia do rentals pridané');
      } catch (error: unknown) {
        const errorObj = toError(error);
        logger.migration('⚠️ Migrácia 5 chyba:', errorObj.message);
      }
      
      // Migrácia 6: Aktualizácia pricing tiers pre všetky existujúce vozidlá
      try {
        logger.migration('📋 Migrácia 6: Aktualizácia pricing tiers pre vozidlá...');
        
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
        
        logger.migration(`✅ Migrácia 6: Pricing aktualizované pre ${vehiclesResult.rows.length} vozidiel`);
      } catch (error: unknown) {
        const errorObj = toError(error);
        logger.migration('⚠️ Migrácia 6 chyba:', errorObj.message);
      }
      
      // Migrácia 7: Aktualizácia commission na 20% pre všetky vozidlá
      try {
        logger.migration('📋 Migrácia 7: Aktualizácia commission na 20%...');
        
        await client.query(`
          UPDATE vehicles 
          SET commission = '{"type": "percentage", "value": 20}'::jsonb
          WHERE commission->>'value' != '20'
        `);
        
        logger.migration(`✅ Migrácia 7: Commission aktualizovaná na 20% pre všetky vozidlá`);
      } catch (error: unknown) {
        const errorObj = toError(error);
        logger.migration('⚠️ Migrácia 7 chyba:', errorObj.message);
      }
      
      // Migrácia 8: Pridanie owner_name stĺpca do vehicles tabuľky
      try {
        logger.migration('📋 Migrácia 8: Pridávanie owner_name stĺpca do vehicles...');
        await client.query(`
          ALTER TABLE vehicles 
          ADD COLUMN IF NOT EXISTS owner_name VARCHAR(255);
        `);
        logger.migration('✅ Migrácia 8: owner_name stĺpec pridaný do vehicles tabuľky');
      } catch (error: unknown) {
        const errorObj = toError(error);
        logger.migration('⚠️ Migrácia 8 chyba:', errorObj.message);
      }
      
            // Migrácia 9: Pridanie company_id stĺpca do vehicles tabuľky
      try {
        logger.migration('📋 Migrácia 9: Pridávanie company_id stĺpca do vehicles...');
        await client.query(`
          ALTER TABLE vehicles
          ADD COLUMN IF NOT EXISTS company_id INTEGER REFERENCES companies(id);
        `);
        logger.migration('✅ Migrácia 9: company_id stĺpec pridaný do vehicles tabuľky');
      } catch (error: unknown) {
        const errorObj = toError(error);
        logger.migration('⚠️ Migrácia 9 chyba:', errorObj.message);
      }

      // Migrácia 10: Oprava company_id typu v users tabuľke z INTEGER na UUID
      try {
        logger.migration('📋 Migrácia 10: Opravujem company_id typ v users tabuľke...');
        
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
        
        logger.migration('✅ Migrácia 10: company_id typ opravený na UUID');
      } catch (error: unknown) {
        const errorObj = toError(error);
        logger.migration('⚠️ Migrácia 10 chyba:', errorObj.message);
        // Ak zlyhá konverzia, skús pridať stĺpec nanovo
        try {
          await client.query(`
            ALTER TABLE users DROP COLUMN IF EXISTS company_id;
            ALTER TABLE users ADD COLUMN company_id UUID REFERENCES companies(id);
          `);
          logger.migration('✅ Migrácia 10: company_id stĺpec znovu vytvorený ako UUID');
        } catch (retryError: unknown) {
          const retryErrorObj = toError(retryError);
          logger.migration('⚠️ Migrácia 10 retry chyba:', retryErrorObj.message);
        }
      }

      // Migrácia 11: Oprava vehicles.id typu z INTEGER na UUID
      try {
        logger.migration('📋 Migrácia 11: Opravujem vehicles.id typ z INTEGER na UUID...');
        
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
        
        logger.migration('✅ Migrácia 11: vehicles.id typ opravený na UUID');
      } catch (error: unknown) {
        const errorObj = toError(error);
        logger.migration('⚠️ Migrácia 11 chyba:', errorObj.message);
        // Ak zlyhá konverzia, skús pridať stĺpec nanovo
        try {
          await client.query(`
            ALTER TABLE vehicles DROP COLUMN IF EXISTS id;
            ALTER TABLE vehicles ADD COLUMN id UUID PRIMARY KEY DEFAULT gen_random_uuid();
          `);
          logger.migration('✅ Migrácia 11: vehicles.id stĺpec znovu vytvorený ako UUID');
        } catch (retryError: unknown) {
          const retryErrorObj = toError(retryError);
          logger.migration('⚠️ Migrácia 11 retry chyba:', retryErrorObj.message);
        }
      }

      // Migrácia 12: Oprava users.id typu z INTEGER na UUID
      try {
        logger.migration('📋 Migrácia 12: Opravujem users.id typ z INTEGER na UUID...');
        
        // Zmeň typ stĺpca z INTEGER na UUID
        await client.query(`
          ALTER TABLE users ALTER COLUMN id TYPE UUID USING id::text::uuid;
        `);
        
        logger.migration('✅ Migrácia 12: users.id typ opravený na UUID');
      } catch (error: unknown) {
        const errorObj = toError(error);
        logger.migration('⚠️ Migrácia 12 chyba:', errorObj.message);
        // Ak zlyhá konverzia, skús pridať stĺpec nanovo
        try {
          await client.query(`
            ALTER TABLE users DROP COLUMN IF EXISTS id;
            ALTER TABLE users ADD COLUMN id UUID PRIMARY KEY DEFAULT gen_random_uuid();
          `);
          logger.migration('✅ Migrácia 12: users.id stĺpec znovu vytvorený ako UUID');
        } catch (retryError: unknown) {
          const retryErrorObj = toError(retryError);
          logger.migration('⚠️ Migrácia 12 retry chyba:', retryErrorObj.message);
        }
      }
      
              // Migrácia 27: Rozšírenie VARCHAR stĺpcov pre email parsing
        try {
          logger.migration('📋 Migrácia 27: Rozširujem VARCHAR stĺpce pre email parsing...');
          
          const fieldsToExpand = [
            'customer_phone', 'order_number', 'vehicle_name', 
            'vehicle_code', 'handover_place', 'payment_method', 'customer_name'
          ];
          
          for (const field of fieldsToExpand) {
            await this.pool.query(`
              ALTER TABLE rentals 
              ALTER COLUMN ${field} TYPE VARCHAR(500)
            `);
            logger.migration(`✅ ${field} rozšírený na VARCHAR(500)`);
          }
          
        } catch (error) {
          logger.migration('⚠️ Migrácia 27 chyba:', error);
        }

        // Migrácia 28: Blacklist zamietnutých objednávok
        try {
          logger.migration('📋 Migrácia 28: Vytváram blacklist pre zamietnuté objednávky...');
          
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
          
          logger.migration('✅ Blacklist tabuľka vytvorená');
          
        } catch (error) {
          logger.migration('⚠️ Migrácia 28 chyba:', error);
        }

        // MIGRÁCIA 29: PROTOCOL V2 TABLES - Non-breaking pridanie V2 tabuliek
        try {
          logger.migration('📋 Migrácia 29: Vytváram Protocol V2 tabuľky...');
          
          // Photo derivatives table
          await client.query(`
            CREATE TABLE IF NOT EXISTS photo_derivatives (
              id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
              photo_id UUID NOT NULL,
              derivative_type VARCHAR(20) NOT NULL CHECK (derivative_type IN ('thumb', 'gallery', 'pdf')),
              url TEXT NOT NULL,
              file_size INTEGER NOT NULL DEFAULT 0,
              width INTEGER,
              height INTEGER,
              format VARCHAR(10) NOT NULL DEFAULT 'jpeg',
              quality INTEGER DEFAULT 80,
              created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
          `);
          
          await client.query(`
            CREATE INDEX IF NOT EXISTS idx_photo_derivatives_photo_id ON photo_derivatives(photo_id)
          `);
          
          await client.query(`
            CREATE UNIQUE INDEX IF NOT EXISTS idx_photo_derivatives_unique ON photo_derivatives(photo_id, derivative_type)
          `);
          
          // Protocol processing jobs table
          await client.query(`
            CREATE TABLE IF NOT EXISTS protocol_processing_jobs (
              id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
              protocol_id UUID NOT NULL,
              job_type VARCHAR(50) NOT NULL CHECK (job_type IN ('photo_processing', 'pdf_generation', 'derivative_generation')),
              job_id VARCHAR(100),
              status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed', 'cancelled')),
              progress INTEGER DEFAULT 0 CHECK (progress >= 0 AND progress <= 100),
              started_at TIMESTAMP,
              completed_at TIMESTAMP,
              error_message TEXT,
              metadata JSONB DEFAULT '{}',
              created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
              updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
          `);
          
          await client.query(`
            CREATE INDEX IF NOT EXISTS idx_protocol_jobs_protocol_id ON protocol_processing_jobs(protocol_id)
          `);
          
          await client.query(`
            CREATE INDEX IF NOT EXISTS idx_protocol_jobs_status ON protocol_processing_jobs(status)
          `);
          
          // Photo metadata V2 table
          await client.query(`
            CREATE TABLE IF NOT EXISTS photo_metadata_v2 (
              id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
              photo_id UUID NOT NULL UNIQUE,
              hash_sha256 VARCHAR(64),
              original_size INTEGER NOT NULL DEFAULT 0,
              processing_time INTEGER,
              savings_percentage DECIMAL(5,2),
              device_info JSONB DEFAULT '{}',
              exif_data JSONB DEFAULT '{}',
              processing_config JSONB DEFAULT '{}',
              version INTEGER DEFAULT 2,
              created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
              updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
          `);
          
          // Feature flags table
          await client.query(`
            CREATE TABLE IF NOT EXISTS feature_flags (
              id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
              flag_name VARCHAR(100) NOT NULL UNIQUE,
              enabled BOOLEAN NOT NULL DEFAULT false,
              percentage INTEGER DEFAULT 0 CHECK (percentage >= 0 AND percentage <= 100),
              allowed_users TEXT[],
              start_date TIMESTAMP,
              end_date TIMESTAMP,
              description TEXT,
              metadata JSONB DEFAULT '{}',
              created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
              updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
          `);
          
          // Protocol versions table
          await client.query(`
            CREATE TABLE IF NOT EXISTS protocol_versions (
              id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
              protocol_id UUID NOT NULL UNIQUE,
              version INTEGER NOT NULL DEFAULT 1 CHECK (version IN (1, 2)),
              migrated_at TIMESTAMP,
              migration_reason TEXT,
              created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
          `);
          
          // Inicializácia feature flags
          await client.query(`
            INSERT INTO feature_flags (flag_name, enabled, percentage, description) VALUES
              ('PROTOCOL_V2', false, 0, 'Hlavný V2 protokol systém'),
              ('PROTOCOL_V2_PHOTO_PROCESSING', false, 0, 'V2 photo processing s derivatívami'),
              ('PROTOCOL_V2_PDF_GENERATION', false, 0, 'V2 PDF generovanie s queue'),
              ('PROTOCOL_V2_QUEUE_SYSTEM', false, 0, 'Background queue processing')
            ON CONFLICT (flag_name) DO NOTHING
          `);
          
          logger.migration('✅ Migrácia 29: Protocol V2 tabuľky úspešne vytvorené');
        } catch (error) {
          logger.migration('⚠️ Migrácia 29 chyba:', error);
        }

        // Migrácia 30: Vytvorenie expense_categories tabuľky pre dynamické kategórie nákladov
        try {
          logger.migration('📋 Migrácia 30: Vytváram expense_categories tabuľku...');
          
          // Vytvor expense_categories tabuľku
          await client.query(`
            CREATE TABLE IF NOT EXISTS expense_categories (
              id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
              name VARCHAR(100) NOT NULL UNIQUE,
              display_name VARCHAR(255) NOT NULL,
              description TEXT,
              icon VARCHAR(50) NOT NULL DEFAULT 'receipt',
              color VARCHAR(20) NOT NULL DEFAULT 'primary' CHECK (color IN ('primary', 'secondary', 'success', 'error', 'warning', 'info')),
              is_default BOOLEAN NOT NULL DEFAULT false,
              is_active BOOLEAN NOT NULL DEFAULT true,
              sort_order INTEGER NOT NULL DEFAULT 0,
              created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
              updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
              created_by UUID
            )
          `);
          
          // Vytvor indexy pre performance
          await client.query(`
            CREATE INDEX IF NOT EXISTS idx_expense_categories_name ON expense_categories(name)
          `);
          await client.query(`
            CREATE INDEX IF NOT EXISTS idx_expense_categories_active ON expense_categories(is_active)
          `);
          await client.query(`
            CREATE INDEX IF NOT EXISTS idx_expense_categories_sort ON expense_categories(sort_order)
          `);
          
          // Pridaj základné kategórie ak tabuľka je prázdna
          const existingCategories = await client.query('SELECT COUNT(*) as count FROM expense_categories');
          if (parseInt(existingCategories.rows[0].count) === 0) {
            logger.migration('📋 Pridávam základné kategórie nákladov...');
            
            await client.query(`
              INSERT INTO expense_categories (name, display_name, description, icon, color, is_default, sort_order) VALUES
              ('service', 'Servis', 'Servisné práce a opravy vozidiel', 'build', 'primary', true, 1),
              ('insurance', 'Poistenie', 'Poistné a poistné udalosti', 'security', 'info', true, 2),
              ('fuel', 'Palivo', 'Náklady na palivo', 'local_gas_station', 'warning', true, 3),
              ('prenajmy', 'Prenájmy', 'Náklady súvisiace s prenájmom vozidiel', 'directions_car', 'success', false, 4),
              ('vyplaty', 'Výplaty', 'Mzdy a odmeny pre zamestnancov', 'payments', 'secondary', false, 5),
              ('other', 'Ostatné', 'Ostatné náklady', 'category', 'primary', true, 6)
            `);
            
            logger.migration('✅ Základné kategórie pridané');
          }
          
          logger.migration('✅ Migrácia 30: expense_categories tabuľka úspešne vytvorená');
        } catch (error) {
          logger.migration('⚠️ Migrácia 30 chyba:', error);
        }

        logger.migration('✅ Databázové migrácie úspešne dokončené');
      
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
        logger.migration('📋 Migrácia 14: Final Company Cleanup...');
        
        // 14.1: Odstráň owner_name z vehicles (nie je potrebné)
        logger.migration('📋 14.1: Odstraňujem owner_name z vehicles...');
        try {
          await client.query('ALTER TABLE vehicles DROP COLUMN IF EXISTS owner_name');
          logger.migration('   ✅ vehicles.owner_name odstránené');
        } catch (e: unknown) {
          logger.migration('   ⚠️ vehicles.owner_name už neexistuje');
        }
        
        // 14.2: Priradenie company všetkým používateľom (Lubka ako default)
        logger.migration('📋 14.2: Priradenie company všetkým používateľom...');
        const lubkaId = await this.getCompanyIdByName('Lubka');
        
        if (lubkaId) {
          const result = await client.query(`
            UPDATE users 
            SET company_id = $1 
            WHERE company_id IS NULL
          `, [lubkaId]);
          
          logger.migration(`   ✅ ${result.rowCount} používateľov priradených k Lubka company`);
        } else {
          logger.migration('   ⚠️ Lubka company nenájdená');
        }
        
        // 14.3: Skontroluj že všetko má company assignment
        logger.migration('📋 14.3: Kontrola company assignments...');
        
        const usersWithoutCompany = await client.query('SELECT COUNT(*) FROM users WHERE company_id IS NULL');
        logger.migration(`   Users bez company: ${usersWithoutCompany.rows[0].count}`);
        
        const vehiclesWithCompany = await client.query('SELECT COUNT(*) FROM vehicles WHERE company IS NOT NULL');
        logger.migration(`   Vehicles s company: ${vehiclesWithCompany.rows[0].count}`);
        
        logger.migration('✅ Migrácia 14: Final Company Cleanup dokončená');
        
      } catch (error: unknown) {
        const errorObj = toError(error);
        logger.migration('⚠️ Migrácia 14 chyba:', errorObj.message);
      }
      
      // ❌ MIGRÁCIA 15 ZMAZANÁ - Spôsobovala chaos s vehicle_id remappingom ❌
      
      // Migrácia 16: Pridanie STK stĺpca do vehicles
      try {
        logger.migration('📋 Migrácia 16: Pridávanie STK stĺpca do vehicles...');
        
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
          logger.migration('   ✅ STK stĺpec pridaný do vehicles tabuľky');
        } else {
          logger.migration('   ℹ️ STK stĺpec už existuje');
        }
        
        logger.migration('✅ Migrácia 16: STK stĺpec úspešne pridaný');
        
      } catch (error: unknown) {
        const errorObj = toError(error);
        logger.migration('⚠️ Migrácia 16 chyba:', errorObj.message);
      }

      // Migrácia 17: Pridanie Foreign Key constraint pre rentals.vehicle_id
      try {
        logger.migration('📋 Migrácia 17: Pridávanie FK constraint pre rentals.vehicle_id...');
        
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
          logger.migration('   🔧 Neplatné vehicle_id nastavené na NULL');
          
          // Pridaj FK constraint
          await client.query(`
            ALTER TABLE rentals 
            ADD CONSTRAINT rentals_vehicle_id_fkey 
            FOREIGN KEY (vehicle_id) REFERENCES vehicles(id) ON DELETE SET NULL
          `);
          logger.migration('   ✅ FK constraint pridaný pre rentals.vehicle_id');
        } else {
          logger.migration('   ℹ️ FK constraint už existuje');
        }
        logger.migration('✅ Migrácia 17: FK constraint úspešne pridaný');
      } catch (error: unknown) {
        const errorObj = toError(error);
        logger.migration('⚠️ Migrácia 17 chyba:', errorObj.message);
      }

      // Migrácia 18: Vehicle Ownership History - Pre tracking zmien vlastníctva vozidiel
      try {
        logger.migration('📋 Migrácia 18: Vytváram vehicle ownership history tabuľku...');
        
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
          logger.migration('   ✅ vehicle_ownership_history tabuľka vytvorená');
          
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
          logger.migration('   ✅ Indexy pre ownership history vytvorené');
          
          // Migrácia existujúcich dát - vytvor historický záznam pre každé vozidlo
          const migratedRows = await client.query(`
            INSERT INTO vehicle_ownership_history (
              vehicle_id, 
              company_id, 
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
          logger.migration(`   ✅ ${migratedRows.rowCount} existujúcich vozidiel migrovanych do ownership history`);
          
        } else {
          logger.migration('   ℹ️ vehicle_ownership_history tabuľka už existuje');
        }
        
        logger.migration('✅ Migrácia 18: Vehicle Ownership History úspešne vytvorená');
        
      } catch (error: unknown) {
        const errorObj = toError(error);
        logger.migration('⚠️ Migrácia 18 chyba:', errorObj.message);
      }

      // Migrácia 19: Vehicle Company Snapshot - Zamrazenie historických prenájmov 🎯
      try {
        logger.migration('📋 Migrácia 19: Pridávanie vehicle_company_snapshot do rentals...');
        
        // Pridaj stĺpec pre snapshot company name
        await client.query(`
          ALTER TABLE rentals 
          ADD COLUMN IF NOT EXISTS vehicle_company_snapshot VARCHAR(255)
        `);
        
        logger.migration('   ✅ vehicle_company_snapshot stĺpec pridaný');
        
        // Migrácia existujúcich prenájmov - nastav historical ownership
        logger.migration('   🔄 Nastavujem historical ownership pre existujúce prenájmy...');
        
        const existingRentals = await client.query(`
          SELECT r.id, r.vehicle_id, r.start_date, r.vehicle_company_snapshot
          FROM rentals r 
          WHERE r.vehicle_company_snapshot IS NULL
        `);
        
        logger.migration(`   📊 Našiel som ${existingRentals.rows.length} prenájmov na migráciu`);
        
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
          } else {
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
        
        logger.migration(`   ✅ Migrácia dokončená pre ${migratedCount} prenájmov`);
        logger.migration('✅ Migrácia 19: Vehicle Company Snapshot úspešne vytvorená');
        
      } catch (error: unknown) {
        const errorObj = toError(error);
        logger.migration('⚠️ Migrácia 19 chyba:', errorObj.message);
      }

      // Migrácia 20: CLEAN SOLUTION - Nahradiť komplikovaný snapshot jednoduchým company field 🎯
      try {
        logger.migration('📋 Migrácia 20: CLEAN SOLUTION - Jednoduchý company field...');
        
        // Pridaj jednoduchý company stĺpec
        await client.query(`
          ALTER TABLE rentals 
          ADD COLUMN IF NOT EXISTS company VARCHAR(255)
        `);
        
        logger.migration('   ✅ company stĺpec pridaný');
        
        // Migrácia dát z vehicle_company_snapshot do company
        logger.migration('   🔄 Kopírujem dáta z vehicle_company_snapshot do company...');
        
        const migrateResult = await client.query(`
          UPDATE rentals 
          SET company = COALESCE(vehicle_company_snapshot, (
            SELECT v.company 
            FROM vehicles v 
            WHERE v.id = rentals.vehicle_id
          ))
          WHERE company IS NULL
        `);
        
        logger.migration(`   📊 Migrovaných ${migrateResult.rowCount} prenájmov`);
        
        // Po úspešnej migrácii môžeme odstrániť starý komplikovaný stĺpec
        logger.migration('   🧹 Odstraňujem starý vehicle_company_snapshot stĺpec...');
        
        try {
          await client.query(`ALTER TABLE rentals DROP COLUMN IF EXISTS vehicle_company_snapshot`);
          logger.migration('   ✅ vehicle_company_snapshot stĺpec odstránený');
        } catch (dropError: unknown) {
          const dropErrorObj = toError(dropError);
          logger.migration('   ⚠️ Nemožno odstrániť vehicle_company_snapshot:', dropErrorObj.message);
        }
        
        logger.migration('✅ Migrácia 20: CLEAN SOLUTION úspešne dokončená');
        
      } catch (error: unknown) {
        const errorObj = toError(error);
        logger.migration('⚠️ Migrácia 20 chyba:', errorObj.message);
      }

      // Migrácia 21: 🛡️ BULLETPROOF - Historický backfill company (NIKDY sa nezmení!) ✅
      try {
        logger.migration('📋 Migrácia 21: 🛡️ BULLETPROOF - Historické company pre prenájmy...');
        
        // Reset všetkých company na NULL pre rebackfill
        logger.migration('   🧹 Resetujem company stĺpce pre rebackfill...');
        await client.query(`UPDATE rentals SET company = NULL`);
        
        // Backfill pomocou HISTORICKEJ ownership na základe rental.startDate
        logger.migration('   📅 Backfillujem historické company na základe startDate...');
        
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
        
        logger.migration(`   📊 Backfillované ${backfillResult.rowCount} prenájmov s historickou company`);
        
        // Fallback pre prenájmy bez ownership history - použij aktuálnu company
        logger.migration('   🔄 Fallback pre prenájmy bez ownership history...');
        
        const fallbackResult = await client.query(`
          UPDATE rentals 
          SET company = (
            SELECT v.company 
            FROM vehicles v 
            WHERE v.id = rentals.vehicle_id
          )
          WHERE company IS NULL
        `);
        
        logger.migration(`   📊 Fallback ${fallbackResult.rowCount} prenájmov s aktuálnou company`);
        
        // Overenie výsledku
        const nullCompanyCount = await client.query(`
          SELECT COUNT(*) as count FROM rentals WHERE company IS NULL
        `);
        
        logger.migration(`   ✅ Zostáva ${nullCompanyCount.rows[0].count} prenájmov bez company`);
        logger.migration('✅ Migrácia 21: 🛡️ BULLETPROOF historické company FIX dokončený');
        
      } catch (error: unknown) {
        const errorObj = toError(error);
        logger.migration('⚠️ Migrácia 21 chyba:', errorObj.message);
      }

      // Migrácia 22: ⚡ PERFORMANCE INDEXY - Optimalizácia rýchlosti načítavania dát
      try {
        logger.migration('📋 Migrácia 22: ⚡ Pridávanie performance indexov pre rýchlejšie načítanie...');
        
        // 🚀 INDEX 1: rentals.vehicle_id - Pre rýchlejší JOIN v getRentals()
        await client.query(`
          CREATE INDEX IF NOT EXISTS idx_rentals_vehicle_id ON rentals(vehicle_id)
        `);
        logger.migration('   ✅ Index idx_rentals_vehicle_id pridaný');

        // 🚀 INDEX 2: vehicles.owner_company_id - Pre rýchlejšie permission filtering
        await client.query(`
          CREATE INDEX IF NOT EXISTS idx_vehicles_owner_company_id ON vehicles(owner_company_id)
        `);
        logger.migration('   ✅ Index idx_vehicles_owner_company_id pridaný');

        // 🚀 INDEX 3: rentals.created_at DESC - Pre rýchlejšie ORDER BY v getRentals()
        await client.query(`
          CREATE INDEX IF NOT EXISTS idx_rentals_created_at_desc ON rentals(created_at DESC)
        `);
        logger.migration('   ✅ Index idx_rentals_created_at_desc pridaný');

        // 🚀 INDEX 4: vehicles.created_at DESC - Pre rýchlejšie ORDER BY v getVehicles()
        await client.query(`
          CREATE INDEX IF NOT EXISTS idx_vehicles_created_at_desc ON vehicles(created_at DESC)
        `);
        logger.migration('   ✅ Index idx_vehicles_created_at_desc pridaný');

        // 🚀 INDEX 5: expenses.vehicle_id - Pre rýchlejšie queries v expense API
        await client.query(`
          CREATE INDEX IF NOT EXISTS idx_expenses_vehicle_id ON expenses(vehicle_id)
        `);
        logger.migration('   ✅ Index idx_expenses_vehicle_id pridaný');

        // 🚀 INDEX 6: expenses.date DESC - Pre rýchlejšie date filtering
        await client.query(`
          CREATE INDEX IF NOT EXISTS idx_expenses_date_desc ON expenses(date DESC)
        `);
        logger.migration('   ✅ Index idx_expenses_date_desc pridaný');

        logger.migration('✅ Migrácia 22: ⚡ Performance indexy úspešne pridané (očakávaná úspora: 30-50% rýchlosť)');
        
      } catch (error: unknown) {
        const errorObj = toError(error);
        logger.migration('⚠️ Migrácia 22 chyba:', errorObj.message);
      }

      // Migrácia 23: 🔄 FLEXIBILNÉ PRENÁJMY - Pridanie stĺpcov pre hybridný prístup
      try {
        logger.migration('📋 Migrácia 23: 🔄 Pridávanie stĺpcov pre flexibilné prenájmy...');
        
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
        
        logger.migration('   ✅ Flexibilné prenájmy stĺpce pridané do rentals tabuľky');
        
        // Vytvorenie indexu pre rýchlejšie vyhľadávanie flexibilných prenájmov
        await client.query(`
          CREATE INDEX IF NOT EXISTS idx_rentals_flexible ON rentals(is_flexible, rental_type) 
          WHERE is_flexible = true;
        `);
        
        logger.migration('   ✅ Index pre flexibilné prenájmy vytvorený');
        
        // Vytvorenie indexu pre override priority
        await client.query(`
          CREATE INDEX IF NOT EXISTS idx_rentals_override_priority ON rentals(override_priority, can_be_overridden) 
          WHERE can_be_overridden = true;
        `);
        
        logger.migration('   ✅ Index pre override priority vytvorený');
        
        logger.migration('✅ Migrácia 23: 🔄 Flexibilné prenájmy úspešne implementované!');
        logger.migration('   📝 Nové funkcie:');
        logger.migration('   • rental_type: standard | flexible | priority');
        logger.migration('   • is_flexible: true/false flag');
        logger.migration('   • flexible_end_date: odhadovaný koniec');
        logger.migration('   • can_be_overridden: možnosť prepísania');
        logger.migration('   • override_priority: priorita (1-10)');
        logger.migration('   • notification_threshold: dni vopred na upozornenie');
        logger.migration('   • auto_extend: automatické predĺženie');
        logger.migration('   • override_history: história zmien');
        
      } catch (error: unknown) {
        const errorObj = toError(error);
        logger.migration('⚠️ Migrácia 23 chyba:', errorObj.message);
      }

      // Migrácia 24: 🚗 VEHICLE CATEGORIES - Pridanie kategórií vozidiel pre lepšie filtrovanie
      try {
        logger.migration('📋 Migrácia 24: 🚗 Pridávanie kategórií vozidiel...');
        
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
          
          logger.migration('   ✅ ENUM vehicle_category vytvorený');
          logger.migration('   ✅ category stĺpec pridaný do vehicles tabuľky');
          logger.migration('   📋 8 kategórií dostupných: nizka-trieda, stredna-trieda, vyssia-stredna, luxusne, sportove, suv, viacmiestne, dodavky');
        } else {
          logger.migration('   ℹ️ category stĺpec už existuje');
        }
        
        logger.migration('✅ Migrácia 24: 🚗 Vehicle Categories úspešne implementované!');
        logger.migration('   🎯 Vozidlá teraz môžu byť kategorizované pre lepšie filtrovanie');
        logger.migration('   🔍 Frontend môže používať multi-select category filter');
        
      } catch (error: unknown) {
        const errorObj = toError(error);
        logger.migration('⚠️ Migrácia 24 chyba:', errorObj.message);
      }

      // Migrácia 25: 🗑️ AUDIT LOGGING REMOVAL - Odstraňujeme audit logs systém
      try {
        logger.migration('📋 Migrácia 25: 🗑️ Odstraňujem audit_logs tabuľku...');
        
        // Odstránenie audit_logs tabuľky a všetkých indexov
        await client.query(`DROP TABLE IF EXISTS audit_logs CASCADE;`);

        logger.migration('✅ Migrácia 25: 🗑️ Audit Logs systém úspešne odstránený!');
        logger.migration('   🧹 Tabuľka audit_logs a všetky indexy odstránené');
        logger.migration('   ⚡ Znížená záťaž na databázu a lepšie performance');
        
      } catch (error: unknown) {
        const errorObj = toError(error);
        logger.migration('⚠️ Migrácia 25 chyba:', errorObj.message);
      }

      // Migrácia 27: 📁 EMAIL ARCHIVE SYSTEM - Pridanie archived_at stĺpca
      try {
        logger.migration('📋 Migrácia 27: 📁 Pridávanie email archive systému...');
        
        // Skontroluj či archived_at stĺpec už existuje
        const columnCheck = await client.query(`
          SELECT column_name 
          FROM information_schema.columns 
          WHERE table_name = 'email_processing_history' AND column_name = 'archived_at'
        `);
        
        if (columnCheck.rows.length === 0) {
          logger.migration('   📁 Pridávam archived_at stĺpec...');
          
          await client.query(`
            ALTER TABLE email_processing_history 
            ADD COLUMN archived_at TIMESTAMP,
            ADD COLUMN auto_archive_after_days INTEGER DEFAULT 30
          `);
          
          // Vytvorenie indexu pre archived_at
          await client.query(`
            CREATE INDEX IF NOT EXISTS idx_email_history_archived_at ON email_processing_history(archived_at);
          `);
          
          // Automaticky archivuj staré spracované emaily (starší ako 30 dní)
          await client.query(`
            UPDATE email_processing_history 
            SET archived_at = CURRENT_TIMESTAMP,
                status = 'archived'
            WHERE status IN ('processed', 'rejected') 
            AND processed_at < CURRENT_TIMESTAMP - INTERVAL '30 days'
            AND archived_at IS NULL
          `);
          
          logger.migration('✅ Migrácia 27: 📁 Email archive systém úspešne pridaný!');
          logger.migration('   📁 Archived_at stĺpec pridaný');
          logger.migration('   🗂️ Index pre archived_at vytvorený');
          logger.migration('   🔄 Staré emaily automaticky archivované');
        } else {
          logger.migration('   ✅ Migrácia 27: Email archive systém už existuje');
        }
      } catch (error: unknown) {
        const errorObj = toError(error);
        logger.migration('⚠️ Migrácia 27 chyba:', errorObj.message);
      }

      // Migrácia 26: 📧 IMAP EMAIL SUPPORT - Pridanie customer email stĺpcov do rentals
      try {
        logger.migration('📋 Migrácia 26: 📧 Pridávanie IMAP email support stĺpcov do rentals...');
        
        // Skontroluj či stĺpce už existujú
        const columnCheck = await client.query(`
          SELECT column_name 
          FROM information_schema.columns 
          WHERE table_name = 'rentals' AND column_name IN ('customer_email', 'customer_phone', 'order_number', 'vehicle_name', 'vehicle_code', 'handover_place', 'daily_kilometers', 'approval_status', 'auto_processed_at', 'email_content')
        `);
        
        const existingColumns = columnCheck.rows.map((row: { column_name: string }) => row.column_name);
        const neededColumns = [
          'customer_email', 'customer_phone', 'order_number', 'vehicle_name', 
          'vehicle_code', 'handover_place', 'daily_kilometers', 'approval_status', 
          'auto_processed_at', 'email_content'
        ];
        
        const missingColumns = neededColumns.filter(col => !existingColumns.includes(col));
        
        if (missingColumns.length > 0) {
          logger.migration(`   📧 Pridávam ${missingColumns.length} chýbajúcich stĺpcov:`, missingColumns);
          
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
          
          logger.migration('   ✅ IMAP stĺpce pridané do rentals tabuľky');
        } else {
          logger.migration('   ℹ️ Všetky IMAP stĺpce už existujú');
        }

        // Pridaj indexy pre lepšiu performance pri vyhľadávaní emailových objednávok
        await client.query(`
          CREATE INDEX IF NOT EXISTS idx_rentals_order_number ON rentals(order_number);
          CREATE INDEX IF NOT EXISTS idx_rentals_customer_email ON rentals(customer_email);
          CREATE INDEX IF NOT EXISTS idx_rentals_approval_status ON rentals(approval_status);
          CREATE INDEX IF NOT EXISTS idx_rentals_auto_processed_at ON rentals(auto_processed_at DESC);
        `);
        
        logger.migration('✅ Migrácia 26: 📧 IMAP Email Support úspešne implementovaný!');
        logger.migration('   📧 Customer email, phone, order number support');
        logger.migration('   🚗 Vehicle name a code pre email parsing');
        logger.migration('   📍 Handover place a daily kilometers');
        logger.migration('   ⚖️ Approval status workflow pre email objednávky');
        logger.migration('   🔍 Optimalizované indexy pre email vyhľadávanie');
        
      } catch (error: unknown) {
        const errorObj = toError(error);
        logger.migration('⚠️ Migrácia 26 chyba:', errorObj.message);
      }

      // Migrácia 27: 📧 EMAIL MANAGEMENT DASHBOARD - Email History & Tracking
      try {
        logger.migration('📋 Migrácia 27: 📧 Vytváram Email Management Dashboard štruktúru...');

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
        
        logger.migration('✅ Migrácia 27: 📧 Email Management Dashboard úspešne vytvorený!');
        logger.migration('   📧 Email processing history tabuľka');
        logger.migration('   📊 Email action logs pre audit trail');
        logger.migration('   🔍 Optimalizované indexy pre search & filtering');
        logger.migration('   ⚡ Auto-update triggers pre timestamp tracking');
        
      } catch (error: unknown) {
        const errorObj = toError(error);
        logger.migration('⚠️ Migrácia 27 chyba:', errorObj.message);
      }

    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      logger.migration('⚠️ Migrácie celkovo preskočené:', errorMessage);
    }
  }

  // DATA INTEGRITY VALIDATION
  private async validateDataIntegrity(client: PoolClient) {
    logger.migration('🔍 Spúšťam data integrity validation...');
    
    try {
      // 1. Kontrola orphaned rentals (rentals bez platných vehicles)
      const orphanedRentals = await client.query(`
        SELECT r.id, r.customer_name, r.vehicle_id 
        FROM rentals r 
        LEFT JOIN vehicles v ON r.vehicle_id = v.id 
        WHERE r.vehicle_id IS NOT NULL AND v.id IS NULL
      `);
      
      if (orphanedRentals.rows.length > 0) {
        logger.migration(`⚠️ PROBLÉM: ${orphanedRentals.rows.length} rentals má neplatné vehicle_id`);
        for (const rental of orphanedRentals.rows) {
          logger.migration(`   ❌ Rental ${rental.id} (${rental.customer_name}) -> neexistujúce vehicle_id: ${rental.vehicle_id}`);
        }
      } else {
        logger.migration('✅ Všetky rentals majú platné vehicle_id');
      }
      
      // 2. Kontrola vehicles bez company_id (používame company_id namiesto owner_company_id)
      const vehiclesWithoutCompany = await client.query(`
        SELECT id, brand, model, license_plate, company 
        FROM vehicles 
        WHERE company_id IS NULL
      `);
      
      if (vehiclesWithoutCompany.rows.length > 0) {
        logger.migration(`⚠️ PROBLÉM: ${vehiclesWithoutCompany.rows.length} vozidiel nemá company_id`);
      } else {
        logger.migration('✅ Všetky vozidlá majú company_id');
      }
      
      // 3. Kontrola users bez company_id
      const usersWithoutCompany = await client.query(`
        SELECT id, username, role 
        FROM users 
        WHERE company_id IS NULL AND role = 'company_owner'
      `);
      
      if (usersWithoutCompany.rows.length > 0) {
        logger.migration(`⚠️ PROBLÉM: ${usersWithoutCompany.rows.length} company_owner users nemá company_id`);
      } else {
        logger.migration('✅ Všetci company_owner users majú company_id');
      }
      
      // 4. Kontrola ID konzistentnosti (integer IDs, nie UUID)
      const idConsistency = await client.query(`
        SELECT 
          (SELECT COUNT(*) FROM vehicles WHERE id IS NOT NULL) as valid_vehicle_ids,
          (SELECT COUNT(*) FROM vehicles) as total_vehicles,
          (SELECT COUNT(*) FROM users WHERE id IS NOT NULL) as valid_user_ids,
          (SELECT COUNT(*) FROM users) as total_users
      `);
      
      const idData = idConsistency.rows[0];
      if (idData.valid_vehicle_ids == idData.total_vehicles && idData.valid_user_ids == idData.total_users) {
        logger.migration('✅ ID formát je konzistentný');
      } else {
        logger.migration(`⚠️ PROBLÉM: ID formát nie je konzistentný - Vehicles: ${idData.valid_vehicle_ids}/${idData.total_vehicles}, Users: ${idData.valid_user_ids}/${idData.total_users}`);
      }
      
      logger.migration('✅ Data integrity validation dokončená');
      
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      logger.migration('⚠️ Data integrity validation chyba:', errorMessage);
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
        logger.migration('👤 Admin používateľ vytvorený (username: admin, password: admin123)');
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
      
      logger.migration('📊 Počet záznamov: vehicles:', vehicleCount.rows[0].count, 'customers:', customerCount.rows[0].count, 'rentals:', rentalCount.rows[0].count);
      
      // VYPNUTÉ: Automatické vytváranie testových dát
      const createTestData = false;
      if (createTestData && rentalCount.rows[0].count === '0' && vehicleCount.rows[0].count === '0') {
        logger.migration('📋 Vytváranie testovacích dát...');
        
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
            logger.migration('✅ Firmy vytvorené:', companiesToInsert);
          }
        } catch (error: unknown) {
          const errorObj = toError(error);
          logger.migration('⚠️ Chyba pri vytváraní firiem:', errorObj.message);
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
            logger.migration('✅ Poisťovne vytvorené:', insurersToInsert);
          }
        } catch (error: unknown) {
          const errorObj = toError(error);
          logger.migration('⚠️ Chyba pri vytváraní poisťovní:', errorObj.message);
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
            logger.migration('✅ Vozidlá vytvorené:', vehicles.length);
            
            // Vytvorenie zákazníkov
            const customerResult = await client.query(`
              INSERT INTO customers (name, email, phone) VALUES 
              ('Ján Novák', 'jan.novak@email.com', '+421901234567'),
              ('Mária Svobodová', 'maria.svobodova@email.com', '+421907654321'),
              ('Peter Horváth', 'peter.horvath@email.com', '+421905111222')
              RETURNING id, name
            `);
            const customers = customerResult.rows;
            logger.migration('✅ Zákazníci vytvorení:', customers.length);
            
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
              logger.migration('✅ Prenájmy vytvorené: 3');
            }
            
            logger.migration('🎉 Testové dáta úspešne vytvorené!');
            logger.migration('📊 Vytvorené:');
            logger.migration('   - 3 vozidlá (BMW X5, Mercedes E-Class, Audi A4)');
            logger.migration('   - 3 zákazníkov (Ján Novák, Mária Svobodová, Peter Horváth)');
            logger.migration('   - 3 prenájmy s rôznymi stavmi');
            logger.migration('   - 3 firmy (ABC Rent, Premium Cars, City Rent)');
            logger.migration('   - 2 poisťovne (Allianz, Generali)');
          } else {
            logger.migration('ℹ️ Vozidlá už existujú, preskakujem vytváranie testovacích dát');
          }
                 } catch (vehicleError: unknown) {
           const vehicleErrorObj = toError(vehicleError);
           logger.migration('⚠️ Chyba pri vytváraní vozidiel:', vehicleErrorObj.message);
         }
      } else {
        logger.migration('ℹ️ Databáza už obsahuje dáta, preskakujem vytváranie testovacích dát');
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
    linkedInvestorId?: string | null;
  }): Promise<User> {
    const client = await this.pool.connect();
    try {
      logger.migration('🗄️ Database createUser - userData:', userData);
      
      const hashedPassword = await bcrypt.hash(userData.password, 12);
      const result = await client.query(
        `INSERT INTO users (
          username, email, password_hash, role, first_name, last_name, 
          company_id, employee_number, hire_date, is_active, signature_template, linked_investor_id
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12) 
        RETURNING id, username, email, password_hash, role, first_name, last_name,
                  company_id, employee_number, hire_date, is_active, last_login,
                  signature_template, linked_investor_id, created_at, updated_at`,
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
          userData.signatureTemplate,
          userData.linkedInvestorId || null
        ]
      );
      
      const row = result.rows[0];
      logger.migration('🗄️ Database createUser - result row:', row);
      
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
        linkedInvestorId: row.linked_investor_id,
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

  // 🚀 FÁZA 1.3: CACHED VEHICLES - drastické zrýchlenie kalendára
  async getVehicles(includeRemoved: boolean = false, includePrivate: boolean = false): Promise<Vehicle[]> {
    // Pre zahrnutie vyradených alebo súkromných vozidiel nepoužívame cache
    if (includeRemoved || includePrivate) {
      logger.migration('🔄 Loading ALL vehicles (including removed/private) from DB');
      return await this.getVehiclesFresh(includeRemoved, includePrivate);
    }

    // Skontroluj cache len pre aktívne vozidlá
    const now = Date.now();
    if (this.vehicleCache && (now - this.vehicleCache.timestamp) < this.VEHICLE_CACHE_TTL) {
      logger.migration('⚡ VEHICLE CACHE HIT - using cached vehicles');
      return this.vehicleCache.data;
    }

    logger.migration('🔄 VEHICLE CACHE MISS - loading fresh vehicles from DB');
    const vehicles = await this.getVehiclesFresh(includeRemoved, includePrivate);
    
    // Uložiť do cache
    this.vehicleCache = {
      data: vehicles,
      timestamp: now
    };
    
    logger.migration(`✅ VEHICLE CACHE UPDATED - cached ${vehicles.length} vehicles for 10min`);
    return vehicles;
  }

  // Cache invalidation helper
  private invalidateVehicleCache(): void {
    if (this.vehicleCache) {
      logger.migration('🗑️ VEHICLE CACHE INVALIDATED - will reload on next request');
      this.vehicleCache = null;
    }
  }

  // 🚀 FÁZA 2.2: CONNECTION REUSE helpers pre calendar API
  private async getReusableConnection() {
    const now = Date.now();
    
    // Skontroluj, či máme aktívne connection čo môžeme reusovať
    if (this.calendarConnection && 
        (now - this.calendarConnectionLastUsed) < this.CONNECTION_REUSE_TIMEOUT) {
      logger.migration('⚡ REUSING calendar connection (connection reuse)');
      this.calendarConnectionLastUsed = now;
      return this.calendarConnection;
    }

    // Získaj nové connection a ulož ho pre reuse
    logger.migration('🔄 ACQUIRING new calendar connection');
    if (this.calendarConnection) {
      try { 
        this.calendarConnection.release(); 
      } catch (e) {
        // Ignoruj chyby pri release - connection môže byť už uzavretý
      }
    }
    
    this.calendarConnection = await this.pool.connect();
    this.calendarConnectionLastUsed = now;
    return this.calendarConnection;
  }

  private releaseReusableConnection(forceRelease = false) {
    if (forceRelease && this.calendarConnection) {
      logger.migration('🗑️ FORCE RELEASING calendar connection');
      this.calendarConnection.release();
      this.calendarConnection = null;
      this.calendarConnectionLastUsed = 0;
    }
    // Inak necháme connection alive pre reuse
  }

  // 🚀 FÁZA 2.3: SMART CACHE HELPERS
  private generateCacheKey(prefix: string, startDate: Date, endDate: Date): string {
    const start = startDate.toISOString().split('T')[0];
    const end = endDate.toISOString().split('T')[0];
    return `${prefix}:${start}:${end}`;
  }

  private isValidCacheEntry<T>(entry: { data: T; timestamp: number }, ttl: number): boolean {
    return (Date.now() - entry.timestamp) < ttl;
  }

  private invalidateCalendarCache(): void {
    const beforeSize = this.calendarCache.size;
    this.calendarCache.clear();
    logger.migration(`🗑️ CALENDAR CACHE INVALIDATED - cleared ${beforeSize} entries`);
  }

  private invalidateUnavailabilityCache(): void {
    const beforeSize = this.unavailabilityCache.size;
    this.unavailabilityCache.clear();
    logger.migration(`🗑️ UNAVAILABILITY CACHE INVALIDATED - cleared ${beforeSize} entries`);
  }

  private cleanupExpiredCache(): void {
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
      logger.migration(`🧹 CACHE CLEANUP: Removed ${calendarCleaned} calendar + ${unavailabilityCleaned} unavailability entries`);
    }
  }

  // 🚀 FÁZA 2.4: DATA STRUCTURE OPTIMIZATION
  private optimizeCalendarDataStructure(data: Record<string, unknown>): Record<string, unknown> {
    const startTime = Date.now();
    
    // Define types for calendar optimization
    interface CalendarVehicle {
      id: string;
      brand: string;
      model: string;
      licensePlate: string;
      status: string;
    }
    
    interface CalendarDay {
      date: string;
      vehicles: Array<{
        vehicleId: string;
        status: string;
        rentalId?: string;
        customerName?: string;
        isFlexible?: boolean;
        rentalType?: string;
        unavailabilityType?: string;
      }>;
    }
    
    interface OptimizedVehicleRef {
      vi?: number; // Vehicle index reference
      s: string; // Status
      ri?: string; // Rental ID
      cn?: string; // Customer name
      f?: boolean; // Is flexible
      rt?: string; // Rental type
      ut?: string; // Unavailability type
    }
    
    // Create vehicle lookup map (deduplication)
    const vehicleMap = new Map<string, { i: number; brand: string; model: string; licensePlate: string; status: string }>();
    (data.vehicles as CalendarVehicle[]).forEach((vehicle: CalendarVehicle, index: number) => {
      vehicleMap.set(vehicle.id, {
        i: index, // Vehicle index instead of full object
        brand: vehicle.brand,
        model: vehicle.model,
        licensePlate: vehicle.licensePlate,
        status: vehicle.status
      });
    });

    // Optimize calendar structure - replace duplicate vehicle data with references
    const optimizedCalendar = (data.calendar as CalendarDay[]).map((day: CalendarDay) => {
      return {
        date: day.date,
        vehicles: day.vehicles.map((vehicle) => {
          const vehicleRef = vehicleMap.get(vehicle.vehicleId);
          const result: OptimizedVehicleRef = {
            vi: vehicleRef?.i, // Vehicle index reference
            s: vehicle.status, // Status
          };
          if (vehicle.rentalId) result.ri = vehicle.rentalId;
          if (vehicle.customerName) result.cn = vehicle.customerName;
          if (vehicle.isFlexible !== undefined) result.f = vehicle.isFlexible;
          if (vehicle.rentalType !== 'standard') result.rt = vehicle.rentalType;
          if (vehicle.unavailabilityType) result.ut = vehicle.unavailabilityType;
          return result;
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
    
    logger.migration(`🎯 DATA STRUCTURE OPTIMIZED: ${originalSize} → ${optimizedSize} bytes (${percentSaved}% smaller) in ${optimizedTime}ms`);
    
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
  private async getVehiclesFresh(includeRemoved: boolean = false, includePrivate: boolean = false): Promise<Vehicle[]> {
    const client = await this.pool.connect();
    try {
      const excludedStatuses = [];
      if (!includeRemoved) {
        excludedStatuses.push('removed', 'temporarily_removed');
      }
      if (!includePrivate) {
        excludedStatuses.push('private');
      }
      
      const whereClause = excludedStatuses.length > 0 
        ? `WHERE v.status NOT IN (${excludedStatuses.map(s => `'${s}'`).join(', ')})` 
        : '';
      
      // 🚀 N+1 OPTIMIZATION: JOIN s companies pre načítanie company_name v jednom dotaze
      const result = await client.query(
        `SELECT 
           v.*,
           c.name as company_name
         FROM vehicles v 
         LEFT JOIN companies c ON v.company_id = c.id
         ${whereClause}
         ORDER BY v.created_at DESC`
      );
      
      const vehicles = result.rows.map(row => {
        // Parsovanie pricing JSONB
        const pricing = typeof row.pricing === 'string' ? JSON.parse(row.pricing) : row.pricing;
        
        // Extrahovanie extraKilometerRate z pricing JSONB
        let extraKilometerRate = 0.30; // Default hodnota
        if (Array.isArray(pricing)) {
          // Ak je pricing array, hľadáme posledný extraKilometerRate objekt (najnovší)
          const extraKmObjects = pricing.filter(item => item.extraKilometerRate !== undefined);
          if (extraKmObjects.length > 0) {
            const lastExtraKmObj = extraKmObjects[extraKmObjects.length - 1];
            extraKilometerRate = parseFloat(lastExtraKmObj.extraKilometerRate) || 0.30;
          }
        } else if (pricing && typeof pricing === 'object' && pricing.extraKilometerRate !== undefined) {
          // Ak je pricing objekt s extraKilometerRate
          extraKilometerRate = parseFloat(pricing.extraKilometerRate) || 0.30;
        }

        return {
          id: row.id?.toString() || '',
          brand: row.brand,
          model: row.model,
          year: row.year,
          licensePlate: row.license_plate, // Mapovanie column názvu
          vin: row.vin || null, // 🆔 VIN číslo mapovanie
          company: row.company_name || row.company || 'N/A', // 🚀 OPTIMALIZOVANÉ: Používa company_name z JOIN
          category: row.category || null, // 🚗 Mapovanie category
          ownerCompanyId: row.company_id?.toString(), // Mapovanie company_id na ownerCompanyId
          pricing: Array.isArray(pricing) ? pricing.filter(item => item.extraKilometerRate === undefined) : pricing, // Odstránenie extraKilometerRate z pricing array
          commission: typeof row.commission === 'string' ? JSON.parse(row.commission) : row.commission, // Parsovanie JSON
          status: row.status,
          stk: row.stk ? new Date(row.stk) : undefined, // 📋 STK date mapping
          createdAt: new Date(row.created_at),
          // 🚗 NOVÉ: Extra kilometer rate z pricing JSONB
          extraKilometerRate: extraKilometerRate
        };
      });

      logger.migration(`🚀 N+1 OPTIMIZED: Loaded ${vehicles.length} vehicles with companies in 1 query (was ${vehicles.length + 1} queries)`);

      return vehicles;
    } finally {
      client.release();
    }
  }

  async getVehicle(id: string): Promise<Vehicle | null> {
    const client = await this.pool.connect();
    try {
      // 🚀 N+1 OPTIMIZATION: JOIN s companies pre načítanie company_name v jednom dotaze
      const result = await client.query(
        `SELECT 
           v.*,
           c.name as company_name
         FROM vehicles v 
         LEFT JOIN companies c ON v.company_id = c.id
         WHERE v.id = $1`, 
        [id]
      );
      
      if (result.rows.length === 0) return null;
      
      const row = result.rows[0];
      
      // Parsovanie pricing JSONB
      const pricing = typeof row.pricing === 'string' ? JSON.parse(row.pricing) : row.pricing;
      
      // Extrahovanie extraKilometerRate z pricing JSONB
      let extraKilometerRate = 0.30; // Default hodnota
      if (Array.isArray(pricing)) {
        // Ak je pricing array, hľadáme posledný extraKilometerRate objekt (najnovší)
        const extraKmObjects = pricing.filter(item => item.extraKilometerRate !== undefined);
        if (extraKmObjects.length > 0) {
          const lastExtraKmObj = extraKmObjects[extraKmObjects.length - 1];
          extraKilometerRate = parseFloat(lastExtraKmObj.extraKilometerRate) || 0.30;
        }
      } else if (pricing && typeof pricing === 'object' && pricing.extraKilometerRate !== undefined) {
        // Ak je pricing objekt s extraKilometerRate
        extraKilometerRate = parseFloat(pricing.extraKilometerRate) || 0.30;
      }
      
      return {
        id: row.id.toString(),
        brand: row.brand,
        model: row.model,
        year: row.year,
        licensePlate: row.license_plate, // Mapovanie column názvu
        vin: row.vin || null, // 🆔 VIN číslo mapovanie
        company: row.company_name || row.company || 'N/A', // 🚀 OPTIMALIZOVANÉ: Používa company_name z JOIN
        category: row.category || null, // 🚗 Mapovanie category
        ownerCompanyId: row.company_id?.toString(), // Mapovanie company_id na ownerCompanyId
        pricing: Array.isArray(pricing) ? pricing.filter(item => item.extraKilometerRate === undefined) : pricing, // Odstránenie extraKilometerRate z pricing array
        commission: typeof row.commission === 'string' ? JSON.parse(row.commission) : row.commission, // Parsovanie JSON
        status: row.status,
        // 🚗 NOVÉ: Extra kilometer rate z pricing JSONB
        extraKilometerRate: extraKilometerRate,
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
    vin?: string;
    company: string;
    pricing: Record<string, unknown>[];
    commission: Record<string, unknown>;
    status: string;
    year?: number;
    extraKilometerRate?: number; // 🚗 NOVÉ: Extra kilometer rate
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
          logger.migration(`⚠️ Vozidlo s ŠPZ ${vehicleData.licensePlate} už existuje: ${existing.brand} ${existing.model}`);
          throw new Error(`Vozidlo s ŠPZ ${vehicleData.licensePlate} už existuje v databáze`);
        }
      }

      // Nájdi alebo vytvor company UUID a použij default províziu
      let ownerCompanyId: string | null = null;
      let defaultCommission = vehicleData.commission;
      
      if (vehicleData.company && vehicleData.company.trim()) {
        const companies = await this.getCompanies();
        const existingCompany = companies.find(c => c.name === vehicleData.company.trim());
        
        if (existingCompany) {
          ownerCompanyId = existingCompany.id;
          
          // 💰 SMART COMMISSION: Ak nie je zadaná vlastná provízia, použi default z firmy
          if (!vehicleData.commission || 
              (vehicleData.commission.type === 'percentage' && vehicleData.commission.value === 20)) {
            defaultCommission = {
              type: 'percentage',
              value: existingCompany.defaultCommissionRate || 20
            };
            logger.migration(`💰 Using company default commission: ${defaultCommission.value}% for ${vehicleData.brand} ${vehicleData.model}`);
          }
        } else {
          // Vytvor novú firmu s default províziou
          const newCompany = await this.createCompany({ 
            name: vehicleData.company.trim(),
            defaultCommissionRate: 20 // Default pre novú firmu
          });
          ownerCompanyId = newCompany.id;
          defaultCommission = {
            type: 'percentage',
            value: 20
          };
        }
      }

      // 🚗 NOVÉ: Pridanie extraKilometerRate do pricing JSONB
      const pricingWithExtraKm = [...vehicleData.pricing];
      if (vehicleData.extraKilometerRate !== undefined) {
        pricingWithExtraKm.push({ extraKilometerRate: vehicleData.extraKilometerRate });
      } else {
        pricingWithExtraKm.push({ extraKilometerRate: 0.30 }); // Default hodnota
      }

      // ✅ OPRAVENÉ: Používame company_id (nie owner_company_id) + VIN
      const result = await client.query(
        'INSERT INTO vehicles (brand, model, year, license_plate, vin, company, company_id, pricing, commission, status) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10) RETURNING id, brand, model, year, license_plate, vin, company, company_id, pricing, commission, status, created_at',
        [
          vehicleData.brand, 
          vehicleData.model, 
          vehicleData.year || 2024, // Default rok ak nie je zadaný
          vehicleData.licensePlate, 
          vehicleData.vin || null, // 🆕 VIN číslo
          vehicleData.company,
          ownerCompanyId, // 🆕 Správne company_id (nie owner_company_id)
          JSON.stringify(pricingWithExtraKm), // 🚗 NOVÉ: Pricing s extraKilometerRate
          JSON.stringify(defaultCommission),
          vehicleData.status
        ]
      );

      const row = result.rows[0];
      // 🚀 FÁZA 1.3: Cache invalidation po vytvorení vozidla
      this.invalidateVehicleCache();
      
      // 🚀 FÁZA 2.3: Calendar cache invalidation po vytvorení vozidla
      this.invalidateCalendarCache();

      // Parsovanie pricing JSONB pre extraKilometerRate
      const pricing = typeof row.pricing === 'string' ? JSON.parse(row.pricing) : row.pricing;
      let extraKilometerRate = 0.30; // Default hodnota
      let cleanPricing = pricing;
      
      if (Array.isArray(pricing)) {
        // Ak je pricing array, hľadáme posledný extraKilometerRate objekt (najnovší)
        const extraKmObjects = pricing.filter(item => item.extraKilometerRate !== undefined);
        if (extraKmObjects.length > 0) {
          const lastExtraKmObj = extraKmObjects[extraKmObjects.length - 1];
          extraKilometerRate = parseFloat(lastExtraKmObj.extraKilometerRate) || 0.30;
        }
        // Odstránenie všetkých extraKilometerRate objektov z pricing array
        cleanPricing = pricing.filter(item => item.extraKilometerRate === undefined);
      }

      return {
        id: row.id.toString(),
        brand: row.brand,
        model: row.model,
        year: row.year,
        licensePlate: row.license_plate,
        vin: row.vin, // 🆕 VIN číslo
        company: row.company,
        ownerCompanyId: row.company_id?.toString(), // ✅ Používame company_id
        pricing: cleanPricing,
        commission: typeof row.commission === 'string' ? JSON.parse(row.commission) : row.commission,
        status: row.status,
        createdAt: new Date(row.created_at),
        // 🚗 NOVÉ: Extra kilometer rate
        extraKilometerRate: extraKilometerRate
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
      let companyId = vehicle.ownerCompanyId;
      
      // 🔄 AUTOMATICKÁ AKTUALIZÁCIA company_id pri zmene company názvu
      if (vehicle.company && vehicle.company.trim()) {
        try {
          // Najprv skús nájsť existujúcu firmu
          const existingCompany = await client.query('SELECT id FROM companies WHERE name = $1', [vehicle.company.trim()]);
          
          if (existingCompany.rows.length > 0) {
            // Firma existuje - použij jej ID
            companyId = existingCompany.rows[0].id.toString();
            logger.migration(`✅ Nájdená existujúca firma: "${vehicle.company}" → ID: ${companyId}`);
          } else {
            // Firma neexistuje - vytvor ju
            const newCompany = await client.query('INSERT INTO companies (name) VALUES ($1) RETURNING id', [vehicle.company.trim()]);
            companyId = newCompany.rows[0].id.toString();
            logger.migration(`🆕 Vytvorená nová firma: "${vehicle.company}" → ID: ${companyId}`);
          }
        } catch (companyError: unknown) {
          const companyErrorObj = toError(companyError);
          console.error('❌ Chyba pri aktualizácii firmy:', companyErrorObj.message);
          // Ak zlyhá, ponechaj pôvodné company_id
        }
      }

      // 🚗 NOVÉ: Pridanie extraKilometerRate do pricing JSONB
      const pricingWithExtraKm = [...vehicle.pricing] as unknown as Record<string, unknown>[];
      if (vehicle.extraKilometerRate !== undefined) {
        // Odstráň staré extraKilometerRate objekty
        const cleanPricing = pricingWithExtraKm.filter((item: Record<string, unknown>) => 
          !('extraKilometerRate' in item)
        );
        // Pridaj nový extraKilometerRate
        cleanPricing.push({ extraKilometerRate: vehicle.extraKilometerRate });
        pricingWithExtraKm.length = 0;
        pricingWithExtraKm.push(...cleanPricing);
      }

      await client.query(
        'UPDATE vehicles SET brand = $1, model = $2, license_plate = $3, vin = $4, company = $5, category = $6, company_id = $7, pricing = $8, commission = $9, status = $10, year = $11, stk = $12 WHERE id = $13',
        [
          vehicle.brand,
          vehicle.model,
          vehicle.licensePlate,
          vehicle.vin || null, // 🆔 VIN číslo
          vehicle.company,
          vehicle.category || null,
          companyId || null, // 🏢 OPRAVENÉ: Používa aktualizované company_id
          JSON.stringify(pricingWithExtraKm), // 🚗 NOVÉ: Pricing s extraKilometerRate
          JSON.stringify(vehicle.commission),
          vehicle.status,
          vehicle.year || null,
          vehicle.stk || null,
          vehicle.id
        ]
      );
      
      // 🚀 FÁZA 1.3: Cache invalidation po aktualizácii vozidla
      this.invalidateVehicleCache();
      
      // 🚀 FÁZA 2.3: Calendar cache invalidation po aktualizácii vozidla
      this.invalidateCalendarCache();
    } finally {
      client.release();
    }
  }

  async deleteVehicle(id: string): Promise<void> {
    const client = await this.pool.connect();
    try {
      await client.query('DELETE FROM vehicles WHERE id = $1', [id]); // Removed parseInt for UUID
      
      // 🚀 FÁZA 1.3: Cache invalidation po zmazaní vozidla
      this.invalidateVehicleCache();
      
      // 🚀 FÁZA 2.3: Calendar cache invalidation po zmazaní vozidla
      this.invalidateCalendarCache();
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
        SELECT id, vehicle_id, start_date, end_date, 
               total_price, commission, payment_method, paid, status, 
               customer_name, created_at, order_number, deposit, 
               allowed_kilometers, daily_kilometers, handover_place,
               is_flexible, flexible_end_date,
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
            // IMPORTANT: Vrátiť dátumy ako stringy pre zachovanie presných časov
            startDate: row.start_date,
            endDate: row.end_date,
            totalPrice: parseFloat(row.total_price) || 0,
            commission: parseFloat(row.commission) || 0,
            paymentMethod: row.payment_method || 'cash',
            paid: Boolean(row.paid),
            status: row.status || 'active',
            createdAt: row.created_at || new Date().toISOString(),
            orderNumber: row.order_number || undefined,
            deposit: row.deposit ? parseFloat(row.deposit) : undefined,
            allowedKilometers: row.allowed_kilometers || undefined,
            dailyKilometers: row.daily_kilometers || undefined,
            handoverPlace: row.handover_place || undefined,
            // 🏢 COMPANY SNAPSHOT: Historical company field
            company: row.company || 'Neznáma firma',
            // 🔄 OPTIMALIZOVANÉ: Flexibilné prenájmy polia
            isFlexible: Boolean(row.is_flexible),
            flexibleEndDate: row.flexible_end_date || undefined,
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

  // 🚀 GMAIL APPROACH: Paginated vehicles s filtrami
  async getVehiclesPaginated(params: {
    limit: number;
    offset: number;
    search?: string;
    company?: string;
    brand?: string;
    category?: string;
    status?: string;
    yearMin?: string;
    yearMax?: string;
    priceMin?: string;
    priceMax?: string;
    userId?: string;
    userRole?: string;
  }): Promise<{ vehicles: Vehicle[]; total: number }> {
    const client = await this.pool.connect();
    try {
      logger.migration('🚀 Loading paginated vehicles with filters:', params);

      // Build WHERE clause dynamically
      const whereClauses: string[] = [];
      const queryParams: unknown[] = [];
      let paramIndex = 1;

      // Search filter (brand, model, license plate, VIN)
      if (params.search && params.search.trim()) {
        whereClauses.push(`(
          v.brand ILIKE $${paramIndex} OR 
          v.model ILIKE $${paramIndex} OR 
          v.license_plate ILIKE $${paramIndex} OR 
          v.vin ILIKE $${paramIndex}
        )`);
        queryParams.push(`%${params.search.trim()}%`);
        paramIndex++;
      }

      // Company filter
      if (params.company && params.company !== 'all') {
        whereClauses.push(`c.name = $${paramIndex}`);
        queryParams.push(params.company);
        paramIndex++;
      }

      // Brand filter
      if (params.brand && params.brand !== 'all') {
        whereClauses.push(`v.brand = $${paramIndex}`);
        queryParams.push(params.brand);
        paramIndex++;
      }

      // Category filter
      if (params.category && params.category !== 'all') {
        whereClauses.push(`v.category = $${paramIndex}`);
        queryParams.push(params.category);
        paramIndex++;
      }

      // Status filter
      if (params.status && params.status !== 'all') {
        whereClauses.push(`v.status = $${paramIndex}`);
        queryParams.push(params.status);
        paramIndex++;
      }

      // Year range
      if (params.yearMin) {
        whereClauses.push(`v.year >= $${paramIndex}`);
        queryParams.push(parseInt(params.yearMin));
        paramIndex++;
      }
      if (params.yearMax) {
        whereClauses.push(`v.year <= $${paramIndex}`);
        queryParams.push(parseInt(params.yearMax));
        paramIndex++;
      }

      // Permission filtering for non-admin users
      if (params.userRole !== 'admin' && params.userId) {
        // Get user's allowed companies
        const userCompanyAccess = await this.getUserCompanyAccess(params.userId);
        const allowedCompanyIds = userCompanyAccess.map(access => access.companyId);
        
        if (allowedCompanyIds.length > 0) {
          const placeholders = allowedCompanyIds.map((_, i) => `$${paramIndex + i}`).join(',');
          whereClauses.push(`v.company_id IN (${placeholders})`);
          queryParams.push(...allowedCompanyIds);
          paramIndex += allowedCompanyIds.length;
        } else {
          // No access to any companies
          whereClauses.push('FALSE');
        }
      }

      const whereClause = whereClauses.length > 0 ? `WHERE ${whereClauses.join(' AND ')}` : '';

      // Count query
      const countQuery = `
        SELECT COUNT(*) as total
        FROM vehicles v
        LEFT JOIN companies c ON v.company_id = c.id
        ${whereClause}
      `;

      // Data query with pagination
      const dataQuery = `
        SELECT 
          v.*,
          c.name as company_name
        FROM vehicles v
        LEFT JOIN companies c ON v.company_id = c.id
        ${whereClause}
        ORDER BY v.created_at DESC
        LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
      `;

      // Execute queries in parallel
      const [countResult, dataResult] = await Promise.all([
        client.query(countQuery, queryParams),
        client.query(dataQuery, [...queryParams, params.limit, params.offset])
      ]);

      const total = parseInt(countResult.rows[0]?.total || '0');
      const vehicles = dataResult.rows.map(row => ({
        id: row.id,
        brand: row.brand,
        model: row.model,
        licensePlate: row.license_plate,
        vin: row.vin,
        company: row.company_name || row.company || 'N/A',
        category: row.category,
        pricing: row.pricing ? (typeof row.pricing === 'string' ? JSON.parse(row.pricing) : row.pricing) : [],
        commission: row.commission ? (typeof row.commission === 'string' ? JSON.parse(row.commission) : row.commission) : { type: 'percentage', value: 0 },
        status: row.status || 'available',
        year: row.year,
        stk: row.stk,
        ownerCompanyId: row.company_id,
        createdAt: row.created_at
      }));

      return { vehicles, total };

    } catch (error) {
      console.error('Error in getVehiclesPaginated:', error);
      throw error;
    } finally {
      client.release();
    }
  }

  // 🚀 GMAIL APPROACH: Paginated companies s filtrami
  async getCompaniesPaginated(params: {
    limit: number;
    offset: number;
    search?: string;
    city?: string;
    country?: string;
    status?: string;
    userId?: string;
    userRole?: string;
  }): Promise<{ companies: Company[]; total: number }> {
    const client = await this.pool.connect();
    try {
      logger.migration('🚀 Loading paginated companies with filters:', params);

      // Build WHERE clause dynamically
      const whereClauses: string[] = [];
      const queryParams: unknown[] = [];
      let paramIndex = 1;

      // Search filter (name, email, phone, address)
      if (params.search && params.search.trim()) {
        whereClauses.push(`(
          c.name ILIKE $${paramIndex} OR 
          c.email ILIKE $${paramIndex} OR 
          c.phone ILIKE $${paramIndex} OR 
          c.address ILIKE $${paramIndex}
        )`);
        queryParams.push(`%${params.search.trim()}%`);
        paramIndex++;
      }

      // City filter
      if (params.city && params.city !== 'all') {
        whereClauses.push(`c.city = $${paramIndex}`);
        queryParams.push(params.city);
        paramIndex++;
      }

      // Country filter
      if (params.country && params.country !== 'all') {
        whereClauses.push(`c.country = $${paramIndex}`);
        queryParams.push(params.country);
        paramIndex++;
      }

      // Permission filtering for company_owner role
      if (params.userRole === 'company_owner' && params.userId) {
        // Company owners can only see their own company
        const users = await this.getUsers();
        const user = users.find(u => u.id === params.userId);
        if (user?.companyId) {
          whereClauses.push(`c.id = $${paramIndex}`);
          queryParams.push(user.companyId);
          paramIndex++;
        } else {
          // No company assigned - return empty
          whereClauses.push('FALSE');
        }
      }

      const whereClause = whereClauses.length > 0 ? `WHERE ${whereClauses.join(' AND ')}` : '';

      // Count query
      const countQuery = `
        SELECT COUNT(*) as total
        FROM companies c
        ${whereClause}
      `;

      // Data query with pagination
      const dataQuery = `
        SELECT 
          c.*,
          COUNT(v.id) as vehicle_count
        FROM companies c
        LEFT JOIN vehicles v ON c.id = v.company_id
        ${whereClause}
        GROUP BY c.id
        ORDER BY c.created_at DESC
        LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
      `;

      // Execute queries in parallel
      const [countResult, dataResult] = await Promise.all([
        client.query(countQuery, queryParams),
        client.query(dataQuery, [...queryParams, params.limit, params.offset])
      ]);

      const total = parseInt(countResult.rows[0]?.total || '0');
      const companies = dataResult.rows.map(row => ({
        id: row.id,
        name: row.name,
        email: row.email,
        phone: row.phone,
        address: row.address,
        city: row.city,
        country: row.country,
        commissionRate: row.commission_rate || 0,
        isActive: row.is_active !== false,
        vehicleCount: parseInt(row.vehicle_count || '0'),
        createdAt: row.created_at,
        protocolDisplayName: row.protocol_display_name || ''
      }));

      return { companies, total };

    } catch (error) {
      console.error('Error in getCompaniesPaginated:', error);
      throw error;
    } finally {
      client.release();
    }
  }

  // 🚀 GMAIL APPROACH: Paginated users s filtrami
  async getUsersPaginated(params: {
    limit: number;
    offset: number;
    search?: string;
    role?: string;
    company?: string;
    status?: string;
    userId?: string;
    userRole?: string;
  }): Promise<{ users: User[]; total: number }> {
    const client = await this.pool.connect();
    try {
      logger.migration('🚀 Loading paginated users with filters:', params);

      // Build WHERE clause dynamically
      const whereClauses: string[] = [];
      const queryParams: unknown[] = [];
      let paramIndex = 1;

      // Search filter (username, email, first_name, last_name)
      if (params.search && params.search.trim()) {
        whereClauses.push(`(
          u.username ILIKE $${paramIndex} OR 
          u.email ILIKE $${paramIndex} OR 
          u.first_name ILIKE $${paramIndex} OR 
          u.last_name ILIKE $${paramIndex}
        )`);
        queryParams.push(`%${params.search.trim()}%`);
        paramIndex++;
      }

      // Role filter
      if (params.role && params.role !== 'all') {
        whereClauses.push(`u.role = $${paramIndex}`);
        queryParams.push(params.role);
        paramIndex++;
      }

      // Company filter
      if (params.company && params.company !== 'all') {
        whereClauses.push(`c.name = $${paramIndex}`);
        queryParams.push(params.company);
        paramIndex++;
      }

      // Permission filtering for non-admin users
      if (params.userRole !== 'admin' && params.userId) {
        // Non-admin users can only see users from their accessible companies
        const userCompanyAccess = await this.getUserCompanyAccess(params.userId);
        const allowedCompanyIds = userCompanyAccess.map(access => access.companyId);
        
        if (allowedCompanyIds.length > 0) {
          const placeholders = allowedCompanyIds.map((_, i) => `$${paramIndex + i}`).join(',');
          whereClauses.push(`u.company_id IN (${placeholders})`);
          queryParams.push(...allowedCompanyIds);
          paramIndex += allowedCompanyIds.length;
        } else {
          // No access to any companies
          whereClauses.push('FALSE');
        }
      }

      const whereClause = whereClauses.length > 0 ? `WHERE ${whereClauses.join(' AND ')}` : '';

      // Count query
      const countQuery = `
        SELECT COUNT(*) as total
        FROM users u
        LEFT JOIN companies c ON u.company_id = c.id
        ${whereClause}
      `;

      // Data query with pagination
      const dataQuery = `
        SELECT 
          u.*,
          c.name as company_name
        FROM users u
        LEFT JOIN companies c ON u.company_id = c.id
        ${whereClause}
        ORDER BY u.created_at DESC
        LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
      `;

      // Execute queries in parallel
      const [countResult, dataResult] = await Promise.all([
        client.query(countQuery, queryParams),
        client.query(dataQuery, [...queryParams, params.limit, params.offset])
      ]);

      const total = parseInt(countResult.rows[0]?.total || '0');
      const users = dataResult.rows.map(row => ({
        id: row.id,
        username: row.username,
        email: row.email,
        password: '', // Not returned for security
        firstName: row.first_name,
        lastName: row.last_name,
        role: row.role,
        companyId: row.company_id,
        companyName: row.company_name,
        isActive: row.is_active !== false,
        createdAt: row.created_at,
        lastLogin: row.last_login
      }));

      return { users, total };

    } catch (error) {
      console.error('Error in getUsersPaginated:', error);
      throw error;
    } finally {
      client.release();
    }
  }

  // 🚀 GMAIL APPROACH: Paginated customers s filtrami
  async getCustomersPaginated(params: {
    limit: number;
    offset: number;
    search?: string;
    city?: string;
    country?: string;
    hasRentals?: string;
    userId?: string;
    userRole?: string;
  }): Promise<{ customers: Customer[]; total: number }> {
    const client = await this.pool.connect();
    try {
      logger.migration('🚀 Loading paginated customers with filters:', params);

      // Build WHERE clause dynamically
      const whereClauses: string[] = [];
      const queryParams: unknown[] = [];
      let paramIndex = 1;

      // Search filter (name, email, phone)
      if (params.search && params.search.trim()) {
        whereClauses.push(`(
          c.name ILIKE $${paramIndex} OR 
          c.email ILIKE $${paramIndex} OR 
          c.phone ILIKE $${paramIndex}
        )`);
        queryParams.push(`%${params.search.trim()}%`);
        paramIndex++;
      }

      // Has rentals filter
      if (params.hasRentals === 'yes') {
        whereClauses.push(`EXISTS (SELECT 1 FROM rentals r WHERE r.customer_id = c.id)`);
      } else if (params.hasRentals === 'no') {
        whereClauses.push(`NOT EXISTS (SELECT 1 FROM rentals r WHERE r.customer_id = c.id)`);
      }

      // Permission filtering for non-admin users
      if (params.userRole !== 'admin' && params.userId) {
        // Non-admin users can only see customers who rented from their accessible companies
        const userCompanyAccess = await this.getUserCompanyAccess(params.userId);
        const allowedCompanyIds = userCompanyAccess.map(access => access.companyId);
        
        if (allowedCompanyIds.length > 0) {
          const placeholders = allowedCompanyIds.map((_, i) => `$${paramIndex + i}`).join(',');
          whereClauses.push(`EXISTS (
            SELECT 1 FROM rentals r 
            JOIN vehicles v ON r.vehicle_id = v.id 
            WHERE r.customer_id = c.id 
            AND v.company_id IN (${placeholders})
          )`);
          queryParams.push(...allowedCompanyIds);
          paramIndex += allowedCompanyIds.length;
        } else {
          // No access to any companies
          whereClauses.push('FALSE');
        }
      }

      const whereClause = whereClauses.length > 0 ? `WHERE ${whereClauses.join(' AND ')}` : '';

      // Count query
      const countQuery = `
        SELECT COUNT(*) as total
        FROM customers c
        ${whereClause}
      `;

      // Data query with pagination
      const dataQuery = `
        SELECT 
          c.*,
          COUNT(r.id) as rental_count
        FROM customers c
        LEFT JOIN rentals r ON c.id = r.customer_id
        ${whereClause}
        GROUP BY c.id
        ORDER BY c.created_at DESC
        LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
      `;

      // Execute queries in parallel
      const [countResult, dataResult] = await Promise.all([
        client.query(countQuery, queryParams),
        client.query(dataQuery, [...queryParams, params.limit, params.offset])
      ]);

      const total = parseInt(countResult.rows[0]?.total || '0');
      const customers = dataResult.rows.map(row => ({
        id: row.id,
        name: row.name,
        email: row.email,
        phone: row.phone,
        rentalCount: parseInt(row.rental_count || '0'),
        createdAt: row.created_at
      }));

      return { customers, total };

    } catch (error) {
      console.error('Error in getCustomersPaginated:', error);
      throw error;
    } finally {
      client.release();
    }
  }

  // 🚀 NOVÁ METÓDA: Paginated rentals s filtrami
  async getRentalsPaginated(params: {
    limit: number;
    offset: number;
    search?: string;
    dateFilter?: string;
    dateFrom?: string;
    dateTo?: string;
    company?: string;
    status?: string;
    protocolStatus?: string;
    paymentMethod?: string;
    paymentStatus?: string;
    vehicleBrand?: string;
    priceMin?: string;
    priceMax?: string;
    userId?: string;
    userRole?: string;
    sortBy?: 'created_at' | 'start_date' | 'end_date' | 'smart_priority';
    sortOrder?: 'asc' | 'desc';
  }): Promise<{ rentals: Rental[]; total: number }> {
    const client = await this.pool.connect();
    try {
      if (process.env.NODE_ENV === 'development') {
        logger.migration('🚀 Loading paginated rentals with filters:', params);
      }

      // Základný WHERE clause
      const whereConditions: string[] = ['1=1'];
      const queryParams: unknown[] = [];
      let paramIndex = 1;

      // 🔍 SEARCH filter - live vyhľadávanie s normalizáciou diakritiky
      if (params.search && params.search.trim()) {
        // Search term už je normalizovaný na frontende, len ho použijeme
        const searchTerm = params.search.trim().toLowerCase();
        
        // 🔍 NORMALIZOVANÉ VYHĽADÁVANIE: Porovnávame normalizovaný search s normalizovanými stĺpcami
        // Mapovanie slovenských znakov: á→a, ä→a, č→c, ď→d, é→e, í→i, ĺ→l, ľ→l, ň→n, ó→o, ô→o, ŕ→r, š→s, ť→t, ú→u, ý→y, ž→z
        //                              Á→a, Ä→a, Č→c, Ď→d, É→e, Í→i, Ĺ→l, Ľ→l, Ň→n, Ó→o, Ô→o, Ŕ→r, Š→s, Ť→t, Ú→u, Ý→y, Ž→z
        const diacriticsFrom = 'áäčďéíĺľňóôŕšťúýžÁÄČĎÉÍĹĽŇÓÔŔŠŤÚÝŽ';
        const diacriticsTo   = 'aacdeillnoorstuyzaacdeillnoorstuyz';
        
        whereConditions.push(`(
          LOWER(translate(r.customer_name, '${diacriticsFrom}', '${diacriticsTo}')) ILIKE $${paramIndex} OR 
          LOWER(translate(r.order_number, '${diacriticsFrom}', '${diacriticsTo}')) ILIKE $${paramIndex} OR 
          LOWER(translate(v.license_plate, '${diacriticsFrom}', '${diacriticsTo}')) ILIKE $${paramIndex} OR
          LOWER(translate(v.brand, '${diacriticsFrom}', '${diacriticsTo}')) ILIKE $${paramIndex} OR
          LOWER(translate(v.model, '${diacriticsFrom}', '${diacriticsTo}')) ILIKE $${paramIndex}
        )`);
        queryParams.push(`%${searchTerm}%`);
        paramIndex++;
      }

      // 📅 DATE filter
      if (params.dateFilter && params.dateFilter !== 'all') {
        const today = new Date();
        let startDate, endDate;
        let skipNormalDateFiltering = false;

        switch (params.dateFilter) {
          case 'today': {
            startDate = new Date(today.setHours(0, 0, 0, 0));
            endDate = new Date(today.setHours(23, 59, 59, 999));
            break;
          }
          case 'today_activity': {
            // Filtruj prenájmy ktoré sa dnes začínajú ALEBO končia - KOMBINOVANÝ FILTER
            const todayStart = new Date(today);
            todayStart.setHours(0, 0, 0, 0);
            const todayEnd = new Date(today);
            todayEnd.setHours(23, 59, 59, 999);
            whereConditions.push(`(
              (r.start_date >= $${paramIndex} AND r.start_date <= $${paramIndex + 1}) OR 
              (r.end_date >= $${paramIndex} AND r.end_date <= $${paramIndex + 1})
            )`);
            queryParams.push(todayStart, todayEnd);
            paramIndex += 2;
            skipNormalDateFiltering = true;
            break;
          }
          case 'today_returns': {
            // Filtruj prenájmy ktoré sa končia dnes - ŠPECIALNY FILTER
            const todayStartReturns = new Date(today);
            todayStartReturns.setHours(0, 0, 0, 0);
            const todayEndReturns = new Date(today);
            todayEndReturns.setHours(23, 59, 59, 999);
            whereConditions.push(`r.end_date >= $${paramIndex} AND r.end_date <= $${paramIndex + 1}`);
            queryParams.push(todayStartReturns, todayEndReturns);
            paramIndex += 2;
            skipNormalDateFiltering = true;
            break;
          }
          case 'tomorrow_returns': {
            // Filtruj prenájmy ktoré sa končia zajtra - ŠPECIALNY FILTER
            const tomorrow = new Date(today);
            tomorrow.setDate(today.getDate() + 1);
            const tomorrowStart = new Date(tomorrow);
            tomorrowStart.setHours(0, 0, 0, 0);
            const tomorrowEnd = new Date(tomorrow);
            tomorrowEnd.setHours(23, 59, 59, 999);
            whereConditions.push(`r.end_date >= $${paramIndex} AND r.end_date <= $${paramIndex + 1}`);
            queryParams.push(tomorrowStart, tomorrowEnd);
            paramIndex += 2;
            skipNormalDateFiltering = true;
            break;
          }
          case 'week_activity': {
            // Filtruj prenájmy ktoré sa tento týždeň začínajú ALEBO končia - KOMBINOVANÝ FILTER
            const endOfWeekActivity = new Date(today);
            endOfWeekActivity.setDate(today.getDate() + (7 - today.getDay())); // Najbližšia nedeľa
            endOfWeekActivity.setHours(23, 59, 59, 999);
            whereConditions.push(`(
              (r.start_date > $${paramIndex} AND r.start_date <= $${paramIndex + 1}) OR 
              (r.end_date > $${paramIndex} AND r.end_date <= $${paramIndex + 1})
            )`);
            queryParams.push(today, endOfWeekActivity);
            paramIndex += 2;
            skipNormalDateFiltering = true;
            break;
          }
          case 'week_returns': {
            // Filtruj prenájmy ktoré sa končia tento týždeň (do nedele)
            const endOfWeek = new Date(today);
            endOfWeek.setDate(today.getDate() + (7 - today.getDay())); // Najbližšia nedeľa
            endOfWeek.setHours(23, 59, 59, 999);
            whereConditions.push(`r.end_date > $${paramIndex} AND r.end_date <= $${paramIndex + 1}`);
            queryParams.push(today, endOfWeek);
            paramIndex += 2;
            skipNormalDateFiltering = true;
            break;
          }
          case 'overdue':
            // Filtruj preterminované prenájmy - skončili ale nemajú return protokol
            whereConditions.push(`r.end_date < $${paramIndex} AND r.return_protocol_id IS NULL`);
            queryParams.push(today);
            paramIndex++;
            skipNormalDateFiltering = true;
            break;
          case 'new_today': {
            // Filtruj prenájmy vytvorené dnes
            const todayStartForNew = new Date(today);
            todayStartForNew.setHours(0, 0, 0, 0);
            const todayEndForNew = new Date(today);
            todayEndForNew.setHours(23, 59, 59, 999);
            whereConditions.push(`r.created_at >= $${paramIndex} AND r.created_at <= $${paramIndex + 1}`);
            queryParams.push(todayStartForNew, todayEndForNew);
            paramIndex += 2;
            skipNormalDateFiltering = true;
            break;
          }
          case 'starting_today': {
            // Filtruj prenájmy ktoré dnes začínajú
            const todayStartForStarting = new Date(today);
            todayStartForStarting.setHours(0, 0, 0, 0);
            const todayEndForStarting = new Date(today);
            todayEndForStarting.setHours(23, 59, 59, 999);
            whereConditions.push(`r.start_date >= $${paramIndex} AND r.start_date <= $${paramIndex + 1}`);
            queryParams.push(todayStartForStarting, todayEndForStarting);
            paramIndex += 2;
            skipNormalDateFiltering = true;
            break;
          }
          case 'week_handovers': {
            // Filtruj prenájmy ktoré sa začínajú tento týždeň (do nedele)
            const endOfWeekForHandovers = new Date(today);
            endOfWeekForHandovers.setDate(today.getDate() + (7 - today.getDay())); // Najbližšia nedeľa
            endOfWeekForHandovers.setHours(23, 59, 59, 999);
            whereConditions.push(`r.start_date > $${paramIndex} AND r.start_date <= $${paramIndex + 1}`);
            queryParams.push(today, endOfWeekForHandovers);
            paramIndex += 2;
            skipNormalDateFiltering = true;
            break;
          }
          case 'week': {
            const weekStart = new Date(today);
            weekStart.setDate(today.getDate() - today.getDay());
            weekStart.setHours(0, 0, 0, 0);
            const weekEnd = new Date(weekStart);
            weekEnd.setDate(weekStart.getDate() + 6);
            weekEnd.setHours(23, 59, 59, 999);
            startDate = weekStart;
            endDate = weekEnd;
            break;
          }
          case 'month':
            startDate = new Date(today.getFullYear(), today.getMonth(), 1);
            endDate = new Date(today.getFullYear(), today.getMonth() + 1, 0, 23, 59, 59, 999);
            break;
          case 'custom':
            if (params.dateFrom) startDate = new Date(params.dateFrom);
            if (params.dateTo) endDate = new Date(params.dateTo);
            break;
        }

        // Aplikuj normálne date filtrovanie len ak nie je skipnuté
        if (!skipNormalDateFiltering) {
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
      }

      // 🏢 COMPANY filter
      if (params.company && params.company !== 'all') {
        whereConditions.push(`(r.company = $${paramIndex} OR c.name = $${paramIndex})`);
        queryParams.push(params.company);
        paramIndex++;
      }

      // ⚡ STATUS filter - OPRAVENÉ pre skutočné statusy v DB
      if (params.status && params.status !== 'all') {
        whereConditions.push(`r.status = $${paramIndex}`);
        queryParams.push(params.status);
        paramIndex++;
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
        } else if (params.paymentStatus === 'unpaid') {
          whereConditions.push(`r.paid = false`);
        }
      }

      // 🚗 VEHICLE BRAND filter
      if (params.vehicleBrand && params.vehicleBrand !== 'all') {
        whereConditions.push(`v.brand = $${paramIndex}`);
        queryParams.push(params.vehicleBrand);
        paramIndex++;
      }

      // 📋 PROTOCOL STATUS filter
      if (params.protocolStatus && params.protocolStatus !== 'all') {
        switch (params.protocolStatus) {
          case 'with_handover':
            whereConditions.push(`r.handover_protocol_id IS NOT NULL`);
            break;
          case 'without_handover':
            whereConditions.push(`r.handover_protocol_id IS NULL`);
            break;
          case 'with_return':
            whereConditions.push(`r.return_protocol_id IS NOT NULL`);
            break;
          case 'without_return':
            whereConditions.push(`r.handover_protocol_id IS NOT NULL AND r.return_protocol_id IS NULL`);
            break;
        }
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
        LEFT JOIN customers cust ON r.customer_id = cust.id
        WHERE ${whereClause}
      `;

      const countResult = await client.query(countQuery, queryParams);
      const total = parseInt(countResult.rows[0].total);

      // 🎯 SMART PRIORITY SORTING: Logické zoradenie podľa priority aktivít
      let orderByClause;
      
      if (params.sortBy === 'smart_priority' || (!params.sortBy && !params.sortOrder)) {
        // Default: Smart priority sorting
        orderByClause = `
          ORDER BY 
            -- 🎯 PRIORITY CALCULATION: Vypočítaj priority score pre každý prenájom
            CASE 
              -- PRIORITA 1: Dnes sa odovzdávajú alebo preberajú (najvyššia priorita)
              WHEN DATE(r.start_date) = CURRENT_DATE OR DATE(r.end_date) = CURRENT_DATE THEN 1
              
              -- PRIORITA 2: Tento týždeň sa odovzdávajú alebo preberajú (najbližšie dni)
              WHEN (r.start_date >= CURRENT_DATE AND r.start_date <= CURRENT_DATE + INTERVAL '7 days')
                   OR (r.end_date >= CURRENT_DATE AND r.end_date <= CURRENT_DATE + INTERVAL '7 days') THEN 2
              
              -- PRIORITA 3: Aktívne prenájmy (prebiehajú práve teraz)
              WHEN r.start_date <= CURRENT_DATE AND r.end_date >= CURRENT_DATE THEN 3
              
              -- PRIORITA 4: Budúce prenájmy (začínajú sa v budúcnosti)
              WHEN r.start_date > CURRENT_DATE THEN 4
              
              -- PRIORITA 5: Historické ukončené prenájmy (najnižšia priorita - až na konci)
              WHEN r.end_date < CURRENT_DATE THEN 5
              
              -- PRIORITA 6: Fallback pre neočakávané stavy
              ELSE 6
            END ASC,
            
            -- 📅 SECONDARY SORT: V rámci rovnakej priority zoraď podľa relevantného dátumu
            CASE 
              -- Pre budúce prenájmy zoraď podľa start_date (kedy sa začínajú)
              WHEN r.start_date > CURRENT_DATE THEN r.start_date
              -- Pre aktívne a ukončené zoraď podľa end_date (kedy sa končia/skončili)
              ELSE r.end_date
            END ASC,
            
            -- 🕐 TERTIARY SORT: Ako posledné kritérium použij čas vytvorenia
            r.created_at DESC
        `;
      } else {
        // Klasické zoradenie podľa používateľom zvoleného kritéria
        orderByClause = `ORDER BY r.${params.sortBy} ${params.sortOrder?.toUpperCase() || 'ASC'}`;
      }

      // Main query s LIMIT a OFFSET
      const mainQuery = `
        SELECT 
          r.id, r.vehicle_id, r.customer_id, 
          to_char(r.start_date, 'YYYY-MM-DD HH24:MI:SS') as start_date, 
          to_char(r.end_date, 'YYYY-MM-DD HH24:MI:SS') as end_date, 
          r.total_price, r.commission, r.payment_method, r.paid, r.status, 
          r.customer_name, r.customer_email, r.customer_phone, r.created_at, r.order_number, r.deposit, 
          r.allowed_kilometers, r.daily_kilometers, r.handover_place, r.company, r.vehicle_name,
          -- 🐛 FIX: Pridané chýbajúce extra_km_charge a extra_kilometer_rate
          r.extra_km_charge, r.extra_kilometer_rate,
          -- 💰 FIX: Pridané chýbajúce discount a custom_commission pre zobrazenie zliav
          r.discount, r.custom_commission,
          r.is_flexible, r.flexible_end_date,
          v.brand, v.model, v.license_plate, v.vin, v.pricing, v.commission as v_commission, v.status as v_status,
          c.name as company_name, v.company as vehicle_company,
          -- 👤 CUSTOMER INFO: Načítanie kompletných zákazníckych údajov pre protokoly
          cust.id as customer_db_id, cust.name as customer_db_name, 
          cust.email as customer_db_email, cust.phone as customer_db_phone, cust.created_at as customer_created_at,
          
          -- 🎯 PRIORITY DEBUG: Pridaj priority score pre debugging
          CASE 
            WHEN DATE(r.start_date) = CURRENT_DATE OR DATE(r.end_date) = CURRENT_DATE THEN 1
            WHEN (r.start_date >= CURRENT_DATE AND r.start_date <= CURRENT_DATE + INTERVAL '7 days')
                 OR (r.end_date >= CURRENT_DATE AND r.end_date <= CURRENT_DATE + INTERVAL '7 days') THEN 2
            WHEN r.start_date <= CURRENT_DATE AND r.end_date >= CURRENT_DATE THEN 3
            WHEN r.start_date > CURRENT_DATE THEN 4
            WHEN r.end_date < CURRENT_DATE THEN 5
            ELSE 6
          END as priority_score
        FROM rentals r
        LEFT JOIN vehicles v ON r.vehicle_id = v.id
        LEFT JOIN companies c ON v.company_id = c.id
        LEFT JOIN customers cust ON r.customer_id = cust.id
        WHERE ${whereClause}
        ${orderByClause}
        LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
      `;

      queryParams.push(params.limit, params.offset);
      const result = await client.query(mainQuery, queryParams);

      logger.migration(`📊 Paginated query: ${result.rows.length}/${total} rentals (limit: ${params.limit}, offset: ${params.offset})`);

      // 🎯 DEBUG: Log priority distribution pre analýzu
      if (params.sortBy === 'smart_priority' || (!params.sortBy && !params.sortOrder)) {
        const priorityStats = result.rows.reduce((acc: Record<number, number>, row) => {
          const priority = row.priority_score as number;
          acc[priority] = (acc[priority] || 0) + 1;
          return acc;
        }, {});
        
        logger.migration(`🎯 SMART PRIORITY STATS:`, {
          'Priority 1 (Dnes)': priorityStats[1] || 0,
          'Priority 2 (Týždeň)': priorityStats[2] || 0,
          'Priority 3 (Aktívne)': priorityStats[3] || 0,
          'Priority 4 (Budúce)': priorityStats[4] || 0,
          'Priority 5 (Historické)': priorityStats[5] || 0,
          'Priority 6 (Fallback)': priorityStats[6] || 0
        });

        // Log prvých 3 prenájmov pre debugging
        if (result.rows.length > 0) {
          const topRentals = result.rows.slice(0, 3).map(row => ({
            customer: row.customer_name,
            startDate: row.start_date,
            endDate: row.end_date,
            priority: row.priority_score
          }));
          logger.migration(`🔝 TOP 3 RENTALS:`, topRentals);
        }
      }

      // 🐛 DEBUG: Log rentals with extra_km_charge
      const rentalsWithExtraKm = result.rows.filter(row => row.extra_km_charge);
      if (rentalsWithExtraKm.length > 0) {
        logger.migration(`🐛 PAGINATED DEBUG: Found ${rentalsWithExtraKm.length} rentals with extra_km_charge:`, 
          rentalsWithExtraKm.slice(0, 2).map(row => ({
            id: row.id,
            extra_km_charge: row.extra_km_charge,
            total_price: row.total_price
          }))
        );
      }

      // Transform data to Rental objects
      const rentals = result.rows.map((row) => this.transformRowToRental(row));

      // Apply permission filtering for non-admin users
      let filteredRentals = rentals;
      if (params.userRole !== 'admin' && params.userId) {
        const userCompanyAccess = await this.getUserCompanyAccess(params.userId);
        const allowedCompanyIds = userCompanyAccess.map(access => access.companyId);
        
        const allowedCompanyNames = await Promise.all(
          allowedCompanyIds.map(async (companyId) => {
            try {
              return await this.getCompanyNameById(companyId);
            } catch (error) {
              return null;
            }
          })
        );
        const validCompanyNames = allowedCompanyNames.filter(name => name !== null);
        
        filteredRentals = rentals.filter(rental => {
          if (rental.vehicle && rental.vehicle.ownerCompanyId) {
            return allowedCompanyIds.includes(rental.vehicle.ownerCompanyId);
          } else if (rental.vehicle && rental.vehicle.company) {
            return validCompanyNames.includes(rental.vehicle.company);
          }
          return false;
        });

        logger.migration('🔐 Permission filtering applied:', {
          originalCount: rentals.length,
          filteredCount: filteredRentals.length
        });
      }

      return {
        rentals: filteredRentals,
        total: total // Use the database count, not filtered count
      };

    } catch (error) {
      if (process.env.NODE_ENV === 'development') {
        console.error('Error in getRentalsPaginated:', error);
      }
      throw error;
    } finally {
      client.release();
    }
  }

  // 🔧 HELPER: Transform database row to Rental object
  private transformRowToRental(row: Record<string, unknown>): Rental {
    return {
      id: toString(row.id),
      vehicleId: row.vehicle_id ? toString(row.vehicle_id) : undefined,
      vehicleVin: row.vin ? toString(row.vin) : undefined, // 🆔 VIN číslo z JOIN s vehicles
      customerId: row.customer_id ? toString(row.customer_id) : undefined,
      customerName: toString(row.customer_name) || 'Neznámy zákazník',
      // 📧 CUSTOMER EMAIL & PHONE: Fallback systém pre protokoly
      customerEmail: toString(row.customer_db_email || row.customer_email) || undefined,
      customerPhone: toString(row.customer_db_phone || row.customer_phone) || undefined,
      // IMPORTANT: Dátumy už prídu ako stringy z PostgreSQL (::text)
      startDate: toString(row.start_date) as string | Date,
      endDate: toString(row.end_date) as string | Date,
      totalPrice: toNumber(row.total_price),
      commission: toNumber(row.commission),
      paymentMethod: (toString(row.payment_method) || 'cash') as 'cash' | 'bank_transfer' | 'vrp',
      // 💰 FIX: Pridané chýbajúce discount a customCommission parsing
      discount: this.safeJsonParse(row.discount, undefined) as { type: 'percentage' | 'fixed'; value: number } | undefined,
      customCommission: this.safeJsonParse(row.custom_commission, undefined) as { type: 'percentage' | 'fixed'; value: number } | undefined,
      paid: Boolean(row.paid),
      status: (toString(row.status) || 'active') as 'pending' | 'active' | 'finished',
      createdAt: row.created_at ? new Date(toString(row.created_at)) : new Date(),
      orderNumber: row.order_number ? toString(row.order_number) : undefined,
      deposit: row.deposit ? toNumber(row.deposit) : undefined,
      allowedKilometers: row.allowed_kilometers ? toNumber(row.allowed_kilometers) : undefined,
      dailyKilometers: row.daily_kilometers ? toNumber(row.daily_kilometers) : undefined,
      handoverPlace: row.handover_place ? toString(row.handover_place) : undefined,
      // 🐛 FIX: Pridané chýbajúce extraKmCharge a extraKilometerRate mapovanie
      extraKmCharge: row.extra_km_charge ? toNumber(row.extra_km_charge) : undefined,
      extraKilometerRate: row.extra_kilometer_rate !== null && row.extra_kilometer_rate !== undefined ? toNumber(row.extra_kilometer_rate) : undefined,
      company: toString(row.company) || 'Neznáma firma',
      vehicleName: row.vehicle_name ? toString(row.vehicle_name) : undefined,  // 🚗 NOVÉ: Vehicle name field
      // 🔄 OPTIMALIZOVANÉ: Flexibilné prenájmy polia
      isFlexible: Boolean(row.is_flexible),
      flexibleEndDate: row.flexible_end_date ? new Date(toString(row.flexible_end_date)) : undefined,
      // 👤 CUSTOMER OBJECT: Pre protokoly a ostatné použitie
      customer: (row.customer_db_id || row.customer_db_email || row.customer_db_phone) ? {
        id: toString(row.customer_db_id || row.customer_id),
        name: toString(row.customer_db_name || row.customer_name) || 'Neznámy zákazník',
        email: toString(row.customer_db_email || row.customer_email) || '',
        phone: toString(row.customer_db_phone || row.customer_phone) || '',
        createdAt: row.customer_created_at ? new Date(toString(row.customer_created_at)) : new Date()
      } : undefined,
      // Vehicle information from JOIN
      vehicle: row.brand ? {
        id: toString(row.vehicle_id),
        brand: toString(row.brand),
        model: toString(row.model),
        licensePlate: toString(row.license_plate),
        vin: row.vin ? toString(row.vin) : undefined, // 🆔 VIN číslo
        company: toString(row.vehicle_company || row.company_name) || 'N/A',
        pricing: this.safeJsonParse(row.pricing, []) as { id: string; minDays: number; maxDays: number; pricePerDay: number }[],
        commission: this.safeJsonParse(row.v_commission, { type: 'percentage', value: 0 }) as { type: 'percentage' | 'fixed'; value: number },
        status: (toString(row.v_status) || 'available') as 'available' | 'rented' | 'maintenance' | 'temporarily_removed' | 'removed' | 'transferred' | 'private',
        ownerCompanyId: row.company_id ? toString(row.company_id) : undefined
      } : undefined
    };
  }

  async getRentals(): Promise<Rental[]> {
    const client = await this.pool.connect();
    try {
      // 🚀 NOVÝ PRÍSTUP: Priamy JOIN ako getVehicles() - STABILNÝ ✅
      logger.migration('🔍 Loading rentals with direct JOIN...');
      
      // 🐛 DEBUG: Check vehicle_id types in rentals before JOIN
      logger.migration('🔍 DEBUG: Checking vehicle_id types in rentals...');
      const typeCheck = await client.query(`
        SELECT 
          id, 
          vehicle_id, 
          pg_typeof(vehicle_id) as vehicle_id_type,
          customer_name
        FROM rentals 
        LIMIT 3
      `);
      logger.migration('🔍 DEBUG: Sample rentals data:', typeCheck.rows);
      
      // 🔧 FIX: Remove ::uuid cast - if vehicle_id is already uuid, casting is unnecessary
      const result = await client.query(`
        SELECT 
          r.id, r.vehicle_id, r.customer_id, 
          to_char(r.start_date, 'YYYY-MM-DD HH24:MI:SS') as start_date, 
          to_char(r.end_date, 'YYYY-MM-DD HH24:MI:SS') as end_date, 
          r.total_price, r.commission, r.payment_method, r.paid, r.status, 
          r.customer_name, r.customer_email, r.customer_phone, r.created_at, r.order_number, r.deposit, 
          r.allowed_kilometers, r.daily_kilometers, r.handover_place, r.company, r.vehicle_name,
          -- 🐛 FIX: Pridané chýbajúce extra_km_charge a extra_kilometer_rate
          r.extra_km_charge, r.extra_kilometer_rate,
          -- 💰 FIX: Pridané chýbajúce discount a custom_commission pre zobrazenie zliav
          r.discount, r.custom_commission,
          -- 🔄 NOVÉ: Flexibilné prenájmy polia
          r.is_flexible, r.flexible_end_date,
          v.brand, v.model, v.license_plate, v.vin, v.pricing, v.commission as v_commission, v.status as v_status,
          -- 🏢 COMPANY INFO: Pridané pre štatistiky Top firiem
          c.name as company_name, v.company as vehicle_company,
          -- 👤 CUSTOMER INFO: Načítanie kompletných zákazníckych údajov pre protokoly
          cust.id as customer_db_id, cust.name as customer_db_name, 
          cust.email as customer_db_email, cust.phone as customer_db_phone, cust.created_at as customer_created_at
        FROM rentals r
        LEFT JOIN vehicles v ON r.vehicle_id = v.id
        LEFT JOIN companies c ON v.company_id = c.id
        LEFT JOIN customers cust ON r.customer_id = cust.id
        ORDER BY r.created_at DESC
      `);
      logger.migration(`📊 Found ${result.rows.length} rentals`);
      
      // 🔧 DEBUG: Log first 2 raw SQL results
      logger.migration('🔍 RAW SQL RESULTS (first 2 rows):');
      result.rows.slice(0, 2).forEach((row, i) => {
        logger.migration(`  Row ${i}:`, {
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
        for (const rental of missingVehicleData.slice(0, 2)) {  // Check first 2
          const vehicleCheck = await client.query('SELECT id, brand, model FROM vehicles WHERE id = $1', [rental.vehicle_id]);
          console.error(`🔍 Vehicle ${rental.vehicle_id} exists in vehicles:`, vehicleCheck.rows.length > 0 ? vehicleCheck.rows[0] : 'NOT FOUND');
        }
      }
      
      const rentals = result.rows.map(row => {
        // 🐛 DEBUG: Log first rental with extra_km_charge
        if (row.extra_km_charge) {
          logger.migration('🐛 BACKEND DEBUG: Found rental with extra_km_charge:', {
            id: row.id,
            extra_km_charge: row.extra_km_charge,
            total_price: row.total_price
          });
        }
        
        return {
        id: row.id?.toString() || '',
        vehicleId: row.vehicle_id?.toString(),
        vehicleVin: row.vin || undefined, // 🆔 VIN číslo z JOIN s vehicles
        customerId: row.customer_id?.toString(), // 👤 Customer ID z rentals tabuľky
        customerName: row.customer_name || 'Neznámy zákazník',
        // 📧 CUSTOMER EMAIL & PHONE: Fallback systém pre protokoly
        customerEmail: row.customer_db_email || row.customer_email || undefined,
        customerPhone: row.customer_db_phone || row.customer_phone || undefined,
        startDate: row.start_date, // Dátumy už prídu ako stringy z PostgreSQL (::text)
        endDate: row.end_date, // Dátumy už prídu ako stringy z PostgreSQL (::text)
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
        // 🐛 FIX: Pridané chýbajúce extraKmCharge mapovanie
        extraKmCharge: row.extra_km_charge ? parseFloat(row.extra_km_charge) : undefined,
        extraKilometerRate: row.extra_kilometer_rate !== null && row.extra_kilometer_rate !== undefined ? parseFloat(row.extra_kilometer_rate) : undefined,

        company: row.company_name || row.company || undefined,  // 🎯 CLEAN SOLUTION field - prioritize company_name from JOIN
        vehicleName: row.vehicle_name || undefined,  // 🚗 NOVÉ: Vehicle name field
        // 🔄 OPTIMALIZOVANÉ: Flexibilné prenájmy polia
        isFlexible: Boolean(row.is_flexible),
        flexibleEndDate: row.flexible_end_date ? new Date(row.flexible_end_date) : undefined,
        // 👤 CUSTOMER OBJECT: Pre protokoly a ostatné použitie
        customer: (row.customer_db_id || row.customer_db_email || row.customer_db_phone) ? {
          id: row.customer_db_id?.toString() || row.customer_id?.toString() || '',
          name: row.customer_db_name || row.customer_name || 'Neznámy zákazník',
          email: row.customer_db_email || row.customer_email || '',
          phone: row.customer_db_phone || row.customer_phone || '',
          createdAt: row.customer_created_at ? new Date(row.customer_created_at) : new Date()
        } : undefined,
        // 🚗 PRIAMO MAPOVANÉ VEHICLE DATA (ako getVehicles) ✅
        vehicle: row.brand ? {
          id: row.vehicle_id,
          brand: row.brand,
          model: row.model,
          licensePlate: row.license_plate,
          vin: row.vin || null, // 🆔 VIN číslo
          // 🏢 COMPANY INFO: Pridané pre štatistiky - použije company_name z companies tabuľky alebo fallback na vehicle_company
          company: row.company_name || row.vehicle_company || 'Bez firmy',
          pricing: typeof row.pricing === 'string' ? JSON.parse(row.pricing) : row.pricing || [],
          commission: typeof row.v_commission === 'string' ? JSON.parse(row.v_commission) : row.v_commission || { type: 'percentage', value: 0 },
          status: row.v_status || 'available'
        } : undefined
        };
      });

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
      logger.migration('🔍 MAPPED RENTALS (first 2):');
      rentals.slice(0, 2).forEach((rental, i) => {
        logger.migration(`  Mapped ${i}:`, {
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
          console.error(`  ❌ Rental ${rental.id} (${rental.customerName}) - ŽIADNA company! StartDate: ${rental.startDate}`);
        });
      } else {
        logger.migration(`✅ BULLETPROOF VALIDÁCIA: Všetkých ${rentals.length} prenájmov má company`);
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
  private safeJsonParse(value: unknown, fallback: unknown = undefined): unknown {
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
    startDate: Date | string;
    endDate: Date | string;
    totalPrice: number;
    commission: number;
    paymentMethod: string;
    discount?: Record<string, unknown>;
    customCommission?: Record<string, unknown>;
    extraKmCharge?: number;
    paid?: boolean;
    status?: string;
    handoverPlace?: string;
    confirmed?: boolean;
    payments?: Record<string, unknown>[];
    history?: Record<string, unknown>[];
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
    // 🔄 OPTIMALIZOVANÉ: Flexibilné prenájmy
    isFlexible?: boolean;
    flexibleEndDate?: Date;
    // 📧 NOVÉ: Automatické spracovanie emailov
    sourceType?: 'manual' | 'email_auto' | 'api_auto';
    approvalStatus?: 'pending' | 'approved' | 'rejected' | 'spam';
    emailContent?: string;
    autoProcessedAt?: Date;
    approvedBy?: string;
    approvedAt?: Date;
    rejectionReason?: string;
  }): Promise<Rental> {
    const client = await this.pool.connect();
    try {
      // 🎯 CLEAN SOLUTION: Rental vlastní svoj company field - JEDNODUCHO!
      let company: string | null = null;
      let vehicleName: string | null = null;
      let vehicleExtraKmPrice: number = 0.30; // Default hodnota
      
      if (rentalData.vehicleId) {
        const vehicleResult = await client.query(`
          SELECT company, brand, model, pricing FROM vehicles WHERE id = $1
        `, [rentalData.vehicleId]);
        
        if (vehicleResult.rows.length > 0) {
          company = vehicleResult.rows[0].company;
          // 🚗 NOVÉ: Vytvorenie vehicle_name z brand + model
          const brand = vehicleResult.rows[0].brand || '';
          const model = vehicleResult.rows[0].model || '';
          vehicleName = brand && model ? `${brand} ${model}` : (brand || model || null);
          // 💰 NOVÉ: Extrahovanie extraKilometerRate z pricing JSONB
          const pricing = vehicleResult.rows[0].pricing;
          if (pricing && typeof pricing === 'object') {
            // Hľadáme extraKilometerRate v pricing JSONB
            const extraKmItem = (pricing as { extraKilometerRate?: number }[])?.find?.((item: { extraKilometerRate?: number }) => item?.extraKilometerRate !== undefined);
            vehicleExtraKmPrice = extraKmItem?.extraKilometerRate ? 
              parseFloat(String(extraKmItem.extraKilometerRate)) : 0.30;
          } else {
            vehicleExtraKmPrice = 0.30;
          }
        }
      }
      
      // Použiť zadanú hodnotu alebo skopírovanú z vozidla
      const finalExtraKmPrice = rentalData.extraKilometerRate !== undefined ? 
        rentalData.extraKilometerRate : vehicleExtraKmPrice;
      const result = await client.query(`
        INSERT INTO rentals (
          vehicle_id, customer_id, customer_name, start_date, end_date, 
          total_price, commission, payment_method, discount, custom_commission, 
          extra_km_charge, paid, status, handover_place, confirmed, payments, history, order_number,
          deposit, allowed_kilometers, daily_kilometers, extra_kilometer_rate, return_conditions, 
          fuel_level, odometer, return_fuel_level, return_odometer, actual_kilometers, fuel_refill_cost,
          handover_protocol_id, return_protocol_id, company, vehicle_name,
          is_flexible, flexible_end_date,
          approval_status, email_content, auto_processed_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22, $23, $24, $25, $26, $27, $28, $29, $30, $31, $32, $33, $34, $35, $36, $37, $38)
        RETURNING id, vehicle_id, customer_id, customer_name, start_date, end_date, total_price, commission, payment_method, 
          discount, custom_commission, extra_km_charge, paid, status, handover_place, confirmed, payments, history, order_number,
          deposit, allowed_kilometers, daily_kilometers, extra_kilometer_rate, return_conditions, 
          fuel_level, odometer, return_fuel_level, return_odometer, actual_kilometers, fuel_refill_cost,
          handover_protocol_id, return_protocol_id, company, vehicle_name, created_at,
          is_flexible, flexible_end_date,
          approval_status, email_content, auto_processed_at
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
        finalExtraKmPrice,
        rentalData.returnConditions || null,
        rentalData.fuelLevel || null,
        rentalData.odometer || null,
        rentalData.returnFuelLevel || null,
        rentalData.returnOdometer || null,
        rentalData.actualKilometers || null,
        rentalData.fuelRefillCost || null,
        rentalData.handoverProtocolId || null,
        rentalData.returnProtocolId || null,
        company,  // 🎯 CLEAN SOLUTION hodnota
        vehicleName,  // 🚗 NOVÉ: Vehicle name z brand + model
        // 🔄 OPTIMALIZOVANÉ: Flexibilné prenájmy parametre (zjednodušené)
        rentalData.isFlexible || false,
        rentalData.flexibleEndDate || null,
        // 📧 NOVÉ: Automatické spracovanie emailov hodnoty (len existujúce stĺpce)
        rentalData.approvalStatus || 'approved',
        rentalData.emailContent || null,
        rentalData.autoProcessedAt || null
      ]);

      const row = result.rows[0];
      const rental = {
        id: row.id.toString(),
        vehicleId: row.vehicle_id?.toString(),
        customerId: row.customer_id?.toString(),
        customerName: row.customer_name,
        startDate: row.start_date, // ZACHOVAJ PRESNÝ ČAS BEZ TIMEZONE KONVERZIE
        endDate: row.end_date, // ZACHOVAJ PRESNÝ ČAS BEZ TIMEZONE KONVERZIE
        totalPrice: parseFloat(row.total_price) || 0,
        commission: parseFloat(row.commission) || 0,
        paymentMethod: row.payment_method,
        discount: this.safeJsonParse(row.discount, undefined) as { type: 'percentage' | 'fixed'; value: number } | undefined,
        customCommission: this.safeJsonParse(row.custom_commission, undefined) as { type: 'percentage' | 'fixed'; value: number } | undefined,
        extraKmCharge: row.extra_km_charge ? parseFloat(row.extra_km_charge) : undefined,
        paid: Boolean(row.paid),
        status: row.status || 'pending',
        handoverPlace: row.handover_place,
        confirmed: Boolean(row.confirmed),
        payments: this.safeJsonParse(row.payments, []) as { id: string; date: Date; amount: number; isPaid: boolean; note?: string; paymentMethod?: 'cash' | 'bank_transfer' | 'vrp'; invoiceNumber?: string }[],
        history: this.safeJsonParse(row.history, []) as { date: Date | string; user: string; changes: { field: string; oldValue: unknown; newValue: unknown }[] }[],
        orderNumber: row.order_number,
        deposit: row.deposit ? parseFloat(row.deposit) : undefined,
        allowedKilometers: row.allowed_kilometers || undefined,
        dailyKilometers: row.daily_kilometers || undefined,
        extraKilometerRate: row.extra_kilometer_rate !== null && row.extra_kilometer_rate !== undefined ? parseFloat(row.extra_kilometer_rate) : undefined,

        returnConditions: row.return_conditions || undefined,
        fuelLevel: row.fuel_level || undefined,
        odometer: row.odometer || undefined,
        returnFuelLevel: row.return_fuel_level || undefined,
        returnOdometer: row.return_odometer || undefined,
        actualKilometers: row.actual_kilometers || undefined,
        fuelRefillCost: row.fuel_refill_cost ? parseFloat(row.fuel_refill_cost) : undefined,
        handoverProtocolId: row.handover_protocol_id || undefined,
        returnProtocolId: row.return_protocol_id || undefined,
        company: row.company || undefined,  // 🎯 CLEAN SOLUTION field
        vehicleName: row.vehicle_name || undefined,  // 🚗 NOVÉ: Vehicle name field
        createdAt: new Date(row.created_at),
        // 🔄 OPTIMALIZOVANÉ: Flexibilné prenájmy (zjednodušené)
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
      
      return rental;
      
    } finally {
      client.release();
    }
  }

  async getRental(id: string): Promise<Rental | null> {
    const client = await this.pool.connect();
    try {
      logger.migration('🔍 getRental called for ID:', id);
      const result = await client.query(`
        SELECT r.id, r.vehicle_id, r.customer_id, 
               to_char(r.start_date, 'YYYY-MM-DD HH24:MI:SS') as start_date, 
               to_char(r.end_date, 'YYYY-MM-DD HH24:MI:SS') as end_date,
               r.total_price, r.commission, r.payment_method, r.paid, r.status, r.customer_name, r.customer_email, 
               r.customer_phone, r.created_at, r.order_number, r.deposit, r.allowed_kilometers, r.daily_kilometers, 
               r.handover_place, r.company, r.vehicle_name, r.extra_km_charge, r.extra_kilometer_rate, r.discount, 
               r.custom_commission, r.is_flexible, r.flexible_end_date, r.confirmed, r.payments, r.history,
               v.brand, v.model, v.license_plate, v.vin, v.company as vehicle_company,
               COALESCE(c.name, v.company, 'BlackRent') as billing_company_name
        FROM rentals r 
        LEFT JOIN vehicles v ON r.vehicle_id = v.id 
        LEFT JOIN companies c ON v.company_id = c.id
        WHERE r.id = $1
      `, [id]);
      
      logger.migration('📊 getRental result:', {
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
        vehicleVin: row.vin || undefined, // 🆔 VIN číslo z JOIN s vehicles
        customerId: undefined, // customer_id stĺpec neexistuje v rentals tabuľke
        customerName: row.customer_name,
        startDate: row.start_date, // Dátumy už prídu ako stringy z PostgreSQL (::text)
        endDate: row.end_date, // Dátumy už prídu ako stringy z PostgreSQL (::text)
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
        extraKilometerRate: row.extra_kilometer_rate !== null && row.extra_kilometer_rate !== undefined ? parseFloat(row.extra_kilometer_rate) : undefined,

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
          vin: row.vin || null, // 🆔 VIN číslo
          company: row.billing_company_name || 'N/A', // ✅ OPRAVENÉ: Používa fakturačnú firmu
          pricing: [],
          commission: { type: 'percentage', value: 0 },
          status: 'available'
        }
      };
    } finally {
      client.release();
    }
  }

  // 🛡️ FIXED UPDATE with proper field mapping + RETRY MECHANISM
  async updateRental(rental: Rental): Promise<void> {
    await this.executeWithRetry(async (client) => {
      logger.migration(`🔧 RENTAL UPDATE: ${rental.id}`, {
        customer: rental.customerName,
        vehicle: rental.vehicleId,
        price: rental.totalPrice,
        paid: rental.paid,
        status: rental.status,
        extraKilometerRate: rental.extraKilometerRate,
        // 🔄 OPRAVA: Pridané flexibilné prenájmy do logu
        isFlexible: rental.isFlexible,
        flexibleEndDate: rental.flexibleEndDate
      });
      
      // UPDATE with proper field mapping
      const result = await client.query(`
        UPDATE rentals SET 
          vehicle_id = $1, 
          customer_name = $2, 
          start_date = $3, 
          end_date = $4,
          total_price = $5, 
          commission = $6,
          paid = $7, 
          status = $8,
          payment_method = $9,
          handover_place = $10,
          order_number = $11,
          deposit = $12,
          allowed_kilometers = $13,
          extra_kilometer_rate = $14,
          extra_km_charge = $15,
          is_flexible = $16,
          flexible_end_date = $17,
          discount = $18,
          custom_commission = $19
        WHERE id = $20
        `, [
          rental.vehicleId || null, // UUID as string, not parseInt
          rental.customerName, 
          rental.startDate, 
          rental.endDate,
          rental.totalPrice || 0,
          rental.commission || 0, // 🐛 FIX: Pridané chýbajúce commission field
          rental.paid || false, 
          rental.status || 'pending',
          rental.paymentMethod || null,
          rental.handoverPlace || null,
          rental.orderNumber || null,
          rental.deposit || null,
          rental.allowedKilometers || null,
          rental.extraKilometerRate || null,
          rental.extraKmCharge || null,
          // 🔄 OPRAVA: Pridané flexibilné prenájmy polia
          rental.isFlexible || false,
          rental.flexibleEndDate || null,
          // 💰 NOVÉ: Podpora zliav a custom provízie
          rental.discount ? JSON.stringify(rental.discount) : null,
          rental.customCommission ? JSON.stringify(rental.customCommission) : null,
          rental.id // UUID as string, not parseInt
        ]);
        
        logger.migration(`✅ RENTAL UPDATE SUCCESS: ${rental.id} (${result.rowCount} row updated)`);
        return result;
    });
  }

  // 🛡️ PROTECTED DELETE with safety checks
  async deleteRental(id: string): Promise<void> {
    const client = await this.pool.connect();
    
    try {
      // 🛡️ OCHRANA LEVEL 1: Verificaj že prenájom existuje
      const existing = await this.getRental(id);
      if (!existing) {
        throw new Error(`RENTAL DELETE BLOCKED: Rental ${id} does not exist`);
      }
      
      // 🛡️ OCHRANA LEVEL 2: Backup pred vymazaním (DOČASNE VYPNUTÉ)
      // await this.createRentalBackup(id);
      
      // 🛡️ OCHRANA LEVEL 3: Transaction protection
      await client.query('BEGIN');
      
      try {
        // 🛡️ OCHRANA LEVEL 4: Log delete pokus
        logger.migration(`🛡️ RENTAL DELETE START: ${id}`, {
          customer: existing.customerName,
          vehicle: existing.vehicleId,
          totalPrice: existing.totalPrice,
          dateRange: `${existing.startDate} - ${existing.endDate}`
        });
        
        // 🛡️ OCHRANA LEVEL 5: Cleanup závislých záznamov pred DELETE
        logger.migration(`🧹 Cleaning up related records for rental ${id}...`);
        
        // 1. DOČASNE PRESKOČENÉ: Vyčisti email_action_logs záznamy (UUID vs INT problém)
        // const emailActionResult = await client.query(`
        //   DELETE FROM email_action_logs 
        //   WHERE rental_id = $1
        // `, [parseInt(id)]);
        logger.migration(`🧹 Skipped email action logs cleanup (UUID/INT mismatch)`);
        
        // 2. DOČASNE PRESKOČENÉ: Vyčisti email_processing_history záznamy
        // const emailHistoryResult = await client.query(
        //   'DELETE FROM email_processing_history WHERE rental_id = $1', 
        //   [parseInt(id)]
        // );
        logger.migration(`🧹 Skipped email history cleanup (UUID/INT mismatch)`);
        
        // 2. DOČASNE PRESKOČENÉ: Vyčisti protokoly (UUID vs INT problém)
        // const handoverProtocols = await client.query(
        //   'SELECT id FROM handover_protocols WHERE rental_id = $1', 
        //   [parseInt(id)]
        // );
        // const returnProtocols = await client.query(
        //   'SELECT id FROM return_protocols WHERE rental_id = $1', 
        //   [parseInt(id)]
        // );
        const handoverProtocols = { rows: [] as { id: string }[] };
        const returnProtocols = { rows: [] as { id: string }[] };
        
        // Vymaž handover protokoly vrátane R2 súborov
        for (const protocol of handoverProtocols.rows) {
          try {
            // Vymaž súbory z R2 storage
            await r2Storage.deleteProtocolFiles(protocol.id);
            logger.migration(`✅ R2 files deleted for handover protocol: ${protocol.id}`);
          } catch (error) {
            console.error(`❌ Error deleting R2 files for handover protocol ${protocol.id}:`, error);
          }
        }
        
        // Vymaž return protokoly vrátane R2 súborov
        for (const protocol of returnProtocols.rows) {
          try {
            // Vymaž súbory z R2 storage
            await r2Storage.deleteProtocolFiles(protocol.id);
            logger.migration(`✅ R2 files deleted for return protocol: ${protocol.id}`);
          } catch (error) {
            console.error(`❌ Error deleting R2 files for return protocol ${protocol.id}:`, error);
          }
        }
        
        // DOČASNE PRESKOČENÉ: Vymaž protokoly z databázy (UUID vs INT problém)
        // const handoverResult = await client.query(
        //   'DELETE FROM handover_protocols WHERE rental_id = $1', 
        //   [parseInt(id)]
        // );
        // const returnResult = await client.query(
        //   'DELETE FROM return_protocols WHERE rental_id = $1', 
        //   [parseInt(id)]
        // );
        const handoverResult = { rowCount: 0 };
        const returnResult = { rowCount: 0 };
        logger.migration(`🧹 Skipped protocols cleanup (UUID/INT mismatch)`);
        
        // 3. Teraz môžeme bezpečne zmazať rental
        const result = await client.query('DELETE FROM rentals WHERE id = $1', [parseInt(id)]);
        
        // 🛡️ OCHRANA LEVEL 6: Verify delete success
        if (result.rowCount === null || result.rowCount === 0) {
          throw new Error(`RENTAL DELETE FAILED: No rows affected for ID ${id}`);
        }
        
        if (result.rowCount > 1) {
          throw new Error(`RENTAL DELETE ERROR: Multiple rows affected (${result.rowCount}) for ID ${id}`);
        }
        
        await client.query('COMMIT');
        logger.migration(`✅ RENTAL DELETE SUCCESS: ${id}`, {
          rentalDeleted: result.rowCount,
          emailActionLogsDeleted: 0, // Skipped due to UUID/INT mismatch
          emailHistoryDeleted: 0, // Skipped due to UUID/INT mismatch
          handoverProtocolsDeleted: handoverResult.rowCount || 0,
          returnProtocolsDeleted: returnResult.rowCount || 0,
          totalRecordsDeleted: (result.rowCount || 0) + (handoverResult.rowCount || 0) + 
                              (returnResult.rowCount || 0)
        });
        
      } catch (deleteError) {
        await client.query('ROLLBACK');
        console.error(`❌ RENTAL DELETE FAILED, ROLLED BACK:`, deleteError);
        throw deleteError;
      }

      // 🚀 FÁZA 2.3: Calendar cache invalidation po zmazaní prenájmu
      this.invalidateCalendarCache();
      this.invalidateUnavailabilityCache();
      
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
      
      return result.rows.map((row: { id: string; name: string; email: string; phone: string; created_at: string }) => ({
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
      logger.migration('📝 Creating customer with data:', customerData);
      
      // Rozdelenie mena na first_name a last_name
      const nameParts = customerData.name.trim().split(/\s+/);
      const firstName = nameParts[0] || customerData.name.trim();
      const lastName = nameParts.length > 1 ? nameParts.slice(1).join(' ') : '';
      
      logger.migration('📝 Name parsing:', { 
        originalName: customerData.name, 
        firstName, 
        lastName 
      });
      
      const result = await client.query(
        'INSERT INTO customers (first_name, last_name, name, email, phone) VALUES ($1, $2, $3, $4, $5) RETURNING id, first_name, last_name, name, email, phone, created_at',
        [firstName, lastName, customerData.name, customerData.email, customerData.phone]
      );

      const row = result.rows[0];
      logger.migration('✅ Customer created with ID:', row.id);
      
      return {
        id: row.id.toString(),
        name: row.name || `${row.first_name} ${row.last_name}`.trim(),
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
      // Parse name into first_name and last_name
      const nameParts = customer.name.split(' ');
      const firstName = nameParts[0] || '';
      const lastName = nameParts.slice(1).join(' ') || '';
      
      await client.query(
        'UPDATE customers SET name = $1, first_name = $2, last_name = $3, email = $4, phone = $5 WHERE id = $6',
        [customer.name, firstName, lastName, customer.email, customer.phone, customer.id]
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
            logger.migration('✅ Company vytvorená pre expense:', expenseData.company.trim());
          }
        } catch (companyError: unknown) {
          const companyErrorObj = toError(companyError);
          logger.migration('⚠️ Company pre expense už existuje:', companyErrorObj.message);
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
        } catch (companyError: unknown) {
          const companyErrorObj = toError(companyError);
          logger.migration('⚠️ Company update pre expense error:', companyErrorObj.message);
        }
      }

      await client.query(
        'UPDATE expenses SET description = $1, amount = $2, date = $3, vehicle_id = $4, company = $5, category = $6, note = $7 WHERE id = $8',
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

  // Metódy pre kategórie nákladov
  async getExpenseCategories(): Promise<ExpenseCategory[]> {
    const client = await this.pool.connect();
    try {
      const result = await client.query(`
        SELECT id, name, display_name, description, icon, color, is_default, is_active, sort_order, created_at, updated_at, created_by
        FROM expense_categories 
        WHERE is_active = TRUE 
        ORDER BY sort_order ASC, display_name ASC
      `);
      return result.rows.map(row => ({
        id: row.id.toString(),
        name: row.name,
        displayName: row.display_name,
        description: row.description || undefined,
        icon: row.icon || 'receipt',
        color: row.color || 'primary',
        isDefault: row.is_default || false,
        isActive: row.is_active || true,
        sortOrder: row.sort_order || 0,
        createdAt: new Date(row.created_at),
        updatedAt: new Date(row.updated_at),
        createdBy: row.created_by?.toString()
      }));
    } finally {
      client.release();
    }
  }

  async createExpenseCategory(categoryData: {
    name: string;
    displayName: string;
    description?: string;
    icon?: string;
    color?: string;
    sortOrder?: number;
    createdBy?: string;
  }): Promise<ExpenseCategory> {
    const client = await this.pool.connect();
    try {
      const result = await client.query(`
        INSERT INTO expense_categories (name, display_name, description, icon, color, sort_order, created_by) 
        VALUES ($1, $2, $3, $4, $5, $6, $7) 
        RETURNING id, name, display_name, description, icon, color, is_default, is_active, sort_order, created_at, updated_at, created_by
      `, [
        categoryData.name,
        categoryData.displayName,
        categoryData.description || null,
        categoryData.icon || 'receipt',
        categoryData.color || 'primary',
        categoryData.sortOrder || 0,
        categoryData.createdBy || null
      ]);

      const row = result.rows[0];
      return {
        id: row.id.toString(),
        name: row.name,
        displayName: row.display_name,
        description: row.description || undefined,
        icon: row.icon || 'receipt',
        color: row.color || 'primary',
        isDefault: row.is_default || false,
        isActive: row.is_active || true,
        sortOrder: row.sort_order || 0,
        createdAt: new Date(row.created_at),
        updatedAt: new Date(row.updated_at),
        createdBy: row.created_by?.toString()
      };
    } finally {
      client.release();
    }
  }

  async updateExpenseCategory(category: ExpenseCategory): Promise<void> {
    const client = await this.pool.connect();
    try {
      await client.query(`
        UPDATE expense_categories 
        SET display_name = $1, description = $2, icon = $3, color = $4, sort_order = $5, updated_at = CURRENT_TIMESTAMP 
        WHERE id = $6
      `, [
        category.displayName,
        category.description || null,
        category.icon || 'receipt',
        category.color || 'primary',
        category.sortOrder || 0,
        category.id
      ]);
    } finally {
      client.release();
    }
  }

  async deleteExpenseCategory(id: string): Promise<void> {
    const client = await this.pool.connect();
    try {
      // Skontroluj či kategória nie je default
      const checkResult = await client.query('SELECT is_default FROM expense_categories WHERE id = $1', [id]);
      if (checkResult.rows.length > 0 && checkResult.rows[0].is_default) {
        throw new Error('Nemožno zmazať základnú kategóriu');
      }

      // Skontroluj či sa kategória používa v nákladoch
      const usageResult = await client.query('SELECT COUNT(*) as count FROM expenses WHERE category = (SELECT name FROM expense_categories WHERE id = $1)', [id]);
      if (parseInt(usageResult.rows[0].count) > 0) {
        throw new Error('Nemožno zmazať kategóriu ktorá sa používa v nákladoch');
      }

      await client.query('DELETE FROM expense_categories WHERE id = $1', [id]);
    } finally {
      client.release();
    }
  }

  // Metódy pre pravidelné náklady
  async getRecurringExpenses(): Promise<RecurringExpense[]> {
    const client = await this.pool.connect();
    try {
      const result = await client.query(`
        SELECT id, name, description, amount, category, company, vehicle_id, note,
               frequency, start_date, end_date, day_of_month,
               is_active, last_generated_date, next_generation_date, total_generated,
               created_at, updated_at, created_by
        FROM recurring_expenses 
        ORDER BY is_active DESC, next_generation_date ASC, name ASC
      `);
      return result.rows.map(row => ({
        id: row.id.toString(),
        name: row.name,
        description: row.description,
        amount: parseFloat(row.amount) || 0,
        category: row.category,
        company: row.company,
        vehicleId: row.vehicle_id?.toString(),
        note: row.note || undefined,
        frequency: row.frequency,
        // IMPORTANT: Vrátiť dátumy ako stringy pre zachovanie presných časov
        startDate: row.start_date,
        endDate: row.end_date || undefined,
        dayOfMonth: row.day_of_month,
        isActive: row.is_active || true,
        lastGeneratedDate: row.last_generated_date ? new Date(row.last_generated_date) : undefined,
        nextGenerationDate: row.next_generation_date ? new Date(row.next_generation_date) : undefined,
        totalGenerated: row.total_generated || 0,
        createdAt: new Date(row.created_at),
        updatedAt: new Date(row.updated_at),
        createdBy: row.created_by?.toString()
      }));
    } finally {
      client.release();
    }
  }

  async createRecurringExpense(recurringData: {
    name: string;
    description: string;
    amount: number;
    category: string;
    company: string;
    vehicleId?: string;
    note?: string;
    frequency: 'monthly' | 'quarterly' | 'yearly';
    startDate: Date;
    endDate?: Date;
    dayOfMonth: number;
    createdBy?: string;
  }): Promise<RecurringExpense> {
    const client = await this.pool.connect();
    try {
      const result = await client.query(`
        INSERT INTO recurring_expenses (name, description, amount, category, company, vehicle_id, note,
                                       frequency, start_date, end_date, day_of_month, created_by) 
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12) 
        RETURNING id, name, description, amount, category, company, vehicle_id, note,
                  frequency, start_date, end_date, day_of_month,
                  is_active, last_generated_date, next_generation_date, total_generated,
                  created_at, updated_at, created_by
      `, [
        recurringData.name,
        recurringData.description,
        recurringData.amount,
        recurringData.category,
        recurringData.company,
        recurringData.vehicleId || null,
        recurringData.note || null,
        recurringData.frequency,
        recurringData.startDate,
        recurringData.endDate || null,
        recurringData.dayOfMonth,
        recurringData.createdBy || null
      ]);

      const row = result.rows[0];
      return {
        id: row.id.toString(),
        name: row.name,
        description: row.description,
        amount: parseFloat(row.amount) || 0,
        category: row.category,
        company: row.company,
        vehicleId: row.vehicle_id?.toString(),
        note: row.note || undefined,
        frequency: row.frequency,
        // IMPORTANT: Vrátiť dátumy ako stringy pre zachovanie presných časov
        startDate: row.start_date,
        endDate: row.end_date || undefined,
        dayOfMonth: row.day_of_month,
        isActive: row.is_active || true,
        lastGeneratedDate: row.last_generated_date ? new Date(row.last_generated_date) : undefined,
        nextGenerationDate: row.next_generation_date ? new Date(row.next_generation_date) : undefined,
        totalGenerated: row.total_generated || 0,
        createdAt: new Date(row.created_at),
        updatedAt: new Date(row.updated_at),
        createdBy: row.created_by?.toString()
      };
    } finally {
      client.release();
    }
  }

  async updateRecurringExpense(recurring: RecurringExpense): Promise<void> {
    const client = await this.pool.connect();
    try {
      await client.query(`
        UPDATE recurring_expenses 
        SET name = $1, description = $2, amount = $3, category = $4, company = $5, 
            vehicle_id = $6, note = $7, frequency = $8, start_date = $9, end_date = $10, 
            day_of_month = $11, is_active = $12, updated_at = CURRENT_TIMESTAMP
        WHERE id = $13
      `, [
        recurring.name,
        recurring.description,
        recurring.amount,
        recurring.category,
        recurring.company,
        recurring.vehicleId || null,
        recurring.note || null,
        recurring.frequency,
        recurring.startDate,
        recurring.endDate || null,
        recurring.dayOfMonth,
        recurring.isActive,
        recurring.id
      ]);
    } finally {
      client.release();
    }
  }

  async deleteRecurringExpense(id: string): Promise<void> {
    const client = await this.pool.connect();
    try {
      await client.query('DELETE FROM recurring_expenses WHERE id = $1', [id]);
    } finally {
      client.release();
    }
  }

  // Automatické generovanie nákladov
  async generateRecurringExpenses(targetDate?: Date): Promise<{
    generated: number;
    skipped: number;
    errors: string[];
  }> {
    const client = await this.pool.connect();
    try {
      const today = targetDate || new Date();
      const results = { generated: 0, skipped: 0, errors: [] as string[] };

      // Získaj všetky aktívne pravidelné náklady ktoré treba vygenerovať
      const recurringResult = await client.query(`
        SELECT * FROM recurring_expenses 
        WHERE is_active = TRUE 
        AND next_generation_date <= $1
        AND (end_date IS NULL OR end_date >= $1)
      `, [today]);

      logger.migration(`🔄 Generating recurring expenses for ${today.toISOString().split('T')[0]}: ${recurringResult.rows.length} candidates`);

      for (const row of recurringResult.rows) {
        try {
          logger.migration('🔄 Processing recurring expense:', { 
            id: row.id, 
            idType: typeof row.id, 
            name: row.name 
          });
          
          const nextGenDate = new Date(row.next_generation_date);
          const recurringExpense = {
            id: row.id.toString(),
            nextGenerationDate: nextGenDate,
            generationDate: new Date(nextGenDate.getFullYear(), nextGenDate.getMonth(), row.day_of_month)
          };

          // Skontroluj či už nebol vygenerovaný pre tento mesiac
          const existingCheck = await client.query(`
            SELECT id FROM recurring_expense_generations 
            WHERE recurring_expense_id = $1 AND generation_date = $2
          `, [row.id, recurringExpense.generationDate]);

          if (existingCheck.rows.length > 0) {
            results.skipped++;
            continue;
          }

          // Vytvor nový náklad pomocou existujúcej metódy
          const generatedExpense = await this.createExpense({
            description: row.description,
            amount: parseFloat(row.amount),
            date: recurringExpense.generationDate,
            vehicleId: row.vehicle_id || undefined,
            company: row.company,
            category: row.category,
            note: row.note || undefined
          });

          const generatedExpenseId = generatedExpense.id;

          // Zaznamenaj generovanie
          await client.query(`
            INSERT INTO recurring_expense_generations (recurring_expense_id, generated_expense_id, generation_date) 
            VALUES ($1, $2, $3)
          `, [row.id, parseInt(generatedExpenseId), recurringExpense.generationDate]);

          // Aktualizuj recurring expense
          const nextDate = new Date(recurringExpense.generationDate);
          if (row.frequency === 'monthly') {
            nextDate.setMonth(nextDate.getMonth() + 1);
          } else if (row.frequency === 'quarterly') {
            nextDate.setMonth(nextDate.getMonth() + 3);
          } else if (row.frequency === 'yearly') {
            nextDate.setFullYear(nextDate.getFullYear() + 1);
          }

          await client.query(`
            UPDATE recurring_expenses 
            SET last_generated_date = $1, next_generation_date = $2, total_generated = total_generated + 1
            WHERE id = $3
          `, [recurringExpense.generationDate, nextDate, row.id]);

          results.generated++;
          logger.migration(`✅ Generated expense: ${row.description} for ${recurringExpense.generationDate.toISOString().split('T')[0]}`);

        } catch (error: unknown) {
          const errorObj = toError(error);
          results.errors.push(`Error generating ${row.name}: ${errorObj.message}`);
          console.error(`❌ Error generating recurring expense ${row.name}:`, error);
        }
      }

      return results;
    } finally {
      client.release();
    }
  }

  // Manuálne spustenie generovania
  async triggerRecurringExpenseGeneration(recurringExpenseId: string, targetDate?: Date): Promise<string> {
    const client = await this.pool.connect();
    try {
      const today = targetDate || new Date();
      
      // Získaj recurring expense
      const recurringResult = await client.query('SELECT * FROM recurring_expenses WHERE id = $1', [recurringExpenseId]);
      if (recurringResult.rows.length === 0) {
        throw new Error('Pravidelný náklad nenájdený');
      }

      const row = recurringResult.rows[0];
      const generationDate = new Date(today.getFullYear(), today.getMonth(), row.day_of_month);

      // Skontroluj duplikáty
      const existingCheck = await client.query(`
        SELECT id FROM recurring_expense_generations 
        WHERE recurring_expense_id = $1 AND generation_date = $2
      `, [recurringExpenseId, generationDate]);

      if (existingCheck.rows.length > 0) {
        throw new Error('Náklad pre tento mesiac už bol vygenerovaný');
      }

      // Vytvor náklad pomocou existujúcej metódy
      const generatedExpense = await this.createExpense({
        description: row.description,
        amount: parseFloat(row.amount),
        date: generationDate,
        vehicleId: row.vehicle_id || undefined,
        company: row.company,
        category: row.category,
        note: row.note || undefined
      });

      const generatedExpenseId = generatedExpense.id;

      // Zaznamenaj generovanie
      await client.query(`
        INSERT INTO recurring_expense_generations (recurring_expense_id, generated_expense_id, generation_date, generated_by) 
        VALUES ($1, $2, $3, $4)
      `, [recurringExpenseId, parseInt(generatedExpenseId), generationDate, 'manual']);

      // Aktualizuj recurring expense
      await client.query(`
        UPDATE recurring_expenses 
        SET last_generated_date = $1, total_generated = total_generated + 1
        WHERE id = $2
      `, [generationDate, recurringExpenseId]);

      return generatedExpenseId.toString();
    } finally {
      client.release();
    }
  }

  // Metódy pre poistky
  async getInsurances(): Promise<Insurance[]> {
    const client = await this.pool.connect();
    try {
      // 🔧 BEZPEČNÉ: Používame správne stĺpce z aktuálnej schémy
      const result = await client.query(`
        SELECT 
          i.*, 
          ins.name as insurer_name
        FROM insurances i 
        LEFT JOIN insurers ins ON i.insurer_id = ins.id 
        ORDER BY i.created_at DESC
      `);
      return result.rows.map(row => ({
        id: row.id?.toString() || '',
        vehicleId: row.vehicle_id?.toString() || '', // Priamo z insurances.vehicle_id
        type: row.type,
        policyNumber: row.policy_number || '',
        validFrom: row.valid_from ? new Date(row.valid_from) : new Date(), // Správny stĺpec
        validTo: row.valid_to ? new Date(row.valid_to) : new Date(), // Správny stĺpec
        price: parseFloat(row.price) || 0, // Správny stĺpec
        company: row.insurer_name || '', // Načítaný názov poistovne z JOIN
        paymentFrequency: row.payment_frequency || 'yearly',
        filePath: row.file_path || undefined, // Zachováme pre backward compatibility
        filePaths: row.file_paths || undefined, // Nové pole pre viacero súborov
        greenCardValidFrom: row.green_card_valid_from ? new Date(row.green_card_valid_from) : undefined, // 🟢 Biela karta
        greenCardValidTo: row.green_card_valid_to ? new Date(row.green_card_valid_to) : undefined, // 🟢 Biela karta
        kmState: row.km_state ? parseInt(row.km_state) : undefined // 🚗 Stav kilometrov pre Kasko
      }));
    } finally {
      client.release();
    }
  }

  async createInsurance(insuranceData: {
    vehicleId?: string;
    rentalId?: number;
    insurerId?: number;
    type: string;
    policyNumber: string;
    validFrom: Date;
    validTo: Date;
    price: number;
    company?: string;
    paymentFrequency?: string;
    filePath?: string;
    filePaths?: string[]; // Nové pole pre viacero súborov
    coverageAmount?: number;
    greenCardValidFrom?: Date;
    greenCardValidTo?: Date;
    kmState?: number; // 🚗 Stav kilometrov pre Kasko poistenie
  }): Promise<Insurance> {
    const client = await this.pool.connect();
    try {
      // 🔧 JEDNODUCHÉ: Databáza má vehicle_id stĺpec, takže nemusíme mapovať
      
      // 🔧 BEZPEČNÉ: Nájdeme insurerId podľa company názvu
      let finalInsurerId: number | undefined = insuranceData.insurerId;
      
      if (!finalInsurerId && insuranceData.company) {
        const insurerResult = await client.query(
          'SELECT id FROM insurers WHERE name = $1 LIMIT 1',
          [insuranceData.company]
        );
        
        if (insurerResult.rows.length > 0) {
          finalInsurerId = insurerResult.rows[0].id;
          logger.migration(`🔧 INSURANCE: Mapped company "${insuranceData.company}" to insurerId ${finalInsurerId}`);
        }
      }
      
      // ✅ OPRAVENÉ: Používame správne stĺpce podľa aktuálnej schémy + biela karta + viacero súborov
      const filePaths = insuranceData.filePaths || (insuranceData.filePath ? [insuranceData.filePath] : null);
      
      const result = await client.query(
        'INSERT INTO insurances (vehicle_id, insurer_id, policy_number, type, coverage_amount, price, valid_from, valid_to, payment_frequency, file_path, file_paths, green_card_valid_from, green_card_valid_to, km_state) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14) RETURNING id, vehicle_id, insurer_id, policy_number, type, coverage_amount, price, valid_from, valid_to, payment_frequency, file_path, file_paths, green_card_valid_from, green_card_valid_to, km_state, created_at',
        [
          insuranceData.vehicleId ? parseInt(insuranceData.vehicleId) : null, // Convert string to integer
          finalInsurerId || null, 
          insuranceData.policyNumber, 
          insuranceData.type,
          insuranceData.coverageAmount || insuranceData.price, // coverage_amount
          insuranceData.price, // price (nie premium!)
          insuranceData.validFrom, // valid_from (nie start_date!)
          insuranceData.validTo, // valid_to (nie end_date!)
          insuranceData.paymentFrequency || 'yearly', 
          insuranceData.filePath || null, // Zachováme pre backward compatibility
          filePaths, // Nové pole pre viacero súborov
          insuranceData.greenCardValidFrom || null, // 🟢 Biela karta od
          insuranceData.greenCardValidTo || null, // 🟢 Biela karta do
          insuranceData.kmState || null // 🚗 Stav kilometrov pre Kasko
        ]
      );

      const row = result.rows[0];
      return {
        id: row.id.toString(),
        vehicleId: row.vehicle_id?.toString() || '', // Z databázy
        type: row.type,
        policyNumber: row.policy_number || '',
        validFrom: new Date(row.valid_from), // Správny stĺpec
        validTo: new Date(row.valid_to), // Správny stĺpec  
        price: parseFloat(row.price) || 0, // Správny stĺpec
        company: insuranceData.company || '',
        paymentFrequency: row.payment_frequency || 'yearly',
        filePath: row.file_path || undefined, // Zachováme pre backward compatibility
        filePaths: row.file_paths || undefined, // Nové pole pre viacero súborov
        greenCardValidFrom: row.green_card_valid_from ? new Date(row.green_card_valid_from) : undefined, // 🟢 Biela karta
        greenCardValidTo: row.green_card_valid_to ? new Date(row.green_card_valid_to) : undefined, // 🟢 Biela karta
        kmState: row.km_state ? parseInt(row.km_state) : undefined // 🚗 Stav kilometrov pre Kasko
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
    company: string; // Zachovávame pre kompatibilitu
    insurerId?: string; // Nový parameter pre insurer_id
    paymentFrequency?: string;
    filePath?: string;
    filePaths?: string[]; // Nové pole pre viacero súborov
    greenCardValidFrom?: Date;
    greenCardValidTo?: Date;
    kmState?: number; // 🚗 Stav kilometrov pre Kasko poistenie
  }): Promise<Insurance> {
    const client = await this.pool.connect();
    try {
      // 🔧 BEZPEČNÉ: Nájdeme insurerId podľa company názvu
      let finalInsurerId: number | undefined = insuranceData.insurerId ? parseInt(insuranceData.insurerId) : undefined;
      
      if (!finalInsurerId && insuranceData.company) {
        const insurerResult = await client.query(
          'SELECT id FROM insurers WHERE name = $1 LIMIT 1',
          [insuranceData.company]
        );
        
        if (insurerResult.rows.length > 0) {
          finalInsurerId = insurerResult.rows[0].id;
          logger.migration(`🔧 UPDATE INSURANCE: Mapped company "${insuranceData.company}" to insurerId ${finalInsurerId}`);
        }
      }
      
      // ✅ OPRAVENÉ: Používame správne stĺpce podľa aktuálnej schémy + biela karta + viacero súborov
      const filePaths = insuranceData.filePaths || (insuranceData.filePath ? [insuranceData.filePath] : null);
      
      const result = await client.query(`
        UPDATE insurances 
        SET vehicle_id = $1, insurer_id = $2, type = $3, policy_number = $4, valid_from = $5, valid_to = $6, price = $7, coverage_amount = $8, payment_frequency = $9, file_path = $10, file_paths = $11, green_card_valid_from = $12, green_card_valid_to = $13, km_state = $14
        WHERE id = $15 
        RETURNING id, vehicle_id, insurer_id, policy_number, type, coverage_amount, price, valid_from, valid_to, payment_frequency, file_path, file_paths, green_card_valid_from, green_card_valid_to, km_state
      `, [insuranceData.vehicleId ? parseInt(insuranceData.vehicleId) : null, finalInsurerId || null, insuranceData.type, insuranceData.policyNumber, insuranceData.validFrom, insuranceData.validTo, insuranceData.price, insuranceData.price, insuranceData.paymentFrequency || 'yearly', insuranceData.filePath || null, filePaths, insuranceData.greenCardValidFrom || null, insuranceData.greenCardValidTo || null, insuranceData.kmState || null, id]);

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
        vehicleId: row.vehicle_id?.toString() || '', // Z databázy
        type: row.type,
        policyNumber: row.policy_number || '',
        validFrom: new Date(row.valid_from), // Správny stĺpec
        validTo: new Date(row.valid_to), // Správny stĺpec
        price: parseFloat(row.price) || 0, // Správny stĺpec
        company: insurerName || insuranceData.company || '', // Použijem načítaný názov poistovne
        paymentFrequency: row.payment_frequency || 'yearly',
        filePath: row.file_path || undefined, // Zachováme pre backward compatibility
        filePaths: row.file_paths || undefined, // Nové pole pre viacero súborov
        greenCardValidFrom: row.green_card_valid_from ? new Date(row.green_card_valid_from) : undefined, // 🟢 Biela karta
        greenCardValidTo: row.green_card_valid_to ? new Date(row.green_card_valid_to) : undefined, // 🟢 Biela karta
        kmState: row.km_state ? parseInt(row.km_state) : undefined // 🚗 Stav kilometrov pre Kasko
      };
    } finally {
      client.release();
    }
  }

  async deleteInsurance(id: string): Promise<void> {
    const client = await this.pool.connect();
    try {
      await client.query('DELETE FROM insurances WHERE id = $1', [id]);
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
        id: row.id?.toString() || '',
        name: row.name,
        businessId: row.ic, // IC -> businessId mapping
        taxId: row.dic, // DIC -> taxId mapping
        address: row.address || '',
        contactPerson: '', // Legacy field - unused
        email: row.email || '',
        phone: row.phone || '',
        commissionRate: parseFloat(row.default_commission_rate || '20'), // Legacy field
        isActive: row.is_active !== false,
        createdAt: new Date(row.created_at),
        // 🆕 NOVÉ POLIA PRE MAJITEĽOV
        personalIban: row.personal_iban || '',
        businessIban: row.business_iban || '',
        ownerName: row.owner_name || '',
        contactEmail: row.contact_email || '',
        contactPhone: row.contact_phone || '',
        defaultCommissionRate: parseFloat(row.default_commission_rate || '20'),
        protocolDisplayName: row.protocol_display_name || ''
      }));
    } finally {
      client.release();
    }
  }

  async createCompany(companyData: { 
    name: string;
    personalIban?: string;
    businessIban?: string;
    ownerName?: string;
    contactEmail?: string;
    contactPhone?: string;
    defaultCommissionRate?: number;
    isActive?: boolean;
  }): Promise<Company> {
    const client = await this.pool.connect();
    try {
      logger.migration('🏢 Creating company:', companyData.name);
      
      // Používame len existujúce stĺpce v companies tabuľke
      const result = await client.query(
        `INSERT INTO companies (name, address, phone, email, ic, dic) 
         VALUES ($1, $2, $3, $4, $5, $6) 
         RETURNING *`, 
        [
          companyData.name,
          '', // address - prázdne
          companyData.contactPhone || '', // phone
          companyData.contactEmail || '', // email  
          '', // ic - prázdne
          ''  // dic - prázdne
        ]
      );
      
      logger.migration('🏢 Company created successfully:', result.rows[0]);
      
      const row = result.rows[0];
      return {
        id: row.id.toString(),
        name: row.name,
        businessId: row.ic || '',
        taxId: row.dic || '',
        address: row.address || '',
        contactPerson: '', // Legacy field
        email: row.email || '',
        phone: row.phone || '',
        contractStartDate: undefined,
        contractEndDate: undefined,
        commissionRate: 20, // Default hodnota keďže nemáme default_commission_rate stĺpec
        isActive: true, // Default hodnota keďže nemáme is_active stĺpec
        createdAt: new Date(row.created_at),
        updatedAt: undefined
      };
    } catch (error) {
      console.error('❌ Error creating company:', error);
      throw error;
    } finally {
      client.release();
    }
  }

  async updateCompany(id: string, companyData: Partial<{
    name: string;
    personalIban: string;
    businessIban: string;
    ownerName: string;
    contactEmail: string;
    contactPhone: string;
    defaultCommissionRate: number;
    isActive: boolean;
    address: string;
    businessId: string; // IC
    taxId: string; // DIC
    protocolDisplayName: string; // Fakturačná firma pre protokoly
  }>): Promise<Company> {
    const client = await this.pool.connect();
    try {
      logger.migration('🏢 Updating company:', id, companyData);
      
      const result = await client.query(
        `UPDATE companies SET 
          name = COALESCE($2, name),
          personal_iban = COALESCE($3, personal_iban),
          business_iban = COALESCE($4, business_iban),
          owner_name = COALESCE($5, owner_name),
          contact_email = COALESCE($6, contact_email),
          contact_phone = COALESCE($7, contact_phone),
          default_commission_rate = COALESCE($8, default_commission_rate),
          is_active = COALESCE($9, is_active),
          address = COALESCE($10, address),
          ic = COALESCE($11, ic),
          dic = COALESCE($12, dic),
          protocol_display_name = COALESCE($13, protocol_display_name)
        WHERE id = $1 
        RETURNING *`, 
        [
          id,
          companyData.name || null,
          companyData.personalIban || null,
          companyData.businessIban || null,
          companyData.ownerName || null,
          companyData.contactEmail || null,
          companyData.contactPhone || null,
          companyData.defaultCommissionRate || null,
          companyData.isActive ?? null,
          companyData.address || null,
          companyData.businessId || null,
          companyData.taxId || null,
          companyData.protocolDisplayName || null
        ]
      );
      
      if (result.rows.length === 0) {
        throw new Error(`Company ${id} not found`);
      }
      
      const row = result.rows[0];
      return {
        id: row.id.toString(),
        name: row.name,
        businessId: row.ic || '',
        taxId: row.dic || '',
        address: row.address || '',
        contactPerson: '',
        email: row.email || '',
        phone: row.phone || '',
        contractStartDate: undefined,
        contractEndDate: undefined,
        commissionRate: parseFloat(row.default_commission_rate || '20'),
        isActive: row.is_active !== false,
        createdAt: new Date(row.created_at),
        updatedAt: undefined,
        personalIban: row.personal_iban || '',
        businessIban: row.business_iban || '',
        ownerName: row.owner_name || '',
        contactEmail: row.contact_email || '',
        contactPhone: row.contact_phone || '',
        defaultCommissionRate: parseFloat(row.default_commission_rate || '20')
      };
    } catch (error) {
      console.error('❌ Error updating company:', error);
      throw error;
    } finally {
      client.release();
    }
  }

  async deleteCompany(id: string): Promise<void> {
    const client = await this.pool.connect();
    try {
      await client.query('DELETE FROM companies WHERE id = $1', [id]);
    } finally {
      client.release();
    }
  }

  // 🤝 COMPANY INVESTORS METHODS
  
  async getCompanyInvestors(): Promise<CompanyInvestor[]> {
    const client = await this.pool.connect();
    try {
      const result = await client.query('SELECT * FROM company_investors ORDER BY last_name, first_name');
      return result.rows.map(row => ({
        id: row.id,
        firstName: row.first_name,
        lastName: row.last_name,
        email: row.email || '',
        phone: row.phone || '',
        personalId: row.personal_id || '',
        address: row.address || '',
        isActive: row.is_active !== false,
        notes: row.notes || '',
        createdAt: new Date(row.created_at),
        updatedAt: row.updated_at ? new Date(row.updated_at) : undefined
      }));
    } finally {
      client.release();
    }
  }

  async createCompanyInvestor(investorData: {
    firstName: string;
    lastName: string;
    email?: string;
    phone?: string;
    personalId?: string;
    address?: string;
    notes?: string;
  }): Promise<CompanyInvestor> {
    const client = await this.pool.connect();
    try {
      const result = await client.query(
        `INSERT INTO company_investors (
          first_name, last_name, email, phone, personal_id, address, notes
        ) VALUES ($1, $2, $3, $4, $5, $6, $7) 
        RETURNING *`,
        [
          investorData.firstName,
          investorData.lastName,
          investorData.email || null,
          investorData.phone || null,
          investorData.personalId || null,
          investorData.address || null,
          investorData.notes || null
        ]
      );

      const row = result.rows[0];
      return {
        id: row.id,
        firstName: row.first_name,
        lastName: row.last_name,
        email: row.email || '',
        phone: row.phone || '',
        personalId: row.personal_id || '',
        address: row.address || '',
        isActive: row.is_active !== false,
        notes: row.notes || '',
        createdAt: new Date(row.created_at),
        updatedAt: undefined
      };
    } finally {
      client.release();
    }
  }

  async updateCompanyInvestor(id: string, updateData: Partial<{
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
    personalId: string;
    address: string;
    isActive: boolean;
    notes: string;
  }>): Promise<CompanyInvestor> {
    const client = await this.pool.connect();
    try {
      const result = await client.query(
        `UPDATE company_investors SET 
          first_name = COALESCE($2, first_name),
          last_name = COALESCE($3, last_name),
          email = COALESCE($4, email),
          phone = COALESCE($5, phone),
          personal_id = COALESCE($6, personal_id),
          address = COALESCE($7, address),
          is_active = COALESCE($8, is_active),
          notes = COALESCE($9, notes),
          updated_at = CURRENT_TIMESTAMP
        WHERE id = $1 
        RETURNING *`,
        [
          id,
          updateData.firstName || null,
          updateData.lastName || null,
          updateData.email || null,
          updateData.phone || null,
          updateData.personalId || null,
          updateData.address || null,
          updateData.isActive ?? null,
          updateData.notes || null
        ]
      );

      if (result.rows.length === 0) {
        throw new Error(`Company investor ${id} not found`);
      }

      const row = result.rows[0];
      return {
        id: row.id,
        firstName: row.first_name,
        lastName: row.last_name,
        email: row.email || '',
        phone: row.phone || '',
        personalId: row.personal_id || '',
        address: row.address || '',
        isActive: row.is_active !== false,
        notes: row.notes || '',
        createdAt: new Date(row.created_at),
        updatedAt: new Date(row.updated_at)
      };
    } finally {
      client.release();
    }
  }

  async deleteCompanyInvestor(id: string): Promise<void> {
    const client = await this.pool.connect();
    try {
      // Najprv vymaž všetky shares
      await client.query('DELETE FROM company_investor_shares WHERE investor_id = $1', [id]);
      // Potom vymaž investora
      await client.query('DELETE FROM company_investors WHERE id = $1', [id]);
    } finally {
      client.release();
    }
  }

  async getCompanyInvestorShares(companyId: string): Promise<CompanyInvestorShare[]> {
    const client = await this.pool.connect();
    try {
      const result = await client.query(
        `SELECT 
          s.*,
          i.first_name, i.last_name, i.email, i.phone,
          c.name as company_name
        FROM company_investor_shares s
        JOIN company_investors i ON s.investor_id = i.id
        JOIN companies c ON s.company_id = c.id
        WHERE s.company_id = $1
        ORDER BY s.ownership_percentage DESC, i.last_name`,
        [companyId]
      );

      return result.rows.map(row => ({
        id: row.id,
        companyId: row.company_id.toString(),
        investorId: row.investor_id,
        ownershipPercentage: parseFloat(row.ownership_percentage),
        investmentAmount: row.investment_amount ? parseFloat(row.investment_amount) : undefined,
        investmentDate: new Date(row.investment_date),
        isPrimaryContact: row.is_primary_contact,
        profitSharePercentage: row.profit_share_percentage ? parseFloat(row.profit_share_percentage) : undefined,
        createdAt: new Date(row.created_at),
        investor: {
          id: row.investor_id,
          firstName: row.first_name,
          lastName: row.last_name,
          email: row.email || '',
          phone: row.phone || '',
          personalId: '',
          address: '',
          isActive: true,
          createdAt: new Date(),
          notes: ''
        }
      }));
    } finally {
      client.release();
    }
  }

  async createCompanyInvestorShare(shareData: {
    companyId: string;
    investorId: string;
    ownershipPercentage: number;
    investmentAmount?: number;
    isPrimaryContact: boolean;
    profitSharePercentage?: number;
  }): Promise<CompanyInvestorShare> {
    const client = await this.pool.connect();
    try {
      const result = await client.query(
        `INSERT INTO company_investor_shares (
          company_id, investor_id, ownership_percentage, investment_amount,
          is_primary_contact, profit_share_percentage
        ) VALUES ($1, $2, $3, $4, $5, $6) 
        RETURNING *`,
        [
          shareData.companyId,
          shareData.investorId,
          shareData.ownershipPercentage,
          shareData.investmentAmount || null,
          shareData.isPrimaryContact,
          shareData.profitSharePercentage || null
        ]
      );

      const row = result.rows[0];
      return {
        id: row.id,
        companyId: row.company_id.toString(),
        investorId: row.investor_id,
        ownershipPercentage: parseFloat(row.ownership_percentage),
        investmentAmount: row.investment_amount ? parseFloat(row.investment_amount) : undefined,
        investmentDate: new Date(row.investment_date),
        isPrimaryContact: row.is_primary_contact,
        profitSharePercentage: row.profit_share_percentage ? parseFloat(row.profit_share_percentage) : undefined,
        createdAt: new Date(row.created_at)
      };
    } finally {
      client.release();
    }
  }

  async updateCompanyInvestorShare(id: string, updateData: Partial<{
    ownershipPercentage: number;
    investmentAmount: number;
    isPrimaryContact: boolean;
    profitSharePercentage: number;
  }>): Promise<CompanyInvestorShare> {
    const client = await this.pool.connect();
    try {
      const result = await client.query(
        `UPDATE company_investor_shares SET 
          ownership_percentage = COALESCE($2, ownership_percentage),
          investment_amount = COALESCE($3, investment_amount),
          is_primary_contact = COALESCE($4, is_primary_contact),
          profit_share_percentage = COALESCE($5, profit_share_percentage)
        WHERE id = $1 
        RETURNING *`,
        [
          id,
          updateData.ownershipPercentage ?? null,
          updateData.investmentAmount ?? null,
          updateData.isPrimaryContact ?? null,
          updateData.profitSharePercentage ?? null
        ]
      );

      if (result.rows.length === 0) {
        throw new Error(`Company investor share ${id} not found`);
      }

      const row = result.rows[0];
      return {
        id: row.id,
        companyId: row.company_id.toString(),
        investorId: row.investor_id,
        ownershipPercentage: parseFloat(row.ownership_percentage),
        investmentAmount: row.investment_amount ? parseFloat(row.investment_amount) : undefined,
        investmentDate: new Date(row.investment_date),
        isPrimaryContact: row.is_primary_contact,
        profitSharePercentage: row.profit_share_percentage ? parseFloat(row.profit_share_percentage) : undefined,
        createdAt: new Date(row.created_at)
      };
    } finally {
      client.release();
    }
  }

  async deleteCompanyInvestorShare(id: string): Promise<void> {
    const client = await this.pool.connect();
    try {
      await client.query('DELETE FROM company_investor_shares WHERE id = $1', [id]);
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
      logger.migration('🔍 Starting getSettlements - checking/creating table...');
      
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
      logger.migration('✅ Settlements table ensured');
      
      logger.migration('✅ Settlements table ready');

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
      
      logger.migration(`📊 Found ${result.rows.length} settlements`);

      // Load rentals and expenses for filtering
      const allRentals = await this.getRentals();
      const allExpenses = await this.getExpenses();

      // Map to Settlement interface format
      return result.rows.map((row: { id: string; from_date: string; to_date: string; company: string; total_revenue: string; total_commission: string; total_rentals: string; created_at: string; status: string; total_income?: string; total_expenses?: string; commission?: string; profit?: string }) => {
        const fromDate = new Date(row.from_date || new Date());
        const toDate = new Date(row.to_date || new Date());
        const company = row.company || 'Default Company';
        
                 // Filter rentals for this settlement (FIXED: only include rentals that START in the period)
         const filteredRentals = allRentals.filter(rental => {
           const rentalStart = new Date(rental.startDate);
           const isInPeriod = rentalStart >= fromDate && rentalStart <= toDate;
           
           // 🔧 FIXED: Use vehicle.company (from corrected getRentals) or fallback to rental.company
           const vehicleCompany = rental.vehicle?.company;
           const rentalCompany = rental.company; // Historical snapshot
           const hasMatchingCompany = vehicleCompany === company || rentalCompany === company;
          
          if (row.id && (isInPeriod || hasMatchingCompany)) {
            logger.migration(`🏠 Settlement ${row.id} - Rental ${rental.id}: Vehicle company: "${vehicleCompany}", Historical company: "${rentalCompany}", Settlement company: "${company}", Match: ${hasMatchingCompany}, Period: ${isInPeriod}`);
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
          totalIncome: parseFloat(row.total_income || '0') || 0,
          totalExpenses: parseFloat(row.total_expenses || '0') || 0,
          totalCommission: parseFloat(row.commission || '0') || 0,
          profit: parseFloat(row.profit || '0') || 0,
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
      
      // Načítaj súvisiace prenájmy a náklady a filtruj ich
      const allRentals = await this.getRentals();
      const allExpenses = await this.getExpenses();
      
      const fromDate = new Date(row.from_date);
      const toDate = new Date(row.to_date);
      const company = row.company;
      
      // Filter rentals for this settlement (FIXED: only include rentals that START in the period)
      const filteredRentals = allRentals.filter(rental => {
        const rentalStart = new Date(rental.startDate);
        const isInPeriod = rentalStart >= fromDate && rentalStart <= toDate;
        
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
    rentals?: Rental[];
    expenses?: Expense[];
  }): Promise<Settlement> {
    const client = await this.pool.connect();
    try {
      logger.migration('🔍 Creating settlement with data:', settlementData);
      
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
      logger.migration('✅ Settlements table ensured for create operation');
      
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
      logger.migration('✅ Settlement created successfully:', row.id);
      
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

  async updateSettlement(id: string, updateData: { totalIncome?: number; totalExpenses?: number; commission?: number; profit?: number; summary?: string }): Promise<Settlement> {
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
        updateData.commission,
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
  private extractMediaData(mediaArray: unknown[]): { url: string; type: string; category?: string }[] {
    try {
      if (!Array.isArray(mediaArray)) {
        logger.migration('⚠️ extractMediaData: mediaArray is not an array, returning empty array');
        return [];
      }
      
      if (mediaArray.length === 0) {
        logger.migration('🔍 extractMediaData: Empty mediaArray, returning empty array');
        return [];
      }
      
      logger.migration('🔍 extractMediaData: Processing mediaArray with', mediaArray.length, 'items');
      
      const mediaData = mediaArray
        .filter(item => item !== null && item !== undefined)
        .map(item => {
          try {
            // Ak je item string (base64 URL), vytvor objekt
            if (typeof item === 'string') {
              logger.migration('🔍 extractMediaData: Found string item (base64 URL)');
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
              const itemObj = item as Record<string, unknown>;
              logger.migration('🔍 extractMediaData: Found object item:', itemObj.id || 'no id');
              return item;
            }
            logger.migration('⚠️ extractMediaData: Ignoring invalid item:', item);
            return null;
          } catch (error) {
            console.error('❌ extractMediaData: Error processing item:', error);
            return null;
          }
        })
        .filter((item): item is { url: string; type: string; category?: string } => item !== null);
      
      logger.migration('✅ extractMediaData: Successfully extracted', mediaData.length, 'media items');
      return mediaData;
    } catch (error) {
      console.error('❌ extractMediaData: Critical error:', error);
      return [];
    }
  }

  private mapMediaObjectsFromDB(mediaData: unknown[]): { id: string; url: string; type: string; description: string; timestamp: Date; compressed: boolean; category?: string }[] {
    if (!Array.isArray(mediaData)) {
      logger.migration('⚠️ mapMediaObjectsFromDB: mediaData is not an array, returning empty array');
      return [];
    }
    
    return mediaData
      .filter((item): item is Record<string, unknown> => item !== null && typeof item === 'object')
      .map(item => ({
        id: (item.id as string) || `${Date.now()}_${Math.random()}`,
        url: (item.url as string) || String(item),
        type: (item.type as string) || this.getMediaTypeFromUrl((item.url as string) || ''),
        description: (item.description as string) || '',
        timestamp: item.timestamp ? new Date(item.timestamp as string) : new Date(),
        compressed: Boolean(item.compressed),
        category: item.category as string | undefined
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
      
      logger.migration(`✅ Protocol ${mediaType} uploaded to R2:`, url);
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
      
      logger.migration(`✅ Protocol PDF (${protocolType}) uploaded to R2:`, url);
      return url;
    } catch (error) {
      console.error(`❌ Error uploading protocol PDF (${protocolType}) to R2:`, error);
      throw error;
    }
  }

  // PROTOCOLS METHODS
  async initProtocolTables(): Promise<void> {
    // ✅ CACHE: Ak už sú tabuľky inicializované, preskoč
    if (this.protocolTablesInitialized) {
      return;
    }
    
    const client = await this.pool.connect();
    try {
      // ✅ RÝCHLA KONTROLA: Skontroluj či tabuľky už existujú
      const tablesExist = await client.query(`
        SELECT EXISTS (
          SELECT FROM information_schema.tables 
          WHERE table_name = 'handover_protocols'
        ) AND EXISTS (
          SELECT FROM information_schema.tables 
          WHERE table_name = 'return_protocols'
        )
      `);
      
      if (tablesExist.rows[0].exists) {
        logger.migration('✅ Protocol tables already exist, skipping migration');
        this.protocolTablesInitialized = true;
        return;
      }
      
      logger.migration('🔧 Initializing protocol tables...');

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
        logger.migration('🔄 Running protocol tables migration...');
        
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
          
          logger.migration('✅ Added missing columns to handover_protocols');
        } catch (columnError) {
          logger.migration('⚠️ Column migration failed (columns might already exist):', columnError);
        }
        
        logger.migration('✅ Protocol tables migration completed');
      } catch (migrationError) {
        logger.migration('⚠️ Protocol tables migration failed (tables might already be migrated):', migrationError);
      }

      logger.migration('✅ Protocol tables initialized successfully');
      
      // ✅ CACHE: Označ že tabuľky sú inicializované
      this.protocolTablesInitialized = true;

    } catch (error) {
      console.error('❌ Error initializing protocol tables:', error);
      throw error;
    } finally {
      client.release();
    }
  }

  // HANDOVER PROTOCOLS
  async createHandoverProtocol(protocolData: { id: string; rentalId: string; pdfUrl?: string; media?: unknown[]; vehicleImages?: unknown[]; vehicleVideos?: unknown[]; documentImages?: unknown[]; damageImages?: unknown[]; vehicleCondition?: Record<string, unknown>; [key: string]: unknown }): Promise<{ id: string; rentalId: string; pdfUrl?: string; media?: unknown[] }> {
    const client = await this.pool.connect();
    try {
      logger.migration('🔄 [DB] createHandoverProtocol - input:', JSON.stringify(protocolData, null, 2));
      await this.initProtocolTables();
      
      logger.migration('🔄 Creating handover protocol:', protocolData.id);
      logger.migration('🔄 Protocol data:', JSON.stringify(protocolData, null, 2));
      logger.migration('🔄 PDF URL from input:', protocolData.pdfUrl);

      // Validácia dát
      if (!protocolData.rentalId) {
        throw new Error('Rental ID is required');
      }

      // MÉDIA: Použij priamo médiá z frontendu - už sú v správnom formáte
      logger.migration('🔄 [DB] Media before DB insert:', {
        vehicleImages: protocolData.vehicleImages?.length || 0,
        vehicleVideos: protocolData.vehicleVideos?.length || 0,
        documentImages: protocolData.documentImages?.length || 0,
        damageImages: protocolData.damageImages?.length || 0
      });

      logger.migration('🔄 PDF URL before DB insert:', protocolData.pdfUrl);

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
        (protocolData.vehicleCondition?.odometer as number) || 0,
        (protocolData.vehicleCondition?.fuelLevel as number) || 100,
        (protocolData.vehicleCondition?.fuelType as string) || 'Benzín',
        (protocolData.vehicleCondition?.exteriorCondition as string) || 'Dobrý',
        (protocolData.vehicleCondition?.interiorCondition as string) || 'Dobrý',
        (protocolData.vehicleCondition?.notes as string) || '',
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
      logger.migration('✅ Handover protocol created:', row.id);
      logger.migration('✅ PDF URL in database:', row.pdf_url);
      logger.migration('✅ Media in database:', {
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
      logger.migration('✅ Updated rental', protocolData.rentalId, 'with handover protocol ID:', row.id);
      
      const mappedProtocol = this.mapHandoverProtocolFromDB(row);
      logger.migration('✅ Mapped protocol pdfUrl:', mappedProtocol.pdfUrl);
      logger.migration('✅ Mapped protocol media:', {
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

  async getHandoverProtocolsByRental(rentalId: string): Promise<HandoverProtocol[]> {
    const client = await this.pool.connect();
    try {
      // ✅ PERFORMANCE: Odstránené initProtocolTables() - tabuľky už existujú
      
      const result = await client.query(`
        SELECT * FROM handover_protocols 
        WHERE rental_id = $1::integer 
        ORDER BY created_at DESC
      `, [parseInt(rentalId)]);

      return result.rows.map((row: Record<string, unknown>) => this.mapHandoverProtocolFromDB(row));

    } catch (error) {
      console.error('❌ Error fetching handover protocols:', error);
      return [];
    } finally {
      client.release();
    }
  }

  async getHandoverProtocolById(id: string): Promise<HandoverProtocol | null> {
    const client = await this.pool.connect();
    try {
      await this.initProtocolTables();
      
      const result = await client.query(`
        SELECT * FROM handover_protocols WHERE id = $1::uuid
      `, [id]);

      if (result.rows.length === 0) return null;
      return this.mapHandoverProtocolFromDB(result.rows[0] as Record<string, unknown>);

    } catch (error) {
      console.error('❌ Error fetching handover protocol:', error);
      return null;
    } finally {
      client.release();
    }
  }

  // RETURN PROTOCOLS
  async createReturnProtocol(protocolData: Partial<ReturnProtocol> & { id: string; rentalId: string }): Promise<ReturnProtocol> {
    const client = await this.pool.connect();
    try {
      await this.initProtocolTables();
      
      logger.migration('🔄 Creating return protocol:', protocolData.id);

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
      logger.migration('✅ Return protocol created:', row.id);
      
      // ✅ UPDATE RENTAL with protocol ID
      await client.query(`
        UPDATE rentals 
        SET return_protocol_id = $1 
        WHERE id = $2
      `, [row.id, protocolData.rentalId]);
      logger.migration('✅ Updated rental', protocolData.rentalId, 'with return protocol ID:', row.id);
      
      return this.mapReturnProtocolFromDB(row);
    } catch (error) {
      console.error('❌ Error creating return protocol:', error);
      throw error;
    } finally {
      client.release();
    }
  }

  async getReturnProtocolsByRental(rentalId: string): Promise<ReturnProtocol[]> {
    const client = await this.pool.connect();
    try {
      // ✅ PERFORMANCE: Odstránené initProtocolTables() - tabuľky už existujú
      
      const result = await client.query(`
        SELECT * FROM return_protocols 
        WHERE rental_id = $1::integer 
        ORDER BY created_at DESC
      `, [parseInt(rentalId)]);

      return result.rows.map(row => this.mapReturnProtocolFromDB(row));

    } catch (error) {
      console.error('❌ Error fetching return protocols:', error);
      return [];
    } finally {
      client.release();
    }
  }

  async getReturnProtocolById(id: string): Promise<ReturnProtocol | null> {
    const client = await this.pool.connect();
    try {
      await this.initProtocolTables();
      
      const result = await client.query(`
        SELECT * FROM return_protocols WHERE id = $1::uuid
      `, [id]);

      if (result.rows.length === 0) return null;
      return this.mapReturnProtocolFromDB(result.rows[0] as Record<string, unknown>);

    } catch (error) {
      console.error('❌ Error fetching return protocol:', error);
      return null;
    } finally {
      client.release();
    }
  }

  async updateReturnProtocol(id: string, updateData: Partial<ReturnProtocol>): Promise<ReturnProtocol> {
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

      if (result.rows.length === 0) {
        throw new Error('Return protocol not found');
      }
      return this.mapReturnProtocolFromDB(result.rows[0] as Record<string, unknown>);

    } catch (error) {
      console.error('❌ Error updating return protocol:', error);
      throw error;
    } finally {
      client.release();
    }
  }

  // Mapping methods
  private mapHandoverProtocolFromDB(row: Record<string, unknown>): HandoverProtocol {
    // Safe JSON parsing function for JSONB fields
    const safeJsonParse = (value: unknown, fallback: unknown = []) => {
      logger.migration('🔍 [DB] safeJsonParse input:', {
        value: value,
        type: typeof value,
        isArray: Array.isArray(value),
        isNull: value === null,
        isUndefined: value === undefined,
        stringLength: typeof value === 'string' ? value.length : 'N/A'
      });

      if (!value || value === 'null' || value === 'undefined') {
        logger.migration('🔍 [DB] safeJsonParse: returning fallback (null/undefined)');
        return fallback;
      }
      
      // JSONB sa automaticky parsuje PostgreSQL, takže ak je to už objekt, vráť ho
      if (typeof value === 'object' && value !== null) {
        // ✅ NOVÁ LOGIKA: Ak je to pole stringov, parsuj každý string
        if (Array.isArray(value) && value.length > 0 && typeof value[0] === 'string') {
          logger.migration('🔍 [DB] safeJsonParse: parsing array of JSON strings');
          try {
            const parsed = value.map(item => {
              if (typeof item === 'string') {
                return JSON.parse(item);
              }
              return item;
            });
            logger.migration('🔍 [DB] safeJsonParse: successfully parsed array of strings:', parsed);
            return parsed;
          } catch (error) {
            logger.migration('⚠️ Error parsing array of JSON strings:', error);
            return fallback;
          }
        }
        
        logger.migration('🔍 [DB] safeJsonParse: value is already object, returning as is');
        return value;
      }
      
      // Ak je to string, skús ho parsovať
      if (typeof value === 'string') {
        try {
          const parsed = JSON.parse(value);
          logger.migration('🔍 [DB] safeJsonParse: successfully parsed string to:', parsed);
          return parsed;
        } catch (error) {
          logger.migration('⚠️ JSON parse error in mapHandoverProtocolFromDB:', error);
          return fallback;
        }
      }
      
      logger.migration('🔍 [DB] safeJsonParse: returning fallback (unknown type)');
      return fallback;
    };

    logger.migration('🔄 [DB] Mapping handover protocol from DB row:', {
      id: row.id,
      pdf_url: row.pdf_url,
      pdf_url_type: typeof row.pdf_url,
      vehicle_images_type: typeof row.vehicle_images_urls,
      vehicle_images_length: Array.isArray(row.vehicle_images_urls) ? row.vehicle_images_urls.length : 'not array',
      vehicle_images_raw: row.vehicle_images_urls
    });

    const mappedProtocol: HandoverProtocol = {
      id: toString(row.id),
      rentalId: toString(row.rental_id),
      type: 'handover' as const,
      status: (toString(row.status) || 'completed') as 'draft' | 'completed' | 'cancelled',
      location: toString(row.location),
      createdAt: new Date(String(row.created_at)),
      completedAt: row.completed_at ? new Date(String(row.completed_at)) : new Date(String(row.created_at)),
      vehicleCondition: {
        odometer: toNumber(row.odometer),
        fuelLevel: toNumber(row.fuel_level) || 100,
        fuelType: (toString(row.fuel_type) || 'gasoline') as 'gasoline' | 'diesel' | 'electric' | 'hybrid',
        exteriorCondition: toString(row.exterior_condition) || 'Dobrý',
        interiorCondition: toString(row.interior_condition) || 'Dobrý',
        notes: toString(row.condition_notes)
      },
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      vehicleImages: safeJsonParse(row.vehicle_images_urls, []) as any,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      vehicleVideos: safeJsonParse(row.vehicle_videos_urls, []) as any,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      documentImages: safeJsonParse(row.document_images_urls, []) as any,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      documentVideos: safeJsonParse(row.document_videos_urls, []) as any,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      damageImages: safeJsonParse(row.damage_images_urls, []) as any,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      damageVideos: safeJsonParse(row.damage_videos_urls, []) as any,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      damages: safeJsonParse(row.damages, []) as any,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      signatures: safeJsonParse(row.signatures, []) as any,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      rentalData: safeJsonParse(row.rental_data, {}) as any,
      pdfUrl: toString(row.pdf_url) || undefined,
      emailSent: Boolean(row.email_sent),
      emailSentAt: row.email_sent_at ? new Date(String(row.email_sent_at)) : undefined,
      notes: toString(row.notes) || undefined,
      createdBy: toString(row.created_by)
    };

    logger.migration('🔄 [DB] Mapped protocol media:', {
      vehicleImages: mappedProtocol.vehicleImages?.length || 0,
      vehicleVideos: mappedProtocol.vehicleVideos?.length || 0,
      documentImages: mappedProtocol.documentImages?.length || 0,
      damageImages: mappedProtocol.damageImages?.length || 0,
      vehicleImagesSample: mappedProtocol.vehicleImages?.slice(0, 2) || []
    });
    
    return mappedProtocol;
  }

  private mapReturnProtocolFromDB(row: Record<string, unknown>): ReturnProtocol {
    // Safe JSON parsing function for JSONB fields
    const safeJsonParse = (value: unknown, fallback: unknown = []) => {
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
          logger.migration('⚠️ JSON parse error in mapReturnProtocolFromDB:', error);
          return fallback;
        }
      }
      return fallback;
    };

    return {
      id: toString(row.id),
      rentalId: toString(row.rental_id),
      handoverProtocolId: toString(row.handover_protocol_id),
      type: 'return' as const,
      status: (toString(row.status) || 'draft') as 'draft' | 'completed' | 'cancelled',
      location: toString(row.location),
      createdAt: new Date(String(row.created_at)),
      completedAt: row.completed_at ? new Date(String(row.completed_at)) : undefined,
      vehicleCondition: {
        odometer: toNumber(row.odometer),
        fuelLevel: toNumber(row.fuel_level) || 100,
        fuelType: (toString(row.fuel_type) || 'gasoline') as 'gasoline' | 'diesel' | 'electric' | 'hybrid',
        exteriorCondition: toString(row.exterior_condition) || 'Dobrý',
        interiorCondition: toString(row.interior_condition) || 'Dobrý',
        notes: toString(row.condition_notes)
      },
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      vehicleImages: safeJsonParse(row.vehicle_images_urls, []) as any,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      vehicleVideos: safeJsonParse(row.vehicle_videos_urls, []) as any,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      documentImages: safeJsonParse(row.document_images_urls, []) as any,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      documentVideos: safeJsonParse(row.document_videos_urls, []) as any,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      damageImages: safeJsonParse(row.damage_images_urls, []) as any,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      damageVideos: safeJsonParse(row.damage_videos_urls, []) as any,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      damages: safeJsonParse(row.damages, []) as any,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      newDamages: safeJsonParse(row.new_damages, []) as any,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      signatures: safeJsonParse(row.signatures, []) as any,
      kilometersUsed: toNumber(row.kilometers_used),
      kilometerOverage: toNumber(row.kilometer_overage),
      kilometerFee: toNumber(row.kilometer_fee),
      fuelUsed: toNumber(row.fuel_used),
      fuelFee: toNumber(row.fuel_fee),
      totalExtraFees: toNumber(row.total_extra_fees),
      depositRefund: toNumber(row.deposit_refund),
      additionalCharges: toNumber(row.additional_charges),
      finalRefund: toNumber(row.final_refund),
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      rentalData: safeJsonParse(row.rental_data, {}) as any,
      pdfUrl: toString(row.pdf_url) || undefined,
      emailSent: Boolean(row.email_sent),
      emailSentAt: row.email_sent_at ? new Date(String(row.email_sent_at)) : undefined,
      notes: toString(row.notes) || undefined,
      createdBy: toString(row.created_by)
    };
  }

  // Zatvorenie spojenia
  async deleteHandoverProtocol(id: string): Promise<boolean> {
    const client = await this.pool.connect();
    try {
      logger.migration(`🗑️ Deleting handover protocol: ${id}`);
      
      // Najprv získaj protokol aby sme vedeli vymazať súbory
      const protocol = await this.getHandoverProtocolById(id);
      if (!protocol) {
        logger.migration(`⚠️ Protocol ${id} not found`);
        return false;
      }
      
      // Vymazanie z databázy
      const result = await client.query(`
        DELETE FROM handover_protocols WHERE id = $1::uuid
      `, [id]);
      
      if (result.rowCount === 0) {
        logger.migration(`⚠️ No protocol deleted from database: ${id}`);
        return false;
      }
      
      // ✅ MAZANIE SÚBOROV Z R2
      try {
        await r2Storage.deleteProtocolFiles(id);
        logger.migration(`✅ Protocol files deleted from R2: ${id}`);
      } catch (error) {
        console.error(`❌ Error deleting protocol files from R2: ${error}`);
        // Pokračujeme aj keď sa súbory nevymazali
      }
      
      logger.migration(`✅ Handover protocol deleted successfully: ${id}`);
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
      logger.migration(`🗑️ Deleting return protocol: ${id}`);
      
      // Najprv získaj protokol aby sme vedeli vymazať súbory
      const protocol = await this.getReturnProtocolById(id);
      if (!protocol) {
        logger.migration(`⚠️ Protocol ${id} not found`);
        return false;
      }
      
      // Vymazanie z databázy
      const result = await client.query(`
        DELETE FROM return_protocols WHERE id = $1::uuid
      `, [id]);
      
      if (result.rowCount === 0) {
        logger.migration(`⚠️ No protocol deleted from database: ${id}`);
        return false;
      }
      
      // ✅ MAZANIE SÚBOROV Z R2
      try {
        await r2Storage.deleteProtocolFiles(id);
        logger.migration(`✅ Protocol files deleted from R2: ${id}`);
      } catch (error) {
        console.error(`❌ Error deleting protocol files from R2: ${error}`);
        // Pokračujeme aj keď sa súbory nevymazali
      }
      
      logger.migration(`✅ Return protocol deleted successfully: ${id}`);
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
  async updateHandoverProtocol(id: string, updateData: Partial<HandoverProtocol>): Promise<HandoverProtocol> {
    const client = await this.pool.connect();
    try {
      logger.migration('🔄 Updating handover protocol:', id);
      logger.migration('🔄 Update data:', JSON.stringify(updateData, null, 2));

      // Dynamické vytvorenie SET klauzuly
      const setFields: string[] = [];
      const values: unknown[] = [];
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

      // Pridanie updated_at - OPRAVENÉ: stĺpec neexistuje
      // setFields.push('updated_at = CURRENT_TIMESTAMP');

      const query = `
        UPDATE handover_protocols 
        SET ${setFields.join(', ')}
        WHERE id = $${paramIndex}::uuid
        RETURNING *
      `;
      values.push(id);

      logger.migration('🔄 Update query:', query);
      logger.migration('🔄 Update values:', values);

      const result = await client.query(query, values);

      if (result.rows.length === 0) {
        throw new Error('Protokol nebol nájdený');
      }

      const updatedProtocol = this.mapHandoverProtocolFromDB(result.rows[0]);
      logger.migration('✅ Handover protocol updated successfully');
      
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

  async getVehicleUnavailabilities(vehicleId?: string, startDate?: Date, endDate?: Date): Promise<VehicleUnavailability[]> {
    const client = await this.pool.connect();
    try {
      let query = `
        SELECT vu.*, v.brand, v.model, v.license_plate 
        FROM vehicle_unavailability vu
        LEFT JOIN vehicles v ON vu.vehicle_id = v.id
        WHERE 1=1
      `;
      const params: unknown[] = [];
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
      
      return result.rows.map((row: Record<string, unknown>): VehicleUnavailability => ({
        id: toString(row.id),
        vehicleId: toString(row.vehicle_id),
        vehicle: row.brand ? {
          id: toString(row.vehicle_id),
          brand: toString(row.brand),
          model: toString(row.model),
          licensePlate: toString(row.license_plate),
          pricing: [],
          commission: { type: 'percentage', value: 0 },
          status: 'available' as const
        } : undefined,
        startDate: row.start_date as Date | string, // ZACHOVAJ PRESNÝ ČAS BEZ TIMEZONE KONVERZIE
        endDate: row.end_date as Date | string, // ZACHOVAJ PRESNÝ ČAS BEZ TIMEZONE KONVERZIE
        reason: toString(row.reason),
        type: toString(row.type) as 'maintenance' | 'service' | 'repair' | 'blocked' | 'cleaning' | 'inspection' | 'rented' | 'private_rental',
        notes: toString(row.notes),
        priority: toNumber(row.priority) as 1 | 2 | 3,
        recurring: Boolean(row.recurring),
        recurringConfig: row.recurring_config ? JSON.parse(toString(row.recurring_config)) : undefined,
        createdAt: new Date(String(row.created_at)),
        updatedAt: new Date(String(row.updated_at)),
        createdBy: toString(row.created_by)
      }));
    } finally {
      client.release();
    }
  }

  async getVehicleUnavailability(id: string): Promise<VehicleUnavailability | null> {
    const client = await this.pool.connect();
    try {
      const result = await client.query(`
        SELECT vu.*, v.brand, v.model, v.license_plate 
        FROM vehicle_unavailability vu
        LEFT JOIN vehicles v ON vu.vehicle_id = v.id
        WHERE vu.id = $1
      `, [id]);
      
      if (result.rows.length === 0) return null;
      
      const row = result.rows[0] as Record<string, unknown>;
      return {
        id: toString(row.id),
        vehicleId: toString(row.vehicle_id),
        vehicle: row.brand ? {
          id: toString(row.vehicle_id),
          brand: toString(row.brand),
          model: toString(row.model),
          licensePlate: toString(row.license_plate),
          pricing: [],
          commission: { type: 'percentage', value: 0 },
          status: 'available' as const
        } : undefined,
        startDate: row.start_date as Date | string, // ZACHOVAJ PRESNÝ ČAS BEZ TIMEZONE KONVERZIE
        endDate: row.end_date as Date | string, // ZACHOVAJ PRESNÝ ČAS BEZ TIMEZONE KONVERZIE
        reason: toString(row.reason),
        type: toString(row.type) as 'maintenance' | 'service' | 'repair' | 'blocked' | 'cleaning' | 'inspection' | 'rented' | 'private_rental',
        notes: toString(row.notes),
        priority: toNumber(row.priority) as 1 | 2 | 3,
        recurring: Boolean(row.recurring),
        recurringConfig: row.recurring_config ? JSON.parse(toString(row.recurring_config)) : undefined,
        createdAt: new Date(String(row.created_at)),
        updatedAt: new Date(String(row.updated_at)),
        createdBy: toString(row.created_by)
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
    recurringConfig?: Record<string, unknown>;
    createdBy?: string;
  }): Promise<VehicleUnavailability> {
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
        startDate: row.start_date, // ZACHOVAJ PRESNÝ ČAS BEZ TIMEZONE KONVERZIE
        endDate: row.end_date, // ZACHOVAJ PRESNÝ ČAS BEZ TIMEZONE KONVERZIE
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
    recurringConfig: Record<string, unknown>;
  }>): Promise<VehicleUnavailability> {
    const client = await this.pool.connect();
    try {
      // Build dynamic update query
      const setFields: string[] = [];
      const values: unknown[] = [];
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
        startDate: row.start_date, // ZACHOVAJ PRESNÝ ČAS BEZ TIMEZONE KONVERZIE
        endDate: row.end_date, // ZACHOVAJ PRESNÝ ČAS BEZ TIMEZONE KONVERZIE
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

  // 🚀 FÁZA 2.1 + 2.2 + 2.3: HYBRID OPTIMIZED - smart cache + pre-filtered CTE + connection reuse  
  async getCalendarDataUnified(startDate: Date, endDate: Date): Promise<Record<string, unknown>> {
    // 🚀 FÁZA 2.3: SMART CACHE CHECK - skús nájsť v cache
    const cacheKey = this.generateCacheKey('calendar', startDate, endDate);
    const cachedEntry = this.calendarCache.get(cacheKey);
    
    if (cachedEntry && this.isValidCacheEntry(cachedEntry, this.CALENDAR_CACHE_TTL)) {
      logger.migration(`⚡ CALENDAR CACHE HIT - using cached data for ${cacheKey}`);
      return cachedEntry.data;
    }

    logger.migration(`🔄 CALENDAR CACHE MISS - generating fresh data for ${cacheKey}`);
    
    // 🚀 FÁZA 2.2: CONNECTION REUSE - reusovanie connection pre calendar queries
    const client = await this.getReusableConnection();
    try {
      logger.migration('🚀 PHASE 2.3 OPTIMIZED: Smart cached calendar data + connection reuse + pre-filtered CTE');
      
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
            v.brand,
            v.model,
            v.brand || ' ' || v.model as vehicle_name,
            v.license_plate,
            -- RENTALS JOIN (už pre-filtrované)
            ar.id as rental_id,
            ar.customer_name,
            ar.is_flexible,
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
            -- FINAL STATUS (priorita: private_rental > rented > ostatné nedostupnosti > available)
            CASE
              WHEN au.type = 'private_rental' THEN 'unavailable'
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
          WHERE v.status NOT IN ('removed', 'temporarily_removed', 'private')
        )
        SELECT
          date,
          vehicle_id,
          brand,
          model,
          vehicle_name,
          license_plate,
          final_status as status,
          rental_id,
          customer_name,
          is_flexible,
          unavailability_id,
          unavailability_reason,
          unavailability_type,
          unavailability_priority
        FROM optimized_calendar
        ORDER BY date, brand, model, license_plate
      `, [startDate, endDate]);
      
      logger.migration('✅ UNIFIED QUERY: Retrieved', result.rows.length, 'calendar records');
      
      // 🚀 FÁZA 1.2: Pôvodná logika grupovanie podľa dátumu (funguje správne)
      const groupedByDate = result.rows.reduce((acc: Record<string, unknown>, row: Record<string, unknown>) => {
        const dateStr = (row.date as Date).toISOString().split('T')[0];
        
        if (!acc[dateStr]) {
          acc[dateStr] = {
            date: dateStr,
            vehicles: []
          };
        }
        
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (acc[dateStr] as any).vehicles.push({
          vehicleId: row.vehicle_id,
          vehicleName: row.vehicle_name,
          licensePlate: row.license_plate,
          status: row.status,
          rentalId: row.rental_id,
          customerName: row.customer_name,
          isFlexible: row.is_flexible,
          unavailabilityId: row.unavailability_id,
          unavailabilityReason: row.unavailability_reason,
          unavailabilityType: row.unavailability_type,
          unavailabilityPriority: row.unavailability_priority
        });
        
        return acc;
      }, {} as Record<string, unknown>);
      
      // Konvertovanie na array
      const calendarData = Object.values(groupedByDate);
      
      // 🚀 FÁZA 1.2: Pôvodná extrakcia vehicles z SQL result (FUNKČNÁ VERZIA)
      const vehicles = [...new Map(result.rows.map((row: Record<string, unknown>) => [
        row.vehicle_id, 
        {
          id: row.vehicle_id,
          brand: toString(row.vehicle_name).split(' ')[0],
          model: toString(row.vehicle_name).split(' ').slice(1).join(' '),
          licensePlate: row.license_plate,
          status: 'available' // Default status
        }
      ])).values()];
      
      // Extrakcia nedostupností pre backward compatibility
      const unavailabilities = result.rows
        .filter((row: Record<string, unknown>) => row.unavailability_id)
        .map((row: Record<string, unknown>) => ({
          id: row.unavailability_id,
          vehicleId: row.vehicle_id,
          startDate: startDate,
          endDate: endDate,
          reason: row.unavailability_reason,
          type: row.unavailability_type,
          priority: row.unavailability_priority
        }));
      
      logger.migration('🎯 PHASE 2.3 OPTIMIZED RESULT:', {
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
      
      logger.migration(`✅ CALENDAR CACHED - saved ${cacheKey} to cache (TTL: 5min)`);
      return calendarResult;
      
    } catch (error) {
      // Pri chybe force release connection
      console.error('❌ Calendar query error:', error);
      this.releaseReusableConnection(true);
      throw error;
    }
    // 🚀 FÁZA 2.2: Nerelease-uj connection - ponechaj pre reuse
  }

  // Get unavailabilities for specific date range (for calendar)
  async getUnavailabilitiesForDateRange(startDate: Date, endDate: Date): Promise<VehicleUnavailability[]> {
    const client = await this.pool.connect();
    try {
      const result = await client.query(`
        SELECT vu.*, v.brand, v.model, v.license_plate 
        FROM vehicle_unavailability vu
        LEFT JOIN vehicles v ON vu.vehicle_id = v.id
        WHERE vu.start_date <= $2 AND vu.end_date >= $1
        ORDER BY vu.start_date ASC, v.brand ASC, v.model ASC
      `, [startDate, endDate]);
      
      return result.rows.map((row: Record<string, unknown>): VehicleUnavailability => ({
        id: toString(row.id),
        vehicleId: toString(row.vehicle_id),
        vehicle: row.brand ? {
          id: toString(row.vehicle_id),
          brand: toString(row.brand),
          model: toString(row.model),
          licensePlate: toString(row.license_plate),
          pricing: [],
          commission: { type: 'percentage', value: 0 },
          status: 'available' as const
        } : undefined,
        startDate: row.start_date as Date | string, // ZACHOVAJ PRESNÝ ČAS BEZ TIMEZONE KONVERZIE
        endDate: row.end_date as Date | string, // ZACHOVAJ PRESNÝ ČAS BEZ TIMEZONE KONVERZIE
        reason: toString(row.reason),
        type: toString(row.type) as 'maintenance' | 'service' | 'repair' | 'blocked' | 'cleaning' | 'inspection' | 'rented' | 'private_rental',
        notes: toString(row.notes),
        priority: toNumber(row.priority) as 1 | 2 | 3,
        recurring: Boolean(row.recurring),
        recurringConfig: row.recurring_config ? JSON.parse(toString(row.recurring_config)) : undefined,
        createdAt: new Date(String(row.created_at)),
        updatedAt: new Date(String(row.updated_at)),
        createdBy: toString(row.created_by)
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
      const params: unknown[] = [];

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
    const params: unknown[] = [];

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
          'UPDATE vehicles SET company_id = $1 WHERE id = $2',
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
    // ⚡ CACHE CHECK: Skontroluj cache najprv
    const cacheKey = `permissions:${userId}`;
    const cached = this.permissionCache.get(cacheKey);
    
    if (cached) {
      const now = Date.now();
      const isValid = (now - cached.timestamp) < this.PERMISSION_CACHE_TTL;
      
      if (isValid) {
        logger.migration('⚡ getUserCompanyAccess CACHE HIT for userId:', userId, '(saved SQL query)');
        return cached.data;
      } else {
        // Cache expired, remove it
        this.permissionCache.delete(cacheKey);
        logger.migration('🕒 getUserCompanyAccess cache EXPIRED for userId:', userId);
      }
    }

    // ⚡ CACHE MISS: Load from database
    const client = await this.pool.connect();
    try {
      logger.migration('🔍 getUserCompanyAccess CACHE MISS - loading from DB for userId:', userId);
      
      // 1. Získaj používateľa a skontroluj či má linked investor
      const userResult = await client.query(
        'SELECT role, linked_investor_id FROM users WHERE id = $1::uuid',
        [userId]
      );
      
      if (userResult.rows.length === 0) {
        logger.migration('❌ User not found:', userId);
        return [];
      }
      
      const user = userResult.rows[0];
      
      // 2. Admin má prístup k všetkému
      if (user.role === 'admin') {
        const allCompaniesResult = await client.query(
          'SELECT id as company_id, name as company_name FROM companies WHERE is_active = true ORDER BY name'
        );
        
        const adminData = allCompaniesResult.rows.map(row => ({
          companyId: row.company_id.toString(),
          companyName: row.company_name,
          permissions: {
            vehicles: { read: true, write: true, delete: true },
            rentals: { read: true, write: true, delete: true },
            expenses: { read: true, write: true, delete: true },
            settlements: { read: true, write: true, delete: true },
            customers: { read: true, write: true, delete: true },
            insurances: { read: true, write: true, delete: true },
            maintenance: { read: true, write: true, delete: true },
            protocols: { read: true, write: true, delete: true },
            statistics: { read: true, write: true, delete: true }
          }
        }));
        
        // Cache admin permissions
        this.permissionCache.set(cacheKey, {
          data: adminData,
          timestamp: Date.now()
        });
        
        logger.migration('👑 Admin access - all companies:', adminData.length);
        return adminData;
      }
      
      // 2.5. Employee má prístup k všetkým firmám (read-only pre väčšinu, write pre protocols)
      if (user.role === 'employee') {
        const allCompaniesResult = await client.query(
          'SELECT id as company_id, name as company_name FROM companies WHERE is_active = true ORDER BY name'
        );
        
        const employeeData = allCompaniesResult.rows.map(row => ({
          companyId: row.company_id.toString(),
          companyName: row.company_name,
          permissions: {
            vehicles: { read: true, write: false, delete: false },
            rentals: { read: true, write: false, delete: false },
            expenses: { read: true, write: false, delete: false },
            settlements: { read: true, write: false, delete: false },
            customers: { read: true, write: false, delete: false },
            insurances: { read: true, write: false, delete: false },
            maintenance: { read: true, write: false, delete: false },
            protocols: { read: true, write: true, delete: false }, // Zamestnanci môžu vytvárať protokoly
            statistics: { read: true, write: false, delete: false }
          }
        }));
        
        // Cache employee permissions
        this.permissionCache.set(cacheKey, {
          data: employeeData,
          timestamp: Date.now()
        });
        
        logger.migration('👷 Employee access - all companies (read-only + protocols):', employeeData.length);
        return employeeData;
      }
      
      // 3. Ak má linked investor → použiť investor shares
      if (user.linked_investor_id) {
        logger.migration('🔗 User has linked investor:', user.linked_investor_id);
        
        const sharesResult = await client.query(`
          SELECT s.company_id, s.ownership_percentage, s.profit_share_percentage,
                 c.name as company_name
          FROM company_investor_shares s
          JOIN companies c ON s.company_id = c.id
          WHERE s.investor_id = $1 AND c.is_active = true
          ORDER BY c.name
        `, [user.linked_investor_id]);
        
        const shareData = sharesResult.rows.map(row => {
          const hasOwnership = row.ownership_percentage > 0;
          const hasMajority = row.ownership_percentage >= 50;
          
          return {
            companyId: row.company_id.toString(),
            companyName: row.company_name,
            permissions: {
              vehicles: { read: true, write: hasOwnership, delete: hasMajority },
              rentals: { read: true, write: hasOwnership, delete: hasMajority },
              expenses: { read: true, write: hasOwnership, delete: hasMajority },
              settlements: { read: true, write: hasOwnership, delete: hasMajority },
              customers: { read: true, write: hasOwnership, delete: false },
              insurances: { read: true, write: hasOwnership, delete: hasMajority },
              maintenance: { read: true, write: hasOwnership, delete: hasMajority },
              protocols: { read: true, write: hasOwnership, delete: hasMajority },
              statistics: { read: true, write: hasOwnership, delete: false }
            }
          };
        });
        
        // Cache investor-based permissions
        this.permissionCache.set(cacheKey, {
          data: shareData,
          timestamp: Date.now()
        });
        
        logger.migration('📊 Investor-based access:', {
          investorId: user.linked_investor_id,
          companies: shareData.map(s => ({ name: s.companyName, companyId: s.companyId }))
        });
        
        return shareData;
      }
      
      // 4. Fallback: Použiť starý systém user_permissions
      const result = await client.query(`
        SELECT up.company_id, c.name as company_name, up.permissions
        FROM user_permissions up
        JOIN companies c ON up.company_id = c.id
        WHERE up.user_id = $1::uuid
        ORDER BY c.name
        `, [userId]);

      const data = result.rows.map(row => ({
        companyId: row.company_id.toString(),
        companyName: row.company_name,
        permissions: row.permissions
      }));

      // ⚡ CACHE STORE: Ulož do cache
      this.permissionCache.set(cacheKey, {
        data: data,
        timestamp: Date.now()
      });

      logger.migration('⚡ getUserCompanyAccess CACHED for userId:', userId, {
        rowCount: result.rows.length,
        companies: result.rows.map(r => ({ companyId: r.company_id, companyName: r.company_name }))
      });

      return data;
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

      // ⚡ CACHE INVALIDATION: Vymaž cache pre tohoto používateľa
      const cacheKey = `permissions:${userId}`;
      this.permissionCache.delete(cacheKey);
      logger.migration('🧹 Permission cache INVALIDATED for userId:', userId);
      
    } finally {
      client.release();
    }
  }

  /**
   * Získanie všetkých investorov s ich podielmi (pre dropdown v Create User)
   */
  async getInvestorsWithShares(): Promise<Array<{
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    companies: Array<{
      companyId: string;
      companyName: string;
      ownershipPercentage: number;
    }>;
  }>> {
    const client = await this.pool.connect();
    try {
      const result = await client.query(`
        SELECT 
          i.id, i.first_name, i.last_name, i.email,
          s.company_id, s.ownership_percentage,
          c.name as company_name
        FROM company_investors i
        LEFT JOIN company_investor_shares s ON i.id = s.investor_id
        LEFT JOIN companies c ON s.company_id = c.id
        WHERE i.is_active = true
        ORDER BY i.first_name, i.last_name, c.name
      `);

      // Zoskupenie podľa investora
      const investorsMap = new Map();
      
      result.rows.forEach(row => {
        const investorId = row.id;
        
        if (!investorsMap.has(investorId)) {
          investorsMap.set(investorId, {
            id: investorId,
            firstName: row.first_name,
            lastName: row.last_name,
            email: row.email,
            companies: []
          });
        }
        
        // Pridaj company ak existuje podiel
        if (row.company_id && row.company_name) {
          investorsMap.get(investorId).companies.push({
            companyId: row.company_id.toString(),
            companyName: row.company_name,
            ownershipPercentage: parseFloat(row.ownership_percentage)
          });
        }
      });

      const investors = Array.from(investorsMap.values());
      logger.migration('📊 Loaded investors with shares:', investors.length);
      
      return investors;
    } finally {
      client.release();
    }
  }

  async removeUserPermission(userId: string, companyId: string): Promise<void> {
    const client = await this.pool.connect();
    try {
      await client.query(`
        DELETE FROM user_permissions 
        WHERE user_id = $1 AND company_id = $2
      `, [userId, companyId]);

      // ⚡ CACHE INVALIDATION: Vymaž cache pre tohoto používateľa
      this.clearPermissionCache(userId);
      
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
        logger.migration(`🗑️ Dropped table: ${table}`);
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
        const companyId = exactResult.rows[0].id; // UUID as string, not parseInt
        logger.migration(`✅ Company found (exact): "${companyName}" ID: ${companyId}`);
        return companyId;
      }

      // 2. Ak nenájdem presný názov, vytvor novú firmu
      logger.migration(`⚠️ Company "${companyName}" not found, creating new one...`);
      const insertResult = await client.query(
        'INSERT INTO companies (name) VALUES ($1) RETURNING id',
        [companyName]
      );
      
      const newCompanyId = insertResult.rows[0].id; // UUID as string, not parseInt
      logger.migration(`✅ Company created: "${companyName}" ID: ${newCompanyId}`);
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



  // ====================================
  // 🛡️ RENTAL DATA PROTECTION SYSTEM 🛡️
  // ====================================
  
  // Ochrana Level 1: Validácia pred UPDATE
  private async validateRentalUpdate(id: string, newData: Partial<Rental>): Promise<{valid: boolean, errors: string[]}> {
    const errors: string[] = [];
    
    // Skontroluj či prenájom existuje
    const existing = await this.getRental(id);
    if (!existing) {
      errors.push(`Rental ${id} does not exist`);
      return {valid: false, errors};
    }
    
    // Ochrana critical fields
    const criticalFields = ['customerName', 'startDate', 'endDate'];
    for (const field of criticalFields) {
      if (field in newData && !newData[field as keyof Rental]) {
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
    logger.migration(`🛡️ RENTAL UPDATE VALIDATION: ${id}`, {
      existingCustomer: existing.customerName,
      newCustomer: newData.customerName,
      vehicleId: newData.vehicleId,
      validationErrors: errors.length
    });
    
    return {valid: errors.length === 0, errors};
  }
  
  // Ochrana Level 2: Backup before UPDATE
  private async createRentalBackup(id: string): Promise<void> {
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
        
        logger.migration(`✅ RENTAL BACKUP created for ${id}`);
      }
    } catch (error) {
      console.error(`❌ RENTAL BACKUP failed for ${id}:`, error);
    } finally {
      client.release();
    }
  }

  // 🛡️ OCHRANA LEVEL 7: Recovery function pre obnovenie dát
  async recoverRentalFromBackup(rentalId: string, backupId?: string): Promise<Rental | null> {
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
      
      logger.migration(`🔄 RECOVERING RENTAL: ${rentalId} from backup ${backup.id}`);
      logger.migration(`   Backup timestamp: ${backup.backup_timestamp}`);
      logger.migration(`   Customer: ${rentalData.customerName}`);
      
      // Restore rental from backup
      await this.updateRental(rentalData);
      
      logger.migration(`✅ RENTAL RECOVERED: ${rentalId}`);
      return rentalData;
      
    } catch (error) {
      console.error(`❌ RENTAL RECOVERY FAILED for ${rentalId}:`, error);
      throw error;
    } finally {
      client.release();
    }
  }
  
  // 🛡️ OCHRANA LEVEL 8: Monitoring rental integrity  
  async checkRentalIntegrity(): Promise<{
    totalRentals: number;
    missingVehicles: number;
    missingCustomers: number;
    invalidDates: number;
    backupsAvailable: number;
    issues: string[];
  }> {
    const client = await this.pool.connect();
    try {
      const issues: string[] = [];
      
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
      if (missingVehicles > 0) issues.push(`${missingVehicles} rentals have invalid vehicle_id`);
      if (missingCustomers > 0) issues.push(`${missingCustomers} rentals have invalid customer_id`);
      if (invalidDates > 0) issues.push(`${invalidDates} rentals have invalid dates`);
      
      const report = {
        totalRentals,
        missingVehicles,
        missingCustomers,
        invalidDates,
        backupsAvailable,
        issues
      };
      
      logger.migration('🛡️ RENTAL INTEGRITY CHECK:', report);
      return report;
      
    } finally {
      client.release();
    }
  }



  // ⚡ BULK OWNERSHIP CHECKING - pre rýchle filtrovanie rentals/settlements
  async getBulkVehicleOwnersAtTime(vehicleTimeChecks: Array<{vehicleId: string, timestamp: Date}>): Promise<Array<{
    vehicleId: string;
    timestamp: Date;
    owner: {ownerCompanyId: string, ownerCompanyName: string} | null;
  }>> {
    const client = await this.pool.connect();
    try {
      logger.migration(`🚀 BULK: Checking ownership for ${vehicleTimeChecks.length} vehicle-time pairs...`);
      const startTime = Date.now();

      // Build complex query for all checks at once
      const queries = vehicleTimeChecks.map((check, index) => `
        (
          SELECT 
            '${check.vehicleId}' as vehicle_id,
            '${check.timestamp.toISOString()}' as check_timestamp,
            company_id,
            owner_company_name
          FROM vehicle_ownership_history
          WHERE vehicle_id = $${index * 2 + 1}
            AND valid_from <= $${index * 2 + 2}
            AND (valid_to IS NULL OR valid_to > $${index * 2 + 2})
          ORDER BY valid_from DESC
          LIMIT 1
        )`
      ).join(' UNION ALL ');

      // Flatten parameters
      const params = vehicleTimeChecks.flatMap(check => [check.vehicleId, check.timestamp]);

      const result = await client.query(queries, params);

      // Process results back to original format
      const ownershipMap = new Map();
      result.rows.forEach(row => {
        const key = `${row.vehicle_id}-${row.check_timestamp}`;
        ownershipMap.set(key, {
          ownerCompanyId: row.company_id,
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
      logger.migration(`✅ BULK: Checked ${vehicleTimeChecks.length} ownership records in ${loadTime}ms`);

      return results;

    } finally {
      client.release();
    }
  }

  // ⚡ BULK CURRENT OWNERSHIP - pre rýchle získanie súčasných vlastníkov
  async getBulkCurrentVehicleOwners(vehicleIds: string[]): Promise<Array<{
    vehicleId: string;
    owner: {ownerCompanyId: string, ownerCompanyName: string} | null;
  }>> {
    const client = await this.pool.connect();
    try {
      logger.migration(`🚀 BULK: Getting current owners for ${vehicleIds.length} vehicles...`);
      const startTime = Date.now();

      if (vehicleIds.length === 0) return [];

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
          ownerCompanyId: row.company_id,
          ownerCompanyName: row.owner_company_name
        });
      });

      const results = vehicleIds.map(vehicleId => ({
        vehicleId,
        owner: ownershipMap.get(vehicleId) || null
      }));

      const loadTime = Date.now() - startTime;
      logger.migration(`✅ BULK: Got current owners for ${vehicleIds.length} vehicles in ${loadTime}ms`);

      return results;

    } finally {
      client.release();
    }
  }

  // ⚡ CACHE HELPER METHODS
  private clearPermissionCache(userId: string): void {
    const cacheKey = `permissions:${userId}`;
    this.permissionCache.delete(cacheKey);
    logger.migration('🧹 Permission cache CLEARED for userId:', userId);
  }

  private clearAllPermissionCache(): void {
    this.permissionCache.clear();
    logger.migration('🧹 ALL permission cache CLEARED');
  }

  // ⚡ BULK PROTOCOL STATUS - Získa protocol status pre všetky rentals naraz
  async getBulkProtocolStatus(): Promise<Array<{
    rentalId: string;
    hasHandoverProtocol: boolean;
    hasReturnProtocol: boolean;
    handoverProtocolId?: string;
    returnProtocolId?: string;
    handoverCreatedAt?: Date;
    returnCreatedAt?: Date;
  }>> {
    const client = await this.pool.connect();
    try {
      logger.migration('🚀 BULK: Loading protocol status for all rentals...');
      const startTime = Date.now();

      // ✅ PERFORMANCE: Odstránené initProtocolTables() - tabuľky už existujú

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
      logger.migration(`✅ BULK: Protocol status loaded for ${protocolStatus.length} rentals in ${loadTime}ms`);

      return protocolStatus;

    } catch (error) {
      console.error('❌ Error fetching bulk protocol status:', error);
      throw error;
    } finally {
      client.release();
    }
  }

  // 📊 EMPLOYEE STATISTICS: Get all protocols with employee info for statistics
  async getAllProtocolsForStats(): Promise<Array<{
    id: string;
    type: 'handover' | 'return';
    rentalId: string;
    createdBy: string;
    createdAt: Date;
    rentalData?: Record<string, unknown>;
  }>> {
    const client = await this.pool.connect();
    try {
      logger.migration('📊 Loading all protocols for employee statistics...');
      const startTime = Date.now();

      // ✅ PERFORMANCE: Odstránené initProtocolTables() - tabuľky už existujú

      // Get all handover protocols
      const handoverResult = await client.query(`
        SELECT 
          id,
          rental_id,
          created_by,
          created_at,
          rental_data
        FROM handover_protocols
        ORDER BY created_at DESC
      `);

      // Get all return protocols
      const returnResult = await client.query(`
        SELECT 
          id,
          rental_id,
          created_by,
          created_at,
          rental_data
        FROM return_protocols
        ORDER BY created_at DESC
      `);

      // Combine and format results
      const protocols = [
        ...handoverResult.rows.map(row => ({
          id: row.id,
          type: 'handover' as const,
          rentalId: row.rental_id,
          createdBy: row.created_by || 'admin',
          createdAt: new Date(row.created_at),
          rentalData: row.rental_data
        })),
        ...returnResult.rows.map(row => ({
          id: row.id,
          type: 'return' as const,
          rentalId: row.rental_id,
          createdBy: row.created_by || 'admin',
          createdAt: new Date(row.created_at),
          rentalData: row.rental_data
        }))
      ];

      // Sort by creation date (newest first)
      protocols.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());

      const loadTime = Date.now() - startTime;
      logger.migration(`✅ Loaded ${protocols.length} protocols for statistics in ${loadTime}ms`);

      return protocols;

    } catch (error) {
      console.error('❌ Error fetching protocols for statistics:', error);
      throw error;
    } finally {
      client.release();
    }
  }

  // 📄 COMPANY DOCUMENTS METHODS

  async createCompanyDocument(document: CompanyDocument): Promise<CompanyDocument> {
    const client = await this.pool.connect();
    try {
      const query = `
        INSERT INTO company_documents (
          company_id, document_type, document_month, document_year,
          document_name, description, file_path, file_size, 
          file_type, original_filename, created_by
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
        RETURNING *
      `;
      
      const values = [
        parseInt(document.companyId.toString()),
        document.documentType,
        document.documentMonth || null,
        document.documentYear || null,
        document.documentName,
        document.description || null,
        document.filePath,
        document.fileSize || null,
        document.fileType || null,
        document.originalFilename || null,
        document.createdBy || null
      ];

      const result = await client.query(query, values);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      return this.mapCompanyDocument(result.rows[0] as Record<string, unknown>);
    } finally {
      client.release();
    }
  }

  async getCompanyDocuments(
    companyId: string | number, 
    documentType?: 'contract' | 'invoice',
    year?: number,
    month?: number
  ): Promise<CompanyDocument[]> {
    const client = await this.pool.connect();
    try {
      let query = `
        SELECT cd.*, c.name as company_name 
        FROM company_documents cd
        JOIN companies c ON cd.company_id = c.id
        WHERE cd.company_id = $1
      `;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const values: any[] = [typeof companyId === 'string' ? parseInt(companyId) : companyId];
      let paramCount = 1;

      if (documentType) {
        paramCount++;
        query += ` AND cd.document_type = $${paramCount}`;
        values.push(documentType);
      }

      if (year) {
        paramCount++;
        query += ` AND cd.document_year = $${paramCount}`;
        values.push(year);
      }

      if (month) {
        paramCount++;
        query += ` AND cd.document_month = $${paramCount}`;
        values.push(month);
      }

      query += ` ORDER BY cd.created_at DESC`;

      const result = await client.query(query, values);
      return result.rows.map(row => this.mapCompanyDocument(row));
    } finally {
      client.release();
    }
  }

  async getCompanyDocumentById(documentId: string): Promise<CompanyDocument | null> {
    const client = await this.pool.connect();
    try {
      const query = `
        SELECT cd.*, c.name as company_name 
        FROM company_documents cd
        JOIN companies c ON cd.company_id = c.id
        WHERE cd.id = $1
      `;
      
      const result = await client.query(query, [documentId]);
      return result.rows.length > 0 ? this.mapCompanyDocument(result.rows[0]) : null;
    } finally {
      client.release();
    }
  }

  async deleteCompanyDocument(documentId: string): Promise<void> {
    const client = await this.pool.connect();
    try {
      const query = `DELETE FROM company_documents WHERE id = $1`;
      await client.query(query, [documentId]);
    } finally {
      client.release();
    }
  }

  async getCompanyDocumentsByType(companyId: string | number, documentType: 'contract' | 'invoice'): Promise<CompanyDocument[]> {
    return this.getCompanyDocuments(companyId, documentType);
  }

  async getCompanyInvoicesByMonth(companyId: string | number, year: number, month: number): Promise<CompanyDocument[]> {
    return this.getCompanyDocuments(companyId, 'invoice', year, month);
  }

  private mapCompanyDocument(row: Record<string, unknown>): CompanyDocument {
    return {
      id: toString(row.id),
      companyId: toNumber(row.company_id),
      documentType: toString(row.document_type) as 'contract' | 'invoice',
      documentMonth: row.document_month ? toNumber(row.document_month) : undefined,
      documentYear: row.document_year ? toNumber(row.document_year) : undefined,
      documentName: toString(row.document_name),
      description: toString(row.description) || undefined,
      filePath: toString(row.file_path),
      fileSize: row.file_size ? toNumber(row.file_size) : undefined,
      fileType: toString(row.file_type) || undefined,
      originalFilename: toString(row.original_filename) || undefined,
      createdAt: new Date(String(row.created_at)),
      updatedAt: new Date(String(row.updated_at)),
      createdBy: toString(row.created_by) || undefined
    };
  }

}

export const postgresDatabase = new PostgresDatabase(); 