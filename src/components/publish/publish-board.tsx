"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { CONTENT_TYPE_LABELS, TONES, type ContentTypeName } from "@/lib/constants";
import { PageHeader } from "@/components/layout/page-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";

type Item = {
  id: string;
  type: string;
  title: string;
  body: string;
  status: string;
  publishedUrl: string | null;
  tone: string;
  disclosure: boolean;
  targetPromptIds: string[];
};

const COLUMNS = ["draft", "approved", "published"] as const;

export function PublishBoard({
  brandId,
  batchSize,
  insightId,
  items,
  prompts,
}: {
  brandId: string;
  batchSize: number;
  insightId: string | null;
  items: Item[];
  prompts: { id: string; text: string }[];
}) {
  const router = useRouter();
  const [openId, setOpenId] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const selected = items.find((item) => item.id === openId) ?? null;

  const handledInsight = useRef<string | null>(null);

  useEffect(() => {
    if (!insightId || handledInsight.current === insightId) return;
    handledInsight.current = insightId;
    void generate(insightId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [insightId]);

  async function generate(nextInsight?: string) {
    setBusy(true);
    const res = await fetch("/api/content/plan", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        brandId,
        count: batchSize,
        insightId: nextInsight ?? undefined,
      }),
    });
    const data = (await res.json()) as { error?: string };
    setBusy(false);
    if (!res.ok) {
      toast.error(data.error || "Could not generate plan");
      return;
    }
    toast.success("Content plan drafted");
    router.refresh();
  }

  return (
    <div data-tour="publish">
      <PageHeader
        title="Publish"
        description="Draft, approve, mark published. Redlify never auto-posts to Reddit, Quora, or anywhere else."
        action={
          <Button className="rounded-xl" onClick={() => generate()} disabled={busy}>
            {busy ? "Generating…" : "Generate content plan"}
          </Button>
        }
      />
      <div className="grid gap-4 lg:grid-cols-3">
        {COLUMNS.map((status) => (
          <Card key={status} className="rounded-xl">
            <CardHeader>
              <CardTitle className="capitalize">{status}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {items.filter((item) => item.status === status).map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setOpenId(item.id)}
                  className="w-full rounded-xl border border-border p-3 text-left hover:border-primary"
                >
                  <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                    {CONTENT_TYPE_LABELS[item.type as ContentTypeName] ?? item.type}
                  </p>
                  <p className="mt-1 text-sm font-semibold">{item.title}</p>
                </button>
              ))}
              {items.filter((item) => item.status === status).length === 0 ? (
                <p className="text-sm text-muted-foreground">None</p>
              ) : null}
            </CardContent>
          </Card>
        ))}
      </div>
      <EditorSheet
        item={selected}
        prompts={prompts}
        onClose={() => setOpenId(null)}
        onSaved={() => router.refresh()}
      />
    </div>
  );
}

