"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";

/**
 * Results entry page — two modes:
 *   1. Upload CSV/Excel file → AI parses and pre-fills
 *   2. Manual entry → per-variant, per-metric input
 *
 * After submission, redirects to the results interpretation page.
 */

interface Variant {
  id: string;
  name: string;
  isControl: boolean;
}

interface Metric {
  id: string;
  name: string;
  isPrimary: boolean;
}

interface Experiment {
  id: string;
  name: string;
  variants: Variant[];
  metrics: Metric[];
}

// Each cell in the results grid: variant × metric
interface ResultCell {
  variantId: string;
  metricId: string;
  sampleSize: number;
  successes: number;
}

export default function ResultsEntryPage() {
  const params = useParams();
  const router = useRouter();
  const [experiment, setExperiment] = useState<Experiment | null>(null);
  const [mode, setMode] = useState<"choose" | "upload" | "manual">("choose");
  const [results, setResults] = useState<ResultCell[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isParsing, setIsParsing] = useState(false);
  const [parseNotes, setParseNotes] = useState("");
  const [dragActive, setDragActive] = useState(false);

  const fetchExperiment = useCallback(async () => {
    const res = await fetch(`/api/experiments/${params.id}`);
    if (res.ok) {
      const data = await res.json();
      setExperiment(data);

      // Initialize empty results grid
      const cells: ResultCell[] = [];
      for (const variant of data.variants) {
        for (const metric of data.metrics) {
          cells.push({
            variantId: variant.id,
            metricId: metric.id,
            sampleSize: 0,
            successes: 0,
          });
        }
      }
      setResults(cells);
    }
  }, [params.id]);

  useEffect(() => {
    fetchExperiment();
  }, [fetchExperiment]);

  const updateCell = (
    variantId: string,
    metricId: string,
    field: "sampleSize" | "successes",
    value: number
  ) => {
    setResults((prev) =>
      prev.map((r) =>
        r.variantId === variantId && r.metricId === metricId
          ? { ...r, [field]: value }
          : r
      )
    );
  };

  // When sample size changes for one metric, update all metrics for that variant
  const updateSampleSize = (variantId: string, value: number) => {
    setResults((prev) =>
      prev.map((r) =>
        r.variantId === variantId ? { ...r, sampleSize: value } : r
      )
    );
  };

  /** Handle file upload — send to AI parsing endpoint */
  const handleFileUpload = async (file: File) => {
    if (!experiment) return;

    setIsParsing(true);
    setParseNotes("");

    const formData = new FormData();
    formData.append("file", file);

    try {
      const res = await fetch(
        `/api/experiments/${experiment.id}/parse-file`,
        { method: "POST", body: formData }
      );
      const data = await res.json();

      if (data.notes) setParseNotes(data.notes);

      if (data.results && data.results.length > 0) {
        // Map parsed results to our grid
        setResults((prev) => {
          const updated = [...prev];
          for (const parsed of data.results) {
            // Find the matching variant
            const variant = experiment.variants.find(
              (v) =>
                v.name.toLowerCase() === parsed.variantName?.toLowerCase()
            );
            if (!variant) continue;

            // Update sample size for this variant
            for (const cell of updated) {
              if (cell.variantId === variant.id) {
                cell.sampleSize = parsed.sampleSize || 0;
              }
            }

            // Update successes per metric
            if (parsed.metrics) {
              for (const [metricName, successes] of Object.entries(
                parsed.metrics
              )) {
                const metric = experiment.metrics.find(
                  (m) =>
                    m.name.toLowerCase() === metricName.toLowerCase()
                );
                if (!metric) continue;

                const cell = updated.find(
                  (c) =>
                    c.variantId === variant.id &&
                    c.metricId === metric.id
                );
                if (cell) {
                  cell.successes = successes as number;
                }
              }
            }
          }
          return updated;
        });

        setMode("manual"); // Show the pre-filled table for review
      }
    } catch (error) {
      console.error("File parse failed:", error);
      setParseNotes("Failed to parse file. Please try manual entry.");
    } finally {
      setIsParsing(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragActive(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFileUpload(file);
  };

  /** Submit results to the analysis endpoint */
  const handleSubmit = async () => {
    setIsSubmitting(true);
    try {
      const res = await fetch(`/api/experiments/${params.id}/results`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ results }),
      });

      if (res.ok) {
        router.push(`/experiments/${params.id}`);
      }
    } catch (error) {
      console.error("Failed to submit results:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!experiment) {
    return <p className="text-muted">Loading...</p>;
  }

  return (
    <div className="max-w-4xl">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm text-muted mb-6">
        <Link href="/" className="hover:text-foreground">
          Experiments
        </Link>
        <span>/</span>
        <Link
          href={`/experiments/${experiment.id}`}
          className="hover:text-foreground"
        >
          {experiment.name}
        </Link>
        <span>/</span>
        <span className="text-foreground">Enter Results</span>
      </div>

      <h1 className="text-2xl font-semibold mb-6">Enter Results</h1>

      {/* Mode chooser */}
      {mode === "choose" && (
        <div className="grid grid-cols-2 gap-4">
          <button
            onClick={() => setMode("upload")}
            className="p-8 rounded-lg border-2 border-dashed border-border bg-white
                       hover:border-primary hover:shadow-md transition-all text-left"
          >
            <p className="font-semibold text-lg mb-1">Upload file</p>
            <p className="text-sm text-muted">
              Drag and drop a CSV or Excel export from your marketing
              platform. AI will map the data automatically.
            </p>
          </button>

          <button
            onClick={() => setMode("manual")}
            className="p-8 rounded-lg border-2 border-dashed border-border bg-white
                       hover:border-primary hover:shadow-md transition-all text-left"
          >
            <p className="font-semibold text-lg mb-1">Enter manually</p>
            <p className="text-sm text-muted">
              Type in the sample sizes and metric values for each variant
              directly.
            </p>
          </button>
        </div>
      )}

      {/* File upload zone */}
      {mode === "upload" && (
        <div>
          <button
            onClick={() => setMode("choose")}
            className="text-sm text-muted hover:text-foreground mb-4"
          >
            &larr; Back
          </button>

          <div
            onDragOver={(e) => {
              e.preventDefault();
              setDragActive(true);
            }}
            onDragLeave={() => setDragActive(false)}
            onDrop={handleDrop}
            className={`p-12 rounded-lg border-2 border-dashed text-center
                        transition-colors ${
                          dragActive
                            ? "border-primary bg-blue-50"
                            : "border-border bg-white"
                        } ${isParsing ? "opacity-50" : ""}`}
          >
            {isParsing ? (
              <p className="text-muted">Parsing file with AI...</p>
            ) : (
              <>
                <p className="text-lg font-medium mb-2">
                  Drop your CSV or Excel file here
                </p>
                <p className="text-sm text-muted mb-4">
                  Or click to browse
                </p>
                <input
                  type="file"
                  accept=".csv,.xlsx,.xls"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) handleFileUpload(file);
                  }}
                  className="text-sm"
                />
              </>
            )}
          </div>

          {parseNotes && (
            <div className="mt-4 p-3 bg-amber-50 rounded-lg text-sm text-amber-800">
              <strong>AI notes:</strong> {parseNotes}
            </div>
          )}
        </div>
      )}

      {/* Manual entry / review table */}
      {mode === "manual" && (
        <div>
          <button
            onClick={() => setMode("choose")}
            className="text-sm text-muted hover:text-foreground mb-4"
          >
            &larr; Back
          </button>

          {parseNotes && (
            <div className="mb-4 p-3 bg-amber-50 rounded-lg text-sm text-amber-800">
              <strong>AI notes:</strong> {parseNotes}
            </div>
          )}

          <div className="bg-white rounded-lg border border-border overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left p-3 font-medium">Variant</th>
                  <th className="text-left p-3 font-medium">Sample Size</th>
                  {experiment.metrics.map((metric) => (
                    <th key={metric.id} className="text-left p-3 font-medium">
                      {metric.name}
                      {metric.isPrimary && (
                        <span className="text-xs text-primary ml-1">
                          (primary)
                        </span>
                      )}
                      <br />
                      <span className="text-xs text-muted font-normal">
                        successes
                      </span>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {experiment.variants.map((variant) => {
                  const sampleSizeCell = results.find(
                    (r) => r.variantId === variant.id
                  );

                  return (
                    <tr key={variant.id} className="border-b border-border last:border-0">
                      <td className="p-3">
                        <span className="font-medium">{variant.name}</span>
                        {variant.isControl && (
                          <span className="text-xs text-primary ml-1">
                            (Control)
                          </span>
                        )}
                      </td>
                      <td className="p-3">
                        <input
                          type="number"
                          min={0}
                          value={sampleSizeCell?.sampleSize || 0}
                          onChange={(e) =>
                            updateSampleSize(
                              variant.id,
                              parseInt(e.target.value) || 0
                            )
                          }
                          className="w-28 border border-border rounded px-2 py-1 text-sm"
                        />
                      </td>
                      {experiment.metrics.map((metric) => {
                        const cell = results.find(
                          (r) =>
                            r.variantId === variant.id &&
                            r.metricId === metric.id
                        );
                        return (
                          <td key={metric.id} className="p-3">
                            <input
                              type="number"
                              min={0}
                              value={cell?.successes || 0}
                              onChange={(e) =>
                                updateCell(
                                  variant.id,
                                  metric.id,
                                  "successes",
                                  parseInt(e.target.value) || 0
                                )
                              }
                              className="w-28 border border-border rounded px-2 py-1 text-sm"
                            />
                          </td>
                        );
                      })}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <div className="mt-6 flex gap-3">
            <button
              onClick={handleSubmit}
              disabled={isSubmitting}
              className="px-6 py-2.5 bg-primary text-white rounded-lg text-sm font-medium
                         hover:bg-primary-hover transition-colors
                         disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? "Analyzing..." : "Submit & Analyze Results"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
