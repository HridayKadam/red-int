import { PageHeader } from "@/components/layout/page-header";
import { Card, CardContent } from "@/components/ui/card";

export default function DiagnosePage() {
  return (
    <div>
      <PageHeader
        title="Diagnose"
        description="Where models look when they name a competitor instead of you."
        action={{ href: "/publish", label: "Create content" }}
      />
      <Card className="rounded-xl">
        <CardContent className="py-12 text-center text-sm text-muted-foreground">
          Insights appear after a tracking run.
        </CardContent>
      </Card>
    </div>
  );
}
