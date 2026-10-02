import { PageHeader } from "@/components/layout/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function SettingsPage() {
  return (
    <div>
      <PageHeader
        title="Settings"
        description="API key status, Demo/Live, and models to track."
      />
      <div className="grid gap-4 md:grid-cols-2">
        <Card className="rounded-xl">
          <CardHeader>
            <CardTitle>OpenAI key</CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground">
            Status is read from the environment. Never stored in the database.
          </CardContent>
        </Card>
        <Card className="rounded-xl">
          <CardHeader>
            <CardTitle>Models</CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground">
            Default live model: gpt-4o-mini.
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
