"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Search, SlidersHorizontal } from "lucide-react";
import { cn } from "@/lib/utils";
import { formatBytes } from "@/lib/utils/formatBytes";
import { sessionState, type LiveSessionItem } from "@/lib/types/sessions";
import type { HotspotSessionTime } from "@/lib/types/subscriberTime";
import { formatLocalPhone, formatTimeLeft, mpesaReceiptOrNull, trimZeroDays } from "@/lib/utils/subscriberTime";
import { ManageHotspotSubscriberDialog, type ManagedSubscriber } from "./ManageHotspotSubscriberDialog";

type State = "ONLINE" | "OFFLINE" | "PAUSED";

interface Row {
  key: string;
  sessionId?: number;
  phone: string;
  packageName: string;
  paid: string;
  state: State;
  stateDetail: string;
  timeLeft: string;
  data: string;
  device: string;
  router: string;
  search: string;
}

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

function ago(iso?: string): string {
  if (!iso) return "";
  const minutes = Math.max(0, Math.round((Date.now() - new Date(iso).getTime()) / 60000));
  if (minutes < 60) return `${minutes} min ago`;
  const hours = Math.floor(minutes / 60);
  return hours < 48 ? `${hours}h ago` : `${Math.floor(hours / 24)} days ago`;
}

function fromLive(session: LiveSessionItem): Row {
  const live = sessionState(session);
  const phone = formatLocalPhone(session.phone) ?? session.subscriberName ?? "Unknown number";
  const receipt = mpesaReceiptOrNull(session.mpesaReceipt);
  const paid = [
    session.amountPaid ? `Ksh ${Number(session.amountPaid).toLocaleString()}` : null,
    receipt ? `M-Pesa ${receipt}` : session.mpesaReceipt ? "M-Pesa" : session.voucherCode ? `Voucher ${session.voucherCode}` : null,
  ].filter(Boolean).join(" · ");
  return {
    key: session.id,
    sessionId: session.sessionId,
    phone,
    packageName: session.packageName ?? "—",
    paid: paid || "—",
    state: live === "ONLINE" ? "ONLINE" : "OFFLINE",
    stateDetail:
      live === "ONLINE"
        ? `for ${trimZeroDays(session.onlineDurationFormatted)}`
        : live === "LOST"
          ? `last seen ${ago(session.lastSeenAt)}`
          : "has not connected yet",
    timeLeft: session.minutesRemaining == null ? "—" : formatTimeLeft(session.minutesRemaining * 60),
    data: session.countersAvailable === false ? "—" : `${formatBytes(session.downloadBytes)} down · ${formatBytes(session.uploadBytes)} up`,
    device: session.deviceMac || "—",
    router: session.routerName || "—",
    search: [session.phone, phone, session.voucherCode, session.mpesaReceipt, session.packageName, session.deviceMac,
      session.assignedIp, session.routerName].filter(Boolean).join(" "),
  };
}

function fromPaused(session: HotspotSessionTime): Row {
  const phone = formatLocalPhone(session.phone) ?? "Unknown number";
  return {
    key: `paused-${session.sessionId}`,
    sessionId: session.sessionId,
    phone,
    packageName: session.packageName ?? "—",
    paid: session.voucherCode ? `Code ${session.voucherCode}` : "—",
    state: "PAUSED",
    stateDetail: session.pausedAt ? `since ${new Date(session.pausedAt).toLocaleDateString(undefined, { day: "numeric", month: "short" })}` : "",
    timeLeft: formatTimeLeft(session.pausedRemainingSeconds),
    data: "—",
    device: "—",
    router: "—",
    search: [session.phone, phone, session.voucherCode, session.packageName].filter(Boolean).join(" "),
  };
}

/**
 * Hotspot customers with a package that is running or paused, and the place customer care
 * manages them from: each row opens the add time / pause / disconnect dialog.
 */
