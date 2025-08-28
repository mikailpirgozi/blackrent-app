const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));

const PRODUCTION_API = 'https://blackrent-app-production-4d6f.up.railway.app/api';

async function testDirectSMTP() {
    console.log('\n🧪 === TEST DIRECT SMTP NA RAILWAY PRODUKCII ===\n');
    
    try {
        console.log('📧 Testujem priamy SMTP bez autentifikácie a databázy...');
        console.log(`🌐 Endpoint: ${PRODUCTION_API}/smtp-test/direct-test`);
        
        const response = await fetch(`${PRODUCTION_API}/smtp-test/direct-test`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            }
        });
        
        console.log(`📊 Response status: ${response.status} ${response.statusText}`);
        
        if (response.ok) {
            const data = await response.json();
            console.log('✅ DIRECT SMTP RESPONSE:', JSON.stringify(data, null, 2));
        } else {
            const errorData = await response.json();
            console.log('❌ DIRECT SMTP ERROR:', JSON.stringify(errorData, null, 2));
        }
        
    } catch (error) {
        console.error('🚨 Direct SMTP Test Error:', error.message);
    }
}

// Spustiť test
testDirectSMTP().then(() => {
    console.log('\n✅ Direct SMTP test dokončený');
}).catch(error => {
    console.error('❌ Direct SMTP test zlyhal:', error);
});


