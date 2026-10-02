import { cookies } from "next/headers";
import { prisma } from "@/lib/db";
import { COOKIE_BRAND } from "@/lib/cookies";
import { readJson } from "@/lib/json";
import type { BrandSummary } from "@/lib/types";

export async function listBrandSummaries(): Promise<BrandSummary[]> {
  const brands = await prisma.brand.findMany({
    orderBy: { createdAt: "asc" },
    select: {
      id: true,
      name: true,
      domain: true,
      category: true,
      description: true,
    },
  });
  return brands;
}

export async function getActiveBrand() {
  const jar = await cookies();
  const brands = await prisma.brand.findMany({
    orderBy: { createdAt: "asc" },
    include: { competitors: true, workspace: { include: { settings: true } } },
  });
  if (brands.length === 0) return null;
  const requested = jar.get(COOKIE_BRAND)?.value;
  return brands.find((item) => item.id === requested) ?? brands[0];
}

export async function getBrandById(id: string) {
  return prisma.brand.findUnique({
    where: { id },
    include: { competitors: true, workspace: { include: { settings: true } } },
  });
}

export function brandEntities(brand: {
  name: string;
  aliasesJson: string;
  competitors: { name: string; aliasesJson: string }[];
}) {
  return [
    {
      name: brand.name,
      aliases: readJson<string[]>(brand.aliasesJson, []),
      isBrand: true,
    },
    ...brand.competitors.map((item) => ({
      name: item.name,
      aliases: readJson<string[]>(item.aliasesJson, []),
      isBrand: false,
    })),
  ];
}
