"use client";

import { useCallback, useState } from "react";
import Link from "next/link";
import { toast } from "sonner";
import { RefreshCw, Save } from "lucide-react";
import { getRouterLiveInterfaces, getRouterLiveSessions } from "@/actions/network";
import {
  createRouterBackup,
  getInvestorRouterPayments,
  getRouterBackups,
  getRouterLog,
  getRouterPayments,
  getRouterScheduler,
  getRouterScripts,
} from "@/actions/routerOperations";
import { Button } from "@/components/ui/button";
import { RouterOutages } from "@/components/network/RouterOutages";
import { formatBps, formatBytes, formatDateTime, formatMoney, useOnDemand } from "./format";

function TabFrame({
  title,
  note,
  loading,
  error,
  onReload,
  actions,
  children,
}: {
  title: string;
  note?: string;
  loading: boolean;
  error: string | null;
  onReload: () => void;
  actions?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-2xl border border-border bg-card p-4 sm:p-5">
      <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-base font-medium">{title}</h2>
          {note && <p className="mt-0.5 text-xs text-muted-foreground">{note}</p>}
        </div>
        <div className="flex items-center gap-2">
          {actions}
          <Button size="sm" variant="outline" onClick={onReload} disabled={loading}>
            <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} /> Refresh
          </Button>
        </div>
      </div>
      {error && <p role="alert" className="mb-3 text-sm text-destructive">{error}</p>}
      {loading && <p className="mb-3 text-sm text-muted-foreground">Loading…</p>}
      {children}
    </section>
  );
}

