#!/usr/bin/env node

// Test skript pre odoslanie PDF protokolu emailom
const fetch = require('node-fetch');

async function testEmailProtocol() {
  try {
    console.log('🧪 Spúšťam test odosielania PDF protokolu emailom...');
    
    // 1. Prihlásenie
    console.log('🔐 Prihlasujem sa...');
    const loginResponse = await fetch('http://localhost:3001/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        username: 'admin',
        password: 'Black123'
      })
    });
    
    const loginData = await loginResponse.json();
    if (!loginData.success) {
      throw new Error('Prihlásenie zlyhalo: ' + loginData.message);
    }
    
    const token = loginData.token;
    console.log('✅ Prihlásenie úspešné');
    
    // 2. Test email služby
    console.log('📧 Testujem email službu...');
    const emailTestResponse = await fetch('http://localhost:3001/api/protocols/debug/test-email', {
      method: 'GET',
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      }
    });
    
    const emailTestData = await emailTestResponse.json();
    console.log('📧 Email test:', emailTestData);
    
    if (!emailTestData.success) {
      throw new Error('Email služba nefunguje: ' + emailTestData.error);
    }
    
    // 3. Získanie zoznamu protokolov
    console.log('📋 Hľadám existujúce protokoly...');
    const protocolsResponse = await fetch('http://localhost:3001/api/protocols/bulk-status', {
      method: 'GET',
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      }
    });
    
    const protocolsData = await protocolsResponse.json();
    const protocolsWithHandover = protocolsData.data.filter(p => p.hasHandoverProtocol);
    
    console.log(`📊 Nájdených ${protocolsWithHandover.length} protokolov s handover protokolom`);
    
    if (protocolsWithHandover.length === 0) {
      console.log('⚠️  Žiadne protokoly na testovanie. Vytvor najprv protokol cez frontend.');
      return;
    }
    
    // 4. Vybrať prvý protokol na test
    const testProtocol = protocolsWithHandover[0];
    console.log(`🎯 Testujem protokol pre rental ID: ${testProtocol.rentalId}`);
    
    // 5. Získať detaily protokolu
    const protocolDetailResponse = await fetch(`http://localhost:3001/api/protocols/handover/${testProtocol.rentalId}`, {
      method: 'GET',
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      }
    });
    
    const protocolDetail = await protocolDetailResponse.json();
    console.log('📄 Detail protokolu:', JSON.stringify(protocolDetail, null, 2));
    
    console.log('✅ Test dokončený - môžeš teraz vytvoriť protokol cez frontend!');
    
  } catch (error) {
    console.error('❌ Chyba pri teste:', error.message);
  }
}

// Spustiť test
testEmailProtocol();
