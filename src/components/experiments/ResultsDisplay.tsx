"use client";

import { useState, useEffect } from "react";

interface VariantResult {
  variantName: string;
  hasData: boolean;
  controlRate?: number;
  variantRate?: number;
  relativeLift?: number;
  pValue?: number;
  isSignificant?: boolean;
  confidence?: number;
  confidenceInterval?: [number, number];
}

interface MetricAnalysis {
  metricName: string;
  isPrimary: boolean;
  controlSampleSize: number;
  controlSuccesses: number;
  variantResults: VariantResult[];
}

interface Interpretation {
  summary: string;
  recommendation: string;
  nextSteps: string;
}

export default function ResultsDisplay({
  experimentId,
}: {
  experimentId: string;
}) {
  const [analysis, setAnalysis] = useState<MetricAnalysis[]>([]);
  const [interpretation, setInterpretation] = useState<Interpretation | null>(
    null
  );
  const [isInterpreting, setIsInterpreting] = useState(false);
  const [hasLoadedAnalysis, setHasLoadedAnalysis] = useState(false);

  useEffect(() => {
    fetch(`/api/experiments/${experimentId}/results`)
      .then((r) => r.json())
      .then((data) => {
        if (data.analysis) setAnalysis(data.analysis);
        setHasLoadedAnalysis(true);
      });
  }, [experimentId]);

  const generateInterpretation = async () => {
    setIsInterpreting(true);
    try {
      const res = await fetch(
        `/api/experiments/${experimentId}/interpret`,
        { method: "POST" }
      );
      if (res.ok) setInterpretation(await res.json());
    } catch (error) {
      console.error("Interpretation failed:", error);
    } finally {
      setIsInterpreting(false);
    }
  };

  if (!hasLoadedAnalysis || analysis.length === 0) return null;

  return (
    <div className="space-y-6">
      {/* Statistical results */}
      <section className="glass-panel rounded-2xl p-6">
        <h2 className="text-[10px] uppercase font-black text-primary tracking-[0.2em] flex items-center mb-6">
          <span className="material-symbols-outlined text-sm mr-2">
            analytics
          </span>
          Statistical Results
        </h2>

        {analysis.map((metric) => (
          <div key={metric.metricName} className="mb-6 last:mb-0">
            <h3 className="font-extrabold text-sm mb-3 flex items-center gap-2">
              {metric.metricName}
              {metric.isPrimary && (
                <span className="text-[10px] font-black text-primary uppercase tracking-widest">
                  Primary
                </span>
              )}
            </h3>

            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border text-left">
                    <th className="py-2.5 text-[9px] uppercase font-black text-tertiary tracking-wider">
                      Variant
                    </th>
                    <th className="py-2.5 text-[9px] uppercase font-black text-tertiary tracking-wider">
                      Rate
                    </th>
                    <th className="py-2.5 text-[9px] uppercase font-black text-tertiary tracking-wider">
                      Lift
                    </th>
                    <th className="py-2.5 text-[9px] uppercase font-black text-tertiary tracking-wider">
                      Confidence
                    </th>
                    <th className="py-2.5 text-[9px] uppercase font-black text-tertiary tracking-wider">
                      Result
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {/* Control */}
                  <tr className="border-b border-border bg-primary/[0.02]">
                    <td className="py-3 font-bold">Control</td>
                    <td className="py-3 font-bold">
                      {metric.controlSampleSize > 0
                        ? (
                            (metric.controlSuccesses /
                              metric.controlSampleSize) *
                            100
                          ).toFixed(1) + "%"
                        : "-"}
                    </td>
                    <td className="py-3 text-tertiary">—</td>
                    <td className="py-3 text-tertiary">—</td>
                    <td className="py-3">
                      <span className="text-[10px] font-black uppercase tracking-widest text-tertiary">
                        Baseline
                      </span>
                    </td>
                  </tr>

                  {/* Variants */}
                  {metric.variantResults.map((vr) => (
                    <tr
                      key={vr.variantName}
                      className="border-b border-border last:border-0"
                    >
                      <td className="py-3 font-bold">{vr.variantName}</td>
                      <td className="py-3 font-bold">
                        {vr.hasData
                          ? ((vr.variantRate || 0) * 100).toFixed(1) + "%"
                          : "-"}
                      </td>
                      <td className="py-3">
                        {vr.hasData ? (
                          <span
                            className={`font-black ${
                              (vr.relativeLift || 0) > 0
                                ? "text-emerald-600"
                                : (vr.relativeLift || 0) < 0
                                  ? "text-red-600"
                                  : ""
                            }`}
                          >
                            {((vr.relativeLift || 0) > 0 ? "+" : "") +
                              ((vr.relativeLift || 0) * 100).toFixed(1) +
                              "%"}
                          </span>
                        ) : (
                          "-"
                        )}
                      </td>
                      <td className="py-3 font-bold">
                        {vr.hasData
                          ? (vr.confidence || 0).toFixed(1) + "%"
                          : "-"}
                      </td>
                      <td className="py-3">
                        {vr.hasData ? (
                          <span
                            className={`text-[10px] font-black uppercase tracking-widest px-2.5 py-1 rounded-lg border ${
                              vr.isSignificant
                                ? (vr.relativeLift || 0) > 0
                                  ? "bg-emerald-100 text-emerald-700 border-emerald-200"
                                  : "bg-red-100 text-red-700 border-red-200"
                                : "bg-slate-100 text-tertiary border-slate-200"
                            }`}
                          >
                            {vr.isSignificant
                              ? (vr.relativeLift || 0) > 0
                                ? "Winner"
                                : "Loser"
                              : "Not Sig."}
                          </span>
                        ) : (
                          "-"
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ))}
      </section>

      {/* AI Interpretation */}
      {interpretation ? (
        <section className="glass-panel rounded-2xl p-6">
          <h2 className="text-[10px] uppercase font-black text-primary tracking-[0.2em] flex items-center mb-4">
            <span
              className="material-symbols-outlined text-sm mr-2"
              style={{ fontVariationSettings: "'FILL' 1" }}
            >
              auto_awesome
            </span>
            AI Interpretation
          </h2>
          <p className="text-sm font-medium leading-relaxed whitespace-pre-wrap mb-4">
            {interpretation.summary}
          </p>

          {interpretation.recommendation && (
            <div className="glass-panel-heavy rounded-xl p-4 mb-3">
              <p className="text-[9px] uppercase font-black text-emerald-600 tracking-widest mb-1">
                Recommendation
              </p>
              <p className="text-sm font-medium text-foreground">
                {interpretation.recommendation}
              </p>
            </div>
          )}

          {interpretation.nextSteps && (
            <div className="glass-panel-heavy rounded-xl p-4">
              <p className="text-[9px] uppercase font-black text-primary tracking-widest mb-1">
                What to Test Next
              </p>
              <p className="text-sm font-medium text-foreground">
                {interpretation.nextSteps}
              </p>
            </div>
          )}
        </section>
      ) : (
        <button
          onClick={generateInterpretation}
          disabled={isInterpreting}
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
            {isInterpreting
              ? "Generating interpretation..."
              : "Generate AI Interpretation"}
          </span>
        </button>
      )}
    </div>
  );
}
