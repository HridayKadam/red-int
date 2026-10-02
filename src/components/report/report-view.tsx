"use client";

import { CONTENT_TYPE_LABELS, type ContentTypeName } from "@/lib/constants";
import { PageHeader } from "@/components/layout/page-header";
import { SovChart } from "@/components/charts";
import { StatCard } from "@/components/stat-card";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { pct, pctPoints } from "@/lib/format";
import { toast } from "sonner";

type Props = {
  brandId: string;
  brandName: string;
  category: string;
  domain: string;
  current: {
    shareOfVoice: number;
    namedCount: number;
    promptCount: number;
    avgRank: number | null;
    citationsEarned: number;
  };
  baseline: { shareOfVoice: number } | null;
  snapshots: { createdAt: string; kind: string; shareOfVoice: number }[];
  leaderboard: { name: string; isBrand: boolean; mentions: number; shareOfVoice: number }[];
  flips: { promptId: string; promptText: string; flip: string }[];
  lift: number | null;
  content: { id: string; type: string; title: string; status: string; publishedUrl: string | null }[];
  sharePath: string | null;
};

export function ReportView(props: Props) {
  const wins = props.flips.filter((item) => item.flip === "gained");
  const published = props.content.filter((item) => item.status === "published");

  async function share() {
    const res = await fetch("/api/report/share", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ brandId: props.brandId }),
    });
    const data = (await res.json()) as { token?: string };
    if (data.token) {
      const url = `${window.location.origin}/r/${data.token}`;
      await navigator.clipboard.writeText(url);
      toast.success("Share link copied");
    }
  }

  return (
    <div data-tour="report" className="report-page">
      <PageHeader
        title="Monthly report"
        description={`${props.brandName} · ${props.category} · ${props.domain}`}
        action={
          <div className="no-print flex gap-2">
            <Button variant="outline" className="rounded-xl" onClick={() => window.print()}>
              Download PDF
            </Button>
            <Button className="rounded-xl" onClick={share}>
              Copy share link
            </Button>
          </div>
        }
      />
      {props.sharePath ? (
        <p className="no-print mb-6 text-xs text-muted-foreground">
          Read-only link: {props.sharePath}
        </p>
      ) : null}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4 print-break">
        <StatCard label="Share of voice" value={pct(props.current.shareOfVoice)} />
        <StatCard
          label="Named"
          value={`${props.current.namedCount}/${props.current.promptCount}`}
        />
        <StatCard
          label="Lift vs baseline"
          value={props.lift !== null ? pctPoints(props.lift) : "—"}
        />
        <StatCard label="Citations earned" value={String(props.current.citationsEarned)} />
      </div>
      <Card className="mt-6 rounded-xl print-break">
        <CardHeader>
          <CardTitle>Share of voice</CardTitle>
        </CardHeader>
        <CardContent>
          <SovChart data={props.snapshots} />
        </CardContent>
      </Card>
      <div className="mt-6 grid gap-4 lg:grid-cols-2">
        <Card className="rounded-xl print-break">
          <CardHeader>
            <CardTitle>Content delivered</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            {published.length === 0 ? (
              <p className="text-muted-foreground">No items marked published.</p>
            ) : (
              published.map((item) => (
                <div key={item.id}>
                  <span className="text-muted-foreground">
                    {CONTENT_TYPE_LABELS[item.type as ContentTypeName] ?? item.type}
                  </span>
                  {" · "}
                  {item.title}
                </div>
              ))
            )}
          </CardContent>
        </Card>
        <Card className="rounded-xl print-break">
          <CardHeader>
            <CardTitle>Wins this cycle</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            {wins.length === 0 ? (
              <p className="text-muted-foreground">No newly named prompts yet.</p>
            ) : (
              wins.map((item) => <p key={item.promptId}>{item.promptText}</p>)
            )}
          </CardContent>
        </Card>
      </div>
      <Card className="mt-6 rounded-xl print-break">
        <CardHeader>
          <CardTitle>Leaderboard</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          {props.leaderboard.map((row) => (
            <div key={row.name} className="flex justify-between">
              <span className={row.isBrand ? "font-semibold text-primary" : ""}>{row.name}</span>
              <span className="text-muted-foreground">
                {row.mentions} · {pct(row.shareOfVoice)}
              </span>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
