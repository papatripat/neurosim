import React from 'react';

interface Props {
  onLearnMore?: () => void;
}

export const SafetyBanner: React.FC<Props> = ({ onLearnMore }) => (
  <aside
    aria-label="Pemberitahuan keselamatan dan privasi"
    className="app-safety-banner bg-teal text-soft px-3 sm:px-4 py-1.5 text-xs flex items-center justify-between gap-2 border-b border-teal-dark flex-shrink-0 select-none overflow-hidden"
  >
    <div className="flex items-center gap-2 min-w-0">
      <span className="w-2 h-2 rounded-full bg-brass flex-shrink-0" aria-hidden="true" />
      <p className="leading-tight truncate sm:whitespace-normal">
        <strong className="font-semibold text-soft">Ruang Latihan Privat:</strong>{' '}
        <span className="hidden md:inline">NeuroSim adalah simulator komunikasi mandiri, bukan alat diagnosis klinis.</span> Data percakapan hanya disimpan di perambanmu.
      </p>
    </div>

    {onLearnMore && (
      <button
        type="button"
        onClick={onLearnMore}
        className="underline text-brass hover:text-white transition-colors text-xs font-medium flex-shrink-0 ml-2 whitespace-nowrap"
      >
        Dokumen Proposal
      </button>
    )}
  </aside>
);
