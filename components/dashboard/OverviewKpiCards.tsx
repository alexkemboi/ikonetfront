import React from "react";

/** Online sessions split by service, from the live-sessions KPI block. */
export interface OnlineBreakdown {
 total: number;
 hotspot: number;
 pppoe: number;
}

/** Customers that have ever connected: PPPoE accounts, hotspot and TV devices. */
export interface CustomerBreakdown {
 pppoe: number;
 hotspot: number;
 tv: number;
}

interface Props {
 /** Completed payments received since midnight. */
 paymentsTodayCount: number;
 /** PPPoE (portal) subscriptions that are currently valid. */
 activePppoeSubscriptions: number;
 /** Cockpit's online total; used when the per-service breakdown is unavailable. */
 onlineCount: number;
 online: OnlineBreakdown | null;
 /** Access points reporting / not reporting; null when unavailable. */
 accessPointsSeen: number | null;
 accessPointsNotSeen: number | null;
 /** Customers that have ever connected, per service; null when unavailable. */
 customers: CustomerBreakdown | null;
 /** Companies on the platform; null outside the platform-wide view. */
 companies: { total: number; active: number } | null;
}

/** part/whole as 0..100; a ratio across mismatched populations can never exceed a full bar. */
function sharePercent(part: number, whole: number): number {
 if (whole <= 0) return 0;
 return Math.min(100, Math.max(0, (part / whole) * 100));
}

function count(value: number | null): string {
 return value === null ? "—" : value.toLocaleString();
}

function Card({ label, value, children }: { label: string; value: React.ReactNode; children?: React.ReactNode }) {
 return (
 <div className="rounded-2xl border border-border bg-card p-5 shadow-lg">
 <span className="text-[11px] font-sans tabular-nums tracking-wider text-muted-foreground uppercase">
 {label}
 </span>
 <div className="mt-2 text-3xl font-sans tabular-nums font-bold text-foreground">{value}</div>
 {children}
 </div>
 );
}

