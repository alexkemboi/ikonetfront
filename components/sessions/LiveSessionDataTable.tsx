"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Power, Search } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { disconnectLiveSession } from "@/actions/sessions";
import type { LiveSessionItem } from "@/lib/types/sessions";
import { formatBytes } from "@/lib/utils/formatBytes";

const TABS = [
 { key: "ALL", label: "All" },
 { key: "PPPOE", label: "PPPoE" },
 { key: "HOTSPOT", label: "Hotspot" },
 { key: "TV_MAB", label: "TV" },
] as const;

type TabKey = (typeof TABS)[number]["key"];

function ProtocolBadge({ protocol }: { protocol: LiveSessionItem["protocol"] }) {
 return (
 <span
 className={cn(
 "inline-flex items-center rounded-full px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide",
 protocol === "PPPoE"
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
  page,
  totalPages,
  totalElements,
  size,
  refreshIntervalSeconds,
}: {
 sessions: LiveSessionItem[];
  page: number;
  totalPages: number;
  totalElements: number;
  size: number;
  refreshIntervalSeconds: number;
}) {
  const router = useRouter();
  const items = sessions;
  const [tab, setTab] = useState<TabKey>("ALL");
  const [search, setSearch] = useState("");

    useEffect(() => {
      const timer = setInterval(() => router.refresh(), refreshIntervalSeconds * 1000);
      return () => clearInterval(timer);
    }, [refreshIntervalSeconds, router]);

 const counts = useMemo(
 () => ({
 ALL: items.length,
 PPPOE: items.filter((s) => s.protocol === "PPPoE").length,
 HOTSPOT: items.filter((s) => s.protocol === "Hotspot").length,
 TV_MAB: items.filter((s) => s.protocol === "TV_MAB").length,
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
        router.refresh();
      } else {
        toast.error(result.message);
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to disconnect");
    }
  }

 return (
 <div className="overflow-hidden rounded-lg border border-border bg-card">
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
 "ml-1.5 font-sans tabular-nums",
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
              <th className="px-4 py-3 text-[11px] font-sans tabular-nums uppercase tracking-wider text-muted-foreground">
 Subscriber
 </th>
 <th className="px-4 py-3 text-[11px] font-sans tabular-nums uppercase tracking-wider text-muted-foreground">
 Traffic
 </th>
 <th className="px-4 py-3 text-[11px] font-sans tabular-nums uppercase tracking-wider text-muted-foreground">
 Device
 </th>
 <th className="px-4 py-3 text-[11px] font-sans tabular-nums uppercase tracking-wider text-muted-foreground">
 Router
 </th>
 <th className="px-4 py-3 text-[11px] font-sans tabular-nums uppercase tracking-wider text-muted-foreground">
 Duration
 </th>
 <th className="px-4 py-3 text-[11px] font-sans tabular-nums uppercase tracking-wider text-muted-foreground">Status</th>
 <th className="px-4 py-3 text-[11px] font-sans tabular-nums uppercase tracking-wider text-muted-foreground">Expiry</th>
 <th className="px-4 py-3 text-right text-[11px] font-sans tabular-nums uppercase tracking-wider text-muted-foreground">
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
                        className={`border-b border-border transition-colors hover:bg-accent ${session.online ? "" : "opacity-60"}`}
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
 <p className="whitespace-nowrap font-sans tabular-nums text-sm font-semibold text-amber-400">
 {formatBytes(session.downloadBytes)} · {formatBytes(session.uploadBytes)}
 </p>
 <p className="text-[11px] text-muted-foreground">down · up</p>
 </td>

 {/* Device */}
 <td className="px-4 py-3">
 <p className="font-sans tabular-nums text-sm text-zinc-200">
 {session.deviceMac}
 </p>
 <p className="font-sans tabular-nums text-[11px] text-muted-foreground">
 {session.assignedIp}
 </p>
 </td>

 {/* Router */}
 <td className="px-4 py-3">
 <p className="max-w-[160px] truncate text-sm text-zinc-200">
 {session.routerName}
 </p>
 <p className="font-sans tabular-nums text-[11px] text-muted-foreground">
 {session.routerManagementIp || "—"}
 </p>
 </td>

 {/* Duration */}
 <td className="px-4 py-3">
 <p className="whitespace-nowrap text-sm text-zinc-200">
 {session.onlineDurationFormatted}
 </p>
 </td>

 {/* Status */}
 <td className="px-4 py-3"><span className={session.online ? "text-emerald-600" : "text-amber-700"}>{session.online ? "Online" : session.lastSeenAt ? "Lost contact" : "Paid, not connected"}</span></td>

 {/* Expiry */}
 <td className="px-4 py-3">
 <p className="whitespace-nowrap text-xs text-muted-foreground">
 {session.expiryFormatted}
 </p>
 </td>

                  {/* Action */}
                  <td className="px-4 py-3 text-right">
                    <button
                      type="button"
                      disabled
                      title="Disconnect is unavailable until the backend CoA HTTP endpoint is deployed."
                      onClick={() => handleDisconnect(session)}
                      className="inline-flex h-8 items-center gap-1.5 rounded-md px-2.5 text-xs font-medium text-rose-400/60 transition-colors disabled:pointer-events-none disabled:opacity-50"
                    >
                      <Power className="h-3.5 w-3.5" />
                      Disconnect unavailable
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

 <div className="flex items-center justify-between border-t border-border px-4 py-2.5 text-xs text-muted-foreground">
 <span>Showing {page * size + 1}-{Math.min(page * size + items.length, totalElements)} of {totalElements} sessions</span>
 <div className="flex items-center gap-2">
 <button type="button" disabled={page <= 0} onClick={() => router.push(`?page=${page - 1}`)} className="rounded border px-2 py-1 disabled:opacity-40">Previous</button>
 <span className="font-sans tabular-nums">{page + 1} / {Math.max(1, totalPages)}</span>
 <button type="button" disabled={page + 1 >= totalPages} onClick={() => router.push(`?page=${page + 1}`)} className="rounded border px-2 py-1 disabled:opacity-40">Next</button>
 </div>
 </div>
 </div>
 );
}