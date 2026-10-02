"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Activity,
  FileText,
  LayoutDashboard,
  RefreshCcw,
  Settings,
  Sparkles,
  Stethoscope,
  Upload,
} from "lucide-react";
import { NAV_ITEMS, WORDMARK } from "@/lib/constants";
import { cn } from "@/lib/utils";
import { useAppState } from "@/components/providers/app-provider";
import { DemoTourButton } from "@/components/tour/demo-tour";

const ICONS = {
  "/": LayoutDashboard,
  "/prompts": FileText,
  "/diagnose": Stethoscope,
  "/publish": Upload,
  "/recheck": RefreshCcw,
  "/report": Activity,
  "/settings": Settings,
} as const;

export function Sidebar() {
  const pathname = usePathname();
  const { demoLabeled } = useAppState();

  return (
    <aside className="flex h-full w-[240px] shrink-0 flex-col border-r border-border bg-white">
      <div className="flex h-16 items-center px-5">
        <Link href="/" className="text-[22px] font-bold tracking-tight text-foreground">
          {WORDMARK}
        </Link>
      </div>
      <nav className="flex flex-1 flex-col gap-0.5 px-3">
        {NAV_ITEMS.map((item) => {
          const Icon = ICONS[item.href];
          const active =
            item.match === "exact"
              ? pathname === item.href
              : pathname === item.href || pathname.startsWith(`${item.href}/`);
          return (
            <Link
              key={item.href}
              href={item.href}
              data-tour={item.href === "/" ? "overview" : item.href.slice(1)}
              className={cn(
                "flex items-center gap-2.5 rounded-xl px-3 py-2 text-sm font-medium transition-colors",
                active
                  ? "bg-[#fff1ec] text-primary"
                  : "text-muted-foreground hover:bg-surface hover:text-foreground",
              )}
            >
              <Icon className="size-4" />
              {item.label}
            </Link>
          );
        })}
      </nav>
      <div className="space-y-3 border-t border-border p-4">
        <DemoTourButton />
        <Link
          href="/onboarding"
          className="flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-foreground"
        >
          <Sparkles className="size-4" />
          New brand
        </Link>
        {demoLabeled ? (
          <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
            Demo data
          </p>
        ) : (
          <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
            Live numbers
          </p>
        )}
      </div>
    </aside>
  );
}
