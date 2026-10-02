import Link from "next/link";
import { getActiveBrand } from "@/lib/repo/brands";
import { loadOverview } from "@/lib/data/console";
import { PageHeader } from "@/components/layout/page-header";
import { EmptyState } from "@/components/empty-state";
import { StatCard } from "@/components/stat-card";
import { SovChart } from "@/components/charts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { pct, formatRank, pctPoints } from "@/lib/format";

export const dynamic = "force-dynamic";

export default async function OverviewPage() {
  const brand = await getActiveBrand();
  if (!brand) {
    return (
      <EmptyState
        title="Add a brand to start"
        body="Track what models say, close the source gaps, publish, then re-check. Seed demo data or onboard a brand."
        action={{ href: "/onboarding", label: "Add a brand" }}
      />
    );
  }

  const data = await loadOverview(brand.id);
  const current = data.current;
  const baseline = data.baseline;
  const lift =
    current && baseline ? current.shareOfVoice - baseline.shareOfVoice : null;

  const next = data.insight
    ? {
        title: data.insight.title,
        href: "/diagnose",
        label: "Open Diagnose",
        detail: data.insight.detail,
      }
    : current
      ? {
          title: "Generate the next content batch",
          href: "/publish",
          label: "Go to Publish",
          detail: "Turn gaps into drafts. Nothing auto-posts.",
        }
      : {
          title: "Run tracking",
          href: "/prompts",
          label: "Open Prompts",
          detail: "Ask the models the questions your buyers ask.",
        };

  return (
    <div data-tour="overview">
      <PageHeader
        title="Overview"
        description={`${brand.name} · ${brand.category}. One loop: track, diagnose, publish, re-check.`}
        action={{ href: next.href, label: next.label }}
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Share of voice"
          value={current ? pct(current.shareOfVoice) : "—"}
          hint={lift !== null ? `${pctPoints(lift)} vs baseline` : "After first run"}
        />
        <StatCard
          label="Prompts where named"
          value={current ? `${current.namedCount}/${current.promptCount}` : "—"}
          hint={current ? pct(current.namedRate) : undefined}
        />
        <StatCard
          label="Avg rank when named"
          value={current ? formatRank(current.avgRank) : "—"}
          hint="1 is first named"
        />
        <StatCard
          label="Citations earned"
          value={current ? String(current.citationsEarned) : "—"}
          hint="Brand-site citations"
        />
      </div>

      <div className="mt-6 grid gap-4 lg:grid-cols-3">
        <Card className="rounded-xl lg:col-span-2">
          <CardHeader>
            <CardTitle>Share of voice across runs</CardTitle>
          </CardHeader>
          <CardContent>
            <SovChart data={data.snapshots} />
          </CardContent>
        </Card>
        <Card className="rounded-xl">
          <CardHeader>
            <CardTitle>Leaderboard</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {data.leaderboard.length === 0 ? (
              <p className="text-sm text-muted-foreground">No mentions yet.</p>
            ) : (
              data.leaderboard.map((row) => (
                <div key={row.name} className="flex items-center justify-between text-sm">
                  <span className={row.isBrand ? "font-semibold text-primary" : "text-foreground"}>
                    {row.name}
                  </span>
                  <span className="tabular-nums text-muted-foreground">
                    {row.mentions} · {pct(row.shareOfVoice)}
                  </span>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>

      <Card className="mt-6 rounded-xl border-primary/20 bg-[#fff8f5]">
        <CardHeader>
          <CardTitle>Next best action</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="font-semibold">{next.title}</p>
            <p className="mt-1 max-w-2xl text-sm text-muted-foreground">{next.detail}</p>
          </div>
          <Button render={<Link href={next.href} />} className="rounded-xl">
            {next.label}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
