import { Router, Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { postgresDatabase } from '../models/postgres-database';
import { LoginCredentials, AuthResponse, User, ApiResponse } from '../types';
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
    console.log('🔐 LOGIN START - Body:', JSON.stringify(req.body));
    const { username, password }: LoginCredentials = req.body;

    if (!username || !password) {
      console.log('❌ LOGIN - Missing credentials');
      return res.status(400).json({
        success: false,
        error: 'Používateľské meno a heslo sú povinné'
      });
    }

    // Nájdi používateľa
    console.log('🔍 LOGIN - Hľadám používateľa:', username);
    const user = await postgresDatabase.getUserByUsername(username);
    console.log('👤 LOGIN - Používateľ nájdený:', !!user);
    console.log('📊 LOGIN - User data:', user ? {
      id: user.id,
      username: user.username, 
      email: user.email,
      role: user.role,
      hasPassword: !!user.password,
      passwordLength: user.password?.length,
      passwordPrefix: user.password?.substring(0, 10) + '...'
    } : 'null');
    
    if (!user) {
      console.log('❌ LOGIN - Používateľ neexistuje');
      return res.status(401).json({
        success: false,
        error: 'Nesprávne prihlasovacie údaje'
      });
    }

    // Overenie hesla pomocou bcrypt
    console.log('🔑 LOGIN - Overujem heslo pre používateľa:', user.username);
    console.log('🔑 LOGIN - Input password:', password);
    console.log('🔑 LOGIN - Stored password hash:', user.password);
    
    const isPasswordValid = await bcrypt.compare(password, user.password);
    console.log('🔑 LOGIN - Heslo platné:', isPasswordValid);
    
    if (!isPasswordValid) {
      console.log('❌ LOGIN - Nesprávne heslo');
      return res.status(401).json({
        success: false,
        error: 'Nesprávne prihlasovacie údaje'
      });
    }

    // Vytvorenie JWT tokenu
    const token = jwt.sign(
      { 
        userId: user.id, 
        username: user.username, 
        role: user.role
      },
      JWT_SECRET,
      { expiresIn: '30d' }
    );

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

  } catch (error) {
    console.error('❌ LOGIN ERROR:', error);
    console.error('❌ LOGIN ERROR STACK:', (error as Error)?.stack);
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
      role: user.role,
      createdAt: user.createdAt
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
    const { username, email, password, role } = req.body;

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

    const createdUser = await postgresDatabase.createUser({
      username,
      email, 
      password,
      role
    });

    res.status(201).json({
      success: true,
      message: 'Používateľ úspešne vytvorený',
      data: {
        id: createdUser.id,
        username: createdUser.username,
        email: createdUser.email,
        role: createdUser.role,
        createdAt: createdUser.createdAt
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
      password: password || existingUser.password,
      role: role || existingUser.role,
      createdAt: existingUser.createdAt
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

// Debug database endpoint
router.get('/debug-db', async (req: Request, res: Response) => {
  try {
    console.log('🔍 Starting database debug...');
    
    // Check admin user from both tables
    const adminUser = await postgresDatabase.getUserByUsername('admin');
    console.log('🔑 Admin user from getUserByUsername:', adminUser);
    
    // Try to get all users
    const allUsers = await postgresDatabase.getUsers();
    console.log('👥 All users:', allUsers);
    
    res.json({
      success: true,
      admin_exists: !!adminUser,
      admin_user: adminUser,
      total_users: allUsers.length,
      all_users: allUsers
    });
    
  } catch (error) {
    console.error('❌ Database debug error:', error);
    res.status(500).json({
      success: false,
      error: 'Database debug failed',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

export default router; 