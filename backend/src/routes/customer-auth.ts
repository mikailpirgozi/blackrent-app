/**
 * Customer Authentication Routes
 * Separate authentication endpoints for mobile app customers (B2C)
 * Different from admin auth with simplified registration and OAuth support
 */

import bcrypt from 'bcryptjs';
import type { Request, Response } from 'express';
import { Router } from 'express';
import jwt from 'jsonwebtoken';
import { v4 as uuidv4 } from 'uuid';
import { authenticateToken } from '../middleware/auth';
import { postgresDatabase } from '../models/postgres-database';
import type { ApiResponse } from '../types';
import { logger } from '../utils/logger';

const router: Router = Router();
const JWT_SECRET = process.env.JWT_SECRET || 'blackrent-secret-key-2024';
const JWT_EXPIRES_IN = '90d'; // 90 days for mobile app
const REFRESH_TOKEN_EXPIRES_IN = '180d'; // 180 days

interface CustomerRegistrationRequest {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  phone?: string;
}

interface CustomerLoginRequest {
  email: string;
  password: string;
}

interface OAuthRequest {
  provider: 'google' | 'apple';
  token: string;
  email?: string;
  firstName?: string;
  lastName?: string;
  providerId?: string;
}

interface JWTPayload {
  userId: string;
  email: string;
  role: 'customer';
  type: 'access' | 'refresh';
}

interface CustomerProfile {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  phone?: string;
  createdAt: string;
  lastLogin?: string;
}

/**
 * Generate JWT tokens (access + refresh)
 */
function generateTokens(userId: string, email: string) {
  const accessToken = jwt.sign(
    {
      userId,
      email,
      role: 'customer',
      type: 'access',
    } as JWTPayload,
    JWT_SECRET,
    { expiresIn: JWT_EXPIRES_IN }
  );

  const refreshToken = jwt.sign(
    {
      userId,
      email,
      role: 'customer',
      type: 'refresh',
    } as JWTPayload,
    JWT_SECRET,
    { expiresIn: REFRESH_TOKEN_EXPIRES_IN }
  );

  return { accessToken, refreshToken };
}

/**
 * Validate email format
 */
function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * Validate password strength
 * At least 8 characters, 1 uppercase, 1 number
 */
function isValidPassword(password: string): boolean {
  return (
    password.length >= 8 &&
    /[A-Z]/.test(password) &&
    /[0-9]/.test(password)
  );
}

// ============================================================================
// 📱 CUSTOMER REGISTRATION
// ============================================================================

/**
 * POST /api/customer/register
 * Register new customer account
 */
