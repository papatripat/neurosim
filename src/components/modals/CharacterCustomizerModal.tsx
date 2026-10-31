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
  ARCHETYPE_OPTIONS,
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
import { CharacterCanvasPreview } from '../character/CharacterCanvasPreview';
import { EventBus, GAME_EVENTS } from '../../game/EventBus';
import { generateFullLpcSpritesheet } from '../../lib/lpcCompositor';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  currentConfig?: CharacterCustomization;
  onSaveConfig: (config: CharacterCustomization) => void;
  userName?: string;
  userRole?: string;
}

type TabCategory = 'identity' | 'hair' | 'top' | 'bottom' | 'accessories';

export const CharacterCustomizerModal: React.FC<Props> = ({
  isOpen,
  onClose,
  currentConfig,
  onSaveConfig,
  userName,
  userRole,
}) => {
  const [config, setConfig] = useState<CharacterCustomization>(() => {
    const base = currentConfig || DEFAULT_CHARACTER;
    return {
      ...base,
      name: userName || base.name || 'Baginda',
    };
  });
  const [activeTab, setActiveTab] = useState<TabCategory>('identity');
  const [previewDirection, setPreviewDirection] = useState<CharacterDirection>('south');
  const [saveToast, setSaveToast] = useState(false);
  const dialogRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (currentConfig) {
      setConfig({
        ...currentConfig,
        name: userName || currentConfig.name || 'Baginda',
      });
    } else if (userName) {
      setConfig((prev) => ({
        ...prev,
        name: userName,
      }));
    }
  }, [currentConfig, userName]);

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
    const chosenArchetype = randomItem(ARCHETYPE_OPTIONS).id;
    setConfig({
      name: config.name,
      archetype: chosenArchetype,
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
    const base = currentConfig || DEFAULT_CHARACTER;
    setConfig({
      ...base,
      name: userName || base.name || 'Baginda',
    });
  };

  const handleSave = async () => {
    const toSave: CharacterCustomization = {
      ...config,
      name: userName || config.name || 'Baginda',
    };
    onSaveConfig(toSave);
    // Simpan ke localStorage agar awet antar sesi
    localStorage.setItem('neurosim_character_config', JSON.stringify(toSave));

    try {
      const fullCanvas = await generateFullLpcSpritesheet(toSave);
      const dataUrl = fullCanvas.toDataURL('image/png');
      localStorage.setItem('neurosim_character_spritesheet', dataUrl);

      // Emit ke Phaser engine agar sprite player langsung diupdate seketika
      EventBus.emit(GAME_EVENTS.UPDATE_PLAYER_CHARACTER, {
        config: toSave,
        spritesheetDataUrl: dataUrl,
      });
    } catch (err) {
      console.warn('Could not generate full LPC spritesheet:', err);
      EventBus.emit(GAME_EVENTS.UPDATE_PLAYER_CHARACTER, { config: toSave });
    }

    setSaveToast(true);
    setTimeout(() => {
      setSaveToast(false);
      onClose();
    }, 400);
  };

  const handleGenderChange = (newGender: 'male' | 'female') => {
    if (newGender === config.gender) return;
    if (newGender === 'female') {
      const isMasculineHair = ['short-parted', 'slicked-back', 'buzz-cut', 'afro-fade'].includes(config.hairStyle);
      setConfig({
        ...config,
        gender: 'female',
        facialHair: 'none',
        hairStyle: isMasculineHair ? 'shoulder-waves' : config.hairStyle,
      });
    } else {
      const isFeminineHair = ['shoulder-waves', 'office-bun', 'pixie-cut'].includes(config.hairStyle);
      const isWearingSkirt = (config.pantsType || '').includes('skirt');
      setConfig({
        ...config,
        gender: 'male',
        hairStyle: isFeminineHair ? 'short-parted' : config.hairStyle,
        pantsType: isWearingSkirt ? 'slacks-formal' : config.pantsType,
      });
    }
  };

  const currentArchetype = ARCHETYPE_OPTIONS.find((a) => a.id === config.archetype) || ARCHETYPE_OPTIONS[0];

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
            {/* HTML5 Canvas Live Animated Preview */}
            <div className="bg-sand/80 border-2 border-[#b5aa94] rounded-lg p-3 flex flex-col items-center shadow-inner relative">
              <CharacterCanvasPreview
                config={config}
                direction={previewDirection}
                onChangeDirection={setPreviewDirection}
              />

              <div className="text-center mt-3 w-full">
                <span className="font-bold text-xs block text-ink">{userName || config.name}</span>
                <span className="text-[10px] text-ink-muted block mt-0.5">
                  {userRole || currentArchetype.name} · {config.gender === 'male' ? 'Pria' : 'Wanita'}
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
                      <span className="font-bold text-ink block group-hover:text-teal">
                        {preset.name}
                      </span>
                      <span className="text-[10px] text-ink-muted line-clamp-1">
                        {preset.description}
                      </span>
                    </div>
                    <ChevronRight className="w-3.5 h-3.5 text-ink-muted group-hover:text-teal flex-shrink-0 ml-1" />
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Right Column: Deep LPC-Style Customization Tabs */}
          <div className="flex-1 min-h-0 flex flex-col bg-sand/20 overflow-hidden">
            {/* Category Navigation Bar */}
            <div className="grid grid-cols-5 border-b border-[#d1c7b5] bg-cream flex-shrink-0">
              {[
                { id: 'identity', label: 'Peran & Wajah', icon: User },
                { id: 'hair', label: 'Rambut', icon: Scissors },
                { id: 'top', label: 'Atasan & Jas', icon: Shirt },
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
              {/* TAB 1: IDENTITAS & PERAN ARTIKETUR */}
              {activeTab === 'identity' && (
                <div className="space-y-4">
                  {/* Archetype / Role Selection (Universal 64x64 Office Characters) */}
                  <div>
                    <label className="text-xs font-bold text-ink block mb-1.5">
                      Pilihan Peran & Tipe Karakter:
                    </label>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {ARCHETYPE_OPTIONS.map((arch) => (
                        <button
                          key={arch.id}
                          type="button"
                          onClick={() => setConfig({ ...config, archetype: arch.id })}
                          className={`p-2.5 rounded-lg border text-left text-xs transition-all flex items-start gap-2.5 ${
                            (config.archetype || 'resident') === arch.id
                              ? 'border-teal bg-cream ring-2 ring-teal shadow-xs'
                              : 'border-[#d1c7b5] bg-cream/80 hover:bg-sand'
                          }`}
                        >
                          <img
                            src={arch.previewUrl}
                            alt={arch.name}
                            className="w-10 h-10 object-contain rounded bg-sand/50 p-0.5 border border-[#c4b8a1] flex-shrink-0 pixelated"
                          />
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between">
                              <span className="font-bold text-ink truncate">{arch.name}</span>
                              {(config.archetype || 'resident') === arch.id && (
                                <Check className="w-3.5 h-3.5 text-teal flex-shrink-0 ml-1" />
                              )}
                            </div>
                            <span className="text-[10px] text-teal font-semibold block">
                              {arch.category}
                            </span>
                            <span className="text-[10px] text-ink-muted line-clamp-2 mt-0.5">
                              {arch.description}
                            </span>
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Gender Selector */}
                  <div>
                    <label className="text-xs font-bold text-ink block mb-1.5">
                      Gender Dasar Karakter:
                    </label>
                    <div className="grid grid-cols-2 gap-2 max-w-sm">
                      <button
                        type="button"
                        onClick={() => handleGenderChange('male')}
                        className={`p-2 rounded-lg border text-xs font-semibold flex items-center justify-center gap-2 transition-colors ${
                          config.gender === 'male'
                            ? 'bg-teal text-soft border-teal shadow-xs'
                            : 'bg-cream text-ink border-[#d1c7b5] hover:bg-sand'
                        }`}
                      >
                        <span>Pria (Male)</span>
                        {config.gender === 'male' && <Check className="w-3.5 h-3.5" />}
                      </button>
                      <button
                        type="button"
                        onClick={() => handleGenderChange('female')}
                        className={`p-2 rounded-lg border text-xs font-semibold flex items-center justify-center gap-2 transition-colors ${
                          config.gender === 'female'
                            ? 'bg-teal text-soft border-teal shadow-xs'
                            : 'bg-cream text-ink border-[#d1c7b5] hover:bg-sand'
                        }`}
                      >
                        <span>Wanita (Female)</span>
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

              {/* TAB 2: RAMBUT & FACIAL HAIR */}
              {activeTab === 'hair' && (
                <div className="space-y-4">
                  {/* Hair Style */}
                  <div>
                    <label className="text-xs font-bold text-ink block mb-1.5">
                      Model Rambut:
                    </label>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {HAIR_STYLES.map((style) => (
                        <button
                          key={style.id}
                          type="button"
                          onClick={() => setConfig({ ...config, hairStyle: style.id })}
                          className={`p-2.5 rounded-lg border text-left text-xs transition-colors ${
                            config.hairStyle === style.id
                              ? 'border-teal bg-cream ring-2 ring-teal'
                              : 'border-[#d1c7b5] bg-cream/80 hover:bg-sand'
                          }`}
                        >
                          <span className="font-semibold block text-ink">{style.name}</span>
                          <span className="text-[10px] text-ink-muted leading-tight">
                            {style.description}
                          </span>
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
                          className={`p-2 rounded-lg border text-xs flex items-center gap-2 transition-all ${
                            config.hairColor === col.id
                              ? 'border-teal bg-cream ring-2 ring-teal font-semibold'
                              : 'border-[#d1c7b5] bg-cream/70 hover:bg-sand'
                          }`}
                        >
                          <span
                            className="w-4 h-4 rounded-full border border-black/20 flex-shrink-0"
                            style={{ backgroundColor: col.hex }}
                          />
                          <span className="truncate">{col.name}</span>
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
                </div>
              )}

              {/* TAB 3: ATASAN & JAS */}
              {activeTab === 'top' && (
                <div className="space-y-4">
                  {/* Shirt Style */}
                  <div>
                    <label className="text-xs font-bold text-ink block mb-1.5">
                      Model Kemeja / Atasan:
                    </label>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {SHIRT_OPTIONS.map((s) => (
                        <button
                          key={s.id}
                          type="button"
                          onClick={() => setConfig({ ...config, shirtType: s.id })}
                          className={`p-2.5 rounded-lg border text-left text-xs transition-colors ${
                            config.shirtType === s.id
                              ? 'border-teal bg-cream ring-2 ring-teal'
                              : 'border-[#d1c7b5] bg-cream/80 hover:bg-sand'
                          }`}
                        >
                          <span className="font-semibold block text-ink">{s.name}</span>
                          <span className="text-[10px] text-ink-muted leading-tight">
                            {s.description}
                          </span>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Shirt Color */}
                  <div>
                    <label className="text-xs font-bold text-ink block mb-1.5">
                      Warna Kemeja / Atasan:
                    </label>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                      {SHIRT_COLORS.map((col) => (
                        <button
                          key={col.id}
                          type="button"
                          onClick={() => setConfig({ ...config, shirtColor: col.id })}
                          className={`p-2 rounded-lg border text-xs flex items-center gap-2 transition-all ${
                            config.shirtColor === col.id
                              ? 'border-teal bg-cream ring-2 ring-teal font-semibold'
                              : 'border-[#d1c7b5] bg-cream/70 hover:bg-sand'
                          }`}
                        >
                          <span
                            className="w-4 h-4 rounded-full border border-black/20 flex-shrink-0"
                            style={{ backgroundColor: col.hex }}
                          />
                          <span className="truncate">{col.name.split(' ')[0]}</span>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Suit / Blazer */}
                  <div>
                    <label className="text-xs font-bold text-ink block mb-1.5">
                      Jas / Blazer Luaran:
                    </label>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {SUIT_OPTIONS.map((st) => (
                        <button
                          key={st.id}
                          type="button"
                          onClick={() => setConfig({ ...config, suitType: st.id })}
                          className={`p-2 rounded-lg border text-left text-xs transition-colors ${
                            config.suitType === st.id
                              ? 'border-teal bg-cream ring-1 ring-teal'
                              : 'border-[#d1c7b5] bg-cream/80 hover:bg-sand'
                          }`}
                        >
                          <span className="font-semibold block text-ink">{st.name}</span>
                          <span className="text-[10px] text-ink-muted leading-tight">
                            {st.description}
                          </span>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Tie Option */}
                  <div>
                    <label className="text-xs font-bold text-ink block mb-1.5">
                      Dasi Formal:
                    </label>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                      {TIE_OPTIONS.map((t) => (
                        <button
                          key={t.id}
                          type="button"
                          onClick={() => setConfig({ ...config, tieType: t.id })}
                          className={`p-2 rounded-lg border text-left text-xs transition-colors ${
                            config.tieType === t.id
                              ? 'border-teal bg-cream ring-1 ring-teal font-semibold text-teal'
                              : 'border-[#d1c7b5] bg-cream/80 hover:bg-sand'
                          }`}
                        >
                          <span className="block truncate">{t.name}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 4: BAWAHAN & SEPATU */}
              {activeTab === 'bottom' && (
                <div className="space-y-4">
                  {/* Pants / Skirts Style (Gender-aware) */}
                  <div>
                    <label className="text-xs font-bold text-ink block mb-1.5">
                      {config.gender === 'male' ? 'Model Celana:' : 'Model Celana / Rok:'}
                    </label>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {PANTS_OPTIONS.filter((p) => config.gender === 'female' || p.category !== 'rok').map((p) => (
                        <button
                          key={p.id}
                          type="button"
                          onClick={() => setConfig({ ...config, pantsType: p.id })}
                          className={`p-2.5 rounded-lg border text-left text-xs transition-colors ${
                            config.pantsType === p.id
                              ? 'border-teal bg-cream ring-2 ring-teal'
                              : 'border-[#d1c7b5] bg-cream/80 hover:bg-sand'
                          }`}
                        >
                          <span className="font-semibold block text-ink">{p.name}</span>
                          <span className="text-[10px] text-ink-muted leading-tight">
                            {p.description}
                          </span>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Pants Color */}
                  <div>
                    <label className="text-xs font-bold text-ink block mb-1.5">
                      {config.gender === 'male' ? 'Warna Celana:' : 'Warna Celana / Rok:'}
                    </label>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                      {PANTS_COLORS.map((col) => (
                        <button
                          key={col.id}
                          type="button"
                          onClick={() => setConfig({ ...config, pantsColor: col.id })}
                          className={`p-2 rounded-lg border text-xs flex items-center gap-2 transition-all ${
                            config.pantsColor === col.id
                              ? 'border-teal bg-cream ring-2 ring-teal font-semibold'
                              : 'border-[#d1c7b5] bg-cream/70 hover:bg-sand'
                          }`}
                        >
                          <span
                            className="w-4 h-4 rounded-full border border-black/20 flex-shrink-0"
                            style={{ backgroundColor: col.hex }}
                          />
                          <span className="truncate">{col.name}</span>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Shoes Style */}
                  <div>
                    <label className="text-xs font-bold text-ink block mb-1.5">
                      Model Sepatu Kerja:
                    </label>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {SHOES_OPTIONS.map((sh) => (
                        <button
                          key={sh.id}
                          type="button"
                          onClick={() => setConfig({ ...config, shoesType: sh.id })}
                          className={`p-2 rounded-lg border text-left text-xs transition-colors ${
                            config.shoesType === sh.id
                              ? 'border-teal bg-cream ring-1 ring-teal'
                              : 'border-[#d1c7b5] bg-cream/80 hover:bg-sand'
                          }`}
                        >
                          <span className="font-semibold block text-ink">{sh.name}</span>
                          <span className="text-[10px] text-ink-muted">{sh.description}</span>
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
                      Aksesoris & Peralatan Kantor:
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


                </div>
              )}
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="px-5 py-3 bg-cream border-t border-[#d1c7b5] flex items-center justify-between flex-shrink-0">
          <div className="flex items-center gap-2">
            {saveToast && (
              <span className="text-xs text-emerald-700 font-bold bg-emerald-100 px-2 py-1 rounded border border-emerald-300 animate-in fade-in">
                Tampilan karakter berhasil disimpan ke profil!
              </span>
            )}
            {!saveToast && (
              <span className="text-xs text-ink-muted hidden sm:inline">
                Kustomisasi karakter akan otomatis disinkronkan ke seluruh ruangan kantor.
              </span>
            )}
          </div>
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
              <span>Simpan & Terapkan Karakter</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
