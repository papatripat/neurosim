import React, { useState, useEffect, useRef } from 'react';
import { DialogueMessage } from '../../types/conversation';

interface Props {
  isOpen: boolean;
  scenarioId: string;
  npcName: string;
  portraitSrc: string;
  userGoal: string;
  transcript: DialogueMessage[];
  turnCount: number;
  maxTurns?: number;
  isLoading: boolean;
  hintText: string;
  onSendMessage: (text: string) => void;
  onSkipTurn: () => void;
  onExit: () => void;
  onRequestEvaluation: () => void;
}

export const DialogueModal: React.FC<Props> = ({
  isOpen,
  npcName,
  portraitSrc,
  userGoal,
  transcript,
  turnCount,
  maxTurns = 6,
  isLoading,
  hintText,
  onSendMessage,
  onSkipTurn,
  onExit,
  onRequestEvaluation,
}) => {
  const [input, setInput] = useState('');
  const [paused, setPaused] = useState(false);
  const [showHint, setShowHint] = useState(false);
  const dialogRef = useRef<HTMLDivElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onExit();
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onExit]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [transcript, isLoading]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading || paused || turnCount >= maxTurns) return;
    onSendMessage(input.trim());
    setInput('');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/65 p-3 sm:p-4">
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-label={`Percakapan dengan ${npcName}`}
        tabIndex={-1}
        className="w-full max-w-2xl bg-cream border-2 border-teal rounded-lg shadow-xl flex flex-col max-h-[92vh] overflow-hidden"
      >
        {/* Desk Intercom Header */}
        <div className="flex items-center justify-between px-4 py-2.5 bg-teal text-soft border-b border-teal-dark">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded border border-soft/50 overflow-hidden bg-cream flex-shrink-0">
              <img
                src={portraitSrc}
                alt={npcName}
                className="w-full h-full object-contain scale-[1.7] pixelated"
              />
            </div>
            <div>
              <h2 className="font-bold text-sm sm:text-base leading-tight text-soft">{npcName}</h2>
              <span className="text-[11px] font-mono text-soft/80 block">
                Giliran Percakapan: {turnCount} dari {maxTurns}
              </span>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-1.5 text-xs">
            <button
              type="button"
              onClick={() => setShowHint((h) => !h)}
              aria-label="Lihat petunjuk strategi"
              className={`px-2.5 py-1 rounded font-medium transition-colors ${
                showHint
                  ? 'bg-brass text-ink font-bold'
                  : 'bg-teal-dark text-soft hover:bg-teal-dark/80'
              }`}
            >
              {showHint ? 'Tutup Petunjuk' : 'Petunjuk'}
            </button>

            <button
              type="button"
              onClick={() => setPaused((p) => !p)}
              aria-label={paused ? 'Lanjutkan latihan' : 'Jeda latihan'}
              className={`px-2.5 py-1 rounded font-medium transition-colors ${
                paused
                  ? 'bg-brass text-ink font-bold'
                  : 'bg-teal-dark text-soft hover:bg-teal-dark/80'
              }`}
            >
              {paused ? 'Lanjut' : 'Jeda'}
            </button>

            <button
              type="button"
              onClick={onSkipTurn}
              disabled={isLoading || paused || turnCount >= maxTurns}
              aria-label="Lewati giliran ini"
              className="px-2.5 py-1 rounded bg-teal-dark text-soft hover:bg-teal-dark/80 disabled:opacity-40 transition-colors"
            >
              Lewati
            </button>

            <button
              type="button"
              onClick={onExit}
              aria-label="Keluar dari percakapan"
              className="px-2.5 py-1 rounded bg-brick text-white hover:bg-brick/90 font-medium transition-colors"
            >
              Keluar
            </button>
          </div>
        </div>

        {/* Goal Ribbon */}
        <div className="px-4 py-2 bg-sand text-xs flex flex-wrap items-center justify-between gap-2 border-b border-muted/20">
          <p className="text-ink">
            Target Latihan: <strong className="text-teal font-semibold">"{userGoal}"</strong>
          </p>
          {turnCount >= 2 && (
            <button
              type="button"
              onClick={onRequestEvaluation}
              className="px-2.5 py-1 text-xs font-semibold rounded bg-sage text-soft hover:bg-sage/90 transition-colors"
            >
              Selesai & Evaluasi Sekarang
            </button>
          )}
        </div>

        {/* Sticky Note Hint */}
        {showHint && (
          <div className="px-4 py-2.5 bg-[#fdf5e2] border-b border-ochre/30 text-xs text-ink leading-relaxed">
            <span className="font-bold text-ochre block mb-0.5">Catatan Strategi:</span>
            <p>{hintText}</p>
          </div>
        )}

        {/* Paused Notice */}
        {paused && (
          <div className="px-4 py-2 bg-sand text-xs text-center font-medium text-ink border-b border-muted/20">
            Sesi sedang dijeda. Tarik napas sejenak, klik tombol "Lanjut" bila sudah siap kembali.
          </div>
        )}

        {/* Transcript Log */}
        <div
          ref={scrollRef}
          className="flex-1 p-4 overflow-y-auto space-y-3.5 max-h-[380px] bg-parchment/60"
        >
          {transcript.map((msg, i) => (
            <div
              key={i}
              className={`flex items-start gap-2.5 ${
                msg.speaker === 'user' ? 'justify-end' : 'justify-start'
              }`}
            >
              <div
                className={`max-w-[82%] p-3 rounded text-sm leading-relaxed border ${
                  msg.speaker === 'user'
                    ? 'bg-teal text-soft border-teal-dark rounded-tr-none'
                    : 'bg-cream text-ink border-sand rounded-tl-none'
                }`}
              >
                <div
                  className={`text-[10px] font-semibold uppercase tracking-wider mb-1 ${
                    msg.speaker === 'user' ? 'text-soft/70' : 'text-teal'
                  }`}
                >
                  {msg.speaker === 'user' ? 'Kamu' : npcName}
                </div>
                <p className="whitespace-pre-wrap">{msg.text}</p>
              </div>
            </div>
          ))}

          {isLoading && (
            <div className="text-xs text-muted italic px-2 py-1 flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-teal" aria-hidden="true" />
              <span>{npcName} sedang merumuskan jawaban...</span>
            </div>
          )}
        </div>

        {/* Input Form */}
        <form onSubmit={handleSubmit} className="p-3 bg-cream border-t border-sand flex gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.stopPropagation()}
            onKeyUp={(e) => e.stopPropagation()}
            disabled={isLoading || paused || turnCount >= maxTurns}
            placeholder={
              turnCount >= maxTurns
                ? 'Batas 6 giliran tercapai. Silakan buka hasil evaluasi.'
                : paused
                ? 'Percakapan dijeda...'
                : 'Ketik jawabanmu secara bebas dan langsung...'
            }
            className="flex-1 px-3.5 py-2 bg-soft border border-muted/30 rounded text-sm text-ink focus:outline-none focus:ring-2 focus:ring-teal disabled:opacity-50"
          />

          {turnCount >= maxTurns ? (
            <button
              type="button"
              onClick={onRequestEvaluation}
              className="px-4 py-2 bg-sage text-soft rounded text-sm font-semibold hover:bg-sage/90 transition-colors"
            >
              Evaluasi
            </button>
          ) : (
            <button
              type="submit"
              disabled={isLoading || paused || !input.trim()}
              className="px-4 py-2 bg-teal text-soft rounded text-sm font-semibold hover:bg-teal-dark transition-colors disabled:opacity-50"
            >
              Kirim
            </button>
          )}
        </form>
      </div>
    </div>
  );
};
