import React, { useState } from 'react';
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
  CheckCircle2,
  Sparkles,
  Compass,
} from 'lucide-react';
import { OfficeRoom } from './DashboardView';
import { UserProfile } from '../modals/AuthModal';
import { CharacterCustomization } from '../../types/character';
import { CharacterCanvasPreview } from '../character/CharacterCanvasPreview';

interface Props {
  room: OfficeRoom;
  currentUser: UserProfile | null;
  characterConfig: CharacterCustomization;
  onEnterRoom: (room: OfficeRoom) => void;
  onBackToDashboard: () => void;
}

export const RoomLobbyView: React.FC<Props> = ({
  room,
  currentUser,
  characterConfig,
  onEnterRoom,
  onBackToDashboard,
}) => {
  const [isMicOn, setIsMicOn] = useState(false);
  const [isCamOn, setIsCamOn] = useState(false);

  return (
    <div className="w-full h-full overflow-y-auto bg-sand/30 text-ink select-none flex flex-col">
      {/* Top Header */}
      <header className="flex-shrink-0 flex items-center justify-between px-6 py-3.5 bg-cream border-b border-[#d1c7b5] sticky top-0 z-30 shadow-xs">
        <button
          type="button"
          onClick={onBackToDashboard}
          className="flex items-center gap-2 text-xs font-bold text-ink hover:text-teal transition-colors"
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
          {/* Left: Your Avatar Preview & Device Checks */}
          <div className="bg-cream border-2 border-[#b5aa94] rounded-2xl p-5 shadow-sm space-y-4 flex flex-col items-center">
            <span className="text-xs font-bold text-ink self-start flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-teal" />
              <span>Persiapan Masuk Ruangan</span>
            </span>

            <CharacterCanvasPreview
              config={characterConfig}
              direction="south"
              zoom={2.7}
              className="my-1"
            />

            <div className="text-center">
              <span className="font-bold text-xs block text-ink">
                {currentUser?.fullName || characterConfig.name}
              </span>
              <span className="text-[10px] text-teal block font-semibold">
                {currentUser?.role || 'Staff Pengembang'}
              </span>
            </div>

            {/* Quick Audio & Video Toggle Check */}
            <div className="w-full pt-3 border-t border-[#d1c7b5] flex items-center justify-center gap-3">
              <button
                type="button"
                onClick={() => setIsMicOn((m) => !m)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-semibold transition-colors ${
                  isMicOn
                    ? 'bg-teal text-soft border-teal'
                    : 'bg-sand text-ink border-[#b5aa94] hover:bg-[#d8ccb8]'
                }`}
                title="Cek Mikrofon"
              >
                {isMicOn ? <Mic className="w-3.5 h-3.5" /> : <MicOff className="w-3.5 h-3.5" />}
                <span>{isMicOn ? 'Mic Aktif' : 'Mic Bisu'}</span>
              </button>

              <button
                type="button"
                onClick={() => setIsCamOn((c) => !c)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-semibold transition-colors ${
                  isCamOn
                    ? 'bg-teal text-soft border-teal'
                    : 'bg-sand text-ink border-[#b5aa94] hover:bg-[#d8ccb8]'
                }`}
                title="Cek Webcam"
              >
                {isCamOn ? <Video className="w-3.5 h-3.5" /> : <VideoOff className="w-3.5 h-3.5" />}
                <span>{isCamOn ? 'Kamera Aktif' : 'Kamera Mati'}</span>
              </button>
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
                onClick={() => onEnterRoom(room)}
                className="w-full py-3.5 px-4 rounded-xl bg-teal hover:bg-teal-dark text-soft font-bold text-sm transition-all shadow-md hover:shadow-lg flex items-center justify-center gap-2 transform hover:-translate-y-0.5"
              >
                <Play className="w-4 h-4 fill-current" />
                <span>Masuk ke Ruangan Ini (Kantor 2D)</span>
              </button>

              <button
                type="button"
                onClick={onBackToDashboard}
                className="w-full py-2 px-3 rounded-lg border border-[#d1c7b5] bg-cream hover:bg-sand text-xs font-semibold text-ink-muted hover:text-ink transition-colors text-center"
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
