import { CharacterCustomization, CharacterDirection } from '../types/character';

export interface LayerSpec {
  id: string;
  url: string;
  paletteType?: 'body' | 'hair' | 'cloth' | 'eye';
  sourceVariant?: string;
  targetVariant?: string;
  secondaryPaletteType?: 'eye';
  secondarySourceVariant?: string;
  secondaryTargetVariant?: string;
  zPos: number;
}

// In-memory image cache to avoid re-fetching PNGs
const imageCache = new Map<string, HTMLImageElement>();
// In-memory palettes cache
let bodyPalettes: Record<string, string[]> | null = null;
let hairPalettes: Record<string, string[]> | null = null;
let clothPalettes: Record<string, string[]> | null = null;
let eyePalettes: Record<string, string[]> | null = null;

export async function loadPalettes(): Promise<{
  body: Record<string, string[]>;
  hair: Record<string, string[]>;
  cloth: Record<string, string[]>;
  eye: Record<string, string[]>;
}> {
  if (bodyPalettes && hairPalettes && clothPalettes && eyePalettes) {
    return { body: bodyPalettes, hair: hairPalettes, cloth: clothPalettes, eye: eyePalettes };
  }

  const [bRes, hRes, cRes, eRes] = await Promise.all([
    fetch('/assets/lpc/palettes/body.json').then((r) => r.json()),
    fetch('/assets/lpc/palettes/hair.json').then((r) => r.json()),
    fetch('/assets/lpc/palettes/cloth.json').then((r) => r.json()),
    fetch('/assets/lpc/palettes/eye.json').then((r) => r.json()),
  ]);

  bodyPalettes = bRes;
  hairPalettes = hRes;
  clothPalettes = cRes;
  eyePalettes = eRes;
  return { body: bRes, hair: hRes, cloth: cRes, eye: eRes };
}

export function loadImage(url: string): Promise<HTMLImageElement> {
  const cached = imageCache.get(url);
  if (cached && cached.complete) {
    return Promise.resolve(cached);
  }
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.src = url;
    img.onload = () => {
      imageCache.set(url, img);
      resolve(img);
    };
    img.onerror = (err) => {
      console.warn(`LPC image load failed for ${url}:`, err);
      reject(err);
    };
  });
}

function hexToRgb(hex: string): { r: number; g: number; b: number } {
  let clean = hex.replace('#', '').trim();
  if (clean.length === 3) {
    clean = clean.split('').map((c) => c + c).join('');
  }
  const num = parseInt(clean, 16);
  return {
    r: (num >> 16) & 255,
    g: (num >> 8) & 255,
    b: num & 255,
  };
}

/**
 * Apply tolerance-based palette swap onto canvas image data according to LPC specifications.
 */
export function recolorImageData(
  imgData: ImageData,
  sourcePalette: string[],
  targetPalette: string[],
  tolerance = 4
): void {
  if (!sourcePalette || !targetPalette) return;
  const data = imgData.data;
  const srcRgb = sourcePalette.map(hexToRgb);
  const tgtRgb = targetPalette.map(hexToRgb);
  const len = Math.min(srcRgb.length, tgtRgb.length);

  for (let i = 0; i < data.length; i += 4) {
    const a = data[i + 3];
    if (a < 10) continue; // Skip transparency

    const r = data[i];
    const g = data[i + 1];
    const b = data[i + 2];

    for (let p = 0; p < len; p++) {
      const s = srcRgb[p];
      if (
        Math.abs(r - s.r) <= tolerance &&
        Math.abs(g - s.g) <= tolerance &&
        Math.abs(b - s.b) <= tolerance
      ) {
        const t = tgtRgb[p];
        data[i] = t.r;
        data[i + 1] = t.g;
        data[i + 2] = t.b;
        break;
      }
    }
  }
}

export function mapEyeColorToLpc(id: string): string {
  switch (id) {
    case 'ocean-blue':
      return 'blue';
    case 'forest-green':
      return 'green';
    case 'hazel':
      return 'orange';
    case 'slate-gray':
      return 'gray';
    case 'black':
    case 'dark-brown':
    default:
      return 'brown';
  }
}

// Maps application config to LPC palette keys
export function mapSkinToneToLpc(id: string): string {
  switch (id) {
    case 'pale':
      return 'light';
    case 'peach':
      return 'amber';
    case 'olive':
      return 'olive';
    case 'tan':
      return 'taupe';
    case 'bronze':
      return 'bronze';
    case 'dark':
      return 'brown';
    default:
      return 'light';
  }
}

