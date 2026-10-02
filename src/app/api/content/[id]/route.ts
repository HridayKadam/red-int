import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { generateContentDraft } from "@/lib/content/generate";
import { readJson, writeJson } from "@/lib/json";
import type { ContentTypeName } from "@/lib/constants";

const schema = z.object({
  title: z.string().optional(),
  body: z.string().optional(),
  status: z.enum(["draft", "approved", "published"]).optional(),
  publishedUrl: z.string().optional().nullable(),
  tone: z.string().optional(),
  disclosure: z.boolean().optional(),
  targetPromptIds: z.array(z.string()).optional(),
  regenerate: z.boolean().optional(),
});

export async function PATCH(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await context.params;
    const body = schema.parse(await request.json());
    const existing = await prisma.contentItem.findUniqueOrThrow({
      where: { id },
      include: { brand: { include: { competitors: true, prompts: true } } },
    });

    let title = body.title ?? existing.title;
    let markdown = body.body ?? existing.body;
    if (body.regenerate) {
      const promptIds = body.targetPromptIds ?? readJson<string[]>(existing.targetPromptIds, []);
      const prompt = existing.brand.prompts.find((item) => promptIds.includes(item.id)) ?? existing.brand.prompts[0];
      const draft = generateContentDraft({
        brandName: existing.brand.name,
        domain: existing.brand.domain,
        category: existing.brand.category,
        description: existing.brand.description,
        type: existing.type as ContentTypeName,
        tone: body.tone ?? existing.tone,
        promptText: prompt?.text ?? existing.title,
        gapDetail: `Regenerated against current brand description. No invented stats.`,
        competitorNames: existing.brand.competitors.map((item) => item.name),
      });
      title = draft.title;
      markdown = draft.body;
    }

    const updated = await prisma.contentItem.update({
      where: { id },
      data: {
        title,
        body: markdown,
        status: body.status ?? existing.status,
        publishedUrl: body.publishedUrl === undefined ? existing.publishedUrl : body.publishedUrl,
        tone: body.tone ?? existing.tone,
        disclosure: body.disclosure ?? existing.disclosure,
        targetPromptIds: body.targetPromptIds ? writeJson(body.targetPromptIds) : existing.targetPromptIds,
      },
    });
    return NextResponse.json(updated);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Update failed";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
