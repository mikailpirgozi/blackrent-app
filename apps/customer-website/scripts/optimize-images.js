/*
  Bulk image optimizer for customer-website/public/**
  - Re-encodes JPG/JPEG with mozjpeg-like settings (via sharp)
  - Re-encodes PNG with lossless compression
  - Generates companion .webp files for both JPG/PNG
  - Skips already optimized targets if size would increase
*/

const fs = require('fs');
const path = require('path');
const sharp = require('sharp');

const PUBLIC_DIR = path.resolve(__dirname, '..', 'public');

async function walk(dir, files = []) {
  const entries = await fs.promises.readdir(dir, { withFileTypes: true });
  for (const entry of entries) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      await walk(full, files);
    } else {
      files.push(full);
    }
  }
  return files;
}

function isTarget(file) {
  const ext = path.extname(file).toLowerCase();
  return ['.jpg', '.jpeg', '.png'].includes(ext);
}

async function optimizeFile(file) {
  const ext = path.extname(file).toLowerCase();
  const base = file.slice(0, -ext.length);
  const webpTarget = base + '.webp';

  try {
    const input = await fs.promises.readFile(file);
    const image = sharp(input, { failOn: 'none' });
    const metadata = await image.metadata();

    // Create WebP
    try {
      const webpBuf = await image.webp({ quality: 75 }).toBuffer();
      await fs.promises.writeFile(webpTarget, webpBuf);
    } catch (e) {
      // ignore webp failure
    }

    // Re-encode original in-place
    let outBuf;
    if (ext === '.jpg' || ext === '.jpeg') {
      outBuf = await image.jpeg({ quality: 78, chromaSubsampling: '4:2:0', mozjpeg: true, progressive: true }).toBuffer();
    } else if (ext === '.png') {
      // Use palette for big PNGs, else lossless
      const usePalette = (metadata.width || 0) * (metadata.height || 0) > 512 * 512;
      outBuf = await image.png({ compressionLevel: 9, palette: usePalette }).toBuffer();
    }

    if (outBuf && outBuf.length < input.length) {
      await fs.promises.writeFile(file, outBuf);
    }

    return { file, original: input.length, final: outBuf ? Math.min(outBuf.length, input.length) : input.length };
  } catch (err) {
    return { file, error: err.message };
  }
}

(async () => {
  console.log('🔧 Optimizing images in', PUBLIC_DIR);
  const all = await walk(PUBLIC_DIR);
  const targets = all.filter(isTarget);
  let saved = 0;
  let count = 0;
  for (const f of targets) {
    const res = await optimizeFile(f);
    if (res.error) {
      console.log('  ⚠️  Skip', path.relative(PUBLIC_DIR, f), '-', res.error);
      continue;
    }
    count += 1;
    saved += Math.max(0, res.original - res.final);
    console.log('  ✓', path.relative(PUBLIC_DIR, f));
  }
  console.log(`✅ Done. Optimized ${count} files. Saved ~${(saved / 1024).toFixed(1)} KB`);
})();


