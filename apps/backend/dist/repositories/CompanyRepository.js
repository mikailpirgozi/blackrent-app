"use strict";
/**
 * Company Repository
 * Spravuje všetky databázové operácie pre firmy, investorov a dokumenty
 * Extrahované z postgres-database.ts - ZACHOVÁVA PRESNE ROVNAKÚ FUNKCIONALITU
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.CompanyRepository = void 0;
const BaseRepository_1 = require("../models/base/BaseRepository");
class CompanyRepository extends BaseRepository_1.BaseRepository {
    constructor(pool) {
        super(pool);
    }
    // ============================================================================
    // COMPANY METHODS
    // ============================================================================
    /**
     * Získa všetky firmy
     */
    async getCompanies() {
        const client = await this.getClient();
        try {
            const result = await client.query('SELECT * FROM companies ORDER BY name');
            return result.rows.map(row => this.mapRowToCompany(row));
        }
        finally {
            this.releaseClient(client);
        }
    }
    /**
     * Získa všetky firmy (jednoduchý formát)
     */
    async getAllCompanies() {
        const client = await this.getClient();
        try {
            const result = await client.query('SELECT id, name FROM companies ORDER BY name');
            return result.rows.map(row => ({
                id: row.id,
                name: row.name
            }));
        }
        finally {
            this.releaseClient(client);
        }
    }
    /**
     * Získa firmy s pagináciou
     */
    async getCompaniesPaginated(params) {
        const client = await this.getClient();
        try {
            const whereConditions = [];
            const queryParams = [];
            let paramIndex = 1;
            // Search filter
            if (params.search) {
                whereConditions.push(`(name ILIKE $${paramIndex} OR business_id ILIKE $${paramIndex} OR email ILIKE $${paramIndex})`);
                queryParams.push(`%${params.search}%`);
                paramIndex++;
            }
            const whereClause = whereConditions.length > 0 ? `WHERE ${whereConditions.join(' AND ')}` : '';
            // Get total count
            const countQuery = `SELECT COUNT(*) FROM companies ${whereClause}`;
            const countResult = await client.query(countQuery, queryParams);
            const total = parseInt(countResult.rows[0].count);
            // Get paginated results
            const dataQuery = `
        SELECT * FROM companies 
        ${whereClause}
        ORDER BY name
        LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
      `;
            queryParams.push(params.limit, params.offset);
            const dataResult = await client.query(dataQuery, queryParams);
            const companies = dataResult.rows.map(row => this.mapRowToCompany(row));
            return { companies, total };
        }
        finally {
            this.releaseClient(client);
        }
    }
    /**
     * Vytvorí novú firmu
     */
    async createCompany(companyData) {
        return this.executeTransaction(async (client) => {
            const result = await client.query(`INSERT INTO companies (
          name, personal_iban, business_iban, business_id, tax_id, address, 
          contact_person, email, phone, contract_start_date, contract_end_date, 
          commission_rate, is_active
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13) 
        RETURNING *`, [
                companyData.name,
                companyData.personalIban || null,
                companyData.businessIban || null,
                companyData.businessId || null,
                companyData.taxId || null,
                companyData.address || null,
                companyData.contactPerson || null,
                companyData.email || null,
                companyData.phone || null,
                companyData.contractStartDate || null,
                companyData.contractEndDate || null,
                companyData.commissionRate || 20,
                true
            ]);
            return this.mapRowToCompany(result.rows[0]);
        });
    }
    /**
     * Aktualizuje firmu
     */
    async updateCompany(id, companyData) {
        const client = await this.getClient();
        try {
            const fields = [];
            const values = [];
            let paramIndex = 1;
            // Dynamicky stavaj UPDATE query
            Object.entries(companyData).forEach(([key, value]) => {
                const dbField = this.camelToSnake(key);
                fields.push(`${dbField} = $${paramIndex}`);
                values.push(value);
                paramIndex++;
            });
            if (fields.length === 0)
                return;
            fields.push(`updated_at = CURRENT_TIMESTAMP`);
            values.push(id);
            const query = `UPDATE companies SET ${fields.join(', ')} WHERE id = $${paramIndex}`;
            await client.query(query, values);
        }
        finally {
            this.releaseClient(client);
        }
    }
    /**
     * Zmaže firmu
     */
    async deleteCompany(id) {
        const client = await this.getClient();
        try {
            await client.query('DELETE FROM companies WHERE id = $1', [id]);
        }
        finally {
            this.releaseClient(client);
        }
    }
    /**
     * Získa ID firmy podľa názvu
     */
    async getCompanyIdByName(companyName) {
        const client = await this.getClient();
        try {
            // 1. Skús najprv presný názov
            let result = await client.query('SELECT id FROM companies WHERE name = $1', [companyName]);
            if (result.rows.length > 0) {
                return result.rows[0].id;
            }
            // 2. Skús ILIKE search
            result = await client.query('SELECT id FROM companies WHERE name ILIKE $1', [`%${companyName}%`]);
            if (result.rows.length > 0) {
                return result.rows[0].id;
            }
            return null;
        }
        finally {
            this.releaseClient(client);
        }
    }
    /**
     * Získa názov firmy podľa ID
     */
    async getCompanyNameById(companyId) {
        const client = await this.getClient();
        try {
            const result = await client.query('SELECT name FROM companies WHERE id = $1', [companyId]);
            return result.rows.length > 0 ? result.rows[0].name : null;
        }
        finally {
            this.releaseClient(client);
        }
    }
    /**
     * Priradí vozidlá k firme
     */
    async assignVehiclesToCompany(vehicleIds, companyId) {
        const client = await this.getClient();
        try {
            for (const vehicleId of vehicleIds) {
                await client.query('UPDATE vehicles SET company_id = $1 WHERE id = $2', [companyId, vehicleId]);
            }
        }
        finally {
            this.releaseClient(client);
        }
    }
    // ============================================================================
    // COMPANY INVESTOR METHODS
    // ============================================================================
    /**
     * Získa všetkých investorov
     */
    async getCompanyInvestors() {
        const client = await this.getClient();
        try {
            const result = await client.query('SELECT * FROM company_investors ORDER BY last_name, first_name');
            return result.rows.map(row => this.mapRowToCompanyInvestor(row));
        }
        finally {
            this.releaseClient(client);
        }
    }
    /**
     * Vytvorí nového investora
     */
    async createCompanyInvestor(investorData) {
        return this.executeTransaction(async (client) => {
            const result = await client.query(`INSERT INTO company_investors (
          first_name, last_name, email, phone, personal_id, address, notes, is_active
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *`, [
                investorData.firstName,
                investorData.lastName,
                investorData.email || null,
                investorData.phone || null,
                investorData.personalId || null,
                investorData.address || null,
                investorData.notes || null,
                true
            ]);
            return this.mapRowToCompanyInvestor(result.rows[0]);
        });
    }
    /**
     * Aktualizuje investora
     */
    async updateCompanyInvestor(id, updateData) {
        const client = await this.getClient();
        try {
            const fields = [];
            const values = [];
            let paramIndex = 1;
            Object.entries(updateData).forEach(([key, value]) => {
                const dbField = this.camelToSnake(key);
                fields.push(`${dbField} = $${paramIndex}`);
                values.push(value);
                paramIndex++;
            });
            if (fields.length === 0)
                return;
            fields.push(`updated_at = CURRENT_TIMESTAMP`);
            values.push(id);
            const query = `UPDATE company_investors SET ${fields.join(', ')} WHERE id = $${paramIndex}`;
            await client.query(query, values);
        }
        finally {
            this.releaseClient(client);
        }
    }
    /**
     * Zmaže investora
     */
    async deleteCompanyInvestor(id) {
        const client = await this.getClient();
        try {
            // Najprv vymaž všetky shares
            await client.query('DELETE FROM company_investor_shares WHERE investor_id = $1', [id]);
            // Potom vymaž investora
            await client.query('DELETE FROM company_investors WHERE id = $1', [id]);
        }
        finally {
            this.releaseClient(client);
        }
    }
    // ============================================================================
    // COMPANY INVESTOR SHARE METHODS
    // ============================================================================
    /**
     * Získa podiely investorov pre firmu
     */
    async getCompanyInvestorShares(companyId) {
        const client = await this.getClient();
        try {
            const result = await client.query(`SELECT 
          cis.*,
          ci.first_name, ci.last_name, ci.email, ci.phone,
          c.name as company_name
        FROM company_investor_shares cis
        LEFT JOIN company_investors ci ON cis.investor_id = ci.id
        LEFT JOIN companies c ON cis.company_id = c.id
        WHERE cis.company_id = $1
        ORDER BY cis.ownership_percentage DESC`, [companyId]);
            return result.rows.map(row => this.mapRowToCompanyInvestorShare(row));
        }
        finally {
            this.releaseClient(client);
        }
    }
    /**
     * Získa investorov s podielmi
     */
    async getInvestorsWithShares() {
        const client = await this.getClient();
        try {
            const result = await client.query(`
        SELECT 
          ci.*,
          json_agg(
            json_build_object(
              'id', cis.id,
              'companyId', cis.company_id,
              'companyName', c.name,
              'ownershipPercentage', cis.ownership_percentage,
              'investmentAmount', cis.investment_amount,
              'investmentDate', cis.investment_date,
              'isPrimaryContact', cis.is_primary_contact
            )
          ) as shares
        FROM company_investors ci
        LEFT JOIN company_investor_shares cis ON ci.id = cis.investor_id
        LEFT JOIN companies c ON cis.company_id = c.id
        WHERE ci.is_active = true
        GROUP BY ci.id
        ORDER BY ci.last_name, ci.first_name
      `);
            return result.rows.map(row => ({
                ...this.mapRowToCompanyInvestor(row),
                shares: row.shares.filter((share) => share.id !== null)
            }));
        }
        finally {
            this.releaseClient(client);
        }
    }
    /**
     * Vytvorí podiel investora
     */
    async createCompanyInvestorShare(shareData) {
        return this.executeTransaction(async (client) => {
            const result = await client.query(`INSERT INTO company_investor_shares (
          company_id, investor_id, ownership_percentage, investment_amount,
          investment_date, is_primary_contact, profit_share_percentage
        ) VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`, [
                shareData.companyId,
                shareData.investorId,
                shareData.ownershipPercentage,
                shareData.investmentAmount || null,
                shareData.investmentDate,
                shareData.isPrimaryContact || false,
                shareData.profitSharePercentage || shareData.ownershipPercentage
            ]);
            return this.mapRowToCompanyInvestorShare(result.rows[0]);
        });
    }
    /**
     * Aktualizuje podiel investora
     */
    async updateCompanyInvestorShare(id, updateData) {
        const client = await this.getClient();
        try {
            const fields = [];
            const values = [];
            let paramIndex = 1;
            Object.entries(updateData).forEach(([key, value]) => {
                const dbField = this.camelToSnake(key);
                fields.push(`${dbField} = $${paramIndex}`);
                values.push(value);
                paramIndex++;
            });
            if (fields.length === 0)
                return;
            values.push(id);
            const query = `UPDATE company_investor_shares SET ${fields.join(', ')} WHERE id = $${paramIndex}`;
            await client.query(query, values);
        }
        finally {
            this.releaseClient(client);
        }
    }
    /**
     * Zmaže podiel investora
     */
    async deleteCompanyInvestorShare(id) {
        const client = await this.getClient();
        try {
            await client.query('DELETE FROM company_investor_shares WHERE id = $1', [id]);
        }
        finally {
            this.releaseClient(client);
        }
    }
    // ============================================================================
    // COMPANY DOCUMENT METHODS
    // ============================================================================
    /**
     * Vytvorí dokument firmy
     */
    async createCompanyDocument(document) {
        const client = await this.getClient();
        try {
            const query = `
        INSERT INTO company_documents (
          company_id, document_type, document_month, document_year,
          document_name, description, file_path, file_size, file_type,
          original_filename, created_by
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
        RETURNING *
      `;
            const result = await client.query(query, [
                document.companyId,
                document.documentType,
                document.documentMonth || null,
                document.documentYear || null,
                document.documentName,
                document.description || null,
                document.filePath,
                document.fileSize || null,
                document.fileType || null,
                document.originalFilename || null,
                document.createdBy || null
            ]);
            return this.mapRowToCompanyDocument(result.rows[0]);
        }
        finally {
            this.releaseClient(client);
        }
    }
    /**
     * Získa dokumenty firmy
     */
    async getCompanyDocuments(companyId, documentType, year, month) {
        const client = await this.getClient();
        try {
            let query = 'SELECT * FROM company_documents WHERE company_id = $1';
            const params = [companyId];
            let paramIndex = 2;
            if (documentType) {
                query += ` AND document_type = $${paramIndex}`;
                params.push(documentType);
                paramIndex++;
            }
            if (year) {
                query += ` AND document_year = $${paramIndex}`;
                params.push(year);
                paramIndex++;
            }
            if (month) {
                query += ` AND document_month = $${paramIndex}`;
                params.push(month);
                paramIndex++;
            }
            query += ' ORDER BY created_at DESC';
            const result = await client.query(query, params);
            return result.rows.map(row => this.mapRowToCompanyDocument(row));
        }
        finally {
            this.releaseClient(client);
        }
    }
    /**
     * Získa dokument firmy podľa ID
     */
    async getCompanyDocumentById(documentId) {
        const client = await this.getClient();
        try {
            const query = `SELECT * FROM company_documents WHERE id = $1`;
            const result = await client.query(query, [documentId]);
            if (result.rows.length === 0) {
                return null;
            }
            return this.mapRowToCompanyDocument(result.rows[0]);
        }
        finally {
            this.releaseClient(client);
        }
    }
    /**
     * Zmaže dokument firmy
     */
    async deleteCompanyDocument(documentId) {
        const client = await this.getClient();
        try {
            const query = `DELETE FROM company_documents WHERE id = $1`;
            await client.query(query, [documentId]);
        }
        finally {
            this.releaseClient(client);
        }
    }
    /**
     * Získa dokumenty firmy podľa typu
     */
    async getCompanyDocumentsByType(companyId, documentType) {
        return this.getCompanyDocuments(companyId, documentType);
    }
    /**
     * Získa faktúry firmy podľa mesiaca
     */
    async getCompanyInvoicesByMonth(companyId, year, month) {
        return this.getCompanyDocuments(companyId, 'invoice', year, month);
    }
    // ============================================================================
    // HELPER METHODS
    // ============================================================================
    /**
     * Mapuje databázový riadok na Company objekt
     */
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    mapRowToCompany(row) {
        return {
            id: String(row.id),
            name: String(row.name),
            businessId: row.business_id ? String(row.business_id) : undefined,
            taxId: row.tax_id ? String(row.tax_id) : undefined,
            address: row.address ? String(row.address) : undefined,
            contactPerson: row.contact_person ? String(row.contact_person) : undefined,
            email: row.email ? String(row.email) : undefined,
            phone: row.phone ? String(row.phone) : undefined,
            contractStartDate: row.contract_start_date ? new Date(row.contract_start_date) : undefined,
            contractEndDate: row.contract_end_date ? new Date(row.contract_end_date) : undefined,
            commissionRate: Number(row.commission_rate || 20),
            isActive: Boolean(row.is_active),
            createdAt: new Date(row.created_at),
            updatedAt: row.updated_at ? new Date(row.updated_at) : undefined,
            personalIban: row.personal_iban ? String(row.personal_iban) : undefined,
            businessIban: row.business_iban ? String(row.business_iban) : undefined
        };
    }
    /**
     * Mapuje databázový riadok na CompanyInvestor objekt
     */
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    mapRowToCompanyInvestor(row) {
        return {
            id: row.id,
            firstName: row.first_name,
            lastName: row.last_name,
            email: row.email || undefined,
            phone: row.phone || undefined,
            personalId: row.personal_id || undefined,
            address: row.address || undefined,
            isActive: Boolean(row.is_active),
            notes: row.notes || undefined,
            createdAt: new Date(row.created_at),
            updatedAt: row.updated_at ? new Date(row.updated_at) : undefined
        };
    }
    /**
     * Mapuje databázový riadok na CompanyInvestorShare objekt
     */
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    mapRowToCompanyInvestorShare(row) {
        return {
            id: row.id,
            companyId: row.company_id,
            investorId: row.investor_id,
            ownershipPercentage: row.ownership_percentage,
            investmentAmount: row.investment_amount || undefined,
            investmentDate: new Date(row.investment_date),
            isPrimaryContact: Boolean(row.is_primary_contact),
            profitSharePercentage: row.profit_share_percentage || undefined,
            createdAt: new Date(row.created_at),
            // Rozšírené info ak je dostupné
            investor: row.first_name ? {
                id: row.investor_id,
                firstName: row.first_name,
                lastName: row.last_name,
                email: row.email || undefined,
                phone: row.phone || undefined,
                personalId: undefined,
                address: undefined,
                isActive: true,
                createdAt: new Date(),
            } : undefined,
            company: row.company_name ? {
                id: row.company_id,
                name: row.company_name,
                commissionRate: 20,
                isActive: true,
                createdAt: new Date(),
            } : undefined
        };
    }
    /**
     * Mapuje databázový riadok na CompanyDocument objekt
     */
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    mapRowToCompanyDocument(row) {
        return {
            id: row.id,
            companyId: row.company_id,
            documentType: row.document_type,
            documentMonth: row.document_month || undefined,
            documentYear: row.document_year || undefined,
            documentName: row.document_name,
            description: row.description || undefined,
            filePath: row.file_path,
            fileSize: row.file_size || undefined,
            fileType: row.file_type || undefined,
            originalFilename: row.original_filename || undefined,
            createdAt: new Date(row.created_at),
            updatedAt: row.updated_at ? new Date(row.updated_at) : new Date(row.created_at),
            createdBy: row.created_by || undefined
        };
    }
    /**
     * Konvertuje camelCase na snake_case
     */
    camelToSnake(str) {
        return str.replace(/[A-Z]/g, letter => `_${letter.toLowerCase()}`);
    }
}
exports.CompanyRepository = CompanyRepository;
//# sourceMappingURL=CompanyRepository.js.map