"use client";

import { useState, useEffect } from "react";
import TemplatePicker, {
  type Template,
} from "@/components/experiments/TemplatePicker";
import ExperimentSetupForm, {
  type ExperimentSetupData,
} from "@/components/experiments/ExperimentSetupForm";
import VariantDesigner, {
  type VariantInput,
  type VariantMode,
} from "@/components/experiments/VariantDesigner";
import ExperimentReview from "@/components/experiments/ExperimentReview";

/**
 * New Experiment page — multi-step wizard:
 *   1. Pick a template
 *   2. Fill in experiment context
 *   3. (CTA/VALUE_PROP only) Choose copy vs design mode
 *   4. Design variants
 *   5. Review & create
 *
 * Mode logic:
 *   MESSAGING → always text (skip mode select)
 *   AUDIENCE/TIMING → always structural (skip mode select)
 *   CTA/VALUE_PROP → ask "copy or design?" before variants
 */

type Step = "template" | "setup" | "mode-select" | "variants" | "review";

/** Determine the variant mode from element type, or null if user must choose */
function resolveMode(element: string): VariantMode | null {
  if (element === "MESSAGING") return "text";
  if (element === "AUDIENCE" || element === "TIMING") return "structural";
  // CTA and VALUE_PROP need the marketer to choose
  return null;
}

export default function NewExperimentPage() {
  const [step, setStep] = useState<Step>("template");
  const [templates, setTemplates] = useState<Template[]>([]);
  const [selectedTemplate, setSelectedTemplate] = useState<Template | null>(
    null
  );
  const [setupData, setSetupData] = useState<ExperimentSetupData | null>(null);
  const [variantMode, setVariantMode] = useState<VariantMode>("text");
  const [variants, setVariants] = useState<VariantInput[]>([]);

  useEffect(() => {
    fetch("/api/templates")
      .then((res) => res.json())
      .then(setTemplates);
  }, []);

  const handleTemplateSelect = (template: Template) => {
    setSelectedTemplate(template);
    setStep("setup");
  };

  const handleSetupSubmit = (data: ExperimentSetupData) => {
    setSetupData(data);

    if (!selectedTemplate) return;
    const autoMode = resolveMode(selectedTemplate.element);

    if (autoMode) {
      // Mode is known — skip the mode select screen
      setVariantMode(autoMode);
      setStep("variants");
    } else {
      // CTA or VALUE_PROP — ask the marketer
      setStep("mode-select");
    }
  };

  const handleModeSelect = (mode: VariantMode) => {
    setVariantMode(mode);
    setStep("variants");
  };

  const handleVariantsSubmit = (v: VariantInput[]) => {
    setVariants(v);
    setStep("review");
  };

  // Build step indicator — only show mode-select if element requires it
  const needsModeSelect =
    selectedTemplate &&
    (selectedTemplate.element === "CTA" ||
      selectedTemplate.element === "VALUE_PROP");

  const stepList: { key: Step; label: string }[] = [
    { key: "template", label: "Type" },
    { key: "setup", label: "Setup" },
    ...(needsModeSelect
      ? [{ key: "mode-select" as Step, label: "Mode" }]
      : []),
    { key: "variants", label: "Variants" },
    { key: "review", label: "Review" },
  ];
  const currentStepIndex = stepList.findIndex((s) => s.key === step);

  return (
    <div>
      {/* Step indicator */}
      <div className="glass-panel rounded-2xl px-6 py-4 mb-10 flex items-center gap-1">
        {stepList.map((s, i) => (
          <div key={s.key} className="flex items-center gap-1">
            <div className="flex items-center gap-2.5">
              <div
                className={`w-8 h-8 rounded-lg flex items-center justify-center text-xs font-black ${
                  i < currentStepIndex
                    ? "bg-emerald-100 text-emerald-700"
                    : i === currentStepIndex
                      ? "bg-primary text-white"
                      : "bg-slate-100 text-tertiary"
                }`}
              >
                {i < currentStepIndex ? (
                  <span className="material-symbols-outlined text-[16px]">
                    check
                  </span>
                ) : (
                  i + 1
                )}
              </div>
              <span
                className={`text-sm font-bold ${
                  i <= currentStepIndex ? "text-foreground" : "text-tertiary"
                }`}
              >
                {s.label}
              </span>
            </div>
            {i < stepList.length - 1 && (
              <div className="w-12 h-px bg-border mx-2" />
            )}
          </div>
        ))}
      </div>

      {/* Step 1: Template picker */}
      {step === "template" && (
        <TemplatePicker templates={templates} onSelect={handleTemplateSelect} />
      )}

      {/* Step 2: Setup form */}
      {step === "setup" && selectedTemplate && (
        <ExperimentSetupForm
          template={selectedTemplate}
          onSubmit={handleSetupSubmit}
          onBack={() => setStep("template")}
        />
      )}

      {/* Step 3 (conditional): Copy vs Design mode selector */}
      {step === "mode-select" && selectedTemplate && (
        <ModeSelector
          element={selectedTemplate.element}
          onSelect={handleModeSelect}
          onBack={() => setStep("setup")}
        />
      )}

      {/* Step 4: Variant designer */}
      {step === "variants" && selectedTemplate && setupData && (
        <VariantDesigner
          mode={variantMode}
          element={selectedTemplate.element}
          channel={setupData.channel}
          audience={setupData.audience}
          goal={setupData.goal}
          numberOfVariants={setupData.numberOfVariants}
          guidance={selectedTemplate.variantFramework.guidance}
          onSubmit={handleVariantsSubmit}
          onBack={() => {
            // Go back to mode select if applicable, otherwise setup
            setStep(needsModeSelect ? "mode-select" : "setup");
          }}
        />
      )}

      {/* Step 5: Review & create */}
      {step === "review" &&
        selectedTemplate &&
        setupData &&
        variants.length > 0 && (
          <ExperimentReview
            template={selectedTemplate}
            setup={setupData}
            variants={variants}
            onBack={() => setStep("variants")}
          />
        )}
    </div>
  );
}

