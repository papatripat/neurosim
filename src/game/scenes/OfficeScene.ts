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
const PLAYER_SPEED = 150;
const NPC_INTERACT_DIST = 65;
const TODO_INTERACT_DIST = 55;

// Proportional scales for 64×64 sprites onto 2752×1536 map
const CHAR_SCALE = 1.75;
const PROP_SCALE = 1.75;

// Default Spawn: In Main Room (Zona 5) near player workstation facing desk!
// "semisal awal spawn dia tuh fokusnya ke main room"
const SPAWN = { x: 1680, y: 920 };

// To-Do List board in central corridor
const TODO_POS = { x: 1400, y: 460 };

// NPC spawn positions per official specification
const NPC_POSITIONS = {
  rina: { x: 2150, y: 260 },   // Zona 4 — Ruangan Bos (Skenario 1)
  dimas: { x: 580, y: 280 },   // Zona 1 — Pantry & Dapur (Skenario 2)
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
    name: 'Koridor Tengah & Pintu Masuk',
    subtitle: 'Pusat Navigasi & Papan To-Do List',
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

  private zoneBannerContainer!: Phaser.GameObjects.Container;
  private zoneBannerBadgeText!: Phaser.GameObjects.Text;
  private zoneBannerTitleText!: Phaser.GameObjects.Text;
  private zoneBannerSubText!: Phaser.GameObjects.Text;
  private zoneBannerBg!: Phaser.GameObjects.Rectangle;
  private zoneBannerTween: Phaser.Tweens.Tween | null = null;

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

    // 5. Central Corridor Signage (Clean To-Do List Board)
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

    // 13. Room Location HUD (Persistent Pill + Animated Zone Banner)
    this.buildLocationHUD();

    // 14. Initial Zone Detection (Announces Main Room immediately on spawn!)
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

    // Optimal zoom for crisp 2D pixel art and immersive viewport
    cam.setZoom(1.1);

    // Listen for resize events to keep camera bounds and HUD centered
    this.scale.on('resize', this.handleResize, this);
  }

  private handleResize(gameSize: Phaser.Structs.Size): void {
    this.cameras.main.setViewport(0, 0, gameSize.width, gameSize.height);
    if (this.zoneBannerContainer) {
      this.zoneBannerContainer.setX(gameSize.width / 2);
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
  // ROOM ZONE DETECTION & HUD BANNER
  // =========================================================================

  private buildLocationHUD(): void {
    // A. Persistent Mini Location Pill (Top-Left of Screen)
    this.locationPillContainer = this.add
      .container(20, 20)
      .setScrollFactor(0)
      .setDepth(9990);

    this.locationPillBg = this.add
      .rectangle(0, 0, 240, 32, 0x1a202c, 0.88)
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

    // B. Animated Room Announcement Banner (Top-Center of Screen)
    const centerX = this.scale.width / 2;
    this.zoneBannerContainer = this.add
      .container(centerX, -80)
      .setScrollFactor(0)
      .setDepth(9995)
      .setAlpha(0);

    this.zoneBannerBg = this.add
      .rectangle(0, 0, 420, 68, 0x141824, 0.96)
      .setStrokeStyle(2, 0xe0b65d);

    this.zoneBannerBadgeText = this.add
      .text(0, -18, 'LOCATION', {
        fontFamily: 'monospace',
        fontSize: '10px',
        color: '#e0b65d',
        fontStyle: 'bold',
        letterSpacing: 1.5,
      })
      .setOrigin(0.5);

    this.zoneBannerTitleText = this.add
      .text(0, 0, 'Zona 5 · Workstation Utama', {
        fontFamily: 'system-ui, -apple-system, sans-serif',
        fontSize: '15px',
        color: '#ffffff',
        fontStyle: 'bold',
      })
      .setOrigin(0.5);

    this.zoneBannerSubText = this.add
      .text(0, 18, 'Ruang Kerja Karyawan & Kolaborasi Tim', {
        fontFamily: 'system-ui, -apple-system, sans-serif',
        fontSize: '11px',
        color: '#a7b7bb',
      })
      .setOrigin(0.5);

    this.zoneBannerContainer.add([
      this.zoneBannerBg,
      this.zoneBannerBadgeText,
      this.zoneBannerTitleText,
      this.zoneBannerSubText,
    ]);
  }

  private updateCurrentZone(forceAnnouncement: boolean = false): void {
    const px = this.player.x;
    const py = this.player.y;

    const detected = OFFICE_ZONES.find((z) => z.check(px, py)) || OFFICE_ZONES[OFFICE_ZONES.length - 1];

    if (detected.id !== this.currentZoneId || forceAnnouncement) {
      this.currentZoneId = detected.id;

      // Update persistent top-left mini pill
      this.locationPillText.setText(`📍 ${detected.icon} ${detected.name}`);
      this.locationPillText.setColor(detected.textColor);
      const pillWidth = Math.max(220, this.locationPillText.width + 28);
      this.locationPillBg.setSize(pillWidth, 32);
      this.locationPillBg.setStrokeStyle(1.5, detected.borderColor);

      // Trigger animated room announcement banner
      this.triggerZoneBanner(detected);

      // Notify React UI
      EventBus.emit(GAME_EVENTS.ZONE_CHANGED, {
        zoneId: detected.id,
        name: detected.name,
      });
    }
  }

  private triggerZoneBanner(zone: OfficeZone): void {
    if (this.zoneBannerTween) {
      this.zoneBannerTween.stop();
      this.zoneBannerTween = null;
    }

    const centerX = this.scale.width / 2;
    this.zoneBannerContainer.setX(centerX);
    this.zoneBannerBadgeText.setText(`${zone.icon} ${zone.badge}`);
    this.zoneBannerTitleText.setText(zone.name);
    this.zoneBannerSubText.setText(zone.subtitle);
    this.zoneBannerBg.setStrokeStyle(2, zone.borderColor);

    const bannerW = Math.max(380, this.zoneBannerTitleText.width + 80);
    this.zoneBannerBg.setSize(bannerW, 68);

    // Slide down smoothly, hold for 2.6s, then slide back up
    this.zoneBannerContainer.setY(-70).setAlpha(0);

    this.zoneBannerTween = this.tweens.add({
      targets: this.zoneBannerContainer,
      y: 42,
      alpha: 1,
      duration: 350,
      ease: 'Back.easeOut',
      onComplete: () => {
        this.time.delayedCall(2500, () => {
          if (this.zoneBannerContainer) {
            this.tweens.add({
              targets: this.zoneBannerContainer,
              y: -70,
              alpha: 0,
              duration: 350,
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
    // Seals y from 1230 down to 1536 (width=1071, center X=630, center Y=1383, height=306)
    this.addStaticWall(630, 1383, 1071, 306);

    // 2. Entrance Hallway Bottom Boundary (keeps player safely inside entrance)
    // Seals y from 1330 down to 1536 across entrance (x: 1220..1420)
    this.addStaticWall(1320, 1433, 200, 206);

    // 3. Bottom wall right of entrance (Under corridor window: x: 1420..1890, floor ends at y=1324)
    // Seals y from 1324 down to 1536 (width=470, center X=1655, center Y=1430, height=212)
    this.addStaticWall(1655, 1430, 470, 212);

    // 4. Vertical jog step between corridor window and main hall window (at x = 1890)
    this.addStaticWall(1890, 1347, 30, 56);

    // 5. Bottom wall under Zona 5 (Main Workspace: x: 1890..2600, floor ends at y=1370)
    // Seals y from 1370 down to 1536 (width=710, center X=2245, center Y=1453, height=166)
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
  // LAVISH OFFICE FURNISHINGS & PROPS (SOLID DESKS - NO PENETRATION)
  // =========================================================================

  private buildOfficeFurnishings(): void {
    // =======================================================================
    // 1. ZONA 1: PANTRY & DAPUR (Dimas - Skenario 2)
    // =======================================================================
    // Kitchen Countertop along top wall (solid full depth)
    this.addSolidProp('fridge', 190, 150, 56, 70);
    this.addSolidProp('kitchen-cabinet', 260, 145, 56, 50);
    this.addSolidProp('counter', 330, 145, 56, 50);
    this.addDecorativeProp('sink', 330, 120);
    this.addSolidProp('counter', 400, 145, 56, 50);
    this.addDecorativeProp('stove', 400, 120);
    this.addSolidProp('counter', 470, 145, 56, 50);
    this.addDecorativeProp('espresso-machine', 470, 115);
    this.addSolidProp('counter', 540, 145, 56, 50);
    this.addDecorativeProp('pastry-case', 540, 115);

    // Kitchen Island Bar
    this.addSolidProp('counter', 720, 155, 56, 50);
    this.addSolidProp('counter', 790, 155, 56, 50);
    this.addDecorativeProp('bar-stool', 720, 200);
    this.addDecorativeProp('bar-stool', 790, 200);

    // Cafe Tables & Seating (Break Area)
    this.addDecorativeProp('rug', 340, 330);
    this.addSolidProp('cafe-table', 340, 320, 48, 44);
    this.addDecorativeProp('cafe-chair', 285, 320);
    this.addDecorativeProp('cafe-chair', 395, 320);

    this.addDecorativeProp('rug', 650, 330);
    this.addSolidProp('cafe-table', 650, 320, 48, 44);
    this.addDecorativeProp('cafe-chair', 595, 320);
    this.addDecorativeProp('cafe-chair', 705, 320);

    // Refreshment & Greenery (tucked neatly against perimeter)
    this.addSolidProp('water-cooler', 920, 200, 44, 44);
    this.addSolidProp('plant-large', 160, 250, 44, 44);
    this.addSolidProp('plant-large', 160, 440, 44, 44);
    this.addSolidProp('plant-large', 1080, 160, 44, 44);

    // Wall Accents
    this.addDecorativeProp('wall-clock', 470, 95);
    this.addDecorativeProp('wall-art', 640, 95);
    this.addDecorativeProp('wall-art', 850, 95);

    // =======================================================================
    // 2. ZONA 2: MEETING ROOM (Pak Hendra / Klien - Skenario 3)
    // =======================================================================
    // Boardroom Carpet
    this.addDecorativeProp('rug', 570, 720);

    // Massive Impenetrable Boardroom Table (Solid 4 Desks Cluster)
    this.addSolidDesk(450, 720);
    this.addSolidDesk(530, 720);
    this.addSolidDesk(610, 720);
    this.addSolidDesk(690, 720);

    // Laptops on Meeting Table
    this.addDecorativeProp('computer', 450, 695);
    this.addDecorativeProp('computer', 610, 695);
    this.addDecorativeProp('plant-small', 530, 700);

    // Executive Meeting Chairs around table
    this.addDecorativeProp('office-chair', 450, 650);
    this.addDecorativeProp('office-chair', 530, 650);
    this.addDecorativeProp('office-chair', 610, 650);
    this.addDecorativeProp('office-chair', 690, 650);
    this.addDecorativeProp('office-chair', 450, 790);
    this.addDecorativeProp('office-chair', 530, 790);
    this.addDecorativeProp('office-chair', 610, 790);
    this.addDecorativeProp('office-chair', 690, 790);
    this.addDecorativeProp('office-chair', 370, 720); // Head of table

    // Credenza & Storage against top wall
    this.addSolidProp('bookcase', 250, 570, 68, 50);
    this.addSolidProp('bookcase', 320, 570, 68, 50);
    this.addSolidProp('filing-cabinet', 860, 570, 50, 50);
    this.addSolidProp('filing-cabinet', 920, 570, 50, 50);
    this.addSolidProp('water-cooler', 1040, 620, 44, 44);

    // Plants & Illumination (tucked against corners)
    this.addSolidProp('plant-large', 160, 580, 44, 44);
    this.addSolidProp('plant-large', 160, 890, 44, 44);
    this.addSolidProp('plant-large', 1060, 890, 44, 44);
    this.addDecorativeProp('floor-lamp', 1060, 570);

    // Presentation Wall Art
    this.addDecorativeProp('wall-art', 530, 520);
    this.addDecorativeProp('wall-art', 690, 520);
    this.addDecorativeProp('wall-clock', 610, 520);

    // =======================================================================
    // 3. ZONA 3: SMOKING & CREATIVE LOUNGE
    // =======================================================================
    // Primary Lounge Cluster
    this.addDecorativeProp('rug', 350, 1140);
    this.addSolidProp('sofa', 350, 1110, 96, 50);
    this.addSolidProp('coffee-table', 350, 1165, 56, 36);
    this.addSolidProp('armchair', 220, 1130, 50, 44);
    this.addSolidProp('armchair', 480, 1130, 50, 44);

    // Secondary Lounge Cluster
    this.addDecorativeProp('rug', 720, 1140);
    this.addSolidProp('sofa', 720, 1110, 96, 50);
    this.addSolidProp('coffee-table', 720, 1165, 56, 36);
    this.addSolidProp('armchair', 590, 1130, 50, 44);
    this.addSolidProp('armchair', 850, 1130, 50, 44);

    // Lounge Amenities
    this.addSolidProp('water-cooler', 1040, 1050, 44, 44);
    this.addDecorativeProp('floor-lamp', 160, 1130);
    this.addDecorativeProp('floor-lamp', 950, 1050);
    this.addSolidProp('plant-large', 160, 1030, 44, 44);
    this.addSolidProp('plant-large', 160, 1190, 44, 44);
    this.addSolidProp('plant-large', 950, 1190, 44, 44);
    this.addDecorativeProp('wall-art', 350, 975);
    this.addDecorativeProp('wall-art', 720, 975);

    // =======================================================================
    // 4. ZONA 4: RUANGAN BOS (Bu Rina - Skenario 1)
    // =======================================================================
    // Luxury Executive Carpet
    this.addDecorativeProp('rug', 2150, 250);

    // Impenetrable Executive Desk Suite
    this.addSolidDesk(2150, 235);
    this.addDecorativeProp('computer', 2150, 210);
    this.addDecorativeProp('plant-small', 2110, 215);
    this.addDecorativeProp('office-chair', 2150, 175); // Bu Rina's Chair
    this.addSolidProp('armchair', 2070, 310, 50, 44); // Guest Chair 1
    this.addSolidProp('armchair', 2230, 310, 50, 44); // Guest Chair 2

    // Executive Library Wall
    this.addSolidProp('bookcase', 1850, 145, 68, 50);
    this.addSolidProp('bookcase', 1920, 145, 68, 50);
    this.addSolidProp('bookcase', 2380, 145, 68, 50);
    this.addSolidProp('bookcase', 2450, 145, 68, 50);

    // Executive Archives & Floor Lamp
    this.addSolidProp('filing-cabinet', 1780, 220, 50, 50);
    this.addSolidProp('filing-cabinet', 1780, 280, 50, 50);
    this.addDecorativeProp('floor-lamp', 2530, 150);

    // Private Executive Discussion Lounge
    this.addDecorativeProp('rug', 1920, 390);
    this.addSolidProp('coffee-table', 1920, 390, 56, 36);
    this.addSolidProp('armchair', 1850, 390, 50, 44);
    this.addSolidProp('armchair', 1990, 390, 50, 44);

    // Greenery & Accents (tucked against corners)
    this.addSolidProp('plant-large', 1780, 440, 44, 44);
    this.addSolidProp('plant-large', 2550, 240, 44, 44);
    this.addSolidProp('plant-large', 2550, 440, 44, 44);
    this.addDecorativeProp('wall-art', 2030, 100);
    this.addDecorativeProp('wall-art', 2270, 100);
    this.addDecorativeProp('wall-clock', 2150, 100);

    // =======================================================================
    // 5. ZONA 5: MAIN OPEN-PLAN WORKSPACE (Ruang Kerja Karyawan)
    // =======================================================================
    // Row 1 (Workstations facing North)
    this.createWorkstation(1680, 720, 'north', false);
    this.createWorkstation(1830, 720, 'north', false);
    this.createWorkstation(1980, 720, 'north', false);
    this.createWorkstation(2130, 720, 'north', false);

    // Row 2 (Workstations facing South - PLAYER WORKSTATION at 1680, 850)
    this.createWorkstation(1680, 850, 'south', true); // Player Workstation ("MEJA KAMU")
    this.createWorkstation(1830, 850, 'south', false);
    this.createWorkstation(1980, 850, 'south', false);
    this.createWorkstation(2130, 850, 'south', false);

    // Row 3 (Workstations facing South)
    this.createWorkstation(1680, 1070, 'south', false);
    this.createWorkstation(1830, 1070, 'south', false);
    this.createWorkstation(1980, 1070, 'south', false);
    this.createWorkstation(2130, 1070, 'south', false);

    // Operations, Printing & Utility Area (Along Right Perimeter)
    this.addSolidProp('printer', 2550, 680, 52, 48);
    this.addSolidProp('printer', 2550, 760, 52, 48);
    this.addSolidProp('filing-cabinet', 2550, 840, 50, 50);
    this.addSolidProp('filing-cabinet', 2550, 905, 50, 50);
    this.addSolidProp('filing-cabinet', 2550, 970, 50, 50);
    this.addSolidProp('water-cooler', 2550, 1060, 44, 44);
    this.addSolidProp('parcel-stack', 2550, 1160, 48, 44);
    this.addSolidProp('parcel-stack', 2550, 1225, 48, 44);
    this.addSolidProp('toolbox', 2550, 1290, 40, 36);

    // Main Hall Greenery (Tucked neatly against solid borders — NO PLANTS IN AISLES!)
    this.addSolidProp('plant-large', 1470, 580, 44, 44); // Beside Boss room outer corner
    this.addSolidProp('plant-large', 1470, 1270, 44, 44); // Lower left corner of main room
    this.addSolidProp('plant-large', 2320, 580, 44, 44);  // Below Boss room divider
    this.addSolidProp('plant-large', 2550, 600, 44, 44);  // Right wall top
    this.addSolidProp('plant-large', 2550, 1340, 44, 44); // Right wall bottom
    this.addDecorativeProp('floor-lamp', 2320, 890);
  }

  /**
   * Helper: Add a 100% Solid Desk (Cannot be penetrated from any angle!)
   */
  private addSolidDesk(x: number, y: number): void {
    // Render visual desk with proper depth sorting at base
    this.add
      .image(x, y, 'prop-desk')
      .setScale(PROP_SCALE)
      .setDepth(y + 20);

    // Impenetrable physics body covering the desk width & depth
    const col = this.add.rectangle(x, y + 4, 96, 56, 0x000000, 0);
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
    const pcY = facing === 'south' ? y - 24 : y + 14;
    this.addDecorativeProp('computer', x, pcY);

    // Office Chair
    const chairY = facing === 'south' ? y + 48 : y - 48;
    this.addDecorativeProp('office-chair', x, chairY);

    // Player Desk Accent
    if (isPlayer) {
      this.addDecorativeProp('plant-small', x - 22, pcY + 4);
      // Desk tag
      this.add
        .text(x, y - 42, 'MEJA KAMU', {
          fontFamily: 'monospace',
          fontSize: '9px',
          color: '#e0b65d',
          backgroundColor: '#242a38',
          padding: { x: 4, y: 2 },
        })
        .setOrigin(0.5)
        .setDepth(y + 25);
    }
  }

  /**
   * Add a solid prop: visual sprite has depth=y+15, with solid collision body
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
      .setDepth(y + 15);

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
  // CORRIDOR & TO-DO LIST BOARD (CLEAN, NO REDUNDANT LOGO)
  // =========================================================================

  private buildCorridorElements(): void {
    // Interactive To-Do List Board
    this.add
      .rectangle(TODO_POS.x, TODO_POS.y, 48, 64, 0x355c5a)
      .setStrokeStyle(2, 0xe0b65d)
      .setDepth(TODO_POS.y + 10);

    this.add
      .text(TODO_POS.x, TODO_POS.y - 8, 'TO-DO\nLIST', {
        fontFamily: 'monospace',
        fontSize: '10px',
        color: '#fff9eb',
        fontStyle: 'bold',
        align: 'center',
      })
      .setOrigin(0.5)
      .setDepth(TODO_POS.y + 11);

    // Impenetrable base collider for To-Do List board
    const boardCol = this.add.rectangle(TODO_POS.x, TODO_POS.y, 48, 60, 0x000000, 0);
    this.physics.add.existing(boardCol, true);
    (boardCol.body as Phaser.Physics.Arcade.StaticBody).updateFromGameObject();
    this.obstacles.add(boardCol);

    // Central Corridor Plants: placed flush against solid wall pillars — CLEAR DOORWAYS!
    this.addDecorativeProp('rug', 1375, 1260); // Entrance Welcome Mat
    this.addSolidProp('plant-large', 1230, 240, 44, 44);  // Against wall above pantry door
    this.addSolidProp('plant-large', 1230, 570, 44, 44);  // Against wall between pantry & meeting door
    this.addSolidProp('plant-large', 1230, 980, 44, 44);  // Against wall between meeting & smoking door
    this.addSolidProp('plant-large', 1380, 240, 44, 44);  // Against corridor upper right
    this.addDecorativeProp('floor-lamp', 1500, 460);
  }

  // =========================================================================
  // PLAYER CREATION
  // =========================================================================

  private buildPlayer(): void {
    this.player = this.physics.add.sprite(SPAWN.x, SPAWN.y, 'char-player');
    this.player.setScale(CHAR_SCALE);

    // Proportional, tight physics collision body at player's feet
    (this.player.body as Phaser.Physics.Arcade.Body)
      .setSize(22, 18)
      .setOffset(21, 46);

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
      .setSize(24, 20)
      .setOffset(20, 44);

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
      .rectangle(0, 0, 180, 28, 0x242a38, 0.95)
      .setStrokeStyle(1.5, 0xe0b65d);

    this.promptText = this.add
      .text(0, 0, '', {
        fontFamily: 'monospace',
        fontSize: '12px',
        color: '#ffffff',
        fontStyle: 'bold',
      })
      .setOrigin(0.5);

    this.promptContainer.add([this.promptBg, this.promptText]);
  }

  private checkInteractions(): void {
    // 1. Proximity to To-Do List Board
    const distToTodo = Phaser.Math.Distance.Between(
      this.player.x,
      this.player.y,
      TODO_POS.x,
      TODO_POS.y
    );

    if (distToTodo < TODO_INTERACT_DIST) {
      this.isNearTodoList = true;
      this.showPrompt(TODO_POS.x, TODO_POS.y - 50, 'Tekan [E] Buka To-Do List');

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
        this.activeNpcNear.sprite.y - 55,
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
    this.promptBg.setSize(textWidth + 24, 28);
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
