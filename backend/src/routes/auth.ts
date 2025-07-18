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

// POST /api/auth/login - Prihlásenie
router.post('/login', async (req: Request, res: Response<AuthResponse>) => {
  try {
    const { username, password }: LoginCredentials = req.body;

    if (!username || !password) {
      return res.status(400).json({
        success: false,
        error: 'Používateľské meno a heslo sú povinné'
      });
    }

    // Nájdi používateľa
    console.log('🔍 Hľadám používateľa:', username);
    const user = await postgresDatabase.getUserByUsername(username);
    console.log('👤 Používateľ nájdený:', !!user, user ? `(id: ${user.id}, role: ${user.role})` : '');
    
    if (!user) {
      console.log('❌ Používateľ neexistuje');
      return res.status(401).json({
        success: false,
        error: 'Nesprávne prihlasovacie údaje'
      });
    }

    // Overenie hesla pomocou bcrypt
    console.log('🔑 Overujem heslo pre používateľa:', user.username);
    const isPasswordValid = await bcrypt.compare(password, user.password);
    console.log('🔑 Heslo platné:', isPasswordValid);
    
    if (!isPasswordValid) {
      console.log('❌ Nesprávne heslo');
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
    console.error('Login error:', error);
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

export default router; 