import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

/**
 * GET /api/experiments/[id]
 * Fetch a single experiment with all related data.
 */
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const experiment = await prisma.experiment.findUnique({
    where: { id },
    include: {
      variants: { orderBy: { sortOrder: "asc" } },
      metrics: { orderBy: { sortOrder: "asc" } },
      learning: true,
    },
  });

  if (!experiment) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  return NextResponse.json(experiment);
}

/**
 * PATCH /api/experiments/[id]
 * Update experiment fields (primarily for status transitions).
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const body = await request.json();

  const experiment = await prisma.experiment.update({
    where: { id },
    data: body,
    include: {
      variants: { orderBy: { sortOrder: "asc" } },
      metrics: { orderBy: { sortOrder: "asc" } },
      learning: true,
    },
  });

  return NextResponse.json(experiment);
}
