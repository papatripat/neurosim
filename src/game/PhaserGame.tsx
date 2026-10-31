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
    if (!containerRef.current) return;

    // Safety guard against duplicate initialization
    if (gameRef.current) return;

    const config: Phaser.Types.Core.GameConfig = {
      ...gameConfig,
      parent: containerRef.current,
    };

    const game = new Phaser.Game(config);
    gameRef.current = game;
    (window as any).__PHASER_GAME__ = game;

    const handleSceneReady = () => {
      onSceneReady?.();
    };

    EventBus.on(GAME_EVENTS.SCENE_READY, handleSceneReady);

    return () => {
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
