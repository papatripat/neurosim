import React, { useState, useEffect, useCallback } from 'react';
import { SafetyBanner } from './components/layout/SafetyBanner';
import { Header } from './components/layout/Header';
import { ProposalModal } from './components/modals/ProposalModal';
import { CharacterCustomizerModal } from './components/modals/CharacterCustomizerModal';
import { CharacterCustomization } from './types/character';
import { DEFAULT_CHARACTER } from './config/characterOptions';
import { TodoListModal } from './components/modals/TodoListModal';
import { DialogueModal } from './components/modals/DialogueModal';
import { EvaluationModal } from './components/modals/EvaluationModal';
import { AuthModal, UserProfile } from './components/modals/AuthModal';
import { OnlineRoomModal } from './components/modals/OnlineRoomModal';
import { ScenarioList } from './components/scenarios/ScenarioList';
import { PhaserGame } from './game/PhaserGame';
import { EventBus, GAME_EVENTS } from './game/EventBus';
import { useConversation } from './hooks/useConversation';
import { SCENARIOS, INITIAL_TASKS } from './config/scenarios';
import { TextScale } from './components/ui/A11yControls';
import { OfficeTask } from './types/conversation';
import { OfficeRoom, CreateRoomInput } from './types/room';
import { DEFAULT_ROOMS, DEFAULT_CURRENT_ROOM } from './config/defaultRooms';

// Virtual office workspace components
import { GatherDock, UserStatus } from './components/gather/GatherDock';
import { ParticipantsDrawer, Participant } from './components/gather/ParticipantsDrawer';
import { OfficeChatDrawer, OfficeChatMessage } from './components/gather/OfficeChatDrawer';
import { WebcamWidget } from './components/gather/WebcamWidget';
import { ScreenShareWidget } from './components/gather/ScreenShareWidget';

const INITIAL_PARTICIPANTS: Participant[] = [
  {
    id: 'user-baginda',
    name: 'Baginda Putra Krista',
    role: 'Frontend UI/UX & Aksesibilitas',
    zone: 'Zona 5 · Workstation Utama',
    status: 'online',
    isNPC: false,
    portrait: '/assets/characters/resident/standing/south.png',
  },
  {
    id: 'member-priyoga',
    name: 'Priyoga Listyo Ananda',
    role: 'Game Engine & Phaser Lead',
    zone: 'Zona 5 · Workstation Utama',
    status: 'online',
    isNPC: false,
    portrait: '/assets/characters/resident/standing/south.png',
  },
  {
    id: 'member-rifat',
    name: 'Rifat Abhista',
    role: 'Backend & AI Architecture Lead',
    zone: 'Zona 5 · Workstation Utama',
    status: 'online',
    isNPC: false,
    portrait: '/assets/characters/resident/standing/south.png',
  },
  {
    id: 'npc-rina',
    name: 'Bu Rina',
    role: 'Atasan Tim Antarmuka',
    zone: 'Zona 4 · Ruangan Bos',
    status: 'busy',
    isNPC: true,
    scenarioId: 'skenario-1',
    portrait: '/assets/characters/office-worker/standing/south.png',
  },
  {
    id: 'npc-dimas',
    name: 'Dimas',
    role: 'Rekan Kerja Senior',
    zone: 'Zona 1 · Pantry & Dapur',
    status: 'pantry',
    isNPC: true,
    scenarioId: 'skenario-2',
    portrait: '/assets/characters/resident/standing/south.png',
  },
  {
    id: 'npc-hendra',
    name: 'Pak Hendra',
    role: 'Klien Pemilik Proyek',
    zone: 'Zona 2 · Meeting Room',
    status: 'online',
    isNPC: true,
    scenarioId: 'skenario-3',
    portrait: '/assets/characters/courier/standing/south.png',
  },
];

const INITIAL_CHAT_MESSAGES: OfficeChatMessage[] = [
  {
    id: 'm-1',
    sender: 'Priyoga',
    time: '14:30',
    text: 'Viewport kantor 2D 2752x1536 dan sistem kamera sudah aktif lancar ya tim.',
  },
  {
    id: 'm-2',
    sender: 'Rifat',
    time: '14:32',
    text: 'Siap, database MySQL dan proxy Gemini 3.5 Flash sudah terhubung.',
  },
  {
    id: 'm-3',
    sender: 'Bu Rina',
    time: '14:35',
    text: 'Halo tim, tolong perhatikan instruksi kerja di meja saya ya.',
  },
];

