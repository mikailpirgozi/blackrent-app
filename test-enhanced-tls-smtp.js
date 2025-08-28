const nodemailer = require('nodemailer');

// Test rôznych TLS konfigurácií pre Railway
const TLS_CONFIGS = [
    {
        name: "Aktuálna konfigurácia",
        config: {
            host: 'smtp.m1.websupport.sk',
            port: 465,
            secure: true,
            auth: {
                user: 'info@blackrent.sk',
                pass: 'Hesloheslo11'
            },
            tls: {
                rejectUnauthorized: false
            }
        }
    },
    {
        name: "Rozšírená TLS konfigurácia",
        config: {
            host: 'smtp.m1.websupport.sk',
            port: 465,
            secure: true,
            auth: {
                user: 'info@blackrent.sk',
                pass: 'Hesloheslo11'
            },
            tls: {
                rejectUnauthorized: false,
                ciphers: 'SSLv3',
                secureProtocol: 'TLSv1_2_method'
            }
        }
    },
    {
        name: "STARTTLS port 587",
        config: {
            host: 'smtp.m1.websupport.sk',
            port: 587,
            secure: false,
            auth: {
                user: 'info@blackrent.sk',
                pass: 'Hesloheslo11'
            },
            tls: {
                rejectUnauthorized: false
            }
        }
    },
    {
        name: "Minimálna TLS konfigurácia",
        config: {
            host: 'smtp.m1.websupport.sk',
            port: 465,
            secure: true,
            auth: {
                user: 'info@blackrent.sk',
                pass: 'Hesloheslo11'
            },
            tls: {
                rejectUnauthorized: false,
                minVersion: 'TLSv1'
            }
        }
    }
];

async function testTLSConfigs() {
    console.log('\n🔐 === TEST RÔZNYCH TLS KONFIGURÁCIÍ ===\n');
    
    for (const {name, config} of TLS_CONFIGS) {
        console.log(`\n🧪 Testujem: ${name}`);
        console.log(`📍 Port: ${config.port}, Secure: ${config.secure}`);
        
        try {
            const transporter = nodemailer.createTransport({
                ...config,
                connectionTimeout: 10000,
                greetingTimeout: 5000,
                socketTimeout: 10000
            });
            
            console.log('🔄 Overujem pripojenie...');
            await transporter.verify();
            console.log('✅ TLS konfigurácia funguje!');
            
            // Test odoslania
            console.log('📧 Testujem odoslanie emailu...');
            await transporter.sendMail({
                from: 'info@blackrent.sk',
                to: 'pirgozi1@gmail.com',
                subject: `TLS Test: ${name}`,
                text: `Test email s TLS konfiguráciou: ${name}\nPort: ${config.port}\nSecure: ${config.secure}\nTLS: ${JSON.stringify(config.tls, null, 2)}`
            });
            console.log('✅ Email odoslaný úspešne!');
            
        } catch (error) {
            console.log(`❌ TLS konfigurácia zlyhala: ${error.message}`);
            if (error.code) {
                console.log(`   Kód chyby: ${error.code}`);
            }
        }
    }
}

// Spustiť test
testTLSConfigs().then(() => {
    console.log('\n✅ TLS test dokončený');
}).catch(error => {
    console.error('❌ TLS test zlyhal:', error);
});


