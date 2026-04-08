import { NextRequest, NextResponse } from "next/server";
import { openai, AI_MODEL } from "@/lib/openai";

/**
 * POST /api/experiments/generate-hypothesis
 * Uses GPT-4o-mini to generate a hypothesis from experiment context.
 * Replaces the fill-in-the-blank template with a ready-to-use hypothesis.
 *
 * Request body: { element, channel, audience, goal }
 * Returns: { hypothesis: string }
 */
export async function POST(request: NextRequest) {
  const body = await request.json();

  const elementLabels: Record<string, string> = {
    MESSAGING: "messaging/copy",
    CTA: "call-to-action",
    VALUE_PROP: "value proposition",
    AUDIENCE: "audience segment",
    TIMING: "send timing",
  };

  const prompt = `You are a marketing strategist. Write a clear, specific A/B test hypothesis in one sentence.

Context:
- Testing: ${elementLabels[body.element] || body.element}
- Channel: ${body.channel}
- Target audience: ${body.audience || "not specified"}
- Goal: ${body.goal || "not specified"}

Write a hypothesis following this structure: "We believe [specific change] will [expected outcome] because [reasoning based on audience/context]."

Be specific and actionable — don't use generic placeholders. If audience or goal is missing, make reasonable assumptions based on the channel and element type.

Return only the hypothesis text, nothing else.`;

  const completion = await openai.chat.completions.create({
    model: AI_MODEL,
    messages: [{ role: "user", content: prompt }],
    temperature: 0.6,
    max_tokens: 200,
  });

  const hypothesis = completion.choices[0]?.message?.content?.trim() || "";

  return NextResponse.json({ hypothesis });
}
