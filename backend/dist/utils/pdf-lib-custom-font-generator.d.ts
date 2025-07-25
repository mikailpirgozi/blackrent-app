import { HandoverProtocol, ReturnProtocol } from '../types';
/**
 * PDF-lib CUSTOM Font Generator - Používa vlastný font používateľa
 * Plná podpora slovenskej diakritiky s custom fontom
 */
export declare class PDFLibCustomFontGenerator {
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
    private customFontPath;
    private customBoldFontPath;
    private fontName;
    constructor(fontName?: string);
    /**
     * Nájde font súbor s podporou rôznych formátov
     */
    private findFontFile;
    /**
     * Generovanie handover protokolu s VLASTNÝM fontom
     */
    generateHandoverProtocol(protocol: HandoverProtocol): Promise<Buffer>;
    /**
     * Generovanie return protokolu
     */
    generateReturnProtocol(protocol: ReturnProtocol): Promise<Buffer>;
    /**
     * Načítanie vlastného fontu
     */
    private loadCustomFont;
    /**
     * Fallback na Roboto fonty ak vlastný font zlyhá
     */
    private loadRobotoFallback;
    /**
     * ✏️ JEDNODUCHÁ MINIMALISTICKÁ HLAVIČKA
     */
    private addCustomFontHeader;
    /**
     * 📋 JEDNODUCHÁ INFORMAČNÁ SEKCIA
     */
    private addInfoSection;
    /**
     * Sekcia pre poškodenia s vlastným fontom
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
     * Poznámky s vlastným fontom
     */
    private addNotesSection;
    /**
     * Footer s vlastným fontom
     */
    private addCustomFontFooter;
    private checkPageBreak;
    /**
     * Text wrapping s vlastným fontom
     */
    private wrapCustomFontText;
    /**
     * Odhad šírky textu pre vlastný font
     */
    private estimateCustomFontWidth;
    /**
     * Status text s vlastným fontom
     */
    private getStatusText;
    /**
     * 🖼️ Stiahnutie obrázka z R2 URL
     */
    private downloadImageFromR2;
    /**
     * 🖼️ Pridanie obrázkov do PDF pomocou pdf-lib - MODERNÝ DESIGN
     */
    private addImagesSection;
    /**
     * 🖼️ Helper pre jednoduchý grid placeholder
     */
    private addImagePlaceholderInGrid;
    /**
     * Helper pre posun v gride
     */
    private moveToNextGridPosition;
    /**
     * 🖼️ Placeholder pre chybný obrázok
     */
    private addImagePlaceholder;
}
//# sourceMappingURL=pdf-lib-custom-font-generator.d.ts.map