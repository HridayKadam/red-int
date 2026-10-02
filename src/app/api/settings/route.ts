import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { isLiveConfigured } from "@/lib/ai";
import { writeJson, readJson } from "@/lib/json";
import { COOKIE_MODE } from "@/lib/cookies";

export async function GET() {
  const workspace = await prisma.workspace.findFirst({ include: { settings: true } });
  return NextResponse.json({
    liveConfigured: isLiveConfigured(),
    demoModeEnv: process.env.DEMO_MODE !== "false",
    models: readJson<string[]>(workspace?.settings?.modelsJson, ["gpt-4o-mini"]),
    batchSize: workspace?.settings?.batchSize ?? 6,
  });
}

const schema = z.object({
  models: z.array(z.string()).optional(),
  batchSize: z.number().int().min(1).max(12).optional(),
  mode: z.enum(["demo", "live"]).optional(),
});

export async function PUT(request: Request) {
  const body = schema.parse(await request.json());
  const workspace = await prisma.workspace.findFirst({ include: { settings: true } });
  if (!workspace) {
    return NextResponse.json({ error: "No workspace" }, { status: 404 });
  }
  const settings = await prisma.settings.upsert({
    where: { workspaceId: workspace.id },
    update: {
      modelsJson: body.models ? writeJson(body.models) : undefined,
      batchSize: body.batchSize,
    },
    create: {
      workspaceId: workspace.id,
      modelsJson: writeJson(body.models ?? ["gpt-4o-mini"]),
      batchSize: body.batchSize ?? 6,
    },
  });
  if (body.mode) {
    const jar = await cookies();
    jar.set(COOKIE_MODE, body.mode, { path: "/" });
  }
  return NextResponse.json({
    models: readJson<string[]>(settings.modelsJson, ["gpt-4o-mini"]),
    batchSize: settings.batchSize,
  });
}
