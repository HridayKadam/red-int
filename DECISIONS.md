# Product and engineering decisions

These were made so the IIT panel demo never stalls. No open questions left in the product.

## Positioning and narrative

- Product name in UI: **Redlify Visibility Console**. Wordmark is lowercase bold **redlify**.
- Hero brand is **Lumen AI** (fictional meeting-intelligence tool). Baseline share of voice is **12%**; re-check after one publish cycle is **38%** (+26 pts).
- Other seeded brands: **Pixelcast** (async video) and **Scribe Labs** (internal knowledge capture). All names, domains (`*.example`), competitors, and reviewers are fictional.
- Profound / Peec / Otterly / GEO agencies are referenced only as positioning copy, never as tracked entities.

## Demo vs live

- Default is **Demo Mode** (`DEMO_MODE=true`). Numbers come from seeded runs and the mock AI provider. Footer shows **Demo data**.
- **Live Mode** is available when `OPENAI_API_KEY` is set. The toggle still exists without a key, but tracking refuses with a clear error instead of silently inventing answers.
- Live numbers are never mixed into demo seed charts. A live run is a new `Run` row.
- Mock answers are deterministic (prompt + brand + published-content state). Re-running in demo after publishing will mention the brand more and cite Reddit/blog-style sources.

## Stack

- Next.js 15 App Router, React 19, TypeScript `strict`, Tailwind v4, shadcn/ui (Base UI primitives), Inter.
- Prisma 6 + SQLite so `npm run seed` works offline. Prisma 7 was skipped (config/client split is unnecessary for this prototype).
- In-process job queue persisted as `Job` rows. Concurrency 3. No Redis, no cron, no worker process. Reloading the app resumes unfinished jobs from the database.
- OpenAI SDK is behind `AIProvider`. `MockProvider` is the demo implementation; `OpenAIProvider` is live.

## Data model extras (beyond the brief)

- `Competitor.aliases` and `Brand.aliases` as JSON strings (SQLite has no native arrays).
- `Settings` per workspace: demo flag, model list, batch size.
- `Job` for the queue.
- `ReportShare.token` for the read-only `/r/[token]` route.
- `ContentItem.tone` and `disclosure` for Reddit/Quora drafts.
- Prisma enums stored as strings on SQLite.

## Metrics

- **Share of voice** = brand mentions / all tracked-entity mentions in a run (one mention per entity per answer, ranked by first appearance).
- **Named rate** = prompts that name the brand / total prompts in that run.
- **Avg rank** = mean rank among answers where the brand is named (1 = first named).
- **Citations earned** = citations whose domain matches the brand domain, or source type `brand_site`.
- Sentiment: heuristic in Demo (window around the mention); LLM classification in Live, falling back to heuristic on failure.

## Insights and attribution

- Rule-based only (demo-safe, no extra model calls):
  - Competitor cited via Reddit while brand has no Reddit citations.
  - Brand named but rank worse than 3.
  - Zero directory (G2/Capterra/Product Hunt) presence.
- Re-check attribution is a simple correlation: content types whose target prompts flipped to “named” get higher suggested weight in the next batch. Not causal ML.

## Content

- Never auto-post. “Mark published” only stores a URL the user pastes.
- Reddit/Quora drafts are written as helpful answers with a disclosure toggle and a platform-rules reminder.
- Generators never fabricate stats, testimonials, or reviews, and never pose as a customer.
- Default batch size is 6; configurable in Settings.

## UX

- White canvas, orange `#EA4510` for primary actions and hero numbers. No gradients, no emoji.
- Every screen ends in an action (next best action, generate, run, mark published, learn from this).
- Brand switcher and Demo/Live toggle live in the top bar; selection is a cookie (`redlify_brand`, `redlify_mode`).
- Guided Demo Tour is five dismissible callouts: Overview → Diagnose → Publish → Re-check → Report.
- Onboarding creates a brand, up to 5 competitors, and 20 prompts across the four intents.

## Out of scope (explicit)

- Auth, payments, auto-posting, scheduled jobs, dark mode.
