import "dotenv/config";
// Import from the custom generated output path
const { PrismaClient } = require("../src/generated/prisma/client");

const prisma = new PrismaClient();

/**
 * Seed the 5 experiment templates — the "golden workflows."
 * Each template provides a complete starting point for a common
 * marketing experiment type.
 */
const templates = [
  {
    name: "Messaging Test",
    element: "MESSAGING",
    description:
      "Test which message resonates more with your audience. Compare subject lines, headlines, body copy, or hooks.",
    defaultHypothesis:
      'We believe [new messaging approach] will outperform [current approach] because [reason based on audience insight].',
    defaultMetrics: JSON.stringify([
      { name: "Open Rate", isPrimary: true },
      { name: "Click Rate", isPrimary: false },
    ]),
    variantFramework: JSON.stringify({
      controlLabel: "Current messaging",
      challengerLabel: "New messaging approach",
      suggestedVariants: 2,
      guidance:
        "Change only the messaging element being tested. Keep subject line length, sender name, send time, and audience identical across variants.",
    }),
    guidingQuestions: JSON.stringify([
      "What specific messaging element are you testing? (subject line, headline, body copy, hook)",
      "What is your current messaging and why do you think it could be improved?",
      "Who is the target audience for this message?",
      "What action do you want the audience to take after reading?",
    ]),
  },
  {
    name: "CTA Test",
    element: "CTA",
    description:
      "Test which call-to-action drives more conversions. Compare button text, placement, urgency, or framing.",
    defaultHypothesis:
      'We believe [new CTA approach] will drive more [desired action] than [current CTA] because [reason].',
    defaultMetrics: JSON.stringify([
      { name: "Click-Through Rate", isPrimary: true },
      { name: "Conversion Rate", isPrimary: false },
    ]),
    variantFramework: JSON.stringify({
      controlLabel: "Current CTA",
      challengerLabel: "New CTA approach",
      suggestedVariants: 2,
      guidance:
        "Isolate the CTA change. If testing button text, keep placement and design identical. If testing placement, keep text identical.",
    }),
    guidingQuestions: JSON.stringify([
      "What is your current CTA and where does it appear?",
      "What type of CTA change are you testing? (text, placement, urgency, color)",
      "What is the desired action you want users to take?",
      "What do you think is preventing more users from clicking?",
    ]),
  },
  {
    name: "Value Prop Test",
    element: "VALUE_PROP",
    description:
      "Test which benefit or value framing converts better. Compare discount structures, benefit emphasis, or offer positioning.",
    defaultHypothesis:
      'We believe emphasizing [value proposition] will convert better than [current framing] because [customer insight].',
    defaultMetrics: JSON.stringify([
      { name: "Conversion Rate", isPrimary: true },
      { name: "Click-Through Rate", isPrimary: false },
    ]),
    variantFramework: JSON.stringify({
      controlLabel: "Current value framing",
      challengerLabel: "Alternative value framing",
      suggestedVariants: 2,
      guidance:
        "Test one value proposition dimension at a time: benefit type, urgency framing, social proof angle, or discount structure. Keep everything else constant.",
    }),
    guidingQuestions: JSON.stringify([
      "What value proposition or offer are you currently using?",
      "What alternative framing do you want to test?",
      "What customer pain point or desire does this address?",
      "Is this a new offer structure or a different way of presenting the same offer?",
    ]),
  },
  {
    name: "Audience Test",
    element: "AUDIENCE",
    description:
      "Test which audience segment responds better to the same campaign. Compare demographics, behaviors, or interest groups.",
    defaultHypothesis:
      'We believe [audience segment A] will respond better to this campaign than [audience segment B] because [insight].',
    defaultMetrics: JSON.stringify([
      { name: "Conversion Rate", isPrimary: true },
      { name: "Engagement Rate", isPrimary: false },
    ]),
    variantFramework: JSON.stringify({
      controlLabel: "Primary audience segment",
      challengerLabel: "Alternative audience segment",
      suggestedVariants: 2,
      guidance:
        "Keep the creative, messaging, and offer identical across segments. The only variable should be the audience. Ensure segments don't overlap.",
    }),
    guidingQuestions: JSON.stringify([
      "What audience segments are you comparing?",
      "How are these segments defined? (demographics, behavior, interests, lifecycle stage)",
      "What campaign or message will both segments receive?",
      "Do you have a hypothesis about why one segment might perform better?",
    ]),
  },
  {
    name: "Timing Test",
    element: "TIMING",
    description:
      "Test when is the best time to reach your audience. Compare send days, times, or campaign cadences.",
    defaultHypothesis:
      'We believe sending at [time/day A] will outperform [time/day B] because [reasoning about audience behavior].',
    defaultMetrics: JSON.stringify([
      { name: "Open Rate", isPrimary: true },
      { name: "Click Rate", isPrimary: false },
    ]),
    variantFramework: JSON.stringify({
      controlLabel: "Current send time",
      challengerLabel: "Alternative send time",
      suggestedVariants: 2,
      guidance:
        "Keep content, subject line, and audience identical. Only vary the send time or day. Ensure comparable audience sizes for each time slot.",
    }),
    guidingQuestions: JSON.stringify([
      "What is your current send time or cadence?",
      "What alternative timing do you want to test?",
      "What do you know about when your audience is most active?",
      "Are there any external factors that might affect timing? (time zones, holidays, industry events)",
    ]),
  },
];

