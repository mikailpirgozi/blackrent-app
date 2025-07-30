const puppeteer = require('puppeteer');
const path = require('path');

async function generatePDF() {
  console.log('🚀 Spúšťam generovanie PDF prezentácie dostupnosti vozidiel...');
  
  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  
  const page = await browser.newPage();
  
  // Nastav viewport pre A4 formát
  await page.setViewport({
    width: 1200,
    height: 1600,
    deviceScaleFactor: 2
  });
  
  // Načítaj HTML súbor
  const htmlPath = path.join(__dirname, 'vehicle-availability-presentation.html');
  await page.goto(`file://${htmlPath}`, {
    waitUntil: 'networkidle0',
    timeout: 30000
  });
  
  // Počkaj na načítanie fontov
  await new Promise(resolve => setTimeout(resolve, 3000));
  
  // Generuj PDF
  const pdfPath = path.join(__dirname, 'BlackRent-Prehlady-Dostupnosti-Prezentacia.pdf');
  
  await page.pdf({
    path: pdfPath,
    format: 'A4',
    printBackground: true,
    margin: {
      top: '20mm',
      right: '20mm',
      bottom: '20mm',
      left: '20mm'
    },
    displayHeaderFooter: false,
    preferCSSPageSize: true
  });
  
  console.log('✅ PDF prezentácia dostupnosti vygenerovaná úspešne!');
  console.log(`📄 Súbor: ${pdfPath}`);
  
  await browser.close();
}

generatePDF().catch(console.error); 