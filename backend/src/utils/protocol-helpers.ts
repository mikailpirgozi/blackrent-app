/**
 * Protocol Helper Functions
 * Funkcie pre správne zobrazenie firiem na protokoloch
 */

/**
 * Mapovanie interných názvov firiem na oficiálne názvy pre protokoly
 */
const COMPANY_PROTOCOL_MAPPING: Record<string, string> = {
  '3ple digit': 'P2 invest s.r.o.',
  'Ado a miro': 'Finance cars s.r.o.',
  'Ado Miro': 'Finance cars s.r.o.' // ✅ PRIDANÉ: Mapovanie pre Ado Miro (bez "a")
  // Môžeme pridať ďalšie mapovanie podľa potreby
};

/**
 * Získanie oficiálneho názvu firmy pre zobrazenie na protokoloch
 * @param internalCompanyName - Interný názov firmy (napr. "3ple digit") ALEBO company objekt
 * @param companyObject - Voliteľný company objekt s protocolDisplayName
 * @returns Oficiálny názov pre protokoly (napr. "P2 invest s.r.o.")
 */
export function getProtocolCompanyDisplay(
  internalCompanyName: string | undefined | { protocolDisplayName?: string; name?: string },
  companyObject?: { protocolDisplayName?: string; name?: string }
): string {
  // Ak je prvý parameter objekt, použiť ho
  if (typeof internalCompanyName === 'object' && internalCompanyName) {
    // Priorita: protocolDisplayName > name
    if (internalCompanyName.protocolDisplayName) {
      console.log(`📋 Using protocolDisplayName: "${internalCompanyName.protocolDisplayName}"`);
      return internalCompanyName.protocolDisplayName;
    }
    if (internalCompanyName.name) {
      // Skús mapovanie
      const officialName = COMPANY_PROTOCOL_MAPPING[internalCompanyName.name];
      if (officialName) {
        console.log(`📋 Protocol mapping: "${internalCompanyName.name}" → "${officialName}"`);
        return officialName;
      }
      return internalCompanyName.name;
    }
    return 'N/A';
  }
  
  // Ak je poskytnutý company objekt, použiť protocolDisplayName
  if (companyObject?.protocolDisplayName) {
    console.log(`📋 Using protocolDisplayName from company object: "${companyObject.protocolDisplayName}"`);
    return companyObject.protocolDisplayName;
  }
  
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
export const PROTOCOL_REPRESENTATIVE = 'v zastúpení spoločnosťou Black Holding s.r.o. na základe plnej moci';

/**
 * Pridanie sekcie zastúpenia do protokolu (helper pre PDF generátory)
 */
export function getRepresentativeSection(): Array<[string, string]> {
  return [
    ['Zastúpenie:', PROTOCOL_REPRESENTATIVE]
  ];
}

/**
 * Získanie kompletných informácií o firme pre protokol
 */
export function getProtocolCompanyInfo(internalCompanyName: string | undefined) {
  return {
    displayName: getProtocolCompanyDisplay(internalCompanyName),
    representative: PROTOCOL_REPRESENTATIVE,
    internalName: internalCompanyName
  };
}
