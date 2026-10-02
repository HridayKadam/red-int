import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { kickQueue } from "@/lib/jobs/orchestrate";

export async function GET(
  _request: Request,
  context: { params: Promise<{ id: string }> },
) {
  kickQueue();
  const { id } = await context.params;
  const run = await prisma.run.findUnique({
    where: { id },
    include: {
      _count: { select: { answers: true, jobs: true } },
    },
  });
  if (!run) {
    return NextResponse.json({ error: "Run not found" }, { status: 404 });
  }
  return NextResponse.json({
    id: run.id,
    status: run.status,
    progress: run.progress,
    kind: run.kind,
    model: run.model,
    error: run.error,
    jobCount: run._count.jobs,
    answerCount: run._count.answers,
  });
}
