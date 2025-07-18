import { Pool, PoolClient } from 'pg';
import { Vehicle, Customer, Rental, Expense, Insurance, User, Company, Insurer } from '../types';
import bcrypt from 'bcryptjs';

export class PostgresDatabase {
  private pool: Pool;

  constructor() {
    // Railway.app provides DATABASE_URL
    if (process.env.DATABASE_URL) {
      this.pool = new Pool({
        connectionString: process.env.DATABASE_URL,
        ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
        max: 20,
        idleTimeoutMillis: 30000,
        connectionTimeoutMillis: 10000,
      });
    } else {
      // Local development or manual config
    this.pool = new Pool({
      user: process.env.DB_USER || 'postgres',
      host: process.env.DB_HOST || 'localhost',
      database: process.env.DB_NAME || 'blackrent',
      password: process.env.DB_PASSWORD || 'password',
      port: parseInt(process.env.DB_PORT || '5432'),
      max: 20,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 10000,
    });
    }

    this.initTables().catch(console.error); // Spustenie pre aktualizáciu schémy
  }

  private async initTables() {
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
          -- Rozšírené polia pre kompletný rental systém
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
      
      // Vytvorenie testovacích dát ak databáza je prázdna
      await this.createSampleDataIfEmpty(client);
      
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
      
      // Migrácia 2: Pridanie rozšírených polí do rentals tabuľky
      await client.query(`
        ALTER TABLE rentals 
        ADD COLUMN IF NOT EXISTS deposit DECIMAL(10,2),
        ADD COLUMN IF NOT EXISTS allowed_kilometers INTEGER,
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
      
      console.log('✅ Databázové migrácie úspešne dokončené');
    } catch (error: any) {
      // Ignoruj chyby migrácie ak už boli aplikované
      if (error.message?.includes('cannot be cast automatically')) {
        console.log('⚠️ Migrácie už boli aplikované alebo nie sú potrebné');
      } else {
        console.log('⚠️ Migrácie preskočené:', error.message);
      }
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
      
      if (rentalCount.rows[0].count === '0') {
        console.log('📋 Vytváranie testovacích dát...');
        
        // Vytvorenie firiem
        await client.query(`
          INSERT INTO companies (id, name) VALUES 
          ('11111111-1111-1111-1111-111111111111', 'ABC Rent'),
          ('22222222-2222-2222-2222-222222222222', 'Premium Cars'),
          ('33333333-3333-3333-3333-333333333333', 'City Rent')
          ON CONFLICT (name) DO NOTHING
        `);
        
        // Vytvorenie poisťovní
        await client.query(`
          INSERT INTO insurers (id, name) VALUES 
          ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'Allianz'),
          ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'Generali')
          ON CONFLICT (name) DO NOTHING
        `);
        
        // Vytvorenie vozidiel
        await client.query(`
          INSERT INTO vehicles (id, brand, model, license_plate, company, pricing, commission, status) VALUES 
          ('vehicle1-1111-1111-1111-111111111111', 'BMW', 'X5', 'BA123AB', 'ABC Rent', $1, $2, 'available'),
          ('vehicle2-2222-2222-2222-222222222222', 'Mercedes', 'E-Class', 'BA456CD', 'Premium Cars', $3, $4, 'available'),
          ('vehicle3-3333-3333-3333-333333333333', 'Audi', 'A4', 'BA789EF', 'City Rent', $5, $6, 'available')
          ON CONFLICT (license_plate) DO NOTHING
        `, [
          JSON.stringify([
            { id: '1', minDays: 0, maxDays: 1, pricePerDay: 80 },
            { id: '2', minDays: 2, maxDays: 3, pricePerDay: 75 },
            { id: '3', minDays: 4, maxDays: 7, pricePerDay: 70 }
          ]),
          JSON.stringify({ type: 'percentage', value: 15 }),
          JSON.stringify([
            { id: '1', minDays: 0, maxDays: 1, pricePerDay: 90 },
            { id: '2', minDays: 2, maxDays: 3, pricePerDay: 85 },
            { id: '3', minDays: 4, maxDays: 7, pricePerDay: 80 }
          ]),
          JSON.stringify({ type: 'percentage', value: 18 }),
          JSON.stringify([
            { id: '1', minDays: 0, maxDays: 1, pricePerDay: 65 },
            { id: '2', minDays: 2, maxDays: 3, pricePerDay: 60 },
            { id: '3', minDays: 4, maxDays: 7, pricePerDay: 55 }
          ]),
          JSON.stringify({ type: 'percentage', value: 12 })
        ]);
        
        // Vytvorenie zákazníkov
        await client.query(`
          INSERT INTO customers (id, name, email, phone) VALUES 
          ('customer1-1111-1111-1111-111111111111', 'Ján Novák', 'jan.novak@email.com', '+421901234567'),
          ('customer2-2222-2222-2222-222222222222', 'Mária Svobodová', 'maria.svobodova@email.com', '+421907654321'),
          ('customer3-3333-3333-3333-333333333333', 'Peter Horváth', 'peter.horvath@email.com', '+421905111222')
        `);
        
        // Vytvorenie prenájmov
        await client.query(`
          INSERT INTO rentals (id, vehicle_id, customer_id, customer_name, start_date, end_date, total_price, commission, payment_method, paid, confirmed, handover_place) VALUES 
          ('rental1-1111-1111-1111-111111111111', 'vehicle1-1111-1111-1111-111111111111', 'customer1-1111-1111-1111-111111111111', 'Ján Novák', '2025-01-20', '2025-01-23', 240.00, 36.00, 'bank_transfer', true, true, 'Bratislava - Hlavná stanica'),
          ('rental2-2222-2222-2222-222222222222', 'vehicle2-2222-2222-2222-222222222222', 'customer2-2222-2222-2222-222222222222', 'Mária Svobodová', '2025-01-25', '2025-01-30', 400.00, 72.00, 'cash', false, true, 'Bratislava - Letisko'),
          ('rental3-3333-3333-3333-333333333333', 'vehicle3-3333-3333-3333-333333333333', 'customer3-3333-3333-3333-333333333333', 'Peter Horváth', '2025-01-28', '2025-02-02', 275.00, 33.00, 'vrp', true, false, 'Košice - Centrum')
        `);
        
        console.log('🎉 Testové dáta úspešne vytvorené!');
        console.log('📊 Vytvorené:');
        console.log('   - 3 vozidlá (BMW X5, Mercedes E-Class, Audi A4)');
        console.log('   - 3 zákazníkov (Ján Novák, Mária Svobodová, Peter Horváth)');
        console.log('   - 3 prenájmy s rôznymi stavmi');
        console.log('   - 3 firmy (ABC Rent, Premium Cars, City Rent)');
        console.log('   - 2 poisťovne (Allianz, Generali)');
      }
    } catch (error) {
      console.error('⚠️ Chyba pri vytváraní testovacích dát:', error);
    }
  }

  // Metódy pre používateľov
  async getUserByUsername(username: string): Promise<User | null> {
    const client = await this.pool.connect();
    try {
      const result = await client.query(
        'SELECT id, username, email, password_hash, role, created_at FROM users WHERE username = $1',
        [username]
      );
      
      if (result.rows.length === 0) return null;
      
      const row = result.rows[0];
      return {
        id: row.id?.toString(),
        username: row.username,
        email: row.email,
        password: row.password_hash, // Pre kompatibilitu s existujúcim kódom
        role: row.role,
        createdAt: row.created_at
      };
    } finally {
      client.release();
    }
  }

  async getUserById(id: string): Promise<User | null> {
    const client = await this.pool.connect();
    try {
      const result = await client.query(
        'SELECT id, username, email, password_hash, role, created_at FROM users WHERE id = $1',
        [parseInt(id)]
      );
      
      if (result.rows.length === 0) return null;
      
      const row = result.rows[0];
      return {
        id: row.id?.toString(),
        username: row.username,
        email: row.email,
        password: row.password_hash,
        role: row.role,
        createdAt: row.created_at
      };
    } finally {
      client.release();
    }
  }

  async createUser(userData: { username: string; email: string; password: string; role: string }): Promise<User> {
    const client = await this.pool.connect();
    try {
      const hashedPassword = await bcrypt.hash(userData.password, 12);
      const result = await client.query(
        'INSERT INTO users (username, email, password_hash, role) VALUES ($1, $2, $3, $4) RETURNING id, username, email, password_hash, role, created_at',
        [userData.username, userData.email, hashedPassword, userData.role]
      );
      
      const row = result.rows[0];
      return {
        id: row.id.toString(),
        username: row.username,
        email: row.email,
        password: row.password_hash,
        role: row.role,
        createdAt: new Date(row.created_at)
      };
    } finally {
      client.release();
    }
  }

  async updateUser(user: User): Promise<void> {
    const client = await this.pool.connect();
    try {
      const hashedPassword = await bcrypt.hash(user.password, 12);
      await client.query(
        'UPDATE users SET username = $1, email = $2, password_hash = $3, role = $4, updated_at = CURRENT_TIMESTAMP WHERE id = $5',
        [user.username, user.email, hashedPassword, user.role, parseInt(user.id)]
      );
    } finally {
      client.release();
    }
  }

  async deleteUser(id: string): Promise<void> {
    const client = await this.pool.connect();
    try {
      await client.query('DELETE FROM users WHERE id = $1', [parseInt(id)]);
    } finally {
      client.release();
    }
  }

  async getUsers(): Promise<User[]> {
    const client = await this.pool.connect();
    try {
      const result = await client.query(
        'SELECT id, username, email, password_hash, role, created_at FROM users ORDER BY created_at DESC'
      );
      
      return result.rows.map(row => ({
        id: row.id?.toString(),
        username: row.username,
        email: row.email,
        password: row.password_hash,
        role: row.role,
        createdAt: row.created_at
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
      
      return result.rows.map(row => ({
        ...row,
        id: row.id,
        licensePlate: row.license_plate, // Mapovanie column názvu
        pricing: typeof row.pricing === 'string' ? JSON.parse(row.pricing) : row.pricing, // Parsovanie JSON
        commission: typeof row.commission === 'string' ? JSON.parse(row.commission) : row.commission, // Parsovanie JSON
        createdAt: new Date(row.created_at)
      }));
    } finally {
      client.release();
    }
  }

  async getVehicle(id: string): Promise<Vehicle | null> {
    const client = await this.pool.connect();
    try {
      const result = await client.query('SELECT * FROM vehicles WHERE id = $1', [parseInt(id)]);
      
      if (result.rows.length === 0) return null;
      
      const row = result.rows[0];
      return {
        ...row,
        id: row.id.toString(),
        licensePlate: row.license_plate, // Mapovanie column názvu
        pricing: typeof row.pricing === 'string' ? JSON.parse(row.pricing) : row.pricing, // Parsovanie JSON
        commission: typeof row.commission === 'string' ? JSON.parse(row.commission) : row.commission, // Parsovanie JSON
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
  }): Promise<Vehicle> {
    const client = await this.pool.connect();
    try {
      // Automaticky vytvoriť company záznam ak neexistuje
      if (vehicleData.company && vehicleData.company.trim()) {
        await client.query(
          'INSERT INTO companies (name) VALUES ($1) ON CONFLICT (name) DO NOTHING',
          [vehicleData.company.trim()]
        );
      }

      const result = await client.query(
        'INSERT INTO vehicles (brand, model, license_plate, company, pricing, commission, status) VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING id, brand, model, license_plate, company, pricing, commission, status, created_at',
        [
          vehicleData.brand, 
          vehicleData.model, 
          vehicleData.licensePlate, 
          vehicleData.company, 
          JSON.stringify(vehicleData.pricing),
          JSON.stringify(vehicleData.commission),
          vehicleData.status
        ]
      );

      const row = result.rows[0];
      return {
        id: row.id.toString(),
        brand: row.brand,
        model: row.model,
        licensePlate: row.license_plate,
        company: row.company,
        pricing: typeof row.pricing === 'string' ? JSON.parse(row.pricing) : row.pricing,
        commission: typeof row.commission === 'string' ? JSON.parse(row.commission) : row.commission,
        status: row.status,
        createdAt: new Date(row.created_at)
      };
    } finally {
      client.release();
    }
  }

  async updateVehicle(vehicle: Vehicle): Promise<void> {
    const client = await this.pool.connect();
    try {
      // Automaticky vytvoriť company záznam ak neexistuje
      if (vehicle.company && vehicle.company.trim()) {
        await client.query(
          'INSERT INTO companies (name) VALUES ($1) ON CONFLICT (name) DO NOTHING',
          [vehicle.company.trim()]
        );
      }

      await client.query(
        'UPDATE vehicles SET brand = $1, model = $2, license_plate = $3, company = $4, pricing = $5, commission = $6, status = $7, updated_at = CURRENT_TIMESTAMP WHERE id = $8',
        [
          vehicle.brand, 
          vehicle.model, 
          vehicle.licensePlate, 
          vehicle.company, 
          JSON.stringify(vehicle.pricing), // Konverzia na JSON string
          JSON.stringify(vehicle.commission), // Konverzia na JSON string
          vehicle.status, 
          parseInt(vehicle.id)
        ]
      );
    } finally {
      client.release();
    }
  }

  async deleteVehicle(id: string): Promise<void> {
    const client = await this.pool.connect();
    try {
      await client.query('DELETE FROM vehicles WHERE id = $1', [parseInt(id)]);
    } finally {
      client.release();
    }
  }

  // Metódy pre prenájmy
  async getRentals(): Promise<Rental[]> {
    const client = await this.pool.connect();
    try {
      console.log('🔍 Spúšťam getRentals() query...');
      
      const result = await client.query(`
        SELECT r.id, r.customer_id, r.vehicle_id, r.start_date, r.end_date, 
               r.total_price, r.commission, r.payment_method, r.discount, 
               r.custom_commission, r.extra_km_charge, r.paid, r.status, r.handover_place, 
               r.confirmed, r.payments, r.history, r.order_number, r.customer_name, r.created_at,
               r.deposit, r.allowed_kilometers, r.extra_kilometer_rate, r.return_conditions,
               r.fuel_level, r.odometer, r.return_fuel_level, r.return_odometer,
               r.actual_kilometers, r.fuel_refill_cost, r.handover_protocol_id, r.return_protocol_id,
               v.brand, v.model, v.license_plate, v.company 
        FROM rentals r 
        LEFT JOIN vehicles v ON r.vehicle_id = v.id 
        ORDER BY r.created_at DESC
      `);
      
      console.log('📊 getRentals() - Nájdené záznamy:', result.rows.length);
      
      if (result.rows.length === 0) {
        console.log('⚠️ getRentals() - Žiadne prenájmy v databáze');
        return [];
      }
      
      // Bezpečné parsovanie JSON polí
      const safeJsonParse = (value: any, fallback = undefined) => {
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
      };
      
      return result.rows.map((row, index) => {
        try {
          console.log(`🔄 Spracovávam rental ${index + 1}/${result.rows.length}:`, row.id);
          
          const rental = {
            id: row.id?.toString(),
            vehicleId: row.vehicle_id?.toString(),
            customerId: row.customer_id?.toString(),
            customerName: row.customer_name || 'Neznámy zákazník',
            startDate: new Date(row.start_date),
            endDate: new Date(row.end_date),
            totalPrice: parseFloat(row.total_price) || 0,
            commission: parseFloat(row.commission) || 0,
            paymentMethod: row.payment_method || 'cash',
            discount: safeJsonParse(row.discount),
            customCommission: safeJsonParse(row.custom_commission),
            extraKmCharge: row.extra_km_charge ? parseFloat(row.extra_km_charge) : undefined,
            paid: Boolean(row.paid),
            status: row.status || 'active',
            handoverPlace: row.handover_place,
            confirmed: Boolean(row.confirmed),
            payments: safeJsonParse(row.payments),
            history: safeJsonParse(row.history),
            orderNumber: row.order_number,
            createdAt: row.created_at ? new Date(row.created_at) : new Date(),
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
            // Vehicle objekt z JOIN
            vehicle: row.vehicle_id ? {
              id: row.vehicle_id?.toString(),
              brand: row.brand || 'Neznáma značka',
              model: row.model || 'Neznámy model',
              licensePlate: row.license_plate || 'N/A',
              company: row.company || 'N/A',
              pricing: [], // Nedostupné z tohto JOIN
              commission: { type: 'percentage' as const, value: 20 }, // Default
              status: 'available' as const // Default
            } : undefined
          };
          
          return rental;
        } catch (error) {
          console.error('❌ Chyba pri spracovaní rental:', error, 'row:', row);
          throw error;
        }
      });
    } catch (error) {
      console.error('❌ getRentals() chyba:', error);
      throw error;
    } finally {
      client.release();
    }
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
          deposit, allowed_kilometers, extra_kilometer_rate, return_conditions, 
          fuel_level, odometer, return_fuel_level, return_odometer, actual_kilometers, fuel_refill_cost,
          handover_protocol_id, return_protocol_id
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22, $23, $24, $25, $26, $27, $28, $29, $30)
        RETURNING id, vehicle_id, customer_id, customer_name, start_date, end_date, total_price, commission, payment_method, 
          discount, custom_commission, extra_km_charge, paid, status, handover_place, confirmed, payments, history, order_number,
          deposit, allowed_kilometers, extra_kilometer_rate, return_conditions, 
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
        discount: row.discount ? JSON.parse(row.discount) : undefined,
        customCommission: row.custom_commission ? JSON.parse(row.custom_commission) : undefined,
        extraKmCharge: row.extra_km_charge ? parseFloat(row.extra_km_charge) : undefined,
        paid: Boolean(row.paid),
        status: row.status || 'pending',
        handoverPlace: row.handover_place,
        confirmed: Boolean(row.confirmed),
        payments: row.payments ? JSON.parse(row.payments) : undefined,
        history: row.history ? JSON.parse(row.history) : undefined,
        orderNumber: row.order_number,
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
      const result = await client.query(`
        SELECT r.*, v.brand, v.model, v.license_plate, v.company 
        FROM rentals r 
        LEFT JOIN vehicles v ON r.vehicle_id = v.id 
        WHERE r.id = $1
      `, [id]);
      
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
          deposit = $19, allowed_kilometers = $20, extra_kilometer_rate = $21, return_conditions = $22,
          fuel_level = $23, odometer = $24, return_fuel_level = $25, return_odometer = $26,
          actual_kilometers = $27, fuel_refill_cost = $28, handover_protocol_id = $29, 
          return_protocol_id = $30, updated_at = CURRENT_TIMESTAMP
        WHERE id = $31
      `, [
        rental.vehicleId ? parseInt(rental.vehicleId) : null, 
        rental.customerId ? parseInt(rental.customerId) : null, 
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
        parseInt(rental.id)
      ]);
    } finally {
      client.release();
    }
  }

  async deleteRental(id: string): Promise<void> {
    const client = await this.pool.connect();
    try {
      await client.query('DELETE FROM rentals WHERE id = $1', [parseInt(id)]);
    } finally {
      client.release();
    }
  }

  // Metódy pre zákazníkov
  async getCustomers(): Promise<Customer[]> {
    const client = await this.pool.connect();
    try {
      const result = await client.query('SELECT * FROM customers ORDER BY created_at DESC');
      return result.rows.map(row => ({
        ...row,
        id: row.id.toString(),
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
      const result = await client.query(
        'INSERT INTO customers (name, email, phone) VALUES ($1, $2, $3) RETURNING id, name, email, phone, created_at',
        [customerData.name, customerData.email, customerData.phone]
      );

      const row = result.rows[0];
      return {
        id: row.id.toString(),
        name: row.name,
        email: row.email,
        phone: row.phone,
        createdAt: new Date(row.created_at)
      };
    } finally {
      client.release();
    }
  }

  async updateCustomer(customer: Customer): Promise<void> {
    const client = await this.pool.connect();
    try {
      await client.query(
        'UPDATE customers SET name = $1, email = $2, phone = $3, updated_at = CURRENT_TIMESTAMP WHERE id = $4',
        [customer.name, customer.email, customer.phone, customer.id]
      );
    } finally {
      client.release();
    }
  }

  async deleteCustomer(id: string): Promise<void> {
    const client = await this.pool.connect();
    try {
      await client.query('DELETE FROM customers WHERE id = $1', [id]);
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
      // Automaticky vytvoriť company záznam ak neexistuje
      if (expenseData.company && expenseData.company.trim()) {
        await client.query(
          'INSERT INTO companies (name) VALUES ($1) ON CONFLICT (name) DO NOTHING',
          [expenseData.company.trim()]
        );
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
        vehicleId: row.vehicle_id || undefined,
        company: row.company,
        category: row.category,
        note: row.note || undefined
      };
    } finally {
      client.release();
    }
  }

  async updateExpense(expense: Expense): Promise<void> {
    const client = await this.pool.connect();
    try {
      // Automaticky vytvoriť company záznam ak neexistuje
      if (expense.company && expense.company.trim()) {
        await client.query(
          'INSERT INTO companies (name) VALUES ($1) ON CONFLICT (name) DO NOTHING',
          [expense.company.trim()]
        );
      }

      await client.query(
        'UPDATE expenses SET description = $1, amount = $2, date = $3, vehicle_id = $4, company = $5, category = $6, note = $7, updated_at = CURRENT_TIMESTAMP WHERE id = $8',
        [
          expense.description,
          expense.amount,
          expense.date,
          expense.vehicleId ? parseInt(expense.vehicleId) : null,
          expense.company,
          expense.category,
          expense.note,
          parseInt(expense.id)
        ]
      );
    } finally {
      client.release();
    }
  }

  async deleteExpense(id: string): Promise<void> {
    const client = await this.pool.connect();
    try {
      await client.query('DELETE FROM expenses WHERE id = $1', [parseInt(id)]);
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
        id: row.id,
        vehicleId: row.vehicle_id,
        type: row.type,
        validFrom: new Date(row.valid_from),
        validTo: new Date(row.valid_to),
        price: parseFloat(row.price) || 0,
        company: row.company,
        createdAt: new Date(row.created_at)
      }));
    } finally {
      client.release();
    }
  }

  async createInsurance(insuranceData: {
    vehicleId: string;
    type: string;
    validFrom: Date;
    validTo: Date;
    price: number;
    company: string;
  }): Promise<Insurance> {
    const client = await this.pool.connect();
    try {
      const result = await client.query(
        'INSERT INTO insurances (vehicle_id, type, valid_from, valid_to, price, company) VALUES ($1, $2, $3, $4, $5, $6) RETURNING id, vehicle_id, type, valid_from, valid_to, price, company, created_at',
        [insuranceData.vehicleId, insuranceData.type, insuranceData.validFrom, insuranceData.validTo, insuranceData.price, insuranceData.company]
      );

      const row = result.rows[0];
      return {
        id: row.id.toString(),
        vehicleId: row.vehicle_id,
        type: row.type,
        validFrom: new Date(row.valid_from),
        validTo: new Date(row.valid_to),
        price: parseFloat(row.price) || 0,
        company: row.company
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
        id: row.id,
        createdAt: new Date(row.created_at)
      }));
    } finally {
      client.release();
    }
  }

  async createCompany(companyData: { name: string }): Promise<Company> {
    const client = await this.pool.connect();
    try {
      const result = await client.query(
        'INSERT INTO companies (name) VALUES ($1) RETURNING id, name, created_at', 
        [companyData.name]
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

  async deleteCompany(id: string): Promise<void> {
    const client = await this.pool.connect();
    try {
      await client.query('DELETE FROM companies WHERE id = $1', [parseInt(id)]);
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
        id: row.id,
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

  // Zatvorenie spojenia
  async close() {
    await this.pool.end();
  }
}

export const postgresDatabase = new PostgresDatabase(); 