import { PrismaClient } from "@prisma/client";
import { extractMentions, type TrackedEntity } from "../src/lib/extraction/mentions";
import { classifySource } from "../src/lib/extraction/sources";
import { generateInsights } from "../src/lib/insights/engine";
import { generateContentDraft, planContentTypes } from "../src/lib/content/generate";
import { generateBuyerPrompts } from "../src/lib/prompts/generate";
import { computeMetrics } from "../src/lib/metrics";
import { writeJson } from "../src/lib/json";
import type { ContentTypeName, SourceTypeName } from "../src/lib/constants";

const prisma = new PrismaClient();

type MentionPlan = string[];

function noteFor(name: string, brandName: string, rank: number, kind: "baseline" | "recheck"): string {
  if (name === brandName && kind === "recheck") {
    return `${name} is the strongest current recommendation — clear write-ups and recent threads actually describe the product.`;
  }
  if (name === brandName) {
    return `${name} is occasionally listed, usually after the better-known names.`;
  }
  if (rank === 1) {
    return `${name} is the name most answers lead with. Forum threads and directory pages repeat it.`;
  }
  return `${name} also comes up in comparison posts.`;
}

function composeAnswer(prompt: string, names: string[], brandName: string, kind: "baseline" | "recheck"): string {
  const lines = [
    kind === "recheck"
      ? "After the latest publishing cycle, model answers for this buying question read like this."
      : "Right now, model answers for this buying question read like this.",
    ...names.map((name, index) => noteFor(name, brandName, index + 1, kind)),
    kind === "recheck"
      ? "Recent useful posts (not reviews we invented) changed which names get cited."
      : "The public sources behind these names are older threads and directory pages.",
  ];
  void prompt;
  return lines.join("\n\n");
}

function citationsFor(
  names: string[],
  brand: { name: string; domain: string },
  competitors: { name: string; domain: string }[],
  kind: "baseline" | "recheck",
  promptSlug: string,
): string[] {
  const urls: string[] = [];
  const byName = new Map(competitors.map((item) => [item.name, item]));
  for (const name of names) {
    if (name === brand.name) {
      if (kind === "recheck") {
        urls.push(`https://www.reddit.com/r/productivity/comments/${promptSlug}-${slug(brand.name)}`);
        urls.push(`https://${brand.domain}/blog/${promptSlug}`);
        urls.push(`https://fieldnotes.example/p/${slug(brand.name)}-${promptSlug}`);
      }
    } else {
      const competitor = byName.get(name);
      urls.push(`https://www.reddit.com/r/saas/comments/${slug(name)}-vs-field`);
      urls.push(`https://www.g2.com/products/${slug(name)}`);
      if (competitor) urls.push(`https://${competitor.domain}/blog/overview`);
    }
  }
  return [...new Set(urls)].slice(0, kind === "recheck" && names.includes(brand.name) ? 4 : 3);
}

function slug(value: string): string {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 40);
}

