"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import {
  CHANNEL_LABELS,
  ELEMENT_LABELS,
  type Channel,
  type ExperimentElement,
} from "@/types";
import ResultsDisplay from "@/components/experiments/ResultsDisplay";

interface Variant {
  id: string;
  name: string;
  content: string;
  description: string;
  prompt: string;
  url: string;
  isControl: boolean;
}

interface Metric {
  id: string;
  name: string;
  isPrimary: boolean;
}

interface Learning {
  id: string;
  summary: string;
  takeaway: string;
  winningVariant: string;
  liftPercent: number;
  confidence: number;
}

interface Experiment {
  id: string;
  name: string;
  element: string;
  channel: string;
  status: string;
  hypothesis: string;
  audience: string;
  goal: string;
  baselineRate: number;
  minimumLift: number;
  sampleSizePerVariant: number;
  createdAt: string;
  variants: Variant[];
  metrics: Metric[];
  learning: Learning | null;
}

const STATUS_CONFIG: Record<string, { label: string; color: string; icon: string }> =
  {
    DRAFT: {
      label: "Draft",
      color: "bg-slate-100 border-slate-200 text-slate-700",
      icon: "edit_note",
    },
    RUNNING: {
      label: "Running",
      color: "bg-amber-100 border-amber-200 text-amber-800",
      icon: "play_circle",
    },
    COMPLETED: {
      label: "Completed",
      color: "bg-emerald-100 border-emerald-200 text-emerald-800",
      icon: "check_circle",
    },
  };

