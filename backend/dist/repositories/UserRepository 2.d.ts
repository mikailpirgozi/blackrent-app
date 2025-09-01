/**
 * User Repository
 * Spravuje všetky databázové operácie pre používateľov
 * Extrahované z postgres-database.ts - ZACHOVÁVA PRESNE ROVNAKÚ FUNKCIONALITU
 */
import { Pool } from 'pg';
import { User, UserPermission, UserCompanyAccess, CompanyPermissions } from '../types';
import { BaseRepository } from '../models/base/BaseRepository';
export declare class UserRepository extends BaseRepository {
    private permissionCache;
    private readonly PERMISSION_CACHE_TTL;
    constructor(pool: Pool);
    /**
     * Získa používateľa podľa username
     */
    getUserByUsername(username: string): Promise<User | null>;
    /**
     * Získa používateľa podľa ID
     */
    getUserById(id: string): Promise<User | null>;
    /**
     * Vytvorí nového používateľa
     */
    createUser(userData: {
        username: string;
        email: string;
        password: string;
        role: string;
        firstName?: string | null;
        lastName?: string | null;
        companyId?: string | null;
        employeeNumber?: string | null;
        hireDate?: Date | null;
        signatureTemplate?: string | null;
    }): Promise<User>;
    /**
     * Aktualizuje používateľa
     */
    updateUser(user: User): Promise<void>;
    /**
     * Zmaže používateľa
     */
    deleteUser(id: string): Promise<void>;
    /**
     * Získa všetkých používateľov
     */
    getUsers(): Promise<User[]>;
    /**
     * Získa používateľov s pagináciou
     */
    getUsersPaginated(params: {
        limit: number;
        offset: number;
        search?: string;
        role?: string;
        company?: string;
    }): Promise<{
        users: User[];
        total: number;
    }>;
    /**
     * Získa oprávnenia používateľa
     */
    getUserPermissions(userId: string): Promise<UserPermission[]>;
    /**
     * Získa prístup používateľa k firmám
     */
    getUserCompanyAccess(userId: string): Promise<UserCompanyAccess[]>;
    /**
     * Nastaví oprávnenie používateľa
     */
    setUserPermission(userId: string, companyId: string, permissions: CompanyPermissions): Promise<void>;
    /**
     * Odstráni oprávnenie používateľa
     */
    removeUserPermission(userId: string, companyId: string): Promise<void>;
    /**
     * Získa používateľov s prístupom k firme
     */
    getUsersWithCompanyAccess(companyId: string): Promise<{
        userId: string;
        username: string;
        permissions: CompanyPermissions;
    }[]>;
    /**
     * Skontroluje či má používateľ oprávnenie
     */
    hasPermission(userId: string, companyId: string, permission: keyof CompanyPermissions): Promise<boolean>;
    /**
     * Mapuje databázový riadok na User objekt
     */
    private mapRowToUser;
    /**
     * Invaliduje permission cache pre používateľa
     */
    private invalidateUserPermissionCache;
}
//# sourceMappingURL=UserRepository%202.d.ts.map