# PANDUAN TEKNIS: 2D GAME WORLD & PHASER ENGINE
**Penanggung Jawab:** Priyoga Listyo Ananda (didukung Game & Phaser Companion Agent)  
**Tujuan Utama:** Membangun viewport kantor 2D interaktif (576×384 px) menggunakan Phaser 3.85+, navigasi karakter WASD/Panah, collision meja & dinding, depth sorting otomatis berdasarkan sumbu Y, deteksi jarak interaksi NPC [E], dan jembatan event aman dengan React.

---

## 1. File Tanggung Jawab & Struktur Modul

Priyoga bertanggung jawab penuh atas pembuatan dan pemeliharaan file-file berikut:

```
src/
└── game/
    ├── EventBus.ts              --> Singleton Event Emitter penghubung Phaser & React
    ├── PhaserGame.tsx           --> Komponen React pembungkus canvas game (Anti-StrictMode bug)
    ├── config.ts                --> Konfigurasi Phaser 3 (Arcade Physics, Scale.FIT, pixelArt: true)
    └── scenes/
        ├── BootScene.ts         --> Preloader aset visual (/assets/maps, /assets/props, /assets/characters)
        └── OfficeScene.ts       --> Logika dunia kantor, pergerakan, tabrakan, kedekatan NPC [E]
```

---

## 2. Lokasi Aset Terkurasi yang Digunakan

