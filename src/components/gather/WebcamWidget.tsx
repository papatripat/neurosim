import React, { useEffect, useRef, useState } from 'react';
import { X, Mic, MicOff } from 'lucide-react';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  isMicOn: boolean;
  userName?: string;
  userAvatar?: string;
}

export const WebcamWidget: React.FC<Props> = ({
  isOpen,
  onClose,
  isMicOn,
  userName = 'Baginda (Kamu)',
  userAvatar = '/assets/characters/resident/standing/south.png',
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isStreaming, setIsStreaming] = useState(false);
  const [hasError, setHasError] = useState(false);

  useEffect(() => {
    if (!isOpen) {
      setIsStreaming(false);
      setHasError(false);
      return;
    }

    let stream: MediaStream | null = null;
    let isMounted = true;

    navigator.mediaDevices
      ?.getUserMedia({
        video: {
          width: { ideal: 640 },
          height: { ideal: 480 },
          facingMode: 'user',
        },
        audio: false,
      })
      .then((s) => {
        if (!isMounted) {
          s.getTracks().forEach((track) => track.stop());
          return;
        }
        stream = s;
        if (videoRef.current) {
          videoRef.current.srcObject = s;
          videoRef.current.onloadedmetadata = () => {
            videoRef.current
              ?.play()
              .then(() => {
                if (isMounted) setIsStreaming(true);
              })
              .catch(() => {
                if (isMounted) setIsStreaming(true);
              });
          };
        }
      })
      .catch((err) => {
        console.warn('[WebcamWidget] Akses kamera tidak tersedia atau ditolak:', err);
        if (isMounted) {
          setHasError(true);
        }
      });

    return () => {
      isMounted = false;
      if (stream) {
        stream.getTracks().forEach((track) => track.stop());
      }
    };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div
      className="absolute top-16 left-4 z-30 w-60 sm:w-72 aspect-video bg-black rounded-lg border-2 border-teal shadow-2xl overflow-hidden flex flex-col animate-in fade-in zoom-in-95 select-none"
      style={{ filter: 'drop-shadow(0 10px 15px rgba(0,0,0,0.4))' }}
    >
      {/* Video stream or Avatar fallback */}
      <div className="relative flex-1 w-full h-full bg-[#1b202a] flex items-center justify-center overflow-hidden">
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted
          className={`w-full h-full object-cover -scale-x-100 ${
            isStreaming ? 'block' : 'hidden'
          }`}
        />

        {/* Fallback avatar overlay if camera feed is still loading or denied */}
        {!isStreaming && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-[#1e2330] p-2 text-center">
            <div className="w-12 h-12 rounded border border-teal overflow-hidden bg-cream mb-1 shadow-xs">
              <img
                src={userAvatar}
                alt={userName}
                className="w-full h-full object-contain scale-[1.7] pixelated"
              />
            </div>
            <span className="text-[10px] text-soft/80 font-mono">
              {hasError ? 'Kamera Tidak Tersedia' : 'Menghubungkan Kamera...'}
            </span>
          </div>
        )}
      </div>

      {/* Widget Footer */}
      <div className="px-2.5 py-1 bg-teal text-soft flex items-center justify-between text-[11px] font-medium border-t border-teal-dark">
        <div className="flex items-center gap-1.5 truncate">
          {isMicOn ? (
            <Mic className="w-3.5 h-3.5 text-sage flex-shrink-0" />
          ) : (
            <MicOff className="w-3.5 h-3.5 text-brick flex-shrink-0" />
          )}
          <span className="truncate">{userName}</span>
        </div>
        <button
          type="button"
          onClick={onClose}
          aria-label="Tutup Kamera"
          className="hover:text-brass transition-colors p-0.5 ml-1"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
};
