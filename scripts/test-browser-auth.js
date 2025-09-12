const puppeteer = require('puppeteer');

async function testBrowserAuth() {
  const browser = await puppeteer.launch({ headless: true });
  const page = await browser.newPage();
  
  // Enable console logging
  page.on('console', msg => {
    console.log('BROWSER CONSOLE:', msg.type(), msg.text());
  });
  
  // Enable error logging
  page.on('pageerror', error => {
    console.error('BROWSER ERROR:', error.message);
  });
  
  try {
    console.log('Navigating to test-login page...');
    await page.goto('http://localhost:3000/test-login', { waitUntil: 'networkidle2' });
    
    console.log('Waiting for page to load...');
    await page.waitForTimeout(2000);
    
    console.log('Looking for test button...');
    await page.waitForSelector('button', { timeout: 5000 });
    
    console.log('Clicking the AuthContext test button...');
    const buttons = await page.$$('button');
    if (buttons.length >= 1) {
      await buttons[0].click();
      console.log('Button clicked, waiting for result...');
      await page.waitForTimeout(5000);
    }
    
  } catch (error) {
    console.error('Test failed:', error);
  } finally {
    await browser.close();
  }
}

testBrowserAuth();