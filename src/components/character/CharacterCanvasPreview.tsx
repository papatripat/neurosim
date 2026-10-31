import React, { useEffect, useRef, useState } from 'react';
import { CharacterCustomization, CharacterDirection } from '../../types/character';
import { ARCHETYPE_OPTIONS, SKIN_TONES, SHIRT_COLORS, PANTS_COLORS, HAIR_COLORS } from '../../config/characterOptions';
import { Play, Pause, ZoomIn, ZoomOut, RotateCw } from 'lucide-react';

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
  zoom: initialZoom = 3,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isWalking, setIsWalking] = useState(true);
  const [isPlaying, setIsPlaying] = useState(true);
  const [zoom, setZoom] = useState(initialZoom);
  const [frameIndex, setFrameIndex] = useState(0);

  // Spritesheet Image Cache
  const imageRef = useRef<HTMLImageElement | null>(null);
  const [imageLoaded, setImageLoaded] = useState(false);

  const archetype = config.archetype || 'resident';
  const spriteSheetUrl = `/assets/characters/${archetype}/aligned.png`;

  // Preload and cache spritesheet when archetype changes
  useEffect(() => {
    setImageLoaded(false);
    const img = new Image();
    img.src = spriteSheetUrl;
    img.onload = () => {
      imageRef.current = img;
      setImageLoaded(true);
    };
    img.onerror = () => {
      // Fallback to resident if archetype image fails
      const fallback = new Image();
      fallback.src = '/assets/characters/resident/aligned.png';
      fallback.onload = () => {
        imageRef.current = fallback;
        setImageLoaded(true);
      };
    };
  }, [archetype, spriteSheetUrl]);

  // Frame timing calculation:
  // Row 0..3: Idle (South, East, North, West) -> 9 frames
  // Row 4..7: Walk (South, East, North, West) -> 8 frames
  const maxFrames = isWalking ? 8 : 9;
  const frameInterval = isWalking ? 110 : 260; // ms per frame

  useEffect(() => {
    if (!isPlaying) return;
    const timer = setInterval(() => {
      setFrameIndex((prev) => (prev + 1) % maxFrames);
    }, frameInterval);
    return () => clearInterval(timer);
  }, [isPlaying, isWalking, maxFrames, frameInterval]);

  // Render to canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !imageLoaded || !imageRef.current) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Determine row based on walk state and direction
    // Direction rows in spritesheet:
    // South: idle = row 0, walk = row 4
    // East:  idle = row 1, walk = row 5
    // North: idle = row 2, walk = row 6
    // West:  idle = row 3, walk = row 7
    let row = 0;
    if (!isWalking) {
      if (direction === 'south') row = 0;
      else if (direction === 'east') row = 1;
      else if (direction === 'north') row = 2;
      else if (direction === 'west') row = 3;
    } else {
      if (direction === 'south') row = 4;
      else if (direction === 'east') row = 5;
      else if (direction === 'north') row = 6;
      else if (direction === 'west') row = 7;
    }

    const frame = frameIndex % maxFrames;
    const srcX = frame * 64;
    const srcY = row * 64;

    // Reset canvas and enable crisp pixel-art nearest neighbor interpolation
    ctx.imageSmoothingEnabled = false;
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Draw soft ground shadow ellipse
    const centerX = canvas.width / 2;
    const groundY = canvas.height - 18 * (zoom / 2.5);
    ctx.beginPath();
    ctx.ellipse(centerX, groundY, 18 * (zoom / 2), 6 * (zoom / 2), 0, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(0, 0, 0, 0.25)';
    ctx.fill();

    // Draw base character sprite (64x64 scaled by zoom)
    const destW = 64 * zoom;
    const destH = 64 * zoom;
    const destX = (canvas.width - destW) / 2;
    const destY = (canvas.height - destH) / 2 - 4 * zoom;

    ctx.drawImage(
      imageRef.current,
      srcX,
      srcY,
      64,
      64,
      Math.round(destX),
      Math.round(destY),
      Math.round(destW),
      Math.round(destH)
    );

    // Draw subtle accessory overlays if enabled (e.g. Glasses, ID Badge, Headset)
    if (direction === 'south' || direction === 'east' || direction === 'west') {
      // 1. ID Badge Lanyard
      if (config.accessory === 'id-badge' && direction === 'south') {
        const badgeY = destY + 36 * zoom;
        const badgeX = destX + 31 * zoom;
        // Ribbon
        ctx.strokeStyle = '#355c5a';
        ctx.lineWidth = Math.max(1, Math.round(zoom * 0.7));
        ctx.beginPath();
        ctx.moveTo(destX + 27 * zoom, destY + 28 * zoom);
        ctx.lineTo(badgeX, badgeY);
        ctx.lineTo(destX + 37 * zoom, destY + 28 * zoom);
        ctx.stroke();
        // Badge card
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(badgeX - 2.5 * zoom, badgeY, 5 * zoom, 6 * zoom);
        ctx.fillStyle = '#e0b65d';
        ctx.fillRect(badgeX - 1.5 * zoom, badgeY + 1.5 * zoom, 3 * zoom, 2 * zoom);
      }

      // 2. Glasses / Eyewear
      if (config.glasses && config.glasses !== 'none') {
        const eyeY = destY + 23 * zoom;
        const eyeLeftX = destX + 28 * zoom;
        const eyeRightX = destX + 34 * zoom;
        const frameColor = config.glasses === 'wire-frame' ? '#c99632' : '#1e1e24';
        ctx.strokeStyle = frameColor;
        ctx.lineWidth = Math.max(1, Math.round(zoom * 0.5));

        if (direction === 'south') {
          // Left rim
          ctx.strokeRect(eyeLeftX - 2 * zoom, eyeY - 2 * zoom, 4 * zoom, 3 * zoom);
          // Right rim
          ctx.strokeRect(eyeRightX - 2 * zoom, eyeY - 2 * zoom, 4 * zoom, 3 * zoom);
          // Bridge
          ctx.beginPath();
          ctx.moveTo(eyeLeftX + 2 * zoom, eyeY);
          ctx.lineTo(eyeRightX - 2 * zoom, eyeY);
          ctx.stroke();
        } else if (direction === 'west') {
          ctx.strokeRect(destX + 26 * zoom, eyeY - 2 * zoom, 4 * zoom, 3 * zoom);
        } else if (direction === 'east') {
          ctx.strokeRect(destX + 34 * zoom, eyeY - 2 * zoom, 4 * zoom, 3 * zoom);
        }
      }

      // 3. Headset / Earphones
      if (config.accessory === 'headset') {
        const headTopY = destY + 12 * zoom;
        ctx.strokeStyle = '#2b2f38';
        ctx.lineWidth = Math.max(2, Math.round(zoom * 0.8));
        // Band across head
        ctx.beginPath();
        ctx.arc(centerX, headTopY + 10 * zoom, 12 * zoom, Math.PI, 0, false);
        ctx.stroke();
        // Ear cups
        ctx.fillStyle = '#355c5a';
        ctx.fillRect(centerX - 13 * zoom, headTopY + 7 * zoom, 3 * zoom, 6 * zoom);
        ctx.fillRect(centerX + 10 * zoom, headTopY + 7 * zoom, 3 * zoom, 6 * zoom);
      }
    }
  }, [config, direction, frameIndex, isWalking, zoom, imageLoaded, maxFrames]);

  const skinToneObj = SKIN_TONES.find((s) => s.id === config.skinTone);
  const hairColorObj = HAIR_COLORS.find((h) => h.id === config.hairColor);
  const shirtColorObj = SHIRT_COLORS.find((c) => c.id === config.shirtColor);
  const pantsColorObj = PANTS_COLORS.find((p) => p.id === config.pantsColor);
  const archetypeObj = ARCHETYPE_OPTIONS.find((a) => a.id === archetype);

  return (
    <div className={`flex flex-col items-center select-none ${className}`}>
      {/* Canvas Viewport */}
      <div className="relative rounded-xl border-2 border-[#b5aa94] bg-[#242a38] shadow-inner overflow-hidden flex items-center justify-center p-2">
        {/* Archetype & Resolution Watermark */}
        <div className="absolute top-2 left-2 text-[10px] font-mono font-bold text-soft/80 bg-black/40 px-2 py-0.5 rounded backdrop-blur-xs flex items-center gap-1.5 border border-white/10 z-10">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
          <span>{archetypeObj?.name.split(' ')[0] || 'Residen'} · 64×64 LPC</span>
        </div>

        {/* Zoom & Playback Controls Top Right */}
        <div className="absolute top-2 right-2 flex items-center gap-1 z-10">
          <button
            type="button"
            onClick={() => setZoom((z) => Math.min(4.5, z + 0.5))}
            className="p-1 rounded bg-black/40 text-soft/80 hover:text-soft hover:bg-black/60 transition-colors"
            title="Perbesar Preview"
            aria-label="Perbesar"
          >
            <ZoomIn className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={() => setZoom((z) => Math.max(1.8, z - 0.5))}
            className="p-1 rounded bg-black/40 text-soft/80 hover:text-soft hover:bg-black/60 transition-colors"
            title="Perkecil Preview"
            aria-label="Perkecil"
          >
            <ZoomOut className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={() => setIsPlaying((p) => !p)}
            className="p-1 rounded bg-black/40 text-soft/80 hover:text-soft hover:bg-black/60 transition-colors"
            title={isPlaying ? 'Jeda Animasi' : 'Jalankan Animasi'}
            aria-label={isPlaying ? 'Jeda' : 'Jalankan'}
          >
            {isPlaying ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
          </button>
        </div>

        {/* HTML5 Canvas */}
        <canvas
          ref={canvasRef}
          width={180}
          height={180}
          className="w-44 h-44 sm:w-48 sm:h-48 cursor-pointer pixelated"
          onClick={() => {
            // Click canvas to cycle directions: south -> west -> north -> east
            const order: CharacterDirection[] = ['south', 'west', 'north', 'east'];
            const nextIdx = (order.indexOf(direction) + 1) % order.length;
            onChangeDirection?.(order[nextIdx]);
          }}
          title="Klik kanvas untuk memutar sudut pandang"
        />

        {/* Palette Swatches Bar Bottom */}
        <div className="absolute bottom-2 left-2 right-2 flex items-center justify-between px-2 py-1 rounded bg-black/60 backdrop-blur-xs text-[10px] text-soft/80 border border-white/10 z-10">
          <div className="flex items-center gap-1.5">
            <span
              className="w-2.5 h-2.5 rounded-full border border-white/60 shadow-xs"
              style={{ backgroundColor: skinToneObj?.hex }}
              title={`Kulit: ${skinToneObj?.name}`}
            />
            <span
              className="w-2.5 h-2.5 rounded-full border border-white/60 shadow-xs"
              style={{ backgroundColor: hairColorObj?.hex }}
              title={`Rambut: ${hairColorObj?.name}`}
            />
            <span
              className="w-2.5 h-2.5 rounded-full border border-white/60 shadow-xs"
              style={{ backgroundColor: shirtColorObj?.hex }}
              title={`Atasan: ${shirtColorObj?.name}`}
            />
            <span
              className="w-2.5 h-2.5 rounded-full border border-white/60 shadow-xs"
              style={{ backgroundColor: pantsColorObj?.hex }}
              title={`Bawahan: ${pantsColorObj?.name}`}
            />
          </div>
          <span className="font-mono text-[9px] text-soft/60">
            {isWalking ? 'Walk Cycle (8f)' : 'Idle Stance (9f)'}
          </span>
        </div>
      </div>

      {/* Direction & Animation Toggles */}
      <div className="flex items-center justify-between w-full mt-2.5 gap-2">
        {/* 4 Directions */}
        <div className="flex items-center gap-1 bg-cream/90 p-1 rounded-lg border border-[#c4b8a1] shadow-2xs">
          {(['south', 'west', 'east', 'north'] as CharacterDirection[]).map((dir) => (
            <button
              key={dir}
              type="button"
              onClick={() => onChangeDirection?.(dir)}
              className={`px-2 py-0.5 text-[11px] font-bold rounded uppercase transition-colors ${
                direction === dir
                  ? 'bg-teal text-soft shadow-xs'
                  : 'text-ink-muted hover:text-ink hover:bg-sand/60'
              }`}
            >
              {dir === 'south'
                ? 'Depan'
                : dir === 'north'
                ? 'Belakang'
                : dir === 'west'
                ? 'Kiri'
                : 'Kanan'}
            </button>
          ))}
        </div>

        {/* Walk vs Idle */}
        <button
          type="button"
          onClick={() => setIsWalking((w) => !w)}
          className={`flex items-center gap-1 px-2.5 py-1 text-xs font-bold rounded-lg border transition-colors shadow-2xs ${
            isWalking
              ? 'bg-sand text-ink border-[#b5aa94]'
              : 'bg-cream text-ink-muted border-[#c4b8a1] hover:text-ink'
          }`}
          title="Ganti antara animasi berjalan dan diam"
        >
          <RotateCw className="w-3 h-3" />
          <span>{isWalking ? 'Berjalan' : 'Diam'}</span>
        </button>
      </div>
    </div>
  );
};