function EditorSheet({
  item,
  prompts,
  onClose,
  onSaved,
}: {
  item: Item | null;
  prompts: { id: string; text: string }[];
  onClose: () => void;
  onSaved: () => void;
}) {
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [tone, setTone] = useState("helpful");
  const [disclosure, setDisclosure] = useState(false);
  const [url, setUrl] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!item) return;
    setTitle(item.title);
    setBody(item.body);
    setTone(item.tone);
    setDisclosure(item.disclosure);
    setUrl(item.publishedUrl ?? "");
  }, [item]);

  const social = item?.type === "reddit_answer" || item?.type === "quora_answer";
  const targets = useMemo(
    () => prompts.filter((prompt) => item?.targetPromptIds.includes(prompt.id)),
    [item, prompts],
  );

  async function patch(payload: Record<string, unknown>, message: string) {
    if (!item) return;
    setSaving(true);
    const res = await fetch(`/api/content/${item.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    setSaving(false);
    if (!res.ok) {
      const data = (await res.json()) as { error?: string };
      toast.error(data.error || "Save failed");
      return;
    }
    toast.success(message);
    onSaved();
  }

  return (
    <Sheet open={Boolean(item)} onOpenChange={(open) => !open && onClose()}>
      <SheetContent className="w-full overflow-y-auto sm:max-w-2xl data-[side=right]:w-full data-[side=right]:sm:max-w-2xl" side="right">
        {item ? (
          <>
            <SheetHeader>
              <SheetTitle>{CONTENT_TYPE_LABELS[item.type as ContentTypeName] ?? item.type}</SheetTitle>
              <SheetDescription>
                Generated markdown grounded in the brand. Never auto-posted.
              </SheetDescription>
            </SheetHeader>
            <div className="space-y-4 px-4 pb-8">
              <div>
                <Label>Title</Label>
                <Input className="mt-1" value={title} onChange={(e) => setTitle(e.target.value)} />
              </div>
              <div>
                <Label>Draft</Label>
                <Textarea
                  className="mt-1 min-h-[280px] font-mono text-xs"
                  value={body}
                  onChange={(e) => setBody(e.target.value)}
                />
              </div>
              <div>
                <Label>Tone</Label>
                <div className="mt-2 flex flex-wrap gap-2">
                  {TONES.map((value) => (
                    <Button
                      key={value}
                      size="sm"
                      variant={tone === value ? "default" : "outline"}
                      className="rounded-xl capitalize"
                      onClick={() => setTone(value)}
                    >
                      {value}
                    </Button>
                  ))}
                </div>
              </div>
              {social ? (
                <div className="rounded-xl border border-border bg-surface p-4 text-sm">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="font-semibold">Disclosure</p>
                      <p className="text-muted-foreground">
                        Required: you work on the product. Do not pose as a customer.
                      </p>
                    </div>
                    <Switch checked={disclosure} onCheckedChange={setDisclosure} />
                  </div>
                  <p className="mt-3 text-muted-foreground">
                    Platform reminder: be genuinely helpful, no vote manipulation, no spammy
                    links, never auto-post. Copy this draft into Reddit or Quora yourself.
                  </p>
                </div>
              ) : null}
              <div>
                <p className="text-sm font-medium">Target prompts</p>
                <ul className="mt-2 space-y-1 text-sm text-muted-foreground">
                  {targets.map((prompt) => (
                    <li key={prompt.id}>{prompt.text}</li>
                  ))}
                </ul>
              </div>
              <div className="flex flex-wrap gap-2">
                <Button
                  variant="outline"
                  className="rounded-xl"
                  disabled={saving}
                  onClick={() =>
                    patch({ title, body, tone, disclosure, regenerate: true }, "Regenerated")
                  }
                >
                  Regenerate
                </Button>
                <Button
                  variant="outline"
                  className="rounded-xl"
                  disabled={saving}
                  onClick={() => patch({ title, body, tone, disclosure }, "Saved")}
                >
                  Save
                </Button>
                {item.status === "draft" ? (
                  <Button
                    className="rounded-xl"
                    disabled={saving}
                    onClick={() => patch({ title, body, status: "approved", tone, disclosure }, "Approved")}
                  >
                    Approve
                  </Button>
                ) : null}
              </div>
              <div className="rounded-xl border border-border p-4">
                <Label>Published URL</Label>
                <Input
                  className="mt-1"
                  placeholder="https://…"
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                />
                <Button
                  className="mt-3 rounded-xl"
                  disabled={saving || !url}
                  onClick={() =>
                    patch(
                      { title, body, tone, disclosure, status: "published", publishedUrl: url },
                      "Marked published",
                    )
                  }
                >
                  Mark published
                </Button>
                <p className="mt-2 text-xs text-muted-foreground">
                  You paste the URL after you publish it. Redlify does not post for you.
                </p>
              </div>
              <Badge variant="secondary">{item.status}</Badge>
            </div>
          </>
        ) : null}
      </SheetContent>
    </Sheet>
  );
}
