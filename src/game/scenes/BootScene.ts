import Phaser from 'phaser';

/**
 * BootScene — preloads every visual asset then transitions to OfficeScene.
 *
 * Sprite layout (per aligned.json, 64×64 cells, 9 columns):
 *   Row 0  (y=0):   idle_south  9 frames → indices 0-8
 *   Row 1  (y=64):  idle_east   9 frames → indices 9-17
 *   Row 2  (y=128): idle_north  9 frames → indices 18-26
 *   Row 3  (y=192): idle_west   9 frames → indices 27-35
 *   Row 4  (y=256): walk_south  8 frames → indices 36-43
 *   Row 5  (y=320): walk_east   8 frames → indices 44-51
 *   Row 6  (y=384): walk_north  8 frames → indices 52-59
 *   Row 7  (y=448): walk_west   8 frames → indices 60-67
 */
export class BootScene extends Phaser.Scene {
  constructor() {
    super('BootScene');
  }

  preload(): void {
    // --- Loading bar ---
    const { width, height } = this.scale;
    const bar = this.add.rectangle(width / 2, height / 2, 320, 24, 0x242a38);
    const fill = this.add.rectangle(width / 2 - 156, height / 2, 0, 16, 0x355c5a).setOrigin(0, 0.5);
    const label = this.add.text(width / 2, height / 2 + 28, 'Memuat aset...', {
      fontFamily: 'monospace',
      fontSize: '14px',
      color: '#a7b7bb',
    }).setOrigin(0.5);

    this.load.on('progress', (v: number) => {
      fill.width = 312 * v;
    });
    this.load.on('complete', () => {
      bar.destroy();
      fill.destroy();
      label.destroy();
    });

    // 1. Office ground map (WebP, 2752×1536)
    this.load.image('office-ground', '/assets/maps/rooms-ground.webp');

    // 2. Props (64×64 each)
    const propNames = [
      'desk', 'office-chair', 'computer', 'water-cooler', 'filing-cabinet',
      'plant-large', 'plant-small', 'sofa', 'coffee-table', 'armchair',
      'counter', 'espresso-machine', 'pastry-case', 'bar-stool', 'fridge',
      'kitchen-cabinet', 'cafe-table', 'cafe-chair', 'bookcase', 'floor-lamp',
      'printer', 'rug', 'stove', 'sink', 'wall-art', 'wall-clock', 'wall-window',
    ];
    for (const name of propNames) {
      this.load.image(`prop-${name}`, `/assets/props/${name}.png`);
    }

    // 3. Character spritesheets (64×64 cell, 9 columns × 8 rows = 576×512)
    const characters = [
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
    const charKeys = ['char-player', 'char-rina', 'char-dimas', 'char-klien'];
    for (const key of charKeys) {
      this.createAnimationsForCharacter(key);
    }
    this.scene.start('OfficeScene');
  }

  private createAnimationsForCharacter(key: string): void {
    // Idle animations (9 frames each, 300ms per frame = ~3.3 fps)
    const idleDirs: { dir: string; start: number }[] = [
      { dir: 'south', start: 0 },
      { dir: 'east', start: 9 },
      { dir: 'north', start: 18 },
      { dir: 'west', start: 27 },
    ];
    for (const { dir, start } of idleDirs) {
      this.anims.create({
        key: `${key}-idle-${dir}`,
        frames: this.anims.generateFrameNumbers(key, { start, end: start + 8 }),
        frameRate: 3,
        repeat: -1,
      });
    }

    // Walk animations (8 frames each, 100ms per frame = 10 fps)
    const walkDirs: { dir: string; start: number }[] = [
      { dir: 'south', start: 36 },
      { dir: 'east', start: 44 },
      { dir: 'north', start: 52 },
      { dir: 'west', start: 60 },
    ];
    for (const { dir, start } of walkDirs) {
      this.anims.create({
        key: `${key}-walk-${dir}`,
        frames: this.anims.generateFrameNumbers(key, { start, end: start + 7 }),
        frameRate: 10,
        repeat: -1,
      });
    }
  }
}

