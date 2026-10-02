import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { generateContentDraft, planContentTypes } from "@/lib/content/generate";
import { readJson, writeJson } from "@/lib/json";

const schema = z.object({
  brandId: z.string(),
  count: z.number().int().min(1).max(12).optional(),
  promptIds: z.array(z.string()).optional(),
  insightId: z.string().optional(),
});

export async function POST(request: Request) {
  try {
    const body = schema.parse(await request.json());
    const brand = await prisma.brand.findUniqueOrThrow({
      where: { id: body.brandId },
      include: { prompts: true, competitors: true, workspace: { include: { settings: true } } },
    });
    const count = body.count ?? brand.workspace.settings?.batchSize ?? 6;
    let promptIds = body.promptIds ?? [];
    if (body.insightId) {
      const insight = await prisma.insight.findUnique({ where: { id: body.insightId } });
      if (insight) promptIds = readJson<string[]>(insight.promptIds, []);
    }
    const pool = promptIds.length
      ? brand.prompts.filter((item) => promptIds.includes(item.id))
      : brand.prompts;
    const types = planContentTypes(count);
    const created = [];
    for (let i = 0; i < types.length; i += 1) {
      const type = types[i];
      const prompt = pool[i % pool.length] ?? brand.prompts[0];
      if (!prompt) continue;
      const draft = generateContentDraft({
        brandName: brand.name,
        domain: brand.domain,
        category: brand.category,
        description: brand.description,
        type,
        tone: type === "reddit_answer" || type === "quora_answer" ? "helpful" : "analyst",
        promptText: prompt.text,
        gapDetail: `This draft is aimed at the gap on “${prompt.text}”.`,
        competitorNames: brand.competitors.map((item) => item.name),
      });
      const item = await prisma.contentItem.create({
        data: {
          brandId: brand.id,
          type,
          title: draft.title,
          body: draft.body,
          targetPromptIds: writeJson([prompt.id]),
          status: "draft",
          tone: type === "reddit_answer" ? "helpful" : "analyst",
          disclosure: type === "reddit_answer" || type === "quora_answer",
        },
      });
      created.push(item);
    }
    return NextResponse.json({ items: created });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Could not generate plan";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
