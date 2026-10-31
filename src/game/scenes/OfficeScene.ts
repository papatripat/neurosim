import Phaser from 'phaser';
import { EventBus, GAME_EVENTS } from '../EventBus';

// ---------------------------------------------------------------------------
// Types & Interfaces
// ---------------------------------------------------------------------------

interface NPCData {
  id: string;
  name: string;
  role: string;
  sprite: Phaser.Physics.Arcade.Sprite;
  scenarioId: string;
}

export interface OfficeZone {
  id: string;
  name: string;
  subtitle: string;
  badge: string;
  icon: string;
  borderColor: number;
  textColor: string;
  check: (x: number, y: number) => boolean;
}

// ---------------------------------------------------------------------------
// Constants & Map Geometry
// ---------------------------------------------------------------------------

const MAP_W = 2752;
const MAP_H = 1536;
const PLAYER_SPEED = 160;
const NPC_INTERACT_DIST = 70;
const TODO_INTERACT_DIST = 70;

// Proportional scales for 64×64 sprites onto 2752×1536 map
// Calibrated to 1.35 / 1.4 for natural proportions and spacious doorways
const CHAR_SCALE = 1.35;
const PROP_SCALE = 1.4;

// Default Spawn: In Main Room (Zona 5) right in front of player workstation facing desk!
// "semisal awal spawn dia tuh fokusnya ke main room"
const SPAWN = { x: 1660, y: 920 };

// To-Do List board mounted ON THE TOP WALL of the central corridor (not blocking hallway!)
// "untuk bagian todolist itu tolong jangan di taroh di tengah-tengah gitu jadi tolong benerin agar to do list nya itu lebih keatas dan buat semacam papan gituann dan itu ada barriernya"
const TODO_POS = { x: 1450, y: 140 };

// NPC spawn positions per official specification
const NPC_POSITIONS = {
  rina: { x: 2150, y: 245 },   // Zona 4 — Ruangan Bos (Skenario 1)
  dimas: { x: 580, y: 270 },   // Zona 1 — Pantry & Dapur (Skenario 2)
  klien: { x: 640, y: 700 },   // Zona 2 — Meeting Room (Skenario 3)
} as const;

// ---------------------------------------------------------------------------
// Office Zones Definition
// ---------------------------------------------------------------------------

const OFFICE_ZONES: OfficeZone[] = [
  {
    id: 'zona-4',
    name: 'Zona 4 · Ruangan Bos',
    subtitle: 'Ruang Manajemen & Atasan (Bu Rina)',
    badge: 'EXECUTIVE SUITE',
    icon: '💼',
    borderColor: 0xe0b65d,
    textColor: '#f4ead5',
    check: (x, y) => x >= 1715 && x <= 2595 && y >= 100 && y <= 518,
  },
  {
    id: 'zona-1',
    name: 'Zona 1 · Pantry & Dapur',
    subtitle: 'Area Istirahat & Rekan Kerja (Dimas)',
    badge: 'PANTRY & BREAKROOM',
    icon: '☕',
    borderColor: 0xba8a5c,
    textColor: '#fff9eb',
    check: (x, y) => x >= 100 && x <= 1166 && y >= 100 && y <= 518,
  },
  {
    id: 'zona-2',
    name: 'Zona 2 · Meeting Room',
    subtitle: 'Ruang Rapat & Presentasi Klien (Pak Hendra)',
    badge: 'CONFERENCE ROOM',
    icon: '📊',
    borderColor: 0x355c5a,
    textColor: '#fff9eb',
    check: (x, y) => x >= 100 && x <= 1166 && y > 518 && y <= 970,
  },
  {
    id: 'zona-3',
    name: 'Zona 3 · Smoking & Creative Lounge',
    subtitle: 'Area Santai & Diskusi Informal',
    badge: 'SMOKING LOUNGE',
    icon: '🚬',
    borderColor: 0x697b8b,
    textColor: '#fff9eb',
    check: (x, y) => x >= 100 && x <= 1166 && y > 970 && y <= 1260,
  },
  {
    id: 'zona-5',
    name: 'Zona 5 · Workstation Utama',
    subtitle: 'Ruang Kerja Karyawan & Kolaborasi Tim',
    badge: 'MAIN WORKSPACE',
    icon: '💻',
    borderColor: 0x2b6e4f,
    textColor: '#e0b65d',
    check: (x, y) => x >= 1420 && x <= 2595 && y >= 520 && y <= 1380,
  },
  {
    id: 'koridor',
    name: 'Koridor Utama & Pintu Masuk',
    subtitle: 'Pusat Navigasi & Papan Agenda Skenario',
    badge: 'CENTRAL CORRIDOR',
    icon: '📋',
    borderColor: 0x3d485b,
    textColor: '#fff9eb',
    check: () => true, // Fallback when in hallway / entrance
  },
];

// ---------------------------------------------------------------------------
// OfficeScene
// ---------------------------------------------------------------------------

export class OfficeScene extends Phaser.Scene {
  // Player
  private player!: Phaser.Physics.Arcade.Sprite;
  private lastDirection: string = 'north';

  // NPCs
  private npcs: NPCData[] = [];

  // Physics Obstacles (Walls & Solid Furniture)
  private obstacles!: Phaser.Physics.Arcade.StaticGroup;

  // Input Keys
  private cursors!: Phaser.Types.Input.Keyboard.CursorKeys;
  private wasd!: Record<string, Phaser.Input.Keyboard.Key>;
  private keyE!: Phaser.Input.Keyboard.Key;

