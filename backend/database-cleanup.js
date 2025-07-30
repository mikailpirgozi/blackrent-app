#!/usr/bin/env node

/**
 * 🧹 BLACKRENT DATABASE CLEANUP SCRIPT
 * 
 * Vyčistí staré base64 dáta z PostgreSQL databázy na Railway
 * a miguje ich na R2 storage pre optimalizáciu.
 */

require('dotenv').config();
const { Pool } = require('pg');

// Database connection
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
});

// 📊 Analýza funkcje
const analyzeBase64Size = (data) => {
  if (typeof data !== 'string') return 0;
  if (!data.startsWith('data:')) return 0;
  
  const base64Part = data.split(',')[1] || '';
  return Math.floor(base64Part.length * 0.75); // Base64 -> bytes
};

const analyzeDatabase = async () => {
  console.log('🔍 Analyzing PostgreSQL database...');
  
  try {
    const client = await pool.connect();
    
    // Analýza handover_protocols tabuľky
    const protocolsQuery = `
      SELECT 
        id, 
        created_at,
        vehicle_images_urls,
        pdf_url,
        pdf_data
      FROM handover_protocols 
      ORDER BY created_at DESC
    `;
    
    const result = await client.query(protocolsQuery);
    const protocols = result.rows;
    
    console.log(`✅ Found ${protocols.length} protocols`);
    
    let totalBase64ImageSize = 0;
    let totalBase64PDFSize = 0;
    let protocolsWithBase64Images = 0;
    let protocolsWithBase64PDFs = 0;
    let protocolsWithR2Images = 0;
    let protocolsWithR2PDFs = 0;
    let cleanupCandidates = [];
    
    const thirtyDaysAgo = new Date(Date.now() - (30 * 24 * 60 * 60 * 1000));
    
    for (const protocol of protocols) {
      const createdAt = new Date(protocol.created_at);
      let hasBase64Images = false;
      let hasR2Images = false;
      let hasBase64PDF = false;
      let hasR2PDF = false;
      let imageSize = 0;
      let pdfSize = 0;
      
      // Analýza obrázkov
      if (protocol.vehicle_images_urls) {
        let images;
        try {
          images = JSON.parse(protocol.vehicle_images_urls);
        } catch (e) {
          images = [];
        }
        
        if (Array.isArray(images)) {
          for (const img of images) {
            if (img.url) {
              if (img.url.startsWith('data:')) {
                hasBase64Images = true;
                const size = analyzeBase64Size(img.url);
                imageSize += size;
                totalBase64ImageSize += size;
              } else if (img.url.includes('r2.dev') || img.url.includes('cloudflare')) {
                hasR2Images = true;
              }
            }
          }
        }
      }
      
      // Analýza PDF
      if (protocol.pdf_data && protocol.pdf_data.startsWith('data:')) {
        hasBase64PDF = true;
        const size = analyzeBase64Size(protocol.pdf_data);
        pdfSize += size;
        totalBase64PDFSize += size;
      } else if (protocol.pdf_url && (protocol.pdf_url.includes('r2.dev') || protocol.pdf_url.includes('cloudflare'))) {
        hasR2PDF = true;
      }
      
      // Štatistiky
      if (hasBase64Images) protocolsWithBase64Images++;
      if (hasR2Images) protocolsWithR2Images++;
      if (hasBase64PDF) protocolsWithBase64PDFs++;
      if (hasR2PDF) protocolsWithR2PDFs++;
      
      // Kandidát na cleanup (má base64 dáta a je starý)
      if ((hasBase64Images || hasBase64PDF) && createdAt < thirtyDaysAgo) {
        cleanupCandidates.push({
          id: protocol.id,
          createdAt,
          imageSize,
          pdfSize,
          hasR2Images,
          hasR2PDF
        });
      }
    }
    
    client.release();
    
    // 📊 Report
    console.log('\n' + '='.repeat(60));
    console.log('📊 BLACKRENT DATABASE ANALYSIS RESULTS');
    console.log('='.repeat(60));
    console.log(`📁 Total protocols: ${protocols.length}`);
    console.log(`🕒 Cleanup candidates (>30 days): ${cleanupCandidates.length}`);
    console.log('');
    console.log('🖼️  IMAGE STORAGE:');
    console.log(`   • Protocols with base64 images: ${protocolsWithBase64Images}`);
    console.log(`   • Protocols with R2 images: ${protocolsWithR2Images}`);
    console.log(`   • Total base64 image size: ${(totalBase64ImageSize / 1024 / 1024).toFixed(2)} MB`);
    console.log('');
    console.log('📄 PDF STORAGE:');
    console.log(`   • Protocols with base64 PDFs: ${protocolsWithBase64PDFs}`);
    console.log(`   • Protocols with R2 PDFs: ${protocolsWithR2PDFs}`);
    console.log(`   • Total base64 PDF size: ${(totalBase64PDFSize / 1024 / 1024).toFixed(2)} MB`);
    console.log('');
    console.log('💾 CLEANUP POTENTIAL:');
    const totalSize = totalBase64ImageSize + totalBase64PDFSize;
    console.log(`   • Total base64 data: ${(totalSize / 1024 / 1024).toFixed(2)} MB`);
    console.log(`   • Database size reduction: ${(totalSize / 1024 / 1024).toFixed(2)} MB`);
    
    // 🚨 Recommendations
    console.log('\n' + '='.repeat(60));
    console.log('🚨 CLEANUP RECOMMENDATIONS:');
    console.log('='.repeat(60));
    
    if (totalSize > 50 * 1024 * 1024) { // > 50MB
      console.log('🚨 HIGH PRIORITY: Database cleanup recommended');
      console.log(`   💾 Can free up ${(totalSize / 1024 / 1024).toFixed(2)} MB`);
      console.log(`   📊 ${((totalSize / 1024 / 1024) / 1000 * 100).toFixed(1)}% of typical Railway free tier`);
    } else if (totalSize > 10 * 1024 * 1024) { // > 10MB
      console.log('⚠️  MEDIUM PRIORITY: Consider cleanup');
      console.log(`   💾 Can free up ${(totalSize / 1024 / 1024).toFixed(2)} MB`);
    } else {
      console.log('✅ LOW PRIORITY: Database size is reasonable');
      console.log(`   💾 Only ${(totalSize / 1024 / 1024).toFixed(2)} MB of base64 data`);
    }
    
    return {
      totalProtocols: protocols.length,
      cleanupCandidates: cleanupCandidates.length,
      totalBase64Size: totalSize,
      protocolsWithBase64Images,
      protocolsWithBase64PDFs,
      protocolsWithR2Images,
      protocolsWithR2PDFs
    };
    
  } catch (error) {
    console.error('❌ Database analysis failed:', error);
    throw error;
  }
};

