import { chromium } from 'playwright';
import path from 'path';
import fs from 'fs';

// Helper for human-like mouse interpolation
async function smoothMove(page, targetX, targetY, steps = 18) {
  const current = await page.evaluate(() => {
    const c = document.getElementById('demo-cursor');
    return c ? { x: parseFloat(c.style.left) || 960, y: parseFloat(c.style.top) || 540 } : { x: 960, y: 540 };
  });

  for (let i = 1; i <= steps; i++) {
    const t = i / steps;
    const ease = t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t;
    const curX = current.x + (targetX - current.x) * ease;
    const curY = current.y + (targetY - current.y) * ease;
    await page.evaluate(({ x, y }) => {
      window.__moveCursor?.(x, y, false);
    }, { x: curX, y: curY });
    await page.waitForTimeout(16);
  }
}

async function smoothClick(page, target) {
  let box = null;
  if (typeof target === 'string') {
    const el = await page.$(target);
    if (el) box = await el.boundingBox();
  } else if (target && typeof target.boundingBox === 'function') {
    box = await target.boundingBox();
  } else if (target && typeof target.x === 'number') {
    box = { x: target.x, y: target.y, width: target.width || 0, height: target.height || 0 };
  }

  if (box && typeof box.x === 'number' && !isNaN(box.x)) {
    const clickX = Math.round(box.x + (box.width || 0) / 2);
    const clickY = Math.round(box.y + (box.height || 0) / 2);
    await smoothMove(page, clickX, clickY, 15);
    await page.evaluate(({ x, y }) => window.__moveCursor?.(x, y, true), { x: clickX, y: clickY });
    await page.waitForTimeout(80);
    await page.mouse.click(clickX, clickY);
    await page.waitForTimeout(100);
    await page.evaluate(({ x, y }) => window.__moveCursor?.(x, y, false), { x: clickX, y: clickY });
  }
}

