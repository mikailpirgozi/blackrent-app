/**
 * SEED AUTH SYSTEM
 * Creates initial users for the new auth system:
 * - Super Admin (you)
 * - BlackRent Admin
 * - Impresario Admin + 2 employees
 */

import * as bcrypt from 'bcryptjs';
import { v4 as uuidv4 } from 'uuid';
import { postgresDatabase } from '../src/models/postgres-database';
import type { CompanyPermissions } from '../src/types';

async function seedAuthSystem() {
  console.log('🌱 Starting auth system seed...\n');

  try {
    // ===================================================================
    // 1. CREATE SUPER ADMIN (You)
    // ===================================================================
    console.log('👑 Creating Super Admin...');
    const superAdminPassword = await bcrypt.hash('SuperAdmin123!', 12);
    const superAdminId = uuidv4();
    
    await postgresDatabase.query(`
      INSERT INTO users (id, username, email, password_hash, role, first_name, last_name, is_active)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      ON CONFLICT (username) DO UPDATE SET
        password_hash = $4,
        role = $5,
        is_active = $8
    `, [superAdminId, 'superadmin', 'admin@blackrent.sk', superAdminPassword, 'super_admin', 'Super', 'Admin', true]);

    console.log('✅ Super Admin created');
    console.log('   Username: superadmin');
    console.log('   Password: SuperAdmin123!');
    console.log('   Role: super_admin\n');

    // ===================================================================
    // 2. FIND COMPANIES
    // ===================================================================
    console.log('🔍 Looking for companies...');
    
    const blackrentResult = await postgresDatabase.query(`
      SELECT id, name FROM companies WHERE name ILIKE '%blackrent%' LIMIT 1
    `);
    
    const impresarioResult = await postgresDatabase.query(`
      SELECT id, name FROM companies WHERE name ILIKE '%impresario%' LIMIT 1
    `);

    let blackrentCompanyId = blackrentResult.rows[0]?.id;
    let impresarioCompanyId = impresarioResult.rows[0]?.id;

    // Create BlackRent company if doesn't exist
    if (!blackrentCompanyId) {
      console.log('🆕 Creating BlackRent company...');
      const newBlackrent = await postgresDatabase.createCompany({
        name: 'BlackRent',
        isActive: true,
        commissionRate: 20
      });
      blackrentCompanyId = newBlackrent.id;
      console.log('✅ BlackRent company created');
    } else {
      console.log(`✅ BlackRent company found: ${blackrentResult.rows[0].name}`);
    }

    // Create Impresario company if doesn't exist
    if (!impresarioCompanyId) {
      console.log('🆕 Creating Impresario company...');
      const newImpresario = await postgresDatabase.createCompany({
        name: 'Impresario',
        isActive: true,
        commissionRate: 15
      });
      impresarioCompanyId = newImpresario.id;
      console.log('✅ Impresario company created');
    } else {
      console.log(`✅ Impresario company found: ${impresarioResult.rows[0].name}\n`);
    }

    // ===================================================================
    // 3. CREATE BLACKRENT ADMIN
    // ===================================================================
    console.log('🏢 Creating BlackRent Admin...');
    const blackrentAdminPassword = await bcrypt.hash('BlackRent123!', 12);
    const blackrentAdminId = uuidv4();
    
    await postgresDatabase.query(`
      INSERT INTO users (id, username, email, password_hash, role, company_id, first_name, last_name, is_active)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      ON CONFLICT (username) DO UPDATE SET
        password_hash = $4,
        role = $5,
        company_id = $6,
        is_active = $9
    `, [
      blackrentAdminId, 
      'blackrent_admin', 
      'admin@blackrent.company', 
      blackrentAdminPassword, 
      'company_admin', 
      blackrentCompanyId,
      'BlackRent',
      'Admin',
      true
    ]);

    console.log('✅ BlackRent Admin created');
    console.log('   Username: blackrent_admin');
    console.log('   Password: BlackRent123!');
    console.log('   Role: company_admin');
    console.log(`   Company: BlackRent (${blackrentCompanyId})\n`);

    // ===================================================================
    // 4. CREATE IMPRESARIO ADMIN
    // ===================================================================
    console.log('🎭 Creating Impresario Admin...');
    const impresarioAdminPassword = await bcrypt.hash('Impresario123!', 12);
    const impresarioAdminId = uuidv4();
    
    await postgresDatabase.query(`
      INSERT INTO users (id, username, email, password_hash, role, company_id, first_name, last_name, is_active)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      ON CONFLICT (username) DO UPDATE SET
        password_hash = $4,
        role = $5,
        company_id = $6,
        is_active = $9
    `, [
      impresarioAdminId,
      'impresario_admin',
      'admin@impresario.company',
      impresarioAdminPassword,
      'company_admin',
      impresarioCompanyId,
      'Impresario',
      'Admin',
      true
    ]);

    console.log('✅ Impresario Admin created');
    console.log('   Username: impresario_admin');
    console.log('   Password: Impresario123!');
    console.log('   Role: company_admin');
    console.log(`   Company: Impresario (${impresarioCompanyId})\n`);

    // ===================================================================
    // 5. CREATE IMPRESARIO EMPLOYEES (2)
    // ===================================================================
    console.log('👥 Creating Impresario Employees...');

    const employeePermissions: CompanyPermissions = {
      vehicles: { read: true, write: true, delete: false },
      rentals: { read: true, write: true, delete: false },
      expenses: { read: true, write: true, delete: false },
      settlements: { read: true, write: false, delete: false },
      customers: { read: true, write: true, delete: false },
      insurances: { read: true, write: false, delete: false },
      maintenance: { read: true, write: true, delete: false },
      protocols: { read: true, write: true, delete: false },
      statistics: { read: true, write: false, delete: false }
    };

    for (let i = 1; i <= 2; i++) {
      const employeePassword = await bcrypt.hash(`Impresario${i}23!`, 12);
      const employeeId = uuidv4();
      
      await postgresDatabase.query(`
        INSERT INTO users (id, username, email, password_hash, role, company_id, first_name, last_name, is_active, employee_number)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
        ON CONFLICT (username) DO UPDATE SET
          password_hash = $4,
          role = $5,
          company_id = $6,
          is_active = $9
        RETURNING id
      `, [
        employeeId,
        `impresario_emp${i}`,
        `employee${i}@impresario.company`,
        employeePassword,
        'employee',
        impresarioCompanyId,
        `Employee`,
        `${i}`,
        true,
        `EMP-${i.toString().padStart(3, '0')}`
      ]);

      // Set permissions for employee
      await postgresDatabase.setUserPermission(
        employeeId,
        impresarioCompanyId,
        employeePermissions,
        impresarioAdminId
      );

      console.log(`✅ Impresario Employee ${i} created`);
      console.log(`   Username: impresario_emp${i}`);
      console.log(`   Password: Impresario${i}23!`);
      console.log(`   Role: employee`);
      console.log(`   Company: Impresario`);
      console.log(`   Permissions: Standard employee permissions\n`);
    }

    // ===================================================================
    // 6. UPDATE EXISTING ADMIN USER TO SUPER_ADMIN
    // ===================================================================
    console.log('🔄 Updating existing admin users...');
    await postgresDatabase.query(`
      UPDATE users 
      SET role = 'super_admin' 
      WHERE role = 'admin' AND username != 'superadmin'
    `);
    console.log('✅ Existing admin users updated to super_admin\n');

    // ===================================================================
    // 7. SUMMARY
    // ===================================================================
    console.log('========================================');
    console.log('🎉 SEED COMPLETED SUCCESSFULLY!');
    console.log('========================================\n');
    
    console.log('📋 CREATED ACCOUNTS:');
    console.log('');
    console.log('1. SUPER ADMIN (You)');
    console.log('   URL: https://your-app.com/login');
    console.log('   Username: superadmin');
    console.log('   Password: SuperAdmin123!');
    console.log('   Access: ALL companies, ALL data');
    console.log('');
    console.log('2. BLACKRENT ADMIN');
    console.log('   URL: https://your-app.com/login');
    console.log('   Username: blackrent_admin');
    console.log('   Password: BlackRent123!');
    console.log('   Access: BlackRent company only');
    console.log('');
    console.log('3. IMPRESARIO ADMIN');
    console.log('   URL: https://your-app.com/login');
    console.log('   Username: impresario_admin');
    console.log('   Password: Impresario123!');
    console.log('   Access: Impresario company only');
    console.log('');
    console.log('4. IMPRESARIO EMPLOYEE 1');
    console.log('   URL: https://your-app.com/login');
    console.log('   Username: impresario_emp1');
    console.log('   Password: Impresario123!');
    console.log('   Access: Impresario company (custom permissions)');
    console.log('');
    console.log('5. IMPRESARIO EMPLOYEE 2');
    console.log('   URL: https://your-app.com/login');
    console.log('   Username: impresario_emp2');
    console.log('   Password: Impresario223!');
    console.log('   Access: Impresario company (custom permissions)');
    console.log('');
    console.log('========================================');
    console.log('⚠️  IMPORTANT: Change these passwords after first login!');
    console.log('========================================\n');

    process.exit(0);
  } catch (error) {
    console.error('❌ Error during seed:', error);
    process.exit(1);
  }
}

// Run seed
seedAuthSystem();