  // Interaction State
  private isPlayerLocked = false;
  private promptText!: Phaser.GameObjects.Text;
  private promptBg!: Phaser.GameObjects.Rectangle;
  private promptContainer!: Phaser.GameObjects.Container;
  private activeNpcNear: NPCData | null = null;
  private isNearTodoList = false;

  // Room Location HUD
  private currentZoneId: string | null = null;
  private locationPillContainer!: Phaser.GameObjects.Container;
  private locationPillText!: Phaser.GameObjects.Text;
  private locationPillBg!: Phaser.GameObjects.Rectangle;

  // Center-Screen Cinematic Zone Notification
  private centerBannerContainer!: Phaser.GameObjects.Container;
  private centerBannerBg!: Phaser.GameObjects.Rectangle;
  private centerBannerBadgeText!: Phaser.GameObjects.Text;
  private centerBannerTitleText!: Phaser.GameObjects.Text;
  private centerBannerSubText!: Phaser.GameObjects.Text;
  private centerBannerTween: Phaser.Tweens.Tween | null = null;

  constructor() {
    super('OfficeScene');
  }

  // =========================================================================
  // CREATE
  // =========================================================================

  create(): void {
    // 1. Office Ground Texture (WebP 2752×1536)
    this.add.image(0, 0, 'office-ground').setOrigin(0, 0).setDepth(0);
    this.physics.world.setBounds(0, 0, MAP_W, MAP_H);

    // 2. Static Obstacles Group
    this.obstacles = this.physics.add.staticGroup();

    // 3. Walls & Architectural Barriers (Impenetrable Outer & Inner Colliders)
    this.buildArchitecturalWalls();

    // 4. Lavish Furniture & Props Across All 5 Zones (Neat Layout, Zero Obstruction)
    this.buildOfficeFurnishings();

    // 5. Central Corridor Wall-Mounted To-Do List Board
    this.buildCorridorElements();

    // 6. Refresh static obstacles so Arcade Physics indexes all bodies immediately
    this.obstacles.refresh();

    // 7. Spawn Player in Main Room (Zona 5)
    this.buildPlayer();

    // 8. Spawn NPCs (Bu Rina, Dimas, Pak Hendra)
    this.buildNPCs();

    // 9. Physics Colliders
    this.physics.add.collider(this.player, this.obstacles);
    for (const npc of this.npcs) {
      this.physics.add.collider(this.player, npc.sprite);
    }

    // 10. Camera Follow & Zoom Setup
    this.setupCamera();

    // 11. Controls Setup
    this.cursors = this.input.keyboard!.createCursorKeys();
    this.wasd = this.input.keyboard!.addKeys('W,A,S,D') as Record<
      string,
      Phaser.Input.Keyboard.Key
    >;
    this.keyE = this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.E);

    // 12. Interactive Prompt Box
    this.buildInteractivePrompt();

    // 13. Room Location HUD (Persistent Top-Left Pill + Center-Screen Notification)
    this.buildLocationHUD();

    // 14. Initial Zone Detection (Announces Main Room in Center of screen on spawn!)
    this.updateCurrentZone(true);

    // 15. Listeners
    EventBus.on(GAME_EVENTS.CLOSE_DIALOG, this.handleCloseDialog, this);

