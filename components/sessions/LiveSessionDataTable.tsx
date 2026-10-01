"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Power, Search } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { disconnectLiveSession } from "@/actions/sessions";
import { formatBytes } from "@/lib/utils/formatBytes";
import { sessionState, type LiveSessionItem } from "@/lib/types/sessions";

const TABS = [
 { key: "ALL", label: "All" },
 { key: "ONLINE", label: "Online" },
 { key: "LOST", label: "Lost contact" },
 { key: "NOT_CONNECTED", label: "Paid, not connected" },
 { key: "HOTSPOT", label: "Hotspot" },
 { key: "PPPOE", label: "PPPoE" },
] as const;

type TabKey = (typeof TABS)[number]["key"];

const TH = "px-4 py-3 text-[11px] font-sans tabular-nums uppercase tracking-wider text-muted-foreground";

function matchesTab(session: LiveSessionItem, tab: TabKey): boolean {
 switch (tab) {
 case "ONLINE":
 return sessionState(session) === "ONLINE";
 case "LOST":
 return sessionState(session) === "LOST";
 case "NOT_CONNECTED":
 return sessionState(session) === "WAITING";
 case "HOTSPOT":
 return session.protocol === "HOTSPOT";
 case "PPPOE":
 return session.protocol === "PPPOE";
 default:
 return true;
 }
}

/** 254725134318 → 0725 134 318 (staff read and dial local format). */
function formatPhone(phone?: string): string | undefined {
 if (!phone) return undefined;
 const digits = phone.replace(/\D/g, "");
 const local = digits.startsWith("254") && digits.length === 12 ? `0${digits.slice(3)}` : digits;
 return local.length === 10 ? `${local.slice(0, 4)} ${local.slice(4, 7)} ${local.slice(7)}` : phone;
}

function remainingText(minutes?: number | null): string {
 if (minutes == null) return "—";
 if (minutes < 60) return `${minutes} min left`;
 const hours = Math.floor(minutes / 60);
 if (hours < 48) return `${hours}h ${minutes % 60}m left`;
 return `${Math.floor(hours / 24)} days left`;
}

function agoText(iso?: string): string {
 if (!iso) return "";
 const minutes = Math.max(0, Math.round((Date.now() - new Date(iso).getTime()) / 60000));
 if (minutes < 60) return `${minutes} min ago`;
 const hours = Math.floor(minutes / 60);
 return hours < 48 ? `${hours}h ago` : `${Math.floor(hours / 24)} days ago`;
}

const STATE_STYLE = {
 ONLINE: { label: "Online", badge: "bg-emerald-500/10 text-emerald-400", dot: "bg-emerald-400" },
 LOST: { label: "Lost contact", badge: "bg-rose-500/10 text-rose-400", dot: "bg-rose-400" },
 WAITING: { label: "Paid, not connected", badge: "bg-amber-500/10 text-amber-400", dot: "bg-amber-400" },
} as const;

function StatusBadge({ session }: { session: LiveSessionItem }) {
 const state = sessionState(session);
 const style = STATE_STYLE[state];
 return (
 <span
 title={
 state === "LOST"
 ? `The router stopped reporting this session ${agoText(session.lastSeenAt)} — the router or the customer's device/CPE likely lost power or link.`
 : undefined
 }
 className={cn(
 "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide",
 style.badge
 )}
 >
 <span className={cn("h-1.5 w-1.5 rounded-full", style.dot)} />
 {style.label}
 </span>
 );
}