router.post('/register', async (req: Request, res: Response<ApiResponse>) => {
  try {
    const {
      email,
      password,
      firstName,
      lastName,
      phone,
    } = req.body as CustomerRegistrationRequest;

    logger.info('📱 Customer registration attempt:', { email, firstName, lastName });

    // Validation
    if (!email || !password || !firstName || !lastName) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields',
        code: 'MISSING_FIELDS',
      });
    }

    if (!isValidEmail(email)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid email format',
        code: 'INVALID_EMAIL',
      });
    }

    if (!isValidPassword(password)) {
      return res.status(400).json({
        success: false,
        error: 'Password must be at least 8 characters with 1 uppercase letter and 1 number',
        code: 'WEAK_PASSWORD',
      });
    }

    // Check if customer already exists
    const client = await postgresDatabase.dbPool.connect();
    try {
      const existingCustomer = await client.query(
        'SELECT id FROM customers WHERE email = $1',
        [email.toLowerCase()]
      );

      if (existingCustomer.rows.length > 0) {
        return res.status(409).json({
          success: false,
          error: 'Customer with this email already exists',
          code: 'EMAIL_EXISTS',
        });
      }

      // Hash password
      const passwordHash = await bcrypt.hash(password, 12);

      // Create customer
      const customerId = uuidv4();
      const now = new Date().toISOString();

      await client.query(
        `INSERT INTO customers 
         (id, email, password_hash, first_name, last_name, phone, created_at, updated_at) 
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
        [
          customerId,
          email.toLowerCase(),
          passwordHash,
          firstName,
          lastName,
          phone || null,
          now,
          now,
        ]
      );

      // Generate tokens
      const { accessToken, refreshToken } = generateTokens(customerId, email);

      logger.info('✅ Customer registered successfully:', { customerId, email });

      res.status(201).json({
        success: true,
        data: {
          token: accessToken,
          refreshToken,
          customer: {
            id: customerId,
            email: email.toLowerCase(),
            firstName,
            lastName,
            phone: phone || null,
            createdAt: now,
          },
        },
      });
    } finally {
      client.release();
    }
  } catch (error) {
    logger.error('❌ Customer registration error:', error);
    res.status(500).json({
      success: false,
      error: 'Registration failed',
      code: 'REGISTRATION_ERROR',
    });
  }
});

// ============================================================================
// 🔐 CUSTOMER LOGIN
// ============================================================================

/**
 * POST /api/customer/login
 * Login with email and password
 */
router.post('/login', async (req: Request, res: Response<ApiResponse>) => {
  try {
    const { email, password } = req.body as CustomerLoginRequest;

    logger.info('📱 Customer login attempt:', { email });

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        error: 'Email and password required',
        code: 'MISSING_CREDENTIALS',
      });
    }

    const client = await postgresDatabase.dbPool.connect();
    try {
      // Find customer
      const result = await client.query(
        `SELECT id, email, password_hash, first_name, last_name, phone, created_at 
         FROM customers 
         WHERE email = $1`,
        [email.toLowerCase()]
      );

      if (result.rows.length === 0) {
        return res.status(401).json({
          success: false,
          error: 'Invalid email or password',
          code: 'INVALID_CREDENTIALS',
        });
      }

      const customer = result.rows[0];

      // Verify password
      const isValid = await bcrypt.compare(password, customer.password_hash);
      
      if (!isValid) {
        return res.status(401).json({
          success: false,
          error: 'Invalid email or password',
          code: 'INVALID_CREDENTIALS',
        });
      }

      // Update last login
      await client.query(
        'UPDATE customers SET last_login = $1 WHERE id = $2',
        [new Date().toISOString(), customer.id]
      );

      // Generate tokens
      const { accessToken, refreshToken } = generateTokens(customer.id, customer.email);

      logger.info('✅ Customer logged in successfully:', { customerId: customer.id, email });

      res.json({
        success: true,
        data: {
          token: accessToken,
          refreshToken,
          customer: {
            id: customer.id,
            email: customer.email,
            firstName: customer.first_name,
            lastName: customer.last_name,
            phone: customer.phone,
            createdAt: customer.created_at,
          },
        },
      });
    } finally {
      client.release();
    }
  } catch (error) {
    logger.error('❌ Customer login error:', error);
    res.status(500).json({
      success: false,
      error: 'Login failed',
      code: 'LOGIN_ERROR',
    });
  }
});

// ============================================================================
// 🔄 TOKEN REFRESH
// ============================================================================

/**
 * POST /api/customer/refresh
 * Refresh access token using refresh token
 */
router.post('/refresh', async (req: Request, res: Response<ApiResponse>) => {
  try {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      return res.status(400).json({
        success: false,
        error: 'Refresh token required',
        code: 'MISSING_TOKEN',
      });
    }

    // Verify refresh token
    const decoded = jwt.verify(refreshToken, JWT_SECRET) as JWTPayload;

    if (decoded.type !== 'refresh') {
      return res.status(401).json({
        success: false,
        error: 'Invalid token type',
        code: 'INVALID_TOKEN',
      });
    }

    // Generate new tokens
    const tokens = generateTokens(decoded.userId, decoded.email);

    logger.info('✅ Token refreshed:', { customerId: decoded.userId });

    res.json({
      success: true,
      data: tokens,
    });
  } catch (error) {
    logger.error('❌ Token refresh error:', error);
    res.status(401).json({
      success: false,
      error: 'Invalid or expired refresh token',
      code: 'INVALID_REFRESH_TOKEN',
    });
  }
});

// ============================================================================
// 👤 CUSTOMER PROFILE
// ============================================================================

/**
 * GET /api/customer/profile
 * Get current customer profile (requires authentication)
 */
router.get('/profile', authenticateToken, async (req: Request, res: Response<ApiResponse>) => {
  try {
    const userId = (req as unknown as Record<string, unknown>).userId as string;

    const client = await postgresDatabase.dbPool.connect();
    try {
      const result = await client.query(
        `SELECT id, email, first_name, last_name, phone, created_at, last_login 
         FROM customers 
         WHERE id = $1`,
        [userId]
      );

      if (result.rows.length === 0) {
        return res.status(404).json({
          success: false,
          error: 'Customer not found',
          code: 'NOT_FOUND',
        });
      }

      const customer = result.rows[0];

      res.json({
        success: true,
        data: {
          id: customer.id,
          email: customer.email,
          firstName: customer.first_name,
          lastName: customer.last_name,
          phone: customer.phone,
          createdAt: customer.created_at,
          lastLogin: customer.last_login,
        } as CustomerProfile,
      });
    } finally {
      client.release();
    }
  } catch (error) {
    logger.error('❌ Get customer profile error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch profile',
      code: 'PROFILE_ERROR',
    });
  }
});

/**
 * PUT /api/customer/profile
 * Update customer profile
 */
router.put('/profile', authenticateToken, async (req: Request, res: Response<ApiResponse>) => {
  try {
    const userId = (req as unknown as Record<string, unknown>).userId as string;
    const { firstName, lastName, phone } = req.body;

    const client = await postgresDatabase.dbPool.connect();
    try {
      const updates: string[] = [];
      const values: unknown[] = [];
      let paramCount = 1;

      if (firstName) {
        updates.push(`first_name = $${paramCount++}`);
        values.push(firstName);
      }

      if (lastName) {
        updates.push(`last_name = $${paramCount++}`);
        values.push(lastName);
      }

      if (phone !== undefined) {
        updates.push(`phone = $${paramCount++}`);
        values.push(phone || null);
      }

      if (updates.length === 0) {
        return res.status(400).json({
          success: false,
          error: 'No fields to update',
          code: 'NO_UPDATES',
        });
      }

      updates.push(`updated_at = $${paramCount++}`);
      values.push(new Date().toISOString());
      values.push(userId);

      await client.query(
        `UPDATE customers SET ${updates.join(', ')} WHERE id = $${paramCount}`,
        values
      );

      logger.info('✅ Customer profile updated:', { customerId: userId });

      res.json({
        success: true,
        message: 'Profile updated successfully',
      });
    } finally {
      client.release();
    }
  } catch (error) {
    logger.error('❌ Update customer profile error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update profile',
      code: 'UPDATE_ERROR',
    });
  }
});

// ============================================================================
// 🔐 OAUTH AUTHENTICATION (Placeholder)
// ============================================================================

/**
 * POST /api/customer/oauth/google
 * Google OAuth authentication
 * TODO: Implement full OAuth flow with Google SDK
 */
router.post('/oauth/google', async (req: Request, res: Response<ApiResponse>) => {
  try {
    const { token, email, firstName, lastName, providerId } = req.body as OAuthRequest;

    logger.info('📱 Google OAuth attempt:', { email });

    // TODO: Verify Google token with Google API
    // For now, this is a placeholder

    if (!email || !firstName || !lastName) {
      return res.status(400).json({
        success: false,
        error: 'Missing required OAuth data',
        code: 'MISSING_OAUTH_DATA',
      });
    }

    const client = await postgresDatabase.dbPool.connect();
    try {
      // Check if customer exists
      let result = await client.query(
        'SELECT id, email, first_name, last_name FROM customers WHERE email = $1',
        [email.toLowerCase()]
      );

      let customerId: string;

      if (result.rows.length === 0) {
        // Create new customer
        customerId = uuidv4();
        const now = new Date().toISOString();

        await client.query(
          `INSERT INTO customers 
           (id, email, first_name, last_name, oauth_provider, oauth_provider_id, created_at, updated_at) 
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
          [customerId, email.toLowerCase(), firstName, lastName, 'google', providerId, now, now]
        );

        logger.info('✅ New customer created via Google OAuth:', { customerId, email });
      } else {
        customerId = result.rows[0].id;

        // Update OAuth info if not set
        await client.query(
          `UPDATE customers 
           SET oauth_provider = 'google', oauth_provider_id = $1, last_login = $2 
           WHERE id = $3`,
          [providerId, new Date().toISOString(), customerId]
        );

        logger.info('✅ Existing customer logged in via Google OAuth:', { customerId, email });
      }

      // Generate tokens
      const tokens = generateTokens(customerId, email);

      res.json({
        success: true,
        data: {
          token: tokens.accessToken,
          refreshToken: tokens.refreshToken,
          customer: {
            id: customerId,
            email: email.toLowerCase(),
            firstName,
            lastName,
          },
        },
      });
    } finally {
      client.release();
    }
  } catch (error) {
    logger.error('❌ Google OAuth error:', error);
    res.status(500).json({
      success: false,
      error: 'OAuth authentication failed',
      code: 'OAUTH_ERROR',
    });
  }
});

