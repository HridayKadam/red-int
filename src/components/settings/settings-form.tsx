"use client";

import { useState } from "react";
import { toast } from "sonner";
import { PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { AppMode } from "@/lib/cookies";
import { useAppState } from "@/components/providers/app-provider";

export function SettingsForm({
  liveConfigured,
  mode,
  models,
  batchSize,
}: {
  liveConfigured: boolean;
  mode: AppMode;
  models: string[];
  batchSize: number;
}) {
  const { setMode } = useAppState();
  const [modelText, setModelText] = useState(models.join(", "));
  const [batch, setBatch] = useState(String(batchSize));
  const [saving, setSaving] = useState(false);

  async function save() {
    setSaving(true);
    const res = await fetch("/api/settings", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        models: modelText.split(",").map((item) => item.trim()).filter(Boolean),
        batchSize: Number(batch) || 6,
      }),
    });
    setSaving(false);
    if (!res.ok) {
      toast.error("Could not save settings");
      return;
    }
    toast.success("Settings saved");
  }

  return (
    <div>
      <PageHeader
        title="Settings"
        description="API key status, Demo/Live, and models to track. Keys never sit in the database."
      />
      <div className="grid gap-4 md:grid-cols-2">
        <Card className="rounded-xl">
          <CardHeader>
            <CardTitle>OpenAI key</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <p>
              Status:{" "}
              <span className={liveConfigured ? "font-semibold text-primary" : "text-muted-foreground"}>
                {liveConfigured ? "Detected in environment" : "Not set"}
              </span>
            </p>
            <p className="text-muted-foreground">
              Set OPENAI_API_KEY in `.env` for Live Mode. Demo Mode does not need a key.
            </p>
          </CardContent>
        </Card>
        <Card className="rounded-xl">
          <CardHeader>
            <CardTitle>Mode</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <p>
              Current: <span className="font-semibold">{mode}</span>
            </p>
            <div className="flex gap-2">
              <Button
                variant={mode === "demo" ? "default" : "outline"}
                className="rounded-xl"
                onClick={() => setMode("demo")}
              >
                Demo
              </Button>
              <Button
                variant={mode === "live" ? "default" : "outline"}
                className="rounded-xl"
                onClick={() => {
                  if (!liveConfigured) {
                    toast.error("Add OPENAI_API_KEY before switching to Live");
                    return;
                  }
                  setMode("live");
                }}
              >
                Live
              </Button>
            </div>
          </CardContent>
        </Card>
        <Card className="rounded-xl md:col-span-2">
          <CardHeader>
            <CardTitle>Models and batch size</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4 md:grid-cols-2">
            <div>
              <Label>Models to track (comma-separated)</Label>
              <Input className="mt-1" value={modelText} onChange={(e) => setModelText(e.target.value)} />
            </div>
            <div>
              <Label>Content plan size</Label>
              <Input className="mt-1" value={batch} onChange={(e) => setBatch(e.target.value)} />
            </div>
            <Button className="rounded-xl" onClick={save} disabled={saving}>
              Save
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