export function LiveSessionDataTable({
  sessions,
  refreshIntervalSeconds,
}: {
  sessions: LiveSessionItem[];
  refreshIntervalSeconds: number;
}) {
 const [items, setItems] = useState<LiveSessionItem[]>(sessions);
 const [tab, setTab] = useState<TabKey>("ALL");
 const [search, setSearch] = useState("");
 const [confirmId, setConfirmId] = useState<string | null>(null);
 const [busyId, setBusyId] = useState<string | null>(null);
  const router = useRouter();

    useEffect(() => {
      const timer = setInterval(() => router.refresh(), refreshIntervalSeconds * 1000);
      return () => clearInterval(timer);
    }, [refreshIntervalSeconds, router]);

 const counts = useMemo(
 () =>
 Object.fromEntries(TABS.map(({ key }) => [key, items.filter((s) => matchesTab(s, key)).length])) as Record<
 TabKey,
 number
 >,
 [items]
 );

 const filtered = useMemo(() => {
 const query = search.trim().toLowerCase().replace(/\s/g, "");
 return items.filter((session) => {
 if (!matchesTab(session, tab)) return false;
 if (!query) return true;
 return [
 session.phone,
 formatPhone(session.phone),
 session.subscriberName,
 session.subscriberCode,
 session.voucherCode,
 session.mpesaReceipt,
 session.packageName,
 session.deviceMac,
 session.assignedIp,
 session.routerName,
 ]
 .filter(Boolean)
 .some((field) => String(field).toLowerCase().replace(/\s/g, "").includes(query));
 });
 }, [items, tab, search]);

 async function handleDisconnect(session: LiveSessionItem) {
 setBusyId(session.id);
 try {
 const result = await disconnectLiveSession(session.sessionId, "Disconnected from Live Sessions");
 if (result.success) {
 toast.success(result.message);
 setItems((prev) => prev.filter((s) => s.id !== session.id));
 } else {
 toast.error(result.message);
 }
 } catch (error) {
 toast.error(error instanceof Error ? error.message : "Failed to disconnect");
 } finally {
 setBusyId(null);
 setConfirmId(null);
 }
 }

 return (
 <div className="overflow-hidden rounded-lg border border-border bg-card">
 {/* Toolbar */}
 <div className="flex flex-col gap-3 border-b border-border p-4 lg:flex-row lg:items-center lg:justify-between">
 <div className="flex flex-wrap items-center gap-1.5">
 {TABS.map(({ key, label }) => {
 const active = tab === key;
 return (
 <button
 key={key}
 type="button"
 onClick={() => setTab(key)}
 className={cn(
 "rounded-lg px-3 py-1.5 text-xs font-medium transition-colors",
 active ? "bg-zinc-100 text-zinc-900" : "text-muted-foreground hover:text-accent-foreground"
 )}
 >
 {label}
 <span className="ml-1.5 font-sans tabular-nums text-muted-foreground">{counts[key]}</span>
 </button>
 );
 })}
 </div>

 <div className="relative">
 <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
 <input
 value={search}
 onChange={(e) => setSearch(e.target.value)}
 placeholder="Phone, receipt, voucher, MAC, IP…"
 className="h-8 w-64 rounded-lg border border-border bg-muted pl-8 pr-3 text-xs text-foreground outline-none transition-colors placeholder:text-zinc-600 focus:border-zinc-500"
 />
 </div>
 </div>

 {/* Table */}
 <div className="overflow-x-auto">
 <table className="w-full min-w-[1080px] text-left">
 <thead>
 <tr className="border-b border-border">
 <th className={TH}>Customer</th>
 <th className={TH}>Package · Payment</th>
 <th className={TH}>Status</th>
 <th className={TH}>Traffic</th>
 <th className={TH}>Device</th>
 <th className={TH}>Router</th>
 <th className={TH}>Time</th>
 <th className={cn(TH, "text-right")}>Action</th>
 </tr>
 </thead>
 <tbody>
 {filtered.length === 0 ? (
 <tr>
 <td colSpan={8} className="px-4 py-14 text-center text-sm text-muted-foreground">
 {items.length === 0 ? "No one is connected right now." : "No sessions match your filters."}
 </td>
 </tr>
 ) : (
 filtered.map((session) => {
 const phone = formatPhone(session.phone);
 const primary = phone ?? session.subscriberName ?? session.subscriberCode;
 const secondary =
 phone && session.subscriberName && session.subscriberName !== session.phone
 ? session.subscriberName
 : session.protocol === "PPPOE"
 ? session.subscriberCode
 : session.sessionId
 ? `Session #${session.sessionId}`
 : "Not linked to a purchase";
 const canDisconnect = session.protocol === "HOTSPOT" && !!session.sessionId;
 return (
 <tr key={session.id} className="border-b border-border transition-colors hover:bg-accent">
 {/* Customer */}
 <td className="px-4 py-3">
 <div className="flex items-center gap-2">
 <p className="max-w-[160px] truncate font-sans tabular-nums text-sm font-medium text-foreground">
 {primary}
 </p>
 <span
 className={cn(
 "rounded-full px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide",
 session.protocol === "PPPOE" ? "bg-sky-500/10 text-sky-300" : "bg-amber-500/10 text-amber-300"
 )}
 >
 {session.protocol}
 </span>
 </div>
 <p className="mt-0.5 max-w-[180px] truncate text-[11px] text-muted-foreground">{secondary}</p>
 </td>

 {/* Package · Payment */}
 <td className="px-4 py-3">
 <p className="max-w-[180px] truncate text-sm text-foreground">
 {session.packageName ?? "—"}
 {session.amountPaid ? ` · Ksh ${Number(session.amountPaid).toLocaleString()}` : ""}
 </p>
 <p className="font-sans tabular-nums text-[11px] text-muted-foreground">
 {session.mpesaReceipt ? `M-Pesa ${session.mpesaReceipt}` : session.voucherCode ? `Voucher ${session.voucherCode}` : "—"}
 </p>
 </td>

 {/* Status */}
 <td className="px-4 py-3">
 <StatusBadge session={session} />
 </td>

 {/* Traffic */}
 <td className="px-4 py-3">
 <p className="whitespace-nowrap font-sans tabular-nums text-sm font-semibold text-amber-400">
 {formatBytes(session.downloadBytes)} · {formatBytes(session.uploadBytes)}
 </p>
 <p className="text-[11px] text-muted-foreground">down · up</p>
 </td>

 {/* Device */}
 <td className="px-4 py-3">
 <p className="font-sans tabular-nums text-sm text-foreground">{session.deviceMac}</p>
 <p className="font-sans tabular-nums text-[11px] text-muted-foreground">{session.assignedIp}</p>
 </td>

 {/* Router */}
 <td className="px-4 py-3">
 <p className="max-w-[170px] truncate text-sm text-foreground">{session.routerName}</p>
 <p className="font-sans tabular-nums text-[11px] text-muted-foreground">
 {session.nasIp || session.routerManagementIp || "—"}
 </p>
 </td>

 {/* Time */}
 <td className="px-4 py-3">
 <p className="whitespace-nowrap text-sm text-foreground">
 {sessionState(session) === "ONLINE"
 ? `Online ${session.onlineDurationFormatted}`
 : sessionState(session) === "LOST"
 ? `Last heard ${agoText(session.lastSeenAt)}`
 : "Never connected"}
 </p>
 <p className="whitespace-nowrap text-[11px] text-muted-foreground">
 {session.protocol === "HOTSPOT" ? remainingText(session.minutesRemaining) : session.expiryFormatted}
 </p>
 </td>

 {/* Action */}
 <td className="px-4 py-3 text-right">
 {!canDisconnect ? (
 <span
 className="inline-flex h-8 items-center text-[11px] text-muted-foreground"
 title={
 session.protocol === "PPPOE"
 ? "PPPoE disconnect needs the RADIUS CoA endpoint, which is not available yet."
 : "This RADIUS session is not linked to a hotspot purchase."
 }
 >
 —
 </span>
 ) : confirmId === session.id ? (
 <span className="inline-flex items-center gap-1.5">
 <button
 type="button"
 disabled={busyId === session.id}
 onClick={() => handleDisconnect(session)}
 className="h-8 rounded-md bg-rose-500/90 px-2.5 text-xs font-semibold text-white hover:bg-rose-500 disabled:opacity-50"
 >
 {busyId === session.id ? "Disconnecting…" : "Confirm"}
 </button>
 <button
 type="button"
 disabled={busyId === session.id}
 onClick={() => setConfirmId(null)}
 className="h-8 rounded-md px-2 text-xs text-muted-foreground hover:text-foreground"
 >
 Cancel
 </button>
 </span>
 ) : (
 <button
 type="button"
 onClick={() => setConfirmId(session.id)}
 title="End this paid session and remove the device from the router"
 className="inline-flex h-8 items-center gap-1.5 rounded-md px-2.5 text-xs font-medium text-rose-400 transition-colors hover:bg-rose-500/10"
 >
 <Power className="h-3.5 w-3.5" />
 Disconnect
 </button>
 )}
 </td>
 </tr>
 );
 })
 )}
 </tbody>
 </table>
 </div>

 <div className="flex items-center justify-between border-t border-border px-4 py-2.5 text-xs text-muted-foreground">
 <span>
 Showing {filtered.length} of {items.length} sessions
 </span>
 <span className="font-sans tabular-nums">Traffic from router accounting (RADIUS)</span>
 </div>
 </div>
 );
}
