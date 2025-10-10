const { Client } = require('pg');

console.log('🔄 SPÁJANIE DUPLICITNÝCH ZÁKAZNÍKOV...\n');

// Databázové pripojenie
const client = new Client({
  host: 'trolley.proxy.rlwy.net',
  port: 13400,
  database: 'railway',
  user: 'postgres',
  password: 'nfwrpKxILRUMqunYTZJEhjudEstqLRGv'
});

// Skupiny na spojenie (bez Rožar/Požar, Kovač/Koval, Ševček/Ševčík)
const mergeGroups = [
  // Skupina 1: Abikova
  { keep: 4, merge: [72], name: 'Abiková' },
  
  // Skupina 2: Bobot
  { keep: 22, merge: [390], name: 'Bobot' },
  
  // Skupina 3: Beňo (3 záznamy)
  { keep: 196, merge: [348, 392], name: 'Beňo' },
  
  // Skupina 4: Červený
  { keep: 108, merge: [229], name: 'Červený' },
  
  // Skupina 5: Červienka
  { keep: 111, merge: [383], name: 'Červienka' },
  
  // Skupina 6: Danczi
  { keep: 239, merge: [377], name: 'Danczi' },
  
  // Skupina 7: Eurocover
  { keep: 38, merge: [369], name: 'Eurocover' },
  
  // Skupina 8: Fedor (3 záznamy)
  { keep: 323, merge: [358, 364], name: 'Fedor' },
  
  // Skupina 9: Habšuda
  { keep: 136, merge: [206, 366], name: 'Habšuda' },
  
  // Skupina 10: Ital (3 záznamy)
  { keep: 301, merge: [356, 368], name: 'Ital' },
  
  // Skupina 11: Jaroš
  { keep: 9, merge: [246], name: 'Jaroš' },
  
  // Skupina 12: Juhasova (pozor na Juhosova - môže byť iný)
  { keep: 92, merge: [133, 384], name: 'Juhosova' },
  
  // Skupina 13: Jurík (3 záznamy)
  { keep: 223, merge: [349, 389], name: 'Jurík' },
  
  // Skupina 14: Jurista (4 záznamy)
  { keep: 33, merge: [184, 347, 362], name: 'Jurista' },
  
  // Skupina 15: Kačáni
  { keep: 119, merge: [207], name: 'Kačáni' },
  
  // Skupina 16: Knob (3 záznamy)
  { keep: 236, merge: [351, 386], name: 'Knob' },
  
  // Skupina 17: Kollárik
  { keep: 7, merge: [16, 46], name: 'Kollárik' },
  
  // Skupina 18: Korpaš
  { keep: 268, merge: [374], name: 'Korpaš' },
  
  // Skupina 20: Krišková
  { keep: 32, merge: [85], name: 'Krišková' },
  
  // Skupina 21: Kukula
  { keep: 341, merge: [360], name: 'Kukula' },
  
  // Skupina 22: Manczal (3 záznamy)
  { keep: 233, merge: [350, 387], name: 'Manczal' },
  
  // Skupina 23: Marešova (3 záznamy)
  { keep: 290, merge: [355, 372], name: 'Marešova' },
  
  // Skupina 24: Mizerák
  { keep: 93, merge: [248], name: 'Mizerák' },
  
  // Skupina 25: Mutňanský
  { keep: 129, merge: [181], name: 'Mutňanský' },
  
  // Skupina 26: Nemec
  { keep: 29, merge: [378], name: 'Nemec' },
  
  // Skupina 27: Onder
  { keep: 122, merge: [370], name: 'Onder' },
  
  // Skupina 28: Pastorek
  { keep: 99, merge: [375], name: 'Pastorek' },
  
  // Skupina 30: Rakovan
  { keep: 132, merge: [361], name: 'Rakovan' },
  
  // Skupina 31: Rytmus
  { keep: 296, merge: [365], name: 'Rytmus' },
  
  // Skupina 33: Sitár (3 záznamy)
  { keep: 278, merge: [354, 373], name: 'Sitár' },
  
  // Skupina 34: Smolka (3 záznamy)
  { keep: 261, merge: [353, 381], name: 'Smolka' },
  
  // Skupina 35: Stupňan
  { keep: 126, merge: [231], name: 'Stupňan' },
  
  // Skupina 36: Surmánek (3 záznamy)
  { keep: 252, merge: [352, 385], name: 'Surmánek' },
  
  // Skupina 37: Trebatický
  { keep: 230, merge: [256], name: 'Trebatický' },
  
  // Skupina 38: Vinco
  { keep: 60, merge: [393], name: 'Vinco' },
  
  // Skupina 39: Vrubel
  { keep: 263, merge: [371], name: 'Vrubel' },
  
  // Skupina 40: Zachara
  { keep: 125, merge: [382], name: 'Zachara' },
  
  // Skupina 41: Zavoczki
  { keep: 110, merge: [391], name: 'Zavoczki' },
  
  // Skupina 42: Zemanovič
  { keep: 21, merge: [388], name: 'Zemanovič' },
  
  // Skupina 43: Žemberi
  { keep: 232, merge: [285], name: 'Žemberi' }
];

