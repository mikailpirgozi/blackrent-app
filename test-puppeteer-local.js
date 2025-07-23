#!/usr/bin/env node

/**
 * 🎭 LOKÁLNY TEST PUPPETEER GENERÁTORA
 * 
 * Testuje Puppeteer PDF generátor cez lokálny backend
 */

const fs = require('fs');
const path = require('path');

// Lokálny backend endpoint
const LOCAL_API = 'http://localhost:3001';

// Test data
const testHandoverData = {
  id: 'test-local-' + Date.now(),
  location: 'Bratislava - Lokálny Puppeteer Test',
  status: 'completed',
  createdAt: new Date().toISOString(),
  rentalData: {
    id: 'rental-test-123',
    orderNumber: 'BO-2025-LOCALTEST',
    customer: {
      id: 'customer-1',
      name: 'Ján Lokálny Tester',
      email: 'jan.local@puppeteer.sk',
      phone: '+421900123456',
      address: 'Lokálna 123, Bratislava',
      driverLicense: 'SK123456789'
    },
    vehicle: {
      id: 'vehicle-1',
      brand: 'BMW',
      model: 'X5 Local Edition',
      year: 2023,
      licensePlate: 'BA-LOC-AL',
      vin: 'LOCALTEST123456789',
      color: 'Čierna',
      fuelType: 'Benzín',
      transmission: 'Automatická'
    },
    startDate: new Date().toISOString(),
    endDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
    totalPrice: 199.99,
    deposit: 300.00,
    currency: '€'
  },
  vehicleCondition: {
    exterior: {
      front: 'Výborný stav - lokálny test',
      rear: 'Výborný stav - bez škrabancov',
      left: 'Dobrý stav - malé kamienky',
      right: 'Výborný stav',
      roof: 'Výborný stav',
      hood: 'Výborný stav'
    },
    interior: {
      seats: 'Čisté, bez poškodení',
      dashboard: 'Bez škrabancov',
      carpets: 'Čisté',
      electronics: 'Všetko funkčné'
    },
    technical: {
      engine: 'Funguje perfektne',
      brakes: 'V poriadku',
      tires: 'Dobrý stav, 80% profil',
      lights: 'Všetky funkčné',
      fluids: 'Doplnené'
    },
    fuel: {
      level: 100,
      type: 'Benzín 95'
    },
    mileage: 15432
  },
  signatures: {
    customer: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==',
    employee: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg=='
  },
  notes: 'Lokálny test protokol pre Puppeteer generátor. Slovenská diakritika: áčko, éčko, íčko, óčko, účko, ľščťžňď.'
};

async function testPuppeteerLocally() {
  console.log('🎭 LOKÁLNY TEST PUPPETEER GENERÁTORA');
  console.log('=' .repeat(50));
  
  try {
    // Kontrola či backend beží
    console.log('🔍 Kontrolujem lokálny backend...');
    try {
      const healthResponse = await fetch(`${LOCAL_API}/`);
      console.log(`✅ Backend je dostupný (status: ${healthResponse.status})`);
    } catch (error) {
      console.log('❌ Backend nie je dostupný. Spusti ho príkazom: cd backend && npm start');
      return;
    }
    
    // 1. Test s Enhanced jsPDF (default)
    console.log('\n1️⃣ Test Enhanced jsPDF generátora...');
    const jsPdfResponse = await fetch(`${LOCAL_API}/api/protocols/handover/generate-pdf`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(testHandoverData)
    });
    
    if (jsPdfResponse.ok) {
      const jsPdfBuffer = await jsPdfResponse.arrayBuffer();
      const jsPdfFilename = `local-jspdf-${Date.now()}.pdf`;
      fs.writeFileSync(jsPdfFilename, Buffer.from(jsPdfBuffer));
      console.log(`✅ Enhanced jsPDF: ${jsPdfFilename} (${Math.round(jsPdfBuffer.byteLength/1024)} KB)`);
    } else {
      console.log(`❌ Enhanced jsPDF chyba: ${jsPdfResponse.status}`);
      const errorText = await jsPdfResponse.text();
      console.log('Error details:', errorText);
    }
    
    // 2. Test s Puppeteer generátorom
    console.log('\n2️⃣ Test Puppeteer generátora...');
    const puppeteerResponse = await fetch(`${LOCAL_API}/api/protocols/handover/generate-pdf?generator=puppeteer`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(testHandoverData)
    });
    
    if (puppeteerResponse.ok) {
      const puppeteerBuffer = await puppeteerResponse.arrayBuffer();
      const puppeteerFilename = `local-puppeteer-${Date.now()}.pdf`;
      fs.writeFileSync(puppeteerFilename, Buffer.from(puppeteerBuffer));
      console.log(`✅ Puppeteer: ${puppeteerFilename} (${Math.round(puppeteerBuffer.byteLength/1024)} KB)`);
    } else {
      console.log(`❌ Puppeteer chyba: ${puppeteerResponse.status}`);
      const errorText = await puppeteerResponse.text();
      console.log('Error details:', errorText);
    }
    
    // 3. Test s Legacy generátorom
    console.log('\n3️⃣ Test Legacy generátora...');
    const legacyResponse = await fetch(`${LOCAL_API}/api/protocols/handover/generate-pdf?generator=legacy`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(testHandoverData)
    });
    
    if (legacyResponse.ok) {
      const legacyBuffer = await legacyResponse.arrayBuffer();
      const legacyFilename = `local-legacy-${Date.now()}.pdf`;
      fs.writeFileSync(legacyFilename, Buffer.from(legacyBuffer));
      console.log(`✅ Legacy: ${legacyFilename} (${Math.round(legacyBuffer.byteLength/1024)} KB)`);
    } else {
      console.log(`❌ Legacy chyba: ${legacyResponse.status}`);
      const errorText = await legacyResponse.text();
      console.log('Error details:', errorText);
    }
    
    console.log('\n🎯 VÝSLEDOK:');
    console.log('PDF súbory boli vygenerované a uložené lokálne.');
    console.log('Môžeš ich otvoriť príkazom: open local-*.pdf');
    
  } catch (error) {
    console.error('❌ Chyba pri testovaní:', error);
  }
}

// Spustenie testu
testPuppeteerLocally(); 