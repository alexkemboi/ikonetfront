"use client";

import { useCallback, useLayoutEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useRouter } from "next/navigation";
import {
  MoreHorizontal,
  Activity,
  Network,
  Users,
  ExternalLink,
  RotateCw,
  RefreshCw,
  Trash2,
  Stethoscope,
  Clock,
  Upload,
  RefreshCcw,
  Copy,
  Monitor,
  Gift,
  Pencil,
} from "lucide-react";
import { toast } from "sonner";
import {
  executeRouterAction,
  deleteNetworkDevice,
  allocateTunnel,
  deallocateTunnel,
  updateRouter,
} from "@/actions/network";
import { withStepUp } from "@/lib/stepUp";
import { RouterTelemetryDrawer } from "./RouterTelemetryDrawer";
import { DiagnoseHealthModal } from "./DiagnoseHealthModal";
import CompensateOutageModal from "./CompensateOutageModal";
import type {
  DiagnoseDetails,
  RouterAction,
} from "@/lib/types/network-router";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

export interface RouterActionsRow {
  /** network_device.id (string) — used for interfaces + delete + tunnels. */
  id: string;
  /** network_routers.idxno — used for telemetry + remote actions. */
  routerId?: number;
  name: string;
  model?: string;
  status?: string;
  managementIp?: string;
  vpnIp?: string;
  winboxTunnelAddress?: string | null;
  webConsoleUrl?: string | null;
  tunnelExpiresAt?: string | null;
}

type Tab = "vitals" | "interfaces" | "sessions";

