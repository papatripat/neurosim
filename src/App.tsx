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
import { ScenarioList } from './components/scenarios/ScenarioList';
import { PhaserGame } from './game/PhaserGame';
import { EventBus, GAME_EVENTS } from './game/EventBus';
import { useConversation } from './hooks/useConversation';
import { SCENARIOS, INITIAL_TASKS } from './config/scenarios';
import { TextScale } from './components/ui/A11yControls';
import { OfficeTask } from './types/conversation';

// Gather.town virtual office components
import { GatherDock, UserStatus } from './components/gather/GatherDock';
import { ParticipantsDrawer, Participant } from './components/gather/ParticipantsDrawer';
import { OfficeChatDrawer, OfficeChatMessage } from './components/gather/OfficeChatDrawer';
import { WebcamWidget } from './components/gather/WebcamWidget';

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

export const App: React.FC = () => {
  const [mode, setMode] = useState<'2d' | 'list'>('2d');
  const [isProposalOpen, setIsProposalOpen] = useState(false);
  const [isTodoListOpen, setIsTodoListOpen] = useState(false);
  const [isAuthOpen, setIsAuthOpen] = useState(false);

  // User Account & Session (MySQL Synced)
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(() => {
    const saved = localStorage.getItem('neurosim_current_user');
    return saved ? JSON.parse(saved) : null;
  });
  const [userHistory, setUserHistory] = useState<any[]>(() => {
    const saved = localStorage.getItem('neurosim_user_history');
    return saved ? JSON.parse(saved) : [];
  });

  const [tasks, setTasks] = useState<OfficeTask[]>(() => {
    const saved = localStorage.getItem('neurosim_tasks');
    return saved ? JSON.parse(saved) : INITIAL_TASKS;
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

  // Gather.town Online Office States
  const [isMicOn, setIsMicOn] = useState(false);
  const [isCamOn, setIsCamOn] = useState(false);
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  const [isParticipantsOpen, setIsParticipantsOpen] = useState(false);
  const [isOfficeChatOpen, setIsOfficeChatOpen] = useState(false);
  const [isCustomizerOpen, setIsCustomizerOpen] = useState(false);
  const [characterConfig, setCharacterConfig] = useState<CharacterCustomization>(DEFAULT_CHARACTER);
  const [userStatus, setUserStatus] = useState<UserStatus>('available');
  const [chatMessages, setChatMessages] = useState<OfficeChatMessage[]>(INITIAL_CHAT_MESSAGES);

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
      isCustomizerOpen;
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
      id: `user-${Date.now()}`,
      sender: currentUser ? `${currentUser.fullName.split(' ')[0]} (Kamu)` : 'Baginda (Kamu)',
      time: timeStr,
      text,
      isSelf: true,
    };
    setChatMessages((prev) => [...prev, newMsg]);
    EventBus.emit(GAME_EVENTS.TRIGGER_CHAT_BUBBLE, { text });
  };

  const handleSendReaction = (emoji: string) => {
    EventBus.emit(GAME_EVENTS.TRIGGER_REACTION, { emoji });
  };

  const handleLoginSuccess = (user: UserProfile, history?: any[]) => {
    setCurrentUser(user);
    localStorage.setItem('neurosim_current_user', JSON.stringify(user));
    if (history) {
      setUserHistory(history);
      localStorage.setItem('neurosim_user_history', JSON.stringify(history));
    }
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
      />

      {/* 3. Main Workspace Viewport (Zero Scrollbar Overflow) */}
      <main className="flex-1 w-full min-h-0 relative overflow-hidden bg-[#0f1117]">
        {mode === '2d' ? (
          <div className="w-full h-full relative overflow-hidden flex items-center justify-center">
            {/* Phaser Game Canvas */}
            <PhaserGame />

            {/* Webcam / Video Preview Widget */}
            <WebcamWidget
              isOpen={isCamOn}
              onClose={() => setIsCamOn(false)}
              isMicOn={isMicOn}
            />

            {/* Bottom Gather.town Action Dock */}
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
              userName={currentUser ? currentUser.fullName.split(' ')[0] : 'Baginda'}
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
            />

            <OfficeChatDrawer
              isOpen={isOfficeChatOpen}
              onClose={() => setIsOfficeChatOpen(false)}
              messages={chatMessages}
              onSendMessage={handleSendOfficeChat}
            />
          </div>
        ) : (
          <div className="w-full h-full overflow-y-auto py-6 bg-sand">
            <ScenarioList scenarios={SCENARIOS} onStartScenario={handleStartScenario} />
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
        onSelectTask={(scId) => handleStartScenario(scId)}
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
    </div>
  );
};

export default App;
