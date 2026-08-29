"use client";

import { useMemo, useState } from "react";
import { Power, Search } from "lucide-react";
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
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to disconnect");
    }
  }

  return (
    <div className="overflow-hidden rounded-2xl border border-[#262626] bg-[#161616] shadow-lg">
      {/* Toolbar */}
      <div className="flex flex-col gap-3 border-b border-[#262626] p-4 sm:flex-row sm:items-center sm:justify-between">
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
                    : "text-zinc-400 hover:text-zinc-100"
                )}
              >
                {label}
                <span
                  className={cn(
                    "ml-1.5 font-mono",
                    active ? "text-zinc-600" : "text-zinc-500"
                  )}
                >
                  {counts[key]}
                </span>
              </button>
            );
          })}
        </div>

        <div className="relative">
          <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-zinc-500" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search name, MAC, IP..."
            className="h-8 w-56 rounded-lg border border-[#262626] bg-[#121212] pl-8 pr-3 text-xs text-zinc-200 outline-none transition-colors placeholder:text-zinc-600 focus:border-zinc-500"
          />
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full min-w-[920px] text-left">
          <thead>
            <tr className="border-b border-[#262626]">
              <th className="px-4 py-3 text-[11px] font-mono uppercase tracking-wider text-zinc-500">
                Subscriber
              </th>
              <th className="px-4 py-3 text-[11px] font-mono uppercase tracking-wider text-zinc-500">
                Traffic
              </th>
              <th className="px-4 py-3 text-[11px] font-mono uppercase tracking-wider text-zinc-500">
                Device
              </th>
              <th className="px-4 py-3 text-[11px] font-mono uppercase tracking-wider text-zinc-500">
                Router
              </th>
              <th className="px-4 py-3 text-[11px] font-mono uppercase tracking-wider text-zinc-500">
                Duration
              </th>
              <th className="px-4 py-3 text-[11px] font-mono uppercase tracking-wider text-zinc-500">
                Expiry
              </th>
              <th className="px-4 py-3 text-right text-[11px] font-mono uppercase tracking-wider text-zinc-500">
                Action
              </th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr>
                <td
                  colSpan={7}
                  className="px-4 py-14 text-center text-sm text-zinc-500"
                >
                  No live sessions match your filters.
                </td>
              </tr>
            ) : (
              filtered.map((session) => (
                <tr
                  key={session.id}
                  className="border-b border-[#1c1c1c] transition-colors hover:bg-[#141414]"
                >
                  {/* Subscriber */}
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <p className="max-w-[140px] truncate text-sm font-medium text-white">
                        {session.subscriberCode}
                      </p>
                      <ProtocolBadge protocol={session.protocol} />
                    </div>
                    <p className="mt-0.5 max-w-[160px] truncate text-[11px] text-zinc-500">
                      {session.subscriberName || "—"}
                    </p>
                  </td>

                  {/* Traffic */}
                  <td className="px-4 py-3">
                    <p className="whitespace-nowrap font-mono text-sm font-semibold text-amber-400">
                      {session.downloadFormatted} · {session.uploadFormatted}
                    </p>
                    <p className="text-[11px] text-zinc-600">down · up</p>
                  </td>

                  {/* Device */}
                  <td className="px-4 py-3">
                    <p className="font-mono text-sm text-zinc-200">
                      {session.deviceMac}
                    </p>
                    <p className="font-mono text-[11px] text-zinc-500">
                      {session.assignedIp}
                    </p>
                  </td>

                  {/* Router */}
                  <td className="px-4 py-3">
                    <p className="max-w-[160px] truncate text-sm text-zinc-200">
                      {session.routerName}
                    </p>
                    <p className="font-mono text-[11px] text-zinc-500">
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
                    <p className="whitespace-nowrap text-xs text-zinc-400">
                      {session.expiryFormatted}
                    </p>
                  </td>

                  {/* Action */}
                  <td className="px-4 py-3 text-right">
                    {session.isFallback ? (
                      <span className="inline-flex h-8 items-center rounded-md px-2.5 text-[11px] font-medium text-zinc-600">
                        DEMO ROW
                      </span>
                    ) : (
                      <button
                        type="button"
                        disabled // Pending backend RADIUS CoA HTTP adapter (BE-AAA-043)
                        title="Disconnect is disabled — pending the backend CoA adapter (BE-AAA-043)"
                        onClick={() => handleDisconnect(session)}
                        className="inline-flex h-8 items-center gap-1.5 rounded-md px-2.5 text-xs font-medium text-rose-400/60 transition-colors disabled:pointer-events-none disabled:opacity-50"
                      >
                        <Power className="h-3.5 w-3.5" />
                        Disconnect (pending)
                      </button>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <div className="flex items-center justify-between border-t border-[#262626] px-4 py-2.5 text-xs text-zinc-500">
        <span>
          Showing {filtered.length} of {items.length} sessions
        </span>
        <span className="font-mono">RFC 5176 CoA · LIVE</span>
      </div>
    </div>
  );
}