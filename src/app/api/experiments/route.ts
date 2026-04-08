import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

/**
 * GET /api/experiments
 * List all experiments, optionally filtered by status.
 */
export async function GET(request: NextRequest) {
  const status = request.nextUrl.searchParams.get("status");

  const experiments = await prisma.experiment.findMany({
    where: status ? { status } : undefined,
    include: {
      variants: { orderBy: { sortOrder: "asc" } },
      metrics: { orderBy: { sortOrder: "asc" } },
      learning: true,
    },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(experiments);
}

/**
 * POST /api/experiments
 * Create a new experiment with its variants and metrics.
 */
export async function POST(request: NextRequest) {
  const body = await request.json();

  const experiment = await prisma.experiment.create({
    data: {
      name: body.name,
      element: body.element,
      channel: body.channel,
      hypothesis: body.hypothesis || "",
      audience: body.audience || "",
      goal: body.goal || "",
      baselineRate: body.baselineRate || 0,
      minimumLift: body.minimumLift || 0,
      sampleSizePerVariant: body.sampleSizePerVariant || 0,
      variants: {
        create: (body.variants || []).map(
          (
            v: {
              name: string;
              content: string;
              description?: string;
              prompt?: string;
              url?: string;
              isControl?: boolean;
            },
            i: number
          ) => ({
            name: v.name,
            content: v.content,
            description: v.description || "",
            prompt: v.prompt || "",
            url: v.url || "",
            isControl: v.isControl || false,
            sortOrder: i,
          })
        ),
      },
      metrics: {
        create: (body.metrics || []).map(
          (
            m: { name: string; isPrimary?: boolean },
            i: number
          ) => ({
            name: m.name,
            isPrimary: m.isPrimary || false,
            sortOrder: i,
          })
        ),
      },
    },
    include: {
      variants: true,
      metrics: true,
    },
  });

  return NextResponse.json(experiment, { status: 201 });
}
