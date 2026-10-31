import fs from 'fs';
import path from 'path';

// 1. Update Header.tsx
const headerPath = path.resolve('src/components/layout/Header.tsx');
let headerContent = fs.readFileSync(headerPath, 'utf-8');

// Change import
headerContent = headerContent.replace(
  "import { User, ClipboardList, LayoutDashboard, Shirt } from 'lucide-react';",
  "import { User, ClipboardList, LayoutDashboard } from 'lucide-react';"
);

// Subtitle
headerContent = headerContent.replace(
  `<p className="text-[10.5px] text-ink-muted leading-tight font-medium hidden sm:block">\r\n              Komunikasi Kerja Online\r\n            </p>`,
  `<p className="text-[10.5px] text-ink-muted leading-tight font-medium hidden sm:block">\r\n              Virtual Office AI Simulator\r\n            </p>`
);
// Also fallback if LF
headerContent = headerContent.replace(
  `<p className="text-[10.5px] text-ink-muted leading-tight font-medium hidden sm:block">\n              Komunikasi Kerja Online\n            </p>`,
  `<p className="text-[10.5px] text-ink-muted leading-tight font-medium hidden sm:block">\n              Virtual Office AI Simulator\n            </p>`
);

// Remove Character button
const charBtnRegex = /\{\/\* Character Customizer Shortcut \*\/\}[\s\S]*?\{\/\* Agenda Button \*\/\}/;
headerContent = headerContent.replace(charBtnRegex, '{/* Agenda Button */}');

// Remove Proposal Dossier button
const proposalBtnRegex = /\{\/\* Proposal Dossier Button \*\/\}[\s\S]*?<\/button>\s*<\/div>/;
headerContent = headerContent.replace(proposalBtnRegex, '</div>');

fs.writeFileSync(headerPath, headerContent, 'utf-8');
console.log('Header.tsx updated successfully');

// 2. Update SafetyBanner.tsx
const safetyPath = path.resolve('src/components/layout/SafetyBanner.tsx');
const safetyContent = `import React from 'react';

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
`;
fs.writeFileSync(safetyPath, safetyContent, 'utf-8');
console.log('SafetyBanner.tsx updated successfully');

// 3. Update A11yControls.tsx
const a11yPath = path.resolve('src/components/ui/A11yControls.tsx');
let a11yContent = fs.readFileSync(a11yPath, 'utf-8');

a11yContent = a11yContent.replace(
  `{reduceMotion ? 'Animasi: Min' : 'Animasi'}`,
  `{reduceMotion ? 'Gerak: Redam' : 'Kurangi Gerak'}`
);

a11yContent = a11yContent.replace(
  `title="Kurangi Animasi (Reduce Motion)"`,
  `title="Kurangi Animasi & Transisi Visual (Aksesibilitas Sensorik)"`
);

fs.writeFileSync(a11yPath, a11yContent, 'utf-8');
console.log('A11yControls.tsx updated successfully');

