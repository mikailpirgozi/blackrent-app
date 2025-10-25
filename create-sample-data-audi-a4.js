const { Pool } = require('pg');
require('dotenv').config({ path: './backend/.env' });

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

const AUDI_A4_ID = 110;

async function createSampleData() {
  const client = await pool.connect();
  
  try {
    console.log('🚀 Creating sample data for Audi A4 (ID: 110)...\n');

    // 1. POISTENIE PZP
    console.log('📋 1. Creating PZP Insurance...');
    const pzp = await client.query(`
      INSERT INTO insurances (vehicle_id, insurance_type, insurer_id, policy_number, valid_from, valid_to, price, payment_frequency, notes)
      VALUES ($1, 'pzp', 1, 'PZP-AA273NO-2025', '2025-01-01', '2025-12-31', 450.00, 'yearly', 'Povinné zmluvné poistenie - vzorové dáta')
      RETURNING id, policy_number, price
    `, [AUDI_A4_ID]);
    console.log('   ✅ PZP:', pzp.rows[0]);

    // 2. POISTENIE KASKO
    console.log('\n📋 2. Creating Kasko Insurance...');
    const kasko = await client.query(`
      INSERT INTO insurances (vehicle_id, insurance_type, insurer_id, policy_number, valid_from, valid_to, price, payment_frequency, deductible_amount, deductible_percentage, notes)
      VALUES ($1, 'kasko', 2, 'KASKO-AA273NO-2025', '2025-01-01', '2025-12-31', 1200.00, 'yearly', 500.00, 10.00, 'Havarijné poistenie so spoluúčasťou - vzorové dáta')
      RETURNING id, policy_number, price, deductible_amount, deductible_percentage
    `, [AUDI_A4_ID]);
    console.log('   ✅ Kasko:', kasko.rows[0]);

    // 3. POISTENIE PZP + KASKO (kombinované)
    console.log('\n📋 3. Creating PZP+Kasko Combined Insurance...');
    const combined = await client.query(`
      INSERT INTO insurances (vehicle_id, insurance_type, insurer_id, policy_number, valid_from, valid_to, price, payment_frequency, green_card_valid_from, green_card_valid_to, deductible_amount, notes)
      VALUES ($1, 'pzp_kasko', 1, 'COMBO-AA273NO-2025', '2025-01-01', '2025-12-31', 1500.00, 'yearly', '2025-01-01', '2025-12-31', 300.00, 'Kombinované poistenie s bielou kartou - vzorové dáta')
      RETURNING id, policy_number, price, green_card_valid_from, green_card_valid_to
    `, [AUDI_A4_ID]);
    console.log('   ✅ PZP+Kasko:', combined.rows[0]);

    // 4. STK (Technická kontrola)
    console.log('\n📋 4. Creating STK...');
    const stk = await client.query(`
      INSERT INTO vehicle_documents (vehicle_id, document_type, valid_from, valid_to, document_number, price, km_state, notes)
      VALUES ($1, 'stk', '2024-10-01', '2026-10-01', 'STK-2024-AA273NO', 35.00, 125000, 'Technická kontrola - vzorové dáta')
      RETURNING id, document_type, valid_to, km_state
    `, [AUDI_A4_ID]);
    console.log('   ✅ STK:', stk.rows[0]);

    // 5. EK (Emisná kontrola)
    console.log('\n📋 5. Creating EK...');
    const ek = await client.query(`
      INSERT INTO vehicle_documents (vehicle_id, document_type, valid_from, valid_to, document_number, price, km_state, notes)
      VALUES ($1, 'ek', '2024-10-01', '2026-10-01', 'EK-2024-AA273NO', 15.00, 125000, 'Emisná kontrola - vzorové dáta')
      RETURNING id, document_type, valid_to, km_state
    `, [AUDI_A4_ID]);
    console.log('   ✅ EK:', ek.rows[0]);

    // 6. DIALNIČNÁ ZNÁMKA SK
    console.log('\n📋 6. Creating Vignette SK...');
    const vignetteSK = await client.query(`
      INSERT INTO vehicle_documents (vehicle_id, document_type, valid_from, valid_to, price, country, is_required, notes)
      VALUES ($1, 'vignette', '2025-01-01', '2025-12-31', 50.00, 'SK', true, 'Slovenská diaľničná známka - vzorové dáta')
      RETURNING id, document_type, country, price, is_required
    `, [AUDI_A4_ID]);
    console.log('   ✅ Vignette SK:', vignetteSK.rows[0]);

    // 7. DIALNIČNÁ ZNÁMKA CZ
    console.log('\n📋 7. Creating Vignette CZ...');
    const vignetteCZ = await client.query(`
      INSERT INTO vehicle_documents (vehicle_id, document_type, valid_from, valid_to, price, country, is_required, notes)
      VALUES ($1, 'vignette', '2025-01-01', '2025-12-31', 90.00, 'CZ', false, 'Česká diaľničná známka - vzorové dáta')
      RETURNING id, document_type, country, price, is_required
    `, [AUDI_A4_ID]);
    console.log('   ✅ Vignette CZ:', vignetteCZ.rows[0]);

    // 8. DIALNIČNÁ ZNÁMKA AT
    console.log('\n📋 8. Creating Vignette AT...');
    const vignetteAT = await client.query(`
      INSERT INTO vehicle_documents (vehicle_id, document_type, valid_from, valid_to, price, country, is_required, notes)
      VALUES ($1, 'vignette', '2025-01-01', '2025-12-31', 95.00, 'AT', false, 'Rakúska diaľničná známka - vzorové dáta')
      RETURNING id, document_type, country, price, is_required
    `, [AUDI_A4_ID]);
    console.log('   ✅ Vignette AT:', vignetteAT.rows[0]);

    // 9. SERVISNÁ KNIŽKA - Pravidelný servis
    console.log('\n📋 9. Creating Service Record - Regular Service...');
    const service1 = await client.query(`
      INSERT INTO service_records (vehicle_id, service_date, service_provider, km_state, description, price, notes)
      VALUES ($1, '2024-09-15', 'Audi Servis Bratislava', 120000, 'Pravidelný servis 120 000 km', 450.00, 'Výmena oleja, filtrov, kontrola brzd - vzorové dáta')
      RETURNING id, service_date, service_provider, km_state, price
    `, [AUDI_A4_ID]);
    console.log('   ✅ Service 1:', service1.rows[0]);

    // 10. SERVISNÁ KNIŽKA - Oprava
    console.log('\n📋 10. Creating Service Record - Repair...');
    const service2 = await client.query(`
      INSERT INTO service_records (vehicle_id, service_date, service_provider, km_state, description, price, notes)
      VALUES ($1, '2024-11-20', 'AutoOpravňa Plus', 123000, 'Oprava klimatizácie', 280.00, 'Doplnenie chladiva, výmena filtra - vzorové dáta')
      RETURNING id, service_date, service_provider, km_state, price
    `, [AUDI_A4_ID]);
    console.log('   ✅ Service 2:', service2.rows[0]);

    // 11. EVIDENCIA POKÚT - Nezaplatená
    console.log('\n📋 11. Creating Fine - Unpaid...');
    const fine1 = await client.query(`
      INSERT INTO fines (vehicle_id, customer_id, fine_date, amount, amount_late, country, enforcement_company, is_paid, notes)
      VALUES ($1, NULL, '2024-10-05', 50.00, 75.00, 'SK', 'Polícia SR', false, 'Prekročenie rýchlosti o 15 km/h - vzorové dáta')
      RETURNING id, fine_date, amount, amount_late, is_paid
    `, [AUDI_A4_ID]);
    console.log('   ✅ Fine 1 (unpaid):', fine1.rows[0]);

    // 12. EVIDENCIA POKÚT - Zaplatená majiteľom
    console.log('\n📋 12. Creating Fine - Paid by Owner...');
    const fine2 = await client.query(`
      INSERT INTO fines (vehicle_id, customer_id, fine_date, amount, country, enforcement_company, is_paid, owner_paid_date, notes)
      VALUES ($1, NULL, '2024-08-12', 35.00, 'CZ', 'Městská policie Praha', true, '2024-08-20', 'Parkovanie v zakázanej zóne - zaplatené majiteľom - vzorové dáta')
      RETURNING id, fine_date, amount, is_paid, owner_paid_date
    `, [AUDI_A4_ID]);
    console.log('   ✅ Fine 2 (paid):', fine2.rows[0]);

    // 13. EVIDENCIA POKÚT - Zaplatená zákazníkom
    console.log('\n📋 13. Creating Fine - Paid by Customer...');
    // Najprv zistíme nejakého zákazníka
    const customer = await client.query('SELECT id FROM customers LIMIT 1');
    const customerId = customer.rows[0]?.id || null;
    
    const fine3 = await client.query(`
      INSERT INTO fines (vehicle_id, customer_id, fine_date, amount, country, enforcement_company, is_paid, customer_paid_date, notes)
      VALUES ($1, $2, '2024-09-01', 60.00, 'AT', 'ASFINAG', true, '2024-09-10', 'Mýto - zaplatené zákazníkom - vzorové dáta')
      RETURNING id, fine_date, amount, is_paid, customer_paid_date
    `, [AUDI_A4_ID, customerId]);
    console.log('   ✅ Fine 3 (paid by customer):', fine3.rows[0]);

    console.log('\n✅ ✅ ✅ ALL SAMPLE DATA CREATED SUCCESSFULLY! ✅ ✅ ✅');
    console.log('\n📊 Summary for Audi A4 (ID: 110, AA273NO):');
    console.log('   • 3x Insurances (PZP, Kasko, PZP+Kasko)');
    console.log('   • 2x Vehicle Documents (STK, EK)');
    console.log('   • 3x Vignettes (SK, CZ, AT)');
    console.log('   • 2x Service Records');
    console.log('   • 3x Fines (1 unpaid, 2 paid)');
    console.log('   ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('   TOTAL: 13 documents created! 🎉');

  } catch (error) {
    console.error('❌ Error creating sample data:', error.message);
    console.error('Stack:', error.stack);
  } finally {
    client.release();
    await pool.end();
  }
}

createSampleData();

