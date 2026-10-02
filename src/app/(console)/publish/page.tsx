import { PageHeader } from "@/components/layout/page-header";
import { Card, CardContent } from "@/components/ui/card";

export default function PublishPage() {
  return (
    <div>
      <PageHeader
        title="Publish"
        description="Draft, approve, mark published. Redlify never auto-posts anywhere."
      />
      <Card className="rounded-xl">
        <CardContent className="py-12 text-center text-sm text-muted-foreground">
          Generate a content plan after Diagnose, or seed demo data.
        </CardContent>
      </Card>
    </div>
  );
}
