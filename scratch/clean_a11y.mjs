import fs from 'fs';
import path from 'path';

const headerPath = path.resolve('src/components/layout/Header.tsx');
let content = fs.readFileSync(headerPath, 'utf-8');

// Optional props
content = content.replace(
  '  reduceMotion: boolean;\n  onToggleReduceMotion: () => void;',
  '  reduceMotion?: boolean;\n  onToggleReduceMotion?: () => void;'
).replace(
  '  reduceMotion: boolean;\r\n  onToggleReduceMotion: () => void;',
  '  reduceMotion?: boolean;\r\n  onToggleReduceMotion?: () => void;'
);

// Call to AccessibilityControls
content = content.replace(
  `        <AccessibilityControls\r\n          reduceMotion={reduceMotion}\r\n          onToggleReduceMotion={onToggleReduceMotion}\r\n          textScale={textScale}`,
  `        <AccessibilityControls\r\n          textScale={textScale}`
).replace(
  `        <AccessibilityControls\n          reduceMotion={reduceMotion}\n          onToggleReduceMotion={onToggleReduceMotion}\n          textScale={textScale}`,
  `        <AccessibilityControls\n          textScale={textScale}`
);

fs.writeFileSync(headerPath, content, 'utf-8');
console.log('Cleaned AccessibilityControls call in Header.tsx');

