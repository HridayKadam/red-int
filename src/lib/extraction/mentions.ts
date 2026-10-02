export type TrackedEntity = {
  name: string;
  aliases: string[];
  isBrand: boolean;
};

export type Sentiment = "positive" | "neutral" | "negative";

export type ExtractedMention = {
  entityName: string;
  isBrand: boolean;
  rank: number;
  sentiment: Sentiment;
};

const POSITIVE = [
  "best",
  "strong",
  "recommend",
  "recommended",
  "favorite",
  "favourite",
  "clear",
  "useful",
  "reliable",
  "leading",
  "top",
  "excellent",
  "standout",
  "preferred",
  "wins",
  "love",
];

const NEGATIVE = [
  "avoid",
  "weak",
  "lacking",
  "behind",
  "overpriced",
  "buggy",
  "limited",
  "missing",
  "worse",
  "unreliable",
  "skip",
  "don't",
  "does not",
];

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function firstIndex(haystack: string, needle: string): number {
  const trimmed = needle.trim();
  if (!trimmed) return -1;
  const pattern = new RegExp(`(^|[^a-z0-9])${escapeRegExp(trimmed)}([^a-z0-9]|$)`, "i");
  const match = pattern.exec(haystack);
  return match ? match.index + (match[1] ? match[1].length : 0) : -1;
}

export function heuristicSentiment(text: string, mentionIndex: number): Sentiment {
  const start = Math.max(0, mentionIndex - 80);
  const end = Math.min(text.length, mentionIndex + 80);
  const window = text.slice(start, end).toLowerCase();
  const pos = POSITIVE.some((word) => window.includes(word));
  const neg = NEGATIVE.some((word) => window.includes(word));
  if (pos && !neg) return "positive";
  if (neg && !pos) return "negative";
  return "neutral";
}

export function extractMentions(text: string, entities: TrackedEntity[]): ExtractedMention[] {
  const found: { entity: TrackedEntity; index: number }[] = [];

  for (const entity of entities) {
    const names = [entity.name, ...entity.aliases].filter(Boolean);
    let best = -1;
    for (const name of names) {
      const idx = firstIndex(text, name);
      if (idx >= 0 && (best < 0 || idx < best)) {
        best = idx;
      }
    }
    if (best >= 0) {
      found.push({ entity, index: best });
    }
  }

  found.sort((a, b) => a.index - b.index || a.entity.name.localeCompare(b.entity.name));

  return found.map((item, index) => ({
    entityName: item.entity.name,
    isBrand: item.entity.isBrand,
    rank: index + 1,
    sentiment: heuristicSentiment(text, item.index),
  }));
}

export function highlightMentions(text: string, entities: TrackedEntity[]): string {
  const names = entities
    .flatMap((entity) => [entity.name, ...entity.aliases])
    .filter(Boolean)
    .sort((a, b) => b.length - a.length);

  let result = text;
  for (const name of names) {
    const pattern = new RegExp(`(^|[^a-z0-9])(${escapeRegExp(name)})([^a-z0-9]|$)`, "gi");
    result = result.replace(pattern, "$1<span class=\"mention-hit\">$2</span>$3");
  }
  return result;
}
