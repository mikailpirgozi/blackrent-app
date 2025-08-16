#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const FormData = require('form-data');
const fetch = require('node-fetch');

// Backend API endpoint (lokálny alebo Railway)
const BACKEND_URL = process.env.BACKEND_URL || 'https://blackrent-app-production.up.railway.app';
const API_ENDPOINT = `${BACKEND_URL}/api/files/upload`;

console.log('🚀 Migrating assets via Backend API...\n');

// Mapping lokálnych ciest na R2 cesty
const ASSET_MAPPING = {
  'public/figma-assets/': 'customer-website/ui/',
  'public/brands/': 'customer-website/brands/',
  'public/icons/': 'customer-website/icons/',
  'public/images/': 'customer-website/images/',
  'public/assets/': 'customer-website/assets/'
};

async function uploadFile(localPath, r2Key) {
  try {
    const fileContent = fs.readFileSync(localPath);
    const form = new FormData();
    
    form.append('file', fileContent, {
      filename: path.basename(localPath),
      contentType: getContentType(localPath)
    });
    form.append('key', r2Key);
    
    const response = await fetch(API_ENDPOINT, {
      method: 'POST',
      body: form,
      headers: {
        ...form.getHeaders()
      }
    });

    if (response.ok) {
      const result = await response.json();
      console.log(`✅ Uploaded: ${localPath} → ${result.url}`);
      return result.url;
    } else {
      const error = await response.text();
      console.error(`❌ Failed to upload ${localPath}: ${response.status} ${error}`);
      return null;
    }
  } catch (error) {
    console.error(`❌ Failed to upload ${localPath}:`, error.message);
    return null;
  }
}

function getContentType(filePath) {
  const ext = path.extname(filePath).toLowerCase();
  const contentTypes = {
    '.svg': 'image/svg+xml',
    '.png': 'image/png',
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.webp': 'image/webp',
    '.gif': 'image/gif',
    '.pdf': 'application/pdf'
  };
  return contentTypes[ext] || 'application/octet-stream';
}

async function migrateDirectory(localDir, r2Prefix) {
  if (!fs.existsSync(localDir)) {
    console.log(`⚠️  Directory not found: ${localDir}`);
    return {};
  }

  const urlMapping = {};
  const items = fs.readdirSync(localDir);

  for (const item of items) {
    const localPath = path.join(localDir, item);
    const stat = fs.statSync(localPath);

    if (stat.isFile()) {
      const r2Key = `${r2Prefix}${item}`;
      const publicUrl = await uploadFile(localPath, r2Key);
      
      if (publicUrl) {
        // Mapovanie pre nahradenie v kóde
        const oldPath = `/${localDir.replace('public/', '')}${item}`;
        urlMapping[oldPath] = publicUrl;
      }
      
      // Pauza medzi uploadmi
      await new Promise(resolve => setTimeout(resolve, 100));
    }
  }

  return urlMapping;
}

async function main() {
  console.log('🚀 Starting migration via Backend API...\n');

  // Test backend connection
  try {
    const healthResponse = await fetch(`${BACKEND_URL}/api/health`);
    if (!healthResponse.ok) {
      throw new Error(`Backend not available: ${healthResponse.status}`);
    }
    console.log('✅ Backend connection OK\n');
  } catch (error) {
    console.error('❌ Backend connection failed:', error.message);
    console.log('💡 Make sure backend is running on', BACKEND_URL);
    process.exit(1);
  }

  let allMappings = {};

  // Migrácia len malej vzorky najprv
  const testMapping = {
    'public/figma-assets/': 'customer-website/ui/'
  };

  for (const [localDir, r2Prefix] of Object.entries(testMapping)) {
    console.log(`📁 Migrating ${localDir} → ${r2Prefix}`);
    const mappings = await migrateDirectory(localDir, r2Prefix);
    allMappings = { ...allMappings, ...mappings };
  }

  // Uloženie mapping súboru
  const mappingFile = 'url-mappings.json';
  fs.writeFileSync(mappingFile, JSON.stringify(allMappings, null, 2));
  
  console.log(`\n✅ Migration completed!`);
  console.log(`📄 URL mappings saved to: ${mappingFile}`);
  console.log(`📊 Total files migrated: ${Object.keys(allMappings).length}`);
  
  // Ukážka mapovaní
  if (Object.keys(allMappings).length > 0) {
    console.log('\n📋 Sample mappings:');
    Object.entries(allMappings).slice(0, 5).forEach(([old, new_]) => {
      console.log(`   ${old} → ${new_}`);
    });
  }
}

main().catch(console.error);