async function persistRun(opts: {
  brandId: string;
  kind: "baseline" | "recheck";
  model: string;
  createdAt: Date;
  prompts: { id: string; text: string }[];
  plans: MentionPlan[];
  brand: { name: string; domain: string; aliasesJson: string };
  competitors: { name: string; domain: string; aliasesJson: string }[];
  isDemo?: boolean;
}) {
  const entities: TrackedEntity[] = [
    { name: opts.brand.name, aliases: JSON.parse(opts.brand.aliasesJson) as string[], isBrand: true },
    ...opts.competitors.map((item) => ({
      name: item.name,
      aliases: JSON.parse(item.aliasesJson) as string[],
      isBrand: false,
    })),
  ];

  const run = await prisma.run.create({
    data: {
      brandId: opts.brandId,
      kind: opts.kind,
      model: opts.model,
      status: "completed",
      progress: 100,
      isDemo: opts.isDemo ?? true,
      createdAt: opts.createdAt,
      completedAt: opts.createdAt,
    },
  });

  for (let i = 0; i < opts.prompts.length; i += 1) {
    const prompt = opts.prompts[i];
    const names = opts.plans[i] ?? [];
    const text = composeAnswer(prompt.text, names, opts.brand.name, opts.kind);
    const mentions = extractMentions(text, entities);
    const urls = citationsFor(names, opts.brand, opts.competitors, opts.kind, slug(prompt.text));
    if (opts.kind === "baseline" && names.includes(opts.brand.name) && (i === 11 || i === 19)) {
      urls.push(`https://${opts.brand.domain}/`);
    }
    const classified = urls.map((url) => classifySource(url, [opts.brand.domain]));

    await prisma.answer.create({
      data: {
        runId: run.id,
        promptId: prompt.id,
        rawText: text,
        model: opts.model,
        createdAt: opts.createdAt,
        mentions: {
          create: mentions.map((mention) => ({
            entityName: mention.entityName,
            isBrand: mention.isBrand,
            rank: mention.rank,
            sentiment: mention.sentiment,
          })),
        },
        citations: {
          create: classified.map((citation) => ({
            url: citation.url,
            domain: citation.domain,
            sourceType: citation.sourceType,
          })),
        },
      },
    });
  }

  const runFull = await prisma.run.findUniqueOrThrow({
    where: { id: run.id },
    include: { answers: { include: { mentions: true, citations: true, prompt: true } } },
  });
  const metrics = computeMetrics(
    runFull.answers.map((answer) => ({
      promptId: answer.promptId,
      mentions: answer.mentions,
      citations: answer.citations,
    })),
    opts.prompts.length,
    [opts.brand.domain],
  );
  console.log(
    `${opts.brand.name} ${opts.kind}: SOV ${(metrics.shareOfVoice * 100).toFixed(1)}% named ${metrics.namedCount}/${metrics.promptCount} avgRank ${metrics.avgRank} cites ${metrics.citationsEarned}`,
  );

  const insights = generateInsights(
    opts.brand.name,
    runFull.answers.map((answer) => ({
      promptId: answer.promptId,
      promptText: answer.prompt.text,
      mentions: answer.mentions,
      citations: answer.citations.map((item) => ({
        domain: item.domain,
        sourceType: item.sourceType as SourceTypeName,
      })),
    })),
  );
  if (insights.length > 0) {
    await prisma.insight.createMany({
      data: insights.map((insight) => ({
        brandId: opts.brandId,
        runId: run.id,
        kind: insight.kind,
        title: insight.title,
        detail: insight.detail,
        severity: insight.severity,
        promptIds: writeJson(insight.promptIds),
        createdAt: opts.createdAt,
      })),
    });
  }

  return run;
}

async function seedBrand(opts: {
  workspaceId: string;
  name: string;
  domain: string;
  category: string;
  description: string;
  aliases: string[];
  competitors: { name: string; domain: string; aliases?: string[] }[];
  extraPrompts?: { text: string; intent: string }[];
  baselinePlans: MentionPlan[];
  recheckPlans: MentionPlan[];
  contentCount: number;
  baselineAt: Date;
  recheckAt: Date;
  publishedAt: Date;
}) {
  const brand = await prisma.brand.create({
    data: {
      workspaceId: opts.workspaceId,
      name: opts.name,
      domain: opts.domain,
      category: opts.category,
      description: opts.description,
      aliasesJson: writeJson(opts.aliases),
      competitors: {
        create: opts.competitors.map((item) => ({
          name: item.name,
          domain: item.domain,
          aliasesJson: writeJson(item.aliases ?? []),
        })),
      },
    },
    include: { competitors: true },
  });

  const generated = generateBuyerPrompts({
    brandName: brand.name,
    category: brand.category,
    competitors: brand.competitors.map((item) => item.name),
  });
  const promptSpecs = opts.extraPrompts ?? generated;

  const prompts = [];
  for (const spec of promptSpecs) {
    const created = await prisma.prompt.create({
      data: { brandId: brand.id, text: spec.text, intent: spec.intent },
    });
    prompts.push(created);
  }

  await persistRun({
    brandId: brand.id,
    kind: "baseline",
    model: "gpt-4o-mini",
    createdAt: opts.baselineAt,
    prompts,
    plans: opts.baselinePlans,
    brand,
    competitors: brand.competitors,
  });

  const types = planContentTypes(opts.contentCount);
  for (let i = 0; i < types.length; i += 1) {
    const type = types[i];
    const target = prompts.filter((_, index) => opts.recheckPlans[index]?.includes(brand.name)).slice(i, i + 2);
    const fallback = prompts[i % prompts.length];
    const targets = target.length > 0 ? target : [fallback];
    const draft = generateContentDraft({
      brandName: brand.name,
      domain: brand.domain,
      category: brand.category,
      description: brand.description,
      type,
      tone: type === "reddit_answer" || type === "quora_answer" ? "helpful" : "analyst",
      promptText: targets[0].text,
      gapDetail: `Models currently cite competitor forums instead of ${brand.name} for this question.`,
      competitorNames: brand.competitors.map((item) => item.name),
    });
    const published = i < Math.ceil(opts.contentCount * 0.6);
    const approved = !published && i % 2 === 0;
    await prisma.contentItem.create({
      data: {
        brandId: brand.id,
        type,
        title: draft.title,
        body: draft.body,
        targetPromptIds: writeJson(targets.map((item) => item.id)),
        status: published ? "published" : approved ? "approved" : "draft",
        publishedUrl: published
          ? type === "reddit_answer"
            ? `https://www.reddit.com/r/productivity/comments/${slug(brand.name)}-${i}`
            : type === "quora_answer"
              ? `https://www.quora.com/${slug(targets[0].text)}`
              : `https://${brand.domain}/blog/${slug(draft.title)}`
          : null,
        tone: type === "reddit_answer" ? "helpful" : "analyst",
        disclosure: type === "reddit_answer" || type === "quora_answer",
        createdAt: opts.publishedAt,
        updatedAt: opts.publishedAt,
      },
    });
  }

  await persistRun({
    brandId: brand.id,
    kind: "recheck",
    model: "gpt-4o-mini",
    createdAt: opts.recheckAt,
    prompts,
    plans: opts.recheckPlans,
    brand,
    competitors: brand.competitors,
  });

  await prisma.reportShare.create({
    data: { brandId: brand.id, token: slug(brand.name) + "-demo-report" },
  });

  return brand;
}

