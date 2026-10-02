# Redlify Visibility Console

A demo-ready prototype that makes AI models recommend a brand when buyers ask what to buy. One loop: **Track → Diagnose → Publish → Re-check**.

Built to present live in under 5 minutes. Demo Mode needs no API keys.

## How to run

```bash
npm install
cp .env.example .env
npm run seed
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). You should land on **Lumen AI** with seeded baseline and re-check data.

## What’s real vs mocked

| Piece | Demo Mode (default) | Live Mode |
| --- | --- | --- |
| Tracking answers | `MockProvider` — deterministic, seeded | Real OpenAI calls (`OPENAI_API_KEY`) |
| Mention extraction | Same code path | Same code path |
| Sentiment | Heuristic | LLM, heuristic fallback |
| Content drafts | Template generator grounded in brand + gaps | Same templates (no invented stats) |
| Metrics / insights / attribution | Real math on stored runs | Real math on stored runs |
| Publishing | Manual “Mark published” + URL. Never auto-posts | Same |

Footer label **Demo data** appears whenever Demo Mode is on.

## 5-step demo script (Lumen AI)

1. **Overview** — Point at share of voice **12%** on the baseline, the competitor leaderboard, and the “Next best action” card. Switch the brand if asked; switch back to Lumen AI.
2. **Diagnose** — Show the source-mix donut (Reddit/directories when competitors win) and the gap table. Click **Create content for this** on a Reddit-gap insight.
3. **Publish** — Walk the Draft / Approved / Published board (~12 seeded items). Open a Reddit answer: disclosure toggle, platform-rules reminder, no auto-post. Mark one published if you want to show the workflow.
4. **Re-check** — Headline **+26 pts share of voice since baseline** (12% → 38%). Green flips = now named. Open **Learn from this** to show Reddit + blog weights for the next batch.
5. **Report** — Client-ready monthly summary. Use **Download PDF** (print dialog) or copy the share link.

Optional: **Demo Tour** in the sidebar walks the same five screens. **Run tracking now** on Prompts shows the live progress bar (mock in Demo, real models in Live).

## Live Mode

Set `OPENAI_API_KEY` in `.env`, flip the top-bar toggle to **Live**, then run tracking on Prompts. Works on at least 5 prompts. Demo seed data is not overwritten.

## Scripts

- `npm run dev` — Next.js 15 (Turbopack)
- `npm run seed` — reset SQLite and load fictional demo brands
- `npm run test` — Vitest (metrics + extraction)
- `npm run lint` — ESLint
- `npm run build` — production build

## Stack

Next.js 15 App Router, TypeScript strict, Tailwind + shadcn/ui, Recharts, Framer Motion, SQLite + Prisma, Zod, OpenAI SDK behind `AIProvider`, in-process job queue persisted in the database.
