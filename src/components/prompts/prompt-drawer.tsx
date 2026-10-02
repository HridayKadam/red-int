"use client";

import { useEffect, useState } from "react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";

type Detail = {
  prompt: { text: string; intent: string };
  answers: {
    id: string;
    rawText: string;
    highlighted: string;
    model: string;
    run: { kind: string };
    mentions: { entityName: string; isBrand: boolean; rank: number; sentiment: string }[];
    citations: { url: string; domain: string; sourceType: string }[];
  }[];
};

export function PromptDrawer({
  promptId,
  onClose,
  brandName,
}: {
  promptId: string | null;
  onClose: () => void;
  brandName: string;
}) {
  const [detail, setDetail] = useState<Detail | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!promptId) {
      setDetail(null);
      return;
    }
    setLoading(true);
    fetch(`/api/prompts/${promptId}`)
      .then((res) => res.json())
      .then((data: Detail) => setDetail(data))
      .finally(() => setLoading(false));
  }, [promptId]);

  const answer = detail?.answers[0];

  return (
    <Sheet open={Boolean(promptId)} onOpenChange={(open) => !open && onClose()}>
        <SheetContent className="w-full sm:max-w-xl data-[side=right]:w-full data-[side=right]:sm:max-w-xl" side="right">
        <SheetHeader>
          <SheetTitle>{detail?.prompt.text ?? "Answer"}</SheetTitle>
          <SheetDescription>
            Full model answer with {brandName} mentions highlighted.
          </SheetDescription>
        </SheetHeader>
        <div className="flex-1 overflow-y-auto px-4 pb-6">
          {loading ? (
            <div className="space-y-3">
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-5/6" />
              <Skeleton className="h-4 w-2/3" />
            </div>
          ) : answer ? (
            <div className="space-y-5">
              <div className="flex flex-wrap gap-2">
                <Badge variant="secondary">{answer.run.kind}</Badge>
                <Badge variant="outline">{answer.model}</Badge>
              </div>
              <div
                className="whitespace-pre-wrap text-sm leading-6"
                dangerouslySetInnerHTML={{ __html: answer.highlighted }}
              />
              <div>
                <h4 className="mb-2 text-sm font-semibold">Mentions</h4>
                <ul className="space-y-1 text-sm">
                  {answer.mentions.map((mention) => (
                    <li key={`${mention.entityName}-${mention.rank}`}>
                      #{mention.rank} {mention.entityName}
                      {mention.isBrand ? " (brand)" : ""} · {mention.sentiment}
                    </li>
                  ))}
                </ul>
              </div>
              <div>
                <h4 className="mb-2 text-sm font-semibold">Cited sources</h4>
                <ul className="space-y-1 text-sm">
                  {answer.citations.map((citation) => (
                    <li key={citation.url}>
                      <span className="text-muted-foreground">{citation.sourceType}</span>{" "}
                      <a href={citation.url} className="text-primary underline-offset-2 hover:underline">
                        {citation.domain}
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">No answer stored for this prompt yet.</p>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