/**
 * Mode selector — shown only for CTA and VALUE_PROP experiments.
 * Asks the marketer whether they're testing copy or design/layout.
 */
function ModeSelector({
  element,
  onSelect,
  onBack,
}: {
  element: string;
  onSelect: (mode: VariantMode) => void;
  onBack: () => void;
}) {
  const label = element === "CTA" ? "CTA" : "Value Prop";

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
          What are you testing?
        </h2>
      </div>

      <p className="text-muted text-lg font-medium leading-relaxed">
        Your {label} test could focus on the words or the design. This
        determines how we set up your variants.
      </p>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Copy option */}
        <button
          onClick={() => onSelect("text")}
          className="bg-white rounded-2xl p-8 text-left group hover:shadow-md transition-all duration-300 flex flex-col gap-5"
          style={{ border: "1px solid #e2e8f0" }}
        >
          <div className="w-12 h-12 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary group-hover:bg-primary group-hover:text-white transition-all duration-300">
            <span className="material-symbols-outlined">edit_note</span>
          </div>
          <div>
            <h3 className="font-extrabold text-lg text-foreground group-hover:text-primary transition-colors">
              Testing copy
            </h3>
            <p className="text-sm text-muted leading-relaxed font-medium mt-2">
              You&apos;re changing the words — button text, headline, offer
              wording, or value statement. The layout and design stay the same.
            </p>
          </div>
          <p className="text-xs text-muted mt-auto">
            e.g., &ldquo;Start Free Trial&rdquo; vs &ldquo;Get Access
            Now&rdquo;
          </p>
        </button>

        {/* Design option */}
        <button
          onClick={() => onSelect("visual")}
          className="bg-white rounded-2xl p-8 text-left group hover:shadow-md transition-all duration-300 flex flex-col gap-5"
          style={{ border: "1px solid #e2e8f0" }}
        >
          <div className="w-12 h-12 rounded-xl bg-purple-100 border border-purple-200 flex items-center justify-center text-purple-600 group-hover:bg-purple-600 group-hover:text-white transition-all duration-300">
            <span className="material-symbols-outlined">palette</span>
          </div>
          <div>
            <h3 className="font-extrabold text-lg text-foreground group-hover:text-purple-600 transition-colors">
              Testing design
            </h3>
            <p className="text-sm text-muted leading-relaxed font-medium mt-2">
              You&apos;re changing the visual layout, placement, imagery, or
              structure. We&apos;ll generate design concepts and AI prompts for
              your tools.
            </p>
          </div>
          <p className="text-xs text-muted mt-auto">
            e.g., CTA above fold vs below fold, video hero vs static image
          </p>
        </button>
      </div>
    </div>
  );
}
