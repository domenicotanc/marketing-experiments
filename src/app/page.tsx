import Link from "next/link";
import { prisma } from "@/lib/prisma";
import {
  CHANNEL_LABELS,
  ELEMENT_LABELS,
  type Channel,
  type ExperimentElement,
} from "@/types";

/**
 * Dashboard — lists all experiments grouped by status.
 * Server component: fetches data directly from the database.
 */

const STATUS_CONFIG = {
  RUNNING: {
    label: "Running",
    color: "bg-amber-100 border-amber-200 text-amber-800",
    icon: "play_circle",
  },
  DRAFT: {
    label: "Draft",
    color: "bg-slate-100 border-slate-200 text-slate-700",
    icon: "edit_note",
  },
  COMPLETED: {
    label: "Completed",
    color: "bg-emerald-100 border-emerald-200 text-emerald-800",
    icon: "check_circle",
  },
};

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const experiments = await prisma.experiment.findMany({
    include: {
      variants: true,
      metrics: true,
      learning: true,
    },
    orderBy: { createdAt: "desc" },
  });

  const grouped = {
    RUNNING: experiments.filter((e) => e.status === "RUNNING"),
    DRAFT: experiments.filter((e) => e.status === "DRAFT"),
    COMPLETED: experiments.filter((e) => e.status === "COMPLETED"),
  };

  const hasExperiments = experiments.length > 0;

  return (
    <div className="space-y-10">
      {/* Page header */}
      <div className="space-y-4">
        <h1 className="text-4xl md:text-5xl font-black tracking-tight text-foreground leading-tight">
          Experiments
        </h1>
        <p className="text-muted max-w-2xl text-lg font-medium leading-relaxed">
          Design, run, and learn from marketing experiments.{" "}
          {experiments.length} experiment
          {experiments.length !== 1 ? "s" : ""} total.
        </p>
      </div>

      {/* Empty state */}
      {!hasExperiments && (
        <div className="glass-panel rounded-3xl text-center py-20 px-8">
          <span className="material-symbols-outlined text-5xl text-tertiary mb-4">
            science
          </span>
          <p className="text-muted text-lg font-medium mb-6">
            No experiments yet
          </p>
          <Link
            href="/experiments/new"
            className="inline-flex items-center space-x-2 bg-primary text-white px-6 py-3 rounded-xl font-bold hover:bg-primary-hover transition-all shadow-lg shadow-primary/20"
          >
            <span className="material-symbols-outlined text-[18px]">add</span>
            <span>Set up your first experiment</span>
          </Link>
        </div>
      )}

      {/* Experiment groups by status */}
      {(["RUNNING", "DRAFT", "COMPLETED"] as const).map((status) => {
        const group = grouped[status];
        if (group.length === 0) return null;
        const config = STATUS_CONFIG[status];

        return (
          <section key={status} className="space-y-4">
            <div className="flex items-center space-x-3">
              <span className="material-symbols-outlined text-muted text-[20px]">
                {config.icon}
              </span>
              <h2 className="text-[11px] font-black text-muted uppercase tracking-[0.15em]">
                {config.label} ({group.length})
              </h2>
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
              {group.map((experiment) => (
                <Link
                  key={experiment.id}
                  href={`/experiments/${experiment.id}`}
                  className="bg-white rounded-2xl p-6 group hover:shadow-md transition-all duration-300"
                  style={{ border: "1px solid #e2e8f0", boxShadow: "0 1px 3px 0 rgb(0 0 0 / 0.05)" }}
                >
                  <div className="flex justify-between items-start mb-4">
                    <div className="flex items-center space-x-2">
                      <span
                        className={`px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest border ${config.color}`}
                      >
                        {config.label}
                      </span>
                      <span className="bg-slate-100 border border-slate-200 text-muted px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest">
                        {CHANNEL_LABELS[experiment.channel as Channel]}
                      </span>
                      <span className="bg-primary/10 border border-primary/20 text-primary px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest">
                        {ELEMENT_LABELS[experiment.element as ExperimentElement]}
                      </span>
                    </div>
                    {experiment.learning && experiment.learning.liftPercent > 0 && (
                      <div className="text-right">
                        <div className="text-primary font-black text-2xl tracking-tighter">
                          +{experiment.learning.liftPercent.toFixed(1)}%
                        </div>
                        <div className="text-[9px] font-black uppercase tracking-widest text-muted">
                          Lift
                        </div>
                      </div>
                    )}
                  </div>

                  <h3 className="text-lg font-extrabold text-foreground leading-snug group-hover:text-primary transition-colors mb-2">
                    {experiment.name}
                  </h3>

                  {experiment.hypothesis && (
                    <p className="text-sm text-muted leading-relaxed font-medium line-clamp-2 mb-4">
                      {experiment.hypothesis}
                    </p>
                  )}

                  <div className="flex items-center space-x-6 pt-2 border-t border-border">
                    <div className="flex flex-col pt-3">
                      <span className="text-[9px] uppercase font-black text-tertiary tracking-wider">
                        Variants
                      </span>
                      <span className="text-xs font-bold text-secondary">
                        {experiment.variants.length}
                      </span>
                    </div>
                    <div className="flex flex-col pt-3">
                      <span className="text-[9px] uppercase font-black text-tertiary tracking-wider">
                        Metrics
                      </span>
                      <span className="text-xs font-bold text-secondary">
                        {experiment.metrics.map((m) => m.name).join(", ")}
                      </span>
                    </div>
                    <div className="flex flex-col pt-3 ml-auto">
                      <span className="text-[9px] uppercase font-black text-tertiary tracking-wider">
                        Created
                      </span>
                      <span className="text-xs font-bold text-secondary">
                        {new Date(experiment.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </section>
        );
      })}
    </div>
  );
}
