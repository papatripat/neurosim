import React, { useState, useRef, useEffect, useLayoutEffect } from 'react';
import { X, Send, Hash, MessageSquare, ChevronDown } from 'lucide-react';

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
  onMarkAllRead?: () => void;
}

export const OfficeChatDrawer: React.FC<Props> = ({
  isOpen,
  onClose,
  messages,
  onSendMessage,
  onMarkAllRead,
}) => {
  const [inputText, setInputText] = useState('');
  const [lastReadMessageId, setLastReadMessageId] = useState<string | null>(null);
  const [firstUnreadId, setFirstUnreadId] = useState<string | null>(null);
  const [showScrollBottomBtn, setShowScrollBottomBtn] = useState(false);

  const containerRef = useRef<HTMLDivElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const unreadDividerRef = useRef<HTMLDivElement>(null);
  const prevMessagesLengthRef = useRef(messages.length);
  const isAutoScrollingRef = useRef(false);

  // Bila chat drawer baru dibuka atau pesan bertambah
  useEffect(() => {
    if (!isOpen) return;

    if (messages.length > 0) {
      const lastMsg = messages[messages.length - 1];

      // JIKA PESAN TERAKHIR ADALAH PESAN SENDIRI (isSelf):
      // Jangan pernah tandai pesan sendiri sebagai unread ("Lihat Pesan Baru")!
      if (lastMsg.isSelf) {
        setLastReadMessageId(lastMsg.id);
        setFirstUnreadId(null);
        setShowScrollBottomBtn(false);
        onMarkAllRead?.();
        return;
      }

      if (!lastReadMessageId) {
        setLastReadMessageId(lastMsg.id);
        setFirstUnreadId(null);
      } else {
        const lastReadIdx = messages.findIndex((m) => m.id === lastReadMessageId);
        if (lastReadIdx !== -1 && lastReadIdx < messages.length - 1) {
          // Hanya cari pesan baru yang berasal dari orang lain (!isSelf)
          const newFromOthers = messages.slice(lastReadIdx + 1).find((m) => !m.isSelf);
          if (newFromOthers && !firstUnreadId) {
            setFirstUnreadId(newFromOthers.id);
          }
        }
      }
    }

    onMarkAllRead?.();
  }, [isOpen, messages.length, onMarkAllRead]);

  // Jika pesan yang belum dibaca sudah tampil di layar tanpa perlu scroll, bersihkan otomatis setelah 2.5 detik
  useEffect(() => {
    if (!isOpen || !firstUnreadId) return;
    const timer = setTimeout(() => {
      if (containerRef.current) {
        const { scrollHeight, clientHeight } = containerRef.current;
        if (scrollHeight <= clientHeight + 40) {
          handleClearUnread();
        }
      }
    }, 2500);
    return () => clearTimeout(timer);
  }, [isOpen, firstUnreadId, messages.length]);

  // Deteksi scroll posisi pengguna
  const handleScroll = () => {
    if (!containerRef.current || isAutoScrollingRef.current) return;
    const { scrollTop, scrollHeight, clientHeight } = containerRef.current;
    const distanceFromBottom = scrollHeight - scrollTop - clientHeight;
    const isNearBottom = distanceFromBottom < 80;

    // Tombol hanya tampil jika user sengaja scroll ke atas lebih dari 120px
    setShowScrollBottomBtn(distanceFromBottom > 120 && messages.length > 3);

    // Jika sudah di paling bawah, bersihkan status unread
    if (isNearBottom && messages.length > 0) {
      const latestMsg = messages[messages.length - 1];
      setLastReadMessageId(latestMsg.id);
      setFirstUnreadId(null);
      onMarkAllRead?.();
    }
  };

  // Auto-scroll ke bawah bila pengguna mengirim pesan sendiri atau saat baru buka
  useLayoutEffect(() => {
    if (!isOpen) return;

    const isNewMessage = messages.length > prevMessagesLengthRef.current;
    prevMessagesLengthRef.current = messages.length;

    if (isNewMessage) {
      const lastMsg = messages[messages.length - 1];
      if (lastMsg?.isSelf) {
        // Jika pesan sendiri, langsung hilangkan tombol scroll dan lompat instan tanpa glitch
        setShowScrollBottomBtn(false);
        setFirstUnreadId(null);
        scrollToBottom('auto');
      } else {
        // Jika pesan orang lain dan user sedang di bawah, ikuti scroll
        if (containerRef.current) {
          const { scrollTop, scrollHeight, clientHeight } = containerRef.current;
          const dist = scrollHeight - scrollTop - clientHeight;
          if (dist < 100) {
            scrollToBottom('smooth');
          } else {
            setShowScrollBottomBtn(true);
          }
        }
      }
    } else if (messages.length > 0 && !firstUnreadId) {
      // Scroll awal ke bawah
      scrollToBottom('auto');
    }
  }, [messages, isOpen]);

  const scrollToBottom = (behavior: ScrollBehavior = 'auto') => {
    isAutoScrollingRef.current = true;
    setShowScrollBottomBtn(false);
    messagesEndRef.current?.scrollIntoView({ behavior });
    if (messages.length > 0) {
      setLastReadMessageId(messages[messages.length - 1].id);
      setFirstUnreadId(null);
      onMarkAllRead?.();
    }
    // Lepas kunci auto-scrolling setelah proses scroll selesai
    setTimeout(() => {
      isAutoScrollingRef.current = false;
      if (containerRef.current) {
        const { scrollTop, scrollHeight, clientHeight } = containerRef.current;
        const dist = scrollHeight - scrollTop - clientHeight;
        setShowScrollBottomBtn(dist > 120 && messages.length > 3);
      }
    }, behavior === 'smooth' ? 300 : 50);
  };

  const handleClearUnread = () => {
    setFirstUnreadId(null);
    if (messages.length > 0) {
      setLastReadMessageId(messages[messages.length - 1].id);
    }
    onMarkAllRead?.();
  };

  const scrollToFirstUnread = () => {
    if (unreadDividerRef.current) {
      unreadDividerRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
    } else {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
    // Langsung hilangkan tombol merah dan penanda unread saat ditekan (seperti Discord/WA)
    handleClearUnread();
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim()) return;
    const textToSend = inputText.trim();
    setInputText('');
    setShowScrollBottomBtn(false);
    handleClearUnread();
    isAutoScrollingRef.current = true;
    onSendMessage(textToSend);
  };

  if (!isOpen) return null;

  return (
    <aside
      aria-label="Panel Obrolan Kantor"
      className="absolute top-0 right-0 h-full w-80 max-w-[90vw] bg-cream border-l-2 border-teal shadow-2xl z-40 flex flex-col animate-in slide-in-from-right duration-200"
    >
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 bg-teal text-soft border-b border-teal-dark flex-shrink-0">
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
          className="p-1 hover:bg-teal-dark rounded text-soft text-lg leading-none cursor-pointer"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Messages Feed */}
      <div
        ref={containerRef}
        onScroll={handleScroll}
        className="flex-1 overflow-y-auto p-3 space-y-3 bg-parchment/60 relative"
      >
        {messages.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center p-6 text-center text-ink-muted">
            <div className="w-12 h-12 rounded-full bg-sand flex items-center justify-center mb-2.5 text-teal border border-[#d1c7b5]">
              <MessageSquare className="w-6 h-6" />
            </div>
            <p className="text-xs font-bold text-ink">Belum Ada Obrolan</p>
            <p className="text-[11px] text-ink-muted mt-1 leading-relaxed max-w-[210px]">
              Sampaikan salam atau koordinasikan tugas dengan rekan kerja di kantor.
            </p>
          </div>
        ) : (
          messages.map((m) => {
            const isFirstUnread = m.id === firstUnreadId && !m.isSelf;

            return (
              <React.Fragment key={m.id}>
                {/* Pembatas Discord/WA-style untuk pesan baru belum dilihat (bisa diklik untuk hilang) */}
                {isFirstUnread && (
                  <div
                    ref={unreadDividerRef}
                    onClick={handleClearUnread}
                    title="Klik untuk menandai pesan sudah dibaca"
                    className="relative my-3 flex items-center justify-center cursor-pointer group"
                  >
                    <div className="absolute inset-0 flex items-center">
                      <div className="w-full border-t-2 border-brick/70 group-hover:border-brick transition-colors" />
                    </div>
                    <span className="relative bg-brick hover:bg-brick-dark text-soft text-[9.5px] font-bold px-2.5 py-0.5 rounded-full uppercase tracking-wider shadow-2xs flex items-center gap-1.5 transition-all">
                      <span className="w-1.5 h-1.5 rounded-full bg-soft animate-ping" />
                      <span>Pesan Baru Belum Dilihat</span>
                      <X className="w-3 h-3 opacity-75 group-hover:opacity-100" />
                    </span>
                  </div>
                )}

                <div
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
                    className={`p-2.5 rounded max-w-[85%] leading-relaxed border shadow-2xs ${
                      m.isSelf
                        ? 'bg-teal text-soft border-teal-dark rounded-tr-none'
                        : 'bg-cream text-ink border-sand rounded-tl-none'
                    }`}
                  >
                    {m.text}
                  </div>
                </div>
              </React.Fragment>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Floating Pill: Lompat ke Pesan Baru / Bawah (Discord-style) */}
      {firstUnreadId ? (
        <button
          type="button"
          onClick={scrollToFirstUnread}
          className="absolute bottom-16 left-1/2 -translate-x-1/2 bg-brick text-soft text-[11px] font-bold px-3 py-1 rounded-full shadow-lg hover:bg-brick-dark transition-all flex items-center gap-1.5 z-10 cursor-pointer animate-in fade-in slide-in-from-bottom-2"
        >
          <ChevronDown className="w-3.5 h-3.5" />
          <span>Lihat Pesan Baru</span>
        </button>
      ) : showScrollBottomBtn ? (
        <button
          type="button"
          onClick={() => scrollToBottom('smooth')}
          className="absolute bottom-16 left-1/2 -translate-x-1/2 bg-teal text-soft text-[11px] font-bold px-3 py-1 rounded-full shadow-lg hover:bg-teal-dark transition-all flex items-center gap-1.5 z-10 cursor-pointer animate-in fade-in slide-in-from-bottom-2"
        >
          <ChevronDown className="w-3.5 h-3.5" />
          <span>Lompat ke Paling Bawah</span>
        </button>
      ) : null}

      {/* Input */}
      <form onSubmit={handleSubmit} className="p-2.5 bg-cream border-t border-sand flex gap-1.5 flex-shrink-0">
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
          className="p-2 bg-teal text-soft rounded hover:bg-teal-dark transition-colors disabled:opacity-40 cursor-pointer"
          title="Kirim Pesan"
        >
          <Send className="w-3.5 h-3.5" />
        </button>
      </form>
    </aside>
  );
};
