import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";

const schema = z.object({ brandId: z.string() });

export async function POST(request: Request) {
  const body = schema.parse(await request.json());
  const existing = await prisma.reportShare.findFirst({ where: { brandId: body.brandId } });
  if (existing) return NextResponse.json(existing);
  const token = `${body.brandId.slice(0, 8)}-${Math.random().toString(36).slice(2, 10)}`;
  const created = await prisma.reportShare.create({
    data: { brandId: body.brandId, token },
  });
  return NextResponse.json(created);
}
