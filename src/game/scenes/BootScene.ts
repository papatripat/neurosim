import Phaser from 'phaser';

/**
 * BootScene — preloads every visual asset, displays company logo on loading,
 * then registers accurate animation frames and transitions to OfficeScene.
 *
 * Spritesheet Dimensions: 576 × 512 px (9 columns × 8 rows of 64×64 cells)
 *
 * Frame Calculation (col + row * 9):
 *   Row 0 (y=0):   idle_south  (9 frames) → 0, 1, 2, 3, 4, 5, 6, 7, 8
 *   Row 1 (y=64):  idle_east   (9 frames) → 9, 10, 11, 12, 13, 14, 15, 16, 17
 *   Row 2 (y=128): idle_north  (9 frames) → 18, 19, 20, 21, 22, 23, 24, 25, 26
 *   Row 3 (y=192): idle_west   (9 frames) → 27, 28, 29, 30, 31, 32, 33, 34, 35
 *   Row 4 (y=256): walk_south  (8 frames) → 36, 37, 38, 39, 40, 41, 42, 43  (frame 44 is blank padding)
 *   Row 5 (y=320): walk_east   (8 frames) → 45, 46, 47, 48, 49, 50, 51, 52  (frame 53 is blank padding)
 *   Row 6 (y=384): walk_north  (8 frames) → 54, 55, 56, 57, 58, 59, 60, 61  (frame 62 is blank padding)
 *   Row 7 (y=448): walk_west   (8 frames) → 63, 64, 65, 66, 67, 68, 69, 70  (frame 71 is blank padding)
 */
export class BootScene extends Phaser.Scene {
  constructor() {
    super('BootScene');
  }

  preload(): void {
    const { width, height } = this.scale;

    // 0. Preload logo first for display during asset loading
    this.load.image('company-logo', '/logo.webp');

    // --- Loading UI ---
    const logoPlaceholder = this.add.rectangle(width / 2, height / 2 - 70, 72, 72, 0x242a38, 0);
    const title = this.add.text(width / 2, height / 2 - 20, 'NEUROSIM', {
      fontFamily: 'system-ui, sans-serif',
      fontSize: '22px',
      color: '#e0b65d',
      fontStyle: 'bold',
    }).setOrigin(0.5);

    const bar = this.add.rectangle(width / 2, height / 2 + 30, 320, 20, 0x242a38);
    const fill = this.add.rectangle(width / 2 - 156, height / 2 + 30, 0, 14, 0x355c5a).setOrigin(0, 0.5);
    const label = this.add.text(width / 2, height / 2 + 60, 'Memuat aset kantor & karakter...', {
      fontFamily: 'monospace',
      fontSize: '12px',
      color: '#a7b7bb',
    }).setOrigin(0.5);

    this.load.on('filecomplete-image-company-logo', () => {
      this.add.image(width / 2, height / 2 - 70, 'company-logo').setScale(0.12).setOrigin(0.5);
      logoPlaceholder.destroy();
    });

    this.load.on('progress', (v: number) => {
      fill.width = 312 * v;
    });

    this.load.on('complete', () => {
      title.destroy();
      bar.destroy();
      fill.destroy();
      label.destroy();
    });

    // 1. Office ground map (WebP, 2752×1536)
    this.load.image('office-ground', '/assets/maps/rooms-ground.webp');

    // 2. Office Props (Modular & Directional Assets)
    const propNames = [
      'desk', 'office-chair', 'office-chair-north', 'computer', 'computer-north',
      'water-cooler', 'filing-cabinet', 'plant-large', 'plant-small',
      'sofa', 'sofa-north', 'coffee-table', 'armchair',
      'counter', 'espresso-machine', 'pastry-case', 'bar-stool', 'fridge',
      'kitchen-cabinet', 'cafe-table', 'cafe-chair', 'bookcase', 'floor-lamp',
      'printer', 'rug', 'stove', 'sink', 'wall-art', 'wall-clock', 'wall-window',
      'parcel-stack', 'toolbox'
    ];
    for (const name of propNames) {
      this.load.image(`prop-${name}`, `/assets/props/${name}.png`);
    }

    // 3. Modular Character spritesheets (64×64 cell, 9 columns × 8 rows = 576×512)
    // 6 Full Archetypes + Aliases for player & NPCs
    const characters = [
      { key: 'char-resident', path: '/assets/characters/resident/aligned.png' },
      { key: 'char-office-worker', path: '/assets/characters/office-worker/aligned.png' },
      { key: 'char-courier', path: '/assets/characters/courier/aligned.png' },
      { key: 'char-barista', path: '/assets/characters/barista/aligned.png' },
      { key: 'char-cook', path: '/assets/characters/cook/aligned.png' },
      { key: 'char-maintenance-worker', path: '/assets/characters/maintenance-worker/aligned.png' },
      // Aliases
      { key: 'char-player', path: '/assets/characters/resident/aligned.png' },
      { key: 'char-rina', path: '/assets/characters/office-worker/aligned.png' },
      { key: 'char-dimas', path: '/assets/characters/resident/aligned.png' },
      { key: 'char-klien', path: '/assets/characters/courier/aligned.png' },
    ];

    for (const c of characters) {
      this.load.spritesheet(c.key, c.path, {
        frameWidth: 64,
        frameHeight: 64,
      });
    }
  }

