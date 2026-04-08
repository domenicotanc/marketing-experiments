import OpenAI from "openai";

/**
 * Singleton OpenAI client instance.
 * Uses GPT-4o-mini for all AI features: variant generation,
 * results interpretation, and knowledge base synthesis.
 */

const globalForOpenAI = globalThis as unknown as { openai: OpenAI };

export const openai = globalForOpenAI.openai ?? new OpenAI();

if (process.env.NODE_ENV !== "production") {
  globalForOpenAI.openai = openai;
}

export const AI_MODEL = "gpt-4o-mini";
