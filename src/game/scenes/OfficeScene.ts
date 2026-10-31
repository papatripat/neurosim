import Phaser from 'phaser';
import { EventBus, GAME_EVENTS } from '../EventBus';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface NPCData {
  id: string;
  name: string;
  sprite: Phaser.Physics.Arcade.Sprite;
  scenarioId: string;
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const MAP_W = 2752;
const MAP_H = 1536;
const PLAYER_SPEED = 140;
const NPC_INTERACT_DIST = 60;
const TODO_INTERACT_DIST = 50;
const CHAR_SCALE = 1.75;

// Prop scale matches 64px sprites to the 2752×1536 world
const PROP_SCALE = 1.75;

// Spawn point — south entrance opposite the central corridor
const SPAWN = { x: 1375, y: 1280 };

// To-Do List board position — centre of the corridor
const TODO_POS = { x: 1400, y: 450 };

// NPC spawn positions (from manifest.json / task spec)
const NPC_POSITIONS = {
  rina: { x: 2150, y: 260 },   // Zona 4 — Boss Room
  dimas: { x: 580, y: 260 },   // Zona 1 — Pantry
  klien: { x: 640, y: 720 },   // Zona 2 — Meeting Room
} as const;

// ---------------------------------------------------------------------------
// Scene
// ---------------------------------------------------------------------------

export class OfficeScene extends Phaser.Scene {
  // Player
  private player!: Phaser.Physics.Arcade.Sprite;
  private lastDirection: string = 'south';

  // NPCs
  private npcs: NPCData[] = [];

  // Physics
  private obstacles!: Phaser.Physics.Arcade.StaticGroup;

  // Input
  private cursors!: Phaser.Types.Input.Keyboard.CursorKeys;
  private wasd!: Record<string, Phaser.Input.Keyboard.Key>;
  private keyE!: Phaser.Input.Keyboard.Key;

  // State
  private isPlayerLocked = false;
  private promptText!: Phaser.GameObjects.Text;
  private activeNpcNear: NPCData | null = null;
  private isNearTodoList = false;

  constructor() {
    super('OfficeScene');
  }

  // =========================================================================
  // CREATE
  // =========================================================================

  create(): void {
    // 1. Ground image
    this.add.image(0, 0, 'office-ground').setOrigin(0, 0).setDepth(0);
    this.physics.world.setBounds(0, 0, MAP_W, MAP_H);

    // 2. Static obstacle group (walls + furniture colliders)
    this.obstacles = this.physics.add.staticGroup();
    this.buildWalls();

    // 3. Furniture props (visual + collision)
    this.buildFurniture();

    // 4. To-Do List board
    this.buildTodoBoard();

    // 5. Player
    this.buildPlayer();

    // 6. NPCs
    this.buildNPCs();

    // 7. Physics colliders
    this.physics.add.collider(this.player, this.obstacles);
    for (const npc of this.npcs) {
      this.physics.add.collider(this.player, npc.sprite);
    }

    // 8. Camera
    this.cameras.main.setBounds(0, 0, MAP_W, MAP_H);
    this.cameras.main.startFollow(this.player, true, 0.08, 0.08);

    // 9. Input
    this.cursors = this.input.keyboard!.createCursorKeys();
    this.wasd = this.input.keyboard!.addKeys('W,A,S,D') as Record<
      string,
      Phaser.Input.Keyboard.Key
    >;
    this.keyE = this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.E);

    // 10. Prompt label (re-used for NPC + To-Do)
    this.promptText = this.add
      .text(0, 0, '', {
        fontFamily: 'monospace',
        fontSize: '14px',
        color: '#ffffff',
        backgroundColor: '#242a38',
        padding: { x: 8, y: 4 },
      })
      .setOrigin(0.5)
      .setDepth(9999)
      .setVisible(false);

    // 11. Listen for React closing the dialog
    EventBus.on(GAME_EVENTS.CLOSE_DIALOG, this.handleCloseDialog, this);

    // 12. Notify React that the scene is ready
    EventBus.emit(GAME_EVENTS.SCENE_READY);
  }

  // =========================================================================
  // UPDATE
  // =========================================================================

  update(): void {
    // Y-sort the player every frame
    this.player.setDepth(this.player.y);

    if (this.isPlayerLocked) {
      this.player.setVelocity(0, 0);
      return;
    }

    // --- Movement ---
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

    // Normalise diagonal movement
    if (vx !== 0 && vy !== 0) {
      const factor = Math.SQRT1_2; // 1/√2
      vx *= factor;
      vy *= factor;
    }

    this.player.setVelocity(vx, vy);

    // --- Animation ---
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

    // --- Proximity checks ---
    this.checkTodoListProximity();
    this.checkNpcProximity();
  }

  // =========================================================================
  // BUILDERS
  // =========================================================================

  private buildWalls(): void {
    // Outer walls
    this.addWall(MAP_W / 2, 25, MAP_W, 50);           // top
    this.addWall(25, MAP_H / 2, 50, MAP_H);           // left
    this.addWall(MAP_W - 25, MAP_H / 2, 50, MAP_H);   // right

    // Bottom wall with gap for front door (gap ~1250-1500)
    this.addWall(600, MAP_H - 25, 1200, 50);           // bottom-left
    this.addWall(2100, MAP_H - 25, 1300, 50);          // bottom-right

    // Vertical divider (left rooms ↔ corridor) with door gaps
    // Door openings at y≈365, y≈775, y≈1195 (each ~80px tall)
    this.addWall(1166, 170, 60, 260);    // above Zona 1 door
    this.addWall(1166, 570, 60, 330);    // between Zona 1 & 2 doors
    this.addWall(1166, 990, 60, 340);    // between Zona 2 & 3 doors
    this.addWall(1166, 1330, 60, 190);   // below Zona 3 door

    // Horizontal dividers between left rooms
    this.addWall(600, 505, 1080, 40);    // Zona 1 ↔ Zona 2
    this.addWall(600, 960, 1080, 40);    // Zona 2 ↔ Zona 3

    // Zona 4 (Boss Room) bottom wall with door gap at x≈2153
    this.addWall(1800, 505, 500, 40);    // left of door
    this.addWall(2450, 505, 400, 40);    // right of door
  }

  /** Invisible rectangle added to the static obstacle group */
  private addWall(x: number, y: number, w: number, h: number): void {
    const rect = this.add.rectangle(x, y, w, h, 0x000000, 0);
    this.physics.add.existing(rect, true);
    this.obstacles.add(rect);
  }

  private buildFurniture(): void {
    // ------ Zona 1: Pantry & Dapur ------
    // Kitchen counter + appliances along top wall
    this.addProp('counter', 200, 130, true);
    this.addProp('counter', 280, 130, true);
    this.addProp('espresso-machine', 200, 110);
    this.addProp('pastry-case', 280, 110);
    this.addProp('kitchen-cabinet', 400, 110, true);
    this.addProp('fridge', 480, 110, true);

    // Bar stools at counter
    this.addProp('bar-stool', 200, 190);
    this.addProp('bar-stool', 280, 190);

    // Cafe seating
    this.addProp('cafe-table', 250, 330, true);
    this.addProp('cafe-chair', 200, 330);
    this.addProp('cafe-chair', 300, 330);
    this.addProp('cafe-table', 550, 330, true);
    this.addProp('cafe-chair', 500, 330);
    this.addProp('cafe-chair', 600, 330);

    // Water cooler near NPC area
    this.addProp('water-cooler', 800, 200, true);
    this.addProp('plant-large', 130, 380);

    // ------ Zona 2: Meeting Room ------
    // Long meeting table with chairs
    this.addProp('desk', 400, 720, true);
    this.addProp('desk', 530, 720, true);
    this.addProp('desk', 660, 720, true);
    this.addProp('office-chair', 400, 660);
    this.addProp('office-chair', 530, 660);
    this.addProp('office-chair', 660, 660);
    this.addProp('office-chair', 400, 780);
    this.addProp('office-chair', 530, 780);
    this.addProp('office-chair', 660, 780);
    this.addProp('plant-large', 130, 850);

    // ------ Zona 3: Smoking Area ------
    this.addProp('sofa', 300, 1120, true);
    this.addProp('coffee-table', 300, 1170);
    this.addProp('armchair', 500, 1120, true);
    this.addProp('plant-large', 130, 1250);

    // ------ Zona 4: Ruangan Bos ------
    this.addProp('desk', 2150, 200, true);
    this.addProp('computer', 2150, 175);
    this.addProp('office-chair', 2150, 280);
    this.addProp('bookcase', 2400, 150, true);
    this.addProp('filing-cabinet', 1850, 150, true);
    this.addProp('plant-large', 2500, 380);

    // ------ Zona 5: Main Room (Employee workspace) ------
    // Player desk cluster
    this.addProp('desk', 1700, 850, true);
    this.addProp('computer', 1700, 825);
    this.addProp('office-chair', 1700, 920);

    // Other employee desks
    this.addProp('desk', 1950, 850, true);
    this.addProp('computer', 1950, 825);
    this.addProp('office-chair', 1950, 920);

    this.addProp('desk', 2200, 850, true);
    this.addProp('computer', 2200, 825);
    this.addProp('office-chair', 2200, 920);

    // Second row
    this.addProp('desk', 1700, 1050, true);
    this.addProp('computer', 1700, 1025);
    this.addProp('office-chair', 1700, 1120);

    this.addProp('desk', 1950, 1050, true);
    this.addProp('computer', 1950, 1025);
    this.addProp('office-chair', 1950, 1120);

    // Utility corner
    this.addProp('printer', 2500, 700, true);
    this.addProp('filing-cabinet', 2500, 800, true);
    this.addProp('water-cooler', 2550, 950, true);
    this.addProp('plant-large', 2550, 1200);
  }

  /**
   * Place a prop sprite with Y-depth sorting.
   * If `solid` is true, an invisible collider body is added.
   */
  private addProp(
    name: string,
    x: number,
    y: number,
    solid = false,
  ): Phaser.GameObjects.Image {
    const img = this.add
      .image(x, y, `prop-${name}`)
      .setScale(PROP_SCALE)
      .setDepth(y);

    if (solid) {
      const col = this.add.rectangle(x, y + 4, 50, 28, 0x000000, 0);
      this.physics.add.existing(col, true);
      this.obstacles.add(col);
    }

    return img;
  }

  private buildTodoBoard(): void {
    const { x, y } = TODO_POS;
    this.add
      .rectangle(x, y, 44, 64, 0x355c5a)
      .setDepth(y);
    this.add
      .text(x, y - 6, 'TO-DO\nLIST', {
        fontFamily: 'monospace',
        fontSize: '10px',
        color: '#fff9eb',
        align: 'center',
      })
      .setOrigin(0.5)
      .setDepth(y + 1);
  }

  private buildPlayer(): void {
    this.player = this.physics.add.sprite(SPAWN.x, SPAWN.y, 'char-player');
    this.player.setScale(CHAR_SCALE);
    (this.player.body as Phaser.Physics.Arcade.Body).setSize(20, 14).setOffset(22, 50);
    this.player.setCollideWorldBounds(true);
    this.player.play('char-player-idle-south');
    this.player.setDepth(SPAWN.y);
  }

  private buildNPCs(): void {
    // Bu Rina — Zona 4 (Boss Room)
    this.spawnNpc('rina', 'Bu Rina (Atasan)', 'skenario-1', 'char-rina', NPC_POSITIONS.rina);

    // Dimas — Zona 1 (Pantry)
    this.spawnNpc('dimas', 'Dimas (Rekan Senior)', 'skenario-2', 'char-dimas', NPC_POSITIONS.dimas);

    // Pak Hendra — Zona 2 (Meeting Room)
    this.spawnNpc('klien', 'Pak Hendra (Klien)', 'skenario-3', 'char-klien', NPC_POSITIONS.klien);
  }

  private spawnNpc(
    id: string,
    name: string,
    scenarioId: string,
    spriteKey: string,
    pos: { x: number; y: number },
  ): void {
    const sprite = this.physics.add
      .sprite(pos.x, pos.y, spriteKey)
      .setScale(CHAR_SCALE)
      .setImmovable(true);
    (sprite.body as Phaser.Physics.Arcade.Body).setSize(20, 14).setOffset(22, 50);
    sprite.play(`${spriteKey}-idle-south`);
    sprite.setDepth(pos.y);

    this.npcs.push({ id, name, sprite, scenarioId });
  }

  // =========================================================================
  // PROXIMITY LOGIC
  // =========================================================================

  private checkTodoListProximity(): void {
    const dist = Phaser.Math.Distance.Between(
      this.player.x,
      this.player.y,
      TODO_POS.x,
      TODO_POS.y,
    );

    if (dist < TODO_INTERACT_DIST) {
      this.isNearTodoList = true;
      this.promptText
        .setText('Tekan [E] Buka To-Do List')
        .setPosition(TODO_POS.x, TODO_POS.y - 48)
        .setVisible(true);

      if (Phaser.Input.Keyboard.JustDown(this.keyE)) {
        this.lockPlayer();
        EventBus.emit(GAME_EVENTS.OPEN_TODO_LIST);
      }
      return;
    }

    this.isNearTodoList = false;
  }

  private checkNpcProximity(): void {
    if (this.isNearTodoList) return;

    this.activeNpcNear = null;

    for (const npc of this.npcs) {
      const dist = Phaser.Math.Distance.Between(
        this.player.x,
        this.player.y,
        npc.sprite.x,
        npc.sprite.y,
      );
      if (dist < NPC_INTERACT_DIST) {
        this.activeNpcNear = npc;
        break;
      }
    }

    if (this.activeNpcNear) {
      this.promptText
        .setText(`Tekan [E] Bicara (${this.activeNpcNear.name})`)
        .setPosition(this.activeNpcNear.sprite.x, this.activeNpcNear.sprite.y - 52)
        .setVisible(true);

      if (Phaser.Input.Keyboard.JustDown(this.keyE)) {
        this.lockPlayer();
        EventBus.emit(GAME_EVENTS.OPEN_DIALOG, {
          scenarioId: this.activeNpcNear.scenarioId,
          npcName: this.activeNpcNear.name,
        });
      }
    } else {
      this.promptText.setVisible(false);
    }
  }

  // =========================================================================
  // PLAYER LOCK / UNLOCK
  // =========================================================================

  private lockPlayer(): void {
    this.isPlayerLocked = true;
    this.player.setVelocity(0, 0);
    this.promptText.setVisible(false);
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
    EventBus.off(GAME_EVENTS.CLOSE_DIALOG, this.handleCloseDialog, this);
  }

  destroy(): void {
    this.shutdown();
  }
}

