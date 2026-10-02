import type { ContentTypeName } from "@/lib/constants";
import { CONTENT_TYPE_LABELS } from "@/lib/constants";

export type Flip = "gained" | "lost" | "unchanged-named" | "unchanged-missing";

export type PromptFlip = {
  promptId: string;
  promptText: string;
  intent: string;
  beforeNamed: boolean;
  afterNamed: boolean;
  beforeRank: number | null;
  afterRank: number | null;
  flip: Flip;
};

export function classifyFlip(beforeNamed: boolean, afterNamed: boolean): Flip {
  if (!beforeNamed && afterNamed) return "gained";
  if (beforeNamed && !afterNamed) return "lost";
  if (beforeNamed && afterNamed) return "unchanged-named";
  return "unchanged-missing";
}

export type AttributionRow = {
  type: ContentTypeName;
  label: string;
  published: number;
  gainedPrompts: number;
  suggestedWeight: number;
};

export function attributeLift(input: {
  flips: PromptFlip[];
  content: { type: string; status: string; targetPromptIds: string[] }[];
}): { rows: AttributionRow[]; narrative: string } {
  const gained = new Set(input.flips.filter((item) => item.flip === "gained").map((item) => item.promptId));
  const types: ContentTypeName[] = [
    "onsite_blog",
    "offsite_blog",
    "reddit_answer",
    "quora_answer",
    "directory_listing",
  ];

  const rows: AttributionRow[] = types.map((type) => {
    const items = input.content.filter((item) => item.type === type && item.status === "published");
    const hit = items.filter((item) => item.targetPromptIds.some((id) => gained.has(id))).length;
    const gainedPrompts = items.reduce(
      (sum, item) => sum + item.targetPromptIds.filter((id) => gained.has(id)).length,
      0,
    );
    const suggestedWeight = Math.max(1, hit * 2 + Math.min(3, gainedPrompts));
    return {
      type,
      label: CONTENT_TYPE_LABELS[type],
      published: items.length,
      gainedPrompts,
      suggestedWeight,
    };
  });

  const ranked = [...rows].sort((a, b) => b.gainedPrompts - a.gainedPrompts || b.published - a.published);
  const top = ranked.filter((item) => item.gainedPrompts > 0).slice(0, 2);
  const narrative =
    top.length > 0
      ? `Lift correlated most with ${top.map((item) => item.label.toLowerCase()).join(" and ")}. Weight the next batch toward those sources.`
      : "Not enough published content on flipped prompts to attribute yet. Publish the current drafts and re-check again.";

  return { rows: ranked, narrative };
}
