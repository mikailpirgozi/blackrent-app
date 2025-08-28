#!/usr/bin/env node

const https = require('https');

console.log('🧪 TESTUJEME SMTP PO NODE.JS 20 FIX...\n');

const postData = JSON.stringify({
  test: 'Railway SMTP po Node.js 20 fix'
});

const options = {
  hostname: 'blackrent-app-production.up.railway.app',
  port: 443,
  path: '/api/smtp-test/direct-test',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Content-Length': Buffer.byteLength(postData)
  }
};

const req = https.request(options, (res) => {
  console.log(`📡 Status: ${res.statusCode}`);
  console.log(`📋 Headers:`, res.headers);
  
  let data = '';
  res.on('data', (chunk) => {
    data += chunk;
  });
  
  res.on('end', () => {
    try {
      const result = JSON.parse(data);
      if (result.success) {
        console.log('\n✅ SMTP FUNGUJE!');
        console.log(`📧 Message ID: ${result.messageId}`);
        console.log(`🕐 Timestamp: ${result.timestamp}`);
        console.log(`🟢 Node.js Version: ${result.nodeVersion}`);
        console.log(`🌍 Environment: ${result.environment}`);
        console.log('\n🎉 PROBLÉM VYRIEŠENÝ! Node.js 20 fix funguje!');
      } else {
        console.log('\n❌ SMTP STÁLE NEFUNGUJE:');
        console.log(`💥 Error: ${result.error}`);
        console.log(`🔧 Code: ${result.code}`);
        console.log(`🟡 Node.js Version: ${result.nodeVersion}`);
        console.log(`🌍 Environment: ${result.environment}`);
      }
    } catch (e) {
      console.log('\n❌ JSON Parse Error:');
      console.log('📄 Raw Response:', data);
    }
  });
});

req.on('error', (error) => {
  console.error('\n💥 Request Error:', error.message);
});

req.write(postData);
req.end();

console.log('📤 Odosielam test na Railway...');
