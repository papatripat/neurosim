import { generateFullLpcSpritesheet } from '../../lib/lpcCompositor';
import Phaser from 'phaser';
import { EventBus, GAME_EVENTS } from '../EventBus';
import { multiplayerService } from '../../services/multiplayer.service';
import { PlayerPresence, PlayerMovementPacket } from '../../types/multiplayer';
import { UserStatus } from '../../components/gather/GatherDock';

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

export interface SeatSpot {
  id: string;
  name: string;
  x: number;
  y: number;
  sitX: number;
  sitY: number;
  facing: 'south' | 'north' | 'east' | 'west';
  type: 'chair' | 'sofa' | 'armchair' | 'stool';
}

export interface OfficeZone {
  id: string;
  name: string;
  subtitle: string;
  badge: string;
  borderColor: number;
  textColor: string;
  check: (x: number, y: number) => boolean;
}

interface RemotePlayerRecord {
  presence: PlayerPresence;
  container: Phaser.GameObjects.Container;
  sprite: Phaser.GameObjects.Sprite;
  nameBg: Phaser.GameObjects.Graphics;
  nameText: Phaser.GameObjects.Text;
  statusDot: Phaser.GameObjects.Graphics;
  targetX: number;
  targetY: number;
  direction: 'north' | 'south' | 'east' | 'west';
  isMoving: boolean;
  isSitting?: boolean;
  sitAnim?: string;
  archetypeKey: string;
  activeChatBubble?: {
    container: Phaser.GameObjects.Container;
    offsetY: number;
  } | null;
  activeEmotes: {
    container: Phaser.GameObjects.Container;
    offsetX: number;
    offsetY: number;
  }[];
}

// ---------------------------------------------------------------------------
// Constants & Map Geometry
// ---------------------------------------------------------------------------

const MAP_W = 2752;
const MAP_H = 1536;
const PLAYER_SPEED = 185;
const NPC_INTERACT_DIST = 130;
const TODO_INTERACT_DIST = 80;

// Proportional scales for 64×64 sprites onto 2752×1536 map
// Prominent, chunky, and detailed (2.0 scale)
const CHAR_SCALE = 2.0;
const PROP_SCALE = 2.0;

// Default Spawn: In Main Workstation at employee desk
const SPAWN = { x: 1687, y: 840 };

// To-Do List board mounted ON THE TOP WALL of the central corridor
const TODO_POS = { x: 1450, y: 140 };

// NPC spawn positions per official specification
const NPC_POSITIONS = {
  rina: { x: 2150, y: 172 },   // Ruang Eksekutif & Manajemen (Bu Rina di meja eksekutif)
  dimas: { x: 580, y: 270 },   // Pantry & Dapur (Skenario 2)
  klien: { x: 920, y: 640 },   // Ruang Rapat & Konferensi (Pak Hendra di sudut dalam dekat credenza/dispenser)
} as const;

// ---------------------------------------------------------------------------
// Office Zones Definition
// ---------------------------------------------------------------------------

