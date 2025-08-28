const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));

const PRODUCTION_API = 'https://blackrent-app-production-4d6f.up.railway.app/api';

async function testProductionSMTP() {
    console.log('\n🧪 === KOMPLETNÝ TEST SMTP NA PRODUKČNEJ VERZII ===\n');
    console.log(`🌐 API URL: ${PRODUCTION_API}`);
    console.log(`🔗 Frontend URL: https://blackrent-app.vercel.app/`);
    console.log(`📅 Deploy: 972aa78 (rollback z GitHubu)`);
    
    // Test 1: Health check
    console.log('\n1️⃣ === HEALTH CHECK ===');
    try {
        const healthResponse = await fetch(`${PRODUCTION_API}/health`);
        console.log(`📊 Health Status: ${healthResponse.status} ${healthResponse.statusText}`);
        
        if (healthResponse.ok) {
            const healthData = await healthResponse.json();
            console.log('✅ Backend je online:', JSON.stringify(healthData, null, 2));
        } else {
            console.log('❌ Backend nie je dostupný');
            return;
        }
    } catch (error) {
        console.error('🚨 Health check zlyhal:', error.message);
        return;
    }
    
    // Test 2: Email service status
    console.log('\n2️⃣ === EMAIL SERVICE STATUS ===');
    try {
        const emailStatusResponse = await fetch(`${PRODUCTION_API}/protocols/debug/test-email`);
        console.log(`📊 Email Status: ${emailStatusResponse.status} ${emailStatusResponse.statusText}`);
        
        if (emailStatusResponse.ok) {
            const emailData = await emailStatusResponse.json();
            console.log('✅ EMAIL SERVICE RESPONSE:', JSON.stringify(emailData, null, 2));
            
            if (emailData.success) {
                console.log('✅ Email service je správne nakonfigurovaný');
            } else {
                console.log('❌ Email service má problémy:', emailData.message);
            }
        } else {
            const errorData = await emailStatusResponse.text();
            console.log('❌ EMAIL SERVICE ERROR:', errorData);
        }
    } catch (error) {
        console.error('🚨 Email service test zlyhal:', error.message);
    }
    
    // Test 3: Environment variables check
    console.log('\n3️⃣ === ENVIRONMENT VARIABLES CHECK ===');
    try {
        const envResponse = await fetch(`${PRODUCTION_API}/debug/env-check`);
        console.log(`📊 Env Check Status: ${envResponse.status} ${envResponse.statusText}`);
        
        if (envResponse.ok) {
            const envData = await envResponse.json();
            console.log('✅ ENVIRONMENT VARIABLES:', JSON.stringify(envData, null, 2));
        } else {
            console.log('⚠️  Environment check endpoint neexistuje (možno nie je implementovaný)');
        }
    } catch (error) {
        console.log('⚠️  Environment check nedostupný:', error.message);
    }
    
    // Test 4: Direct SMTP test (ak existuje endpoint)
    console.log('\n4️⃣ === DIRECT SMTP TEST ===');
    try {
        const smtpResponse = await fetch(`${PRODUCTION_API}/smtp-test/direct-test`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            }
        });
        
        console.log(`📊 SMTP Test Status: ${smtpResponse.status} ${smtpResponse.statusText}`);
        
        if (smtpResponse.ok) {
            const smtpData = await smtpResponse.json();
            console.log('✅ DIRECT SMTP RESPONSE:', JSON.stringify(smtpData, null, 2));
        } else {
            const errorData = await smtpResponse.text();
            console.log('❌ DIRECT SMTP ERROR:', errorData);
        }
    } catch (error) {
        console.log('⚠️  Direct SMTP test nedostupný:', error.message);
    }
    
    // Test 5: Protocol endpoints check
    console.log('\n5️⃣ === PROTOCOL ENDPOINTS CHECK ===');
    const protocolEndpoints = [
        '/protocols/handover',
        '/protocols/return',
        '/protocols/debug/test-email'
    ];
    
    for (const endpoint of protocolEndpoints) {
        try {
            const response = await fetch(`${PRODUCTION_API}${endpoint}`, {
                method: 'GET'
            });
            console.log(`📍 ${endpoint}: ${response.status} ${response.statusText}`);
        } catch (error) {
            console.log(`📍 ${endpoint}: ERROR - ${error.message}`);
        }
    }
    
    // Záver a odporúčania
    console.log('\n📋 === ZÁVER A ODPORÚČANIA ===');
    console.log('');
    console.log('🔍 Ak SMTP nefunguje, skontrolujte:');
    console.log('1. Railway Environment Variables:');
    console.log('   - EMAIL_SEND_PROTOCOLS=true');
    console.log('   - SMTP_HOST=smtp.m1.websupport.sk');
    console.log('   - SMTP_PORT=465');
    console.log('   - SMTP_SECURE=true');
    console.log('   - SMTP_USER=info@blackrent.sk');
    console.log('   - SMTP_PASS=your-password');
    console.log('   - SMTP_FROM_NAME=BlackRent System');
    console.log('');
    console.log('2. Alternatívne SMTP nastavenia:');
    console.log('   - Port 587 s SMTP_SECURE=false (STARTTLS)');
    console.log('   - smtp.websupport.sk namiesto smtp.m1.websupport.sk');
    console.log('');
    console.log('3. Loguj sa do Railway Dashboard:');
    console.log('   - https://railway.app');
    console.log('   - Projekt: blackrent-app');
    console.log('   - Variables tab');
    console.log('');
    console.log('4. Test lokálne:');
    console.log('   - npm run test-smtp (ak existuje)');
    console.log('   - node test-enhanced-tls-smtp.js');
}

// Spustiť test
testProductionSMTP().then(() => {
    console.log('\n✅ Kompletný SMTP test dokončený');
}).catch(error => {
    console.error('❌ SMTP test zlyhal:', error);
});

