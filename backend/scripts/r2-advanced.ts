#!/usr/bin/env ts-node

/**
 * Advanced R2 CLI Operations
 * Uses AWS SDK for complex operations not supported by Wrangler
 */

import { S3Client, ListObjectsV2Command, DeleteObjectCommand, GetObjectCommand, HeadObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import * as fs from 'fs';
import * as path from 'path';
import { format } from 'date-fns';

// Configuration from environment
const config = {
  endpoint: process.env.R2_ENDPOINT || '',
  accessKeyId: process.env.R2_ACCESS_KEY_ID || '',
  secretAccessKey: process.env.R2_SECRET_ACCESS_KEY || '',
  bucket: process.env.R2_BUCKET_NAME || 'blackrent',
  accountId: process.env.R2_ACCOUNT_ID || '',
};

// Initialize S3 Client for R2
const r2Client = new S3Client({
  region: 'auto',
  endpoint: config.endpoint,
  credentials: {
    accessKeyId: config.accessKeyId,
    secretAccessKey: config.secretAccessKey,
  },
});

// Helper functions
const formatBytes = (bytes: number): string => {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
};

const formatDate = (date: Date): string => {
  return format(date, 'yyyy-MM-dd HH:mm:ss');
};

// Commands
async function listAll(prefix?: string): Promise<void> {
  console.log('🔍 Listing all objects...');
  if (prefix) console.log(`   Prefix: ${prefix}`);

  let continuationToken: string | undefined;
  let totalObjects = 0;
  let totalSize = 0;

  do {
    const command = new ListObjectsV2Command({
      Bucket: config.bucket,
      Prefix: prefix,
      ContinuationToken: continuationToken,
      MaxKeys: 1000,
    });

    const response = await r2Client.send(command);
    
    if (response.Contents) {
      for (const object of response.Contents) {
        totalObjects++;
        totalSize += object.Size || 0;
        console.log(`  ${object.Key} (${formatBytes(object.Size || 0)}) - ${formatDate(object.LastModified!)}`);
      }
    }

    continuationToken = response.NextContinuationToken;
  } while (continuationToken);

  console.log('\n📊 Summary:');
  console.log(`   Total objects: ${totalObjects}`);
  console.log(`   Total size: ${formatBytes(totalSize)}`);
}

async function getObjectInfo(key: string): Promise<void> {
  console.log(`ℹ️  Getting info for: ${key}`);

  const command = new HeadObjectCommand({
    Bucket: config.bucket,
    Key: key,
  });

  try {
    const response = await r2Client.send(command);
    console.log('\n📄 Object Information:');
    console.log(`   Key: ${key}`);
    console.log(`   Size: ${formatBytes(response.ContentLength || 0)}`);
    console.log(`   Type: ${response.ContentType || 'unknown'}`);
    console.log(`   Last Modified: ${formatDate(response.LastModified!)}`);
    console.log(`   ETag: ${response.ETag}`);
    
    if (response.Metadata) {
      console.log('   Metadata:');
      for (const [k, v] of Object.entries(response.Metadata)) {
        console.log(`     ${k}: ${v}`);
      }
    }
  } catch (error: unknown) {
    if (error instanceof Error) {
      console.error(`❌ Error: ${error.message}`);
    } else {
      console.error('❌ Unknown error occurred');
    }
  }
}

async function generatePresignedUrl(key: string, expiresIn: number = 3600): Promise<void> {
  console.log(`🔗 Generating presigned URL for: ${key}`);
  console.log(`   Expires in: ${expiresIn}s (${Math.floor(expiresIn / 60)}min)`);

  const command = new GetObjectCommand({
    Bucket: config.bucket,
    Key: key,
  });

  try {
    const url = await getSignedUrl(r2Client, command, { expiresIn });
    console.log('\n✅ Presigned URL:');
    console.log(url);
  } catch (error: unknown) {
    if (error instanceof Error) {
      console.error(`❌ Error: ${error.message}`);
    } else {
      console.error('❌ Unknown error occurred');
    }
  }
}

async function deleteOlderThan(days: number, dryRun: boolean = true): Promise<void> {
  console.log(`🗑️  Deleting objects older than ${days} days...`);
  console.log(`   Mode: ${dryRun ? 'DRY RUN (no actual deletion)' : 'LIVE (will delete!)'}`);

  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - days);
  console.log(`   Cutoff date: ${formatDate(cutoffDate)}`);

  let continuationToken: string | undefined;
  let totalFound = 0;
  let totalDeleted = 0;
  let totalSize = 0;

  do {
    const listCommand = new ListObjectsV2Command({
      Bucket: config.bucket,
      ContinuationToken: continuationToken,
      MaxKeys: 1000,
    });

    const response = await r2Client.send(listCommand);
    
    if (response.Contents) {
      for (const object of response.Contents) {
        if (object.LastModified && object.LastModified < cutoffDate) {
          totalFound++;
          totalSize += object.Size || 0;
          console.log(`  ${dryRun ? '[DRY RUN]' : '[DELETE]'} ${object.Key} (${formatBytes(object.Size || 0)}) - ${formatDate(object.LastModified)}`);
          
          if (!dryRun) {
            const deleteCommand = new DeleteObjectCommand({
              Bucket: config.bucket,
              Key: object.Key,
            });
            await r2Client.send(deleteCommand);
            totalDeleted++;
          }
        }
      }
    }

    continuationToken = response.NextContinuationToken;
  } while (continuationToken);

  console.log('\n📊 Summary:');
  console.log(`   Objects found: ${totalFound}`);
  console.log(`   Total size: ${formatBytes(totalSize)}`);
  if (!dryRun) {
    console.log(`   ✅ Objects deleted: ${totalDeleted}`);
  } else {
    console.log(`   💡 Run with --live to actually delete`);
  }
}

