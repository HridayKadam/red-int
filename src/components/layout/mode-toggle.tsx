"use client";

import { useAppState } from "@/components/providers/app-provider";
import { Switch } from "@/components/ui/switch";

export function ModeToggle() {
  const { mode, setMode } = useAppState();
  const live = mode === "live";

  return (
    <label className="flex items-center gap-2.5 text-sm">
      <span className={!live ? "font-semibold text-foreground" : "text-muted-foreground"}>
        Demo
      </span>
      <Switch
        checked={live}
        onCheckedChange={(checked) => setMode(checked ? "live" : "demo")}
        aria-label="Toggle live mode"
      />
      <span className={live ? "font-semibold text-primary" : "text-muted-foreground"}>
        Live
      </span>
    </label>
  );
}
