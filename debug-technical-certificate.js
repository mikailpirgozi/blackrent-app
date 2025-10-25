/**
 * 🔍 DEBUG SCRIPT PRE TECHNICAL CERTIFICATE UPLOAD
 * 
 * Skopíruj tento kód do browser console (F12) a spusti ho.
 * Script automaticky otestuje všetky kroky a identifikuje problém.
 */

(async function debugTechnicalCertificate() {
  console.log('🔍 ========================================');
  console.log('🔍 TECHNICAL CERTIFICATE UPLOAD DEBUG');
  console.log('🔍 ========================================\n');

  const results = {
    storage: { status: '⏳', details: '' },
    token: { status: '⏳', details: '' },
    tokenValidation: { status: '⏳', details: '' },
    apiConnection: { status: '⏳', details: '' },
    permissions: { status: '⏳', details: '' },
    vehicleDocuments: { status: '⏳', details: '' },
  };

  // 1. CHECK STORAGE
  console.log('1️⃣ Checking storage...');
  try {
    const token = localStorage.getItem('blackrent_token');
    const userStr = localStorage.getItem('blackrent_user');
    
    if (!token) {
      results.storage.status = '❌';
      results.storage.details = 'Token not found in localStorage';
      console.log('❌ Token not found in localStorage');
      console.log('   → Skúste sa prihlásiť znova');
    } else if (!userStr) {
      results.storage.status = '⚠️';
      results.storage.details = 'User data not found';
      console.log('⚠️ User data not found in localStorage');
    } else {
      const user = JSON.parse(userStr);
      results.storage.status = '✅';
      results.storage.details = `Token: ${token.substring(0, 20)}..., User: ${user.username} (${user.role})`;
      console.log('✅ Storage OK');
      console.log(`   Token: ${token.substring(0, 20)}...`);
      console.log(`   User: ${user.username} (${user.role})`);
    }
  } catch (error) {
    results.storage.status = '❌';
    results.storage.details = error.message;
    console.log('❌ Storage error:', error.message);
  }
  console.log('');

  // 2. CHECK TOKEN
  console.log('2️⃣ Checking token format...');
  try {
    const token = localStorage.getItem('blackrent_token');
    if (!token) {
      results.token.status = '❌';
      results.token.details = 'No token';
      console.log('❌ No token found');
    } else {
      const parts = token.split('.');
      if (parts.length !== 3) {
        results.token.status = '❌';
        results.token.details = 'Invalid JWT format';
        console.log('❌ Invalid JWT format (should have 3 parts)');
      } else {
        // Decode JWT payload
        const payload = JSON.parse(atob(parts[1]));
        const exp = new Date(payload.exp * 1000);
        const now = new Date();
        const isExpired = exp < now;
        
        results.token.status = isExpired ? '⚠️' : '✅';
        results.token.details = `Expires: ${exp.toLocaleString()}, Expired: ${isExpired}`;
        
        if (isExpired) {
          console.log('⚠️ Token is EXPIRED');
          console.log(`   Expired at: ${exp.toLocaleString()}`);
          console.log('   → Prihláste sa znova');
        } else {
          console.log('✅ Token format OK');
          console.log(`   Expires: ${exp.toLocaleString()}`);
          console.log(`   User ID: ${payload.userId}`);
          console.log(`   Role: ${payload.role}`);
        }
      }
    }
  } catch (error) {
    results.token.status = '❌';
    results.token.details = error.message;
    console.log('❌ Token decode error:', error.message);
  }
  console.log('');

  // 3. VALIDATE TOKEN WITH BACKEND
  console.log('3️⃣ Validating token with backend...');
  try {
    const token = localStorage.getItem('blackrent_token');
    if (!token) {
      results.tokenValidation.status = '⏭️';
      results.tokenValidation.details = 'Skipped (no token)';
      console.log('⏭️ Skipped (no token)');
    } else {
      const apiUrl = window.location.origin.includes('localhost') 
        ? 'http://localhost:3000/api'
        : 'https://blackrent-app.vercel.app/api';
      
      console.log(`   API URL: ${apiUrl}`);
      
      const response = await fetch(`${apiUrl}/auth/me`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (response.ok) {
        const data = await response.json();
        results.tokenValidation.status = '✅';
        results.tokenValidation.details = `Valid, User: ${data.data?.username}`;
        console.log('✅ Token is valid');
        console.log(`   User: ${data.data?.username} (${data.data?.role})`);
      } else {
        results.tokenValidation.status = '❌';
        results.tokenValidation.details = `${response.status} ${response.statusText}`;
        console.log(`❌ Token validation failed: ${response.status} ${response.statusText}`);
        const errorData = await response.json();
        console.log('   Error:', errorData.error);
        console.log('   → Prihláste sa znova');
      }
    }
  } catch (error) {
    results.tokenValidation.status = '❌';
    results.tokenValidation.details = error.message;
    console.log('❌ Token validation error:', error.message);
    console.log('   → Skontrolujte či backend beží');
  }
  console.log('');

  // 4. CHECK API CONNECTION
  console.log('4️⃣ Checking API connection...');
  try {
    const apiUrl = window.location.origin.includes('localhost') 
      ? 'http://localhost:3000/api'
      : 'https://blackrent-app.vercel.app/api';
    
    const response = await fetch(`${apiUrl}/health`);
    if (response.ok) {
      results.apiConnection.status = '✅';
      results.apiConnection.details = 'API is reachable';
      console.log('✅ API is reachable');
    } else {
      results.apiConnection.status = '⚠️';
      results.apiConnection.details = `${response.status} ${response.statusText}`;
      console.log(`⚠️ API returned: ${response.status} ${response.statusText}`);
    }
  } catch (error) {
    results.apiConnection.status = '❌';
    results.apiConnection.details = error.message;
    console.log('❌ API connection error:', error.message);
    console.log('   → Skontrolujte či backend beží');
  }
  console.log('');

  // 5. CHECK PERMISSIONS
  console.log('5️⃣ Checking permissions...');
  try {
    const userStr = localStorage.getItem('blackrent_user');
    if (!userStr) {
      results.permissions.status = '⏭️';
      results.permissions.details = 'Skipped (no user)';
      console.log('⏭️ Skipped (no user)');
    } else {
      const user = JSON.parse(userStr);
      const hasVehiclePermission = 
        user.role === 'admin' || 
        user.role === 'super_admin' ||
        user.role === 'company_admin' ||
        (user.permissions && user.permissions.some(p => 
          p.resource === 'vehicles' && p.actions.includes('update')
        ));
      
      if (hasVehiclePermission) {
        results.permissions.status = '✅';
        results.permissions.details = `Role: ${user.role}`;
        console.log('✅ User has vehicle:update permission');
        console.log(`   Role: ${user.role}`);
      } else {
        results.permissions.status = '❌';
        results.permissions.details = `Role: ${user.role} (no vehicle:update)`;
        console.log('❌ User does NOT have vehicle:update permission');
        console.log(`   Role: ${user.role}`);
        console.log('   → Kontaktujte administrátora');
      }
    }
  } catch (error) {
    results.permissions.status = '❌';
    results.permissions.details = error.message;
    console.log('❌ Permission check error:', error.message);
  }
  console.log('');

  // 6. TEST VEHICLE DOCUMENTS ENDPOINT
  console.log('6️⃣ Testing vehicle-documents endpoint...');
  try {
    const token = localStorage.getItem('blackrent_token');
    if (!token) {
      results.vehicleDocuments.status = '⏭️';
      results.vehicleDocuments.details = 'Skipped (no token)';
      console.log('⏭️ Skipped (no token)');
    } else {
      const apiUrl = window.location.origin.includes('localhost') 
        ? 'http://localhost:3000/api'
        : 'https://blackrent-app.vercel.app/api';
      
      // Get vehicles first
      const vehiclesResponse = await fetch(`${apiUrl}/vehicles`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (!vehiclesResponse.ok) {
        results.vehicleDocuments.status = '❌';
        results.vehicleDocuments.details = 'Cannot fetch vehicles';
        console.log('❌ Cannot fetch vehicles');
        return;
      }
      
      const vehiclesData = await vehiclesResponse.json();
      if (!vehiclesData.data || vehiclesData.data.length === 0) {
        results.vehicleDocuments.status = '⚠️';
        results.vehicleDocuments.details = 'No vehicles found';
        console.log('⚠️ No vehicles found in database');
        console.log('   → Vytvorte aspoň jedno vozidlo');
        return;
      }
      
      const testVehicle = vehiclesData.data[0];
      console.log(`   Test vehicle: ${testVehicle.brand} ${testVehicle.model} (${testVehicle.licensePlate})`);
      
      // Try to create a test document
      const testDoc = {
        vehicleId: testVehicle.id,
        documentType: 'technical_certificate',
        validTo: new Date(Date.now() + 10 * 365 * 24 * 60 * 60 * 1000).toISOString(),
        documentNumber: 'DEBUG TEST ' + new Date().toISOString(),
        notes: 'Automatický test - môžete vymazať',
        filePath: 'https://example.com/debug-test.pdf'
      };
      
      const createResponse = await fetch(`${apiUrl}/vehicle-documents`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(testDoc)
      });
      
      if (createResponse.ok) {
        const createData = await createResponse.json();
        results.vehicleDocuments.status = '✅';
        results.vehicleDocuments.details = 'Test document created successfully';
        console.log('✅ Test document created successfully');
        console.log(`   Document ID: ${createData.data.id}`);
        
        // Clean up - delete test document
        await fetch(`${apiUrl}/vehicle-documents/${createData.data.id}`, {
          method: 'DELETE',
          headers: { Authorization: `Bearer ${token}` }
        });
        console.log('   (Test document deleted)');
      } else {
        results.vehicleDocuments.status = '❌';
        const errorData = await createResponse.json();
        results.vehicleDocuments.details = errorData.error;
        console.log(`❌ Failed to create test document: ${createResponse.status}`);
        console.log('   Error:', errorData.error);
      }
    }
  } catch (error) {
    results.vehicleDocuments.status = '❌';
    results.vehicleDocuments.details = error.message;
    console.log('❌ Vehicle documents test error:', error.message);
  }
  console.log('');

  // SUMMARY
  console.log('🔍 ========================================');
  console.log('🔍 SUMMARY');
  console.log('🔍 ========================================');
  console.log('');
  console.log('1. Storage:            ', results.storage.status, results.storage.details);
  console.log('2. Token Format:       ', results.token.status, results.token.details);
  console.log('3. Token Validation:   ', results.tokenValidation.status, results.tokenValidation.details);
  console.log('4. API Connection:     ', results.apiConnection.status, results.apiConnection.details);
  console.log('5. Permissions:        ', results.permissions.status, results.permissions.details);
  console.log('6. Vehicle Documents:  ', results.vehicleDocuments.status, results.vehicleDocuments.details);
  console.log('');

  const allPassed = Object.values(results).every(r => r.status === '✅' || r.status === '⏭️');
  
  if (allPassed) {
    console.log('✅ ========================================');
    console.log('✅ ALL CHECKS PASSED!');
    console.log('✅ ========================================');
    console.log('');
    console.log('Technical certificate upload should work.');
    console.log('If you still have issues, check:');
    console.log('  1. R2 file upload (check R2 credentials)');
    console.log('  2. Browser console for detailed errors');
    console.log('  3. Network tab in DevTools');
  } else {
    console.log('❌ ========================================');
    console.log('❌ SOME CHECKS FAILED');
    console.log('❌ ========================================');
    console.log('');
    console.log('Please fix the issues above and try again.');
    console.log('');
    console.log('Common solutions:');
    console.log('  • Token expired → Logout and login again');
    console.log('  • Backend not running → Start backend server');
    console.log('  • No permissions → Login as admin');
    console.log('  • No vehicles → Create at least one vehicle');
  }

  return results;
})();

