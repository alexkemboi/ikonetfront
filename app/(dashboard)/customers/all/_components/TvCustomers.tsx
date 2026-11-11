"use client";

import { useCallback, useMemo, useState } from "react";
import { Search, SlidersHorizontal } from "lucide-react";
import { cn } from "@/lib/utils";
import { formatBytes } from "@/lib/utils/formatBytes";
import type { TvCustomerTime } from "@/lib/types/subscriberTime";
import { getTvCustomers } from "@/actions/subscriberTime";
import { useVisibleInterval } from "@/lib/hooks/useVisibleInterval";
import { formatLocalPhone, formatTimeLeft } from "@/lib/utils/subscriberTime";
import { ManageTvCustomerDialog } from "./ManageTvCustomerDialog";

type State = "ONLINE" | "OFFLINE" | "PAUSED";

const TABS: { key: "ALL" | State; label: string }[] = [
  { key: "ALL", label: "All" },
  { key: "ONLINE", label: "Online" },
  { key: "OFFLINE", label: "Not online" },
  { key: "PAUSED", label: "Paused" },
];

const STATE_STYLE: Record<State, { label: string; badge: string; dot: string }> = {
  ONLINE: { label: "Online", badge: "bg-emerald-500/10 text-emerald-600", dot: "bg-emerald-500" },
  OFFLINE: { label: "Not online", badge: "bg-amber-500/10 text-amber-700", dot: "bg-amber-500" },
  PAUSED: { label: "Paused", badge: "bg-sky-500/10 text-sky-700", dot: "bg-sky-500" },
};

const TH = "px-4 py-3 text-[11px] uppercase tracking-wider text-muted-foreground";

function stateOf(tv: TvCustomerTime): State {
  if (tv.status === "PAUSED") return "PAUSED";
  return tv.online ? "ONLINE" : "OFFLINE";
}

function ago(iso: string | null, now: number): string {
  if (!iso) return "";
  const minutes = Math.max(0, Math.round((now - new Date(iso).getTime()) / 60000));
  if (minutes < 60) return `${minutes} min ago`;
  const hours = Math.floor(minutes / 60);
  return hours < 48 ? `${hours}h ago` : `${Math.floor(hours / 24)} days ago`;
}

function secondsLeft(tv: TvCustomerTime, now: number): number | null {
  if (tv.status === "PAUSED") return tv.pausedRemainingSeconds;
  if (!tv.expiresAt) return null;
  return Math.max(0, Math.round((new Date(tv.expiresAt).getTime() - now) / 1000));
}

/**
 * TV customers: every TV with access that is running or paused, and the place customer care
 * manages them from. Each row opens the add time / pause / resume dialog.
 */
