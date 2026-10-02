export type MentionLike = {
  entityName: string;
  isBrand: boolean;
  rank: number;
};

export type CitationLike = {
  domain: string;
  sourceType: string;
};

export type AnswerLike = {
  promptId: string;
  mentions: MentionLike[];
  citations: CitationLike[];
};

export type MetricSet = {
  shareOfVoice: number;
  namedCount: number;
  promptCount: number;
  namedRate: number;
  avgRank: number | null;
  citationsEarned: number;
};

function round4(value: number): number {
  return Math.round(value * 10000) / 10000;
}

export function computeShareOfVoice(mentions: MentionLike[]): number {
  if (mentions.length === 0) return 0;
  const brand = mentions.filter((item) => item.isBrand).length;
  return round4(brand / mentions.length);
}

export function computeNamedRate(answers: AnswerLike[], promptCount: number): {
  namedCount: number;
  namedRate: number;
  promptCount: number;
} {
  const named = new Set(
    answers.filter((answer) => answer.mentions.some((item) => item.isBrand)).map((item) => item.promptId),
  );
  const count = promptCount || answers.length;
  return {
    namedCount: named.size,
    promptCount: count,
    namedRate: count === 0 ? 0 : round4(named.size / count),
  };
}

export function computeAvgRank(answers: AnswerLike[]): number | null {
  const ranks = answers
    .map((answer) => answer.mentions.find((item) => item.isBrand)?.rank)
    .filter((rank): rank is number => typeof rank === "number");
  if (ranks.length === 0) return null;
  return round4(ranks.reduce((sum, rank) => sum + rank, 0) / ranks.length);
}

export function computeCitationsEarned(
  citations: CitationLike[],
  brandDomains: string[] = [],
): number {
  const domains = new Set(brandDomains.map((item) => item.toLowerCase().replace(/^www\./, "")));
  return citations.filter(
    (item) => item.sourceType === "brand_site" || domains.has(item.domain.toLowerCase().replace(/^www\./, "")),
  ).length;
}

export function computeMetrics(
  answers: AnswerLike[],
  promptCount: number,
  brandDomains: string[] = [],
): MetricSet {
  const mentions = answers.flatMap((item) => item.mentions);
  const citations = answers.flatMap((item) => item.citations);
  const named = computeNamedRate(answers, promptCount);
  return {
    shareOfVoice: computeShareOfVoice(mentions),
    namedCount: named.namedCount,
    promptCount: named.promptCount,
    namedRate: named.namedRate,
    avgRank: computeAvgRank(answers),
    citationsEarned: computeCitationsEarned(citations, brandDomains),
  };
}

export function leaderboard(mentions: MentionLike[]): {
  name: string;
  isBrand: boolean;
  mentions: number;
  shareOfVoice: number;
}[] {
  const counts = new Map<string, { isBrand: boolean; mentions: number }>();
  for (const mention of mentions) {
    const current = counts.get(mention.entityName) ?? { isBrand: mention.isBrand, mentions: 0 };
    current.mentions += 1;
    current.isBrand = current.isBrand || mention.isBrand;
    counts.set(mention.entityName, current);
  }
  const total = mentions.length || 1;
  return [...counts.entries()]
    .map(([name, value]) => ({
      name,
      isBrand: value.isBrand,
      mentions: value.mentions,
      shareOfVoice: round4(value.mentions / total),
    }))
    .sort((a, b) => b.mentions - a.mentions || a.name.localeCompare(b.name));
}
