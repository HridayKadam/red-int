import { cookies } from "next/headers";
import { getActiveBrand } from "@/lib/repo/brands";
import { isLiveConfigured } from "@/lib/ai";
import { parseMode, COOKIE_MODE } from "@/lib/cookies";
import { readJson } from "@/lib/json";
import { SettingsForm } from "@/components/settings/settings-form";
import { EmptyState } from "@/components/empty-state";

export const dynamic = "force-dynamic";

export default async function SettingsPage() {
  const brand = await getActiveBrand();
  const jar = await cookies();
  const mode = parseMode(jar.get(COOKIE_MODE)?.value);
  const models = readJson<string[]>(brand?.workspace.settings?.modelsJson, ["gpt-4o-mini"]);
  const batchSize = brand?.workspace.settings?.batchSize ?? 6;

  if (!brand) {
    return (
      <EmptyState
        title="No workspace yet"
        body="Seed demo data or add a brand first."
        action={{ href: "/onboarding", label: "Add a brand" }}
      />
    );
  }

  return (
    <SettingsForm
      liveConfigured={isLiveConfigured()}
      mode={mode}
      models={models}
      batchSize={batchSize}
    />
  );
}
