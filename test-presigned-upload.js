#!/usr/bin/env node

/**
 * Test presigned upload endpoint
 * Testuje či backend správne generuje presigned URL
 */

import fetch from 'node-fetch';
import FormData from 'form-data';
import fs from 'fs';

const API_BASE_URL = 'https://blackrent-app-production-4d6f.up.railway.app/api';

async function testPresignedUpload() {
  console.log('🧪 Testing presigned upload endpoint...\n');

  try {
    // 1. Test s validnými parametrami
    console.log('1️⃣ Testing with valid parameters...');
    
    const formData = new FormData();
    formData.append('protocolId', 'test-protocol-123');
    formData.append('protocolType', 'handover');
    formData.append('mediaType', 'vehicle');
    formData.append('filename', 'test-image.jpg');
    formData.append('contentType', 'image/jpeg');
    formData.append('category', 'vehicle_photos');

    const response = await fetch(`${API_BASE_URL}/files/presigned-upload`, {
      method: 'POST',
      headers: {
        'Authorization': 'Bearer test-token', // Možno bude potrebný validný token
        ...formData.getHeaders()
      },
      body: formData
    });

    console.log('📊 Response status:', response.status);
    console.log('📊 Response headers:', Object.fromEntries(response.headers.entries()));

    const responseText = await response.text();
    console.log('📊 Response body:', responseText);

    if (response.ok) {
      const data = JSON.parse(responseText);
      console.log('✅ SUCCESS: Presigned URL generated');
      console.log('🔗 Presigned URL:', data.presignedUrl ? 'Generated' : 'Missing');
      console.log('🌐 Public URL:', data.publicUrl ? 'Generated' : 'Missing');
      console.log('🗂️ File Key:', data.fileKey || 'Missing');
    } else {
      console.log('❌ FAILED: Presigned URL generation failed');
      console.log('Error:', responseText);
    }

  } catch (error) {
    console.error('💥 Test failed with error:', error.message);
  }

  console.log('\n2️⃣ Testing with missing parameters...');
  
  try {
    const formData2 = new FormData();
    formData2.append('protocolId', 'test-protocol-123');
    // Missing protocolType, filename, contentType

    const response2 = await fetch(`${API_BASE_URL}/files/presigned-upload`, {
      method: 'POST',
      headers: {
        'Authorization': 'Bearer test-token',
        ...formData2.getHeaders()
      },
      body: formData2
    });

    console.log('📊 Response status:', response2.status);
    const responseText2 = await response2.text();
    console.log('📊 Response body:', responseText2);

    if (response2.status === 400) {
      console.log('✅ SUCCESS: Correctly rejected missing parameters');
    } else {
      console.log('❌ FAILED: Should have rejected missing parameters');
    }

  } catch (error) {
    console.error('💥 Test failed with error:', error.message);
  }

  console.log('\n3️⃣ Testing R2 configuration...');
  
  try {
    // Test či je R2 nakonfigurované
    const healthResponse = await fetch(`${API_BASE_URL}/health`);
    if (healthResponse.ok) {
      const healthData = await healthResponse.json();
      console.log('🏥 Health check:', healthData);
    }
  } catch (error) {
    console.log('⚠️ Health check failed:', error.message);
  }
}

// Spusti test
testPresignedUpload().then(() => {
  console.log('\n🏁 Test completed');
}).catch(error => {
  console.error('💥 Test suite failed:', error);
});
