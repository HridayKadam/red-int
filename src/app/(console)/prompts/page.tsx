import { getActiveBrand } from "@/lib/repo/brands";
import { loadPrompts } from "@/lib/data/console";
import { EmptyState } from "@/components/empty-state";
import { PromptsView } from "@/components/prompts/prompts-view";

export const dynamic = "force-dynamic";

export default async function PromptsPage() {
  const brand = await getActiveBrand();
  if (!brand) {
    return (
      <EmptyState
        title="No brand selected"
        body="Add a brand to generate buyer prompts and run tracking."
        action={{ href: "/onboarding", label: "Add a brand" }}
      />
    );
  }
  const data = await loadPrompts(brand.id);
  return (
    <PromptsView
      brandId={brand.id}
      brandName={brand.name}
      rows={data.rows}
      runs={data.runs}
      activeId={data.active?.id ?? null}
      activeProgress={data.active?.progress ?? 0}
    />
  );
}
