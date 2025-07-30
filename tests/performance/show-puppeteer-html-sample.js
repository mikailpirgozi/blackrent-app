#!/usr/bin/env node

/**
 * 🎨 UKÁŽKA HTML TEMPLATE PUPPETEER GENERÁTORA
 * 
 * Zobrazí HTML kód, ktorý Puppeteer používa na generovanie PDF
 */

const fs = require('fs');
const { PuppeteerPDFGeneratorV2 } = require('./backend/dist/utils/puppeteer-pdf-generator-v2');

// Vzorové dáta
const sampleProtocol = {
  id: 'sample-html-demo-123',
  rentalData: {
    orderNumber: 'HTML-DEMO-001',
    vehicle: {
      brand: 'BMW',
      model: 'X5',
      licensePlate: 'BA123DEMO',
      company: 'Demo Cars SK'
    },
    customer: {
      name: 'Ján Vzorový',
      email: 'jan.vzorovy@example.sk',
      phone: '+421 901 234 567'
    },
    startDate: new Date('2025-01-20'),
    endDate: new Date('2025-01-27'),
    totalPrice: 750,
    deposit: 150,
    currency: 'EUR'
  },
  location: 'Bratislava Demo',
  vehicleCondition: {
    odometer: 50000,
    fuelLevel: 90,
    fuelType: 'gasoline',
    exteriorCondition: 'Výborný',
    interiorCondition: 'Dobrý',
    notes: 'Vozidlo v perfektnom stave, žiadne problémy.'
  },
  vehicleImages: [
    {
      id: 'demo1',
      url: 'https://via.placeholder.com/300x200/007BFF/FFFFFF?text=Demo+Obrázok+1',
      type: 'vehicle',
      description: 'Demo obrázok'
    }
  ],
  signatures: [
    {
      id: 'demo-sig',
      signerName: 'Ján Vzorový',
      signerRole: 'employee',
      timestamp: new Date().toISOString(),
      location: 'Bratislava Demo',
      signature: 'data:image/png;base64,demo'
    }
  ],
  notes: 'Toto je demo poznámka pre ukážku HTML template.'
};

function showHTMLTemplate() {
  console.log('🎨 HTML TEMPLATE PUPPETEER GENERÁTORA');
  console.log('=' .repeat(60));
  
  try {
    // Vytvorenie inštancie generátora
    const generator = new PuppeteerPDFGeneratorV2();
    
    // Získanie HTML obsahu (private metóda, musíme ju volať cez reflection)
    const htmlContent = generator.generateHandoverHTML(sampleProtocol);
    
    // Uloženie HTML súboru pre prehliadanie
    const htmlFilename = 'puppeteer-template-demo.html';
    fs.writeFileSync(htmlFilename, htmlContent);
    
    console.log(`📄 HTML template uložený: ${htmlFilename}`);
    console.log('');
    console.log('🎯 KĽÚČOVÉ VLASTNOSTI TEMPLATE:');
    console.log('');
    console.log('📱 RESPONZÍVNY DIZAJN:');
    console.log('   • CSS Grid layout');
    console.log('   • Flexbox pre rozloženie');
    console.log('   • Responsive images');
    console.log('');
    console.log('🎨 VIZUÁLNE PRVKY:');
    console.log('   • Gradient hlavička (modrá)');
    console.log('   • Gradient sekcie (zelená)');
    console.log('   • Box shadows a tienky');
    console.log('   • Zaoblené rohy (border-radius)');
    console.log('');
    console.log('🔤 TYPOGRAFIA:');
    console.log('   • Segoe UI font family');
    console.log('   • Rôzne veľkosti písma');
    console.log('   • Tučné nadpisy');
    console.log('   • Optimálna čitateľnosť');
    console.log('');
    console.log('🌈 FAREBNÁ SCHÉMA:');
    console.log('   • Hlavička: #1e3c72 → #2a5298');
    console.log('   • Sekcie: #28a745 → #20c997');
    console.log('   • Pozadie: #f8f9fa');
    console.log('   • Text: #333333');
    console.log('');
    console.log('📋 ŠTRUKTÚRA OBSAHU:');
    console.log('   • Hlavička s názvom');
    console.log('   • Info grid (2 stĺpce)');
    console.log('   • Sekcie s hlavičkami');
    console.log('   • Fotografie v gridu');
    console.log('   • Podpisy v 2 stĺpcoch');
    console.log('   • Footer s meta info');
    console.log('');
    
    // Ukážka časti HTML kódu
    console.log('📝 UKÁŽKA HTML KÓDU (hlavička):');
    console.log('─'.repeat(50));
    
    const headerMatch = htmlContent.match(/<div class="header">(.*?)<\/div>/s);
    if (headerMatch) {
      const headerHTML = headerMatch[0]
        .replace(/\s+/g, ' ')
        .substring(0, 200) + '...';
      console.log(headerHTML);
    }
    
    console.log('─'.repeat(50));
    console.log('');
    console.log('🌐 UKÁŽKA CSS ŠTÝLOV (gradient):');
    console.log('─'.repeat(50));
    
    const gradientMatch = htmlContent.match(/\.header\s*{[^}]+}/s);
    if (gradientMatch) {
      console.log(gradientMatch[0]);
    }
    
    console.log('─'.repeat(50));
    console.log('');
    console.log('💡 VÝHODY PUPPETEER TEMPLATE:');
    console.log('✅ Plná kontrola nad dizajnom');
    console.log('✅ Moderné CSS vlastnosti');
    console.log('✅ Perfektná slovenská diakritika');
    console.log('✅ Profesionálny vzhľad');
    console.log('✅ Ľahké úpravy a customizácia');
    console.log('✅ Podpora emoji a Unicode');
    console.log('');
    console.log('🎉 HTML TEMPLATE UKÁŽKA DOKONČENÁ!');
    console.log(`📁 Otvor súbor: ${htmlFilename} v prehliadači`);
    
  } catch (error) {
    console.error('❌ Chyba pri generovaní HTML template:', error);
  }
}

// Spustenie ukážky
if (require.main === module) {
  showHTMLTemplate();
}

module.exports = { showHTMLTemplate }; 