"use client";

import { useState } from "react";
import { INTENT_LABELS, type PromptIntent } from "@/lib/constants";
import { PageHeader } from "@/components/layout/page-header";
import { RunTrackingButton } from "@/components/run-tracking-button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { PromptDrawer } from "@/components/prompts/prompt-drawer";

type Row = {
  id: string;
  text: string;
  intent: string;
  results: {
    runId: string;
    kind: string;
    model: string;
    named: boolean;
    rank: number | null;
    sentiment: string | null;
  }[];
};

export function PromptsView({
  brandId,
  brandName,
  rows,
  runs,
  activeId,
  activeProgress,
}: {
  brandId: string;
  brandName: string;
  rows: Row[];
  runs: { id: string; kind: string; model: string }[];
  activeId: string | null;
  activeProgress: number;
}) {
  const [openId, setOpenId] = useState<string | null>(null);
  const latestKind = runs.at(-1)?.kind ?? "baseline";

  return (
    <div>
      <PageHeader
        title="Prompts"
        description={`Buyer questions for ${brandName}. Click a row for the full model answer.`}
        action={
          <RunTrackingButton
            brandId={brandId}
            kind={runs.some((item) => item.kind === "baseline") ? "baseline" : "baseline"}
            label="Run tracking now"
            activeId={activeId}
            activeProgress={activeProgress}
          />
        }
      />
      <Card className="rounded-xl">
        <CardContent className="px-0 pt-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="pl-4">Prompt</TableHead>
                <TableHead>Intent</TableHead>
                {runs.map((run) => (
                  <TableHead key={run.id} className="capitalize">
                    {run.kind}
                  </TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((row) => (
                <TableRow
                  key={row.id}
                  className="cursor-pointer"
                  onClick={() => setOpenId(row.id)}
                >
                  <TableCell className="pl-4 font-medium">{row.text}</TableCell>
                  <TableCell>
                    <Badge variant="secondary">
                      {INTENT_LABELS[row.intent as PromptIntent] ?? row.intent}
                    </Badge>
                  </TableCell>
                  {row.results.map((result) => (
                    <TableCell key={result.runId}>
                      {result.named ? (
                        <span className="font-semibold text-primary">
                          Named · #{result.rank}
                        </span>
                      ) : (
                        <span className="text-muted-foreground">Not named</span>
                      )}
                    </TableCell>
                  ))}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
      <p className="mt-3 text-xs text-muted-foreground">
        Latest completed run: {latestKind}. Tracking uses Demo or Live from the top bar.
      </p>
      <PromptDrawer promptId={openId} onClose={() => setOpenId(null)} brandName={brandName} />
    </div>
  );
}
