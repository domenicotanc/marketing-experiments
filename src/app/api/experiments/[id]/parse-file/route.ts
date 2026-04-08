import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { openai, AI_MODEL } from "@/lib/openai";
import * as XLSX from "xlsx";

/**
 * POST /api/experiments/[id]/parse-file
 * Upload a CSV or Excel file and use GPT-4o-mini to map its columns
 * to the experiment's variants and metrics.
 *
 * Accepts multipart/form-data with a single "file" field.
 * Returns pre-filled results rows for the marketer to review.
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  // Fetch the experiment to know its variants and metrics
  const experiment = await prisma.experiment.findUnique({
    where: { id },
    include: {
      variants: { orderBy: { sortOrder: "asc" } },
      metrics: { orderBy: { sortOrder: "asc" } },
    },
  });

  if (!experiment) {
    return NextResponse.json({ error: "Experiment not found" }, { status: 404 });
  }

  // Parse the uploaded file
  const formData = await request.formData();
  const file = formData.get("file") as File;

  if (!file) {
    return NextResponse.json({ error: "No file provided" }, { status: 400 });
  }

  const buffer = Buffer.from(await file.arrayBuffer());
  const workbook = XLSX.read(buffer, { type: "buffer" });
  const sheet = workbook.Sheets[workbook.SheetNames[0]];
  const rows: Record<string, unknown>[] = XLSX.utils.sheet_to_json(sheet);

  if (rows.length === 0) {
    return NextResponse.json({ error: "File is empty" }, { status: 400 });
  }

  // Send column headers + sample rows to GPT-4o-mini for mapping
  const headers = Object.keys(rows[0]);
  const sampleRows = rows.slice(0, 5);

  const variantNames = experiment.variants.map((v) => v.name);
  const metricNames = experiment.metrics.map((m) => m.name);

  const prompt = `You are helping parse marketing experiment results from a data export.

The experiment has these variants: ${JSON.stringify(variantNames)}
The experiment tracks these metrics: ${JSON.stringify(metricNames)}

The uploaded file has these column headers: ${JSON.stringify(headers)}

Here are the first ${sampleRows.length} rows of data:
${JSON.stringify(sampleRows, null, 2)}

Your task: map the file data to the experiment structure. For each variant, extract:
- sampleSize: the total number of observations (sends, impressions, visitors)
- For each metric: the number of successes (not the rate — the raw count)

If the file contains rates/percentages instead of raw counts, calculate the raw count from the rate and sample size.

Respond in JSON format:
{
  "results": [
    {
      "variantName": "name matching one of the experiment variants",
      "sampleSize": 5000,
      "metrics": {
        "Metric Name": 1100
      }
    }
  ],
  "notes": "Any notes about assumptions or ambiguities"
}

If you cannot confidently map the data, set "results" to an empty array and explain in "notes".
Return only JSON, no other text.`;

  const completion = await openai.chat.completions.create({
    model: AI_MODEL,
    messages: [{ role: "user", content: prompt }],
    temperature: 0.2,
    response_format: { type: "json_object" },
  });

  const raw = completion.choices[0]?.message?.content || "{}";

  try {
    const parsed = JSON.parse(raw);
    return NextResponse.json(parsed);
  } catch {
    return NextResponse.json(
      { results: [], notes: "Failed to parse AI response" },
      { status: 200 }
    );
  }
}
