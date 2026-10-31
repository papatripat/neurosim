import React, { useEffect, useRef, useState } from 'react';
import { CharacterCustomization, CharacterDirection } from '../../types/character';
import { Play, Pause, ZoomIn, ZoomOut, RotateCw } from 'lucide-react';

interface Props {
  config: CharacterCustomization;
  direction?: CharacterDirection;
  onChangeDirection?: (dir: CharacterDirection) => void;
  className?: string;
  zoom?: number;
}

export const CharacterCanvasPreview: React.FC<Props> = ({
  config,
  direction: propDirection,
  onChangeDirection,
  className = '',
  zoom: initialZoom = 2.8,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [internalDirection, setInternalDirection] = useState<CharacterDirection>(
    propDirection || 'south'
  );
  const [isWalking, setIsWalking] = useState(true);
  const [isPlaying, setIsPlaying] = useState(true);
  const [zoom, setZoom] = useState(initialZoom);
  const [frameIndex, setFrameIndex] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  // Sync internal state if propDirection changes externally
  useEffect(() => {
    if (propDirection) {
      setInternalDirection(propDirection);
    }
  }, [propDirection]);

  // Current active direction (controlled if onChangeDirection provided, else uncontrolled fallback)
  const currentDirection =
    propDirection !== undefined && onChangeDirection !== undefined
      ? propDirection
      : internalDirection;

  const handleDirectionChange = (newDir: CharacterDirection) => {
    setInternalDirection(newDir);
    onChangeDirection?.(newDir);
  };

  // Cached Image element for the selected archetype aligned.png
  const imageRef = useRef<HTMLImageElement | null>(null);

  // Load archetype aligned.png spritesheet whenever archetype changes
  useEffect(() => {
    let active = true;
    setIsLoading(true);

    const arch = config.archetype || 'resident';
    const imgUrl = `/assets/characters/${arch}/aligned.png`;
    const img = new Image();
    img.src = imgUrl;

    img.onload = () => {
      if (!active) return;
      imageRef.current = img;
      setIsLoading(false);
    };

    img.onerror = () => {
      if (!active) return;
      const fallbackImg = new Image();
      fallbackImg.src = '/assets/characters/resident/aligned.png';
      fallbackImg.onload = () => {
        if (!active) return;
        imageRef.current = fallbackImg;
        setIsLoading(false);
      };
    };

    return () => {
      active = false;
    };
  }, [config.archetype]);

  // Frame timing loop:
  // Walk cycle: 8 frames, Idle cycle: 9 frames
  const maxFrames = isWalking ? 8 : 9;
  const frameInterval = isWalking ? 120 : 300;

  useEffect(() => {
    if (!isPlaying) return;
    const timer = setInterval(() => {
      setFrameIndex((prev) => (prev + 1) % maxFrames);
    }, frameInterval);
    return () => clearInterval(timer);
  }, [isPlaying, isWalking, frameInterval, maxFrames]);

  // Render current frame to display canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    const img = imageRef.current;
    if (!canvas || !img) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Aligned.png 576×512 row mapping:
    // Row 0: Idle South
    // Row 1: Idle East
    // Row 2: Idle North
    // Row 3: Idle West
    // Row 4: Walk South
    // Row 5: Walk East
    // Row 6: Walk North
    // Row 7: Walk West
    let row = 0;
    if (isWalking) {
      if (currentDirection === 'south') row = 4;
      else if (currentDirection === 'east') row = 5;
      else if (currentDirection === 'north') row = 6;
      else if (currentDirection === 'west') row = 7;
    } else {
      if (currentDirection === 'south') row = 0;
      else if (currentDirection === 'east') row = 1;
      else if (currentDirection === 'north') row = 2;
      else if (currentDirection === 'west') row = 3;
    }

    const col = isWalking ? (frameIndex % 8) : (isPlaying ? (frameIndex % 9) : 0);
    const srcX = col * 64;
    const srcY = row * 64;

    ctx.imageSmoothingEnabled = false;
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Draw floor pedestal shadow
    const centerX = canvas.width / 2;
    const groundY = canvas.height - 24 * (zoom / 2.8);
    ctx.beginPath();
    ctx.ellipse(centerX, groundY, 18 * (zoom / 2.2), 6 * (zoom / 2.2), 0, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(0, 0, 0, 0.22)';
    ctx.fill();

    // Draw 64x64 sprite scaled by zoom
    const destW = 64 * zoom;
    const destH = 64 * zoom;
    const destX = (canvas.width - destW) / 2;
    const destY = (canvas.height - destH) / 2 - 4 * (zoom / 2.8);

    ctx.drawImage(
      img,
      srcX,
      srcY,
      64,
      64,
      Math.round(destX),
      Math.round(destY),
      Math.round(destW),
      Math.round(destH)
    );
  }, [currentDirection, isWalking, frameIndex, zoom, isLoading]);

  const handleRotate = () => {
    const dirs: CharacterDirection[] = ['south', 'west', 'north', 'east'];
    const nextIdx = (dirs.indexOf(currentDirection) + 1) % dirs.length;
    handleDirectionChange(dirs[nextIdx]);
  };

  return (
    <div className={`flex flex-col items-center select-none ${className}`}>
      {/* Canvas Viewport */}
      <div className="relative w-48 h-48 sm:w-56 sm:h-56 bg-[#161a23] rounded-lg border-2 border-[#384152] shadow-inner overflow-hidden flex items-center justify-center">
        {/* Subtle grid pattern background like Universal LPC Generator */}
        <div
          className="absolute inset-0 opacity-15 pointer-events-none"
          style={{
            backgroundImage:
              'linear-gradient(#4a5568 1px, transparent 1px), linear-gradient(90deg, #4a5568 1px, transparent 1px)',
            backgroundSize: '16px 16px',
          }}
        />

        <canvas
          ref={canvasRef}
          width={224}
          height={224}
          className="relative z-10 pixelated"
        />

        {isLoading && (
          <div className="absolute inset-0 bg-black/50 backdrop-blur-[1px] flex items-center justify-center z-20">
            <span className="text-[10px] font-mono text-soft animate-pulse">
              Memproses Layer LPC...
            </span>
          </div>
        )}

        {/* Direction Indicator Pill */}
        <div className="absolute top-2 left-2 z-20 px-1.5 py-0.5 rounded bg-black/60 text-[9px] font-mono text-[#a7b7bb] uppercase">
          {currentDirection === 'south'
            ? 'Menghadap Depan'
            : currentDirection === 'north'
            ? 'Menghadap Belakang'
            : currentDirection === 'west'
            ? 'Menghadap Kiri'
            : 'Menghadap Kanan'}
        </div>
      </div>

      {/* Interactive Controls Bar */}
      <div className="flex items-center justify-between w-full mt-2.5 px-1 gap-1.5">
        {/* Direction Quick Switcher */}
        <div className="flex items-center gap-1 bg-cream/90 border border-[#b5aa94] rounded p-0.5 shadow-2xs">
          {(['south', 'east', 'north', 'west'] as CharacterDirection[]).map((d) => (
            <button
              key={d}
              type="button"
              onClick={() => handleDirectionChange(d)}
              title={`Arah ${d}`}
              className={`px-1.5 py-0.5 text-[10px] font-bold rounded transition-colors uppercase ${
                currentDirection === d
                  ? 'bg-teal text-soft shadow-xs'
                  : 'text-ink-muted hover:text-ink hover:bg-sand'
              }`}
            >
              {d === 'south' ? 'S' : d === 'east' ? 'E' : d === 'north' ? 'N' : 'W'}
            </button>
          ))}
          <button
            type="button"
            onClick={handleRotate}
            title="Putar Arah Karakter (Rotate)"
            className="p-1 hover:bg-sand rounded text-ink-muted hover:text-ink transition-colors"
          >
            <RotateCw className="w-3 h-3" />
          </button>
        </div>

        {/* Animation & Zoom Controls */}
        <div className="flex items-center gap-1">
          {/* Walk / Idle toggle */}
          <button
            type="button"
            onClick={() => setIsWalking((w) => !w)}
            className={`px-2 py-0.5 text-[10px] font-semibold rounded border transition-colors ${
              isWalking
                ? 'bg-ochre/20 text-[#855700] border-ochre/50'
                : 'bg-cream text-ink-muted border-[#b5aa94] hover:bg-sand'
            }`}
          >
            {isWalking ? 'Jalan' : 'Diam'}
          </button>

          {/* Play / Pause */}
          <button
            type="button"
            onClick={() => setIsPlaying((p) => !p)}
            className="p-1 bg-cream hover:bg-sand border border-[#b5aa94] rounded text-ink transition-colors"
            title={isPlaying ? 'Jeda Animasi' : 'Putar Animasi'}
          >
            {isPlaying ? <Pause className="w-3 h-3" /> : <Play className="w-3 h-3" />}
          </button>

          {/* Zoom controls */}
          <button
            type="button"
            onClick={() => setZoom((z) => Math.max(2, z - 0.4))}
            className="p-1 bg-cream hover:bg-sand border border-[#b5aa94] rounded text-ink transition-colors"
            title="Perkecil"
          >
            <ZoomOut className="w-3 h-3" />
          </button>
          <button
            type="button"
            onClick={() => setZoom((z) => Math.min(4.5, z + 0.4))}
            className="p-1 bg-cream hover:bg-sand border border-[#b5aa94] rounded text-ink transition-colors"
            title="Perbesar"
          >
            <ZoomIn className="w-3 h-3" />
          </button>
        </div>
      </div>
    </div>
  );
};
