/**
 * Shared type definitions for the Campaign Experimentation Workspace.
 * These types supplement Prisma-generated types with UI-specific structures.
 */

/** Experiment statuses reflecting the lifecycle: Draft → Running → Completed */
export type ExperimentStatus = "DRAFT" | "RUNNING" | "COMPLETED";

/** The element being tested — maps to experiment templates */
export type ExperimentElement =
  | "MESSAGING"
  | "CTA"
  | "VALUE_PROP"
  | "AUDIENCE"
  | "TIMING";

/** Marketing channels (metadata only — no platform integration) */
export type Channel =
  | "EMAIL"
  | "PAID_SOCIAL"
  | "LANDING_PAGE"
  | "SMS"
  | "ORGANIC_SOCIAL"
  | "OTHER";

/** Human-readable labels for channels */
export const CHANNEL_LABELS: Record<Channel, string> = {
  EMAIL: "Email",
  PAID_SOCIAL: "Paid Social",
  LANDING_PAGE: "Landing Page",
  SMS: "SMS",
  ORGANIC_SOCIAL: "Organic Social",
  OTHER: "Other",
};

/** Human-readable labels for experiment elements */
export const ELEMENT_LABELS: Record<ExperimentElement, string> = {
  MESSAGING: "Messaging",
  CTA: "CTA",
  VALUE_PROP: "Value Prop",
  AUDIENCE: "Audience",
  TIMING: "Timing",
};

/** Shape of an AI-generated variant suggestion */
export interface VariantSuggestion {
  name: string;
  content: string;
  rationale: string;
}

/** Shape of parsed results from an uploaded CSV/Excel file */
export interface ParsedResultRow {
  variantName: string;
  metrics: Record<string, number>;
  sampleSize: number;
}

/** Shape of the AI-generated results interpretation */
export interface ResultsInterpretation {
  summary: string;
  recommendation: string;
  nextSteps: string;
}
