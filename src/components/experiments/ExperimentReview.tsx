"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  CHANNEL_LABELS,
  ELEMENT_LABELS,
  type Channel,
  type ExperimentElement,
} from "@/types";
import type { ExperimentSetupData } from "./ExperimentSetupForm";
import type { VariantInput } from "./VariantDesigner";

export default function ExperimentReview({
  template,
  setup,
  variants,
  onBack,
}: {
  template: { element: string };
  setup: ExperimentSetupData;
  variants: VariantInput[];
  onBack: () => void;
}) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleCreate = async () => {
    setIsSubmitting(true);
    try {
      const response = await fetch("/api/experiments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: setup.name,
          element: template.element,
          channel: setup.channel,
          hypothesis: setup.hypothesis,
          audience: setup.audience,
          goal: setup.goal,
          baselineRate: setup.baselineRate,
          minimumLift: setup.minimumLift,
          sampleSizePerVariant: setup.sampleSizePerVariant,
          variants: variants.map((v) => ({
            name: v.name,
            content: v.content,
            description: v.description,
            prompt: v.prompt,
            url: v.url,
            isControl: v.isControl,
          })),
          metrics: setup.metrics,
        }),
      });

      if (response.ok) {
        const experiment = await response.json();
        router.push(`/experiments/${experiment.id}`);
      }
    } catch (error) {
      console.error("Failed to create experiment:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-2xl space-y-8">
      <div className="flex items-center gap-4 mb-2">
        <button
          type="button"
          onClick={onBack}
          className="w-10 h-10 rounded-xl glass-panel flex items-center justify-center text-muted hover:text-primary transition-colors"
        >
          <span className="material-symbols-outlined text-[20px]">
            arrow_back
          </span>
        </button>
        <h2 className="text-3xl font-black tracking-tight">
          Review your experiment
        </h2>
      </div>

      {/* Summary card */}
      <div className="glass-panel rounded-3xl p-8 space-y-6">
        <div>
          <h3 className="text-xl font-extrabold">{setup.name}</h3>
          <div className="flex items-center gap-2 mt-3">
            <span className="bg-primary/10 border border-primary/20 text-primary px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest">
              {ELEMENT_LABELS[template.element as ExperimentElement]}
            </span>
            <span className="bg-slate-100 border border-slate-200 text-muted px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest">
              {CHANNEL_LABELS[setup.channel as Channel]}
            </span>
          </div>
        </div>

        {setup.audience && (
          <div>
            <p className="text-[9px] uppercase font-black text-tertiary tracking-widest mb-1">
              Audience
            </p>
            <p className="text-sm font-medium">{setup.audience}</p>
          </div>
        )}

        {setup.goal && (
          <div>
            <p className="text-[9px] uppercase font-black text-tertiary tracking-widest mb-1">
              Goal
            </p>
            <p className="text-sm font-medium">{setup.goal}</p>
          </div>
        )}

        <div>
          <p className="text-[9px] uppercase font-black text-tertiary tracking-widest mb-1">
            Hypothesis
          </p>
          <p className="text-sm font-medium">{setup.hypothesis}</p>
        </div>

        {/* Metrics */}
        <div>
          <p className="text-[9px] uppercase font-black text-tertiary tracking-widest mb-2">
            Metrics
          </p>
          <div className="flex flex-wrap gap-2">
            {setup.metrics.map((m, i) => (
              <span
                key={i}
                className={`text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded-lg border ${
                  m.isPrimary
                    ? "bg-primary text-white border-primary"
                    : "bg-slate-100 text-muted border-slate-200"
                }`}
              >
                {m.name}
              </span>
            ))}
          </div>
        </div>

        {/* Sample size */}
        <div className="glass-panel-heavy rounded-2xl p-5">
          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col">
              <span className="text-[9px] uppercase font-black text-tertiary tracking-widest mb-1">
                Per Variant
              </span>
              <span className="text-xl font-black text-primary">
                {setup.sampleSizePerVariant.toLocaleString()}
              </span>
            </div>
            <div className="flex flex-col">
              <span className="text-[9px] uppercase font-black text-tertiary tracking-widest mb-1">
                Total
              </span>
              <span className="text-xl font-black text-foreground">
                {(
                  (setup.numberOfVariants + 1) *
                  setup.sampleSizePerVariant
                ).toLocaleString()}
              </span>
            </div>
          </div>
          <p className="text-[10px] text-tertiary font-bold mt-2 uppercase tracking-wider">
            Detecting {(setup.minimumLift * 100).toFixed(0)}% lift from{" "}
            {(setup.baselineRate * 100).toFixed(1)}% baseline
          </p>
        </div>

        {/* Variants */}
        <div>
          <p className="text-[9px] uppercase font-black text-tertiary tracking-widest mb-3">
            Variants
          </p>
          <div className="space-y-3">
            {variants.map((v, i) => (
              <div
                key={i}
                className={`rounded-xl p-4 border text-sm ${
                  v.isControl
                    ? "border-primary/20 bg-primary/[0.02]"
                    : "border-border bg-slate-50"
                }`}
              >
                <div className="flex items-center gap-2 mb-2">
                  <span className="font-extrabold text-sm">{v.name}</span>
                  {v.isControl && (
                    <span className="text-[10px] font-black text-primary uppercase tracking-widest">
                      Control
                    </span>
                  )}
                </div>
                <p className="font-medium">{v.content}</p>
                {v.description && (
                  <p className="text-xs text-muted mt-1.5 font-medium">
                    {v.description}
                  </p>
                )}
                {v.prompt && (
                  <div className="mt-2 bg-purple-50 border border-purple-200 rounded-lg px-3 py-2">
                    <p className="text-[9px] uppercase font-black text-purple-700 tracking-wider mb-1">
                      AI Prompt
                    </p>
                    <p className="text-xs text-purple-800 font-medium">
                      {v.prompt}
                    </p>
                  </div>
                )}
                {v.url && (
                  <p className="text-xs text-primary mt-1.5 font-medium">
                    URL: {v.url}
                  </p>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      <button
        type="button"
        onClick={handleCreate}
        disabled={isSubmitting}
        className="bg-primary text-white px-8 py-4 rounded-xl font-bold flex items-center space-x-3 hover:bg-primary-hover transition-all shadow-lg shadow-primary/20
                   disabled:opacity-50 disabled:cursor-not-allowed"
      >
        <span className="material-symbols-outlined text-[18px]">science</span>
        <span>{isSubmitting ? "Creating..." : "Create Experiment"}</span>
      </button>
    </div>
  );
}
