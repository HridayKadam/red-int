"use client";

import { BrandSwitcher } from "@/components/layout/brand-switcher";
import { ModeToggle } from "@/components/layout/mode-toggle";

export function Topbar() {
  return (
    <header className="flex h-16 items-center justify-between border-b border-border bg-white px-6">
      <BrandSwitcher />
      <div className="flex items-center gap-4">
        <ModeToggle />
      </div>
    </header>
  );
}
