import type { HandoverProtocol, ReturnProtocol } from '../types';
/**
 * Backend-kompatibilný Enhanced PDF Generator
 * Používa jsPDF namiesto pdfkit pre lepšie výsledky
 */
export declare class EnhancedPDFGeneratorBackend {
    private doc;
    private currentY;
    private pageWidth;
    private pageHeight;
    private margin;
    private primaryColor;
    private secondaryColor;
    constructor();
    /**
     * Generovanie handover protokolu s enhanced PDF
     */
    generateHandoverProtocol(protocol: HandoverProtocol): Promise<Buffer>;
    /**
     * Generovanie return protokolu
     */
    generateReturnProtocol(protocol: ReturnProtocol): Promise<Buffer>;
    /**
     * Enhanced záhlavie s moderným dizajnom
     */
    private addEnhancedHeader;
    /**
     * Informačný box s rámčekom
     */
    private addInfoBox;
    /**
     * Sekcia pre poškodenia
     */
    private addDamagesSection;
    /**
     * Súhrn médií
     */
    private addMediaSummary;
    /**
     * Sekcia pre podpisy (bez obrázkov)
     */
    private addSignaturesSection;
    /**
     * Sekcia pre poznámky
     */
    private addNotesSection;
    /**
     * Enhanced pätka
     */
    private addEnhancedFooter;
    /**
     * Kontrola prelomenia stránky
     */
    private checkPageBreak;
    /**
     * Získanie textu stavu
     */
    private getStatusText;
}
//# sourceMappingURL=enhanced-pdf-generator-backend.d.ts.map