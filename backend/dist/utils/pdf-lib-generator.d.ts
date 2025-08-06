import { HandoverProtocol, ReturnProtocol, Settlement } from '../types';
/**
 * PDF-lib Generator - Vysoká kvalita PDF bez system dependencies
 * Produkuje profesionálne PDF dokumenty s lepšou typografiou
 */
export declare class PDFLibGenerator {
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
     * Generovanie handover protokolu s pdf-lib
     */
    generateHandoverProtocol(protocol: HandoverProtocol): Promise<Buffer>;
    /**
     * Generovanie return protokolu
     */
    generateReturnProtocol(protocol: ReturnProtocol): Promise<Buffer>;
    /**
     * Moderné záhlavie s profesionálnym dizajnom
     */
    private addModernHeader;
    /**
     * Informačná sekcia s moderným boxom
     */
    private addInfoSection;
    /**
     * Sekcia pre poškodenia
     */
    private addDamagesSection;
    /**
     * Súhrn médií
     */
    private addMediaSummary;
    /**
     * Sekcia pre podpisy s obrázkami
     */
    private addSignaturesSection;
    /**
     * Konverzia base64 na Uint8Array pre PDF-lib
     */
    private base64ToUint8Array;
    /**
     * Sekcia pre poznámky s lepším text wrappingom
     */
    private addNotesSection;
    /**
     * Moderná pätka s dizajnom
     */
    private addModernFooter;
    /**
     * Kontrola prelomenia stránky
     */
    private checkPageBreak;
    /**
     * Wrappovanie textu pre lepší layout
     */
    private wrapText;
    /**
     * Získanie textu stavu
     */
    private getStatusText;
    /**
     * Konvertuje slovenský text na ASCII (fallback pre PDF-lib font compatibility)
     */
    private toAsciiText;
    /**
     * NOVÉ: Sekcia pre zobrazenie obrázkov v PDF protokole
     */
    private addImagesSection;
    /**
     * Generovanie vyúčtovania PDF s pdf-lib (rovnaký štýl ako protokoly)
     */
    generateSettlement(settlement: Settlement): Promise<Buffer>;
}
//# sourceMappingURL=pdf-lib-generator.d.ts.map