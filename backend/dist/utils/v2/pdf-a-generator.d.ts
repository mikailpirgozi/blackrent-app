/**
 * PDF/A Generator pre Protocol V2
 * Generuje PDF/A-1b kompatibilné protokoly s embedovanými obrázkami
 */
export interface PDFGenerationRequest {
    protocolId: string;
    protocolType: 'handover' | 'return';
    data: {
        vehicle: {
            licensePlate: string;
            brand: string;
            model: string;
            year: number;
            vin?: string;
        };
        customer: {
            firstName: string;
            lastName: string;
            email: string;
            phone?: string;
        };
        rental: {
            startDate: Date;
            endDate: Date;
            startKm: number;
            endKm?: number;
            location: string;
        };
        photos: Array<{
            photoId: string;
            url: string;
            description: string;
            category: 'exterior' | 'interior' | 'damage' | 'fuel' | 'other';
        }>;
        notes?: string;
        signature?: string;
    };
    userId?: string;
}
export interface PDFGenerationResult {
    success: boolean;
    pdfUrl?: string;
    pdfHash?: string;
    fileSize?: number;
    pageCount?: number;
    error?: string;
    processingTime?: number;
}
export declare class PDFAGenerator {
    private fontPath;
    constructor();
    /**
     * Hlavná funkcia pre generovanie PDF/A protokolu
     */
    generateProtocolPDF(request: PDFGenerationRequest): Promise<PDFGenerationResult>;
    /**
     * Generuje header protokolu
     */
    private generateHeader;
    /**
     * Generuje informácie o vozidle
     */
    private generateVehicleInfo;
    /**
     * Generuje informácie o zákazníkovi
     */
    private generateCustomerInfo;
    /**
     * Generuje informácie o prenájme
     */
    private generateRentalInfo;
    /**
     * Generuje sekciu s fotografiami
     */
    private generatePhotosSection;
    /**
     * Generuje sekciu s poznámkami
     */
    private generateNotesSection;
    /**
     * Generuje sekciu s podpisom
     */
    private generateSignatureSection;
    /**
     * Odhad počtu stránok
     */
    private estimatePageCount;
    /**
     * Validácia PDF/A kompatibility
     */
    validatePDFA(pdfBuffer: Buffer): Promise<{
        valid: boolean;
        errors?: string[];
        warnings?: string[];
    }>;
    /**
     * Optimalizácia PDF pre web
     */
    optimizePDF(pdfBuffer: Buffer): Promise<Buffer>;
    /**
     * Generovanie PDF preview (prvá stránka ako obrázok)
     */
    generatePreview(_pdfBuffer: Buffer): Promise<Buffer>;
}
//# sourceMappingURL=pdf-a-generator.d.ts.map