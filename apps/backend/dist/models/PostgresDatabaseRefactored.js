"use strict";
/**
 * Refaktorovaná PostgresDatabase
 * Používa repository pattern namiesto monolitickej triedy
 * ZACHOVÁVA ÚPLNE ROVNAKÚ FUNKCIONALITU
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.PostgresDatabaseRefactored = void 0;
const CompanyRepository_1 = require("../repositories/CompanyRepository");
const CustomerRepository_1 = require("../repositories/CustomerRepository");
const RentalRepository_1 = require("../repositories/RentalRepository");
const UserRepository_1 = require("../repositories/UserRepository");
const VehicleRepository_1 = require("../repositories/VehicleRepository");
const logger_1 = require("../utils/logger");
const DatabaseConnection_1 = require("./base/DatabaseConnection");
class PostgresDatabaseRefactored {
    constructor() {
        // Použije rovnaký connection pool ako pôvodná databáza
        const dbConnection = DatabaseConnection_1.DatabaseConnection.getInstance();
        this.pool = dbConnection.getPool();
        // Inicializuje repository
        this.vehicleRepository = new VehicleRepository_1.VehicleRepository(this.pool);
        this.rentalRepository = new RentalRepository_1.RentalRepository(this.pool);
        this.customerRepository = new CustomerRepository_1.CustomerRepository(this.pool);
        this.userRepository = new UserRepository_1.UserRepository(this.pool);
        this.companyRepository = new CompanyRepository_1.CompanyRepository(this.pool);
        logger_1.logger.info('🔄 Refaktorovaná PostgresDatabase inicializovaná s 5 repository');
    }
    // Public getter for cleanup operations (zachováva kompatibilitu)
    get dbPool() {
        return this.pool;
    }
    // ============================================================================
    // VEHICLE METHODS - Delegované na VehicleRepository
    // ============================================================================
    async getVehicles(includeRemoved = false, includePrivate = false) {
        return this.vehicleRepository.getVehicles(includeRemoved, includePrivate);
    }
    async getVehicle(id) {
        return this.vehicleRepository.getVehicle(id);
    }
    async createVehicle(vehicleData) {
        return this.vehicleRepository.createVehicle(vehicleData);
    }
    async updateVehicle(vehicle) {
        return this.vehicleRepository.updateVehicle(vehicle);
    }
    async deleteVehicle(id) {
        return this.vehicleRepository.deleteVehicle(id);
    }
    async getVehiclesPaginated(params) {
        return this.vehicleRepository.getVehiclesPaginated(params);
    }
    // ============================================================================
    // RENTAL METHODS - Delegované na RentalRepository
    // ============================================================================
    async getRentals() {
        return this.rentalRepository.getRentals();
    }
    async getRentalsForDateRange(startDate, endDate) {
        return this.rentalRepository.getRentalsForDateRange(startDate, endDate);
    }
    async getRentalsPaginated(params) {
        return this.rentalRepository.getRentalsPaginated(params);
    }
    async getRental(id) {
        return this.rentalRepository.getRental(id);
    }
    async createRental(rentalData) {
        return this.rentalRepository.createRental(rentalData);
    }
    async updateRental(rental) {
        return this.rentalRepository.updateRental(rental);
    }
    async deleteRental(id) {
        return this.rentalRepository.deleteRental(id);
    }
    // ============================================================================
    // CUSTOMER METHODS - Delegované na CustomerRepository
    // ============================================================================
    async getCustomers() {
        return this.customerRepository.getCustomers();
    }
    async getCustomersPaginated(params) {
        return this.customerRepository.getCustomersPaginated(params);
    }
    async createCustomer(customerData) {
        return this.customerRepository.createCustomer(customerData);
    }
    async updateCustomer(customer) {
        return this.customerRepository.updateCustomer(customer);
    }
    async deleteCustomer(id) {
        return this.customerRepository.deleteCustomer(id);
    }
    // ============================================================================
    // USER METHODS - Delegované na UserRepository
    // ============================================================================
    async getUserByUsername(username) {
        return this.userRepository.getUserByUsername(username);
    }
    async getUserById(id) {
        return this.userRepository.getUserById(id);
    }
    async createUser(userData) {
        return this.userRepository.createUser(userData);
    }
    async updateUser(user) {
        return this.userRepository.updateUser(user);
    }
    async deleteUser(id) {
        return this.userRepository.deleteUser(id);
    }
    async getUsers() {
        return this.userRepository.getUsers();
    }
    async getUsersPaginated(params) {
        return this.userRepository.getUsersPaginated(params);
    }
    async getUserPermissions(userId) {
        return this.userRepository.getUserPermissions(userId);
    }
    async getUserCompanyAccess(userId) {
        return this.userRepository.getUserCompanyAccess(userId);
    }
    async setUserPermission(userId, companyId, permissions) {
        return this.userRepository.setUserPermission(userId, companyId, permissions);
    }
    async removeUserPermission(userId, companyId) {
        return this.userRepository.removeUserPermission(userId, companyId);
    }
    async getUsersWithCompanyAccess(companyId) {
        return this.userRepository.getUsersWithCompanyAccess(companyId);
    }
    async hasPermission(userId, companyId, permission) {
        return this.userRepository.hasPermission(userId, companyId, permission);
    }
    // ============================================================================
    // COMPANY METHODS - Delegované na CompanyRepository
    // ============================================================================
    async getCompanies() {
        return this.companyRepository.getCompanies();
    }
    async getAllCompanies() {
        return this.companyRepository.getAllCompanies();
    }
    async getCompaniesPaginated(params) {
        return this.companyRepository.getCompaniesPaginated(params);
    }
    async createCompany(companyData) {
        return this.companyRepository.createCompany(companyData);
    }
    async updateCompany(id, companyData) {
        return this.companyRepository.updateCompany(id, companyData);
    }
    async deleteCompany(id) {
        return this.companyRepository.deleteCompany(id);
    }
    async getCompanyIdByName(companyName) {
        return this.companyRepository.getCompanyIdByName(companyName);
    }
    async getCompanyNameById(companyId) {
        return this.companyRepository.getCompanyNameById(companyId);
    }
    async assignVehiclesToCompany(vehicleIds, companyId) {
        return this.companyRepository.assignVehiclesToCompany(vehicleIds, companyId);
    }
    // Company Investor Methods
    async getCompanyInvestors() {
        return this.companyRepository.getCompanyInvestors();
    }
    async createCompanyInvestor(investorData) {
        return this.companyRepository.createCompanyInvestor(investorData);
    }
    async updateCompanyInvestor(id, updateData) {
        return this.companyRepository.updateCompanyInvestor(id, updateData);
    }
    async deleteCompanyInvestor(id) {
        return this.companyRepository.deleteCompanyInvestor(id);
    }
    // Company Investor Share Methods
    async getCompanyInvestorShares(companyId) {
        return this.companyRepository.getCompanyInvestorShares(companyId);
    }
    async getInvestorsWithShares() {
        return this.companyRepository.getInvestorsWithShares();
    }
    async createCompanyInvestorShare(shareData) {
        return this.companyRepository.createCompanyInvestorShare(shareData);
    }
    async updateCompanyInvestorShare(id, updateData) {
        return this.companyRepository.updateCompanyInvestorShare(id, updateData);
    }
    async deleteCompanyInvestorShare(id) {
        return this.companyRepository.deleteCompanyInvestorShare(id);
    }
    // Company Document Methods
    async createCompanyDocument(document) {
        return this.companyRepository.createCompanyDocument(document);
    }
    async getCompanyDocuments(companyId, documentType, year, month) {
        return this.companyRepository.getCompanyDocuments(companyId, documentType, year, month);
    }
    async getCompanyDocumentById(documentId) {
        return this.companyRepository.getCompanyDocumentById(documentId);
    }
    async deleteCompanyDocument(documentId) {
        return this.companyRepository.deleteCompanyDocument(documentId);
    }
    async getCompanyDocumentsByType(companyId, documentType) {
        return this.companyRepository.getCompanyDocumentsByType(companyId, documentType);
    }
    async getCompanyInvoicesByMonth(companyId, year, month) {
        return this.companyRepository.getCompanyInvoicesByMonth(companyId, year, month);
    }
    // ============================================================================
    // PLACEHOLDER METHODS - Ostatné repository budú implementované neskôr
    // ============================================================================
    // TODO: Implementovať InsuranceRepository
    async getInsurances() {
        throw new Error('InsuranceRepository not implemented yet - use original database');
    }
    // TODO: Implementovať ExpenseRepository  
    async getExpenses() {
        throw new Error('ExpenseRepository not implemented yet - use original database');
    }
    // TODO: Implementovať ProtocolRepository
    async getHandoverProtocolsByRental() {
        throw new Error('ProtocolRepository not implemented yet - use original database');
    }
    // TODO: Implementovať SettlementRepository
    async getSettlements() {
        throw new Error('SettlementRepository not implemented yet - use original database');
    }
    // ============================================================================
    // UTILITY METHODS
    // ============================================================================
    async testConnection() {
        const dbConnection = DatabaseConnection_1.DatabaseConnection.getInstance();
        return dbConnection.testConnection();
    }
    async close() {
        const dbConnection = DatabaseConnection_1.DatabaseConnection.getInstance();
        return dbConnection.close();
    }
    getPoolStats() {
        const dbConnection = DatabaseConnection_1.DatabaseConnection.getInstance();
        return dbConnection.getPoolStats();
    }
}
exports.PostgresDatabaseRefactored = PostgresDatabaseRefactored;
//# sourceMappingURL=PostgresDatabaseRefactored.js.map