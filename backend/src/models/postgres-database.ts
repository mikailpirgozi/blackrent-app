import { Pool, PoolClient } from 'pg';
import { Vehicle, Customer, Rental, Expense, Insurance, User, Company, Insurer, Settlement } from '../types';
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
      
      // Migrácia 5: Pridanie rozšírených polí do rentals tabuľky
      try {
        console.log('📋 Migrácia 5: Pridávanie rozšírených polí do rentals...');
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
      
      console.log('✅ Databázové migrácie úspešne dokončené');
    } catch (error: any) {
      console.log('⚠️ Migrácie celkovo preskočené:', error.message);
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
      
      if (rentalCount.rows[0].count === '0' && vehicleCount.rows[0].count === '0') {
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
    const client = await this.pool.connect();
    try {
      // Skúsme najskôr users tabuľku (hlavná)
      const result = await client.query(
        'SELECT id, username, email, password_hash as password, role, created_at FROM users WHERE username = $1',
        [username]
      );
      
      if (result.rows.length > 0) {
        const row = result.rows[0];
        return {
          id: row.id?.toString(),
          username: row.username,
          email: row.email,
          password: row.password, // users má password
          role: row.role,
          createdAt: new Date(row.created_at)
        };
      }
      
      // Ak nie je v users, skúsme users_new tabuľku (ak existuje)
      try {
        const resultNew = await client.query(
          'SELECT id, username, email, password, role, created_at FROM users_new WHERE username = $1',
          [username]
        );
        
        if (resultNew.rows.length > 0) {
          const row = resultNew.rows[0];
          return {
            id: row.id?.toString(),
            username: row.username,
            email: row.email,
            password: row.password, // users_new má priamo password
            role: row.role,
            createdAt: new Date(row.created_at)
          };
        }
      } catch (error) {
        // users_new tabuľka neexistuje, ignorujeme
        console.log('ℹ️ users_new table does not exist, using only users table');
      }
      
      return null;
    } finally {
      client.release();
    }
  }

  async getUserById(id: string): Promise<User | null> {
    const client = await this.pool.connect();
    try {
      // Skúsme najskôr users tabuľku (hlavná)
      const result = await client.query(
        'SELECT id, username, email, password_hash as password, role, created_at FROM users WHERE id = $1',
        [id]
      );
      
      if (result.rows.length > 0) {
        const row = result.rows[0];
        return {
          id: row.id?.toString(),
          username: row.username,
          email: row.email,
          password: row.password,
          role: row.role,
          createdAt: new Date(row.created_at)
        };
      }
      
      // Ak nie je v users, skúsme users_new tabuľku (ak existuje)
      try {
        const resultNew = await client.query(
          'SELECT id, username, email, password, role, created_at FROM users_new WHERE id = $1',
          [id]
        );
        
        if (resultNew.rows.length > 0) {
          const row = resultNew.rows[0];
          return {
            id: row.id?.toString(),
            username: row.username,
            email: row.email,
            password: row.password,
            role: row.role,
            createdAt: new Date(row.created_at)
          };
        }
      } catch (error) {
        // users_new tabuľka neexistuje, ignorujeme
        console.log('ℹ️ users_new table does not exist, using only users table');
      }
      
      return null;
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
        [user.username, user.email, hashedPassword, user.role, user.id] // Removed parseInt for UUID
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
        'SELECT id, username, email, password_hash as password, role, created_at FROM users ORDER BY created_at DESC'
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
        id: row.id?.toString() || '',
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
      const result = await client.query('SELECT * FROM vehicles WHERE id = $1', [id]); // Removed parseInt for UUID
      
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
      // Automaticky vytvoriť company záznam ak neexistuje - bez ON CONFLICT
      if (vehicleData.company && vehicleData.company.trim()) {
        try {
          const existingCompany = await client.query('SELECT name FROM companies WHERE name = $1', [vehicleData.company.trim()]);
          if (existingCompany.rows.length === 0) {
            await client.query('INSERT INTO companies (name) VALUES ($1)', [vehicleData.company.trim()]);
            console.log('✅ Company vytvorená:', vehicleData.company.trim());
          }
        } catch (companyError: any) {
          console.log('⚠️ Company už existuje:', companyError.message);
        }
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
        'UPDATE vehicles SET brand = $1, model = $2, license_plate = $3, company = $4, pricing = $5, commission = $6, status = $7, updated_at = CURRENT_TIMESTAMP WHERE id = $8',
        [
          vehicle.brand, 
          vehicle.model, 
          vehicle.licensePlate, 
          vehicle.company, 
          JSON.stringify(vehicle.pricing), // Konverzia na JSON string
          JSON.stringify(vehicle.commission), // Konverzia na JSON string
          vehicle.status, 
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
               v.brand, v.model, v.license_plate, v.company as company_name
        FROM rentals r 
        LEFT JOIN vehicles v ON (r.vehicle_id IS NOT NULL AND r.vehicle_id ~ '^[0-9a-f-]{36}$' AND r.vehicle_id::uuid = v.id)
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
          
          const rental: Rental = {
            id: row.id?.toString() || '',
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
              id: row.vehicle_id?.toString() || '',
              brand: row.brand || 'Neznáma značka',
              model: row.model || 'Neznámy model',
              licensePlate: row.license_plate || 'N/A',
              company: row.company_name || 'N/A',
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
        LEFT JOIN vehicles v ON (r.vehicle_id IS NOT NULL AND r.vehicle_id ~ '^[0-9a-f-]{36}$' AND r.vehicle_id::uuid = v.id) 
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
        company: row.company
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
  }): Promise<Insurance> {
    const client = await this.pool.connect();
    try {
      const result = await client.query(
        'INSERT INTO insurances (vehicle_id, type, policy_number, valid_from, valid_to, price, company) VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING id, vehicle_id, type, policy_number, valid_from, valid_to, price, company, created_at',
        [insuranceData.vehicleId, insuranceData.type, insuranceData.policyNumber, insuranceData.validFrom, insuranceData.validTo, insuranceData.price, insuranceData.company]
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

      // Map to Settlement interface format
      return result.rows.map((row: any) => ({
        id: row.id?.toString() || '',
        period: {
          from: new Date(row.from_date || new Date()),
          to: new Date(row.to_date || new Date())
        },
        rentals: [], // Empty array - will be loaded separately if needed
        expenses: [], // Empty array - will be loaded separately if needed
        totalIncome: parseFloat(row.total_income) || 0,
        totalExpenses: parseFloat(row.total_expenses) || 0,
        totalCommission: parseFloat(row.commission) || 0,
        profit: parseFloat(row.profit) || 0,
        company: row.company || 'Default Company',
        vehicleId: undefined
      }));
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
        rentals: [], // Empty array - will be populated separately if needed
        expenses: [], // Empty array - will be populated separately if needed
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
  private extractUrls(mediaArray: any[]): string[] {
    if (!Array.isArray(mediaArray)) {
      console.log('⚠️ extractUrls: mediaArray is not an array:', mediaArray);
      return [];
    }
    
    console.log('🔍 extractUrls: Processing mediaArray:', mediaArray);
    
    return mediaArray
      .filter(item => item !== null && item !== undefined)
      .map(item => {
        // Ak je item string, použij ho ako URL
        if (typeof item === 'string') {
          console.log('🔍 extractUrls: Found string item:', item);
          return item;
        }
        // Ak je item objekt s url vlastnosťou, použij url
        if (item && typeof item === 'object' && item.url) {
          console.log('🔍 extractUrls: Found object with url:', item.url);
          return item.url;
        }
        // Inak ignoruj
        console.log('⚠️ extractUrls: Ignoring invalid item:', item);
        return null;
      })
      .filter(url => typeof url === 'string' && url.length > 0);
  }

  private mapUrlsToMediaObjects(urls: string[]): any[] {
    return urls
      .filter(url => typeof url === 'string' && url.length > 0)
      .map((url, index) => ({
        id: `${Date.now()}_${index}`,
        url: url,
        type: this.getMediaTypeFromUrl(url),
        timestamp: new Date(),
        compressed: false
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
    contentType: string
  ): Promise<string> {
    try {
      const fileKey = r2Storage.generateFileKey('protocol', protocolId, filename);
      const url = await r2Storage.uploadFile(fileKey, file, contentType, {
        protocol_id: protocolId,
        uploaded_at: new Date().toISOString()
      });
      
      console.log('✅ Protocol file uploaded to R2:', url);
      return url;
    } catch (error) {
      console.error('❌ Error uploading protocol file to R2:', error);
      throw error;
    }
  }

  async uploadProtocolPDF(protocolId: string, pdfBuffer: Buffer): Promise<string> {
    try {
      const filename = `protocol_${protocolId}_${Date.now()}.pdf`;
      const fileKey = r2Storage.generateFileKey('protocol', protocolId, filename);
      
      const url = await r2Storage.uploadFile(fileKey, pdfBuffer, 'application/pdf', {
        protocol_id: protocolId,
        file_type: 'pdf',
        uploaded_at: new Date().toISOString()
      });
      
      console.log('✅ Protocol PDF uploaded to R2:', url);
      return url;
    } catch (error) {
      console.error('❌ Error uploading protocol PDF to R2:', error);
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
          
          -- Media storage URLs (R2 Cloudflare)
          vehicle_images_urls TEXT[], -- Array of R2 URLs
          vehicle_videos_urls TEXT[], -- Array of R2 URLs  
          document_images_urls TEXT[], -- Array of R2 URLs
          damage_images_urls TEXT[], -- Array of R2 URLs
          
          -- Damages and signatures
          damages JSONB DEFAULT '[]',
          signatures JSONB DEFAULT '[]',
          
          -- Additional data
          rental_data JSONB,
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
          
          -- Media storage URLs (R2 Cloudflare)
          vehicle_images_urls TEXT[], -- Array of R2 URLs
          vehicle_videos_urls TEXT[], -- Array of R2 URLs  
          document_images_urls TEXT[], -- Array of R2 URLs
          damage_images_urls TEXT[], -- Array of R2 URLs
          
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

      // Validácia dát
      if (!protocolData.id) {
        throw new Error('Protocol ID is required');
      }
      
      if (!protocolData.rentalId) {
        throw new Error('Rental ID is required');
      }

      const result = await client.query(`
        INSERT INTO handover_protocols (
          rental_id, location, odometer, fuel_level, fuel_type,
          exterior_condition, interior_condition, condition_notes,
          vehicle_images_urls, vehicle_videos_urls, document_images_urls, damage_images_urls,
          damages, signatures, rental_data, notes, created_by
        ) VALUES (
          $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17
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
        this.extractUrls(protocolData.vehicleImages || []),
        this.extractUrls(protocolData.vehicleVideos || []),
        this.extractUrls(protocolData.documentImages || []),
        this.extractUrls(protocolData.damageImages || []),
        JSON.stringify(protocolData.damages || []),
        JSON.stringify(protocolData.signatures || []),
        JSON.stringify(protocolData.rentalData || {}),
        protocolData.notes || '',
        protocolData.createdBy || ''
      ]);

      const row = result.rows[0];
      console.log('✅ Handover protocol created:', row.id);
      return this.mapHandoverProtocolFromDB(row);

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
        this.extractUrls(protocolData.vehicleImages || []),
        this.extractUrls(protocolData.vehicleVideos || []),
        this.extractUrls(protocolData.documentImages || []),
        this.extractUrls(protocolData.damageImages || []),
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
    return {
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
      vehicleImages: this.mapUrlsToMediaObjects(row.vehicle_images_urls || []),
      vehicleVideos: this.mapUrlsToMediaObjects(row.vehicle_videos_urls || []),
      documentImages: this.mapUrlsToMediaObjects(row.document_images_urls || []),
      damageImages: this.mapUrlsToMediaObjects(row.damage_images_urls || []),
      damages: row.damages ? JSON.parse(row.damages) : [],
      signatures: row.signatures ? JSON.parse(row.signatures) : [],
      rentalData: row.rental_data ? JSON.parse(row.rental_data) : {},
      notes: row.notes,
      createdBy: row.created_by
    };
  }

  private mapReturnProtocolFromDB(row: any): any {
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
      vehicleImages: this.mapUrlsToMediaObjects(row.vehicle_images_urls || []),
      vehicleVideos: this.mapUrlsToMediaObjects(row.vehicle_videos_urls || []),
      documentImages: this.mapUrlsToMediaObjects(row.document_images_urls || []),
      damageImages: this.mapUrlsToMediaObjects(row.damage_images_urls || []),
      damages: row.damages ? JSON.parse(row.damages) : [],
      newDamages: row.new_damages ? JSON.parse(row.new_damages) : [],
      signatures: row.signatures ? JSON.parse(row.signatures) : [],
      kilometersUsed: row.kilometers_used || 0,
      kilometerOverage: row.kilometer_overage || 0,
      kilometerFee: parseFloat(row.kilometer_fee) || 0,
      fuelUsed: row.fuel_used || 0,
      fuelFee: parseFloat(row.fuel_fee) || 0,
      totalExtraFees: parseFloat(row.total_extra_fees) || 0,
      depositRefund: parseFloat(row.deposit_refund) || 0,
      additionalCharges: parseFloat(row.additional_charges) || 0,
      finalRefund: parseFloat(row.final_refund) || 0,
      rentalData: row.rental_data ? JSON.parse(row.rental_data) : {},
      pdfUrl: row.pdf_url,
      emailSent: row.email_sent || false,
      emailSentAt: row.email_sent_at ? new Date(row.email_sent_at) : undefined,
      notes: row.notes,
      createdBy: row.created_by
    };
  }

  // Zatvorenie spojenia
  async close() {
    await this.pool.end();
  }
}

export const postgresDatabase = new PostgresDatabase(); 