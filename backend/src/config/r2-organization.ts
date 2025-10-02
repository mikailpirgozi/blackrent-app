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
export const R2_ORGANIZATION_CONFIG: R2OrganizationConfig = {
  // Template cesty: {year}/{month}/{company}/{vehicle}/{protocolType}/{protocolId}/{category}/{filename}
  pathTemplate: '{year}/{month}/{company}/{vehicle}/{protocolType}/{protocolId}/{category}/{filename}',
  
  // Kategórie súborov
  categories: {
    vehicle_photos: 'vehicle_photos',      // Fotky vozidla (exteriér, interiér)
    documents: 'documents',                // Doklady (TP, STK, DL)
    damages: 'damages',                    // Škody, defekty
    signatures: 'signatures',              // Podpisy
    pdf: 'pdf',                           // Finálne PDF protokoly
    videos: 'videos',                     // Video súbory
    other: 'other'                        // Ostatné súbory
  },
  
  // Mapping firiem (pre čistejšie názvy priečinkov)
  companyMapping: {
    'default': 'BlackRent',
    'BlackRent': 'BlackRent_Official',
    'Marko Rental': 'Marko_Rental',
    'Auto Slovakia': 'Auto_Slovakia',
    'Premium Cars': 'Premium_Cars',
    // Automaticky sa pridajú ďalšie firmy
  },
  
  // Format názvu vozidla
  vehicleNaming: {
    format: '{brand}_{model}_{licensePlate}',  // BMW_X5_BA123AB
    separator: '_'
  },
  
  // Formát dátumu
  dateFormat: 'YYYY/MM',  // 2025/01
  
  // Maximálna dĺžka cesty (R2 limit)
  maxPathLength: 1024
};

/**
 * 🛠️ UTILITY FUNKCIE PRE PRÁCU S ORGANIZÁCIOU
 */
export class R2OrganizationManager {
  private config: R2OrganizationConfig;
  
  constructor(config = R2_ORGANIZATION_CONFIG) {
    this.config = config;
  }
  
  /**
   * Generuje R2 cestu z template
   */
  generatePath(variables: PathVariables): string {
    let path = this.config.pathTemplate;
    
    // Nahradenie premenných v template
    for (const [key, value] of Object.entries(variables)) {
      const placeholder = `{${key}}`;
      path = path.replace(new RegExp(placeholder, 'g'), this.sanitizePathComponent(value));
    }
    
    // Kontrola dĺžky
    if (path.length > this.config.maxPathLength) {
      console.warn(`⚠️ Generated path too long (${path.length}/${this.config.maxPathLength}):`, path);
      // Skrátiť cestu ak je potrebné
      path = this.truncatePath(path);
    }
    
    return path;
  }
  
  /**
   * Sanitizuje komponent cesty (odstráni nepovolené znaky)
   */
  private sanitizePathComponent(component: string): string {
    return component
      .replace(/[^a-zA-Z0-9\-_.]/g, '_')  // Nahradiť nepovolené znaky
      .replace(/_{2,}/g, '_')             // Nahradiť viacnásobné podčiarkovníky
      .replace(/^_|_$/g, '');             // Odstrániť podčiarkovníky na začiatku/konci
  }
  
  /**
   * Skráti cestu ak je príliš dlhá
   */
  private truncatePath(path: string): string {
    const maxLength = this.config.maxPathLength;
    if (path.length <= maxLength) return path;
    
    // Zachovaj filename a skráti stredné časti
    const parts = path.split('/');
    const filename = parts.pop();
    const beginning = parts.slice(0, 3).join('/');  // year/month/company
    const end = parts.slice(-2).join('/');          // protocolType/protocolId
    
    const truncated = `${beginning}/${end}/${filename}`;
    
    if (truncated.length > maxLength) {
      // Ak je stále príliš dlhé, skráti filename
      const filenameWithoutExt = filename?.split('.')[0] || 'file';
      const extension = filename?.split('.').pop() || '';
      const maxFilenameLength = maxLength - truncated.length + (filename?.length || 0) - 20;
      const shortFilename = `${filenameWithoutExt.substring(0, maxFilenameLength)}.${extension}`;
      return truncated.replace(filename || '', shortFilename);
    }
    
    return truncated;
  }
  
  /**
   * Získa názov firmy z mappingu
   */
  getCompanyName(originalName: string): string {
    return this.config.companyMapping[originalName] || 
           this.sanitizePathComponent(originalName);
  }
  
  /**
   * Generuje názov vozidla
   */
  generateVehicleName(brand: string, model: string, licensePlate: string): string {
    const format = this.config.vehicleNaming.format;
    return format
      .replace('{brand}', this.sanitizePathComponent(brand))
      .replace('{model}', this.sanitizePathComponent(model))
      .replace('{licensePlate}', this.sanitizePathComponent(licensePlate));
  }
  
  /**
   * Generuje dátumové komponenty
   */
  generateDateComponents(date: Date = new Date()): { year: string; month: string; day?: string } {
    const year = date.getFullYear().toString();
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const day = date.getDate().toString().padStart(2, '0');
    
    return { year, month, day };
  }
  
  /**
   * Validuje kategóriu súboru
   */
  validateCategory(category: string): boolean {
    return Object.values(this.config.categories).includes(category);
  }
  
  /**
   * Určí kategóriu na základe názvu súboru a typu
   */
  detectCategory(filename: string, mediaType?: string): string {
    const lowerFilename = filename.toLowerCase();
    
    // PDF súbory
    if (lowerFilename.endsWith('.pdf')) {
      return this.config.categories.pdf;
    }
    
    // Video súbory
    if (lowerFilename.match(/\.(mp4|avi|mov|mkv|webm)$/)) {
      return this.config.categories.videos;
    }
    
    // Na základe media typu z frontendu
    if (mediaType) {
      const mediaTypeMap: Record<string, string> = {
        'vehicle': this.config.categories.vehicle_photos,
        'document': this.config.categories.documents,
        'damage': this.config.categories.damages,
        'signature': this.config.categories.signatures,
        'other': this.config.categories.other
      };
      
      if (mediaTypeMap[mediaType]) {
        return mediaTypeMap[mediaType];
      }
    }
    
    // Default pre obrázky
    if (lowerFilename.match(/\.(jpg|jpeg|png|gif|webp)$/)) {
      return this.config.categories.vehicle_photos;
    }
    
    return this.config.categories.other;
  }
  
  /**
   * Aktualizuje konfiguráciu (pre admin UI)
   */
  updateConfig(newConfig: Partial<R2OrganizationConfig>): void {
    this.config = { ...this.config, ...newConfig };
  }
  
  /**
   * Exportuje aktuálnu konfiguráciu
   */
  getConfig(): R2OrganizationConfig {
    return { ...this.config };
  }
}

// Globálna inštancia
export const r2OrganizationManager = new R2OrganizationManager();

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