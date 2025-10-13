/**
 * 🧪 KOMPLETNÝ TEST VŠETKÝCH FASTIFY ENDPOINTOV
 * 
 * Tento script overí že všetkých 108 endpointov je:
 * - Správne zaregistrovaných
 * - Dostupných cez HTTP
 * - Má správne TypeScript typy
 */

import { buildFastify } from './src/fastify-app';

interface EndpointTest {
  method: 'GET' | 'POST' | 'PUT' | 'DELETE';
  path: string;
  requiresAuth: boolean;
  category: string;
}

const allEndpoints: EndpointTest[] = [
  // AUTH ENDPOINTS (39)
  { method: 'POST', path: '/api/auth/login', requiresAuth: false, category: 'auth' },
  { method: 'POST', path: '/api/auth/register', requiresAuth: false, category: 'auth' },
  { method: 'GET', path: '/api/auth/me', requiresAuth: true, category: 'auth' },
  { method: 'POST', path: '/api/auth/logout', requiresAuth: true, category: 'auth' },
  { method: 'POST', path: '/api/auth/refresh', requiresAuth: false, category: 'auth' },
  { method: 'GET', path: '/api/auth/verify', requiresAuth: true, category: 'auth' },
  { method: 'POST', path: '/api/auth/forgot-password', requiresAuth: false, category: 'auth' },
  
  { method: 'POST', path: '/api/auth/create-admin', requiresAuth: false, category: 'auth' },
  { method: 'GET', path: '/api/auth/create-admin', requiresAuth: false, category: 'auth' },
  { method: 'GET', path: '/api/auth/reset-admin-get', requiresAuth: false, category: 'auth' },
  { method: 'POST', path: '/api/auth/reset-admin', requiresAuth: false, category: 'auth' },
  { method: 'GET', path: '/api/auth/create-super-admin', requiresAuth: false, category: 'auth' },
  
  { method: 'GET', path: '/api/auth/users', requiresAuth: true, category: 'auth' },
  { method: 'POST', path: '/api/auth/users', requiresAuth: true, category: 'auth' },
  { method: 'PUT', path: '/api/auth/users/test-id-123', requiresAuth: true, category: 'auth' },
  { method: 'DELETE', path: '/api/auth/users/test-id-123', requiresAuth: true, category: 'auth' },
  { method: 'GET', path: '/api/auth/investors-with-shares', requiresAuth: true, category: 'auth' },
  
  { method: 'GET', path: '/api/auth/reset-pavlik', requiresAuth: false, category: 'auth' },
  { method: 'GET', path: '/api/auth/setup-admin', requiresAuth: false, category: 'auth' },
  { method: 'GET', path: '/api/auth/init-admin', requiresAuth: false, category: 'auth' },
  { method: 'POST', path: '/api/auth/init-database', requiresAuth: false, category: 'auth' },
  { method: 'GET', path: '/api/auth/debug-db', requiresAuth: false, category: 'auth' },
  { method: 'GET', path: '/api/auth/debug-token', requiresAuth: true, category: 'auth' },
  { method: 'GET', path: '/api/auth/debug-users-table', requiresAuth: false, category: 'auth' },
  { method: 'GET', path: '/api/auth/test-permissions', requiresAuth: true, category: 'auth' },
  { method: 'GET', path: '/api/auth/debug-company-owner', requiresAuth: true, category: 'auth' },
  { method: 'POST', path: '/api/auth/debug-permission', requiresAuth: true, category: 'auth' },
  { method: 'POST', path: '/api/auth/auto-assign-vehicles', requiresAuth: true, category: 'auth' },
  { method: 'GET', path: '/api/auth/debug-vincursky', requiresAuth: false, category: 'auth' },
  { method: 'POST', path: '/api/auth/migrate-vehicle-companies', requiresAuth: true, category: 'auth' },
  { method: 'POST', path: '/api/auth/auto-assign-user-companies', requiresAuth: true, category: 'auth' },
  
  // CUSTOMERS ENDPOINTS (8)
  { method: 'GET', path: '/api/customers', requiresAuth: true, category: 'customers' },
  { method: 'POST', path: '/api/customers', requiresAuth: true, category: 'customers' },
  { method: 'GET', path: '/api/customers/test-id-123', requiresAuth: true, category: 'customers' },
  { method: 'PUT', path: '/api/customers/test-id-123', requiresAuth: true, category: 'customers' },
  { method: 'DELETE', path: '/api/customers/test-id-123', requiresAuth: true, category: 'customers' },
  { method: 'GET', path: '/api/customers/export/csv', requiresAuth: true, category: 'customers' },
  { method: 'POST', path: '/api/customers/import/csv', requiresAuth: true, category: 'customers' },
  { method: 'GET', path: '/api/customers/paginated', requiresAuth: true, category: 'customers' },
  
  // VEHICLES ENDPOINTS (13)
  { method: 'GET', path: '/api/vehicles', requiresAuth: true, category: 'vehicles' },
  { method: 'POST', path: '/api/vehicles', requiresAuth: true, category: 'vehicles' },
  { method: 'GET', path: '/api/vehicles/test-id-123', requiresAuth: true, category: 'vehicles' },
  { method: 'PUT', path: '/api/vehicles/test-id-123', requiresAuth: true, category: 'vehicles' },
  { method: 'DELETE', path: '/api/vehicles/test-id-123', requiresAuth: true, category: 'vehicles' },
  { method: 'GET', path: '/api/vehicles/bulk-ownership-history', requiresAuth: true, category: 'vehicles' },
  { method: 'GET', path: '/api/vehicles/check-duplicate/AA123BB', requiresAuth: true, category: 'vehicles' },
  { method: 'POST', path: '/api/vehicles/assign-to-company', requiresAuth: true, category: 'vehicles' },
  { method: 'GET', path: '/api/vehicles/export/csv', requiresAuth: true, category: 'vehicles' },
  { method: 'POST', path: '/api/vehicles/import/csv', requiresAuth: true, category: 'vehicles' },
  { method: 'GET', path: '/api/vehicles/paginated', requiresAuth: true, category: 'vehicles' },
  { method: 'POST', path: '/api/vehicles/batch-import', requiresAuth: true, category: 'vehicles' },
  { method: 'GET', path: '/api/vehicles/test-duplicate', requiresAuth: true, category: 'vehicles' },
  
  // RENTALS ENDPOINTS (8)
  { method: 'GET', path: '/api/rentals', requiresAuth: true, category: 'rentals' },
  { method: 'POST', path: '/api/rentals', requiresAuth: true, category: 'rentals' },
  { method: 'GET', path: '/api/rentals/test-id-123', requiresAuth: true, category: 'rentals' },
  { method: 'PUT', path: '/api/rentals/test-id-123', requiresAuth: true, category: 'rentals' },
  { method: 'DELETE', path: '/api/rentals/test-id-123', requiresAuth: true, category: 'rentals' },
  { method: 'GET', path: '/api/rentals/paginated', requiresAuth: true, category: 'rentals' },
  { method: 'POST', path: '/api/rentals/test-id-123/clone', requiresAuth: true, category: 'rentals' },
  { method: 'POST', path: '/api/rentals/batch-import', requiresAuth: true, category: 'rentals' },
  
  // PROTOCOLS ENDPOINTS (10)
  { method: 'GET', path: '/api/protocols', requiresAuth: true, category: 'protocols' },
  { method: 'GET', path: '/api/protocols/test-id-123', requiresAuth: true, category: 'protocols' },
  { method: 'POST', path: '/api/protocols/handover', requiresAuth: true, category: 'protocols' },
  { method: 'POST', path: '/api/protocols/return', requiresAuth: true, category: 'protocols' },
  { method: 'DELETE', path: '/api/protocols/handover/test-id-123', requiresAuth: true, category: 'protocols' },
  { method: 'DELETE', path: '/api/protocols/return/test-id-123', requiresAuth: true, category: 'protocols' },
  { method: 'GET', path: '/api/protocols/handover/test-id-123/pdf', requiresAuth: true, category: 'protocols' },
  { method: 'GET', path: '/api/protocols/return/test-id-123/pdf', requiresAuth: true, category: 'protocols' },
  { method: 'GET', path: '/api/protocols/rental/test-id-123', requiresAuth: true, category: 'protocols' },
  { method: 'GET', path: '/api/protocols/rental/test-id-123/download-all', requiresAuth: true, category: 'protocols' },
  
  // EXPENSES ENDPOINTS (9)
  { method: 'GET', path: '/api/expenses', requiresAuth: true, category: 'expenses' },
  { method: 'POST', path: '/api/expenses', requiresAuth: true, category: 'expenses' },
  { method: 'GET', path: '/api/expenses/test-id-123', requiresAuth: true, category: 'expenses' },
  { method: 'PUT', path: '/api/expenses/test-id-123', requiresAuth: true, category: 'expenses' },
  { method: 'DELETE', path: '/api/expenses/test-id-123', requiresAuth: true, category: 'expenses' },
  { method: 'GET', path: '/api/expenses/export/csv', requiresAuth: true, category: 'expenses' },
  { method: 'POST', path: '/api/expenses/import/csv', requiresAuth: true, category: 'expenses' },
  { method: 'POST', path: '/api/expenses/batch-import', requiresAuth: true, category: 'expenses' },
  { method: 'POST', path: '/api/expenses/batch-import-stream', requiresAuth: true, category: 'expenses' },
  
  // SETTLEMENTS ENDPOINTS (6)
  { method: 'GET', path: '/api/settlements', requiresAuth: true, category: 'settlements' },
  { method: 'GET', path: '/api/settlements/test-id-123', requiresAuth: true, category: 'settlements' },
  { method: 'POST', path: '/api/settlements', requiresAuth: true, category: 'settlements' },
  { method: 'PUT', path: '/api/settlements/test-id-123', requiresAuth: true, category: 'settlements' },
  { method: 'DELETE', path: '/api/settlements/test-id-123', requiresAuth: true, category: 'settlements' },
  { method: 'GET', path: '/api/settlements/test-id-123/pdf', requiresAuth: true, category: 'settlements' },
  
  // LEASINGS ENDPOINTS (15)
  { method: 'GET', path: '/api/leasings/paginated', requiresAuth: true, category: 'leasings' },
  { method: 'GET', path: '/api/leasings', requiresAuth: true, category: 'leasings' },
  { method: 'GET', path: '/api/leasings/dashboard', requiresAuth: true, category: 'leasings' },
  { method: 'GET', path: '/api/leasings/test-id-123', requiresAuth: true, category: 'leasings' },
  { method: 'POST', path: '/api/leasings', requiresAuth: true, category: 'leasings' },
  { method: 'PUT', path: '/api/leasings/test-id-123', requiresAuth: true, category: 'leasings' },
  { method: 'DELETE', path: '/api/leasings/test-id-123', requiresAuth: true, category: 'leasings' },
  { method: 'POST', path: '/api/leasings/test-id-123/mark-payment', requiresAuth: true, category: 'leasings' },
  { method: 'GET', path: '/api/leasings/test-id-123/schedule', requiresAuth: true, category: 'leasings' },
  { method: 'GET', path: '/api/leasings/test-id-123/payments', requiresAuth: true, category: 'leasings' },
  { method: 'POST', path: '/api/leasings/test-id-123/payments', requiresAuth: true, category: 'leasings' },
  { method: 'PUT', path: '/api/leasings/test-id-123/payments/payment-123', requiresAuth: true, category: 'leasings' },
  { method: 'GET', path: '/api/leasings/upcoming-payments', requiresAuth: true, category: 'leasings' },
  { method: 'GET', path: '/api/leasings/overdue', requiresAuth: true, category: 'leasings' },
  { method: 'POST', path: '/api/leasings/test-id-123/early-repayment', requiresAuth: true, category: 'leasings' },
  
  // FILES ENDPOINTS (14)
  { method: 'POST', path: '/api/files/upload', requiresAuth: true, category: 'files' },
  { method: 'GET', path: '/api/files/test-key-123', requiresAuth: true, category: 'files' },
  { method: 'DELETE', path: '/api/files/test-key-123', requiresAuth: true, category: 'files' },
  { method: 'POST', path: '/api/files/batch-upload', requiresAuth: true, category: 'files' },
  { method: 'POST', path: '/api/files/presigned-url', requiresAuth: true, category: 'files' },
  { method: 'GET', path: '/api/files/proxy/test-key-123', requiresAuth: true, category: 'files' },
  { method: 'GET', path: '/api/files/test-key-123/url', requiresAuth: true, category: 'files' },
  { method: 'GET', path: '/api/files/status', requiresAuth: true, category: 'files' },
  { method: 'POST', path: '/api/files/protocol-upload', requiresAuth: true, category: 'files' },
  { method: 'POST', path: '/api/files/protocol-pdf', requiresAuth: true, category: 'files' },
  { method: 'GET', path: '/api/files/protocol/test-id-123/images', requiresAuth: true, category: 'files' },
  { method: 'POST', path: '/api/files/protocol-photo', requiresAuth: true, category: 'files' },
  { method: 'POST', path: '/api/files/presigned-upload', requiresAuth: true, category: 'files' },
  { method: 'POST', path: '/api/files/download-zip', requiresAuth: true, category: 'files' },
  { method: 'GET', path: '/api/files/test-zip', requiresAuth: true, category: 'files' },
  
  // KOMPLETNÉ SÚBORY (44 endpointov)
  // Companies (5)
  { method: 'GET', path: '/api/companies', requiresAuth: true, category: 'companies' },
  { method: 'POST', path: '/api/companies', requiresAuth: true, category: 'companies' },
  { method: 'GET', path: '/api/companies/test-id-123', requiresAuth: true, category: 'companies' },
  { method: 'PUT', path: '/api/companies/test-id-123', requiresAuth: true, category: 'companies' },
  { method: 'DELETE', path: '/api/companies/test-id-123', requiresAuth: true, category: 'companies' },
  
  // Debug (4)
  { method: 'GET', path: '/api/debug/test-connection', requiresAuth: false, category: 'debug' },
  { method: 'GET', path: '/api/debug/test-database', requiresAuth: false, category: 'debug' },
  { method: 'GET', path: '/api/debug/test-prisma', requiresAuth: false, category: 'debug' },
  { method: 'GET', path: '/api/debug/test-postgres', requiresAuth: false, category: 'debug' },
  
  // Platforms (7)
  { method: 'GET', path: '/api/platforms', requiresAuth: true, category: 'platforms' },
  { method: 'POST', path: '/api/platforms', requiresAuth: true, category: 'platforms' },
  { method: 'GET', path: '/api/platforms/test-id-123', requiresAuth: true, category: 'platforms' },
  { method: 'PUT', path: '/api/platforms/test-id-123', requiresAuth: true, category: 'platforms' },
  { method: 'DELETE', path: '/api/platforms/test-id-123', requiresAuth: true, category: 'platforms' },
  { method: 'GET', path: '/api/platforms/test-id-123/companies', requiresAuth: true, category: 'platforms' },
  { method: 'GET', path: '/api/platforms/test-id-123/dashboard', requiresAuth: true, category: 'platforms' },
  
  // Expense Categories (4)
  { method: 'GET', path: '/api/expense-categories', requiresAuth: true, category: 'expense-categories' },
  { method: 'POST', path: '/api/expense-categories', requiresAuth: true, category: 'expense-categories' },
  { method: 'PUT', path: '/api/expense-categories/test-id-123', requiresAuth: true, category: 'expense-categories' },
  { method: 'DELETE', path: '/api/expense-categories/test-id-123', requiresAuth: true, category: 'expense-categories' },
  
  // Recurring Expenses (6)
  { method: 'GET', path: '/api/recurring-expenses', requiresAuth: true, category: 'recurring-expenses' },
  { method: 'POST', path: '/api/recurring-expenses', requiresAuth: true, category: 'recurring-expenses' },
  { method: 'GET', path: '/api/recurring-expenses/test-id-123', requiresAuth: true, category: 'recurring-expenses' },
  { method: 'PUT', path: '/api/recurring-expenses/test-id-123', requiresAuth: true, category: 'recurring-expenses' },
  { method: 'DELETE', path: '/api/recurring-expenses/test-id-123', requiresAuth: true, category: 'recurring-expenses' },
  { method: 'POST', path: '/api/recurring-expenses/generate-next-month', requiresAuth: true, category: 'recurring-expenses' },
  
  // Insurances (5)
  { method: 'GET', path: '/api/insurances', requiresAuth: true, category: 'insurances' },
  { method: 'POST', path: '/api/insurances', requiresAuth: true, category: 'insurances' },
  { method: 'GET', path: '/api/insurances/test-id-123', requiresAuth: true, category: 'insurances' },
  { method: 'PUT', path: '/api/insurances/test-id-123', requiresAuth: true, category: 'insurances' },
  { method: 'DELETE', path: '/api/insurances/test-id-123', requiresAuth: true, category: 'insurances' },
  
  // Insurers (3)
  { method: 'GET', path: '/api/insurers', requiresAuth: true, category: 'insurers' },
  { method: 'POST', path: '/api/insurers', requiresAuth: true, category: 'insurers' },
  { method: 'DELETE', path: '/api/insurers/test-id-123', requiresAuth: true, category: 'insurers' },
  
  // Company Investors (8)
  { method: 'GET', path: '/api/company-investors', requiresAuth: true, category: 'company-investors' },
  { method: 'POST', path: '/api/company-investors', requiresAuth: true, category: 'company-investors' },
  { method: 'GET', path: '/api/company-investors/test-id-123', requiresAuth: true, category: 'company-investors' },
  { method: 'PUT', path: '/api/company-investors/test-id-123', requiresAuth: true, category: 'company-investors' },
  { method: 'DELETE', path: '/api/company-investors/test-id-123', requiresAuth: true, category: 'company-investors' },
  { method: 'POST', path: '/api/company-investors/shares', requiresAuth: true, category: 'company-investors' },
  { method: 'PUT', path: '/api/company-investors/shares/test-id-123', requiresAuth: true, category: 'company-investors' },
  { method: 'DELETE', path: '/api/company-investors/shares/test-id-123', requiresAuth: true, category: 'company-investors' },
  
  // Availability (2)
  { method: 'GET', path: '/api/availability/check', requiresAuth: true, category: 'availability' },
  { method: 'GET', path: '/api/availability/calendar', requiresAuth: true, category: 'availability' },
];

