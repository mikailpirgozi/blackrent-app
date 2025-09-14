/**
 * Protocol Helper Functions
 * Funkcie pre správne zobrazenie firiem na protokoloch
 */
/**
 * Získanie oficiálneho názvu firmy pre zobrazenie na protokoloch
 * @param internalCompanyName - Interný názov firmy (napr. "3ple digit")
 * @returns Oficiálny názov pre protokoly (napr. "P2 invest s.r.o.")
 */
export declare function getProtocolCompanyDisplay(internalCompanyName: string | undefined): string;
/**
 * Text zastúpenia ktorý sa zobrazuje na každom protokole
 */
export declare const PROTOCOL_REPRESENTATIVE = "v zast\u00FApen\u00ED spolo\u010Dnos\u0165ou Black Holding s.r.o. na z\u00E1klade plnej moci";
/**
 * Pridanie sekcie zastúpenia do protokolu (helper pre PDF generátory)
 */
export declare function getRepresentativeSection(): Array<[string, string]>;
/**
 * Získanie kompletných informácií o firme pre protokol
 */
export declare function getProtocolCompanyInfo(internalCompanyName: string | undefined): {
    displayName: string;
    representative: string;
    internalName: string | undefined;
};
//# sourceMappingURL=protocol-helpers.d.ts.map