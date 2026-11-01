import { chromium } from 'playwright';

(async () => {
  const browser = await chromium.launch({
    executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
    headless: false
  });
  const page = await browser.newPage({ viewport: { width: 1920, height: 1080 } });
  await page.goto('http://localhost:3000');
  
  // Click Tamu Juri
  await page.click('text=Masuk ID Karyawan');
  await page.waitForTimeout(400);
  await page.click('text=Tamu Juri (Instan)');
  await page.waitForTimeout(1000);
  
  // Enter 2D simulation
  const simBtn = await page.$('text=Masuk Simulasi 2D');
  if (simBtn) {
    await simBtn.click();
    await page.waitForTimeout(2000);
  }

  // Trigger dialogue via EventBus with skenario-1
  const opened = await page.evaluate(() => {
    if (window.__EVENT_BUS__ && window.__GAME_EVENTS__) {
      window.__EVENT_BUS__.emit(window.__GAME_EVENTS__.OPEN_DIALOG, {
        scenarioId: 'skenario-1',
        npcName: 'Bu Rina'
      });
      return true;
    }
    return false;
  });
  
  console.log('Emitted OPEN_DIALOG via EventBus:', opened);
  await page.waitForTimeout(1500);
  
  const modalHeader = await page.$('text=Bu Rina');
  console.log('Dialogue modal with Bu Rina visible:', !!modalHeader);
  
  if (modalHeader) {
    // Check initial message
    const msg = await page.$('text=Halaman beranda tolong dirapikan ya');
    console.log('Initial dialogue found:', !!msg);
    
    // Type the test message
    const inputArea = await page.$('textarea, input[type="text"]');
    if (inputArea) {
      console.log('Typing message to Bu Rina...');
      await inputArea.fill('Selamat pagi Bu Rina, boleh saya konfirmasi bagian atas mana yang perlu dirapikan, serta jam berapa batas waktunya besok pagi?');
      await page.waitForTimeout(1000);
      
      const sendBtn = await page.$('button[type="submit"]');
      if (sendBtn) {
        console.log('Clicking send button...');
        await sendBtn.click();
        await page.waitForTimeout(4000); // Wait for Gemini AI response
      }
    }
  }
  
  await page.waitForTimeout(2000);
  await browser.close();
  console.log('Finished dialogue test!');
})();
