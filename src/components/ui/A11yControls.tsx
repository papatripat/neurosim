import React from 'react';
import { Zap, ZapOff, Type, Contrast } from 'lucide-react';

export type TextScale = 'normal' | 'medium' | 'large';

interface Props {
  reduceMotion?: boolean;
  onToggleReduceMotion?: () => void;
  textScale: TextScale;
  onChangeTextScale: (s: TextScale) => void;
  highContrast: boolean;
  onToggleHighContrast: () => void;
  className?: string;
}

const SCALE_CYCLE: TextScale[] = ['normal', 'medium', 'large'];
const SCALE_SHORT_LABEL: Record<TextScale, string> = {
  normal: '100%',
  medium: '115%',
  large: '130%',
};

export const AccessibilityControls: React.FC<Props> = ({
  reduceMotion = false,
  onToggleReduceMotion,
  textScale,
  onChangeTextScale,
  highContrast,
  onToggleHighContrast,
  className = '',
}) => {
  const nextScale = () => {
    const i = SCALE_CYCLE.indexOf(textScale);
    onChangeTextScale(SCALE_CYCLE[(i + 1) % SCALE_CYCLE.length]);
  };

  return (
    <div
      role="region"
      aria-label="Pengaturan Aksesibilitas"
      className={`flex items-center gap-0.5 bg-sand/70 p-0.5 rounded-md border border-[#d1c7b5] flex-nowrap ${className}`}
    >
      {/* Reduce Motion Toggle (if provided) */}
      {onToggleReduceMotion && (
        <button
          type="button"
          onClick={onToggleReduceMotion}
          aria-pressed={reduceMotion}
          aria-label="Kurangi animasi visual layar"
          title={
            reduceMotion
              ? 'Animasi Diminimalkan (Klik untuk aktifkan gerak normal)'
              : 'Animasi Normal (Klik untuk minimalkan gerak layar)'
          }
          className={`px-2 py-1 text-xs font-semibold rounded flex items-center gap-1 transition-colors whitespace-nowrap cursor-pointer ${
            reduceMotion
              ? 'bg-teal text-soft shadow-2xs'
              : 'text-ink-muted hover:text-ink hover:bg-cream'
          }`}
        >
          {reduceMotion ? <ZapOff className="w-3.5 h-3.5" /> : <Zap className="w-3.5 h-3.5" />}
          <span className="hidden xl:inline">{reduceMotion ? 'Gerak: Min' : 'Animasi'}</span>
        </button>
      )}

      {/* Font / Viewport Text Scaling Cycle */}
      <button
        type="button"
        onClick={nextScale}
        aria-label={`Ubah skala font tampilan: saat ini ${SCALE_SHORT_LABEL[textScale]}`}
        title={`Skala Teks: ${SCALE_SHORT_LABEL[textScale]} (Klik untuk ubah: 100% -> 115% -> 130%)`}
        className={`px-2 py-1 text-xs font-semibold font-mono rounded flex items-center gap-1 transition-colors whitespace-nowrap cursor-pointer ${
          textScale !== 'normal'
            ? 'bg-teal text-soft shadow-2xs'
            : 'text-ink-muted hover:text-ink hover:bg-cream'
        }`}
      >
        <Type className="w-3.5 h-3.5 flex-shrink-0" />
        <span>{SCALE_SHORT_LABEL[textScale]}</span>
      </button>

      {/* High Contrast Mode Toggle */}
      <button
        type="button"
        onClick={onToggleHighContrast}
        aria-pressed={highContrast}
        aria-label="Alihkan mode kontras tinggi"
        title={
          highContrast
            ? 'Mode Kontras Tinggi Aktif (Klik untuk kembali ke tema normal)'
            : 'Aktifkan Mode Kontras Tinggi'
        }
        className={`px-2 py-1 text-xs font-semibold rounded flex items-center gap-1 transition-colors whitespace-nowrap cursor-pointer ${
          highContrast
            ? 'bg-black text-yellow-300 ring-1 ring-yellow-400 shadow-2xs'
            : 'text-ink-muted hover:text-ink hover:bg-cream'
        }`}
      >
        <Contrast className="w-3.5 h-3.5" />
        <span className="hidden xl:inline">Kontras</span>
      </button>
    </div>
  );
};

// Aliases for backward compatibility
export const A11yControls = AccessibilityControls;
