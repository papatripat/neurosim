import React, { useState, useEffect, useRef } from 'react';
import {
  DoorOpen,
  Users,
  Mic,
  MicOff,
  Video,
  VideoOff,
  ArrowLeft,
  Play,
  ShieldCheck,
  Volume2,
} from 'lucide-react';
import { OfficeRoom } from './DashboardView';
import { UserProfile } from '../modals/AuthModal';
import { CharacterCustomization, CharacterDirection } from '../../types/character';
import { CharacterCanvasPreview } from '../character/CharacterCanvasPreview';

interface Props {
  room: OfficeRoom;
  currentUser: UserProfile | null;
  characterConfig: CharacterCustomization;
  onEnterRoom: (room: OfficeRoom, micState?: boolean, camState?: boolean) => void;
  onBackToDashboard: () => void;
}

export const RoomLobbyView: React.FC<Props> = ({
  room,
  currentUser,
  characterConfig,
  onEnterRoom,
  onBackToDashboard,
}) => {
  const [previewDirection, setPreviewDirection] = useState<CharacterDirection>('south');
  const [isMicOn, setIsMicOn] = useState(false);
  const [isCamOn, setIsCamOn] = useState(false);
  const [micError, setMicError] = useState<string | null>(null);
  const [camError, setCamError] = useState<string | null>(null);
  const [audioLevel, setAudioLevel] = useState(0);

  const videoRef = useRef<HTMLVideoElement>(null);
  const videoStreamRef = useRef<MediaStream | null>(null);
  const audioStreamRef = useRef<MediaStream | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const animationFrameRef = useRef<number | null>(null);

  // Clean teardown when unmounting or leaving lobby
  useEffect(() => {
    return () => {
      if (videoStreamRef.current) {
        videoStreamRef.current.getTracks().forEach((t) => t.stop());
        videoStreamRef.current = null;
      }
      if (audioStreamRef.current) {
        audioStreamRef.current.getTracks().forEach((t) => t.stop());
        audioStreamRef.current = null;
      }
      if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
        audioContextRef.current.close().catch(() => {});
        audioContextRef.current = null;
      }
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
        animationFrameRef.current = null;
      }
    };
  }, []);

  const toggleCam = async () => {
    if (isCamOn) {
      if (videoStreamRef.current) {
        videoStreamRef.current.getTracks().forEach((t) => t.stop());
        videoStreamRef.current = null;
      }
      if (videoRef.current) {
        videoRef.current.srcObject = null;
      }
      setIsCamOn(false);
      setCamError(null);
    } else {
      try {
        setCamError(null);
        if (!navigator.mediaDevices?.getUserMedia) {
          setCamError('Peramban tidak mendukung akses kamera.');
          return;
        }

        const stream = await navigator.mediaDevices.getUserMedia({
          video: {
            width: { ideal: 640 },
            height: { ideal: 480 },
            facingMode: 'user',
          },
          audio: false,
        });

        videoStreamRef.current = stream;
        setIsCamOn(true);

        setTimeout(() => {
          if (videoRef.current) {
            videoRef.current.srcObject = stream;
            videoRef.current.play().catch(console.error);
          }
        }, 50);
      } catch (err: any) {
        console.warn('Webcam permission or device error:', err);
        setCamError('Kamera tidak terdeteksi atau izin ditolak');
        setIsCamOn(false);
      }
    }
  };

  const toggleMic = async () => {
    if (isMicOn) {
      if (audioStreamRef.current) {
        audioStreamRef.current.getTracks().forEach((t) => t.stop());
        audioStreamRef.current = null;
      }
      if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
        audioContextRef.current.close().catch(() => {});
        audioContextRef.current = null;
      }
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
        animationFrameRef.current = null;
      }
      setAudioLevel(0);
      setIsMicOn(false);
      setMicError(null);
    } else {
      try {
        setMicError(null);
        if (!navigator.mediaDevices?.getUserMedia) {
          setMicError('Peramban tidak mendukung akses mikrofon.');
          return;
        }

        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        audioStreamRef.current = stream;

        const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
        if (AudioContextClass) {
          const audioCtx = new AudioContextClass();
          audioContextRef.current = audioCtx;
          const analyser = audioCtx.createAnalyser();
          analyser.fftSize = 64;
          analyser.smoothingTimeConstant = 0.5;
          const source = audioCtx.createMediaStreamSource(stream);
          source.connect(analyser);

          const dataArray = new Uint8Array(analyser.frequencyBinCount);
          const checkVolume = () => {
            analyser.getByteFrequencyData(dataArray);
            let sum = 0;
            for (let i = 0; i < dataArray.length; i++) {
              sum += dataArray[i];
            }
            const avg = sum / dataArray.length;
            const normalized = Math.min(100, Math.round((avg / 100) * 100));
            setAudioLevel(normalized);
            animationFrameRef.current = requestAnimationFrame(checkVolume);
          };
          checkVolume();
        }

        setIsMicOn(true);
      } catch (err: any) {
        console.warn('Microphone permission or device error:', err);
        setMicError('Mikrofon tidak terdeteksi atau izin ditolak');
        setIsMicOn(false);
      }
    }
  };

  const handleEnterRoom = () => {
    if (videoStreamRef.current) {
      videoStreamRef.current.getTracks().forEach((t) => t.stop());
      videoStreamRef.current = null;
    }
    if (audioStreamRef.current) {
      audioStreamRef.current.getTracks().forEach((t) => t.stop());
      audioStreamRef.current = null;
    }
    onEnterRoom(room, isMicOn, isCamOn);
  };

  const handleBackToDashboard = () => {
    if (videoStreamRef.current) {
      videoStreamRef.current.getTracks().forEach((t) => t.stop());
      videoStreamRef.current = null;
    }
    if (audioStreamRef.current) {
      audioStreamRef.current.getTracks().forEach((t) => t.stop());
      audioStreamRef.current = null;
    }
    onBackToDashboard();
  };

  return (
    <div className="w-full h-full overflow-y-auto bg-sand/30 text-ink select-none flex flex-col">
      {/* Top Header */}
      <header className="flex-shrink-0 flex items-center justify-between px-6 py-3.5 bg-cream border-b border-[#d1c7b5] sticky top-0 z-30 shadow-xs">
        <button
          type="button"
          onClick={handleBackToDashboard}
          className="flex items-center gap-2 text-xs font-bold text-ink hover:text-teal transition-colors cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Kembali ke Dashboard</span>
        </button>

        <div className="flex items-center gap-2 text-xs font-mono text-ink-muted">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
          <span>Lobby Aktif · {room.name}</span>
        </div>
      </header>

      {/* Main Lobby Content */}
      <main className="max-w-4xl w-full mx-auto p-4 sm:p-6 my-auto space-y-6">
        {/* Room Header Banner */}
        <div className="bg-cream border-2 border-[#b5aa94] rounded-2xl p-6 shadow-sm space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <span className="text-xs font-bold text-teal uppercase tracking-wider bg-sand px-2.5 py-1 rounded-md border border-[#c4b8a1]">
              {room.zone}
            </span>
            <div className="flex items-center gap-2 text-xs text-ink font-semibold">
              <Users className="w-4 h-4 text-teal" />
              <span>
                {room.activeCount} / {room.capacity} Peserta Aktif
              </span>
            </div>
          </div>

          <h1 className="text-2xl sm:text-3xl font-black text-ink font-serif tracking-tight">
            {room.name}
          </h1>

          <p className="text-xs sm:text-sm text-ink-muted leading-relaxed max-w-2xl">
            {room.description}
          </p>
        </div>

        {/* Dual Card Grid: Character Preview + Device Check & Room Members */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Left: Your Avatar / Live Camera Preview & Device Checks */}
          <div className="bg-cream border-2 border-[#b5aa94] rounded-2xl p-5 shadow-sm space-y-4 flex flex-col items-center">
            <div className="w-full flex items-center justify-between border-b border-[#d1c7b5] pb-2">
              <span className="text-xs font-bold text-ink flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-teal" />
                <span>Uji Perangkat (Kamera & Audio)</span>
              </span>
            </div>

            {/* Video Preview Box: Live Webcam vs 2D Pixel Character */}
            <div className="relative w-full max-w-[280px] h-[210px] rounded-xl bg-sand/40 border-2 border-[#b5aa94] overflow-hidden flex items-center justify-center shadow-inner my-1">
              {isCamOn ? (
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  muted
                  className="w-full h-full object-cover scale-x-[-1]"
                />
              ) : (
                <CharacterCanvasPreview
                  config={characterConfig}
                  direction={previewDirection}
                  onChangeDirection={setPreviewDirection}
                  zoom={2.7}
                  className="my-1"
                />
              )}

              {/* Status Badge */}
              <div className="absolute top-2 left-2 z-10">
                {isCamOn ? (
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-700 text-soft flex items-center gap-1 shadow-2xs">
                    <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
                    Live Webcam
                  </span>
                ) : (
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-cream/90 text-teal border border-teal/30 shadow-2xs">
                    Avatar 2D
                  </span>
                )}
              </div>
            </div>

            <div className="text-center">
              <span className="font-bold text-xs block text-ink">
                {currentUser?.fullName || characterConfig.name}
              </span>
              <span className="text-[10px] text-teal block font-semibold">
                {currentUser?.role || 'Staff Pengembang'}
              </span>
            </div>

            {/* Hardware Error Alerts if any */}
            {(camError || micError) && (
              <div className="w-full p-2.5 rounded-lg bg-amber-50 border border-amber-300 text-[11px] text-amber-900 space-y-1">
                {camError && <p>📷 {camError}</p>}
                {micError && <p>🎤 {micError}</p>}
              </div>
            )}

            {/* Device Control Toggles */}
            <div className="w-full pt-3 border-t border-[#d1c7b5] space-y-2.5">
              <div className="flex items-center justify-center gap-3">
                <button
                  type="button"
                  onClick={toggleMic}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-semibold transition-all shadow-2xs cursor-pointer ${
                    isMicOn
                      ? 'bg-teal text-soft border-teal shadow-xs'
                      : 'bg-sand text-ink border-[#b5aa94] hover:bg-[#d8ccb8]'
                  }`}
                  title="Uji Mikrofon"
                >
                  {isMicOn ? <Mic className="w-3.5 h-3.5 text-emerald-300" /> : <MicOff className="w-3.5 h-3.5" />}
                  <span>{isMicOn ? 'Mic Aktif' : 'Mic Bisu'}</span>
                </button>

                <button
                  type="button"
                  onClick={toggleCam}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-semibold transition-all shadow-2xs cursor-pointer ${
                    isCamOn
                      ? 'bg-teal text-soft border-teal shadow-xs'
                      : 'bg-sand text-ink border-[#b5aa94] hover:bg-[#d8ccb8]'
                  }`}
                  title="Uji Webcam"
                >
                  {isCamOn ? <Video className="w-3.5 h-3.5 text-emerald-300" /> : <VideoOff className="w-3.5 h-3.5" />}
                  <span>{isCamOn ? 'Kamera Aktif' : 'Kamera Mati'}</span>
                </button>
              </div>

              {/* Live Audio Level Meter when Mic is Active */}
              {isMicOn && (
                <div className="p-2.5 rounded-lg bg-sand/50 border border-[#d1c7b5] space-y-1.5 animate-in fade-in duration-150">
                  <div className="flex items-center text-[10px] text-ink-muted font-medium">
                    <span className="flex items-center gap-1.5 text-teal font-semibold">
                      <Volume2 className="w-3.5 h-3.5 text-emerald-600" />
                      Uji Suara Mikrofon (Volume Masukan):
                    </span>
                  </div>
                  <div className="w-full h-2 rounded-full bg-cream border border-[#c4b8a1] overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-emerald-500 to-teal transition-all duration-75 rounded-full"
                      style={{ width: `${Math.max(5, audioLevel)}%` }}
                    />
                  </div>
                  <p className="text-[9.5px] text-ink-muted text-center italic">
                    Bicara ke mikrofon Anda untuk melihat bar suara merespons secara real-time
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Right: Active Participants in this room & Entry CTA */}
          <div className="bg-cream border-2 border-[#b5aa94] rounded-2xl p-5 shadow-sm space-y-4 flex flex-col justify-between">
            <div className="space-y-3">
              <div className="flex items-center justify-between border-b border-[#d1c7b5] pb-2">
                <span className="text-xs font-bold text-ink flex items-center gap-1.5">
                  <Users className="w-4 h-4 text-teal" />
                  <span>Daftar Rekan Kerja di Ruangan Ini</span>
                </span>
                <span className="text-[10px] font-mono text-emerald-700 font-bold">
                  {room.npcs.length} Orang
                </span>
              </div>

              <div className="space-y-2">
                {room.npcs.map((npcName, idx) => (
                  <div
                    key={idx}
                    className="p-2.5 rounded-xl bg-sand/40 border border-[#d1c7b5] flex items-center justify-between text-xs"
                  >
                    <div className="flex items-center gap-2.5">
                      <div className="w-7 h-7 rounded-full bg-teal/20 border border-teal text-teal flex items-center justify-center font-bold text-xs">
                        {npcName.charAt(0)}
                      </div>
                      <div>
                        <span className="font-bold text-ink block">{npcName}</span>
                        <span className="text-[10px] text-ink-muted">Siap diajak berinteraksi [E]</span>
                      </div>
                    </div>

                    <span className="w-2 h-2 rounded-full bg-emerald-500 shadow-xs" title="Online" />
                  </div>
                ))}
              </div>
            </div>

            {/* Launch CTA */}
            <div className="pt-4 border-t border-[#d1c7b5] space-y-2">
              <button
                type="button"
                onClick={handleEnterRoom}
                className="w-full py-3.5 px-4 rounded-xl bg-teal hover:bg-teal-dark text-soft font-bold text-sm transition-all shadow-md hover:shadow-lg flex items-center justify-center gap-2 transform hover:-translate-y-0.5 cursor-pointer"
              >
                <Play className="w-4 h-4 fill-current" />
                <span>Masuk ke Ruangan Ini (Kantor 2D)</span>
              </button>

              <button
                type="button"
                onClick={handleBackToDashboard}
                className="w-full py-2 px-3 rounded-lg border border-[#d1c7b5] bg-cream hover:bg-sand text-xs font-semibold text-ink-muted hover:text-ink transition-colors text-center cursor-pointer"
              >
                Pilih Ruangan Lain
              </button>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};
