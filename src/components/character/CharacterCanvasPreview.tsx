import React, { useEffect, useRef, useState } from 'react';
import { CharacterCustomization, CharacterDirection } from '../../types/character';
import { ZoomIn, ZoomOut, RotateCw, Play, Pause } from 'lucide-react';
import {
  loadPalettes,
  loadImage,
  getLpcLayers,
  recolorImageData,
} from '../../lib/lpcCompositor';

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

  const handleRotate = () => {
    const dirs: CharacterDirection[] = ['south', 'west', 'north', 'east'];
    const nextIdx = (dirs.indexOf(currentDirection) + 1) % dirs.length;
    handleDirectionChange(dirs[nextIdx]);
  };

  // Flag if current configuration is an official pre-baked character role
  const isOfficialArchetype = Boolean(
    config.archetype && config.archetype !== 'custom'
  );

  // Cached composited 576×256 canvas for custom LPC character
  const compositeCanvasRef = useRef<HTMLCanvasElement | null>(null);
  // Cached image for official role spritesheet (576×512 aligned.png)
  const officialImageRef = useRef<HTMLImageElement | null>(null);

  // Load official archetype spritesheet OR composite LPC layers whenever config changes
  useEffect(() => {
    let active = true;
    setIsLoading(true);

    if (isOfficialArchetype) {
      const role = config.archetype || 'resident';
      const url = `/assets/characters/${role}/aligned.png`;
      loadImage(url)
        .then((img) => {
          if (active) {
            officialImageRef.current = img;
            setIsLoading(false);
          }
        })
        .catch((err) => {
          console.warn(`Official archetype load failed for ${url}:`, err);
          if (active) setIsLoading(false);
        });
      return () => {
        active = false;
      };
    }

    // Custom Modular Character: Composite Universal LPC Layers
    const buildComposite = async () => {
      try {
        const palettes = await loadPalettes();
        const layers = getLpcLayers(config);

        const offscreen = document.createElement('canvas');
        offscreen.width = 576;
        offscreen.height = 256;
        const offCtx = offscreen.getContext('2d')!;
        offCtx.imageSmoothingEnabled = false;

        const tempCanvas = document.createElement('canvas');
        tempCanvas.width = 576;
        tempCanvas.height = 256;
        const tempCtx = tempCanvas.getContext('2d', { willReadFrequently: true })!;
        tempCtx.imageSmoothingEnabled = false;

        for (const layer of layers) {
          try {
            const img = await loadImage(layer.url);
            tempCtx.clearRect(0, 0, 576, 256);
            tempCtx.drawImage(img, 0, 0, 576, 256);

            // Primary palette recolor swap
            if (layer.paletteType && layer.sourceVariant && layer.targetVariant) {
              let palGroup: Record<string, string[]> | null = null;
              if (layer.paletteType === 'body') palGroup = palettes.body;
              else if (layer.paletteType === 'hair') palGroup = palettes.hair;
              else if (layer.paletteType === 'cloth') palGroup = palettes.cloth;
              else if (layer.paletteType === 'eye') palGroup = palettes.eye;

              if (palGroup) {
                const srcPal = palGroup[layer.sourceVariant];
                const tgtPal = palGroup[layer.targetVariant];
                if (srcPal && tgtPal) {
                  const imgData = tempCtx.getImageData(0, 0, 576, 256);
                  recolorImageData(imgData, srcPal, tgtPal);
                  tempCtx.putImageData(imgData, 0, 0);
                }
              }
            }

            // Secondary palette recoloring (e.g. eye iris recolor on head layer)
            if (
              layer.secondaryPaletteType &&
              layer.secondarySourceVariant &&
              layer.secondaryTargetVariant
            ) {
              let palGroup: Record<string, string[]> | null = null;
              if (layer.secondaryPaletteType === 'eye') palGroup = palettes.eye;
              else if (layer.secondaryPaletteType === 'cloth') palGroup = palettes.cloth;

              if (palGroup) {
                const srcPal = palGroup[layer.secondarySourceVariant];
                const tgtPal = palGroup[layer.secondaryTargetVariant];
                if (srcPal && tgtPal) {
                  const imgData = tempCtx.getImageData(0, 0, 576, 256);
                  recolorImageData(imgData, srcPal, tgtPal);
                  tempCtx.putImageData(imgData, 0, 0);
                }
              }
            }

            offCtx.drawImage(tempCanvas, 0, 0);
          } catch (err) {
            console.warn(`Layer render failed: ${layer.url}`, err);
          }
        }

        if (active) {
          compositeCanvasRef.current = offscreen;
          setIsLoading(false);
        }
      } catch (err) {
        console.error('Composite build error:', err);
        if (active) setIsLoading(false);
      }
    };

    buildComposite();

    return () => {
      active = false;
    };
  }, [config, isOfficialArchetype]);

  // Frame timing loop for animation preview
  // In aligned.png: 9 frames per row (idle = 9 frames, walk = 8 frames)
  // In LPC: frame 0 = idle standing, frames 1..8 = walk cycle (8 frames)
  const maxFrames = isOfficialArchetype ? (isWalking ? 8 : 9) : 8;
  const frameInterval = isWalking ? 120 : 160;

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
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

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

    if (isOfficialArchetype) {
      const img = officialImageRef.current;
      if (!img) return;

      // In aligned.png (576×512, 9 columns × 8 rows of 64×64 cells):
      // Rows 0..3: Idle (South, East, North, West)
      // Rows 4..7: Walk (South, East, North, West)
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

      const col = isWalking
        ? frameIndex % 8
        : isPlaying
        ? frameIndex % 9
        : 0;

      const srcX = col * 64;
      const srcY = row * 64;

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
    } else {
      const comp = compositeCanvasRef.current;
      if (!comp) return;

      // LPC walk.png row mapping:
      // Row 0: North, Row 1: West, Row 2: South, Row 3: East
      let row = 2;
      if (currentDirection === 'north') row = 0;
      else if (currentDirection === 'west') row = 1;
      else if (currentDirection === 'south') row = 2;
      else if (currentDirection === 'east') row = 3;

      // Frame column in LPC walk.png:
      // Frame 0 = idle/standing pose, Frames 1..8 = walk cycle frames
      const col = isWalking ? 1 + (frameIndex % 8) : 0;

      const srcX = col * 64;
      const srcY = row * 64;

      ctx.drawImage(
        comp,
        srcX,
        srcY,
        64,
        64,
        Math.round(destX),
        Math.round(destY),
        Math.round(destW),
        Math.round(destH)
      );
    }
  }, [currentDirection, isWalking, frameIndex, zoom, isLoading, isOfficialArchetype, isPlaying, config]);

  return (
    <div className={`flex flex-col items-center select-none ${className}`}>
      {/* Canvas Viewport */}
      <div className="relative w-48 h-48 sm:w-56 sm:h-56 bg-[#161a23] rounded-lg border-2 border-[#384152] shadow-inner overflow-hidden flex items-center justify-center">
        {/* Subtle grid pattern background */}
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
              Memproses Layer Karakter...
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
        {/* Direction Quick Switcher (S, E, N, W) */}
        <div className="flex items-center gap-1 bg-cream/90 border border-[#b5aa94] rounded p-0.5 shadow-2xs">
          {(['south', 'east', 'north', 'west'] as CharacterDirection[]).map((d) => (
            <button
              key={d}
              type="button"
              onClick={() => handleDirectionChange(d)}
              title={`Arah ${d}`}
              className={`px-1.5 py-0.5 text-[10px] font-bold rounded transition-colors uppercase cursor-pointer ${
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
            className="p-1 hover:bg-sand rounded text-ink-muted hover:text-ink transition-colors cursor-pointer"
          >
            <RotateCw className="w-3 h-3" />
          </button>
        </div>

        {/* Animation & Zoom Controls */}
        <div className="flex items-center gap-1">
          {/* Walk / Idle toggle with fixed width */}
          <button
            type="button"
            onClick={() => setIsWalking((w) => !w)}
            className={`w-14 text-center py-0.5 text-[10px] font-semibold rounded border transition-colors cursor-pointer ${
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
            className="p-1 bg-cream hover:bg-sand border border-[#b5aa94] rounded text-ink transition-colors cursor-pointer"
            title={isPlaying ? 'Jeda Animasi' : 'Putar Animasi'}
          >
            {isPlaying ? <Pause className="w-3 h-3" /> : <Play className="w-3 h-3" />}
          </button>

          {/* Zoom controls */}
          <button
            type="button"
            onClick={() => setZoom((z) => Math.max(2, z - 0.4))}
            className="p-1 bg-cream hover:bg-sand border border-[#b5aa94] rounded text-ink transition-colors cursor-pointer"
            title="Perkecil"
          >
            <ZoomOut className="w-3 h-3" />
          </button>
          <button
            type="button"
            onClick={() => setZoom((z) => Math.min(4.5, z + 0.4))}
            className="p-1 bg-cream hover:bg-sand border border-[#b5aa94] rounded text-ink transition-colors cursor-pointer"
            title="Perbesar"
          >
            <ZoomIn className="w-3 h-3" />
          </button>
        </div>
      </div>
    </div>
  );
};
