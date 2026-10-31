import React from 'react';

export type TextScale = 'normal' | 'medium' | 'large';

interface Props {
  reduceMotion: boolean;
  onToggleReduceMotion: () => void;
  textScale: TextScale;
  onChangeTextScale: (s: TextScale) => void;
  highContrast: boolean;
  onToggleHighContrast: () => void;
}

const SCALE_CYCLE: TextScale[] = ['normal', 'medium', 'large'];
const SCALE_LABEL: Record<TextScale, string> = {
  normal: 'Teks: 100%',
  medium: 'Teks: 115%',
  large: 'Teks: 130%',
};

export const A11yControls: React.FC<Props> = ({
  reduceMotion,
  onToggleReduceMotion,
  textScale,
  onChangeTextScale,
  highContrast,
  onToggleHighContrast,
}) => {
  const nextScale = () => {
    const i = SCALE_CYCLE.indexOf(textScale);
    onChangeTextScale(SCALE_CYCLE[(i + 1) % SCALE_CYCLE.length]);
  };

  return (
    <div className="flex items-center gap-1.5 flex-wrap">
      <button
        type="button"
        onClick={onToggleReduceMotion}
        aria-pressed={reduceMotion}
        aria-label="Kurangi animasi layar"
        title="Kurangi Animasi (Reduce Motion)"
        className={`px-2.5 py-1 text-xs font-medium rounded border transition-colors ${
          reduceMotion
            ? 'bg-teal text-soft border-teal'
            : 'bg-parchment border-muted/30 text-ink hover:bg-sand'
        }`}
      >
        {reduceMotion ? 'Animasi: Min' : 'Animasi'}
      </button>

      <button
        type="button"
        onClick={nextScale}
        aria-label="Ubah ukuran teks"
        title="Ubah Ukuran Teks"
        className="px-2.5 py-1 text-xs font-medium rounded border bg-parchment border-muted/30 text-ink hover:bg-sand transition-colors font-mono"
      >
        {SCALE_LABEL[textScale]}
      </button>

      <button
        type="button"
        onClick={onToggleHighContrast}
        aria-pressed={highContrast}
        aria-label="Mode kontras tinggi"
        title="Mode Kontras Tinggi"
        className={`px-2.5 py-1 text-xs font-medium rounded border transition-colors ${
          highContrast
            ? 'bg-black text-yellow-300 border-black ring-2 ring-yellow-400'
            : 'bg-parchment border-muted/30 text-ink hover:bg-sand'
        }`}
      >
        Kontras
      </button>
    </div>
  );
};
