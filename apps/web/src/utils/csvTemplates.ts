// ✅ FÁZA 5.2: CSV Template helpers
import { saveAs } from 'file-saver';

/**
 * Vygeneruje a stiahne CSV template pre expense import
 */
export function downloadExpenseCSVTemplate() {
  const template = [
    // Header
    [
      'ID',
      'Popis*',
      'Suma',
      'Dátum',
      'Kategória',
      'Firma*',
      'Vozidlo ID',
      'ŠPZ',
      'Poznámka',
    ],
    // Príklad 1 - Servis
    [
      '',
      'Výmena oleja BMW X5',
      '150.50',
      '15.01.2025',
      'service',
      'Black Holding',
      '',
      '1AA2345',
      'Motorový olej 5W30',
    ],
    // Príklad 2 - Tankovanie
    [
      '',
      'Tankovanie',
      '80.00',
      '16.01.2025',
      'fuel',
      'Black Holding',
      '',
      '1AA2345',
      'Plná nádrž',
    ],
    // Príklad 3 - Poistenie
    [
      '',
      'Havarijné poistenie',
      '450.00',
      '01/2025',
      'insurance',
      'Black Holding',
      '',
      '',
      'Mesačná platba',
    ],
    // Prázdny riadok pre používateľa
    ['', '', '', '', '', '', '', '', ''],
  ];

  // Convert to CSV string
  const csvContent = template
    .map(row => row.map(field => `"${field}"`).join(','))
    .join('\n');

  // Create blob with BOM for Excel compatibility
  const blob = new Blob(['\ufeff' + csvContent], {
    type: 'text/csv;charset=utf-8;',
  });

  // Download
  const filename = `naklady-vzor-${new Date().toISOString().split('T')[0]}.csv`;
  saveAs(blob, filename);
}

/**
 * Získa inštrukcie pre CSV import
 */
export function getCSVImportInstructions(): string {
  return `
📋 INŠTRUKCIE PRE CSV IMPORT:

1. FORMÁT DÁTUMU:
   - DD.MM.YYYY (napr. 15.01.2025)
   - MM/YYYY (napr. 01/2025)
   - YYYY-MM-DD (napr. 2025-01-15)

2. KATEGÓRIE:
   - service / servis / oprava
   - fuel / palivo / tankovanie
   - insurance / poistenie / kasko / pzp
   - other / iné / ostatné

3. POVINNÉ POLIA:
   - Popis (nesmie byť prázdny)
   - Firma (názov firmy)

4. VOLITEĽNÉ POLIA:
   - Suma (ak prázdne = 0)
   - Dátum (ak prázdne = dnes)
   - Kategória (ak prázdne = other)
   - Poznámka

5. TIPS:
   - Prvý riadok je hlavička (preskočí sa)
   - Používajte UTF-8 encoding
   - Excel: Uložiť ako → CSV UTF-8
  `.trim();
}