export function HotspotSubscribers({
  sessions,
  paused,
  pausedError,
  refreshIntervalSeconds,
}: {
  sessions: LiveSessionItem[];
  paused: HotspotSessionTime[];
  pausedError?: string;
  refreshIntervalSeconds: number;
}) {
  const router = useRouter();
  const [tab, setTab] = useState<"ALL" | State>("ALL");
  const [search, setSearch] = useState("");
  const [managed, setManaged] = useState<ManagedSubscriber | null>(null);

  useEffect(() => {
    const timer = setInterval(() => router.refresh(), refreshIntervalSeconds * 1000);
    return () => clearInterval(timer);
  }, [refreshIntervalSeconds, router]);

  const rows = useMemo(() => [...sessions.map(fromLive), ...paused.map(fromPaused)], [sessions, paused]);
  const counts = useMemo(
    () => Object.fromEntries(TABS.map(({ key }) => [key, key === "ALL" ? rows.length : rows.filter((r) => r.state === key).length])),
    [rows]
  );
  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase().replace(/\s/g, "");
    return rows.filter(
      (row) => (tab === "ALL" || row.state === tab) && (!query || row.search.toLowerCase().replace(/\s/g, "").includes(query))
    );
  }, [rows, tab, search]);

  return (
    <div className="overflow-hidden rounded-lg border border-border bg-card">
      <div className="flex flex-col gap-3 border-b border-border p-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex flex-wrap items-center gap-1.5" role="tablist" aria-label="Filter customers">
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
            aria-label="Search customers"
            placeholder="Phone, M-Pesa receipt or voucher code"
            className="h-9 w-72 max-w-full rounded-lg border border-border bg-muted pl-8 pr-3 text-sm text-foreground outline-none focus:border-ring"
          />
        </div>
      </div>

      {pausedError && (
        <p role="alert" className="border-b border-border bg-destructive/5 px-4 py-2 text-xs text-destructive">
          Paused customers could not be loaded, so they are missing from this list. {pausedError}
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
              <th className={TH}>Connected through</th>
              <th className={cn(TH, "text-right")}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-4 py-14 text-center text-sm text-muted-foreground">
                  {rows.length === 0 ? "No hotspot customer has a running or paused package right now." : "No customer matches your search."}
                </td>
              </tr>
            ) : (
              filtered.map((row) => {
                const style = STATE_STYLE[row.state];
                return (
                  <tr key={row.key} className="border-b border-border transition-colors hover:bg-accent/50">
                    <td className="px-4 py-3">
                      <p className="text-sm font-medium tabular-nums text-foreground">{row.phone}</p>
                    </td>
                    <td className="px-4 py-3">
                      <p className="max-w-[220px] truncate text-sm text-foreground">{row.packageName}</p>
                      <p className="text-[11px] tabular-nums text-muted-foreground">{row.paid}</p>
                    </td>
                    <td className="px-4 py-3">
                      <span className={cn("inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-xs font-medium", style.badge)}>
                        <span className={cn("h-1.5 w-1.5 rounded-full", style.dot)} />
                        {style.label}
                      </span>
                      <p className="mt-0.5 text-[11px] text-muted-foreground">{row.stateDetail}</p>
                    </td>
                    <td className="px-4 py-3 text-sm tabular-nums text-foreground">{row.timeLeft}</td>
                    <td className="px-4 py-3 text-sm tabular-nums text-muted-foreground">{row.data}</td>
                    <td className="px-4 py-3">
                      <p className="max-w-[180px] truncate text-sm text-foreground">{row.router}</p>
                      <p className="text-[11px] tabular-nums text-muted-foreground">{row.device}</p>
                    </td>
                    <td className="px-4 py-3 text-right">
                      {row.sessionId ? (
                        <button
                          type="button"
                          onClick={() => setManaged({ sessionId: row.sessionId!, phone: row.phone, packageName: row.packageName })}
                          className="inline-flex h-8 items-center gap-1.5 rounded-md border border-border px-2.5 text-xs font-medium text-foreground transition-colors hover:bg-accent"
                        >
                          <SlidersHorizontal className="h-3.5 w-3.5" />
                          Manage
                        </button>
                      ) : (
                        <span className="text-[11px] text-muted-foreground" title="This connection is not linked to a purchase, so there is nothing to manage.">
                          Not linked to a purchase
                        </span>
                      )}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      <div className="border-t border-border px-4 py-2.5 text-xs text-muted-foreground">
        Showing {filtered.length} of {rows.length} customers
      </div>

      <ManageHotspotSubscriberDialog subscriber={managed} onClose={() => setManaged(null)} onChanged={() => router.refresh()} />
    </div>
  );
}
