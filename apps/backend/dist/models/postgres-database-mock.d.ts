/**
 * Mock PostgreSQL Database pre testy
 * Simuluje databázové operácie bez skutočnej databázy
 */
export declare class MockPostgresDatabase {
    private mockData;
    constructor();
    private initializeMockData;
    query(sql: string, params?: any[]): Promise<any>;
    getAllVehicles(): Promise<any[]>;
    getAllCustomers(): Promise<any[]>;
    getAllRentals(): Promise<any[]>;
    getProtocolById(id: string): Promise<any>;
    createProtocol(data: any): Promise<any>;
    close(): Promise<void>;
}
export declare const getDatabase: () => MockPostgresDatabase;
//# sourceMappingURL=postgres-database-mock.d.ts.map