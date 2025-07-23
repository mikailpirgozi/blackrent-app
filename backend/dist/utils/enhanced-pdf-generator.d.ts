import { ProcessedImage } from './image-processor';
export interface ProtocolData {
    id: string;
    type: 'handover' | 'return';
    rental: any;
    location: string;
    vehicleCondition: any;
    vehicleImages: ProcessedImage[];
    documentImages: ProcessedImage[];
    damageImages: ProcessedImage[];
    damages: any[];
    signatures: any[];
    notes: string;
    createdAt: Date;
    completedAt: Date;
}
export declare class EnhancedPDFGenerator {
    private doc;
    private currentY;
    private pageWidth;
    private pageHeight;
    private margin;
    private primaryColor;
    private secondaryColor;
    constructor();
    /**
     * Generovanie PDF s vloženými obrázkami (800px)
     */
    generateCustomerProtocol(protocol: ProtocolData): Promise<Blob>;
    /**
     * Pridanie záhlavia
     */
    private addHeader;
    /**
     * Pridanie základných informácií
     */
    private addBasicInfo;
    /**
     * Pridanie stavu vozidla
     */
    private addVehicleCondition;
    /**
     * Vloženie obrázkov priamo do PDF
     */
    private embedImages;
    /**
     * Vloženie podpisov priamo do PDF
     */
    private embedSignatures;
    /**
     * Pridanie škôd
     */
    private addDamages;
    /**
     * Pridanie poznámok
     */
    private addNotes;
    /**
     * Pridanie päty
     */
    private addFooter;
    /**
     * Pridanie názvu sekcie
     */
    private addSectionTitle;
    /**
     * Načítanie obrázka z URL alebo base64
     */
    private loadImageData;
    /**
     * Vytvorenie placeholder obrázka
     */
    private createImagePlaceholder;
    /**
     * Výpočet rozmerov obrázka
     */
    private calculateImageDimensions;
}
export default EnhancedPDFGenerator;
//# sourceMappingURL=enhanced-pdf-generator.d.ts.map