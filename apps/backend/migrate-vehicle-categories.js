#!/usr/bin/env node

/**
 * 🚗 VEHICLE CATEGORIES MIGRATION SCRIPT
 * Automaticky priradí kategórie existujúcim vozidlám na základe brand + model
 */

const { Pool } = require('pg');

// Database connection - Railway PostgreSQL production
const pool = new Pool({
  host: 'trolley.proxy.rlwy.net',
  user: 'postgres',
  password: 'nfwrpKxILRUMqunYTZJEhjudEstqLRGv',
  database: 'railway',
  port: 13400,
  ssl: false
});

// 🧠 INTELIGENTNÉ PRAVIDLÁ pre priradenie kategórií
const categoryRules = {
  // 💎 LUXUSNÉ VOZIDLÁ
  'BMW 7': 'luxusne',
  'BMW i7': 'luxusne', 
  'Mercedes S': 'luxusne',
  'Mercedes EQS': 'luxusne',
  'Audi A8': 'luxusne',
  'Audi e-tron GT': 'luxusne',
  'Lexus LS': 'luxusne',
  'Porsche Panamera': 'luxusne',
  
  // 🏎️ ŠPORTOVÉ VOZIDLÁ  
  'BMW M': 'sportove',
  'Mercedes AMG': 'sportove',
  'Mercedes-AMG': 'sportove',
  'Audi RS': 'sportove',
  'Audi R8': 'sportove',
  'Porsche 911': 'sportove',
  'Porsche Cayman': 'sportove',
  'Porsche Boxster': 'sportove',
  'Ferrari': 'sportove',
  'Lamborghini': 'sportove',
  'McLaren': 'sportove',
  
  // 🚜 SUV VOZIDLÁ
  'BMW X': 'suv',
  'Mercedes G': 'suv',
  'Mercedes GL': 'suv', 
  'Mercedes ML': 'suv',
  'Mercedes GLE': 'suv',
  'Mercedes GLS': 'suv',
  'Audi Q': 'suv',
  'VW Touareg': 'suv',
  'VW Atlas': 'suv',
  'Porsche Cayenne': 'suv',
  'Porsche Macan': 'suv',
  'Range Rover': 'suv',
  'Land Rover': 'suv',
  'Jeep': 'suv',
  'Toyota Land Cruiser': 'suv',
  'Nissan Patrol': 'suv',
  
  // 👨‍👩‍👧‍👦 VIACMIESTNE VOZIDLÁ
  'VW Sharan': 'viacmiestne',
  'VW Touran': 'viacmiestne', 
  'Ford Galaxy': 'viacmiestne',
  'Ford S-Max': 'viacmiestne',
  'Opel Zafira': 'viacmiestne',
  'Renault Espace': 'viacmiestne',
  'Seat Alhambra': 'viacmiestne',
  'Honda Odyssey': 'viacmiestne',
  'Toyota Sienna': 'viacmiestne',
  
  // 📦 DODÁVKY
  'Mercedes Sprinter': 'dodavky',
  'VW Crafter': 'dodavky',
  'Ford Transit': 'dodavky',
  'Iveco Daily': 'dodavky',
  'Renault Master': 'dodavky',
  'Peugeot Boxer': 'dodavky',
  'Fiat Ducato': 'dodavky',
  
  // 🚘 VYŠŠIA STREDNÁ TRIEDA
  'BMW 3': 'vyssia-stredna',
  'BMW 4': 'vyssia-stredna',
  'BMW 5': 'vyssia-stredna',
  'Mercedes C': 'vyssia-stredna',
  'Mercedes E': 'vyssia-stredna',
  'Audi A4': 'vyssia-stredna',
  'Audi A5': 'vyssia-stredna', 
  'Audi A6': 'vyssia-stredna',
  'Lexus IS': 'vyssia-stredna',
  'Lexus ES': 'vyssia-stredna',
  'Volvo S60': 'vyssia-stredna',
  'Volvo S90': 'vyssia-stredna',
  
  // 🚗 NÍZKA TRIEDA  
  'Škoda Fabia': 'nizka-trieda',
  'Škoda Citigo': 'nizka-trieda',
  'VW Up': 'nizka-trieda',
  'VW Polo': 'nizka-trieda',
  'Seat Ibiza': 'nizka-trieda',
  'Seat Arona': 'nizka-trieda',
  'Ford Fiesta': 'nizka-trieda',
  'Opel Corsa': 'nizka-trieda',
  'Peugeot 208': 'nizka-trieda',
  'Renault Clio': 'nizka-trieda',
  'Hyundai i20': 'nizka-trieda',
  'Kia Rio': 'nizka-trieda',
  'Dacia Logan': 'nizka-trieda',
  'Dacia Sandero': 'nizka-trieda'
};

