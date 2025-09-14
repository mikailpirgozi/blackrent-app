#!/usr/bin/env node

/**
 * Script na aplikovanie schválených zmien v prenájmoch
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

// SQL UPDATE príkazy pre schválené zmeny
const sqlUpdates = [
  {
    id: 40,
    name: 'Samuel Čemeš',
    sql: `UPDATE rentals SET 
      order_number = 'OBJ01925229',
      customer_email = 'cemessamuel4@gmail.com',
      customer_phone = '421910504222',
      daily_kilometers = 250
      WHERE id = 40;`
  },
  {
    id: 37,
    name: 'Lukáš Zemanovic',
    sql: `UPDATE rentals SET 
      order_number = 'OBJ01925231',
      customer_email = 'PvPCarlikPvP@gmail.com',
      customer_phone = '421918046103',
      daily_kilometers = 300,
      start_date = '2025-08-30 11:00:00',
      end_date = '2025-08-31 11:00:00'
      WHERE id = 37;`
  },
  {
    id: 18,
    name: 'Michal Rakovan',
    sql: `UPDATE rentals SET 
      order_number = 'OBJ02825033',
      customer_email = 'michalrakovan.mr@gmail.com',
      customer_phone = '421903623995',
      daily_kilometers = 250,
      start_date = '2025-09-02 12:00:00',
      end_date = '2025-09-05 12:00:00'
      WHERE id = 18;`
  },
  {
    id: 27,
    name: 'Filip Štadler',
    sql: `UPDATE rentals SET 
      order_number = 'OBJ01925235',
      customer_email = 'Filipsuper70@gmail.com',
      customer_phone = '421948222752',
      daily_kilometers = 210,
      start_date = '2025-08-28 16:00:00',
      end_date = '2025-09-01 16:00:00'
      WHERE id = 27;`
  },
  {
    id: 13,
    name: 'Lukáš Slávka',
    sql: `UPDATE rentals SET 
      order_number = 'OBJ01925246',
      customer_email = 'slavkalukas11@gmail.com',
      customer_phone = '421907097359',
      daily_kilometers = 250,
      start_date = '2025-09-03 14:00:00',
      end_date = '2025-09-05 14:00:00'
      WHERE id = 13;`
  },
  {
    id: 17,
    name: 'EUROCOVER Slovakia, s.r.o.',
    sql: `UPDATE rentals SET 
      order_number = 'OBJ0122510178',
      customer_email = 'Info@eurocover.sk',
      customer_phone = '421948840808',
      daily_kilometers = 210,
      start_date = '2025-09-04 16:00:00',
      end_date = '2025-09-08 16:00:00'
      WHERE id = 17;`
  },
  {
    id: 36,
    name: 'Pavol Demjanič',
    sql: `UPDATE rentals SET 
      order_number = 'OBJ02225031',
      customer_email = 'demjanicp@fytopharma.sk',
      customer_phone = '421918936707',
      daily_kilometers = 250
      WHERE id = 36;`
  },
  {
    id: 553,
    name: 'Filip Jackovič',
    sql: `UPDATE rentals SET 
      customer_email = 'f.jackovic@gmail.com',
      customer_phone = '421917290628',
      daily_kilometers = 210,
      start_date = '2025-09-05 15:00:00',
      end_date = '2025-09-09 15:00:00'
      WHERE id = 553;`
  },
  {
    id: 556,
    name: 'Richard Ryan Rozar',
    sql: `UPDATE rentals SET 
      customer_email = 'richardrozar3@gmail.com',
      customer_phone = '421940554558',
      daily_kilometers = 170,
      start_date = '2025-09-05 15:00:00',
      end_date = '2025-09-14 15:00:00'
      WHERE id = 556;`
  },
  {
    id: 558,
    name: 'Samuel Vaňo',
    sql: `UPDATE rentals SET 
      customer_email = 'Samueletovano@gmail.com',
      customer_phone = '421917655312',
      daily_kilometers = 250,
      start_date = '2025-09-05 16:00:00',
      end_date = '2025-09-07 16:00:00'
      WHERE id = 558;`
  },
  {
    id: 25,
    name: 'Damián Minárik',
    sql: `UPDATE rentals SET 
      order_number = 'OBJ02825032',
      customer_email = 'damianminarik0@gmail.com',
      customer_phone = '421944660889',
      daily_kilometers = 250,
      start_date = '2025-08-30 14:00:00',
      end_date = '2025-08-31 14:00:00'
      WHERE id = 25;`
  },
  {
    id: 24,
    name: 'David Hano',
    sql: `UPDATE rentals SET 
      order_number = 'OBJ00925015',
      customer_email = 'davidhano0000@gmail.com',
      customer_phone = '421907303977',
      daily_kilometers = 210,
      start_date = '2025-08-31 16:00:00',
      end_date = '2025-09-04 16:00:00'
      WHERE id = 24;`
  },
  {
    id: 14,
    name: 'Lucas Trans Group s. r. o.',
    sql: `UPDATE rentals SET 
      order_number = 'OBJ0102500015',
      customer_email = 'lukas@lucastransgroup.sk',
      customer_phone = '421949001908',
      daily_kilometers = 210,
      start_date = '2025-09-03 11:00:00',
      end_date = '2025-09-08 11:00:00'
      WHERE id = 14;`
  },
  {
    id: 10,
    name: 'Daniel Mutnansky',
    sql: `UPDATE rentals SET 
      order_number = 'OBJ00325060',
      customer_email = 'dancotnt@gmail.com',
      customer_phone = '421949122661',
      daily_kilometers = 300
      WHERE id = 10;`
  },
  {
    id: 9,
    name: 'Tromex house s.r.o.',
    sql: `UPDATE rentals SET 
      order_number = 'OBJ2520044',
      customer_email = 'i-house@email.cz',
      customer_phone = '421608742735',
      daily_kilometers = 250,
      start_date = '2025-09-04 17:00:00',
      end_date = '2025-09-07 17:00:00'
      WHERE id = 9;`
  }
];

class RentalUpdater {
  constructor() {
    this.pool = new Pool(dbConfig);
    this.successCount = 0;
    this.errorCount = 0;
  }

  async applyAllUpdates() {
    console.log('🚀 APLIKOVANIE SCHVÁLENÝCH ZMIEN V PRENÁJMOCH');
    console.log('='.repeat(80));
    console.log(`📊 Celkovo na spracovanie: ${sqlUpdates.length} prenájmov\n`);

    for (const update of sqlUpdates) {
      await this.applySingleUpdate(update);
    }

    console.log('\n' + '='.repeat(80));
    console.log('📈 FINÁLNY SÚHRN');
    console.log('='.repeat(80));
    console.log(`✅ Úspešne aktualizované: ${this.successCount}`);
    console.log(`❌ Chyby: ${this.errorCount}`);
    console.log(`📊 Celkovo spracované: ${this.successCount + this.errorCount}/${sqlUpdates.length}`);
    
    if (this.successCount === sqlUpdates.length) {
      console.log('\n🎉 VŠETKY ZMENY ÚSPEŠNE APLIKOVANÉ!');
    } else if (this.errorCount > 0) {
      console.log('\n⚠️  Niektoré zmeny zlyhali - skontroluj chyby vyššie');
    }
  }

  async applySingleUpdate(update) {
    try {
      console.log(`🔄 Aktualizujem: ${update.name} (ID: ${update.id})`);
      
      const client = await this.pool.connect();
      
      // Spusti UPDATE
      const result = await client.query(update.sql);
      
      client.release();
      
      if (result.rowCount === 1) {
        console.log(`   ✅ Úspešne aktualizované`);
        this.successCount++;
      } else if (result.rowCount === 0) {
        console.log(`   ⚠️  Žiadne riadky neboli aktualizované (prenájom možno neexistuje)`);
        this.errorCount++;
      } else {
        console.log(`   ⚠️  Aktualizovaných ${result.rowCount} riadkov (očakával som 1)`);
        this.successCount++;
      }
      
    } catch (error) {
      console.log(`   ❌ CHYBA: ${error.message}`);
      this.errorCount++;
    }
  }

  async verifyUpdates() {
    console.log('\n🔍 VERIFIKÁCIA AKTUALIZÁCIÍ');
    console.log('='.repeat(50));
    
    try {
      const client = await this.pool.connect();
      
      // Skontroluj koľko prenájmov má teraz order_number, email, telefón, km
      const stats = await client.query(`
        SELECT 
          COUNT(*) as total_rentals,
          COUNT(order_number) as with_order_number,
          COUNT(customer_email) as with_email,
          COUNT(customer_phone) as with_phone,
          COUNT(daily_kilometers) as with_daily_km
        FROM rentals 
        WHERE start_date >= '2025-08-20' AND start_date <= '2025-09-05'
      `);
      
      const row = stats.rows[0];
      
      console.log(`📊 Prenájmy v období 20.8.2025 - 5.9.2025:`);
      console.log(`   - Celkovo: ${row.total_rentals}`);
      console.log(`   - S order_number: ${row.with_order_number}`);
      console.log(`   - S emailom: ${row.with_email}`);
      console.log(`   - S telefónom: ${row.with_phone}`);
      console.log(`   - S dennými km: ${row.with_daily_km}`);
      
      // Ukáž konkrétne aktualizované prenájmy
      const updated = await client.query(`
        SELECT id, customer_name, order_number, customer_email, customer_phone, daily_kilometers
        FROM rentals 
        WHERE id IN (${sqlUpdates.map(u => u.id).join(',')})
        ORDER BY id
      `);
      
      console.log(`\n✅ AKTUALIZOVANÉ PRENÁJMY (${updated.rows.length}):`);
      updated.rows.forEach(row => {
        console.log(`   ID ${row.id}: ${row.customer_name}`);
        console.log(`      📧 ${row.order_number || 'NULL'} | ✉️ ${row.customer_email || 'NULL'}`);
        console.log(`      📞 ${row.customer_phone || 'NULL'} | 🚗 ${row.daily_kilometers || 'NULL'} km`);
      });
      
      client.release();
      
    } catch (error) {
      console.error('❌ Chyba pri verifikácii:', error.message);
    }
  }

  async close() {
    await this.pool.end();
  }
}

// Spustenie
async function main() {
  const updater = new RentalUpdater();
  
  try {
    await updater.applyAllUpdates();
    await updater.verifyUpdates();
  } catch (error) {
    console.error('❌ Kritická chyba:', error);
  } finally {
    await updater.close();
  }
}

main();