const getUserDisplayName = (user: UserProfile | null, fallback = 'Baginda'): string => {
  if (!user) return fallback;
  if (user.fullName && typeof user.fullName === 'string' && user.fullName.trim().length > 0) {
    const first = user.fullName.trim().split(' ')[0];
    if (first) return first;
  }
  return user.username || fallback;
};

export const App: React.FC = () => {
  const [mode, setMode] = useState<'2d' | 'list'>('2d');
  const [isProposalOpen, setIsProposalOpen] = useState(false);
  const [isTodoListOpen, setIsTodoListOpen] = useState(false);
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [isRoomModalOpen, setIsRoomModalOpen] = useState(false);

  // Online Multiplayer Room State
  const [availableRooms, setAvailableRooms] = useState<OfficeRoom[]>(() => {
    try {
      const saved = localStorage.getItem('neurosim_available_rooms');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch (e) {
      console.warn('Failed to parse neurosim_available_rooms:', e);
    }
    return DEFAULT_ROOMS;
  });

  const [currentRoom, setCurrentRoom] = useState<OfficeRoom>(() => {
    try {
      const savedCode = localStorage.getItem('neurosim_current_room_code');
      const savedRooms = localStorage.getItem('neurosim_available_rooms');
      const pool: OfficeRoom[] = savedRooms ? JSON.parse(savedRooms) : DEFAULT_ROOMS;
      if (savedCode && Array.isArray(pool)) {
        const found = pool.find((r) => r.code === savedCode);
        if (found) return found;
      }
    } catch (e) {
      console.warn('Failed to parse current room:', e);
    }
    return DEFAULT_CURRENT_ROOM;
  });

  // User Account & Session (MySQL Synced)
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(() => {
    try {
      const saved = localStorage.getItem('neurosim_current_user');
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });
  const [userHistory, setUserHistory] = useState<any[]>(() => {
    try {
      const saved = localStorage.getItem('neurosim_user_history');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const [tasks, setTasks] = useState<OfficeTask[]>(() => {
    try {
      const saved = localStorage.getItem('neurosim_tasks');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch (e) {
      console.warn('Failed to parse neurosim_tasks:', e);
    }
    return INITIAL_TASKS;
  });

  // A11y States
  const [reduceMotion, setReduceMotion] = useState(false);
  const [textScale, setTextScale] = useState<TextScale>('normal');
  const [highContrast, setHighContrast] = useState(false);

  // Apply accessibility settings directly to document root for real REM scaling & effects
  useEffect(() => {
    const root = document.documentElement;
    if (textScale === 'medium') {
      root.style.fontSize = '115%';
    } else if (textScale === 'large') {
      root.style.fontSize = '130%';
    } else {
      root.style.fontSize = '100%';
    }
  }, [textScale]);

  useEffect(() => {
    const root = document.documentElement;
    if (reduceMotion) {
      root.classList.add('reduce-motion');
    } else {
      root.classList.remove('reduce-motion');
    }
  }, [reduceMotion]);

  useEffect(() => {
    const root = document.documentElement;
    if (highContrast) {
      root.classList.add('high-contrast');
    } else {
      root.classList.remove('high-contrast');
    }
  }, [highContrast]);

  // Virtual office workspace states
  const [isMicOn, setIsMicOn] = useState(false);
  const [isCamOn, setIsCamOn] = useState(false);
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  const [isParticipantsOpen, setIsParticipantsOpen] = useState(false);
  const [isOfficeChatOpen, setIsOfficeChatOpen] = useState(false);
  const [userStatus, setUserStatus] = useState<UserStatus>('available');
  const [chatMessages, setChatMessages] = useState<OfficeChatMessage[]>(INITIAL_CHAT_MESSAGES);

  // Character Customizer State (Universal LPC Format)
  const [isCustomizerOpen, setIsCustomizerOpen] = useState(false);
  const [characterConfig, setCharacterConfig] = useState<CharacterCustomization>(() => {
    try {
      const saved = localStorage.getItem('neurosim_character_config');
      return saved ? JSON.parse(saved) : DEFAULT_CHARACTER;
    } catch {
      return DEFAULT_CHARACTER;
    }
  });

  // Simpan preferensi kustomisasi karakter ke localStorage
  useEffect(() => {
    localStorage.setItem('neurosim_character_config', JSON.stringify(characterConfig));
  }, [characterConfig]);

  // Check URL query param e.g. ?room=DEV-UIUX-26 on initial mount
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const roomParam = params.get('room');
      if (roomParam) {
        const upperCode = roomParam.trim().toUpperCase();
        const found = availableRooms.find((r) => r.code.toUpperCase() === upperCode);
        if (found) {
          setCurrentRoom(found);
          localStorage.setItem('neurosim_current_room_code', found.code);
        }
      }
    }
  }, [availableRooms]);

  // Persistence for Rooms
  useEffect(() => {
    localStorage.setItem('neurosim_available_rooms', JSON.stringify(availableRooms));
  }, [availableRooms]);

  useEffect(() => {
    localStorage.setItem('neurosim_current_room_code', currentRoom.code);
  }, [currentRoom]);

  // Conversation hook
  const {
    activeScenarioId,
    level,
    userGoal,
    transcript,
    turnCount,
    isLoading,
    evaluation,
    previousAttempt,
    startConversation,
    sendMessage,
    skipTurn,
    evaluateSession,
    retrySession,
    resetSession,
  } = useConversation();

  useEffect(() => {
    if (mode === '2d') {
      const timer = setTimeout(() => {
        const game = (window as any).__PHASER_GAME__;
        if (game?.scale) { game.scale.refresh(); }
        window.dispatchEvent(new Event('resize'));
      }, 60);
      return () => clearTimeout(timer);
    }
  }, [mode]);

  useEffect(() => {
    localStorage.setItem('neurosim_tasks', JSON.stringify(tasks));
  }, [tasks]);

  useEffect(() => {
    if (evaluation && activeScenarioId) {
      setTasks((prev) =>
        prev.map((t) => (t.scenarioId === activeScenarioId ? { ...t, completed: true } : t))
      );

      // Simpan ke riwayat lokal user jika login
      if (currentUser) {
        const newRecord = {
          id: Date.now(),
          scenario_id: activeScenarioId,
          level,
          rekomendasi_level: evaluation.rekomendasi_level,
          created_at: new Date().toISOString(),
        };
        setUserHistory((prev) => {
          const updated = [newRecord, ...prev];
          localStorage.setItem('neurosim_user_history', JSON.stringify(updated));
          return updated;
        });
      }
    }
  }, [evaluation, activeScenarioId, currentUser, level]);

  const handleStartScenario = useCallback(
    (scenarioId: string, lvl: 1 | 2 | 3 = 2, goal?: string) => {
      const sc = SCENARIOS.find((s) => s.id === scenarioId);
      if (!sc) return;
      startConversation(scenarioId, sc.initialDialogue, lvl, goal || sc.defaultGoal);
    },
    [startConversation]
  );

  // Listen to Phaser [E] interaction event
  useEffect(() => {
    const handleOpenDialog = (data: { scenarioId: string; level?: 1 | 2 | 3; goal?: string }) => {
      handleStartScenario(data.scenarioId, data.level ?? 2, data.goal);
    };

    const handleOpenTodoList = () => {
      setIsTodoListOpen(true);
    };

    EventBus.on(GAME_EVENTS.OPEN_DIALOG, handleOpenDialog);
    EventBus.on(GAME_EVENTS.OPEN_TODO_LIST, handleOpenTodoList);

    return () => {
      EventBus.off(GAME_EVENTS.OPEN_DIALOG, handleOpenDialog);
      EventBus.off(GAME_EVENTS.OPEN_TODO_LIST, handleOpenTodoList);
    };
  }, [handleStartScenario]);

  // Pastikan Phaser mematikan penangkapan keyboard saat modal apa pun di React sedang terbuka
  useEffect(() => {
    const isAnyModalOpen =
      isAuthOpen ||
      isProposalOpen ||
      isTodoListOpen ||
      isOfficeChatOpen ||
      isParticipantsOpen ||
      isCustomizerOpen ||
      isRoomModalOpen;
    if (isAnyModalOpen) {
      EventBus.emit(GAME_EVENTS.PAUSE_INPUT);
    } else if (!activeScenarioId) {
      EventBus.emit(GAME_EVENTS.RESUME_INPUT);
    }
  }, [
    isAuthOpen,
    isProposalOpen,
    isTodoListOpen,
    isOfficeChatOpen,
    isParticipantsOpen,
    isCustomizerOpen,
    isRoomModalOpen,
    activeScenarioId,
  ]);

  const handleCloseDialogue = () => {
    resetSession();
    EventBus.emit(GAME_EVENTS.CLOSE_DIALOG);
  };

  const handleCloseTodoList = () => {
    setIsTodoListOpen(false);
    EventBus.emit(GAME_EVENTS.CLOSE_TODO_LIST);
  };

  const handleRetryDialogue = () => {
    if (!activeScenarioId) return;
    const sc = SCENARIOS.find((s) => s.id === activeScenarioId);
    if (!sc) return;
    retrySession(sc.initialDialogue);
  };

  const handleSendOfficeChat = (text: string) => {
    const now = new Date();
    const timeStr = `${String(now.getHours()).padStart(2, '0')}:${String(
      now.getMinutes()
    ).padStart(2, '0')}`;
    const newMsg: OfficeChatMessage = {
      id: `chat-${Date.now()}`,
      sender: getUserDisplayName(currentUser),
      time: timeStr,
      text,
      isSelf: true,
    };
    setChatMessages((prev) => [...prev, newMsg]);

    // Munculkan gelembung obrolan 2D di atas avatar Phaser
    EventBus.emit(GAME_EVENTS.TRIGGER_CHAT_BUBBLE, { text });
  };

  const handleSendReaction = (emoji: string) => {
    EventBus.emit(GAME_EVENTS.TRIGGER_REACTION, { emoji });
  };

  // Online Multiplayer Room Management Handlers
  const handleJoinRoom = useCallback(
    (roomCode: string, passcode?: string) => {
      const targetRoom = availableRooms.find(
        (r) => r.code.toUpperCase() === roomCode.trim().toUpperCase()
      );

      if (!targetRoom) {
        return {
          success: false,
          message: `Ruangan dengan kode "${roomCode}" tidak ditemukan.`,
        };
      }

      if (targetRoom.isPrivate && targetRoom.passcode) {
        if (!passcode || passcode.trim() !== targetRoom.passcode) {
          return {
            success: false,
            message: 'Kode sandi (passcode) ruangan salah. Periksa kembali sandi Anda.',
          };
        }
      }

      if (targetRoom.activeCount >= targetRoom.capacity) {
        return {
          success: false,
          message: `Ruangan "${targetRoom.name}" telah penuh (${targetRoom.capacity}/${targetRoom.capacity}).`,
        };
      }

      // Berhasil bergabung: perbarui ruangan aktif dan broadcast ke EventBus
      setCurrentRoom(targetRoom);
      EventBus.emit(GAME_EVENTS.ROOM_CHANGED, { room: targetRoom });

      // Tambahkan count peserta aktif untuk simulasi
      setAvailableRooms((prev) =>
        prev.map((r) =>
          r.id === targetRoom.id
            ? { ...r, activeCount: Math.min(r.capacity, r.activeCount + 1) }
            : r
        )
      );

      return { success: true };
    },
    [availableRooms]
  );

  const handleCreateRoom = useCallback(
    (input: CreateRoomInput) => {
      const newRoomCode =
        input.code?.trim().toUpperCase() ||
        `ROOM-${Math.floor(1000 + Math.random() * 9000)}`;

      const newRoom: OfficeRoom = {
        id: `room-${Date.now()}`,
        code: newRoomCode,
        name: input.name.trim(),
        description: input.description?.trim() || 'Ruangan kantor virtual NeuroSim',
        hostName: getUserDisplayName(currentUser),
        isPrivate: input.isPrivate,
        passcode: input.isPrivate ? input.passcode : undefined,
        capacity: input.capacity || 25,
        activeCount: 1,
        proximityAudio: input.proximityAudio,
        audioRadius: input.audioRadius,
        tags: ['Kustom', 'Online'],
        createdAt: 'Hari ini, baru saja',
      };

      setAvailableRooms((prev) => [newRoom, ...prev]);
      setCurrentRoom(newRoom);
      EventBus.emit(GAME_EVENTS.ROOM_CHANGED, { room: newRoom });
    },
    [currentUser]
  );

  const handleLoginSuccess = (user: UserProfile, history?: any[]) => {
    setCurrentUser(user);
    const hist = history || [];
    setUserHistory(hist);
    localStorage.setItem('neurosim_current_user', JSON.stringify(user));
    localStorage.setItem('neurosim_user_history', JSON.stringify(hist));
  };

  const handleLogout = () => {
    setCurrentUser(null);
    setUserHistory([]);
    localStorage.removeItem('neurosim_current_user');
    localStorage.removeItem('neurosim_user_history');
    setIsAuthOpen(false);
  };

  const completedCount = tasks.filter((t) => t.completed).length;
  const activeScenario = SCENARIOS.find((s) => s.id === activeScenarioId);

  return (
    <div
      className={`h-screen w-screen overflow-hidden flex flex-col bg-sand text-ink select-none ${
        reduceMotion ? 'motion-reduce' : ''
      } ${highContrast ? 'contrast-125' : ''}`}
    >
      {/* 1. Psychological Safety Banner */}
      <SafetyBanner onLearnMore={() => setIsProposalOpen(true)} />

      {/* 2. Top Header & Mode Switcher */}
      <Header
        mode={mode}
        onModeChange={setMode}
        reduceMotion={reduceMotion}
        onToggleReduceMotion={() => setReduceMotion((m) => !m)}
        textScale={textScale}
        onChangeTextScale={setTextScale}
        highContrast={highContrast}
        onToggleHighContrast={() => setHighContrast((c) => !c)}
        onOpenProposal={() => setIsProposalOpen(true)}
        onOpenTodoList={() => setIsTodoListOpen(true)}
        completedCount={completedCount}
        totalCount={tasks.length}
        currentUser={currentUser}
        onOpenAuth={() => setIsAuthOpen(true)}
        currentRoom={currentRoom}
        onOpenRoomModal={() => setIsRoomModalOpen(true)}
      />

      {/* 3. Main Workspace Viewport (Zero Scrollbar Overflow) */}
      <main className="flex-1 w-full min-h-0 relative overflow-hidden bg-[#0f1117]">
        <div className={`w-full h-full relative overflow-hidden flex items-center justify-center ${mode === '2d' ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}>
            {/* Phaser Game Canvas */}
            <PhaserGame />

            {/* Webcam / Video Preview Widget */}
            <WebcamWidget
              isOpen={isCamOn}
              onClose={() => setIsCamOn(false)}
              isMicOn={isMicOn}
              userName={getUserDisplayName(currentUser)}
              userAvatar={currentUser?.avatar}
            />

            {/* Screen Share Live Presentation Widget */}
            <ScreenShareWidget
              isOpen={isScreenSharing}
              onClose={() => setIsScreenSharing(false)}
              userName={getUserDisplayName(currentUser)}
            />

            {/* Bottom Action Dock */}
            <GatherDock
              isMicOn={isMicOn}
              onToggleMic={() => setIsMicOn((m) => !m)}
              isCamOn={isCamOn}
              onToggleCam={() => setIsCamOn((c) => !c)}
              isScreenSharing={isScreenSharing}
              onToggleScreenShare={() => setIsScreenSharing((s) => !s)}
              onOpenParticipants={() => setIsParticipantsOpen((p) => !p)}
              onOpenOfficeChat={() => setIsOfficeChatOpen((c) => !c)}
              onSendReaction={handleSendReaction}
              participantsCount={INITIAL_PARTICIPANTS.length}
              unreadChatCount={0}
              status={userStatus}
              onChangeStatus={setUserStatus}
              userName={getUserDisplayName(currentUser)}
              userAvatar={currentUser?.avatar}
              onOpenProfile={() => setIsAuthOpen(true)}
              onOpenCustomizer={() => setIsCustomizerOpen(true)}
            />

            {/* Slide-in Drawers */}
            <ParticipantsDrawer
              isOpen={isParticipantsOpen}
              onClose={() => setIsParticipantsOpen(false)}
              participants={INITIAL_PARTICIPANTS}
              onStartScenario={handleStartScenario}
              currentRoom={currentRoom}
              onOpenRoomModal={() => {
                setIsParticipantsOpen(false);
                setIsRoomModalOpen(true);
              }}
            />

            <OfficeChatDrawer
              isOpen={isOfficeChatOpen}
              onClose={() => setIsOfficeChatOpen(false)}
              messages={chatMessages}
              onSendMessage={handleSendOfficeChat}
            />
          </div>

        {/* List Skenario Viewport */}
        {mode === 'list' && (
          <div className="absolute inset-0 z-20 overflow-y-auto py-6 bg-sand">
            <ScenarioList
              scenarios={SCENARIOS}
              onStartScenario={(scId, lvl, goal) => {
                setMode('2d');
                handleStartScenario(scId, lvl, goal);
              }}
            />
          </div>
        )}
      </main>

      {/* 4. Active Dialogue Modal */}
      {activeScenario && !evaluation && (
        <DialogueModal
          isOpen={true}
          scenarioId={activeScenario.id}
          npcName={activeScenario.name}
          portraitSrc={activeScenario.portrait}
          userGoal={userGoal || activeScenario.defaultGoal}
          transcript={transcript}
          turnCount={turnCount}
          maxTurns={6}
          isLoading={isLoading}
          hintText={activeScenario.hint}
          onSendMessage={sendMessage}
          onSkipTurn={skipTurn}
          onExit={handleCloseDialogue}
          onRequestEvaluation={() => evaluateSession(currentUser?.id)}
        />
      )}

      {/* 5. Objective Evaluation Modal */}
      {activeScenario && evaluation && (
        <EvaluationModal
          isOpen={true}
          evaluation={evaluation}
          userGoal={userGoal || activeScenario.defaultGoal}
          transcript={transcript}
          previousAttempt={previousAttempt}
          onRetry={handleRetryDialogue}
          onNextScenario={handleCloseDialogue}
          onClose={handleCloseDialogue}
        />
      )}

      {/* 6. Central Corridor To-Do Board Modal */}
      <TodoListModal
        isOpen={isTodoListOpen}
        onClose={handleCloseTodoList}
        tasks={tasks}
        onSelectTask={(scId) => {
          setMode('2d');
          handleStartScenario(scId);
        }}
      />

      {/* 7. Proposal Dossier Modal */}
      <ProposalModal isOpen={isProposalOpen} onClose={() => setIsProposalOpen(false)} />

      {/* 8. Employee Auth & Profile Modal (MySQL Synced) */}
      <AuthModal
        isOpen={isAuthOpen}
        onClose={() => setIsAuthOpen(false)}
        currentUser={currentUser}
        onLoginSuccess={handleLoginSuccess}
        onLogout={handleLogout}
        userHistory={userHistory}
      />

      {/* 9. Character / Player Customizer Modal (Universal LPC Format) */}
      <CharacterCustomizerModal
        isOpen={isCustomizerOpen}
        onClose={() => setIsCustomizerOpen(false)}
        currentConfig={characterConfig}
        onSaveConfig={(newConfig) => {
          setCharacterConfig(newConfig);
        }}
      />

      {/* 10. Online Room Management Modal */}
      <OnlineRoomModal
        isOpen={isRoomModalOpen}
        onClose={() => setIsRoomModalOpen(false)}
        currentRoom={currentRoom}
        availableRooms={availableRooms}
        onJoinRoom={handleJoinRoom}
        onCreateRoom={handleCreateRoom}
        userName={getUserDisplayName(currentUser)}
      />
    </div>
  );
};

export default App;
