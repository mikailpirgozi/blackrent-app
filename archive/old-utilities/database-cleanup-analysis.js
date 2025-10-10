#!/usr/bin/env node

/**
 * 🧹 BLACKRENT DATABASE CLEANUP ANALYSIS
 * 
 * Analyzuje veľkosť base64 dát v databáze a navrhuje cleanup stratégiu
 */

const https = require('https');

// 🎯 Konfigurácia
const API_BASE = 'https://blackrent-app-production-4d6f.up.railway.app/api';
const CLEANUP_OPTIONS = {
  dryRun: true, // Len analýza, nepravé vymazanie
  migrateToR2: false, // Migrovať staré dáta na R2 pred vymazaním
  keepProtocolsNewerThan: 30, // Zachovaj protokoly mladšie ako X dní
  cleanupBase64Images: true, // Vymaž base64 obrázky ak existuje R2 URL
  cleanupLargePDFs: true // Vymaž veľké PDF base64 dáta
};

// 🔧 Helper funkcie
const makeRequest = (url, options = {}) => {
  return new Promise((resolve, reject) => {
    const timeout = setTimeout(() => reject(new Error('Timeout')), 15000);
    
    const req = https.request(url, options, (res) => {
      clearTimeout(timeout);
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          const parsed = res.headers['content-type']?.includes('application/json') 
            ? JSON.parse(data) 
            : data;
          resolve({ status: res.statusCode, data: parsed });
        } catch (e) {
          resolve({ status: res.statusCode, data });
        }
      });
    });
    
    req.on('error', reject);
    if (options.body) req.write(options.body);
    req.end();
  });
};

// 📊 Analýza funkcje
const analyzeBase64Size = (data) => {
  if (typeof data !== 'string') return 0;
  if (!data.startsWith('data:')) return 0;
  
  // Base64 obrázok/PDF - približná veľkosť
  const base64Part = data.split(',')[1] || '';
  return Math.floor(base64Part.length * 0.75); // Base64 -> bytes
};

