const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));

const PRODUCTION_API = 'https://blackrent-app-production-4d6f.up.railway.app/api';
const LOGIN_CREDENTIALS = {
    username: 'admin',
    password: 'Black123'
};

async function testIMAPConnectionProduction() {
    console.log('\n📧 === TEST IMAP CONNECTION NA RAILWAY PRODUKCII ===\n');
    
    let authToken = null;
    
    try {
        // 1. Prihlásiť sa
        console.log('🔐 Prihlasovanie...');
        const loginResponse = await fetch(`${PRODUCTION_API}/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(LOGIN_CREDENTIALS)
        });
        
        if (!loginResponse.ok) {
            throw new Error(`Login failed: ${loginResponse.status}`);
        }
        
        const loginData = await loginResponse.json();
        authToken = loginData.token;
        console.log('✅ Prihlásenie úspešné');
        
        // 2. Test IMAP status
        console.log('\n📊 Kontrolujem IMAP status...');
        const statusResponse = await fetch(`${PRODUCTION_API}/email-imap/status`, {
            headers: { 'Authorization': `Bearer ${authToken}` }
        });
        
        if (statusResponse.ok) {
            const statusData = await statusResponse.json();
            console.log('📊 IMAP Status:', JSON.stringify(statusData.data, null, 2));
            
            if (!statusData.data.enabled) {
                console.log('⚠️ IMAP je vypnutý, čakám na Railway redeploy...');
                return;
            }
        }
        
        // 3. Test IMAP connection
        console.log('\n🔗 Testujem IMAP pripojenie...');
        const connectionResponse = await fetch(`${PRODUCTION_API}/email-imap/test`, {
            headers: { 'Authorization': `Bearer ${authToken}` }
        });
        
        if (connectionResponse.ok) {
            const connectionData = await connectionResponse.json();
            console.log('🔗 IMAP Connection Result:', JSON.stringify(connectionData.data, null, 2));
            
            if (connectionData.data.connected) {
                console.log('✅ IMAP pripojenie FUNGUJE na Railway!');
            } else {
                console.log('❌ IMAP pripojenie NEFUNGUJE na Railway');
                console.log('💡 Možné príčiny: Railway blokuje IMAP porty alebo WebSupport nedostupný');
            }
        } else {
            console.log('❌ IMAP Connection Test Error:', connectionResponse.status);
        }
        
        // 4. Test manual email check
        console.log('\n📬 Testujem manuálnu kontrolu emailov...');
        const checkResponse = await fetch(`${PRODUCTION_API}/email-imap/check-now`, {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${authToken}` }
        });
        
        if (checkResponse.ok) {
            const checkData = await checkResponse.json();
            console.log('📬 Email Check Result:', JSON.stringify(checkData.data, null, 2));
        } else {
            console.log('❌ Email Check Error:', checkResponse.status);
        }
        
        // 5. Test spustenie IMAP monitoring
        console.log('\n🚀 Testujem spustenie IMAP monitoring...');
        const startResponse = await fetch(`${PRODUCTION_API}/email-imap/start`, {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${authToken}` }
        });
        
        if (startResponse.ok) {
            const startData = await startResponse.json();
            console.log('🚀 IMAP Start Result:', JSON.stringify(startData.data, null, 2));
            console.log('✅ IMAP monitoring spustený na Railway!');
        } else {
            const errorText = await startResponse.text();
            console.log('❌ IMAP Start Error:', startResponse.status, errorText);
        }
        
    } catch (error) {
        console.error('🚨 IMAP Test Error:', error.message);
    }
}

// Spustiť test
testIMAPConnectionProduction().then(() => {
    console.log('\n✅ IMAP connection test dokončený');
}).catch(error => {
    console.error('❌ IMAP connection test zlyhal:', error);
});


