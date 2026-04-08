import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

/**
 * GET /api/learnings
 * Fetch all learnings with optional filtering by channel, element, and search query.
 */
export async function GET(request: NextRequest) {
  const channel = request.nextUrl.searchParams.get("channel");
  const element = request.nextUrl.searchParams.get("element");
  const search = request.nextUrl.searchParams.get("search");

  const where: Record<string, unknown> = {};

  if (channel) where.channel = channel;
  if (element) where.element = element;

  // Simple text search across summary and takeaway
  if (search) {
    where.OR = [
      { summary: { contains: search } },
      { takeaway: { contains: search } },
      { winningVariant: { contains: search } },
    ];
  }

  const learnings = await prisma.learning.findMany({
    where,
    include: {
      experiment: {
        select: { id: true, name: true },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(learnings);
}
