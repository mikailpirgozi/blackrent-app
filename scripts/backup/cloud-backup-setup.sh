#!/bin/bash

# 🌐 BLACKRENT CLOUD BACKUP SETUP
# Nastavenie cloud-based backup systému nezávislého od lokálneho počítača
# Autor: BlackRent Team

set -e

# 🎨 Farby
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
NC='\033[0m'

echo -e "${PURPLE}🌐 BLACKRENT CLOUD BACKUP SETUP${NC}"
echo ""

# 📋 Možnosti cloud backup
show_cloud_options() {
    echo -e "${BLUE}🌐 MOŽNOSTI CLOUD BACKUP SYSTÉMU:${NC}"
    echo ""
    
    echo -e "${GREEN}1. 🚀 RAILWAY CRON JOB (Odporúčané)${NC}"
    echo -e "   ✅ Beží 24/7 nezávisle od vašeho počítača"
    echo -e "   ✅ Priamo na Railway serveri"
    echo -e "   ✅ Rýchle backup (lokálne na serveri)"
    echo -e "   ✅ Automatické nahranie do cloud storage"
    echo -e "   💰 Cena: Zadarmo (v rámci Railway)"
    echo ""
    
    echo -e "${GREEN}2. 🐙 GITHUB ACTIONS (Alternatíva)${NC}"
    echo -e "   ✅ Beží na GitHub serveroch"
    echo -e "   ✅ Verziovanie záloh v Git"
    echo -e "   ✅ Email notifikácie"
    echo -e "   ⚠️ Obmedzené na 2000 minút/mesiac (free)"
    echo ""
    
    echo -e "${GREEN}3. ☁️ CLOUDFLARE WORKERS (Pokročilé)${NC}"
    echo -e "   ✅ Serverless - beží automaticky"
    echo -e "   ✅ Integrácia s R2 Storage"
    echo -e "   ✅ Veľmi lacné"
    echo -e "   ⚠️ Vyžaduje programovanie"
    echo ""
    
    echo -e "${GREEN}4. 🖥️ VPS SERVER (Profesionálne)${NC}"
    echo -e "   ✅ Plná kontrola"
    echo -e "   ✅ Beží 24/7"
    echo -e "   ✅ Môže robiť aj iné úlohy"
    echo -e "   💰 Cena: 5-20€/mesiac"
    echo ""
}

