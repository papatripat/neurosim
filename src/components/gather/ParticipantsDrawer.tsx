import React from 'react';
import { X, MessageSquare, MapPin } from 'lucide-react';

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
}

export const ParticipantsDrawer: React.FC<Props> = ({
  isOpen,
  onClose,
  participants,
  onStartScenario,
}) => {
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
          <p className="text-[11px] text-soft/80">{participants.length} orang aktif saat ini</p>
        </div>
        <button
          type="button"
          onClick={onClose}
          aria-label="Tutup Panel"
          className="p-1 hover:bg-teal-dark rounded text-soft text-lg leading-none"
        >
          <X className="w-4 h-4" />
        </button>
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
                className="px-2 py-1 text-[11px] font-semibold bg-teal text-soft rounded hover:bg-teal-dark transition-colors flex items-center gap-1 flex-shrink-0"
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