export function TvCustomers({
  initial,
  loadError,
  refreshIntervalSeconds,
}: {
  initial: TvCustomerTime[];
  loadError?: string;
  refreshIntervalSeconds: number;
}) {
  const [rows, setRows] = useState(initial);
  const [error, setError] = useState(loadError ?? "");
  const [loadedAt, setLoadedAt] = useState(() => Date.now());
  const [tab, setTab] = useState<"ALL" | State>("ALL");
  const [search, setSearch] = useState("");
  const [managed, setManaged] = useState<TvCustomerTime | null>(null);

  // A list that fails to load keeps what is on screen.
  const reload = useCallback(async () => {
    const res = await getTvCustomers();
    if (res.success) {
      setRows(res.data ?? []);
      setError("");
    } else {
      setError(res.message);
    }
    setLoadedAt(Date.now());
  }, []);
  useVisibleInterval(reload, refreshIntervalSeconds * 1000);

  const counts = useMemo(
    () => Object.fromEntries(TABS.map(({ key }) => [key, key === "ALL" ? rows.length : rows.filter((r) => stateOf(r) === key).length])),
    [rows]
  );
  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase().replace(/[\s:-]/g, "");
    return rows.filter((tv) => {
      if (tab !== "ALL" && stateOf(tv) !== tab) return false;
      if (!query) return true;
      const haystack = [tv.phone, formatLocalPhone(tv.phone), tv.macAddress, tv.packageName, tv.routerName, tv.ipAddress]
        .filter(Boolean).join(" ").toLowerCase().replace(/[\s:-]/g, "");
      return haystack.includes(query);
    });
  }, [rows, tab, search]);

  return (
    <div className="overflow-hidden rounded-lg border border-border bg-card">
      <div className="flex flex-col gap-3 border-b border-border p-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex flex-wrap items-center gap-1.5" role="tablist" aria-label="Filter TV customers">
          {TABS.map(({ key, label }) => (
            <button
              key={key}
              type="button"
              role="tab"
              aria-selected={tab === key}
              onClick={() => setTab(key)}
              className={cn(
                "rounded-lg px-3 py-1.5 text-xs font-medium transition-colors",
                tab === key ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"
              )}
            >
              {label}
              <span className="ml-1.5 tabular-nums opacity-70">{counts[key]}</span>
            </button>
          ))}
        </div>
        <div className="relative">
          <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            aria-label="Search TV customers"
            placeholder="Phone, TV MAC or router"
            className="h-9 w-72 max-w-full rounded-lg border border-border bg-muted pl-8 pr-3 text-sm text-foreground outline-none focus:border-ring"
          />
        </div>
      </div>

      {error && (
        <p role="alert" className="border-b border-border bg-destructive/5 px-4 py-2 text-xs text-destructive">
          TV customers could not be loaded{rows.length ? "; the list shows the last ones received" : ""}. {error}
        </p>
      )}

      <div className="overflow-x-auto">
        <table className="w-full min-w-[900px] text-left">
          <thead>
            <tr className="border-b border-border">
              <th className={TH}>Customer</th>
              <th className={TH}>Package</th>
              <th className={TH}>Status</th>
              <th className={TH}>Time left</th>
              <th className={TH}>Data used</th>
              <th className={TH}>TV · router</th>
              <th className={cn(TH, "text-right")}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-4 py-14 text-center text-sm text-muted-foreground">
                  {rows.length === 0 ? "No TV has running or paused access right now." : "No TV matches your search."}
                </td>
              </tr>
            ) : (
              filtered.map((tv) => {
                const state = stateOf(tv);
                const style = STATE_STYLE[state];
                const detail =
                  state === "PAUSED"
                    ? tv.pausedAt ? `since ${new Date(tv.pausedAt).toLocaleDateString(undefined, { day: "numeric", month: "short" })}` : ""
                    : state === "ONLINE"
                      ? tv.ipAddress ? `at ${tv.ipAddress}` : ""
                      : tv.lastSeenAt ? `last seen ${ago(tv.lastSeenAt, loadedAt)}` : "has not connected yet";
                return (
                  <tr key={tv.entitlementId} className="border-b border-border transition-colors hover:bg-accent/50">
                    <td className="px-4 py-3">
                      <p className="text-sm font-medium tabular-nums text-foreground">{formatLocalPhone(tv.phone) ?? "Unknown number"}</p>
                    </td>
                    <td className="px-4 py-3">
                      <p className="max-w-[220px] truncate text-sm text-foreground">{tv.packageName ?? "—"}</p>
                    </td>
                    <td className="px-4 py-3">
                      <span className={cn("inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-xs font-medium", style.badge)}>
                        <span className={cn("h-1.5 w-1.5 rounded-full", style.dot)} />
                        {state === "PAUSED" && tv.deactivated ? "Deactivated" : style.label}
                      </span>
                      <p className="mt-0.5 text-[11px] text-muted-foreground">{detail}</p>
                    </td>
                    <td className="px-4 py-3 text-sm tabular-nums text-foreground">{formatTimeLeft(secondsLeft(tv, loadedAt))}</td>
                    <td className="px-4 py-3 text-sm tabular-nums text-muted-foreground">
                      {tv.bytesDown == null ? "—" : `${formatBytes(tv.bytesDown)} down · ${formatBytes(tv.bytesUp)} up`}
                    </td>
                    <td className="px-4 py-3">
                      <p className="text-sm tabular-nums text-foreground">{tv.macAddress}</p>
                      <p className="max-w-[180px] truncate text-[11px] text-muted-foreground">{tv.routerName ?? "—"}</p>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <button
                        type="button"
                        onClick={() => setManaged(tv)}
                        className="inline-flex h-8 items-center gap-1.5 rounded-md border border-border px-2.5 text-xs font-medium text-foreground transition-colors hover:bg-accent"
                      >
                        <SlidersHorizontal className="h-3.5 w-3.5" />
                        Manage
                      </button>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      <div className="border-t border-border px-4 py-2.5 text-xs text-muted-foreground">
        Showing {filtered.length} of {rows.length} TVs · data is the TV&apos;s current or last session
      </div>

      <ManageTvCustomerDialog tv={managed} onClose={() => setManaged(null)} onChanged={() => void reload()} />
    </div>
  );
}
