import React, { useState, useEffect, useRef } from 'react';
import {
  X,
  Sparkles,
  RotateCcw,
  User,
  Scissors,
  Briefcase,
  Shirt,
  Tag,
  Check,
  ChevronRight,
  Info,
} from 'lucide-react';
import {
  CharacterCustomization,
  CharacterDirection,
} from '../../types/character';
import {
  SKIN_TONES,
  HAIR_COLORS,
  EYE_COLORS,
  SHIRT_COLORS,
  SUIT_COLORS,
  TIE_COLORS,
  PANTS_COLORS,
  SHOES_COLORS,
  HAIR_STYLES,
  FACIAL_HAIR_OPTIONS,
  GLASSES_OPTIONS,
  SHIRT_OPTIONS,
  SUIT_OPTIONS,
  TIE_OPTIONS,
  PANTS_OPTIONS,
  SHOES_OPTIONS,
  ACCESSORIES_OPTIONS,
  CHARACTER_PRESETS,
  DEFAULT_CHARACTER,
} from '../../config/characterOptions';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  currentConfig?: CharacterCustomization;
  onSaveConfig: (config: CharacterCustomization) => void;
}

type TabCategory = 'identity' | 'hair' | 'top' | 'bottom' | 'accessories';

export const CharacterCustomizerModal: React.FC<Props> = ({
  isOpen,
  onClose,
  currentConfig,
  onSaveConfig,
}) => {
  const [config, setConfig] = useState<CharacterCustomization>(
    currentConfig || DEFAULT_CHARACTER
  );
  const [activeTab, setActiveTab] = useState<TabCategory>('identity');
  const [previewDirection, setPreviewDirection] = useState<CharacterDirection>('south');
  const dialogRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (currentConfig) {
      setConfig(currentConfig);
    }
  }, [currentConfig]);

  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  // Handlers
  const handleRandomize = () => {
    const randomItem = <T,>(arr: T[]): T => arr[Math.floor(Math.random() * arr.length)];
    setConfig({
      name: config.name,
      gender: Math.random() > 0.5 ? 'male' : 'female',
      bodyType: 'standard',
      skinTone: randomItem(SKIN_TONES).id,
      hairStyle: randomItem(HAIR_STYLES).id,
      hairColor: randomItem(HAIR_COLORS).id,
      eyeColor: randomItem(EYE_COLORS).id,
      facialHair: config.gender === 'female' ? 'none' : randomItem(FACIAL_HAIR_OPTIONS).id,
      glasses: randomItem(GLASSES_OPTIONS).id,
      shirtType: randomItem(SHIRT_OPTIONS).id,
      shirtColor: randomItem(SHIRT_COLORS).id,
      suitType: randomItem(SUIT_OPTIONS).id,
      suitColor: randomItem(SUIT_COLORS).id,
      tieType: randomItem(TIE_OPTIONS).id,
      tieColor: randomItem(TIE_COLORS).id,
      pantsType: randomItem(PANTS_OPTIONS).id,
      pantsColor: randomItem(PANTS_COLORS).id,
      shoesType: randomItem(SHOES_OPTIONS).id,
      shoesColor: randomItem(SHOES_COLORS).id,
      accessory: randomItem(ACCESSORIES_OPTIONS).id,
    });
  };

  const handleApplyPreset = (presetId: string) => {
    const found = CHARACTER_PRESETS.find((p) => p.id === presetId);
    if (found) {
      setConfig({ ...found.config, name: config.name });
    }
  };

  const handleReset = () => {
    setConfig(currentConfig || DEFAULT_CHARACTER);
  };

  const handleSave = () => {
    onSaveConfig(config);
    onClose();
  };

  const currentSkin = SKIN_TONES.find((s) => s.id === config.skinTone) || SKIN_TONES[1];
  const currentHairCol = HAIR_COLORS.find((h) => h.id === config.hairColor) || HAIR_COLORS[0];
  const currentShirtCol = SHIRT_COLORS.find((c) => c.id === config.shirtColor) || SHIRT_COLORS[0];
  const currentSuitCol = SUIT_COLORS.find((c) => c.id === config.suitColor) || SUIT_COLORS[0];
  const currentTieCol = TIE_COLORS.find((c) => c.id === config.tieColor) || TIE_COLORS[0];
  const currentPantsCol = PANTS_COLORS.find((c) => c.id === config.pantsColor) || PANTS_COLORS[0];
  const currentShoesCol = SHOES_COLORS.find((c) => c.id === config.shoesColor) || SHOES_COLORS[0];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-2 sm:p-4 overflow-y-auto">
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="customizer-title"
        tabIndex={-1}
        className="w-full max-w-4xl bg-cream border-2 border-teal rounded-xl shadow-2xl flex flex-col max-h-[94vh] overflow-hidden text-ink"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3 bg-teal text-soft border-b border-teal-dark flex-shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded bg-cream/15 border border-soft/30 flex items-center justify-center">
              <Shirt className="w-4 h-4 text-soft" />
            </div>
            <div>
              <h2 id="customizer-title" className="text-sm sm:text-base font-bold leading-tight">
                Kustomisasi Karakter
              </h2>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Tutup kustomisasi"
            className="p-1.5 rounded hover:bg-black/20 text-soft transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body: Dual Column */}
        <div className="flex-1 min-h-0 flex flex-col md:flex-row overflow-hidden bg-sand/40">
          {/* Left Column: Live Character Preview & Presets */}
          <div className="w-full md:w-72 lg:w-80 p-4 border-b md:border-b-0 md:border-r border-[#d1c7b5] flex flex-col bg-cream/60 overflow-y-auto flex-shrink-0 space-y-4">
            {/* Visual Avatar Stage */}
            <div className="bg-sand/80 border-2 border-[#b5aa94] rounded-lg p-4 flex flex-col items-center shadow-inner relative">
              <div className="absolute top-2 left-2 text-[10px] font-mono font-bold text-ink-muted px-1.5 py-0.5 rounded bg-cream/80 border border-muted/20">
                PREVIEW 64×64
              </div>

              {/* Character Visual Avatar Preview */}
              <div className="w-28 h-28 my-2 rounded-lg bg-cream border border-[#a89b84] flex items-center justify-center relative overflow-hidden shadow-xs">
                <img
                  src={`/assets/characters/resident/standing/${previewDirection}.png`}
                  alt={`Karakter arah ${previewDirection}`}
                  className="w-20 h-20 object-contain scale-[2.2] pixelated"
                />

                {/* Color Swatch Accents Overlay Badge */}
                <div className="absolute bottom-1 right-1 flex items-center gap-1 bg-black/60 px-1 py-0.5 rounded backdrop-blur-xs">
                  <span
                    className="w-2 h-2 rounded-full border border-white/50"
                    style={{ backgroundColor: currentShirtCol.hex }}
                    title={`Kemeja: ${currentShirtCol.name}`}
                  />
                  <span
                    className="w-2 h-2 rounded-full border border-white/50"
                    style={{ backgroundColor: currentPantsCol.hex }}
                    title={`Celana: ${currentPantsCol.name}`}
                  />
                </div>
              </div>

              {/* Direction Switcher (South, West, East, North) */}
              <div className="flex items-center gap-1 mt-1 bg-cream p-1 rounded-md border border-[#c4b8a1]">
                {(['south', 'west', 'east', 'north'] as CharacterDirection[]).map((dir) => (
                  <button
                    key={dir}
                    type="button"
                    onClick={() => setPreviewDirection(dir)}
                    className={`px-2 py-0.5 text-[10px] font-bold rounded uppercase transition-colors ${
                      previewDirection === dir
                        ? 'bg-teal text-soft shadow-xs'
                        : 'text-ink-muted hover:text-ink hover:bg-sand'
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

              <div className="text-center mt-2">
                <span className="font-bold text-xs block text-ink">{config.name}</span>
                <span className="text-[10px] text-ink-muted">
                  {config.gender === 'male' ? 'Karyawan Pria' : 'Karyawan Wanita'} ·{' '}
                  {SHIRT_OPTIONS.find((s) => s.id === config.shirtType)?.name}
                </span>
              </div>
            </div>

            {/* Quick Actions (Randomize & Reset) */}
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={handleRandomize}
                className="flex items-center justify-center gap-1.5 py-1.5 px-2 bg-cream hover:bg-sand border border-[#b5aa94] rounded text-xs font-semibold text-ink transition-colors shadow-2xs"
              >
                <Sparkles className="w-3.5 h-3.5 text-ochre" />
                <span>Acak Tampilan</span>
              </button>
              <button
                type="button"
                onClick={handleReset}
                className="flex items-center justify-center gap-1.5 py-1.5 px-2 bg-cream hover:bg-sand border border-[#b5aa94] rounded text-xs font-semibold text-ink-muted hover:text-ink transition-colors shadow-2xs"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Pulihkan Awal</span>
              </button>
            </div>

            {/* Template Presets */}
            <div className="space-y-1.5 pt-2 border-t border-[#d1c7b5]">
              <span className="text-[11px] font-bold text-ink uppercase tracking-wider block">
                Inspirasi Gaya Cepat:
              </span>
              <div className="space-y-1">
                {CHARACTER_PRESETS.map((preset) => (
                  <button
                    key={preset.id}
                    type="button"
                    onClick={() => handleApplyPreset(preset.id)}
                    className="w-full text-left p-2 rounded bg-cream hover:bg-sand border border-[#d1c7b5] text-xs transition-colors group flex items-center justify-between"
                  >
                    <div>
                      <span className="font-semibold block text-ink group-hover:text-teal">
                        {preset.name}
                      </span>
                      <span className="text-[10px] text-ink-muted line-clamp-1">
                        {preset.description}
                      </span>
                    </div>
                    <ChevronRight className="w-3.5 h-3.5 text-ink-muted group-hover:translate-x-0.5 transition-transform flex-shrink-0" />
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Right Column: Customization Tabs & Options */}
          <div className="flex-1 flex flex-col min-h-0 bg-parchment/40">
            {/* Category Tabs */}
            <div className="grid grid-cols-5 border-b border-[#d1c7b5] bg-cream flex-shrink-0">
              {[
                { id: 'identity', label: 'Wajah', icon: User },
                { id: 'hair', label: 'Rambut', icon: Scissors },
                { id: 'top', label: 'Atasan', icon: Shirt },
                { id: 'bottom', label: 'Bawahan', icon: Briefcase },
                { id: 'accessories', label: 'Aksesoris', icon: Tag },
              ].map((tab) => {
                const IconComponent = tab.icon;
                const isActive = activeTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => setActiveTab(tab.id as TabCategory)}
                    className={`flex flex-col sm:flex-row items-center justify-center gap-1 sm:gap-1.5 py-2.5 px-1 sm:px-2 text-xs font-semibold border-b-2 transition-colors ${
                      isActive
                        ? 'border-teal text-teal bg-sand/30'
                        : 'border-transparent text-ink-muted hover:text-ink hover:bg-sand/10'
                    }`}
                  >
                    <IconComponent className="w-3.5 h-3.5 flex-shrink-0" />
                    <span className="truncate">{tab.label}</span>
                  </button>
                );
              })}
            </div>

            {/* Tab Panels */}
            <div className="flex-1 p-4 overflow-y-auto space-y-5">
              {/* TAB 1: IDENTITAS & WAJAH */}
              {activeTab === 'identity' && (
                <div className="space-y-4">
                  {/* Gender Selector */}
                  <div>
                    <label className="text-xs font-bold text-ink block mb-1.5">
                      Gender Dasar Karakter:
                    </label>
                    <div className="grid grid-cols-2 gap-2 max-w-sm">
                      <button
                        type="button"
                        onClick={() => setConfig({ ...config, gender: 'male' })}
                        className={`p-2.5 rounded-lg border text-xs font-semibold flex items-center justify-center gap-2 transition-colors ${
                          config.gender === 'male'
                            ? 'bg-teal text-soft border-teal shadow-xs'
                            : 'bg-cream text-ink border-[#d1c7b5] hover:bg-sand'
                        }`}
                      >
                        <span>Pria (Male Base)</span>
                        {config.gender === 'male' && <Check className="w-3.5 h-3.5" />}
                      </button>
                      <button
                        type="button"
                        onClick={() => setConfig({ ...config, gender: 'female' })}
                        className={`p-2.5 rounded-lg border text-xs font-semibold flex items-center justify-center gap-2 transition-colors ${
                          config.gender === 'female'
                            ? 'bg-teal text-soft border-teal shadow-xs'
                            : 'bg-cream text-ink border-[#d1c7b5] hover:bg-sand'
                        }`}
                      >
                        <span>Wanita (Female Base)</span>
                        {config.gender === 'female' && <Check className="w-3.5 h-3.5" />}
                      </button>
                    </div>
                  </div>

                  {/* Skin Tone Palette */}
                  <div>
                    <label className="text-xs font-bold text-ink block mb-1.5">
                      Warna Kulit (Skin Tone):
                    </label>
                    <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
                      {SKIN_TONES.map((tone) => (
                        <button
                          key={tone.id}
                          type="button"
                          onClick={() => setConfig({ ...config, skinTone: tone.id })}
                          className={`p-2 rounded-lg border flex flex-col items-center gap-1.5 transition-all ${
                            config.skinTone === tone.id
                              ? 'border-teal bg-cream ring-2 ring-teal shadow-xs'
                              : 'border-[#d1c7b5] bg-cream/70 hover:bg-sand'
                          }`}
                        >
                          <span
                            className="w-6 h-6 rounded-full border border-black/20 shadow-inner"
                            style={{ backgroundColor: tone.hex }}
                          />
                          <span className="text-[10px] text-center font-medium line-clamp-1">
                            {tone.name.split(' ')[0]}
                          </span>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Eye Color */}
                  <div>
                    <label className="text-xs font-bold text-ink block mb-1.5">
                      Warna Iris Mata:
                    </label>
                    <div className="flex flex-wrap gap-2">
                      {EYE_COLORS.map((col) => (
                        <button
                          key={col.id}
                          type="button"
                          onClick={() => setConfig({ ...config, eyeColor: col.id })}
                          className={`px-2.5 py-1.5 rounded-md border text-xs flex items-center gap-2 transition-all ${
                            config.eyeColor === col.id
                              ? 'border-teal bg-cream ring-1 ring-teal font-semibold text-teal'
                              : 'border-[#d1c7b5] bg-cream text-ink hover:bg-sand'
                          }`}
                        >
                          <span
                            className="w-3.5 h-3.5 rounded-full border border-black/20"
                            style={{ backgroundColor: col.hex }}
                          />
                          <span>{col.name}</span>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Facial Hair (Only if male) */}
                  {config.gender === 'male' && (
                    <div>
                      <label className="text-xs font-bold text-ink block mb-1.5">
                        Kumis & Jenggot (Facial Hair):
                      </label>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        {FACIAL_HAIR_OPTIONS.map((opt) => (
                          <button
                            key={opt.id}
                            type="button"
                            onClick={() => setConfig({ ...config, facialHair: opt.id })}
                            className={`p-2 rounded-lg border text-left text-xs transition-colors ${
                              config.facialHair === opt.id
                                ? 'border-teal bg-cream ring-1 ring-teal'
                                : 'border-[#d1c7b5] bg-cream/80 hover:bg-sand'
                            }`}
                          >
                            <span className="font-semibold block text-ink">{opt.name}</span>
                            <span className="text-[10px] text-ink-muted">{opt.description}</span>
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Glasses */}
                  <div>
                    <label className="text-xs font-bold text-ink block mb-1.5">
                      Kacamata (Eyewear):
                    </label>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {GLASSES_OPTIONS.map((opt) => (
                        <button
                          key={opt.id}
                          type="button"
                          onClick={() => setConfig({ ...config, glasses: opt.id })}
                          className={`p-2 rounded-lg border text-left text-xs transition-colors ${
                            config.glasses === opt.id
                              ? 'border-teal bg-cream ring-1 ring-teal'
                              : 'border-[#d1c7b5] bg-cream/80 hover:bg-sand'
                          }`}
                        >
                          <span className="font-semibold block text-ink">{opt.name}</span>
                          <span className="text-[10px] text-ink-muted">{opt.description}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 2: RAMBUT */}
              {activeTab === 'hair' && (
                <div className="space-y-4">
                  {/* Hair Style */}
                  <div>
                    <label className="text-xs font-bold text-ink block mb-1.5">
                      Model Gaya Rambut:
                    </label>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {HAIR_STYLES.map((style) => (
                        <button
                          key={style.id}
                          type="button"
                          onClick={() => setConfig({ ...config, hairStyle: style.id })}
                          className={`p-2.5 rounded-lg border text-left text-xs transition-colors ${
                            config.hairStyle === style.id
                              ? 'border-teal bg-cream ring-1 ring-teal'
                              : 'border-[#d1c7b5] bg-cream/80 hover:bg-sand'
                          }`}
                        >
                          <span className="font-semibold block text-ink">{style.name}</span>
                          <span className="text-[10px] text-ink-muted">{style.description}</span>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Hair Color */}
                  <div>
                    <label className="text-xs font-bold text-ink block mb-1.5">
                      Warna Rambut:
                    </label>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                      {HAIR_COLORS.map((col) => (
                        <button
                          key={col.id}
                          type="button"
                          onClick={() => setConfig({ ...config, hairColor: col.id })}
                          className={`p-2 rounded-md border flex items-center gap-2 transition-all ${
                            config.hairColor === col.id
                              ? 'border-teal bg-cream ring-1 ring-teal font-semibold text-teal'
                              : 'border-[#d1c7b5] bg-cream text-ink hover:bg-sand'
                          }`}
                        >
                          <span
                            className="w-4 h-4 rounded-full border border-black/20 flex-shrink-0"
                            style={{ backgroundColor: col.hex }}
                          />
                          <span className="text-xs truncate">{col.name}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 3: ATASAN & JAS */}
              {activeTab === 'top' && (
                <div className="space-y-4">
                  {/* Shirt Model */}
                  <div>
                    <label className="text-xs font-bold text-ink block mb-1.5">
                      Model Kemeja / Atasan:
                    </label>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {SHIRT_OPTIONS.map((shirt) => (
                        <button
                          key={shirt.id}
                          type="button"
                          onClick={() => setConfig({ ...config, shirtType: shirt.id })}
                          className={`p-2.5 rounded-lg border text-left text-xs transition-colors ${
                            config.shirtType === shirt.id
                              ? 'border-teal bg-cream ring-1 ring-teal'
                              : 'border-[#d1c7b5] bg-cream/80 hover:bg-sand'
                          }`}
                        >
                          <span className="font-semibold block text-ink">{shirt.name}</span>
                          <span className="text-[10px] text-ink-muted">{shirt.description}</span>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Shirt Color */}
                  <div>
                    <label className="text-xs font-bold text-ink block mb-1.5">
                      Warna Kemeja:
                    </label>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                      {SHIRT_COLORS.map((col) => (
                        <button
                          key={col.id}
                          type="button"
                          onClick={() => setConfig({ ...config, shirtColor: col.id })}
                          className={`p-2 rounded-md border flex items-center gap-2 transition-all ${
                            config.shirtColor === col.id
                              ? 'border-teal bg-cream ring-1 ring-teal font-semibold text-teal'
                              : 'border-[#d1c7b5] bg-cream text-ink hover:bg-sand'
                          }`}
                        >
                          <span
                            className="w-4 h-4 rounded-full border border-black/20 flex-shrink-0"
                            style={{ backgroundColor: col.hex }}
                          />
                          <span className="text-xs truncate">{col.name}</span>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Suit / Blazer */}
                  <div>
                    <label className="text-xs font-bold text-ink block mb-1.5">
                      Jas Luaran / Blazer:
                    </label>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {SUIT_OPTIONS.map((suit) => (
                        <button
                          key={suit.id}
                          type="button"
                          onClick={() => setConfig({ ...config, suitType: suit.id })}
                          className={`p-2 rounded-lg border text-left text-xs transition-colors ${
                            config.suitType === suit.id
                              ? 'border-teal bg-cream ring-1 ring-teal'
                              : 'border-[#d1c7b5] bg-cream/80 hover:bg-sand'
                          }`}
                        >
                          <span className="font-semibold block text-ink">{suit.name}</span>
                          <span className="text-[10px] text-ink-muted">{suit.description}</span>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Suit Color (If not none) */}
                  {config.suitType !== 'none' && (
                    <div>
                      <label className="text-xs font-bold text-ink block mb-1.5">
                        Warna Jas / Blazer:
                      </label>
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                        {SUIT_COLORS.map((col) => (
                          <button
                            key={col.id}
                            type="button"
                            onClick={() => setConfig({ ...config, suitColor: col.id })}
                            className={`p-2 rounded-md border flex items-center gap-2 transition-all ${
                              config.suitColor === col.id
                                ? 'border-teal bg-cream ring-1 ring-teal font-semibold text-teal'
                                : 'border-[#d1c7b5] bg-cream text-ink hover:bg-sand'
                            }`}
                          >
                            <span
                              className="w-4 h-4 rounded-full border border-black/20 flex-shrink-0"
                              style={{ backgroundColor: col.hex }}
                            />
                            <span className="text-xs truncate">{col.name}</span>
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Tie */}
                  <div>
                    <label className="text-xs font-bold text-ink block mb-1.5">
                      Dasi Kantor:
                    </label>
                    <div className="grid grid-cols-2 gap-2">
                      {TIE_OPTIONS.map((tie) => (
                        <button
                          key={tie.id}
                          type="button"
                          onClick={() => setConfig({ ...config, tieType: tie.id })}
                          className={`p-2 rounded-lg border text-left text-xs transition-colors ${
                            config.tieType === tie.id
                              ? 'border-teal bg-cream ring-1 ring-teal'
                              : 'border-[#d1c7b5] bg-cream/80 hover:bg-sand'
                          }`}
                        >
                          <span className="font-semibold block text-ink">{tie.name}</span>
                          <span className="text-[10px] text-ink-muted">{tie.description}</span>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Tie Color (If not none) */}
                  {config.tieType !== 'none' && (
                    <div>
                      <label className="text-xs font-bold text-ink block mb-1.5">
                        Warna Dasi:
                      </label>
                      <div className="flex flex-wrap gap-2">
                        {TIE_COLORS.map((col) => (
                          <button
                            key={col.id}
                            type="button"
                            onClick={() => setConfig({ ...config, tieColor: col.id })}
                            className={`px-2.5 py-1.5 rounded-md border text-xs flex items-center gap-2 transition-all ${
                              config.tieColor === col.id
                                ? 'border-teal bg-cream ring-1 ring-teal font-semibold text-teal'
                                : 'border-[#d1c7b5] bg-cream text-ink hover:bg-sand'
                            }`}
                          >
                            <span
                              className="w-3.5 h-3.5 rounded-full border border-black/20"
                              style={{ backgroundColor: col.hex }}
                            />
                            <span>{col.name}</span>
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* TAB 4: BAWAHAN & SEPATU */}
              {activeTab === 'bottom' && (
                <div className="space-y-4">
                  {/* Pants / Skirt */}
                  <div>
                    <label className="text-xs font-bold text-ink block mb-1.5">
                      Celana Bahan / Rok Kerja:
                    </label>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {PANTS_OPTIONS.map((pants) => (
                        <button
                          key={pants.id}
                          type="button"
                          onClick={() => setConfig({ ...config, pantsType: pants.id })}
                          className={`p-2.5 rounded-lg border text-left text-xs transition-colors ${
                            config.pantsType === pants.id
                              ? 'border-teal bg-cream ring-1 ring-teal'
                              : 'border-[#d1c7b5] bg-cream/80 hover:bg-sand'
                          }`}
                        >
                          <span className="font-semibold block text-ink">{pants.name}</span>
                          <span className="text-[10px] text-ink-muted">{pants.description}</span>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Pants Color */}
                  <div>
                    <label className="text-xs font-bold text-ink block mb-1.5">
                      Warna Bawahan:
                    </label>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                      {PANTS_COLORS.map((col) => (
                        <button
                          key={col.id}
                          type="button"
                          onClick={() => setConfig({ ...config, pantsColor: col.id })}
                          className={`p-2 rounded-md border flex items-center gap-2 transition-all ${
                            config.pantsColor === col.id
                              ? 'border-teal bg-cream ring-1 ring-teal font-semibold text-teal'
                              : 'border-[#d1c7b5] bg-cream text-ink hover:bg-sand'
                          }`}
                        >
                          <span
                            className="w-4 h-4 rounded-full border border-black/20 flex-shrink-0"
                            style={{ backgroundColor: col.hex }}
                          />
                          <span className="text-xs truncate">{col.name}</span>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Shoes Model */}
                  <div>
                    <label className="text-xs font-bold text-ink block mb-1.5">
                      Jenis Sepatu Kerja:
                    </label>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {SHOES_OPTIONS.map((shoes) => (
                        <button
                          key={shoes.id}
                          type="button"
                          onClick={() => setConfig({ ...config, shoesType: shoes.id })}
                          className={`p-2.5 rounded-lg border text-left text-xs transition-colors ${
                            config.shoesType === shoes.id
                              ? 'border-teal bg-cream ring-1 ring-teal'
                              : 'border-[#d1c7b5] bg-cream/80 hover:bg-sand'
                          }`}
                        >
                          <span className="font-semibold block text-ink">{shoes.name}</span>
                          <span className="text-[10px] text-ink-muted">{shoes.description}</span>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Shoes Color */}
                  <div>
                    <label className="text-xs font-bold text-ink block mb-1.5">
                      Warna Sepatu:
                    </label>
                    <div className="flex flex-wrap gap-2">
                      {SHOES_COLORS.map((col) => (
                        <button
                          key={col.id}
                          type="button"
                          onClick={() => setConfig({ ...config, shoesColor: col.id })}
                          className={`px-2.5 py-1.5 rounded-md border text-xs flex items-center gap-2 transition-all ${
                            config.shoesColor === col.id
                              ? 'border-teal bg-cream ring-1 ring-teal font-semibold text-teal'
                              : 'border-[#d1c7b5] bg-cream text-ink hover:bg-sand'
                          }`}
                        >
                          <span
                            className="w-3.5 h-3.5 rounded-full border border-black/20"
                            style={{ backgroundColor: col.hex }}
                          />
                          <span>{col.name}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 5: AKSESORIS KANTOR */}
              {activeTab === 'accessories' && (
                <div className="space-y-4">
                  <div>
                    <label className="text-xs font-bold text-ink block mb-1.5">
                      Aksesoris Tambahan Kantor:
                    </label>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                      {ACCESSORIES_OPTIONS.map((acc) => (
                        <button
                          key={acc.id}
                          type="button"
                          onClick={() => setConfig({ ...config, accessory: acc.id })}
                          className={`p-3 rounded-lg border text-left text-xs transition-colors ${
                            config.accessory === acc.id
                              ? 'border-teal bg-cream ring-2 ring-teal'
                              : 'border-[#d1c7b5] bg-cream/80 hover:bg-sand'
                          }`}
                        >
                          <span className="font-semibold block text-ink mb-0.5">{acc.name}</span>
                          <span className="text-[11px] text-ink-muted leading-relaxed">
                            {acc.description}
                          </span>
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="p-3 bg-cream border border-[#d1c7b5] rounded-lg text-xs text-ink-muted space-y-1">
                    <div className="flex items-center gap-1.5 text-teal font-semibold">
                      <Info className="w-4 h-4" />
                      <span>Format Karakter 64×64 Pixel</span>
                    </div>
                    <p className="text-[11px] leading-relaxed">
                      Seluruh pilihan pakaian, rambut, dan aksesoris di atas dirancang untuk
                      frame animasi 64×64 pixel agar selaras dengan tampilan karakter di dalam kantor 2D.
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="px-5 py-3 bg-cream border-t border-[#d1c7b5] flex items-center justify-between flex-shrink-0">
          <span className="text-xs text-ink-muted hidden sm:inline">
            Perubahan tampilan tersimpan untuk sesi kantor online kamu.
          </span>
          <div className="flex items-center gap-2 ml-auto">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-lg border border-[#d1c7b5] bg-soft hover:bg-sand text-xs font-semibold text-ink transition-colors"
            >
              Batal
            </button>
            <button
              type="button"
              onClick={handleSave}
              className="px-5 py-2 rounded-lg bg-teal hover:bg-teal-dark text-soft text-xs font-bold transition-colors shadow-sm flex items-center gap-1.5"
            >
              <Check className="w-3.5 h-3.5" />
              <span>Terapkan Tampilan Karakter</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

