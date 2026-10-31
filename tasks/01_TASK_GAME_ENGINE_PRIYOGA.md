# PANDUAN TEKNIS: 2D GAME WORLD & PHASER ENGINE
**Penanggung Jawab:** Priyoga Listyo Ananda (didukung Game & Phaser Companion Agent)  
**Tujuan Utama:** Membangun viewport kantor 2D interaktif (2752×1536 px) menggunakan Phaser 3.85+, format modern WebP (`rooms-ground.webp`), sistem *Smooth Camera Follow*, navigasi WASD/Panah, collision sekat ruangan & perabot, Y-sorting, deteksi kedekatan NPC [E], serta papan interaktif **To-Do List** di Koridor Tengah.

---

## 1. File Tanggung Jawab & Struktur Modul

Priyoga bertanggung jawab penuh atas pembuatan dan pemeliharaan file-file berikut:

```
src/
└── game/
    ├── EventBus.ts              --> Singleton Event Emitter penghubung Phaser & React
    ├── PhaserGame.tsx           --> Komponen React pembungkus canvas game (Anti-StrictMode bug)
    ├── config.ts                --> Konfigurasi Phaser 3 (Arcade Physics, Scale.FIT, Camera Follow)
    └── scenes/
        ├── BootScene.ts         --> Preloader aset visual (/assets/maps, /assets/props, /assets/characters)
        └── OfficeScene.ts       --> Logika kantor 2752x1536, kamera, tabrakan, kedekatan NPC, To-Do List
```

---

## 2. Denah Peta Kantor Terpadu (Revisi Sesuai Arahan)

Peta menggunakan format WebP hemat bandwidth (`/assets/maps/rooms-ground.webp`) berukuran **2752 × 1536 px** (~487 KB):

```
+-----------------------------------------------------------------------------------+
| [ZONA 1: Pantry & Dapur]       |   [KORIDOR TENGAH]   | [ZONA 4: Ruangan Bos]     |
| Lantai Catur Hitam-Abu         |                      | Lantai Parket Kayu Formal |
| Posisi Dimas: (630, 230)       | [PAPAN TO-DO LIST]   | Posisi Bu Rina: (2150,230)|
| Pintu: (1166, 365)             |     (1400, 450)      | Pintu: (2153, 515)        |
+--------------------------------+                      +-------------------------------+
| [ZONA 2: Meeting Room]         |                      |                               |
| Lantai Oranye Terracotta       |                      | [ZONA 5: MAIN ROOM]           |
| Posisi Klien: (630, 720)       |                      | Ruang Kerja Karyawan          |
| Pintu: (1166, 775)             |                      | Lantai Karpet Biru Luas       |
+--------------------------------+                      | Meja Pemain: (1700, 850)      |
| [ZONA 3: Smoking Area]         |                      |                               |
| Lantai Grid Teal Menenangkan   |                      |                               |
| Area Santai / Merokok          |                      |                               |
| Pintu: (1166, 1195)            |  [SPAWN PEMAIN]      |                               |
|                                |   (1375, 1280)       |                               |
+--------------------------------+--[PINTU DEPAN UTAMA]-+-------------------------------+
```

### Rincian Fungsi Tiap Zona:
1. **Zona 1 (Kiri Atas): Pantry & Dapur (Dimas - Skenario 2)**
   - Lantai catur hitam-abu. Tempat istirahat, membuat kopi, dan obrolan santai rekan kantor.
   - Lokasi Skenario 2 (Kritik Tidak Langsung).
2. **Zona 2 (Kiri Tengah): Meeting Room (Pak Hendra - Skenario 3)**
   - Lantai oranye terracotta hangat dengan meja rapat formal.
   - Lokasi Skenario 3 (Revisi Mendadak & Negosiasi Tenggat Klien).
3. **Zona 3 (Kiri Bawah): Smoking Area**
   - Area santai/merokok karyawan berlantai ubin teal dengan jendela sirkulasi udara luar.
4. **Zona 4 (Kanan Atas): Ruangan Bos (Bu Rina - Skenario 1)**
   - Ruang atasan berlantai kayu parket privat dan elegan.
   - Lokasi Skenario 1 (Klarifikasi Instruksi Ambigu).
5. **Zona 5 (Kanan Bawah & Tengah): Main Room (Tempat Kerja Karyawan)**
   - Area kerja utama tim berlantai karpet biru luas, tempat workstation pemain dan meja rekan-rekan.
