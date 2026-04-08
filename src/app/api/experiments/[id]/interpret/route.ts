import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { openai, AI_MODEL } from "@/lib/openai";
import { twoProportionZTest } from "@/lib/statistics";

/**
 * POST /api/experiments/[id]/interpret
 * Generate a plain-English interpretation of experiment results using GPT-4o-mini.
 *
 * 1. Computes statistical analysis from stored results
 * 2. Feeds analysis + experiment context to GPT-4o-mini
 * 3. Returns: summary, recommendation, next steps
 * 4. Auto-creates a Learning entry in the knowledge base
 */
export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const experiment = await prisma.experiment.findUnique({
    where: { id },
    include: {
      variants: {
        orderBy: { sortOrder: "asc" },
        include: { results: { include: { metric: true } } },
      },
      metrics: { orderBy: { sortOrder: "asc" } },
    },
  });

  if (!experiment) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const control = experiment.variants.find((v) => v.isControl);
  if (!control) {
    return NextResponse.json({ error: "No control variant" }, { status: 400 });
  }

  // Build statistical analysis summary for the AI
  const analysisLines: string[] = [];
  let overallWinner = "";
  let bestLift = 0;
  let bestConfidence = 0;

  for (const metric of experiment.metrics) {
    const controlResult = control.results.find(
      (r) => r.metricId === metric.id
    );
    if (!controlResult) continue;

    const controlRate = controlResult.successes / controlResult.sampleSize;

    for (const variant of experiment.variants.filter((v) => !v.isControl)) {
      const variantResult = variant.results.find(
        (r) => r.metricId === metric.id
      );
      if (!variantResult) continue;

      const test = twoProportionZTest(
        controlResult.sampleSize,
        controlResult.successes,
        variantResult.sampleSize,
        variantResult.successes
      );

      const variantRate = variantResult.successes / variantResult.sampleSize;

      analysisLines.push(
        `${metric.name}${metric.isPrimary ? " (PRIMARY)" : ""}: ` +
          `${variant.name} vs Control — ` +
          `variant rate: ${(variantRate * 100).toFixed(1)}%, ` +
          `control rate: ${(controlRate * 100).toFixed(1)}%, ` +
          `relative lift: ${(test.relativeLift * 100).toFixed(1)}%, ` +
          `p-value: ${test.pValue.toFixed(4)}, ` +
          `confidence: ${test.confidence.toFixed(1)}%, ` +
          `significant: ${test.isSignificant ? "YES" : "NO"}`
      );

      // Track overall winner on primary metric
      if (
        metric.isPrimary &&
        test.isSignificant &&
        test.relativeLift > bestLift
      ) {
        overallWinner = variant.name;
        bestLift = test.relativeLift;
        bestConfidence = test.confidence;
      }
    }
  }

  // Build prompt for GPT-4o-mini
  const prompt = `You are a marketing analytics expert interpreting A/B test results for a marketing team. Write in clear, actionable language — no jargon.

EXPERIMENT CONTEXT:
- Name: ${experiment.name}
- Testing: ${experiment.element}
- Channel: ${experiment.channel}
- Audience: ${experiment.audience}
- Goal: ${experiment.goal}
- Hypothesis: ${experiment.hypothesis}

VARIANTS:
${experiment.variants.map((v) => `- ${v.name}${v.isControl ? " (Control)" : ""}: ${v.content}`).join("\n")}

STATISTICAL RESULTS:
${analysisLines.join("\n")}

Write a response in JSON with these fields:
{
  "summary": "2-3 paragraph plain-English summary of results. Lead with the winner (or that there's no clear winner). Include specific numbers. Explain what the confidence level means in practical terms.",
  "recommendation": "1-2 sentences of what the team should do next with the winning variant.",
  "nextSteps": "1-2 sentences suggesting what to test next, based on what we learned.",
  "learningTitle": "A short (under 100 chars) description of the key learning for the knowledge base."
}

Return only JSON.`;

  const completion = await openai.chat.completions.create({
    model: AI_MODEL,
    messages: [{ role: "user", content: prompt }],
    temperature: 0.4,
    response_format: { type: "json_object" },
  });

  const raw = completion.choices[0]?.message?.content || "{}";
  let interpretation;

  try {
    interpretation = JSON.parse(raw);
  } catch {
    interpretation = {
      summary: "Unable to generate interpretation.",
      recommendation: "",
      nextSteps: "",
      learningTitle: "",
    };
  }

  // Save learning to the knowledge base
  const fullSummary = [
    interpretation.summary,
    `\n**Recommendation:** ${interpretation.recommendation}`,
    `\n**What to test next:** ${interpretation.nextSteps}`,
  ].join("\n");

  await prisma.learning.upsert({
    where: { experimentId: id },
    update: {
      summary: fullSummary,
      channel: experiment.channel,
      element: experiment.element,
      winningVariant: overallWinner,
      liftPercent: bestLift * 100,
      confidence: bestConfidence,
      tags: [experiment.element, experiment.channel].join(","),
    },
    create: {
      experimentId: id,
      summary: fullSummary,
      channel: experiment.channel,
      element: experiment.element,
      winningVariant: overallWinner,
      liftPercent: bestLift * 100,
      confidence: bestConfidence,
      tags: [experiment.element, experiment.channel].join(","),
    },
  });

  return NextResponse.json(interpretation);
}
