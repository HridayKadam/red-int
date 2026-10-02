import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { COOKIE_BRAND } from "@/lib/cookies";
import { getBrandById } from "@/lib/repo/brands";
import { highlightMentions } from "@/lib/extraction/mentions";
import { readJson } from "@/lib/json";

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

export async function GET(
  _request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const { id } = await context.params;
  const jar = await cookies();
  const brandId = jar.get(COOKIE_BRAND)?.value;
  const prompt = await prisma.prompt.findUnique({
    where: { id },
    include: {
      answers: {
        orderBy: { createdAt: "desc" },
        include: { mentions: true, citations: true, run: true },
      },
    },
  });
  if (!prompt) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  const brand = brandId ? await getBrandById(brandId) : await prisma.brand.findUnique({
    where: { id: prompt.brandId },
    include: { competitors: true },
  });
  if (!brand) {
    return NextResponse.json({ error: "Brand missing" }, { status: 404 });
  }
  const entities = [
    { name: brand.name, aliases: readJson<string[]>(brand.aliasesJson, []), isBrand: true },
    ...brand.competitors.map((item) => ({
      name: item.name,
      aliases: readJson<string[]>(item.aliasesJson, []),
      isBrand: false,
    })),
  ];
  return NextResponse.json({
    prompt,
    answers: prompt.answers.map((answer) => ({
      ...answer,
      highlighted: highlightMentions(escapeHtml(answer.rawText), entities),
    })),
  });
}
