// 🚜 BLACKRENT SUV FILTER TEST SCRIPT

const puppeteer = require('puppeteer');

async function testSUVFilter() {
  console.log('🚀 Spúšťam test SUV filteru v kalendári dostupnosti...');
  
  let browser;
  try {
    // Launch browser
    browser = await puppeteer.launch({ 
      headless: false, // Zobrazíme browser pre vizuálne sledovanie
      slowMo: 1000 // Spomalíme pre lepšie sledovanie
    });
    
    const page = await browser.newPage();
    
    // Nastavíme viewport
    await page.setViewport({ width: 1920, height: 1080 });
    
    console.log('📱 Navigácia na BlackRent aplikáciu...');
    await page.goto('http://localhost:3000');
    
    // Čakáme na načítanie login formulára
    await page.waitForSelector('input[name="username"]', { timeout: 10000 });
    
    console.log('🔐 Prihlasujem sa ako admin...');
    // Prihlásenie
    await page.type('input[name="username"]', 'admin');
    await page.type('input[name="password"]', 'Black123');
    await page.click('button[type="submit"]');
    
    // Čakáme na presmerovanie po prihlásení
    await page.waitForNavigation({ waitUntil: 'networkidle0' });
    
    console.log('📅 Navigácia na kalendár dostupnosti...');
    // Klikneme na "Dostupnosť áut" v menu
    await page.waitForSelector('text=Dostupnosť áut', { timeout: 5000 });
    await page.click('text=Dostupnosť áut');
    
    // Čakáme na načítanie kalendára
    await page.waitForSelector('[data-testid="availability-calendar"]', { 
      timeout: 10000 
    }).catch(() => {
      console.log('⚠️ Calendar testid nenájdený, čakám na calendar všeobecne...');
      return page.waitForSelector('.calendar, [class*="calendar"]', { timeout: 10000 });
    });
    
    console.log('🚗 Počítam všetky vozidlá pred filtrovaním...');
    // Počítame vozidlá pred filtrovaním
    const vehiclesBeforeFilter = await page.evaluate(() => {
      // Hľadáme všetky vozidlá v kalendári (rôzne možné selektory)
      const vehicleElements = document.querySelectorAll(
        '[data-vehicle-id], .vehicle-card, .vehicle-item, [class*="vehicle"]'
      );
      return vehicleElements.length;
    });
    
    console.log(`📊 Vozidlá pred filtrovaním: ${vehiclesBeforeFilter}`);
    
    console.log('🚜 Aplikujem SUV filter...');
    // Otvoríme filtre (ak sú zatvorené)
    const filterButton = await page.$('button:has-text("Filter"), [aria-label*="filter"], [title*="filter"]');
    if (filterButton) {
      await filterButton.click();
      await page.waitForTimeout(1000);
    }
    
    // Nájdeme SUV kategóriu v filtri
    try {
      // Pokúsime sa nájsť SUV checkbox alebo select
      const suvFilter = await page.waitForSelector(
        'text=SUV, [value="suv"], input[value="suv"], [data-category="suv"]',
        { timeout: 5000 }
      );
      
      await suvFilter.click();
      console.log('✅ SUV filter aplikovaný');
      
      // Čakáme na preloženie kalendára
      await page.waitForTimeout(2000);
      
    } catch (error) {
      console.log('⚠️ SUV filter selector nenájdený, skúšam alternatívne metódy...');
      
      // Alternatívna metóda - hľadáme select s kategóriami
      const categorySelect = await page.$('select[name*="category"], select[id*="category"]');
      if (categorySelect) {
        await categorySelect.selectOption('suv');
        console.log('✅ SUV filter aplikovaný cez select');
        await page.waitForTimeout(2000);
      } else {
        throw new Error('SUV filter nenájdený');
      }
    }
    
    console.log('🔍 Počítam vozidlá po SUV filtrovaní...');
    // Počítame vozidlá po filtrovaní
    const vehiclesAfterFilter = await page.evaluate(() => {
      const vehicleElements = document.querySelectorAll(
        '[data-vehicle-id], .vehicle-card, .vehicle-item, [class*="vehicle"]'
      );
      return vehicleElements.length;
    });
    
    console.log(`📊 Vozidlá po SUV filtrovaní: ${vehiclesAfterFilter}`);
    
    // Overíme console.log výstupy z aplikácie
    const logs = await page.evaluate(() => {
      return window.console._logs || [];
    });
    
    const categoryFilterLogs = logs.filter(log => 
      log.includes('Category Filter Debug') || log.includes('🚗')
    );
    
    console.log('📝 Debug logy z aplikácie:');
    categoryFilterLogs.forEach(log => console.log('   ', log));
    
    // VÝSLEDKY TESTU
    console.log('\n🎯 VÝSLEDKY SUV FILTER TESTU:');
    console.log('================================');
    console.log(`📊 Vozidlá pred filtrovaním: ${vehiclesBeforeFilter}`);
    console.log(`🚜 Vozidlá po SUV filtrovaní: ${vehiclesAfterFilter}`);
    
    if (vehiclesAfterFilter > 0 && vehiclesAfterFilter < vehiclesBeforeFilter) {
      console.log('✅ SUV FILTER FUNGUJE SPRÁVNE!');
      console.log(`   Filtrovanie zmenšilo počet z ${vehiclesBeforeFilter} na ${vehiclesAfterFilter}`);
    } else if (vehiclesAfterFilter === 0) {
      console.log('⚠️ SUV filter príliš restriktívny - žiadne vozidlá');
    } else if (vehiclesAfterFilter === vehiclesBeforeFilter) {
      console.log('❌ SUV filter sa neaplikoval - rovnaký počet vozidiel');
    } else {
      console.log('❓ Neočakávaný výsledek SUV filtrovania');
    }
    
    // Necháme browser otvorený na 10 sekúnd pre vizuálnu kontrolu
    console.log('👀 Browser zostane otvorený 10 sekúnd pre vizuálnu kontrolu...');
    await page.waitForTimeout(10000);
    
  } catch (error) {
    console.error('❌ CHYBA POČAS TESTOVANIA:', error.message);
    console.error('Stacktrace:', error.stack);
  } finally {
    if (browser) {
      await browser.close();
    }
  }
}

// Spustíme test
testSUVFilter(); 