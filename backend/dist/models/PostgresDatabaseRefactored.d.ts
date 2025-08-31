/**
 * Refaktorovaná PostgresDatabase
 * Používa repository pattern namiesto monolitickej triedy
 * ZACHOVÁVA ÚPLNE ROVNAKÚ FUNKCIONALITU
 */
import type { Pool } from 'pg';
import type { Vehicle, Rental, Customer, User, UserPermission, UserCompanyAccess, CompanyPermissions, Company, CompanyDocument, CompanyInvestor, CompanyInvestorShare } from '../types';
export declare class PostgresDatabaseRefactored {
    private pool;
    private vehicleRepository;
    private rentalRepository;
    private customerRepository;
    private userRepository;
    private companyRepository;
    constructor();
    get dbPool(): Pool;
    getVehicles(includeRemoved?: boolean, includePrivate?: boolean): Promise<Vehicle[]>;
    getVehicle(id: string): Promise<Vehicle | null>;
    createVehicle(vehicleData: any): Promise<Vehicle>;
    updateVehicle(vehicle: Vehicle): Promise<void>;
    deleteVehicle(id: string): Promise<void>;
    getVehiclesPaginated(params: any): Promise<{
        vehicles: Vehicle[];
        total: number;
        page: number;
        limit: number;
    }>;
    getRentals(): Promise<Rental[]>;
    getRentalsForDateRange(startDate: Date, endDate: Date): Promise<Rental[]>;
    getRentalsPaginated(params: any): Promise<{
        rentals: Rental[];
        total: number;
        page: number;
        limit: number;
    }>;
    getRental(id: string): Promise<Rental | null>;
    createRental(rentalData: any): Promise<Rental>;
    updateRental(rental: Rental): Promise<void>;
    deleteRental(id: string): Promise<void>;
    getCustomers(): Promise<Customer[]>;
    getCustomersPaginated(params: any): Promise<{
        customers: Customer[];
        total: number;
        page: number;
        limit: number;
    }>;
    createCustomer(customerData: any): Promise<Customer>;
    updateCustomer(customer: Customer): Promise<void>;
    deleteCustomer(id: string): Promise<void>;
    getUserByUsername(username: string): Promise<User | null>;
    getUserById(id: string): Promise<User | null>;
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
    updateUser(user: User): Promise<void>;
    deleteUser(id: string): Promise<void>;
    getUsers(): Promise<User[]>;
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
    getUserPermissions(userId: string): Promise<UserPermission[]>;
    getUserCompanyAccess(userId: string): Promise<UserCompanyAccess[]>;
    setUserPermission(userId: string, companyId: string, permissions: CompanyPermissions): Promise<void>;
    removeUserPermission(userId: string, companyId: string): Promise<void>;
    getUsersWithCompanyAccess(companyId: string): Promise<{
        userId: string;
        username: string;
        permissions: CompanyPermissions;
    }[]>;
    hasPermission(userId: string, companyId: string, permission: keyof CompanyPermissions): Promise<boolean>;
    getCompanies(): Promise<Company[]>;
    getAllCompanies(): Promise<{
        id: string;
        name: string;
    }[]>;
    getCompaniesPaginated(params: {
        limit: number;
        offset: number;
        search?: string;
    }): Promise<{
        companies: Company[];
        total: number;
    }>;
    createCompany(companyData: {
        name: string;
        personalIban?: string;
        businessIban?: string;
        businessId?: string;
        taxId?: string;
        address?: string;
        contactPerson?: string;
        email?: string;
        phone?: string;
        contractStartDate?: Date;
        contractEndDate?: Date;
        commissionRate?: number;
    }): Promise<Company>;
    updateCompany(id: string, companyData: Partial<{
        name: string;
        personalIban: string;
        businessIban: string;
        businessId: string;
        taxId: string;
        address: string;
        contactPerson: string;
        email: string;
        phone: string;
        contractStartDate: Date;
        contractEndDate: Date;
        commissionRate: number;
        isActive: boolean;
    }>): Promise<void>;
    deleteCompany(id: string): Promise<void>;
    getCompanyIdByName(companyName: string): Promise<string | null>;
    getCompanyNameById(companyId: string): Promise<string | null>;
    assignVehiclesToCompany(vehicleIds: string[], companyId: string): Promise<void>;
    getCompanyInvestors(): Promise<CompanyInvestor[]>;
    createCompanyInvestor(investorData: {
        firstName: string;
        lastName: string;
        email?: string;
        phone?: string;
        personalId?: string;
        address?: string;
        notes?: string;
    }): Promise<CompanyInvestor>;
    updateCompanyInvestor(id: string, updateData: Partial<{
        firstName: string;
        lastName: string;
        email: string;
        phone: string;
        personalId: string;
        address: string;
        notes: string;
        isActive: boolean;
    }>): Promise<void>;
    deleteCompanyInvestor(id: string): Promise<void>;
    getCompanyInvestorShares(companyId: string): Promise<CompanyInvestorShare[]>;
    getInvestorsWithShares(): Promise<any[]>;
    createCompanyInvestorShare(shareData: {
        companyId: string;
        investorId: string;
        ownershipPercentage: number;
        investmentAmount?: number;
        investmentDate: Date;
        isPrimaryContact?: boolean;
        profitSharePercentage?: number;
    }): Promise<CompanyInvestorShare>;
    updateCompanyInvestorShare(id: string, updateData: Partial<{
        ownershipPercentage: number;
        investmentAmount: number;
        isPrimaryContact: boolean;
        profitSharePercentage: number;
    }>): Promise<void>;
    deleteCompanyInvestorShare(id: string): Promise<void>;
    createCompanyDocument(document: CompanyDocument): Promise<CompanyDocument>;
    getCompanyDocuments(companyId: string | number, documentType?: 'contract' | 'invoice', year?: number, month?: number): Promise<CompanyDocument[]>;
    getCompanyDocumentById(documentId: string): Promise<CompanyDocument | null>;
    deleteCompanyDocument(documentId: string): Promise<void>;
    getCompanyDocumentsByType(companyId: string | number, documentType: 'contract' | 'invoice'): Promise<CompanyDocument[]>;
    getCompanyInvoicesByMonth(companyId: string | number, year: number, month: number): Promise<CompanyDocument[]>;
    getInsurances(): Promise<any[]>;
    getExpenses(): Promise<any[]>;
    getHandoverProtocolsByRental(): Promise<any[]>;
    getSettlements(): Promise<any[]>;
    testConnection(): Promise<boolean>;
    close(): Promise<void>;
    getPoolStats(): {
        totalCount: number;
        idleCount: number;
        waitingCount: number;
    };
}
//# sourceMappingURL=PostgresDatabaseRefactored.d.ts.map