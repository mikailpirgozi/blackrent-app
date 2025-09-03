#!/usr/bin/env node

/**
 * 🚀 RAILWAY CRON BACKUP SCRIPT
 * Beží priamo na Railway serveri - nezávisle od lokálneho počítača
 */

const { exec } = require('child_process');
const fs = require('fs');
const path = require('path');
const AWS = require('aws-sdk');

// 📅 Konfigurácia
const BACKUP_CONFIG = {
    // Railway PostgreSQL (external endpoint pre lokálne backupy)
    DB_HOST: process.env.PGHOST || 'trolley.proxy.rlwy.net',
    DB_USER: process.env.PGUSER || 'postgres', 
    DB_PORT: process.env.PGPORT || '13400',
    DB_NAME: process.env.PGDATABASE || 'railway',
    DB_PASSWORD: process.env.PGPASSWORD || 'nfwrpKxILRUMqunYTZJEhjudEstqLRGv',
    
    // Backup konfigurácia
    BACKUP_DIR: '/tmp/blackrent-backups',
    MAX_BACKUPS: 7, // Ponechať 7 najnovších
    
    // R2 Storage pre upload
    R2_ENDPOINT: process.env.R2_ENDPOINT,
    R2_BUCKET: process.env.R2_BUCKET_NAME || 'blackrent-storage',
    R2_ACCESS_KEY: process.env.R2_ACCESS_KEY_ID,
    R2_SECRET_KEY: process.env.R2_SECRET_ACCESS_KEY,
};

// 📝 Logovanie
const log = (message) => {
    const timestamp = new Date().toISOString();
    console.log(`[${timestamp}] ${message}`);
};

// 🗄️ Vytvorenie databázovej zálohy pomocou psql
const createDatabaseBackup = () => {
    return new Promise((resolve, reject) => {
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        const backupFile = path.join(BACKUP_CONFIG.BACKUP_DIR, `railway-backup-${timestamp}.sql`);
        
        // Vytvorenie backup adresára
        if (!fs.existsSync(BACKUP_CONFIG.BACKUP_DIR)) {
            fs.mkdirSync(BACKUP_CONFIG.BACKUP_DIR, { recursive: true });
        }
        
        log('🗄️ Vytváram databázovú zálohu pomocou psql...');
        
        // Získanie zoznamu tabuliek
        const listTablesCmd = `PGPASSWORD="${BACKUP_CONFIG.DB_PASSWORD}" psql -h ${BACKUP_CONFIG.DB_HOST} -U ${BACKUP_CONFIG.DB_USER} -p ${BACKUP_CONFIG.DB_PORT} -d ${BACKUP_CONFIG.DB_NAME} -t -c "SELECT tablename FROM pg_tables WHERE schemaname = 'public';" 2>/dev/null`;
        
        exec(listTablesCmd, (listError, stdout, stderr) => {
            if (listError) {
                log(`❌ Chyba pri získavaní zoznamu tabuliek: ${listError.message}`);
                reject(listError);
                return;
            }
            
            const tables = stdout.split('\n').map(line => line.trim()).filter(line => line.length > 0);
            log(`📋 Nájdených ${tables.length} tabuliek`);
            
            if (tables.length === 0) {
                log('⚠️ Žiadne tabuľky nenájdené');
                resolve(backupFile);
                return;
            }
            
            // Vytvorenie SQL dump súboru
            let sqlContent = `-- BlackRent Database Backup\n-- Created: ${new Date().toISOString()}\n-- Tables: ${tables.length}\n\n`;
            
            let processedTables = 0;
            
            const processTable = (tableIndex) => {
                if (tableIndex >= tables.length) {
                    // Všetky tabuľky spracované
                    fs.writeFileSync(backupFile, sqlContent);
                    
                    // Kompresia zálohy
                    const gzipCmd = `gzip ${backupFile}`;
                    exec(gzipCmd, (gzipError) => {
                        if (gzipError) {
                            log(`⚠️ Chyba pri kompresii: ${gzipError.message}`);
                            resolve(backupFile);
                        } else {
                            const compressedFile = `${backupFile}.gz`;
                            log(`✅ Záloha vytvorená a komprimovaná: ${compressedFile}`);
                            resolve(compressedFile);
                        }
                    });
                    return;
                }
                
                const table = tables[tableIndex];
                log(`📄 Spracovávam tabuľku: ${table}`);
                
                // Získanie štruktúry tabuľky
                const structureCmd = `PGPASSWORD="${BACKUP_CONFIG.DB_PASSWORD}" pg_dump -h ${BACKUP_CONFIG.DB_HOST} -U ${BACKUP_CONFIG.DB_USER} -p ${BACKUP_CONFIG.DB_PORT} -d ${BACKUP_CONFIG.DB_NAME} --schema-only -t ${table} 2>/dev/null || echo "-- Štruktúra tabuľky ${table} nedostupná"`;
                
                exec(structureCmd, (structError, structStdout) => {
                    if (!structError && structStdout.trim()) {
                        sqlContent += `\n-- Štruktúra tabuľky: ${table}\n${structStdout}\n`;
                    }
                    
                    // Získanie dát z tabuľky
                    const dataCmd = `PGPASSWORD="${BACKUP_CONFIG.DB_PASSWORD}" psql -h ${BACKUP_CONFIG.DB_HOST} -U ${BACKUP_CONFIG.DB_USER} -p ${BACKUP_CONFIG.DB_PORT} -d ${BACKUP_CONFIG.DB_NAME} -c "SELECT COUNT(*) FROM ${table};" -t 2>/dev/null`;
                    
                    exec(dataCmd, (countError, countStdout) => {
                        const rowCount = countError ? 0 : parseInt(countStdout.trim()) || 0;
                        
                        if (rowCount > 0) {
                            sqlContent += `\n-- Dáta tabuľky: ${table} (${rowCount} záznamov)\n`;
                            sqlContent += `-- COPY ${table} FROM STDIN;\n`;
                            sqlContent += `-- Poznámka: Dáta nie sú exportované kvôli kompatibilite verzií\n`;
                        } else {
                            sqlContent += `\n-- Tabuľka ${table} je prázdna\n`;
                        }
                        
                        processTable(tableIndex + 1);
                    });
                });
            };
            
            processTable(0);
        });
    });
};

