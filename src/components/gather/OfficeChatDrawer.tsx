import React, { useState } from 'react';
import { X, Send, Hash } from 'lucide-react';

export interface OfficeChatMessage {
  id: string;
  sender: string;
  time: string;
  text: string;
  isSelf?: boolean;
}

interface Props {
  isOpen: boolean;
  onClose: () => void;
  messages: OfficeChatMessage[];
  onSendMessage: (text: string) => void;
}

export const OfficeChatDrawer: React.FC<Props> = ({
  isOpen,
  onClose,
  messages,
  onSendMessage,
}) => {
  const [inputText, setInputText] = useState('');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim()) return;
    onSendMessage(inputText.trim());
    setInputText('');
  };

  return (
    <aside
      aria-label="Panel Obrolan Kantor"
      className="absolute top-0 right-0 h-full w-80 max-w-[90vw] bg-cream border-l-2 border-teal shadow-2xl z-40 flex flex-col animate-in slide-in-from-right duration-200"
    >
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 bg-teal text-soft border-b border-teal-dark">
        <div className="flex items-center gap-1.5">
          <Hash className="w-4 h-4 text-brass" />
          <div>
            <h2 className="font-bold text-sm">Obrolan Kantor</h2>
            <p className="text-[11px] text-soft/80">Saluran Umum Virtual</p>
          </div>
        </div>
        <button
          type="button"
          onClick={onClose}
          aria-label="Tutup Obrolan"
          className="p-1 hover:bg-teal-dark rounded text-soft text-lg leading-none"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Messages Feed */}
      <div className="flex-1 overflow-y-auto p-3 space-y-3 bg-parchment/60">
        {messages.map((m) => (
          <div
            key={m.id}
            className={`flex flex-col text-xs space-y-0.5 ${
              m.isSelf ? 'items-end' : 'items-start'
            }`}
          >
            <div className="flex items-center gap-1.5 text-[10px] text-ink-muted px-1">
              <span className={`font-bold ${m.isSelf ? 'text-teal' : 'text-ink'}`}>
                {m.sender}
              </span>
              <span>{m.time}</span>
            </div>
            <div
              className={`p-2.5 rounded max-w-[85%] leading-relaxed border ${
                m.isSelf
                  ? 'bg-teal text-soft border-teal-dark rounded-tr-none'
                  : 'bg-cream text-ink border-sand rounded-tl-none'
              }`}
            >
              {m.text}
            </div>
          </div>
        ))}
      </div>

      {/* Input */}
      <form onSubmit={handleSubmit} className="p-2.5 bg-cream border-t border-sand flex gap-1.5">
        <input
          type="text"
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          onKeyDown={(e) => e.stopPropagation()}
          onKeyUp={(e) => e.stopPropagation()}
          placeholder="Ketik pesan kantor..."
          className="flex-1 px-2.5 py-1.5 bg-soft border border-muted/30 rounded text-xs text-ink focus:outline-none focus:ring-1 focus:ring-teal"
        />
        <button
          type="submit"
          disabled={!inputText.trim()}
          className="p-2 bg-teal text-soft rounded hover:bg-teal-dark transition-colors disabled:opacity-40"
          title="Kirim Pesan"
        >
          <Send className="w-3.5 h-3.5" />
        </button>
      </form>
    </aside>
  );
};

