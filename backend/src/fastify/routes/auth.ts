import type { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { postgresDatabase } from '../../models/postgres-database';
import { authenticateFastify } from '../decorators/auth';
import { requireRoleFastify } from '../decorators/auth';
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

export default async function authRoutes(fastify: FastifyInstance) {
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

      return {
        success: true,
        token,
        user: userWithoutPassword
      };
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
    return {
      success: true,
      message: 'Logged out successfully'
    };
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

      return {
        success: true,
        data: userWithoutPassword
      };
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

      return {
        success: true,
        message: 'Password changed successfully'
      };
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

      return {
        success: true,
        data: userWithoutPassword
      };
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

      return {
        success: true,
        message: 'Signature template updated successfully'
      };
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

  fastify.log.info('✅ Auth routes registered');
}

