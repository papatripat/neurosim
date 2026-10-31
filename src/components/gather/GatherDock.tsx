import React, { useState, useRef, useEffect } from 'react';
import { Mic, MicOff, Video, VideoOff, ScreenShare, Users, MessageSquare, Smile, ChevronUp } from 'lucide-react';

export type UserStatus = 'available' | 'busy' | 'pantry';

interface Props {
  isMicOn: boolean;
  onToggleMic: () => void;
  isCamOn: boolean;
  onToggleCam: () => void;
  isScreenSharing: boolean;
  onToggleScreenShare: () => void;
  onOpenParticipants: () => void;
  onOpenOfficeChat: () => void;
  onSendReaction: (emoji: string) => void;
  participantsCount: number;
  unreadChatCount: number;
  status: UserStatus;
  onChangeStatus: (s: UserStatus) => void;
}

const REACTIONS = ['✋', '👍', '👏', '❤️', '💡', '☕', '🔥'];

export const GatherDock: React.FC<Props> = ({
  isMicOn,
  onToggleMic,
  isCamOn,
  onToggleCam,
  isScreenSharing,
  onToggleScreenShare,
  onOpenParticipants,
  onOpenOfficeChat,
  onSendReaction,
  participantsCount,
  unreadChatCount,
  status,
  onChangeStatus,
}) => {
  const [showReactions, setShowReactions] = useState(false);
  const [showStatusMenu, setShowStatusMenu] = useState(false);
  const dockRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dockRef.current && !dockRef.current.contains(e.target as Node)) {
        setShowReactions(false);
        setShowStatusMenu(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const getStatusColor = () => {
    switch (status) {
      case 'available':
        return 'bg-sage';
      case 'busy':
        return 'bg-brick';
      case 'pantry':
        return 'bg-ochre';
    }
  };

  const getStatusLabel = () => {
    switch (status) {
      case 'available':
        return 'Tersedia';
      case 'busy':
        return 'Fokus Kerja';
      case 'pantry':
        return 'Di Pantry';
    }
  };

  return (
    <div ref={dockRef} className="absolute bottom-3 left-1/2 -translate-x-1/2 z-30 flex items-center gap-2 max-w-[95vw]">
      {/* Reactions Popup */}
      {showReactions && (
        <div className="absolute bottom-14 left-1/2 -translate-x-1/2 bg-cream border-2 border-teal rounded-lg shadow-lg p-1.5 flex items-center gap-1.5 animate-in fade-in zoom-in-95">
          {REACTIONS.map((emoji) => (
            <button
              key={emoji}
              type="button"
              onClick={() => onSendReaction(emoji)}
              className="w-8 h-8 rounded hover:bg-sand flex items-center justify-center text-base transition-transform hover:scale-110"
            >
              {emoji}
            </button>
          ))}
        </div>
      )}

      {/* Main Gather Bar */}
      <div className="bg-cream/95 backdrop-blur-xs border-2 border-teal rounded-lg shadow-xl px-2.5 py-1.5 flex items-center gap-1 sm:gap-2 text-ink">
        {/* User Identity & Status */}
        <div className="relative">
          <button
            type="button"
            onClick={() => setShowStatusMenu((m) => !m)}
            className="flex items-center gap-2 px-2 py-1 rounded hover:bg-sand/80 transition-colors text-left"
          >
            <div className="relative w-7 h-7 rounded border border-teal overflow-hidden bg-parchment flex-shrink-0">
              <img
                src="/assets/characters/resident/standing/south.png"
                alt="Avatar Baginda"
                className="w-full h-full object-contain scale-[1.8] pixelated"
              />
              <span
                className={`absolute bottom-0 right-0 w-2 h-2 rounded-full border border-white ${getStatusColor()}`}
              />
            </div>
            <div className="hidden md:block">
              <span className="font-bold text-xs leading-none block text-ink">Baginda</span>
              <span className="text-[10px] text-ink-muted leading-tight block">
                {getStatusLabel()}
              </span>
            </div>
            <ChevronUp className="w-3 h-3 text-ink-muted" />
          </button>

          {/* Status Dropdown */}
          {showStatusMenu && (
            <div className="absolute bottom-11 left-0 w-36 bg-cream border border-teal rounded-md shadow-lg p-1 text-xs space-y-0.5 z-40">
              <button
                type="button"
                onClick={() => {
                  onChangeStatus('available');
                  setShowStatusMenu(false);
                }}
                className="w-full text-left px-2 py-1 rounded hover:bg-sand flex items-center gap-2"
              >
                <span className="w-2 h-2 rounded-full bg-sage" />
                <span>Tersedia</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  onChangeStatus('busy');
                  setShowStatusMenu(false);
                }}
                className="w-full text-left px-2 py-1 rounded hover:bg-sand flex items-center gap-2"
              >
                <span className="w-2 h-2 rounded-full bg-brick" />
                <span>Fokus Kerja</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  onChangeStatus('pantry');
                  setShowStatusMenu(false);
                }}
                className="w-full text-left px-2 py-1 rounded hover:bg-sand flex items-center gap-2"
              >
                <span className="w-2 h-2 rounded-full bg-ochre" />
                <span>Di Pantry</span>
              </button>
            </div>
          )}
        </div>

        <div className="w-[1px] h-6 bg-muted/20 mx-0.5" />

        {/* Media Toggles */}
        <button
          type="button"
          onClick={onToggleMic}
          aria-label={isMicOn ? 'Matikan Mikrofon' : 'Nyalakan Mikrofon'}
          title={isMicOn ? 'Mikrofon Aktif' : 'Mikrofon Mati'}
          className={`p-2 rounded border transition-colors ${
            isMicOn
              ? 'bg-teal text-soft border-teal'
              : 'bg-soft border-muted/30 text-brick hover:bg-sand'
          }`}
        >
          {isMicOn ? <Mic className="w-4 h-4" /> : <MicOff className="w-4 h-4" />}
        </button>

        <button
          type="button"
          onClick={onToggleCam}
          aria-label={isCamOn ? 'Matikan Kamera' : 'Nyalakan Kamera'}
          title={isCamOn ? 'Kamera Aktif' : 'Kamera Mati'}
          className={`p-2 rounded border transition-colors ${
            isCamOn
              ? 'bg-teal text-soft border-teal'
              : 'bg-soft border-muted/30 text-brick hover:bg-sand'
          }`}
        >
          {isCamOn ? <Video className="w-4 h-4" /> : <VideoOff className="w-4 h-4" />}
        </button>

        <button
          type="button"
          onClick={onToggleScreenShare}
          aria-label={isScreenSharing ? 'Hentikan Berbagi Layar' : 'Berbagi Layar'}
          title={isScreenSharing ? 'Sedang Berbagi Layar' : 'Berbagi Layar'}
          className={`p-2 rounded border transition-colors hidden sm:flex ${
            isScreenSharing
              ? 'bg-brass text-ink font-bold border-brass'
              : 'bg-soft border-muted/30 text-ink hover:bg-sand'
          }`}
        >
          <ScreenShare className="w-4 h-4" />
        </button>

        {/* Reaction Emoji Button */}
        <button
          type="button"
          onClick={() => setShowReactions((r) => !r)}
          aria-label="Kirim Reaksi Cepat"
          title="Kirim Reaksi"
          className="p-2 rounded border bg-soft border-muted/30 text-ink hover:bg-sand transition-colors"
        >
          <Smile className="w-4 h-4" />
        </button>

        <div className="w-[1px] h-6 bg-muted/20 mx-0.5" />

        {/* Participants Panel Button */}
        <button
          type="button"
          onClick={onOpenParticipants}
          aria-label="Lihat Rekan di Kantor"
          title="Rekan Kantor"
          className="px-2.5 py-1.5 rounded border border-muted/30 bg-soft text-ink hover:bg-sand transition-colors flex items-center gap-1.5 text-xs font-medium"
        >
          <Users className="w-4 h-4 text-teal" />
          <span className="hidden sm:inline">Rekan:</span>
          <span className="font-bold">{participantsCount}</span>
        </button>

        {/* Office Chat Button */}
        <button
          type="button"
          onClick={onOpenOfficeChat}
          aria-label="Buka Obrolan Kantor"
          title="Obrolan Kantor"
          className="relative px-2.5 py-1.5 rounded border border-muted/30 bg-soft text-ink hover:bg-sand transition-colors flex items-center gap-1.5 text-xs font-medium"
        >
          <MessageSquare className="w-4 h-4 text-teal" />
          <span className="hidden sm:inline">Obrolan</span>
          {unreadChatCount > 0 && (
            <span className="w-2 h-2 rounded-full bg-brick animate-pulse" />
          )}
        </button>
      </div>
    </div>
  );
};