6. **Area Spawn Pemain:**
   - Di bagian pintu depan seberang pas dari Koridor Tengah bagian bawah `(1375, 1280)`.
7. **Papan To-Do List:**
   - Berada di dinding Koridor Tengah `(1400, 450)`. Pemain dapat menekan [E] untuk membuka daftar tugas harian/skenario latihan!

---

## 3. EventBus Singleton (`src/game/EventBus.ts`)

```typescript
import Phaser from 'phaser';

export const EventBus = new Phaser.Events.EventEmitter();

export const GAME_EVENTS = {
  SCENE_READY: 'scene-ready',
  OPEN_DIALOG: 'open-dialog',       // Buka modal percakapan dengan NPC
  CLOSE_DIALOG: 'close-dialog',     // Tutup modal percakapan & unfreeze pemain
  OPEN_TODO_LIST: 'open-todo-list', // Buka modal To-Do List dari papan koridor tengah
};
```

---

## 4. Konfigurasi Phaser & Camera Follow (`src/game/config.ts`)

```typescript
import Phaser from 'phaser';
import { BootScene } from './scenes/BootScene';
import { OfficeScene } from './scenes/OfficeScene';

export const gameConfig: Phaser.Types.Core.GameConfig = {
  type: Phaser.AUTO,
  width: 1280,   // Viewport browser 16:9
  height: 720,
  pixelArt: true,
  physics: {
    default: 'arcade',
    arcade: {
      gravity: { x: 0, y: 0 },
      debug: false
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

## 5. Pemuat Aset WebP (`src/game/scenes/BootScene.ts`)

```typescript
import Phaser from 'phaser';

export class BootScene extends Phaser.Scene {
  constructor() {
    super('BootScene');
  }

  preload() {
    // 1. Background Peta Kantor WebP (2752x1536)
    this.load.image('office-ground', '/assets/maps/rooms-ground.webp');

    // 2. Props Perabot Kantor
    this.load.image('prop-desk', '/assets/props/desk.png');
    this.load.image('prop-chair', '/assets/props/office-chair.png');
    this.load.image('prop-computer', '/assets/props/computer.png');
    this.load.image('prop-cooler', '/assets/props/water-cooler.png');
    this.load.image('prop-cabinet', '/assets/props/filing-cabinet.png');
    this.load.image('prop-plant', '/assets/props/plant-large.png');
    this.load.image('prop-sofa', '/assets/props/sofa.png');
    this.load.image('prop-table', '/assets/props/coffee-table.png');

    // 3. Karakter Aligned Spritesheet (64x64 cell)
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
    this.createCharacterAnimations('char-player');
    this.createCharacterAnimations('char-rina');
    this.createCharacterAnimations('char-dimas');
    this.createCharacterAnimations('char-klien');

    this.scene.start('OfficeScene');
  }