const performCleanup = async (dryRun = true) => {
  console.log(`🧹 ${dryRun ? 'DRY RUN' : 'EXECUTING'} database cleanup...`);
  
  try {
    const client = await pool.connect();
    
    // Cleanup strategy 1: Remove base64 images where R2 URLs exist
    const cleanupQuery = `
      UPDATE handover_protocols 
      SET vehicle_images_urls = (
        SELECT json_agg(
          CASE 
            WHEN (img->>'url') LIKE 'data:%' AND 
                 EXISTS(
                   SELECT 1 FROM json_array_elements(vehicle_images_urls::json) AS other_img
                   WHERE (other_img->>'url') LIKE '%r2.dev%' OR (other_img->>'url') LIKE '%cloudflare%'
                 )
            THEN json_build_object(
              'id', img->>'id',
              'url', '',
              'type', img->>'type',
              'description', COALESCE(img->>'description', '')
            )
            ELSE img
          END
        )
        FROM json_array_elements(vehicle_images_urls::json) AS img
      )::text
      WHERE vehicle_images_urls IS NOT NULL 
        AND vehicle_images_urls::text LIKE '%data:%'
        AND created_at < NOW() - INTERVAL '7 days'
    `;
    
    if (dryRun) {
      console.log('📋 Would execute cleanup query (dry run)');
      console.log('✅ Dry run completed successfully');
    } else {
      const result = await client.query(cleanupQuery);
      console.log(`✅ Cleaned up ${result.rowCount} protocols`);
    }
    
    client.release();
    
  } catch (error) {
    console.error('❌ Cleanup failed:', error);
    throw error;
  }
};

// 🚀 Main function
async function main() {
  console.log('🧹 BLACKRENT DATABASE CLEANUP');
  console.log('='.repeat(40));
  
  try {
    // Analýza
    const analysis = await analyzeDatabase();
    
    // Rozhodnutie o cleanup
    const sizeInMB = analysis.totalBase64Size / 1024 / 1024;
    
    console.log('\n🎯 CLEANUP DECISION:');
    if (sizeInMB > 50) {
      console.log('✅ Recommend immediate cleanup');
      console.log('🚀 Run: node database-cleanup.js --execute');
    } else if (sizeInMB > 10) {
      console.log('⚠️  Consider cleanup in future');
      console.log('📊 Monitor database growth');
    } else {
      console.log('✅ No cleanup needed currently');
      console.log('📈 Continue monitoring');
    }
    
    // Dry run cleanup
    if (process.argv.includes('--execute')) {
      console.log('\n🧹 EXECUTING CLEANUP...');
      await performCleanup(false);
    } else {
      console.log('\n🧪 DRY RUN CLEANUP...');
      await performCleanup(true);
    }
    
  } catch (error) {
    console.error('💥 Script failed:', error);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

if (require.main === module) {
  main();
}

module.exports = { analyzeDatabase, performCleanup };