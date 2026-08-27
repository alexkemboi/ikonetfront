"use client";

import { useMemo, useState } from "react";
import {
 ArrowUpDown,
 Filter,
 MoreHorizontal,
 Search,
 Tv,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { SubscriberItem } from "@/lib/types/subscribers";

const TABS = [
 { key: "ALL", label: "All" },
 { key: "HOTSPOT", label: "Hotspot" },
 { key: "PPPOE", label: "PPPoE" },
 { key: "BINDINGS", label: "Bindings" },
] as const;

type TabKey = (typeof TABS)[number]["key"];

function initials(name: string): string {
 const parts = name.trim().split(/\s+/).filter(Boolean);
 if (parts.length === 0) return "?";
 const first = parts[0]?.[0] ?? "?";
 const last = parts.length > 1 ? (parts[parts.length - 1]?.[0] ?? "") : "";
 return `${first}${last}`.toUpperCase();
}

function planDetail(subscriber: SubscriberItem): string {
 const parts: string[] = [];
 if (subscriber.planSpeed) parts.push(subscriber.planSpeed);
 if (subscriber.planPrice > 0) parts.push(`Ksh ${subscriber.planPrice}`);
 return parts.join(" · ") || "—";
}

export function SubscriberDataTable({
 subscribers,
}: {
 subscribers: SubscriberItem[];
}) {
 const [tab, setTab] = useState<TabKey>("ALL");
 const [search, setSearch] = useState("");

 const counts = useMemo(
 () => ({
 ALL: subscribers.length,
 HOTSPOT: subscribers.filter((s) => s.type === "HOTSPOT").length,
 PPPOE: subscribers.filter((s) => s.type === "PPPOE").length,
 BINDINGS: subscribers.filter((s) => s.type === "BINDING").length,
 }),
 [subscribers]
 );

 const filtered = useMemo(() => {
 const query = search.trim().toLowerCase();
 return subscribers.filter((subscriber) => {
 const matchesTab =
 tab === "ALL" ||
 (tab === "BINDINGS"
 ? subscriber.type === "BINDING"
 : subscriber.type === tab);
 if (!matchesTab) return false;
 if (!query) return true;
 return [
 subscriber.fullName,
 subscriber.code,
 subscriber.phone,
 subscriber.macAddress ?? "",
 subscriber.ipAddress ?? "",
 subscriber.planName,
 ].some((field) => field.toLowerCase().includes(query));
 });
 }, [subscribers, tab, search]);

 return (
 <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-lg">
 {/* Toolbar */}
 <div className="flex flex-col gap-3 border-b border-border p-4 sm:flex-row sm:items-center sm:justify-between">
 {/* Segmented tabs */}
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

 {/* Search + filter */}
 <div className="flex items-center gap-2">
 <div className="relative">
 <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
 <input
 value={search}
 onChange={(e) => setSearch(e.target.value)}
 placeholder="Search name, code, MAC, IP..."
 className="h-8 w-56 rounded-lg border border-border bg-muted pl-8 pr-3 text-xs text-zinc-200 outline-none transition-colors placeholder:text-zinc-600 focus:border-zinc-500"
 />
 </div>
 <Button
 variant="outline"
 size="sm"
 className="h-8 gap-1.5 border-border bg-muted text-xs text-muted-foreground hover:text-accent-foreground"
 >
 <Filter className="h-3.5 w-3.5" />
 Filter
 </Button>
 </div>
 </div>

 {/* Table */}
 <div className="overflow-x-auto">
 <table className="w-full min-w-[900px] text-left">
 <thead>
 <tr className="border-b border-border">
 <th className="px-4 py-3 text-[11px] font-mono uppercase tracking-wider text-muted-foreground">
 <span className="inline-flex items-center gap-1">
 <ArrowUpDown className="h-3 w-3" />
 Contact
 </span>
 </th>
 <th className="px-4 py-3 text-[11px] font-mono uppercase tracking-wider text-muted-foreground">
 Phone {`&`} Email
 </th>
 <th className="px-4 py-3 text-[11px] font-mono uppercase tracking-wider text-muted-foreground">
 Plan
 </th>
 <th className="px-4 py-3 text-[11px] font-mono uppercase tracking-wider text-muted-foreground">
 Expiry
 </th>
 <th className="px-4 py-3 text-[11px] font-mono uppercase tracking-wider text-muted-foreground">
 Status
 </th>
 <th className="px-4 py-3 text-[11px] font-mono uppercase tracking-wider text-muted-foreground">
 NAS
 </th>
 <th className="w-12 px-4 py-3 text-right text-[11px] font-mono uppercase tracking-wider text-muted-foreground">
 Actions
 </th>
 </tr>
 </thead>
 <tbody>
 {filtered.length === 0 ? (
 <tr>
 <td colSpan={7} className="px-4 py-14 text-center text-sm text-muted-foreground">
 No subscribers match your filters.
 </td>
 </tr>
 ) : (
 filtered.map((subscriber) => (
 <tr
 key={subscriber.id}
 className="border-b border-border transition-colors hover:bg-accent"
 >
 {/* Contact */}
 <td className="px-4 py-3">
 <div className="flex items-center gap-3">
 <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-zinc-700 to-zinc-800 text-[11px] font-bold text-zinc-200">
 {initials(subscriber.fullName)}
 </div>
 <div className="min-w-0">
 <div className="flex flex-wrap items-center gap-2">
 <p className="truncate text-sm font-medium text-foreground">
 {subscriber.fullName}
 </p>
 {subscriber.deviceType === "SMART_TV" && (
 <span className="inline-flex items-center gap-1 rounded-full border border-cyan-500/20 bg-cyan-500/10 px-1.5 py-0.5 text-[10px] font-medium text-cyan-300">
 <Tv className="h-3 w-3" />
 TV
 </span>
 )}
 </div>
 <p className="truncate font-mono text-[11px] text-muted-foreground">
 {subscriber.code}
 {subscriber.macAddress
 ? ` · ${subscriber.macAddress}`
 : ""}
 </p>
 </div>
 </div>
 </td>

 {/* Phone & Email */}
 <td className="px-4 py-3">
 <p className="font-mono text-sm text-zinc-200">
 {subscriber.phone}
 </p>
 <p className="max-w-[180px] truncate text-[11px] text-muted-foreground">
 {subscriber.email || "—"}
 </p>
 </td>

 {/* Plan */}
 <td className="px-4 py-3">
 <p className="max-w-[160px] truncate text-sm text-zinc-200">
 {subscriber.planName}
 </p>
 <p className="text-[11px] text-muted-foreground">
 {planDetail(subscriber)}
 </p>
 </td>

 {/* Expiry */}
 <td className="px-4 py-3">
 <p
 className={cn(
 "text-sm",
 subscriber.isExpiringToday
 ? "font-medium text-amber-400"
 : "text-muted-foreground"
 )}
 >
 {subscriber.expiryText}
 </p>
 </td>

 {/* Status */}
 <td className="px-4 py-3">
 <span
 className={cn(
 "inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[11px] font-medium",
 subscriber.status === "ONLINE"
 ? "bg-emerald-500/10 text-emerald-400"
 : "bg-secondary text-muted-foreground"
 )}
 >
 <span
 className={cn(
 "h-1.5 w-1.5 rounded-full",
 subscriber.status === "ONLINE"
 ? "animate-pulse bg-emerald-400"
 : "bg-zinc-600"
 )}
 />
 {subscriber.status}
 </span>
 </td>

 {/* NAS */}
 <td className="px-4 py-3">
 <p className="max-w-[150px] truncate text-sm text-muted-foreground">
 {subscriber.nasName || "—"}
 </p>
 </td>

 {/* Actions */}
 <td className="px-4 py-3 text-right">
 <Button
 variant="ghost"
 size="icon-sm"
 className="text-muted-foreground hover:text-accent-foreground"
 aria-label={`Actions for ${subscriber.fullName}`}
 >
 <MoreHorizontal className="h-4 w-4" />
 </Button>
 </td>
 </tr>
 ))
 )}
 </tbody>
 </table>
 </div>

 <div className="flex items-center justify-between border-t border-border px-4 py-2.5 text-xs text-muted-foreground">
 <span>
 Showing {filtered.length} of {subscribers.length} subscribers
 </span>
 <span className="font-mono">LIVE DATA</span>
 </div>
 </div>
 );
}