/**
 * POST /api/customer/oauth/apple
 * Apple OAuth authentication
 * TODO: Implement full OAuth flow with Apple SDK
 */
router.post('/oauth/apple', async (req: Request, res: Response<ApiResponse>) => {
  try {
    const { token, email, firstName, lastName, providerId } = req.body as OAuthRequest;

    logger.info('📱 Apple OAuth attempt:', { email });

    // TODO: Verify Apple token with Apple API
    // For now, this is a placeholder (same logic as Google for now)

    if (!email) {
      return res.status(400).json({
        success: false,
        error: 'Email required for Apple Sign In',
        code: 'MISSING_EMAIL',
      });
    }

    const client = await postgresDatabase.dbPool.connect();
    try {
      // Check if customer exists
      let result = await client.query(
        'SELECT id, email, first_name, last_name FROM customers WHERE email = $1',
        [email.toLowerCase()]
      );

      let customerId: string;

      if (result.rows.length === 0) {
        // Create new customer
        customerId = uuidv4();
        const now = new Date().toISOString();

        await client.query(
          `INSERT INTO customers 
           (id, email, first_name, last_name, oauth_provider, oauth_provider_id, created_at, updated_at) 
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
          [
            customerId,
            email.toLowerCase(),
            firstName || 'Apple',
            lastName || 'User',
            'apple',
            providerId,
            now,
            now,
          ]
        );

        logger.info('✅ New customer created via Apple OAuth:', { customerId, email });
      } else {
        customerId = result.rows[0].id;

        // Update OAuth info
        await client.query(
          `UPDATE customers 
           SET oauth_provider = 'apple', oauth_provider_id = $1, last_login = $2 
           WHERE id = $3`,
          [providerId, new Date().toISOString(), customerId]
        );

        logger.info('✅ Existing customer logged in via Apple OAuth:', { customerId, email });
      }

      // Generate tokens
      const tokens = generateTokens(customerId, email);

      res.json({
        success: true,
        data: {
          token: tokens.accessToken,
          refreshToken: tokens.refreshToken,
          customer: {
            id: customerId,
            email: email.toLowerCase(),
            firstName: firstName || 'Apple',
            lastName: lastName || 'User',
          },
        },
      });
    } finally {
      client.release();
    }
  } catch (error) {
    logger.error('❌ Apple OAuth error:', error);
    res.status(500).json({
      success: false,
      error: 'OAuth authentication failed',
      code: 'OAUTH_ERROR',
    });
  }
});

export default router;



