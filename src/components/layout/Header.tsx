import React from 'react';
import { User, ClipboardList, LayoutDashboard, Shirt } from 'lucide-react';
import { A11yControls, TextScale } from '../ui/A11yControls';
import { UserProfile } from '../modals/AuthModal';
import { OfficeRoom } from '../../types/room';

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
  currentRoom?: OfficeRoom;
  onOpenRoomModal?: () => void;
  onNavigateDashboard?: () => void;
  onOpenCustomizer?: () => void;
}

const getUserDisplayName = (user: UserProfile | null): string => {
  if (!user) return 'ID Pegawai';
  if (user.fullName && typeof user.fullName === 'string' && user.fullName.trim().length > 0) {
    const first = user.fullName.trim().split(' ')[0];
    if (first) return first;
  }
  return user.username || 'ID Pegawai';
};

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
  currentRoom,
  onOpenRoomModal,
  onNavigateDashboard,
  onOpenCustomizer,
}) => {
  const roomName = currentRoom?.name || 'Kantor Pusat NeuroSim';
  const roomCode = currentRoom?.code || 'NEURO-HQ-88';
  const displayName = getUserDisplayName(currentUser);

  return (
    <header className="app-header relative flex-shrink-0 flex items-center justify-between px-3 sm:px-4 py-1.5 bg-cream border-b border-[#d1c7b5] text-ink z-20 select-none">
      {/* 1. Left Product Nameplate & Active Online Room Pill */}
      <div className="flex items-center gap-2 sm:gap-3 flex-shrink-0 z-10">
        <div className="flex items-center gap-2 sm:gap-2.5">
          <div className="w-8 h-8 rounded overflow-hidden bg-cream border border-[#355c5a]/30 flex-shrink-0 shadow-2xs">
            <img
              src="/logo.webp"
              alt="Logo NeuroSim"
              className="w-full h-full object-contain"
            />
          </div>
          <div>
            <h1 className="font-bold text-sm tracking-tight text-ink leading-tight">
              NeuroSim
            </h1>
            <p className="text-[10.5px] text-ink-muted leading-tight font-medium hidden sm:block">
              Komunikasi Kerja Online
            </p>
          </div>
        </div>

        {/* Online Room Pill (Room indicator & invite button) */}
        {onOpenRoomModal && (
          <button
            type="button"
            onClick={onOpenRoomModal}
            title={`Ruangan Aktif: ${roomName} (${roomCode}). Klik untuk kelola ruang, undang rekan, atau pindah ruang.`}
            className="flex items-center gap-1.5 px-2 py-1 sm:px-2.5 text-xs font-semibold rounded bg-sand hover:bg-[#ded5c2] border border-[#d1c7b5] text-ink transition-all shadow-2xs hover:shadow-xs cursor-pointer group"
          >
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse flex-shrink-0" />
            <span className="hidden md:inline font-medium text-ink-muted text-[11px]">Ruang:</span>
            <span className="truncate max-w-[85px] sm:max-w-[120px] lg:max-w-[150px] font-bold text-teal group-hover:underline">
              {roomName}
            </span>
            <span className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded bg-cream border border-teal/20 text-wood-dark">
              {roomCode}
            </span>
          </button>
        )}
      </div>

      {/* 2. Center Navigation & Actions */}
      <div className="flex-1 max-w-2xl mx-1.5 sm:mx-3 flex items-center justify-center gap-1.5 sm:gap-2 z-10 pointer-events-auto overflow-x-auto no-scrollbar">
        {/* Return to Dashboard */}
        {onNavigateDashboard && (
          <button
            type="button"
            onClick={onNavigateDashboard}
            title="Kembali ke Dashboard Utama"
            className="px-2.5 py-1 text-xs font-semibold rounded border border-[#d1c7b5] bg-cream hover:bg-sand text-ink transition-colors flex items-center gap-1.5 shadow-2xs whitespace-nowrap"
          >
            <LayoutDashboard className="w-3.5 h-3.5 text-teal" />
            <span className="hidden lg:inline">Dashboard</span>
          </button>
        )}

        {/* Dual-Mode Desk Switcher */}
        <div
          role="tablist"
          aria-label="Mode tampilan simulasi"
          className="flex rounded bg-sand p-0.5 sm:p-1 border border-muted/30"
        >
          <button
            role="tab"
            aria-selected={mode === '2d'}
            onClick={() => onModeChange('2d')}
            className={`px-2.5 sm:px-3 py-1 text-xs font-semibold rounded transition-colors whitespace-nowrap ${
              mode === '2d'
                ? 'bg-teal text-soft shadow-xs'
                : 'text-ink hover:text-black hover:bg-cream/70'
            }`}
          >
            Kantor 2D
          </button>
          <button
            role="tab"
            aria-selected={mode === 'list'}
            onClick={() => onModeChange('list')}
            className={`px-2.5 sm:px-3 py-1 text-xs font-semibold rounded transition-colors whitespace-nowrap ${
              mode === 'list'
                ? 'bg-teal text-soft shadow-xs'
                : 'text-ink hover:text-black hover:bg-cream/70'
            }`}
          >
            Daftar Skenario
          </button>
        </div>

        {/* Character Customizer Shortcut */}
        {onOpenCustomizer && (
          <button
            type="button"
            onClick={onOpenCustomizer}
            title="Buka Generator Kustomisasi Karakter"
            className="px-2.5 py-1 text-xs font-medium rounded border border-muted/30 bg-parchment text-ink hover:bg-sand transition-colors flex items-center gap-1.5 hidden md:inline-flex whitespace-nowrap"
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
          className="px-2.5 py-1 text-xs font-medium rounded border border-muted/30 bg-parchment text-ink hover:bg-sand transition-colors flex items-center gap-1.5 whitespace-nowrap"
        >
          <ClipboardList className="w-3.5 h-3.5 text-wood flex-shrink-0" />
          <span className="hidden sm:inline">Agenda:</span>
          <span className="font-mono font-bold text-wood-dark">{completedCount}/{totalCount}</span>
        </button>

        {/* Proposal Dossier Button */}
        <button
          type="button"
          onClick={onOpenProposal}
          title="Buka Ringkasan Proposal & Riset NeuroSim"
          className="px-2 sm:px-2.5 py-1 text-xs font-medium rounded border border-teal text-teal hover:bg-teal hover:text-soft transition-colors whitespace-nowrap hidden sm:inline-block"
        >
          Berkas Proposal
        </button>
      </div>

      {/* 3. Right: A11y Controls + Far-Right Sign In / Employee ID Button */}
      <div className="flex items-center gap-2 sm:gap-3 flex-shrink-0 z-10 ml-auto">
        <A11yControls
          reduceMotion={reduceMotion}
          onToggleReduceMotion={onToggleReduceMotion}
          textScale={textScale}
          onChangeTextScale={onChangeTextScale}
          highContrast={highContrast}
          onToggleHighContrast={onToggleHighContrast}
        />

        <div className="h-4 w-px bg-[#d1c7b5] hidden sm:block" aria-hidden="true" />

        {/* Far-Right Employee ID / Sign-In Button */}
        <button
          type="button"
          onClick={onOpenAuth}
          title={currentUser ? 'Lihat Kartu Pegawai & Riwayat Akun' : 'Masuk / Terbitkan ID Pegawai'}
          className={`px-2.5 py-1 text-xs font-semibold rounded border transition-colors flex items-center gap-1.5 shadow-xs whitespace-nowrap ${
            currentUser
              ? 'bg-teal text-soft border-teal hover:bg-teal-dark'
              : 'bg-sand text-ink border-teal/40 hover:bg-sand/80 hover:border-teal'
          }`}
        >
          <User className="w-3.5 h-3.5" />
          <span className="max-w-[120px] truncate">
            {displayName}
          </span>
        </button>
      </div>
    </header>
  );
};
