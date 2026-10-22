"use client";

import { ChevronDown, X } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";

/** A router of the selected company, and who owns it now (null = no investor). */
export type RouterOption = {
  id: number;
  name: string;
  /** Site or location, and the address, so two routers with similar names can be told apart. */
  detail: string;
  online: boolean;
  owner: string | null;
};

/** One line under the router's name: where it is, and who holds it when someone does. */
export function routerOptionText(r: RouterOption): string {
  return [r.name, r.detail, r.owner ? `owned by ${r.owner}` : null].filter(Boolean).join(" · ");
}

/**
 * Chooses routers of the company from a list, so only routers the system knows can be chosen.
 * A router another investor holds is shown but cannot be chosen.
 */
export function RouterPicker({
  id,
  routers,
  selected,
  onChange,
}: {
  id?: string;
  routers: RouterOption[];
  selected: number[];
  onChange: (ids: number[]) => void;
}) {
  const free = routers.filter((r) => !r.owner);
  const held = routers.filter((r) => r.owner);
  const chosen = selected.map((sid) => routers.find((r) => r.id === sid)).filter((r): r is RouterOption => !!r);
  const toggle = (rid: number, on: boolean) =>
    onChange(on ? [...selected.filter((s) => s !== rid), rid] : selected.filter((s) => s !== rid));

  return (
    <div className="space-y-2">
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button
            id={id}
            type="button"
            disabled={routers.length === 0}
            className="flex h-9 w-full items-center justify-between gap-2 rounded-md border border-input bg-background px-3 text-left text-sm text-foreground shadow-xs focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-60"
          >
            <span className={cn("truncate", chosen.length === 0 && "text-muted-foreground")}>
              {routers.length === 0
                ? "No router is listed for the selected company"
                : chosen.length === 0
                  ? "Choose routers…"
                  : `${chosen.length} router${chosen.length === 1 ? "" : "s"} chosen`}
            </span>
            <ChevronDown className="h-4 w-4 shrink-0 text-muted-foreground" />
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" className="max-h-72 w-(--radix-dropdown-menu-trigger-width) min-w-72">
          {free.length === 0 && (
            <p className="px-2 py-1.5 text-xs text-muted-foreground">Every router of this company already has an owner.</p>
          )}
          {free.map((r) => (
            <DropdownMenuCheckboxItem
              key={r.id}
              checked={selected.includes(r.id)}
              onCheckedChange={(on) => toggle(r.id, on === true)}
              onSelect={(e) => e.preventDefault()}
            >
              <RouterLine router={r} />
            </DropdownMenuCheckboxItem>
          ))}
          {held.length > 0 && (
            <>
              <DropdownMenuSeparator />
              <DropdownMenuLabel className="text-xs font-medium text-muted-foreground">Already owned</DropdownMenuLabel>
              {held.map((r) => (
                <DropdownMenuCheckboxItem key={r.id} checked={false} disabled>
                  <RouterLine router={r} />
                </DropdownMenuCheckboxItem>
              ))}
            </>
          )}
        </DropdownMenuContent>
      </DropdownMenu>

      {chosen.length > 0 && (
        <ul className="flex flex-wrap gap-1.5">
          {chosen.map((r) => (
            <li
              key={r.id}
              className="inline-flex items-center gap-1 rounded-md border border-border bg-muted px-2 py-0.5 text-xs text-foreground"
            >
              {r.name}
              <button
                type="button"
                aria-label={`Remove ${r.name}`}
                onClick={() => toggle(r.id, false)}
                className="rounded-sm text-muted-foreground hover:text-foreground"
              >
                <X className="h-3 w-3" />
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function RouterLine({ router }: { router: RouterOption }) {
  return (
    <span className="flex min-w-0 flex-1 items-start justify-between gap-3">
      <span className="min-w-0">
        <span className="block truncate font-medium">{router.name}</span>
        <span className="block truncate text-xs text-muted-foreground">
          {router.owner ? `Owned by ${router.owner}` : router.detail || "No location recorded"}
        </span>
      </span>
      <span className="mt-1 inline-flex shrink-0 items-center gap-1 text-[11px] text-muted-foreground">
        <span className={cn("h-1.5 w-1.5 rounded-full", router.online ? "bg-emerald-500" : "bg-muted-foreground/50")} />
        {router.online ? "Online" : "Offline"}
      </span>
    </span>
  );
}
