import { prisma } from "@/lib/db";
import { computeMetrics, leaderboard } from "@/lib/metrics";
import { generateInsights } from "@/lib/insights/engine";
import { classifyFlip, attributeLift, type PromptFlip } from "@/lib/attribution";
import { readJson } from "@/lib/json";
import type { SourceTypeName } from "@/lib/constants";

export async function loadOverview(brandId: string) {
  const brand = await prisma.brand.findUniqueOrThrow({
    where: { id: brandId },
    include: { competitors: true, prompts: true },
  });
  const runs = await prisma.run.findMany({
    where: { brandId, status: "completed" },
    orderBy: { createdAt: "asc" },
    include: { answers: { include: { mentions: true, citations: true } } },
  });
  const snapshots = runs.map((run) => {
    const metrics = computeMetrics(
      run.answers.map((answer) => ({
        promptId: answer.promptId,
        mentions: answer.mentions,
        citations: answer.citations,
      })),
      brand.prompts.length,
      [brand.domain],
    );
    return {
      runId: run.id,
      kind: run.kind,
      model: run.model,
      createdAt: run.createdAt.toISOString(),
      isDemo: run.isDemo,
      ...metrics,
    };
  });
  const current = snapshots.at(-1) ?? null;
  const baseline = snapshots.find((item) => item.kind === "baseline") ?? snapshots[0] ?? null;
  const latestRun = runs.at(-1);
  const board = latestRun
    ? leaderboard(latestRun.answers.flatMap((item) => item.mentions))
    : [];

  const insights = await prisma.insight.findMany({
    where: { brandId },
    orderBy: { createdAt: "desc" },
    take: 1,
  });

  return { brand, snapshots, current, baseline, leaderboard: board, insight: insights[0] ?? null };
}

export async function loadPrompts(brandId: string) {
  const brand = await prisma.brand.findUniqueOrThrow({
    where: { id: brandId },
    include: { prompts: { orderBy: { createdAt: "asc" } } },
  });
  const runs = await prisma.run.findMany({
    where: { brandId, status: "completed" },
    orderBy: { createdAt: "asc" },
    include: {
      answers: { include: { mentions: true, citations: true } },
    },
  });
  const active = await prisma.run.findFirst({
    where: { brandId, status: { in: ["queued", "running"] } },
    orderBy: { createdAt: "desc" },
  });

  const rows = brand.prompts.map((prompt) => ({
    id: prompt.id,
    text: prompt.text,
    intent: prompt.intent,
    results: runs.map((run) => {
      const answer = run.answers.find((item) => item.promptId === prompt.id);
      const mention = answer?.mentions.find((item) => item.isBrand);
      return {
        runId: run.id,
        kind: run.kind,
        model: run.model,
        named: Boolean(mention),
        rank: mention?.rank ?? null,
        sentiment: mention?.sentiment ?? null,
      };
    }),
  }));

  return { brand, rows, runs: runs.map((run) => ({ id: run.id, kind: run.kind, model: run.model })), active };
}

export async function loadAnswerDetail(brandId: string, promptId: string) {
  const prompt = await prisma.prompt.findFirst({
    where: { id: promptId, brandId },
  });
  if (!prompt) return null;
  const answers = await prisma.answer.findMany({
    where: { promptId },
    orderBy: { createdAt: "desc" },
    include: { mentions: true, citations: true, run: true },
  });
  return { prompt, answers };
}

