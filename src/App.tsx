import React, { useEffect, useState } from 'react';
import { PhaserGame } from './game/PhaserGame';
import { EventBus, GAME_EVENTS } from './game/EventBus';
import { MessageSquare, CheckSquare, X, Send } from 'lucide-react';

interface DialogPayload {
  scenarioId: string;
  npcName: string;
}

export const App: React.FC = () => {
  const [sceneReady, setSceneReady] = useState(false);
  const [activeDialog, setActiveDialog] = useState<DialogPayload | null>(null);
  const [isTodoListOpen, setIsTodoListOpen] = useState(false);
  const [testInput, setTestInput] = useState('');
  const [dialogMessages, setDialogMessages] = useState<Array<{ sender: string; text: string }>>([]);

  useEffect(() => {
    const handleSceneReady = () => {
      setSceneReady(true);
    };

    const handleOpenDialog = (data: DialogPayload) => {
      setActiveDialog(data);
      setDialogMessages([
        {
          sender: data.npcName,
          text: `Halo! Selamat datang di simulasi interaksi (${data.scenarioId}). Silakan ketik respons untuk menguji input teks WASD saat dialog terbuka.`,
        },
      ]);
    };

    const handleOpenTodoList = () => {
      setIsTodoListOpen(true);
    };

    EventBus.on(GAME_EVENTS.SCENE_READY, handleSceneReady);
    EventBus.on(GAME_EVENTS.OPEN_DIALOG, handleOpenDialog);
    EventBus.on(GAME_EVENTS.OPEN_TODO_LIST, handleOpenTodoList);

    return () => {
      EventBus.off(GAME_EVENTS.SCENE_READY, handleSceneReady);
      EventBus.off(GAME_EVENTS.OPEN_DIALOG, handleOpenDialog);
      EventBus.off(GAME_EVENTS.OPEN_TODO_LIST, handleOpenTodoList);
    };
  }, []);

  const closeDialog = () => {
    setActiveDialog(null);
    setTestInput('');
    EventBus.emit(GAME_EVENTS.CLOSE_DIALOG);
  };

  const closeTodoList = () => {
    setIsTodoListOpen(false);
    EventBus.emit(GAME_EVENTS.CLOSE_DIALOG);
  };

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!testInput.trim()) return;

    setDialogMessages((prev) => [
      ...prev,
      { sender: 'Pemain', text: testInput.trim() },
      { sender: activeDialog?.npcName || 'NPC', text: `Respons diterima: "${testInput.trim()}". Input teks keyboard (WASD) berfungsi normal tanpa interference Phaser!` },
    ]);
    setTestInput('');
  };

  return (
    <div className="relative w-screen h-screen bg-[#0f1117] flex flex-col select-none overflow-hidden font-sans">
      {/* Top Bar Status */}
      <header className="z-10 flex items-center justify-between px-4 py-2 bg-[#242a38] text-[#fff9eb] border-b border-[#3d485b] shadow-md">
        <div className="flex items-center gap-3">
          <span className="font-bold text-sm tracking-wide text-[#e0b65d]">NEUROSIM</span>
          <span className="text-xs px-2 py-0.5 rounded bg-[#355c5a] text-[#fff9eb]">
            2D Office Engine (Phaser 3.85+)
          </span>
          <span className={`text-[11px] px-2 py-0.5 rounded font-mono ${sceneReady ? 'bg-[#2b6e4f] text-white' : 'bg-[#94463d] text-white'}`}>
            {sceneReady ? '● Engine Ready' : '○ Loading Assets...'}
          </span>
        </div>

        <div className="text-xs text-[#a7b7bb] flex items-center gap-4">
          <span>Gerak: <kbd className="px-1.5 py-0.5 bg-[#3d485b] rounded text-white font-mono">WASD</kbd> / Panah</span>
          <span>Interaksi: <kbd className="px-1.5 py-0.5 bg-[#3d485b] rounded text-white font-mono">E</kbd></span>
        </div>
      </header>

      {/* Phaser Canvas Viewport */}
      <main className="relative flex-1 w-full h-full">
        <PhaserGame />

        {/* Dialog Modal Overlay */}
        {activeDialog && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
            <div className="w-full max-w-xl bg-[#f4ead5] border-4 border-[#355c5a] rounded-xl shadow-2xl flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-150">
              {/* Modal Header */}
              <div className="flex items-center justify-between px-4 py-3 bg-[#355c5a] text-[#fff9eb]">
                <div className="flex items-center gap-2">
                  <MessageSquare className="w-5 h-5 text-[#e0b65d]" />
                  <span className="font-semibold text-sm">{activeDialog.npcName}</span>
                  <span className="text-xs px-2 py-0.5 rounded bg-black/25 font-mono uppercase">
                    {activeDialog.scenarioId}
                  </span>
                </div>
                <button
                  onClick={closeDialog}
                  aria-label="Tutup Dialog"
                  className="p-1 hover:bg-white/20 rounded transition text-[#fff9eb]"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Message List */}
              <div className="flex-1 p-4 max-h-[300px] overflow-y-auto space-y-3 bg-[#e6dfce]/40">
                {dialogMessages.map((msg, idx) => (
                  <div
                    key={idx}
                    className={`flex flex-col ${msg.sender === 'Pemain' ? 'items-end' : 'items-start'}`}
                  >
                    <span className="text-[11px] font-semibold text-[#5c6d70] mb-0.5">
                      {msg.sender}
                    </span>
                    <div
                      className={`max-w-[85%] p-3 rounded-lg text-sm leading-relaxed ${
                        msg.sender === 'Pemain'
                          ? 'bg-[#355c5a] text-[#fff9eb] rounded-tr-none'
                          : 'bg-[#fff9eb] border border-[#d1c7b5] text-[#242a38] rounded-tl-none shadow-sm'
                      }`}
                    >
                      {msg.text}
                    </div>
                  </div>
                ))}
              </div>

              {/* Text Input Form (Verifies WASD capture release) */}
              <form onSubmit={handleSendMessage} className="p-3 bg-[#f4ead5] border-t border-[#d1c7b5] flex gap-2">
                <input
                  type="text"
                  autoFocus
                  value={testInput}
                  onChange={(e) => setTestInput(e.target.value)}
                  placeholder="Ketik responsmu (uji ketik 'w', 'a', 's', 'd')..."
                  className="flex-1 px-3 py-2 bg-[#fff9eb] border border-[#a7b7bb] rounded-md text-sm text-[#242a38] focus:outline-none focus:ring-2 focus:ring-[#355c5a]"
                />
                <button
                  type="submit"
                  disabled={!testInput.trim()}
                  className="px-4 py-2 bg-[#355c5a] text-[#fff9eb] rounded-md text-sm font-semibold hover:bg-[#2c4d4b] transition flex items-center gap-1.5 disabled:opacity-50"
                >
                  <Send className="w-4 h-4" />
                  Kirim
                </button>
                <button
                  type="button"
                  onClick={closeDialog}
                  className="px-3 py-2 border border-[#a7b7bb] text-[#242a38] rounded-md text-sm hover:bg-[#e6dfce] transition"
                >
                  Selesai
                </button>
              </form>
            </div>
          </div>
        )}

        {/* To-Do List Modal Overlay */}
        {isTodoListOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
            <div className="w-full max-w-lg bg-[#f4ead5] border-4 border-[#355c5a] rounded-xl shadow-2xl flex flex-col overflow-hidden">
              <div className="flex items-center justify-between px-4 py-3 bg-[#355c5a] text-[#fff9eb]">
                <div className="flex items-center gap-2">
                  <CheckSquare className="w-5 h-5 text-[#e0b65d]" />
                  <span className="font-semibold text-sm">Papan To-Do List Kantor</span>
                </div>
                <button
                  onClick={closeTodoList}
                  aria-label="Tutup To-Do List"
                  className="p-1 hover:bg-white/20 rounded transition text-[#fff9eb]"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="p-5 space-y-3 bg-[#fff9eb]">
                <p className="text-xs text-[#5c6d70]">
                  Daftar agenda skenario komunikasi yang dapat kamu latih di kantor ini:
                </p>

                <div className="space-y-2">
                  <div className="p-3 bg-[#e6dfce] rounded-lg border border-[#a7b7bb] flex items-center justify-between">
                    <div>
                      <h4 className="font-bold text-xs text-[#242a38]">Skenario 1: Klarifikasi Instruksi Ambigu</h4>
                      <p className="text-[11px] text-[#5c6d70]">Ruangan Bos (Zona 4 - Kanan Atas) • Bu Rina</p>
                    </div>
                    <span className="text-[10px] px-2 py-0.5 rounded bg-[#355c5a] text-[#fff9eb]">Tersedia</span>
                  </div>

                  <div className="p-3 bg-[#e6dfce] rounded-lg border border-[#a7b7bb] flex items-center justify-between">
                    <div>
                      <h4 className="font-bold text-xs text-[#242a38]">Skenario 2: Kritik Tidak Langsung</h4>
                      <p className="text-[11px] text-[#5c6d70]">Pantry & Dapur (Zona 1 - Kiri Atas) • Dimas</p>
                    </div>
                    <span className="text-[10px] px-2 py-0.5 rounded bg-[#355c5a] text-[#fff9eb]">Tersedia</span>
                  </div>

                  <div className="p-3 bg-[#e6dfce] rounded-lg border border-[#a7b7bb] flex items-center justify-between">
                    <div>
                      <h4 className="font-bold text-xs text-[#242a38]">Skenario 3: Revisi Mendadak & Negosiasi Tenggat</h4>
                      <p className="text-[11px] text-[#5c6d70]">Meeting Room (Zona 2 - Kiri Tengah) • Pak Hendra</p>
                    </div>
                    <span className="text-[10px] px-2 py-0.5 rounded bg-[#355c5a] text-[#fff9eb]">Tersedia</span>
                  </div>
                </div>
              </div>

              <div className="p-3 bg-[#f4ead5] border-t border-[#d1c7b5] flex justify-end">
                <button
                  onClick={closeTodoList}
                  className="px-4 py-2 bg-[#355c5a] text-[#fff9eb] rounded-md text-xs font-semibold hover:bg-[#2c4d4b] transition"
                >
                  Kembali ke Kantor (Tutup)
                </button>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

