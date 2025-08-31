/**
 * Refaktorovaná PostgresDatabase
 * Používa repository pattern namiesto monolitickej triedy
 * ZACHOVÁVA ÚPLNE ROVNAKÚ FUNKCIONALITU
 */

import type { Pool } from 'pg';
import { DatabaseConnection } from './base/DatabaseConnection';
import { VehicleRepository } from '../repositories/VehicleRepository';
import { RentalRepository } from '../repositories/RentalRepository';
import { CustomerRepository } from '../repositories/CustomerRepository';
import { UserRepository } from '../repositories/UserRepository';
import { CompanyRepository } from '../repositories/CompanyRepository';
import type { Vehicle, Rental, Customer, User, UserPermission, UserCompanyAccess, CompanyPermissions, Company, CompanyDocument, CompanyInvestor, CompanyInvestorShare } from '../types';
import { logger } from '../utils/logger';

export class PostgresDatabaseRefactored {
  private pool: Pool;
  private vehicleRepository: VehicleRepository;
  private rentalRepository: RentalRepository;
  private customerRepository: CustomerRepository;
  private userRepository: UserRepository;
  private companyRepository: CompanyRepository;

  constructor() {
    // Použije rovnaký connection pool ako pôvodná databáza
    const dbConnection = DatabaseConnection.getInstance();
    this.pool = dbConnection.getPool();
    
    // Inicializuje repository
    this.vehicleRepository = new VehicleRepository(this.pool);
    this.rentalRepository = new RentalRepository(this.pool);
    this.customerRepository = new CustomerRepository(this.pool);
    this.userRepository = new UserRepository(this.pool);
    this.companyRepository = new CompanyRepository(this.pool);
    
    logger.info('🔄 Refaktorovaná PostgresDatabase inicializovaná s 5 repository');
  }

  // Public getter for cleanup operations (zachováva kompatibilitu)
  get dbPool(): Pool {
    return this.pool;
  }

  // ============================================================================
  // VEHICLE METHODS - Delegované na VehicleRepository
  // ============================================================================

  async getVehicles(includeRemoved: boolean = false, includePrivate: boolean = false): Promise<Vehicle[]> {
    return this.vehicleRepository.getVehicles(includeRemoved, includePrivate);
  }

  async getVehicle(id: string): Promise<Vehicle | null> {
    return this.vehicleRepository.getVehicle(id);
  }

  async createVehicle(vehicleData: any): Promise<Vehicle> {
    return this.vehicleRepository.createVehicle(vehicleData);
  }

  async updateVehicle(vehicle: Vehicle): Promise<void> {
    return this.vehicleRepository.updateVehicle(vehicle);
  }

  async deleteVehicle(id: string): Promise<void> {
    return this.vehicleRepository.deleteVehicle(id);
  }

  async getVehiclesPaginated(params: any) {
    return this.vehicleRepository.getVehiclesPaginated(params);
  }

  // ============================================================================
  // RENTAL METHODS - Delegované na RentalRepository
  // ============================================================================

  async getRentals(): Promise<Rental[]> {
    return this.rentalRepository.getRentals();
  }

  async getRentalsForDateRange(startDate: Date, endDate: Date): Promise<Rental[]> {
    return this.rentalRepository.getRentalsForDateRange(startDate, endDate);
  }

  async getRentalsPaginated(params: any) {
    return this.rentalRepository.getRentalsPaginated(params);
  }

  async getRental(id: string): Promise<Rental | null> {
    return this.rentalRepository.getRental(id);
  }

  async createRental(rentalData: any): Promise<Rental> {
    return this.rentalRepository.createRental(rentalData);
  }

  async updateRental(rental: Rental): Promise<void> {
    return this.rentalRepository.updateRental(rental);
  }

  async deleteRental(id: string): Promise<void> {
    return this.rentalRepository.deleteRental(id);
  }

    // ============================================================================
  // CUSTOMER METHODS - Delegované na CustomerRepository
  // ============================================================================

  async getCustomers(): Promise<Customer[]> {
    return this.customerRepository.getCustomers();
  }

  async getCustomersPaginated(params: any) {
    return this.customerRepository.getCustomersPaginated(params);
  }

