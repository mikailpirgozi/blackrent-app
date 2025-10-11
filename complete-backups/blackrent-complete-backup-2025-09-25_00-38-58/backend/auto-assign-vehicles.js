const { Pool } = require('pg');

// Railway database connection
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

async function autoAssignVehiclesToCompanies() {
  const client = await pool.connect();
  
  try {
    console.log('🚗 Spúšťam automatické priradenie vozidiel k firmám...');
    
    // 1. Načítaj všetky vozidlá
    const vehiclesResult = await client.query(`
      SELECT id, brand, model, license_plate, company, company_id 
      FROM vehicles 
      ORDER BY id
    `);
    
    console.log(`📊 Nájdených ${vehiclesResult.rows.length} vozidiel`);
    
    // 2. Načítaj všetky existujúce firmy
    const companiesResult = await client.query('SELECT id, name FROM companies');
    const existingCompanies = new Map();
    companiesResult.rows.forEach(company => {
      existingCompanies.set(company.name.toLowerCase(), company.id);
    });
    
    console.log(`🏢 Existujúce firmy: ${Array.from(existingCompanies.keys()).join(', ')}`);
    
    let assignedCount = 0;
    let createdCompanies = 0;
    
    // 3. Pre každé vozidlo
    for (const vehicle of vehiclesResult.rows) {
      if (!vehicle.company || vehicle.company_id) {
        continue; // Preskočiť ak už má priradené company_id alebo nemá company
      }
      
      const companyName = vehicle.company.trim();
      const companyNameLower = companyName.toLowerCase();
      
      let companyId = existingCompanies.get(companyNameLower);
      
      // 4. Ak firma neexistuje, vytvor ju
      if (!companyId) {
        console.log(`🆕 Vytváram novú firmu: ${companyName}`);
        const newCompanyResult = await client.query(
          'INSERT INTO companies (name) VALUES ($1) RETURNING id',
          [companyName]
        );
        companyId = newCompanyResult.rows[0].id;
        existingCompanies.set(companyNameLower, companyId);
        createdCompanies++;
      }
      
      // 5. Priradí vozidlo k firme
      await client.query(
        'UPDATE vehicles SET company_id = $1 WHERE id = $2',
        [companyId, vehicle.id]
      );
      
      console.log(`✅ ${vehicle.brand} ${vehicle.model} (${vehicle.license_plate}) → ${companyName} (ID: ${companyId})`);
      assignedCount++;
    }
    
    console.log(`\n🎯 DOKONČENÉ:`);
    console.log(`   - Vytvorených firiem: ${createdCompanies}`);
    console.log(`   - Priradených vozidiel: ${assignedCount}`);
    
    // 6. Zobraz finálny stav
    const finalResult = await client.query(`
      SELECT 
        v.brand, v.model, v.license_plate, v.company,
        c.name as company_name, v.company_id
      FROM vehicles v 
      LEFT JOIN companies c ON v.company_id = c.id 
      ORDER BY c.name, v.brand, v.model
    `);
    
    console.log(`\n📋 FINÁLNY STAV VOZIDIEL:`);
    finalResult.rows.forEach(row => {
      const status = row.company_id ? '✅' : '❌';
      console.log(`${status} ${row.brand} ${row.model} (${row.license_plate}) → ${row.company_name || 'BEZ FIRMY'}`);
    });
    
  } catch (error) {
    console.error('❌ Chyba pri priradzovaní vozidiel:', error);
  } finally {
    client.release();
    await pool.end();
  }
}

// Spustenie skriptu
if (require.main === module) {
  autoAssignVehiclesToCompanies()
    .then(() => {
      console.log('\n🏁 Skript dokončený!');
      process.exit(0);
    })
    .catch(error => {
      console.error('💥 Kritická chyba:', error);
      process.exit(1);
    });
}

module.exports = { autoAssignVehiclesToCompanies }; 