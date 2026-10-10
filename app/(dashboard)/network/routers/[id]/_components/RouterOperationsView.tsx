"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Cpu, Hash, MapPin, Package, Timer } from "lucide-react";
import { getInvestorRouterOverview, getRouterOverview } from "@/actions/routerOperations";
import type { RouterOverview } from "@/lib/types/network";
import { RouterActionsDropdown, type RouterActionsRow } from "@/components/network/RouterActionsDropdown";
import { RouterHealthHistory } from "../monitoring/_components/RouterHealthHistory";
import { RouterFigures } from "./RouterFigures";
import { ConnectionPanel, HealthCard, HotspotPanel, ProvisioningPanel } from "./RouterSidePanels";
import {
  BackupsTab, EventsTab, InterfacesTab, LogsTab, PaymentsTab, SchedulerTab, ScriptsTab, UsersTab,
} from "./RouterTabs";

type TabKey = "system" | "users" | "payments" | "interfaces" | "events" | "logs" | "backups" | "scheduler" | "scripts";

const STAFF_TABS: { key: TabKey; label: string }[] = [
  { key: "system", label: "System" },
  { key: "users", label: "Users" },
  { key: "payments", label: "Payments" },
  { key: "interfaces", label: "Interfaces" },
  { key: "events", label: "Events" },
  { key: "logs", label: "Logs" },
  { key: "backups", label: "Backups" },
  { key: "scheduler", label: "Scheduler" },
  { key: "scripts", label: "Script" },
];

// Investors (owner decision 2026-10-10): figures, charts and payments of their own router only.
const INVESTOR_TABS = STAFF_TABS.filter((t) => t.key === "system" || t.key === "payments");

const REFRESH_MS = 60_000;

/**
 * One router on one page: header with the maintenance actions, the six headline figures,
 * and tabs. Staff see everything their role allows; with `investorDeviceId` the page is the
 * investor's read-only view (no actions, no connection details, nothing read from the router).
 */
export function RouterOperationsView({
  routerId,
  initialOverview,
  actionsRow,
  canEdit,
  isSysadmin,
  investorDeviceId,
  backHref = "/network/routers",
}: {
  routerId: number;
  initialOverview: RouterOverview;
  actionsRow?: RouterActionsRow | null;
  canEdit: boolean;
  isSysadmin: boolean;
  investorDeviceId?: number;
  backHref?: string;
}) {
  const readOnly = investorDeviceId != null;
  const tabs = readOnly ? INVESTOR_TABS : STAFF_TABS;
  const [tab, setTab] = useState<TabKey>("system");
  const [overview, setOverview] = useState(initialOverview);

  useEffect(() => {
    const timer = setInterval(async () => {
      const res = investorDeviceId != null
        ? await getInvestorRouterOverview(investorDeviceId)
        : await getRouterOverview(routerId);
      if (res.data) setOverview(res.data);
    }, REFRESH_MS);
    return () => clearInterval(timer);
  }, [routerId, investorDeviceId]);

  const r = overview.router;
  const deviceId = r.deviceId;

  return (
    <div className="min-h-screen p-4 text-foreground sm:p-6 lg:p-8">
      <div className="mx-auto max-w-7xl space-y-6">
        <header className="space-y-3">
          <div className="text-[11px] uppercase tracking-wider text-muted-foreground">
            <Link href={backHref} className="hover:text-foreground">Routers</Link> — {r.name}
          </div>
          <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
            <div className="min-w-0 space-y-2">
              <div className="flex flex-wrap items-center gap-3">
                <h1 className="truncate text-3xl font-normal">{r.name}</h1>
                <span
                  className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium ${
                    r.online ? "bg-emerald-500/15 text-emerald-700 dark:text-emerald-400" : "bg-red-500/10 text-red-700 dark:text-red-400"
                  }`}
                >
                  <span className={`h-1.5 w-1.5 rounded-full ${r.online ? "bg-emerald-500" : "bg-red-500"}`} />
                  {r.online ? "Online" : "Offline"}
                </span>
              </div>
              <div className="flex flex-wrap gap-x-5 gap-y-1 text-sm text-muted-foreground">
                {r.vpnIp && <span className="inline-flex items-center gap-1.5"><Hash className="h-3.5 w-3.5" />{r.vpnIp}</span>}
                {r.model && <span className="inline-flex items-center gap-1.5"><Cpu className="h-3.5 w-3.5" />{r.model}</span>}
                {r.routerOsVersion && <span className="inline-flex items-center gap-1.5"><Package className="h-3.5 w-3.5" />RouterOS {r.routerOsVersion}</span>}
                {r.uptime && <span className="inline-flex items-center gap-1.5"><Timer className="h-3.5 w-3.5" />Up {r.uptime}</span>}
                {r.stationName && <span className="inline-flex items-center gap-1.5"><MapPin className="h-3.5 w-3.5" />{r.stationName}</span>}
              </div>
              {!r.online && r.lastSeenAt && (
                <p className="text-xs text-muted-foreground">Last reading {new Date(r.lastSeenAt).toLocaleString()}</p>
              )}
            </div>
            {!readOnly && canEdit && actionsRow && <RouterActionsDropdown router={actionsRow} variant="page" />}
          </div>
        </header>

        <RouterFigures overview={overview} />

        <div role="tablist" aria-label="Router sections" className="flex gap-1 overflow-x-auto rounded-xl border border-border bg-card p-1">
          {tabs.map((t) => (
            <button
              key={t.key}
              role="tab"
              aria-selected={tab === t.key}
              onClick={() => setTab(t.key)}
              className={`whitespace-nowrap rounded-lg px-3 py-1.5 text-sm ${
                tab === t.key ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-muted hover:text-foreground"
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        {tab === "system" && (
          <div className="grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,1fr)_340px]">
            <div className="min-w-0">
              <RouterHealthHistory routerId={routerId} investorDeviceId={investorDeviceId} title="Performance" />
            </div>
            <aside className="space-y-6">
              <HealthCard health={overview.health} />
              {!readOnly && <ConnectionPanel routerId={routerId} canEdit={canEdit} />}
              {/* always shown: the device's hotspot flag is not reliable, and the panel says when there is no hotspot */}
              {!readOnly && (
                <HotspotPanel routerId={routerId} canEdit={canEdit} actionUrl={actionsRow?.links?.routerAction} />
              )}
              {!readOnly && deviceId != null && <ProvisioningPanel deviceId={deviceId} />}
            </aside>
          </div>
        )}
        {tab === "users" && <UsersTab routerId={routerId} />}
        {tab === "payments" && <PaymentsTab routerId={routerId} investorDeviceId={investorDeviceId} />}
        {tab === "interfaces" && <InterfacesTab routerId={routerId} deviceId={deviceId} />}
        {tab === "events" && <EventsTab routerId={routerId} />}
        {tab === "logs" && <LogsTab routerId={routerId} />}
        {tab === "backups" && <BackupsTab routerId={routerId} canEdit={canEdit} />}
        {tab === "scheduler" && <SchedulerTab routerId={routerId} />}
        {tab === "scripts" && <ScriptsTab routerId={routerId} />}

        {!readOnly && !isSysadmin && tab === "scripts" && (
          <p className="text-xs text-muted-foreground">Script text is shown to system administrators only, because scripts can hold passwords.</p>
        )}
      </div>
    </div>
  );
}
