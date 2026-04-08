import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

/**
 * PATCH /api/experiments/[id]/variants
 * Update variant fields (primarily for adding URLs post-creation).
 *
 * Request body: { variantId: string, url: string }
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  await params; // validate experiment exists
  const body = await request.json();

  const variant = await prisma.variant.update({
    where: { id: body.variantId },
    data: { url: body.url },
  });

  return NextResponse.json(variant);
}
