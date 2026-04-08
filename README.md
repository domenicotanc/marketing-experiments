# Marketing Experiments

A campaign experimentation workspace for marketing teams. Design, run, and learn from A/B tests with AI-powered variant generation, statistical analysis, and a team knowledge base.

## What it does

- **Template-driven setup** — pick from 5 experiment types (Messaging, CTA, Value Prop, Audience, Timing) with pre-built hypotheses, metrics, and guidance
- **AI variant generation** — GPT-4o-mini generates challenger variants, design concepts with ready-to-use AI prompts, or audience/timing suggestions depending on what you're testing
- **Smart mode detection** — the system adapts based on what you're testing: text mode for copy experiments, visual mode (with AI design prompts) for layout/design experiments, structural mode for audience/timing
- **Statistical analysis** — sample size calculator, two-proportion z-tests, confidence intervals, winner detection
- **AI results interpretation** — plain-English summaries with recommendations and "what to test next" suggestions
- **File upload with AI parsing** — drag-and-drop CSV/Excel exports from any marketing platform, AI maps columns to your metrics automatically
- **Team knowledge base** — every completed experiment generates a structured learning that's proactively surfaced when setting up similar experiments in the future

## Tech stack

- **Next.js** (App Router) + **TypeScript** + **Tailwind CSS**
- **Prisma** with **PostgreSQL** (SQLite for local dev)
- **OpenAI** GPT-4o-mini for all AI features
- Deployable on **Vercel**

## Getting started

### Prerequisites

- Node.js 20+
- An OpenAI API key

### Setup

```bash
# Clone the repo
git clone https://github.com/domenicotanc/marketing-experiments.git
cd marketing-experiments

# Install dependencies
npm install

# Set up environment variables
cp .env.example .env
# Edit .env with your DATABASE_URL and OPENAI_API_KEY

# Run database migrations and seed templates
npx prisma migrate dev
npm run seed

# Start the dev server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to see the app.

### Environment variables

| Variable | Description |
|---|---|
| `DATABASE_URL` | Database connection string. Use `file:./prisma/dev.db` for local SQLite dev, or a PostgreSQL connection string for production. |
| `OPENAI_API_KEY` | Your OpenAI API key. Used for variant generation, hypothesis generation, results interpretation, file parsing, and knowledge base synthesis. |

## Deploy to Vercel

1. Push to GitHub
2. Import the repo in [Vercel](https://vercel.com)
3. Add a **Postgres database** (Vercel Storage > Neon Postgres)
4. Set the `OPENAI_API_KEY` environment variable
5. Deploy

After the first deploy, run migrations and seed:

```bash
vercel env pull .env.production
source .env.production
npx prisma migrate deploy
npm run seed
```

## How it works

### Experiment lifecycle

**Draft** (designing) &rarr; **Running** (team executes in their tools) &rarr; **Completed** (results entered and interpreted)

This is a **companion tool** — marketers design experiments here, run them in their existing platforms (Mailchimp, Meta Ads, Google Ads, etc.), then bring results back for analysis and learning.

### Variant modes

| Element | Mode | What AI generates |
|---|---|---|
| Messaging | Text (always) | Actual copy variants |
| CTA | Text or Visual (marketer chooses) | Copy variants or design concepts + AI prompts |
| Value Prop | Text or Visual (marketer chooses) | Copy variants or design concepts + AI prompts |
| Audience | Structural (always) | Segment suggestions |
| Timing | Structural (always) | Timing suggestions |

## License

MIT
