"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import {
  CHANNEL_LABELS,
  ELEMENT_LABELS,
  type Channel,
  type ExperimentElement,
} from "@/types";

interface Learning {
  id: string;
  experimentId: string;
  summary: string;
  takeaway: string;
  channel: string;
  element: string;
  winningVariant: string;
  liftPercent: number;
  confidence: number;
  tags: string;
  createdAt: string;
  experiment: { id: string; name: string };
}

export default function KnowledgeBasePage() {
  const [learnings, setLearnings] = useState<Learning[]>([]);
  const [channelFilter, setChannelFilter] = useState("");
  const [elementFilter, setElementFilter] = useState("");
  const [search, setSearch] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editTakeaway, setEditTakeaway] = useState("");

  const fetchLearnings = useCallback(async () => {
    const params = new URLSearchParams();
    if (channelFilter) params.set("channel", channelFilter);
    if (elementFilter) params.set("element", elementFilter);
    if (search) params.set("search", search);

    const res = await fetch(`/api/learnings?${params}`);
    if (res.ok) setLearnings(await res.json());
  }, [channelFilter, elementFilter, search]);

  useEffect(() => {
    fetchLearnings();
  }, [fetchLearnings]);

  const saveTakeaway = async (learningId: string) => {
    await fetch(`/api/learnings/${learningId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ takeaway: editTakeaway }),
    });
    setEditingId(null);
    fetchLearnings();
  };

  const confidenceLabel = (c: number) => {
    if (c >= 99) return "Stat-Sig";
    if (c >= 95) return "Strong";
    if (c >= 90) return "Moderate";
    return "Weak";
  };

  return (
    <div className="space-y-10">
      {/* Page header */}
      <div className="space-y-4">
        <nav className="flex text-[10px] font-bold text-primary tracking-[0.2em] uppercase space-x-3 items-center">
          <span className="bg-primary/10 px-2 py-0.5 rounded">Repository</span>
          <span className="text-slate-300">/</span>
          <span className="text-muted">Marketing Learnings</span>
        </nav>
        <h1 className="text-4xl md:text-5xl font-black tracking-tight text-foreground leading-tight">
          Institutional <span className="text-primary">Knowledge</span>
        </h1>
        <p className="text-muted max-w-2xl text-lg font-medium leading-relaxed">
          A living archive of validated hypotheses, creative wins, and strategic
          pivots across your experimentation ecosystem.
        </p>
      </div>

      {/* Search & Filters */}
      <div className="glass-panel p-3 rounded-2xl flex flex-col md:flex-row items-center gap-3">
        <div className="flex-1 flex items-center px-4 bg-slate-50 rounded-xl h-14 w-full border border-border">
          <span className="material-symbols-outlined text-primary">search</span>
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search learnings by keyword, metric, or variant name..."
            className="bg-transparent border-none focus:ring-0 focus:outline-none text-sm w-full ml-3 text-foreground placeholder-slate-400 font-medium"
          />
        </div>
        <div className="flex items-center gap-3 w-full md:w-auto">
          <select
            value={channelFilter}
            onChange={(e) => setChannelFilter(e.target.value)}
            className="flex items-center px-5 h-14 bg-slate-50 hover:bg-slate-100 border border-border rounded-xl transition-all text-sm font-bold text-foreground min-w-[140px] appearance-none cursor-pointer"
          >
            <option value="">All Channels</option>
            {Object.entries(CHANNEL_LABELS).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
          <select
            value={elementFilter}
            onChange={(e) => setElementFilter(e.target.value)}
            className="flex items-center px-5 h-14 bg-slate-50 hover:bg-slate-100 border border-border rounded-xl transition-all text-sm font-bold text-foreground min-w-[140px] appearance-none cursor-pointer"
          >
            <option value="">All Elements</option>
            {Object.entries(ELEMENT_LABELS).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Empty state */}
      {learnings.length === 0 ? (
        <div className="glass-panel rounded-3xl text-center py-20 px-8">
          <span className="material-symbols-outlined text-5xl text-tertiary mb-4">
            menu_book
          </span>
          <p className="text-muted text-lg font-medium">
            {search || channelFilter || elementFilter
              ? "No learnings match your filters"
              : "No learnings yet. Complete an experiment to generate your first learning."}
          </p>
        </div>
      ) : (
        <section className="grid grid-cols-1 xl:grid-cols-2 gap-6">
          {learnings.map((learning) => (
            <article
              key={learning.id}
              className="bg-white border border-slate-200 shadow-sm rounded-3xl p-8 flex flex-col group hover:border-primary/30 transition-all duration-500"
            >
              {/* Header: badges + lift */}
              <div className="flex justify-between items-start mb-6">
                <div className="flex items-center space-x-2 flex-wrap gap-y-2">
                  <span className="bg-slate-100 border border-slate-200 text-muted px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest">
                    {CHANNEL_LABELS[learning.channel as Channel]}
                  </span>
                  <span className="bg-primary/10 border border-primary/20 text-primary px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest">
                    {ELEMENT_LABELS[learning.element as ExperimentElement]}
                  </span>
                </div>
                {learning.liftPercent > 0 && (
                  <div className="text-right flex-shrink-0">
                    <div className="text-primary font-black text-3xl tracking-tighter">
                      +{learning.liftPercent.toFixed(1)}%
                    </div>
                    <div className="text-[9px] font-black uppercase tracking-widest text-muted">
                      Lift Over Control
                    </div>
                  </div>
                )}
              </div>

              {/* Winner + experiment link */}
              {learning.winningVariant && (
                <h3 className="text-xl font-extrabold text-foreground leading-snug group-hover:text-primary transition-colors mb-2">
                  Winner: {learning.winningVariant}
                </h3>
              )}

              <Link
                href={`/experiments/${learning.experiment.id}`}
                className="text-xs font-bold text-secondary hover:text-primary transition-colors flex items-center mb-4"
              >
                {learning.experiment.name}
                <span className="material-symbols-outlined text-[12px] ml-1">
                  open_in_new
                </span>
              </Link>

              {/* Confidence + date */}
              <div className="flex items-center space-x-6 mb-6">
                {learning.confidence > 0 && (
                  <div className="flex flex-col">
                    <span className="text-[9px] uppercase font-black text-tertiary tracking-wider">
                      Confidence
                    </span>
                    <span className="text-xs font-bold text-primary">
                      {learning.confidence.toFixed(1)}% (
                      {confidenceLabel(learning.confidence)})
                    </span>
                  </div>
                )}
                <div className="flex flex-col">
                  <span className="text-[9px] uppercase font-black text-tertiary tracking-wider">
                    Date
                  </span>
                  <span className="text-xs font-bold text-secondary">
                    {new Date(learning.createdAt).toLocaleDateString()}
                  </span>
                </div>
              </div>

              {/* Takeaway panel */}
              <div className="mt-auto glass-panel-heavy rounded-xl p-6">
                <h4 className="text-[10px] uppercase font-black text-primary tracking-[0.2em] flex items-center mb-4">
                  <span
                    className="material-symbols-outlined text-sm mr-2"
                    style={{ fontVariationSettings: "'FILL' 1" }}
                  >
                    bolt
                  </span>
                  Strategic Takeaways
                </h4>

                <p className="text-sm text-muted leading-relaxed font-medium whitespace-pre-wrap">
                  {learning.summary}
                </p>

                {/* Editable team takeaway */}
                <div className="mt-4 pt-4 border-t border-border">
                  {editingId === learning.id ? (
                    <div className="space-y-3">
                      <textarea
                        value={editTakeaway}
                        onChange={(e) => setEditTakeaway(e.target.value)}
                        rows={2}
                        className="w-full border border-border rounded-xl px-4 py-3 text-sm font-medium focus:ring-2 focus:ring-primary/20 focus:outline-none"
                        placeholder="Add your team's takeaway..."
                      />
                      <div className="flex gap-2">
                        <button
                          onClick={() => saveTakeaway(learning.id)}
                          className="px-4 py-2 bg-primary text-white rounded-lg text-xs font-bold"
                        >
                          Save
                        </button>
                        <button
                          onClick={() => setEditingId(null)}
                          className="px-4 py-2 text-xs font-bold text-muted hover:text-foreground"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div
                      className="cursor-pointer group/takeaway"
                      onClick={() => {
                        setEditingId(learning.id);
                        setEditTakeaway(learning.takeaway);
                      }}
                    >
                      {learning.takeaway ? (
                        <>
                          <p className="text-[9px] uppercase font-black text-tertiary tracking-wider mb-1">
                            Team Notes
                          </p>
                          <p className="text-sm text-secondary font-medium">
                            {learning.takeaway}
                          </p>
                        </>
                      ) : (
                        <p className="text-xs font-bold text-tertiary group-hover/takeaway:text-primary transition-colors flex items-center">
                          <span className="material-symbols-outlined text-[14px] mr-1">
                            add
                          </span>
                          Add your team&apos;s takeaway
                        </p>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </article>
          ))}
        </section>
      )}

      {/* Footer count */}
      {learnings.length > 0 && (
        <footer className="pt-6 border-t border-border">
          <p className="text-xs text-muted font-bold uppercase tracking-widest">
            Showing {learnings.length} learning
            {learnings.length !== 1 ? "s" : ""}
          </p>
        </footer>
      )}
    </div>
  );
}
