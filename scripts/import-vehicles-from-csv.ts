#!/usr/bin/env tsx

/**
 * 🚗 IMPORT VOZIDIEL Z CSV SÚBORU
 * 
 * Tento script importuje vozidlá z CSV súboru do BlackRent databázy.
 * Transformuje cenové pásma a automaticky vytvára company záznamy.
 */

import { Pool } from 'pg';
import * as fs from 'fs';

// Database connection
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
});

interface CSVVehicle {
  ID: string;
  Značka: string;
  Model: string;
  ŠPZ: string;
  Firma: string;
  Rok: string;
  Status: string;
  STK: string;
  Vytvorené: string;
  'Cena_0-1_dni': string;
  'Cena_2-3_dni': string;
  'Cena_4-7_dni': string;
  'Cena_8-14_dni': string;
  'Cena_15-22_dni': string;
  'Cena_23-30_dni': string;
  'Cena_31+_dni': string;
  Provizia_typ: string;
  Provizia_hodnota: string;
}

interface PricingTier {
  id: string;
  minDays: number;
  maxDays: number;
  pricePerDay: number;
}

interface Commission {
  type: 'percentage' | 'fixed';
  value: number;
}

/**
 * Transformuje cenové pásma z CSV do PricingTier formátu
 */
function transformPricingTiers(csvVehicle: CSVVehicle): PricingTier[] {
  const tiers: PricingTier[] = [
    {
      id: 'tier-0-1',
      minDays: 0,
      maxDays: 1,
      pricePerDay: parseFloat(csvVehicle['Cena_0-1_dni']) || 0
    },
    {
      id: 'tier-2-3',
      minDays: 2,
      maxDays: 3,
      pricePerDay: parseFloat(csvVehicle['Cena_2-3_dni']) || 0
    },
    {
      id: 'tier-4-7',
      minDays: 4,
      maxDays: 7,
      pricePerDay: parseFloat(csvVehicle['Cena_4-7_dni']) || 0
    },
    {
      id: 'tier-8-14',
      minDays: 8,
      maxDays: 14,
      pricePerDay: parseFloat(csvVehicle['Cena_8-14_dni']) || 0
    },
    {
      id: 'tier-15-22',
      minDays: 15,
      maxDays: 22,
      pricePerDay: parseFloat(csvVehicle['Cena_15-22_dni']) || 0
    },
    {
      id: 'tier-23-30',
      minDays: 23,
      maxDays: 30,
      pricePerDay: parseFloat(csvVehicle['Cena_23-30_dni']) || 0
    },
    {
      id: 'tier-31-plus',
      minDays: 31,
      maxDays: 365,
      pricePerDay: parseFloat(csvVehicle['Cena_31+_dni']) || 0
    }
  ];

  return tiers.filter(tier => tier.pricePerDay > 0); // Odstráň pásma s nulovou cenou
}

/**
 * Transformuje províziu z CSV do Commission formátu
 */
function transformCommission(csvVehicle: CSVVehicle): Commission {
  const type = csvVehicle.Provizia_typ?.toLowerCase() === 'percentage' ? 'percentage' : 'fixed';
  const value = parseFloat(csvVehicle.Provizia_hodnota) || 20; // Default 20%
  
  return { type, value };
}

/**
 * Nájde alebo vytvorí company záznam
 */
async function findOrCreateCompany(client: any, companyName: string): Promise<number | null> {
  if (!companyName || !companyName.trim()) {
    return null;
  }

  try {
    // Najprv skús nájsť existujúcu firmu
    const existingCompany = await client.query(
      'SELECT id FROM companies WHERE LOWER(name) = LOWER($1)',
      [companyName.trim()]
    );
    
    if (existingCompany.rows.length > 0) {
      console.log(`✅ Nájdená existujúca firma: "${companyName}" → ID: ${existingCompany.rows[0].id}`);
      return existingCompany.rows[0].id; // Return as integer
    }
    
    // Firma neexistuje - vytvor ju
    const newCompany = await client.query(
      'INSERT INTO companies (name) VALUES ($1) RETURNING id',
      [companyName.trim()]
    );
    
    const companyId = newCompany.rows[0].id;
    console.log(`🆕 Vytvorená nová firma: "${companyName}" → ID: ${companyId}`);
    return companyId; // Return as integer
    
  } catch (error) {
    console.error(`❌ Chyba pri spracovaní firmy "${companyName}":`, error);
    return null;
  }
}

/**
 * Importuje jedno vozidlo do databázy
 */
