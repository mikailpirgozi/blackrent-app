/**
 * 🗂️ BlackRent R2 Storage Organization Configuration
 *
 * Definuje hierarchickú štruktúru pre organizáciu súborov na Cloudflare R2
 */
export interface R2OrganizationConfig {
    pathTemplate: string;
    categories: Record<string, string>;
    companyMapping: Record<string, string>;
    vehicleNaming: {
        format: string;
        separator: string;
    };
    dateFormat: 'YYYY/MM' | 'YYYY/MM/DD' | 'YYYY-MM' | 'YYYY-MM-DD';
    maxPathLength: number;
}
export interface PathVariables {
    year: string;
    month: string;
    day?: string;
    company: string;
    vehicle: string;
    protocolType: 'handover' | 'return';
    protocolId: string;
    category: string;
    filename: string;
}
/**
 * 📁 AKTUÁLNA KONFIGURÁCIA (môže byť upravená cez admin UI)
 */
export declare const R2_ORGANIZATION_CONFIG: R2OrganizationConfig;
/**
 * 🛠️ UTILITY FUNKCIE PRE PRÁCU S ORGANIZÁCIOU
 */
export declare class R2OrganizationManager {
    private config;
    constructor(config?: R2OrganizationConfig);
    /**
     * Generuje R2 cestu z template
     */
    generatePath(variables: PathVariables): string;
    /**
     * Sanitizuje komponent cesty (odstráni nepovolené znaky)
     */
    private sanitizePathComponent;
    /**
     * Skráti cestu ak je príliš dlhá
     */
    private truncatePath;
    /**
     * Získa názov firmy z mappingu
     */
    getCompanyName(originalName: string): string;
    /**
     * Generuje názov vozidla
     */
    generateVehicleName(brand: string, model: string, licensePlate: string): string;
    /**
     * Generuje dátumové komponenty
     */
    generateDateComponents(date?: Date): {
        year: string;
        month: string;
        day?: string;
    };
    /**
     * Validuje kategóriu súboru
     */
    validateCategory(category: string): boolean;
    /**
     * Určí kategóriu na základe názvu súboru a typu
     */
    detectCategory(filename: string, mediaType?: string): string;
    /**
     * Aktualizuje konfiguráciu (pre admin UI)
     */
    updateConfig(newConfig: Partial<R2OrganizationConfig>): void;
    /**
     * Exportuje aktuálnu konfiguráciu
     */
    getConfig(): R2OrganizationConfig;
}
export declare const r2OrganizationManager: R2OrganizationManager;
/**
 * 📝 PRÍKLADY POUŽITIA:
 *
 * const variables = {
 *   year: '2025',
 *   month: '01',
 *   company: 'Marko_Rental',
 *   vehicle: 'BMW_X5_BA123AB',
 *   protocolType: 'handover',
 *   protocolId: 'abc-123-uuid',
 *   category: 'vehicle_photos',
 *   filename: 'exterior_front.jpg'
 * };
 *
 * const path = r2OrganizationManager.generatePath(variables);
 * // Result: "2025/01/Marko_Rental/BMW_X5_BA123AB/handover/abc-123-uuid/vehicle_photos/exterior_front.jpg"
 */ 
//# sourceMappingURL=r2-organization.d.ts.map