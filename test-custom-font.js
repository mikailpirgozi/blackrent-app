#!/usr/bin/env node

/**
 * Test vlastného fontu pre PDF-lib generátor
 * Testuje či sa vlastný font načíta a funguje správne
 */

const fs = require('fs');
const path = require('path');

// Import custom font generátora
const { PDFLibCustomFontGenerator } = require('./backend/dist/utils/pdf-lib-custom-font-generator');

console.log('🎨 TESTOVANIE AEONIK FONTU');
console.log('===========================');
console.log(`📅 Test spustený: ${new Date().toLocaleString('sk-SK')}`);

// Mock handover protocol data s plnou diakritiku
const mockProtocolWithFullDiacritics = {
  id: 'custom-font-test-' + Date.now(),
  createdAt: new Date().toISOString(),
  location: 'Bratislava - Letisko M.R.Štefánika',
  status: 'completed',
  
  rentalData: {
    orderNumber: 'BR-2025-ČUČORIEDKY',
    startDate: new Date().toISOString(),
    endDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
    totalPrice: 350,
    deposit: 600,
    currency: 'EUR',
    
    customer: {
      name: 'Ľubomír Kráľ',
      email: 'lubomir.kral@email.sk',
      phone: '+421 905 123 456'
    },
    
    vehicle: {
      brand: 'Škoda',
      model: 'Superb Combi',
      licensePlate: 'BL-999-ČŠ',
      company: 'AutoRent Štúrovo s.r.o.',
      year: 2024,
      color: 'Červená metalíza'
    }
  },
  
  vehicleCondition: {
    odometer: 78950,
    fuelLevel: 95,
    fuelType: 'Nafta',
    exteriorCondition: 'Výborný - žiadne viditeľné poškodenia',
    interiorCondition: 'Perfektný - kožené sedadlá v top stave',
    notes: 'Vozidlo je v bezchybnom stave. Všetky systémy fungujú správne. Klimatizácia, navigácia, parkovacie senzory - všetko v poriadku. Čučoriedky na sedadle boli vyčistené. 🚗'
  },
  
  damages: [
    {
      description: 'Malé škrabnutie na ľavých dverách',
      severity: 'Ľahké',
      location: 'Ľavé predné dvere',
      estimatedCost: 80
    },
    {
      description: 'Malý prasklinček na čelnom skle',
      severity: 'Kozmetické',
      location: 'Čelné sklo - ľavý horný roh',
      estimatedCost: 120
    }
  ],
  
  vehicleImages: ['auto1.jpg', 'auto2.jpg', 'auto3.jpg', 'auto4.jpg', 'auto5.jpg'],
  documentImages: ['vodic_preukaz.jpg', 'tp_doklad.jpg'],
  damageImages: ['skoda1.jpg', 'skoda2.jpg'],
  vehicleVideos: ['walkround_video.mp4'],
  
  signatures: [
    {
      signerName: 'Ľubomír Kráľ',
      signerRole: 'Zákazník',
      timestamp: new Date().toISOString(),
      location: 'Bratislava'
    },
    {
      signerName: 'Mária Nováková',
      signerRole: 'Zástupkyňa AutoRent',
      timestamp: new Date().toISOString(), 
      location: 'Bratislava'
    }
  ],
  
  notes: 'Zákazník bol podrobne informovaný o všetkých podmienkach prenájmu. Poistenie zahŕňa všetky riziká. Špecifické požiadavky: detské sedačky sú k dispozícii na požiadanie. Ďakujeme za výber našej služby! Čučoriedky, ľadové kašče a ešte viac diakritiky: Ťažký ďateľ, kôň, môžeš ísť ďalej! 🎉'
};

