const fs = require('fs');

// Test Aeonik PDF Generator cez handover protokol
async function testAeonikPdfGenerator() {
    console.log('🧪 Testovanie Aeonik PDF generátora cez handover protokol...\n');
    
    const API_BASE = 'https://blackrent-app-production-4d6f.up.railway.app/api';
    
    // Test handover protokol data s slovenskými diakritikmi
    const testProtocolData = {
        id: 'test-' + Date.now() + '-' + Math.random().toString(36).substr(2, 9),
        rentalId: 'test-rental-' + Date.now(),
        customerName: 'Ján Kováč',
        customerEmail: 'jan.kovac@test.sk',
        customerPhone: '+421 901 234 567',
        customerLicenseNumber: 'SK123456789',
        customerAddress: 'Bratislavská 123, 010 01 Žilina',
        vehicleBrand: 'Škoda',
        vehicleModel: 'Octavia',
        vehicleYear: 2023,
        vehicleLicensePlate: 'ZA 123 AB',
        vehicleVin: 'TMBEA5NL0M7123456',
        vehicleMileage: 25000,
        vehicleFuelLevel: 75,
        vehicleColor: 'Modrá metalíza',
        rentalStartDate: '2025-07-23T09:00:00.000Z',
        rentalEndDate: '2025-07-30T18:00:00.000Z',
        rentalTotalPrice: 350.00,
        rentalDeposit: 500.00,
        rentalDailyRate: 50.00,
        rentalNotes: 'Prenájom na týždeň - prázdninová cesta do Tater',
        companyName: 'AutoRent Bratislava s.r.o.',
        companyAddress: 'Hlavná 456, 811 01 Bratislava',
        companyPhone: '+421 2 123 456 789',
        companyEmail: 'info@autorent.sk',
        companyIco: '12345678',
        exteriorCondition: 'Dobrý stav s drobnými škrabancami na dverách',
        interiorCondition: 'Čistý interiér, bez poškodení sedadiel',
        documentsComplete: true,
        keysCount: 2,
        fuelCardIncluded: true,
        additionalEquipment: ['GPS navigácia', 'Detská autosedačka', 'Snehové reťaze'],
        location: 'Bratislava - centrálna pobočka na Hlavnej ulici',
        createdAt: new Date().toISOString(),
        damages: JSON.stringify([
            {
                description: 'Škrabance na pravých predných dverách',
                severity: 'Lehké',
                location: 'Pravé predné dvere',
                estimatedCost: 150.00
            },
            {
                description: 'Odrenina na prednom nárazníku vľavo',
                severity: 'Stredné', 
                location: 'Predný nárazník',
                estimatedCost: 280.00
            }
        ])
    };
    
    try {
        console.log('📄 Vytvárám handover protokol s Aeonik fontom...');
        console.log('🏢 Protokol ID:', testProtocolData.id);
        
        const response = await fetch(`${API_BASE}/protocols/handover`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(testProtocolData)
        });
        
        console.log('📡 Response status:', response.status);
        console.log('📋 Content-Type:', response.headers.get('content-type'));
        
        const responseData = await response.json();
        
        if (!response.ok) {
            console.log('❌ Response error:', responseData);
            throw new Error(`HTTP error! status: ${response.status} - ${JSON.stringify(responseData)}`);
        }
        
        console.log('✅ Handover protokol vytvorený!');
        console.log('📄 Protocol ID:', responseData.protocol?.id);
        console.log('🔗 PDF URL:', responseData.protocol?.pdfUrl);
        console.log('🎯 PDF Proxy URL:', responseData.protocol?.pdfProxyUrl);
        
        // Ak máme PDF URL, skúsime ho stiahnuť
        if (responseData.protocol?.pdfUrl) {
            console.log('\n🔽 Sťahujem vygenerované PDF...');
            
            const pdfResponse = await fetch(responseData.protocol.pdfUrl);
            if (pdfResponse.ok) {
                const buffer = await pdfResponse.arrayBuffer();
                const filename = `aeonik-handover-test-${Date.now()}.pdf`;
                
                fs.writeFileSync(filename, Buffer.from(buffer));
                
                const fileSize = fs.statSync(filename).size;
                console.log(`✅ PDF stiahnuté: ${filename}`);
                console.log(`📊 Veľkosť súboru: ${(fileSize / 1024).toFixed(1)} KB`);
                
                return {
                    success: true,
                    file: filename,
                    size: fileSize,
                    generator: 'Aeonik Custom Font',
                    protocolId: responseData.protocol.id,
                    pdfUrl: responseData.protocol.pdfUrl
                };
            } else {
                console.log('⚠️ PDF URL nie je dostupná:', pdfResponse.status);
            }
        }
        
        return {
            success: true,
            generator: 'Aeonik Custom Font',
            protocolId: responseData.protocol?.id,
            pdfUrl: responseData.protocol?.pdfUrl,
            message: 'Protokol vytvorený, PDF možno nie je hneď dostupné'
        };
        
    } catch (error) {
        console.error('❌ Chyba pri testovaní:', error.message);
        return { success: false, error: error.message };
    }
}

// Test PDF generator konfigurácie
async function testPdfConfig() {
    console.log('\n🔍 Kontrola PDF generator konfigurácie...\n');
    
    try {
        const response = await fetch('https://blackrent-app-production-4d6f.up.railway.app/api/protocols/debug/pdf-config');
        const config = await response.json();
        
        console.log('⚙️  PDF Generator Config:');
        console.log(`   Generator Type: ${config.config.generatorType}`);
        console.log(`   Puppeteer Enabled: ${config.config.puppeteerEnabled}`);
        console.log(`   Chromium Path: ${config.config.chromiumPath}`);
        console.log(`   Skip Download: ${config.config.skipDownload}`);
        console.log(`   Node Environment: ${config.config.nodeEnv}`);
        console.log(`   Timestamp: ${config.config.timestamp}`);
        
        return config.config;
        
    } catch (error) {
        console.error('❌ Chyba pri kontrole konfigurácie:', error.message);
        return null;
    }
}

// Hlavná test funkcia
async function runTests() {
    console.log('🚀 Blackrent Aeonik PDF Generator Test\n');
    console.log('=====================================\n');
    
    // Test 1: PDF generator konfigurácia
    const config = await testPdfConfig();
    
    console.log('\n=====================================\n');
    
    // Test 2: Aeonik handover protokol
    const aeonikResult = await testAeonikPdfGenerator();
    
    // Súhrn výsledkov
    console.log('\n\n📊 SÚHRN VÝSLEDKOV:');
    console.log('===================');
    
    if (config) {
        console.log(`⚙️  Generator Type: ${config.generatorType}`);
        console.log(`🎨 Custom Font: ${config.generatorType === 'custom-font' ? 'Aeonik ✅' : 'Nie ❌'}`);
    }
    
    if (aeonikResult.success) {
        if (aeonikResult.file) {
            console.log(`✅ Aeonik Test: ${aeonikResult.file} (${(aeonikResult.size / 1024).toFixed(1)} KB)`);
        } else {
            console.log(`✅ Aeonik Test: Protokol vytvorený (${aeonikResult.protocolId})`);
        }
    } else {
        console.log(`❌ Aeonik Test: ${aeonikResult.error}`);
    }
    
    console.log('\n🎯 Test dokončený!');
}

// Spustiť testy
runTests().catch(console.error);
