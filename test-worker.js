// 🧪 Test script pre Cloudflare Worker
console.log('🧪 Testing Cloudflare Worker configuration...');

// Test environment variables
console.log('Environment variables:');
console.log('REACT_APP_USE_WORKER_PROXY:', process.env.REACT_APP_USE_WORKER_PROXY);
console.log('REACT_APP_WORKER_URL:', process.env.REACT_APP_WORKER_URL);
console.log('REACT_APP_API_URL:', process.env.REACT_APP_API_URL);

// Test Worker URL
const workerUrl = process.env.REACT_APP_WORKER_URL || 'https://blackrent-upload-worker.r2workerblackrentapp.workers.dev';
console.log('✅ Worker URL:', workerUrl);

// Test CORS preflight
fetch(workerUrl, {
  method: 'OPTIONS',
  headers: {
    'Origin': 'http://localhost:3000'
  }
})
.then(response => {
  console.log('✅ CORS preflight test:', response.status);
  console.log('CORS headers:', {
    'access-control-allow-origin': response.headers.get('access-control-allow-origin'),
    'access-control-allow-methods': response.headers.get('access-control-allow-methods'),
    'access-control-allow-headers': response.headers.get('access-control-allow-headers')
  });
})
.catch(error => {
  console.error('❌ CORS test failed:', error);
});

console.log('�� Test completed!'); 