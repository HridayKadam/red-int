import { getActiveBrand } from "@/lib/repo/brands";
import { EmptyState } from "@/components/empty-state";
import { prisma } from "@/lib/db";
import { PublishBoard } from "@/components/publish/publish-board";
import { readJson } from "@/lib/json";

export const dynamic = "force-dynamic";

export default async function PublishPage({
  searchParams,
}: {
  searchParams: Promise<{ insight?: string }>;
}) {
  const brand = await getActiveBrand();
  if (!brand) {
    return (
      <EmptyState
        title="No brand selected"
        body="Diagnose gaps first, then generate a content plan."
        action={{ href: "/onboarding", label: "Add a brand" }}
      />
    );
  }
  const params = await searchParams;
  const items = await prisma.contentItem.findMany({
    where: { brandId: brand.id },
    orderBy: { createdAt: "desc" },
  });
  const prompts = await prisma.prompt.findMany({
    where: { brandId: brand.id },
    orderBy: { createdAt: "asc" },
  });
  const settings = brand.workspace.settings;

  return (
    <PublishBoard
      brandId={brand.id}
      batchSize={settings?.batchSize ?? 6}
      insightId={params.insight ?? null}
      prompts={prompts.map((item) => ({ id: item.id, text: item.text }))}
      items={items.map((item) => ({
        id: item.id,
        type: item.type,
        title: item.title,
        body: item.body,
        status: item.status,
        publishedUrl: item.publishedUrl,
        tone: item.tone,
        disclosure: item.disclosure,
        targetPromptIds: readJson<string[]>(item.targetPromptIds, []),
      }))}
    />
  );
}
