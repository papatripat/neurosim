import React from 'react';
import { User, ClipboardList, LayoutDashboard } from 'lucide-react';
import { A11yControls, TextScale } from '../ui/A11yControls';
import { UserProfile } from '../modals/AuthModal';
import { OfficeRoom } from '../../types/room';

interface Props {
  mode: '2d' | 'list';
  onModeChange: (m: '2d' | 'list') => void;
  reduceMotion?: boolean;
  onToggleReduceMotion?: () => void;
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
  reduceMotion = false,
  onToggleReduceMotion,
  textScale,
  onChangeTextScale,
  highContrast,
  onToggleHighContrast,
  onOpenTodoList,
  completedCount,
  totalCount,
  currentUser,
  onOpenAuth,
  currentRoom,
  onOpenRoomModal,
  onNavigateDashboard,
}) => {
  const roomName = currentRoom?.name || 'Kantor Pusat NeuroSim';
  const roomCode = currentRoom?.code || 'NEURO-HQ-88';
  const displayName = getUserDisplayName(currentUser);

  return (
    <header className="app-header relative flex-shrink-0 flex items-center justify-between px-3 sm:px-4 py-1.5 bg-cream border-b border-[#d1c7b5] text-ink z-20 select-none">
      {/* 1. Left Product Brand, Dashboard Shortcut, & Active Online Room Pill */}
      <div className="flex items-center gap-2 sm:gap-2.5 flex-shrink-0">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 sm:w-8 sm:h-8 rounded overflow-hidden bg-cream border border-[#355c5a]/30 flex-shrink-0 shadow-2xs">
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
            <p className="text-[10px] text-ink-muted leading-tight font-medium hidden md:block">
              Simulasi Kantor
            </p>
          </div>
        </div>

        {/* Return to Dashboard */}
        {onNavigateDashboard && (
          <button
            type="button"
            onClick={onNavigateDashboard}
            title="Kembali ke Dashboard Utama"
            className="px-2.5 py-1 text-xs font-semibold rounded-md border border-[#d1c7b5] bg-cream hover:bg-sand text-ink transition-colors flex items-center gap-1.5 shadow-2xs whitespace-nowrap cursor-pointer"
          >
            <LayoutDashboard className="w-3.5 h-3.5 text-teal" />
            <span className="hidden md:inline">Dashboard</span>
          </button>
        )}

        {/* Online Room Pill (Room indicator & invite button) */}
        {onOpenRoomModal && (
          <button
            type="button"
            onClick={onOpenRoomModal}
            title={`Ruangan Aktif: ${roomName} (${roomCode}). Klik untuk kelola ruang atau undang rekan.`}
            className="flex items-center gap-1.5 px-2 py-1 sm:px-2.5 text-xs font-semibold rounded-md bg-sand/80 hover:bg-sand border border-[#d1c7b5] text-ink transition-all shadow-2xs cursor-pointer group whitespace-nowrap"
          >
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse flex-shrink-0" />
            <span className="truncate max-w-[90px] sm:max-w-[130px] font-bold text-teal group-hover:underline">
              {roomName}
            </span>
            <span className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded bg-cream border border-teal/20 text-wood-dark hidden sm:inline">
              {roomCode}
            </span>
          </button>
        )}
      </div>

      {/* 2. Center: Dual-Mode Switcher & Agenda Task Badge */}
      <div className="flex items-center justify-center gap-2 flex-shrink-0 mx-2">
        {/* Dual-Mode Desk Switcher */}
        <div
          role="tablist"
          aria-label="Mode tampilan simulasi"
          className="flex rounded-md bg-sand/90 p-0.5 border border-[#d1c7b5] shadow-2xs"
        >
          <button
            role="tab"
            aria-selected={mode === '2d'}
            onClick={() => onModeChange('2d')}
            className={`px-3 py-1 text-xs font-semibold rounded transition-colors whitespace-nowrap cursor-pointer ${
              mode === '2d'
                ? 'bg-teal text-soft shadow-xs'
                : 'text-ink-muted hover:text-ink hover:bg-cream/60'
            }`}
          >
            Kantor 2D
          </button>
          <button
            role="tab"
            aria-selected={mode === 'list'}
            onClick={() => onModeChange('list')}
            className={`px-3 py-1 text-xs font-semibold rounded transition-colors whitespace-nowrap cursor-pointer ${
              mode === 'list'
                ? 'bg-teal text-soft shadow-xs'
                : 'text-ink-muted hover:text-ink hover:bg-cream/60'
            }`}
          >
            Daftar Skenario
          </button>
        </div>

        {/* Agenda Button */}
        <button
          type="button"
          onClick={onOpenTodoList}
          title="Buka Papan Tugas Harian Kantor"
          className="px-2.5 py-1 text-xs font-semibold rounded-md border border-[#d1c7b5] bg-cream hover:bg-sand text-ink transition-colors flex items-center gap-1.5 shadow-2xs whitespace-nowrap cursor-pointer"
        >
          <ClipboardList className="w-3.5 h-3.5 text-ochre flex-shrink-0" />
          <span className="hidden sm:inline">Agenda:</span>
          <span className="font-mono font-bold text-teal">{completedCount}/{totalCount}</span>
        </button>
      </div>

      {/* 3. Right: A11y Controls + Far-Right Sign In / Employee ID Button */}
      <div className="flex items-center gap-2 sm:gap-2.5 flex-shrink-0">
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
          className={`px-2.5 py-1 text-xs font-semibold rounded-md border transition-colors flex items-center gap-1.5 shadow-2xs whitespace-nowrap cursor-pointer ${
            currentUser
              ? 'bg-teal text-soft border-teal hover:bg-teal-dark'
              : 'bg-cream text-ink border-[#d1c7b5] hover:bg-sand'
          }`}
        >
          <User className="w-3.5 h-3.5" />
          <span className="max-w-[110px] truncate">
            {displayName}
          </span>
        </button>
      </div>
    </header>
  );
};
