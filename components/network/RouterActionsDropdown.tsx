"use client";

import { useCallback, useLayoutEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import {
  MoreHorizontal,
  Activity,
  Network,
  Users,
  ExternalLink,
  RotateCw,
  RefreshCw,
  Trash2,
} from "lucide-react";
import { toast } from "sonner";
import { executeRouterAction, deleteNetworkDevice } from "@/actions/network";
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

const MENU_WIDTH = 232; // px; keeps right-edge alignment consistent

/**
 * The "•••" command menu for a NAS/router table row.
 *
 * The menu is rendered through a React Portal into `document.body` with
 * `position: fixed` viewport coordinates. Because it no longer lives inside
 * the `<table>`/`<td>` DOM tree, opening it never expands a row, alters column
 * widths, or triggers scrollbar jitter (the classic `overflow-x-auto` +
 * `position:absolute` table distortion bug). It closes on outside click,
 * scroll, and Escape.
 *
 * Commands: Live Hardware Vitals / Interfaces / Sessions → telemetry drawer;
 * Launch WinBox Tunnel → external link; Refresh / Reboot / Delete → server
 * actions (session auth — never localStorage).
 */
export function RouterActionsDropdown({
  router,
  onRouterDeleted,
}: {
  router: RouterActionsRow;
  onRouterDeleted?: () => void | Promise<void>;
}) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [coords, setCoords] = useState<{ top: number; left: number } | null>(null);
  const [drawerTab, setDrawerTab] = useState<Tab | null>(null);
  const [busyAction, setBusyAction] = useState<RouterAction | "DELETE" | null>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const didClampRef = useRef(false);

  const numericId = Number(router.id);
  const winboxHref = router.winboxTunnelAddress
    ? `http://${router.winboxTunnelAddress}`
    : router.managementIp
      ? `http://${router.managementIp}:8291`
      : null;

  const closeMenu = useCallback(() => setMenuOpen(false), []);

  const toggleMenu = () => {
    if (menuOpen || !buttonRef.current) {
      closeMenu();
      return;
    }
    const rect = buttonRef.current.getBoundingClientRect();
    const left = rect.right - MENU_WIDTH;
    didClampRef.current = false;
    setCoords({ top: rect.bottom + 6, left });
    setMenuOpen(true);
  };

  // After the menu renders (portal), clamp horizontal coords so it stays on screen.
  // Runs once per open (guarded by didClampRef) so coords updates don't loop.
  useLayoutEffect(() => {
    if (!menuOpen || !coords || !menuRef.current) return;
    if (didClampRef.current) return;
    const menuRect = menuRef.current.getBoundingClientRect();
    let nextLeft = coords.left;
    if (menuRect.right > window.innerWidth - 8) {
      nextLeft -= menuRect.right - window.innerWidth + 8;
    }
    if (nextLeft < 8) nextLeft = 8;
    if (nextLeft !== coords.left) {
      didClampRef.current = true;
      setCoords((c) => (c ? { ...c, left: nextLeft } : c));
    }
    didClampRef.current = true;
  }, [menuOpen, coords]);

  // Close on outside click, scroll (capture) and Escape — the portal lives in
  // body, so these must be on window, not the container.
  useLayoutEffect(() => {
    if (!menuOpen) return;
    const onPointerDown = (event: PointerEvent) => {
      if (buttonRef.current?.contains(event.target as Node)) return;
      if (menuRef.current?.contains(event.target as Node)) return;
      closeMenu();
    };
    const onScroll = () => closeMenu();
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") closeMenu();
    };
    window.addEventListener("pointerdown", onPointerDown);
    window.addEventListener("scroll", onScroll, true);
    window.addEventListener("keydown", onKey);
    return () => {
      window.removeEventListener("pointerdown", onPointerDown);
      window.removeEventListener("scroll", onScroll, true);
      window.removeEventListener("keydown", onKey);
    };
  }, [menuOpen, closeMenu]);

  const openDrawer = (tab: Tab) => {
    setDrawerTab(tab);
    closeMenu();
  };

  const runAction = async (action: RouterAction) => {
    if (!Number.isFinite(numericId) || numericId <= 0) {
      toast.error("This row is a local placeholder — no backend router id to act on.");
      closeMenu();
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
      closeMenu();
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
      closeMenu();
    }
  };

  const handleDelete = async () => {
    if (!Number.isFinite(numericId) || numericId <= 0) {
      toast.error("This row is a local placeholder — no backend device id to delete.");
      closeMenu();
      return;
    }

    const confirmed = window.confirm(
      `Are you sure you want to delete ${router.name}? This will purge its credentials and allow fresh re-onboarding.`
    );
    if (!confirmed) {
      closeMenu();
      return;
    }

    setBusyAction("DELETE");
    try {
      const res = await deleteNetworkDevice(numericId);
      if (res.success) {
        toast.success(res.message || `${router.name} deleted successfully.`);
        closeMenu();
        setDrawerTab(null);
        await onRouterDeleted?.();
      } else {
        toast.error(res.message || `Failed to delete ${router.name}.`);
        closeMenu();
      }
    } catch {
      toast.error("Unexpected error deleting router.");
    } finally {
      setBusyAction(null);
    }
  };

  const menu = menuOpen && coords ? (
    <div
      ref={menuRef}
      role="menu"
      aria-label={`Actions for ${router.name}`}
      style={{
        position: "fixed",
        top: Number(coords.top),
        left: Number(coords.left),
        width: MENU_WIDTH,
        zIndex: 9999,
      }}
      className="rounded-xl border border-border bg-popover shadow-2xl py-1 text-sm text-popover-foreground"
      onClick={(event) => event.stopPropagation()}
    >
      <button
        type="button"
        role="menuitem"
        onClick={() => openDrawer("vitals")}
        className="flex items-center w-full px-4 py-2.5 hover:bg-muted hover:text-foreground gap-2.5 transition text-left"
      >
        <Activity className="h-4 w-4 text-emerald-500" />
        Live Hardware Vitals
      </button>

      <button
        type="button"
        role="menuitem"
        onClick={() => openDrawer("interfaces")}
        className="flex items-center w-full px-4 py-2.5 hover:bg-muted hover:text-foreground gap-2.5 transition text-left"
      >
        <Network className="h-4 w-4 text-blue-500" />
        Interfaces &amp; Live Traffic
      </button>

      <button
        type="button"
        role="menuitem"
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
          role="menuitem"
          className="flex items-center w-full px-4 py-2.5 hover:bg-muted hover:text-foreground gap-2.5 transition text-left text-purple-500"
        >
          <ExternalLink className="h-4 w-4" />
          Launch WinBox Tunnel
        </a>
      )}

      <button
        type="button"
        role="menuitem"
        disabled={busyAction === "REFRESH"}
        onClick={() => void runAction("REFRESH")}
        className="flex items-center w-full px-4 py-2.5 hover:bg-muted hover:text-foreground gap-2.5 transition text-left disabled:opacity-50"
      >
        <RefreshCw className={`h-4 w-4 ${busyAction === "REFRESH" ? "animate-spin" : ""}`} />
        Refresh Telemetry
      </button>

      <button
        type="button"
        role="menuitem"
        disabled={busyAction === "REBOOT"}
        onClick={handleReboot}
        className="flex items-center w-full px-4 py-2.5 hover:bg-red-950/20 text-red-500 gap-2.5 transition text-left disabled:opacity-50"
      >
        <RotateCw className={`h-4 w-4 ${busyAction === "REBOOT" ? "animate-spin" : ""}`} />
        Reboot Device
      </button>

      <div className="h-px bg-border my-1" />

      <button
        type="button"
        role="menuitem"
        disabled={busyAction === "DELETE"}
        onClick={() => void handleDelete()}
        className="flex items-center w-full px-4 py-2.5 hover:bg-red-950/20 text-red-500 gap-2.5 transition text-left disabled:opacity-50 text-xs font-medium"
      >
        <Trash2 className={`h-4 w-4 ${busyAction === "DELETE" ? "animate-pulse" : ""}`} />
        {busyAction === "DELETE" ? "Deleting..." : "Delete Router"}
      </button>
    </div>
  ) : null;

  return (
    <>
      <button
        ref={buttonRef}
        type="button"
        aria-label="Router actions"
        aria-haspopup="menu"
        aria-expanded={menuOpen}
        onClick={toggleMenu}
        className="p-1.5 text-muted-foreground hover:text-foreground rounded-lg hover:bg-muted transition"
      >
        <MoreHorizontal className="h-4 w-4" />
      </button>

      {/* Portal into document.body — keeps the menu out of the table's DOM
          bounding box so opening it never distorts table layout/scrollbars. */}
      {typeof document !== "undefined" && menu
        ? createPortal(menu, document.body)
        : null}

      {drawerTab && (
        <RouterTelemetryDrawer
          router={router}
          defaultTab={drawerTab}
          onClose={() => setDrawerTab(null)}
        />
      )}
    </>
  );
}