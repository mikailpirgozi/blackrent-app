// 🚀 FÁZA 2.4: Response Size Analysis Tool
const http = require('http');

async function analyzeResponseSizes() {
  console.log('📊 Analyzing current API response sizes...');
  
  const endpoints = [
    { name: 'Calendar API (current month)', path: '/api/availability/calendar?phase=current' },
    { name: 'All Vehicles', path: '/api/vehicles' },
    { name: 'All Rentals', path: '/api/rentals' },
    { name: 'Bulk Data', path: '/api/bulk' }
  ];

  for (const endpoint of endpoints) {
    try {
      const startTime = Date.now();
      
      const response = await fetch(`http://localhost:3001${endpoint.path}`, {
        headers: {
          'Authorization': 'Bearer dummy-token-for-analysis'
        }
      });
      
      const responseTime = Date.now() - startTime;
      const responseText = await response.text();
      const responseSize = new TextEncoder().encode(responseText).length;
      
      // Analyze JSON structure
      let jsonData;
      try {
        jsonData = JSON.parse(responseText);
      } catch (e) {
        jsonData = null;
      }
      
      console.log(`\n📡 ${endpoint.name}:`);
      console.log(`   Size: ${responseSize} bytes (${(responseSize/1024).toFixed(2)} KB)`);
      console.log(`   Response time: ${responseTime}ms`);
      console.log(`   Status: ${response.status}`);
      
      if (jsonData && jsonData.data) {
        if (jsonData.data.calendar) {
          console.log(`   Calendar days: ${jsonData.data.calendar.length}`);
          if (jsonData.data.calendar[0]?.vehicles) {
            console.log(`   Vehicles per day: ${jsonData.data.calendar[0].vehicles.length}`);
          }
        }
        if (jsonData.data.vehicles) {
          console.log(`   Vehicles: ${jsonData.data.vehicles.length}`);
        }
        if (jsonData.data.rentals) {
          console.log(`   Rentals: ${jsonData.data.rentals.length}`);
        }
      }

      // Estimate compression potential
      const gzippedSize = estimateGzipSize(responseText);
      const compressionRatio = ((responseSize - gzippedSize) / responseSize * 100).toFixed(1);
      console.log(`   Estimated gzip size: ${gzippedSize} bytes (${compressionRatio}% compression)`);
      
    } catch (error) {
      console.log(`\n❌ ${endpoint.name}: Error - ${error.message}`);
    }
  }
  
  console.log('\n🎯 Analysis complete. Recommendations:');
  console.log('   1. Implement field selection for large responses');
  console.log('   2. Add gzip compression middleware');
  console.log('   3. Optimize JSON structure for redundancy');
  console.log('   4. Consider response pagination for large datasets');
}

// Simple gzip size estimation (very rough)
function estimateGzipSize(text) {
  // Rough estimation: gzip typically achieves 60-80% compression for JSON
  const duplicateReduction = countDuplicateStrings(text) * 0.7;
  const baseCompression = text.length * 0.3; // ~70% compression baseline
  return Math.floor(text.length - duplicateReduction - baseCompression);
}

function countDuplicateStrings(text) {
  const words = text.match(/"\w+"/g) || [];
  const wordCounts = {};
  let duplicates = 0;
  
  words.forEach(word => {
    wordCounts[word] = (wordCounts[word] || 0) + 1;
    if (wordCounts[word] > 1) duplicates++;
  });
  
  return duplicates;
}

// Test with fetch polyfill for Node.js
if (typeof fetch === 'undefined') {
  // Use node-fetch if available, otherwise skip HTTP tests
  try {
    const fetch = require('node-fetch');
    global.fetch = fetch;
    analyzeResponseSizes().catch(console.error);
  } catch (e) {
    console.log('📊 Response size analysis requires running application on localhost:3001');
    console.log('   Start app with: npm run dev:restart');
    console.log('   Then run: node database/test-response-sizes.js');
  }
} else {
  analyzeResponseSizes().catch(console.error);
}