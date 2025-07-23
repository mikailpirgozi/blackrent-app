import { HandoverProtocol, ReturnProtocol } from '../types';
/**
 * PDF-lib Unicode Generator - Plná podpora slovenskej diakritiky
 * Používa custom TTF fonty cez fontkit pre perfektný text rendering
 */
export declare class PDFLibUnicodeGenerator {
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
     * Generovanie handover protokolu s Unicode podporou
     */
    generateHandoverProtocol(protocol: HandoverProtocol): Promise<Buffer>;
    /**
     * Generovanie return protokolu
     */
    generateReturnProtocol(protocol: ReturnProtocol): Promise<Buffer>;
    /**
   * Načítanie Unicode fontov
   */
    private loadUnicodeFonts;
    /**
   * Použitie default PDF fontov (lepšia Unicode podpora)
   */
    private useDefaultPDFFont;
    /**
     * Header s Unicode podporou
     */
    private addUnicodeHeader;
    /**
     * Informačná sekcia s Unicode
     */
    private addInfoSection;
    /**
     * Sekcia pre poškodenia s diakritiku
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
     * Poznámky s Unicode wrappingom
     */
    private addNotesSection;
    /**
     * Footer s diakritiku
     */
    private addUnicodeFooter;
    private checkPageBreak;
    /**
     * Unicode text wrapping (zachováva diakritiku)
     */
    private wrapUnicodeText;
    /**
     * Odhad šírky Unicode textu
     */
    private estimateTextWidth;
    private getStatusText;
}
//# sourceMappingURL=pdf-lib-unicode-generator.d.ts.map