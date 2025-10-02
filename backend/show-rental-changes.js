#!/usr/bin/env node

/**
 * Script na zobrazenie presných zmien ktoré chcem urobiť v prenájmoch
 */

const { Pool } = require('pg');

// PostgreSQL konfigurácia
const dbConfig = {
  host: 'trolley.proxy.rlwy.net',
  port: 13400,
  database: 'railway',
  user: 'postgres',
  password: 'nfwrpKxILRUMqunYTZJEhjudEstqLRGv',
  ssl: {
    rejectUnauthorized: false
  }
};

// Definícia zmien ktoré chcem urobiť (len platné objednávky)
const plannedChanges = [
  {
    id: 40,
    customerName: 'Samuel Čemeš',
    changes: {
      order_number: 'OBJ01925229',
      customer_email: 'cemessamuel4@gmail.com',
      customer_phone: '421910504222',
      daily_kilometers: 250
    },
    note: 'Platná objednávka (120€, vyššia cena kvôli extra km)'
  },
  {
    id: 37,
    customerName: 'Lukáš Zemanovic',
    changes: {
      order_number: 'OBJ01925231',
      customer_email: 'PvPCarlikPvP@gmail.com',
      customer_phone: '421918046103',
      daily_kilometers: 300,
      start_date: '2025-08-30 11:00:00',
      end_date: '2025-08-31 11:00:00'
    },
    note: 'Platná objednávka (85€, o deň dlhšie)'
  },
  {
    id: 18,
    customerName: 'Michal Rakovan',
    changes: {
      order_number: 'OBJ02825033',
      customer_email: 'michalrakovan.mr@gmail.com',
      customer_phone: '421903623995',
      daily_kilometers: 250,
      start_date: '2025-09-02 12:00:00',
      end_date: '2025-09-05 12:00:00'
    },
    note: 'Platná objednávka (585€)'
  },
  {
    id: 27,
    customerName: 'Filip Štadler',
    changes: {
      order_number: 'OBJ01925235',
      customer_email: 'Filipsuper70@gmail.com',
      customer_phone: '421948222752',
      daily_kilometers: 210,
      start_date: '2025-08-28 16:00:00',
      end_date: '2025-09-01 16:00:00'
    },
    note: 'Platná objednávka (200€)'
  },
  {
    id: 13,
    customerName: 'Lukáš Slávka',
    changes: {
      order_number: 'OBJ01925246',
      customer_email: 'slavkalukas11@gmail.com',
      customer_phone: '421907097359',
      daily_kilometers: 250,
      start_date: '2025-09-03 14:00:00',
      end_date: '2025-09-05 14:00:00'
    },
    note: 'Platná objednávka (150€)'
  },
  {
    id: 17,
    customerName: 'EUROCOVER Slovakia, s.r.o.',
    changes: {
      order_number: 'OBJ0122510178',
      customer_email: 'Info@eurocover.sk',
      customer_phone: '421948840808',
      daily_kilometers: 210,
      start_date: '2025-09-04 16:00:00',
      end_date: '2025-09-08 16:00:00'
    },
    note: 'Platná objednávka (1200€ vs 1080€ - bola zľava)'
  },
  {
    id: 36,
    customerName: 'Pavol Demjanič',
    changes: {
      order_number: 'OBJ02225031',
      customer_email: 'demjanicp@fytopharma.sk',
      customer_phone: '421918936707',
      daily_kilometers: 250
    },
    note: 'Platná objednávka (290€)'
  },
  // Pridám aj ďalšie jednoznačné napárovania
  {
    id: 553,
    customerName: 'Filip Jackovič',
    changes: {
      customer_email: 'f.jackovic@gmail.com',
      customer_phone: '421917290628',
      daily_kilometers: 210,
      start_date: '2025-09-05 15:00:00',
      end_date: '2025-09-09 15:00:00'
    },
    note: 'Už má order_number OBJ0122510262, len doplniť údaje'
  },
  {
    id: 556,
    customerName: 'Richard Ryan Rozar',
    changes: {
      customer_email: 'richardrozar3@gmail.com',
      customer_phone: '421940554558',
      daily_kilometers: 170,
      start_date: '2025-09-05 15:00:00',
      end_date: '2025-09-14 15:00:00'
    },
    note: 'Už má order_number OBJ01925248, len doplniť údaje'
  },
  {
    id: 558,
    customerName: 'Samuel Vaňo',
    changes: {
      customer_email: 'Samueletovano@gmail.com',
      customer_phone: '421917655312',
      daily_kilometers: 250,
      start_date: '2025-09-05 16:00:00',
      end_date: '2025-09-07 16:00:00'
    },
    note: 'Už má order_number OBJ0122510304, len doplniť údaje'
  },
  {
    id: 25,
    customerName: 'Damián Minárik',
    changes: {
      order_number: 'OBJ02825032',
      customer_email: 'damianminarik0@gmail.com',
      customer_phone: '421944660889',
      daily_kilometers: 250,
      start_date: '2025-08-30 14:00:00',
      end_date: '2025-08-31 14:00:00'
    },
    note: 'Presné napárovanie (220€ vs 310€ - cena v DB je správna)'
  },
  {
    id: 24,
    customerName: 'David Hano',
    changes: {
      order_number: 'OBJ00925015',
      customer_email: 'davidhano0000@gmail.com',
      customer_phone: '421907303977',
      daily_kilometers: 210,
      start_date: '2025-08-31 16:00:00',
      end_date: '2025-09-04 16:00:00'
    },
    note: 'Presné napárovanie (380€)'
  },
  {
    id: 14,
    customerName: 'Lucas Trans Group s. r. o.',
    changes: {
      order_number: 'OBJ0102500015',
      customer_email: 'lukas@lucastransgroup.sk',
      customer_phone: '421949001908',
      daily_kilometers: 210,
      start_date: '2025-09-03 11:00:00',
      end_date: '2025-09-08 11:00:00'
    },
    note: 'Presné napárovanie (225€)'
  },
  {
    id: 10,
    customerName: 'Daniel Mutnansky',
    changes: {
      order_number: 'OBJ00325060',
      customer_email: 'dancotnt@gmail.com',
      customer_phone: '421949122661',
      daily_kilometers: 300
    },
    note: 'Presné napárovanie (100€), čas už sedí'
  },
  {
    id: 9,
    customerName: 'Tromex house s.r.o.',
    changes: {
      order_number: 'OBJ2520044',
      customer_email: 'i-house@email.cz',
      customer_phone: '421608742735',
      daily_kilometers: 250,
      start_date: '2025-09-04 17:00:00',
      end_date: '2025-09-07 17:00:00'
    },
    note: 'Presné napárovanie (960€)'
  }
];