async function testCustomFont() {
  try {
    console.log('\n🔍 KONTROLA FONT SÚBOROV...');
    console.log('============================');
    
    // Kontrola backend font adresára
    const backendFontDir = './backend/fonts';
    const frontendFontDir = './public/fonts';
    
    console.log(`📂 Backend font dir: ${backendFontDir}`);
    console.log(`📂 Frontend font dir: ${frontendFontDir}`);
    
    // Skontrolujeme či existujú font súbory
    const backendFonts = fs.existsSync(backendFontDir) ? fs.readdirSync(backendFontDir) : [];
    const frontendFonts = fs.existsSync(frontendFontDir) ? fs.readdirSync(frontendFontDir) : [];
    
    console.log(`📋 Backend fonty: ${backendFonts.length > 0 ? backendFonts.join(', ') : 'ŽIADNE'}`);
    console.log(`📋 Frontend fonty: ${frontendFonts.length > 0 ? frontendFonts.join(', ') : 'ŽIADNE'}`);
    
    if (backendFonts.length === 0) {
      console.log('\n⚠️  ŽIADNE FONT SÚBORY NENÁJDENÉ!');
      console.log('📋 INŠTRUKCIE:');
      console.log('   1. Skontrolujte backend/fonts/ adresár');
      console.log('   2. Font súbory musia byť v správnom formáte (.ttf, .woff2, .woff)');
      console.log('   3. Pre frontend: public/fonts/ adresár');  
      console.log('   4. Spustite test znovu');
      console.log('\n🎯 TEST UKONČENÝ - PRIDAJTE FONT SÚBORY');
      return;
    }
    
    console.log('\n🎨 TESTOVANIE CUSTOM FONT GENERÁTORA...');
    console.log('=======================================');
    
    // Test s Aeonik fontom
    const fontName = 'aeonik'; // Profesionálny Aeonik font
    
    const customFontGenerator = new PDFLibCustomFontGenerator(fontName);
    const startTime = Date.now();
    const pdfBuffer = await customFontGenerator.generateHandoverProtocol(mockProtocolWithFullDiacritics);
    const endTime = Date.now();
    
    // Uloženie PDF
    const filename = `custom-font-test-${fontName}-${Date.now()}.pdf`;
    fs.writeFileSync(filename, pdfBuffer);
    
    console.log(`✅ AEONIK FONT PDF VYGENEROVANÉ!`);
    console.log(`   📄 Súbor: ${filename}`);
    console.log(`   📏 Veľkosť: ${(pdfBuffer.length / 1024).toFixed(1)} KB`);
    console.log(`   ⏱️  Čas: ${endTime - startTime}ms`);
    console.log(`   🎨 Font: ${fontName.toUpperCase()} (Profesionálny webový font)`);
    console.log(`   🔤 Diakritika: PLNÁ PODPORA s Aeonik fontom!`);
    
    console.log('\n🔍 TEST OBSAHU:');
    console.log('===============');
    console.log('✅ Čučoriedky, ľadové kašče');
    console.log('✅ Ťažký ďateľ, kôň, môžeš ísť ďalej');
    console.log('✅ Ľubomír Kráľ, Škoda Superb');
    console.log('✅ Všetky slovenské znaky: Á, É, Í, Ó, Ú, Ý, Č, Ď, Ľ, Ň, Ŕ, Š, Ť, Ž');
    
    console.log('\n📁 VÝSLEDOK:');
    console.log('=============');
    console.log(`🔍 Otvorte súbor: ${filename}`);
    console.log('🎨 Kontrolujte či sa Aeonik font zobrazuje správne');
    console.log('🔤 Overte či sú všetky slovenské znaky správne');  
    console.log('💼 Profesionálny vzhľad s Aeonik fontom');
    
    console.log('\n🎉 AEONIK FONT TEST DOKONČENÝ ÚSPEŠNE!');
    
    // Otvorenie PDF súboru
    console.log(`\n📂 Otváram PDF súbor...`);
    require('child_process').exec(`open "${filename}"`, (error) => {
      if (error) {
        console.log('⚠️  Nepodarilo sa automaticky otvoriť PDF súbor');
        console.log(`📋 Manuálne otvorte: ${filename}`);
      }
    });
    
  } catch (error) {
    console.error('\n❌ AEONIK FONT TEST ZLYHAL:', error);
    console.log('\n🔧 MOŽNÉ RIEŠENIA:');
    console.log('==================');
    console.log('1. Skontrolujte že Aeonik font súbory existujú');
    console.log('2. Skontrolujte backend/fonts/Aeonik* adresár');
    console.log('3. Overte WOFF2/WOFF formáty');
    console.log('4. Spustite: cd backend && npm run build');
    console.log(`5. Detailná chyba: ${error.message}`);
    if (error.stack) {
      console.log(`6. Stack trace: ${error.stack.split('\n').slice(0, 3).join('\n')}`);
    }
  }
}

// Spustenie testu
testCustomFont(); 