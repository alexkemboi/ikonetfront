"use client";

import { useCallback, useState, type ReactNode } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";
import { formatBytes } from "@/lib/utils/formatBytes";
import { getHotspotSessionTime } from "@/actions/subscriberTime";
import { getHotspotLiveSession } from "@/actions/sessions";
import { useVisibleInterval } from "@/lib/hooks/useVisibleInterval";
import { sessionState, type LiveSessionItem } from "@/lib/types/sessions";
import type { HotspotSessionTime } from "@/lib/types/subscriberTime";
import { formatLocalPhone, formatTimeLeft, mpesaReceiptOrNull, trimZeroDays } from "@/lib/utils/subscriberTime";
import { HotspotManagePanel } from "./HotspotManagePanel";
import { HotspotPurchaseHistory } from "./HotspotPurchaseHistory";

type Status = "ONLINE" | "OFFLINE" | "WAITING" | "PAUSED";

const STATUS_STYLE: Record<Status, { label: string; badge: string; dot: string }> = {
  ONLINE: { label: "Online", badge: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400", dot: "bg-emerald-500" },
  OFFLINE: { label: "Not online", badge: "bg-amber-500/10 text-amber-700 dark:text-amber-400", dot: "bg-amber-500" },
  WAITING: { label: "Not connected yet", badge: "bg-amber-500/10 text-amber-700 dark:text-amber-400", dot: "bg-amber-500" },
  PAUSED: { label: "Paused", badge: "bg-sky-500/10 text-sky-700 dark:text-sky-400", dot: "bg-sky-500" },
};

const DATE_TIME = new Intl.DateTimeFormat("en-KE", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" });

function when(iso?: string | null): string | null {
  return iso ? DATE_TIME.format(new Date(iso)) : null;
}

function secondsLeft(time: HotspotSessionTime, now: number): number | null {
  if (time.status === "PAUSED") return time.pausedRemainingSeconds;
  if (!time.expiresAt) return null;
  return Math.max(0, Math.round((new Date(time.expiresAt).getTime() - now) / 1000));
}

function statusOf(time: HotspotSessionTime, live: LiveSessionItem | null): Status {
  if (time.status === "PAUSED") return "PAUSED";
  if (!live) return "WAITING";
  const state = sessionState(live);
  return state === "ONLINE" ? "ONLINE" : state === "WAITING" ? "WAITING" : "OFFLINE";
}

/** A fact on the summary strip. Add one here and it shows on the page. */
type Fact = { label: string; value: ReactNode; detail?: string | null };

/**
 * One hotspot customer. The summary strip stays on top; the tabs below hold the work. A new
 * kind of work for hotspot customers is a new entry in the tabs list.
 */
export function HotspotCustomerClient({
  sessionId,
  initialTime,
  initialLive,
  liveError,
  refreshIntervalSeconds,
}: {
  sessionId: number;
  initialTime: HotspotSessionTime;
  initialLive: LiveSessionItem | null;
  liveError?: string;
  refreshIntervalSeconds: number;
}) {
  const [time, setTime] = useState(initialTime);
  const [live, setLive] = useState(initialLive);
  const [liveProblem, setLiveProblem] = useState(liveError);
  const [now, setNow] = useState(() => Date.now());

  // A failed reload keeps what is on screen.
  const reload = useCallback(async () => {
    const [t, l] = await Promise.all([getHotspotSessionTime(sessionId), getHotspotLiveSession(sessionId)]);
    if (t.success) setTime(t.data);
    if (!l.error) setLive(l.session);
    setLiveProblem(l.error);
    setNow(Date.now());
  }, [sessionId]);
  useVisibleInterval(reload, refreshIntervalSeconds * 1000);

  const phone = formatLocalPhone(time.phone ?? live?.phone) ?? "Unknown number";
  const historyPhone = time.phone ?? live?.phone ?? null;
  const status = statusOf(time, live);
  const style = STATUS_STYLE[status];
  const left = secondsLeft(time, now);
  const receipt = mpesaReceiptOrNull(live?.mpesaReceipt);
  const liveState = live ? sessionState(live) : null;

  const facts: Fact[] = [
    {
      label: "Status",
      value: (
        <span className={cn("inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-sm font-medium", style.badge)}>
          <span className={cn("h-1.5 w-1.5 rounded-full", style.dot)} />
          {style.label}
        </span>
      ),
      detail:
        status === "PAUSED"
          ? time.pausedAt ? `since ${when(time.pausedAt)}` : null
          : liveState === "ONLINE"
            ? `for ${trimZeroDays(live?.onlineDurationFormatted)}`
            : liveState === "OFFLINE"
              ? `went offline ${when(live?.offlineSince) ?? ""}`
              : liveState === "LOST"
                ? `last seen ${when(live?.lastSeenAt) ?? ""}`
                : "the device has not joined the Wi-Fi",
    },
    {
      label: "Time left",
      value: formatTimeLeft(left),
      detail: status === "PAUSED" ? "clock stopped" : time.expiresAt ? `ends ${when(time.expiresAt)}` : null,
    },
    {
      label: "Data used",
      value: live && live.countersAvailable !== false ? formatBytes(live.downloadBytes) : "—",
      detail: live && live.countersAvailable !== false ? `down · ${formatBytes(live.uploadBytes)} up` : "not reported",
    },
    {
      label: "Paid",
      value: live?.amountPaid ? `Ksh ${Number(live.amountPaid).toLocaleString()}` : "—",
      detail: receipt ? `M-Pesa ${receipt}` : time.voucherCode ? `voucher ${time.voucherCode}` : null,
    },
    { label: "Connected through", value: live?.routerName || "—", detail: live?.deviceMac || null },
    {
      label: "Pauses",
      value: time.pausesAllowed === 0 ? "Not allowed" : `${time.pausesUsed} of ${time.pausesAllowed} used`,
      detail: time.pausesAllowed === 0 ? "packages of one day or less" : null,
    },
  ];

  const connection: [string, string | null | undefined][] = [
    ["Phone that paid", historyPhone],
    ["Package", time.packageName ?? live?.packageName],
    ["Voucher code", time.voucherCode ?? live?.voucherCode],
    ["M-Pesa receipt", receipt],
    ["Device (MAC)", live?.deviceMac],
    ["Device address (IP)", live?.assignedIp],
    ["Router", live?.routerName],
    ["Router address", live?.routerManagementIp ?? live?.nasIp],
    ["Connected at", when(live?.connectedAt)],
    ["Last seen", when(live?.lastSeenAt)],
    ["Purchase number", String(sessionId)],
  ];

  const tabs: { id: string; label: string; content: ReactNode }[] = [
    {
      id: "manage",
      label: "Manage",
      content: (
        <HotspotManagePanel
          sessionId={sessionId}
          time={time}
          secondsLeft={left}
          onChanged={(next) => {
            if (next) setTime(next);
            setNow(Date.now());
            void reload();
          }}
        />
      ),
    },
    {
      id: "history",
      label: "Purchase history",
      content: historyPhone ? (
        <HotspotPurchaseHistory phone={historyPhone} currentSessionId={sessionId} />
      ) : (
        <p className="text-sm text-muted-foreground">No phone number is recorded for this purchase.</p>
      ),
    },
    {
      id: "connection",
      label: "Connection",
      content: (
        <div className="rounded-lg border border-border bg-card">
          {liveProblem && (
            <p role="alert" className="border-b border-border bg-destructive/5 px-4 py-2 text-xs text-destructive">
              The live connection could not be loaded. {liveProblem}
            </p>
          )}
          <dl className="grid grid-cols-1 divide-y divide-border sm:grid-cols-2 sm:divide-y-0">
            {connection.map(([label, value]) => (
              <div key={label} className="flex justify-between gap-4 border-border px-4 py-3 sm:border-b">
                <dt className="text-sm text-muted-foreground">{label}</dt>
                <dd className="truncate text-right text-sm tabular-nums text-foreground">{value || "—"}</dd>
              </div>
            ))}
          </dl>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <header>
        <p className="text-[11px] uppercase tracking-wider text-muted-foreground">Hotspot customer</p>
        <h1 className="text-3xl font-sans font-normal tabular-nums text-foreground">{phone}</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {time.packageName ?? live?.packageName ?? "Package"}
          {time.voucherCode ? ` · code ${time.voucherCode}` : ""} · updates every {refreshIntervalSeconds} seconds
        </p>
      </header>

      <section aria-label="Summary" className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-6">
        {facts.map((fact) => (
          <div key={fact.label} className="min-w-0 rounded-lg border border-border bg-card p-4">
            <p className="text-[11px] uppercase tracking-wider text-muted-foreground">{fact.label}</p>
            <div className="mt-1.5 truncate text-lg font-medium tabular-nums text-foreground">{fact.value}</div>
            {fact.detail && <p className="mt-0.5 truncate text-xs text-muted-foreground">{fact.detail}</p>}
          </div>
        ))}
      </section>

      <Tabs defaultValue={tabs[0].id}>
        <TabsList className="w-full justify-start overflow-x-auto">
          {tabs.map((tab) => (
            <TabsTrigger key={tab.id} value={tab.id}>
              {tab.label}
            </TabsTrigger>
          ))}
        </TabsList>
        {tabs.map((tab) => (
          <TabsContent key={tab.id} value={tab.id} className="mt-6">
            {tab.content}
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
}
