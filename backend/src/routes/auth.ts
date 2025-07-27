import { Router, Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { postgresDatabase } from '../models/postgres-database';
import { LoginCredentials, AuthResponse, User, ApiResponse, AuthRequest } from '../types';
import { authenticateToken, requireRole } from '../middleware/auth';
import { v4 as uuidv4 } from 'uuid';

const router = Router();
const JWT_SECRET = process.env.JWT_SECRET || 'blackrent-secret-key-2024';

// POST /api/auth/create-admin - Dočasný endpoint na vytvorenie admin používateľa
router.post('/create-admin', async (req: Request, res: Response<ApiResponse>) => {
  try {
    console.log('🔧 Pokus o vytvorenie admin používateľa...');
    
    // Skontroluj či už admin existuje
    const existingAdmin = await postgresDatabase.getUserByUsername('admin');
    if (existingAdmin) {
      return res.status(400).json({
        success: false,
        error: 'Admin používateľ už existuje'
      });
    }

    // Vytvor hashovane heslo
    const hashedPassword = await bcrypt.hash('admin123', 12);
    
    // Vytvor admin používateľa priamo cez databázu
    const client = await (postgresDatabase as any).pool.connect();
    try {
      await client.query(
        'INSERT INTO users (id, username, email, password_hash, role) VALUES ($1, $2, $3, $4, $5)',
        [uuidv4(), 'admin', 'admin@blackrent.sk', hashedPassword, 'admin']
      );
      
      console.log('✅ Admin používateľ úspešne vytvorený');
      
      return res.json({
        success: true,
        message: 'Admin používateľ úspešne vytvorený (username: admin, password: admin123)'
      });
    } finally {
      client.release();
    }
  } catch (error) {
    console.error('❌ Chyba pri vytváraní admin používateľa:', error);
    return res.status(500).json({
      success: false,
      error: 'Chyba pri vytváraní admin používateľa'
    });
  }
});

// GET /api/auth/create-admin - GET verzia pre testovanie v prehliadači
router.get('/create-admin', async (req: Request, res: Response<ApiResponse>) => {
  try {
    console.log('🔧 GET request - Pokus o vytvorenie admin používateľa...');
    
    // Skontroluj či už admin existuje
    const existingAdmin = await postgresDatabase.getUserByUsername('admin');
    if (existingAdmin) {
      return res.status(400).json({
        success: false,
        error: 'Admin používateľ už existuje. Pre reset použite /api/auth/reset-admin-get'
      });
    }

    // Vytvor hashovane heslo - Black123 ako požadované
    const hashedPassword = await bcrypt.hash('Black123', 12);
    
    // Vytvor admin používateľa priamo cez databázu
    const client = await (postgresDatabase as any).pool.connect();
    try {
      await client.query(
        'INSERT INTO users (id, username, email, password_hash, role) VALUES ($1, $2, $3, $4, $5)',
        [uuidv4(), 'admin', 'admin@blackrent.sk', hashedPassword, 'admin']
      );
      
      console.log('✅ Admin používateľ úspešne vytvorený s heslom Black123');
      
      return res.json({
        success: true,
        message: 'Admin používateľ úspešne vytvorený (username: admin, password: Black123)',
        data: {
          username: 'admin',
          password: 'Black123',
          loginUrl: 'https://blackrent-app.vercel.app/login'
        }
      });
    } finally {
      client.release();
    }
  } catch (error: any) {
    console.error('❌ Chyba pri vytváraní admin používateľa:', error);
    return res.status(500).json({
      success: false,
      error: 'Chyba pri vytváraní admin používateľa: ' + error.message
    });
  }
});

// GET /api/auth/reset-admin-get - GET verzia pre reset admin hesla
router.get('/reset-admin-get', async (req: Request, res: Response<ApiResponse>) => {
  try {
    console.log('🔧 GET request - Resetujem admin používateľa...');
    
    // Vymaž existujúceho admin používateľa
    const client = await (postgresDatabase as any).pool.connect();
    try {
      await client.query('DELETE FROM users WHERE username = $1', ['admin']);
      console.log('🗑️ Starý admin účet vymazaný');
      
      // Vytvor nový hashovane heslo - Black123
      const hashedPassword = await bcrypt.hash('Black123', 12);
      
      // Vytvor nový admin účet
      await client.query(
        'INSERT INTO users (id, username, email, password_hash, role) VALUES ($1, $2, $3, $4, $5)',
        [uuidv4(), 'admin', 'admin@blackrent.sk', hashedPassword, 'admin']
      );
      
      console.log('✅ Admin účet úspešne resetovaný s heslom Black123');
      
      return res.json({
        success: true,
        message: 'Admin používateľ úspešne resetovaný (username: admin, password: Black123)',
        data: {
          username: 'admin',
          password: 'Black123',
          loginUrl: 'https://blackrent-app.vercel.app/login'
        }
      });
    } finally {
      client.release();
    }
  } catch (error: any) {
    console.error('❌ Chyba pri resetovaní admin používateľa:', error);
    return res.status(500).json({
      success: false,
      error: 'Chyba pri resetovaní admin používateľa: ' + error.message
    });
  }
});

// GET /api/auth/init-database - Inicializácia databázy a vytvorenie vzorových dát  
router.get('/init-database', async (req: Request, res: Response<ApiResponse>) => {
  try {
    console.log('🔧 GET request - Inicializujem databázu a vytváram vzorové dáta...');
    
    const client = await (postgresDatabase as any).pool.connect();
    try {
      // NAJSKÔR VYTVORIŤ VŠETKY TABUĽKY!
      console.log('📋 Vytváranie tabuliek...');
      
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
      
      // Tabuľka firiem
      await client.query(`
        CREATE TABLE IF NOT EXISTS companies (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          name VARCHAR(100) UNIQUE NOT NULL,
          description TEXT,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
      `);
      
      // Tabuľka poisťovní
      await client.query(`
        CREATE TABLE IF NOT EXISTS insurers (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          name VARCHAR(100) UNIQUE NOT NULL,
          description TEXT,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
      `);
      
      // Tabuľka prenájmov
      await client.query(`
        CREATE TABLE IF NOT EXISTS rentals (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          vehicle_id UUID REFERENCES vehicles(id),
          customer_id UUID REFERENCES customers(id),
          customer_name VARCHAR(200) NOT NULL,
          start_date DATE NOT NULL,
          end_date DATE NOT NULL,
          total_price DECIMAL(10,2) NOT NULL,
          commission DECIMAL(10,2) DEFAULT 0,
          payment_method VARCHAR(50) DEFAULT 'cash',
          paid BOOLEAN DEFAULT false,
          confirmed BOOLEAN DEFAULT false,
          handover_place TEXT,
          status VARCHAR(30) DEFAULT 'pending',
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
      `);
      
      // Tabuľka nákladov
      await client.query(`
        CREATE TABLE IF NOT EXISTS expenses (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          description VARCHAR(200) NOT NULL,
          amount DECIMAL(10,2) NOT NULL,
          date DATE NOT NULL,
          company VARCHAR(100),
          vehicle_id UUID REFERENCES vehicles(id),
          category VARCHAR(50),
          note TEXT,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
      `);
      
      console.log('✅ Všetky tabuľky vytvorené!');
      
      // TERAZ VZOROVÉ DÁTA...
      let created = {
        companies: 0,
        insurers: 0,
        vehicles: 0,
        customers: 0,
        rentals: 0,
        expenses: 0
      };
      
      // Skontroluj či už existujú dáta
      const vehicleCount = await client.query('SELECT COUNT(*) FROM vehicles');
      const customerCount = await client.query('SELECT COUNT(*) FROM customers');
      const rentalCount = await client.query('SELECT COUNT(*) FROM rentals');
      
      console.log('📊 Aktuálny počet záznamov: vehicles:', vehicleCount.rows[0].count, 'customers:', customerCount.rows[0].count, 'rentals:', rentalCount.rows[0].count);
      
      // Vytvorenie vzorových dát len ak neexistujú
      if (vehicleCount.rows[0].count === '0') {
        console.log('📋 Vytváram vzorové dáta...');
        
        // ... Pokračuje rovnako s vytváraním vzorových dát
        return res.json({
          success: true,
          message: 'Databáza a vzorové dáta úspešne inicializované',
          data: {
            tablesCreated: true,
            created: created,
            message: 'Všetky tabuľky sú teraz dostupné! Vzorové dáta sa vytvoria automaticky.'
          }
        });
      } else {
        return res.json({
          success: true,
          message: 'Databáza už obsahuje dáta',
          data: {
            tablesCreated: true,
            existing: {
              vehicles: vehicleCount.rows[0].count,
              customers: customerCount.rows[0].count,
              rentals: rentalCount.rows[0].count
            }
          }
        });
      }
      
    } finally {
      client.release();
    }
  } catch (error: any) {
    console.error('❌ Chyba pri inicializácii databázy:', error);
    return res.status(500).json({
      success: false,
      error: 'Chyba pri inicializácii databázy: ' + error.message
    });
  }
});

// GET /api/auth/create-sample-data - Vytvorenie vzorových dát (keď tabuľky už existujú)
router.get('/create-sample-data', async (req: Request, res: Response<ApiResponse>) => {
  try {
    console.log('🔧 GET request - Vytváram vzorové dáta...');
    
    const client = await (postgresDatabase as any).pool.connect();
    try {
      // Skontroluj či už existujú dáta
      const vehicleCount = await client.query('SELECT COUNT(*) FROM vehicles');
      const customerCount = await client.query('SELECT COUNT(*) FROM customers');
      const rentalCount = await client.query('SELECT COUNT(*) FROM rentals');
      
      console.log('📊 Aktuálny počet záznamov: vehicles:', vehicleCount.rows[0].count, 'customers:', customerCount.rows[0].count, 'rentals:', rentalCount.rows[0].count);
      
      let created = {
        companies: 0,
        insurers: 0,
        vehicles: 0,
        customers: 0,
        rentals: 0,
        expenses: 0
      };
      
      // 1. FIRMY
      const existingCompanies = await client.query('SELECT name FROM companies WHERE name IN ($1, $2, $3)', 
        ['ABC Rent', 'Premium Cars', 'City Rent']);
      const existingNames = existingCompanies.rows.map((row: any) => row.name);
      const companiesToInsert = ['ABC Rent', 'Premium Cars', 'City Rent'].filter(name => !existingNames.includes(name));
      
      if (companiesToInsert.length > 0) {
        const values = companiesToInsert.map((name, index) => `($${index + 1})`).join(', ');
        await client.query(`INSERT INTO companies (name) VALUES ${values}`, companiesToInsert);
        created.companies = companiesToInsert.length;
      }
      
      // 2. POISŤOVNE
      const existingInsurers = await client.query('SELECT name FROM insurers WHERE name IN ($1, $2)', 
        ['Allianz', 'Generali']);
      const existingInsurerNames = existingInsurers.rows.map((row: any) => row.name);
      const insurersToInsert = ['Allianz', 'Generali'].filter(name => !existingInsurerNames.includes(name));
      
      if (insurersToInsert.length > 0) {
        const values = insurersToInsert.map((name, index) => `($${index + 1})`).join(', ');
        await client.query(`INSERT INTO insurers (name) VALUES ${values}`, insurersToInsert);
        created.insurers = insurersToInsert.length;
      }
      
      // 3. VOZIDLÁ
      const existingVehicles = await client.query('SELECT COUNT(*) FROM vehicles WHERE license_plate IN ($1, $2, $3)', 
        ['BA123AB', 'BA456CD', 'BA789EF']);
        
      if (existingVehicles.rows[0].count === '0') {
        const vehicleResult = await client.query(`
          INSERT INTO vehicles (brand, model, license_plate, company, pricing, commission, status) VALUES 
          ('BMW', 'X5', 'BA123AB', 'ABC Rent', $1, $2, 'available'),
          ('Mercedes', 'E-Class', 'BA456CD', 'Premium Cars', $3, $4, 'available'),
          ('Audi', 'A4', 'BA789EF', 'City Rent', $5, $6, 'available')
          RETURNING id, brand, model
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
        
        const vehicles = vehicleResult.rows;
        created.vehicles = vehicles.length;
        
        // 4. ZÁKAZNÍCI
        const customerResult = await client.query(`
          INSERT INTO customers (name, email, phone) VALUES 
          ('Ján Novák', 'jan.novak@email.com', '+421901234567'),
          ('Mária Svobodová', 'maria.svobodova@email.com', '+421907654321'),
          ('Peter Horváth', 'peter.horvath@email.com', '+421905111222')
          RETURNING id, name
        `);
        const customers = customerResult.rows;
        created.customers = customers.length;
        
        // 5. PRENÁJMY
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
          created.rentals = 3;
        }
        
        // 6. NÁKLADY
        if (vehicles.length > 0) {
          await client.query(`
            INSERT INTO expenses (description, amount, date, vehicle_id, company, category, note) VALUES 
            ('Tankovanie', 65.50, '2025-01-15', $1, 'ABC Rent', 'fuel', 'Plná nádrž pred prenájmom'),
            ('Umytie vozidla', 15.00, '2025-01-16', $2, 'Premium Cars', 'maintenance', 'Externé umytie'),
            ('Servis - výmena oleja', 85.00, '2025-01-17', $3, 'City Rent', 'maintenance', 'Pravidelný servis')
          `, [vehicles[0]?.id, vehicles[1]?.id, vehicles[2]?.id]);
          created.expenses = 3;
        }
      }
      
      console.log('🎉 Vzorové dáta úspešne vytvorené!', created);
      
      return res.json({
        success: true,
        message: 'Vzorové dáta úspešne vytvorené',
        data: {
          created: created,
          summary: {
            vehicles: `${created.vehicles} vozidlá (BMW X5, Mercedes E-Class, Audi A4)`,
            customers: `${created.customers} zákazníci (Ján Novák, Mária Svobodová, Peter Horváth)`,
            rentals: `${created.rentals} prenájmy s rôznymi stavmi`,
            expenses: `${created.expenses} náklady (tankovanie, umytie, servis)`,
            companies: `${created.companies} firmy (ABC Rent, Premium Cars, City Rent)`,
            insurers: `${created.insurers} poisťovne (Allianz, Generali)`
          },
          refreshUrl: 'https://blackrent-app.vercel.app/login'
        }
      });
    } finally {
      client.release();
    }
  } catch (error: any) {
    console.error('❌ Chyba pri vytváraní vzorových dát:', error);
    return res.status(500).json({
      success: false,
      error: 'Chyba pri vytváraní vzorových dát: ' + error.message
    });
  }
});

// POST /api/auth/reset-admin - Reset admin používateľa pre debugging
router.post('/reset-admin', async (req: Request, res: Response<ApiResponse>) => {
  try {
    console.log('🔧 Resetujem admin používateľa...');
    
    const { password } = req.body;
    const adminPassword = password || 'Black123'; // Default heslo alebo z request
    
    // Vymaž existujúceho admin používateľa
    const client = await (postgresDatabase as any).pool.connect();
    try {
      await client.query('DELETE FROM users WHERE username = $1', ['admin']);
      console.log('🗑️ Starý admin účet vymazaný');
      
      // Vytvor nový hashovane heslo
      const hashedPassword = await bcrypt.hash(adminPassword, 12);
      
      // Vytvor nového admin používateľa
      await client.query(
        'INSERT INTO users (id, username, email, password_hash, role) VALUES ($1, $2, $3, $4, $5)',
        [uuidv4(), 'admin', 'admin@blackrent.sk', hashedPassword, 'admin']
      );
      
      console.log('✅ Nový admin používateľ vytvorený s heslom:', adminPassword);
      
      return res.json({
        success: true,
        message: `Admin používateľ resetovaný a znovu vytvorený (username: admin, password: ${adminPassword})`
      });
    } finally {
      client.release();
    }
  } catch (error) {
    console.error('❌ Chyba pri resetovaní admin používateľa:', error);
    return res.status(500).json({
      success: false,
      error: 'Chyba pri resetovaní admin používateľa'
    });
  }
});

// POST /api/auth/login - Prihlásenie
router.post('/login', async (req: Request, res: Response<AuthResponse>) => {
  try {
    const { username, password } = req.body;
    
    console.log('🔍 LOGIN DEBUG - Starting login for:', username);

    if (!username || !password) {
      console.log('❌ LOGIN DEBUG - Missing username or password');
      return res.status(400).json({
        success: false,
        error: 'Username a password sú povinné'
      });
    }

    console.log('🔍 LOGIN DEBUG - Getting user from database...');
    
    // Get user directly from database with detailed logging
    const client = await (postgresDatabase as any).pool.connect();
    let user;
    
    try {  
      const result = await client.query(
        'SELECT id, username, email, password_hash, role, first_name, last_name, signature_template, created_at FROM users WHERE username = $1', 
        [username]
      );
      user = result.rows[0];
      console.log('🔍 LOGIN DEBUG - Database query result:', {
        found: !!user,
        username: user?.username,
        hasPasswordHash: !!user?.password_hash,
        passwordHashLength: user?.password_hash?.length,
        hasFirstName: !!user?.first_name,
        hasLastName: !!user?.last_name,
        hasSignatureTemplate: !!user?.signature_template
      });
    } finally {
      client.release();
    }

    if (!user) {
      console.log('❌ LOGIN DEBUG - User not found in database');
      return res.status(401).json({
        success: false,
        error: 'Nesprávne prihlasovacie údaje'
      });
    }

    console.log('🔍 LOGIN DEBUG - Comparing passwords...');
    console.log('🔍 LOGIN DEBUG - Input password:', password);
    console.log('🔍 LOGIN DEBUG - Stored hash starts with:', user.password_hash?.substring(0, 10));
    
    const isPasswordValid = await bcrypt.compare(password, user.password_hash);
    console.log('🔍 LOGIN DEBUG - Password comparison result:', isPasswordValid);

    if (!isPasswordValid) {
      console.log('❌ LOGIN DEBUG - Password comparison failed');
      return res.status(401).json({
        success: false,
        error: 'Nesprávne prihlasovacie údaje'
      });
    }

    console.log('✅ LOGIN DEBUG - Password valid, creating token...');
    
    const token = jwt.sign(
      { 
        userId: user.id, 
        username: user.username, 
        role: user.role 
      },
      JWT_SECRET,
      { expiresIn: '30d' }
    );

    console.log('✅ LOGIN DEBUG - Token created successfully');

    const userData = {
      id: user.id,
      username: user.username,
      email: user.email,
      firstName: user.first_name,
      lastName: user.last_name,
      role: user.role,
      companyId: user.company_id,
      employeeNumber: user.employee_number,
      hireDate: user.hire_date ? new Date(user.hire_date) : undefined,
      isActive: user.is_active ?? true,
      lastLogin: user.last_login ? new Date(user.last_login) : undefined,
      signatureTemplate: user.signature_template,
      createdAt: new Date(user.created_at),
      updatedAt: user.updated_at ? new Date(user.updated_at) : undefined
    };

    res.json({
      success: true,
      user: userData,
      token,
      message: 'Úspešné prihlásenie'
    });

  } catch (error) {
    console.error('❌ LOGIN ERROR:', error);
    res.status(500).json({
      success: false,
      error: 'Chyba pri prihlásení'
    });
  }
});

// POST /api/auth/logout - Odhlásenie
router.post('/logout', authenticateToken, (req: Request, res: Response<ApiResponse>) => {
  // V JWT systéme sa token neodstraňuje zo servera
  // Klient musí odstrániť token zo svojho úložiska
  res.json({
    success: true,
    message: 'Úspešné odhlásenie'
  });
});

// GET /api/auth/me - Získanie informácií o aktuálnom používateľovi
router.get('/me', authenticateToken, (req: any, res: Response<ApiResponse>) => {
  res.json({
    success: true,
    data: req.user
  });
});

// GET /api/auth/users - Získanie všetkých používateľov (len admin)
router.get('/users', authenticateToken, requireRole(['admin']), async (req: Request, res: Response<ApiResponse<Omit<User, 'password'>[]>>) => {
  try {
    const users = await postgresDatabase.getUsers();
    const usersWithoutPasswords: Omit<User, 'password'>[] = users.map(user => ({
      id: user.id,
      username: user.username,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      role: user.role,
      companyId: user.companyId,
      employeeNumber: user.employeeNumber,
      hireDate: user.hireDate,
      isActive: user.isActive,
      lastLogin: user.lastLogin,
      permissions: user.permissions,
      signatureTemplate: user.signatureTemplate,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt
    }));

    res.json({
      success: true,
      data: usersWithoutPasswords
    });
  } catch (error) {
    console.error('Get users error:', error);
    res.status(500).json({
      success: false,
      error: 'Chyba pri získavaní používateľov'
    });
  }
});

// POST /api/auth/users - Vytvorenie nového používateľa (len admin)
router.post('/users', authenticateToken, requireRole(['admin']), async (req: Request, res: Response<ApiResponse>) => {
  try {
    const { 
      username, 
      email, 
      password, 
      role,
      firstName,
      lastName,
      companyId,
      employeeNumber,
      hireDate,
      isActive,
      signatureTemplate
    } = req.body;

    console.log('📋 Create user request body:', req.body);

    if (!username || !email || !password || !role) {
      return res.status(400).json({
        success: false,
        error: 'Všetky povinné polia musia byť vyplnené'
      });
    }

    // Skontroluj, či používateľ už existuje
    const existingUser = await postgresDatabase.getUserByUsername(username);
    if (existingUser) {
      return res.status(409).json({
        success: false,
        error: 'Používateľ s týmto menom už existuje'
      });
    }

    const userData = {
      username,
      email, 
      password,
      role,
      firstName: firstName || null,
      lastName: lastName || null,
      companyId: companyId || null,
      employeeNumber: employeeNumber || null,
      hireDate: hireDate ? new Date(hireDate) : null,
      isActive: isActive !== undefined ? isActive : true,
      signatureTemplate: signatureTemplate || null
    };

    console.log('👤 Creating user with data:', userData);
    const createdUser = await postgresDatabase.createUser(userData);

    res.status(201).json({
      success: true,
      message: 'Používateľ úspešne vytvorený',
      data: {
        id: createdUser.id,
        username: createdUser.username,
        email: createdUser.email,
        firstName: createdUser.firstName,
        lastName: createdUser.lastName,
        role: createdUser.role,
        companyId: createdUser.companyId,
        employeeNumber: createdUser.employeeNumber,
        hireDate: createdUser.hireDate,
        isActive: createdUser.isActive,
        lastLogin: createdUser.lastLogin,
        permissions: createdUser.permissions,
        signatureTemplate: createdUser.signatureTemplate,
        createdAt: createdUser.createdAt,
        updatedAt: createdUser.updatedAt
      }
    });

  } catch (error) {
    console.error('Create user error:', error);
    res.status(500).json({
      success: false,
      error: 'Chyba pri vytváraní používateľa'
    });
  }
});

// PUT /api/auth/users/:id - Aktualizácia používateľa (len admin)
router.put('/users/:id', authenticateToken, requireRole(['admin']), async (req: Request, res: Response<ApiResponse>) => {
  try {
    const { id } = req.params;
    const { username, email, password, role } = req.body;

    // Nájdi existujúceho používateľa
    const existingUser = await postgresDatabase.getUserById(id);
    if (!existingUser) {
      return res.status(404).json({
        success: false,
        error: 'Používateľ nenájdený'
      });
    }

    const updatedUser: User = {
      id,
      username: username || existingUser.username,
      email: email || existingUser.email,
      firstName: existingUser.firstName,
      lastName: existingUser.lastName,
      password: password || existingUser.password,
      role: role || existingUser.role,
      companyId: existingUser.companyId,
      employeeNumber: existingUser.employeeNumber,
      hireDate: existingUser.hireDate,
      isActive: existingUser.isActive,
      lastLogin: existingUser.lastLogin,
      permissions: existingUser.permissions,
      signatureTemplate: existingUser.signatureTemplate,
      createdAt: existingUser.createdAt,
      updatedAt: new Date()
    };

    await postgresDatabase.updateUser(updatedUser);

    res.json({
      success: true,
      message: 'Používateľ úspešne aktualizovaný'
    });

  } catch (error) {
    console.error('Update user error:', error);
    res.status(500).json({
      success: false,
      error: 'Chyba pri aktualizácii používateľa'
    });
  }
});

// DELETE /api/auth/users/:id - Vymazanie používateľa (len admin)
router.delete('/users/:id', authenticateToken, requireRole(['admin']), async (req: Request, res: Response<ApiResponse>) => {
  try {
    const { id } = req.params;

    // Skontroluj, či používateľ existuje
    const existingUser = await postgresDatabase.getUserById(id);
    if (!existingUser) {
      return res.status(404).json({
        success: false,
        error: 'Používateľ nenájdený'
      });
    }

    await postgresDatabase.deleteUser(id);

    res.json({
      success: true,
      message: 'Používateľ úspešne vymazaný'
    });

  } catch (error) {
    console.error('Delete user error:', error);
    res.status(500).json({
      success: false,
      error: 'Chyba pri vymazávaní používateľa'
    });
  }
});

// POST /api/auth/change-password - Zmena hesla
router.post('/change-password', authenticateToken, async (req: Request, res: Response<ApiResponse>) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const userId = (req as any).user.id;

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
    const user = await postgresDatabase.getUserById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'Používateľ nenájdený'
      });
    }

    // Over súčasné heslo
    const isCurrentPasswordValid = await bcrypt.compare(currentPassword, user.password);
    if (!isCurrentPasswordValid) {
      return res.status(400).json({
        success: false,
        error: 'Súčasné heslo je nesprávne'
      });
    }

    // Aktualizuj heslo
    const updatedUser: User = {
      ...user,
      password: newPassword // Bude zahashované v databáze
    };

    await postgresDatabase.updateUser(updatedUser);

    res.json({
      success: true,
      message: 'Heslo úspešne zmenené'
    });

  } catch (error) {
    console.error('Change password error:', error);
    res.status(500).json({
      success: false,
      error: 'Chyba pri zmene hesla'
    });
  }
});

// GET /api/auth/setup-admin - Jednoduchý setup admin používateľa
router.get('/setup-admin', async (req: Request, res: Response<ApiResponse>) => {
  try {
    console.log('🔧 Setup admin používateľa...');
    
    // Vytvor hashovane heslo
    const hashedPassword = await bcrypt.hash('Black123', 12);
    
    // Vymaž a vytvor nového admin používateľa
    const client = await (postgresDatabase as any).pool.connect();
    try {
      // Vymaž starý admin ak existuje
      await client.query('DELETE FROM users WHERE username = $1', ['admin']);
      
      // Vytvor nového admin používateľa
      await client.query(
        'INSERT INTO users (id, username, email, password_hash, role) VALUES ($1, $2, $3, $4, $5)',
        [uuidv4(), 'admin', 'admin@blackrent.sk', hashedPassword, 'admin']
      );
      
      console.log('✅ Admin používateľ created: admin / Black123');
      
      return res.json({
        success: true,
        message: 'Admin created successfully (username: admin, password: Black123)'
      });
    } finally {
      client.release();
    }
  } catch (error) {
    console.error('❌ Setup admin error:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to setup admin'
    });
  }
});

// GET /api/auth/init-admin - Super jednoduchý init pre admin
router.get('/init-admin', async (req: Request, res: Response) => {
  try {
    const client = await (postgresDatabase as any).pool.connect();
    
    try {
      // Najskôr skús vytvoriť novú users tabuľku ak neexistuje
      await client.query(`
        CREATE TABLE IF NOT EXISTS users_new (
          id TEXT PRIMARY KEY,
          username VARCHAR(50) UNIQUE NOT NULL,
          email VARCHAR(100) UNIQUE NOT NULL,
          password_hash VARCHAR(255) NOT NULL,
          role VARCHAR(30) DEFAULT 'user',
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
      `);
      
      // Vymaž admin ak existuje (v oboch tabuľkách)
      await client.query('DELETE FROM users_new WHERE username = $1', ['admin']).catch(()=>{});
      await client.query('DELETE FROM users WHERE username = $1', ['admin']).catch(()=>{});
      
      // Vytvor admin s TEXT ID (kompatibilný s oboma)
      const textId = 'admin-' + Date.now();
      const hashedPassword = await bcrypt.hash('Black123', 12);
      
      // Skús vložiť do users_new tabuľky
      await client.query(
        'INSERT INTO users_new (id, username, email, password_hash, role) VALUES ($1, $2, $3, $4, $5)',
        [textId, 'admin', 'admin@blackrent.sk', hashedPassword, 'admin']
      );
      
      res.send(`
        <html>
        <body style="font-family: Arial; padding: 20px; text-align: center;">
          <h1 style="color: green;">✅ Admin účet vytvorený!</h1>
          <p><strong>Username:</strong> admin</p>
          <p><strong>Password:</strong> Black123</p>
          <p><strong>Database:</strong> PostgreSQL (TEXT ID kompatibilný)</p>
          <p><strong>Table:</strong> users_new</p>
          <p>Môžete sa teraz prihlásiť na <a href="https://blackrent-app.vercel.app/login">Vercel aplikácii</a></p>
          <hr>
          <p>Čas: ${new Date().toLocaleString('sk-SK')}</p>
        </body>
        </html>
      `);
    } finally {
      client.release();
    }
  } catch (error) {
    console.error('Init admin error:', error);
    res.send(`
      <html>
      <body style="font-family: Arial; padding: 20px; text-align: center;">
        <h1 style="color: red;">❌ Chyba</h1>
        <p>Nepodarilo sa vytvoriť admin účet</p>
        <pre>${error}</pre>
        <hr>
        <p><strong>Skús znovu za 30 sekúnd</strong></p>
      </body>
      </html>
    `);
  }
});

// POST /api/auth/init-database - Emergency database initialization
router.post('/init-database', async (req: Request, res: Response<ApiResponse>) => {
  try {
    console.log('🚨 EMERGENCY: Initializing database...');
    
    const client = await (postgresDatabase as any).pool.connect();
    
    try {
      // First drop all existing tables to ensure clean slate
      console.log('🗑️ Dropping existing tables...');
      await client.query('DROP TABLE IF EXISTS insurances CASCADE');
      await client.query('DROP TABLE IF EXISTS rentals CASCADE');
      await client.query('DROP TABLE IF EXISTS expenses CASCADE');
      await client.query('DROP TABLE IF EXISTS companies CASCADE');
      await client.query('DROP TABLE IF EXISTS insurers CASCADE');
      await client.query('DROP TABLE IF EXISTS customers CASCADE');
      await client.query('DROP TABLE IF EXISTS vehicles CASCADE');
      await client.query('DROP TABLE IF EXISTS users CASCADE');
      
      console.log('📋 Creating clean database structure...');
      
      // Users table (keep this first as other tables might reference it)
      await client.query(`
        CREATE TABLE users (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          username VARCHAR(50) NOT NULL UNIQUE,
          email VARCHAR(100) NOT NULL UNIQUE,
          password_hash VARCHAR(255) NOT NULL,
          role VARCHAR(30) NOT NULL DEFAULT 'user',
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
      `);
      
      // Vehicles table
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
      
      // Customers table
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
      
      // Companies table
      await client.query(`
        CREATE TABLE companies (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          name VARCHAR(100) NOT NULL UNIQUE,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
      `);
      
      // Insurers table
      await client.query(`
        CREATE TABLE insurers (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          name VARCHAR(100) NOT NULL UNIQUE,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
      `);
      
      // Rentals table (no foreign key constraints to avoid issues)
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
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
      `);
      
      // Expenses table (no foreign key constraints)
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
      
      // Insurances table (no foreign key constraints)
      await client.query(`
        CREATE TABLE insurances (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          vehicle_id VARCHAR(50),
          type VARCHAR(50) NOT NULL,
          valid_from TIMESTAMP NOT NULL,
          valid_to TIMESTAMP NOT NULL,
          price DECIMAL(10,2) NOT NULL,
          company VARCHAR(100) NOT NULL,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
      `);
      
      // Create admin user
      console.log('👤 Creating admin user...');
      const hashedPassword = await bcrypt.hash('admin123', 12);
      
      await client.query(`
        INSERT INTO users (username, email, password_hash, role, created_at)
        VALUES ('admin', 'admin@blackrent.sk', $1, 'admin', CURRENT_TIMESTAMP)
      `, [hashedPassword]);
      
      console.log('🎉 Database initialization completed!');
      
      // Test queries
      const tableCheck = await client.query(`
        SELECT 
          (SELECT COUNT(*) FROM users) as users,
          (SELECT COUNT(*) FROM vehicles) as vehicles,
          (SELECT COUNT(*) FROM customers) as customers,
          (SELECT COUNT(*) FROM rentals) as rentals,
          (SELECT COUNT(*) FROM expenses) as expenses
      `);
      
      return res.json({
        success: true,
        message: 'Database initialized successfully - you can now login with admin/admin123',
        data: {
          tables_created: ['users', 'vehicles', 'customers', 'companies', 'insurers', 'rentals', 'expenses', 'insurances'],
          admin_created: true,
          counts: tableCheck.rows[0]
        }
      });
      
    } finally {
      client.release();
    }
    
  } catch (error) {
    console.error('❌ Database initialization failed:', error);
    return res.status(500).json({
      success: false,
      error: 'Database initialization failed: ' + (error as Error).message
    });
  }
});

// GET /api/auth/fix-customers - Debug endpoint na opravenie customers tabuľky
router.get('/fix-customers', async (req: Request, res: Response) => {
  try {
    const client = await (postgresDatabase as any).pool.connect();
    
    try {
      // Zisti ako vyzerá customers tabuľka
      const schema = await client.query(`
        SELECT column_name, data_type, is_nullable 
        FROM information_schema.columns 
        WHERE table_name = 'customers' 
        ORDER BY ordinal_position
      `);
      
      console.log('📋 Current customers table schema:', schema.rows);
      
      // Skús opraviť customers tabuľku
      if (schema.rows.some((col: any) => col.column_name === 'first_name')) {
        console.log('🔧 Found first_name column, fixing...');
        
        // Rename first_name to name if needed
        await client.query(`
          ALTER TABLE customers RENAME COLUMN first_name TO name
        `).catch((e: any) => console.log('Rename error:', e.message));
        
        // Remove last_name if exists  
        await client.query(`
          ALTER TABLE customers DROP COLUMN IF EXISTS last_name
        `).catch((e: any) => console.log('Drop error:', e.message));
      }
      
      // Ensure proper constraints
      await client.query(`
        ALTER TABLE customers 
        ALTER COLUMN name SET NOT NULL,
        ALTER COLUMN name TYPE VARCHAR(100)
      `).catch((e: any) => console.log('Constraint error:', e.message));
      
      // Get final schema
      const finalSchema = await client.query(`
        SELECT column_name, data_type, is_nullable 
        FROM information_schema.columns 
        WHERE table_name = 'customers' 
        ORDER BY ordinal_position
      `);
      
      res.send(`
        <html>
        <body style="font-family: Arial; padding: 20px;">
          <h1 style="color: green;">✅ Customers table fixed!</h1>
          <h3>Original schema:</h3>
          <pre>${JSON.stringify(schema.rows, null, 2)}</pre>
          <h3>Final schema:</h3>
          <pre>${JSON.stringify(finalSchema.rows, null, 2)}</pre>
          <hr>
          <p>Čas: ${new Date().toLocaleString('sk-SK')}</p>
        </body>
        </html>
      `);
    } finally {
      client.release();
    }
  } catch (error) {
    console.error('Fix customers error:', error);
    res.send(`
      <html>
      <body style="font-family: Arial; padding: 20px; text-align: center;">
        <h1 style="color: red;">❌ Chyba</h1>
        <p>Nepodarilo sa opraviť customers tabuľku</p>
        <pre>${error}</pre>
      </body>
      </html>
    `);
  }
});

// GET /api/auth/debug-db - Simple database debug endpoint
router.get('/debug-db', async (req: Request, res: Response<ApiResponse>) => {
  try {
    const client = await (postgresDatabase as any).pool.connect();
    
    try {
      // Check tables
      const tablesQuery = await client.query(`
        SELECT table_name 
        FROM information_schema.tables 
        WHERE table_schema = 'public'
        ORDER BY table_name
      `);
      
      // Check admin user
      const adminQuery = await client.query(`
        SELECT username, email, role, created_at 
        FROM users 
        WHERE username = 'admin'
      `);
      
      // Check counts
      const countsQuery = await client.query(`
        SELECT 
          (SELECT COUNT(*) FROM users) as users,
          (SELECT COUNT(*) FROM vehicles) as vehicles,
          (SELECT COUNT(*) FROM customers) as customers,
          (SELECT COUNT(*) FROM rentals) as rentals,
          (SELECT COUNT(*) FROM expenses) as expenses
      `);
      
      return res.json({
        success: true,
        data: {
          database_connected: true,
          tables: tablesQuery.rows.map((r: any) => r.table_name),
          admin_user: adminQuery.rows[0] || null,
          counts: countsQuery.rows[0]
        }
      });
      
    } finally {
      client.release();
    }
    
  } catch (error) {
    console.error('Database debug error:', error);
    return res.json({
      success: false,
      error: 'Database debug failed: ' + (error as Error).message
    });
  }
});

// GET /api/auth/force-create-data - FORCE vytvorenie vzorových dát (ignoruje existujúce)
router.get('/force-create-data', async (req: Request, res: Response<ApiResponse>) => {
  try {
    console.log('🔧 GET request - FORCE vytváram vzorové dáta (ignorujem existujúce)...');
    
    const client = await (postgresDatabase as any).pool.connect();
    try {
      let created = {
        companies: 0,
        insurers: 0,
        vehicles: 0,
        customers: 0,
        rentals: 0,
        expenses: 0
      };
      
      // 1. FIRMY - FORCE INSERT ALEBO IGNORE DUPLICATES
      try {
        const result = await client.query(`
          INSERT INTO companies (name) VALUES ('ABC Rent'), ('Premium Cars'), ('City Rent')
          ON CONFLICT (name) DO NOTHING
          RETURNING name
        `);
        created.companies = result.rows.length;
      } catch (e: any) {
        console.log('⚠️ Firmy:', e.message);
      }
      
      // 2. POISŤOVNE  
      try {
        const result = await client.query(`
          INSERT INTO insurers (name) VALUES ('Allianz'), ('Generali')
          ON CONFLICT (name) DO NOTHING
          RETURNING name
        `);
        created.insurers = result.rows.length;
      } catch (e: any) {
        console.log('⚠️ Poisťovne:', e.message);
      }
      
      // 3. VOZIDLÁ - FORCE INSERT ALEBO IGNORE
      try {
        const vehicleResult = await client.query(`
          INSERT INTO vehicles (brand, model, year, license_plate, company, pricing, commission, status) VALUES 
          ('BMW', 'X5', 2023, 'BA123AB', 'ABC Rent', $1, $2, 'available'),
          ('Mercedes', 'E-Class', 2022, 'BA456CD', 'Premium Cars', $3, $4, 'available'),
          ('Audi', 'A4', 2024, 'BA789EF', 'City Rent', $5, $6, 'available')
          ON CONFLICT (license_plate) DO NOTHING
          RETURNING id, brand, model, year
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
        
        const vehicles = vehicleResult.rows;
        created.vehicles = vehicles.length;
        
        // 4. ZÁKAZNÍCI  
        const customerResult = await client.query(`
          INSERT INTO customers (name, email, phone) VALUES 
          ('Ján Novák', 'jan.novak@email.com', '+421901234567'),
          ('Mária Svobodová', 'maria.svobodova@email.com', '+421907654321'),
          ('Peter Horváth', 'peter.horvath@email.com', '+421905111222')
          ON CONFLICT (email) DO NOTHING
          RETURNING id, name
        `);
        const customers = customerResult.rows;
        created.customers = customers.length;
        
        // 5. PRENÁJMY - len ak máme vozidlá a zákazníkov
        if (vehicles.length > 0 && customers.length > 0) {
          // Najprv zisti všetky vozidlá a zákazníkov
          const allVehicles = await client.query('SELECT id FROM vehicles LIMIT 3');
          const allCustomers = await client.query('SELECT id, name FROM customers LIMIT 3'); 
          
          if (allVehicles.rows.length >= 3 && allCustomers.rows.length >= 3) {
            const rentalResult = await client.query(`
              INSERT INTO rentals (vehicle_id, customer_id, customer_name, start_date, end_date, total_price, commission, payment_method, paid, confirmed, handover_place) VALUES 
              ($1, $2, $3, '2025-01-20', '2025-01-23', 240.00, 36.00, 'bank_transfer', true, true, 'Bratislava - Hlavná stanica'),
              ($4, $5, $6, '2025-01-25', '2025-01-30', 400.00, 72.00, 'cash', false, true, 'Bratislava - Letisko'),
              ($7, $8, $9, '2025-01-28', '2025-02-02', 275.00, 33.00, 'bank_transfer', true, false, 'Košice - Centrum')
              RETURNING id
            `, [
              allVehicles.rows[0].id, allCustomers.rows[0].id, allCustomers.rows[0].name,
              allVehicles.rows[1].id, allCustomers.rows[1].id, allCustomers.rows[1].name,
              allVehicles.rows[2].id, allCustomers.rows[2].id, allCustomers.rows[2].name
            ]);
            created.rentals = rentalResult.rows.length;
          }
        }
        
        // 6. NÁKLADY
        if (vehicles.length > 0) {
          const allVehicles = await client.query('SELECT id FROM vehicles LIMIT 3');
          if (allVehicles.rows.length >= 3) {
            const expenseResult = await client.query(`
              INSERT INTO expenses (description, amount, date, vehicle_id, company, category, note) VALUES 
              ('Tankovanie', 65.50, '2025-01-15', $1, 'ABC Rent', 'fuel', 'Plná nádrž pred prenájmom'),
              ('Umytie vozidla', 15.00, '2025-01-16', $2, 'Premium Cars', 'maintenance', 'Externé umytie'),
              ('Servis - výmena oleja', 85.00, '2025-01-17', $3, 'City Rent', 'maintenance', 'Pravidelný servis')
              RETURNING id
            `, [allVehicles.rows[0].id, allVehicles.rows[1].id, allVehicles.rows[2].id]);
            created.expenses = expenseResult.rows.length;
          }
        }
        
      } catch (vehicleError: any) {
        console.log('⚠️ Chyba pri vozidlách/dátach:', vehicleError.message);
      }
      
      console.log('🎉 FORCE vytvorenie dát dokončené!', created);
      
      return res.json({
        success: true,
        message: 'FORCE vytvorenie vzorových dát dokončené',
        data: {
          created: created,
          summary: {
            vehicles: `${created.vehicles} vozidlá (BMW X5, Mercedes E-Class, Audi A4)`,
            customers: `${created.customers} zákazníci (Ján Novák, Mária Svobodová, Peter Horváth)`,
            rentals: `${created.rentals} prenájmy s rôznymi stavmi`,
            expenses: `${created.expenses} náklady (tankovanie, umytie, servis)`,
            companies: `${created.companies} firmy (ABC Rent, Premium Cars, City Rent)`,
            insurers: `${created.insurers} poisťovne (Allianz, Generali)`
          },
          refreshUrl: 'https://blackrent-app.vercel.app/login'
        }
      });
    } finally {
      client.release();
    }
  } catch (error: any) {
    console.error('❌ Chyba pri FORCE vytváraní vzorových dát:', error);
    return res.status(500).json({
      success: false,
      error: 'Chyba pri FORCE vytváraní vzorových dát: ' + error.message
    });
  }
});

// GET /api/auth/debug-tables - Debug check tables existence  
router.get('/debug-tables', async (req: Request, res: Response<ApiResponse>) => {
  try {
    console.log('🔍 DEBUG - Kontrolujem existenciu tabuliek...');
    
    const client = await (postgresDatabase as any).pool.connect();
    try {
      let tables: any = {};
      
      // Test existencie tabuliek
      try {
        const result = await client.query("SELECT tablename FROM pg_tables WHERE schemaname = 'public'");
        tables.allTables = result.rows.map((row: any) => row.tablename);
      } catch (e: any) {
        tables.allTablesError = e.message;
      }
      
      // SCHÉMA VEHICLES TABUĽKY  
      try {
        const schemaResult = await client.query(`
          SELECT column_name, data_type, is_nullable 
          FROM information_schema.columns 
          WHERE table_name = 'vehicles' AND table_schema = 'public'
          ORDER BY ordinal_position
        `);
        tables.vehiclesSchema = schemaResult.rows;
      } catch (e: any) {
        tables.vehiclesSchemaError = e.message;
      }
      
      // Test konkrétnych tabuliek
      const tablesToTest = ['vehicles', 'customers', 'companies', 'insurers', 'rentals', 'expenses'];
      
      for (const table of tablesToTest) {
        try {
          const result = await client.query(`SELECT COUNT(*) FROM ${table}`);
          tables[table] = {
            exists: true,
            count: result.rows[0].count,
            countType: typeof result.rows[0].count
          };
        } catch (e: any) {
          tables[table] = {
            exists: false,
            error: e.message
          };
        }
      }
      
      // Test vytvorenia jedného záznamu
      try {
        const testResult = await client.query(`
          INSERT INTO companies (name) VALUES ('TEST COMPANY')
          ON CONFLICT (name) DO NOTHING
          RETURNING name
        `);
        tables.testInsert = {
          success: true,
          inserted: testResult.rows.length,
          data: testResult.rows
        };
      } catch (e: any) {
        tables.testInsert = {
          success: false,
          error: e.message
        };
      }
      
      console.log('🔍 DEBUG tables result:', tables);
      
      return res.json({
        success: true,
        message: 'DEBUG informácie o tabuľkách',
        data: tables
      });
    } finally {
      client.release();
    }
  } catch (error: any) {
    console.error('❌ Chyba pri DEBUG tables:', error);
    return res.status(500).json({
      success: false,
      error: 'DEBUG error: ' + error.message
    });
  }
});

// GET /api/auth/simple-vehicle-test - Jednoduchý test na vytvorenie jedného vozidla
router.get('/simple-vehicle-test', async (req: Request, res: Response<ApiResponse>) => {
  try {
    console.log('🚗 TEST - Vytváram jedno testové vozidlo...');
    
    const client = await (postgresDatabase as any).pool.connect();
    try {
      // Skús vytvoriť jedno vozidlo bez ON CONFLICT
      const result = await client.query(`
        INSERT INTO vehicles (brand, model, year, license_plate, company, pricing, commission, status) 
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
        RETURNING id, brand, model, year, license_plate
      `, [
        'BMW',
        'X5',
        2023,
        'TEST123',
        'Test Company',
        JSON.stringify([{ id: '1', minDays: 0, maxDays: 1, pricePerDay: 80 }]),
        JSON.stringify({ type: 'percentage', value: 15 }),
        'available'
      ]);
      
      console.log('✅ Vozidlo vytvorené:', result.rows[0]);
      
      return res.json({
        success: true,
        message: 'Test vozidlo úspešne vytvorené',
        data: {
          vehicle: result.rows[0],
          test: 'Pokračujem s ďalšími...'
        }
      });
    } finally {
      client.release();
    }
  } catch (error: any) {
    console.error('❌ Chyba pri test vozidla:', error);
    return res.json({
      success: false,
      error: 'Chyba pri test vozidla: ' + error.message,
      data: { detail: error.detail || null }
    });
  }
});

// GET /api/auth/fix-vehicles-schema - Oprava schémy vehicles tabuľky  
router.get('/fix-vehicles-schema', async (req: Request, res: Response<ApiResponse>) => {
  try {
    console.log('🔧 FIX - Opravujem schému vehicles tabuľky...');
    
    const client = await (postgresDatabase as any).pool.connect();
    try {
      let fixes: any = {};
      
      // 1. SKONTROLUJ AKTUÁLNU SCHÉMU
      const currentSchema = await client.query(`
        SELECT column_name, data_type 
        FROM information_schema.columns 
        WHERE table_name = 'vehicles' AND table_schema = 'public'
        ORDER BY ordinal_position
      `);
      fixes.currentColumns = currentSchema.rows.map((row: any) => row.column_name);
      
      // 2. OPRAV STĹPCE: make -> brand
      if (fixes.currentColumns.includes('make')) {
        try {
          await client.query('ALTER TABLE vehicles RENAME COLUMN make TO brand');
          fixes.brandRenamed = true;
        } catch (e: any) {
          fixes.brandRenameError = e.message;
        }
      }
      
      // 3. PRIDAJ CHÝBAJÚCE STĹPCE AK NEEXISTUJÚ
      const requiredColumns = [
        { name: 'license_plate', type: 'VARCHAR(50) UNIQUE', default: null },
        { name: 'company', type: 'VARCHAR(100)', default: "'Unknown'" },
        { name: 'pricing', type: 'JSONB', default: "'[]'" },
        { name: 'commission', type: 'JSONB', default: "'{\"type\": \"percentage\", \"value\": 15}'" },
        { name: 'status', type: 'VARCHAR(30)', default: "'available'" },
        { name: 'created_at', type: 'TIMESTAMP', default: 'CURRENT_TIMESTAMP' },
        { name: 'updated_at', type: 'TIMESTAMP', default: 'CURRENT_TIMESTAMP' }
      ];
      
      fixes.columnsAdded = [];
      for (const col of requiredColumns) {
        if (!fixes.currentColumns.includes(col.name)) {
          try {
            const alterQuery = col.default 
              ? `ALTER TABLE vehicles ADD COLUMN ${col.name} ${col.type} DEFAULT ${col.default}`
              : `ALTER TABLE vehicles ADD COLUMN ${col.name} ${col.type}`;
            await client.query(alterQuery);
            fixes.columnsAdded.push(col.name);
          } catch (e: any) {
            fixes[`${col.name}_error`] = e.message;
          }
        }
      }
      
      // 4. SKONTROLUJ NOVÚ SCHÉMU
      const newSchema = await client.query(`
        SELECT column_name, data_type 
        FROM information_schema.columns 
        WHERE table_name = 'vehicles' AND table_schema = 'public'
        ORDER BY ordinal_position
      `);
      fixes.newColumns = newSchema.rows.map((row: any) => row.column_name);
      
      console.log('🔧 Schema fixes completed:', fixes);
      
      return res.json({
        success: true,
        message: 'Vehicles schema úspešne opravená',
        data: fixes
      });
    } finally {
      client.release();
    }
  } catch (error: any) {
    console.error('❌ Chyba pri oprave schémy:', error);
    return res.status(500).json({
      success: false,
      error: 'Chyba pri oprave schémy: ' + error.message
    });
  }
});

// GET /api/auth/step-by-step-data - Postupné vytvorenie vzorových dát s debug info
router.get('/step-by-step-data', async (req: Request, res: Response<ApiResponse>) => {
  try {
    console.log('📋 STEP-BY-STEP - Postupne vytváram vzorové dáta...');
    
    const client = await (postgresDatabase as any).pool.connect();
    try {
      let steps: any = [];
      
      // KROK 1: FIRMA
      try {
        const companyResult = await client.query(`
          INSERT INTO companies (name) VALUES ('ABC Rent')
          ON CONFLICT (name) DO NOTHING
          RETURNING name
        `);
        steps.push({ step: 1, name: 'firma', success: true, created: companyResult.rows.length });
      } catch (e: any) {
        steps.push({ step: 1, name: 'firma', success: false, error: e.message });
      }
      
      // KROK 2: VOZIDLO  
      try {
        const vehicleResult = await client.query(`
          INSERT INTO vehicles (brand, model, year, license_plate, company, pricing, commission, status) 
          VALUES ('BMW', 'X5', 2023, 'BA999TEST', 'ABC Rent', $1, $2, 'available')
          ON CONFLICT (license_plate) DO NOTHING
          RETURNING id, brand, model, year, license_plate
        `, [
          JSON.stringify([{ id: '1', minDays: 0, maxDays: 1, pricePerDay: 80 }]),
          JSON.stringify({ type: 'percentage', value: 15 })
        ]);
        steps.push({ step: 2, name: 'vozidlo', success: true, created: vehicleResult.rows.length, data: vehicleResult.rows[0] });
      } catch (e: any) {
        steps.push({ step: 2, name: 'vozidlo', success: false, error: e.message });
      }
      
      // KROK 3: ZÁKAZNÍK
      try {
        const customerResult = await client.query(`
          INSERT INTO customers (name, email, phone) 
          VALUES ('Test Novák', 'test.novak@example.com', '+421999888777')
          RETURNING id, name
        `);
        steps.push({ step: 3, name: 'zákazník', success: true, created: customerResult.rows.length, data: customerResult.rows[0] });
      } catch (e: any) {
        steps.push({ step: 3, name: 'zákazník', success: false, error: e.message });
      }
      
      // KROK 4: PRENÁJOM (len ak máme vozidlo a zákazníka)
      const vehicleStep = steps.find((s: any) => s.name === 'vozidlo');
      const customerStep = steps.find((s: any) => s.name === 'zákazník');
      
      if (vehicleStep?.success && customerStep?.success) {
        try {
          const rentalResult = await client.query(`
            INSERT INTO rentals (vehicle_id, customer_id, customer_name, start_date, end_date, total_price, commission, payment_method, paid, confirmed, handover_place) 
            VALUES ($1, $2, $3, '2025-01-20', '2025-01-23', 240.00, 36.00, 'bank_transfer', true, true, 'Bratislava Test')
            RETURNING id
          `, [vehicleStep.data.id, customerStep.data.id, customerStep.data.name]);
          steps.push({ step: 4, name: 'prenájom', success: true, created: rentalResult.rows.length });
        } catch (e: any) {
          steps.push({ step: 4, name: 'prenájom', success: false, error: e.message });
        }
      } else {
        steps.push({ step: 4, name: 'prenájom', success: false, error: 'Chýba vozidlo alebo zákazník' });
      }
      
      console.log('📋 STEP-BY-STEP dokončené:', steps);
      
      return res.json({
        success: true,
        message: 'Step-by-step vytvorenie vzorových dát dokončené',
        data: { steps }
      });
    } finally {
      client.release();
    }
  } catch (error: any) {
    console.error('❌ Chyba pri step-by-step:', error);
    return res.status(500).json({
      success: false,
      error: 'Step-by-step error: ' + error.message
    });
  }
});

// PUT /api/auth/signature-template - Update user signature template
router.put('/signature-template', authenticateToken, async (req: AuthRequest, res: Response<ApiResponse>) => {
  try {
    console.log('🖊️ Updating signature template for user:', req.user?.username);
    
    const { signatureTemplate } = req.body;
    
    if (!signatureTemplate || typeof signatureTemplate !== 'string') {
      return res.status(400).json({
        success: false,
        error: 'Signature template je povinný'
      });
    }
    
    if (!req.user?.id) {
      return res.status(401).json({
        success: false,
        error: 'User ID not found'
      });
    }
    
    // Update signature template in database
    const client = await (postgresDatabase as any).pool.connect();
    try {
      await client.query(
        'UPDATE users SET signature_template = $1 WHERE id = $2',
        [signatureTemplate, req.user.id]
      );
      
      // Načítaj aktualizovaný user objekt
      const updatedUser = await postgresDatabase.getUserById(req.user.id);
      
      console.log('✅ Signature template updated successfully');
      console.log('🖊️ Updated signature template for user:', updatedUser?.username);
      
      res.json({
        success: true,
        message: 'Signature template úspešne uložený',
        user: updatedUser
      });
    } finally {
      client.release();
    }
  } catch (error: any) {
    console.error('❌ Error updating signature template:', error);
    res.status(500).json({
      success: false,
      error: 'Chyba pri ukladaní signature template'
    });
  }
});

// PUT /api/auth/profile - Update user profile (firstName, lastName)
router.put('/profile', authenticateToken, async (req: AuthRequest, res: Response<ApiResponse>) => {
  try {
    console.log('👤 Updating profile for user:', req.user?.username);
    
    const { firstName, lastName } = req.body;
    
    if (!req.user?.id) {
      return res.status(401).json({
        success: false,
        error: 'User ID not found'
      });
    }
    
    // Update user profile in database
    const client = await (postgresDatabase as any).pool.connect();
    try {
      await client.query(
        'UPDATE users SET first_name = $1, last_name = $2 WHERE id = $3',
        [firstName || null, lastName || null, req.user.id]
      );
      
      // Načítaj aktualizovaný user objekt
      const updatedUser = await postgresDatabase.getUserById(req.user.id);
      
      console.log('✅ User profile updated successfully');
      console.log('👤 Updated user data:', {
        id: updatedUser?.id,
        username: updatedUser?.username,
        firstName: updatedUser?.firstName,
        lastName: updatedUser?.lastName
      });
      
      res.json({
        success: true,
        message: 'Profil úspešne aktualizovaný',
        user: updatedUser
      });
    } finally {
      client.release();
    }
  } catch (error: any) {
    console.error('❌ Error updating user profile:', error);
    res.status(500).json({
      success: false,
      error: 'Chyba pri aktualizácii profilu'
    });
  }
});

// GET /api/auth/debug-token - Debug endpoint pre JWT token diagnostiku
router.get('/debug-token', async (req: Request, res: Response<ApiResponse>) => {
  try {
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.split(' ')[1];
    
    console.log('🔍 TOKEN DEBUG - Auth header:', authHeader);
    console.log('🔍 TOKEN DEBUG - Extracted token:', token ? token.substring(0, 50) + '...' : 'NO TOKEN');
    
    if (!token) {
      return res.json({
        success: false,
        error: 'No token provided',
        data: {
          authHeader: !!authHeader,
          tokenExtracted: false
        }
      });
    }

    try {
      // Manuálne overenie tokenu
      const decoded = jwt.verify(token, JWT_SECRET) as any;
      console.log('🔍 TOKEN DEBUG - Token successfully decoded:', decoded);
      
      // Skús získať používateľa z databázy
      const user = await postgresDatabase.getUserById(decoded.userId);
      console.log('🔍 TOKEN DEBUG - User from database:', user ? 'FOUND' : 'NOT FOUND');
      
      return res.json({
        success: true,
        message: 'Token is valid',
        data: {
          tokenValid: true,
          decoded: {
            userId: decoded.userId,
            username: decoded.username,
            role: decoded.role,
            exp: decoded.exp,
            iat: decoded.iat
          },
          userExists: !!user,
          currentTime: Math.floor(Date.now() / 1000),
          tokenExpiry: decoded.exp,
          timeToExpiry: decoded.exp - Math.floor(Date.now() / 1000),
          jwtSecret: JWT_SECRET.substring(0, 10) + '...'
        }
      });
      
    } catch (jwtError) {
      console.error('🔍 TOKEN DEBUG - JWT verification failed:', jwtError);
      
      return res.json({
        success: false,
        error: 'Token verification failed',
        data: {
          tokenValid: false,
          jwtError: jwtError instanceof Error ? jwtError.message : String(jwtError),
          jwtSecret: JWT_SECRET.substring(0, 10) + '...',
          tokenLength: token.length
        }
      });
    }
    
  } catch (error) {
    console.error('🔍 TOKEN DEBUG ERROR:', error);
    return res.status(500).json({
      success: false,
      error: 'Debug endpoint error',
      data: {
        error: error instanceof Error ? error.message : String(error)
      }
    });
  }
});

// DEBUG endpoint na kontrolu users tabuľky a migrácií
router.get('/debug-users-table', async (req: Request, res: Response<any>) => {
  try {
    console.log('🔍 DEBUG: Kontrolujem users tabuľku...');
    
    const client = await (postgresDatabase as any).pool.connect();
    try {
      // 1. Skontroluj či existuje users tabuľka
      const tableExists = await client.query(`
        SELECT EXISTS (
          SELECT FROM information_schema.tables 
          WHERE table_schema = 'public' 
          AND table_name = 'users'
        );
      `);
      
      console.log('🔍 Users tabuľka existuje:', tableExists.rows[0].exists);
      
      if (!tableExists.rows[0].exists) {
        return res.json({
          success: false,
          error: 'Users tabuľka neexistuje',
          debug: { tableExists: false }
        });
      }
      
      // 2. Skontroluj stĺpce v users tabuľke
      const columns = await client.query(`
        SELECT column_name, data_type, is_nullable
        FROM information_schema.columns 
        WHERE table_name = 'users' 
        ORDER BY ordinal_position;
      `);
      
      console.log('🔍 Stĺpce v users tabuľke:', columns.rows);
      
      // 3. Skontroluj či existujú potrebné stĺpce
      const hasFirstName = columns.rows.some((col: any) => col.column_name === 'first_name');
      const hasLastName = columns.rows.some((col: any) => col.column_name === 'last_name');
      const hasSignatureTemplate = columns.rows.some((col: any) => col.column_name === 'signature_template');
      
      // 4. Ak chýbajú stĺpce, spusti migráciu
      if (!hasFirstName || !hasLastName || !hasSignatureTemplate) {
        console.log('🔧 Spúšťam migráciu pre chýbajúce stĺpce...');
        
        await client.query(`
          ALTER TABLE users 
          ADD COLUMN IF NOT EXISTS signature_template TEXT,
          ADD COLUMN IF NOT EXISTS first_name VARCHAR(100),
          ADD COLUMN IF NOT EXISTS last_name VARCHAR(100);
        `);
        
        console.log('✅ Migrácia dokončená');
      }
      
      // 5. Skontroluj admin používateľa
      const adminUser = await client.query(`
        SELECT id, username, email, role, first_name, last_name, signature_template
        FROM users 
        WHERE username = 'admin'
        LIMIT 1;
      `);
      
      console.log('🔍 Admin používateľ:', adminUser.rows[0] || 'Nenájdený');
      
      return res.json({
        success: true,
        message: 'Users tabuľka debug dokončený',
        debug: {
          tableExists: true,
          columns: columns.rows,
          hasFirstName,
          hasLastName,
          hasSignatureTemplate,
          adminUser: adminUser.rows[0] || null
        }
      });
      
    } finally {
      client.release();
    }
  } catch (error: any) {
    console.error('❌ DEBUG chyba:', error);
    return res.status(500).json({
      success: false,
      error: 'DEBUG chyba: ' + error.message
    });
  }
});

// 🧪 TEST PERMISSION ENDPOINT - pre lokálne testovanie
router.get('/test-permissions', authenticateToken, async (req: Request, res: Response<ApiResponse>) => {
  try {
    const { hasPermission } = await import('../middleware/permissions');
    
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: 'Používateľ nie je prihlásený'
      });
    }

    const testResults = {
      currentUser: {
        id: req.user.id,
        username: req.user.username,
        role: req.user.role,
        companyId: req.user.companyId
      },
      permissionTests: {
        // 🚗 VEHICLES
        vehicles_read: hasPermission(req.user.role, 'vehicles', 'read'),
        vehicles_create: hasPermission(req.user.role, 'vehicles', 'create'),
        vehicles_update: hasPermission(req.user.role, 'vehicles', 'update'),
        vehicles_delete: hasPermission(req.user.role, 'vehicles', 'delete'),
        
        // 🏠 RENTALS  
        rentals_read: hasPermission(req.user.role, 'rentals', 'read'),
        rentals_create: hasPermission(req.user.role, 'rentals', 'create'),
        rentals_update: hasPermission(req.user.role, 'rentals', 'update'),
        rentals_delete: hasPermission(req.user.role, 'rentals', 'delete'),
        
        // 🏢 COMPANIES
        companies_read: hasPermission(req.user.role, 'companies', 'read'),
        companies_create: hasPermission(req.user.role, 'companies', 'create'),
        companies_delete: hasPermission(req.user.role, 'companies', 'delete'),
        
        // 👥 USERS
        users_read: hasPermission(req.user.role, 'users', 'read'),
        users_create: hasPermission(req.user.role, 'users', 'create'),
        users_update: hasPermission(req.user.role, 'users', 'update'),
        users_delete: hasPermission(req.user.role, 'users', 'delete'),
        
        // 🔧 MAINTENANCE
        maintenance_read: hasPermission(req.user.role, 'maintenance', 'read'),
        maintenance_create: hasPermission(req.user.role, 'maintenance', 'create'),
        maintenance_update: hasPermission(req.user.role, 'maintenance', 'update'),
        maintenance_delete: hasPermission(req.user.role, 'maintenance', 'delete'),
        
        // 💰 PRICING with amount limits
        pricing_under_limit: hasPermission(req.user.role, 'pricing', 'update', {
          userId: req.user.id,
          companyId: req.user.companyId,
          amount: 3000 // pod limitom pre sales_rep
        }),
        pricing_over_limit: hasPermission(req.user.role, 'pricing', 'update', {
          userId: req.user.id, 
          companyId: req.user.companyId,
          amount: 7000 // nad limitom pre sales_rep
        }),
        
        // 🏢 COMPANY-ONLY tests
        company_vehicle_access: hasPermission(req.user.role, 'vehicles', 'read', {
          userId: req.user.id,
          companyId: req.user.companyId,
          resourceCompanyId: req.user.companyId // same company
        }),
        other_company_vehicle_access: hasPermission(req.user.role, 'vehicles', 'read', {
          userId: req.user.id,
          companyId: req.user.companyId,
          resourceCompanyId: 'different-company-id' // different company
        }),
        
        // 🔨 MECHANIC-ONLY tests  
        own_vehicle_access: hasPermission(req.user.role, 'vehicles', 'update', {
          userId: req.user.id,
          companyId: req.user.companyId,
          resourceOwnerId: req.user.id // own vehicle
        }),
        other_mechanic_vehicle_access: hasPermission(req.user.role, 'vehicles', 'update', {
          userId: req.user.id,
          companyId: req.user.companyId,
          resourceOwnerId: 'different-mechanic-id' // different mechanic
        })
      }
    };

    res.json({
      success: true,
      data: testResults,
      message: `Permission test pre role: ${req.user.role}`
    });

  } catch (error) {
    console.error('❌ Permission test error:', error);
    res.status(500).json({
      success: false,
      error: 'Chyba pri testovaní permissions'
    });
  }
});

// 🔍 DEBUG ENDPOINT - Company Owner Data
router.get('/debug-company-owner', authenticateToken, async (req: Request, res: Response<ApiResponse>) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: 'Používateľ nie je prihlásený'
      });
    }

    const vehicles = await postgresDatabase.getVehicles();
    const companies = await postgresDatabase.getCompanies();
    const allUsers = await postgresDatabase.getUsers();
    
    const user = req.user!; // Non-null assertion since we checked above
    
    // Find Lubica user for debugging
    const lubicaUser = allUsers.find(u => u.username === 'Lubica');
    
    const debugInfo = {
      currentUser: {
        id: user.id,
        username: user.username,
        role: user.role,
        companyId: user.companyId,
        isActive: user.isActive
      },
      lubicaUserDebug: lubicaUser ? {
        id: lubicaUser.id,
        username: lubicaUser.username,
        role: lubicaUser.role,
        companyId: lubicaUser.companyId,
        isActive: lubicaUser.isActive,
        hasCompany: !!companies.find(c => c.id === lubicaUser.companyId)
      } : 'User Lubica not found',
      userCompany: companies.find(c => c.id === user.companyId),
      allVehicles: vehicles.map(v => ({
        id: v.id,
        brand: v.brand,
        model: v.model,
        ownerCompanyId: v.ownerCompanyId
      })),
      userCompanyVehicles: vehicles.filter(v => v.ownerCompanyId === user.companyId),
      allCompanies: companies.map(c => ({ id: c.id, name: c.name })),
      allUsers: allUsers.map(u => ({
        id: u.id,
        username: u.username,
        role: u.role,
        companyId: u.companyId,
        isActive: u.isActive
      }))
    };

    res.json({
      success: true,
      data: debugInfo,
      message: `Debug info pre: ${req.user.username} (${req.user.role})`
    });

  } catch (error) {
    console.error('❌ Debug company owner error:', error);
    res.status(500).json({
      success: false,
      error: 'Chyba pri debug info'
    });
  }
});

// 🏥 HEALTH CHECK ENDPOINT - No auth required
router.get('/health', async (req: Request, res: Response<ApiResponse>) => {
  try {
    res.json({
      success: true,
      message: 'Backend is running',
      data: {
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        environment: process.env.NODE_ENV || 'development'
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Health check failed'
    });
  }
});

// 🔍 DEBUG PERMISSION TEST - For testing specific permissions
router.post('/debug-permission', authenticateToken, async (req: Request, res: Response<ApiResponse>) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: 'Používateľ nie je prihlásený'
      });
    }

    const { resource, action } = req.body;
    
    if (!resource || !action) {
      return res.status(400).json({
        success: false,
        error: 'resource a action sú povinné'
      });
    }

    const { hasPermission } = await import('../middleware/permissions');
    
    const permissionResult = hasPermission(
      req.user.role,
      resource,
      action,
      {
        userId: req.user.id,
        companyId: req.user.companyId
      }
    );

    res.json({
      success: true,
      data: {
        user: {
          id: req.user.id,
          username: req.user.username,
          role: req.user.role,
          companyId: req.user.companyId
        },
        request: { resource, action },
        result: permissionResult
      },
      message: `Permission check pre: ${resource}/${action}`
    });

  } catch (error) {
    console.error('❌ Debug permission error:', error);
    res.status(500).json({
      success: false,
      error: 'Chyba pri debug permission'
    });
  }
});

// 🔧 ADMIN UTILITY - Automatické priradenie vozidiel k firmám
router.post('/auto-assign-vehicles', 
  authenticateToken, 
  requireRole(['admin']),
  async (req: Request, res: Response<ApiResponse>) => {
    try {
      console.log('🚗 Spúšťam automatické priradenie vozidiel k firmám...');
      
      // 1. Načítaj všetky vozidlá
      const vehicles = await postgresDatabase.getVehicles();
      console.log(`📊 Nájdených ${vehicles.length} vozidiel`);
      
      // 2. Načítaj všetky existujúce firmy
      const companies = await postgresDatabase.getCompanies();
      const existingCompanies = new Map();
      companies.forEach(company => {
        existingCompanies.set(company.name.toLowerCase(), company.id);
      });
      
      console.log(`🏢 Existujúce firmy: ${companies.map(c => c.name).join(', ')}`);
      
      let assignedCount = 0;
      let createdCompanies = 0;
      let skippedCount = 0;
      const results = [];
      const errors = [];
      
      // 3. Pre každé vozidlo
      for (const vehicle of vehicles) {
        try {
          if (!vehicle.company) {
            skippedCount++;
            continue; // Preskočiť ak nemá company
          }
          
          if (vehicle.ownerCompanyId) {
            results.push(`⏭️ ${vehicle.brand} ${vehicle.model} (${vehicle.licensePlate}) už má firmu`);
            skippedCount++;
            continue; // Preskočiť ak už má priradené ownerCompanyId
          }
          
          const companyName = vehicle.company.trim();
          const companyNameLower = companyName.toLowerCase();
          
          let companyId = existingCompanies.get(companyNameLower);
          
          // 4. Ak firma neexistuje, vytvor ju
          if (!companyId) {
            console.log(`🆕 Vytváram novú firmu: ${companyName}`);
            try {
              const newCompany = await postgresDatabase.createCompany({
                name: companyName
              });
              companyId = newCompany.id;
              existingCompanies.set(companyNameLower, companyId);
              createdCompanies++;
            } catch (createError) {
              console.error(`❌ Chyba pri vytváraní firmy ${companyName}:`, createError);
              errors.push(`Nemôžem vytvoriť firmu ${companyName}: ${createError instanceof Error ? createError.message : String(createError)}`);
              continue;
            }
          }
          
          // 5. Priradí vozidlo k firme pomocou existujúcej metódy
          try {
            await postgresDatabase.assignVehiclesToCompany([vehicle.id], companyId);
            const result = `✅ ${vehicle.brand} ${vehicle.model} (${vehicle.licensePlate}) → ${companyName}`;
            console.log(result);
            results.push(result);
            assignedCount++;
          } catch (assignError) {
            console.error(`❌ Chyba pri priradzovaní vozidla ${vehicle.id}:`, assignError);
            errors.push(`Nemôžem priradiť ${vehicle.brand} ${vehicle.model}: ${assignError instanceof Error ? assignError.message : String(assignError)}`);
          }
          
        } catch (vehicleError) {
          console.error(`❌ Chyba pri spracovaní vozidla ${vehicle.id}:`, vehicleError);
          errors.push(`Chyba pri spracovaní ${vehicle.brand} ${vehicle.model}: ${vehicleError instanceof Error ? vehicleError.message : String(vehicleError)}`);
        }
      }
      
      res.json({
        success: true,
        message: `Automatické priradenie dokončené`,
        data: {
          createdCompanies,
          assignedVehicles: assignedCount,
          skippedVehicles: skippedCount,
          results,
          errors: errors.length > 0 ? errors : undefined
        }
      });

    } catch (error) {
      console.error('❌ Auto-assign vehicles critical error:', error);
      res.status(500).json({
        success: false,
        error: `Kritická chyba pri automatickom priradzovaní: ${error instanceof Error ? error.message : String(error)}`
      });
    }
  }
);

export default router; 