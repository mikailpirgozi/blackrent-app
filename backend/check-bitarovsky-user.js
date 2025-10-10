// Quick script to check bitarovsky user in database
const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL
});

async function checkUser() {
  try {
    console.log('🔍 Checking bitarovsky user...\n');
    
    // Check user
    const userResult = await pool.query(`
      SELECT id, username, email, role, company_id, platform_id, is_active
      FROM users 
      WHERE username = 'bitarovsky'
    `);
    
    if (userResult.rows.length === 0) {
      console.log('❌ User bitarovsky not found!');
      return;
    }
    
    const user = userResult.rows[0];
    console.log('👤 User bitarovsky:');
    console.log('   ID:', user.id);
    console.log('   Email:', user.email);
    console.log('   Role:', user.role);
    console.log('   Company ID:', user.company_id || '(not set)');
    console.log('   Platform ID:', user.platform_id || '(not set)');
    console.log('   Is Active:', user.is_active);
    console.log('');
    
    // Check rental 696
    console.log('🔍 Checking rental 696...\n');
    const rentalResult = await pool.query(`
      SELECT r.id, r.customer_name, r.vehicle_id, v.license_plate, v.owner_company_id
      FROM rentals r
      LEFT JOIN vehicles v ON r.vehicle_id = v.id
      WHERE r.id = '696'
    `);
    
    if (rentalResult.rows.length === 0) {
      console.log('❌ Rental 696 not found!');
    } else {
      const rental = rentalResult.rows[0];
      console.log('📄 Rental 696:');
      console.log('   Customer:', rental.customer_name);
      console.log('   Vehicle ID:', rental.vehicle_id);
      console.log('   License Plate:', rental.license_plate || '(no vehicle)');
      console.log('   Vehicle Company ID:', rental.owner_company_id || '(not set)');
      console.log('');
      
      // Check if user has access
      const hasAccess = user.role === 'admin' || user.role === 'super_admin' || 
                       (user.role === 'company_admin' && user.company_id === rental.owner_company_id);
      
      console.log('🔐 Access check:');
      console.log('   User role:', user.role);
      console.log('   User company:', user.company_id || '(not set)');
      console.log('   Vehicle company:', rental.owner_company_id || '(not set)');
      console.log('   Has access:', hasAccess ? '✅ YES' : '❌ NO');
      console.log('');
      
      if (!hasAccess) {
        console.log('💡 SOLUTION OPTIONS:');
        console.log('   1) Change user role to "admin" or "super_admin"');
        console.log('   2) Set user company_id to match vehicle owner_company_id');
        console.log('   3) Set vehicle owner_company_id to match user company_id');
        console.log('');
        console.log('📝 SQL to fix (Option 1 - Make admin):');
        console.log(`   UPDATE users SET role = 'admin' WHERE username = 'bitarovsky';`);
        console.log('');
      }
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await pool.end();
  }
}

checkUser();

