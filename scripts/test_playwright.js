import { chromium } from 'playwright';

(async () => {
  const browser = await chromium.launch({
    executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
    headless: false
  });
  const page = await browser.newPage({ viewport: { width: 1920, height: 1080 } });
  
  await page.goto('http://localhost:3000');
  console.log('Opened page');
  await page.waitForTimeout(2000);
  
  const authBtn = await page.$('text=Masuk ID Karyawan');
  if (authBtn) {
    console.log('Found Masuk ID Karyawan button');
    await authBtn.click();
    await page.waitForTimeout(1000);
    
    const juriBtn = await page.$('text=Tamu Juri (Instan)');
    if (juriBtn) {
      console.log('Found Tamu Juri button, clicking...');
      await juriBtn.click();
      await page.waitForTimeout(2000);
    }
  }
  
  const exploreBtn = await page.$('text=Jelajahi Kantor 2D');
  if (exploreBtn) {
    console.log('Found Jelajahi Kantor 2D, clicking...');
    await exploreBtn.click();
    await page.waitForTimeout(2000);
  }

  const canvas = await page.$('canvas');
  console.log('Canvas found:', !!canvas);
  
  await page.waitForTimeout(2000);
  await browser.close();
  console.log('Done test!');
})();
