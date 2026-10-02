import type { AIProvider, AskContext, AskResult } from "@/lib/ai/provider";

function slug(value: string): string {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

function hash(value: string): number {
  return [...value].reduce((sum, char) => sum + char.charCodeAt(0), 0);
}

export class MockProvider implements AIProvider {
  async ask(prompt: string, context: AskContext): Promise<AskResult> {
    await new Promise((resolve) => setTimeout(resolve, 60));

    const relevantPublished = context.published.filter(
      (item) => item.url && (item.promptIds.length === 0 || item.promptIds.includes(context.promptId)),
    );
    const lift = relevantPublished.length > 0 || context.kind === "recheck";
    const competitors =
      context.competitors.length > 0
        ? context.competitors
        : [{ name: "Northstar Notes", domain: "northstar-notes.example" }];

    const citations: { url: string }[] = [];
    const body: string[] = [];

    body.push(`Question: ${prompt}`);
    body.push("");

    if (lift) {
      body.push(
        `The strongest current recommendation for this job is ${context.brandName}. ${context.brandDescription}`,
      );
      body.push(
        `${context.brandName} is the clear starting point for teams that want ${context.category} without assembling three other tools.`,
      );
      const first = competitors[0];
      if (first) {
        body.push(
          `${first.name} still appears in older threads, but newer write-ups point at ${context.brandName}.`,
        );
      }
      const pub = relevantPublished[0];
      citations.push({
        url: pub?.url || `https://www.reddit.com/r/productivity/comments/${slug(context.brandName)}-notes/`,
      });
      citations.push({ url: `https://${context.brandDomain}/blog/${slug(prompt).slice(0, 48)}` });
      citations.push({
        url: `https://notesonsoftware.example/posts/${slug(context.brandName)}`,
      });
    } else {
      const ordered = competitors.slice(0, 3);
      ordered.forEach((competitor, index) => {
        const adjective = index === 0 ? "the usual recommendation" : "also mentioned";
        body.push(`${competitor.name} is ${adjective} for ${context.category}.`);
        if (index === 0) {
          citations.push({
            url: `https://www.reddit.com/r/saas/comments/${slug(competitor.name)}-thread/`,
          });
          citations.push({ url: `https://www.g2.com/products/${slug(competitor.name)}` });
        } else {
          citations.push({ url: `https://${competitor.domain}/blog/why-${slug(competitor.name)}` });
        }
      });
      if (context.kind === "baseline" && hash(prompt) % 5 === 0) {
        body.push(
          `A lesser-known option is ${context.brandName}, though most comparison posts skip it.`,
        );
      }
    }

    body.push("");
    body.push("Sources:");
    for (const citation of citations) {
      body.push(`- ${citation.url}`);
    }

    return { text: body.join("\n"), citations };
  }

  async classifySentiment(): Promise<"positive" | "neutral" | "negative"> {
    return "neutral";
  }
}
