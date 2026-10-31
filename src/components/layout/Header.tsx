import React from 'react';
import { User, ShieldCheck, LayoutDashboard, Shirt } from 'lucide-react';
import { A11yControls, TextScale } from '../ui/A11yControls';
import { UserProfile } from '../modals/AuthModal';

interface Props {
  mode: '2d' | 'list';
  onModeChange: (m: '2d' | 'list') => void;
  reduceMotion: boolean;
  onToggleReduceMotion: () => void;
  textScale: TextScale;
  onChangeTextScale: (s: TextScale) => void;
  highContrast: boolean;
  onToggleHighContrast: () => void;
  onOpenProposal: () => void;
  onOpenTodoList: () => void;
  completedCount: number;
  totalCount: number;
  currentUser: UserProfile | null;
  onOpenAuth: () => void;
  onNavigateDashboard?: () => void;
  onOpenCustomizer?: () => void;
}

export const Header: React.FC<Props> = ({
  mode,
  onModeChange,
  reduceMotion,
  onToggleReduceMotion,
  textScale,
  onChangeTextScale,
  highContrast,
  onToggleHighContrast,
  onOpenProposal,
  onOpenTodoList,
  completedCount,
  totalCount,
  currentUser,
  onOpenAuth,
  onNavigateDashboard,
  onOpenCustomizer,
}) => (
  <header className="flex-shrink-0 flex flex-wrap items-center justify-between px-4 py-2 bg-cream border-b border-[#d1c7b5] text-ink gap-2">
    {/* Product Nameplate with Official Proposal Logo */}
    <div className="flex items-center gap-2.5">
      <div className="w-8 h-8 rounded overflow-hidden bg-cream border border-[#355c5a]/30 flex-shrink-0 shadow-xs">
        <img
          src="/logo.webp"
          alt="Logo NeuroSim"
          className="w-full h-full object-contain"
        />
      </div>
      <div>
        <h1 className="font-bold text-sm sm:text-base tracking-tight text-ink leading-tight">
          NeuroSim
        </h1>
        <p className="text-[10px] text-ink-muted leading-tight font-medium">
          Simulasi Kantor Online
        </p>
      </div>
    </div>

    {/* Center Navigation & Actions */}
    <div className="flex items-center gap-2 flex-wrap">
      {/* Return to Dashboard */}
      {onNavigateDashboard && (
        <button
          type="button"
          onClick={onNavigateDashboard}
          title="Kembali ke Dashboard Utama"
          className="px-2.5 py-1 text-xs font-semibold rounded border border-[#d1c7b5] bg-cream hover:bg-sand text-ink transition-colors flex items-center gap-1.5 shadow-2xs"
        >
          <LayoutDashboard className="w-3.5 h-3.5 text-teal" />
          <span>Dashboard</span>
        </button>
      )}

      {/* Dual-Mode Desk Switcher */}
      <div
        role="tablist"
        aria-label="Mode tampilan simulasi"
        className="flex rounded bg-sand p-0.5 border border-muted/30"
      >
        <button
          role="tab"
          aria-selected={mode === '2d'}
          onClick={() => onModeChange('2d')}
          className={`px-2.5 py-1 text-xs font-semibold rounded transition-colors ${
            mode === '2d'
              ? 'bg-teal text-soft shadow-xs'
              : 'text-ink hover:text-black hover:bg-cream/70'
          }`}
        >
          Denah 2D
        </button>
        <button
          role="tab"
          aria-selected={mode === 'list'}
          onClick={() => onModeChange('list')}
          className={`px-2.5 py-1 text-xs font-semibold rounded transition-colors ${
            mode === 'list'
              ? 'bg-teal text-soft shadow-xs'
              : 'text-ink hover:text-black hover:bg-cream/70'
          }`}
        >
          Skenario
        </button>
      </div>

      {/* Character Customizer Shortcut */}
      {onOpenCustomizer && (
        <button
          type="button"
          onClick={onOpenCustomizer}
          title="Buka Generator Kustomisasi Karakter"
          className="px-2.5 py-1 text-xs font-medium rounded border border-muted/30 bg-parchment text-ink hover:bg-sand transition-colors flex items-center gap-1.5 hidden md:inline-flex"
        >
          <Shirt className="w-3.5 h-3.5 text-ochre" />
          <span>Karakter</span>
        </button>
      )}

      {/* Agenda Button */}
      <button
        type="button"
        onClick={onOpenTodoList}
        title="Buka Papan Tugas Harian Kantor"
        className="px-2.5 py-1 text-xs font-medium rounded border border-muted/30 bg-parchment text-ink hover:bg-sand transition-colors flex items-center gap-1.5"
      >
        <span className="w-2 h-2 rounded-full bg-wood" aria-hidden="true" />
        <span>Agenda: {completedCount}/{totalCount}</span>
      </button>

      {/* Proposal Dossier Button */}
      <button
        type="button"
        onClick={onOpenProposal}
        title="Buka Ringkasan Proposal & Riset NeuroSim"
        className="px-2.5 py-1 text-xs font-medium rounded border border-teal text-teal hover:bg-teal hover:text-soft transition-colors hidden sm:inline-block"
      >
        Proposal
      </button>

      {/* Employee ID / Auth Button */}
      <button
        type="button"
        onClick={onOpenAuth}
        title={currentUser ? "Lihat Kartu Pegawai & Riwayat MySQL" : "Masuk / Terbitkan ID Pegawai"}
        className={`px-2.5 py-1 text-xs font-semibold rounded border transition-colors flex items-center gap-1.5 shadow-xs ${
          currentUser
            ? 'bg-teal text-soft border-teal hover:bg-teal-dark'
            : 'bg-sand text-ink border-teal/40 hover:bg-sand/80'
        }`}
      >
        <User className="w-3.5 h-3.5" />
        <span className="max-w-[120px] truncate">
          {currentUser ? currentUser.fullName.split(' ')[0] : 'ID Pegawai'}
        </span>
      </button>
    </div>

    {/* Sensory Accessibility Controls */}
    <A11yControls
      reduceMotion={reduceMotion}
      onToggleReduceMotion={onToggleReduceMotion}
      textScale={textScale}
      onChangeTextScale={onChangeTextScale}
      highContrast={highContrast}
      onToggleHighContrast={onToggleHighContrast}
    />
  </header>
);