const analyzeProtocols = async () => {
  console.log('🔍 Analyzing protocols database size...');
  
  try {
    // Získaj všetky protokoly (bez autentifikácie - použijem bulk endpoint)
    const response = await makeRequest(`${API_BASE}/bulk`);
    
    if (response.status !== 200) {
      throw new Error(`API Error: ${response.status}`);
    }
    
    const data = response.data;
    console.log('✅ Data loaded successfully');
    
    // Analýza protokolov (ak existujú v bulk data)
    const protocols = data.protocols || [];
    let totalProtocols = protocols.length;
    let base64ImageSize = 0;
    let base64PDFSize = 0;
    let protocolsWithBase64Images = 0;
    let protocolsWithBase64PDFs = 0;
    let protocolsWithR2URLs = 0;
    let oldProtocols = 0;
    
    const now = new Date();
    const thirtyDaysAgo = new Date(now.getTime() - (30 * 24 * 60 * 60 * 1000));
    
    protocols.forEach(protocol => {
      const createdAt = new Date(protocol.createdAt || protocol.created_at);
      
      if (createdAt < thirtyDaysAgo) {
        oldProtocols++;
      }
      
      // Analýza obrázkov
      if (protocol.vehicleImages && Array.isArray(protocol.vehicleImages)) {
        let hasBase64Images = false;
        let hasR2URLs = false;
        
        protocol.vehicleImages.forEach(img => {
          if (img.url) {
            if (img.url.startsWith('data:')) {
              hasBase64Images = true;
              base64ImageSize += analyzeBase64Size(img.url);
            } else if (img.url.includes('r2.dev') || img.url.includes('cloudflare')) {
              hasR2URLs = true;
            }
          }
        });
        
        if (hasBase64Images) protocolsWithBase64Images++;
        if (hasR2URLs) protocolsWithR2URLs++;
      }
      
      // Analýza PDF
      if (protocol.pdfData && protocol.pdfData.startsWith('data:')) {
        protocolsWithBase64PDFs++;
        base64PDFSize += analyzeBase64Size(protocol.pdfData);
      }
    });
    
    // 📊 Report
    console.log('\n' + '='.repeat(60));
    console.log('📊 BLACKRENT DATABASE CLEANUP ANALYSIS');
    console.log('='.repeat(60));
    console.log(`📁 Total protocols: ${totalProtocols}`);
    console.log(`📅 Protocols older than 30 days: ${oldProtocols}`);
    console.log('');
    console.log('🖼️  IMAGE ANALYSIS:');
    console.log(`   • Protocols with base64 images: ${protocolsWithBase64Images}`);
    console.log(`   • Protocols with R2 URLs: ${protocolsWithR2URLs}`);
    console.log(`   • Total base64 image size: ${(base64ImageSize / 1024 / 1024).toFixed(2)} MB`);
    console.log('');
    console.log('📄 PDF ANALYSIS:');
    console.log(`   • Protocols with base64 PDFs: ${protocolsWithBase64PDFs}`);
    console.log(`   • Total base64 PDF size: ${(base64PDFSize / 1024 / 1024).toFixed(2)} MB`);
    console.log('');
    console.log('💾 TOTAL CLEANUP POTENTIAL:');
    console.log(`   • Total base64 data: ${((base64ImageSize + base64PDFSize) / 1024 / 1024).toFixed(2)} MB`);
    console.log(`   • Estimated database size reduction: ${((base64ImageSize + base64PDFSize) / 1024 / 1024).toFixed(2)} MB`);
    
    // 🚨 Odporúčania
    console.log('\n' + '='.repeat(60));
    console.log('🚨 CLEANUP RECOMMENDATIONS:');
    console.log('='.repeat(60));
    
    if (base64ImageSize > 10 * 1024 * 1024) { // > 10MB
      console.log('🖼️  HIGH PRIORITY: Clean up base64 images');
      console.log(`   • ${(base64ImageSize / 1024 / 1024).toFixed(2)} MB can be freed`);
      console.log(`   • ${protocolsWithBase64Images} protocols affected`);
    }
    
    if (base64PDFSize > 5 * 1024 * 1024) { // > 5MB
      console.log('📄 MEDIUM PRIORITY: Clean up base64 PDFs');
      console.log(`   • ${(base64PDFSize / 1024 / 1024).toFixed(2)} MB can be freed`);
      console.log(`   • ${protocolsWithBase64PDFs} protocols affected`);
    }
    
    if (oldProtocols > 10) {
      console.log('📅 CONSIDER: Archive old protocols');
      console.log(`   • ${oldProtocols} protocols older than 30 days`);
    }
    
    // 🔧 Cleanup stratégia
    console.log('\n' + '='.repeat(60));
    console.log('🔧 SUGGESTED CLEANUP STRATEGY:');
    console.log('='.repeat(60));
    
    if (protocolsWithBase64Images > 0 && protocolsWithR2URLs > 0) {
      console.log('1. 🎯 SAFE CLEANUP: Remove base64 images where R2 URLs exist');
      console.log('   ✅ No data loss - R2 URLs are backup');
      console.log(`   💾 Potential savings: ${(base64ImageSize / 1024 / 1024).toFixed(2)} MB`);
    }
    
    if (protocolsWithBase64PDFs > 0) {
      console.log('2. 📄 PDF OPTIMIZATION: Migrate large PDF base64 to R2');
      console.log('   ⚠️  Requires migration script');
      console.log(`   💾 Potential savings: ${(base64PDFSize / 1024 / 1024).toFixed(2)} MB`);
    }
    
    console.log('3. 🧹 GRADUAL CLEANUP: New uploads use R2, old data stays');
    console.log('   ✅ Zero risk - no data loss');
    console.log('   ⏰ Natural cleanup over time');
    
    console.log('\n✅ Analysis complete! Run cleanup script if savings > 10MB');
    
  } catch (error) {
    console.error('❌ Analysis failed:', error.message);
    console.log('\n📝 FALLBACK RECOMMENDATIONS:');
    console.log('• Check Railway database size in dashboard');
    console.log('• Monitor app performance');
    console.log('• Consider manual cleanup if > 100MB');
  }
};

// 🚀 Main
async function main() {
  console.log('🧹 BLACKRENT DATABASE CLEANUP ANALYSIS');
  console.log('🎯 Analyzing base64 data storage usage...\n');
  
  await analyzeProtocols();
  
  console.log('\n📋 Next steps:');
  console.log('1. Review this analysis');
  console.log('2. Check Railway database metrics');
  console.log('3. Run cleanup script if recommended');
  console.log('4. Monitor system performance');
}

if (require.main === module) {
  main().catch(console.error);
}

module.exports = { analyzeProtocols };