async function mergeDuplicateCustomers() {
  try {
    await client.connect();
    console.log('✅ Pripojený k databáze\n');
    
    let totalMerged = 0;
    let totalDeleted = 0;
    
    for (const group of mergeGroups) {
      console.log(`🔄 Spracúvam skupinu: ${group.name}`);
      console.log(`   Hlavný záznam: ID ${group.keep}`);
      console.log(`   Spájam záznamy: ID ${group.merge.join(', ')}`);
      
      // 1. Aktualizuj všetky prenájmy z duplicitných zákazníkov na hlavný záznam
      for (const duplicateId of group.merge) {
        const updateResult = await client.query(
          'UPDATE rentals SET customer_id = $1 WHERE customer_id = $2',
          [group.keep, duplicateId]
        );
        
        if (updateResult.rowCount > 0) {
          console.log(`   ✅ Presmerovaných ${updateResult.rowCount} prenájmov z ID ${duplicateId} na ID ${group.keep}`);
          totalMerged += updateResult.rowCount;
        }
      }
      
      // 2. Zmaž duplicitné záznamy zákazníkov
      for (const duplicateId of group.merge) {
        const deleteResult = await client.query(
          'DELETE FROM customers WHERE id = $1',
          [duplicateId]
        );
        
        if (deleteResult.rowCount > 0) {
          console.log(`   🗑️ Zmazaný duplicitný záznam ID ${duplicateId}`);
          totalDeleted++;
        }
      }
      
      // 3. Aktualizuj meno hlavného záznamu (pre prípad že mal zlú diakritiku)
      await client.query(
        'UPDATE customers SET name = $1 WHERE id = $2',
        [group.name, group.keep]
      );
      
      console.log(`   ✅ Skupina ${group.name} dokončená\n`);
    }
    
    console.log('🎉 SPÁJANIE DOKONČENÉ!');
    console.log(`📊 ŠTATISTIKY:`);
    console.log(`   • Spracovaných skupín: ${mergeGroups.length}`);
    console.log(`   • Presmerovaných prenájmov: ${totalMerged}`);
    console.log(`   • Zmazaných duplicitov: ${totalDeleted}`);
    
    // Overenie výsledkov
    const remainingCustomers = await client.query('SELECT COUNT(*) as count FROM customers');
    console.log(`   • Zostávajúcich zákazníkov: ${remainingCustomers.rows[0].count}`);
    
  } catch (error) {
    console.error('❌ Chyba pri spájaní:', error.message);
  } finally {
    await client.end();
    console.log('\n🔌 Odpojený od databázy');
  }
}

// Spusti spájanie
mergeDuplicateCustomers();
