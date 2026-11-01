import React, { useState } from 'react';
import { ScenarioItem, OfficeTask } from '../../types/conversation';
import { CheckCircle2, Play } from 'lucide-react';

interface Props {
  scenarios: ScenarioItem[];
  tasks?: OfficeTask[];
  onStartScenario: (scenarioId: string, level: 1 | 2 | 3, userGoal: string) => void;
}

export const ScenarioList: React.FC<Props> = ({ scenarios, tasks = [], onStartScenario }) => {
  const [selectedLevels, setSelectedLevels] = useState<Record<string, 1 | 2 | 3>>({
    'skenario-1': 2,
    'skenario-2': 2,
    'skenario-3': 2,
  });

  const [selectedGoals, setSelectedGoals] = useState<Record<string, string>>({
    'skenario-1': 'Mendapat kejelasan instruksi spesifik',
    'skenario-2': 'Menanyakan maksud dan meminta contoh konkret',
    'skenario-3': 'Menetapkan batas jam kerja & negosiasi tenggat realistis',
  });

  const completedCount = tasks.filter((t) => t.completed).length;

  return (
    <div className="w-full max-w-5xl mx-auto p-4 sm:p-6 space-y-6">
      {/* Section Header */}
      <div className="border-b border-[#d1c7b5] pb-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-ink font-serif">
            Daftar Skenario Latihan Mandiri
          </h2>
          <p className="text-xs sm:text-sm text-ink-muted mt-0.5">
            Pilih skenario yang relevan dengan kebutuhanmu. Kamu bebas menentukan sasaran latihan dan tingkat kompleksitasnya.
          </p>
        </div>
        {tasks.length > 0 && (
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-cream border border-[#d1c7b5] self-start sm:self-auto shadow-2xs">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            <span className="text-xs font-bold text-ink">
              Progres Latihan: <span className="text-teal font-mono">{completedCount}/{scenarios.length}</span> Selesai
            </span>
          </div>
        )}
      </div>

      {/* 3 Case Dossiers */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {scenarios.map((sc) => {
          const currentLevel = selectedLevels[sc.id] || 2;
          const currentGoal = selectedGoals[sc.id] || sc.defaultGoal;
          const isCompleted = tasks.some((t) => t.scenarioId === sc.id && t.completed);

          return (
            <div
              key={sc.id}
              className={`bg-cream border-2 ${
                isCompleted ? 'border-emerald-700/60 shadow-sm' : 'border-teal shadow-2xs'
              } rounded-xl flex flex-col justify-between overflow-hidden transition-all`}
            >
              <div>
                {/* Dossier Header */}
                <div className="p-3.5 bg-teal text-soft flex items-center justify-between gap-2.5 border-b border-teal-dark">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="w-12 h-12 rounded-lg border border-soft/50 overflow-hidden bg-cream/90 flex items-center justify-center flex-shrink-0 shadow-2xs">
                      <img
                        src={sc.portrait}
                        alt={sc.name}
                        className="w-full h-full object-contain p-0.5 pixelated"
                      />
                    </div>
                    <div className="min-w-0">
                      <h3 className="font-bold text-sm leading-tight text-soft truncate">{sc.name}</h3>
                      <p className="text-[11px] text-soft/80 truncate">{sc.role}</p>
                      <span className="text-[10px] text-soft/70 block mt-0.5 font-mono truncate">{sc.zone}</span>
                    </div>
                  </div>

                  {isCompleted ? (
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-300 flex items-center gap-1 flex-shrink-0 shadow-2xs">
                      <CheckCircle2 className="w-3 h-3 text-emerald-600" /> Selesai
                    </span>
                  ) : (
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-900 border border-amber-300 flex-shrink-0 shadow-2xs">
                      Tersedia
                    </span>
                  )}
                </div>

                {/* Content Area */}
                <div className="p-4 space-y-3.5 text-xs text-ink">
                  <div className="p-2.5 bg-sand rounded-lg text-ink leading-relaxed border border-muted/20">
                    <span className="font-semibold text-teal block mb-1">Latar Masalah:</span>
                    <p>{sc.context}</p>
                  </div>

                  <div className="space-y-0.5">
                    <span className="font-semibold text-teal block">Fokus Keterampilan:</span>
                    <p className="text-ink font-medium">{sc.targetSkill}</p>
                  </div>

                  {/* Goal Dropdown */}
                  <div className="space-y-1">
                    <label htmlFor={`goal-${sc.id}`} className="font-semibold text-teal block">
                      Tentukan Sasaran Latihan:
                    </label>
                    <select
                      id={`goal-${sc.id}`}
                      value={currentGoal}
                      onChange={(e) =>
                        setSelectedGoals((prev) => ({ ...prev, [sc.id]: e.target.value }))
                      }
                      className="w-full p-2 bg-soft border border-muted/30 rounded-lg text-xs text-ink focus:outline-none focus:ring-1 focus:ring-teal cursor-pointer"
                    >
                      {sc.goals.map((g, idx) => (
                        <option key={idx} value={g}>
                          {g}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Difficulty Level Buttons */}
                  <div className="space-y-1">
                    <span className="font-semibold text-teal block">Tingkat Kesulitan:</span>
                    <div className="grid grid-cols-3 gap-1.5 text-center">
                      {[
                        { lvl: 1, label: 'Level 1', desc: 'Panduan' },
                        { lvl: 2, label: 'Level 2', desc: 'Standar' },
                        { lvl: 3, label: 'Level 3', desc: 'Tantangan' },
                      ].map(({ lvl, label, desc }) => (
                        <button
                          key={lvl}
                          type="button"
                          onClick={() =>
                            setSelectedLevels((prev) => ({ ...prev, [sc.id]: lvl as 1 | 2 | 3 }))
                          }
                          className={`py-1.5 px-1 text-xs rounded-lg border transition-colors cursor-pointer flex flex-col items-center justify-center ${
                            currentLevel === lvl
                              ? 'bg-teal text-soft border-teal font-semibold shadow-2xs'
                              : 'bg-soft border-muted/30 text-ink hover:bg-sand'
                          }`}
                        >
                          <span className="font-bold">{label}</span>
                          <span className={`text-[9.5px] ${currentLevel === lvl ? 'text-soft/80' : 'text-ink-muted'}`}>
                            {desc}
                          </span>
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* Start Button */}
              <div className="p-3 bg-sand border-t border-muted/20">
                <button
                  type="button"
                  onClick={() => onStartScenario(sc.id, currentLevel, currentGoal)}
                  className="w-full py-2.5 bg-teal text-soft text-xs font-bold rounded-lg hover:bg-teal-dark transition-colors flex items-center justify-center gap-1.5 shadow-xs cursor-pointer"
                >
                  <Play className="w-3.5 h-3.5 fill-current" />
                  <span>{isCompleted ? 'Latih Ulang Kasus Ini' : 'Mulai Simulasi Kasus'}</span>
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
