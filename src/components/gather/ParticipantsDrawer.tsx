import React, { useState, useMemo } from 'react';
import { X, MessageSquare, MapPin, Building2, Copy, Check, Radio } from 'lucide-react';
import { OfficeRoom } from '../../types/room';

export interface Participant {
  id: string;
  name: string;
  role: string;
  zone: string;
  status: 'online' | 'busy' | 'pantry';
  isNPC: boolean;
  scenarioId?: string;
  portrait: string;
}

interface Props {
  isOpen: boolean;
  onClose: () => void;
  participants: Participant[];
  onStartScenario: (scenarioId: string) => void;
  currentRoom?: OfficeRoom;
  onOpenRoomModal: () => void;
}

export const ParticipantsDrawer: React.FC<Props> = ({
  isOpen,
  onClose,
  participants,
  onStartScenario,
  currentRoom,
  onOpenRoomModal,
}) => {
  const [copied, setCopied] = useState(false);

  // WAJIB: Panggil semua hooks sebelum early return agar tidak terjadi "Rendered more hooks"
  const simulationNpcs = useMemo(() => participants.filter((p) => p.isNPC), [participants]);
  const colleagues = useMemo(() => participants.filter((p) => !p.isNPC), [participants]);

  const roomName = currentRoom?.name || 'Kantor Pusat NeuroSim';
  const roomCode = currentRoom?.code || 'NEURO-HQ-88';
  const capacity = currentRoom?.capacity ?? 25;
  const humanJoinedCount = Math.max(1, colleagues.length);
  const activeNpcCount = simulationNpcs.length;
  const totalInOffice = humanJoinedCount + activeNpcCount;

  const getDynamicShareUrl = (): string => {
    if (typeof window !== 'undefined') {
      const origin = window.location.origin;
      const pathname = window.location.pathname.replace(/\/+$/, '');
      return `${origin}${pathname}/?room=${encodeURIComponent(roomCode)}`;
    }
    return `https://neurosim.app/?room=${encodeURIComponent(roomCode)}`;
  };

  const roomShareUrl = getDynamicShareUrl();

  const handleCopyLink = () => {
    navigator.clipboard.writeText(roomShareUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Early return setelah seluruh hooks selesai dipanggil
  if (!isOpen) return null;

  return (
    <aside
      aria-label="Panel Rekan di Kantor"
      className="absolute top-0 right-0 h-full w-80 max-w-[90vw] bg-cream border-l-2 border-teal shadow-2xl z-40 flex flex-col animate-in slide-in-from-right duration-200"
    >
      {/* Drawer Header */}
      <div className="flex items-center justify-between px-4 py-3 bg-teal text-soft border-b border-teal-dark">
        <div>
          <h2 className="font-bold text-sm">Rekan di Kantor</h2>
          <p className="text-[11px] text-soft/80">{totalInOffice} orang di kantor virtual ({humanJoinedCount} Rekan + {activeNpcCount} Karakter AI)</p>
        </div>
        <button
          type="button"
          onClick={onClose}
          aria-label="Tutup Panel"
          className="p-1 hover:bg-teal-dark rounded text-soft text-lg leading-none cursor-pointer"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Online Room Info Banner */}
      <div className="p-3 bg-sand border-b border-[#d1c7b5] flex flex-col gap-2">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <div className="flex items-center gap-1.5 text-[10.5px] font-bold text-teal uppercase tracking-wider">
              <Building2 className="w-3.5 h-3.5 flex-shrink-0" />
              <span className="truncate">Ruang Kantor Aktif</span>
            </div>
            <h3 className="text-xs font-bold text-ink truncate mt-0.5" title={roomName}>
              {roomName}
            </h3>
            <div className="text-[10px] text-ink-muted flex items-center gap-1.5 mt-0.5 flex-wrap">
              <span>Kode:</span>
              <span className="font-mono font-bold text-wood-dark bg-cream px-1.5 py-0.2 rounded border border-muted/30">
                {roomCode}
              </span>
              <span>•</span>
              <span className="text-emerald-700 font-semibold">
                {humanJoinedCount}/{capacity} Rekan Aktif
              </span>
            </div>
          </div>
        </div>

        {/* Quick Action Buttons */}
        <div className="flex items-center gap-1.5 pt-1">
          <button
            type="button"
            onClick={handleCopyLink}
            title="Salin tautan undangan ruang ini"
            className="flex-1 py-1 px-2 text-[11px] font-medium rounded bg-cream hover:bg-parchment border border-muted/30 text-ink transition-colors flex items-center justify-center gap-1 cursor-pointer"
          >
            {copied ? (
              <>
                <Check className="w-3 h-3 text-emerald-600" />
                <span className="text-emerald-700 font-semibold">Tersalin!</span>
              </>
            ) : (
              <>
                <Copy className="w-3 h-3 text-ink-muted" />
                <span>Salin Link</span>
              </>
            )}
          </button>

          <button
            type="button"
            onClick={onOpenRoomModal}
            title="Buka panel kelola ruang & daftar ruang publik"
            className="py-1 px-2.5 text-[11px] font-semibold rounded bg-teal text-soft hover:bg-teal-dark transition-colors flex items-center gap-1 flex-shrink-0 cursor-pointer"
          >
            <Radio className="w-3 h-3" />
            <span>Kelola Ruang</span>
          </button>
        </div>
      </div>

      {/* Participants List: Simulation NPCs at the top, Colleagues below */}
      <div className="flex-1 overflow-y-auto p-3 space-y-3 bg-parchment/60">
        {/* Group 1: Target Skenario Simulasi Komunikasi (NPCs at Top) */}
        {simulationNpcs.length > 0 && (
          <div className="space-y-1.5">
            <div className="flex items-center justify-between px-1">
              <span className="text-[10.5px] font-bold text-teal uppercase tracking-wider flex items-center gap-1">
                <span>🎯</span> Target Skenario Simulasi
              </span>
              <span className="text-[10px] bg-teal/15 text-teal font-bold px-1.5 py-0.5 rounded">
                {simulationNpcs.length} Karakter AI
              </span>
            </div>

            <div className="space-y-2">
              {simulationNpcs.map((person) => (
                <div
                  key={person.id}
                  className="p-2.5 rounded border border-sand bg-cream hover:border-teal/50 transition-colors flex items-center justify-between gap-2 shadow-2xs"
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="relative w-8 h-8 rounded border border-teal overflow-hidden bg-parchment flex-shrink-0">
                      <img
                        src={person.portrait}
                        alt={person.name}
                        className="w-full h-full object-contain scale-[1.35] origin-center pixelated"
                      />
                      <span
                        className={`absolute bottom-0 right-0 w-2 h-2 rounded-full border border-white ${
                          person.status === 'online'
                            ? 'bg-sage'
                            : person.status === 'busy'
                            ? 'bg-brick'
                            : 'bg-ochre'
                        }`}
                      />
                    </div>

                    <div className="min-w-0">
                      <span className="font-bold text-xs text-ink truncate block">
                        {person.name}
                      </span>
                      <span className="text-[10px] text-ink-muted truncate block">
                        {person.role}
                      </span>
                      <div className="flex items-center gap-1 text-[10px] text-teal mt-0.5">
                        <MapPin className="w-2.5 h-2.5 flex-shrink-0" />
                        <span className="truncate">{person.zone}</span>
                      </div>
                    </div>
                  </div>

                  {person.scenarioId && (
                    <button
                      type="button"
                      onClick={() => {
                        onStartScenario(person.scenarioId!);
                        onClose();
                      }}
                      title={`Mulai simulasi komunikasi dengan ${person.name}`}
                      className="px-2.5 py-1 text-[11px] font-semibold bg-teal text-soft rounded hover:bg-teal-dark transition-colors flex items-center gap-1 flex-shrink-0 cursor-pointer shadow-2xs"
                    >
                      <MessageSquare className="w-3 h-3" />
                      <span>Simulasi</span>
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Group 2: Rekan Kerja di Ruangan */}
        {colleagues.length > 0 && (
          <div className="space-y-1.5 pt-1">
            <div className="flex items-center justify-between px-1">
              <span className="text-[10.5px] font-bold text-ink-muted uppercase tracking-wider flex items-center gap-1">
                <span>👥</span> Rekan Tim di Kantor
              </span>
              <span className="text-[10px] bg-sand text-ink font-semibold px-1.5 py-0.5 rounded">
                {colleagues.length} Orang
              </span>
            </div>

            <div className="space-y-2">
              {colleagues.map((person) => (
                <div
                  key={person.id}
                  className="p-2.5 rounded border border-sand bg-cream hover:border-teal/50 transition-colors flex items-center justify-between gap-2"
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="relative w-8 h-8 rounded border border-teal overflow-hidden bg-parchment flex-shrink-0">
                      <img
                        src={person.portrait}
                        alt={person.name}
                        className="w-full h-full object-contain scale-[1.35] origin-center pixelated"
                      />
                      <span
                        className={`absolute bottom-0 right-0 w-2 h-2 rounded-full border border-white ${
                          person.status === 'online'
                            ? 'bg-sage'
                            : person.status === 'busy'
                            ? 'bg-brick'
                            : 'bg-ochre'
                        }`}
                      />
                    </div>

                    <div className="min-w-0">
                      <span className="font-bold text-xs text-ink truncate block">
                        {person.name}
                      </span>
                      <span className="text-[10px] text-ink-muted truncate block">
                        {person.role}
                      </span>
                      <div className="flex items-center gap-1 text-[10px] text-teal mt-0.5">
                        <MapPin className="w-2.5 h-2.5 flex-shrink-0" />
                        <span className="truncate">{person.zone}</span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Drawer Footer */}
      <div className="p-3 bg-cream border-t border-sand text-xs text-ink-muted text-center">
        Dekati karakter di kantor 2D untuk memulai latihan interaksi.
      </div>
    </aside>
  );
};
