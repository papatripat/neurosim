import React from 'react';

interface Props {
  onLearnMore?: () => void;
}

export const SafetyBanner: React.FC<Props> = ({ onLearnMore }) => (
  <aside
    aria-label="Pemberitahuan keselamatan dan privasi"
    className="bg-teal text-soft px-4 py-2 text-xs flex flex-wrap items-center justify-between gap-3 border-b border-teal-dark"
  >
    <div className="flex items-center gap-2">
      <span className="w-2 h-2 rounded-full bg-brass flex-shrink-0" aria-hidden="true" />
      <p className="leading-tight">
        <strong className="font-semibold text-soft">Ruang Latihan Privat:</strong> NeuroSim adalah simulator komunikasi mandiri, bukan alat diagnosis klinis. Data percakapan hanya disimpan di perambanmu.
      </p>
    </div>

    {onLearnMore && (
      <button
        type="button"
        onClick={onLearnMore}
        className="underline text-brass hover:text-white transition-colors text-xs font-medium ml-auto sm:ml-0"
      >
        Pelajari Dokumen Proposal
      </button>
    )}
  </aside>
);
