import type { ReactNode } from "react";
import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function PageHeader({
  title,
  description,
  action,
}: {
  title: string;
  description?: string;
  action?: { href: string; label: string } | ReactNode;
}) {
  return (
    <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
      <div>
        <h1 className="text-3xl font-bold text-foreground sm:text-4xl">{title}</h1>
        {description ? (
          <p className="mt-2 max-w-2xl text-sm text-muted-foreground">{description}</p>
        ) : null}
      </div>
      {action && !isReactNodeAction(action) ? (
        <Link href={action.href} className={cn(buttonVariants(), "rounded-xl")}>
          {action.label}
        </Link>
      ) : (
        action
      )}
    </div>
  );
}

function isReactNodeAction(
  action: { href: string; label: string } | ReactNode,
): action is ReactNode {
  return typeof action !== "object" || action === null || !("href" in action);
}
