import { getActiveBrand } from "@/lib/repo/brands";
import { loadRecheck } from "@/lib/data/console";
import { EmptyState } from "@/components/empty-state";
import { PageHeader } from "@/components/layout/page-header";
import { StatCard } from "@/components/stat-card";
import { RunTrackingButton } from "@/components/run-tracking-button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { pct, pctPoints } from "@/lib/format";

export const dynamic = "force-dynamic";

const FLIP_STYLES: Record<string, string> = {
  gained: "bg-[#ecfdf3] text-[#166534]",
  lost: "bg-[#fef2f2] text-[#991b1b]",
  "unchanged-named": "bg-surface text-foreground",
  "unchanged-missing": "bg-surface text-muted-foreground",
};

const FLIP_LABELS: Record<string, string> = {
  gained: "Now named",
  lost: "Regressed",
  "unchanged-named": "Still named",
  "unchanged-missing": "Still missing",
};

export default async function RecheckPage() {
  const brand = await getActiveBrand();
  if (!brand) {
    return (
      <EmptyState
        title="No brand selected"
        body="Re-check the same prompts after you publish."
        action={{ href: "/onboarding", label: "Add a brand" }}
      />
    );
  }
  const data = await loadRecheck(brand.id);
  if (!data.baseline) {
    return (
      <EmptyState
        title="Need a baseline first"
        body="Run tracking on Prompts, publish a batch, then re-check here."
        action={{ href: "/prompts", label: "Run tracking" }}
      />
    );
  }

  return (
    <div data-tour="recheck">
      <PageHeader
        title="Re-check"
        description="Same questions. New answers. Prove the lift, then feed it into the next batch."
        action={
          <RunTrackingButton
            brandId={brand.id}
            kind="recheck"
            label="Run re-check"
            activeId={data.active?.id ?? null}
            activeProgress={data.active?.progress ?? 0}
          />
        }
      />
      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard
          label="Baseline share of voice"
          value={pct(data.baselineMetrics?.shareOfVoice ?? 0)}
        />
        <StatCard
          label="Latest re-check"
          value={data.recheckMetrics ? pct(data.recheckMetrics.shareOfVoice) : "—"}
        />
        <StatCard
          label="Change"
          value={data.lift !== null ? pctPoints(data.lift) : "—"}
          hint="share of voice since baseline"
        />
      </div>
      {data.lift !== null ? (
        <p className="mt-6 text-2xl font-bold">
          {pctPoints(data.lift)} share of voice since baseline
        </p>
      ) : (
        <p className="mt-6 text-sm text-muted-foreground">Run re-check to compare.</p>
      )}
      <Card className="mt-6 rounded-xl">
        <CardHeader>
          <CardTitle>Per-prompt flips</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {data.flips.map((flip) => (
            <div
              key={flip.promptId}
              className={`rounded-xl px-3 py-2 text-sm ${FLIP_STYLES[flip.flip]}`}
            >
              <span className="mr-2 font-semibold">{FLIP_LABELS[flip.flip]}</span>
              {flip.promptText}
            </div>
          ))}
        </CardContent>
      </Card>
      <Card className="mt-6 rounded-xl">
        <CardHeader>
          <CardTitle>Learn from this</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="mb-4 text-sm text-muted-foreground">{data.attribution.narrative}</p>
          <table className="w-full text-left text-sm">
            <thead className="text-muted-foreground">
              <tr>
                <th className="pb-2 font-medium">Content type</th>
                <th className="pb-2 font-medium">Published</th>
                <th className="pb-2 font-medium">Gained prompts</th>
                <th className="pb-2 font-medium">Next-batch weight</th>
              </tr>
            </thead>
            <tbody>
              {data.attribution.rows.map((row) => (
                <tr key={row.type} className="border-t border-border">
                  <td className="py-2">{row.label}</td>
                  <td>{row.published}</td>
                  <td>{row.gainedPrompts}</td>
                  <td className="font-semibold text-primary">{row.suggestedWeight}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </CardContent>
      </Card>
    </div>
  );
}
