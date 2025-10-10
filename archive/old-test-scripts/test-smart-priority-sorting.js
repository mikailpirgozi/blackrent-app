#!/usr/bin/env node

/**
 * 🎯 TEST SCRIPT: Smart Priority Sorting
 * 
 * Testuje nové logické zoradenie prenájmov podľa priority aktivít
 */

const { Pool } = require('pg');

// Database connection
const pool = new Pool({
  host: 'trolley.proxy.rlwy.net',
  port: 13400,
  database: 'railway',
  user: 'postgres',
  password: 'nfwrpKxILRUMqunYTZJEhjudEstqLRGv',
  ssl: false
});

async function testSmartPrioritySorting() {
  console.log('🎯 TESTING SMART PRIORITY SORTING\n');
  
  const client = await pool.connect();
  
  try {
    // Test query s smart priority sorting
    const query = `
      SELECT 
        r.customer_name,
        to_char(r.start_date, 'YYYY-MM-DD') as start_date,
        to_char(r.end_date, 'YYYY-MM-DD') as end_date,
        r.status,
        -- Priority calculation
        CASE 
          WHEN DATE(r.start_date) = CURRENT_DATE OR DATE(r.end_date) = CURRENT_DATE THEN 1
          WHEN (r.start_date >= CURRENT_DATE AND r.start_date <= CURRENT_DATE + INTERVAL '7 days')
               OR (r.end_date >= CURRENT_DATE AND r.end_date <= CURRENT_DATE + INTERVAL '7 days') THEN 2
          WHEN r.start_date <= CURRENT_DATE AND r.end_date >= CURRENT_DATE THEN 3
          WHEN r.start_date > CURRENT_DATE THEN 4
          WHEN r.end_date < CURRENT_DATE THEN 5
          ELSE 6
        END as priority_score,
        -- Priority label
        CASE 
          WHEN DATE(r.start_date) = CURRENT_DATE OR DATE(r.end_date) = CURRENT_DATE THEN 'DNES'
          WHEN (r.start_date >= CURRENT_DATE AND r.start_date <= CURRENT_DATE + INTERVAL '7 days')
               OR (r.end_date >= CURRENT_DATE AND r.end_date <= CURRENT_DATE + INTERVAL '7 days') THEN 'TÝŽDEŇ'
          WHEN r.start_date <= CURRENT_DATE AND r.end_date >= CURRENT_DATE THEN 'AKTÍVNE'
          WHEN r.start_date > CURRENT_DATE THEN 'BUDÚCE'
          WHEN r.end_date < CURRENT_DATE THEN 'HISTORICKÉ'
          ELSE 'NEZNÁME'
        END as priority_label
      FROM rentals r
      WHERE r.customer_name IS NOT NULL
      ORDER BY 
        -- Smart priority sorting
        CASE 
          WHEN DATE(r.start_date) = CURRENT_DATE OR DATE(r.end_date) = CURRENT_DATE THEN 1
          WHEN (r.start_date >= CURRENT_DATE AND r.start_date <= CURRENT_DATE + INTERVAL '7 days')
               OR (r.end_date >= CURRENT_DATE AND r.end_date <= CURRENT_DATE + INTERVAL '7 days') THEN 2
          WHEN r.start_date <= CURRENT_DATE AND r.end_date >= CURRENT_DATE THEN 3
          WHEN r.start_date > CURRENT_DATE THEN 4
          WHEN r.end_date < CURRENT_DATE THEN 5
          ELSE 6
        END ASC,
        -- Secondary sort
        CASE 
          WHEN r.start_date > CURRENT_DATE THEN r.start_date
          ELSE r.end_date
        END ASC,
        -- Tertiary sort
        r.created_at DESC
      LIMIT 50
    `;
    
    const result = await client.query(query);
    
    console.log(`📊 VÝSLEDKY TESTOVANIA (${result.rows.length} prenájmov):\n`);
    
    // Group by priority
    const priorityGroups = {};
    result.rows.forEach(row => {
      const label = row.priority_label;
      if (!priorityGroups[label]) {
        priorityGroups[label] = [];
      }
      priorityGroups[label].push(row);
    });
    
    // Display results by priority
    const priorityOrder = ['DNES', 'TÝŽDEŇ', 'AKTÍVNE', 'BUDÚCE', 'HISTORICKÉ', 'NEZNÁME'];
    
    priorityOrder.forEach(priority => {
      if (priorityGroups[priority] && priorityGroups[priority].length > 0) {
        console.log(`🎯 ${priority} (Priorita ${priorityGroups[priority][0].priority_score}):`);
        priorityGroups[priority].forEach((row, index) => {
          console.log(`  ${index + 1}. ${row.customer_name} | ${row.start_date} → ${row.end_date} | ${row.status}`);
        });
        console.log('');
      }
    });
    
    // Statistics
    const stats = {};
    result.rows.forEach(row => {
      const priority = row.priority_score;
      stats[priority] = (stats[priority] || 0) + 1;
    });
    
    console.log('📈 ŠTATISTIKY PRIORÍT:');
    console.log(`  Priorita 1 (DNES): ${stats[1] || 0}`);
    console.log(`  Priorita 2 (TÝŽDEŇ): ${stats[2] || 0}`);
    console.log(`  Priorita 3 (AKTÍVNE): ${stats[3] || 0}`);
    console.log(`  Priorita 4 (BUDÚCE): ${stats[4] || 0}`);
    console.log(`  Priorita 5 (HISTORICKÉ): ${stats[5] || 0}`);
    console.log(`  Priorita 6 (NEZNÁME): ${stats[6] || 0}`);
    
    console.log('\n✅ Test dokončený!');
    
  } catch (error) {
    console.error('❌ Chyba pri testovaní:', error.message);
  } finally {
    client.release();
    await pool.end();
  }
}

// Run test
testSmartPrioritySorting().catch(console.error);
