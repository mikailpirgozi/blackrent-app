#!/usr/bin/env node

/**
 * 🧪 Test script pre PDF typografiu
 * Testuje priamo PDF generátor s novou typografiou
 */

const { PDFLibCustomFontGenerator } = require('./dist/utils/pdf-lib-custom-font-generator.js');
const fs = require('fs');
const path = require('path');

console.log('🧪 TESTOVANIE PDF TYPOGRAFIE');
console.log('============================');

async function testPDFTypography() {
  try {
    console.log('🎨 Vytváram PDF generátor...');
    const generator = new PDFLibCustomFontGenerator('sf-pro');
    
    // Testovací protokol
    const testProtocol = {
      id: 'TEST-TYPOGRAPHY-001',
      location: 'Trenčín - TEST',
      createdAt: new Date().toISOString(),
      completedAt: new Date().toISOString(),
      vehicleCondition: {
        odometer: 50000,
        fuelLevel: 75,
        fuelType: 'Benzín',
        exteriorCondition: 'Výborný',
        interiorCondition: 'Dobrý'
      },
      notes: 'Toto je testovacia poznámka pre overenie novej typografie. Mala by byť napísaná s body štýlom (11px, regular font). Pozrite si rozdiel medzi nadpismi (bold, väčšie) a týmto textom (regular, menší).',
      rentalData: {
        id: 'TEST-RENTAL-001',
        customer: {
          name: 'Test Zákazník',
          email: 'test@example.com',
          phone: '+421900000000'
        },
        vehicle: {
          brand: 'Mercedes',
          model: 'CLA 200',
          licensePlate: 'TEST123',
          company: 'Test Firma s.r.o.'
        },
        startDate: new Date().toISOString(),
        endDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString()
      },
      damages: [
        {
          id: 'damage-1',
          description: 'Malá škrabnutina na prednom nárazníku',
          severity: 'minor',
          location: 'front_bumper'
        }
      ],
      signatures: [
        {
          id: 'customer-signature',
          type: 'customer',
          name: 'Test Zákazník',
          timestamp: new Date().toISOString()
        }
      ]
    };

    console.log('📄 Generujem test PDF s novou typografiou...');
    const pdfBuffer = await generator.generateHandoverProtocol(testProtocol);
    
    // Uloženie test PDF
    const outputPath = path.join(__dirname, 'test-typography-output.pdf');
    fs.writeFileSync(outputPath, pdfBuffer);
    
    console.log(`✅ Test PDF vygenerované: ${outputPath}`);
    console.log(`📊 Veľkosť súboru: ${(pdfBuffer.length / 1024).toFixed(1)} KB`);
    
    // Zobrazenie informácií o fontoch
    console.log('\n🔤 VRÁTENÉ PÔVODNÉ NASTAVENIA:');
    console.log('- H1 nadpisy: 18px, BOLD (tmavá farba)');
    console.log('- H2 sekcie: 14px, BOLD (stredná farba)');
    console.log('- H3 pod-sekcie: 12px, REGULAR (svetlejšia farba)');
    console.log('- Labels: 10px, BOLD (tmavá farba)');
    console.log('- Values: 10px, REGULAR (svetlejšia farba)');
    console.log('- Body text: 11px, REGULAR (stredná farba)');
    console.log('- Caption: 9px, REGULAR (svetlejšia farba)');
    console.log('- Footer: 8px, REGULAR (najsvetlejšia farba)');
    
    console.log('\n🎯 OČAKÁVANÉ ZMENY:');
    console.log('- Hlavný nadpis "ODOVZDÁVACÍ PROTOKOL" by mal byť VÝRAZNE väčší a hrubší');
    console.log('- Sekcie ako "Základné informácie" by mali byť hrubšie ako predtým');
    console.log('- Labels (napr. "Zákazník:") by mali byť hrubšie');
    console.log('- Values (napr. meno zákazníka) by mali byť tenšie a svetlejšie');
    console.log('- Poznámky by mali mať stredný font weight');
    console.log('- Footer by mal byť najmenší a najsvetlejší');
    
    console.log('\n🚀 Test dokončený! Otvor súbor test-typography-output.pdf');
    
  } catch (error) {
    console.error('❌ Chyba pri testovaní PDF:', error);
    console.error('Stack trace:', error.stack);
  }
}

testPDFTypography();
