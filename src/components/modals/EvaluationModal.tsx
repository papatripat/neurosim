import React, { useState, useEffect, useRef } from 'react';
import { EvaluationResult, DialogueMessage } from '../../types/conversation';

interface Props {
  isOpen: boolean;
  evaluation: EvaluationResult;
  userGoal: string;
  transcript: DialogueMessage[];
  previousAttempt?: {
    evaluation: EvaluationResult;
    transcript: DialogueMessage[];
  } | null;
  onRetry: () => void;
  onNextScenario: () => void;
  onClose: () => void;
}

export const EvaluationModal: React.FC<Props> = ({
  isOpen,
  evaluation,
  userGoal,
  previousAttempt,
  onRetry,
  onNextScenario,
  onClose,
}) => {
  const [flagged, setFlagged] = useState(false);
  const [showComparison, setShowComparison] = useState(false);
  const dialogRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const badgeClass = (tingkat: string) => {
    switch (tingkat.toLowerCase()) {
      case 'efektif':
        return 'bg-sage text-soft border border-sage';
      case 'berkembang':
        return 'bg-ochre text-soft border border-ochre';
      default:
        return 'bg-brick text-soft border border-brick';
    }
  };

  const dimensions = [
    { label: 'Kejelasan Pesan', data: evaluation.kejelasan_pesan },
    { label: 'Pemahaman Konteks', data: evaluation.pemahaman_konteks },
    { label: 'Ketercapaian Tujuan', data: evaluation.ketercapaian_tujuan },
    { label: 'Rasa Hormat & Batasan', data: evaluation.rasa_hormat_dan_batasan },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/65 p-3 sm:p-4 overflow-y-auto">
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="eval-title"
        tabIndex={-1}
        className="w-full max-w-2xl bg-cream border-2 border-teal rounded-lg shadow-xl p-5 sm:p-6 space-y-4 my-6 max-h-[92vh] overflow-y-auto"
      >
        {/* Memo Header */}
        <div className="border-b border-[#d1c7b5] pb-3 flex flex-wrap justify-between items-start gap-3">
          <div>
            <h2 id="eval-title" className="text-lg font-bold text-ink">
              Lembar Evaluasi Objektif
            </h2>
            <p className="text-xs text-ink-muted mt-0.5">
              Target yang kamu tentukan: <strong className="text-ink font-semibold">"{userGoal}"</strong>
            </p>
          </div>

          {previousAttempt && (
            <button
              type="button"
              onClick={() => setShowComparison((c) => !c)}
              className="px-3 py-1 text-xs font-medium rounded border border-teal text-teal hover:bg-sand transition-colors flex-shrink-0"
            >
              {showComparison ? 'Tutup Perbandingan' : 'Bandingkan Percobaan Lalu'}
            </button>
          )}
        </div>

        {/* Side-by-Side Comparison Sheet */}
        {showComparison && previousAttempt ? (
          <div className="p-3.5 bg-sand rounded border border-muted/20 space-y-3">
            <h3 className="font-bold text-xs uppercase tracking-wide text-teal">
              Perbandingan Hasil Percobaan
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div className="p-3 bg-soft rounded border border-sand space-y-1.5">
                <span className="font-bold text-brick uppercase tracking-wider block">
                  Percobaan Lalu
                </span>
                <div className="text-ink">Kejelasan: <strong>{previousAttempt.evaluation.kejelasan_pesan.tingkat}</strong></div>
                <div className="text-ink">Pemahaman: <strong>{previousAttempt.evaluation.pemahaman_konteks.tingkat}</strong></div>
                <div className="text-ink">Ketercapaian: <strong>{previousAttempt.evaluation.ketercapaian_tujuan.tingkat}</strong></div>
                <div className="text-ink">Batasan: <strong>{previousAttempt.evaluation.rasa_hormat_dan_batasan.tingkat}</strong></div>
              </div>

              <div className="p-3 bg-soft rounded border-2 border-sage space-y-1.5">
                <span className="font-bold text-sage uppercase tracking-wider block">
                  Percobaan Sekarang
                </span>
                <div className="text-ink">Kejelasan: <strong>{evaluation.kejelasan_pesan.tingkat}</strong></div>
                <div className="text-ink">Pemahaman: <strong>{evaluation.pemahaman_konteks.tingkat}</strong></div>
                <div className="text-ink">Ketercapaian: <strong>{evaluation.ketercapaian_tujuan.tingkat}</strong></div>
                <div className="text-ink">Batasan: <strong>{evaluation.rasa_hormat_dan_batasan.tingkat}</strong></div>
              </div>
            </div>
          </div>
        ) : (
          <>
            {/* 4 Rubric Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {dimensions.map((dim, i) => (
                <div key={i} className="p-3 bg-soft border border-sand rounded space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-xs text-ink">{dim.label}</span>
                    <span
                      className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded ${badgeClass(
                        dim.data.tingkat
                      )}`}
                    >
                      {dim.data.tingkat}
                    </span>
                  </div>
                  <p className="text-xs text-ink-muted leading-relaxed">{dim.data.alasan}</p>
                </div>
              ))}
            </div>

            {/* Hidden Intent Revelation */}
            <div className="p-3.5 bg-sand rounded border border-muted/20 space-y-1">
              <strong className="text-xs text-teal block font-semibold">
                Maksud Sebenarnya Lawan Bicara (Hidden Intent):
              </strong>
              <p className="text-xs text-ink leading-relaxed">
                {evaluation.maksud_tersembunyi_karakter}
              </p>
            </div>

            {/* Alternative Responses */}
            <div className="space-y-1.5">
              <span className="text-xs font-bold text-ink block">Alternatif Respons Efektif:</span>
              <div className="p-2.5 bg-soft border border-sand rounded text-xs text-ink space-y-0.5">
                <span className="font-semibold text-teal block">Versi Ringkas (Lugas):</span>
                <p className="italic">"{evaluation.alternatif_respons.versi_ringkas}"</p>
              </div>
              <div className="p-2.5 bg-soft border border-sand rounded text-xs text-ink space-y-0.5">
                <span className="font-semibold text-teal block">Versi Rinci (Eksplisit):</span>
                <p className="italic">"{evaluation.alternatif_respons.versi_rinci}"</p>
              </div>
            </div>
          </>
        )}

        {/* AI Disclaimer & Flagging */}
        <div className="flex flex-wrap items-center justify-between text-xs text-ink-muted pt-1 border-t border-sand gap-2">
          <span>AI bisa keliru. Evaluasi ini adalah sudut pandang untuk refleksi mandiri.</span>
          <button
            type="button"
            onClick={() => setFlagged((f) => !f)}
            className={`text-[11px] px-2 py-0.5 rounded border transition-colors ${
              flagged
                ? 'bg-amber-100 text-amber-900 border-amber-300 font-medium'
                : 'border-muted/30 text-ink-muted hover:text-brick'
            }`}
          >
            {flagged ? 'Telah Ditandai' : 'Tandai Kurang Tepat'}
          </button>
        </div>

        {/* Footer Actions */}
        <div className="flex flex-wrap items-center justify-between pt-2 border-t border-sand gap-2">
          <span className="text-xs text-ink-muted">
            Rekomendasi tingkat berikutnya:{' '}
            <strong className="uppercase text-teal font-bold">{evaluation.rekomendasi_level}</strong>
          </span>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onRetry}
              className="px-3 py-1.5 bg-soft border border-teal text-teal rounded text-xs font-semibold hover:bg-sand transition-colors"
            >
              Coba Lagi
            </button>
            <button
              type="button"
              onClick={onNextScenario}
              className="px-4 py-1.5 bg-teal text-soft rounded text-xs font-semibold hover:bg-teal-dark transition-colors"
            >
              Ganti Skenario
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