async function main() {
  console.log("Seeding experiment templates...");

  for (const template of templates) {
    await prisma.experimentTemplate.upsert({
      where: { element: template.element },
      update: template,
      create: template,
    });
  }

  console.log(`Seeded ${templates.length} templates.`);

  // Seed an example completed experiment for first-run experience
  const existingExample = await prisma.experiment.findFirst({
    where: { name: "Example: Subject Line A/B Test" },
  });

  if (!existingExample) {
    console.log("Seeding example experiment...");

    const experiment = await prisma.experiment.create({
      data: {
        name: "Example: Subject Line A/B Test",
        element: "MESSAGING",
        channel: "EMAIL",
        status: "COMPLETED",
        hypothesis:
          "We believe a question-based subject line will outperform our standard statement-based subject line because questions create curiosity and increase open rates.",
        audience: "Newsletter subscribers, B2B SaaS, ~50k list",
        goal: "Increase email open rates for weekly product newsletter",
        baselineRate: 0.22,
        minimumLift: 0.1,
        sampleSizePerVariant: 3800,
        variants: {
          create: [
            {
              name: "Control",
              content: "Your weekly product update is here",
              description: "Current standard subject line",
              isControl: true,
              sortOrder: 0,
            },
            {
              name: "Question + Curiosity",
              content: "Are you missing these 3 new features?",
              description:
                "Question format with curiosity gap and specificity",
              isControl: false,
              sortOrder: 1,
            },
          ],
        },
        metrics: {
          create: [
            { name: "Open Rate", isPrimary: true, sortOrder: 0 },
            { name: "Click Rate", isPrimary: false, sortOrder: 1 },
          ],
        },
      },
      include: { variants: true, metrics: true },
    });

    // Add example results
    const control = experiment.variants.find(
      (v: { isControl: boolean }) => v.isControl
    )!;
    const challenger = experiment.variants.find(
      (v: { isControl: boolean }) => !v.isControl
    )!;
    const openRateMetric = experiment.metrics.find(
      (m: { name: string }) => m.name === "Open Rate"
    )!;
    const clickRateMetric = experiment.metrics.find(
      (m: { name: string }) => m.name === "Click Rate"
    )!;

    await prisma.result.createMany({
      data: [
        {
          variantId: control.id,
          metricId: openRateMetric.id,
          sampleSize: 5000,
          successes: 1100,
        },
        {
          variantId: control.id,
          metricId: clickRateMetric.id,
          sampleSize: 5000,
          successes: 425,
        },
        {
          variantId: challenger.id,
          metricId: openRateMetric.id,
          sampleSize: 5000,
          successes: 1350,
        },
        {
          variantId: challenger.id,
          metricId: clickRateMetric.id,
          sampleSize: 5000,
          successes: 510,
        },
      ],
    });

    // Add example learning
    await prisma.learning.create({
      data: {
        experimentId: experiment.id,
        summary:
          'Question-based subject line ("Are you missing these 3 new features?") outperformed the statement-based control ("Your weekly product update is here") by 22.7% in open rate (27.0% vs 22.0%) with 98.3% confidence. Click rate also improved by 20% (10.2% vs 8.5%), reaching statistical significance.\n\n**Recommendation:** Roll out the question-based format as the default for product newsletters. The curiosity gap + specificity combination clearly resonated.\n\n**What to test next:** Try testing different question styles — pain-point questions vs. curiosity questions vs. social proof questions — to find the strongest angle.',
        takeaway:
          "Question-based subject lines are a consistent winner for our audience. The curiosity gap technique works especially well with feature announcements.",
        channel: "EMAIL",
        element: "MESSAGING",
        winningVariant: "Question + Curiosity",
        liftPercent: 22.7,
        confidence: 98.3,
        tags: "MESSAGING,EMAIL",
      },
    });

    console.log("Seeded example experiment with results and learning.");
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
