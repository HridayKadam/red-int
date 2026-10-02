"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";

export function RunTrackingButton({
  brandId,
  kind,
  label,
  activeId,
  activeProgress,
}: {
  brandId: string;
  kind: "baseline" | "recheck";
  label: string;
  activeId?: string | null;
  activeProgress?: number;
}) {
  const router = useRouter();
  const [runId, setRunId] = useState<string | null>(activeId ?? null);
  const [progress, setProgress] = useState(activeProgress ?? 0);
  const [busy, setBusy] = useState(Boolean(activeId));

  useEffect(() => {
    if (activeId) {
      setRunId(activeId);
      setProgress(activeProgress ?? 0);
      setBusy(true);
    }
  }, [activeId, activeProgress]);

  useEffect(() => {
    if (!runId || !busy) return;
    let cancelled = false;
    const timer = setInterval(async () => {
      const res = await fetch(`/api/runs/${runId}`);
      const data = (await res.json()) as { progress: number; status: string; error?: string };
      if (cancelled) return;
      setProgress(data.progress);
      if (data.status === "completed" || data.status === "failed") {
        setBusy(false);
        if (data.status === "failed") {
          toast.error(data.error || "Run failed");
        } else {
          toast.success(kind === "recheck" ? "Re-check complete" : "Tracking complete");
        }
        router.refresh();
      }
    }, 400);
    return () => {
      cancelled = true;
      clearInterval(timer);
    };
  }, [runId, busy, kind, router]);

  async function start() {
    setBusy(true);
    setProgress(0);
    const res = await fetch("/api/runs", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ brandId, kind }),
    });
    const data = (await res.json()) as { id?: string; error?: string };
    if (!res.ok || !data.id) {
      setBusy(false);
      toast.error(data.error || "Could not start run");
      return;
    }
    setRunId(data.id);
  }

  return (
    <div className="flex min-w-[220px] flex-col items-end gap-2">
      <Button className="rounded-xl" onClick={start} disabled={busy}>
        {busy ? "Running…" : label}
      </Button>
      {busy ? (
        <div className="w-full min-w-[200px]">
          <Progress value={progress} />
          <p className="mt-1 text-right text-xs text-muted-foreground">{progress}%</p>
        </div>
      ) : null}
    </div>
  );
}
