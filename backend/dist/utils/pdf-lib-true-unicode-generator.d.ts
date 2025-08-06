import { HandoverProtocol, ReturnProtocol } from '../types';
/**
 * PDF-lib TRUE Unicode Generator - Skutočná plná podpora slovenskej diakritiky
 * Používa embeddované Roboto fonty pre perfektný Slovak text rendering
 */
export declare class PDFLibTrueUnicodeGenerator {
    private doc;
    private currentY;
    private pageWidth;
    private pageHeight;
    private margin;
    private primaryColor;
    private secondaryColor;
    private lightGray;
    private currentPage;
    private font;
    private boldFont;
    constructor();
    /**
     * Generovanie handover protokolu s TRUE Unicode podporou
     */
    generateHandoverProtocol(protocol: HandoverProtocol): Promise<Buffer>;
    /**
     * Generovanie return protokolu
     */
    generateReturnProtocol(protocol: ReturnProtocol): Promise<Buffer>;
    /**
     * Načítanie embeddovaných Unicode fontov (Roboto)
     */
    private loadEmbeddedUnicodeFonts;
    /**
     * Fallback fonty ak embeddované nefungujú
     */
    private loadFallbackFonts;
    /**
     * Header s TRUE Unicode podporou
     */
    private addTrueUnicodeHeader;
    /**
     * Informačná sekcia s TRUE Unicode
     */
    private addInfoSection;
    /**
     * Sekcia pre poškodenia s plnou diakritiku
     */
    private addDamagesSection;
    /**
     * Súhrn médií
     */
    private addMediaSummary;
    /**
     * Sekcia pre podpisy
     */
    private addSignaturesSection;
    /**
     * Poznámky s TRUE Unicode wrappingom
     */
    private addNotesSection;
    /**
     * Footer s plnou diakritiku
     */
    private addTrueUnicodeFooter;
    private checkPageBreak;
    /**
     * TRUE Unicode text wrapping (zachováva všetku diakritiku)
     */
    private wrapTrueUnicodeText;
    /**
     * Odhad šírky TRUE Unicode textu
     */
    private estimateUnicodeTextWidth;
    /**
     * Status text s plnou diakritiku
     */
    private getStatusText;
}
//# sourceMappingURL=pdf-lib-true-unicode-generator.d.ts.map