export function mapHairColorToLpc(id: string): string {
  switch (id) {
    case 'black':
      return 'black';
    case 'dark-brown':
      return 'dark_brown';
    case 'caramel':
      return 'light_brown';
    case 'chestnut':
      return 'chestnut';
    case 'blonde':
      return 'blonde';
    case 'gray':
      return 'gray';
    case 'burgundy':
      return 'red';
    case 'navy':
      return 'navy';
    default:
      return 'black';
  }
}

export function mapClothColorToLpc(id: string): string {
  switch (id) {
    case 'white':
    case 'white-sneaker':
      return 'white';
    case 'sky-blue':
    case 'light-blue':
      return 'sky';
    case 'deep-navy':
    case 'navy':
    case 'navy-suit':
      return 'navy';
    case 'charcoal':
    case 'charcoal-suit':
      return 'charcoal';
    case 'black':
    case 'black-suit':
    case 'black-leather':
      return 'black';
    case 'khaki':
    case 'beige-suit':
      return 'tan';
    case 'dark-brown':
    case 'brown-suit':
      return 'brown';
    case 'cognac-tan':
      return 'leather';
    case 'gray-suede':
    case 'slate-suit':
      return 'slate';
    case 'slate-teal':
    case 'slate':
      return 'slate';
    case 'forest-green':
    case 'forest':
      return 'forest';
    case 'sage':
      return 'green';
    case 'crimson':
    case 'wine':
      return 'maroon';
    case 'cream':
      return 'tan';
    case 'terracotta':
      return 'orange';
    case 'dark-denim':
      return 'blue';
    case 'gold':
      return 'yellow';
    case 'silver':
      return 'gray';
    default:
      return 'white';
  }
}

/**
 * Resolve the list of modular LPC layers for a given character configuration
 */
