import Phaser from 'phaser';
import { BootScene } from './scenes/BootScene';
import { OfficeScene } from './scenes/OfficeScene';

export const VIEWPORT_W = 1280;
export const VIEWPORT_H = 720;

export const gameConfig: Phaser.Types.Core.GameConfig = {
  type: Phaser.AUTO,
  pixelArt: true,
  roundPixels: true,
  audio: {
    noAudio: true, // Nonaktifkan sound engine Phaser internal untuk menghemat resource memori & CPU
  },
  render: {
    antialias: false,
    pixelArt: true,
    roundPixels: true,
    powerPreference: 'high-performance',
    batchSize: 4096, // Optimasi batch rendering WebGL untuk mengurangi draw call
  },
  fps: {
    target: 60,
    min: 30,
    smoothStep: true,
  },
  physics: {
    default: 'arcade',
    arcade: {
      gravity: { x: 0, y: 0 },
      debug: false,
    },
  },
  scale: {
    mode: Phaser.Scale.RESIZE,
    autoCenter: Phaser.Scale.CENTER_BOTH,
    width: '100%',
    height: '100%',
    min: {
      width: 320,
      height: 240,
    },
  },
  scene: [BootScene, OfficeScene],
};
