import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

/**
 * PATCH /api/learnings/[id]
 * Update a learning's takeaway (marketer's own notes).
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const body = await request.json();

  const learning = await prisma.learning.update({
    where: { id },
    data: { takeaway: body.takeaway },
  });

  return NextResponse.json(learning);
}