(async () => {
  const videoDir = path.resolve('demo_assets/raw_video');
  fs.mkdirSync(videoDir, { recursive: true });

  console.log('Launching browser for automated 1080p demo recording (Target: 168s / 02:48)...');
  const browser = await chromium.launch({
    executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
    headless: false,
    args: [
      '--start-fullscreen',
      '--disable-infobars',
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-blink-features=AutomationControlled'
    ]
  });

  const context = await browser.newContext({
    viewport: { width: 1920, height: 1080 },
    recordVideo: {
      dir: videoDir,
      size: { width: 1920, height: 1080 }
    }
  });

  const page = await context.newPage();

  console.log('[00:00] Navigating to NeuroSim Landing Page...');
  await page.goto('http://localhost:3000');
  await page.waitForTimeout(1000);

  // Inject visible presentation cursor
  await page.evaluate(() => {
    const cursor = document.createElement('div');
    cursor.id = 'demo-cursor';
    cursor.style.position = 'fixed';
    cursor.style.width = '24px';
    cursor.style.height = '24px';
    cursor.style.borderRadius = '50%';
    cursor.style.background = 'rgba(53, 92, 90, 0.85)';
    cursor.style.border = '2.5px solid #ffffff';
    cursor.style.boxShadow = '0 0 12px rgba(0,0,0,0.5), 0 0 4px #e0b65d';
    cursor.style.pointerEvents = 'none';
    cursor.style.zIndex = '99999999';
    cursor.style.transition = 'transform 0.08s ease-out, background 0.15s ease';
    cursor.style.transform = 'translate(-50%, -50%)';
    cursor.style.top = '540px';
    cursor.style.left = '960px';
    document.body.appendChild(cursor);

    window.__moveCursor = (x, y, clicking = false) => {
      cursor.style.left = x + 'px';
      cursor.style.top = y + 'px';
      if (clicking) {
        cursor.style.transform = 'translate(-50%, -50%) scale(0.75)';
        cursor.style.background = 'rgba(224, 182, 93, 0.95)';
      } else {
        cursor.style.transform = 'translate(-50%, -50%) scale(1)';
        cursor.style.background = 'rgba(53, 92, 90, 0.85)';
      }
    };
  });

  // =========================================================================
  // BABAK 1: THE HOOK & MASALAH NYATA (00:00 - 00:28)
  // =========================================================================
  console.log('[00:01] Babak 1: The Hook & Masalah Nyata di Dunia Kerja...');
  await smoothMove(page, 200, 48, 20); // Logo
  await page.waitForTimeout(2500);

  // Move to badge: "Simulasi Ruang Kerja & Evaluasi Objektif"
  await smoothMove(page, 430, 200, 24);
  await page.waitForTimeout(2500);

  // Move across main title
  await smoothMove(page, 520, 280, 26);
  await page.waitForTimeout(3000);

  // Highlight paragraph text
  await smoothMove(page, 450, 390, 24);
  await page.waitForTimeout(3500);

  // Smooth scroll down to highlight 4 feature pillars
  console.log('[00:13] Scrolling down to features...');
  for (let y = 0; y <= 450; y += 30) {
    await page.evaluate((top) => window.scrollTo(0, top), y);
    await page.waitForTimeout(35);
  }
  await smoothMove(page, 320, 680, 20);
  await page.waitForTimeout(2500);
  await smoothMove(page, 620, 680, 20);
  await page.waitForTimeout(3000);

  // Scroll back to top smoothly
  console.log('[00:22] Scrolling back to Hero CTA...');
  for (let y = 450; y >= 0; y -= 30) {
    await page.evaluate((top) => window.scrollTo(0, top), y);
    await page.waitForTimeout(35);
  }
  await smoothMove(page, 1680, 48, 24);
  await page.waitForTimeout(3500);

  // =========================================================================
  // BABAK 2: SOLUSI NEUROSIM & KANTOR VIRTUAL 2D (00:28 - 00:55)
  // =========================================================================
  console.log('[00:28] Babak 2: Solusi NeuroSim & Kantor Virtual 2D...');
  await smoothClick(page, 'text=Masuk ID Karyawan');
  await page.waitForTimeout(1500);

  console.log('[00:30] Clicking Tamu Juri (Instan)...');
  await smoothClick(page, 'text=Tamu Juri (Instan)');
  await page.waitForTimeout(2000);

  const simBtn = await page.$('text=Masuk Simulasi 2D');
  if (simBtn) {
    console.log('[00:33] On Dashboard, clicking Masuk Simulasi 2D...');
    await smoothClick(page, 'text=Masuk Simulasi 2D');
    await page.waitForTimeout(3000);
  }

  // Focus the Phaser canvas
  console.log('[00:37] Inside 2D Virtual Office. Interacting with Workstation...');
  await page.click('canvas');
  await page.waitForTimeout(1000);

  // Sit on the chair at spawn
  console.log('[00:39] Pressing Space to sit down at workstation...');
  await page.keyboard.press('Space');
  await page.waitForTimeout(4500); // Show sitting pose

  // Stand up
  console.log('[00:44] Pressing Space to stand up...');
  await page.keyboard.press('Space');
  await page.waitForTimeout(1200);

  // Move around smoothly with keyboard (WASD)
  console.log('[00:46] Walking through office corridor...');
  await page.keyboard.down('KeyD');
  await page.waitForTimeout(1200);
  await page.keyboard.up('KeyD');

  await page.keyboard.down('KeyW');
  await page.waitForTimeout(1800);
  await page.keyboard.up('KeyW');

  await page.waitForTimeout(4000);

  // =========================================================================
  // BABAK 3: SIMULASI INTERAKTIF & GEMINI AI ROLEPLAY (00:55 - 01:38)
  // =========================================================================
  console.log('[00:55] Babak 3: Walking to Bu Rina (Executive Manager)...');
  await page.evaluate(() => {
    const game = window.__PHASER_GAME__;
    const scene = game?.scene?.getScene('OfficeScene');
    if (scene && scene.player) {
      scene.player.setPosition(2150, 240);
    }
  });
  await page.waitForTimeout(1500);

  console.log('[00:57] Opening Dialogue Modal for Skenario 1...');
  await page.evaluate(() => {
    window.__EVENT_BUS__?.emit(window.__GAME_EVENTS__?.OPEN_DIALOG, {
      scenarioId: 'skenario-1',
      npcName: 'Bu Rina'
    });
  });
  await page.waitForTimeout(2500);

  console.log('[01:00] Inspecting Dialogue Modal & Psychological Controls...');
  await smoothMove(page, 960, 260, 20); // Goal ribbon
  await page.waitForTimeout(3000);

  // Hover over Hint button
  await smoothClick(page, 'button:has-text("Petunjuk")');
  await page.waitForTimeout(4000); // Show sticky note hint

  // Focus input field
  console.log('[01:08] Typing message to Bu Rina character-by-character...');
  const inputEl = await page.$('textarea, input[type="text"]');
  if (inputEl) {
    const box = await inputEl.boundingBox();
    if (box) await smoothMove(page, box.x + 80, box.y + 20, 18);
    await inputEl.click();

    const responseText = "Selamat pagi Bu Rina, boleh saya konfirmasi bagian atas mana yang perlu dirapikan, serta jam berapa batas waktunya besok pagi?";
    for (const char of responseText) {
      await page.keyboard.type(char, { delay: 35 });
    }
    await page.waitForTimeout(1200);

    console.log('[01:20] Submitting dialogue to Gemini AI...');
    await smoothClick(page, 'button[type="submit"]');
  }

  // Wait for Gemini AI response streaming & reading time (16 seconds)
  console.log('[01:22] Waiting for Gemini AI response & reading...');
  await page.waitForTimeout(16000);

  // =========================================================================
  // BABAK 4: EVALUASI RUBRIK 4 DIMENSI & HIDDEN INTENT (01:38 - 02:08)
  // =========================================================================
  console.log('[01:38] Babak 4: Requesting Objective Evaluation...');
  const evalBtn = await page.$('text=Selesai & Evaluasi Sekarang');
  if (evalBtn) {
    await smoothClick(page, 'text=Selesai & Evaluasi Sekarang');
  } else {
    await page.evaluate(() => {
      const btn = document.querySelector('button[aria-label="Keluar dari percakapan"]');
      if (btn) btn.click();
    });
  }
  await page.waitForTimeout(3000);

  console.log('[01:42] Exploring 4-Dimension Rubric Cards...');
  await smoothMove(page, 780, 420, 22);
  await page.waitForTimeout(3500);

  await smoothMove(page, 1140, 420, 22);
  await page.waitForTimeout(3500);

  await smoothMove(page, 780, 520, 22);
  await page.waitForTimeout(3500);

  console.log('[01:53] Highlighting Hidden Intent Card...');
  await smoothMove(page, 960, 620, 24);
  await page.waitForTimeout(6000);

  console.log('[01:59] Highlighting Alternative Responses...');
  await smoothMove(page, 960, 740, 24);
  await page.waitForTimeout(6000);

  console.log('[02:05] Closing Evaluation Modal...');
  const closeEvalBtn = await page.$('button:has-text("Selesai & Simpan Riwayat"), button:has-text("Kembali ke Kantor"), button:has-text("Tutup")');
  if (closeEvalBtn) {
    await smoothClick(page, closeEvalBtn);
  } else {
    await page.keyboard.press('Escape');
  }
  await page.waitForTimeout(2500);

  // =========================================================================
  // BABAK 5: AKSESIBILITAS, REALTIME HUB, & PENUTUP (02:08 - 02:48)
  // =========================================================================
  console.log('[02:08] Babak 5: Accessibility & Realtime Hub...');
  const a11yBtn = await page.$('button[aria-label*="aksesibilitas" i], button:has-text("100%"), button:has-text("T")');
  if (a11yBtn) {
    await smoothClick(page, a11yBtn);
    await page.waitForTimeout(4500);
    await page.keyboard.press('Escape');
    await page.waitForTimeout(1500);
  }

  // Open Participants / Rekan Drawer at bottom
  console.log('[02:16] Opening Realtime Participants Drawer...');
  const rekanBtn = await page.$('button:has-text("Rekan")');
  if (rekanBtn) {
    await smoothClick(page, 'button:has-text("Rekan")');
    await page.waitForTimeout(5000);
    await smoothClick(page, 'button:has-text("Rekan")');
    await page.waitForTimeout(1500);
  }

  // Display Closing Championship Screen (02:24 - 02:48)
  console.log('[02:24] Displaying Closing Screen & Team Identity (Holding until 168s)...');
  await page.evaluate(() => {
    const outro = document.createElement('div');
    outro.id = 'demo-outro';
    outro.style.position = 'fixed';
    outro.style.inset = '0';
    outro.style.backgroundColor = 'rgba(15, 23, 42, 0.96)';
    outro.style.backdropFilter = 'blur(16px)';
    outro.style.zIndex = '999999999';
    outro.style.display = 'flex';
    outro.style.flexDirection = 'column';
    outro.style.alignItems = 'center';
    outro.style.justifyContent = 'center';
    outro.style.color = '#f8fafc';
    outro.style.fontFamily = 'ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
    outro.style.opacity = '0';
    outro.style.transition = 'opacity 1.2s cubic-bezier(0.16, 1, 0.3, 1)';
    outro.style.padding = '40px';
    outro.style.textAlign = 'center';

    outro.innerHTML = `
      <div style="max-width: 900px; display: flex; flex-direction: column; align-items: center; gap: 20px;">
        <div style="display: inline-flex; align-items: center; gap: 8px; padding: 6px 16px; border-radius: 9999px; background: rgba(53, 92, 90, 0.4); border: 1px solid rgba(94, 234, 212, 0.3); color: #5eead4; font-size: 13px; font-weight: 700; letter-spacing: 0.05em; text-transform: uppercase;">
          🏆 Hackathon INCEPTION 2026 · Education & Inclusive Future Skills
        </div>

        <h1 style="font-size: 52px; font-weight: 900; margin: 0; color: #ffffff; letter-spacing: -0.03em; line-height: 1.1; font-family: Georgia, serif;">
          Neuro<span style="color: #2dd4bf;">Sim</span>
        </h1>

        <p style="font-size: 20px; font-weight: 500; color: #94a3b8; margin: 0; max-width: 720px; line-height: 1.5;">
          Virtual Office AI Simulator — Mengubah Kecemasan Sosial Menjadi Kesiapan Profesional
        </p>

        <div style="margin: 16px 0; padding: 24px 32px; border-radius: 16px; background: rgba(30, 41, 59, 0.7); border: 1px solid rgba(255, 255, 255, 0.1); width: 100%; box-sizing: border-box; display: grid; grid-template-columns: repeat(2, 1fr); gap: 20px; text-align: left;">
          <div>
            <div style="font-size: 11px; text-transform: uppercase; color: #e0b65d; font-weight: 800; letter-spacing: 0.1em; margin-bottom: 4px;">Tim Pengembang</div>
            <div style="font-size: 18px; font-weight: 700; color: #f8fafc;">"mamah doain aku lolos final"</div>
            <div style="font-size: 14px; color: #94a3b8; margin-top: 2px;">UPN "Veteran" Jawa Timur</div>
          </div>
          <div>
            <div style="font-size: 11px; text-transform: uppercase; color: #e0b65d; font-weight: 800; letter-spacing: 0.1em; margin-bottom: 4px;">Tautan Aplikasi Demo</div>
            <div style="font-size: 18px; font-weight: 700; color: #2dd4bf;">neurosim-demo.vercel.app</div>
            <div style="font-size: 14px; color: #94a3b8; margin-top: 2px;">Aksesibilitas Penuh WCAG AA & Realtime Ready</div>
          </div>
        </div>

        <div style="font-style: italic; font-size: 14px; color: #cbd5e1; max-width: 680px; line-height: 1.6; border-left: 3px solid #2dd4bf; padding-left: 16px; text-align: left;">
          "Berlandaskan Double Empathy Theory, NeuroSim tidak bertujuan mengubah cara berpikir pekerja neurodivergen, melainkan menjembatani komunikasi kerja agar setara, suportif, dan bebas stigma."
        </div>
      </div>
    `;

    document.body.appendChild(outro);
    requestAnimationFrame(() => {
      outro.style.opacity = '1';
    });
  });

  // Hold final screen till 168s total
  await page.waitForTimeout(24000);

  console.log('[02:48] Walkthrough complete! Closing browser and saving raw recording...');
  await page.close();
  await context.close();
  await browser.close();

  // Find generated video
  const files = fs.readdirSync(videoDir).filter(f => f.endsWith('.webm'));
  if (files.length > 0) {
    const rawVideoPath = path.join(videoDir, files[files.length - 1]);
    console.log('Recorded raw video file:', rawVideoPath);
    fs.writeFileSync(path.join(videoDir, 'latest_raw.txt'), rawVideoPath);
  }
})();
