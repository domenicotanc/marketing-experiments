import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

/**
 * GET /api/templates
 * Returns all experiment templates for the template picker.
 */
export async function GET() {
  const templates = await prisma.experimentTemplate.findMany({
    orderBy: { name: "asc" },
  });

  // Parse JSON string fields back to objects for the frontend
  const parsed = templates.map((t) => ({
    ...t,
    defaultMetrics: JSON.parse(t.defaultMetrics),
    variantFramework: JSON.parse(t.variantFramework),
    guidingQuestions: JSON.parse(t.guidingQuestions),
  }));

  return NextResponse.json(parsed);
}
