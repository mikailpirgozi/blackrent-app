const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));

const PRODUCTION_API = 'https://blackrent-app-production-4d6f.up.railway.app/api';
const LOGIN_CREDENTIALS = {
    username: 'admin',
    password: 'Black123'
};

async function testProductionIMAPWithAuth() {
    console.log('\n🔍 === TEST PRODUCTION IMAP MONITORING (WITH AUTH) ===\n');
    
    let authToken = null;
    
    try {
        // 1. Prihlásiť sa
        console.log('🔐 Prihlasovanie do produkčnej aplikácie...');
        const loginResponse = await fetch(`${PRODUCTION_API}/auth/login`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(LOGIN_CREDENTIALS)
        });
        
        if (!loginResponse.ok) {
            throw new Error(`Login failed: ${loginResponse.status} ${loginResponse.statusText}`);
        }
        
        const loginData = await loginResponse.json();
        authToken = loginData.token;
        console.log('✅ Prihlásenie úspešné');
        
        // 2. Test IMAP status endpoint
        console.log('\n📧 Testujem IMAP status endpoint...');
        const imapResponse = await fetch(`${PRODUCTION_API}/email-imap/status`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${authToken}`
            }
        });
        
        if (imapResponse.ok) {
            const imapData = await imapResponse.json();
            console.log('✅ IMAP Status Response:', JSON.stringify(imapData, null, 2));
        } else {
            console.log('❌ IMAP Status Error:', imapResponse.status, imapResponse.statusText);
            const errorText = await imapResponse.text();
            console.log('Error details:', errorText);
        }
        
        // 3. Test IMAP connection test
        console.log('\n📧 Testujem IMAP connection test...');
        const connectionResponse = await fetch(`${PRODUCTION_API}/email-imap/test`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${authToken}`
            }
        });
        
        if (connectionResponse.ok) {
            const connectionData = await connectionResponse.json();
            console.log('✅ IMAP Connection Response:', JSON.stringify(connectionData, null, 2));
        } else {
            console.log('❌ IMAP Connection Error:', connectionResponse.status, connectionResponse.statusText);
            const errorText = await connectionResponse.text();
            console.log('Error details:', errorText);
        }
        
        // 4. Test manual email check
        console.log('\n📧 Testujem IMAP manual email check...');
        const emailResponse = await fetch(`${PRODUCTION_API}/email-imap/check-now`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${authToken}`
            }
        });
        
        if (emailResponse.ok) {
            const emailData = await emailResponse.json();
            console.log('✅ IMAP Email Check Response:', JSON.stringify(emailData, null, 2));
        } else {
            console.log('❌ IMAP Email Check Error:', emailResponse.status, emailResponse.statusText);
            const errorText = await emailResponse.text();
            console.log('Error details:', errorText);
        }
        
    } catch (error) {
        console.error('🚨 IMAP Test Error:', error.message);
    }
}

// Spustiť test
testProductionIMAPWithAuth().then(() => {
    console.log('\n✅ IMAP test s autentifikáciou dokončený');
}).catch(error => {
    console.error('❌ IMAP test zlyhal:', error);
});


