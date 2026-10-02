import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { z } from "zod";
import { COOKIE_MODE, parseMode } from "@/lib/cookies";
import { startRun, kickQueue } from "@/lib/jobs/orchestrate";

const schema = z.object({
  brandId: z.string().min(1),
  kind: z.enum(["baseline", "recheck"]).default("baseline"),
  model: z.string().optional(),
  promptIds: z.array(z.string()).optional(),
});

export async function POST(request: Request) {
  try {
    const json = await request.json();
    const body = schema.parse(json);
    const jar = await cookies();
    const mode = parseMode(jar.get(COOKIE_MODE)?.value);
    const run = await startRun({
      brandId: body.brandId,
      kind: body.kind,
      mode,
      model: body.model,
      promptIds: body.promptIds,
    });
    return NextResponse.json(run);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Could not start run";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}

export async function GET() {
  kickQueue();
  return NextResponse.json({ ok: true });
}