export function OverviewKpiCards({
 paymentsTodayCount,
 activePppoeSubscriptions,
 onlineCount,
 online,
 accessPointsSeen,
 accessPointsNotSeen,
 customers,
 companies,
}: Props) {
 const customersTotal = customers ? customers.hotspot + customers.pppoe + customers.tv : 0;
 const onlineTotal = online?.total ?? onlineCount;
 // TV and any future protocol: whatever the total holds beyond hotspot + PPPoE
 const otherOnline = online ? Math.max(0, online.total - online.hotspot - online.pppoe) : 0;
 const pppoeOnline = online ? Math.min(online.pppoe, activePppoeSubscriptions) : null;
 return (
 <div className="space-y-4">
 <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
 {/* Customers that have ever connected, per service */}
 <Card label="CUSTOMERS" value={customers === null ? "—" : customersTotal.toLocaleString()}>
 {customers === null ? (
 <p className="mt-2 text-xs text-muted-foreground">Customer count unavailable</p>
 ) : (
 <>
 <p className="mt-2 flex flex-wrap gap-x-3 text-xs text-muted-foreground">
 <span className="inline-flex items-center gap-1.5">
 <span className="h-2 w-2 rounded-full bg-emerald-500" />
 Hotspot {customers.hotspot.toLocaleString()}
 </span>
 <span className="inline-flex items-center gap-1.5">
 <span className="h-2 w-2 rounded-full bg-amber-500" />
 PPPoE {customers.pppoe.toLocaleString()}
 </span>
 <span className="inline-flex items-center gap-1.5">
 <span className="h-2 w-2 rounded-full bg-sky-500" />
 TV {customers.tv.toLocaleString()}
 </span>
 </p>
 {customersTotal > 0 && (
 <div className="mt-5 flex h-2 w-full overflow-hidden rounded-full bg-secondary">
 <div className="h-2 bg-emerald-500" style={{ width: `${sharePercent(customers.hotspot, customersTotal)}%` }} />
 <div className="h-2 bg-amber-500" style={{ width: `${sharePercent(customers.pppoe, customersTotal)}%` }} />
 <div className="h-2 bg-sky-500" style={{ width: `${sharePercent(customers.tv, customersTotal)}%` }} />
 </div>
 )}
 </>
 )}
 </Card>

 {/* Payments received today */}
 <Card label="PAYMENTS TODAY" value={paymentsTodayCount.toLocaleString()}>
 <p className="mt-2 text-xs text-muted-foreground">completed since midnight</p>
 </Card>

 {/* Active PPPoE subscriptions */}
 <Card label="ACTIVE PPPOE CLIENTS" value={activePppoeSubscriptions.toLocaleString()}>
 <p className="mt-2 text-xs text-muted-foreground">
 {pppoeOnline === null
 ? "PPPoE subscriptions currently valid"
 : `${pppoeOnline.toLocaleString()} of ${activePppoeSubscriptions.toLocaleString()} online now`}
 </p>
 {pppoeOnline !== null && activePppoeSubscriptions > 0 && (
 <div className="mt-5 h-1 w-full rounded-full bg-secondary">
 <div
 className="h-1 rounded-full bg-amber-500"
 style={{ width: `${sharePercent(pppoeOnline, activePppoeSubscriptions)}%` }}
 />
 </div>
 )}
 </Card>

 {/* Online now, across all services */}
 <Card label="ONLINE NOW" value={onlineTotal.toLocaleString()}>
 {online ? (
 <>
 <p className="mt-2 flex flex-wrap gap-x-3 text-xs text-muted-foreground">
 <span className="inline-flex items-center gap-1.5">
 <span className="h-2 w-2 rounded-full bg-emerald-500" />
 Hotspot {online.hotspot.toLocaleString()}
 </span>
 <span className="inline-flex items-center gap-1.5">
 <span className="h-2 w-2 rounded-full bg-amber-500" />
 PPPoE {online.pppoe.toLocaleString()}
 </span>
 {otherOnline > 0 && (
 <span className="inline-flex items-center gap-1.5">
 <span className="h-2 w-2 rounded-full bg-sky-500" />
 Other {otherOnline.toLocaleString()}
 </span>
 )}
 </p>
 {online.total > 0 && (
 <div className="mt-5 flex h-2 w-full overflow-hidden rounded-full bg-secondary">
 <div className="h-2 bg-emerald-500" style={{ width: `${sharePercent(online.hotspot, online.total)}%` }} />
 <div className="h-2 bg-amber-500" style={{ width: `${sharePercent(online.pppoe, online.total)}%` }} />
 <div className="h-2 bg-sky-500" style={{ width: `${sharePercent(otherOnline, online.total)}%` }} />
 </div>
 )}
 </>
 ) : (
 <p className="mt-2 text-xs text-muted-foreground">sessions connected · breakdown unavailable</p>
 )}
 </Card>
 </div>

 <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
 {/* Companies on the platform (platform-wide views only) */}
 <Card label="COMPANIES" value={companies === null ? "—" : companies.total.toLocaleString()}>
 <p className="mt-2 text-xs text-muted-foreground">
 {companies === null
 ? "Shown in the platform-wide view"
 : `${companies.active.toLocaleString()} active on the platform`}
 </p>
 </Card>


 {/* Access points seen */}
 <Card label="ACCESS POINTS SEEN" value={count(accessPointsSeen)}>
 <p className="mt-2 inline-flex items-center gap-1.5 text-xs text-muted-foreground">
 <span className="h-2 w-2 rounded-full bg-emerald-500" />
 {accessPointsSeen === null ? "Access point status unavailable" : "reporting to their routers"}
 </p>
 </Card>

 {/* Access points not seen */}
 <Card
 label="ACCESS POINTS NOT SEEN"
 value={
 <span className={accessPointsNotSeen ? "text-rose-400" : undefined}>{count(accessPointsNotSeen)}</span>
 }
 >
 <p className="mt-2 inline-flex items-center gap-1.5 text-xs text-muted-foreground">
 <span className={`h-2 w-2 rounded-full ${accessPointsNotSeen ? "bg-rose-500" : "bg-secondary"}`} />
 {accessPointsNotSeen === null
 ? "Access point status unavailable"
 : accessPointsNotSeen > 0
 ? "watched access points gone quiet"
 : "every watched access point is reporting"}
 </p>
 </Card>
 </div>
 </div>
 );
}
