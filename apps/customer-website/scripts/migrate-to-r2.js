#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { S3Client, PutObjectCommand } = require('@aws-sdk/client-s3');

// R2 Configuration (z vašich environment variables)
const R2_CONFIG = {
  endpoint: 'https://9ccdca0d876e24bd9acefabe56f94f53.r2.cloudflarestorage.com',
  credentials: {
    accessKeyId: '88ac7976656f3c2a9bbff57018c22731',
    secretAccessKey: '2b8979c2d23dcefb0d02d8af6d4968ce85c54f3ac11c1c0dabdfd69336b25d1a'
  },
  region: 'auto'
};

const BUCKET_NAME = 'blackrent-storage';
const PUBLIC_URL = 'https://pub-4fec120a8a6a4a0cbadfa55f54b7e8a2.r2.dev';

const s3Client = new S3Client(R2_CONFIG);

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
    const contentType = getContentType(localPath);
    
    const command = new PutObjectCommand({
      Bucket: BUCKET_NAME,
      Key: r2Key,
      Body: fileContent,
      ContentType: contentType,
      CacheControl: 'public, max-age=31536000' // 1 rok cache
    });

    await s3Client.send(command);
    console.log(`✅ Uploaded: ${localPath} → ${r2Key}`);
    return `${PUBLIC_URL}/${r2Key}`;
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
    }
  }

  return urlMapping;
}

async function main() {
  console.log('🚀 Starting migration to Cloudflare R2...\n');

  let allMappings = {};

  // Migrácia všetkých priečinkov
  for (const [localDir, r2Prefix] of Object.entries(ASSET_MAPPING)) {
    console.log(`📁 Migrating ${localDir} → ${r2Prefix}`);
    const mappings = await migrateDirectory(localDir, r2Prefix);
    allMappings = { ...allMappings, ...mappings };
  }

  // Uloženie mapping súboru pre nahradenie v kóde
  const mappingFile = 'customer-website/url-mappings.json';
  fs.writeFileSync(mappingFile, JSON.stringify(allMappings, null, 2));
  
  console.log(`\n✅ Migration completed!`);
  console.log(`📄 URL mappings saved to: ${mappingFile}`);
  console.log(`📊 Total files migrated: ${Object.keys(allMappings).length}`);
  
  // Ukážka mapovaní
  console.log('\n📋 Sample mappings:');
  Object.entries(allMappings).slice(0, 5).forEach(([old, new_]) => {
    console.log(`   ${old} → ${new_}`);
  });
  
  if (Object.keys(allMappings).length > 5) {
    console.log(`   ... and ${Object.keys(allMappings).length - 5} more`);
  }
}

main().catch(console.error);
