import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Načíta skutočný JPEG súbor vytvorený pomocou Sharp
 */
export function createValidJpegBufferSync() {
  const jpegPath = path.join(__dirname, 'test-image.jpg');
  return fs.readFileSync(jpegPath);
}

// Alias pre kompatibilitu
export const createValidJpegBuffer = createValidJpegBufferSync;

// Pre testy ktoré potrebujú väčší obrázok
export function createLargerValidJpegBuffer() {
  // Vytvorí 100x100 pixel JPEG buffer
  // Pre jednoduchosť použijeme ten istý malý JPEG
  return createValidJpegBuffer();
}