export function getLpcLayers(config: CharacterCustomization): LayerSpec[] {
  const layers: LayerSpec[] = [];

  // 1. Shadow (Layer 0)
  layers.push({
    id: 'shadow',
    url: '/assets/lpc/shadow/adult/walk.png',
    zPos: 0,
  });

  // 2. Hair Background (if hairstyle has back layer, like ponytail or shoulder waves)
  const hairKey = config.hairStyle || 'short-parted';
  if (hairKey === 'ponytail') {
    layers.push({
      id: 'hair-bg',
      url: '/assets/lpc/hair/ponytail/adult/bg/walk.png',
      paletteType: 'hair',
      sourceVariant: 'orange',
      targetVariant: mapHairColorToLpc(config.hairColor),
      zPos: 5,
    });
  } else if (hairKey === 'shoulder-waves') {
    layers.push({
      id: 'hair-bg',
      url: '/assets/lpc/hair/wavy/adult/bg/walk.png',
      paletteType: 'hair',
      sourceVariant: 'orange',
      targetVariant: mapHairColorToLpc(config.hairColor),
      zPos: 5,
    });
  }

  // 3. Body base (Universal LPC humanoid frame for 100% clothing & shoe alignment)
  // Note: All clothing & shoes in LPC are drafted on the universal humanoid frame ('male').
  // Using 'male' as the body mannequin avoids the classic LPC bug where female bare feet
  // stick out between pants and shoes ("2 pasang kaki"), while gender distinction is fully
  // preserved via the feminine head, eyes, face, eyelashes, and hairstyles.
  const gender = config.gender || 'male';
  const bodyFile = 'male';

  layers.push({
    id: 'body',
    url: `/assets/lpc/body/bodies/${bodyFile}/walk.png`,
    paletteType: 'body',
    sourceVariant: 'light',
    targetVariant: mapSkinToneToLpc(config.skinTone),
    zPos: 10,
  });

  // 3b. Human Head & Face base (Aligned with neck and body skin tone + eye iris color)
  const headGender = gender === 'female' ? 'female' : 'male';
  layers.push({
    id: 'head',
    url: `/assets/lpc/head/heads/human/${headGender}/walk.png`,
    paletteType: 'body',
    sourceVariant: 'light',
    targetVariant: mapSkinToneToLpc(config.skinTone),
    secondaryPaletteType: 'eye',
    secondarySourceVariant: 'blue',
    secondaryTargetVariant: mapEyeColorToLpc(config.eyeColor),
    zPos: 12,
  });

  // 3c. Feminine Blush & Expression (Soft rosy tone for female character distinction)
  if (gender === 'female') {
    layers.push({
      id: 'head-blush',
      url: '/assets/lpc/head/faces/female/blush/walk.png',
      paletteType: 'body',
      sourceVariant: 'light',
      targetVariant: mapSkinToneToLpc(config.skinTone),
      zPos: 14,
    });
  }

  // 4. Eyebrows (Facial Expression & Tone)
  layers.push({
    id: 'eyebrows',
    url: '/assets/lpc/eyes/eyebrows/thin/adult/walk.png',
    paletteType: 'hair',
    sourceVariant: 'orange',
    targetVariant: mapHairColorToLpc(config.hairColor),
    zPos: 15,
  });

  // 5. Pants / Skirts / Legs
  const pants = config.pantsType || 'slacks-formal';
  let pantsUrl = '/assets/lpc/legs/formal/male/walk.png';
  if (pants === 'chinos-neat') {
    pantsUrl = '/assets/lpc/legs/pants/male/walk.png';
  } else if (pants === 'dark-jeans') {
    pantsUrl = '/assets/lpc/legs/cuffed/male/walk.png';
  } else if (pants === 'slacks-striped') {
    pantsUrl = '/assets/lpc/legs/formal_striped/male/walk.png';
  } else if (pants === 'pencil-skirt') {
    pantsUrl = '/assets/lpc/legs/skirts/straight/thin/walk.png';
  } else if (pants === 'a-line-skirt') {
    pantsUrl = '/assets/lpc/legs/skirts/plain/thin/walk.png';
  }

  layers.push({
    id: 'legs',
    url: pantsUrl,
    paletteType: 'cloth',
    sourceVariant: 'white',
    targetVariant: mapClothColorToLpc(config.pantsColor),
    zPos: 25,
  });

  // 6. Shoes / Feet
  const shoes = config.shoesType || 'oxford-leather';
  let shoesUrl = '/assets/lpc/feet/shoes/basic/male/walk.png';
  if (shoes === 'penny-loafers') {
    shoesUrl = '/assets/lpc/feet/shoes/revised/male/walk.png';
  } else if (shoes === 'clean-sneakers') {
    shoesUrl = '/assets/lpc/feet/shoes/ghillies/male/walk.png';
  } else if (shoes === 'flats-shoes' || shoes === 'work-boots') {
    shoesUrl = '/assets/lpc/feet/shoes/sara/male/walk.png';
  }

  layers.push({
    id: 'feet',
    url: shoesUrl,
    paletteType: 'cloth',
    sourceVariant: 'white',
    targetVariant: mapClothColorToLpc(config.shoesColor),
    zPos: 35,
  });

  // 7. Shirt / Top / Suit (Full torso shirt coverage)
  const shirt = config.shirtType || 'collared-formal';
  let shirtUrl = '/assets/lpc/torso/clothes/longsleeve/formal/male/walk.png';
  if (shirt === 'rolled-sleeves') {
    // Rolled/short sleeves shirt using standard shortsleeve base with white source palette
    shirtUrl = '/assets/lpc/torso/clothes/shortsleeve/shortsleeve/male/walk.png';
  } else if (shirt === 'casual-polo') {
    shirtUrl = '/assets/lpc/torso/clothes/longsleeve/longsleeve2_polo/male/walk.png';
  } else if (shirt === 'cardigan-knit') {
    shirtUrl = '/assets/lpc/torso/clothes/longsleeve/longsleeve2_cardigan/male/walk.png';
  } else if (shirt === 'crew-tshirt') {
    shirtUrl = '/assets/lpc/torso/clothes/longsleeve/longsleeve2_buttoned/male/walk.png';
  }

  // If formal suit/blazer is selected
  if (config.suitType && config.suitType !== 'none') {
    const isStriped = config.suitType === 'smart-blazer';
    const suitTorsoUrl = isStriped
      ? '/assets/lpc/torso/clothes/longsleeve/formal_striped/male/walk.png'
      : '/assets/lpc/torso/clothes/longsleeve/formal/male/walk.png';
    layers.push({
      id: 'torso',
      url: suitTorsoUrl,
      paletteType: 'cloth',
      sourceVariant: 'white',
      targetVariant: mapClothColorToLpc(config.suitColor || 'navy-suit'),
      zPos: 45,
    });
  } else {
    layers.push({
      id: 'torso',
      url: shirtUrl,
      paletteType: 'cloth',
      sourceVariant: 'white',
      targetVariant: mapClothColorToLpc(config.shirtColor),
      zPos: 45,
    });
  }

  // 7b. Tie (Formal Necktie & Bowtie)
  const tie = config.tieType || 'none';
  if (tie !== 'none') {
    let tieUrl = '/assets/lpc/neck/tie/necktie/male/walk.png';
    if (tie === 'necktie-silk' || tie === 'striped-tie') {
      tieUrl = '/assets/lpc/neck/tie/necktie/male/walk.png';
    } else if (tie === 'bowtie') {
      tieUrl = '/assets/lpc/neck/tie/bowtie/adult/walk.png';
    }

    layers.push({
      id: 'tie',
      url: tieUrl,
      paletteType: 'cloth',
      sourceVariant: 'white',
      targetVariant: mapClothColorToLpc(config.tieColor || 'crimson'),
      zPos: 50,
    });
  }

  // 7c. Suit / Blazer / Vest Luaran
  const suit = config.suitType || 'none';
  if (suit !== 'none') {
    let suitUrl = '/assets/lpc/torso/jacket/collared/male/walk/white.png';
    if (suit === 'single-breasted') {
      suitUrl = '/assets/lpc/torso/jacket/collared/male/walk/white.png';
    } else if (suit === 'smart-blazer') {
      suitUrl = '/assets/lpc/torso/clothes/vest_open/male/walk/white.png';
    } else if (suit === 'formal-vest') {
      suitUrl = '/assets/lpc/torso/clothes/vest/male/walk/white.png';
    }

    layers.push({
      id: 'suit',
      url: suitUrl,
      paletteType: 'cloth',
      sourceVariant: 'white',
      targetVariant: mapClothColorToLpc(config.suitColor || 'navy-suit'),
      zPos: 60,
    });
  }

  // 7d. Accessories & Office Equipment
  const acc = config.accessory || 'none';
  if (acc === 'leather-watch') {
    layers.push({
      id: 'watch',
      url: '/assets/lpc/arms/wrists/cuffs/male/walk.png',
      paletteType: 'cloth',
      sourceVariant: 'white',
      targetVariant: 'brown',
      zPos: 65,
    });
  } else if (acc === 'belt-leather') {
    layers.push({
      id: 'belt',
      url: '/assets/lpc/torso/waist/belt_leather/male/walk.png',
      paletteType: 'cloth',
      sourceVariant: 'brown',
      targetVariant: 'leather',
      zPos: 70,
    });
  } else if (acc === 'scarf') {
    layers.push({
      id: 'scarf',
      url: '/assets/lpc/neck/scarf/walk.png',
      paletteType: 'cloth',
      sourceVariant: 'white',
      targetVariant: 'teal',
      zPos: 75,
    });
  } else if (acc === 'earrings') {
    layers.push({
      id: 'earrings',
      url: '/assets/lpc/facial/earrings/stud/male/walk.png',
      zPos: 116,
    });
  }

  // 8. Facial Hair (Beard & Mustache) - only for male
  const facial = gender === 'female' ? 'none' : (config.facialHair || 'none');
  if (facial === 'stubble') {
    layers.push({
      id: 'beard',
      url: '/assets/lpc/beards/beard/5oclock_shadow/walk.png',
      paletteType: 'hair',
      sourceVariant: 'orange',
      targetVariant: mapHairColorToLpc(config.hairColor),
      zPos: 110,
    });
  } else if (facial === 'neat-mustache') {
    layers.push({
      id: 'mustache',
      url: '/assets/lpc/beards/mustache/basic/walk.png',
      paletteType: 'hair',
      sourceVariant: 'orange',
      targetVariant: mapHairColorToLpc(config.hairColor),
      zPos: 111,
    });
  } else if (facial === 'full-beard' || facial === 'goatee') {
    layers.push({
      id: 'beard',
      url: '/assets/lpc/beards/beard/trimmed/walk.png',
      paletteType: 'hair',
      sourceVariant: 'orange',
      targetVariant: mapHairColorToLpc(config.hairColor),
      zPos: 110,
    });
  }

  // 9. Hair Foreground
  let hairUrl: string | null = '/assets/lpc/hair/parted/adult/walk.png';
  if (hairKey === 'short-parted') {
    hairUrl = '/assets/lpc/hair/parted/adult/walk.png';
  } else if (hairKey === 'buzz-cut') {
    hairUrl = '/assets/lpc/hair/buzzcut/adult/walk.png';
  } else if (hairKey === 'afro-fade') {
    hairUrl = '/assets/lpc/hair/afro/adult/walk.png';
  } else if (hairKey === 'pixie-cut') {
    hairUrl = '/assets/lpc/hair/pixie/adult/walk.png';
  } else if (hairKey === 'office-bun') {
    hairUrl = '/assets/lpc/hair/bangs_bun/adult/walk.png';
  } else if (hairKey === 'shoulder-waves') {
    hairUrl = '/assets/lpc/hair/wavy/adult/fg/walk.png';
  } else if (hairKey === 'ponytail') {
    hairUrl = '/assets/lpc/hair/ponytail/adult/fg/walk.png';
  } else if (hairKey === 'messy-crop') {
    hairUrl = '/assets/lpc/hair/messy1/adult/walk.png';
  } else if (hairKey === 'slicked-back') {
    hairUrl = '/assets/lpc/hair/swoop/adult/walk.png';
  } else if (hairKey === 'bald') {
    hairUrl = null;
  }

  if (hairUrl) {
    layers.push({
      id: 'hair-fg',
      url: hairUrl,
      paletteType: 'hair',
      sourceVariant: 'orange',
      targetVariant: mapHairColorToLpc(config.hairColor),
      zPos: 120,
    });
  }

  // 10. Glasses & Eyewear
  const glasses = config.glasses || 'none';
  if (glasses === 'horn-rimmed') {
    layers.push({
      id: 'glasses',
      url: '/assets/lpc/facial/glasses/nerd/adult/walk.png',
      zPos: 125,
    });
  } else if (glasses === 'wire-frame' || glasses === 'reading-oval') {
    layers.push({
      id: 'glasses',
      url: '/assets/lpc/facial/glasses/round/adult/walk.png',
      zPos: 125,
    });
  } else if (glasses === 'sunglasses') {
    layers.push({
      id: 'glasses',
      url: '/assets/lpc/facial/glasses/sunglasses/adult/walk.png',
      zPos: 125,
    });
  }

  // Sort strictly by zPos ascending
  return layers.sort((a, b) => a.zPos - b.zPos);
}

