/**
 * Company Repository
 * Spravuje všetky databázové operácie pre firmy, investorov a dokumenty
 * Extrahované z postgres-database.ts - ZACHOVÁVA PRESNE ROVNAKÚ FUNKCIONALITU
 */
import { Pool } from 'pg';
import { Company, CompanyDocument, CompanyInvestor, CompanyInvestorShare } from '../types';
import { BaseRepository } from '../models/base/BaseRepository';
export declare class CompanyRepository extends BaseRepository {
    constructor(pool: Pool);
    /**
     * Získa všetky firmy
     */
    getCompanies(): Promise<Company[]>;
    /**
     * Získa všetky firmy (jednoduchý formát)
     */
    getAllCompanies(): Promise<{
        id: string;
        name: string;
    }[]>;
    /**
     * Získa firmy s pagináciou
     */
    getCompaniesPaginated(params: {
        limit: number;
        offset: number;
        search?: string;
    }): Promise<{
        companies: Company[];
        total: number;
    }>;
    /**
     * Vytvorí novú firmu
     */
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
    /**
     * Aktualizuje firmu
     */
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
    /**
     * Zmaže firmu
     */
    deleteCompany(id: string): Promise<void>;
    /**
     * Získa ID firmy podľa názvu
     */
    getCompanyIdByName(companyName: string): Promise<string | null>;
    /**
     * Získa názov firmy podľa ID
     */
    getCompanyNameById(companyId: string): Promise<string | null>;
    /**
     * Priradí vozidlá k firme
     */
    assignVehiclesToCompany(vehicleIds: string[], companyId: string): Promise<void>;
    /**
     * Získa všetkých investorov
     */
    getCompanyInvestors(): Promise<CompanyInvestor[]>;
    /**
     * Vytvorí nového investora
     */
    createCompanyInvestor(investorData: {
        firstName: string;
        lastName: string;
        email?: string;
        phone?: string;
        personalId?: string;
        address?: string;
        notes?: string;
    }): Promise<CompanyInvestor>;
    /**
     * Aktualizuje investora
     */
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
    /**
     * Zmaže investora
     */
    deleteCompanyInvestor(id: string): Promise<void>;
    /**
     * Získa podiely investorov pre firmu
     */
    getCompanyInvestorShares(companyId: string): Promise<CompanyInvestorShare[]>;
    /**
     * Získa investorov s podielmi
     */
    getInvestorsWithShares(): Promise<any[]>;
    /**
     * Vytvorí podiel investora
     */
    createCompanyInvestorShare(shareData: {
        companyId: string;
        investorId: string;
        ownershipPercentage: number;
        investmentAmount?: number;
        investmentDate: Date;
        isPrimaryContact?: boolean;
        profitSharePercentage?: number;
    }): Promise<CompanyInvestorShare>;
    /**
     * Aktualizuje podiel investora
     */
    updateCompanyInvestorShare(id: string, updateData: Partial<{
        ownershipPercentage: number;
        investmentAmount: number;
        isPrimaryContact: boolean;
        profitSharePercentage: number;
    }>): Promise<void>;
    /**
     * Zmaže podiel investora
     */
    deleteCompanyInvestorShare(id: string): Promise<void>;
    /**
     * Vytvorí dokument firmy
     */
    createCompanyDocument(document: CompanyDocument): Promise<CompanyDocument>;
    /**
     * Získa dokumenty firmy
     */
    getCompanyDocuments(companyId: string | number, documentType?: 'contract' | 'invoice', year?: number, month?: number): Promise<CompanyDocument[]>;
    /**
     * Získa dokument firmy podľa ID
     */
    getCompanyDocumentById(documentId: string): Promise<CompanyDocument | null>;
    /**
     * Zmaže dokument firmy
     */
    deleteCompanyDocument(documentId: string): Promise<void>;
    /**
     * Získa dokumenty firmy podľa typu
     */
    getCompanyDocumentsByType(companyId: string | number, documentType: 'contract' | 'invoice'): Promise<CompanyDocument[]>;
    /**
     * Získa faktúry firmy podľa mesiaca
     */
    getCompanyInvoicesByMonth(companyId: string | number, year: number, month: number): Promise<CompanyDocument[]>;
    /**
     * Mapuje databázový riadok na Company objekt
     */
    private mapRowToCompany;
    /**
     * Mapuje databázový riadok na CompanyInvestor objekt
     */
    private mapRowToCompanyInvestor;
    /**
     * Mapuje databázový riadok na CompanyInvestorShare objekt
     */
    private mapRowToCompanyInvestorShare;
    /**
     * Mapuje databázový riadok na CompanyDocument objekt
     */
    private mapRowToCompanyDocument;
    /**
     * Konvertuje camelCase na snake_case
     */
    private camelToSnake;
}
//# sourceMappingURL=CompanyRepository.d.ts.map