  async createCustomer(customerData: any): Promise<Customer> {
    return this.customerRepository.createCustomer(customerData);
  }

  async updateCustomer(customer: Customer): Promise<void> {
    return this.customerRepository.updateCustomer(customer);
  }

  async deleteCustomer(id: string): Promise<void> {
    return this.customerRepository.deleteCustomer(id);
  }

  // ============================================================================
  // USER METHODS - Delegované na UserRepository
  // ============================================================================

  async getUserByUsername(username: string): Promise<User | null> {
    return this.userRepository.getUserByUsername(username);
  }

  async getUserById(id: string): Promise<User | null> {
    return this.userRepository.getUserById(id);
  }

  async createUser(userData: { 
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
  }): Promise<User> {
    return this.userRepository.createUser(userData);
  }

  async updateUser(user: User): Promise<void> {
    return this.userRepository.updateUser(user);
  }

  async deleteUser(id: string): Promise<void> {
    return this.userRepository.deleteUser(id);
  }

  async getUsers(): Promise<User[]> {
    return this.userRepository.getUsers();
  }

  async getUsersPaginated(params: {
    limit: number;
    offset: number;
    search?: string;
    role?: string;
    company?: string;
  }): Promise<{ users: User[]; total: number }> {
    return this.userRepository.getUsersPaginated(params);
  }

  async getUserPermissions(userId: string): Promise<UserPermission[]> {
    return this.userRepository.getUserPermissions(userId);
  }

  async getUserCompanyAccess(userId: string): Promise<UserCompanyAccess[]> {
    return this.userRepository.getUserCompanyAccess(userId);
  }

  async setUserPermission(userId: string, companyId: string, permissions: CompanyPermissions): Promise<void> {
    return this.userRepository.setUserPermission(userId, companyId, permissions);
  }

  async removeUserPermission(userId: string, companyId: string): Promise<void> {
    return this.userRepository.removeUserPermission(userId, companyId);
  }

  async getUsersWithCompanyAccess(companyId: string): Promise<{userId: string, username: string, permissions: CompanyPermissions}[]> {
    return this.userRepository.getUsersWithCompanyAccess(companyId);
  }

  async hasPermission(userId: string, companyId: string, permission: keyof CompanyPermissions): Promise<boolean> {
    return this.userRepository.hasPermission(userId, companyId, permission);
  }

  // ============================================================================
  // COMPANY METHODS - Delegované na CompanyRepository
  // ============================================================================

  async getCompanies(): Promise<Company[]> {
    return this.companyRepository.getCompanies();
  }

  async getAllCompanies(): Promise<{id: string, name: string}[]> {
    return this.companyRepository.getAllCompanies();
  }

  async getCompaniesPaginated(params: {
    limit: number;
    offset: number;
    search?: string;
  }): Promise<{ companies: Company[]; total: number }> {
    return this.companyRepository.getCompaniesPaginated(params);
  }

  async createCompany(companyData: { 
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
  }): Promise<Company> {
    return this.companyRepository.createCompany(companyData);
  }

  async updateCompany(id: string, companyData: Partial<{
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
  }>): Promise<void> {
    return this.companyRepository.updateCompany(id, companyData);
  }

  async deleteCompany(id: string): Promise<void> {
    return this.companyRepository.deleteCompany(id);
  }

  async getCompanyIdByName(companyName: string): Promise<string | null> {
    return this.companyRepository.getCompanyIdByName(companyName);
  }

  async getCompanyNameById(companyId: string): Promise<string | null> {
    return this.companyRepository.getCompanyNameById(companyId);
  }

  async assignVehiclesToCompany(vehicleIds: string[], companyId: string): Promise<void> {
    return this.companyRepository.assignVehiclesToCompany(vehicleIds, companyId);
  }

  // Company Investor Methods
  async getCompanyInvestors(): Promise<CompanyInvestor[]> {
    return this.companyRepository.getCompanyInvestors();
  }

  async createCompanyInvestor(investorData: {
    firstName: string;
    lastName: string;
    email?: string;
    phone?: string;
    personalId?: string;
    address?: string;
    notes?: string;
  }): Promise<CompanyInvestor> {
    return this.companyRepository.createCompanyInvestor(investorData);
  }

