// 🚜 BLACKRENT SUV FILTER FIXED TEST
const puppeteer = require('puppeteer');

async function testSUVFilterFixed() {
  console.log('🚀 TESTOVANIE OPRAVENÉHO SUV FILTRA');
  console.log('=================================');
  
  let browser, page;
  
  try {
    // Launch browser
    browser = await puppeteer.launch({ 
      headless: false,
      defaultViewport: { width: 1200, height: 800 }
    });
    
    page = await browser.newPage();
    
    // Intercept console logs from the app
    page.on('console', msg => {
      if (msg.text().includes('🚗') || msg.text().includes('Category Filter')) {
        console.log('🖥️  APP LOG:', msg.text());
      }
    });
    
    // 1. Navigate to login
    console.log('🔐 Navigating to login...');
    await page.goto('http://localhost:3000/login');
    await page.waitForSelector('input[name="username"]', { timeout: 10000 });
    
    // 2. Login
    console.log('👤 Logging in...');
    await page.type('input[name="username"]', 'admin');
    await page.type('input[name="password"]', 'Black123');
    await page.click('button[type="submit"]');
    
    // 3. Wait for dashboard and navigate to availability
    console.log('📊 Navigating to availability...');
    await page.waitForSelector('nav', { timeout: 10000 });
    await page.click('a[href="/availability"]');
    
    // 4. Wait for availability page to load
    await page.waitForSelector('[data-testid="calendar-container"], .MuiCard-root', { timeout: 15000 });
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    // 5. Count vehicles before filter
    const vehiclesBeforeFilter = await page.$$eval('.MuiCard-root', cards => 
      cards.filter(card => card.textContent.includes('brand') || card.textContent.includes('license')).length
    );
    
    console.log(`📊 Vehicles before filter: ${vehiclesBeforeFilter}`);
    
    // 6. Apply SUV filter - updated selector for category filter
    console.log('🔧 Looking for filter controls...');
    
    // Try multiple possible selectors for the filter
    const filterSelectors = [
      'button:contains("Filtre")',
      'button[aria-label*="filter"]',
      '.filter-button',
      'button:contains("Filter")',
      '[data-testid="filter-button"]'
    ];
    
    let filterButton = null;
    for (const selector of filterSelectors) {
      try {
        await page.waitForSelector(selector, { timeout: 2000 });
        filterButton = selector;
        break;
      } catch (e) {
        continue;
      }
    }
    
    if (filterButton) {
      console.log(`✅ Found filter button: ${filterButton}`);
      await page.click(filterButton);
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Look for SUV option
      const suvSelectors = [
        'li:contains("SUV")',
        'button:contains("SUV")',
        '[data-value="suv"]',
        'option[value="suv"]'
      ];
      
      let suvOption = null;
      for (const selector of suvSelectors) {
        try {
          await page.waitForSelector(selector, { timeout: 2000 });
          suvOption = selector;
          break;
        } catch (e) {
          continue;
        }
      }
      
      if (suvOption) {
        console.log(`✅ Found SUV option: ${suvOption}`);
        await page.click(suvOption);
        await new Promise(resolve => setTimeout(resolve, 2000));
      } else {
        console.log('❌ SUV option not found');
      }
    } else {
      console.log('❌ Filter button not found');
    }
    
    // 7. Count vehicles after filter
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    const vehiclesAfterFilter = await page.$$eval('.MuiCard-root', cards => 
      cards.filter(card => card.textContent.includes('brand') || card.textContent.includes('license')).length
    );
    
    console.log(`📊 Vehicles after filter: ${vehiclesAfterFilter}`);
    
    // 8. Test Results
    console.log('\n🎯 TEST RESULTS:');
    console.log('================');
    console.log(`Before filter: ${vehiclesBeforeFilter} vehicles`);
    console.log(`After filter:  ${vehiclesAfterFilter} vehicles`);
    
    if (vehiclesAfterFilter < vehiclesBeforeFilter && vehiclesAfterFilter > 0) {
      console.log('✅ SUCCESS: Filter is working! Vehicles count reduced appropriately.');
    } else if (vehiclesAfterFilter === vehiclesBeforeFilter) {
      console.log('❌ FILTER NOT APPLIED: Same number of vehicles shown');
    } else if (vehiclesAfterFilter === 0) {
      console.log('⚠️  NO VEHICLES: Filter too restrictive or no SUV vehicles available');
    }
    
  } catch (error) {
    console.error('❌ TEST FAILED:', error.message);
  } finally {
    if (browser) {
      console.log('\n🔚 Closing browser...');
      await browser.close();
    }
  }
}

testSUVFilterFixed(); 