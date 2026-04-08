"use client";

import { useState } from "react";

/**
 * Variant designer — Step 3 of experiment creation.
 * Mode is determined by element type, not channel:
 *   - Text: MESSAGING (always), CTA/VALUE_PROP when marketer picks "copy"
 *   - Visual: CTA/VALUE_PROP when marketer picks "design"
 *   - Structural: AUDIENCE, TIMING (always)
 *
 * For CTA and VALUE_PROP, the mode is passed in from the parent
 * via a toggle screen that asks "copy or design?"
 */

export type VariantMode = "text" | "visual" | "structural";

interface VariantInput {
  name: string;
  content: string;
  description: string;
  prompt: string;
  url: string;
  isControl: boolean;
}

export default function VariantDesigner({
  mode,
  element,
  channel,
  audience,
  goal,
  numberOfVariants,
  guidance,
  onSubmit,
  onBack,
}: {
  mode: VariantMode;
  element: string;
  channel: string;
  audience: string;
  goal: string;
  numberOfVariants: number;
  guidance: string;
  onSubmit: (variants: VariantInput[]) => void;
  onBack: () => void;
}) {

  const [variants, setVariants] = useState<VariantInput[]>(() => {
    const initial: VariantInput[] = [
      {
        name: "Control",
        content: "",
        description: "Your current approach",
        prompt: "",
        url: "",
        isControl: true,
      },
    ];
    for (let i = 0; i < numberOfVariants; i++) {
      initial.push({
        name: `Variant ${String.fromCharCode(66 + i)}`,
        content: "",
        description: "",
        prompt: "",
        url: "",
        isControl: false,
      });
    }
    return initial;
  });

  const [isGenerating, setIsGenerating] = useState(false);
  const [hasGenerated, setHasGenerated] = useState(false);
  const [copiedPromptIndex, setCopiedPromptIndex] = useState<number | null>(null);
  const [copiedBrief, setCopiedBrief] = useState(false);

  /** Build a full design brief from all variants — for handoff to designers */
  const buildDesignBrief = () => {
    const lines = [
      `DESIGN BRIEF — ${element} Experiment`,
      `Channel: ${channel}`,
      `Audience: ${audience}`,
      `Goal: ${goal}`,
      "",
      "---",
      "",
    ];
    variants.forEach((v) => {
      lines.push(`## ${v.name}${v.isControl ? " (Control)" : ""}`);
      lines.push("");
      lines.push(`**Concept:** ${v.content}`);
      if (v.description) lines.push(`**Rationale:** ${v.description}`);
      if (v.prompt) {
        lines.push("");
        lines.push(`**AI Prompt (paste into design tool):**`);
        lines.push(v.prompt);
      }
      lines.push("");
      lines.push("---");
      lines.push("");
    });
    return lines.join("\n");
  };

  const copyDesignBrief = () => {
    navigator.clipboard.writeText(buildDesignBrief());
    setCopiedBrief(true);
    setTimeout(() => setCopiedBrief(false), 2000);
  };

  const updateVariant = (
    index: number,
    field: keyof VariantInput,
    value: string
  ) => {
    setVariants((prev) => {
      const updated = [...prev];
      updated[index] = { ...updated[index], [field]: value };
      return updated;
    });
  };

  /** Auto-generate variants once control is filled */
  const generateVariants = async () => {
    const controlContent = variants[0].content;
    if (!controlContent.trim()) {
      alert("Please describe your control (current approach) first.");
      return;
    }

    setIsGenerating(true);
    try {
      const response = await fetch("/api/experiments/generate-variants", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          mode,
          element,
          channel,
          audience,
          goal,
          currentApproach: controlContent,
          numberOfVariants,
        }),
      });

      const suggestions = await response.json();

      setVariants((prev) => {
        const updated = [...prev];
        suggestions.forEach(
          (
            s: {
              name: string;
              content: string;
              rationale?: string;
              prompt?: string;
            },
            i: number
          ) => {
            if (i + 1 < updated.length) {
              updated[i + 1] = {
                ...updated[i + 1],
                name: s.name,
                content: s.content,
                description: s.rationale || "",
                prompt: s.prompt || "",
              };
            }
          }
        );
        return updated;
      });
      setHasGenerated(true);
    } catch (error) {
      console.error("Failed to generate variants:", error);
    } finally {
      setIsGenerating(false);
    }
  };

  const copyPrompt = (index: number) => {
    navigator.clipboard.writeText(variants[index].prompt);
    setCopiedPromptIndex(index);
    setTimeout(() => setCopiedPromptIndex(null), 2000);
  };

  const handleSubmit = () => {
    const hasContent = variants.every((v) => v.content.trim());
    if (!hasContent) {
      alert("Please fill in content for all variants.");
      return;
    }
    onSubmit(variants);
  };

  // Labels and placeholders per mode
  const modeConfig = {
    text: {
      controlLabel: "Current copy",
      controlPlaceholder:
        "Enter your current copy (subject line, CTA text, headline, etc.)...",
      challengerPlaceholder: "AI-generated copy — edit as needed",
    },
    visual: {
      controlLabel: "Current approach",
      controlPlaceholder:
        "Describe your current design (e.g., 'Static hero image with product screenshot, headline centered above fold, green CTA button')...",
      challengerPlaceholder: "AI-generated concept — edit as needed",
    },
    structural: {
      controlLabel:
        element === "AUDIENCE" ? "Control segment" : "Current timing",
      controlPlaceholder:
        element === "AUDIENCE"
          ? "Describe your primary audience segment (e.g., 'Active users, signed up in last 90 days, opened 3+ emails')..."
          : "Describe your current send timing (e.g., 'Tuesday 10am EST, weekly cadence')...",
      challengerPlaceholder: "AI-generated suggestion — edit as needed",
    },
  };

  const config = modeConfig[mode];

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
          Design your variants
        </h2>
      </div>

      {/* Guidance */}
      <div className="glass-panel-heavy rounded-2xl p-6">
        <h3 className="text-[10px] uppercase font-black text-primary tracking-[0.2em] flex items-center mb-3">
          <span
            className="material-symbols-outlined text-sm mr-2"
            style={{ fontVariationSettings: "'FILL' 1" }}
          >
            info
          </span>
          Guidance
        </h3>
        <p className="text-sm text-muted font-medium leading-relaxed">
          {guidance}
        </p>
      </div>

      {/* Control input — always shown first */}
      <div className="glass-panel rounded-2xl p-6 border-primary/20 bg-primary/[0.02]">
        <div className="flex items-center gap-3 mb-4">
          <span className="font-extrabold text-sm">Control</span>
          <span className="text-[10px] font-black uppercase tracking-widest bg-primary text-white px-2.5 py-0.5 rounded-lg">
            Control
          </span>
        </div>

        <textarea
          value={variants[0].content}
          onChange={(e) => updateVariant(0, "content", e.target.value)}
          rows={mode === "visual" ? 6 : 5}
          placeholder={config.controlPlaceholder}
          className="w-full bg-slate-50 border border-border rounded-xl px-4 py-3 text-sm font-medium placeholder-slate-400 focus:ring-2 focus:ring-primary/20 focus:outline-none resize-y"
        />

        {mode === "visual" && (
          <input
            type="text"
            value={variants[0].url}
            onChange={(e) => updateVariant(0, "url", e.target.value)}
            placeholder="URL of current page (optional)"
            className="w-full mt-3 bg-slate-50 border border-border rounded-xl px-4 py-2.5 text-xs font-medium text-muted placeholder-slate-400 focus:ring-2 focus:ring-primary/20 focus:outline-none"
          />
        )}
      </div>

      {/* Generate button — shown after control is entered, before generation */}
      {!hasGenerated && (
        <button
          type="button"
          onClick={generateVariants}
          disabled={isGenerating || !variants[0].content.trim()}
          className="w-full py-4 glass-panel rounded-2xl border-2 border-dashed border-primary/20
                     text-sm font-bold text-primary hover:bg-primary/5 transition-all
                     disabled:opacity-50 disabled:cursor-not-allowed
                     flex items-center justify-center space-x-2"
        >
          <span
            className="material-symbols-outlined text-[18px]"
            style={{ fontVariationSettings: "'FILL' 1" }}
          >
            auto_awesome
          </span>
          <span>
            {isGenerating
              ? "Generating variants..."
              : mode === "visual"
                ? "Generate variant concepts + AI prompts"
                : mode === "structural"
                  ? `Generate ${element === "AUDIENCE" ? "segment" : "timing"} suggestions`
                  : "Generate challenger variants"}
          </span>
        </button>
      )}

      {/* Challenger variants — shown after generation (or if user wants manual entry) */}
      {(hasGenerated ||
        variants.slice(1).some((v) => v.content.trim())) && (
        <div className="space-y-4">
          {variants.slice(1).map((variant, rawIndex) => {
            const index = rawIndex + 1;
            return (
              <div
                key={index}
                className="glass-panel rounded-2xl p-6"
              >
                <div className="flex items-center gap-3 mb-4 min-w-0">
                  <input
                    type="text"
                    value={variant.name}
                    onChange={(e) =>
                      updateVariant(index, "name", e.target.value)
                    }
                    className="font-extrabold text-sm bg-transparent border-none outline-none text-foreground min-w-0 flex-1"
                  />
                  <span className="text-[10px] font-black uppercase tracking-widest bg-amber-100 text-amber-700 border border-amber-200 px-2.5 py-0.5 rounded-lg flex-shrink-0">
                    Challenger
                  </span>
                </div>

                {/* Content — concept for visual, copy for text, description for structural */}
                <textarea
                  value={variant.content}
                  onChange={(e) =>
                    updateVariant(index, "content", e.target.value)
                  }
                  rows={mode === "visual" ? 6 : 5}
                  placeholder={config.challengerPlaceholder}
                  className="w-full bg-slate-50 border border-border rounded-xl px-4 py-3 text-sm font-medium placeholder-slate-400 focus:ring-2 focus:ring-primary/20 focus:outline-none resize-y"
                />

                {/* Rationale */}
                {variant.description && (
                  <div className="mt-3 bg-slate-50 border border-border rounded-xl px-4 py-2.5">
                    <p className="text-[9px] uppercase font-black text-tertiary tracking-wider mb-1">
                      Rationale
                    </p>
                    <p className="text-xs text-muted font-medium">
                      {variant.description}
                    </p>
                  </div>
                )}

                {/* AI Prompt — visual mode only */}
                {mode === "visual" && variant.prompt && (
                  <div className="mt-3 bg-purple-50 border border-purple-200 rounded-xl px-4 py-3">
                    <div className="flex items-center justify-between mb-2">
                      <p className="text-[9px] uppercase font-black text-purple-700 tracking-wider flex items-center">
                        <span className="material-symbols-outlined text-[12px] mr-1">
                          terminal
                        </span>
                        AI Prompt — Copy to your design tool
                      </p>
                      <button
                        onClick={() => copyPrompt(index)}
                        className="text-[10px] font-bold text-purple-600 hover:text-purple-800 flex items-center gap-1 transition-colors"
                      >
                        <span className="material-symbols-outlined text-[14px]">
                          {copiedPromptIndex === index
                            ? "check"
                            : "content_copy"}
                        </span>
                        {copiedPromptIndex === index ? "Copied!" : "Copy"}
                      </button>
                    </div>
                    <p className="text-xs text-purple-800 font-medium leading-relaxed whitespace-pre-wrap">
                      {variant.prompt}
                    </p>
                  </div>
                )}

                {/* URL field — visual mode only */}
                {mode === "visual" && (
                  <input
                    type="text"
                    value={variant.url}
                    onChange={(e) =>
                      updateVariant(index, "url", e.target.value)
                    }
                    placeholder="URL of built variant (add after you create it)"
                    className="w-full mt-3 bg-slate-50 border border-border rounded-xl px-4 py-2.5 text-xs font-medium text-muted placeholder-slate-400 focus:ring-2 focus:ring-primary/20 focus:outline-none"
                  />
                )}
              </div>
            );
          })}

          {/* Action buttons: regenerate + design brief export */}
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={generateVariants}
              disabled={isGenerating}
              className="flex-1 py-3 text-xs font-bold text-primary hover:bg-primary/5 rounded-xl transition-colors
                         disabled:opacity-50 disabled:cursor-not-allowed
                         flex items-center justify-center space-x-1"
            >
              <span className="material-symbols-outlined text-[14px]">
                refresh
              </span>
              <span>
                {isGenerating ? "Regenerating..." : "Regenerate variants"}
              </span>
            </button>

            {mode === "visual" && (
              <button
                type="button"
                onClick={copyDesignBrief}
                className="flex-1 py-3 text-xs font-bold text-purple-600 hover:bg-purple-50 rounded-xl transition-colors
                           flex items-center justify-center space-x-1"
              >
                <span className="material-symbols-outlined text-[14px]">
                  {copiedBrief ? "check" : "content_copy"}
                </span>
                <span>
                  {copiedBrief
                    ? "Brief copied!"
                    : "Copy Design Brief"}
                </span>
              </button>
            )}
          </div>
        </div>
      )}

      {/* Manual entry toggle — only if not yet generated */}
      {!hasGenerated && (
        <button
          type="button"
          onClick={() => setHasGenerated(true)}
          className="text-xs font-bold text-tertiary hover:text-muted transition-colors"
        >
          Or enter variants manually &rarr;
        </button>
      )}

      {/* Submit */}
      {hasGenerated && (
        <button
          type="button"
          onClick={handleSubmit}
          className="bg-primary text-white px-8 py-4 rounded-xl font-bold flex items-center space-x-3 hover:bg-primary-hover transition-all shadow-lg shadow-primary/20"
        >
          <span>Next: Review &amp; Create</span>
          <span className="material-symbols-outlined text-[18px]">
            arrow_forward
          </span>
        </button>
      )}
    </div>
  );
}

export type { VariantInput };
