export interface Organization {
    id: string;
    name: string;
    slug: string;
    domain?: string;
    businessId?: string;
    taxId?: string;
    address?: string;
    phone?: string;
    email?: string;
    website?: string;
    logoUrl?: string;
    subscriptionPlan: 'basic' | 'premium' | 'enterprise';
    subscriptionStatus: 'active' | 'suspended' | 'cancelled';
    subscriptionExpiresAt?: Date;
    maxUsers: number;
    maxVehicles: number;
    settings: Record<string, any>;
    branding: Record<string, any>;
    createdAt: Date;
    updatedAt?: Date;
    createdBy?: string;
}
export interface Department {
    id: string;
    organizationId: string;
    name: string;
    description?: string;
    parentDepartmentId?: string;
    managerId?: string;
    monthlyBudget?: number;
    vehicleLimit?: number;
    settings: Record<string, any>;
    createdAt: Date;
    updatedAt?: Date;
}
export interface Role {
    id: string;
    organizationId: string;
    name: string;
    displayName: string;
    description?: string;
    level: number;
    parentRoleId?: string;
    permissions: Record<string, any>;
    isSystem: boolean;
    isActive: boolean;
    createdAt: Date;
    updatedAt?: Date;
    createdBy?: string;
}
export interface AdvancedUser {
    id: string;
    organizationId: string;
    departmentId?: string;
    username: string;
    email: string;
    passwordHash: string;
    firstName?: string;
    lastName?: string;
    middleName?: string;
    phone?: string;
    avatarUrl?: string;
    employeeNumber?: string;
    jobTitle?: string;
    hireDate?: Date;
    terminationDate?: Date;
    salary?: number;
    managerId?: string;
    roleId: string;
    customPermissions: Record<string, any>;
    isActive: boolean;
    isVerified: boolean;
    emailVerifiedAt?: Date;
    lastLoginAt?: Date;
    lastLoginIp?: string;
    loginCount: number;
    failedLoginAttempts: number;
    lockedUntil?: Date;
    twoFactorEnabled: boolean;
    twoFactorSecret?: string;
    backupCodes?: string[];
    language: string;
    timezone: string;
    theme: string;
    preferences: Record<string, any>;
    createdAt: Date;
    updatedAt?: Date;
    createdBy?: string;
}
export interface UserSession {
    id: string;
    userId: string;
    tokenHash: string;
    ipAddress?: string;
    userAgent?: string;
    deviceInfo?: Record<string, any>;
    location?: Record<string, any>;
    createdAt: Date;
    lastUsedAt: Date;
    expiresAt: Date;
    isActive: boolean;
}
export interface ActivityLog {
    id: string;
    userId: string;
    organizationId: string;
    action: string;
    resourceType?: string;
    resourceId?: string;
    ipAddress?: string;
    userAgent?: string;
    method?: string;
    endpoint?: string;
    oldValues?: Record<string, any>;
    newValues?: Record<string, any>;
    success: boolean;
    errorMessage?: string;
    createdAt: Date;
    durationMs?: number;
}
export interface Team {
    id: string;
    organizationId: string;
    name: string;
    description?: string;
    teamLeadId?: string;
    isActive: boolean;
    settings: Record<string, any>;
    createdAt: Date;
    updatedAt?: Date;
    createdBy?: string;
}
export interface TeamMember {
    id: string;
    teamId: string;
    userId: string;
    role: string;
    joinedAt: Date;
    leftAt?: Date;
    isActive: boolean;
}
declare class AdvancedUserService {
    private pool;
    constructor();
    createOrganization(data: Partial<Organization>, createdBy?: string): Promise<Organization>;
    getOrganization(id: string): Promise<Organization | null>;
    getOrganizationBySlug(slug: string): Promise<Organization | null>;
    updateOrganization(id: string, data: Partial<Organization>): Promise<Organization | null>;
    getOrganizationStats(organizationId: string): Promise<any>;
    createDepartment(data: Partial<Department>): Promise<Department>;
    getDepartmentsByOrganization(organizationId: string): Promise<Department[]>;
    updateDepartment(id: string, data: Partial<Department>): Promise<Department | null>;
    createRole(data: Partial<Role>, createdBy?: string): Promise<Role>;
    getRolesByOrganization(organizationId: string): Promise<Role[]>;
    getRole(id: string): Promise<Role | null>;
    updateRole(id: string, data: Partial<Role>): Promise<Role | null>;
    deleteRole(id: string): Promise<boolean>;
    createAdvancedUser(data: Partial<AdvancedUser>, createdBy?: string): Promise<AdvancedUser>;
    getAdvancedUser(id: string): Promise<AdvancedUser | null>;
    getUsersByOrganization(organizationId: string): Promise<AdvancedUser[]>;
    getUserDetails(userId: string): Promise<any>;
    updateAdvancedUser(id: string, data: Partial<AdvancedUser>): Promise<AdvancedUser | null>;
    changeUserPassword(userId: string, newPassword: string): Promise<boolean>;
    deactivateUser(userId: string): Promise<boolean>;
    logActivity(data: Partial<ActivityLog>): Promise<void>;
    getActivityLog(organizationId: string, filters?: any, limit?: number): Promise<ActivityLog[]>;
    createTeam(data: Partial<Team>, createdBy?: string): Promise<Team>;
    addTeamMember(teamId: string, userId: string, role?: string): Promise<TeamMember>;
    getTeamsByOrganization(organizationId: string): Promise<Team[]>;
    getTeamMembers(teamId: string): Promise<any[]>;
    checkPermission(userId: string, resource: string, action: string): Promise<boolean>;
    private hasPermission;
    private camelToSnake;
    private snakeToCamel;
    private mapOrganization;
    private mapDepartment;
    private mapRole;
    private mapAdvancedUser;
    private mapActivityLog;
    private mapTeam;
    private mapTeamMember;
}
export declare const advancedUserService: AdvancedUserService;
export {};
//# sourceMappingURL=advanced-user-service.d.ts.map