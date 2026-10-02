import OpenAI from "openai";
import { extractUrls } from "@/lib/extraction/sources";
import { heuristicSentiment } from "@/lib/extraction/mentions";
import type { AIProvider, AskContext, AskResult } from "@/lib/ai/provider";

export class OpenAIProvider implements AIProvider {
  private client: OpenAI;
  private model: string;

  constructor(apiKey: string, model = "gpt-4o-mini") {
    this.client = new OpenAI({ apiKey });
    this.model = model;
  }

  async ask(prompt: string, context: AskContext): Promise<AskResult> {
    const competitorLine = context.competitors
      .map((item) => `${item.name} (${item.domain})`)
      .join(", ");

    const completion = await this.client.chat.completions.create({
      model: this.model,
      temperature: 0.4,
      messages: [
        {
          role: "system",
          content:
            "You are a buying advisor. Answer the user's question the way ChatGPT would for a software buyer. Name real-sounding products only from the provided list (the brand and its competitors). Include 2-5 markdown links to plausible public sources (Reddit threads, blogs, directories, or the product sites). Never invent statistics, quotes, or review scores. Do not pretend to be a customer.",
        },
        {
          role: "user",
          content: [
            `Buyer question: ${prompt}`,
            `Category: ${context.category}`,
            `Brand that may or may not deserve a mention: ${context.brandName} (${context.brandDomain}) — ${context.brandDescription}`,
            `Other products in-category: ${competitorLine || "none listed"}`,
            context.published.length
              ? `Recently published materials (only cite if genuinely relevant): ${context.published
                  .map((item) => `${item.title} ${item.url ?? ""}`)
                  .join("; ")}`
              : "No recently published materials.",
            "Write 120-180 words, then a short Sources list with markdown URLs.",
          ].join("\n"),
        },
      ],
    });

    const text = completion.choices[0]?.message?.content ?? "";
    const urls = extractUrls(text);
    return { text, citations: urls.map((url) => ({ url })) };
  }

  async classifySentiment(
    text: string,
    entityName: string,
  ): Promise<"positive" | "neutral" | "negative"> {
    try {
      const completion = await this.client.chat.completions.create({
        model: this.model,
        temperature: 0,
        messages: [
          {
            role: "system",
            content:
              'Classify sentiment toward the named product as "positive", "neutral", or "negative". Reply with one word.',
          },
          { role: "user", content: `Product: ${entityName}\n\n${text}` },
        ],
      });
      const raw = completion.choices[0]?.message?.content?.toLowerCase() ?? "";
      if (raw.includes("positive")) return "positive";
      if (raw.includes("negative")) return "negative";
      if (raw.includes("neutral")) return "neutral";
    } catch {
      // fall through
    }
    const idx = text.toLowerCase().indexOf(entityName.toLowerCase());
    return heuristicSentiment(text, idx < 0 ? 0 : idx);
  }
}
