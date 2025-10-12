#!/usr/bin/env ts-node

/**
 * R2 Storage Statistics from Database
 * Analyzes R2 usage by querying PostgreSQL instead of R2 directly
 */

import { Pool } from 'pg';

async function getR2Stats(): Promise<void> {
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL || 'postgresql://postgres:password@localhost:5432/blackrent',
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
  });

  try {
    console.log('📊 BlackRent R2 Storage Statistics (from Database)\n');

    // Get protocol media statistics
    const mediaQuery = `
      SELECT 
        COUNT(*) as total_files,
        COUNT(DISTINCT protocol_id) as protocols_with_media,
        SUM(CASE WHEN url LIKE '%.pdf' THEN 1 ELSE 0 END) as pdf_count,
        SUM(CASE WHEN url LIKE '%.jpg' OR url LIKE '%.jpeg' THEN 1 ELSE 0 END) as jpeg_count,
        SUM(CASE WHEN url LIKE '%.webp' THEN 1 ELSE 0 END) as webp_count,
        SUM(CASE WHEN url LIKE '%.png' THEN 1 ELSE 0 END) as png_count
      FROM protocol_media
      WHERE url IS NOT NULL AND url != ''
    `;

    const mediaResult = await pool.query(mediaQuery);
    const media = mediaResult.rows[0];

    console.log('━'.repeat(60));
    console.log('📸 Protocol Media Files');
    console.log('━'.repeat(60));
    console.log(`Total files:           ${media.total_files}`);
    console.log(`Protocols with media:  ${media.protocols_with_media}`);
    console.log('');
    console.log('File Types:');
    console.log(`  PDF:   ${media.pdf_count}`);
    console.log(`  JPEG:  ${media.jpeg_count}`);
    console.log(`  WebP:  ${media.webp_count}`);
    console.log(`  PNG:   ${media.png_count}`);
    console.log('');

    // Get handover protocols
    const handoverQuery = `
      SELECT 
        COUNT(*) as total,
        COUNT(pdf_url) as with_pdf,
        SUM(CASE WHEN pdf_url IS NOT NULL AND pdf_url != '' THEN 1 ELSE 0 END) as pdf_generated
      FROM handover_protocols
    `;

    const handoverResult = await pool.query(handoverQuery);
    const handover = handoverResult.rows[0];

    console.log('━'.repeat(60));
    console.log('📄 Handover Protocols');
    console.log('━'.repeat(60));
    console.log(`Total protocols:       ${handover.total}`);
    console.log(`With PDF generated:    ${handover.pdf_generated}`);
    console.log('');

    // Get return protocols
    const returnQuery = `
      SELECT 
        COUNT(*) as total,
        COUNT(pdf_url) as with_pdf,
        SUM(CASE WHEN pdf_url IS NOT NULL AND pdf_url != '' THEN 1 ELSE 0 END) as pdf_generated
      FROM return_protocols
    `;

    const returnResult = await pool.query(returnQuery);
    const returnProto = returnResult.rows[0];

    console.log('━'.repeat(60));
    console.log('📄 Return Protocols');
    console.log('━'.repeat(60));
    console.log(`Total protocols:       ${returnProto.total}`);
    console.log(`With PDF generated:    ${returnProto.pdf_generated}`);
    console.log('');

    // Sample R2 URLs to show structure
    const sampleQuery = `
      SELECT url 
      FROM protocol_media 
      WHERE url IS NOT NULL AND url != ''
      LIMIT 5
    `;

    const sampleResult = await pool.query(sampleQuery);

    console.log('━'.repeat(60));
    console.log('📂 Sample R2 Paths');
    console.log('━'.repeat(60));
    sampleResult.rows.forEach((row: { url: string }, i: number) => {
      const path = row.url.split('.com/')[1] || row.url;
      console.log(`${i + 1}. ${path}`);
    });
    console.log('');

    // Estimate storage size (rough calculation)
    const totalFiles = parseInt(media.total_files) + parseInt(handover.pdf_generated) + parseInt(returnProto.pdf_generated);
    const avgPhotoSize = 0.8; // MB (WebP ~800KB)
    const avgPdfSize = 2.5; // MB (PDF with photos)
    const estimatedSize = (
      parseInt(media.jpeg_count) * 1.2 + // JPEG larger
      parseInt(media.webp_count) * 0.8 + // WebP smaller
      parseInt(media.png_count) * 1.5 + // PNG larger
      parseInt(media.pdf_count) * avgPdfSize +
      (parseInt(handover.pdf_generated) + parseInt(returnProto.pdf_generated)) * avgPdfSize
    );

    console.log('━'.repeat(60));
    console.log('💾 Estimated Storage Usage');
    console.log('━'.repeat(60));
    console.log(`Total files:           ${totalFiles}`);
    console.log(`Estimated size:        ~${estimatedSize.toFixed(2)} MB`);
    console.log('');
    console.log('Breakdown:');
    console.log(`  Photos (WebP):       ~${(parseInt(media.webp_count) * 0.8).toFixed(2)} MB`);
    console.log(`  Photos (JPEG):       ~${(parseInt(media.jpeg_count) * 1.2).toFixed(2)} MB`);
    console.log(`  Photos (PNG):        ~${(parseInt(media.png_count) * 1.5).toFixed(2)} MB`);
    console.log(`  PDFs:                ~${((parseInt(handover.pdf_generated) + parseInt(returnProto.pdf_generated)) * avgPdfSize).toFixed(2)} MB`);
    console.log('');

    console.log('━'.repeat(60));
    console.log('✅ Analysis Complete');
    console.log('━'.repeat(60));

  } catch (error: unknown) {
    if (error instanceof Error) {
      console.error('❌ Error:', error.message);
    } else {
      console.error('❌ Unknown error');
    }
  } finally {
    await pool.end();
  }
}

getR2Stats();

