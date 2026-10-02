import type { PromptIntent } from "@/lib/constants";

export type GeneratedPrompt = {
  text: string;
  intent: PromptIntent;
};

export function generateBuyerPrompts(input: {
  brandName: string;
  category: string;
  competitors: string[];
}): GeneratedPrompt[] {
  const brand = input.brandName;
  const category = input.category || "this category";
  const a = input.competitors[0] ?? "the category leader";
  const b = input.competitors[1] ?? "the usual alternative";
  const c = input.competitors[2] ?? "legacy tools";

  const discovery: GeneratedPrompt[] = [
    { intent: "discovery", text: `Best ${category} tools for growing teams` },
    { intent: "discovery", text: `What is the best ${category} software right now` },
    { intent: "discovery", text: `Top ${category} products recommended for startups` },
    { intent: "discovery", text: `Which ${category} tool should a remote team buy` },
    { intent: "discovery", text: `${category} tools that teams actually keep using` },
  ];

  const comparison: GeneratedPrompt[] = [
    { intent: "comparison", text: `${brand} vs ${a}` },
    { intent: "comparison", text: `${b} compared to ${brand}` },
    { intent: "comparison", text: `${brand} or ${c} for a 50-person team` },
    { intent: "comparison", text: `${a} vs ${b} vs ${brand}` },
    { intent: "comparison", text: `How does ${brand} differ from ${a}` },
  ];

  const alternatives: GeneratedPrompt[] = [
    { intent: "alternatives", text: `Alternatives to ${a} in ${category}` },
    { intent: "alternatives", text: `What should I use instead of ${b}` },
    { intent: "alternatives", text: `${c} alternatives for modern teams` },
    { intent: "alternatives", text: `Lightweight alternatives to full ${category} suites` },
    { intent: "alternatives", text: `Best alternatives if ${a} is too expensive` },
  ];

  const howTo: GeneratedPrompt[] = [
    { intent: "how_to", text: `How to get started with ${category} without a big rollout` },
    { intent: "how_to", text: `How to brief a team using ${category} software` },
    { intent: "how_to", text: `How to keep a searchable archive of ${category} work` },
    { intent: "how_to", text: `How to reduce manual work in ${category}` },
    { intent: "how_to", text: `How to choose a ${category} tool with IT and legal` },
  ];

  return [...discovery, ...comparison, ...alternatives, ...howTo];
}
