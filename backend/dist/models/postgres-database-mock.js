"use strict";
/**
 * Mock PostgreSQL Database pre testy
 * Simuluje databázové operácie bez skutočnej databázy
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.getDatabase = exports.MockPostgresDatabase = void 0;
class MockPostgresDatabase {
    constructor() {
        this.mockData = new Map();
        console.log('🧪 Using Mock PostgreSQL Database for tests');
        this.initializeMockData();
    }
    initializeMockData() {
        // Inicializujeme mock tabuľky
        this.mockData.set('vehicles', []);
        this.mockData.set('customers', []);
        this.mockData.set('rentals', []);
        this.mockData.set('protocols_v2', []);
        this.mockData.set('protocol_photos_v2', []);
        this.mockData.set('protocol_manifests_v2', []);
    }
    async query(sql, params = []) {
        // Mock query implementation
        console.log('Mock query:', sql.substring(0, 50) + '...');
        // Simulujeme úspešné odpovede pre rôzne queries
        if (sql.includes('SELECT')) {
            return { rows: [], rowCount: 0 };
        }
        if (sql.includes('INSERT')) {
            return { rows: [{ id: 'mock-id-' + Date.now() }], rowCount: 1 };
        }
        if (sql.includes('UPDATE')) {
            return { rows: [], rowCount: 1 };
        }
        if (sql.includes('DELETE')) {
            return { rows: [], rowCount: 1 };
        }
        if (sql.includes('CREATE TABLE')) {
            return { rows: [], rowCount: 0 };
        }
        return { rows: [], rowCount: 0 };
    }
    async getAllVehicles() {
        return this.mockData.get('vehicles') || [];
    }
    async getAllCustomers() {
        return this.mockData.get('customers') || [];
    }
    async getAllRentals() {
        return this.mockData.get('rentals') || [];
    }
    async getProtocolById(id) {
        const protocols = this.mockData.get('protocols_v2') || [];
        return protocols.find(p => p.id === id) || null;
    }
    async createProtocol(data) {
        const protocol = {
            id: 'mock-protocol-' + Date.now(),
            ...data,
            created_at: new Date()
        };
        const protocols = this.mockData.get('protocols_v2') || [];
        protocols.push(protocol);
        this.mockData.set('protocols_v2', protocols);
        return protocol;
    }
    async close() {
        console.log('🧪 Mock database connection closed');
    }
}
exports.MockPostgresDatabase = MockPostgresDatabase;
// Export singleton instance pre testy
let postgresDatabase = null;
const getDatabase = () => {
    if (!postgresDatabase) {
        postgresDatabase = new MockPostgresDatabase();
    }
    return postgresDatabase;
};
exports.getDatabase = getDatabase;
//# sourceMappingURL=postgres-database-mock.js.map