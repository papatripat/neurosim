import { useState, useEffect, useCallback } from 'react';
import { DialogueMessage, EvaluationResult } from '../types/conversation';
import { MOCK_REPLIES, MOCK_EVALUATIONS } from '../config/scenarios';

export function useConversation() {
  const [activeScenarioId, setActiveScenarioId] = useState<string | null>(null);
  const [level, setLevel] = useState<1 | 2 | 3>(2);
  const [userGoal, setUserGoal] = useState('');
  const [transcript, setTranscript] = useState<DialogueMessage[]>([]);
  const [turnCount, setTurnCount] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [evaluation, setEvaluation] = useState<EvaluationResult | null>(null);
  const [previousAttempt, setPreviousAttempt] = useState<{
    evaluation: EvaluationResult;
    transcript: DialogueMessage[];
  } | null>(null);

  useEffect(() => {
    if (!activeScenarioId) return;
    const saved = localStorage.getItem(`neurosim_attempt_${activeScenarioId}`);
    if (saved) {
      try { setPreviousAttempt(JSON.parse(saved)); }
      catch { setPreviousAttempt(null); }
    } else {
      setPreviousAttempt(null);
    }
  }, [activeScenarioId]);

  const startConversation = useCallback(
    (scenarioId: string, initialText: string, lvl: 1 | 2 | 3, goal: string) => {
      setActiveScenarioId(scenarioId);
      setLevel(lvl);
      setUserGoal(goal);
      setTranscript([{ speaker: 'character', text: initialText }]);
      setTurnCount(0);
      setEvaluation(null);
    },
    [],
  );

  const sendMessage = useCallback(
    async (text: string) => {
      if (!activeScenarioId) return;
      const userMsg: DialogueMessage = { speaker: 'user', text };
      const next = [...transcript, userMsg];
      setTranscript(next);
      setTurnCount((c) => c + 1);
      setIsLoading(true);

      try {
        const res = await fetch('/api/chat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ scenarioId: activeScenarioId, level, transcript: next }),
        });
        if (!res.ok) throw new Error('offline');
        const data = await res.json();
        setTranscript([...next, { speaker: 'character', text: data.reply }]);
      } catch {
        // offline fallback pakai mock data
        const replies = MOCK_REPLIES[activeScenarioId] ?? MOCK_REPLIES['skenario-1'];
        const reply = replies[Math.min(turnCount, replies.length - 1)];
        setTimeout(() => setTranscript([...next, { speaker: 'character', text: reply }]), 400);
      } finally {
        setTimeout(() => setIsLoading(false), 450);
      }
    },
    [activeScenarioId, level, transcript, turnCount],
  );

  const skipTurn = useCallback(() => {
    if (activeScenarioId && !isLoading) {
      sendMessage('Saya perlu waktu sebentar untuk memikirkan ini.');
    }
  }, [activeScenarioId, isLoading, sendMessage]);

  const evaluateSession = useCallback(async () => {
    if (!activeScenarioId) return;
    setIsLoading(true);

    try {
      const res = await fetch('/api/evaluate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ scenarioId: activeScenarioId, level, userGoal, transcript }),
      });
      if (!res.ok) throw new Error('offline');
      const data: EvaluationResult = await res.json();
      setEvaluation(data);
      localStorage.setItem(
        `neurosim_attempt_${activeScenarioId}`,
        JSON.stringify({ evaluation: data, transcript }),
      );
    } catch {
      const fallback = MOCK_EVALUATIONS[activeScenarioId] ?? MOCK_EVALUATIONS['skenario-1'];
      setEvaluation(fallback);
      localStorage.setItem(
        `neurosim_attempt_${activeScenarioId}`,
        JSON.stringify({ evaluation: fallback, transcript }),
      );
    } finally {
      setIsLoading(false);
    }
  }, [activeScenarioId, level, userGoal, transcript]);

  const retrySession = useCallback(
    (initialText: string) => {
      if (evaluation) setPreviousAttempt({ evaluation, transcript });
      setTranscript([{ speaker: 'character', text: initialText }]);
      setTurnCount(0);
      setEvaluation(null);
    },
    [evaluation, transcript],
  );

  const resetSession = useCallback(() => {
    setActiveScenarioId(null);
    setTranscript([]);
    setTurnCount(0);
    setEvaluation(null);
  }, []);

  return {
    activeScenarioId, level, userGoal, transcript, turnCount,
    isLoading, evaluation, previousAttempt,
    startConversation, sendMessage, skipTurn, evaluateSession, retrySession, resetSession,
  };
}
