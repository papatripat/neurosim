# PANDUAN TEKNIS: FRONTEND UI/UX, AKSESIBILITAS & KONTEN SKENARIO
**Penanggung Jawab:** Baginda Putra Krista (didukung Frontend UI & A11y Companion Agent)  
**Tujuan Utama:** Membangun seluruh antarmuka HTML React di atas canvas, panel obrolan ramah sensorik (bebas efek typewriter lambat), tombol kendali wajib (*Jeda, Lewati, Keluar, Petunjuk*), layar rubrik evaluasi 4 dimensi dengan komparasi coba lagi, dan fitur *Dual-Mode UX* (Jelajah 2D vs Daftar Skenario Langsung).

---

## 1. File Tanggung Jawab & Struktur Modul

Baginda bertanggung jawab penuh atas pembuatan dan pemeliharaan file-file berikut:

```
src/
├── components/
│   ├── ModeSwitcher.tsx         --> Pengalih tab: Mode Kantor 2D <--> Mode Daftar Skenario
│   ├── ScenarioList.tsx         --> Tampilan daftar skenario langsung (Jalan pintas Gerbang A)
│   ├── DialogueModal.tsx        --> Panel obrolan chat simulasi dengan NPC (React Overlay)
│   ├── EvaluationModal.tsx      --> Layar rubrik evaluasi 4 dimensi & komparasi coba lagi
│   ├── A11yControls.tsx         --> Pengaturan Reduce Motion, Kontras, & Ukuran Font
│   └── PsychologicalNotice.tsx  --> Banner penafian keselamatan psikologis & bukan alat diagnosis
├── hooks/
│   └── useConversation.ts       --> State management percakapan, turn counter, call API chat/eval
└── types/
    └── conversation.types.ts    --> Tipe data transkrip, giliran, dan hasil evaluasi
```

---

## 2. Palet Warna & Pedoman Aksesibilitas Sensorik

