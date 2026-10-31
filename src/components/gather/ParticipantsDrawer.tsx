import React, { useState } from 'react';
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

  if (!isOpen) return null;

  const roomName = currentRoom?.name || 'Kantor Pusat NeuroSim';
  const roomCode = currentRoom?.code || 'NEURO-HQ-88';
  const activeCount = currentRoom?.activeCount ?? 6;
  const capacity = currentRoom?.capacity ?? 30;

  const roomShareUrl = typeof window !== 'undefined'
    ? `${window.location.origin}/?room=${roomCode}`
    : `https://neurosim.app/?room=${roomCode}`;

  const handleCopyLink = () => {
    navigator.clipboard.writeText(roomShareUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <aside
      aria-label="Panel Rekan di Kantor"
      className="absolute top-0 right-0 h-full w-80 max-w-[90vw] bg-cream border-l-2 border-teal shadow-2xl z-40 flex flex-col animate-in slide-in-from-right duration-200"
    >
      {/* Drawer Header */}
      <div className="flex items-center justify-between px-4 py-3 bg-teal text-soft border-b border-teal-dark">
        <div>
          <h2 className="font-bold text-sm">Rekan di Kantor</h2>
          <p className="text-[11px] text-soft/80">{participants.length} orang aktif di sekitar</p>
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
                {activeCount}/{capacity} Anggota
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

      {/* Participants List */}
      <div className="flex-1 overflow-y-auto p-3 space-y-2 bg-parchment/60">
        {participants.map((person) => (
          <div
            key={person.id}
            className="p-2.5 rounded border border-sand bg-cream hover:border-teal/50 transition-colors flex items-center justify-between gap-2"
          >
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="relative w-8 h-8 rounded border border-teal overflow-hidden bg-parchment flex-shrink-0">
                <img
                  src={person.portrait}
                  alt={person.name}
                  className="w-full h-full object-contain scale-[1.7] pixelated"
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

            {person.isNPC && person.scenarioId && (
              <button
                type="button"
                onClick={() => {
                  onStartScenario(person.scenarioId!);
                  onClose();
                }}
                title={`Bicara dengan ${person.name}`}
                className="px-2 py-1 text-[11px] font-semibold bg-teal text-soft rounded hover:bg-teal-dark transition-colors flex items-center gap-1 flex-shrink-0 cursor-pointer"
              >
                <MessageSquare className="w-3 h-3" />
                <span>Simulasi</span>
              </button>
            )}
          </div>
        ))}
      </div>

      {/* Drawer Footer */}
      <div className="p-3 bg-cream border-t border-sand text-xs text-ink-muted text-center">
        Dekati rekan kerja di kantor 2D untuk interaksi jarak dekat.
      </div>
    </aside>
  );
};