function Table({ head, rows, empty }: { head: string[]; rows: React.ReactNode[][]; empty: string }) {
  if (rows.length === 0) return <p className="text-sm text-muted-foreground">{empty}</p>;
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-border text-left text-xs uppercase tracking-wide text-muted-foreground">
            {head.map((h) => <th key={h} className="px-2 py-2 font-medium">{h}</th>)}
          </tr>
        </thead>
        <tbody>
          {rows.map((cells, i) => (
            <tr key={i} className="border-b border-border/60 last:border-0 align-top">
              {cells.map((cell, j) => <td key={j} className="px-2 py-2 tabular-nums">{cell}</td>)}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function UsersTab({ routerId }: { routerId: number }) {
  const load = useCallback(() => getRouterLiveSessions(routerId), [routerId]);
  const t = useOnDemand(load, true);
  const pppoe = t.data?.pppoe ?? [];
  const hotspot = t.data?.hotspot ?? [];
  return (
    <TabFrame title="Online now" note="Read from the router." loading={t.loading} error={t.error} onReload={() => void t.reload()}>
      <h3 className="mb-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">PPPoE · {pppoe.length}</h3>
      <Table
        head={["User", "Customer", "Address", "Device MAC", "Uptime"]}
        empty="No PPPoE sessions."
        rows={pppoe.map((s) => [
          s.username ?? "—",
          s.customerId ? <Link className="text-primary hover:underline" href={`/customers/${s.customerId}`}>{s.customerName ?? s.customerId}</Link> : "—",
          s.address ?? "—",
          s.callerId ?? "—",
          s.uptime ?? "—",
        ])}
      />
      <h3 className="mb-2 mt-6 text-xs font-medium uppercase tracking-wide text-muted-foreground">Hotspot · {hotspot.length}</h3>
      <Table
        head={["User", "Address", "MAC", "Login", "Uptime", "Used"]}
        empty="No hotspot sessions."
        rows={hotspot.map((s) => {
          const used = formatBytes((s.bytesIn ?? 0) + (s.bytesOut ?? 0));
          return [s.username ?? "—", s.address ?? "—", s.macAddress ?? "—", s.loginBy ?? "—", s.uptime ?? "—", `${used.value} ${used.unit}`];
        })}
      />
    </TabFrame>
  );
}

export function PaymentsTab({ routerId, investorDeviceId }: { routerId: number; investorDeviceId?: number }) {
  const [days, setDays] = useState(30);
  const load = useCallback(
    () => (investorDeviceId ? getInvestorRouterPayments(investorDeviceId, days) : getRouterPayments(routerId, days)),
    [routerId, investorDeviceId, days]
  );
  const t = useOnDemand(load, true);
  const rows = t.data ?? [];
  const total = rows.reduce((sum, p) => sum + (p.amount ?? 0), 0);
  return (
    <TabFrame
      title="Payments"
      note={`Revenue attributed to this router, newest first (up to 100). ${rows.length} shown · KES ${formatMoney(total)}.`}
      loading={t.loading}
      error={t.error}
      onReload={() => void t.reload()}
      actions={
        <select
          aria-label="Period"
          className="rounded-md border border-border bg-background px-2 py-1 text-sm"
          value={days}
          onChange={(e) => setDays(Number(e.target.value))}
        >
          {[7, 30, 90].map((d) => <option key={d} value={d}>Last {d} days</option>)}
        </select>
      }
    >
      <Table
        head={["When", "Service", "Amount (KES)", "Details"]}
        empty="No payments in this period."
        rows={rows.map((p) => [
          formatDateTime(p.occurredAt),
          p.serviceType ?? "—",
          formatMoney(p.amount),
          <span key="memo" className="text-xs text-muted-foreground">{p.memo ?? ""}</span>,
        ])}
      />
    </TabFrame>
  );
}

export function InterfacesTab({ routerId, deviceId }: { routerId: number; deviceId: number | null }) {
  const load = useCallback(() => getRouterLiveInterfaces(deviceId ?? 0, null, routerId), [routerId, deviceId]);
  const t = useOnDemand(load, true);
  return (
    <TabFrame title="Interfaces" note="Read from the router, with a one-second traffic sample." loading={t.loading} error={t.error} onReload={() => void t.reload()}>
      <Table
        head={["Name", "Type", "State", "Download", "Upload", "MAC", "Comment"]}
        empty="The router reported no interfaces."
        rows={(t.data ?? []).map((i) => [
          i.name,
          i.type ?? "—",
          i.disabled ? "disabled" : i.running ? "running" : "down",
          i.running ? formatBps(i.rxBitsPerSecond) : "—",
          i.running ? formatBps(i.txBitsPerSecond) : "—",
          i.macAddress ?? "—",
          i.comment ?? "",
        ])}
      />
    </TabFrame>
  );
}

export function EventsTab({ routerId }: { routerId: number }) {
  return <RouterOutages routerId={routerId} />;
}

export function LogsTab({ routerId }: { routerId: number }) {
  const load = useCallback(() => getRouterLog(routerId), [routerId]);
  const t = useOnDemand(load, true);
  const [filter, setFilter] = useState("");
  const rows = (t.data ?? []).filter((l) =>
    !filter || `${l.topics} ${l.message}`.toLowerCase().includes(filter.toLowerCase())
  );
  return (
    <TabFrame
      title="Router log"
      note="The router's own log, newest first (last 300 lines). It is kept in the router's memory and lost on reboot."
      loading={t.loading}
      error={t.error}
      onReload={() => void t.reload()}
      actions={
        <input
          aria-label="Filter log"
          placeholder="Filter…"
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          className="w-36 rounded-md border border-border bg-background px-2 py-1 text-sm"
        />
      }
    >
      <Table
        head={["Time", "Topics", "Message"]}
        empty="No log lines."
        rows={rows.map((l) => [
          <span key="t" className="whitespace-nowrap">{l.time ?? "—"}</span>,
          <span key="p" className="text-xs text-muted-foreground">{l.topics ?? ""}</span>,
          <span key="m" className="break-all">{l.message ?? ""}</span>,
        ])}
      />
    </TabFrame>
  );
}

export function BackupsTab({ routerId, canEdit }: { routerId: number; canEdit: boolean }) {
  const load = useCallback(() => getRouterBackups(routerId), [routerId]);
  const t = useOnDemand(load, true);
  const [busy, setBusy] = useState(false);
  const save = async () => {
    setBusy(true);
    try {
      const res = await createRouterBackup(routerId);
      toast[res.success ? "success" : "error"](res.success ? `Saved ${res.data?.name ?? "backup"} on the router` : res.message);
      if (res.success) void t.reload();
    } finally {
      setBusy(false);
    }
  };
  return (
    <TabFrame
      title="Backups"
      note="Backup files stored on the router itself. They do not survive a reset of the router; download important ones with WinBox."
      loading={t.loading}
      error={t.error}
      onReload={() => void t.reload()}
      actions={canEdit ? (
        <Button size="sm" disabled={busy} onClick={() => void save()}>
          <Save className="h-4 w-4" /> Save backup now
        </Button>
      ) : undefined}
    >
      <Table
        head={["File", "Size", "Created"]}
        empty="No backup files on the router."
        rows={(t.data ?? []).map((b) => {
          const size = formatBytes(b.sizeBytes);
          return [b.name, b.sizeBytes != null ? `${size.value} ${size.unit}` : "—", b.createdAt ?? "—"];
        })}
      />
    </TabFrame>
  );
}

function Source({ text }: { text: string | null }) {
  if (text == null) return <span className="text-xs text-muted-foreground">system administrators only</span>;
  return (
    <details>
      <summary className="cursor-pointer text-xs text-primary">Show</summary>
      <pre className="mt-2 max-h-64 max-w-xl overflow-auto whitespace-pre-wrap rounded-md bg-muted p-2 text-xs">{text}</pre>
    </details>
  );
}

export function SchedulerTab({ routerId }: { routerId: number }) {
  const load = useCallback(() => getRouterScheduler(routerId), [routerId]);
  const t = useOnDemand(load, true);
  return (
    <TabFrame title="Scheduler" note="Jobs the router runs on its own. Read only." loading={t.loading} error={t.error} onReload={() => void t.reload()}>
      <Table
        head={["Name", "Interval", "Next run", "Runs", "State", "Runs this"]}
        empty="No scheduled jobs."
        rows={(t.data ?? []).map((j) => [
          j.name ?? "—",
          j.interval ?? "—",
          j.nextRun ?? "—",
          j.runCount ?? "0",
          j.disabled ? "off" : "on",
          <Source key="s" text={j.onEvent} />,
        ])}
      />
    </TabFrame>
  );
}

export function ScriptsTab({ routerId }: { routerId: number }) {
  const load = useCallback(() => getRouterScripts(routerId), [routerId]);
  const t = useOnDemand(load, true);
  return (
    <TabFrame title="Scripts" note="Scripts stored on the router. Read only." loading={t.loading} error={t.error} onReload={() => void t.reload()}>
      <Table
        head={["Name", "Owner", "Last run", "Runs", "Source"]}
        empty="No scripts."
        rows={(t.data ?? []).map((s) => [
          s.name ?? "—",
          s.owner ?? "—",
          s.lastStarted ?? "never",
          s.runCount ?? "0",
          <Source key="s" text={s.source} />,
        ])}
      />
    </TabFrame>
  );
}
