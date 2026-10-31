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
  /** Player triggered quick reaction emoji from GatherDock */
  TRIGGER_REACTION: 'trigger-reaction',
  /** Player sent an office chat message -> show 2D speech bubble above avatar */
  TRIGGER_CHAT_BUBBLE: 'trigger-chat-bubble',
} as const;