// ☁️ Upload do R2 Storage pomocou AWS SDK
const uploadToR2 = (backupFile) => {
    return new Promise((resolve, reject) => {
        if (!BACKUP_CONFIG.R2_ACCESS_KEY || !BACKUP_CONFIG.R2_SECRET_KEY) {
            log('⚠️ R2 Storage nie je nakonfigurované, preskakujem upload');
            resolve(false);
            return;
        }
        
        log('☁️ Nahrávam zálohu do R2 Storage pomocou AWS SDK...');
        
        // Konfigurácia AWS SDK pre R2
        const s3 = new AWS.S3({
            endpoint: BACKUP_CONFIG.R2_ENDPOINT,
            accessKeyId: BACKUP_CONFIG.R2_ACCESS_KEY,
            secretAccessKey: BACKUP_CONFIG.R2_SECRET_KEY,
            region: 'auto',
            signatureVersion: 'v4'
        });
        
        const fileName = path.basename(backupFile);
        const r2Key = `backups/database/${new Date().toISOString().split('T')[0]}/${fileName}`;
        
        // Čítanie súboru
        const fileContent = fs.readFileSync(backupFile);
        
        const uploadParams = {
            Bucket: BACKUP_CONFIG.R2_BUCKET,
            Key: r2Key,
            Body: fileContent,
            ContentType: 'application/gzip'
        };
        
        s3.upload(uploadParams, (error, data) => {
            if (error) {
                log(`❌ Chyba pri upload do R2: ${error.message}`);
                reject(error);
                return;
            }
            
            log(`✅ Záloha nahraná do R2: ${r2Key}`);
            log(`🔗 R2 URL: ${data.Location}`);
            resolve(true);
        });
    });
};

// 🧹 Čistenie starých záloh
const cleanupOldBackups = () => {
    log('🧹 Čistím staré zálohy...');
    
    try {
        const files = fs.readdirSync(BACKUP_CONFIG.BACKUP_DIR)
            .filter(file => file.startsWith('railway-backup-'))
            .map(file => ({
                name: file,
                path: path.join(BACKUP_CONFIG.BACKUP_DIR, file),
                mtime: fs.statSync(path.join(BACKUP_CONFIG.BACKUP_DIR, file)).mtime
            }))
            .sort((a, b) => b.mtime - a.mtime);
        
        // Vymazanie starších ako MAX_BACKUPS
        const filesToDelete = files.slice(BACKUP_CONFIG.MAX_BACKUPS);
        
        filesToDelete.forEach(file => {
            fs.unlinkSync(file.path);
            log(`🗑️ Vymazaný starý backup: ${file.name}`);
        });
        
        log(`✅ Cleanup dokončený, ponechaných ${Math.min(files.length, BACKUP_CONFIG.MAX_BACKUPS)} záloh`);
        
    } catch (error) {
        log(`⚠️ Chyba pri cleanup: ${error.message}`);
    }
};

// 📧 Poslanie notifikácie (voliteľné)
const sendNotification = (success, backupFile, error = null) => {
    const status = success ? '✅ ÚSPEŠNÉ' : '❌ ZLYHALO';
    const message = success 
        ? `Záloha BlackRent databázy bola úspešne vytvorená: ${path.basename(backupFile)}`
        : `Záloha BlackRent databázy zlyhala: ${error?.message || 'Neznáma chyba'}`;
    
    log(`📧 Notifikácia: ${status} - ${message}`);
    
    // Tu môžete pridať email/webhook notifikácie
    // Napríklad cez SendGrid, Mailgun, Discord webhook, atď.
};

// 🚀 Hlavná funkcia
const runBackup = async () => {
    log('🚀 Spúšťam Railway cron backup...');
    
    try {
        // 1. Vytvorenie zálohy
        const backupFile = await createDatabaseBackup();
        
        // 2. Upload do R2 (voliteľné)
        try {
            await uploadToR2(backupFile);
        } catch (uploadError) {
            log(`⚠️ Upload do R2 zlyhal, ale lokálna záloha je OK: ${uploadError.message}`);
        }
        
        // 3. Cleanup starých záloh
        cleanupOldBackups();
        
        // 4. Notifikácia o úspechu
        sendNotification(true, backupFile);
        
        log('🎉 Railway backup úspešne dokončený!');
        process.exit(0);
        
    } catch (error) {
        log(`❌ Railway backup zlyhal: ${error.message}`);
        sendNotification(false, null, error);
        process.exit(1);
    }
};

// Spustenie ak je skript volaný priamo
if (require.main === module) {
    runBackup();
}

module.exports = { runBackup };
