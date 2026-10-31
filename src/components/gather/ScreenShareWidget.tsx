import React, { useEffect, useRef, useState } from 'react';
import { X, ScreenShare, Maximize2, Minimize2, AlertCircle } from 'lucide-react';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  userName?: string;
}

export const ScreenShareWidget: React.FC<Props> = ({
  isOpen,
  onClose,
  userName = 'Baginda (Kamu)',
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isStreaming, setIsStreaming] = useState(false);
  const [hasError, setHasError] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);

  useEffect(() => {
    if (!isOpen) {
      setIsStreaming(false);
      setHasError(false);
      return;
    }

    let stream: MediaStream | null = null;
    let isMounted = true;

    if (!navigator.mediaDevices?.getDisplayMedia) {
      setHasError(true);
      return;
    }

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
        stream = s;
        if (videoRef.current) {
          videoRef.current.srcObject = s;
          videoRef.current.onloadedmetadata = () => {
            videoRef.current?.play().catch(console.error);
            setIsStreaming(true);
          };
        }

        // When user stops sharing from browser's native floating bar
        const videoTrack = s.getVideoTracks()[0];
        if (videoTrack) {
          videoTrack.onended = () => {
            onClose();
          };
        }
      })
      .catch((err) => {
        console.warn('[ScreenShareWidget] Berbagi layar dibatalkan atau ditolak:', err);
        if (isMounted) {
          setHasError(true);
          onClose();
        }
      });

    return () => {
      isMounted = false;
      if (stream) {
        stream.getTracks().forEach((track) => track.stop());
      }
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      className={`absolute z-30 transition-all duration-200 bg-black rounded-lg border-2 border-brass shadow-2xl overflow-hidden flex flex-col animate-in fade-in zoom-in-95 select-none ${
        isExpanded
          ? 'inset-6 sm:inset-12 z-40'
          : 'bottom-20 right-4 w-72 sm:w-96 aspect-video'
      }`}
    >
      {/* Widget Header */}
      <div className="px-3 py-1.5 bg-[#242a38] text-soft flex items-center justify-between text-xs font-semibold border-b border-[#355c5a]/40">
        <div className="flex items-center gap-2 truncate">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse flex-shrink-0" />
          <ScreenShare className="w-3.5 h-3.5 text-brass flex-shrink-0" />
          <span className="truncate">Berbagi Layar: {userName}</span>
        </div>

        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={() => setIsExpanded((e) => !e)}
            title={isExpanded ? 'Kecilkan Tampilan PIP' : 'Perbesar Tampilan'}
            className="p-1 text-soft/80 hover:text-white hover:bg-white/10 rounded transition-colors"
          >
            {isExpanded ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
          </button>
          <button
            type="button"
            onClick={onClose}
            title="Hentikan Berbagi Layar"
            className="p-1 text-soft/80 hover:text-brick hover:bg-white/10 rounded transition-colors"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Screen Feed */}
      <div className="relative flex-1 w-full h-full bg-black flex items-center justify-center overflow-hidden">
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted
          className={`w-full h-full object-contain ${isStreaming ? 'block' : 'hidden'}`}
        />

        {!isStreaming && (
          <div className="flex flex-col items-center justify-center text-soft/70 space-y-2 p-4 text-center">
            {hasError ? (
              <>
                <AlertCircle className="w-8 h-8 text-brick" />
                <p className="text-xs">Berbagi layar tidak didukung atau izin ditolak.</p>
              </>
            ) : (
              <>
                <ScreenShare className="w-8 h-8 text-brass animate-bounce" />
                <p className="text-xs font-mono">Memilih layar untuk dipresentasikan...</p>
              </>
            )}
          </div>
        )}
      </div>

      {/* Bottom control bar when expanded */}
      {isExpanded && (
        <div className="p-2 bg-[#1b202a] border-t border-white/10 flex items-center justify-between text-xs text-soft/80">
          <span>Presentasi Layar Kantor Virtual</span>
          <button
            type="button"
            onClick={onClose}
            className="px-3 py-1 bg-brick text-white rounded font-medium hover:bg-brick/90 transition-colors"
          >
            Hentikan Berbagi
          </button>
        </div>
      )}
    </div>
  );
};