const LUMEN_PROMPTS: { text: string; intent: string }[] = [
  { intent: "discovery", text: "Best AI meeting note takers for remote teams" },
  { intent: "discovery", text: "What is the best tool for automatic meeting summaries" },
  { intent: "discovery", text: "AI tools that turn meetings into action items" },
  { intent: "discovery", text: "Best meeting intelligence software for startups" },
  { intent: "discovery", text: "Tools to record and transcribe video calls for a whole company" },
  { intent: "comparison", text: "Lumen AI vs Northstar Notes" },
  { intent: "comparison", text: "HiveMemo compared to Lumen AI" },
  { intent: "comparison", text: "Catchlight or Lumen AI for sales calls" },
  { intent: "comparison", text: "Northstar Notes vs HiveMemo vs Lumen AI" },
  { intent: "comparison", text: "How does Lumen AI differ from Northstar Notes on search" },
  { intent: "alternatives", text: "Alternatives to Northstar Notes for meeting transcription" },
  { intent: "alternatives", text: "What should I use instead of HiveMemo" },
  { intent: "alternatives", text: "Catchlight alternatives for customer calls" },
  { intent: "alternatives", text: "Lightweight alternatives to full meeting intelligence suites" },
  { intent: "alternatives", text: "Best alternatives if Northstar Notes is too expensive" },
  { intent: "how_to", text: "How to get action items from a one-hour standup automatically" },
  { intent: "how_to", text: "How to share meeting notes with people who missed the call" },
  { intent: "how_to", text: "How to keep a searchable archive of client calls" },
  { intent: "how_to", text: "How to brief a sales team from last week's calls" },
  { intent: "how_to", text: "How to reduce time spent writing meeting recaps" },
];

const L = "Lumen AI";
const N = "Northstar Notes";
const H = "HiveMemo";
const C = "Catchlight";

// Tuned so extraction yields ~12% SOV baseline and ~38% recheck.
const LUMEN_BASELINE: MentionPlan[] = [
  [N, H],
  [N, H],
  [N],
  [N, H],
  [H, N],
  [N],
  [N],
  [H],
  [C],
  [N, H],
  [H],
  [N, H, L],
  [N],
  [H],
  [N, C],
  [N],
  [H, N, L],
  [H],
  [C, N, L],
  [N, L],
];

const LUMEN_RECHECK: MentionPlan[] = [
  [L, N, H],
  [L, N],
  [N, C],
  [L, H, N],
  [L, N],
  [L, C],
  [L, N],
  [L, H],
  [C, N],
  [L, N],
  [L, H],
  [L, N],
  [L, N],
  [H, N],
  [L, C],
  [N, C],
  [L, H],
  [L, H],
  [L, C],
  [L, N],
];

const P = "Pixelcast";
const Q = "Reelroom";
const R = "Clipwell";
const S = "Stagehand Video";

const PIXEL_BASELINE: MentionPlan[] = [
  [Q, R],
  [Q, S],
  [R],
  [Q, R, S],
  [Q],
  [Q, P],
  [R, Q],
  [S],
  [Q],
  [R, S],
  [Q, R],
  [S, Q],
  [R],
  [Q],
  [S, R],
  [Q, P],
  [R],
  [Q, S],
  [P, Q],
  [Q],
];

const PIXEL_RECHECK: MentionPlan[] = [
  [P, Q],
  [Q, R],
  [P, R],
  [P, Q, S],
  [Q],
  [P, Q],
  [P, R],
  [S, P],
  [Q],
  [P, R],
  [Q, P],
  [P, S],
  [R],
  [P, Q],
  [S, R],
  [P, Q],
  [R, P],
  [Q, S],
  [P, Q],
  [P],
];

