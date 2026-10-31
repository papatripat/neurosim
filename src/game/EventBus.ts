import Phaser from 'phaser';

/**
 * Singleton EventEmitter bridging Phaser scenes ↔ React UI.
 * Both sides import this same instance to emit/listen events.
 */
export const EventBus = new Phaser.Events.EventEmitter();

export const GAME_EVENTS = {
  /** OfficeScene finished create() and is ready */
  SCENE_READY: 'scene-ready',
  /** Player pressed [E] near an NPC → open dialog overlay */
  OPEN_DIALOG: 'open-dialog',
  /** React UI closed dialog → unfreeze player */
  CLOSE_DIALOG: 'close-dialog',
  /** Player pressed [E] near To-Do List board → open todo overlay */
  OPEN_TODO_LIST: 'open-todo-list',
  /** React UI closed todo list → unfreeze player */
  CLOSE_TODO_LIST: 'close-todo-list',
  /** React UI opened any modal/input → lock player & disable keyboard capture */
  PAUSE_INPUT: 'pause-input',
  /** React UI closed modal/input → unlock player & enable keyboard capture */
  RESUME_INPUT: 'resume-input',
} as const;