async function importVehicle(client: any, csvVehicle: CSVVehicle): Promise<boolean> {
  try {
    // Kontrola duplicít - skontroluj či už existuje vozidlo s touto ŠPZ
    if (csvVehicle.ŠPZ && csvVehicle.ŠPZ.trim()) {
      const existingVehicle = await client.query(
        'SELECT id, brand, model FROM vehicles WHERE LOWER(license_plate) = LOWER($1)',
        [csvVehicle.ŠPZ.trim()]
      );
      
      if (existingVehicle.rows.length > 0) {
        const existing = existingVehicle.rows[0];
        console.log(`⚠️ SKIP: Vozidlo s ŠPZ ${csvVehicle.ŠPZ} už existuje: ${existing.brand} ${existing.model}`);
        return false;
      }
    }

    // Nájdi alebo vytvor company
    const ownerCompanyId = await findOrCreateCompany(client, csvVehicle.Firma);
    
    // Transformuj dáta
    const pricing = transformPricingTiers(csvVehicle);
    const commission = transformCommission(csvVehicle);
    const year = parseInt(csvVehicle.Rok) || 2024;
    
    // Vytvor vozidlo
    const result = await client.query(`
      INSERT INTO vehicles (
        brand, model, year, license_plate, company, owner_company_id, 
        pricing, commission, status, created_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10) 
      RETURNING id, brand, model, license_plate
    `, [
      csvVehicle.Značka?.trim() || 'Unknown',
      csvVehicle.Model?.trim() || 'Unknown',
      year,
      csvVehicle.ŠPZ?.trim() || '',
      csvVehicle.Firma?.trim() || 'Unknown',
      ownerCompanyId,
      JSON.stringify(pricing),
      JSON.stringify(commission),
      csvVehicle.Status?.toLowerCase() || 'available',
      csvVehicle.Vytvorené ? new Date(csvVehicle.Vytvorené) : new Date()
    ]);

    const vehicle = result.rows[0];
    console.log(`✅ IMPORTED: ${vehicle.brand} ${vehicle.model} (${vehicle.license_plate}) → ID: ${vehicle.id}`);
    return true;
    
  } catch (error) {
    console.error(`❌ Chyba pri importe vozidla ${csvVehicle.Značka} ${csvVehicle.Model} (${csvVehicle.ŠPZ}):`, error);
    return false;
  }
}

/**
 * Parsuje CSV súbor bez externých závislostí
 */
function parseCSV(csvContent: string): CSVVehicle[] {
  const lines = csvContent.split('\n').filter(line => line.trim());
  if (lines.length < 2) return [];
  
  const headers = lines[0].split(',').map(h => h.replace(/"/g, '').trim());
  const records: CSVVehicle[] = [];
  
  for (let i = 1; i < lines.length; i++) {
    const values = lines[i].split(',').map(v => v.replace(/"/g, '').trim());
    const record: any = {};
    
    headers.forEach((header, index) => {
      record[header] = values[index] || '';
    });
    
    records.push(record as CSVVehicle);
  }
  
  return records;
}

/**
 * Hlavná funkcia importu
 */
async function main() {
  const csvFilePath = '/Users/mikailpirgozi/Downloads/zalohy blackrent/vozidla-2025-09-03.csv';
  
  console.log('🚗 BLACKRENT VEHICLE IMPORT SCRIPT');
  console.log('==================================');
  console.log(`📁 CSV súbor: ${csvFilePath}`);
  
  // Skontroluj či súbor existuje
  if (!fs.existsSync(csvFilePath)) {
    console.error(`❌ CSV súbor neexistuje: ${csvFilePath}`);
    process.exit(1);
  }

  const client = await pool.connect();
  
  try {
    // Načítaj a parsuj CSV
    const csvContent = fs.readFileSync(csvFilePath, 'utf-8');
    const records: CSVVehicle[] = parseCSV(csvContent);

    console.log(`📊 Načítaných ${records.length} vozidiel z CSV`);
    console.log('');

    // Štatistiky
    let imported = 0;
    let skipped = 0;
    const errors = 0;

    // Importuj každé vozidlo
    for (let i = 0; i < records.length; i++) {
      const csvVehicle = records[i];
      console.log(`[${i + 1}/${records.length}] Processing: ${csvVehicle.Značka} ${csvVehicle.Model} (${csvVehicle.ŠPZ})`);
      
      const success = await importVehicle(client, csvVehicle);
      
      if (success) {
        imported++;
      } else {
        skipped++;
      }
      
      // Malá pauza medzi importmi
      await new Promise(resolve => setTimeout(resolve, 100));
    }

    console.log('');
    console.log('📈 IMPORT SUMMARY');
    console.log('================');
    console.log(`✅ Importované: ${imported}`);
    console.log(`⚠️ Preskočené: ${skipped}`);
    console.log(`❌ Chyby: ${errors}`);
    console.log(`📊 Celkom spracované: ${records.length}`);
    
    if (imported > 0) {
      console.log('');
      console.log('🎉 Import úspešne dokončený!');
      console.log('🌐 Skontroluj vozidlá na: http://localhost:3000/vehicles');
    }

  } catch (error) {
    console.error('❌ Chyba pri importe:', error);
    process.exit(1);
  } finally {
    client.release();
    await pool.end();
  }
}

// Spusti import
if (require.main === module) {
  main().catch(console.error);
}

