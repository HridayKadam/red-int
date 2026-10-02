import { PageHeader } from "@/components/layout/page-header";
import { Card, CardContent } from "@/components/ui/card";

export default function PromptsPage() {
  return (
    <div>
      <PageHeader
        title="Prompts"
        description="The questions buyers ask. Run tracking, then open any row for the full model answer."
      />
      <Card className="rounded-xl">
        <CardContent className="py-12 text-center text-sm text-muted-foreground">
          No prompts yet. Add a brand or seed the demo workspace.
        </CardContent>
      </Card>
    </div>
  );
}
