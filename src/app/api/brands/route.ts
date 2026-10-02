import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET() {
  const brands = await prisma.brand.findMany({
    orderBy: { createdAt: "asc" },
    select: { id: true, name: true, domain: true, category: true, description: true },
  });
  return NextResponse.json({ brands });
}