async function analyzeStorage(): Promise<void> {
  console.log('📊 Analyzing R2 storage...\n');

  interface CategoryStats {
    count: number;
    size: number;
  }

  const categories: Record<string, CategoryStats> = {
    photos: { count: 0, size: 0 },
    pdfs: { count: 0, size: 0 },
    protocols: { count: 0, size: 0 },
    other: { count: 0, size: 0 },
  };

  let continuationToken: string | undefined;
  let totalObjects = 0;
  let totalSize = 0;

  do {
    const command = new ListObjectsV2Command({
      Bucket: config.bucket,
      ContinuationToken: continuationToken,
      MaxKeys: 1000,
    });

    const response = await r2Client.send(command);
    
    if (response.Contents) {
      for (const object of response.Contents) {
        totalObjects++;
        totalSize += object.Size || 0;

        const key = object.Key || '';
        const size = object.Size || 0;

        if (key.includes('photo') || key.match(/\.(jpg|jpeg|png|webp)$/i)) {
          categories.photos.count++;
          categories.photos.size += size;
        } else if (key.match(/\.pdf$/i)) {
          categories.pdfs.count++;
          categories.pdfs.size += size;
        } else if (key.includes('protocol')) {
          categories.protocols.count++;
          categories.protocols.size += size;
        } else {
          categories.other.count++;
          categories.other.size += size;
        }
      }
    }

    continuationToken = response.NextContinuationToken;
  } while (continuationToken);

  console.log('📈 Storage Analysis:');
  console.log('─'.repeat(60));
  console.log(`Total Objects: ${totalObjects}`);
  console.log(`Total Size: ${formatBytes(totalSize)}`);
  console.log('─'.repeat(60));
  
  for (const [category, stats] of Object.entries(categories)) {
    const percentage = totalSize > 0 ? ((stats.size / totalSize) * 100).toFixed(1) : '0';
    console.log(`${category.padEnd(15)} ${stats.count.toString().padStart(8)} objects  ${formatBytes(stats.size).padStart(12)}  (${percentage}%)`);
  }
  console.log('─'.repeat(60));
}

async function downloadObject(key: string, outputPath?: string): Promise<void> {
  const output = outputPath || path.basename(key);
  console.log(`⬇️  Downloading: ${key} → ${output}`);

  const command = new GetObjectCommand({
    Bucket: config.bucket,
    Key: key,
  });

  try {
    const response = await r2Client.send(command);
    
    if (!response.Body) {
      console.error('❌ No data in response');
      return;
    }

    const writeStream = fs.createWriteStream(output);
    
    // Type assertion for Body stream
    const bodyStream = response.Body as NodeJS.ReadableStream;
    bodyStream.pipe(writeStream);

    await new Promise<void>((resolve, reject) => {
      writeStream.on('finish', () => resolve());
      writeStream.on('error', reject);
    });

    console.log(`✅ Downloaded to: ${output}`);
  } catch (error: unknown) {
    if (error instanceof Error) {
      console.error(`❌ Error: ${error.message}`);
    } else {
      console.error('❌ Unknown error occurred');
    }
  }
}

