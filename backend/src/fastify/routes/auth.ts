import type { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { v4 as uuidv4 } from 'uuid';
import { postgresDatabase } from '../../models/postgres-database';
import { authenticateFastify, requireRoleFastify } from '../decorators/auth';
import type { User } from '../../types';

const JWT_SECRET = process.env.JWT_SECRET || 'blackrent-secret-key-2024';

interface LoginBody {
  username: string;
  password: string;
}

interface ChangePasswordBody {
  currentPassword: string;
  newPassword: string;
}

interface UpdateProfileBody {
  firstName?: string;
  lastName?: string;
  email?: string;
}

interface SignatureTemplateBody {
  template: string;
}

interface CreateUserBody {
  username: string;
  email: string;
  password: string;
  role: string;
  firstName?: string;
  lastName?: string;
  platformId?: string;
  companyId?: string;
  isActive?: boolean;
}

export default async function authRoutes(fastify: FastifyInstance) {
  // ==================== ADMIN/SETUP ENDPOINTS ====================
  
  // POST /api/auth/create-admin - Create admin user
  fastify.post('/api/auth/create-admin', async (request, reply) => {
    try {
      fastify.log.info('🔧 Creating admin user...');
      
      // Check if admin exists
      const existingAdmin = await postgresDatabase.getUserByUsername('admin');
      if (existingAdmin) {
        return reply.status(400).send({
          success: false,
          error: 'Admin user already exists'
        });
      }

      // Create hashed password
      const hashedPassword = await bcrypt.hash('admin123', 12);
      
      // Create admin user directly via database
      const client = await (postgresDatabase as any).dbPool.connect();
      try {
        await client.query(
          'INSERT INTO users (id, username, email, password_hash, role) VALUES ($1, $2, $3, $4, $5)',
          [uuidv4(), 'admin', 'admin@blackrent.sk', hashedPassword, 'admin']
        );
        
        fastify.log.info('✅ Admin user created successfully');
        
        return reply.send({
          success: true,
          message: 'Admin user created successfully (username: admin, password: admin123)'
        });
      } finally {
        client.release();
      }
    } catch (error) {
      fastify.log.error(error, 'Error creating admin user');
      return reply.status(500).send({
        success: false,
        error: 'Error creating admin user'
      });
    }
  });

  // GET /api/auth/create-admin - GET version for browser testing
  fastify.get('/api/auth/create-admin', async (request, reply) => {
    try {
      fastify.log.info('🔧 GET request - Creating admin user...');
      
      // Check if admin exists
      const existingAdmin = await postgresDatabase.getUserByUsername('admin');
      if (existingAdmin) {
        return reply.status(400).send({
          success: false,
          error: 'Admin user already exists. Use /api/auth/reset-admin-get to reset'
        });
      }

      // Create hashed password - Black123 as required
      const hashedPassword = await bcrypt.hash('Black123', 12);
      
      // Create admin user directly via database
      const client = await (postgresDatabase as any).dbPool.connect();
      try {
        await client.query(
          'INSERT INTO users (id, username, email, password_hash, role) VALUES ($1, $2, $3, $4, $5)',
          [uuidv4(), 'admin', 'admin@blackrent.sk', hashedPassword, 'admin']
        );
        
        fastify.log.info('✅ Admin user created successfully with password Black123');
        
        return reply.send({
          success: true,
          message: 'Admin user created successfully (username: admin, password: Black123)',
          data: {
            username: 'admin',
            password: 'Black123',
            loginUrl: 'https://blackrent-app.vercel.app/login'
          }
        });
      } finally {
        client.release();
      }
    } catch (error) {
      fastify.log.error(error, 'Error creating admin user');
      return reply.status(500).send({
        success: false,
        error: error instanceof Error ? `Error creating admin user: ${error.message}` : 'Error creating admin user'
      });
    }
  });

  // GET /api/auth/reset-admin-get - GET version for admin password reset
  fastify.get('/api/auth/reset-admin-get', async (request, reply) => {
    try {
      fastify.log.info('🔧 GET request - Resetting admin user...');
      
      // Delete existing admin user
      const client = await (postgresDatabase as any).dbPool.connect();
      try {
        await client.query('DELETE FROM users WHERE username = $1', ['admin']);
        fastify.log.info('🗑️ Old admin account deleted');
        
        // Create new hashed password - Black123
        const hashedPassword = await bcrypt.hash('Black123', 12);
        
        // Create new admin account
        await client.query(
          'INSERT INTO users (id, username, email, password_hash, role) VALUES ($1, $2, $3, $4, $5)',
          [uuidv4(), 'admin', 'admin@blackrent.sk', hashedPassword, 'admin']
        );
        
        fastify.log.info('✅ Admin account successfully reset with password Black123');
        
        return reply.send({
          success: true,
          message: 'Admin user successfully reset (username: admin, password: Black123)',
          data: {
            username: 'admin',
            password: 'Black123',
            loginUrl: 'https://blackrent-app.vercel.app/login'
          }
        });
      } finally {
        client.release();
      }
    } catch (error) {
      fastify.log.error(error, 'Error resetting admin user');
      return reply.status(500).send({
        success: false,
        error: error instanceof Error ? `Error resetting admin user: ${error.message}` : 'Error resetting admin user'
      });
    }
  });

  // POST /api/auth/reset-admin - Reset admin user for debugging
  fastify.post('/api/auth/reset-admin', async (request, reply) => {
    try {
      fastify.log.info('🔧 POST request - Resetting admin user...');
      
      const client = await (postgresDatabase as any).dbPool.connect();
      try {
        await client.query('DELETE FROM users WHERE username = $1', ['admin']);
        fastify.log.info('🗑️ Old admin account deleted');
        
        const hashedPassword = await bcrypt.hash('admin123', 12);
        
        await client.query(
          'INSERT INTO users (id, username, email, password_hash, role) VALUES ($1, $2, $3, $4, $5)',
          [uuidv4(), 'admin', 'admin@blackrent.sk', hashedPassword, 'admin']
        );
        
        fastify.log.info('✅ Admin account successfully reset');
        
        return reply.send({
          success: true,
          message: 'Admin user successfully reset (username: admin, password: admin123)'
        });
      } finally {
        client.release();
      }
    } catch (error) {
      fastify.log.error(error, 'Error resetting admin user');
      return reply.status(500).send({
        success: false,
        error: 'Error resetting admin user'
      });
    }
  });

  // GET /api/auth/create-super-admin - Create super_admin account with full permissions
  fastify.get('/api/auth/create-super-admin', async (request, reply) => {
    try {
      fastify.log.info('🔧 GET request - Creating super_admin account...');
      
      const client = await (postgresDatabase as any).dbPool.connect();
      try {
        // Check if super_admin exists
        const existingCheck = await client.query('SELECT id FROM users WHERE username = $1', ['superadmin']);
        
        if (existingCheck.rows.length > 0) {
          // If exists, delete and create new
          await client.query('DELETE FROM users WHERE username = $1', ['superadmin']);
          fastify.log.info('🗑️ Old super_admin account deleted');
        }
        
        // Create hashed password - SuperAdmin123
        const hashedPassword = await bcrypt.hash('SuperAdmin123', 12);
        
        // Create super_admin account (WITHOUT platformId - sees everything)
        await client.query(
          `INSERT INTO users 
          (id, username, email, password_hash, role, platform_id, is_active, first_name, last_name) 
          VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
          [
            uuidv4(), 
            'superadmin', 
            'superadmin@blackrent.sk', 
            hashedPassword, 
            'super_admin',
            null, // WITHOUT platformId - access to all platforms
            true,
            'Super',
            'Admin'
          ]
        );
        
        fastify.log.info('✅ Super Admin account created successfully with password SuperAdmin123');
        
        return reply.send({
          success: true,
          message: '🚀 Super Admin account created successfully!',
          data: {
            username: 'superadmin',
            password: 'SuperAdmin123',
            role: 'super_admin',
            permissions: 'ALL - access to all platforms and data',
            loginUrl: process.env.NODE_ENV === 'production' 
              ? 'https://blackrent-app.vercel.app/login'
              : 'http://localhost:3000/login'
          }
        });
      } finally {
        client.release();
      }
    } catch (error) {
      fastify.log.error(error, 'Error creating super_admin account');
      return reply.status(500).send({
        success: false,
        error: error instanceof Error ? `Error creating super_admin account: ${error.message}` : 'Error creating super_admin account'
      });
    }
  });

  // ==================== AUTHENTICATION ENDPOINTS ====================
  
  // POST /api/auth/login - User login
  fastify.post<{
    Body: LoginBody;
  }>('/api/auth/login', async (request, reply) => {
    try {
      const { username, password } = request.body;

      fastify.log.info({ msg: '🔐 Login attempt', username });

      if (!username || !password) {
        return reply.status(400).send({
          success: false,
          error: 'Username and password are required'
        });
      }

      // Get user from database
      const user = await postgresDatabase.getUserByUsername(username);

      if (!user || !user.password) {
        fastify.log.warn({ msg: '❌ Login failed - user not found', username });
        return reply.status(401).send({
          success: false,
          error: 'Invalid credentials'
        });
      }

      // Verify password
      const isValidPassword = await bcrypt.compare(password, user.password);

      if (!isValidPassword) {
        fastify.log.warn({ msg: '❌ Login failed - invalid password', username });
        return reply.status(401).send({
          success: false,
          error: 'Invalid credentials'
        });
      }

      // Generate JWT token
      const token = jwt.sign(
        {
          userId: user.id,
          username: user.username,
          role: user.role,
          platformId: user.platformId,
          email: user.email
        },
        JWT_SECRET,
        { expiresIn: '30d' }
      );

      fastify.log.info({
        msg: '✅ Login successful',
        userId: user.id,
        username: user.username,
        role: user.role
      });

      // Return user data without password
      const { password: _, ...userWithoutPassword } = user;

      return reply.send({
        success: true,
        token,
        user: userWithoutPassword
      });
    } catch (error) {
      fastify.log.error(error, 'Login error');
      return reply.status(500).send({
        success: false,
        error: 'Login failed'
      });
    }
  });

  // POST /api/auth/logout
  fastify.post('/api/auth/logout', {
    preHandler: [authenticateFastify]
  }, async (request, reply) => {
    fastify.log.info({ msg: '👋 User logged out', userId: request.user?.id });
    return reply.send({
      success: true,
      message: 'Logged out successfully'
    });
  });

  // POST /api/auth/verify-token - Verify JWT token
  fastify.post('/api/auth/verify-token', {
    preHandler: [authenticateFastify]
  }, async (request, reply) => {
    // If we reach here, token is valid (authenticateFastify passed)
    return reply.send({
      success: true,
      valid: true,
      user: request.user
    });
  });

  // POST /api/auth/register - User registration
  fastify.post<{ Body: { username: string; email: string; password: string; firstName?: string; lastName?: string } }>('/api/auth/register', async (request, reply) => {
    try {
      const { username, email, password, firstName, lastName } = request.body;
      
      // Validation
      if (!username || !email || !password) {
        return reply.status(400).send({
          success: false,
          error: 'Username, email and password are required'
        });
      }
      
      // Check if user already exists
      const existingUser = await postgresDatabase.getUserByUsername(username);
      if (existingUser) {
        return reply.status(400).send({
          success: false,
          error: 'Username already exists'
        });
      }
      
      // Check if email already exists
      const emailClient = await (postgresDatabase as any).dbPool.connect();
      try {
        const emailCheck = await emailClient.query('SELECT id FROM users WHERE email = $1', [email]);
        if (emailCheck.rows.length > 0) {
          return reply.status(400).send({
            success: false,
            error: 'Email already exists'
          });
        }
      } finally {
        emailClient.release();
      }
      
      // Hash password
      const hashedPassword = await bcrypt.hash(password, 12);
      
      // Create user
      const client = await (postgresDatabase as any).dbPool.connect();
      try {
        const result = await client.query(
          `INSERT INTO users (id, username, email, password_hash, role, first_name, last_name, is_active) 
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING id`,
          [uuidv4(), username, email, hashedPassword, 'user', firstName || null, lastName || null, true]
        );
        
        const userId = result.rows[0].id;
        
        fastify.log.info({ msg: '✅ User registered', username, userId });
        
        return reply.status(201).send({
          success: true,
          message: 'User registered successfully',
          data: { userId, username, email }
        });
      } finally {
        client.release();
      }
    } catch (error) {
      fastify.log.error(error, 'Registration error');
      return reply.status(500).send({
        success: false,
        error: 'Registration failed'
      });
    }
  });

  // POST /api/auth/refresh - Refresh JWT token
  fastify.post<{ Body: { refreshToken?: string } }>('/api/auth/refresh', async (request, reply) => {
    try {
      const refreshToken = request.body.refreshToken || request.headers.authorization?.replace('Bearer ', '');
      
      if (!refreshToken) {
        return reply.status(401).send({
          success: false,
          error: 'Refresh token required'
        });
      }
      
      // Verify refresh token
      const decoded = jwt.verify(refreshToken, JWT_SECRET) as { userId: string; username: string };
      
      // Get user from database
      const user = await postgresDatabase.getUserById(decoded.userId);
      
      if (!user || !user.isActive) {
        return reply.status(401).send({
          success: false,
          error: 'Invalid or inactive user'
        });
      }
      
      // Generate new access token
      const newToken = jwt.sign(
        { userId: user.id, username: user.username, role: user.role },
        JWT_SECRET,
        { expiresIn: '24h' }
      );
      
      // Generate new refresh token
      const newRefreshToken = jwt.sign(
        { userId: user.id, username: user.username },
        JWT_SECRET,
        { expiresIn: '7d' }
      );
      
      fastify.log.info({ msg: '🔄 Token refreshed', userId: user.id });
      
      return reply.send({
        success: true,
        token: newToken,
        refreshToken: newRefreshToken,
        user: {
          id: user.id,
          username: user.username,
          email: user.email,
          role: user.role
        }
      });
    } catch (error) {
      fastify.log.error(error, 'Token refresh error');
      return reply.status(401).send({
        success: false,
        error: 'Invalid refresh token'
      });
    }
  });

  // GET /api/auth/verify - Verify JWT token
  fastify.get('/api/auth/verify', {
    preHandler: [authenticateFastify]
  }, async (request, reply) => {
    try {
      const user = await postgresDatabase.getUserById(request.user!.id);
      
      if (!user || !user.isActive) {
        return reply.status(401).send({
          success: false,
          error: 'Invalid or inactive user'
        });
      }
      
      return reply.send({
        success: true,
        valid: true,
        user: {
          id: user.id,
          username: user.username,
          email: user.email,
          role: user.role,
          platformId: user.platformId,
          companyId: user.companyId
        }
      });
    } catch (error) {
      fastify.log.error(error, 'Token verification error');
      return reply.status(401).send({
        success: false,
        valid: false,
        error: 'Token verification failed'
      });
    }
  });

  // POST /api/auth/forgot-password - Password reset request
  fastify.post<{ Body: { email: string } }>('/api/auth/forgot-password', async (request, reply) => {
    try {
      const { email } = request.body;
      
      if (!email) {
        return reply.status(400).send({
          success: false,
          error: 'Email is required'
        });
      }
      
      // Check if user exists
      const client = await (postgresDatabase as any).dbPool.connect();
      let user = null;
      try {
        const result = await client.query(
          'SELECT id, username, email, role FROM users WHERE email = $1',
          [email]
        );
        user = result.rows[0] || null;
      } finally {
        client.release();
      }
      
      if (!user) {
        // Don't reveal if user exists or not (security best practice)
        return reply.send({
          success: true,
          message: 'If the email exists, a password reset link has been sent'
        });
      }
      
      // Generate reset token
      const resetToken = jwt.sign(
        { userId: user.id, email: user.email, purpose: 'password-reset' },
        JWT_SECRET,
        { expiresIn: '1h' }
      );
      
      // In production, you would:
      // 1. Store resetToken in database with expiry
      // 2. Send email with reset link containing the token
      // 3. User clicks link, submits new password with token
      
      fastify.log.info({ 
        msg: '🔑 Password reset requested', 
        email,
        resetToken: resetToken.substring(0, 20) + '...' 
      });
      
      // For now, return token (in production, only send via email)
      return reply.send({
        success: true,
        message: 'Password reset link has been sent to your email',
        // REMOVE IN PRODUCTION:
        resetToken: process.env.NODE_ENV === 'development' ? resetToken : undefined,
        resetUrl: process.env.NODE_ENV === 'development' 
          ? `${process.env.FRONTEND_URL}/reset-password?token=${resetToken}`
          : undefined
      });
    } catch (error) {
      fastify.log.error(error, 'Forgot password error');
      return reply.status(500).send({
        success: false,
        error: 'Password reset request failed'
      });
    }
  });

  // GET /api/auth/me - Get current user
  fastify.get('/api/auth/me', {
    preHandler: [authenticateFastify]
  }, async (request, reply) => {
    try {
      const user = await postgresDatabase.getUserById(request.user!.id);

      if (!user) {
        return reply.status(404).send({
          success: false,
          error: 'User not found'
        });
      }

      const { password: _, ...userWithoutPassword } = user;

      return reply.send({
        success: true,
        data: userWithoutPassword
      });
    } catch (error) {
      fastify.log.error(error, 'Get current user error');
      return reply.status(500).send({
        success: false,
        error: 'Failed to get user data'
      });
    }
  });

  // POST /api/auth/change-password
  fastify.post<{
    Body: ChangePasswordBody;
  }>('/api/auth/change-password', {
    preHandler: [authenticateFastify]
  }, async (request, reply) => {
    try {
      const { currentPassword, newPassword } = request.body;
      const userId = request.user!.id;

      if (!currentPassword || !newPassword) {
        return reply.status(400).send({
          success: false,
          error: 'Current and new password are required'
        });
      }

      if (newPassword.length < 6) {
        return reply.status(400).send({
          success: false,
          error: 'New password must be at least 6 characters'
        });
      }

      // Get user from database
      const user = await postgresDatabase.getUserById(userId);

      if (!user || !user.password) {
        return reply.status(404).send({
          success: false,
          error: 'User not found'
        });
      }

      // Verify current password
      const isValidPassword = await bcrypt.compare(currentPassword, user.password);

      if (!isValidPassword) {
        return reply.status(401).send({
          success: false,
          error: 'Current password is incorrect'
        });
      }

      // Hash new password and update user
      user.password = newPassword; // updateUser will hash it
      await postgresDatabase.updateUser(user);

      fastify.log.info({ msg: '🔐 Password changed', userId });

      return reply.send({
        success: true,
        message: 'Password changed successfully'
      });
    } catch (error) {
      fastify.log.error(error, 'Change password error');
      return reply.status(500).send({
        success: false,
        error: 'Failed to change password'
      });
    }
  });

  // PUT /api/auth/profile - Update user profile
  fastify.put<{
    Body: UpdateProfileBody;
  }>('/api/auth/profile', {
    preHandler: [authenticateFastify]
  }, async (request, reply) => {
    try {
      const userId = request.user!.id;
      const updates = request.body;

      if (Object.keys(updates).length === 0) {
        return reply.status(400).send({
          success: false,
          error: 'No updates provided'
        });
      }

      // Get current user
      const user = await postgresDatabase.getUserById(userId);

      if (!user) {
        return reply.status(404).send({
          success: false,
          error: 'User not found'
        });
      }

      // Update user fields
      if (updates.firstName) user.firstName = updates.firstName;
      if (updates.lastName) user.lastName = updates.lastName;
      if (updates.email) user.email = updates.email;

      // Save updated user
      await postgresDatabase.updateUser(user);

      // Get updated user
      const updatedUser = await postgresDatabase.getUserById(userId);

      if (!updatedUser) {
        return reply.status(404).send({
          success: false,
          error: 'User not found after update'
        });
      }

      const { password: _, ...userWithoutPassword } = updatedUser;

      fastify.log.info({ msg: '✅ Profile updated', userId });

      return reply.send({
        success: true,
        data: userWithoutPassword
      });
    } catch (error) {
      fastify.log.error(error, 'Update profile error');
      return reply.status(500).send({
        success: false,
        error: 'Failed to update profile'
        });
    }
  });

  // PUT /api/auth/signature-template - Update signature template
  fastify.put<{
    Body: SignatureTemplateBody;
  }>('/api/auth/signature-template', {
    preHandler: [authenticateFastify]
  }, async (request, reply) => {
    try {
      const userId = request.user!.id;
      const { template } = request.body;

      if (!template) {
        return reply.status(400).send({
          success: false,
          error: 'Signature template is required'
        });
      }

      // Get current user
      const user = await postgresDatabase.getUserById(userId);

      if (!user) {
        return reply.status(404).send({
          success: false,
          error: 'User not found'
        });
      }

      // Update signature template
      user.signatureTemplate = template;
      await postgresDatabase.updateUser(user);

      fastify.log.info({ msg: '✅ Signature template updated', userId });

      return reply.send({
        success: true,
        message: 'Signature template updated successfully'
      });
    } catch (error) {
      fastify.log.error(error, 'Update signature template error');
      return reply.status(500).send({
        success: false,
        error: 'Failed to update signature template'
      });
    }
  });

  // GET /api/auth/health - Health check
  fastify.get('/api/auth/health', async () => ({
    success: true,
    message: 'Auth service is healthy',
    timestamp: new Date().toISOString()
  }));

  // ==================== USERS MANAGEMENT ====================
  
  // GET /api/auth/users - Get all users (admin, super_admin, company_admin only)
  fastify.get('/api/auth/users', {
    preHandler: [authenticateFastify, requireRoleFastify(['admin', 'super_admin', 'company_admin'])]
  }, async (request, reply) => {
    try {
      const client = await (postgresDatabase as any).dbPool.connect();
      try {
        const result = await client.query(`
          SELECT 
            id, username, email, role, platform_id, company_id, 
            first_name, last_name, is_active, created_at
          FROM users
          ORDER BY created_at DESC
        `);
        
        const users = result.rows.map((row: any) => ({
          id: row.id,
          username: row.username,
          email: row.email,
          role: row.role,
          platformId: row.platform_id,
          companyId: row.company_id,
          firstName: row.first_name,
          lastName: row.last_name,
          isActive: row.is_active,
          createdAt: row.created_at
        }));
        
        return reply.send({
          success: true,
          data: users
        });
      } finally {
        client.release();
      }
    } catch (error) {
      fastify.log.error(error, 'Get users error');
      return reply.status(500).send({
        success: false,
        error: 'Failed to get users'
      });
    }
  });

  // POST /api/auth/users - Create new user (admin, super_admin, company_admin only)
  fastify.post<{
    Body: CreateUserBody;
  }>('/api/auth/users', {
    preHandler: [authenticateFastify, requireRoleFastify(['admin', 'super_admin', 'company_admin'])]
  }, async (request, reply) => {
    try {
      const { username, email, password, role, firstName, lastName, platformId, companyId, isActive } = request.body;
      
      if (!username || !password || !role) {
        return reply.status(400).send({
          success: false,
          error: 'Username, password and role are required'
        });
      }
      
      // Check if user exists
      const existingUser = await postgresDatabase.getUserByUsername(username);
      if (existingUser) {
        return reply.status(400).send({
          success: false,
          error: 'User with this username already exists'
        });
      }
      
      // Hash password
      const hashedPassword = await bcrypt.hash(password, 12);
      
      // Create user
      const client = await (postgresDatabase as any).dbPool.connect();
      try {
        const result = await client.query(`
          INSERT INTO users (
            id, username, email, password_hash, role, platform_id, company_id,
            first_name, last_name, is_active
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
          RETURNING id, username, email, role, platform_id, company_id, first_name, last_name, is_active
        `, [
          uuidv4(),
          username,
          email || null,
          hashedPassword,
          role,
          platformId || null,
          companyId || null,
          firstName || null,
          lastName || null,
          isActive !== undefined ? isActive : true
        ]);
        
        const newUser = {
          id: result.rows[0].id,
          username: result.rows[0].username,
          email: result.rows[0].email,
          role: result.rows[0].role,
          platformId: result.rows[0].platform_id,
          companyId: result.rows[0].company_id,
          firstName: result.rows[0].first_name,
          lastName: result.rows[0].last_name,
          isActive: result.rows[0].is_active
        };
        
        fastify.log.info({ msg: '✅ User created', userId: newUser.id, username: newUser.username });
        
        return reply.status(201).send({
          success: true,
          message: 'User created successfully',
          data: newUser
        });
      } finally {
        client.release();
      }
    } catch (error) {
      fastify.log.error(error, 'Create user error');
      return reply.status(500).send({
        success: false,
        error: 'Failed to create user'
      });
    }
  });

  // PUT /api/auth/users/:id - Update user (admin, super_admin, company_admin only)
  fastify.put<{
    Params: { id: string };
    Body: Partial<CreateUserBody>;
  }>('/api/auth/users/:id', {
    preHandler: [authenticateFastify, requireRoleFastify(['admin', 'super_admin', 'company_admin'])]
  }, async (request, reply) => {
    try {
      const { id } = request.params;
      const updates = request.body;
      
      // Get existing user
      const existingUser = await postgresDatabase.getUserById(id);
      if (!existingUser) {
        return reply.status(404).send({
          success: false,
          error: 'User not found'
        });
      }
      
      // Build update query
      const client = await (postgresDatabase as any).dbPool.connect();
      try {
        const updateFields: string[] = [];
        const values: any[] = [];
        let paramIndex = 1;
        
        if (updates.username) {
          updateFields.push(`username = $${paramIndex++}`);
          values.push(updates.username);
        }
        if (updates.email !== undefined) {
          updateFields.push(`email = $${paramIndex++}`);
          values.push(updates.email);
        }
        if (updates.password) {
          const hashedPassword = await bcrypt.hash(updates.password, 12);
          updateFields.push(`password_hash = $${paramIndex++}`);
          values.push(hashedPassword);
        }
        if (updates.role) {
          updateFields.push(`role = $${paramIndex++}`);
          values.push(updates.role);
        }
        if (updates.platformId !== undefined) {
          updateFields.push(`platform_id = $${paramIndex++}`);
          values.push(updates.platformId);
        }
        if (updates.companyId !== undefined) {
          updateFields.push(`company_id = $${paramIndex++}`);
          values.push(updates.companyId);
        }
        if (updates.firstName !== undefined) {
          updateFields.push(`first_name = $${paramIndex++}`);
          values.push(updates.firstName);
        }
        if (updates.lastName !== undefined) {
          updateFields.push(`last_name = $${paramIndex++}`);
          values.push(updates.lastName);
        }
        if (updates.isActive !== undefined) {
          updateFields.push(`is_active = $${paramIndex++}`);
          values.push(updates.isActive);
        }
        
        if (updateFields.length === 0) {
          return reply.status(400).send({
            success: false,
            error: 'No fields to update'
          });
        }
        
        values.push(id);
        const query = `
          UPDATE users 
          SET ${updateFields.join(', ')}, updated_at = CURRENT_TIMESTAMP
          WHERE id = $${paramIndex}
          RETURNING id, username, email, role, platform_id, company_id, first_name, last_name, is_active
        `;
        
        const result = await client.query(query, values);
        
        const updatedUser = {
          id: result.rows[0].id,
          username: result.rows[0].username,
          email: result.rows[0].email,
          role: result.rows[0].role,
          platformId: result.rows[0].platform_id,
          companyId: result.rows[0].company_id,
          firstName: result.rows[0].first_name,
          lastName: result.rows[0].last_name,
          isActive: result.rows[0].is_active
        };
        
        fastify.log.info({ msg: '✅ User updated', userId: updatedUser.id });
        
        return reply.send({
          success: true,
          message: 'User updated successfully',
          data: updatedUser
        });
      } finally {
        client.release();
      }
    } catch (error) {
      fastify.log.error(error, 'Update user error');
      return reply.status(500).send({
        success: false,
        error: 'Failed to update user'
      });
    }
  });

  // DELETE /api/auth/users/:id - Delete user (admin, super_admin, company_admin only)
  fastify.delete<{
    Params: { id: string };
  }>('/api/auth/users/:id', {
    preHandler: [authenticateFastify, requireRoleFastify(['admin', 'super_admin', 'company_admin'])]
  }, async (request, reply) => {
    try {
      const { id } = request.params;
      
      // Don't allow deleting yourself
      if (id === request.user?.id) {
        return reply.status(400).send({
          success: false,
          error: 'Cannot delete your own account'
        });
      }
      
      // Check if user exists
      const existingUser = await postgresDatabase.getUserById(id);
      if (!existingUser) {
        return reply.status(404).send({
          success: false,
          error: 'User not found'
        });
      }
      
      // Delete user
      const client = await (postgresDatabase as any).dbPool.connect();
      try {
        await client.query('DELETE FROM users WHERE id = $1', [id]);
        
        fastify.log.info({ msg: '🗑️ User deleted', userId: id });
        
        return reply.send({
          success: true,
          message: 'User deleted successfully'
        });
      } finally {
        client.release();
      }
    } catch (error) {
      fastify.log.error(error, 'Delete user error');
      return reply.status(500).send({
        success: false,
        error: 'Failed to delete user'
      });
    }
  });

  // GET /api/auth/investors-with-shares - Get investors with shares (for dropdown)
  fastify.get('/api/auth/investors-with-shares', {
    preHandler: [authenticateFastify, requireRoleFastify(['admin', 'super_admin', 'company_admin'])]
  }, async (request, reply) => {
    try {
      const client = await (postgresDatabase as any).dbPool.connect();
      try {
        const result = await client.query(`
          SELECT DISTINCT
            ci.investor_id as id,
            ci.investor_name as name,
            SUM(ci.ownership_percentage) as total_share
          FROM company_investors ci
          GROUP BY ci.investor_id, ci.investor_name
          HAVING SUM(ci.ownership_percentage) > 0
          ORDER BY total_share DESC
        `);
        
        return reply.send({
          success: true,
          data: result.rows
        });
      } finally {
        client.release();
      }
    } catch (error) {
      fastify.log.error(error, 'Get investors with shares error');
      return reply.status(500).send({
        success: false,
        error: 'Failed to get investors'
      });
    }
  });

  // ==================== DEBUG/UTILITY ENDPOINTS ====================
  
  // GET /api/auth/reset-pavlik - Reset password for specific user
  fastify.get('/api/auth/reset-pavlik', async (request, reply) => {
    try {
      fastify.log.info('🔧 Resetting pavlik user password...');
      
      const client = await (postgresDatabase as any).dbPool.connect();
      try {
        const hashedPassword = await bcrypt.hash('pavlik123', 12);
        await client.query(
          'UPDATE users SET password_hash = $1 WHERE username = $2',
          [hashedPassword, 'pavlik']
        );
        
        fastify.log.info('✅ Pavlik password reset successful');
        
        return reply.send({
          success: true,
          message: 'Password reset successful (username: pavlik, password: pavlik123)'
        });
      } finally {
        client.release();
      }
    } catch (error) {
      fastify.log.error(error, 'Error resetting pavlik password');
      return reply.status(500).send({
        success: false,
        error: 'Error resetting password'
      });
    }
  });

  // GET /api/auth/setup-admin - Simple admin setup
  fastify.get('/api/auth/setup-admin', async (request, reply) => {
    try {
      const existingAdmin = await postgresDatabase.getUserByUsername('admin');
      if (existingAdmin) {
        return reply.send({
          success: true,
          message: 'Admin already exists',
          data: { username: 'admin', exists: true }
        });
      }

      const hashedPassword = await bcrypt.hash('admin123', 12);
      const client = await (postgresDatabase as any).dbPool.connect();
      try {
        await client.query(
          'INSERT INTO users (id, username, email, password_hash, role) VALUES ($1, $2, $3, $4, $5)',
          [uuidv4(), 'admin', 'admin@blackrent.sk', hashedPassword, 'admin']
        );
        
        return reply.send({
          success: true,
          message: 'Admin created (username: admin, password: admin123)'
        });
      } finally {
        client.release();
      }
    } catch (error) {
      fastify.log.error(error, 'Setup admin error');
      return reply.status(500).send({
        success: false,
        error: 'Setup admin failed'
      });
    }
  });

  // GET /api/auth/init-admin - Super simple admin init
  fastify.get('/api/auth/init-admin', async (request, reply) => {
    try {
      const client = await (postgresDatabase as any).dbPool.connect();
      try {
        await client.query('DELETE FROM users WHERE username = $1', ['admin']);
        const hashedPassword = await bcrypt.hash('admin123', 12);
        await client.query(
          'INSERT INTO users (id, username, email, password_hash, role) VALUES ($1, $2, $3, $4, $5)',
          [uuidv4(), 'admin', 'admin@blackrent.sk', hashedPassword, 'admin']
        );
        
        return reply.send({
          success: true,
          message: 'Admin initialized (username: admin, password: admin123)'
        });
      } finally {
        client.release();
      }
    } catch (error) {
      fastify.log.error(error, 'Init admin error');
      return reply.status(500).send({
        success: false,
        error: 'Init admin failed'
      });
    }
  });

  // POST /api/auth/init-database - Emergency database initialization
  fastify.post('/api/auth/init-database', async (request, reply) => {
    try {
      fastify.log.info('🔧 POST - Emergency database initialization...');
      
      const client = await (postgresDatabase as any).dbPool.connect();
      try {
        // Create basic tables if they don't exist
        await client.query(`
          CREATE TABLE IF NOT EXISTS users (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            username VARCHAR(100) UNIQUE NOT NULL,
            email VARCHAR(100),
            password_hash VARCHAR(255) NOT NULL,
            role VARCHAR(50) NOT NULL,
            platform_id UUID,
            company_id UUID,
            first_name VARCHAR(100),
            last_name VARCHAR(100),
            is_active BOOLEAN DEFAULT true,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
          )
        `);
        
        fastify.log.info('✅ Database initialized');
        
        return reply.send({
          success: true,
          message: 'Database tables created successfully'
        });
      } finally {
        client.release();
      }
    } catch (error) {
      fastify.log.error(error, 'Database initialization error');
      return reply.status(500).send({
        success: false,
        error: error instanceof Error ? error.message : 'Database initialization failed'
      });
    }
  });

  // GET /api/auth/debug-db - Simple database debug
  fastify.get('/api/auth/debug-db', async (request, reply) => {
    try {
      const client = await (postgresDatabase as any).dbPool.connect();
      try {
        const userCount = await client.query('SELECT COUNT(*) FROM users');
        const usersResult = await client.query('SELECT id, username, role FROM users LIMIT 5');
        
        return reply.send({
          success: true,
          data: {
            totalUsers: parseInt(userCount.rows[0].count),
            sampleUsers: usersResult.rows
          }
        });
      } finally {
        client.release();
      }
    } catch (error) {
      fastify.log.error(error, 'Debug DB error');
      return reply.status(500).send({
        success: false,
        error: error instanceof Error ? error.message : 'Debug failed'
      });
    }
  });

  // GET /api/auth/debug-token - JWT token diagnostics
  fastify.get('/api/auth/debug-token', async (request, reply) => {
    try {
      const token = request.headers.authorization?.replace('Bearer ', '');
      
      if (!token) {
        return reply.send({
          success: true,
          data: { hasToken: false, message: 'No token provided' }
        });
      }

      try {
        const decoded = jwt.verify(token, JWT_SECRET) as any;
        return reply.send({
          success: true,
          data: {
            hasToken: true,
            valid: true,
            decoded: {
              userId: decoded.userId,
              username: decoded.username,
              role: decoded.role,
              exp: new Date(decoded.exp * 1000).toISOString(),
              iat: new Date(decoded.iat * 1000).toISOString()
            }
          }
        });
      } catch (err) {
        return reply.send({
          success: true,
          data: {
            hasToken: true,
            valid: false,
            error: err instanceof Error ? err.message : 'Invalid token'
          }
        });
      }
    } catch (error) {
      fastify.log.error(error, 'Debug token error');
      return reply.status(500).send({
        success: false,
        error: 'Debug token failed'
      });
    }
  });

  // GET /api/auth/debug-users-table - Debug users table
  fastify.get('/api/auth/debug-users-table', async (request, reply) => {
    try {
      const client = await (postgresDatabase as any).dbPool.connect();
      try {
        const result = await client.query(`
          SELECT column_name, data_type, is_nullable
          FROM information_schema.columns
          WHERE table_name = 'users'
          ORDER BY ordinal_position
        `);
        
        const userCount = await client.query('SELECT COUNT(*) FROM users');
        const sampleUsers = await client.query('SELECT id, username, role, platform_id FROM users LIMIT 3');
        
        return reply.send({
          success: true,
          data: {
            columns: result.rows,
            totalUsers: parseInt(userCount.rows[0].count),
            sampleUsers: sampleUsers.rows
          }
        });
      } finally {
        client.release();
      }
    } catch (error) {
      fastify.log.error(error, 'Debug users table error');
      return reply.status(500).send({
        success: false,
        error: error instanceof Error ? error.message : 'Debug failed'
      });
    }
  });

  // GET /api/auth/test-permissions - Test permissions system
  fastify.get('/api/auth/test-permissions', {
    preHandler: [authenticateFastify]
  }, async (request, reply) => {
    try {
      return reply.send({
        success: true,
        data: {
          user: {
            id: request.user?.id,
            username: request.user?.username,
            role: request.user?.role,
            platformId: request.user?.platformId
          },
          message: 'Permissions test successful'
        }
      });
    } catch (error) {
      fastify.log.error(error, 'Test permissions error');
      return reply.status(500).send({
        success: false,
        error: 'Permission test failed'
      });
    }
  });

  // GET /api/auth/debug-company-owner - Debug company owner data
  fastify.get('/api/auth/debug-company-owner', {
    preHandler: [authenticateFastify]
  }, async (request, reply) => {
    try {
      const client = await (postgresDatabase as any).dbPool.connect();
      try {
        const companies = await client.query('SELECT id, name FROM companies LIMIT 5');
        const vehicles = await client.query('SELECT id, brand, model, company_id as "ownerCompanyId" FROM vehicles LIMIT 5');
        
        return reply.send({
          success: true,
          data: {
            user: {
              id: request.user?.id,
              username: request.user?.username,
              platformId: request.user?.platformId
            },
            sampleCompanies: companies.rows,
            sampleVehicles: vehicles.rows
          }
        });
      } finally {
        client.release();
      }
    } catch (error) {
      fastify.log.error(error, 'Debug company owner error');
      return reply.status(500).send({
        success: false,
        error: 'Debug failed'
      });
    }
  });

  // POST /api/auth/debug-permission - Debug specific permission
  fastify.post<{
    Body: { resource: string; action: string };
  }>('/api/auth/debug-permission', {
    preHandler: [authenticateFastify]
  }, async (request, reply) => {
    try {
      const { resource, action } = request.body;
      
      return reply.send({
        success: true,
        data: {
          user: {
            id: request.user?.id,
            username: request.user?.username,
            role: request.user?.role
          },
          requested: { resource, action },
          message: 'Permission debug data retrieved'
        }
      });
    } catch (error) {
      fastify.log.error(error, 'Debug permission error');
      return reply.status(500).send({
        success: false,
        error: 'Permission debug failed'
      });
    }
  });

  // POST /api/auth/auto-assign-vehicles - Auto assign vehicles to companies
  fastify.post<{
    Body: { dryRun?: boolean };
  }>('/api/auth/auto-assign-vehicles', {
    preHandler: [authenticateFastify, requireRoleFastify(['admin', 'super_admin'])]
  }, async (request, reply) => {
    try {
      const { dryRun = false } = request.body;
      
      const client = await (postgresDatabase as any).dbPool.connect();
      try {
        // Get vehicles without ownerCompanyId
        const vehiclesResult = await client.query(`
          SELECT id, brand, model, company, company_id as "ownerCompanyId"
          FROM vehicles
          WHERE company_id IS NULL OR company_id = ''
        `);
        
        const vehicles = vehiclesResult.rows;
        const assigned: any[] = [];
        
        for (const vehicle of vehicles) {
          if (!vehicle.company) continue;
          
          // Find matching company by name
          const companyResult = await client.query(
            'SELECT id FROM companies WHERE name = $1',
            [vehicle.company]
          );
          
          if (companyResult.rows.length > 0) {
            const companyId = companyResult.rows[0].id;
            
            if (!dryRun) {
              await client.query(
                'UPDATE vehicles SET company_id = $1 WHERE id = $2',
                [companyId, vehicle.id]
              );
            }
            
            assigned.push({
              vehicleId: vehicle.id,
              vehicle: `${vehicle.brand} ${vehicle.model}`,
              companyId,
              companyName: vehicle.company
            });
          }
        }
        
        fastify.log.info({ msg: '🔧 Auto-assign vehicles', count: assigned.length, dryRun });
        
        return reply.send({
          success: true,
          message: dryRun ? 'Dry run complete' : `Assigned ${assigned.length} vehicles`,
          data: {
            total: vehicles.length,
            assigned: assigned.length,
            dryRun,
            assignments: assigned
          }
        });
      } finally {
        client.release();
      }
    } catch (error) {
      fastify.log.error(error, 'Auto-assign vehicles error');
      return reply.status(500).send({
        success: false,
        error: 'Auto-assign failed'
      });
    }
  });

  // GET /api/auth/debug-vincursky - Debug specific user account
  fastify.get('/api/auth/debug-vincursky', {
    preHandler: [authenticateFastify, requireRoleFastify(['admin', 'super_admin'])]
  }, async (request, reply) => {
    try {
      const client = await (postgresDatabase as any).dbPool.connect();
      try {
        const userResult = await client.query(
          'SELECT id, username, role, platform_id, company_id FROM users WHERE username = $1',
          ['vincursky']
        );
        
        if (userResult.rows.length === 0) {
          return reply.send({
            success: true,
            data: { exists: false, message: 'User vincursky not found' }
          });
        }
        
        const user = userResult.rows[0];
        
        return reply.send({
          success: true,
          data: {
            exists: true,
            user: {
              id: user.id,
              username: user.username,
              role: user.role,
              platformId: user.platform_id,
              companyId: user.company_id
            }
          }
        });
      } finally {
        client.release();
      }
    } catch (error) {
      fastify.log.error(error, 'Debug vincursky error');
      return reply.status(500).send({
        success: false,
        error: 'Debug failed'
      });
    }
  });

  // POST /api/auth/migrate-vehicle-companies - Fix ownerCompanyId for all vehicles
  fastify.post('/api/auth/migrate-vehicle-companies', {
    preHandler: [authenticateFastify, requireRoleFastify(['admin', 'super_admin'])]
  }, async (request, reply) => {
    try {
      const client = await (postgresDatabase as any).dbPool.connect();
      try {
        const vehiclesResult = await client.query('SELECT id, company FROM vehicles');
        const vehicles = vehiclesResult.rows;
        let updated = 0;
        
        for (const vehicle of vehicles) {
          if (!vehicle.company) continue;
          
          const companyResult = await client.query(
            'SELECT id FROM companies WHERE name = $1',
            [vehicle.company]
          );
          
          if (companyResult.rows.length > 0) {
            await client.query(
              'UPDATE vehicles SET company_id = $1 WHERE id = $2',
              [companyResult.rows[0].id, vehicle.id]
            );
            updated++;
          }
        }
        
        fastify.log.info({ msg: '🔧 Migrate vehicle companies', updated });
        
        return reply.send({
          success: true,
          message: `Updated ${updated} vehicles`,
          data: { total: vehicles.length, updated }
        });
      } finally {
        client.release();
      }
    } catch (error) {
      fastify.log.error(error, 'Migrate vehicle companies error');
      return reply.status(500).send({
        success: false,
        error: 'Migration failed'
      });
    }
  });

  // POST /api/auth/auto-assign-user-companies - Auto assign company access to users
  fastify.post('/api/auth/auto-assign-user-companies', {
    preHandler: [authenticateFastify, requireRoleFastify(['admin', 'super_admin'])]
  }, async (request, reply) => {
    try {
      const client = await (postgresDatabase as any).dbPool.connect();
      try {
        const usersResult = await client.query(`
          SELECT id, username, first_name, last_name, company_id
          FROM users
          WHERE role = 'company_admin' OR role = 'user'
        `);
        
        const users = usersResult.rows;
        const assigned: any[] = [];
        
        for (const user of users) {
          if (user.company_id) {
            // User already has companyId - create company access if not exists
            const existingAccess = await client.query(
              'SELECT id FROM user_company_access WHERE user_id = $1 AND company_id = $2',
              [user.id, user.company_id]
            );
            
            if (existingAccess.rows.length === 0) {
              await client.query(
                'INSERT INTO user_company_access (id, user_id, company_id) VALUES ($1, $2, $3)',
                [uuidv4(), user.id, user.company_id]
              );
              
              assigned.push({
                userId: user.id,
                username: user.username,
                companyId: user.company_id
              });
            }
          }
        }
        
        fastify.log.info({ msg: '🔧 Auto-assign user companies', count: assigned.length });
        
        return reply.send({
          success: true,
          message: `Assigned company access to ${assigned.length} users`,
          data: { total: users.length, assigned: assigned.length, assignments: assigned }
        });
      } finally {
        client.release();
      }
    } catch (error) {
      fastify.log.error(error, 'Auto-assign user companies error');
      return reply.status(500).send({
        success: false,
        error: 'Auto-assign failed'
      });
    }
  });

  fastify.log.info('✅ Auth routes registered');
}

