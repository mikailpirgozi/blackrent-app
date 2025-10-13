import type { FastifyInstance, FastifyRequest } from 'fastify';
import bcrypt from 'bcryptjs';
import { v4 as uuidv4 } from 'uuid';
import { postgresDatabase } from '../../models/postgres-database';
import { authenticateFastify, requireRoleFastify } from '../decorators/auth';
import type { User, UserRole } from '../../types';

interface CreateUserBody {
  username: string;
  email: string;
  password: string;
  role: string;
  firstName?: string;
  lastName?: string;
  companyId?: string;
  platformId?: string;
}

interface UpdateUserParams {
  id: string;
}

export default async function usersRoutes(fastify: FastifyInstance) {
  // GET /api/auth/users - Get all users (admin/super_admin only)
  fastify.get('/api/auth/users', {
    preHandler: [
      authenticateFastify,
      requireRoleFastify(['admin', 'super_admin', 'company_admin'])
    ]
  }, async (request, reply) => {
    try {
      const users = await postgresDatabase.getUsers();
      
      // Remove passwords from response
      const usersWithoutPasswords = users.map(({ password, ...user }) => user);

      return reply.send({
        success: true,
        data: usersWithoutPasswords
      });
    } catch (error) {
      fastify.log.error(error, 'Get users error');
      return reply.status(500).send({
        success: false,
        error: 'Failed to get users'
      });
    }
  });

  // POST /api/auth/users - Create new user (admin/super_admin only)
  fastify.post<{
    Body: CreateUserBody;
  }>('/api/auth/users', {
    preHandler: [
      authenticateFastify,
      requireRoleFastify(['admin', 'super_admin', 'company_admin'])
    ]
  }, async (request, reply) => {
    try {
      const userData = request.body;

      // Validate required fields
      if (!userData.username || !userData.email || !userData.password) {
        return reply.status(400).send({
          success: false,
          error: 'Username, email and password are required'
        });
      }

      // Check if user already exists
      const existingUser = await postgresDatabase.getUserByUsername(userData.username);
      if (existingUser) {
        return reply.status(400).send({
          success: false,
          error: 'Username already exists'
        });
      }

      // Create new user
      const newUser: User = {
        id: uuidv4(),
        username: userData.username,
        email: userData.email,
        password: userData.password, // Will be hashed by createUser
        role: (userData.role || 'platform_employee') as UserRole,
        firstName: userData.firstName,
        lastName: userData.lastName,
        companyId: userData.companyId,
        platformId: userData.platformId,
        isActive: true,
        createdAt: new Date()
      };

      await postgresDatabase.createUser(newUser);

      // Get created user without password
      const createdUser = await postgresDatabase.getUserById(newUser.id);
      if (!createdUser) {
        return reply.status(500).send({
          success: false,
          error: 'Failed to retrieve created user'
        });
      }

      const { password: _, ...userWithoutPassword } = createdUser;

      fastify.log.info({ msg: '✅ User created', userId: newUser.id, username: newUser.username });

      return reply.status(201).send({
        success: true,
        data: userWithoutPassword
      });
    } catch (error) {
      fastify.log.error(error, 'Create user error');
      return reply.status(500).send({
        success: false,
        error: 'Failed to create user'
      });
    }
  });

  // PUT /api/auth/users/:id - Update user (admin/super_admin only)
  fastify.put<{
    Params: UpdateUserParams;
    Body: Partial<User>;
  }>('/api/auth/users/:id', {
    preHandler: [
      authenticateFastify,
      requireRoleFastify(['admin', 'super_admin', 'company_admin'])
    ]
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

      // Apply updates
      const updatedUser = {
        ...existingUser,
        ...updates,
        id // Ensure ID doesn't change
      };

      await postgresDatabase.updateUser(updatedUser);

      // Get updated user
      const user = await postgresDatabase.getUserById(id);
      if (!user) {
        return reply.status(404).send({
          success: false,
          error: 'User not found after update'
        });
      }

      const { password: _, ...userWithoutPassword } = user;

      fastify.log.info({ msg: '✅ User updated', userId: id });

      return reply.send({
        success: true,
        data: userWithoutPassword
      });
    } catch (error) {
      fastify.log.error(error, 'Update user error');
      return reply.status(500).send({
        success: false,
        error: 'Failed to update user'
      });
    }
  });

  // DELETE /api/auth/users/:id - Delete user (admin/super_admin only)
  fastify.delete<{
    Params: UpdateUserParams;
  }>('/api/auth/users/:id', {
    preHandler: [
      authenticateFastify,
      requireRoleFastify(['admin', 'super_admin', 'company_admin'])
    ]
  }, async (request, reply) => {
    try {
      const { id } = request.params;

      // Check if user exists
      const user = await postgresDatabase.getUserById(id);
      if (!user) {
        return reply.status(404).send({
          success: false,
          error: 'User not found'
        });
      }

      // Delete user
      await postgresDatabase.deleteUser(id);

      fastify.log.info({ msg: '🗑️ User deleted', userId: id });

      return reply.send({
        success: true,
        message: 'User deleted successfully'
      });
    } catch (error) {
      fastify.log.error(error, 'Delete user error');
      return reply.status(500).send({
        success: false,
        error: 'Failed to delete user'
      });
    }
  });

  fastify.log.info('✅ Users routes registered');
}