    // 16. Notify React UI
    EventBus.emit(GAME_EVENTS.SCENE_READY);
  }

  // =========================================================================
  // CAMERA SETUP & RESIZING
  // =========================================================================

  private setupCamera(): void {
    const cam = this.cameras.main;
    cam.setBounds(0, 0, MAP_W, MAP_H);
    cam.startFollow(this.player, true, 0.08, 0.08);

    // Optimal zoom: proportional character scale & crisp 2D pixel art
    cam.setZoom(1.1);

    // Listen for resize events to keep camera bounds and center HUD properly positioned
    this.scale.on('resize', this.handleResize, this);
  }

  private handleResize(gameSize: Phaser.Structs.Size): void {
    this.cameras.main.setViewport(0, 0, gameSize.width, gameSize.height);
    if (this.centerBannerContainer) {
      this.centerBannerContainer.setPosition(gameSize.width / 2, gameSize.height / 2 - 25);
    }
  }

  // =========================================================================
  // UPDATE LOOP
  // =========================================================================

  update(): void {
    // Dynamic Y-depth sorting for realistic 2.5D perspective
    this.player.setDepth(this.player.y);

    if (this.isPlayerLocked) {
      this.player.setVelocity(0, 0);
      return;
    }

    // Movement calculation
    const speed = PLAYER_SPEED;
    let vx = 0;
    let vy = 0;

    const left = this.wasd.A.isDown || this.cursors.left.isDown;
    const right = this.wasd.D.isDown || this.cursors.right.isDown;
    const up = this.wasd.W.isDown || this.cursors.up.isDown;
    const down = this.wasd.S.isDown || this.cursors.down.isDown;

    if (left) vx = -speed;
    else if (right) vx = speed;
    if (up) vy = -speed;
    else if (down) vy = speed;

    // Normalise diagonal speed
    if (vx !== 0 && vy !== 0) {
      const diagFactor = Math.SQRT1_2;
      vx *= diagFactor;
      vy *= diagFactor;
    }

    this.player.setVelocity(vx, vy);

    // Continuous, blink-free walking animation
    if (vx !== 0 || vy !== 0) {
      let dir: string;
      if (Math.abs(vx) > Math.abs(vy)) {
        dir = vx > 0 ? 'east' : 'west';
      } else {
        dir = vy > 0 ? 'south' : 'north';
      }
      this.lastDirection = dir;
      this.player.play(`char-player-walk-${dir}`, true);
    } else {
      this.player.play(`char-player-idle-${this.lastDirection}`, true);
    }

    // Check room transitions
    this.updateCurrentZone(false);

    // Check nearby interactive objects
    this.checkInteractions();
  }

  // =========================================================================
  // ROOM ZONE DETECTION & CENTER-SCREEN HUD NOTIFICATION
  // =========================================================================

  private buildLocationHUD(): void {
    // A. Persistent Mini Location Pill (Top-Left of Screen, always visible)
    this.locationPillContainer = this.add
      .container(20, 20)
      .setScrollFactor(0)
      .setDepth(9990);

    this.locationPillBg = this.add
      .rectangle(0, 0, 240, 32, 0x141824, 0.9)
      .setOrigin(0, 0)
      .setStrokeStyle(1.5, 0x355c5a);

    this.locationPillText = this.add
      .text(14, 8, '📍 Memuat Ruangan...', {
        fontFamily: 'system-ui, -apple-system, sans-serif',
        fontSize: '12px',
        color: '#e0b65d',
        fontStyle: 'bold',
      })
      .setOrigin(0, 0);

    this.locationPillContainer.add([this.locationPillBg, this.locationPillText]);

    // B. CENTER-SCREEN Cinematic Zone Notification Card
    // "untuk notif per pindahan nya itu tolong benerin kembali dengan menaruh kek di tengah layar gituan lah biar terlihat bagus banget klo diatas itu ketutupann"
    const centerX = this.scale.width / 2;
    const centerY = this.scale.height / 2 - 25;

    this.centerBannerContainer = this.add
      .container(centerX, centerY)
      .setScrollFactor(0)
      .setDepth(9995)
      .setScale(0.85)
      .setAlpha(0);

    // Outer Card Background with subtle glow
    this.centerBannerBg = this.add
      .rectangle(0, 0, 460, 96, 0x0f172a, 0.94)
      .setStrokeStyle(2.5, 0xe0b65d);

    // Inner Top Badge
    this.centerBannerBadgeText = this.add
      .text(0, -26, '🏢 MAIN WORKSPACE', {
        fontFamily: 'monospace',
        fontSize: '11px',
        color: '#e0b65d',
        fontStyle: 'bold',
        letterSpacing: 1.5,
      })
      .setOrigin(0.5);

    // Large Bold Room Title
    this.centerBannerTitleText = this.add
      .text(0, -2, 'Zona 5 · Workstation Utama', {
        fontFamily: 'system-ui, -apple-system, sans-serif',
        fontSize: '20px',
        color: '#ffffff',
        fontStyle: 'bold',
      })
      .setOrigin(0.5);

    // Subtitle Description
    this.centerBannerSubText = this.add
      .text(0, 24, 'Ruang Kerja Karyawan & Kolaborasi Tim', {
        fontFamily: 'system-ui, -apple-system, sans-serif',
        fontSize: '12px',
        color: '#cbd5e1',
      })
      .setOrigin(0.5);

    this.centerBannerContainer.add([
      this.centerBannerBg,
      this.centerBannerBadgeText,
      this.centerBannerTitleText,
      this.centerBannerSubText,
    ]);
  }

  private updateCurrentZone(forceAnnouncement: boolean = false): void {
    const px = this.player.x;
    const py = this.player.y;

    const detected =
      OFFICE_ZONES.find((z) => z.check(px, py)) ||
      OFFICE_ZONES[OFFICE_ZONES.length - 1];

    if (detected.id !== this.currentZoneId || forceAnnouncement) {
      this.currentZoneId = detected.id;

      // Update persistent top-left mini pill
      this.locationPillText.setText(`📍 ${detected.icon} ${detected.name}`);
      this.locationPillText.setColor(detected.textColor);
      const pillWidth = Math.max(230, this.locationPillText.width + 28);
      this.locationPillBg.setSize(pillWidth, 32);
      this.locationPillBg.setStrokeStyle(1.5, detected.borderColor);

      // Trigger CENTER-SCREEN notification card
      this.triggerCenterBanner(detected);

      // Notify React UI
      EventBus.emit(GAME_EVENTS.ZONE_CHANGED, {
        zoneId: detected.id,
        name: detected.name,
      });
    }
  }

  private triggerCenterBanner(zone: OfficeZone): void {
    if (this.centerBannerTween) {
      this.centerBannerTween.stop();
      this.centerBannerTween = null;
    }

    const centerX = this.scale.width / 2;
    const centerY = this.scale.height / 2 - 25;

    this.centerBannerContainer.setPosition(centerX, centerY);
    this.centerBannerBadgeText.setText(`${zone.icon} ${zone.badge}`);
    this.centerBannerTitleText.setText(zone.name);
    this.centerBannerSubText.setText(zone.subtitle);
    this.centerBannerBg.setStrokeStyle(2.5, zone.borderColor);

    const bannerW = Math.max(440, this.centerBannerTitleText.width + 90);
    this.centerBannerBg.setSize(bannerW, 96);

    // Initial state: slightly scaled down and invisible
    this.centerBannerContainer.setScale(0.85).setAlpha(0);

    // Pop-in with smooth scale and fade, hold for 2.2s, then drift up and fade out
    this.centerBannerTween = this.tweens.add({
      targets: this.centerBannerContainer,
      scale: 1.0,
      alpha: 1,
      duration: 280,
      ease: 'Back.easeOut',
      onComplete: () => {
        this.time.delayedCall(2200, () => {
          if (this.centerBannerContainer) {
            this.tweens.add({
              targets: this.centerBannerContainer,
              scale: 1.05,
              alpha: 0,
              duration: 280,
              ease: 'Power2.easeIn',
            });
          }
        });
      },
    });
  }

  // =========================================================================
  // IMPENETRABLE ARCHITECTURAL WALLS & PRECISE DOORWAYS
  // =========================================================================

  private buildArchitecturalWalls(): void {
    // -----------------------------------------------------------------------
    // A. OUTER PERIMETER (Impenetrable outer boundaries)
    // -----------------------------------------------------------------------
    // Top outer wall (seals y: 0..105 across full map width)
    this.addStaticWall(MAP_W / 2, 52, MAP_W, 105);

    // Left outer wall (seals x: 0..105 across full map height)
    this.addStaticWall(52, MAP_H / 2, 105, MAP_H);

    // Right outer wall (seals x: 2595..2752 across full map height)
    this.addStaticWall(2673, MAP_H / 2, 158, MAP_H);

    // -----------------------------------------------------------------------
    // B. BOTTOM OUTER WALL PROFILE (Seals all windows & outer grass completely)
    // -----------------------------------------------------------------------
    // 1. Under Zona 3 (Smoking Room: x: 95..1166, floor ends at y=1230)
    this.addStaticWall(630, 1383, 1071, 306);

    // 2. Entrance Hallway Bottom Boundary (keeps player safely inside entrance)
    this.addStaticWall(1320, 1433, 200, 206);

    // 3. Bottom wall right of entrance (Under corridor window: x: 1420..1890, floor ends at y=1324)
    this.addStaticWall(1655, 1430, 470, 212);

    // 4. Vertical jog step between corridor window and main hall window (at x = 1890)
    this.addStaticWall(1890, 1347, 30, 56);

    // 5. Bottom wall under Zona 5 (Main Workspace: x: 1890..2600, floor ends at y=1370)
    this.addStaticWall(2245, 1453, 710, 166);

    // -----------------------------------------------------------------------
    // C. VERTICAL DIVIDING WALL (Left Rooms vs Corridor at X = 1166)
    //    Tested walk-through clearances:
    //    - Zona 1 Door: y = 315 .. 425 (OPEN gap = 110px)
    //    - Zona 2 Door: y = 720 .. 835 (OPEN gap = 115px)
    //    - Zona 3 Door: y = 1140 .. 1230 (OPEN gap = 90px)
    // -----------------------------------------------------------------------
    // Solid 1: Above Zona 1 Door (y: 100..315)
    this.addStaticWall(1166, 207, 56, 215);

    // Solid 2: Between Zona 1 & Zona 2 Doors (y: 425..720)
    this.addStaticWall(1166, 572, 56, 295);

    // Solid 3: Between Zona 2 & Zona 3 Doors (y: 835..1140)
    this.addStaticWall(1166, 987, 56, 305);

    // -----------------------------------------------------------------------
    // D. HORIZONTAL ROOM DIVIDERS (Left Rooms)
    // -----------------------------------------------------------------------
    // Divider 1: Between Zona 1 (Pantry) & Zona 2 (Meeting Room) at y = 518
    this.addStaticWall(633, 518, 1066, 44);

    // Divider 2: Between Zona 2 (Meeting Room) & Zona 3 (Smoking Area) at y = 970
    this.addStaticWall(633, 970, 1066, 44);

    // -----------------------------------------------------------------------
    // E. ZONA 4 (BOSS ROOM - BU RINA) WALLS & DOORWAY
    //    Doorway gap: x = 2100 .. 2230 (OPEN at y = 518)
    // -----------------------------------------------------------------------
    // Vertical left wall of Boss room (x = 1730, y: 100..518)
    this.addStaticWall(1730, 309, 44, 418);

    // Bottom wall left of door (x: 1730..2100 at y = 518)
    this.addStaticWall(1915, 518, 370, 44);

    // Bottom wall right of door (x: 2230..2600 at y = 518)
    this.addStaticWall(2415, 518, 370, 44);
  }

  private addStaticWall(x: number, y: number, w: number, h: number): void {
    const wall = this.add.rectangle(x, y, w, h, 0x000000, 0);
    this.physics.add.existing(wall, true);
    (wall.body as Phaser.Physics.Arcade.StaticBody).updateFromGameObject();
    this.obstacles.add(wall);
  }

  // =========================================================================
  // LAVISH OFFICE FURNISHINGS & PROPS (100% SOLID DESKS & PROPORTIONAL SIZING)
  // =========================================================================

  private buildOfficeFurnishings(): void {
    // =======================================================================
    // 1. ZONA 1: PANTRY & DAPUR (Dimas - Skenario 2)
    // =======================================================================
    // Kitchen Countertop along top wall (solid full depth)
    this.addSolidProp('fridge', 190, 145, 52, 60);
    this.addSolidProp('kitchen-cabinet', 255, 140, 52, 46);
    this.addSolidProp('counter', 320, 140, 52, 46);
    this.addDecorativeProp('sink', 320, 118);
    this.addSolidProp('counter', 385, 140, 52, 46);
    this.addDecorativeProp('stove', 385, 118);
    this.addSolidProp('counter', 450, 140, 52, 46);
    this.addDecorativeProp('espresso-machine', 450, 114);
    this.addSolidProp('counter', 515, 140, 52, 46);
    this.addDecorativeProp('pastry-case', 515, 114);

    // Kitchen Island Bar
    this.addSolidProp('counter', 680, 150, 52, 46);
    this.addSolidProp('counter', 745, 150, 52, 46);
    this.addDecorativeProp('bar-stool', 680, 190);
    this.addDecorativeProp('bar-stool', 745, 190);

    // Cafe Tables & Seating (Break Area)
    this.addDecorativeProp('rug', 340, 320);
    this.addSolidProp('cafe-table', 340, 315, 44, 40);
    this.addDecorativeProp('cafe-chair', 290, 315);
    this.addDecorativeProp('cafe-chair', 390, 315);

    this.addDecorativeProp('rug', 640, 320);
    this.addSolidProp('cafe-table', 640, 315, 44, 40);
    this.addDecorativeProp('cafe-chair', 590, 315);
    this.addDecorativeProp('cafe-chair', 690, 315);

    // Refreshment & Greenery (tucked against perimeter)
    this.addSolidProp('water-cooler', 900, 190, 40, 40);
    this.addSolidProp('plant-large', 160, 250, 40, 40);
    this.addSolidProp('plant-large', 160, 440, 40, 40);
    this.addSolidProp('plant-large', 1060, 160, 40, 40);

    // Wall Accents
    this.addDecorativeProp('wall-clock', 450, 95);
    this.addDecorativeProp('wall-art', 640, 95);
    this.addDecorativeProp('wall-art', 840, 95);

    // =======================================================================
    // 2. ZONA 2: MEETING ROOM (Pak Hendra / Klien - Skenario 3)
    // =======================================================================
    // Boardroom Carpet
    this.addDecorativeProp('rug', 570, 720);

    // Impenetrable Boardroom Table (Solid 4 Desks Cluster)
    this.addSolidDesk(450, 720);
    this.addSolidDesk(525, 720);
    this.addSolidDesk(600, 720);
    this.addSolidDesk(675, 720);

    // Laptops on Meeting Table
    this.addDecorativeProp('computer', 450, 695);
    this.addDecorativeProp('computer', 600, 695);
    this.addDecorativeProp('plant-small', 525, 700);

    // Executive Meeting Chairs around table
    this.addDecorativeProp('office-chair', 450, 655);
    this.addDecorativeProp('office-chair', 525, 655);
    this.addDecorativeProp('office-chair', 600, 655);
    this.addDecorativeProp('office-chair', 675, 655);
    this.addDecorativeProp('office-chair', 450, 785);
    this.addDecorativeProp('office-chair', 525, 785);
    this.addDecorativeProp('office-chair', 600, 785);
    this.addDecorativeProp('office-chair', 675, 785);
    this.addDecorativeProp('office-chair', 375, 720); // Head of table

    // Credenza & Storage against top wall
    this.addSolidProp('bookcase', 250, 565, 60, 46);
    this.addSolidProp('bookcase', 315, 565, 60, 46);
    this.addSolidProp('filing-cabinet', 860, 565, 46, 46);
    this.addSolidProp('filing-cabinet', 915, 565, 46, 46);
    this.addSolidProp('water-cooler', 1040, 615, 40, 40);

    // Plants & Illumination (tucked against corners)
    this.addSolidProp('plant-large', 160, 580, 40, 40);
    this.addSolidProp('plant-large', 160, 890, 40, 40);
    this.addSolidProp('plant-large', 1050, 890, 40, 40);
    this.addDecorativeProp('floor-lamp', 1050, 570);

    // Presentation Wall Art
    this.addDecorativeProp('wall-art', 525, 520);
    this.addDecorativeProp('wall-art', 675, 520);
    this.addDecorativeProp('wall-clock', 600, 520);

    // =======================================================================
    // 3. ZONA 3: SMOKING & CREATIVE LOUNGE
    // =======================================================================
    // Primary Lounge Cluster
    this.addDecorativeProp('rug', 350, 1130);
    this.addSolidProp('sofa', 350, 1105, 88, 46);
    this.addSolidProp('coffee-table', 350, 1155, 50, 32);
    this.addSolidProp('armchair', 230, 1125, 46, 40);
    this.addSolidProp('armchair', 470, 1125, 46, 40);

    // Secondary Lounge Cluster
    this.addDecorativeProp('rug', 720, 1130);
    this.addSolidProp('sofa', 720, 1105, 88, 46);
    this.addSolidProp('coffee-table', 720, 1155, 50, 32);
    this.addSolidProp('armchair', 600, 1125, 46, 40);
    this.addSolidProp('armchair', 840, 1125, 46, 40);

    // Lounge Amenities
    this.addSolidProp('water-cooler', 1040, 1050, 40, 40);
    this.addDecorativeProp('floor-lamp', 160, 1125);
    this.addDecorativeProp('floor-lamp', 950, 1050);
    this.addSolidProp('plant-large', 160, 1030, 40, 40);
    this.addSolidProp('plant-large', 160, 1190, 40, 40);
    this.addSolidProp('plant-large', 950, 1190, 40, 40);
    this.addDecorativeProp('wall-art', 350, 975);
    this.addDecorativeProp('wall-art', 720, 975);

    // =======================================================================
    // 4. ZONA 4: RUANGAN BOS (Bu Rina - Skenario 1)
    // =======================================================================
    // Luxury Executive Carpet
    this.addDecorativeProp('rug', 2150, 245);

    // Impenetrable Executive Desk Suite
    this.addSolidDesk(2150, 230);
    this.addDecorativeProp('computer', 2150, 206);
    this.addDecorativeProp('plant-small', 2115, 210);
    this.addDecorativeProp('office-chair', 2150, 172); // Bu Rina's Chair
    this.addSolidProp('armchair', 2075, 295, 46, 40);  // Guest Chair 1
    this.addSolidProp('armchair', 2225, 295, 46, 40);  // Guest Chair 2

    // Executive Library Wall
    this.addSolidProp('bookcase', 1850, 140, 60, 46);
    this.addSolidProp('bookcase', 1915, 140, 60, 46);
    this.addSolidProp('bookcase', 2385, 140, 60, 46);
    this.addSolidProp('bookcase', 2450, 140, 60, 46);

    // Executive Archives & Floor Lamp
    this.addSolidProp('filing-cabinet', 1780, 215, 46, 46);
    this.addSolidProp('filing-cabinet', 1780, 275, 46, 46);
    this.addDecorativeProp('floor-lamp', 2530, 145);

    // Private Executive Discussion Lounge
    this.addDecorativeProp('rug', 1920, 385);
    this.addSolidProp('coffee-table', 1920, 385, 50, 32);
    this.addSolidProp('armchair', 1855, 385, 46, 40);
    this.addSolidProp('armchair', 1985, 385, 46, 40);

    // Greenery & Accents (tucked against corners)
    this.addSolidProp('plant-large', 1780, 440, 40, 40);
    this.addSolidProp('plant-large', 2550, 235, 40, 40);
    this.addSolidProp('plant-large', 2550, 440, 40, 40);
    this.addDecorativeProp('wall-art', 2030, 100);
    this.addDecorativeProp('wall-art', 2270, 100);
    this.addDecorativeProp('wall-clock', 2150, 100);

    // =======================================================================
    // 5. ZONA 5: MAIN OPEN-PLAN WORKSPACE (Ruang Kerja Karyawan)
    // =======================================================================
    // Row 1 (Workstations facing North)
    this.createWorkstation(1660, 700, 'north', false);
    this.createWorkstation(1820, 700, 'north', false);
    this.createWorkstation(1980, 700, 'north', false);
    this.createWorkstation(2140, 700, 'north', false);

    // Row 2 (Workstations facing South - PLAYER WORKSTATION at 1660, 850)
    this.createWorkstation(1660, 850, 'south', true); // Player Workstation ("MEJA KAMU")
    this.createWorkstation(1820, 850, 'south', false);
    this.createWorkstation(1980, 850, 'south', false);
    this.createWorkstation(2140, 850, 'south', false);

    // Row 3 (Workstations facing South)
    this.createWorkstation(1660, 1030, 'south', false);
    this.createWorkstation(1820, 1030, 'south', false);
    this.createWorkstation(1980, 1030, 'south', false);
    this.createWorkstation(2140, 1030, 'south', false);

    // Operations, Printing & Utility Area (Along Right Perimeter)
    this.addSolidProp('printer', 2550, 680, 48, 44);
    this.addSolidProp('printer', 2550, 755, 48, 44);
    this.addSolidProp('filing-cabinet', 2550, 830, 46, 46);
    this.addSolidProp('filing-cabinet', 2550, 895, 46, 46);
    this.addSolidProp('filing-cabinet', 2550, 960, 46, 46);
    this.addSolidProp('water-cooler', 2550, 1050, 40, 40);
    this.addSolidProp('parcel-stack', 2550, 1150, 44, 40);
    this.addSolidProp('parcel-stack', 2550, 1215, 44, 40);
    this.addSolidProp('toolbox', 2550, 1280, 36, 32);

    // Main Hall Greenery (Tucked neatly against solid borders — NO PLANTS IN AISLES!)
    this.addSolidProp('plant-large', 1470, 580, 40, 40); // Beside Boss room outer corner
    this.addSolidProp('plant-large', 1470, 1270, 40, 40); // Lower left corner of main room
    this.addSolidProp('plant-large', 2320, 580, 40, 40);  // Below Boss room divider
    this.addSolidProp('plant-large', 2550, 600, 40, 40);  // Right wall top
    this.addSolidProp('plant-large', 2550, 1340, 40, 40); // Right wall bottom
    this.addDecorativeProp('floor-lamp', 2320, 880);
  }

  /**
   * Helper: Add a 100% Solid Desk (Cannot be penetrated from any angle!)
   */
  private addSolidDesk(x: number, y: number): void {
    // Render visual desk with proper depth sorting at base
    this.add
      .image(x, y, 'prop-desk')
      .setScale(PROP_SCALE)
      .setDepth(y + 16);

    // Impenetrable physics body covering the desk width & depth
    const col = this.add.rectangle(x, y + 4, 84, 48, 0x000000, 0);
    this.physics.add.existing(col, true);
    (col.body as Phaser.Physics.Arcade.StaticBody).updateFromGameObject();
    this.obstacles.add(col);
  }

  /**
   * Helper: Build complete employee workstation (Solid Desk + PC + Chair + Tag)
   */
  private createWorkstation(
    x: number,
    y: number,
    facing: 'north' | 'south',
    isPlayer: boolean
  ): void {
    // 100% Solid Desk (Cannot be penetrated!)
    this.addSolidDesk(x, y);

    // Computer Monitor
    const pcY = facing === 'south' ? y - 22 : y + 12;
    this.addDecorativeProp('computer', x, pcY);

    // Office Chair
    const chairY = facing === 'south' ? y + 42 : y - 42;
    this.addDecorativeProp('office-chair', x, chairY);

    // Player Desk Accent
    if (isPlayer) {
      this.addDecorativeProp('plant-small', x - 20, pcY + 4);
      // Desk tag
      this.add
        .text(x, y - 38, 'MEJA KAMU', {
          fontFamily: 'monospace',
          fontSize: '9px',
          color: '#e0b65d',
          backgroundColor: '#242a38',
          padding: { x: 4, y: 2 },
        })
        .setOrigin(0.5)
        .setDepth(y + 22);
    }
  }

  /**
   * Add a solid prop: visual sprite has depth=y+12, with solid collision body
   */
  private addSolidProp(
    name: string,
    x: number,
    y: number,
    bodyW: number,
    bodyH: number
  ): Phaser.GameObjects.Image {
    const img = this.add
      .image(x, y, `prop-${name}`)
      .setScale(PROP_SCALE)
      .setDepth(y + 12);

    const col = this.add.rectangle(x, y, bodyW, bodyH, 0x000000, 0);
    this.physics.add.existing(col, true);
    (col.body as Phaser.Physics.Arcade.StaticBody).updateFromGameObject();
    this.obstacles.add(col);

    return img;
  }

  /**
   * Add a purely decorative prop (walkable without blocking, e.g. rugs, art, chairs)
   */
  private addDecorativeProp(
    name: string,
    x: number,
    y: number
  ): Phaser.GameObjects.Image {
    return this.add
      .image(x, y, `prop-${name}`)
      .setScale(PROP_SCALE)
      .setDepth(name === 'rug' ? 1 : y);
  }

  // =========================================================================
  // CORRIDOR & WALL-MOUNTED TO-DO LIST BOARD (PAPAN AGENDA DINDING ATAS)
  // =========================================================================

  private buildCorridorElements(): void {
    // "untuk bagian todolist itu tolong jangan di taroh di tengah-tengah gitu jadi tolong benerin agar to do list nya itu lebih keatas dan buat semacam papan gituann dan itu ada barriernya"
    // Mounted against the top corridor wall (x = 1450, y = 140)

    // 1. Board Outer Wooden Frame
    this.add
      .rectangle(TODO_POS.x, TODO_POS.y, 134, 70, 0x533e3b)
      .setDepth(TODO_POS.y + 1);

    // 2. Cork/Chalkboard Surface
    this.add
      .rectangle(TODO_POS.x, TODO_POS.y, 126, 62, 0x242a38)
      .setDepth(TODO_POS.y + 2);

    // 3. Header Title Badge
    this.add
      .rectangle(TODO_POS.x, TODO_POS.y - 18, 116, 16, 0x355c5a)
      .setStrokeStyle(1, 0xe0b65d)
      .setDepth(TODO_POS.y + 3);

    this.add
      .text(TODO_POS.x, TODO_POS.y - 18, '📋 PAPAN AGENDA KERJA', {
        fontFamily: 'monospace',
        fontSize: '8px',
        color: '#fff9eb',
        fontStyle: 'bold',
      })
      .setOrigin(0.5)
      .setDepth(TODO_POS.y + 4);

    // 4. Pinned Task Notes on Board
    this.add
      .text(
        TODO_POS.x,
        TODO_POS.y + 8,
        '• Skenario 1: Bu Rina (Bos)\n• Skenario 2: Dimas (Pantry)\n• Skenario 3: Pak Hendra',
        {
          fontFamily: 'system-ui, sans-serif',
          fontSize: '8px',
          color: '#e2e8f0',
          lineSpacing: 2,
        }
      )
      .setOrigin(0.5)
      .setDepth(TODO_POS.y + 4);

    // 5. Impenetrable Physics Barrier for the Board (Player cannot walk through wall/board!)
    const boardCol = this.add.rectangle(TODO_POS.x, TODO_POS.y, 136, 64, 0x000000, 0);
    this.physics.add.existing(boardCol, true);
    (boardCol.body as Phaser.Physics.Arcade.StaticBody).updateFromGameObject();
    this.obstacles.add(boardCol);

    // 6. Central Corridor Decorative Elements
    this.addDecorativeProp('rug', 1375, 1260); // Entrance Welcome Mat
    this.addSolidProp('plant-large', 1230, 240, 40, 40); // Above pantry door, flush to wall
    this.addSolidProp('plant-large', 1230, 580, 40, 40); // Between pantry & meeting door
    this.addSolidProp('plant-large', 1230, 990, 40, 40); // Between meeting & smoking door
    this.addDecorativeProp('floor-lamp', 1600, 180);
  }

  // =========================================================================
  // PLAYER CREATION
  // =========================================================================

  private buildPlayer(): void {
    this.player = this.physics.add.sprite(SPAWN.x, SPAWN.y, 'char-player');
    this.player.setScale(CHAR_SCALE);

    // Proportional, tight physics collision body at player's feet
    // Perfectly tuned for smooth navigation through doors and aisles
    (this.player.body as Phaser.Physics.Arcade.Body)
      .setSize(20, 16)
      .setOffset(22, 48);

    this.player.setCollideWorldBounds(true);
    this.player.play('char-player-idle-north');
    this.player.setDepth(SPAWN.y);
  }

  // =========================================================================
  // NPC CREATION
  // =========================================================================

  private buildNPCs(): void {
    // 1. Bu Rina — Zona 4 (Ruangan Bos)
    this.spawnNpc(
      'rina',
      'Bu Rina (Atasan)',
      'Head of Department',
      'skenario-1',
      'char-rina',
      NPC_POSITIONS.rina
    );

    // 2. Dimas — Zona 1 (Pantry & Dapur)
    this.spawnNpc(
      'dimas',
      'Dimas (Rekan Senior)',
      'Senior Engineer',
      'skenario-2',
      'char-dimas',
      NPC_POSITIONS.dimas
    );

    // 3. Pak Hendra — Zona 2 (Meeting Room)
    this.spawnNpc(
      'klien',
      'Pak Hendra (Klien)',
      'Enterprise Client Partner',
      'skenario-3',
      'char-klien',
      NPC_POSITIONS.klien
    );
  }

  private spawnNpc(
    id: string,
    name: string,
    role: string,
    scenarioId: string,
    spriteKey: string,
    pos: { x: number; y: number }
  ): void {
    const sprite = this.physics.add
      .sprite(pos.x, pos.y, spriteKey)
      .setScale(CHAR_SCALE)
      .setImmovable(true);

    // Solid collision body for NPC
    (sprite.body as Phaser.Physics.Arcade.Body)
      .setSize(22, 18)
      .setOffset(21, 46);

    sprite.play(`${spriteKey}-idle-south`);
    sprite.setDepth(pos.y);

    this.npcs.push({ id, name, role, sprite, scenarioId });
  }

  // =========================================================================
  // INTERACTION PROMPT & LOGIC
  // =========================================================================

  private buildInteractivePrompt(): void {
    this.promptContainer = this.add.container(0, 0).setDepth(9999).setVisible(false);

    this.promptBg = this.add
      .rectangle(0, 0, 210, 30, 0x141824, 0.95)
      .setStrokeStyle(1.5, 0xe0b65d);

    this.promptText = this.add
      .text(0, 0, '', {
        fontFamily: 'monospace',
        fontSize: '11px',
        color: '#ffffff',
        fontStyle: 'bold',
      })
      .setOrigin(0.5);

    this.promptContainer.add([this.promptBg, this.promptText]);
  }

  private checkInteractions(): void {
    // 1. Proximity to Wall-Mounted To-Do List Board
    const distToTodo = Phaser.Math.Distance.Between(
      this.player.x,
      this.player.y,
      TODO_POS.x,
      TODO_POS.y + 40
    );

    if (distToTodo < TODO_INTERACT_DIST) {
      this.isNearTodoList = true;
      this.showPrompt(TODO_POS.x, TODO_POS.y + 60, 'Tekan [E] Buka Papan Agenda');

      if (Phaser.Input.Keyboard.JustDown(this.keyE)) {
        this.lockPlayer();
        EventBus.emit(GAME_EVENTS.OPEN_TODO_LIST);
      }
      return;
    }

    this.isNearTodoList = false;

    // 2. Proximity to NPCs
    this.activeNpcNear = null;
    for (const npc of this.npcs) {
      const dist = Phaser.Math.Distance.Between(
        this.player.x,
        this.player.y,
        npc.sprite.x,
        npc.sprite.y
      );

      if (dist < NPC_INTERACT_DIST) {
        this.activeNpcNear = npc;
        break;
      }
    }

    if (this.activeNpcNear) {
      this.showPrompt(
        this.activeNpcNear.sprite.x,
        this.activeNpcNear.sprite.y - 48,
        `Tekan [E] Bicara (${this.activeNpcNear.name})`
      );

      if (Phaser.Input.Keyboard.JustDown(this.keyE)) {
        this.lockPlayer();
        EventBus.emit(GAME_EVENTS.OPEN_DIALOG, {
          scenarioId: this.activeNpcNear.scenarioId,
          npcName: this.activeNpcNear.name,
        });
      }
    } else {
      this.promptContainer.setVisible(false);
    }
  }

  private showPrompt(x: number, y: number, text: string): void {
    this.promptText.setText(text);
    const textWidth = this.promptText.width;
    this.promptBg.setSize(textWidth + 24, 30);
    this.promptContainer.setPosition(x, y).setVisible(true);
  }

  // =========================================================================
  // PLAYER CONTROLS LOCK & UNLOCK
  // =========================================================================

  private lockPlayer(): void {
    this.isPlayerLocked = true;
    this.player.setVelocity(0, 0);
    this.promptContainer.setVisible(false);
    this.input.keyboard?.disableGlobalCapture();
  }

  private handleCloseDialog = (): void => {
    this.isPlayerLocked = false;
    this.input.keyboard?.enableGlobalCapture();
  };

  // =========================================================================
  // CLEANUP
  // =========================================================================

  shutdown(): void {
    this.scale.off('resize', this.handleResize, this);
    EventBus.off(GAME_EVENTS.CLOSE_DIALOG, this.handleCloseDialog, this);
  }

  destroy(): void {
    this.shutdown();
  }
}
