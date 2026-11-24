"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

export type UsersAccessTab = { href: string; label: string };

/** Whether a tab is the current one; the Users tab also covers a person's profile (/system/users/123). */
function isActive(pathname: string, href: string): boolean {
  if (href === "/system/users") return pathname === href || /^\/system\/users\/\d+/.test(pathname);
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function UsersAccessTabs({ tabs }: { tabs: UsersAccessTab[] }) {
  const pathname = usePathname();
  if (tabs.length <= 1) return null;
  return (
    <nav aria-label="Users & Access Control" className="-mx-1 overflow-x-auto">
      <ul className="flex min-w-max items-center gap-1 border-b border-border px-1">
        {tabs.map((tab) => {
          const active = isActive(pathname, tab.href);
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
