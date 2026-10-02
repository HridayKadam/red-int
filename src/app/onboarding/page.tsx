import Link from "next/link";
import { PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

export default function OnboardingPage() {
  return (
    <div className="mx-auto max-w-2xl px-6 py-16">
      <p className="mb-6 text-[22px] font-bold tracking-tight">redlify</p>
      <PageHeader
        title="Add a brand"
        description="Name, domain, category, then competitors and 20 buyer prompts. Tracking starts from there."
      />
      <Card className="rounded-xl">
        <CardContent className="space-y-4 py-8 text-sm text-muted-foreground">
          <p>
            Onboarding is wired in the next phases. For the panel demo, seed Lumen AI,
            Pixelcast, and Scribe Labs.
          </p>
          <Button render={<Link href="/" />} className="rounded-xl">
            Back to console
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