export default function ExperimentDetailPage() {
  const params = useParams();
  const [experiment, setExperiment] = useState<Experiment | null>(null);
  const [showChecklist, setShowChecklist] = useState(false);

  const fetchExperiment = useCallback(async () => {
    const res = await fetch(`/api/experiments/${params.id}`);
    if (res.ok) {
      setExperiment(await res.json());
    }
  }, [params.id]);

  useEffect(() => {
    fetchExperiment();
  }, [fetchExperiment]);

  const updateStatus = async (status: string) => {
    await fetch(`/api/experiments/${params.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    fetchExperiment();
    setShowChecklist(false);
  };

  if (!experiment) {
    return <p className="text-muted font-medium">Loading...</p>;
  }

  const statusConfig =
    STATUS_CONFIG[experiment.status] || STATUS_CONFIG.DRAFT;

  return (
    <div className="max-w-4xl space-y-8">
      {/* Breadcrumb */}
      <nav className="flex text-[10px] font-bold text-primary tracking-[0.2em] uppercase space-x-3 items-center">
        <Link href="/" className="hover:text-primary-hover transition-colors">
          Experiments
        </Link>
        <span className="text-slate-300">/</span>
        <span className="text-muted">{experiment.name}</span>
      </nav>

      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="space-y-3">
          <h1 className="text-3xl md:text-4xl font-black tracking-tight">
            {experiment.name}
          </h1>
          <div className="flex items-center gap-2 flex-wrap">
            <span
              className={`px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest border ${statusConfig.color}`}
            >
              {statusConfig.label}
            </span>
            <span className="bg-primary/10 border border-primary/20 text-primary px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest">
              {ELEMENT_LABELS[experiment.element as ExperimentElement]}
            </span>
            <span className="bg-slate-100 border border-slate-200 text-muted px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest">
              {CHANNEL_LABELS[experiment.channel as Channel]}
            </span>
            <span className="text-[10px] font-bold text-tertiary uppercase tracking-wider">
              Created{" "}
              {new Date(experiment.createdAt).toLocaleDateString()}
            </span>
          </div>
        </div>

        {/* Status actions */}
        <div className="flex gap-2 flex-shrink-0">
          {experiment.status === "DRAFT" && (
            <button
              onClick={() => setShowChecklist(true)}
              className="bg-primary text-white px-5 py-2.5 rounded-xl font-bold flex items-center space-x-2 hover:bg-primary-hover transition-all shadow-lg shadow-primary/20 text-sm"
            >
              <span className="material-symbols-outlined text-[18px]">
                play_arrow
              </span>
              <span>Mark as Running</span>
            </button>
          )}
          {experiment.status === "RUNNING" && (
            <Link
              href={`/experiments/${experiment.id}/results`}
              className="bg-primary text-white px-5 py-2.5 rounded-xl font-bold flex items-center space-x-2 hover:bg-primary-hover transition-all shadow-lg shadow-primary/20 text-sm"
            >
              <span className="material-symbols-outlined text-[18px]">
                analytics
              </span>
              <span>Enter Results</span>
            </Link>
          )}
        </div>
      </div>

      {/* Pre-flight checklist */}
      {showChecklist && (
        <div className="glass-panel rounded-2xl p-6 border-amber-200 bg-amber-50/50">
          <h3 className="text-[10px] uppercase font-black text-amber-700 tracking-[0.2em] flex items-center mb-4">
            <span className="material-symbols-outlined text-sm mr-2">
              checklist
            </span>
            Pre-flight Checklist
          </h3>
          <ul className="space-y-3 text-sm text-amber-800 font-medium mb-5">
            <li>
              <label className="flex items-center gap-3 cursor-pointer">
                <input type="checkbox" className="rounded border-amber-300" />
                Have you set up the variants in your platform?
              </label>
            </li>
            <li>
              <label className="flex items-center gap-3 cursor-pointer">
                <input type="checkbox" className="rounded border-amber-300" />
                Is traffic being split evenly across variants?
              </label>
            </li>
            <li>
              <label className="flex items-center gap-3 cursor-pointer">
                <input type="checkbox" className="rounded border-amber-300" />
                Are you tracking:{" "}
                {experiment.metrics.map((m) => m.name).join(", ")}?
              </label>
            </li>
          </ul>
          {experiment.sampleSizePerVariant > 0 && (
            <p className="text-[10px] text-amber-600 font-bold uppercase tracking-wider mb-4">
              Required sample: {experiment.sampleSizePerVariant.toLocaleString()} per variant
            </p>
          )}
          <div className="flex gap-3">
            <button
              onClick={() => updateStatus("RUNNING")}
              className="px-5 py-2.5 bg-amber-600 text-white rounded-xl text-sm font-bold hover:bg-amber-700 transition-colors"
            >
              Confirm — Mark as Running
            </button>
            <button
              onClick={() => setShowChecklist(false)}
              className="px-5 py-2.5 text-sm font-bold text-muted hover:text-foreground transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Experiment details */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
        {/* Main content */}
        <div className="md:col-span-8 space-y-6">
          {/* Hypothesis */}
          {experiment.hypothesis && (
            <section className="glass-panel rounded-2xl p-6">
              <h2 className="text-[10px] uppercase font-black text-primary tracking-[0.2em] mb-3">
                Hypothesis
              </h2>
              <p className="text-sm font-medium leading-relaxed">
                {experiment.hypothesis}
              </p>
            </section>
          )}

          {/* Variants */}
          <section className="glass-panel rounded-2xl p-6">
            <h2 className="text-[10px] uppercase font-black text-primary tracking-[0.2em] mb-4">
              Variants
            </h2>
            <div className="space-y-3">
              {experiment.variants.map((variant) => (
                <VariantCard
                  key={variant.id}
                  variant={variant}
                  experimentId={experiment.id}
                  onUpdate={fetchExperiment}
                />
              ))}
            </div>
          </section>

          {/* Results & AI interpretation (if completed) */}
          {experiment.status === "COMPLETED" && (
            <ResultsDisplay experimentId={experiment.id} />
          )}

          {/* Learning */}
          {experiment.learning && (
            <section className="glass-panel rounded-2xl p-6">
              <h2 className="text-[10px] uppercase font-black text-primary tracking-[0.2em] flex items-center mb-4">
                <span
                  className="material-symbols-outlined text-sm mr-2"
                  style={{ fontVariationSettings: "'FILL' 1" }}
                >
                  bolt
                </span>
                Learning
              </h2>
              <p className="text-sm font-medium whitespace-pre-wrap leading-relaxed">
                {experiment.learning.summary}
              </p>
              {experiment.learning.takeaway && (
                <div className="mt-4 pt-4 border-t border-border">
                  <p className="text-[9px] uppercase font-black text-tertiary tracking-wider mb-1">
                    Team Takeaway
                  </p>
                  <p className="text-sm font-medium">
                    {experiment.learning.takeaway}
                  </p>
                </div>
              )}
            </section>
          )}
        </div>

        {/* Sidebar */}
        <div className="md:col-span-4 space-y-6">
          {/* Context */}
          {experiment.audience && (
            <div className="glass-panel-heavy rounded-2xl p-5">
              <p className="text-[9px] uppercase font-black text-tertiary tracking-widest mb-1">
                Audience
              </p>
              <p className="text-sm font-medium">{experiment.audience}</p>
            </div>
          )}
          {experiment.goal && (
            <div className="glass-panel-heavy rounded-2xl p-5">
              <p className="text-[9px] uppercase font-black text-tertiary tracking-widest mb-1">
                Goal
              </p>
              <p className="text-sm font-medium">{experiment.goal}</p>
            </div>
          )}

          {/* Metrics */}
          <div className="glass-panel-heavy rounded-2xl p-5">
            <p className="text-[9px] uppercase font-black text-tertiary tracking-widest mb-3">
              Metrics
            </p>
            <div className="flex flex-wrap gap-2">
              {experiment.metrics.map((metric) => (
                <span
                  key={metric.id}
                  className={`text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded-lg border ${
                    metric.isPrimary
                      ? "bg-primary text-white border-primary"
                      : "bg-white text-muted border-slate-200"
                  }`}
                >
                  {metric.name}
                </span>
              ))}
            </div>
          </div>

          {/* Sample size */}
          {experiment.sampleSizePerVariant > 0 && (
            <div className="glass-panel-heavy rounded-2xl p-5">
              <p className="text-[9px] uppercase font-black text-tertiary tracking-widest mb-1">
                Sample Required
              </p>
              <p className="text-xl font-black text-primary">
                {experiment.sampleSizePerVariant.toLocaleString()}
              </p>
              <p className="text-[10px] text-tertiary font-bold mt-1 uppercase tracking-wider">
                per variant &middot;{" "}
                {(experiment.minimumLift * 100).toFixed(0)}% lift from{" "}
                {(experiment.baselineRate * 100).toFixed(1)}%
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/**
 * Variant card — displays variant content, prompt, and editable URL field.
 * URLs can be added/edited post-creation for visual experiments.
 */
function VariantCard({
  variant,
  experimentId,
  onUpdate,
}: {
  variant: Variant;
  experimentId: string;
  onUpdate: () => void;
}) {
  const [editingUrl, setEditingUrl] = useState(false);
  const [urlValue, setUrlValue] = useState(variant.url || "");

  const saveUrl = async () => {
    await fetch(`/api/experiments/${experimentId}/variants`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ variantId: variant.id, url: urlValue }),
    });
    setEditingUrl(false);
    onUpdate();
  };

  return (
    <div
      className={`rounded-xl p-4 border text-sm ${
        variant.isControl
          ? "border-primary/20 bg-primary/[0.02]"
          : "border-border bg-slate-50"
      }`}
    >
      <div className="flex items-center gap-2 mb-2">
        <span className="font-extrabold">{variant.name}</span>
        {variant.isControl && (
          <span className="text-[10px] font-black text-primary uppercase tracking-widest">
            Control
          </span>
        )}
      </div>
      <p className="font-medium">{variant.content}</p>
      {variant.description && (
        <p className="text-xs text-muted mt-1.5 font-medium">
          {variant.description}
        </p>
      )}

      {/* AI prompt (visual experiments) */}
      {variant.prompt && (
        <div className="mt-3 bg-purple-50 border border-purple-200 rounded-lg px-3 py-2">
          <p className="text-[9px] uppercase font-black text-purple-700 tracking-wider mb-1">
            AI Prompt
          </p>
          <p className="text-xs text-purple-800 font-medium whitespace-pre-wrap">
            {variant.prompt}
          </p>
        </div>
      )}

      {/* URL — inline editable */}
      {(variant.url || variant.prompt) && (
        <div className="mt-3">
          {editingUrl ? (
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={urlValue}
                onChange={(e) => setUrlValue(e.target.value)}
                placeholder="https://..."
                className="flex-1 border border-slate-300 bg-white rounded-lg px-3 py-1.5 text-xs font-medium focus:border-primary focus:ring-2 focus:ring-primary/20 focus:outline-none"
              />
              <button
                onClick={saveUrl}
                className="px-3 py-1.5 bg-primary text-white rounded-lg text-xs font-bold"
              >
                Save
              </button>
              <button
                onClick={() => setEditingUrl(false)}
                className="text-xs font-bold text-muted"
              >
                Cancel
              </button>
            </div>
          ) : variant.url ? (
            <div className="flex items-center gap-2">
              <a
                href={variant.url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs text-primary font-bold hover:underline flex items-center gap-1"
              >
                {variant.url}
                <span className="material-symbols-outlined text-[12px]">
                  open_in_new
                </span>
              </a>
              <button
                onClick={() => setEditingUrl(true)}
                className="text-xs text-tertiary hover:text-muted"
              >
                <span className="material-symbols-outlined text-[14px]">
                  edit
                </span>
              </button>
            </div>
          ) : (
            <button
              onClick={() => setEditingUrl(true)}
              className="text-xs font-bold text-tertiary hover:text-primary transition-colors flex items-center gap-1"
            >
              <span className="material-symbols-outlined text-[14px]">
                add_link
              </span>
              Add variant URL
            </button>
          )}
        </div>
      )}
    </div>
  );
}