/**
 * Generate a complete 576×512 spritesheet canvas matching Phaser's expected animation rows:
 * Row 0: Idle South
 * Row 1: Idle East
 * Row 2: Idle North
 * Row 3: Idle West
 * Row 4: Walk South
 * Row 5: Walk East
 * Row 6: Walk North
 * Row 7: Walk West
 */
export async function generateFullLpcSpritesheet(
  config: CharacterCustomization
): Promise<HTMLCanvasElement> {
  const palettes = await loadPalettes();
  const layers = getLpcLayers(config);

  // 1. Create a 576×256 scratch canvas to composite the raw LPC walk.png layers
  const lpcCanvas = document.createElement('canvas');
  lpcCanvas.width = 576;
  lpcCanvas.height = 256;
  const lpcCtx = lpcCanvas.getContext('2d')!;
  lpcCtx.imageSmoothingEnabled = false;

  const tempCanvas = document.createElement('canvas');
  tempCanvas.width = 576;
  tempCanvas.height = 256;
  const tempCtx = tempCanvas.getContext('2d', { willReadFrequently: true })!;
  tempCtx.imageSmoothingEnabled = false;

  for (const layer of layers) {
    try {
      const img = await loadImage(layer.url);
      tempCtx.clearRect(0, 0, 576, 256);
      tempCtx.drawImage(img, 0, 0, 576, 256);

      // If this layer requires palette recoloring, process image data
      if (layer.paletteType && layer.sourceVariant && layer.targetVariant) {
        let palGroup: Record<string, string[]> | null = null;
        if (layer.paletteType === 'body') palGroup = palettes.body;
        else if (layer.paletteType === 'hair') palGroup = palettes.hair;
        else if (layer.paletteType === 'cloth') palGroup = palettes.cloth;
        else if (layer.paletteType === 'eye') palGroup = palettes.eye;

        if (palGroup) {
          const srcPal = palGroup[layer.sourceVariant];
          const tgtPal = palGroup[layer.targetVariant];
          if (srcPal && tgtPal) {
            const imgData = tempCtx.getImageData(0, 0, 576, 256);
            recolorImageData(imgData, srcPal, tgtPal);
            tempCtx.putImageData(imgData, 0, 0);
          }
        }
      }

      // Secondary palette recoloring (e.g. eye iris recolor on head layer)
      if (
        layer.secondaryPaletteType &&
        layer.secondarySourceVariant &&
        layer.secondaryTargetVariant
      ) {
        let secPalGroup: Record<string, string[]> | null = null;
        if (layer.secondaryPaletteType === 'eye') secPalGroup = palettes.eye;
        if (secPalGroup) {
          const sSrcPal = secPalGroup[layer.secondarySourceVariant];
          const sTgtPal = secPalGroup[layer.secondaryTargetVariant];
          if (sSrcPal && sTgtPal) {
            const imgData = tempCtx.getImageData(0, 0, 576, 256);
            recolorImageData(imgData, sSrcPal, sTgtPal);
            tempCtx.putImageData(imgData, 0, 0);
          }
        }
      }

      // Blend onto composite canvas
      lpcCtx.drawImage(tempCanvas, 0, 0);
    } catch (e) {
      console.warn(`Could not composite LPC layer ${layer.id} (${layer.url})`, e);
    }
  }

  // 2. Map from LPC walk.png (4 rows: North, West, South, East) into
  // the game engine's 8-row format (576×512):
  // LPC rows:
  // Row 0 = North
  // Row 1 = West
  // Row 2 = South
  // Row 3 = East
  //
  // Target rows:
  // Row 0 (y=0):   idle south  (Frame 0 of LPC South row)
  // Row 1 (y=64):  idle east   (Frame 0 of LPC East row)
  // Row 2 (y=128): idle north  (Frame 0 of LPC North row)
  // Row 3 (y=192): idle west   (Frame 0 of LPC West row)
  // Row 4 (y=256): walk south  (Frames 1..8 of LPC South row)
  // Row 5 (y=320): walk east   (Frames 1..8 of LPC East row)
  // Row 6 (y=384): walk north  (Frames 1..8 of LPC North row)
  // Row 7 (y=448): walk west   (Frames 1..8 of LPC West row)

  const outCanvas = document.createElement('canvas');
  outCanvas.width = 576;
  outCanvas.height = 768;
  const outCtx = outCanvas.getContext('2d')!;
  outCtx.imageSmoothingEnabled = false;

  const lpcRowFor = {
    north: 0,
    west: 1,
    south: 2,
    east: 3,
  };

  const copyIdleRow = (dir: 'south' | 'east' | 'north' | 'west', targetRow: number) => {
    const srcY = lpcRowFor[dir] * 64;
    const dstY = targetRow * 64;
    // Frame 0 in LPC walk.png is standing/idle pose
    for (let col = 0; col < 9; col++) {
      outCtx.drawImage(lpcCanvas, 0, srcY, 64, 64, col * 64, dstY, 64, 64);
    }
  };

  const copyWalkRow = (dir: 'south' | 'east' | 'north' | 'west', targetRow: number) => {
    const srcY = lpcRowFor[dir] * 64;
    const dstY = targetRow * 64;
    // Frames 1..8 in LPC walk.png are walk frames
    for (let col = 0; col < 8; col++) {
      outCtx.drawImage(lpcCanvas, (col + 1) * 64, srcY, 64, 64, col * 64, dstY, 64, 64);
    }
  };

  const generateSitRow = (dir: 'south' | 'east' | 'north' | 'west', targetRow: number) => {
    const srcY = lpcRowFor[dir] * 64;
    const dstY = targetRow * 64;

    const frameCanvas = document.createElement('canvas');
    frameCanvas.width = 64;
    frameCanvas.height = 64;
    const fCtx = frameCanvas.getContext('2d')!;
    fCtx.imageSmoothingEnabled = false;
    fCtx.drawImage(lpcCanvas, 0, srcY, 64, 64, 0, 0, 64, 64);
    const srcData = fCtx.getImageData(0, 0, 64, 64);

    const sitData = fCtx.createImageData(64, 64);
    const s = srcData.data;
    const d = sitData.data;

    const getPixel = (x: number, y: number) => {
      if (x < 0 || x >= 64 || y < 0 || y >= 64) return [0, 0, 0, 0];
      const idx = (y * 64 + x) * 4;
      return [s[idx], s[idx + 1], s[idx + 2], s[idx + 3]];
    };

    const setPixel = (x: number, y: number, rgba: number[]) => {
      if (x < 0 || x >= 64 || y < 0 || y >= 64) return;
      const idx = (y * 64 + x) * 4;
      d[idx] = rgba[0];
      d[idx + 1] = rgba[1];
      d[idx + 2] = rgba[2];
      d[idx + 3] = rgba[3];
    };

    if (dir === 'south') {
      // Lower upper body 6px
      for (let y = 0; y <= 44; y++) {
        for (let x = 0; x < 64; x++) {
          const p = getPixel(x, y);
          if (p[3] > 10) setPixel(x, y + 6, p);
        }
      }
      // Foreshorten thighs
      for (let y = 44; y <= 50; y++) {
        for (let x = 0; x < 64; x++) {
          const p = getPixel(x, y);
          if (p[3] > 10) {
            setPixel(x, y + 5, p);
            setPixel(x, y + 6, p);
          }
        }
      }
      // Plant feet
      for (let y = 52; y < 64; y++) {
        for (let x = 0; x < 64; x++) {
          const p = getPixel(x, y);
          if (p[3] > 10) setPixel(x, y, p);
        }
      }
    } else if (dir === 'east') {
      // Sitting profile facing EAST
      // 1. Lower Head, Hair, Neck & Torso by 5px (standing torso up to y=42)
      for (let y = 0; y <= 42; y++) {
        for (let x = 0; x < 64; x++) {
          const p = getPixel(x, y);
          if (p[3] > 10) setPixel(x, y + 5, p);
        }
      }

      // Sample pants and shoe tones from the standing sprite
      let pantsOutline = [20, 20, 25, 255];
      let pantsBase = [45, 60, 95, 255];
      let pantsLight = [60, 80, 125, 255];
      let shoeOutline = [20, 20, 20, 255];
      let shoeBase = [200, 200, 200, 255];

      for (let y = 47; y <= 52; y++) {
        for (let x = 28; x <= 34; x++) {
          const p = getPixel(x, y);
          if (p[3] > 150) {
            const br = (p[0] + p[1] + p[2]) / 3;
            if (br < 50) pantsOutline = p;
            else if (br < 110) pantsBase = p;
            else pantsLight = p;
          }
        }
      }
      for (let y = 58; y <= 62; y++) {
        for (let x = 30; x <= 36; x++) {
          const p = getPixel(x, y);
          if (p[3] > 150) {
            const br = (p[0] + p[1] + p[2]) / 3;
            if (br < 40) shoeOutline = p;
            else shoeBase = p;
          }
        }
      }

      // Waist connection
      for (let x = 27; x <= 36; x++) {
        const p = getPixel(x, 42);
        if (p[3] > 10) setPixel(x, 47, p);
      }

      // 2. Horizontal Thigh extending to the right (x: 27..39, y: 47..52)
      for (let x = 27; x <= 39; x++) {
        setPixel(x, 47, pantsOutline);
        setPixel(x, 48, pantsLight);
        setPixel(x, 49, pantsBase);
        setPixel(x, 50, pantsBase);
        setPixel(x, 51, pantsBase);
        setPixel(x, 52, pantsOutline);
      }
      setPixel(40, 48, pantsOutline);
      setPixel(40, 49, pantsLight);
      setPixel(40, 50, pantsBase);
      setPixel(40, 51, pantsOutline);

      // 3. Vertical Calf descending from knee (x: 36..40, y: 52..57)
      for (let y = 52; y <= 57; y++) {
        setPixel(36, y, pantsOutline);
        setPixel(37, y, pantsBase);
        setPixel(38, y, pantsLight);
        setPixel(39, y, pantsLight);
        setPixel(40, y, pantsOutline);
      }

      // 4. Shoe planted flat on floor (x: 36..43, y: 58..62)
      for (let x = 36; x <= 42; x++) {
        setPixel(x, 58, shoeOutline);
        setPixel(x, 59, shoeBase);
        setPixel(x, 60, shoeBase);
        setPixel(x, 61, shoeOutline);
        setPixel(x, 62, shoeOutline);
      }
      setPixel(43, 60, shoeOutline);
      setPixel(43, 61, shoeOutline);

      // 5. Hand resting on lap (x: 33..36, y: 46..47)
      let skinTone = [210, 160, 130, 255];
      let skinOutline = [120, 80, 60, 255];
      for (let y = 43; y <= 46; y++) {
        for (let x = 30; x <= 34; x++) {
          const p = getPixel(x, y);
          if (p[0] > 140 && p[1] > 90 && p[2] < 120 && p[3] > 150) {
            skinTone = p;
          }
        }
      }
      setPixel(33, 46, skinOutline);
      setPixel(34, 46, skinTone);
      setPixel(35, 46, skinTone);
      setPixel(36, 46, skinOutline);
      setPixel(33, 47, skinOutline);
      setPixel(34, 47, skinTone);
      setPixel(35, 47, skinOutline);
    } else if (dir === 'north') {
      for (let y = 0; y <= 45; y++) {
        for (let x = 0; x < 64; x++) {
          const p = getPixel(x, y);
          if (p[3] > 10) setPixel(x, y + 6, p);
        }
      }
      for (let y = 52; y < 64; y++) {
        for (let x = 0; x < 64; x++) {
          const p = getPixel(x, y);
          if (p[3] > 10) setPixel(x, y, p);
        }
      }
    } else if (dir === 'west') {
      // Sitting profile facing WEST
      // 1. Lower Head, Hair, Neck & Torso by 5px
      for (let y = 0; y <= 42; y++) {
        for (let x = 0; x < 64; x++) {
          const p = getPixel(x, y);
          if (p[3] > 10) setPixel(x, y + 5, p);
        }
      }

      let pantsOutline = [20, 20, 25, 255];
      let pantsBase = [45, 60, 95, 255];
      let pantsLight = [60, 80, 125, 255];
      let shoeOutline = [20, 20, 20, 255];
      let shoeBase = [200, 200, 200, 255];

      for (let y = 47; y <= 52; y++) {
        for (let x = 30; x <= 36; x++) {
          const p = getPixel(x, y);
          if (p[3] > 150) {
            const br = (p[0] + p[1] + p[2]) / 3;
            if (br < 50) pantsOutline = p;
            else if (br < 110) pantsBase = p;
            else pantsLight = p;
          }
        }
      }
      for (let y = 58; y <= 62; y++) {
        for (let x = 28; x <= 34; x++) {
          const p = getPixel(x, y);
          if (p[3] > 150) {
            const br = (p[0] + p[1] + p[2]) / 3;
            if (br < 40) shoeOutline = p;
            else shoeBase = p;
          }
        }
      }

      for (let x = 28; x <= 37; x++) {
        const p = getPixel(x, 42);
        if (p[3] > 10) setPixel(x, 47, p);
      }

      // 2. Horizontal Thigh extending to the left (x: 25..37, y: 47..52)
      for (let x = 25; x <= 37; x++) {
        setPixel(x, 47, pantsOutline);
        setPixel(x, 48, pantsLight);
        setPixel(x, 49, pantsBase);
        setPixel(x, 50, pantsBase);
        setPixel(x, 51, pantsBase);
        setPixel(x, 52, pantsOutline);
      }
      setPixel(23, 48, pantsOutline);
      setPixel(23, 49, pantsLight);
      setPixel(23, 50, pantsBase);
      setPixel(23, 51, pantsOutline);

      // 3. Vertical Calf descending (x: 23..27, y: 52..57)
      for (let y = 52; y <= 57; y++) {
        setPixel(23, y, pantsOutline);
        setPixel(24, y, pantsLight);
        setPixel(25, y, pantsLight);
        setPixel(26, y, pantsBase);
        setPixel(27, y, pantsOutline);
      }

      // 4. Shoe planted flat on floor (x: 21..28, y: 58..62)
      for (let x = 21; x <= 27; x++) {
        setPixel(x, 58, shoeOutline);
        setPixel(x, 59, shoeBase);
        setPixel(x, 60, shoeBase);
        setPixel(x, 61, shoeOutline);
        setPixel(x, 62, shoeOutline);
      }
      setPixel(20, 60, shoeOutline);
      setPixel(20, 61, shoeOutline);

      // 5. Hand resting on lap (x: 27..30, y: 46..47)
      let skinTone = [210, 160, 130, 255];
      let skinOutline = [120, 80, 60, 255];
      for (let y = 43; y <= 46; y++) {
        for (let x = 30; x <= 34; x++) {
          const p = getPixel(x, y);
          if (p[0] > 140 && p[1] > 90 && p[2] < 120 && p[3] > 150) {
            skinTone = p;
          }
        }
      }
      setPixel(27, 46, skinOutline);
      setPixel(28, 46, skinTone);
      setPixel(29, 46, skinTone);
      setPixel(30, 46, skinOutline);
      setPixel(28, 47, skinOutline);
      setPixel(29, 47, skinTone);
      setPixel(30, 47, skinOutline);
    }

    fCtx.putImageData(sitData, 0, 0);
    for (let col = 0; col < 9; col++) {
      outCtx.drawImage(frameCanvas, col * 64, dstY);
    }
  };

  copyIdleRow('south', 0);
  copyIdleRow('east', 1);
  copyIdleRow('north', 2);
  copyIdleRow('west', 3);

  copyWalkRow('south', 4);
  copyWalkRow('east', 5);
  copyWalkRow('north', 6);
  copyWalkRow('west', 7);

  generateSitRow('south', 8);
  generateSitRow('east', 9);
  generateSitRow('north', 10);
  generateSitRow('west', 11);

  return outCanvas;
}
