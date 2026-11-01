import { chromium } from 'playwright';
import path from 'path';

(async () => {
  const browser = await chromium.launch({
    executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
    headless: true
  });
  const page = await browser.newPage({ viewport: { width: 1920, height: 1080 } });

  const htmlPath = 'file:///' + path.resolve('public/demo/pitch_deck.html').replace(/\\/g, '/');
  console.log('Opening pitch deck from:', htmlPath);
  await page.goto(htmlPath, { waitUntil: 'load' });
  await page.waitForTimeout(2000);

  const outPdf = path.resolve('public/demo/pitch_deck_neurosim_inception2026.pdf');
  console.log('Generating vector PDF slide deck to:', outPdf);

  await page.pdf({
    path: outPdf,
    format: 'A4',
    landscape: true,
    printBackground: true,
    margin: { top: '0', bottom: '0', left: '0', right: '0' }
  });

  console.log('PDF generated successfully!');
  await browser.close();
})();
