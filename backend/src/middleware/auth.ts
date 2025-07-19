import { Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { AuthRequest, JWTPayload, User } from '../types';
import { postgresDatabase } from '../models/postgres-database';

const JWT_SECRET = process.env.JWT_SECRET || 'blackrent-secret-key-2024';

export const authenticateToken = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.split(' ')[1];
    
    console.log('🔍 AUTH MIDDLEWARE - Starting auth check');
    console.log('🔍 AUTH MIDDLEWARE - Auth header exists:', !!authHeader);
    console.log('🔍 AUTH MIDDLEWARE - Token extracted:', !!token);

    if (!token) {
      console.log('❌ AUTH MIDDLEWARE - No token provided');
      return res.status(401).json({
        success: false,
        error: 'Access token je potrebný'
      });
    }

    console.log('🔍 AUTH MIDDLEWARE - Verifying JWT token...');
    const decoded = jwt.verify(token, JWT_SECRET) as JWTPayload;
    console.log('🔍 AUTH MIDDLEWARE - JWT decoded successfully:', {
      userId: decoded.userId,
      username: decoded.username,
      role: decoded.role
    });
    
    // Získaj aktuálne údaje používateľa z databázy
    console.log('🔍 AUTH MIDDLEWARE - Getting user from database...');
    const user = await postgresDatabase.getUserById(decoded.userId);
    console.log('🔍 AUTH MIDDLEWARE - Database user result:', {
      found: !!user,
      id: user?.id,
      username: user?.username
    });
    
    if (!user) {
      console.log('❌ AUTH MIDDLEWARE - User not found in database');
      return res.status(401).json({
        success: false,
        error: 'Používateľ nenájdený'
      });
    }

    // Pridaj používateľa do request objektu (bez hesla)
    req.user = {
      id: user.id,
      username: user.username,
      email: user.email,
      role: user.role,
      createdAt: user.createdAt
    };
    
    console.log('✅ AUTH MIDDLEWARE - Authentication successful');
    next();
  } catch (error) {
    console.error('❌ AUTH MIDDLEWARE ERROR:', error);
    console.error('❌ AUTH MIDDLEWARE ERROR TYPE:', error instanceof Error ? error.name : typeof error);
    console.error('❌ AUTH MIDDLEWARE ERROR MESSAGE:', error instanceof Error ? error.message : String(error));
    
    return res.status(403).json({
      success: false,
      error: 'Neplatný token'
    });
  }
};

export const requireRole = (roles: string[]) => {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: 'Autentifikácia je potrebná'
      });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        error: 'Nemáte oprávnenie na túto akciu'
      });
    }

    next();
  };
};

export const requirePermission = (resource: string, action: string) => {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: 'Autentifikácia je potrebná'
      });
    }

    // Zjednodušené oprávnenia - admin má všetky práva
    if (req.user.role === 'admin') {
      return next();
    }

    // Pre ostatných používateľov - základné oprávnenia
    const basicPermissions = {
      'vehicles': ['read', 'create', 'update', 'delete'],
      'rentals': ['read', 'create', 'update', 'delete'],
      'customers': ['read', 'create', 'update', 'delete'],
      'expenses': ['read', 'create', 'update', 'delete'],
      'insurances': ['read', 'create', 'update', 'delete']
    };

    const allowedActions = basicPermissions[resource as keyof typeof basicPermissions] || [];
    
    if (!allowedActions.includes(action)) {
      return res.status(403).json({
        success: false,
        error: `Nemáte oprávnenie na ${action} pre ${resource}`
      });
    }

    next();
  };
};

export const filterDataByRole = (data: any[], req: AuthRequest): any[] => {
  if (!req.user) return [];

  // Admin vidí všetky dáta
  if (req.user.role === 'admin') {
    return data;
  }

  // Ostatní používatelia vidia všetky dáta (zjednodušené)
  return data;
}; 