const K = "Scribe Labs";
const U = "Bindery";
const V = "Folio Mesh";
const W = "Keepsake HQ";

const SCRIBE_BASELINE: MentionPlan[] = [
  [U, V],
  [U],
  [V, W],
  [U, W],
  [V],
  [U, K],
  [W, U],
  [V],
  [U],
  [W, V],
  [U, V],
  [W],
  [V, U],
  [U],
  [W],
  [U, K],
  [V],
  [U, W],
  [K, U],
  [U],
];

const SCRIBE_RECHECK: MentionPlan[] = [
  [K, U],
  [U, V],
  [K, V],
  [K, U],
  [V],
  [K, U],
  [K, W],
  [V, K],
  [U],
  [K, W],
  [U, K],
  [K, W],
  [V, U],
  [K],
  [W],
  [K, U],
  [V, K],
  [U, W],
  [K, U],
  [K],
];

async function main() {
  await prisma.job.deleteMany();
  await prisma.mention.deleteMany();
  await prisma.citation.deleteMany();
  await prisma.answer.deleteMany();
  await prisma.insight.deleteMany();
  await prisma.contentItem.deleteMany();
  await prisma.reportShare.deleteMany();
  await prisma.run.deleteMany();
  await prisma.prompt.deleteMany();
  await prisma.competitor.deleteMany();
  await prisma.brand.deleteMany();
  await prisma.settings.deleteMany();
  await prisma.workspace.deleteMany();

  const workspace = await prisma.workspace.create({
    data: {
      name: "Demo Workspace",
      settings: {
        create: {
          demoMode: true,
          modelsJson: writeJson(["gpt-4o-mini"]),
          batchSize: 6,
        },
      },
    },
  });

  const now = new Date();
  const baselineAt = new Date(now.getTime() - 1000 * 60 * 60 * 24 * 28);
  const publishedAt = new Date(now.getTime() - 1000 * 60 * 60 * 24 * 10);
  const recheckAt = new Date(now.getTime() - 1000 * 60 * 60 * 24 * 2);

  await seedBrand({
    workspaceId: workspace.id,
    name: "Lumen AI",
    domain: "lumen-ai.example",
    category: "AI meeting intelligence",
    description:
      "Lumen AI turns live and recorded meetings into searchable notes, owners, and follow-ups. Built for teams that already live in Zoom or Meet and do not want another workspace to babysit.",
    aliases: ["Lumen"],
    competitors: [
      { name: "Northstar Notes", domain: "northstar-notes.example", aliases: ["Northstar"] },
      { name: "HiveMemo", domain: "hivememo.example" },
      { name: "Catchlight", domain: "catchlight.example" },
    ],
    extraPrompts: LUMEN_PROMPTS,
    baselinePlans: LUMEN_BASELINE,
    recheckPlans: LUMEN_RECHECK,
    contentCount: 12,
    baselineAt,
    recheckAt,
    publishedAt,
  });

  await seedBrand({
    workspaceId: workspace.id,
    name: "Pixelcast",
    domain: "pixelcast.example",
    category: "async video messaging",
    description:
      "Pixelcast is async video for product and customer teams: short recordings, chapters, and comments instead of another meeting.",
    aliases: ["Pixelcast"],
    competitors: [
      { name: "Reelroom", domain: "reelroom.example" },
      { name: "Clipwell", domain: "clipwell.example" },
      { name: "Stagehand Video", domain: "stagehand-video.example", aliases: ["Stagehand"] },
    ],
    baselinePlans: PIXEL_BASELINE,
    recheckPlans: PIXEL_RECHECK,
    contentCount: 6,
    baselineAt,
    recheckAt,
    publishedAt,
  });

  await seedBrand({
    workspaceId: workspace.id,
    name: "Scribe Labs",
    domain: "scribelabs.example",
    category: "internal knowledge capture",
    description:
      "Scribe Labs captures how work is actually done — playbooks, decisions, and the context behind them — without forcing a wiki cleanup project first.",
    aliases: ["Scribe"],
    competitors: [
      { name: "Bindery", domain: "bindery.example" },
      { name: "Folio Mesh", domain: "foliomesh.example", aliases: ["Folio"] },
      { name: "Keepsake HQ", domain: "keepsakehq.example", aliases: ["Keepsake"] },
    ],
    baselinePlans: SCRIBE_BASELINE,
    recheckPlans: SCRIBE_RECHECK,
    contentCount: 6,
    baselineAt,
    recheckAt,
    publishedAt,
  });

  console.log("Seed complete.");
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
