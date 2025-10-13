import type { NextFunction, Response } from 'express';
import jwt from 'jsonwebtoken';
import { postgresDatabase } from '../models/postgres-database';
import type { AuthRequest, JWTPayload } from '../types';
import { createForbiddenError, createUnauthorizedError } from './errorHandler';
import { logger } from '../utils/logger';

const JWT_SECRET = process.env.JWT_SECRET || 'blackrent-secret-key-2024';

export const authenticateToken = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.split(' ')[1];

    logger.auth('🔍 AUTH MIDDLEWARE - Starting auth check');
    logger.auth('🔍 AUTH MIDDLEWARE - Auth header exists:', !!authHeader);
    logger.auth('🔍 AUTH MIDDLEWARE - Token extracted:', !!token);

    if (!token) {
      logger.auth('❌ AUTH MIDDLEWARE - No token provided');
      throw createUnauthorizedError('Access token je potrebný');
    }

    logger.auth('🔍 AUTH MIDDLEWARE - Verifying JWT token...');
    const decoded = jwt.verify(token, JWT_SECRET) as JWTPayload;
    logger.auth('🔍 AUTH MIDDLEWARE - JWT decoded successfully:', {
      userId: decoded.userId,
      username: decoded.username,
      role: decoded.role,
    });

    // Získaj aktuálne údaje používateľa z databázy
    logger.auth('🔍 AUTH MIDDLEWARE - Getting user from database...');
    const user = await postgresDatabase.getUserById(decoded.userId);
    logger.auth('🔍 AUTH MIDDLEWARE - Database user result:', {
      found: !!user,
      id: user?.id,
      username: user?.username,
      role: user?.role,
      platformId: user?.platformId,
      linkedInvestorId: user?.linkedInvestorId,
    });

    if (!user) {
      logger.auth('❌ AUTH MIDDLEWARE - User not found in database');
      throw createUnauthorizedError('Používateľ nenájdený');
    }

    // Pridaj používateľa do request objektu (bez hesla)
    req.user = {
      id: user.id,
      username: user.username,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      role: user.role,
      companyId: user.companyId,
      platformId: user.platformId, // ✅ PRIDANÉ: Multi-tenancy support
      linkedInvestorId: user.linkedInvestorId, // ✅ PRIDANÉ: Investor linking
      employeeNumber: user.employeeNumber,
      hireDate: user.hireDate,
      isActive: user.isActive,
      lastLogin: user.lastLogin,
      permissions: user.permissions,
      signatureTemplate: user.signatureTemplate,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    };

    logger.auth('✅ AUTH MIDDLEWARE - Authentication successful');
    next();
  } catch (error) {
    console.error('❌ AUTH MIDDLEWARE ERROR:', error);
    console.error(
      '❌ AUTH MIDDLEWARE ERROR TYPE:',
      error instanceof Error ? error.name : typeof error
    );
    console.error(
      '❌ AUTH MIDDLEWARE ERROR MESSAGE:',
      error instanceof Error ? error.message : String(error)
    );

    // Ak je to už naša custom error, prehoď ju ďalej
    if (error instanceof Error && error.name === 'ApiErrorWithCode') {
      return next(error);
    }

    // Inak vytvor forbidden error
    next(createForbiddenError('Neplatný token'));
  }
};

export const requireRole = (roles: string[]) => {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      if (!req.user) {
        throw createUnauthorizedError('Autentifikácia je potrebná');
      }

      if (!roles.includes(req.user.role)) {
        throw createForbiddenError('Nemáte oprávnenie na túto akciu');
      }

      next();
    } catch (error) {
      next(error);
    }
  };
};

export const requirePermission = (resource: string, action: string) => {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      if (!req.user) {
        throw createUnauthorizedError('Autentifikácia je potrebná');
      }

      // Admin roles (legacy admin, super_admin) majú všetky práva
      if (req.user.role === 'admin' || req.user.role === 'super_admin') {
        return next();
      }

      // Company Admin má všetky práva vo svojej firme
      // Pre granulárnejšie kontroly použite checkPermission middleware
      if (req.user.role === 'company_admin') {
        return next();
      }

      // Pre ostatných používateľov - kontrola cez permission system
      // Táto zjednodušená verzia je len fallback
      // Odporúčame použiť checkPermission middleware pre presné kontroly
      const basicPermissions = {
        vehicles: ['read', 'create', 'update', 'delete'],
        rentals: ['read', 'create', 'update', 'delete'],
        customers: ['read', 'create', 'update', 'delete'],
        expenses: ['read', 'create', 'update', 'delete'],
        insurances: ['read', 'create', 'update', 'delete'],
      };

      const allowedActions =
        basicPermissions[resource as keyof typeof basicPermissions] || [];

      if (!allowedActions.includes(action)) {
        throw createForbiddenError(
          `Nemáte oprávnenie na ${action} pre ${resource}`
        );
      }

      next();
    } catch (error) {
      next(error);
    }
  };
};

export const filterDataByRole = (data: Record<string, unknown>[], req: AuthRequest): Record<string, unknown>[] => {
  if (!req.user) return [];

  // Admin roles (legacy admin, super_admin) vidia všetky dáta
  if (req.user.role === 'admin' || req.user.role === 'super_admin') {
    return data;
  }

  // Company Admin vidí len dáta vlastnej firmy
  if (req.user.role === 'company_admin' && req.user.companyId) {
    return data.filter((item: Record<string, unknown>) => {
      // Filter by ownerCompanyId or companyId field
      return item.ownerCompanyId === req.user!.companyId || 
             item.companyId === req.user!.companyId;
    });
  }

  // Company Owner vidí len svoje vozidlá
  if (req.user.role === 'investor' && req.user.companyId) {
    return data.filter((item: Record<string, unknown>) => {
      return item.ownerCompanyId === req.user!.companyId || 
             item.companyId === req.user!.companyId;
    });
  }

  // Ostatní používatelia - filter podľa company access
  // (toto vyžaduje dodatočný lookup do user_company_access tabuľky)
  // Pre teraz vrátime všetky dáta - TODO: implementovať company access check
  return data;
};
