#!/usr/bin/env node

const { Pool } = require('pg');

async function fixExistingProtocols() {
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
  });

  try {
    console.log('🔧 Opravujem existujúce protokoly...');
    
    // 1. Pridanie chýbajúcich stĺpcov
    await pool.query(`
      ALTER TABLE handover_protocols 
      ADD COLUMN IF NOT EXISTS pdf_url VARCHAR(500);
    `);
    
    await pool.query(`
      ALTER TABLE handover_protocols 
      ADD COLUMN IF NOT EXISTS email_sent BOOLEAN DEFAULT FALSE;
    `);
    
    console.log('✅ Stĺpce pridané');
    
    // 2. Aktualizácia existujúcich protokolov s pdfUrl
    const result = await pool.query(`
      SELECT id, created_at FROM handover_protocols 
      WHERE pdf_url IS NULL OR pdf_url = ''
    `);
    
    console.log(`📋 Našlo sa ${result.rows.length} protokolov bez pdfUrl`);
    
    for (const row of result.rows) {
      const date = new Date(row.created_at).toISOString().split('T')[0];
      const pdfUrl = `https://pub-4fec120a8a6a4a0cbadfa55f54b7e8a2.r2.dev/protocols/${row.id}/${date}/protokol_prevzatie_${row.id}_${date}.pdf`;
      
      await pool.query(`
        UPDATE handover_protocols 
        SET pdf_url = $1 
        WHERE id = $2
      `, [pdfUrl, row.id]);
      
      console.log(`✅ Protokol ${row.id} opravený s pdfUrl: ${pdfUrl}`);
    }
    
    console.log('🎉 Všetky protokoly opravené!');
    
  } catch (error) {
    console.error('❌ Chyba pri oprave protokolov:', error);
  } finally {
    await pool.end();
  }
}

fixExistingProtocols(); 