# 🚀 Railway Cron Job setup
setup_railway_cron() {
    echo -e "${YELLOW}🚀 Nastavujem Railway Cron Job...${NC}"
    
    # Vytvorenie Railway backup skriptu
    local railway_script="scripts/backup/railway-cron-backup.js"
    
    cat > "$railway_script" << 'EOF'
#!/usr/bin/env node

/**
 * 🚀 RAILWAY CRON BACKUP SCRIPT
 * Beží priamo na Railway serveri - nezávisle od lokálneho počítača
 */

const { exec } = require('child_process');
const fs = require('fs');
const path = require('path');

// 📅 Konfigurácia
const BACKUP_CONFIG = {
    // Railway PostgreSQL
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

// 🗄️ Vytvorenie databázovej zálohy
const createDatabaseBackup = () => {
    return new Promise((resolve, reject) => {
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        const backupFile = path.join(BACKUP_CONFIG.BACKUP_DIR, `railway-backup-${timestamp}.sql`);
        
        // Vytvorenie backup adresára
        if (!fs.existsSync(BACKUP_CONFIG.BACKUP_DIR)) {
            fs.mkdirSync(BACKUP_CONFIG.BACKUP_DIR, { recursive: true });
        }
        
        const pgDumpCmd = `PGPASSWORD="${BACKUP_CONFIG.DB_PASSWORD}" pg_dump -h ${BACKUP_CONFIG.DB_HOST} -U ${BACKUP_CONFIG.DB_USER} -p ${BACKUP_CONFIG.DB_PORT} -d ${BACKUP_CONFIG.DB_NAME} --no-owner --no-privileges > ${backupFile}`;
        
        log('🗄️ Vytváram databázovú zálohu...');
        
        exec(pgDumpCmd, (error, stdout, stderr) => {
            if (error) {
                log(`❌ Chyba pri vytváraní zálohy: ${error.message}`);
                reject(error);
                return;
            }
            
            // Kompresia zálohy
            const gzipCmd = `gzip ${backupFile}`;
            exec(gzipCmd, (gzipError) => {
                if (gzipError) {
                    log(`⚠️ Chyba pri kompresii: ${gzipError.message}`);
                    resolve(backupFile); // Pokračuj aj bez kompresie
                } else {
                    const compressedFile = `${backupFile}.gz`;
                    log(`✅ Záloha vytvorená a komprimovaná: ${compressedFile}`);
                    resolve(compressedFile);
                }
            });
        });
    });
};

// ☁️ Upload do R2 Storage
const uploadToR2 = (backupFile) => {
    return new Promise((resolve, reject) => {
        if (!BACKUP_CONFIG.R2_ACCESS_KEY || !BACKUP_CONFIG.R2_SECRET_KEY) {
            log('⚠️ R2 Storage nie je nakonfigurované, preskakujem upload');
            resolve(false);
            return;
        }
        
        const fileName = path.basename(backupFile);
        const r2Key = `backups/database/${new Date().toISOString().split('T')[0]}/${fileName}`;
        
        // AWS CLI príkaz pre R2 upload
        const uploadCmd = `AWS_ACCESS_KEY_ID="${BACKUP_CONFIG.R2_ACCESS_KEY}" AWS_SECRET_ACCESS_KEY="${BACKUP_CONFIG.R2_SECRET_KEY}" aws s3 cp "${backupFile}" "s3://${BACKUP_CONFIG.R2_BUCKET}/${r2Key}" --endpoint-url="${BACKUP_CONFIG.R2_ENDPOINT}"`;
        
        log('☁️ Nahrávam zálohu do R2 Storage...');
        
        exec(uploadCmd, (error, stdout, stderr) => {
            if (error) {
                log(`❌ Chyba pri upload do R2: ${error.message}`);
                reject(error);
                return;
            }
            
            log(`✅ Záloha nahraná do R2: ${r2Key}`);
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
EOF
    
    chmod +x "$railway_script"
    
    echo -e "${GREEN}✅ Railway backup skript vytvorený${NC}"
    
    # Vytvorenie package.json pre Railway
    local package_json="scripts/backup/package.json"
    
    cat > "$package_json" << 'EOF'
{
  "name": "blackrent-railway-backup",
  "version": "1.0.0",
  "description": "BlackRent Railway Cron Backup System",
  "main": "railway-cron-backup.js",
  "scripts": {
    "backup": "node railway-cron-backup.js",
    "start": "node railway-cron-backup.js"
  },
  "dependencies": {
    "aws-sdk": "^2.1691.0"
  },
  "engines": {
    "node": ">=16.0.0"
  }
}
EOF
    
    echo -e "${GREEN}✅ Package.json vytvorený${NC}"
    
    # Inštrukcie pre Railway deployment
    echo ""
    echo -e "${BLUE}📋 INŠTRUKCIE PRE RAILWAY DEPLOYMENT:${NC}"
    echo ""
    echo -e "${YELLOW}1. Vytvorte nový Railway projekt:${NC}"
    echo -e "   railway login"
    echo -e "   railway init"
    echo -e "   railway link"
    echo ""
    echo -e "${YELLOW}2. Nastavte environment variables:${NC}"
    echo -e "   railway variables set PGHOST=trolley.proxy.rlwy.net"
    echo -e "   railway variables set PGUSER=postgres"
    echo -e "   railway variables set PGPORT=13400"
    echo -e "   railway variables set PGDATABASE=railway"
    echo -e "   railway variables set PGPASSWORD=nfwrpKxILRUMqunYTZJEhjudEstqLRGv"
    echo ""
    echo -e "${YELLOW}3. Nastavte cron job v Railway:${NC}"
    echo -e "   - Pridajte do railway.json:"
    echo -e '   {"build": {"builder": "nixpacks"}, "deploy": {"cronJobs": [{"command": "npm run backup", "schedule": "0 2 * * *"}]}}'
    echo ""
    echo -e "${YELLOW}4. Deploy:${NC}"
    echo -e "   railway up"
    echo ""
}

# 🐙 GitHub Actions setup
setup_github_actions() {
    echo -e "${YELLOW}🐙 Nastavujem GitHub Actions...${NC}"
    
    local workflow_dir=".github/workflows"
    local workflow_file="$workflow_dir/backup.yml"
    
    mkdir -p "$workflow_dir"
    
    cat > "$workflow_file" << 'EOF'
name: 🎯 BlackRent Daily Backup

on:
  schedule:
    # Každý deň o 2:00 UTC (3:00 CET)
    - cron: '0 2 * * *'
  workflow_dispatch: # Manuálne spustenie

jobs:
  backup:
    runs-on: ubuntu-latest
    name: 📦 Database Backup
    
    steps:
    - name: 📥 Checkout repository
      uses: actions/checkout@v4
      
    - name: 🐘 Install PostgreSQL client
      run: |
        sudo apt-get update
        sudo apt-get install -y postgresql-client
        
    - name: 🗄️ Create database backup
      env:
        PGPASSWORD: ${{ secrets.RAILWAY_DB_PASSWORD }}
      run: |
        # Vytvorenie zálohy
        TIMESTAMP=$(date +"%Y-%m-%d_%H-%M-%S")
        BACKUP_FILE="blackrent-backup-${TIMESTAMP}.sql"
        
        pg_dump -h trolley.proxy.rlwy.net -U postgres -p 13400 -d railway \
          --no-owner --no-privileges > "$BACKUP_FILE"
        
        # Kompresia
        gzip "$BACKUP_FILE"
        
        echo "BACKUP_FILE=${BACKUP_FILE}.gz" >> $GITHUB_ENV
        
    - name: 📊 Backup statistics
      run: |
        echo "📊 Backup Statistics:"
        echo "File: $BACKUP_FILE"
        echo "Size: $(du -h "$BACKUP_FILE" | cut -f1)"
        echo "Date: $(date)"
        
    - name: ☁️ Upload to R2 Storage
      env:
        AWS_ACCESS_KEY_ID: ${{ secrets.R2_ACCESS_KEY_ID }}
        AWS_SECRET_ACCESS_KEY: ${{ secrets.R2_SECRET_ACCESS_KEY }}
        AWS_DEFAULT_REGION: auto
      run: |
        # Install AWS CLI
        pip install awscli
        
        # Upload to R2
        DATE_DIR=$(date +"%Y-%m-%d")
        aws s3 cp "$BACKUP_FILE" \
          "s3://blackrent-storage/backups/database/${DATE_DIR}/$BACKUP_FILE" \
          --endpoint-url="https://9ccdca0d876e24bd9acefabe56f94f53.r2.cloudflarestorage.com"
        
    - name: 📧 Send notification
      if: always()
      uses: 8398a7/action-slack@v3
      with:
        status: ${{ job.status }}
        text: |
          BlackRent Backup Status: ${{ job.status }}
          File: ${{ env.BACKUP_FILE }}
          Time: ${{ steps.date.outputs.date }}
      env:
        SLACK_WEBHOOK_URL: ${{ secrets.SLACK_WEBHOOK_URL }} # Voliteľné
EOF
    
    echo -e "${GREEN}✅ GitHub Actions workflow vytvorený${NC}"
    
    echo ""
    echo -e "${BLUE}📋 INŠTRUKCIE PRE GITHUB ACTIONS:${NC}"
    echo ""
    echo -e "${YELLOW}1. Pridajte secrets do GitHub repository:${NC}"
    echo -e "   - RAILWAY_DB_PASSWORD"
    echo -e "   - R2_ACCESS_KEY_ID" 
    echo -e "   - R2_SECRET_ACCESS_KEY"
    echo -e "   - SLACK_WEBHOOK_URL (voliteľné)"
    echo ""
    echo -e "${YELLOW}2. Commit a push workflow:${NC}"
    echo -e "   git add .github/workflows/backup.yml"
    echo -e "   git commit -m 'Add automated backup workflow'"
    echo -e "   git push"
    echo ""
}

# 🖥️ VPS Server setup
setup_vps_backup() {
    echo -e "${YELLOW}🖥️ VPS Server Backup Setup...${NC}"
    
    echo -e "${BLUE}💡 ODPORÚČANÉ VPS PROVIDERY:${NC}"
    echo ""
    echo -e "${GREEN}1. 🚀 Hetzner Cloud${NC}"
    echo -e "   💰 Cena: 4.15€/mesiac (CX11)"
    echo -e "   📍 Lokácia: Nemecko (blízko)"
    echo -e "   ⚡ Výkon: 1 vCPU, 2GB RAM, 20GB SSD"
    echo ""
    echo -e "${GREEN}2. 🌊 DigitalOcean${NC}"
    echo -e "   💰 Cena: 6$/mesiac (Basic Droplet)"
    echo -e "   📍 Lokácia: Frankfurt"
    echo -e "   ⚡ Výkon: 1 vCPU, 1GB RAM, 25GB SSD"
    echo ""
    echo -e "${GREEN}3. 🔥 Vultr${NC}"
    echo -e "   💰 Cena: 6$/mesiac (Regular Performance)"
    echo -e "   📍 Lokácia: Frankfurt"
    echo -e "   ⚡ Výkon: 1 vCPU, 1GB RAM, 25GB SSD"
    echo ""
    
    # Vytvorenie VPS setup skriptu
    local vps_script="scripts/backup/vps-setup.sh"
    
    cat > "$vps_script" << 'EOF'
#!/bin/bash

# 🖥️ VPS BACKUP SERVER SETUP
# Skript na nastavenie backup servera na VPS

echo "🖥️ Nastavujem VPS backup server..."

# Update systému
apt update && apt upgrade -y

# Inštalácia potrebných balíčkov
apt install -y postgresql-client awscli cron git nodejs npm

# Vytvorenie backup používateľa
useradd -m -s /bin/bash blackrent-backup
usermod -aG sudo blackrent-backup

# Vytvorenie backup adresára
mkdir -p /opt/blackrent-backup
chown blackrent-backup:blackrent-backup /opt/blackrent-backup

# Kopírovanie backup skriptov
cp -r scripts/backup/* /opt/blackrent-backup/
chown -R blackrent-backup:blackrent-backup /opt/blackrent-backup

# Nastavenie cron job
echo "0 2 * * * /opt/blackrent-backup/daily-backup-master.sh" | crontab -u blackrent-backup -

echo "✅ VPS backup server je nastavený!"
echo "📧 Nezabudnite nastaviť environment variables"
EOF
    
    chmod +x "$vps_script"
    
    echo -e "${GREEN}✅ VPS setup skript vytvorený${NC}"
}

# 🚀 Hlavná funkcia
main() {
    show_cloud_options
    
    echo -e "${YELLOW}❓ Ktoré riešenie chcete nastaviť?${NC}"
    echo -e "${BLUE}1) Railway Cron Job (Odporúčané)${NC}"
    echo -e "${BLUE}2) GitHub Actions${NC}"
    echo -e "${BLUE}3) VPS Server${NC}"
    echo -e "${BLUE}4) Všetky možnosti${NC}"
    echo -e "${BLUE}5) Ukončiť${NC}"
    
    read -p "Vyberte možnosť (1-5): " choice
    
    case $choice in
        1)
            setup_railway_cron
            ;;
        2)
            setup_github_actions
            ;;
        3)
            setup_vps_backup
            ;;
        4)
            setup_railway_cron
            echo ""
            setup_github_actions
            echo ""
            setup_vps_backup
            ;;
        5)
            echo -e "${YELLOW}❌ Ukončené${NC}"
            exit 0
            ;;
        *)
            echo -e "${RED}❌ Neplatná voľba${NC}"
            exit 1
            ;;
    esac
    
    echo ""
    echo -e "${GREEN}🎉 Cloud backup setup dokončený!${NC}"
    echo -e "${BLUE}💡 Odporúčam Railway Cron Job - najjednoduchšie a najspoľahlivejšie${NC}"
}

# Spustenie
main "$@"
