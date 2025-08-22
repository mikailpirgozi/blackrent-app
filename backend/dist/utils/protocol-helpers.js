"use strict";
/**
 * Protocol Helper Functions
 * Funkcie pre správne zobrazenie firiem na protokoloch
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.PROTOCOL_REPRESENTATIVE = void 0;
exports.getProtocolCompanyDisplay = getProtocolCompanyDisplay;
exports.getRepresentativeSection = getRepresentativeSection;
exports.getProtocolCompanyInfo = getProtocolCompanyInfo;
/**
 * Mapovanie interných názvov firiem na oficiálne názvy pre protokoly
 */
const COMPANY_PROTOCOL_MAPPING = {
    '3ple digit': 'P2 invest s.r.o.',
    'Ado a miro': 'Finance cars s.r.o.',
    'Ado Miro': 'Finance cars s.r.o.' // ✅ PRIDANÉ: Mapovanie pre Ado Miro (bez "a")
    // Môžeme pridať ďalšie mapovanie podľa potreby
};
/**
 * Získanie oficiálneho názvu firmy pre zobrazenie na protokoloch
 * @param internalCompanyName - Interný názov firmy (napr. "3ple digit")
 * @returns Oficiálny názov pre protokoly (napr. "P2 invest s.r.o.")
 */
function getProtocolCompanyDisplay(internalCompanyName) {
    if (!internalCompanyName) {
        return 'N/A';
    }
    // Ak existuje mapovanie, použiť oficiálny názov
    const officialName = COMPANY_PROTOCOL_MAPPING[internalCompanyName];
    if (officialName) {
        console.log(`📋 Protocol mapping: "${internalCompanyName}" → "${officialName}"`);
        return officialName;
    }
    // Inak použiť pôvodný názov
    return internalCompanyName;
}
/**
 * Text zastúpenia ktorý sa zobrazuje na každom protokole
 */
exports.PROTOCOL_REPRESENTATIVE = 'v zastúpení spoločnosťou Black Holding s.r.o. na základe plnej moci';
/**
 * Pridanie sekcie zastúpenia do protokolu (helper pre PDF generátory)
 */
function getRepresentativeSection() {
    return [
        ['Zastúpenie:', exports.PROTOCOL_REPRESENTATIVE]
    ];
}
/**
 * Získanie kompletných informácií o firme pre protokol
 */
function getProtocolCompanyInfo(internalCompanyName) {
    return {
        displayName: getProtocolCompanyDisplay(internalCompanyName),
        representative: exports.PROTOCOL_REPRESENTATIVE,
        internalName: internalCompanyName
    };
}
//# sourceMappingURL=protocol-helpers.js.map