// Test konkrétneho dátumu 2025-09-03T09:00:00.000Z
console.log('🧪 Test dátumu: 2025-09-03T09:00:00.000Z');

// Simulácia parseDate funkcie z RentalExport.tsx (opravená verzia)
const parseDate = (dateStr) => {
  if (!dateStr) return new Date();

  // Skúsi ISO 8601 formát (YYYY-MM-DDTHH:mm:ss.sssZ alebo YYYY-MM-DD)
  if (dateStr.includes('-') || dateStr.includes('T')) {
    const isoDate = new Date(dateStr);
    if (!isNaN(isoDate.getTime())) {
      console.log(`📅 Pôvodný ISO dátum: ${isoDate.toISOString()}`);
      console.log(`📅 Lokálny čas: ${isoDate.toLocaleString('sk-SK', { timeZone: 'Europe/Bratislava' })}`);
      
      // ✅ OPRAVENÉ: Extrahuje dátum z UTC času, nie lokálneho
      const result = new Date(
        Date.UTC(
          isoDate.getUTCFullYear(),
          isoDate.getUTCMonth(),
          isoDate.getUTCDate()
        )
      );
      
      console.log(`📅 Výsledný dátum (UTC): ${result.toISOString()}`);
      console.log(`📅 Výsledný dátum (SK): ${result.toLocaleDateString('sk-SK')}`);
      
      return result;
    }
  }

  return new Date();
};

// Test konkrétneho dátumu
const testDate = '2025-09-03T09:00:00.000Z';
console.log(`\n🔍 Input: "${testDate}"`);

const parsed = parseDate(testDate);

console.log(`\n✅ Finálny výsledok:`);
console.log(`   ISO: ${parsed.toISOString()}`);
console.log(`   SK formát: ${parsed.toLocaleDateString('sk-SK')}`);
console.log(`   Deň v týždni: ${parsed.toLocaleDateString('sk-SK', { weekday: 'long' })}`);

// Porovnanie s pôvodnou (chybnou) verziou
console.log(`\n🔄 Porovnanie s pôvodnou verziou:`);
const originalDate = new Date(testDate);
const wrongResult = new Date(
  Date.UTC(
    originalDate.getFullYear(),    // Chybná verzia - lokálny čas
    originalDate.getMonth(),       // Chybná verzia - lokálny čas  
    originalDate.getDate()         // Chybná verzia - lokálny čas
  )
);
console.log(`   Pôvodná (chybná): ${wrongResult.toISOString()} (${wrongResult.toLocaleDateString('sk-SK')})`);
console.log(`   Opravená: ${parsed.toISOString()} (${parsed.toLocaleDateString('sk-SK')})`);