  create(): void {
    const charKeys = [
      'char-resident',
      'char-office-worker',
      'char-courier',
      'char-barista',
      'char-cook',
      'char-maintenance-worker',
      'char-player',
      'char-rina',
      'char-dimas',
      'char-klien'
    ];
    for (const key of charKeys) {
      this.createAnimationsForCharacter(key);
    }
    this.scene.start('OfficeScene');
  }

  private createAnimationsForCharacter(key: string): void {
    // Idle animations: 9 frames per row (Row 0..3)
    const idleConfigs: { dir: string; start: number }[] = [
      { dir: 'south', start: 0 },  // Row 0: 0..8
      { dir: 'east', start: 9 },   // Row 1: 9..17
      { dir: 'north', start: 18 }, // Row 2: 18..26
      { dir: 'west', start: 27 },  // Row 3: 27..35
    ];
    for (const { dir, start } of idleConfigs) {
      if (!this.anims.exists(`${key}-idle-${dir}`)) {
        this.anims.create({
          key: `${key}-idle-${dir}`,
          frames: this.anims.generateFrameNumbers(key, { start, end: start + 8 }),
          frameRate: 3,
          repeat: -1,
        });
      }
    }

    // Walk animations: Exactly 8 active frames per row (Row 4..7)
    // Frame numbers derived from 9 columns per row:
    // Row 4 (south): 4 * 9 = 36..43 (8 frames)
    // Row 5 (east):  5 * 9 = 45..52 (8 frames)
    // Row 6 (north): 6 * 9 = 54..61 (8 frames)
    // Row 7 (west):  7 * 9 = 63..70 (8 frames)
    const walkConfigs: { dir: string; start: number }[] = [
      { dir: 'south', start: 36 }, // 36..43
      { dir: 'east', start: 45 },  // 45..52
      { dir: 'north', start: 54 }, // 54..61
      { dir: 'west', start: 63 },  // 63..70
    ];
    for (const { dir, start } of walkConfigs) {
      if (!this.anims.exists(`${key}-walk-${dir}`)) {
        this.anims.create({
          key: `${key}-walk-${dir}`,
          frames: this.anims.generateFrameNumbers(key, { start, end: start + 7 }),
          frameRate: 10,
          repeat: -1,
        });
      }
    }

    // 4 Diagonal Walk Animations (Animasi Jalan Serong):
    // Memungkinkan langkah diagonal berirama dinamis
    const diagonalWalkConfigs: { dir: string; start: number }[] = [
      { dir: 'south-east', start: 45 }, // East frames (45..52)
      { dir: 'south-west', start: 63 }, // West frames (63..70)
      { dir: 'north-east', start: 45 }, // East frames (45..52)
      { dir: 'north-west', start: 63 }, // West frames (63..70)
    ];
    for (const { dir, start } of diagonalWalkConfigs) {
      if (!this.anims.exists(`${key}-walk-${dir}`)) {
        this.anims.create({
          key: `${key}-walk-${dir}`,
          frames: this.anims.generateFrameNumbers(key, { start, end: start + 7 }),
          frameRate: 11,
          repeat: -1,
        });
      }
    }
  }
}
