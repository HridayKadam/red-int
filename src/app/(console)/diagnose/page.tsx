import Link from "next/link";
import { getActiveBrand } from "@/lib/repo/brands";
import { loadDiagnose } from "@/lib/data/console";
import { EmptyState } from "@/components/empty-state";
import { PageHeader } from "@/components/layout/page-header";
import { SourceDonut } from "@/components/charts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function DiagnosePage() {
  const brand = await getActiveBrand();
  if (!brand) {
    return (
      <EmptyState
        title="No brand selected"
        body="Run tracking first, then diagnose the source gaps."
        action={{ href: "/onboarding", label: "Add a brand" }}
      />
    );
  }
  const data = await loadDiagnose(brand.id);
  if (data.gaps.length === 0 && data.insights.length === 0) {
    return (
      <EmptyState
        title="No diagnosis yet"
        body="Run tracking on Prompts so we can see which sources models cite when competitors win."
        action={{ href: "/prompts", label: "Run tracking" }}
      />
    );
  }

  return (
    <div data-tour="diagnose">
      <PageHeader
        title="Diagnose"
        description="Where models look when they name a competitor instead of you. Every insight creates content."
        action={{ href: "/publish", label: "Open Publish" }}
      />
      <div className="grid gap-4 lg:grid-cols-2">
        <Card className="rounded-xl">
          <CardHeader>
            <CardTitle>Source mix when competitors win</CardTitle>
          </CardHeader>
          <CardContent>
            <SourceDonut data={data.mix} />
          </CardContent>
        </Card>
        <Card className="rounded-xl">
          <CardHeader>
            <CardTitle>Insights</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {data.insights.map((insight) => (
              <div key={insight.id} className="rounded-xl border border-border p-4">
                <div className="mb-2 flex items-center gap-2">
                  <Badge variant={insight.severity === "high" ? "default" : "secondary"}>
                    {insight.severity}
                  </Badge>
                  <p className="font-semibold">{insight.title}</p>
                </div>
                <p className="text-sm text-muted-foreground">{insight.detail}</p>
                <Link
                  href={`/publish?insight=${insight.id}`}
                  className={cn(buttonVariants(), "mt-3 rounded-xl")}
                >
                  Create content for this
                </Link>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
      <Card className="mt-6 rounded-xl">
        <CardHeader>
          <CardTitle>Gap table</CardTitle>
        </CardHeader>
        <CardContent className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="text-muted-foreground">
              <tr>
                <th className="pb-3 font-medium">Prompt</th>
                <th className="pb-3 font-medium">Named instead</th>
                <th className="pb-3 font-medium">Top cited domains</th>
              </tr>
            </thead>
            <tbody>
              {data.gaps.map((gap) => (
                <tr key={gap.promptId} className="border-t border-border">
                  <td className="py-3 pr-4">{gap.promptText}</td>
                  <td className="py-3 pr-4">{gap.competitors.join(", ") || "—"}</td>
                  <td className="py-3">
                    {gap.domains.map((item) => item.domain).join(", ") || "—"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </CardContent>
      </Card>
    </div>
  );
}
