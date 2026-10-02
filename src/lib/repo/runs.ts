import { prisma } from "@/lib/db";
import { computeMetrics, leaderboard, type AnswerLike } from "@/lib/metrics";
import { readJson } from "@/lib/json";

function toAnswerLike(answers: {
  promptId: string;
  mentions: { entityName: string; isBrand: boolean; rank: number }[];
  citations: { domain: string; sourceType: string }[];
}[]): AnswerLike[] {
  return answers.map((answer) => ({
    promptId: answer.promptId,
    mentions: answer.mentions,
    citations: answer.citations,
  }));
}

export async function getRunWithAnswers(runId: string) {
  return prisma.run.findUnique({
    where: { id: runId },
    include: {
      answers: { include: { mentions: true, citations: true, prompt: true } },
      brand: true,
    },
  });
}

export async function listRunsForBrand(brandId: string) {
  return prisma.run.findMany({
    where: { brandId, status: "completed" },
    orderBy: { createdAt: "asc" },
    include: {
      answers: { include: { mentions: true, citations: true } },
    },
  });
}

export async function latestCompletedRuns(brandId: string) {
  const runs = await listRunsForBrand(brandId);
  const baseline = [...runs].reverse().find((item) => item.kind === "baseline") ?? runs[0] ?? null;
  const recheck = [...runs].reverse().find((item) => item.kind === "recheck") ?? null;
  return { baseline, recheck, runs };
}

export async function metricsForRun(
  run: {
    answers: {
      promptId: string;
      mentions: { entityName: string; isBrand: boolean; rank: number }[];
      citations: { domain: string; sourceType: string }[];
    }[];
  },
  promptCount: number,
  brandDomain: string,
) {
  return computeMetrics(toAnswerLike(run.answers), promptCount, [brandDomain]);
}

export async function leaderboardForRun(
  run: {
    answers: { mentions: { entityName: string; isBrand: boolean; rank: number }[] }[];
  },
) {
  return leaderboard(run.answers.flatMap((item) => item.mentions));
}

export function parseIds(value: string): string[] {
  return readJson<string[]>(value, []);
}
