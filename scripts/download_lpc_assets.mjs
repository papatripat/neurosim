import fs from 'fs';
import path from 'path';

const BASE_URL = 'https://raw.githubusercontent.com/LiberatedPixelCup/Universal-LPC-Spritesheet-Character-Generator/master/spritesheets/';
const PALETTES_BASE_URL = 'https://raw.githubusercontent.com/LiberatedPixelCup/Universal-LPC-Spritesheet-Character-Generator/master/palette_definitions/';

const FILES = [
  'shadow/adult/walk.png',
  'body/bodies/male/walk.png',
  'body/bodies/female/walk.png',
  'body/bodies/muscular/walk.png',
  'body/bodies/pregnant/walk.png',
  'head/heads/human/male/walk.png',
  'head/heads/human/female/walk.png',
  'eyes/eyebrows/thin/adult/walk.png',
  'eyes/eyebrows/thick/adult/walk.png',
  'hair/parted/adult/walk.png',
  'hair/buzzcut/adult/walk.png',
  'hair/afro/adult/walk.png',
  'hair/bangs/adult/walk.png',
  'hair/bedhead/adult/walk.png',
  'hair/bob/adult/walk.png',
  'hair/pixie/adult/walk.png',
  'hair/curtains/adult/walk.png',
  'hair/long/adult/walk.png',
  'hair/cornrows/adult/walk.png',
  'hair/plain/adult/walk.png',
  'hair/unkempt/adult/walk.png',
  'hair/messy1/adult/walk.png',
  'hair/swoop/adult/walk.png',
  'hair/ponytail/adult/fg/walk.png',
  'hair/ponytail/adult/bg/walk.png',
  'beards/beard/5oclock_shadow/walk.png',
  'beards/mustache/basic/walk.png',
  'beards/beard/trimmed/walk.png',
  'facial/glasses/nerd/adult/walk.png',
  'facial/glasses/round/adult/walk.png',
  'facial/glasses/sunglasses/adult/walk.png',
  'torso/clothes/longsleeve/formal/male/walk.png',
  'torso/clothes/longsleeve/formal_striped/male/walk.png',
  'torso/clothes/longsleeve/longsleeve2_polo/male/walk.png',
  'torso/clothes/longsleeve/longsleeve2_cardigan/male/walk.png',
  'torso/clothes/longsleeve/longsleeve2_buttoned/male/walk.png',
  'torso/clothes/longsleeve/longsleeves_cuffed/male/walk.png',
  'legs/formal/male/walk.png',
  'legs/pants/male/walk.png',
  'legs/cuffed/male/walk.png',
  'legs/formal_striped/male/walk.png',
  'feet/shoes/basic/male/walk.png',
  'feet/shoes/revised/male/walk.png',
  'feet/shoes/ghillies/male/walk.png',
  'feet/shoes/sara/male/walk.png',
  'torso/clothes/shortsleeve/shortsleeve/male/walk.png',
  'torso/jacket/collared/male/walk/white.png',
  'torso/clothes/vest_open/male/walk/white.png',
  'torso/clothes/vest/male/walk/white.png',
  'neck/tie/necktie/male/walk.png',
  'neck/tie/bowtie/adult/walk.png',
  'arms/wrists/cuffs/male/walk.png',
  'torso/waist/belt_leather/male/walk.png',
  'neck/scarf/walk.png',
  'facial/earrings/stud/male/walk.png',
  'head/faces/female/blush/walk.png',
  'legs/skirts/straight/thin/walk.png',
  'legs/skirts/plain/thin/walk.png',
  'hair/bangs_bun/adult/walk.png',
  'hair/wavy/adult/fg/walk.png',
  'hair/wavy/adult/bg/walk.png',
];

const PALETTE_FILES = [
  { url: 'body/body_ulpc.json', out: 'palettes/body.json' },
  { url: 'hair/hair_ulpc.json', out: 'palettes/hair.json' },
  { url: 'cloth/cloth_ulpc.json', out: 'palettes/cloth.json' },
  { url: 'eye/eye_ulpc.json', out: 'palettes/eye.json' },
];

const TARGET_DIR = path.resolve('public/assets/lpc');

async function downloadFile(relPath, remoteUrl) {
  const dest = path.join(TARGET_DIR, relPath);
  fs.mkdirSync(path.dirname(dest), { recursive: true });
  if (fs.existsSync(dest) && fs.statSync(dest).size > 100) {
    return { path: relPath, status: 'cached' };
  }
  const res = await fetch(remoteUrl);
  if (!res.ok) {
    throw new Error(`Failed to download ${remoteUrl} (${res.status} ${res.statusText})`);
  }
  const buffer = Buffer.from(await res.arrayBuffer());
  fs.writeFileSync(dest, buffer);
  return { path: relPath, status: 'downloaded', size: buffer.length };
}

async function run() {
  console.log(`Starting download of Universal LPC assets to ${TARGET_DIR}...`);
  fs.mkdirSync(TARGET_DIR, { recursive: true });

  let successCount = 0;
  for (const file of FILES) {
    const url = BASE_URL + file;
    try {
      const res = await downloadFile(file, url);
      console.log(`[OK] ${file} (${res.status})`);
      successCount++;
    } catch (e) {
      console.error(`[ERR] ${file}: ${e.message}`);
    }
  }

  for (const item of PALETTE_FILES) {
    const url = PALETTES_BASE_URL + item.url;
    try {
      const res = await downloadFile(item.out, url);
      console.log(`[OK] ${item.out} (${res.status})`);
      successCount++;
    } catch (e) {
      console.error(`[ERR] ${item.out}: ${e.message}`);
    }
  }

  console.log(`Finished! Successfully downloaded ${successCount} assets.`);
}

run();
