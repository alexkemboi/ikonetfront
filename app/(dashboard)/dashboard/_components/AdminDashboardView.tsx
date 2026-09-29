"use client";

import { Activity, AlertTriangle, Router, Users, Wallet, Wifi } from "lucide-react";
import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import type { AdminDashboardResponse } from "@/lib/types/dashboard";

function display(value: number | string | null | undefined, currency = false): string {
  if (value == null) return "Not tracked yet";
  if (typeof value === "string") return currency ? `KES ${value}` : value;
  return currency ? `KES ${value.toLocaleString("en-KE")}` : value.toLocaleString("en-US");
}

function Metric({ title, value, note, icon: Icon, tone = "green" }: { title: string; value: string; note?: string; icon: typeof Users; tone?: "green" | "blue" | "amber" | "red" }) {
  const tones = { green: "border-emerald-200 bg-emerald-50 text-emerald-800", blue: "border-sky-200 bg-sky-50 text-sky-800", amber: "border-amber-200 bg-amber-50 text-amber-900", red: "border-red-200 bg-red-50 text-red-800" };
  return <div className={`rounded-lg border p-4 ${tones[tone]}`}><div className="flex items-center justify-between"><p className="text-xs font-semibold uppercase">{title}</p><Icon className="size-4" /></div><p className="mt-3 break-words text-2xl font-semibold tabular-nums">{value}</p>{note && <p className="mt-1 text-xs opacity-75">{note}</p>}</div>;
}

function TrendTooltip({ active, payload }: { active?: boolean; payload?: Array<{ payload?: { period?: string; revenue?: string; collected?: string; subscriberCount?: number } }> }) {
  if (!active || !payload?.[0]?.payload) return null;
  const point = payload[0].payload;
  return <div className="rounded-md border bg-background p-3 text-xs shadow"><p className="font-medium">{point.period}</p>{point.revenue !== undefined && <p>Revenue: KES {point.revenue}</p>}{point.collected !== undefined && <p>Collected: KES {point.collected}</p>}{point.subscriberCount !== undefined && <p>Subscribers: {point.subscriberCount}</p>}</div>;
}