// Fallback brand-based rules ak nenájdeme presný brand + model match
const brandFallbacks = {
  'Ferrari': 'sportove',
  'Lamborghini': 'sportove', 
  'McLaren': 'sportove',
  'Porsche': 'sportove',
  'Bentley': 'luxusne',
  'Rolls-Royce': 'luxusne',
  'Maserati': 'luxusne',
  'Dacia': 'nizka-trieda',
  'Škoda': 'stredna-trieda',
  'Seat': 'stredna-trieda',
  'Kia': 'stredna-trieda',
  'Hyundai': 'stredna-trieda'
};

/**
 * 🔍 Určí kategóriu vozidla na základe brand + model
 */
function determineCategory(brand, model) {
  const searchKey = `${brand} ${model}`;
  
  console.log(`   🔍 Analyzing: "${searchKey}"`);
  
  // 1. Hľadaj presný brand + model match
  for (const [key, category] of Object.entries(categoryRules)) {
    if (searchKey.toLowerCase().includes(key.toLowerCase())) {
      console.log(`   ✅ Match found: "${key}" → ${category}`);
      return category;
    }
  }
  
  // 2. Hľadaj brand fallback
  const brandMatch = brandFallbacks[brand];
  if (brandMatch) {
    console.log(`   📋 Brand fallback: "${brand}" → ${brandMatch}`);
    return brandMatch;
  }
  
  // 3. Default kategória  
  console.log(`   🤷 No match found, using default: stredna-trieda`);
  return 'stredna-trieda';
}

/**
 * 🚀 Hlavná migračná funkcia
 */
async function migrateVehicleCategories() {
  const client = await pool.connect();
  
  try {
    console.log('🚗 VEHICLE CATEGORIES MIGRATION SCRIPT');
    console.log('=====================================');
    console.log('');
    
    // 1. Načítaj všetky vozidlá
    console.log('📊 Načítavam vozidlá z databázy...');
    const result = await client.query(`
      SELECT id, brand, model, license_plate, category
      FROM vehicles 
      ORDER BY brand, model
    `);
    
    const vehicles = result.rows;
    console.log(`   📈 Nájdených ${vehicles.length} vozidiel`);
    console.log('');
    
    if (vehicles.length === 0) {
      console.log('⚠️  Žiadne vozidlá na migráciu!');
      return;
    }
    
    // 2. Procesuj každé vozidlo
    let updated = 0;
    let alreadyHasCategory = 0;
    
    for (const vehicle of vehicles) {
      const { id, brand, model, license_plate, category } = vehicle;
      
      console.log(`🚗 ${license_plate} (${brand} ${model})`);
      
      // Preskočiť ak už má kategóriu (nie je null a nie je default)
      if (category && category !== 'stredna-trieda') {
        console.log(`   ℹ️  Už má kategóriu: ${category} (preskakujem)`);
        alreadyHasCategory++;
        continue;
      }
      
      // Určiť správnu kategóriu
      const newCategory = determineCategory(brand, model);
      
      // Aktualizovať v databáze
      await client.query(`
        UPDATE vehicles 
        SET category = $1, updated_at = CURRENT_TIMESTAMP
        WHERE id = $2
      `, [newCategory, id]);
      
      console.log(`   ✅ Aktualizované na: ${newCategory}`);
      updated++;
      console.log('');
    }
    
    // 3. Súhrn migrácie
    console.log('🎯 MIGRÁCIA DOKONČENÁ!');
    console.log('====================');
    console.log(`📊 Celkový počet vozidiel: ${vehicles.length}`);
    console.log(`✅ Aktualizovaných: ${updated}`);
    console.log(`ℹ️  Už mali kategóriu: ${alreadyHasCategory}`);
    console.log('');
    
    // 4. Zobraziť štatistiky kategórií
    const statsResult = await client.query(`
      SELECT category, COUNT(*) as count
      FROM vehicles 
      WHERE category IS NOT NULL
      GROUP BY category
      ORDER BY count DESC
    `);
    
    console.log('📈 ŠTATISTIKY KATEGÓRIÍ:');
    console.log('========================');
    for (const row of statsResult.rows) {
      const emoji = getCategoryEmoji(row.category);
      console.log(`${emoji} ${row.category}: ${row.count} vozidiel`);
    }
    
  } catch (error) {
    console.error('❌ Chyba pri migrácii:', error.message);
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

/**
 * 🎨 Získa emoji pre kategóriu
 */
function getCategoryEmoji(category) {
  const emojis = {
    'nizka-trieda': '🚗',
    'stredna-trieda': '🚙', 
    'vyssia-stredna': '🚘',
    'luxusne': '💎',
    'sportove': '🏎️',
    'suv': '🚜',
    'viacmiestne': '👨‍👩‍👧‍👦',
    'dodavky': '📦'
  };
  return emojis[category] || '❓';
}

// Spustiť migráciu
if (require.main === module) {
  migrateVehicleCategories()
    .then(() => {
      console.log('');
      console.log('🎉 Migration script úspešne dokončený!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('💥 Migration script zlyhal:', error);
      process.exit(1);
    });
}

module.exports = { migrateVehicleCategories, determineCategory }; 