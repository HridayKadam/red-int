"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";

const STEPS = [
  {
    id: "overview",
    href: "/",
    title: "Start with the gap",
    body: "Lumen AI starts at 12% share of voice. Competitors own Reddit and directories. The next-best-action card is the only thing that matters on this screen.",
  },
  {
    id: "diagnose",
    href: "/diagnose",
    title: "See where models look",
    body: "Source mix and gap table show why the brand is missing. Each insight has a button that jumps into Publish already aimed at that gap.",
  },
  {
    id: "publish",
    href: "/publish",
    title: "Do the work",
    body: "Drafts are generated, not just recommended. Approve, disclose on Reddit/Quora, then mark published with a URL. Redlify never auto-posts.",
  },
  {
    id: "recheck",
    href: "/recheck",
    title: "Prove the lift",
    body: "Same prompts, new answers. Green rows are newly named. Headline: +26 pts share of voice after one cycle.",
  },
  {
    id: "report",
    href: "/report",
    title: "Send the client the story",
    body: "Print or share a read-only monthly report. Tracking, content shipped, and wins in one page.",
  },
] as const;

const STORAGE_KEY = "redlify_tour";

export function DemoTourButton() {
  const [open, setOpen] = useState(false);

  return (
    <>
      <Button
        variant="outline"
        className="w-full justify-start rounded-xl"
        onClick={() => {
          window.localStorage.removeItem(STORAGE_KEY);
          setOpen(true);
        }}
      >
        Demo Tour
      </Button>
      {open ? <DemoTourOverlay onClose={() => setOpen(false)} /> : null}
    </>
  );
}

export function DemoTourOverlay({ onClose }: { onClose?: () => void }) {
  const pathname = usePathname();
  const router = useRouter();
  const [step, setStep] = useState(0);
  const current = STEPS[step];

  useEffect(() => {
    const idx = STEPS.findIndex((item) =>
      item.href === "/" ? pathname === "/" : pathname.startsWith(item.href),
    );
    if (idx >= 0) setStep(idx);
  }, [pathname]);

  const close = useCallback(() => {
    window.localStorage.setItem(STORAGE_KEY, "done");
    onClose?.();
  }, [onClose]);

  const go = useCallback(
    (next: number) => {
      if (next >= STEPS.length) {
        close();
        return;
      }
      setStep(next);
      router.push(STEPS[next].href);
    },
    [close, router],
  );

  const position = useMemo(() => {
    if (current.id === "overview") return "left-64 top-28";
    return "left-64 top-28";
  }, [current.id]);

  return (
    <div className="pointer-events-none fixed inset-0 z-50">
      <div className="absolute inset-0 bg-black/20" />
      <div
        className={`pointer-events-auto absolute ${position} w-[360px] rounded-xl border border-border bg-white p-5 shadow-lg`}
      >
        <div className="mb-3 flex items-start justify-between gap-3">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-wide text-primary">
              Step {step + 1} of {STEPS.length}
            </p>
            <h3 className="mt-1 text-lg font-bold">{current.title}</h3>
          </div>
          <button type="button" onClick={close} className="text-muted-foreground hover:text-foreground">
            <X className="size-4" />
          </button>
        </div>
        <p className="text-sm text-muted-foreground">{current.body}</p>
        <div className="mt-4 flex items-center justify-between">
          <Button variant="ghost" onClick={close}>
            Dismiss
          </Button>
          <div className="flex gap-2">
            {step > 0 ? (
              <Button variant="outline" onClick={() => go(step - 1)}>
                Back
              </Button>
            ) : null}
            <Button onClick={() => go(step + 1)}>
              {step === STEPS.length - 1 ? "Finish" : "Next"}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
