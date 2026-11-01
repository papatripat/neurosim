import Phaser from 'phaser';

/**
 * Singleton EventEmitter bridging Phaser scenes <-> React UI.
 * Both sides import this same instance to emit/listen events.
 */
export const EventBus = new Phaser.Events.EventEmitter();

export const GAME_EVENTS = {
  /** OfficeScene finished create() and is ready */
  SCENE_READY: 'scene-ready',
  /** Player pressed [E] near an NPC -> open dialog overlay */
  OPEN_DIALOG: 'open-dialog',
  /** React UI closed dialog -> unfreeze player */
  CLOSE_DIALOG: 'close-dialog',
  /** Player pressed [E] near To-Do List board -> open todo overlay */
  OPEN_TODO_LIST: 'open-todo-list',
  /** React UI closed todo list -> unfreeze player */
  CLOSE_TODO_LIST: 'close-todo-list',
  /** React UI opened any modal/input -> lock player & disable keyboard capture */
  PAUSE_INPUT: 'pause-input',
  /** React UI closed modal/input -> unlock player & enable keyboard capture */
  RESUME_INPUT: 'resume-input',
  /** Player triggered quick reaction emoji from dock */
  TRIGGER_REACTION: 'trigger-reaction',
  /** Player sent an office chat message -> show 2D speech bubble above avatar */
  TRIGGER_CHAT_BUBBLE: 'trigger-chat-bubble',
  /** Player entered a new office room/zone */
  ZONE_CHANGED: 'zone-changed',
  /** Player switched or joined an online room */
  ROOM_CHANGED: 'room-changed',
  /** Character customization updated -> swap sprite texture/animations in real-time */
  UPDATE_PLAYER_CHARACTER: 'update-player-character',
  /** User selected a room from Dashboard/Lobby -> teleport player directly to room coordinates */
  TELEPORT_TO_ROOM: 'teleport-to-room',
  /** Screen share status changed (started/stopped) */
  SCREEN_SHARE_CHANGED: 'screen-share-changed',
  /** Player interacted to open/close screen share viewer */
  TOGGLE_SCREEN_SHARE_VIEW: 'toggle-screen-share-view',
  /** Local player moved -> inform multiplayer service to broadcast */
  LOCAL_PLAYER_MOVED: 'local-player-moved',
  /** Remote player entered current room */
  REMOTE_PLAYER_JOINED: 'remote-player-joined',
  /** Remote player updated position/movement */
  REMOTE_PLAYER_MOVED: 'remote-player-moved',
  /** Remote player left room or disconnected */
  REMOTE_PLAYER_LEFT: 'remote-player-left',
  /** Remote player sent a chat message */
  REMOTE_CHAT_RECEIVED: 'remote-chat-received',
  /** Remote player triggered an emote reaction */
  REMOTE_REACTION_RECEIVED: 'remote-reaction-received',
  /** Remote player changed work status (available/busy/pantry) */
  REMOTE_PLAYER_STATUS: 'remote-player-status',
  /** Full list of connected online players in current room updated */
  ONLINE_PLAYERS_UPDATED: 'online-players-updated',
  /** Multiplayer socket connection status changed (connected/disconnected/error) */
  REALTIME_CONNECTION_STATUS: 'realtime-connection-status',
  /** Local media status changed (mic/cam/speaking) */
  LOCAL_MEDIA_CHANGED: 'local-media-changed',
  /** Remote player media status changed */
  REMOTE_MEDIA_CHANGED: 'remote-media-changed',
  /** Toggle Google Meet video conference UI */
  TOGGLE_GOOGLE_MEET: 'toggle-google-meet',
} as const;
