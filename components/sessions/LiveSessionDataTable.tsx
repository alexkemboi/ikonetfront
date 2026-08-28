"use client";

import { useMemo, useState } from "react";
import { Loader2, Power, Search } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { disconnectLiveSession } from "@/actions/sessions";
import type { LiveSessionItem } from "@/lib/types/sessions";

const TABS = [
 { key: "ALL", label: "All" },
 { key: "PPPOE", label: "PPPoE" },
 { key: "HOTSPOT", label: "Hotspot" },
] as const;

type TabKey = (typeof TABS)[number]["key"];

function ProtocolBadge({ protocol }: { protocol: LiveSessionItem["protocol"] }) {
 return (
 <span
 className={cn(
 "inline-flex items-center rounded-full px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide",
 protocol === "PPPOE"
 ? "bg-sky-500/10 text-sky-300"
 : "bg-amber-500/10 text-amber-300"
 )}
 >
 {protocol}
 </span>
 );
}

export function LiveSessionDataTable({
 sessions,
}: {
 sessions: LiveSessionItem[];
}) {
 const [items, setItems] = useState<LiveSessionItem[]>(sessions);
 const [tab, setTab] = useState<TabKey>("ALL");
 const [search, setSearch] = useState("");
 const [disconnectingId, setDisconnectingId] = useState<string | null>(null);

 const counts = useMemo(
 () => ({
 ALL: items.length,
 PPPOE: items.filter((s) => s.protocol === "PPPOE").length,
 HOTSPOT: items.filter((s) => s.protocol === "HOTSPOT").length,
 }),
 [items]
 );

 const filtered = useMemo(() => {
 const query = search.trim().toLowerCase();
 return items.filter((session) => {
 const matchesTab =
 tab === "ALL" || session.protocol === tab;
 if (!matchesTab) return false;
 if (!query) return true;
 return [
 session.subscriberCode,
 session.subscriberName ?? "",
 session.deviceMac,
 session.assignedIp,
 session.routerName,
 ].some((field) => field.toLowerCase().includes(query));
 });
 }, [items, tab, search]);

 async function handleDisconnect(session: LiveSessionItem) {
 setDisconnectingId(session.id);
 try {
 // RFC 5176 CoA keyed on RADIUS username: Hotspot rows record the client
 // MAC in radacct.username, PPPoE rows the account username. Send the
 // real MAC when present, else the subscriber code — never just a name.
 const radUsername =
 session.deviceMac && session.deviceMac !== "—"
 ? session.deviceMac
 : session.subscriberCode;
 const result = await disconnectLiveSession(
 radUsername,
 session.routerManagementIp
 );
 if (result.success) {
 toast.success(result.message);
 setItems((prev) => prev.filter((s) => s.id !== session.id));
 } else {
 toast.error(result.message);
 }
 } finally {
 setDisconnectingId(null);
 }
 }

 return (
 <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-lg">
 {/* Toolbar */}
 <div className="flex flex-col gap-3 border-b border-border p-4 sm:flex-row sm:items-center sm:justify-between">
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
 active
 ? "bg-zinc-100 text-zinc-900"
 : "text-muted-foreground hover:text-accent-foreground"
 )}
 >
 {label}
 <span
 className={cn(
 "ml-1.5 font-mono",
 active ? "text-muted-foreground" : "text-muted-foreground"
 )}
 >
 {counts[key]}
 </span>
 </button>
 );
 })}
 </div>

 <div className="relative">
 <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
 <input
 value={search}
 onChange={(e) => setSearch(e.target.value)}
 placeholder="Search name, MAC, IP..."
 className="h-8 w-56 rounded-lg border border-border bg-muted pl-8 pr-3 text-xs text-zinc-200 outline-none transition-colors placeholder:text-zinc-600 focus:border-zinc-500"
 />
 </div>
 </div>

 {/* Table */}
 <div className="overflow-x-auto">
 <table className="w-full min-w-[920px] text-left">
 <thead>
 <tr className="border-b border-border">
 <th className="px-4 py-3 text-[11px] font-mono uppercase tracking-wider text-muted-foreground">
 Subscriber
 </th>
 <th className="px-4 py-3 text-[11px] font-mono uppercase tracking-wider text-muted-foreground">
 Traffic
 </th>
 <th className="px-4 py-3 text-[11px] font-mono uppercase tracking-wider text-muted-foreground">
 Device
 </th>
 <th className="px-4 py-3 text-[11px] font-mono uppercase tracking-wider text-muted-foreground">
 Router
 </th>
 <th className="px-4 py-3 text-[11px] font-mono uppercase tracking-wider text-muted-foreground">
 Duration
 </th>
 <th className="px-4 py-3 text-[11px] font-mono uppercase tracking-wider text-muted-foreground">
 Expiry
 </th>
 <th className="px-4 py-3 text-right text-[11px] font-mono uppercase tracking-wider text-muted-foreground">
 Action
 </th>
 </tr>
 </thead>
 <tbody>
 {filtered.length === 0 ? (
 <tr>
 <td
 colSpan={7}
 className="px-4 py-14 text-center text-sm text-muted-foreground"
 >
 No live sessions match your filters.
 </td>
 </tr>
 ) : (
 filtered.map((session) => (
 <tr
 key={session.id}
 className="border-b border-border transition-colors hover:bg-accent"
 >
 {/* Subscriber */}
 <td className="px-4 py-3">
 <div className="flex items-center gap-2">
 <p className="max-w-[140px] truncate text-sm font-medium text-foreground">
 {session.subscriberCode}
 </p>
 <ProtocolBadge protocol={session.protocol} />
 </div>
 <p className="mt-0.5 max-w-[160px] truncate text-[11px] text-muted-foreground">
 {session.subscriberName || "—"}
 </p>
 </td>

 {/* Traffic */}
 <td className="px-4 py-3">
 <p className="whitespace-nowrap font-mono text-sm font-semibold text-amber-400">
 {session.downloadFormatted} · {session.uploadFormatted}
 </p>
 <p className="text-[11px] text-muted-foreground">down · up</p>
 </td>

 {/* Device */}
 <td className="px-4 py-3">
 <p className="font-mono text-sm text-zinc-200">
 {session.deviceMac}
 </p>
 <p className="font-mono text-[11px] text-muted-foreground">
 {session.assignedIp}
 </p>
 </td>

 {/* Router */}
 <td className="px-4 py-3">
 <p className="max-w-[160px] truncate text-sm text-zinc-200">
 {session.routerName}
 </p>
 <p className="font-mono text-[11px] text-muted-foreground">
 {session.routerManagementIp || "—"}
 </p>
 </td>

 {/* Duration */}
 <td className="px-4 py-3">
 <p className="whitespace-nowrap text-sm text-zinc-200">
 {session.onlineDurationFormatted}
 </p>
 </td>

 {/* Expiry */}
 <td className="px-4 py-3">
 <p className="whitespace-nowrap text-xs text-muted-foreground">
 {session.expiryFormatted}
 </p>
 </td>

 {/* Action */}
 <td className="px-4 py-3 text-right">
 {session.isFallback ? (
 <span className="inline-flex h-8 items-center rounded-md px-2.5 text-[11px] font-medium text-muted-foreground">
 DEMO ROW
 </span>
 ) : (
 <button
 type="button"
 disabled={disconnectingId === session.id}
 onClick={() => handleDisconnect(session)}
 className="inline-flex h-8 items-center gap-1.5 rounded-md px-2.5 text-xs font-medium text-rose-400 transition-colors hover:bg-rose-500/10 hover:text-rose-300 disabled:pointer-events-none disabled:opacity-50"
 >
 {disconnectingId === session.id ? (
 <Loader2 className="h-3.5 w-3.5 animate-spin" />
 ) : (
 <Power className="h-3.5 w-3.5" />
 )}
 Disconnect
 </button>
 )}
 </td>
 </tr>
 ))
 )}
 </tbody>
 </table>
 </div>

 <div className="flex items-center justify-between border-t border-border px-4 py-2.5 text-xs text-muted-foreground">
 <span>
 Showing {filtered.length} of {items.length} sessions
 </span>
 <span className="font-mono">RFC 5176 CoA · LIVE</span>
 </div>
 </div>
 );
}