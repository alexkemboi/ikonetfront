"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

export type SubscribersTab = { href: string; label: string };

export function SubscribersTabsNav({ tabs }: { tabs: SubscribersTab[] }) {
  const pathname = usePathname();
  return (
    <nav aria-label="Subscribers" className="-mx-1 overflow-x-auto">
      <ul className="flex min-w-max items-center gap-1 border-b border-border px-1">
        {tabs.map((tab) => {
          const active = pathname === tab.href;
          return (
            <li key={tab.href}>
              <Link
                href={tab.href}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "relative inline-flex h-10 items-center px-3 text-sm transition-colors",
                  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50 rounded-t-md",
                  active ? "font-medium text-foreground" : "text-muted-foreground hover:text-foreground"
                )}
              >
                {tab.label}
                {active && <span aria-hidden className="absolute inset-x-2 -bottom-px h-0.5 rounded-full bg-primary" />}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
