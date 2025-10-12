#!/usr/bin/env ts-node

import { Pool } from 'pg';

async function simpleStats(): Promise<void> {
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL || 'postgresql://postgres:password@localhost:5432/blackrent',
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
  });

  try {
    console.log('📊 R2 Storage Statistics\n');

    // List all tables
    const tables = await pool.query(`
      SELECT tablename FROM pg_tables 
      WHERE schemaname = 'public' 
      AND tablename LIKE '%protocol%'
      ORDER BY tablename
    `);

    console.log('📋 Protocol Tables:');
    tables.rows.forEach((row: { tablename: string }) => {
      console.log(`  - ${row.tablename}`);
    });
    console.log('');

    // Check handover_protocols structure
    const handoverCols = await pool.query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'handover_protocols'
      ORDER BY ordinal_position
    `);

    console.log('📋 handover_protocols columns:');
    handoverCols.rows.forEach((row: { column_name: string; data_type: string }) => {
      console.log(`  - ${row.column_name}: ${row.data_type}`);
    });
    console.log('');

    // Handover protocols statistics
    const handoverStats = await pool.query(`
      SELECT 
        COUNT(*) as total,
        COUNT(pdf_url) FILTER (WHERE pdf_url IS NOT NULL AND pdf_url != '') as with_pdf
      FROM handover_protocols
    `);

    const handover = handoverStats.rows[0];
    console.log('━'.repeat(60));
    console.log('📋 Handover Protocols');
    console.log('━'.repeat(60));
    console.log(`Total protocols:       ${handover.total}`);
    console.log(`With PDF:              ${handover.with_pdf}`);
    console.log('');

    // Return protocols statistics
    const returnStats = await pool.query(`
      SELECT 
        COUNT(*) as total,
        COUNT(pdf_url) FILTER (WHERE pdf_url IS NOT NULL AND pdf_url != '') as with_pdf
      FROM return_protocols
    `);

    const returnProto = returnStats.rows[0];
    console.log('━'.repeat(60));
    console.log('📋 Return Protocols');
    console.log('━'.repeat(60));
    console.log(`Total protocols:       ${returnProto.total}`);
    console.log(`With PDF:              ${returnProto.with_pdf}`);
    console.log('');

    // Get all PDF URLs
    const allPdfs = await pool.query(`
      SELECT pdf_url FROM handover_protocols WHERE pdf_url IS NOT NULL
      UNION ALL
      SELECT pdf_url FROM return_protocols WHERE pdf_url IS NOT NULL
    `);

    // Get all image URLs from JSONB arrays
    const imageCount = await pool.query(`
      SELECT 
        (SELECT SUM(jsonb_array_length(vehicle_images_urls)) FROM handover_protocols WHERE vehicle_images_urls IS NOT NULL) as vehicle_images,
        (SELECT SUM(jsonb_array_length(document_images_urls)) FROM handover_protocols WHERE document_images_urls IS NOT NULL) as document_images,
        (SELECT SUM(jsonb_array_length(damage_images_urls)) FROM handover_protocols WHERE damage_images_urls IS NOT NULL) as damage_images,
        (SELECT SUM(jsonb_array_length(vehicle_images_urls)) FROM return_protocols WHERE vehicle_images_urls IS NOT NULL) as return_vehicle_images
    `);

    const images = imageCount.rows[0];
    const totalImages = (parseInt(images.vehicle_images) || 0) + 
                       (parseInt(images.document_images) || 0) + 
                       (parseInt(images.damage_images) || 0) + 
                       (parseInt(images.return_vehicle_images) || 0);

    console.log('━'.repeat(60));
    console.log('📸 Image Statistics');
    console.log('━'.repeat(60));
    console.log(`Total images:          ${totalImages}`);
    console.log(`  Vehicle photos:      ${images.vehicle_images || 0}`);
    console.log(`  Document photos:     ${images.document_images || 0}`);
    console.log(`  Damage photos:       ${images.damage_images || 0}`);
    console.log(`  Return photos:       ${images.return_vehicle_images || 0}`);
    console.log('');

    // Storage estimation
    const avgPhotoSize = 0.8; // MB (WebP)
    const avgPdfSize = 2.5; // MB
    const totalPdfs = allPdfs.rows.length;
    const estimatedSize = (totalImages * avgPhotoSize) + (totalPdfs * avgPdfSize);

    console.log('━'.repeat(60));
    console.log('💾 Storage Estimation');
    console.log('━'.repeat(60));
    console.log(`Total files:           ${totalImages + totalPdfs}`);
    console.log(`Estimated size:        ~${estimatedSize.toFixed(2)} MB`);
    console.log(`  Photos:              ~${(totalImages * avgPhotoSize).toFixed(2)} MB`);
    console.log(`  PDFs:                ~${(totalPdfs * avgPdfSize).toFixed(2)} MB`);
    console.log('');

    // Sample URLs
    if (allPdfs.rows.length > 0) {
      console.log('━'.repeat(60));
      console.log('📂 Sample R2 Paths (PDFs)');
      console.log('━'.repeat(60));
      allPdfs.rows.slice(0, 3).forEach((row: { pdf_url: string }, i: number) => {
        const path = row.pdf_url.split('.com/')[1] || row.pdf_url;
        console.log(`${i + 1}. ${path}`);
      });
      console.log('');
    }

    // Get sample image URL from JSONB
    const sampleImage = await pool.query(`
      SELECT vehicle_images_urls[0] as url
      FROM handover_protocols
      WHERE vehicle_images_urls IS NOT NULL 
      AND jsonb_array_length(vehicle_images_urls) > 0
      LIMIT 1
    `);

    if (sampleImage.rows.length > 0 && sampleImage.rows[0].url) {
      console.log('📂 Sample R2 Path (Photo)');
      console.log('━'.repeat(60));
      const url = sampleImage.rows[0].url;
      const path = url.split('.com/')[1] || url;
      console.log(path);
      console.log('');
    }

    console.log('━'.repeat(60));
    console.log('✅ Analysis Complete');
    console.log('━'.repeat(60));

  } catch (error: unknown) {
    if (error instanceof Error) {
      console.error('❌ Error:', error.message);
    }
  } finally {
    await pool.end();
  }
}

simpleStats();