Mengacu pada palet resmi [`environment-palette.gpl`](file:///d:/Project/neurosim/public/assets/maps/environment-palette.gpl) yang tenang dan bebas dari warna neon yang menyilaukan mata:
- **Background Utama:** `#e6dfce` (Warm Sand / Beige)
- **Background Panel/Kartu:** `#f4ead5` (Soft Cream)
- **Aksen Tombol & Border:** `#355c5a` (Deep Slate Teal)
- **Teks Utama:** `#242a38` (Dark Slate Navy - Kontras Rasio 11.2:1 terhadap krem, lolos WCAG AAA)
- **Aksen Umpan Balik:**
  - *Efektif:* `#2b6e4f` (Sage Green)
  - *Berkembang:* `#b87a28` (Warm Ochre)
  - *Perlu Dilatih:* `#94463d` (Terracotta Brick)

### Lokasi Aset UI Terkurasi (`public/assets/`)
- Frame 9-Slice Dialog: `/assets/ui/9-slice/tan.png`
- Tombol Aksi: `/assets/ui/9-slice/blue.png`, `green.png`, `red.png`, `yellow.png`
- Spritesheet Ikon: `/assets/ui/spritesheet.png`
- Potret NPC: `/assets/characters/office-worker/standing/south.png`, `/assets/characters/resident/standing/south.png`, `/assets/characters/courier/standing/south.png` (48×48 px diperbesar 3.5× dengan CSS `image-rendering: pixelated;`)

---

## 3. Komponen Pengalih Dual-Mode (`src/components/ModeSwitcher.tsx`)

> **SAFETY NET GERBANG A & AKSESIBILITAS:** Jika pemain mengalami kelelahan sensorik atau jika canvas 2D terkendala, pengguna bisa beralih ke Mode Teks Langsung dalam 1 klik.

```tsx
import React from 'react';
import { Gamepad2, ListOrdered, Eye } from 'lucide-react';

interface ModeSwitcherProps {
  mode: '2d' | 'list';
  onModeChange: (mode: '2d' | 'list') => void;
  reduceMotion: boolean;
  onToggleReduceMotion: () => void;
}

export const ModeSwitcher: React.FC<ModeSwitcherProps> = ({
  mode,
  onModeChange,
  reduceMotion,
  onToggleReduceMotion
}) => {
  return (
    <header className="flex flex-wrap items-center justify-between p-3 bg-[#f4ead5] border-b border-[#d1c7b5] text-[#242a38]">
      <div className="flex items-center gap-2">
        <h1 className="font-bold text-lg font-serif tracking-tight">NeuroSim</h1>
        <span className="text-xs px-2 py-0.5 rounded bg-[#355c5a] text-[#fff9eb] font-sans">
          Simulator Dinamika Kerja
        </span>
      </div>

      <div className="flex items-center gap-3">
        {/* Toggle Mode Navigasi */}
        <div className="flex rounded-md bg-[#e6dfce] p-0.5 border border-[#a7b7bb]">
          <button
            onClick={() => onModeChange('2d')}
            className={`flex items-center gap-1.5 px-3 py-1 text-xs font-semibold rounded transition ${
              mode === '2d' ? 'bg-[#355c5a] text-[#fff9eb] shadow-sm' : 'text-[#242a38] hover:text-black'
            }`}
          >
            <Gamepad2 className="w-3.5 h-3.5" />
            Jelajah Kantor 2D
          </button>
          <button
            onClick={() => onModeChange('list')}
            className={`flex items-center gap-1.5 px-3 py-1 text-xs font-semibold rounded transition ${
              mode === 'list' ? 'bg-[#355c5a] text-[#fff9eb] shadow-sm' : 'text-[#242a38] hover:text-black'
            }`}
          >
            <ListOrdered className="w-3.5 h-3.5" />
            Daftar Skenario Langsung
          </button>
        </div>

        {/* Tombol Aksesibilitas: Reduce Motion */}
        <button
          onClick={onToggleReduceMotion}
          aria-label="Kurangi Gerakan Animasi"
          className={`flex items-center gap-1 px-2.5 py-1 text-xs rounded border transition ${
            reduceMotion ? 'bg-[#355c5a] text-white border-[#355c5a]' : 'bg-[#fff9eb] border-[#a7b7bb] text-[#242a38]'
          }`}
        >
          <Eye className="w-3.5 h-3.5" />
          {reduceMotion ? 'Kurangi Gerak: Aktif' : 'Kurangi Gerak'}
        </button>
      </div>
    </header>
  );
};
```

---

## 4. Panel Percakapan Chat (`src/components/DialogueModal.tsx`)

> **ATURAN PROPOSAL BAB C & D:**
> 1. Teks muncul **langsung** (bukan efek ketik lambat) agar tidak memicu frustrasi dan tidak mengacaukan *screen reader*.
> 2. Menggunakan sprite berdiri 48×48 diperbesar 3.5× (`image-rendering: pixelated`) untuk potret lawan bicara.
> 3. Tombol **Jeda**, **Lewati**, **Keluar**, dan **Petunjuk** harus selalu tampak dan aktif.
> 4. Batasan maksimal 6 giliran interaksi.

```tsx
import React, { useState } from 'react';
import { Pause, SkipForward, LogOut, HelpCircle, Send } from 'lucide-react';

interface DialogueModalProps {
  scenarioId: string;
  npcName: string;
  portraitSrc: string; // Misal: /modern-rooms-people-unified-v0.2.0/art/characters/office-worker/standing/south.png
  transcript: Array<{ speaker: 'user' | 'character'; text: string }>;
  turnCount: number;
  isLoading: boolean;
  onSendMessage: (text: string) => void;
  onPause: () => void;
  onSkip: () => void;
  onExit: () => void;
  onShowHint: () => void;
}

export const DialogueModal: React.FC<DialogueModalProps> = ({
  npcName,
  portraitSrc,
  transcript,
  turnCount,
  isLoading,
  onSendMessage,
  onPause,
  onSkip,
  onExit,
  onShowHint,
}) => {
  const [inputText, setInputText] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim() || isLoading) return;
    onSendMessage(inputText);
    setInputText('');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-[2px] p-4">
      <div className="w-full max-w-2xl bg-[#f4ead5] border-4 border-[#355c5a] rounded-xl shadow-2xl flex flex-col overflow-hidden">
        
        {/* Header Modal dengan Tombol Kontrol Wajib */}
        <div className="flex items-center justify-between px-4 py-2.5 bg-[#355c5a] text-[#fff9eb]">
          <div className="flex items-center gap-3">
            <span className="font-semibold text-sm">{npcName}</span>
            <span className="text-xs px-2 py-0.5 rounded bg-black/25">
              Giliran: {turnCount} / 6
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button onClick={onShowHint} title="Lihat Petunjuk Strategi" className="p-1 hover:bg-white/20 rounded">
              <HelpCircle className="w-4 h-4" />
            </button>
            <button onClick={onPause} title="Jeda Latihan" className="p-1 hover:bg-white/20 rounded">
              <Pause className="w-4 h-4" />
            </button>
            <button onClick={onSkip} title="Lewati Giliran" className="p-1 hover:bg-white/20 rounded">
              <SkipForward className="w-4 h-4" />
            </button>
            <button onClick={onExit} title="Keluar Simulasi" className="p-1 hover:bg-red-600/80 rounded">
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Area Percakapan */}
        <div className="flex-1 p-4 overflow-y-auto max-h-[360px] space-y-3 bg-[#e6dfce]/40">
          {transcript.map((msg, idx) => (
            <div key={idx} className={`flex items-start gap-3 ${msg.speaker === 'user' ? 'justify-end' : 'justify-start'}`}>
              {msg.speaker === 'character' && (
                <div className="w-12 h-12 rounded border-2 border-[#355c5a] overflow-hidden bg-[#f4ead5] flex-shrink-0">
                  <img 
                    src={portraitSrc} 
                    alt={npcName} 
                    className="w-full h-full object-contain scale-[1.7]"
                    style={{ imageRendering: 'pixelated' }}
                  />
                </div>
              )}

              <div className={`max-w-[75%] p-3 rounded-lg text-sm leading-relaxed ${
                msg.speaker === 'user' 
                  ? 'bg-[#355c5a] text-[#fff9eb] rounded-tr-none' 
                  : 'bg-[#fff9eb] border border-[#d1c7b5] text-[#242a38] rounded-tl-none shadow-sm'
              }`}>
                {msg.text}
              </div>
            </div>
          ))}

          {/* Indikator Mengetik saat menunggu Gemini */}
          {isLoading && (
            <div className="flex items-center gap-2 text-xs text-[#5c6d70] italic">
              <span className="inline-block w-2 h-2 rounded-full bg-[#355c5a] animate-pulse" />
              {npcName} sedang merumuskan jawaban...
            </div>
          )}
        </div>

        {/* Input Text Form */}
        <form onSubmit={handleSubmit} className="p-3 bg-[#f4ead5] border-t border-[#d1c7b5] flex gap-2">
          <input
            type="text"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            disabled={isLoading || turnCount >= 6}
            placeholder={turnCount >= 6 ? "Batas 6 giliran tercapai. Silakan evaluasi." : "Ketik jawabanmu secara bebas dan langsung..."}
            className="flex-1 px-3 py-2 bg-[#fff9eb] border border-[#a7b7bb] rounded-md text-sm text-[#242a38] focus:outline-none focus:ring-2 focus:ring-[#355c5a]"
          />
          <button
            type="submit"
            disabled={isLoading || !inputText.trim() || turnCount >= 6}
            className="px-4 py-2 bg-[#355c5a] text-[#fff9eb] rounded-md text-sm font-semibold hover:bg-[#2c4d4b] transition flex items-center gap-1.5 disabled:opacity-50"
          >
            <Send className="w-3.5 h-3.5" />
            Kirim
          </button>
        </form>
      </div>
    </div>
  );
};
```

---

## 5. Layar Umpan Balik Rubrik 4 Dimensi (`src/components/EvaluationModal.tsx`)

Menampilkan evaluasi kualitatif tanpa angka penghakiman, membongkar *Hidden Intent*, menyajikan 2 alternatif respons, dan menyediakan fitur komparasi coba lagi:

```tsx
import React from 'react';
import { RotateCcw, ArrowRight, CheckCircle2, AlertCircle } from 'lucide-react';
import { FullEvaluationResult } from '../schemas/evaluator.schema';

interface EvaluationModalProps {
  evaluation: FullEvaluationResult;
  onRetry: () => void;
  onNextScenario: () => void;
}

export const EvaluationModal: React.FC<EvaluationModalProps> = ({
  evaluation,
  onRetry,
  onNextScenario
}) => {
  const getBadgeStyle = (tingkat: string) => {
    switch (tingkat) {
      case 'efektif':
        return 'bg-[#2b6e4f] text-white';
      case 'berkembang':
        return 'bg-[#b87a28] text-white';
      default:
        return 'bg-[#94463d] text-white';
    }
  };

  const dimensions = [
    { label: 'Kejelasan Pesan', data: evaluation.kejelasan_pesan },
    { label: 'Pemahaman Konteks', data: evaluation.pemahaman_konteks },
    { label: 'Ketercapaian Tujuan', data: evaluation.ketercapaian_tujuan },
    { label: 'Rasa Hormat & Batasan', data: evaluation.rasa_hormat_dan_batasan },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-[2px] p-4 overflow-y-auto">
      <div className="w-full max-w-2xl bg-[#f4ead5] border-4 border-[#355c5a] rounded-xl shadow-2xl p-6 space-y-6 my-8">
        
        <div className="border-b border-[#d1c7b5] pb-3">
          <h2 className="text-xl font-bold font-serif text-[#242a38]">Hasil Latihan & Umpan Balik Objektif</h2>
          <p className="text-xs text-[#5c6d70] mt-1">
            Penilaian mengacu pada tujuan latihanmu dan tidak memaksakan standar basa-basi neurotipikal.
          </p>
        </div>

        {/* 4 Kartu Rubrik Deskriptif */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {dimensions.map((dim, idx) => (
            <div key={idx} className="p-3 bg-[#fff9eb] border border-[#d1c7b5] rounded-lg space-y-1.5 shadow-sm">
              <div className="flex items-center justify-between">
                <span className="font-semibold text-xs text-[#242a38]">{dim.label}</span>
                <span className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded-full ${getBadgeStyle(dim.data.tingkat)}`}>
                  {dim.data.tingkat}
                </span>
              </div>
              <p className="text-xs text-[#5c6d70] leading-relaxed">{dim.data.alasan}</p>
            </div>
          ))}
        </div>

        {/* Pengungkapan Maksud Tersembunyi (Hidden Intent) */}
        <div className="p-3.5 bg-[#e6dfce] rounded-lg border-l-4 border-[#355c5a] space-y-1">
          <div className="flex items-center gap-1.5 text-xs font-bold text-[#355c5a]">
            <CheckCircle2 className="w-4 h-4" />
            Maksud Sebenarnya Lawan Bicara (Hidden Intent):
          </div>
          <p className="text-xs text-[#242a38] leading-relaxed">
            {evaluation.maksud_tersembunyi_karakter}
          </p>
        </div>

        {/* 2 Alternatif Respons */}
        <div className="space-y-2">
          <span className="text-xs font-bold text-[#242a38]">Contoh Alternatif Respons yang Efektif:</span>
          <div className="p-2.5 bg-[#fff9eb] border border-[#d1c7b5] rounded text-xs text-[#242a38]">
            <span className="font-semibold text-[#355c5a]">Versi Ringkas: </span>
            "{evaluation.alternatif_respons.versi_ringkas}"
          </div>
          <div className="p-2.5 bg-[#fff9eb] border border-[#d1c7b5] rounded text-xs text-[#242a38]">
            <span className="font-semibold text-[#355c5a]">Versi Lebih Rinci: </span>
            "{evaluation.alternatif_respons.versi_rinci}"
          </div>
        </div>

        {/* Rekomendasi Level & Tombol Aksi */}
        <div className="flex items-center justify-between pt-3 border-t border-[#d1c7b5]">
          <span className="text-xs text-[#5c6d70]">
            Rekomendasi Level Berikutnya: <strong className="uppercase text-[#355c5a]">{evaluation.rekomendasi_level}</strong>
          </span>

          <div className="flex gap-2">
            <button
              onClick={onRetry}
              className="flex items-center gap-1.5 px-3 py-2 bg-[#fff9eb] border border-[#355c5a] text-[#355c5a] rounded-md text-xs font-semibold hover:bg-[#e6dfce]"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              Coba Lagi
            </button>
            <button
              onClick={onNextScenario}
              className="flex items-center gap-1.5 px-4 py-2 bg-[#355c5a] text-[#fff9eb] rounded-md text-xs font-semibold hover:bg-[#2c4d4b]"
            >
              Ganti Skenario
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
```

---

## 6. Checklist Verifikasi Baginda

- [ ] Pengalih Mode 2D vs Mode Daftar Langsung berfungsi responsif dan langsung dapat diakses.
- [ ] Tombol Jeda, Lewati, Keluar, dan Petunjuk selalu tampak saat sesi percakapan berlangsung.
- [ ] Teks chat muncul langsung (tanpa efek typewriter yang memperlambat pembacaan pengguna).
- [ ] Indikator tiga titik mengetik muncul saat sistem menunggu respon Gemini.
- [ ] Kartu evaluasi 4 dimensi menampilkan badge deskriptif (*Perlu dilatih / Berkembang / Efektif*), bukan angka.
- [ ] Fitur *Coba Lagi* menyimpan riwayat percobaan ke `localStorage` untuk perbandingan berdampingan (*side-by-side*).
- [ ] Warna kontras telah teruji memenuhi rasio WCAG AA (kontras teks gelap di latar krem hangat).