Seluruh aset visual telah dirapikan dan disimpan di folder [`public/assets/`](file:///d:/Project/neurosim/public/assets/):

| Komponen Game | Jalur Aset di `public/assets/` |
| :--- | :--- |
| **Latar Dasar Kantor (576×384 px)** | `/assets/maps/rooms-ground.png` |
| **Meja Kantor (Desk)** | `/assets/props/desk.png` |
| **Kursi Kantor (Office Chair)** | `/assets/props/office-chair.png` |
| **Komputer Kantor (Computer)** | `/assets/props/computer.png` |
| **Dispenser Air (Water Cooler)** | `/assets/props/water-cooler.png` |
| **Lemari Arsip (Filing Cabinet)** | `/assets/props/filing-cabinet.png` |
| **Tanaman Hias Pot (Plant)** | `/assets/props/plant-large.png` |
| **Pemain (Resident Aligned)** | `/assets/characters/resident/aligned.png` (Sel 64×64 px) |
| **NPC 1: Bu Rina (Office Worker)** | `/assets/characters/office-worker/aligned.png` (Sel 64×64 px) |
| **NPC 2: Dimas (Resident)** | `/assets/characters/resident/aligned.png` (Sel 64×64 px) |
| **NPC 3: Klien (Courier)** | `/assets/characters/courier/aligned.png` (Sel 64×64 px) |

---

## 3. EventBus Singleton (`src/game/EventBus.ts`)

Jembatan komunikasi aman antara Phaser dan antarmuka React:

```typescript
import Phaser from 'phaser';

export const EventBus = new Phaser.Events.EventEmitter();

export const GAME_EVENTS = {
  SCENE_READY: 'scene-ready',
  OPEN_DIALOG: 'open-dialog',     // Phaser -> React (buka modal chat)
  CLOSE_DIALOG: 'close-dialog',   // React -> Phaser (tutup modal chat & unfreeze)
};
```

---

## 4. Komponen React Pembungkus Phaser (`src/game/PhaserGame.tsx`)

> **CATATAN KRUSIAL REACT STRICTMODE:** React di mode development akan menjalankan `useEffect` dua kali. Jika tidak di-*cleanup*, akan muncul dua canvas bertumpuk.

```tsx
import React, { useEffect, useRef } from 'react';
import Phaser from 'phaser';
import { gameConfig } from './config';
import { EventBus } from './EventBus';

export const PhaserGame: React.FC = () => {
  const gameContainerRef = useRef<HTMLDivElement>(null);
  const gameRef = useRef<Phaser.Game | null>(null);

  useEffect(() => {
    if (!gameContainerRef.current) return;

    // Inisialisasi Game
    const config: Phaser.Types.Core.GameConfig = {
      ...gameConfig,
      parent: gameContainerRef.current,
    };

    const game = new Phaser.Game(config);
    gameRef.current = game;

    // Bersihkan saat unmount
    return () => {
      EventBus.removeAllListeners();
      game.destroy(true);
      gameRef.current = null;
    };
  }, []);

  return (
    <div className="relative w-full h-full flex items-center justify-center bg-[#1a1c23]">
      <div 
        ref={gameContainerRef} 
        className="rounded-lg overflow-hidden shadow-2xl border-4 border-[#355c5a]"
        style={{ imageRendering: 'pixelated' }}
      />
    </div>
  );
};
```

---

## 5. Konfigurasi Phaser (`src/game/config.ts`)

Ukuran canvas internal adalah **576 × 384 px**:

```typescript
import Phaser from 'phaser';
import { BootScene } from './scenes/BootScene';
import { OfficeScene } from './scenes/OfficeScene';

export const gameConfig: Phaser.Types.Core.GameConfig = {
  type: Phaser.AUTO,
  width: 576,
  height: 384,
  pixelArt: true, // Wajib true agar pixel art tajam dan tidak blur
  physics: {
    default: 'arcade',
    arcade: {
      gravity: { x: 0, y: 0 },
      debug: false // Ubah true jika ingin melihat kotak collision saat development
    }
  },
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH
  },
  scene: [BootScene, OfficeScene]
};
```

---

## 6. Pemuat Aset (`src/game/scenes/BootScene.ts`)

```typescript
import Phaser from 'phaser';

export class BootScene extends Phaser.Scene {
  constructor() {
    super('BootScene');
  }

  preload() {
    // 1. Background Ruangan Kantor (576x384)
    this.load.image('office-ground', '/assets/maps/rooms-ground.png');

    // 2. Props Perabot Kantor
    this.load.image('prop-desk', '/assets/props/desk.png');
    this.load.image('prop-chair', '/assets/props/office-chair.png');
    this.load.image('prop-computer', '/assets/props/computer.png');
    this.load.image('prop-cooler', '/assets/props/water-cooler.png');
    this.load.image('prop-cabinet', '/assets/props/filing-cabinet.png');
    this.load.image('prop-plant', '/assets/props/plant-large.png');

    // 3. Karakter Aligned Spritesheet (64x64 cell, pivot 32,54)
    this.load.spritesheet('char-player', '/assets/characters/resident/aligned.png', {
      frameWidth: 64,
      frameHeight: 64
    });
    this.load.spritesheet('char-rina', '/assets/characters/office-worker/aligned.png', {
      frameWidth: 64,
      frameHeight: 64
    });
    this.load.spritesheet('char-dimas', '/assets/characters/resident/aligned.png', {
      frameWidth: 64,
      frameHeight: 64
    });
    this.load.spritesheet('char-klien', '/assets/characters/courier/aligned.png', {
      frameWidth: 64,
      frameHeight: 64
    });
  }

  create() {
    // Daftarkan Animasi Karakter (Aligned 64x64)
    this.createCharacterAnimations('char-player');
    this.createCharacterAnimations('char-rina');
    this.createCharacterAnimations('char-dimas');
    this.createCharacterAnimations('char-klien');

    this.scene.start('OfficeScene');
  }

  private createCharacterAnimations(key: string) {
    // Walk animations (8 frames per direction, index 36..67)
    this.anims.create({
      key: `${key}-walk-south`,
      frames: this.anims.generateFrameNumbers(key, { start: 36, end: 43 }),
      frameRate: 10,
      repeat: -1
    });
    this.anims.create({
      key: `${key}-walk-east`,
      frames: this.anims.generateFrameNumbers(key, { start: 44, end: 51 }),
      frameRate: 10,
      repeat: -1
    });
    this.anims.create({
      key: `${key}-walk-north`,
      frames: this.anims.generateFrameNumbers(key, { start: 52, end: 59 }),
      frameRate: 10,
      repeat: -1
    });
    this.anims.create({
      key: `${key}-walk-west`,
      frames: this.anims.generateFrameNumbers(key, { start: 60, end: 67 }),
      frameRate: 10,
      repeat: -1
    });

    // Idle animations (9 frames per direction, index 0..35)
    this.anims.create({
      key: `${key}-idle-south`,
      frames: this.anims.generateFrameNumbers(key, { start: 0, end: 8 }),
      frameRate: 3,
      repeat: -1
    });
  }
}
```

---

## 7. Logika Dunia Kantor (`src/game/scenes/OfficeScene.ts`)

> **POIN KRUSIAL YANG SUDAH DIPERBAIKI:**
> 1. Deteksi kedekatan NPC menggunakan jarak Euclidean (`dist < 45 px`), bukan overlap callback.
> 2. Panggil `this.input.keyboard.disableGlobalCapture()` saat membuka dialog agar huruf WASD dan Spasi tidak terkunci saat mengetik di input chat React!

```typescript
import Phaser from 'phaser';
import { EventBus, GAME_EVENTS } from '../EventBus';

interface NPCData {
  id: string;
  name: string;
  sprite: Phaser.Physics.Arcade.Sprite;
  scenarioId: string;
}

export class OfficeScene extends Phaser.Scene {
  private player!: Phaser.Physics.Arcade.Sprite;
  private npcs: NPCData[] = [];
  private obstacles!: Phaser.Physics.Arcade.StaticGroup;
  private cursors!: Phaser.Types.Input.Keyboard.CursorKeys;
  private keyWASD!: { [key: string]: Phaser.Input.Keyboard.Key };
  private keyE!: Phaser.Input.Keyboard.Key;
  
  private isPlayerLocked: boolean = false;
  private promptText!: Phaser.GameObjects.Text;
  private activeNpcNear: NPCData | null = null;

  constructor() {
    super('OfficeScene');
  }

  create() {
    // 1. Gambar Background Ruang Kantor (576x384)
    this.add.image(0, 0, 'office-ground').setOrigin(0, 0).setDepth(0);

    // 2. Obstacle Static Group (Batas Tembok & Meja Kerja)
    this.obstacles = this.physics.add.staticGroup();

    // Batas dinding luar area Workspace (x: 288..560, y: 192..368)
    const wallTop = this.add.rectangle(424, 200, 272, 16, 0x000000, 0);
    this.physics.add.existing(wallTop, true);
    this.obstacles.add(wallTop);

    // Meja Bu Rina (361, 281) & Meja Rekan (433, 281)
    this.createDeskWithColliders(361, 281);
    this.createDeskWithColliders(433, 281);

    // Dispenser Air & Lemari Arsip
    const cooler = this.physics.add.staticImage(493, 274, 'prop-cooler').setDepth(274);
    this.obstacles.add(cooler);
    const cabinet = this.physics.add.staticImage(305, 268, 'prop-cabinet').setDepth(268);
    this.obstacles.add(cabinet);

    // 3. Karakter Pemain (Posisi awal di lorong kantor)
    this.player = this.physics.add.sprite(361, 335, 'char-player');
    this.player.body.setSize(24, 16); // Bounding box kaki
    this.player.body.setOffset(20, 48);
    this.player.setCollideWorldBounds(true);
    this.player.play('char-player-idle-south');

    // 4. Spawn NPC 1: Bu Rina (Duduk di balik meja 361, 260)
    const rina = this.physics.add.sprite(361, 260, 'char-rina').setImmovable(true);
    rina.body.setSize(24, 16).setOffset(20, 48);
    rina.play('char-rina-idle-south');
    this.npcs.push({ id: 'rina', name: 'Bu Rina (Atasan)', sprite: rina, scenarioId: 'skenario-1' });

    // Spawn NPC 2: Dimas (Rekan Senior di dekat water cooler)
    const dimas = this.physics.add.sprite(460, 290, 'char-dimas').setImmovable(true);
    dimas.body.setSize(24, 16).setOffset(20, 48);
    dimas.play('char-dimas-idle-south');
    this.npcs.push({ id: 'dimas', name: 'Dimas (Rekan Senior)', sprite: dimas, scenarioId: 'skenario-2' });

    // 5. Physics Collision
    this.physics.add.collider(this.player, this.obstacles);
    this.npcs.forEach(n => this.physics.add.collider(this.player, n.sprite));

    // 6. Kontrol Input
    this.cursors = this.input.keyboard!.createCursorKeys();
    this.keyWASD = this.input.keyboard!.addKeys('W,A,S,D') as any;
    this.keyE = this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.E);

    // 7. Prompt Interaksi Floating Text
    this.promptText = this.add.text(0, 0, 'Tekan [E] Bicara', {
      fontFamily: 'monospace',
      fontSize: '12px',
      color: '#ffffff',
      backgroundColor: '#242a38',
      padding: { x: 6, y: 3 }
    }).setOrigin(0.5).setDepth(9999).setVisible(false);

    // 8. Listener Event dari React
    EventBus.on(GAME_EVENTS.CLOSE_DIALOG, () => {
      this.isPlayerLocked = false;
      this.input.keyboard?.enableGlobalCapture(); // Buka kembali capture keyboard untuk game
    });

    EventBus.emit(GAME_EVENTS.SCENE_READY);
  }

  private createDeskWithColliders(x: number, y: number) {
    // Visual Meja & Komputer
    this.add.image(x, y, 'prop-desk').setDepth(y);
    this.add.image(x, y - 20, 'prop-computer').setDepth(y + 1);
    
    // Collider solid untuk meja
    const col = this.physics.add.staticImage(x, y, 'prop-desk').setVisible(false);
    col.body.setSize(48, 28).setOffset(8, 24);
    this.obstacles.add(col);
  }

  update() {
    // Otomatis atur Depth pemain mengikuti posisi Y kakinya (Y-Sorting)
    this.player.setDepth(this.player.y);

    if (this.isPlayerLocked) {
      this.player.setVelocity(0, 0);
      return;
    }

    // 1. Navigasi Pemain WASD
    const speed = 90;
    let vx = 0;
    let vy = 0;

    if (this.keyWASD.A.isDown || this.cursors.left.isDown) vx = -speed;
    else if (this.keyWASD.D.isDown || this.cursors.right.isDown) vx = speed;

    if (this.keyWASD.W.isDown || this.cursors.up.isDown) vy = -speed;
    else if (this.keyWASD.S.isDown || this.cursors.down.isDown) vy = speed;

    this.player.setVelocity(vx, vy);

    if (vx !== 0 || vy !== 0) {
      if (Math.abs(vx) > Math.abs(vy)) {
        this.player.play(vx > 0 ? 'char-player-walk-east' : 'char-player-walk-west', true);
      } else {
        this.player.play(vy > 0 ? 'char-player-walk-south' : 'char-player-walk-north', true);
      }
    } else {
      this.player.play('char-player-idle-south', true);
    }

    // 2. Deteksi Jarak ke NPC (< 45px)
    this.activeNpcNear = null;
    for (const npc of this.npcs) {
      const dist = Phaser.Math.Distance.Between(this.player.x, this.player.y, npc.sprite.x, npc.sprite.y);
      if (dist < 45) {
        this.activeNpcNear = npc;
        break;
      }
    }

    if (this.activeNpcNear) {
      this.promptText.setPosition(this.activeNpcNear.sprite.x, this.activeNpcNear.sprite.y - 36).setVisible(true);

      // Cek tombol [E]
      if (Phaser.Input.Keyboard.JustDown(this.keyE)) {
        this.isPlayerLocked = true;
        this.player.setVelocity(0, 0);
        this.promptText.setVisible(false);

        // KRUSIAL: Matikan keyboard capture Phaser agar input chat di React bisa diketik!
        this.input.keyboard?.disableGlobalCapture();

        EventBus.emit(GAME_EVENTS.OPEN_DIALOG, {
          scenarioId: this.activeNpcNear.scenarioId,
          npcName: this.activeNpcNear.name
        });
      }
    } else {
      this.promptText.setVisible(false);
    }
  }
}
```

---

## 8. Checklist Verifikasi Priyoga

- [ ] Seluruh aset dimuat dari folder bersih `/assets/...`.
- [ ] Canvas 576×384 terpusat dengan gaya retro pixelated.
- [ ] Navigasi WASD / panah keyboard berjalan lancar pada 60 FPS.
- [ ] Y-sorting berfungsi: saat pemain di belakang meja (`y < 281`), badan tertutup meja; saat di depan (`y > 281`), pemain menutupi meja.
- [ ] Deteksi [E] hanya aktif saat berjarak dekat (< 45 px).
- [ ] `disableGlobalCapture()` terbukti membebaskan tombol WASD dan Spasi di modal chat React.
- [ ] React StrictMode tidak menduplikasi canvas saat di-refresh.