async function testConnection(): Promise<void> {
  console.log('🔌 Testing R2 connection...');
  console.log(`   Endpoint: ${config.endpoint}`);
  console.log(`   Bucket: ${config.bucket}`);
  console.log(`   Account ID: ${config.accountId}`);

  try {
    const command = new ListObjectsV2Command({
      Bucket: config.bucket,
      MaxKeys: 1,
    });

    const response = await r2Client.send(command);
    console.log('\n✅ Connection successful!');
    console.log(`   Objects in bucket: ${response.KeyCount || 0}+`);
  } catch (error: unknown) {
    console.error('\n❌ Connection failed!');
    if (error instanceof Error) {
      console.error(`   Error: ${error.message}`);
    } else {
      console.error('   Unknown error occurred');
    }
    console.error('\n💡 Check your credentials:');
    console.error('   - R2_ENDPOINT');
    console.error('   - R2_ACCESS_KEY_ID');
    console.error('   - R2_SECRET_ACCESS_KEY');
    console.error('   - R2_BUCKET_NAME');
  }
}

// CLI
async function main(): Promise<void> {
  const args = process.argv.slice(2);
  const command = args[0];

  // Check credentials
  if (!config.endpoint || !config.accessKeyId || !config.secretAccessKey) {
    console.error('❌ Missing R2 credentials!');
    console.error('   Set environment variables:');
    console.error('   - R2_ENDPOINT');
    console.error('   - R2_ACCESS_KEY_ID');
    console.error('   - R2_SECRET_ACCESS_KEY');
    console.error('   - R2_BUCKET_NAME (optional, defaults to "blackrent")');
    console.error('\n💡 Or add them to .dev.vars and run: source .dev.vars');
    process.exit(1);
  }

  try {
    switch (command) {
      case 'list':
        await listAll(args[1]);
        break;
      
      case 'info':
        if (!args[1]) {
          console.error('❌ Usage: pnpm r2:info <key>');
          process.exit(1);
        }
        await getObjectInfo(args[1]);
        break;
      
      case 'url':
        if (!args[1]) {
          console.error('❌ Usage: pnpm r2:url <key> [expires-in-seconds]');
          process.exit(1);
        }
        await generatePresignedUrl(args[1], parseInt(args[2]) || 3600);
        break;
      
      case 'cleanup':
        const days = parseInt(args[1]) || 90;
        const live = args[2] === '--live';
        await deleteOlderThan(days, !live);
        break;
      
      case 'analyze':
        await analyzeStorage();
        break;
      
      case 'download':
        if (!args[1]) {
          console.error('❌ Usage: pnpm r2:download <key> [output-path]');
          process.exit(1);
        }
        await downloadObject(args[1], args[2]);
        break;
      
      case 'test':
        await testConnection();
        break;
      
      default:
        console.log('BlackRent R2 Advanced CLI\n');
        console.log('Usage: pnpm r2:advanced <command> [options]\n');
        console.log('Commands:');
        console.log('  list [prefix]              List all objects (optionally with prefix)');
        console.log('  info <key>                 Get detailed object information');
        console.log('  url <key> [expires]        Generate presigned URL (default: 1 hour)');
        console.log('  cleanup <days> [--live]    Delete objects older than N days (default: dry run)');
        console.log('  analyze                    Analyze storage usage by category');
        console.log('  download <key> [output]    Download object to local file');
        console.log('  test                       Test R2 connection\n');
        console.log('Examples:');
        console.log('  pnpm r2:advanced list uploads/protocols/');
        console.log('  pnpm r2:advanced info uploads/photo.jpg');
        console.log('  pnpm r2:advanced url uploads/photo.jpg 7200');
        console.log('  pnpm r2:advanced cleanup 90');
        console.log('  pnpm r2:advanced cleanup 90 --live');
        console.log('  pnpm r2:advanced analyze');
        console.log('  pnpm r2:advanced test');
        break;
    }
  } catch (error: unknown) {
    if (error instanceof Error) {
      console.error(`\n❌ Error: ${error.message}`);
    } else {
      console.error('\n❌ Unknown error occurred');
    }
    process.exit(1);
  }
}

main();

