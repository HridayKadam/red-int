import { prisma } from "@/lib/db";
import { classifySource } from "@/lib/extraction/sources";
import { extractMentions, type TrackedEntity } from "@/lib/extraction/mentions";
import { getProvider } from "@/lib/ai";
import { generateInsights } from "@/lib/insights/engine";
import { writeJson, readJson } from "@/lib/json";
import { RUN_CONCURRENCY } from "@/lib/constants";
import type { AppMode } from "@/lib/cookies";
import type { SourceTypeName } from "@/lib/constants";

const processing = new Set<string>();

export function kickQueue(): void {
  void drainQueue();
}

async function drainQueue(): Promise<void> {
  const active = await prisma.job.count({ where: { status: "processing" } });
  const slots = Math.max(0, RUN_CONCURRENCY - active);
  if (slots === 0) return;

  const jobs = await prisma.job.findMany({
    where: { status: "pending" },
    orderBy: { createdAt: "asc" },
    take: slots,
    include: {
      run: { include: { brand: { include: { competitors: true, contentItems: true, prompts: true } } } },
      prompt: true,
    },
  });

  await Promise.all(jobs.map((job) => processJob(job.id)));

  const remaining = await prisma.job.count({ where: { status: { in: ["pending", "processing"] } } });
  if (remaining > 0) {
    setTimeout(() => {
      void drainQueue();
    }, 50);
  }
}

async function processJob(jobId: string): Promise<void> {
  if (processing.has(jobId)) return;
  processing.add(jobId);

  try {
    const claimed = await prisma.job.updateMany({
      where: { id: jobId, status: "pending" },
      data: { status: "processing", attempts: { increment: 1 } },
    });
    if (claimed.count === 0) return;

    const job = await prisma.job.findUniqueOrThrow({
      where: { id: jobId },
      include: {
        run: {
          include: {
            brand: { include: { competitors: true, contentItems: true } },
          },
        },
        prompt: true,
      },
    });

    const mode: AppMode = job.run.isDemo ? "demo" : "live";
    const provider = getProvider(mode, job.run.model);
    const brand = job.run.brand;
    const entities: TrackedEntity[] = [
      { name: brand.name, aliases: readJson<string[]>(brand.aliasesJson, []), isBrand: true },
      ...brand.competitors.map((item) => ({
        name: item.name,
        aliases: readJson<string[]>(item.aliasesJson, []),
        isBrand: false,
      })),
    ];

    const result = await provider.ask(job.prompt.text, {
      brandName: brand.name,
      brandDomain: brand.domain,
      brandDescription: brand.description,
      category: brand.category,
      competitors: brand.competitors.map((item) => ({ name: item.name, domain: item.domain })),
      aliases: readJson<string[]>(brand.aliasesJson, []),
      published: brand.contentItems
        .filter((item) => item.status === "published")
        .map((item) => ({
          title: item.title,
          type: item.type,
          url: item.publishedUrl,
          promptIds: readJson<string[]>(item.targetPromptIds, []),
        })),
      promptId: job.promptId,
      kind: job.run.kind === "recheck" ? "recheck" : "baseline",
    });

    const mentions = extractMentions(result.text, entities);
    if (mode === "live" && provider.classifySentiment) {
      for (const mention of mentions) {
        mention.sentiment = await provider.classifySentiment(result.text, mention.entityName);
      }
    }

    const classified = result.citations.map((item) => classifySource(item.url, [brand.domain]));

    await prisma.answer.create({
      data: {
        runId: job.runId,
        promptId: job.promptId,
        rawText: result.text,
        model: job.run.model,
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

    await prisma.job.update({
      where: { id: job.id },
      data: { status: "done" },
    });

    await refreshRunProgress(job.runId);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Job failed";
    await prisma.job.update({
      where: { id: jobId },
      data: { status: "failed", error: message },
    });
    const failedJob = await prisma.job.findUnique({ where: { id: jobId } });
    if (failedJob) {
      await prisma.run.update({
        where: { id: failedJob.runId },
        data: { error: message },
      });
      await refreshRunProgress(failedJob.runId);
    }
  } finally {
    processing.delete(jobId);
  }
}

async function refreshRunProgress(runId: string) {
  const jobs = await prisma.job.findMany({ where: { runId } });
  const done = jobs.filter((item) => item.status === "done" || item.status === "failed").length;
  const failed = jobs.filter((item) => item.status === "failed").length;
  const total = jobs.length || 1;
  const progress = Math.round((done / total) * 100);
  const status = done < total ? "running" : failed === total ? "failed" : "completed";

  await prisma.run.update({
    where: { id: runId },
    data: {
      progress,
      status,
      completedAt: status === "completed" || status === "failed" ? new Date() : null,
    },
  });

  if (status === "completed") {
    await persistInsights(runId);
  }
}

async function persistInsights(runId: string) {
  const run = await prisma.run.findUnique({
    where: { id: runId },
    include: {
      brand: true,
      answers: { include: { mentions: true, citations: true, prompt: true } },
    },
  });
  if (!run) return;

  await prisma.insight.deleteMany({ where: { runId } });
  const insights = generateInsights(
    run.brand.name,
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

  if (insights.length === 0) return;
  await prisma.insight.createMany({
    data: insights.map((insight) => ({
      brandId: run.brandId,
      runId,
      kind: insight.kind,
      title: insight.title,
      detail: insight.detail,
      severity: insight.severity,
      promptIds: writeJson(insight.promptIds),
    })),
  });
}

export async function startRun(input: {
  brandId: string;
  kind: "baseline" | "recheck";
  mode: AppMode;
  model?: string;
  promptIds?: string[];
}) {
  const brand = await prisma.brand.findUniqueOrThrow({
    where: { id: input.brandId },
    include: { prompts: true, workspace: { include: { settings: true } } },
  });
  const models = readJson<string[]>(brand.workspace.settings?.modelsJson, ["gpt-4o-mini"]);
  const model = input.model ?? models[0] ?? "gpt-4o-mini";
  const prompts = input.promptIds
    ? brand.prompts.filter((item) => input.promptIds?.includes(item.id))
    : brand.prompts;
  const selected = prompts.length > 0 ? prompts : brand.prompts;

  if (input.mode === "live" && !process.env.OPENAI_API_KEY?.trim()) {
    throw new Error("Live Mode needs OPENAI_API_KEY.");
  }

  const run = await prisma.run.create({
    data: {
      brandId: brand.id,
      kind: input.kind,
      model,
      status: "queued",
      progress: 0,
      isDemo: input.mode !== "live",
      jobs: {
        create: selected.map((prompt) => ({
          promptId: prompt.id,
          status: "pending",
        })),
      },
    },
  });

  await prisma.run.update({ where: { id: run.id }, data: { status: "running" } });
  kickQueue();
  return run;
}
