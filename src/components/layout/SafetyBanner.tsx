import React from 'react';

interface Props {
  onLearnMore?: () => void;
}

export const SafetyBanner: React.FC<Props> = () => (
  <aside
    aria-label="Pemberitahuan keselamatan dan privasi"
    className="app-safety-banner bg-teal text-soft px-3 sm:px-4 py-1.5 text-xs flex items-center justify-between gap-2 border-b border-teal-dark flex-shrink-0 select-none overflow-hidden"
  >
    <div className="flex items-center gap-2 min-w-0">
      <span className="w-2 h-2 rounded-full bg-brass flex-shrink-0" aria-hidden="true" />
      <p className="leading-tight truncate sm:whitespace-normal">
        <strong className="font-semibold text-soft">Ruang Latihan Mandiri:</strong>{' '}
        <span className="hidden md:inline">Simulasi interaksi kerja profesional yang aman dan adaptif.</span> Seluruh data sesi latihan tersimpan privat di perambanmu.
      </p>
    </div>
  </aside>
);