  private createCharacterAnimations(key: string) {
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

## 6. Logika Kantor, Penempatan NPC & To-Do List (`src/game/scenes/OfficeScene.ts`)

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
  private isNearTodoList: boolean = false;
  private todoListPos = { x: 1400, y: 450 };

  constructor() {
    super('OfficeScene');
  }

  create() {
    const MAP_W = 2752;
    const MAP_H = 1536;

    // 1. Render Peta Kantor WebP (2752x1536)
    this.add.image(0, 0, 'office-ground').setOrigin(0, 0).setDepth(0);
    this.physics.world.setBounds(0, 0, MAP_W, MAP_H);

    // 2. Obstacle Static Group (Dinding & Sekat Ruangan)
    this.obstacles = this.physics.add.staticGroup();

    // Dinding Keliling Luar
    this.createWallCollider(MAP_W / 2, 50, MAP_W, 60);         // Atas
    this.createWallCollider(50, MAP_H / 2, 60, MAP_H);         // Kiri
    this.createWallCollider(MAP_W - 50, MAP_H / 2, 60, MAP_H); // Kanan
    this.createWallCollider(650, 1400, 1100, 80);              // Bawah Kiri
    this.createWallCollider(2000, 1400, 1100, 80);             // Bawah Kanan

    // Dinding Pemisah Vertikal (Kamar Kiri vs Koridor) dengan Bukaan Pintu
    this.createWallCollider(1166, 200, 60, 200);  // Atas Pintu Zona 1
    this.createWallCollider(1166, 570, 60, 280);  // Antara Pintu Zona 1 & 2
    this.createWallCollider(1166, 985, 60, 280);  // Antara Pintu Zona 2 & 3
    this.createWallCollider(1166, 1310, 60, 140); // Bawah Pintu Zona 3

    // Dinding Pemisah Horizontal Ruangan Kiri
    this.createWallCollider(600, 515, 1050, 40);  // Pemisah Zona 1 (Pantry) & 2 (Meeting)
    this.createWallCollider(600, 960, 1050, 40);  // Pemisah Zona 2 (Meeting) & 3 (Smoking)

    // Dinding Bawah Zona 4 (Ruangan Bos) dengan bukaan pintu di x=2153
    this.createWallCollider(1920, 515, 350, 40);
    this.createWallCollider(2400, 515, 300, 40);

    // 3. Papan To-Do List di Koridor Tengah
    const board = this.add.rectangle(this.todoListPos.x, this.todoListPos.y, 40, 60, 0x355c5a).setDepth(this.todoListPos.y);
    this.add.text(this.todoListPos.x, this.todoListPos.y - 10, 'TO-DO\nLIST', {
      fontFamily: 'monospace',
      fontSize: '10px',
      color: '#fff9eb',
      align: 'center'
    }).setOrigin(0.5).setDepth(this.todoListPos.y + 1);

    // 4. Perabot Kantor Berdasarkan Zona Baru
    // Zona 1 (Pantry / Dapur): Water cooler, coffee table
    this.obstacles.add(this.physics.add.staticImage(630, 260, 'prop-cooler').setScale(1.75).setDepth(260));
    this.add.image(700, 260, 'prop-table').setScale(1.75).setDepth(260);

    // Zona 2 (Meeting Room): Meja Rapat Besar & Kursi
    this.createDesk(600, 720);
    this.createDesk(680, 720);

    // Zona 3 (Smoking Area): Sofa Santai
    this.add.image(630, 1150, 'prop-sofa').setScale(1.75).setDepth(1150);

    // Zona 4 (Ruangan Bos): Meja Kerja Eksekutif Bu Rina
    this.createDesk(2150, 260);

    // Zona 5 (Main Room): Meja Kerja Pemain
    this.createDesk(1700, 850);

    // 5. Spawn Pemain (Pintu depan seberang Koridor Tengah bagian bawah)
    this.player = this.physics.add.sprite(1375, 1280, 'char-player');
    this.player.setScale(1.75);
    this.player.body.setSize(20, 14).setOffset(22, 50);
    this.player.setCollideWorldBounds(true);
    this.player.play('char-player-idle-south');

    // 6. Spawn NPC Sesuai Zona
    // NPC 1: Bu Rina di Zona 4 (Ruangan Bos - Kanan Atas)
    const rina = this.physics.add.sprite(2150, 220, 'char-rina').setScale(1.75).setImmovable(true);
    rina.body.setSize(20, 14).setOffset(22, 50);
    rina.play('char-rina-idle-south');
    this.npcs.push({ id: 'rina', name: 'Bu Rina (Atasan)', sprite: rina, scenarioId: 'skenario-1' });

    // NPC 2: Dimas di Zona 1 (Pantry & Dapur - Kiri Atas)
    const dimas = this.physics.add.sprite(580, 260, 'char-dimas').setScale(1.75).setImmovable(true);
    dimas.body.setSize(20, 14).setOffset(22, 50);
    dimas.play('char-dimas-idle-south');
    this.npcs.push({ id: 'dimas', name: 'Dimas (Rekan Senior)', sprite: dimas, scenarioId: 'skenario-2' });

    // NPC 3: Pak Hendra di Zona 2 (Meeting Room - Kiri Tengah)
    const klien = this.physics.add.sprite(640, 680, 'char-klien').setScale(1.75).setImmovable(true);
    klien.body.setSize(20, 14).setOffset(22, 50);
    klien.play('char-klien-idle-south');
    this.npcs.push({ id: 'klien', name: 'Pak Hendra (Klien)', sprite: klien, scenarioId: 'skenario-3' });

    // 7. Tabrakan Fisika & Kamera Follow
    this.physics.add.collider(this.player, this.obstacles);
    this.npcs.forEach(n => this.physics.add.collider(this.player, n.sprite));

    this.cameras.main.setBounds(0, 0, MAP_W, MAP_H);
    this.cameras.main.startFollow(this.player, true, 0.08, 0.08);

    // 8. Kontrol Input
    this.cursors = this.input.keyboard!.createCursorKeys();
    this.keyWASD = this.input.keyboard!.addKeys('W,A,S,D') as any;
    this.keyE = this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.E);

    this.promptText = this.add.text(0, 0, 'Tekan [E]', {
      fontFamily: 'monospace',
      fontSize: '14px',
      color: '#ffffff',
      backgroundColor: '#242a38',
      padding: { x: 8, y: 4 }
    }).setOrigin(0.5).setDepth(9999).setVisible(false);

    EventBus.on(GAME_EVENTS.CLOSE_DIALOG, () => {
      this.isPlayerLocked = false;
      this.input.keyboard?.enableGlobalCapture();
    });

    EventBus.emit(GAME_EVENTS.SCENE_READY);
  }

