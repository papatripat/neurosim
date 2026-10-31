import React, { useEffect, useRef } from 'react';
import { X, Mic, MicOff } from 'lucide-react';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  isMicOn: boolean;
}

export const WebcamWidget: React.FC<Props> = ({ isOpen, onClose, isMicOn }) => {
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    if (!isOpen) return;

    let stream: MediaStream | null = null;
    navigator.mediaDevices
      ?.getUserMedia({ video: true })
      .then((s) => {
        stream = s;
        if (videoRef.current) {
          videoRef.current.srcObject = s;
        }
      })
      .catch(() => {
        // Fallback to avatar if user denies camera or camera is unavailable
      });

    return () => {
      if (stream) {
        stream.getTracks().forEach((track) => track.stop());
      }
    };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="absolute top-4 left-4 z-30 w-44 sm:w-52 aspect-video bg-black rounded-lg border-2 border-teal shadow-xl overflow-hidden flex flex-col animate-in fade-in zoom-in-95">
      {/* Video stream or Avatar fallback */}
      <div className="relative flex-1 w-full h-full bg-[#1b202a] flex items-center justify-center overflow-hidden">
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted
          className="w-full h-full object-cover mirror"
        />
        {/* Fallback avatar overlay if camera feed is not available */}
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-[#1e2330] pointer-events-none">
          <div className="w-12 h-12 rounded border border-teal overflow-hidden bg-cream mb-1">
            <img
              src="/assets/characters/resident/standing/south.png"
              alt="Baginda"
              className="w-full h-full object-contain scale-[1.7] pixelated"
            />
          </div>
          <span className="text-[10px] text-soft/80 font-mono">Kamera Aktif</span>
        </div>
      </div>

      {/* Widget Footer */}
      <div className="px-2 py-1 bg-teal text-soft flex items-center justify-between text-[11px] font-medium">
        <div className="flex items-center gap-1.5 truncate">
          {isMicOn ? (
            <Mic className="w-3 h-3 text-sage" />
          ) : (
            <MicOff className="w-3 h-3 text-brick" />
          )}
          <span className="truncate">Baginda (Kamu)</span>
        </div>
        <button
          type="button"
          onClick={onClose}
          aria-label="Tutup Kamera"
          className="hover:text-brass transition-colors p-0.5"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
};

