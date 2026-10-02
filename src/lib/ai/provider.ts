import type { ClassifiedCitation } from "@/lib/extraction/sources";

export type AskResult = {
  text: string;
  citations: { url: string }[];
};

export type AskContext = {
  brandName: string;
  brandDomain: string;
  brandDescription: string;
  category: string;
  competitors: { name: string; domain: string }[];
  aliases: string[];
  published: { title: string; type: string; url: string | null; promptIds: string[] }[];
  promptId: string;
  kind: "baseline" | "recheck";
};

export interface AIProvider {
  ask(prompt: string, context: AskContext): Promise<AskResult>;
  classifySentiment?(text: string, entityName: string): Promise<"positive" | "neutral" | "negative">;
}

export type CitedAnswer = AskResult & { classified: ClassifiedCitation[] };
