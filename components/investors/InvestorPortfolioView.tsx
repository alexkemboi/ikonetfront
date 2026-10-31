"use client";

import { ArrowRight } from "lucide-react";
import { Bar, BarChart, CartesianGrid, ComposedChart, Line, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import type {
  FeeStanding,
  InvestorPortfolio,
  PortfolioAgreement,
  PortfolioRouter,
  PortfolioRule,
} from "@/lib/types/investorPortfolio";

/**
 * One investor's month, told in the order money moves: what their routers took in, what is
 * credited to them, the system fee on that, what is left, and what they owe the platform.
 * Then the mix (hotspot, PPPoE, TV), the days, each router, the last six months, and the
 * agreements behind it, company by company.
 *
 * Shared by the investor's own page and the administrators' investor page; `audience`
 * changes the wording ("you" / the investor's name), never the figures.
 */

// series colours: the validated chart palette, in its fixed order (globals.css --viz-*)
const SERIES = [
  { key: "hotspot", label: "Hotspot", color: "var(--viz-1)" },
  { key: "pppoe", label: "PPPoE", color: "var(--viz-2)" },
  { key: "tv", label: "TV", color: "var(--viz-3)" },
] as const;

const kes = (value: number, digits = 0) =>
  new Intl.NumberFormat("en-KE", {
    style: "currency",
    currency: "KES",
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  }).format(Number.isFinite(value) ? value : 0);

const kesAxis = (value: number) =>
  value >= 1_000_000 ? `${(value / 1_000_000).toFixed(1)}M` : value >= 1_000 ? `${Math.round(value / 1_000)}k` : String(value);

const day = (iso: string | null) =>
  iso ? new Date(iso.length === 10 ? `${iso}T00:00:00` : iso).toLocaleDateString("en-KE", { day: "numeric", month: "short", year: "numeric" }) : "—";

const monthLabel = (period: string) =>
  new Date(`${period}-01T00:00:00`).toLocaleDateString("en-KE", { month: "short", year: "numeric" });

const STANDING: Record<FeeStanding, { label: string; className: string }> = {
  GOOD: { label: "Paid up", className: "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300" },
  DUE: { label: "Due", className: "bg-amber-500/15 text-amber-700 dark:text-amber-300" },
  OVERDUE: { label: "Overdue", className: "bg-orange-500/15 text-orange-700 dark:text-orange-300" },
  SUSPENDED: { label: "Suspended", className: "bg-red-500/15 text-red-700 dark:text-red-300" },
};

function StandingBadge({ standing }: { standing: FeeStanding }) {
  const s = STANDING[standing] ?? STANDING.GOOD;
  return <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${s.className}`}>{s.label}</span>;
}

function ruleText(rule: PortfolioRule): string {
  const service = rule.serviceType === "PPPOE" ? "PPPoE" : "Hotspot and TV";
  if (rule.calculationBasis === "PERCENTAGE_OF_GROSS") return `${service}: ${rule.rate}% of revenue`;
  if (rule.calculationBasis === "FIXED_PER_ACTIVE_SUBSCRIBER") return `${service}: KSh ${rule.rate} per paying customer`;
  return `${service}: KSh ${rule.rate} per month`;
}

function Legend() {
  return (
    <ul className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
      {SERIES.map((s) => (
        <li key={s.key} className="flex items-center gap-1.5">
          <span className="size-2.5 rounded-sm" style={{ background: s.color }} />
          {s.label}
        </li>
      ))}
    </ul>
  );
}

type Row = { label: string; title: string; hotspot: number; pppoe: number; tv: number; fee?: number };

function SeriesTooltip({ active, payload, withFee }: { active?: boolean; payload?: { payload: Row }[]; withFee?: boolean }) {
  if (!active || !payload?.length) return null;
  const row = payload[0].payload;
  const total = row.hotspot + row.pppoe + row.tv;
  return (
    <div className="rounded-lg border border-border bg-popover px-3 py-2 text-xs text-popover-foreground shadow-md">
      <p className="font-medium">{row.title}</p>
      {SERIES.map((s) => (
        <p key={s.key} className="mt-1 flex items-center gap-2">
          <span className="size-2 rounded-sm" style={{ background: s.color }} />
          {s.label}: <span className="tabular-nums">{kes(row[s.key])}</span>
        </p>
      ))}
      <p className="mt-1 border-t border-border pt-1 font-medium tabular-nums">Credited {kes(total)}</p>
      {withFee && row.fee !== undefined && (
        <p className="flex items-center gap-2 text-muted-foreground">
          <span className="h-0.5 w-2" style={{ background: "var(--viz-previous)" }} />
          System fee: <span className="tabular-nums">{kes(row.fee)}</span>
        </p>
      )}
    </div>
  );
}

/** Stacked bars of credited revenue by service; the top segment carries the rounded end. */
function StackedBars({ rows, height = 240, withFee = false }: { rows: Row[]; height?: number; withFee?: boolean }) {
  return (
    <div style={{ height }} className="w-full">
      <ResponsiveContainer width="100%" height="100%">
        <ComposedChart data={rows} margin={{ left: 4, right: 8, top: 8, bottom: 0 }} barCategoryGap="22%">
          <CartesianGrid vertical={false} stroke="var(--viz-grid)" />
          <XAxis dataKey="label" tickLine={false} axisLine={false} minTickGap={16}
            tick={{ fontSize: 11, fill: "var(--muted-foreground)" }} />
          <YAxis width={44} tickLine={false} axisLine={false} allowDecimals={false} tickFormatter={kesAxis}
            tick={{ fontSize: 11, fill: "var(--muted-foreground)" }} />
          <Tooltip cursor={{ fill: "var(--muted)", opacity: 0.5 }} content={<SeriesTooltip withFee={withFee} />} />
          {SERIES.map((s, i) => (
            <Bar key={s.key} dataKey={s.key} stackId="credited" fill={s.color} stroke="var(--card)" strokeWidth={1}
              radius={i === SERIES.length - 1 ? [4, 4, 0, 0] : 0} maxBarSize={28} isAnimationActive={false} />
          ))}
          {withFee && (
            <Line dataKey="fee" type="linear" stroke="var(--viz-previous)" strokeWidth={2} strokeDasharray="5 4"
              dot={{ r: 3, fill: "var(--viz-previous)", stroke: "var(--card)", strokeWidth: 2 }} isAnimationActive={false} />
          )}
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  );
}

function AsTable({ rows, withFee = false }: { rows: Row[]; withFee?: boolean }) {
  return (
    <details className="mt-2 text-xs">
      <summary className="cursor-pointer text-muted-foreground">Show as a table</summary>
      <div className="mt-2 overflow-x-auto">
        <table className="w-full text-left tabular-nums">
          <thead className="text-muted-foreground">
            <tr>
              <th className="py-1 pr-3 font-medium"> </th>
              {SERIES.map((s) => <th key={s.key} className="py-1 pr-3 text-right font-medium">{s.label}</th>)}
              <th className="py-1 pr-3 text-right font-medium">Credited</th>
              {withFee && <th className="py-1 text-right font-medium">System fee</th>}
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.label} className="border-t border-border">
                <td className="py-1 pr-3">{r.title}</td>
                {SERIES.map((s) => <td key={s.key} className="py-1 pr-3 text-right">{kes(r[s.key])}</td>)}
                <td className="py-1 pr-3 text-right font-medium">{kes(r.hotspot + r.pppoe + r.tv)}</td>
                {withFee && <td className="py-1 text-right">{kes(r.fee ?? 0, 2)}</td>}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </details>
  );
}

function FlowStep({ label, value, hint, emphasis = false }: { label: string; value: string; hint: string; emphasis?: boolean }) {
  return (
    <div className={`flex-1 rounded-xl border p-4 ${emphasis ? "border-primary/40 bg-primary/5" : "border-border bg-card"}`}>
      <p className="text-xs font-medium text-muted-foreground">{label}</p>
      <p className={`mt-1 font-semibold tabular-nums ${emphasis ? "text-3xl" : "text-2xl"}`}>{value}</p>
      <p className="mt-1 text-xs text-muted-foreground">{hint}</p>
    </div>
  );
}

function Arrow() {
  return (
    <div className="hidden items-center justify-center text-muted-foreground lg:flex" aria-hidden>
      <ArrowRight className="size-5" />
    </div>
  );
}

function MixTile({ label, color, amount, total, count }: { label: string; color: string; amount: number; total: number; count: string }) {
  const share = total > 0 ? Math.round((amount / total) * 100) : 0;
  return (
    <div className="rounded-xl border border-border p-4">
      <p className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
        <span className="size-2.5 rounded-sm" style={{ background: color }} />
        {label}
      </p>
      <p className="mt-1 text-xl font-semibold tabular-nums">{kes(amount)}</p>
      <p className="text-xs text-muted-foreground">{count} · {share}% of credited</p>
      <div className="mt-2 h-1.5 w-full rounded-full bg-muted">
        <div className="h-1.5 rounded-full" style={{ width: `${share}%`, background: color }} />
      </div>
    </div>
  );
}

function RouterTable({ routers, you }: { routers: PortfolioRouter[]; you: string }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[900px] text-left text-sm tabular-nums">
        <thead className="text-xs text-muted-foreground">
          <tr className="border-b border-border">
            <th className="py-2 pr-3 font-medium">Router</th>
            <th className="py-2 pr-3 font-medium">Agreement</th>
            <th className="py-2 pr-3 text-right font-medium">Took in (month)</th>
            <th className="py-2 pr-3 text-right font-medium">Hotspot</th>
            <th className="py-2 pr-3 text-right font-medium">PPPoE</th>
            <th className="py-2 pr-3 text-right font-medium">TV</th>
            <th className="py-2 pr-3 text-right font-medium">Credited to {you}</th>
            <th className="py-2 pr-3 text-right font-medium">System fee</th>
            <th className="py-2 text-right font-medium">Net</th>
          </tr>
        </thead>
        <tbody>
          {routers.map((r) => (
            <tr key={r.routerId} className="border-b border-border align-top">
              <td className="py-2 pr-3">
                <p className="font-medium">{r.routerName}</p>
                <p className="text-xs text-muted-foreground">
                  {[r.stationName, r.companyName].filter(Boolean).join(" · ")}
                </p>
                <p className="text-xs text-muted-foreground">
                  {r.ownedUntil ? `Held ${day(r.ownedFrom)} to ${day(r.ownedUntil)}` : `Held since ${day(r.ownedFrom)}`}
                </p>
              </td>
              <td className="py-2 pr-3 text-xs">{r.agreementCode ?? "—"}</td>
              <td className="py-2 pr-3 text-right">{kes(r.tookIn)}</td>
              <td className="py-2 pr-3 text-right">
                {kes(r.creditedHotspot)}
                <p className="text-xs text-muted-foreground">{r.hotspotPurchases} purchases</p>
              </td>
              <td className="py-2 pr-3 text-right">
                {kes(r.creditedPppoe)}
                <p className="text-xs text-muted-foreground">{r.pppoePayingCustomers} paying customers</p>
              </td>
              <td className="py-2 pr-3 text-right">
                {kes(r.creditedTv)}
                <p className="text-xs text-muted-foreground">{r.tvPurchases} purchases</p>
              </td>
              <td className="py-2 pr-3 text-right font-medium">{kes(r.credited)}</td>
              <td className="py-2 pr-3 text-right">{kes(r.fee, 2)}</td>
              <td className="py-2 text-right font-medium">{kes(r.net)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function RouterChart({ routers }: { routers: PortfolioRouter[] }) {
  const rows = routers.map((r) => ({
    label: r.routerName,
    title: r.routerName,
    hotspot: r.creditedHotspot,
    pppoe: r.creditedPppoe,
    tv: r.creditedTv,
  }));
  return (
    <div style={{ height: Math.max(120, rows.length * 44) }} className="w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={rows} layout="vertical" margin={{ left: 4, right: 16, top: 4, bottom: 0 }} barCategoryGap="28%">
          <CartesianGrid horizontal={false} stroke="var(--viz-grid)" />
          <XAxis type="number" tickLine={false} axisLine={false} tickFormatter={kesAxis}
            tick={{ fontSize: 11, fill: "var(--muted-foreground)" }} />
          <YAxis type="category" dataKey="label" width={140} tickLine={false} axisLine={false}
            tick={{ fontSize: 11, fill: "var(--muted-foreground)" }} />
          <Tooltip cursor={{ fill: "var(--muted)", opacity: 0.5 }} content={<SeriesTooltip />} />
          {SERIES.map((s, i) => (
            <Bar key={s.key} dataKey={s.key} stackId="credited" fill={s.color} stroke="var(--card)" strokeWidth={1}
              radius={i === SERIES.length - 1 ? [0, 4, 4, 0] : 0} maxBarSize={22} isAnimationActive={false} />
          ))}
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

function AgreementCard({ agreement: a, you }: { agreement: PortfolioAgreement; you: string }) {
  return (
    <div className="rounded-xl border border-border p-4">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <p className="font-medium">
            {a.name} <span className="font-mono text-xs text-muted-foreground">{a.code}</span>
          </p>
          <p className="text-xs text-muted-foreground">
            {a.companyName ?? a.companyCode} · from {day(a.startDate)}{a.endDate ? ` to ${day(a.endDate)}` : ", open-ended"}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant={a.status === "ACTIVE" ? "default" : "secondary"}>{a.status === "ACTIVE" ? "Active" : "Ended"}</Badge>
          <StandingBadge standing={a.standing} />
        </div>
      </div>

      <div className="mt-3 grid gap-4 text-sm sm:grid-cols-3">
        <div>
          <p className="text-xs font-medium text-muted-foreground">Fee terms</p>
          <ul className="mt-1 space-y-0.5">
            {a.rules.length === 0 ? <li className="text-muted-foreground">No fee</li> : a.rules.map((r) => <li key={`${r.serviceType}-${r.calculationBasis}`}>{ruleText(r)}</li>)}
          </ul>
          <p className="mt-2 text-xs font-medium text-muted-foreground">Routers held now</p>
          <p>{a.routerNames.length ? a.routerNames.join(", ") : "None"}</p>
        </div>
        <div>
          <p className="text-xs font-medium text-muted-foreground">This month&apos;s fee (worked out now)</p>
          <p className="mt-1 tabular-nums">Hotspot and TV {kes(a.hotspotBase)} → {kes(a.hotspotFee, 2)}</p>
          <p className="tabular-nums">PPPoE {a.pppoePayers} paying → {kes(a.pppoeFee, 2)}</p>
          <p className="mt-1 font-medium tabular-nums">Total {kes(a.fee, 2)}</p>
        </div>
        <div>
          <p className="text-xs font-medium text-muted-foreground">Owed to the platform</p>
          <p className="mt-1 tabular-nums">Charged {kes(a.feeCharged, 2)} · paid {kes(a.feePaid, 2)}</p>
          <p className="font-medium tabular-nums">Outstanding {kes(Math.max(a.feeOutstanding, 0), 2)}</p>
          {a.feeOutstanding > 0 && (
            <p className="text-xs text-muted-foreground">Due {day(a.oldestDueDate)} · suspension from {day(a.suspendDate)}</p>
          )}
        </div>
      </div>

      {a.statements.length > 0 && (
        <details className="mt-3 text-sm">
          <summary className="cursor-pointer text-xs text-muted-foreground">Month-end statements ({a.statements.length})</summary>
          <table className="mt-2 w-full text-left text-xs tabular-nums">
            <thead className="text-muted-foreground">
              <tr><th className="py-1 font-medium">Month</th><th className="py-1 font-medium">Statement</th><th className="py-1 text-right font-medium">Hotspot and TV</th><th className="py-1 text-right font-medium">PPPoE paying</th><th className="py-1 text-right font-medium">Fee</th><th className="py-1 text-right font-medium">Status</th></tr>
            </thead>
            <tbody>
              {a.statements.map((s) => (
                <tr key={s.number} className="border-t border-border">
                  <td className="py-1">{monthLabel(s.period)}</td>
                  <td className="py-1 font-mono">{s.number}</td>
                  <td className="py-1 text-right">{kes(s.hotspotGross)}</td>
                  <td className="py-1 text-right">{s.pppoePayers}</td>
                  <td className="py-1 text-right">{kes(s.fee, 2)}</td>
                  <td className="py-1 text-right">{s.status}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </details>
      )}
      <p className="mt-2 text-xs text-muted-foreground">
        The fee is owed by {you} to the platform for the routers under this agreement; it is billed on the 1st for the month before.
      </p>
    </div>
  );
}

export default function InvestorPortfolioView({
  portfolio: p,
  audience,
}: {
  portfolio: InvestorPortfolio;
  audience: "investor" | "admin";
}) {
  const you = audience === "investor" ? "you" : p.investor.name;
  const your = audience === "investor" ? "Your" : `${p.investor.name}'s`;
  const t = p.totals;
  const monthName = new Date(`${p.period}-01T00:00:00`).toLocaleDateString("en-KE", { month: "long", year: "numeric" });

  const dailyRows: Row[] = p.daily.map((d) => ({
    label: String(new Date(`${d.day}T00:00:00`).getDate()),
    title: day(d.day),
    hotspot: d.hotspot,
    pppoe: d.pppoe,
    tv: d.tv,
  }));
  const monthRows: Row[] = p.months.map((m) => ({
    label: monthLabel(m.period),
    title: `${monthLabel(m.period)}${m.feeFromStatement ? "" : " (fee worked out, no statement yet)"}`,
    hotspot: m.hotspot,
    pppoe: m.pppoe,
    tv: m.tv,
    fee: m.fee,
  }));
  const hasCredit = t.credited > 0;

  return (
    <div className="space-y-6">
      {/* the money flow */}
      <section aria-label="Money flow" className="space-y-3">
        <div className="flex flex-col gap-3 lg:flex-row">
          <FlowStep label={`${your} routers took in`} value={kes(t.tookIn)}
            hint={`${monthName}, whole month: hotspot, PPPoE and TV`} />
          <Arrow />
          <FlowStep label={audience === "investor" ? "Credited to you" : `Credited to ${p.investor.name}`} value={kes(t.credited)}
            hint="Payments taken while each router was held" />
          <Arrow />
          <FlowStep label="System fee" value={kes(t.fee)} hint="Owed to the platform on the credited amount" />
          <Arrow />
          <FlowStep label={audience === "investor" ? "Your net payout" : "Net payout"} value={kes(t.net)}
            hint="Credited, less the system fee" emphasis />
        </div>
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-border bg-card px-4 py-3 text-sm">
          <div className="flex flex-wrap items-center gap-3">
            <span className="font-medium">Owed to the platform</span>
            <StandingBadge standing={t.standing} />
            <span className="tabular-nums">Outstanding {kes(Math.max(t.feeOutstanding, 0), 2)}</span>
            {t.feeOutstanding > 0 && (
              <span className="text-muted-foreground">Due {day(t.nextDueDate)} · suspension from {day(t.suspendDate)}</span>
            )}
          </div>
          <span className="text-xs text-muted-foreground tabular-nums">
            All statements: charged {kes(t.feeCharged, 2)} · paid {kes(t.feePaid, 2)}
          </span>
        </div>
      </section>

      {/* the mix */}
      <section aria-label="Revenue by service" className="grid gap-3 sm:grid-cols-3">
        <MixTile label="Hotspot" color="var(--viz-1)" amount={t.creditedHotspot} total={t.credited}
          count={`${t.hotspotPurchases} purchases`} />
        <MixTile label="PPPoE" color="var(--viz-2)" amount={t.creditedPppoe} total={t.credited}
          count={`${t.pppoePayingCustomers} paying customers`} />
        <MixTile label="TV" color="var(--viz-3)" amount={t.creditedTv} total={t.credited}
          count={`${t.tvPurchases} purchases`} />
      </section>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Credited each day</CardTitle>
            <CardDescription>{monthName}, by service</CardDescription>
          </CardHeader>
          <CardContent>
            {hasCredit ? (
              <>
                <StackedBars rows={dailyRows} />
                <Legend />
                <AsTable rows={dailyRows.filter((r) => r.hotspot + r.pppoe + r.tv > 0)} />
              </>
            ) : (
              <p className="text-sm text-muted-foreground">Nothing was credited in {monthName}.</p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Last six months</CardTitle>
            <CardDescription>Credited by service; the dashed line is the system fee</CardDescription>
          </CardHeader>
          <CardContent>
            <StackedBars rows={monthRows} withFee />
            <ul className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
              {SERIES.map((s) => (
                <li key={s.key} className="flex items-center gap-1.5">
                  <span className="size-2.5 rounded-sm" style={{ background: s.color }} />
                  {s.label}
                </li>
              ))}
              <li className="flex items-center gap-1.5">
                <span className="h-0.5 w-3" style={{ background: "var(--viz-previous)" }} />
                System fee
              </li>
            </ul>
            <AsTable rows={monthRows} withFee />
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Each router</CardTitle>
          <CardDescription>
            {monthName}. &ldquo;Took in&rdquo; is the router&apos;s whole month; the service columns are what was credited to {you}.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {p.routers.length === 0 ? (
            <p className="text-sm text-muted-foreground">No router was held in {monthName}.</p>
          ) : (
            <>
              {p.routers.length > 1 && hasCredit && (
                <>
                  <RouterChart routers={p.routers} />
                  <Legend />
                </>
              )}
              <RouterTable routers={p.routers} you={you} />
            </>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Agreements</CardTitle>
          <CardDescription>One per company and set of terms; each router is held under one of them.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {p.agreements.length === 0 ? (
            <p className="text-sm text-muted-foreground">No agreement yet.</p>
          ) : (
            p.agreements.map((a) => <AgreementCard key={a.id} agreement={a} you={you} />)
          )}
        </CardContent>
      </Card>
    </div>
  );
}
