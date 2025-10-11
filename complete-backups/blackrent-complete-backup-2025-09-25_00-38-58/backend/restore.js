const fs = require('fs');
const path = require('path');
const readline = require('readline');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

async function listBackups() {
  const backupDir = path.join(__dirname, 'backups');
  
  if (!fs.existsSync(backupDir)) {
    console.log('❌ Priečinok backups neexistuje');
    return [];
  }
  
  const backups = fs.readdirSync(backupDir)
    .filter(file => file.endsWith('.db'))
    .map(file => {
      const filePath = path.join(backupDir, file);
      const stats = fs.statSync(filePath);
      return {
        name: file,
        path: filePath,
        size: stats.size,
        created: stats.mtime
      };
    })
    .sort((a, b) => b.created - a.created);
  
  return backups;
}

async function restoreBackup(backupPath) {
  const dbPath = path.join(__dirname, 'blackrent.db');
  
  try {
    // Vytvorenie zálohy aktuálnej databázy
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const currentBackupPath = path.join(__dirname, 'backups', `blackrent-before-restore-${timestamp}.db`);
    
    if (fs.existsSync(dbPath)) {
      fs.copyFileSync(dbPath, currentBackupPath);
      console.log(`✅ Aktuálna databáza zálohovaná do: ${currentBackupPath}`);
    }
    
    // Obnovenie zo zálohy
    fs.copyFileSync(backupPath, dbPath);
    console.log(`✅ Databáza obnovená zo zálohy: ${backupPath}`);
    
  } catch (error) {
    console.error('❌ Chyba pri obnovovaní:', error);
  }
}

async function main() {
  console.log('🔄 Blackrent - Obnovenie databázy zo zálohy');
  console.log('============================================');
  
  const backups = await listBackups();
  
  if (backups.length === 0) {
    console.log('❌ Žiadne zálohy sa nenašli');
    rl.close();
    return;
  }
  
  console.log('📋 Dostupné zálohy:');
  backups.forEach((backup, index) => {
    console.log(`${index + 1}. ${backup.name}`);
    console.log(`   Veľkosť: ${(backup.size / 1024).toFixed(2)} KB`);
    console.log(`   Vytvorené: ${backup.created.toLocaleString()}`);
    console.log('');
  });
  
  rl.question('Vyberte zálohu na obnovenie (číslo): ', async (answer) => {
    const choice = parseInt(answer) - 1;
    
    if (choice >= 0 && choice < backups.length) {
      const selectedBackup = backups[choice];
      console.log(`Obnovujeme zo zálohy: ${selectedBackup.name}`);
      
      rl.question('Ste si istí? (y/N): ', async (confirm) => {
        if (confirm.toLowerCase() === 'y') {
          await restoreBackup(selectedBackup.path);
          console.log('✅ Obnovenie dokončené');
        } else {
          console.log('❌ Obnovenie zrušené');
        }
        rl.close();
      });
    } else {
      console.log('❌ Neplatná voľba');
      rl.close();
    }
  });
}

if (require.main === module) {
  main();
} 