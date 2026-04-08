"use client";

import { useState, useEffect } from "react";
import { calculateSampleSize } from "@/lib/statistics";
import { CHANNEL_LABELS, type Channel } from "@/types";
import type { Template } from "./TemplatePicker";
import KnowledgeSidebar from "./KnowledgeSidebar";

export interface ExperimentSetupData {
  name: string;
  channel: Channel;
  audience: string;
  goal: string;
  hypothesis: string;
  baselineRate: number;
  minimumLift: number;
  sampleSizePerVariant: number;
  numberOfVariants: number;
  metrics: { name: string; isPrimary: boolean }[];
}

export default function ExperimentSetupForm({
  template,
  onSubmit,
  onBack,
}: {
  template: Template;
  onSubmit: (data: ExperimentSetupData) => void;
  onBack: () => void;
}) {
  const [name, setName] = useState("");

  // Set the default name on the client only to avoid hydration mismatch
  useEffect(() => {
    setName(`${template.name} — ${new Date().toLocaleDateString()}`);
  }, [template.name]);

  const [channel, setChannel] = useState<Channel>("EMAIL");
  const [audience, setAudience] = useState("");
  const [goal, setGoal] = useState("");
  const [hypothesis, setHypothesis] = useState(template.defaultHypothesis);
  const [baselineRate, setBaselineRate] = useState(20);
  const [minimumLift, setMinimumLift] = useState(10);
  const [numberOfVariants, setNumberOfVariants] = useState(
    template.variantFramework.suggestedVariants
  );
  const [metrics, setMetrics] = useState(template.defaultMetrics);
  const [newMetricName, setNewMetricName] = useState("");
  const [isGeneratingHypothesis, setIsGeneratingHypothesis] = useState(false);

  /**
   * Smart defaults — adjust baseline rate and metrics when channel changes.
   * Industry average benchmarks give marketers a sensible starting point.
   */
  const CHANNEL_DEFAULTS: Record<string, { baseline: number; metrics?: { name: string; isPrimary: boolean }[] }> = {
    EMAIL: { baseline: 21, metrics: [{ name: "Open Rate", isPrimary: true }, { name: "Click Rate", isPrimary: false }] },
    SMS: { baseline: 15 },
    PAID_SOCIAL: { baseline: 2 },
    LANDING_PAGE: { baseline: 3 },
    ORGANIC_SOCIAL: { baseline: 5 },
    OTHER: { baseline: 10 },
  };

  // Apply smart defaults when channel changes
  useEffect(() => {
    const defaults = CHANNEL_DEFAULTS[channel];
    if (defaults) {
      setBaselineRate(defaults.baseline);
      if (defaults.metrics) {
        setMetrics(defaults.metrics);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [channel]);

  /** Generate hypothesis using AI from the current context */
  const generateHypothesis = async () => {
    setIsGeneratingHypothesis(true);
    try {
      const res = await fetch("/api/experiments/generate-hypothesis", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          element: template.element,
          channel,
          audience,
          goal,
        }),
      });
      if (res.ok) {
        const data = await res.json();
        if (data.hypothesis) setHypothesis(data.hypothesis);
      }
    } catch (error) {
      console.error("Failed to generate hypothesis:", error);
    } finally {
      setIsGeneratingHypothesis(false);
    }
  };

  const [sampleSize, setSampleSize] = useState(0);
  useEffect(() => {
    if (baselineRate > 0 && minimumLift > 0) {
      const size = calculateSampleSize(baselineRate / 100, minimumLift / 100);
      setSampleSize(size);
    }
  }, [baselineRate, minimumLift]);

  const addMetric = () => {
    if (newMetricName.trim()) {
      setMetrics([
        ...metrics,
        { name: newMetricName.trim(), isPrimary: false },
      ]);
      setNewMetricName("");
    }
  };

  const removeMetric = (index: number) => {
    setMetrics(metrics.filter((_, i) => i !== index));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({
      name,
      channel,
      audience,
      goal,
      hypothesis,
      baselineRate: baselineRate / 100,
      minimumLift: minimumLift / 100,
      sampleSizePerVariant: sampleSize,
      numberOfVariants,
      metrics,
    });
  };

  return (
    <form onSubmit={handleSubmit} className="max-w-2xl space-y-8">
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
          {template.name}
        </h2>
      </div>

      {/* Proactive knowledge surfacing */}
      <KnowledgeSidebar channel={channel} element={template.element} />

      {/* Guiding questions */}
      <div className="glass-panel-heavy rounded-2xl p-6">
        <h3 className="text-[10px] uppercase font-black text-primary tracking-[0.2em] flex items-center mb-4">
          <span
            className="material-symbols-outlined text-sm mr-2"
            style={{ fontVariationSettings: "'FILL' 1" }}
          >
            help
          </span>
          Questions to Consider
        </h3>
        <ul className="text-sm text-muted space-y-2 font-medium">
          {template.guidingQuestions.map((q, i) => (
            <li key={i} className="flex items-start">
              <span className="text-primary mr-3 mt-1.5 w-1.5 h-1.5 rounded-full bg-primary flex-shrink-0"></span>
              <span>{q}</span>
            </li>
          ))}
        </ul>
      </div>

      {/* Form fields */}
      <div className="space-y-6">
        <div>
          <label className="block text-[10px] uppercase font-black text-muted tracking-[0.15em] mb-2">
            Experiment Name
          </label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            className="w-full border border-slate-300 bg-white rounded-xl px-4 py-3 text-sm font-medium focus:border-primary focus:ring-2 focus:ring-primary/20 focus:outline-none transition-colors"
          />
        </div>

        <div>
          <label className="block text-[10px] uppercase font-black text-muted tracking-[0.15em] mb-2">
            Channel
          </label>
          <select
            value={channel}
            onChange={(e) => setChannel(e.target.value as Channel)}
            className="w-full border border-slate-300 bg-white rounded-xl px-4 py-3 text-sm font-medium focus:border-primary focus:ring-2 focus:ring-primary/20 focus:outline-none transition-colors appearance-none cursor-pointer"
          >
            {Object.entries(CHANNEL_LABELS).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-[10px] uppercase font-black text-muted tracking-[0.15em] mb-2">
            Target Audience
          </label>
          <input
            type="text"
            value={audience}
            onChange={(e) => setAudience(e.target.value)}
            placeholder="e.g., Newsletter subscribers, B2B SaaS, 50k list"
            className="w-full border border-slate-300 bg-white rounded-xl px-4 py-3 text-sm font-medium placeholder-slate-400 focus:border-primary focus:ring-2 focus:ring-primary/20 focus:outline-none transition-colors"
          />
        </div>

        <div>
          <label className="block text-[10px] uppercase font-black text-muted tracking-[0.15em] mb-2">
            Goal
          </label>
          <input
            type="text"
            value={goal}
            onChange={(e) => setGoal(e.target.value)}
            placeholder="e.g., Increase email open rates for weekly newsletter"
            className="w-full border border-slate-300 bg-white rounded-xl px-4 py-3 text-sm font-medium placeholder-slate-400 focus:border-primary focus:ring-2 focus:ring-primary/20 focus:outline-none transition-colors"
          />
        </div>

        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="block text-[10px] uppercase font-black text-muted tracking-[0.15em]">
              Hypothesis
            </label>
            <button
              type="button"
              onClick={generateHypothesis}
              disabled={isGeneratingHypothesis}
              className="flex items-center gap-1 text-[10px] font-bold text-primary hover:text-primary-hover transition-colors disabled:opacity-50"
            >
              <span
                className="material-symbols-outlined text-[14px]"
                style={{ fontVariationSettings: "'FILL' 1" }}
              >
                auto_awesome
              </span>
              {isGeneratingHypothesis ? "Generating..." : "Generate with AI"}
            </button>
          </div>
          <textarea
            value={hypothesis}
            onChange={(e) => setHypothesis(e.target.value)}
            rows={3}
            className="w-full border border-slate-300 bg-white rounded-xl px-4 py-3 text-sm font-medium focus:border-primary focus:ring-2 focus:ring-primary/20 focus:outline-none transition-colors"
          />
          <p className="text-[10px] text-tertiary font-bold mt-1.5 uppercase tracking-wider">
            Write your own or generate from your context above
          </p>
        </div>

        {/* Metrics */}
        <div>
          <label className="block text-[10px] uppercase font-black text-muted tracking-[0.15em] mb-3">
            Metrics
          </label>
          <div className="space-y-2">
            {metrics.map((metric, i) => (
              <div
                key={i}
                className="flex items-center gap-3 px-4 py-2.5"
              >
                <span
                  className={`text-[10px] font-black uppercase tracking-widest px-2.5 py-0.5 rounded-lg border ${
                    metric.isPrimary
                      ? "bg-primary text-white border-primary"
                      : "bg-slate-100 text-muted border-slate-200"
                  }`}
                >
                  {metric.isPrimary ? "Primary" : "Secondary"}
                </span>
                <span className="text-sm font-semibold">{metric.name}</span>
                {!metric.isPrimary && (
                  <button
                    type="button"
                    onClick={() => removeMetric(i)}
                    className="ml-auto text-tertiary hover:text-danger transition-colors"
                  >
                    <span className="material-symbols-outlined text-[18px]">
                      close
                    </span>
                  </button>
                )}
              </div>
            ))}
          </div>
          <div className="flex gap-2 mt-3">
            <input
              type="text"
              value={newMetricName}
              onChange={(e) => setNewMetricName(e.target.value)}
              onKeyDown={(e) =>
                e.key === "Enter" && (e.preventDefault(), addMetric())
              }
              placeholder="Add a secondary metric..."
              className="flex-1 border border-slate-300 bg-white rounded-xl px-4 py-2.5 text-sm font-medium placeholder-slate-400 focus:border-primary focus:ring-2 focus:ring-primary/20 focus:outline-none transition-colors"
            />
            <button
              type="button"
              onClick={addMetric}
              className="px-4 py-2.5 glass-panel rounded-xl text-sm font-bold hover:bg-slate-50 transition-colors"
            >
              Add
            </button>
          </div>
        </div>

        {/* Statistical parameters */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-[10px] uppercase font-black text-muted tracking-[0.15em] mb-2">
              Current Baseline Rate (%)
            </label>
            <input
              type="number"
              value={baselineRate}
              onChange={(e) => setBaselineRate(Number(e.target.value))}
              min={0.1}
              max={100}
              step={0.1}
              className="w-full border border-slate-300 bg-white rounded-xl px-4 py-3 text-sm font-medium focus:border-primary focus:ring-2 focus:ring-primary/20 focus:outline-none transition-colors"
            />
          </div>
          <div>
            <label className="block text-[10px] uppercase font-black text-muted tracking-[0.15em] mb-2">
              Minimum Detectable Lift (%)
            </label>
            <input
              type="number"
              value={minimumLift}
              onChange={(e) => setMinimumLift(Number(e.target.value))}
              min={1}
              max={100}
              step={1}
              className="w-full border border-slate-300 bg-white rounded-xl px-4 py-3 text-sm font-medium focus:border-primary focus:ring-2 focus:ring-primary/20 focus:outline-none transition-colors"
            />
          </div>
        </div>

        {/* Sample size result */}
        {sampleSize > 0 && (
          <div className="glass-panel-heavy rounded-2xl p-6">
            <div className="grid grid-cols-2 gap-6">
              <div className="flex flex-col">
                <span className="text-[9px] uppercase font-black text-muted tracking-widest mb-1">
                  Per Variant
                </span>
                <span className="text-2xl font-black text-primary">
                  {sampleSize.toLocaleString()}
                </span>
              </div>
              <div className="flex flex-col">
                <span className="text-[9px] uppercase font-black text-muted tracking-widest mb-1">
                  Total ({numberOfVariants + 1} variants)
                </span>
                <span className="text-2xl font-black text-foreground">
                  {((numberOfVariants + 1) * sampleSize).toLocaleString()}
                </span>
              </div>
            </div>
            <p className="text-[10px] text-tertiary font-bold mt-3 uppercase tracking-wider">
              95% confidence, 80% power
            </p>
          </div>
        )}

        {/* Number of variants */}
        <div>
          <label className="block text-[10px] uppercase font-black text-muted tracking-[0.15em] mb-2">
            Number of Challenger Variants
          </label>
          <select
            value={numberOfVariants}
            onChange={(e) => setNumberOfVariants(Number(e.target.value))}
            className="w-full border border-slate-300 bg-white rounded-xl px-4 py-3 text-sm font-medium focus:border-primary focus:ring-2 focus:ring-primary/20 focus:outline-none transition-colors appearance-none cursor-pointer"
          >
            {[1, 2, 3].map((n) => (
              <option key={n} value={n}>
                {n} challenger{n > 1 ? "s" : ""} ({n + 1} total variants)
              </option>
            ))}
          </select>
        </div>
      </div>

      <button
        type="submit"
        className="bg-primary text-white px-8 py-4 rounded-xl font-bold flex items-center space-x-3 hover:bg-primary-hover transition-all shadow-lg shadow-primary/20"
      >
        <span>Next: Design Variants</span>
        <span className="material-symbols-outlined text-[18px]">
          arrow_forward
        </span>
      </button>
    </form>
  );
}