const OFFICE_ZONES: OfficeZone[] = [
  {
    id: 'room-executive',
    name: 'Ruang Eksekutif & Manajemen',
    subtitle: 'Ruang Manajemen & Atasan (Bu Rina)',
    badge: 'EXECUTIVE SUITE',
    borderColor: 0xe0b65d,
    textColor: '#f4ead5',
    check: (x, y) => x >= 1715 && x <= 2595 && y >= 100 && y <= 518,
  },
  {
    id: 'room-pantry',
    name: 'Pantry & Dapur',
    subtitle: 'Area Istirahat & Rekan Kerja (Dimas)',
    badge: 'PANTRY & BREAKROOM',
    borderColor: 0xba8a5c,
    textColor: '#fff9eb',
    check: (x, y) => x >= 100 && x <= 1166 && y >= 100 && y <= 518,
  },
  {
    id: 'room-meeting',
    name: 'Ruang Rapat & Konferensi',
    subtitle: 'Ruang Rapat & Presentasi Klien (Pak Hendra)',
    badge: 'CONFERENCE ROOM',
    borderColor: 0x355c5a,
    textColor: '#fff9eb',
    check: (x, y) => x >= 100 && x <= 1166 && y > 518 && y <= 970,
  },
  {
    id: 'afk-room',
    name: 'AFK Room & Area Santai',
    subtitle: 'Area Istirahat & Relaksasi Karyawan',
    badge: 'AFK & LOUNGE',
    borderColor: 0x697b8b,
    textColor: '#fff9eb',
    check: (x, y) => x >= 100 && x <= 1166 && y > 970 && y <= 1380,
  },
  {
    id: 'room-workspace',
    name: 'Workstation Utama',
    subtitle: 'Ruang Kerja Karyawan & Kolaborasi Tim',
    badge: 'MAIN WORKSPACE',
    borderColor: 0x2b6e4f,
    textColor: '#e0b65d',
    check: (x, y) => x >= 1420 && x <= 2595 && y >= 520 && y <= 1380,
  },
  {
    id: 'koridor',
    name: 'Koridor Utama & Pintu Masuk',
    subtitle: 'Pusat Navigasi & Papan Agenda Skenario',
    badge: 'CENTRAL CORRIDOR',
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
  private playerArchetypeKey: string = 'char-player';
  private lastDirection: string = 'north';

  // NPCs
  private npcs: NPCData[] = [];

  // Remote Multiplayer Players
  private remotePlayers: Map<string, RemotePlayerRecord> = new Map();
  private wasMovingLocally: boolean = false;

  // Physics Obstacles (Walls & Solid Furniture)
  private obstacles!: Phaser.Physics.Arcade.StaticGroup;

  // Input Keys
  private cursors!: Phaser.Types.Input.Keyboard.CursorKeys;
  private wasd!: Record<string, Phaser.Input.Keyboard.Key>;
  private keyE!: Phaser.Input.Keyboard.Key;
  private keySpace!: Phaser.Input.Keyboard.Key;

  // Sitting & Interactive Seat System
  private seats: SeatSpot[] = [];
  private isSitting = false;
  private currentSeat: SeatSpot | null = null;
  private lastStandPos: { x: number; y: number } = { x: 0, y: 0 };

  // Interaction State
  private isPlayerLocked = false;
  private promptText!: Phaser.GameObjects.Text;
  private promptBg!: Phaser.GameObjects.Rectangle;
  private promptContainer!: Phaser.GameObjects.Container;
  private activeNpcNear: NPCData | null = null;
  private isNearTodoList = false;

  // Active Chat Speech Bubble (Strictly 1 at a time, replaced on new chat)
  private activeChatBubble: {
    container: Phaser.GameObjects.Container;
    offsetY: number;
  } | null = null;

  // Active Floating Emotes
  private activeEmotes: {
    container: Phaser.GameObjects.Container;
    offsetX: number;
    offsetY: number;
  }[] = [];

  // Screen Share Live Badge Container & State
  private screenShareBadgeContainer: Phaser.GameObjects.Container | null = null;
  private isScreenSharingActive = false;
  private screenSharerName = '';

  private focusTimeoutId: number | null = null;

  private safeDisableCapture(): void {
    try {
      const keyboard = this.input?.keyboard as any;
      if (this.sys?.isActive() && keyboard && keyboard.manager) {
        keyboard.disableGlobalCapture();
      }
    } catch {
      // Safely ignore unmounted keyboard manager
    }
  }

  private safeEnableCapture(): void {
    try {
      const keyboard = this.input?.keyboard as any;
      if (this.sys?.isActive() && keyboard && keyboard.manager) {
        keyboard.enableGlobalCapture();
      }
    } catch {
      // Safely ignore unmounted keyboard manager
    }
  }

  // Room Location HUD
  private currentZoneId: string | null = null;
  private locationPillContainer!: Phaser.GameObjects.Container;
  private locationPillText!: Phaser.GameObjects.Text;
  private locationPillBg!: Phaser.GameObjects.Rectangle;

  // Top-Area Sleek Zone Notification (Placed at top so it doesn't block center-screen!)
  // "juga untuk notif pindah-pindah tempatnya itu arahin ke bagian atas aja karena kalo tengah sepertinya ngalangin"
  private topBannerContainer!: Phaser.GameObjects.Container;
  private topBannerBg!: Phaser.GameObjects.Rectangle;
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
    this.seats = [];
    this.isSitting = false;
    this.currentSeat = null;
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

    // 7. Spawn Player in Workstation Utama (or requested room coords from Dashboard)
    this.buildPlayer();

    if (typeof localStorage !== 'undefined') {
      try {
        const pendingSpawn = localStorage.getItem('neurosim_spawn_coords');
        if (pendingSpawn) {
          const coords = JSON.parse(pendingSpawn);
          localStorage.removeItem('neurosim_spawn_coords');
          if (coords?.x && coords?.y) {
            this.player.setPosition(coords.x, coords.y);
          }
        }
      } catch {}
    }

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
    this.keySpace = this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE);

    // Prevent Phaser from hijacking default browser typing behavior (Space, Arrows, Tab)
    this.safeDisableCapture();

    // 12. Interactive Prompt Box
    this.buildInteractivePrompt();

    // 13. Room Location HUD (Persistent Top-Left Pill + Top-Area Announcement Banner)
    this.buildLocationHUD();

    // 14. Initial Zone Detection (Announces Main Room on spawn)
    this.updateCurrentZone(true);

    // 15. Listeners
    EventBus.on(GAME_EVENTS.CLOSE_DIALOG, this.handleCloseDialog, this);
    EventBus.on(GAME_EVENTS.CLOSE_TODO_LIST, this.handleCloseDialog, this);
    EventBus.on(GAME_EVENTS.PAUSE_INPUT, this.lockPlayer, this);
    EventBus.on(GAME_EVENTS.RESUME_INPUT, this.handleCloseDialog, this);
    EventBus.on(GAME_EVENTS.TRIGGER_REACTION, this.handleTriggerReaction, this);
    EventBus.on(GAME_EVENTS.TRIGGER_CHAT_BUBBLE, this.handleTriggerChatBubble, this);
    EventBus.on(GAME_EVENTS.UPDATE_PLAYER_CHARACTER, this.handleUpdatePlayerCharacter, this);
    EventBus.on(GAME_EVENTS.TELEPORT_TO_ROOM, this.handleTeleportToRoom, this);
    EventBus.on(GAME_EVENTS.SCREEN_SHARE_CHANGED, this.handleScreenShareChanged, this);
    EventBus.on(GAME_EVENTS.REMOTE_PLAYER_JOINED, this.handleRemotePlayerJoined, this);
    EventBus.on(GAME_EVENTS.REMOTE_PLAYER_MOVED, this.handleRemotePlayerMoved, this);
    EventBus.on(GAME_EVENTS.REMOTE_PLAYER_LEFT, this.handleRemotePlayerLeft, this);
    EventBus.on(GAME_EVENTS.REMOTE_PLAYER_STATUS, this.handleRemotePlayerStatus, this);

    // Initial sync of players already present in room
    const currentOnline = multiplayerService.getOnlinePlayers();
    for (const player of currentOnline) {
      this.handleRemotePlayerJoined(player);
    }

    if (typeof localStorage !== 'undefined') {
      try {
        const saved = localStorage.getItem('neurosim_character_config');
        if (saved) {
          const cfg = JSON.parse(saved);
          this.handleUpdatePlayerCharacter(cfg);
        }
      } catch (e) {}
    }

    // Otomatis bebaskan capture keyboard saat user mengetik di input/textbox mana pun di React
    if (typeof window !== 'undefined') {
      window.addEventListener('focusin', this.handleWindowFocusIn);
      window.addEventListener('focusout', this.handleWindowFocusOut);
      window.addEventListener('blur', this.handleWindowBlur);
      window.addEventListener('focus', this.handleWindowFocus);
    }

    // 16. Notify React UI
    this.events.once('shutdown', this.shutdown, this);
    this.events.once('destroy', this.destroy, this);
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
    if (!gameSize || gameSize.width <= 0 || gameSize.height <= 0) return;
    if (this.cameras?.main) {
      this.cameras.main.setViewport(0, 0, gameSize.width, gameSize.height);
    }
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
    if (!this.scale || this.scale.width <= 0 || this.scale.height <= 0) return;
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
    if (!this.player || !this.player.body || !this.player.active) return;

    // 0. Sitting State Guard & Controls
    if (this.isSitting) {
      this.player.setVelocity(0, 0);

      // Check if user wants to stand up (Pressing SPACE, E, W, A, S, D or Arrows)
      const wantsStandUp =
        Phaser.Input.Keyboard.JustDown(this.keySpace) ||
        Phaser.Input.Keyboard.JustDown(this.keyE) ||
        this.wasd.W.isDown ||
        this.wasd.A.isDown ||
        this.wasd.S.isDown ||
        this.wasd.D.isDown ||
        this.cursors.up.isDown ||
        this.cursors.down.isDown ||
        this.cursors.left.isDown ||
        this.cursors.right.isDown;

      if (wantsStandUp) {
        this.standUp();
      } else {
        this.showPrompt(this.player.x, this.player.y - 56, 'Tekan [SPASI / WASD] Berdiri');
      }
    } else {
      this.player.setDepth((this.player.body as Phaser.Physics.Arcade.Body).bottom);
    }

    // Update active reaction emote positions so they strictly track the player sprite
    for (let i = this.activeEmotes.length - 1; i >= 0; i--) {
      const item = this.activeEmotes[i];
      if (!item.container.active) {
        this.activeEmotes.splice(i, 1);
        continue;
      }
      item.container.setPosition(
        this.player.x + item.offsetX,
        this.player.y - item.offsetY
      );
      item.container.setDepth(this.player.y + 1040);
    }

    // Update active chat speech bubble so it strictly tracks the player sprite
    if (this.activeChatBubble && this.activeChatBubble.container.active) {
      this.activeChatBubble.container.setPosition(
        this.player.x,
        this.player.y - this.activeChatBubble.offsetY
      );
      this.activeChatBubble.container.setDepth(this.player.y + 1050);
    }

    // Update screen share live badge position so it follows player
    if (this.screenShareBadgeContainer && this.screenShareBadgeContainer.active) {
      this.screenShareBadgeContainer.setPosition(this.player.x, this.player.y - 48);
      this.screenShareBadgeContainer.setDepth(this.player.y + 1020);
    }

    // -------------------------------------------------------------------------
    // Update Remote Multiplayer Players (Lerp movement, animations, nametags, emotes, sitting)
    // -------------------------------------------------------------------------
    for (const [, record] of this.remotePlayers.entries()) {
      if (!record.container || !record.container.active) continue;

      const dx = record.targetX - record.container.x;
      const dy = record.targetY - record.container.y;
      const dist = Math.hypot(dx, dy);

      if (record.isSitting) {
        // Pemain remote sedang duduk di kursi/sofa
        record.container.x = record.targetX;
        record.container.y = record.targetY;

        // Depth sorting saat duduk presisi mengikuti dekorasi kursi
        if (record.direction === 'north') {
          record.container.setDepth(record.targetY + 45);
        } else {
          record.container.setDepth(record.targetY + 55);
        }

        // Animasi duduk remote player
        const sitAnim = record.sitAnim || `${record.archetypeKey}-sit-${record.direction}`;
        if (this.anims.exists(sitAnim)) {
          record.sprite.play(sitAnim, true);
        } else {
          const fallbackSit = `${record.archetypeKey}-sit-south`;
          if (this.anims.exists(fallbackSit)) {
            record.sprite.play(fallbackSit, true);
          } else {
            record.sprite.play(`${record.archetypeKey}-idle-${record.direction}`, true);
          }
        }
      } else {
        // Pemain remote sedang berjalan atau berdiri (idle)
        if (dist > 150) {
          // Snap teleport jika jarak melebihi 150px (mencegah pemain meluncur tembus ruangan saat spawn)
          record.container.x = record.targetX;
          record.container.y = record.targetY;
        } else if (dist > 1.2) {
          record.container.x = Phaser.Math.Linear(record.container.x, record.targetX, 0.22);
          record.container.y = Phaser.Math.Linear(record.container.y, record.targetY, 0.22);
        } else {
          record.container.x = record.targetX;
          record.container.y = record.targetY;
        }

        // Dynamic Y-depth sorting based on player position on floor
        record.container.setDepth(record.container.y);

        // Animation handling: play walking if actively moving or converging towards target
        const isMoving = record.isMoving || dist > 2.5;
        if (isMoving) {
          const walkAnim = `${record.archetypeKey}-walk-${record.direction}`;
          if (this.anims.exists(walkAnim)) {
            record.sprite.play(walkAnim, true);
          }
        } else {
          const idleAnim = `${record.archetypeKey}-idle-${record.direction}`;
          if (this.anims.exists(idleAnim)) {
            record.sprite.play(idleAnim, true);
          }
        }
      }

      // Update active reaction emote positions for this remote player
      for (let i = record.activeEmotes.length - 1; i >= 0; i--) {
        const item = record.activeEmotes[i];
        if (!item.container.active) {
          record.activeEmotes.splice(i, 1);
          continue;
        }
        item.container.setPosition(
          record.container.x + item.offsetX,
          record.container.y - item.offsetY
        );
        item.container.setDepth(record.container.y + 1000);
      }

      // Update active chat speech bubble for this remote player
      if (record.activeChatBubble && record.activeChatBubble.container.active) {
        record.activeChatBubble.container.setPosition(
          record.container.x,
          record.container.y - record.activeChatBubble.offsetY
        );
        record.activeChatBubble.container.setDepth(record.container.y + 1050);
      }
    }

    // Jika pemain lokal sedang duduk, jangan jalankan kalkulasi gerak berjalan di bawah
    if (this.isSitting) {
      return;
    }

    // Guard: ignore game movement while typing in HTML inputs or when any modal dialog is active
    const isModalOpen = typeof document !== 'undefined' && Boolean(document.querySelector('[role="dialog"]'));
    const activeEl = typeof document !== 'undefined' ? document.activeElement : null;
    const isUserTyping = Boolean(
      activeEl &&
        (activeEl.tagName === 'INPUT' ||
          activeEl.tagName === 'TEXTAREA' ||
          (activeEl as HTMLElement).isContentEditable)
    );

    const hasFocus =
      typeof document !== 'undefined' && typeof document.hasFocus === 'function'
        ? document.hasFocus()
        : true;

    if (this.isPlayerLocked || isModalOpen || isUserTyping || !hasFocus) {
      this.resetMovementKeys();
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

    // Continuous, blink-free walking animation with full diagonal (serong) support
    if (vx !== 0 || vy !== 0) {
      this.wasMovingLocally = true;
      const isDiagonal = vx !== 0 && vy !== 0;
      let targetAngle = 0;
      let chosenAnim = '';

      if (isDiagonal) {
        // Logika Gerak Serong (Diagonal Movement)
        const vDir = vy > 0 ? 'south' : 'north';
        const hDir = vx > 0 ? 'east' : 'west';
        const diagDir = `${vDir}-${hDir}`;

        // Intent detection: periksa tombol mana yang ditekan paling baru (timeDown)
        const vTime = vy > 0
          ? Math.max(this.wasd?.S?.timeDown || 0, this.cursors.down?.timeDown || 0)
          : Math.max(this.wasd?.W?.timeDown || 0, this.cursors.up?.timeDown || 0);
        const hTime = vx > 0
          ? Math.max(this.wasd?.D?.timeDown || 0, this.cursors.right?.timeDown || 0)
          : Math.max(this.wasd?.A?.timeDown || 0, this.cursors.left?.timeDown || 0);

        // Jika ada animasi khusus serong (misal char-player-walk-south-east), gunakan
        const diagAnimKey = `${this.playerArchetypeKey}-walk-${diagDir}`;
        if (this.anims.exists(diagAnimKey)) {
          chosenAnim = diagAnimKey;
        } else {
          // Fallback dinamis mengikuti arah tombol yang terakhir ditekan
          const dominantDir = hTime >= vTime ? hDir : vDir;
          chosenAnim = `${this.playerArchetypeKey}-walk-${dominantDir}`;
        }

        // Simpan arah dasar untuk posisi idle saat berhenti
        this.lastDirection = vDir;

        // Efek Kemiringan Tubuh Dinamis (Diagonal Banking Lean):
        // Serong Kanan (East-bound): miring ke kanan (+3.8 derajat)
        // Serong Kiri (West-bound): miring ke kiri (-3.8 derajat)
        targetAngle = vx > 0 ? (vy > 0 ? 3.8 : 3.0) : (vy > 0 ? -3.8 : -3.0);
      } else {
        // Gerak Lurus (Kardinal)
        let dir: string;
        if (vx > 0) dir = 'east';
        else if (vx < 0) dir = 'west';
        else if (vy > 0) dir = 'south';
        else dir = 'north';

        this.lastDirection = dir;
        targetAngle = 0;
        chosenAnim = `${this.playerArchetypeKey}-walk-${dir}`;
      }

      // Smooth Lerp Rotasi agar transisi dari lurus ke serong sangat luwes dan dinamis
      const currentAngle = this.player.angle;
      this.player.setAngle(Phaser.Math.Linear(currentAngle, targetAngle, 0.25));

      if (this.anims.exists(chosenAnim)) {
        this.player.play(chosenAnim, true);
      } else {
        this.player.play(`${this.playerArchetypeKey}-walk-${this.lastDirection}`, true);
      }

      // Broadcast pergerakan ke room online secara realtime
      multiplayerService.sendMovement({
        x: Math.round(this.player.x),
        y: Math.round(this.player.y),
        direction: (this.lastDirection === 'north' || this.lastDirection === 'south' || this.lastDirection === 'east' || this.lastDirection === 'west') ? this.lastDirection : 'south',
        anim: chosenAnim,
        isMoving: true,
        zone: this.currentZoneId || 'koridor',
      });
    } else {
      if (this.wasMovingLocally) {
        this.wasMovingLocally = false;
        // Broadcast penghentian seketika ke pemain lain
        multiplayerService.sendMovement({
          x: Math.round(this.player.x),
          y: Math.round(this.player.y),
          direction: (this.lastDirection === 'north' || this.lastDirection === 'south' || this.lastDirection === 'east' || this.lastDirection === 'west') ? this.lastDirection : 'south',
          anim: `${this.playerArchetypeKey}-idle-${this.lastDirection}`,
          isMoving: false,
          zone: this.currentZoneId || 'koridor',
        });
      }
      // Idle / Berhenti: pastikan badan tegak kembali
      this.player.setAngle(0);
      this.player.play(`${this.playerArchetypeKey}-idle-${this.lastDirection}`, true);
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
      .rectangle(0, 0, 200, 32, 0x141824, 0.9)
      .setOrigin(0, 0)
      .setStrokeStyle(1.5, 0x355c5a);

    this.locationPillText = this.add
      .text(12, 7, 'Memuat Ruangan...', {
        fontFamily: 'system-ui, -apple-system, sans-serif',
        fontSize: '13px',
        color: '#e0b65d',
        fontStyle: 'bold',
      })
      .setOrigin(0, 0);

    this.locationPillContainer.add([this.locationPillBg, this.locationPillText]);

    // B. TOP-AREA Sleek Notification Banner
    const { x: bannerX, y: hiddenY } = this.getScreenCoord(this.scale.width / 2, -100);

    this.topBannerContainer = this.add
      .container(bannerX, hiddenY)
      .setScrollFactor(0)
      .setScale(1 / zoom)
      .setDepth(9995)
      .setAlpha(0);

    // Clean, refined top banner card
    this.topBannerBg = this.add
      .rectangle(0, 0, 380, 50, 0x0f172a, 0.95)
      .setStrokeStyle(1.5, 0xe0b65d);

    this.topBannerTitleText = this.add
      .text(0, -9, 'Workstation Utama', {
        fontFamily: 'system-ui, -apple-system, sans-serif',
        fontSize: '15px',
        color: '#ffffff',
        fontStyle: 'bold',
      })
      .setOrigin(0.5);

    this.topBannerSubText = this.add
      .text(0, 11, 'Ruang Kerja Karyawan & Kolaborasi Tim', {
        fontFamily: 'system-ui, -apple-system, sans-serif',
        fontSize: '11px',
        color: '#94a3b8',
      })
      .setOrigin(0.5);

    this.topBannerContainer.add([
      this.topBannerBg,
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

      // Update persistent top-left mini pill (clean typography, no emoji)
      this.locationPillText.setText(detected.name);
      this.locationPillText.setColor(detected.textColor);
      const pillWidth = Math.max(180, this.locationPillText.width + 24);
      this.locationPillBg.setSize(pillWidth, 32);
      this.locationPillBg.setStrokeStyle(1.5, detected.borderColor);

      // Trigger TOP-AREA announcement banner
      this.triggerTopBanner(detected);

      // Notify React UI
      EventBus.emit(GAME_EVENTS.ZONE_CHANGED, {
        zoneId: detected.id,
        name: detected.name,
      });
      if (typeof localStorage !== 'undefined') {
        localStorage.setItem('neurosim_current_zone_id', detected.id);
      }
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
    this.topBannerTitleText.setText(zone.name);
    this.topBannerSubText.setText(zone.subtitle);
    this.topBannerBg.setStrokeStyle(1.5, zone.borderColor);

    const bannerW = Math.max(380, this.topBannerTitleText.width + 60);
    this.topBannerBg.setSize(bannerW, 50);

    // Initial state: above viewport in screen space
    this.topBannerContainer.setY(hiddenY).setAlpha(0);

    // Drops down to targetY (screen Y = 85px), holds for 2.4s, then slides back up smoothly
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
    // 1. Under AFK Room (x: 95..1166, floor ends at y=1370)
    this.addStaticWall(631, 1453, 1072, 166);

    // 2. Entrance Hallway Bottom Boundary (x: 1166..1420, floor ends at y=1330)
    this.addStaticWall(1293, 1433, 254, 206);

    // 3. Bottom wall right of entrance (Under corridor window: x: 1420..1890, floor ends at y=1324)
    this.addStaticWall(1655, 1430, 470, 212);

    // 4. Vertical jog step between corridor window and main hall window (at x = 1890)
    this.addStaticWall(1890, 1347, 30, 56);

    // 5. Bottom wall under Workstation Utama (x: 1890..2600, floor ends at y=1370)
    this.addStaticWall(2245, 1453, 710, 166);

    // -----------------------------------------------------------------------
    // C. VERTICAL DIVIDING WALL (Left Rooms vs Corridor at X = 1166)
    //    Generous walk-through clearances for 2.0 scale:
    //    - Pantry Door: y = 290 .. 445 (OPEN gap = 155px)
    //    - Meeting Room Door: y = 700 .. 855 (OPEN gap = 155px)
    //    - AFK Room Door: y = 1115 .. 1245 (OPEN gap = 130px)
    // -----------------------------------------------------------------------
    // Solid 1: Above Pantry Door (y: 105..290)
    this.addStaticWall(1166, 198, 56, 185);

    // Solid 2: Between Pantry & Meeting Room Doors (y: 445..700)
    this.addStaticWall(1166, 573, 56, 255);

    // Solid 3: Between Meeting Room & AFK Room Doors (y: 855..1115)
    this.addStaticWall(1166, 985, 56, 260);

    // Solid 4: Below AFK Room Door down to bottom wall (y: 1245..1370)
    this.addStaticWall(1166, 1308, 56, 125);

    // -----------------------------------------------------------------------
    // D. HORIZONTAL ROOM DIVIDERS (Left Rooms)
    // -----------------------------------------------------------------------
    // Divider 1: Between Pantry & Meeting Room at y = 518
    this.addStaticWall(633, 518, 1066, 44);

    // Divider 2: Between Meeting Room & AFK Room at y = 970
    this.addStaticWall(633, 970, 1066, 44);

    // -----------------------------------------------------------------------
    // E. RUANG EKSEKUTIF & MANAJEMEN (BU RINA) WALLS & DOORWAY
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
    // 1. PANTRY & DAPUR (Dimas - Skenario 2)
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
    this.addSeat('Kursi Bar', 770, 205, 'north', 'stool', 0, -2);
    this.addSeat('Kursi Bar', 850, 205, 'north', 'stool', 0, -2);

    // Cafe Tables & Seating (Break Area)
    this.addDecorativeProp('rug', 340, 330);
    this.addSolidProp('cafe-table', 340, 320, 56, 52);
    this.addDecorativeProp('cafe-chair', 280, 320);
    this.addDecorativeProp('cafe-chair', 400, 320);
    this.addSeat('Kursi Kafe', 280, 320, 'east', 'chair', -4, 0);
    this.addSeat('Kursi Kafe', 400, 320, 'west', 'chair', 4, 0);

    this.addDecorativeProp('rug', 650, 330);
    this.addSolidProp('cafe-table', 650, 320, 56, 52);
    this.addDecorativeProp('cafe-chair', 590, 320);
    this.addDecorativeProp('cafe-chair', 710, 320);
    this.addSeat('Kursi Kafe', 590, 320, 'east', 'chair', -4, 0);
    this.addSeat('Kursi Kafe', 710, 320, 'west', 'chair', 4, 0);

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
    // 2. RUANG RAPAT & KONFERENSI (Pak Hendra / Klien - Skenario 3)
    // =======================================================================
    // Boardroom Carpet
    this.addDecorativeProp('rug', 585, 720);

    // Impenetrable Boardroom Table (Solid 4 Desks Cluster)
    this.addSolidDesk(450, 720);
    this.addSolidDesk(540, 720);
    this.addSolidDesk(630, 720);
    this.addSolidDesk(720, 720);

    // Meeting room center accent — NO COMPUTERS in meeting room as requested!
    this.addDecorativeProp('plant-small', 630, 695);

    // Executive Meeting Chairs around table (Comfortable, uncrowded spacing)
    this.addDecorativeProp('office-chair', 470, 645);
    this.addDecorativeProp('office-chair', 585, 645);
    this.addDecorativeProp('office-chair', 700, 645);
    this.addDecorativeProp('office-chair-north', 470, 795);
    this.addDecorativeProp('office-chair-north', 585, 795);
    this.addDecorativeProp('office-chair-north', 700, 795);
    this.addDecorativeProp('office-chair-east', 360, 720); // Head of table facing East towards table

    // Register interactive seats in Meeting Room
    this.addSeat('Kursi Rapat', 470, 645, 'south', 'chair', 0, 4);
    this.addSeat('Kursi Rapat', 700, 645, 'south', 'chair', 0, 4);
    this.addSeat('Kursi Rapat', 470, 795, 'north', 'chair', 0, -4);
    this.addSeat('Kursi Rapat', 585, 795, 'north', 'chair', 0, -4);
    this.addSeat('Kursi Rapat', 700, 795, 'north', 'chair', 0, -4);
    this.addSeat('Kursi Utama Rapat', 360, 720, 'east', 'chair', -6, 0);

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
    // 3. AFK ROOM & AREA SANTAI (Relaksasi, Istirahat, dan Baca Buku)
    // =======================================================================
    // --- SISI ATAS (Along Top Wall y = 970..1090) ---
    // Sudut Baca Buku & Mini Library Tenang (x: 150..340)
    this.addSolidProp('bookcase', 210, 1015, 75, 52);
    this.addSolidProp('bookcase', 290, 1015, 75, 52);
    this.addDecorativeProp('floor-lamp', 150, 1020);
    this.addDecorativeProp('wall-art', 360, 975);

    // Lounge Set Atas (Sofa bersandar rapi di dinding utara menghadap South ke dalam ruangan,
    // coffee-table tepat di depannya pada y=1075, dan armchair-east & armchair-west di samping)
    this.addDecorativeProp('rug', 630, 1055);
    this.addSolidProp('sofa', 630, 1015, 110, 48);
    this.addSolidProp('coffee-table', 630, 1075, 64, 34);
    this.addSolidProp('armchair-east', 515, 1075, 36, 32);
    this.addSolidProp('armchair-west', 745, 1075, 36, 32);
    this.addSeat('Sofa Santai', 595, 1015, 'south', 'sofa', 0, 4);
    this.addSeat('Sofa Santai', 665, 1015, 'south', 'sofa', 0, 4);
    this.addSeat('Armchair Santai Kiri', 515, 1075, 'east', 'armchair', -4, 0);
    this.addSeat('Armchair Santai Kanan', 745, 1075, 'west', 'armchair', 4, 0);
    this.addDecorativeProp('wall-art', 630, 975);
    this.addDecorativeProp('wall-clock', 790, 975);

    // Fasilitas Refreshment Sudut Atas (x: 950..1120)
    this.addSolidProp('water-cooler', 1030, 1015, 48, 48);
    this.addDecorativeProp('plant-small', 1090, 1015);
    this.addDecorativeProp('floor-lamp', 960, 1015);

    // --- SISI SEBERANG / BAWAH (Along Bottom Wall y = 1250..1360) ---
    // Meja & Kursi-kursian Santai Seberang Kiri: Set Meja Kafe Santai (x: 330..510, y: 1290)
    this.addDecorativeProp('rug', 420, 1290);
    this.addSolidProp('cafe-table', 420, 1290, 56, 52);
    this.addDecorativeProp('cafe-chair', 345, 1290);
    this.addDecorativeProp('cafe-chair', 495, 1290);
    this.addSeat('Kursi Kafe Santai Kiri', 345, 1290, 'east', 'chair', -4, 0);
    this.addSeat('Kursi Kafe Santai Kanan', 495, 1290, 'west', 'chair', 4, 0);
    this.addSolidProp('plant-large', 160, 1315, 50, 50);
    this.addDecorativeProp('floor-lamp', 240, 1315);

    // Meja & Kursi-kursian Santai Seberang Kanan: Set Meja Diskusi & Armchair (x: 710..890, y: 1290)
    // Meja di tengah diapit armchair-east (kiri) dan armchair-west (kanan) serta sofa-north
    this.addDecorativeProp('rug', 800, 1290);
    this.addSolidProp('coffee-table', 800, 1270, 64, 34);
    this.addSolidProp('armchair-east', 690, 1270, 36, 32);
    this.addSolidProp('armchair-west', 910, 1270, 36, 32);
    this.addSolidProp('sofa-north', 800, 1330, 104, 48);
    this.addSeat('Armchair Santai Seberang Kiri', 690, 1270, 'east', 'armchair', -4, 0);
    this.addSeat('Armchair Santai Seberang Kanan', 910, 1270, 'west', 'armchair', 4, 0);
    this.addSeat('Sofa Santai Seberang', 765, 1330, 'north', 'sofa', 0, -22);
    this.addSeat('Sofa Santai Seberang', 835, 1330, 'north', 'sofa', 0, -22);
    this.addSolidProp('plant-large', 1090, 1315, 50, 50);
    this.addDecorativeProp('floor-lamp', 1000, 1315);

    // =======================================================================
    // 4. RUANG EKSEKUTIF & MANAJEMEN (Bu Rina - Skenario 1)
    // =======================================================================
    // Luxury Executive Carpet
    this.addDecorativeProp('rug', 2150, 245);

    // Grand Executive Desk Suite (Meja utama luas tanpa meja sayap yang menghalangi)
    this.addSolidDesk(2105, 235); // Meja eksekutif kiri
    this.addSolidDesk(2195, 235); // Meja eksekutif kanan

    // PC menghadap ke arah bos (screen faces North toward Bu Rina, casing back faces visitors)
    this.addDecorativeProp('computer-north', 2150, 225);
    this.addDecorativeProp('plant-small', 2225, 215);

    // Kursi Eksekutif Bu Rina di belakang meja utama menghadap South
    this.addDecorativeProp('office-chair', 2150, 155).setDepth(150);

    // Kursi Tamu di depan meja utama menghadap ke Bu Rina
    this.addSolidProp('armchair-north', 2105, 335, 58, 52);  // Guest Chair 1
    this.addSolidProp('armchair-north', 2195, 335, 58, 52);  // Guest Chair 2

    // Register interactive seats in Executive Suite
    this.addSeat('Armchair Tamu Kiri', 2105, 335, 'north', 'armchair', 0, -4);
    this.addSeat('Armchair Tamu Kanan', 2195, 335, 'north', 'armchair', 0, -4);

    // Executive Library Wall
    this.addSolidProp('bookcase', 1850, 140, 75, 58);
    this.addSolidProp('bookcase', 1930, 140, 75, 58);
    this.addSolidProp('bookcase', 2370, 140, 75, 58);
    this.addSolidProp('bookcase', 2450, 140, 75, 58);

    // Executive Archives & Floor Lamp
    this.addSolidProp('filing-cabinet', 1780, 215, 58, 58);
    this.addSolidProp('filing-cabinet', 1780, 285, 58, 58);
    this.addDecorativeProp('floor-lamp', 2530, 145);

    // Greenery & Accents (tucked against corners)
    this.addSolidProp('plant-large', 1780, 440, 52, 52);
    this.addSolidProp('plant-large', 2550, 235, 52, 52);
    this.addSolidProp('plant-large', 2550, 440, 52, 52);
    this.addDecorativeProp('wall-art', 2030, 100);
    this.addDecorativeProp('wall-art', 2270, 100);
    this.addDecorativeProp('wall-clock', 2150, 100);

    // =======================================================================
    // 5. WORKSTATION UTAMA (Klaster Pod Meja Tim yang Rapi)
    // =======================================================================
    // Modern Workstation Pods (2×2 Desk Islands) — Rapi, Padat, Profesional
    // Tidak amburadul: tertata simetris dengan aisle/lorong luas & tidak menutupi pintu!

    // Pod 1 (Top-Left): Frontend & UI (Termasuk MEJA KAMU)
    this.createWorkstationPod(1750, 740, 'left');

    // Pod 2 (Top-Right): Backend & AI
    this.createWorkstationPod(2210, 740);

    // Pod 3 (Bottom-Left): Game Engine
    this.createWorkstationPod(1750, 1040);

    // Pod 4 (Bottom-Right): QA & Otomasi
    this.createWorkstationPod(2210, 1040);

    // Breakout Coffee & Discussion Lounge (Ditempatkan rapi di tepi jendela selatan)
    this.addDecorativeProp('rug', 2100, 1270);
    this.addSolidProp('sofa', 2100, 1245, 108, 54);
    this.addSolidProp('coffee-table', 2100, 1295, 64, 38);
    this.addSolidProp('armchair-east', 1995, 1295, 36, 32);
    this.addSolidProp('armchair-west', 2205, 1295, 36, 32);
    this.addSeat('Sofa Breakout Kiri', 2065, 1245, 'south', 'sofa', 0, 4);
    this.addSeat('Sofa Breakout Kanan', 2135, 1245, 'south', 'sofa', 0, 4);
    this.addSeat('Armchair Breakout Kiri', 1995, 1295, 'east', 'armchair', -4, 0);
    this.addSeat('Armchair Breakout Kanan', 2205, 1295, 'west', 'armchair', 4, 0);
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
    // Render visual desk with baseline depth sorting at base
    this.add
      .image(x, y, 'prop-desk')
      .setScale(PROP_SCALE)
      .setDepth(y + 52);

    // Precise solid barrier covering full desk surface and floor contact (no clipping!)
    const col = this.add.rectangle(x, y + 16, 92, 54, 0x000000, 0);
    this.physics.add.existing(col, true);
    (col.body as Phaser.Physics.Arcade.StaticBody).updateFromGameObject();
    this.obstacles.add(col);
  }

  private createWorkstationPod(
    podX: number,
    podY: number,
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

    // 2. Computers & Monitors (Screen 'yang bergambar' strictly faces toward the chair!)
    // North desks: user sits at northDeskY - 56 facing South -> screen must face North toward chair!
    // Rear casing faces camera (computer-north), screen faces chair.
    this.addDecorativeProp('computer-north', leftDeskX, northDeskY - 8);
    this.addDecorativeProp('computer-north', rightDeskX, northDeskY - 8);
    // South desks: user sits at southDeskY + 56 facing North -> screen must face South toward chair!
    // Illuminated screen faces camera (computer), screen faces chair.
    this.addDecorativeProp('computer', leftDeskX, southDeskY - 12);
    this.addDecorativeProp('computer', rightDeskX, southDeskY - 12);

    // Center seam succulent removed per user request

    // 3. Ergonomic Office Chairs
    // North chairs (sitting above desks facing south)
    this.addDecorativeProp('office-chair', leftDeskX, northDeskY - 56);
    this.addDecorativeProp('office-chair', rightDeskX, northDeskY - 56);
    // South chairs (sitting below desks facing north)
    this.addDecorativeProp('office-chair-north', leftDeskX, southDeskY + 56);
    this.addDecorativeProp('office-chair-north', rightDeskX, southDeskY + 56);

    // Register interactive seats for workstation
    this.addSeat('Kursi Kerja', leftDeskX, northDeskY - 56, 'south', 'chair', 0, 4);
    this.addSeat('Kursi Kerja', rightDeskX, northDeskY - 56, 'south', 'chair', 0, 4);
    this.addSeat('Kursi Kerja', leftDeskX, southDeskY + 56, 'north', 'chair', 0, -4);
    this.addSeat('Kursi Kerja', rightDeskX, southDeskY + 56, 'north', 'chair', 0, -4);

    // 4. 100% Solid Physics Collider covering entire 4-desk island from top north edge to bottom south edge
    const podCollider = this.add.rectangle(podX, podY + 12, 212, 120, 0x000000, 0);
    this.physics.add.existing(podCollider, true);
    (podCollider.body as Phaser.Physics.Arcade.StaticBody).updateFromGameObject();
    this.obstacles.add(podCollider);

    // 5. Player Desk Highlight ("MEJA KAMU")
    if (playerDeskCol) {
      const pX = playerDeskCol === 'left' ? leftDeskX : rightDeskX;
      const pY = southDeskY;

      // Small personalized desk succulent
      this.addDecorativeProp('plant-small', pX - 22, pY - 12);

      // "MEJA KAMU" prominent tag placed above the monitor seam so player standing below never obscures it
      this.add
        .rectangle(pX, pY - 32, 80, 18, 0x1e293b, 0.95)
        .setStrokeStyle(1.5, 0xe0b65d)
        .setDepth(pY + 30);
      this.add
        .text(pX, pY - 32, 'MEJA KAMU', {
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
    // Baseline depth sorting at base of sprite
    const img = this.add
      .image(x, y, `prop-${name}`)
      .setScale(PROP_SCALE)
      .setDepth(y + 52);

    // Ground contact collider aligned with floor contact (no ghost offside barrier!)
    const colH = Math.max(Math.min(bodyH, 48), 30);
    const colY = y + (bodyH >= 50 ? 14 : 20);
    const col = this.add.rectangle(x, colY, bodyW, colH, 0x000000, 0);
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
      .setDepth(name === 'rug' ? 1 : y + 50);
  }

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
      .text(TODO_POS.x, TODO_POS.y - 19, 'PAPAN AGENDA KERJA', {
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
    this.addSolidProp('plant-large', 1230, 990, 52, 52); // Between meeting & AFK room door
    this.addDecorativeProp('floor-lamp', 1600, 180);
  }

  // =========================================================================
  // PLAYER CREATION (BIGGER SCALE 2.0 & ACCURATE COLLIDER)
  // =========================================================================

  private buildPlayer(): void {
    let initialKey = 'char-resident';
    if (typeof localStorage !== 'undefined') {
      try {
        const saved = localStorage.getItem('neurosim_character_config');
        if (saved) {
          const cfg = JSON.parse(saved);
          if (cfg?.archetype && this.textures.exists(`char-${cfg.archetype}`)) {
            initialKey = `char-${cfg.archetype}`;
          }
        }
      } catch {}
    }
    this.playerArchetypeKey = initialKey;
    this.player = this.physics.add.sprite(SPAWN.x, SPAWN.y, initialKey);
    this.player.setScale(CHAR_SCALE);

    // Collision body at feet: nimble & agile with no catching on doorways
    (this.player.body as Phaser.Physics.Arcade.Body)
      .setSize(22, 16)
      .setOffset(21, 44);

    this.player.setCollideWorldBounds(true);
    this.player.play(`${this.playerArchetypeKey}-idle-north`);
    this.player.setDepth((this.player.body as Phaser.Physics.Arcade.Body).bottom);
  }

  // =========================================================================
  // NPC CREATION
  // =========================================================================

  private buildNPCs(): void {
    // 1. Bu Rina — Ruang Eksekutif & Manajemen
    this.spawnNpc(
      'rina',
      'Bu Rina (Atasan)',
      'Head of Department',
      'skenario-1',
      'char-rina',
      NPC_POSITIONS.rina
    );

    // 2. Dimas — Pantry & Dapur
    this.spawnNpc(
      'dimas',
      'Dimas (Rekan Senior)',
      'Senior Engineer',
      'skenario-2',
      'char-dimas',
      NPC_POSITIONS.dimas
    );

    // 3. Pak Hendra — Ruang Rapat & Konferensi
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

    if (id === 'rina') {
      sprite.play(`${spriteKey}-sit-south`);
      sprite.setDepth(210);
    } else {
      sprite.play(`${spriteKey}-idle-south`);
      sprite.setDepth((sprite.body as Phaser.Physics.Arcade.Body).bottom);
    }

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

      const maxDist = npc.id === 'rina' ? 175 : NPC_INTERACT_DIST;
      if (dist < maxDist) {
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
      return;
    }

    // 3. Proximity to Sittable Seats (Chairs, Armchairs, Sofas)
    let nearestSeat: SeatSpot | null = null;
    let minSeatDist = 65; // Proximity threshold
    for (const seat of this.seats) {
      const d = Phaser.Math.Distance.Between(this.player.x, this.player.y, seat.x, seat.y);
      if (d < minSeatDist) {
        nearestSeat = seat;
        minSeatDist = d;
      }
    }

    if (nearestSeat) {
      this.showPrompt(nearestSeat.x, nearestSeat.y - 45, `Tekan [SPASI] Duduk (${nearestSeat.name})`);
      if (Phaser.Input.Keyboard.JustDown(this.keySpace)) {
        this.sitDown(nearestSeat);
      }
    } else {
      this.promptContainer.setVisible(false);
    }
  }


  // =========================================================================
  // SEAT INTERACTION SYSTEM (SIT & STAND)
  // =========================================================================

  private addSeat(
    name: string,
    x: number,
    y: number,
    facing: 'south' | 'north' | 'east' | 'west',
    type: 'chair' | 'sofa' | 'armchair' | 'stool' = 'chair',
    offsetX: number = 0,
    offsetY: number = 0
  ): void {
    this.seats.push({
      id: `seat-${this.seats.length}`,
      name,
      x,
      y,
      sitX: x + offsetX,
      sitY: y + offsetY,
      facing,
      type,
    });
  }

  private sitDown(seat: SeatSpot): void {
    this.isSitting = true;
    this.currentSeat = seat;
    this.lastStandPos = { x: this.player.x, y: this.player.y };
    this.player.setVelocity(0, 0);
    this.player.setPosition(seat.sitX, seat.sitY);
    const sitAnim = `${this.playerArchetypeKey}-sit-${seat.facing}`;
    if (this.anims.exists(sitAnim)) {
      this.player.play(sitAnim, true);
    } else {
      this.player.play(`${this.playerArchetypeKey}-idle-${seat.facing}`, true);
    }
    this.lastDirection = seat.facing;

    // Depth sorting when seated:
    // Chair/sofa decorative prop depth is (y + 50).
    // Facing South: player sits in front of the chair backrest -> player depth must be GREATER than chair depth!
    if (seat.facing === 'south') {
      this.player.setDepth(seat.y + 55);
    } else if (seat.facing === 'north') {
      // Facing North: backrest is in front of player -> player depth is slightly below chair depth
      this.player.setDepth(seat.y + 45);
    } else {
      // Facing East or West: player sits in the cushion between the flanks -> depth must be > chair depth (y + 52)
      this.player.setDepth(seat.y + 55);
    }
    this.showPrompt(seat.sitX, seat.sitY - 56, 'Tekan [SPASI / WASD] Berdiri');

    // Broadcast status duduk ke pemain lain di room online secara realtime
    multiplayerService.sendMovement({
      x: Math.round(seat.sitX),
      y: Math.round(seat.sitY),
      direction: seat.facing,
      anim: sitAnim,
      isMoving: false,
      isSitting: true,
      zone: this.currentZoneId || 'koridor',
    });
  }

  private standUp(): void {
    if (!this.isSitting || !this.currentSeat) return;
    const seat = this.currentSeat;
    this.isSitting = false;
    this.currentSeat = null;

    // Exit strictly BEHIND the chair / into open walkway (prevents clipping through desks/tables!)
    let exitX = seat.x;
    let exitY = seat.y;

    if (seat.type === 'chair' || seat.type === 'stool') {
      if (seat.facing === 'south') {
        // Chair faces South into desk -> step NORTH into the open corridor above the chair!
        exitY = seat.y - 36;
      } else if (seat.facing === 'north') {
        // Chair faces North into desk -> step SOUTH into the open corridor below the chair!
        exitY = seat.y + 36;
      } else if (seat.facing === 'east') {
        // Chair faces East into table -> step WEST into open aisle on left!
        exitX = seat.x - 36;
      } else if (seat.facing === 'west') {
        // Chair faces West into table -> step EAST into open aisle on right!
        exitX = seat.x + 36;
      }
    } else {
      // For sofas and lounge sets: step into open room space away from the wall
      if (seat.facing === 'south') {
        exitY = seat.y + 44;
      } else if (seat.facing === 'north') {
        exitY = seat.y - 44;
      } else if (seat.facing === 'east') {
        exitX = seat.x + 36;
      } else if (seat.facing === 'west') {
        exitX = seat.x - 36;
      }
    }

    this.player.setPosition(exitX, exitY);
    this.player.setDepth((this.player.body as Phaser.Physics.Arcade.Body).bottom);
    const idleAnim = `${this.playerArchetypeKey}-idle-${this.lastDirection}`;
    if (this.anims.exists(idleAnim)) {
      this.player.play(idleAnim, true);
    }
    this.promptContainer.setVisible(false);

    // Broadcast status berdiri ke pemain lain di room online secara realtime
    multiplayerService.sendMovement({
      x: Math.round(exitX),
      y: Math.round(exitY),
      direction: (this.lastDirection === 'north' || this.lastDirection === 'south' || this.lastDirection === 'east' || this.lastDirection === 'west') ? this.lastDirection : 'south',
      anim: idleAnim,
      isMoving: false,
      isSitting: false,
      zone: this.currentZoneId || 'koridor',
    });
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

  private resetMovementKeys = (): void => {
    if (this.player && this.player.body) {
      this.player.setVelocity(0, 0);
      this.player.play(`${this.playerArchetypeKey}-idle-${this.lastDirection}`, true);
    }
    this.safeDisableCapture();
    if (this.input?.keyboard) {
      this.input.keyboard.resetKeys();
    }
    if (this.wasd) {
      this.wasd.W?.reset();
      this.wasd.A?.reset();
      this.wasd.S?.reset();
      this.wasd.D?.reset();
    }
    if (this.cursors) {
      this.cursors.up?.reset();
      this.cursors.down?.reset();
      this.cursors.left?.reset();
      this.cursors.right?.reset();
    }
    if (this.keyE) {
      this.keyE.reset();
    }
  };

  private lockPlayer = (): void => {
    this.isPlayerLocked = true;
    this.resetMovementKeys();
    if (this.promptContainer) {
      this.promptContainer.setVisible(false);
    }
  };

  private handleCloseDialog = (): void => {
    // Only re-enable capture if not focused in any input
    const activeEl = typeof document !== 'undefined' ? document.activeElement : null;
    const isTyping = Boolean(
      activeEl &&
        (activeEl.tagName === 'INPUT' ||
          activeEl.tagName === 'TEXTAREA' ||
          (activeEl as HTMLElement).isContentEditable)
    );

    if (!isTyping) {
      this.isPlayerLocked = false;
      this.resetMovementKeys();
      this.safeEnableCapture();
    }
  };

  private handleWindowBlur = (): void => {
    if (!this.sys || !this.sys.isActive()) return;
    this.resetMovementKeys();
  };

  private handleWindowFocus = (): void => {
    if (!this.sys || !this.sys.isActive()) return;
    this.resetMovementKeys();
  };

  private handleWindowFocusIn = (e: FocusEvent): void => {
    if (!this.sys || !this.sys.isActive()) return;
    const target = e.target as HTMLElement | null;
    if (
      target &&
      (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable)
    ) {
      this.lockPlayer();
    }
  };

  private handleWindowFocusOut = (e: FocusEvent): void => {
    if (this.focusTimeoutId) {
      window.clearTimeout(this.focusTimeoutId);
      this.focusTimeoutId = null;
    }

    if (!this.sys || !this.sys.isActive()) return;

    const target = e.target as HTMLElement | null;
    if (
      target &&
      (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable)
    ) {
      this.focusTimeoutId = window.setTimeout(() => {
        if (!this.sys || !this.sys.isActive()) return;
        const nextActive = typeof document !== 'undefined' ? document.activeElement : null;
        const stillTyping = Boolean(
          nextActive &&
            (nextActive.tagName === 'INPUT' ||
              nextActive.tagName === 'TEXTAREA' ||
              (nextActive as HTMLElement).isContentEditable)
        );
        if (!stillTyping && !this.isPlayerLocked) {
          this.safeEnableCapture();
        }
      }, 50);
    }
  };

  // =========================================================================
  // MULTIPLAYER REMOTE PLAYERS & STATUS HELPERS
  // =========================================================================

  private getStatusColorHex(status?: UserStatus | string): number {
    switch (status) {
      case 'available':
      case 'online':
        return 0x10b981; // emerald / green
      case 'busy':
        return 0xef4444; // rose / red
      case 'pantry':
        return 0xf59e0b; // amber / coffee
      default:
        return 0x10b981;
    }
  }

  private drawStatusDot(graphics: Phaser.GameObjects.Graphics, x: number, y: number, status?: UserStatus | string): void {
    graphics.clear();
    const color = this.getStatusColorHex(status);
    graphics.fillStyle(color, 1);
    graphics.fillCircle(x, y, 3.5);
    graphics.lineStyle(1, 0x141824, 0.85);
    graphics.strokeCircle(x, y, 3.5);
  }

  private handleRemotePlayerJoined = (presence: PlayerPresence): void => {
    if (!presence || !presence.socketId) return;

    // Clean up if already exists
    if (this.remotePlayers.has(presence.socketId)) {
      this.handleRemotePlayerLeft({ socketId: presence.socketId });
    }

    const archetype = presence.archetype || presence.characterConfig?.archetype || 'resident';
    let archetypeKey = `char-${archetype}`;
    if (!this.textures.exists(archetypeKey)) {
      archetypeKey = 'char-resident';
    }

    const container = this.add.container(presence.x, presence.y);
    container.setDepth(presence.y);

    const sprite = this.add.sprite(0, 0, archetypeKey);
    sprite.setScale(CHAR_SCALE);
    const isSitting = Boolean(presence.isSitting);
    const initialAnim = isSitting
      ? `${archetypeKey}-sit-${presence.direction || 'south'}`
      : `${archetypeKey}-idle-${presence.direction || 'south'}`;
    if (this.anims.exists(initialAnim)) {
      sprite.play(initialAnim);
    }

    if (isSitting) {
      if (presence.direction === 'north') {
        container.setDepth(presence.y + 45);
      } else {
        container.setDepth(presence.y + 55);
      }
    }

    // Nametag & Status indicator
    const displayName = presence.fullName || presence.username || 'Tamu';
    const nameText = this.add.text(0, 0, displayName, {
      fontFamily: 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
      fontSize: '11px',
      color: '#f4ead5',
      fontStyle: 'bold',
    }).setOrigin(0, 0.5);

    const paddingX = 8;
    const dotWidth = 12;
    const pillW = Math.max(52, nameText.width + paddingX * 2 + dotWidth);
    const pillH = 20;
    const halfW = pillW / 2;
    const pillY = -54;

    const nameBg = this.add.graphics();
    nameBg.fillStyle(0x141824, 0.88);
    nameBg.lineStyle(1.2, 0x355c5a, 0.9);
    nameBg.fillRoundedRect(-halfW, pillY - pillH / 2, pillW, pillH, 5);
    nameBg.strokeRoundedRect(-halfW, pillY - pillH / 2, pillW, pillH, 5);

    const statusDot = this.add.graphics();
    this.drawStatusDot(statusDot, -halfW + 8, pillY, presence.status);

    nameText.setPosition(-halfW + 16, pillY);

    container.add([sprite, nameBg, statusDot, nameText]);

    // Entrance pop-in animation
    container.setScale(0);
    container.setAlpha(0);
    this.tweens.add({
      targets: container,
      scale: 1,
      alpha: 1,
      duration: 250,
      ease: 'Back.easeOut',
    });

    const record: RemotePlayerRecord = {
      presence,
      container,
      sprite,
      nameBg,
      nameText,
      statusDot,
      targetX: presence.x,
      targetY: presence.y,
      direction: presence.direction || 'south',
      isMoving: Boolean(presence.isMoving),
      isSitting,
      sitAnim: presence.anim,
      archetypeKey,
      activeEmotes: [],
      activeChatBubble: null,
    };

    this.remotePlayers.set(presence.socketId, record);
  };

  private handleRemotePlayerMoved = (data: PlayerMovementPacket): void => {
    if (!data || !data.socketId) return;
    const record = this.remotePlayers.get(data.socketId);
    if (!record) return;

    record.targetX = data.x;
    record.targetY = data.y;
    record.direction = data.direction;
    record.isMoving = data.isMoving;
    record.isSitting = Boolean(data.isSitting);
    record.sitAnim = data.anim;
  };

  private handleRemotePlayerLeft = ({ socketId }: { socketId: string }): void => {
    const record = this.remotePlayers.get(socketId);
    if (!record) return;

    if (record.activeChatBubble && record.activeChatBubble.container.active) {
      record.activeChatBubble.container.destroy();
    }
    for (const e of record.activeEmotes) {
      if (e.container.active) e.container.destroy();
    }

    this.tweens.add({
      targets: record.container,
      alpha: 0,
      scale: 0.6,
      duration: 200,
      onComplete: () => {
        if (record.container.active) {
          record.container.destroy();
        }
      },
    });

    this.remotePlayers.delete(socketId);
  };

  private handleRemotePlayerStatus = ({ socketId, status }: { socketId: string; status: UserStatus }): void => {
    const record = this.remotePlayers.get(socketId);
    if (!record) return;
    record.presence.status = status;
    const pillW = Math.max(52, record.nameText.width + 16 + 12);
    const halfW = pillW / 2;
    const pillY = -54;
    this.drawStatusDot(record.statusDot, -halfW + 8, pillY, status);
  };

  // =========================================================================
  // FLOATING REACTION EMOTES (LOCAL & REMOTE)
  // =========================================================================

  private spawnReactionForTarget(
    targetX: number,
    targetY: number,
    emoji: string,
    targetEmotesList: { container: Phaser.GameObjects.Container; offsetX: number; offsetY: number }[]
  ): void {
    if (targetEmotesList.length >= 3) {
      const oldest = targetEmotesList.shift();
      if (oldest && oldest.container.active) {
        oldest.container.destroy();
      }
    }

    // 2. Spawn offset directly above player head with slight horizontal jitter
    // Proporsional: tidak kedeketan saat tanpa bubblechat, dan tidak kejauhan saat ada bubblechat
    const offsetX = Phaser.Math.Between(-8, 8);
    const baseEmoteY = this.isScreenSharingActive ? 64 : 54;
    let startOffsetY = baseEmoteY;
    if (this.activeChatBubble && this.activeChatBubble.container.active) {
      startOffsetY = Math.max(baseEmoteY, this.activeChatBubble.offsetY + 8);
    }

    const container = this.add.container(targetX + offsetX, targetY - startOffsetY);
    container.setDepth(targetY + 1040);

    const radius = 14;
    const bg = this.add.graphics();
    bg.fillStyle(0xf4ead5, 0.95);
    bg.lineStyle(1.5, 0x355c5a, 0.9);
    bg.fillCircle(0, 0, radius);
    bg.strokeCircle(0, 0, radius);

    const txt = this.add.text(0, 0, emoji, {
      fontFamily: '"Segoe UI Emoji", "Noto Color Emoji", "Apple Color Emoji", sans-serif',
      fontSize: '15px',
    }).setOrigin(0.5, 0.5);

    container.add([bg, txt]);
    container.setScale(0.2);
    container.setAlpha(0);

    const emoteRecord = {
      container,
      offsetX,
      offsetY: startOffsetY,
    };
    targetEmotesList.push(emoteRecord);

    this.tweens.add({
      targets: container,
      scale: 1,
      alpha: 1,
      duration: 160,
      ease: 'Back.easeOut',
      onComplete: () => {
        // Float up smoothly and fade out (melayang lembut setinggi 22px agar proporsional dan tidak terbang kejauhan)
        this.tweens.addCounter({
          from: startOffsetY,
          to: startOffsetY + 22,
          duration: 1400,
          delay: 350,
          ease: 'Cubic.easeOut',
          onUpdate: (tw) => {
            emoteRecord.offsetY = tw.getValue() ?? startOffsetY;
            const progress = tw.progress;
            if (progress > 0.4) {
              container.setAlpha(1 - (progress - 0.4) / 0.6);
            }
          },
          onComplete: () => {
            if (container.active) {
              container.destroy();
            }
            const idx = targetEmotesList.indexOf(emoteRecord);
            if (idx !== -1) {
              targetEmotesList.splice(idx, 1);
            }
          },
        });
      },
    });
  }

  private handleTriggerReaction = ({ emoji, socketId }: { emoji: string; socketId?: string }): void => {
    if (!emoji) return;

    if (socketId && this.remotePlayers.has(socketId)) {
      const record = this.remotePlayers.get(socketId)!;
      this.spawnReactionForTarget(record.container.x, record.container.y, emoji, record.activeEmotes);
      return;
    }

    if (!this.player || !this.player.active) return;
    this.spawnReactionForTarget(this.player.x, this.player.y, emoji, this.activeEmotes);
  };

  // =========================================================================
  // LIVE CHAT SPEECH BUBBLE (LOCAL & REMOTE)
  // =========================================================================

  private spawnChatBubbleForTarget(
    targetX: number,
    targetY: number,
    text: string,
    onCreated: (bubble: { container: Phaser.GameObjects.Container; offsetY: number }) => void
  ): void {
    const maxTextWidth = 190;
    const displayText = text.length > 80 ? text.slice(0, 77) + '...' : text;

    const container = this.add.container(targetX, targetY);
    container.setDepth(targetY + 1050);

    const txt = this.add.text(0, -3, displayText, {
      fontFamily: 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
      fontSize: '11px',
      color: '#242a38',
      align: 'center',
      wordWrap: { width: maxTextWidth, useAdvancedWrap: true },
    }).setOrigin(0.5, 0.5);

    const paddingX = 9;
    const paddingY = 5;
    const bw = Math.max(46, Math.min(220, txt.width + paddingX * 2));
    const bh = txt.height + paddingY * 2;
    const radius = 6;
    const halfW = bw / 2;
    const halfH = bh / 2;
    const centerY = -3;

    const bg = this.add.graphics();
    bg.fillStyle(0xf4ead5, 0.96);
    bg.lineStyle(1.5, 0x355c5a, 0.95);

    bg.fillRoundedRect(-halfW, centerY - halfH, bw, bh, radius);
    bg.strokeRoundedRect(-halfW, centerY - halfH, bw, bh, radius);

    bg.fillTriangle(-4, centerY + halfH, 4, centerY + halfH, 0, centerY + halfH + 5);
    bg.beginPath();
    bg.moveTo(-4, centerY + halfH);
    bg.lineTo(0, centerY + halfH + 5);
    bg.lineTo(4, centerY + halfH);
    bg.strokePath();

    const cover = this.add.graphics();
    cover.fillStyle(0xf4ead5, 1);
    cover.fillRect(-3, centerY + halfH - 1, 6, 2);

    container.add([bg, cover, txt]);

    // Position above avatar head: avatar top is ~48px above feet, tail length 5px
    // Pas di atas kepala saat normal (46px), dan pas di atas badge saat live screen aktif (62px)
    const baseOffset = this.isScreenSharingActive ? 62 : 46;
    const offsetY = baseOffset + halfH;
    container.setPosition(targetX, targetY - offsetY);

    container.setScale(0.5);
    container.setAlpha(0);

    const bubbleRecord = { container, offsetY };
    onCreated(bubbleRecord);

    this.tweens.add({
      targets: container,
      scale: 1,
      alpha: 1,
      duration: 150,
      ease: 'Back.easeOut',
      onComplete: () => {
        this.tweens.addCounter({
          from: 1,
          to: 0,
          duration: 4200,
          onUpdate: (tw) => {
            const progress = tw.progress;
            if (progress > 0.8) {
              container.setAlpha(1 - (progress - 0.8) / 0.2);
            }
          },
          onComplete: () => {
            if (container.active) {
              container.destroy();
            }
          },
        });
      },
    });
  }

  private handleTriggerChatBubble = ({ text, socketId }: { text: string; socketId?: string }): void => {
    if (!text || !text.trim()) return;

    if (socketId && this.remotePlayers.has(socketId)) {
      const record = this.remotePlayers.get(socketId)!;
      if (record.activeChatBubble && record.activeChatBubble.container.active) {
        record.activeChatBubble.container.destroy();
        record.activeChatBubble = null;
      }
      this.spawnChatBubbleForTarget(record.container.x, record.container.y, text, (bubble) => {
        record.activeChatBubble = bubble;
      });
      return;
    }

    if (!this.player || !this.player.active) return;
    if (this.activeChatBubble && this.activeChatBubble.container.active) {
      this.activeChatBubble.container.destroy();
      this.activeChatBubble = null;
    }
    this.spawnChatBubbleForTarget(this.player.x, this.player.y, text, (bubble) => {
      this.activeChatBubble = bubble;
    });
  };

  // =========================================================================
  // CLEANUP
  // =========================================================================

  shutdown(): void {
    if (this.focusTimeoutId) {
      window.clearTimeout(this.focusTimeoutId);
      this.focusTimeoutId = null;
    }
    this.safeDisableCapture();
    this.scale.off('resize', this.handleResize, this);
    EventBus.off(GAME_EVENTS.CLOSE_DIALOG, this.handleCloseDialog, this);
    EventBus.off(GAME_EVENTS.CLOSE_TODO_LIST, this.handleCloseDialog, this);
    EventBus.off(GAME_EVENTS.PAUSE_INPUT, this.lockPlayer, this);
    EventBus.off(GAME_EVENTS.RESUME_INPUT, this.handleCloseDialog, this);
    if (typeof window !== 'undefined') {
      window.removeEventListener('focusin', this.handleWindowFocusIn);
      window.removeEventListener('focusout', this.handleWindowFocusOut);
      window.removeEventListener('blur', this.handleWindowBlur);
      window.removeEventListener('focus', this.handleWindowFocus);
    }
    EventBus.off(GAME_EVENTS.TRIGGER_REACTION, this.handleTriggerReaction, this);
    EventBus.off(GAME_EVENTS.TRIGGER_CHAT_BUBBLE, this.handleTriggerChatBubble, this);
    EventBus.off(GAME_EVENTS.UPDATE_PLAYER_CHARACTER, this.handleUpdatePlayerCharacter, this);
    EventBus.off(GAME_EVENTS.TELEPORT_TO_ROOM, this.handleTeleportToRoom, this);
    EventBus.off(GAME_EVENTS.SCREEN_SHARE_CHANGED, this.handleScreenShareChanged, this);
    if (this.screenShareBadgeContainer && this.screenShareBadgeContainer.active) {
      this.screenShareBadgeContainer.destroy();
      this.screenShareBadgeContainer = null;
    }
    EventBus.off(GAME_EVENTS.REMOTE_PLAYER_JOINED, this.handleRemotePlayerJoined, this);
    EventBus.off(GAME_EVENTS.REMOTE_PLAYER_MOVED, this.handleRemotePlayerMoved, this);
    EventBus.off(GAME_EVENTS.REMOTE_PLAYER_LEFT, this.handleRemotePlayerLeft, this);
    EventBus.off(GAME_EVENTS.REMOTE_PLAYER_STATUS, this.handleRemotePlayerStatus, this);
    if (this.activeChatBubble && this.activeChatBubble.container.active) {
      this.activeChatBubble.container.destroy();
      this.activeChatBubble = null;
    }
    for (const item of this.activeEmotes) {
      if (item.container.active) item.container.destroy();
    }
    this.activeEmotes = [];

    // Clean up all remote player avatars
    for (const [, record] of this.remotePlayers.entries()) {
      if (record.activeChatBubble && record.activeChatBubble.container.active) {
        record.activeChatBubble.container.destroy();
      }
      for (const item of record.activeEmotes) {
        if (item.container.active) item.container.destroy();
      }
      if (record.container.active) {
        record.container.destroy();
      }
    }
    this.remotePlayers.clear();
  }

  destroy(): void {
    this.shutdown();
  }
  private createCustomAnimations(key: string): void {
    const idleConfigs = [
      { dir: 'south', start: 0 },
      { dir: 'east', start: 9 },
      { dir: 'north', start: 18 },
      { dir: 'west', start: 27 },
    ];
    for (const { dir, start } of idleConfigs) {
      const animKey = `${key}-idle-${dir}`;
      if (this.anims.exists(animKey)) this.anims.remove(animKey);
      this.anims.create({
        key: animKey,
        frames: this.anims.generateFrameNumbers(key, { start, end: start + 8 }),
        frameRate: 3,
        repeat: -1,
      });
    }

    const walkConfigs = [
      { dir: 'south', start: 36 },
      { dir: 'east', start: 45 },
      { dir: 'north', start: 54 },
      { dir: 'west', start: 63 },
    ];
    for (const { dir, start } of walkConfigs) {
      const animKey = `${key}-walk-${dir}`;
      if (this.anims.exists(animKey)) this.anims.remove(animKey);
      this.anims.create({
        key: animKey,
        frames: this.anims.generateFrameNumbers(key, { start, end: start + 7 }),
        frameRate: 10,
        repeat: -1,
      });
    }

    // 4 Diagonal Walk Animations (Serong)
    const diagonalWalkConfigs = [
      { dir: 'south-east', start: 45 },
      { dir: 'south-west', start: 63 },
      { dir: 'north-east', start: 45 },
      { dir: 'north-west', start: 63 },
    ];
    for (const { dir, start } of diagonalWalkConfigs) {
      const animKey = `${key}-walk-${dir}`;
      if (this.anims.exists(animKey)) this.anims.remove(animKey);
      this.anims.create({
        key: animKey,
        frames: this.anims.generateFrameNumbers(key, { start, end: start + 7 }),
        frameRate: 11,
        repeat: -1,
      });
    }

    // 4 Sitting Animations (Rows 8..11)
    const texture = this.textures.get(key);
    const totalFrames = texture ? texture.frameTotal : 0;
    if (totalFrames >= 108) {
      const sitConfigs = [
        { dir: 'south', start: 72 }, // Row 8: duduk madep bawah
        { dir: 'east', start: 81 },  // Row 9: duduk madep kanan
        { dir: 'north', start: 90 }, // Row 10: duduk madep atas
        { dir: 'west', start: 99 },  // Row 11: duduk madep kiri
      ];
      for (const { dir, start } of sitConfigs) {
        const animKey = `${key}-sit-${dir}`;
        if (this.anims.exists(animKey)) this.anims.remove(animKey);
        this.anims.create({
          key: animKey,
          frames: this.anims.generateFrameNumbers(key, { start, end: start + 8 }),
          frameRate: 2,
          repeat: -1,
        });
      }
    }
  }

  private handleUpdatePlayerCharacter = (payload: any): void => {
    if (!this.player) return;
    const config = payload?.config || payload;

    const isCustom = config?.archetype === 'custom';
    const dataUrl =
      isCustom && typeof localStorage !== 'undefined'
        ? localStorage.getItem('neurosim_character_spritesheet')
        : null;

    if (isCustom && dataUrl) {
      const customKey = 'char-player-custom';
      const img = new Image();
      img.src = dataUrl;
      img.onload = async () => {
        if (!this.scene.isActive()) return;
        let finalImg: HTMLImageElement = img;

        // If cached sheet has old 512px height and we have config, re-composite to 768px!
        if (img.height < 768 && config) {
          try {
            const upgradedCanvas = await generateFullLpcSpritesheet(config);
            const upgradedDataUrl = upgradedCanvas.toDataURL('image/png');
            if (typeof localStorage !== 'undefined') {
              localStorage.setItem('neurosim_character_spritesheet', upgradedDataUrl);
            }
            const upgradedImg = new Image();
            upgradedImg.src = upgradedDataUrl;
            await new Promise((resolve) => {
              upgradedImg.onload = resolve;
            });
            finalImg = upgradedImg;
          } catch (e) {
            console.warn('Could not upgrade custom spritesheet to 768px:', e);
          }
        }

        if (this.textures.exists(customKey)) {
          this.textures.remove(customKey);
        }
        this.textures.addSpriteSheet(customKey, finalImg, {
          frameWidth: 64,
          frameHeight: 64,
        });

        this.createCustomAnimations(customKey);
        this.playerArchetypeKey = customKey;
        this.player.setTexture(customKey);
        // Standardize LPC character height (50px * 1.52 = 76px, matching aligned.png 38px * 2.0 = 76px)
        this.player.setScale(1.52);

        const currentDir =
          this.lastDirection === 'north' ||
          this.lastDirection === 'south' ||
          this.lastDirection === 'east' ||
          this.lastDirection === 'west'
            ? this.lastDirection
            : 'south';

        const idleAnim = `${customKey}-idle-${currentDir}`;
        if (this.anims.exists(idleAnim)) {
          this.player.play(idleAnim, true);
        }
      };
      return;
    }

    const arch = config?.archetype && config.archetype !== 'custom' ? config.archetype : 'resident';
    const newKey = `char-${arch}`;

    if (this.textures.exists(newKey)) {
      this.playerArchetypeKey = newKey;
      this.player.setTexture(newKey);
      this.player.setScale(CHAR_SCALE); // Strictly maintain standard 2.0 scale (76px height)

      const currentDir =
        this.lastDirection === 'north' ||
        this.lastDirection === 'south' ||
        this.lastDirection === 'east' ||
        this.lastDirection === 'west'
          ? this.lastDirection
          : 'south';

      const idleAnim = `${newKey}-idle-${currentDir}`;
      if (this.anims.exists(idleAnim)) {
        this.player.play(idleAnim, true);
      }
    }
  };

  private handleTeleportToRoom = (coords: { x: number; y: number }): void => {
    if (!this.player || !coords) return;
    this.player.setPosition(coords.x, coords.y);
    this.player.setVelocity(0, 0);
    this.cameras.main.pan(coords.x, coords.y, 450, 'Power2');
    this.updateCurrentZone(true);
  };

  private handleScreenShareChanged = ({
    isSharing,
    sharerName,
  }: {
    isSharing: boolean;
    sharerName?: string;
  }): void => {
    this.resetMovementKeys();
    this.isScreenSharingActive = Boolean(isSharing);
    this.screenSharerName = sharerName || 'Rekan';

    // Sesuaikan ketinggian balon chat aktif jika sedang terbuka agar tetap proporsional
    if (this.activeChatBubble && this.activeChatBubble.container.active) {
      const baseOffset = this.isScreenSharingActive ? 62 : 46;
      this.activeChatBubble.offsetY = baseOffset + 14;
    }

    if (this.screenShareBadgeContainer && this.screenShareBadgeContainer.active) {
      this.screenShareBadgeContainer.destroy();
      this.screenShareBadgeContainer = null;
    }

    if (this.isScreenSharingActive && this.player && this.player.active) {
      const container = this.add.container(this.player.x, this.player.y - 48);
      container.setDepth(this.player.y + 1020);

      const bg = this.add.graphics();
      bg.fillStyle(0x131722, 0.95);
      bg.lineStyle(1.5, 0xeab308, 1);
      bg.fillRoundedRect(-52, -10, 104, 20, 5);
      bg.strokeRoundedRect(-52, -10, 104, 20, 5);

      const txt = this.add.text(0, 0, '🖥️ LIVE SCREEN', {
        fontFamily: 'system-ui, -apple-system, sans-serif',
        fontSize: '9.5px',
        color: '#fef08a',
        fontStyle: 'bold',
        align: 'center',
      });
      txt.setOrigin(0.5, 0.5);

      container.add([bg, txt]);
      this.screenShareBadgeContainer = container;

      // Animasi denyut glowing lembut
      this.tweens.add({
        targets: container,
        scaleX: 1.06,
        scaleY: 1.06,
        yoyo: true,
        repeat: -1,
        duration: 800,
        ease: 'Sine.easeInOut',
      });
    }
  };
}
