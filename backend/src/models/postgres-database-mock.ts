/**
 * Mock PostgreSQL Database pre testy
 * Simuluje databázové operácie bez skutočnej databázy
 */

export class MockPostgresDatabase {
  private mockData: Map<string, any[]> = new Map();

  constructor() {
    console.log('🧪 Using Mock PostgreSQL Database for tests');
    this.initializeMockData();
  }

  private initializeMockData() {
    // Inicializujeme mock tabuľky
    this.mockData.set('vehicles', []);
    this.mockData.set('customers', []);
    this.mockData.set('rentals', []);
    this.mockData.set('protocols_v2', []);
    this.mockData.set('protocol_photos_v2', []);
    this.mockData.set('protocol_manifests_v2', []);
  }

  async query(sql: string, params: Record<string, unknown>[] = []): Promise<any> {
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

  async getAllVehicles(): Promise<any[]> {
    return this.mockData.get('vehicles') || [];
  }

  async getAllCustomers(): Promise<any[]> {
    return this.mockData.get('customers') || [];
  }

  async getAllRentals(): Promise<any[]> {
    return this.mockData.get('rentals') || [];
  }

  async getProtocolById(id: string): Promise<any> {
    const protocols = this.mockData.get('protocols_v2') || [];
    return protocols.find(p => p.id === id) || null;
  }

  async createProtocol(data: Record<string, unknown>): Promise<any> {
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

  async close(): Promise<void> {
    console.log('🧪 Mock database connection closed');
  }
}

// Export singleton instance pre testy
let postgresDatabase: MockPostgresDatabase | null = null;

export const getDatabase = () => {
  if (!postgresDatabase) {
    postgresDatabase = new MockPostgresDatabase();
  }
  return postgresDatabase;
};