export function AdminDashboardView({ data }: { data: AdminDashboardResponse }) {
  const trend = data.revenueTrend.map((point) => ({ ...point, revenuePlot: Number.parseFloat(point.revenue), collectedPlot: Number.parseFloat(point.collected) }));
  const customerTrend = data.subscriberGrowth;
  const unavailable = new Set(data.unavailableMetrics.map((item) => item.metric));
  const partial = data.dataStatus === "PARTIAL";
  const show = (field: string, value: number | string | null | undefined, currency = false) => unavailable.has(field) ? "Not available" : display(value, currency);
  const alerts = data.alerts;
  const operations = data.operations;
  const revenue = data.revenue;

  return <div className="space-y-6">
    <div className="flex flex-wrap items-end justify-between gap-3"><div><p className="text-xs uppercase tracking-wider text-muted-foreground">Administration · Network overview</p><h1 className="mt-1 text-2xl font-normal">Dashboard</h1><p className="mt-1 text-sm text-muted-foreground">{data.period.from} to {data.period.to} · {data.period.timezone} · {data.companyId ?? "All companies"}</p></div><p className="text-xs text-muted-foreground">Updated {new Date(data.generatedAt).toLocaleString()}</p></div>
    {partial && <div role="status" className="rounded-md border border-amber-300 bg-amber-50 px-4 py-3 text-sm text-amber-950">Some figures could not be loaded. Unavailable fields are marked individually.</div>}
    <section aria-label="Customers and network" className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
      <Metric title="Total customers" value={show("customers.total", data.customers?.total)} note={`${display(data.customers?.active)} active · ${display(data.customers?.inactive)} inactive`} icon={Users} tone="blue" />
      <Metric title="Packages" value={show("packages.total", data.packages?.total)} note={`${display(data.packages?.active)} active`} icon={Wifi} />
      <Metric title="Devices" value={show("devices.total", data.devices?.total)} note={`${display(data.devices?.online)} online · ${display(data.devices?.offline)} offline`} icon={Router} tone="amber" />
      <Metric title="Healthy routers" value={show("devices.healthyRouters", data.devices?.healthyRouters)} note={`${display(data.devices?.degraded)} degraded`} icon={Activity} />
    </section>
    <section aria-label="Revenue" className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
      <Metric title="Revenue today" value={show("revenue.daily", revenue?.daily, true)} note={`${data.period.daily.from} · GL postings`} icon={Wallet} tone="green" />
      <Metric title="Revenue · last 7 days" value={show("revenue.weekly", revenue?.weekly, true)} note={`${data.period.weekly.from} to ${data.period.weekly.to}`} icon={Wallet} />
      <Metric title="Revenue · month to date" value={show("revenue.monthly", revenue?.monthly, true)} note={`${data.period.monthly.from} to ${data.period.monthly.to}`} icon={Wallet} tone="green" />
      <Metric title="Collected · month to date" value={show("revenue.collected", revenue?.collected, true)} note="Payments received" icon={Wallet} tone="blue" />
      <Metric title="Expected · month to date" value={show("revenue.expected", revenue?.expected, true)} note="Invoices due" icon={Wallet} />
      <Metric title="Outstanding" value={show("revenue.outstanding", revenue?.outstanding, true)} note="Open invoices now" icon={AlertTriangle} tone="amber" />
      <Metric title="Failed payments" value={show("revenue.failedPayments", revenue?.failedPayments)} icon={AlertTriangle} tone="red" />
      <Metric title="Hotspot revenue · MTD" value={show("revenue.hotspot", revenue?.hotspot, true)} icon={Wallet} />
    </section>
    <section className="grid gap-4 xl:grid-cols-2">
      <div className="rounded-lg border bg-card p-4"><h2 className="text-sm font-medium">Revenue and collections</h2><p className="mb-3 text-xs text-muted-foreground">KES · monthly GL revenue and received payments</p><div className="h-64">{trend.length ? <ResponsiveContainer width="100%" height="100%"><AreaChart data={trend}><CartesianGrid strokeDasharray="3 3" vertical={false} /><XAxis dataKey="period" /><YAxis /><Tooltip content={<TrendTooltip />} /><Area dataKey="revenuePlot" name="Revenue" stroke="#059669" fill="#a7f3d0" /><Area dataKey="collectedPlot" name="Collected" stroke="#0284c7" fill="#bae6fd" /></AreaChart></ResponsiveContainer> : <p className="py-16 text-center text-sm text-muted-foreground">No revenue trend data.</p>}</div></div>
      <div className="rounded-lg border bg-card p-4"><h2 className="text-sm font-medium">Subscriber growth</h2><p className="mb-3 text-xs text-muted-foreground">Monthly subscriber totals</p><div className="h-64">{customerTrend.length ? <ResponsiveContainer width="100%" height="100%"><AreaChart data={customerTrend}><CartesianGrid strokeDasharray="3 3" vertical={false} /><XAxis dataKey="period" /><YAxis allowDecimals={false} /><Tooltip content={<TrendTooltip />} /><Area dataKey="subscriberCount" name="Subscribers" stroke="#0284c7" fill="#bae6fd" /></AreaChart></ResponsiveContainer> : <p className="py-16 text-center text-sm text-muted-foreground">No subscriber trend data.</p>}</div></div>
    </section>
    <section className="rounded-lg border bg-card p-4"><h2 className="mb-3 text-sm font-medium">Operational alerts</h2><div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">{[
      ["Offline routers", alerts?.offlineRouters], ["High CPU routers", alerts?.highCpuRouters], ["High memory routers", alerts?.highMemoryRouters], ["Expiring customers", alerts?.expiringCustomers], ["Expired accounts", alerts?.expiredAccounts], ["PPPoE failures", alerts?.failedPppoeSessions], ["Hotspot failures", alerts?.failedHotspotSessions], ["SLA breaches", alerts?.slaBreaches], ["Failed callbacks", alerts?.failedPaymentCallbacks], ["SMS failures", alerts?.smsFailures],
    ].map(([label, value]) => <div key={String(label)} className="flex justify-between border-b py-2 text-sm"><span>{label}</span><span className="font-sans tabular-nums">{display(value as number | null)}</span></div>)}</div></section>
    <section className="rounded-lg border bg-card p-4"><h2 className="mb-3 text-sm font-medium">Operations</h2><div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">{[
      ["PPPoE sessions", operations?.activePppoeSessions], ["Hotspot sessions", operations?.activeHotspotSessions], ["Churn · 30 days", operations?.churnRate == null ? null : `${operations.churnRate}%`], ["Support tickets", operations?.supportTickets],
    ].map(([label, value]) => <div key={String(label)} className="border-b py-2 text-sm"><p className="text-muted-foreground">{label}</p><p className="mt-1 font-sans tabular-nums">{display(value as number | string | null)}</p></div>)}</div></section>
  </div>;
}
