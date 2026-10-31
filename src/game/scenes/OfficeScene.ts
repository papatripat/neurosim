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
const PLAYER_SPEED = 185;
const NPC_INTERACT_DIST = 85;
const TODO_INTERACT_DIST = 80;

// Proportional scales for 64×64 sprites onto 2752×1536 map
// Prominent, chunky, and detailed (2.0 scale)
const CHAR_SCALE = 2.0;
const PROP_SCALE = 2.0;

// Default Spawn: In Main Room (Zona 5) at employee workstation facing desk!
// "semisal awal spawn dia tuh fokusnya ke main room"
const SPAWN = { x: 1687, y: 840 };

// To-Do List board mounted ON THE TOP WALL of the central corridor
// "untuk bagian todolist itu tolong jangan di taroh di tengah-tengah gitu jadi tolong benerin agar to do list nya itu lebih keatas dan buat semacam papan gituann dan itu ada barriernya"
const TODO_POS = { x: 1450, y: 140 };

// NPC spawn positions per official specification
const NPC_POSITIONS = {
  rina: { x: 2150, y: 250 },   // Zona 4 — Ruangan Bos (Skenario 1)
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

  // Top-Area Sleek Zone Notification (Placed at top so it doesn't block center-screen!)
  // "juga untuk notif pindah-pindah tempatnya itu arahin ke bagian atas aja karena kalo tengah sepertinya ngalangin"
  private topBannerContainer!: Phaser.GameObjects.Container;
  private topBannerBg!: Phaser.GameObjects.Rectangle;
  private topBannerBadgeText!: Phaser.GameObjects.Text;
  private topBannerTitleText!: Phaser.GameObjects.Text;
  private topBannerSubText!: Phaser.GameObjects.Text;
  private topBannerTween: Phaser.Tweens.Tween | null = null;

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

    // 4. Lavish & Dense Office Furnishings Across All 5 Zones (Bustling & Dense!)
    // "terus buat lebih padet lagi engine game nya fokus ke improve keseluruhan barriernya dong"
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

    // 10. Camera Follow & Zoom Setup (Zoom 1.22 for rich, detailed pixel view)
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

    // 13. Room Location HUD (Persistent Top-Left Pill + Top-Area Announcement Banner)
    this.buildLocationHUD();

    // 14. Initial Zone Detection (Announces Main Room on spawn)
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

    // Zoom 1.22 makes character & furniture look big, prominent, and rich
    cam.setZoom(1.22);

    this.scale.on('resize', this.handleResize, this);
    this.refreshHUDPositions();
  }

  private handleResize(gameSize: Phaser.Structs.Size): void {
    this.cameras.main.setViewport(0, 0, gameSize.width, gameSize.height);
    this.refreshHUDPositions();
  }

  /**
   * Helper: Map screen-space pixel coordinates (CSS pixels) to camera coordinates
   * taking into account main camera zoom so HUD elements stay pinned and 1:1 crisp.
   */
  private getScreenCoord(screenX: number, screenY: number): { x: number; y: number } {
    const cam = this.cameras?.main;
    const zoom = cam ? cam.zoom : 1;
    const cx = this.scale.width / 2;
    const cy = this.scale.height / 2;
    return {
      x: cx + (screenX - cx) / zoom,
      y: cy + (screenY - cy) / zoom,
    };
  }

  private refreshHUDPositions(): void {
    const zoom = this.cameras?.main?.zoom || 1.22;
    if (this.locationPillContainer) {
      const { x: pillX, y: pillY } = this.getScreenCoord(24, 24);
      this.locationPillContainer.setPosition(pillX, pillY).setScale(1 / zoom);
    }
    if (this.topBannerContainer && !this.topBannerTween) {
      const { x: bannerX, y: hiddenY } = this.getScreenCoord(this.scale.width / 2, -100);
      this.topBannerContainer.setPosition(bannerX, hiddenY).setScale(1 / zoom);
    }
  }

  // =========================================================================
  // UPDATE LOOP
  // =========================================================================

  update(): void {
    // Dynamic Y-depth sorting based on where feet touch the floor
    this.player.setDepth((this.player.body as Phaser.Physics.Arcade.Body).bottom);

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
  // ROOM ZONE DETECTION & TOP-AREA HUD NOTIFICATION (DOES NOT BLOCK VIEW)
  // =========================================================================

  private buildLocationHUD(): void {
    const zoom = 1.22;

    // A. Persistent Mini Location Pill (Top-Left of Screen at screen x=24, y=24, always visible)
    const { x: pillX, y: pillY } = this.getScreenCoord(24, 24);
    this.locationPillContainer = this.add
      .container(pillX, pillY)
      .setScrollFactor(0)
      .setScale(1 / zoom)
      .setDepth(9990);

    this.locationPillBg = this.add
      .rectangle(0, 0, 250, 34, 0x141824, 0.9)
      .setOrigin(0, 0)
      .setStrokeStyle(1.5, 0x355c5a);

    this.locationPillText = this.add
      .text(14, 8, '📍 Memuat Ruangan...', {
        fontFamily: 'system-ui, -apple-system, sans-serif',
        fontSize: '13px',
        color: '#e0b65d',
        fontStyle: 'bold',
      })
      .setOrigin(0, 0);

    this.locationPillContainer.add([this.locationPillBg, this.locationPillText]);

    // B. TOP-AREA Sleek Notification Banner
    // "juga untuk notif pindah-pindah tempatnya itu arahin ke bagian atas aja karena kalo tengah sepertinya ngalangin"
    // "terus untuk setiap berpindahannya itu kurang bawah lagi karena itu tabrakan jadi tolong benerin kembali dong"
    const { x: bannerX, y: hiddenY } = this.getScreenCoord(this.scale.width / 2, -100);

    this.topBannerContainer = this.add
      .container(bannerX, hiddenY)
      .setScrollFactor(0)
      .setScale(1 / zoom)
      .setDepth(9995)
      .setAlpha(0);

    // Sleek, compact top banner card (440×56 px)
    this.topBannerBg = this.add
      .rectangle(0, 0, 440, 56, 0x0f172a, 0.95)
      .setStrokeStyle(2, 0xe0b65d);

    this.topBannerBadgeText = this.add
      .text(-190, 0, '🏢', {
        fontSize: '22px',
      })
      .setOrigin(0, 0.5);

    this.topBannerTitleText = this.add
      .text(-150, -10, 'Zona 5 · Workstation Utama', {
        fontFamily: 'system-ui, -apple-system, sans-serif',
        fontSize: '16px',
        color: '#ffffff',
        fontStyle: 'bold',
      })
      .setOrigin(0, 0.5);

    this.topBannerSubText = this.add
      .text(-150, 11, 'Ruang Kerja Karyawan & Kolaborasi Tim', {
        fontFamily: 'system-ui, -apple-system, sans-serif',
        fontSize: '11px',
        color: '#94a3b8',
      })
      .setOrigin(0, 0.5);

    this.topBannerContainer.add([
      this.topBannerBg,
      this.topBannerBadgeText,
      this.topBannerTitleText,
      this.topBannerSubText,
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
      const pillWidth = Math.max(240, this.locationPillText.width + 28);
      this.locationPillBg.setSize(pillWidth, 34);
      this.locationPillBg.setStrokeStyle(1.5, detected.borderColor);

      // Trigger TOP-AREA announcement banner
      this.triggerTopBanner(detected);

      // Notify React UI
      EventBus.emit(GAME_EVENTS.ZONE_CHANGED, {
        zoneId: detected.id,
        name: detected.name,
      });
    }
  }

  private triggerTopBanner(zone: OfficeZone): void {
    if (this.topBannerTween) {
      this.topBannerTween.stop();
      this.topBannerTween = null;
    }

    const zoom = this.cameras.main?.zoom || 1.22;
    // Target Y = 85px on screen (generous headroom below top header and location pill without colliding!)
    const { x: bannerX, y: targetY } = this.getScreenCoord(this.scale.width / 2, 85);
    const { y: hiddenY } = this.getScreenCoord(this.scale.width / 2, -100);

    this.topBannerContainer.setX(bannerX).setScale(1 / zoom);
    this.topBannerBadgeText.setText(zone.icon);
    this.topBannerTitleText.setText(zone.name);
    this.topBannerSubText.setText(zone.subtitle);
    this.topBannerBg.setStrokeStyle(2, zone.borderColor);

    const bannerW = Math.max(420, this.topBannerTitleText.width + 120);
    this.topBannerBg.setSize(bannerW, 56);
    this.topBannerBadgeText.setX(-bannerW / 2 + 20);
    this.topBannerTitleText.setX(-bannerW / 2 + 56);
    this.topBannerSubText.setX(-bannerW / 2 + 56);

    // Initial state: above viewport in screen space
    this.topBannerContainer.setY(hiddenY).setAlpha(0);

    // Drops down to targetY (screen Y = 125px), holds for 2.4s, then slides back up smoothly
    this.topBannerTween = this.tweens.add({
      targets: this.topBannerContainer,
      y: targetY,
      alpha: 1,
      duration: 320,
      ease: 'Back.easeOut',
      onComplete: () => {
        this.time.delayedCall(2400, () => {
          if (this.topBannerContainer) {
            this.tweens.add({
              targets: this.topBannerContainer,
              y: hiddenY,
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
    //    Generous walk-through clearances for 2.0 scale:
    //    - Zona 1 Door: y = 290 .. 445 (OPEN gap = 155px)
    //    - Zona 2 Door: y = 700 .. 855 (OPEN gap = 155px)
    //    - Zona 3 Door: y = 1120 .. 1230 (OPEN gap = 110px)
    // -----------------------------------------------------------------------
    // Solid 1: Above Zona 1 Door (y: 105..290)
    this.addStaticWall(1166, 198, 56, 185);

    // Solid 2: Between Zona 1 & Zona 2 Doors (y: 445..700)
    this.addStaticWall(1166, 573, 56, 255);

    // Solid 3: Between Zona 2 & Zona 3 Doors (y: 855..1100)
    this.addStaticWall(1166, 978, 56, 245);

    // -----------------------------------------------------------------------
    // D. HORIZONTAL ROOM DIVIDERS (Left Rooms)
    // -----------------------------------------------------------------------
    // Divider 1: Between Zona 1 (Pantry) & Zona 2 (Meeting Room) at y = 518
    this.addStaticWall(633, 518, 1066, 44);

    // Divider 2: Between Zona 2 (Meeting Room) & Zona 3 (Smoking Area) at y = 970
    this.addStaticWall(633, 970, 1066, 44);

    // -----------------------------------------------------------------------
    // E. ZONA 4 (BOSS ROOM - BU RINA) WALLS & DOORWAY
    //    Doorway gap: x = 2080 .. 2250 (OPEN gap = 170px at y = 518)
    // -----------------------------------------------------------------------
    // Vertical left wall of Boss room (x = 1730, y: 100..518)
    this.addStaticWall(1730, 309, 44, 418);

    // Bottom wall left of door (x: 1730..2080 at y = 518)
    this.addStaticWall(1905, 518, 350, 44);

    // Bottom wall right of door (x: 2250..2600 at y = 518)
    this.addStaticWall(2425, 518, 350, 44);
  }

  private addStaticWall(x: number, y: number, w: number, h: number): void {
    const wall = this.add.rectangle(x, y, w, h, 0x000000, 0);
    this.physics.add.existing(wall, true);
    (wall.body as Phaser.Physics.Arcade.StaticBody).updateFromGameObject();
    this.obstacles.add(wall);
  }

  // =========================================================================
  // DENSE, LAVISH & BUSTLING OFFICE FURNISHINGS (2.0 SCALE & SOLID BARRIERS)
  // =========================================================================

  private buildOfficeFurnishings(): void {
    // =======================================================================
    // 1. ZONA 1: PANTRY & DAPUR (Dimas - Skenario 2)
    // =======================================================================
    // Kitchen Countertop along top wall (solid full depth)
    this.addSolidProp('fridge', 190, 150, 70, 80);
    this.addSolidProp('kitchen-cabinet', 270, 145, 64, 60);
    this.addSolidProp('counter', 350, 145, 64, 60);
    this.addDecorativeProp('sink', 350, 115);
    this.addSolidProp('counter', 430, 145, 64, 60);
    this.addDecorativeProp('stove', 430, 115);
    this.addSolidProp('counter', 510, 145, 64, 60);
    this.addDecorativeProp('espresso-machine', 510, 110);
    this.addSolidProp('counter', 590, 145, 64, 60);
    this.addDecorativeProp('pastry-case', 590, 110);

    // Kitchen Island Bar
    this.addSolidProp('counter', 770, 155, 64, 60);
    this.addSolidProp('counter', 850, 155, 64, 60);
    this.addDecorativeProp('bar-stool', 770, 205);
    this.addDecorativeProp('bar-stool', 850, 205);

    // Cafe Tables & Seating (Break Area)
    this.addDecorativeProp('rug', 340, 330);
    this.addSolidProp('cafe-table', 340, 320, 56, 52);
    this.addDecorativeProp('cafe-chair', 280, 320);
    this.addDecorativeProp('cafe-chair', 400, 320);

    this.addDecorativeProp('rug', 650, 330);
    this.addSolidProp('cafe-table', 650, 320, 56, 52);
    this.addDecorativeProp('cafe-chair', 590, 320);
    this.addDecorativeProp('cafe-chair', 710, 320);

    // Refreshment & Greenery (tucked against perimeter)
    this.addSolidProp('water-cooler', 960, 200, 52, 52);
    this.addSolidProp('plant-large', 160, 250, 52, 52);
    this.addSolidProp('plant-large', 160, 440, 52, 52);
    this.addSolidProp('plant-large', 1060, 160, 52, 52);

    // Wall Accents
    this.addDecorativeProp('wall-clock', 470, 95);
    this.addDecorativeProp('wall-art', 690, 95);
    this.addDecorativeProp('wall-art', 890, 95);

    // =======================================================================
    // 2. ZONA 2: MEETING ROOM (Pak Hendra / Klien - Skenario 3)
    // =======================================================================
    // Boardroom Carpet
    this.addDecorativeProp('rug', 580, 720);

    // Impenetrable Boardroom Table (Solid 4 Desks Cluster)
    this.addSolidDesk(450, 720);
    this.addSolidDesk(540, 720);
    this.addSolidDesk(630, 720);
    this.addSolidDesk(720, 720);

    // Laptops on Meeting Table
    this.addDecorativeProp('computer', 450, 690);
    this.addDecorativeProp('computer', 630, 690);
    this.addDecorativeProp('plant-small', 540, 695);

    // Executive Meeting Chairs around table
    this.addDecorativeProp('office-chair', 450, 645);
    this.addDecorativeProp('office-chair', 540, 645);
    this.addDecorativeProp('office-chair', 630, 645);
    this.addDecorativeProp('office-chair', 720, 645);
    this.addDecorativeProp('office-chair', 450, 795);
    this.addDecorativeProp('office-chair', 540, 795);
    this.addDecorativeProp('office-chair', 630, 795);
    this.addDecorativeProp('office-chair', 720, 795);
    this.addDecorativeProp('office-chair', 360, 720); // Head of table

    // Credenza & Storage against top wall
    this.addSolidProp('bookcase', 250, 565, 75, 58);
    this.addSolidProp('bookcase', 330, 565, 75, 58);
    this.addSolidProp('filing-cabinet', 870, 565, 58, 58);
    this.addSolidProp('filing-cabinet', 940, 565, 58, 58);
    this.addSolidProp('water-cooler', 1040, 615, 52, 52);

    // Plants & Illumination (tucked against corners)
    this.addSolidProp('plant-large', 160, 580, 52, 52);
    this.addSolidProp('plant-large', 160, 890, 52, 52);
    this.addSolidProp('plant-large', 1050, 890, 52, 52);
    this.addDecorativeProp('floor-lamp', 1050, 570);

    // Presentation Wall Art
    this.addDecorativeProp('wall-art', 540, 520);
    this.addDecorativeProp('wall-art', 720, 520);
    this.addDecorativeProp('wall-clock', 630, 520);

    // =======================================================================
    // 3. ZONA 3: SMOKING & CREATIVE LOUNGE
    // =======================================================================
    // Primary Lounge Cluster
    this.addDecorativeProp('rug', 350, 1130);
    this.addSolidProp('sofa', 350, 1100, 110, 58);
    this.addSolidProp('coffee-table', 350, 1160, 64, 40);
    this.addSolidProp('armchair', 220, 1125, 58, 52);
    this.addSolidProp('armchair', 480, 1125, 58, 52);

    // Secondary Lounge Cluster
    this.addDecorativeProp('rug', 730, 1130);
    this.addSolidProp('sofa', 730, 1100, 110, 58);
    this.addSolidProp('coffee-table', 730, 1160, 64, 40);
    this.addSolidProp('armchair', 600, 1125, 58, 52);
    this.addSolidProp('armchair', 860, 1125, 58, 52);

    // Lounge Amenities
    this.addSolidProp('water-cooler', 1040, 1050, 52, 52);
    this.addDecorativeProp('floor-lamp', 160, 1125);
    this.addDecorativeProp('floor-lamp', 950, 1050);
    this.addSolidProp('plant-large', 160, 1030, 52, 52);
    this.addSolidProp('plant-large', 160, 1190, 52, 52);
    this.addSolidProp('plant-large', 950, 1190, 52, 52);
    this.addDecorativeProp('wall-art', 350, 975);
    this.addDecorativeProp('wall-art', 730, 975);

    // =======================================================================
    // 4. ZONA 4: RUANGAN BOS (Bu Rina - Skenario 1)
    // =======================================================================
    // Luxury Executive Carpet
    this.addDecorativeProp('rug', 2150, 245);

    // Impenetrable Executive Desk Suite
    this.addSolidDesk(2150, 230);
    this.addDecorativeProp('computer', 2150, 202);
    this.addDecorativeProp('plant-small', 2110, 206);
    this.addDecorativeProp('office-chair', 2150, 166); // Bu Rina's Chair
    this.addSolidProp('armchair', 2060, 305, 58, 52);  // Guest Chair 1
    this.addSolidProp('armchair', 2240, 305, 58, 52);  // Guest Chair 2

    // Executive Library Wall
    this.addSolidProp('bookcase', 1850, 140, 75, 58);
    this.addSolidProp('bookcase', 1930, 140, 75, 58);
    this.addSolidProp('bookcase', 2370, 140, 75, 58);
    this.addSolidProp('bookcase', 2450, 140, 75, 58);

    // Executive Archives & Floor Lamp
    this.addSolidProp('filing-cabinet', 1780, 215, 58, 58);
    this.addSolidProp('filing-cabinet', 1780, 285, 58, 58);
    this.addDecorativeProp('floor-lamp', 2530, 145);

    // Private Executive Discussion Lounge
    this.addDecorativeProp('rug', 1920, 390);
    this.addSolidProp('coffee-table', 1920, 390, 64, 40);
    this.addSolidProp('armchair', 1845, 390, 58, 52);
    this.addSolidProp('armchair', 1995, 390, 58, 52);

    // Greenery & Accents (tucked against corners)
    this.addSolidProp('plant-large', 1780, 440, 52, 52);
    this.addSolidProp('plant-large', 2550, 235, 52, 52);
    this.addSolidProp('plant-large', 2550, 440, 52, 52);
    this.addDecorativeProp('wall-art', 2030, 100);
    this.addDecorativeProp('wall-art', 2270, 100);
    this.addDecorativeProp('wall-clock', 2150, 100);

    // =======================================================================
    // 5. ZONA 5: DENSE & ORGANIZED WORKSPACE (Klaster Pod Meja Tim yang Rapi)
    // =======================================================================
    // Modern Workstation Pods (2×2 Desk Islands) — Rapi, Padat, Profesional
    // Tidak amburadul: tertata simetris dengan aisle/lorong luas & tidak menutupi pintu!

    // Pod 1 (Top-Left): Tim Frontend & UI (Termasuk MEJA KAMU)
    this.createWorkstationPod(1750, 740, '💻 TIM FRONTEND & UI', 'left');

    // Pod 2 (Top-Right): Tim Backend & AI
    this.createWorkstationPod(2210, 740, '⚡ TIM BACKEND & AI');

    // Pod 3 (Bottom-Left): Tim Game Engine
    this.createWorkstationPod(1750, 1040, '🎮 TIM GAME ENGINE');

    // Pod 4 (Bottom-Right): Tim QA & Otomasi
    this.createWorkstationPod(2210, 1040, '🧪 TIM QA & OTOMASI');

    // Breakout Coffee & Discussion Lounge (Ditempatkan rapi di tepi jendela selatan, bukan di tengah jalan!)
    this.addDecorativeProp('rug', 2100, 1270);
    this.addSolidProp('sofa', 2100, 1245, 108, 54);
    this.addSolidProp('coffee-table', 2100, 1295, 64, 38);
    this.addSolidProp('armchair', 1995, 1270, 56, 50);
    this.addSolidProp('armchair', 2205, 1270, 56, 50);
    this.addDecorativeProp('floor-lamp', 2275, 1245);
    this.addSolidProp('plant-large', 1915, 1270, 52, 52);

    // Operations, Printing & Utility Area (Sepanjang Dinding Kanan x = 2550)
    this.addSolidProp('printer', 2550, 680, 60, 54);
    this.addSolidProp('printer', 2550, 760, 60, 54);
    this.addSolidProp('filing-cabinet', 2550, 850, 58, 58);
    this.addSolidProp('filing-cabinet', 2550, 920, 58, 58);
    this.addSolidProp('filing-cabinet', 2550, 990, 58, 58);
    this.addSolidProp('water-cooler', 2550, 1075, 52, 52);
    this.addSolidProp('parcel-stack', 2550, 1160, 56, 52);
    this.addSolidProp('parcel-stack', 2550, 1230, 56, 52);

    // Left Divider & Corridor Wall Area (Sepanjang Sekat Kiri x = 1470)
    this.addSolidProp('plant-large', 1470, 580, 52, 52); // Sudut atas dekat ruang Bos
    this.addSolidProp('filing-cabinet', 1470, 700, 58, 58);
    this.addSolidProp('filing-cabinet', 1470, 770, 58, 58);
    this.addSolidProp('water-cooler', 1470, 870, 52, 52);
    this.addSolidProp('toolbox', 1470, 950, 52, 48);
    this.addSolidProp('plant-large', 1470, 1330, 52, 52); // Sudut bawah

    // Border Greenery Accents
    this.addSolidProp('plant-large', 2340, 580, 52, 52);
    this.addSolidProp('plant-large', 2550, 590, 52, 52);
    this.addSolidProp('plant-large', 2550, 1330, 52, 52);
    this.addDecorativeProp('floor-lamp', 2340, 880);
  }

  /**
   * Helper: Add a 100% Solid Desk (Cannot be penetrated from any angle!)
   */
  private addSolidDesk(x: number, y: number): void {
    // Render visual desk with proper depth sorting at base
    this.add
      .image(x, y, 'prop-desk')
      .setScale(PROP_SCALE)
      .setDepth(y + 15);

    // Impenetrable physics body covering the desk width & depth
    const col = this.add.rectangle(x, y + 8, 110, 64, 0x000000, 0);
    this.physics.add.existing(col, true);
    (col.body as Phaser.Physics.Arcade.StaticBody).updateFromGameObject();
    this.obstacles.add(col);
  }

  /**
   * Helper: Build an organized, professional 4-desk team workstation pod (2×2 island).
   * Dense, clean, and 100% impenetrable with solid colliders and team identity.
   */
  private createWorkstationPod(
    podX: number,
    podY: number,
    teamName: string,
    playerDeskCol?: 'left' | 'right'
  ): void {
    const colSpacing = 63;
    const leftDeskX = podX - colSpacing;
    const rightDeskX = podX + colSpacing;

    const northDeskY = podY - 36;
    const southDeskY = podY + 36;

    // 1. Desks Sprites (4 desks joined back-to-back in a pod)
    // North pair
    this.add.image(leftDeskX, northDeskY, 'prop-desk').setScale(PROP_SCALE).setDepth(northDeskY + 15);
    this.add.image(rightDeskX, northDeskY, 'prop-desk').setScale(PROP_SCALE).setDepth(northDeskY + 15);
    // South pair
    this.add.image(leftDeskX, southDeskY, 'prop-desk').setScale(PROP_SCALE).setDepth(southDeskY + 15);
    this.add.image(rightDeskX, southDeskY, 'prop-desk').setScale(PROP_SCALE).setDepth(southDeskY + 15);

    // 2. Computers & Monitors
    // North desks: monitors face south toward user sitting above
    this.addDecorativeProp('computer', leftDeskX, northDeskY + 14);
    this.addDecorativeProp('computer', rightDeskX, northDeskY + 14);
    // South desks: monitors face north toward user sitting below
    this.addDecorativeProp('computer', leftDeskX, southDeskY - 14);
    this.addDecorativeProp('computer', rightDeskX, southDeskY - 14);

    // Center seam decorative succulent
    this.addDecorativeProp('plant-small', podX, podY);

    // 3. Ergonomic Office Chairs
    // North chairs (sitting above desks facing south)
    this.addDecorativeProp('office-chair', leftDeskX, northDeskY - 56);
    this.addDecorativeProp('office-chair', rightDeskX, northDeskY - 56);
    // South chairs (sitting below desks facing north)
    this.addDecorativeProp('office-chair', leftDeskX, southDeskY + 56);
    this.addDecorativeProp('office-chair', rightDeskX, southDeskY + 56);

    // 4. 100% Solid Physics Collider covering entire 4-desk island
    const podCollider = this.add.rectangle(podX, podY, 244, 144, 0x000000, 0);
    this.physics.add.existing(podCollider, true);
    (podCollider.body as Phaser.Physics.Arcade.StaticBody).updateFromGameObject();
    this.obstacles.add(podCollider);

    // 5. Team Identity Banner above the pod
    this.add
      .rectangle(podX, northDeskY - 95, 170, 22, 0x141824, 0.92)
      .setStrokeStyle(1.5, 0x355c5a)
      .setDepth(northDeskY + 2);
    this.add
      .text(podX, northDeskY - 95, teamName, {
        fontFamily: 'monospace',
        fontSize: '10px',
        color: '#e0b65d',
        fontStyle: 'bold',
      })
      .setOrigin(0.5)
      .setDepth(northDeskY + 3);

    // 6. Player Desk Highlight ("MEJA KAMU")
    if (playerDeskCol) {
      const pX = playerDeskCol === 'left' ? leftDeskX : rightDeskX;
      const pY = southDeskY;

      // Small personalized desk succulent
      this.addDecorativeProp('plant-small', pX - 22, pY - 12);

      // "MEJA KAMU" prominent tag placed above the monitor seam so player standing below never obscures it!
      this.add
        .rectangle(pX, pY - 32, 86, 18, 0x1e293b, 0.95)
        .setStrokeStyle(1.5, 0xe0b65d)
        .setDepth(pY + 30);
      this.add
        .text(pX, pY - 32, '★ MEJA KAMU', {
          fontFamily: 'monospace',
          fontSize: '10px',
          color: '#e0b65d',
          fontStyle: 'bold',
        })
        .setOrigin(0.5)
        .setDepth(pY + 31);
    }
  }

  /**
   * Add a solid prop: visual sprite has depth=y+18, with solid collision body
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
    // Mounted against the top corridor wall (x = 1450, y = 140)

    // 1. Board Outer Wooden Frame
    this.add
      .rectangle(TODO_POS.x, TODO_POS.y, 148, 76, 0x533e3b)
      .setDepth(TODO_POS.y + 1);

    // 2. Cork/Chalkboard Surface
    this.add
      .rectangle(TODO_POS.x, TODO_POS.y, 138, 66, 0x1e293b)
      .setDepth(TODO_POS.y + 2);

    // 3. Header Title Badge
    this.add
      .rectangle(TODO_POS.x, TODO_POS.y - 19, 128, 18, 0x355c5a)
      .setStrokeStyle(1.5, 0xe0b65d)
      .setDepth(TODO_POS.y + 3);

    this.add
      .text(TODO_POS.x, TODO_POS.y - 19, '📋 PAPAN AGENDA KERJA', {
        fontFamily: 'monospace',
        fontSize: '9px',
        color: '#fff9eb',
        fontStyle: 'bold',
      })
      .setOrigin(0.5)
      .setDepth(TODO_POS.y + 4);

    // 4. Pinned Task Notes on Board
    this.add
      .text(
        TODO_POS.x,
        TODO_POS.y + 9,
        '• Skenario 1: Bu Rina (Bos)\n• Skenario 2: Dimas (Pantry)\n• Skenario 3: Pak Hendra',
        {
          fontFamily: 'system-ui, sans-serif',
          fontSize: '9px',
          color: '#e2e8f0',
          lineSpacing: 2,
        }
      )
      .setOrigin(0.5)
      .setDepth(TODO_POS.y + 4);

    // 5. Impenetrable Physics Barrier for the Board (Player cannot walk through wall/board!)
    const boardCol = this.add.rectangle(TODO_POS.x, TODO_POS.y, 150, 72, 0x000000, 0);
    this.physics.add.existing(boardCol, true);
    (boardCol.body as Phaser.Physics.Arcade.StaticBody).updateFromGameObject();
    this.obstacles.add(boardCol);

    // 6. Central Corridor Decorative Elements
    this.addDecorativeProp('rug', 1375, 1260); // Entrance Welcome Mat
    this.addSolidProp('plant-large', 1230, 240, 52, 52); // Above pantry door, flush to wall
    this.addSolidProp('plant-large', 1230, 580, 52, 52); // Between pantry & meeting door
    this.addSolidProp('plant-large', 1230, 990, 52, 52); // Between meeting & smoking door
    this.addDecorativeProp('floor-lamp', 1600, 180);
  }

  // =========================================================================
  // PLAYER CREATION (BIGGER SCALE 2.0 & ACCURATE COLLIDER)
  // =========================================================================

  private buildPlayer(): void {
    this.player = this.physics.add.sprite(SPAWN.x, SPAWN.y, 'char-player');
    this.player.setScale(CHAR_SCALE);

    // Collision body at feet: nimble & agile with no catching on doorways
    (this.player.body as Phaser.Physics.Arcade.Body)
      .setSize(22, 16)
      .setOffset(21, 44);

    this.player.setCollideWorldBounds(true);
    this.player.play('char-player-idle-north');
    this.player.setDepth((this.player.body as Phaser.Physics.Arcade.Body).bottom);
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
      .setSize(26, 20)
      .setOffset(19, 44);

    sprite.play(`${spriteKey}-idle-south`);
    sprite.setDepth((sprite.body as Phaser.Physics.Arcade.Body).bottom);

    this.npcs.push({ id, name, role, sprite, scenarioId });
  }

  // =========================================================================
  // INTERACTION PROMPT & LOGIC
  // =========================================================================

  private buildInteractivePrompt(): void {
    this.promptContainer = this.add.container(0, 0).setDepth(9999).setVisible(false);

    this.promptBg = this.add
      .rectangle(0, 0, 230, 32, 0x141824, 0.95)
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
    // 1. Proximity to Wall-Mounted To-Do List Board
    const distToTodo = Phaser.Math.Distance.Between(
      this.player.x,
      this.player.y,
      TODO_POS.x,
      TODO_POS.y + 40
    );

    if (distToTodo < TODO_INTERACT_DIST) {
      this.isNearTodoList = true;
      this.showPrompt(TODO_POS.x, TODO_POS.y + 65, 'Tekan [E] Buka Papan Agenda');

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
        this.activeNpcNear.sprite.y - 58,
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
    this.promptBg.setSize(textWidth + 28, 32);
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
