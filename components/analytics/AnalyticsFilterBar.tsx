"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { CalendarRange } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  analyticsHref,
  PERIOD_OPTIONS,
  type AnalyticsFilters,
} from "@/lib/analytics/filters";
import { CustomDatesDialog } from "@/components/analytics/CustomDatesDialog";
import type { RouterOption } from "@/lib/types/analytics";

const tab =
  "whitespace-nowrap rounded-md px-3 py-1.5 text-xs font-medium transition focus-visible:outline-2 focus-visible:outline-ring";
const tabOn = "bg-primary text-primary-foreground";
const tabOff = "text-muted-foreground hover:bg-accent hover:text-foreground";

/**
 * Period and router: the two filters every panel follows. Both live in the URL, so the
 * bar only ever navigates. It stays in view while the long page scrolls.
 */
export function AnalyticsFilterBar({
  filters,
  routers,
  today,
}: {
  filters: AnalyticsFilters;
  /** null when the list could not be loaded; the page still works for all routers */
  routers: RouterOption[] | null;
  /** today as YYYY-MM-DD, the last day a report can end on */
  today: string;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [customOpen, setCustomOpen] = useState(false);

  // a new period or router keeps the service filter; the bar size is reset because it may not fit the new range
  const go = (next: Partial<AnalyticsFilters>) => {
    const target: AnalyticsFilters = {
      ...filters,
      interval: undefined,
      ...next,
    };
    startTransition(() =>
      router.push(analyticsHref(target), { scroll: false }),
    );
  };

  return (
    <div
      className={cn(
        "sticky top-0 z-20 -mx-4 flex flex-wrap items-center justify-between gap-3 border-b border-border bg-background/95 px-4 py-3 backdrop-blur sm:-mx-6 sm:px-6 lg:-mx-8 lg:px-8",
        pending && "opacity-70",
      )}
      aria-busy={pending}
    >
      <nav
        aria-label="Time period"
        className="flex max-w-full gap-1 overflow-x-auto rounded-lg border border-border bg-card p-1"
      >
        {PERIOD_OPTIONS.map((option) => {
          const selected = filters.period === option.value;
          return (
            <Link
              key={option.value}
              href={analyticsHref({
                ...filters,
                period: option.value,
                from: undefined,
                to: undefined,
                interval: undefined,
              })}
              scroll={false}
              aria-current={selected ? "page" : undefined}
              className={cn(tab, selected ? tabOn : tabOff)}
            >
              {option.label}
            </Link>
          );
        })}
        <button
          type="button"
          onClick={() => setCustomOpen(true)}
          aria-haspopup="dialog"
          aria-current={filters.period === "CUSTOM" ? "page" : undefined}
          className={cn(
            tab,
            "inline-flex items-center gap-1.5",
            filters.period === "CUSTOM" ? tabOn : tabOff,
          )}
        >
          <CalendarRange className="size-3.5" aria-hidden="true" />
          Custom
        </button>
      </nav>

      <Select
        value={filters.routerId ?? "all"}
        onValueChange={(value) =>
          go({ routerId: value === "all" ? undefined : value })
        }
        disabled={routers === null}
      >
        <SelectTrigger
          aria-label="Filter by MikroTik router"
          className="h-9 w-56 text-xs"
        >
          <SelectValue
            placeholder={
              routers === null ? "Routers unavailable" : "All routers"
            }
          />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All routers</SelectItem>
          {(routers ?? []).map((option) => (
            <SelectItem key={option.routerId} value={String(option.routerId)}>
              {option.routerName}
              <span className="ml-2 text-[10px] lowercase text-muted-foreground">
                {option.status.toLowerCase()}
              </span>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {customOpen && (
        <CustomDatesDialog
          onOpenChange={setCustomOpen}
          today={today}
          initialFrom={filters.period === "CUSTOM" ? filters.from : undefined}
          initialTo={filters.period === "CUSTOM" ? filters.to : undefined}
          onApply={(from, to) => {
            setCustomOpen(false);
            go({ period: "CUSTOM", from, to });
          }}
        />
      )}
    </div>
  );
}
