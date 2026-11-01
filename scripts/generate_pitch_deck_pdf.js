import { chromium } from 'playwright';
import path from 'path';

(async () => {
  const browser = await chromium.launch({
    executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
    headless: true
  });
  const page = await browser.newPage({ viewport: { width: 1920, height: 1080 } });

  console.log('Opening pitch deck in Chrome...');
  await page.goto('http://localhost:3000/demo/pitch_deck.html', { waitUntil: 'networkidle' });
  await page.waitForTimeout(1500);

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
