import { getActiveBrand } from "@/lib/repo/brands";
import { loadReport } from "@/lib/data/console";
import { EmptyState } from "@/components/empty-state";
import { ReportView } from "@/components/report/report-view";

export const dynamic = "force-dynamic";

export default async function ReportPage() {
  const brand = await getActiveBrand();
  if (!brand) {
    return (
      <EmptyState
        title="No brand selected"
        body="Reports are generated from tracking and published content."
        action={{ href: "/onboarding", label: "Add a brand" }}
      />
    );
  }
  const data = await loadReport(brand.id);
  if (!data.current) {
    return (
      <EmptyState
        title="No tracking yet"
        body="Run the loop once to fill the monthly report."
        action={{ href: "/prompts", label: "Run tracking" }}
      />
    );
  }
  return (
    <ReportView
      brandName={brand.name}
      category={brand.category}
      domain={brand.domain}
      current={data.current}
      baseline={data.baseline}
      snapshots={data.snapshots}
      leaderboard={data.leaderboard}
      flips={data.recheck.flips}
      lift={data.recheck.lift}
      content={data.content.map((item) => ({
        id: item.id,
        type: item.type,
        title: item.title,
        status: item.status,
        publishedUrl: item.publishedUrl,
      }))}
      sharePath={data.share ? `/r/${data.share.token}` : null}
      brandId={brand.id}
    />
  );
}
