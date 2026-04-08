"use client";

/**
 * Template picker grid — Step 1 of experiment creation.
 * Shows 5 experiment type cards the marketer can choose from.
 */

interface Template {
  id: string;
  name: string;
  element: string;
  description: string;
  defaultHypothesis: string;
  defaultMetrics: { name: string; isPrimary: boolean }[];
  variantFramework: {
    controlLabel: string;
    challengerLabel: string;
    suggestedVariants: number;
    guidance: string;
  };
  guidingQuestions: string[];
}

const ELEMENT_ICONS: Record<string, string> = {
  MESSAGING: "chat_bubble",
  CTA: "touch_app",
  VALUE_PROP: "lightbulb",
  AUDIENCE: "group",
  TIMING: "schedule",
};

export default function TemplatePicker({
  templates,
  onSelect,
}: {
  templates: Template[];
  onSelect: (template: Template) => void;
}) {
  return (
    <div className="space-y-8">
      <div className="space-y-4">
        <h2 className="text-3xl md:text-4xl font-black tracking-tight text-foreground">
          Choose an experiment type
        </h2>
        <p className="text-muted max-w-2xl text-lg font-medium leading-relaxed">
          Pick the type of element you want to test. Each template comes with
          suggested metrics, a hypothesis framework, and guided setup.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {templates.map((template) => (
          <button
            key={template.id}
            onClick={() => onSelect(template)}
            className="glass-panel text-left p-8 rounded-2xl group
                       hover:border-primary/30 hover:shadow-md transition-all duration-300
                       flex flex-col gap-5"
          >
            <div className="w-12 h-12 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary group-hover:bg-primary group-hover:text-white transition-all duration-300">
              <span className="material-symbols-outlined">
                {ELEMENT_ICONS[template.element] || "science"}
              </span>
            </div>
            <div>
              <h3 className="font-extrabold text-lg text-foreground group-hover:text-primary transition-colors">
                {template.name}
              </h3>
              <p className="text-sm text-muted leading-relaxed font-medium mt-2">
                {template.description}
              </p>
            </div>
            <div className="flex items-center text-xs font-bold text-primary mt-auto pt-2 opacity-0 group-hover:opacity-100 transition-opacity">
              <span>Get started</span>
              <span className="material-symbols-outlined text-sm ml-1 group-hover:translate-x-1 transition-transform">
                arrow_forward
              </span>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}

export type { Template };
