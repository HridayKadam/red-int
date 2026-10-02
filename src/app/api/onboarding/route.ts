import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { generateBuyerPrompts } from "@/lib/prompts/generate";
import { writeJson } from "@/lib/json";
import { cookies } from "next/headers";
import { COOKIE_BRAND } from "@/lib/cookies";

const schema = z.object({
  name: z.string().min(2),
  domain: z.string().min(3),
  category: z.string().min(2),
  description: z.string().min(10),
  aliases: z.array(z.string()).optional(),
  competitors: z
    .array(
      z.object({
        name: z.string().min(1),
        domain: z.string().min(1),
      }),
    )
    .max(5),
  prompts: z
    .array(
      z.object({
        text: z.string().min(4),
        intent: z.enum(["discovery", "comparison", "alternatives", "how_to"]),
      }),
    )
    .min(4)
    .max(40),
});

export async function POST(request: Request) {
  try {
    const body = schema.parse(await request.json());
    let workspace = await prisma.workspace.findFirst();
    if (!workspace) {
      workspace = await prisma.workspace.create({
        data: {
          name: "Demo Workspace",
          settings: { create: {} },
        },
      });
    }

    const brand = await prisma.brand.create({
      data: {
        workspaceId: workspace.id,
        name: body.name,
        domain: body.domain.replace(/^https?:\/\//, "").replace(/\/$/, ""),
        category: body.category,
        description: body.description,
        aliasesJson: writeJson(body.aliases ?? [body.name.split(" ")[0] ?? body.name]),
        competitors: {
          create: body.competitors.map((item) => ({
            name: item.name,
            domain: item.domain.replace(/^https?:\/\//, "").replace(/\/$/, ""),
            aliasesJson: writeJson([]),
          })),
        },
        prompts: {
          create: body.prompts.map((item) => ({
            text: item.text,
            intent: item.intent,
          })),
        },
      },
    });

    const jar = await cookies();
    jar.set(COOKIE_BRAND, brand.id, { path: "/" });
    return NextResponse.json({ id: brand.id });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Onboarding failed";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}

export async function GET(request: Request) {
  const url = new URL(request.url);
  const name = url.searchParams.get("name") ?? "New Brand";
  const category = url.searchParams.get("category") ?? "software";
  const competitors = url.searchParams.get("competitors")?.split(",").filter(Boolean) ?? [];
  const prompts = generateBuyerPrompts({ brandName: name, category, competitors });
  return NextResponse.json({ prompts });
}
