"use client";

import { useRef, useState } from "react";
import {
  MoreHorizontal,
  Activity,
  Network,
  Users,
  ExternalLink,
  RotateCw,
  RefreshCw,
} from "lucide-react";
import { toast } from "sonner";
import { executeRouterAction } from "@/actions/network";
import { RouterTelemetryDrawer } from "./RouterTelemetryDrawer";
import type { RouterAction } from "@/lib/types/network-router";

export interface RouterActionsRow {
  /** Router/device id (numeric where onboarded). */
  id: string;
  name: string;
  model?: string;
  status?: string;
  managementIp?: string;
  vpnIp?: string;
  winboxTunnelAddress?: string;
}

type Tab = "vitals" | "interfaces" | "sessions";

/**
 * The "•••" command menu for a NAS/router table row.
 *
 * Four command surfaces:
 *   1. Live Hardware Vitals      → telemetry drawer (SSE vitals)
 *   2. Interfaces & Live Traffic → telemetry drawer (interfaces tab)
 *   3. Active Subscriber Sessions→ telemetry drawer (sessions tab)
 *   4. Launch WinBox Tunnel      → external link
 *   `── Refresh` (server action) `── Reboot` (server action, confirm)
 *
 * Server actions run through the same `executeRouterAction` used elsewhere so
 * auth is via the server-side session (never localStorage), and the backend's
 * `executionStatus`/`message` is surfaced verbatim (e.g. "UNMANAGED" when no
 * NetworkCredential is attached).
 */
export function RouterActionsDropdown({ router }: { router: RouterActionsRow }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [drawerTab, setDrawerTab] = useState<Tab | null>(null);
  const [busyAction, setBusyAction] = useState<RouterAction | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const numericId = Number(router.id);
  const winboxHref = router.winboxTunnelAddress
    ? `http://${router.winboxTunnelAddress}`
    : router.managementIp
      ? `http://${router.managementIp}:8291`
      : null;

  const openDrawer = (tab: Tab) => {
    setDrawerTab(tab);
    setMenuOpen(false);
  };

  const runAction = async (action: RouterAction) => {
    if (!Number.isFinite(numericId) || numericId <= 0) {
      toast.error("This row is a local placeholder — no backend router id to act on.");
      setMenuOpen(false);
      return;
    }
    setBusyAction(action);
    try {
      const res = await executeRouterAction(numericId, { action });
      if (res.success && res.data) {
        toast[res.data.executionStatus === "FAILED" ? "error" : "success"](
          res.data.message || `${action} executed on ${router.name}`
        );
      } else {
        toast.error(res.message || `Failed to execute ${action}.`);
      }
    } catch {
      toast.error("Unexpected error executing router action.");
    } finally {
      setBusyAction(null);
      setMenuOpen(false);
    }
  };

  const handleReboot = () => {
    if (
      window.confirm(
        `Are you sure you want to reboot ${router.name}? All active PPPoE and Hotspot sessions will temporarily drop.`
      )
    ) {
      void runAction("REBOOT");
    } else {
      setMenuOpen(false);
    }
  };

  return (
    <div className="relative inline-block text-left" ref={containerRef}>
      <button
        type="button"
        aria-label="Router actions"
        onClick={() => setMenuOpen((o) => !o)}
        className="p-1.5 text-muted-foreground hover:text-foreground rounded-lg hover:bg-muted transition"
      >
        <MoreHorizontal className="h-4 w-4" />
      </button>

      {menuOpen && (
        <div className="absolute right-0 z-50 mt-2 w-60 rounded-xl border border-border bg-popover shadow-2xl py-1 text-sm text-popover-foreground">
          <button
            type="button"
            onClick={() => openDrawer("vitals")}
            className="flex items-center w-full px-4 py-2.5 hover:bg-muted hover:text-foreground gap-2.5 transition text-left"
          >
            <Activity className="h-4 w-4 text-emerald-500" />
            Live Hardware Vitals
          </button>

          <button
            type="button"
            onClick={() => openDrawer("interfaces")}
            className="flex items-center w-full px-4 py-2.5 hover:bg-muted hover:text-foreground gap-2.5 transition text-left"
          >
            <Network className="h-4 w-4 text-blue-500" />
            Interfaces &amp; Live Traffic
          </button>

          <button
            type="button"
            onClick={() => openDrawer("sessions")}
            className="flex items-center w-full px-4 py-2.5 hover:bg-muted hover:text-foreground gap-2.5 transition text-left"
          >
            <Users className="h-4 w-4 text-amber-500" />
            Active Subscriber Sessions
          </button>

          <div className="h-px bg-border my-1" />

          {winboxHref && (
            <a
              href={winboxHref}
              target="_blank"
              rel="noreferrer"
              className="flex items-center w-full px-4 py-2.5 hover:bg-muted hover:text-foreground gap-2.5 transition text-left text-purple-500"
            >
              <ExternalLink className="h-4 w-4" />
              Launch WinBox Tunnel
            </a>
          )}

          <button
            type="button"
            disabled={busyAction === "REFRESH"}
            onClick={() => void runAction("REFRESH")}
            className="flex items-center w-full px-4 py-2.5 hover:bg-muted hover:text-foreground gap-2.5 transition text-left disabled:opacity-50"
          >
            <RefreshCw className={`h-4 w-4 ${busyAction === "REFRESH" ? "animate-spin" : ""}`} />
            Refresh Telemetry
          </button>

          <button
            type="button"
            disabled={busyAction === "REBOOT"}
            onClick={handleReboot}
            className="flex items-center w-full px-4 py-2.5 hover:bg-red-950/20 text-red-500 gap-2.5 transition text-left disabled:opacity-50"
          >
            <RotateCw className={`h-4 w-4 ${busyAction === "REBOOT" ? "animate-spin" : ""}`} />
            Reboot Device
          </button>
        </div>
      )}

      {drawerTab && (
        <RouterTelemetryDrawer
          router={router}
          defaultTab={drawerTab}
          onClose={() => setDrawerTab(null)}
        />
      )}
    </div>
  );
}