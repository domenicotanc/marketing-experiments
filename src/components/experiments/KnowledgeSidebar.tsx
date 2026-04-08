"use client";

import { useState, useEffect } from "react";

interface PastLearning {
  id: string;
  experimentName: string;
  winningVariant: string;
  liftPercent: number;
  confidence: number;
}

export default function KnowledgeSidebar({
  channel,
  element,
}: {
  channel: string;
  element: string;
}) {
  const [advice, setAdvice] = useState("");
  const [learnings, setLearnings] = useState<PastLearning[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [count, setCount] = useState(0);

  useEffect(() => {
    if (!channel || !element) return;

    setIsLoading(true);
    fetch("/api/learnings/synthesize", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ channel, element }),
    })
      .then((r) => r.json())
      .then((data) => {
        setAdvice(data.advice || "");
        setLearnings(data.learnings || []);
        setCount(data.count || 0);
      })
      .finally(() => setIsLoading(false));
  }, [channel, element]);

  if (!isLoading && count === 0) return null;
  if (isLoading) return null;

  return (
    <div className="glass-panel rounded-2xl p-6 border-purple-200 bg-purple-50/30">
      <h3 className="text-[10px] uppercase font-black text-purple-700 tracking-[0.2em] flex items-center mb-4">
        <span
          className="material-symbols-outlined text-sm mr-2"
          style={{ fontVariationSettings: "'FILL' 1" }}
        >
          psychology
        </span>
        From Your Team&apos;s Past Experiments
      </h3>

      {advice && (
        <p className="text-sm text-purple-800 leading-relaxed font-medium mb-4">
          {advice}
        </p>
      )}

      {learnings.length > 0 && (
        <div className="space-y-2 pt-3 border-t border-purple-200">
          <p className="text-[9px] uppercase font-black text-purple-600 tracking-wider">
            Related experiments ({count}):
          </p>
          {learnings.slice(0, 3).map((l) => (
            <div
              key={l.id}
              className="text-xs text-purple-700 font-medium flex items-center justify-between"
            >
              <span className="truncate">{l.experimentName}</span>
              {l.winningVariant && (
                <span className="text-purple-600 font-black flex-shrink-0 ml-2">
                  +{l.liftPercent.toFixed(0)}%
                </span>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