  private createWallCollider(x: number, y: number, w: number, h: number) {
    const wall = this.add.rectangle(x, y, w, h, 0x000000, 0);
    this.physics.add.existing(wall, true);
    this.obstacles.add(wall);
  }

  private createDesk(x: number, y: number) {
    this.add.image(x, y, 'prop-desk').setScale(1.75).setDepth(y);
    this.add.image(x, y - 24, 'prop-computer').setScale(1.75).setDepth(y + 1);
    
    const col = this.physics.add.staticImage(x, y, 'prop-desk').setScale(1.75).setVisible(false);
    col.body.setSize(70, 40).setOffset(8, 24);
    this.obstacles.add(col);
  }

  update() {
    this.player.setDepth(this.player.y);

    if (this.isPlayerLocked) {
      this.player.setVelocity(0, 0);
      return;
    }

    const speed = 140;
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

    // 1. Deteksi Kedekatan dengan Papan To-Do List di Koridor Tengah (< 50px)
    const distToTodo = Phaser.Math.Distance.Between(this.player.x, this.player.y, this.todoListPos.x, this.todoListPos.y);
    if (distToTodo < 50) {
      this.promptText.setText('Tekan [E] Buka To-Do List').setPosition(this.todoListPos.x, this.todoListPos.y - 45).setVisible(true);
      if (Phaser.Input.Keyboard.JustDown(this.keyE)) {
        this.isPlayerLocked = true;
        this.player.setVelocity(0, 0);
        this.promptText.setVisible(false);
        this.input.keyboard?.disableGlobalCapture();
        EventBus.emit(GAME_EVENTS.OPEN_TODO_LIST);
      }
      return;
    }

    // 2. Deteksi Kedekatan ke NPC (< 60px)
    this.activeNpcNear = null;
    for (const npc of this.npcs) {
      const dist = Phaser.Math.Distance.Between(this.player.x, this.player.y, npc.sprite.x, npc.sprite.y);
      if (dist < 60) {
        this.activeNpcNear = npc;
        break;
      }
    }

    if (this.activeNpcNear) {
      this.promptText.setText(`Tekan [E] Bicara (${this.activeNpcNear.name})`)
        .setPosition(this.activeNpcNear.sprite.x, this.activeNpcNear.sprite.y - 48)
        .setVisible(true);

      if (Phaser.Input.Keyboard.JustDown(this.keyE)) {
        this.isPlayerLocked = true;
        this.player.setVelocity(0, 0);
        this.promptText.setVisible(false);
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

## 7. Checklist Verifikasi Priyoga

- [ ] Zona 1 (Pantry/Dapur), Zona 2 (Meeting Room), Zona 3 (Smoking Area), Zona 4 (Ruang Bos Bu Rina), dan Zona 5 (Main Room) terpetakan sesuai denah.
- [ ] Titik spawn pemain berada tepat di depan pintu masuk utama selatan `(1375, 1280)`.
- [ ] Papan To-Do List di Koridor Tengah `(1400, 450)` dapat didekati dan menampilkan prompt *"Tekan [E] Buka To-Do List"*.
- [ ] Bu Rina berada di Zona 4 (Ruang Bos), Dimas di Zona 1 (Pantry), dan Pak Hendra di Zona 2 (Meeting Room).
- [ ] Kamera follow berjalan mulus mengikuti pemain saat berjalan dari pintu depan, koridor tengah, hingga masuk ke masing-masing ruangan.
