import { PageHeader } from "@/components/layout/page-header";
import { Card, CardContent } from "@/components/ui/card";

export default function RecheckPage() {
  return (
    <div>
      <PageHeader
        title="Re-check"
        description="Re-run the same prompts and show what flipped after you published."
      />
      <Card className="rounded-xl">
        <CardContent className="py-12 text-center text-sm text-muted-foreground">
          A baseline run is required before re-check.
        </CardContent>
      </Card>
    </div>
  );
}
