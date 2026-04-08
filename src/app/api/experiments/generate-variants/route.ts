import { NextRequest, NextResponse } from "next/server";
import { openai, AI_MODEL } from "@/lib/openai";

/**
 * POST /api/experiments/generate-variants
 * Uses GPT-4o-mini to suggest experiment variants based on context.
 *
 * Three generation modes passed explicitly by the client:
 *   1. Text — generates actual copy (subject lines, CTA text, headlines)
 *   2. Visual — generates concept descriptions + AI prompts for design tools
 *   3. Structural — generates segment/timing variant descriptions
 *
 * Mode is determined by element type:
 *   - MESSAGING → always text
 *   - AUDIENCE/TIMING → always structural
 *   - CTA/VALUE_PROP → text or visual (marketer chooses)
 */

export async function POST(request: NextRequest) {
  const body = await request.json();
  const mode: string = body.mode || "text";

  const elementLabels: Record<string, string> = {
    MESSAGING: "messaging/copy",
    CTA: "call-to-action",
    VALUE_PROP: "value proposition/offer framing",
    AUDIENCE: "audience segment",
    TIMING: "send timing",
  };

  const elementLabel = elementLabels[body.element] || body.element;

  let prompt: string;

  if (mode === "text") {
    // Generate actual copy variants
    prompt = `You are a senior marketing strategist helping design an A/B test.

Context:
- Testing: ${elementLabel}
- Channel: ${body.channel}
- Target audience: ${body.audience}
- Goal: ${body.goal}
- Current approach (control): ${body.currentApproach}

Generate exactly ${body.numberOfVariants || 2} challenger variant(s). Each should take a meaningfully different approach — not minor wording tweaks.

For each variant provide:
1. A short name (e.g., "Question + Urgency")
2. The actual copy/content to use
3. A brief rationale

Respond as a JSON object:
{
  "variants": [
    {
      "name": "Variant name",
      "content": "The actual copy/content",
      "rationale": "Why this might outperform"
    }
  ]
}`;
  } else if (mode === "visual") {
    // Generate concept descriptions + actionable AI prompts
    prompt = `You are a senior marketing strategist and creative director helping design an A/B test for a visual channel.

Context:
- Testing: ${elementLabel}
- Channel: ${body.channel}
- Target audience: ${body.audience}
- Goal: ${body.goal}
- Current approach (control): ${body.currentApproach}

Generate exactly ${body.numberOfVariants || 2} challenger variant concept(s). Each should represent a meaningfully different creative direction.

For each variant provide:
1. A short name (e.g., "Social Proof Hero", "Ambient Video Background")
2. A concept description explaining the creative approach and why it might work
3. A detailed, ready-to-use AI prompt that the marketer can paste into their design tool (Figma AI, Midjourney, Claude, etc.) to generate this variant. The prompt should be specific about layout, imagery, copy placement, colors, and mood.

Respond as a JSON object:
{
  "variants": [
    {
      "name": "Variant name",
      "content": "Concept description — what this variant is and why it might work",
      "prompt": "A detailed, ready-to-use prompt for AI design tools to generate this variant. Be specific about visual elements, layout, typography, imagery style, and mood.",
      "rationale": "Strategic rationale for testing this approach"
    }
  ]
}`;
  } else {
    // Structural — audience segments or timing slots
    const isAudience = body.element === "AUDIENCE";
    prompt = `You are a senior marketing strategist helping design an A/B test.

Context:
- Testing: ${isAudience ? "audience segments" : "send timing"}
- Channel: ${body.channel}
- Target audience: ${body.audience}
- Goal: ${body.goal}
- Current approach (control): ${body.currentApproach}

${
  isAudience
    ? `Generate exactly ${body.numberOfVariants || 2} alternative audience segment(s) to test against the control segment. Each should be a meaningfully different audience slice that could plausibly respond better.

For each variant provide:
1. A short segment name (e.g., "High-Intent Browsers", "Lapsed Buyers 30-60d")
2. A description of the segment — how it's defined and what makes it interesting to test
3. Why this segment might outperform`
    : `Generate exactly ${body.numberOfVariants || 2} alternative timing variant(s) to test against the control timing. Each should represent a meaningfully different send time or cadence.

For each variant provide:
1. A short name (e.g., "Tuesday 7am", "Weekend Morning")
2. A description of the timing and what behavioral insight supports it
3. Why this timing might outperform`
}

Respond as a JSON object:
{
  "variants": [
    {
      "name": "Variant name",
      "content": "Description of the ${isAudience ? "segment" : "timing"}",
      "rationale": "Why this might outperform"
    }
  ]
}`;
  }

  const completion = await openai.chat.completions.create({
    model: AI_MODEL,
    messages: [{ role: "user", content: prompt }],
    temperature: 0.8,
    response_format: { type: "json_object" },
  });

  const raw = completion.choices[0]?.message?.content || "{}";

  try {
    const parsed = JSON.parse(raw);
    const variants = Array.isArray(parsed) ? parsed : parsed.variants || [];
    return NextResponse.json(variants);
  } catch {
    return NextResponse.json([], { status: 200 });
  }
}
