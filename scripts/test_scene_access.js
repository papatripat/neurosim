import { chromium } from 'playwright';

(async () => {
  const browser = await chromium.launch({
    executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
    headless: true
  });
  const page = await browser.newPage({ viewport: { width: 1920, height: 1080 } });
  await page.goto('http://localhost:3000');
  
  // Click Tamu Juri
  await page.click('text=Masuk ID Karyawan');
  await page.waitForTimeout(500);
  await page.click('text=Tamu Juri (Instan)');
  await page.waitForTimeout(1000);
  
  // Click Masuk Simulasi 2D on dashboard
  const simBtn = await page.$('text=Masuk Simulasi 2D');
  if (simBtn) {
    console.log('Clicking Masuk Simulasi 2D...');
    await simBtn.click();
    await page.waitForTimeout(3000);
  }
  
  // Test scene access
  const playerPos = await page.evaluate(() => {
    const game = window.__PHASER_GAME__;
    if (!game) return null;
    const scene = game.scene.getScene('OfficeScene');
    if (!scene || !scene.player) return null;
    return { x: scene.player.x, y: scene.player.y };
  });
  
  console.log('Player position in office simulation:', playerPos);
  
  await browser.close();
})();
