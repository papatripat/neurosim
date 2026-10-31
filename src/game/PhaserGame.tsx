import React, { useEffect, useRef } from 'react';
import Phaser from 'phaser';
import { gameConfig } from './config';
import { EventBus, GAME_EVENTS } from './EventBus';

export interface PhaserGameProps {
  onSceneReady?: () => void;
  className?: string;
}

/**
 * PhaserGame - React wrapper for Phaser 3 canvas with React 18 StrictMode safety.
 *
 * Prevents duplicate canvas creation during StrictMode unmount/remount cycles
 * and cleanly destroys the Phaser instance when unmounted.
 */
export const PhaserGame: React.FC<PhaserGameProps> = ({ onSceneReady, className }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const gameRef = useRef<Phaser.Game | null>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    let isDestroyed = false;
    let checkTimer: number | null = null;

    const tryInitPhaser = () => {
      if (isDestroyed || gameRef.current) return;

      const rect = container.getBoundingClientRect();
      // Ensure container has real, visible layout dimensions before initializing Phaser WebGL
      if (rect.width < 100 || rect.height < 100) {
        checkTimer = window.setTimeout(tryInitPhaser, 50);
        return;
      }

      const config: Phaser.Types.Core.GameConfig = {
        ...gameConfig,
        parent: container,
      };

      try {
        const game = new Phaser.Game(config);
        gameRef.current = game;
        (window as any).__PHASER_GAME__ = game;
      } catch (err) {
        console.error('Failed to initialize Phaser game engine:', err);
      }
    };

    // Check on next frame / tick
    checkTimer = window.setTimeout(tryInitPhaser, 20);

    const handleSceneReady = () => {
      onSceneReady?.();
    };

    EventBus.on(GAME_EVENTS.SCENE_READY, handleSceneReady);

    return () => {
      isDestroyed = true;
      if (checkTimer) {
        clearTimeout(checkTimer);
      }
      EventBus.off(GAME_EVENTS.SCENE_READY, handleSceneReady);
      if (gameRef.current) {
        delete (window as any).__PHASER_GAME__;
        gameRef.current.destroy(true);
        gameRef.current = null;
      }
    };
  }, [onSceneReady]);

  return (
    <div
      ref={containerRef}
      id="phaser-game-container"
      className={className ?? 'w-full h-full flex items-center justify-center bg-[#0f1117] overflow-hidden'}
    />
  );
};
