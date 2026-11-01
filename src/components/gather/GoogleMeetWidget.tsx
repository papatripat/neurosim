import React, { useEffect, useRef, useState, useMemo } from 'react';
import {
  X,
  Mic,
  MicOff,
  Video,
  VideoOff,
  Maximize2,
  Minimize2,
  Pin,
  PinOff,
  ScreenShare,
  Users,
  Grid,
  ShieldAlert,
  Volume2,
  ExternalLink,
} from 'lucide-react';
import { PlayerPresence } from '../../types/multiplayer';
import { webrtcService } from '../../services/webrtc.service';
import { multiplayerService } from '../../services/multiplayer.service';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  isMicOn: boolean;
  onToggleMic: () => void;
  isCamOn: boolean;
  onToggleCam: () => void;
  isScreenSharing: boolean;
  onToggleScreenShare: () => void;
  userName: string;
  userAvatar?: string;
  userRole?: string;
  roomCode?: string;
  remotePlayers: PlayerPresence[];
}

export const GoogleMeetWidget: React.FC<Props> = ({
  isOpen,
  onClose,
  isMicOn,
  onToggleMic,
  isCamOn,
  onToggleCam,
  isScreenSharing,
  onToggleScreenShare,
  userName,
  userAvatar = '/assets/characters/resident/standing/south.png',
  userRole = 'Staff Pengembang',
  roomCode = 'NEURO-HQ-88',
  remotePlayers,
}) => {
  const localVideoRef = useRef<HTMLVideoElement>(null);
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [remoteStreams, setRemoteStreams] = useState<Map<string, MediaStream>>(new Map());
  const [isSpeakingLocal, setIsSpeakingLocal] = useState(false);
  const [isFullScreenMeet, setIsFullScreenMeet] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [pinnedSocketId, setPinnedSocketId] = useState<string | null>(null);
  const [sslError, setSslError] = useState(false);

  const isSecure = useMemo(() => webrtcService.isSecureContext(), []);

  // 1. Sinkronkan WebRTC Local Stream saat isCamOn / isMicOn berubah
  useEffect(() => {
    if (!isOpen) {
      webrtcService.stopLocalStream();
      setLocalStream(null);
      setIsSpeakingLocal(false);
      return;
    }

    if (!isSecure && !webrtcService.isMediaDevicesSupported()) {
      setSslError(true);
      return;
    }

    setSslError(false);

    if (isCamOn || isMicOn) {
      webrtcService
        .getOrCreateLocalStream(isCamOn, isMicOn)
        .then((stream) => {
          setLocalStream(stream);
          if (localVideoRef.current) {
            localVideoRef.current.srcObject = stream;
            localVideoRef.current.play().catch(() => {});
          }
          // Siarkan status media ke seluruh partisipan di room
          multiplayerService.sendMediaState({
            isCamOn,
            isMicOn,
            isScreenSharing,
          });

          // Hubungkan ke seluruh remote players yang ada
          for (const player of remotePlayers) {
            webrtcService.connectToPeer(player.socketId, true);
          }
        })
        .catch((err) => {
          console.warn('[GoogleMeet] Izin kamera/mic ditolak atau tidak tersedia:', err);
          if (err.message === 'SECURE_CONTEXT_REQUIRED' || !isSecure) {
            setSslError(true);
          }
        });
    } else {
      webrtcService.setVideoEnabled(false);
      webrtcService.setAudioEnabled(false);
      multiplayerService.sendMediaState({
        isCamOn: false,
        isMicOn: false,
        isScreenSharing,
      });
    }
  }, [isOpen, isCamOn, isMicOn, isScreenSharing, isSecure, remotePlayers]);

  // 2. Hubungkan ke peer baru saat remote player bergabung
  useEffect(() => {
    if (!isOpen) return;
    for (const player of remotePlayers) {
      if (!remoteStreams.has(player.socketId)) {
        webrtcService.connectToPeer(player.socketId, false);
      }
    }
  }, [isOpen, remotePlayers, remoteStreams]);

  // 3. Listener event stream WebRTC & indikator suara bicara
  useEffect(() => {
    const unsubStream = webrtcService.onStream(({ socketId, stream }) => {
      setRemoteStreams((prev) => new Map(prev).set(socketId, stream));
    });

    const unsubRemoved = webrtcService.onStreamRemoved((socketId) => {
      setRemoteStreams((prev) => {
        const next = new Map(prev);
        next.delete(socketId);
        return next;
      });
    });

    const unsubSpeaking = webrtcService.onSpeakingChange((speaking) => {
      setIsSpeakingLocal(speaking);
    });

    return () => {
      unsubStream();
      unsubRemoved();
      unsubSpeaking();
    };
  }, []);

  // Update attachment video lokal saat stream tersedia
  useEffect(() => {
    if (localVideoRef.current && localStream) {
      localVideoRef.current.srcObject = localStream;
      localVideoRef.current.play().catch(() => {});
    }
  }, [localStream, isCamOn]);

  if (!isOpen) return null;

  // Mode Minimized Pill (pojok kiri atas kantor 2D)
  if (isMinimized) {
    return (
      <div className="absolute top-16 left-4 z-40 animate-in fade-in zoom-in-95">
        <div className="flex items-center gap-2 bg-[#1e293b]/95 border-2 border-teal rounded-full shadow-2xl px-3.5 py-1.5 text-xs text-soft backdrop-blur-md">
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
          <Video className="w-4 h-4 text-teal" />
          <span className="font-bold">Google Meet ({1 + remotePlayers.length} Peserta)</span>
          <button
            type="button"
            onClick={() => setIsMinimized(false)}
            className="p-1 hover:bg-white/10 rounded-full transition-colors cursor-pointer text-teal hover:text-white"
            title="Buka Video Meet"
          >
            <Maximize2 className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={onClose}
            className="p-1 hover:bg-brick/40 rounded-full transition-colors cursor-pointer text-brick hover:text-white"
            title="Tutup Meet"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    );
  }

  // Komponen Remote Tile Tunggal
  const RemoteVideoTile: React.FC<{ player: PlayerPresence; isPinned: boolean; onPin: () => void }> = ({
    player,
    isPinned,
    onPin,
  }) => {
    const videoRef = useRef<HTMLVideoElement>(null);
    const stream = remoteStreams.get(player.socketId);
    const media = player.mediaState;
    const isCamActive = Boolean(media?.isCamOn);
    const isMicActive = Boolean(media?.isMicOn);
    const isSpeaking = Boolean(media?.isSpeaking);

    useEffect(() => {
      if (videoRef.current && stream) {
        videoRef.current.srcObject = stream;
        videoRef.current.play().catch(() => {});
      }
    }, [stream]);

    return (
      <div
        className={`relative bg-[#181f2c] rounded-xl overflow-hidden border transition-all duration-200 flex items-center justify-center group ${
          isSpeaking
            ? 'border-emerald-400 ring-2 ring-emerald-400/80 shadow-[0_0_15px_rgba(52,211,153,0.3)]'
            : isPinned
            ? 'border-amber-400 ring-1 ring-amber-400/50'
            : 'border-slate-700/80 hover:border-teal/60'
        } aspect-video min-h-[140px]`}
      >
        {/* Remote Video Stream bila ada & cam aktif */}
        {isCamActive && stream ? (
          <video
            ref={videoRef}
            autoPlay
            playsInline
            className="w-full h-full object-cover"
          />
        ) : (
          /* Fallback Avatar Google Meet saat kamera mati */
          <div className="flex flex-col items-center justify-center p-4 text-center">
            <div
              className={`w-14 h-14 sm:w-16 sm:h-16 rounded-full flex items-center justify-center border-2 transition-all overflow-hidden ${
                isSpeaking
                  ? 'border-emerald-400 scale-105 shadow-[0_0_12px_rgba(52,211,153,0.5)]'
                  : 'border-teal/60 bg-[#253246]'
              }`}
            >
              <img
                src={player.avatar || '/assets/characters/resident/standing/south.png'}
                alt={player.fullName}
                className="w-full h-full object-contain scale-[1.3] origin-center pixelated"
              />
            </div>
            <span className="text-xs font-semibold text-slate-200 mt-2 truncate max-w-[130px]">
              {player.fullName.split(' ')[0]}
            </span>
          </div>
        )}

        {/* Pin Spotlight Button */}
        <button
          type="button"
          onClick={onPin}
          className={`absolute top-2 right-2 p-1.5 rounded-full backdrop-blur-md transition-opacity cursor-pointer ${
            isPinned
              ? 'bg-amber-500 text-slate-900 opacity-100'
              : 'bg-black/50 text-white/80 opacity-0 group-hover:opacity-100 hover:bg-black/80'
          }`}
          title={isPinned ? 'Lepas Pin' : 'Pin Peserta'}
        >
          {isPinned ? <PinOff className="w-3.5 h-3.5" /> : <Pin className="w-3.5 h-3.5" />}
        </button>

        {/* Bottom Label Badge (Google Meet style) */}
        <div className="absolute bottom-2 left-2 right-2 flex items-center justify-between pointer-events-none">
          <div className="bg-black/65 backdrop-blur-md px-2.5 py-1 rounded-md text-[11px] text-white flex items-center gap-1.5 max-w-[80%]">
            <span className={`w-2 h-2 rounded-full ${isSpeaking ? 'bg-emerald-400 animate-pulse' : 'bg-slate-400'}`} />
            <span className="font-bold truncate">{player.fullName}</span>
          </div>

          <div
            className={`p-1.5 rounded-full backdrop-blur-md ${
              isMicActive ? 'bg-emerald-500/80 text-white' : 'bg-brick/80 text-white'
            }`}
          >
            {isMicActive ? <Mic className="w-3 h-3" /> : <MicOff className="w-3 h-3" />}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div
      className={`z-40 transition-all duration-300 flex flex-col ${
        isFullScreenMeet
          ? 'fixed inset-0 bg-[#0b1120]/95 backdrop-blur-xl p-4 sm:p-6'
          : 'absolute top-16 left-4 w-[360px] sm:w-[480px] max-w-[95vw] max-h-[82vh] bg-[#0f172a]/95 border-2 border-teal rounded-2xl shadow-2xl backdrop-blur-lg p-3'
      }`}
      style={{ filter: 'drop-shadow(0 20px 30px rgba(0,0,0,0.5))' }}
    >
      {/* ------------------------------------------------------------- */}
      {/* 1. Header Google Meet Bar                                     */}
      {/* ------------------------------------------------------------- */}
      <div className="flex items-center justify-between pb-2.5 border-b border-slate-700/60 mb-2 px-1">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-emerald-400 animate-pulse" />
          <div className="flex items-center gap-1.5 font-bold text-sm text-white">
            <span className="text-teal font-extrabold tracking-wide">NeuroSim Meet</span>
            <span className="text-xs px-2 py-0.5 rounded-full bg-teal/15 text-teal border border-teal/30 font-mono">
              {roomCode}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-1.5 text-slate-300">
          <div className="hidden sm:flex items-center gap-1 text-xs bg-slate-800/80 px-2 py-1 rounded-md border border-slate-700 mr-1">
            <Users className="w-3.5 h-3.5 text-teal" />
            <span>{1 + remotePlayers.length} Terhubung</span>
          </div>

          <button
            type="button"
            onClick={() => setIsFullScreenMeet((f) => !f)}
            className="p-1.5 rounded-lg hover:bg-slate-800 hover:text-white transition-colors cursor-pointer text-slate-400"
            title={isFullScreenMeet ? 'Kecilkan ke Jendela Kantor' : 'Mode Layar Penuh (Google Meet)'}
          >
            {isFullScreenMeet ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
          </button>

          {!isFullScreenMeet && (
            <button
              type="button"
              onClick={() => setIsMinimized(true)}
              className="p-1.5 rounded-lg hover:bg-slate-800 hover:text-white transition-colors cursor-pointer text-slate-400"
              title="Kecilkan ke Tombol Mengambang"
            >
              <Minimize2 className="w-4 h-4" />
            </button>
          )}

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-brick/30 text-brick hover:text-white transition-colors cursor-pointer"
            title="Keluar dari Video Call"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* ------------------------------------------------------------- */}
      {/* 2. SSL / HTTPS Security Warning Banner                         */}
      {/* ------------------------------------------------------------- */}
      {sslError && (
        <div className="mb-3 p-2.5 rounded-lg bg-amber-950/80 border border-amber-500/60 text-amber-200 text-xs flex items-start gap-2.5 animate-in fade-in">
          <ShieldAlert className="w-4 h-4 text-amber-400 flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <span className="font-bold text-amber-300 block">Kamera Memerlukan Koneksi HTTPS (SSL)</span>
            <p className="text-[11px] text-amber-200/90 leading-relaxed mt-0.5">
              Peramban mewajibkan sambungan aman (HTTPS) agar kamera dan mikrofon dapat diaktifkan di domain publik.
            </p>
            <div className="flex items-center gap-2 mt-1.5">
              <a
                href={window.location.href.replace('http://', 'https://')}
                className="inline-flex items-center gap-1 px-2.5 py-1 rounded bg-amber-500 text-slate-950 font-bold text-[10.5px] hover:bg-amber-400 transition-colors"
              >
                <span>Buka Versi HTTPS</span>
                <ExternalLink className="w-3 h-3" />
              </a>
              <span className="text-[10px] text-amber-300/80">atau gunakan localhost:3000</span>
            </div>
          </div>
        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* 3. Responsive Video Grid (Google Meet Layout)                 */}
      {/* ------------------------------------------------------------- */}
      <div className="flex-1 min-h-0 overflow-y-auto pr-0.5">
        <div
          className={`grid gap-2.5 ${
            isFullScreenMeet
              ? remotePlayers.length === 0
                ? 'grid-cols-1 max-w-4xl mx-auto h-full'
                : remotePlayers.length === 1
                ? 'grid-cols-1 md:grid-cols-2 max-w-5xl mx-auto h-full'
                : remotePlayers.length <= 3
                ? 'grid-cols-1 sm:grid-cols-2 max-w-5xl mx-auto'
                : 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3'
              : remotePlayers.length === 0
              ? 'grid-cols-1'
              : 'grid-cols-1 sm:grid-cols-2'
          }`}
        >
          {/* Tile 1: LOCAL USER ("Kamu") */}
          <div
            className={`relative bg-[#181f2c] rounded-xl overflow-hidden border transition-all duration-200 flex items-center justify-center group ${
              isSpeakingLocal
                ? 'border-emerald-400 ring-2 ring-emerald-400/80 shadow-[0_0_15px_rgba(52,211,153,0.3)]'
                : 'border-slate-700/80 hover:border-teal/60'
            } aspect-video min-h-[140px]`}
          >
            {/* Live Camera Video Stream */}
            <video
              ref={localVideoRef}
              autoPlay
              playsInline
              muted
              className={`w-full h-full object-cover -scale-x-100 ${
                isCamOn && localStream ? 'block' : 'hidden'
              }`}
            />

            {/* Fallback Avatar Tile saat kamera mati */}
            {(!isCamOn || !localStream) && (
              <div className="flex flex-col items-center justify-center p-4 text-center">
                <div
                  className={`w-14 h-14 sm:w-16 sm:h-16 rounded-full flex items-center justify-center border-2 transition-all overflow-hidden ${
                    isSpeakingLocal
                      ? 'border-emerald-400 scale-105 shadow-[0_0_12px_rgba(52,211,153,0.5)]'
                      : 'border-teal/60 bg-[#253246]'
                  }`}
                >
                  <img
                    src={userAvatar}
                    alt={userName}
                    className="w-full h-full object-contain scale-[1.3] origin-center pixelated"
                  />
                </div>
                <span className="text-xs font-semibold text-slate-200 mt-2 truncate max-w-[130px]">
                  {userName} (Kamu)
                </span>
                <span className="text-[10px] text-slate-400 block truncate max-w-[130px]">
                  {userRole}
                </span>
              </div>
            )}

            {/* Bottom Tag & Status Icon */}
            <div className="absolute bottom-2 left-2 right-2 flex items-center justify-between pointer-events-none">
              <div className="bg-black/65 backdrop-blur-md px-2.5 py-1 rounded-md text-[11px] text-white flex items-center gap-1.5 max-w-[80%]">
                <span className={`w-2 h-2 rounded-full ${isSpeakingLocal ? 'bg-emerald-400 animate-pulse' : 'bg-slate-400'}`} />
                <span className="font-bold truncate">{userName} (Kamu)</span>
              </div>

              <div
                className={`p-1.5 rounded-full backdrop-blur-md ${
                  isMicOn ? 'bg-emerald-500/80 text-white' : 'bg-brick/80 text-white'
                }`}
              >
                {isMicOn ? <Mic className="w-3 h-3" /> : <MicOff className="w-3 h-3 text-white" />}
              </div>
            </div>
          </div>

          {/* Tile 2+: REMOTE USERS */}
          {remotePlayers.map((player) => (
            <RemoteVideoTile
              key={player.socketId}
              player={player}
              isPinned={pinnedSocketId === player.socketId}
              onPin={() => setPinnedSocketId((p) => (p === player.socketId ? null : player.socketId))}
            />
          ))}
        </div>
      </div>

      {/* ------------------------------------------------------------- */}
      {/* 4. Bottom Control Toolbar (Google Meet Action Bar)            */}
      {/* ------------------------------------------------------------- */}
      <div className="pt-3 mt-2 border-t border-slate-700/60 flex items-center justify-center gap-2.5 sm:gap-4">
        {/* Toggle Microphone */}
        <button
          type="button"
          onClick={onToggleMic}
          className={`p-3 rounded-full transition-all duration-150 cursor-pointer shadow-lg ${
            isMicOn
              ? 'bg-slate-700 hover:bg-slate-600 text-white'
              : 'bg-brick hover:bg-brick/90 text-white ring-2 ring-brick/40'
          }`}
          title={isMicOn ? 'Matikan Mikrofon (Ctrl+D)' : 'Nyalakan Mikrofon (Ctrl+D)'}
        >
          {isMicOn ? <Mic className="w-4 h-4" /> : <MicOff className="w-4 h-4" />}
        </button>

        {/* Toggle Camera */}
        <button
          type="button"
          onClick={onToggleCam}
          className={`p-3 rounded-full transition-all duration-150 cursor-pointer shadow-lg ${
            isCamOn
              ? 'bg-slate-700 hover:bg-slate-600 text-white'
              : 'bg-brick hover:bg-brick/90 text-white ring-2 ring-brick/40'
          }`}
          title={isCamOn ? 'Matikan Kamera (Ctrl+E)' : 'Nyalakan Kamera (Ctrl+E)'}
        >
          {isCamOn ? <Video className="w-4 h-4" /> : <VideoOff className="w-4 h-4" />}
        </button>

        {/* Toggle Screen Share */}
        <button
          type="button"
          onClick={onToggleScreenShare}
          className={`p-3 rounded-full transition-all duration-150 cursor-pointer shadow-lg ${
            isScreenSharing
              ? 'bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold'
              : 'bg-slate-700 hover:bg-slate-600 text-white'
          }`}
          title={isScreenSharing ? 'Hentikan Berbagi Layar' : 'Mulai Berbagi Layar'}
        >
          <ScreenShare className="w-4 h-4" />
        </button>

        {/* End Call / Leave Video Button */}
        <button
          type="button"
          onClick={onClose}
          className="px-4 py-2.5 rounded-full bg-brick hover:bg-red-700 text-white font-bold text-xs flex items-center gap-1.5 shadow-lg transition-colors cursor-pointer"
          title="Tinggalkan Ruang Video"
        >
          <X className="w-4 h-4" />
          <span className="hidden sm:inline">Tutup Meet</span>
        </button>
      </div>
    </div>
  );
};
