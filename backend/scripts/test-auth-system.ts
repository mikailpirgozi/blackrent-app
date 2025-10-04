/**
 * TEST AUTH SYSTEM
 * Comprehensive test suite for the new auth system
 */

import { postgresDatabase } from '../src/models/postgres-database';

interface TestResult {
  name: string;
  passed: boolean;
  message: string;
  details?: unknown;
}

const results: TestResult[] = [];

async function testAuthSystem() {
  console.log('🧪 Starting Auth System Tests...\n');

  try {
    // ===================================================================
    // TEST 1: Database Schema
    // ===================================================================
    console.log('📋 Test 1: Checking database schema...');
    
    const schemaCheck = await postgresDatabase.query(`
      SELECT 
        (SELECT COUNT(*) FROM information_schema.tables WHERE table_name = 'users') as users_table,
        (SELECT COUNT(*) FROM information_schema.tables WHERE table_name = 'user_company_access') as access_table,
        (SELECT COUNT(*) FROM information_schema.tables WHERE table_name = 'permission_templates') as templates_table,
        (SELECT COUNT(*) FROM information_schema.tables WHERE table_name = 'permission_audit_log') as audit_table
    `);

    const schema = schemaCheck.rows[0];
    const allTablesExist = schema.users_table > 0 && schema.access_table > 0 && 
                          schema.templates_table > 0 && schema.audit_table > 0;

    results.push({
      name: 'Database Schema',
      passed: allTablesExist,
      message: allTablesExist ? 'All required tables exist' : 'Some tables are missing',
      details: schema
    });

    // ===================================================================
    // TEST 2: Super Admin Exists
    // ===================================================================
    console.log('👑 Test 2: Checking super admin...');
    
    const superAdminResult = await postgresDatabase.query(`
      SELECT COUNT(*) as count FROM users WHERE role = 'super_admin'
    `);

    const superAdminExists = parseInt(superAdminResult.rows[0].count) > 0;

    results.push({
      name: 'Super Admin Exists',
      passed: superAdminExists,
      message: superAdminExists ? `Found ${superAdminResult.rows[0].count} super admin(s)` : 'No super admin found',
      details: { count: superAdminResult.rows[0].count }
    });

    // ===================================================================
    // TEST 3: Company Admins Exist
    // ===================================================================
    console.log('🏢 Test 3: Checking company admins...');
    
    const companyAdminsResult = await postgresDatabase.query(`
      SELECT username, company_id FROM users WHERE role = 'company_admin'
    `);

    const companyAdminsExist = companyAdminsResult.rows.length > 0;

    results.push({
      name: 'Company Admins Exist',
      passed: companyAdminsExist,
      message: companyAdminsExist ? `Found ${companyAdminsResult.rows.length} company admin(s)` : 'No company admins found',
      details: companyAdminsResult.rows
    });

    // ===================================================================
    // TEST 4: Employees with Permissions
    // ===================================================================
    console.log('👥 Test 4: Checking employees with permissions...');
    
    const employeesResult = await postgresDatabase.query(`
      SELECT u.username, u.role, COUNT(uca.id) as permission_count
      FROM users u
      LEFT JOIN user_company_access uca ON u.id = uca.user_id
      WHERE u.role = 'employee'
      GROUP BY u.id, u.username, u.role
    `);

    const employeesHavePermissions = employeesResult.rows.every(emp => 
      parseInt(emp.permission_count) > 0
    );

    results.push({
      name: 'Employees with Permissions',
      passed: employeesHavePermissions,
      message: employeesHavePermissions ? 'All employees have permissions' : 'Some employees missing permissions',
      details: employeesResult.rows
    });

    // ===================================================================
    // TEST 5: Permission Templates
    // ===================================================================
    console.log('📝 Test 5: Checking permission templates...');
    
    const templatesResult = await postgresDatabase.query(`
      SELECT name, role FROM permission_templates ORDER BY name
    `);

    const hasTemplates = templatesResult.rows.length >= 3;

    results.push({
      name: 'Permission Templates',
      passed: hasTemplates,
      message: hasTemplates ? `Found ${templatesResult.rows.length} templates` : 'Missing templates',
      details: templatesResult.rows
    });

    // ===================================================================
    // TEST 6: User Company Access Links
    // ===================================================================
    console.log('🔗 Test 6: Checking user-company access links...');
    
    const accessLinksResult = await postgresDatabase.query(`
      SELECT 
        u.username,
        u.role,
        c.name as company_name,
        uca.permissions->'vehicles'->>'read' as can_read_vehicles
      FROM user_company_access uca
      JOIN users u ON uca.user_id = u.id
      JOIN companies c ON uca.company_id = c.id
      ORDER BY u.username
    `);

    const hasAccessLinks = accessLinksResult.rows.length > 0;

    results.push({
      name: 'User Company Access Links',
      passed: hasAccessLinks,
      message: hasAccessLinks ? `Found ${accessLinksResult.rows.length} access link(s)` : 'No access links found',
      details: accessLinksResult.rows
    });

    // ===================================================================
    // TEST 7: Role Distribution
    // ===================================================================
    console.log('📊 Test 7: Checking role distribution...');
    
    const roleDistResult = await postgresDatabase.query(`
      SELECT role, COUNT(*) as count
      FROM users
      WHERE is_active = true
      GROUP BY role
      ORDER BY role
    `);

    const hasAllRoles = roleDistResult.rows.length >= 2; // At least super_admin and one other role

    results.push({
      name: 'Role Distribution',
      passed: hasAllRoles,
      message: hasAllRoles ? 'Good role distribution' : 'Limited role variety',
      details: roleDistResult.rows
    });

    // ===================================================================
    // TEST 8: Company Assignment
    // ===================================================================
    console.log('🏢 Test 8: Checking company assignments...');
    
    const companyAssignResult = await postgresDatabase.query(`
      SELECT 
        u.role,
        COUNT(*) FILTER (WHERE u.company_id IS NOT NULL) as with_company,
        COUNT(*) FILTER (WHERE u.company_id IS NULL) as without_company
      FROM users u
      WHERE u.role IN ('company_admin', 'company_owner', 'employee')
      GROUP BY u.role
    `);

    const properAssignment = companyAssignResult.rows.every(row => 
      parseInt(row.with_company) > 0
    );

    results.push({
      name: 'Company Assignment',
      passed: properAssignment,
      message: properAssignment ? 'All company-roles have company assigned' : 'Some users missing company',
      details: companyAssignResult.rows
    });

    // ===================================================================
    // PRINT RESULTS
    // ===================================================================
    console.log('\n========================================');
    console.log('🧪 TEST RESULTS');
    console.log('========================================\n');

    let passedCount = 0;
    let failedCount = 0;

    results.forEach((result, index) => {
      const icon = result.passed ? '✅' : '❌';
      console.log(`${icon} Test ${index + 1}: ${result.name}`);
      console.log(`   ${result.message}`);
      if (!result.passed && result.details) {
        console.log(`   Details:`, result.details);
      }
      console.log('');

      if (result.passed) passedCount++;
      else failedCount++;
    });

    console.log('========================================');
    console.log(`✅ Passed: ${passedCount}/${results.length}`);
    console.log(`❌ Failed: ${failedCount}/${results.length}`);
    console.log('========================================\n');

    if (failedCount === 0) {
      console.log('🎉 All tests passed! Auth system is ready to use.');
      process.exit(0);
    } else {
      console.log('⚠️  Some tests failed. Please review and fix issues.');
      process.exit(1);
    }

  } catch (error) {
    console.error('❌ Test error:', error);
    process.exit(1);
  }
}

// Run tests
testAuthSystem();

