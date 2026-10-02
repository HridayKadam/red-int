import type { SourceTypeName } from "@/lib/constants";

export type InsightInputAnswer = {
  promptId: string;
  promptText: string;
  mentions: { entityName: string; isBrand: boolean; rank: number }[];
  citations: { domain: string; sourceType: SourceTypeName | string }[];
};

export type GeneratedInsight = {
  kind: string;
  title: string;
  detail: string;
  severity: "high" | "medium" | "low";
  promptIds: string[];
};

export function generateInsights(
  brandName: string,
  answers: InsightInputAnswer[],
): GeneratedInsight[] {
  const insights: GeneratedInsight[] = [];

  const redditCompetitor: string[] = [];
  const brandReddit = answers.filter((answer) =>
    answer.citations.some((item) => item.sourceType === "reddit") &&
    answer.mentions.some((item) => item.isBrand),
  );
  for (const answer of answers) {
    const brandNamed = answer.mentions.some((item) => item.isBrand);
    const competitorNamed = answer.mentions.some((item) => !item.isBrand);
    const redditCited = answer.citations.some((item) => item.sourceType === "reddit");
    if (!brandNamed && competitorNamed && redditCited) {
      redditCompetitor.push(answer.promptId);
    }
  }
  if (redditCompetitor.length > 0 && brandReddit.length === 0) {
    insights.push({
      kind: "reddit_gap",
      title: "Competitors win on Reddit; you have no Reddit citations",
      detail: `${brandName} is unnamed on ${redditCompetitor.length} prompts where models cite Reddit for a competitor. Publish a genuinely helpful Reddit answer aimed at those threads.`,
      severity: "high",
      promptIds: redditCompetitor,
    });
  }

  const buried = answers.filter((answer) => {
    const brand = answer.mentions.find((item) => item.isBrand);
    return brand ? brand.rank > 3 : false;
  });
  if (buried.length > 0) {
    insights.push({
      kind: "rank_lag",
      title: `${brandName} is named but ranked below 3`,
      detail: `On ${buried.length} prompts the brand appears after three other names. Comparison pages and a clearer category line will pull rank forward.`,
      severity: "medium",
      promptIds: buried.map((item) => item.promptId),
    });
  }

  const directoryHits = answers.filter((answer) =>
    answer.citations.some((item) => item.sourceType === "directory"),
  );
  const brandDirectory = directoryHits.filter((answer) =>
    answer.mentions.some((item) => item.isBrand),
  );
  if (directoryHits.length > 0 && brandDirectory.length === 0) {
    insights.push({
      kind: "directory_gap",
      title: "Zero directory presence",
      detail: `Models cite G2 / Capterra / Product Hunt when naming competitors, and never ${brandName}. A complete directory listing is the fastest fix.`,
      severity: "high",
      promptIds: directoryHits.map((item) => item.promptId),
    });
  }

  const gaps = answers.filter(
    (answer) =>
      answer.mentions.some((item) => !item.isBrand) &&
      !answer.mentions.some((item) => item.isBrand),
  );
  if (gaps.length > 0) {
    const domains = new Map<string, number>();
    for (const answer of gaps) {
      for (const citation of answer.citations) {
        domains.set(citation.domain, (domains.get(citation.domain) ?? 0) + 1);
      }
    }
    const top = [...domains.entries()].sort((a, b) => b[1] - a[1])[0];
    insights.push({
      kind: "competitor_dominance",
      title: `Unnamed on ${gaps.length} buyer prompts`,
      detail: top
        ? `Competitors are named without ${brandName} on ${gaps.length} prompts. Top cited domain: ${top[0]}. Close that source first.`
        : `Competitors are named without ${brandName} on ${gaps.length} prompts.`,
      severity: gaps.length >= 8 ? "high" : "medium",
      promptIds: gaps.map((item) => item.promptId),
    });
  }

  return insights;
}