  async updateCompanyInvestor(id: string, updateData: Partial<{
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
    personalId: string;
    address: string;
    notes: string;
    isActive: boolean;
  }>): Promise<void> {
    return this.companyRepository.updateCompanyInvestor(id, updateData);
  }

  async deleteCompanyInvestor(id: string): Promise<void> {
    return this.companyRepository.deleteCompanyInvestor(id);
  }

  // Company Investor Share Methods
  async getCompanyInvestorShares(companyId: string): Promise<CompanyInvestorShare[]> {
    return this.companyRepository.getCompanyInvestorShares(companyId);
  }

  async getInvestorsWithShares(): Promise<any[]> {
    return this.companyRepository.getInvestorsWithShares();
  }

  async createCompanyInvestorShare(shareData: {
    companyId: string;
    investorId: string;
    ownershipPercentage: number;
    investmentAmount?: number;
    investmentDate: Date;
    isPrimaryContact?: boolean;
    profitSharePercentage?: number;
  }): Promise<CompanyInvestorShare> {
    return this.companyRepository.createCompanyInvestorShare(shareData);
  }

  async updateCompanyInvestorShare(id: string, updateData: Partial<{
    ownershipPercentage: number;
    investmentAmount: number;
    isPrimaryContact: boolean;
    profitSharePercentage: number;
  }>): Promise<void> {
    return this.companyRepository.updateCompanyInvestorShare(id, updateData);
  }

  async deleteCompanyInvestorShare(id: string): Promise<void> {
    return this.companyRepository.deleteCompanyInvestorShare(id);
  }

  // Company Document Methods
  async createCompanyDocument(document: CompanyDocument): Promise<CompanyDocument> {
    return this.companyRepository.createCompanyDocument(document);
  }

  async getCompanyDocuments(
    companyId: string | number, 
    documentType?: 'contract' | 'invoice',
    year?: number,
    month?: number
  ): Promise<CompanyDocument[]> {
    return this.companyRepository.getCompanyDocuments(companyId, documentType, year, month);
  }

  async getCompanyDocumentById(documentId: string): Promise<CompanyDocument | null> {
    return this.companyRepository.getCompanyDocumentById(documentId);
  }

  async deleteCompanyDocument(documentId: string): Promise<void> {
    return this.companyRepository.deleteCompanyDocument(documentId);
  }

  async getCompanyDocumentsByType(companyId: string | number, documentType: 'contract' | 'invoice'): Promise<CompanyDocument[]> {
    return this.companyRepository.getCompanyDocumentsByType(companyId, documentType);
  }

  async getCompanyInvoicesByMonth(companyId: string | number, year: number, month: number): Promise<CompanyDocument[]> {
    return this.companyRepository.getCompanyInvoicesByMonth(companyId, year, month);
  }

  // ============================================================================
  // PLACEHOLDER METHODS - Ostatné repository budú implementované neskôr
  // ============================================================================

  // TODO: Implementovať InsuranceRepository
  async getInsurances(): Promise<any[]> {
    throw new Error('InsuranceRepository not implemented yet - use original database');
  }

  // TODO: Implementovať ExpenseRepository  
  async getExpenses(): Promise<any[]> {
    throw new Error('ExpenseRepository not implemented yet - use original database');
  }

  // TODO: Implementovať ProtocolRepository
  async getHandoverProtocolsByRental(): Promise<any[]> {
    throw new Error('ProtocolRepository not implemented yet - use original database');
  }

  // TODO: Implementovať SettlementRepository
  async getSettlements(): Promise<any[]> {
    throw new Error('SettlementRepository not implemented yet - use original database');
  }

  // ============================================================================
  // UTILITY METHODS
  // ============================================================================

  async testConnection(): Promise<boolean> {
    const dbConnection = DatabaseConnection.getInstance();
    return dbConnection.testConnection();
  }

  async close(): Promise<void> {
    const dbConnection = DatabaseConnection.getInstance();
    return dbConnection.close();
  }

  getPoolStats() {
    const dbConnection = DatabaseConnection.getInstance();
    return dbConnection.getPoolStats();
  }
}