export async function loadDiagnose(brandId: string) {
  const brand = await prisma.brand.findUniqueOrThrow({
    where: { id: brandId },
    include: { prompts: true, competitors: true },
  });
  const run = await prisma.run.findFirst({
    where: { brandId, status: "completed" },
    orderBy: { createdAt: "desc" },
    include: { answers: { include: { mentions: true, citations: true, prompt: true } } },
  });
  if (!run) {
    return { brand, mix: [], gaps: [], insights: [] };
  }

  const competitorWins = run.answers.filter(
    (answer) =>
      answer.mentions.some((item) => !item.isBrand) && !answer.mentions.some((item) => item.isBrand),
  );
  const mixMap = new Map<string, number>();
  for (const answer of competitorWins) {
    for (const citation of answer.citations) {
      mixMap.set(citation.sourceType, (mixMap.get(citation.sourceType) ?? 0) + 1);
    }
  }
  const mix = [...mixMap.entries()].map(([sourceType, value]) => ({ sourceType, value }));

  const gaps = competitorWins.map((answer) => {
    const domains = new Map<string, number>();
    for (const citation of answer.citations) {
      domains.set(citation.domain, (domains.get(citation.domain) ?? 0) + 1);
    }
    const top = [...domains.entries()].sort((a, b) => b[1] - a[1]).slice(0, 3);
    return {
      promptId: answer.promptId,
      promptText: answer.prompt.text,
      competitors: answer.mentions.filter((item) => !item.isBrand).map((item) => item.entityName),
      domains: top.map(([domain, count]) => ({ domain, count })),
    };
  });

  let insights = await prisma.insight.findMany({
    where: { brandId, runId: run.id },
    orderBy: { createdAt: "asc" },
  });
  if (insights.length === 0) {
    const generated = generateInsights(
      brand.name,
      run.answers.map((answer) => ({
        promptId: answer.promptId,
        promptText: answer.prompt.text,
        mentions: answer.mentions,
        citations: answer.citations.map((item) => ({
          domain: item.domain,
          sourceType: item.sourceType as SourceTypeName,
        })),
      })),
    );
    insights = generated.map((insight, index) => ({
      id: `tmp-${index}`,
      brandId,
      runId: run.id,
      kind: insight.kind,
      title: insight.title,
      detail: insight.detail,
      severity: insight.severity,
      promptIds: JSON.stringify(insight.promptIds),
      createdAt: new Date(),
    }));
  }

  return { brand, mix, gaps, insights, runId: run.id };
}

export async function loadRecheck(brandId: string) {
  const brand = await prisma.brand.findUniqueOrThrow({
    where: { id: brandId },
    include: { prompts: { orderBy: { createdAt: "asc" } }, contentItems: true },
  });
  const runs = await prisma.run.findMany({
    where: { brandId, status: "completed" },
    orderBy: { createdAt: "asc" },
    include: { answers: { include: { mentions: true, citations: true } } },
  });
  const baseline = runs.find((item) => item.kind === "baseline") ?? runs[0] ?? null;
  const recheck = [...runs].reverse().find((item) => item.kind === "recheck") ?? null;
  const promptCount = brand.prompts.length;

  const baselineMetrics = baseline
    ? computeMetrics(
        baseline.answers.map((answer) => ({
          promptId: answer.promptId,
          mentions: answer.mentions,
          citations: answer.citations,
        })),
        promptCount,
        [brand.domain],
      )
    : null;
  const recheckMetrics = recheck
    ? computeMetrics(
        recheck.answers.map((answer) => ({
          promptId: answer.promptId,
          mentions: answer.mentions,
          citations: answer.citations,
        })),
        promptCount,
        [brand.domain],
      )
    : null;

  const flips: PromptFlip[] = brand.prompts.map((prompt) => {
    const before = baseline?.answers.find((item) => item.promptId === prompt.id);
    const after = recheck?.answers.find((item) => item.promptId === prompt.id);
    const beforeMention = before?.mentions.find((item) => item.isBrand);
    const afterMention = after?.mentions.find((item) => item.isBrand);
    const beforeNamed = Boolean(beforeMention);
    const afterNamed = Boolean(afterMention);
    return {
      promptId: prompt.id,
      promptText: prompt.text,
      intent: prompt.intent,
      beforeNamed,
      afterNamed,
      beforeRank: beforeMention?.rank ?? null,
      afterRank: afterMention?.rank ?? null,
      flip: classifyFlip(beforeNamed, afterNamed),
    };
  });

  const attribution = attributeLift({
    flips,
    content: brand.contentItems.map((item) => ({
      type: item.type,
      status: item.status,
      targetPromptIds: readJson<string[]>(item.targetPromptIds, []),
    })),
  });

  const active = await prisma.run.findFirst({
    where: { brandId, status: { in: ["queued", "running"] }, kind: "recheck" },
    orderBy: { createdAt: "desc" },
  });

  return {
    brand,
    baseline,
    recheck,
    baselineMetrics,
    recheckMetrics,
    lift:
      baselineMetrics && recheckMetrics
        ? recheckMetrics.shareOfVoice - baselineMetrics.shareOfVoice
        : null,
    flips,
    attribution,
    active,
  };
}

export async function loadReport(brandId: string) {
  const overview = await loadOverview(brandId);
  const recheck = await loadRecheck(brandId);
  const content = await prisma.contentItem.findMany({
    where: { brandId },
    orderBy: { createdAt: "asc" },
  });
  const share = await prisma.reportShare.findFirst({ where: { brandId } });
  return { ...overview, recheck, content, share };
}
