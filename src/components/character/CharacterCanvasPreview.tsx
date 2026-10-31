import React, { useEffect, useRef, useState } from 'react';
import { CharacterCustomization, CharacterDirection } from '../../types/character';
import { Play, Pause, ZoomIn, ZoomOut, RotateCw } from 'lucide-react';
import {
  getLpcLayers,
  loadPalettes,
  loadImage,
  recolorImageData,
} from '../../lib/lpcCompositor';

interface Props {
  config: CharacterCustomization;
  direction: CharacterDirection;
  onChangeDirection?: (dir: CharacterDirection) => void;
  className?: string;
  zoom?: number;
}

export const CharacterCanvasPreview: React.FC<Props> = ({
  config,
  direction,
  onChangeDirection,
  className = '',
  zoom: initialZoom = 3.2,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isWalking, setIsWalking] = useState(true);
  const [isPlaying, setIsPlaying] = useState(true);
  const [zoom, setZoom] = useState(initialZoom);
  const [frameIndex, setFrameIndex] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  // Cached composited 576×256 canvas for the current config
  const compositeCanvasRef = useRef<HTMLCanvasElement | null>(null);

  // Re-composite character layers whenever config changes
  useEffect(() => {
    let active = true;
    setIsLoading(true);

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

            // Palette recolor swap
            if (layer.paletteType && layer.sourceVariant && layer.targetVariant) {
              let palGroup: Record<string, string[]> | null = null;
              if (layer.paletteType === 'body') palGroup = palettes.body;
              else if (layer.paletteType === 'hair') palGroup = palettes.hair;
              else if (layer.paletteType === 'cloth') palGroup = palettes.cloth;

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

            offCtx.drawImage(tempCanvas, 0, 0);
          } catch (err) {
            console.warn(`Layer render failed: ${layer.id}`, err);
          }
        }

        if (active) {
          compositeCanvasRef.current = offscreen;
          setIsLoading(false);
        }
      } catch (err) {
        console.error('Failed to composite LPC preview:', err);
        if (active) setIsLoading(false);
      }
    };

    buildComposite();

    return () => {
      active = false;
    };
  }, [config]);

  // Frame timing loop:
  // LPC walk cycle: 8 walking frames (frames 1..8)
  const maxWalkFrames = 8;
  const frameInterval = isWalking ? 120 : 300;

  useEffect(() => {
    if (!isPlaying) return;
    const timer = setInterval(() => {
      if (isWalking) {
        setFrameIndex((prev) => (prev + 1) % maxWalkFrames);
      } else {
        setFrameIndex(0);
      }
    }, frameInterval);
    return () => clearInterval(timer);
  }, [isPlaying, isWalking, frameInterval]);

  // Render current frame to display canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    const comp = compositeCanvasRef.current;
    if (!canvas || !comp) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // LPC walk.png row mapping:
    // Row 0: North (up)
    // Row 1: West (left)
    // Row 2: South (down)
    // Row 3: East (right)
    let row = 2; // default south
    if (direction === 'north') row = 0;
    else if (direction === 'west') row = 1;
    else if (direction === 'south') row = 2;
    else if (direction === 'east') row = 3;

    // Frame column in LPC walk.png:
    // Frame 0 = idle/standing pose
    // Frames 1..8 = walk cycle frames
    let col = 0;
    if (isWalking) {
      col = 1 + (frameIndex % maxWalkFrames);
    } else {
      col = 0; // Standing frame
    }

    const srcX = col * 64;
    const srcY = row * 64;

    ctx.imageSmoothingEnabled = false;
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Draw floor pedestal shadow
    const centerX = canvas.width / 2;
    const groundY = canvas.height - 20 * (zoom / 3);
    ctx.beginPath();
    ctx.ellipse(centerX, groundY, 18 * (zoom / 2.2), 6 * (zoom / 2.2), 0, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(0, 0, 0, 0.22)';
    ctx.fill();

    // Draw 64x64 sprite scaled by zoom
    const destW = 64 * zoom;
    const destH = 64 * zoom;
    const destX = (canvas.width - destW) / 2;
    const destY = (canvas.height - destH) / 2 - 6 * (zoom / 3);

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

    // Subtle ID Badge overlay for office immersion if selected
    if (config.accessory === 'id-badge' && (direction === 'south' || direction === 'east')) {
      const badgeY = destY + 36 * zoom;
      const badgeX = destX + (direction === 'south' ? 31 * zoom : 33 * zoom);
      ctx.strokeStyle = '#355c5a';
      ctx.lineWidth = Math.max(1, Math.round(zoom * 0.7));
      ctx.beginPath();
      ctx.moveTo(destX + 27 * zoom, destY + 28 * zoom);
      ctx.lineTo(badgeX, badgeY);
      ctx.lineTo(destX + 37 * zoom, destY + 28 * zoom);
      ctx.stroke();
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(badgeX - 2.5 * zoom, badgeY, 5 * zoom, 6 * zoom);
      ctx.fillStyle = '#e0b65d';
      ctx.fillRect(badgeX - 1.5 * zoom, badgeY + 1.5 * zoom, 3 * zoom, 2 * zoom);
    }
  }, [direction, isWalking, frameIndex, zoom, isLoading]);

  const handleRotate = () => {
    const dirs: CharacterDirection[] = ['south', 'west', 'north', 'east'];
    const nextIdx = (dirs.indexOf(direction) + 1) % dirs.length;
    onChangeDirection?.(dirs[nextIdx]);
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
          {direction === 'south'
            ? 'Menghadap Depan'
            : direction === 'north'
            ? 'Menghadap Belakang'
            : direction === 'west'
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
              onClick={() => onChangeDirection?.(d)}
              title={`Arah ${d}`}
              className={`px-1.5 py-0.5 text-[10px] font-bold rounded transition-colors uppercase ${
                direction === d
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
