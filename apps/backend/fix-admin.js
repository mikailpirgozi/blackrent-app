const bcrypt = require('bcrypt');
const sqlite3 = require('sqlite3').verbose();

async function fixAdminPassword() {
  console.log('🔄 Opravujem admin heslo...');
  
  // Vygenrujem hash pre admin123
  const hashedPassword = bcrypt.hashSync('admin123', 12);
  console.log('🔑 Nový hash:', hashedPassword);
  
  // Otvorím databázu
  const db = new sqlite3.Database('./blackrent.db');
  
  // Aktualizujem heslo
  db.run(
    'UPDATE users SET password = ? WHERE username = ?',
    [hashedPassword, 'admin'],
    function(err) {
      if (err) {
        console.error('❌ Chyba pri aktualizácii:', err);
      } else {
        console.log('✅ Admin heslo úspešne aktualizované na: admin123');
        console.log('📝 Počet zmenených riadkov:', this.changes);
      }
      db.close();
    }
  );
}

fixAdminPassword(); 