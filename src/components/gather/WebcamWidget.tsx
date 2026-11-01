import React, { useEffect, useRef, useState } from 'react';
import {
  X,
  Mic,
  MicOff,
  Video,
  ChevronUp,
  ChevronDown,
  VideoOff,
} from 'lucide-react';
import { Participant } from './ParticipantsDrawer';

interface Props {
  isOpen: boolean; // Kamera lokal pengguna aktif
  onClose: () => void;
  isMicOn: boolean;
  onToggleMic?: () => void;
  userName?: string;
  userAvatar?: string;
  userRole?: string;
  participants?: Participant[];
}

export const WebcamWidget: React.FC<Props> = ({
  isOpen,
  onClose,
  isMicOn,
  onToggleMic,
  userName = 'Baginda (Kamu)',
  userAvatar = '/assets/characters/resident/standing/south.png',
  userRole = 'Frontend & UI/UX',
}) => {
  const localVideoRef = useRef<HTMLVideoElement>(null);
  const [isLocalStreaming, setIsLocalStreaming] = useState(false);
  const [localCamError, setLocalCamError] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);

  // Request & attach local webcam stream bila isOpen true
  useEffect(() => {
    if (!isOpen) {
      setIsLocalStreaming(false);
      setLocalCamError(false);
      return;
    }

    let stream: MediaStream | null = null;
    let isMounted = true;

    if (navigator.mediaDevices?.getUserMedia) {
      navigator.mediaDevices
        .getUserMedia({
          video: {
            width: { ideal: 640 },
            height: { ideal: 480 },
            facingMode: 'user',
          },
          audio: false,
        })
        .then((s) => {
          if (!isMounted) {
            s.getTracks().forEach((t) => t.stop());
            return;
          }
          stream = s;
          if (localVideoRef.current) {
            localVideoRef.current.srcObject = s;
            localVideoRef.current.onloadedmetadata = () => {
              localVideoRef.current
                ?.play()
                .then(() => {
                  if (isMounted) setIsLocalStreaming(true);
                })
                .catch(() => {
                  if (isMounted) setIsLocalStreaming(true);
                });
            };
          }
        })
        .catch((err) => {
          console.warn('[WebcamWidget] Akses kamera tidak tersedia atau ditolak:', err);
          if (isMounted) setLocalCamError(true);
        });
    } else {
      setLocalCamError(true);
    }

    return () => {
      isMounted = false;
      if (stream) {
        stream.getTracks().forEach((t) => t.stop());
      }
    };
  }, [isOpen]);

  // Jika kamera lokal tidak dibuka, jangan render widget
  if (!isOpen) return null;

  // Mode Minimized: Pill ringkas di sisi kiri atas
  if (isMinimized) {
    return (
      <div className="absolute top-16 left-4 z-30 animate-in fade-in zoom-in-95">
        <button
          type="button"
          onClick={() => setIsMinimized(false)}
          className="flex items-center gap-2 bg-cream/95 backdrop-blur-xs border-2 border-teal rounded-full shadow-lg px-3 py-1.5 text-xs font-bold text-ink hover:bg-sand transition-all cursor-pointer"
        >
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          <Video className="w-3.5 h-3.5 text-teal" />
          <span>Kamera Aktif: {userName}</span>
          <ChevronDown className="w-3.5 h-3.5 text-ink-muted" />
        </button>
      </div>
    );
  }

  return (
    <div
      className="absolute top-16 left-4 z-30 w-60 sm:w-64 bg-cream/95 backdrop-blur-xs border-2 border-teal rounded-xl shadow-2xl p-2 select-none flex flex-col gap-1.5 animate-in fade-in slide-in-from-left duration-200"
      style={{ filter: 'drop-shadow(0 10px 20px rgba(0,0,0,0.35))' }}
    >
      {/* Header Panel Video Vertikal */}
      <div className="flex items-center justify-between px-1 text-[11px] font-bold text-ink border-b border-[#d1c7b5]/60 pb-1">
        <div className="flex items-center gap-1.5 text-teal">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          <span>Kamera Kantor 2D</span>
        </div>

        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => setIsMinimized(true)}
            aria-label="Kecilkan panel kamera"
            title="Kecilkan Kamera"
            className="p-1 rounded hover:bg-sand text-ink-muted hover:text-ink transition-colors cursor-pointer"
          >
            <ChevronUp className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={onClose}
            aria-label="Tutup kamera"
            title="Matikan Kamera"
            className="p-1 rounded hover:bg-brick/20 text-brick transition-colors cursor-pointer"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Video Tile Vertikal */}
      <div className="relative w-full aspect-video bg-[#151922] rounded-lg border-2 border-teal overflow-hidden shadow-inner group">
        {/* Real Webcam Video Stream */}
        <video
          ref={localVideoRef}
          autoPlay
          playsInline
          muted
          className={`w-full h-full object-cover -scale-x-100 ${
            isLocalStreaming ? 'block' : 'hidden'
          }`}
        />

        {/* Fallback jika kamera belum/tidak aktif */}
        {!isLocalStreaming && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-[#1a202c] p-2 text-center">
            <div className="w-12 h-12 rounded border border-teal overflow-hidden bg-sand mb-1 shadow-xs">
              <img
                src={userAvatar}
                alt={userName}
                className="w-full h-full object-contain scale-[1.35] origin-center pixelated"
              />
            </div>
            <span className="text-[10px] text-soft/80 font-mono">
              {localCamError ? 'Kamera Virtual Aktif' : 'Menghubungkan Kamera...'}
            </span>
          </div>
        )}

        {/* Label Overlay Bawah */}
        <div className="absolute bottom-0 inset-x-0 p-1.5 bg-gradient-to-t from-black/85 via-black/45 to-transparent flex items-center justify-between text-soft text-[10px]">
          <div className="min-w-0">
            <div className="flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse flex-shrink-0" />
              <span className="font-bold truncate max-w-[140px]">{userName}</span>
            </div>
            <span className="text-[9px] text-soft/60 block truncate leading-tight">
              {userRole}
            </span>
          </div>

          <div className="flex items-center gap-1 flex-shrink-0">
            {isMicOn ? (
              <Mic className="w-3 h-3 text-emerald-400" />
            ) : (
              <MicOff className="w-3 h-3 text-brick" />
            )}
          </div>
        </div>

        {/* Hover Quick Action Buttons */}
        <div className="absolute top-1.5 right-1.5 opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1 bg-black/60 backdrop-blur-xs rounded p-0.5 z-10">
          {onToggleMic && (
            <button
              type="button"
              onClick={onToggleMic}
              className="p-1 hover:bg-white/20 rounded text-soft cursor-pointer"
              title={isMicOn ? 'Matikan Mic' : 'Nyalakan Mic'}
            >
              {isMicOn ? <Mic className="w-3 h-3" /> : <MicOff className="w-3 h-3 text-brick" />}
            </button>
          )}
          <button
            type="button"
            onClick={onClose}
            className="p-1 hover:bg-brick/50 rounded text-soft cursor-pointer"
            title="Matikan Kamera"
          >
            <VideoOff className="w-3 h-3" />
          </button>
        </div>
      </div>
    </div>
  );
};
