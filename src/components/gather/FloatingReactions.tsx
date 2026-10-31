import React, { useEffect, useState } from 'react';

interface ReactionItem {
  id: number;
  emoji: string;
}

interface Props {
  reaction: string | null;
}

export const FloatingReactions: React.FC<Props> = ({ reaction }) => {
  const [activeReactions, setActiveReactions] = useState<ReactionItem[]>([]);

  useEffect(() => {
    if (!reaction) return;

    const id = Date.now();
    setActiveReactions((prev) => [...prev, { id, emoji: reaction }]);

    const timer = setTimeout(() => {
      setActiveReactions((prev) => prev.filter((r) => r.id !== id));
    }, 2400);

    return () => clearTimeout(timer);
  }, [reaction]);

  if (activeReactions.length === 0) return null;

  return (
    <div className="absolute inset-0 pointer-events-none z-30 flex items-center justify-center">
      <div className="relative -top-12 flex flex-col items-center gap-1">
        {activeReactions.map((r) => (
          <div
            key={r.id}
            className="px-3 py-1 bg-cream/95 border-2 border-teal rounded-full shadow-lg text-xl animate-bounce"
          >
            {r.emoji}
          </div>
        ))}
      </div>
    </div>
  );
};

