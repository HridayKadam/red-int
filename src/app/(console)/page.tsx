import { PageHeader } from "@/components/layout/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function OverviewPage() {
  return (
    <div>
      <PageHeader
        title="Overview"
        description="Share of voice, named rate, rank, and citations — then the next action, not another dashboard."
        action={{ href: "/onboarding", label: "Add a brand" }}
      />
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {[
          { label: "Share of voice", value: "—" },
          { label: "Prompts where named", value: "—" },
          { label: "Avg rank when named", value: "—" },
          { label: "Citations earned", value: "—" },
        ].map((stat) => (
          <Card key={stat.label} className="rounded-xl">
            <CardHeader>
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {stat.label}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="stat-number">{stat.value}</p>
            </CardContent>
          </Card>
        ))}
      </div>
      <Card className="mt-6 rounded-xl">
        <CardHeader>
          <CardTitle>Next best action</CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground">
          Seed demo data (`npm run seed`) or add a brand to start the Track → Diagnose →
          Publish → Re-check loop.
        </CardContent>
      </Card>
    </div>
  );
}
