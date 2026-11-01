import React, { useEffect, useRef } from 'react';
import { OfficeTask } from '../../types/conversation';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  tasks: OfficeTask[];
  onSelectTask: (scenarioId: string) => void;
}

export const TodoListModal: React.FC<Props> = ({
  isOpen,
  onClose,
  tasks = [],
  onSelectTask,
}) => {
  const dialogRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isOpen) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handler);
    dialogRef.current?.focus();
    return () => document.removeEventListener('keydown', handler);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const safeTasks = Array.isArray(tasks) ? tasks : [];
  const done = safeTasks.filter((t) => t.completed).length;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/65 p-3 sm:p-4 animate-in fade-in duration-150">
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-label="Papan tugas kantor"
        tabIndex={-1}
        className="w-full max-w-lg bg-cream border-2 border-wood rounded-lg shadow-xl flex flex-col max-h-[85vh] overflow-hidden select-none"
      >
        {/* Board Header */}
        <div className="flex items-center justify-between px-4 py-3 bg-wood text-soft border-b border-wood-dark flex-shrink-0">
          <div>
            <h2 className="text-sm font-bold tracking-tight">Papan Agenda Kerja Kantor</h2>
            <p className="text-[11px] text-soft/80">
              Lokasi: Dinding Koridor Tengah · Status: {done} dari {safeTasks.length} selesai
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Tutup Papan Agenda"
            className="text-soft/80 hover:text-soft text-lg leading-none px-1.5 py-0.5 rounded transition-colors cursor-pointer"
          >
            ✕
          </button>
        </div>

        {/* Task Cards */}
        <div className="p-4 space-y-2.5 overflow-y-auto flex-1 bg-parchment/60">
          <p className="text-xs text-ink-muted">
            Pilih tugas untuk langsung berlatih, atau hampiri karakter yang bersangkutan di denah kantor:
          </p>

          {safeTasks.map((task) => (
            <div
              key={task.id}
              className={`p-3.5 rounded border transition-colors flex items-start justify-between gap-3 ${
                task.completed
                  ? 'bg-sage/15 border-sage/40'
                  : 'bg-cream border-sand hover:border-wood'
              }`}
            >
              <div className="space-y-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <h3
                    className={`text-sm font-bold ${
                      task.completed ? 'line-through text-ink-muted' : 'text-ink'
                    }`}
                  >
                    {task.title}
                  </h3>
                  <span className="text-[10px] px-2 py-0.5 rounded font-medium bg-sand text-ink border border-muted/20">
                    {task.npc}
                  </span>
                </div>
                <p className="text-xs text-ink-muted">{task.zone}</p>
                <p className="text-xs text-ink">
                  <strong className="text-teal">Fokus:</strong> {task.skill}
                </p>
              </div>

              <button
                type="button"
                onClick={() => {
                  onSelectTask(task.scenarioId);
                  onClose();
                }}
                className="px-3 py-1.5 text-xs font-semibold rounded bg-teal text-soft hover:bg-teal-dark transition-colors flex-shrink-0 cursor-pointer shadow-xs"
              >
                {task.completed ? 'Latih Ulang' : 'Mulai'}
              </button>
            </div>
          ))}
        </div>

        {/* Footer */}
        <div className="px-4 py-2.5 bg-cream border-t border-sand text-xs text-ink-muted flex justify-between items-center flex-shrink-0">
          <span>Di mode 2D, hampiri karakter dan tekan [E].</span>
          <button
            type="button"
            onClick={onClose}
            className="px-3 py-1 rounded border border-muted/30 bg-sand text-ink font-medium hover:bg-cream transition-colors cursor-pointer shadow-2xs"
          >
            Tutup Papan
          </button>
        </div>
      </div>
    </div>
  );
};