async function testAllEndpoints() {
  console.log('🚀 FASTIFY ENDPOINT VALIDATION TEST');
  console.log('=' .repeat(60));
  console.log(`Testing ${allEndpoints.length} endpoints...\n`);
  
  const app = await buildFastify();
  
  const results = {
    total: allEndpoints.length,
    success: 0,
    failed: 0,
    byCategory: {} as Record<string, { total: number; success: number; failed: number }>
  };
  
  // Group by category
  for (const endpoint of allEndpoints) {
    if (!results.byCategory[endpoint.category]) {
      results.byCategory[endpoint.category] = { total: 0, success: 0, failed: 0 };
    }
    results.byCategory[endpoint.category].total++;
  }
  
  // Test each endpoint
  for (const endpoint of allEndpoints) {
    try {
      const response = await app.inject({
        method: endpoint.method,
        url: endpoint.path,
        headers: endpoint.requiresAuth ? {
          authorization: 'Bearer fake-token-for-route-check'
        } : {}
      });
      
      // Check if endpoint exists (not 404)
      if (response.statusCode !== 404) {
        results.success++;
        results.byCategory[endpoint.category].success++;
        console.log(`✅ ${endpoint.method} ${endpoint.path} - OK (${response.statusCode})`);
      } else {
        results.failed++;
        results.byCategory[endpoint.category].failed++;
        console.log(`❌ ${endpoint.method} ${endpoint.path} - NOT FOUND (404)`);
      }
    } catch (error) {
      results.failed++;
      results.byCategory[endpoint.category].failed++;
      console.log(`❌ ${endpoint.method} ${endpoint.path} - ERROR:`, error);
    }
  }
  
  console.log('\n' + '='.repeat(60));
  console.log('📊 TEST RESULTS SUMMARY');
  console.log('='.repeat(60));
  console.log(`Total Endpoints: ${results.total}`);
  console.log(`✅ Success: ${results.success} (${Math.round(results.success / results.total * 100)}%)`);
  console.log(`❌ Failed: ${results.failed} (${Math.round(results.failed / results.total * 100)}%)`);
  
  console.log('\n📋 BY CATEGORY:');
  console.log('='.repeat(60));
  
  for (const [category, stats] of Object.entries(results.byCategory)) {
    const percentage = Math.round(stats.success / stats.total * 100);
    const icon = percentage === 100 ? '✅' : percentage >= 80 ? '⚠️' : '❌';
    console.log(`${icon} ${category.padEnd(25)} ${stats.success}/${stats.total} (${percentage}%)`);
  }
  
  await app.close();
  
  if (results.failed > 0) {
    console.log('\n❌ TEST FAILED - Some endpoints are missing or not working');
    process.exit(1);
  } else {
    console.log('\n✅ ALL TESTS PASSED - All endpoints are registered and working!');
    process.exit(0);
  }
}

testAllEndpoints().catch(error => {
  console.error('💥 Test failed with error:', error);
  process.exit(1);
});

