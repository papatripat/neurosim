import React, { useEffect, useRef, useState } from 'react';
import {
  X,
  ScreenShare,
  Maximize2,
  Minimize2,
  Tv,
  CheckCircle2,
  Sparkles,
} from 'lucide-react';
import { EventBus, GAME_EVENTS } from '../../game/EventBus';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  userName?: string;
  isViewerMode?: boolean; // true jika sedang melihat presentasi orang lain
  presenterName?: string;
}

export const ScreenShareWidget: React.FC<Props> = ({
  isOpen,
  onClose,
  userName = 'Baginda (Kamu)',
  isViewerMode = false,
  presenterName = 'Rekan Kerja',
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [isStreaming, setIsStreaming] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;

  useEffect(() => {
    // 1. Jika ditutup (isOpen = false), bersihkan stream yang ada
    if (!isOpen) {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
        streamRef.current = null;
      }
      setIsStreaming(false);
      setIsExpanded(false);
      EventBus.emit(GAME_EVENTS.SCREEN_SHARE_CHANGED, { isSharing: false });
      return;
    }

    // 2. Jika sedang melihat presentasi orang lain, gunakan mode viewer gambar
    if (isViewerMode) {
      setIsStreaming(true);
      return;
    }

    // 3. PENTING: Jika stream sudah aktif, JANGAN minta izin lagi ke browser!
    if (streamRef.current && streamRef.current.active) {
      if (videoRef.current && videoRef.current.srcObject !== streamRef.current) {
        videoRef.current.srcObject = streamRef.current;
      }
      setIsStreaming(true);
      return;
    }

    // Broadcast ke Phaser 2D bahwa pemain sedang berbagi layar
    EventBus.emit(GAME_EVENTS.SCREEN_SHARE_CHANGED, {
      isSharing: true,
      sharerName: userName,
    });

    let isMounted = true;

    if (navigator.mediaDevices?.getDisplayMedia) {
      navigator.mediaDevices
        .getDisplayMedia({
          video: true,
          audio: false,
        })
        .then((s) => {
          if (!isMounted) {
            s.getTracks().forEach((track) => track.stop());
            return;
          }
          streamRef.current = s;
          if (videoRef.current) {
            videoRef.current.srcObject = s;
            videoRef.current.onloadedmetadata = () => {
              videoRef.current?.play().catch(console.error);
              if (isMounted) setIsStreaming(true);
            };
          }

          // Otomatis stop saat user menutup sharing dari browser floating banner
          const videoTrack = s.getVideoTracks()[0];
          if (videoTrack) {
            videoTrack.onended = () => {
              if (streamRef.current) {
                streamRef.current.getTracks().forEach((t) => t.stop());
                streamRef.current = null;
              }
              onCloseRef.current();
            };
          }
        })
        .catch((err) => {
          console.warn('[ScreenShareWidget] Berbagi layar dibatalkan atau ditolak:', err);
          if (streamRef.current) {
            streamRef.current.getTracks().forEach((t) => t.stop());
            streamRef.current = null;
          }
          onCloseRef.current();
        });
    } else {
      onCloseRef.current();
    }

    return () => {
      isMounted = false;
    };
  }, [isOpen, isViewerMode, userName]);

  // Bersihkan track saat komponen unmount
  useEffect(() => {
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((t) => t.stop());
        streamRef.current = null;
      }
    };
  }, []);

  if (!isOpen) return null;

  // KONDISI 1: JIKA MELIHAT PRESENTASI ORANG LAIN ("ketika lihat orang lain dibuat seperti gambar saja")
  if (isViewerMode) {
    return (
      <div
        className={`fixed z-50 transition-all duration-200 bg-[#0b0e14] border-2 border-brass rounded-xl shadow-2xl overflow-hidden flex flex-col animate-in fade-in zoom-in-95 select-none ${
          isExpanded
            ? 'inset-3 sm:inset-6'
            : 'bottom-20 right-4 w-[92vw] sm:w-[500px] md:w-[620px] aspect-video max-h-[75vh]'
        }`}
        style={{ filter: 'drop-shadow(0 20px 30px rgba(0,0,0,0.6))' }}
      >
        {/* Header */}
        <div className="px-3.5 py-2 bg-[#1b2230] text-soft flex items-center justify-between text-xs font-semibold border-b border-brass/40 flex-shrink-0">
          <div className="flex items-center gap-2 min-w-0">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
            <Tv className="w-3.5 h-3.5 text-brass flex-shrink-0" />
            <span className="font-bold truncate text-white">
              Tayangan Presentasi: {presenterName}
            </span>
          </div>
          <div className="flex items-center gap-1.5 flex-shrink-0">
            <button
              type="button"
              onClick={() => setIsExpanded((e) => !e)}
              title={isExpanded ? 'Perkecil Layar' : 'Layar Penuh'}
              className="p-1 text-soft/80 hover:text-white hover:bg-white/10 rounded transition-colors cursor-pointer"
            >
              {isExpanded ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
            </button>
            <button
              type="button"
              onClick={onClose}
              title="Tutup Tayangan"
              className="p-1 text-soft/80 hover:text-white hover:bg-white/10 rounded transition-colors cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Gambar Slide Presentasi Orang Lain */}
        <div className="relative flex-1 w-full h-full p-5 flex flex-col justify-between bg-gradient-to-br from-[#0f172a] via-[#1e293b] to-[#0a0f1d] text-soft overflow-hidden">
          <div className="flex items-center justify-between border-b border-white/10 pb-2.5">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-brass" />
              <h4 className="font-bold text-xs sm:text-sm text-white">
                Slide Presentasi: Arsitektur Platform NeuroSim
              </h4>
            </div>
            <span className="text-[10px] font-mono text-emerald-400 bg-emerald-950/60 px-2 py-0.5 rounded border border-emerald-500/30">
              ● Resolusi Gambar Tajam
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 my-auto py-2">
            <div className="p-2.5 rounded bg-white/5 border border-white/10">
              <span className="text-xs font-bold text-brass block">1. Denah Kantor 2D</span>
              <p className="text-[10px] text-soft/80 mt-1 leading-relaxed">
                Navigasi avatar real-time, proximity spatial audio, dan collision interaktif.
              </p>
            </div>
            <div className="p-2.5 rounded bg-white/5 border border-white/10">
              <span className="text-xs font-bold text-teal block">2. Simulasi AI Adaptif</span>
              <p className="text-[10px] text-soft/80 mt-1 leading-relaxed">
                Interaksi komunikasi profesional dengan evaluasi objektif Gemini 3.5 Flash.
              </p>
            </div>
            <div className="p-2.5 rounded bg-white/5 border border-white/10">
              <span className="text-xs font-bold text-emerald-400 block">3. Inklusivitas Kerja</span>
              <p className="text-[10px] text-soft/80 mt-1 leading-relaxed">
                Desain ramah neurodivergent, rasio kontras WCAG AAA, dan tata letak tenang.
              </p>
            </div>
          </div>

          <div className="flex items-center justify-between text-[10px] text-soft/60 pt-2 border-t border-white/10">
            <span>Dipresentasikan oleh {presenterName}</span>
            <div className="flex items-center gap-1 text-emerald-400">
              <CheckCircle2 className="w-3 h-3" />
              <span>Gambar Tayangan Presentasi</span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // KONDISI 2: KETIKA KITA SENDIRI YANG LIVE ("dibikin seperti awal kalau kita yang live")
  return (
    <div
      className={`fixed z-40 transition-all duration-200 bg-black rounded-xl border-2 border-brass shadow-2xl overflow-hidden flex flex-col animate-in fade-in zoom-in-95 select-none ${
        isExpanded
          ? 'inset-4 sm:inset-8 z-50'
          : 'bottom-20 right-4 w-72 sm:w-96 aspect-video'
      }`}
      style={{ filter: 'drop-shadow(0 15px 25px rgba(0,0,0,0.5))' }}
    >
      {/* Widget Header Asli Seperti Awal */}
      <div className="px-3 py-1.5 bg-[#242a38] text-soft flex items-center justify-between text-xs font-semibold border-b border-[#355c5a]/40 flex-shrink-0">
        <div className="flex items-center gap-2 truncate">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse flex-shrink-0" />
          <ScreenShare className="w-3.5 h-3.5 text-brass flex-shrink-0" />
          <span className="truncate">Berbagi Layar: {userName}</span>
        </div>

        <div className="flex items-center gap-1.5 flex-shrink-0">
          <button
            type="button"
            onClick={() => setIsExpanded((e) => !e)}
            title={isExpanded ? 'Kecilkan Tampilan PIP' : 'Perbesar Tampilan'}
            className="p-1 text-soft/80 hover:text-white hover:bg-white/10 rounded transition-colors cursor-pointer"
          >
            {isExpanded ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
          </button>
          <button
            type="button"
            onClick={onClose}
            title="Hentikan Berbagi Layar"
            className="p-1 text-soft/80 hover:text-brick hover:bg-white/10 rounded transition-colors cursor-pointer"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Real Live Screen Video Stream Seperti Awal */}
      <div className="relative flex-1 w-full h-full bg-[#0b0e14] flex items-center justify-center overflow-hidden">
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted
          className={`w-full h-full object-contain ${isStreaming ? 'block' : 'hidden'}`}
        />

        {!isStreaming && (
          <div className="flex flex-col items-center justify-center text-soft/70 space-y-2 p-4 text-center">
            <ScreenShare className="w-7 h-7 text-brass animate-bounce" />
            <p className="text-xs font-mono">Menghubungkan siaran layar...</p>
          </div>
        )}
      </div>

      {/* Control bar bawah */}
      <div className="px-3 py-1.5 bg-[#1b202a] border-t border-white/10 flex items-center justify-between text-xs text-soft/80 flex-shrink-0">
        <span className="text-[10px] text-soft/60">Siaran Layar Aktif</span>
        <button
          type="button"
          onClick={onClose}
          className="px-2.5 py-0.5 bg-brick text-soft rounded text-[11px] font-semibold hover:bg-brick/90 transition-colors cursor-pointer"
        >
          Hentikan Berbagi
        </button>
      </div>
    </div>
  );
};
