#!/usr/bin/env node

/**
 * ⚡ RÝCHLY PUPPETEER TEST
 * 
 * Rýchle overenie že Puppeteer funguje lokálne
 */

async function quickTest() {
  console.log('⚡ Rýchly Puppeteer test...');
  
  try {
    // Test 1: Import Puppeteer
    console.log('1️⃣ Testujem import Puppeteer...');
    const puppeteer = require('./backend/node_modules/puppeteer');
    console.log('   ✅ Puppeteer import OK');
    
    // Test 2: Launch browser
    console.log('2️⃣ Testujem spustenie Chrome...');
    const browser = await puppeteer.launch({ 
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    console.log('   ✅ Chrome spustený');
    
    // Test 3: Create page
    console.log('3️⃣ Testujem vytvorenie stránky...');
    const page = await browser.newPage();
    console.log('   ✅ Stránka vytvorená');
    
    // Test 4: Generate simple PDF
    console.log('4️⃣ Testujem PDF generáciu...');
    await page.setContent('<h1>Test PDF</h1><p>Puppeteer funguje! 🎉</p>');
    const pdf = await page.pdf({ 
      format: 'A4',
      printBackground: true
    });
    console.log('   ✅ PDF vygenerované');
    
    // Test 5: Save PDF
    const fs = require('fs');
    const filename = `quick-test-${Date.now()}.pdf`;
    fs.writeFileSync(filename, pdf);
    console.log(`   ✅ PDF uložené: ${filename}`);
    
    // Cleanup
    await browser.close();
    console.log('   ✅ Chrome zatvorený');
    
    console.log('\n🎉 PUPPETEER FUNGUJE PERFEKTNE!');
    console.log('✅ Môžeme spustiť plný test a pushnúť na Railway');
    
  } catch (error) {
    console.error('\n❌ PUPPETEER TEST ZLYHAL:', error.message);
    console.error('Stack:', error.stack);
    process.exit(1);
  }
}

// Spustiť test
quickTest(); 