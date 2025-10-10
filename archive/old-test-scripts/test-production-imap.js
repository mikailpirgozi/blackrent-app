const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));

const PRODUCTION_API = 'https://blackrent-app-production-4d6f.up.railway.app/api';

async function testProductionIMAP() {
    console.log('\n🔍 === TEST PRODUCTION IMAP MONITORING ===\n');
    
    try {
        // 1. Test IMAP status endpoint
        console.log('📧 Testujem IMAP status endpoint...');
        const imapResponse = await fetch(`${PRODUCTION_API}/email-imap/status`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json'
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
        
        // 2. Test IMAP connection
        console.log('\n📧 Testujem IMAP connection test...');
        const connectionResponse = await fetch(`${PRODUCTION_API}/email-imap/test`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
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
        
        // 3. Test email check
        console.log('\n📧 Testujem IMAP email check...');
        const emailResponse = await fetch(`${PRODUCTION_API}/email-imap/check-now`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
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
testProductionIMAP().then(() => {
    console.log('\n✅ IMAP test dokončený');
}).catch(error => {
    console.error('❌ IMAP test zlyhal:', error);
});
