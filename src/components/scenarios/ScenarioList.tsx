import React, { useState } from 'react';
import { ScenarioItem } from '../../types/conversation';

interface Props {
  scenarios: ScenarioItem[];
  onStartScenario: (scenarioId: string, level: 1 | 2 | 3, userGoal: string) => void;
}

export const ScenarioList: React.FC<Props> = ({ scenarios, onStartScenario }) => {
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

  return (
    <div className="w-full max-w-5xl mx-auto p-4 sm:p-6 space-y-6">
      {/* Section Header */}
      <div className="border-b border-[#d1c7b5] pb-3">
        <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-ink">
          Daftar Skenario Latihan Mandiri
        </h2>
        <p className="text-xs sm:text-sm text-ink-muted mt-0.5">
          Pilih skenario yang relevan dengan kebutuhanmu. Kamu bebas menentukan sasaran latihan dan tingkat kompleksitasnya.
        </p>
      </div>

      {/* 3 Case Dossiers */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {scenarios.map((sc) => {
          const currentLevel = selectedLevels[sc.id] || 2;
          const currentGoal = selectedGoals[sc.id] || sc.defaultGoal;

          return (
            <div
              key={sc.id}
              className="bg-cream border-2 border-teal rounded-lg shadow-sm flex flex-col justify-between overflow-hidden"
            >
              <div>
                {/* Dossier Header */}
                <div className="p-3.5 bg-teal text-soft flex items-center gap-3 border-b border-teal-dark">
                  <div className="w-11 h-11 rounded border border-soft/50 overflow-hidden bg-cream flex-shrink-0">
                    <img
                      src={sc.portrait}
                      alt={sc.name}
                      className="w-full h-full object-contain scale-[1.7] pixelated"
                    />
                  </div>
                  <div>
                    <h3 className="font-bold text-sm leading-tight text-soft">{sc.name}</h3>
                    <p className="text-[11px] text-soft/80">{sc.role}</p>
                    <span className="text-[10px] text-soft/70 block mt-0.5 font-mono">{sc.zone}</span>
                  </div>
                </div>

                {/* Content Area */}
                <div className="p-4 space-y-3.5 text-xs text-ink">
                  <div className="p-2.5 bg-sand rounded text-ink leading-relaxed border border-muted/20">
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
                      className="w-full p-2 bg-soft border border-muted/30 rounded text-xs text-ink focus:outline-none focus:ring-1 focus:ring-teal"
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
                      {[1, 2, 3].map((lvl) => (
                        <button
                          key={lvl}
                          type="button"
                          onClick={() =>
                            setSelectedLevels((prev) => ({ ...prev, [sc.id]: lvl as 1 | 2 | 3 }))
                          }
                          className={`py-1 text-xs rounded border transition-colors ${
                            currentLevel === lvl
                              ? 'bg-teal text-soft border-teal font-semibold'
                              : 'bg-soft border-muted/30 text-ink hover:bg-sand'
                          }`}
                        >
                          Level {lvl}
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
                  className="w-full py-2 bg-teal text-soft text-xs font-semibold rounded hover:bg-teal-dark transition-colors"
                >
                  Mulai Simulasi Kasus
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
