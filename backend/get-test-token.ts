import axios from 'axios';
import * as dotenv from 'dotenv';

dotenv.config();

const API_URL = process.env.API_URL || 'http://localhost:3000/api';

// Default admin credentials
const ADMIN_USERNAME = process.env.ADMIN_USERNAME || 'admin';
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'Black123';

async function getTestToken() {
  try {
    console.log('🔐 Získavam test token...\n');
    console.log(`API URL: ${API_URL}`);
    console.log(`Username: ${ADMIN_USERNAME}`);

    const response = await axios.post(`${API_URL}/auth/login`, {
      username: ADMIN_USERNAME,
      password: ADMIN_PASSWORD,
    });

    if (response.data.success && response.data.token) {
      const token = response.data.token;

      console.log('\n✅ Token získaný úspešne!\n');
      console.log('📋 Použite tento príkaz:');
      console.log(`\nexport TEST_TOKEN="${token}"\n`);

      // Save to .test.env file
      const fs = await import('fs');
      fs.writeFileSync('.test.env', `TEST_TOKEN="${token}"\n`);

      console.log('💾 Token uložený do .test.env súboru');
      console.log('\n🚀 Teraz môžete spustiť performance testy:');
      console.log('  source .test.env && npm run test:performance');
      console.log('  source .test.env && npm run test:load-comparison\n');

      return token;
    } else {
      console.error('❌ Nepodarilo sa získať token');
      console.error('Response:', response.data);
      process.exit(1);
    }
  } catch (error) {
    if (axios.isAxiosError(error)) {
      console.error('❌ Chyba pri získavaní tokenu:');
      console.error('Status:', error.response?.status);
      console.error('Data:', error.response?.data);
      console.error('\n💡 Skontrolujte:');
      console.error('  1. Server beží na správnom porte');
      console.error('  2. Admin používateľ existuje');
      console.error('  3. Prihlasovacie údaje sú správne');
    } else {
      console.error('❌ Neznáma chyba:', error);
    }
    process.exit(1);
  }
}

getTestToken();

