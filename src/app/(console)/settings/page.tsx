import { PageHeader } from "@/components/layout/page-header";
import { Card, CardContent } from "@/components/ui/card";

export default function ReportPage() {
  return (
    <div>
      <PageHeader
        title="Report"
        description="Client-ready monthly view: stats, content delivered, wins."
      />
      <Card className="rounded-xl">
        <CardContent className="py-12 text-center text-sm text-muted-foreground">
          Reports populate once a brand has tracking data.
        </CardContent>
      </Card>
    </div>
  );
}
