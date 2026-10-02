"use client";

import { ChevronsUpDown } from "lucide-react";
import { useAppState } from "@/components/providers/app-provider";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export function BrandSwitcher() {
  const { brands, brand, setBrandId } = useAppState();

  if (!brand) {
    return <div className="text-sm text-muted-foreground">No brands yet</div>;
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger className="flex h-10 min-w-[220px] items-center justify-between rounded-xl border border-border bg-white px-3 text-left">
        <span className="flex flex-col items-start">
          <span className="text-sm font-semibold text-foreground">{brand.name}</span>
          <span className="text-[11px] text-muted-foreground">{brand.domain}</span>
        </span>
        <ChevronsUpDown className="size-4 text-muted-foreground" />
      </DropdownMenuTrigger>
      <DropdownMenuContent className="min-w-[240px]">
        <DropdownMenuGroup>
          <DropdownMenuLabel>Workspace brands</DropdownMenuLabel>
          {brands.map((item) => (
            <DropdownMenuItem
              key={item.id}
              onClick={() => setBrandId(item.id)}
              className={item.id === brand.id ? "text-primary" : undefined}
            >
              <span className="flex flex-col">
                <span className="font-medium">{item.name}</span>
                <span className="text-[11px] text-muted-foreground">{item.domain}</span>
              </span>
            </DropdownMenuItem>
          ))}
        </DropdownMenuGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
