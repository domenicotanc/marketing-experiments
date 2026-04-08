import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { twoProportionZTest } from "@/lib/statistics";

/**
 * POST /api/experiments/[id]/results
 * Submit results for all variants and metrics.
 * Computes statistical significance and stores results.
 *
 * Request body: {
 *   results: [
 *     { variantId, metricId, sampleSize, successes }
 *   ]
 * }
 *
 * Returns the computed analysis for each metric.
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const body = await request.json();

  // Upsert all result rows
  for (const result of body.results) {
    await prisma.result.upsert({
      where: {
        variantId_metricId: {
          variantId: result.variantId,
          metricId: result.metricId,
        },
      },
      update: {
        sampleSize: result.sampleSize,
        successes: result.successes,
      },
      create: {
        variantId: result.variantId,
        metricId: result.metricId,
        sampleSize: result.sampleSize,
        successes: result.successes,
      },
    });
  }

  // Fetch complete experiment for analysis
  const experiment = await prisma.experiment.findUnique({
    where: { id },
    include: {
      variants: {
        orderBy: { sortOrder: "asc" },
        include: { results: true },
      },
      metrics: { orderBy: { sortOrder: "asc" } },
    },
  });

  if (!experiment) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  // Find control variant
  const control = experiment.variants.find((v) => v.isControl);
  if (!control) {
    return NextResponse.json(
      { error: "No control variant found" },
      { status: 400 }
    );
  }

  // Compute statistical analysis for each metric × challenger variant
  const analysis = experiment.metrics.map((metric) => {
    const controlResult = control.results.find(
      (r) => r.metricId === metric.id
    );

    const variantResults = experiment.variants
      .filter((v) => !v.isControl)
      .map((variant) => {
        const variantResult = variant.results.find(
          (r) => r.metricId === metric.id
        );

        if (!controlResult || !variantResult) {
          return {
            variantId: variant.id,
            variantName: variant.name,
            hasData: false,
          };
        }

        const test = twoProportionZTest(
          controlResult.sampleSize,
          controlResult.successes,
          variantResult.sampleSize,
          variantResult.successes
        );

        return {
          variantId: variant.id,
          variantName: variant.name,
          hasData: true,
          controlRate: controlResult.successes / controlResult.sampleSize,
          variantRate: variantResult.successes / variantResult.sampleSize,
          ...test,
        };
      });

    return {
      metricId: metric.id,
      metricName: metric.name,
      isPrimary: metric.isPrimary,
      controlSampleSize: controlResult?.sampleSize || 0,
      controlSuccesses: controlResult?.successes || 0,
      variantResults,
    };
  });

  // Mark experiment as completed
  await prisma.experiment.update({
    where: { id },
    data: { status: "COMPLETED" },
  });

  return NextResponse.json({ analysis });
}

/**
 * GET /api/experiments/[id]/results
 * Retrieve existing results and computed analysis.
 */
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const experiment = await prisma.experiment.findUnique({
    where: { id },
    include: {
      variants: {
        orderBy: { sortOrder: "asc" },
        include: { results: true },
      },
      metrics: { orderBy: { sortOrder: "asc" } },
    },
  });

  if (!experiment) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const control = experiment.variants.find((v) => v.isControl);
  if (!control) {
    return NextResponse.json({ results: [], analysis: [] });
  }

  // Recompute analysis from stored results
  const analysis = experiment.metrics.map((metric) => {
    const controlResult = control.results.find(
      (r) => r.metricId === metric.id
    );

    const variantResults = experiment.variants
      .filter((v) => !v.isControl)
      .map((variant) => {
        const variantResult = variant.results.find(
          (r) => r.metricId === metric.id
        );

        if (!controlResult || !variantResult) {
          return {
            variantId: variant.id,
            variantName: variant.name,
            hasData: false,
          };
        }

        const test = twoProportionZTest(
          controlResult.sampleSize,
          controlResult.successes,
          variantResult.sampleSize,
          variantResult.successes
        );

        return {
          variantId: variant.id,
          variantName: variant.name,
          hasData: true,
          controlRate: controlResult.successes / controlResult.sampleSize,
          variantRate: variantResult.successes / variantResult.sampleSize,
          ...test,
        };
      });

    return {
      metricId: metric.id,
      metricName: metric.name,
      isPrimary: metric.isPrimary,
      controlSampleSize: controlResult?.sampleSize || 0,
      controlSuccesses: controlResult?.successes || 0,
      variantResults,
    };
  });

  return NextResponse.json({ analysis });
}
