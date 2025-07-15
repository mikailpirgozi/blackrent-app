const fs = require('fs');
const path = require('path');

function createBackup() {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const backupDir = path.join(__dirname, 'backups');
  
  // Vytvorenie priečinka backups ak neexistuje
  if (!fs.existsSync(backupDir)) {
    fs.mkdirSync(backupDir);
  }
  
  const dbPath = path.join(__dirname, 'blackrent.db');
  const backupPath = path.join(backupDir, `blackrent-backup-${timestamp}.db`);
  
  if (fs.existsSync(dbPath)) {
    fs.copyFileSync(dbPath, backupPath);
    console.log(`✅ Záloha vytvorená: ${backupPath}`);
  } else {
    console.log('❌ Databáza neexistuje');
  }
}

// Spustenie ako script
if (require.main === module) {
  createBackup();
}

module.exports = { createBackup }; 