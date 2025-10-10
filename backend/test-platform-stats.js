const fetch = require('node-fetch');

async function test() {
  // Get token first (login as admin)
  const loginRes = await fetch('http://localhost:3001/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username: 'admin', password: 'admin123' })
  });
  const loginData = await loginRes.json();
  const token = loginData.data.token;
  
  console.log('✅ Logged in as admin, token:', token.substring(0, 20) + '...');
  
  // Get platforms
  const platformsRes = await fetch('http://localhost:3001/api/platforms', {
    headers: { 'Authorization': 'Bearer ' + token }
  });
  const platformsData = await platformsRes.json();
  
  if (!platformsData.data || platformsData.data.length === 0) {
    console.log('❌ No platforms found');
    return;
  }
  
  const platformId = platformsData.data[0].id;
  console.log('📋 Testing platform:', platformId, platformsData.data[0].name);
  
  // Test stats
  const statsRes = await fetch(`http://localhost:3001/api/platforms/${platformId}/stats`, {
    headers: { 'Authorization': 'Bearer ' + token }
  });
  const statsData = await statsRes.json();
  
  console.log('📊 Stats response:', JSON.stringify(statsData, null, 2));
}

test().catch(console.error);
