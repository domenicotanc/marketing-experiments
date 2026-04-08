import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { openai, AI_MODEL } from "@/lib/openai";

/**
 * POST /api/learnings/synthesize
 * Given a channel and element type, find matching past learnings
 * and use GPT-4o-mini to synthesize contextual advice.
 *
 * Used during experiment creation to proactively surface relevant
 * team knowledge from past experiments.
 *
 * Request body: { channel: string, element: string }
 * Returns: { count: number, advice: string, learnings: [...] }
 */
export async function POST(request: NextRequest) {
  const body = await request.json();

  // Find learnings matching the channel and/or element
  const learnings = await prisma.learning.findMany({
    where: {
      OR: [
        { channel: body.channel, element: body.element },
        { element: body.element },
        { channel: body.channel },
      ],
    },
    include: {
      experiment: { select: { name: true } },
    },
    orderBy: { createdAt: "desc" },
    take: 10,
  });

  if (learnings.length === 0) {
    return NextResponse.json({
      count: 0,
      advice: "",
      learnings: [],
    });
  }

  // Build summaries for GPT-4o-mini
  const learningsSummary = learnings
    .map(
      (l) =>
        `- Experiment: "${l.experiment.name}" (${l.element}, ${l.channel})\n` +
        `  Winner: ${l.winningVariant || "none"}, Lift: ${l.liftPercent.toFixed(1)}%, Confidence: ${l.confidence.toFixed(1)}%\n` +
        `  Takeaway: ${l.takeaway || "(none)"}`
    )
    .join("\n\n");

  const prompt = `You are a marketing insights assistant. A marketer is setting up a new ${body.element} experiment on ${body.channel}.

Here are their team's relevant past experiment learnings:

${learningsSummary}

Write a concise 2-3 sentence synthesis of what the team has learned that's relevant to this new experiment. Include:
1. Key patterns or consistent winners from past experiments
2. A specific suggestion for what to consider or try differently this time

Write in second person ("Your team has..."). Be specific and actionable, not generic. If the learnings are limited or inconclusive, say so honestly.`;

  const completion = await openai.chat.completions.create({
    model: AI_MODEL,
    messages: [{ role: "user", content: prompt }],
    temperature: 0.5,
    max_tokens: 300,
  });

  const advice = completion.choices[0]?.message?.content || "";

  return NextResponse.json({
    count: learnings.length,
    advice,
    learnings: learnings.map((l) => ({
      id: l.id,
      experimentName: l.experiment.name,
      winningVariant: l.winningVariant,
      liftPercent: l.liftPercent,
      confidence: l.confidence,
      element: l.element,
      channel: l.channel,
    })),
  });
}