class RentalChangesViewer {
  constructor() {
    this.pool = new Pool(dbConfig);
  }

  async showChanges() {
    console.log('🔍 ZOBRAZENIE PLÁNOVANÝCH ZMIEN V PRENÁJMOCH');
    console.log('='.repeat(80));
    
    for (const change of plannedChanges) {
      await this.showSingleChange(change);
      console.log('-'.repeat(60));
    }
    
    console.log('\n📊 SÚHRN:');
    console.log(`Celkovo plánovaných zmien: ${plannedChanges.length} prenájmov`);
    
    const withOrderNumber = plannedChanges.filter(c => c.changes.order_number).length;
    const withEmail = plannedChanges.filter(c => c.changes.customer_email).length;
    const withPhone = plannedChanges.filter(c => c.changes.customer_phone).length;
    const withKm = plannedChanges.filter(c => c.changes.daily_kilometers).length;
    const withTime = plannedChanges.filter(c => c.changes.start_date).length;
    
    console.log(`- Pridanie order_number: ${withOrderNumber}`);
    console.log(`- Pridanie emailu: ${withEmail}`);
    console.log(`- Pridanie telefónu: ${withPhone}`);
    console.log(`- Pridanie denných km: ${withKm}`);
    console.log(`- Oprava času: ${withTime}`);
  }

  async showSingleChange(change) {
    try {
      const client = await this.pool.connect();
      
      // Načítaj aktuálny stav prenájmu
      const result = await client.query(`
        SELECT id, customer_name, order_number, customer_email, customer_phone, 
               daily_kilometers, start_date, end_date, total_price
        FROM rentals 
        WHERE id = $1
      `, [change.id]);
      
      client.release();
      
      if (result.rows.length === 0) {
        console.log(`❌ Prenájom ID ${change.id} neexistuje`);
        return;
      }
      
      const current = result.rows[0];
      
      console.log(`\n📋 ${change.customerName} (ID: ${change.id})`);
      console.log(`💡 ${change.note}`);
      console.log(`💰 Suma: ${current.total_price}€`);
      
      console.log('\n🔄 ZMENY:');
      
      // Order number
      if (change.changes.order_number) {
        console.log(`   📧 Order number: "${current.order_number || 'NULL'}" → "${change.changes.order_number}"`);
      }
      
      // Email
      if (change.changes.customer_email) {
        console.log(`   ✉️  Email: "${current.customer_email || 'NULL'}" → "${change.changes.customer_email}"`);
      }
      
      // Phone
      if (change.changes.customer_phone) {
        console.log(`   📞 Telefón: "${current.customer_phone || 'NULL'}" → "${change.changes.customer_phone}"`);
      }
      
      // Daily kilometers
      if (change.changes.daily_kilometers) {
        console.log(`   🚗 Denné km: "${current.daily_kilometers || 'NULL'}" → "${change.changes.daily_kilometers}"`);
      }
      
      // Start date
      if (change.changes.start_date) {
        const currentStart = current.start_date ? new Date(current.start_date).toISOString().replace('T', ' ').split('.')[0] : 'NULL';
        console.log(`   📅 Začiatok: "${currentStart}" → "${change.changes.start_date}"`);
      }
      
      // End date
      if (change.changes.end_date) {
        const currentEnd = current.end_date ? new Date(current.end_date).toISOString().replace('T', ' ').split('.')[0] : 'NULL';
        console.log(`   📅 Koniec: "${currentEnd}" → "${change.changes.end_date}"`);
      }
      
    } catch (error) {
      console.error(`❌ Chyba pri načítaní prenájmu ${change.id}:`, error.message);
    }
  }

  async close() {
    await this.pool.end();
  }
}

// Spustenie
async function main() {
  const viewer = new RentalChangesViewer();
  
  try {
    await viewer.showChanges();
  } catch (error) {
    console.error('❌ Chyba:', error);
  } finally {
    await viewer.close();
  }
}

main();