const MENU_WIDTH = 252; // px; keeps right-edge alignment consistent

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
 * Commands: telemetry drawer (Vitals/Interfaces/Sessions), Track 1
 * maintenance actions (Diagnose Health → modal, Sync Router Time, Sync
 * Hotspot Files, Reprovision Router), WinBox remote access (copy host:port,
 * winbox:// launch, WebConsole, regenerate port) and Refresh / Reboot /
 * Delete — all authenticated via session (never localStorage).
 */
export function RouterActionsDropdown({
  router,
}: {
  router: RouterActionsRow;
}) {
  const routerNav = useRouter();
  const [menuOpen, setMenuOpen] = useState(false);
  const [coords, setCoords] = useState<{
    top: number;
    left: number;
    openUpwards: boolean;
  } | null>(null);
  const [drawerTab, setDrawerTab] = useState<Tab | null>(null);
  const [diagnose, setDiagnose] = useState<{
    details: DiagnoseDetails | null;
    message: string;
  } | null>(null);
  const [busyAction, setBusyAction] = useState<RouterAction | "DELETE" | "TUNNEL_REGEN" | null>(null);
  const [copied, setCopied] = useState(false);
  const [compensateOpen, setCompensateOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [friendlyName, setFriendlyName] = useState(router.name);
  const [renameBusy, setRenameBusy] = useState(false);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const didClampRef = useRef(false);

  const deviceId = Number(router.id);
  const actionRouterId = Number(router.routerId) || Number(router.id);
  const hasNumericDevice = Number.isFinite(deviceId) && deviceId > 0;
  const winboxUri = router.winboxTunnelAddress
    ? `winbox://${router.winboxTunnelAddress}`
    : null;

  const closeMenu = useCallback(() => setMenuOpen(false), []);

  const toggleMenu = () => {
    if (menuOpen || !buttonRef.current) {
      closeMenu();
      return;
    }
    const rect = buttonRef.current.getBoundingClientRect();
    const left = rect.right - MENU_WIDTH;

    // ── Smart vertical flip ──
    // Estimate the open menu's height (now 11 items + dividers). If there
    // isn't enough viewport space below the anchor and there IS room above,
    // flip upward so the menu never gets cut off at the bottom of the window.
    const vh = window.innerHeight;
    const menuHeight = Math.min(280, vh * 0.85);
    const spaceBelow = vh - rect.bottom;
    const openUpwards = spaceBelow < menuHeight && rect.top > menuHeight;

    const top = openUpwards ? Math.max(8, rect.top - menuHeight - 6) : rect.bottom + 6;

    didClampRef.current = false;
    setCoords({ top, left, openUpwards });
    setMenuOpen(true);
  };

  // After the menu renders (portal), clamp coords so it stays on screen.
  // Runs once per open (guarded by didClampRef) so coords updates don't loop.
  useLayoutEffect(() => {
    if (!menuOpen || !coords || !menuRef.current) return;
    if (didClampRef.current) return;
    const menuRect = menuRef.current.getBoundingClientRect();
    const vh = window.innerHeight;
    let nextLeft = coords.left;
    if (menuRect.right > window.innerWidth - 8) {
      nextLeft -= menuRect.right - window.innerWidth + 8;
    }
    if (nextLeft < 8) nextLeft = 8;

    let nextTop = coords.top;
    if (menuRect.bottom > vh - 8) {
      // Even after flip (or when flipped up it still overflowed the top),
      // shift so the menu's bottom stays visible.
      nextTop -= menuRect.bottom - vh + 8;
    }
    if (nextTop < 8) nextTop = 8;

    if (nextLeft !== coords.left || nextTop !== coords.top) {
      didClampRef.current = true;
      setCoords((c) =>
        c ? { ...c, left: nextLeft, top: nextTop } : c
      );
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
    if (!Number.isFinite(actionRouterId) || actionRouterId <= 0) {
      toast.error("This row is a local placeholder — no backend router id to act on.");
      closeMenu();
      return;
    }
    setBusyAction(action);
    try {
      const run = (token?: string) => executeRouterAction(actionRouterId, { action }, token);
      // REPROVISION/REBOOT are high-blast-radius — step-up re-authentication.
      const res = action === "REPROVISION" || action === "REBOOT"
        ? await withStepUp(
            run,
            `${action} is a high-impact operation. Re-authenticate to continue.`
          )
        : await run();
      if (res.success && res.data) {
        if (action === "DIAGNOSE") {
          setDiagnose({ details: res.data.details ?? null, message: res.data.message });
          closeMenu();
          return;
        }
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
    if (!hasNumericDevice) {
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
      const res = await withStepUp(
        (token) => deleteNetworkDevice(deviceId, token),
        "Deleting a router is a high-impact operation. Re-authenticate to continue."
      );
      if (res.success) {
        toast.success(res.message || `${router.name} deleted successfully.`);
        closeMenu();
        setDrawerTab(null);
        // The routers page is a force-dynamic Server Component — a full
        // refresh re-fetches the inventory (no client callback needed).
        window.setTimeout(() => window.location.reload(), 450);
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

  const handleSaveRename = async () => {
    if (!Number.isFinite(actionRouterId) || actionRouterId <= 0) {
      toast.error("No backend router id to update.");
      return;
    }
    if (friendlyName.trim() === router.name) {
      setEditModalOpen(false);
      return;
    }
    setRenameBusy(true);
    try {
      // Use the existing updateRouter action with only routerName
      const res = await updateRouter(actionRouterId, {
        routerName: friendlyName.trim(),
        serviceMode: "",
        requiresAuthentication: false,
        routerUsername: "",
        routerPassword: "",
        hotspotEnabled: false,
        pppoeEnabled: false,
        freeInternet: false,
        monitoringEnabled: false,
      });
      if (res.success) {
        toast.success(`Router renamed to "${friendlyName.trim()}"`);
        routerNav.refresh(); // Re-fetch the routers table
      } else {
        toast.error(res.message || "Failed to rename router");
      }
    } catch {
      toast.error("Unexpected error renaming router");
    } finally {
      setRenameBusy(false);
      setEditModalOpen(false);
    }
  };

  const copyHostPort = async () => {
    if (!router.winboxTunnelAddress) {
      toast.error("No WinBox tunnel allocated for this router yet.");
      closeMenu();
      return;
    }
    try {
      await navigator.clipboard.writeText(router.winboxTunnelAddress);
      setCopied(true);
      toast.success(`WinBox host:port copied (${router.winboxTunnelAddress}).`);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      toast.error("Clipboard unavailable — copy the address manually.");
    }
    closeMenu();
  };

  const regenerateWinBoxPort = async () => {
    if (!hasNumericDevice) {
      toast.error("This row is a local placeholder — no backend device id to regenerate.");
      closeMenu();
      return;
    }
    setBusyAction("TUNNEL_REGEN");
    try {
      await deallocateTunnel(deviceId);
      const res = await allocateTunnel(deviceId);
      if (res.success) {
        toast.success("WinBox tunnel re-allocated with a fresh port.");
        routerNav.refresh();
      } else {
        toast.error(res.message || "Failed to re-allocate the tunnel.");
      }
    } catch {
      toast.error("Unexpected error regenerating the WinBox tunnel.");
    } finally {
      setBusyAction(null);
      closeMenu();
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
      className={`rounded-xl border border-border bg-popover shadow-2xl py-1 text-sm text-popover-foreground max-h-[85vh] overflow-y-auto ${
        coords.openUpwards
          ? "origin-bottom-right animate-in slide-in-from-bottom-2 duration-150"
          : "origin-top-right animate-in slide-in-from-top-2 duration-150"
      }`}
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

      <button
        type="button"
        role="menuitem"
        onClick={() => { setFriendlyName(router.name); setEditModalOpen(true); }}
        className="flex items-center w-full px-4 py-2.5 hover:bg-muted hover:text-foreground gap-2.5 transition text-left"
      >
        <Pencil className="h-4 w-4 text-amber-500" />
        <span>Edit / Rename Router</span>
      </button>

      <div className="h-px bg-border my-1" />

      <button
        type="button"
        role="menuitem"
        disabled={busyAction === "DIAGNOSE"}
        onClick={() => void runAction("DIAGNOSE")}
        className="flex items-center w-full px-4 py-2.5 hover:bg-muted hover:text-foreground gap-2.5 transition text-left disabled:opacity-50"
      >
        <Stethoscope className={`h-4 w-4 ${busyAction === "DIAGNOSE" ? "animate-pulse" : ""} text-cyan-500`} />
        Diagnose Health
      </button>

      <button
        type="button"
        role="menuitem"
        disabled={busyAction === "SYNC_ROUTER_TIME"}
        onClick={() => void runAction("SYNC_ROUTER_TIME")}
        className="flex items-center w-full px-4 py-2.5 hover:bg-muted hover:text-foreground gap-2.5 transition text-left disabled:opacity-50"
      >
        <Clock className={`h-4 w-4 ${busyAction === "SYNC_ROUTER_TIME" ? "animate-pulse" : ""} text-emerald-500`} />
        Sync Router Time
      </button>

      <button
        type="button"
        role="menuitem"
        disabled={busyAction === "SYNC_HOTSPOT_FILES"}
        onClick={() => void runAction("SYNC_HOTSPOT_FILES")}
        className="flex items-center w-full px-4 py-2.5 hover:bg-muted hover:text-foreground gap-2.5 transition text-left disabled:opacity-50"
      >
        <Upload className={`h-4 w-4 ${busyAction === "SYNC_HOTSPOT_FILES" ? "animate-pulse" : ""} text-blue-500`} />
        Sync Hotspot Files
      </button>

      <button
        type="button"
        role="menuitem"
        disabled={busyAction === "REPROVISION"}
        onClick={() => void runAction("REPROVISION")}
        className="flex items-center w-full px-4 py-2.5 hover:bg-muted hover:text-foreground gap-2.5 transition text-left disabled:opacity-50"
      >
        <RefreshCcw className={`h-4 w-4 ${busyAction === "REPROVISION" ? "animate-spin" : ""} text-teal-500`} />
        Reprovision Router
      </button>

      <div className="h-px bg-border my-1" />

      {router.winboxTunnelAddress && (
        <button
          type="button"
          role="menuitem"
          onClick={() => void copyHostPort()}
          className="flex items-center w-full px-4 py-2.5 hover:bg-muted hover:text-foreground gap-2.5 transition text-left"
        >
          {copied ? (
            <Activity className="h-4 w-4 text-emerald-500" />
          ) : (
            <Copy className="h-4 w-4 text-purple-500" />
          )}
          Copy WinBox host:port
        </button>
      )}

      {winboxUri && (
        <a
          href={winboxUri}
          role="menuitem"
          className="flex items-center w-full px-4 py-2.5 hover:bg-muted hover:text-foreground gap-2.5 transition text-left text-purple-500"
        >
          <ExternalLink className="h-4 w-4" />
          Open in WinBox
        </a>
      )}

      {router.webConsoleUrl && (
        <a
          href={router.webConsoleUrl}
          target="_blank"
          rel="noreferrer"
          role="menuitem"
          className="flex items-center w-full px-4 py-2.5 hover:bg-muted hover:text-foreground gap-2.5 transition text-left"
        >
          <Monitor className="h-4 w-4 text-amber-500" />
          Open WebConsole
        </a>
      )}

      {hasNumericDevice && (
        <button
          type="button"
          role="menuitem"
          onClick={() => {
            setCompensateOpen(true);
            closeMenu();
          }}
          className="flex items-center w-full px-4 py-2.5 hover:bg-muted hover:text-foreground gap-2.5 transition text-left"
        >
          <Gift className="h-4 w-4 text-emerald-500" />
          Compensate Subscribers
        </button>
      )}

      {hasNumericDevice && (
        <button
          type="button"
          role="menuitem"
          disabled={busyAction === "TUNNEL_REGEN"}
          onClick={() => void regenerateWinBoxPort()}
          className="flex items-center w-full px-4 py-2.5 hover:bg-muted hover:text-foreground gap-2.5 transition text-left disabled:opacity-50"
        >
          <RefreshCw className={`h-4 w-4 ${busyAction === "TUNNEL_REGEN" ? "animate-spin" : ""} text-purple-500`} />
          Regenerate WinBox Port
        </button>
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

      {diagnose && (
        <DiagnoseHealthModal
          routerName={router.name}
          details={diagnose.details}
          message={diagnose.message}
          onClose={() => setDiagnose(null)}
        />
      )}

      {compensateOpen && (
        <CompensateOutageModal
          open={compensateOpen}
          onClose={() => setCompensateOpen(false)}
          deviceId={Number.isFinite(deviceId) && deviceId > 0 ? deviceId : undefined}
          targetLabel={router.name}
        />
      )}

      <Dialog open={editModalOpen} onOpenChange={setEditModalOpen}>
        <DialogContent className="bg-zinc-900 border-zinc-800 text-white sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Edit Router Identity</DialogTitle>
            <DialogDescription className="text-zinc-400 text-xs">
              Update the human-friendly display name for this router across all dashboards.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-3">
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-zinc-300">Friendly Display Name</label>
              <Input
                value={friendlyName}
                onChange={(e) => setFriendlyName(e.target.value)}
                placeholder="e.g. Adrinold Ukunda B"
                className="bg-black/50 border-zinc-700 text-white text-sm"
              />
              <p className="text-[11px] text-zinc-500">
                Machine Asset Tag: <span className="font-mono text-zinc-400">{router.name}</span>
              </p>
            </div>
          </div>

          <DialogFooter>
            <Button variant="ghost" size="sm" onClick={() => setEditModalOpen(false)}>
              Cancel
            </Button>
            <Button
              size="sm"
              className="bg-amber-500 hover:bg-amber-600 text-black font-semibold text-xs"
              onClick={handleSaveRename}
              disabled={renameBusy || friendlyName.trim() === router.name}
            >
              {renameBusy ? "Saving..." : "Save Changes"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}